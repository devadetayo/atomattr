/**
 * Full-page starting templates. Every block is ordinary editable nodes: flow layout, real <a> links, grids that
 * drop to fewer columns on tablet and phone, and a navbar that uses the same hamburger behaviour as the UI kit.
 * Pictures are generated SVG artwork (see stock.ts), so a template never depends on a download; swap them for your own photos in the Assets panel.
 *
 * Responsive rules are applied by the helpers below, so no template has to repeat them:
 * side padding shrinks (72 → 32 → 20), big type scales down, fixed widths become full width on phones,
 * and the navbar keeps the brand left and the menu button right (justify between).
 */
import type { Asset, Node, Page, Style } from './types';
import { art, type ArtKind } from './stock';
import { PHOTOS } from './photos';
import { UNSPLASH } from './unsplash';
import type { PresetId } from './template-meta';
import { makePage, mk } from './factory';
import { NEW_GROUPS } from '../panels/kit';

type St = Style;
type Bp = Node['bp'];
const f = (s: St = {}): St => ({ mode: 'flow', ...s });

/* ---------- responsive helpers ---------- */
const phoneSize = (s: number) => (s >= 100 ? Math.round(s * 0.3) : s >= 60 ? Math.round(s * 0.45) : Math.max(26, Math.round(s * 0.6)));
/** Tablet and phone overrides derived from a node's desktop style. */
export function responsive(st: St, fontSize?: number): Bp {
  const t: St = {}; const m: St = {};
  if (typeof st.w === 'number') { if (st.w >= 640) t.w = 'fill'; if (st.w >= 280) m.w = 'fill'; }
  if (typeof st.h === 'number' && st.h > 300) { t.h = Math.round(st.h * 0.8); m.h = Math.round(st.h * 0.6); }
  if (st.padX && st.padX > 32) { t.padX = 32; m.padX = 20; }
  if (st.padY && st.padY > 48) { t.padY = Math.round(st.padY * 0.75); m.padY = Math.max(32, Math.round(st.padY * 0.5)); }
  if (st.pad && st.pad > 32) { t.pad = 28; m.pad = 20; }
  if (st.gap && st.gap > 40) m.gap = 24;
  if (fontSize && fontSize >= 36) {
    const ms = phoneSize(fontSize); t.fontSize = Math.round(fontSize * 0.75); m.fontSize = ms;
    if (st.letterSpacing) { t.letterSpacing = Math.round(st.letterSpacing * 7.5) / 10; m.letterSpacing = Math.round((st.letterSpacing * ms) / fontSize * 10) / 10; }
  }
  const o: NonNullable<Bp> = {}; if (Object.keys(t).length) o.tablet = t; if (Object.keys(m).length) o.mobile = m;
  return Object.keys(o).length ? o : undefined;
}
const mergeBp = (a: Bp, b: Bp): Bp => (!a && !b ? undefined : { tablet: { ...a?.tablet, ...b?.tablet }, mobile: { ...a?.mobile, ...b?.mobile } });
const withBp = (st: St, extra: Partial<Node> = {}, fontSize?: number): Partial<Node> => { const bp = mergeBp(responsive(st, fontSize), extra.bp); return bp ? { ...extra, bp } : extra; };

const txt = (text: string, size = 16, color = '#111827', st: St = {}, extra: Partial<Node> = {}): Node => {
  const s = f({ w: 'fill', h: 'auto', fontSize: size, color, lineHeight: 1.5, ...st });
  return mk('text', 'Text', s, withBp(s, { text, ...extra }));
};
const head = (text: string, size: number, color: string, st: St = {}, extra: Partial<Node> = {}): Node => {
  const s = f({ w: 'fill', h: 'auto', fontSize: size, fontWeight: 700, color, lineHeight: 1.05, letterSpacing: -1, ...st });
  return mk('heading', 'Heading', s, withBp(s, { text, tag: 'h2', ...extra }, size));
};
const link = (text: string, color: string, size = 14, st: St = {}): Node => txt(text, size, color, { w: 'auto', fontWeight: 500, ...st }, { tag: 'a', href: '#', name: `${text} link` });
const btn = (text: string, fill: string, color: string, st: St = {}): Node =>
  mk('button', `${text} button`, f({ w: 'auto', h: 'auto', self: 'start', padX: 22, padY: 13, fill, color, radius: 999, fontSize: 14, fontWeight: 600, align: 'center', ...st }), { text, href: '#' });
const col = (name: string, kids: Node[], st: St = {}, extra: Partial<Node> = {}): Node => {
  const s = f({ w: 'fill', h: 'auto', layout: 'flex', dir: 'column', gap: 16, ...st });
  return mk('container', name, s, withBp(s, { children: kids, ...extra }));
};
/** `keep` stops the editor's automatic row → column stacking on phones, for rows that must stay in a line (menus, tables, chips). */
const row = (name: string, kids: Node[], st: St = {}, keep = st.wrap === false): Node =>
  col(name, kids, { dir: 'row', items: 'center', wrap: true, gap: 24, ...st }, keep ? { bp: { mobile: { dir: 'row' } } } : {});
