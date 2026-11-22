import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent as RDE, KeyboardEvent as RKey, MouseEvent as RME, PointerEvent as RPE, WheelEvent as RWheel } from 'react';
import { Box, Input, Option, Row, Select, Txt } from 'atomattr/react';
import type { SiteElement, StudioPage } from '../types/project';
import { DRAW_KINDS, TOOLS, TOOL_MIME } from '../registry/tools';
import { emitCursor, onFit } from '../registry/events';
import type { DrawKind, DrawTool, WebTool } from '../registry/tools';
import { FIELD } from './Studio-Ui';

export type Geometry = { x: number; y: number; w: number; h: number };
export const DEVICE_WIDTH: Record<string, number> = { desktop: 1440, tablet: 768, mobile: 390 };
export const DEFAULT_SIZE: Record<DrawTool, { w: number; h: number }> = {
  section: { w: 360, h: 220 }, grid: { w: 480, h: 240 }, heading: { w: 480, h: 64 }, text: { w: 360, h: 72 }, button: { w: 160, h: 48 }, image: { w: 320, h: 220 },
};
const GRID = 8;
const MIN = 16;
const HANDLES = [
  { k: 'nw', l: 0, t: 0, c: 'nwse-resize' }, { k: 'n', l: 0.5, t: 0, c: 'ns-resize' }, { k: 'ne', l: 1, t: 0, c: 'nesw-resize' },
  { k: 'e', l: 1, t: 0.5, c: 'ew-resize' }, { k: 'se', l: 1, t: 1, c: 'nwse-resize' }, { k: 's', l: 0.5, t: 1, c: 'ns-resize' },
  { k: 'sw', l: 0, t: 1, c: 'nesw-resize' }, { k: 'w', l: 0, t: 0.5, c: 'ew-resize' },
];
const GUIDE = '#ec4899';
const clampZoom = (value: number) => Math.min(1.5, Math.max(0.25, Math.round(value * 100) / 100));
const snapGrid = (value: number) => Math.round(value / GRID) * GRID;

const num = (value: unknown, fallback = 0) => { const n = parseFloat(String(value ?? '')); return Number.isFinite(n) ? n : fallback; };
export function geometryOf(element: SiteElement): Geometry {
  const s = element.style as Record<string, unknown>;
  const d = DEFAULT_SIZE[element.kind as DrawTool] || { w: 240, h: 120 };
  return { x: num(s.left), y: num(s.top), w: num(s.w, d.w), h: num(s.h, d.h) };
}

/** Base styles, then md/lg overrides as if the frame were a real device, then geometry last so it always wins. */
function attrsFor(element: SiteElement, frameWidth: number, geo: Geometry): Record<string, string> {
  const s = element.style as Record<string, any>;
  const out: Record<string, string> = {};
  const add = (source?: Record<string, any>) => { if (source) for (const [k, v] of Object.entries(source)) if (k !== 'md' && k !== 'lg' && typeof v === 'string') out[k] = v; };
  add(s);
  if (frameWidth >= 768) add(s.md);
  if (frameWidth >= 1024) add(s.lg);
  delete out['min-h']; delete out['max-w']; delete out.m;
  return { ...out, position: 'absolute', left: `${geo.x}px`, top: `${geo.y}px`, w: `${geo.w}px`, h: `${geo.h}px` };
}

type Guides = { x: number[]; y: number[] };
/** Snap a moving box to the edges and centres of the page and of the other elements; returns the vertical/horizontal guide lines that fired. */
function align(geo: Geometry, others: Geometry[], tolerance: number): { geo: Geometry; guides: Guides } {
  const xs = [geo.x, geo.x + geo.w / 2, geo.x + geo.w];
  const ys = [geo.y, geo.y + geo.h / 2, geo.y + geo.h];
  let bestX: { d: number; at: number } | null = null;
  let bestY: { d: number; at: number } | null = null;
  for (const other of others) {
    for (const target of [other.x, other.x + other.w / 2, other.x + other.w]) for (const mine of xs) { const d = target - mine; if (Math.abs(d) <= tolerance && (!bestX || Math.abs(d) < Math.abs(bestX.d))) bestX = { d, at: target }; }
    for (const target of [other.y, other.y + other.h / 2, other.y + other.h]) for (const mine of ys) { const d = target - mine; if (Math.abs(d) <= tolerance && (!bestY || Math.abs(d) < Math.abs(bestY.d))) bestY = { d, at: target }; }
  }
  return { geo: { ...geo, x: geo.x + (bestX?.d ?? 0), y: geo.y + (bestY?.d ?? 0) }, guides: { x: bestX ? [bestX.at] : [], y: bestY ? [bestY.at] : [] } };
}

