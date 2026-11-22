import type { DesignObject, SiteElement } from '../types/project';

export type CodeTarget = 'HTML' | 'React' | 'Svelte' | 'React Native' | 'Vue' | 'Angular' | 'JSON';
export const CODE_TARGETS: CodeTarget[] = ['HTML', 'React', 'Svelte', 'React Native', 'Vue', 'Angular', 'JSON'];
export const CODE_EXT: Record<CodeTarget, string> = { HTML: 'html', React: 'jsx', Svelte: 'svelte', 'React Native': 'jsx', Vue: 'vue', Angular: 'ts', JSON: 'json' };

/** What the code panel is generating from: the website canvas (at one device width) or the vector artboard. */
export type CodeSource = { mode: 'web' | 'design'; elements: SiteElement[]; objects: DesignObject[]; width: number };

type Attrs = [string, string][];
type SvgShape = { tag: 'polygon' | 'line'; props: Attrs };
type GenNode = {
  type: 'box' | 'heading' | 'text' | 'button' | 'image' | 'svg';
  tag: string; attrs: Attrs; text?: string; shape?: SvgShape;
};

const DESIGN_W = 1200;
const DESIGN_H = 800;
const GEOMETRY = ['position', 'left', 'top', 'w', 'h'];

const round = (value: number) => Math.round(value * 100) / 100;
const px = (value: number) => `${round(value)}px`;
const num = (value: unknown, fallback = 0) => { const n = parseFloat(String(value ?? '')); return Number.isFinite(n) ? n : fallback; };
const colored = (value?: string) => !!value && value !== 'none' && value !== 'transparent';
const isData = (value: string) => /^data:/i.test(value.trim());

/* ---------- scene graph → neutral nodes ---------- */
function webNode(element: SiteElement, width: number, index: number): GenNode {
  const source = element.style as Record<string, any>;
  const flat: Record<string, string> = {};
  const add = (part?: Record<string, any>) => { if (part) for (const [key, value] of Object.entries(part)) if (key !== 'md' && key !== 'lg' && typeof value === 'string') flat[key] = value; };
  add(source);
  if (width >= 768) add(source.md);
  if (width >= 1024) add(source.lg);
  delete flat['min-h']; delete flat['max-w']; delete flat.m;
  const attrs: Attrs = [
    ...GEOMETRY.filter(key => flat[key]).map(key => [key, flat[key]] as [string, string]),
    ...Object.entries(flat).filter(([key]) => !GEOMETRY.includes(key)),
  ];
  switch (element.kind) {
    case 'heading': return { type: 'heading', tag: 'h1', attrs, text: element.content };
    case 'text': return { type: 'text', tag: 'p', attrs, text: element.content };
    case 'button': {
      if (element.href) attrs.push(['href', element.href]);
      return { type: 'button', tag: element.href ? 'a' : 'button', attrs, text: element.content };
    }
    case 'image': {
      const src = element.src || '';
      attrs.push(['src', !src ? '' : isData(src) ? `./assets/${element.asset?.name || `image-${index + 1}.png`}` : src]);
      attrs.push(['alt', element.alt || '']);
      return { type: 'image', tag: 'img', attrs };
    }
    default: return { type: 'box', tag: 'section', attrs, text: element.content || undefined };
  }
}

function shapePoints(object: DesignObject, star: boolean) {
  const count = star ? Math.max(3, object.points || 5) * 2 : Math.max(3, object.points || 6);
  const cx = object.width / 2; const cy = object.height / 2;
  const outer = Math.min(object.width, object.height) / 2;
  const inner = outer * (object.radius || 0.46);
  return Array.from({ length: count }, (_, i) => {
    const radius = star && i % 2 ? inner : outer;
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    return `${round(cx + Math.cos(angle) * radius)},${round(cy + Math.sin(angle) * radius)}`;
  }).join(' ');
}

