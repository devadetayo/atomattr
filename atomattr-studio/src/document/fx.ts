import type { Node, PathPoint, Style } from './types';
import { uid, cloneDeep } from './tree';
import { makePath } from './factory';

/* ------------------------------------------------------------------ colour helpers */
export type RGBA = { r: number; g: number; b: number; a: number };
const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
export function parseColor(input?: string): RGBA | null {
  if (!input) return null; const c = input.trim().toLowerCase();
  if (c === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  let m = /^#([0-9a-f]{3,8})$/.exec(c);
  if (m) {
    let h = m[1]; if (h.length === 3 || h.length === 4) h = h.split('').map(x => x + x).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(c);
  if (m) { const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]); return { r: +m[1], g: +m[2], b: +m[3], a }; }
  return null;
}
export const toHex = (c: RGBA) => `#${[c.r, c.g, c.b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('')}`;
export const toCss = (c: RGBA) => (c.a >= 0.999 ? toHex(c) : `rgba(${clamp255(c.r)},${clamp255(c.g)},${clamp255(c.b)},${Math.round(c.a * 100) / 100})`);
export function mixColor(a?: string, b?: string, t = 0.5): string {
  const x = parseColor(a) || parseColor(b) || { r: 0, g: 0, b: 0, a: 1 }; const y = parseColor(b) || x;
  return toCss({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t, a: x.a + (y.a - x.a) * t });
}
export const cssColorOr = (v: string | undefined, fb: string) => (parseColor(v) ? v! : fb);

