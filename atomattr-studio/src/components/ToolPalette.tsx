import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio, type Tool } from '../state/store';
import { elOf } from '../canvas/registry';
import { Kbd } from './ui';
import { T } from '../theme';
import { ALL_TOOLS, type ToolDef } from './tools';
import { ToolIcon } from './ToolIcons';

const RAIL_W = 48;   // rail width, floating and docked (40px buttons + 4px padding each side)
const ZONE = 56;     // edge strip of the canvas area that docks the rail
const BTN = 40;      // button height
const GAP = 4;       // gap between buttons
const CHROME = 46;   // padding + grip + divider, i.e. everything in the rail that is not a button

/* ---------- what the rail shows ----------
   Each entry is one icon button. Entries with several tools show the current one and open a flyout with the rest.
   When the rail is too short for everything, the entries with the lowest `hide` rank move into the "More" popover
   (no scrolling). Entries without a rank stay as long as possible; Section / Component / Code View never move. */
type Entry = { ids: Tool[]; code?: boolean; hide?: number };

const MAIN: Entry[] = [
  { ids: ['select', 'direct'] },
  { ids: ['text', 'heading'] },
  { ids: ['rect', 'rounded', 'ellipse', 'polygon', 'star', 'line', 'arrow'] },
  { ids: ['pen', 'pencil', 'spiral'], hide: 5 },
  { ids: ['fountain', 'transparency', 'contour', 'dropshadow', 'blend'], hide: 4 },
  { ids: ['eyedropper'], hide: 6 },
  { ids: ['container', 'grid'], hide: 2 },
  { ids: ['image', 'crop'], hide: 3 },
  { ids: ['button'], hide: 1 },
  { ids: ['hand'] },
  { ids: ['zoom'] },
];
const DOCK: Entry[] = [
  { ids: ['section'] },
  { ids: ['component'] },
  { ids: [], code: true },
];

/* Any tool defined in tools.ts that is not placed above is added at the end, so nothing is ever unreachable. */
const BY_ID = new Map(ALL_TOOLS.map(t => [t.id, t] as const));
const placed = new Set([...MAIN, ...DOCK].flatMap(e => e.ids));
const leftover = ALL_TOOLS.filter(t => !placed.has(t.id)).map(t => t.id);
if (leftover.length) MAIN.push({ ids: leftover });
const ENTRIES = [...MAIN, ...DOCK];
const defs = (e: Entry): ToolDef[] => e.ids.map(id => BY_ID.get(id)).filter((t): t is ToolDef => !!t);

/** Splits MAIN into what is shown and what goes into "More", for a rail that has `availH` px of height. */
function layoutRail(availH: number): { shown: Entry[]; hidden: Entry[] } {
  const slots = Math.max(DOCK.length + 3, Math.floor((availH - CHROME) / (BTN + GAP)) - 1); // one slot is the layout button
  if (MAIN.length + DOCK.length <= slots) return { shown: MAIN, hidden: [] };
  const capMain = Math.max(2, slots - DOCK.length - 1);          // one slot is the More button itself
  const gone = new Set(
    MAIN.map((e, i) => ({ e, r: e.hide ?? 50 + (MAIN.length - i) })).sort((a, b) => a.r - b.r).slice(0, MAIN.length - capMain).map(o => o.e),
  );
  return { shown: MAIN.filter(e => !gone.has(e)), hidden: MAIN.filter(e => gone.has(e)) };
}

/* ---------- drag / dock ---------- */

type Dk = 'left' | 'right' | 'top' | 'bottom';

/** Drag the palette anywhere. Let go within the edge strip of the canvas area and it docks there: a column on the left or right, a row on the top or bottom. */
function startToolsDrag(e: React.PointerEvent, wasDocked: boolean, horiz: boolean) {
  if (e.button !== 0) return; e.preventDefault();
  const area = elOf('sys:area'); if (!area) return; const sx = e.clientX; const sy = e.clientY; let floating = !wasDocked; const off = { x: 20, y: 12 };
  const zoneAt = (cx: number, cy: number): Dk | null => {
    const r = area.getBoundingClientRect();
    const d: [Dk, number][] = [['left', cx - r.left], ['right', r.right - cx], ['top', cy - r.top], ['bottom', r.bottom - cy]];
    const hit = d.filter(([, v]) => v < ZONE).sort((a, b) => a[1] - b[1])[0];
    return hit ? hit[0] : null;
  };
  const mv = (ev: PointerEvent) => {
    const r = area.getBoundingClientRect();
    if (!floating) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 10) return; floating = true; S.setToolsFloat(horiz); }
    S.setToolsPos(Math.max(0, Math.min(r.width - (horiz ? 200 : RAIL_W), ev.clientX - r.left - off.x)), Math.max(0, Math.min(r.height - (horiz ? RAIL_W : 120), ev.clientY - r.top - off.y)));
    S.setState({ dockZone: zoneAt(ev.clientX, ev.clientY) });
  };
  const up = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
    const z = floating ? zoneAt(ev.clientX, ev.clientY) : null; S.setState({ dockZone: null }); if (z) S.setToolsDock(z);
  };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}

