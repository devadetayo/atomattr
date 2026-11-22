/**
 * Library: accordions, cards and testimonials.
 *
 * Everything is ordinary nodes. Accordions open and close with the Toggle / Tab + Panel behaviors (so they work in previews and
 * exports); the few looks that need "is this item open" (turning chevron, accent border) are `data-ui` rules in
 * document/ui-css-content.ts. Photos are the shared Unsplash placeholders (`stock-<key>`), swapped for real ones from Fill.
 */
import type { Node } from '../document/types';
import { makeHeading, makeSection, mk } from '../document/factory';
import { stack, label, hint, iconNode, btnText, iconButton, textBtn, panel, scope, pinRow, BRAND, DARK, OUTLINE, flowKids, type KitItem } from './kit';

type St = NonNullable<Node['style']>;
const INDIGO = '#4f46e5', INK = '#111827', MUTE = '#6b7280', LINE = '#e5e7eb';

// ------------------------------------------------------------------ small helpers
const H = (t: string, size: number, color = INK, align?: 'left' | 'center'): Node => { const h = makeHeading(0, 0, t, size); h.style = { ...h.style, w: 'auto', color, lineHeight: 1.2, ...(align ? { align } : {}) } as St; return h; };
const P = (t: string, size = 15, color = MUTE, align?: 'left' | 'center', maxW?: number): Node => { const n = label(t, size, 400, color); n.style = { ...n.style, lineHeight: 1.55, ...(align ? { align } : {}), ...(maxW ? { maxW, w: 'fill' } : {}) } as St; return n; };
const part = (n: Node, p: string): Node => ({ ...n, attrs: { ...(n.attrs || {}), 'data-p': p } });
const ui = (n: Node, id: string): Node => ({ ...n, attrs: { ...(n.attrs || {}), 'data-ui': id } });
const bp = (n: Node, tablet: St, mobile: St = tablet): Node => ({ ...n, bp: { tablet: { ...(n.bp?.tablet || {}), ...tablet }, mobile: { ...(n.bp?.mobile || {}), ...mobile } } });
const restyle = (n: Node, st: St): Node => ({ ...n, style: { ...n.style, ...st } });

/** Stroked icon from a raw path (24 × 24), for icons that are not in the shared set. */
const ico = (d: string, size = 20, color = INK, sw = 2): Node => mk('path', 'Icon', { mode: 'flow', w: size, h: size, grow: 0, stroke: color, strokeWidth: sw } as St, { svgD: d, vw: 24, vh: 24, pts: [], closed: false });
const D = {
  minus: 'M5 12h14', plus: 'M12 5v14M5 12h14', chev: 'M6 9l6 6 6-6', arrow: 'M5 12h14M13 6l6 6-6 6', check: 'M20 6L9 17l-5-5',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', layers: 'M12 2l10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20', code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2', chart: 'M3 3v18h18M7 15l4-4 3 3 5-6', tag: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
  play: 'M6 4l14 8-14 8z', pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6', star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z', help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  card: 'M2 5h20v14H2zM2 10h20', mail: 'M4 4h16v16H4zM4 6l8 7 8-7', gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  quote: 'M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z',
  heart: 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.4 4.5c2 0 3.6 1.1 4.6 2.7h2c1-1.6 2.6-2.7 4.6-2.7 3.7 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z', book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5V22h16', download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
} as const;

/** A photo (or its colour while the photo loads). `key` is a STOCK key from kit.ts. */
const photo = (name: string, key: string, st: St = {}, kids: Node[] = []): Node =>
  mk('container', name, { mode: 'flow', w: 'fill', h: 200, grow: 0, radius: 12, fill: '#cbd5e1', fillImg: `stock-${key}`, bgSize: 'cover', bgPos: 'center', bgRepeat: 'no-repeat', layout: 'flex', dir: 'column', ...st } as St, { children: flowKids(kids) });
const avatar = (key: string, size = 44, st: St = {}): Node => photo('Avatar', key, { w: size, h: size, minH: size, shrink: 0, radius: 999, ...st } as St);
const tile = (d: string, color = INDIGO, bg = '#eef2ff', size = 44, r = 12): Node =>
  stack('Icon tile', 'row', [ico(d, Math.round(size * 0.5), color)], { w: size, h: size, minH: size, grow: 0, shrink: 0, radius: r, fill: bg, justify: 'center', items: 'center', gap: 0 } as St);
const stars = (n = 5, color = '#f59e0b', size = 16): Node => { const l = label('★'.repeat(n), size, 400, color); l.style = { ...l.style, letterSpacing: 2 } as St; return l; };
const sect = (name: string, kids: Node[], st: St = {}, b: { tablet?: St; mobile?: St } = {}): Node => {
  const n = makeSection(name, 320, (st.fill as string) || '#ffffff');
  n.style = { ...n.style, layout: 'flex', dir: 'column', items: 'stretch', justify: 'start', gap: 40, padX: 64, padY: 80, h: 'auto', minH: 0, ...st } as St;
  n.children = flowKids(kids);
  n.bp = { tablet: { padX: 40, padY: 64, ...b.tablet }, mobile: { padX: 20, padY: 48, gap: 28, ...b.mobile } };
  return n;
};
const intro = (title: string, sub: string, align: 'left' | 'center' = 'center', size = 36, dark = false): Node =>
  stack('Heading block', 'column', [H(title, size, dark ? '#ffffff' : INK, align), P(sub, 17, dark ? '#c7d2fe' : MUTE, align, 560)], { w: 'fill', gap: 12, items: align === 'center' ? 'center' : 'start' } as St);
const flowRow = (name: string, kids: Node[], st: St = {}): Node => stack(name, 'row', kids, { w: 'fill', gap: 20, wrap: true, items: 'stretch', ...st } as St);

// ------------------------------------------------------------------ accordions
const FAQ: [string, string][] = [
  ['What is included in the free plan?', 'Everything you need to get started: up to three projects, basic analytics and community support. No card required.'],
  ['Can I change plans later?', 'Yes. Upgrade, downgrade or cancel from your account settings at any time. Changes apply on your next billing date.'],
  ['Do you offer refunds?', 'If you are not happy within the first 30 days, email us and we will refund you in full, no questions asked.'],
  ['How do I get help?', 'Chat with us from any page or email support. Most questions are answered within a few hours.'],
];
type AcOpt = {
  single?: boolean; icon?: 'chev' | 'plus' | 'swap' | 'arrow' | 'chip' | 'none'; num?: boolean; lead?: string; leadBg?: string; open?: number[] | 'all';
  qSize?: number; qColor?: string; aColor?: string; qWeight?: number; item?: St; head?: St; body?: St; list?: St; ui?: string; iconColor?: string; gap?: number; line?: boolean; indent?: number;
};
let acSeq = 0;
/** One accordion: a list of items, each a button row plus a panel. Many-open items are scopes of their own; "one at a time" shares one scope and uses the Tab behavior. */
function accordion(name: string, qa: [string, string][], o: AcOpt = {}): Node {
  const group = `faq${++acSeq}`; const ink = o.iconColor || MUTE;
  const items = qa.map(([q, a], i) => {
    const key = o.single ? `q${i + 1}` : 'a';
    const isOpen = o.open === 'all' || (o.open ?? [0]).includes(i);
    const qText = part(label(q, o.qSize ?? 17, o.qWeight ?? 600, o.qColor ?? INK), 'q'); qText.style = { ...qText.style, w: 'fill', grow: 1, lineHeight: 1.4 } as St;
    const lead = o.num ? label(String(i + 1).padStart(2, '0'), 14, 700, INDIGO) : o.lead ? tile(o.lead, INDIGO, o.leadBg || '#eef2ff', 36, 10) : null;
    const icon: Node[] = o.icon === 'none' ? [] : o.icon === 'plus' ? [part(ico(D.plus, 20, ink), 'plus')]
      : o.icon === 'swap' ? [part(ico(D.plus, 20, ink), 'plus'), part(ico(D.minus, 20, ink), 'minus')]
      : o.icon === 'arrow' ? [part(ico(D.arrow, 20, ink), 'chev')]
      : o.icon === 'chip' ? [part(stack('Chip', 'row', [ico(D.chev, 16, INK)], { w: 30, h: 30, minH: 30, grow: 0, shrink: 0, radius: 999, fill: '#f3f4f6', justify: 'center', items: 'center', gap: 0 } as St), 'chip')]
      : [part(ico(D.chev, 20, ink), 'chev')];
    const head: Node = { ...mk('container', `Question ${i + 1}`, { mode: 'flow', w: 'fill', h: 'auto', layout: 'flex', dir: 'row', items: 'center', justify: 'between', gap: 16, padY: 18, fill: 'transparent', ...o.head } as St, { tag: 'button', attrs: { type: 'button', 'data-p': 'head', cursor: 'pointer', outline: 'none' }, children: flowKids([...(lead ? [lead] : []), qText, ...icon]) }), behavior: o.single ? { role: 'tab', key, group } : { role: 'toggle', key }, bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } };
    const { padX: bx, ...bodyRest } = (o.body || {}) as St & { padX?: number };
    const body = panel(`Answer ${i + 1}`, [P(a, 15, o.aColor ?? MUTE)], { key, initial: isOpen ? 'open' : 'closed', ...(o.single ? { group } : {}) }, { w: 'fill', padB: 20, ...(bx !== undefined ? { padL: bx, padR: bx } : {}), ...(o.indent ? { padL: o.indent } : {}), ...bodyRest } as St);
    const itemStyle = { gap: 0, w: 'fill', ...(o.line === false ? {} : { borderB: 1, stroke: LINE }), ...o.item } as St;
    const tokens = `ac${o.ui ? ' ' + o.ui : ''}`;
    const item = o.single ? stack(`Item ${i + 1}`, 'column', [head, body], itemStyle) : scope(`Item ${i + 1}`, 'column', [head, body], itemStyle);
    return ui(item, tokens);
  });
  const list = stack(name, 'column', items, { w: 'fill', gap: o.gap ?? 0, ...o.list } as St);
  return o.single ? { ...list, behavior: { role: 'scope' } } : list;
}
const acc = (section: string, name: string, blurb: string, o: AcOpt = {}, qa: [string, string][] = FAQ, wrap?: (list: Node) => Node): KitItem =>
  ({ section, name, blurb, make: () => { const l = accordion(name, qa, o); return wrap ? wrap(l) : restyle(l, { maxW: 640 }); } });

