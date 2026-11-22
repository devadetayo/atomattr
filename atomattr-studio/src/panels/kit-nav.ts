/**
 * Library: navigation. Navbars, menus, tabs, breadcrumbs, pagination and sidebars, 8 of each.
 * Menus and tabs use the Panel / Toggle / Tab behavior roles, so they work in exported pages. Never call imported helpers at
 * module top level (kit.ts and this file import each other); everything is built inside make().
 */
import type { Node } from '../document/types';
import { makeHeading } from '../document/factory';
import { stack, label, hint, iconNode, textBtn, brandMark, scope, panel, plainButton, linkItem, inlineLink, pinRow, hamburger, NAV_BAR, BRAND, DARK, OUTLINE, SOFT, GHOST, type KitItem } from './kit';

type St = NonNullable<Node['style']>;
const ACC = '#4f46e5';
let n = 0; const uid = (p: string) => `${p}-${++n}-${Math.random().toString(36).slice(2, 5)}`;
const ui = (nd: Node, id: string): Node => ({ ...nd, attrs: { ...(nd.attrs || {}), 'data-ui': id } });
const link = (t: string, o: { color?: string; size?: number; weight?: number; active?: boolean; st?: St } = {}): Node => { const x = label(t, o.size ?? 15, o.weight ?? (o.active ? 700 : 500), o.color ?? (o.active ? ACC : '#4b5563')); x.href = '#'; x.states = { hover: { color: ACC } } as Node['states']; if (o.st) x.style = { ...x.style, ...o.st } as St; return x; };
const brand = (dark = false): Node => { const b = brandMark(22); b.style = { ...b.style, color: dark ? '#ffffff' : '#111827' } as St; return b; };
const sep = (t = '/', color = '#d1d5db'): Node => label(t, 14, 400, color);
const circle = (size: number, fill = 'linear-gradient(135deg,#818cf8,#f472b6)'): Node => ({ ...stack('Avatar', 'row', [], { w: size, h: size, minH: size, grow: 0, radius: 999, fill } as St) });
const N = (section: string, name: string, blurb: string, make: () => Node): KitItem => ({ section, name, blurb, make });
const links = (items: string[], o: Parameters<typeof link>[1] = {}, active = -1): Node => stack('Links', 'row', items.map((t, i) => link(t, { ...o, active: i === active })), { w: 'auto', gap: 28, wrap: true, items: 'center' } as St);
/** A navbar with the brand, a link group and a right group. On phones the links and actions fold into a hamburger menu. */
const bar = (name: string, mid: Node[], right: Node[], st: Partial<St> = {}, dark = false): Node => {
  const key = uid('nav');
  const ink = dark ? '#ffffff' : '#111827';
  return pinRow(scope(name, 'row', [brand(dark), hamburger(key, { mobileOnly: true }, 'menu', 'Open menu', ink, dark ? 'rgba(255,255,255,0.1)' : '#f3f4f6'),
    panel('Menu', [...mid, ...right], { key, mobile: true }, { w: 'fill', gap: 20, justify: 'between', items: 'center', wrap: true } as St, 'row')], { ...NAV_BAR, ...st } as St));
};
const NAV: KitItem[] = [
  N('Navbars', 'Navbar, links in the middle', 'Brand left, links centred, one button right.', () => bar('Navbar centred links', [stack('Mid', 'row', [links(['Product', 'Pricing', 'Docs', 'Blog'])], { w: 'fill', justify: 'center' } as St)], [textBtn('Sign in', 'Sign in', BRAND, { padY: 9, padX: 18 } as St)])),
  N('Navbars', 'Navbar, dark', 'A dark bar with light links and a white button.', () => bar('Navbar dark', [links(['Product', 'Pricing', 'Docs'], { color: '#d1d5db' })], [textBtn('Get started', 'Get started', OUTLINE, { padY: 9, padX: 18 } as St)], { fill: '#0b1020', stroke: '#0b1020' }, true)),
  N('Navbars', 'Navbar with search', 'Links plus a search field and a sign-in link.', () => bar('Navbar search', [links(['Home', 'Explore', 'Saved']), stack('Search', 'row', [iconNode('search', 16, '#9ca3af'), label('Search', 14, 400, '#9ca3af')], { w: 220, gap: 8, padX: 14, padY: 9, radius: 999, fill: '#f3f4f6', items: 'center' } as St)], [link('Sign in', { weight: 600, color: '#111827' })])),
  N('Navbars', 'Navbar on a gradient', 'White links on a colourful bar.', () => bar('Navbar gradient', [links(['Features', 'Pricing', 'About'], { color: '#e0e7ff' })], [textBtn('Try free', 'Try free', OUTLINE, { padY: 9, padX: 18 } as St)], { fill: 'linear-gradient(90deg,#4f46e5,#7c3aed)', stroke: '#4f46e5' }, true)),
  N('Navbars', 'Navbar with active underline', 'The current page has a coloured line under it.', () => bar('Navbar underline', [stack('Links', 'row', ['Overview', 'Projects', 'Team', 'Reports'].map((t, i) => link(t, { active: i === 1, st: { padY: 8, ...(i === 1 ? { borderB: 2, stroke: ACC } : {}) } as St })), { w: 'auto', gap: 28, wrap: true } as St)], [textBtn('New project', 'New project', BRAND, { padY: 9, padX: 18 } as St)])),
  N('Navbars', 'Navbar with account', 'An app bar with a bell, a plus button and the user avatar.', () => bar('Navbar account', [links(['Dashboard', 'Customers', 'Reports'], {}, 0)], [stack('Tools', 'row', [iconNode('bell', 20, '#4b5563'), textBtn('New', 'New', SOFT, { padY: 8, padX: 14 } as St), circle(36)], { w: 'auto', gap: 14, items: 'center' } as St)])),
  N('Navbars', 'Navbar with announcement bar', 'A slim promo strip above a normal navbar.', () => stack('Navbar with promo', 'column', [pinRow(stack('Promo', 'row', [label('New: templates are here.', 13, 600, '#ffffff'), link('See what is new →', { color: '#c7d2fe', size: 13, weight: 700 })], { w: 'fill', gap: 10, justify: 'center', padY: 9, fill: ACC, wrap: true } as St)), bar('Navbar', [links(['Product', 'Pricing', 'Docs'])], [textBtn('Sign in', 'Sign in', DARK, { padY: 9, padX: 18 } as St)])], { w: 'fill', gap: 0 } as St)),
  N('Navbars', 'Two-tier navbar', 'Small utility links on top, the main menu below.', () => stack('Navbar two-tier', 'column', [pinRow(stack('Utility', 'row', [label('Free shipping over $50', 12, 500, '#6b7280'), stack('Utility links', 'row', [link('Help', { size: 12 }), link('Track order', { size: 12 }), link('EN', { size: 12 })], { w: 'auto', gap: 16 } as St)], { w: 'fill', justify: 'between', padX: 24, padY: 8, fill: '#f9fafb', borderB: 1, stroke: '#e5e7eb', wrap: true } as St)), bar('Main', [links(['Women', 'Men', 'Kids', 'Sale'])], [stack('Icons', 'row', [iconNode('search', 20, '#111827'), iconNode('heart', 20, '#111827'), iconNode('card', 20, '#111827')], { w: 'auto', gap: 16 } as St)])], { w: 'fill', gap: 0 } as St)),
];

