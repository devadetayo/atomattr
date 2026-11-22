/**
 * Library: tooltips, modals, toasts and alerts.
 *
 * Tooltips are a wrapper plus a tip child (`data-ui="tt tt-top"`, tip marked `data-p="tip"`); the show / hide rules live in
 * document/ui-css-overlays.ts, everything visible about a tip (fill, text, radius, padding, shadow, blur) is ordinary node style.
 * Modals, drawers and toasts are Panel behaviors (a trigger with role Open, a panel with Modal / Dismiss), so they really open
 * and close in previews and exports: Close buttons, a click outside and Escape all work. Alerts are plain nodes; dismissible
 * ones are panels that start open with a Close button.
 */
import type { Node } from '../document/types';
import { makeHeading, makeInput, mk } from '../document/factory';
import { stack, label, hint, btnText, iconButton, textBtn, scope, panel, STOCK, BRAND, DARK, OUTLINE, SOFT, DANGER, GHOST, type KitItem } from './kit';
import { switchItems } from './kit-controls';

type St = NonNullable<Node['style']>;
const ACCENT = '#4f46e5';
let seq = 0; const uid = (p: string) => `${p}-${++seq}`;

/** Stroked icon paths (24 × 24 grid), kept here so this file needs nothing from the shared icon list. */
const D = {
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  tick: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  xcircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6',
  close: 'M18 6 6 18M6 6l12 12',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  search: 'M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  play: 'M7 4l13 8-13 8z',
  cart: 'M6 6h15l-1.5 9h-12zM6 6L5 2H2M9 20.5h.01M18 20.5h.01',
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z',
  wifi: 'M5 12.55a11 11 0 0 1 14 0M1.4 9a16 16 0 0 1 21.2 0M8.5 16.1a6 6 0 0 1 7 0M12 20h.01',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  mail: 'M3 5h18v14H3zM3 7l9 6 9-6',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z',
  cookie: 'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5zM8.5 9h.01M16 15.5h.01M11 13h.01M8 14.5h.01',
  command: 'M15 9V6a3 3 0 1 1 3 3zM15 15v3a3 3 0 1 0 3-3zM9 9V6a3 3 0 1 0-3 3zM9 15v3a3 3 0 1 1-3-3zM9 9h6v6H9z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  home: 'M3 10.5 12 3l9 7.5V21H3zM9 21v-7h6v7',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
} as const;
type IconKey = keyof typeof D;
const icon = (k: IconKey, size = 18, color = '#111827', w = 2): Node =>
  mk('path', `${k[0].toUpperCase()}${k.slice(1)} icon`, { mode: 'flow', w: size, h: size, grow: 0, stroke: color, strokeWidth: w } as St, { svgD: D[k], vw: 24, vh: 24, pts: [], closed: false });

const pinned = (n: Node, dir: 'row' | 'column' = 'row'): Node => ({ ...n, bp: { ...(n.bp || {}), tablet: { ...(n.bp?.tablet || {}), dir }, mobile: { ...(n.bp?.mobile || {}), dir } } });
const withAttrs = (n: Node, a: Record<string, string | boolean>): Node => ({ ...n, attrs: { ...(n.attrs || {}), ...a } });
const txt = (t: string, size = 14, color = '#4b5563', weight = 400, o: St = {}): Node => { const n = label(t, size, weight, color); n.style = { ...n.style, lineHeight: 1.5, ...o } as St; return n; };
const head = (t: string, size = 22, color = '#111827'): Node => { const h = makeHeading(0, 0, t, size); h.style = { ...h.style, w: 'auto', color, align: 'left' } as St; return h; };
const dot = (size: number, fill: string, o: St = {}): Node => mk('container', 'Dot', { mode: 'flow', w: size, h: size, minH: size, grow: 0, shrink: 0, radius: 999, fill, ...o } as St);
const circle = (size: number, fill: string, kid: Node): Node => stack('Icon circle', 'row', [kid], { w: size, h: size, minH: size, grow: 0, shrink: 0, radius: 999, fill, justify: 'center', items: 'center', gap: 0 } as St);
const photo = (key: keyof typeof STOCK, w: number | 'fill', h: number, radius = 12, o: St = {}): Node => mk('container', 'Photo', { mode: 'flow', w, h, minH: h, grow: 0, radius, fill: '#e5e7eb', fillImg: STOCK[key].id, bgSize: 'cover', bgPos: 'center', bgRepeat: 'no-repeat', ...o } as St);
const field = (kind: 'text' | 'email' | 'password' | 'textarea', name: string, ph: string, h?: number): Node => {
  const n = makeInput(kind, name, ph);
  n.style = { ...n.style, mode: 'flow', w: 'fill', h: h ?? (kind === 'textarea' ? 96 : 44), radius: 10, padX: 14, padY: kind === 'textarea' ? 12 : 0, fontSize: 15, fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1, color: '#111827' } as St;
  n.states = { focus: { stroke: ACCENT, shadowCss: '0 0 0 3px rgba(79,70,229,0.18)' } } as Node['states'];
  n.attrs = { ...(n.attrs || {}), 'aria-label': ph || name, outline: 'none' };
  return n;
};
const labelled = (t: string, input: Node): Node => stack(t, 'column', [txt(t, 14, '#374151', 600), input], { w: 'fill', gap: 6 });
const btn = (t: string, look: Parameters<typeof iconButton>[2], behavior?: Parameters<typeof iconButton>[5], st: St = {}, iconKey?: IconKey): Node =>
  iconButton(t, [...(iconKey ? [icon(iconKey, 16, look.color)] : []), btnText(t, look.color)], look, { self: 'auto', ...st } as St, {}, behavior);

// ================================================================= TOOLTIPS
type TipLook = { fill: string; color: string; muted: string; stroke?: string; shadow?: 'sm' | 'md' | 'lg'; blur?: number };
const LOOK: Record<string, TipLook> = {
  dark: { fill: '#111827', color: '#ffffff', muted: '#9ca3af' },
  light: { fill: '#ffffff', color: '#111827', muted: '#6b7280', stroke: '#e5e7eb', shadow: 'md' },
  glass: { fill: 'rgba(17,24,39,0.55)', color: '#ffffff', muted: '#d1d5db', stroke: 'rgba(255,255,255,0.22)', blur: 14 },
  glassLight: { fill: 'rgba(255,255,255,0.62)', color: '#111827', muted: '#4b5563', stroke: 'rgba(255,255,255,0.7)', shadow: 'md', blur: 14 },
  gradient: { fill: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', color: '#ffffff', muted: '#e0e7ff' },
  brand: { fill: '#4f46e5', color: '#ffffff', muted: '#c7d2fe' },
  success: { fill: '#047857', color: '#ffffff', muted: '#a7f3d0' },
  error: { fill: '#b91c1c', color: '#ffffff', muted: '#fecaca' },
  warning: { fill: '#b45309', color: '#ffffff', muted: '#fde68a' },
};
const tipBox = (look: TipLook, kids: Node[], id: string, st: St = {}, tag?: string): Node => {
  const n = stack('Tooltip', 'column', kids, { w: 'auto', gap: 3, padX: 12, padY: 8, radius: 8, fill: look.fill, ...(look.stroke ? { stroke: look.stroke, strokeWidth: 1 } : {}), shadow: look.shadow || 'md', ...(look.blur ? { bgBlur: look.blur } : {}), items: 'start', ...st } as St);
  return { ...n, ...(tag ? { tag } : {}), attrs: { 'data-p': 'tip', role: 'tooltip', id } };
};
const tipText = (look: TipLook, t: string, size = 13, weight = 500): Node => txt(t, size, look.color, weight, { lineHeight: 1.4 } as St);
const ttWrap = (name: string, trigger: Node, tip: Node, tokens: string): Node => {
  const id = String(tip.attrs?.id);
  return stack(name, 'row', [withAttrs(trigger, { 'aria-describedby': id }), tip], { w: 'auto', self: 'start', items: 'center', gap: 0, position: 'relative' } as St, { attrs: { 'data-ui': `tt ${tokens}` }, bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } });
};
const trig = (t = 'Hover or focus me', look: Parameters<typeof iconButton>[2] = OUTLINE): Node => btn(t, look);
const simpleTip = (text: string, tokens: string, lookKey = 'dark', trigger: Node = trig(), name = 'Tooltip'): Node => {
  const id = uid('tip'); const l = LOOK[lookKey];
  return ttWrap(name, trigger, tipBox(l, [tipText(l, text)], id), tokens);
};
const infoBtn = (color = '#6b7280', name = 'More info'): Node => withAttrs(iconButton(name, [icon('info', 18, color)], { fill: 'transparent', hover: '#f3f4f6', color, ring: 'rgba(79,70,229,0.35)' }, { w: 32, h: 32, padX: 0, padY: 0, radius: 999, self: 'auto' } as St), { 'aria-label': name });
const avatar = (size = 40, initials = 'AL', fill = 'linear-gradient(135deg, #818cf8, #f472b6)'): Node => withAttrs(stack('Avatar', 'row', [label(initials, Math.round(size * 0.36), 700, '#ffffff')], { w: size, h: size, minH: size, grow: 0, shrink: 0, radius: 999, fill, justify: 'center', items: 'center', gap: 0 } as St), { tabindex: '0', 'aria-label': 'Ada Lovelace' });
const kbd = (k: string, look: TipLook): Node => { const n = stack('Key', 'row', [label(k, 11, 600, look.color)], { w: 'auto', padX: 6, padY: 2, radius: 4, fill: 'rgba(255,255,255,0.16)', gap: 0, justify: 'center' } as St); return withAttrs(n, { 'data-p': 'key' }); };

