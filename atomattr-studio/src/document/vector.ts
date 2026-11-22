import type { Node, PathPoint } from './types';
import { pathD } from './gen';
import { rdp } from './boolean';
import { shapeToPath } from './ops';
import { uid } from './tree';

const r2 = (n: number) => Math.round(n * 100) / 100;
const hasH = (p: PathPoint) => p.hx1 !== undefined || p.hy1 !== undefined || p.hx2 !== undefined || p.hy2 !== undefined;

export const reversePts = (pts: PathPoint[]): PathPoint[] => pts.slice().reverse().map(p => ({ x: p.x, y: p.y, ...(p.hx2 !== undefined || p.hy2 !== undefined ? { hx1: p.hx2, hy1: p.hy2 } : {}), ...(p.hx1 !== undefined || p.hy1 !== undefined ? { hx2: p.hx1, hy2: p.hy1 } : {}) }));
export const toLines = (pts: PathPoint[]): PathPoint[] => pts.map(p => ({ x: p.x, y: p.y }));
export function toCurves(pts: PathPoint[], closed: boolean): PathPoint[] {
  const out = pts.map(p => ({ ...p })); const n = out.length; const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i += 1) {
    const a = out[i]; const b = out[(i + 1) % n];
    if (a.hx2 === undefined && a.hy2 === undefined && b.hx1 === undefined && b.hy1 === undefined) { const dx = (b.x - a.x) / 3; const dy = (b.y - a.y) / 3; a.hx2 = dx; a.hy2 = dy; b.hx1 = -dx; b.hy1 = -dy; }
  }
  return out;
}
/** Catmull-Rom style smoothing. Points that turn more sharply than `corner` degrees stay sharp. */
export function smoothAll(pts: PathPoint[], closed: boolean, corner = 75): PathPoint[] {
  const n = pts.length; if (n < 3) return pts;
  return pts.map((p, i) => {
    const open = !closed && (i === 0 || i === n - 1); const prev = pts[(i - 1 + n) % n]; const next = pts[(i + 1) % n];
    if (open) return i === 0 ? { x: p.x, y: p.y, hx2: (next.x - p.x) / 3, hy2: (next.y - p.y) / 3 } : { x: p.x, y: p.y, hx1: (prev.x - p.x) / 3, hy1: (prev.y - p.y) / 3 };
    const a1 = Math.atan2(p.y - prev.y, p.x - prev.x); const a2 = Math.atan2(next.y - p.y, next.x - p.x); let d = Math.abs(a2 - a1) * 180 / Math.PI; if (d > 180) d = 360 - d;
    if (d > corner) return { x: p.x, y: p.y };
    const dx = (next.x - prev.x) / 6; const dy = (next.y - prev.y) / 6; return { x: p.x, y: p.y, hx1: -dx, hy1: -dy, hx2: dx, hy2: dy };
  });
}
/** Symmetrical node: both handles the same length, opposite directions. */
export function symmetric(pts: PathPoint[], index: number): PathPoint[] {
  const out = pts.map(p => ({ ...p })); const p = out[index]; const len = Math.max(Math.hypot(p.hx1 ?? 0, p.hy1 ?? 0), Math.hypot(p.hx2 ?? 0, p.hy2 ?? 0), 12);
  const ang = Math.atan2(p.hy2 ?? 0, p.hx2 ?? 1) || 0; p.hx2 = Math.cos(ang) * len; p.hy2 = Math.sin(ang) * len; p.hx1 = -p.hx2; p.hy1 = -p.hy2; return out;
}
const cubic = (a: PathPoint, b: PathPoint, t: number) => {
  const p0 = { x: a.x, y: a.y }; const p1 = { x: a.x + (a.hx2 ?? 0), y: a.y + (a.hy2 ?? 0) }; const p2 = { x: b.x + (b.hx1 ?? 0), y: b.y + (b.hy1 ?? 0) }; const p3 = { x: b.x, y: b.y }; const u = 1 - t;
  return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y };
};
/** Reduce the number of nodes while following the same outline. */
export function simplifyPts(pts: PathPoint[], closed: boolean, eps: number): PathPoint[] {
  if (pts.length < 4) return pts; const n = pts.length; const segs = closed ? n : n - 1; const flat: { x: number; y: number }[] = []; const curved = pts.some(hasH);
  for (let i = 0; i < segs; i += 1) { const a = pts[i]; const b = pts[(i + 1) % n]; const steps = hasH(a) || hasH(b) ? 14 : 1; for (let k = 0; k < steps; k += 1) flat.push(steps === 1 ? { x: a.x, y: a.y } : cubic(a, b, k / steps)); }
  if (!closed) flat.push({ x: pts[n - 1].x, y: pts[n - 1].y });
  let kept = closed ? rdp([...flat, flat[0]], eps).slice(0, -1) : rdp(flat, eps);
  if (kept.length < 3 && closed) kept = flat.filter((_, i) => i % Math.ceil(flat.length / 3) === 0);
  const lines = kept.map(p => ({ x: r2(p.x), y: r2(p.y) }));
  return curved ? smoothAll(lines, closed, 60) : lines;
}

