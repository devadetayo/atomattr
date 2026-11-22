/**
 * Library: image cards, image pills and social links.
 *
 * Photos are the shared Unsplash placeholders (STOCK in kit.ts) used as background images, so they can be swapped in the
 * Style panel, and are added to the project's assets the first time a block that uses them is inserted.
 * Hover effects that node states cannot express (zoom, reveal, grayscale, tilt) use `data-ui` rules from document/ui-css-media.ts.
 */
import type { Node } from '../document/types';
import { makeInput, mk } from '../document/factory';
import { stack, label, hint, iconButton, btnText, textBtn, BRAND, DARK, OUTLINE, STOCK, type KitItem } from './kit';

type St = NonNullable<Node['style']>;
const ACC = '#4f46e5';

// ------------------------------------------------------------------ small building blocks
const D = {
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  comment: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  play: 'M6 4l14 8-14 8z',
  heart: 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.4 4.5c2 0 3.6 1.1 4.6 2.7h2c1-1.6 2.6-2.7 4.6-2.7 3.7 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3a1 1 0 0 0 .7 1.7H17M17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  eye: 'M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  arrowUpRight: 'M7 17L17 7M7 7h10v10',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  close: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  bed: 'M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9',
  bath: 'M9 6a3 3 0 0 1 6 0M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 20l-1 2M18 20l1 2',
  ruler: 'M21.3 15.3l-6-6a1 1 0 0 0-1.4 0L2.7 20.5a1 1 0 0 0 0 1.4l.4.4a1 1 0 0 0 1.4 0L15.7 11M7 16l2 2M10 13l2 2M13 10l2 2',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  verified: 'M22 12l-2.4 2.8.3 3.7-3.6.8-1.9 3.2L12 21.1 8.6 22.5 6.7 19.3l-3.6-.8.3-3.7L1 12l2.4-2.8-.3-3.7 3.6-.8 1.9-3.2L12 2.9l3.4-1.4 1.9 3.2 3.6.8-.3 3.7zM9 12l2 2 4-4',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 0 1-3.4 0',
  calendar: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  twitter: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
  instagram: 'M2 6a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  youtube: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17zM10 15l5-3-5-3z',
  github: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
  whatsapp: 'M3 21l1.65-3.8A9 9 0 1 1 8 20.4L3 21zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.2-2-1-.9.7a3 3 0 0 1-1.6-1.6l.7-.9-1-2z',
  tiktok: 'M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5',
  dribbble: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM19.13 5.09C15.22 9.14 10 10.44 2.25 10.94M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32M8.56 2.75c4.37 6 6 9.42 8 17.72',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
};
type Glyph = keyof typeof D;
const ic = (g: Glyph, size = 18, color = '#111827', o: { sw?: number; fill?: string } = {}): Node =>
  mk('path', `${g} icon`, { mode: 'flow', w: size, h: size, grow: 0, stroke: color, strokeWidth: o.sw ?? 2, ...(o.fill ? { fill: o.fill } : {}) } as St, { svgD: D[g], vw: 24, vh: 24, pts: [], closed: false });

const img = (key: string): St => ({ fillImg: STOCK[key].id, bgSize: 'cover', bgPos: 'center', bgRepeat: 'no-repeat' } as St);
/** A photo box. Give it a width and an aspect ratio, or a fixed height; children sit on top of the photo. */
const photo = (name: string, key: string, st: St = {}, kids: Node[] = [], extra: Partial<Node> = {}): Node => {
  const n = stack(name, 'column', kids, { w: 'fill', h: 'auto', aspectRatio: '16 / 10', grow: 0, items: 'stretch', gap: 0, overflow: 'hidden', ...img(key), ...st } as St, { attrs: { role: 'img', 'aria-label': name }, ...extra });
  if (typeof n.style.h === 'number' && n.style.minH === undefined) n.style = { ...n.style, minH: n.style.h, aspectRatio: undefined } as St;
  return n;
};
const avatar = (key: string, size = 40, st: St = {}): Node => photo('Avatar', key, { w: size, h: size, minW: size, radius: 999, aspectRatio: undefined, ...st } as St);
const t = (text: string, size = 15, weight = 500, color = '#111827'): Node => label(text, size, weight, color);
const para = (text: string, size = 14, color = '#6b7280'): Node => { const n = label(text, size, 400, color); n.style = { ...n.style, lineHeight: 1.55, w: 'fill' } as St; return n; };
/** Rows that must stay one horizontal line at every width (icon + label, avatar + name). */
const hrow = (name: string, kids: Node[], st: St = {}): Node => stack(name, 'row', kids, { w: 'auto', gap: 10, items: 'center', ...st } as St, { bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } });
const col = (name: string, kids: Node[], st: St = {}): Node => stack(name, 'column', kids, { w: 'fill', gap: 6, ...st } as St);
const badge = (text: string, bg = '#ffffff', color = '#111827', st: St = {}): Node => { const n = label(text, 12, 700, color); n.style = { ...n.style, padX: 10, padY: 4, radius: 999, fill: bg, self: 'start', ...st } as St; return n; };
const stars = (n = 5, size = 14): Node => hrow('Rating', Array.from({ length: n }, () => ic('star', size, '#f59e0b', { sw: 1.5, fill: '#f59e0b' })), { gap: 2 });
const dot = (color = '#d1d5db'): Node => mk('container', 'Dot', { mode: 'flow', w: 3, h: 3, grow: 0, radius: 999, fill: color } as St);
const meta = (...parts: string[]): Node => hrow('Meta', parts.flatMap((p, i) => i ? [dot(), t(p, 13, 400, '#6b7280')] : [t(p, 13, 400, '#6b7280')]), { gap: 8 });
/** A fixed-width block that goes full width on phones. */
const fluid = (n: Node, w: number): Node => ({ ...n, style: { ...n.style, w, grow: 0 } as St, bp: { ...(n.bp || {}), mobile: { ...(n.bp?.mobile || {}), w: 'fill' } } });
const shell = (name: string, kids: Node[], w = 340, st: St = {}): Node => fluid(stack(name, 'column', kids, { gap: 0, radius: 16, overflow: 'hidden', fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, items: 'stretch', ...st } as St), w);
const body = (kids: Node[], gap = 10, st: St = {}): Node => stack('Body', 'column', kids, { w: 'fill', gap, pad: 18, ...st } as St);
const lift: Node['states'] = { hover: { translateY: -4, shadowCss: '0 20px 32px -14px rgba(15,23,42,0.3)' } } as Node['states'];
const withStates = (n: Node, s: Node['states']): Node => ({ ...n, states: { ...(n.states || {}), ...s } });
const withUi = (n: Node, id: string, attrs: Record<string, string | boolean> = {}): Node => ({ ...n, attrs: { ...(n.attrs || {}), 'data-ui': id, ...attrs } });
const part = (n: Node, p: string): Node => ({ ...n, attrs: { ...(n.attrs || {}), 'data-p': p } });
/** Dark gradient behind caption text that sits on a photo. */
const scrim = (kids: Node[], st: St = {}): Node => stack('Caption', 'column', kids, { w: 'fill', gap: 6, pad: 18, padT: 64, fill: 'linear-gradient(to top, rgba(8,10,20,0.85), rgba(8,10,20,0))', ...st } as St);
const link = (text: string, color = ACC): Node => { const n = label(text, 14, 600, color); n.href = '#'; return n; };
const roundBtn = (g: Glyph, name: string, st: St = {}, color = '#111827', fill = '#ffffff'): Node =>
  iconButton(name, [ic(g, 18, color)], { fill, hover: '#f3f4f6', color }, { w: 40, h: 40, padX: 0, padY: 0, radius: 999, justify: 'center', items: 'center', ...st } as St, { 'aria-label': name });