// ---------------------------------------------------------------- menus
const trigger = (text: string, key: string, look: 'solid' | 'ghost' | 'dark' = 'ghost'): Node => plainButton(text, { role: 'toggle', key }, look === 'solid' ? { fill: ACC, color: '#ffffff', radius: 10 } : look === 'dark' ? { fill: '#111827', color: '#ffffff', radius: 10 } : { fill: 'transparent', color: '#374151', stroke: '#d1d5db', strokeWidth: 1, radius: 10 });
const dd = (name: string, trig: (k: string) => Node, body: Node[], st: Partial<St> = {}): Node => { const k = uid('dd'); return scope(name, 'column', [trig(k), panel(`${name} list`, body, { key: k, dismiss: true }, { w: 240, gap: 2, pad: 8, radius: 14, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'lg', position: 'absolute', top: 52, left: 0, ...st } as St)], { w: 'auto', position: 'relative', gap: 0 } as St); };
const iconItem = (ic: string, t: string, color = '#374151'): Node => stack(t, 'row', [iconNode(ic as never, 18, color), label(t, 14, 500, color)], { w: 'fill', gap: 12, padX: 12, padY: 9, radius: 8, items: 'center' } as St);
const rule = (): Node => stack('Divider', 'row', [], { w: 'fill', h: 1, minH: 1, grow: 0, fill: '#e5e7eb', marginY: 4 } as St);
const MENUS: KitItem[] = [
  N('Menus', 'Account menu with icons', 'A button that opens a list with an icon on each row.', () => dd('Account menu', k => trigger('Account', k), [iconItem('user', 'Profile'), iconItem('card', 'Billing'), iconItem('home', 'Workspace'), rule(), iconItem('close', 'Sign out', '#dc2626')])),
  N('Menus', 'Menu with user header', 'Name and email at the top, then actions.', () => dd('User menu', k => stack('Avatar button', 'row', [circle(40)], { w: 'auto' } as St, { behavior: { role: 'toggle', key: k }, tag: 'button', attrs: { type: 'button', 'aria-label': 'Account' } }), [stack('Header', 'row', [circle(36), stack('Text', 'column', [label('Ada Lovelace', 14, 700), hint('ada@brand.com')], { w: 'auto', gap: 0 } as St)], { w: 'fill', gap: 10, pad: 10 } as St), rule(), linkItem('Your profile'), linkItem('Settings'), linkItem('Sign out')], { w: 260 })),
  N('Menus', 'Mega menu, three columns', 'A wide panel with grouped links and a featured card.', () => { const col = (t: string, l: string[]) => stack(t, 'column', [label(t, 12, 700, '#6b7280'), ...l.map(x => linkItem(x))], { w: 'fill', grow: 1, gap: 2 } as St); return dd('Mega menu', k => trigger('Products', k), [stack('Columns', 'row', [col('BUILD', ['Editor', 'Templates', 'Components']), col('GROW', ['Analytics', 'SEO', 'Forms']), stack('Featured', 'column', [label('New', 12, 700, ACC), label('Template packs', 16, 700), hint('Pages you can launch today.')], { w: 'fill', grow: 1, gap: 4, pad: 14, radius: 12, fill: '#eef2ff' } as St)], { w: 'fill', gap: 16, wrap: true } as St)], { w: 560, maxW: 560, pad: 16 }); }),
  N('Menus', 'Select-style menu', 'A picker with a tick beside the chosen option.', () => dd('Select menu', k => trigger('Sort: Newest', k), ['Newest', 'Oldest', 'Most popular'].map((t, i) => stack(t, 'row', [label(t, 14, i === 0 ? 700 : 500), ...(i === 0 ? [iconNode('check', 16, ACC)] : [])], { w: 'fill', justify: 'between', padX: 12, padY: 9, radius: 8, items: 'center', fill: i === 0 ? '#eef2ff' : 'transparent' } as St)), { w: 200 })),
  N('Menus', 'Actions menu with dividers', 'A "More" menu with groups of actions and a red delete.', () => dd('Actions menu', k => plainButton('More ▾', { role: 'toggle', key: k }, { fill: 'transparent', color: '#374151', stroke: '#d1d5db', strokeWidth: 1, radius: 10 }), [linkItem('Edit'), linkItem('Duplicate'), linkItem('Move to…'), rule(), linkItem('Archive'), (() => { const d = linkItem('Delete'); d.style = { ...d.style, color: '#dc2626' } as St; return d; })()], { w: 200 })),
  N('Menus', 'Notifications dropdown', 'A bell that opens a short list of updates.', () => dd('Notifications', k => stack('Bell', 'row', [iconNode('bell', 22, '#374151')], { w: 44, h: 44, minH: 44, radius: 10, justify: 'center', items: 'center' } as St, { behavior: { role: 'toggle', key: k }, tag: 'button', attrs: { type: 'button', 'aria-label': 'Notifications' } }), [label('Notifications', 14, 700, '#111827', ) , ...['Ada commented on Roadmap', 'Invoice 214 was paid', 'Weekly report is ready'].map(t => stack(t, 'row', [stack('Dot', 'row', [], { w: 8, h: 8, minH: 8, radius: 999, fill: ACC, grow: 0 } as St), label(t, 14, 500, '#374151')], { w: 'fill', gap: 10, padX: 12, padY: 10, radius: 8, items: 'center' } as St))], { w: 300, left: -240 })),
  N('Menus', 'Language picker', 'Choose a language from a short list.', () => dd('Language', k => trigger('English', k), ['English', 'Français', 'Yorùbá', 'Hausa'].map(t => linkItem(t)), { w: 180 })),
  N('Menus', 'Split button with menu', 'A main action beside a small arrow that opens more.', () => { const k = uid('split'); return scope('Split button', 'column', [stack('Buttons', 'row', [textBtn('Save', 'Save', BRAND, { padY: 10, padX: 18, radius: 10 } as St), plainButton('▾', { role: 'toggle', key: k }, { fill: '#4338ca', color: '#ffffff', radius: 10, padX: 12 })], { w: 'auto', gap: 2 } as St), panel('Split list', [linkItem('Save as draft'), linkItem('Save and publish'), linkItem('Save as template')], { key: k, dismiss: true }, { w: 220, gap: 2, pad: 8, radius: 14, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'lg', position: 'absolute', top: 52, left: 0 } as St)], { w: 'auto', position: 'relative', gap: 0 } as St); }),
];

