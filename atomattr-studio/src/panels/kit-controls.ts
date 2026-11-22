/**
 * Library: checkboxes, switches, radios and dark-mode toggles.
 *
 * Every control is an ordinary node (an input or a button) styled with node style: size, radius, colours and spacing are
 * editable in the Style panel. The few things node style cannot express (the checked look, the thumb, reacting to <html class="dark">)
 * come from `data-ui` rules in document/ui-css.ts, and the accent colour of each control is simply its `color`.
 */
import type { Node } from '../document/types';
import { makeHeading, makeInput, mk } from '../document/factory';
import { stack, row, label, hint, iconNode, type KitItem } from './kit';

const ACCENT = '#4f46e5';
const withUi = (n: Node, id: string, attrs: Record<string, string | boolean> = {}): Node => ({ ...n, attrs: { ...(n.attrs || {}), 'data-ui': id, ...attrs } });
const part = (n: Node, p: string): Node => ({ ...n, attrs: { ...(n.attrs || {}), 'data-p': p } });

/** A real checkbox, switch track or radio dot. `kind` decides the HTML type; the look comes from data-ui. */
const input = (kind: 'checkbox' | 'radio', ui: string, name: string, o: { w?: number; h?: number; radius?: number; on?: boolean; accent?: string; fill?: string; stroke?: string; sw?: number; value?: string } = {}): Node => {
  const n = makeInput('checkbox', name, '');
  n.style = { ...n.style, mode: 'flow', w: o.w ?? 22, h: o.h ?? 22, grow: 0, radius: o.radius ?? 6, fill: o.fill ?? '#ffffff', stroke: o.stroke ?? '#9ca3af', strokeWidth: o.sw ?? 1.5, padX: 0, padY: 0, color: o.accent ?? ACCENT };
  n.field = kind === 'radio'
    ? { type: 'radio', name, value: o.value || name, checked: !!o.on, required: false }
    : { type: 'checkbox', name, value: o.on ? 'true' : '', required: false };
  n.attrs = { 'aria-label': o.value || name, 'data-ui': ui };
  return n;
};
const box = (ui: string, name: string, o: Parameters<typeof input>[3] = {}) => input('checkbox', ui, name, o);
const dot = (ui: string, name: string, value: string, o: Parameters<typeof input>[3] = {}) => input('radio', ui, name, { radius: 999, ...o, value });
const hiddenRadio = (name: string, value: string, on = false): Node => withUi(input('radio', 'vh', name, { value, on, w: 1, h: 1 }), 'vh');
const sw = (ui: string, name: string, o: Parameters<typeof input>[3] = {}) => input('checkbox', ui, name, { w: 48, h: 28, radius: 999, fill: '#d1d5db', stroke: 'transparent', sw: 0, ...o });

const R = { gap: 10 };
/** Radio options with the same name form one group, so each inserted group gets its own name. */
let groupSeq = 0; const gid = (base: string) => `${base}-${++groupSeq}`;
const text = (t: string, d?: string): Node => d ? stack('Text', 'column', [label(t, 15, 600), hint(d)], { gap: 2, w: 'auto' }) : label(t);

