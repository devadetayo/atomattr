/**
 * UI kit: premade blocks grouped by what they are, each category offering several variants with a one-line explanation.
 * Families are added here one at a time; items that have not been reworked yet stay in Panels.tsx and are slotted into
 * a category by name (see LEGACY_CATEGORY) so nothing disappears from the panel.
 */
import type { Node } from '../document/types';
import { autoDark } from '../document/auto-dark';
import { makeButton, makeHeading, makeInput, makeSection, makeText, mk } from '../document/factory';
import * as S from '../state/store';
import { checkItems, switchItems, radioItems, darkItems } from './kit-controls';
import { loaderItems, animatedButtonItems } from './kit-motion';
import { footerItems, formItems } from './kit-pages';
import { navItems } from './kit-nav';
import { heroItems } from './kit-hero';
import { accordionItems, cardItems, testimonialItems } from './kit-content';
import { imageCardItems, imagePillItems } from './kit-media';
import { socialItems } from './kit-social';
import { tooltipItems, modalItems, toastItems, alertItems } from './kit-overlays';
import { rangeItems, appItems, blockItems } from './kit-app';
import type { Asset, Behavior } from '../document/types';

export type KitItem = { name: string; blurb: string; make: () => Node; /** Sub-heading inside the group; consecutive items with the same section sit together. */ section?: string };
export type KitGroup = { id: string; name: string; blurb: string; items: KitItem[] };

export const flowKids = (kids: Node[]): Node[] => kids.map(k => ({ ...k, style: { ...k.style, mode: 'flow' as const } }));
export const stack = (name: string, dir: 'row' | 'column', kids: Node[], style: Node['style'] = {}, extra: Partial<Node> = {}): Node =>
  mk('container', name, { mode: 'flow', w: 'fill', h: 'auto', layout: 'flex', dir, gap: 12, items: dir === 'row' ? 'center' : 'stretch', ...style }, { children: flowKids(kids), ...extra });

/** Rows that must stay one horizontal line on phones (brand + menu button, icon + label) are pinned to `row` at tablet and mobile, because auto-stack only touches what is not set. */
export const pinRow = (n: Node): Node => ({ ...n, bp: { ...(n.bp || {}), tablet: { ...(n.bp?.tablet || {}), dir: 'row' }, mobile: { ...(n.bp?.mobile || {}), dir: 'row' } } });
export const brandMark = (size = 22): Node => { const h = makeHeading(0, 0, 'Brand', size); h.style = { ...h.style, w: 'auto', align: 'left' }; return h; };

/** A real checkbox control: 20px, rounded, with a visible border. Wrapped in a <label> so the text toggles it too. */
export const control = (name: string, checked = false): Node => {
  const n = makeInput('checkbox', name, '');
  n.style = { ...n.style, mode: 'flow', w: 20, h: 20, grow: 0, radius: 5, fill: '#ffffff', stroke: '#9ca3af', strokeWidth: 1, padX: 0, padY: 0 };
  n.field = { type: 'checkbox', name, value: checked ? 'true' : '', required: false };
  n.attrs = { ...(n.attrs || {}), 'aria-label': name };
  return n;
};
export const label = (text: string, size = 15, weight = 500, color = '#111827'): Node => { const t = makeText(0, 0, text, size); t.style = { ...t.style, color, fontWeight: weight, w: 'auto' }; return t; };
export const hint = (text: string): Node => label(text, 13, 400, '#6b7280');
/** Inline label rows must stay horizontal on every screen, so their direction is set explicitly at each breakpoint (auto-stack only touches what is not set). */
export const row = (name: string, kids: Node[], style: Node['style'] = {}): Node => stack(name, 'row', kids, { gap: 10, w: 'auto', ...style }, { tag: 'label', bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } });

const checkbox: KitItem[] = [
  { name: 'Checkbox with label', blurb: 'One option. Clicking the text toggles the box.', make: () => row('Checkbox', [control('agree'), label('I agree to the terms')]) },
  { name: 'Checkbox with description', blurb: 'Option with a title and a smaller explanation under it.',
    make: () => row('Checkbox with description', [control('updates', true), stack('Text', 'column', [label('Product updates', 15, 600), hint('Get an email when we ship something new.')], { gap: 2, w: 'auto' })], { items: 'start' }) },
  { name: 'Checkbox card', blurb: 'The whole bordered card is the click target. Good for plans and choices.',
    make: () => row('Checkbox card', [control('plan'), stack('Text', 'column', [label('Starter', 16, 700), hint('For personal projects and trying things out.')], { gap: 2, w: 'auto' })],
      { w: 'fill', items: 'start', gap: 14, padX: 18, padY: 16, radius: 12, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 }) },
  { name: 'Checkbox group', blurb: 'A heading with a list of related options.',
    make: () => stack('Checkbox group', 'column', [makeHeading(0, 0, 'Notify me about', 18), ...['New features', 'Tips and guides', 'Offers'].map((t, i) => row(`Option ${i + 1}`, [control(`notify-${i + 1}`, i === 0), label(t)]))], { gap: 12, w: 'auto' }, { tag: 'fieldset' }) },
];


/* ---------- buttons with icons ----------
   Icons are 24px stroke paths (the same drawing style as the Lucide pack), built here so the block never needs a network request.
   A button with an icon is a <button> container: icon and label sit in one flex row, so spacing and alignment come from layout, not from nudging. */
const ICON_PATHS = {
  copy: 'M9 9h11v11H9zM5 15V4h11',
  hourglass: 'M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.42A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.42A2 2 0 0 0 17 6.17V2',
  'loader-circle': 'M21 12a9 9 0 1 1-6.22-8.56',
  sun: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.66 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  github: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
  twitter: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
  instagram: 'M2 6a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  youtube: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17zM10 15l5-3-5-3z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  card: 'M2 5h20v14H2zM2 10h20',
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z',
  plus: 'M5 12h14M12 5v14',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  'external-link': 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M18 6 6 18M6 6l12 12',
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  'chevron-down': 'M6 9l6 6 6-6',
  check: 'M20 6 9 17l-5-5',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6',
  loader: 'M21 12a9 9 0 1 1-6.219-8.56',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13',
} as const;
export type IconName = keyof typeof ICON_PATHS;
/** A stroked icon as an editable path node. Colour it from Fill; it is sized in px so it never stretches inside a button. */
export const iconNode = (name: IconName, size = 18, color = '#ffffff'): Node =>
  mk('path', `${name[0].toUpperCase()}${name.slice(1).replace(/-/g, ' ')} icon`, { mode: 'flow', w: size, h: size, grow: 0, stroke: color, strokeWidth: 2 }, { svgD: ICON_PATHS[name], vw: 24, vh: 24, pts: [], closed: false });
