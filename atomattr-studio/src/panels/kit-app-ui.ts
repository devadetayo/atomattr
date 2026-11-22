/**
 * Shared builders for kit-app-ranges.ts, kit-app-screens.ts and kit-app-blocks.ts.
 * Only functions and constants here: nothing may call kit.ts helpers at module load (kit.ts imports these files).
 */
import type { Node } from '../document/types';
import { makeHeading, makeInput, makeSection, mk } from '../document/factory';
import { stack, label, hint, textBtn } from './kit';

export type St = NonNullable<Node['style']>;
export const ACCENT = '#4f46e5';

const D = {
  chart: 'M3 3v18h18M7 16v-5M12 16V8M17 16v-8', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  calendar: 'M3 6h18v15H3zM16 2v4M8 2v4M3 10h18', folder: 'M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', bag: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  play: 'M6 4l14 8-14 8z', pause: 'M6 4h4v16H6zM14 4h4v16h-4z', next: 'M5 4l10 8-10 8zM19 5v14', prev: 'M19 20L9 12l10-8zM5 19V5',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6', dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', upload: 'M16 16l-4-4-4 4M12 12v9M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3',
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  more: 'M12 12h.01M19 12h.01M5 12h.01', right: 'M9 18l6-6-6-6', up: 'M7 17L17 7M7 7h10v10', volume: 'M11 5L6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14',
  volLow: 'M11 5L6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07', sun: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  check: 'M20 6L9 17l-5-5', star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z', heart: 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.4 4.5c2 0 3.6 1.1 4.6 2.7h2c1-1.6 2.6-2.7 4.6-2.7 3.7 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z',
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35', bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', plus: 'M12 5v14M5 12h14', card: 'M2 5h20v14H2zM2 10h20', lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6', zap: 'M13 2L3 14h9l-1 8 10-12h-9z', globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', layers: 'M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5', code: 'M16 18l6-6-6-6M8 6l-6 6 6 6', tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  menu: 'M3 12h18M3 6h18M3 18h18', close: 'M18 6L6 18M6 6l12 12', filter: 'M22 3H2l8 9.46V19l4 2v-8.54z', download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13', music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  award: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12', rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
} as const;
export type Ico = keyof typeof D;
export const ico = (name: Ico, size = 18, color = '#374151', sw = 2): Node =>
  mk('path', `${name} icon`, { mode: 'flow', w: size, h: size, grow: 0, shrink: 0, stroke: color, strokeWidth: sw } as St, { svgD: D[name], vw: 24, vh: 24, pts: [], closed: false });

export const pin = (n: Node, dir: 'row' | 'column' = 'row'): Node => ({ ...n, bp: { ...(n.bp || {}), tablet: { ...(n.bp?.tablet || {}), dir }, mobile: { ...(n.bp?.mobile || {}), dir } } });
export const T = (t: string, size = 15, weight = 500, color = '#111827', st: St = {}): Node => { const n = label(t, size, weight, color); n.style = { ...n.style, lineHeight: 1.4, ...st } as St; return n; };
export const H = (t: string, size: number, color = '#111827', align?: 'left' | 'center', st: St = {}): Node => { const h = makeHeading(0, 0, t, size); h.style = { ...h.style, w: 'auto', color, ...(align ? { align } : {}), ...st } as St; return h; };
export const P = (t: string, size = 15, color = '#6b7280', align?: 'left' | 'center', maxW?: number): Node => { const n = label(t, size, 400, color); n.style = { ...n.style, ...(align ? { align } : {}), ...(maxW ? { maxW, w: 'fill' } : {}), lineHeight: 1.55 } as St; return n; };
export const col = (name: string, kids: Node[], st: St = {}): Node => stack(name, 'column', kids, { w: 'fill', gap: 8, items: 'stretch', ...st } as St);
/** A row that stays a row on phones (icon + label, avatar + name). */
export const line = (name: string, kids: Node[], st: St = {}): Node => pin(stack(name, 'row', kids, { w: 'fill', gap: 12, items: 'center', ...st } as St));
/** A row of items that wraps instead of squeezing; on phones it stacks. Children should use `cell()`. */
export const wrapRow = (name: string, kids: Node[], st: St = {}): Node => stack(name, 'row', kids, { w: 'fill', gap: 20, items: 'stretch', wrap: true, ...st } as St);
export const cell = (n: Node, minW = 220): Node => ({ ...n, style: { ...n.style, w: 'auto', grow: 1, minW } as St });
export const card = (name: string, kids: Node[], st: St = {}): Node => stack(name, 'column', kids, { w: 'fill', gap: 12, pad: 20, radius: 16, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, items: 'stretch', ...st } as St);
export const photo = (key: string, h: number, st: St = {}, kids: Node[] = []): Node =>
  mk('container', 'Photo', { mode: 'flow', w: 'fill', h, minH: h, grow: 0, radius: 12, fill: '#e5e7eb', fillImg: `stock-${key}`, bgSize: 'cover', bgPos: 'center', bgRepeat: 'no-repeat', ...st } as St, kids.length ? { children: kids, } : {});