const PLACE: [string, string][] = [['tt-top', 'Top'], ['tt-bottom', 'Bottom'], ['tt-left', 'Left'], ['tt-right', 'Right'], ['tt-top-start', 'Top, aligned left'], ['tt-top-end', 'Top, aligned right'], ['tt-bottom-start', 'Bottom, aligned left']];
const LOOKS: [string, string, string][] = [
  ['dark', 'Dark', 'The standard: near-black with white text. Reads on any background.'],
  ['light', 'Light with shadow', 'White with a hairline border and soft shadow. Feels calm on tinted pages.'],
  ['glass', 'Dark glass', 'Translucent and blurred, so the page softly shows through.'],
  ['glassLight', 'Frosted glass', 'Pale frosted glass with a bright edge.'],
  ['gradient', 'Gradient', 'Indigo to pink. For highlights and new features.'],
  ['brand', 'Brand colour', 'Solid accent colour. Change Fill on the tip to match your brand.'],
  ['success', 'Success', 'Green, for confirmations and good news.'],
  ['error', 'Error', 'Red, for problems and validation hints.'],
  ['warning', 'Warning', 'Amber, for cautions.'],
];
const LOOK_TEXT: Record<string, string> = { dark: 'Save your changes', light: 'Visible to everyone', glass: 'Synced 2 minutes ago', glassLight: 'Shared with your team', gradient: 'New: try the editor', brand: 'Pinned to the top', success: 'Payment confirmed', error: 'Password is too short', warning: 'This cannot be undone' };

const richCard = (): Node => {
  const id = uid('tip'); const l = LOOK.light;
  return ttWrap('Rich tooltip', trig('What is a workspace?'), tipBox(l, [tipText(l, 'Workspaces', 14, 700), txt('A shared home for your projects, people and billing.', 13, l.muted), txt('Learn more →', 13, ACCENT, 600)], id, { w: 'auto', gap: 4, pad: 14, radius: 12 } as St), 'tt-bottom-start');
};
const profileCard = (): Node => {
  const id = uid('tip'); const l = LOOK.light;
  const body = stack('Profile', 'column', [
    stack('Who', 'row', [avatar(44), stack('Name', 'column', [tipText(l, 'Ada Lovelace', 14, 700), txt('Staff engineer · Lagos', 12, l.muted)], { w: 'auto', gap: 1 })], { w: 'auto', gap: 10 }),
    stack('Numbers', 'row', [stack('A', 'column', [tipText(l, '1,204', 14, 700), txt('Followers', 12, l.muted)], { w: 'auto', gap: 0 }), stack('B', 'column', [tipText(l, '86', 14, 700), txt('Projects', 12, l.muted)], { w: 'auto', gap: 0 })], { w: 'auto', gap: 22 }),
    btn('Follow', BRAND, undefined, { padY: 8, w: 'fill' } as St),
  ], { w: 'auto', gap: 12 });
  const trigger = withAttrs(txt('@ada', 15, ACCENT, 600), { tabindex: '0' }); trigger.href = '#';
  return ttWrap('Profile hover card', trigger, tipBox(l, [body], id, { pad: 14, radius: 14, minW: 220 } as St), 'tt-bottom-start');
};

