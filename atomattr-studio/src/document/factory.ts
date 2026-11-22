import type { Node, NodeType, Page, PathPoint, Project, ProjectKind, Settings, ShapeKind, Style } from './types';
import { uid } from './tree';
import type { PresetId } from './template-meta';
import { templatePages, templateAssets } from './templates';

export const mk = (type: NodeType, name: string, style: Style, extra: Partial<Node> = {}): Node => ({ id: uid(), type, name, style, ...extra });

export const makeText = (x: number, y: number, text = 'Type something', fontSize = 18): Node =>
  mk('text', 'Text', { x, y, w: 'auto', h: 'auto', fontSize, color: '#1f2937' }, { text });
export const makeHeading = (x: number, y: number, text = 'Heading', fontSize = 44): Node =>
  mk('heading', 'Heading', { x, y, w: 'auto', h: 'auto', fontSize, fontWeight: 700, color: '#111827' }, { text, tag: 'h2' });
export const makeButton = (x: number, y: number, text = 'Button'): Node =>
  mk('button', 'Button', { x, y, w: 160, h: 48, fill: '#6366f1', color: '#ffffff', radius: 10, fontSize: 16, fontWeight: 600, align: 'center' }, { text, href: '#' });
export const makeInput = (type: import('./types').InputKind = 'text', name = 'field', placeholder = 'Enter text'): Node =>
  mk('input', type === 'textarea' ? 'Textarea' : type === 'select' ? 'Select' : type === 'checkbox' ? 'Checkbox' : `${type[0].toUpperCase()}${type.slice(1)} input`, { mode: 'flow', w: 'fill', h: type === 'textarea' ? 96 : 42, radius: 6, fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1, padX: 12, padY: 8, fontSize: 14, color: '#111827' }, { field: { type, name, placeholder, required: false, value: '', options: type === 'select' ? ['Option 1', 'Option 2'] : undefined } });
export const makeForm = (name = 'Form', children: Node[] = []): Node =>
  mk('form', name, { mode: 'flow', w: 'fill', h: 'auto', layout: 'flex', dir: 'column', gap: 14, padT: 24, padR: 24, padB: 24, padL: 24, radius: 12, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 }, { tag: 'form', children });
export const makeShape = (shape: ShapeKind, x: number, y: number, w: number, h: number, extra: Partial<Node> = {}): Node =>
  mk('shape', shape === 'rect' ? 'Rectangle' : shape === 'ellipse' ? 'Ellipse' : shape === 'star' ? 'Star' : 'Polygon', { x, y, w, h, fill: '#6366f1', radius: 0 }, { shape, points: shape === 'star' ? 5 : 6, inner: 0.5, ...extra });
export const makeImage = (x: number, y: number, w: number, h: number, src: string, assetId?: string, alt = ''): Node =>
  mk('image', 'Image', { x, y, w, h, radius: 0 }, { src, assetId, alt });
export const makeSection = (name = 'Section', h = 520, fill?: string): Node =>
  mk('section', name, { mode: 'flow', w: 'fill', h: 'auto', minH: h, fill, layout: 'free' }, { tag: 'section', children: [] });
export const makeContainer = (x: number, y: number, w: number, h: number): Node =>
  mk('container', 'Container', { x, y, w, h, layout: 'flex', dir: 'column', gap: 16, padT: 24, padR: 24, padB: 24, padL: 24, radius: 12, fill: '#f3f4f6' }, { children: [] });
export const makeGrid = (x: number, y: number, w: number, h: number, cols = 3): Node =>
  mk('container', 'Grid', { x, y, w, h, layout: 'grid', cols, gap: 16, padT: 16, padR: 16, padB: 16, padL: 16, radius: 12, fill: '#f3f4f6' }, { children: [] });
export const makePath = (pts: PathPoint[], closed: boolean, stroke = '#111827', fill?: string, strokeWidth = 3): Node => {
  const xs = pts.flatMap(p => [p.x, p.x + (p.hx1 ?? 0), p.x + (p.hx2 ?? 0)]); const ys = pts.flatMap(p => [p.y, p.y + (p.hy1 ?? 0), p.y + (p.hy2 ?? 0)]);
  const pad = strokeWidth; const minX = Math.min(...xs) - pad; const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) + pad - minX; const h = Math.max(...ys) + pad - minY;
  return mk('path', 'Path', { x: minX, y: minY, w: Math.max(2, w), h: Math.max(2, h), stroke, strokeWidth, fill: closed ? fill : undefined }, { pts: pts.map(p => ({ ...p, x: p.x - minX, y: p.y - minY })), closed, vw: Math.max(2, w), vh: Math.max(2, h) });
};
export const makeLine = (x1: number, y1: number, x2: number, y2: number, stroke = '#111827', width = 3): Node => makePath([{ x: x1, y: y1 }, { x: x2, y: y2 }], false, stroke, undefined, width);

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'page';

