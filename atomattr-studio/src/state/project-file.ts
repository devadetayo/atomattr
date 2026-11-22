import JSZip from 'jszip';
import type { Project } from '../document/types';
import { parseProjectFile } from './storage';
import { isCompressible, readAst, writeAst, type AstInput } from './ast';

const PACKAGE_TYPE = 'atomattr-project';
const PACKAGE_VERSION = 1;
const DEFAULT_HISTORY = 'history.json';

export type ProjectHistory = Record<string, unknown>;

export type ProjectPackageMeta = {
  type: typeof PACKAGE_TYPE;
  version: number;
  app: 'atomattr-studio';
  createdAt: number;
  updatedAt: number;
  projectId: string;
  projectName: string;
  assets: Array<{ id: string; name: string; mime: string; path: string; size: number }>;
};

export type ProjectPackageData = {
  project: Project;
  metadata: ProjectPackageMeta;
  history?: ProjectHistory;
};

const toSafeFileStem = (value: string) => (value || 'project').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'project';
const toDataUri = (bytes: Uint8Array, mime = 'application/octet-stream') => `data:${mime};base64,${letToBase64(bytes)}`;
const letToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};
const fromDataUri = (url: string): Uint8Array | null => {
  if (!url.startsWith('data:')) return null;
  const comma = url.indexOf(',');
  if (comma < 0) return null;
  const header = url.slice(0, comma);
  const base64 = url.slice(comma + 1);
  const matches = /;base64/i.test(header);
  const raw = matches ? atob(base64 || '') : decodeURIComponent(base64 || '');
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const walkProjectNodes = (project: Project, onNode: (node: any) => void) => {
  for (const page of project.pages) {
    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return;
      onNode(node);
      if (Array.isArray(node.children)) node.children.forEach(visit);
    };
    visit(page.root);
  }
};

const rewriteProjectAssetIds = (project: Project, map: Map<string, string>) => {
  const next = deepClone(project);
  walkProjectNodes(next, (node) => {
    if (node.assetId && map.has(node.assetId)) node.assetId = map.get(node.assetId)!;
  });
  return next;
};

const dedupeProjectAssets = (project: Project) => {
  const assetMap = new Map<string, string>();
  const assetFiles: Array<{ id: string; name: string; mime: string; dataUrl: string; path: string }> = [];
  const seen = new Set<string>();

  const chooseAssetId = (asset: { id: string; dataUrl: string }) => {
    if (!asset.dataUrl) return asset.id;
    if (seen.has(asset.dataUrl)) return assetMap.get(asset.dataUrl) ?? asset.id;
    seen.add(asset.dataUrl);
    assetMap.set(asset.dataUrl, asset.id);
    return asset.id;
  };

  for (const asset of project.assets || []) {
    const canonicalId = chooseAssetId(asset);
    if (!asset.dataUrl) {
      assetFiles.push({ id: canonicalId, name: asset.name, mime: asset.mime, dataUrl: '', path: `assets/${canonicalId}-${toSafeFileStem(asset.name)}` });
      continue;
    }
    const noExt = asset.name.split('.').slice(0, -1).join('.') || asset.name;
    const extension = asset.name.includes('.') ? `.${asset.name.split('.').pop() ?? 'bin'}` : '';
    const path = `assets/${canonicalId}-${toSafeFileStem(noExt)}${extension}`;
    assetFiles.push({ id: canonicalId, name: asset.name, mime: asset.mime, dataUrl: asset.dataUrl, path });
  }

  const uniqueAssets = assetFiles.reduce<Array<{ id: string; name: string; mime: string; dataUrl?: string }>>((out, asset) => {
    const existing = out.find(item => item.id === asset.id || item.dataUrl === asset.dataUrl);
    if (existing) return out;
    out.push({ id: asset.id, name: asset.name, mime: asset.mime, dataUrl: asset.dataUrl || undefined });
    return out;
  }, []);

  const assetIdMap = new Map<string, string>();
  for (const asset of project.assets || []) {
    const canonicalId = asset.dataUrl ? (assetMap.get(asset.dataUrl) ?? asset.id) : asset.id;
    assetIdMap.set(asset.id, canonicalId);
  }

  const nextProject = rewriteProjectAssetIds(project, assetIdMap);
  nextProject.assets = uniqueAssets.map(asset => ({ id: asset.id, name: asset.name, mime: asset.mime })) as unknown as Project['assets'];
  return { nextProject, assetFiles };
};