const cta = (text: string, look = BRAND, st: St = {}): Node => textBtn(text, text, look, { padX: 16, padY: 10, justify: 'center', items: 'center', ...st } as St);
/** Trailing button in a pill: centred on the pill's height, never squeezed. */
const mid = (n: Node): Node => ({ ...n, style: { ...n.style, self: 'center', grow: 0 } as St });
const grid = (name: string, kids: Node[], gap = 16): Node => stack(name, 'row', kids.map(k => ({ ...k, style: { ...k.style, w: 'auto', grow: 1, minW: 240 } as St, bp: { ...(k.bp || {}), mobile: { ...(k.bp?.mobile || {}), w: 'fill' } } })), { w: 'fill', gap, wrap: true, items: 'stretch' } as St);

/** A real CSS grid: every cell takes the full width of its column. */
const cgrid = (name: string, kids: Node[], cols: number, tablet = cols, mobile = cols, gap = 16): Node =>
  mk('container', name, { mode: 'flow', w: 'fill', h: 'auto', layout: 'grid', cols, gap, items: 'stretch' } as St, { children: kids.map(k => ({ ...k, style: { ...k.style, w: 'fill', grow: 0 } as St })), bp: { tablet: { cols: tablet }, mobile: { cols: mobile } } });
const pol = (key: string, caption: string, tilt: string): Node => withUi(stack('Polaroid', 'column', [photo('Photo', key, { aspectRatio: '1 / 1', radius: 2 }), t(caption, 15, 600, '#374151')], { gap: 12, pad: 12, padB: 18, fill: '#ffffff', shadow: 'lg', items: 'stretch', radius: 4 } as St), tilt);
/** Side room so a card never touches the edge of whatever it sits in. */
const framed = (n: Node): Node => stack('Frame', 'column', [n], { w: 'fill', padX: 20, padY: 12, items: 'center' } as St);

type Item = KitItem & { section: string };
const I = (section: string, name: string, blurb: string, make: () => Node): Item => ({ section, name, blurb, make });

// ------------------------------------------------------------------ image cards
const blogAuthor = (key: string, name: string, date: string): Node => hrow('Author', [avatar(key, 32), col('Name', [t(name, 13, 600), t(date, 12, 400, '#9ca3af')], { gap: 0, w: 'auto' })], { gap: 10 });

