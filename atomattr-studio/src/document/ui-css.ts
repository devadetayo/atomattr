/**
 * Component styles for the library's controls (switches, radios, fancy checkboxes, dark-mode toggles, button effects).
 *
 * The node model has no `:checked`, no pseudo-elements and no "inside <html class=dark>" selector, so these few rules live here.
 * Everything else about a control (size, radius, colours, spacing) is still ordinary node style: change it in the Style panel.
 * The accent colour of a control is its `color` (the rules use `currentColor`), so one colour change recolours the control.
 *
 * A node opts in with the attribute `data-ui="<id>"`. Exports and previews only receive the rules for the ids a page uses.
 */
import type { Node } from './types';
import { UI_CONTENT } from './ui-css-content';
import { UI_OVERLAYS } from './ui-css-overlays';
import { UI_APP } from './ui-css-app';
import { UI_NAV } from './ui-css-nav';
import { UI_DM } from './ui-css-dm';
import { UI_MEDIA } from './ui-css-media';
import { UI_FX } from './ui-css-fx';

const svg = (body: string, vb = '0 0 16 16') => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}'>${body}</svg>`)}")`;
const TICK = svg(`<path d='M3.5 8.5l3 3 6-7' fill='none' stroke='#fff' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/>`);
const MINUS = svg(`<path d='M4 8h8' fill='none' stroke='#fff' stroke-width='2.6' stroke-linecap='round'/>`);
const CROSS = svg(`<path d='M4.5 4.5l7 7M11.5 4.5l-7 7' fill='none' stroke='#fff' stroke-width='2.4' stroke-linecap='round'/>`);
const HEART = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.4 4.5c2 0 3.6 1.1 4.6 2.7h2c1-1.6 2.6-2.7 4.6-2.7 3.7 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z';
const HEART_OUT = svg(`<path d='${HEART}' fill='none' stroke='#9ca3af' stroke-width='2' stroke-linejoin='round'/>`, '0 0 24 24');
const HEART_ON = svg(`<path d='${HEART}' fill='#ef4444' stroke='#ef4444' stroke-width='2' stroke-linejoin='round'/>`, '0 0 24 24');
const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
const STAR_OUT = svg(`<path d='${STAR}' fill='none' stroke='#9ca3af' stroke-width='2' stroke-linejoin='round'/>`, '0 0 24 24');
const STAR_ON = svg(`<path d='${STAR}' fill='#f59e0b' stroke='#f59e0b' stroke-width='2' stroke-linejoin='round'/>`, '0 0 24 24');
const SUN = svg(`<circle cx='12' cy='12' r='4.5' fill='#f59e0b'/><g stroke='#f59e0b' stroke-width='2' stroke-linecap='round'><path d='M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8'/></g>`, '0 0 24 24');
const MOON = svg(`<path d='M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z' fill='#e0e7ff'/>`, '0 0 24 24');

const BASE0 = `[data-ui^="cb-"],[data-ui^="rd-"],[data-ui^="sw-"]{-webkit-appearance:none;appearance:none;position:relative;cursor:pointer;flex:none;margin:0;box-sizing:border-box;transition:background-color .2s,border-color .2s,box-shadow .2s,opacity .2s}
[data-ui^="cb-"]:focus-visible,[data-ui^="rd-"]:focus-visible,[data-ui^="sw-"]:focus-visible,[data-ui^="dm-"]:focus-visible,[data-ui^="bt-"]:focus-visible{outline:2px solid currentColor;outline-offset:2px}
[data-ui^="cb-"]:disabled,[data-ui^="rd-"]:disabled,[data-ui^="sw-"]:disabled{opacity:.45;cursor:not-allowed}
[data-ui~="vh"]{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;margin:0!important}
@keyframes ui-pop{0%{transform:scale(1)}45%{transform:scale(.82)}100%{transform:scale(1)}}
@keyframes ui-ripple{0%{box-shadow:0 0 0 0 color-mix(in srgb,currentColor 45%,transparent)}100%{box-shadow:0 0 0 12px transparent}}
@keyframes ui-ping-ring{0%{box-shadow:0 0 0 0 var(--ui-ring,rgba(79,70,229,.55))}100%{box-shadow:0 0 0 16px rgba(79,70,229,0)}}
@keyframes ui-ping-red{0%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}100%{box-shadow:0 0 0 16px rgba(239,68,68,0)}}`;

