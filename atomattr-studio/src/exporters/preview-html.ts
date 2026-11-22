/**
 * The page the preview iframe shows: the same CSS and markup the static-site export produces (real media queries, real hover
 * states, the real menu/animation runtime), so what you see in a device frame is what visitors get on that device.
 */
import { fontHead } from '../document/fonts';
import type { Project } from '../document/types';
import { buildGen } from '../document/gen';
import { usesBehavior } from '../document/behavior';
import { behaviorCss, BEHAVIOR_JS } from './behavior-runtime';
import { generate, markupLines, assetNamesFor, withAutoAssets, inlineAssets, pageHref } from './codegen';
import { indexGen } from './css';
import { previewSafe } from './custom-code';

/** Body markup of the active page, with images inlined so a srcdoc / blob page needs no files. */
export function previewBody(p: Project): string {
  const page = p.pages.find(x => x.id === p.activePageId) || p.pages[0];
  const root = buildGen(page.root, 'desktop', 'export', [], null, null, p);
  const cls = new Map(); indexGen(root).forEach(({ gen, cls: c }) => cls.set(gen, c));
  return previewSafe(inlineAssets(markupLines(root, 0, assetNamesFor(p), cls).join('\n'), p));
}

/**
 * Reports link clicks to the Studio instead of navigating: `{ ast: 'nav', href }`. The Studio maps page file names to pages,
 * opens external links in a new tab and lets in-page `#anchors` scroll normally.
 */
const NAV_JS = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href')||'';if(h.charAt(0)==='#'){return;}e.preventDefault();parent.postMessage({ast:'nav',href:h},'*');},true);`;

export type PreviewOpts = { dark?: boolean; hideScrollbar?: boolean; intercept?: boolean; touch?: boolean };

/** True when the project defines its own dark-mode styles (`dark-*` attributes). Without them the preview simulates dark mode. */
export const hasDarkStyles = (project: Project): boolean => generate(withAutoAssets(project), 'CSS').code.includes('html.dark');

/** Dark mode for pages that define no dark styles. Instead of inverting the whole page (which turns dark sections light and recolours brands), each element's own colours are remapped: pale backgrounds become charcoal, dark text becomes light, saturated brand colours and dark sections stay as designed, and photos are never touched. `soft` runs 0.7 (deepest) to 1 (lightest charcoal). A preview aid only. */
const darkBase = (soft: number) => 0.04 + (1 - Math.min(1, Math.max(0.7, soft))) * 0.4;
export const simDark = (soft = 0.86) => { const g = Math.round(darkBase(soft) * 255); return `html{color-scheme:dark;background:rgb(${g},${g},${g})}`; };

export const simDarkJs = (soft = 0.86) => `(function(){var L0=${darkBase(soft).toFixed(4)};
function P(c){var m=c&&c.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;var a=m[1].split(/[ ,\\/]+/).filter(Boolean).map(parseFloat);return{r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1};}
function HSL(r,g,b){r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0,d=mx-mn;if(d){s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx==r?(g-b)/d+(g<b?6:0):mx==g?(b-r)/d+2:(r-g)/d+4;h*=60;}return{h:h,s:s,l:l};}
function lum(c){return(.2126*c.r+.7152*c.g+.0722*c.b)/255;}
function css(h,s,l,a){return'hsl('+h.toFixed(0)+' '+(s*100).toFixed(0)+'% '+(l*100).toFixed(1)+'% / '+a+')';}
function run(){var all=document.body.getElementsByTagName('*');document.body.__eff=L0;
for(var i=0;i<all.length;i++){var e=all[i];if(e.__d)continue;e.__d=1;var tag=e.tagName;if(tag==='SCRIPT'||tag==='STYLE')continue;
var par=e.parentElement,eff=par&&par.__eff!=null?par.__eff:L0;var cs=getComputedStyle(e);
var bg=P(cs.backgroundColor);
if(bg&&bg.a>.05){var hs=HSL(bg.r,bg.g,bg.b),lu=lum(bg);
if(lu>.5&&!(hs.s>.45&&hs.l<=.85)){var nl=L0+(1-lu)*.25;e.style.setProperty('background-color',css(hs.h,hs.s*.8,nl,bg.a),'important');if(bg.a>.5)eff=nl;}else if(bg.a>.5)eff=lu;}
e.__eff=eff;
var fg=P(cs.color);if(fg&&eff<.5){var fl=lum(fg);if(fl<.55){var hf=HSL(fg.r,fg.g,fg.b);e.style.setProperty('color',css(hf.h,Math.min(hf.s,.25),.93-fl*.35,fg.a),'important');}}
var bc=P(cs.borderTopColor);if(bc&&bc.a>.05&&parseFloat(cs.borderTopWidth)>0){var bl=lum(bc);if(bl>.6){var hb=HSL(bc.r,bc.g,bc.b);e.style.setProperty('border-color',css(hb.h,hb.s*.5,L0+.14,bc.a),'important');}}
}}
run();setTimeout(run,300);setTimeout(run,1200);})();`;

/** Makes a mouse behave like a finger: a dot for a cursor, drag to scroll, and a drag never counts as a click. */
const DOT = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='11' fill='%23808080' fill-opacity='.35' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E\") 14 14, auto";
export const TOUCH_CSS = `html,body,a,button,*{cursor:${DOT}!important;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}`;
export const TOUCH_JS = `(function(){var d=null,moved=false;
addEventListener('pointerdown',function(e){if(e.button!==0)return;d={x:e.clientX,y:e.clientY,sx:scrollX,sy:scrollY};moved=false;},true);
addEventListener('pointermove',function(e){if(!d)return;var dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;if(moved)scrollTo(d.sx-dx,d.sy-dy);},true);
addEventListener('pointerup',function(){d=null;},true);addEventListener('pointercancel',function(){d=null;},true);
addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);})();`;

export function buildPreviewHtml(project: Project, opts: PreviewOpts = {}): string {
  const p = withAutoAssets(project);
  const css = inlineAssets(generate(p, 'CSS').code, p);
  const page = p.pages.find(x => x.id === p.activePageId) || p.pages[0];
  const live = usesBehavior(page.root);
  const sim = opts.dark && !css.includes('html.dark') ? simDark() : '';
  const touch = opts.touch ? TOUCH_CSS : '';
  const scroll = opts.hideScrollbar ? '::-webkit-scrollbar{display:none}html{scrollbar-width:none}' : '';
  return `<!doctype html><html${opts.dark ? ' class="dark"' : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${fontHead(p)}<style>${css}${live ? behaviorCss([page.root]) : ''}${scroll}${sim}${touch}</style></head><body>${previewBody(p)}${live ? `<script>${BEHAVIOR_JS}<\/script>` : ''}${opts.intercept ? `<script>${NAV_JS}<\/script>` : ''}${opts.touch ? `<script>${TOUCH_JS}<\/script>` : ''}${sim ? `<script>${simDarkJs()}<\/script>` : ''}</body></html>`;
}

/** Which page an exported link (`about.html`, `index.html`) points to, or null for anything else. */
export function pageForHref(project: Project, href: string): string | null {
  const clean = href.split('#')[0].replace(/^\.\//, '');
  if (!/\.html?$/i.test(clean)) return null;
  for (const pg of project.pages) if (pageHref(project, `page:${pg.id}`) === clean) return pg.id;
  return null;
}