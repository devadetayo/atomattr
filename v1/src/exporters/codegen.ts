import type { Project } from '../document/types';
import { buildGen, type Gen } from '../document/gen';
import { activePage } from '../document/tree';
import { cssFor, indexGen } from './css';
import type { Attrs } from '../document/attrs';
import { toProp } from '../document/attrs';

export type Target = 'HTML' | 'CSS' | 'React' | 'Svelte' | 'React Native' | 'Vue' | 'Angular' | 'JSON';
export const TARGETS: Target[] = ['HTML', 'CSS', 'React', 'Svelte', 'React Native', 'Vue', 'Angular', 'JSON'];
export const TARGET_LABEL: Record<Target, string> = { HTML: 'HTML (AtomAttr)', CSS: 'CSS', React: 'React', Svelte: 'Svelte', 'React Native': 'React Native', Vue: 'Vue', Angular: 'Angular', JSON: 'JSON' };
export const TARGET_EXT: Record<Target, string> = { HTML: 'html', CSS: 'css', React: 'jsx', Svelte: 'svelte', 'React Native': 'jsx', Vue: 'vue', Angular: 'ts', JSON: 'json' };
export const TARGET_NOTE: Partial<Record<Target, string>> = {
  'React Native': 'Native has no CSS grid or media queries, so grid layouts and breakpoint prefixes are approximated. Review before shipping.',
};

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const escBraces = (t: string) => esc(t).replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
const escJsx = (t: string) => esc(t).replace(/\{/g, "{'{'}").replace(/\}/g, "{'}'}");
const ind = (n: number) => '  '.repeat(n);
const pageHref=(project:Project|undefined,href:string)=>{if(!href.startsWith('page:')||!project)return href;const id=href.slice(5);const i=project.pages.findIndex(p=>p.id===id);if(i<0)return '#';if(i===0)return 'index.html';const used=new Set(['index']);for(let k=1;k<=i;k++){const base=project.pages[k].name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||`page-${k+1}`;let name=base,n=2;while(used.has(name))name=`${base}-${n++}`;used.add(name);if(k===i)return `${name}.html`;}return '#';};

/** Asset references in exports are always relative files, never data URLs. */
export type AssetNames = Map<string, string>;
export const assetNamesFor = (project: Project): AssetNames => {
  const used = new Set<string>(); const map: AssetNames = new Map();
  project.assets.forEach((a, i) => {
    const ext = (a.mime.split('/')[1] || 'png').replace('svg+xml', 'svg').replace('jpeg', 'jpg');
    let base = (a.name || `image-${i + 1}`).replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() || `image-${i + 1}`;
    let n = base; let k = 2; while (used.has(n)) n = `${base}-${k++}`; used.add(n);
    map.set(a.id, `assets/${n}.${ext}`);
  });
  return map;
};
const srcOf = (g: Gen, assets: AssetNames) => (g.node.assetId && assets.get(g.node.assetId)) || (g.src && !g.src.startsWith('data:') ? g.src : g.src ? 'assets/image.png' : '');

const attrList = (a: Attrs): [string, string][] => Object.entries(a);
function attrStr(a: Attrs, extra: [string, string][] = [], wrap = true): { parts: string[]; flat: string } {
  const parts = [...extra, ...attrList(a)].map(([k, v]) => (v === '' ? k : `${k}="${escAttr(v)}"`));
  return { parts, flat: parts.join(' ') };
}
function open(name: string, a: Attrs, depth: number, extra: [string, string][] = [], close = '>'): string[] {
  const { parts, flat } = attrStr(a, extra);
  const line = `${ind(depth)}<${name}${flat ? ` ${flat}` : ''}${close}`;
  if (line.length <= 96 || !parts.length) return [line];
  return [`${ind(depth)}<${name}`, ...parts.map(p => `${ind(depth + 1)}${p}`), `${ind(depth)}${close.trim() === '/>' ? '/>' : '>'}`];
}

