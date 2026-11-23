/* AtomAttr UI design page (item.js, loaded by item.html).
   A simple page: the component preview on top, its code underneath. Styled entirely with AtomAttr attributes. */

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
  return `<!doctype html><html class="${dark ? 'dark' : ''}"><head><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark">${top ? '' : `${LT}style>body>*{align-self:center!important}${LT}/style>`}<link rel="stylesheet" href="dist/defaults.css"><link rel="stylesheet" href="assets/remixicon/remixicon.css">${item.css ? `${LT}style>${item.css}${LT}/style>` : ''}${SCRIPT_TAG}${item.behavior ? `${LT}script src="assets/studio-behavior.js" defer>${LT}/script>` : ''}</head><body bg="#fff" dark-bg="gray-950" text="text" dark-text="gray-50" font-family="sans" m="0" p="${pad}px" min-h="100vh" ${layout}>${item.preview}${skeleton}</body></html>`;
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
    if (RAW.has(n)) { /* keep script, style, pre and textarea content as written */
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


function fail(title, msg) {
  root.setAttribute('aria-busy', 'false');
  root.innerHTML = `<div display="flex" flex-col items="center" justify="center" gap="3" px="4" align="center" min-h="100vh"><h1 m="0" font-size="3xl">${esc(title)}</h1><p m="0" text="muted">${esc(msg)}</p><a href="./catalog.html" bg="primary" text="white" px="5" py="2.5" rounded="md" font-weight="600" text-decoration="none">Back to the library</a></div>`;
}



/* ---------- render ---------- */
function render(item) {
  document.title = `${item.name} — AtomAttr UI`;
  root.setAttribute('aria-busy', 'false');

  const draft = item.status === 'draft' || item.origin === 'draft';
  const state = { format: 'HTML' };
  const isDark = () => document.documentElement.classList.contains('dark');
  const source = () => {
    let html = prettyHtml(item.preview);
    if (item.css) html += `\n\n<!-- Styles this component needs (animations and interactive states) -->\n${LT}style>\n${item.css}\n${LT}/style>`;
    if (item.behavior) html += `\n\n<!-- Interactive behaviour: include once per page (assets/studio-behavior.js in the Atomattr site) -->\n${LT}script src="studio-behavior.js" defer>${LT}/script>`;
    return state.format === 'React' ? reactSource({ ...item, preview: html }) : html;
  };

  const top = isTop(item);
  const btn = 'type="button" display="inline-flex" items="center" gap="2" h="9" px="3.5" rounded="md" border="0" font-size="sm" font-weight="600" cursor="pointer" transition="all" duration="150ms"';
  const ghostBtn = `${btn} bg="gray-100" dark-bg="#ffffff/10" text="text" dark-text="gray-50" hover-bg="gray-200" dark-hover-bg="#ffffff/15"`;
  const tab = (name) => `<button type="button" data-fmt="${name}" display="inline-flex" items="center" h="8" px="3" rounded="md" border="0" font-size="sm" font-weight="600" cursor="pointer">${name}</button>`;

  root.innerHTML = `
    <header position="sticky" top="0" z="30" display="flex" items="center" gap="3" px="4" md-px="8" h="14" bg="#fff" dark-bg="#07080a" border-b="1px solid gray-200" dark-border-color="#ffffff/10">
      <a href="./index.html" aria-label="Atomattr home" display="flex" items="center" flex="none"><img src="./assets/images/logo.png" alt="Atomattr" h="6" dark-display="none" display="flex"><img src="./assets/images/logo.dark.png" alt="Atomattr" h="6" dark-display="flex" display="none"></a>
      <nav display="none" md-display="flex" items="center" gap="2" min-w="0" font-size="sm" aria-label="Breadcrumb">
        <a href="./ui.html" text="muted" hover-text="primary" text-decoration="none" flex="none">Library</a>
        <i class="ri-arrow-right-s-line" text="muted" flex="none"></i>
        <a href="./ui.html#${encodeURIComponent(String(item.category).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))}" truncate max-w="10rem" text="muted" hover-text="primary" text-decoration="none">${esc(item.category)}</a>
      </nav>
      <div display="flex" items="center" gap="2" ml="auto">
        <button type="button" id="theme" aria-label="Toggle light and dark theme" title="Toggle theme" w="9" h="9" rounded="md" border="0" bg="transparent" text="muted" hover-bg="gray-100" dark-hover-bg="#ffffff/10" display="flex" items="center" justify="center" cursor="pointer" font-size="lg"><i class="ri-contrast-line"></i></button>
        <button ${ghostBtn} data-pg><i class="ri-play-circle-line"></i><span display="none" sm-display="inline">Open in Playground</span></button>
      </div>
    </header>

    <main max-w="6xl" mx="auto" px="4" md-px="8" py="8" md-py="12">
      <div mb="8">
        <h1 m="0" mb="2" text="text" dark-text="gray-50" font-size="3xl" md-font-size="4xl" font-weight="800" tracking="tight" line-height="tight">${esc(item.name)}${draft ? ' <span bg="warning/10" text="warning" rounded="md" px="2" py="0.5" font-size="xs" font-weight="700" vertical-align="middle">Draft</span>' : ''}</h1>
        ${item.description ? `<p m="0" mb="3" text="muted" font-size="lg" line-height="relaxed" max-w="40rem">${esc(item.description)}</p>` : ''}
        <p m="0" display="flex" items="center" gap="4" text="muted" font-size="sm"><span><span data-views="${esc(item.slug)}">0</span> views</span><span display="inline-flex" items="center" gap="1"><i class="ri-file-copy-line"></i><span data-copies="${esc(item.slug)}">0</span> copies</span></p>
      </div>

      <section aria-label="Preview" mb="10">
        <h2 m="0" mb="3" font-size="sm" font-weight="700" tracking="wide" text="muted">PREVIEW</h2>
        <div id="stage" position="relative" overflow="hidden" rounded="lg" bg="#f1f1f3" dark-bg="#111214" border="1px solid gray-200" dark-border-color="#ffffff/10">
          <iframe id="pv" title="${esc(item.name)} preview" scrolling="no" border="0" display="block" w="full" bg="transparent" style="height:${top ? 360 : 320}px"></iframe>
        </div>
      </section>

      <section aria-label="Code">
        <div display="flex" items="center" justify="between" gap="3" mb="3" flex-wrap="wrap">
          <h2 m="0" font-size="sm" font-weight="700" tracking="wide" text="muted">CODE</h2>
          <div display="flex" items="center" gap="2">
            <div display="flex" items="center" gap="1" p="1" rounded="md" bg="gray-100" dark-bg="#ffffff/10">${tab('HTML')}${tab('React')}</div>
            <button ${ghostBtn} id="copy"><i class="ri-file-copy-line"></i><span id="copy-label">Copy</span></button>
          </div>
        </div>
        <pre id="code" m="0" p="5" overflow="auto" max-h="32rem" rounded="lg" bg="#f6f6f8" dark-bg="#0c0d0f" border="1px solid gray-200" dark-border-color="#ffffff/10" text="text" dark-text="gray-100" font-size="sm" line-height="relaxed" class="mono" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>
      </section>
    </main>`;

  const pv = $('pv'), stage = $('stage');
  const setTab = (b, on) => { b.setAttribute('aria-pressed', String(on)); b.setAttribute('bg', on ? '#fff' : 'transparent'); b.setAttribute('dark-bg', on ? '#ffffff/15' : 'transparent'); b.setAttribute('text', on ? 'text' : 'muted'); b.setAttribute('dark-text', on ? 'gray-50' : 'gray-400'); b.setAttribute('shadow', on ? 'sm' : 'none'); };
  const renderCode = () => {
    $('code').innerHTML = `<code bg="transparent" p="0" border="0" rounded="none" font-size="inherit" text="inherit" dark-text="gray-100">${highlight(source())}</code>`;
    document.querySelectorAll('[data-fmt]').forEach((b) => setTab(b, b.dataset.fmt === state.format));
  };

  /* Size the preview to the component so the whole design shows without a scrollbar. */
  const fit = () => {
    const d = pv.contentDocument;
    if (!d || !d.body) return;
    const h = Math.ceil(Math.max(d.body.getBoundingClientRect().height, d.documentElement.scrollHeight));
    pv.style.height = Math.max(240, Math.min(h, 1600)) + 'px';
  };
  const syncTheme = () => {
    const d = pv.contentDocument;
    if (d && d.documentElement) d.documentElement.classList.toggle('dark', isDark());
    setTimeout(fit, 60);
  };
  pv.onload = () => { d0(); [60, 250, 800].forEach((ms) => setTimeout(fit, ms)); };
  const d0 = () => { const d = pv.contentDocument; if (d?.documentElement) d.documentElement.style.overflow = 'hidden'; };
  pv.srcdoc = previewDocument(item, isDark());
  new ResizeObserver(fit).observe(stage);
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  document.querySelectorAll('[data-fmt]').forEach((b) => b.addEventListener('click', () => { state.format = b.dataset.fmt; renderCode(); }));
  $('copy').addEventListener('click', async () => {
    const ok = await copyText(source());
    toast(ok ? `Copied ${state.format} code` : 'Copy failed');
    if (ok) { $('copy-label').textContent = 'Copied'; setTimeout(() => { $('copy-label').textContent = 'Copy'; }, 1500); import('./assets/stats.js').then((m) => m.hit(item.slug, 'copy')); }
  });
  $('theme').addEventListener('click', () => {
    const dark = !isDark();
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('atomattr-theme', dark ? 'dark' : 'light'); } catch {}
  });
  document.querySelector('[data-pg]').addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true; toast('Loading this design into the Playground…');
    try {
      const token = await encodeShare({ v: 2, l: 'html', h: item.preview, c: item.css || '' });
      location.href = `./playground.html#code=${token}`;
    } catch {
      b.disabled = false; toast('Could not open the Playground. You can still copy the source.');
    }
  });

  renderCode();
  import('./assets/stats.js').then((m) => m.fillCounts && m.fillCounts(root));
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
