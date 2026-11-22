/**
 * Turns other kinds of documents into plain HTML that the Studio's HTML importer can read (pure functions, no editor state).
 *  - jsxToHtml: static React markup (see the notes on what it keeps and drops)
 *  - markdownToHtml, textToHtml
 *  - docxToHtml: Word documents (headings, paragraphs, lists, tables, links, bold/italic and embedded pictures)
 */
export type Kind = 'html' | 'css' | 'js' | 'jsx' | 'md' | 'txt' | 'docx' | 'svg' | 'csv' | 'project' | 'unknown';

export function kindOf(name: string): Kind {
  const n = name.toLowerCase();
  if (/\.atomattr\.json$|\.ast$/.test(n)) return 'project';
  const ext = n.split('.').pop() || '';
  if (['html', 'htm', 'xhtml'].includes(ext)) return 'html';
  if (ext === 'css') return 'css';
  if (['js', 'mjs', 'cjs'].includes(ext)) return 'js';
  if (['jsx', 'tsx'].includes(ext)) return 'jsx';
  if (['md', 'markdown', 'mdx'].includes(ext)) return 'md';
  if (['txt', 'text'].includes(ext)) return 'txt';
  if (ext === 'docx') return 'docx';
  if (ext === 'svg') return 'svg';
  if (['csv', 'tsv'].includes(ext)) return 'csv';
  return 'unknown';
}
/** Pasted text has no file name, so guess from what it looks like. */
export function sniff(text: string): Kind {
  const t = text.trim();
  if (/^<svg[\s>]/i.test(t)) return 'svg';
  if (/^<!doctype html|^<html[\s>]|<body[\s>]/i.test(t)) return 'html';
  if (/\bimport\s.+from\s|export\s+default|=>\s*\(?\s*<|return\s*\(?\s*<[A-Za-z>]|className=/.test(t)) return 'jsx';
  if (/^<[a-z][\w-]*[\s>]/i.test(t)) return 'html';
  if (/^[\s\S]*?[^{}]+\{[^{}]*:[^{}]*\}/.test(t) && !/\b(function|const|let|var)\b/.test(t) && /[.#a-z:\[*][^{]*\{/.test(t)) return 'css';
  if (/\b(function|const|let|var|document\.|addEventListener|=>)\b/.test(t)) return 'js';
  if (/^#{1,6}\s|^\s*[-*]\s|\*\*[^*]+\*\*|\]\(/m.test(t)) return 'md';
  return 'txt';
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;');

/* ---------------- Markdown & text ---------------- */
const inline = (raw: string) => {
  const codes: string[] = [];
  let t = raw.replace(/`([^`]+)`/g, (_m, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  t = esc(t)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_m, a, s) => `<img src="${escAttr(s)}" alt="${escAttr(a)}">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_m, a, h) => `<a href="${escAttr(h)}">${a}</a>`)
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_m, a, b) => `<strong>${a || b}</strong>`)
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)|(^|[^_\w])_([^_\n]+)_(?!\w)/g, (_m, p1, a, p2, b) => `${p1 ?? p2}<em>${a ?? b}</em>`);
  return t.replace(/\u0000(\d+)\u0000/g, (_m, i) => `<code>${esc(codes[+i])}</code>`);
};
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '').split('\n'); const out: string[] = []; let i = 0;
  const isBlock = (l: string) => /^(#{1,6}\s|```|>\s?|\s*([-*+]|\d+\.)\s|\s*(-{3,}|\*{3,}|_{3,})\s*$|\|)/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const fence = /^```/.exec(l);
    if (fence) { const body: string[] = []; i++; while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]); i++; out.push(`<pre><code>${esc(body.join('\n'))}</code></pre>`); continue; }
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l); if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(l)) { const q: string[] = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote>${markdownToHtml(q.join('\n'))}</blockquote>`); continue; }
    if (/^\s*([-*+]|\d+\.)\s/.test(l)) {
      const ordered = /^\s*\d+\./.test(l); const items: string[] = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\s*([-*+]|\d+\.)\s+(\[[ xX]\]\s+)?/, ''))}</li>`);
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`); continue;
    }
    if (/^\|/.test(l) && /^\|?\s*:?-{2,}/.test(lines[i + 1] || '')) {
      const cells = (r: string) => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(l); i += 2; const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`); continue;
    }
    const para: string[] = []; while (i < lines.length && lines[i].trim() && !isBlock(lines[i])) para.push(lines[i++].trim());
    if (!para.length) { para.push(lines[i++].trim()); }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}