function svgInner(g: Gen, depth: number): string[] {
  const s = g.svg!; const paint = Object.entries(s.paint).map(([k, v]) => `${k}="${escAttr(v)}"`).join(' ');
  const props = Object.entries(s.props).map(([k, v]) => `${k}="${escAttr(v)}"`).join(' ');
  const tag = s.kind === 'path' ? 'path' : s.kind;
  return [`${ind(depth)}<svg viewBox="0 0 ${s.w} ${s.h}" width="100%" height="100%" preserveAspectRatio="none">`, `${ind(depth + 1)}<${tag} ${props} ${paint} />`, `${ind(depth)}</svg>`];
}

/* ---------- plain-markup targets (HTML / Svelte / Vue / Angular) ---------- */
function markup(g: Gen, depth: number, assets: AssetNames, cls?: Map<Gen, string>, project?:Project): string[] {
  const attrs: Attrs = { ...g.attrs };
  const extra: [string, string][] = [];
  if (cls) extra.push(['class', cls.get(g) || '']);
  if (g.node.type === 'image') {
    extra.push(['src', srcOf(g, assets)], ['alt', g.alt || '']);
    if(g.node.overlay){
      const wrapper:Attrs={...attrs,overflow:'hidden'};const imageAttrs:Attrs={};for(const k of ['object-fit','object-position','filter','backdrop-filter']){if(attrs[k]){imageAttrs[k]=attrs[k];delete wrapper[k];}}
      const head=open('div',cls?{}:wrapper,depth,cls?[['class',cls.get(g)||'']]:[]);const img=open('img',cls?{}:imageAttrs,depth+1,extra,' />');
      if(cls)return [...head,...img,`${ind(depth)}</div>`];
      const overlay:Attrs={position:'absolute',top:'0',left:'0',w:'100%',h:'100%',bg:g.node.overlay.color,opacity:String(g.node.overlay.opacity),'pointer-events':'none'};
      return [...head,...img,...open('div',overlay,depth+1,[], ' />'),`${ind(depth)}</div>`];
    }
    return open('img', cls ? {} : attrs, depth, extra, ' />');
  }
  if (g.node.type === 'input') {
    const f = g.node.field || { type: 'text', name: 'field' };
    extra.push(['name', f.name]); if (f.placeholder) extra.push(['placeholder', f.placeholder]);
    if (f.required) extra.push(['required', '']);
    if (f.type !== 'textarea' && f.type !== 'select' && f.type !== 'checkbox' && f.value) extra.push(['value', f.value]);
    if (f.type === 'checkbox') { extra.push(['type', 'checkbox']); if (f.value === 'true') extra.push(['checked', '']); }
    else if (f.type !== 'textarea' && f.type !== 'select') extra.push(['type', f.type]);
    if (f.type !== 'textarea' && f.type !== 'select') return open('input', cls ? {} : attrs, depth, extra, ' />');
    if (f.type === 'textarea') return [...open('textarea', cls ? {} : attrs, depth, extra), `${ind(depth + 1)}${esc(f.value || '')}`, `${ind(depth)}</textarea>`];
  }
  if (g.href&&(g.node.type==='button'||g.node.type==='text'||g.node.type==='heading')) extra.push(['href',pageHref(project,g.href)]);
  const name = g.href&&(g.node.type==='text'||g.node.type==='heading')?'a':g.tag;
  const a = cls ? {} : attrs;
  if (g.svg) return [...open(name, a, depth, extra), ...svgInner(g, depth + 1), `${ind(depth)}</${name}>`];
  const head = open(name, a, depth, extra);
  if (g.text !== undefined) return head.length === 1 ? [`${head[0]}${esc(g.text)}</${name}>`] : [...head, `${ind(depth + 1)}${esc(g.text)}`, `${ind(depth)}</${name}>`];
  if (!g.children.length) return head.length === 1 ? [`${head[0]}</${name}>`] : [...head, `${ind(depth)}</${name}>`];
  return [...head, ...g.children.flatMap(c => markup(c, depth + 1, assets, cls,project)), `${ind(depth)}</${name}>`];
}

