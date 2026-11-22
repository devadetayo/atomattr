import type { Target } from '../exporters/codegen';

/** Docker windows. Floating windows overlay the canvas; docked (pinned) windows reserve space beside it. */
export type DockerId = 'layers' | 'properties' | 'structure' | 'styles' | 'typography' | 'align' | 'shapes' | 'assets' | 'components' | 'attributes' | 'checks' | 'export';
export type Win = {
  id: string; tabs: DockerId[]; active: DockerId;
  ax: 'l' | 'r'; x: number; y: number; w: number; h: number;
  dock: null | 'left' | 'right'; z: number; collapsed?: boolean;
  floatRect?: { ax: 'l' | 'r'; x: number; y: number; w: number; h: number };
};
export type Layout = {
  v: 2;
  wins: Win[]; zTop: number;
  tools: { x: number; y: number };
  palette: { visible: boolean; open: boolean; dx: number };
  band: { open: boolean };
  code: { open: boolean; w: number; target: Target; pinned: boolean; collapsed: boolean; x: number; y: number };
  side: { left: number; right: number };
  rulers: boolean; grid: boolean; snap: boolean; guides: boolean; safeArea: boolean;
};

export const DOCKERS: { id: DockerId; title: string; w: number; h: number; blurb: string }[] = [
  { id: 'layers', title: 'Layers', w: 280, h: 360, blurb: 'Every object on the page, nested.' },
  { id: 'properties', title: 'Properties', w: 300, h: 520, blurb: 'Position, size, layout and appearance.' },
  { id: 'structure', title: 'Structure', w: 280, h: 300, blurb: 'Sections, headings and page outline.' },
  { id: 'styles', title: 'Styles', w: 280, h: 340, blurb: 'Colour and text styles.' },
  { id: 'typography', title: 'Typography', w: 280, h: 360, blurb: 'Font size, weight, spacing, alignment.' },
  { id: 'align', title: 'Align', w: 260, h: 300, blurb: 'Align, distribute and snap settings.' },
  { id: 'shapes', title: 'Shapes', w: 300, h: 380, blurb: 'Shape library with live thumbnails.' },
  { id: 'assets', title: 'Assets', w: 280, h: 340, blurb: 'Images used in this project.' },
  { id: 'components', title: 'Components', w: 280, h: 340, blurb: 'Reusable blocks.' },
  { id: 'attributes', title: 'Attributes', w: 320, h: 420, blurb: 'Generated and custom AtomAttr attributes, plus states.' },
  { id: 'checks', title: 'Checks', w: 340, h: 520, blurb: 'Accessibility, links and measured breakpoint overflow.' },
  { id: 'export', title: 'Code & Export', w: 300, h: 320, blurb: 'Code targets, ZIP export.' },
];
export const dockerDef = (id: DockerId) => DOCKERS.find(d => d.id === id)!;

let winSeq = 0;
export const makeWin = (id: DockerId, patch: Partial<Win> = {}): Win => {
  const d = dockerDef(id);
  return { id: `w${Date.now().toString(36)}${winSeq++}`, tabs: [id], active: id, ax: 'r', x: 16, y: 12, w: d.w, h: d.h, dock: null, z: 1, ...patch };
};

export function defaultLayout(): Layout {
  const wins = [
    makeWin('properties', { ax: 'r', x: 16, y: 12, z: 1 }),
    makeWin('layers', { ax: 'r', x: 16, y: 548, w: 300, h: 280, z: 2 }),
  ];
  return {
    v: 2, wins, zTop: 3,
    tools: { x: 12, y: 12 }, palette: { visible: true, open: true, dx: 0 }, band: { open: true },
    code: { open: true, w: 600, target: 'HTML', pinned: true, collapsed: false, x: 24, y: 12 }, side: { left: 300, right: 320 },
    rulers: true, grid: false, snap: true, guides: true, safeArea: true,
  };
}

export type Box = { x: number; y: number; w: number; h: number };
/** Resolve a window's rectangle inside an area of the given size. */
export function winBox(win: Win, area: { w: number; h: number }): Box {
  const w = Math.min(win.w, Math.max(200, area.w - 8));
  const h = win.collapsed ? 34 : Math.min(win.h, Math.max(120, area.h - 8));
  const x = win.ax === 'l' ? win.x : area.w - win.x - w;
  return { x: clamp(x, 0, Math.max(0, area.w - w)), y: clamp(win.y, 0, Math.max(0, area.h - 34)), w, h };
}
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
