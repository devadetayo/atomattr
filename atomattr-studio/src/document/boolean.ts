import type { Node, PathPoint, Rect } from './types';
import { pathD, polygonPoints } from './gen';
import { uid } from './tree';

/**
 * CorelDRAW-style shaping (Weld, Intersect, Front minus back, Back minus front, Exclude).
 * Shapes are rasterised with oversampling, combined per pixel, then traced back into clean vector outlines.
 * The result is an ordinary editable path (or a compound path when the result has holes or islands).
 */
export type BoolOp = 'weld' | 'intersect' | 'front-back' | 'back-front' | 'exclude';
type P = { x: number; y: number };
const r2 = (n: number) => Math.round(n * 100) / 100;

export function localPath(n: Node): { d: string; sx: number; sy: number } {
  const w = typeof n.style.w === 'number' ? n.style.w : 0; const h = typeof n.style.h === 'number' ? n.style.h : 0;
  if (n.type === 'path') {
    const vw = n.vw || w || 1; const vh = n.vh || h || 1;
    return { d: n.svgD || pathD(n.pts || [], !!n.closed) + (n.closed ? '' : ' Z'), sx: w / vw, sy: h / vh };
  }
  if (n.type === 'shape' && n.shape === 'ellipse') return { d: `M0 ${h / 2} A${w / 2} ${h / 2} 0 1 0 ${w} ${h / 2} A${w / 2} ${h / 2} 0 1 0 0 ${h / 2} Z`, sx: 1, sy: 1 };
  if (n.type === 'shape' && (n.shape === 'polygon' || n.shape === 'star')) {
    const pts = polygonPoints(w, h, n.points || (n.shape === 'star' ? 5 : 6), n.shape === 'star', n.inner ?? 0.5).split(' ');
    return { d: `M${pts.join(' L')} Z`, sx: 1, sy: 1 };
  }
  const r = Math.min(Number(n.style.radius || 0), w / 2, h / 2);
  if (r > 0) return { d: `M${r} 0 H${w - r} A${r} ${r} 0 0 1 ${w} ${r} V${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} H${r} A${r} ${r} 0 0 1 0 ${h - r} V${r} A${r} ${r} 0 0 1 ${r} 0 Z`, sx: 1, sy: 1 };
  return { d: `M0 0 H${w} V${h} H0 Z`, sx: 1, sy: 1 };
}

const nodeBox = (n: Node): Rect => {
  const x = Number(n.style.x ?? 0); const y = Number(n.style.y ?? 0); const w = n.style.w as number; const h = n.style.h as number; const a = ((n.style.rotation || 0) * Math.PI) / 180;
  const cx = x + w / 2; const cy = y + h / 2; const xs: number[] = []; const ys: number[] = [];
  [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].forEach(([px, py]) => { xs.push(cx + px * Math.cos(a) - py * Math.sin(a)); ys.push(cy + px * Math.sin(a) + py * Math.cos(a)); });
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};

/* ---------- tracing a binary grid into closed loops (pure, testable) ---------- */
export function traceLoops(inside: Uint8Array, W: number, H: number): P[][] {
  const from: number[] = []; const to: number[] = []; const V = (x: number, y: number) => y * (W + 1) + x;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : inside[y * W + x]);
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    if (!inside[y * W + x]) continue;
    if (!at(x, y - 1)) { from.push(V(x, y)); to.push(V(x + 1, y)); }
    if (!at(x + 1, y)) { from.push(V(x + 1, y)); to.push(V(x + 1, y + 1)); }
    if (!at(x, y + 1)) { from.push(V(x + 1, y + 1)); to.push(V(x, y + 1)); }
    if (!at(x - 1, y)) { from.push(V(x, y + 1)); to.push(V(x, y)); }
  }
  const out = new Map<number, number[]>(); from.forEach((v, i) => { const l = out.get(v); if (l) l.push(i); else out.set(v, [i]); });
  const used = new Uint8Array(from.length); const loops: P[][] = []; const xy = (v: number): P => ({ x: v % (W + 1), y: Math.floor(v / (W + 1)) });
  for (let e0 = 0; e0 < from.length; e0 += 1) {
    if (used[e0]) continue;
    const loop: P[] = []; let e = e0; let prevDir = '';
    for (let guard = 0; guard < from.length + 2; guard += 1) {
      used[e] = 1; const a = xy(from[e]); const b = xy(to[e]); const dir = `${Math.sign(b.x - a.x)},${Math.sign(b.y - a.y)}`;
      if (dir !== prevDir) loop.push(a); prevDir = dir;
      const next = (out.get(to[e]) || []).filter(i => !used[i]);
      if (!next.length) break;
      e = next.length > 1 ? (next.find(i => { const c = xy(to[i]); return (c.x - b.x) * (b.y - a.y) - (c.y - b.y) * (b.x - a.x) > 0; }) ?? next[0]) : next[0];
    }
    const clean = loop.filter((p, i) => { const a = loop[(i + loop.length - 1) % loop.length]; const b = loop[(i + 1) % loop.length]; return (p.x - a.x) * (b.y - p.y) - (p.y - a.y) * (b.x - p.x) !== 0; });
    if (clean.length >= 3) loops.push(clean);
  }
  return loops;
}
const area = (l: P[]) => { let a = 0; for (let i = 0; i < l.length; i += 1) { const p = l[i]; const q = l[(i + 1) % l.length]; a += p.x * q.y - q.x * p.y; } return a / 2; };

