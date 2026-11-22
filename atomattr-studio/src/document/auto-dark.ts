import type { Node } from './types';

/**
 * Gives a ready-made block its dark-mode look. Blocks are drawn in light colours; this adds a `states.dark` look to every
 * node that uses a light surface, dark text or a pale border, mapped by lightness so any block follows the same rules:
 *   white and pale grey surfaces  -> deep slate surfaces      pale brand tints -> the same hue, deep
 *   dark text                     -> light text (graded)      pale borders     -> dark borders
 *   a dark button                 -> a light button, with its label turned dark
 * Brand colours, photos, gradients and white text on photos stay as they are. A node that already has its own dark look is left alone.
 * It exports as `html.dark .node { … }` rules, so it follows the page's dark class (see the Dark mode toggles).
 */
type Rgb = [number, number, number];
const parse = (c: unknown): { rgb: Rgb; a: number } | null => {
  if (typeof c !== 'string') return null; const s = c.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s); if (m) { const h = m[1]; return { rgb: [0, 1, 2].map(i => parseInt(h[i] + h[i], 16)) as Rgb, a: 1 }; }
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s); if (m) { const h = m[1]; return { rgb: [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as Rgb, a: m[2] ? parseInt(m[2], 16) / 255 : 1 }; }
  m = /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?\s*\)$/.exec(s); if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
  return null;
};
const toHsl = ([r, g, b]: Rgb): [number, number, number] => {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)); const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
};
const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

type Kind = 'fill' | 'text' | 'stroke';
/** The dark counterpart of one colour, or null when it should stay. */
export function darkOf(color: unknown, kind: Kind, flip = false): string | null {
  const p = parse(color); if (!p || p.a < 0.5) return null;
  const [h, s, l] = toHsl(p.rgb);
  if (kind === 'fill') {
    if (l >= 0.985) return '#111827';
    if (l >= 0.95) return s < 0.2 ? '#1f2937' : hsl(h, Math.min(s, 0.45), 0.2);
    if (l >= 0.86) return s < 0.2 ? '#374151' : hsl(h, Math.min(s, 0.45), 0.26);
    return null;
  }
  if (kind === 'stroke') return l >= 0.78 ? (l >= 0.9 ? '#374151' : '#4b5563') : null;
  // text
  if (flip) return l >= 0.85 ? '#111827' : null;
  if (l < 0.15) return '#f9fafb';
  if (l < 0.3) return '#e5e7eb';
  if (s > 0.35 && l < 0.55) return hsl(h, Math.min(s, 0.9), 0.76); // brand coloured text gets lighter
  if (l < 0.42) return '#d1d5db';
  if (l < 0.6) return '#9ca3af';
  return null;
}

const isDarkNeutral = (c: unknown) => { const p = parse(c); if (!p || p.a < 0.9) return false; const [, s, l] = toHsl(p.rgb); return l < 0.2 && s < 0.5; };

function walk(n: Node, flip: boolean): Node {
  const st = n.style || {}; const dark: Record<string, unknown> = {}; let flipped = flip;
  const hasOwn = n.states?.dark && Object.keys(n.states.dark).length;
  if (!hasOwn) {
    if (!st.fillImg) {
      if (n.tag === 'button' && isDarkNeutral(st.fill)) { dark.fill = '#f3f4f6'; flipped = true; }
      else { const f = darkOf(st.fill, 'fill'); if (f) dark.fill = f; }
    }
    const c = darkOf((st as { color?: string }).color, 'text', flip); if (c) dark.color = c;
    const sk = darkOf(st.stroke, 'stroke'); if (sk) dark.stroke = sk;
    if (typeof st.shadowCss === 'string' && /rgba?\(\s*15|rgba?\(\s*17/.test(st.shadowCss)) dark.shadowCss = '0 12px 32px -12px rgba(0,0,0,0.7)';
  }
  const children = n.children?.map(k => walk(k, flipped));
  const changed = Object.keys(dark).length || (children && children.some((k, i) => k !== n.children![i]));
  if (!changed) return n;
  return { ...n, ...(children ? { children } : {}), ...(Object.keys(dark).length ? { states: { ...(n.states || {}), dark: dark as never } } : {}) };
}
export const autoDark = (n: Node): Node => walk(n, false);