/** Drop-zone hints shown while the palette is dragged near an edge. */
export function DockZones() {
  const s = useStudio(); const area = elOf('sys:area'); const z = s.dockZone as Dk | null; if (!z || !area) return null; const r = area.getBoundingClientRect();
  const v = z === 'left' || z === 'right';
  return <Box position="fixed" top={`${z === 'bottom' ? r.bottom - RAIL_W : r.top}px`} left={`${z === 'right' ? r.right - RAIL_W : r.left}px`} w={`${v ? RAIL_W : r.width}px`} h={`${v ? r.height : RAIL_W}px`} z="95" bg="primary/20" border="2px dashed" border-color="primary" pointerEvents="none" display="flex" items="center" justify="center"><Txt fontSize="sm" fontWeight="700" m="0" text="primary">Dock {z}</Txt></Box>;
}

/** A tiny picture of each arrangement: the outline is the canvas, the filled bar is the tools. */
type Arr = 'floatV' | 'floatH' | Dk;
const Glyph = ({ k }: { k: Arr }) => {
  const bar = { floatV: { x: 4, y: 4, w: 3, h: 8 }, floatH: { x: 4, y: 9.5, w: 8, h: 3 }, left: { x: 1.5, y: 1.5, w: 3, h: 13 }, right: { x: 11.5, y: 1.5, w: 3, h: 13 }, top: { x: 1.5, y: 1.5, w: 13, h: 3 }, bottom: { x: 1.5, y: 11.5, w: 13, h: 3 } }[k];
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} rx="1" fill="currentColor" /></svg>;
};

/* ---------- one rail button: icon only (the name and shortcut are in the tooltip) ---------- */

function RailBtn({ icon, title, active, onClick, onContextMenu, horiz, children }: { icon?: string; title: string; active?: boolean; onClick: (e: React.MouseEvent) => void; onContextMenu?: (e: React.MouseEvent) => void; horiz?: boolean; children?: React.ReactNode }) {
  return (
    <Btn
      type="button" title={title} aria-label={title} aria-pressed={active} onClick={onClick} onContextMenu={onContextMenu}
      w={horiz ? `${BTN}px` : '100%'} h={`${BTN}px`} shrink="0" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer"
      {...(active ? { bg: 'primary', text: 'white' } : { bg: 'transparent', ...T.hover, ...T.text })}
    >
      {children ?? <ToolIcon n={icon!} size={22} />}
    </Btn>
  );
}