const CARDY: AcOpt = { gap: 12, line: false, head: { padX: 20 }, body: { padX: 20 }, item: { radius: 14, stroke: LINE, strokeWidth: 1, fill: '#ffffff' } };
const GLASS_BG = 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)';
const onGradient = (l: Node): Node => stack('Backdrop', 'column', [restyle(l, { maxW: 560 })], { w: 'fill', pad: 32, radius: 20, fill: GLASS_BG, items: 'center' } as St);
const onDark = (l: Node): Node => stack('Backdrop', 'column', [restyle(l, { maxW: 560 })], { w: 'fill', pad: 28, radius: 20, fill: '#0b1020', items: 'center' } as St);
const SUB: [string, string][] = [['Shipping to Nigeria', 'Standard delivery takes 3 to 5 working days. Express is next day in Lagos and Abuja.'], ['Tracking my order', 'You get a link by email the moment your parcel leaves the warehouse.']];
const topics = (t: string, ic: string, qa: [string, string][]): Node => stack(t, 'column', [stack(`${t} heading`, 'row', [tile(ic, INDIGO, '#eef2ff', 32, 9), label(t, 15, 700)], { w: 'auto', gap: 10 }), accordion(t, qa, { qSize: 16 })], { w: 280, grow: 1, minW: 260, gap: 4 } as St);