export const btnText = (text: string, color: string, size = 15): Node => { const t = label(text, size, 600, color); t.tag = 'span'; return t; };
/** Rows of icon + label must stay horizontal at every breakpoint, so the direction is pinned the same way as in label rows. */
type Look = { fill: string; hover: string; color: string; stroke?: string; active?: string; ring?: string };
/** Every button gets the full set of states: hover, a visible keyboard-focus ring, a pressed colour and a dimmed disabled look. */
export const iconButton = (name: string, parts: Node[], look: Look, style: Node['style'] = {}, attrs: Record<string, string | boolean> = {}, behavior?: Behavior): Node =>
  mk('container', name, { mode: 'flow', w: 'auto', h: 'auto', self: 'start', layout: 'flex', dir: 'row', items: 'center', justify: 'center', gap: 8, padX: 18, padY: 11, radius: 10, fill: look.fill, ...(look.stroke ? { stroke: look.stroke, strokeWidth: 1 } : {}), ...style, ...(typeof (style as any).h === 'number' && (style as any).minH === undefined ? { minH: (style as any).h } : {}) },
    { tag: 'button', attrs: { type: 'button', cursor: 'pointer', outline: 'none', ...attrs }, ...(behavior ? { behavior } : {}), children: parts,
      states: { hover: { fill: look.hover }, focus: { shadowCss: `0 0 0 3px ${look.ring || 'rgba(79,70,229,0.35)'}` }, active: { fill: look.active || look.hover }, disabled: { opacity: 0.5 } } as Node['states'],
      bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } });
export const BRAND: Look = { fill: '#4f46e5', hover: '#4338ca', active: '#3730a3', color: '#ffffff' };
export const DARK: Look = { fill: '#111827', hover: '#1f2937', active: '#030712', color: '#ffffff', ring: 'rgba(17,24,39,0.3)' };
export const OUTLINE: Look = { fill: '#ffffff', hover: '#f9fafb', active: '#f3f4f6', color: '#111827', stroke: '#d1d5db', ring: 'rgba(17,24,39,0.2)' };
export const SOFT: Look = { fill: '#eef2ff', hover: '#e0e7ff', active: '#c7d2fe', color: '#4338ca' };
export const GHOST: Look = { fill: 'transparent', hover: '#f3f4f6', active: '#e5e7eb', color: '#111827', ring: 'rgba(17,24,39,0.2)' };
export const DANGER: Look = { fill: '#dc2626', hover: '#b91c1c', active: '#991b1b', color: '#ffffff', ring: 'rgba(220,38,38,0.35)' };
export const GRADIENT: Look = { fill: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', hover: 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)', color: '#ffffff', ring: 'rgba(236,72,153,0.35)' };
export const textBtn = (name: string, text: string, look: Look, style: Node['style'] = {}, attrs: Record<string, string | boolean> = {}): Node => iconButton(name, [btnText(text, look.color)], look, style, attrs);

const buttons: KitItem[] = [
  { name: 'Primary button', blurb: 'The main action on a page. Hover, pressed, keyboard-focus and disabled looks are built in.', make: () => textBtn('Primary button', 'Get started', BRAND) },
  { name: 'Secondary button', blurb: 'A soft tinted button for the second most important action.', make: () => textBtn('Secondary button', 'Learn more', SOFT) },
  { name: 'Outline button', blurb: 'A thin border and no fill. Sits well next to a primary button.', make: () => textBtn('Outline button', 'View pricing', OUTLINE) },
  { name: 'Ghost button', blurb: 'No fill and no border until you hover it. For low-priority actions such as cancel.', make: () => textBtn('Ghost button', 'Cancel', GHOST) },
  { name: 'Danger button', blurb: 'Red, for actions that delete or cannot be undone.', make: () => iconButton('Danger button', [iconNode('trash', 18, '#ffffff'), btnText('Delete account', '#ffffff')], DANGER) },
  { name: 'Gradient button', blurb: 'A colourful call to action. Change the colours from Fill.', make: () => textBtn('Gradient button', 'Start free trial', GRADIENT, { radius: 999, padX: 26, padY: 13 }) },
  { name: 'Link button', blurb: 'Looks like a link with an arrow. Good under a paragraph or a card.',
    make: () => iconButton('Link button', [btnText('Read the guide', '#4f46e5'), iconNode('arrow-right', 18, '#4f46e5')], { fill: 'transparent', hover: 'transparent', color: '#4f46e5', ring: 'rgba(79,70,229,0.3)' }, { padX: 0, padY: 4 }) },
  { name: 'Disabled button', blurb: 'A button that cannot be pressed yet, for example until a form is filled in.',
    make: () => textBtn('Disabled button', 'Submit', { fill: '#e5e7eb', hover: '#e5e7eb', color: '#9ca3af' }, {}, { type: 'button', disabled: true, cursor: 'not-allowed' }) },
  { name: 'Button sizes', blurb: 'Small, medium and large side by side, so you can pick the size that fits.',
    make: () => stack('Button sizes', 'row', [
      textBtn('Small button', 'Small', BRAND, { padX: 12, padY: 6, radius: 8 }), textBtn('Medium button', 'Medium', BRAND), textBtn('Large button', 'Large', BRAND, { padX: 28, padY: 15, radius: 12 }),
    ].map(b => ({ ...b, style: { ...b.style, self: 'auto' } })), { gap: 12, w: 'auto', wrap: true, self: 'start', items: 'center' }) },
  { name: 'Full-width button', blurb: 'Stretches to fill its container. The usual choice for sign-in forms and phone screens.', make: () => textBtn('Full-width button', 'Continue', BRAND, { w: 'fill', padY: 15, fontSize: 17, self: 'stretch' }) },
  { name: 'Loading button', blurb: 'A spinner and a short message while something saves. It is disabled so it cannot be pressed twice.',
    make: () => { const sp = iconNode('loader', 18, '#ffffff'); sp.anim = { preset: 'spin', duration: 900, delay: 0, ease: 'linear', repeat: 0, trigger: 'load' }; return iconButton('Loading button', [sp, btnText('Saving…', '#ffffff')], BRAND, { opacity: 0.85 }, { type: 'button', disabled: true, 'aria-busy': true, cursor: 'wait' }); } },
  { name: 'Button with badge', blurb: 'A count beside the label, such as unread messages or items in a cart.',
    make: () => { const c = label('3', 12, 700, '#4f46e5'); c.style = { ...c.style, padX: 8, padY: 2, radius: 999, fill: '#ffffff' } as Node['style']; return iconButton('Button with badge', [iconNode('bell', 18, '#ffffff'), btnText('Alerts', '#ffffff'), c], BRAND); } },
  { name: 'Icon button group', blurb: 'Three round icon buttons in a row, for like, share and notify.',
    make: () => stack('Icon button group', 'row', ['heart', 'share', 'bell'].map((ic, i) => iconButton(['Like', 'Share', 'Notify'][i], [iconNode(ic as IconName, 20, '#111827')], { fill: '#f3f4f6', hover: '#e5e7eb', color: '#111827', ring: 'rgba(17,24,39,0.2)' }, { w: 44, h: 44, padX: 0, padY: 0, radius: 999, self: 'auto' }, { 'aria-label': ['Like', 'Share', 'Notify'][i] })), { gap: 8, w: 'auto', self: 'start', wrap: false }, { bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } }) },
  { name: 'Segmented control', blurb: 'Pick one of a few options, like Day, Week and Month. The active one is raised.',
    make: () => { const seg = (t: string, on: boolean) => { const b = textBtn(t, t, { fill: on ? '#ffffff' : 'transparent', hover: on ? '#ffffff' : 'rgba(255,255,255,0.6)', color: on ? '#111827' : '#6b7280', ring: 'rgba(79,70,229,0.35)' }, { padX: 18, padY: 8, radius: 9, self: 'auto', ...(on ? { shadow: 'sm' } : {}) }); return b; };
      return pinRow(stack('Segmented control', 'row', [seg('Day', true), seg('Week', false), seg('Month', false)], { w: 'auto', self: 'start', gap: 4, pad: 4, radius: 12, fill: '#f3f4f6', wrap: false })); } },
  { name: 'Dropdown button', blurb: 'A button that opens a small menu of actions. Click anywhere else to close it. Works in exported pages.',
    make: () => scope('Dropdown button', 'column', [
      iconButton('Options', [btnText('Options', '#111827'), iconNode('chevron-down', 18, '#111827')], OUTLINE, { self: 'start' }, {}, { role: 'toggle', key: 'dd' }),
      ((m: Node): Node => ({ ...m, attrs: { z: '30' } }))(panel('Menu', [linkItem('Edit'), linkItem('Duplicate'), linkItem('Share'), linkItem('Delete')], { key: 'dd', dismiss: true },
        { w: 200, gap: 2, pad: 6, radius: 12, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'md', position: 'absolute', top: 52, left: 0 })),
    ], { w: 'auto', self: 'start', position: 'relative', gap: 0 }) },
  { name: 'Floating action button', blurb: 'A round button fixed to the bottom corner of the screen. For the one action people want everywhere.',
    make: () => withAttrs(iconButton('Floating action button', [iconNode('plus', 26, '#ffffff')], BRAND, { w: 56, h: 56, padX: 0, padY: 0, radius: 999, shadow: 'lg', position: 'fixed', bottom: 24, right: 24, self: 'auto' }, { 'aria-label': 'Add' }), { z: '40' }) },
  { name: 'Sticky checkout bar', blurb: 'A bar fixed to the bottom with a price and one big button. Made for phone product pages.',
    make: () => withAttrs(pinRow(stack('Checkout bar', 'row', [
      stack('Price', 'column', [label('$49.00', 20, 800, '#111827'), hint('Free delivery')], { w: 'auto', gap: 0, items: 'start' }),
      textBtn('Buy now', 'Buy now', BRAND, { padX: 28, padY: 14, radius: 12, self: 'auto' }),
    ], { w: 'auto', justify: 'between', gap: 16, padX: 16, padY: 12, fill: '#ffffff', borderT: 1, stroke: '#e5e7eb', shadow: 'lg', position: 'fixed', bottom: 0, left: 0, right: 0, wrap: false })), { z: '40' }) },
  { name: 'Button with leading icon', blurb: 'An icon before the label. Good for actions such as add, create or upload.',
    make: () => iconButton('Button with leading icon', [iconNode('plus', 18, BRAND.color), btnText('New project', BRAND.color)], BRAND) },
  { name: 'Button with trailing icon', blurb: 'An arrow after the label. Tells people the button moves them forward.',
    make: () => iconButton('Button with trailing icon', [btnText('Continue', DARK.color), iconNode('arrow-right', 18, DARK.color)], DARK) },
  { name: 'Outline button with icon', blurb: 'A quiet secondary action with a thin border. Pair it with a filled button.',
    make: () => iconButton('Outline button with icon', [iconNode('download', 18, OUTLINE.color), btnText('Download', OUTLINE.color)], OUTLINE) },
  { name: 'Icon-only button', blurb: 'A round button with just an icon. It gets an accessible name from its label attribute.',
    make: () => iconButton('Icon-only button', [iconNode('heart', 20, '#111827')], { fill: '#f3f4f6', hover: '#e5e7eb', color: '#111827' }, { w: 44, h: 44, padX: 0, padY: 0, radius: 999 }, { 'aria-label': 'Like' }) },
  { name: 'Button pair', blurb: 'A filled call to action next to an outline one, each with its own icon.',
    make: () => stack('Button pair', 'row', [
      iconButton('Primary button', [btnText('Get started', BRAND.color), iconNode('arrow-right', 18, BRAND.color)], BRAND),
      iconButton('Secondary button', [iconNode('external-link', 18, OUTLINE.color), btnText('Live demo', OUTLINE.color)], OUTLINE),
    ], { gap: 12, w: 'auto', wrap: true, self: 'start' }) },
];

