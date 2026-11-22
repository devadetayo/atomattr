import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import type { Node, PathPoint, Rect } from '../document/types';
import { buildGen } from '../document/gen';
import { BPS, BP_LABEL, BP_WIDTH, explicitStyle } from '../document/style';
import { find, findParent, flatten, isContainer, pathTo, updateNode } from '../document/tree';
import { refWidth } from '../document/attrs';
import { makeButton, makeHeading, makeImage, makePath, makeShape, makeText, makeSection, makeContainer, makeGrid, makeLine } from '../document/factory';
import { rectOf, scaleChildren, topLevel } from '../document/ops';
import * as S from '../state/store';
import { getState, useStudio, type Tool } from '../state/store';
import { pickImages, readImage, registerAsset } from '../state/assets';
import { RenderTree } from './Render';
import { Overlay, type Anchor, type PenPreview } from './Overlay';
import { Rulers, RULER } from './Rulers';
import { ContextToolbar } from './ContextToolbar';
import { boxRect, inside, intersects, nodeEl, norm, normalizePath, rot2, screenBox, simplify, smoothPoints, snapRect, totalRotation, unionRect, type ScreenBox, type SnapLine, type SnapSource } from './geom';
import { insertPointNear } from './pathops';
import { keys } from './keys';
import { elOf, keyOf } from './registry';
import { clamp } from '../state/layout';
import { ACCENT } from '../theme';
import { T } from '../theme';
import { IconBtn } from '../components/ui';
import type React from 'react';

type Pt = { x: number; y: number };
type Live = { marquee: Rect | null; draft: Rect | null; draftKind: string | null; snap: SnapLine[]; pen: PenPreview | null; pencil: Pt[] | null; sizeLabel: string | null; guideDrag: { axis: 'x' | 'y'; pos: number } | null };
const NO_LIVE: Live = { marquee: null, draft: null, draftKind: null, snap: [], pen: null, pencil: null, sizeLabel: null, guideDrag: null };
type Measured = { boxes: ScreenBox[]; hover: ScreenBox | null; enter: ScreenBox | null; page: Rect | null; anchors: Anchor[] };

const DRAW: Partial<Record<Tool, string>> = { rect: 'rect', rounded: 'rect', ellipse: 'ellipse', polygon: 'polygon', star: 'star', container: 'rect', grid: 'rect', text: 'rect', heading: 'rect', button: 'rect', image: 'rect', line: 'line' };
const HANDLE_DIR: Record<string, [number, number]> = { nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0] };

type PenPt = PathPoint & { _drag?: boolean };

function Scrollbars({ stage, view, pw, ph }: { stage: { w: number; h: number }; view: { zoom: number; px: number; py: number }; pw: number; ph: number }) {
  const M = 120; const bar = (axis: 'x' | 'y') => {
    const vp = axis === 'x' ? stage.w : stage.h; const total = (axis === 'x' ? pw : ph) * view.zoom + M * 2; const track = vp - 30; const off = M - (axis === 'x' ? view.px : view.py);
    const max = Math.max(1, total - vp); const thumb = Math.max(30, Math.min(track, (vp / total) * track)); const pos = Math.max(0, Math.min(track - thumb, (off / max) * (track - thumb)));
    const start = (e: React.PointerEvent) => { e.stopPropagation(); e.preventDefault(); const sx = axis === 'x' ? e.clientX : e.clientY; const v0 = getState().view; const mv = (ev: PointerEvent) => { const d = (axis === 'x' ? ev.clientX : ev.clientY) - sx; const o = off + d * (max / Math.max(1, track - thumb)); S.setView(axis === 'x' ? { ...v0, px: M - o } : { ...v0, py: M - o }); }; const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); };
    return axis === 'y'
      ? <Box position="absolute" right="2px" top="22px" w="8px" h={`${track}px`} z="25" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}><Box position="absolute" top={`${pos}px`} w="8px" h={`${thumb}px`} rounded="full" bg="gray-400/60" hover-bg="gray-500" cursor="pointer" onPointerDown={start} title="Scroll" /></Box>
      : <Box position="absolute" bottom="2px" left="22px" h="8px" w={`${track}px`} z="25" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}><Box position="absolute" left={`${pos}px`} h="8px" w={`${thumb}px`} rounded="full" bg="gray-400/60" hover-bg="gray-500" cursor="pointer" onPointerDown={start} title="Scroll" /></Box>;
  };
  return <>{bar('y')}{bar('x')}</>;
}