export const accordionItems: KitItem[] = [
  // ---- lists
  acc('Lists', 'Divided list, chevron', 'Questions separated by thin lines. The chevron turns when an item opens. The classic FAQ.', { ui: 'ac-chev' }),
  acc('Lists', 'Divided list, plus icon', 'A plus that turns into a cross as the answer opens.', { icon: 'plus', ui: 'ac-plus' }),
  acc('Lists', 'Plus and minus swap', 'The plus becomes a minus while the item is open.', { icon: 'swap', ui: 'ac-swap' }),
  acc('Lists', 'Arrow turns down', 'An arrow that swings from pointing right to pointing down.', { icon: 'arrow', ui: 'ac-arrow' }),
  acc('Lists', 'Accent question when open', 'The open question turns brand colour, so you can see where you are.', { ui: 'ac-chev ac-q-open' }),
  acc('Lists', 'Numbered questions', 'Each question starts with 01, 02, 03. Good for steps and "how it works".', { num: true, icon: 'plus', ui: 'ac-plus' }),
  acc('Lists', 'Large flush list', 'Big type, no dividers, plenty of air. For a calm, editorial page.', { line: false, qSize: 22, qWeight: 700, icon: 'plus', ui: 'ac-plus', head: { padY: 22 } }),
  acc('Lists', 'Ruled list with top line', 'A line above and below every question, like a printed index.', { ui: 'ac-chev', item: { borderT: 1 } }),
  acc('Lists', 'Open all by default', 'Every answer starts open; visitors can close what they have read.', { open: 'all', ui: 'ac-chev' }),
  acc('Lists', 'One open at a time', 'Opening one question closes the others (the Tab behavior). One answer always stays visible.', { single: true, ui: 'ac-chev' }),
  // ---- cards
  acc('Cards', 'Boxed cards', 'Each question is its own bordered card; the open one gets a brand border and a soft shadow.', { ...CARDY, ui: 'ac-chev ac-card-open' }),
  acc('Cards', 'Soft grey cards', 'Light grey cards that turn lavender when open.', { ...CARDY, ui: 'ac-chev ac-fill-open', item: { radius: 14, fill: '#f9fafb' } }),
  acc('Cards', 'Left accent bar', 'A thick bar on the left that lights up in brand colour for the open item.', { gap: 10, line: false, head: { padX: 20 }, body: { padX: 20 }, ui: 'ac-chev ac-bar-open', item: { borderL: 4, stroke: '#d1d5db', fill: '#ffffff', radius: 8, shadow: 'sm' } }),
  acc('Cards', 'Round chip icon', 'A round chip with an arrow that fills with colour when open.', { ...CARDY, icon: 'chip', ui: 'ac-chip ac-card-open' }),
  acc('Cards', 'Lifted cards', 'White cards with a shadow and no border. They sit above a grey page.', { gap: 14, line: false, head: { padX: 22 }, body: { padX: 22 }, ui: 'ac-chev', item: { radius: 16, fill: '#ffffff', shadow: 'md' } }, FAQ, l => stack('Backdrop', 'column', [restyle(l, { maxW: 560 })], { w: 'fill', pad: 28, radius: 20, fill: '#f3f4f6', items: 'center' } as St)),
  acc('Cards', 'Pill-shaped items', 'Rounded pills that open into rounded panels.', { gap: 10, line: false, head: { padX: 24, padY: 16 }, body: { padX: 24 }, ui: 'ac-plus ac-fill-open', icon: 'plus', item: { radius: 28, stroke: LINE, strokeWidth: 1, fill: '#ffffff' } }),
  acc('Cards', 'Glass on gradient', 'Frosted-glass items over a colourful background.', { gap: 10, line: false, qColor: '#ffffff', aColor: '#eef2ff', iconColor: '#ffffff', head: { padX: 20 }, body: { padX: 20 }, ui: 'ac-chev ac-glass-open', item: { radius: 16, fill: 'rgba(255,255,255,0.16)', bgBlur: 14, stroke: 'rgba(255,255,255,0.5)', strokeWidth: 1 } }, FAQ, onGradient),
  acc('Cards', 'Dark list', 'Light text on a dark panel. Open items glow indigo.', { gap: 10, line: false, qColor: '#ffffff', aColor: '#9ca3af', iconColor: '#9ca3af', head: { padX: 20 }, body: { padX: 20 }, ui: 'ac-chev ac-dark-open', item: { radius: 14, fill: '#151c32', stroke: '#26304f', strokeWidth: 1 } }, FAQ, onDark),
  // ---- with icons
  acc('With icons', 'Icon-led questions', 'A coloured icon tile before each question.', { ...CARDY, lead: D.help, ui: 'ac-chev ac-card-open' }),
  acc('With icons', 'Topic icons', 'Different icons for billing, security, support and more.', { gap: 12, line: false, head: { padX: 20 }, body: { padX: 20, padL: 76 }, ui: 'ac-chev ac-card-open', item: { radius: 14, stroke: LINE, strokeWidth: 1, fill: '#ffffff' } }, FAQ.map(x => x) as [string, string][], l => ({ ...l, children: (l.children || []).map((it, i) => ({ ...it, children: (it.children || []).map((c, j) => j === 0 ? { ...c, children: [tile([D.card, D.shield, D.tag, D.users][i % 4], INDIGO, '#eef2ff', 36, 10), ...(c.children || [])].map(k => ({ ...k, style: { ...k.style, mode: 'flow' as const } })) } : c) })) })),
  // ---- nested and compound
  { section: 'Compound', name: 'Nested accordion', blurb: 'Questions with a smaller accordion inside, for categories with sub-questions.',
    make: () => { const l = accordion('Nested accordion', [['Shipping and delivery', ''], ['Returns and refunds', 'Return anything within 30 days in its original packaging.']], { ui: 'ac-chev', open: [0], item: { borderB: 1, stroke: LINE } });
      const first = (l.children || [])[0]; const panelNode = (first.children || [])[1];
      panelNode.children = flowKids([restyle(accordion('Inner', SUB, { qSize: 15, qWeight: 500, ui: 'ac-plus', icon: 'plus', open: [], head: { padY: 12 }, item: { borderB: 1, stroke: '#f3f4f6' } }), { padL: 16 })]);
      return restyle(l, { maxW: 640 }); } },
  { section: 'Compound', name: 'Docs sidebar groups', blurb: 'Collapsible groups of links, like a documentation sidebar. Groups can stay open together.',
    make: () => { const grp = (t: string, links: string[], open: boolean): Node => { const head: Node = { ...mk('container', `${t} group`, { mode: 'flow', w: 'fill', h: 'auto', layout: 'flex', dir: 'row', items: 'center', justify: 'between', gap: 8, padY: 10, padX: 12, radius: 8, fill: 'transparent' } as St, { tag: 'button', attrs: { type: 'button', 'data-p': 'head', cursor: 'pointer', outline: 'none' }, children: flowKids([label(t, 13, 700, INK), part(ico(D.chev, 16, MUTE), 'chev')]) }), behavior: { role: 'toggle', key: 'g' }, bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } };
        const body = panel(`${t} links`, links.map(l => { const a = label(l, 14, 500, '#4b5563'); a.href = '#'; a.style = { ...a.style, w: 'fill', padX: 12, padY: 6, radius: 6 } as St; a.states = { hover: { fill: '#f3f4f6', color: INDIGO } } as Node['states']; return a; }), { key: 'g', initial: open ? 'open' : 'closed' }, { w: 'fill', gap: 2, padL: 8, padB: 8 } as St);
        return ui(scope(t, 'column', [head, body], { w: 'fill', gap: 0 } as St), 'ac ac-chev'); };
      return stack('Docs sidebar', 'column', [grp('Getting started', ['Introduction', 'Install', 'Quick start'], true), grp('Guides', ['Pages and sections', 'Styling', 'Publishing'], false), grp('Reference', ['Components', 'Attributes', 'Shortcuts'], false)], { w: 260, gap: 4, pad: 12, radius: 14, fill: '#f9fafb', stroke: LINE, strokeWidth: 1 } as St); } },
  { section: 'Compound', name: 'Read more disclosure', blurb: 'A short paragraph with a "Read more" link that reveals the rest. Not a list, just one disclosure.',
    make: () => { const key = 'more'; const link: Node = { ...mk('container', 'Read more', { mode: 'flow', w: 'auto', h: 'auto', layout: 'flex', dir: 'row', items: 'center', gap: 6, fill: 'transparent', self: 'start' } as St, { tag: 'button', attrs: { type: 'button', 'data-p': 'head', cursor: 'pointer', outline: 'none' }, children: flowKids([label('Read more', 14, 700, INDIGO), part(ico(D.chev, 16, INDIGO), 'chev')]) }), behavior: { role: 'toggle', key }, bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } };
      return ui(scope('Read more', 'column', [P('We build small, careful tools for teams that care about the details. Every release is tested by hand before it ships.', 16, '#374151'), panel('More text', [P('We started in a spare room in 2019 and still answer every email ourselves. Our roadmap is public and shaped by the people who use the product every day.', 16, '#374151')], { key }, { w: 'fill' } as St), link], { w: 'fill', maxW: 520, gap: 12 } as St), 'ac ac-chev'); } },
  // ---- sections
  { section: 'FAQ sections', name: 'FAQ section, title and list', blurb: 'A full section: heading and intro on the left, the questions on the right. Restacks on phones.',
    make: () => sect('FAQ section', [bp(stack('Columns', 'row', [stack('Intro', 'column', [H('Frequently asked questions', 36), P('Quick answers to the things people ask us most. Cannot find yours? Write to us.', 17), textBtn('Contact support', 'Contact support', OUTLINE, { self: 'start' } as St)], { w: 340, grow: 0, gap: 16 } as St), restyle(accordion('Questions', FAQ, { ui: 'ac-chev' }), { w: 560, grow: 1, minW: 300 })], { w: 'fill', gap: 64, items: 'start', wrap: true } as St), { gap: 32 })], { fill: '#ffffff' }) },
  { section: 'FAQ sections', name: 'FAQ section, centred', blurb: 'Centred heading, one narrow list below it, and a help strip at the end.',
    make: () => sect('FAQ centred', [intro('Questions, answered', 'Everything you need to know before you start.'), restyle(accordion('Questions', FAQ, { ui: 'ac-chev ac-q-open', icon: 'plus' }), { maxW: 720, self: 'center' }), stack('Help strip', 'row', [stack('Text', 'column', [label('Still have questions?', 16, 700), hint('Our team is happy to help.')], { w: 'auto', gap: 2 }), textBtn('Talk to us', 'Talk to us', BRAND, { padY: 11 } as St)], { w: 'fill', maxW: 720, self: 'center', justify: 'between', gap: 16, wrap: true, pad: 20, radius: 14, fill: '#f5f3ff' } as St)], { fill: '#ffffff' }) },
  { section: 'FAQ sections', name: 'Categorised FAQ', blurb: 'Three small lists under their own headings: billing, account and product.',
    make: () => sect('FAQ categories', [intro('Help centre', 'Pick a topic to see the most common questions.'), flowRow('Topics', [topics('Billing', D.card, FAQ.slice(0, 2)), topics('Account', D.users, FAQ.slice(2, 4)), topics('Product', D.layers, [FAQ[0], FAQ[3]])], { gap: 40, items: 'start' })], { fill: '#f9fafb' }) },
  { section: 'FAQ sections', name: 'Two-column question cards', blurb: 'Questions laid out in two columns of boxed cards. Good for long FAQs.',
    make: () => sect('FAQ two columns', [intro('Good to know', 'The short version of how things work.'), flowRow('Columns', [restyle(accordion('Left column', FAQ.slice(0, 2), { ...CARDY, ui: 'ac-chev ac-card-open' }), { w: 420, grow: 1, minW: 280 }), restyle(accordion('Right column', FAQ.slice(2), { ...CARDY, ui: 'ac-chev ac-card-open', open: [] }), { w: 420, grow: 1, minW: 280 })], { items: 'start', gap: 20 })], { fill: '#ffffff' }) },
  { section: 'FAQ sections', name: 'FAQ with side photo', blurb: 'A photo beside the list. The photo moves above it on phones.',
    make: () => sect('FAQ with photo', [bp(stack('Columns', 'row', [photo('Photo', 'office', { w: 420, grow: 1, minW: 260, h: 420, radius: 20 }), stack('List', 'column', [H('Answers from the team', 32), restyle(accordion('Questions', FAQ, { ui: 'ac-chev' }), { w: 'fill' })], { w: 480, grow: 1, minW: 280, gap: 12 } as St)], { w: 'fill', gap: 48, items: 'center', wrap: true } as St), { gap: 28 })], { fill: '#ffffff' }) },
  { section: 'FAQ sections', name: 'FAQ on dark', blurb: 'A dark section with a glowing list, for pages that end on a strong note.',
    make: () => sect('FAQ dark', [intro('Questions', 'The honest answers.', 'center', 36, true), restyle(accordion('Questions', FAQ, { gap: 10, line: false, qColor: '#ffffff', aColor: '#9ca3af', iconColor: '#9ca3af', head: { padX: 22 }, body: { padX: 22 }, ui: 'ac-chev ac-dark-open', item: { radius: 14, fill: '#151c32', stroke: '#26304f', strokeWidth: 1 } }), { maxW: 720, self: 'center' })], { fill: '#0b1020' }) },
  { section: 'FAQ sections', name: 'FAQ with support card', blurb: 'Questions on the left and a support card with a button pinned beside them.',
    make: () => sect('FAQ with support', [bp(stack('Columns', 'row', [restyle(accordion('Questions', FAQ, { ui: 'ac-chev' }), { w: 560, grow: 2, minW: 280 }), stack('Support card', 'column', [tile(D.mail, '#ffffff', INDIGO, 48, 14), H('Need a hand?', 22), P('Our support team replies in under 4 hours, every day of the week.', 15), textBtn('Email support', 'Email support', BRAND, { self: 'start' } as St)], { w: 320, grow: 0, gap: 14, pad: 28, radius: 20, fill: '#f5f3ff', items: 'start' } as St)], { w: 'fill', gap: 48, items: 'start', wrap: true } as St), { gap: 28 })], { fill: '#ffffff' }) },
];

