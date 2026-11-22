import type { Target } from '../exporters/codegen';

/** Docker windows. Floating windows overlay the canvas; docked (pinned) windows reserve space beside it. */
export type CustomTab = 'custom:css' | 'custom:js' | 'custom:head';
export const VISIBLE_DOCKERS_EXCLUDE: DockerId[] = ['code'];
export type DockerId = 'layers' | 'properties' | 'structure' | 'styles' | 'typography' | 'align' | 'shapes' | 'assets' | 'components' | 'attributes' | 'checks' | 'cms' | 'code' | 'export' | 'fill' | 'effects' | 'vector' | 'animation' | 'analytics' | 'comments' | 'colors' | 'states';
export type Win = {
  id: string; tabs: DockerId[]; active: DockerId;
  ax: 'l' | 'r'; x: number; y: number; w: number; h: number;
  dock: null | 'left' | 'right'; z: number; collapsed?: boolean;
  floatRect?: { ax: 'l' | 'r'; x: number; y: number; w: number; h: number };
};
export type Layout = {
  v: 2;
  wins: Win[]; zTop: number;
  tools: { x: number; y: number; dock?: 'left' | 'right' | 'top' | 'bottom' | null; horizontal?: boolean };
  /** `dock`: 'free' floats (default spot is bottom centre), 'bottom' is a strip along the bottom edge, 'right' a strip down the right edge.
      `vertical` lays a floating palette out as a column. x / y are the floating position inside the canvas area. */
  palette: { visible: boolean; open: boolean; dx: number; dock?: 'free' | 'bottom' | 'right'; vertical?: boolean; x?: number; y?: number };
  /** `dock`: when set the pages panel is clipped into the top or bottom edge of the canvas and takes its own space there. */
  band: { open: boolean; x?: number; y?: number; dock?: 'top' | 'bottom' | null };
  /** Floating zoom controls; shown unless false. */
  zoomDock?: boolean;
  code: { open: boolean; w: number; target: Target | CustomTab; pinned: boolean; collapsed: boolean; x: number; y: number };
  side: { left: number; right: number };
  rulers: boolean; grid: boolean; snap: boolean; guides: boolean; safeArea: boolean;
  /** Last workspace preset applied and the arrangement it produced; a different arrangement later reads as "Custom". */
  preset?: { id: WorkspaceId; sig: string } | null;
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
  { id: 'attributes', title: 'Inspect', w: 320, h: 420, blurb: 'Generated AtomAttr JSX/CSS output, custom attributes and state styles.' },
  { id: 'checks', title: 'Checks', w: 340, h: 520, blurb: 'Accessibility, links, SEO, performance and measured breakpoint overflow.' },
  { id: 'cms', title: 'CMS', w: 380, h: 560, blurb: 'Collections, fields and content that repeaters bind to.' },
  { id: 'code', title: 'Custom code', w: 380, h: 560, blurb: 'Your own CSS, JavaScript and head HTML for the site or a page.' },
  { id: 'export', title: 'Code & Export', w: 300, h: 320, blurb: 'Code targets, ZIP export.' },
  { id: 'fill', title: 'Fill', w: 300, h: 560, blurb: 'Solid, gradient and image fills; clip image to text.' },
  { id: 'effects', title: 'Effects', w: 300, h: 560, blurb: 'Transparency, contour, blend, shadow, clip shape.' },
  { id: 'comments', title: 'Comments', w: 320, h: 520, blurb: 'Review notes on objects, saved in the project.' },
  { id: 'states', title: 'States', w: 340, h: 540, blurb: 'Hover, focus, pressed, disabled and dark mode looks. Every property can change.' },
  { id: 'colors', title: 'Used colors', w: 320, h: 520, blurb: 'Every colour in this project, where it is used, replace it everywhere.' },
  { id: 'analytics', title: 'Analytics', w: 320, h: 460, blurb: 'Page views and click events for exported sites.' },
  { id: 'animation', title: 'Animation', w: 320, h: 600, blurb: 'Entrances, highlights, loops and exits with easing and timing.' },
  { id: 'vector', title: 'Vector', w: 280, h: 420, blurb: 'Weld, trim, intersect, combine, node tools.' },
];
export const dockerDef = (id: DockerId) => DOCKERS.find(d => d.id === id)!;