export const makePage = (name = 'Home', children: Node[] = [makeSection('Hero', 640)]): Page => {
  const contentHeight = children.reduce((sum, child) => {
    const h = typeof child.style.h === 'number' ? child.style.h : 0;
    const minH = typeof child.style.minH === 'number' ? child.style.minH : 0;
    return sum + Math.max(h, minH);
  }, 0);
  const height = Math.max(1200, contentHeight);
  return {
    id: uid(),
    name,
    navLabel: name,
    slug: slugify(name),
    inNav: true,
    parentId: null,
    order: 0,
    sharedSection: null,
    guides: [],
    width: 1440,
    height,
    root: mk('page', name, { layout: 'flex', dir: 'column', gap: 0, w: 1440, h: 'auto', minH: height, fill: '#ffffff' }, { children: children.map(c => ({ ...c, style: { ...c.style, mode: 'flow' as const, w: 'fill' as const } })), tag: 'main' })
  };
};

/* ---------- Starting presets (bundled templates, labelled as such in the UI) ---------- */
export type { PresetId } from './template-meta';
export { PRESETS } from './template-meta';
export type PageTemplateId = 'blank' | 'landing' | 'features' | 'contact';
export const PAGE_TEMPLATES: { id: PageTemplateId; name: string; blurb: string }[] = [
  { id: 'blank', name: 'Blank', blurb: 'Start with a clean page.' },
  { id: 'landing', name: 'Landing', blurb: 'Hero, benefits and a CTA.' },
  { id: 'features', name: 'Features', blurb: 'Showcase benefits in a polished grid.' },
  { id: 'contact', name: 'Contact', blurb: 'Top-level message and a form.' },
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

export function pageTemplates(id: PageTemplateId): Page[] {
  switch (id) {
    case 'blank': return [makePage('Home', [makeSection('Empty section', 520, '#f8fafc')])];
    case 'landing': return [makePage('Home', [hero('Build something people love', 'A simple, honest landing page you can edit in minutes.', 'Start free'), features(), cta('Ready when you are')])];
    case 'features': {
      const section = makeSection('Features', 700, '#f8fafc');
      section.children = [
        makeHeading(120, 40, 'Built to turn ideas into momentum', 42),
        makeText(120, 110, 'A focused product story for the main value you deliver.', 18),
        makeGrid(120, 180, 1200, 320, 3),
      ];
      const grid = section.children[2] as any;
      grid.children = [
        ['Fast setup', 'Launch a reliable presence without waiting on a lengthy build.'],
        ['Clear structure', 'Organize content around a page flow that makes sense.'],
        ['Flexible styling', 'Keep your brand system coherent from start to finish.'],
      ].map(([title, body], i) => {
        const card = makeSection(`Feature ${i + 1}`, 240, '#ffffff');
        card.style = { ...card.style, mode: 'flow', w: 'fill', h: 'auto', minH: 220, layout: 'flex', dir: 'column', gap: 8, pad: 24, radius: 12, stroke: '#e5e7eb', strokeWidth: 1 };
        card.children = [makeHeading(0, 0, title, 24), makeText(0, 0, body, 16)];
        card.children.forEach((node) => { node.style = { ...node.style, mode: 'flow', w: 'fill', h: 'auto' }; });
        return card;
      });
      return [makePage('Home', [hero('Turn ideas into momentum', 'Give your product a strong, credible story from the first click.', 'See how it works'), section, cta('Start your next launch')])];
    }
    case 'contact': {
      const form = makeForm('Contact form', [
        makeHeading(0, 0, 'Let’s talk', 36),
        makeInput('text', 'name', 'Your name'),
        makeInput('email', 'email', 'you@example.com'),
        makeInput('textarea', 'message', 'How can we help?'),
        makeButton(0, 0, 'Send message'),
      ]);
      form.style = { ...form.style, mode: 'flow', w: 'fill', h: 'auto', layout: 'flex', dir: 'column', gap: 16, pad: 28, radius: 18, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 };
      return [makePage('Home', [hero('We’re here to help', 'Say hello and tell us what you’re building.', 'Contact us'), makeSection('Contact details', 560, '#f8fafc')])];
    }
    default: return [makePage('Home')];
  }
}

export function presetPages(id: PresetId): Page[] {
  const full = templatePages(id); if (full) return full;
  switch (id) {
    case 'landing': return [makePage('Home', [hero('Build something people love', 'A simple, honest landing page you can edit in minutes.', 'Start free'), features(), cta('Ready when you are')])];
    case 'portfolio': {
      const grid = makeSection('Work', 560); const g = makeGrid(120, 100, 1200, 380, 3); g.name = 'Work grid';
      g.children = [1, 2, 3].map(i => { const r = makeShape('rect', 0, 0, 100, 200); r.name = `Project ${i}`; r.style.mode = 'flow'; r.style.w = 'fill'; r.style.radius = 12; r.style.fill = ['#c7d2fe', '#fbcfe8', '#bbf7d0'][i - 1]; return r; });
      grid.children = [makeHeading(120, 20, 'Selected work', 36), g];
      return [makePage('Home', [hero('Hi, I design things', 'Independent designer working with small teams.', 'See my work'), grid, cta('Let us work together')])];
    }
    case 'shop': {
      // Editorial ecommerce starter: responsive flow sections, real nav anchors and a product grid.
      const nav = makeSection('Navbar', 76, '#ffffff');
      nav.style = { mode: 'flow', w: 'fill', h: 'auto', minH: 76, layout: 'flex', dir: 'row', justify: 'between', items: 'center', wrap: true, gap: 24, padX: 56, padY: 16, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 };
      nav.children = [];
      const brand = makeHeading(0, 0, 'mono.', 24); brand.name = 'Brand'; brand.style = { mode: 'flow', w: 'auto', h: 'auto', fontSize: 24, fontWeight: 800, color: '#171717' };
      const links = mk('container', 'Navigation links', { mode: 'flow', w: 'auto', h: 'auto', layout: 'flex', dir: 'row', items: 'center', justify: 'center', gap: 30, wrap: true }, { children: [] });
      [['Shop','#products'],['Collections','#collections'],['About','#about']].forEach(([label, href]) => { const a = makeText(0,0,label,14); a.name = `${label} link`; a.tag = 'a'; a.href = href; a.style = { mode:'flow', w:'auto', h:'auto', fontSize:14, color:'#333333', fontWeight:600 }; links.children!.push(a); });
      const cart = makeButton(0,0,'View bag'); cart.name = 'Bag link'; cart.href = '#products'; cart.style = { mode:'flow', w:120, h:42, fill:'#171717', color:'#ffffff', radius:999, fontSize:14, fontWeight:600, align:'center' };
      nav.children = [brand, links, cart];

      const heroSection = makeSection('Hero', 560, '#f3f1ed'); heroSection.style = { ...heroSection.style, minH: 560, padX: 72, padY: 64, layout:'flex', dir:'row', items:'center', justify:'between', gap:40, wrap:true };
      const copy = mk('container','Hero copy',{mode:'flow',w:560,h:'auto',layout:'flex',dir:'column',gap:20},{children:[]});
      const eyebrow = makeText(0,0,'OBJECTS FOR EVERYDAY LIVING',12); eyebrow.style={mode:'flow',w:'fill',h:'auto',fontSize:12,fontWeight:700,letterSpacing:2,color:'#766c60'};
      const title = makeHeading(0,0,'Thoughtful design.\nEveryday essentials.',58); title.style={mode:'flow',w:'fill',h:'auto',fontSize:58,fontWeight:700,lineHeight:1.02,color:'#171717'};
      const desc = makeText(0,0,'Well-made pieces for slower mornings, better spaces, and all the moments in between.',18); desc.style={mode:'flow',w:'fill',h:'auto',fontSize:18,lineHeight:1.6,color:'#5f5a54'};
      const ctaButton = makeButton(0,0,'Explore the collection'); ctaButton.href='#products'; ctaButton.style={mode:'flow',w:190,h:48,fill:'#171717',color:'#ffffff',radius:999,fontSize:14,fontWeight:600,align:'center'};
      copy.children=[eyebrow,title,desc,ctaButton];
      const visual = makeShape('ellipse',0,0,390,390); visual.name='Hero product artwork'; visual.style={mode:'flow',w:390,h:390,fill:'#d4cec4',stroke:'#c4bdb2',strokeWidth:1};
      heroSection.children=[copy,visual];

      const products = makeSection('Featured products', 620, '#ffffff'); products.style={...products.style,minH:620,padX:56,padY:64,layout:'flex',dir:'column',gap:28}; products.tag='section'; products.name='Featured products';
      const heading = makeHeading(0,0,'Considered favourites',34); heading.style={mode:'flow',w:'fill',h:'auto',fontSize:34,fontWeight:700,color:'#171717'};
      const sub = makeText(0,0,'Simple forms. Honest materials. Made to be used.',15); sub.style={mode:'flow',w:'fill',h:'auto',fontSize:15,color:'#77716a'};
      const grid = makeGrid(0,0,1200,420,4); grid.name='Product grid'; grid.style={mode:'flow',w:'fill',h:'auto',layout:'grid',cols:4,gap:18,pad:0,fill:'#ffffff'};
      const productsData=[['Ceramic pour-over','#d8d4ce'],['Everyday carafe','#e9e5df'],['Linen notebook','#c8c2b9'],['Quiet desk lamp','#b8b4ae']];
      grid.children=productsData.map(([label,color],i)=>{const card=mk('container',label,{mode:'flow',w:'fill',h:'auto',layout:'flex',dir:'column',gap:12,fill:'#ffffff'},{children:[]});const photo=makeShape('rect',0,0,240,270);photo.name=`${label} image`;photo.style={mode:'flow',w:'fill',h:270,fill:color,radius:8};const name=makeText(0,0,label,16);name.style={mode:'flow',w:'fill',h:'auto',fontSize:16,fontWeight:600,color:'#171717'};const price=makeText(0,0,['$38','$32','$18','$64'][i],14);price.style={mode:'flow',w:'fill',h:'auto',fontSize:14,color:'#6b665f'};card.children=[photo,name,price];return card;});
      const about=makeSection('About',220,'#f5f3ef');about.style={...about.style,minH:220,padX:56,padY:48,layout:'flex',dir:'column',justify:'center',gap:12};about.children=[makeHeading(0,0,'Less, but better.',30),makeText(0,0,'Useful objects, considered details, and a little more calm in your everyday.',16)];about.children.forEach(n=>{n.style={...n.style,mode:'flow',w:'fill',h:'auto'};});
      const footer=makeSection('Footer',100,'#171717');footer.style={...footer.style,minH:100,padX:56,padY:28,layout:'flex',dir:'row',justify:'between',items:'center',wrap:true,gap:16};const footBrand=makeText(0,0,'mono. — everyday objects',14);footBrand.style={mode:'flow',w:'auto',h:'auto',fontSize:14,color:'#ffffff'};const footLink=makeText(0,0,'Contact us',14);footLink.tag='a';footLink.href='mailto:hello@example.com';footLink.style={mode:'flow',w:'auto',h:'auto',fontSize:14,color:'#ffffff'};footer.children=[footBrand,footLink];
      return [makePage('Home',[nav,heroSection,products,about,footer])];
    }
    default: return [makePage('Home')];
  }
}

export function newProject(name: string, kind: ProjectKind, preset: PresetId, settings: Settings = { tablet: true, mobile: true, autoStack: true }): Project {
  const pages = presetPages(preset); const tplAssets = [...templateAssets()];
  if (kind === 'page') pages.splice(1);
  const now = Date.now();
  return { version: 1, id: uid(), name: name.trim() || 'Untitled', kind, settings, pages: pages.map((page, index) => ({ ...page, order: index, parentId: null, sharedSection: null })), activePageId: pages[0].id, globalHeaderPageId: null, globalFooterPageId: null, assets: tplAssets, components: [], colors: [], tokens: defaultTokens(), textStyles: defaultTextStyles(), fontStacks: { heading: 'DM Sans, sans-serif', body: 'DM Sans, sans-serif' }, createdAt: now, updatedAt: now };
}

export const defaultTokens = () => [
  ['background','#ffffff','#0b1020','background'],['surface','#f8fafc','#151b2c','surface'],['text','#111827','#f3f4f6','text'],['muted','#6b7280','#9ca3af','muted'],['border','#e5e7eb','#374151','border'],['primary','#6366f1','#818cf8','primary'],['on-primary','#ffffff','#111827','on-primary'],['accent','#ec4899','#f472b6','accent'],['success','#16a34a','#4ade80','success'],['warning','#d97706','#fbbf24','warning'],['danger','#dc2626','#f87171','danger']
].map(([name,light,dark,role])=>({id:`token-${name}`,name,light,dark,role:role as any}));
export const defaultTextStyles = () => [
  ['Display',64,800,1.05],['H1',44,700,1.1],['H2',32,700,1.2],['H3',24,600,1.25],['Body',18,400,1.5],['Small',14,400,1.45],['Caption',12,500,1.35]
].map(([name,fontSize,fontWeight,lineHeight])=>({id:`type-${String(name).toLowerCase()}`,name:String(name),fontSize:Number(fontSize),fontWeight:Number(fontWeight),lineHeight:Number(lineHeight)}));

/** A block of hand-written HTML. It is shown as a placeholder on the canvas and rendered in exports. */
export const makeEmbed = (html = '<!-- Paste your embed code here -->'): Node =>
  mk('embed', 'Custom HTML', { mode: 'flow', w: 'fill', h: 200 }, { html });