const tooltipList: (KitItem & { section: string })[] = [];
PLACE.forEach(([tok, name]) => tooltipList.push({ section: 'Placement', name: `Tooltip, ${name.toLowerCase()}`, blurb: `Appears ${name.toLowerCase()} of the element on hover and on keyboard focus, with an arrow. ${tok.includes('left') || tok.includes('right') ? (tok === 'tt-left' || tok === 'tt-right' ? 'On phones it moves above the element so it never runs off the screen.' : 'Use it near the screen edge so the tip does not clip.') : ''}`.trim(), make: () => simpleTip('Save your changes', tok, 'dark', trig(), `Tooltip ${name}`) }));
LOOKS.forEach(([k, name, blurb]) => tooltipList.push({ section: 'Looks', name: `Tooltip, ${name.toLowerCase()}`, blurb, make: () => simpleTip(LOOK_TEXT[k], 'tt-top', k, trig('Hover me', k === 'gradient' ? { fill: '#eef2ff', hover: '#e0e7ff', color: '#4338ca' } : OUTLINE), `Tooltip ${name}`) }));
tooltipList.push(
  { section: 'On elements', name: 'Info icon tooltip', blurb: 'A small (i) button that explains a setting. Keyboard users get it on focus.', make: () => simpleTip('Shown on your public profile.', 'tt-top', 'dark', infoBtn(), 'Info tooltip') },
  { section: 'On elements', name: 'Help beside a label', blurb: 'A field label with a (?) that explains what to type.',
    make: () => { const l = LOOK.dark; const id = uid('tip'); const q = withAttrs(iconButton('Help', [icon('help', 16, '#6b7280')], { fill: 'transparent', hover: '#f3f4f6', color: '#6b7280' }, { w: 24, h: 24, padX: 0, padY: 0, radius: 999, self: 'auto' } as St), { 'aria-label': 'Help' });
      return stack('Label help', 'column', [stack('Label row', 'row', [txt('Password', 14, '#374151', 600), ttWrap('Help tip', q, tipBox(l, [tipText(l, 'Use 8 or more characters with a number.')], id), 'tt-top-start')], { w: 'auto', gap: 4 }), field('password', 'password', '••••••••')], { w: 320, gap: 6 }); } },
  { section: 'On elements', name: 'Term with dotted underline', blurb: 'A word in a sentence that explains itself on hover. Good for jargon.',
    make: () => { const l = LOOK.dark; const id = uid('tip'); const term = withAttrs(txt('API key', 15, '#111827', 600, { borderB: 1, stroke: '#9ca3af' } as St), { tabindex: '0' });
      return stack('Sentence', 'row', [txt('Paste your', 15), ttWrap('Term tip', term, tipBox(l, [tipText(l, 'A secret code that lets an app talk to ours.')], id), 'tt-top'), txt('below.', 15)], { w: 'auto', gap: 5, wrap: true } as St); } },
  { section: 'On elements', name: 'Avatar with name', blurb: 'Pointing at an avatar shows who it is. Useful in avatar stacks.', make: () => { const l = LOOK.dark; const id = uid('tip'); return ttWrap('Avatar tooltip', avatar(), tipBox(l, [tipText(l, 'Ada Lovelace', 13, 700), txt('Admin · Online', 12, l.muted)], id), 'tt-top'); } },
  { section: 'On elements', name: 'Status dot', blurb: 'A coloured dot that says what the status means.', make: () => { const l = LOOK.dark; const id = uid('tip'); const d = withAttrs(dot(12, '#22c55e', { shadowCss: '0 0 0 4px rgba(34,197,94,0.22)' } as St), { tabindex: '0', 'aria-label': 'Online' }); return stack('Status', 'row', [ttWrap('Dot tooltip', d, tipBox(l, [tipText(l, 'Online since 9:41')], id), 'tt-top'), txt('Server 3', 14, '#374151', 500)], { w: 'auto', gap: 10 }); } },
  { section: 'On elements', name: 'Badge with explanation', blurb: 'A Beta badge that explains what Beta means.', make: () => { const b = withAttrs(stack('Badge', 'row', [label('Beta', 12, 700, '#4338ca')], { w: 'auto', padX: 10, padY: 3, radius: 999, fill: '#e0e7ff', gap: 0 } as St), { tabindex: '0' }); return simpleTip('Still being polished. Feedback welcome.', 'tt-top', 'dark', b, 'Badge tooltip'); } },
  { section: 'On elements', name: 'Disabled button reason', blurb: 'Explains why a button is switched off.', make: () => { const b = btn('Publish', BRAND); b.attrs = { ...(b.attrs || {}), disabled: true }; return simpleTip('Add a title before publishing.', 'tt-top', 'dark', b, 'Disabled tooltip'); } },
  { section: 'On elements', name: 'Icon toolbar with labels', blurb: 'A row of icon buttons, each naming itself on hover. Tips drop below so they never cover the row.',
    make: () => { const l = LOOK.dark; const items: [IconKey, string][] = [['user', 'Profile'], ['bell', 'Alerts'], ['share', 'Share'], ['settings', 'Settings']];
      return stack('Icon toolbar', 'row', items.map(([k, t]) => ttWrap(`${t} tip`, withAttrs(iconButton(t, [icon(k, 18, '#374151')], { fill: 'transparent', hover: '#f3f4f6', color: '#374151', ring: 'rgba(79,70,229,0.35)' }, { w: 40, h: 40, padX: 0, padY: 0, radius: 10, self: 'auto' } as St), { 'aria-label': t }), tipBox(l, [tipText(l, t)], uid('tip')), 'tt-bottom')), { w: 'auto', gap: 4, padX: 6, padY: 6, radius: 12, stroke: '#e5e7eb', strokeWidth: 1, fill: '#ffffff' } as St); } },
  { section: 'On elements', name: 'Copy button with confirmation', blurb: 'Says "Copy to clipboard", then "Copied!" after the click. Uses the Copy text behavior.',
    make: () => { const l = LOOK.dark; const id = uid('tip');
      const tip = tipBox(l, [withAttrs(tipText(l, 'Copy to clipboard'), { 'data-p': 'l' }), withAttrs(tipText(l, 'Copied!'), { 'data-p': 'd' })], id, {}, 'span');
      const b = iconButton('Copy button', [icon('copy', 16, '#111827'), btnText('hello@brand.com', '#111827')], OUTLINE, { position: 'relative' } as St, { 'data-ui': 'tt tt-top tt-copy', 'aria-describedby': id }, { role: 'copy', key: 'hello@brand.com' });
      return { ...b, children: [...(b.children || []), { ...tip, style: { ...tip.style, mode: 'flow' as const } }] }; } },
  // ---- rich
  { section: 'Rich tooltips', name: 'Info card', blurb: 'A title, a sentence and a "Learn more" link. Stays open while the pointer is on it, so the link is clickable.', make: richCard },
  { section: 'Rich tooltips', name: 'Profile hover card', blurb: 'A mini profile with numbers and a Follow button, shown when you point at a username.', make: profileCard },
  { section: 'Rich tooltips', name: 'Keyboard shortcut', blurb: 'The action name plus its keys as small key caps.', make: () => { const l = LOOK.dark; const id = uid('tip'); return ttWrap('Shortcut tooltip', trig('Save', BRAND), tipBox(l, [stack('Row', 'row', [tipText(l, 'Save changes'), stack('Keys', 'row', [kbd('⌘', l), kbd('S', l)], { w: 'auto', gap: 3 })], { w: 'auto', gap: 10 })], id), 'tt-bottom tt-kbd'); } },
  { section: 'Rich tooltips', name: 'Image preview', blurb: 'Pointing at a link shows a picture of where it goes. Uses a placeholder photo you can swap.', make: () => { const l = LOOK.dark; const id = uid('tip'); const t = withAttrs(txt('Yosemite guide', 15, ACCENT, 600), { tabindex: '0' }); t.href = '#'; return ttWrap('Preview tooltip', t, tipBox(l, [photo('mountains', 200, 110, 6), tipText(l, 'Valley sunrise, 4 min read', 12, 500)], id, { pad: 6, gap: 6, radius: 10 } as St), 'tt-top-start'); } },
  { section: 'Rich tooltips', name: 'Stat tooltip', blurb: 'A figure with a trend, on frosted glass. For charts and tables.', make: () => { const l = LOOK.glass; const id = uid('tip'); const b = withAttrs(dot(14, ACCENT), { tabindex: '0', 'aria-label': 'Monday revenue' }); return stack('Stat', 'row', [ttWrap('Stat tip', b, tipBox(l, [tipText(l, 'Monday', 12, 500), tipText(l, '$12,480', 18, 800), txt('▲ 8.2% vs last week', 12, '#86efac', 600)], id, { pad: 12, gap: 2 } as St), 'tt-top'), txt('Revenue', 14, '#374151', 500)], { w: 'auto', gap: 10 }); } },
  { section: 'Rich tooltips', name: 'Checklist tooltip', blurb: 'A short list of what is included, with ticks.', make: () => { const l = LOOK.light; const id = uid('tip'); return ttWrap('Checklist tooltip', trig("What's included?"), tipBox(l, [tipText(l, 'Pro plan', 13, 700), ...['Unlimited projects', 'Custom domains', 'Priority support'].map(t => stack('Item', 'row', [icon('tick', 14, '#059669', 2.5), tipText(l, t, 13, 500)], { w: 'auto', gap: 8 }))], id, { gap: 6, pad: 14, radius: 12 } as St), 'tt-bottom'); } },
  { section: 'Rich tooltips', name: 'Onboarding coach mark', blurb: 'A coloured tip that points at a new feature with a title and step count. Pops in.', make: () => { const l = LOOK.brand; const id = uid('tip'); return ttWrap('Coach mark', btn('Share', DARK, undefined, {}, 'share'), tipBox(l, [txt('STEP 1 OF 3', 11, l.muted, 700), tipText(l, 'Invite your team', 14, 700), txt('Share a link and work together live.', 13, l.muted)], id, { pad: 14, radius: 12, gap: 3 } as St), 'tt-bottom-start tt-pop'); } },
  { section: 'Rich tooltips', name: 'Tooltip with icon', blurb: 'A warning icon beside the message.', make: () => { const l = LOOK.error; const id = uid('tip'); return ttWrap('Icon tooltip', trig('Delete account', { fill: '#fef2f2', hover: '#fee2e2', color: '#b91c1c', stroke: '#fecaca' }), tipBox(l, [stack('Row', 'row', [icon('alert', 16, '#ffffff'), tipText(l, 'This cannot be undone.')], { w: 'auto', gap: 8 })], id), 'tt-top tt-pop'); } },
  { section: 'Rich tooltips', name: 'Two-line tooltip', blurb: 'A bold line and a muted one, with no arrow.', make: () => { const l = LOOK.dark; const id = uid('tip'); return ttWrap('Two-line tooltip', trig('Storage'), tipBox(l, [tipText(l, '6.2 GB of 10 GB', 13, 700), txt('Upgrade for more space', 12, l.muted)], id), 'tt-bottom tt-flat'); } },
);
export const tooltipItems: KitItem[] = tooltipList;



// ------------------------------------------------------------------ modals
const GLASS: St = { fill: 'rgba(255,255,255,0.72)', bgBlur: 22, stroke: 'rgba(255,255,255,0.7)', strokeWidth: 1, shadowCss: '0 24px 60px -12px rgba(15,23,42,0.35)' } as St;
const opener = (t: string, key: string, look = BRAND): Node => iconButton(t, [btnText(t, look === OUTLINE ? '#111827' : '#ffffff')], look, { self: 'start' }, {}, { role: 'open', key });
const closeBtn = (): Node => iconButton('Close', [icon('close', 18, '#6b7280')], { fill: 'transparent', hover: '#f3f4f6', color: '#6b7280', ring: 'rgba(107,114,128,0.3)' }, { w: 36, h: 36, padX: 0, padY: 0, radius: 999 } as St, { 'aria-label': 'Close dialog' }, { role: 'close' });
const doneBtn = (t: string, look = BRAND, st: St = {}): Node => iconButton(t, [btnText(t, look === OUTLINE || look === GHOST || look === SOFT ? '#111827' : '#ffffff')], look, { padY: 11, ...st } as St, {}, { role: 'close' });
const dlg = (name: string, kids: Node[], o: { w?: number; st?: St } = {}): Node => stack(name, 'column', kids, { w: o.w ?? 440, maxW: o.w ?? 440, gap: 14, pad: 28, radius: 18, fill: '#ffffff', shadow: 'lg', ...(o.st || {}) } as St);
const overlay = (dialog: Node, key: string, o: { justify?: 'start' | 'center' | 'end'; items?: 'start' | 'center' | 'end' | 'stretch'; fill?: string; dir?: 'row' | 'column'; blur?: number; pad?: number } = {}): Node =>
  withAttrs(panel('Overlay', [dialog], { key, modal: true, dismiss: true }, { position: 'fixed', inset: 0, justify: o.justify ?? 'center', items: o.items ?? 'center', fill: o.fill ?? 'rgba(15,23,42,0.5)', w: 'fill', h: 'fill', pad: o.pad ?? 16, ...(o.blur ? { bgBlur: o.blur } : {}) } as St, o.dir ?? 'column'), { z: '1000' });
