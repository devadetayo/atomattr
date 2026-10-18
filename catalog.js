import { catalogCategories, catalogItems } from './data/catalog-data.js';
import React from 'react';
import { createRoot } from 'react-dom/client';

const $ = (id) => document.getElementById(id);
const root = document.body.dataset.pageScope || 'all';
const search = $('search-input');
const filters = $('category-filters');
const grid = $('catalog-grid');
const empty = $('empty-state');
const catalog = $('catalog');
let activeDetail = null;
let previewFramework = 'HTML';
let detailReactRoot = null;
let previewRevision = 0;

function applyTheme(theme, persist = true) {
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    button.textContent = dark ? 'Dark' : 'Light';
  });
  document.querySelectorAll('iframe[data-preview-source]').forEach((frame) => {
    if (frame.id === 'detail-preview' && activeDetail) renderDetailPreview();
    else frame.srcdoc = previewDocument(frame.dataset.previewSource, frame.hasAttribute('data-compact'));
  });
  if (persist) {
    try { localStorage.setItem('atomattr-theme', dark ? 'dark' : 'light'); } catch {}
  }
}

function setupTheme() {
  let saved = 'light';
  try { saved = localStorage.getItem('atomattr-theme') || 'light'; } catch {}
  applyTheme(saved, false);
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
    });
  });
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function previewDocument(markup, compact = false) {
  const base = new URL('./', location.href).href;
  const dark = document.documentElement.classList.contains('dark');
  return `<!doctype html><html class="${dark ? 'dark' : ''}"><head><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="dist/defaults.css"><link rel="stylesheet" href="assets/remixicon/remixicon.css"><style>html,body{min-height:100%;margin:0}body{box-sizing:border-box;padding:${compact ? '20px' : '32px'};font-family:system-ui,sans-serif}*{box-sizing:border-box}</style><script src="dist/atomattr.min.js" defer><\/script></head><body bg="#fff" dark-bg="gray-950" text="text">${markup}</body></html>`;
}