function designNode(object: DesignObject, index: number): GenNode {
  const place: Attrs = [['position', 'absolute'], ['left', px(object.x)], ['top', px(object.y)], ['w', px(object.width)], ['h', px(object.height)]];
  const extras: Attrs = [];
  if (object.opacity !== undefined && object.opacity !== 1) extras.push(['opacity', String(round(object.opacity))]);
  if (object.rotation) extras.push(['transform', `rotate(${round(object.rotation)}deg)`]);
  const border = (): Attrs => (colored(object.stroke) && object.strokeWidth > 0 ? [['border', `${round(object.strokeWidth)}px solid ${object.stroke}`]] : []);

  switch (object.kind) {
    case 'rect': return { type: 'box', tag: 'div', attrs: [...place, ...(colored(object.fill) ? [['bg', object.fill] as [string, string]] : []), ...border(), ...(object.radius ? [['rounded', px(object.radius)] as [string, string]] : []), ...extras] };
    case 'ellipse': return { type: 'box', tag: 'div', attrs: [...place, ...(colored(object.fill) ? [['bg', object.fill] as [string, string]] : []), ...border(), ['rounded', 'full'], ...extras] };
    case 'line': {
      if (object.height <= 3) {
        const thickness = Math.max(1, object.strokeWidth || 1);
        return { type: 'box', tag: 'div', attrs: [['position', 'absolute'], ['left', px(object.x)], ['top', px(object.y)], ['w', px(object.width)], ['h', px(thickness)], ['bg', colored(object.stroke) ? object.stroke : 'gray-900'], ...extras] };
      }
      return { type: 'svg', tag: 'svg', attrs: [...place, ['viewBox', `0 0 ${round(object.width)} ${round(object.height)}`], ...extras], shape: { tag: 'line', props: [['x1', '0'], ['y1', '0'], ['x2', String(round(object.width))], ['y2', String(round(object.height))], ['stroke', colored(object.stroke) ? object.stroke : '#111827'], ['stroke-width', String(object.strokeWidth || 1)]] } };
    }
    case 'polygon':
    case 'star': return { type: 'svg', tag: 'svg', attrs: [...place, ['viewBox', `0 0 ${round(object.width)} ${round(object.height)}`], ...extras], shape: { tag: 'polygon', props: [['points', shapePoints(object, object.kind === 'star')], ['fill', object.fill || 'none'], ...(colored(object.stroke) ? [['stroke', object.stroke] as [string, string], ['stroke-width', String(object.strokeWidth || 1)] as [string, string]] : [])] } };
    case 'text': return { type: 'text', tag: 'p', attrs: [...place, ['font-size', px(object.fontSize || 32)], ...(colored(object.fill) ? [['text', object.fill] as [string, string]] : []), ...extras], text: object.text || '' };
    default: {
      const src = object.src || '';
      return { type: 'image', tag: 'img', attrs: [...place, ['src', !src ? '' : isData(src) ? `./assets/image-${index + 1}.png` : src], ['alt', ''], ['object-fit', 'cover'], ...extras] };
    }
  }
}

function nodesOf(source: CodeSource): { nodes: GenNode[]; width: number; height: number } {
  if (source.mode === 'design') return { nodes: source.objects.map(designNode), width: DESIGN_W, height: DESIGN_H };
  const nodes = source.elements.map((element, index) => webNode(element, source.width, index));
  const bottom = Math.max(0, ...source.elements.map(element => { const s = element.style as Record<string, any>; return num(s.top) + num(s.h, 120); }));
  return { nodes, width: source.width, height: Math.max(900, Math.ceil(bottom + 240)) };
}

/* ---------- emitters ---------- */
const escHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escBraces = (text: string) => escHtml(text).replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
const escJsx = (text: string) => escHtml(text).replace(/\{/g, "{'{'}").replace(/\}/g, "{'}'}");
const indent = (lines: string[], by = 1) => lines.map(line => `${'  '.repeat(by)}${line}`);

/** One element as lines of text. Long attribute lists wrap one attribute per line; the closing `>` stays on the last one. */
function build(name: string, attrs: Attrs, options: { self?: boolean; inner?: string; children?: string[] } = {}): string[] {
  const parts = attrs.map(([key, value]) => `${key}="${value.replace(/"/g, '&quot;')}"`);
  const flat = `<${name}${parts.length ? ` ${parts.join(' ')}` : ''}`;
  const open = flat.length <= 76 ? [flat] : [`<${name}`, ...parts.map(part => `  ${part}`)];
  open[open.length - 1] += options.self ? ' />' : '>';
  if (options.self) return open;
  if (options.children) return [...open, ...indent(options.children), `</${name}>`];
  open[open.length - 1] += `${options.inner ?? ''}</${name}>`;
  return open;
}

