/* AtomAttr UI library: gallery (catalog/components/sections/templates pages) + detail page (item.html).
   No bare module imports. Data loads dynamically so a failure shows a message instead of a dead page. */

import { mountCards } from './ui-cards.js';
const $ = (id) => document.getElementById(id);
const SCOPE = document.body.dataset.pageScope || 'all';
const KIND = { Components: 'Component', Sections: 'Section', Templates: 'Template' };
const bySlug = new Map();
let items = [];
let categories = [];

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- theme ---------- */
function applyTheme(theme, persist = true) {
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    b.innerHTML = dark ? '<i class="ri-contrast-fill"></i>' : '<i class="ri-contrast-line"></i>';
    b.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  });
  refreshPreviews();
  if (persist) { try { localStorage.setItem('atomattr-theme', dark ? 'dark' : 'light'); } catch {} }
}
function setupTheme() {
  let saved = 'light';
  try { saved = localStorage.getItem('atomattr-theme') || 'light'; } catch {}
  applyTheme(saved, false);
  document.querySelectorAll('[data-theme-toggle]').forEach((b) =>
    b.addEventListener('click', () => applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')));
}

/* ---------- preview iframe document ---------- */
function previewDocument(markup, compact = false) {
  const base = new URL('./', location.href).href;
  const dark = document.documentElement.classList.contains('dark');
  return `<!doctype html><html class="${dark ? 'dark' : ''}"><head><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="dist/defaults.css"><link rel="stylesheet" href="assets/remixicon/remixicon.css"><style>html,body{min-height:100%;margin:0}body{box-sizing:border-box;padding:${compact ? '20px' : '32px'};font-family:system-ui,sans-serif}*{box-sizing:border-box}</style><script src="dist/atomattr.min.js" defer><\/script></head><body bg="#fff" dark-bg="gray-950" text="text">${markup}</body></html>`;
}
function refreshPreviews() {
  document.querySelectorAll('iframe[data-slug]').forEach((f) => {
    const item = bySlug.get(f.dataset.slug);
    if (item) f.srcdoc = previewDocument(item.preview, f.hasAttribute('data-compact'));
  });
}

/* ---------- Playground handoff (uses the existing #code= share format) ---------- */
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
    } catch { /* fall through to uncompressed */ }
  }
  return 'b.' + b64u(bytes);
}
async function openInPlayground(item, statusEl, button) {
  if (button) button.disabled = true;
  if (statusEl) statusEl.textContent = 'Loading this design into the Playground…';
  try {
    const token = await encodeShare({ v: 2, l: 'html', h: item.preview, c: item.css || '' });
    location.href = `./playground.html#code=${token}`;
  } catch (e) {
    if (button) button.disabled = false;
    if (statusEl) statusEl.textContent = 'Could not open the Playground. You can still copy the source from this page.';
  }
}

/* ---------- source helpers ---------- */
function jsxMarkup(markup) {
  return markup
    .replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^<>]*?)?\s*\/?>/gi, (t, n, a = '') => `<${n}${a.trimEnd()} />`)
    .replace(/(\s)class=/g, '$1className=')
    .replace(/(\s)for=/g, '$1htmlFor=');
}
function reactSource(item) {
  const base = item.name.replace(/[^a-z\d]/gi, '') || 'AtomAttrPattern';
  const name = base.replace(/^\d/, 'Pattern$&');
  return `import React from 'react';\nimport { startAtomAttr } from 'atomattr';\nimport 'atomattr/defaults.css';\n\nstartAtomAttr();\n\nexport function ${name}() {\n  return (\n    <>\n      ${jsxMarkup(item.preview).replace(/\n/g, '\n      ')}\n    </>\n  );\n}\n`;
}
async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const f = document.createElement('textarea');
    f.value = text; f.setAttribute('readonly', ''); f.style.cssText = 'position:fixed;opacity:0';
    document.body.append(f); f.select();
    const ok = document.execCommand('copy');
    f.remove();
    return ok;
  }
}

