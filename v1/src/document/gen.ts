import type { Bp, Node, PathPoint } from './types';
import { attrsFor, responsiveAttrs, type Attrs, type Ctx } from './attrs';
import { resolveNode, type Resolved } from './style';

const r2 = (n: number) => Math.round(n * 100) / 100;

/** SVG path data from editable Bézier points. Handles are stored relative to their anchor. */
export function pathD(pts: PathPoint[], closed: boolean): string {
  if (!pts.length) return '';
  let d = `M${r2(pts[0].x)} ${r2(pts[0].y)}`;
  const seg = (a: PathPoint, b: PathPoint) => {
    const c1 = a.hx2 !== undefined || a.hy2 !== undefined; const c2 = b.hx1 !== undefined || b.hy1 !== undefined;
    if (!c1 && !c2) return ` L${r2(b.x)} ${r2(b.y)}`;
    return ` C${r2(a.x + (a.hx2 ?? 0))} ${r2(a.y + (a.hy2 ?? 0))} ${r2(b.x + (b.hx1 ?? 0))} ${r2(b.y + (b.hy1 ?? 0))} ${r2(b.x)} ${r2(b.y)}`;
  };
  for (let i = 1; i < pts.length; i += 1) d += seg(pts[i - 1], pts[i]);
  if (closed) d += `${seg(pts[pts.length - 1], pts[0])} Z`;
  return d;
}

export function polygonPoints(w: number, h: number, count: number, star: boolean, inner: number): string {
  const n = star ? Math.max(3, count) * 2 : Math.max(3, count);
  return Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2; const k = star && i % 2 ? inner : 1;
    return `${r2(w / 2 + Math.cos(a) * k * (w / 2))},${r2(h / 2 + Math.sin(a) * k * (h / 2))}`;
  }).join(' ');
}

export type Svg = { w: number; h: number; kind: 'rect' | 'ellipse' | 'polygon' | 'path'; props: Attrs; paint: Attrs };
export type Gen = {
  id: string; node: Node; tag: string; attrs: Attrs; text?: string; svg?: Svg; src?: string; alt?: string; href?: string;
  children: Gen[]; hidden: boolean;
};

const TAGS: Record<string, string> = { page: 'main', section: 'section', container: 'div', form: 'form', group: 'div', text: 'p', heading: 'h2', button: 'a', input: 'input', image: 'img', shape: 'div', path: 'div' };

