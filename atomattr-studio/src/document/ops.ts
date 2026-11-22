import type { Bp, Node, Rect, Style } from './types';
import { cloneDeep, find, findParent, insertInto, isContainer, removeIds, updateNode, updateNodes, uid } from './tree';
import { mk } from './factory';
import { resolveNode } from './style';

export const rectOf = (n: Node): Rect => ({ x: Number(n.style.x ?? 0), y: Number(n.style.y ?? 0), w: typeof n.style.w === 'number' ? n.style.w : 0, h: typeof n.style.h === 'number' ? n.style.h : 0 });
export const union = (rs: Rect[]): Rect => {
  const x = Math.min(...rs.map(r => r.x)); const y = Math.min(...rs.map(r => r.y));
  return { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y };
};

/** Infer a recursive flex tree from free-positioned child rectangles using whitespace cuts. */
export function suggestLayout(node: Node): Node {
  const kids = node.children || [];
  if (!kids.length) return node;
  const sized = kids.map(n => ({ n, r: rectOf(n) })).filter(x => x.r.w > 0 && x.r.h > 0);
  if (sized.length !== kids.length || sized.length < 2) return { ...node, children: kids.map(suggestLayout) };
  const split = (items: typeof sized, axis: 'x'|'y'): { groups: Array<typeof sized>; gap: number } | null => {
    const start = axis === 'x' ? 'x' : 'y', size = axis === 'x' ? 'w' : 'h';
    const sorted = [...items].sort((a,b) => a.r[start]-b.r[start]); const groups: Array<typeof sized>=[]; let band: typeof sized=[]; let edge=-Infinity; let smallest=Infinity;
    for (const it of sorted) { const pos=it.r[start], end=pos+it.r[size]; if (band.length && pos-edge >= 4) { groups.push(band); smallest=Math.min(smallest,pos-edge); band=[]; } band.push(it); edge=Math.max(edge,end); }
    if (band.length) groups.push(band); return groups.length>1 ? {groups,gap:smallest} : null;
  };
  const x=split(sized,'x'), y=split(sized,'y');
  const chosen = x && (!y || x.groups.length >= y.groups.length) ? {v:x, dir:'row' as const, axis:'x' as const} : y ? {v:y,dir:'column' as const,axis:'y' as const} : null;
  if (!chosen) return { ...node, style:{...node.style, layout:'flex',dir:'column',gap:Math.max(0,Math.round((Math.min(...sized.map(a=>a.r.y))-Math.min(...sized.map(a=>a.r.y)))/4)*4)}, children:kids.map(suggestLayout) };
  const groups=chosen.v!.groups;
  const children=groups.map((g,i)=>{
    if(g.length===1) { const n=suggestLayout(g[0].n); return {...n,style:{...n.style,mode:'flow' as const}}; }
    const box=union(g.map(a=>a.r)); const sub:Node={id:`suggest-${node.id}-${i}`,type:'container',name:'Auto layout group',style:{x:0,y:0,w:box.w,h:box.h,layout:'free'},children:g.map(a=>({...a.n,style:{...a.n.style,x:a.r.x-box.x,y:a.r.y-box.y,mode:'flow' as const}}))}; const inferred=suggestLayout(sub); return {...inferred,style:{...inferred.style,x:box.x,y:box.y,mode:'flow' as const}};
  });
  const gaps=groups.slice(1).map((g,i)=>{const prev=groups[i]; const end=Math.max(...prev.map(a=>a.r[chosen.axis]+a.r[chosen.axis==='x'?'w':'h'])); return Math.min(...g.map(a=>a.r[chosen.axis]))-end;}).filter(v=>v>=0).sort((a,b)=>a-b);
  const gap=Math.max(0,Math.round((gaps[Math.floor(gaps.length/2)]||0)/4)*4);
  return {...node,style:{...node.style,layout:'flex',dir:chosen.dir,gap},children};
}

/** Selected ids reduced to those whose ancestors are not also selected. */
export function topLevel(root: Node, ids: string[]): string[] {
  const set = new Set(ids);
  return ids.filter(id => { let cur = findParent(root, id); while (cur) { if (set.has(cur.parent.id)) return false; cur = findParent(root, cur.parent.id); } return true; });
}

