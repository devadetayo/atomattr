import type { Gen } from '../document/gen';
import type { Attrs } from '../document/attrs';

/**
 * Plain-CSS rendering of the same attribute map. This is what the ZIP site and the CSS tab use, so exported
 * pages work without the AtomAttr runtime. Mobile-first: base rules, then `min-width: 768px`, then `1024px`.
 */
const SHADOWS: Record<string, string> = { sm: '0 1px 3px rgba(0,0,0,.18)', md: '0 4px 12px rgba(0,0,0,.18)', lg: '0 12px 32px rgba(0,0,0,.22)' };
const JUSTIFY: Record<string, string> = { start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between' };
const ITEMS: Record<string, string> = { start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch' };

function decl(key: string, v: string): string[] {
  switch (key) {
    case 'w': return [`width:${v}`]; case 'h': return [`height:${v}`]; case 'min-w': return [`min-width:${v}`]; case 'max-w': return [`max-width:${v}`]; case 'min-h': return [`min-height:${v}`]; case 'max-h': return [`max-height:${v}`];
    case 'flex-col': return ['flex-direction:column']; case 'flex-row': return ['flex-direction:row']; case 'wrap': return ['flex-wrap:wrap'];
    case 'order': case 'left': case 'top': case 'position': case 'display': case 'gap': case 'opacity': case 'transform': case 'cursor': case 'overflow': return [`${key}:${v}`];
    case 'leading':
    case 'line-height': return [`line-height:${v}`];
    case 'tracking':
    case 'letter-spacing': return [`letter-spacing:${v}`];
    case 'whitespace': return [`white-space:${v}`];
    case 'flex-direction': case 'flex-wrap': case 'text-align': case 'font-weight': case 'font-size': case 'object-fit': case 'object-position': case 'filter': case 'backdrop-filter': case 'pointer-events': return [`${key}:${v}`];
    case 'items': return [`align-items:${ITEMS[v] || v}`];
    case 'justify': return [`justify-content:${JUSTIFY[v] || v}`];
    case 'grid-cols': return [`grid-template-columns:repeat(${v},minmax(0,1fr))`];
    case 'p': return [`padding:${v}`]; case 'px': return [`padding-left:${v}`, `padding-right:${v}`]; case 'py': return [`padding-top:${v}`, `padding-bottom:${v}`];
    case 'pt': return [`padding-top:${v}`]; case 'pr': return [`padding-right:${v}`]; case 'pb': return [`padding-bottom:${v}`]; case 'pl': return [`padding-left:${v}`];
    case 'm': return [`margin:${v}`]; case 'mx': return [`margin-left:${v}`, `margin-right:${v}`]; case 'my': return [`margin-top:${v}`, `margin-bottom:${v}`]; case 'mt': return [`margin-top:${v}`]; case 'mr': return [`margin-right:${v}`]; case 'mb': return [`margin-bottom:${v}`]; case 'ml': return [`margin-left:${v}`];
    case 'bg': return [`background-color:${v}`]; case 'text': return [`color:${v}`];
    case 'bg-image': return [`background-image:${v}`]; case 'bg-size': return [`background-size:${v}`]; case 'bg-position': return [`background-position:${v}`];
    case 'bg-repeat': return [`background-repeat:${v}`]; case 'bg-attachment': return [`background-attachment:${v}`];
    case 'bg-clip': return [`-webkit-background-clip:${v}`, `background-clip:${v}`];
    case 'line-height': return [`line-height:${v}`];
    case 'mix-blend': return [`mix-blend-mode:${v}`];
    case 'clip-path': return [`-webkit-clip-path:${v}`, `clip-path:${v}`];
    case 'mask-image': return [`-webkit-mask-image:${v}`, `mask-image:${v}`];
    case 'text-shadow': case 'font-style': case 'text-transform': case 'text-decoration': case 'font-family': return [`${key}:${v}`];
    case 'border': return [`border:${v}`]; case 'rounded': return [`border-radius:${v}`]; case 'rounded-tl': return [`border-top-left-radius:${v}`]; case 'rounded-tr': return [`border-top-right-radius:${v}`]; case 'rounded-br': return [`border-bottom-right-radius:${v}`]; case 'rounded-bl': return [`border-bottom-left-radius:${v}`];
    case 'shadow': return [`box-shadow:${SHADOWS[v] || v}`];
    case 'flex-grow': return [`flex-grow:${v}`]; case 'flex-basis': return [`flex-basis:${v}`];
    case 'self': return [`align-self:${ITEMS[v] || v}`];
    case 'inset': return [`inset:${v}`]; case 'right': case 'bottom': return [`${key}:${v}`]; case 'z': return [`z-index:${v}`];
    case 'aspect': return [`aspect-ratio:${v}`];
    case 'scale': return [`scale:${v}`]; case 'rotate': return [`rotate:${v}`];
    case 'border-t': return [`border-top:${v}`]; case 'border-b': return [`border-bottom:${v}`]; case 'border-l': return [`border-left:${v}`]; case 'border-r': return [`border-right:${v}`];
    case 'border-color': return [`border-color:${v}`];
    case 'bg-blend': return [`background-blend-mode:${v}`];
    case 'text-overflow': case 'visibility': case 'transform-origin': case 'object-position': case 'will-change': case 'user-select': return [`${key}:${v}`];
    case 'animate': return [`animation:${v}`];
    case 'truncate': return ['overflow:hidden', 'text-overflow:ellipsis', 'white-space:nowrap'];
    default: return [];
  }
}
const EASE: Record<string, string> = { linear: 'linear', in: 'ease-in', out: 'ease-out', 'in-out': 'ease-in-out' };
const STATE_RE = /^(hover|focus|active|disabled|dark)-(.+)$/;
const stateSel = (sel: string, state: string) => (state === '' ? sel : state === 'dark' ? `html.dark ${sel}` : `${sel}:${state}`);

/** Declarations for one selector/state: the per-key table plus the few properties that combine several attributes. */
function declsFor(entries: [string, string][]): string[] {
  const map = new Map(entries); const out: string[] = [];
  for (const [k, v] of entries) { if (k === 'transition' || k === 'duration' || k === 'ease' || k === 'translate-x' || k === 'translate-y') continue; out.push(...decl(k, v)); }
  if (map.has('translate-x') || map.has('translate-y')) out.push(`translate:${map.get('translate-x') || '0px'} ${map.get('translate-y') || '0px'}`);
  if (map.has('transition')) out.push(`transition:${map.get('transition') === 'all' ? 'all' : map.get('transition')} ${map.get('duration') || '150'}ms ${EASE[map.get('ease') || 'in-out'] || 'ease-in-out'}`);
  return out;
}

/** CSS rules for one element at one breakpoint, including :hover / :focus / :active / :disabled and html.dark variants. */
const rule = (sel: string, a: Attrs, prefix: string) => {
  const groups = new Map<string, [string, string][]>();
  for (const [k, v] of Object.entries(a)) {
    if (prefix ? !k.startsWith(prefix) : /^(md|lg)-/.test(k)) continue;
    const key = prefix ? k.slice(prefix.length) : k; const m = STATE_RE.exec(key); const state = m ? m[1] : '';
    const list = groups.get(state) || []; list.push([m ? m[2] : key, v]); groups.set(state, list);
  }
  return [...groups.entries()].map(([state, entries]) => { const ds = declsFor(entries); return ds.length ? `${stateSel(sel, state)}{${ds.join(';')}}` : ''; }).filter(Boolean).join('');
};

export const classOf = (index: number) => `n${index}`;

/** Flatten with stable class names (document order). */
export function indexGen(root: Gen): { gen: Gen; cls: string }[] {
  const out: { gen: Gen; cls: string }[] = []; let i = 0;
  const visit = (g: Gen) => { out.push({ gen: g, cls: classOf(i++) }); g.children.forEach(visit); };
  visit(root); return out;
}

export function cssFor(root: Gen, pretty = true, assetPrefix = ''): string {
  const list = indexGen(root);
  const nl = pretty ? '\n' : '';
  const base = [`*{box-sizing:border-box}`, `html,body{margin:0;padding:0}`, `body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111827;overflow-x:hidden}`, `a{text-decoration:none}`, `button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}`, `input,textarea,select{font:inherit}`, `img,svg{display:block}`, `svg{overflow:visible}`].join(nl);
  const small: string[] = []; const md: string[] = []; const lg: string[] = [];
  list.forEach(({ gen, cls }) => {
    const s = `.${cls}`;
    small.push(rule(s, gen.attrs, '')); md.push(rule(s, gen.attrs, 'md-')); lg.push(rule(s, gen.attrs, 'lg-'));
    if(gen.node.type==='image'&&gen.node.overlay){
      const imageAttrs=Object.fromEntries(Object.entries(gen.attrs).filter(([k])=>/^(md-|lg-)?(object-fit|object-position|filter|backdrop-filter)$/.test(k)));
      small.push(rule(`${s}>img`,imageAttrs,''));md.push(rule(`${s}>img`,imageAttrs,'md-'));lg.push(rule(`${s}>img`,imageAttrs,'lg-'));
      small.push(`${s}::after{content:"";position:absolute;inset:0;background:${gen.node.overlay.color};opacity:${gen.node.overlay.opacity};pointer-events:none}`);
    }
  });
  const join = (a: string[]) => a.filter(Boolean).join(nl);
  const fixUrls = (css: string) => (assetPrefix ? css.replace(/url\(assets\//g, `url(${assetPrefix}assets/`) : css);
  return fixUrls([`/* Generated by AtomAttr Studio. Mobile-first: base, then 768px, then 1024px. */`, base, join(small),
    md.some(Boolean) ? `@media (min-width:768px){${nl}${join(md)}${nl}}` : '', lg.some(Boolean) ? `@media (min-width:1024px){${nl}${join(lg)}${nl}}` : ''].filter(Boolean).join(nl + nl) + nl);
}
