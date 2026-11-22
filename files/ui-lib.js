/* Shared helpers for AtomAttr UI: gallery (catalog.js) and the private studio (admin.js). */

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const ORDER = ['Navbars', 'Buttons', 'Cards', 'Forms', 'Feedback', 'Sections', 'Templates'];
export const GROUPS = { Components: ['Navbars', 'Buttons', 'Cards', 'Forms', 'Feedback'], Sections: ['Sections'], Templates: ['Templates'] };
export const KIND = { Navbars: 'Navbar', Buttons: 'Button', Cards: 'Card', Forms: 'Form', Feedback: 'Feedback', Sections: 'Section', Templates: 'Template' };

export const DRAFT_KEY = 'atomattr-ui-drafts';
export const ADMIN_KEY = 'atomattr-ui-admin-until';

const FRAMES = { Navbars: { w: 860, h: 300 }, Sections: { w: 1000, h: 560 }, Templates: { w: 1200, h: 760 } };
export const frameOf = (item) => item.frame || FRAMES[item.category] || { w: 480, h: 300 };
const isTop = (item) => (item.align ? item.align === 'top' : ['Navbars', 'Sections', 'Templates'].includes(item.category));

const SKELETON = '<div p="6" display="grid" gap="4" max-w="4xl" mx="auto"><div bg="gray-100" dark-bg="#ffffff/5" rounded="2xl" h="32"></div><div display="grid" grid-cols="3" gap="4"><div bg="gray-100" dark-bg="#ffffff/5" rounded="xl" h="20"></div><div bg="gray-100" dark-bg="#ffffff/5" rounded="xl" h="20"></div><div bg="gray-100" dark-bg="#ffffff/5" rounded="xl" h="20"></div></div></div>';

/* The document rendered inside every preview iframe. Navbars get a faint page skeleton below them (preview only, never in the source). */
export function previewDocument(item, opts = {}) {
  const dark = opts.dark ?? document.documentElement.classList.contains('dark');
  const base = new URL('./', location.href).href;
  const top = isTop(item);
  const pad = item.pad ?? (top ? 0 : 24);
  const skeleton = item.category === 'Navbars' && item.page !== false ? SKELETON : '';
  const layout = top ? 'display:block' : 'display:flex;align-items:center;justify-content:center';
  return `<!doctype html><html class="${dark ? 'dark' : ''}"><head><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="dist/defaults.css"><link rel="stylesheet" href="assets/remixicon/remixicon.css"><style>*{box-sizing:border-box}html{height:100%}body{margin:0;min-height:100%;padding:${pad}px;${layout};font-family:Inter,system-ui,sans-serif}</style><script src="dist/atomattr.min.js" defer><\/script></head><body bg="#fff" dark-bg="gray-950" text="text">${item.preview}${skeleton}</body></html>`;
}

/* ---------- Playground handoff (existing #code= share format) ---------- */
function b64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export async function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return 'z.' + b64u(new Uint8Array(await new Response(stream).arrayBuffer()));
    } catch { /* fall back to plain */ }
  }
  return 'b.' + b64u(bytes);
}
export async function openInPlayground(item, statusEl, button) {
  if (button) button.disabled = true;
  if (statusEl) statusEl.textContent = 'Loading this design into the Playground…';
  try {
    const token = await encodeShare({ v: 2, l: 'html', h: item.preview, c: item.css || '' });
    location.href = `./playground.html#code=${token}`;
  } catch {
    if (button) button.disabled = false;
    if (statusEl) statusEl.textContent = 'Could not open the Playground. You can still copy the source.';
  }
}

export async function copyText(text) {
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

/* ---------- owner-only drafts (this browser's localStorage, no database) ---------- */
export function readDrafts() {
  try { const v = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function writeDrafts(list) { localStorage.setItem(DRAFT_KEY, JSON.stringify(list)); }
export function adminActive() {
  try { return Number(localStorage.getItem(ADMIN_KEY) || 0) > Date.now(); } catch { return false; }
}

/* Published designs only. The owner also sees their local drafts, badged as drafts. */
export async function loadItems() {
  const data = await import('./data/catalog-data.js');
  let items = (data.catalogItems || []).filter((i) => !i.status || i.status === 'published').map((i) => ({ origin: 'official', ...i }));
  if (adminActive()) {
    const drafts = readDrafts().map((d) => ({ ...d, origin: 'draft', status: 'draft' }));
    const taken = new Set(drafts.map((d) => d.slug));
    items = [...drafts, ...items.filter((i) => !taken.has(i.slug))];
  }
  return items;
}