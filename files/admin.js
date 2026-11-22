/* AtomAttr UI Studio. No database: drafts live in this browser's localStorage.
   The passphrase gate keeps casual visitors out of the page, but it is NOT real security.
   What actually protects the public library is that only you can commit to data/catalog-data.js. */
import { esc, ORDER, KIND, frameOf, previewDocument, openInPlayground, copyText, readDrafts, writeDrafts, ADMIN_KEY } from './ui-lib.js';

const $ = (id) => document.getElementById(id);
const FIXED_HASH = ''; // optional: paste the hash shown after setup so the same passphrase works in every browser
const HASH_KEY = 'atomattr-ui-admin-hash';
const SESSION_HOURS = 8;

try { if ((localStorage.getItem('atomattr-theme') || '') === 'dark') document.documentElement.classList.add('dark'); } catch {}

/* ---------- gate ---------- */
async function sha(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('atomattr-ui:' + text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const unlocked = () => Number(localStorage.getItem(ADMIN_KEY) || 0) > Date.now();
function unlock() { localStorage.setItem(ADMIN_KEY, String(Date.now() + SESSION_HOURS * 3600e3)); showApp(); }
function lock() { localStorage.removeItem(ADMIN_KEY); location.reload(); }

function initGate() {
  if (unlocked()) return showApp();
  const stored = FIXED_HASH || localStorage.getItem(HASH_KEY) || '';
  const setup = !stored;
  if (setup) {
    $('gate-title').textContent = 'Create your studio passphrase';
    $('gate-note').textContent = 'First visit on this browser. Choose a passphrase; you will use it to unlock this page.';
    $('gate-btn').textContent = 'Set passphrase';
    $('gate-pass').autocomplete = 'new-password';
  }
  $('gate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('gate-error'); err.hidden = true;
    const val = $('gate-pass').value;
    if (!crypto?.subtle) { err.textContent = 'This browser cannot hash passphrases here. Use HTTPS or localhost.'; err.hidden = false; return; }
    if (setup && val.length < 8) { err.textContent = 'Use at least 8 characters.'; err.hidden = false; return; }
    const h = await sha(val);
    if (setup) { localStorage.setItem(HASH_KEY, h); sessionStorage.setItem('aa-new-hash', h); unlock(); }
    else if (h === stored) unlock();
    else { err.textContent = 'Wrong passphrase.'; err.hidden = false; }
  });
}

/* ---------- studio ---------- */
const state = { editing: null, dark: false, width: 'frame' };
const today = () => new Date().toISOString().slice(0, 10);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const flash = (t) => { $('msg').textContent = t; clearTimeout(flash.t); flash.t = setTimeout(() => { $('msg').textContent = ''; }, 2500); };

function lint(markup) {
  const w = [];
  if (/<script/i.test(markup)) w.push('Remove <script> tags. Designs must be markup only.');
  if (/\son\w+\s*=/i.test(markup)) w.push('Remove inline event handlers like onclick.');
  if (/\sclass="(?!ri-)[^"]*"/i.test(markup)) w.push('Found class="…". Style with AtomAttr attributes instead (icon classes like ri-* are fine).');
  if (/\sstyle\s*=/i.test(markup)) w.push('Found inline style="…". Prefer AtomAttr attributes so the source stays editable in the Playground.');
  if (/<(link|iframe|object|embed)\b/i.test(markup)) w.push('Remove <link>, <iframe>, <object> and <embed>.');
  return w;
}

function readForm() {
  const name = $('f-name').value.trim();
  const slug = slugify($('f-slug').value.trim() || `${$('f-category').value}-${name}`);
  const align = $('f-align').value;
  const item = {
    id: slug, slug, name,
    description: $('f-desc').value.trim(),
    category: $('f-category').value,
    tags: $('f-tags').value.split(',').map((t) => t.trim()).filter(Boolean),
    preview: $('f-markup').value.trim(),
    creator: $('f-creator').value.trim(),
    license: $('f-license').value.trim(),
    frame: { w: Math.max(200, +$('f-fw').value || 480), h: Math.max(120, +$('f-fh').value || 300) },
    added: today(),
  };
  if (align) item.align = align;
  return item;
}

function writeForm(item) {
  const f = frameOf(item);
  $('f-name').value = item.name || '';
  $('f-slug').value = item.slug || '';
  $('f-category').value = item.category || ORDER[0];
  $('f-tags').value = (item.tags || []).join(', ');
  $('f-desc').value = item.description || '';
  $('f-creator').value = item.creator || '';
  $('f-license').value = item.license || '';
  $('f-fw').value = f.w; $('f-fh').value = f.h;
  $('f-align').value = item.align || '';
  $('f-markup').value = item.preview || '';
  state.editing = item.slug || null;
  renderPreview();
}

/* ---------- preview ---------- */
function renderPreview() {
  const item = readForm();
  const issues = lint(item.preview);
  $('lint').hidden = !issues.length;
  $('lint').innerHTML = issues.map((i) => `<li>${esc(i)}</li>`).join('');
  const frame = $('pv-frame'), stage = $('pv-stage'), pv = $('pv');
  const w = state.width === 'frame' ? item.frame.w : +state.width;
  const h = item.frame.h;
  const W = stage.clientWidth, H = stage.clientHeight;
  const s = Math.min((W - 32) / w, (H - 32) / h, 1.5);
  frame.style.width = `${w}px`; frame.style.height = `${h}px`;
  frame.style.transform = `translate(${(W - w * s) / 2}px,${(H - h * s) / 2}px) scale(${s})`;
  $('pv-size').textContent = `${w} × ${h} · shown at ${Math.round(s * 100)}%`;
  pv.srcdoc = previewDocument(item, { dark: state.dark });
}
let t;
const queuePreview = () => { clearTimeout(t); t = setTimeout(renderPreview, 200); };

/* ---------- drafts + export ---------- */
function exportList(drafts) {
  return drafts.map(({ status, origin, ...d }) => ({ ...d, origin: 'official', status: 'published' }));
}
function renderDrafts() {
  const drafts = readDrafts();
  $('count').textContent = drafts.length ? `(${drafts.length})` : '';
  $('drafts-empty').hidden = drafts.length > 0;
  $('drafts').innerHTML = drafts.map((d) => `<div display="flex" items="center" justify="between" gap="3" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="xl" px="3" py="2">
    <div min-w="0"><b font-size="sm" display="block" truncate>${esc(d.name)}</b><span text="muted" font-size="xs">${esc(KIND[d.category] || d.category)} · ${esc(d.slug)}</span></div>
    <div display="flex" gap="1" flex="none" font-size="xs">
      <button type="button" data-edit="${esc(d.slug)}" bg="gray-100" dark-bg="#ffffff/10" text="text" border="0" rounded="md" px="2.5" py="1.5" cursor="pointer">Edit</button>
      <a href="./item.html?slug=${encodeURIComponent(d.slug)}" bg="gray-100" dark-bg="#ffffff/10" text="text" rounded="md" px="2.5" py="1.5" text-decoration="none">View</a>
      <button type="button" data-del="${esc(d.slug)}" bg="danger/10" text="danger" border="0" rounded="md" px="2.5" py="1.5" cursor="pointer">Delete</button>
    </div></div>`).join('');
  $('export').value = drafts.length ? JSON.stringify(exportList(drafts), null, 2) : '';
}

function save() {
  const item = readForm();
  if (!item.name) return flash('Give it a name first.');
  if (!item.preview) return flash('Add some markup first.');
  if (/<script/i.test(item.preview)) return flash('Remove <script> tags before saving.');
  const list = readDrafts();
  const idx = list.findIndex((d) => d.slug === (state.editing || item.slug));
  if (idx >= 0) list[idx] = item; else list.unshift(item);
  writeDrafts(list);
  state.editing = item.slug;
  $('f-slug').value = item.slug;
  renderDrafts();
  flash('Draft saved. It now shows in your gallery.');
}

function blank() {
  writeForm({ category: 'Navbars', creator: $('f-creator').value || 'Adeniyi Adetayo', license: $('f-license').value || 'Free to use', preview: '', frame: { w: 860, h: 300 } });
  state.editing = null;
}

function showApp() {
  $('gate').remove(); $('app').hidden = false;
  $('f-category').innerHTML = ORDER.map((c) => `<option>${c}</option>`).join('');
  const newHash = sessionStorage.getItem('aa-new-hash');
  if (newHash) {
    const n = $('hash-note'); n.hidden = false;
    n.innerHTML = `Passphrase set for this browser. To use the same passphrase in other browsers, set <code>FIXED_HASH</code> in admin.js to <code>${esc(newHash)}</code>.`;
    sessionStorage.removeItem('aa-new-hash');
  }
  blank(); renderDrafts();

  ['f-name', 'f-category', 'f-tags', 'f-desc', 'f-fw', 'f-fh', 'f-align', 'f-markup'].forEach((id) => $(id).addEventListener('input', queuePreview));
  window.addEventListener('resize', queuePreview);
  $('save').addEventListener('click', save);
  $('new').addEventListener('click', blank);
  $('lock').addEventListener('click', lock);
  $('play').addEventListener('click', (e) => { const it = readForm(); if (it.preview) openInPlayground(it, $('msg'), e.currentTarget); else flash('Add some markup first.'); });
  $('pv-theme').addEventListener('click', (e) => { state.dark = !state.dark; e.currentTarget.innerHTML = state.dark ? '<i class="ri-contrast-fill"></i> Dark' : '<i class="ri-contrast-line"></i> Light'; renderPreview(); });
  $('pv-widths').addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    state.width = b.dataset.w;
    $('pv-widths').querySelectorAll('button').forEach((x) => { const on = x === b; x.setAttribute('bg', on ? '#fff' : 'transparent'); x.setAttribute('text', on ? 'text' : 'muted'); });
    renderPreview();
  });
  $('drafts').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) { const d = readDrafts().find((x) => x.slug === ed.dataset.edit); if (d) writeForm(d); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (del && confirm('Delete this draft from this browser?')) { writeDrafts(readDrafts().filter((x) => x.slug !== del.dataset.del)); renderDrafts(); flash('Draft deleted.'); }
  });
  $('exp-copy').addEventListener('click', async () => { const v = $('export').value; flash(!v ? 'Nothing to export yet.' : (await copyText(v)) ? 'Export copied.' : 'Select the text and copy it.'); });
  $('exp-dl').addEventListener('click', () => {
    const v = $('export').value; if (!v) return flash('Nothing to export yet.');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([v], { type: 'application/json' })); a.download = 'atomattr-ui-drafts.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  $('imp-btn').addEventListener('click', () => {
    try {
      const parsed = JSON.parse($('imp').value);
      const incoming = (Array.isArray(parsed) ? parsed : [parsed]).filter((d) => d && d.slug && d.name && d.preview && !/<script/i.test(d.preview));
      if (!incoming.length) return flash('No valid designs found in that JSON.');
      const map = new Map(readDrafts().map((d) => [d.slug, d]));
      incoming.forEach((d) => map.set(d.slug, d));
      writeDrafts([...map.values()]); renderDrafts(); $('imp').value = ''; flash(`Imported ${incoming.length}.`);
    } catch { flash('That is not valid JSON.'); }
  });
}

initGate();