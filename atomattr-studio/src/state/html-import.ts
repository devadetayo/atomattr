import type { Node, Style } from '../document/types';
import { makeButton, makeInput, makeImage, makeSection, makeText, makeHeading, makeForm } from '../document/factory';
import { uid } from '../document/tree';
import { addNode, getState, page, toast } from './store';

/**
 * Brings an HTML page into the editor as Studio objects.
 *
 * The HTML is rendered in a hidden iframe that cannot run scripts (sandbox without allow-scripts), and the Studio reads
 * what the browser computed: layout (flex/grid, direction, gap), spacing, colours, borders, radius, fonts and shadows.
 * It is a best-effort conversion, so complex pages, animations and custom JS will not come across.
 */
const SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'BR', 'HR', 'SOURCE', 'TRACK']);
const MAX_NODES = 600, MAX_DEPTH = 14;
const num = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const hex = (c: string): string | undefined => {
  const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return undefined; const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
  const alpha = parseFloat(a); if (!(alpha > 0)) return undefined;
  const h = (x: string) => Math.round(parseFloat(x)).toString(16).padStart(2, '0');
  return alpha >= 1 ? `#${h(r)}${h(g)}${h(b)}` : `rgba(${Math.round(+r)},${Math.round(+g)},${Math.round(+b)},${Math.round(alpha * 100) / 100})`;
};
const JUSTIFY: Record<string, Style['justify']> = { 'flex-start': 'start', start: 'start', center: 'center', 'flex-end': 'end', end: 'end', 'space-between': 'between' };
const ITEMS: Record<string, Style['items']> = { 'flex-start': 'start', start: 'start', center: 'center', 'flex-end': 'end', end: 'end', stretch: 'stretch', normal: undefined };

function look(cs: CSSStyleDeclaration): Style {
  const s: Style = { mode: 'flow', w: 'fill', h: 'auto' };
  const fill = hex(cs.backgroundColor); if (fill) s.fill = fill;
  const bw = num(cs.borderTopWidth); if (bw > 0 && cs.borderTopStyle !== 'none') { s.strokeWidth = bw; s.stroke = hex(cs.borderTopColor) || '#d1d5db'; }
  const r = num(cs.borderTopLeftRadius); if (r) s.radius = Math.round(r);
  for (const [k, p] of [['padT', 'paddingTop'], ['padR', 'paddingRight'], ['padB', 'paddingBottom'], ['padL', 'paddingLeft']] as const) { const v = Math.round(num((cs as any)[p])); if (v) (s as any)[k] = v; }
  if (cs.boxShadow && cs.boxShadow !== 'none') s.shadowCss = cs.boxShadow;
  return s;
}
function typeLook(cs: CSSStyleDeclaration, s: Style): Style {
  s.color = hex(cs.color) || '#1f2937'; s.fontSize = Math.round(num(cs.fontSize)) || 16; s.fontWeight = num(cs.fontWeight) || 400;
  const ta = cs.textAlign; if (ta === 'center' || ta === 'right') s.align = ta;
  const lh = num(cs.lineHeight); if (lh && s.fontSize) s.lineHeight = Math.round((lh / s.fontSize) * 100) / 100;
  if (cs.textTransform === 'uppercase') s.upper = true; return s;
}
const textOf = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();
const isInline = (el: Element, win: Window) => { const d = win.getComputedStyle(el).display; return d.startsWith('inline') || d === 'contents'; };
const mkNode = (type: Node['type'], name: string, style: Style, extra: Partial<Node> = {}): Node => ({ id: uid(), type, name, style, ...extra } as Node);

