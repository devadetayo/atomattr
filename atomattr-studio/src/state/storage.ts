import type { Project } from '../document/types';

/**
 * Projects and the recents list live in IndexedDB (hundreds of MB of quota) instead of localStorage (about 5 MB, which
 * a couple of image assets or thumbnails filled). Everything is mirrored in memory after initStorage(), so the rest of the
 * app keeps reading synchronously. localStorage is only used for the tiny theme/layout values below.
 */
const LEGACY_P = 'atomattr-studio:project:';
const LEGACY_INDEX = 'atomattr-studio:index';
const LAYOUT = 'atomattr-studio:layout';
const THEME = 'atomattr-studio:theme';
const ACCENT = 'atomattr-studio:accent';
const DB_NAME = 'atomattr-studio'; const DB_VERSION = 1; const PROJECTS = 'projects'; const RECENTS = 'recents';

const read = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string): boolean => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
const drop = (key: string) => { try { localStorage.removeItem(key); } catch { /* ignore */ } };

export type RecentEntry = { id: string; name: string; kind: Project['kind']; updatedAt: number; pages: number; thumb?: string };

const MAX_THUMB_CHARS = 120_000;
const MAX_RECENT_ENTRIES = 200;
const MAX_CACHED_PROJECTS = 20;
const projects = new Map<string, Project>();
let recents: RecentEntry[] = [];
let db: IDBDatabase | null = null;
export type StorageMode = 'indexeddb' | 'memory';
let mode: StorageMode = 'memory';
export const storageMode = (): StorageMode => mode;

let onPersistError: (() => void) | null = null;
export const setPersistErrorHandler = (fn: (() => void) | null) => { onPersistError = fn; };

const req = <T,>(r: IDBRequest<T>) => new Promise<T>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
const done = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains(PROJECTS)) d.createObjectStore(PROJECTS, { keyPath: 'id' }); if (!d.objectStoreNames.contains(RECENTS)) d.createObjectStore(RECENTS, { keyPath: 'id' }); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('blocked'));
  });
}

/** Writes are queued so two quick saves can never land out of order. */
let queue: Promise<unknown> = Promise.resolve();
function persist(job: (d: IDBDatabase) => Promise<void>) {
  if (!db) return;
  const d = db;
  queue = queue.then(() => job(d)).catch(() => { onPersistError?.(); });
}

const sanitizeThumb = (thumb?: string) => (typeof thumb === 'string' && thumb.length <= MAX_THUMB_CHARS ? thumb : undefined);
const entryFor = (project: Project, thumb?: string): RecentEntry => ({ id: project.id, name: project.name, kind: project.kind, updatedAt: Date.now(), pages: project.pages.length, thumb: sanitizeThumb(thumb) });

/**
 * Reads only the small recents index at startup (names, counts, thumbnails). Project bodies, which can hold large images,
 * are fetched one at a time when opened. Never throws; without IndexedDB the app still works, just without persistence.
 */
export async function initStorage(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const opened = await Promise.race([openDb(), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
    db = opened; mode = 'indexeddb';
    const tx = db.transaction([RECENTS], 'readonly');
    recents = (await req(tx.objectStore(RECENTS).getAll()) as RecentEntry[]).filter(r => r && typeof r.id === 'string');
  } catch { db = null; mode = 'memory'; }
}

/** Fetch a saved project body on demand (cached after the first read). */
export async function loadProjectAsync(id: string): Promise<Project | null> {
  const cached = loadProject(id); if (cached) return cached;
  if (!db) return null;
  try {
    const row = await req(db.transaction([PROJECTS], 'readonly').objectStore(PROJECTS).get(id)) as { project?: Project } | undefined;
    if (row?.project) { projects.set(id, row.project); return loadProject(id); }
  } catch { /* fall through */ }
  return null;
}

/**
 * Moves projects written by earlier builds out of localStorage, one at a time, after the app is already on screen.
 * A legacy copy is only removed once its IndexedDB copy is confirmed written.
 */
export async function migrateLegacyStorage(): Promise<boolean> {
  if (!db) return false;
  const raw = read(LEGACY_INDEX); if (!raw) return false;
  let list: RecentEntry[] = [];
  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) list = parsed; } catch { drop(LEGACY_INDEX); return false; }
  let moved = false;
  for (const entry of list) {
    if (!entry || typeof entry.id !== 'string') continue;
    const text = read(LEGACY_P + entry.id);
    if (!text) continue;
    if (recents.some(r => r.id === entry.id)) { drop(LEGACY_P + entry.id); continue; }
    const project = text.length < 30_000_000 ? parseProjectFile(text) : null; if (!project) continue;
    const thumb = sanitizeThumb(entry.thumb);
    try {
      const tx = db.transaction([PROJECTS, RECENTS], 'readwrite');
      const rec: RecentEntry = { id: project.id, name: project.name, kind: project.kind, updatedAt: Number(entry.updatedAt) || Date.now(), pages: project.pages.length, thumb };
      tx.objectStore(PROJECTS).put({ id: project.id, project }); tx.objectStore(RECENTS).put(rec);
      await done(tx);
      recents.push(rec); drop(LEGACY_P + entry.id); moved = true;
    } catch { return moved; }
    await new Promise(r => setTimeout(r, 0)); // yield between projects so the UI never stalls
  }
  if (list.every(e => !read(LEGACY_P + e?.id))) drop(LEGACY_INDEX);
  return moved;
}