// ------------------------------------------------------------------ cards
/** A card sized by a pixel basis so rows of cards wrap on narrow screens (a "fill" basis would stack them at once). */
const card = (kids: Node[], st: St = {}): Node => stack('Card', 'column', kids, { w: 300, grow: 1, minW: 240, gap: 12, pad: 24, radius: 16, fill: '#ffffff', stroke: LINE, strokeWidth: 1, ...st } as St);
const cardRow = (name: string, cards: Node[], st: St = {}): Node => flowRow(name, cards, { gap: 20, ...st });
const linkText = (t: string, color = INDIGO): Node => stack('Link', 'row', [label(t, 14, 700, color), part(ico(D.arrow, 16, color), 'go')], { w: 'auto', gap: 6, self: 'start' } as St);
const FEATURES: [string, string, string][] = [
  [D.layers, 'Built to scale', 'Start with a single page and grow to hundreds without changing how you work.'],
  [D.zap, 'Fast by default', 'Pages are small and load quickly, even on slow phones and weak connections.'],
  [D.shield, 'Secure from day one', 'Backups, encryption and sensible defaults are on before you write a word.'],
];
const featureCard = (f: [string, string, string], st: St = {}, ink = INK, sub = MUTE, bg = INDIGO, tileBg = '#eef2ff'): Node => card([tile(f[0], bg, tileBg), H(f[1], 20, ink), P(f[2], 15, sub)], st);
const feat = (t: string, color = '#10b981', ink = '#374151'): Node => stack('Feature', 'row', [ico(D.check, 16, color, 2.5), label(t, 14, 400, ink)], { w: 'auto', gap: 10, items: 'center' } as St);
const priceRow = (price: string, per: string, ink = INK, sub = MUTE): Node => stack('Price', 'row', [label('$', 22, 700, ink), H(price, 46, ink), label(per, 14, 500, sub)], { w: 'auto', gap: 4, items: 'end' } as St);
type Plan = { name: string; price: string; yearly?: string; blurb: string; feats: string[]; cta: string; hl?: boolean; dark?: boolean };
const plan = (o: Plan, toggle = false): Node => {
  const ink = o.dark ? '#ffffff' : INK, sub = o.dark ? '#c7d2fe' : MUTE;
  const price = toggle ? stack('Price', 'column', [panel('Monthly price', [priceRow(o.price, '/month', ink, sub)], { key: 'monthly', group: 'billing', initial: 'open' }, { w: 'auto', gap: 0 } as St), panel('Yearly price', [priceRow(o.yearly || o.price, '/month, billed yearly', ink, sub)], { key: 'yearly', group: 'billing', initial: 'closed' }, { w: 'auto', gap: 0 } as St)], { w: 'auto', gap: 0 } as St) : priceRow(o.price, '/month', ink, sub);
  const cta = textBtn(o.cta, o.cta, o.dark ? { fill: '#ffffff', hover: '#eef2ff', color: INK } : o.hl ? BRAND : OUTLINE, { w: 'fill', self: 'auto', padY: 13 } as St);
  const badge = o.hl ? [(() => { const b = label('Most popular', 12, 700, o.dark ? INK : '#4338ca'); b.style = { ...b.style, padX: 10, padY: 4, radius: 999, fill: o.dark ? '#c7d2fe' : '#e0e7ff', self: 'start' } as St; return b; })()] : [];
  return card([...badge, label(o.name, 16, 700, ink), price, P(o.blurb, 14, sub), stack('Features', 'column', o.feats.map(f => feat(f, o.dark ? '#a5b4fc' : '#10b981', o.dark ? '#e0e7ff' : '#374151')), { w: 'fill', grow: 1, gap: 10, padT: 6, padB: 10 } as St), cta],
    { w: 300, gap: 14, pad: 28, ...(o.dark ? { fill: '#1e1b4b', stroke: '#1e1b4b' } : {}), ...(o.hl && !o.dark ? { stroke: INDIGO, strokeWidth: 2, shadow: 'lg' } : {}) } as St);
};
const PLANS: Plan[] = [
  { name: 'Starter', price: '0', yearly: '0', blurb: 'For trying things out.', feats: ['3 projects', 'Basic analytics', 'Community support'], cta: 'Start free' },
  { name: 'Pro', price: '19', yearly: '15', blurb: 'For people who ship often.', feats: ['Unlimited projects', 'Custom domains', 'Priority support', 'Export your code'], cta: 'Get Pro', hl: true },
  { name: 'Team', price: '49', yearly: '39', blurb: 'For small teams.', feats: ['Everything in Pro', '10 seats', 'Shared libraries', 'Roles and review'], cta: 'Start trial' },
];
const stat = (n: string, t: string, st: St = {}, ink = INK, sub = MUTE): Node => card([H(n, 40, ink), label(t, 14, 500, sub)], { w: 200, gap: 4, ...st } as St);
const trend = (t: string, up = true): Node => { const l = label(t, 12, 700, up ? '#047857' : '#b91c1c'); l.style = { ...l.style, padX: 8, padY: 3, radius: 999, fill: up ? '#d1fae5' : '#fee2e2', self: 'start' } as St; return l; };
const personCard = (name: string, role: string, key: string, st: St = {}): Node => card([avatar(key, 96, { self: 'center' }), label(name, 17, 700, INK), label(role, 14, 400, MUTE), stack('Links', 'row', [iconNode('twitter', 16, MUTE), iconNode('linkedin', 16, MUTE), iconNode('mail', 16, MUTE)], { w: 'auto', gap: 14, self: 'center' } as St)], { w: 240, items: 'center', gap: 8, ...st } as St);
const withTag = (n: Node, tag: string, href = '#'): Node => ({ ...n, tag, href });

