import type { Project } from './types';

export type AssetNames = Map<string, string>;
/** Stable export file names for every project asset. Shared by the canvas, CSS and markup exporters. */
export const assetNamesFor = (project?: Pick<Project, 'assets'> | null): AssetNames => {
  const used = new Set<string>(); const map: AssetNames = new Map();
  const assets = project?.assets || [];
  assets.forEach((a, i) => {
    const ext = (a.mime.split('/')[1] || 'png').replace('svg+xml', 'svg').replace('jpeg', 'jpg');
    const base = (a.name || `image-${i + 1}`).replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() || `image-${i + 1}`;
    let n = base; let k = 2; while (used.has(n)) n = `${base}-${k++}`; used.add(n);
    map.set(a.id, `assets/${n}.${ext}`);
  });
  return map;
};

const mimeOf = (url: string) => /^data:([^;,]+)/i.exec(url)?.[1]?.toLowerCase() || 'image/png';

/**
 * Exports only write files for project assets. Pictures that carry a data URL but no asset (pasted or imported nodes)
 * would otherwise point at a file that does not exist, so they are registered as assets first. Returns the same
 * project object when nothing needed fixing.
 */
export function withAutoAssets<P extends Project>(project: P): P {
  const assets = [...project.assets]; let changed = false; let n = 0;
  const fix = (node: any): any => {
    let out = node;
    if (node.type === 'image' && typeof node.src === 'string' && node.src.startsWith('data:') && !(node.assetId && assets.some(a => a.id === node.assetId))) {
      let a = assets.find(x => x.dataUrl === node.src);
      if (!a) { n += 1; a = { id: `auto-${n}`, name: `${(node.alt || node.name || 'image').toString().trim() || 'image'}.${mimeOf(node.src).split('/')[1]?.replace('svg+xml', 'svg') || 'png'}`, mime: mimeOf(node.src), dataUrl: node.src }; assets.push(a); }
      out = { ...node, assetId: a.id }; changed = true;
    }
    if (node.children?.length) { const kids = node.children.map(fix); if (kids.some((k: any, i: number) => k !== node.children[i])) { out = { ...out, children: kids }; changed = true; } }
    return out;
  };
  const pages = project.pages.map(pg => { const root = fix(pg.root); return root === pg.root ? pg : { ...pg, root }; });
  return changed ? { ...project, pages, assets } : project;
}

/** Re-points every `assets/...` reference in generated code, e.g. `../` for a sub-folder or `/` for a Vite public folder. */
export const rebaseAssets = (code: string, prefix: string) => code.replace(/(["'(=])assets\//g, `$1${prefix}assets/`);

/** For previews: swaps each exact `assets/file` reference for its embedded data, so a standalone page shows the right pictures. */
export function inlineAssets(code: string, project: Project): string {
  const names = assetNamesFor(project); const byPath = new Map<string, string>();
  project.assets.forEach(a => { const path = names.get(a.id); if (path) byPath.set(path, a.dataUrl); });
  return code.replace(/(["'(=])(assets\/[^"')\s]+)/g, (m, lead, path) => (byPath.has(path) ? `${lead}${byPath.get(path)}` : m));
}
