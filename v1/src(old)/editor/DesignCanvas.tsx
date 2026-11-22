import { useEffect, useRef, useState } from 'react';
import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { Box, Txt } from 'atomattr/react';
import { createDesignObject } from '../engine/document';
import type { DesignKind, DesignObject } from '../types/project';
import { SHAPE_DRAG_PREFIX, SHAPE_TOOLS, TOOLS, TOOL_MIME } from '../registry/tools';
import { emitCursor, onFit } from '../registry/events';
import type { DesignTool, ShapeTool } from '../registry/tools';

const CANVAS_W = 1200;
const CANVAS_H = 800;
const clampZoom = (value: number) => Math.min(1.5, Math.max(0.25, Math.round(value * 100) / 100));
type Props = {
  objects: DesignObject[]; selectedId: string | null; tool: DesignTool; zoom: number; showGrid: boolean; snapOn: boolean;
  hiddenIds: Set<string>; lockedIds: Set<string>;
  onZoomChange: (zoom: number) => void; onToolChange: (tool: DesignTool) => void;
  onSelect: (id: string | null) => void; onCreate: (object: DesignObject) => void;
  onUpdate: (id: string, patch: Partial<DesignObject>) => void;
  onAddImage: (file: File, x: number, y: number) => void;
  onShape: (id: string, x: number, y: number) => void;
};
type DragState = { pointerId: number; startX: number; startY: number; lastX: number; lastY: number; object?: DesignObject; mode: 'draw' | 'move' | 'resize' | 'pan' | 'opacity' };