const REACT_NAME: Record<GenNode['type'], string> = { box: 'Box', heading: 'H1', text: 'Txt', button: 'Btn', image: 'Box', svg: 'Box' };

function nodeLines(node: GenNode, target: CodeTarget, uses: Set<string>): string[] {
  const react = target === 'React' || target === 'React Native';
  const text = node.text === undefined ? undefined : react ? escJsx(node.text) : target === 'HTML' ? escHtml(node.text) : escBraces(node.text);

  if (!react) {
    if (node.type === 'svg' && node.shape) {
      const shape = build(node.shape.tag, node.shape.props, { self: true });
      return build('svg', node.attrs, { children: shape });
    }
    if (node.type === 'image') return build('img', node.attrs, { self: true });
    return build(node.tag, node.attrs, { inner: text });
  }

  const name = REACT_NAME[node.type];
  uses.add(name);
  const extra: Attrs = node.type === 'image' ? [['as', 'img']] : node.type === 'svg' ? [['as', 'svg']] : node.type === 'box' && node.tag !== 'div' ? [['as', node.tag]] : node.type === 'button' && node.tag === 'a' ? [['as', 'a']] : node.type === 'button' ? [['type', 'button']] : [];
  const attrs: Attrs = [...extra, ...node.attrs];
  if (node.type === 'svg' && node.shape) {
    const props: Attrs = node.shape.props.map(([key, value]) => [key === 'stroke-width' ? 'strokeWidth' : key, value]);
    return build(name, attrs, { children: build(node.shape.tag, props, { self: true }) });
  }
  if (node.type === 'image') return build(name, attrs, { self: true });
  return build(name, attrs, { inner: text });
}

function wrapperAttrs(width: number, height: number): Attrs { return [['position', 'relative'], ['w', px(width)], ['h', px(height)]]; }

/** Pixel size of the canvas the code describes, for scaling the live preview. */
export function previewSize(source: CodeSource) { const { width, height } = nodesOf(source); return { width, height }; }

export function generateCode(target: CodeTarget, source: CodeSource): string {
  const { nodes, width, height } = nodesOf(source);
  if (target === 'JSON') {
    return `${JSON.stringify({ mode: source.mode, width, height, nodes: nodes.map(node => ({ type: node.type, tag: node.tag, attrs: Object.fromEntries(node.attrs), ...(node.text !== undefined ? { text: node.text } : {}), ...(node.shape ? { shape: { tag: node.shape.tag, props: Object.fromEntries(node.shape.props) } } : {}) })) }, null, 2)}\n`;
  }
  const uses = new Set<string>();
  const body = nodes.flatMap(node => nodeLines(node, target, uses));
  const empty = nodes.length === 0;
  const wrapper = wrapperAttrs(width, height);

  if (target === 'React' || target === 'React Native') {
    uses.add('Box');
    const main = build('Box', [['as', 'main'], ...wrapper], empty ? { inner: '' } : { children: body });
    const names = [...uses].sort().join(', ');
    const from = target === 'React' ? 'atomattr/react' : 'atomattr/react-native';
    const note = target === 'React Native' ? `// Adjust this import to wherever your AtomAttr React Native adapter lives.\n` : '';
    return `${note}import { ${names} } from '${from}';\n\nexport default function ${source.mode === 'design' ? 'Design' : 'Page'}() {\n  return (\n${indent(main, 2).join('\n')}\n  );\n}\n`;
  }

  const main = build('main', wrapper, empty ? { inner: '' } : { children: body });
  if (target === 'HTML') return `<!-- Load the AtomAttr runtime once: <script src="atomattr.min.js"></script> -->\n${main.join('\n')}\n`;
  if (target === 'Svelte') return `<!-- AtomAttr attributes work as-is in Svelte markup. Load the runtime once in app.html. -->\n${main.join('\n')}\n`;
  if (target === 'Vue') return `<template>\n${indent(main).join('\n')}\n</template>\n`;
  return `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-${source.mode === 'design' ? 'design' : 'page'}',\n  standalone: true,\n  template: \`\n${indent(main, 2).join('\n')}\n  \`,\n})\nexport class ${source.mode === 'design' ? 'DesignComponent' : 'PageComponent'} {}\n`;
}