export function ToolPalette({ area, docked }: { area: { w: number; h: number }; docked?: Dk }) {
  const s = useStudio(); const pos = s.layout.tools;
  const [fly, setFly] = useState<{ i: number; x: number; y: number } | null>(null);
  const [more, setMore] = useState<{ x: number; y: number } | null>(null);
  const [last, setLast] = useState<Record<number, Tool>>({});
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const horiz = docked ? docked === 'top' || docked === 'bottom' : !!pos.horizontal;
  const current: Arr = docked ?? (horiz ? 'floatH' : 'floatV');

  /* a docked row measures itself: the canvas column is narrower than the whole area */
  const bar = useRef<HTMLDivElement | null>(null); const [barLen, setBarLen] = useState(0);
  useEffect(() => {
    const el = bar.current; if (!el || !(docked === 'top' || docked === 'bottom')) return;
    const read = () => setBarLen(el.clientWidth); read(); const ro = new ResizeObserver(read); ro.observe(el); return () => ro.disconnect();
  }, [docked]);

  const avail = horiz ? (docked ? (barLen || area.w) : area.w - 24) : (docked ? area.h : area.h - 24);
  const { shown, hidden } = layoutRail(avail);
  const rows = shown.length + DOCK.length + (hidden.length ? 1 : 0) + 1;
  const railLen = CHROME + rows * (BTN + GAP);

  const grip = (
    <Box {...(horiz ? { w: '16px', h: '100%' } : { h: '16px' })} shrink="0" display="flex" items="center" justify="center" cursor="move" touch-action="none" {...T.muted}
      title={docked ? 'Drag out to float the tools' : 'Drag to move. Drop on an edge to dock.'}
      onPointerDown={(e: React.PointerEvent) => startToolsDrag(e, !!docked, horiz)}><ToolIcon n="grip" size={16} /></Box>
  );

  /* popovers open beside a column, below a row (above it when the row is on the bottom edge) */
  const place = (r: DOMRect, h: number) => horiz
    ? { x: Math.max(8, Math.min(r.left, window.innerWidth - 256)), y: docked === 'bottom' || (!docked && r.bottom + h + 12 > window.innerHeight) ? Math.max(8, r.top - h - 6) : r.bottom + 6 }
    : { x: docked === 'right' ? r.left - 254 : r.right + 6, y: Math.max(8, Math.min(r.top, window.innerHeight - 16 - h)) };
  const openFly = (i: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect(); const n = defs(ENTRIES[i]).length;
    setMore(null); setMenu(null); setFly(fly?.i === i ? null : { i, ...place(r, n * 30 + 8) });
  };
  const openMore = (el: HTMLElement) => {
    const r = el.getBoundingClientRect(); const h = hidden.reduce((n, e) => n + defs(e).length, 0) * 30 + hidden.length * 9 + 8;
    setFly(null); setMenu(null); setMore(more ? null : place(r, h));
  };
  const openMenu = (el: HTMLElement) => { setFly(null); setMore(null); setMenu(menu ? null : place(el.getBoundingClientRect(), 8 * 30 + 40)); };
  const pick = (i: number, id: Tool) => { setLast({ ...last, [i]: id }); S.setTool(id); setFly(null); setMore(null); };
  const arrange = (k: Arr) => { setMenu(null); if (k === 'floatH') S.setToolsFloat(true); else if (k === 'floatV') S.setToolsFloat(false); else S.setToolsDock(k); };

  const renderEntry = (e: Entry) => {
    const i = ENTRIES.indexOf(e);
    if (e.code) {
      return (
        <Box key="code" position="relative" shrink="0">
          <RailBtn horiz={horiz} icon="code" title="Code view (Ctrl+E)" active={s.layout.code.open} onClick={() => S.toggleCode()} />
        </Box>
      );
    }
    const g = defs(e); if (!g.length) return null;
    const cur = g.find(t => t.id === s.tool) || g.find(t => t.id === last[i]) || g[0];
    const active = g.some(t => t.id === s.tool);
    return (
      <Box key={i} position="relative" shrink="0">
        <RailBtn horiz={horiz} icon={cur.icon} title={`${cur.name} (${cur.key})`} active={active} onClick={() => pick(i, cur.id)}
          onContextMenu={(ev: React.MouseEvent) => { ev.preventDefault(); if (g.length > 1) openFly(i, ev.currentTarget as HTMLElement); }} />
        {g.length > 1 && (
          <Box position="absolute" right="3px" bottom="3px" w="12px" h="12px" cursor="pointer" display="flex" items="center" justify="center" title="More tools"
            {...(active ? { text: 'white' } : T.muted)}
            onPointerDown={(ev: React.PointerEvent) => ev.stopPropagation()}
            onClick={(ev: React.MouseEvent) => openFly(i, (ev.currentTarget as HTMLElement).parentElement as HTMLElement)}><ToolIcon n="flyout" size={8} /></Box>
        )}
      </Box>
    );
  };

  const row = (t: ToolDef, i: number) => (
    <Row key={t.id} items="center" gap="2" h="30px" px="2" rounded="lg" cursor="pointer" {...(s.tool === t.id ? T.active : T.hover)} onClick={() => pick(i, t.id)}>
      <ToolIcon n={t.icon} size={20} /><Txt fontSize="md" m="0" flex="1" truncate>{t.name}</Txt><Kbd>{t.key}</Kbd>
    </Row>
  );

  /* flyout of one entry's tools */
  const flyout = fly && (
    <Box position="fixed" left={`${fly.x}px`} top={`${fly.y}px`} z="96" {...T.glassPop} p="1" w="248px" onPointerLeave={() => setFly(null)} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {defs(ENTRIES[fly.i]).map(t => row(t, fly.i))}
    </Box>
  );

  /* "More": every tool of the entries that did not fit, grouped, no scrolling */
  const morePanel = more && (
    <Box position="fixed" left={`${more.x}px`} top={`${more.y}px`} z="96" {...T.glassPop} p="1" w="248px" max-h="90vh" onPointerLeave={() => setMore(null)} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {hidden.map((e, gi) => (
        <Box key={gi}>
          {gi > 0 && <Box h="1px" my="1" {...T.divider} />}
          {defs(e).map(t => row(t, ENTRIES.indexOf(e)))}
        </Box>
      ))}
    </Box>
  );

  const LayoutRow = ({ k, label }: { k: Arr; label: string }) => (
    <Row items="center" gap="2" h="30px" px="2" rounded="lg" cursor="pointer" role="menuitemradio" aria-checked={current === k} onClick={() => arrange(k)} {...(current === k ? T.active : { ...T.hover, ...T.text })}>
      <Glyph k={k} /><Txt fontSize="sm" m="0" flex="1" whitespace="nowrap">{label}</Txt>{current === k ? <ToolIcon n="check" size={14} /> : null}
    </Row>
  );
  const menuPanel = menu && (
    <Box position="fixed" left={`${menu.x}px`} top={`${menu.y}px`} z="96" {...T.glassPop} p="1" w="218px" role="menu" aria-label="Tools layout" onPointerLeave={() => setMenu(null)} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      <Txt fontSize="sm" fontWeight="600" m="0" px="2" pt="1" pb="1" {...T.muted}>Tools layout</Txt>
      <LayoutRow k="floatV" label="Floating, vertical" />
      <LayoutRow k="floatH" label="Floating, horizontal" />
      <Box h="1px" my="1" {...T.divider} />
      <LayoutRow k="left" label="Dock to the left" />
      <LayoutRow k="right" label="Dock to the right" />
      <LayoutRow k="top" label="Dock to the top" />
      <LayoutRow k="bottom" label="Dock to the bottom" />
    </Box>
  );

  const divider = horiz ? <Box w="1px" h="24px" mx="1" shrink="0" {...T.divider} /> : <Box h="1px" mx="2" my="1" shrink="0" {...T.divider} />;
  const body = (
    <>
      {grip}
      {shown.map(renderEntry)}
      {hidden.length > 0 && <RailBtn horiz={horiz} icon="more" title="More tools" active={hidden.some(e => e.ids.includes(s.tool))} onClick={(ev: React.MouseEvent) => openMore(ev.currentTarget as HTMLElement)} />}
      {divider}
      {DOCK.map(renderEntry)}
      <RailBtn horiz={horiz} title="Layout: float, or dock to any edge" active={!!menu} onClick={(ev: React.MouseEvent) => openMenu(ev.currentTarget as HTMLElement)}><Glyph k={current} /></RailBtn>
      {[flyout, morePanel, menuPanel].map((n, i) => n ? createPortal(n, document.body, `pop${i}`) : null)}
    </>
  );

  const flow = horiz ? { 'flex-row': true, items: 'center' } : { 'flex-col': true };
  if (docked) return (
    <Box ref={bar} shrink="0" {...(horiz ? { h: `${RAIL_W}px`, w: '100%' } : { w: `${RAIL_W}px`, h: '100%' })} display="flex" {...flow} gap="1" p="1" {...T.chrome}
      border-l={docked === 'right' ? '1px solid' : '0'} border-r={docked === 'left' ? '1px solid' : '0'} border-t={docked === 'bottom' ? '1px solid' : '0'} border-b={docked === 'top' ? '1px solid' : '0'}
      role="toolbar" aria-label="Tools" aria-orientation={horiz ? 'horizontal' : 'vertical'} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {body}
    </Box>
  );
  const len = Math.min(railLen, horiz ? area.w - 24 : area.h - 24);
  return (
    <Box position="absolute" left={`${Math.min(pos.x, Math.max(0, area.w - (horiz ? len : RAIL_W)))}px`} top={`${Math.min(pos.y, Math.max(0, area.h - (horiz ? RAIL_W : railLen) - 12))}px`} z="40" {...T.glass} p="1" display="flex" {...flow} gap="1"
      {...(horiz ? { w: `${len}px`, h: `${RAIL_W}px` } : { w: `${RAIL_W}px` })} role="toolbar" aria-label="Tools" aria-orientation={horiz ? 'horizontal' : 'vertical'} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {body}
    </Box>
  );
}