function card(item) {
  const tags = item.tags.map((tag) => `<span bg="gray-100" dark-bg="gray-800" text="muted" rounded="full" px="2.5" py="1" font-size="xs">${escapeHtml(tag)}</span>`).join('');
  const markup = item.preview;
  return `<article bg="#fff" dark-bg="gray-950" border="1" border-color="gray-200" dark-border-color="gray-800" rounded="xl" overflow="hidden" display="flex" flex-col>
    <a href="./item.html?slug=${encodeURIComponent(item.slug)}" aria-label="View ${escapeHtml(item.name)}" text="text" text-decoration="none" display="block" bg="gray-50" dark-bg="gray-900" border-b="1" border-b-color="gray-200" dark-border-b-color="gray-800" overflow="hidden">
      <iframe title="${escapeHtml(item.name)} preview" loading="lazy" tabindex="-1" aria-hidden="true" data-preview-source="${escapeHtml(markup)}" data-compact srcdoc="${escapeHtml(previewDocument(markup, true))}" w="full" h="48" border="0" pointer-events="none"></iframe>
    </a>
    <div p="4" display="flex" flex-col gap="3" flex="1">
      <div><p m="0" mb="1" text="muted" font-size="xs">${escapeHtml(item.category.slice(0, -1))}</p><h2 m="0" font-size="lg" font-weight="700"><a href="./item.html?slug=${encodeURIComponent(item.slug)}" text="text" text-decoration="none" hover-text="primary">${escapeHtml(item.name)}</a></h2></div>
      <p m="0" text="muted" font-size="sm" line-height="relaxed">${escapeHtml(item.description)}</p>
      <div display="flex" gap="2" wrap mt="auto">${tags}</div>
      <a href="./item.html?slug=${encodeURIComponent(item.slug)}" text="primary" font-size="sm" font-weight="600" text-decoration="none" aria-label="Preview and copy ${escapeHtml(item.name)}">Preview and copy <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}

function initializeCatalog() {
  if (!search || !filters || !grid || !empty) return false;
  const scope = root === 'all' ? catalogCategories : [root];
  const items = catalogItems.filter((item) => scope.includes(item.category));
  if (!items.length && root === 'Templates') {
    empty.innerHTML = '<h3 m="0" mb="2" font-size="xl">No complete templates are published yet</h3><p m="0" text="muted">The library currently contains standalone components and reusable sections. A template will be listed when its full preview and source are ready.</p>';
  } else if (!items.length && root === 'Premium') {
    empty.innerHTML = '<h3 m="0" mb="2" font-size="xl">No paid patterns are available</h3><p m="0" text="muted">There is no checkout or locked content in this library. Browse the published free components and sections instead.</p><a href="./catalog.html" text="primary">Browse published patterns</a>';
  }
  const groups = [...new Set(items.map((item) => item.tags[0]).filter(Boolean))];
  let activeTag = '';

  const drawFilters = () => {
    filters.innerHTML = ['All', ...groups].map((tag) => {
      const value = tag === 'All' ? '' : tag;
      const selected = value === activeTag;
      return `<button type="button" data-filter="${escapeHtml(value)}" aria-pressed="${selected}" bg="${selected ? 'primary' : 'transparent'}" text="${selected ? 'white' : 'muted'}" border="1" border-color="${selected ? 'primary' : 'gray-300'}" dark-border-color="${selected ? 'primary' : 'gray-700'}" rounded="full" px="3" py="1.5" font-size="sm" cursor="pointer">${escapeHtml(tag)}</button>`;
    }).join('');
  };

  const draw = () => {
    const query = search.value.trim().toLowerCase();
    const shown = items.filter((item) => {
      const searchable = `${item.name} ${item.description} ${item.tags.join(' ')} ${item.category}`.toLowerCase();
      return (!activeTag || item.tags.includes(activeTag)) && (!query || searchable.includes(query));
    });
    grid.innerHTML = shown.map(card).join('');
    empty.hidden = shown.length > 0;
    if (!shown.length) empty.removeAttribute('hidden');
  };

  drawFilters();
  draw();
  search.addEventListener('input', draw);
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeTag = button.dataset.filter;
    drawFilters();
    draw();
  });
  return true;
}

function jsxMarkup(markup) {
  return markup.replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^<>]*?)?\s*\/?>/gi, (tag, name, attrs = '') => `<${name}${attrs.trimEnd()} />`);
}

function reactSource(item) {
  const name = item.name.replace(/[^a-z\d]/gi, '');
  const componentName = `${name || 'AtomAttrPattern'}`.replace(/^\d/, 'Pattern$&');
  return `import React from 'react';\nimport { startAtomAttr } from 'atomattr';\nimport 'atomattr/defaults.css';\n\nstartAtomAttr();\n\nexport function ${componentName}() {\n  return (\n    <>\n      ${jsxMarkup(item.preview).replace(/\n/g, '\n      ')}\n    </>\n  );\n}\n`;
}

const reactAttributeNames = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly',
  colspan: 'colSpan', rowspan: 'rowSpan', autocomplete: 'autoComplete',
  popovertarget: 'popoverTarget', popovertargetaction: 'popoverTargetAction',
};
const booleanAttributes = new Set(['checked', 'disabled', 'multiple', 'open', 'readonly', 'required', 'selected', 'hidden', 'autofocus']);

function toReactNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const props = {};
  for (const attribute of node.attributes) {
    const key = reactAttributeNames[attribute.name] || attribute.name;
    props[key] = booleanAttributes.has(attribute.name) ? true : attribute.value;
  }
  const children = [...node.childNodes].map(toReactNode).filter((child) => child !== null);
  return React.createElement(node.localName, props, ...children);
}

function renderDetailPreview() {
  const frame = $('detail-preview');
  if (!frame || !activeDetail) return;
  const revision = ++previewRevision;
  detailReactRoot?.unmount();
  detailReactRoot = null;
  if (previewFramework === 'HTML') {
    frame.onload = null;
    frame.srcdoc = previewDocument(activeDetail.preview);
    return;
  }
  frame.onload = () => {
    if (revision !== previewRevision || !frame.contentDocument) return;
    const parsed = new DOMParser().parseFromString(`<div>${activeDetail.preview}</div>`, 'text/html');
    const container = parsed.body.firstElementChild;
    detailReactRoot = createRoot(frame.contentDocument.body);
    detailReactRoot.render(React.createElement(React.Fragment, null, ...[...container.childNodes].map(toReactNode)));
  };
  frame.srcdoc = previewDocument('');
}

function initializeDetail() {
  if (!catalog || location.pathname.split('/').pop() !== 'item.html') return false;
  const slug = new URLSearchParams(location.search).get('slug');
  const item = catalogItems.find((entry) => entry.slug === slug);
  if (!item) {
    catalog.innerHTML = `<section max-w="4xl" mx="auto" px="4" py="16"><a href="./catalog.html" text="primary">← Back to library</a><h1 font-size="3xl">Pattern not found</h1><p text="muted">This item is not published or its link is out of date.</p><a href="./catalog.html" text="primary">Browse published patterns</a></section>`;
    return true;
  }
  activeDetail = item;
  previewFramework = 'HTML';

  const related = catalogItems.filter((other) => other.kind === item.kind && other.id !== item.id && other.tags.some((tag) => item.tags.includes(tag))).slice(0, 3);
  catalog.innerHTML = `<main max-w="7xl" mx="auto" px="4" md-px="8" py="8" lg-py="12">
    <a href="./${item.category.toLowerCase()}.html" text="muted" text-decoration="none">← Back to ${item.category.toLowerCase()}</a>
    <header mt="6" mb="8"><p m="0" mb="2" text="primary" font-size="sm" font-weight="700">${escapeHtml(item.category.slice(0, -1).toUpperCase())}</p><h1 id="detail-title" m="0" font-size="4xl" tracking="tight">${escapeHtml(item.name)}</h1><p m="0" mt="3" text="muted" font-size="lg" max-w="3xl">${escapeHtml(item.description)}</p></header>
    <section display="grid" grid-cols="1" xl-grid-cols="2" gap="6" items="start" aria-labelledby="detail-title">
    <div><div display="flex" items="center" justify="between" gap="3" mb="3"><h2 m="0" font-size="lg">Preview</h2><span text="muted" font-size="sm">Live AtomAttr HTML</span></div><iframe id="detail-preview" title="${escapeHtml(item.name)} live preview" data-preview-source="${escapeHtml(item.preview)}" srcdoc="${escapeHtml(previewDocument(item.preview))}" w="full" min-h="96" border="1" border-color="gray-200" dark-border-color="gray-800" rounded="xl" bg="#fff"></iframe></div>
      <div><div display="flex" flex-wrap="wrap" items="center" justify="between" gap="3" mb="3"><div display="flex" gap="1" bg="gray-100" dark-bg="gray-900" rounded="lg" p="1"><button type="button" id="preview-tab" aria-pressed="true" aria-controls="detail-preview" data-view="preview" px="3" py="2" rounded="md" bg="#fff" dark-bg="gray-800" text="text" border="0">Preview</button><button type="button" id="code-tab" aria-pressed="false" aria-controls="source-panel" data-view="code" px="3" py="2" rounded="md" bg="transparent" text="muted" border="0">Code</button></div><div display="flex" gap="2"><label for="framework-select" sr-only>Source format</label><select id="framework-select" bg="#fff" dark-bg="gray-900" border="1" border-color="gray-300" dark-border-color="gray-700" text="text" rounded="md" px="3" py="2"><option value="HTML">HTML</option><option value="React">React</option></select><button id="copy-source" type="button" bg="primary" text="white" border="0" rounded="md" px="3" py="2" font-weight="600">Copy code</button></div></div>
      <div id="source-panel" hidden bg="gray-50" dark-bg="gray-900" border="1" border-color="gray-200" dark-border-color="gray-800" rounded="xl" overflow="auto" max-h="screen"><pre m="0" p="5" overflow="auto"><code id="source-code" font-size="sm" line-height="relaxed" white-space="pre"></code></pre></div><div id="usage-note" bg="gray-50" dark-bg="gray-900" rounded="xl" p="4" mt="4"><h2 m="0" mb="2" font-size="sm">Usage</h2><p m="0" text="muted" font-size="sm" line-height="relaxed">Include AtomAttr and its defaults stylesheet in your project. React preview shows the same markup rendered by React; the source imports AtomAttr's React-compatible browser engine integration.</p></div></div>
    </section>
    ${related.length ? `<section mt="12" aria-labelledby="related-title"><h2 id="related-title" font-size="2xl">Related patterns</h2><div display="grid" grid-cols="1" md-grid-cols="3" gap="4">${related.map((entry) => `<a href="./item.html?slug=${encodeURIComponent(entry.slug)}" bg="#fff" dark-bg="gray-900" border="1" border-color="gray-200" dark-border-color="gray-800" rounded="lg" p="4" text="text" text-decoration="none"><strong>${escapeHtml(entry.name)}</strong><p m="0" mt="2" text="muted" font-size="sm">${escapeHtml(entry.description)}</p></a>`).join('')}</div></section>` : ''}
  </main>`;

  const select = $('framework-select');
  const code = $('source-code');
  const copy = $('copy-source');
  const previewTab = $('preview-tab');
  const codeTab = $('code-tab');
  const preview = $('detail-preview');
  const sourcePanel = $('source-panel');
  const updateSource = () => {
    previewFramework = select.value;
    code.textContent = previewFramework === 'React' ? reactSource(item) : item.preview;
    renderDetailPreview();
  };
  const setView = (view) => {
    const isCode = view === 'code';
    preview.hidden = isCode;
    sourcePanel.hidden = !isCode;
    previewTab.setAttribute('aria-pressed', String(!isCode));
    codeTab.setAttribute('aria-pressed', String(isCode));
  };
  code.textContent = item.preview;
  renderDetailPreview();
  select.addEventListener('change', updateSource);
  previewTab.addEventListener('click', () => setView('preview'));
  codeTab.addEventListener('click', () => setView('code'));
  copy.addEventListener('click', async () => {
    const source = code.textContent;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(source);
      copy.textContent = 'Copied';
      copy.setAttribute('aria-live', 'polite');
    } catch {
      const field = document.createElement('textarea');
      field.value = source;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      copy.textContent = copied ? 'Copied' : 'Select code to copy';
      if (!copied) {
        setView('code');
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    setTimeout(() => { copy.textContent = 'Copy code'; }, 1800);
  });
  return true;
}

setupTheme();
if (!initializeDetail()) initializeCatalog();