const modalOf = (name: string, trigger: Node, ov: Node): Node => scope(name, 'column', [trigger, ov], { w: 'auto' });
const heading2 = (t: string, sub: string, align: 'left' | 'center' = 'left'): Node => stack('Heading', 'column', [head(t, 22), txt(sub, 15, '#6b7280', 400, align === 'center' ? { align: 'center' } as St : {})], { w: 'fill', gap: 6, items: align === 'center' ? 'center' : 'stretch' } as St);
const titleBar = (t: string): Node => stack('Title bar', 'row', [head(t, 20), closeBtn()], { w: 'fill', justify: 'between', items: 'center' } as St);
const inputField = (kind: 'text' | 'email' | 'password', name: string, ph: string): Node => { const n = makeInput(kind, name, ph); n.style = { ...n.style, mode: 'flow', w: 'fill', h: 46, radius: 10, padX: 14, fontSize: 15, fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1 } as St; n.states = { focus: { stroke: ACCENT, shadowCss: '0 0 0 3px rgba(79,70,229,0.18)' } } as Node['states']; n.attrs = { 'aria-label': ph || name, outline: 'none' }; return n; };
const btnRow = (kids: Node[], justify: 'end' | 'center' | 'between' = 'end'): Node => pinned(stack('Actions', 'row', kids, { w: 'fill', gap: 10, justify, wrap: true } as St));
const iconTile = (k: IconKey, fg: string, bg: string, size = 52): Node => circle(size, bg, icon(k, Math.round(size * 0.46), fg));

const M = (name: string, blurb: string, section: string, make: () => Node): KitItem => ({ name, blurb, section, make });
const centred = (key: string, t: string, name: string, kids: (k: string) => Node[], o: { w?: number; st?: St; ov?: Parameters<typeof overlay>[2]; look?: typeof BRAND } = {}): Node => { const k = uid(key); return modalOf(name, opener(t, k, o.look), overlay(dlg(name + ' dialog', kids(k), { w: o.w, st: o.st }), k, o.ov)); };