function shapePoints(object: DesignObject, star = false) {
  const count = star ? Math.max(3, object.points || 5) * 2 : Math.max(3, object.points || 6);
  const cx = object.x + object.width / 2; const cy = object.y + object.height / 2;
  const outer = Math.min(object.width, object.height) / 2;
  const inner = outer * (object.radius || 0.46);
  return Array.from({ length: count }, (_, i) => {
    const radius = star && i % 2 ? inner : outer;
    const angle = (Math.PI * 2 * i / count) - Math.PI / 2;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(' ');
}

export function DesignCanvas({ objects, selectedId, tool, zoom, showGrid, snapOn, hiddenIds, lockedIds, onZoomChange, onToolChange, onSelect, onCreate, onUpdate, onAddImage, onShape }: Props) {
  const scroll = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [draft, setDraft] = useState<DesignObject | null>(null);
  const [previewTransform, setPreviewTransform] = useState<DesignObject | null>(null);
  const [cursor, setCursor] = useState('default');
  const [dropActive, setDropActive] = useState(false);
  const selected = objects.find(object => object.id === selectedId) || null;
  const renderObjects = draft ? [...objects, draft] : objects;
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      drag.current = null; setDraft(null); setPreviewTransform(null); onToolChange('select');
    };
    window.addEventListener('keydown', cancel);
    return () => window.removeEventListener('keydown', cancel);
  }, [onToolChange]);
  useEffect(() => onFit(() => { const el = scroll.current; if (el) onZoomChange(clampZoom(Math.min((el.clientWidth - 64) / CANVAS_W, (el.clientHeight - 64) / CANVAS_H))); }), [onZoomChange]);

  function toCanvas(clientX: number, clientY: number, rect: DOMRect, snap: boolean) {
    let x = (clientX - rect.left) / rect.width * CANVAS_W;
    let y = (clientY - rect.top) / rect.height * CANVAS_H;
    if (snap) { x = Math.round(x / 10) * 10; y = Math.round(y / 10) * 10; }
    return { x, y };
  }
  const point = (event: ReactPointerEvent<SVGSVGElement>) => toCanvas(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect(), !event.altKey && snapOn);

  function start(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    const p = point(event);
    if (tool === 'zoom') { onZoomChange(clampZoom(zoom + (event.shiftKey ? -0.1 : 0.1))); return; }
    if (tool === 'image') { onAddImagePrompt(p.x, p.y); return; }
    if (tool === 'hand') {
      drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: scroll.current?.scrollLeft || 0, lastY: scroll.current?.scrollTop || 0, mode: 'pan' };
      event.currentTarget.setPointerCapture(event.pointerId); setCursor('grabbing'); return;
    }
    if (tool === 'text') {
      const object = createDesignObject('text', p.x, p.y, 260, 72);
      onCreate(object); onSelect(object.id); onToolChange('select'); return;
    }
    if (tool !== 'select' && tool !== 'eyedropper' && tool !== 'opacity' && tool !== 'format') {
      const kind: DesignKind = tool;
      const object = createDesignObject(kind, p.x, p.y, 1, 1);
      drag.current = { pointerId: event.pointerId, startX: p.x, startY: p.y, lastX: p.x, lastY: p.y, object, mode: 'draw' };
      setDraft(object); event.currentTarget.setPointerCapture(event.pointerId); return;
    }
    const target = (event.target as SVGElement).closest('[data-object-id]');
    const id = target?.getAttribute('data-object-id') || null;
    if (!id) { onSelect(null); return; }
    const object = objects.find(item => item.id === id);
    if (!object) return;
    if (tool === 'eyedropper') {
      // Sample the clicked object's colour onto the selection; with nothing else selected it just selects.
      if (selectedId && selectedId !== id && !lockedIds.has(selectedId)) onUpdate(selectedId, { fill: object.fill }); else onSelect(id);
      return;
    }
    if (tool === 'format') {
      // Copy the selected object's look onto the clicked one; with nothing else selected it just selects.
      const source = objects.find(item => item.id === selectedId);
      if (source && source.id !== id && !lockedIds.has(id)) onUpdate(id, { fill: source.fill, stroke: source.stroke, strokeWidth: source.strokeWidth, opacity: source.opacity }); else onSelect(id);
      return;
    }
    onSelect(id);
    if (lockedIds.has(id)) return;
    if (tool === 'opacity') {
      drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, object, mode: 'opacity' };
      event.currentTarget.setPointerCapture(event.pointerId); return;
    }
    const isHandle = (event.target as SVGElement).getAttribute('data-resize-handle') === 'true';
    drag.current = { pointerId: event.pointerId, startX: p.x, startY: p.y, lastX: p.x, lastY: p.y, object, mode: isHandle ? 'resize' : 'move' };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onAddImagePrompt(x: number, y: number) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml';
    input.onchange = () => { const file = input.files?.[0]; if (file) onAddImage(file, x, y); };
    input.click();
  }
  /** Create an object from a tool dragged out of the dock. */
  function createFromTool(id: string, x: number, y: number) {
    if (id.startsWith(SHAPE_DRAG_PREFIX)) { onShape(id.slice(SHAPE_DRAG_PREFIX.length), x, y); return; }
    if (id === 'image') { onAddImagePrompt(x, y); return; }
    if (id === 'text') { onCreate(createDesignObject('text', x, y, 260, 72)); return; }
    if ((SHAPE_TOOLS as string[]).includes(id)) {
      const kind = id as ShapeTool;
      onCreate(createDesignObject(kind, x, y, kind === 'line' ? 160 : 140, kind === 'line' ? 1 : 140));
    }
  }
  function dragOver(event: ReactDragEvent<SVGSVGElement>) {
    const types = Array.from(event.dataTransfer.types);
    if (types.includes(TOOL_MIME) || types.includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setDropActive(true); }
  }
  function dropOnCanvas(event: ReactDragEvent<SVGSVGElement>) {
    event.preventDefault(); setDropActive(false);
    const rect = event.currentTarget.getBoundingClientRect();
    const at = toCanvas(event.clientX, event.clientY, rect, snapOn);
    const toolId = event.dataTransfer.getData(TOOL_MIME);
    if (toolId) { createFromTool(toolId, at.x, at.y); return; }
    const file = Array.from(event.dataTransfer.files).find(item => item.type.startsWith('image/'));
    if (!file) return;
    onAddImage(file, Math.max(0, Math.min(CANVAS_W - 160, at.x)), Math.max(0, Math.min(CANVAS_H - 120, at.y)));
  }
  function pasteImage(event: ClipboardEvent) {
    const file = Array.from(event.clipboardData?.items || []).find(item => item.type.startsWith('image/'))?.getAsFile();
    if (!file) return;
    const editing = event.target as HTMLElement | null;
    if (editing?.isContentEditable || ['INPUT', 'TEXTAREA'].includes(editing?.tagName || '') || !document.hasFocus()) return;
    event.preventDefault(); onAddImage(file, 520, 340);
  }
  useEffect(() => { window.addEventListener('paste', pasteImage); return () => window.removeEventListener('paste', pasteImage); });
  function move(event: ReactPointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const where = toCanvas(event.clientX, event.clientY, bounds, false);
    emitCursor(where.x, where.y);
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (state.mode === 'pan') {
      if (scroll.current) { scroll.current.scrollLeft = state.lastX - (event.clientX - state.startX); scroll.current.scrollTop = state.lastY - (event.clientY - state.startY); }
      return;
    }
    if (state.mode === 'opacity' && state.object) {
      const value = Math.min(1, Math.max(0, (state.object.opacity ?? 1) + (event.clientX - state.startX) / 200));
      setPreviewTransform({ ...state.object, opacity: Math.round(value * 100) / 100 });
      return;
    }
    const p = point(event);
    if (state.mode === 'draw' && state.object) {
      let width = Math.abs(p.x - state.startX); let height = Math.abs(p.y - state.startY);
      if (event.shiftKey && state.object.kind !== 'line') width = height = Math.max(width, height);
      const x = Math.min(state.startX, p.x); const y = Math.min(state.startY, p.y);
      const geometry = { x, y, width, height };
      setDraft({ ...state.object, ...geometry, width: Math.max(1, geometry.width), height: Math.max(1, geometry.height) });
      return;
    }
    if (!state.object) return;
    if (state.mode === 'move') {
      setPreviewTransform({ ...state.object, x: state.object.x + p.x - state.startX, y: state.object.y + p.y - state.startY });
    } else {
      let width = Math.max(10, state.object.width + p.x - state.startX);
      let height = Math.max(10, state.object.height + p.y - state.startY);
      if (event.shiftKey) width = height = Math.max(width, height);
      setPreviewTransform({ ...state.object, width, height });
    }
  }
  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    drag.current = null;
    if (state.mode === 'draw' && draft) {
      const validSize = draft.kind === 'line' ? draft.width > 3 || draft.height > 3 : draft.width > 3 && draft.height > 3;
      if (validSize) { onCreate(draft); onSelect(draft.id); }
      setDraft(null); onToolChange('select');
    } else if (previewTransform && state.object) {
      onUpdate(state.object.id, { x: previewTransform.x, y: previewTransform.y, width: previewTransform.width, height: previewTransform.height, opacity: previewTransform.opacity });
      setPreviewTransform(null);
    }
    if (state.mode === 'pan') setCursor('grab');
  }
  function wheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    onZoomChange(clampZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1)));
  }
  const shown = renderObjects.filter(object => !hiddenIds.has(object.id)).map(object => previewTransform?.id === object.id ? previewTransform : object);
  const isDrawing = tool !== 'select' && tool !== 'hand' && tool !== 'zoom' && tool !== 'image' && tool !== 'eyedropper' && tool !== 'opacity' && tool !== 'format';
  const toolInfo = TOOLS.find(item => item.id === tool);
  const canvasCursor = tool === 'hand' ? (cursor === 'grabbing' ? 'grabbing' : 'grab') : tool === 'zoom' ? 'zoom-in' : tool === 'eyedropper' || tool === 'format' ? 'copy' : isDrawing ? 'crosshair' : 'default';
  return (
    <Box as="main" aria-label="Vector design canvas" bg="gray-100" dark-bg="gray-950" min-w="0" flex="1" overflow="hidden" display="flex" flex-col>
      <Box display="flex" items="center" justify="between" px="4" py="2" gap="3">
        <Txt fontSize="xs" fontWeight="600" m="0">Design canvas · 1200 × 800</Txt>
        <Txt text="muted" fontSize="xs" m="0">{toolInfo ? toolInfo.hint : ''}{isDrawing ? ' · Shift constrains · Alt disables snapping' : ''}</Txt>
      </Box>
      <Box ref={scroll} flex="1" overflow="auto" p="8" onWheel={wheel}>
        <Box display="flex" justify="center" minW="full" minH="full">
          <svg width={CANVAS_W * zoom} height={CANVAS_H * zoom} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} style={{ background: '#ffffff', boxShadow: '0 18px 60px rgba(15,23,42,.35)', touchAction: 'none', cursor: canvasCursor, outline: dropActive ? '3px solid #635bff' : undefined }} onDragOver={dragOver} onDragLeave={() => setDropActive(false)} onDrop={dropOnCanvas} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onPointerLeave={() => { emitCursor(null); if (!drag.current) setCursor('default'); }}>
            <defs><pattern id="design-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e9edf5" strokeWidth="1" /></pattern></defs>
            {showGrid && <rect width={CANVAS_W} height={CANVAS_H} fill="url(#design-grid)" pointerEvents="none" />}
            {shown.length === 0 && !draft && <text x="600" y="400" textAnchor="middle" fill="#94a3b8" fontFamily="system-ui" fontSize="18" pointerEvents="none">Choose a drawing tool and drag here, or drop an image</text>}
            {shown.map(object => {
              const selectedNow = object.id === selectedId || object.id === draft?.id;
              const transform = object.rotation ? `rotate(${object.rotation} ${object.x + object.width / 2} ${object.y + object.height / 2})` : undefined;
              const shared = { 'data-object-id': object.id, opacity: object.opacity, fill: object.fill, stroke: object.stroke, strokeWidth: object.strokeWidth, transform, style: { cursor: lockedIds.has(object.id) ? 'not-allowed' : tool === 'select' ? 'move' : isDrawing ? 'crosshair' : 'pointer' } };
              return <g key={object.id}>
                {object.kind === 'rect' && <rect {...shared} x={object.x} y={object.y} width={object.width} height={object.height} rx={object.radius || 0} />}
                {object.kind === 'ellipse' && <ellipse {...shared} cx={object.x + object.width / 2} cy={object.y + object.height / 2} rx={object.width / 2} ry={object.height / 2} />}
                {object.kind === 'line' && <line {...shared} fill="none" x1={object.x} y1={object.y} x2={object.x + object.width} y2={object.y + object.height} />}
                {object.kind === 'polygon' && <polygon {...shared} points={shapePoints(object)} />}
                {object.kind === 'star' && <polygon {...shared} points={shapePoints(object, true)} />}
                {object.kind === 'image' && <g {...shared}>{object.src ? <image href={object.src} x={object.x} y={object.y} width={object.width} height={object.height} preserveAspectRatio="xMidYMid slice" /> : <rect x={object.x} y={object.y} width={object.width} height={object.height} fill={object.fill === 'none' ? '#eef2ff' : object.fill} />}<text x={object.x + object.width / 2} y={object.y + object.height - 8} textAnchor="middle" fill="#64748b" fontFamily="system-ui" fontSize="12">Image</text></g>}
                {object.kind === 'text' && <text {...shared} x={object.x} y={object.y + (object.fontSize || 32)} fill={object.fill === 'none' ? '#172033' : object.fill} stroke="none" fontFamily="Inter, system-ui, sans-serif" fontSize={object.fontSize || 32}>{(object.text || '').split('\n').map((line, index) => <tspan key={`${object.id}-${index}`} x={object.x} dy={index === 0 ? 0 : (object.fontSize || 32) * 1.25}>{line}</tspan>)}</text>}
                {selectedNow && <g pointerEvents="none"><rect x={object.x - 2} y={object.y - 2} width={object.width + 4} height={object.height + 4} fill="none" stroke="#635bff" strokeWidth="1.5" strokeDasharray="5 4" pointerEvents="none" />{!lockedIds.has(object.id) && <rect data-object-id={object.id} data-resize-handle="true" x={object.x + object.width - 5} y={object.y + object.height - 5} width="10" height="10" fill="#ffffff" stroke="#635bff" strokeWidth="2" pointerEvents="all" style={{ cursor: 'nwse-resize' }} />}</g>}
              </g>;
            })}
          </svg>
        </Box>
      </Box>
      <Box px="4" py="2"><Txt text="muted" fontSize="xs" m="0">{selected ? `${selected.kind} · x ${Math.round(selected.x)} · y ${Math.round(selected.y)} · ${Math.round(selected.width)} × ${Math.round(selected.height)}` : 'No object selected'} · {Math.round(zoom * 100)}%</Txt></Box>
    </Box>
  );
}