/** Checkbox and radio fill rules shared by many variants. */
const checkedFill = (id: string, img: string, size = '78%') => `[data-ui="${id}"]:checked{background:currentColor ${img} center/${size} no-repeat!important;border-color:currentColor!important}`;
const tickAfter = (id: string, extra = '') => `[data-ui="${id}"]::after{content:"";position:absolute;left:34%;top:12%;width:30%;height:56%;border:solid currentColor;border-width:0 2.5px 2.5px 0;transform:rotate(45deg) scale(0);transition:transform .2s cubic-bezier(.34,1.56,.64,1);${extra}}
[data-ui="${id}"]:checked::after{transform:rotate(45deg) scale(1)}`;

const SW_THUMB = `content:"";position:absolute;top:3px;left:3px;height:calc(100% - 6px);aspect-ratio:1;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .22s cubic-bezier(.4,0,.2,1),transform .22s cubic-bezier(.4,0,.2,1),background-color .2s`;
const SW_ON = `left:calc(100% - 3px);transform:translateX(-100%)`;
const swBase = `[data-ui^="sw-"]::before{${SW_THUMB}}
[data-ui^="sw-"]:checked::before{${SW_ON}}
[data-ui^="sw-"]:checked{background-color:currentColor!important;border-color:currentColor!important}`;