// ------------------------------------------------------------------ checkboxes
const CB: [string, string, string, string, Parameters<typeof input>[3]][] = [
  ['cb-check', 'Classic check', 'Square box that fills with the accent colour and a white tick.', '', {}],
  ['cb-pop', 'Pop check', 'Same fill, with a small squeeze when you tick it.', '', {}],
  ['cb-round', 'Round check', 'A circle instead of a square. Common in to-do lists.', '', { radius: 999, w: 24, h: 24 }],
  ['cb-soft', 'Soft tick', 'A light tinted box with an outlined tick. Calm and modern.', '', { radius: 7, w: 24, h: 24, stroke: '#cbd5e1', sw: 1.5 }],
  ['cb-draw', 'Drawn tick', 'The tick draws itself in two strokes.', '', { radius: 7, w: 24, h: 24 }],
  ['cb-minus', 'Minus', 'Shows a dash when ticked. Good for "select some" and partial states.', '', {}],
  ['cb-cross', 'Cross', 'Shows an × when ticked. Good for "remove" and "exclude" options.', '', { radius: 7 }],
  ['cb-neon', 'Neon glow', 'Glows when ticked. Looks best on dark sections.', '', { radius: 6, fill: '#0f172a', stroke: '#475569', accent: '#22d3ee' }],
  ['cb-heart', 'Heart', 'A heart outline that turns red. Use it for favourites.', '', { w: 28, h: 28, radius: 0, sw: 0, fill: 'transparent' }],
  ['cb-star', 'Star', 'A star outline that turns gold. Use it for bookmarks.', '', { w: 28, h: 28, radius: 0, sw: 0, fill: 'transparent' }],
];
export const checkStyles: KitItem[] = CB.map(([ui, name, blurb, , o]) => ({
  section: 'Styles', name: `Checkbox, ${name.toLowerCase()}`, blurb,
  make: () => row(`Checkbox ${name}`, [box(ui, 'option', { ...o, on: true }), label(ui === 'cb-heart' ? 'Save to favourites' : ui === 'cb-star' ? 'Bookmark this' : 'Remember me on this device')], R),
}));
const checkLayouts: KitItem[] = [
  { section: 'Layouts', name: 'Checkbox list, settings', blurb: 'Titles with a short description, one per row, divided by thin lines.',
    make: () => stack('Checkbox list', 'column', ['Comments', 'Mentions', 'Product news'].map((t, i) => row(`Option ${i + 1}`, [box('cb-pop', `n-${i + 1}`, { on: i < 2 }), text(t, ['When someone replies to your post.', 'When someone tags you in a thread.', 'Occasional updates, never more than monthly.'][i])], { gap: 12, w: 'fill', padY: 14, items: 'start', ...(i ? { borderT: 1, stroke: '#e5e7eb' } : {}) } as Node['style'])), { gap: 0, w: 380 }) },
  { section: 'Layouts', name: 'Checkbox cards', blurb: 'Whole bordered cards that highlight when ticked. Good for add-ons.',
    make: () => stack('Checkbox cards', 'column', [['Priority support', 'Replies within 4 hours.', '+$12'], ['Extra storage', '100 GB more space.', '+$5']].map(([t, d, p], i) => withUi(row(`Card ${i + 1}`, [box('cb-round', `addon-${i + 1}`, { on: i === 0, w: 22, h: 22 }), stack('Text', 'column', [label(t, 15, 700), hint(d)], { gap: 2, w: 'auto', grow: 1 }), label(p, 15, 700, '#111827')], { gap: 14, w: 'fill', pad: 16, radius: 12, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'center' } as Node['style']), 'choice')), { gap: 10, w: 380 }) },
  { section: 'Layouts', name: 'Terms and conditions', blurb: 'A required consent box with links inside the sentence.',
    make: () => row('Consent', [box('cb-draw', 'terms', { radius: 5 }), label('I agree to the Terms of Service and the Privacy Policy.', 14, 400, '#374151')], { gap: 10, w: 340, items: 'start' } as Node['style']) },
  { section: 'Layouts', name: 'Select all with options', blurb: 'A "select all" row above a list. The dash shows when only some are chosen.',
    make: () => stack('Select all', 'column', [row('All', [box('cb-minus', 'all', { on: true }), label('Select all', 15, 700)], R), ...['Design', 'Engineering', 'Marketing'].map((t, i) => row(`Option ${i + 1}`, [box('cb-check', `team-${i + 1}`, { on: i < 2 }), label(t)], { ...R })) .map(r => ({ ...r, style: { ...r.style, padL: 30 } }))], { gap: 12, w: 'auto' }) },
];

// ------------------------------------------------------------------ switches
const SW: [string, string, string, Parameters<typeof input>[3]][] = [
  ['sw-ios', 'Classic', 'The familiar pill with a round thumb.', {}],
  ['sw-square', 'Square', 'Rounded-square track and thumb. Feels technical.', { radius: 9 }],
  ['sw-outline', 'Outline', 'Hollow track; the thumb fills with colour when on.', { fill: 'transparent', stroke: '#9ca3af', sw: 2 }],
  ['sw-tick', 'With tick', 'A ✓ appears on the thumb when on.', { w: 52, h: 30 }],
  ['sw-label', 'ON / OFF text', 'Wide track that says what state it is in.', { w: 68, h: 32 }],
  ['sw-bounce', 'Bouncy', 'The thumb overshoots a little, and squeezes when pressed.', { w: 52, h: 30 }],
  ['sw-slim', 'Slim track', 'A thin track with an oversized thumb. Material style.', { w: 40, h: 14, fill: '#cbd5e1' }],
  ['sw-gradient', 'Gradient', 'The track blends to pink when on.', { w: 52, h: 30 }],
  ['sw-neon', 'Neon', 'A glowing track. Best on dark backgrounds.', { w: 52, h: 30, fill: '#1e293b', accent: '#22d3ee' }],
];
export const switchStyles: KitItem[] = SW.map(([ui, name, blurb, o]) => ({
  section: 'Styles', name: `Switch, ${name.toLowerCase()}`, blurb,
  make: () => row(`Switch ${name}`, [sw(ui, 'setting', { on: true, ...o }), label('Email notifications')], { gap: 12 }),
}));
const settingsRow = (title: string, desc: string, ui: string, on: boolean, last = false): Node =>
  row(title, [stack('Text', 'column', [label(title, 15, 600), hint(desc)], { gap: 2, w: 'auto', grow: 1 }), sw(ui, title.toLowerCase().replace(/\W+/g, '-'), { on })], { gap: 16, w: 'fill', justify: 'between', padY: 14, items: 'center', ...(last ? {} : { borderB: 1, stroke: '#e5e7eb' }) } as Node['style']);