export const modalItems: KitItem[] = [
  M('Confirm dialog', 'A question with Cancel and Continue. Closes from either button, a click outside, or Escape.', 'Confirmations', () => centred('dlg', 'Open dialog', 'Confirm dialog', () => [heading2('Confirm action', 'Are you sure you want to continue? You can change this later.'), btnRow([doneBtn('Cancel', OUTLINE), doneBtn('Continue')])])),
  M('Delete, glass', 'A frosted-glass delete confirmation with a red button. Glass blurs the page behind the card.', 'Confirmations', () => centred('del', 'Delete item', 'Delete dialog', () => [stack('Head', 'row', [iconTile('trash', '#dc2626', 'rgba(254,226,226,0.9)', 48), stack('Text', 'column', [head('Delete this item?', 20), txt('This cannot be undone.', 14, '#6b7280')], { w: 'auto', gap: 2 } as St)], { w: 'fill', gap: 14, items: 'center' } as St), btnRow([doneBtn('Keep it', OUTLINE), doneBtn('Delete', DANGER)])], { st: GLASS as St, ov: { fill: 'rgba(15,23,42,0.35)', blur: 6 }, look: DANGER })),
  M('Delete, solid', 'A plain white delete dialog with a big red icon, centred.', 'Confirmations', () => centred('del', 'Delete account', 'Delete solid dialog', () => [stack('Centre', 'column', [iconTile('alert', '#dc2626', '#fee2e2', 60), head('Delete your account?', 22), txt('All your projects and files will be removed for good.', 15, '#6b7280', 400, { align: 'center' } as St)], { w: 'fill', gap: 10, items: 'center' } as St), btnRow([doneBtn('Cancel', OUTLINE, { w: 'fill', grow: 1 }), doneBtn('Yes, delete', DANGER, { w: 'fill', grow: 1 })], 'center')], { w: 400, look: DANGER })),
  M('Discard changes', 'Warns before leaving with unsaved work.', 'Confirmations', () => centred('dlg', 'Leave page', 'Discard dialog', () => [stack('Head', 'row', [icon('alert', 22, '#d97706'), head('Discard your changes?', 20)], { w: 'fill', gap: 10 } as St), txt('You have unsaved edits. If you leave now they will be lost.', 15, '#6b7280'), btnRow([doneBtn('Stay', OUTLINE), doneBtn('Discard', DARK)])], { w: 420 })),
  M('Success message', 'A green tick, a short thank you and one button.', 'Messages', () => centred('ok', 'Submit order', 'Success dialog', () => [stack('Centre', 'column', [iconTile('check', '#16a34a', '#dcfce7', 64), head('Order placed', 24), txt('We sent a receipt to your email. Your parcel ships tomorrow.', 15, '#6b7280', 400, { align: 'center' } as St)], { w: 'fill', gap: 10, items: 'center' } as St), doneBtn('Done', BRAND, { w: 'fill', self: 'auto' })], { w: 380 })),
  M('Information dialog', 'A title, a paragraph and a single OK.', 'Messages', () => centred('info', 'What is new', 'Info dialog', () => [titleBar('What is new in 2.0'), txt('A faster editor, shared libraries and a calmer dashboard. Everything you made before keeps working.', 15, '#4b5563'), btnRow([doneBtn('Got it')])])),
  M('Error dialog', 'Explains a failure and offers Try again.', 'Messages', () => centred('err', 'Upload file', 'Error dialog', () => [stack('Head', 'row', [iconTile('xcircle', '#dc2626', '#fee2e2', 44), stack('Text', 'column', [head('Upload failed', 20), txt('The file is larger than 10 MB.', 14, '#6b7280')], { w: 'auto', gap: 2 } as St)], { w: 'fill', gap: 14, items: 'center' } as St), btnRow([doneBtn('Cancel', OUTLINE), doneBtn('Try again')])])),
  M('Contact form dialog', 'A form in a dialog: name, email, message and a send button.', 'Forms', () => centred('form', 'Contact us', 'Contact dialog', () => [titleBar('Send us a message'), inputField('text', 'name', 'Your name'), inputField('email', 'email', 'you@company.com'), (() => { const t = makeInput('textarea', 'message', 'How can we help?'); t.style = { ...t.style, mode: 'flow', w: 'fill', h: 100, radius: 10, padX: 14, padY: 12, fontSize: 15, fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1 } as St; t.attrs = { outline: 'none', 'aria-label': 'Message' }; return t; })(), btnRow([doneBtn('Cancel', OUTLINE), doneBtn('Send message')])], { w: 460 })),
  M('Sign in dialog', 'Email, password and a sign-in button over the page.', 'Forms', () => centred('login', 'Sign in', 'Sign in dialog', () => [titleBar('Welcome back'), inputField('email', 'email', 'Email'), inputField('password', 'password', 'Password'), doneBtn('Sign in', BRAND, { w: 'fill', self: 'auto' }), txt('No account yet? Create one', 13, '#6b7280', 400, { align: 'center' } as St)], { w: 400 })),
  M('Sign up dialog, with perks', 'Three benefits on one side, the form on the other. Stacks on phones.', 'Forms', () => { const k = uid('su'); const left = stack('Perks', 'column', [head('Join for free', 24, '#ffffff'), ...['Unlimited projects', 'Team sharing', 'Priority support'].map(t => stack(t, 'row', [icon('check', 18, '#c7d2fe'), txt(t, 15, '#e0e7ff')], { w: 'auto', gap: 10 } as St))], { w: 'fill', grow: 1, gap: 14, pad: 28, fill: 'linear-gradient(150deg,#4f46e5,#7c3aed)', justify: 'center' } as St); const right = stack('Form', 'column', [stack('Top', 'row', [head('Create account', 20), closeBtn()], { w: 'fill', justify: 'between', items: 'center' } as St), inputField('text', 'name', 'Full name'), inputField('email', 'email', 'Email'), doneBtn('Get started', BRAND, { w: 'fill', self: 'auto' })], { w: 'fill', grow: 1, gap: 12, pad: 28 } as St); return modalOf('Sign up dialog', opener('Join free', k), overlay(pinned(stack('Dialog', 'row', [left, right], { w: 680, maxW: 680, radius: 18, fill: '#ffffff', shadow: 'lg', gap: 0, items: 'stretch' } as St)), k)); }),
  M('Newsletter popup', 'A photo beside a short invitation and an email field.', 'Forms', () => { const k = uid('nl'); const img = photo('workspace', 'fill', 280, 0, { grow: 1, minH: 280 }); const side = stack('Invite', 'column', [stack('Top', 'row', [txt('Weekly notes', 12, ACCENT, 700), closeBtn()], { w: 'fill', justify: 'between', items: 'center' } as St), head('Get one good idea a week', 24), txt('Short, practical and free. Unsubscribe any time.', 14, '#6b7280'), inputField('email', 'email', 'you@company.com'), doneBtn('Subscribe', BRAND, { w: 'fill', self: 'auto' })], { w: 'fill', grow: 1, gap: 12, pad: 26, justify: 'center' } as St); return modalOf('Newsletter popup', opener('Subscribe', k), overlay(pinned(stack('Dialog', 'row', [img, side], { w: 640, maxW: 640, radius: 18, fill: '#ffffff', shadow: 'lg', gap: 0, items: 'stretch' } as St)), k)); }),
  M('Image lightbox', 'A photo shown large over a dark backdrop, with a close button.', 'Media', () => { const k = uid('lb'); return modalOf('Lightbox', opener('View photo', k, OUTLINE), overlay(stack('Frame', 'column', [stack('Bar', 'row', [txt('Mountain lake', 14, '#e5e7eb', 600), iconButton('Close', [icon('close', 20, '#ffffff')], { fill: 'rgba(255,255,255,0.14)', hover: 'rgba(255,255,255,0.26)', color: '#fff' }, { w: 38, h: 38, padX: 0, padY: 0, radius: 999 } as St, { 'aria-label': 'Close' }, { role: 'close' })], { w: 'fill', justify: 'between', items: 'center' } as St), photo('lake', 'fill', 420, 14)], { w: 760, maxW: 760, gap: 12 } as St), k, { fill: 'rgba(2,6,23,0.88)' })); }),
  M('Video dialog', 'A video frame with a play button, ready for an embed.', 'Media', () => { const k = uid('vd'); return modalOf('Video dialog', opener('Watch demo', k), overlay(stack('Player', 'column', [stack('Bar', 'row', [txt('Product tour', 14, '#e5e7eb', 600), closeBtn()], { w: 'fill', justify: 'between', items: 'center' } as St), stack('Screen', 'row', [circle(72, 'rgba(255,255,255,0.92)', icon('play', 28, '#111827'))], { w: 'fill', h: 380, minH: 380, radius: 14, fill: 'linear-gradient(135deg,#312e81,#0f172a)', justify: 'center', items: 'center' } as St)], { w: 760, maxW: 760, gap: 12 } as St), k, { fill: 'rgba(2,6,23,0.88)' })); }),
  M('Cookie consent card', 'A card pinned to the bottom corner asking about cookies. Not a blocking modal.', 'Banners over the page', () => { const k = uid('ck'); return scope('Cookie card', 'column', [opener('Show cookie notice', k, OUTLINE), panel('Cookie card', [stack('Head', 'row', [icon('cookie', 22, '#b45309'), head('We use cookies', 17)], { w: 'fill', gap: 10 } as St), txt('They keep you signed in and help us improve. You can change your mind at any time.', 14, '#6b7280'), btnRow([doneBtn('Decline', OUTLINE, { padY: 9 }), doneBtn('Accept all', BRAND, { padY: 9 })])], { key: k, dismiss: false }, { position: 'fixed', bottom: 16, left: 16, w: 340, maxW: 340, gap: 10, pad: 20, radius: 16, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'lg' } as St)].map((n, i) => i ? withAttrs(n, { z: '900' }) : n), { w: 'auto' }); }),
  M('Upgrade dialog', 'Three reasons to upgrade, a price and a button.', 'Offers', () => centred('up', 'Upgrade', 'Upgrade dialog', () => [stack('Head', 'column', [iconTile('bolt', '#4f46e5', '#eef2ff', 52), head('Unlock Pro', 24), txt('Everything in Free, plus:', 15, '#6b7280')], { w: 'fill', gap: 8 } as St), ...['Unlimited projects', 'Custom domains', 'Priority support'].map(t => stack(t, 'row', [icon('check', 18, '#16a34a'), txt(t, 15, '#374151', 500)], { w: 'auto', gap: 10 } as St)), stack('Price', 'row', [head('$19', 32), txt('per month', 14, '#6b7280')], { w: 'auto', gap: 6, items: 'end' } as St), btnRow([doneBtn('Not now', OUTLINE), doneBtn('Upgrade')])], { w: 420 })),
  M('Gift or offer popup', 'A bright popup with a discount code and a copy button.', 'Offers', () => centred('gift', 'Special offer', 'Offer dialog', () => [stack('Top', 'row', [iconTile('gift', '#ffffff', '#ec4899', 56), closeBtn()], { w: 'fill', justify: 'between', items: 'start' } as St), head('Take 20% off', 28), txt('Use this code at checkout, valid for 48 hours.', 15, '#6b7280'), stack('Code', 'row', [label('WELCOME20', 18, 800, '#111827'), iconButton('Copy', [icon('copy', 16, '#4f46e5'), btnText('Copy', '#4f46e5')], SOFT, { padY: 8, padX: 12 } as St, {}, { role: 'copy', key: 'WELCOME20' } as never)], { w: 'fill', justify: 'between', items: 'center', pad: 14, radius: 12, fill: '#f9fafb', stroke: '#d1d5db', strokeWidth: 1 } as St), doneBtn('Shop now')], { w: 400 })),
  M('Command palette', 'A search box with a short list of actions, as used in modern apps.', 'Pickers', () => { const k = uid('cmd'); const row = (ic: IconKey, t: string, hintT: string): Node => stack(t, 'row', [icon(ic, 18, '#6b7280'), txt(t, 14, '#111827', 500), txt(hintT, 12, '#9ca3af', 500, { marginL: 'auto' } as unknown as St)], { w: 'fill', gap: 12, padX: 12, padY: 10, radius: 10, items: 'center', justify: 'start' } as St); return modalOf('Command palette', opener('Open search', k, OUTLINE), overlay(stack('Palette', 'column', [stack('Search', 'row', [icon('search', 18, '#9ca3af'), inputField('text', 'q', 'Type a command or search…')], { w: 'fill', gap: 8, padX: 14, padY: 6, items: 'center', borderB: 1, stroke: '#e5e7eb' } as St), stack('Results', 'column', [row('home', 'Go to dashboard', 'G D'), row('user', 'Open profile', 'G P'), row('settings', 'Settings', 'G S'), row('share', 'Share project', 'S')], { w: 'fill', gap: 2, pad: 8 } as St)], { w: 560, maxW: 560, radius: 16, fill: '#ffffff', shadow: 'lg', gap: 0 } as St), k, { items: 'start', fill: 'rgba(15,23,42,0.45)', pad: 80 })); }),
  M('Share dialog', 'A link with a copy button and round share icons.', 'Pickers', () => centred('sh', 'Share', 'Share dialog', () => [titleBar('Share this page'), stack('Link', 'row', [txt('https://example.com/post', 14, '#374151'), iconButton('Copy', [btnText('Copy', '#ffffff')], BRAND, { padY: 8, padX: 14 } as St, {}, { role: 'copy', key: 'https://example.com/post' } as never)], { w: 'fill', justify: 'between', items: 'center', gap: 10, padL: 14, padR: 6, padY: 6, radius: 12, fill: '#f9fafb', stroke: '#e5e7eb', strokeWidth: 1 } as St), stack('Icons', 'row', ['mail', 'link', 'share'].map(k => circle(44, '#eef2ff', icon(k as IconKey, 20, '#4f46e5'))), { w: 'auto', gap: 10 } as St)], { w: 400 })),
  M('Rating dialog', 'Five stars and a comment box.', 'Pickers', () => centred('rate', 'Rate us', 'Rating dialog', () => [titleBar('How was your visit?'), stack('Stars', 'row', [1, 2, 3, 4, 5].map(i => icon('star', 30, i <= 4 ? '#f59e0b' : '#d1d5db')), { w: 'auto', gap: 6 } as St), inputField('text', 'comment', 'Tell us more (optional)'), btnRow([doneBtn('Skip', OUTLINE), doneBtn('Send')])], { w: 420 })),
  M('Right side drawer', 'A panel sliding in from the right edge, with a menu of links.', 'Drawers and sheets', () => { const k = uid('dr'); return modalOf('Right drawer', opener('Open menu', k), overlay(stack('Drawer', 'column', [stack('Top', 'row', [head('Menu', 20), closeBtn()], { w: 'fill', justify: 'between', items: 'center' } as St), ...['Home', 'Products', 'Pricing', 'About', 'Contact'].map(t => txt(t, 16, '#111827', 600, { padY: 10, borderB: 1, stroke: '#f3f4f6', w: 'fill' } as St)), doneBtn('Get started', BRAND, { w: 'fill', self: 'auto' })], { w: 320, h: 'fill', gap: 8, pad: 24, fill: '#ffffff', radius: 0, shadow: 'lg' } as St), k, { justify: 'end', items: 'stretch', dir: 'row', pad: 0 })); }),
  M('Left side drawer', 'The same drawer from the left edge. Good for app navigation.', 'Drawers and sheets', () => { const k = uid('dl'); return modalOf('Left drawer', opener('Open sidebar', k, OUTLINE), overlay(stack('Drawer', 'column', [stack('Top', 'row', [brandish(), closeBtn()], { w: 'fill', justify: 'between', items: 'center' } as St), ...(['home', 'inbox', 'settings', 'user'] as IconKey[]).map((ic, i) => stack(ic, 'row', [icon(ic, 18, i === 0 ? ACCENT : '#6b7280'), txt(['Overview', 'Inbox', 'Settings', 'Account'][i], 15, i === 0 ? ACCENT : '#374151', 600)], { w: 'fill', gap: 12, padX: 12, padY: 10, radius: 10, fill: i === 0 ? '#eef2ff' : 'transparent', items: 'center' } as St))], { w: 300, h: 'fill', gap: 6, pad: 20, fill: '#ffffff', radius: 0, shadow: 'lg' } as St), k, { justify: 'start', items: 'stretch', dir: 'row', pad: 0 })); }),
  M('Bottom sheet', 'A sheet that rises from the bottom, as on phones. Holds a list of actions.', 'Drawers and sheets', () => { const k = uid('bs'); return modalOf('Bottom sheet', opener('Open actions', k), overlay(stack('Sheet', 'column', [mk('container', 'Handle', { mode: 'flow', w: 44, h: 5, minH: 5, grow: 0, radius: 999, fill: '#d1d5db', self: 'center' } as St), ...(['share', 'link', 'bookmarkish'] as string[]).map((_, i) => stack(['Share', 'Copy link', 'Save for later'][i], 'row', [icon((['share', 'link', 'inbox'] as IconKey[])[i], 20, '#374151'), txt(['Share', 'Copy link', 'Save for later'][i], 16, '#111827', 600)], { w: 'fill', gap: 14, padY: 12, items: 'center' } as St)), doneBtn('Cancel', OUTLINE, { w: 'fill', self: 'auto' })], { w: 'fill', maxW: 520, gap: 6, pad: 20, fill: '#ffffff', radius: 24, radiusBL: 0, radiusBR: 0, shadow: 'lg', self: 'center' } as St), k, { justify: 'end', items: 'center', pad: 0 })); }),
  M('Fullscreen menu', 'A full-page overlay with large links. Common for creative sites.', 'Drawers and sheets', () => { const k = uid('fs'); return modalOf('Fullscreen menu', opener('Menu', k, DARK), withAttrs(panel('Overlay', [stack('Bar', 'row', [brandish(true), iconButton('Close', [icon('close', 24, '#ffffff')], { fill: 'rgba(255,255,255,0.1)', hover: 'rgba(255,255,255,0.2)', color: '#fff' }, { w: 44, h: 44, padX: 0, padY: 0, radius: 999 } as St, { 'aria-label': 'Close menu' }, { role: 'close' })], { w: 'fill', justify: 'between', items: 'center' } as St), stack('Links', 'column', ['Work', 'Studio', 'Journal', 'Contact'].map(t => head(t, 44, '#ffffff')), { w: 'fill', gap: 8, grow: 1, justify: 'center' } as St)], { key: k, modal: true, dismiss: true }, { position: 'fixed', inset: 0, w: 'fill', h: 'fill', gap: 0, pad: 28, fill: '#0b1020' } as St), { z: '1000' })); }),
  M('Multi-step dialog', 'Two steps inside one dialog; Next moves forward and Back returns.', 'Flows', () => { const k = uid('ms'); const k1 = `${k}-1`, k2 = `${k}-2`; const step = (key: string, first: boolean, kids: Node[]): Node => panel(`Step ${first ? 1 : 2}`, kids, { key, group: k, initial: first ? 'open' : 'closed' }, { w: 'fill', gap: 12 } as St); return modalOf('Multi-step dialog', opener('Start setup', k), overlay(dlg('Setup dialog', [step(k1, true, [stack('Top', 'row', [txt('Step 1 of 2', 12, ACCENT, 700), closeBtn()], { w: 'fill', justify: 'between', items: 'center' } as St), head('Name your workspace', 22), inputField('text', 'workspace', 'Acme Inc.'), btnRow([iconButton('Next', [btnText('Next', '#fff')], BRAND, { padY: 11 } as St, {}, { role: 'open', key: k2 })])]), step(k2, false, [stack('Top', 'row', [txt('Step 2 of 2', 12, ACCENT, 700), closeBtn()], { w: 'fill', justify: 'between', items: 'center' } as St), head('Invite your team', 22), inputField('email', 'invite', 'teammate@company.com'), btnRow([iconButton('Back', [btnText('Back', '#111827')], OUTLINE, { padY: 11 } as St, {}, { role: 'open', key: k1 }), doneBtn('Finish')])])], { w: 440 }), k)); }),
];
function brandish(light = false): Node { const h = head('Brand', 20, light ? '#ffffff' : '#111827'); return h; }

