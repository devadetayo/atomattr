import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { ToolIcon } from './ToolIcons';
import { T } from '../theme';
import { thumbSvg } from '../document/thumb';
import { PAGES_OPEN_H, PAGES_PILL_H } from '../state/layout';
import { confirmDeletePage } from '../state/confirm';
import { elOf, reg } from '../canvas/registry';

/* Geometry (px). The panel's size is worked out from these, not measured, so it can be placed correctly on the very first frame
   and never depends on how much room the browser happens to leave it. */
const MARGIN = 12;                  // gap to the canvas edge in the default spot
const TILE = 104;                   // one page tile
const GAP = 12;                     // gap between tiles
const PAD = 12;                     // padding of the page strip
const MORE_W = 52;                  // the "+n" tile
const PILL_W = 160, PILL_H = PAGES_PILL_H;    // collapsed
const OPEN_H = PAGES_OPEN_H;                 // 36 title + 1 rule + 120 strip (12 + 96 tile + 12)
const SNAP_PX = 56;                 // letting go this close to the top or bottom of the canvas clips the panel into that edge
const MIN_OPEN_W = 260;
const ROWS_PER_COL = 8, ROW_H = 30, COL_W = 176;

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

/** Small icon button for the pages title bar. Same look as the docker title bar buttons. */
function PgBtn({ icon, title, onClick, disabled, danger, active }: { icon: string; title: string; onClick: () => void; disabled?: boolean; danger?: boolean; active?: boolean }) {
  return (
    <Btn type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick}
      w="26px" h="26px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" shrink="0" bg="transparent"
      cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.35' : '1'}
      {...(active ? T.active : disabled ? {} : T.hover)} {...(active ? {} : danger ? { text: 'danger' } : T.text)}>
      <ToolIcon n={icon} size={18} />
    </Btn>
  );
}

/** One drag for both states, kept outside the component so it survives the panel changing between floating and clipped.
    A press that never moves counts as a click (onTap). A clipped strip lifts out when dragged; a floating panel dropped within
    SNAP_PX of the top or bottom edge of the canvas clips into it (the guide shows where). */
function startPagesDrag(e: React.PointerEvent, onTap?: () => void, onMove?: () => void) {
  if (e.button !== 0) return;
  const t = e.target as HTMLElement | null; if (t && t.closest('button, input, textarea, select')) return;
  const el0 = elOf('sys:pages'); if (!el0) return; e.preventDefault();
  const r0 = el0.getBoundingClientRect(); const sx = e.clientX; const sy = e.clientY;
  const wasDocked = !!S.getState().layout.band.dock;
  const ox = wasDocked ? Math.min(sx - r0.left, 120) : sx - r0.left; const oy = sy - r0.top; // a wide strip becomes a narrower panel: keep the grab point near its left end
  let moved = false;
  const mv = (ev: PointerEvent) => {
    const host = elOf('sys:float'); if (!host) return; const hr = host.getBoundingClientRect();
    if (!moved) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return; moved = true; onMove?.(); }
    const live = elOf('sys:pages'); const stillDocked = !!S.getState().layout.band.dock;
    const w = stillDocked ? 0 : (live?.offsetWidth ?? r0.width); const h = stillDocked ? 0 : (live?.offsetHeight ?? r0.height);
    const x = clamp(ev.clientX - hr.left - ox, 0, hr.width - w); const y = clamp(ev.clientY - hr.top - oy, 0, hr.height - h);
    S.setBandPos({ x, y, ...(stillDocked ? { dock: null } : {}) });
    const edge = ev.clientY - hr.top < SNAP_PX ? 'top' : hr.bottom - ev.clientY < SNAP_PX ? 'bottom' : null;
    if (edge !== S.getState().bandGuide) S.setState({ bandGuide: edge });
  };
  const up = () => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
    const edge = S.getState().bandGuide; S.setState({ bandGuide: null });
    if (!moved) { onTap?.(); return; }
    if (edge) S.setBandDock(edge); else if (wasDocked) setTimeout(() => S.fit('page'), 30);
  };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}