export const switchLayouts: KitItem[] = [
  { section: 'Layouts', name: 'Settings row', blurb: 'Title and description on the left, the switch on the right. Use it as one line of a settings page.',
    make: () => stack('Settings row', 'column', [settingsRow('Marketing emails', 'Product news and offers, once a month.', 'sw-ios', true, true)], { w: 380 }) },
  { section: 'Layouts', name: 'Settings list card', blurb: 'A card with four settings in a list, each with its own switch.',
    make: () => stack('Settings list', 'column', [settingsRow('Push notifications', 'Alerts on your phone.', 'sw-ios', true), settingsRow('Email digest', 'A weekly summary.', 'sw-ios', false), settingsRow('Two-step sign in', 'Ask for a code on new devices.', 'sw-ios', true), settingsRow('Public profile', 'Anyone can see your page.', 'sw-ios', false, true)], { w: 420, padX: 20, padY: 4, radius: 16, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'sm', gap: 0 }) },
  { section: 'Layouts', name: 'Switch with side labels', blurb: 'Names both choices, like Monthly and Yearly billing.',
    make: () => row('Billing switch', [label('Monthly', 15, 600), sw('sw-ios', 'billing', { w: 52, h: 30, on: true, accent: '#111827' }), stack('Yearly', 'row', [label('Yearly', 15, 600), (() => { const b = label('Save 20%', 12, 700, '#047857'); b.style = { ...b.style, padX: 8, padY: 2, radius: 999, fill: '#d1fae5' } as Node['style']; return b; })()], { gap: 8, w: 'auto' })], { gap: 14, w: 'auto' }) },
  { section: 'Layouts', name: 'Switch card', blurb: 'The whole card is the click target and lights up when the switch is on.',
    make: () => withUi(row('Switch card', [stack('Text', 'column', [label('Auto-save drafts', 16, 700), hint('Keep a copy every 30 seconds.')], { gap: 2, w: 'auto', grow: 1 }), sw('sw-ios', 'autosave', { on: true })], { gap: 16, w: 340, pad: 18, radius: 14, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'center', justify: 'between' } as Node['style']), 'choice') },
];

// ------------------------------------------------------------------ radios
const RD: [string, string, string, Parameters<typeof input>[3]][] = [
  ['rd-dot', 'Dot', 'A ring with a dot that pops in. The standard radio.', {}],
  ['rd-fill', 'Filled', 'The ring fills solid with a white gap, like a sticker.', {}],
  ['rd-tick', 'Tick', 'A filled circle with a tick. Reads clearly as "chosen".', {}],
  ['rd-glow', 'Glow ring', 'A soft halo around the chosen option.', {}],
  ['rd-ripple', 'Ripple', 'A ripple spreads out when you choose it.', {}],
  ['rd-square', 'Squared', 'A square ring with a square centre.', { radius: 6 }],
];
export const radioStyles: KitItem[] = RD.map(([ui, name, blurb, o]) => ({
  section: 'Styles', name: `Radio, ${name.toLowerCase()}`, blurb,
  make: () => { const g = gid('plan'); return stack(`Radio ${name}`, 'column', ['Monthly', 'Yearly', 'Lifetime'].map((t, i) => row(`Option ${i + 1}`, [dot(ui, g, t.toLowerCase(), { on: i === 1, ...o }), label(t)], R)), { gap: 12, w: 'auto' }); },
}));
const choiceCard = (g: string, title: string, desc: string, price: string, value: string, on: boolean): Node =>
  withUi(row(title, [hiddenRadio(g, value, on), stack('Text', 'column', [label(title, 16, 700), hint(desc), label(price, 22, 800)], { gap: 4, w: 'auto' })], { gap: 0, w: 'fill', grow: 1, pad: 18, radius: 14, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'start' } as Node['style']), 'choice');
