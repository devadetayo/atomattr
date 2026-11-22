/**
 * Library: loaders and animated buttons.
 *
 * Loaders are plain nodes (circles, bars, squares) that carry an `anim` preset with staggered delays, so they play in the
 * editor, in previews and in exports with no extra code, and every preset also shows up in the Animation panel.
 * Button hover and press effects use node states (lift, grow, glow, 3D press) and animation triggers (hover, click, loop);
 * the few effects that need a pseudo-element (sweep, shine, underline) use `data-ui` rules from document/ui-css.ts.
 */
import type { Anim, Node } from '../document/types';
import { mk } from '../document/factory';
import { stack, label, hint, iconNode, btnText, iconButton, BRAND, DARK, OUTLINE, DANGER, type KitItem } from './kit';

const ACCENT = '#4f46e5';
const A = (preset: string, duration = 1000, delay = 0, ease = 'ease-in-out', repeat = 0, trigger: Anim['trigger'] = 'load'): Anim => ({ preset, duration, delay, ease, repeat, trigger });
const withAnim = (n: Node, a: Anim): Node => ({ ...n, anim: a });
const part = (n: Node, p: string): Node => ({ ...n, attrs: { ...(n.attrs || {}), 'data-p': p } });

const blob = (name: string, w: number, h: number, radius: number, fill: string, anim?: Anim, style: Node['style'] = {}): Node =>
  mk('container', name, { mode: 'flow', w, h, grow: 0, shrink: 0, radius, fill, ...style } as Node['style'], anim ? { anim } : {});
/** A fixed-size box whose children sit at x / y inside it (for rings, orbits and circles of dots). */
const free = (name: string, w: number, h: number, kids: Node[], style: Node['style'] = {}): Node =>
  mk('container', name, { mode: 'flow', w, h, grow: 0, layout: 'free', ...style } as Node['style'], { children: kids });
const at = (n: Node, x: number, y: number): Node => ({ ...n, style: { ...n.style, mode: 'abs', x, y } });
const line = (name: string, kids: Node[], gap: number, minH = 0): Node => stack(name, 'row', kids, { w: 'auto', gap, items: 'center', justify: 'center', ...(minH ? { minH } : {}) } as Node['style']);
const arc = (name: string, size: number, color: string, anim: Anim, width = 3): Node => {
  const n = iconNode('loader-circle', size, color); n.name = name; n.style = { ...n.style, strokeWidth: width }; return { ...n, anim };
};
const dots = (name: string, n: number, size: number, gap: number, preset: string, color: string, duration: number, step: number): Node =>
  line(name, Array.from({ length: n }, (_, i) => blob(`Dot ${i + 1}`, size, size, 999, color, A(preset, duration, i * step))), gap, size * 3);

const wrapAround = (title: string, loader: Node): Node => stack(title, 'column', [loader, label(title, 14, 500, '#6b7280')], { w: 'auto', gap: 14, items: 'center' });

