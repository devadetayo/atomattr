import type { Node } from './types';
import { uid } from './tree';

const number = (value: string | null, fallback = 0) => { const parsed = Number.parseFloat(value || ''); return Number.isFinite(parsed) ? parsed : fallback; };
const pairList = (value: string) => value.trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
const inherited = (el: Element, key: string, fallback: string) => {
  let current: Element | null = el;
  while (current) { const value = current.getAttribute(key); if (value) return value; current = current.parentElement; }
  return fallback;
};

/** Imports common flat SVG artwork as editable vector path nodes. Script/style/foreign elements are ignored. */
export function importSvg(source: string, label = 'Imported SVG'): Node {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.localName !== 'svg' || doc.querySelector('parsererror')) throw new Error('Choose a valid SVG file.');
  const view = pairList(svg.getAttribute('viewBox') || '');
  const width = Math.max(1, view.length === 4 ? view[2] : number(svg.getAttribute('width'), 100));
  const height = Math.max(1, view.length === 4 ? view[3] : number(svg.getAttribute('height'), 100));
  const x0 = view.length === 4 ? view[0] : 0; const y0 = view.length === 4 ? view[1] : 0;
  const pathNodes: Node[] = [];
  const add = (el: Element, d: string) => {
    if (!d.trim()) return;
    const fill = inherited(el, 'fill', '#111827'); const stroke = inherited(el, 'stroke', 'none'); const sw = number(inherited(el, 'stroke-width', '1'), 1);
    pathNodes.push({ id: uid(), type: 'path', name: el.getAttribute('id') || `${el.localName} ${pathNodes.length + 1}`, style: { mode: 'abs', x: 0, y: 0, w: width, h: height, fill, stroke: stroke === 'none' ? undefined : stroke, strokeWidth: stroke === 'none' ? 0 : sw }, svgD: d, svgTransform: x0||y0?`translate(${-x0} ${-y0})`:undefined, pts: [], closed: false, vw: width, vh: height });
  };
  for (const el of Array.from(svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line'))) {
    const tag = el.localName; let d = '';
    if (tag === 'path') d = el.getAttribute('d') || '';
    else if (tag === 'rect') { const x=number(el.getAttribute('x'))-x0,y=number(el.getAttribute('y'))-y0,w=number(el.getAttribute('width')),h=number(el.getAttribute('height')); if(w>0&&h>0)d=`M${x} ${y} H${x+w} V${y+h} H${x} Z`; }
    else if (tag === 'circle' || tag === 'ellipse') { const cx=number(el.getAttribute('cx'))-x0,cy=number(el.getAttribute('cy'))-y0,rx=tag==='circle'?number(el.getAttribute('r')):number(el.getAttribute('rx')),ry=tag==='circle'?rx:number(el.getAttribute('ry')); if(rx>0&&ry>0)d=`M${cx-rx} ${cy} A${rx} ${ry} 0 1 0 ${cx+rx} ${cy} A${rx} ${ry} 0 1 0 ${cx-rx} ${cy} Z`; }
    else if (tag === 'polygon' || tag === 'polyline') { const pts=pairList(el.getAttribute('points')||''); if(pts.length>=4){d=`M${pts[0]-x0} ${pts[1]-y0}`;for(let i=2;i<pts.length;i+=2)d+=` L${pts[i]-x0} ${pts[i+1]-y0}`;if(tag==='polygon')d+=' Z';} }
    else if (tag === 'line') d=`M${number(el.getAttribute('x1'))-x0} ${number(el.getAttribute('y1'))-y0} L${number(el.getAttribute('x2'))-x0} ${number(el.getAttribute('y2'))-y0}`;
    add(el,d);
  }
  if (!pathNodes.length) throw new Error('This SVG has no supported vector shapes.');
  return { id: uid(), type: 'group', name: label.replace(/\.svg$/i, '') || 'Imported SVG', style: { x: 80, y: 80, w: width, h: height, layout: 'free' }, children: pathNodes, vw: width, vh: height };
}