/** Parse ordinary comma separated text, including quoted commas and escaped quotes. */
export function parseCsv(csv: string): Array<Record<string, string>> {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const ch = csv[i];
    if (ch === '"' && quoted && csv[i + 1] === '"') { cell += '"'; i += 1; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) { if (ch === '\r' && csv[i + 1] === '\n') i += 1; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map(h => h.trim());
  return rows.filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

const bind = (value: string | undefined, row: Record<string, string>) => value?.replace(/\\?\{\{\s*([^{}]+?)\s*\}\\?/g, (match, key: string) => {
  const rawKey = key.trim(); return Object.prototype.hasOwnProperty.call(row, rawKey) ? row[rawKey] : match;
});
function bindNode(node: Node, row: Record<string, string>, prefix: string): Node {
  const src = bind(node.src, row);
  return { ...node, id: `${prefix}-${node.id}`, text: bind(node.text, row), href: bind(node.href, row), src, assetId: node.src?.includes('{{') ? undefined : node.assetId, alt: bind(node.alt, row), children: node.children?.map(child => bindNode(child, row, prefix)) };
}

function svgOf(node: Node, s: Resolved['s'], project?: import('./attrs').AttrProject): Svg | undefined {
  if (node.type !== 'path' && !(node.type === 'shape' && (node.shape === 'polygon' || node.shape === 'star'))) return undefined;
  const w = typeof s.w === 'number' ? s.w : node.vw || 100; const h = typeof s.h === 'number' ? s.h : node.vh || 100;
  const token=(id?:string)=>id?project?.tokens?.find(t=>t.id===id):undefined;const fillToken=token(node.style.fillToken);const strokeToken=token(node.style.strokeToken);
  const fillValue=fillToken?(project?.pageTheme==='dark'?(fillToken.dark||fillToken.light):fillToken.light):s.fill;const strokeValue=strokeToken?(project?.pageTheme==='dark'?(strokeToken.dark||strokeToken.light):strokeToken.light):s.stroke;
  const fill = fillValue && fillValue !== 'none' ? fillValue : 'none';
  const paint: Attrs = { fill };
  if (strokeValue && s.strokeWidth) { paint.stroke = strokeValue; paint['stroke-width'] = String(s.strokeWidth); paint['stroke-linecap'] = 'round'; paint['stroke-linejoin'] = 'round'; }
  if (node.type === 'path') {
    const sx = (node.vw || w) ? w / (node.vw || w) : 1; const sy = (node.vh || h) ? h / (node.vh || h) : 1;
    const pts = (node.pts || []).map(p => ({ x: p.x * sx, y: p.y * sy, hx1: p.hx1 === undefined ? undefined : p.hx1 * sx, hy1: p.hy1 === undefined ? undefined : p.hy1 * sy, hx2: p.hx2 === undefined ? undefined : p.hx2 * sx, hy2: p.hy2 === undefined ? undefined : p.hy2 * sy }));
    return { w, h, kind: 'path', props: { d: node.svgD || pathD(pts, !!node.closed), ...(node.svgTransform?{transform:node.svgTransform}:{}) }, paint };
  }
  if (node.shape === 'ellipse') return { w, h, kind: 'ellipse', props: { cx: String(r2(w / 2)), cy: String(r2(h / 2)), rx: String(r2(w / 2)), ry: String(r2(h / 2)) }, paint };
  if (node.shape === 'polygon' || node.shape === 'star') return { w, h, kind: 'polygon', props: { points: polygonPoints(w, h, node.points || (node.shape === 'star' ? 5 : 6), node.shape === 'star', node.inner ?? 0.5) }, paint };
  const rx = Math.min(s.radius || 0, w / 2, h / 2);
  return { w, h, kind: 'rect', props: { x: '0', y: '0', width: String(r2(w)), height: String(r2(h)), ...(rx ? { rx: String(r2(rx)) } : {}) }, paint };
}

/** Build the neutral render tree. `editor` mode renders one breakpoint; `export` mode computes responsive attrs. */
export function buildGen(node: Node, bp: Bp, mode: 'editor' | 'export', chain: Node[] = [], parentResolved: Resolved | null = null, parent: Node | null = null, project?: import('./attrs').AttrProject): Gen {
  const ctxFor = (b: Bp): Ctx => ({ parent, parentResolved: parentResolved ? resolveNode(parent!, b) : null, chain, bp: b, editor: mode === 'editor' });
  const resolved = resolveNode(node, bp);
  const attrs = mode === 'export' ? responsiveAttrs(node, ctxFor, project) : attrsFor(node, ctxFor(bp), project);
  const childChain = [...chain, node];
  const rows = node.repeat ? (node.repeat.rows?.length ? node.repeat.rows : parseCsv(node.repeat.csv)) : [];
  const sourceChildren = node.repeat ? (node.children?.[0] ? rows.map((row, i) => bindNode(node.children![0], row, `${node.id}-row${i + 1}`)) : []) : node.children || [];
  const children = sourceChildren.flatMap(child => {
    if (child.type === 'input' && child.field?.type === 'select') {
      const selectChildren = (child.field.options || []).map((label, i): Node => ({ id: `${child.id}-option${i}`, type: 'text', name: 'Option', tag: 'option', text: label, style: { mode: 'flow', w: 'fill' }, attrs: child.field?.value === label ? { value: label, selected: true } : { value: label } }));
      return [buildGen({ ...child, children: selectChildren }, bp, mode, childChain, resolved, node, project)];
    }
    return [buildGen(child, bp, mode, childChain, resolved, node, project)];
  });
  let tag = node.tag || TAGS[node.type];
  if (node.type === 'button' && !node.href) tag = 'button';
  if (node.type === 'heading') tag = node.tag || 'h2';
  if (node.type === 'input') tag = node.field?.type === 'textarea' ? 'textarea' : node.field?.type === 'select' ? 'select' : 'input';
  return {
    id: node.id, node, tag, attrs, children, hidden: !!node.hidden || !!resolved.s.hidden,
    text: node.type === 'text' || node.type === 'heading' || node.type === 'button' ? node.text ?? '' : undefined,
    svg: svgOf(node, resolved.s,project), src: node.src, alt: node.alt, href: node.href,
  };
}