// ------------------------------------------------------------------ toasts and alerts
type Kind = 'success' | 'error' | 'info' | 'warning';
const KIND: Record<Kind, { fg: string; bg: string; bd: string; solid: string; icon: IconKey; label: string }> = {
  success: { fg: '#15803d', bg: '#f0fdf4', bd: '#bbf7d0', solid: '#16a34a', icon: 'check', label: 'Success' },
  error: { fg: '#b91c1c', bg: '#fef2f2', bd: '#fecaca', solid: '#dc2626', icon: 'xcircle', label: 'Error' },
  info: { fg: '#1d4ed8', bg: '#eff6ff', bd: '#bfdbfe', solid: '#2563eb', icon: 'info', label: 'Heads up' },
  warning: { fg: '#b45309', bg: '#fffbeb', bd: '#fde68a', solid: '#d97706', icon: 'alert', label: 'Careful' },
};
const MSG: Record<Kind, [string, string]> = { success: ['Changes saved', 'Your profile is up to date.'], error: ['Something went wrong', 'We could not reach the server. Try again.'], info: ['New version available', 'Reload to get the latest features.'], warning: ['Storage almost full', 'You have used 92% of your space.'] };
const smallClose = (ink = '#6b7280'): Node => iconButton('Close', [icon('close', 16, ink)], { fill: 'transparent', hover: 'rgba(107,114,128,0.14)', color: ink, ring: 'rgba(107,114,128,0.3)' }, { w: 30, h: 30, padX: 0, padY: 0, radius: 999 } as St, { 'aria-label': 'Dismiss' }, { role: 'close' });
const TOAST_AT: Record<string, St> = { br: { bottom: 16, right: 16 }, tr: { top: 16, right: 16 }, bl: { bottom: 16, left: 16 }, tl: { top: 16, left: 16 }, bc: { bottom: 16, left: 0, right: 0, items: 'center' }, tc: { top: 16, left: 0, right: 0, items: 'center' } } as Record<string, St>;
const toastHost = (key: string, kids: Node[], pos = 'br'): Node => withAttrs(panel('Toast', kids, { key, dismiss: false }, { position: 'fixed', gap: 10, w: pos.endsWith('c') ? 'fill' : 'auto', ...TOAST_AT[pos] } as St), { z: '1100', role: 'status', 'aria-live': 'polite' });
const toastBox = (name: string, kids: Node[], tone: 'glass' | 'light' | 'dark', kind?: Kind, o: St = {}): Node => {
  const base: St = tone === 'glass' ? { ...GLASS, fill: kind ? tint(kind) : 'rgba(255,255,255,0.72)' } as St : tone === 'dark' ? { fill: '#111827', shadow: 'lg' } as St : { fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'lg' } as St;
  return stack(name, 'row', kids, { w: 'auto', maxW: 380, gap: 12, padX: 16, padY: 14, radius: 16, items: 'center', ...base, ...o } as St);
};
const tint = (k: Kind): string => ({ success: 'rgba(240,253,244,0.72)', error: 'rgba(254,242,242,0.72)', info: 'rgba(239,246,255,0.72)', warning: 'rgba(255,251,235,0.74)' })[k];
const textCol = (t: string, m: string, dark = false): Node => stack('Text', 'column', [txt(t, 15, dark ? '#ffffff' : '#111827', 700), txt(m, 13, dark ? '#9ca3af' : '#4b5563')], { w: 'auto', gap: 1, grow: 1, minW: 0 } as St);
const toastItem = (name: string, blurb: string, section: string, build: (key: string) => Node, pos = 'br'): KitItem =>
  ({ name, blurb: `${blurb} A button shows it; Close hides it.`, section, make: () => { const k = uid('toast'); return scope(name, 'column', [opener('Show toast', k, OUTLINE), toastHost(k, [build(k)], pos)], { w: 'auto' }); } });