export function listRecents(): RecentEntry[] { return [...recents].sort((a, b) => b.updatedAt - a.updatedAt); }

export function saveProject(project: Project, thumb?: string): boolean {
  const prev = recents.find(r => r.id === project.id);
  const entry = entryFor(project, thumb ?? prev?.thumb);
  projects.set(project.id, project);
  recents = [entry, ...recents.filter(r => r.id !== project.id)].sort((a, b) => b.updatedAt - a.updatedAt);
  // Old projects leave only the in-memory cache; their IndexedDB copy stays until the user deletes the project, so a busy
  // workspace never silently loses work. The recents list itself is only trimmed at a much higher cap.
  recents.slice(MAX_CACHED_PROJECTS).forEach(r => projects.delete(r.id));
  const dropped = recents.slice(MAX_RECENT_ENTRIES).map(r => r.id);
  recents = recents.slice(0, MAX_RECENT_ENTRIES);
  persist(async d => {
    const tx = d.transaction([PROJECTS, RECENTS], 'readwrite');
    tx.objectStore(PROJECTS).put({ id: project.id, project }); tx.objectStore(RECENTS).put(entry);
    dropped.forEach(id => tx.objectStore(RECENTS).delete(id));
    await done(tx);
  });
  return true;
}
export function loadProject(id: string): Project | null {
  const p = projects.get(id);
  return p && p.version === 1 && Array.isArray(p.pages) && p.pages.length ? p : null;
}
export function deleteProject(id: string) {
  projects.delete(id); recents = recents.filter(r => r.id !== id);
  persist(async d => { const tx = d.transaction([PROJECTS, RECENTS], 'readwrite'); tx.objectStore(PROJECTS).delete(id); tx.objectStore(RECENTS).delete(id); await done(tx); });
}

export const parseProjectFile = (text: string): Project | null => {
  try { const p = JSON.parse(text) as Project; return p && p.version === 1 && Array.isArray(p.pages) && p.pages.length ? p : null; } catch { return null; }
};

export const loadTheme = (): 'light' | 'dark' => {
  const v = read(THEME);
  if (v === 'light' || v === 'dark') return v;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
};
export const saveTheme = (t: 'light' | 'dark') => { write(THEME, t); };
export const loadAccent = (): string => { const v = read(ACCENT); return v && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : '#4f46e5'; };
export const saveAccent = (hex: string) => { write(ACCENT, hex.toLowerCase()); };

function deepMerge<T>(base: T, patch: any): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return base;
  const out = { ...(base as any) };
  for (const key of Object.keys(patch)) {
    const baseValue = (base as any)?.[key];
    const patchValue = patch[key];
    if (baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue) && patchValue && typeof patchValue === 'object' && !Array.isArray(patchValue)) {
      out[key] = deepMerge(baseValue, patchValue);
    } else {
      out[key] = patchValue;
    }
  }
  return out as T;
}

export function loadLayout<T>(fallback: T): T {
  const raw = read(LAYOUT); if (!raw) return fallback;
  try {
    const saved = JSON.parse(raw);
    const merged = deepMerge(fallback, saved) as any;
    if (merged?.palette && typeof merged.palette === 'object') {
      merged.palette = { ...((fallback as any)?.palette || {}), ...merged.palette, visible: true, open: merged.palette.open ?? true, dx: typeof merged.palette.dx === 'number' ? merged.palette.dx : 0 };
    }
    return merged as T;
  } catch { return fallback; }
}
export const saveLayout = (layout: unknown) => { write(LAYOUT, JSON.stringify(layout)); };
export const clearLayout = () => drop(LAYOUT);