const krow = (name: string, kids: Node[], st: St = {}): Node => row(name, kids, st, true);
const sec = (name: string, fill: string | undefined, kids: Node[], st: St = {}, tag = 'section'): Node => {
  const s = f({ w: 'fill', h: 'auto', layout: 'flex', dir: 'column', gap: 32, padX: 72, padY: 72, fill, ...st });
  return mk('section', name, s, withBp(s, { children: kids, tag }));
};
const blob = (name: string, w: St['w'], h: number, fill: string, radius = 16, st: St = {}): Node => {
  const s = f({ w, h, fill, radius, layout: 'free', ...st });
  return mk('container', name, s, withBp(s, { children: [] }));
};
/** A coloured tile with a caption at the bottom, the stand-in for a photo with a label on it. */
const tile = (name: string, fill: string, h: number, label: string, color = '#ffffff', st: St = {}): Node =>
  col(name, [txt(label, 18, color, { fontWeight: 600 })], { h, minH: Math.min(h, 220), fill, radius: 20, justify: 'end', pad: 20, gap: 4, ...bgImg(name, fill, color === '#ffffff' ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.35)'), ...st });
const grid = (name: string, cols: number, kids: Node[], gap = 20, phoneCols = 1, tabletCols = Math.min(cols, 2)): Node =>
  mk('container', name, f({ w: 'fill', h: 'auto', layout: 'grid', cols, gap }), { children: kids, bp: { tablet: { cols: tabletCols }, mobile: { cols: phoneCols } } });

/* ---------- pictures ---------- */
/** Backgrounds registered while a template is built; newProject copies them into the project's assets. */
let TPL_ASSETS: Asset[] = [];
export const templateAssets = (): Asset[] => TPL_ASSETS;
const hexes = (c: string) => c.match(/#[0-9a-f]{6}/gi) || [];
const shade = (hex: string, t: number) => { const n = parseInt(hex.slice(1), 16); const k = (v: number) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t)); return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => k(v).toString(16).padStart(2, '0')).join('')}`; };
/** A four-colour palette from any colour or gradient string, so call sites can pass the fill they already had. */
const palOf = (c: string): string[] => { const h = hexes(c); const base = h[h.length - 1] || '#9aa5b1'; return [shade(h[0] || base, 0.35), base, shade(base, -0.15), shade(base, -0.4)]; };
const seedOf = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return (h % 90) + 1; };
/* Real photos (Unsplash, fixed ids) picked per spot. A generated picture still sits underneath each one (see pic), so a box is never blank.
 * Set LIVE_PHOTOS to false to use only the built-in generated artwork (fully offline). */
const LIVE_PHOTOS = true;
const U = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;
const IMG = {
  saasHero: U('1551288049-bebda4e38f71', 1200), dashboard: U('1507238691740-187a5b1d37b8', 1200), teamwork: U('1522071820081-009f0129c71c', 1200), appScreen: U('1616469829941-c7200edec809', 1200),
  fashionHero: U('1483985988355-763728e1935b', 1200), fashionChild: U('1503944583220-79d8926ad5e2'), sneakers: U('1552346154-21d32810aba3'), sunglasses: U('1511499767150-a48a237f0083'), jacket: U('1551028719-00167b16eac5'),
  model1: U('1539571696357-5a69c17a67c6'), model2: U('1534528741775-53994a69daeb'), blog1: U('1492562080023-ab3db95bfbce'), blog2: U('1507003211169-0a1dd7228f2d'), blog3: U('1500648767791-00dcc994a43e'),
  financeHero: U('1563986768609-322da13575f3', 1200), mortgageAgent: U('1560250097-0b93528c311a'), customer1: U('1573496359142-b8d87734a5a2'), customer2: U('1580489944761-15a19d654956'),
  realEstateHero: U('1600596542815-ffad4c1539a9', 1200), house1: U('1600585154340-be6161a56a0c'), house2: U('1600607687939-ce8a6c25118c'), interior: U('1618221195710-dd6b41faaea6'),
};
type Mood = { hero: string; banner?: string; pool: string[]; people: string[]; goods?: boolean };
const K = (...k: string[]) => k.map(x => PHOTOS[x]);
/** An Unsplash photo embedded by scripts/fetch-unsplash.mjs when present, otherwise a real photo cropped from the references. */
const E = (key: string, fallback: string) => UNSPLASH[key] || PHOTOS[fallback];
const MOODS: Record<string, Mood> = {
  finance: { banner: E('financeHero', 'tot2_refi'), hero: E('financeHero', 'tot2_refi'), pool: [E('dashboard', 'tot2_buy'), E('saasHero', 'tot2_refi'), E('appScreen', 'tot2_cash'), E('teamwork', 'tot2_dad'), E('financeHero', 'tot2_mother')], people: [E('mortgageAgent', 'tot1_man'), E('customer1', 'art_c1'), E('customer2', 'velour_woman'), ...K('art_c2', 'art_c3', 'art_c4', 'velour_orange', 'brand_manbeanie')] },
  tech: { banner: E('saasHero', 'tot2_refi'), hero: E('saasHero', 'tot2_refi'), pool: [E('appScreen', 'art_combo'), E('dashboard', 'art_top1'), E('teamwork', 'tot2_refi'), E('saasHero', 'brand_head'), ...K('art_top3', 'art_p3', 'velour_dark', 'brand_sweat', 'art_top2', 'art_p1')], people: [E('customer1', 'tot1_man'), E('mortgageAgent', 'art_c2'), E('customer2', 'velour_woman'), ...K('art_c3', 'art_c4', 'art_c1')] },
  brand: { banner: UNSPLASH.fashionHero || IMG.fashionHero, hero: PHOTOS.brand_hoodie, pool: K('brand_sneaker', 'brand_sweat', 'brand_womanbag', 'brand_grayshirt', 'brand_tank', 'brand_head', 'brand_beanie', 'brand_hoodie', 'brand_bag'), people: K('brand_manbeanie', 'brand_tee', 'velour_woman'), goods: true },
  fashion: { banner: UNSPLASH.fashionHero || IMG.fashionHero, hero: PHOTOS.silk_coat, pool: K('silk_white', 'silk_blue', 'silk_green', 'silk_coat', 'silk_graytee', 'silk_tee22', 'brand_hoodie', 'silk_trench', 'silk_tan', 'brand_sweat', 'silk_beige'), people: K('velour_woman', 'velour_orange', 'brand_manbeanie', 'velour_hero'), goods: true },
  shop: { banner: UNSPLASH.fashionHero || IMG.fashionHero, hero: PHOTOS.brand_hoodie, pool: K('brand_sneaker', 'brand_head', 'brand_sunglass', 'silk_coat', 'brand_bag', 'silk_white', 'brand_beanie', 'brand_tee', 'silk_blue', 'brand_womanbag'), people: K('brand_manbeanie', 'velour_woman', 'art_c1'), goods: true },
  velour: { banner: UNSPLASH.fashionHero || IMG.fashionHero, hero: PHOTOS.velour_hero, pool: K('velour_jacket1', 'velour_dark', 'velour_orange', 'velour_tan', 'velour_woman'), people: K('velour_hero', 'velour_woman', 'velour_orange') },
  home: { banner: UNSPLASH.realEstateHero || IMG.realEstateHero, hero: PHOTOS.tot2_dad, pool: K('tot2_buy', 'tot2_refi', 'tot2_cash', 'tot2_dad', 'tot2_mother'), people: K('tot1_man', 'tot2_dad', 'tot2_mother', 'tot2_buy') },
  art: { banner: UNSPLASH.interior || IMG.interior, hero: PHOTOS.art_combo, pool: K('art_p1', 'art_p2', 'art_p3', 'art_p4', 'art_p5', 'art_p6', 'art_p7', 'art_p8', 'art_top1', 'art_top2', 'art_top3', 'art_top4'), people: K('art_c1', 'art_c2', 'art_c3', 'art_c4') },
};
const MOOD_OF: Partial<Record<PresetId, string>> = { finance: 'finance', fintech: 'finance', finexus: 'finance', dashboard: 'finance', designer: 'tech', tasks: 'tech', brand: 'brand', dress: 'fashion', velour: 'velour', market: 'shop', mortgage: 'home', artshop: 'art' };
/** Product words -> the real photos of that kind of thing. */
const GOODS: [RegExp, string[]][] = [
  [/shoe|sneaker|trainer|boot/, K('brand_catshoe', 'brand_sneaker', 'brand_shoes2')],
  [/sunglass|glasses/, K('brand_sunglass')],
  [/headphone|airpod|earbud|headset/, K('brand_head')],
  [/bag|backpack|tote|purse/, K('brand_bag', 'brand_womanbag', 'brand_womanbag2')],
  [/beanie|\bhat\b|\bcap\b/, K('brand_beanie', 'brand_manbeanie')],
  [/tank|\btop\b|blouse|camisole/, K('brand_tank', 'silk_blouse')],
  [/dress|\bkid/, K('brand_kid')],
  [/hood|sweat|jumper|pullover|gray/, K('brand_hoodie', 'brand_sweat', 'brand_grayshirt')],
  [/jacket|coat|shell|bomber|outer|blazer|parka|cardigan|trench/, K('silk_coat', 'silk_tan', 'silk_trench', 'silk_green', 'velour_tan')],
  [/shirt|\btee\b|polo/, K('silk_white', 'silk_blue', 'silk_graytee', 'silk_tee22', 'silk_blacktee', 'brand_tee')],
];
let MOOD = MOODS.tech; let PICKS: Record<string, number> = {};
const lastWord = (name: string) => (name.toLowerCase().replace(/\b(image|visual|preview|photo|print|avatar|icon|banner|tile|mock-up|chart)\b/g, ' ').replace(/[^a-z ]+/g, ' ').trim().split(/\s+/).filter(w => w.length > 2).pop() || '');
const nextOf = (key: string, list: string[]) => list[(PICKS[key] = (PICKS[key] ?? -1) + 1) % list.length];
/** The photo for a spot: people get portraits, shoes/glasses/jackets get their own shot, banners get the hero, everything else cycles the template's pool. */
const photoUrl = (name: string, kind?: ArtKind): string => {
  const n = name.toLowerCase();
  if (/portrait|photo|avatar|customer|client|model/.test(n) || (kind === 'portrait' && !MOOD.goods)) return nextOf('people', MOOD.people);
  if (/hero|banner/.test(n)) return MOOD.hero;
  if (/combo/.test(n) && PHOTOS.art_combo && MOOD === MOODS.art) return PHOTOS.art_combo;
  if (MOOD === MOODS.home) { if (/buy/.test(n)) return PHOTOS.tot2_buy; if (/re-?fi/.test(n)) return PHOTOS.tot2_refi; if (/cash/.test(n)) return PHOTOS.tot2_cash; }
  if (MOOD.goods) { const g = GOODS.findIndex(([re]) => re.test(n)); if (g >= 0) return nextOf(`g${g}`, GOODS[g][1]); }
  return nextOf('pool', MOOD.pool);
};
/** A real bar chart built from boxes (solid fills), for chart spots that used to be gradient artwork. */
const barChart = (name: string, heights: number[], color: string, soft: string, h: number): Node =>
  row(name, heights.map((v, i) => blob(`${name} bar ${i + 1}`, 'fill', Math.round(h * v / 100), i === heights.length - 2 ? color : soft, 8)), { items: 'end', gap: 10, wrap: false, h, justify: 'between' });
const AUTO: ArtKind[] = ['dunes', 'arches', 'waves', 'city', 'product', 'mesh'];
const kindOf = (name: string, kind: ArtKind | undefined, seed: number): ArtKind =>
  kind || (/portrait|photo|avatar|customer|client|model/i.test(name) ? 'portrait' : /chart/i.test(name) ? 'waves' : /visual|preview/i.test(name) ? 'mesh' : AUTO[seed % AUTO.length]);
/** A real image node (flow layout, covers its box) in place of a flat colour block. */
const pic = (name: string, w: St['w'], h: number, color: string, radius = 16, st: St = {}, kind?: ArtKind): Node => {
  const seed = seedOf(name); const local = art(kindOf(name, kind, seed), palOf(color), seed, { grain: 0.06 });
  const src = LIVE_PHOTOS && !/chart|^Bar \d/i.test(name) ? photoUrl(name, kind) : local;
  // A web link gets the generated picture behind it, so a box is never blank while it loads or if it cannot load. Embedded photos need no backup.
  let under: St = {}; if (src.startsWith('http')) { const id = `tpl-${TPL_ASSETS.length + 1}`; TPL_ASSETS.push({ id, name: `${name} backup.svg`, mime: 'image/svg+xml', dataUrl: local }); under = { fillImg: id, bgSize: 'cover', bgPos: 'center' }; }
  const s = f({ w, h, radius, ...under, ...st });
  return mk('image', name, s, withBp(s, { src, alt: name }));
};
/** Style fields that put generated artwork behind a node (for tiles and banners that carry text). */
const bgImg = (name: string, color: string, tint?: string, kind?: ArtKind): St => {
  const seed = seedOf(name); const id = `tpl-${TPL_ASSETS.length + 1}`;
  const url = LIVE_PHOTOS && /hero|banner/i.test(name) ? (MOOD.banner || MOOD.hero) : LIVE_PHOTOS ? photoUrl(name, kind) : '';
  TPL_ASSETS.push(LIVE_PHOTOS ? { id, name: `${name}.jpg`, mime: 'image/jpeg', dataUrl: url } : { id, name: `${name}.svg`, mime: 'image/svg+xml', dataUrl: art(kindOf(name, kind, seed), palOf(color), seed, { grain: 0.06 }) });
  return { fillImg: id, bgSize: 'cover', bgPos: 'center', bgTint: tint };
};
const pill = (text: string, on: boolean, ink: string, fillOn = ink): Node =>
  btn(text, on ? fillOn : 'transparent', on ? '#ffffff' : ink, { padX: 16, padY: 8, fontSize: 13, stroke: on ? fillOn : '#d4d4d4', strokeWidth: 1 });

/** The kit's hamburger navbar, recoloured and relabelled. Brand on the left, menu button on the right at every size. */
function navbar(o: { brand: string; links: string[]; cta: string; bg: string; fg: string; accent: string; ctaColor?: string; border?: string; hover?: string; brandSize?: number; st?: St; bp?: Bp }): Node {
  const make = NEW_GROUPS.find(g => g.id === 'navigation')!.items.find(i => i.name === 'Navbar with hamburger')!.make;
  const nav = make(); let li = 0;
  const walk = (n: Node) => {
    if (n.type === 'heading') { n.text = o.brand; n.style = { ...n.style, w: 'auto', grow: 0, color: o.fg, fontSize: o.brandSize ?? 22 }; }
    else if (n.type === 'text' && n.href) { n.text = o.links[li++ % o.links.length]; n.style = { ...n.style, color: o.fg }; n.states = { hover: { fill: o.hover ?? 'rgba(127,127,127,0.14)' } }; }
    else if (n.type === 'button') { n.text = o.cta; n.style = { ...n.style, fill: o.accent, color: o.ctaColor ?? '#ffffff', radius: 999, minW: 132, grow: 0 }; }
    else if (n.type === 'path') n.style = { ...n.style, stroke: o.fg };
    if (n.behavior?.role === 'panel') {
      n.style = { ...n.style, w: 'auto', grow: 1, justify: 'end', items: 'center', gap: 20 };
      n.bp = { tablet: { w: 'auto' }, mobile: { w: 'fill', dir: 'column', items: 'stretch', justify: 'start', gap: 6, padY: 8 } };
    }
    if (n.behavior?.role === 'toggle') n.style = { ...n.style, self: 'auto', grow: 0 };
    if (n.tag === 'button' && n.states?.hover) n.states = { hover: { fill: o.hover ?? 'rgba(127,127,127,0.14)' } };
    (n.children || []).forEach(walk);
  };
  walk(nav);
  nav.style = { ...nav.style, w: 'fill', fill: o.bg, stroke: o.border ?? o.bg, strokeWidth: o.border ? 1 : 0, padX: 56, justify: 'between', items: 'center', ...o.st };
  // padding shrinks with the screen and the brand/menu button stay on one row, brand left and button right
  nav.bp = mergeBp({ tablet: { padX: 32, dir: 'row' }, mobile: { padX: 20, dir: 'row', justify: 'between', items: 'center' } }, mergeBp(nav.bp, o.bp));
  return nav;
}
const footerCols = (bg: string, fg: string, muted: string, brand: string, blurb: string, cols: [string, string[]][]): Node =>
  sec('Footer', bg, [
    grid('Footer columns', cols.length + 1, [
      col(`${brand} about`, [txt(brand, 20, fg, { fontWeight: 800 }), txt(blurb, 14, muted)], { gap: 10 }),
      ...cols.map(([h, ls]) => col(h, [txt(h, 14, fg, { fontWeight: 700 }), ...ls.map(l => link(l, muted))], { gap: 10 })),
    ], 32, 2, 2),
    krow('Legal', [txt(`© ${new Date().getFullYear()} ${brand}. All rights reserved`, 13, muted, { w: 'auto' }), txt('Privacy · Terms', 13, muted, { w: 'auto' })], { justify: 'between' }),
  ], { padY: 56 }, 'footer');
const footer = (bg: string, fg: string, muted: string, brand: string, links: string[]): Node =>
  sec('Footer', bg, [row('Footer row', [txt(brand, 16, fg, { w: 'auto', fontWeight: 700 }), krow('Footer links', links.map(l => link(l, muted)), { w: 'auto', gap: 24 }), txt(`© ${new Date().getFullYear()} All rights reserved`, 13, muted, { w: 'auto' })], { justify: 'between' })], { padY: 36, gap: 0 }, 'footer');

/** Questions that open and close with the page's own behaviour script (the first one starts open). */
const faq = (items: [string, string][], ink: string, mute: string, line: string): Node =>
  col('FAQ list', items.map(([q, a], i) => {
    const key = `faq-${i + 1}`;
    const toggle = mk('button', `${q} toggle`, f({ w: 'fill', h: 'auto', padX: 0, padY: 20, fill: 'transparent', color: ink, fontSize: 17, fontWeight: 600, align: 'left', radius: 0 }), { text: `${q}  ${i === 0 ? '−' : '+'}`, behavior: { role: 'toggle', key } });
    const panel: Node = { ...col(`${q} answer`, [txt(a, 15, mute)], { padB: 20 }), behavior: { role: 'panel', key, initial: i === 0 ? 'open' : 'closed' } };
    return { ...col(q, [toggle, panel], { gap: 0, stroke: line, strokeWidth: 0, borderB: 1 }), behavior: { role: 'scope' } } as Node;
  }), { gap: 0 });

/* ---------- 1 · Finance, purple and lime ---------- */
const finance = (): Node[] => {
  const dk = '#241466'; const pr = '#5b3df5'; const lime = '#c8f23d'; const lav = '#f4f2ff'; const ink = '#1b1340'; const mute = '#6a6590';
  const card = (t: string, d: string, fill: string) => col(t, [pic(`${t} preview`, 'fill', 150, fill, 14), head(t, 19, ink, { letterSpacing: 0, fontWeight: 700 }), txt(d, 14, mute)], { pad: 20, radius: 20, fill: '#ffffff', stroke: '#e7e3fb', strokeWidth: 1, gap: 14 });
  const dark = (t: string, d: string, fill: string) => col(t, [head(t, 24, '#ffffff', { letterSpacing: 0, fontWeight: 700 }), txt(d, 15, 'rgba(255,255,255,0.7)'), pic(`${t} visual`, 'fill', 200, fill, 16, {}, 'glow')], { pad: 28, radius: 24, fill: 'rgba(255,255,255,0.08)', gap: 14 });
  return [
    navbar({ brand: 'Fundly', links: ['Features', 'Pricing', 'Security', 'FAQ'], cta: 'Get started', bg: dk, fg: '#ffffff', accent: lime, ctaColor: dk }),
    sec('Hero', dk, [
      col('Hero copy', [head('Unlock Financial Freedom for Your Best Life', 64, '#ffffff', { align: 'center', fontWeight: 800, letterSpacing: -2, w: 820, self: 'center' }), txt('Budget, save and invest from one calm dashboard that grows with you.', 18, 'rgba(255,255,255,0.75)', { align: 'center', w: 560, self: 'center' }),
        row('Hero buttons', [btn('Get started', lime, dk), btn('See how it works', 'transparent', '#ffffff', { stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 })], { justify: 'center', gap: 12 })], { items: 'center', gap: 20 }),
      col('Card mock-up', [txt('Total balance', 13, 'rgba(255,255,255,0.8)'), head('$12,480.00', 44, '#ffffff', { letterSpacing: -1 }), krow('Mock chips', [btn('Send', lime, dk, { padY: 8 }), btn('Request', 'rgba(255,255,255,0.2)', '#ffffff', { padY: 8 })], { gap: 8 })],
        { w: 640, self: 'center', pad: 32, radius: 28, fill: 'linear-gradient(135deg, #7c5cff 0%, #5b3df5 55%, #3b21b8 100%)', gap: 10 }),
    ], { padY: 72 }),
    sec('Partners', '#ffffff', [krow('Partner names', ['Stripe', 'Plaid', 'Visa', 'Chime', 'Wise'].map(n => head(n, 22, '#8d89ad', { w: 'auto', letterSpacing: 0, fontWeight: 600 })), { justify: 'between' })], { padY: 40 }),
    sec('Solutions', '#ffffff', [head('Gain Financial Mastery with Our All-in-One Solutions', 44, ink, { align: 'center', fontWeight: 800, w: 760, self: 'center', letterSpacing: -1.5 }),
      grid('Solution cards', 3, [card('Smart budgeting', 'Every dollar sorted automatically, with gentle nudges.', lav), card('Goal tracking', 'Set a target and watch your progress build.', '#e8f7b9'), card('Investing made simple', 'Start with as little as $10 and scale up.', '#dcd3ff')], 24)], { padY: 80 }),
    sec('Potential', lav, [row('Potential row', [
      col('Potential copy', [head('15%', 72, pr, { w: 'auto', fontWeight: 800 }), head('Unlock Your Financial Potential with Our Comprehensive Solution', 36, ink, { letterSpacing: -1 }), txt('Average yearly growth our members see after moving their savings and spending into one place.', 16, mute), btn('Learn more', dk, '#ffffff')], { w: 520, gap: 16 }),
      col('Potential card', [txt('Savings rate', 13, mute), head('+15.2%', 40, ink, { letterSpacing: -1 }), barChart('Growth chart', [35, 48, 42, 60, 55, 78, 70, 92], '#5b3df5', '#d6ccff', 160)], { w: 460, pad: 24, radius: 24, fill: '#ffffff', gap: 10 }),
    ], { justify: 'between', gap: 48 })], { padY: 88 }),
    sec('Security', dk, [head('Safety & Security for Your Peace of Mind', 40, '#ffffff', { align: 'center', fontWeight: 800, w: 720, self: 'center' }),
      grid('Security cards', 2, [dark('Bank-grade protection', 'Encryption, biometric sign-in and instant card freeze.', '#5b3df5'), dark('Always in your control', 'Alerts for every transaction and clear permission settings.', '#a5d12a')], 24)], { padY: 88 }),
    sec('FAQ', '#ffffff', [row('FAQ row', [
      col('FAQ intro', [head('FAQ', 48, ink, { fontWeight: 800 }), txt('Quick answers about how Fundly works. Cannot find yours? Our team replies within a day.', 15, mute)], { w: 360 }),
      col('FAQ items', [faq([['How does Fundly keep my money safe?', 'Funds are held with regulated partner banks and every sign-in is protected by two-factor checks.'], ['Is there a monthly fee?', 'The starter plan is free. Paid plans add advanced goals and priority support.'], ['Can I connect several banks?', 'Yes, connect as many accounts as you like and see them together.'], ['How do I cancel?', 'Cancel in two taps from settings. No calls, no penalties.']], ink, mute, '#e7e3fb')], { w: 720 }),
    ], { justify: 'between', items: 'start', gap: 48 })], { padY: 88 }),
    sec('Call to action', '#ffffff', [col('CTA card', [head('Start Your Journey with Fundly Today', 40, dk, { align: 'center', fontWeight: 800, w: 640, self: 'center' }), txt('Join thousands of people building better money habits.', 16, dk, { align: 'center', w: 460, self: 'center' }), btn('Create free account', dk, '#ffffff', { self: 'center' })], { items: 'center', pad: 56, radius: 32, fill: lime, gap: 16 })], { padY: 24, padB: 80 }),
    footerCols(dk, '#ffffff', 'rgba(255,255,255,0.65)', 'Fundly', 'Money tools that feel calm.', [['Product', ['Features', 'Pricing', 'Security']], ['Company', ['About', 'Careers', 'Press']], ['Support', ['Help centre', 'Contact', 'Status']]]),
  ];
};

/* ---------- 2 · Fintech, dashboard hero ---------- */
const fintech = (): Node[] => {
  const dk = '#1a0f4d'; const pr = '#6a4dff'; const lime = '#c8f23d'; const ink = '#1b1340'; const mute = '#6a6590';
  const stat = (l: string, v: string) => col(`${l} stat`, [txt(l, 12, mute), head(v, 22, ink, { letterSpacing: 0 })], { gap: 2, pad: 14, radius: 12, fill: '#f4f2ff' });
  const dash = col('Dashboard', [
    krow('Dash header', [head('Overview', 20, ink, { w: 'auto', letterSpacing: 0 }), btn('This month', '#f4f2ff', ink, { padY: 6, fontSize: 12 })], { justify: 'between' }),
    grid('Dash stats', 3, [stat('Income', '$8,240'), stat('Spending', '$3,120'), stat('Saved', '$5,120')], 12, 1, 3),
    barChart('Dash chart', [30, 52, 44, 68, 58, 84, 74, 96, 80], '#6a4cff', '#d9d0ff', 200),
  ], { w: 900, self: 'center', pad: 24, radius: 24, fill: '#ffffff', gap: 16 });
  const goal = (t: string, d: string, fill: string) => col(t, [pic(`${t} preview`, 'fill', 130, fill, 14), head(t, 19, ink, { letterSpacing: 0 }), txt(d, 14, mute)], { pad: 20, radius: 20, fill: '#ffffff', stroke: '#e7e3fb', strokeWidth: 1, gap: 12 });
  const post = (t: string, fill: string) => col(t, [pic(`${t} image`, 'fill', 200, fill, 16), txt('Money · 5 min read', 12, mute), head(t, 19, ink, { letterSpacing: 0, fontWeight: 600 }), link('Read more →', pr)], { gap: 10 });
  const panelCard = (t: string, d: string) => col(t, [head(t, 22, '#ffffff', { letterSpacing: 0 }), txt(d, 14, 'rgba(255,255,255,0.7)'), krow('Bars', [60, 100, 80, 130, 110].map(h => blob(`Bar ${h}`, 28, h, lime, 6)), { items: 'end', gap: 10, wrap: false })], { pad: 28, radius: 24, fill: 'rgba(255,255,255,0.08)', gap: 14 });
  return [
    navbar({ brand: 'Pennywise', links: ['Product', 'Solutions', 'Learn', 'Pricing'], cta: 'Open account', bg: dk, fg: '#ffffff', accent: lime, ctaColor: dk }),
    sec('Hero', `linear-gradient(180deg, ${dk} 0%, #2b1a77 100%)`, [
      head('Get Personal and Access to Reach Financial Goals', 60, '#ffffff', { align: 'center', fontWeight: 800, letterSpacing: -2, w: 820, self: 'center' }),
      txt('Plan, track and grow your money with advice that fits your life.', 18, 'rgba(255,255,255,0.75)', { align: 'center', w: 540, self: 'center' }),
      row('Hero buttons', [btn('Get started', lime, dk), btn('Talk to an advisor', 'transparent', '#ffffff', { stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 })], { justify: 'center', gap: 12 }),
      dash,
    ], { padY: 72 }),
    sec('Partners', '#ffffff', [krow('Partner names', ['Monzo', 'Revolut', 'Klarna', 'Square', 'Brex'].map(n => head(n, 22, '#8d89ad', { w: 'auto', letterSpacing: 0, fontWeight: 600 })), { justify: 'between' })], { padY: 40 }),
    sec('Goals', '#ffffff', [head('Achieve Your Financial Goals with Confidence', 40, ink, { align: 'center', fontWeight: 800, w: 700, self: 'center' }),
      grid('Goal cards', 3, [goal('Credit health', 'See your score and what moves it.', '#e8f7b9'), goal('Spending insights', 'Know exactly where each month goes.', '#dcd3ff'), goal('Savings plans', 'Automate deposits toward what matters.', '#ffe0cf')], 24),
      btn('Explore all features', pr, '#ffffff', { self: 'center' })], { padY: 80 }),
    sec('Manage money', dk, [head('Revolutionizing the Way You Manage Money', 40, '#ffffff', { align: 'center', fontWeight: 800, w: 720, self: 'center' }),
      grid('Panels', 2, [panelCard('Cash flow', 'Weekly view of money in and out.'), panelCard('Investments', 'Portfolio growth at a glance.')], 24)], { padY: 88 }),
    sec('Knowledge', '#ffffff', [head('Empowering You with Knowledge', 40, ink, { align: 'center', fontWeight: 800 }),
      grid('Articles', 3, [post('How to build an emergency fund', '#dcd3ff'), post('Index funds explained simply', '#e8f7b9'), post('Five habits of confident savers', '#ffe0cf')], 24)], { padY: 80 }),
    sec('FAQ', '#f4f2ff', [head('Quick Answers to Your Financial Queries', 36, ink, { align: 'center', fontWeight: 800, w: 640, self: 'center' }),
      col('FAQ wrap', [faq([['Do I need a minimum balance?', 'No. Open an account with any amount.'], ['How are advisors matched?', 'We pair you by goals and experience after a short quiz.'], ['Are my details shared?', 'Never sold, and you control every connection.'], ['Can I use it on my phone?', 'Yes, the iOS and Android apps match the web experience.']], ink, mute, '#ddd8f5')], { w: 760, self: 'center' })], { padY: 80 }),
    sec('Call to action', '#ffffff', [col('CTA card', [head('Start Your Journey with Pennywise', 36, dk, { align: 'center', fontWeight: 800, w: 640, self: 'center' }), btn('Get started', dk, '#ffffff', { self: 'center' })], { items: 'center', pad: 48, radius: 32, fill: lime, gap: 16 })], { padY: 24, padB: 80 }),
    footerCols(dk, '#ffffff', 'rgba(255,255,255,0.65)', 'Pennywise', 'Personal finance, personally.', [['Product', ['Accounts', 'Cards', 'Investing']], ['Learn', ['Blog', 'Guides', 'Webinars']], ['Company', ['About', 'Careers', 'Contact']]]),
  ];
};

