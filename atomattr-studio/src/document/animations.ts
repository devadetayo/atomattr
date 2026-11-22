/**
 * Animation presets. A node carries a small `anim` description; it becomes an `animate` attribute (AtomAttr maps it to the CSS
 * `animation` property) plus a `data-ast-anim` marker. The keyframes below ship with every export that uses an animation
 * (they are appended to the behavior CSS), and the same keyframes are injected into the Studio so the previews are real.
 */
import type { Anim, AnimCustom, Node } from './types';

type Preset = { id: string; label: string; group: 'Entrance' | 'Attention' | 'Loop' | 'Exit'; frames: string };

export const ANIM_PRESETS: Preset[] = [
  { id: 'fade-in', label: 'Fade in', group: 'Entrance', frames: 'from{opacity:0}to{opacity:1}' },
  { id: 'fade-up', label: 'Fade up', group: 'Entrance', frames: 'from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}' },
  { id: 'fade-down', label: 'Fade down', group: 'Entrance', frames: 'from{opacity:0;transform:translateY(-32px)}to{opacity:1;transform:none}' },
  { id: 'fade-left', label: 'Fade left', group: 'Entrance', frames: 'from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}' },
  { id: 'fade-right', label: 'Fade right', group: 'Entrance', frames: 'from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}' },
  { id: 'zoom-in', label: 'Zoom in', group: 'Entrance', frames: 'from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}' },
  { id: 'slide-up', label: 'Slide up', group: 'Entrance', frames: 'from{transform:translateY(100%)}to{transform:none}' },
  { id: 'flip-x', label: 'Flip in X', group: 'Entrance', frames: 'from{opacity:0;transform:perspective(600px) rotateX(-90deg)}to{opacity:1;transform:perspective(600px) rotateX(0)}' },
  { id: 'flip-y', label: 'Flip in Y', group: 'Entrance', frames: 'from{opacity:0;transform:perspective(600px) rotateY(-90deg)}to{opacity:1;transform:perspective(600px) rotateY(0)}' },
  { id: 'rotate-in', label: 'Rotate in', group: 'Entrance', frames: 'from{opacity:0;transform:rotate(-12deg) scale(.9)}to{opacity:1;transform:none}' },
  { id: 'blur-in', label: 'Blur in', group: 'Entrance', frames: 'from{opacity:0;filter:blur(14px)}to{opacity:1;filter:blur(0)}' },
  { id: 'bounce-in', label: 'Bounce in', group: 'Entrance', frames: '0%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1.08)}70%{transform:scale(.95)}100%{opacity:1;transform:scale(1)}' },
  { id: 'shake', label: 'Shake', group: 'Attention', frames: '0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}30%{transform:translateX(9px)}45%{transform:translateX(-7px)}60%{transform:translateX(5px)}75%{transform:translateX(-3px)}' },
  { id: 'wobble', label: 'Wobble', group: 'Attention', frames: '0%,100%{transform:none}15%{transform:translateX(-12%) rotate(-5deg)}30%{transform:translateX(9%) rotate(3deg)}45%{transform:translateX(-6%) rotate(-3deg)}60%{transform:translateX(4%) rotate(2deg)}75%{transform:translateX(-2%) rotate(-1deg)}' },
  { id: 'pulse', label: 'Pulse', group: 'Attention', frames: '0%,100%{transform:scale(1)}50%{transform:scale(1.07)}' },
  { id: 'heartbeat', label: 'Heartbeat', group: 'Attention', frames: '0%,100%{transform:scale(1)}14%{transform:scale(1.14)}28%{transform:scale(1)}42%{transform:scale(1.14)}70%{transform:scale(1)}' },
  { id: 'bounce', label: 'Bounce', group: 'Attention', frames: '0%,20%,53%,100%{transform:translateY(0)}40%,43%{transform:translateY(-26px)}70%{transform:translateY(-12px)}90%{transform:translateY(-4px)}' },
  { id: 'swing', label: 'Swing', group: 'Attention', frames: '0%,100%{transform:rotate(0)}20%{transform:rotate(14deg)}40%{transform:rotate(-10deg)}60%{transform:rotate(6deg)}80%{transform:rotate(-4deg)}' },
  { id: 'tada', label: 'Tada', group: 'Attention', frames: '0%,100%{transform:scale(1) rotate(0)}10%,20%{transform:scale(.92) rotate(-4deg)}30%,50%,70%,90%{transform:scale(1.1) rotate(4deg)}40%,60%,80%{transform:scale(1.1) rotate(-4deg)}' },
  { id: 'jello', label: 'Jello', group: 'Attention', frames: '0%,100%{transform:none}22%{transform:skewX(-12deg) skewY(-12deg)}33%{transform:skewX(6deg) skewY(6deg)}44%{transform:skewX(-3deg) skewY(-3deg)}55%{transform:skewX(1.5deg) skewY(1.5deg)}' },
  { id: 'flash', label: 'Flash', group: 'Attention', frames: '0%,50%,100%{opacity:1}25%,75%{opacity:0}' },
  { id: 'rubber', label: 'Rubber band', group: 'Attention', frames: '0%,100%{transform:scale(1)}30%{transform:scale(1.25,.75)}40%{transform:scale(.75,1.25)}50%{transform:scale(1.15,.85)}65%{transform:scale(.95,1.05)}75%{transform:scale(1.05,.95)}' },
  { id: 'float', label: 'Float', group: 'Loop', frames: '0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}' },
  { id: 'spin', label: 'Spin', group: 'Loop', frames: 'from{transform:rotate(0)}to{transform:rotate(360deg)}' },
  { id: 'ping', label: 'Ping', group: 'Loop', frames: '0%{transform:scale(1);opacity:1}75%,100%{transform:scale(1.5);opacity:0}' },
  { id: 'breathe', label: 'Breathe', group: 'Loop', frames: '0%,100%{opacity:1}50%{opacity:.45}' },
  { id: 'spin-rev', label: 'Spin backwards', group: 'Loop', frames: 'from{transform:rotate(360deg)}to{transform:rotate(0)}' },
  { id: 'dot-bounce', label: 'Dot bounce', group: 'Loop', frames: '0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}' },
  { id: 'dot-fade', label: 'Dot fade', group: 'Loop', frames: '0%,39%,100%{opacity:.2}40%{opacity:1}' },
  { id: 'dot-scale', label: 'Dot scale', group: 'Loop', frames: '0%,80%,100%{transform:scale(.4);opacity:.5}40%{transform:scale(1);opacity:1}' },
  { id: 'bar-grow', label: 'Bar grow', group: 'Loop', frames: '0%,40%,100%{transform:scaleY(.4)}20%{transform:scaleY(1)}' },
  { id: 'ring-ripple', label: 'Ripple ring', group: 'Loop', frames: '0%{transform:scale(.15);opacity:1}100%{transform:scale(1);opacity:0}' },
  { id: 'slide-bar', label: 'Sliding bar', group: 'Loop', frames: '0%{transform:translateX(-100%)}100%{transform:translateX(250%)}' },
  { id: 'wave-y', label: 'Wave', group: 'Loop', frames: '0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-14px)}' },
  { id: 'blink', label: 'Blink', group: 'Loop', frames: '0%,100%{opacity:.2}50%{opacity:1}' },
  { id: 'square-turn', label: 'Square turn', group: 'Loop', frames: '0%{transform:rotate(0) scale(1)}50%{transform:rotate(90deg) scale(.6)}100%{transform:rotate(180deg) scale(1)}' },
  { id: 'ball-bounce', label: 'Ball bounce', group: 'Loop', frames: '0%,100%{transform:translateY(0)}50%{transform:translateY(-34px)}' },
  { id: 'shadow-squash', label: 'Shadow squash', group: 'Loop', frames: '0%,100%{transform:scaleX(1);opacity:.35}50%{transform:scaleX(.45);opacity:.12}' },
  { id: 'hourglass', label: 'Hourglass flip', group: 'Loop', frames: '0%{transform:rotate(0)}70%,100%{transform:rotate(180deg)}' },
  { id: 'shimmer', label: 'Shimmer', group: 'Loop', frames: '0%{transform:translateX(-100%)}100%{transform:translateX(100%)}' },
  { id: 'grow-x', label: 'Fill across', group: 'Loop', frames: '0%{transform:scaleX(0)}70%,100%{transform:scaleX(1)}' },
  { id: 'fade-out', label: 'Fade out', group: 'Exit', frames: 'from{opacity:1}to{opacity:0}' },
  { id: 'fade-out-down', label: 'Fade out down', group: 'Exit', frames: 'from{opacity:1;transform:none}to{opacity:0;transform:translateY(32px)}' },
  { id: 'zoom-out', label: 'Zoom out', group: 'Exit', frames: 'from{opacity:1;transform:none}to{opacity:0;transform:scale(.8)}' },
];

