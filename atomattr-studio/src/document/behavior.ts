/**
 * Behavior: opt-in interactivity for exported pages (menus, dropdowns, tabs, modals).
 *
 * A node carries a small `behavior` description. It is turned into plain `data-ast-*` attributes, so it travels through the
 * HTML and React exports like any other attribute, and one tiny runtime (see exporters/behavior-runtime.ts) reads them.
 * Panels and triggers find each other by a short key inside the nearest `scope` ancestor, never by node id, so a copied
 * component keeps working. Pages that use no behavior get no script.
 */
import type { Behavior, Node } from './types';

const clean = (v?: string) => (v || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');

export function behaviorAttrs(b: Behavior): Record<string, string> {
  const key = clean(b.key); const out: Record<string, string> = {};
  switch (b.role) {
    case 'scope': out['data-ast-scope'] = ''; break;
    case 'panel':
      out['data-ast-panel'] = key || 'panel'; out['data-ast-state'] = b.initial === 'open' ? 'open' : 'closed';
      if (clean(b.group)) out['data-ast-group'] = clean(b.group);
      if (b.dismiss) out['data-ast-dismiss'] = '';
      if (b.modal) { out['data-ast-modal'] = ''; out['role'] = 'dialog'; out['aria-modal'] = 'true'; }
      if (b.mobile) out['data-ast-mobile'] = '';
      break;
    case 'toggle': out['data-ast-toggle'] = key || 'panel'; out['aria-expanded'] = 'false'; break;
    case 'open': out['data-ast-open'] = key || 'panel'; break;
    case 'close': out['data-ast-close'] = key; break;
    case 'scroll': out['data-ast-scroll'] = clean(b.key); break;
    case 'theme': out['data-ast-theme'] = ''; break;
    case 'copy': out['data-ast-copy'] = (b.key || '').trim(); break;
    case 'tab': out['data-ast-tab'] = key || 'tab'; out['data-ast-group'] = clean(b.group) || 'tabs'; out['role'] = 'tab'; break;
  }
  if (b.mobileOnly) out['data-ast-mobile-only'] = '';
  return out;
}

export const BEHAVIOR_ROLES: { id: Behavior['role']; label: string; hint: string }[] = [
  { id: 'scope', label: 'Scope (component root)', hint: 'Wraps one menu, tab set or dialog so copies do not interfere.' },
  { id: 'panel', label: 'Panel (shows and hides)', hint: 'The thing that opens and closes: a menu, dropdown, tab content or dialog.' },
  { id: 'toggle', label: 'Toggle (open / close)', hint: 'Click to open the panel with the same key, click again to close it.' },
  { id: 'open', label: 'Open button', hint: 'Always opens the panel with the same key.' },
  { id: 'close', label: 'Close button', hint: 'Closes the panel with the same key, or the panel it sits inside when the key is empty.' },
  { id: 'scroll', label: 'Scroll to element', hint: 'Click to smooth-scroll to the element whose id matches the key (set an id in the object\'s attributes).' },
  { id: 'theme', label: 'Switch light / dark', hint: 'Click to toggle the page between light and dark.' },
  { id: 'copy', label: 'Copy text', hint: 'Click to copy the key text to the clipboard (a promo code, an email address).' },
  { id: 'tab', label: 'Tab', hint: 'Shows the panel with its key and hides the others in the same group.' },
];

/** True when anything under the node (or the node itself) has a behavior, so exports only add the script when needed. */
export const usesBehavior = (node: Node): boolean => !!node.behavior || !!node.anim || typeof node.attrs?.['data-ui'] === 'string' || (node.children || []).some(usesBehavior);

/**
 * Preview mode (editor only): the canvas is not a real page, so the runtime script cannot drive it. Instead the open/closed
 * state of each panel lives here, keyed by node id, and `applyPreviewClick` applies the same rules the runtime uses
 * (toggle, open, close, tabs, click-outside dismiss, click-backdrop for modals). It is cleared when preview, the size or the page changes.
 */
export const PREVIEW = { on: false, open: new Map<string, boolean>() };
export const resetPreview = (on = PREVIEW.on) => { PREVIEW.on = on; PREVIEW.open.clear(); };

const flat = (n: Node): Node[] => [n, ...(n.children || []).flatMap(flat)];
const wasOpen = (p: Node, state: Map<string, boolean>) => state.get(p.id) ?? p.behavior?.initial === 'open';

/** `chain` is the clicked node's id first, then each ancestor up to the page root. Returns true when any panel changed. */
export function applyPreviewClick(root: Node, chain: string[], state: Map<string, boolean> = PREVIEW.open): boolean {
  const all = flat(root); const byId = new Map(all.map(n => [n.id, n])); const nodes = chain.map(id => byId.get(id)).filter(Boolean) as Node[];
  const panels = all.filter(n => n.behavior?.role === 'panel'); const touched = new Set<string>(); let changed = false;
  const set = (p: Node, open: boolean) => { if (wasOpen(p, state) !== open) changed = true; state.set(p.id, open); touched.add(p.id); };
  const ti = nodes.findIndex(n => ['toggle', 'open', 'close', 'tab'].includes(n.behavior?.role || ''));
  if (ti > -1) {
    const t = nodes[ti]; const b = t.behavior!; const key = clean(b.key);
    const scope = nodes.slice(ti + 1).find(n => n.behavior?.role === 'scope') || root;
    const inScope = flat(scope).filter(n => n.behavior?.role === 'panel');
    if (b.role === 'tab') {
      const group = clean(b.group) || 'tabs';
      inScope.filter(p => (clean(p.behavior!.group) || '') === group).forEach(p => set(p, clean(p.behavior!.key) === key));
    } else {
      const targets = key ? inScope.filter(p => (clean(p.behavior!.key) || 'panel') === key) : nodes.slice(ti + 1).filter(n => n.behavior?.role === 'panel').slice(0, 1);
      targets.forEach(p => set(p, b.role === 'toggle' ? !wasOpen(p, state) : b.role === 'open'));
    }
  }
  const ids = new Set(chain);
  panels.forEach(p => {
    if (touched.has(p.id) || !wasOpen(p, state)) return;
    if (p.behavior!.modal && chain[0] === p.id) set(p, false);
    else if (p.behavior!.dismiss && !ids.has(p.id)) set(p, false);
  });
  return changed;
}