const IMAGE_CARDS: Item[] = [
  // ---- blog and articles
  I('Blog and articles', 'Blog card, classic', 'Photo on top, a tag, a title, two lines of summary and the author with a date.',
    () => withStates(shell('Blog card', [photo('Article photo', 'workspace'), body([badge('Design', '#eef2ff', ACC), t('How small teams ship a redesign in two weeks', 19, 700), para('A practical look at scoping, feedback loops and the small decisions that keep a project moving.'), blogAuthor('portraitA', 'Amara Okoye', 'Nov 6 · 5 min read')], 12)]), lift)),
  I('Blog and articles', 'Blog card, minimal', 'Just a photo, a date, a title and a "Read more" link. Calm and quick to scan.',
    () => fluid(col('Minimal blog card', [photo('Article photo', 'office', { radius: 14 }), t('NOVEMBER 6, 2026', 12, 700, '#9ca3af'), t('The quiet case for fewer features', 20, 700), link('Read more →')], { gap: 10 }), 340)),
  I('Blog and articles', 'Blog card, horizontal', 'Photo on the left, text on the right. The photo moves on top on phones.',
    () => { const p = photo('Article photo', 'laptop' in STOCK ? 'laptop' : 'code', { w: 220, aspectRatio: undefined, h: 'auto', minH: 190, grow: 0 }); p.bp = { mobile: { w: 'fill', minH: 190 } }; return fluid(stack('Horizontal blog card', 'row', [p, body([badge('Engineering', '#ecfdf5', '#047857'), t('Shipping a component library without the pain', 18, 700), meta('Chidi Eze', '4 min read')], 10, { grow: 1 })], { gap: 0, radius: 16, overflow: 'hidden', fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, items: 'stretch' } as St), 560); }),
  I('Blog and articles', 'Featured article', 'A large photo with the title laid over it on a dark fade. Lead with it on a blog index.',
    () => fluid(photo('Featured article', 'mountains', { radius: 20, aspectRatio: undefined, h: 420, justify: 'end' }, [scrim([badge('Featured', '#ffffff', '#111827'), t('The road to a calmer product roadmap', 28, 800, '#ffffff'), t('By Amara Okoye · 8 min read', 13, 400, '#e5e7eb')], { padX: 28, padB: 28 })]), 620)),
  I('Blog and articles', 'Latest posts list', 'Three small posts with a square thumbnail each. Good for a sidebar or footer.',
    () => fluid(col('Latest posts', [t('Latest posts', 16, 700), ...[['woods', 'Notes on slow design', 'Oct 28'], ['lake', 'Why we write everything down', 'Oct 21'], ['night', 'A year of weekly releases', 'Oct 14']].map(([k, title, date]) => hrow(title, [photo('Thumbnail', k, { w: 72, h: 72, radius: 12, aspectRatio: undefined }), col('Text', [t(title, 15, 600), t(date, 12, 400, '#9ca3af')], { gap: 4, w: 'auto', grow: 1 })], { w: 'fill', gap: 14 }))], { gap: 16 }), 360)),
  I('Blog and articles', 'Blog card with badge on photo', 'The category sits on the photo, with reading time and a bookmark at the bottom.',
    () => withStates(shell('Blog card, badge', [photo('Article photo', 'flatlay', { aspectRatio: '4 / 3' }, [stack('Badge row', 'row', [badge('Recipes', '#ffffff', '#111827')], { w: 'fill', pad: 14 } as St)]), body([t('Sunday brunch you can make in 20 minutes', 18, 700), hrow('Footer', [hrow('Time', [ic('clock', 14, '#6b7280'), t('20 min', 13, 400, '#6b7280')], { gap: 6 }), roundBtn('bookmark', 'Save', { w: 34, h: 34, stroke: '#e5e7eb', strokeWidth: 1 })], { w: 'fill', justify: 'between' })], 12)]), lift)),

  // ---- products
  I('Products', 'Product card', 'A square photo, name, price and an Add to cart button.',
    () => withStates(shell('Product card', [photo('Product photo', 'watch', { aspectRatio: '1 / 1', radius: 0 }), body([t('Classic steel watch', 17, 700), hrow('Price row', [t('$189', 18, 800), cta('Add to cart', DARK, { padY: 9, self: 'auto' })], { w: 'fill', justify: 'between' })], 10)], 300), lift)),
  I('Products', 'Product card with sale badge', 'A Sale tag on the photo, the old and new price, and star rating.',
    () => withStates(shell('Product card, sale', [photo('Product photo', 'sneaker', { aspectRatio: '1 / 1', radius: 0, pad: 12 } as St, [badge('-30%', '#ef4444', '#ffffff')]), body([t('Runner sneaker', 17, 700), hrow('Rating row', [stars(5, 13), t('(212)', 12, 400, '#9ca3af')], { gap: 6 }), hrow('Prices', [t('$84', 19, 800), t('$120', 14, 400, '#9ca3af')], { gap: 8 })], 8)], 300), lift)),
  I('Products', 'Product card, quick add on hover', 'A Quick add button slides up over the photo when you point at the card.',
    () => fluid(withUi(stack('Product card, quick add', 'column', [photo('Product photo', 'headphones', { aspectRatio: '1 / 1', radius: 16, justify: 'end', pad: 12 } as St, [part(cta('Quick add', { fill: '#ffffff', hover: '#f3f4f6', color: '#111827' }, { w: 'fill', self: 'auto', justify: 'center' } as St), 'quick')]), col('Info', [t('Studio headphones', 16, 700), t('$249', 15, 500, '#6b7280')], { gap: 2 })], { gap: 12, w: 300 } as St), 'im-quick'), 300)),
  I('Products', 'Product card, dark', 'A dark card with a lit photo and a bright price. For tech and gaming.',
    () => withStates(shell('Product card, dark', [photo('Product photo', 'headphones', { aspectRatio: '1 / 1', radius: 0 }), body([t('Pulse X1', 18, 700, '#ffffff'), hrow('Row', [t('$299', 20, 800, '#a5b4fc'), cta('Buy now', BRAND, { padY: 9, self: 'auto' })], { w: 'fill', justify: 'between' })], 10)], 300, { fill: '#0f172a', stroke: '#1e293b' }), { hover: { translateY: -4, shadowCss: '0 20px 40px -12px rgba(99,102,241,0.45)' } } as Node['states'])),
  I('Products', 'Product card with wishlist and swatches', 'A heart on the photo to save it, colour swatches and a price.',
    () => withStates(shell('Product card, swatches', [photo('Product photo', 'sneaker', { aspectRatio: '1 / 1', radius: 0, items: 'end', pad: 12 } as St, [roundBtn('heart', 'Save to wishlist', { w: 38, h: 38 })]), body([t('Everyday trainer', 17, 700), hrow('Swatches', ['#111827', '#ef4444', '#2563eb', '#e5e7eb'].map(c => mk('container', 'Swatch', { mode: 'flow', w: 18, h: 18, grow: 0, radius: 999, fill: c, stroke: '#d1d5db', strokeWidth: 1 } as St)), { gap: 6 }), t('$96', 18, 800)], 10)], 300), lift)),

  // ---- places and property
  I('Places and property', 'Destination card', 'A tall photo with the place name, country and rating on a dark fade.',
    () => fluid(photo('Destination card', 'beach', { radius: 20, aspectRatio: undefined, h: 380, justify: 'end' }, [scrim([hrow('Rating', [ic('star', 14, '#fbbf24', { sw: 1.5, fill: '#fbbf24' }), t('4.9', 13, 700, '#ffffff')], { gap: 4 }), t('Zanzibar', 26, 800, '#ffffff'), hrow('Country', [ic('pin', 14, '#e5e7eb'), t('Tanzania', 13, 400, '#e5e7eb')], { gap: 4 })], { padX: 22, padB: 22 })]), 300)),
  I('Places and property', 'Stay card', 'A listing: photo, title, location, rating and price per night.',
    () => withStates(shell('Stay card', [photo('Stay photo', 'interior', { aspectRatio: '4 / 3', radius: 0 }, [stack('Top', 'row', [badge('Superhost'), roundBtn('heart', 'Save', { w: 34, h: 34 })], { w: 'fill', justify: 'between', pad: 12 } as St)]), body([hrow('Title row', [t('Sunlit loft in Lekki', 16, 700), hrow('Score', [ic('star', 13, '#f59e0b', { sw: 1.5, fill: '#f59e0b' }), t('4.92', 13, 600)], { gap: 4 })], { w: 'fill', justify: 'between' }), t('2 guests · 1 bedroom', 13, 400, '#6b7280'), hrow('Price', [t('$68', 17, 800), t('night', 13, 400, '#6b7280')], { gap: 4 })], 6)], 320), lift)),
  I('Places and property', 'Property card', 'Price on the photo, then address with bedrooms, bathrooms and floor area.',
    () => withStates(shell('Property card', [photo('Property photo', 'house', { aspectRatio: '4 / 3', radius: 0, justify: 'end', pad: 14 } as St, [badge('$420,000', '#111827', '#ffffff', { fontSize: 15 } as St)]), body([t('14 Palm Avenue, Ikoyi', 17, 700), hrow('Specs', [hrow('Beds', [ic('bed', 16, '#6b7280'), t('4', 14, 600)], { gap: 6 }), hrow('Baths', [ic('bath', 16, '#6b7280'), t('3', 14, 600)], { gap: 6 }), hrow('Area', [ic('ruler', 16, '#6b7280'), t('280 m²', 14, 600)], { gap: 6 })], { gap: 18 }), cta('View details', OUTLINE, { w: 'fill', self: 'auto', justify: 'center' } as St)], 12)], 340), lift)),
  I('Places and property', 'Tall place card with arrow', 'A tall photo with the name at the bottom and a circular arrow button.',
    () => fluid(photo('Place card', 'valley', { radius: 24, aspectRatio: undefined, h: 400, justify: 'end', pad: 16 } as St, [hrow('Caption', [col('Text', [t('Lagos Lagoon', 22, 800, '#ffffff'), t('12 experiences', 13, 400, '#e5e7eb')], { gap: 2, w: 'auto', grow: 1 }), roundBtn('arrowUpRight', 'Open', { w: 44, h: 44 })], { w: 'fill', justify: 'between', padX: 6, padB: 6 })]), 280)),

  // ---- people
  I('People', 'Team member card', 'A portrait, name, role and three social icons.',
    () => withStates(shell('Team card', [photo('Portrait', 'portraitB', { aspectRatio: '1 / 1', radius: 0 }), body([col('Name', [t('Chidi Eze', 18, 700), t('Head of Engineering', 14, 400, '#6b7280')], { gap: 2 }), hrow('Social', [ic('twitter', 18, '#6b7280'), ic('linkedin', 18, '#6b7280'), ic('github', 18, '#6b7280')], { gap: 14 })], 12)], 260), lift)),
  I('People', 'Profile card with cover', 'A cover photo, an avatar overlapping it, name, bio and three counts.',
    () => fluid(stack('Profile card', 'column', [photo('Cover photo', 'lake', { aspectRatio: undefined, h: 120, radius: 0 }), stack('Info', 'column', [avatar('portraitC', 80, { stroke: '#ffffff', strokeWidth: 4, marginT: -52 } as St), col('Name', [t('Amara Okoye', 20, 800), t('Product designer · Lagos', 14, 400, '#6b7280')], { gap: 2 }), hrow('Counts', [['128', 'Posts'], ['4.2k', 'Followers'], ['312', 'Following']].map(([n, l]) => col(l, [t(n, 16, 800), t(l, 12, 400, '#9ca3af')], { gap: 0, w: 'auto' })).flat(), { gap: 24 })], { w: 'fill', gap: 12, padX: 22, padB: 22, items: 'start' } as St)], { gap: 0, radius: 20, overflow: 'hidden', fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, items: 'stretch' } as St), 340)),
  I('People', 'Speaker card', 'A portrait filling the card, with the name and talk on a dark fade.',
    () => fluid(photo('Speaker card', 'portraitD', { radius: 20, aspectRatio: undefined, h: 360, justify: 'end' }, [scrim([t('Dr. Tunde Bello', 20, 800, '#ffffff'), t('Keynote · Day 1, 10:00', 13, 400, '#e5e7eb')], { padX: 20, padB: 20 })]), 280)),
  I('People', 'Testimonial photo card', 'A portrait on the left, a short quote on the right.',
    () => { const p = photo('Portrait', 'portraitE', { w: 150, aspectRatio: undefined, h: 'auto', minH: 190, grow: 0 }); p.bp = { mobile: { w: 'fill', minH: 220 } }; return fluid(stack('Quote photo card', 'row', [p, body([para('“They turned a vague idea into something our customers use every day.”', 16, '#111827'), col('Who', [t('Ngozi Adeyemi', 14, 700), t('Founder, Bloom', 13, 400, '#6b7280')], { gap: 0 })], 14, { grow: 1, justify: 'center' })], { gap: 0, radius: 20, overflow: 'hidden', fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, items: 'stretch' } as St), 520); }),

  // ---- overlay and hover
  I('Overlay and hover', 'Photo card with caption', 'A photo with a title on a soft dark fade. The simplest overlay card.',
    () => fluid(photo('Caption card', 'woods', { radius: 18, aspectRatio: '4 / 5', justify: 'end' }, [scrim([t('Into the woods', 22, 800, '#ffffff'), t('Photo essay · 12 photos', 13, 400, '#e5e7eb')], { padX: 20, padB: 20 })]), 300)),
  I('Overlay and hover', 'Zoom on hover', 'The photo slowly zooms inside its frame when you point at the card.',
    () => fluid(withUi(stack('Zoom card', 'column', [part(photo('Photo', 'night', { aspectRatio: '4 / 3', radius: 0 }), 'img'), body([t('Under the stars', 18, 700), para('A night on the highlands, with no lights for 40 km.')], 6)], { gap: 0, radius: 16, overflow: 'hidden', fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, items: 'stretch' } as St), 'im-zoom'), 340)),
  I('Overlay and hover', 'Reveal on hover', 'A title shows on the photo; a description and button slide up when you point at it.',
    () => fluid(withUi(photo('Reveal card', 'mountains', { radius: 20, aspectRatio: undefined, h: 380, justify: 'end' }, [scrim([t('Mount Kenya', 24, 800, '#ffffff'), part(col('More', [t('A three-day trek with guides, meals and a sunrise summit.', 14, 400, '#e5e7eb'), cta('Book the trek', { fill: '#ffffff', hover: '#f3f4f6', color: '#111827' }, { self: 'start' } as St)], { gap: 12, w: 'fill', padT: 6 }), 'more')], { padX: 22, padB: 22, gap: 8 })]), 'im-reveal'), 320)),
  I('Overlay and hover', 'Colour on hover', 'Starts in black and white and fades to colour when you point at it.',
    () => fluid(withUi(stack('Colour card', 'column', [part(photo('Photo', 'portraitF', { aspectRatio: '3 / 4', radius: 18 }), 'img'), t('Tolu Bakare', 16, 700)], { gap: 10, w: 260 } as St), 'im-gray'), 260)),
  I('Overlay and hover', 'Glass caption card', 'A frosted glass panel floats over the bottom of the photo.',
    () => fluid(photo('Glass card', 'lake', { radius: 24, aspectRatio: undefined, h: 360, justify: 'end', pad: 14 } as St, [stack('Glass', 'column', [t('Lake Bosomtwe', 20, 800, '#ffffff'), t('Quiet shores, 2 hours from Accra.', 13, 400, '#f3f4f6'), hrow('Row', [badge('Ghana', 'rgba(255,255,255,0.25)', '#ffffff'), link('Plan a visit →', '#ffffff')], { w: 'fill', justify: 'between' })], { w: 'fill', gap: 6, pad: 18, radius: 16, fill: 'rgba(255,255,255,0.16)', bgBlur: 14, stroke: 'rgba(255,255,255,0.35)', strokeWidth: 1 } as St)]), 320)),
  I('Overlay and hover', 'Video card', 'A photo with a play button in the middle, a duration and a title.',
    () => fluid(col('Video card', [photo('Video thumbnail', 'code', { radius: 16, justify: 'center', items: 'center' }, [iconButton('Play', [ic('play', 20, '#111827', { fill: '#111827' })], { fill: '#ffffff', hover: '#f3f4f6', color: '#111827' }, { w: 60, h: 60, padX: 0, padY: 0, radius: 999, shadow: 'lg' } as St, { 'aria-label': 'Play video' })]), t('Build a landing page in 15 minutes', 17, 700), meta('Amara Okoye', '14:52')], { gap: 10 }), 360)),

  // ---- layouts and galleries
  I('Layouts and galleries', 'Polaroid wall', 'Three polaroids in a grid, each tilted its own way. They straighten when you point at them.',
    () => cgrid('Polaroid wall', [['beach', 'Summer, 2026', 'im-tilt-l'], ['lake', 'The lake', 'im-tilt-r'], ['woods', 'Into the woods', 'im-tilt-l']].map(([k, c, u]) => pol(k, c, u)), 3, 1, 1, 24)),
  I('Layouts and galleries', 'Polaroid pinboard', 'Six polaroids in a grid, alternately tilted. A memory wall.',
    () => cgrid('Polaroid pinboard', [['mountains', 'Day one'], ['valley', 'The climb'], ['night', 'Camp'], ['beach', 'The coast'], ['lake', 'Still water'], ['woods', 'Last light']].map(([k, c], i) => pol(k, c, i % 2 ? 'im-tilt-r' : 'im-tilt-l')), 3, 2, 2, 22)),
  I('Layouts and galleries', 'Photo strip', 'Eight equal rounded photos in a grid. Two by two on phones.',
    () => cgrid('Photo strip', ['mountains', 'lake', 'woods', 'valley', 'beach', 'night', 'forest', 'building'].map(k => photo('Photo', k, { radius: 16, aspectRatio: '1 / 1' })), 4, 4, 2, 12)),
  I('Layouts and galleries', 'Bento grid', 'One large photo beside a two by two block of smaller ones. A confident gallery layout.',
    () => cgrid('Bento grid', [photo('Large photo', 'valley', { radius: 24, aspectRatio: undefined, h: 380 }), cgrid('Small photos', ['lake', 'night', 'woods', 'beach'].map(k => photo('Photo', k, { radius: 24, aspectRatio: undefined, h: 184 })), 2, 2, 2, 12)], 2, 1, 1, 12)),
  I('Layouts and galleries', 'Bento mosaic', 'Three columns: two stacked photos, a wide photo over a pair, and a tall photo. Seven photos, one rhythm.',
    () => cgrid('Bento mosaic', [
      stack('Left', 'column', ['woods', 'lake'].map(k => photo('Photo', k, { radius: 24, aspectRatio: undefined, h: 210 })), { gap: 12 } as St),
      stack('Middle', 'column', [photo('Wide photo', 'mountains', { radius: 24, aspectRatio: undefined, h: 250 }), cgrid('Pair', ['beach', 'forest'].map(k => photo('Photo', k, { radius: 24, aspectRatio: undefined, h: 170 })), 2, 2, 2, 12)], { gap: 12 } as St),
      photo('Tall photo', 'night', { radius: 24, aspectRatio: undefined, h: 432 })], 3, 1, 1, 12)),
  I('Layouts and galleries', 'Magazine layout', 'A lead story with a big photo, beside a column of three smaller stories.',
    () => cgrid('Magazine layout', [photo('Lead story', 'building', { radius: 20, aspectRatio: undefined, h: 520, justify: 'end' }, [scrim([badge('Cover story', '#ffffff'), t('The cities being rebuilt by the people who live in them', 26, 800, '#ffffff')], { padX: 26, padB: 26 })]), stack('Side stories', 'column', ['house', 'interior', 'workspace'].map((k, i) => hrow(['House', 'Interior', 'Workspace'][i], [photo('Story photo', k, { radius: 14, aspectRatio: undefined, w: 120, h: 100, minW: 120, grow: 0 } as St), col('Text', [t(['A house that grows with its family', 'Interiors, softened', 'Desks that earn their place'][i], 16, 700), t(['Architecture · 6 min', 'Design · 4 min', 'Work · 5 min'][i], 12, 400, '#9ca3af')], { gap: 4 })], { w: 'fill', gap: 14, items: 'center' } as St)), { gap: 18, justify: 'center' } as St)], 2, 1, 1, 24)),
  I('Layouts and galleries', 'Masonry columns', 'Four columns of photos at different heights, like a mood board.',
    () => cgrid('Masonry', [['woods', 220, 'lake', 160, 'beach', 120], ['mountains', 150, 'night', 250, 'forest', 100], ['beach', 250, 'valley', 140, 'lake', 110], ['building', 130, 'house', 200, 'night', 170]].map((c, i) => stack(`Column ${i + 1}`, 'column', [0, 2, 4].map(j => photo('Photo', c[j] as string, { radius: 14, aspectRatio: undefined, h: c[j + 1] as number })), { gap: 12, items: 'stretch' } as St)), 4, 2, 2, 12)),
  I('Layouts and galleries', 'Collection tiles', 'Six square tiles with a category name over each photo. A shop or portfolio index.',
    () => cgrid('Collection tiles', [['Footwear', 'sneaker'], ['Audio', 'headphones'], ['Watches', 'watch'], ['Interiors', 'interior'], ['Workspace', 'workspace'], ['Travel', 'valley']].map(([n, k]) => photo(n, k, { radius: 18, aspectRatio: '1 / 1', justify: 'end', pad: 12 } as St, [stack('Label', 'row', [t(n, 15, 700, '#111827')], { w: 'auto', self: 'start', padX: 14, padY: 8, radius: 999, fill: 'rgba(255,255,255,0.92)' } as St)])), 3, 2, 2, 14)),
];
export const imageCardItems: KitItem[] = IMAGE_CARDS.map(it => ({ ...it, make: () => framed(it.make()) }));

