/* AtomAttr UI design page (item.js, loaded by item.html).
   Everything is styled with AtomAttr attributes. The only inline styles are the per-frame geometry
   (left, top, width, height, transform), pointer-events on overlays, the zoom bar offset when the
   code sheet is open, and the code block's wrapping; those change on every pan, zoom or toggle. */

const $ = (id) => document.getElementById(id);
const root = $('app');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DRAFT_KEY = 'atomattr-ui-drafts', ADMIN_KEY = 'atomattr-ui-admin-until';
const FRAMES = { Navbars: { w: 820, h: 260 }, Buttons: { w: 480, h: 280 }, Cards: { w: 440, h: 400 }, Forms: { w: 440, h: 420 }, Feedback: { w: 480, h: 360 }, Sections: { w: 1000, h: 440 }, Templates: { w: 1200, h: 760 }, Components: { w: 480, h: 320 } };
const WIDE = ['Navbars', 'Sections', 'Templates'];
const KINDS = { Navbars: 'Navbar', Buttons: 'Button', Cards: 'Card', Forms: 'Form', Feedback: 'Feedback', Sections: 'Section', Templates: 'Template', Components: 'Component' };
const frameOf = (i) => (i.frame ? (i.wide ? { w: i.frame.w, h: Math.max(i.frame.h, 360) } : { w: Math.max(i.frame.w, 560), h: Math.max(i.frame.h, 360) }) : { w: 560, h: 360 });
const isTop = (i) => (i.align ? i.align === 'top' : !!i.wide);
const kind = (c) => KINDS[c] || String(c || 'Design').replace(/s$/, '');
const ghost = (...els) => els.forEach((e) => { if (e) e.style.pointerEvents = 'none'; });

/* ---------- preview document: attributes only, no <style> ---------- */
const LT = String.fromCharCode(60); /* built from a char code so no tool can fold it into a literal closing script tag */
const SCRIPT_TAG = `${LT}script src="dist/atomattr.min.js" defer>${LT}/script>`;
const SKELETON = '<div p="6" display="grid" gap="4" max-w="4xl" mx="auto" opacity="70"><div bg="gray-100" dark-bg="gray-900" rounded="md" h="28"></div><div display="grid" grid-cols="3" gap="4"><div bg="gray-100" dark-bg="gray-900" rounded="md" h="16"></div><div bg="gray-100" dark-bg="gray-900" rounded="md" h="16"></div><div bg="gray-100" dark-bg="gray-900" rounded="md" h="16"></div></div></div>';
function previewDocument(item, dark) {
  const base = new URL('./', location.href).href;
  const top = isTop(item), pad = item.pad ?? (top ? 0 : 24);
  const skeleton = item.group === 'navigation' && item.wide && item.page !== false ? SKELETON : '';
  const layout = top ? 'display="block"' : 'display="flex" items="center" justify="center"';
  return `<!doctype html><html class="${dark ? 'dark' : ''}"><head><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><link rel="stylesheet" href="dist/defaults.css"><link rel="stylesheet" href="assets/remixicon/remixicon.css">${item.css ? `${LT}style>${item.css}${LT}/style>` : ''}${SCRIPT_TAG}${item.behavior ? `${LT}script src="assets/studio-behavior.js" defer>${LT}/script>` : ''}</head><body bg="#fff" text="text" font-family="sans" m="0" p="${pad}px" min-h="100vh" ${layout}>${item.preview}${skeleton}</body></html>`;
}

/* ---------- source helpers ---------- */
function reactSource(item) {
  const jsx = item.preview
    .replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^<>]*?)?\s*\/?>/gi, (t, n, a = '') => `<${n}${a.trimEnd()} />`)
    .replace(/(\s)class=/g, '$1className=').replace(/(\s)for=/g, '$1htmlFor=');
  const name = (item.name.replace(/[^a-z\d]/gi, '') || 'Pattern').replace(/^\d/, 'Pattern$&');
  return `import React from 'react';\nimport { startAtomAttr } from 'atomattr';\nimport 'atomattr/defaults.css';\n\nstartAtomAttr();\n\nexport function ${name}() {\n  return (\n    <>\n      ${jsx.replace(/\n/g, '\n      ')}\n    </>\n  );\n}\n`;
}
function highlight(src) {
  return esc(src)
    .replace(/(&lt;\/?)([a-z][a-z0-9-]*)/gi, '$1<span text="blue-500">$2</span>')
    .replace(/(\s)([a-z][a-z0-9:-]*)=(&quot;[\s\S]*?&quot;)/gi, '$1<span text="amber-500">$2</span>=<span text="emerald-500">$3</span>');
}
/* ---------- prettify: indent HTML, one attribute per line when a tag gets long ---------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'pre', 'textarea']);
function prettyHtml(markup) {
  const toks = String(markup).match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || [];
  const out = [];
  let depth = 0;
  const pad = (d) => '  '.repeat(d);
  const name = (t) => ((t.match(/^<\/?\s*([a-z][a-z0-9-]*)/i) || [])[1] || '').toLowerCase();
  const isClose = (t) => /^<\//.test(t);
  const isOpen = (t) => /^<[a-z]/i.test(t) && !/\/>$/.test(t) && !VOID.has(name(t));
  const tag = (t, d) => {
    if (pad(d).length + t.length <= 90) return [pad(d) + t];
    const m = t.match(/^<([a-z][a-z0-9-]*)([\s\S]*?)(\/?)>$/i);
    const attrs = m ? m[2].match(/[^\s=]+(?:=(?:"[^"]*"|'[^']*'|[^\s"']+))?/g) || [] : [];
    if (attrs.length < 2) return [pad(d) + t];
    return [pad(d) + '<' + m[1], ...attrs.map((a, i) => pad(d + 1) + a + (i === attrs.length - 1 ? (m[3] ? ' />' : '>') : ''))];
  };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (!t.startsWith('<')) { const x = t.replace(/\s+/g, ' ').trim(); if (x) out.push(pad(depth) + x); continue; }
    if (t.startsWith('<!')) { out.push(pad(depth) + t.trim()); continue; }
    if (isClose(t)) { depth = Math.max(0, depth - 1); out.push(pad(depth) + t); continue; }
    if (!isOpen(t)) { out.push(...tag(t, depth)); continue; }
    const n = name(t), lines = tag(t, depth), a = toks[i + 1], b = toks[i + 2];
    if (RAWas(n)) { /* keep script, style, pre and textarea content as written */
      let j = i + 1, raw = '';
      while (j < toks.length && !(isClose(toks[j]) && name(toks[j]) === n)) raw += toks[j++];
      out.push(pad(depth) + t + raw + (toks[j] || '')); i = j; continue;
    }
    if (lines.length === 1 && a !== undefined && isClose(a) && name(a) === n) { out.push(lines[0] + a); i += 1; continue; } /* <i></i> */
    if (lines.length === 1 && a !== undefined && !a.startsWith('<') && b !== undefined && isClose(b) && name(b) === n) {
      const x = a.replace(/\s+/g, ' ').trim();
      if (x.length <= 80) { out.push(lines[0] + x + b); i += 2; continue; } /* <b>text</b> on one line */
    }
    out.push(...lines); depth += 1;
  }
  return out.join('\n');
}
async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
    await navigator.clipboard.writeText(text); return true;
  } catch {
    const f = document.createElement('textarea');
    f.value = text; f.setAttribute('readonly', ''); f.style.cssText = 'position:fixed;opacity:0';
    document.body.append(f); f.select();
    const ok = document.execCommand('copy'); f.remove(); return ok;
  }
}
let toastTimer;
function toast(msg) {
  const t = $('toast');
  $('toast-msg').textContent = msg;
  t.setAttribute('display', 'flex');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.setAttribute('display', 'none'), 1800);
}