export const cardItems: KitItem[] = [
  // ---- features
  { section: 'Features', name: 'Feature cards, icon on top', blurb: 'Three cards with an icon tile, a title and a sentence. They wrap on narrow screens.', make: () => cardRow('Feature cards', FEATURES.map(f => featureCard(f))) },
  { section: 'Features', name: 'Feature rows with icons', blurb: 'Wide horizontal cards, icon on the left. Good for a vertical list of benefits.',
    make: () => stack('Feature rows', 'column', FEATURES.map(f => stack(f[1], 'row', [tile(f[0], INDIGO, '#eef2ff', 52, 14), stack('Text', 'column', [label(f[1], 17, 700), P(f[2], 15)], { w: 'auto', grow: 1, gap: 4 } as St)], { w: 'fill', gap: 18, pad: 22, radius: 16, fill: '#ffffff', stroke: LINE, strokeWidth: 1, items: 'start' } as St)), { w: 'fill', maxW: 640, gap: 14 } as St) },
  { section: 'Features', name: 'Feature cards with links', blurb: 'Each card ends with a "Learn more" link; the arrow nudges on hover and the card lifts.',
    make: () => cardRow('Linked cards', FEATURES.map(f => ui(featureCard(f, { gap: 14 }), 'cd-lift')).map(c => ({ ...c, children: [...(c.children || []), flowKids([linkText('Learn more')])[0]] }))) },
  { section: 'Features', name: 'Icon tile grid', blurb: 'Six compact tiles in two rows. For a long list of small features.',
    make: () => cardRow('Icon tiles', [[D.code, 'Clean code'], [D.globe, 'Any language'], [D.clock, 'Fast builds'], [D.chart, 'Analytics'], [D.users, 'Teamwork'], [D.gear, 'Automations']].map(([d, t]) => stack(t, 'row', [tile(d, INDIGO, '#eef2ff', 40, 10), label(t, 15, 600)], { w: 240, grow: 1, minW: 200, gap: 12, padX: 16, padY: 14, radius: 14, stroke: LINE, strokeWidth: 1, fill: '#ffffff', items: 'center' } as St)), { gap: 14 }) },
  { section: 'Features', name: 'Gradient icon cards', blurb: 'The icon sits on a bright gradient tile. Friendly and colourful.',
    make: () => cardRow('Gradient cards', FEATURES.map((f, i) => card([stack('Icon', 'row', [ico(f[0], 24, '#ffffff')], { w: 52, h: 52, minH: 52, grow: 0, radius: 16, justify: 'center', items: 'center', gap: 0, fill: ['linear-gradient(135deg,#6366f1,#8b5cf6)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#10b981,#06b6d4)'][i] } as St), H(f[1], 20), P(f[2], 15)], { shadow: 'sm' }))) },
  { section: 'Features', name: 'Numbered step cards', blurb: 'A big step number over a title and a line. For "how it works".',
    make: () => cardRow('Step cards', FEATURES.map((f, i) => card([label(String(i + 1).padStart(2, '0'), 44, 800, '#c7d2fe'), H(['Create', 'Customise', 'Publish'][i], 20), P(['Start from a template or a blank page.', 'Change colours, text and images in seconds.', 'Go live with one click and share the link.'][i], 15)], { gap: 8 }))) },
  { section: 'Features', name: 'Glass feature cards', blurb: 'Frosted cards on a gradient backdrop.',
    make: () => stack('Backdrop', 'column', [cardRow('Glass cards', FEATURES.map(f => featureCard(f, { fill: 'rgba(255,255,255,0.16)', bgBlur: 14, stroke: 'rgba(255,255,255,0.5)' }, '#ffffff', '#eef2ff', '#ffffff', 'rgba(255,255,255,0.2)')))], { w: 'fill', pad: 28, radius: 24, fill: GLASS_BG } as St) },
  { section: 'Features', name: 'Hover-lift cards', blurb: 'Cards rise and get a stronger shadow when you point at them.',
    make: () => cardRow('Lift cards', FEATURES.map(f => ui(featureCard(f, { shadow: 'sm' }), 'cd-lift'))) },
  { section: 'Features', name: 'Bento grid', blurb: 'Uneven tiles of different sizes, like an app showcase. Wraps neatly on phones.',
    make: () => stack('Bento grid', 'column', [
      cardRow('Row 1', [card([tile(D.layers, '#ffffff', 'rgba(255,255,255,0.2)'), H('One workspace for everything', 26, '#ffffff'), P('Pages, components and assets live together, so nothing gets lost.', 16, '#e0e7ff')], { w: 560, grow: 2, minH: 260, pad: 32, fill: 'linear-gradient(135deg,#4f46e5,#7c3aed)', stroke: 'transparent', justify: 'end' } as St), card([H('2×', 44, INDIGO), P('faster than starting from scratch.', 15)], { w: 280, grow: 1, fill: '#f5f3ff', stroke: '#e0e7ff', justify: 'end' } as St)]),
      cardRow('Row 2', [card([tile(D.shield, '#34d399', 'rgba(52,211,153,0.15)'), H('Private by default', 20, '#ffffff'), P('Nothing is shared until you decide.', 14, '#9ca3af')], { w: 280, grow: 1, fill: '#111827', stroke: '#111827', justify: 'end' } as St), photo('Photo card', 'workspace', { w: 560, grow: 2, h: 'auto', minH: 220, radius: 16 })])], { w: 'fill', gap: 20 } as St) },
  { section: 'Features', name: 'Checklist card', blurb: 'One card listing what is included, each line with a tick.',
    make: () => card([H("What's included", 22), ...['Unlimited pages', 'Custom domain', 'Free SSL certificate', 'Email support', 'Monthly backups'].map(t => feat(t))], { w: 340, grow: 0, gap: 14, pad: 28, shadow: 'md' } as St) },
  // ---- pricing
  { section: 'Pricing', name: 'Pricing, three plans', blurb: 'Three plans side by side; the middle one is highlighted as most popular.', make: () => cardRow('Pricing', PLANS.map(p => plan(p)), { items: 'stretch' }) },
  { section: 'Pricing', name: 'Pricing with billing toggle', blurb: 'A Monthly / Yearly switch above the plans. The prices change when you click it (Tab and Panel behaviors).',
    make: () => { const tab = (t: string, key: string): Node => ({ ...mk('container', `${t} tab`, { mode: 'flow', w: 'auto', h: 'auto', layout: 'flex', dir: 'row', items: 'center', justify: 'center', padX: 20, padY: 9, radius: 9, fill: 'transparent' } as St, { tag: 'button', attrs: { type: 'button', cursor: 'pointer', outline: 'none' }, children: [label(t, 14, 600, '#4b5563')] }), behavior: { role: 'tab', key, group: 'billing' }, bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } });
      const seg = ui(stack('Billing switch', 'row', [tab('Monthly', 'monthly'), tab('Yearly · save 20%', 'yearly')], { w: 'auto', self: 'center', gap: 2, pad: 4, radius: 12, fill: '#f3f4f6' } as St), 'cd-seg');
      return { ...stack('Pricing toggle', 'column', [seg, cardRow('Plans', PLANS.map(p => plan(p, true)))], { w: 'fill', gap: 28 } as St), behavior: { role: 'scope' } }; } },
  { section: 'Pricing', name: 'Single plan card', blurb: 'One centred plan with everything listed. For simple products.',
    make: () => card([label('Lifetime access', 14, 700, INDIGO), priceRow('99', ' once'), P('Pay once. Use it forever, with every future update.', 15), stack('Features', 'column', ['All templates', 'Unlimited exports', 'Lifetime updates', '30-day refund'].map(f => feat(f)), { w: 'fill', gap: 10, padT: 8 } as St), textBtn('Buy now', 'Buy now', BRAND, { w: 'fill', self: 'auto', padY: 14 } as St)], { w: 360, grow: 0, pad: 32, shadow: 'lg', self: 'center' } as St) },
  { section: 'Pricing', name: 'Pricing, dark highlighted', blurb: 'The popular plan is a dark indigo card; the others stay light.',
    make: () => cardRow('Pricing dark', [plan(PLANS[0]), plan({ ...PLANS[1], hl: true, dark: true }), plan(PLANS[2])]) },
  { section: 'Pricing', name: 'Plan comparison', blurb: 'A small table: features down the side, three plans across, ticks in the cells.',
    make: () => { const rows: [string, boolean[]][] = [['Projects', [true, true, true]], ['Custom domain', [false, true, true]], ['Team seats', [false, false, true]], ['Priority support', [false, true, true]]];
      const cell = (n: Node, w = 90): Node => restyle(n, { w, grow: 0 }); const mark = (on: boolean) => on ? ico(D.check, 18, '#10b981', 2.5) : label('–', 16, 400, '#d1d5db');
      const head = stack('Head', 'row', [restyle(label('', 14), { w: 160, grow: 1 }), ...['Starter', 'Pro', 'Team'].map(t => cell(label(t, 14, 700)))], { w: 'fill', gap: 12, padY: 12, borderB: 1, stroke: LINE } as St);
      return stack('Comparison', 'column', [head, ...rows.map(([t, v]) => stack(t, 'row', [restyle(label(t, 15, 500, '#374151'), { w: 160, grow: 1 }), ...v.map(x => stack('Cell', 'row', [mark(x)], { w: 90, grow: 0, justify: 'start' } as St))], { w: 'fill', gap: 12, padY: 14, borderB: 1, stroke: '#f3f4f6' } as St))], { w: 'fill', maxW: 560, pad: 24, radius: 16, fill: '#ffffff', stroke: LINE, strokeWidth: 1, gap: 0 } as St); } },
  { section: 'Pricing', name: 'Pricing banner', blurb: 'One wide plan: copy and price on the left, the list and button on the right.',
    make: () => stack('Pricing banner', 'row', [stack('Copy', 'column', [H('Everything, one price', 28), P('No tiers, no upsells. One plan with every feature.', 16), priceRow('29', '/month')], { w: 320, grow: 1, gap: 14 } as St), stack('List', 'column', [...['Unlimited pages', 'Team of any size', 'All integrations', 'Priority support'].map(f => feat(f)), textBtn('Start free trial', 'Start free trial', BRAND, { padY: 13, self: 'start' } as St)], { w: 280, grow: 1, gap: 12 } as St)], { w: 'fill', gap: 40, pad: 36, radius: 24, fill: '#f5f3ff', stroke: '#e0e7ff', strokeWidth: 1, wrap: true, items: 'center' } as St) },
  // ---- stats
  { section: 'Stats', name: 'Stat tiles', blurb: 'Four big numbers with a label, in a row.', make: () => cardRow('Stat tiles', [['12k+', 'Active teams'], ['99.9%', 'Uptime'], ['4.9/5', 'Average rating'], ['24/7', 'Support']].map(([n, t]) => stat(n, t, { grow: 1 })), { gap: 16 }) },
  { section: 'Stats', name: 'Stat cards with trend', blurb: 'A number, a label and a green or red change badge.',
    make: () => cardRow('Trend cards', [['$48.2k', 'Revenue', '+12.4%', true], ['1,284', 'New users', '+8.1%', true], ['2.4%', 'Bounce rate', '-3.2%', true], ['318', 'Refunds', '+5.0%', false]].map(([n, t, c, up]) => card([label(t as string, 14, 500, MUTE), H(n as string, 32), trend(c as string, up as boolean)], { w: 220, grow: 1, gap: 8 } as St)), { gap: 16 }) },
  { section: 'Stats', name: 'Big number band', blurb: 'A coloured band with three huge numbers. Place it between sections.',
    make: () => sect('Number band', [cardRow('Numbers', [['3.2M', 'Pages published'], ['180', 'Countries'], ['99.9%', 'Uptime']].map(([n, t]) => stack(t, 'column', [H(n, 56, '#ffffff', 'center'), label(t, 16, 500, '#c7d2fe')], { w: 240, grow: 1, items: 'center', gap: 4 } as St)), { gap: 32, items: 'start' })], { fill: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padY: 64 }, { mobile: { padY: 40 } }) },
  { section: 'Stats', name: 'Metric card with bars', blurb: 'A number, a change badge and a tiny bar chart of the last seven days.',
    make: () => card([label('Visitors this week', 14, 500, MUTE), stack('Value', 'row', [H('18,420', 34), trend('+14%')], { w: 'auto', gap: 10, items: 'center' } as St), stack('Bars', 'row', [40, 62, 48, 80, 56, 92, 70].map((h, i) => mk('container', `Bar ${i + 1}`, { mode: 'flow', w: 'fill', h, grow: 1, radius: 6, fill: i === 5 ? INDIGO : '#e0e7ff' } as St)), { w: 'fill', gap: 8, items: 'end', h: 96, minH: 96 } as St)], { w: 340, grow: 0, gap: 14, pad: 24, shadow: 'sm' } as St) },
  // ---- people
  { section: 'People', name: 'Team cards', blurb: 'Round photo, name, role and three small icons. Uses the shared placeholder portraits.',
    make: () => cardRow('Team', [['Amara Okafor', 'Founder and CEO', 'portraitA'], ['Daniel Mensah', 'Head of design', 'portraitB'], ['Zainab Bello', 'Engineering lead', 'portraitC']].map(([n, r, k]) => personCard(n, r, k)), { gap: 20 }) },
  { section: 'People', name: 'Profile card with cover', blurb: 'A cover band, an avatar that overlaps it, three counts and a follow button.',
    make: () => stack('Profile card', 'column', [stack('Cover', 'row', [], { w: 'fill', h: 110, minH: 110, grow: 0, fill: 'linear-gradient(135deg,#818cf8,#f472b6)' } as St), stack('Body', 'column', [avatar('portraitE', 84, { marginT: -52, stroke: '#ffffff', strokeWidth: 4, self: 'center' }), label('Ngozi Eze', 18, 700), label('Product designer, Lagos', 14, 400, MUTE), stack('Counts', 'row', [['128', 'Posts'], ['4.2k', 'Followers'], ['312', 'Following']].map(([n, t]) => stack(t, 'column', [label(n, 16, 700), label(t, 12, 400, MUTE)], { w: 'auto', grow: 1, items: 'center', gap: 0 } as St)), { w: 'fill', gap: 8, padY: 8 } as St), textBtn('Follow', 'Follow', BRAND, { w: 'fill', self: 'auto', padY: 11 } as St)], { w: 'fill', items: 'center', gap: 6, padX: 24, padB: 24 } as St)], { w: 320, grow: 0, gap: 0, radius: 20, fill: '#ffffff', stroke: LINE, strokeWidth: 1, overflow: 'hidden', shadow: 'md' } as St) },
  { section: 'People', name: 'Person card, horizontal', blurb: 'Avatar, name, role and a message button on one line.',
    make: () => stack('Person', 'row', [avatar('portraitF', 64), stack('Text', 'column', [label('Tunde Adeyemi', 17, 700), label('Customer success', 14, 400, MUTE)], { w: 'auto', grow: 1, gap: 2 } as St), textBtn('Message', 'Message', OUTLINE, { padY: 9, self: 'auto' } as St)], { w: 'fill', maxW: 460, gap: 16, pad: 18, radius: 16, fill: '#ffffff', stroke: LINE, strokeWidth: 1 } as St) },
  { section: 'People', name: 'Contact details card', blurb: 'Email, phone and address, each with an icon.',
    make: () => card([H('Contact us', 22), ...[[D.mail, 'hello@brand.com'], [D.clock, 'Mon to Fri, 9am to 6pm'], [D.pin, '12 Market Street, Lagos']].map(([d, t]) => stack(t, 'row', [tile(d, INDIGO, '#eef2ff', 36, 10), label(t, 15, 500, '#374151')], { w: 'auto', gap: 12 } as St))], { w: 340, grow: 0, gap: 14 } as St) },
  // ---- links and products
  { section: 'Links and products', name: 'Link cards', blurb: 'Clickable cards with a title, a line and an arrow. For docs and resource lists.',
    make: () => cardRow('Link cards', [[D.book, 'Documentation', 'Guides and references for every feature.'], [D.code, 'API reference', 'Endpoints, examples and SDKs.'], [D.users, 'Community', 'Ask questions and share what you built.']].map(([d, t, s]) => ui(withTag(card([tile(d, INDIGO), H(t, 18), P(s, 14), linkText('Open')], { gap: 10 }), 'a'), 'cd-lift'))) },
  { section: 'Links and products', name: 'Product cards', blurb: 'A photo, a name, a price and an add-to-cart button. Uses placeholder product photos.',
    make: () => cardRow('Products', [['Classic watch', '$129', 'watch', 'Accessories'], ['Studio headphones', '$89', 'headphones', 'Audio'], ['Runner sneaker', '$99', 'sneaker', 'Footwear']].map(([n, pr, k, c]) => card([photo('Product photo', k, { h: 220, radius: 0 }), stack('Info', 'column', [label(c, 12, 600, INDIGO), label(n, 17, 700), stack('Buy', 'row', [label(pr, 18, 700), textBtn('Add to cart', 'Add to cart', DARK, { padY: 9, padX: 14, self: 'auto' } as St)], { w: 'fill', justify: 'between', gap: 10, padT: 6 } as St)], { w: 'fill', gap: 4, padX: 20, padY: 18 } as St)], { w: 260, gap: 0, pad: 0, overflow: 'hidden' } as St)), { gap: 20 }) },
  { section: 'Links and products', name: 'Download card', blurb: 'A file icon, a title, the file size and a download button.',
    make: () => stack('Download card', 'row', [tile(D.download, '#b45309', '#fef3c7', 52, 14), stack('Text', 'column', [label('Brand guidelines.pdf', 16, 700), hint('PDF · 2.4 MB')], { w: 'auto', grow: 1, gap: 2 } as St), textBtn('Download', 'Download', OUTLINE, { padY: 9, self: 'auto' } as St)], { w: 'fill', maxW: 480, gap: 16, pad: 18, radius: 16, fill: '#ffffff', stroke: LINE, strokeWidth: 1 } as St) },
  { section: 'Links and products', name: 'Callout cards', blurb: 'Info, tip and warning notes with a coloured edge. Use inside long articles.',
    make: () => stack('Callouts', 'column', [['Note', 'Changes can take a few minutes to appear.', '#2563eb', '#eff6ff', D.help], ['Tip', 'Press Cmd + K to search everything.', '#059669', '#ecfdf5', D.zap], ['Careful', 'Deleting a project cannot be undone.', '#d97706', '#fffbeb', D.shield]].map(([t, s, c, bg, d]) => stack(t, 'row', [ico(d, 20, c), stack('Text', 'column', [label(t, 14, 700, c), label(s, 14, 400, '#374151')], { w: 'auto', grow: 1, gap: 2 } as St)], { w: 'fill', gap: 12, padX: 16, padY: 14, radius: 10, borderL: 4, stroke: c, fill: bg, items: 'start' } as St)), { w: 'fill', maxW: 520, gap: 12 } as St) },
  { section: 'Links and products', name: 'Event card', blurb: 'A date block, a title, the place and a register button.',
    make: () => stack('Event card', 'row', [stack('Date', 'column', [label('NOV', 12, 700, '#ef4444'), label('21', 28, 800)], { w: 64, h: 72, minH: 72, grow: 0, shrink: 0, items: 'center', justify: 'center', gap: 0, radius: 14, fill: '#fef2f2' } as St), stack('Text', 'column', [label('Design meetup Lagos', 17, 700), hint('6:30 pm · Yaba Tech Hub')], { w: 'auto', grow: 1, gap: 2 } as St), textBtn('Register', 'Register', BRAND, { padY: 10, self: 'auto' } as St)], { w: 'fill', maxW: 520, gap: 16, pad: 18, radius: 16, fill: '#ffffff', stroke: LINE, strokeWidth: 1 } as St) },
];