/* ---------- gallery ---------- */
function card(item) {
  const href = `./item.html?slug=${encodeURIComponent(item.slug)}`;
  const community = item.origin === 'community';
  const tags = (item.tags || []).map((t) => `<span bg="gray-100" dark-bg="#ffffff/5" text="muted" rounded="md" px="2.5" py="1" font-size="xs">${esc(t)}</span>`).join('');
  return `<article bg="gray-100" dark-bg="#0e0f11" border="0" rounded="md" overflow="hidden" display="flex" flex-col>
    <a href="${href}" aria-label="View ${esc(item.name)}" display="block" bg="gray-100" dark-bg="#07080a" border-b="1px solid gray-200" dark-border-color="#ffffff/10" overflow="hidden">
      <iframe title="${esc(item.name)} preview" loading="lazy" tabindex="-1" aria-hidden="true" data-slug="${esc(item.slug)}" data-compact w="auto" min-h="32" max-h="auto" border="0" pointer-events="none"></iframe>
    </a>
    <div p="5" display="flex" flex-col gap="3" flex="1">
      <div display="flex" items="start" justify="between" gap="3">
        <div><p m="0" mb="1" text="muted" font-size="xs">${esc(KIND[item.category] || item.category)}</p><h2 m="0" font-size="lg" font-weight="700"><a href="${href}" text="text" text-decoration="none" hover-text="primary">${esc(item.name)}</a></h2></div>
        <span bg="${community ? 'primary/10' : 'success/10'}" text="${community ? 'primary' : 'success'}" rounded="md" px="2.5" py="1" font-size="xs" font-weight="600">${community ? 'Community' : 'Free'}</span>
      </div>
      <p m="0" text="muted" font-size="sm" line-height="relaxed">${esc(item.description)}</p>
      <div display="flex" gap="2" wrap>${tags}</div>
      <div display="flex" gap="3" items="center" mt="auto" pt="2">
        <button type="button" data-open="${esc(item.slug)}" bg="primary" text="white" border="0" rounded="md" px="4" py="2" font-size="sm" font-weight="600" cursor="pointer">Open in Playground</button>
        <a href="${href}" text="muted" hover-text="primary" font-size="sm" font-weight="600" text-decoration="none">Details</a>
      </div>
    </div>
  </article>`;
}

function initGallery() {
  const search = $('search-input'), filters = $('category-filters'), grid = $('catalog-grid'), empty = $('empty-state');
  const catSel = $('category-select'), sortSel = $('sort-select'), status = $('catalog-status');
  if (!search || !filters || !grid || !empty) return;

  const pool = SCOPE === 'all' ? items : items.filter((i) => i.category === SCOPE);
  const params = new URLSearchParams(location.search);
  if (params.get('q')) search.value = params.get('q');
  if (catSel) catSel.value = SCOPE !== 'all' ? SCOPE : (params.get('category') || 'all');

  const groups = [...new Set(pool.map((i) => i.tags?.[0]).filter(Boolean))];
  let activeTag = '';

  const drawFilters = () => {
    filters.innerHTML = ['All', ...groups].map((tag) => {
      const value = tag === 'All' ? '' : tag, on = value === activeTag;
      const look = on
        ? 'bg="gray-950" dark-bg="#fff" text="white" dark-text="gray-950" border="1px solid transparent"'
        : 'bg="transparent" text="text" border="0" hover-bg="gray-100" dark-hover-bg="#ffffff/5"';
      return `<button type="button" data-filter="${esc(value)}" aria-pressed="${on}" ${look} rounded="md" px="4" py="1.5" font-size="sm" font-weight="600" cursor="pointer">${esc(tag)}</button>`;
    }).join('');
  };

  const draw = () => {
    const q = search.value.trim().toLowerCase();
    const cat = catSel?.value || 'all';
    let shown = pool.filter((i) => {
      const hay = `${i.name} ${i.description} ${(i.tags || []).join(' ')} ${i.category} ${i.creator || ''}`.toLowerCase();
      return (cat === 'all' || i.category === cat) && (!activeTag || i.tags?.includes(activeTag)) && (!q || hay.includes(q));
    });
    if (sortSel?.value === 'name-asc') shown = [...shown].sort((a, b) => a.name.localeCompare(b.name));
    if (sortSel?.value === 'name-desc') shown = [...shown].sort((a, b) => b.name.localeCompare(a.name));
    mountCards(grid, shown.map((i) => ({ origin: 'official', ...i })));
    empty.hidden = shown.length > 0;
    if (status) status.textContent = `${shown.length} ${shown.length === 1 ? 'design' : 'designs'} shown · free to preview and open in the Playground`;
  };

  drawFilters(); draw();
  search.addEventListener('input', draw);
  catSel?.addEventListener('change', draw);
  sortSel?.addEventListener('change', draw);
  filters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    activeTag = b.dataset.filter; drawFilters(); draw();
  });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openInPlayground(bySlug.get(b.dataset.open), status, b);
  });
}