/* ---------- 3 · Brand, sage fashion store ---------- */
const brand = (): Node[] => {
  const ink = '#111111'; const sage = 'linear-gradient(135deg, #8e9c7e 0%, #7f98ad 100%)'; const mute = '#6b6b6b';
  const category = (n: string, c: string) => col(n, [pic(`${n} image`, 'fill', 130, c, 12, {}, 'product'), txt(n, 14, ink, { align: 'center', fontWeight: 600 })], { pad: 12, radius: 16, fill: '#ececec', gap: 8 });
  const product = (n: string, c: string, price: string) => col(n, [pic(`${n} image`, 'fill', 280, c, 20, {}, 'product'), txt(n, 14, ink, { fontWeight: 600 }), txt(price, 14, mute)], { gap: 6 });
  const tints = ['#d9d9d9', '#e7d9d2', '#d6dde4', '#dfe3d0'];
  return [
    navbar({ brand: 'Brand', links: ['New arrival', 'Most pick', 'Sale', 'Women', 'Men', 'Sneakers', 'Store location'], cta: 'Contact us', bg: '#ffffff', fg: ink, accent: ink, border: '#eeeeee', brandSize: 24 }),
    sec('Hero', '#ffffff', [
      row('Hero top', [
        col('Hero banner', [head('Summer Arrival of Outfit', 56, '#ffffff', { fontWeight: 500, letterSpacing: -1.5, w: 440 }), txt('Discover quality fashion that reflects your style and makes everyday enjoyable.', 15, 'rgba(255,255,255,0.9)', { w: 380 }), btn('Explore product', ink, '#ffffff')], { w: 820, h: 400, justify: 'center', padX: 48, gap: 16, radius: 28, fill: sage, ...bgImg('Hero banner', '#8e9c7e', 'rgba(0,0,0,0.3)', 'dunes') }),
        tile('Fashion style tile', '#cfe0cf', 400, 'Fashion Style', ink, { w: 360, items: 'start', justify: 'start' }),
      ], { items: 'stretch', gap: 16 }),
      grid('Hero bottom', 2, [tile('Sunglass tile', '#d9d9d9', 220, 'Trendy Sunglass', ink, { justify: 'center' }), tile('Shoes tile', '#e9cdbd', 220, 'Popular Shoes', ink, { justify: 'center' })], 16),
    ], { padY: 32, padX: 56, gap: 16 }),
    sec('Categories', '#ffffff', [row('Categories header', [head('Browse by categories', 36, ink, { w: 'auto', letterSpacing: -1, fontWeight: 500 }), krow('Category filters', [pill('All', true, ink), pill('Women', false, ink), pill('Children', false, ink)], { w: 'auto', gap: 8 })], { justify: 'between' }),
      grid('Category tiles', 4, [category('Shoes', tints[0]), category('Brush', tints[1]), category('Bag', tints[2]), category('T-shirt', tints[3])], 16, 2)], { padY: 40, padX: 56 }),
    sec('New collection', '#ffffff', [row('Collection header', [head('New Collection', 28, ink, { w: 'auto', letterSpacing: 0, fontWeight: 600 }), krow('Collection filters', ['All', 'Shorts', 'Jackets', 'Shoes', 'T-shirt'].map((l, i) => pill(l, i === 0, ink)), { w: 'auto', gap: 8 })], { justify: 'between' }),
      grid('Product grid', 4, [product('Gray shirt', tints[0], '$125'), product('Woman bag', tints[2], '$125'), product('Kids top', tints[1], '$125'), product('Brodeo beanie', tints[3], '$25')], 16, 2)], { padY: 40, padX: 56 }),
    sec('Dresses banner', '#ffffff', [col('Banner', [txt('LAST CHANCE', 11, 'rgba(255,255,255,0.8)', { align: 'center', letterSpacing: 2 }), head('EXPLORE OUR RANGE OF STYLISH DRESSES', 34, '#ffffff', { align: 'center', fontWeight: 600, letterSpacing: -0.5, w: 640, self: 'center' }), btn('Check it now', '#ffffff', ink, { self: 'center', radius: 6 })], { items: 'center', pad: 48, radius: 20, fill: '#8e9c7e', gap: 12, ...bgImg('Dresses banner', '#8e9c7e', 'rgba(0,0,0,0.3)', 'dunes') })], { padY: 24, padX: 56 }),
    sec('Story', '#ffffff', [row('Story row', [
      col('Story copy', [head('Shop now & discover why is our brand for your best deal.', 40, ink, { fontWeight: 500, letterSpacing: -1 }), txt('We source our products from trusted manufacturers who never compromise on quality, durability and craftsmanship.', 15, mute, { w: 480 }), btn('Read more', '#ffffff', ink, { stroke: '#d4d4d4', strokeWidth: 1, radius: 6 })], { w: 560, gap: 16 }),
      pic('Story photo', 360, 320, 'linear-gradient(160deg, #cfd6cf 0%, #8e9c7e 100%)', 24),
    ], { justify: 'between', gap: 40 })], { padY: 72, padX: 56 }),
    footerCols('#111111', '#ffffff', '#9a9a9a', 'Brand', 'Considered clothing for every day.', [['Shop', ['Women', 'Men', 'Sneakers']], ['Help', ['Shipping', 'Returns', 'Contact']], ['Visit', ['Store location', 'Careers', 'Press']]]),
  ];
};