/** Panel metadata for the top-bar panel menu: icon (ToolIcon key), group heading and search keywords. */
export const DOCKER_GROUPS = ['Structure', 'Design', 'Output'] as const;
export type DockerGroup = (typeof DOCKER_GROUPS)[number];
export const DOCKER_META: Record<DockerId, { icon: string; group: DockerGroup; keys: string }> = {
  layers: { icon: 'layers', group: 'Structure', keys: 'objects tree nest order hierarchy lock hide' },
  structure: { icon: 'structure', group: 'Structure', keys: 'outline sections headings navigator' },
  components: { icon: 'component', group: 'Structure', keys: 'reusable blocks symbols navbar footer' },
  assets: { icon: 'image', group: 'Structure', keys: 'images media files upload svg' },
  properties: { icon: 'sliders', group: 'Design', keys: 'inspector transform position size width height rotation layout' },
  fill: { icon: 'fountain', group: 'Design', keys: 'colour color gradient solid background paint stroke' },
  effects: { icon: 'transparency', group: 'Design', keys: 'shadow blur opacity transparency blend contour' },
  styles: { icon: 'styles', group: 'Design', keys: 'tokens colour color text styles palette' },
  typography: { icon: 'text', group: 'Design', keys: 'font weight size line height spacing alignment text' },
  align: { icon: 'selectall', group: 'Design', keys: 'distribute snap grid guides align' },
  shapes: { icon: 'star', group: 'Design', keys: 'shape library rectangle ellipse polygon' },
  comments: { icon: 'text', group: 'Structure', keys: 'comments review feedback notes collaborate resolve thread merge' },
  states: { icon: 'sparkle', group: 'Design', keys: 'states hover focus active pressed disabled dark mode interaction transition' },
  colors: { icon: 'brush', group: 'Design', keys: 'colours colors palette used swatches replace hex fill stroke text' },
  analytics: { icon: 'sliders', group: 'Output', keys: 'analytics tracking plausible google umami events pageviews stats' },
  animation: { icon: 'star', group: 'Design', keys: 'motion animate entrance exit fade slide bounce loop easing curve transition scroll hover' },
  vector: { icon: 'pen', group: 'Design', keys: 'weld trim intersect boolean pen nodes path' },
  attributes: { icon: 'brush', group: 'Output', keys: 'inspect code attributes states hover dark custom element' },
  checks: { icon: 'check', group: 'Output', keys: 'accessibility a11y links overflow responsive qa lint' },
  cms: { icon: 'grid', group: 'Structure', keys: 'cms collections content data fields items blog dynamic repeater csv database' },
  code: { icon: 'code', group: 'Output', keys: 'custom css javascript js html head script style embed analytics tag' },
  export: { icon: 'export', group: 'Output', keys: 'code html react css zip download publish' },
};

/* ---------- workspace presets ---------- */
export type WorkspaceId = 'design' | 'typography' | 'assets' | 'code' | 'qa';
type WinSpec = { tabs: DockerId[]; dock: 'left' | 'right'; h?: number };
export type Preset = { id: WorkspaceId; name: string; icon: string; blurb: string; wins: WinSpec[]; code: boolean };

export const PRESETS: Preset[] = [
  { id: 'design', name: 'Design', icon: 'sliders', blurb: 'Layers on the left, properties and fill on the right.', code: false,
    wins: [{ tabs: ['layers', 'structure'], dock: 'left' }, { tabs: ['properties', 'fill', 'effects'], dock: 'right' }] },
  { id: 'typography', name: 'Typography', icon: 'text', blurb: 'Type controls and text styles beside the canvas.', code: false,
    wins: [{ tabs: ['layers'], dock: 'left' }, { tabs: ['typography'], dock: 'right' }, { tabs: ['styles', 'properties'], dock: 'right' }] },
  { id: 'assets', name: 'Assets', icon: 'image', blurb: 'Images, components and shapes within reach.', code: false,
    wins: [{ tabs: ['assets', 'components', 'shapes'], dock: 'left' }, { tabs: ['properties'], dock: 'right' }] },
  { id: 'code', name: 'Code', icon: 'code', blurb: 'Generated code open, with attributes to tune it.', code: true,
    wins: [{ tabs: ['layers'], dock: 'left' }, { tabs: ['attributes', 'properties'], dock: 'right' }] },
  { id: 'qa', name: 'Responsive QA', icon: 'mobile', blurb: 'Checks, properties and layers for breakpoint review.', code: false,
    wins: [{ tabs: ['layers'], dock: 'left' }, { tabs: ['checks'], dock: 'right' }, { tabs: ['properties'], dock: 'right' }] },
];
export const presetOf = (id: WorkspaceId) => PRESETS.find(p => p.id === id)!;