// ------------------------------------------------------------------ testimonials
const QUOTES: [string, string, string, string][] = [
  ['Switching saved our team hours every week. We shipped our new site in a single afternoon.', 'Amara Okafor', 'Founder, Northwind', 'portraitA'],
  ['The details are right. Everything feels considered, and support answers within minutes.', 'Daniel Mensah', 'Design lead, Kora', 'portraitB'],
  ['We tried five tools before this one. Nothing else was this simple to hand over to clients.', 'Zainab Bello', 'Agency owner', 'portraitC'],
  ['Our conversion rate went up 31% after we rebuilt the landing page. It took two days.', 'Tunde Adeyemi', 'Growth lead, Lumen', 'portraitD'],
  ['I stopped dreading website updates. My whole team can edit pages without asking me.', 'Ngozi Eze', 'Operations, Halo', 'portraitE'],
  ['Clean output, fast pages and honest pricing. Exactly what a small studio needs.', 'Emeka Obi', 'Studio director', 'portraitF'],
];
const who = (i: number, size = 44, ink = INK, sub = MUTE, center = false): Node =>
  stack('Author', 'row', [avatar(QUOTES[i][3], size), stack('Name', 'column', [label(QUOTES[i][1], 15, 700, ink), label(QUOTES[i][2], 13, 400, sub)], { w: 'auto', gap: 0 } as St)], { w: 'auto', gap: 12, ...(center ? { self: 'center' } : { self: 'start' }) } as St);