/* ---------- 4 · Dress, exclusive fashion ---------- */
const dress = (): Node[] => {
  const ink = '#0f0f12'; const mute = '#6b6b75';
  const model = (n: string, fill: string, h: number, w: St['w'] = 'fill') => col(n, [txt(n, 20, '#ffffff', { fontWeight: 600 })], { w, h, fill, radius: 24, justify: 'end', pad: 20, ...bgImg(n, fill, 'rgba(0,0,0,0.18)', 'portrait') });
  const item = (n: string, c: string, price: string) => col(n, [pic(`${n} image`, 'fill', 260, c, 16, {}, 'portrait'), krow(`${n} row`, [txt(n, 13, ink, { w: 'auto', fontWeight: 600 }), btn('Add cart', 'transparent', ink, { padX: 10, padY: 4, fontSize: 11, stroke: '#d4d4d8', strokeWidth: 1 })], { justify: 'between', wrap: false, gap: 8 }), krow(`${n} meta`, [txt(price, 13, mute, { w: 'auto' }), txt('★★★★★', 12, '#f5a524', { w: 'auto' })], { gap: 8 })], { gap: 8 });
  const post = (t: string, c: string) => col(t, [pic(`${t} image`, 'fill', 240, c, 16), head(t, 18, ink, { letterSpacing: 0, fontWeight: 600 })], { gap: 10 });
  const names = ['Trendy T-shirt', 'Casual shirt', 'Formal shirt', 'Winter jacket', 'Fashion jacket', 'Woman blazer', 'Modern jacket', 'Formal T-shirt'];
  const tints = ['#d8e0d0', '#d9c5ba', '#c3d3d8', '#ddd3c6', '#e6dfc9', '#c7ccd8', '#d9d0c5', '#d7dccb'];
  return [
    navbar({ brand: 'ORVELLA', links: ['Home', 'Product', 'Handbook', 'Brands', 'About'], cta: 'Sign in', bg: '#ffffff', fg: ink, accent: ink, brandSize: 20 }),
    sec('Hero', '#ffffff', [
      head('Exclusive stylish dress for you', 72, ink, { align: 'center', fontWeight: 600, letterSpacing: -3, w: 900, self: 'center' }),
      btn('Start shopping', ink, '#ffffff', { self: 'center' }),
      grid('Hero models', 3, [model('Fashion jacket', 'linear-gradient(180deg, #cfe3c6 0%, #8aa07a 100%)', 380), model('Outfit t-shirt', 'linear-gradient(180deg, #cfe0f5 0%, #6f93d1 100%)', 380), model('Stylish blazer', 'linear-gradient(180deg, #f5e0cf 0%, #e0845a 100%)', 380)], 16),
    ], { padY: 56, padX: 56 }),
    sec('Modern style', '#ffffff', [row('Modern row', [
      col('Modern copy', [pill('Modern fashion', false, ink), head('Modern style', 48, ink, { fontWeight: 600, letterSpacing: -1.5 }), txt('Clean cuts and honest fabrics for the way you move through the day.', 15, mute, { w: 360 }), btn('Shop now', ink, '#ffffff')], { w: 380, gap: 14 }),
      model('Tailored wear', 'linear-gradient(180deg, #ecd5b5 0%, #c79a63 100%)', 300, 480), model('Relaxed wear', 'linear-gradient(180deg, #d0d8e0 0%, #7c8fa3 100%)', 300, 300),
    ], { justify: 'between', gap: 16, items: 'stretch' })], { padY: 32, padX: 56 }),
    sec('Fresh arrivals', '#ffffff', [row('Arrivals header', [head('Fresh arrival and new collection', 32, ink, { w: 'auto', letterSpacing: -1, fontWeight: 600 }), krow('Arrival filters', ['All', 'Best seller', 'Pick a mood', 'Trending', 'How it'].map((l, i) => pill(l, i === 0, ink)), { w: 'auto', gap: 8 })], { justify: 'between' }),
      grid('Product grid', 4, names.map((n, i) => item(n, tints[i], `$${20 + i * 4}`)), 16, 2)], { padY: 56, padX: 56 }),
    sec('Testimonial', '#ffffff', [row('Testimonial row', [
      col('Quote card', [txt('“It’s a brand that understands fashion isn’t just clothing, it’s a way of expressing yourself. Thank you!”', 20, ink, { fontWeight: 500 }), txt('Rabib Mia · Customer', 13, mute)], { w: 640, pad: 32, radius: 24, fill: '#f3e7de', gap: 16 }),
      pic('Customer photo', 340, 260, 'linear-gradient(160deg, #e2a88b 0%, #7a4a3a 100%)', 24),
    ], { justify: 'between', gap: 16, items: 'stretch' })], { padY: 40, padX: 56 }),
    sec('Blog', '#ffffff', [head('Our latest blog', 32, ink, { letterSpacing: -1, fontWeight: 600 }), grid('Blog cards', 3, [post('Trendy T', '#cdbfb2'), post('Bold shirt', '#bfd0d4'), post('Jenson', '#e6dc9f')], 16)], { padY: 56, padX: 56 }),
    footerCols('#0b0b0d', '#ffffff', '#9a9aa5', 'ORVELLA', 'Free shipping, easy returns and flexible payment.', [['Category', ['Shirts', 'Jackets', 'Blazers']], ['Company', ['About', 'Careers', 'Blog']], ['Newsletter', ['Sign up for offers', 'Instagram', 'Facebook']]]),
  ];
};

