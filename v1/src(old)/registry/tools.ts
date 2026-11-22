import type { ElementKind } from '../types/project';

/** The editor has two modes that share one tool dock: website layout ("web") and the vector artboard ("design"). */
export type Mode = 'web' | 'design';

export type DrawKind = Extract<ElementKind, 'section' | 'heading' | 'text' | 'button' | 'image'>;
/** 'grid' is a container that is created as a section with a grid layout. */
export type DrawTool = DrawKind | 'grid';
export type ShapeTool = 'rect' | 'ellipse' | 'polygon' | 'star' | 'line';

export type WebTool = 'select' | 'hand' | 'zoom' | DrawTool;
export type DesignTool = 'select' | 'hand' | 'zoom' | 'eyedropper' | 'opacity' | 'format' | 'text' | 'image' | ShapeTool;
export type ToolId = WebTool | DesignTool | 'node' | 'pen';

/** Prefix of a shape-library payload dragged onto a canvas (TOOL_MIME carries `shape:<id>`). */
export const SHAPE_DRAG_PREFIX = 'shape:';

/** Drag a tool out of the dock and drop it on a canvas: the payload is the tool id. */
export const TOOL_MIME = 'application/x-atomattr-tool';

export const DRAW_KINDS: DrawTool[] = ['section', 'heading', 'text', 'button', 'image', 'grid'];
export const SHAPE_TOOLS: ShapeTool[] = ['rect', 'ellipse', 'polygon', 'star', 'line'];

const WEB_TOOLS: readonly string[] = ['select', 'hand', 'zoom', ...DRAW_KINDS];
const DESIGN_TOOLS: readonly string[] = ['select', 'hand', 'zoom', 'eyedropper', 'opacity', 'format', 'text', 'image', ...SHAPE_TOOLS];

/** Tools that don't exist in a mode fall back to the pointer, so a stale tool can never break a canvas. */
export const asWebTool = (id: ToolId): WebTool => (WEB_TOOLS.includes(id) ? (id as WebTool) : 'select');
export const asDesignTool = (id: ToolId): DesignTool => (DESIGN_TOOLS.includes(id) ? (id as DesignTool) : 'select');

export type ToolGroup = 'Select' | 'Shapes' | 'Content' | 'Effects' | 'View';
export type ToolDef = {
  id: ToolId; label: string; hint: string; group: ToolGroup; modes: Mode[];
  keys: Partial<Record<Mode, string>>; insert?: boolean; disabled?: boolean;
};

const both: Mode[] = ['web', 'design'];

export const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Selection', hint: 'Click to select · drag to move · drag handles to resize (V)', group: 'Select', modes: both, keys: { web: 'v', design: 'v' } },
  { id: 'node', label: 'Nodes', hint: 'Shape node edit needs path objects, which the project model does not have yet (A)', group: 'Select', modes: ['design'], keys: { design: 'a' }, disabled: true },

  { id: 'rect', label: 'Rectangle', hint: 'Drag to draw a rectangle (R)', group: 'Shapes', modes: ['design'], keys: { design: 'r' }, insert: true },
  { id: 'ellipse', label: 'Circle', hint: 'Drag to draw an ellipse · Shift for a circle (C)', group: 'Shapes', modes: ['design'], keys: { design: 'c' }, insert: true },
  { id: 'polygon', label: 'Polygon', hint: 'Drag to draw a polygon (P)', group: 'Shapes', modes: ['design'], keys: { design: 'p' }, insert: true },
  { id: 'star', label: 'Star', hint: 'Drag to draw a star (S)', group: 'Shapes', modes: ['design'], keys: { design: 's' }, insert: true },
  { id: 'line', label: 'Line', hint: 'Drag to draw a line or divider (L)', group: 'Shapes', modes: ['design'], keys: { design: 'l' }, insert: true },
  { id: 'pen', label: 'Pen', hint: 'Custom curves need path objects, which the project model does not have yet (B)', group: 'Shapes', modes: ['design'], keys: { design: 'b' }, disabled: true },

  { id: 'text', label: 'Text', hint: 'Drag to draw a text block (T)', group: 'Content', modes: both, keys: { web: 't', design: 't' }, insert: true },
  { id: 'heading', label: 'Heading', hint: 'Drag to draw a heading (G)', group: 'Content', modes: ['web'], keys: { web: 'g' }, insert: true },
  { id: 'button', label: 'Button', hint: 'Drag to draw a button (N)', group: 'Content', modes: ['web'], keys: { web: 'n' }, insert: true },
  { id: 'image', label: 'Image', hint: 'Drag to draw an image frame · drop a file from your computer or press Ctrl+V (I)', group: 'Content', modes: both, keys: { web: 'i', design: 'i' }, insert: true },
  { id: 'section', label: 'Container', hint: 'Drag to draw a container box / flex wrapper (B)', group: 'Content', modes: ['web'], keys: { web: 'b' }, insert: true },
  { id: 'grid', label: 'Grid', hint: 'Drag to draw a grid container (D)', group: 'Content', modes: ['web'], keys: { web: 'd' }, insert: true },

  { id: 'opacity', label: 'Opacity', hint: 'Drag left/right on an object to change its transparency (O)', group: 'Effects', modes: ['design'], keys: { design: 'o' } },
  { id: 'eyedropper', label: 'Eyedropper', hint: 'Click an object to sample its colour onto the selection (E)', group: 'Effects', modes: ['design'], keys: { design: 'e' } },

  { id: 'format', label: 'Format Painter', hint: 'Select a styled object, then click another to copy its fill, outline and opacity onto it (F)', group: 'Effects', modes: ['design'], keys: { design: 'f' } },

  { id: 'hand', label: 'Hand', hint: 'Drag to pan the canvas (H)', group: 'View', modes: both, keys: { web: 'h', design: 'h' } },
  { id: 'zoom', label: 'Zoom', hint: 'Click to zoom in · Shift-click to zoom out (Z)', group: 'View', modes: both, keys: { web: 'z', design: 'z' } },
];

export const insertTools = (mode: Mode) => TOOLS.filter(tool => tool.insert && tool.modes.includes(mode) && !tool.disabled);
export const toolForKey = (mode: Mode, key: string) => TOOLS.find(tool => !tool.disabled && tool.modes.includes(mode) && tool.keys[mode] === key);