const qText = (i: number, size = 16, color = '#374151', align?: 'left' | 'center'): Node => P(QUOTES[i][0], size, color, align);
const qCard = (i: number, o: { stars?: boolean; dark?: boolean; mark?: boolean; st?: St } = {}): Node => card([...(o.stars ? [stars()] : []), ...(o.mark ? [ico(D.quote, 28, '#c7d2fe', 1.5)] : []), qText(i, 16, o.dark ? '#e5e7eb' : '#374151'), restyle(who(i, 44, o.dark ? '#ffffff' : INK, o.dark ? '#9ca3af' : MUTE), { marginT: 'auto' } as unknown as St)], { gap: 14, ...(o.dark ? { fill: '#151c32', stroke: '#26304f' } : {}), ...o.st } as St);
const bigQuote = (i: number, size = 28, color = INK, align: 'left' | 'center' = 'center'): Node => H(`“${QUOTES[i][0]}”`, size, color, align);
const tweet = (i: number, text: string, handle: string): Node => card([stack('Head', 'row', [avatar(QUOTES[i][3], 40), stack('Name', 'column', [stack('Name row', 'row', [label(QUOTES[i][1], 15, 700), ico('M20 6L9 17l-5-5', 14, '#1d9bf0', 3)], { w: 'auto', gap: 4 } as St), label(handle, 13, 400, MUTE)], { w: 'auto', grow: 1, gap: 0 } as St), iconNode('twitter', 18, '#1d9bf0')], { w: 'fill', gap: 10 } as St), label(text, 15, 400, '#111827'), label('9:41 AM · Nov 12, 2026', 12, 400, MUTE)], { w: 320, gap: 12, pad: 20 } as St);
const TWEETS: [number, string, string][] = [[0, 'Rebuilt our whole landing page over lunch. Shipping this fast feels illegal.', '@amara_builds'], [1, 'The little details in this are unreal. Spacing, states, focus rings. Someone cared.', '@danielmensah'], [2, 'Handed a site to a client and they edited it themselves on day one. Never going back.', '@zainabbello'], [3, 'Went from idea to live in a day. Our team is still in shock.', '@tundeadeyemi'], [4, 'Finally a tool that exports clean code my developers do not complain about.', '@ngozieze'], [5, 'Quietly the best thing we added to our stack this year.', '@emekaobi']];
const logoWord = (t: string, c = '#9ca3af'): Node => label(t, 20, 800, c);
const pickRow = (ids: number[]): Node => ui(stack('Authors', 'row', ids.map((i, n) => ({ ...avatar(QUOTES[i][3], 56), tag: 'button', attrs: { type: 'button', cursor: 'pointer', outline: 'none', 'aria-label': QUOTES[i][1] }, behavior: { role: 'tab', key: `p${n + 1}`, group: 'who' } as Node['behavior'] })), { w: 'auto', self: 'center', gap: 16 } as St), 'ts-pick');

