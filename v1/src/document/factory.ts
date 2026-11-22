import type { Node, NodeType, Page, PathPoint, Project, ProjectKind, Settings, ShapeKind, Style } from './types';
import { uid } from './tree';

export const mk = (type: NodeType, name: string, style: Style, extra: Partial<Node> = {}): Node => ({ id: uid(), type, name, style, ...extra });

export const makeText = (x: number, y: number, text = 'Type something', fontSize = 18): Node =>
  mk('text', 'Text', { x, y, w: 320, h: 'auto', fontSize, color: '#1f2937' }, { text });
export const makeHeading = (x: number, y: number, text = 'Heading', fontSize = 44): Node =>
  mk('heading', 'Heading', { x, y, w: 640, h: 'auto', fontSize, fontWeight: 700, color: '#111827' }, { text, tag: 'h2' });
export const makeButton = (x: number, y: number, text = 'Button'): Node =>
  mk('button', 'Button', { x, y, w: 160, h: 48, fill: '#6366f1', color: '#ffffff', radius: 10, fontSize: 16, fontWeight: 600, align: 'center' }, { text, href: '#' });
export const makeInput = (type: import('./types').InputKind = 'text', name = 'field', placeholder = 'Enter text'): Node =>
  mk('input', type === 'textarea' ? 'Textarea' : type === 'select' ? 'Select' : type === 'checkbox' ? 'Checkbox' : `${type[0].toUpperCase()}${type.slice(1)} input`, { mode: 'flow', w: 'fill', h: type === 'textarea' ? 96 : 42, radius: 6, fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1, padX: 12, padY: 8, fontSize: 14, color: '#111827' }, { field: { type, name, placeholder, required: false, value: '', options: type === 'select' ? ['Option 1', 'Option 2'] : undefined } });
export const makeForm = (name = 'Form', children: Node[] = []): Node =>
  mk('form', name, { mode: 'flow', w: 'fill', h: 'auto', layout: 'flex', dir: 'column', gap: 14, pad: 24, radius: 12, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 }, { tag: 'form', children });
export const makeShape = (shape: ShapeKind, x: number, y: number, w: number, h: number, extra: Partial<Node> = {}): Node =>
  mk('shape', shape === 'rect' ? 'Rectangle' : shape === 'ellipse' ? 'Ellipse' : shape === 'star' ? 'Star' : 'Polygon', { x, y, w, h, fill: '#6366f1', radius: 0 }, { shape, points: shape === 'star' ? 5 : 6, inner: 0.5, ...extra });
export const makeImage = (x: number, y: number, w: number, h: number, src: string, assetId?: string, alt = ''): Node =>
  mk('image', 'Image', { x, y, w, h, radius: 0 }, { src, assetId, alt });
export const makeSection = (name = 'Section', h = 520, fill?: string): Node =>
  mk('section', name, { mode: 'flow', w: 'fill', h, fill, layout: 'free' }, { tag: 'section', children: [] });
export const makeContainer = (x: number, y: number, w: number, h: number): Node =>
  mk('container', 'Container', { x, y, w, h, layout: 'flex', dir: 'column', gap: 16, pad: 24, radius: 12, fill: '#f3f4f6' }, { children: [] });
export const makeGrid = (x: number, y: number, w: number, h: number, cols = 3): Node =>
  mk('container', 'Grid', { x, y, w, h, layout: 'grid', cols, gap: 16, pad: 16, radius: 12, fill: '#f3f4f6' }, { children: [] });
export const makePath = (pts: PathPoint[], closed: boolean, stroke = '#111827', fill?: string, strokeWidth = 3): Node => {
  const xs = pts.flatMap(p => [p.x, p.x + (p.hx1 ?? 0), p.x + (p.hx2 ?? 0)]); const ys = pts.flatMap(p => [p.y, p.y + (p.hy1 ?? 0), p.y + (p.hy2 ?? 0)]);
  const pad = strokeWidth; const minX = Math.min(...xs) - pad; const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) + pad - minX; const h = Math.max(...ys) + pad - minY;
  return mk('path', 'Path', { x: minX, y: minY, w: Math.max(2, w), h: Math.max(2, h), stroke, strokeWidth, fill: closed ? fill : undefined }, { pts: pts.map(p => ({ ...p, x: p.x - minX, y: p.y - minY })), closed, vw: Math.max(2, w), vh: Math.max(2, h) });
};
export const makeLine = (x1: number, y1: number, x2: number, y2: number, stroke = '#111827', width = 3): Node => makePath([{ x: x1, y: y1 }, { x: x2, y: y2 }], false, stroke, undefined, width);

export const makePage = (name = 'Home', children: Node[] = [makeSection('Hero', 640)]): Page => {
  const contentHeight = children.reduce((sum, child) => sum + (typeof child.style.h === 'number' ? child.style.h : 0), 0);
  const height = Math.max(1200, contentHeight);
  return { id: uid(), name, guides: [], width: 1440, height, root: mk('page', name, { layout: 'free', w: 1440, h: height, fill: '#ffffff' }, { children, tag: 'main' }) };
};

/* ---------- Starting presets (bundled templates, labelled as such in the UI) ---------- */
export type PresetId = 'blank' | 'landing' | 'portfolio' | 'shop';
export const PRESETS: { id: PresetId; name: string; blurb: string }[] = [
  { id: 'blank', name: 'Blank', blurb: 'One empty section.' },
  { id: 'landing', name: 'Landing page', blurb: 'Hero, three features, call to action.' },
  { id: 'portfolio', name: 'Portfolio', blurb: 'Intro, work grid and contact.' },
  { id: 'shop', name: 'Shop front', blurb: 'Banner and a product grid.' },
];

