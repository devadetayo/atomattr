/**
 * The document model is the single source of truth. The editor canvas, the layers tree, the code panel
 * and the exporters all read this structure; nothing reads the rendered DOM back as data.
 *
 * Geometry convention: desktop is the base design (1440 px wide). `x`, `w` of a free-positioned child are
 * stored in px of its parent's reference width and exported as percentages, so free layouts scale fluidly.
 * `y` and `h` are px. Tablet and mobile store only overrides.
 */
export type Bp = 'desktop' | 'tablet' | 'mobile';
export type NodeType = 'page' | 'section' | 'container' | 'form' | 'group' | 'text' | 'heading' | 'button' | 'input' | 'image' | 'shape' | 'path' | 'embed';
export type InputKind = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'range';
export type InputField = { type: InputKind; name: string; placeholder?: string; required?: boolean; value?: string; options?: string[]; /** radio: ticked when the page loads */ checked?: boolean; /** range: bounds and step, as text so they export untouched */ min?: string; max?: string; step?: string };
/** Repeater data: pasted CSV, or (when collectionId is set) the published items of a CMS collection, filtered, sorted and limited. */
export type Repeater = { csv: string; rows: Array<Record<string, string>>; collectionId?: string; filterKey?: string; filterOp?: 'eq' | 'neq' | 'contains' | 'gt' | 'lt'; filterValue?: string; sortKey?: string; sortDir?: 'asc' | 'desc'; limit?: number };
export type CmsFieldType = 'text' | 'longtext' | 'number' | 'image' | 'link' | 'date' | 'bool' | 'select';
export type CmsField = { id: string; name: string; key: string; type: CmsFieldType; options?: string[]; required?: boolean };
export type CmsItem = { id: string; values: Record<string, string>; draft?: boolean; updatedAt?: number };
export type Collection = { id: string; name: string; slug: string; fields: CmsField[]; items: CmsItem[]; /** field whose value becomes the item's web address (defaults to the first text field) */ slugField?: string };
/** Hand-written code kept with the project (page level adds to project level). Runs in exports; see exporters/custom-code.ts. */
export type CustomCode = { css?: string; js?: string; head?: string };
export type ShapeKind = 'rect' | 'ellipse' | 'polygon' | 'star';
export type LayoutKind = 'free' | 'flex' | 'grid';
export type Shadow = 'none' | 'sm' | 'md' | 'lg';
export type SizeKeyword = 'fill' | 'auto' | 'fit-content' | 'max-content' | 'min-content';

export type Style = {
  mode?: 'abs' | 'flow';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  inset?: number; top?: number; right?: number; bottom?: number; left?: number;
  x?: number; y?: number; w?: number | SizeKeyword; h?: number | SizeKeyword;
  rotation?: number; opacity?: number;
  fill?: string; stroke?: string; strokeWidth?: number; borderT?: number; borderR?: number; borderB?: number; borderL?: number; borderX?: number; borderY?: number; radius?: number; radiusTL?: number; radiusTR?: number; radiusBR?: number; radiusBL?: number; shadow?: Shadow;
  color?: string; fontSize?: number; fontWeight?: number; align?: 'left' | 'center' | 'right'; lineHeight?: number; letterSpacing?: number;
  layout?: LayoutKind; dir?: 'row' | 'column'; gap?: number; cols?: number; pad?: number;
  padX?: number; padY?: number; padT?: number; padR?: number; padB?: number; padL?: number;
  m?: number; mx?: number; my?: number; mt?: number; mr?: number; mb?: number; ml?: number; marginT?: number; marginR?: number; marginB?: number; marginL?: number;
  grow?: number; basis?: number | 'auto' | 'fill'; minW?: number | string; maxW?: number | string; minH?: number | string; maxH?: number | string;
  self?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  fillToken?: string; strokeToken?: string; colorToken?: string; tstyle?: string; font?: string;
  justify?: 'start' | 'center' | 'end' | 'between'; items?: 'start' | 'center' | 'end' | 'stretch'; wrap?: boolean;
  hidden?: boolean; order?: number;
  /** CSS display override (block, flex, grid, inline, none ...). `none` hides the box at this viewport. */
  display?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-block' | 'inline-flex' | 'contents' | 'none';
  /** CSS aspect-ratio, e.g. `16 / 9`, `1`, `4/3`. */
  aspectRatio?: string;
  /** Transform pieces, so hover/focus/active states can lift, grow or tilt a box. */
  scale?: number; translateX?: number; translateY?: number;
  /** Animate changes between states (ms) and the easing used. */
  transition?: number; ease?: 'linear' | 'in' | 'out' | 'in-out';
  /** Background image (asset id) with sizing, plus an optional tint layer above it. */
  fillImg?: string; bgSize?: string; bgPos?: string; bgRepeat?: string; bgFixed?: boolean; bgTint?: string;
  /** Fill the glyphs of text with the node's fill, gradient or background image. */
  clipText?: boolean;
  /** Transparency tool: an alpha mask (CSS gradient), merge mode (blend), CSS clip-path and extra effects. */
  fade?: string; blend?: string; clipPath?: string; shadowCss?: string; textShadow?: string; blur?: number; bgBlur?: number;
  /** Overflow clipping and scrolling behavior for the element box. */
  overflow?: 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
  italic?: boolean; underline?: boolean; upper?: boolean;
  /** Which spacing, radius or shadow token each of these fields follows (see document/scales.ts). Typing a value by hand unlinks it. */
  tok?: Partial<Record<'pad' | 'padX' | 'padY' | 'gap' | 'radius' | 'shadowCss', string>>;
};
export type StyleKey = keyof Style;

