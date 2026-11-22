/**
 * Component rules for kit-nav.ts. Tab bars carry data-ui="tb-<look>"; the runtime marks the open tab with aria-selected="true".
 * Everything else in navigation (breadcrumbs, pagination, sidebars, menus) is plain node styling and needs no rules.
 */
const SEL = (id: string) => `[data-ui~="${id}"] [data-ast-tab][aria-selected="true"]`;
const NOLINE = (id: string) => `[data-ui~="${id}"] [data-ast-tab]{box-shadow:none!important;transition:background .2s ease,color .2s ease,box-shadow .2s ease}`;
export const UI_NAV: Record<string, string> = {
  'choice-dot': `[data-ui="choice-dot"]{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}\n[data-ui="choice-dot"]:hover{transform:scale(1.08)}\n[data-ui="choice-dot"]:has(:checked){box-shadow:0 0 0 2px #fff,0 0 0 4px currentColor!important}`,
  'tb-line': `${SEL('tb-line')}{color:#4f46e5!important;box-shadow:inset 0 -2px 0 #4f46e5!important}`,
  'tb-pill': `${NOLINE('tb-pill')}\n${SEL('tb-pill')}{background:#4f46e5!important;color:#fff!important}`,
  'tb-soft': `${NOLINE('tb-soft')}\n${SEL('tb-soft')}{background:#eef2ff!important;color:#4338ca!important}`,
  'tb-dark': `${NOLINE('tb-dark')}\n${SEL('tb-dark')}{background:#111827!important;color:#fff!important}`,
  'tb-seg': `${NOLINE('tb-seg')}\n${SEL('tb-seg')}{background:#fff!important;color:#111827!important;box-shadow:0 1px 3px rgba(15,23,42,.15)!important}`,
  'tb-box': `${NOLINE('tb-box')}\n${SEL('tb-box')}{background:#fff!important;color:#111827!important;box-shadow:inset 0 2px 0 #4f46e5,inset 1px 0 #e5e7eb,inset -1px 0 #e5e7eb!important}`,
  'tb-side': `${NOLINE('tb-side')}\n${SEL('tb-side')}{background:#eef2ff!important;color:#4338ca!important;box-shadow:inset 3px 0 0 #4f46e5!important}`,
  'tb-bar': `${NOLINE('tb-bar')}\n[data-ui~="tb-bar"] [data-ast-tab]{position:relative}\n${SEL('tb-bar')}{color:#4f46e5!important}\n${SEL('tb-bar')}::after{content:"";position:absolute;left:25%;right:25%;bottom:0;height:3px;border-radius:3px;background:#4f46e5}`,
  'tb-glass': `${NOLINE('tb-glass')}\n${SEL('tb-glass')}{background:rgba(255,255,255,.22)!important;color:#fff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)!important}`,
};
