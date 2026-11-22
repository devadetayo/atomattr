import type { PathPoint } from '../document/types';

type V = { x: number; y: number };
const lerp = (a: V, b: V, t: number): V => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const ctrl = (a: PathPoint, b: PathPoint): [V, V, V, V] => [{ x: a.x, y: a.y }, { x: a.x + (a.hx2 ?? 0), y: a.y + (a.hy2 ?? 0) }, { x: b.x + (b.hx1 ?? 0), y: b.y + (b.hy1 ?? 0)}, { x: b.x, y: b.y }];
const at = (c: [V, V, V, V], t: number): V => { const a = lerp(c[0], c[1], t); const b = lerp(c[1], c[2], t); const d = lerp(c[2], c[3], t); return lerp(lerp(a, b, t), lerp(b, d, t), t); };

/** Insert a point on the segment nearest to (x, y), splitting the curve so its shape is preserved. */
export function insertPointNear(pts: PathPoint[], closed: boolean, x: number, y: number, maxDist: number): { pts: PathPoint[]; index: number } | null {
  const n = pts.length; const segs = closed ? n : n - 1; let best = { d: Infinity, i: -1, t: 0 };
  for (let i = 0; i < segs; i += 1) {
    const c = ctrl(pts[i], pts[(i + 1) % n]);
    for (let k = 0; k <= 40; k += 1) { const t = k / 40; const p = at(c, t); const d = Math.hypot(p.x - x, p.y - y); if (d < best.d) best = { d, i, t }; }
  }
  if (best.i < 0 || best.d > maxDist || best.t < 0.02 || best.t > 0.98) return null;
  const a = pts[best.i]; const b = pts[(best.i + 1) % n]; const [p0, p1, p2, p3] = ctrl(a, b); const t = best.t;
  const a1 = lerp(p0, p1, t); const b1 = lerp(p1, p2, t); const c1 = lerp(p2, p3, t); const a2 = lerp(a1, b1, t); const b2 = lerp(b1, c1, t); const m = lerp(a2, b2, t);
  const curved = a.hx2 !== undefined || a.hy2 !== undefined || b.hx1 !== undefined || b.hy1 !== undefined;
  const mid: PathPoint = curved ? { x: m.x, y: m.y, hx1: a2.x - m.x, hy1: a2.y - m.y, hx2: b2.x - m.x, hy2: b2.y - m.y } : { x: m.x, y: m.y };
  const out = pts.map(p => ({ ...p }));
  if (curved) { out[best.i] = { ...a, hx2: a1.x - a.x, hy2: a1.y - a.y }; const bi = (best.i + 1) % n; out[bi] = { ...b, hx1: c1.x - b.x, hy1: c1.y - b.y }; }
  out.splice(best.i + 1, 0, mid);
  return { pts: out, index: best.i + 1 };
}
export function removePoint(pts: PathPoint[], index: number): PathPoint[] { return pts.length <= 2 ? pts : pts.filter((_, i) => i !== index); }
/** Toggle a point between a sharp corner and a smooth curve. */
export function toggleSmooth(pts: PathPoint[], closed: boolean, index: number): PathPoint[] {
  const n = pts.length; const p = pts[index]; const smooth = p.hx1 !== undefined || p.hx2 !== undefined;
  const out = pts.map(q => ({ ...q }));
  if (smooth) { const { x, y } = p; out[index] = { x, y }; return out; }
  const prev = pts[closed ? (index - 1 + n) % n : Math.max(0, index - 1)]; const next = pts[closed ? (index + 1) % n : Math.min(n - 1, index + 1)];
  const dx = (next.x - prev.x) / 6; const dy = (next.y - prev.y) / 6;
  out[index] = { x: p.x, y: p.y, hx1: index === 0 && !closed ? undefined : -dx, hy1: index === 0 && !closed ? undefined : -dy, hx2: index === n - 1 && !closed ? undefined : dx, hy2: index === n - 1 && !closed ? undefined : dy };
  return out;
}