const BASE = `${BASE0}\n${swBase}`;
export const UI: Record<string, string> = {
  _base: BASE,
  // ---- checkboxes
  'cb-check': checkedFill('cb-check', TICK),
  'cb-pop': `${checkedFill('cb-pop', TICK)}\n[data-ui="cb-pop"]:checked{animation:ui-pop .25s ease}`,
  'cb-round': checkedFill('cb-round', TICK),
  'cb-minus': checkedFill('cb-minus', MINUS),
  'cb-cross': checkedFill('cb-cross', CROSS, '70%'),
  'cb-soft': `[data-ui="cb-soft"]:checked{background-color:color-mix(in srgb,currentColor 12%,#fff)!important;border-color:currentColor!important}\n${tickAfter('cb-soft')}`,
  'cb-draw': `[data-ui="cb-draw"]:checked{background-color:currentColor!important;border-color:currentColor!important}
[data-ui="cb-draw"]::after{content:"";position:absolute;left:34%;top:12%;width:0;height:0;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg);transition:height .12s ease .1s,width .12s ease}
[data-ui="cb-draw"]:checked::after{width:30%;height:56%;transition:width .12s ease .1s,height .12s ease}`,
  'cb-neon': `[data-ui="cb-neon"]:checked{background:currentColor ${TICK} center/78% no-repeat!important;border-color:currentColor!important;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 25%,transparent),0 0 14px currentColor}`,
  'cb-heart': `[data-ui="cb-heart"]{border:0!important;background:${HEART_OUT} center/100% no-repeat!important;box-shadow:none!important}\n[data-ui="cb-heart"]:checked{background-image:${HEART_ON}!important;animation:ui-pop .3s ease}`,
  'cb-star': `[data-ui="cb-star"]{border:0!important;background:${STAR_OUT} center/100% no-repeat!important;box-shadow:none!important}\n[data-ui="cb-star"]:checked{background-image:${STAR_ON}!important;animation:ui-pop .3s ease}`,

  // ---- radios
  'rd-dot': `[data-ui="rd-dot"]:checked{border-color:currentColor!important}
[data-ui="rd-dot"]::before{content:"";position:absolute;inset:4px;border-radius:50%;background:currentColor;transform:scale(0);transition:transform .18s cubic-bezier(.34,1.56,.64,1)}
[data-ui="rd-dot"]:checked::before{transform:scale(1)}`,
  'rd-fill': `[data-ui="rd-fill"]:checked{background-color:currentColor!important;border-color:currentColor!important;box-shadow:inset 0 0 0 4px #fff}`,
  'rd-tick': checkedFill('rd-tick', TICK),
  'rd-glow': `[data-ui="rd-glow"]:checked{border-color:currentColor!important;box-shadow:0 0 0 4px color-mix(in srgb,currentColor 20%,transparent)}
[data-ui="rd-glow"]::before{content:"";position:absolute;inset:4px;border-radius:50%;background:currentColor;transform:scale(0);transition:transform .18s ease}
[data-ui="rd-glow"]:checked::before{transform:scale(1)}`,
  'rd-ripple': `[data-ui="rd-ripple"]:checked{border-color:currentColor!important;animation:ui-ripple .5s ease-out}
[data-ui="rd-ripple"]::before{content:"";position:absolute;inset:4px;border-radius:50%;background:currentColor;transform:scale(0);transition:transform .18s ease}
[data-ui="rd-ripple"]:checked::before{transform:scale(1)}`,
  'rd-square': `[data-ui="rd-square"]:checked{border-color:currentColor!important}
[data-ui="rd-square"]::before{content:"";position:absolute;inset:4px;border-radius:3px;background:currentColor;transform:scale(0);transition:transform .18s ease}
[data-ui="rd-square"]:checked::before{transform:scale(1)}`,
  choice: `[data-ui="choice"]{cursor:pointer;transition:border-color .2s,background-color .2s,box-shadow .2s}
[data-ui="choice"]:hover{border-color:#9ca3af!important}
[data-ui="choice"]:has(:checked){border-color:currentColor!important;background-color:color-mix(in srgb,currentColor 7%,#fff)!important;box-shadow:0 0 0 1px currentColor}`,
  'seg-item': `[data-ui="seg-item"]{cursor:pointer;transition:background-color .2s,color .2s,box-shadow .2s}
[data-ui="seg-item"]:has(:checked){background-color:#fff!important;color:#111827!important;box-shadow:0 1px 3px rgba(0,0,0,.14)}`,
  'seg-dark': `[data-ui="seg-dark"]{cursor:pointer;transition:background-color .2s,color .2s}
[data-ui="seg-dark"]:has(:checked){background-color:currentColor!important}
[data-ui="seg-dark"]:has(:checked) *{color:#fff!important}`,

  // ---- switches (the input is the track; its ::before is the thumb)
  'sw-ios': '/* classic: base rules */',
  'sw-square': `[data-ui="sw-square"]::before{border-radius:4px}`,
  'sw-outline': `[data-ui="sw-outline"]{background-color:transparent!important;border:2px solid #9ca3af!important}
[data-ui="sw-outline"]::before{background:#9ca3af;box-shadow:none;top:2px;left:2px;height:calc(100% - 4px)}
[data-ui="sw-outline"]:checked{background-color:transparent!important}
[data-ui="sw-outline"]:checked::before{background:currentColor;left:calc(100% - 2px)}`,
  'sw-tick': `[data-ui="sw-tick"]::before{display:grid;place-items:center;font:700 12px/1 system-ui,sans-serif;color:currentColor}
[data-ui="sw-tick"]:checked::before{content:"\\2713"}`,
  'sw-label': `[data-ui="sw-label"]::after{content:"OFF";position:absolute;top:50%;right:9px;transform:translateY(-50%);font:700 10px/1 system-ui,sans-serif;letter-spacing:.04em;color:#6b7280;transition:opacity .2s}
[data-ui="sw-label"]:checked::after{content:"ON";right:auto;left:10px;color:#fff}`,
  'sw-bounce': `[data-ui="sw-bounce"]::before{transition:left .4s cubic-bezier(.68,-.55,.27,1.55),transform .4s cubic-bezier(.68,-.55,.27,1.55)}\n[data-ui="sw-bounce"]:active::before{height:calc(100% - 12px);top:6px}`,
  'sw-slim': `[data-ui="sw-slim"]::before{content:"";position:absolute;top:-4px;left:-2px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.35);transition:left .22s cubic-bezier(.4,0,.2,1),transform .22s cubic-bezier(.4,0,.2,1),background-color .2s}
[data-ui="sw-slim"]:checked::before{left:calc(100% + 2px);transform:translateX(-100%);background:currentColor}
[data-ui="sw-slim"]:checked{background-color:color-mix(in srgb,currentColor 40%,#fff)!important;border-color:transparent!important}`,
  'sw-gradient': `[data-ui="sw-gradient"]:checked{background:linear-gradient(90deg,currentColor,#ec4899)!important;border-color:transparent!important}`,
  'sw-neon': `[data-ui="sw-neon"]:checked{box-shadow:0 0 12px currentColor,inset 0 0 4px rgba(255,255,255,.35)}`,

  // ---- dark mode toggles (they react to <html class="dark">, which the Switch light / dark behavior toggles)
  'dm-pill': `[data-ui="dm-pill"]{position:relative;cursor:pointer;transition:background-color .3s}
[data-ui="dm-pill"]::before{content:"";position:absolute;top:3px;left:3px;height:calc(100% - 6px);aspect-ratio:1;border-radius:50%;background:#fff ${SUN} center/66% no-repeat;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .3s cubic-bezier(.4,0,.2,1),transform .3s cubic-bezier(.4,0,.2,1),background-color .3s}
html.dark [data-ui="dm-pill"]{background-color:#1e293b!important}
html.dark [data-ui="dm-pill"]::before{left:calc(100% - 3px);transform:translateX(-100%);background:#0f172a ${MOON} center/66% no-repeat}`,
  'dm-sky': `[data-ui="dm-sky"]{position:relative;cursor:pointer;overflow:hidden;background:radial-gradient(circle at 78% 72%,#fff 0 7px,transparent 8px),radial-gradient(circle at 64% 78%,#fff 0 6px,transparent 7px),radial-gradient(circle at 88% 80%,#fff 0 5px,transparent 6px),linear-gradient(#38bdf8,#7dd3fc)!important;transition:background .4s}
[data-ui="dm-sky"]::before{content:"";position:absolute;top:4px;left:4px;height:calc(100% - 8px);aspect-ratio:1;border-radius:50%;background:#fcd34d;box-shadow:0 0 0 4px rgba(252,211,77,.35),0 0 14px rgba(252,211,77,.8);transition:left .4s cubic-bezier(.4,0,.2,1),transform .4s cubic-bezier(.4,0,.2,1),background .4s,box-shadow .4s}
html.dark [data-ui="dm-sky"]{background:radial-gradient(circle at 18% 28%,#fff 0 1.2px,transparent 2px),radial-gradient(circle at 34% 64%,#fff 0 1px,transparent 2px),radial-gradient(circle at 46% 24%,#fff 0 1.4px,transparent 2.4px),radial-gradient(circle at 26% 80%,#fff 0 1px,transparent 2px),linear-gradient(#1e1b4b,#312e81)!important}
html.dark [data-ui="dm-sky"]::before{left:calc(100% - 4px);transform:translateX(-100%);background:radial-gradient(circle at 30% 32%,#cbd5e1 0 4px,transparent 5px),radial-gradient(circle at 62% 62%,#cbd5e1 0 3px,transparent 4px),#e2e8f0;box-shadow:0 0 0 4px rgba(226,232,240,.18),0 0 12px rgba(226,232,240,.45)}`,
  'dm-icon': `[data-ui="dm-icon"]{position:relative;cursor:pointer;transition:background-color .3s,border-color .3s}
[data-ui="dm-icon"]::before{content:"";position:absolute;inset:22%;background:${SUN} center/contain no-repeat;transition:transform .5s cubic-bezier(.34,1.56,.64,1)}
html.dark [data-ui="dm-icon"]{background-color:#1f2937!important;border-color:#374151!important}
html.dark [data-ui="dm-icon"]::before{background-image:${MOON};transform:rotate(360deg)}`,
  'dm-eclipse': `[data-ui="dm-eclipse"]{position:relative;cursor:pointer;transition:background-color .3s,border-color .3s}
[data-ui="dm-eclipse"]::before{content:"";position:absolute;top:50%;left:50%;width:44%;height:44%;margin:-22% 0 0 -22%;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 0 transparent,0 0 0 4px rgba(245,158,11,.28),0 0 14px rgba(245,158,11,.45);transition:all .45s cubic-bezier(.4,0,.2,1)}
html.dark [data-ui="dm-eclipse"]{background-color:#111827!important;border-color:#374151!important}
html.dark [data-ui="dm-eclipse"]::before{background:transparent;box-shadow:inset -6px -4px 0 0 #e5e7eb,0 0 0 0 transparent;transform:rotate(-20deg) scale(1.1)}`,
  'dm-seg': `[data-ui="dm-seg"]{position:relative;cursor:pointer;isolation:isolate;transition:background-color .3s}
[data-ui="dm-seg"]::before{content:"";position:absolute;z-index:-1;top:3px;left:3px;width:calc(50% - 3px);height:calc(100% - 6px);border-radius:inherit;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.15);transition:transform .3s cubic-bezier(.4,0,.2,1),background-color .3s}
html.dark [data-ui="dm-seg"]{background-color:#1f2937!important}
html.dark [data-ui="dm-seg"]::before{transform:translateX(100%);background:#4f46e5}
[data-ui="dm-seg"] [data-p="l"] *{color:#111827!important}
html.dark [data-ui="dm-seg"] [data-p="l"] *{color:#9ca3af!important}
html.dark [data-ui="dm-seg"] [data-p="d"] *{color:#fff!important}`,
  'dm-switch': `html.dark input[data-ast-theme][data-ui^="sw-"]{background-color:currentColor!important;border-color:currentColor!important}
html.dark input[data-ast-theme][data-ui^="sw-"]::before{left:calc(100% - 3px);transform:translateX(-100%)}`,
  'dm-swap': `[data-ui="dm-swap"] [data-p="d"]{display:none!important}
html.dark [data-ui="dm-swap"] [data-p="l"]{display:none!important}
html.dark [data-ui="dm-swap"] [data-p="d"]{display:inline-flex!important}
html.dark [data-ui="dm-swap"]{background-color:#1f2937!important;border-color:#374151!important}
html.dark [data-ui="dm-swap"] *{color:#f9fafb}`,

  // ---- button effects
  'bt-sweep': `[data-ui="bt-sweep"]{position:relative;overflow:hidden;isolation:isolate}
[data-ui="bt-sweep"]::before{content:"";position:absolute;inset:0;z-index:-1;background:#111827;transform:translateX(-101%);transition:transform .4s cubic-bezier(.4,0,.2,1)}
[data-ui="bt-sweep"]:hover::before{transform:none}
[data-ui="bt-sweep"]:hover *{color:#fff!important}
[data-ui="bt-sweep"]:hover path{stroke:#fff!important}`,
  'bt-fillup': `[data-ui="bt-fillup"]{position:relative;overflow:hidden;isolation:isolate}
[data-ui="bt-fillup"]::before{content:"";position:absolute;inset:0;z-index:-1;background:currentColor;transform:translateY(101%);transition:transform .35s cubic-bezier(.4,0,.2,1)}
[data-ui="bt-fillup"]:hover::before{transform:none}
[data-ui="bt-fillup"]:hover *{color:#fff!important}
[data-ui="bt-fillup"]:hover path{stroke:#fff!important}`,
  'bt-shine': `[data-ui="bt-shine"]{position:relative;overflow:hidden;isolation:isolate}
[data-ui="bt-shine"]::after{content:"";position:absolute;top:0;left:-70%;width:45%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);transition:left .6s ease}
[data-ui="bt-shine"]:hover::after{left:130%}`,
  'bt-arrow': `[data-ui="bt-arrow"] [data-p="arrow"]{transition:transform .25s cubic-bezier(.4,0,.2,1)}
[data-ui="bt-arrow"]:hover [data-p="arrow"]{transform:translateX(5px)}`,
  'bt-underline': `[data-ui="bt-underline"]{position:relative}
[data-ui="bt-underline"]::after{content:"";position:absolute;left:0;bottom:6px;width:100%;height:2px;background:currentColor;transform:scaleX(0);transform-origin:right;transition:transform .3s ease}
[data-ui="bt-underline"]:hover::after{transform:scaleX(1);transform-origin:left}`,
  'bt-slide': `[data-ui="bt-slide"]{position:relative;overflow:hidden}
[data-ui="bt-slide"] [data-p="a"],[data-ui="bt-slide"] [data-p="b"]{transition:transform .3s cubic-bezier(.4,0,.2,1)}
[data-ui="bt-slide"] [data-p="b"]{position:absolute;left:0;right:0;top:50%;margin-top:-.6em;text-align:center;transform:translateY(160%)}
[data-ui="bt-slide"]:hover [data-p="a"]{transform:translateY(-160%)}
[data-ui="bt-slide"]:hover [data-p="b"]{transform:translateY(0)}`,
  'bt-ripple': `[data-ui="bt-ripple"]:active{animation:ui-ripple .55s ease-out}`,
  'bt-pulse': `[data-ui="bt-pulse"]{animation:ui-ping-ring 1.8s ease-out infinite}\n@media (prefers-reduced-motion:reduce){[data-ui="bt-pulse"]{animation:none}}`,
  'bt-pulse-red': `[data-ui="bt-pulse-red"]{animation:ui-ping-red 1.8s ease-out infinite}\n@media (prefers-reduced-motion:reduce){[data-ui="bt-pulse-red"]{animation:none}}`,
  'bt-flow': `[data-ui="bt-flow"]{background-size:240% 100%!important;animation:ui-flow 4s ease infinite}\n@keyframes ui-flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}\n@media (prefers-reduced-motion:reduce){[data-ui="bt-flow"]{animation:none}}`,
  'bt-border-flow': `[data-ui="bt-border-flow"]{position:relative;isolation:isolate;background:#111827!important;border:0!important}
[data-ui="bt-border-flow"]::before{content:"";position:absolute;inset:-2px;z-index:-2;border-radius:inherit;background:linear-gradient(120deg,#6366f1,#ec4899,#f59e0b,#22d3ee,#6366f1);background-size:300% 100%;animation:ui-flow2 3s linear infinite}
[data-ui="bt-border-flow"]::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:#111827}
@keyframes ui-flow2{to{background-position:300% 0}}
@media (prefers-reduced-motion:reduce){[data-ui="bt-border-flow"]::before{animation:none}}`,
  ...UI_CONTENT, ...UI_MEDIA, ...UI_OVERLAYS, ...UI_APP, ...UI_NAV, ...UI_DM, ...UI_FX,
};