export const radioLayouts: KitItem[] = [
  { section: 'Cards and segments', name: 'Plan cards', blurb: 'Three bordered cards; the chosen one gets a coloured border. Works without showing a radio dot.',
    make: () => { const g = gid('tier'); return stack('Plan cards', 'row', [choiceCard(g, 'Starter', 'For trying things.', '$0', 'starter', false), choiceCard(g, 'Pro', 'For small teams.', '$19', 'pro', true), choiceCard(g, 'Scale', 'For everyone else.', '$49', 'scale', false)], { gap: 12, w: 'fill', wrap: true }); } },
  { section: 'Cards and segments', name: 'Radio cards with dot', blurb: 'A vertical list of options with a visible radio dot, a title and a description.',
    make: () => { const g = gid('ship'); return stack('Radio cards', 'column', [['Standard', 'Arrives in 5 to 7 days.', 'Free'], ['Express', 'Arrives in 2 days.', '$9'], ['Same day', 'Order before noon.', '$19']].map(([t, d, p], i) => withUi(row(t, [dot('rd-dot', g, t.toLowerCase(), { on: i === 1 }), stack('Text', 'column', [label(t, 15, 700), hint(d)], { gap: 2, w: 'auto', grow: 1 }), label(p, 15, 700)], { gap: 14, w: 'fill', pad: 16, radius: 12, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'center' } as Node['style']), 'choice')), { gap: 10, w: 380 }); } },
  { section: 'Cards and segments', name: 'Segmented control', blurb: 'A grey pill with options inside; the chosen one lifts to white. Good for views like Day, Week, Month.',
    make: () => { const g = gid('range'); return stack('Segmented control', 'row', ['Day', 'Week', 'Month'].map((t, i) => withUi(row(t, [hiddenRadio(g, t.toLowerCase(), i === 1), label(t, 14, 600, '#4b5563')], { gap: 0, w: 'auto', padX: 18, padY: 8, radius: 8, items: 'center', justify: 'center' } as Node['style']), 'seg-item')), { gap: 2, w: 'auto', pad: 4, radius: 12, fill: '#f3f4f6' }); } },
  { section: 'Cards and segments', name: 'Pill choices', blurb: 'Rounded pills for short answers like sizes or yes / no. The chosen pill fills with colour.',
    make: () => { const g = gid('size'); return stack('Pill choices', 'row', ['S', 'M', 'L', 'XL'].map((t, i) => withUi(row(t, [hiddenRadio(g, t.toLowerCase(), i === 1), label(t, 14, 700, '#374151')], { gap: 0, w: 'auto', padX: 18, padY: 9, radius: 999, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'center', justify: 'center' } as Node['style']), 'seg-dark')), { gap: 8, w: 'auto', wrap: true }); } },
  { section: 'Cards and segments', name: 'Question with choices', blurb: 'A question, four answers and a hint. Ready for a survey.',
    make: () => { const g = gid('source'); return stack('Question', 'column', [makeHeading(0, 0, 'How did you hear about us?', 20), ...['A friend', 'Search', 'Social media', 'Other'].map((t, i) => row(`Answer ${i + 1}`, [dot('rd-glow', g, t.toLowerCase().replace(/ /g, '-'), { on: i === 0 }), label(t)], R)), hint('Pick one.')], { gap: 12, w: 'auto' }); } },
];


// ------------------------------------------------------------------ dark mode
const toggleBtn = (name: string, ui: string, w: number, h: number, radius: number, kids: Node[] = [], style: Node['style'] = {}): Node =>
  mk('container', name, { mode: 'flow', w, h, minH: h, grow: 0, self: 'start', layout: 'flex', dir: 'row', items: 'center', justify: 'center', padX: 0, padY: 0, radius, fill: '#e5e7eb', ...style },
    { tag: 'button', attrs: { type: 'button', 'aria-label': 'Switch between light and dark', 'data-ui': ui }, behavior: { role: 'theme' }, children: kids, bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } });
const dmNote = 'Click it in Preview to flip the page between light and dark. Give your elements a Dark look in the States tab.';
const darkBase: KitItem[] = [
  { section: 'Toggles', name: 'Dark mode, sun and moon pill', blurb: `A pill whose thumb turns from a sun into a moon. ${dmNote}`, make: () => toggleBtn('Dark mode pill', 'dm-pill', 64, 34, 999, [], { fill: '#e5e7eb' }) },
  { section: 'Toggles', name: 'Dark mode, day and night sky', blurb: 'A little landscape: blue sky with clouds turns into a starry night.', make: () => toggleBtn('Dark mode sky', 'dm-sky', 76, 38, 999, [], { fill: '#38bdf8' }) },
  { section: 'Toggles', name: 'Dark mode, icon button', blurb: 'A round button; the sun spins into a moon.', make: () => toggleBtn('Dark mode icon', 'dm-icon', 44, 44, 999, [], { fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 }) },
  { section: 'Toggles', name: 'Dark mode, eclipse', blurb: 'A golden sun that darkens into a crescent.', make: () => toggleBtn('Dark mode eclipse', 'dm-eclipse', 44, 44, 12, [], { fill: '#fef3c7', stroke: '#fde68a', strokeWidth: 1 }) },
  { section: 'Toggles', name: 'Dark mode, Light / Dark segments', blurb: 'Two labelled halves with a sliding highlight.',
    make: () => toggleBtn('Dark mode segments', 'dm-seg', 168, 40, 12, [part(stack('Light', 'row', [label('Light', 14, 700, '#111827')], { w: 'fill', h: 'fill', justify: 'center' }), 'l'), part(stack('Dark', 'row', [label('Dark', 14, 700, '#9ca3af')], { w: 'fill', h: 'fill', justify: 'center' }), 'd')], { fill: '#f3f4f6' }) },
  { section: 'Toggles', name: 'Dark mode, label button', blurb: 'A button whose icon and word change with the mode: Light becomes Dark.',
    make: () => toggleBtn('Dark mode label', 'dm-swap', 120, 42, 10, [part(stack('Light label', 'row', [iconNode('sun', 18, '#f59e0b'), label('Light', 14, 700, '#111827')], { w: 'auto', gap: 8 }), 'l'), part(stack('Dark label', 'row', [iconNode('moon', 18, '#a5b4fc'), label('Dark', 14, 700, '#f9fafb')], { w: 'auto', gap: 8 }), 'd')], { fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1, gap: 8 }) },
  { section: 'Toggles', name: 'Dark mode, switch with label', blurb: 'A normal switch that flips the page. A familiar pattern for settings pages.',
    make: () => row('Dark mode switch', [{ ...sw('sw-ios', 'dark-mode', { on: false }), attrs: { 'data-ui': 'sw-ios dm-switch', 'aria-label': 'Dark mode' }, behavior: { role: 'theme' } }, label('Dark mode')], { gap: 12 }) },
  { section: 'Settings', name: 'Dark mode settings row', blurb: 'Title, one line of help and a sun / moon pill. Drop it into a settings card.',
    make: () => row('Dark mode row', [stack('Text', 'column', [label('Appearance', 15, 700), hint('Switch between light and dark.')], { gap: 2, w: 'auto', grow: 1 }), toggleBtn('Dark mode pill', 'dm-pill', 64, 34, 999, [], { fill: '#e5e7eb' })], { gap: 20, w: 380, justify: 'between', pad: 16, radius: 14, stroke: '#e5e7eb', strokeWidth: 1, fill: '#ffffff', items: 'center' } as Node['style']) },
];