const maybeProject = (value: unknown): value is Project => {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<Project>;
  return project.version === 1 && Array.isArray(project.pages) && typeof project.id === 'string';
};

export function readLegacyProjectRecords(): Array<{ id: string; name: string; kind: Project['kind']; updatedAt: number; source: 'localStorage' }> {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem('atomattr-studio:index');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ id: string; name: string; kind: Project['kind']; updatedAt: number }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(entry => ({ ...entry, source: 'localStorage' as const })).filter(entry => typeof entry.id === 'string' && typeof entry.name === 'string');
  } catch {
    return [];
  }
}

export function exportLegacyProjectRecords(): Blob {
  const records = readLegacyProjectRecords();
  return new Blob([JSON.stringify({ exportedAt: Date.now(), records }, null, 2)], { type: 'application/json' });
}

export async function createProjectPackage(project: Project, history?: ProjectHistory): Promise<Blob> {
  const { nextProject, assetFiles } = dedupeProjectAssets(project);
  const enc = new TextEncoder();
  const metadata: ProjectPackageMeta = {
    type: PACKAGE_TYPE,
    version: PACKAGE_VERSION,
    app: 'atomattr-studio',
    createdAt: nextProject.createdAt || Date.now(),
    updatedAt: nextProject.updatedAt || Date.now(),
    projectId: nextProject.id,
    projectName: nextProject.name,
    assets: assetFiles.map(asset => ({ id: asset.id, name: asset.name, mime: asset.mime, path: asset.path, size: asset.dataUrl ? fromDataUri(asset.dataUrl)?.length ?? 0 : 0 })),
  };
  const files: AstInput[] = [{ path: 'project.json', mime: 'application/json', bytes: enc.encode(JSON.stringify(nextProject)), compress: true }];
  if (history && typeof history === 'object') files.push({ path: DEFAULT_HISTORY, mime: 'application/json', bytes: enc.encode(JSON.stringify(history)), compress: true });
  for (const asset of assetFiles) {
    if (!asset.dataUrl) continue;
    const bytes = fromDataUri(asset.dataUrl);
    if (bytes) files.push({ path: asset.path, mime: asset.mime || 'application/octet-stream', bytes, compress: isCompressible(asset.mime || '') });
  }
  return writeAst(metadata as unknown as Record<string, unknown>, files);
}

/** Reads the native .ast container; falls back to the zip-based .ast files written by earlier builds. */
export async function readProjectPackage(blob: Blob): Promise<ProjectPackageData | null> {
  if (!blob || typeof blob.arrayBuffer !== 'function') return null;
  const ast = await readAst(blob);
  if (ast) {
    try {
      const metadata = ast.index as unknown as Partial<ProjectPackageMeta>;
      const projectBytes = ast.entries.get('project.json');
      if (!projectBytes) return null;
      const project = JSON.parse(new TextDecoder().decode(projectBytes)) as Project;
      if (metadata.type !== PACKAGE_TYPE || metadata.version !== PACKAGE_VERSION || !maybeProject(project)) return null;
      const assets = (Array.isArray(metadata.assets) ? metadata.assets : []).flatMap(entry => {
        const bytes = ast.entries.get(entry.path); if (!bytes) return [];
        const mime = entry.mime || 'application/octet-stream';
        return [{ id: entry.id, name: entry.name || entry.id, mime, dataUrl: toDataUri(bytes, mime) }];
      });
      const out: ProjectPackageData = { project: { ...project, assets }, metadata: metadata as ProjectPackageMeta };
      const historyBytes = ast.entries.get(DEFAULT_HISTORY);
      if (historyBytes) { try { out.history = JSON.parse(new TextDecoder().decode(historyBytes)) as ProjectHistory; } catch { /* history is optional */ } }
      return out;
    } catch { return null; }
  }
  return readLegacyZipPackage(blob);
}