const ALL_IDS = Object.keys(UI).filter(k => k !== '_base');
/** Which component rules these roots use. */
export function usedUi(roots: Node[]): string[] {
  const seen = new Set<string>();
  const walk = (n: Node) => { const v = n.attrs?.['data-ui']; if (typeof v === 'string') v.split(/\s+/).forEach(x => x && x !== 'vh' && seen.add(x)); (n.children || []).forEach(walk); };
  roots.forEach(walk);
  return ALL_IDS.filter(id => seen.has(id));
}
export const usesUi = (node: Node): boolean => typeof node.attrs?.['data-ui'] === 'string' || (node.children || []).some(usesUi);
/** CSS for an export or preview: the base rules (hidden inputs, focus rings) plus the ids in use. */
export const uiCss = (roots: Node[]): string => { const ids = usedUi(roots); return ids.length || roots.some(usesUi) ? [UI._base, ...ids.map(i => UI[i])].join('\n') : ''; };

let injected = false;
/** Puts every component rule into the Studio page once, so the canvas, the library thumbnails and previews show them. */
export function ensureUiCss() {
  if (injected || typeof document === 'undefined') return; injected = true;
  const el = document.createElement('style'); el.setAttribute('data-ast-ui', ''); el.textContent = Object.values(UI).join('\n'); document.head.appendChild(el);
}