/* ---------- detail page ---------- */
function initDetail(root) {
  const slug = new URLSearchParams(location.search).get('slug');
  const item = bySlug.get(slug);
  root.setAttribute('aria-busy', 'false');
  if (!item) {
    root.innerHTML = `<section max-w="4xl" mx="auto" px="4" py="16"><a href="./catalog.html" text="primary">← Back to library</a><h1 font-size="3xl">Design not found</h1><p text="muted">This design is not published or its link is out of date.</p></section>`;
    return;
  }
  document.title = `${item.name} — AtomAttr UI`;
  const related = items.filter((o) => o.id !== item.id && o.category === item.category && o.tags?.some((t) => item.tags?.includes(t))).slice(0, 3);
  let format = 'HTML';

  root.innerHTML = `<div max-w="7xl" mx="auto" px="4" md-px="8" py="8" lg-py="12">
    <a href="./catalog.html" text="muted" text-decoration="none">← Back to library</a>
    <header mt="6" mb="6" display="flex" flex-col lg-flex-row justify="between" gap="5">
      <div max-w="3xl">
        <p m="0" mb="2" text="primary" font-size="sm" font-weight="700">${esc((KIND[item.category] || item.category).toUpperCase())} · ${item.origin === 'community' ? 'COMMUNITY DESIGN' : 'FREE DESIGN'}</p>
        <h1 id="detail-title" m="0" font-size="4xl" tracking="tight">${esc(item.name)}</h1>
        <p m="0" mt="3" text="muted" font-size="lg">${esc(item.description)}</p>
        <dl display="flex" flex-col sm-flex-row gap="4" mt="4" text="muted" font-size="sm" m="0">
          <div><dt display="inline" font-weight="600" text="text">Creator: </dt><dd display="inline" m="0">${esc(item.creator || 'Not listed')}</dd></div>
          <div><dt display="inline" font-weight="600" text="text">License: </dt><dd display="inline" m="0">${esc(item.license || 'Not specified. Check with the creator before reuse.')}</dd></div>
        </dl>
      </div>
      <div display="flex" flex-col items="start" lg-items="end" gap="2">
        <button id="open-pg" type="button" bg="primary" text="white" border="0" rounded="md" px="6" py="3" font-weight="700" cursor="pointer">Open in Playground</button>
        <p id="pg-status" role="status" aria-live="polite" text="muted" font-size="sm" m="0"></p>
      </div>
    </header>

    <div display="flex" flex-wrap="wrap" items="center" justify="between" gap="3" mb="3">
      <div display="flex" gap="1" bg="gray-100" dark-bg="gray-900" rounded="md" p="1">
        <button type="button" id="tab-preview" aria-pressed="true" px="3" py="2" rounded="md" bg="#fff" dark-bg="gray-800" text="text" border="0" cursor="pointer">Preview</button>
        <button type="button" id="tab-code" aria-pressed="false" px="3" py="2" rounded="md" bg="transparent" text="muted" border="0" cursor="pointer">Code</button>
      </div>
      <div display="flex" gap="2" items="center">
        <label for="fmt" sr-only>Source format</label>
        <select id="fmt" bg="gray-100" dark-bg="gray-900" border="0" text="text" rounded="md" px="3" py="2"><option>HTML</option><option>React</option></select>
        <button id="copy" type="button" bg="gray-100" dark-bg="#ffffff/5" text="text" border="0" rounded="md" px="3" py="2" font-weight="600" cursor="pointer">Copy code</button>
      </div>
    </div>

    <iframe id="detail-preview" title="${esc(item.name)} live preview" data-slug="${esc(item.slug)}" w="full" border="1px solid gray-200" dark-border-color="gray-800" rounded="md" bg="#fff" style="min-height:32rem"></iframe>
    <div id="source-panel" hidden bg="gray-50" dark-bg="gray-900" border="0" rounded="md" overflow="auto" style="max-height:40rem"><pre m="0" p="5" overflow="auto"><code id="source-code" font-size="sm" line-height="relaxed" white-space="pre"></code></pre></div>
    <p text="muted" font-size="sm" mt="3">Need AtomAttr's defaults stylesheet and script on your page. Open it in the Playground to edit attributes with a live preview.</p>

    ${related.length ? `<section mt="12"><h2 font-size="2xl">Related designs</h2><div display="grid" grid-cols="1" md-grid-cols="3" gap="4">${related.map((o) => `<a href="./item.html?slug=${encodeURIComponent(o.slug)}" bg="gray-100" dark-bg="gray-900" border="0" rounded="md" p="4" text="text" text-decoration="none"><strong>${esc(o.name)}</strong><p m="0" mt="2" text="muted" font-size="sm">${esc(o.description)}</p></a>`).join('')}</div></section>` : ''}
  </div>`;

  const frame = $('detail-preview'), panel = $('source-panel'), code = $('source-code');
  const tp = $('tab-preview'), tc = $('tab-code'), sel = $('fmt'), copy = $('copy');
  const source = () => (format === 'React' ? reactSource(item) : item.preview);
  const setView = (v) => {
    const isCode = v === 'code';
    frame.hidden = isCode; panel.hidden = !isCode;
    tp.setAttribute('aria-pressed', String(!isCode)); tc.setAttribute('aria-pressed', String(isCode));
  };
  code.textContent = source();
  refreshPreviews();
  sel.addEventListener('change', () => { format = sel.value; code.textContent = source(); });
  tp.addEventListener('click', () => setView('preview'));
  tc.addEventListener('click', () => setView('code'));
  $('open-pg').addEventListener('click', (e) => openInPlayground(item, $('pg-status'), e.currentTarget));
  copy.addEventListener('click', async () => {
    const ok = await copyText(source());
    copy.textContent = ok ? 'Copied' : 'Press Ctrl/Cmd+C';
    if (!ok) { setView('code'); const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    setTimeout(() => { copy.textContent = 'Copy code'; }, 1800);
  });
}

/* ---------- boot ---------- */
function showError(msg) {
  const status = $('catalog-status'), empty = $('empty-state'), detail = $('detail');
  if (status) status.textContent = msg;
  if (empty) { empty.hidden = false; const h = empty.querySelector('h3'), p = empty.querySelector('p'); if (h) h.textContent = 'Library unavailable'; if (p) p.textContent = msg; }
  if (detail) { detail.setAttribute('aria-busy', 'false'); detail.innerHTML = `<section max-w="4xl" mx="auto" px="4" py="16"><h1 font-size="3xl">Library unavailable</h1><p text="muted">${esc(msg)}</p><a href="./catalog.html" text="primary">Back to library</a></section>`; }
}

async function boot() {
  setupTheme();
  try {
    const data = await import('./data/catalog-data.js');
    // Only published designs are ever shown. Items without a status are treated as published.
    items = (data.catalogItems || []).filter((i) => !i.status || i.status === 'published');
    categories = data.catalogCategories || [];
    items.forEach((i) => bySlug.set(i.slug, i));
  } catch (e) {
    console.error('AtomAttr UI: could not load catalog data', e);
    showError('The published design data could not be loaded. Refresh the page or try again later.');
    return;
  }
  const detail = $('detail');
  if (detail) initDetail(detail); else initGallery();
}
boot();

/* Extra AtomAttr UI designs. catalog.js calls buildMore(mk) so these share the same helper.
   This file brings Buttons, Cards and Forms to 15 each (existing 12 + 3, 4 + 11, 3 + 12). */

const CARD = 'bg="#fff" dark-bg="#17181b" border="0"';
const FIELD = 'bg="gray-100" dark-bg="gray-900" text="text" border="0" rounded="md" px="3" py="2.5"';
const PRIMARY = 'bg="primary" hover-bg="primary/80" text="white" border="0" rounded="md" font-weight="600" cursor="pointer"';
const LBL = 'display="grid" gap="1.5" font-size="sm" font-weight="600"';

export function buildMore(mk) {
  /* ---------------- Buttons +3 ---------------- */
  const buttons = [
    mk('Buttons', 'Loading States', 'Spinner, progress and success states for async actions.', ['button', 'loading', 'state'], `
<div display="flex" wrap items="center" justify="center" gap="3">
  <button type="button" disabled display="inline-flex" items="center" gap="2" bg="primary/60" text="white" border="0" px="4" py="2.5" rounded="md" font-weight="600"><i class="ri-loader-4-line"></i> Saving…</button>
  <button type="button" display="inline-flex" items="center" gap="2" bg="success" text="white" border="0" px="4" py="2.5" rounded="md" font-weight="600"><i class="ri-check-line"></i> Saved</button>
  <button type="button" display="inline-flex" items="center" gap="2" bg="gray-100" text="danger" border="0" px="4" py="2.5" rounded="md" font-weight="600" cursor="pointer" dark-bg="gray-900"><i class="ri-refresh-line"></i> Retry</button>
</div>`),
    mk('Buttons', 'Split Dropdown', 'Primary action with an attached menu trigger.', ['button', 'split', 'dropdown'], `
<div display="inline-flex" rounded="md" overflow="hidden" shadow="md">
  <button type="button" bg="primary" hover-bg="primary/80" text="white" border="0" px="5" py="2.5" font-weight="600" cursor="pointer">Publish</button>
  <button type="button" aria-label="More publish options" bg="primary" hover-bg="primary/80" text="white" border="0" border-l="1px" border-l-color="#ffffff/30" px="3" cursor="pointer"><i class="ri-arrow-down-s-line"></i></button>
</div>`),
    mk('Buttons', 'Text Links', 'Inline link-style actions with underline and arrow treatments.', ['button', 'link', 'text'], `
<div display="flex" wrap items="center" justify="center" gap="6" font-size="sm" font-weight="600">
  <a href="#" text="primary" underline>View all projects</a>
  <a href="#" display="inline-flex" items="center" gap="1" text="text" text-decoration="none" hover-text="primary">Read the guide <i class="ri-arrow-right-line"></i></a>
  <a href="#" text="muted" hover-text="text" text-decoration="none">Skip for now</a>
</div>`),
  ];

  /* ---------------- Cards +11 ---------------- */
  const cards = [
    mk('Cards', 'Testimonial', 'Quote, rating and author line.', ['card', 'testimonial', 'social-proof'], `
<figure w="full" max-w="22rem" m="0" ${CARD} rounded="2xl" p="6" shadow="md">
  <div text="warning" mb="3"><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-fill"></i></div>
  <blockquote m="0" font-size="lg" line-height="relaxed">We replaced three stylesheets with one page of attributes. Handoff stopped being a meeting.</blockquote>
  <figcaption display="flex" items="center" gap="3" mt="5"><span w="10" h="10" rounded="full" bg="primary" text="white" display="flex" items="center" justify="center" font-weight="700">TO</span><span><b display="block" font-size="sm">Tolu Okafor</b><span text="muted" font-size="xs">Frontend lead, Paystack</span></span></figcaption>
</figure>`, { featured: true }),
    mk('Cards', 'Blog Post', 'Cover, category chip, headline and read time.', ['card', 'blog', 'content'], `
<article w="full" max-w="20rem" ${CARD} rounded="md" overflow="hidden">
  <div h="32" bg-gradient="linear-gradient(135deg,#0ea5e9,#6366f1)"></div>
  <div p="5">
    <span bg="primary/10" text="primary" rounded="md" px="2.5" py="0.5" font-size="xs" font-weight="600">Engineering</span>
    <h3 m="0" mt="3" font-size="lg" line-height="snug">Why attributes beat class names for design handoff</h3>
    <p m="0" mt="3" text="muted" font-size="sm">8 min read · Oct 14</p>
  </div>
</article>`),
    mk('Cards', 'Event Ticket', 'Date block, venue and register action.', ['card', 'event', 'ticket'], `
<div w="full" max-w="22rem" display="flex" ${CARD} rounded="md" overflow="hidden" shadow="md">
  <div bg="primary" text="white" px="5" py="5" align="center" display="flex" flex-col justify="center"><b font-size="3xl" line-height="none">24</b><span font-size="xs" font-weight="600">NOV</span></div>
  <div p="5" flex="1"><h3 m="0" font-size="base">Design Systems Meetup</h3><p m="0" mt="1" text="muted" font-size="sm"><i class="ri-map-pin-line"></i> Wuse 2, Abuja · 6:00 PM</p>
    <button type="button" mt="3" bg="transparent" text="primary" border="0" p="0" font-weight="600" font-size="sm" cursor="pointer">Reserve a seat</button></div>
</div>`),
    mk('Cards', 'Music Player', 'Artwork, track info, progress bar and transport controls.', ['card', 'media', 'player'], `
<div w="full" max-w="18rem" ${CARD} rounded="md" p="4" shadow="lg">
  <div h="40" rounded="md" bg-gradient="linear-gradient(135deg,#f43f5e,#f59e0b)" display="flex" items="center" justify="center" text="white" font-size="5xl"><i class="ri-music-2-fill"></i></div>
  <h3 m="0" mt="4" font-size="base">Night Drive</h3><p m="0" text="muted" font-size="sm">Lagos Sessions</p>
  <div h="1" bg="gray-200" dark-bg="#ffffff/15" rounded="full" mt="4"><div h="1" w="2/5" bg="primary" rounded="full"></div></div>
  <div display="flex" items="center" justify="center" gap="6" mt="4" text="text" font-size="2xl"><i class="ri-skip-back-fill"></i><span w="12" h="12" rounded="full" bg="primary" text="white" display="flex" items="center" justify="center"><i class="ri-play-fill"></i></span><i class="ri-skip-forward-fill"></i></div>
</div>`),
    mk('Cards', 'Project Progress', 'Title, deadline, progress bar and stacked avatars.', ['card', 'progress', 'dashboard'], `
<div w="full" max-w="20rem" ${CARD} rounded="md" p="5">
  <div display="flex" items="center" justify="between"><h3 m="0" font-size="base">Website redesign</h3><span bg="warning/10" text="warning" rounded="md" px="2" py="0.5" font-size="xs" font-weight="600">Due Fri</span></div>
  <div display="flex" justify="between" mt="4" font-size="xs" text="muted"><span>Progress</span><span>68%</span></div>
  <div h="2" bg="gray-100" dark-bg="#ffffff/10" rounded="full" mt="2"><div h="2" w="2/3" bg="primary" rounded="full"></div></div>
  <div display="flex" mt="4"><span w="8" h="8" rounded="full" bg="primary" text="white" display="flex" items="center" justify="center" font-size="xs" border="2px solid #fff" dark-border-color="#17181b">AO</span><span w="8" h="8" rounded="full" bg="success" text="white" display="flex" items="center" justify="center" font-size="xs" border="2px solid #fff" dark-border-color="#17181b" ml="-2">KE</span><span w="8" h="8" rounded="full" bg="gray-200" dark-bg="#ffffff/15" text="muted" display="flex" items="center" justify="center" font-size="xs" border="2px solid #fff" dark-border-color="#17181b" ml="-2">+3</span></div>
</div>`),
    mk('Cards', 'Team Member', 'Centered portrait, role and social links.', ['card', 'team', 'profile'], `
<div w="full" max-w="16rem" align="center" ${CARD} rounded="md" p="6">
  <span w="20" h="20" rounded="full" bg-gradient="linear-gradient(135deg,#6366f1,#d946ef)" text="white" display="flex" items="center" justify="center" font-size="2xl" font-weight="700" mx="auto">CE</span>
  <h3 m="0" mt="4" font-size="lg">Chioma Eze</h3><p m="0" mt="1" text="muted" font-size="sm">Head of Design</p>
  <div display="flex" justify="center" gap="4" mt="4" text="muted" font-size="lg"><i class="ri-twitter-x-line"></i><i class="ri-linkedin-box-line"></i><i class="ri-mail-line"></i></div>
</div>`),
    mk('Cards', 'Order Summary', 'Line items, total and checkout action.', ['card', 'checkout', 'ecommerce'], `
<div w="full" max-w="20rem" ${CARD} rounded="md" p="5" shadow="md" font-size="sm">
  <h3 m="0" mb="4" font-size="base">Order summary</h3>
  <div display="flex" justify="between" py="2"><span text="muted">Subtotal</span><span>₦48,000</span></div>
  <div display="flex" justify="between" py="2"><span text="muted">Delivery</span><span>₦2,500</span></div>
  <div display="flex" justify="between" py="3" mt="2" border-t="1px" border-color="gray-200" dark-border-color="#ffffff/10" font-weight="700" font-size="base"><span>Total</span><span>₦50,500</span></div>
  <button type="button" w="full" mt="3" py="3" ${PRIMARY}>Pay now</button>
</div>`),
    mk('Cards', 'Listing', 'Photo area, price, specs and save toggle.', ['card', 'listing', 'marketplace'], `
<div w="full" max-w="20rem" ${CARD} rounded="md" overflow="hidden">
  <div position="relative" h="40" bg-gradient="linear-gradient(135deg,#14b8a6,#0ea5e9)"><button type="button" aria-label="Save" position="absolute" top="3" right="3" w="9" h="9" rounded="md" bg="#fff" text="danger" border="0" display="flex" items="center" justify="center" cursor="pointer"><i class="ri-heart-line"></i></button></div>
  <div p="4"><b font-size="lg">₦85M</b><p m="0" mt="1" font-size="sm">4-bed duplex, Maitama</p>
    <div display="flex" gap="4" mt="3" text="muted" font-size="xs"><span><i class="ri-hotel-bed-line"></i> 4</span><span><i class="ri-drop-line"></i> 5</span><span><i class="ri-ruler-line"></i> 420 m²</span></div></div>
</div>`),
    mk('Cards', 'Weather', 'Current conditions with a three-day outlook.', ['card', 'weather', 'widget'], `
<div w="full" max-w="18rem" rounded="md" p="5" text="white" bg-gradient="linear-gradient(160deg,#0ea5e9,#6366f1)" shadow="lg">
  <div display="flex" items="center" justify="between"><span font-size="sm" opacity="80">Abuja</span><i class="ri-sun-cloudy-line" font-size="2xl"></i></div>
  <p m="0" mt="2" font-size="5xl" font-weight="700" tracking="tight">29°</p><p m="0" font-size="sm" opacity="80">Partly cloudy</p>
  <div display="grid" grid-cols="3" gap="2" mt="5" align="center" font-size="xs"><div bg="#ffffff/15" rounded="md" py="2">Thu<br><b>31°</b></div><div bg="#ffffff/15" rounded="md" py="2">Fri<br><b>28°</b></div><div bg="#ffffff/15" rounded="md" py="2">Sat<br><b>27°</b></div></div>
</div>`),
    mk('Cards', 'Feature Icon', 'Icon tile, heading, description and learn-more link.', ['card', 'feature', 'icon'], `
<div w="full" max-w="18rem" ${CARD} rounded="md" p="6" hover-border-color="primary">
  <span w="12" h="12" rounded="md" bg="primary/10" text="primary" display="flex" items="center" justify="center" font-size="2xl"><i class="ri-shield-check-line"></i></span>
  <h3 m="0" mt="5" mb="2" font-size="lg">Secure by default</h3>
  <p m="0" text="muted" font-size="sm" line-height="relaxed">Every workspace ships with two-factor sign-in and audit logs turned on.</p>
  <a href="#" display="inline-flex" items="center" gap="1" mt="4" text="primary" font-size="sm" font-weight="600" text-decoration="none">Learn more <i class="ri-arrow-right-line"></i></a>
</div>`),
    mk('Cards', 'Pricing Featured', 'Highlighted plan with badge, feature list and inverted button.', ['card', 'pricing', 'featured'], `
<div w="full" max-w="18rem" position="relative" bg="gray-950" dark-bg="#fff" text="white" dark-text="gray-950" rounded="md" p="7" shadow="xl">
  <span position="absolute" top="-3" right="6" bg="primary" text="white" rounded="md" px="3" py="1" font-size="xs" font-weight="700">Most popular</span>
  <p m="0" font-size="sm" font-weight="700" opacity="70">Team</p>
  <p m="0" mt="2" font-size="5xl" font-weight="700" tracking="tight">$49<span font-size="sm" font-weight="400" opacity="70">/mo</span></p>
  <div display="grid" gap="3" mt="5" font-size="sm"><div><i class="ri-check-line"></i> 10 seats</div><div><i class="ri-check-line"></i> Shared libraries</div><div><i class="ri-check-line"></i> Priority support</div></div>
  <button type="button" w="full" mt="6" py="3" bg="#fff" dark-bg="gray-950" text="gray-950" dark-text="white" border="0" rounded="md" font-weight="700" cursor="pointer">Start trial</button>
</div>`),
  ];

  /* ---------------- Forms +12 ---------------- */
  const forms = [
    mk('Forms', 'Sign Up', 'Name, email, password and terms checkbox.', ['form', 'signup', 'auth'], `
<div w="full" max-w="22rem" display="grid" gap="4" ${CARD} rounded="md" p="6" shadow="md">
  <h3 m="0" font-size="xl">Create your account</h3>
  <label ${LBL}>Full name<input type="text" placeholder="Ada Okafor" ${FIELD}></label>
  <label ${LBL}>Work email<input type="email" placeholder="ada@company.com" ${FIELD}></label>
  <label ${LBL}>Password<input type="password" placeholder="At least 8 characters" ${FIELD}></label>
  <label display="flex" items="center" gap="2" font-size="sm" text="muted"><input type="checkbox" accent-color="primary"> I agree to the terms</label>
  <button type="button" py="2.5" ${PRIMARY}>Create account</button>
</div>`, { featured: true }),
    mk('Forms', 'Newsletter', 'Single-line email capture with an inline button.', ['form', 'newsletter', 'inline'], `
<div w="full" max-w="26rem"><p m="0" mb="2" font-weight="600">Get the monthly digest</p>
  <div display="flex" gap="2" p="1.5" ${CARD} rounded="full"><input type="email" aria-label="Email" placeholder="you@email.com" bg="transparent" border="0" text="text" flex="1" px="4" w="full"><button type="button" px="5" py="2.5" ${PRIMARY} rounded="md">Subscribe</button></div></div>`),
    mk('Forms', 'Contact', 'Two-column name row, message and send action.', ['form', 'contact', 'support'], `
<div w="full" max-w="28rem" display="grid" gap="4" ${CARD} rounded="md" p="6">
  <div display="grid" grid-cols="2" gap="3"><label ${LBL}>First name<input type="text" ${FIELD}></label><label ${LBL}>Last name<input type="text" ${FIELD}></label></div>
  <label ${LBL}>Email<input type="email" ${FIELD}></label>
  <label ${LBL}>Message<textarea rows="4" placeholder="How can we help?" ${FIELD}></textarea></label>
  <button type="button" py="2.5" ${PRIMARY}>Send message</button>
</div>`),
    mk('Forms', 'OTP Code', 'Six single-digit boxes for verification codes.', ['form', 'otp', 'verify'], `
<div align="center" w="full" max-w="22rem"><h3 m="0" font-size="lg">Enter the 6-digit code</h3><p m="0" mt="1" mb="4" text="muted" font-size="sm">Sent to ada@company.com</p>
  <div display="flex" justify="center" gap="2">${[4, 8, 2, '', '', ''].map((d) => `<input type="text" inputmode="numeric" maxlength="1" value="${d}" aria-label="Digit" w="11" h="12" align="center" font-size="xl" font-weight="700" bg="#fff" dark-bg="#0b0c0e" text="text" border="${d === '' ? '1px solid gray-300' : '2px solid primary'}" dark-border-color="#ffffff/15" rounded="md">`).join('')}</div>
  <button type="button" mt="5" w="full" py="2.5" ${PRIMARY}>Verify</button></div>`),
    mk('Forms', 'Toggle Switches', 'Settings rows with on and off switches.', ['form', 'toggle', 'settings'], `
<div w="full" max-w="22rem" ${CARD} rounded="md" overflow="hidden">
  <div display="flex" items="center" justify="between" p="4" border-b="1px" border-color="gray-200" dark-border-color="#ffffff/10"><span><b display="block" font-size="sm">Email alerts</b><span text="muted" font-size="xs">Weekly summary</span></span><span w="11" h="6" rounded="full" bg="primary" position="relative"><span position="absolute" top="0.5" right="0.5" w="5" h="5" rounded="full" bg="#fff"></span></span></div>
  <div display="flex" items="center" justify="between" p="4"><span><b display="block" font-size="sm">Push alerts</b><span text="muted" font-size="xs">Mentions only</span></span><span w="11" h="6" rounded="full" bg="gray-300" dark-bg="#ffffff/20" position="relative"><span position="absolute" top="0.5" left="0.5" w="5" h="5" rounded="full" bg="#fff"></span></span></div>
</div>`),
    mk('Forms', 'Payment', 'Card number, expiry and CVC fields.', ['form', 'payment', 'checkout'], `
<div w="full" max-w="22rem" display="grid" gap="4" ${CARD} rounded="md" p="6" shadow="md">
  <h3 m="0" font-size="lg">Payment details</h3>
  <label ${LBL}>Card number<input type="text" inputmode="numeric" placeholder="0000 0000 0000 0000" ${FIELD}></label>
  <div display="grid" grid-cols="2" gap="3"><label ${LBL}>Expiry<input type="text" placeholder="MM / YY" ${FIELD}></label><label ${LBL}>CVC<input type="text" placeholder="123" ${FIELD}></label></div>
  <button type="button" py="2.5" ${PRIMARY}><i class="ri-lock-line"></i> Pay ₦50,500</button>
</div>`),
    mk('Forms', 'Dropzone', 'Dashed upload area with a browse action.', ['form', 'upload', 'file'], `
<div w="full" max-w="24rem" align="center" border="2px dashed gray-300" dark-border-color="#ffffff/20" rounded="md" p="8" hover-border-color="primary">
  <span w="12" h="12" rounded="full" bg="primary/10" text="primary" display="flex" items="center" justify="center" font-size="2xl" mx="auto"><i class="ri-upload-cloud-2-line"></i></span>
  <p m="0" mt="3" font-weight="600">Drop files here</p><p m="0" mt="1" text="muted" font-size="sm">PNG, JPG or PDF up to 10 MB</p>
  <button type="button" mt="4" px="4" py="2" bg="gray-100" text="primary" border="0" rounded="md" font-weight="600" font-size="sm" cursor="pointer" dark-bg="gray-900">Browse files</button>
</div>`),
    mk('Forms', 'Filter Chips', 'Selectable pill filters with one active state.', ['form', 'chips', 'filter'], `
<div display="flex" wrap justify="center" gap="2" font-size="sm" font-weight="600">
  <button type="button" bg="primary" text="white" border="0" px="4" py="1.5" rounded="md" cursor="pointer">All</button>
  <button type="button" bg="gray-100" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="text" border="0" px="4" py="1.5" rounded="md" cursor="pointer" dark-bg="gray-900">Design</button>
  <button type="button" bg="gray-100" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="text" border="0" px="4" py="1.5" rounded="md" cursor="pointer" dark-bg="gray-900">Engineering</button>
  <button type="button" bg="gray-100" hover-bg="gray-100" dark-hover-bg="#ffffff/5" text="text" border="0" px="4" py="1.5" rounded="md" cursor="pointer" dark-bg="gray-900">Product</button>
</div>`),
    mk('Forms', 'Quantity Stepper', 'Minus, value and plus controls in one pill.', ['form', 'stepper', 'ecommerce'], `
<div display="inline-flex" items="center" ${CARD} rounded="full" p="1">
  <button type="button" aria-label="Decrease" w="9" h="9" rounded="md" bg="transparent" hover-bg="gray-100" dark-hover-bg="#ffffff/10" text="text" border="0" cursor="pointer"><i class="ri-subtract-line"></i></button>
  <span w="10" align="center" font-weight="700">2</span>
  <button type="button" aria-label="Increase" w="9" h="9" rounded="md" bg="primary" text="white" border="0" cursor="pointer"><i class="ri-add-line"></i></button>
</div>`),
    mk('Forms', 'Select and Textarea', 'Native select with helper text and a counted textarea.', ['form', 'select', 'textarea'], `
<div w="full" max-w="22rem" display="grid" gap="4">
  <label ${LBL}>Category<select ${FIELD}><option>Bug report</option><option>Feature request</option><option>Billing</option></select><span text="muted" font-size="xs" font-weight="400">Pick the closest match.</span></label>
  <label ${LBL}>Details<textarea rows="4" placeholder="What happened?" ${FIELD}></textarea><span text="muted" font-size="xs" font-weight="400" align="right">0 / 500</span></label>
</div>`),
    mk('Forms', 'Star Rating', 'Five-star rating row with a short comment field.', ['form', 'rating', 'review'], `
<div w="full" max-w="22rem" display="grid" gap="3" ${CARD} rounded="md" p="5">
  <b>How was your order?</b>
  <div text="warning" font-size="2xl"><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-line"></i></div>
  <input type="text" aria-label="Comment" placeholder="Add a comment (optional)" ${FIELD}>
  <button type="button" py="2.5" ${PRIMARY}>Submit review</button>
</div>`),
    mk('Forms', 'Password Strength', 'Password field with a strength meter and rule checks.', ['form', 'password', 'validation'], `
<div w="full" max-w="22rem" display="grid" gap="3">
  <label ${LBL}>New password<input type="password" value="Abuja#2026" ${FIELD}></label>
  <div display="grid" grid-cols="4" gap="1.5"><span h="1.5" rounded="full" bg="success"></span><span h="1.5" rounded="full" bg="success"></span><span h="1.5" rounded="full" bg="success"></span><span h="1.5" rounded="full" bg="gray-200" dark-bg="#ffffff/15"></span></div>
  <div display="grid" gap="1.5" font-size="xs"><span text="success"><i class="ri-check-line"></i> 8+ characters</span><span text="success"><i class="ri-check-line"></i> A number and a symbol</span><span text="muted"><i class="ri-close-line"></i> No common words</span></div>
</div>`),
  ];

  return { buttons, cards, forms };
}