/* ---------- 5 · Designer, UI/UX portfolio ---------- */
const designer = (): Node[] => {
  const navy = '#16227a'; const blue = '#3b5bff'; const ink = '#0e1033'; const mute = '#5d6190';
  const solution = (t: string, d: string, fill: string) => col(t, [pic(`${t} visual`, 'fill', 120, fill, 14), head(t, 20, '#ffffff', { letterSpacing: 0, fontWeight: 600 }), txt(d, 14, 'rgba(255,255,255,0.72)')], { pad: 20, radius: 20, fill: 'rgba(255,255,255,0.08)', gap: 12 });
  const plan = (t: string, price: string, dark: boolean) => col(t, [txt(t, 14, dark ? '#c9d0ff' : mute, { fontWeight: 600 }), head(price, 40, dark ? '#ffffff' : ink, { letterSpacing: -1 }), ...['Unlimited requests', 'Two active projects', 'Weekly check-ins'].map(l => txt(`✓  ${l}`, 14, dark ? 'rgba(255,255,255,0.8)' : mute)), btn('Choose plan', dark ? '#ffffff' : ink, dark ? navy : '#ffffff', { radius: 12 })], { pad: 28, radius: 24, fill: dark ? navy : '#ffffff', gap: 12 });
  const post = (t: string, c: string) => col(t, [pic(`${t} image`, 'fill', 200, c, 18), txt(t, 16, ink, { fontWeight: 600 })], { gap: 10 });
  return [
    navbar({ brand: 'Pixelwork', links: ['Work', 'Services', 'Pricing', 'Journal'], cta: 'Let’s talk', bg: '#eef0fa', fg: ink, accent: ink, border: '#dde1f4' }),
    sec('Hero', 'linear-gradient(180deg, #eef0fa 0%, #f7f8fd 100%)', [
      head('DESIGNER', 170, '#d9def3', { align: 'center', fontWeight: 800, letterSpacing: -6 }),
      row('Hero row', [pic('Portrait arch', 240, 300, '#3b5bff', 120, { radiusBL: 0, radiusBR: 0 }),
        col('Hero copy', [head('Product, UI/UX & Brand Design', 52, ink, { fontWeight: 700, letterSpacing: -2, w: 560 }), txt('Independent designer helping teams turn ideas into clear, confident digital products.', 17, mute, { w: 460 }), btn('See my work', ink, '#ffffff')], { w: 600, gap: 16 })], { justify: 'center', gap: 40 }),
    ], { padY: 56, gap: 8 }),
    sec('Intro', '#f7f8fd', [row('Intro row', [pic('Portrait', 220, 260, 'linear-gradient(180deg, #c9d2ff 0%, #8da0f0 100%)', 20), head('Investing in digital experiences that connect strategy, usability and visual identity.', 32, ink, { w: 600, fontWeight: 600, letterSpacing: -1 }),
      col('Stats', [head('8+', 36, blue, { letterSpacing: -1 }), txt('Years of experience', 13, mute), head('120', 36, blue, { letterSpacing: -1 }), txt('Projects delivered', 13, mute)], { w: 200, gap: 4 })], { justify: 'between', gap: 40 })], { padY: 56 }),
    sec('Projects', '#f7f8fd', [head('Projects That Delivered Real Impact', 40, ink, { fontWeight: 700, w: 640 }),
      col('Featured project', [pic('Project mock-up', 'fill', 300, '#8da0f0', 20, {}, 'blocks'), row('Project meta', [col('Project copy', [head('Orbit banking app', 22, ink, { letterSpacing: 0 }), txt('Redesign that lifted weekly activation by 34%.', 14, mute)], { w: 520, gap: 4 }), btn('View case', ink, '#ffffff')], { justify: 'between' })], { pad: 20, radius: 28, fill: '#ffffff', gap: 16 })], { padY: 56 }),
    sec('Solutions', navy, [head('Design Solutions Built for Growth', 40, '#ffffff', { align: 'center', fontWeight: 700, w: 700, self: 'center' }),
      grid('Solution cards', 3, [solution('Branding', 'Identity systems that feel like you.', '#4a63ff'), solution('UI/UX design', 'Interfaces shaped by research.', '#7f9bff'), solution('Web design', 'Fast, responsive marketing sites.', '#a8b9ff'), solution('Design systems', 'Components your team can reuse.', '#6b7cff'), solution('Prototyping', 'Clickable flows before you build.', '#8da0f0'), solution('Workshops', 'Half-day sessions to align teams.', '#5c75ff')], 20)], { padY: 88 }),
    sec('Pricing', '#f7f8fd', [head('Flexible design support for growing brands', 36, ink, { align: 'center', fontWeight: 700, w: 640, self: 'center' }), grid('Plans', 2, [plan('Monthly retainer', '$3,900', true), plan('Single project', '$6,500', false)], 24)], { padY: 80 }),
    sec('Testimonial', '#f7f8fd', [row('Testimonial row', [col('Quote', [txt('“Clear thinking, beautiful execution. They changed how our whole team approaches product design.”', 20, ink, { fontWeight: 500 }), txt('Amara Osei · Head of Product, Orbit', 13, mute)], { w: 640, pad: 28, radius: 24, fill: '#ffffff', gap: 12 }), pic('Client photo', 320, 220, 'linear-gradient(160deg, #c9d2ff 0%, #6b7cff 100%)', 24)], { justify: 'between', gap: 24, items: 'stretch' })], { padY: 24 }),
    sec('Call to action', '#f7f8fd', [col('CTA card', [head('Ready to start something great?', 40, '#ffffff', { align: 'center', fontWeight: 700, w: 640, self: 'center' }), btn('Book a call', '#ffffff', navy, { self: 'center' })], { items: 'center', pad: 56, radius: 32, fill: `linear-gradient(135deg, ${blue} 0%, ${navy} 100%)`, gap: 16 })], { padY: 40 }),
    sec('Journal', '#f7f8fd', [head('Where creativity meets strategy', 36, ink, { fontWeight: 700 }), grid('Journal cards', 3, [post('Designing for clarity', '#cfd8ff'), post('Systems that scale', '#b8c4f5'), post('Notes on craft', '#dde3fb')], 20)], { padY: 56 }),
    footer('#0e1033', '#ffffff', '#a4a9d6', 'Pixelwork', ['Dribbble', 'LinkedIn', 'Contact']),
  ];
};

/* ---------- 6 · Dashboard, transactions ---------- */
const dashboard = (): Node[] => {
  const ink = '#111111'; const mute = '#8a8a93'; const line = '#ececf0';
  const medium: Record<string, [string, string]> = { Mastercard: ['#ebe8ff', '#5b3df5'], 'American Express': ['#dff5e8', '#1a8f5a'], Discover: ['#f1f1f3', '#55555e'], Visa: ['#fff3c4', '#8f7000'] };
  const rows: [string, string, string, string, string][] = [['Liam O’Connor', '22 Sep · 9:18 AM', '#763001', 'Mastercard', '$ 47,689'], ['Sophia Martinez', '21 Sep · 3:42 PM', '#892137', 'American Express', '$ 34,500'], ['Noah Johnson', '20 Sep · 1:05 PM', '#451267', 'Discover', '$ 28,920'], ['Emma Williams', '19 Sep · 11:40 AM', '#317845', 'Visa', '$ 40,302'], ['Ava Brown', '18 Sep · 4:15 PM', '#120457', 'Mastercard', '$ 55,778'], ['Oliver Davis', '17 Sep · 2:20 PM', '#678934', 'American Express', '$ 46,883'], ['Isabella Garcia', '16 Sep · 9:30 AM', '#236578', 'Discover', '$ 37,140'], ['Elijah Rodriguez', '15 Sep · 6:48 PM', '#912308', 'Visa', '$ 62,015']];
  const hideOnPhone: Partial<Node> = { bp: { mobile: { display: 'none' } } };
  const trow = (r: [string, string, string, string, string]) => row(`${r[0]} row`, [
    row(`${r[0]} person`, [pic(`${r[0]} avatar`, 32, 32, '#d9c7b8', 999), txt(r[0], 13, ink, { w: 'auto', fontWeight: 600 })], { w: 190, gap: 10, wrap: false }),
    txt(r[1], 13, mute, { w: 150 }, hideOnPhone), txt(r[2], 13, mute, { w: 90 }, hideOnPhone),
    txt(r[3], 12, medium[r[3]][1], { w: 130, padX: 10, padY: 4, radius: 6, fill: medium[r[3]][0], fontWeight: 600, align: 'center' }, hideOnPhone),
    txt(r[4], 13, ink, { w: 100, fontWeight: 600, align: 'right' }),
  ], { wrap: false, items: 'center', justify: 'between', padY: 12, stroke: line, strokeWidth: 0, borderB: 1, gap: 12 });
  const thead = row('Table header', ['Title', 'Date & time', 'Invoice', 'Medium', 'Amount'].map((t, i) => txt(t, 12, mute, { w: [190, 150, 90, 130, 100][i], fontWeight: 600, align: i === 4 ? 'right' : 'left' }, i > 0 && i < 4 ? hideOnPhone : {})), { wrap: false, items: 'center', justify: 'between', padY: 10, stroke: line, strokeWidth: 0, borderB: 1, gap: 12 });
  const menu = (t: string, on = false) => txt(t, 14, on ? '#ffffff' : '#b4b4bd', { padX: 14, padY: 10, radius: 10, fill: on ? '#25252b' : undefined, fontWeight: on ? 600 : 500 });
  const sidebar = col('Sidebar', [
    txt('Money T', 20, '#ffffff', { fontWeight: 700 }), txt('MENU', 11, '#6f6f78', { letterSpacing: 1.5 }),
    col('Menu items', [menu('Dashboard'), menu('Transactions', true), menu('Card'), menu('Analytics'), menu('History')], { gap: 2 }),
    txt('GENERAL', 11, '#6f6f78', { letterSpacing: 1.5 }), col('General items', [menu('Setting'), menu('Help Center')], { gap: 2 }),
    col('Upgrade card', [head('Switch to Pro', 20, '#ffffff', { letterSpacing: 0, fontWeight: 600 }), txt('Unlock advanced analytics and priority support.', 12, 'rgba(255,255,255,0.7)')], { pad: 20, radius: 16, fill: 'linear-gradient(160deg, #3a2a6b 0%, #14101f 100%)', gap: 6, mt: 24 }),
    txt('Log out', 14, '#b4b4bd', { padX: 14, padY: 10 }),
  ], { w: 250, grow: 0, fill: ink, pad: 24, gap: 14 }, { bp: { tablet: { display: 'none' } } });
  const main = col('Main', [
    row('Page header', [head('Transactions', 30, ink, { w: 'auto', letterSpacing: -1 }), txt('Search anything   ⌘ K', 13, mute, { w: 260, padX: 16, padY: 10, radius: 999, stroke: line, strokeWidth: 1 })], { justify: 'between' }),
    col('Transactions card', [txt('Latest transaction', 14, ink, { fontWeight: 700 }), thead, ...rows.map(trow),
      krow('Pagination', ['1', '2', '3', '4', '5', '→'].map((n, i) => txt(n, 13, i === 0 ? '#ffffff' : ink, { w: 32, h: 32, padY: 6, radius: 8, fill: i === 0 ? ink : '#f3f3f5', align: 'center' })), { gap: 6, mt: 12 })], { pad: 20, radius: 16, stroke: line, strokeWidth: 1, gap: 4 }),
  ], { grow: 1, pad: 32, gap: 20, fill: '#ffffff' }, { bp: { mobile: { pad: 16 } } });
  // Below desktop the sidebar folds into the standard hamburger navbar
  const topNav = navbar({ brand: 'Money T', links: ['Dashboard', 'Transactions', 'Card', 'Analytics', 'History'], cta: 'Switch to Pro', bg: ink, fg: '#ffffff', accent: '#ffffff', ctaColor: ink, st: { display: 'none' }, bp: { tablet: { display: 'flex' }, mobile: { display: 'flex' } } });
  return [
    topNav,
    sec('App', undefined, [row('Window', [sidebar, main], { wrap: false, items: 'stretch', gap: 0, radius: 28, overflow: 'hidden', fill: '#ffffff', stroke: 'rgba(255,255,255,0.7)', strokeWidth: 1, shadowCss: '0px 24px 60px rgba(120,40,90,0.2)' })], { padX: 48, padY: 48 }),
  ];
};

