import { behaviorAttrs, PREVIEW } from './behavior';
import { animAttrs } from './animations';
import type { Bp, Node } from './types';
import { BP_WIDTH, explicitStyle, isAbs, resolveNode, type Resolved } from './style';
import { assetNamesFor } from './asset-names';
import { isGradient } from './fx';

/**
 * One mapping from the document to AtomAttr attributes, used by BOTH the live canvas and every exporter.
 * Keys are kebab-case attribute names (`font-size`). The editor camel-cases them for React props.
 * Because the canvas renders from this same function, what you see is what the exported code does.
 */
export type Attrs = Record<string, string>;
export type Ctx = { parent: Node | null; parentResolved: Resolved | null; chain: Node[]; bp: Bp; editor?: boolean; inState?: boolean };
export type AttrProject = { tokens?: Array<{id:string;name:string;light:string;dark?:string}>; pageTheme?: 'light'|'dark'; activeState?: string; assets?: Array<{id:string;name:string;mime:string;dataUrl:string}>; collections?: import('./types').Collection[] };

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

/** Attributes that describe what a box is, not how it looks in a state. */
const STATE_SKIP = new Set(['id', 'class', 'href', 'target', 'rel', 'src', 'alt', 'type', 'name', 'value', 'placeholder', 'whitespace', 'position', 'z']);

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
    // A flow page (sections stacked in flex/grid) takes its height from its sections; only a free-positioned page keeps a fixed height.
    const flowPage = layout === 'flex' || layout === 'grid';
    if (typeof s.h === 'number' && !flowPage) out.h = px(s.h);
    // `clip` still cuts off spill but does not make the page a scroll container, so `position: sticky` bars keep working in exports.
    out.overflow = ctx.editor ? 'hidden' : 'clip';
  } else if (abs) {
    const explicitEdges = s.position !== undefined || s.inset !== undefined || s.top !== undefined || s.right !== undefined || s.bottom !== undefined || s.left !== undefined;
    if (s.position) out.position = s.position; else out.position = 'absolute';
    if (!explicitEdges) {
      const sx = sourceBp(node, 'x', ctx.bp); const sw = sourceBp(node, 'w', ctx.bp);
      const x = Number(s.x ?? 0);
      out.left = `${r2((x / refWidth(ctx.chain, sx)) * 100)}%`;
      out.top = px(Number(s.y ?? 0));
      if (typeof s.w === 'number') out.w = `${r2((s.w / refWidth(ctx.chain, sw)) * 100)}%`;
      else if (s.w === 'auto' || s.w === undefined) out.w = 'auto';
      if (typeof s.h === 'number') out.h = px(s.h);
    }
  } else {
    if (s.w === 'fill' || s.w === undefined) { out.w = '100%'; }
    else if (typeof s.w === 'number') { out.w = px(s.w); out['max-w'] = '100%'; }
    else if (['auto', 'fit-content', 'max-content', 'min-content'].includes(String(s.w))) {
      out.w = s.w === 'auto' && isText ? 'fit-content' : s.w;
      if (s.w === 'auto' || s.w === 'fit-content' || s.w === 'max-content' || s.w === 'min-content') out['max-w'] = '100%';
    }
    if (typeof s.h === 'number') out.h = px(s.h);
    else if (['fit-content', 'max-content', 'min-content'].includes(String(s.h))) out.h = String(s.h);
    if (node.type === 'section') { out.position = 'relative'; }
  }
  if (s.minW !== undefined) out['min-w'] = typeof s.minW === 'number' ? px(s.minW) : String(s.minW);
  if (s.maxW !== undefined) out['max-w'] = typeof s.maxW === 'number' ? px(s.maxW) : String(s.maxW);
  if (s.minH !== undefined) out['min-h'] = typeof s.minH === 'number' ? px(s.minH) : String(s.minH);
  if (s.maxH !== undefined) out['max-h'] = typeof s.maxH === 'number' ? px(s.maxH) : String(s.maxH);
  if (s.position && s.position !== 'static') out.position = s.position;
  if (s.overflow) out.overflow = s.overflow;
  if (s.inset !== undefined) out.inset = px(s.inset);
  else {
    if (s.top !== undefined) out.top = px(s.top);
    if (s.right !== undefined) out.right = px(s.right);
    if (s.bottom !== undefined) out.bottom = px(s.bottom);
    if (s.left !== undefined) out.left = px(s.left);
  }
  const hasDirectionalMargin = [s.mt, s.mr, s.mb, s.ml, s.marginT, s.marginR, s.marginB, s.marginL].some(v => v !== undefined);
  if (!hasDirectionalMargin) {
    if (s.m !== undefined) out.m = px(s.m);
    if (s.mx !== undefined) out.mx = px(s.mx);
    if (s.my !== undefined) out.my = px(s.my);
    if (s.mt !== undefined) out.mt = px(s.mt);
    if (s.mr !== undefined) out.mr = px(s.mr);
    if (s.mb !== undefined) out.mb = px(s.mb);
    if (s.ml !== undefined) out.ml = px(s.ml);
  }
  if (s.marginT !== undefined) out.mt = px(s.marginT);
  if (s.marginR !== undefined) out.mr = px(s.marginR);
  if (s.marginB !== undefined) out.mb = px(s.marginB);
  if (s.marginL !== undefined) out.ml = px(s.marginL);
  if (parent?.stacked) {
    if (((isText && (s.w === 'fill' || s.w === undefined)) || node.type === 'container' || node.type === 'form' || node.type === 'group' || (node.type === 'input' && node.field?.type !== 'checkbox' && node.field?.type !== 'radio'))) out.w = '100%';
    if ((node.type === 'container' || node.type === 'group') && layout !== 'free') delete out.h;
  }
  if (node.type === 'section' && typeof s.h === 'number' && s.minH === undefined) { delete out.h; out['min-h'] = px(s.h); if (layout === 'free') out.h = px(s.h); }
  if (typeof s.h === 'number' && layout === 'free' && node.type !== 'section') out.h = px(s.h);

  // Preserve document order. Flex/grid order must follow the layer tree so reordering
  // sections in the editor also changes the actual page order and exported markup.

  /* ---- container layout ---- */
  const hasDirectionalPad = [s.padT, s.padR, s.padB, s.padL].some(v => v !== undefined);
  if (layout === 'free') { out.position = out.position === 'absolute' ? 'absolute' : 'relative'; }
  if (layout === 'flex') {
    out.display = 'flex'; out[s.dir === 'row' ? 'flex-row' : 'flex-col'] = '';
    if (s.gap !== undefined) out.gap = px(s.gap);
    if (!hasDirectionalPad) {
      if (s.padX !== undefined) { out.px = px(s.padX); }
      if (s.padY !== undefined) { out.py = px(s.padY); }
    }
    if (s.wrap) out.wrap = '';
    if (s.items) out.items = s.items === 'stretch' ? 'stretch' : s.items;
    if (s.justify) out.justify = s.justify;
    if (s.grow !== undefined) out['flex-grow'] = String(s.grow);
    if (s.self) out.self = s.self;
    if (s.basis !== undefined) out['flex-basis'] = s.basis === 'fill' ? '0%' : s.basis === 'auto' ? 'auto' : px(s.basis);
    if (s.minW !== undefined) out['min-w'] = typeof s.minW === 'number' ? px(s.minW) : String(s.minW);
    if (s.maxW !== undefined) out['max-w'] = typeof s.maxW === 'number' ? px(s.maxW) : String(s.maxW);
    if (s.minH !== undefined) out['min-h'] = typeof s.minH === 'number' ? px(s.minH) : String(s.minH);
    if (s.maxH !== undefined) out['max-h'] = typeof s.maxH === 'number' ? px(s.maxH) : String(s.maxH);
    if (!out.position) out.position = 'relative';
  }
  if (layout === 'grid') {
    out.display = 'grid'; out['grid-cols'] = String(s.cols || 2);
    if (s.gap !== undefined) out.gap = px(s.gap);
    if (!out.position) out.position = 'relative';
  }
  if (!hasDirectionalPad) {
    if (s.pad !== undefined) out.p = px(s.pad);
    if (s.padX !== undefined) out.px = px(s.padX);
    if (s.padY !== undefined) out.py = px(s.padY);
  }
  if (s.padT !== undefined) out.pt = px(s.padT);
  if (s.padR !== undefined) out.pr = px(s.padR);
  if (s.padB !== undefined) out.pb = px(s.padB);
  if (s.padL !== undefined) out.pl = px(s.padL);
  if (node.type === 'group') out['pointer-events'] = ctx.editor ? 'auto' : 'auto';

  /* ---- appearance ---- */
  const svgDrawn = node.type === 'path' || (node.type === 'shape' && (node.shape === 'polygon' || node.shape === 'star'));
  const tokenValue=(id?:string)=>id?project?.tokens?.find(t=>t.id===id || t.name===id):undefined;
  const fillToken=tokenValue(node.style.fillToken); const strokeToken=tokenValue(node.style.strokeToken); const textToken=tokenValue(node.style.colorToken);
  const lightMode=project?.pageTheme!=='dark';
  const fillVal = fillToken ? (lightMode ? fillToken.light : fillToken.dark || fillToken.light) : s.fill;
  const fillGrad = !!fillVal && isGradient(fillVal);
  if (!svgDrawn && !fillGrad && (fillToken || colour(s.fill))) out.bg = fillVal!;
  if (!svgDrawn) {
    // Layers, top to bottom: tint, image, gradient. Images resolve to the embedded data on the canvas and to assets/ files in exports.
    const layers: string[] = []; const sizes: string[] = []; const poss: string[] = []; const reps: string[] = []; const atts: string[] = [];
    const asset = s.fillImg ? project?.assets?.find(a => a.id === s.fillImg) : undefined;
    if (asset) {
      const href = (ctx.editor || /^https?:/i.test(asset.dataUrl)) ? asset.dataUrl : (assetNamesFor({ assets: project!.assets! }).get(asset.id) || asset.name);
      if (s.bgTint) { layers.push(`linear-gradient(${s.bgTint}, ${s.bgTint})`); sizes.push('100% 100%'); poss.push('0% 0%'); reps.push('no-repeat'); atts.push('scroll'); }
      layers.push(`url(${href})`); sizes.push(s.bgSize || 'cover'); poss.push(s.bgPos || 'center'); reps.push(s.bgRepeat || 'no-repeat'); atts.push(s.bgFixed ? 'fixed' : 'scroll');
    }
    if (fillGrad) { layers.push(fillVal!); sizes.push('100% 100%'); poss.push('0% 0%'); reps.push('no-repeat'); atts.push('scroll'); }
    if (layers.length) {
      out['bg-image'] = layers.join(', ');
      if (asset) { out['bg-size'] = sizes.join(', '); out['bg-position'] = poss.join(', '); out['bg-repeat'] = reps.join(', '); if (s.bgFixed) out['bg-attachment'] = atts.join(', '); }
    }
  }
  const borderColor = strokeToken ? (lightMode ? strokeToken.light : strokeToken.dark || strokeToken.light) : s.stroke || 'currentColor';
  const hasDirectionalBorder = s.borderT !== undefined || s.borderR !== undefined || s.borderB !== undefined || s.borderL !== undefined || s.borderX !== undefined || s.borderY !== undefined;
  if (!svgDrawn && hasDirectionalBorder) {
    if (s.borderT !== undefined) out['border-t'] = `${r2(s.borderT)}px solid ${borderColor}`;
    if (s.borderR !== undefined) out['border-r'] = `${r2(s.borderR)}px solid ${borderColor}`;
    if (s.borderB !== undefined) out['border-b'] = `${r2(s.borderB)}px solid ${borderColor}`;
    if (s.borderL !== undefined) out['border-l'] = `${r2(s.borderL)}px solid ${borderColor}`;
    if (s.borderX !== undefined) { out['border-l'] = `${r2(s.borderX)}px solid ${borderColor}`; out['border-r'] = `${r2(s.borderX)}px solid ${borderColor}`; }
    if (s.borderY !== undefined) { out['border-t'] = `${r2(s.borderY)}px solid ${borderColor}`; out['border-b'] = `${r2(s.borderY)}px solid ${borderColor}`; }
  } else if (!svgDrawn && (strokeToken || (colour(s.stroke) && s.strokeWidth))) out.border = `${r2(s.strokeWidth || 1)}px solid ${borderColor}`;
  if (node.type === 'shape' && node.shape === 'ellipse') out.rounded = '50%';
  else if (!svgDrawn) {
    const allRadius = s.radius ?? 0;
    const tl = s.radiusTL ?? allRadius;
    const tr = s.radiusTR ?? allRadius;
    const br = s.radiusBR ?? allRadius;
    const bl = s.radiusBL ?? allRadius;
    if (allRadius || s.radiusTL !== undefined || s.radiusTR !== undefined || s.radiusBR !== undefined || s.radiusBL !== undefined) {
      if (tl === tr && tr === br && br === bl) out.rounded = px(tl);
      else {
        out['rounded-tl'] = px(tl); out['rounded-tr'] = px(tr); out['rounded-br'] = px(br); out['rounded-bl'] = px(bl);
      }
    }
  }
  if (s.shadow && s.shadow !== 'none') out.shadow = SHADOW[s.shadow];
  if (s.opacity !== undefined && s.opacity !== 1) out.opacity = String(r2(s.opacity));
  if (s.fade) out['mask-image'] = s.fade;
  if (s.blend && s.blend !== 'normal') out['mix-blend'] = s.blend;
  if (s.clipPath) out['clip-path'] = s.clipPath;
  if (s.shadowCss) { if (isText) out['text-shadow'] = s.shadowCss; else if (svgDrawn) out.filter = `drop-shadow(${s.shadowCss})`; else out.shadow = s.shadowCss; }
  if (s.blur) out.filter = `blur(${px(s.blur)})`;
  if (s.bgBlur) out['backdrop-filter'] = `blur(${px(s.bgBlur)})`;
  if (s.rotation) out.transform = `rotate(${r2(s.rotation)}deg)`;
  if (s.scale !== undefined && s.scale !== 1) out.scale = String(r2(s.scale));
  if (s.translateX) out['translate-x'] = px(s.translateX);
  if (s.translateY) out['translate-y'] = px(s.translateY);
  if (s.aspectRatio) out.aspect = s.aspectRatio.replace(/\s+/g, '');
  if (s.transition) { out.transition = 'all'; out.duration = String(Math.round(s.transition)); out.ease = s.ease || 'in-out'; }
  if (s.hidden || node.hidden) out.display = 'none';

  /* ---- type ---- */
  // Library controls take their accent from `color` (their rules use currentColor), including inputs and containers.
  if (node.attrs?.['data-ui'] && !isText && node.type !== 'button' && colour(s.color)) out.text = s.color!;
  if (isText || node.type === 'button') {
    if (s.fontSize) out['font-size'] = px(s.fontSize);
    if (textToken || colour(s.color)) out.text = textToken ? (lightMode ? textToken.light : textToken.dark || textToken.light) : s.color!;
    if (s.fontWeight) out['font-weight'] = String(s.fontWeight);
    if (s.font) out['font-family'] = s.font;
    if (s.align) out['text-align'] = s.align;
    if (s.lineHeight !== undefined) out['line-height'] = String(s.lineHeight);
    if (s.letterSpacing) out.tracking = px(s.letterSpacing);
    if (s.italic) out['font-style'] = 'italic';
    if (s.underline) out['text-decoration'] = 'underline';
    if (s.upper) out['text-transform'] = 'uppercase';
    if (s.textShadow) out['text-shadow'] = s.textShadow;
    if (s.clipText) {
      // Glyphs become a window onto the fill, gradient or image behind them.
      if (!out.bg && !out['bg-image']) out.bg = colour(s.color) ? s.color! : '#111827';
      out['bg-clip'] = 'text'; out.text = 'transparent';
    }
    /* Text resets the browser's default margin, but first, so the margins the user set (all sides, or any one) still win. */
    { const prev = { ...out }; for (const k of Object.keys(out)) delete out[k]; out.m = prev.m ?? '0'; Object.assign(out, prev); }
    if (isText) out.whitespace = 'pre-wrap';
  }
  if (node.type === 'button') { out.display = out.display === 'none' ? 'none' : 'flex'; out.items = 'center'; out.justify = s.align === 'left' ? 'start' : s.align === 'right' ? 'end' : 'center'; out.cursor = 'pointer'; out.border = out.border || '0'; }
  if (node.type === 'image') { out['object-fit'] = 'cover'; }
  if (node.type === 'input' && (node.field?.type === 'checkbox' || node.field?.type === 'radio')) { out.w = px(typeof s.w === 'number' ? s.w : 18); out.h = px(typeof s.h === 'number' && s.h <= 40 ? s.h : 18); }
  if (svgDrawn) out.display = out.display === 'none' ? 'none' : 'block';
  if (s.display && !(s.hidden || node.hidden)) out.display = s.display;
  // A menu button that only exists on phones: hidden from tablet width up, on the canvas and in the export alike.
  if (node.behavior?.mobileOnly && ctx.bp !== 'mobile') out.display = 'none';
  /* Any style property can differ in a state: build the box once with the state's changes laid over it and keep what changed,
     prefixed (hover-w, focus-bg, dark-text, active-translate-y ...). AtomAttr reads a state prefix on every attribute. */
  if (!ctx.inState && node.states) {
    for (const key of ['hover', 'focus', 'active', 'disabled', 'dark'] as const) {
      const patch = node.states[key]; if (!patch || !Object.keys(patch).length) continue;
      const over = (v?: Partial<import('./types').Style>) => ({ ...(v || {}), ...patch });
      const twin: Node = { ...node, states: undefined, style: over(node.style), bp: node.bp ? Object.fromEntries(Object.entries(node.bp).map(([k, v]) => [k, v ? over(v) : v])) as Node['bp'] : node.bp };
      const changed = attrsFor(twin, { ...ctx, inState: true }, project ? { ...project, activeState: undefined } : project);
      for (const [k, v] of Object.entries(changed)) if (out[k] !== v && !/^(hover|focus|active|disabled|dark|md|lg|sm)-/.test(k) && !STATE_SKIP.has(k)) out[`${key}-${k}`] = v;
    }
  }
  if(!out.transition&&['hover','focus','active'].some(k=>node.states?.[k as 'hover'])){out.transition='all';out.duration='200';out.ease='in-out';}
  if(node.attrs)for(const [k,v] of Object.entries(node.attrs))out[k]=v===true?'':String(v);
  if(node.behavior)Object.assign(out,behaviorAttrs(node.behavior));
  if(node.anim)Object.assign(out,animAttrs(node.anim,node.id,!!ctx.editor));
  // A full-screen dialog overlay would cover the whole canvas while editing, so in the editor it stays in the page flow.
  if(node.behavior?.modal&&ctx.editor&&!PREVIEW.on&&out.position==='fixed'){out.position='relative';for(const k of ['inset','top','right','bottom','left'])delete out[k];}
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
    case 'max-w': return 'none'; case 'min-h': return '0';
    case 'bg-image': case 'mask-image': case 'clip-path': case 'filter': case 'backdrop-filter': case 'text-shadow': case 'text-decoration': return 'none';
    case 'mix-blend': return 'normal'; case 'bg-clip': return 'border-box'; case 'font-style': return 'normal'; case 'text-transform': return 'none'; case 'shadow': return 'none';
    default: return 'initial';
  }
}

/** AtomAttr names become camelCase props; `data-*` and `aria-*` stay hyphenated because JSX and the DOM expect them that way. */
export const toProp = (key: string) => (/^(data|aria)-/.test(key) ? key : key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));
export const toReactProps = (a: Attrs) => Object.fromEntries(Object.entries(a).map(([k, v]) => (v === '' ? [k, true] : [toProp(k), v])));