// ---------------------------------------------------------------- tabs
const TABS: [string, string][] = [['overview', 'Overview'], ['activity', 'Activity'], ['settings', 'Settings']];
const BODY: Record<string, string> = { overview: 'A summary of the most important things.', activity: 'Recent changes show up here.', settings: 'Adjust how this works for you.' };
const tabBtn = (t: string, key: string, group: string, st: St = {}, ic?: string, count?: string): Node => {
  const b = plainButton(t, { role: 'tab', key, group }, { fill: 'transparent', color: '#6b7280', radius: 0, padX: 16, padY: 10, fontWeight: 600, ...st } as St);
  if (ic || count) b.children = [...(ic ? [iconNode(ic as never, 16, 'currentColor')] : []), ...(b.children || []), ...(count ? [(() => { const c = label(count, 11, 700, '#4b5563'); c.style = { ...c.style, padX: 7, padY: 1, radius: 999, fill: '#e5e7eb' } as St; return c; })()] : [])];
  if (ic || count) b.style = { ...b.style, dir: 'row', layout: 'flex', gap: 8, items: 'center' } as St;
  return b;
};
const tabs = (name: string, id: string, o: { dir?: 'row' | 'column'; barSt?: St; tabSt?: St; icons?: string[]; counts?: string[]; side?: boolean } = {}): Node => {
  const g = uid('tabs');
  const bar = ui(stack('Tab bar', o.side ? 'column' : 'row', TABS.map(([k, t], i) => tabBtn(t, `${g}-${k}`, g, o.tabSt, o.icons?.[i], o.counts?.[i])), { w: o.side ? 180 : 'auto', gap: 4, ...o.barSt } as St), id);
  const panes = TABS.map(([k, t], i) => panel(`${t} panel`, [makeHeading(0, 0, t, 20), label(BODY[k], 15, 400, '#6b7280')], { key: `${g}-${k}`, group: g, initial: i === 0 ? 'open' : 'closed' }, { gap: 6, pad: 20, w: 'fill', grow: 1 } as St));
  return scope(name, o.side ? 'row' : 'column', o.side ? [bar, stack('Panels', 'column', panes, { w: 'fill', grow: 1 } as St)] : [bar, ...panes], { gap: 8, w: 'fill', maxW: 560 } as St);
};
const TB: KitItem[] = [
  N('Tabs', 'Tabs, underline', 'A line under the open tab. The classic.', () => tabs('Tabs underline', 'tb-line', { barSt: { borderB: 1, stroke: '#e5e7eb', gap: 0 } })),
  N('Tabs', 'Tabs, filled pills', 'Round tabs; the open one fills with colour.', () => tabs('Tabs pills', 'tb-pill', { tabSt: { radius: 999 } })),
  N('Tabs', 'Tabs, soft pills', 'The open tab gets a soft tinted background.', () => tabs('Tabs soft', 'tb-soft', { tabSt: { radius: 10 } })),
  N('Tabs', 'Tabs, segmented', 'Tabs inside a grey pill; the open one lifts to white.', () => tabs('Tabs segmented', 'tb-seg', { tabSt: { radius: 9 }, barSt: { pad: 4, radius: 12, fill: '#f3f4f6', gap: 2 } })),
  N('Tabs', 'Tabs, dark', 'Black tabs for a bold look.', () => tabs('Tabs dark', 'tb-dark', { tabSt: { radius: 10, stroke: '#e5e7eb', strokeWidth: 1 } })),
  N('Tabs', 'Tabs with icons', 'An icon beside each label with a short underline.', () => tabs('Tabs icons', 'tb-bar', { icons: ['home', 'bell', 'user'], barSt: { borderB: 1, stroke: '#e5e7eb', gap: 0 } })),
  N('Tabs', 'Tabs with counts', 'A small number badge on each tab.', () => tabs('Tabs counts', 'tb-line', { counts: ['12', '48', '3'], barSt: { borderB: 1, stroke: '#e5e7eb', gap: 0 } })),
  N('Tabs', 'Vertical tabs', 'Tabs stacked on the left, content on the right.', () => tabs('Tabs vertical', 'tb-side', { side: true, tabSt: { radius: 8, justify: 'start', w: 'fill' }, barSt: { gap: 2, pad: 6, radius: 12, fill: '#f9fafb' } })),
];