/* ------------------------------------------------------------------ gradients */
export type Stop = { pos: number; color: string };
export type GradKind = 'linear' | 'radial' | 'conic';
export type Grad = { kind: GradKind; angle: number; cx: number; cy: number; shape: 'circle' | 'ellipse'; stops: Stop[] };
export const isGradient = (v?: string) => !!v && /^\s*(repeating-)?(linear|radial|conic)-gradient\(/i.test(v);

function splitTop(s: string): string[] {
  const out: string[] = []; let depth = 0; let cur = '';
  for (const ch of s) { if (ch === '(') depth += 1; if (ch === ')') depth -= 1; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  if (cur.trim()) out.push(cur.trim()); return out;
}
const DIRS: Record<string, number> = { top: 0, 'top right': 45, right: 90, 'bottom right': 135, bottom: 180, 'bottom left': 225, left: 270, 'top left': 315 };

export function parseGradient(css?: string): Grad | null {
  const m = /^\s*(linear|radial|conic)-gradient\(([\s\S]*)\)\s*$/i.exec(css || ''); if (!m) return null;
  const kind = m[1].toLowerCase() as GradKind; const parts = splitTop(m[2]); if (parts.length < 2) return null;
  let angle = kind === 'linear' ? 180 : 0; let cx = 50; let cy = 50; let shape: Grad['shape'] = 'ellipse'; let raw = parts;
  const head = parts[0];
  const looksLikeStop = !/^(to\s|-?[\d.]+(deg|turn|rad|grad)|circle|ellipse|closest|farthest|from\s|at\s)/i.test(head);
  if (!looksLikeStop) {
    raw = parts.slice(1);
    if (kind === 'linear') { const a = /^(-?[\d.]+)deg/i.exec(head); if (a) angle = +a[1]; else { const d = head.replace(/^to\s+/i, '').trim().toLowerCase(); if (d in DIRS) angle = DIRS[d]; } }
    else {
      if (kind === 'radial') shape = /circle/i.test(head) ? 'circle' : 'ellipse';
      if (kind === 'conic') { const a = /from\s+(-?[\d.]+)deg/i.exec(head); if (a) angle = +a[1]; }
      const at = /at\s+([\d.]+)%\s+([\d.]+)%/i.exec(head); if (at) { cx = +at[1]; cy = +at[2]; }
    }
  }
  const stops: { color: string; pos?: number }[] = raw.map(p => { const mm = /^([\s\S]*\S)\s+(-?[\d.]+)%\s*$/.exec(p); return mm ? { color: mm[1], pos: +mm[2] } : { color: p }; });
  if (stops.length < 2) return null;
  if (stops[0].pos === undefined) stops[0].pos = 0; if (stops[stops.length - 1].pos === undefined) stops[stops.length - 1].pos = 100;
  for (let i = 1; i < stops.length - 1; i += 1) if (stops[i].pos === undefined) {
    let j = i; while (stops[j].pos === undefined) j += 1; const a = stops[i - 1].pos as number; const b = stops[j].pos as number;
    for (let k = i; k < j; k += 1) stops[k].pos = a + ((b - a) * (k - i + 1)) / (j - i + 1);
  }
  return { kind, angle, cx, cy, shape, stops: stops as Stop[] };
}
const n2 = (n: number) => Math.round(n * 100) / 100;
export function gradientCss(g: Grad): string {
  const stops = [...g.stops].sort((a, b) => a.pos - b.pos).map(s => `${s.color} ${n2(s.pos)}%`).join(', ');
  if (g.kind === 'linear') return `linear-gradient(${n2(g.angle)}deg, ${stops})`;
  if (g.kind === 'radial') return `radial-gradient(${g.shape} at ${n2(g.cx)}% ${n2(g.cy)}%, ${stops})`;
  return `conic-gradient(from ${n2(g.angle)}deg at ${n2(g.cx)}% ${n2(g.cy)}%, ${stops})`;
}
export const defaultGradient = (from = '#6366f1', to = '#ec4899', kind: GradKind = 'linear'): Grad => ({ kind, angle: kind === 'linear' ? 135 : 0, cx: 50, cy: 50, shape: 'ellipse', stops: [{ pos: 0, color: from }, { pos: 100, color: to }] });
/** The colour a solid fill would have: used when switching a gradient back to a flat fill. */
export const firstColor = (v?: string) => (isGradient(v) ? parseGradient(v)?.stops[0].color : v) || '#6366f1';

/** SVG paint server for a CSS gradient (SVG shapes cannot use CSS backgrounds). */
export type SvgDef = { tag: 'linearGradient' | 'radialGradient'; id: string; attrs: Record<string, string>; stops: { offset: string; color: string; opacity?: string }[] };
export function svgGradient(css: string, id: string): SvgDef | null {
  const g = parseGradient(css); if (!g) return null;
  const stops = [...g.stops].sort((a, b) => a.pos - b.pos).map(s => { const c = parseColor(s.color); return { offset: `${n2(s.pos)}%`, color: c ? toHex(c) : s.color, opacity: c && c.a < 1 ? String(n2(c.a)) : undefined }; });
  if (g.kind === 'radial') return { tag: 'radialGradient', id, attrs: { cx: `${n2(g.cx)}%`, cy: `${n2(g.cy)}%`, r: '70%' }, stops };
  const a = ((g.kind === 'linear' ? g.angle : g.angle) * Math.PI) / 180; const sx = Math.sin(a) / 2; const sy = -Math.cos(a) / 2;
  return { tag: 'linearGradient', id, attrs: { x1: `${n2((0.5 - sx) * 100)}%`, y1: `${n2((0.5 - sy) * 100)}%`, x2: `${n2((0.5 + sx) * 100)}%`, y2: `${n2((0.5 + sy) * 100)}%` }, stops };
}

/* ------------------------------------------------------------------ transparency (alpha masks) */
export type Fade = { kind: 'none' | 'linear' | 'radial'; angle: number; start: number; end: number; cx: number; cy: number };
export const fadeOff: Fade = { kind: 'none', angle: 180, start: 100, end: 0, cx: 50, cy: 50 };
export function fadeCss(f: Fade): string | undefined {
  if (f.kind === 'none') return undefined;
  const a = (v: number) => `rgba(0,0,0,${n2(Math.max(0, Math.min(100, v)) / 100)})`;
  return f.kind === 'linear' ? `linear-gradient(${n2(f.angle)}deg, ${a(f.start)} 0%, ${a(f.end)} 100%)` : `radial-gradient(circle at ${n2(f.cx)}% ${n2(f.cy)}%, ${a(f.start)} 0%, ${a(f.end)} 100%)`;
}
export function parseFade(css?: string): Fade {
  const g = parseGradient(css); if (!g || g.kind === 'conic') return fadeOff;
  const alpha = (s: Stop) => Math.round((parseColor(s.color)?.a ?? 1) * 100);
  const st = [...g.stops].sort((x, y) => x.pos - y.pos);
  return { kind: g.kind, angle: g.angle || 180, start: alpha(st[0]), end: alpha(st[st.length - 1]), cx: g.cx, cy: g.cy };
}

/* ------------------------------------------------------------------ clip shapes (CSS clip-path, responsive) */
export const CLIP_PRESETS: { id: string; name: string; css: string }[] = [
  { id: 'none', name: 'None', css: '' },
  { id: 'circle', name: 'Circle', css: 'circle(50% at 50% 50%)' },
  { id: 'ellipse', name: 'Ellipse', css: 'ellipse(50% 50% at 50% 50%)' },
  { id: 'rounded', name: 'Rounded', css: 'inset(0 round 24px)' },
  { id: 'triangle', name: 'Triangle', css: 'polygon(50% 0%, 100% 100%, 0% 100%)' },
  { id: 'diamond', name: 'Diamond', css: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { id: 'pentagon', name: 'Pentagon', css: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
  { id: 'hexagon', name: 'Hexagon', css: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  { id: 'star', name: 'Star', css: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  { id: 'arrow', name: 'Arrow', css: 'polygon(0% 30%, 60% 30%, 60% 0%, 100% 50%, 60% 100%, 60% 70%, 0% 70%)' },
  { id: 'chevron', name: 'Chevron', css: 'polygon(0% 0%, 70% 0%, 100% 50%, 70% 100%, 0% 100%, 30% 50%)' },
  { id: 'slant', name: 'Slanted', css: 'polygon(0% 0%, 100% 0%, 100% 85%, 0% 100%)' },
  { id: 'parallelogram', name: 'Parallelogram', css: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' },
  { id: 'message', name: 'Message', css: 'polygon(0% 0%, 100% 0%, 100% 75%, 25% 75%, 10% 100%, 10% 75%, 0% 75%)' },
];

/* ------------------------------------------------------------------ contour */
export type ContourOpts = { steps: number; offset: number; inside: boolean; to: string };
const SCALABLE = new Set(['shape', 'path', 'image', 'container', 'button', 'group', 'section']);
export const canContour = (n: Node) => SCALABLE.has(n.type) && typeof n.style.w === 'number' && typeof n.style.h === 'number';

/** Concentric copies of an object, stepping outward or inward with a colour blend. Returned bottom to top, including the source. */
export function contourNodes(src: Node, o: ContourOpts): Node[] {
  const x = Number(src.style.x ?? 0); const y = Number(src.style.y ?? 0); const w = src.style.w as number; const h = src.style.h as number;
  const exact = (src.type === 'shape' && (src.shape === 'rect' || src.shape === 'ellipse')) || src.type === 'container' || src.type === 'button' || src.type === 'image';
  const useStroke = !src.style.fill && !!src.style.stroke; const base = useStroke ? src.style.stroke : src.style.fill;
  const copies: Node[] = [];
  for (let i = 1; i <= o.steps; i += 1) {
    const d = (o.inside ? -1 : 1) * o.offset * i; const t = o.steps ? i / o.steps : 1;
    const c = cloneDeep(src); c.id = uid(); c.name = `${src.name} contour ${i}`;
    let nx = x - d; let ny = y - d; let nw = w + 2 * d; let nh = h + 2 * d;
    if (!exact) { const m = Math.min(w, h) || 1; const k = Math.max(0.02, (m + 2 * d) / m); nw = w * k; nh = h * k; nx = x - (nw - w) / 2; ny = y - (nh - h) / 2; }
    if (nw < 2 || nh < 2) break;
    c.style = { ...c.style, x: n2(nx), y: n2(ny), w: n2(nw), h: n2(nh) };
    if (exact && c.style.radius) c.style.radius = Math.max(0, n2(c.style.radius + d));
    const colour = mixColor(isGradient(base) ? firstColor(base) : base, o.to, t);
    if (useStroke) c.style.stroke = colour; else c.style.fill = colour; delete c.style.fillToken;
    copies.push(c);
  }
  return o.inside ? [src, ...copies] : [...copies.reverse(), src];
}

/* ------------------------------------------------------------------ blend between two objects */
export function blendNodes(a: Node, b: Node, steps: number): Node[] {
  const num = (n: Node, k: keyof Style, fb = 0) => (typeof n.style[k] === 'number' ? (n.style[k] as number) : fb);
  const out: Node[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / (steps + 1); const c = cloneDeep(a); c.id = uid(); c.name = `Blend ${i}`;
    const L = (k: keyof Style, fb = 0) => n2(num(a, k, fb) + (num(b, k, fb) - num(a, k, fb)) * t);
    c.style = { ...c.style, x: L('x'), y: L('y'), w: Math.max(2, L('w', 2)), h: Math.max(2, L('h', 2)), rotation: L('rotation'), opacity: n2(num(a, 'opacity', 1) + (num(b, 'opacity', 1) - num(a, 'opacity', 1)) * t) };
    if (a.style.fill || b.style.fill) c.style.fill = mixColor(firstColor(a.style.fill), firstColor(b.style.fill || a.style.fill), t);
    if (a.style.stroke || b.style.stroke) c.style.stroke = mixColor(a.style.stroke || b.style.stroke, b.style.stroke || a.style.stroke, t);
    if (a.style.radius !== undefined || b.style.radius !== undefined) c.style.radius = L('radius');
    if (a.style.strokeWidth !== undefined || b.style.strokeWidth !== undefined) c.style.strokeWidth = L('strokeWidth');
    delete c.style.fillToken; out.push(c);
  }
  return [a, ...out, b];
}

/* ------------------------------------------------------------------ spiral */
export function spiralNode(x: number, y: number, size: number, turns = 4, stroke = '#111827', width = 3): Node {
  const pts: PathPoint[] = []; const n = Math.max(24, Math.round(turns * 18)); const r = size / 2;
  for (let i = 0; i <= n; i += 1) { const t = i / n; const a = t * turns * Math.PI * 2; pts.push({ x: x + r + Math.cos(a) * r * t, y: y + r + Math.sin(a) * r * t }); }
  const sm: PathPoint[] = pts.map((p, i) => { const prev = pts[Math.max(0, i - 1)]; const next = pts[Math.min(pts.length - 1, i + 1)]; const dx = (next.x - prev.x) / 6; const dy = (next.y - prev.y) / 6; return { x: p.x, y: p.y, hx1: i === 0 ? undefined : -dx, hy1: i === 0 ? undefined : -dy, hx2: i === n ? undefined : dx, hy2: i === n ? undefined : dy }; });
  const node = makePath(sm, false, stroke, undefined, width); node.name = 'Spiral'; return node;
}
