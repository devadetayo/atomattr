/**
 * Component rules for kit-overlays.ts: tooltips (tt, tt-*) and dialog / drawer / toast entrances (md, md-*, ts-*).
 *
 * Tooltips: the wrapper carries `data-ui="tt tt-top"` (placement token plus optional modifiers); the tip is a child with
 * `data-p="tip"`. It shows on hover and on keyboard focus (:focus-within) of the wrapper. Its colours, padding and radius are
 * ordinary node style; the arrow takes the tip's own background.
 * Dialogs: only the entrance animation and scrolling; the opening and closing is the Panel behavior.
 */
const TIP = `[data-ui~="tt"]{position:relative}
[data-ui~="tt"] [data-p="tip"]{position:absolute!important;z-index:60;width:max-content!important;max-width:min(280px,78vw)!important;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .16s ease,transform .16s ease,visibility .16s;box-sizing:border-box;white-space:normal}
[data-ui~="tt"]:hover [data-p="tip"],[data-ui~="tt"]:focus-within [data-p="tip"]{opacity:1;visibility:visible;pointer-events:auto}
[data-ui~="tt"] [data-p="tip"]::after{content:"";position:absolute;width:9px;height:9px;background:inherit;border-radius:2px}
[data-ui~="tt"] [data-p="tip"]::before{content:"";position:absolute}
[data-ui~="tt-flat"] [data-p="tip"]::after{display:none}
@media (prefers-reduced-motion:reduce){[data-ui~="tt"] [data-p="tip"]{transition:none}}`;

const place = (id: string, pos: string, hide: string, show: string, arrow: string, bridge: string) =>
  `[data-ui~="${id}"] [data-p="tip"]{${pos};transform:${hide}}
[data-ui~="${id}"]:hover [data-p="tip"],[data-ui~="${id}"]:focus-within [data-p="tip"]{transform:${show}}
[data-ui~="${id}"] [data-p="tip"]::after{${arrow}}
[data-ui~="${id}"] [data-p="tip"]::before{${bridge}}`;

const TOP = (id: string, h: string, tfx: string, afx: string) => place(id, `bottom:calc(100% + 10px);${h}`, `${tfx} translateY(4px)`, `${tfx} translateY(0)`, `bottom:-4px;${afx};transform:rotate(45deg)`, 'left:0;right:0;bottom:-12px;height:12px');
const BOTTOM = (id: string, h: string, tfx: string, afx: string) => place(id, `top:calc(100% + 10px);${h}`, `${tfx} translateY(-4px)`, `${tfx} translateY(0)`, `top:-4px;${afx};transform:rotate(45deg)`, 'left:0;right:0;top:-12px;height:12px');