/** Dashed outline that shows where the pages panel will clip in while it is dragged near the top or bottom edge. */
export function PagesGuide() {
  const s = useStudio(); const g = s.bandGuide; const host = elOf('sys:float'); if (!g || !host) return null;
  const r = host.getBoundingClientRect(); const h = s.layout.band.open ? OPEN_H : PILL_H;
  return (
    <Box position="fixed" left={`${r.left}px`} w={`${r.width}px`} h={`${h}px`} {...(g === 'top' ? { top: `${r.top}px` } : { top: `${r.bottom - h}px` })} z="95" pointerEvents="none" display="flex" items="center" justify="center"
      bg="primary/15" dark-bg="primary/25" border="2px dashed" border-color="primary" rounded="lg" animate="studio-fade 120ms ease-out both">
      <Row items="center" gap="1" px="3" py="1" rounded="lg" bg="primary" text="white" fontSize="sm" fontWeight="600" shadow="md" whitespace="nowrap"><ToolIcon n="pages" size={14} />{g === 'top' ? 'Clip pages to the top' : 'Clip pages to the bottom'}</Row>
    </Box>
  );
}

/** The pages panel while it floats over the canvas. */
export function PagesFloat({ area }: { area: { w: number; h: number } }) {
  const s = useStudio(); if (s.layout.band.dock) return null;
  return <PagesPanel mode="float" area={area} />;
}

/** The pages panel while it is clipped into the top or bottom edge: it sits in the canvas column and the canvas shrinks to make room. */
export function PagesDock() {
  const s = useStudio(); const dock = s.layout.band.dock; const ref = useRef<HTMLDivElement | null>(null); const [w, setW] = useState(900);
  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth); return () => ro.disconnect(); }, [dock]);
  if (!dock || s.preview) return null;
  return <Box ref={ref} w="100%" flex="none" position="relative"><PagesPanel mode="dock" area={{ w, h: 0 }} /></Box>;
}

/** Drag it by its title bar, or by the pill when collapsed; click the pill to open it.
    Floating: it knows where it is: the open panel is kept inside the canvas (it opens upward or leftward when there is no room), and
    collapsing puts the pill back exactly where you left it. Clipped: it spans the canvas width along the top or bottom edge.
    Pages that do not fit the width go under a "+n" button, no scrolling. */