// ------------------------------------------------------------------ image pills
/** A pill: a rounded capsule that holds a thumbnail or avatar next to text. Stays one line unless you wrap it yourself. */
const pill = (name: string, kids: Node[], st: St = {}, extra: Partial<Node> = {}): Node => {
  // A pill with a growing text column or a full width spreads its content from the left; a compact pill centres it.
  const spreads = st.w === 'fill' || kids.some(k => k.style?.grow);
  return { ...hrow(name, kids, { gap: 10, padY: 6, padX: 14, minH: 40, justify: spreads ? 'start' : 'center', radius: 999, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, self: 'start', ...st } as St), ...extra };
};
/** A row of pills that wraps onto more lines when the screen is narrow. */
const pills = (name: string, kids: Node[], gap = 10, st: St = {}): Node => stack(name, 'row', kids, { w: 'fill', gap, wrap: true, items: 'center', justify: 'center', ...st } as St);
/** A pill with a photo behind its label, darkened so the text stays readable. */
const photoPill = (text: string, key: string, st: St = {}, kids?: Node[]): Node =>
  photo(text, key, { w: 'auto', h: 52, radius: 999, aspectRatio: undefined, dir: 'row', items: 'center', justify: 'center', padX: 24, gap: 8, bgTint: 'rgba(15,23,42,0.5)', self: 'center', ...st } as St, kids || [t(text, 15, 700, '#ffffff')]);
