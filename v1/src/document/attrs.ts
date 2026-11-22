import type { Bp, Node } from './types';
import { BP_WIDTH, explicitStyle, isAbs, resolveNode, type Resolved } from './style';

/**
 * One mapping from the document to AtomAttr attributes, used by BOTH the live canvas and every exporter.
 * Keys are kebab-case attribute names (`font-size`). The editor camel-cases them for React props.
 * Because the canvas renders from this same function, what you see is what the exported code does.
 */
export type Attrs = Record<string, string>;
export type Ctx = { parent: Node | null; parentResolved: Resolved | null; chain: Node[]; bp: Bp; editor?: boolean };
export type AttrProject = { tokens?: Array<{id:string;name:string;light:string;dark?:string}>; pageTheme?: 'light'|'dark'; activeState?: string };

const r2 = (n: number) => Math.round(n * 100) / 100;
const px = (n: number) => `${r2(n)}px`;
const colour = (v?: string) => !!v && v !== 'none' && v !== 'transparent';
const SHADOW = { sm: 'sm', md: 'md', lg: 'lg' } as const;

/** Width of the coordinate space a free child's x/w were authored in, at the breakpoint the value came from. */
export function refWidth(chain: Node[], source: Bp): number {
  let ref = BP_WIDTH[source];
  for (const ancestor of chain) {
    if (ancestor.type === 'page') continue;
    const w = explicitStyle(ancestor, source).w;
    if (typeof w === 'number') ref = w;
  }
  return ref;
}
/** Which breakpoint a geometry value is authored at, so percentages use the right reference width. */
export function sourceBp(node: Node, key: 'x' | 'w', bp: Bp): Bp {
  if (bp === 'mobile' && node.bp?.mobile && key in node.bp.mobile) return 'mobile';
  if (bp !== 'desktop' && node.bp?.tablet && key in node.bp.tablet) return 'tablet';
  if (bp === 'mobile' && node.bp?.tablet && key in node.bp.tablet) return 'tablet';
  return 'desktop';
}