function PagesPanel({ mode, area }: { mode: 'float' | 'dock'; area: { w: number; h: number } }) {
  const s = useStudio(); const p = s.project!; const band = s.layout.band;
  const docked = mode === 'dock'; const dockAt = band.dock;
  const [rename, setRename] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [more, setMore] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  const moreWrap = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const firstShown = useRef(0);
  const single = p.kind === 'page';
  const len = p.pages.length;
  const activeIdx = Math.max(0, p.pages.findIndex(pg => pg.id === p.activePageId));

  /* ----- how many tiles fit the width; the active page is always one of them ----- */
  const margin = docked ? 0 : MARGIN;
  const avail = Math.max(TILE, area.w - margin * 2 - PAD * 2);
  const fitsAll = (len + 1) * TILE + len * GAP <= avail;
  const n = fitsAll ? len : Math.max(1, Math.floor((avail - MORE_W - TILE - GAP) / (TILE + GAP)));
  const hasMore = n < len;
  let from = clamp(firstShown.current, 0, len - n);          // keep the window where it was, so tiles do not shuffle under the cursor
  if (activeIdx < from) from = activeIdx; else if (activeIdx >= from + n) from = activeIdx - n + 1;
  firstShown.current = from;
  const visible = p.pages.slice(from, from + n);
  const hidden = p.pages.map((pg, i) => ({ pg, i })).filter(({ i }) => i < from || i >= from + n);

  /* ----- size and position ----- */
  const items = n + 1 + (hasMore ? 1 : 0);
  const stripW = n * TILE + TILE + (hasMore ? MORE_W : 0) + (items - 1) * GAP;
  const openW = docked ? area.w : Math.max(200, Math.min(Math.max(MIN_OPEN_W, stripW + PAD * 2), area.w - MARGIN * 2));
  const w = docked ? area.w : band.open ? openW : PILL_W; const h = band.open ? OPEN_H : PILL_H;
  const free = !docked && band.x !== undefined && band.y !== undefined;
  const x = free ? clamp(band.x!, 0, area.w - w) : MARGIN;
  const y = free ? clamp(band.y!, 0, area.h - h) : area.h - MARGIN - h;
  const place = docked ? {} : free ? { left: `${x}px`, top: `${y}px` } : { left: `${MARGIN}px`, bottom: `${MARGIN}px` };

  /* ----- the "+n" popover: opens on whichever side of the panel has room ----- */
  const cols = Math.min(3, Math.max(1, Math.ceil(hidden.length / ROWS_PER_COL)));
  const popW = cols * COL_W + 8; const popH = Math.ceil(hidden.length / cols) * ROW_H + 8;
  const up = docked ? dockAt === 'bottom' : area.h - (y + OPEN_H) < popH + 12;
  const moreLeft = PAD + n * (TILE + GAP);
  const popLeft = Math.min(Math.max(0, moreLeft + MORE_W - popW), Math.max(0, openW - popW));

  useEffect(() => { if (!band.open || !hasMore) setMore(false); }, [band.open, hasMore]);
  useEffect(() => {
    if (!more) return;
    const down = (e: PointerEvent) => { const t = e.target as Node; if (!popRef.current?.contains(t) && !moreWrap.current?.contains(t)) setMore(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMore(false); };
    document.addEventListener('pointerdown', down, true); window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', esc); };
  }, [more]);

  const resetPos = () => { if (docked) S.setBand(!band.open); else S.setBandPos({ x: undefined, y: undefined }); };
  const frame = docked
    ? { position: 'relative', w: '100%', ...T.chrome, ...(dockAt === 'top' ? { 'border-b': '1px solid' } : { 'border-t': '1px solid' }) }
    : { position: 'absolute', ...place, z: '41', ...T.glass, w: `${w}px` };

  return (
    <Box ref={(el: HTMLDivElement | null) => { box.current = el; reg('sys:pages')(el); }} {...frame} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {!band.open ? (
        /* collapsed: the whole pill drags, a click opens it */
        <Row items="center" gap="2" h={`${PILL_H}px`} px="3" cursor="grab" title="Drag to move · click to open" onPointerDown={(e: React.PointerEvent) => startPagesDrag(e, () => S.setBand(true), () => setMore(false))} onDoubleClick={resetPos}>
          <ToolIcon n="pages" size={18} />
          <Txt fontSize="sm" fontWeight="600" m="0" flex="1" whitespace="nowrap">Pages</Txt>
          <Box px="2" fontSize="sm" fontWeight="700" {...T.card} {...T.muted} rounded="lg">{len}</Box>
          <Box {...T.muted} display="flex"><ToolIcon n="collapse" size={16} /></Box>
        </Row>
      ) : (
        <>
          {/* title bar */}
          <Row items="center" gap="1" h="36px" px="2" cursor="move" title={docked ? 'Drag to float it · double-click to fold' : 'Drag to move, or to the top or bottom edge to clip it in · double-click to reset'} onPointerDown={(e: React.PointerEvent) => startPagesDrag(e, undefined, () => setMore(false))} onDoubleClick={resetPos}>
            <Box {...T.muted} display="flex"><ToolIcon n="grip" size={16} /></Box>
            <Txt fontSize="sm" fontWeight="600" m="0" truncate>Pages</Txt>
            <Txt fontSize="sm" fontWeight="600" m="0" flex="1" {...T.muted}>{len}</Txt>
            <PgBtn icon="sliders" title="Page settings" onClick={() => S.setState({ modal: 'page' })} />
            <PgBtn icon="duplicate" title="Duplicate page" disabled={single} onClick={() => S.duplicatePage(p.activePageId)} />
            <PgBtn icon="trash" title="Delete page" danger disabled={len < 2} onClick={() => { const pg = p.pages.find(x => x.id === p.activePageId); confirmDeletePage(pg?.name).then(ok => { if (ok) S.deletePage(p.activePageId); }); }} />
            <PgBtn icon="chevron" title="Collapse pages" onClick={() => S.setBand(false)} />
          </Row>
          <Box h="1px" {...T.divider} />

          {/* page strip: exactly the tiles that fit, then "+n", then add */}
          <Row items="start" gap="3" p="3">
            {visible.map((pg, vi) => {
              const i = from + vi; const on = pg.id === p.activePageId;
              return (
                <Box key={pg.id} flex="none" w={`${TILE}px`} cursor="pointer" role="button" tabIndex={0} aria-label={`Page ${i + 1}: ${pg.name}`} aria-current={on ? 'page' : undefined}
                  rounded="lg" p="1" {...(over === i ? { bg: 'primary/15' } : {})}
                  draggable onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('application/x-aa-page', pg.id)}
                  onDragOver={(e: React.DragEvent) => { e.preventDefault(); if (over !== i) setOver(i); }} onDragLeave={() => setOver(null)}
                  onDrop={(e: React.DragEvent) => { setOver(null); const id = e.dataTransfer.getData('application/x-aa-page'); if (id) S.movePage(id, i); }}
                  onClick={() => S.switchPage(pg.id)} onDoubleClick={() => setRename(pg.id)}
                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') S.switchPage(pg.id); }}>
                  <Box position="relative" h="64px" bg="white" overflow="hidden" rounded="lg" border="2px solid" {...(on ? { 'border-color': 'primary' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700' })}>
                    <Box as="img" alt="" src={`data:image/svg+xml;utf8,${encodeURIComponent(thumbSvg(pg.root))}`} w="100%" h="100%" object-fit="cover" draggable={false} />
                  </Box>
                  <Row items="center" gap="1" mt="1" px="1" h="20px">
                    <Txt fontSize="sm" fontWeight="700" m="0" {...(on ? { text: 'primary' } : T.muted)}>{i + 1}</Txt>
                    {rename === pg.id
                      ? <Box as="input" autoFocus defaultValue={pg.name} flex="1" min-w="0" h="20px" px="1" fontSize="sm" {...T.field} onClick={(e: React.MouseEvent) => e.stopPropagation()} onBlur={(e: any) => { S.renamePage(pg.id, e.target.value); setRename(null); }} onKeyDown={(e: any) => { if (e.key === 'Enter') e.target.blur(); else if (e.key === 'Escape') setRename(null); e.stopPropagation(); }} />
                      : <Txt fontSize="sm" m="0" flex="1" fontWeight={on ? '700' : '500'} truncate title={pg.templateOf ? 'Item page: the export makes one page per item from this' : undefined}>{pg.templateOf ? `◧ ${pg.name}` : pg.name}</Txt>}
                  </Row>
                </Box>
              );
            })}

            {/* the pages that did not fit */}
            {hasMore ? (
              <Box ref={moreWrap} flex="none" w={`${MORE_W}px`} p="1">
                <Btn type="button" title={`${hidden.length} more page${hidden.length > 1 ? 's' : ''}`} aria-label="More pages" aria-expanded={more} onClick={() => setMore(!more)}
                  w="100%" h="64px" p="0" display="flex" flex-col items="center" justify="center" gap="1" rounded="lg" border="2px solid" cursor="pointer"
                  {...(more ? { 'border-color': 'primary', bg: 'primary/10' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700', bg: 'transparent', ...T.hover })} {...T.text}>
                  <ToolIcon n="more" size={18} />
                  <Txt as="span" fontSize="sm" fontWeight="700" m="0">+{hidden.length}</Txt>
                </Btn>
              </Box>
            ) : null}

            {/* add page tile: same box as a page tile so the dashed outline lines up with the thumbnails */}
            <Box flex="none" w={`${TILE}px`} p="1">
              <Btn type="button" title={single ? 'Single-page project' : 'Add page'} aria-label="Add page" disabled={single} onClick={() => S.openPageTemplatePicker()}
                w="100%" h="64px" p="0" display="flex" items="center" justify="center" rounded="lg" bg="transparent" border="2px dashed" border-color="gray-300" dark-border-color="gray-600"
                cursor={single ? 'not-allowed' : 'pointer'} opacity={single ? '0.4' : '1'} {...(single ? {} : T.hover)} {...T.muted}>
                <ToolIcon n="plus" size={22} />
              </Btn>
            </Box>
          </Row>

          {/* "+n" popover */}
          {more && hasMore ? (
            <Box ref={popRef} position="absolute" left={`${popLeft}px`} {...(up ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' })} z="60" w={`${popW}px`} max-h="min(60vh, 360px)" overflow-y="auto" p="1" display="grid" grid-cols={`${cols}`} {...T.glassPop} role="menu" aria-label="More pages">
              {hidden.map(({ pg, i }) => (
                <Row key={pg.id} role="menuitem" items="center" gap="2" h={`${ROW_H}px`} px="2" rounded="lg" cursor="pointer" {...T.hover} onClick={() => { S.switchPage(pg.id); setMore(false); }}>
                  <Txt as="span" fontSize="sm" fontWeight="700" m="0" w="16px" {...T.muted}>{i + 1}</Txt>
                  <Txt fontSize="sm" m="0" flex="1" truncate>{pg.templateOf ? `◧ ${pg.name} (item page)` : pg.name}</Txt>
                </Row>
              ))}
            </Box>
          ) : null}
        </>
      )}
    </Box>
  );
}