// ---- more radio layouts (reuse the choice / seg-item / seg-dark rules)
const CH = (ex: Record<string, unknown> = {}) => ({ gap: 12, w: 'fill', pad: 16, radius: 12, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'center', ...ex } as Node['style']);
const chip = (g: string, t: string, i: number, ui = 'seg-dark', ex: Record<string, unknown> = {}): Node => withUi(row(t, [hiddenRadio(g, t.toLowerCase().replace(/\W+/g, '-'), i === 0), label(t, 14, 700, '#374151')], { gap: 0, w: 'auto', padX: 18, padY: 9, radius: 999, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'center', justify: 'center', ...ex } as Node['style']), ui);
const moreRadios: KitItem[] = [
  { section: 'More layouts', name: 'Payment methods', blurb: 'Three payment options with an icon, a name and a radio dot.',
    make: () => { const g = gid('pay'); return stack('Payment methods', 'column', [['card', 'Credit card', 'Visa, Mastercard, Amex'], ['mail', 'PayPal', 'Pay with your account'], ['lock', 'Bank transfer', 'Takes 1 to 2 days']].map(([ic, t, d], i) => withUi(row(t, [dot('rd-dot', g, t.toLowerCase().replace(/ /g, '-'), { on: i === 0 }), iconNode(ic as never, 22, '#374151'), stack('Text', 'column', [label(t, 15, 700), hint(d)], { gap: 2, w: 'auto', grow: 1 })], CH()), 'choice')), { gap: 10, w: 380 }); } },
  { section: 'More layouts', name: 'Rating scale, 1 to 5', blurb: 'Round numbered choices for a quick score, with the ends labelled.',
    make: () => { const g = gid('score'); return stack('Rating scale', 'column', [stack('Scale', 'row', ['1', '2', '3', '4', '5'].map((t, i) => chip(g, t, i === 3 ? 0 : 1, 'seg-dark', { w: 44, h: 44, padX: 0, padY: 0 })), { gap: 8, w: 'auto' }), stack('Ends', 'row', [hint('Not likely'), hint('Very likely')], { w: 'fill', justify: 'between' })], { gap: 8, w: 'auto' }); } },
  { section: 'More layouts', name: 'Colour swatches', blurb: 'Round colour dots; the chosen one gets a coloured ring.',
    make: () => { const g = gid('colour'); return stack('Swatches', 'row', ['#111827', '#4f46e5', '#ec4899', '#f59e0b', '#10b981'].map((c, i) => withUi(row(c, [hiddenRadio(g, c, i === 1)], { gap: 0, w: 36, h: 36, radius: 999, fill: c, color: ACCENT, items: 'center', justify: 'center' } as Node['style']), 'choice-dot')), { gap: 12, w: 'auto' }); } },
  { section: 'More layouts', name: 'Yes or no', blurb: 'Two big answers side by side.',
    make: () => { const g = gid('yn'); return stack('Yes or no', 'row', ['Yes', 'No'].map((t, i) => chip(g, t, i === 0 ? 0 : 1, 'seg-dark', { w: 'fill', grow: 1, padY: 16, radius: 14 })), { gap: 10, w: 300 }); } },
  { section: 'More layouts', name: 'Time slots', blurb: 'A grid of times to book. One can be picked.',
    make: () => { const g = gid('slot'); return stack('Time slots', 'row', ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'].map((t, i) => chip(g, t, i === 1 ? 0 : 1, 'seg-dark', { w: 92, radius: 10, padX: 0 })), { gap: 8, w: 300, wrap: true }); } },
  { section: 'More layouts', name: 'Icon tiles', blurb: 'Square tiles with an icon above a label. Good for picking a type.',
    make: () => { const g = gid('kind'); return stack('Icon tiles', 'row', [['home', 'Home'], ['user', 'Personal'], ['star', 'Business']].map(([ic, t], i) => withUi(row(t, [hiddenRadio(g, t.toLowerCase(), i === 1), stack('Tile', 'column', [iconNode(ic as never, 26, '#374151'), label(t, 14, 700)], { w: 'auto', gap: 8, items: 'center' })], CH({ w: 110, pad: 18, justify: 'center' })), 'choice')), { gap: 10, w: 'auto' }); } },
  { section: 'More layouts', name: 'Billing switch with saving', blurb: 'Monthly or yearly in a segmented pill, with a small saving badge.',
    make: () => { const g = gid('bill'); return stack('Billing choice', 'row', [withUi(row('Monthly', [hiddenRadio(g, 'monthly'), label('Monthly', 14, 600, '#4b5563')], { gap: 0, w: 'auto', padX: 20, padY: 9, radius: 8, items: 'center', justify: 'center' } as Node['style']), 'seg-item'), withUi(row('Yearly', [hiddenRadio(g, 'yearly', true), label('Yearly', 14, 600, '#4b5563'), (() => { const b = label('Save 20%', 11, 700, '#15803d'); b.style = { ...b.style, padX: 8, padY: 2, radius: 999, fill: '#dcfce7' } as Node['style']; return b; })()], { gap: 8, w: 'auto', padX: 20, padY: 9, radius: 8, items: 'center', justify: 'center' } as Node['style']), 'seg-item')], { gap: 2, w: 'auto', pad: 4, radius: 12, fill: '#f3f4f6' }); } },
  { section: 'More layouts', name: 'List with dividers', blurb: 'Plain rows with a radio dot, separated by thin lines. Like a settings page.',
    make: () => { const g = gid('lang'); return stack('Divided list', 'column', ['English', 'French', 'Yoruba', 'Hausa'].map((t, i) => row(t, [label(t, 15, 500), dot('rd-tick', g, t.toLowerCase(), { on: i === 0 })], { gap: 12, w: 'fill', justify: 'between', padY: 14, borderB: i < 3 ? 1 : 0, stroke: '#e5e7eb', items: 'center' } as Node['style'])), { gap: 0, w: 320 }); } },
];
export const radioItems = [...radioStyles, ...radioLayouts, ...moreRadios];

// ---- more switch layouts
const pillTxt = (t: string, bg: string, c: string): Node => { const b = label(t, 11, 700, c); b.style = { ...b.style, padX: 8, padY: 2, radius: 999, fill: bg } as Node['style']; return b; };
const tile = (ic: string, bg: string, c: string): Node => stack('Icon', 'row', [iconNode(ic as never, 18, c)], { w: 36, h: 36, minH: 36, grow: 0, radius: 10, fill: bg, justify: 'center', items: 'center' } as Node['style']);
const moreSwitches: KitItem[] = [
  { section: 'More layouts', name: 'Switch with sun and moon', blurb: 'An icon on each side of the switch. Handy for light and dark choices.',
    make: () => row('Sun moon switch', [iconNode('sun', 20, '#f59e0b'), sw('sw-ios', 'theme-pick', { w: 52, h: 30, on: true, accent: '#111827' }), iconNode('moon', 20, '#6366f1')], { gap: 12, w: 'auto', items: 'center' } as Node['style']) },
  { section: 'More layouts', name: 'Switch list with icons', blurb: 'Each setting has a coloured icon tile, a title and a switch.',
    make: () => stack('Icon switch list', 'column', [['bell', '#eef2ff', '#4f46e5', 'Notifications'], ['mail', '#fef3c7', '#b45309', 'Email updates'], ['lock', '#dcfce7', '#15803d', 'Private mode']].map(([ic, bg, c, t], i) => row(t, [tile(ic, bg, c), stack('Name', 'row', [label(t, 15, 600)], { w: 'fill', grow: 1, gap: 0 } as Node['style']), sw('sw-ios', `ico-${i}`, { on: i !== 1, accent: c })], { gap: 14, w: 'fill', padY: 10, items: 'center', justify: 'between' } as Node['style'])), { w: 340, gap: 2 }) },
  { section: 'More layouts', name: 'Switch with status text', blurb: 'A short status badge beside the label, like Active or Paused.',
    make: () => row('Status switch', [stack('Text', 'column', [label('Auto-renew', 15, 600), pillTxt('Active', '#dcfce7', '#15803d')], { gap: 4, w: 'auto', grow: 1 }), sw('sw-ios', 'renew', { on: true, accent: '#16a34a' })], { gap: 20, w: 300, items: 'center', justify: 'between', pad: 16, radius: 14, stroke: '#e5e7eb', strokeWidth: 1, fill: '#ffffff' } as Node['style']) },
  { section: 'More layouts', name: 'Compact switch list', blurb: 'Small switches in a tight list for dense panels.',
    make: () => stack('Compact switches', 'column', ['Show grid', 'Snap to guides', 'Show rulers', 'Dark canvas'].map((t, i) => row(t, [label(t, 14, 500), sw('sw-ios', `cmp-${i}`, { w: 36, h: 20, on: i % 2 === 0 })], { gap: 12, w: 'fill', justify: 'between', items: 'center', padY: 6 } as Node['style'])), { w: 240, gap: 0 }) },
  { section: 'More layouts', name: 'Coloured switches', blurb: 'Three switches in green, amber and red. Good for status toggles.',
    make: () => stack('Coloured switches', 'column', [['Live', '#16a34a'], ['Maintenance', '#f59e0b'], ['Disabled', '#dc2626']].map(([t, c], i) => row(t, [sw('sw-ios', `col-${i}`, { on: true, accent: c }), label(t)], { gap: 12, items: 'center' } as Node['style'])), { w: 'auto', gap: 12 }) },
  { section: 'More layouts', name: 'Master switch with options', blurb: 'One main switch above indented options that belong to it.',
    make: () => stack('Master switch', 'column', [row('Master', [label('Notifications', 16, 700), sw('sw-ios', 'master', { on: true })], { gap: 12, w: 'fill', justify: 'between', items: 'center', padB: 10, borderB: 1, stroke: '#e5e7eb' } as Node['style']), ...['Comments', 'Mentions', 'Reminders'].map((t, i) => row(t, [label(t, 14, 500, '#4b5563'), sw('sw-ios', `sub-${i}`, { w: 40, h: 24, on: i !== 2 })], { gap: 12, w: 'fill', justify: 'between', items: 'center', padL: 16 } as Node['style']))], { w: 320, gap: 12 }) },
  { section: 'More layouts', name: 'Plan feature toggles', blurb: 'Add-ons with a price tag and a switch, like checkout extras.',
    make: () => stack('Feature toggles', 'column', [['Priority support', '$12'], ['Extra storage', '$5'], ['Team seats', '$8']].map(([t, p], i) => withUi(row(t, [stack('Text', 'column', [label(t, 15, 700), hint(`${p} per month`)], { gap: 2, w: 'auto', grow: 1 }), sw('sw-ios', `plan-${i}`, { on: i === 0 })], { gap: 16, w: 'fill', pad: 16, radius: 12, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'center' } as Node['style']), 'choice')), { w: 340, gap: 10 }) },
];
export const switchItems = [...switchStyles, ...switchLayouts, ...moreSwitches];

// ---- more checkbox layouts
const hiddenBox = (name: string, on = false): Node => withUi(input('checkbox', 'vh', name, { w: 1, h: 1, on }), 'vh');
const moreChecks: KitItem[] = [
  { section: 'More layouts', name: 'Filter chips', blurb: 'Round chips that fill with colour when ticked. Good for tags and filters.',
    make: () => stack('Filter chips', 'row', ['Design', 'Code', 'Writing', 'Music', 'Video'].map((t, i) => withUi(row(t, [hiddenBox(`tag-${i}`, i === 0 || i === 2), label(t, 14, 700, '#374151')], { gap: 0, w: 'auto', padX: 18, padY: 9, radius: 999, stroke: '#d1d5db', strokeWidth: 1, fill: '#ffffff', color: ACCENT, items: 'center', justify: 'center' } as Node['style']), 'seg-dark')), { gap: 8, w: 340, wrap: true }) },
  { section: 'More layouts', name: 'Checklist with progress', blurb: 'A to-do list with a "2 of 4 done" line and a bar.',
    make: () => stack('Checklist', 'column', [row('Head', [label('Launch checklist', 17, 800), label('2 of 4 done', 13, 600, '#6b7280')], { gap: 12, w: 'fill', justify: 'between', items: 'center' } as Node['style']), stack('Track', 'row', [mk('container', 'Fill', { mode: 'flow', w: 50, h: 6, grow: 0, radius: 999, fill: ACCENT } as Node['style'])], { w: 'fill', h: 6, minH: 6, radius: 999, fill: '#e5e7eb', gap: 0 } as Node['style']), ...['Write copy', 'Add photos', 'Set up domain', 'Publish'].map((t, i) => row(t, [box('cb-round', `todo-${i}`, { on: i < 2 }), label(t, 15, 500, i < 2 ? '#9ca3af' : '#111827')], { gap: 12, items: 'center' } as Node['style']))], { w: 320, gap: 12 }) },
  { section: 'More layouts', name: 'Topics in two columns', blurb: 'A short heading and a two-column grid of options. For sign-up forms.',
    make: () => stack('Topics', 'column', [label('What are you interested in?', 16, 700), stack('Grid', 'row', ['News', 'Tips', 'Offers', 'Events', 'Jobs', 'Research'].map((t, i) => row(t, [box('cb-pop', `topic-${i}`, { on: i % 3 === 0 }), label(t)], { gap: 10, w: 140, items: 'center' } as Node['style'])), { gap: 12, w: 300, wrap: true })], { w: 'auto', gap: 14 }) },
  { section: 'More layouts', name: 'Filter list with counts', blurb: 'Options with the number of matches on the right. Like a shop sidebar.',
    make: () => stack('Filter list', 'column', [label('Brand', 15, 800), ...[['Nike', '48'], ['Adidas', '36'], ['Puma', '21'], ['Reebok', '9']].map(([t, c], i) => row(t, [box('cb-check', `brand-${i}`, { on: i === 0 }), stack('Name', 'row', [label(t, 14, 500)], { w: 'fill', grow: 1, gap: 0 } as Node['style']), label(c, 13, 400, '#9ca3af')], { gap: 10, w: 'fill', items: 'center' } as Node['style']))], { w: 240, gap: 12 }) },
];
export const checkItems = [...checkStyles, ...checkLayouts, ...moreChecks];

// ---- twelve more dark mode toggles (CSS in document/ui-css-dm.ts)
const DM: [string, string, string, number, number, number, Node['style']?][] = [
  ['dm-warm', 'warm sunrise pill', 'A pill that glows orange by day and deep purple by night.', 64, 34, 999],
  ['dm-square', 'squared', 'A square switch with a rounded-square thumb.', 64, 34, 10],
  ['dm-mono', 'black and white', 'A bold outline switch that inverts: white by day, black by night.', 64, 34, 999],
  ['dm-ocean', 'ocean pill', 'Sky blue by day and deep sea at night.', 64, 34, 999],
  ['dm-ring', 'glowing ring', 'A round button with a ring that starts to glow at night.', 44, 44, 999],
  ['dm-half', 'half and half', 'A split disc, gold on one side and navy on the other. It spins over.', 44, 44, 999],
  ['dm-flip', 'flip tile', 'A square tile that flips around from sun to moon.', 44, 44, 12],
  ['dm-glass', 'frosted glass', 'A glass pill that blurs what is behind it. Best over a photo or gradient.', 64, 34, 999],
  ['dm-neon', 'neon', 'A thin outline with a glowing dot: amber by day, cyan at night.', 64, 34, 999],
  ['dm-line', 'line and dot', 'Almost nothing: a thin line with a dot that slides across.', 64, 20, 999],
  ['dm-word', 'word button', 'A button that says Light or Dark and changes with the page.', 110, 40, 10],
  ['dm-bare', 'bare icon', 'Just a sun or moon with no box. Perfect inside a navbar.', 36, 36, 999],
];
const moreDark: KitItem[] = DM.map(([ui, name, blurb, w, h, r]) => ({ section: 'More toggles', name: `Dark mode, ${name}`, blurb: `${blurb} ${dmNote}`, make: () => toggleBtn(`Dark mode ${name}`, ui, w, h, r, [], { fill: ui === 'dm-line' ? 'transparent' : '#e5e7eb' }) }));
export const darkItems: KitItem[] = [...darkBase, ...moreDark];