/* ---------- 7 · Market, multi-vendor store ---------- */
const market = (): Node[] => {
  const ink = '#16161a'; const mute = '#6b6b75'; const violet = '#5b3df5'; const orange = '#ff6a3d';
  const product = (n: string, c: string, price: string) => col(n, [pic(`${n} image`, 'fill', 130, c, 8, {}, 'product'), txt(n, 12, ink, { fontWeight: 500 }), txt(price, 14, ink, { fontWeight: 700 }), txt(`★ ${(4.3 + (seedOf(n + price) % 7) / 10).toFixed(1)} · Sold ${120 + (seedOf(n + price) * 37) % 880}`, 11, mute)], { gap: 4, pad: 8, radius: 10, stroke: '#ececf0', strokeWidth: 1, fill: '#ffffff' });
  const promo = (t: string, d: string, c: string) => col(t, [head(t, 22, '#ffffff', { letterSpacing: 0, fontWeight: 700 }), txt(d, 13, 'rgba(255,255,255,0.9)')], { h: 150, justify: 'center', padX: 28, radius: 12, fill: c, gap: 6, ...bgImg(t, c, 'rgba(0,0,0,0.32)') });
  const cat = (n: string, c: string) => col(n, [blob(`${n} icon`, 56, 56, c, 14), txt(n, 13, ink, { align: 'center', fontWeight: 500 })], { items: 'center', pad: 14, radius: 12, stroke: '#ececf0', strokeWidth: 1, fill: '#ffffff', gap: 8 });
  const tints = ['#e4e1ee', '#f0dcd0', '#d6e4e0', '#e9e2c9', '#d7dce8', '#ecd5da'];
  const names = ['Wireless headphones', 'Smart watch', 'Acoustic guitar', 'Denim jacket', 'Perfume 50ml', 'Skincare set'];
  return [
    sec('Announcement', '#f4f4f6', [txt('Free delivery on orders over $50 · Use code EMMA10', 12, mute, { align: 'center' })], { padY: 8 }),
    navbar({ brand: 'Emmaele', links: ['All category', 'Flash sale', 'Promo', 'Sell with us'], cta: 'Login', bg: '#ffffff', fg: ink, accent: violet, border: '#ececf0', brandSize: 24 }),
    sec('Search', '#ffffff', [txt('Search for products, brands and shops', 14, mute, { padX: 18, padY: 12, radius: 10, stroke: '#d9d9e0', strokeWidth: 1 })], { padY: 12, padX: 56 }),
    sec('Hero', '#ffffff', [col('Offer banner', [txt('END YEAR SALE · 1–10 DECEMBER', 12, 'rgba(255,255,255,0.9)', { letterSpacing: 2 }), head('SPECIAL OFFER', 56, '#ffffff', { fontWeight: 800, letterSpacing: -1 }), head('40% OFF', 72, '#ffd84d', { fontWeight: 800, letterSpacing: -2 }), btn('Shop now', '#ffffff', '#0b6b72', { radius: 8 })], { h: 300, justify: 'center', padX: 56, radius: 20, gap: 8, fill: 'linear-gradient(120deg, #0b6b72 0%, #12b3c9 100%)', ...bgImg('Offer banner', '#0b6b72', 'rgba(0,0,0,0.2)', 'glow') })], { padY: 16, padX: 56 }),
    sec('Flash sale', '#ffffff', [krow('Flash header', [head('Flash Sale', 22, ink, { w: 'auto', letterSpacing: 0 }), txt('02 : 15 : 33', 12, '#ffffff', { w: 'auto', padX: 10, padY: 4, radius: 6, fill: orange, fontWeight: 700 }), link('See all', violet)], { gap: 12 }), grid('Flash products', 6, names.map((n, i) => product(n, tints[i], `$${(19 + i * 14).toFixed(2)}`)), 12, 2, 3)], { padY: 24, padX: 56, gap: 16 }),
    sec('Official stores', '#ffffff', [head('Official Store', 22, ink, { letterSpacing: 0 }), grid('Store logos', 6, ['AUKEY', 'SAMSUNG', 'PHILIPS', 'SECOND', 'HOBBLER', 'WINDER'].map(n => col(n, [head(n, 14, ink, { align: 'center', letterSpacing: 1, fontWeight: 800 })], { padY: 22, radius: 10, stroke: '#ececf0', strokeWidth: 1, fill: '#ffffff', items: 'center' })), 12, 3, 3)], { padY: 24, padX: 56, gap: 16 }),
    sec('Promotions', '#ffffff', [head('Today’s Promotions', 22, ink, { letterSpacing: 0 }), grid('Promo tiles', 2, [promo('Skincare 35% off', 'Glow-ready bundles', '#c2873a'), promo('Gadgets 15% off', 'Selected accessories', '#4a4a52'), promo('Special discount $8', 'On your first order', '#ee6f99'), promo('Cashback 20%', 'Music gear and more', '#7f8a4a')], 16)], { padY: 24, padX: 56, gap: 16 }),
    sec('Popular categories', '#ffffff', [head('Popular Categories', 22, ink, { letterSpacing: 0 }), grid('Category tiles', 6, ([['Beauty', '#f7c6d4'], ['Gaming', '#c6d9f7'], ['Computers', '#f7e1c6'], ['Health', '#f7c6c6'], ['Outdoors', '#cdeccd'], ['Fashion', '#d9c6f7']] as [string, string][]).map(([n, c]) => cat(n, c)), 12, 3, 3)], { padY: 24, padX: 56, gap: 16 }),
    sec('For you', '#ffffff', [head('Products you may like', 22, ink, { letterSpacing: 0 }), grid('Product grid', 6, Array.from({ length: 12 }, (_, i) => product(['Linen shirt', 'Pocket guitar', 'Face serum', 'Canvas tote', 'Desk lamp', 'Amp mini', 'Running sneakers', 'Aviator sunglasses', 'Wool beanie', 'Hooded sweatshirt', 'Leather backpack', 'Over-ear headphones'][i % 12], tints[(i + 2) % 6], `$${(9 + i * 7).toFixed(2)}`)), 12, 2, 3)], { padY: 24, padX: 56, gap: 16 }),
    footerCols('#ffffff', ink, mute, 'Emmaele', 'Shop trusted sellers in one place.', [['Company', ['About', 'Careers', 'Press']], ['Buyers', ['How to buy', 'Returns', 'Help']], ['Sellers', ['Open a shop', 'Seller centre', 'Fees']]]),
  ];
};

/* ---------- 8 · Velour, editorial fashion ---------- */
const velour = (): Node[] => {
  const ink = '#0d0d0d'; const bg = '#ececea'; const orange = '#ff5a14'; const mute = '#5f5f5a';
  const look = (n: string, c: string, h: number, price: string) => col(n, [pic(`${n} image`, 'fill', h, c, 6, {}, 'portrait'), krow(`${n} meta`, [txt(n, 13, ink, { w: 'auto', fontWeight: 600 }), txt(price, 13, mute, { w: 'auto' })], { justify: 'between' })], { gap: 8 });
  const cats: [string, number][] = [['Shirt', 174], ['Jacket', 361], ['Jeans', 368], ['Outer', 117], ['Shoes', 78]];
  return [
    navbar({ brand: 'VELOUR', links: ['Shop', 'Collections', 'Journal', 'About'], cta: 'Bag (2)', bg, fg: ink, accent: ink, brandSize: 22 }),
    sec('Hero', bg, [
      row('Hero stage', [head('where - style', 96, ink, { w: 'auto', fontWeight: 500, letterSpacing: -4 }), pic('Model photo', 340, 520, 'linear-gradient(180deg, #d9d9d4 0%, #8e8e86 100%)', 8), head('lives - now', 96, ink, { w: 'auto', fontWeight: 500, letterSpacing: -4 })], { justify: 'between', items: 'end', gap: 24 }),
      row('Hero meta', [txt('Explore curated collections, exclusive drops and everyday essentials thoughtfully designed in one stylish shopping destination.', 14, mute, { w: 420 }), col('Audience', [head('280K', 32, ink, { w: 'auto', letterSpacing: -1 }), txt('People we inspire', 12, mute)], { w: 200, gap: 2 })], { justify: 'between', items: 'end' }),
    ], { padY: 40, padX: 56 }),
    sec('Brands', '#000000', [krow('Brand names', ['Slack', 'Dropbox', 'Webflow', 'Spotify', 'Remessa'].map(n => txt(n, 16, '#ffffff', { w: 'auto', fontWeight: 700 })), { justify: 'between' })], { padY: 20, padX: 56 }),
    sec('Moments', bg, [head('All - about moments ©26', 80, ink, { fontWeight: 500, letterSpacing: -3 }),
      grid('Looks', 3, [look('Field jacket', 'linear-gradient(180deg, #d8c9b0 0%, #9c8664 100%)', 420, '$120'), look('Graphic bomber', 'linear-gradient(180deg, #cfcfcf 0%, #7a2a2a 100%)', 420, '$145'), look('Alpine shell', 'linear-gradient(180deg, #e8e4dc 0%, #ff8a4d 100%)', 420, '$180')], 20),
      btn('Learn more', 'transparent', ink, { stroke: ink, strokeWidth: 1, radius: 999 })], { padY: 56, padX: 56 }),
    sec('Categories', bg, [row('Category row', [
      col('Category copy', [txt('Every piece carries a story of tailoring, motion and meaning.', 15, mute, { w: 360 }), btn('See product', ink, '#ffffff')], { w: 380, gap: 14 }),
      pic('Look photo', 340, 380, 'linear-gradient(180deg, #e8e4dc 0%, #b8b2a2 100%)', 8),
      col('Category list', cats.map(([n, c]) => head(`${n} (${c})`, 40, n === 'Jacket' ? orange : '#a2a29a', { w: 'auto', align: 'right', fontWeight: 500, letterSpacing: -1 })), { w: 360, items: 'end', gap: 4 }),
    ], { justify: 'between', items: 'center', gap: 24 })], { padY: 56, padX: 56 }),
    sec('Review', bg, [col('Review card', [txt('“Everything is absolutely perfect! From the fabric quality to the flawless fit, every piece feels premium. This brand has completely transformed my wardrobe.”', 26, ink, { align: 'center', fontWeight: 500, w: 820, self: 'center' }), txt('★★★★★  5.0 (68 reviews)', 13, orange, { align: 'center' })], { items: 'center', gap: 14 })], { padY: 72, padX: 56 }),
    footer('#0d0d0d', '#ffffff', '#9a9a94', 'VELOUR', ['Instagram', 'Pinterest', 'Contact']),
  ];
};