/* ---------- interactive blocks (need the behavior runtime in exports; see document/behavior.ts) ---------- */
export const plainButton = (text: string, behavior?: Behavior, style: Node['style'] = {}): Node => {
  const b = makeButton(0, 0, text);
  b.href = undefined; b.tag = 'button'; b.attrs = { type: 'button' };
  b.style = { ...b.style, mode: 'flow', w: 'auto', h: 'auto', padX: 16, padY: 10, ...style };
  if (behavior) b.behavior = behavior;
  return b;
};
export const linkItem = (text: string): Node => {
  const t = label(text, 15, 500, '#374151'); t.href = '#'; t.style = { ...t.style, w: 'fill', padX: 12, padY: 8, radius: 8 };
  t.states = { hover: { fill: '#f3f4f6' } }; return t;
};
export const inlineLink = (text: string): Node => { const n = linkItem(text); n.style = { ...n.style, w: 'auto' }; return n; };
export const scope = (name: string, dir: 'row' | 'column', kids: Node[], style: Node['style'] = {}): Node => ({ ...stack(name, dir, kids, style), behavior: { role: 'scope' } });
export const panel = (name: string, kids: Node[], behavior: Omit<Behavior, 'role'>, style: Node['style'] = {}, dir: 'row' | 'column' = 'column'): Node =>
  ({ ...stack(name, dir, kids, style), behavior: { role: 'panel', ...behavior } });
const ghost = { fill: 'transparent', color: '#374151', stroke: '#d1d5db', strokeWidth: 1 };

export const NAV_BAR: Node['style'] = { wrap: true, justify: 'between', gap: 16, padX: 24, padY: 16, minH: 72, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 };
/** Icon-only button that opens (or closes) a panel. The icon is a drawn path, so it needs no icon font. */
export const hamburger = (key: string, opts: { mobileOnly?: boolean } = {}, icon: IconName = 'menu', name = 'Open menu', ink = '#111827', hoverFill = '#f3f4f6'): Node =>
  iconButton(name, [iconNode(icon, 22, ink)], { fill: 'transparent', hover: hoverFill, color: ink }, { w: 44, h: 44, padX: 0, padY: 0, radius: 10, self: 'auto' },
    { 'aria-label': name }, { role: icon === 'close' ? 'close' : 'toggle', key, ...opts });
