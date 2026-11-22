/**
 * Effects that any element can wear: glowing border beams and animated backgrounds.
 * They are applied from the Animation panel by adding a token to the element's `data-ui` attribute (`fx-beam-*`, `fx-bg-*`),
 * so they export with the page like every other component rule. Pseudo-elements carry the effect, so the element's own fill and content are untouched.
 */
export type Fx = { id: string; label: string; colors: string[] };

/** Border beams: a bright arc that travels around the edge, with a soft glow. */
export const BEAMS: Fx[] = [
  { id: 'fx-beam-indigo', label: 'Indigo', colors: ['#6366f1', '#a5b4fc'] },
  { id: 'fx-beam-aqua', label: 'Aqua', colors: ['#06b6d4', '#a5f3fc'] },
  { id: 'fx-beam-emerald', label: 'Emerald', colors: ['#10b981', '#a7f3d0'] },
  { id: 'fx-beam-amber', label: 'Amber', colors: ['#f59e0b', '#fde68a'] },
  { id: 'fx-beam-rose', label: 'Rose', colors: ['#f43f5e', '#fecdd3'] },
  { id: 'fx-beam-violet', label: 'Violet', colors: ['#8b5cf6', '#ddd6fe'] },
  { id: 'fx-beam-sunset', label: 'Sunset', colors: ['#f59e0b', '#ec4899'] },
  { id: 'fx-beam-ocean', label: 'Ocean', colors: ['#06b6d4', '#6366f1'] },
  { id: 'fx-beam-neon', label: 'Neon', colors: ['#22d3ee', '#d946ef'] },
  { id: 'fx-beam-white', label: 'White', colors: ['#ffffff', '#9ca3af'] },
  { id: 'fx-beam-rainbow', label: 'Rainbow', colors: ['#ef4444', '#3b82f6'] },
  { id: 'fx-beam-dual', label: 'Dual', colors: ['#6366f1', '#ec4899'] },
];

/** Animated backgrounds, drawn behind the element's content. `css` is the ::before background; `anim` its animation. */
export const BACKGROUNDS: (Fx & { css: string; anim: string; size?: string })[] = [
  { id: 'fx-bg-aurora', label: 'Aurora', colors: ['#6366f1', '#06b6d4'], css: 'radial-gradient(40% 50% at 20% 30%,rgba(99,102,241,.55),transparent),radial-gradient(40% 50% at 80% 20%,rgba(6,182,212,.5),transparent),radial-gradient(50% 50% at 60% 90%,rgba(236,72,153,.4),transparent)', anim: 'fx-drift 12s ease-in-out infinite alternate', size: '140% 140%' },
  { id: 'fx-bg-gradient', label: 'Gradient shift', colors: ['#6366f1', '#ec4899'], css: 'linear-gradient(120deg,#6366f1,#ec4899,#f59e0b,#06b6d4,#6366f1)', anim: 'fx-shift 10s linear infinite', size: '300% 300%' },
  { id: 'fx-bg-mesh', label: 'Mesh', colors: ['#f472b6', '#60a5fa'], css: 'radial-gradient(at 10% 20%,#fbcfe8,transparent 50%),radial-gradient(at 90% 10%,#bfdbfe,transparent 50%),radial-gradient(at 50% 100%,#ddd6fe,transparent 55%)', anim: 'fx-drift 14s ease-in-out infinite alternate', size: '130% 130%' },
  { id: 'fx-bg-grid', label: 'Moving grid', colors: ['#94a3b8', '#e2e8f0'], css: 'linear-gradient(rgba(148,163,184,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.35) 1px,transparent 1px)', anim: 'fx-grid 3s linear infinite', size: '32px 32px' },
  { id: 'fx-bg-dots', label: 'Dots', colors: ['#6366f1', '#c7d2fe'], css: 'radial-gradient(rgba(99,102,241,.5) 1.5px,transparent 1.6px)', anim: 'fx-grid 4s linear infinite', size: '22px 22px' },
  { id: 'fx-bg-stars', label: 'Stars', colors: ['#0f172a', '#e2e8f0'], css: 'radial-gradient(1.5px 1.5px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 80px 70px,#fff,transparent),radial-gradient(1.5px 1.5px at 130px 20px,#cbd5e1,transparent),radial-gradient(1px 1px at 50px 120px,#fff,transparent),#0f172a', anim: 'fx-twinkle 3s ease-in-out infinite alternate', size: '160px 160px' },
  { id: 'fx-bg-waves', label: 'Waves', colors: ['#38bdf8', '#0ea5e9'], css: 'repeating-linear-gradient(180deg,rgba(14,165,233,.16) 0 12px,rgba(56,189,248,.05) 12px 24px)', anim: 'fx-grid 3s linear infinite', size: '100% 24px' },
  { id: 'fx-bg-spotlight', label: 'Spotlight', colors: ['#fde68a', '#111827'], css: 'radial-gradient(circle at 50% 50%,rgba(250,204,21,.32),transparent 45%)', anim: 'fx-sweep 8s ease-in-out infinite alternate', size: '180% 180%' },
  { id: 'fx-bg-stripes', label: 'Stripes', colors: ['#6366f1', '#e0e7ff'], css: 'repeating-linear-gradient(45deg,rgba(99,102,241,.18) 0 14px,transparent 14px 28px)', anim: 'fx-grid 2.5s linear infinite', size: '40px 40px' },
  { id: 'fx-bg-sunset', label: 'Sunset glow', colors: ['#f59e0b', '#ec4899'], css: 'linear-gradient(160deg,#fde68a,#fb7185,#a78bfa,#fde68a)', anim: 'fx-shift 12s ease infinite', size: '300% 300%' },
  { id: 'fx-bg-ocean', label: 'Deep ocean', colors: ['#0ea5e9', '#312e81'], css: 'linear-gradient(200deg,#0c4a6e,#0e7490,#312e81,#0c4a6e)', anim: 'fx-shift 14s ease infinite', size: '300% 300%' },
  { id: 'fx-bg-noise', label: 'Shimmer', colors: ['#e5e7eb', '#ffffff'], css: 'linear-gradient(110deg,transparent 30%,rgba(148,163,184,.4) 50%,transparent 70%)', anim: 'fx-glint 3.2s ease-in-out infinite', size: '250% 100%' },
];

