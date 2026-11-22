/**
 * Spacing, radius and shadow tokens, and reusable style classes.
 *
 * Nodes keep their real values (so rendering and exports never depend on lookups) and remember which token or class they follow.
 * Editing a token or class rewrites the values on every node that follows it, the same way linked text styles work.
 * Exports also publish the tokens as CSS variables (--space-md, --radius-lg, --shadow-sm) for your own CSS.
 */
import type { Node, ScaleKind, ScaleToken, Style, StyleClass } from './types';

type LinkField = keyof NonNullable<Style['tok']>;
export const LINK_FIELDS: Record<ScaleKind, LinkField[]> = { space: ['pad', 'padX', 'padY', 'gap'], radius: ['radius'], shadow: ['shadowCss'] };
export const FIELD_LABEL: Record<LinkField, string> = { pad: 'Padding', padX: 'Padding X', padY: 'Padding Y', gap: 'Gap', radius: 'Corner radius', shadowCss: 'Shadow' };
export const kindOfField = (f: LinkField): ScaleKind => (f === 'radius' ? 'radius' : f === 'shadowCss' ? 'shadow' : 'space');

export const defaultScale = (): ScaleToken[] => [
  ...[['xs', 4], ['sm', 8], ['md', 16], ['lg', 24], ['xl', 40], ['2xl', 64]].map(([n, v]) => ({ id: `space-${n}`, name: n as string, kind: 'space' as const, value: v as number })),
  ...[['sm', 6], ['md', 12], ['lg', 20], ['full', 999]].map(([n, v]) => ({ id: `radius-${n}`, name: n as string, kind: 'radius' as const, value: v as number })),
  { id: 'shadow-sm', name: 'sm', kind: 'shadow', value: '0px 1px 3px rgba(0,0,0,0.12)' },
  { id: 'shadow-md', name: 'md', kind: 'shadow', value: '0px 6px 16px rgba(0,0,0,0.14)' },
  { id: 'shadow-lg', name: 'lg', kind: 'shadow', value: '0px 18px 40px rgba(0,0,0,0.22)' },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'token';
const px = (n: number | string) => (typeof n === 'number' ? `${n}px` : n);
/** `:root{...}` with one variable per token. Empty when there are no tokens. */
export function scaleVars(tokens?: ScaleToken[]): string {
  if (!tokens?.length) return '';
  const name = (t: ScaleToken) => `--${t.kind}-${slug(t.name)}`;
  return `/* Design tokens */\n:root{${tokens.map(t => `${name(t)}:${t.kind === 'shadow' ? String(t.value) : px(t.value)}`).join(';')}}`;
}

const walk = (n: Node, fn: (n: Node) => Node): Node => { const m = fn(n); return m.children ? { ...m, children: m.children.map(c => walk(c, fn)) } : m; };
export const mapTree = walk;

/** Sets the field to the token's value and links it. */
export function applyToken(n: Node, field: LinkField, t: ScaleToken): Node {
  const value = field === 'shadowCss' ? String(t.value) : Number(t.value);
  return { ...n, style: { ...n.style, [field]: value, tok: { ...n.style.tok, [field]: t.id } } };
}
export function unlinkToken(n: Node, field: LinkField): Node {
  if (!n.style.tok?.[field]) return n; const tok = { ...n.style.tok }; delete tok[field];
  const style = { ...n.style }; if (Object.keys(tok).length) style.tok = tok; else delete style.tok; return { ...n, style };
}
/** Rewrites every node that follows this token. */
export function syncToken(root: Node, t: ScaleToken): Node {
  return walk(root, n => {
    const tok = n.style.tok; if (!tok) return n; let style: Style | null = null;
    for (const f of LINK_FIELDS[t.kind]) if (tok[f] === t.id) { style = style || { ...n.style }; (style as any)[f] = f === 'shadowCss' ? String(t.value) : Number(t.value); }
    return style ? { ...n, style } : n;
  });
}
/** Deleting a token keeps the values but unlinks the nodes. */
export function dropToken(root: Node, id: string): Node {
  return walk(root, n => { const tok = n.style.tok; if (!tok || !Object.values(tok).includes(id)) return n; let m = n; for (const f of Object.keys(tok) as LinkField[]) if (tok[f] === id) m = unlinkToken(m, f); return m; });
}
export const usageOfToken = (root: Node, id: string): number => { let c = 0; walk(root, n => { if (n.style.tok && Object.values(n.style.tok).includes(id)) c++; return n; }); return c; };

/* ---------- style classes ---------- */
const CLASS_KEYS: (keyof Style)[] = ['fill', 'fillToken', 'stroke', 'strokeToken', 'strokeWidth', 'color', 'colorToken', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'font', 'align',
  'radius', 'radiusTL', 'radiusTR', 'radiusBR', 'radiusBL', 'shadowCss', 'textShadow', 'opacity', 'pad', 'padX', 'padY', 'gap', 'bgBlur', 'blur', 'italic', 'underline', 'upper', 'tok'] as any;
/** The look of a node, ready to store as a class. */
export function captureClass(n: Node, name: string, id: string): StyleClass {
  const style: Style = {}; for (const k of CLASS_KEYS) if (n.style[k] !== undefined) (style as any)[k] = n.style[k];
  return { id, name, style };
}
export function applyClass(n: Node, c: StyleClass): Node { return { ...n, cls: c.id, style: { ...n.style, ...c.style } }; }
export function detachClass(n: Node): Node { if (!n.cls) return n; const m = { ...n }; delete m.cls; return m; }
/** Rewrites every node that follows this class; keys the class no longer defines are left as they are. */
export function syncClass(root: Node, c: StyleClass): Node { return walk(root, n => (n.cls === c.id ? { ...n, style: { ...n.style, ...c.style } } : n)); }
export function dropClass(root: Node, id: string): Node { return walk(root, n => (n.cls === id ? detachClass(n) : n)); }
export const usageOfClass = (root: Node, id: string): number => { let c = 0; walk(root, n => { if (n.cls === id) c++; return n; }); return c; };
