export type ElementKind = 'section' | 'heading' | 'text' | 'button' | 'image';
export type StyleKey = 'bg' | 'text' | 'p' | 'font-size' | 'font-weight' | 'align' | 'rounded' | 'w' | 'h' | 'object-fit' | 'display' | 'gap';
type RequiredStyleKey = 'bg' | 'text' | 'p';
export type ElementStyle = Pick<Record<StyleKey, string>, RequiredStyleKey>
  & Partial<Record<Exclude<StyleKey, RequiredStyleKey>, string>>
  & { md?: Partial<Record<StyleKey, string>>; lg?: Partial<Record<StyleKey, string>> };

export type SiteElement = {
  id: string;
  kind: ElementKind;
  content: string;
  href?: string;
  src?: string;
  alt?: string;
  asset?: { name: string; mimeType: string; dataUrl: string };
  style: ElementStyle;
};

export type StudioProject = {
  version: 2;
  id: string;
  name: string;
  pages: StudioPage[];
  activePageId: string;
};

export type StudioPage = {
  id: string;
  name: string;
  elements: SiteElement[];
  objects?: DesignObject[];
};

export type DesignKind = 'rect' | 'ellipse' | 'line' | 'polygon' | 'star' | 'text' | 'image';
export type DesignObject = {
  id: string;
  kind: DesignKind;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  text?: string;
  textColor?: string;
  src?: string;
  fontSize?: number;
  points?: number;
  radius?: number;
};
