/* Drop-in replacement for the `ColourPalette` export. Keep your other imports; these are the ones it needs. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { Ic } from './Icons';
import { IconBtn } from './ui';
import { ToolIcon } from './ToolIcons';
import { ColorPicker, parseColour } from '../exporters/ColorPicker';
import { T, SWATCHES } from '../theme';

/* ---------- colour palette: floating glass bar, horizontal or vertical ----------
   Drag it by the grip anywhere over the canvas. Let go near the right edge to dock it as a column down the right side, or near the bottom
   edge to dock it as a strip. The layout button (last in the bar) switches between floating-horizontal, floating-vertical, bottom and right.
   No scrolling: swatches that do not fit the bar go into a "More" popover. */

const Sliders = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2 4.5h6M13 4.5h1M2 11.5h1M8 11.5h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10.5" cy="4.5" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="5.5" cy="11.5" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Dots = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="6" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="18" cy="12" r="1.7" /></svg>
);

const Grip = () => (
  <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true" fill="currentColor">
    <circle cx="3" cy="3" r="1.2" /><circle cx="7" cy="3" r="1.2" /><circle cx="3" cy="8" r="1.2" /><circle cx="7" cy="8" r="1.2" /><circle cx="3" cy="13" r="1.2" /><circle cx="7" cy="13" r="1.2" />
  </svg>
);

/** Same grip for a column-shaped palette: the dots run sideways. */
const GripH = () => (
  <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true" fill="currentColor">
    <circle cx="3" cy="3" r="1.2" /><circle cx="8" cy="3" r="1.2" /><circle cx="13" cy="3" r="1.2" /><circle cx="3" cy="7" r="1.2" /><circle cx="8" cy="7" r="1.2" /><circle cx="13" cy="7" r="1.2" />
  </svg>
);

/** Last swatch in the mockup: a multi-colour tile that opens the Fill docker. */
const GradientTile = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <defs>
      <linearGradient id="pal-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff6ec4" />
        <stop offset="0.5" stopColor="#ffd35a" />
        <stop offset="1" stopColor="#4fd1c5" />
      </linearGradient>
    </defs>
    <rect width="22" height="22" x="2" y="2" rx="7" fill="url(#pal-grad)" />
  </svg>
);

const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);


/** Hue wheel: the "custom colour" button. */
const Wheel = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <defs>
      <linearGradient id="pw-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff5f6d" /><stop offset="1" stopColor="#ffc371" /></linearGradient>
      <linearGradient id="pw-b" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a8ff78" /><stop offset="1" stopColor="#38c6ff" /></linearGradient>
      <linearGradient id="pw-c" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#7f5aff" /><stop offset="1" stopColor="#ff6ec4" /></linearGradient>
    </defs>
    <circle cx="13" cy="13" r="12" fill="url(#pw-a)" />
    <path d="M13 13 L13 1 A12 12 0 0 1 25 13 Z" fill="url(#pw-b)" />
    <path d="M13 13 L13 25 A12 12 0 0 1 1 13 Z" fill="url(#pw-c)" />
    <circle cx="13" cy="13" r="5" fill="#fff" stroke="#00000022" />
  </svg>
);

/* palette geometry: 22px swatches on an 8px gap; FIXED_* is everything in the bar that is not swatches */
const SW = 22;            // swatch size
const SGAP = 8;           // gap between swatches
const CAP = 12;           // never show more than this many inline in a row
const CAP_V = 14;         // ...or in a column
const FIXED_FLOAT = 296;  // padding, grip, fill/stroke chip, picker, gradient tile, tools and dividers (horizontal)
const FIXED_PINNED = 282; // same without the grip
const FIXED_V = 290;      // the same parts stacked in a column, with the grip
const FIXED_V_PINNED = 272;
const SNAP = 10;          // px from an edge at which letting go docks the palette

type Dock = 'free' | 'bottom' | 'right';
type Pos = { x: number; y: number } | null;
type Offsets = { top: number; bottom: number };
const STORE_KEY = 'atomattr.studio.palette'; // older versions kept the pin state and position here; read once so nobody loses their spot
function legacyPrefs(): { pinned: boolean; pos: Pos } {
  try {
    const o = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const pos = o && o.pos && typeof o.pos.x === 'number' && typeof o.pos.y === 'number' ? { x: o.pos.x, y: o.pos.y } : null;
    return { pinned: !!o.pinned, pos };
  } catch { return { pinned: false, pos: null }; }
}