async function readLegacyZipPackage(blob: Blob): Promise<ProjectPackageData | null> {
  try {
    const zip = await JSZip.loadAsync(blob);
    const metadataFile = zip.file('metadata.json');
    const projectFile = zip.file('project.json');
    if (!metadataFile || !projectFile) return null;
    const metadata = JSON.parse(await metadataFile.async('string')) as Partial<ProjectPackageMeta>;
    const project = JSON.parse(await projectFile.async('string')) as Project;
    if (metadata.type !== PACKAGE_TYPE || metadata.version !== PACKAGE_VERSION || !maybeProject(project)) return null;
    const assets = await Promise.all((Array.isArray(metadata.assets) ? metadata.assets : []).map(async entry => {
      const file = zip.file(entry.path); if (!file) return null;
      const mime = entry.mime || 'application/octet-stream';
      return { id: entry.id, name: entry.name || entry.id, mime, dataUrl: toDataUri(await file.async('uint8array'), mime) };
    }));
    const out: ProjectPackageData = { project: { ...project, assets: assets.filter((a): a is NonNullable<typeof a> => !!a) }, metadata: metadata as ProjectPackageMeta };
    const historyFile = zip.file(DEFAULT_HISTORY);
    if (historyFile) { try { out.history = JSON.parse(await historyFile.async('string')) as ProjectHistory; } catch { /* optional */ } }
    return out;
  } catch { return null; }
}

export async function readProjectFile(blob: Blob): Promise<Project | null> {
  const archive = await readProjectPackage(blob);
  if (archive) return archive.project;
  const text = await blob.text();
  return parseProjectFile(text);
}

const AST_TYPE = { description: 'AtomAttr Studio project', accept: { 'application/x-atomattr-studio': ['.ast'] } };

async function chooseOpenFile() {
  if (typeof window === 'undefined') return null;
  if ('showOpenFilePicker' in window && typeof (window as any).showOpenFilePicker === 'function') {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({ multiple: false, types: [AST_TYPE] });
      return fileHandle.getFile ? await fileHandle.getFile() : null;
    } catch (e: any) {
      if (e?.name === 'AbortError') return null; // cancelled: do not fall through to a second dialog
    }
  }
  return new Promise<File | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ast,.zip,.json';
    input.onchange = () => resolve(input.files?.[0] || null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/** File handles are remembered per project, so saving again overwrites the same .ast on disk. */
const handles = new Map<string, any>();

async function chooseSaveTarget(project: Project, name: string, saveAs: boolean) {
  const known = handles.get(project.id);
  if (known && !saveAs) return known;
  if (typeof window === 'undefined' || !('showSaveFilePicker' in window) || typeof (window as any).showSaveFilePicker !== 'function') return null;
  try {
    const handle = await (window as any).showSaveFilePicker({ suggestedName: name, types: [AST_TYPE] });
    handles.set(project.id, handle);
    return handle;
  } catch (e: any) {
    return e?.name === 'AbortError' ? 'cancelled' : null;
  }
}

/** Writes the project as a single .ast file. Returns false if the user cancelled or the write failed. */
export async function saveProjectAsArchive(project: Project, history?: ProjectHistory, opts: { saveAs?: boolean } = {}): Promise<boolean> {
  const blob = await createProjectPackage(project, history);
  const name = `${toSafeFileStem(project.name || 'project')}.ast`;
  const handle = await chooseSaveTarget(project, name, !!opts.saveAs);
  if (handle === 'cancelled') return false;
  if (handle && typeof handle.createWritable === 'function') {
    try {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch {
      handles.delete(project.id);
      return false;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export async function openProjectFromDisk(): Promise<Project | null> {
  const file = await chooseOpenFile();
  if (!file) return null;
  return readProjectFile(file);
}

export const openProjectFromFile = (file: Blob) => readProjectFile(file);

export function projectFileName(project: Project) {
  return `${toSafeFileStem(project.name || 'project')}.ast`;
}

export function projectJsonName(project: Project) {
  return `${toSafeFileStem(project.name || 'project')}.atomattr.json`;
}

export function createProjectBlob(project: Project) {
  return new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
}

export async function importProjectZip(blob: Blob): Promise<Project | null> {
  return readProjectFile(blob);
}

export function normalizeProjectForStorage(project: Project): Project {
  const next = deepClone(project);
  next.assets = (next.assets || []).map(asset => ({ ...asset, dataUrl: asset.dataUrl || '' }));
  return next;
}