/** Arrangement signature: which panels sit where. Float positions and sizes are ignored on purpose. */
export const layoutSig = (wins: Win[], codeOpen: boolean) =>
  wins.map(w => `${w.dock ?? 'float'}:${w.tabs.join('+')}`).sort().join('|') + (codeOpen ? '|code' : '');
export const presetSig = (p: Preset) => p.wins.map(w => `${w.dock}:${w.tabs.join('+')}`).sort().join('|') + (p.code ? '|code' : '');
/** Name to show in the top bar: the preset while the arrangement still matches it, "Custom" afterwards. */
export function activePreset(l: Layout): Preset | null {
  const cur = l.preset; if (!cur) return null; const p = PRESETS.find(x => x.id === cur.id); if (!p) return null;
  return layoutSig(l.wins, l.code.open) === cur.sig ? p : null;
}

let winSeq = 0;
export const makeWin = (id: DockerId, patch: Partial<Win> = {}): Win => {
  const d = dockerDef(id);
  return { id: `w${Date.now().toString(36)}${winSeq++}`, tabs: [id], active: id, ax: 'r', x: 16, y: 12, w: d.w, h: d.h, dock: null, z: 1, ...patch };
};

/** Docked windows for a preset. Each keeps a float rectangle so unpinning puts it somewhere sensible. */
export function presetWins(p: Preset): Win[] {
  return p.wins.map((spec, i) => {
    const d = dockerDef(spec.tabs[0]);
    return makeWin(spec.tabs[0], { tabs: [...spec.tabs], active: spec.tabs[0], dock: spec.dock, z: i + 1, floatRect: { ax: spec.dock === 'left' ? 'l' : 'r', x: 24 + i * 24, y: 24 + i * 28, w: d.w, h: d.h } });
  });
}

export function defaultLayout(): Layout {
  const p = presetOf('design'); const wins = presetWins(p);
  return {
    v: 2, wins, zTop: wins.length + 1,
    tools: { x: 12, y: 12, dock: null }, palette: { visible: true, open: true, dx: 0 }, band: { open: true },
    code: { open: false, w: 600, target: 'HTML', pinned: true, collapsed: false, x: 24, y: 12 }, side: { left: 280, right: 320 },
    rulers: false, grid: false, snap: true, guides: true, safeArea: true,
    preset: { id: p.id, sig: presetSig(p) },
  };
}

export type Box = { x: number; y: number; w: number; h: number };
export const HEAD_H = 40;
/** Resolve a floating window's rectangle inside an area. The result always lies fully inside the area. */
export function winBox(win: Win, area: { w: number; h: number }): Box {
  const w = Math.min(win.w, Math.max(200, area.w - 8));
  const h = win.collapsed ? HEAD_H : Math.min(win.h, Math.max(120, area.h - 8));
  const x = win.ax === 'l' ? win.x : area.w - win.x - w;
  return { x: clamp(x, 0, Math.max(0, area.w - w)), y: clamp(win.y, 0, Math.max(0, area.h - h)), w, h };
}
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Layout modes by the width left for the workspace: full docks, squeezed docks, or one bottom sheet. */
export type DockMode = 'full' | 'compact' | 'sheet';
export const CANVAS_MIN = 360; export const COL_MIN = 200; export const SHEET_BELOW = 720;
export function dockMode(areaW: number, cols: number, reservedW: number): DockMode {
  const free = areaW - reservedW;
  if (areaW < SHEET_BELOW || (cols > 0 && free < CANVAS_MIN + cols * COL_MIN)) return 'sheet';
  if (cols > 0 && free < CANVAS_MIN + cols * 320) return 'compact';
  return 'full';
}
/** Width each docked column may take so the canvas keeps at least CANVAS_MIN. */
export const sideWidth = (want: number, areaW: number, reservedW: number, cols: number) =>
  cols ? Math.max(COL_MIN, Math.min(want, Math.floor((areaW - reservedW - CANVAS_MIN) / cols))) : want;

/* ---------- where the floating bars sit ---------- */
export const PAGES_OPEN_H = 157; export const PAGES_PILL_H = 36;
/** Height the docked pages strip takes from the canvas column (0 when it floats). */
export const pagesDockH = (l: Layout) => (l.band.dock ? (l.band.open ? PAGES_OPEN_H : PAGES_PILL_H) : 0);
/** True when the palette sits along the bottom edge of the canvas (pinned, or floating in its default spot). */
export const paletteAtBottom = (l: Layout) => l.palette.visible && (l.palette.dock === 'bottom' || ((l.palette.dock ?? 'free') === 'free' && l.palette.x === undefined && !l.palette.vertical));