/** Douglas–Peucker on an open polyline. */
export function rdp(pts: P[], eps: number): P[] {
  if (pts.length < 3) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!; let maxD = 0; let idx = -1; const A = pts[a]; const B = pts[b]; const dx = B.x - A.x; const dy = B.y - A.y; const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i += 1) { const d = Math.abs((pts[i].x - A.x) * dy - (pts[i].y - A.y) * dx) / len; if (d > maxD) { maxD = d; idx = i; } }
    if (idx > 0 && maxD > eps) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
export function rdpClosed(loop: P[], eps: number): P[] {
  if (loop.length < 4) return loop; let far = 0; let best = 0;
  loop.forEach((p, i) => { const d = Math.hypot(p.x - loop[0].x, p.y - loop[0].y); if (d > best) { best = d; far = i; } });
  const a = rdp(loop.slice(0, far + 1), eps); const b = rdp([...loop.slice(far), loop[0]], eps);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

export function boolResult(nodes: Node[], op: BoolOp): Node | null {
  if (typeof document === 'undefined' || nodes.length < 2) return null;
  const boxes = nodes.map(nodeBox); const x0 = Math.min(...boxes.map(b => b.x)); const y0 = Math.min(...boxes.map(b => b.y));
  const x1 = Math.max(...boxes.map(b => b.x + b.w)); const y1 = Math.max(...boxes.map(b => b.y + b.h)); const bw = x1 - x0; const bh = y1 - y0;
  if (bw < 1 || bh < 1) return null;
  const pad = 2; let s = Math.max(0.5, Math.min(4, 2200 / Math.max(bw, bh)));
  while ((bw * s + pad * 2) * (bh * s + pad * 2) > 7_000_000 && s > 0.3) s *= 0.8;
  const W = Math.ceil(bw * s) + pad * 2; const H = Math.ceil(bh * s) + pad * 2;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d', { willReadFrequently: true }); if (!ctx) return null;
  const masks = nodes.map(n => {
    ctx.clearRect(0, 0, W, H); ctx.save();
    const w = n.style.w as number; const h = n.style.h as number; const lp = localPath(n);
    ctx.translate((Number(n.style.x ?? 0) + w / 2 - x0) * s + pad, (Number(n.style.y ?? 0) + h / 2 - y0) * s + pad);
    ctx.rotate(((n.style.rotation || 0) * Math.PI) / 180); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2); ctx.scale(lp.sx, lp.sy);
    try { ctx.fill(new Path2D(lp.d), n.evenodd ? 'evenodd' : 'nonzero'); } catch { ctx.fillRect(0, 0, w / lp.sx, h / lp.sy); }
    ctx.restore();
    const data = ctx.getImageData(0, 0, W, H).data; const m = new Uint8Array(W * H); for (let i = 0; i < m.length; i += 1) m[i] = data[i * 4 + 3] > 127 ? 1 : 0; return m;
  });
  const res = new Uint8Array(W * H); const front = masks.length - 1;
  for (let i = 0; i < res.length; i += 1) {
    switch (op) {
      case 'weld': { let v = 0; for (const m of masks) if (m[i]) { v = 1; break; } res[i] = v; break; }
      case 'intersect': { let v = 1; for (const m of masks) if (!m[i]) { v = 0; break; } res[i] = v; break; }
      case 'front-back': { let back = 0; for (let k = 0; k < front; k += 1) if (masks[k][i]) { back = 1; break; } res[i] = masks[front][i] && !back ? 1 : 0; break; }
      case 'back-front': { let back = 0; for (let k = 0; k < front; k += 1) if (masks[k][i]) { back = 1; break; } res[i] = back && !masks[front][i] ? 1 : 0; break; }
      default: { let c = 0; for (const m of masks) c += m[i]; res[i] = c % 2; }
    }
  }
  const raw = traceLoops(res, W, H).filter(l => Math.abs(area(l)) > 3);
  const loops = raw.map(l => rdpClosed(l, 0.9)).filter(l => l.length >= 3);
  if (!loops.length) return null;
  const toDesign = (p: P): P => ({ x: (p.x - pad) / s, y: (p.y - pad) / s });
  const dl = loops.map(l => l.map(toDesign));
  const xs = dl.flat().map(p => p.x); const ys = dl.flat().map(p => p.y); const mx = Math.min(...xs); const my = Math.min(...ys);
  const w = Math.max(2, Math.max(...xs) - mx); const h = Math.max(2, Math.max(...ys) - my);
  const src = op === 'front-back' ? nodes[front] : nodes[0];
  const names: Record<BoolOp, string> = { weld: 'Weld', intersect: 'Intersect', 'front-back': 'Front minus back', 'back-front': 'Back minus front', exclude: 'Exclude' };
  const style = { ...src.style, mode: 'abs' as const, x: r2(x0 + mx), y: r2(y0 + my), w: r2(w), h: r2(h), rotation: undefined, radius: undefined };
  if (style.fill === undefined && !style.stroke) style.fill = '#6366f1';
  const base = { id: uid(), type: 'path' as const, name: names[op], style, closed: true, vw: r2(w), vh: r2(h) };
  if (dl.length === 1) return { ...base, pts: dl[0].map((p): PathPoint => ({ x: r2(p.x - mx), y: r2(p.y - my) })) };
  const d = dl.map(l => `M${l.map(p => `${r2(p.x - mx)} ${r2(p.y - my)}`).join(' L')} Z`).join(' ');
  return { ...base, pts: [], svgD: d, evenodd: true };
}
