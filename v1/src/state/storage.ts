import type { Project } from '../document/types';

/** All persistence goes through here and every access is guarded: storage can be missing or full. */
const P = 'atomattr-studio:project:';
const INDEX = 'atomattr-studio:index';
const LAYOUT = 'atomattr-studio:layout';
const THEME = 'atomattr-studio:theme';

const read = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string): boolean => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
const drop = (key: string) => { try { localStorage.removeItem(key); } catch { /* ignore */ } };

export type RecentEntry = { id: string; name: string; kind: Project['kind']; updatedAt: number; pages: number; thumb?: string };

export function listRecents(): RecentEntry[] {
  const raw = read(INDEX); if (!raw) return [];
  try { return (JSON.parse(raw) as RecentEntry[]).sort((a, b) => b.updatedAt - a.updatedAt); } catch { return []; }
}
export function saveProject(project: Project, thumb?: string): boolean {
  const ok = write(P + project.id, JSON.stringify(project));
  if (!ok) return false;
  const rest = listRecents().filter(r => r.id !== project.id);
  const prev = listRecents().find(r => r.id === project.id);
  rest.unshift({ id: project.id, name: project.name, kind: project.kind, updatedAt: Date.now(), pages: project.pages.length, thumb: thumb ?? prev?.thumb });
  write(INDEX, JSON.stringify(rest.slice(0, 30)));
  return true;
}
export function loadProject(id: string): Project | null {
  const raw = read(P + id); if (!raw) return null;
  try { const p = JSON.parse(raw) as Project; return p && p.version === 1 && Array.isArray(p.pages) && p.pages.length ? p : null; } catch { return null; }
}
export function deleteProject(id: string) { drop(P + id); write(INDEX, JSON.stringify(listRecents().filter(r => r.id !== id))); }

export const parseProjectFile = (text: string): Project | null => {
  try { const p = JSON.parse(text) as Project; return p && p.version === 1 && Array.isArray(p.pages) && p.pages.length ? p : null; } catch { return null; }
};

export const loadTheme = (): 'light' | 'dark' => {
  const v = read(THEME);
  if (v === 'light' || v === 'dark') return v;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
};
export const saveTheme = (t: 'light' | 'dark') => { write(THEME, t); };

export function loadLayout<T>(fallback: T): T { const raw = read(LAYOUT); if (!raw) return fallback; try { const saved=JSON.parse(raw);const base=fallback as any;return { ...base, ...saved, ...(base.code?{code:{...base.code,...(saved.code||{})}}:{}) } as T; } catch { return fallback; } }
export const saveLayout = (layout: unknown) => { write(LAYOUT, JSON.stringify(layout)); };
export const clearLayout = () => drop(LAYOUT);