type L = { name: string; blurb: string; make: () => Node; section: string };
const LOADERS: L[] = [
  // ---- spinners
  { section: 'Spinners', name: 'Arc spinner', blurb: 'A thick arc turning. The default "something is loading" signal.', make: () => arc('Arc spinner', 40, ACCENT, A('spin', 800, 0, 'linear'), 3) },
  { section: 'Spinners', name: 'Gradient ring', blurb: 'A ring that fades from nothing to colour as it turns. Cut out of a conic gradient.',
    make: () => withAnim(stack('Gradient ring', 'row', [blob('Hole', 32, 32, 999, '#ffffff')], { w: 44, h: 44, minH: 44, justify: 'center', items: 'center', radius: 999, fill: 'conic-gradient(from 0deg, rgba(79,70,229,0) 0%, #4f46e5 100%)', grow: 0 } as Node['style']), A('spin', 900, 0, 'linear')) },
  { section: 'Spinners', name: 'Double arc', blurb: 'Two arcs turning in opposite directions, one inside the other.',
    make: () => free('Double arc', 48, 48, [withAnim(at(arc('Outer', 48, ACCENT, A('spin', 1200, 0, 'linear')), 0, 0), A('spin', 1200, 0, 'linear')), withAnim(at(arc('Inner', 28, '#ec4899', A('spin-rev', 900, 0, 'linear')), 10, 10), A('spin-rev', 900, 0, 'linear'))]) },
  { section: 'Spinners', name: 'Orbit', blurb: 'A dot circling a faint track. Quiet and precise.',
    make: () => free('Orbit', 48, 48, [at(blob('Track', 48, 48, 999, 'transparent', undefined, { stroke: '#e5e7eb', strokeWidth: 3 }), 0, 0), withAnim(at(free('Orbiter', 48, 48, [at(blob('Dot', 10, 10, 999, ACCENT), 19, 0)]), 0, 0), A('spin', 1100, 0, 'linear'))]) },
  { section: 'Spinners', name: 'Dot circle', blurb: 'Eight dots in a ring that light up one after another. The classic iOS-style spinner.',
    make: () => free('Dot circle', 48, 48, Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return at(blob(`Dot ${i + 1}`, 7, 7, 999, '#111827', A('dot-fade', 960, i * 120, 'linear')), Math.round(20.5 + Math.sin(a) * 19), Math.round(20.5 - Math.cos(a) * 19)); })) },
  { section: 'Spinners', name: 'Turning square', blurb: 'A square that spins, shrinks and spins on. Playful.', make: () => blob('Turning square', 28, 28, 7, ACCENT, A('square-turn', 1300)) },
  { section: 'Spinners', name: 'Hourglass', blurb: 'An hourglass that flips over and over. Good for "this may take a moment".',
    make: () => { const n = iconNode('hourglass', 34, '#111827'); n.name = 'Hourglass'; return withAnim(n, A('hourglass', 1800, 0, 'ease-in-out')); } },

  // ---- dots and bars
  { section: 'Dots and bars', name: 'Bouncing dots', blurb: 'Three dots jumping in turn.', make: () => dots('Bouncing dots', 3, 12, 8, 'dot-bounce', ACCENT, 1000, 160) },
  { section: 'Dots and bars', name: 'Fading dots', blurb: 'Dots that light up one after another.', make: () => dots('Fading dots', 3, 12, 8, 'dot-fade', '#111827', 1200, 200) },
  { section: 'Dots and bars', name: 'Growing dots', blurb: 'Dots that swell and shrink in sequence.', make: () => dots('Growing dots', 4, 14, 8, 'dot-scale', '#ec4899', 1200, 150) },
  { section: 'Dots and bars', name: 'Wave', blurb: 'Five dots rippling like a wave.', make: () => dots('Wave', 5, 10, 8, 'wave-y', '#0ea5e9', 1200, 120) },
  { section: 'Dots and bars', name: 'Equalizer', blurb: 'Five bars bouncing like a music level meter.',
    make: () => line('Equalizer', Array.from({ length: 5 }, (_, i) => blob(`Bar ${i + 1}`, 6, 34, 3, ACCENT, A('bar-grow', 1100, i * 110))), 5, 40) },
  { section: 'Dots and bars', name: 'Audio wave', blurb: 'Seven thin bars, each moving at its own pace.',
    make: () => line('Audio wave', [0, 240, 120, 360, 60, 300, 180].map((d, i) => blob(`Bar ${i + 1}`, 4, 30, 2, '#10b981', A('bar-grow', 900 + (i % 3) * 150, d))), 4, 36) },
  { section: 'Dots and bars', name: 'Grid wave', blurb: 'A 3 × 3 grid of squares swelling diagonally.',
    make: () => stack('Grid wave', 'column', [0, 1, 2].map(r => line(`Row ${r + 1}`, [0, 1, 2].map(c => blob(`Square ${r * 3 + c + 1}`, 12, 12, 3, ACCENT, A('dot-scale', 1300, (r + c) * 150))), 6)), { w: 'auto', gap: 6, items: 'center' }) },
  { section: 'Dots and bars', name: 'Loading text', blurb: 'The word "Loading" followed by three blinking dots.',
    make: () => line('Loading text', [label('Loading', 16, 600, '#111827'), ...[0, 1, 2].map(i => blob(`Dot ${i + 1}`, 5, 5, 999, '#111827', A('blink', 1200, i * 200), { marginT: 8 } as Node['style']))], 4) },

  // ---- rings and pulses
  { section: 'Pulses and rings', name: 'Ripple', blurb: 'Two rings spreading outward and fading, like a drop in water.',
    make: () => free('Ripple', 56, 56, [0, 650].map((d, i) => at(blob(`Ring ${i + 1}`, 56, 56, 999, 'transparent', A('ring-ripple', 1400, d, 'ease-out'), { stroke: ACCENT, strokeWidth: 3 } as Node['style']), 0, 0))) },
  { section: 'Pulses and rings', name: 'Radar ping', blurb: 'A steady dot with a ring that pings outward. Use it for "live" and "connecting".',
    make: () => free('Radar ping', 40, 40, [at(blob('Ring', 40, 40, 999, ACCENT, A('ping', 1400, 0, 'ease-out'), { opacity: 0.45 } as Node['style']), 0, 0), at(blob('Dot', 16, 16, 999, ACCENT), 12, 12)]) },
  { section: 'Pulses and rings', name: 'Heartbeat', blurb: 'A heart beating twice, then resting.', make: () => { const n = iconNode('heart', 34, '#ef4444'); n.name = 'Heartbeat'; n.style = { ...n.style, fill: '#ef4444' }; return withAnim(n, A('heartbeat', 1300, 0, 'ease-in-out')); } },
  { section: 'Pulses and rings', name: 'Bouncing ball', blurb: 'A ball bouncing with a shadow that squeezes under it.',
    make: () => stack('Bouncing ball', 'column', [blob('Ball', 22, 22, 999, ACCENT, A('ball-bounce', 800, 0, 'cubic-bezier(.3,0,.7,1)')), blob('Shadow', 22, 6, 999, '#111827', A('shadow-squash', 800, 0, 'cubic-bezier(.3,0,.7,1)'), { marginT: 34 } as Node['style'])], { w: 'auto', gap: 0, items: 'center', minH: 70 }) },

  // ---- progress and placeholders
  { section: 'Progress and skeletons', name: 'Indeterminate bar', blurb: 'A bar sliding along a track. Shows progress without a percentage.',
    make: () => stack('Indeterminate bar', 'row', [blob('Bar', 80, 6, 999, ACCENT, A('slide-bar', 1400, 0, 'ease-in-out'))], { w: 200, h: 6, minH: 6, grow: 0, radius: 999, fill: '#e5e7eb', overflow: 'hidden', justify: 'start', items: 'center', gap: 0 } as Node['style']) },
  { section: 'Progress and skeletons', name: 'Skeleton lines', blurb: 'Grey placeholder lines that breathe while text loads.',
    make: () => stack('Skeleton lines', 'column', [100, 92, 64].map((pct, i) => blob(`Line ${i + 1}`, Math.round(320 * pct / 100), 14, 7, '#e5e7eb', A('breathe', 1500, i * 150))), { w: 320, gap: 10, items: 'start' }) },
  { section: 'Progress and skeletons', name: 'Skeleton card', blurb: 'An avatar and three lines of text, all pulsing. Drop it where a card will appear.',
    make: () => stack('Skeleton card', 'row', [blob('Avatar', 48, 48, 999, '#e5e7eb', A('breathe', 1500)), stack('Lines', 'column', [blob('Line 1', 200, 14, 7, '#e5e7eb', A('breathe', 1500, 100)), blob('Line 2', 260, 12, 6, '#e5e7eb', A('breathe', 1500, 200)), blob('Line 3', 140, 12, 6, '#e5e7eb', A('breathe', 1500, 300))], { w: 'auto', gap: 10, items: 'start' })], { w: 'auto', gap: 16, pad: 18, radius: 14, stroke: '#e5e7eb', strokeWidth: 1, fill: '#ffffff', items: 'center' } as Node['style']) },
  { section: 'Progress and skeletons', name: 'Shimmer skeleton', blurb: 'Placeholder lines with a light band sweeping across, as seen in many apps while feeds load.',
    make: () => stack('Shimmer skeleton', 'column', [300, 240, 160].map((w, i) => mk('container', `Line ${i + 1}`, { mode: 'flow', w, h: 14, grow: 0, layout: 'free', radius: 7, fill: '#e5e7eb', overflow: 'hidden' } as Node['style'], { children: [at(blob('Shine', w, 14, 0, 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.85), rgba(255,255,255,0))', A('shimmer', 1400, i * 120, 'ease-in-out')), 0, 0)] })), { w: 'auto', gap: 10, items: 'start' }) },

  // ---- with a message
  { section: 'With a message', name: 'Spinner with message', blurb: 'A spinner over a short line of text. Centre it on an empty section.',
    make: () => wrapAround('Loading your dashboard', arc('Arc spinner', 40, ACCENT, A('spin', 800, 0, 'linear'), 3)) },
  { section: 'With a message', name: 'Typing indicator', blurb: 'A chat bubble with three bouncing dots, like "someone is typing".',
    make: () => stack('Typing indicator', 'row', [0, 1, 2].map(i => blob(`Dot ${i + 1}`, 7, 7, 999, '#6b7280', A('dot-bounce', 1000, i * 150))), { w: 'auto', gap: 5, padX: 16, padY: 14, radius: 18, radiusBL: 4, fill: '#f3f4f6', items: 'center', self: 'start' } as Node['style']) },
  { section: 'With a message', name: 'Loading card', blurb: 'A small floating card with a spinner and two lines. For "saving" and "uploading".',
    make: () => stack('Loading card', 'row', [arc('Arc spinner', 26, ACCENT, A('spin', 800, 0, 'linear'), 3), stack('Text', 'column', [label('Uploading photo…', 15, 700), hint('This will take a few seconds.')], { w: 'auto', gap: 2 })], { w: 'auto', gap: 14, pad: 18, radius: 14, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'lg', items: 'center', self: 'start' } as Node['style']) },
];
export const loaderItems: KitItem[] = LOADERS;

// ------------------------------------------------------------------ animated buttons
type Look = Parameters<typeof iconButton>[2];
const BTN_STYLE: Node['style'] = {};
const btn = (name: string, parts: Node[], look: Look, o: { style?: Node['style']; attrs?: Record<string, string | boolean>; ui?: string; anim?: Anim; states?: Node['states']; behavior?: Parameters<typeof iconButton>[5] } = {}): Node => {
  const b = iconButton(name, parts, look, { ...BTN_STYLE, ...(o.style || {}) }, { ...(o.attrs || {}), ...(o.ui ? { 'data-ui': o.ui } : {}) }, o.behavior);
  return { ...b, ...(o.anim ? { anim: o.anim } : {}), ...(o.states ? { states: { ...(b.states || {}), ...o.states } } : {}) };
};
const BTN: { section: string; name: string; blurb: string; make: () => Node }[] = [
  // ---- hover and press with states (editable in the States tab)
  { section: 'Hover and press', name: 'Lift on hover', blurb: 'Rises a little and throws a soft shadow.',
    make: () => btn('Lift button', [btnText('Get started', '#fff')], BRAND, { states: { hover: { fill: '#4338ca', translateY: -3, shadowCss: '0 14px 26px -8px rgba(79,70,229,.55)' }, active: { translateY: 0, shadowCss: '0 4px 10px -4px rgba(79,70,229,.5)' } } as Node['states'] }) },
  { section: 'Hover and press', name: 'Grow on hover', blurb: 'Swells slightly, and squeezes when pressed.',
    make: () => btn('Grow button', [btnText('Join the beta', '#fff')], DARK, { states: { hover: { scale: 1.06 }, active: { scale: 0.96 } } as Node['states'] }) },
  { section: 'Hover and press', name: '3D press button', blurb: 'A chunky button with a hard bottom edge that sinks when pressed.',
    make: () => btn('3D button', [btnText('Play now', '#fff')], BRAND, { style: { shadowCss: '0 6px 0 #3730a3', radius: 12, padY: 13, padX: 26 } as Node['style'], states: { hover: { translateY: -1, shadowCss: '0 7px 0 #3730a3' }, active: { translateY: 5, shadowCss: '0 1px 0 #3730a3' } } as Node['states'] }) },
  { section: 'Hover and press', name: 'Neon glow', blurb: 'A dark button with a cyan outline that lights up on hover.',
    make: () => btn('Neon button', [btnText('Connect wallet', '#22d3ee')], { fill: '#0b1220', hover: 'rgba(34,211,238,0.12)', color: '#22d3ee', stroke: '#22d3ee', ring: 'rgba(34,211,238,0.4)' }, { states: { hover: { fill: 'rgba(34,211,238,0.12)', shadowCss: '0 0 0 1px #22d3ee, 0 0 26px rgba(34,211,238,.65)' } } as Node['states'] }) },
  // ---- fill and shine effects (data-ui rules)
  { section: 'Fills and shine', name: 'Sweep fill', blurb: 'A dark fill sweeps in from the left on hover and the text turns white.',
    make: () => btn('Sweep button', [btnText('Read the story', '#111827')], OUTLINE, { ui: 'bt-sweep', style: { radius: 10 } as Node['style'] }) },
  { section: 'Fills and shine', name: 'Fill up', blurb: 'The button fills with colour from the bottom edge on hover.',
    make: () => btn('Fill-up button', [btnText('See pricing', ACCENT)], { fill: '#ffffff', hover: '#ffffff', color: ACCENT, stroke: ACCENT, ring: 'rgba(79,70,229,0.3)' }, { ui: 'bt-fillup', style: { color: ACCENT } as Node['style'] }) },
  { section: 'Fills and shine', name: 'Shine', blurb: 'A glossy highlight glides across the button on hover.',
    make: () => btn('Shine button', [btnText('Upgrade to Pro', '#fff')], BRAND, { ui: 'bt-shine' }) },
  { section: 'Fills and shine', name: 'Gradient flow', blurb: 'A slow, always-moving gradient. Eye-catching, so use it once per page.',
    make: () => btn('Gradient flow button', [btnText('Start free trial', '#fff')], { fill: 'linear-gradient(90deg, #6366f1, #ec4899, #f59e0b, #6366f1)', hover: 'linear-gradient(90deg, #6366f1, #ec4899, #f59e0b, #6366f1)', color: '#fff', ring: 'rgba(236,72,153,.35)' }, { ui: 'bt-flow' }) },
  { section: 'Fills and shine', name: 'Rainbow border', blurb: 'A dark button wrapped in a colour-cycling border.',
    make: () => btn('Rainbow border button', [btnText('Try it live', '#fff')], { fill: '#111827', hover: '#111827', color: '#fff', ring: 'rgba(99,102,241,.4)' }, { ui: 'bt-border-flow', style: { radius: 12 } as Node['style'] }) },
  // ---- icon and text motion
  { section: 'Icon and text motion', name: 'Arrow slides', blurb: 'The arrow nudges right on hover, hinting at "go on".',
    make: () => btn('Arrow button', [btnText('Continue', '#fff'), part(iconNode('arrow-right', 18, '#ffffff'), 'arrow')], DARK, { ui: 'bt-arrow' }) },
  { section: 'Icon and text motion', name: 'Text swap', blurb: 'The label rolls up and a second line rolls in from below.',
    make: () => btn('Text swap button', [part(btnText('Download', '#fff'), 'a'), part(btnText('Free · 4 MB', '#fff'), 'b')], DARK, { ui: 'bt-slide', style: { w: 170, padX: 0 } as Node['style'] }) },
  { section: 'Icon and text motion', name: 'Underline link', blurb: 'A text link whose underline draws from the left on hover.',
    make: () => btn('Underline link', [btnText('Explore the docs', '#111827')], { fill: 'transparent', hover: 'transparent', color: '#111827', ring: 'rgba(17,24,39,.2)' }, { ui: 'bt-underline', style: { padX: 0, padY: 8 } as Node['style'] }) },
  { section: 'Icon and text motion', name: 'Heartbeat on hover', blurb: 'The button beats like a heart when you point at it.',
    make: () => btn('Like button', [iconNode('heart', 18, '#ffffff'), btnText('Like', '#fff')], { fill: '#ef4444', hover: '#dc2626', color: '#fff', ring: 'rgba(239,68,68,.35)' }, { anim: A('heartbeat', 900, 0, 'ease-in-out', 1, 'hover') }) },
  // ---- attention
  { section: 'Attention', name: 'Pulse ring', blurb: 'A ring pulses outward from the button, asking to be pressed.',
    make: () => btn('Pulse button', [btnText('Book a demo', '#fff')], BRAND, { ui: 'bt-pulse' }) },
  { section: 'Attention', name: 'Live pulse', blurb: 'A red button with a pulsing ring. For "Go live" and "Record".',
    make: () => btn('Live button', [blobDot(), btnText('Go live', '#fff')], DANGER, { ui: 'bt-pulse-red' }) },
  { section: 'Attention', name: 'Bounce loop', blurb: 'Hops now and then. Strong, so keep it for one key call to action.',
    make: () => btn('Bounce button', [btnText('Claim your spot', '#fff')], BRAND, { anim: A('bounce', 2200, 0, 'ease-in-out', 0, 'load') }) },
  { section: 'Attention', name: 'Floating button', blurb: 'Drifts gently up and down, as if hovering.',
    make: () => btn('Floating button', [btnText('Explore', '#fff')], DARK, { anim: A('float', 2600, 0, 'ease-in-out', 0, 'load'), style: { shadow: 'lg' } as Node['style'] }) },
  // ---- on hover or click, using the animation presets
  { section: 'Hover and click animations', name: 'Tada on hover', blurb: 'A short celebratory wiggle when hovered.', make: () => btn('Tada button', [btnText('Say hello', '#fff')], BRAND, { anim: A('tada', 900, 0, 'ease-in-out', 1, 'hover') }) },
  { section: 'Hover and click animations', name: 'Shake on hover', blurb: 'A quick side to side shake. Fits a warning or "no".', make: () => btn('Shake button', [btnText('Delete project', '#fff')], DANGER, { anim: A('shake', 500, 0, 'ease-in-out', 1, 'hover') }) },
  { section: 'Hover and click animations', name: 'Rubber band on hover', blurb: 'Stretches and snaps back like elastic.', make: () => btn('Rubber button', [btnText('Stretch it', '#fff')], DARK, { anim: A('rubber', 800, 0, 'ease-in-out', 1, 'hover') }) },
  { section: 'Hover and click animations', name: 'Jello on hover', blurb: 'Wobbles like jelly.', make: () => btn('Jello button', [btnText('Wobble', '#fff')], { fill: '#8b5cf6', hover: '#7c3aed', color: '#fff', ring: 'rgba(139,92,246,.35)' }, { anim: A('jello', 900, 0, 'ease-in-out', 1, 'hover') }) },
  { section: 'Hover and click animations', name: 'Ripple on click', blurb: 'A ring spreads out from the button when pressed.', make: () => btn('Ripple button', [btnText('Press me', '#fff')], BRAND, { ui: 'bt-ripple', style: { color: '#6366f1' } as Node['style'] }) },
  { section: 'Hover and click animations', name: 'Celebrate on click', blurb: 'Plays the tada animation each time it is clicked.', make: () => btn('Celebrate button', [btnText('Mark as done', '#fff')], { fill: '#10b981', hover: '#059669', color: '#fff', ring: 'rgba(16,185,129,.35)' }, { anim: A('tada', 900, 0, 'ease-in-out', 1, 'click') }) },
  { section: 'Hover and click animations', name: 'Copy code button', blurb: 'Copies a promo code to the clipboard when clicked.',
    make: () => btn('Copy code button', [iconNode('copy', 18, '#111827'), btnText('WELCOME20', '#111827')], OUTLINE, { behavior: { role: 'copy', key: 'WELCOME20' } as never, states: { hover: { translateY: -2 } } as Node['states'] }) },
];
function blobDot(): Node { return blob('Live dot', 8, 8, 999, '#ffffff', A('blink', 1200)); }
export const animatedButtonItems: KitItem[] = BTN;