const PROP = `@property --beam-a{syntax:"<angle>";initial-value:0deg;inherits:false}
@keyframes fx-beam{to{--beam-a:360deg}}
@keyframes fx-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes fx-drift{0%{background-position:0% 0%}100%{background-position:100% 100%}}
@keyframes fx-grid{to{background-position:100% 100%}}
@keyframes fx-sweep{0%{background-position:0% 0%}100%{background-position:100% 100%}}
@keyframes fx-twinkle{0%{opacity:.55}100%{opacity:1}}
@keyframes fx-glint{0%{background-position:150% 0}100%{background-position:-50% 0}}`;

const beam = (b: Fx) => {
  const [a, c] = b.colors; const s = `[data-ui~="${b.id}"]`;
  const grad = b.id === 'fx-beam-rainbow'
    ? 'conic-gradient(from var(--beam-a),transparent 0 55%,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7 100%)'
    : `conic-gradient(from var(--beam-a),transparent 0 35%,${a} 70%,${c} 92%,transparent 100%)`;
  return `:where(${s}){position:relative}
${s}::before,${s}::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;padding:3px;background:${grad};animation:fx-beam 4s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
${s}::after{filter:blur(8px);opacity:.75}
@media (prefers-reduced-motion:reduce){${s}::before,${s}::after{animation:none}}`;
};
const bg = (b: (typeof BACKGROUNDS)[number]) => {
  const s = `[data-ui~="${b.id}"]`;
  return `:where(${s}){position:relative;isolation:isolate;overflow:hidden}
${s}::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;pointer-events:none;background:${b.css};background-size:${b.size || 'auto'};animation:${b.anim}}
@media (prefers-reduced-motion:reduce){${s}::before{animation:none}}`;
};

export const UI_FX: Record<string, string> = Object.fromEntries([
  ...BEAMS.map(b => [b.id, (b === BEAMS[0] ? PROP + '\n' : '') + beam(b)]),
  ...BACKGROUNDS.map(b => [b.id, bg(b)]),
]);
// the @property/keyframes block must ship with whichever effect is used first
for (const id of Object.keys(UI_FX)) if (id !== BEAMS[0].id) UI_FX[id] = PROP + '\n' + UI_FX[id];
export const fxIds = (v?: string | boolean): string[] => (typeof v === 'string' ? v.split(/\s+/).filter(x => x.startsWith('fx-')) : []);
