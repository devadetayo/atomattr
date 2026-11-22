/** Maps rendered elements to document ids without putting any data-* attributes in the DOM. */
const els = new Map<string, HTMLElement>();
const ids = new WeakMap<Element, string>();
export const reg = (key: string) => (el: HTMLElement | null) => {
  if (el) { els.set(key, el); ids.set(el, key); } else { const cur = els.get(key); if (cur && !cur.isConnected) els.delete(key); }
};
export const elOf = (key: string): HTMLElement | null => { const el = els.get(key); return el && el.isConnected ? el : null; };
export const keyOf = (el: Element): string | null => ids.get(el) ?? null;
/** First registered key under a point whose key starts with the prefix ('' for nodes, 'win:' for dockers). */
export function keyAtPoint(x: number, y: number, prefix = '', skip?: string): string | null {
  for (const el of document.elementsFromPoint(x, y)) { const k = keyOf(el); if (k && (prefix ? k.startsWith(prefix) : !k.includes(':')) && k !== skip) return k; }
  return null;
}