export function groupNodes(root: Node, ids: string[]): { root: Node; groupId: string | null } {
  const tops = topLevel(root, ids);
  if (tops.length < 1) return { root, groupId: null };
  const first = findParent(root, tops[0]);
  if (!first) return { root, groupId: null };
  const parentId = first.parent.id;
  const sameParent = tops.filter(id => findParent(root, id)?.parent.id === parentId);
  const nodes = sameParent
    .map(id => find(root, id)!)
    .filter(n => n.style.mode !== 'flow' && typeof n.style.w === 'number')
    .sort((a, b) => (findParent(root, a.id)?.index ?? 0) - (findParent(root, b.id)?.index ?? 0));
  if (!nodes.length) return { root, groupId: null };
  const box = union(nodes.map(rectOf));
  const group = mk('group', 'Group', { x: box.x, y: box.y, w: box.w, h: box.h, layout: 'free' }, {
    children: nodes.map(n => ({ ...n, style: { ...n.style, x: Number(n.style.x ?? 0) - box.x, y: Number(n.style.y ?? 0) - box.y } })),
  });
  const index = Math.min(...nodes.map(n => findParent(root, n.id)!.index));
  let next = removeIds(root, new Set(nodes.map(n => n.id)));
  next = insertInto(next, parentId, group, index);
  return { root: next, groupId: group.id };
}

export function ungroupNode(root: Node, id: string): { root: Node; ids: string[] } {
  const g = find(root, id); const loc = findParent(root, id);
  if (!g || g.type !== 'group' || !loc) return { root, ids: [] };
  const gx = Number(g.style.x ?? 0); const gy = Number(g.style.y ?? 0);
  const kids = (g.children || []).map(c => ({ ...c, style: { ...c.style, x: Number(c.style.x ?? 0) + gx, y: Number(c.style.y ?? 0) + gy } }));
  let next = removeIds(root, new Set([id]));
  kids.forEach((k, i) => { next = insertInto(next, loc.parent.id, k, loc.index + i); });
  return { root: next, ids: kids.map(k => k.id) };
}

export function deleteNodes(root: Node, ids: string[]) { return removeIds(root, new Set(ids.filter(id => id !== root.id))); }

export function duplicateNodes(root: Node, ids: string[], offset = 16): { root: Node; ids: string[] } {
  let next = root; const made: string[] = [];
  topLevel(root, ids).forEach(id => {
    const loc = findParent(next, id); const src = find(next, id);
    if (!loc || !src) return;
    const copy = cloneDeep(src); copy.name = src.name;
    if (copy.style.mode !== 'flow') { copy.style.x = Number(copy.style.x ?? 0) + offset; copy.style.y = Number(copy.style.y ?? 0) + offset; }
    next = insertInto(next, loc.parent.id, copy, loc.index + 1); made.push(copy.id);
  });
  return { root: next, ids: made };
}

export function reorder(root: Node, id: string, to: 'front' | 'back' | 'forward' | 'backward'): Node {
  const loc = findParent(root, id); if (!loc) return root;
  const len = loc.parent.children!.length;
  const target = to === 'front' ? len - 1 : to === 'back' ? 0 : to === 'forward' ? Math.min(len - 1, loc.index + 1) : Math.max(0, loc.index - 1);
  if (target === loc.index) return root;
  return updateNode(root, loc.parent.id, p => { const c = [...p.children!]; const [item] = c.splice(loc.index, 1); c.splice(target, 0, item); return { ...p, children: c }; });
}

/** Move a node into a new parent / index. Refuses to drop a node inside itself.
 *
 * The insertion index is always the desired index in the target parent's children after
 * removing the dragged item. This keeps same-parent reordering and cross-parent moves in
 * sync without an off-by-one drift.
 */
export function getFlowReorderTarget(
  rects: Array<{ left: number; right: number; width: number; top?: number; bottom?: number; height?: number } | null>,
  point: number,
  horizontal = true,
  justify: 'start' | 'center' | 'end' | 'between' = 'start',
): number {
  const items = rects.filter((r): r is { left: number; right: number; width: number; top?: number; bottom?: number; height?: number } => !!r && Number.isFinite(r.left) && Number.isFinite(r.right));
  if (!items.length) return 0;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const start = horizontal ? item.left : item.top ?? item.left;
    const size = horizontal ? item.width : item.height ?? item.width;
    const end = horizontal ? item.right : item.bottom ?? item.right;
    const mid = start + size / 2;
    if (point <= mid) return i;
    if (justify === 'between' && i < items.length - 1) {
      const nextStart = horizontal ? items[i + 1].left : items[i + 1].top ?? items[i + 1].left;
      const gap = (end + nextStart) / 2;
      if (point <= gap) return i + 1;
    }
  }
  return items.length;
}


export type SlotRect = { left: number; right: number; top: number; bottom: number };