/* ---------- React / React Native ---------- */
const COMP = (g: Gen) => (g.node.type === 'text' ? 'Txt' : g.node.type === 'heading' ? 'H2' : g.node.type === 'button' ? 'Btn' : 'Box');
function reactNode(g: Gen, depth: number, uses: Set<string>, assets: AssetNames, native: boolean, project?:Project): string[] {
  const name = COMP(g); uses.add(name);
  const a = g.attrs;
  if(g.node.type==='image'&&g.node.overlay&&!native){
    uses.add('Box');const wrapper:Attrs={...a,overflow:a.overflow||'hidden',position:a.position||'relative'};for(const k of ['object-fit','object-position','filter','backdrop-filter'])delete wrapper[k];
    const props=(attrs:Attrs,extra:string[]=[])=>([...Object.entries(attrs).map(([k,v])=>v===''?k:`${toProp(k)}="${escAttr(v)}"`),...extra]);
    const wrapperParts=props(wrapper);const imageParts=props(Object.fromEntries(Object.entries(a).filter(([k])=>['object-fit','object-position','filter','backdrop-filter'].includes(k))),[`as="img"`,`w="100%"`,`h="100%"`,`src="${escAttr(srcOf(g,assets))}"`,`alt="${escAttr(g.alt||'')}"`]);const o=g.node.overlay;
    return [`${ind(depth)}<Box${wrapperParts.length?` ${wrapperParts.join(' ')}`:''}>`,`${ind(depth+1)}<Box ${imageParts.join(' ')} />`,`${ind(depth+1)}<Box position="absolute" top="0" left="0" w="100%" h="100%" bg="${escAttr(o.color)}" opacity="${o.opacity}" pointerEvents="none" />`,`${ind(depth)}</Box>`];
  }
  const parts: string[] = [];
  if (!native) {
    if (g.node.type === 'image') parts.push('as="img"', `src="${escAttr(srcOf(g, assets))}"`, `alt="${escAttr(g.alt || '')}"`);
    else if (g.href&&(g.node.type==='button'||g.node.type==='text'||g.node.type==='heading')) parts.push('as="a"', `href="${escAttr(pageHref(project,g.href))}"`);
    else if (g.node.type === 'section' || g.node.type === 'page') parts.push(`as="${g.tag}"`);
    else if (g.node.type === 'form' || g.node.type === 'input') parts.push(`as="${g.tag}"`);
    else if ((g.node.type === 'text' || g.node.type === 'heading') && g.tag !== (g.node.type === 'heading' ? 'h2' : 'p')) parts.push(`as="${g.tag}"`);
  } else if (g.node.type === 'image') parts.push(`source={{ uri: "${escAttr(srcOf(g, assets))}" }}`);
  if (g.node.type === 'input' && !native) {
    const f = g.node.field || { type: 'text', name: 'field' };
    if (f.type !== 'textarea' && f.type !== 'select') parts.push(`type="${f.type}"`);
    parts.push(`name="${escAttr(f.name)}"`);
    if (f.placeholder) parts.push(`placeholder="${escAttr(f.placeholder)}"`);
    if (f.required) parts.push('required');
    if (f.type === 'checkbox') { if (f.value === 'true') parts.push('defaultChecked'); }
    else if (f.type === 'select') parts.push(`defaultValue="${escAttr(f.value || f.options?.[0] || '')}"`);
    else if (f.type !== 'textarea' && f.value) parts.push(`defaultValue="${escAttr(f.value)}"`);
  }
  Object.entries(a).forEach(([k, v]) => parts.push(v === '' ? k : `${toProp(k)}="${escAttr(v)}"`));
  const head = `${ind(depth)}<${name}`;
  const flat = `${head}${parts.length ? ` ${parts.join(' ')}` : ''}`;
  const openLines = flat.length <= 96 ? [flat] : [head, ...parts.map(p => `${ind(depth + 1)}${p}`)];
  const close = (self: boolean) => { openLines[openLines.length - 1] += self ? ' />' : '>'; return openLines; };
  if (g.svg) {
    const s = g.svg; const tag = s.kind; const props = Object.entries({ ...s.props, ...s.paint }).map(([k, v]) => `${toProp(k)}="${escAttr(v)}"`).join(' ');
    return [...close(false), `${ind(depth + 1)}<svg viewBox="0 0 ${s.w} ${s.h}" width="100%" height="100%" preserveAspectRatio="none">`, `${ind(depth + 2)}<${tag} ${props} />`, `${ind(depth + 1)}</svg>`, `${ind(depth)}</${name}>`];
  }
  if (g.node.type === 'image' || (g.node.type === 'input' && !['textarea','select'].includes(g.node.field?.type || 'text'))) return close(true);
  if (g.node.type === 'input' && g.node.field?.type === 'textarea') return [...close(false), `${ind(depth + 1)}${escJsx(g.node.field.value || '')}`, `${ind(depth)}</${name}>`];
  if (g.text !== undefined) return [...close(false), `${ind(depth + 1)}${escJsx(g.text)}`, `${ind(depth)}</${name}>`];
  if (!g.children.length) { const l = close(false); l[l.length - 1] += `</${name}>`; return l; }
  return [...close(false), ...g.children.flatMap(c => reactNode(c, depth + 1, uses, assets, native,project)), `${ind(depth)}</${name}>`];
}