export const textToHtml = (txt: string) => txt.replace(/\r\n?/g, '\n').split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');

/** A readable default look for documents that carry no styling of their own (Markdown, text, Word). */
export const DOC_CSS = `body{margin:0;padding:48px 24px;font:16px/1.65 system-ui,sans-serif;color:#1f2937;max-width:760px}
h1,h2,h3,h4{line-height:1.2;color:#111827;margin:1.4em 0 .5em}h1{font-size:40px}h2{font-size:30px}h3{font-size:22px}p,ul,ol,blockquote,pre,table{margin:0 0 1em}
blockquote{border-left:4px solid #e5e7eb;padding:4px 16px;color:#4b5563}pre{background:#f3f4f6;padding:16px;border-radius:12px;overflow:auto}code{background:#f3f4f6;padding:2px 6px;border-radius:6px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #e5e7eb;padding:8px 12px;text-align:left}img{max-width:100%}a{color:#2563eb}`;

/* ---------------- React / JSX (static) ---------------- */
const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'wbr']);
const UNITLESS = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'order', 'zoom', 'scale', 'aspectRatio']);
const kebab = (s: string) => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
const KEEP = new Set(['href', 'src', 'alt', 'placeholder', 'type', 'value', 'name', 'id', 'target', 'rel', 'role', 'title', 'width', 'height', 'colspan', 'rowspan', 'for', 'action', 'method', 'checked', 'disabled', 'required', 'min', 'max', 'rows', 'cols', 'lang', 'srcset', 'poster', 'controls', 'autoplay', 'loop', 'muted']);
const RENAME: Record<string, string> = { className: 'class', htmlFor: 'for', colSpan: 'colspan', rowSpan: 'rowspan', defaultValue: 'value', defaultChecked: 'checked', srcSet: 'srcset' };

/** Index just after the balanced `{…}` or `(…)` starting at i, skipping strings, templates and comments. */
function skipBalanced(src: string, i: number): number {
  const open = src[i]; const close = open === '{' ? '}' : ')'; let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") { for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++; continue; }
    if (c === '`') { for (i++; i < src.length && src[i] !== '`'; i++) { if (src[i] === '\\') i++; else if (src[i] === '$' && src[i + 1] === '{') i = skipBalanced(src, i + 1) - 1; } continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2); if (i < 0) return src.length; i++; continue; }
    if (c === open) depth++; else if (c === close && --depth === 0) return i + 1;
  }
  return src.length;
}
const stringLiterals = (expr: string) => Array.from(expr.matchAll(/'([^']*)'|"([^"]*)"|`([^`$]*)`/g)).map(m => m[1] ?? m[2] ?? m[3] ?? '');
function styleFrom(expr: string): string {
  const inner = expr.trim().replace(/^\{\s*/, '').replace(/\s*\}$/, ''); const out: string[] = [];
  for (const m of inner.matchAll(/(?:([A-Za-z_][\w-]*)|'([^']+)'|"([^"]+)")\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`$]*)`|(-?[\d.]+))/g)) {
    const key = m[1] || m[2] || m[3]; const sv = m[4] ?? m[5] ?? m[6]; const nv = m[7];
    if (sv !== undefined) out.push(`${key.startsWith('--') ? key : kebab(key)}:${sv}`);
    else if (nv !== undefined) out.push(`${kebab(key)}:${nv}${UNITLESS.has(key) || +nv === 0 ? '' : 'px'}`);
  }
  return out.join(';');
}
type Comp = { name: string; body: number };
export type JsxResult = { html: string; components: string[]; dropped: number };