const status = (color = '#22c55e', size = 12): Node => mk('container', 'Status dot', { mode: 'flow', w: size, h: size, minW: size, grow: 0, radius: 999, fill: color, stroke: '#ffffff', strokeWidth: 2 } as St);
/** An avatar with its status dot sitting on the bottom-right corner of the photo. */
const badged = (key: string, size: number, color: string, dotSize = 12, ring = '#ffffff'): Node => {
  const d = status(color, dotSize); d.style = { ...d.style, stroke: ring, position: 'absolute', right: 0, bottom: 0 } as St;
  return stack('Avatar', 'column', [avatar(key, size), part(d, 'dot')], { w: size, h: size, minW: size, grow: 0, position: 'relative', gap: 0, items: 'stretch', self: 'auto' } as St, { bp: { tablet: { dir: 'column' }, mobile: { dir: 'column' } } });
};
/** Overlapping avatars. Each one after the first tucks under its neighbour. */
const stackOf = (keys: string[], size = 40, ring = '#ffffff', overlap = 12): Node =>
  withUi(stack('Avatar stack', 'row', keys.map((k, i) => avatar(k, size, { stroke: ring, strokeWidth: 3, ...(i ? { marginL: -overlap } : {}) } as St)), { w: 'auto', gap: 0, items: 'center' } as St, { bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } }), 'ip-stack');