/* ---------- 9 · Mortgage, serif and blue ---------- */
const mortgage = (): Node[] => {
  const ink = '#111111'; const mute = '#6b6b6b'; const blue = '#1f5bff'; const serif = 'Georgia, "Times New Roman", serif'; const grey = '#f4f4f4';
  const H = (t: string, size: number, color = ink, st: St = {}) => head(t, size, color, { font: serif, fontWeight: 400, letterSpacing: -1.5, lineHeight: 1.08, ...st });
  const stat = (v: string, l: string) => col(`${l} stat`, [H(v, 44, ink, { w: 'auto' }), txt(l, 14, mute)], { pad: 24, radius: 12, fill: grey, gap: 4 });
  const year = (y: string, v: string, h: number) => col(`${y} year`, [txt(y, 13, mute), txt(v, 20, ink, { fontWeight: 500, mt: h })], { pad: 20, h: 260, stroke: '#e5e5e5', strokeWidth: 1, gap: 8, justify: 'between' });
  const route = (t: string) => col(t, [pic(`${t} image`, 'fill', 170, '#7aa0c8', 16), txt(t, 16, ink, { fontWeight: 600 }), link('Learn more', mute)], { gap: 10 });
  return [
    navbar({ brand: 'Total', links: ['Platform', 'Customers', 'About', 'Resources'], cta: 'Get a demo', bg: '#ffffff', fg: ink, accent: ink, border: '#eeeeee', brandSize: 22 }),
    sec('Hero', '#ffffff', [
      txt('★★★★★  4.9 / 5 from 3,200 reviews', 13, mute, { align: 'center' }),
      H('Trusted Mortgage Brokers', 72, ink, { align: 'center', w: 820, self: 'center' }),
      txt('Modern mortgage advisers dedicated to making a difference in everyday life.', 18, mute, { align: 'center', w: 520, self: 'center' }),
      row('Hero buttons', [btn('Buy a Home', ink, '#ffffff'), btn('Book a Call', 'transparent', ink, { stroke: '#d4d4d4', strokeWidth: 1 })], { justify: 'center', gap: 12 }),
      col('Overview card', [krow('Overview head', [txt('Overview', 15, ink, { w: 'auto', fontWeight: 600 }), txt('Live agents · 14,642', 12, mute, { w: 'auto' })], { justify: 'between' }), barChart('Funding chart', [18, 26, 24, 38, 46, 44, 62, 70, 66, 88, 100], '#1f5bff', '#cdd9ff', 260)], { w: 760, self: 'center', pad: 20, radius: 20, fill: '#ffffff', stroke: '#e5e5e5', strokeWidth: 1, gap: 14 }),
    ], { padY: 64, gap: 20 }),
    sec('Modern mortgage', '#ffffff', [row('Modern row', [
      col('Modern copy', [H('Modern Mortgage Real People', 52, ink, { w: 520 }), txt('AI does the paperwork. Your loan officer does the thinking. You get a faster, clearer path home.', 16, mute, { w: 440 })], { w: 560, gap: 14 }),
      col('Funding stat', [txt('Total Funding', 16, ink), H('850M', 96, ink, { w: 'auto', letterSpacing: -4 })], { w: 320, gap: 4 }),
    ], { justify: 'between', items: 'end', gap: 40 })], { padY: 56 }),
    sec('Timeline', '#ffffff', [grid('Years', 4, [year('2021', '110M (Early Stage)', 120), year('2023', '300M (DBS Group)', 80), year('2024', '350M (VC Fund)', 40), year('2026', '150M (Series A)', 0)], 0, 1, 2)], { padY: 8, padX: 72 }),
    sec('Agent', '#ffffff', [row('Agent row', [
      pic('Adviser photo', 460, 400, '#c79a73', 24, {}, 'portrait'),
      col('Agent copy', [txt('AI Agent', 13, blue, { fontWeight: 600 }), H('Cash from your home, cheaper', 44, ink, { w: 440 }), txt('Access equity to fund bigger dreams with a lower payment and a single monthly statement.', 16, mute, { w: 420 }), btn('Refinance now', ink, '#ffffff')], { w: 480, gap: 14 }),
    ], { justify: 'between', gap: 40 })], { padY: 56 }),
    sec('Existing customers', '#ffffff', [H('Bring Existing Customers', 40, ink, { align: 'center' }), txt('Get a personalised quote for your rates in as little as 3 minutes, with no impact to your credit score.', 16, mute, { align: 'center', w: 540, self: 'center' }),
      grid('Numbers', 3, [stat('-5x', 'Refinance rates'), stat('96%', 'Gets beat on lower rate'), stat('2.5x', 'Better than other mortgage')], 16)], { padY: 56 }),
    sec('Routes', '#ffffff', [H('Refreshing your finances?', 40, ink, { align: 'center' }), grid('Route cards', 3, [route('Buy a Home'), route('Re-Finance'), route('Get Cash From Home')], 20)], { padY: 56 }),
    sec('Call to action', '#ffffff', [col('CTA card', [H('Ready for your next move?', 44, '#ffffff', { align: 'center', w: 640, self: 'center' }), txt('Let’s bring your dream home within reach.', 16, 'rgba(255,255,255,0.85)', { align: 'center' }), btn('Book a call', '#ffffff', blue, { self: 'center' })], { items: 'center', pad: 56, radius: 28, fill: blue, gap: 16 })], { padY: 32, padB: 72 }),
    footerCols(ink, '#ffffff', '#a3a3a3', 'Total', 'Simple mortgage advice from real people.', [['Platform', ['Buy a home', 'Refinance', 'Cash out']], ['Company', ['About', 'Careers', 'Press']], ['Resources', ['Guides', 'Rates', 'Contact']]]),
  ];
};

/* ---------- 10 · Tasks, SaaS productivity ---------- */
const tasks = (): Node[] => {
  const ink = '#14121f'; const mute = '#6b6880'; const violet = '#7c3aed'; const deep = '#0f3d2e'; const mint = '#e6f7e1';
  const feature = (t: string, d: string, c: string) => col(t, [pic(`${t} visual`, 'fill', 110, c, 14), head(t, 18, ink, { letterSpacing: 0, fontWeight: 700 }), txt(d, 14, mute)], { pad: 18, radius: 20, fill: '#ffffff', stroke: '#ebe8f5', strokeWidth: 1, gap: 12 });
  const task = (t: string, tag: string, on: boolean) => krow(`${t} task`, [txt(`${on ? '✓' : '○'}  ${t}`, 14, ink, { w: 'auto', fontWeight: 500 }), txt(tag, 11, violet, { w: 'auto', padX: 10, padY: 3, radius: 999, fill: '#f1eaff', fontWeight: 600 })], { justify: 'between', padY: 10, borderB: 1, stroke: '#eeeaf7', strokeWidth: 0 });
  const quote = (q: string, who: string) => col(who, [txt(`“${q}”`, 16, ink, { fontWeight: 500 }), krow(`${who} person`, [pic(`${who} photo`, 40, 40, '#d9a88a', 999), txt(who, 13, mute, { w: 'auto' })], { gap: 10, justify: 'start' })], { pad: 24, radius: 20, fill: '#ffffff', stroke: '#ebe8f5', strokeWidth: 1, gap: 16 });
  const post = (t: string) => col(t, [pic(`${t} image`, 'fill', 190, '#a99aff', 18), txt(t, 16, ink, { fontWeight: 600 }), link('Read more →', violet)], { gap: 10 });
  const stat = (v: string, l: string) => col(l, [head(v, 40, violet, { letterSpacing: -1 }), txt(l, 14, mute)], { gap: 2, pad: 20, radius: 16, fill: '#ffffff', stroke: '#ebe8f5', strokeWidth: 1 });
  return [
    navbar({ brand: 'Unflock', links: ['Features', 'Pricing', 'Stories', 'FAQ'], cta: 'Try for free', bg: '#f1fbec', fg: ink, accent: ink, ctaColor: '#ffffff' }),
    sec('Hero', 'linear-gradient(180deg, #f1fbec 0%, #ffffff 100%)', [
      head('Manage task efficiently, anytime', 64, ink, { align: 'center', fontWeight: 800, letterSpacing: -2, w: 780, self: 'center' }),
      txt('Plan your day, share work with your team and finish what matters, from one calm workspace.', 18, mute, { align: 'center', w: 540, self: 'center' }),
      row('Hero buttons', [btn('Get started', violet, '#ffffff'), btn('Watch demo', 'transparent', ink, { stroke: '#cfd2dc', strokeWidth: 1 })], { justify: 'center', gap: 12 }),
      col('Task board', [krow('Board head', [head('Today', 20, ink, { w: 'auto', letterSpacing: 0 }), txt('4 of 6 done', 12, mute, { w: 'auto' })], { justify: 'between' }), task('Review launch checklist', 'Product', true), task('Reply to design feedback', 'Design', true), task('Plan next sprint', 'Team', false), task('Send weekly update', 'Admin', false)], { w: 640, self: 'center', pad: 24, radius: 24, fill: '#ffffff', stroke: '#e6e2f3', strokeWidth: 1, shadowCss: '0px 20px 50px rgba(80,60,160,0.12)', gap: 4 }),
    ], { padY: 64 }),
    sec('Productivity', '#ffffff', [head('Modernize your productivity with us', 40, ink, { align: 'center', fontWeight: 800, w: 640, self: 'center' }),
      grid('Feature cards', 3, [feature('Smart lists', 'Group work by project, person or day.', '#bfe8b5'), feature('Quick capture', 'Add a task from anywhere in two taps.', '#cdbcff'), feature('Team boards', 'See who is doing what at a glance.', '#ffd9b8'), feature('Reminders', 'Nudges that arrive when they matter.', '#bcd9ff'), feature('Calendar sync', 'Tasks sit right next to your meetings.', '#ffc9dc'), feature('Insights', 'Weekly reports on where time went.', '#e5e0a0')], 20)], { padY: 80 }),
    sec('Advanced', '#f7f5ff', [row('Advanced row', [
      col('Advanced copy', [head('Advanced features for productivity', 40, ink, { fontWeight: 800, w: 460 }), txt('Automations, recurring tasks and templates keep routine work out of your head.', 16, mute, { w: 440 }), btn('Explore features', ink, '#ffffff')], { w: 500, gap: 16 }),
      pic('Phone mock-up', 360, 420, '#7c3aed', 36, {}, 'mesh'),
    ], { justify: 'between', gap: 48 })], { padY: 80 }),
    sec('Success', '#ffffff', [head('Our success and values', 36, ink, { align: 'center', fontWeight: 800 }), grid('Success stats', 4, [stat('120k', 'Active teams'), stat('4.9', 'App rating'), stat('38%', 'Faster delivery'), stat('99.9%', 'Uptime')], 16, 2, 2)], { padY: 56 }),
    sec('Stories', '#ffffff', [head('What users think about our tool', 36, ink, { align: 'center', fontWeight: 800, w: 640, self: 'center' }), grid('Quotes', 3, [quote('It replaced three apps and our Monday meeting.', 'Amara O.'), quote('Finally a to-do list my whole team actually opens.', 'Daniel K.'), quote('Setup took ten minutes. We never looked back.', 'Priya S.')], 20)], { padY: 56 }),
    sec('FAQ', '#ffffff', [row('FAQ row', [
      col('FAQ intro', [head('Frequently Asked Questions', 36, ink, { fontWeight: 800 }), txt('Everything you need to know before you start.', 15, mute)], { w: 360 }),
      col('FAQ items', [faq([['Is there a free plan?', 'Yes, free for individuals with unlimited tasks.'], ['Can I invite my team?', 'Invite as many people as you like on any paid plan.'], ['Does it work offline?', 'Yes, changes sync as soon as you reconnect.'], ['Can I import from other tools?', 'Import from CSV, Trello and Asana in a few clicks.']], ink, mute, '#e8e5f3')], { grow: 1 }),
    ], { justify: 'between', items: 'start', gap: 48 })], { padY: 72 }),
    sec('Organized', '#ffffff', [col('Organized card', [head('Organized and more productive', 40, ink, { align: 'center', fontWeight: 800, w: 600, self: 'center' }), btn('Start free', violet, '#ffffff', { self: 'center' })], { items: 'center', pad: 56, radius: 32, fill: 'linear-gradient(135deg, #e9e0ff 0%, #f1fbec 100%)', gap: 16 })], { padY: 24 }),
    sec('Blog', '#ffffff', [head('Relied on by startups and enterprises', 32, ink, { fontWeight: 800 }), grid('Posts', 3, [post('How to run a no-meeting Friday'), post('A better weekly planning ritual'), post('Why small teams ship faster')], 20)], { padY: 56 }),
    sec('Call to action', '#ffffff', [col('CTA card', [head('Ready to take control of your work?', 40, '#ffffff', { align: 'center', fontWeight: 800, w: 620, self: 'center' }), row('CTA buttons', [btn('Get started', '#ffffff', deep), btn('Talk to sales', 'transparent', '#ffffff', { stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 })], { justify: 'center', gap: 12 })], { items: 'center', pad: 56, radius: 32, fill: deep, gap: 18 })], { padY: 24, padB: 72 }),
    footerCols('#0b2a20', '#ffffff', 'rgba(255,255,255,0.65)', 'Unflock', 'Tasks that feel light.', [['Product', ['Features', 'Pricing', 'Templates']], ['Company', ['About', 'Blog', 'Careers']], ['Help', ['FAQ', 'Contact', 'Status']]]),
  ];
};