export const UI_OVERLAYS: Record<string, string> = {
  tt: TIP,
  'tt-top': TOP('tt-top', 'left:50%', 'translateX(-50%)', 'left:calc(50% - 4.5px)'),
  'tt-top-start': TOP('tt-top-start', 'left:0', 'translateX(0)', 'left:16px'),
  'tt-top-end': TOP('tt-top-end', 'right:0', 'translateX(0)', 'right:16px'),
  'tt-bottom': BOTTOM('tt-bottom', 'left:50%', 'translateX(-50%)', 'left:calc(50% - 4.5px)'),
  'tt-bottom-start': BOTTOM('tt-bottom-start', 'left:0', 'translateX(0)', 'left:16px'),
  'tt-bottom-end': BOTTOM('tt-bottom-end', 'right:0', 'translateX(0)', 'right:16px'),
  'tt-left': place('tt-left', 'right:calc(100% + 10px);top:50%', 'translateY(-50%) translateX(4px)', 'translateY(-50%) translateX(0)', 'right:-4px;top:calc(50% - 4.5px);transform:rotate(45deg)', 'top:0;bottom:0;right:-12px;width:12px')
    + `\n@media (max-width:520px){[data-ui~="tt-left"] [data-p="tip"]{right:auto;left:50%;top:auto;bottom:calc(100% + 10px);transform:translateX(-50%) translateY(4px)}[data-ui~="tt-left"]:hover [data-p="tip"],[data-ui~="tt-left"]:focus-within [data-p="tip"]{transform:translateX(-50%) translateY(0)}[data-ui~="tt-left"] [data-p="tip"]::after{right:auto;top:auto;left:calc(50% - 4.5px);bottom:-4px}[data-ui~="tt-left"] [data-p="tip"]::before{top:auto;right:0;left:0;width:auto;bottom:-12px;height:12px}}`,
  'tt-right': place('tt-right', 'left:calc(100% + 10px);top:50%', 'translateY(-50%) translateX(-4px)', 'translateY(-50%) translateX(0)', 'left:-4px;top:calc(50% - 4.5px);transform:rotate(45deg)', 'top:0;bottom:0;left:-12px;width:12px')
    + `\n@media (max-width:520px){[data-ui~="tt-right"] [data-p="tip"]{left:50%;top:auto;bottom:calc(100% + 10px);transform:translateX(-50%) translateY(4px)}[data-ui~="tt-right"]:hover [data-p="tip"],[data-ui~="tt-right"]:focus-within [data-p="tip"]{transform:translateX(-50%) translateY(0)}[data-ui~="tt-right"] [data-p="tip"]::after{left:calc(50% - 4.5px);top:auto;bottom:-4px}[data-ui~="tt-right"] [data-p="tip"]::before{top:auto;left:0;right:0;width:auto;bottom:-12px;height:12px}}`,
  /** Modifier: the tip pops in from small instead of sliding. */
  'tt-pop': `[data-ui~="tt-pop"] [data-p="tip"]{transition:opacity .18s ease,transform .22s cubic-bezier(.34,1.56,.64,1),visibility .18s}`,
  'tt-flat': '/* modifier: no arrow, see the base rules */',
  /** The tip belongs to a copy button: the text swaps to "Copied" while the runtime marks the button. */
  'tt-copy': `[data-ui~="tt-copy"] [data-p="d"]{display:none!important}
[data-ui~="tt-copy"][data-ast-copied] [data-p="l"]{display:none!important}
[data-ui~="tt-copy"][data-ast-copied] [data-p="d"]{display:inline-flex!important}
[data-ui~="tt-copy"][data-ast-copied] [data-p="tip"]{opacity:1;visibility:visible}`,
  /** Modifier: a small keyboard key chip inside a tip. */
  'tt-kbd': `[data-ui~="tt-kbd"] [data-p="key"]{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:inset 0 -1px 0 rgba(255,255,255,.25)}`,

  // ---- dialogs, drawers and toasts: entrance motion and scrolling (open / close is the Panel behavior)
  md: `[data-ui~="md"]{overflow-y:auto;overscroll-behavior:contain}
[data-ui~="md"][data-ast-state="open"]{animation:ui-md-fade .18s ease both}
[data-ui~="md"][data-ast-state="open"]>*{animation:ui-md-pop .26s cubic-bezier(.34,1.35,.64,1) both}
@keyframes ui-md-fade{from{opacity:0}to{opacity:1}}
@keyframes ui-md-pop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){[data-ui~="md"][data-ast-state="open"],[data-ui~="md"][data-ast-state="open"]>*{animation:none}}`,
  'md-right': `[data-ui~="md-right"][data-ast-state="open"]>*{animation:ui-md-right .28s cubic-bezier(.2,.8,.2,1) both}\n@keyframes ui-md-right{from{transform:translateX(100%)}to{transform:none}}`,
  'md-left': `[data-ui~="md-left"][data-ast-state="open"]>*{animation:ui-md-left .28s cubic-bezier(.2,.8,.2,1) both}\n@keyframes ui-md-left{from{transform:translateX(-100%)}to{transform:none}}`,
  'md-up': `[data-ui~="md-up"][data-ast-state="open"]>*{animation:ui-md-up .3s cubic-bezier(.2,.8,.2,1) both}\n@keyframes ui-md-up{from{transform:translateY(100%)}to{transform:none}}`,
  'md-down': `[data-ui~="md-down"][data-ast-state="open"]>*{animation:ui-md-down .3s cubic-bezier(.2,.8,.2,1) both}\n@keyframes ui-md-down{from{transform:translateY(-100%)}to{transform:none}}`,
  /** Toast entrance, from the nearest screen edge (set by the position the toast is pinned to). */
  'ts-up': `[data-ui~="ts-up"][data-ast-state="open"]{animation:ui-ts-up .3s cubic-bezier(.2,.8,.2,1) both}\n@keyframes ui-ts-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}\n@media (prefers-reduced-motion:reduce){[data-ui~="ts-up"][data-ast-state="open"]{animation:none}}`,
  'ts-down': `[data-ui~="ts-down"][data-ast-state="open"]{animation:ui-ts-down .3s cubic-bezier(.2,.8,.2,1) both}\n@keyframes ui-ts-down{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}\n@media (prefers-reduced-motion:reduce){[data-ui~="ts-down"][data-ast-state="open"]{animation:none}}`,
  /** Modifier: the toast fades out by itself after 5 seconds, and its timer bar (data-p="bar") drains meanwhile. */
  'ts-auto': `[data-ui~="ts-auto"][data-ast-state="open"]{animation:ui-ts-up .3s cubic-bezier(.2,.8,.2,1) both,ui-ts-life .4s ease 5s forwards}
[data-ui~="ts-auto"][data-ast-state="open"] [data-p="bar"]{transform-origin:left center;animation:ui-ts-bar 5s linear both}
@keyframes ui-ts-life{to{opacity:0;visibility:hidden;pointer-events:none}}
@keyframes ui-ts-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@media (prefers-reduced-motion:reduce){[data-ui~="ts-auto"][data-ast-state="open"],[data-ui~="ts-auto"][data-ast-state="open"] [data-p="bar"]{animation:none}}`,
};