export function attrsFor(node: Node, ctx: Ctx, project?: AttrProject): Attrs {
  const resolved=resolveNode(node,ctx.bp);const active=project?.activeState as keyof NonNullable<Node['states']>|undefined;const s={...resolved.s,...(active?node.states?.[active]:{})};const layout=resolved.layout;
  const out: Attrs = {};
  const parent = ctx.parentResolved;
  const abs = !!parent && isAbs(node, parent.layout, parent.stacked);
  const isText = node.type === 'text' || node.type === 'heading';

  /* ---- geometry ---- */
  if (node.type === 'page') {
    // A page is a finite artboard. Its outer canvas frame is editor-only; the
    // exported root keeps the document dimensions and clips pasteboard spill.
    out.w = '100%'; out.position = 'relative';
    if (typeof s.h === 'number') out.h = px(s.h);
    out.overflow = 'hidden';
  } else if (abs) {
    out.position = 'absolute';
    const sx = sourceBp(node, 'x', ctx.bp); const sw = sourceBp(node, 'w', ctx.bp);
    const x = Number(s.x ?? 0);
    out.left = `${r2((x / refWidth(ctx.chain, sx)) * 100)}%`;
    out.top = px(Number(s.y ?? 0));
    if (typeof s.w === 'number') out.w = `${r2((s.w / refWidth(ctx.chain, sw)) * 100)}%`;
    else if (s.w === 'auto' || s.w === undefined) out.w = 'auto';
    if (typeof s.h === 'number') out.h = px(s.h);
  } else {
    if (s.w === 'fill' || s.w === undefined) { out.w = '100%'; }
    else if (typeof s.w === 'number') { out.w = px(s.w); out['max-w'] = '100%'; }
    if (typeof s.h === 'number') out.h = px(s.h);
    if (node.type === 'section') { out.position = 'relative'; }
  }
  if (parent?.stacked) {
    if (isText || node.type === 'container' || node.type === 'form' || node.type === 'group' || (node.type === 'input' && node.field?.type !== 'checkbox')) out.w = '100%';
    if ((node.type === 'container' || node.type === 'group') && layout !== 'free') delete out.h;
  }
  if (node.type === 'section' && typeof s.h === 'number') { delete out.h; out['min-h'] = px(s.h); if (layout === 'free') out.h = px(s.h); }
  if (typeof s.h === 'number' && layout === 'free' && node.type !== 'section') out.h = px(s.h);

  if (parent && parent.stacked && ctx.parent) {
    // Stacked sections read top-to-bottom, left-to-right regardless of z-order in the document.
    const textual = (n: Node) => (n.type === 'shape' || n.type === 'path' ? 1 : 0); // decorative art follows the copy
    const sorted = [...(ctx.parent.children || [])].sort((a, b) => (textual(a) - textual(b)) || (Number(a.style.y ?? 0) - Number(b.style.y ?? 0)) || (Number(a.style.x ?? 0) - Number(b.style.x ?? 0)));
    out.order = String(sorted.findIndex(c => c.id === node.id));
  }

  /* ---- container layout ---- */
  if (node.type !== 'text' && node.type !== 'heading' && node.type !== 'button' && node.type !== 'input' && node.type !== 'image' && node.type !== 'shape' && node.type !== 'path') {
    if (layout === 'free') { out.position = out.position === 'absolute' ? 'absolute' : 'relative'; }
    if (layout === 'flex') {
      out.display = 'flex'; out[s.dir === 'row' ? 'flex-row' : 'flex-col'] = '';
      if (s.gap !== undefined) out.gap = px(s.gap);
      if (s.padX !== undefined) { out.px = px(s.padX); }
      if (s.padY !== undefined) { out.py = px(s.padY); }
      if (s.wrap) out.wrap = '';
      if (s.items) out.items = s.items === 'stretch' ? 'stretch' : s.items;
      if (s.justify) out.justify = s.justify;
      if (s.grow !== undefined) out['flex-grow'] = String(s.grow);
      if (s.self) out.self = s.self;
      if (s.basis !== undefined) out['flex-basis'] = s.basis === 'fill' ? '0%' : s.basis === 'auto' ? 'auto' : px(s.basis);
      if (s.minW !== undefined) out['min-w'] = px(s.minW);
      if (s.maxW !== undefined) out['max-w'] = px(s.maxW);
      if (s.minH !== undefined) out['min-h'] = px(s.minH);
      if (!out.position) out.position = 'relative';
    }
    if (layout === 'grid') {
      out.display = 'grid'; out['grid-cols'] = String(s.cols || 2);
      if (s.gap !== undefined) out.gap = px(s.gap);
      if (!out.position) out.position = 'relative';
    }
    if (s.pad) out.p = px(s.pad);
    if (s.padX !== undefined) out.px = px(s.padX);
    if (s.padY !== undefined) out.py = px(s.padY);
    if (node.type === 'group') out['pointer-events'] = ctx.editor ? 'auto' : 'auto';
  }

  /* ---- appearance ---- */
  const svgDrawn = node.type === 'path' || (node.type === 'shape' && (node.shape === 'polygon' || node.shape === 'star'));
  const tokenValue=(id?:string)=>id?project?.tokens?.find(t=>t.id===id || t.name===id):undefined;
  const fillToken=tokenValue(node.style.fillToken); const strokeToken=tokenValue(node.style.strokeToken); const textToken=tokenValue(node.style.colorToken);
  const lightMode=project?.pageTheme!=='dark';
  if (!svgDrawn && (fillToken || colour(s.fill))) out.bg = fillToken ? (lightMode ? fillToken.light : fillToken.dark || fillToken.light) : s.fill!;
  if (!svgDrawn && (strokeToken || (colour(s.stroke) && s.strokeWidth))) out.border = `${r2(s.strokeWidth || 1)}px solid ${strokeToken ? (lightMode ? strokeToken.light : strokeToken.dark || strokeToken.light) : s.stroke}`;
  if (node.type === 'shape' && node.shape === 'ellipse') out.rounded = '50%';
  else if (!svgDrawn && s.radius) out.rounded = px(s.radius);
  if (s.shadow && s.shadow !== 'none') out.shadow = SHADOW[s.shadow];
  if (s.opacity !== undefined && s.opacity !== 1) out.opacity = String(r2(s.opacity));
  if (s.rotation) out.transform = `rotate(${r2(s.rotation)}deg)`;
  if (s.hidden || node.hidden) out.display = 'none';

  /* ---- type ---- */
  if (isText || node.type === 'button') {
    if (s.fontSize) out['font-size'] = px(s.fontSize);
    if (textToken || colour(s.color)) out.text = textToken ? (lightMode ? textToken.light : textToken.dark || textToken.light) : s.color!;
    if (s.fontWeight) out['font-weight'] = String(s.fontWeight);
    if (s.font) out['font-family'] = s.font;
    if (s.align) out['text-align'] = s.align;
    if (s.lineHeight) out.leading = String(s.lineHeight);
    if (s.letterSpacing) out.tracking = px(s.letterSpacing);
    out.m = '0';
    if (isText) out.whitespace = 'pre-wrap';
  }
  if (node.type === 'button') { out.display = out.display === 'none' ? 'none' : 'flex'; out.items = 'center'; out.justify = s.align === 'left' ? 'start' : s.align === 'right' ? 'end' : 'center'; out.cursor = 'pointer'; out.border = out.border || '0'; }
  if (node.type === 'image') { out['object-fit'] = 'cover'; }
  if (node.type === 'input' && node.field?.type === 'checkbox') { out.w = '18px'; out.h = '18px'; }
  if (svgDrawn) out.display = out.display === 'none' ? 'none' : 'block';
  const stateAttrs=(state:string,patch?:Partial<import('./types').Style>)=>{
    if(!patch)return;const prefix=state==='active'?'active':state==='disabled'?'disabled':state;
    if(patch.fill)out[`${prefix}-bg`]=patch.fill;if(patch.color)out[`${prefix}-text`]=patch.color;if(patch.stroke&&patch.strokeWidth)out[`${prefix}-border`]=`${px(patch.strokeWidth)} solid ${patch.stroke}`;
    if(patch.radius!==undefined)out[`${prefix}-rounded`]=px(patch.radius);if(patch.shadow&&patch.shadow!=='none')out[`${prefix}-shadow`]=SHADOW[patch.shadow];if(patch.opacity!==undefined)out[`${prefix}-opacity`]=String(patch.opacity);
  };
  for(const key of ['hover','focus','active','disabled','dark'] as const)stateAttrs(key,node.states?.[key]);
  if(node.attrs)for(const [k,v] of Object.entries(node.attrs))out[k]=v===true?'':String(v);
  return out;
}