export const ANIM_GROUPS: Preset['group'][] = ['Entrance', 'Attention', 'Loop', 'Exit'];
export const ANIM_EASES: [string, string][] = [['ease-out', 'Ease out'], ['ease-in-out', 'Ease in-out'], ['ease-in', 'Ease in'], ['ease', 'Ease'], ['linear', 'Linear'], ['cubic-bezier(.34,1.56,.64,1)', 'Springy']];
/** Presets that loop by nature get "forever" as their default repeat. */
export const LOOPING = new Set(['float', 'spin', 'ping', 'breathe', 'spin-rev', 'dot-bounce', 'dot-fade', 'dot-scale', 'bar-grow', 'ring-ripple', 'slide-bar', 'wave-y', 'blink', 'square-turn', 'ball-bounce', 'shadow-squash', 'hourglass', 'shimmer', 'grow-x']);

export const animName = (id: string) => `ast-${id}`;
export const ANIM_KEYFRAMES = ANIM_PRESETS.map(p => `@keyframes ${animName(p.id)}{${p.frames}}`).join('\n');

/** Shipped with exports: keyframes, the "wait until visible" rule for scroll animations, and the reduced-motion opt-out. */
export const ANIM_CSS = `${ANIM_KEYFRAMES}
[data-ast-anim="scroll"]:not(.ast-in){animation-play-state:paused!important}
@media (prefers-reduced-motion:reduce){[data-ast-anim]{animation:none!important}}`;