export const testimonialItems: KitItem[] = [
  // ---- single quotes
  { section: 'Single quotes', name: 'Large centred quote', blurb: 'One big quote in the middle with the author under it. Calm and confident.',
    make: () => sect('Quote, centred', [stack('Quote', 'column', [ico(D.quote, 40, '#c7d2fe', 1.5), bigQuote(0), who(0, 52, INK, MUTE, true)], { w: 'fill', maxW: 760, self: 'center', items: 'center', gap: 24 } as St)], { padY: 80 }, { mobile: { padY: 48 } }) },
  { section: 'Single quotes', name: 'Quote with avatar', blurb: 'A simple card: the quote, then a round photo, name and role.', make: () => restyle(qCard(0), { w: 420, grow: 0 }) },
  { section: 'Single quotes', name: 'Quote with big mark', blurb: 'A large soft quote mark above the text.', make: () => restyle(qCard(1, { mark: true, st: { pad: 28 } }), { w: 420, grow: 0 }) },
  { section: 'Single quotes', name: 'Quote with star rating', blurb: 'Five gold stars above the quote.', make: () => restyle(qCard(2, { stars: true }), { w: 420, grow: 0 }) },
  { section: 'Single quotes', name: 'Dark quote card', blurb: 'Light text on a dark card. Place it on a dark band.', make: () => restyle(qCard(3, { dark: true, stars: true, st: { pad: 28 } }), { w: 420, grow: 0 }) },
  { section: 'Single quotes', name: 'Gradient quote banner', blurb: 'A full-width coloured section with a white quote.',
    make: () => sect('Quote banner', [stack('Quote', 'column', [bigQuote(1, 30, '#ffffff'), who(1, 52, '#ffffff', '#c7d2fe', true)], { w: 'fill', maxW: 760, self: 'center', items: 'center', gap: 24 } as St)], { fill: 'linear-gradient(135deg,#4f46e5,#db2777)', padY: 72 }, { mobile: { padY: 44 } }) },
  { section: 'Single quotes', name: 'Quote with company name', blurb: 'The customer company in bold above the quote, a classic case-study look.',
    make: () => card([logoWord('NORTHWIND', INK), qText(0, 18), who(0)], { w: 460, grow: 0, gap: 18, pad: 30, shadow: 'md' } as St) },
  { section: 'Single quotes', name: 'Photo beside quote', blurb: 'A tall portrait on the left, the quote on the right. Stacks on phones.',
    make: () => stack('Photo quote', 'row', [photo('Portrait', 'portraitC', { w: 320, grow: 0, h: 380, radius: 20, minW: 240 }), stack('Quote', 'column', [ico(D.quote, 32, '#c7d2fe', 1.5), H(`“${QUOTES[2][0]}”`, 24), who(2)], { w: 420, grow: 1, gap: 18 } as St)], { w: 'fill', gap: 40, items: 'center', wrap: true, maxW: 880 } as St) },
  { section: 'Single quotes', name: 'Video testimonial', blurb: 'A photo with a play button and a caption. Link the card to your video.',
    make: () => stack('Video card', 'column', [photo('Thumbnail', 'portraitG', { h: 240, radius: 0, justify: 'center', items: 'center' }, [stack('Play', 'row', [ico(D.play, 22, INDIGO, 2)], { w: 64, h: 64, minH: 64, grow: 0, radius: 999, fill: 'rgba(255,255,255,0.92)', justify: 'center', items: 'center', gap: 0, shadow: 'lg' } as St)]), stack('Caption', 'column', [label('“It changed how we work.”', 18, 700), label('Watch Grace’s story · 2 min', 13, 400, MUTE)], { w: 'fill', gap: 4, pad: 20 } as St)], { w: 360, gap: 0, radius: 20, fill: '#ffffff', stroke: LINE, strokeWidth: 1, overflow: 'hidden', shadow: 'md' } as St) },
  { section: 'Single quotes', name: 'Quote with result', blurb: 'A big result number beside the quote. Proof first, words second.',
    make: () => stack('Result quote', 'row', [stack('Result', 'column', [H('+31%', 64, INDIGO), label('conversion rate in two weeks', 15, 500, MUTE)], { w: 220, grow: 0, gap: 4 } as St), stack('Quote', 'column', [qText(3, 20, INK), who(3)], { w: 360, grow: 1, gap: 16 } as St)], { w: 'fill', maxW: 760, gap: 40, pad: 32, radius: 24, fill: '#f5f3ff', items: 'center', wrap: true } as St) },
  { section: 'Single quotes', name: 'Quote on tinted block', blurb: 'A tinted block with a left edge, as if pulled from an article.',
    make: () => stack('Pull quote', 'column', [qText(4, 22, INK), who(4)], { w: 'fill', maxW: 560, gap: 18, padX: 28, padY: 24, borderL: 4, stroke: INDIGO, fill: '#f5f3ff', radius: 8 } as St) },
  // ---- grids and rows
  { section: 'Grids and rows', name: 'Three quote cards', blurb: 'Three cards side by side. They wrap on narrow screens.', make: () => cardRow('Quotes', [0, 1, 2].map(i => qCard(i, { stars: true }))) },
  { section: 'Grids and rows', name: 'Quote cards with big marks', blurb: 'Three cards that open with a soft quote mark.', make: () => cardRow('Quotes', [3, 4, 5].map(i => qCard(i, { mark: true }))) },
  { section: 'Grids and rows', name: 'Two large quotes', blurb: 'Two roomy cards with larger type. Good for two strong voices.', make: () => cardRow('Two quotes', [0, 1].map(i => restyle(qCard(i, { st: { pad: 36, gap: 20 } }), { w: 440 })).map(c => ({ ...c, children: (c.children || []).map((k, j) => j === 0 ? restyle(k, { fontSize: 20 }) : k) }))) },
  { section: 'Grids and rows', name: 'Columns of mixed height', blurb: 'Three columns whose cards have different lengths, for a lively "wall" feel.',
    make: () => flowRow('Columns', [[0, 3], [1, 4, 5], [2]].map((ids, c) => stack(`Column ${c + 1}`, 'column', ids.map(i => qCard(i, { st: { w: 'fill', grow: 0 } })), { w: 300, grow: 1, minW: 240, gap: 20 } as St)), { items: 'start' }) },
  { section: 'Grids and rows', name: 'Wall of love', blurb: 'Six short social-style posts in a grid.', make: () => cardRow('Wall of love', TWEETS.map(([i, t, h]) => tweet(i, t, h)).map(c => restyle(c, { w: 300, grow: 1 }))) },
  { section: 'Grids and rows', name: 'Social post card', blurb: 'One post with a verified tick, handle and time.', make: () => tweet(0, TWEETS[0][1], TWEETS[0][2]) },
  { section: 'Grids and rows', name: 'Scrolling row of cards', blurb: 'Cards in one row that visitors swipe or scroll sideways, snapping card by card.',
    make: () => ui(pinRow(stack('Scroll row', 'row', [0, 1, 2, 3, 4].map(i => qCard(i, { stars: true, st: { w: 300, grow: 0, minW: 300 } })), { w: 'fill', gap: 16, wrap: false, overflow: 'auto', padB: 8 } as St)), 'ts-snap') },
  { section: 'Grids and rows', name: 'Auto-scrolling strip', blurb: 'A strip of quotes that drifts sideways forever and pauses when you point at it.',
    make: () => { const cards = [0, 1, 2, 3, 4, 5].map(i => qCard(i, { st: { w: 320, grow: 0, minW: 320 } })); const track = part(pinRow(stack('Track', 'row', [...cards, ...cards.map(c => ({ ...c, id: c.id + 'b' }))], { w: 'auto', gap: 16, wrap: false } as St)), 'track'); return ui(stack('Marquee', 'column', [track], { w: 'fill', overflow: 'hidden', padY: 8 } as St), 'ts-marquee'); } },
  { section: 'Grids and rows', name: 'Compact quote list', blurb: 'Avatar and a one-line quote per row. Fits sidebars and small spaces.',
    make: () => stack('Compact list', 'column', [0, 1, 2].map(i => stack(`Row ${i + 1}`, 'row', [avatar(QUOTES[i][3], 44), stack('Text', 'column', [P(QUOTES[i][0].split('.')[0] + '.', 14, '#374151'), label(`${QUOTES[i][1]}, ${QUOTES[i][2]}`, 12, 500, MUTE)], { w: 'auto', grow: 1, gap: 2 } as St)], { w: 'fill', gap: 14, padY: 14, borderB: 1, stroke: LINE, items: 'start' } as St)), { w: 'fill', maxW: 460, gap: 0 } as St) },
  // ---- proof and summaries
  { section: 'Proof and summaries', name: 'Rating summary with quote', blurb: 'A big average rating with stars on the left, a quote on the right.',
    make: () => stack('Rating summary', 'row', [stack('Score', 'column', [H('4.9', 64), stars(5, '#f59e0b', 20), label('from 2,400+ reviews', 14, 500, MUTE)], { w: 200, grow: 0, gap: 4, items: 'start' } as St), stack('Quote', 'column', [qText(5, 18, INK), who(5)], { w: 360, grow: 1, gap: 14 } as St)], { w: 'fill', maxW: 720, gap: 36, pad: 32, radius: 20, fill: '#ffffff', stroke: LINE, strokeWidth: 1, shadow: 'sm', wrap: true, items: 'center' } as St) },
  { section: 'Proof and summaries', name: 'Logos and one quote', blurb: 'A row of customer names above one featured quote.',
    make: () => sect('Logos and quote', [flowRow('Logos', ['NORTHWIND', 'KORA', 'LUMEN', 'HALO', 'ATLAS'].map(t => restyle(logoWord(t), { w: 'auto', grow: 1 })), { justify: 'between', gap: 24, items: 'center' }), stack('Quote', 'column', [bigQuote(2, 26), who(2, 48, INK, MUTE, true)], { w: 'fill', maxW: 720, self: 'center', items: 'center', gap: 20 } as St)], { gap: 48, fill: '#f9fafb' }) },
  { section: 'Proof and summaries', name: 'Case study card', blurb: 'A photo, a headline result, a short quote and a link to the full story.',
    make: () => stack('Case study', 'column', [photo('Photo', 'office', { h: 180, radius: 0 }), stack('Body', 'column', [label('CASE STUDY · NORTHWIND', 11, 700, INDIGO), H('Cut launch time from 6 weeks to 2 days', 22), P(`“${QUOTES[0][0]}”`, 15), restyle(linkText('Read the story'), { marginT: 4 } as unknown as St)], { w: 'fill', gap: 10, pad: 24 } as St)], { w: 380, gap: 0, radius: 20, fill: '#ffffff', stroke: LINE, strokeWidth: 1, overflow: 'hidden', shadow: 'md' } as St) },
  { section: 'Proof and summaries', name: 'Product review card', blurb: 'Stars, a review title, text and a "Verified buyer" line, like a shop review.',
    make: () => card([stack('Top', 'row', [stars(), label('2 days ago', 12, 400, MUTE)], { w: 'fill', justify: 'between' } as St), label('Worth every penny', 16, 700), P('Arrived early, well packed and exactly as pictured. I have used it every day since.', 15, '#374151'), stack('By', 'row', [avatar('portraitH', 32), label('Emeka O.', 14, 600), (() => { const v = label('✓ Verified buyer', 12, 600, '#047857'); v.style = { ...v.style, padX: 8, padY: 2, radius: 999, fill: '#d1fae5' } as St; return v; })()], { w: 'auto', gap: 10 } as St)], { w: 380, grow: 0, gap: 12 } as St) },
  { section: 'Proof and summaries', name: 'Quotes with a picker', blurb: 'Click a face to switch the quote. The selected face grows a ring. Built with the Tab and Panel behaviors.',
    make: () => { const ids = [0, 1, 2]; const panels = ids.map((i, n) => panel(`Quote ${n + 1}`, [bigQuote(i, 24), who(i, 48, INK, MUTE, true)], { key: `p${n + 1}`, group: 'who', initial: n === 0 ? 'open' : 'closed' }, { w: 'fill', items: 'center', gap: 20, minH: 190 } as St));
      return { ...stack('Quote picker', 'column', [...panels, pickRow(ids)], { w: 'fill', maxW: 720, self: 'center', gap: 28, items: 'center' } as St), behavior: { role: 'scope' } }; } },
  // ---- sections
  { section: 'Sections', name: 'Section with three cards', blurb: 'A heading above three quote cards. A ready testimonial section.',
    make: () => sect('Testimonials', [intro('Loved by teams everywhere', 'See what people say after their first month.'), cardRow('Quotes', [0, 1, 2].map(i => qCard(i, { stars: true })))], { fill: '#f9fafb' }) },
  { section: 'Sections', name: 'Dark section with cards', blurb: 'A dark section with glowing quote cards and a white heading.',
    make: () => sect('Testimonials dark', [intro('Kind words', 'Straight from the people who use it every day.', 'center', 36, true), cardRow('Quotes', [3, 4, 5].map(i => qCard(i, { dark: true, stars: true })))], { fill: '#0b1020' }) },
  { section: 'Sections', name: 'Section with wall of love', blurb: 'A heading and a grid of six short posts.',
    make: () => sect('Wall of love', [intro('The internet is talking', 'A few of our favourite posts.'), cardRow('Posts', TWEETS.map(([i, t, h]) => restyle(tweet(i, t, h), { w: 300, grow: 1 })))], { fill: '#ffffff' }) },
];