// ---------------------------------------------------------------- breadcrumbs
const crumbs = (name: string, trail: string[], o: { sep?: string | 'chev'; bar?: St; color?: string; current?: string; pill?: boolean } = {}): Node => {
  const kids: Node[] = [];
  trail.forEach((t, i) => {
    const last = i === trail.length - 1;
    const x = last ? label(t, 14, 700, o.current || '#111827') : link(t, { size: 14, color: o.color || '#6b7280' });
    if (o.pill && !last) x.style = { ...x.style, padX: 12, padY: 5, radius: 999, fill: '#f3f4f6' } as St;
    if (o.pill && last) x.style = { ...x.style, padX: 12, padY: 5, radius: 999, fill: '#eef2ff' } as St;
    kids.push(x);
    if (!last) kids.push(o.sep === 'chev' ? iconNode('chevron-down', 14, '#9ca3af') : sep(o.sep || '/'));
  });
  return stack(name, 'row', kids, { w: 'auto', gap: 10, items: 'center', wrap: true, ...o.bar } as St, { tag: 'nav', attrs: { 'aria-label': 'Breadcrumb' } });
};
const TRAIL = ['Home', 'Shop', 'Shoes', 'Runner'];
const BC: KitItem[] = [
  N('Breadcrumbs', 'Breadcrumbs, slashes', 'Plain links separated by slashes.', () => crumbs('Breadcrumbs slash', TRAIL)),
  N('Breadcrumbs', 'Breadcrumbs, arrows', 'Links separated by small arrows.', () => crumbs('Breadcrumbs arrow', TRAIL, { sep: '›' })),
  N('Breadcrumbs', 'Breadcrumbs, with home icon', 'A home icon instead of the first word.', () => { const c = crumbs('Breadcrumbs home', TRAIL.slice(1), { sep: '›' }); c.children = [iconNode('home', 16, '#6b7280'), sep('›'), ...(c.children || [])]; return c; }),
  N('Breadcrumbs', 'Breadcrumbs, pills', 'Each step is a small rounded pill.', () => crumbs('Breadcrumbs pills', TRAIL, { sep: '›', pill: true })),
  N('Breadcrumbs', 'Breadcrumbs, on a grey bar', 'A full-width grey strip with the trail inside.', () => stack('Breadcrumb bar', 'row', [crumbs('Trail', TRAIL, { sep: '›' })], { w: 'fill', padX: 24, padY: 12, fill: '#f3f4f6', radius: 12 } as St)),
  N('Breadcrumbs', 'Breadcrumbs with title', 'The trail above a large page title.', () => stack('Breadcrumbs title', 'column', [crumbs('Trail', ['Home', 'Settings', 'Billing'], { sep: '›' }), makeHeading(0, 0, 'Billing', 30)], { w: 'auto', gap: 8 } as St)),
  N('Breadcrumbs', 'Breadcrumbs, collapsed', 'Long trails shorten to an ellipsis in the middle.', () => crumbs('Breadcrumbs collapsed', ['Home', '…', 'Shoes', 'Runner'], { sep: '›' })),
  N('Breadcrumbs', 'Breadcrumbs with back link', 'A back arrow link followed by the current page.', () => stack('Back crumb', 'row', [stack('Back', 'row', [iconNode('arrow-right', 16, ACC), link('Back to shoes', { color: ACC, weight: 700, size: 14 })], { w: 'auto', gap: 8, items: 'center' } as St), sep('|'), label('Runner', 14, 600)], { w: 'auto', gap: 12, items: 'center', wrap: true } as St)),
];

