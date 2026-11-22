/**
 * The document model is the single source of truth. The editor canvas, the layers tree, the code panel
 * and the exporters all read this structure; nothing reads the rendered DOM back as data.
 *
 * Geometry convention: desktop is the base design (1440 px wide). `x`, `w` of a free-positioned child are
 * stored in px of its parent's reference width and exported as percentages, so free layouts scale fluidly.
 * `y` and `h` are px. Tablet and mobile store only overrides.
 */
export type Bp = 'desktop' | 'tablet' | 'mobile';
export type NodeType = 'page' | 'section' | 'container' | 'form' | 'group' | 'text' | 'heading' | 'button' | 'input' | 'image' | 'shape' | 'path';
export type InputKind = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
export type InputField = { type: InputKind; name: string; placeholder?: string; required?: boolean; value?: string; options?: string[] };
export type Repeater = { csv: string; rows: Array<Record<string, string>> };
export type ShapeKind = 'rect' | 'ellipse' | 'polygon' | 'star';
export type LayoutKind = 'free' | 'flex' | 'grid';
export type Shadow = 'none' | 'sm' | 'md' | 'lg';

export type Style = {
  mode?: 'abs' | 'flow';
  x?: number; y?: number; w?: number | 'fill' | 'auto'; h?: number | 'auto';
  rotation?: number; opacity?: number;
  fill?: string; stroke?: string; strokeWidth?: number; radius?: number; shadow?: Shadow;
  color?: string; fontSize?: number; fontWeight?: number; align?: 'left' | 'center' | 'right'; lineHeight?: number; letterSpacing?: number;
  layout?: LayoutKind; dir?: 'row' | 'column'; gap?: number; cols?: number; pad?: number;
  padX?: number; padY?: number; grow?: number; basis?: number | 'auto' | 'fill'; minW?: number; maxW?: number; minH?: number;
  self?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  fillToken?: string; strokeToken?: string; colorToken?: string; tstyle?: string; font?: string;
  justify?: 'start' | 'center' | 'end' | 'between'; items?: 'start' | 'center' | 'end' | 'stretch'; wrap?: boolean;
  hidden?: boolean; order?: number;
};
export type StyleKey = keyof Style;

export type PathPoint = { x: number; y: number; hx1?: number; hy1?: number; hx2?: number; hy2?: number };

export type Node = {
  id: string; type: NodeType; name: string;
  style: Style; bp?: { tablet?: Style; mobile?: Style };
  children?: Node[];
  locked?: boolean; hidden?: boolean;
  tag?: string;
  text?: string; href?: string;
  src?: string; assetId?: string; alt?: string;
  overlay?: { color: string; opacity: number };
  field?: InputField; repeat?: Repeater;
  shape?: ShapeKind; points?: number; inner?: number;
  pts?: PathPoint[]; closed?: boolean; vw?: number; vh?: number;
  svgD?: string;
  svgTransform?: string;
  inst?: string; from?: string; ov?: { text?: boolean; image?: boolean; link?: boolean; style?: boolean }; variant?: string;
  attrs?: Record<string,string|boolean>; states?: Partial<Record<'hover'|'focus'|'active'|'disabled'|'dark',Partial<Style>>>;
};

export type Guide = { axis: 'x' | 'y'; pos: number };
/** Finite design surface in CSS pixels. Older saved projects are normalized on open. */
export type Page = { id: string; name: string; root: Node; guides: Guide[]; width?: number; height?: number; seo?: { title?: string; description?: string } };
export type Asset = { id: string; name: string; mime: string; dataUrl: string };
export type ComponentVariant = { id: string; name: string; style?: Partial<Style>; text?: string };
export type Component = { id: string; name: string; node: Node; variants?: ComponentVariant[] };
export type DesignToken = { id: string; name: string; light: string; dark?: string; role?: 'background'|'surface'|'text'|'muted'|'border'|'primary'|'on-primary'|'accent'|'success'|'warning'|'danger'|'custom' };
export type TextStyle = { id: string; name: string; fontSize: number; fontWeight: number; lineHeight?: number; letterSpacing?: number; color?: string; font?: string };
export type ProjectKind = 'website' | 'page';
export type Snapshot = { id: string; name: string; createdAt: number; data: string };

export type Settings = { tablet: boolean; mobile: boolean; autoStack: boolean; deviceFrame?: boolean };
export type Project = {
  version: 1; id: string; name: string; kind: ProjectKind; settings?: Settings;
  pages: Page[]; activePageId: string; pageTheme?: 'light'|'dark';
  snapshots?: Snapshot[];
  assets: Asset[]; components: Component[]; colors: string[]; tokens?: DesignToken[]; textStyles?: TextStyle[]; fontStacks?: { heading: string; body: string };
  createdAt: number; updatedAt: number;
};

export type Rect = { x: number; y: number; w: number; h: number };