/* ---------- more navbars: they differ in where they sit (page flow, stuck to the top, floating, bottom) and how the menu opens ---------- */
export const withAttrs = (n: Node, attrs: Record<string, string>, extra: Partial<Node> = {}): Node => ({ ...pinRow(n), attrs: { ...(n.attrs || {}), ...attrs }, ...extra });
const BAR_H = 72;
/** Links sit in a row on desktop; on phones the panel drops down over the page (absolute, under the bar) instead of pushing it down. */
const overlayMenu = (key: string, look: Node['style'] = {}): Node => ({
  ...panel('Menu links', [inlineLink('Product'), inlineLink('Pricing'), inlineLink('About'), { ...plainButton('Get started'), attrs: { type: 'button', whitespace: 'nowrap' } }], { key, mobile: true },
    { w: 'fill', gap: 8, justify: 'end' }, 'row'),
  bp: { tablet: { dir: 'row' }, mobile: { dir: 'column', position: 'absolute', top: BAR_H, left: 0, right: 0, w: 'auto', justify: 'start', items: 'stretch', gap: 4, pad: 16, fill: '#ffffff', shadow: 'lg', borderB: 1, stroke: '#e5e7eb', ...look } },
});
const bigLink = (text: string): Node => { const t = label(text, 30, 700, '#ffffff'); t.href = '#'; t.style = { ...t.style, w: 'fill', align: 'center', padY: 10 }; t.states = { hover: { color: '#c7d2fe' } }; return t; };
const sheetLink = (text: string): Node => { const t = label(text, 17, 600, '#111827'); t.href = '#'; t.style = { ...t.style, w: 'fill', padX: 14, padY: 14, radius: 12 }; t.states = { hover: { fill: '#f3f4f6' } }; return t; };
const drawerNav = (side: 'left' | 'right'): Node => pinRow(scope(side === 'left' ? 'Navbar left drawer' : 'Navbar drawer', 'row', [
  ...(side === 'left' ? [hamburger('drawer'), brandMark(22)] : [brandMark(22), hamburger('drawer')]),
  panel('Drawer overlay', [
    stack('Drawer', 'column', [
      pinRow(stack('Drawer header', 'row', [label('Menu', 16, 700, '#111827'), hamburger('drawer', {}, 'close', 'Close menu')], { justify: 'between', gap: 12 })),
      linkItem('Product'), linkItem('Pricing'), linkItem('About'), plainButton('Get started'),
    ], { w: 300, h: 'fill', gap: 8, pad: 20, fill: '#ffffff', shadow: 'lg' }),
  ], { key: 'drawer', modal: true, dismiss: true }, { position: 'fixed', inset: 0, justify: side === 'left' ? 'start' : 'end', items: 'stretch', w: 'fill', h: 'fill', fill: 'rgba(17,24,39,0.45)' }, 'row'),
], { ...NAV_BAR, justify: side === 'left' ? 'start' : 'between', gap: 16 }));
const tab = (icon: IconName, text: string, active = false): Node => {
  const c = active ? '#4f46e5' : '#6b7280';
  const t = stack(text, 'column', [iconNode(icon, 22, c), label(text, 11, 600, c)], { w: 'fill', gap: 3, items: 'center', padY: 6, radius: 10 }, { tag: 'a', href: '#', bp: { tablet: { dir: 'column' }, mobile: { dir: 'column' } } });
  t.states = { hover: { fill: '#f3f4f6' } }; return t;
};

const moreNavbars: KitItem[] = [
  { name: 'Sticky navbar', blurb: 'Stays stuck to the top while the page scrolls. On phones the menu drops down over the content instead of pushing it.',
    make: () => withAttrs(scope('Navbar sticky', 'row', [
      brandMark(22),
      hamburger('menu', { mobileOnly: true }),
      overlayMenu('menu'),
    ], { ...NAV_BAR, wrap: false, position: 'sticky', top: 0, shadow: 'sm' }), { z: '50' }) },
  { name: 'Floating pill navbar', blurb: 'A rounded, frosted bar that floats above the page near the top. The menu opens as a rounded card beneath it.',
    make: () => withAttrs(scope('Navbar floating', 'row', [
      brandMark(20),
      hamburger('menu', { mobileOnly: true }),
      { ...overlayMenu('menu', { top: 64, left: 0, right: 0, radius: 24, borderB: 0, strokeWidth: 1 }) },
    ], { wrap: false, justify: 'between', gap: 16, padX: 22, padY: 10, minH: 56, w: 'auto', radius: 999, fill: 'rgba(255,255,255,0.93)', bgBlur: 16, stroke: 'rgba(17,24,39,0.08)', strokeWidth: 1, shadow: 'md', position: 'fixed', top: 12, left: 16, right: 16 }), { z: '50' }) },
  { name: 'Navbar with side drawer', blurb: 'Always a hamburger, at every screen size. The links slide in from the right in a drawer.', make: () => drawerNav('right') },
  { name: 'Navbar with left drawer', blurb: 'The menu button sits on the left and the drawer opens from the left edge, the way many apps do.', make: () => drawerNav('left') },
  { name: 'Full-screen menu navbar', blurb: 'The hamburger covers the whole screen with a dark menu and large links. Good for portfolios and short menus.',
    make: () => pinRow(scope('Navbar full screen', 'row', [
      brandMark(22),
      hamburger('full'),
      panel('Full-screen menu', [
        pinRow(stack('Menu top', 'row', [label('Brand', 22, 800, '#ffffff'), hamburger('full', {}, 'close', 'Close menu', '#ffffff', 'rgba(255,255,255,0.12)')], { justify: 'between', padX: 24, padY: 16, minH: BAR_H })),
        stack('Menu links', 'column', [bigLink('Product'), bigLink('Pricing'), bigLink('About'), bigLink('Contact')], { w: 'fill', h: 'fill', justify: 'center', items: 'center', gap: 6, pad: 24 }),
      ], { key: 'full', modal: true, dismiss: true }, { position: 'fixed', inset: 0, w: 'fill', h: 'fill', gap: 0, fill: '#111827' }),
    ], { ...NAV_BAR, justify: 'between' })) },
  { name: 'Bottom sheet menu', blurb: 'The hamburger raises a sheet from the bottom of the screen. Easy to reach with a thumb.',
    make: () => pinRow(scope('Navbar bottom sheet', 'row', [
      brandMark(22),
      hamburger('sheet'),
      panel('Sheet overlay', [
        stack('Sheet', 'column', [
          pinRow(stack('Sheet handle', 'row', [stack('Handle', 'row', [], { w: 44, h: 5, radius: 3, fill: '#d1d5db' })], { justify: 'center', padB: 6 })),
          sheetLink('Product'), sheetLink('Pricing'), sheetLink('About'), plainButton('Get started', undefined, { w: 'fill', padY: 14 }),
        ], { w: 'fill', maxW: 560, self: 'center', gap: 4, pad: 20, padB: 28, fill: '#ffffff', radiusTL: 22, radiusTR: 22, shadow: 'lg' }),
      ], { key: 'sheet', modal: true, dismiss: true }, { position: 'fixed', inset: 0, w: 'fill', h: 'fill', justify: 'end', items: 'stretch', fill: 'rgba(17,24,39,0.45)' }, 'column'),
    ], { ...NAV_BAR, justify: 'between' })) },
  { name: 'Bottom tab bar (phones)', blurb: 'Icon tabs fixed to the bottom of the screen like a mobile app. It shows on phones only, so pair it with a top navbar for desktop.',
    make: () => withAttrs(stack('Tab bar', 'row', [tab('home', 'Home', true), tab('search', 'Search'), tab('bell', 'Alerts'), tab('user', 'Profile')],
      { w: 'auto', gap: 4, padX: 8, padT: 6, padB: 10, fill: '#ffffff', borderT: 1, stroke: '#e5e7eb', shadow: 'lg', position: 'fixed', bottom: 0, left: 0, right: 0, display: 'none' },
      { tag: 'nav', bp: { tablet: { display: 'none' }, mobile: { display: 'flex', dir: 'row' } } }), { z: '50' }) },
  { name: 'App header (centered title)', blurb: 'A compact header with a menu button, a centered title and an action button. It stays at the top while scrolling.',
    make: () => withAttrs(scope('App header', 'row', [
      hamburger('menu'),
      pinRow(stack('Title', 'row', [label('Page title', 17, 700, '#111827')], { w: 'fill', justify: 'center' })),
      iconButton('Search', [iconNode('search', 22, '#111827')], { fill: 'transparent', hover: '#f3f4f6', color: '#111827' }, { w: 44, h: 44, padX: 0, padY: 0, radius: 10, self: 'auto' }, { 'aria-label': 'Search' }),
      panel('Menu list', [linkItem('Home'), linkItem('Explore'), linkItem('Saved'), linkItem('Settings')], { key: 'menu', dismiss: true },
        { w: 240, gap: 2, pad: 8, radius: 14, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'md', position: 'absolute', top: 60, left: 12 }),
    ], { wrap: false, gap: 8, padX: 12, padY: 8, minH: 60, fill: '#ffffff', borderB: 1, stroke: '#e5e7eb', position: 'sticky', top: 0 }), { z: '50' }) },
];