export function jsxToHtml(src: string): JsxResult {
  let dropped = 0;
  // Components defined in the same file, so <Hero /> can be expanded where it is used.
  const comps: Comp[] = [];
  for (const m of src.matchAll(/(?:function\s+([A-Z]\w*)\s*\(|(?:const|let)\s+([A-Z]\w*)\s*(?::[^=]+)?=\s*(?:React\.memo\()?(?:\([^)]*\)|[A-Za-z_]\w*)\s*(?::[^=]+)?=>)/g)) {
    const name = m[1] || m[2]; const from = (m.index || 0) + m[0].length;
    const r = /(?:return\s*\(?\s*|=>\s*\(?\s*)(<[A-Za-z>])/g; r.lastIndex = from; const f = r.exec(src);
    if (f) comps.push({ name, body: f.index + f[0].length - f[1].length });
  }
  const compOf = (n: string) => comps.find(c => c.name === n);
  let nest = 0;

  function expr(e: string): string {
    const t = e.trim(); if (!t || /^\/\*[\s\S]*\*\/$/.test(t)) return '';
    const s = /^(['"])([\s\S]*)\1$/.exec(t); if (s) return esc(s[2]);
    const tpl = /^`([^`$]*)`$/.exec(t); if (tpl) return esc(tpl[1]);
    const j = /(?:^|[(?:&|]|=>|return)\s*(<[A-Za-z>])/.exec(t);
    if (j && j.index !== undefined) {
      const at = t.indexOf('<', j.index + (j[0].length - j[1].length));
      const one = element(t, at)[0];
      return /\.map\(/.test(t) ? one + one + one : one;
    }
    if (/^[\w.$?]+$/.test(t)) return `{${esc(t)}}`;
    dropped++; return '';
  }
  function attrs(src2: string, i: number): [string, number, boolean] {
    const out: string[] = []; let linkTo = '';
    for (;;) {
      while (/\s/.test(src2[i] || '')) i++;
      if (src2[i] === '/' && src2[i + 1] === '>') return [out.join(' '), i + 2, true];
      if (src2[i] === '>') return [out.join(' '), i + 1, false];
      if (i >= src2.length) return [out.join(' '), i, true];
      if (src2[i] === '{') { i = skipBalanced(src2, i); dropped++; continue; }
      const m = /^[A-Za-z_][\w:.-]*/.exec(src2.slice(i)); if (!m) { i++; continue; }
      const name = m[0]; i += name.length; let val: string | null = '';
      while (/\s/.test(src2[i] || '')) { if (src2[i + 1] === '=') { i++; break; } break; }
      if (src2[i] === '=') {
        i++; while (/\s/.test(src2[i] || '')) i++;
        if (src2[i] === '"' || src2[i] === "'") { const q = src2[i]; const end = src2.indexOf(q, i + 1); val = src2.slice(i + 1, end < 0 ? undefined : end); i = end < 0 ? src2.length : end + 1; }
        else if (src2[i] === '{') {
          const end = skipBalanced(src2, i); const ex = src2.slice(i + 1, end - 1); i = end;
          if (name === 'style') val = styleFrom(ex);
          else if (name === 'className' || name === 'class') val = stringLiterals(ex).join(' ').replace(/\s+/g, ' ').trim();
          else { const sl = /^\s*(?:(['"])([\s\S]*)\1|`([^`$]*)`)\s*$/.exec(ex); const num = /^\s*(-?[\d.]+)\s*$/.exec(ex); val = sl ? (sl[2] ?? sl[3]) : num ? num[1] : null; }
          if (val === null) { dropped++; continue; }
        }
      }
      if (name === 'to') { linkTo = val || ''; continue; }
      if (/^on[A-Z]/.test(name) || name === 'key' || name === 'ref' || name === 'dangerouslySetInnerHTML') continue;
      const rn = RENAME[name] || name;
      if (rn === 'style') { if (val) out.push(`style="${escAttr(val)}"`); continue; }
      if (rn === 'class') { if (val) out.push(`class="${escAttr(val)}"`); continue; }
      if (KEEP.has(rn) || /^(aria|data)-/.test(rn)) out.push(val === '' && !/^(aria|data)-/.test(rn) ? rn : `${rn}="${escAttr(val)}"`);
    }
    // (react-router `to` becomes href)
    // eslint-disable-next-line no-unreachable
    void linkTo;
  }
  /** Converts the element starting at src2[i] ('<'); returns [html, indexAfter]. */
  function element(src2: string, i: number): [string, number] {
    if (src2.startsWith('<>', i)) { const [kids, j] = children(src2, i + 2, ''); return [kids, j]; }
    const nm = /^<([A-Za-z_][\w.:-]*)/.exec(src2.slice(i)); if (!nm) return ['', i + 1];
    const raw = nm[1]; let j = i + nm[0].length;
    const startAttrs = j; let [at, k, self] = attrs(src2, j); j = k;
    const isComp = /^[A-Z]/.test(raw) || raw.includes('.'); const lower = raw.toLowerCase();
    let tag = isComp ? 'div' : lower; let extra = '';
    if (isComp) {
      if (/^(Link|NavLink|a)$/.test(raw)) { tag = 'a'; const to = /\bto\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*['"`]([^'"`]*)['"`]\s*\})/.exec(src2.slice(startAttrs, j)); extra = ` href="${escAttr(to ? (to[1] ?? to[2] ?? to[3]) : '#')}"`; }
      else if (/^(Image|img)$/.test(raw)) tag = 'img'; else if (/^(Button)$/.test(raw)) tag = 'button';
      else extra = ` data-component="${escAttr(raw)}"`;
    }
    if (self) {
      if (isComp && tag === 'div') { const c = compOf(raw); if (c && nest < 4) { nest++; const body = element(src, c.body)[0]; nest--; return [body, j]; } return ['', j]; }
      return [VOID.has(tag) ? `<${tag}${extra}${at ? ' ' + at : ''}>` : `<${tag}${extra}${at ? ' ' + at : ''}></${tag}>`, j];
    }
    const [kids, end] = children(src2, j, raw);
    if (isComp && tag === 'div') { const c = compOf(raw); if (c && nest < 4 && !kids.trim()) { nest++; const body = element(src, c.body)[0]; nest--; return [body, end]; } }
    return [VOID.has(tag) ? `<${tag}${extra}${at ? ' ' + at : ''}>` : `<${tag}${extra}${at ? ' ' + at : ''}>${kids}</${tag}>`, end];
  }
  function children(src2: string, i: number, closeName: string): [string, number] {
    let out = '';
    while (i < src2.length) {
      if (src2.startsWith('</', i)) { const e = src2.indexOf('>', i); return [out, e < 0 ? src2.length : e + 1]; }
      if (src2[i] === '<') { const [h, j] = element(src2, i); out += h; i = Math.max(j, i + 1); continue; }
      if (src2[i] === '{') { const e = skipBalanced(src2, i); out += expr(src2.slice(i + 1, e - 1)); i = e; continue; }
      let e = i; while (e < src2.length && src2[e] !== '<' && src2[e] !== '{') e++;
      out += esc(src2.slice(i, e).replace(/\s*\n\s*/g, ' ')); i = e;
    }
    void closeName; return [out, i];
  }

  // Pick the main component: the default export, else App, else the last one found, else the first JSX in the file.
  const def = /export\s+default\s+(?:function\s+)?([A-Z]\w*)/.exec(src)?.[1];
  const root = (def && compOf(def)) || compOf('App') || comps[comps.length - 1];
  let start = root ? root.body : src.search(/<[A-Za-z>]/);
  if (start < 0) return { html: '', components: comps.map(c => c.name), dropped };
  const html = element(src, start)[0];
  return { html, components: comps.map(c => c.name), dropped };
}

/* ---------------- Word (.docx) ---------------- */
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
export async function docxToHtml(data: ArrayBuffer | Uint8Array): Promise<{ html: string; images: number }> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(data); const docFile = zip.file('word/document.xml'); if (!docFile) throw new Error('not a Word document');
  const parse = (x: string) => new DOMParser().parseFromString(x, 'application/xml');
  const doc = parse(await docFile.async('string'));
  const relsFile = zip.file('word/_rels/document.xml.rels'); const rels: Record<string, string> = {};
  if (relsFile) for (const r of Array.from(parse(await relsFile.async('string')).getElementsByTagName('Relationship'))) rels[r.getAttribute('Id') || ''] = r.getAttribute('Target') || '';
  const pics: Record<string, string> = {}; let images = 0;
  for (const [id, target] of Object.entries(rels)) {
    const ext = target.split('.').pop()?.toLowerCase() || ''; if (!MIME[ext] || !/media\//.test(target)) continue;
    const f = zip.file('word/' + target.replace(/^\/?(word\/)?/, '')); if (f) pics[id] = `data:${MIME[ext]};base64,${await f.async('base64')}`;
  }
  const ln = (e: Element) => e.localName; const kids = (e: Element, n: string) => Array.from(e.children).filter(c => ln(c) === n);
  const first = (e: Element, n: string) => kids(e, n)[0];
  const on = (e: Element | undefined) => !!e && !/^(0|false|none)$/.test(e.getAttribute('w:val') || e.getAttribute('val') || '');
  const runs = (p: Element): string => {
    let out = '';
    const walk = (n: Element) => {
      for (const c of Array.from(n.children)) {
        const name = ln(c);
        if (name === 'r') {
          const rp = first(c, 'rPr'); let t = '';
          for (const x of Array.from(c.children)) {
            if (ln(x) === 't') t += esc(x.textContent || ''); else if (ln(x) === 'tab') t += ' '; else if (ln(x) === 'br') t += '<br>';
            else if (ln(x) === 'drawing') { const blip = x.getElementsByTagName('a:blip')[0]; const id = blip?.getAttribute('r:embed'); if (id && pics[id]) { images++; t += `<img src="${pics[id]}" alt="">`; } }
          }
          if (rp && t) { if (on(first(rp, 'b'))) t = `<strong>${t}</strong>`; if (on(first(rp, 'i'))) t = `<em>${t}</em>`; if (on(first(rp, 'u'))) t = `<u>${t}</u>`; }
          out += t;
        } else if (name === 'hyperlink') { const id = c.getAttribute('r:id'); const before = out; out = ''; walk(c); const inner = out; out = before + (id && rels[id] ? `<a href="${escAttr(rels[id])}">${inner}</a>` : inner); }
        else if (['smartTag', 'sdt', 'sdtContent', 'ins'].includes(name)) walk(c);
      }
    };
    walk(p); return out;
  };
  const para = (p: Element): { tag: string; html: string; li: boolean } => {
    const ppr = first(p, 'pPr'); const style = first(ppr || p, 'pStyle')?.getAttribute('w:val') || '';
    const h = /^(?:Heading|heading)\s*(\d)/.exec(style); const li = !!(ppr && first(ppr, 'numPr')) || /List/i.test(style);
    const tag = /^Title$/i.test(style) ? 'h1' : /^Subtitle$/i.test(style) ? 'h2' : h ? `h${Math.min(6, +h[1] + (/^Title$/i.test(style) ? 0 : 0))}` : 'p';
    return { tag, html: runs(p), li };
  };
  const out: string[] = []; const body = doc.getElementsByTagName('w:body')[0] || doc.documentElement; let list: string[] = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.join('')}</ul>`); list = []; } };
  const block = (e: Element) => {
    const n = ln(e);
    if (n === 'p') { const p = para(e); if (!p.html.replace(/<[^>]+>/g, '').trim() && !/<img/.test(p.html)) { flush(); return; } if (p.li) list.push(`<li>${p.html}</li>`); else { flush(); out.push(`<${p.tag}>${p.html}</${p.tag}>`); } }
    else if (n === 'tbl') { flush(); out.push(`<table>${kids(e, 'tr').map(r => `<tr>${kids(r, 'tc').map(c => `<td>${kids(c, 'p').map(x => runs(x)).filter(Boolean).join('<br>')}</td>`).join('')}</tr>`).join('')}</table>`); }
    else if (n === 'sdt') { const c = first(e, 'sdtContent'); if (c) Array.from(c.children).forEach(block); }
  };
  Array.from(body.children).forEach(block); flush();
  return { html: out.join('\n'), images };
}
