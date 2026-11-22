/**
 * Component rules for kit-content.ts (accordions, cards, testimonials). Keys are `data-ui` tokens; a node may carry several
 * separated by spaces (hence the `~=` selectors).
 *
 * Accordions: the toggle / tab and its panel are found by the runtime through the `data-ast-*` attributes; these rules only
 * add looks that react to the panel being open. An accordion item holds a `[data-p="head"]` row and a panel as a direct child,
 * so "this item is open" is `:has(> [data-ast-state="open"])` (it is right from the first paint, even for items that start open).
 */
const OPEN = (id: string) => `[data-ui~="${id}"]:has(>[data-ast-state="open"])`;
const HEAD = (id: string) => `${OPEN(id)}>[data-p="head"]`;

export const UI_CONTENT: Record<string, string> = {
  ac: `[data-ui~="ac"]>[data-p="head"]{cursor:pointer;text-align:left;font:inherit;color:inherit}
[data-ui~="ac"]>[data-p="head"]:focus-visible{outline:2px solid #4f46e5;outline-offset:2px}
[data-ui~="ac"]>[data-ast-tab][aria-selected="true"]{box-shadow:none!important}
[data-ui~="ac"]>[data-ast-state="open"]{animation:ui-acin .25s ease}
[data-ui~="ac"] [data-p="chev"],[data-ui~="ac"] [data-p="plus"],[data-ui~="ac"] [data-p="chip"]{transition:transform .25s ease,background-color .2s}
@keyframes ui-acin{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){[data-ui~="ac"]>[data-ast-state="open"]{animation:none}}`,
  'ac-chev': `${HEAD('ac-chev')} [data-p="chev"]{transform:rotate(180deg)}`,
  'ac-arrow': `${HEAD('ac-arrow')} [data-p="chev"]{transform:rotate(90deg)}`,
  'ac-plus': `${HEAD('ac-plus')} [data-p="plus"]{transform:rotate(45deg)}`,
  'ac-swap': `[data-ui~="ac-swap"] [data-p="minus"]{display:none!important}
${HEAD('ac-swap')} [data-p="plus"]{display:none!important}
${HEAD('ac-swap')} [data-p="minus"]{display:block!important}`,
  'ac-chip': `${HEAD('ac-chip')} [data-p="chip"]{background-color:#4f46e5!important;transform:rotate(180deg)}
${HEAD('ac-chip')} [data-p="chip"] path{stroke:#fff!important}`,
  'ac-q-open': `${HEAD('ac-q-open')} [data-p="q"]{color:#4f46e5!important}`,
  'ac-card-open': `${OPEN('ac-card-open')}{border-color:#4f46e5!important;box-shadow:0 8px 24px -10px rgba(79,70,229,.35)}`,
  'ac-bar-open': `${OPEN('ac-bar-open')}{border-left-color:#4f46e5!important}`,
  'ac-fill-open': `${OPEN('ac-fill-open')}{background-color:#eef2ff!important}`,
  'ac-dark-open': `${OPEN('ac-dark-open')}{background-color:#1f2a44!important;border-color:#6366f1!important}`,
  'ac-glass-open': `${OPEN('ac-glass-open')}{background-color:rgba(255,255,255,.28)!important}`,

  // ---- cards
  'cd-seg': `[data-ui~="cd-seg"]>[data-ast-tab]{cursor:pointer;transition:background-color .2s,color .2s,box-shadow .2s}
[data-ui~="cd-seg"]>[data-ast-tab][aria-selected="true"]{background-color:#ffffff!important;color:#111827!important;box-shadow:0 1px 3px rgba(0,0,0,.14)!important}
[data-ui~="cd-seg"]>[data-ast-tab][aria-selected="true"] *{color:#111827!important}`,
  'cd-seg-dark': `[data-ui~="cd-seg-dark"]>[data-ast-tab]{cursor:pointer;transition:background-color .2s}
[data-ui~="cd-seg-dark"]>[data-ast-tab][aria-selected="true"]{background-color:#4f46e5!important;box-shadow:none!important}
[data-ui~="cd-seg-dark"]>[data-ast-tab][aria-selected="true"] *{color:#fff!important}`,
  'cd-lift': `[data-ui~="cd-lift"]{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
[data-ui~="cd-lift"]:hover{transform:translateY(-6px);box-shadow:0 22px 36px -16px rgba(17,24,39,.3)!important;border-color:#c7d2fe!important}
[data-ui~="cd-lift"]:hover [data-p="go"]{transform:translateX(4px)}
[data-ui~="cd-lift"] [data-p="go"]{transition:transform .2s ease}`,

  // ---- testimonials
  'ts-snap': `[data-ui~="ts-snap"]{overflow-x:auto!important;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
[data-ui~="ts-snap"]::-webkit-scrollbar{display:none}
[data-ui~="ts-snap"]>*{scroll-snap-align:start;flex:none!important}`,
  'ts-marquee': `[data-ui~="ts-marquee"]{overflow:hidden!important}
[data-ui~="ts-marquee"]>[data-p="track"]{width:max-content!important;flex-wrap:nowrap!important;animation:ui-marquee 40s linear infinite}
[data-ui~="ts-marquee"]:hover>[data-p="track"]{animation-play-state:paused}
@keyframes ui-marquee{to{transform:translateX(calc(-50% - 8px))}}
@media (prefers-reduced-motion:reduce){[data-ui~="ts-marquee"]>[data-p="track"]{animation:none}}`,
  'ts-pick': `[data-ui~="ts-pick"] [data-ast-tab]{cursor:pointer;opacity:.5;transition:opacity .2s,box-shadow .2s,transform .2s;box-shadow:none!important}
[data-ui~="ts-pick"] [data-ast-tab]:hover{opacity:.85}
[data-ui~="ts-pick"] [data-ast-tab][aria-selected="true"]{opacity:1;transform:scale(1.08);box-shadow:0 0 0 3px #fff,0 0 0 5px #4f46e5!important}`,
};