/** Combine several shapes/paths into one compound path (even-odd, so overlaps become holes). */
export function combineNodes(nodes: Node[]): Node | null {
  const parts = nodes.map(n => (n.type === 'path' ? n : shapeToPath(n))).filter((n): n is Node => !!n && !!n.pts && typeof n.style.w === 'number');
  if (parts.length < 2) return null;
  const placed = parts.map(n => {
    const w = n.style.w as number; const h = n.style.h as number; const vw = n.vw || w || 1; const vh = n.vh || h || 1; const sx = w / vw; const sy = h / vh;
    const a = ((n.style.rotation || 0) * Math.PI) / 180; const cx = w / 2; const cy = h / 2; const ox = Number(n.style.x ?? 0); const oy = Number(n.style.y ?? 0);
    const tp = (x: number, y: number) => { const X = x * sx - cx; const Y = y * sy - cy; return { x: ox + cx + X * Math.cos(a) - Y * Math.sin(a), y: oy + cy + X * Math.sin(a) + Y * Math.cos(a) }; };
    const pts = (n.pts || []).map(p => { const q = tp(p.x, p.y); const h1 = hasH(p) ? tp(p.x + (p.hx1 ?? 0), p.y + (p.hy1 ?? 0)) : null; const h2 = hasH(p) ? tp(p.x + (p.hx2 ?? 0), p.y + (p.hy2 ?? 0)) : null; return { x: q.x, y: q.y, ...(h1 ? { hx1: h1.x - q.x, hy1: h1.y - q.y } : {}), ...(h2 ? { hx2: h2.x - q.x, hy2: h2.y - q.y } : {}) } as PathPoint; });
    return { n, pts };
  });
  const xs = placed.flatMap(p => p.pts.flatMap(q => [q.x, q.x + (q.hx1 ?? 0), q.x + (q.hx2 ?? 0)])); const ys = placed.flatMap(p => p.pts.flatMap(q => [q.y, q.y + (q.hy1 ?? 0), q.y + (q.hy2 ?? 0)]));
  const mx = Math.min(...xs); const my = Math.min(...ys); const w = Math.max(2, Math.max(...xs) - mx); const h = Math.max(2, Math.max(...ys) - my);
  const d = placed.map(p => pathD(p.pts.map(q => ({ ...q, x: q.x - mx, y: q.y - my })), true)).join(' ');
  const first = parts[0];
  return { id: uid(), type: 'path', name: 'Combined', style: { ...first.style, mode: 'abs', x: r2(mx), y: r2(my), w: r2(w), h: r2(h), rotation: undefined }, pts: [], closed: true, vw: r2(w), vh: r2(h), svgD: d, evenodd: true };
}
/** Split a compound path (several sub-paths) into separate objects. */
export function breakApart(node: Node): Node[] {
  if (node.type !== 'path' || !node.svgD) return [];
  const pieces = node.svgD.split(/(?=M)/).map(x => x.trim()).filter(Boolean); if (pieces.length < 2) return [];
  return pieces.map((d, i) => ({ ...node, id: uid(), name: `${node.name} ${i + 1}`, svgD: d, evenodd: false, style: { ...node.style } }));
}
