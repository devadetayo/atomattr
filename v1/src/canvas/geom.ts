import type { Node, PathPoint, Rect } from '../document/types';
import { explicitStyle } from '../document/style';
import type { Bp } from '../document/types';
import { pathTo } from '../document/tree';

import { elOf } from './registry';
export const nodeEl = (id: string): HTMLElement | null => elOf(id);

/** Rotation of a node including rotated ancestors. */
export function totalRotation(root: Node, id: string, bp: Bp): number {
  return (pathTo(root, id) || []).reduce((sum, n) => sum + (explicitStyle(n, bp).rotation || 0), 0);
}

export type ScreenBox = { cx: number; cy: number; w: number; h: number; rot: number };
/** Screen-space box of a node relative to the stage: centre from the real DOM rect, size from layout size × zoom. */
export function screenBox(el: HTMLElement, stage: DOMRect, zoom: number, rot: number): ScreenBox {
  const r = el.getBoundingClientRect();
  return { cx: r.left - stage.left + r.width / 2, cy: r.top - stage.top + r.height / 2, w: rot ? el.offsetWidth * zoom : r.width, h: rot ? el.offsetHeight * zoom : r.height, rot };
}
export const boxRect = (b: ScreenBox): Rect => ({ x: b.cx - b.w / 2, y: b.cy - b.h / 2, w: b.w, h: b.h });
export function unionRect(rs: Rect[]): Rect | null {
  if (!rs.length) return null;
  const x = Math.min(...rs.map(r => r.x)); const y = Math.min(...rs.map(r => r.y));
  return { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y };
}
export const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const inside = (inner: Rect, outer: Rect) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
export const norm = (x1: number, y1: number, x2: number, y2: number): Rect => ({ x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) });
export const rot2 = (x: number, y: number, deg: number) => { const a = (deg * Math.PI) / 180; return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) }; };

/* ---------- snapping ---------- */
export type SnapLine = { axis: 'x' | 'y'; pos: number; from: number; to: number };
export type SnapSource = { xs: number[]; ys: number[]; rects: Rect[] };
/** Snap a moving rect (world px) against candidate lines. Returns the correction and the lines that matched. */
export function snapRect(moving: Rect, src: SnapSource, threshold: number, grid?: number): { dx: number; dy: number; lines: SnapLine[] } {
  const mx = [moving.x, moving.x + moving.w / 2, moving.x + moving.w]; const my = [moving.y, moving.y + moving.h / 2, moving.y + moving.h];
  let bestX: { d: number; pos: number } | null = null; let bestY: { d: number; pos: number } | null = null;
  const tryX = (cand: number) => mx.forEach(m => { const d = cand - m; if (Math.abs(d) <= threshold && (!bestX || Math.abs(d) < Math.abs(bestX.d))) bestX = { d, pos: cand }; });
  const tryY = (cand: number) => my.forEach(m => { const d = cand - m; if (Math.abs(d) <= threshold && (!bestY || Math.abs(d) < Math.abs(bestY.d))) bestY = { d, pos: cand }; });
  src.xs.forEach(tryX); src.ys.forEach(tryY);
  if (grid && !bestX) { const g = Math.round(moving.x / grid) * grid; tryX(g); }
  if (grid && !bestY) { const g = Math.round(moving.y / grid) * grid; tryY(g); }
  const dx = bestX ? (bestX as { d: number }).d : 0; const dy = bestY ? (bestY as { d: number }).d : 0;
  const m2: Rect = { x: moving.x + dx, y: moving.y + dy, w: moving.w, h: moving.h };
  const lines: SnapLine[] = [];
  if (bestX) { const pos = (bestX as { pos: number }).pos; lines.push({ axis: 'x', pos, from: Math.min(m2.y, ...src.rects.filter(r => Math.abs(r.x - pos) < 1 || Math.abs(r.x + r.w - pos) < 1 || Math.abs(r.x + r.w / 2 - pos) < 1).map(r => r.y)), to: Math.max(m2.y + m2.h, ...src.rects.filter(r => Math.abs(r.x - pos) < 1 || Math.abs(r.x + r.w - pos) < 1 || Math.abs(r.x + r.w / 2 - pos) < 1).map(r => r.y + r.h)) }); }
  if (bestY) { const pos = (bestY as { pos: number }).pos; lines.push({ axis: 'y', pos, from: Math.min(m2.x, ...src.rects.filter(r => Math.abs(r.y - pos) < 1 || Math.abs(r.y + r.h - pos) < 1 || Math.abs(r.y + r.h / 2 - pos) < 1).map(r => r.x)), to: Math.max(m2.x + m2.w, ...src.rects.filter(r => Math.abs(r.y - pos) < 1 || Math.abs(r.y + r.h - pos) < 1 || Math.abs(r.y + r.h / 2 - pos) < 1).map(r => r.x + r.w)) }); }
  return { dx, dy, lines };
}

/* ---------- path utilities ---------- */
export function simplify(pts: { x: number; y: number }[], eps: number): { x: number; y: number }[] {
  if (pts.length < 3) return pts;
  const dist = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x; const dy = b.y - a.y; const len = dx * dx + dy * dy;
    if (!len) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  };
  let max = 0; let idx = 0;
  for (let i = 1; i < pts.length - 1; i += 1) { const d = dist(pts[i], pts[0], pts[pts.length - 1]); if (d > max) { max = d; idx = i; } }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}
/** Catmull-Rom → Bézier handles, so a freehand stroke becomes a smooth editable path. */
export function smoothPoints(pts: { x: number; y: number }[]): PathPoint[] {
  return pts.map((p, i) => {
    if (i === 0 || i === pts.length - 1) {
      const n = pts[i === 0 ? 1 : i - 1]; if (!n) return { x: p.x, y: p.y };
      const k = i === 0 ? 1 : -1; const dx = ((n.x - p.x) * k) / 3; const dy = ((n.y - p.y) * k) / 3;
      return i === 0 ? { x: p.x, y: p.y, hx2: dx, hy2: dy } : { x: p.x, y: p.y, hx1: -dx, hy1: -dy };
    }
    const a = pts[i - 1]; const b = pts[i + 1]; const hx = (b.x - a.x) / 6; const hy = (b.y - a.y) / 6;
    return { x: p.x, y: p.y, hx1: -hx, hy1: -hy, hx2: hx, hy2: hy };
  });
}
/** Re-fit a path's box to its anchors and handles. Returns the shifted points and the offset to add to the node position. */
export function normalizePath(pts: PathPoint[], pad: number): { pts: PathPoint[]; ox: number; oy: number; w: number; h: number } {
  const xs = pts.flatMap(p => [p.x, p.x + (p.hx1 ?? 0), p.x + (p.hx2 ?? 0)]); const ys = pts.flatMap(p => [p.y, p.y + (p.hy1 ?? 0), p.y + (p.hy2 ?? 0)]);
  // The visual box only needs the anchors; control handles can sit outside it because SVG overflow is visible.
  const ax = pts.map(p => p.x); const ay = pts.map(p => p.y); void xs; void ys;
  const minX = Math.min(...ax) - pad; const minY = Math.min(...ay) - pad;
  const w = Math.max(...ax) + pad - minX; const h = Math.max(...ay) + pad - minY;
  return { pts: pts.map(p => ({ ...p, x: p.x - minX, y: p.y - minY })), ox: minX, oy: minY, w: Math.max(2, w), h: Math.max(2, h) };
}