/* ---------- screenshots ---------- */
const H2I = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
const SHOT_SCALE = 2;
const SHOT_OPTS = [
  ['screen', 'ri-window-line', 'Entire screen', 'The preview area as you see it'],
  ['window', 'ri-macbook-line', 'Entire window', 'The whole page, panels included'],
  ['content', 'ri-crop-line', 'Content only', 'Just the design, at its real size']
];
function loadH2I(win = window) {
  if (win.htmlToImage) return Promise.resolve(win.htmlToImage);
  if (win.__h2iLoading) return win.__h2iLoading;
  return (win.__h2iLoading = new Promise((res, rej) => {
    const s = win.document.createElement('script');
    s.src = H2I;
    s.onload = () => res(win.htmlToImage);
    s.onerror = () => { win.__h2iLoading = null; rej(new Error('Could not load the screenshot library')); };
    win.document.head.append(s);
  }));
}
const downloadCanvas = (canvas, name) => new Promise((res) => canvas.toBlob((b) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000); res();
}, 'image/png'));
const roundRectPath = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };

/* ---------- Playground handoff (existing #code= share format) ---------- */
function b64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return 'z.' + b64u(new Uint8Array(await new Response(stream).arrayBuffer()));
    } catch { /* fall back to plain */ }
  }
  return 'b.' + b64u(bytes);
}

/* ---------- layer tree ---------- */
const NAMES = { nav: 'Navbar', header: 'Header', footer: 'Footer', section: 'Section', article: 'Article', aside: 'Aside', main: 'Main', div: 'Frame', span: 'Group', a: 'Link', button: 'Button', input: 'Input', textarea: 'Textarea', select: 'Select', label: 'Label', form: 'Form', h1: 'Heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', p: 'Text', b: 'Text', strong: 'Text', small: 'Text', blockquote: 'Quote', figure: 'Figure', figcaption: 'Caption', ul: 'List', ol: 'List', li: 'Item', img: 'Image', kbd: 'Key', code: 'Code', details: 'Details', summary: 'Summary', pre: 'Code block' };
const ICONS = { a: 'ri-link', button: 'ri-cursor-line', input: 'ri-edit-box-line', textarea: 'ri-edit-box-line', select: 'ri-arrow-down-s-line', img: 'ri-image-line', ul: 'ri-list-check', ol: 'ri-list-check', li: 'ri-list-unordered', blockquote: 'ri-double-quotes-l', kbd: 'ri-keyboard-line' };
const TEXTY = new Set(['h1', 'h2', 'h3', 'h4', 'p', 'b', 'strong', 'small', 'figcaption', 'summary']);
function describe(el) {
  const t = el.localName, leaf = el.children.length === 0;
  /* authors can name layers: data-name="Pricing card" or aria-label */
  const custom = el.getAttribute('data-name') || el.getAttribute('aria-label');
  const name = custom || NAMES[t] || t;
  const hint = custom ? '' : (el.getAttribute('placeholder') || (leaf ? el.textContent : '') || '').replace(/\s+/g, ' ').trim().slice(0, 22);
  const icon = ICONS[t] || (TEXTY.has(t) || ((t === 'span' || t === 'label') && leaf) ? 'ri-text' : 'ri-layout-4-line');
  return { name, hint, icon };
}
function parseMarkup(markup) {
  const d = new DOMParser().parseFromString('<!doctype html><body>' + markup, 'text/html');
  const list = [...d.body.querySelectorAll('*')].slice(0, 400);
  const idx = new Map(list.map((el, i) => [el, i]));
  return list.map((el) => {
    const parent = idx.has(el.parentElement) ? idx.get(el.parentElement) : -1;
    let depth = 0, p = el.parentElement;
    while (p && p !== d.body) { depth += 1; p = p.parentElement; }
    return { el, parent, depth };
  });
}

function fail(title, msg) {
  root.setAttribute('aria-busy', 'false');
  root.innerHTML = `<div display="flex" flex-col items="center" justify="center" gap="3" px="4" align="center" min-h="100vh"><h1 m="0" font-size="3xl">${esc(title)}</h1><p m="0" text="muted">${esc(msg)}</p><a href="./catalog.html" bg="primary" text="white" px="5" py="2.5" rounded="md" font-weight="600" text-decoration="none">Back to the library</a></div>`;
}

/* ---------- preview devices (pick any; the design frame is the default) ---------- */
const DEVICES = {
  desktop: { label: 'Desktop', icon: 'ri-computer-line', w: 1440, h: 900, group: 'Desktop' },
  'desktop-hd': { label: 'Full HD', icon: 'ri-computer-line', w: 1920, h: 1080 },
  laptop: { label: 'Laptop', icon: 'ri-macbook-line', w: 1280, h: 800 },
  'ipad-pro': { label: 'iPad Pro 12.9', icon: 'ri-tablet-line', w: 1024, h: 1366, r: 18, group: 'Tablet' },
  'ipad-air': { label: 'iPad Air', icon: 'ri-tablet-line', w: 820, h: 1180, r: 18 },
  'ipad-mini': { label: 'iPad mini', icon: 'ri-tablet-line', w: 768, h: 1024, r: 18 },
  'surface-pro': { label: 'Surface Pro 7', icon: 'ri-tablet-line', w: 912, h: 1368, r: 12 },
  'iphone-14-pro-max': { label: 'iPhone 14 Pro Max', icon: 'ri-smartphone-line', w: 430, h: 932, r: 30, group: 'Phone' },
  'iphone-14': { label: 'iPhone 14', icon: 'ri-smartphone-line', w: 390, h: 844, r: 30 },
  'iphone-se': { label: 'iPhone SE', icon: 'ri-smartphone-line', w: 375, h: 667, r: 24 },
  'pixel-7': { label: 'Pixel 7', icon: 'ri-smartphone-line', w: 412, h: 915, r: 26 },
  'galaxy-s20-ultra': { label: 'Galaxy S20 Ultra', icon: 'ri-smartphone-line', w: 412, h: 915, r: 26 },
  'galaxy-s20': { label: 'Galaxy S20', icon: 'ri-smartphone-line', w: 360, h: 800, r: 26 },
  'galaxy-fold': { label: 'Galaxy Fold', icon: 'ri-smartphone-line', w: 280, h: 653, r: 20 }
};