const kinds: Kind[] = ['success', 'error', 'info', 'warning'];
const glassToasts = kinds.map(kd => toastItem(`Glass toast, ${kd}`, `A frosted-glass ${kd} notice that blurs what is behind it.`, 'Glass', () => toastBox(`Toast ${kd}`, [circle(36, KIND[kd].solid, icon(KIND[kd].icon, 18, '#ffffff')), textCol(...MSG[kd]), smallClose()], 'glass', kd), 'br'));
const lightToasts = kinds.map(kd => toastItem(`Toast, ${kd}`, `A white ${kd} toast with a coloured icon.`, 'Light', () => toastBox(`Toast ${kd}`, [icon(KIND[kd].icon, 22, KIND[kd].solid), textCol(...MSG[kd]), smallClose()], 'light'), kd === 'error' ? 'tr' : 'br'));
const darkToast = (t: string, extra: () => Node[] = () => []): ((k: string) => Node) => () => toastBox('Toast dark', [txt(t, 14, '#ffffff', 500), ...extra()], 'dark', undefined, { radius: 999, padX: 20, padY: 12 } as St);
const inlineAct = (t: string, ink = '#a5b4fc', role: 'close' | 'open' = 'close'): Node => iconButton(t, [btnText(t, ink)], { fill: 'transparent', hover: 'rgba(255,255,255,0.1)', color: ink }, { padX: 10, padY: 6, radius: 999 } as St, {}, { role } as never);

const baseToasts: KitItem[] = [
  ...glassToasts, ...lightToasts,
  toastItem('Dark pill message', 'A short dark pill at the bottom of the screen. Fits "Copied to clipboard".', 'Dark', darkToast('Copied to clipboard'), 'bc'),
  toastItem('Dark toast with undo', 'A dark pill with an Undo action.', 'Dark', darkToast('Message archived', () => [inlineAct('Undo')]), 'bc'),
  toastItem('Dark toast with action and close', 'Dark, with a link-style action and a close button.', 'Dark', () => toastBox('Toast dark', [icon('bell', 20, '#a5b4fc'), textCol('New comment', 'Ada replied to your post.', true), inlineAct('View'), smallClose('#9ca3af')], 'dark'), 'br'),
  toastItem('Glass toast with avatar', 'A message toast from a person, on glass.', 'With content', () => toastBox('Message toast', [mk('container', 'Avatar', { mode: 'flow', w: 40, h: 40, minH: 40, grow: 0, radius: 999, fill: 'linear-gradient(135deg,#818cf8,#f472b6)' } as St), textCol('Ada Lovelace', 'Sent you a file: roadmap.pdf'), smallClose()], 'glass'), 'tr'),
  toastItem('Toast with thumbnail', 'A photo thumbnail beside a message, such as a finished upload.', 'With content', () => toastBox('Photo toast', [photo('lake', 48, 48, 10), textCol('Upload complete', 'lake-view.jpg · 2.4 MB'), smallClose()], 'light'), 'br'),
  toastItem('Loading toast', 'A spinner and a message while something runs.', 'With content', () => toastBox('Loading toast', [withAnimNode(icon('refresh', 20, ACCENT)), textCol('Saving…', 'Please keep this tab open.')], 'light'), 'bc'),
  toastItem('Upload progress toast', 'A progress bar that fills across the toast.', 'With content', () => toastBox('Progress toast', [stack('Body', 'column', [stack('Top', 'row', [txt('Uploading 3 files', 14, '#111827', 700), smallClose()], { w: 'fill', justify: 'between', items: 'center' } as St), stack('Track', 'row', [withAnimTo(mk('container', 'Fill', { mode: 'flow', w: 'fill', h: 6, minH: 6, grow: 1, radius: 999, fill: ACCENT } as St), 'grow-x', 4000)], { w: 'fill', h: 6, minH: 6, radius: 999, fill: '#e5e7eb', overflow: 'hidden', gap: 0 } as St)], { w: 280, gap: 10 } as St)], 'light'), 'br'),
  toastItem('New version banner', 'A dark bar announcing an update, with Reload.', 'Banners', () => toastBox('Update toast', [icon('sparkle', 20, '#fcd34d'), textCol('A new version is ready', 'Reload to update.', true), inlineAct('Reload', '#fcd34d'), smallClose('#9ca3af')], 'dark'), 'tc'),
  toastItem('Offline banner', 'A calm warning that the connection dropped.', 'Banners', () => toastBox('Offline toast', [icon('wifi', 20, '#b45309'), textCol('You are offline', 'Changes will sync when you reconnect.'), smallClose()], 'light', undefined, { fill: '#fffbeb', stroke: '#fde68a' } as St), 'tc'),
  toastItem('Stacked toasts', 'Three notices stacked in a corner, each closing on its own.', 'Stacks', () => stack('Toast stack', 'column', (['success', 'info', 'warning'] as Kind[]).map(kd => toastBox(`Toast ${kd}`, [circle(32, KIND[kd].solid, icon(KIND[kd].icon, 16, '#ffffff')), textCol(...MSG[kd]), smallClose()], 'glass', kd)), { w: 'auto', gap: 10 } as St), 'br'),
];
function withAnimNode(n: Node): Node { return { ...n, anim: { preset: 'spin', duration: 900, delay: 0, ease: 'linear', repeat: 0, trigger: 'load' } }; }
function withAnimTo(n: Node, preset: string, duration: number): Node { return { ...n, anim: { preset, duration, delay: 0, ease: 'linear', repeat: 1, trigger: 'load' } }; }