export const avatar = (key: string | null, size = 40, color = '#c7d2fe'): Node =>
  mk('container', 'Avatar', { mode: 'flow', w: size, h: size, minH: size, grow: 0, shrink: 0, radius: 999, fill: color, ...(key ? { fillImg: `stock-${key}`, bgSize: 'cover', bgPos: 'center', bgRepeat: 'no-repeat' } : {}) } as St, {});
export const dot = (size: number, color: string): Node => mk('container', 'Dot', { mode: 'flow', w: size, h: size, minH: size, grow: 0, shrink: 0, radius: 999, fill: color } as St, {});
export const pill = (t: string, bg: string, color: string, size = 12): Node => { const n = T(t, size, 700, color); n.style = { ...n.style, padX: 10, padY: 3, radius: 999, fill: bg, self: 'start' } as St; return n; };
export const iconTile = (name: Ico, bg = '#eef2ff', color = ACCENT, size = 44): Node =>
  stack('Icon tile', 'row', [ico(name, Math.round(size * 0.45), color)], { w: size, h: size, minH: size, grow: 0, shrink: 0, radius: 12, fill: bg, justify: 'center', items: 'center', gap: 0 } as St);
export const divider = (color = '#e5e7eb'): Node => mk('container', 'Divider', { mode: 'flow', w: 'fill', h: 1, minH: 1, grow: 0, fill: color } as St, {});
export const bar = (pct: number, color = ACCENT, h = 8, track = '#e5e7eb'): Node =>
  stack('Progress bar', 'row', [mk('container', 'Fill', { mode: 'flow', w: pct, h, minH: h, grow: 0, radius: 999, fill: color } as St, {})], { w: 'fill', h, minH: h, radius: 999, fill: track, gap: 0, items: 'start', justify: 'start', overflow: 'hidden' } as St);
