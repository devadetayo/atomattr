import type { Asset, Project, Snapshot } from '../document/types';

/** Version history helpers. Pure functions so they can be tested without the editor store. */
export const AUTO_INTERVAL_MS = 10 * 60 * 1000;
export const MAX_AUTO_SNAPSHOTS = 10;

const lastAuto = (project: Project) => (project.snapshots || []).filter(s => s.auto).reduce((t, s) => Math.max(t, s.createdAt), 0);

/** True when the project has no automatic restore point from the last interval. */
export const shouldAutoSnapshot = (project: Project, now: number) => now - lastAuto(project) >= AUTO_INTERVAL_MS;

/** Automatic snapshots leave out image data (assets are kept in the live project and merged back on restore), so history does not multiply large images. */
export function makeSnapshot(project: Project, name: string, id: string, now: number, auto = false): Snapshot {
  const base = { ...project, snapshots: undefined } as Project;
  const data = JSON.stringify(auto ? { ...base, assets: [] } : base);
  return { id, name: name.trim() || `Snapshot ${new Date(now).toLocaleString()}`, createdAt: now, data, ...(auto ? { auto: true } : {}) };
}

/** Adds an automatic snapshot and drops the oldest automatic ones beyond the cap. Named snapshots are never dropped. */
export function addAutoSnapshot(project: Project, id: string, now: number): Project {
  const snap = makeSnapshot(project, `Auto · ${new Date(now).toLocaleString()}`, id, now, true);
  const all = [...(project.snapshots || []), snap];
  const autos = all.filter(s => s.auto).sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_AUTO_SNAPSHOTS).map(s => s.id);
  return { ...project, snapshots: all.filter(s => !s.auto || autos.includes(s.id)) };
}

/** Rebuilds a project from a snapshot. Keeps the current snapshot list and every current asset the snapshot does not carry. */
export function restoreFromSnapshot(current: Project, snap: Snapshot): Project | null {
  try {
    const restored = JSON.parse(snap.data) as Project;
    if (!restored || !Array.isArray(restored.pages) || !restored.pages.length) return null;
    const own = new Set((restored.assets || []).map((a: Asset) => a.id));
    const assets = [...(restored.assets || []), ...current.assets.filter(a => !own.has(a.id))];
    return { ...restored, assets, snapshots: current.snapshots };
  } catch { return null; }
}

/* ---------- compare ---------- */
export type SnapshotDiff = { lines: string[]; changed: boolean };
type Flat = Map<string, { name: string; sig: string; page: string }>;
const flatten = (p: Project): Flat => {
  const out: Flat = new Map();
  const walk = (n: any, page: string) => { const { children, ...rest } = n; out.set(n.id, { name: n.name, sig: JSON.stringify(rest), page }); (children || []).forEach((c: any) => walk(c, page)); };
  p.pages.forEach(pg => walk(pg.root, pg.name)); return out;
};
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
/** A plain-language summary of what changed between a saved version and now. */
export function diffProjects(before: Project, after: Project): SnapshotDiff {
  const lines: string[] = []; const a = flatten(before), b = flatten(after);
  const added = [...b].filter(([id]) => !a.has(id)), removed = [...a].filter(([id]) => !b.has(id));
  const changed = [...b].filter(([id, v]) => a.has(id) && a.get(id)!.sig !== v.sig);
  const list = (rows: [string, { name: string; page: string }][]) => rows.slice(0, 4).map(([, v]) => v.name).join(', ') + (rows.length > 4 ? `, +${rows.length - 4} more` : '');
  if (added.length) lines.push(`${plural(added.length, 'object')} added: ${list(added)}`);
  if (removed.length) lines.push(`${plural(removed.length, 'object')} removed: ${list(removed)}`);
  if (changed.length) lines.push(`${plural(changed.length, 'object')} changed: ${list(changed)}`);
  const pa = new Map(before.pages.map(p => [p.id, p.name])), pb = new Map(after.pages.map(p => [p.id, p.name]));
  const newPages = after.pages.filter(p => !pa.has(p.id)).map(p => p.name), gonePages = before.pages.filter(p => !pb.has(p.id)).map(p => p.name);
  if (newPages.length) lines.push(`Pages added: ${newPages.join(', ')}`); if (gonePages.length) lines.push(`Pages removed: ${gonePages.join(', ')}`);
  const count = (label: string, x: unknown[] | undefined, y: unknown[] | undefined) => { const d = (y?.length || 0) - (x?.length || 0); if (d) lines.push(`${label}: ${d > 0 ? '+' : ''}${d}`); };
  count('Colour tokens', before.tokens, after.tokens); count('Spacing/radius/shadow tokens', before.scale, after.scale); count('Style classes', before.classes, after.classes);
  count('Collections', before.collections, after.collections); count('Components', before.components, after.components);
  count('Images', before.assets, after.assets);
  if (JSON.stringify(before.custom || {}) !== JSON.stringify(after.custom || {})) lines.push('Custom code changed');
  return { lines, changed: lines.length > 0 };
}
/** Compares a snapshot with the live project; images are ignored for automatic snapshots because they do not carry them. */
export function compareSnapshot(current: Project, snap: Snapshot): SnapshotDiff | null {
  try { const old = JSON.parse(snap.data) as Project; return diffProjects(old, snap.auto ? { ...current, assets: old.assets } as Project : current); } catch { return null; }
}