/* ---------- attribute-driven selected states ---------- */
const setTool = (b, on) => { if (!b) return; b.setAttribute('aria-pressed', String(on)); b.setAttribute('bg', on ? 'primary/10' : 'transparent'); b.setAttribute('text', on ? 'primary' : 'muted'); };
const setPill = (b, on) => { b.setAttribute('aria-pressed', String(on)); b.setAttribute('bg', on ? 'primary/10' : 'gray-100'); b.setAttribute('dark-bg', on ? 'primary/20' : 'gray-800'); b.setAttribute('text', on ? 'primary' : 'muted'); };

/* ---------- render ---------- */
function render(item, all) {
  document.title = `${item.name} — AtomAttr UI`;
  root.setAttribute('aria-busy', 'false');

  const fr = frameOf(item);
  const nodes = parseMarkup(item.preview);
  const layers = nodes.map((n, i) => ({ ...n, i })).filter((n) => !['i', 'br', 'option'].includes(n.el.localName));
  const hasKids = new Set(nodes.map((n) => n.parent).filter((p) => p >= 0));
  const draft = item.status === 'draft' || item.origin === 'draft';
  const added = item.added && !isNaN(new Date(item.added)) ? new Date(item.added).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const state = { sel: 0, mode: 'inspect', device: 'frame', format: 'HTML', code: false, drawer: null, menu: false, devMenu: false, wrap: true, pretty: false };
  const collapsed = new Set();
  const isDark = () => document.documentElement.classList.contains('dark');
  const source = () => {
    let html = state.pretty ? prettyHtml(item.preview) : item.preview;
    if (item.css) html += `\n\n<!-- Styles this component needs (animations and interactive states) -->\n${LT}style>\n${item.css}\n${LT}/style>`;
    if (item.behavior) html += `\n\n<!-- Interactive behaviour: include once per page (assets/studio-behavior.js in the Atomattr site) -->\n${LT}script src="studio-behavior.js" defer>${LT}/script>`;
    return state.format === 'React' ? reactSource({ ...item, preview: html }) : html;
  };

  const toolBtn = 'w="9" h="9" flex="none" rounded="md" border="0" hover-bg="gray-100" dark-hover-bg="gray-800" display="flex" items="center" justify="center" cursor="pointer" font-size="lg"';
  const closeBtn = 'type="button" data-close display="flex" lg-display="none" items="center" justify="center" flex="none" w="8" h="8" rounded="md" border="0" bg="transparent" text="muted" hover-bg="gray-100" dark-hover-bg="gray-800" cursor="pointer" font-size="lg" aria-label="Close panel"';
  const meta = (label, value) => value ? `<div display="flex" justify="between" gap="4" py="2" border-b="1px solid gray-100" dark-border-color="gray-800"><dt m="0" text="muted" flex="none">${label}</dt><dd m="0" text="text" font-weight="500" align="right" truncate min-w="0" title="${esc(value)}">${esc(value)}</dd></div>` : '';
  const handle = (pos) => `<span position="absolute" w="2.5" h="2.5" bg="#fff" border="2px solid primary" ${pos}></span>`;
  const pgBtn = 'type="button" data-pg';

  root.innerHTML = `
    <div display="flex" flex-col h="100dvh" overflow="hidden" bg="#fff" dark-bg="gray-900">

      <header display="flex" items="center" gap="2" px="3" md-px="4" h="14" flex="none" bg="#fff" dark-bg="gray-900" border-b="1px solid gray-200" dark-border-color="gray-800">
        <div display="flex" items="center" gap="2" md-gap="4" flex="1" min-w="0">
          <button type="button" data-drawer="layers" ${toolBtn} lg-display="none" bg="transparent" text="muted" aria-label="Open layers" aria-expanded="false" title="Layers"><i class="ri-stack-line"></i></button>
          <a href="./index.html" aria-label="Atomattr home" display="flex" items="center" flex="none" text="text" text-decoration="none" font-weight="bold" font-size="lg"><img src="./assets/images/logo.png" alt="Atomattr" h="6" dark-display="none" display="flex"><img src="./assets/images/logo.dark.png" alt="Atomattr" h="6" dark-display="flex" display="none"></a>
          <nav display="none" md-display="flex" items="center" gap="2" min-w="0" font-size="sm" aria-label="Breadcrumb">
            <a href="./catalog.html" text="muted" hover-text="primary" text-decoration="none" flex="none">Library</a>
            <i class="ri-arrow-right-s-line" text="muted" flex="none"></i>
            <a href="./catalog.html?category=${encodeURIComponent(item.category)}" display="block" truncate max-w="9rem" text="muted" hover-text="primary" text-decoration="none">${esc(item.category)}</a>
            <i class="ri-arrow-right-s-line" text="muted" flex="none"></i>
            <b truncate min-w="0">${esc(item.name)}</b>
            ${draft ? '<span flex="none" bg="warning/10" text="warning" rounded="md" px="2" py="0.5" font-size="xs" font-weight="700">Draft</span>' : ''}
          </nav>
        </div>

        <div display="flex" items="center" justify="end" gap="1" md-gap="2" flex="1" min-w="0">
        <div id="view-wrap" position="relative" flex="none">
          <button type="button" id="view-trigger" aria-haspopup="menu" aria-expanded="false" aria-label="Change view" display="flex" items="center" gap="1.5" h="9" px="2.5" md-px="3" rounded="md" border="0" bg="gray-100" hover-bg="gray-100" dark-hover-bg="gray-800" text="text" font-size="sm" font-weight="600" cursor="pointer" dark-bg="gray-900"><i id="view-icon" class="ri-cursor-line" text="primary" font-size="lg"></i><span id="view-label" display="none" md-display="inline">Inspect</span><i class="ri-arrow-down-s-line" text="muted"></i></button>
          <div id="view-menu" role="menu" aria-label="View" position="absolute" top="100%" mt="2" right="0" display="none" w="12rem" bg="gray-100" dark-bg="gray-900" border="0" rounded="md" shadow="xl" p="1" z="50">
            <button type="button" role="menuitemradio" data-view="inspect" aria-checked="false" display="flex" items="center" gap="2" w="full" px="3" py="2" rounded="md" border="0" bg="transparent" text="text" hover-bg="gray-100" dark-hover-bg="gray-800" font-size="sm" font-weight="500" cursor="pointer" align="left"><i class="ri-cursor-line" flex="none" font-size="lg"></i><span flex="1" min-w="0" truncate>Inspect</span><i class="ri-check-line" data-check flex="none" opacity="0"></i></button>
            <button type="button" role="menuitemradio" data-view="responsive" aria-checked="false" display="flex" items="center" gap="2" w="full" px="3" py="2" rounded="md" border="0" bg="transparent" text="text" hover-bg="gray-100" dark-hover-bg="gray-800" font-size="sm" font-weight="500" cursor="pointer" align="left"><i class="ri-layout-grid-line" flex="none" font-size="lg"></i><span flex="1" min-w="0" truncate>Responsive</span><i class="ri-check-line" data-check flex="none" opacity="0"></i></button>
            <button type="button" role="menuitemradio" data-view="code" aria-checked="false" display="flex" items="center" gap="2" w="full" px="3" py="2" rounded="md" border="0" bg="transparent" text="text" hover-bg="gray-100" dark-hover-bg="gray-800" font-size="sm" font-weight="500" cursor="pointer" align="left"><i class="ri-code-s-slash-line" flex="none" font-size="lg"></i><span flex="1" min-w="0" truncate>Code</span><i class="ri-check-line" data-check flex="none" opacity="0"></i></button>
          </div>
        </div>
          <button type="button" id="theme" bg="transparent" text="muted" ${toolBtn} aria-label="Toggle light and dark theme" title="Toggle theme"><i class="ri-contrast-line"></i></button>
          <button type="button" data-drawer="attrs" ${toolBtn} lg-display="none" bg="transparent" text="muted" aria-label="Open details" aria-expanded="false" title="Details"><i class="ri-settings-3-line"></i></button>
        </div>
      </header>

      <div display="grid" grid-cols="1" lg-grid-cols="12" flex="1" min-h="0">

        <aside id="layers-panel" display="none" lg-display="block" position="fixed" lg-position="static" top="14" bottom="0" left="0" w="18rem" max-w="85%" lg-w="full" lg-max-w="none" z="40" shadow="xl" lg-shadow="none" lg-col-span="2" min-h="0" overflow="auto" bg="#fff" dark-bg="gray-900" p="4" font-size="sm" text="muted" border-r="1px solid gray-200" dark-border-color="gray-800" aria-label="Layers">
          <div display="flex" items="center" justify="between" gap="2" mb="3">
            <p m="0" font-size="xs" font-weight="700" tracking="wide">LAYERS</p>
            <button ${closeBtn}><i class="ri-close-line"></i></button>
          </div>
          <div id="layers" display="flex" flex-col gap="1"></div>
        </aside>

        <main lg-col-span="7" position="relative" min-h="0" min-w="0" overflow="hidden" bg="gray-50" dark-bg="gray-950" bg-gradient="radial-gradient(rgba(128,128,128,.25) 1px, transparent 1px)" bg-size="16px 16px" aria-label="Preview canvas">
          <div id="canvas" position="absolute" left="0" top="0" w="full" h="full">
            <div id="stage" position="absolute" left="0" top="0" w="full" h="full" overflow="hidden">
              <div id="frame" position="absolute" left="0" top="0" bg="#fff" shadow="lg" rounded="md" overflow="hidden">
                <iframe id="pv" title="${esc(item.name)} live preview" display="block" w="full" h="full" border="0"></iframe>
              </div>
              <div id="hv" position="absolute" display="none" border="0" bg="primary/10"></div>
              <div id="sel" position="absolute" display="none" border="2px solid primary">
                ${handle('top="-6px" left="-6px"')}${handle('top="-6px" right="-6px"')}${handle('bottom="-6px" left="-6px"')}${handle('bottom="-6px" right="-6px"')}
              </div>
              <span id="sl" position="absolute" display="none" bg="primary" text="white" px="2" py="0.5" rounded="md" font-size="xs" font-weight="600" whitespace="nowrap" max-w="14rem" truncate z="5"></span>
            </div>

            <div id="devices" position="absolute" left="3" top="3" display="none" z="30" max-w="calc(100% - 24px)">
              <div position="relative">
                <button type="button" id="device-trigger" aria-haspopup="menu" aria-expanded="false" aria-label="Choose a device" display="flex" items="center" gap="2" max-w="100%" h="9" px="3" bg="gray-100" dark-bg="gray-900" border="0" rounded="md" shadow="md" text="text" font-size="xs" font-weight="600" cursor="pointer"><i id="device-icon" class="ri-layout-line" text="primary" font-size="lg" flex="none"></i><span id="device-label" truncate min-w="0">Design frame</span><span id="device-size" text="muted" font-weight="500" display="none" md-display="inline" flex="none"></span><i class="ri-arrow-down-s-line" text="muted" flex="none"></i></button>
                <div id="device-menu" role="menu" aria-label="Devices" position="absolute" top="100%" mt="2" left="0" display="none" w="17rem" max-w="calc(100vw - 24px)" max-h="60vh" overflow="auto" bg="gray-100" dark-bg="gray-900" border="0" rounded="md" shadow="xl" p="1" z="50"></div>
              </div>
            </div>

            <div id="zoombar" position="absolute" left="3" bottom="3" display="flex" items="center" gap="1" bg="gray-100" dark-bg="gray-900" border="0" rounded="md" p="1" shadow="md" z="25">
              <button type="button" id="zoom-out" aria-label="Zoom out" w="7" h="7" rounded="md" border="0" bg="transparent" hover-bg="gray-100" dark-hover-bg="gray-800" text="text" cursor="pointer"><i class="ri-subtract-line"></i></button>
              <button type="button" id="zoom-fit" title="Fit to canvas (Shift+1)" px="2" h="7" min-w="14" rounded="md" border="0" bg="transparent" hover-bg="gray-100" dark-hover-bg="gray-800" text="text" font-size="xs" font-weight="600" cursor="pointer"><span id="zoom-label" font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important">100%</span></button>
              <button type="button" id="zoom-in" aria-label="Zoom in" w="7" h="7" rounded="md" border="0" bg="transparent" hover-bg="gray-100" dark-hover-bg="gray-800" text="text" cursor="pointer"><i class="ri-add-line"></i></button>
            </div>
            <p display="none" lg-display="block" position="absolute" right="4" bottom="3" m="0" text="muted" font-size="xs" z="5" truncate max-w="50%">Scroll to pan · Ctrl/Cmd + scroll to zoom · Space + drag to pan</p>
          </div>

          <section id="codeview" position="absolute" left="3" right="3" bottom="3" h="50%" min-h="14rem" max-h="22rem" display="none" flex-col bg="gray-100" dark-bg="gray-900" border="0" rounded="md" shadow="xl" overflow="hidden" z="20" aria-label="Source code">
            <div display="flex" items="center" gap="2" px="3" py="2" flex="none" border-b="1px solid gray-200" dark-border-color="gray-800">
              <span truncate min-w="0" flex="1" font-size="sm" font-weight="700" text="text">${esc(item.name)}</span>
              <button type="button" data-copy display="flex" items="center" justify="center" flex="none" gap="2" bg="primary" hover-bg="primary/80" text="white" border="0" rounded="md" w="8" md-w="auto" h="8" md-px="3" font-size="sm" font-weight="600" cursor="pointer" aria-label="Copy code" title="Copy code"><i class="ri-file-copy-line"></i><span data-copy-label display="none" md-display="inline" whitespace="nowrap">Copy code</span></button>
              <button type="button" data-pg display="flex" items="center" justify="center" flex="none" gap="2" bg="gray-100" hover-bg="gray-100" dark-hover-bg="gray-800" text="text" border="0" rounded="md" w="8" md-w="auto" h="8" md-px="3" font-size="sm" font-weight="600" cursor="pointer" aria-label="Open in Playground" title="Open in Playground" dark-bg="gray-900"><i class="ri-terminal-box-line"></i><span display="none" md-display="inline" whitespace="nowrap">Playground</span></button>
              <button type="button" id="code-close" display="flex" items="center" justify="center" flex="none" w="8" h="8" rounded="md" border="0" bg="transparent" text="muted" hover-bg="gray-100" dark-hover-bg="gray-800" cursor="pointer" font-size="lg" aria-label="Close code" title="Close"><i class="ri-close-line"></i></button>
            </div>
            <div display="flex" wrap items="center" justify="between" gap="2" px="3" py="2" flex="none" border-b="1px solid gray-200" dark-border-color="gray-800">
              <div display="flex" items="center" gap="2">
                <button type="button" data-fmt="HTML" aria-pressed="true" bg="primary/10" dark-bg="primary/20" text="primary" border="0" rounded="md" px="3" py="1" flex="none" font-size="xs" font-weight="600" cursor="pointer">HTML</button>
                <button type="button" data-fmt="React" aria-pressed="false" bg="gray-100" dark-bg="gray-800" text="muted" border="0" rounded="md" px="3" py="1" flex="none" font-size="xs" font-weight="600" cursor="pointer">React</button>
              </div>
              <div display="flex" items="center" gap="2">
                <button type="button" data-opt="wrap" aria-pressed="false" display="flex" items="center" gap="1.5" bg="gray-100" dark-bg="gray-800" text="muted" border="0" rounded="md" px="3" py="1" flex="none" font-size="xs" font-weight="600" cursor="pointer"><i class="ri-text-wrap"></i>Wrap</button>
                <button type="button" data-opt="pretty" aria-pressed="false" display="flex" items="center" gap="1.5" bg="gray-100" dark-bg="gray-800" text="muted" border="0" rounded="md" px="3" py="1" flex="none" font-size="xs" font-weight="600" cursor="pointer"><i class="ri-magic-line"></i>Prettify</button>
              </div>
            </div>
            <div flex="1" min-h="0" overflow="auto" p="4" bg="gray-100" dark-bg="gray-900">
              <pre id="code" m="0" p="0" bg="transparent" border="0" rounded="none" font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important" font-size="xs" line-height="relaxed" text="text" tabindex="0" aria-label="Source code"></pre>
            </div>
          </section>
        </main>

        <aside id="inspector" display="none" lg-display="block" position="fixed" lg-position="static" top="14" bottom="0" right="0" w="20rem" max-w="90%" lg-w="full" lg-max-w="full" lg-min-w="full" z="40" shadow="xl" lg-shadow="none" lg-col-span="3" min-h="0" overflow="auto" bg="#fff" dark-bg="gray-900" p="4" md-p="5" font-size="sm" border-l="1px solid gray-200" dark-border-color="gray-800" aria-label="Inspector">
          <div display="flex" items="center" justify="between" gap="3" mb="3">
            <p m="0" font-size="xs" font-weight="700" tracking="wide" text="muted">ATTRIBUTES</p>
            <div display="flex" items="center" gap="2" min-w="0">
              <span id="insp-tag" font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important" text="muted" font-size="xs" truncate min-w="0"></span>
              <button ${closeBtn}><i class="ri-close-line"></i></button>
            </div>
          </div>
          <div id="attrs" display="flex" flex-col gap="2" font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important" font-size="xs"></div>

          <div mt="6" pt="5" border-t="1px solid gray-200" dark-border-color="gray-800">
            <h1 m="0" font-size="lg" font-weight="700" tracking="tight" truncate title="${esc(item.name)}">${esc(item.name)}</h1>
            <p m="0" mt="2" text="muted" line-height="relaxed">${esc(item.description || '')}</p>
            <dl m="0" mt="4" font-size="sm">
              ${meta('Category', kind(item.category))}
              ${meta('Creator', item.creator || 'Not listed')}
              ${meta('License', item.license || 'Not specified. Check with the creator before reuse.')}
              ${meta('Added', added)}
            </dl>
            ${(item.tags || []).length ? `<div display="flex" wrap gap="2" mt="4">${item.tags.map((t) => `<span bg="gray-100" dark-bg="gray-800" text="muted" rounded="md" px="2.5" py="1" font-size="xs" truncate max-w="10rem">${esc(t)}</span>`).join('')}</div>` : ''}
            <p m="0" mt="4" text="muted" font-size="xs" line-height="relaxed">Your page needs AtomAttr's <code>defaults.css</code> and script. <a href="./docs/installation.html" text="primary" text-decoration="none" font-weight="600">Install guide</a></p>
          </div>
        </aside>
      </div>

      <div id="scrim" position="fixed" left="0" top="14" w="full" h="full" bg="gray-950/60" z="30" display="none" lg-display="none" aria-hidden="true"></div>
    </div>`;

  /* ----- elements ----- */
  const stage = $('stage'), frame = $('frame'), pv = $('pv'), selBox = $('sel'), hovBox = $('hv'), sl = $('sl');
  ghost(hovBox, selBox, sl);
  frame.style.transformOrigin = '0 0';
  $('toast').style.pointerEvents = 'none';
  let els = [];

  /* ----- drawers (mobile): layers from the left, details from the right ----- */
  const drawers = { layers: $('layers-panel'), attrs: $('inspector') };
  function setDrawer(name) {
    state.drawer = name;
    Object.entries(drawers).forEach(([k, el]) => el.setAttribute('display', k === name ? 'block' : 'none'));
    $('scrim').setAttribute('display', name ? 'block' : 'none');
    document.querySelectorAll('[data-drawer]').forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.drawer === name)));
  }

  /* ----- view transform: pan + zoom ----- */
  const v = { s: 1, x: 0, y: 0, fitted: true };
  const devMeta = (k) => (k === 'frame' ? { label: 'Design frame', icon: 'ri-layout-line', w: fr.w, h: fr.h } : DEVICES[k]);
  const dims = () => { const d = state.device === 'frame' ? null : DEVICES[state.device]; return d ? { w: d.w, h: d.h } : { w: fr.w, h: fr.h }; };
  /* room taken by the floating code sheet, so fit and the zoom bar clear it */
  const inset = () => (state.code ? Math.min(Math.max(stage.clientHeight * 0.5, 224), 352) + 12 : 0);
  const rectOf = (el) => {
    const r = el.getBoundingClientRect(); /* iframe coordinates, unscaled */
    return { x: v.x + r.left * v.s, y: v.y + r.top * v.s, w: r.width * v.s, h: r.height * v.s };
  };
  function place(box, el) {
    if (!el) { box.setAttribute('display', 'none'); return null; }
    const r = rectOf(el);
    box.setAttribute('display', 'block');
    Object.assign(box.style, { boxSizing: 'border-box', left: `${r.x - 1}px`, top: `${r.y - 1}px`, width: `${r.w + 2}px`, height: `${r.h + 2}px` });
    return r;
  }
  function reposition() {
    const el = els[state.sel], r = place(selBox, el);
    if (!r) { sl.setAttribute('display', 'none'); return; }
    const raw = el.getBoundingClientRect(), d = describe(nodes[state.sel].el);
    sl.textContent = `${d.name} · ${Math.round(raw.width)} × ${Math.round(raw.height)}`;
    sl.setAttribute('display', 'block');
    Object.assign(sl.style, { left: `${r.x - 1}px`, top: `${Math.max(4, r.y - 27)}px` });
  }
  function applyView() {
    frame.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.s})`;
    $('zoom-label').textContent = `${Math.round(v.s * 100)}%`;
    $('zoombar').style.bottom = state.code ? `${inset() + 8}px` : '';
    reposition();
    place(hovBox, null);
  }
  function fitView() {
    const { w, h } = dims(), W = stage.clientWidth, H = stage.clientHeight - inset();
    if (!W || H <= 0) return;
    v.s = Math.max(0.1, Math.min((W - (W < 600 ? 32 : 96)) / w, (H - 112) / h, 1.4));
    v.x = (W - w * v.s) / 2;
    v.y = (H - h * v.s) / 2 + 12;
    v.fitted = true;
    frame.style.width = `${w}px`; frame.style.height = `${h}px`;
    const dv = state.device === 'frame' ? null : DEVICES[state.device];
    frame.style.borderRadius = dv && dv.r ? `${dv.r}px` : '';
    applyView();
  }
  function zoomAt(cx, cy, factor) {
    const s2 = Math.min(8, Math.max(0.1, v.s * factor)), k = s2 / v.s;
    v.x = cx - (cx - v.x) * k; v.y = cy - (cy - v.y) * k; v.s = s2; v.fitted = false;
    applyView();
  }
  const zoomCenter = (f) => zoomAt(stage.clientWidth / 2, (stage.clientHeight - inset()) / 2, f);

  function onWheel(e, inFrame) {
    e.preventDefault();
    let cx, cy;
    if (inFrame) { cx = v.x + e.clientX * v.s; cy = v.y + e.clientY * v.s; }
    else { const r = stage.getBoundingClientRect(); cx = e.clientX - r.left; cy = e.clientY - r.top; }
    if (e.ctrlKey || e.metaKey) { zoomAt(cx, cy, Math.exp(-e.deltaY * 0.01)); return; } /* pinch sets ctrlKey too */
    const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX, dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
    v.x -= dx; v.y -= dy; v.fitted = false; applyView();
  }
  stage.addEventListener('wheel', (e) => onWheel(e, false), { passive: false });

  /* pan: Space + drag, middle mouse, or a plain one-finger drag on touch screens */
  let space = false, drag = null;
  const setSpace = (on) => {
    space = on;
    pv.style.pointerEvents = on ? 'none' : ''; /* the iframe would swallow the drag */
    stage.setAttribute('cursor', on ? 'grab' : 'default');
    if (!on) drag = null;
  };
  stage.addEventListener('pointerdown', (e) => {
    if (!space && e.button !== 1) return;
    e.preventDefault();
    drag = { x: e.clientX - v.x, y: e.clientY - v.y };
    stage.setPointerCapture(e.pointerId);
    stage.setAttribute('cursor', 'grabbing');
  });
  stage.addEventListener('pointermove', (e) => { if (drag) { v.x = e.clientX - drag.x; v.y = e.clientY - drag.y; v.fitted = false; applyView(); } });
  const endDrag = () => { if (drag) { drag = null; stage.setAttribute('cursor', space ? 'grab' : 'default'); } };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  /* ----- keyboard (also forwarded from inside the preview iframe) ----- */
  function visibleOrder() {
    return layers.filter((l) => { let p = l.parent; while (p >= 0) { if (collapsed.has(p)) return false; p = nodes[p].parent; } return true; }).map((l) => l.i);
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      if (state.menu) { setMenu(false); return; }
      if (state.devMenu) { setDeviceMenu(false); return; }
      if (state.drawer) { setDrawer(null); return; }
      if (state.code) { setCode(false); return; }
    }
    const t = (e.target.localName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(t) || (e.target.closest && e.target.closest('#code'))) return;
    if (e.code === 'Space') {
      if (t === 'button' || t === 'a') return; /* keep keyboard activation working */
      if (!space) setSpace(true);
      e.preventDefault(); return;
    }
    if (e.shiftKey && e.code === 'Digit1') { e.preventDefault(); fitView(); return; }
    if (e.shiftKey && e.code === 'Digit0') { e.preventDefault(); zoomCenter(1 / v.s); return; }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomCenter(1.25); return; }
    if (e.key === '-') { e.preventDefault(); zoomCenter(1 / 1.25); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const order = visibleOrder(), at = order.indexOf(state.sel);
      const next = order[Math.max(0, Math.min(order.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))];
      if (next !== undefined && next !== state.sel) { e.preventDefault(); select(next, true); }
    }
  }
  const onKeyUp = (e) => { if (e.code === 'Space') setSpace(false); };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);

  /* ----- layers panel ----- */
  function renderLayers(scroll) {
    const order = new Set(visibleOrder());
    $('layers').innerHTML = layers.filter((l) => order.has(l.i)).map(({ el, depth, i }) => {
      const d = describe(el), on = i === state.sel, kids = hasKids.has(i);
      const chevron = kids ? `<span data-t="${i}" display="flex" items="center" justify="center" w="5" h="5" flex="none" rounded="md" hover-bg="gray-200" dark-hover-bg="gray-700" aria-label="Toggle children"><i class="${collapsed.has(i) ? 'ri-arrow-right-s-line' : 'ri-arrow-down-s-line'}"></i></span>` : '';
      return `<button type="button" data-i="${i}" aria-pressed="${on}" display="flex" items="center" gap="2" w="full" py="2" pr="2" pl="${12 + Math.min(depth, 6) * 14}px" rounded="md" border="0" bg="${on ? 'primary/10' : 'transparent'}" text="${on ? 'primary' : 'muted'}" font-weight="${on ? '600' : '500'}" hover-bg="${on ? 'primary/10' : 'gray-100'}" dark-hover-bg="gray-800" font-size="sm" cursor="pointer" align="left"><i class="${d.icon}" flex="none"></i><span truncate min-w="0" flex="1">${esc(d.name)}${d.hint ? ` · ${esc(d.hint)}` : ''}</span>${chevron}</button>`;
    }).join('');
    if (scroll) $('layers').querySelector(`[data-i="${state.sel}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  /* ----- selection + attributes ----- */
  function select(i, fromCanvas) {
    if (i < 0 || !nodes[i]) return;
    state.sel = i;
    if (fromCanvas) { let p = nodes[i].parent; while (p >= 0) { collapsed.delete(p); p = nodes[p].parent; } }
    renderLayers(fromCanvas);
    reposition();
    const el = nodes[i].el, attrs = [...el.attributes];
    $('insp-tag').textContent = `<${el.localName}>`;
    $('attrs').innerHTML = attrs.length
      ? attrs.map((a, n) => `<button type="button" data-a="${n}" title="Click to copy" display="flex" justify="between" gap="3" w="full" bg="gray-100" dark-bg="gray-950" hover-bg="gray-200" dark-hover-bg="gray-800" border="0" rounded="md" px="3" py="2.5" cursor="pointer" align="left"><span text="amber-500" flex="none">${esc(a.name)}</span><span text="emerald-500" truncate min-w="0" align="right">"${esc(a.value)}"</span></button>`).join('')
      : '<p m="0" text="muted" font-family="sans" font-size="sm">No attributes on this element.</p>';
  }

  /* ----- preview iframe ----- */
  /* the preview is immune to dark mode: always a light document, so only the page chrome follows the theme */
  const syncTheme = () => { $('theme').innerHTML = isDark() ? '<i class="ri-contrast-fill"></i>' : '<i class="ri-contrast-line"></i>'; };
  function loadPreview() {
    syncTheme();
    pv.onload = onLoaded;
    pv.srcdoc = previewDocument(item, false);
  }
  function onLoaded() {
    const doc = pv.contentDocument;
    if (!doc?.body) return;
    els = [...doc.body.querySelectorAll('*')].slice(0, nodes.length);
    const index = new Map(els.map((e, i) => [e, i]));
    const pick = (t) => { while (t && !index.has(t)) t = t.parentElement; return t ? index.get(t) : -1; };
    doc.addEventListener('click', (e) => { e.preventDefault(); const i = pick(e.target); if (i >= 0) select(i, true); }, true);
    doc.addEventListener('mouseover', (e) => { const i = pick(e.target); place(hovBox, i >= 0 && i !== state.sel ? els[i] : null); });
    doc.addEventListener('mouseleave', () => place(hovBox, null));
    doc.addEventListener('scroll', () => { reposition(); place(hovBox, null); }, true);
    doc.addEventListener('wheel', (e) => onWheel(e, true), { passive: false });
    doc.addEventListener('keydown', onKey);
    doc.addEventListener('keyup', onKeyUp);
    doc.addEventListener('pointerdown', () => { setMenu(false); setDeviceMenu(false); });
    select(Math.min(state.sel, els.length - 1), false);
    setTimeout(reposition, 150);
  }

  /* ----- modes, code sheet, copy ----- */
  function renderCode() {
    const pre = $('code');
    pre.style.whiteSpace = state.wrap ? 'pre-wrap' : 'pre';
    pre.style.overflowWrap = state.wrap ? 'anywhere' : 'normal';
    pre.innerHTML = `<code bg="transparent" p="0" border="0" rounded="none" font-size="inherit" text="inherit">${highlight(source())}</code>`;
    document.querySelectorAll('[data-fmt]').forEach((p) => setPill(p, p.dataset.fmt === state.format));
    document.querySelectorAll('[data-opt]').forEach((p) => setPill(p, !!state[p.dataset.opt]));
  }
  /* ----- view dropdown: Inspect / Responsive / Code ----- */
  const viewMeta = { inspect: ['ri-cursor-line', 'Inspect'], responsive: ['ri-layout-grid-line', 'Responsive'], code: ['ri-code-s-slash-line', 'Code'] };
  function syncView() {
    const cur = state.code ? 'code' : state.mode;
    $('view-icon').className = viewMeta[cur][0];
    $('view-label').textContent = viewMeta[cur][1];
    document.querySelectorAll('[data-view]').forEach((b) => {
      const on = b.dataset.view === cur;
      b.setAttribute('aria-checked', String(on));
      b.setAttribute('bg', on ? 'primary/10' : 'transparent');
      b.setAttribute('text', on ? 'primary' : 'text');
      b.querySelector('[data-check]').setAttribute('opacity', on ? '100' : '0');
    });
  }
  function setMenu(open) {
    state.menu = open;
    $('view-menu').setAttribute('display', open ? 'block' : 'none');
    $('view-trigger').setAttribute('aria-expanded', String(open));
  }

  function setCode(on) {
    state.code = on;
    syncView();
    $('codeview').setAttribute('display', on ? 'flex' : 'none');
    if (on) renderCode();
    v.fitted ? fitView() : applyView();
  }
  function setMode(mode) {
    state.mode = mode;
    syncView();
    $('devices').setAttribute('display', mode === 'responsive' ? 'flex' : 'none');
    if (mode !== 'responsive') { setDeviceMenu(false); if (state.device !== 'frame') setDevice('frame'); }
  }
  function renderDeviceMenu() {
    const rows = [{ group: 'Design' }, { value: 'frame' }];
    Object.entries(DEVICES).forEach(([k, d]) => { if (d.group) rows.push({ group: d.group }); rows.push({ value: k }); });
    $('device-menu').innerHTML = rows.map((it) => {
      if (it.group) return `<div role="presentation" px="3" pt="2" pb="1" font-size="xs" font-weight="600" text="muted" tracking="wide">${esc(it.group.toUpperCase())}</div>`;
      const d = devMeta(it.value), on = it.value === state.device;
      return `<button type="button" role="menuitemradio" aria-checked="${on}" data-device="${it.value}" display="flex" items="center" gap="2" w="full" px="3" py="2" rounded="md" border="0" bg="${on ? 'primary/10' : 'transparent'}" text="${on ? 'primary' : 'text'}" hover-bg="${on ? 'primary/10' : 'gray-100'}" dark-hover-bg="gray-800" font-size="sm" font-weight="500" cursor="pointer" align="left"><i class="${d.icon}" flex="none" font-size="lg"></i><span flex="1" min-w="0" truncate>${esc(d.label)}</span><span text="muted" font-size="xs" flex="none">${d.w} × ${d.h}</span></button>`;
    }).join('');
  }
  function syncDevice() {
    const d = devMeta(state.device);
    $('device-icon').className = d.icon;
    $('device-label').textContent = d.label;
    $('device-size').textContent = `${d.w} × ${d.h}`;
    renderDeviceMenu();
  }
  function setDeviceMenu(open) {
    state.devMenu = open;
    $('device-menu').setAttribute('display', open ? 'block' : 'none');
    $('device-trigger').setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => $('device-menu').querySelector('[aria-checked="true"]')?.scrollIntoView({ block: 'nearest' }), 30);
  }
  function setDevice(device) {
    if (!devMeta(device)) return;
    state.device = device;
    syncDevice();
    fitView(); setTimeout(reposition, 120);
  }
  async function doCopy() {
    const ok = await copyText(source());
    if (ok) import('./assets/stats.js').then((m) => m.hit(item.slug, 'copy'));
    const labels = document.querySelectorAll('[data-copy-label]');
    labels.forEach((l) => { l.textContent = ok ? 'Copied' : 'Select and copy'; });
    setTimeout(() => labels.forEach((l) => { l.textContent = 'Copy code'; }), 1600);
    toast(ok ? `${state.format} copied` : 'Copy failed. Select the code and press Ctrl/Cmd+C');
  }

  /* ----- wiring ----- */
  $('view-trigger').addEventListener('click', () => setMenu(!state.menu));
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    const view = b.dataset.view;
    setMenu(false);
    if (view === 'code') setCode(true);
    else { setMode(view); if (state.code) setCode(false); }
  }));
  document.addEventListener('click', (e) => {
    if (state.menu && !e.target.closest('#view-wrap')) setMenu(false);
    if (state.devMenu && !e.target.closest('#devices')) setDeviceMenu(false);
  });
  $('device-trigger').addEventListener('click', () => setDeviceMenu(!state.devMenu));
  $('device-menu').addEventListener('click', (e) => {
    const b = e.target.closest('[data-device]');
    if (b) { setDevice(b.dataset.device); setDeviceMenu(false); }
  });
  document.querySelectorAll('[data-fmt]').forEach((b) => b.addEventListener('click', () => { state.format = b.dataset.fmt; renderCode(); }));
  document.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => { state[b.dataset.opt] = !state[b.dataset.opt]; renderCode(); }));
  document.querySelectorAll('[data-drawer]').forEach((b) => b.addEventListener('click', () => setDrawer(state.drawer === b.dataset.drawer ? null : b.dataset.drawer)));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => setDrawer(null)));
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', doCopy));
  $('scrim').addEventListener('click', () => setDrawer(null));
  $('code-close').addEventListener('click', () => setCode(false));
  $('layers').addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]');
    if (t) { const i = Number(t.dataset.t); collapsed.has(i) ? collapsed.delete(i) : collapsed.add(i); renderLayers(false); return; }
    const b = e.target.closest('[data-i]');
    if (b) { select(Number(b.dataset.i), false); if (state.drawer) setDrawer(null); }
  });
  $('layers').addEventListener('mouseover', (e) => { const b = e.target.closest('[data-i]'); if (b) place(hovBox, Number(b.dataset.i) !== state.sel ? els[Number(b.dataset.i)] : null); });
  $('layers').addEventListener('mouseleave', () => place(hovBox, null));
  $('attrs').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = [...nodes[state.sel].el.attributes][Number(b.dataset.a)];
    toast((await copyText(`${a.name}="${a.value}"`)) ? `Copied ${a.name}` : 'Copy failed');
  });
  $('theme').addEventListener('click', () => {
    const dark = !isDark();
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('atomattr-theme', dark ? 'dark' : 'light'); } catch {}
  });
  $('zoom-in').addEventListener('click', () => zoomCenter(1.25));
  $('zoom-out').addEventListener('click', () => zoomCenter(1 / 1.25));
  $('zoom-fit').addEventListener('click', fitView);
  document.querySelectorAll('[data-pg]').forEach((btn) => btn.addEventListener('click', async () => {
    btn.disabled = true; toast('Loading this design into the Playground…');
    try {
      const token = await encodeShare({ v: 2, l: 'html', h: item.preview, c: item.css || '' });
      location.href = `./playground.html#code=${token}`;
    } catch {
      btn.disabled = false; toast('Could not open the Playground. You can still copy the source.');
    }
  }));
  /* keep the user's pan/zoom on resize; only re-fit when they haven't moved the canvas */
  new ResizeObserver(() => { v.fitted ? fitView() : applyView(); }).observe(stage);
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  renderCode();
  syncView();
  syncDevice();
  renderLayers(false);
  select(0, false);
  fitView();
  loadPreview();
}

