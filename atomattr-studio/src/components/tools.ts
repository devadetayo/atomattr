import type { Tool } from '../state/store';

export type ToolDef = { id: Tool; icon: string; name: string; key: string };
export const GROUPS: ToolDef[][] = [
  [{ id: 'select', icon: 'select', name: 'Select', key: 'V' }, { id: 'direct', icon: 'direct', name: 'Direct select (edit nodes)', key: 'A' }],
  [{ id: 'text', icon: 'text', name: 'Text', key: 'T' }, { id: 'heading', icon: 'heading', name: 'Heading', key: 'Shift+T' }],
  [{ id: 'rect', icon: 'rect', name: 'Rectangle', key: 'R' }, { id: 'rounded', icon: 'rounded', name: 'Rounded rectangle', key: 'U' }, { id: 'ellipse', icon: 'ellipse', name: 'Ellipse', key: 'E' }, { id: 'polygon', icon: 'polygon', name: 'Polygon', key: 'G' }, { id: 'star', icon: 'star', name: 'Star', key: 'S' }, { id: 'line', icon: 'line', name: 'Line', key: 'L' }, { id: 'arrow', icon: 'arrow', name: 'Arrow', key: 'Shift+L' }],
  [{ id: 'pen', icon: 'pen', name: 'Pen (Bézier)', key: 'P' }, { id: 'pencil', icon: 'pencil', name: 'Freehand', key: 'B' }, { id: 'spiral', icon: 'spiral', name: 'Spiral', key: 'Shift+S' }],
  [{ id: 'fountain', icon: 'fountain', name: 'Interactive fill: drag for a gradient (Alt = radial)', key: 'F' }, { id: 'transparency', icon: 'transparency', name: 'Transparency: drag for a fade (Alt = radial)', key: 'Y' }, { id: 'contour', icon: 'contour', name: 'Contour: drag inward or outward', key: 'K' }, { id: 'dropshadow', icon: 'shadow', name: 'Drop shadow: drag for offset and blur', key: 'W' }, { id: 'blend', icon: 'blend', name: 'Blend: drag from one object to another', key: 'Q' }],
  [{ id: 'section', icon: 'section', name: 'Section', key: 'X' }, { id: 'container', icon: 'container', name: 'Container', key: 'C' }, { id: 'grid', icon: 'grid', name: 'Grid', key: 'D' }, { id: 'component', icon: 'component', name: 'Component (click an object to make one, click empty space to place it)', key: 'M' }],
  [{ id: 'button', icon: 'button', name: 'Button', key: 'N' }, { id: 'image', icon: 'image', name: 'Image', key: 'Shift+I' }, { id: 'crop', icon: 'crop', name: 'Crop image', key: 'Shift+C' }],
  [{ id: 'eyedropper', icon: 'eyedropper', name: 'Eyedropper', key: 'I' }],
  [{ id: 'hand', icon: 'hand', name: 'Hand (or hold Space)', key: 'H' }, { id: 'zoom', icon: 'zoom', name: 'Zoom (Alt-click zooms out)', key: 'Z' }],
];
export const ALL_TOOLS = GROUPS.flat();
export const KEYMAP: Record<string, Tool> = Object.fromEntries(ALL_TOOLS.filter(t => !t.key.includes('Shift')).map(t => [t.key.toLowerCase(), t.id]));

export function useDrag(onMove: (dx: number, dy: number, e: PointerEvent) => void, onEnd?: () => void) {
  return (e: React.PointerEvent) => {
    if (e.button !== 0) return; e.preventDefault(); const sx = e.clientX; const sy = e.clientY;
    const mv = (ev: PointerEvent) => onMove(ev.clientX - sx, ev.clientY - sy, ev); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); onEnd?.(); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
}