export type CodeOut = { code: string; file: string; note?: string };

export function generate(project: Project, target: Target, assets: AssetNames = assetNamesFor(project), pageId?: string): CodeOut {
  const page = pageId ? project.pages.find(p => p.id === pageId) || activePage(project) : activePage(project);
  const root = buildGen(page.root, 'desktop', 'export', [], null, null, project);
  const note = TARGET_NOTE[target];
  const file = `${page.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'page'}.${TARGET_EXT[target]}`;

  if (target === 'JSON') return { code: JSON.stringify(project, (k, v) => (k === 'dataUrl' ? '[embedded asset]' : v), 2), file: `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'project'}.json`, note };
  if (target === 'CSS') return { code: cssFor(root), file: 'styles.css', note };

  const cls = new Map<Gen, string>(); indexGen(root).forEach(({ gen, cls: c }) => cls.set(gen, c));
  if (target === 'HTML') {
    const body = markup(root, 0, assets, undefined, project).join('\n');
    return {
      code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(page.name || project.name || 'AtomAttr page')}</title>
    <link rel="stylesheet" href="./defaults.css" />
    <script src="https://cdn.jsdelivr.net/npm/atomattr@1.0.1/dist/atomattr.min.js" defer></script>
  </head>
  <body>
${body}
  </body>
</html>
`,
      file,
      note: 'Standalone HTML page with the AtomAttr runtime loaded automatically.'
    };
  }
  if (target === 'Svelte') return { code: markup(root, 0, assets,undefined,project).map(l => l.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')).join('\n') + '\n', file, note };
  if (target === 'Vue') return { code: `<template>\n${markup(root, 1, assets,undefined,project).join('\n')}\n</template>\n`, file: `${file}`, note };
  if (target === 'Angular') {
    const body = markup(root, 3, assets,undefined,project).join('\n');
    return { code: `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-page',\n  standalone: true,\n  template: \`\n${body}\n  \`,\n})\nexport class PageComponent {}\n`, file, note };
  }
  const native = target === 'React Native';
  const uses = new Set<string>();
  const body = reactNode(root, 2, uses, assets, native,project).join('\n');
  const from = native ? 'atomattr/native' : 'atomattr/react';
  return { code: `import 'atomattr/defaults.css';\nimport { startAtomAttr } from 'atomattr';\nimport { ${[...uses].sort().join(', ')} } from '${from}';\n\nstartAtomAttr();\n\nexport default function Page() {\n  return (\n${body}\n  );\n}\n`, file, note };
}
export { markup as markupLines };
