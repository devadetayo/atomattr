/**
 * Component rules for kit-app.ts: range sliders, app screens and the extra blocks. Keys are `data-ui` ids; see ui-css.ts for how they ship
 * (only the ids a page uses are exported). A node's accent is its `color` (the rules use currentColor).
 *
 * Range sliders are real `<input type="range">`. Native range inputs cannot be styled with node style, so every look is a rule set for the
 * WebKit / Blink parts (`::-webkit-slider-*`) plus the Firefox parts (`::-moz-range-*`).
 * Filled tracks: Blink has no "progress" part, so a thick slider clips a huge thumb shadow to its own box (the classic trick). That is why the
 * filled styles have a thumb no taller than the track. Thin-track styles keep a single track colour (Firefox draws the fill too).
 */
type Rg = {
  tr: number; th: number; thw?: number; track: string; fill?: string; thumb: string; thumbBorder?: string; thumbShadow?: string; thumbRadius?: string;
  trackRadius?: string; glow?: boolean; grow?: boolean; thumbOnly?: boolean; vertical?: boolean; extra?: string; noPtr?: boolean;
};
const rg = (id: string, o: Rg): string => {
  const sel = `[data-ui="${id}"]`; const tw = o.thw ?? o.th; const mt = (o.tr - o.th) / 2;
  const trr = o.trackRadius ?? `${o.tr / 2}px`; const thr = o.thumbRadius ?? '50%'; const filled = !!o.fill;
  const shadow = [filled ? `-100vw 0 0 100vw ${o.fill}` : '', o.thumbShadow || ''].filter(Boolean).join(',') || 'none';
  const size = o.vertical ? `inline-size:100%;block-size:${o.tr}px` : `height:${o.tr}px`;
  const tsize = o.vertical ? `inline-size:${tw}px;block-size:${o.th}px;margin-inline-start:${mt}px` : `width:${tw}px;height:${o.th}px;margin-top:${mt}px`;
  const thumbCss = `box-sizing:border-box;background:${o.thumb};border:${o.thumbBorder || '0'};border-radius:${thr};${o.noPtr ? '' : ''}transition:transform .15s ease,box-shadow .15s ease`;
  return `${sel}{-webkit-appearance:none;appearance:none;background:transparent!important;border:0!important;padding:0!important;margin:0;cursor:pointer;flex:none;${filled ? `overflow:hidden;border-radius:${trr};${o.vertical ? `width:${o.tr}px!important` : `height:${o.tr}px!important`};` : ''}${o.vertical ? 'writing-mode:vertical-lr;direction:rtl;' : ''}${o.glow ? 'filter:drop-shadow(0 0 5px currentColor);' : ''}${o.extra || ''}}
${sel}::-webkit-slider-runnable-track{${size};background:${o.track};border-radius:${trr}}
${sel}::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;${tsize};${thumbCss};box-shadow:${shadow}}
${sel}::-moz-range-track{${size};background:${o.track};border-radius:${trr}}
${filled ? `${sel}::-moz-range-progress{${size};background:${o.fill};border-radius:${trr}}\n` : ''}${sel}::-moz-range-thumb{${tsize.replace(/margin-[a-z-]+:[^;]+;?/, '')};${thumbCss}}
${filled ? '' : `${sel}:hover::-webkit-slider-thumb{transform:scale(1.12)}\n${sel}:active::-webkit-slider-thumb{transform:scale(.94)}\n`}${sel}:focus-visible{outline:2px solid currentColor;outline-offset:4px}
${sel}:disabled{opacity:.45;cursor:not-allowed}`;
};
const GREY = '#e5e7eb';
const KNOB = 'radial-gradient(circle,currentColor 0 3px,#fff 3.5px)';
const dualEnd = (id: string, a: boolean) => rg(id, { tr: 14, th: 14, track: a ? 'transparent' : GREY, fill: a ? GREY : 'currentColor', thumb: KNOB, thumbShadow: '', extra: 'position:absolute;pointer-events:none;' })
  + `\n[data-ui="${id}"]::-webkit-slider-thumb{pointer-events:auto;cursor:grab}\n[data-ui="${id}"]::-moz-range-thumb{pointer-events:auto;cursor:grab}`;
const TICKS = (n: number, w: number, h: number) => `linear-gradient(90deg,#94a3b8 2px,transparent 2px) ${w / 2 - 1}px 100%/calc((100% - ${w}px)/${n}) ${h}px repeat-x`;
const DOTS = (n: number, w: number) => `radial-gradient(circle at 0 50%,#94a3b8 3.5px,transparent 4px) ${w / 2}px 50%/calc((100% - ${w}px)/${n}) 100% repeat-x,radial-gradient(circle at 100% 50%,#94a3b8 3.5px,transparent 4px) ${w / 2}px 50%/calc((100% - ${w}px)/${n}) 100% repeat-x`;
const LINE = (h: number, c = '#d1d5db') => `linear-gradient(${c},${c}) 0 50%/100% ${h}px no-repeat`;