/** Placeholder photos from Unsplash (linked, not embedded). Each box keeps a soft gradient underneath, so it is never blank while a photo loads or if it cannot load. Swap any in the Assets panel. They are linked, not embedded: the project stores the web address, and every use keeps a gradient underneath so a box is never blank if the photo cannot load. Swap one for your own picture from Fill → Background image. */
const unsplash = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
export const STOCK: Record<string, Asset> = {
  office: { id: 'stock-office', name: 'office (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1497366216548-37526070297c', 1600) },
  team: { id: 'stock-team', name: 'team (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1522071820081-009f0129c71c', 1200) },
  workspace: { id: 'stock-workspace', name: 'workspace (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1488190211105-8b0e65b80b4e', 1200) },
  valley: { id: 'stock-valley', name: 'valley (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1469474968028-56623f02e42e', 900) },
  mountains: { id: 'stock-mountains', name: 'mountains (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1506744038136-46273834b3fb', 900) },
  lake: { id: 'stock-lake', name: 'lake (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1501785888041-af3ef285b470', 900) },
  beach: { id: 'stock-beach', name: 'beach (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1507525428034-b723cf961d3e', 900) },
  night: { id: 'stock-night', name: 'night (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1519681393784-d120267933ba', 900) },
  woods: { id: 'stock-woods', name: 'woods (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1441974231531-c6227db76b6e', 900) },
  portraitA: { id: 'stock-portraitA', name: 'portraitA (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1494790108377-be9c29b29330', 480) },
  portraitB: { id: 'stock-portraitB', name: 'portraitB (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1507003211169-0a1dd7228f2d', 480) },
  portraitC: { id: 'stock-portraitC', name: 'portraitC (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1438761681033-6461ffad8d80', 480) },
  portraitD: { id: 'stock-portraitD', name: 'portraitD (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1472099645785-5658abf4ff4e', 480) },
  portraitE: { id: 'stock-portraitE', name: 'portraitE (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1544005313-94ddf0286df2', 480) },
  portraitF: { id: 'stock-portraitF', name: 'portraitF (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1500648767791-00dcc994a43e', 480) },
  portraitG: { id: 'stock-portraitG', name: 'portraitG (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1517841905240-472988babdf9', 480) },
  portraitH: { id: 'stock-portraitH', name: 'portraitH (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1535713875002-d1d0cf377fde', 480) },
  pizza: { id: 'stock-pizza', name: 'pizza (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1513104890138-7c749659a591', 900) },
  meal: { id: 'stock-meal', name: 'meal (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1504674900247-0877df9cc836', 900) },
  flatlay: { id: 'stock-flatlay', name: 'flatlay (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1490645935967-10de6ba17061', 900) },
  code: { id: 'stock-code', name: 'code (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1498050108023-c5249f4df085', 900) },
  analytics: { id: 'stock-analytics', name: 'analytics (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1460925895917-afdab827c52f', 900) },
  watch: { id: 'stock-watch', name: 'watch (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1523275335684-37898b6baf30', 900) },
  headphones: { id: 'stock-headphones', name: 'headphones (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1505740420928-5e560c06d30e', 900) },
  sneaker: { id: 'stock-sneaker', name: 'sneaker (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1542291026-7eec264c27ff', 900) },
  house: { id: 'stock-house', name: 'house (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1512917774080-9991f1c4c750', 900) },
  interior: { id: 'stock-interior', name: 'interior (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1493663284031-b7e3aefcae8e', 900) },
  building: { id: 'stock-building', name: 'building (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1486406146926-c627a92ad1ab', 900) },
  forest: { id: 'stock-forest', name: 'forest (Unsplash)', mime: 'image/jpeg', dataUrl: unsplash('1470071459604-3b5ec3a7fe05', 1600) },
};
export const STOCK_TINT: Record<string, string> = {
  'stock-office': 'linear-gradient(135deg,#818cf8,#4338ca)',
  'stock-team': 'linear-gradient(135deg,#fbbf24,#d97706)',
  'stock-workspace': 'linear-gradient(135deg,#94a3b8,#475569)',
  'stock-valley': 'linear-gradient(135deg,#86efac,#16a34a)',
  'stock-mountains': 'linear-gradient(135deg,#7dd3fc,#0369a1)',
  'stock-lake': 'linear-gradient(135deg,#5eead4,#0d9488)',
  'stock-beach': 'linear-gradient(135deg,#fde047,#38bdf8)',
  'stock-night': 'linear-gradient(135deg,#312e81,#6366f1)',
  'stock-woods': 'linear-gradient(135deg,#65a30d,#3f6212)',
  'stock-forest': 'linear-gradient(135deg,#22c55e,#15803d)',
  'stock-portraitA': 'linear-gradient(135deg,#f9a8d4,#ec4899)',
  'stock-portraitB': 'linear-gradient(135deg,#93c5fd,#3b82f6)',
  'stock-portraitC': 'linear-gradient(135deg,#fcd34d,#f59e0b)',
  'stock-portraitD': 'linear-gradient(135deg,#86efac,#22c55e)',
  'stock-portraitE': 'linear-gradient(135deg,#c4b5fd,#8b5cf6)',
  'stock-portraitF': 'linear-gradient(135deg,#fdba74,#f97316)',
  'stock-portraitG': 'linear-gradient(135deg,#67e8f9,#06b6d4)',
  'stock-portraitH': 'linear-gradient(135deg,#fda4af,#f43f5e)',
  'stock-pizza': 'linear-gradient(135deg,#fb923c,#dc2626)',
  'stock-meal': 'linear-gradient(135deg,#facc15,#ea580c)',
  'stock-flatlay': 'linear-gradient(135deg,#f9a8d4,#a855f7)',
  'stock-code': 'linear-gradient(135deg,#1e293b,#22d3ee)',
  'stock-analytics': 'linear-gradient(135deg,#a5b4fc,#4f46e5)',
  'stock-watch': 'linear-gradient(135deg,#cbd5e1,#64748b)',
  'stock-headphones': 'linear-gradient(135deg,#fca5a5,#ef4444)',
  'stock-sneaker': 'linear-gradient(135deg,#6ee7b7,#10b981)',
  'stock-house': 'linear-gradient(135deg,#fdba74,#c2410c)',
  'stock-interior': 'linear-gradient(135deg,#d6d3d1,#78716c)',
  'stock-building': 'linear-gradient(135deg,#94a3b8,#334155)',
};
export const STOCK_ASSETS: Asset[] = Object.values(STOCK);
/** Finds the placeholder photos a block uses, so the caller can add them to the project and rewrite the ids. */
export const stockIdsIn = (n: Node): string[] => [...(n.style?.fillImg && String(n.style.fillImg).startsWith('stock-') ? [String(n.style.fillImg)] : []), ...(n.children || []).flatMap(stockIdsIn)];
export const remapFill = (n: Node, map: Record<string, string>): Node => {
  const id = n.style?.fillImg ? String(n.style.fillImg) : ''; const to = id && map[id];
  const style = to ? { ...n.style, fillImg: to, ...(n.style.fill === undefined && STOCK_TINT[id] ? { fill: STOCK_TINT[id] } : {}) } : n.style;
  return { ...n, style, ...(n.children ? { children: n.children.map(c => remapFill(c, map)) } : {}) };
};