// ---- alerts
const alertBase = (kd: Kind, look: 'soft' | 'solid' | 'outline' | 'accent'): St => {
  const c = KIND[kd];
  if (look === 'solid') return { fill: c.solid } as St;
  if (look === 'outline') return { fill: '#ffffff', stroke: c.solid, strokeWidth: 1.5 } as St;
  if (look === 'accent') return { fill: c.bg, borderL: 4, stroke: c.solid } as St;
  return { fill: c.bg, stroke: c.bd, strokeWidth: 1 } as St;
};
const alertBox = (kd: Kind, look: 'soft' | 'solid' | 'outline' | 'accent', body?: Node[], o: St = {}): Node => {
  const c = KIND[kd]; const ink = look === 'solid' ? '#ffffff' : c.fg; const icoC = look === 'solid' ? '#ffffff' : c.solid;
  return stack(`Alert ${kd}`, 'row', body || [icon(c.icon, 20, icoC), stack('Text', 'column', [txt(MSG[kd][0], 15, ink, 700), txt(MSG[kd][1], 14, look === 'solid' ? '#ffffff' : '#4b5563')], { w: 'auto', gap: 2, grow: 1 } as St)], { w: 'fill', maxW: 560, gap: 12, padX: 16, padY: 14, radius: look === 'accent' ? 8 : 12, items: 'start', ...alertBase(kd, look), ...o } as St);
};
const ALERT_LOOKS: ['soft' | 'solid' | 'outline' | 'accent', string, string][] = [['soft', 'Soft', 'A tinted background with a thin border.'], ['solid', 'Solid', 'A strong colour block with white text.'], ['outline', 'Outline', 'A white card with a coloured outline.'], ['accent', 'Left accent', 'A tinted card with a thick bar on the left edge.']];
const inlineAlerts: KitItem[] = ALERT_LOOKS.flatMap(([look, nm, desc]) => kinds.map(kd => ({ section: nm, name: `Alert, ${nm.toLowerCase()} ${kd}`, blurb: `${desc} For ${kd} messages.`, make: () => alertBox(kd, look) })));
const bar = (name: string, kids: Node[], st: St): Node => stack(name, 'row', kids, { w: 'fill', gap: 14, padX: 24, padY: 12, justify: 'center', items: 'center', wrap: true, ...st } as St);
export const alertItems: KitItem[] = [
  ...inlineAlerts,
  { section: 'With actions', name: 'Alert with actions', blurb: 'A warning with two buttons: one to fix it, one to dismiss.', make: () => alertBox('warning', 'soft', [icon('alert', 20, '#d97706'), stack('Body', 'column', [txt('Your trial ends in 3 days', 15, '#b45309', 700), txt('Add a payment method to keep your projects.', 14, '#4b5563'), stack('Actions', 'row', [doneBtn('Add payment', DARK, { padY: 8, padX: 14 }), doneBtn('Later', OUTLINE, { padY: 8, padX: 14 })], { w: 'auto', gap: 8, padT: 6 } as St)], { w: 'auto', gap: 2, grow: 1 } as St)]) },
  { section: 'With actions', name: 'Dismissible alert', blurb: 'An info alert with a close button that really hides it.', make: () => { const k = uid('al'); return withAttrs(panel('Dismissible alert', [alertBox('info', 'soft', [icon('info', 20, '#2563eb'), stack('Text', 'column', [txt('Tip: press / to search', 15, '#1d4ed8', 700), txt('You can find anything from the keyboard.', 14, '#4b5563')], { w: 'auto', gap: 2, grow: 1 } as St), smallClose('#1d4ed8')])], { key: k, initial: 'open' }, { w: 'fill', maxW: 560 } as St), {}); }},
  { section: 'With actions', name: 'Callout note', blurb: 'A neutral note with a title, for documentation.', make: () => stack('Callout', 'row', [icon('info', 20, '#4f46e5'), stack('Text', 'column', [txt('Note', 14, '#4338ca', 700), txt('Settings are saved per workspace, so teammates keep their own choices.', 14, '#374151')], { w: 'auto', gap: 2, grow: 1 } as St)], { w: 'fill', maxW: 560, gap: 12, pad: 16, radius: 12, fill: '#eef2ff', items: 'start' } as St) },
  { section: 'Banners and empty states', name: 'Announcement bar', blurb: 'A slim indigo bar for news, with a link.', make: () => bar('Announcement', [txt('✨ Version 2.0 is here: faster, calmer, shareable.', 14, '#ffffff', 600), txt('Read what is new →', 14, '#c7d2fe', 700)], { fill: '#4f46e5' }) },
  { section: 'Banners and empty states', name: 'Promo bar, dark', blurb: 'A dark bar with an offer and a small button.', make: () => bar('Promo bar', [txt('Black Friday: 30% off every plan until Sunday.', 14, '#ffffff', 600), iconButton('Shop now', [btnText('Shop now', '#111827')], { fill: '#ffffff', hover: '#eef2ff', color: '#111827', ring: 'rgba(255,255,255,0.4)' }, { padY: 6, padX: 14 } as St, {}, { role: 'close' } as never)], { fill: '#111827' }) },
  { section: 'Banners and empty states', name: 'Gradient banner', blurb: 'A colourful bar for launches and events.', make: () => bar('Gradient banner', [txt('Join our free live workshop on Thursday.', 15, '#ffffff', 700), txt('Save my seat', 14, '#fde68a', 700)], { fill: 'linear-gradient(90deg,#ec4899,#f59e0b)', padY: 14 }) },
  { section: 'Banners and empty states', name: 'Cookie bar', blurb: 'A wide bar for cookie consent, with Accept and Decline.', make: () => bar('Cookie bar', [txt('We use cookies to improve your experience.', 14, '#374151', 500), stack('Actions', 'row', [doneBtn('Decline', OUTLINE, { padY: 8, padX: 14 }), doneBtn('Accept', BRAND, { padY: 8, padX: 14 })], { w: 'auto', gap: 8 } as St)], { fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, justify: 'between' }) },
  { section: 'Banners and empty states', name: 'Empty state', blurb: 'An illustration-free empty list: icon, title, hint and a button.', make: () => stack('Empty state', 'column', [circle(64, '#eef2ff', icon('inbox', 28, ACCENT)), head('No messages yet', 20), txt('When someone writes to you it will appear here.', 14, '#6b7280', 400, { align: 'center' } as St), doneBtn('Compose message', BRAND, { self: 'center' })], { w: 360, gap: 10, items: 'center', pad: 32, radius: 16, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff' } as St) },
  { section: 'Banners and empty states', name: 'Maintenance notice', blurb: 'A full-width amber notice about scheduled downtime.', make: () => bar('Maintenance', [icon('clock', 18, '#b45309'), txt('Scheduled maintenance on Saturday, 2:00 to 3:00 AM.', 14, '#92400e', 600)], { fill: '#fffbeb', stroke: '#fde68a', strokeWidth: 1 }) },
];

// ---- four more toasts
const moreToasts: KitItem[] = [
  toastItem('Toast with two actions', 'A light toast with Dismiss and Review buttons.', 'With content', () => toastBox('Action toast', [stack('Body', 'column', [txt('Storage almost full', 15, '#111827', 700), txt('You have used 92% of your space.', 13, '#4b5563'), stack('Actions', 'row', [textBtn('Review', 'Review', BRAND, { padY: 7, padX: 14 } as St), iconButton('Dismiss', [btnText('Dismiss', '#374151')], { fill: 'transparent', hover: '#f3f4f6', color: '#374151' }, { padX: 12, padY: 7, radius: 999 } as St, {}, { role: 'close' } as never)], { w: 'auto', gap: 8, marginT: 6 } as St)], { w: 'auto', gap: 2, grow: 1 } as St), smallClose()], 'light', undefined, { items: 'start' } as St), 'br'),
  toastItem('Toast with accent edge', 'A white toast with a thick coloured edge on the left.', 'Light', () => toastBox('Edge toast', [icon('check', 20, '#16a34a'), textCol('Profile saved', 'Your changes are live.'), smallClose()], 'light', undefined, { borderL: 5, stroke: '#16a34a', radius: 10 } as St), 'br'),
  toastItem('Top banner toast', 'A full-width coloured bar that drops in at the top.', 'Banners', () => toastBox('Top toast', [txt('Maintenance tonight at 22:00. The site may be slow.', 14, '#ffffff', 600), smallClose('#ffffff')], 'dark', undefined, { fill: ACCENT, w: 'fill', maxW: 9999, radius: 0, justify: 'between', padX: 24 } as St), 'tc'),
  toastItem('Confirm toast', 'Asks before doing something, with Yes and No.', 'With content', () => toastBox('Confirm toast', [textCol('Delete this file?', 'This cannot be undone.', true), inlineAct('No', '#d1d5db'), iconButton('Yes', [btnText('Yes, delete', '#ffffff')], { fill: '#dc2626', hover: '#b91c1c', color: '#ffffff' }, { padX: 14, padY: 7, radius: 999 } as St, {}, { role: 'close' } as never)], 'dark'), 'bc'),
];
export const toastItems: KitItem[] = [...baseToasts, ...moreToasts];
