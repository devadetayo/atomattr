import type { Node, Project, Style } from './types';

/* Every colour a project actually uses: fill, border, text colour and background tint, across all pages and across
   hover / focus / active / dark state styles. Gradients count each colour stop. */

export type ColorRole = 'fill' | 'stroke' | 'text' | 'tint';
export type UsedColor = { hex: string; count: number; roles: ColorRole[]; nodeIds: string[] };

const KEYS: [keyof Style, ColorRole][] = [['fill', 'fill'], ['stroke', 'stroke'], ['color', 'text'], ['bgTint', 'tint']];
const TOKEN = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\([^)]*\)/g;

const h2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/** One canonical spelling: lowercase 6-digit hex, 8-digit when it has alpha. Anything it cannot read is returned lowercased. */
export function normalizeColor(raw: string): string {
  const c = raw.trim().toLowerCase();
  if (c.startsWith('#')) {
    if (c.length === 4 || c.length === 5) return '#' + [...c.slice(1)].map(x => x + x).join('');
    return c;
  }
  const m = c.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)$/);
  if (!m) return c;
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return `#${h2(+m[1])}${h2(+m[2])}${h2(+m[3])}${a < 1 ? h2(a * 255) : ''}`;
}

const colorsIn = (v: unknown): string[] => (typeof v === 'string' ? (v.match(TOKEN) || []).map(normalizeColor) : []);

function eachStyle(n: Node, visit: (s: Style) => void) {
  visit(n.style);
  for (const bp of Object.values(n.bp || {})) if (bp) visit(bp as Style);
  for (const st of Object.values(n.states || {})) if (st) visit(st as Style);
}
function eachNode(n: Node, visit: (n: Node) => void) { visit(n); n.children?.forEach(c => eachNode(c, visit)); }

export function usedColors(project: Project): UsedColor[] {
  const map = new Map<string, { count: number; roles: Set<ColorRole>; ids: Set<string> }>();
  const add = (hex: string, role: ColorRole, id: string) => {
    const e = map.get(hex) || { count: 0, roles: new Set<ColorRole>(), ids: new Set<string>() };
    e.count++; e.roles.add(role); e.ids.add(id); map.set(hex, e);
  };
  for (const page of project.pages) eachNode(page.root, n => eachStyle(n, s => { for (const [k, role] of KEYS) for (const c of colorsIn(s[k])) add(c, role, n.id); }));
  return [...map.entries()].map(([hex, e]) => ({ hex, count: e.count, roles: [...e.roles], nodeIds: [...e.ids] })).sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex));
}

/** Replace one colour with another everywhere it is used (all pages, all states, inside gradients). Returns the new project and how many values changed. */
export function replaceColor(project: Project, from: string, to: string): { project: Project; changed: number } {
  const f = normalizeColor(from); let changed = 0;
  const swap = (s: Style): Style => {
    let out = s;
    for (const [k] of KEYS) {
      const v = s[k];
      if (typeof v !== 'string') continue;
      const nv = v.replace(TOKEN, m => (normalizeColor(m) === f ? to : m));
      if (nv !== v) { if (out === s) out = { ...s }; (out as Record<string, unknown>)[k] = nv; changed++; }
    }
    return out;
  };
  const node = (n: Node): Node => {
    let next: Node = { ...n, style: swap(n.style) };
    if (n.bp) next.bp = Object.fromEntries(Object.entries(n.bp).map(([k, v]) => [k, v ? swap(v as Style) : v])) as Node['bp'];
    if (n.states) next.states = Object.fromEntries(Object.entries(n.states).map(([k, v]) => [k, v ? swap(v as Style) : v])) as Node['states'];
    if (n.children) next.children = n.children.map(node);
    return next;
  };
  return { project: { ...project, pages: project.pages.map(p => ({ ...p, root: node(p.root) })) }, changed };
}