/* ---------- hero sections: every size, font and padding steps down on tablet and phone ---------- */
type St = NonNullable<Node['style']>;
export const hText = (text: string, size: number, o: { color?: string; weight?: number; align?: 'left' | 'center'; max?: number; lh?: number } = {}): Node => {
  const n = makeHeading(0, 0, text, size);
  n.style = { ...n.style, mode: 'flow', w: 'fill', h: 'auto', fontSize: size, fontWeight: o.weight ?? 800, color: o.color ?? '#0f172a', align: o.align ?? 'left', lineHeight: o.lh ?? 1.08, letterSpacing: -1, ...(o.max ? { maxW: o.max, self: o.align === 'center' ? 'center' : 'start' } : {}) } as St;
  n.bp = { tablet: { fontSize: Math.round(size * 0.78) }, mobile: { fontSize: Math.max(28, Math.round(size * 0.58)) } };
  return n;
};
export const pText = (text: string, o: { color?: string; align?: 'left' | 'center'; max?: number; size?: number } = {}): Node => {
  const n = makeText(0, 0, text, o.size ?? 19);
  n.style = { ...n.style, mode: 'flow', w: 'fill', h: 'auto', fontSize: o.size ?? 19, color: o.color ?? '#475569', align: o.align ?? 'left', lineHeight: 1.55, ...(o.max ? { maxW: o.max, self: o.align === 'center' ? 'center' : 'start' } : {}) } as St;
  n.bp = { mobile: { fontSize: Math.max(16, (o.size ?? 19) - 2) } };
  return n;
};
export const heroBtn = (text: string, kind: 'primary' | 'ghost' | 'light' | 'lightGhost' = 'primary'): Node => {
  const b = makeButton(0, 0, text);
  const look: Record<string, St> = {
    primary: { fill: '#4f46e5', color: '#ffffff' }, ghost: { fill: 'transparent', color: '#0f172a', stroke: '#cbd5e1', strokeWidth: 1 },
    light: { fill: '#ffffff', color: '#0f172a' }, lightGhost: { fill: 'transparent', color: '#ffffff', stroke: 'rgba(255,255,255,0.55)', strokeWidth: 1 },
  };
  b.style = { ...b.style, mode: 'flow', w: 'auto', h: 'auto', padX: 24, padY: 14, radius: 999, fontSize: 16, fontWeight: 600, ...look[kind] } as St;
  b.states = { hover: kind === 'primary' ? { fill: '#4338ca' } : kind === 'ghost' ? { fill: '#f1f5f9' } : { opacity: 0.88 } } as Node['states'];
  return b;
};
export const heroButtons = (kids: Node[], justify: 'start' | 'center' = 'center'): Node => stack('Buttons', 'row', kids, { w: 'fill', wrap: true, gap: 12, justify, items: justify === 'center' ? 'center' : 'start' });
export const eyebrow = (text: string, dark = false): Node => {
  const t = label(text, 13, 600, dark ? '#e0e7ff' : '#4338ca');
  t.style = { ...t.style, padX: 14, padY: 6, radius: 999, fill: dark ? 'rgba(255,255,255,0.14)' : '#e0e7ff', self: 'start' } as St; return t;
};
export const heroSection = (name: string, kids: Node[], st: St = {}, bp: NonNullable<Node['bp']> = {}): Node => {
  const n = makeSection(name, 480, st.fill as string | undefined);
  n.style = { ...n.style, layout: 'flex', dir: 'column', items: 'center', justify: 'center', gap: 24, padX: 64, padY: 88, h: 'auto', minH: 480, ...st } as St;
  n.children = flowKids(kids);
  n.bp = { tablet: { padX: 40, padY: 64, ...bp.tablet }, mobile: { padX: 20, padY: 48, gap: 18, ...bp.mobile } };
  return n;
};
export const visual = (kind: 'photo' | 'gradient' | 'card' = 'gradient', h = 380, photo: keyof typeof STOCK = 'team'): Node => {
  const st: St = { w: 'fill', h, radius: 28, shadow: 'lg', fill: kind === 'card' ? '#ffffff' : 'linear-gradient(135deg, #818cf8 0%, #f472b6 100%)', grow: 1 } as St;
  if (kind === 'photo') Object.assign(st, { fillImg: STOCK[photo].id, bgSize: 'cover', bgPos: 'center', bgRepeat: 'no-repeat' });
  const v = stack('Hero visual', 'column', [], st as Node['style']);
  v.bp = { tablet: { h: Math.round(h * 0.8) }, mobile: { h: Math.round(h * 0.6) } };
  return v;
};
export const stat = (value: string, text: string): Node => stack('Stat', 'column', [hText(value, 44, { align: 'center', weight: 800 }), pText(text, { align: 'center', size: 15 })], { w: 'auto', minW: 120, gap: 4, grow: 1, items: 'stretch' });
export const copyCol = (kids: Node[]): Node => stack('Hero copy', 'column', kids, { w: 'fill', grow: 1, gap: 20, items: 'stretch' });