const countBubble = (text: string, size = 40, bg = '#eef2ff', color = ACC): Node => { const n = t(text, 13, 700, color); n.style = { ...n.style, w: size, h: size, minW: size, grow: 0, radius: 999, fill: bg, align: 'center', stroke: '#ffffff', strokeWidth: 3, marginL: -12, layout: 'flex', dir: 'row', items: 'center', justify: 'center', lineHeight: 1 } as St; return n; };
const xBtn = (color = '#6b7280', fill = 'transparent'): Node => iconButton('Remove', [ic('close', 12, color, { sw: 2.5 })], { fill, hover: 'rgba(17,24,39,0.1)', color }, { w: 22, h: 22, minW: 22, padX: 0, padY: 0, radius: 999, self: 'auto' } as St, { 'aria-label': 'Remove' });
const ring = (key: string, size = 60, from = '#f59e0b', via = '#ec4899', to = '#8b5cf6'): Node =>
  part(stack('Story ring', 'column', [avatar(key, size, { stroke: '#ffffff', strokeWidth: 3 } as St)], { w: size + 8, h: size + 8, minW: size + 8, grow: 0, radius: 999, fill: `linear-gradient(45deg, ${from}, ${via}, ${to})`, items: 'center', justify: 'center' } as St), 'ring');
const story = (key: string, name: string, size = 60): Node => withUi(stack(name, 'column', [ring(key, size), t(name, 12, 600, '#374151')], { w: 'auto', gap: 8, items: 'center' } as St), 'ip-story');