const RANGES: Record<string, string> = {
  'rg-classic': `[data-ui="rg-classic"]{accent-color:currentColor;cursor:pointer;background:transparent!important;border:0!important;margin:0;padding:0!important}\n[data-ui="rg-classic"]:focus-visible{outline:2px solid currentColor;outline-offset:3px}`,
  'rg-thick': rg('rg-thick', { tr: 14, th: 14, track: GREY, fill: 'currentColor', thumb: KNOB }),
  'rg-slim': rg('rg-slim', { tr: 6, th: 6, track: GREY, fill: 'currentColor', thumb: 'currentColor' }),
  'rg-thin': rg('rg-thin', { tr: 3, th: 16, track: '#d1d5db', thumb: 'currentColor', thumbShadow: '0 1px 3px rgba(0,0,0,.25)' }),
  'rg-ring': rg('rg-ring', { tr: 6, th: 22, track: GREY, thumb: '#fff', thumbBorder: '3px solid currentColor', thumbShadow: '0 2px 6px rgba(15,23,42,.25)' }),
  'rg-square': rg('rg-square', { tr: 6, th: 18, track: GREY, trackRadius: '2px', thumb: 'currentColor', thumbRadius: '5px', thumbShadow: '0 1px 3px rgba(0,0,0,.3)' }),
  'rg-pillthumb': rg('rg-pillthumb', { tr: 6, th: 20, thw: 36, track: GREY, thumb: '#fff', thumbBorder: '1px solid #d1d5db', thumbRadius: '999px', thumbShadow: '0 2px 5px rgba(15,23,42,.25)' }),
  'rg-block': rg('rg-block', { tr: 16, th: 16, track: '#f1f5f9', trackRadius: '4px', fill: 'currentColor', thumb: '#fff', thumbBorder: '3px solid currentColor', thumbRadius: '4px' }),
  'rg-gradient': rg('rg-gradient', { tr: 10, th: 24, track: 'linear-gradient(90deg,#22d3ee,#6366f1 55%,#ec4899)', thumb: '#fff', thumbShadow: '0 2px 8px rgba(15,23,42,.35)' }),
  'rg-hue': rg('rg-hue', { tr: 12, th: 24, track: 'linear-gradient(90deg,#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#8b5cf6,#ec4899,#ef4444)', thumb: '#fff', thumbBorder: '4px solid #fff', thumbShadow: '0 0 0 1.5px rgba(15,23,42,.35),0 2px 6px rgba(15,23,42,.3)' }),
  'rg-temp': rg('rg-temp', { tr: 10, th: 22, track: 'linear-gradient(90deg,#60a5fa,#e5e7eb 50%,#fb923c)', thumb: '#fff', thumbShadow: '0 0 0 1.5px rgba(15,23,42,.3),0 2px 6px rgba(15,23,42,.25)' }),
  'rg-ticks': rg('rg-ticks', { tr: 34, th: 16, track: `${TICKS(10, 16, 8)},${LINE(4)}`, trackRadius: '0', thumb: 'currentColor', thumbBorder: '3px solid #fff', thumbShadow: '0 1px 4px rgba(15,23,42,.35)', extra: 'height:34px' }),
  'rg-steps': rg('rg-steps', { tr: 24, th: 18, track: `${DOTS(4, 18)},${LINE(4, '#e5e7eb')}`, trackRadius: '0', thumb: 'currentColor', thumbBorder: '3px solid #fff', thumbShadow: '0 1px 4px rgba(15,23,42,.35)' }),
  'rg-neon': rg('rg-neon', { tr: 10, th: 10, track: '#1e293b', fill: 'currentColor', thumb: '#fff', glow: true }),
  'rg-glass': rg('rg-glass', { tr: 18, th: 18, track: 'rgba(255,255,255,.28)', fill: 'rgba(255,255,255,.92)', thumb: '#fff', thumbBorder: '4px solid rgba(255,255,255,.95)', thumbShadow: '' }),
  'rg-dark': rg('rg-dark', { tr: 8, th: 8, track: '#334155', fill: 'currentColor', thumb: '#f8fafc' }),
  'rg-bar': rg('rg-bar', { tr: 44, th: 28, thw: 5, track: 'rgba(255,255,255,.16)', trackRadius: '16px', fill: '#fff', thumb: 'transparent' }),
  'rg-vert': rg('rg-vert', { tr: 6, th: 22, track: GREY, thumb: '#fff', thumbBorder: '3px solid currentColor', thumbShadow: '0 2px 6px rgba(15,23,42,.25)', vertical: true }),
  'rg-dual-a': dualEnd('rg-dual-a', true),
  'rg-dual-b': dualEnd('rg-dual-b', false),
  'rg-ico': `[data-ui~="rg-ico"]{pointer-events:none}`,
};

const APP: Record<string, string> = {};
const BLOCKS: Record<string, string> = {};

export const UI_APP: Record<string, string> = { ...RANGES, ...APP, ...BLOCKS };