type Drag = { mode: 'draw' | 'move' | 'resize' | 'pan'; pointerId: number; sx: number; sy: number; origin?: Geometry; id?: string; kind?: DrawTool; handle?: string; moved: boolean; sl: number; st: number };
type Props = {
  elements: SiteElement[]; selectedId: string | null; tool: WebTool; viewport: string; preview: boolean; zoom: number; showGrid: boolean; snapOn: boolean; guidesOn: boolean;
  hiddenIds: Set<string>; lockedIds: Set<string>;
  pages: StudioPage[]; activePageId: string;
  onSelect: (id: string | null) => void; onCommit: (id: string, geo: Geometry) => void; onCreate: (kind: DrawTool, geo: Geometry) => void;
  onDropImage: (file: File, geo: Geometry) => void;
  onContent: (id: string, content: string) => void; onZoomChange: (zoom: number) => void; onPageSelect: (id: string) => void;
};

export function Stage({ elements, selectedId, tool, viewport, preview, zoom, showGrid, snapOn, guidesOn, hiddenIds, lockedIds, pages, activePageId, onSelect, onCommit, onCreate, onDropImage, onContent, onZoomChange, onPageSelect }: Props) {
  const scroll = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [live, setLive] = useState<{ id: string; geo: Geometry } | null>(null);
  const [draft, setDraft] = useState<{ kind: DrawTool; geo: Geometry } | null>(null);
  const [guides, setGuides] = useState<Guides | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const W = DEVICE_WIDTH[viewport] || DEVICE_WIDTH.desktop;
  useEffect(() => onFit(() => { const el = scroll.current; if (el) onZoomChange(clampZoom((el.clientWidth - 48) / W)); }), [W, onZoomChange]);
  const geoOf = (el: SiteElement) => (live && live.id === el.id ? live.geo : geometryOf(el));
  const H = Math.max(900, Math.ceil(Math.max(0, ...elements.map(el => { const g = geoOf(el); return g.y + g.h; })) + 240));
  const drawKind = (DRAW_KINDS as string[]).includes(tool) ? (tool as DrawTool) : null;
  const selected = elements.find(el => el.id === selectedId) || null;
  const editing = elements.find(el => el.id === editingId) || null;
  const selectedLocked = !!selected && lockedIds.has(selected.id);

  const pointAt = (clientX: number, clientY: number) => {
    const rect = frame.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  };
  const snap = (value: number, e: { altKey: boolean }) => (e.altKey || !snapOn ? Math.round(value) : snapGrid(value));

  function down(e: RPE) {
    if (preview || e.button !== 0 || (e.target as HTMLElement).closest('input')) return;
    const target = e.target as HTMLElement;
    if (tool === 'hand') {
      drag.current = { mode: 'pan', pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, sl: scroll.current?.scrollLeft || 0, st: scroll.current?.scrollTop || 0 };
      frame.current!.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'zoom') { onZoomChange(clampZoom(zoom + (e.shiftKey ? -0.1 : 0.1))); return; }
    const p = pointAt(e.clientX, e.clientY);
    if (drawKind) {
      drag.current = { mode: 'draw', pointerId: e.pointerId, sx: snap(p.x, e), sy: snap(p.y, e), kind: drawKind, moved: false, sl: 0, st: 0 };
      setDraft({ kind: drawKind, geo: { x: snap(p.x, e), y: snap(p.y, e), w: 0, h: 0 } });
      frame.current!.setPointerCapture(e.pointerId);
      return;
    }
    const handle = target.closest('[data-handle]')?.getAttribute('data-handle');
    if (handle && selected && !selectedLocked) {
      drag.current = { mode: 'resize', pointerId: e.pointerId, sx: p.x, sy: p.y, origin: geometryOf(selected), id: selected.id, handle, moved: false, sl: 0, st: 0 };
      frame.current!.setPointerCapture(e.pointerId);
      return;
    }
    const id = target.closest('[data-el-id]')?.getAttribute('data-el-id');
    const el = elements.find(item => item.id === id);
    if (!el) { onSelect(null); return; }
    onSelect(el.id);
    if (lockedIds.has(el.id)) return;
    drag.current = { mode: 'move', pointerId: e.pointerId, sx: p.x, sy: p.y, origin: geometryOf(el), id: el.id, moved: false, sl: 0, st: 0 };
    frame.current!.setPointerCapture(e.pointerId);
  }

  function move(e: RPE) {
    if (frame.current) { const c = pointAt(e.clientX, e.clientY); emitCursor(c.x, c.y); }
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.mode === 'pan') {
      if (scroll.current) { scroll.current.scrollLeft = d.sl - (e.clientX - d.sx); scroll.current.scrollTop = d.st - (e.clientY - d.sy); }
      return;
    }
    const p = pointAt(e.clientX, e.clientY);
    if (d.mode === 'draw' && d.kind) {
      const px = snap(p.x, e); const py = snap(p.y, e);
      let w = Math.abs(px - d.sx); let h = Math.abs(py - d.sy);
      if (e.shiftKey) w = h = Math.max(w, h);
      d.moved = w > 4 || h > 4;
      setDraft({ kind: d.kind, geo: { x: px < d.sx ? d.sx - w : d.sx, y: py < d.sy ? d.sy - h : d.sy, w, h } });
      return;
    }
    if (!d.origin || !d.id) return;
    const dx = p.x - d.sx; const dy = p.y - d.sy;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
    if (d.mode === 'move') {
      let geo: Geometry = { ...d.origin, x: snap(d.origin.x + dx, e), y: snap(d.origin.y + dy, e) };
      if (!e.altKey && guidesOn) {
        const others = [{ x: 0, y: 0, w: W, h: H }, ...elements.filter(el => el.id !== d.id && !hiddenIds.has(el.id)).map(geometryOf)];
        const aligned = align(geo, others, 6 / zoom);
        geo = aligned.geo; setGuides(aligned.guides);
      } else setGuides(null);
      setLive({ id: d.id, geo });
      return;
    }
    const k = d.handle || '';
    let { x, y, w, h } = d.origin;
    if (k.includes('e')) w = d.origin.w + dx;
    if (k.includes('s')) h = d.origin.h + dy;
    if (k.includes('w')) { x = d.origin.x + dx; w = d.origin.w - dx; }
    if (k.includes('n')) { y = d.origin.y + dy; h = d.origin.h - dy; }
    if (e.shiftKey && d.origin.h > 0) { const ratio = d.origin.w / d.origin.h; if (k.length === 2) h = w / ratio; }
    x = snap(x, e); y = snap(y, e); w = snap(w, e); h = snap(h, e);
    if (w < MIN) { if (k.includes('w')) x = d.origin.x + d.origin.w - MIN; w = MIN; }
    if (h < MIN) { if (k.includes('n')) y = d.origin.y + d.origin.h - MIN; h = MIN; }
    setLive({ id: d.id, geo: { x, y, w, h } });
  }

  function up(e: RPE) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (d.mode === 'draw' && d.kind) {
      const size = DEFAULT_SIZE[d.kind];
      const geo = d.moved && draft ? draft.geo : { x: d.sx, y: d.sy, w: size.w, h: size.h };
      setDraft(null);
      onCreate(d.kind, { ...geo, w: Math.max(MIN, geo.w), h: Math.max(MIN, geo.h) });
    } else if ((d.mode === 'move' || d.mode === 'resize') && live && d.moved) {
      onCommit(live.id, live.geo);
    }
    setLive(null); setGuides(null);
  }

  function dbl(e: RME) {
    if (preview) return;
    const id = (e.target as HTMLElement).closest('[data-el-id]')?.getAttribute('data-el-id');
    const el = elements.find(item => item.id === id);
    if (el && el.kind !== 'image' && !lockedIds.has(el.id)) { onSelect(el.id); setEditingId(el.id); }
  }
  function wheel(e: RWheel) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    onZoomChange(clampZoom(zoom + (e.deltaY < 0 ? 0.05 : -0.05)));
  }

  /* Drop a tool dragged out of the left dock, or an image file dragged in from the computer. */
  function dragOver(e: RDE) {
    if (preview) return;
    const types = Array.from(e.dataTransfer.types);
    if (types.includes(TOOL_MIME) || types.includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
  }
  function drop(e: RDE) {
    if (preview) return;
    const p = pointAt(e.clientX, e.clientY);
    const x = snapOn ? snapGrid(Math.max(0, p.x)) : Math.round(Math.max(0, p.x)); const y = snapOn ? snapGrid(Math.max(0, p.y)) : Math.round(Math.max(0, p.y));
    const toolId = e.dataTransfer.getData(TOOL_MIME);
    if (toolId && (DRAW_KINDS as string[]).includes(toolId)) {
      e.preventDefault();
      const size = DEFAULT_SIZE[toolId as DrawTool];
      onCreate(toolId as DrawTool, { x, y, ...size });
      return;
    }
    const file = Array.from(e.dataTransfer.files).find(item => item.type.startsWith('image/'));
    if (file) { e.preventDefault(); onDropImage(file, { x, y, ...DEFAULT_SIZE.image }); }
  }

  const toolInfo = TOOLS.find(t => t.id === tool);

  function renderElement(el: SiteElement) {
    if (hiddenIds.has(el.id)) return null;
    const attrs = attrsFor(el, W, geoOf(el));
    const isSelected = !preview && el.id === selectedId;
    const locked = lockedIds.has(el.id);
    const common: any = { ...attrs, 'data-el-id': el.id, outline: isSelected ? '2px solid primary' : undefined, 'outline-offset': '0', cursor: preview ? undefined : locked ? 'not-allowed' : tool === 'select' ? 'move' : undefined, 'user-select': 'none' };
    const hidden = el.id === editingId;
    const content = hidden ? '' : el.content;
    switch (el.kind) {
      case 'heading': return <Box as="h1" key={el.id} {...common} m="0" lineHeight="tight" overflow="hidden">{content}</Box>;
      case 'text': return <Box as="p" key={el.id} {...common} m="0" overflow="hidden">{content}</Box>;
      case 'button': return <Box as="div" key={el.id} {...common} display="flex" items="center" justify="center" overflow="hidden">{content}</Box>;
      case 'image': return el.src
        ? <Box as="img" key={el.id} {...common} src={el.src} alt={el.alt || ''} draggable={false} objectFit={attrs['object-fit'] || 'cover'} />
        : <Box as="div" key={el.id} {...common} role="img" aria-label={el.alt || 'Image placeholder'} display="flex" items="center" justify="center" bg={attrs.bg && attrs.bg !== 'transparent' ? attrs.bg : 'gray-200'} text="muted" fontSize="sm"><span>{el.alt || 'Image'}</span></Box>;
      default: return <Box as="div" key={el.id} {...common} overflow="hidden">{content}</Box>;
    }
  }

  const sel = selected && !preview && tool === 'select' && !editing && !selectedLocked && !hiddenIds.has(selected.id) ? geoOf(selected) : null;
  const visibleCount = elements.filter(el => !hiddenIds.has(el.id)).length;

  return (
    <Box as="main" aria-label="Website canvas" flex="1" min-w="0" display="flex" flex-col overflow="hidden">
      {!preview && (
        <Row items="center" justify="between" gap="3" px="4" py="3">
          <Select aria-label="Active page" value={activePageId} onChange={(e: ChangeEvent<HTMLSelectElement>) => onPageSelect(e.target.value)} {...FIELD} shadow="sm" py="1">
            {pages.map(page => <Option key={page.id} value={page.id}>Page: {page.name}</Option>)}
          </Select>
          <Txt fontSize="xs" text="muted" m="0">{toolInfo?.hint}</Txt>
        </Row>
      )}
      <Box ref={scroll} flex="1" overflow="auto" px="6" pb="6" pt={preview ? '6' : '0'} onWheel={wheel}>
        <Box mx="auto" position="relative" w={`${Math.round(W * zoom)}px`} h={`${Math.round(H * zoom)}px`}>
          <Box ref={frame} position="absolute" left="0" top="0" w={`${W}px`} h={`${H}px`} bg="white" text="foreground" shadow={preview ? 'none' : 'xl'}
            cursor={tool === 'hand' ? 'grab' : tool === 'zoom' ? 'zoom-in' : drawKind ? 'crosshair' : 'default'} touchAction="none"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={() => emitCursor(null)} onDoubleClick={dbl} onDragOver={dragOver} onDrop={drop}>
            {showGrid && !preview && (
              <Box as="svg" position="absolute" left="0" top="0" w={`${W}px`} h={`${H}px`} pointerEvents="none" aria-hidden="true">
                <defs><pattern id="stage-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" /></pattern></defs>
                <rect width={W} height={H} fill="url(#stage-grid)" pointerEvents="none" />
              </Box>
            )}
            {elements.map(renderElement)}
            {visibleCount === 0 && !draft && <Box position="absolute" left="0" top="30%" w="full" textAlign="center" text="gray-400" fontSize="lg" pointerEvents="none">Pick a tool on the left and drag here to draw — or drop an image file</Box>}
            {draft && <Box position="absolute" left={`${draft.geo.x}px`} top={`${draft.geo.y}px`} w={`${draft.geo.w}px`} h={`${draft.geo.h}px`} border="1px dashed primary" bg="primary/10" />}
            {guides?.x.map(x => <Box key={`gx${x}`} position="absolute" left={`${x}px`} top="0" w="1px" h="full" bg={GUIDE} pointerEvents="none" z="25" />)}
            {guides?.y.map(y => <Box key={`gy${y}`} position="absolute" left="0" top={`${y}px`} w="full" h="1px" bg={GUIDE} pointerEvents="none" z="25" />)}
            {sel && HANDLES.map(h => (
              <Box key={h.k} data-handle={h.k} position="absolute" z="20" w="10px" h="10px" bg="white" border="2px solid primary" rounded="sm" cursor={h.c}
                left={`${sel.x + sel.w * h.l - 5}px`} top={`${sel.y + sel.h * h.t - 5}px`} />
            ))}
            {editing && (
              <Input aria-label="Edit text" autoFocus value={editing.content} z="30" position="absolute" left={`${geoOf(editing).x}px`} top={`${geoOf(editing).y}px`} w={`${Math.max(geoOf(editing).w, 160)}px`} {...FIELD}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onContent(editing.id, e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e: RKey<HTMLInputElement>) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingId(null); }} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