const IMAGE_PILLS: Item[] = [
  // ---- tags and categories
  I('Tags and categories', 'Tag pills with thumbnail', 'Round thumbnails inside soft pills. Good for topics, places or collections.',
    () => pills('Tag pills', [['Mountains', 'mountains'], ['Lakes', 'lake'], ['Forests', 'woods'], ['Beaches', 'beach'], ['Night sky', 'night']].map(([n, k]) => withStates(pill(n, [avatar(k, 28), t(n, 14, 600, '#374151')], { padL: 5, padR: 14, padY: 5, fill: '#f3f4f6', stroke: 'transparent' } as St), { hover: { fill: '#e5e7eb' } } as Node['states'])))),
  I('Tags and categories', 'Tag pills, outlined', 'White pills with a thin border and a square-cornered photo. Quiet and tidy.',
    () => pills('Outlined tags', [['Interiors', 'interior'], ['Architecture', 'building'], ['Workspaces', 'workspace'], ['Houses', 'house']].map(([n, k]) => withStates(pill(n, [photo('Thumb', k, { w: 24, h: 24, radius: 7, aspectRatio: undefined }), t(n, 14, 500)], { padL: 6, padR: 14, padY: 6 } as St), { hover: { stroke: ACC } } as Node['states'])))),
  I('Tags and categories', 'Category pills with photo background', 'Each category is a pill with a photo behind its name. Four fit a row; they wrap on phones.',
    () => pills('Category pills', [['Travel', 'beach'], ['Food', 'meal'], ['Tech', 'code'], ['Style', 'flatlay']].map(([n, k]) => withStates(photoPill(n, k, { minW: 130 } as St), { hover: { translateY: -3, shadowCss: '0 12px 20px -10px rgba(15,23,42,0.5)' } } as Node['states'])), 12)),
  I('Tags and categories', 'Category capsules, tall', 'Tall capsule-shaped photos with the name at the bottom. Like story highlights, but bigger.',
    () => pills('Tall capsules', [['Coast', 'beach'], ['Peaks', 'mountains'], ['Woods', 'woods'], ['Night', 'night']].map(([n, k]) => fluid(photo(n, k, { radius: 999, aspectRatio: undefined, h: 190, justify: 'end', items: 'center', pad: 14, bgTint: 'rgba(15,23,42,0.25)' } as St, [t(n, 14, 700, '#ffffff')]), 96)), 12)),
  I('Tags and categories', 'Filter chips with thumbnails', 'Pick-one chips. The first is shown selected with an indigo ring.',
    () => pills('Filter chips', [['All', ''], ['Houses', 'house'], ['Interiors', 'interior'], ['Buildings', 'building']].map(([n, k], i) => pill(n, [...(k ? [avatar(k, 24)] : []), t(n, 14, 600, i ? '#374151' : ACC)], { padL: k ? 5 : 16, padR: 16, padY: 5, fill: i ? '#ffffff' : '#eef2ff', stroke: i ? '#e5e7eb' : ACC } as St, { attrs: { role: 'button', tabindex: '0' } }))
      )),
  I('Tags and categories', 'Topic chips with count', 'A thumbnail, the topic and a small count. For blog and shop indexes.',
    () => pills('Topic chips', [['Design', 'workspace', '24'], ['Travel', 'valley', '18'], ['Food', 'pizza', '31'], ['Tech', 'code', '12']].map(([n, k, c]) => withStates(pill(n, [avatar(k, 28), t(n, 14, 600), badge(c, '#f3f4f6', '#6b7280', { padY: 2, padX: 8 } as St)], { padL: 5, padR: 8, padY: 5 } as St), { hover: { translateY: -2, shadowCss: '0 8px 16px -8px rgba(15,23,42,0.3)' } } as Node['states'])))),
  I('Tags and categories', 'Place pill', 'A photo thumbnail, a city, a country and a small arrow. A destination shortcut.',
    () => withStates(fluid(pill('Place pill', [avatar('lake', 44), col('Text', [t('Lake Bosomtwe', 15, 700), t('Ghana · 2 h away', 12, 400, '#6b7280')], { gap: 0, w: 'auto', grow: 1 }), mid(roundBtn('arrowUpRight', 'Open', { w: 32, h: 32, minW: 32, fill: '#f3f4f6' } as St))], { padL: 6, padR: 8, padY: 6, gap: 12 } as St), 300), lift)),

  // ---- capsule banners and buttons
  I('Capsule banners and buttons', 'Capsule banner', 'A wide pill with a round photo, a short message and a button. Use it for announcements.',
    () => fluid(stack('Capsule banner', 'row', [avatar('portraitA', 52), col('Text', [t('Amara is hosting a live Q&A', 15, 700), t('Thursday · 6 pm WAT', 13, 400, '#6b7280')], { gap: 0, w: 'auto', grow: 1 }), mid(cta('Join', BRAND, { radius: 999, padX: 20, h: 40, minW: 72 } as St))], { gap: 14, padL: 8, padR: 8, padY: 8, radius: 999, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, shadow: 'md', items: 'center' } as St, { bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } }), 460)),
  I('Capsule banners and buttons', 'Capsule banner on photo', 'A long pill with a photo behind it, a line of text and a round arrow.',
    () => fluid(photo('Photo capsule', 'mountains', { w: 'fill', h: 88, radius: 999, aspectRatio: undefined, dir: 'row', items: 'center', justify: 'between', gap: 14, padL: 32, padR: 14, bgTint: 'rgba(15,23,42,0.45)' } as St, [col('Text', [t('Summer trek, 30% off', 18, 800, '#ffffff'), t('Ends Sunday', 13, 400, '#e5e7eb')], { gap: 0, w: 'auto', grow: 1 }), mid(roundBtn('arrowRight', 'Book now', { w: 52, h: 52, minW: 52 } as St))]), 480)),
  I('Capsule banners and buttons', 'Button with avatar', 'A pill button with a small portrait and a label: talk to a real person.',
    () => withStates(iconButton('Chat button', [avatar('portraitC', 36), btnText('Chat with Ngozi', '#ffffff'), ic('arrowRight', 16, '#ffffff')], BRAND, { padL: 6, padR: 20, padY: 6, radius: 999, gap: 10 } as St), lift)),
  I('Capsule banners and buttons', 'Button with photo stack', 'A dark pill button with three overlapping faces and a call to action.',
    () => iconButton('Join button', [stackOf(['portraitB', 'portraitD', 'portraitF'], 30, '#111827', 10), btnText('Join 2,400 members', '#ffffff')], DARK, { padL: 8, padR: 20, padY: 8, radius: 999, gap: 12 } as St)),
  I('Capsule banners and buttons', 'Photo pill button', 'A button with a photo behind its label. It lifts and gets a shadow on hover.',
    () => withStates(iconButton('Photo button', [btnText('Explore the coast', '#ffffff', 16), ic('arrowRight', 16, '#ffffff')], { fill: '#334155', hover: '#334155', color: '#ffffff' }, { ...img('beach'), bgTint: 'rgba(15,23,42,0.5)', padX: 28, padY: 16, radius: 999 } as St), { hover: { translateY: -3, shadowCss: '0 16px 28px -12px rgba(15,23,42,0.6)' } } as Node['states'])),
  I('Capsule banners and buttons', 'Now playing pill', 'Album art in a circle, a title and artist, and a play button.',
    () => fluid(pill('Now playing', [avatar('night', 48), col('Text', [t('Midnight Drive', 14, 700, '#ffffff'), t('Kele Bright', 12, 400, '#94a3b8')], { gap: 0, w: 'auto', grow: 1 }), mid(roundBtn('play', 'Play', { w: 40, h: 40, minW: 40 } as St, '#111827'))], { w: 'fill', padL: 8, padR: 8, padY: 8, gap: 12, fill: '#0f172a', stroke: '#1e293b' } as St), 320)),

  // ---- people
  I('People', 'Person pill', 'Avatar, name and role in one capsule.',
    () => withStates(pill('Person pill', [avatar('portraitA', 40), col('Text', [t('Amara Okoye', 14, 700), t('Product designer', 12, 400, '#6b7280')], { gap: 0, w: 'auto' })], { padL: 5, padR: 18, padY: 5, gap: 10 } as St), lift)),
  I('People', 'Person pill with verified tick', 'A name with a blue tick, a handle underneath, on a soft grey capsule.',
    () => pill('Verified person', [avatar('portraitB', 40), col('Text', [hrow('Name', [t('Chidi Eze', 14, 700), ic('verified', 15, '#2563eb')], { gap: 4 }), t('@chidi.builds', 12, 400, '#6b7280')], { gap: 0, w: 'auto' })], { padL: 5, padR: 18, padY: 5, fill: '#f3f4f6', stroke: 'transparent' } as St)),
  I('People', 'Person pill, dark', 'A dark capsule with a bright online dot. For dashboards and dark themes.',
    () => pill('Person pill dark', [badged('portraitD', 38, '#22c55e', 12, '#111827'), col('Text', [t('Tunde Bello', 14, 700, '#ffffff'), t('Online now', 12, 400, '#94a3b8')], { gap: 0, w: 'auto' })], { padL: 5, padR: 18, padY: 5, fill: '#111827', stroke: '#1f2937' } as St)),
  I('People', 'Person pill with follow', 'A capsule with a small Follow button at the end.',
    () => fluid(pill('Person follow', [avatar('portraitC', 40), col('Text', [t('Ngozi Adeyemi', 14, 700), t('Founder, Bloom', 12, 400, '#6b7280')], { gap: 0, w: 'auto', grow: 1 }), mid(cta('Follow', DARK, { radius: 999, padX: 14, padY: 7, fontSize: 13, h: 32, minW: 64 } as St))], { w: 'fill', padL: 5, padR: 6, padY: 5, gap: 10 } as St), 320)),
  I('People', 'Person pills, list', 'Three person capsules stacked, each with a status dot. For team lists and chats.',
    () => fluid(stack('Person list', 'column', [['portraitA', 'Amara Okoye', 'Designer', '#22c55e'], ['portraitB', 'Chidi Eze', 'Engineer', '#f59e0b'], ['portraitE', 'Ngozi Adeyemi', 'Founder', '#9ca3af']].map(([k, n, r, c]) => withStates(pill(n, [badged(k, 36, c, 11), t(n, 14, 600), t(r, 13, 400, '#9ca3af')], { w: 'fill', padL: 6, padR: 16, padY: 6, gap: 10, self: 'auto' } as St), { hover: { fill: '#f9fafb' } } as Node['states'])), { w: 'fill', gap: 8 } as St), 300)),
  I('People', 'User chips with remove', 'People you have picked, each with a small x to take them off. Like an email "To" field.',
    () => pills('User chips', [['portraitA', 'Amara'], ['portraitB', 'Chidi'], ['portraitC', 'Ngozi']].map(([k, n]) => pill(n, [avatar(k, 26), t(n, 14, 600, '#374151'), xBtn()], { padL: 4, padR: 6, padY: 4, gap: 8, fill: '#f3f4f6', stroke: 'transparent' } as St)), 8)),
  I('People', 'Mention chips', 'Small indigo "@name" chips with a tiny avatar. For comments and tags.',
    () => pills('Mentions', [['portraitG', 'tolu'], ['portraitH', 'kemi'], ['portraitF', 'sade']].map(([k, n]) => pill(n, [avatar(k, 20), t(`@${n}`, 13, 700, ACC)], { padL: 4, padR: 12, padY: 3, gap: 6, fill: '#eef2ff', stroke: 'transparent' } as St)), 8)),
  I('People', 'Speaker pills', 'A capsule per speaker with the time of their talk. Wrap onto new lines on phones.',
    () => pills('Speakers', [['portraitA', 'Amara', '10:00'], ['portraitD', 'Tunde', '11:30'], ['portraitE', 'Ngozi', '14:00']].map(([k, n, tm]) => pill(n, [avatar(k, 36), t(n, 14, 700), badge(tm, '#111827', '#ffffff', { padY: 3 } as St)], { padL: 5, padR: 6, padY: 5, gap: 10 } as St)), 10)),

  // ---- groups and avatars
  I('Groups and avatars', 'Avatar stack', 'Five overlapping faces and a "+12" bubble. Faces lift a little when you point at them.',
    () => hrow('Avatar group', [stackOf(['portraitA', 'portraitB', 'portraitC', 'portraitD', 'portraitE']), countBubble('+12')], { gap: 0 })),
  I('Groups and avatars', 'Avatar stack with text', 'Faces on the left, a short line on proof of a crowd on the right.',
    () => hrow('Social proof', [stackOf(['portraitB', 'portraitC', 'portraitF', 'portraitG'], 36), col('Text', [t('Loved by 2,400+ makers', 14, 700), hrow('Stars', [stars(5, 12), t('4.9 average', 12, 400, '#6b7280')], { gap: 6 })], { gap: 2, w: 'auto' })], { gap: 14 })),
  I('Groups and avatars', 'Avatar stack, large', 'Big 56 px portraits with a white ring, tightly overlapped.',
    () => hrow('Avatar stack large', [stackOf(['portraitA', 'portraitD', 'portraitE', 'portraitH'], 56, '#ffffff', 18)], { gap: 0 })),
  I('Groups and avatars', 'Avatar pill with count', 'Faces and a count inside one capsule: "5 people are viewing".',
    () => pill('Viewers pill', [stackOf(['portraitC', 'portraitF', 'portraitA'], 28, '#ffffff', 10), t('5 people viewing', 13, 600, '#374151')], { padL: 6, padR: 16, padY: 5, gap: 10, fill: '#f9fafb' } as St)),
  I('Groups and avatars', 'Avatar group with status', 'Four teammates with green, amber and grey presence dots, and their names beneath.',
    () => pills('Team presence', [['portraitA', 'Amara', '#22c55e'], ['portraitB', 'Chidi', '#f59e0b'], ['portraitD', 'Tunde', '#22c55e'], ['portraitE', 'Ngozi', '#9ca3af']].map(([k, n, c]) => col(n, [badged(k, 52, c, 14), t(n, 12, 600, '#374151')], { gap: 6, w: 'auto', items: 'center' } as St)), 18)),
  I('Groups and avatars', 'Story circles', 'A row of round photos with a colourful ring and a name. Like social-media stories.',
    () => pills('Stories', [['portraitA', 'Amara'], ['portraitB', 'Chidi'], ['portraitC', 'Ngozi'], ['portraitD', 'Tunde'], ['portraitE', 'Kemi']].map(([k, n]) => story(k, n)), 16)),
  I('Groups and avatars', 'Story circles with add', 'A "Your story" circle with a plus, then friends with rings. Seen ones go grey.',
    () => pills('Stories with add', [withUi(stack('Your story', 'column', [stack('Plus', 'column', [ic('plus', 22, '#4f46e5')], { w: 68, h: 68, minW: 68, grow: 0, radius: 999, fill: '#eef2ff', stroke: '#c7d2fe', strokeWidth: 2, items: 'center', justify: 'center' } as St), t('Your story', 12, 600, '#374151')], { w: 'auto', gap: 8, items: 'center' } as St), 'ip-story'), story('portraitB', 'Chidi'), story('portraitF', 'Sade'), withUi(stack('Seen', 'column', [part(stack('Story ring', 'column', [avatar('portraitG', 60, { stroke: '#ffffff', strokeWidth: 3 } as St)], { w: 68, h: 68, minW: 68, grow: 0, radius: 999, fill: '#d1d5db', items: 'center', justify: 'center' } as St), 'ring'), t('Tolu', 12, 600, '#9ca3af')], { w: 'auto', gap: 8, items: 'center' } as St), 'ip-story')], 16)),
  I('Groups and avatars', 'Capsule gallery', 'Five tall capsule photos side by side. The one you point at grows wider.',
    () => fluid(withUi(stack('Capsule gallery', 'row', ['mountains', 'lake', 'woods', 'beach', 'valley'].map(k => photo('Capsule', k, { w: 'auto', grow: 1, minW: 0, aspectRatio: undefined, h: 300, radius: 999 } as St)), { w: 'fill', gap: 10, items: 'stretch' } as St, { bp: { tablet: { dir: 'row' }, mobile: { dir: 'row' } } }), 'ip-cap'), 520)),
  I('Groups and avatars', 'Notification pill', 'A person, what they did, and a thumbnail of the photo. Like an activity toast.',
    () => fluid(pill('Notification', [avatar('portraitC', 40), col('Text', [t('Ngozi liked your photo', 14, 700), t('2 minutes ago', 12, 400, '#9ca3af')], { gap: 0, w: 'auto', grow: 1 }), photo('Thumb', 'lake', { w: 40, h: 40, radius: 999, aspectRatio: undefined } as St)], { w: 'fill', padL: 6, padR: 6, padY: 6, gap: 12, shadow: 'md' } as St), 340)),
];
/** Pills and chips sit in the middle of their section instead of hugging the left edge. */
const middle = (n: Node): Node => (n.style.w === 'fill' ? { ...n, style: { ...n.style, justify: n.style.dir === 'row' ? 'center' : n.style.justify } as St } : { ...n, style: { ...n.style, self: 'center' } as St });
/** Room above, below and at the sides so a pill never touches the edge of its stage. */
const roomy = (n: Node): Node => stack('Frame', 'column', [n], { w: 'fill', padX: 20, padY: 24, items: 'center' } as St);
export const imagePillItems: KitItem[] = IMAGE_PILLS.map(it => ({ ...it, make: () => roomy(middle(it.make())) }));
//@@SOCIAL