export function convertDocument(doc: Document): { nodes: Node[]; title: string; count: number } {
  const win = doc.defaultView!; let count = 0;
  const walk = (el: Element, depth: number): Node | null => {
    if (count >= MAX_NODES || depth > MAX_DEPTH || SKIP.has(el.tagName)) return null;
    const cs = win.getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const tag = el.tagName.toLowerCase(); const rect = el.getBoundingClientRect();
    const done = <T extends Node>(n: T): T => { count++; return n; };
    if (tag === 'img') { const i = makeImage(0, 0, Math.round(rect.width) || 320, Math.round(rect.height) || 220, (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src, undefined, (el as HTMLImageElement).alt || ''); i.style = { ...i.style, mode: 'flow', w: Math.round(rect.width) || 320, h: Math.round(rect.height) || 220, radius: Math.round(num(cs.borderTopLeftRadius)) }; return done(i); }
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const t = tag === 'input' ? ((el as HTMLInputElement).type as any) : tag; const kind = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'checkbox', 'radio', 'textarea', 'select', 'date'].includes(t) ? t : 'text';
      if (t === 'submit' || t === 'button') { const b = makeButton(0, 0, (el as HTMLInputElement).value || 'Submit'); b.style = { ...b.style, mode: 'flow' }; return done(b); }
      if (t === 'hidden') return null;
      const n = makeInput(kind, (el as HTMLInputElement).name || 'field', (el as HTMLInputElement).placeholder || ''); return done(n);
    }
    if (/^h[1-6]$/.test(tag)) { const h = makeHeading(0, 0, textOf(el), Math.round(num(cs.fontSize)) || 32); h.tag = tag; h.style = typeLook(cs, { ...h.style, mode: 'flow', w: 'fill' }); return textOf(el) ? done(h) : null; }
    if (tag === 'button' || (tag === 'a' && hex(cs.backgroundColor) && num(cs.paddingLeft) >= 8)) {
      const b = makeButton(0, 0, textOf(el) || 'Button'); if (tag === 'a') b.href = (el as HTMLAnchorElement).getAttribute('href') || '#';
      b.style = typeLook(cs, { ...look(cs), w: 'auto', align: 'center' }); return done(b);
    }
    const kids = Array.from(el.children); const hasText = Array.from(el.childNodes).some(c => c.nodeType === 3 && (c.textContent || '').trim());
    const flatText = kids.every(k => isInline(k, win) && !['IMG', 'INPUT', 'BUTTON', 'SVG', 'svg'].includes(k.tagName)) && (hasText || !kids.length);
    if (flatText && textOf(el)) {
      const t = makeText(0, 0, textOf(el)); t.style = typeLook(cs, { ...t.style, mode: 'flow', w: 'auto' });
      if (tag === 'a') { t.tag = 'a'; t.href = (el as HTMLAnchorElement).getAttribute('href') || '#'; } else if (tag === 'li' || tag === 'p' || tag === 'label') t.style.w = 'fill';
      return done(t);
    }
    const children = kids.map(k => walk(k, depth + 1)).filter(Boolean) as Node[];
    const looksText = hasText ? Array.from(el.childNodes).filter(c => c.nodeType === 3 && (c.textContent || '').trim()).map(c => { const t = makeText(0, 0, (c.textContent || '').replace(/\s+/g, ' ').trim()); t.style = typeLook(cs, { ...t.style, mode: 'flow', w: 'auto' }); return t; }) : [];
    const all = [...looksText, ...children]; if (!all.length && !hex(cs.backgroundColor) && !num(cs.borderTopWidth)) return null;
    const s = look(cs);
    if (cs.display.includes('flex')) { s.layout = 'flex'; s.dir = cs.flexDirection.startsWith('column') ? 'column' : 'row'; s.gap = Math.round(num(s.dir === 'row' ? cs.columnGap : cs.rowGap)); const j = JUSTIFY[cs.justifyContent]; if (j) s.justify = j; const i = ITEMS[cs.alignItems]; if (i) s.items = i; if (cs.flexWrap === 'wrap') s.wrap = true; }
    else if (cs.display.includes('grid')) { s.layout = 'grid'; s.cols = Math.max(1, cs.gridTemplateColumns.split(' ').filter(x => /px|fr|%/.test(x)).length); s.gap = Math.round(num(cs.columnGap)); }
    else { s.layout = 'flex'; s.dir = 'column'; s.gap = 8; }
    const name = (el.getAttribute('aria-label') || el.id || tag).slice(0, 40);
    if (tag === 'form') { const f = makeForm(name, all); f.style = { ...f.style, ...s }; return done(f); }
    return done(mkNode(['section', 'header', 'footer', 'main', 'nav', 'article'].includes(tag) ? 'section' : 'container', name, s, { tag: ['section', 'header', 'footer', 'main', 'nav', 'article', 'aside'].includes(tag) ? tag : undefined, children: all }));
  };
  const body = doc.body; const nodes = Array.from(body.children).map(c => walk(c, 0)).filter(Boolean) as Node[];
  return { nodes, title: doc.title || '', count };
}

/** Renders the HTML where it cannot run scripts, converts it, and adds the result as a new section on the current page. */
export function importHtml(html: string, label = 'Imported HTML', css = ''): Promise<number> {
  return new Promise(resolve => {
    const frame = document.createElement('iframe'); frame.setAttribute('sandbox', 'allow-same-origin'); frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('width', '1200'); frame.setAttribute('height', '800'); frame.setAttribute('tabindex', '-1');
    const styled = css.trim() ? (/<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => `${m}<style>${css}</style>`) : `<style>${css}</style>${html}`) : html;
    frame.className = 'ast-import-frame'; frame.srcdoc = styled; let finished = false;
    const finish = (n: number) => { if (finished) return; finished = true; frame.remove(); resolve(n); };
    frame.onload = () => {
      try {
        const { nodes, count } = convertDocument(frame.contentDocument!);
        if (!nodes.length) { toast('Nothing importable was found in that HTML.', 'error'); finish(0); return; }
        const section = makeSection(label, 200); section.style.layout = 'flex'; section.style.dir = 'column'; section.style.gap = 0; section.children = nodes;
        addNode(section, page(getState()).root.id); toast(`Imported ${count} objects. Review spacing and fonts, since this is a best-effort conversion.`); finish(count);
      } catch { toast('Could not read that HTML.', 'error'); finish(0); }
    };
    document.body.appendChild(frame); setTimeout(() => finish(0), 15000);
  });
}