const hero = (title: string, sub: string, cta: string): Node => {
  const s = makeSection('Hero', 640, '#eef2ff');
  s.children = [makeHeading(120, 170, title, 60), makeText(120, 330, sub, 20), makeButton(120, 420, cta),
    makeShape('ellipse', 860, 120, 380, 380)];
  s.children[3].style.fill = '#818cf8';
  s.children[0].style.w = 640; s.children[1].style.w = 520;
  return s;
};
const features = (): Node => {
  const s = makeSection('Features', 460);
  const card = (x: number, t: string, d: string) => { const c = makeContainer(x, 90, 360, 260); c.name = 'Card'; c.children = [makeHeading(0, 0, t, 24), makeText(0, 0, d, 16)].map(n => { n.style.mode = 'flow'; n.style.w = 'fill'; return n; }); return c; };
  s.children = [makeHeading(120, 0, 'Why it works', 36), card(120, 'Fast', 'Built to load quickly on any connection.'), card(540, 'Flexible', 'Every element adapts from desktop to phone.'), card(960, 'Yours', 'Edit anything, export clean code.')];
  s.children[0].style.y = 0;
  s.children.forEach((c, i) => { if (i) c.style.y = 100; });
  return s;
};
const cta = (text: string): Node => { const s = makeSection('Call to action', 320, '#111827'); const h = makeHeading(120, 90, text, 40); h.style.color = '#ffffff'; s.children = [h, makeButton(120, 190, 'Get started')]; return s; };

export function presetPages(id: PresetId): Page[] {
  switch (id) {
    case 'landing': return [makePage('Home', [hero('Build something people love', 'A simple, honest landing page you can edit in minutes.', 'Start free'), features(), cta('Ready when you are')])];
    case 'portfolio': {
      const grid = makeSection('Work', 560); const g = makeGrid(120, 100, 1200, 380, 3); g.name = 'Work grid';
      g.children = [1, 2, 3].map(i => { const r = makeShape('rect', 0, 0, 100, 200); r.name = `Project ${i}`; r.style.mode = 'flow'; r.style.w = 'fill'; r.style.radius = 12; r.style.fill = ['#c7d2fe', '#fbcfe8', '#bbf7d0'][i - 1]; return r; });
      grid.children = [makeHeading(120, 20, 'Selected work', 36), g];
      return [makePage('Home', [hero('Hi, I design things', 'Independent designer working with small teams.', 'See my work'), grid, cta('Let us work together')])];
    }
    case 'shop': {
      const products = makeSection('Products', 620); const g = makeGrid(120, 100, 1200, 440, 4); g.name = 'Product grid';
      g.children = [1, 2, 3, 4].map(i => { const c = makeContainer(0, 0, 100, 200); c.name = `Product ${i}`; c.style.mode = 'flow'; c.style.w = 'fill'; c.style.fill = '#ffffff'; c.style.pad = 12; const img = makeShape('rect', 0, 0, 100, 220); img.style.mode = 'flow'; img.style.w = 'fill'; img.style.fill = '#e5e7eb'; img.style.radius = 8; img.name = 'Photo'; const t = makeText(0, 0, `Product ${i}`, 18); t.style.mode = 'flow'; t.style.w = 'fill'; c.children = [img, t]; return c; });
      products.children = [makeHeading(120, 20, 'New arrivals', 36), g];
      return [makePage('Home', [hero('Everyday essentials', 'Well made, fairly priced.', 'Shop now'), products])];
    }
    default: return [makePage('Home')];
  }
}

export function newProject(name: string, kind: ProjectKind, preset: PresetId, settings: Settings = { tablet: true, mobile: true, autoStack: true }): Project {
  const pages = presetPages(preset);
  if (kind === 'page') pages.splice(1);
  const now = Date.now();
  return { version: 1, id: uid(), name: name.trim() || 'Untitled', kind, settings, pages, activePageId: pages[0].id, assets: [], components: [], colors: [], tokens: defaultTokens(), textStyles: defaultTextStyles(), fontStacks: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' }, createdAt: now, updatedAt: now };
}

export const defaultTokens = () => [
  ['background','#ffffff','#0b1020','background'],['surface','#f8fafc','#151b2c','surface'],['text','#111827','#f3f4f6','text'],['muted','#6b7280','#9ca3af','muted'],['border','#e5e7eb','#374151','border'],['primary','#6366f1','#818cf8','primary'],['on-primary','#ffffff','#111827','on-primary'],['accent','#ec4899','#f472b6','accent'],['success','#16a34a','#4ade80','success'],['warning','#d97706','#fbbf24','warning'],['danger','#dc2626','#f87171','danger']
].map(([name,light,dark,role])=>({id:`token-${name}`,name,light,dark,role:role as any}));
export const defaultTextStyles = () => [
  ['Display',64,800,1.05],['H1',44,700,1.1],['H2',32,700,1.2],['H3',24,600,1.25],['Body',18,400,1.5],['Small',14,400,1.45],['Caption',12,500,1.35]
].map(([name,fontSize,fontWeight,lineHeight])=>({id:`type-${String(name).toLowerCase()}`,name:String(name),fontSize:Number(fontSize),fontWeight:Number(fontWeight),lineHeight:Number(lineHeight)}));