// ---------------------------------------------------------------- pagination
const pg = (t: string, o: { on?: boolean; round?: boolean; dark?: boolean; w?: number; ghost?: boolean; line?: boolean } = {}): Node => {
  const x = stack(t, 'row', [label(t, 14, o.on ? 700 : 500, o.on ? '#ffffff' : '#374151')], { w: o.w ?? 40, h: 40, minH: 40, grow: 0, justify: 'center', items: 'center', radius: o.round ? 999 : 10, fill: o.on ? (o.dark ? '#111827' : ACC) : o.ghost ? 'transparent' : '#ffffff', ...(o.on || o.ghost || o.line ? {} : { stroke: '#e5e7eb', strokeWidth: 1 }) } as St, { tag: 'a', href: '#', attrs: { 'aria-label': `Page ${t}` } });
  if (!o.on) x.states = { hover: { fill: '#f3f4f6' } } as Node['states']; return x;
};
const pages = (name: string, nums: string[], on: string, o: Parameters<typeof pg>[1] = {}, prev = '‹', next = '›', st: St = {}): Node => stack(name, 'row', [pg(prev, o), ...nums.map(x => pg(x, { ...o, on: x === on })), pg(next, o)], { w: 'auto', gap: 6, items: 'center', wrap: true, ...st } as St, { tag: 'nav', attrs: { 'aria-label': 'Pagination' } });
const PG: KitItem[] = [
  N('Pagination', 'Pagination, squares', 'Rounded square page buttons with the current page filled.', () => pages('Pagination squares', ['1', '2', '3', '…', '9'], '2')),
  N('Pagination', 'Pagination, circles', 'Round page buttons.', () => pages('Pagination circles', ['1', '2', '3', '4', '5'], '3', { round: true })),
  N('Pagination', 'Pagination, dark', 'The current page is black.', () => pages('Pagination dark', ['1', '2', '3', '4'], '1', { dark: true })),
  N('Pagination', 'Pagination, plain numbers', 'No borders, just numbers and a coloured current page.', () => pages('Pagination plain', ['1', '2', '3', '4', '5'], '2', { ghost: true })),
  N('Pagination', 'Previous and next', 'Two big buttons with the page count between.', () => stack('Prev next', 'row', [textBtn('Previous', '← Previous', OUTLINE, { padY: 10, padX: 18 } as St), label('Page 2 of 9', 14, 600, '#6b7280'), textBtn('Next', 'Next →', BRAND, { padY: 10, padX: 18 } as St)], { w: 'auto', gap: 16, items: 'center', wrap: true } as St)),
  N('Pagination', 'Pagination with result count', 'A "Showing 1 to 10" line beside the buttons.', () => stack('Pagination count', 'row', [label('Showing 11 to 20 of 94 results', 14, 400, '#6b7280'), pages('Pages', ['1', '2', '3', '4'], '2')], { w: 'fill', justify: 'between', items: 'center', gap: 16, wrap: true } as St)),
  N('Pagination', 'Load more', 'One button to load the next set, with the count under it.', () => stack('Load more', 'column', [textBtn('Load more', 'Load more', OUTLINE, { padY: 12, padX: 28 } as St), hint('Showing 12 of 48')], { w: 'auto', gap: 8, items: 'center' } as St)),
  N('Pagination', 'Pagination, dots', 'A row of dots for carousels and short sets, the current one longer.', () => stack('Dots', 'row', [0, 1, 2, 3, 4].map(i => stack('Dot', 'row', [], { w: i === 1 ? 28 : 8, h: 8, minH: 8, grow: 0, radius: 999, fill: i === 1 ? ACC : '#d1d5db' } as St)), { w: 'auto', gap: 8, items: 'center' } as St)),
];