const heroes: KitItem[] = [
  { name: 'Centered hero', blurb: 'A small label, a big headline, a sentence and two buttons, all centered. The safe choice for most pages.',
    make: () => heroSection('Centered hero', [eyebrow('New · Version 2.0'), hText('A clear promise for your customers', 60, { align: 'center', max: 820 }), pText('Say what you do and who it is for in one or two short sentences.', { align: 'center', max: 620 }), heroButtons([heroBtn('Get started'), heroBtn('Learn more', 'ghost')])], { fill: '#f8fafc', gap: 22 }) },
  { name: 'Split hero (image right)', blurb: 'Words on the left, a picture on the right. On phones the picture drops below the words.',
    make: () => heroSection('Split hero', [copyCol([eyebrow('For small teams'), hText('Build with confidence', 54), pText('A flexible product for ambitious teams, with everything you need in one place.'), heroButtons([heroBtn('Start free'), heroBtn('Book a demo', 'ghost')], 'start')]), visual('photo', 380, 'team')], { dir: 'row', gap: 56, items: 'center', fill: '#ffffff' }, { tablet: { gap: 32 } }) },
  { name: 'Split hero (image left)', blurb: 'The same idea with the picture first. Good for showing a product before the pitch.',
    make: () => heroSection('Split hero reversed', [visual('photo', 380, 'workspace'), copyCol([hText('See it before you buy it', 50), pText('Show the product, then explain it. Two short sentences are plenty.'), heroButtons([heroBtn('Try the demo')], 'start')])], { dir: 'row', gap: 56, items: 'center', fill: '#ffffff' }, { tablet: { gap: 32 } }) },
  { name: 'Image hero (background photo)', blurb: 'A full-width photo behind white text with a dark tint. Starts with an Unsplash placeholder photo.',
    make: () => {
      const n = heroSection('Image hero', [eyebrow('Our story', true), hText('Make it unforgettable', 64, { color: '#ffffff', max: 760 }), pText('A placeholder photo from Unsplash. Pick this section, then Fill → Background image to use your own.', { color: 'rgba(255,255,255,0.9)', max: 560 }), heroButtons([heroBtn('Get started', 'light'), heroBtn('Watch the film', 'lightGhost')], 'start')],
        { minH: 580, items: 'start', fill: 'linear-gradient(135deg, #1e1b4b 0%, #6366f1 100%)' }, { tablet: { minH: 480 }, mobile: { minH: 440 } });
      Object.assign(n.style, { fillImg: STOCK.office.id, bgSize: 'cover', bgPos: 'center', bgRepeat: 'no-repeat', bgTint: 'rgba(15,23,42,0.58)' });
      return n;
    } },
  { name: 'Gradient hero', blurb: 'A bold colour gradient with white text. Quick to make, easy to recolour from Fill.',
    make: () => heroSection('Gradient hero', [hText('Design that moves', 64, { color: '#ffffff', align: 'center', max: 760 }), pText('A bold backdrop behind a short promise.', { color: 'rgba(255,255,255,0.9)', align: 'center', max: 560 }), heroButtons([heroBtn('Start free', 'light'), heroBtn('See pricing', 'lightGhost')])], { fill: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', minH: 520 }) },
  { name: 'Hero with email signup', blurb: 'A headline with an email field and button side by side. On phones the field and button stack.',
    make: () => {
      const email = makeInput('email', 'email', 'Enter your email'); email.style = { ...email.style, mode: 'flow', w: 'auto', h: 'auto', grow: 1, minW: 200, padX: 18, padY: 14, radius: 999, fontSize: 16, fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 1 } as St;
      const go = heroBtn('Join the waitlist');
      const form = stack('Signup row', 'row', [email, go], { w: 'fill', maxW: 520, self: 'center', gap: 10, wrap: false, items: 'stretch' });
      form.bp = { tablet: { dir: 'row' }, mobile: { dir: 'column' } };
      return heroSection('Signup hero', [hText('Be first in line', 56, { align: 'center', max: 760 }), pText('Join the waitlist and we will email you the day we open the doors.', { align: 'center', max: 560 }), form, hint('No spam. Unsubscribe any time.')], { fill: '#eef2ff', gap: 22 });
    } },
  { name: 'Hero with stats', blurb: 'A centered headline with three headline numbers underneath. The numbers become one column on phones.',
    make: () => {
      const stats = stack('Stats', 'row', [stat('12k+', 'Happy customers'), stat('99.9%', 'Uptime'), stat('24/7', 'Support')], { w: 'fill', maxW: 760, self: 'center', gap: 24, wrap: false, justify: 'center', padT: 16 });
      stats.bp = { tablet: { dir: 'row' }, mobile: { dir: 'column', gap: 18 } };
      return heroSection('Stats hero', [hText('Trusted by teams everywhere', 56, { align: 'center', max: 800 }), pText('Numbers that show it is working.', { align: 'center', max: 520 }), heroButtons([heroBtn('Get started')]), stats], { fill: '#ffffff', gap: 22 });
    } },
  { name: 'Editorial hero (big type)', blurb: 'Huge left-aligned type, no buttons, one small link. Suits portfolios, studios and magazines.',
    make: () => {
      const lk = label('See our work →', 17, 600, '#0f172a'); lk.href = '#'; lk.style = { ...lk.style, self: 'start', w: 'auto' } as St;
      return heroSection('Editorial hero', [hText('We make things people remember.', 84, { weight: 800, lh: 1.02, max: 1000 }), pText('An independent studio for brands, products and film.', { max: 520, size: 20 }), lk], { items: 'start', justify: 'end', minH: 560, fill: '#fafaf9', gap: 28 }, { tablet: { minH: 440 }, mobile: { minH: 400 } });
    } },
];

const navigation: KitItem[] = [
  { name: 'Navbar with hamburger', blurb: 'Links on desktop. On phones they fold into a hamburger button that opens a dropdown list.',
    make: () => pinRow(scope('Navbar', 'row', [
      brandMark(22),
      hamburger('menu', { mobileOnly: true }),
      panel('Menu links', [inlineLink('Product'), inlineLink('Pricing'), inlineLink('About'), { ...plainButton('Get started'), attrs: { type: 'button', whitespace: 'nowrap' } }], { key: 'menu', mobile: true }, { w: 'fill', gap: 8, justify: 'end' }, 'row'),
    ], NAV_BAR)) },
  ...moreNavbars,
  { name: 'Navbar with stacked links', blurb: 'No menu button. On phones the brand sits on top and the links wrap onto their own row.',
    make: () => stack('Navbar stacked', 'row', [
      brandMark(22),
      stack('Links', 'row', [linkItem('Product'), linkItem('Pricing'), linkItem('About'), plainButton('Get started')], { w: 'auto', gap: 8, wrap: true }),
    ], NAV_BAR, { tag: 'nav', bp: { tablet: { dir: 'row' }, mobile: { dir: 'column', items: 'start' } } }) },
  { name: 'Dropdown menu', blurb: 'A button that opens a small list. Closes when you click elsewhere or press Escape.',
    make: () => scope('Dropdown', 'column', [
      plainButton('Options', { role: 'toggle', key: 'menu' }, ghost),
      panel('Dropdown list', ['Profile', 'Settings', 'Sign out'].map(linkItem), { key: 'menu', dismiss: true },
        { w: 220, gap: 2, pad: 8, radius: 12, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'md', position: 'absolute', top: 48, left: 0 }),
    ], { w: 'auto', position: 'relative', gap: 0 }) },
  { name: 'Tabs', blurb: 'Tab buttons that switch between panels. The first panel is open to start with.',
    make: () => scope('Tabs', 'column', [
      stack('Tab bar', 'row', [['overview', 'Overview'], ['activity', 'Activity'], ['settings', 'Settings']].map(([key, text]) => plainButton(text, { role: 'tab', key, group: 'tabs' }, { fill: 'transparent', color: '#374151', radius: 0 })), { gap: 4, stroke: '#e5e7eb', strokeWidth: 0, borderB: 1 }),
      ...[['overview', 'Overview', 'A summary of the most important things.'], ['activity', 'Activity', 'Recent changes show up here.'], ['settings', 'Settings', 'Adjust how this works for you.']].map(([key, title, body], i) =>
        panel(`${title} panel`, [makeHeading(0, 0, title, 22), makeText(0, 0, body, 16)], { key, group: 'tabs', initial: i === 0 ? 'open' : 'closed' }, { gap: 8, pad: 20 })),
    ], { gap: 8 }) },
];

export const feedback: KitItem[] = [
  { name: 'Modal dialog', blurb: 'A button opens a dialog over the page. Close with the buttons, a click outside, or Escape.',
    make: () => scope('Modal', 'column', [
      plainButton('Open dialog', { role: 'open', key: 'dialog' }),
      panel('Dialog overlay', [
        stack('Dialog', 'column', [makeHeading(0, 0, 'Confirm action', 24), makeText(0, 0, 'Are you sure you want to continue?', 16),
          stack('Dialog actions', 'row', [plainButton('Cancel', { role: 'close' }, ghost), plainButton('Continue', { role: 'close' })], { gap: 10, justify: 'end' })],
          { w: 440, gap: 14, pad: 28, radius: 16, fill: '#ffffff', shadow: 'lg' }),
      ], { key: 'dialog', modal: true, dismiss: true }, { position: 'fixed', inset: 0, items: 'center', justify: 'center', fill: 'rgba(17,24,39,0.5)', w: 'fill', h: 'fill', pad: 16 }),
    ], { w: 'auto' }) },
];

export const NEW_GROUPS: KitGroup[] = [
  { id: 'hero', name: 'Hero', blurb: 'Opening sections. Text sizes and spacing step down on tablet and phone, and split heroes stack.', items: [...heroes, ...heroItems] },
  { id: 'navigation', name: 'Navigation', blurb: 'Menus and wayfinding. These work in exported pages.', items: [...navigation, ...navItems] },
  { id: 'buttons', name: 'Buttons', blurb: 'Buttons with icons. Each one is a real <button> with the icon and label in one row.', items: buttons },
  { id: 'animbuttons', name: 'Animated buttons', blurb: 'Hover, press, loop and click effects. Lift, grow and 3D press are node states; sweep, shine and underline are small shipped rules; the rest use the Animation panel.', items: animatedButtonItems },
  { id: 'checkbox', name: 'Checkbox', blurb: 'Tick boxes for consent, preferences and choices. Every variant is a real input wrapped in a label, so the text is clickable. Change the Color to recolour one.', items: [...checkbox.map(i => ({ ...i, section: 'Basic' })), ...checkItems] },
  { id: 'switch', name: 'Switches', blurb: 'On / off toggles that work in previews and exports. The thumb and track follow the Color, Width and Height in the Style panel.', items: switchItems },
  { id: 'radio', name: 'Radio and choices', blurb: 'Pick-one controls: dots, cards, plan pickers and segmented controls. Give options the same Name to make them a group.', items: radioItems },
  { id: 'darkmode', name: 'Dark mode toggles', blurb: 'Buttons that flip the whole page between light and dark. Preview them with the dark button in the preview bar.', items: darkItems },
  { id: 'loaders', name: 'Loaders', blurb: 'Spinners, dots, bars, ripples and skeletons. They are plain shapes with animations, so you can change size, colour and speed.', items: loaderItems },
  { id: 'forms', name: 'Forms and inputs', blurb: 'Complete forms and single fields. Every field has a visible focus ring and is a real input, so submitting works in exports.', items: formItems },
  { id: 'footer', name: 'Footers', blurb: 'Closing sections for the bottom of a page. Columns wrap and restack on tablet and phone.', items: footerItems },
  { id: 'accordion', name: 'Accordions and FAQ', blurb: 'Questions and answers that open and close. Each opens with the Toggle behavior, so they work in previews and exports.', items: accordionItems },
  { id: 'cards', name: 'Cards', blurb: 'Content cards for features, pricing, stats, profiles and links.', items: cardItems },
  { id: 'imagecards', name: 'Image cards', blurb: 'Cards led by a photo: blog, product, places, people and overlays.', items: imageCardItems },
  { id: 'imagepills', name: 'Image pills', blurb: 'Pill and chip shapes that carry a photo or avatar: tags, people, categories and stacks.', items: imagePillItems },
  { id: 'testimonials', name: 'Testimonials', blurb: 'Customer quotes, ratings and logos of people who trust you.', items: testimonialItems },
  { id: 'sociallinks', name: 'Social links', blurb: 'Follow buttons, share bars, profile cards and icon sets.', items: socialItems },
  { id: 'tooltips', name: 'Tooltips', blurb: 'Small hints that appear when you point at or focus an element.', items: tooltipItems },
  { id: 'ranges', name: 'Range sliders', blurb: 'Draggable sliders for price, volume and quantity. Real range inputs; set Min, Max and Step in the Fields tab.', items: rangeItems },
  { id: 'alerts', name: 'Alerts and banners', blurb: 'Inline messages and announcement bars.', items: alertItems },
  { id: 'toasts', name: 'Toasts', blurb: 'Short notifications that sit above the page.', items: toastItems },
  { id: 'modals', name: 'Modals and dialogs', blurb: 'Dialogs that open over the page from a button and close again.', items: modalItems },
  { id: 'appscreens', name: 'App screens', blurb: 'Dashboards, lists and mobile screens.', items: appItems },
  { id: 'blocks', name: 'More blocks', blurb: 'Pricing, stats, logo clouds, calls to action, timelines, teams, blogs and galleries.', items: blockItems },
];

/** Items that still live in Panels.tsx, placed in a category by name. Anything not listed lands in "More blocks". */
export const LEGACY_CATEGORY: Record<string, { id: string; name: string; blurb: string }> = {};
const cat = (id: string, name: string, blurb: string, names: string[]) => names.forEach(n => { LEGACY_CATEGORY[n] = { id, name, blurb }; });
cat('hero', 'Hero', 'Opening sections.', ['Centered hero', 'Split hero', 'Image hero (background photo)', 'Gradient hero']);
cat('navigation', 'Navigation', 'Menus and wayfinding.', ['Navbar', 'Sidebar', 'Tabs', 'Breadcrumbs', 'Footer']);
cat('content', 'Content', 'Cards, grids and sections.', ['Feature cards', 'Pricing card', 'Stats row', 'Call to action', 'Image card', 'Logo cloud', 'Team grid', 'Blog cards', 'Gallery grid', 'Steps timeline', 'Stat tile']);
cat('social', 'Social proof and FAQ', 'Testimonials and questions.', ['Testimonial', 'FAQ', 'FAQ details']);
cat('forms', 'Forms and inputs', 'Fields and complete forms.', ['Text input', 'Email input', 'Select input', 'Contact form', 'Sign-in form', 'Newsletter signup']);
cat('feedback', 'Feedback and overlays', 'Messages, status and dialogs.', ['Modal', 'Alert banner', 'Badge', 'Progress bar']);
cat('app', 'App screens', 'Dashboards and data.', ['Dashboard shell', 'Data table', 'Mobile list screen']);
cat('style', 'Effects and text', 'Decorative styles.', ['Glass card', 'Gradient text heading']);

export const CATEGORY_ORDER = ['hero', 'navigation', 'buttons', 'animbuttons', 'cards', 'imagecards', 'imagepills', 'blocks', 'accordion', 'testimonials', 'sociallinks', 'forms', 'ranges', 'checkbox', 'switch', 'radio', 'darkmode', 'tooltips', 'loaders', 'alerts', 'toasts', 'modals', 'footer', 'appscreens', 'style', 'more'];

const REPLACED = new Set(['Image card', 'Testimonial', 'FAQ', 'FAQ details', 'Alert banner', 'Dashboard shell', 'Data table', 'Mobile list screen', 'Feature cards', 'Pricing card', 'Stats row', 'Call to action', 'Logo cloud', 'Team grid', 'Blog cards', 'Gallery grid', 'Steps timeline', 'Stat tile', 'Badge', 'Progress bar', 'Footer', 'Text input', 'Email input', 'Select input', 'Contact form', 'Sign-in form', 'Newsletter signup', 'Checkbox', 'Navbar', 'Tabs', 'Modal', 'Centered hero', 'Split hero', 'Image hero (background photo)', 'Gradient hero']);
export function buildGroups(legacy: [string, () => Node][]): KitGroup[] {
  const groups = new Map<string, KitGroup>(NEW_GROUPS.map(g => [g.id, { ...g, items: [...g.items] }]));
  for (const [name, make] of legacy) {
    if (REPLACED.has(name)) continue; // reworked in kit.ts
    const c = LEGACY_CATEGORY[name] || { id: 'more', name: 'More blocks', blurb: 'Other ready-made blocks.' };
    const g = groups.get(c.id) || { id: c.id, name: c.name, blurb: c.blurb, items: [] };
    g.items.push({ name, blurb: '', make }); groups.set(c.id, g);
  }
  return CATEGORY_ORDER.map(id => groups.get(id)).filter((g): g is KitGroup => !!g).map(g => ({ ...g, items: g.items.map(it => ({ ...it, make: () => autoDark(it.make()) })) }));
}