/** Mobile-first diff for the AtomAttr export: base = mobile, `md-` = tablet changes, `lg-` = desktop changes. */
export function responsiveAttrs(node: Node, chainFor: (bp: Bp) => Ctx, project?: AttrProject): Attrs {
  const m = attrsFor(node, chainFor('mobile'), project);
  const t = attrsFor(node, chainFor('tablet'), project);
  const d = attrsFor(node, chainFor('desktop'), project);
  const out: Attrs = { ...m };
  const diff = (from: Attrs, to: Attrs, prefix: string) => {
    for (const k of Object.keys(to)) if (from[k] !== to[k]) out[`${prefix}${k}`] = to[k];
    for (const k of Object.keys(from)) if (!(k in to) && !BARE.has(k)) out[`${prefix}${k}`] = k === 'display' ? 'block' : initial(k);
  };
  diff(m, t, 'md-');
  diff({ ...m, ...t }, d, 'lg-');
  const token=(id?:string)=>id?project?.tokens?.find(x=>x.id===id||x.name===id):undefined;
  const pairs:[string,string][]=[['fillToken','bg'],['strokeToken','border'],['colorToken','text']];
  for(const [key,attr] of pairs){const tok=token(node.style[key as keyof Node['style']] as string|undefined);if(tok?.dark){const base=key==='strokeToken'?`${r2(node.style.strokeWidth||1)}px solid ${tok.light}`:tok.light;const dark=key==='strokeToken'?`${r2(node.style.strokeWidth||1)}px solid ${tok.dark}`:tok.dark;out[attr]=base;out[`dark-${attr}`]=dark;}}
  return out;
}
const BARE = new Set(['flex-col', 'flex-row', 'wrap']);
/** Neutral value that removes an attribute at a larger breakpoint. */
function initial(key: string): string {
  switch (key) {
    case 'position': return 'static'; case 'left': case 'top': return 'auto'; case 'w': case 'h': return 'auto';
    case 'p': case 'gap': case 'm': case 'order': return '0'; case 'opacity': return '1'; case 'transform': return 'none';
    case 'max-w': return 'none'; case 'min-h': return '0'; default: return 'initial';
  }
}

export const toProp = (key: string) => key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
export const toReactProps = (a: Attrs) => Object.fromEntries(Object.entries(a).map(([k, v]) => (v === '' ? [k, true] : [toProp(k), v])));