export function Canvas() {
  const s = useStudio();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<null | Record<string, any>>(null);
  const pen = useRef<{ pts: PenPt[]; cursor: Pt | null; parent: string | null } | null>(null);
  const touches = useRef(new Map<number, Pt>());
  const lastKey = useRef('');
  const [live, setLive] = useState<Live>(NO_LIVE);
  const patchLive = (p: Partial<Live>) => setLive(l => ({ ...l, ...p }));
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [m, setM] = useState<Measured>({ boxes: [], hover: null, enter: null, page: null, anchors: [] });
  const [panning, setPanning] = useState(false);
  const [altDown, setAltDown] = useState(false);
  const armedComp = useRef<string | null>(null); // component the Component tool places

  const project = s.project!; const page = S.page(s); const rootNode = page.root;
  const gen = useMemo(() => buildGen(rootNode, s.bp, 'editor', [], null, null, {...project,activeState:s.attrState==='base'?undefined:s.attrState}), [rootNode, s.bp, project,s.attrState]);
  const zoom = s.view.zoom;

  useEffect(() => {
    const down=(e:KeyboardEvent)=>{if(e.key==='Alt')setAltDown(true);};const up=(e:KeyboardEvent)=>{if(e.key==='Alt')setAltDown(false);};const blur=()=>setAltDown(false);
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[]);

  /* ---------- geometry helpers ---------- */
  const stageRect = () => stageRef.current!.getBoundingClientRect();
  const stagePt = (e: { clientX: number; clientY: number }): Pt => { const r = stageRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const worldPt = (p: Pt): Pt => { const v = getState().view; return { x: (p.x - v.px) / v.zoom, y: (p.y - v.py) / v.zoom }; };
  const worldRectOf = (el: HTMLElement): Rect => { const wr = worldRef.current!.getBoundingClientRect(); const r = el.getBoundingClientRect(); const z = getState().view.zoom; return { x: (r.left - wr.left) / z, y: (r.top - wr.top) / z, w: r.width / z, h: r.height / z }; };

  /** The unit the user means when they click at (x, y): groups are atomic until entered, locked nodes are skipped. */
  const hitAt = (cx: number, cy: number): string | null => {
    const st = getState(); const r = S.root(st);
    const artboard = worldRef.current?.getBoundingClientRect();
    if (!artboard || cx < artboard.left || cx > artboard.right || cy < artboard.top || cy > artboard.bottom) return null;
    for (const el of document.elementsFromPoint(cx, cy)) {
      const id = keyOf(el); if (!id || id.includes(':')) continue;
      const path = pathTo(r, id); if (!path || path.some(n => n.locked)) continue;
      const hit = S.resolveHit(id, st); if (!hit || hit === r.id) return null; return hit;
    }
    return null;
  };

  /** Container under a point (for drawing): deepest container that may receive children. */
  const containerAt = (cx: number, cy: number): Node => {
    const st = getState(); const r = S.root(st); const allowed = S.allowedGroups(st);
    for (const el of document.elementsFromPoint(cx, cy)) {
      const id = keyOf(el); if (!id || id.includes(':')) continue; const n = find(r, id);
      if (n && isContainer(n) && (n.type !== 'group' || allowed.has(n.id)) && !pathTo(r, id)!.some(x => x.locked)) return n;
    }
    return r;
  };
  /** Convert a client point to design units inside `parent` (x scaled by the reference width, y in px). */
  const toLocal = (parent: Node, cx: number, cy: number) => {
    const st = getState(); const el = nodeEl(parent.id)!; const r = el.getBoundingClientRect(); const z = st.view.zoom;
    const chain = pathTo(S.root(st), parent.id) || [parent]; const ref = refWidth(chain, st.bp); const wp = el.clientWidth || 1;
    return { x: ((cx - r.left) / z) * (ref / wp), y: (cy - r.top) / z, k: ref / wp };
  };

  /* ---------- measuring (overlay aligns with the DOM at every zoom) ---------- */
  useLayoutEffect(() => {
    const stage = stageRef.current; const world = worldRef.current; if (!stage || !world) return;
    const st = getState(); const sr = stage.getBoundingClientRect(); const r = S.root(st);
    const boxFor = (id: string) => { const el = nodeEl(id); return el ? screenBox(el, sr, st.view.zoom, totalRotation(r, id, st.bp)) : null; };
    const boxes = st.sel.map(boxFor).filter((b): b is ScreenBox => !!b);
    const hover = hoverId && !drag.current ? boxFor(hoverId) : null;
    const enter = st.enter ? boxFor(st.enter) : null;
    const wr = world.getBoundingClientRect();
    const pageRect = { x: wr.left - sr.left, y: wr.top - sr.top, w: wr.width, h: wr.height };
    const anchors: Anchor[] = [];
    const sole = st.sel.length === 1 ? find(r, st.sel[0]) : null;
    if (sole && sole.type === 'path' && st.tool === 'direct' && boxes[0]) {
      const b = boxes[0]; const n = sole; const sx = b.w / (n.vw || b.w); const sy = b.h / (n.vh || b.h);
      const tp = (lx: number, ly: number): Pt => { const o = rot2(lx * sx - b.w / 2, ly * sy - b.h / 2, b.rot); return { x: b.cx + o.x, y: b.cy + o.y }; };
      (n.pts || []).forEach((p, i) => {
        const a = tp(p.x, p.y);
        anchors.push({ i, x: a.x, y: a.y, selected: st.pointPick?.id === n.id && st.pointPick.index === i, corner: p.hx1 === undefined && p.hx2 === undefined,
          h1: p.hx1 !== undefined || p.hy1 !== undefined ? tp(p.x + (p.hx1 ?? 0), p.y + (p.hy1 ?? 0)) : undefined, h2: p.hx2 !== undefined || p.hy2 !== undefined ? tp(p.x + (p.hx2 ?? 0), p.y + (p.hy2 ?? 0)) : undefined });
      });
    }
    const key = JSON.stringify([boxes, hover, enter, pageRect, anchors, st.stage]);
    if (key !== lastKey.current) { lastKey.current = key; setM({ boxes, hover, enter, page: pageRect, anchors }); }
    S.setPageH(world.offsetHeight);
  });

  /* ---------- stage size ---------- */
  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); S.setStage(r.width, r.height); });
    ro.observe(el); const r = el.getBoundingClientRect(); S.setStage(r.width, r.height);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { const t = setTimeout(() => S.fit('page'), 50); return () => clearTimeout(t); }, [s.stage.w > 0 && Math.round(s.stage.w / 40), Math.round(s.stage.h / 40)]);

  /* ---------- wheel: zoom to cursor, or pan. Never scrolls the page. ---------- */
  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); const st = getState(); const p = { x: e.clientX - el.getBoundingClientRect().left, y: e.clientY - el.getBoundingClientRect().top };
      if (e.ctrlKey || e.metaKey) { S.zoomAt(st.view.zoom * Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.01)), p.x, p.y); return; }
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX; const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
      S.setView({ zoom: st.view.zoom, px: st.view.px - dx, py: st.view.py - dy });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  /* ---------- window pointer plumbing ---------- */
  const track = useCallback((kind: string, extra: Record<string, unknown>, onMove: (e: PointerEvent) => void, onUp: (e: PointerEvent, moved: boolean) => void) => {
    drag.current = { kind, moved: false, ...extra };
    const move = (e: PointerEvent) => { const d = drag.current; if (!d) return; if (!d.moved && Math.hypot(e.clientX - d.cx0, e.clientY - d.cy0) > 3) d.moved = true; if (d.moved || d.always) onMove(e); };
    const up = (e: PointerEvent) => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); const d = drag.current; drag.current = null; onUp(e, !!d?.moved); setLive(l => ({ ...l, snap: [], sizeLabel: null })); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }, []);

  /* ---------- pan ---------- */
  const startPan = (e: React.PointerEvent) => {
    const v = getState().view; setPanning(true);
    track('pan', { cx0: e.clientX, cy0: e.clientY, always: true }, ev => S.setView({ zoom: v.zoom, px: v.px + ev.clientX - e.clientX, py: v.py + ev.clientY - e.clientY }), () => setPanning(false));
  };

  /* ---------- snapping sources ---------- */
  const snapSources = (excludeIds: Set<string>, parentId: string | null): SnapSource => {
    const st = getState(); const pageW = S.bpWidth(st); const rects: Rect[] = []; const xs = [0, pageW / 2, pageW]; const ys: number[] = [];
    if (parentId) { const pe = nodeEl(parentId); if (pe) { const pr = worldRectOf(pe); rects.push(pr); xs.push(pr.x, pr.x + pr.w / 2, pr.x + pr.w); ys.push(pr.y, pr.y + pr.h / 2, pr.y + pr.h); } }
    const parent = parentId ? find(S.root(st), parentId) : null;
    (parent?.children || []).forEach(c => { if (excludeIds.has(c.id) || c.hidden) return; const el = nodeEl(c.id); if (!el) return; const r = worldRectOf(el); rects.push(r); xs.push(r.x, r.x + r.w / 2, r.x + r.w); ys.push(r.y, r.y + r.h / 2, r.y + r.h); });
    if (st.layout.guides) S.page(st).guides.forEach(g => (g.axis === 'x' ? xs.push(g.pos) : ys.push(g.pos)));
    return { xs, ys, rects };
  };
  const toScreenLine = (l: SnapLine): SnapLine => { const v = getState().view; return l.axis === 'x' ? { axis: 'x', pos: l.pos * v.zoom + v.px, from: l.from * v.zoom + v.py, to: l.to * v.zoom + v.py } : { axis: 'y', pos: l.pos * v.zoom + v.py, from: l.from * v.zoom + v.px, to: l.to * v.zoom + v.px }; };

  /* ---------- move ---------- */
  const startMove = (e: React.PointerEvent, ids: string[]) => {
    const st = getState(); const r = S.root(st);
    const tops = topLevel(r, ids).filter(id => !pathTo(r, id)?.some(n => n.locked));
    if (!tops.length) return;
    const first = findParent(r, tops[0]); if (!first) return;
    const parentId = first.parent.id;
    const movable = tops.filter(id => { const n = find(r, id)!; const el = nodeEl(id); return !!el && el.style.position !== 'static' && getComputedStyle(el).position === 'absolute'; });
    if (!movable.length) {
      // Flow children (flex/grid) are reordered, not positioned.
      const stacked = !!tops.length && getComputedStyle(nodeEl(tops[0])!).position !== 'absolute';
      startReorder(e, tops[0], parentId, stacked); return;
    }
    let ids2 = movable;
    if (e.altKey) { S.begin0(); S.duplicateSelection(); S.end0(); ids2 = getState().sel; }
    const items = ids2.map(id => { const el = nodeEl(id)!; const pel = el.offsetParent as HTMLElement; const n = find(S.root(), id)!; return { id, el, startLeft: el.offsetLeft, startTop: el.offsetTop, wp: pel.clientWidth || 1, ref: refWidth(pathTo(S.root(), id)!.slice(0, -1), st.bp), rect: worldRectOf(el), explicitX: explicitStyle(n, st.bp).x }; });
    const start = unionRect(items.map(i => i.rect))!; const src = snapSources(new Set(ids2), parentId);
    let begun = false; const origin = { x: e.clientX, y: e.clientY };
    track('move', { cx0: e.clientX, cy0: e.clientY }, ev => {
      const z = getState().view.zoom; let dx = (ev.clientX - origin.x) / z; let dy = (ev.clientY - origin.y) / z;
      if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      let lines: SnapLine[] = [];
      if (getState().layout.snap && !ev.altKey) { const sn = snapRect({ ...start, x: start.x + dx, y: start.y + dy }, src, 6 / z, getState().layout.grid ? 8 : undefined); dx += sn.dx; dy += sn.dy; lines = sn.lines.map(toScreenLine); }
      if (!begun) { S.begin0(); begun = true; }
      S.mutate(rr => { let cur = rr; items.forEach(it => { cur = updateNode(cur, it.id, n => ({ ...n, ...patch(n, { x: (it.startLeft + dx) * (it.ref / it.wp), y: it.startTop + dy }) })); }); return cur; });
      patchLive({ snap: lines });
    }, () => { if (begun) S.end0(); });
  };
  const patch = (n: Node, p: Record<string, number>): Pick<Node, 'style' | 'bp'> => {
    const bp = getState().bp; const rounded = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Math.round(v * 100) / 100]));
    if (bp === 'desktop') return { style: { ...n.style, ...rounded }, bp: n.bp };
    return { style: n.style, bp: { ...n.bp, [bp]: { ...(n.bp?.[bp] || {}), ...rounded } } };
  };

  /** Drag a flow child (flex / grid / stacked) to a new place among its siblings. */
  const startReorder = (e: React.PointerEvent, id: string, parentId: string, stacked: boolean) => {
    if (stacked) { S.toast('This layout stacks automatically at this size. Rearrange it on Desktop, or override the layout here.'); return; }
    const st = getState(); const parent = find(S.root(st), parentId)!; const sibs = (parent.children || []).filter(c => c.id !== id);
    let target = -1;
    track('reorder', { cx0: e.clientX, cy0: e.clientY }, ev => {
      const rects = sibs.map(c => { const el = nodeEl(c.id); return el ? el.getBoundingClientRect() : null; });
      const horizontal = parent.style.layout === 'grid' || parent.style.dir === 'row';
      let idx = sibs.length;
      for (let i = 0; i < rects.length; i += 1) { const r = rects[i]; if (!r) continue; const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2; if ((horizontal ? ev.clientX : ev.clientY) < mid) { idx = i; break; } }
      target = idx;
      const ref = rects[Math.min(idx, rects.length - 1)]; const sr = stageRect();
      if (ref) patchLive({ snap: [horizontal ? { axis: 'x', pos: (idx >= rects.length ? ref.right : ref.left) - sr.left, from: ref.top - sr.top, to: ref.bottom - sr.top } : { axis: 'y', pos: (idx >= rects.length ? ref.bottom : ref.top) - sr.top, from: ref.left - sr.left, to: ref.right - sr.left }] });
    }, (_ev, moved) => { if (moved && target >= 0) { const full = parent.children || []; const from = full.findIndex(c => c.id === id); S.moveInto(id, parentId, target + (from >= 0 && from < target ? 1 : 0)); } });
  };

  /* ---------- resize ---------- */
  const startResize = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const st = getState(); const r = S.root(st); const ids = topLevel(r, st.sel);
    const [sx, sy] = HANDLE_DIR[handle];
    const info = ids.map(id => {
      const n = find(r, id)!; const el = nodeEl(id)!; const pel = (el.offsetParent as HTMLElement) || el.parentElement!; const chain = pathTo(r, id)!;
      const abs = getComputedStyle(el).position === 'absolute'; const ref = refWidth(chain.slice(0, -1), st.bp);
      return { id, n, abs, wp: pel.clientWidth || 1, ref, w0: el.offsetWidth, h0: el.offsetHeight, l0: el.offsetLeft, t0: el.offsetTop, own: explicitStyle(n, st.bp).rotation || 0, anc: totalRotation(r, id, st.bp) - (explicitStyle(n, st.bp).rotation || 0), text: (n.type === 'text' || n.type === 'heading') && typeof explicitStyle(n, st.bp).h !== 'number', rect: worldRectOf(el) };
    });
    if (!info.length) return;
    let begun = false; const origin = { x: e.clientX, y: e.clientY };
    track('resize', { cx0: e.clientX, cy0: e.clientY }, ev => {
      const z = getState().view.zoom; const d = { x: (ev.clientX - origin.x) / z, y: (ev.clientY - origin.y) / z };
      if (!begun) { S.begin0(); begun = true; }
      if (info.length === 1) {
        const it = info[0]; const dp = rot2(d.x, d.y, -it.anc); const dl = rot2(dp.x, dp.y, -it.own);
        const ey = it.text ? 0 : sy; const center = ev.altKey;
        let w1 = sx ? Math.max(8, it.w0 + sx * dl.x * (center ? 2 : 1)) : it.w0; let h1 = ey ? Math.max(8, it.h0 + ey * dl.y * (center ? 2 : 1)) : it.h0;
        if (ev.shiftKey && sx && ey) { const ratio = it.w0 / it.h0; if (Math.abs(w1 - it.w0) / it.w0 > Math.abs(h1 - it.h0) / it.h0) h1 = w1 / ratio; else w1 = h1 * ratio; }
        const A0 = center ? { x: 0, y: 0 } : { x: -sx * it.w0 / 2, y: -ey * it.h0 / 2 }; const A1 = center ? { x: 0, y: 0 } : { x: -sx * w1 / 2, y: -ey * h1 / 2 };
        const c0 = { x: it.l0 + it.w0 / 2, y: it.t0 + it.h0 / 2 }; const aw = rot2(A0.x, A0.y, it.own); const an = rot2(A1.x, A1.y, it.own);
        const c1 = { x: c0.x + aw.x - an.x, y: c0.y + aw.y - an.y }; const left1 = c1.x - w1 / 2; const top1 = c1.y - h1 / 2; const k = it.abs ? it.ref / it.wp : 1;
        S.mutate(rr => updateNode(rr, it.id, n => {
          const p: Record<string, number> = { w: w1 * k }; if (!it.text) p.h = h1; if (it.abs) { p.x = left1 * k; p.y = top1; }
          let next: Node = { ...n, ...patch(n, p) };
          if (n.type === 'group' && typeof explicitStyle(n, getState().bp).w === 'number') { const w0d = explicitStyle(n, getState().bp).w as number; const h0d = explicitStyle(n, getState().bp).h as number; next = scaleChildren(next, (w1 * k) / w0d, h1 / (typeof h0d === 'number' ? h0d : it.h0)); }
          return next;
        }));
        patchLive({ sizeLabel: `${Math.round(w1)} × ${Math.round(h1)}` });
        return;
      }
      const u = unionRect(info.map(i => i.rect))!; const fx = sx ? Math.max(0.05, (u.w + sx * d.x) / u.w) : 1; const fy = sy ? Math.max(0.05, (u.h + sy * d.y) / u.h) : 1;
      const ax = sx > 0 ? u.x : sx < 0 ? u.x + u.w : u.x; const ay = sy > 0 ? u.y : sy < 0 ? u.y + u.h : u.y;
      S.mutate(rr => { let cur = rr; info.forEach(it => { if (!it.abs) return; const nl = ax + (it.rect.x - ax) * fx; const nt = ay + (it.rect.y - ay) * fy; const k = it.ref / it.wp; cur = updateNode(cur, it.id, n => ({ ...n, ...patch(n, { x: (it.l0 + (nl - it.rect.x)) * k, y: it.t0 + (nt - it.rect.y), w: it.w0 * fx * k, ...(it.text ? {} : { h: it.h0 * fy }) }) })); }); return cur; });
      patchLive({ sizeLabel: `${Math.round(u.w * fx)} × ${Math.round(u.h * fy)}` });
    }, () => { if (begun) S.end0(); });
  };

  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault(); const st = getState(); const box = m.boxes[0]; const id = st.sel[0]; if (!box || !id) return;
    const sr = stageRect(); const c = { x: box.cx + sr.left, y: box.cy + sr.top }; const a0 = Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI;
    const own = explicitStyle(find(S.root(st), id)!, st.bp).rotation || 0; let begun = false;
    track('rotate', { cx0: e.clientX, cy0: e.clientY, always: true }, ev => {
      if (!begun) { S.begin0(); begun = true; }
      let a = own + (Math.atan2(ev.clientY - c.y, ev.clientX - c.x) * 180 / Math.PI - a0); a = ((a % 360) + 360) % 360; if (ev.shiftKey) a = Math.round(a / 15) * 15;
      S.mutate(rr => updateNode(rr, id, n => ({ ...n, ...patch(n, { rotation: Math.round(a * 10) / 10 }) }))); patchLive({ sizeLabel: `${Math.round(a)}°` });
    }, () => { if (begun) S.end0(); });
  };

  /* ---------- path node editing ---------- */
  const startAnchor = (i: number, which: 'a' | 'h1' | 'h2', e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault(); const st = getState(); const id = st.sel[0]; const n = find(S.root(st), id); const b = m.boxes[0]; if (!n || !b) return;
    S.setState({ pointPick: { id, index: i } }); const sx = b.w / (n.vw || b.w); const sy = b.h / (n.vh || b.h); const orig = (n.pts || []).map(p => ({ ...p })); let begun = false;
    track('anchor', { cx0: e.clientX, cy0: e.clientY }, ev => {
      if (!begun) { S.begin0(); begun = true; }
      const d = rot2(ev.clientX - e.clientX, ev.clientY - e.clientY, -b.rot); const dx = d.x / sx; const dy = d.y / sy;
      S.mutate(rr => updateNode(rr, id, nn => {
        const pts = orig.map(p => ({ ...p })); const p = pts[i];
        if (which === 'a') { p.x += dx; p.y += dy; }
        else if (which === 'h1') { p.hx1 = (p.hx1 ?? 0) + dx; p.hy1 = (p.hy1 ?? 0) + dy; if (!ev.altKey && p.hx2 !== undefined) { p.hx2 = -p.hx1; p.hy2 = -p.hy1; } }
        else { p.hx2 = (p.hx2 ?? 0) + dx; p.hy2 = (p.hy2 ?? 0) + dy; if (!ev.altKey && p.hx1 !== undefined) { p.hx1 = -p.hx2; p.hy1 = -p.hy2; } }
        return { ...nn, pts };
      }));
    }, () => { if (begun) { refitPath(id); S.end0(); } });
  };
  /** After editing nodes, re-fit the box to the anchors so the object's bounds stay honest. */
  const refitPath = (id: string) => {
    const st = getState(); const n = find(S.root(st), id); const el = nodeEl(id); if (!n || !n.pts || !el) return;
    const pel = el.offsetParent as HTMLElement; const sxr = el.offsetWidth / (n.vw || el.offsetWidth); const syr = el.offsetHeight / (n.vh || el.offsetHeight);
    const nm = normalizePath(n.pts, n.style.strokeWidth || 2); const k = (refWidth(pathTo(S.root(st), id)!.slice(0, -1), st.bp)) / (pel.clientWidth || 1);
    S.mutate(rr => updateNode(rr, id, nn => ({ ...nn, ...patch(nn, { x: (el.offsetLeft + nm.ox * sxr) * k, y: el.offsetTop + nm.oy * syr, w: nm.w * sxr * k, h: nm.h * syr }), pts: nm.pts, vw: nm.w, vh: nm.h })), { history: false });
  };

  /* ---------- drawing ---------- */
  const createAt = (tool: Tool, a: Pt, b: Pt, moved: boolean, ev: { shiftKey: boolean; altKey: boolean }) => {
    const st = getState(); const parent = containerAt(a.x + stageRect().left, a.y + stageRect().top); const sr = stageRect();
    const p1 = toLocal(parent, a.x + sr.left, a.y + sr.top); const p2 = toLocal(parent, b.x + sr.left, b.y + sr.top);
    let x = Math.min(p1.x, p2.x); let y = Math.min(p1.y, p2.y); let w = Math.abs(p2.x - p1.x); let h = Math.abs(p2.y - p1.y); const k = p1.k;
    if (ev.shiftKey && moved && tool !== 'line') { const side = Math.max(w / k, h); w = side * k; h = side; if (p2.x < p1.x) x = p1.x - w; if (p2.y < p1.y) y = p1.y - h; }
    if (ev.altKey && moved) { x = p1.x - w; y = p1.y - h; w *= 2; h *= 2; }
    const at = (def: Node, dw: number, dh: number) => { if (moved && w > 4 && h > 4) { def.style.x = x; def.style.y = y; def.style.w = w; if (typeof def.style.h === 'number' || tool !== 'text') def.style.h = h; } else { def.style.x = p1.x; def.style.y = p1.y; if (!def.style.w) def.style.w = dw; if (typeof def.style.h === 'number') def.style.h = dh; } return def; };
    let node: Node | null = null;
    switch (tool) {
      case 'rect': node = at(makeShape('rect', 0, 0, 160, 120), 160 * k, 120); break;
      case 'rounded': node = at(makeShape('rect', 0, 0, 160, 120), 160 * k, 120); node.style.radius = 20; node.name = 'Rounded rectangle'; break;
      case 'ellipse': node = at(makeShape('ellipse', 0, 0, 140, 140), 140 * k, 140); break;
      case 'polygon': node = at(makeShape('polygon', 0, 0, 150, 150), 150 * k, 150); break;
      case 'star': node = at(makeShape('star', 0, 0, 160, 160), 160 * k, 160); break;
      case 'container': node = at(makeContainer(0, 0, 360, 240), 360 * k, 240); break;
      case 'grid': node = at(makeGrid(0, 0, 480, 240, 3), 480 * k, 240); break;
      case 'text': case 'heading': {
        // Click = artistic text (grows with its content). Drag = paragraph frame (fixed width and height, text wraps).
        const para = moved && w > 4 && h > 4;
        node = at(tool === 'text' ? makeText(0, 0) : makeHeading(0, 0), (tool === 'text' ? 320 : 640) * k, 0);
        if (para) node.style.h = Math.round(h); else { node.style.h = 'auto'; node.style.w = 'auto'; node.name = tool === 'text' ? 'Artistic text' : 'Heading'; }
        if (para) node.name = tool === 'text' ? 'Paragraph' : 'Heading frame';
        break;
      }
      case 'button': node = at(makeButton(0, 0), 160 * k, 48); break;
      case 'line': {
        const ptsW = [{ x: p1.x / k, y: p1.y }, { x: p2.x / k, y: p2.y }];
        node = makeLine(ptsW[0].x, ptsW[0].y, ptsW[1].x, ptsW[1].y, '#111827', 3); node.style.x = (node.style.x as number) * k; node.style.w = (node.style.w as number) * k; if (!moved) return; break;
      }
      case 'arrow': {
        const sx=p1.x/k, sy=p1.y, ex=p2.x/k, ey=p2.y, dx=ex-sx, dy=ey-sy, len=Math.hypot(dx,dy); if(len<4)return;
        const ux=dx/len, uy=dy/len, px=-uy, py=ux, head=Math.min(18,Math.max(9,len*.24)), half=4, baseX=ex-ux*head, baseY=ey-uy*head;
        const pts=[{x:sx+px*1.5,y:sy+py*1.5},{x:baseX+px*1.5,y:baseY+py*1.5},{x:baseX+px*half,y:baseY+py*half},{x:ex,y:ey},{x:baseX-px*half,y:baseY-py*half},{x:baseX-px*1.5,y:baseY-py*1.5},{x:sx-px*1.5,y:sy-py*1.5}];
        node=makePath(pts,true,'#111827','#111827',1);node.name='Arrow';node.style.stroke=undefined;node.style.strokeWidth=0;node.style.x=(node.style.x as number)*k;node.style.w=(node.style.w as number)*k;if(!moved)return;break;
      }
      default: return;
    }
    if (!node) return;
    const id = S.addNode(node, parent.id); S.setState({ sel: [id] });
    if (tool === 'text' || tool === 'heading' || tool === 'button') S.setState({ edit: id });
    void st;
  };

  const placeImage = async (a: Pt, files?: File[]) => {
    const picked = files ?? await pickImages(false); const file = picked[0]; if (!file) return;
    const img = await readImage(file); if (!img) return; const asset = registerAsset(img.asset);
    const sr = stageRect(); const parent = containerAt(a.x + sr.left, a.y + sr.top); const p = toLocal(parent, a.x + sr.left, a.y + sr.top);
    const w = Math.min(480, img.w); const h = Math.round((w * img.h) / img.w);
    const node = makeImage(p.x, p.y, w * p.k, h, asset.dataUrl, asset.id, ''); node.name = file.name.replace(/\.[a-z0-9]+$/i, ''); S.addNode(node, parent.id);
  };

  const startDraw = (e: React.PointerEvent, tool: Tool) => {
    const a = stagePt(e); const kind = DRAW[tool] || 'rect';
    track('draw', { cx0: e.clientX, cy0: e.clientY, always: true }, ev => {
      const p = stagePt(ev); let r = norm(a.x, a.y, p.x, p.y);
      if (ev.shiftKey && tool !== 'line') { const sd = Math.max(r.w, r.h); r = { x: p.x < a.x ? a.x - sd : a.x, y: p.y < a.y ? a.y - sd : a.y, w: sd, h: sd }; }
      patchLive({ draft: kind === 'line' ? { x: a.x, y: a.y, w: p.x - a.x, h: p.y - a.y } : r, draftKind: kind, sizeLabel: `${Math.round(r.w / getState().view.zoom)} × ${Math.round(r.h / getState().view.zoom)}` });
    }, (ev, moved) => {
      const b = stagePt(ev); patchLive({ draft: null, draftKind: null });
      if (tool === 'image') { void placeImage(a); return; }
      createAt(tool, a, b, moved, ev);
    });
  };

  /* ---------- pen (Bézier) ---------- */
  const penScreen = (): PenPreview => {
    const v = getState().view; const p = pen.current!; const sc = (q: Pt) => ({ x: q.x * v.zoom + v.px, y: q.y * v.zoom + v.py });
    return { pts: p.pts.map(q => ({ ...sc(q), h1: q.hx1 !== undefined ? sc({ x: q.x + q.hx1, y: q.y + (q.hy1 ?? 0) }) : undefined, h2: q.hx2 !== undefined ? sc({ x: q.x + q.hx2, y: q.y + (q.hy2 ?? 0) }) : undefined })), cursor: p.cursor ? sc(p.cursor) : null, closeHot: false };
  };
  const finishPen = (closed: boolean) => {
    const p = pen.current; pen.current = null; patchLive({ pen: null }); if (!p || p.pts.length < 2) return;
    const sr = stageRect(); const first = p.pts[0]; const v = getState().view; const parent = containerAt(first.x * v.zoom + v.px + sr.left, first.y * v.zoom + v.py + sr.top);
    const pel = nodeEl(parent.id)!; const wr = worldRectOf(pel); const k = refWidth(pathTo(S.root(), parent.id) || [parent], getState().bp) / (pel.clientWidth || 1);
    const local = p.pts.map(q => ({ x: q.x - wr.x, y: q.y - wr.y, hx1: q.hx1, hy1: q.hy1, hx2: q.hx2, hy2: q.hy2 }));
    const node = makePath(local, closed, '#111827', closed ? '#c7d2fe' : undefined, 3); node.style.x = (node.style.x as number) * k; node.style.w = (node.style.w as number) * k;
    const id = S.addNode(node, parent.id); S.setState({ sel: [id], tool: 'direct' });
  };
  const penDown = (e: React.PointerEvent) => {
    const wp = worldPt(stagePt(e)); const v = getState().view;
    if (!pen.current) pen.current = { pts: [], cursor: null, parent: null };
    const p = pen.current;
    if (p.pts.length >= 2 && Math.hypot((p.pts[0].x - wp.x) * v.zoom, (p.pts[0].y - wp.y) * v.zoom) < 9) { finishPen(true); return; }
    const pt: PenPt = { x: wp.x, y: wp.y }; p.pts.push(pt); const idx = p.pts.length - 1;
    patchLive({ pen: penScreen() });
    track('pen', { cx0: e.clientX, cy0: e.clientY }, ev => { const q = worldPt(stagePt(ev)); const dx = q.x - pt.x; const dy = q.y - pt.y; p.pts[idx] = { ...pt, hx2: dx, hy2: dy, hx1: -dx, hy1: -dy }; patchLive({ pen: penScreen() }); }, () => patchLive({ pen: pen.current ? penScreen() : null }));
  };

  /* ---------- pencil ---------- */
  const startPencil = (e: React.PointerEvent) => {
    const v = () => getState().view; const pts: Pt[] = [worldPt(stagePt(e))];
    track('pencil', { cx0: e.clientX, cy0: e.clientY, always: true }, ev => { const q = worldPt(stagePt(ev)); const last = pts[pts.length - 1]; if (Math.hypot(q.x - last.x, q.y - last.y) * v().zoom > 2) { pts.push(q); patchLive({ pencil: pts.map(pp => ({ x: pp.x * v().zoom + v().px, y: pp.y * v().zoom + v().py })) }); } },
      ev => {
        patchLive({ pencil: null }); if (pts.length < 3) return;
        const simp = simplify(pts, 2 / v().zoom); const pp = smoothPoints(simp); const sr = stageRect(); const first = pts[0];
        const parent = containerAt(first.x * v().zoom + v().px + sr.left, first.y * v().zoom + v().py + sr.top); const pel = nodeEl(parent.id)!; const wr = worldRectOf(pel);
        const k = refWidth(pathTo(S.root(), parent.id) || [parent], getState().bp) / (pel.clientWidth || 1);
        const node = makePath(pp.map(q => ({ ...q, x: q.x - wr.x, y: q.y - wr.y })), false, '#111827', undefined, 3); node.name = 'Freehand'; node.style.x = (node.style.x as number) * k; node.style.w = (node.style.w as number) * k;
        const id = S.addNode(node, parent.id); S.setState({ sel: [id], tool: 'pencil' }); void ev;
      });
  };

  /* ---------- marquee ---------- */
  const startMarquee = (e: React.PointerEvent, additive: boolean) => {
    const a = stagePt(e); const base = additive ? getState().sel : [];
    track('marquee', { cx0: e.clientX, cy0: e.clientY, always: true }, ev => patchLive({ marquee: norm(a.x, a.y, stagePt(ev).x, stagePt(ev).y), draftKind: 'marquee' }), ev => {
      const b = stagePt(ev); const rawBox = norm(a.x, a.y, b.x, b.y); patchLive({ marquee: null, draftKind: null });
      const art = worldRef.current?.getBoundingClientRect(); const sr0 = stageRect();
      const bounds = art ? { x: art.left - sr0.left, y: art.top - sr0.top, w: art.width, h: art.height } : null;
      const x0 = bounds ? Math.max(rawBox.x, bounds.x) : rawBox.x; const y0 = bounds ? Math.max(rawBox.y, bounds.y) : rawBox.y;
      const x1 = bounds ? Math.min(rawBox.x + rawBox.w, bounds.x + bounds.w) : rawBox.x + rawBox.w;
      const y1 = bounds ? Math.min(rawBox.y + rawBox.h, bounds.y + bounds.h) : rawBox.y + rawBox.h;
      const box = { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
      if (box.w < 3 && box.h < 3) { if (!additive) S.clearSelection(); return; }
      const st = getState(); const r = S.root(st); const sr = stageRect(); const allowed = S.allowedGroups(st); const picked: string[] = [];
      const visit = (n: Node, underClosedGroup: boolean) => {
        if (n.id !== r.id && !n.locked && !n.hidden && !underClosedGroup) {
          const el = nodeEl(n.id); if (el) { const br = el.getBoundingClientRect(); const rect = { x: br.left - sr.left, y: br.top - sr.top, w: br.width, h: br.height };
            const leaf = !isContainer(n) || n.type === 'group'; if (leaf ? intersects(rect, box) : inside(rect, box)) picked.push(n.id); }
        }
        const closed = underClosedGroup || (n.type === 'group' && !allowed.has(n.id));
        (n.children || []).forEach(c => visit(c, closed));
      };
      visit(r, false);
      const ctx = st.enter; const filtered = ctx ? picked.filter(id => { const path = pathTo(r, id) || []; return path.some(n => n.id === ctx) && id !== ctx; }) : picked;
      S.select(Array.from(new Set([...base, ...filtered])));
    });
  };

  /* ---------- guides ---------- */
  const startGuide = (axis: 'x' | 'y', e: React.PointerEvent, existing?: number) => {
    e.stopPropagation(); e.preventDefault(); const guides = [...S.page().guides]; let list = guides;
    track('guide', { cx0: e.clientX, cy0: e.clientY, always: true }, ev => {
      const p = stagePt(ev); const v = getState().view; const pos = axis === 'x' ? (p.x - v.px) / v.zoom : (p.y - v.py) / v.zoom;
      patchLive({ guideDrag: { axis, pos: axis === 'x' ? p.x : p.y } });
      if (existing !== undefined) { list = guides.map((g, i) => (i === existing ? { ...g, pos: Math.round(pos) } : g)); S.setGuides(list); }
    }, ev => {
      patchLive({ guideDrag: null }); const p = stagePt(ev); const v = getState().view; const pos = Math.round(axis === 'x' ? (p.x - v.px) / v.zoom : (p.y - v.py) / v.zoom);
      const overRuler = (axis === 'x' ? p.x : p.y) < RULER; const outside = p.x < 0 || p.y < 0 || p.x > getState().stage.w || p.y > getState().stage.h;
      if (existing !== undefined) { if (overRuler || outside) S.setGuides(guides.filter((_, i) => i !== existing)); }
      else if (!overRuler && !outside) S.setGuides([...guides, { axis, pos }]);
    });
  };

  /* ---------- pointer entry points ---------- */
  const onPointerDown = (e: React.PointerEvent) => {
    const st = getState(); if (e.button === 2) return;
    if (e.pointerType === 'touch') { touches.current.set(e.pointerId, stagePt(e)); if (touches.current.size === 2) { startPinch(); return; } }
    if (e.button === 1 || keys.space || st.tool === 'hand') { e.preventDefault(); startPan(e); return; }
    if (st.preview) { startPan(e); return; }
    if (st.edit) return;
    const artboard = worldRef.current?.getBoundingClientRect();
    if (!artboard || e.clientX < artboard.left || e.clientX > artboard.right || e.clientY < artboard.top || e.clientY > artboard.bottom) { if (st.tool === 'select' || st.tool === 'direct') S.clearSelection(); return; }
    const tool = st.tool;
    if (tool === 'zoom') { const a = stagePt(e); track('zoombox', { cx0: e.clientX, cy0: e.clientY, always: true }, ev => patchLive({ marquee: norm(a.x, a.y, stagePt(ev).x, stagePt(ev).y) }), (ev, moved) => { patchLive({ marquee: null }); const b = stagePt(ev); if (!moved) S.zoomAt(st.view.zoom * (ev.altKey ? 1 / 1.6 : 1.6), a.x, a.y); else { const r = norm(a.x, a.y, b.x, b.y); const z = Math.min(st.stage.w / r.w, st.stage.h / r.h) * st.view.zoom * 0.95; const wc = worldPt({ x: r.x + r.w / 2, y: r.y + r.h / 2 }); const zc = clamp(z, S.ZOOM_MIN, S.ZOOM_MAX); S.setView({ zoom: zc, px: st.stage.w / 2 - wc.x * zc, py: st.stage.h / 2 - wc.y * zc }); } }); return; }
    if (tool === 'eyedropper') { eyedrop(e); return; }
    if (tool === 'crop') { cropImage(e); return; }
    if (tool === 'pen') { e.preventDefault(); penDown(e); return; }
    if (tool === 'pencil') { e.preventDefault(); startPencil(e); return; }
    if (tool === 'component') { e.preventDefault(); componentTool(e); return; }
    if (tool === 'section') { const sec = makeSection('Section', 480); S.addNode(sec, S.root().id); return; }
    if (tool !== 'select' && tool !== 'direct') { e.preventDefault(); startDraw(e, tool); return; }
    const id = hitAt(e.clientX, e.clientY);
    if (!id) { startMarquee(e, e.shiftKey); return; }
    if (e.shiftKey) { S.toggleSelect(id); return; }
    if (!st.sel.includes(id)) S.select([id]);
    const n = find(S.root(), id); if (n?.type === 'path' && tool === 'select') { /* path moves like any object */ }
    startMove(e, getState().sel);
  };

  /** Component tool: click an object to turn it into a reusable component; click empty space to place a copy. */
  const componentTool = (e: React.PointerEvent) => {
    const st = getState(); const hit = hitAt(e.clientX, e.clientY); const comps = st.project?.components || [];
    const found = hit ? find(S.root(st), hit) : null; const hitNode = found && found.type !== 'section' ? found : null; // a bare section counts as empty space
    if (hitNode && hitNode.inst) { armedComp.current = hitNode.inst; S.select([hitNode.id]); S.toast('Component armed. Click empty space to place a copy.'); return; }
    if (hitNode && hit && !hitNode.locked) { S.select([hit]); const id = S.createComponentFromSelection(); if (id) { armedComp.current = id; S.toast('Component created. Click empty space to place copies.'); } return; }
    const id = armedComp.current && comps.some(c => c.id === armedComp.current) ? armedComp.current : comps[comps.length - 1]?.id;
    if (!id) { S.toast('Click an object first to turn it into a component.'); return; }
    const parent = containerAt(e.clientX, e.clientY); const at = toLocal(parent, e.clientX, e.clientY);
    S.insertComponent(id, parent.id, at.x, at.y, at.k);
  };

  const eyedrop = (e: React.PointerEvent) => {
    const id = hitAt(e.clientX, e.clientY); const n = id ? find(S.root(), id) : null; if (!n) { S.toast('Click an object to pick its colour.'); return; }
    const sty = explicitStyle(n, getState().bp); const c = n.type === 'text' || n.type === 'heading' ? sty.color : sty.fill || sty.color || sty.stroke;
    if (!c) { S.toast('That object has no colour to pick.'); return; }
    S.pushRecentColor(c); const sel = getState().sel;
    if (sel.length) S.patchNodes(sel, getState().paint.target === 'stroke' ? { stroke: c, strokeWidth: 2 } : { fill: c }); S.toast(`Picked ${c}`);
  };

  const cropImage = (e: React.PointerEvent) => {
    const id=hitAt(e.clientX,e.clientY);const node=id?find(S.root(),id):null;const el=id?elOf(id) as HTMLImageElement|null:null;
    if(!node||node.type!=='image'||!el){S.toast('Select an image to adjust its crop.');return;}
    S.select([id!]);const rect=el.getBoundingClientRect();const nw=el.naturalWidth||rect.width;const nh=el.naturalHeight||rect.height;const scale=Math.max(rect.width/nw,rect.height/nh);const overflowX=Math.max(0,nw*scale-rect.width);const overflowY=Math.max(0,nh*scale-rect.height);
    const parse=(v:string|undefined)=>{if(!v)return 50;if(v==='left'||v==='top')return 0;if(v==='right'||v==='bottom')return 100;const n=Number.parseFloat(v);return Number.isFinite(n)?n:50;};
    const parts=String(node.attrs?.['object-position']||'50% 50%').split(/\s+/);const startX=parse(parts[0]),startY=parse(parts[1]||parts[0]);let begun=false;
    track('crop',{cx0:e.clientX,cy0:e.clientY},ev=>{if(!begun){S.begin0();begun=true;}const x=Math.max(0,Math.min(100,startX-(overflowX?(ev.clientX-e.clientX)/overflowX*100:0)));const y=Math.max(0,Math.min(100,startY-(overflowY?(ev.clientY-e.clientY)/overflowY*100:0)));S.patchNodeProps([id!],{attrs:{...node.attrs,'object-fit':'cover','object-position':`${x.toFixed(1)}% ${y.toFixed(1)}%`}});},()=>{if(begun)S.end0();});
  };

  const startPinch = () => {
    const pts = Array.from(touches.current.values()); let dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y); const z0 = getState().view.zoom;
    const mv = (ev: PointerEvent) => { if (!touches.current.has(ev.pointerId)) return; touches.current.set(ev.pointerId, stagePt(ev)); const q = Array.from(touches.current.values()); if (q.length < 2) return; const d = Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y); S.zoomAt(z0 * (d / dist), (q[0].x + q[1].x) / 2, (q[0].y + q[1].y) / 2); };
    const up = (ev: PointerEvent) => { touches.current.delete(ev.pointerId); if (touches.current.size < 2) { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); } };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); void dist; dist = dist || 1;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = stagePt(e); setCursor(p);
    if (drag.current) return;
    const st = getState();
    if (pen.current) { pen.current.cursor = worldPt(p); patchLive({ pen: penScreen() }); }
    if (st.tool === 'select' || st.tool === 'direct') { const id = hitAt(e.clientX, e.clientY); if (id !== hoverId) setHoverId(id); } else if (hoverId) setHoverId(null);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const st = getState(); if (st.preview) return;
    if (pen.current) { finishPen(false); return; }
    const raw = (() => { for (const el of document.elementsFromPoint(e.clientX, e.clientY)) { const id = keyOf(el); if (id && !id.includes(':')) return id; } return null; })(); if (!raw) return;
    const r = S.root(st); const path = pathTo(r, raw) || []; const target = find(r, raw)!;
    if (st.tool === 'direct' && st.sel.length === 1) { const n = find(r, st.sel[0]); const b = m.boxes[0];
      if (n?.type === 'path' && b) { const sxs = b.w / (n.vw || b.w); const sys = b.h / (n.vh || b.h); const p = stagePt(e); const d = rot2(p.x - b.cx, p.y - b.cy, -b.rot); const lx = (d.x + b.w / 2) / sxs; const ly = (d.y + b.h / 2) / sys;
        const ins = insertPointNear(n.pts || [], !!n.closed, lx, ly, 12 / Math.min(sxs, sys)); if (ins) { S.replaceNode(n.id, nn => ({ ...nn, pts: ins.pts })); S.setState({ pointPick: { id: n.id, index: ins.index } }); return; } }
      if (n?.type === 'shape') { S.convertToPath(); return; } }
    const group = path.find(n => n.type === 'group' && !S.allowedGroups(st).has(n.id));
    if (group) { S.enterGroup(group.id); const inner = S.resolveHit(raw, { ...getState(), enter: group.id }); if (inner) S.select([inner]); return; }
    if (target.type === 'text' || target.type === 'heading' || target.type === 'button') { S.select([target.id]); S.setState({ edit: target.id }); return; }
    if (target.type === 'path' || target.type === 'shape') { S.select([target.id]); if (target.type === 'path') S.setTool('direct'); }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); const art = worldRef.current?.getBoundingClientRect();
    if (!art || e.clientX < art.left || e.clientX > art.right || e.clientY < art.top || e.clientY > art.bottom) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); const a = stagePt(e);
    if (files.length) { for (const f of files) await placeImage(a, [f]); return; }
    const asset = e.dataTransfer.getData('application/x-aa-asset'); const shape = e.dataTransfer.getData('application/x-aa-shape'); const comp = e.dataTransfer.getData('application/x-aa-component');
    if (asset || shape || comp) { const { dropPayload } = await import('../panels/drop'); dropPayload({ asset, shape, comp }, e.clientX, e.clientY, containerAt, toLocal); }
  };

  /* ---------- keyboard for pen ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if(e.shiftKey && e.key.toLowerCase()==='a'){e.preventDefault();S.applySuggestedLayout();return;}
      if (!pen.current) return;
      if (e.key === 'Enter') { e.preventDefault(); finishPen(false); } else if (e.key === 'Escape') { pen.current = null; patchLive({ pen: null }); } else if (e.key === 'Backspace') { e.preventDefault(); pen.current.pts.pop(); patchLive({ pen: pen.current.pts.length ? penScreen() : null }); if (!pen.current.pts.length) pen.current = null; }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => { if (s.tool !== 'pen' && pen.current) { if (pen.current.pts.length >= 2) finishPen(false); else { pen.current = null; patchLive({ pen: null }); } } }, [s.tool]);

  /* ---------- render ---------- */
  const preview = s.preview; const tool = s.tool;
  const union = unionRect(m.boxes.map(boxRect));
  const sole = s.sel.length === 1 ? find(rootNode, s.sel[0]) : null;
  const moveLocked = s.sel.some(id => !!pathTo(rootNode, id)?.some(n => n.locked));
  const canResize = !preview && tool !== 'direct' && !moveLocked && !!m.boxes.length;
  const cursorAttr = panning || tool === 'hand' ? 'grabbing' : keys.space ? 'grab' : tool === 'select' || tool === 'direct' ? 'default' : tool === 'zoom' ? 'zoom-in' : tool === 'eyedropper' ? 'copy' : tool === 'text' || tool === 'heading' ? 'text' : 'crosshair';
  const grid = !preview && s.layout.grid && m.page ? { step: 8 * zoom >= 6 ? 8 * zoom : 32 * zoom, ox: m.page.x, oy: m.page.y } : null;
  const v = s.view;
  const navigatePreview=(href:string)=>{
    if(href.startsWith('page:')){const id=href.slice(5);if(s.project?.pages.some(p=>p.id===id))S.switchPage(id);return;}
    if(href.startsWith('#')){const key=decodeURIComponent(href.slice(1));const target=find(rootNode,key)||flatten(rootNode).find(n=>n.name.toLowerCase()===key.toLowerCase());if(target){S.select([target.id]);const el=elOf(target.id);if(el&&stageRef.current){const sr=stageRef.current.getBoundingClientRect(),er=el.getBoundingClientRect();S.setView({...getState().view,px:getState().view.px+(sr.left+sr.width/2-(er.left+er.width/2)),py:getState().view.py+(sr.top+sr.height/2-(er.top+er.height/2))});}}return;}
    if(/^(https?:|mailto:|tel:|\/|\.\/|\.\.\/)/i.test(href))window.open(href,'_blank','noopener,noreferrer');
  };
  const guides = S.page(s).guides.map((g, i) => ({ axis: g.axis, pos: g.axis === 'x' ? g.pos * v.zoom + v.px : g.pos * v.zoom + v.py, index: i }));
  const dragGuide = live.guideDrag ? [{ axis: live.guideDrag.axis, pos: live.guideDrag.pos, index: -1 }] : [];

  return (
    <Box ref={stageRef} position="relative" w="100%" h="100%" overflow="hidden" {...{ bg: 'gray-200', 'dark-bg': 'gray-950' }} cursor={cursorAttr} touch-action="none" select="none"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(e: React.PointerEvent) => { touches.current.delete(e.pointerId); }} onPointerLeave={() => { setCursor(null); setHoverId(null); }} onDoubleClick={onDoubleClick}
      onDragOver={(e: React.DragEvent) => e.preventDefault()} onDrop={onDrop} onContextMenu={(e: React.MouseEvent) => e.preventDefault()}>
      <Box ref={worldRef} position="absolute" top="0" left="0" w={`${S.artboardSize(s).w}px`} h={`${S.artboardSize(s).h}px`} shadow="xl" bg="white"
        transform={`translate(${v.px}px, ${v.py}px) scale(${v.zoom})`} transformOrigin="0 0"
        outline-style="solid" outline-width="1px" outline-color="#64748b"
        {...(project.settings?.deviceFrame&&s.viewport.name.toLowerCase().includes('mobile')?{rounded:'3xl',border:'8px solid gray-900',overflow:'hidden'}:{})}>
        <Box position="absolute" inset="24px" pointer-events="none" border="1px dashed" border-color="gray-300" dark-border-color="gray-700" opacity={s.layout.safeArea ? '1' : '0'} />
        <Box position="absolute" top="10px" left="18px" px="2" py="1" rounded="full" bg="gray-900" text="white" fontSize="10px" fontWeight="700" pointer-events="none">Artboard · {S.bpWidth(s)} × {Number(page.height || rootNode.style.h || s.viewport.height)}px</Box>
        <RenderTree g={gen} editId={s.edit} interactive={!preview} register
          onCommit={(id, text) => { S.setState({ edit: null }); const n = find(S.root(), id); if (n && n.text !== text) S.patchNodeProps([id], { text }); }} onCancel={() => S.setState({ edit: null })} onNavigate={preview?navigatePreview:undefined} />
      </Box>
      {m.page && <Box position="absolute" left={`${m.page.x}px`} top={`${m.page.y}px`} w={`${m.page.w}px`} h={`${m.page.h}px`} border="1px solid slate-600" pointer-events="none" z="8" />}
      {s.compare&&<Box position="absolute" top="0" left="0" w="100%" h="100%" z="70" bg="gray-100" dark-bg="gray-950" overflow="auto" p="3" onPointerDown={(e:React.PointerEvent)=>e.stopPropagation()}>
        <Row position="sticky" top="0" z="5" items="center" gap="2" p="2" {...T.panel}><Txt fontSize="13px" fontWeight="700" m="0" flex="1">Compare artboards · click a size to edit it</Txt><Row as="label" items="center" gap="1" fontSize="11px"><Box as="input" type="checkbox" checked={s.compareDark} onChange={(e:any)=>S.setState({compareDark:e.target.checked})}/>Dark twin</Row><IconBtn icon="x" title="Close compare" onClick={()=>S.setCompare(false)}/></Row>
        <Row gap="3" items="start" overflow="auto" py="3">{BPS.filter(bp=>bp==='desktop'||project.settings?.[bp]!==false).flatMap(bp=>[false,...(s.compareDark?[true]:[])].map(dark=>{const pp=dark?{...project,pageTheme:'dark' as const}:project;const tree=buildGen(rootNode,bp,'editor',[],null,null,pp);return <Box key={`${bp}-${dark}`} flex="none" cursor="pointer" {...T.panel} p="2" onClick={()=>{S.setBp(bp);S.setCompare(false);}}><Txt fontSize="11px" fontWeight="700" m="0" mb="2">{BP_LABEL[bp]} · {dark?'Dark':'Light'} · click to edit</Txt><Box w={`${BP_WIDTH[bp]}px`} max-h="65vh" overflow="hidden" bg="white" dark-bg="gray-900"><RenderTree g={tree} editId={null} interactive={false} register={false} onCommit={()=>{}} onCancel={()=>{}} /></Box></Box>}))}</Row>
      </Box>}
      {!preview && m.page && (
        <Box position="absolute" left={`${m.page.x}px`} top={`${Math.max(RULER + 2, m.page.y - 22)}px`} pointer-events="none" z="5">
          <Txt fontSize="11px" fontWeight="600" text="gray-500" dark-text="gray-400" m="0" whitespace="nowrap">{s.viewport.name} · {S.bpWidth(s)} × {s.viewport.height}px · {Math.round(zoom * 100)}%{s.enter ? ` · editing group` : ''}</Txt>
        </Box>
      )}
      {!preview && (
        <Box position="absolute" top="0" left="0" w="100%" h="100%" pointer-events="none" z="10">
          <Overlay w={s.stage.w} h={s.stage.h} accent={ACCENT} boxes={m.boxes} union={union} showHandles={!live.draft && !live.marquee && !s.edit} canRotate={s.sel.length === 1 && canResize && !pathTo(rootNode, s.sel[0])?.slice(0, -1).some(n => n.type === 'group' && false)} canResize={canResize}
            hover={m.hover} altMeasure={altDown} marquee={live.marquee} draft={live.draft} draftKind={live.draftKind} snap={live.snap} guides={[...guides, ...dragGuide]} showGuides={s.layout.guides} grid={grid}
            anchors={m.anchors} pen={live.pen} pencil={live.pencil} enterBox={m.enter} sizeLabel={live.sizeLabel} page={m.page}
            onHandle={(h, e) => (h === 'rotate' ? startRotate(e) : startResize(h, e))} onAnchor={startAnchor} onGuide={(i, e) => startGuide(S.page().guides[i].axis, e, i)} />
        </Box>
      )}
      {!preview && m.page && (
        <Box position="absolute" left={`${m.page.x}px`} top={`${m.page.y + m.page.h + 14}px`} z="12" display="flex" gap="2" pointer-events="auto">
          <Btn type="button" w={`${Math.min(170, m.page.w / 2)}px`} h="38px" border="1px dashed" border-color="primary" bg="primary/10" text="primary" rounded="lg" fontSize="12px" fontWeight="600" cursor="pointer"
            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={() => S.setTool('text')} title="Insert a text block on the page">+ Text</Btn>
          <Btn type="button" w={`${Math.min(170, m.page.w / 2)}px`} h="38px" border="1px dashed" border-color="primary" bg="primary/10" text="primary" rounded="lg" fontSize="12px" fontWeight="600" cursor="pointer"
            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={() => S.addSection()} title="Add a new section at the end of the page">+ Section</Btn>
        </Box>
      )}
      <Scrollbars stage={s.stage} view={s.view} pw={S.bpWidth(s)} ph={Math.max(200, s.pageH,s.viewport.height) + 90} />
      {!preview && s.layout.rulers && <Rulers w={s.stage.w} h={s.stage.h} view={s.view} cursor={cursor} dark={s.theme === 'dark'} onStart={(axis, e) => startGuide(axis, e)} />}
      {!preview && m.boxes.length > 0 && !live.draft && !live.marquee && !drag.current && !s.edit && <ContextToolbar union={union!} stage={s.stage} sole={sole} />}
    </Box>
  );
}
