/* Shared helpers for AtomAttr UI: gallery (catalog.js) and the private studio (admin.js). */

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const ORDER = ["Hero", "Navigation", "Buttons", "Animated buttons", "Cards", "Image cards", "Image pills", "More blocks", "Accordions and FAQ", "Testimonials", "Social links", "Forms and inputs", "Range sliders", "Checkbox", "Switches", "Radio and choices", "Dark mode toggles", "Tooltips", "Loaders", "Alerts and banners", "Toasts", "Modals and dialogs", "Footers", "App screens"];
export const GROUPS = { Components: ["Navigation", "Buttons", "Animated buttons", "Cards", "Image cards", "Image pills", "Accordions and FAQ", "Testimonials", "Social links", "Forms and inputs", "Range sliders", "Checkbox", "Switches", "Radio and choices", "Dark mode toggles", "Tooltips", "Loaders", "Alerts and banners", "Toasts", "Modals and dialogs"], Sections: ["Hero", "Footers", "More blocks", "App screens"], Templates: [] };
export const KIND = {}; /* the group name is shown as the kind; older drafts keep their own names */

export const DRAFT_KEY = 'atomattr-ui-drafts';
export const ADMIN_KEY = 'atomattr-ui-admin-until';

export const frameOf = (item) => item.frame || { w: 480, h: 300 };
const isTop = (item) => (item.align ? item.align === 'top' : !!item.wide);

const SKELETON = '<div p="6" display="grid" gap="4" max-w="4xl" mx="auto"><div bg="gray-100" dark-bg="#ffffff/5" rounded="md" h="32"></div><div display="grid" grid-cols="3" gap="4"><div bg="gray-100" dark-bg="#ffffff/5" rounded="md" h="20"></div><div bg="gray-100" dark-bg="#ffffff/5" rounded="md" h="20"></div><div bg="gray-100" dark-bg="#ffffff/5" rounded="md" h="20"></div></div></div>';

/* The document rendered inside every preview iframe. Navbars get a faint page skeleton below them (preview only, never in the source). */
export function previewDocument(item, opts = {}) {
  const dark = opts.dark ?? document.documentElement.classList.contains('dark');
  const base = new URL('./', location.href).href;
  const top = isTop(item);
  const pad = opts.bare ? (top ? 0 : 20) : (item.pad ?? (top ? 0 : 24));
  const skeleton = opts.skeleton && item.group === 'navigation' && item.wide && item.page !== false ? SKELETON : '';
  const layout = top ? 'display:block' : (opts.bare ? 'display:flow-root;width:max-content;max-width:none' : 'display:flex;align-items:center;justify-content:center');
  return `<!doctype html><html class="${dark ? 'dark' : ''}"><head><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="dist/defaults.css"><link rel="stylesheet" href="assets/remixicon/remixicon.css"><style>*{box-sizing:border-box}html{height:100%}body{margin:0;${opts.bare ? '' : 'min-height:100%;'}padding:${pad}px;${layout};font-family:'DM Sans',system-ui,sans-serif}</style>${item.css ? `<style>${item.css}</style>` : ''}<script src="dist/atomattr.min.js" defer><\/script>${item.behavior ? '<script src="assets/studio-behavior.js" defer><\/script>' : ''}</head><body ${opts.transparent ? 'bg="transparent"' : 'bg="#fff" dark-bg="gray-950"'} text="text" dark-text="gray-50">${item.preview}${skeleton}</body></html>`;
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
const adminDrafts = () => (adminActive() ? readDrafts().map((d) => ({ ...d, origin: 'draft', status: 'draft' })) : []);
const chunkCache = new Map();
const loadChunk = (gid) => {
  if (!chunkCache.has(gid)) chunkCache.set(gid, import(`./data/groups/${gid}.js`).then((m) => m.items));
  return chunkCache.get(gid);
};
/* Light index: names, groups and sizes for every component (no markup). Small, so the category pages open fast. */
export async function loadIndex() {
  const idx = await import('./data/catalog-index.js');
  const drafts = adminDrafts();
  const taken = new Set(drafts.map((d) => d.slug));
  return { groups: idx.groups, items: [...drafts, ...idx.light.filter((i) => !taken.has(i.slug))] };
}
export async function loadTiles() { return (await import('./data/catalog-tiles.js')).tiles; }
/* Turn light entries into full ones (markup + css) by fetching only the groups they belong to. */
export async function hydrate(list) {
  const gids = [...new Set(list.filter((i) => !i.preview).map((i) => i.group))];
  const maps = await Promise.all(gids.map(async (g) => new Map((await loadChunk(g)).map((i) => [i.slug, i]))));
  const by = new Map(); maps.forEach((m) => m.forEach((v, k) => by.set(k, v)));
  return list.map((i) => (i.preview ? i : (by.get(i.slug) || i))).filter((i) => i.preview);
}
export async function loadGroup(name) {
  const { items } = await loadIndex();
  return hydrate(items.filter((i) => i.category === name));
}
export async function loadItems() {
  const { items } = await loadIndex();
  return hydrate(items);
}