/** Little picture of each arrangement for the layout menu: the outline is the canvas, the filled bar is the palette. */
const Glyph = ({ k }: { k: 'floatH' | 'floatV' | 'bottom' | 'right' }) => {
  const bar = k === 'floatH' ? { x: 4, y: 9.5, w: 8, h: 3 } : k === 'floatV' ? { x: 10, y: 4, w: 3, h: 8 } : k === 'bottom' ? { x: 1.5, y: 11.5, w: 13, h: 3 } : { x: 11.5, y: 1.5, w: 3, h: 13 };
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} rx="1" fill="currentColor" />
    </svg>
  );
};

/** `offsets`: space taken from the top and bottom of the workspace by things that dock there (the pages strip), so a docked palette sits beside them, not under them. */
export function ColourPalette({ offsets = { top: 0, bottom: 0 } }: { offsets?: Offsets } = {}) {
  const s = useStudio();
  const pal = s.layout.palette;
  const sel = S.selNodes(s);
  const target = s.paint.target;
  const [hex, setHex] = useState('');
  const [pop, setPop] = useState<null | 'hex' | 'more' | 'pick' | 'layout'>(null);
  const [parent, setParent] = useState({ w: 1200, h: 700 });
  const [snap, setSnap] = useState<null | 'right' | 'bottom'>(null);
  const snapRef = useRef<null | 'right' | 'bottom'>(null);

  /* placement lives in the saved layout; a palette saved by an older version falls back to what it kept in localStorage */
  const old = pal.dock === undefined ? legacyPrefs() : null;
  const dock: Dock = pal.dock ?? (old?.pinned ? 'bottom' : 'free');
  const pos: Pos = pal.x !== undefined && pal.y !== undefined ? { x: pal.x, y: pal.y } : (pal.dock === undefined ? old?.pos ?? null : null);
  const docked = dock !== 'free';
  const vertical = dock === 'right' || (dock === 'free' && !!pal.vertical);
  const setPos = (v: Pos) => S.setPalette({ dock: 'free', x: v?.x, y: v?.y });

  const box = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number; w: number; h: number; pw: number; ph: number; nx?: number; ny?: number } | null>(null);

  /* once the committed position is rendered as attributes, drop the temporary drag styles */
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    el.style.transform = ''; el.style.bottom = ''; el.style.left = ''; el.style.top = ''; el.style.right = '';
  }, [pal.x, pal.y, dock, vertical]);

  /* track the workspace size so we know how many swatches fit */
  useEffect(() => {
    const el = box.current?.offsetParent as HTMLElement | null; if (!el) return;
    const read = () => setParent({ w: el.clientWidth, h: el.clientHeight });
    read(); const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [pal.visible]);

  /* close popovers on an outside click or Escape */
  useEffect(() => {
    if (!pop) return;
    const down = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setPop(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPop(null); };
    document.addEventListener('pointerdown', down); window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', down); window.removeEventListener('keydown', esc); };
  }, [pop]);

  /* keep a floating palette inside the workspace when the window is resized */
  useEffect(() => {
    if (!pos || docked) return;
    const fit = () => {
      const el = box.current; const p = el?.offsetParent as HTMLElement | null; if (!el || !p) return;
      const x = clamp(pos.x, 0, Math.max(0, p.clientWidth - el.offsetWidth));
      const y = clamp(pos.y, 0, Math.max(0, p.clientHeight - el.offsetHeight));
      if (x !== pos.x || y !== pos.y) setPos({ x, y });
    };
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [pos?.x, pos?.y, docked, vertical, pal.visible]);

  /* ----- drag by the grip. While moving we only touch the element directly (no re-render per move); the final spot is committed on release ----- */
  const onGripDown = (e: React.PointerEvent) => {
    if (docked || e.button !== 0) return;
    const el = box.current; const p = el?.offsetParent as HTMLElement | null; if (!el || !p) return;
    const r = el.getBoundingClientRect(); const pr = p.getBoundingClientRect();
    drag.current = { px: e.clientX, py: e.clientY, x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height, pw: pr.width, ph: pr.height };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const onGripMove = (e: React.PointerEvent) => {
    const d = drag.current; const el = box.current; if (!d || !el) return;
    d.nx = clamp(d.x + e.clientX - d.px, 0, Math.max(0, d.pw - d.w));
    d.ny = clamp(d.y + e.clientY - d.py, 0, Math.max(0, d.ph - d.h));
    el.style.transform = 'none'; el.style.bottom = 'auto'; el.style.right = 'auto'; el.style.left = `${d.nx}px`; el.style.top = `${d.ny}px`;
    /* close to an edge: show where it would dock */
    const t: null | 'right' | 'bottom' = d.pw - (d.nx + d.w) < SNAP ? 'right' : (!vertical && d.ph - offsets.bottom - (d.ny + d.h) < SNAP) ? 'bottom' : null;
    if (t !== snapRef.current) { snapRef.current = t; setSnap(t); }
  };
  const onGripUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d) return;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* already released */ }
    const t = snapRef.current; snapRef.current = null; setSnap(null);
    if (t) { S.setPalette({ dock: t, x: undefined, y: undefined, ...(t === 'right' ? { vertical: true } : {}) }); return; }
    if (d.nx !== undefined && d.ny !== undefined) setPos({ x: Math.round(d.nx), y: Math.round(d.ny) });
  };

  /* the layout menu */
  const arrange = (k: 'floatH' | 'floatV' | 'bottom' | 'right') => {
    setPop(null);
    if (k === 'bottom') S.setPalette({ dock: 'bottom', x: undefined, y: undefined });
    else if (k === 'right') S.setPalette({ dock: 'right', vertical: true, x: undefined, y: undefined });
    else S.setPalette({ dock: 'free', vertical: k === 'floatV', x: undefined, y: undefined });
  };
  const current: 'floatH' | 'floatV' | 'bottom' | 'right' = dock === 'bottom' ? 'bottom' : dock === 'right' ? 'right' : vertical ? 'floatV' : 'floatH';

  const paint = (c: string) => S.patchNodes(s.sel, target === 'fill' ? { fill: c } : { stroke: c, strokeWidth: sel[0].style.strokeWidth || 2 });
  const apply = (c: string) => { S.pushRecentColor(c); if (sel.length) paint(c); else S.toast('Select an object to colour it.'); };
  const commitHex = () => { if (/^#?[0-9a-f]{3,8}$/i.test(hex)) { apply(hex.startsWith('#') ? hex : `#${hex}`); setHex(''); } };

  const cur: string | undefined = sel[0]?.style[target === 'fill' ? 'fill' : 'stroke'];
  const swatches = [...SWATCHES, ...s.project!.colors];

  /* how many swatches fit: slots left after the fixed parts, minus the gradient tile; if they do not all fit, one slot becomes "More" */
  const availW = (docked ? parent.w : parent.w * 0.92) - (docked ? FIXED_PINNED : FIXED_FLOAT);
  const availH = (dock === 'right' ? parent.h - offsets.top - offsets.bottom : (parent.h - offsets.top - offsets.bottom) * 0.88) - (docked ? FIXED_V_PINNED : FIXED_V);
  const room = vertical
    ? Math.max(3, Math.min(docked ? 40 : CAP_V, Math.floor((availH + SGAP) / (SW + SGAP)) - 1))
    : Math.max(4, Math.min(docked ? 60 : CAP, Math.floor((availW + SGAP) / (SW + SGAP)) - 1));
  const overflow = swatches.length > room;
  const inline = overflow ? swatches.slice(0, room - 1) : swatches;
  const rest = overflow ? swatches.slice(room - 1) : [];

  /** a swatch is "light" when a dark tick reads better on top of it */
  const isLight = (c: string) => { const p = parseColour(c, true); return !!p && p.v > 0.72 && p.s < 0.45; };
  const swatch = (c: string, key: string) => {
    const on = same(c, cur);
    return (
      <Btn key={key} type="button" title={c} aria-label={`Colour ${c}`} aria-pressed={on} onClick={() => apply(c)} w={`${SW}px`} h={`${SW}px`} shrink="0" p="0" rounded="full" cursor="pointer" bg={c}
        display="flex" items="center" justify="center" border="2px solid" transition="all" duration="180" ease="out"
        {...(on
          ? { 'border-color': 'primary', scale: '1.12', shadow: 'md', text: isLight(c) ? 'gray-900' : 'white' }
          : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700', 'hover-scale': '1.18', 'hover-shadow': 'md', text: 'transparent' })}>
        {on ? <ToolIcon n="check" size={12} /> : null}
      </Btn>
    );
  };

  const offB = `${offsets.bottom}px`; const offT = `${offsets.top}px`;
  const placement = dock === 'bottom'
    ? { left: '0', bottom: offB, w: '100%', display: 'flex', justify: 'center' }
    : dock === 'right'
      ? { right: '0', top: offT, bottom: offB, display: 'flex', items: 'center' }
      : pos
        ? { left: `${pos.x}px`, top: `${pos.y}px` }
        : vertical
          ? { right: '16px', top: '50%', transform: 'translateY(-50%)' }
          : { left: '50%', bottom: `${16 + offsets.bottom}px`, transform: 'translateX(-50%)' };

  /* popovers open away from the bar: up or down for a row, left or right for a column */
  const toLeft = dock === 'right' || (dock === 'free' && (pos ? pos.x > parent.w / 2 - 40 : true));
  const flip = !vertical && !docked && !!pos && pos.y < 240; // not enough room above: open popovers downwards
  const popAnim = flip ? 'studio-pop-down 160ms cubic-bezier(0.2, 0.8, 0.2, 1) both' : 'studio-pop 160ms cubic-bezier(0.2, 0.8, 0.2, 1) both';
  const popSide = (low = false) => vertical
    ? { ...(toLeft ? { right: 'calc(100% + 14px)' } : { left: 'calc(100% + 14px)' }), ...(low ? { bottom: '-4px' } : { top: '-4px' }) }
    : flip ? { top: 'calc(100% + 12px)' } : { bottom: 'calc(100% + 12px)' };
  const popBox = { position: 'absolute', z: '50', p: '3', display: 'flex', 'flex-col': true, gap: '2', animate: popAnim, ...T.glassPop } as const;
  const tool = (on: boolean) => (on ? T.active : { bg: 'transparent', ...T.hover });
  const toolProps = { w: '30px', h: '30px', p: '0', display: 'flex', items: 'center', justify: 'center', rounded: '4px', border: '0', cursor: 'pointer', transition: 'all', duration: '150', ...T.text } as const;
  const divider = vertical ? <Box w="22px" h="1px" shrink="0" {...T.divider} /> : <Box w="1px" h="22px" shrink="0" {...T.divider} />;
  const LayoutRow = ({ k, label }: { k: 'floatH' | 'floatV' | 'bottom' | 'right'; label: string }) => (
    <Row items="center" gap="2" h="30px" px="2" rounded="lg" cursor="pointer" role="menuitemradio" aria-checked={current === k} onClick={() => arrange(k)} {...(current === k ? T.active : { ...T.hover, ...T.text })}>
      <Glyph k={k} /><Txt fontSize="sm" m="0" flex="1" whitespace="nowrap">{label}</Txt>{current === k ? <ToolIcon n="check" size={14} /> : null}
    </Row>
  );

  if (!pal.visible) {
    return <IconBtn icon="palette" title="Show colour palette" position="absolute" left="50%" bottom={`${16 + offsets.bottom}px`} z="40" transform="translateX(-50%)" {...T.glass} size={42} animate="studio-pop 200ms ease-out both" onClick={() => S.setPalette({ visible: true })} />;
  }

  /* the bar itself: the same parts in a row or in a column */
  const grip = !docked ? (
    <Box role="presentation" title="Drag to move · near an edge to dock · double-click to reset" aria-label="Move palette" w={vertical ? '30px' : '14px'} h={vertical ? '14px' : '30px'} shrink="0" display="flex" items="center" justify="center" cursor="grab" touch-action="none" opacity="60" hover-opacity="100" transition="all" duration="150" {...T.muted}
      onPointerDown={onGripDown} onPointerMove={onGripMove} onPointerUp={onGripUp} onPointerCancel={onGripUp} onDoubleClick={() => S.setPalette({ x: undefined, y: undefined })}>{vertical ? <GripH /> : <Grip />}</Box>
  ) : null;

  const chip = (
    <Box position="relative" w="40px" h="32px" shrink="0">
      <Btn type="button" aria-label="Edit fill" title="Fill" aria-pressed={target === 'fill'} onClick={() => S.setState({ paint: { target: 'fill' } })} position="absolute" left="0" top="0" w="22px" h="22px" p="0" rounded="lg" border="2px solid" cursor="pointer" transition="all" duration="180" z={target === 'fill' ? '2' : '1'} shadow={target === 'fill' ? 'md' : 'none'} scale={target === 'fill' ? '1.08' : '1'}
        bg={sel[0]?.style.fill && !/gradient\(/.test(sel[0].style.fill) ? sel[0].style.fill : 'transparent'} bg-image={sel[0]?.style.fill && /gradient\(/.test(sel[0].style.fill) ? sel[0].style.fill : undefined}
        {...(target === 'fill' ? { 'border-color': 'primary' } : { 'border-color': 'gray-300', 'dark-border-color': 'gray-600' })} />
      <Btn type="button" aria-label="Edit stroke" title="Stroke" aria-pressed={target === 'stroke'} onClick={() => S.setState({ paint: { target: 'stroke' } })} position="absolute" left="14px" top="9px" w="22px" h="22px" p="0" rounded="lg" border="4px solid" cursor="pointer" transition="all" duration="180" z={target === 'stroke' ? '2' : '1'} shadow={target === 'stroke' ? 'md' : 'none'} scale={target === 'stroke' ? '1.08' : '1'}
        bg="white" dark-bg="gray-900" border-color={sel[0]?.style.stroke || (target === 'stroke' ? 'primary' : 'gray-300')} />
    </Box>
  );

  const swatchList = (
    <Box display="flex" {...(vertical ? { 'flex-col': true } : {})} gap="2" {...(docked ? { flex: '1', 'min-w': '0', 'min-h': '0', justify: 'between', items: 'center' } : { items: 'center', shrink: '0' })}>
      {inline.map((c, i) => swatch(c, `${c}-${i}`))}
      {overflow ? (
        <Box position="relative" shrink="0">
          <Btn type="button" title={`${rest.length} more colours`} aria-label="More colours" aria-expanded={pop === 'more'} onClick={() => setPop(pop === 'more' ? null : 'more')} w={`${SW}px`} h={`${SW}px`} p="0" display="flex" items="center" justify="center" rounded="full" border="1.5px dashed" cursor="pointer" transition="all" duration="180"
            {...(pop === 'more' ? { 'border-color': 'primary', bg: 'primary/10', text: 'primary' } : { 'border-color': 'gray-300', 'dark-border-color': 'gray-600', bg: 'transparent', 'hover-border-color': 'primary', ...T.text })}><Dots /></Btn>
          {pop === 'more' ? (
            <Box {...(vertical ? {} : { left: '0' })} w="236px" {...popBox} {...popSide()}>
              <Row items="center" justify="between"><Txt fontSize="sm" fontWeight="600" m="0" {...T.muted}>More colours</Txt><Txt fontSize="sm" m="0" {...T.muted}>{swatches.length} total</Txt></Row>
              <Box display="grid" grid-cols="7" gap="2">{rest.map((c, i) => swatch(c, `r-${c}-${i}`))}</Box>
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );

  const tools = (
    <Box display="flex" {...(vertical ? { 'flex-col': true } : {})} items="center" gap="1" shrink="0">
      {/* custom colour picker (our own, no native input): applies live while you drag, adds to recents when you let go */}
      <Box position="relative" shrink="0">
        <Btn type="button" title="Custom colour" aria-label="Custom colour picker" aria-expanded={pop === 'pick'} onClick={() => { if (pop !== 'pick' && !sel.length) { S.toast('Select an object to colour it.'); return; } setPop(pop === 'pick' ? null : 'pick'); }}
          w="30px" h="30px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" bg="transparent" cursor="pointer" transition="all" duration="180" hover-scale="1.10">
          <Wheel />
        </Btn>
        {pop === 'pick' ? (
          <Box {...(vertical ? {} : { left: '-90px' })} min-w="236px" {...popBox} {...popSide(true)}>
            <ColorPicker value={cur} recent={s.recentColors} onChange={c => { if (sel.length) paint(c); }} onCommit={c => S.pushRecentColor(c)} />
          </Box>
        ) : null}
      </Box>
      <Btn type="button" title="Gradients and fills…" aria-label="Open Fill docker" onClick={() => S.openDocker('fill')} {...toolProps} {...tool(false)}><GradientTile /></Btn>
      <IconBtn icon="eyedropper" title="Eyedropper (I)" size={30} rounded="lg" onClick={() => S.setTool('eyedropper')} />
      <Box position="relative">
        <Btn type="button" aria-label="Hex and recent colours" title="Hex and recent colours" aria-expanded={pop === 'hex'} onClick={() => setPop(pop === 'hex' ? null : 'hex')} {...toolProps} {...tool(pop === 'hex')}><Sliders /></Btn>
        {pop === 'hex' ? (
          <Box {...(vertical ? {} : { right: '-60px' })} w="216px" {...popBox} gap="3" {...popSide(true)}>
            <Box>
              <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Hex</Txt>
              <Input type="text" value={hex} placeholder={cur || '#hex'} aria-label="Hex colour" onChange={(e: any) => setHex(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') commitHex(); e.stopPropagation(); }} w="100%" h="32px" px="3" fontSize="sm" {...T.field} />
            </Box>
            {s.recentColors.length > 0 ? (
              <Box>
                <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Recent</Txt>
                <Row gap="2" wrap="wrap">
                  {s.recentColors.slice(0, 12).map(c => <Btn key={c} type="button" title={c} aria-label={`Recent colour ${c}`} onClick={() => apply(c)} w="22px" h="22px" p="0" rounded="lg" border="2px solid" border-color="gray-200" dark-border-color="gray-700" cursor="pointer" bg={c} transition="all" duration="150" hover-scale="1.18" />)}
                </Row>
              </Box>
            ) : <Txt fontSize="sm" m="0" {...T.muted}>Colours you use show up here.</Txt>}
          </Box>
        ) : null}
      </Box>
      <Box position="relative">
        <Btn type="button" aria-label="Palette layout" aria-haspopup="menu" aria-expanded={pop === 'layout'} title="Layout: horizontal, vertical, dock right or bottom" onClick={() => setPop(pop === 'layout' ? null : 'layout')} {...toolProps} {...tool(pop === 'layout')}><Glyph k={current} /></Btn>
        {pop === 'layout' ? (
          <Box {...(vertical ? {} : { right: '-60px' })} w="210px" {...popBox} gap="1" p="1" role="menu" aria-label="Palette layout" {...popSide(true)}>
            <Txt fontSize="sm" fontWeight="600" m="0" px="2" pt="1" {...T.muted}>Palette layout</Txt>
            <LayoutRow k="floatH" label="Floating, horizontal" />
            <LayoutRow k="floatV" label="Floating, vertical" />
            <LayoutRow k="bottom" label="Dock to the bottom" />
            <LayoutRow k="right" label="Dock to the right" />
            <Box h="1px" my="1" {...T.divider} />
            <Row items="center" gap="2" h="30px" px="2" rounded="lg" cursor="pointer" role="menuitem" onClick={() => { setPop(null); S.setPalette({ visible: false }); }} {...T.hover} {...T.text}>
              <ToolIcon n="x" size={16} /><Txt fontSize="sm" m="0" flex="1">Hide palette</Txt>
            </Row>
          </Box>
        ) : null}
      </Box>
    </Box>
  );

  return (
    <>
      {/* where it would dock if let go now */}
      {snap ? <Box position="absolute" z="39" pointerEvents="none" border="2px dashed" border-color="primary" bg="primary/10" dark-bg="primary/20" rounded="lg" animate="studio-fade 120ms ease-out both"
        {...(snap === 'right' ? { right: '0', top: offT, bottom: offB, w: '64px' } : { left: '0', right: '0', bottom: offB, h: '58px' })} /> : null}
      <Box ref={box} position="absolute" z="40" max-w={dock === 'bottom' ? '100%' : '92%'} {...placement}>
        <Box display="flex" {...(vertical ? { 'flex-col': true, px: '2', py: '3', 'max-h': '100%', w: dock === 'right' ? '56px' : 'fit-content', ...(dock === 'right' ? { h: '100%' } : {}) } : { px: '3', py: '2', 'max-w': '100%', ...(dock === 'bottom' ? { w: '100%' } : {}) })} items="center" gap={vertical ? '2' : '3'} {...T.glass}
          rounded={docked ? '0' : 'md'} shadow={docked ? 'none' : '2xl'} animate="studio-rise 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both">
          {grip}
          {chip}
          {divider}
          {swatchList}
          {divider}
          {tools}
        </Box>
      </Box>
    </>
  );
}