/* ---------- boot ---------- */
async function boot() {
  try { if ((localStorage.getItem('atomattr-theme') || '') === 'dark') document.documentElement.classList.add('dark'); } catch {}
  let all = [];
  try {
    const idx = await import('./data/catalog-index.js');
    const want = new URLSearchParams(location.search).get('slug') || '';
    const hit = idx.light.find((i) => i.slug === want) || (want && idx.light.find((i) => i.slug.endsWith('-' + want)));
    const chunk = hit ? (await import(`./data/groups/${hit.group}.js`)).items : [];
    all = chunk.filter((i) => !i.status || i.status === 'published');
  } catch (e) {
    console.error('AtomAttr UI: could not load catalog data', e);
    return fail('Library unavailable', 'The design data could not be loaded. Refresh the page or try again later.');
  }
  /* The owner's local drafts (from the private studio) are visible only while the studio session is active. */
  try {
    if (Number(localStorage.getItem(ADMIN_KEY) || 0) > Date.now()) {
      const drafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]');
      if (Array.isArray(drafts)) {
        const taken = new Set(drafts.map((d) => d.slug));
        all = [...drafts.map((d) => ({ ...d, status: 'draft', origin: 'draft' })), ...all.filter((i) => !taken.has(i.slug))];
      }
    }
  } catch {}
  /* Slugs are "category-name" (sections-hero-centered); a short link like ?slug=hero-centered also resolves. */
  const slug = new URLSearchParams(location.search).get('slug') || '';
  const item = all.find((i) => i.slug === slug) || (slug && all.find((i) => i.slug.endsWith('-' + slug)));
  if (!item || !item.preview) return fail('Design not found', 'This design is not published or its link is out of date.');
  render(item, all);
  import('./assets/stats.js').then((m) => m.hit(item.slug, 'view'));
}
boot();