/**
 * Slot-based drop target for flow children (flex row/column, wrapped flex, grid).
 *
 * `rects` are the screen rects of ALL children in order, including the dragged one (null = hidden).
 * The slot under the pointer is the child whose box contains it, or the nearest box when the pointer
 * is in a gap, below the last row, or in an empty grid cell. The dragged item takes that slot's
 * index, which is also the correct insertion index once it is removed from its old place.
 * This works the same for space-between, centred, wrapped and grid layouts, in both axes.
 */
export function getSlotTarget(rects: Array<SlotRect | null>, point: { x: number; y: number }, current: number): number {
  let best = -1; let bestDist = Infinity;
  rects.forEach((r, i) => {
    if (!r) return;
    const dx = point.x < r.left ? r.left - point.x : point.x > r.right ? point.x - r.right : 0;
    const dy = point.y < r.top ? r.top - point.y : point.y > r.bottom ? point.y - r.bottom : 0;
    const dist = Math.hypot(dx, dy);
    // On a tie (a gap, or an empty cell) prefer the later slot: empty cells sit after the last item.
    if (dist <= bestDist + 0.5) { best = i; bestDist = Math.min(dist, bestDist); }
  });
  return best < 0 ? Math.max(0, current) : best;
}

export function moveNode(root: Node, id: string, parentId: string, index: number): Node {
  const node = find(root, id); const target = find(root, parentId);
  if (!node || !target || !isContainer(target) || id === parentId || (node.children && find(node, parentId))) return root;
  const loc = findParent(root, id); if (!loc) return root;
  const sourceParent = loc.parent;
  const bps: Bp[] = ['desktop', 'tablet', 'mobile'];
  const moveStyle = (style: Style, bp: Bp): Style => {
    const parentLayout = resolveNode(target, bp);
    const flow = parentLayout.layout === 'grid' || parentLayout.stacked;
    const next: Style = { ...style, mode: flow ? 'flow' : 'abs' };
    if (flow) {
      // Grid and auto-stacked layouts are the only ones that truly lock child placement.
      // Flex sections remain capable of freeform placement so the user can drag objects by hand.
      delete next.x; delete next.y;
      if (node.type === 'text' || node.type === 'heading') next.h = 'auto';
      if (node.type !== 'shape' && next.w === undefined) next.w = 'fill';
    } else {
      // Keep explicit responsive coordinates when present; only seed missing geometry.
      // An explicitly chosen `h: 'auto'` must stay auto, even in freeform parents.
      if (typeof next.x !== 'number') next.x = typeof style.x === 'number' ? style.x : 24;
      if (typeof next.y !== 'number') next.y = typeof style.y === 'number' ? style.y : 24;
      if (next.w === 'fill') next.w = typeof sourceParent.style.w === 'number' ? Math.max(40, Math.min(320, sourceParent.style.w - 48)) : 320;
      if (next.h === undefined && node.type !== 'text' && node.type !== 'heading') next.h = 120;
    }
    return next;
  };
  let moved: Node = { ...node, style: moveStyle(node.style, 'desktop') };
  const nextBp: NonNullable<Node['bp']> = { ...node.bp };
  for (const bp of ['tablet', 'mobile'] as const) {
    // Apply the new parent positioning contract at each breakpoint without flattening
    // the user's unrelated responsive overrides into the desktop style.
    const existing = node.bp?.[bp] || {};
    const resolved = { ...node.style, ...(bp === 'mobile' ? node.bp?.tablet || {} : {}), ...existing };
    const adjusted = moveStyle(resolved, bp);
    const override: Style = { ...existing, mode: adjusted.mode };
    const targetResolved = resolveNode(target, bp);
    const targetIsFlow = targetResolved.layout === 'grid' || targetResolved.stacked;
    for (const key of ['x', 'y', 'w', 'h'] as const) {
      // Do not materialize inherited desktop geometry as a breakpoint override.
      // Existing per-breakpoint geometry remains independent in freeform parents;
      // stale coordinates are removed when the new parent uses a locked grid/stacked layout.
      if (targetIsFlow && (key === 'x' || key === 'y')) delete override[key];
      else if (key in existing && key in adjusted) (override as Record<string, unknown>)[key] = adjusted[key];
    }
    nextBp[bp] = override;
  }
  moved.bp = nextBp;
  const without = removeIds(root, new Set([id]));
  const parentChildren = find(without, parentId)?.children || [];
  const safeIndex = Math.max(0, Math.min(parentChildren.length, index));
  return insertInto(without, parentId, moved, safeIndex);
}