/* ---------- 11 · Finexus, dark dashboard with lime ---------- */
const finexus = (): Node[] => {
  const lime = '#d4ff2a'; const bg = '#0d0d0d'; const panel = '#161616'; const line = '#262626'; const mute = '#8b8b8b'; const green = '#22d081';
  const stat = (l: string, v: string, hot = false) => col(`${l} stat`, [txt(l, 13, hot ? '#111111' : mute), head(v, 28, hot ? '#111111' : '#ffffff', { letterSpacing: -0.5 }), txt('Since last week', 11, hot ? '#3d4a00' : mute)], { pad: 18, radius: 14, fill: hot ? lime : panel, stroke: line, strokeWidth: hot ? 0 : 1, gap: 4 });
  const menu = (t: string, on = false) => txt(t, 14, on ? lime : '#b4b4b4', { padX: 14, padY: 10, radius: 10, fill: on ? '#1f240a' : undefined, stroke: on ? lime : undefined, strokeWidth: on ? 1 : 0, fontWeight: on ? 600 : 500 });
  const bars = [60, 90, 70, 120, 95, 140, 100, 80, 125, 110, 150, 130].map((h, i) => pic(`Bar ${i + 1}`, 18, h, i === 2 ? lime : green, 4, {}, 'blocks'));
  const trow = (n: string, type: string, amt: string, date: string) => row(`${n} row`, [
    row(`${n} person`, [pic(`${n} avatar`, 30, 30, '#c9a68a', 999), txt(n, 13, '#ffffff', { w: 'auto', fontWeight: 600 })], { w: 190, gap: 10, wrap: false }),
    txt(type, 13, mute, { w: 100 }, { bp: { mobile: { display: 'none' } } }), txt(amt, 13, '#ffffff', { w: 100, fontWeight: 600 }), txt(date, 13, mute, { w: 110, align: 'right' }, { bp: { mobile: { display: 'none' } } }),
  ], { wrap: false, items: 'center', justify: 'between', padY: 12, borderB: 1, stroke: line, strokeWidth: 0, gap: 12 });
  const sidebar = col('Sidebar', [
    row('Brand', [txt('◎', 18, lime, { w: 'auto' }), txt('Finexus', 18, '#ffffff', { w: 'auto', fontWeight: 700 })], { gap: 8, wrap: false }),
    txt('MENU', 11, '#5f5f5f', { letterSpacing: 1.5 }),
    col('Menu items', [menu('Dashboard', true), menu('Transactions'), menu('My Wallet'), menu('Invoices'), menu('Money Management'), menu('Tax & Finances'), menu('Reports')], { gap: 2 }),
    txt('PREFERENCE', 11, '#5f5f5f', { letterSpacing: 1.5 }), col('Preference items', [menu('Settings'), menu('Help Center')], { gap: 2 }),
  ], { w: 230, grow: 0, fill: bg, pad: 24, gap: 14, stroke: line, strokeWidth: 0, borderR: 1 }, { bp: { tablet: { display: 'none' } } });
  const main = col('Main', [
    row('Page header', [col('Page title', [head('Overview', 26, '#ffffff', { letterSpacing: -0.5 }), txt('Here is the summary of overall data', 13, mute)], { w: 'auto', gap: 2 }), btn('+ New Payment', lime, '#111111', { radius: 10 })], { justify: 'between' }),
    grid('Stats', 3, [stat('Total Income', '$78,000', true), stat('Total Expense', '$43,000'), stat('Total Savings', '$56,000')], 14, 1, 3),
    row('Middle row', [
      col('Cash flow', [krow('Cash flow head', [txt('Cash Flow', 14, '#ffffff', { w: 'auto', fontWeight: 600 }), txt('This year', 12, mute, { w: 'auto' })], { justify: 'between' }), head('$236,788.12', 24, '#ffffff', { letterSpacing: -0.5 }), krow('Bars', bars, { items: 'end', justify: 'between', gap: 6, h: 160 })], { grow: 2, basis: 380, pad: 20, radius: 16, fill: panel, stroke: line, strokeWidth: 1, gap: 12 }),
      col('Card panel', [txt('VISA', 16, '#ffffff', { fontWeight: 800 }), txt('Linked to main account  ···· 2719', 12, mute), krow('Card buttons', [btn('Receive', '#262626', '#ffffff', { radius: 10, grow: 1 }), btn('Send', lime, '#111111', { radius: 10, grow: 1 })], { gap: 8 })], { grow: 1, basis: 240, pad: 20, radius: 16, fill: panel, stroke: line, strokeWidth: 1, gap: 14 }),
    ], { items: 'stretch', gap: 14 }),
    col('Transactions card', [txt('Transactions', 14, '#ffffff', { fontWeight: 600 }), trow('Kristin Watson', 'Withdraw', '- $500.00', '10 Aug, 2024'), trow('Guy Hawkins', 'Transfer', '- $250.00', '11 Aug, 2024'), trow('Upwork', 'Request', '+ $1,250.00', '09 Aug, 2024'), trow('Facebook Ads', 'Request', '+ $1,250.00', '09 Aug, 2024'), trow('Cody Fisher', 'Request', '+ $1,250.00', '09 Aug, 2024')], { pad: 20, radius: 16, fill: panel, stroke: line, strokeWidth: 1, gap: 2 }),
  ], { grow: 1, pad: 28, gap: 16, fill: '#121212' }, { bp: { mobile: { pad: 16 } } });
  const topNav = navbar({ brand: 'Finexus', links: ['Dashboard', 'Transactions', 'My Wallet', 'Invoices', 'Reports'], cta: 'New payment', bg: bg, fg: '#ffffff', accent: lime, ctaColor: '#111111', st: { display: 'none' }, bp: { tablet: { display: 'flex' }, mobile: { display: 'flex' } } });
  return [topNav, sec('App', undefined, [row('Window', [sidebar, main], { wrap: false, items: 'stretch', gap: 0, radius: 20, overflow: 'hidden', fill: bg, stroke: line, strokeWidth: 1 })], { padX: 40, padY: 40 })];
};

/* ---------- 12 · Art shop, posters and prints ---------- */
const artshop = (): Node[] => {
  const ink = '#10131a'; const mute = '#5f6675'; const sky = '#a9cdfb'; const sun = '#ffe666';
  const palettes = ['#e6a23c', '#7aa6a0', '#4aa36b', '#e07a8a', '#d7c6a8', '#d96b4b', '#4a6fd1', '#9b7ad6'];
  const kinds: ArtKind[] = ['dunes', 'arches', 'blocks', 'mesh', 'waves', 'blocks', 'dunes', 'arches'];
  const work = (n: string, price: string, i: number) => col(n, [pic(`${n} print ${i + 1}`, 'fill', 240, palettes[i % 8], 6, {}, kinds[i % 8]), krow(`${n} meta`, [txt(n, 14, ink, { w: 'auto', fontWeight: 600 }), txt(price, 13, mute, { w: 'auto' })], { justify: 'between' }), btn('Quick add', '#f1f1ee', ink, { radius: 6, padY: 8, fontSize: 12 })], { gap: 8 });
  const fan = (n: string) => col(n, [pic(`${n} customer photo`, 'fill', 220, '#c8a88c', 18, {}, 'portrait'), txt(`@${n.toLowerCase().replace(' ', '')}`, 12, mute)], { gap: 6 });
  return [
    navbar({ brand: 'Art.ai', links: ['Home', 'About us', 'Blog', 'Cart (2)'], cta: 'New feature', bg: '#ffffff', fg: ink, accent: ink, border: '#eeeeee', brandSize: 22 }),
    sec('Hero', '#ffffff', [col('Hero banner', [head('Shop artworks', 64, ink, { align: 'center', fontWeight: 600, letterSpacing: -2 }), txt('Browse the collection and support emerging creative talent. Fill your space with work that inspires, entertains and resonates with you.', 15, ink, { align: 'center', w: 520, self: 'center' })], { items: 'center', justify: 'center', h: 280, pad: 40, radius: 28, fill: sky, gap: 12, ...bgImg('Hero banner', '#a9cdfb', 'rgba(255,255,255,0.35)', 'waves') })], { padY: 32, padX: 56 }),
    sec('Trending', '#ffffff', [row('Trending header', [head('Trending artworks', 32, ink, { w: 'auto', letterSpacing: -1, fontWeight: 600 }), krow('Filters', ['All', 'This month', 'Photography', 'Graphic design', 'Mixed media'].map((l, i) => pill(l, i === 0, ink)), { w: 'auto', gap: 8 })], { justify: 'between' }),
      grid('Artwork grid', 4, [work('The protector', '$52', 0), work('Grow your own', '$40', 1), work('Totem bird blue', '$46', 2), work('True one', '$38', 3), work('Aloha', '$44', 4), work('Cin cin', '$36', 5), work('Ampersand', '$48', 6), work('Sweet dreams', '$42', 7)], 20, 2)], { padY: 40, padX: 56 }),
    sec('Combo offer', '#ffffff', [row('Combo row', [
      col('Combo card', [head('Our combo offer for this season', 36, ink, { fontWeight: 600, letterSpacing: -1, w: 400 }), txt('Mix and match three prints and save on framing for your whole wall.', 15, ink, { w: 400 }), btn('Explore all', ink, '#ffffff')], { grow: 1, basis: 360, pad: 40, radius: 28, fill: sun, gap: 14, justify: 'center' }),
      pic('Framed combo print', 460, 320, '#6a8fd8', 28, {}, 'blocks'),
    ], { items: 'stretch', gap: 20 })], { padY: 24, padX: 56 }),
    sec('Top of the month', '#ffffff', [head('Top of the month', 28, ink, { fontWeight: 600, letterSpacing: -0.5 }), grid('Top grid', 4, [work('Grow your own', '$40', 1), work('The protector', '$52', 0), work('True one', '$38', 3), work('Totem bird blue', '$46', 2)], 20, 2)], { padY: 40, padX: 56 }),
    sec('Customers', '#ffffff', [head('Happy customers, happy walls', 32, ink, { align: 'center', fontWeight: 600, letterSpacing: -1 }), txt('See how our customers love to dip about their walls with Art.ai creations.', 14, mute, { align: 'center' }), grid('Customer photos', 4, [fan('Mia Chen'), fan('Omar Haddad'), fan('Lena Okafor'), fan('Jonas Berg')], 16, 2)], { padY: 56, padX: 56 }),
    sec('Newsletter', 'linear-gradient(180deg, #ffffff 0%, #cfe3ff 100%)', [head('Subscribe to our newsletter for regular updates', 32, ink, { align: 'center', fontWeight: 600, letterSpacing: -1, w: 560, self: 'center' }), row('Signup', [txt('Your email address', 14, mute, { w: 280, padX: 18, padY: 12, radius: 999, fill: '#ffffff', stroke: '#d4dbe8', strokeWidth: 1 }), btn('Subscribe', '#2f6df6', '#ffffff')], { justify: 'center', gap: 10 })], { padY: 72 }),
    footerCols('#ffffff', ink, mute, 'Art.ai', 'Prints from independent artists.', [['Shop', ['New arrivals', 'Best sellers', 'Frames']], ['Help', ['Order tracking', 'Shipping policy', 'Wholesale']], ['Follow', ['Instagram', 'Facebook', 'Twitter']]]),
  ];
};

const BUILDERS: Partial<Record<PresetId, () => Node[]>> = { finance, fintech, brand, dress, designer, dashboard, market, velour, mortgage, tasks, finexus, artshop };
const PAGE_BG: Partial<Record<PresetId, string>> = { dashboard: 'linear-gradient(135deg, #ffd6e0 0%, #ff9ec4 55%, #ffe3cf 100%)', velour: '#ececea', designer: '#eef0fa', finexus: '#1a1a1a' };

/** Builds the pages of a full-page template, or null for ids that are handled elsewhere. */
export function templatePages(id: PresetId): Page[] | null {
  TPL_ASSETS = []; PICKS = {}; MOOD = MOODS[MOOD_OF[id] || 'tech'];
  const build = BUILDERS[id]; if (!build) return null;
  const page = makePage('Home', build());
  if (PAGE_BG[id]) page.root.style = { ...page.root.style, fill: PAGE_BG[id] };
  return [page];
}