// ---------------------------------------------------------------- sidebars
const sItem = (ic: string, t: string, on = false, dark = false, badge?: string): Node => { const c = on ? (dark ? '#ffffff' : ACC) : dark ? '#9ca3af' : '#4b5563'; const kids: Node[] = [iconNode(ic as never, 18, c), label(t, 14, on ? 700 : 500, c)]; if (badge) { const b = label(badge, 11, 700, '#ffffff'); b.style = { ...b.style, padX: 8, padY: 1, radius: 999, fill: ACC } as St; kids[1].style = { ...kids[1].style, w: 'fill', grow: 1 } as St; kids.push(b); } const r = stack(t, 'row', kids, { w: 'fill', gap: 12, padX: 12, padY: 10, radius: 10, items: 'center', fill: on ? (dark ? 'rgba(255,255,255,0.1)' : '#eef2ff') : 'transparent' } as St, { tag: 'a', href: '#' }); r.states = { hover: { fill: dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' } } as Node['states']; return r; };
const ITEMS: [string, string][] = [['home', 'Overview'], ['grid', 'Projects'], ['user', 'Customers'], ['mail', 'Inbox'], ['bell', 'Alerts']];
const side = (name: string, o: { dark?: boolean; w?: number; kids?: Node[]; st?: St; head?: boolean; badge?: boolean } = {}): Node => stack(name, 'column', [brand(!!o.dark), ...(o.kids || ITEMS.map(([ic, t], i) => sItem(ic, t, i === 0, o.dark, o.badge && t === 'Inbox' ? '4' : undefined)))], { w: o.w ?? 240, gap: 6, pad: 18, radius: 16, fill: o.dark ? '#0b1020' : '#ffffff', stroke: o.dark ? '#0b1020' : '#e5e7eb', strokeWidth: 1, items: 'stretch', ...o.st } as St, { tag: 'nav' });
const groupLabel = (t: string, dark = false): Node => label(t, 11, 700, dark ? '#6b7280' : '#9ca3af');
const SB: KitItem[] = [
  N('Sidebars', 'Sidebar, light', 'Brand, five links and the first one highlighted.', () => side('Sidebar light')),
  N('Sidebars', 'Sidebar, dark', 'A dark sidebar with soft highlights.', () => side('Sidebar dark', { dark: true })),
  N('Sidebars', 'Sidebar with badges', 'A count badge beside Inbox.', () => side('Sidebar badges', { badge: true })),
  N('Sidebars', 'Sidebar with groups', 'Links under small group titles.', () => side('Sidebar groups', { kids: [groupLabel('MAIN'), sItem('home', 'Overview', true), sItem('grid', 'Projects'), groupLabel('PEOPLE'), sItem('user', 'Customers'), sItem('mail', 'Inbox'), groupLabel('SETTINGS'), sItem('lock', 'Security')] })),
  N('Sidebars', 'Sidebar with user at the bottom', 'The signed-in person sits at the foot of the sidebar.', () => side('Sidebar user', { st: { minH: 420 }, kids: [...ITEMS.map(([ic, t], i) => sItem(ic, t, i === 1)), stack('Spacer', 'row', [], { w: 'fill', grow: 1, minH: 24 } as St), stack('User', 'row', [circle(36), stack('Text', 'column', [label('Ada Lovelace', 14, 700), hint('Admin')], { w: 'auto', gap: 0 } as St)], { w: 'fill', gap: 10, pad: 10, radius: 12, fill: '#f9fafb', items: 'center' } as St)] })),
  N('Sidebars', 'Icon rail', 'A narrow bar of icons only. Good for tools and apps.', () => stack('Icon rail', 'column', [...['home', 'grid', 'user', 'mail', 'bell'].map((ic, i) => stack(ic, 'row', [iconNode(ic as never, 20, i === 0 ? '#ffffff' : '#9ca3af')], { w: 44, h: 44, minH: 44, radius: 12, justify: 'center', items: 'center', fill: i === 0 ? ACC : 'transparent' } as St, { tag: 'a', href: '#', attrs: { 'aria-label': ic } }))], { w: 68, gap: 8, pad: 12, radius: 20, fill: '#0b1020', items: 'center' } as St, { tag: 'nav' })),
  N('Sidebars', 'Sidebar with search and button', 'A search field on top and a primary button at the bottom.', () => side('Sidebar search', { kids: [stack('Search', 'row', [iconNode('search', 16, '#9ca3af'), label('Search', 14, 400, '#9ca3af')], { w: 'fill', gap: 8, padX: 12, padY: 9, radius: 10, fill: '#f3f4f6', items: 'center' } as St), ...ITEMS.slice(0, 4).map(([ic, t], i) => sItem(ic, t, i === 0)), textBtn('New project', 'New project', BRAND, { padY: 11, w: 'fill', self: 'auto', marginT: 12 } as St)] })),
  N('Sidebars', 'Mobile drawer sidebar', 'A menu button that opens the sidebar from the left, with a dark backdrop.', () => { const k = uid('side'); return pinRow(scope('Sidebar drawer', 'row', [hamburger(k, {}, 'menu', 'Open menu'), panel('Drawer overlay', [stack('Drawer', 'column', [stack('Head', 'row', [brand(), hamburger(k, {}, 'close', 'Close menu')], { w: 'fill', justify: 'between', items: 'center' } as St), ...ITEMS.map(([ic, t], i) => sItem(ic, t, i === 0))], { w: 280, h: 'fill', gap: 6, pad: 20, fill: '#ffffff', shadow: 'lg' } as St)], { key: k, modal: true, dismiss: true }, { position: 'fixed', inset: 0, justify: 'start', items: 'stretch', w: 'fill', h: 'fill', fill: 'rgba(17,24,39,0.45)' } as St, 'row')], { gap: 12, w: 'auto', items: 'center' } as St)); }),
];
export const navItems: KitItem[] = [...NAV, ...MENUS, ...TB, ...BC, ...PG, ...SB];