export type AlignKind = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';
export function alignNodes(root: Node, ids: string[], kind: AlignKind, bounds?: Rect): Node {
  const nodes = ids.map(id => find(root, id)).filter((n): n is Node => !!n && typeof n.style.w === 'number' && typeof n.style.h === 'number');
  if (!nodes.length) return root;
  const box = bounds || union(nodes.map(rectOf));
  return updateNodes(root, new Set(nodes.map(n => n.id)), n => {
    const r = rectOf(n); const s = { ...n.style };
    if (kind === 'left') s.x = box.x; if (kind === 'right') s.x = box.x + box.w - r.w; if (kind === 'hcenter') s.x = box.x + (box.w - r.w) / 2;
    if (kind === 'top') s.y = box.y; if (kind === 'bottom') s.y = box.y + box.h - r.h; if (kind === 'vcenter') s.y = box.y + (box.h - r.h) / 2;
    return { ...n, style: s };
  });
}
export function distributeNodes(root: Node, ids: string[], axis: 'x' | 'y'): Node {
  const nodes = ids.map(id => find(root, id)).filter((n): n is Node => !!n && typeof n.style.w === 'number' && typeof n.style.h === 'number');
  if (nodes.length < 3) return root;
  const size = axis === 'x' ? 'w' : 'h';
  const sorted = [...nodes].sort((a, b) => rectOf(a)[axis] - rectOf(b)[axis]);
  const first = rectOf(sorted[0]); const last = rectOf(sorted[sorted.length - 1]);
  const total = last[axis] + last[size] - first[axis]; const used = sorted.reduce((s, n) => s + rectOf(n)[size], 0);
  const gap = (total - used) / (sorted.length - 1);
  let cursor = first[axis]; const pos = new Map<string, number>();
  sorted.forEach(n => { pos.set(n.id, cursor); cursor += rectOf(n)[size] + gap; });
  return updateNodes(root, new Set(pos.keys()), n => ({ ...n, style: { ...n.style, [axis]: pos.get(n.id) } }));
}

/** Convert a rect/ellipse/polygon/star into a path so its nodes can be edited. */
export function shapeToPath(n: Node): Node | null {
  if (n.type !== 'shape') return null;
  const w = typeof n.style.w === 'number' ? n.style.w : 0; const h = typeof n.style.h === 'number' ? n.style.h : 0;
  const pts: Node['pts'] = [];
  if (n.shape === 'rect') pts.push({ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h });
  else if (n.shape === 'ellipse') {
    const k = 0.5523; const rx = w / 2; const ry = h / 2; const cx = rx; const cy = ry;
    pts.push({ x: cx, y: 0, hx1: -rx * k, hy1: 0, hx2: rx * k, hy2: 0 }, { x: w, y: cy, hx1: 0, hy1: -ry * k, hx2: 0, hy2: ry * k }, { x: cx, y: h, hx1: rx * k, hy1: 0, hx2: -rx * k, hy2: 0 }, { x: 0, y: cy, hx1: 0, hy1: ry * k, hx2: 0, hy2: -ry * k });
  } else {
    const count = n.shape === 'star' ? (n.points || 5) * 2 : (n.points || 6);
    for (let i = 0; i < count; i += 1) {
      const a = (Math.PI * 2 * i) / count - Math.PI / 2; const r = n.shape === 'star' && i % 2 ? (n.inner ?? 0.5) : 1;
      pts.push({ x: w / 2 + Math.cos(a) * r * (w / 2), y: h / 2 + Math.sin(a) * r * (h / 2) });
    }
  }
  return { ...n, type: 'path', name: n.name, shape: undefined, pts, closed: true, vw: w, vh: h, style: { ...n.style, stroke: n.style.stroke || '#111827', strokeWidth: n.style.strokeWidth || 2 } };
}

export const newId = uid;

/** Scale a group's children when the group is resized: x/w by fx (their reference width scales with the group), y/h by fy. */
export function scaleChildren(node: Node, fx: number, fy: number): Node {
  if (!node.children) return node;
  return {
    ...node,
    children: node.children.map(c => {
      const s = { ...c.style };
      if (typeof s.x === 'number') s.x *= fx; if (typeof s.w === 'number') s.w *= fx;
      if (typeof s.y === 'number') s.y *= fy; if (typeof s.h === 'number') s.h *= fy;
      if (s.fontSize && Math.abs(fx - fy) < 0.02) s.fontSize *= fx;
      return scaleChildren({ ...c, style: s }, fx, fy);
    }),
  };
}
