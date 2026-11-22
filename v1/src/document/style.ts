import type { Bp, Node, Style, StyleKey } from './types';

export const DESKTOP_W = 1440;
export const BP_WIDTH: Record<Bp, number> = { desktop: 1440, tablet: 768, mobile: 390 };
export const BP_LABEL: Record<Bp, string> = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' };
export const BPS: Bp[] = ['desktop', 'tablet', 'mobile'];

/** Desktop-first cascade: base ← tablet ← mobile. Only what the user set explicitly. */
export function explicitStyle(node: Node, bp: Bp): Style {
  const base = node.style;
  if (bp === 'desktop') return base;
  const tablet = node.bp?.tablet;
  if (bp === 'tablet') return tablet ? { ...base, ...tablet } : base;
  const mobile = node.bp?.mobile;
  return { ...base, ...(tablet || {}), ...(mobile || {}) };
}
/** Keys the user overrode at or above this breakpoint (so automatic rules must stay out of the way). */
export function overriddenKeys(node: Node, bp: Bp): Set<StyleKey> {
  const keys = new Set<StyleKey>();
  if (bp === 'desktop') return keys;
  Object.keys(node.bp?.tablet || {}).forEach(k => keys.add(k as StyleKey));
  if (bp === 'mobile') Object.keys(node.bp?.mobile || {}).forEach(k => keys.add(k as StyleKey));
  return keys;
}
export const hasOverride = (node: Node, bp: Bp, key: StyleKey) => bp !== 'desktop' && node.bp?.[bp] !== undefined && key in (node.bp[bp] as Style);

/** Write a style patch at a breakpoint: desktop edits the base, other breakpoints store an override. */
export function patchStyle(node: Node, patch: Style, bp: Bp): Node {
  if (bp === 'desktop') return { ...node, style: { ...node.style, ...patch } };
  return { ...node, bp: { ...node.bp, [bp]: { ...(node.bp?.[bp] || {}), ...patch } } };
}
export function resetOverride(node: Node, bp: Bp, key?: StyleKey): Node {
  if (bp === 'desktop' || !node.bp?.[bp]) return node;
  if (!key) { const next = { ...node.bp }; delete next[bp]; return { ...node, bp: next }; }
  const copy = { ...(node.bp[bp] as Style) }; delete copy[key];
  return { ...node, bp: { ...node.bp, [bp]: copy } };
}

export const num = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

/**
 * Reference width of a node's coordinate space, in design px. A numeric width defines it; otherwise it inherits.
 * Children store x and w in this space and export them as percentages of it.
 */
export function refWidthOf(node: Node, parentRef: number) { return typeof node.style.w === 'number' ? node.style.w : parentRef; }

export const layoutOf = (node: Node, s: Style) => s.layout ?? (node.type === 'page' || node.type === 'section' || node.type === 'container' || node.type === 'group' ? 'free' : undefined);

export type Resolved = { s: Style; layout: 'free' | 'flex' | 'grid' | null; stacked: boolean };

/**
 * Explicit style plus the automatic responsive rules. Automatic rules only apply to properties the user
 * has not overridden, so anything set by hand always wins. These rules are what make a desktop design
 * usable on a phone before the user touches it.
 */
/** Whether the automatic responsive rules run. Set from the project settings by the store. */
export const RESP = { auto: true };

export function resolveNode(node: Node, bp: Bp): Resolved {
  const s: Style = { ...explicitStyle(node, bp) };
  const set = overriddenKeys(node, bp);
  let layout = layoutOf(node, s) ?? null;
  let stacked = false;
  if (bp !== 'desktop' && RESP.auto) {
    if ((node.type === 'text' || node.type === 'heading' || node.type === 'button') && s.fontSize && !set.has('fontSize')) {
      const f = bp === 'mobile' ? 0.6 : 0.82;
      if (s.fontSize > 32) s.fontSize = Math.max(22, Math.round(s.fontSize * f));
      else if (bp === 'mobile' && s.fontSize > 22) s.fontSize = Math.round(s.fontSize * 0.9);
    }
    if ((node.type === 'section' || node.type === 'container') && s.pad && !set.has('pad')) s.pad = Math.min(s.pad, bp === 'mobile' ? 16 : 32);
    if (layout === 'grid' && !set.has('cols')) s.cols = bp === 'mobile' ? 1 : Math.min(s.cols || 2, 2);
    if (layout === 'flex' && bp === 'mobile' && s.dir !== 'column' && !set.has('dir')) s.dir = 'column';
    const textual = (node.children || []).some(c => c.type === 'text' || c.type === 'heading' || c.type === 'button');
    const canStack = node.type === 'page' || node.type === 'section' || node.type === 'container';
    if (layout === 'free' && canStack && !set.has('layout') && (bp === 'mobile' || (bp === 'tablet' && textual && node.type !== 'page'))) {
      // Free-positioned content cannot reflow, so the section stacks its children in reading order (top to bottom, left to right).
      layout = 'flex'; stacked = true; s.dir = 'column'; s.items = s.items || 'stretch'; s.gap = s.gap ?? 16;
      if (!set.has('h')) s.h = 'auto';
      if (!set.has('pad')) s.pad = node.type === 'page' ? 0 : Math.min(s.pad ?? 16, 16);
      if (node.type === 'page' && !set.has('gap')) s.gap = 0;
    }
    if (bp === 'mobile' && (node.type === 'container' || node.type === 'group') && layout !== 'free' && typeof s.h === 'number' && !set.has('h')) s.h = 'auto';
  }
  if (layout === 'free' && !stacked && typeof s.h !== 'number' && node.type !== 'group') s.h = typeof node.style.h === 'number' ? node.style.h : 'auto';
  return { s, layout, stacked };
}

export const isAbs = (node: Node, parentLayout: Resolved['layout'], parentStacked: boolean) =>
  !parentStacked && parentLayout === 'free' && node.type !== 'page' && (node.style.mode ?? 'abs') === 'abs';
