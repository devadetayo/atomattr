/**
 * Component rules for kit-media.ts (image cards and image pills). Keys are data-ui ids; see ui-css.ts for how they ship.
 * Hover effects are pure CSS on the wrapper; child parts are marked with data-p="img" / "quick" / "more".
 */
const REDUCE = '@media (prefers-reduced-motion:reduce){[data-ui^="im-"] *,[data-ui^="ip-"] *{transition:none!important}}';
export const UI_MEDIA: Record<string, string> = {
  'im-quick': `[data-ui~="im-quick"] [data-p="quick"]{opacity:0;transform:translateY(8px);transition:opacity .25s ease,transform .25s ease}
[data-ui~="im-quick"]:hover [data-p="quick"],[data-ui~="im-quick"]:focus-within [data-p="quick"]{opacity:1;transform:none}
@media (hover:none){[data-ui~="im-quick"] [data-p="quick"]{opacity:1;transform:none}}`,
  'im-zoom': `[data-ui~="im-zoom"]{overflow:hidden}
[data-ui~="im-zoom"] [data-p="img"]{transition:transform .6s cubic-bezier(.2,.7,.2,1)}
[data-ui~="im-zoom"]:hover [data-p="img"]{transform:scale(1.08)}`,
  'im-reveal': `[data-ui~="im-reveal"] [data-p="more"]{max-height:0;opacity:0;overflow:hidden;transition:max-height .4s ease,opacity .3s ease}
[data-ui~="im-reveal"]:hover [data-p="more"],[data-ui~="im-reveal"]:focus-within [data-p="more"]{max-height:200px;opacity:1}
@media (hover:none){[data-ui~="im-reveal"] [data-p="more"]{max-height:none;opacity:1}}`,
  'im-gray': `[data-ui~="im-gray"] [data-p="img"]{filter:grayscale(1);transition:filter .4s ease,transform .4s ease}
[data-ui~="im-gray"]:hover [data-p="img"]{filter:none;transform:translateY(-4px)}`,
  'im-tilt-l': `[data-ui~="im-tilt-l"]{transform:rotate(-4deg);transition:transform .3s ease}[data-ui~="im-tilt-l"]:hover{transform:rotate(0) scale(1.03)}`,
  'im-tilt-r': `[data-ui~="im-tilt-r"]{transform:rotate(4deg);transition:transform .3s ease}[data-ui~="im-tilt-r"]:hover{transform:rotate(0) scale(1.03)}`,
  'ip-stack': `[data-ui~="ip-stack"]>*{transition:transform .25s ease,margin .25s ease}
[data-ui~="ip-stack"]:hover>*{transform:translateY(-3px)}`,
  'ip-story': `[data-ui~="ip-story"]{cursor:pointer;transition:transform .2s ease}[data-ui~="ip-story"]:hover{transform:translateY(-3px) scale(1.05)}`,
  'ip-cap': `[data-ui~="ip-cap"]>*{transition:flex-grow .5s cubic-bezier(.2,.7,.2,1)}
[data-ui~="ip-cap"]>*:hover{flex-grow:2.4!important}
${REDUCE}`,
};