export type PathPoint = { x: number; y: number; hx1?: number; hy1?: number; hx2?: number; hy2?: number };

/** See document/behavior.ts. Exported pages get a small script only when a node uses one. */
export type Behavior = { role: 'scope' | 'panel' | 'toggle' | 'open' | 'close' | 'tab' | 'scroll' | 'theme' | 'copy'; key?: string; group?: string; initial?: 'open' | 'closed'; dismiss?: boolean; modal?: boolean; mobile?: boolean; mobileOnly?: boolean };

export type Node = {
  id: string; type: NodeType; name: string;
  style: Style; bp?: { tablet?: Style; mobile?: Style };
  children?: Node[];
  locked?: boolean; hidden?: boolean;
  tag?: string; behavior?: Behavior; anim?: Anim;
  text?: string; href?: string;
  src?: string; assetId?: string; alt?: string;
  overlay?: { color: string; opacity: number };
  field?: InputField; repeat?: Repeater;
  shape?: ShapeKind; points?: number; inner?: number;
  pts?: PathPoint[]; closed?: boolean; vw?: number; vh?: number;
  svgD?: string; evenodd?: boolean;
  svgTransform?: string;
  /** Custom HTML for an `embed` node. Never rendered live in the editor (it is untrusted); exports and sandboxed previews show it. */
  html?: string;
  inst?: string; from?: string; ov?: { text?: boolean; image?: boolean; link?: boolean; style?: boolean }; variant?: string;
  /** Reusable named style this node follows (Project.classes). */
  cls?: string;
  attrs?: Record<string,string|boolean>; states?: Partial<Record<'hover'|'focus'|'active'|'disabled'|'dark',Partial<Style>>>;
};

export type Guide = { axis: 'x' | 'y'; pos: number };
/** Finite design surface in CSS pixels. Older saved projects are normalized on open. */
export type Page = {
  id: string; name: string; root: Node; guides: Guide[]; width?: number; height?: number;
  seo?: { title?: string; description?: string; socialTitle?: string; socialDescription?: string; socialImage?: string };
  custom?: CustomCode;
  navLabel?: string; slug?: string; inNav?: boolean;
  /** Item page: this page is a template. The export makes one copy per published item of this collection. */
  templateOf?: string;
  parentId?: string | null; order?: number; sharedSection?: 'header' | 'footer' | null;
};
export type Asset = { id: string; name: string; mime: string; dataUrl: string; /** natural size in px, when known */ w?: number; h?: number };
export type ComponentVariant = { id: string; name: string; style?: Partial<Style>; text?: string };
export type Component = { id: string; name: string; node: Node; variants?: ComponentVariant[] };
/** Spacing, corner radius and shadow tokens. space/radius values are pixels; shadow values are CSS box-shadow text. */
export type ScaleKind = 'space' | 'radius' | 'shadow';
export type ScaleToken = { id: string; name: string; kind: ScaleKind; value: number | string };
/** A named bundle of style values that nodes can follow; editing the class updates every node using it. */
export type StyleClass = { id: string; name: string; style: Style };
/** A review comment thread, anchored to an object (or to the page when nodeId is missing). */
export type CommentReply = { id: string; author: string; text: string; createdAt: number };
export type Comment = { id: string; author: string; text: string; pageId: string; nodeId?: string; createdAt: number; updatedAt: number; resolved?: boolean; replies: CommentReply[] };
export type DesignToken = { id: string; name: string; light: string; dark?: string; role?: 'background'|'surface'|'text'|'muted'|'border'|'primary'|'on-primary'|'accent'|'success'|'warning'|'danger'|'custom' };
export type TextStyle = { id: string; name: string; fontSize: number; fontWeight: number; lineHeight?: number; letterSpacing?: number; color?: string; font?: string };
export type ProjectKind = 'website' | 'page';
export type Snapshot = { id: string; name: string; createdAt: number; data: string; auto?: boolean };

export type Settings = { tablet: boolean; mobile: boolean; autoStack: boolean; deviceFrame?: boolean };
export type SiteSettings = { name?: string; description?: string; baseUrl?: string; socialImage?: string; lang?: string };
export type Project = {
  version: 1; id: string; name: string; kind: ProjectKind; settings?: Settings;
  pages: Page[]; activePageId: string; pageTheme?: 'light'|'dark';
  site?: SiteSettings;
  collections?: Collection[]; custom?: CustomCode;
  scale?: ScaleToken[]; classes?: StyleClass[];
  analytics?: import('./analytics').Analytics; comments?: Comment[];
  globalHeaderPageId?: string | null; globalFooterPageId?: string | null;
  snapshots?: Snapshot[];
  assets: Asset[]; components: Component[]; colors: string[]; tokens?: DesignToken[]; textStyles?: TextStyle[]; fontStacks?: { heading: string; body: string }; webFonts?: import('./fonts').WebFont[];
  createdAt: number; updatedAt: number;
};

export type Rect = { x: number; y: number; w: number; h: number };

/** An animation on a node (see animations.ts). repeat 0 = forever. */
/** Starting state of a custom animation; it plays from these values to the object's normal look. */
export type AnimCustom = { opacity: number; scale: number; blur: number; rotate: number; x: number; y: number };
export type Anim = { preset: string; duration: number; delay: number; ease: string; repeat: number; trigger: 'load' | 'scroll' | 'hover' | 'click'; custom?: AnimCustom };