/** Runs inside the exported page: starts scroll animations when the element comes into view. */
export const ANIM_JS = `(function () {
  var io = null;
  function show(e) { e.classList.add('ast-in'); }
  function scan() {
    var els = document.querySelectorAll('[data-ast-anim="scroll"]:not([data-ast-seen])');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(els, show); return; }
    if (!io) io = new IntersectionObserver(function (list) {
      list.forEach(function (x) { if (x.isIntersecting) { show(x.target); io.unobserve(x.target); } });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(els, function (e) { e.setAttribute('data-ast-seen', ''); io.observe(e); });
  }
  scan();
  document.addEventListener('DOMContentLoaded', scan);
  if (window.MutationObserver) new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();`;

/** Custom animations: the person picks the starting look; keyframes are generated from it and named by the values, so equal settings share one rule. */
export const CUSTOM_ID = 'custom';
export const customDefaults = (): AnimCustom => ({ opacity: 0, scale: 1, blur: 0, rotate: 0, x: 0, y: 40 });
const enc = (n: number) => String(Math.round(n * 100) / 100).replace('-', 'n').replace('.', 'p');
export const customName = (c: AnimCustom) => `ast-c-o${enc(c.opacity)}-s${enc(c.scale)}-b${enc(c.blur)}-r${enc(c.rotate)}-x${enc(c.x)}-y${enc(c.y)}`;
export const customRule = (c: AnimCustom) => `@keyframes ${customName(c)}{from{opacity:${c.opacity};transform:translate(${c.x}px,${c.y}px) scale(${c.scale}) rotate(${c.rotate}deg);filter:blur(${c.blur}px)}to{opacity:1;transform:none;filter:blur(0)}}`;
const injectedCustom = new Set<string>();
function ensureCustom(c: AnimCustom) {
  if (typeof document === 'undefined') return; const n = customName(c); if (injectedCustom.has(n)) return; injectedCustom.add(n);
  let el = document.querySelector('style[data-ast-custom]') as HTMLStyleElement | null;
  if (!el) { el = document.createElement('style'); el.setAttribute('data-ast-custom', ''); document.head.appendChild(el); }
  el.appendChild(document.createTextNode(customRule(c)));
}
/** Keyframes for every custom animation used under these roots; appended to the behavior CSS of an export. */
export function customKeyframes(roots: Node[]): string {
  const seen = new Map<string, string>();
  const walk = (n: Node) => { if (n.anim?.preset === CUSTOM_ID && n.anim.custom) seen.set(customName(n.anim.custom), customRule(n.anim.custom)); (n.children || []).forEach(walk); };
  roots.forEach(walk); return [...seen.values()].join('\n');
}
export const animIsValid = (a: Anim) => a.preset === CUSTOM_ID ? !!a.custom : ANIM_PRESETS.some(p => p.id === a.preset);

export const animDefaults = (preset: string): Anim => ({ preset, duration: 700, delay: 0, ease: 'ease-out', repeat: LOOPING.has(preset) ? 0 : 1, trigger: 'load' });

/** CSS `animation` shorthand value for a description. repeat 0 = forever. */
export const animValue = (a: Anim) => `${a.preset === CUSTOM_ID && a.custom ? (ensureCustom(a.custom), customName(a.custom)) : animName(a.preset)} ${Math.max(50, a.duration)}ms ${a.ease} ${Math.max(0, a.delay)}ms ${a.repeat === 0 ? 'infinite' : Math.max(1, a.repeat)} both`;

/** Editor: only the node being previewed animates, so the canvas never moves on its own. */
export const EDITOR_ANIM = { id: '' };

export function animAttrs(a: Anim, nodeId: string, editor: boolean): Record<string, string> {
  if (!animIsValid(a)) return {};
  if (editor) return EDITOR_ANIM.id === nodeId ? { animate: animValue(a) } : {};
  if (a.trigger === 'click') return { 'data-ast-click': animValue(a), 'data-ast-anim': 'click' };
  if (a.trigger === 'hover') return { 'hover-animate': animValue(a), 'data-ast-anim': 'hover' };
  return { animate: animValue(a), 'data-ast-anim': a.trigger };
}

export const usesAnim = (node: Node): boolean => !!node.anim || (node.children || []).some(usesAnim);

let injected = false;
/** Puts the keyframes into the Studio page once, so previews and canvas playback use the real animations. */
export function ensureKeyframes() {
  if (injected || typeof document === 'undefined') return; injected = true;
  const el = document.createElement('style'); el.setAttribute('data-ast-keyframes', ''); el.textContent = ANIM_KEYFRAMES; document.head.appendChild(el);
}