/** A bar whose width is a percentage; `w` as a number would be pixels, so this one sizes with a fixed inner basis. */
export const meter = (pct: number, color = ACCENT, h = 8, track = '#e5e7eb'): Node => {
  const fill = mk('container', 'Fill', { mode: 'flow', w: 'auto', h, minH: h, grow: pct, radius: 999, fill: color } as St, {});
  const rest = mk('container', 'Rest', { mode: 'flow', w: 'auto', h, minH: h, grow: 100 - pct, radius: 999, fill: 'transparent' } as St, {});
  return stack('Progress bar', 'row', [fill, rest], { w: 'fill', h, minH: h, radius: 999, fill: track, gap: 0, items: 'stretch' } as St);
};
export const btn = (t: string, look: Parameters<typeof textBtn>[2], st: St = {}): Node => textBtn(t, t, look, { padY: 11, padX: 20, ...st } as St);
export const input = (kind: 'text' | 'email' | 'password' | 'textarea' | 'select', name: string, ph: string, o: { h?: number; w?: number | 'fill'; options?: string[] } = {}): Node => {
  const n = makeInput(kind, name, ph);
  n.style = { ...n.style, mode: 'flow', w: o.w ?? 'fill', h: o.h ?? (kind === 'textarea' ? 100 : 44), radius: 10, padX: 14, padY: kind === 'textarea' ? 12 : 0, fontSize: 15, fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1, color: '#111827' } as St;
  n.states = { focus: { stroke: ACCENT, shadowCss: '0 0 0 3px rgba(79,70,229,0.18)' } } as Node['states'];
  n.attrs = { ...(n.attrs || {}), 'aria-label': ph || name, outline: 'none' };
  if (kind === 'select') n.field = { ...(n.field as NonNullable<Node['field']>), type: 'select', name, options: o.options || ['Option one', 'Option two'] };
  return n;
};
/** A switch, using the shipped `sw-ios` rules. */
export const toggle = (name: string, on = false, accent = ACCENT): Node => {
  const n = makeInput('checkbox', name, '');
  n.style = { ...n.style, mode: 'flow', w: 44, h: 26, grow: 0, shrink: 0, radius: 999, fill: '#d1d5db', stroke: 'transparent', strokeWidth: 0, padX: 0, padY: 0, color: accent } as St;
  n.field = { type: 'checkbox', name, value: on ? 'true' : '', required: false }; n.attrs = { 'aria-label': name, 'data-ui': 'sw-ios' }; return n;
};
export const sectionOf = (name: string, kids: Node[], st: St = {}, bp: NonNullable<Node['bp']> = {}): Node => {
  const n = makeSection(name, 480, (st.fill as string) || '#ffffff');
  n.style = { ...n.style, layout: 'flex', dir: 'column', items: 'stretch', justify: 'start', gap: 32, padX: 64, padY: 72, h: 'auto', minH: 0, ...st } as St;
  n.children = kids.map(k => ({ ...k, style: { ...k.style, mode: 'flow' as const } }));
  n.bp = { tablet: { padX: 40, padY: 56, ...bp.tablet }, mobile: { padX: 20, padY: 44, gap: 24, ...bp.mobile } };
  return n;
};
/** Centred intro for a section: eyebrow, title and a sentence. */
export const intro = (eyebrow: string, title: string, text: string, dark = false): Node =>
  stack('Section intro', 'column', [...(eyebrow ? [T(eyebrow, 13, 700, dark ? '#a5b4fc' : ACCENT, { upper: true, letterSpacing: 1, align: 'center' } as St)] : []), H(title, 36, dark ? '#ffffff' : '#111827', 'center', { w: 'fill' } as St), ...(text ? [P(text, 17, dark ? '#c7d2fe' : '#6b7280', 'center', 560)] : [])], { w: 'fill', gap: 12, items: 'center' } as St);
/** A phone outline for the mobile screens. It never grows past its parent. */
export const phone = (name: string, kids: Node[], st: St = {}): Node =>
  stack(name, 'column', kids, { w: 340, h: 'auto', minH: 620, grow: 0, radius: 40, fill: '#ffffff', stroke: '#111827', strokeWidth: 8, overflow: 'hidden', gap: 0, items: 'stretch', shadow: 'lg', ...st } as St);
export const phoneBar = (title: string, left?: Node, right?: Node): Node =>
  pin(stack('Top bar', 'row', [left ?? ico('home', 20, '#111827'), T(title, 17, 700, '#111827', { grow: 1, align: 'center' } as St), right ?? ico('bell', 20, '#111827')], { w: 'fill', padX: 20, padY: 16, items: 'center', gap: 8 } as St));
export const tabBar = (active = 0): Node =>
  pin(stack('Tab bar', 'row', (['home', 'search', 'heart', 'user'] as Ico[]).map((i, k) => stack(i, 'column', [ico(i, 22, k === active ? ACCENT : '#9ca3af')], { w: 'auto', grow: 1, items: 'center', padY: 14, gap: 0 } as St)), { w: 'fill', gap: 0, borderT: 1, stroke: '#e5e7eb', fill: '#ffffff', items: 'center' } as St));
export type Item = { name: string; blurb: string; make: () => Node; section: string };
