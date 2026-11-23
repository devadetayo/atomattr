/* AtomAttr UI — shared component cards (UIverse-style).
   One card design used by the UI page, the catalog gallery and the Studio, so every surface matches.
   Data comes from loadItems(): published components plus (for the owner) Studio drafts. */
import { fillCounts } from './assets/stats.js';
import { esc, KIND, frameOf, previewDocument, loadItems, loadIndex, loadTiles, hydrate, loadGroup } from './ui-lib.js';

const SAVED_KEY = 'atomattr-ui-saved';
const TOP = ['Navbars', 'Sections', 'Templates'];
const readSaved = () => { try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')); } catch { return new Set(); } };
const writeSaved = (set) => { try { localStorage.setItem(SAVED_KEY, JSON.stringify([...set])); } catch { /* storage unavailable */ } };
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'A';

export function componentCard(item, saved = readSaved()) {
  const href = `./item.html?slug=${encodeURIComponent(item.slug)}`;
  const on = saved.has(item.slug);
  const draft = item.origin === 'draft';
  const f = frameOf(item);
  const wide = item.wide ?? TOP.includes(item.category);
  return `<article data-card="${esc(item.slug)}" data-reveal group display="flex" flex-col gap="2.5">
  <div data-stage data-wide="${wide ? 1 : 0}" data-fw="${f.w}" data-fh="${f.h}" class="aa-stage" position="relative" overflow="hidden" rounded="md" bg="#e8e8ea" dark-bg="#212121" w="full" group-hover-shadow="xl" transition="all" duration="300ms" style="aspect-ratio:3/2">
    <a href="${href}" aria-label="Open ${esc(item.name)}" position="absolute" top="0" left="0" w="full" h="full" z="1"></a>
    <iframe title="${esc(item.name)} preview" loading="lazy" scrolling="no" tabindex="-1" aria-hidden="true" data-slug="${esc(item.slug)}" border="0" pointer-events="none" bg="transparent" style="position:absolute;left:50%;top:50%;width:1px;height:1px;opacity:0;transform-origin:center center;transform:translate(-50%,-50%)"></iframe>
    ${draft ? '<span position="absolute" top="3" left="3" z="2" bg="warning/15" text="warning" rounded="md" px="2.5" py="0.5" font-size="xs" font-weight="700">Draft</span>' : ''}
    <a href="${href}" position="absolute" bottom="3" right="4" z="2" display="inline-flex" items="center" gap="1.5" text="gray-900" dark-text="gray-50" font-size="sm" font-weight="600" text-decoration="none" hover-opacity="0.7" transition="all" duration="150ms"><i class="ri-code-s-slash-line" font-size="lg"></i> Get code</a>
  </div>
  <div display="flex" items="center" justify="between" gap="3" px="0.5">
    <a href="${href}" min-w="0" text="text" dark-text="gray-50" text-decoration="none" font-size="md" font-weight="700" truncate>${esc(item.name)}</a>
    <span display="flex" items="center" gap="3" flex="none" text="muted" font-size="sm">
      <span title="Views"><span data-views="${esc(item.slug)}">0</span> views</span>
      <span title="Copies" display="flex" items="center" gap="1"><i class="ri-file-copy-line"></i><span data-copies="${esc(item.slug)}">0</span></span>
      <button type="button" data-save="${esc(item.slug)}" aria-pressed="${on}" aria-label="Save ${esc(item.name)}" flex="none" display="flex" items="center" bg="transparent" border="0" text="${on ? 'primary' : 'muted'}" hover-text="primary" font-size="xl" cursor="pointer" p="0"><i class="${on ? 'ri-bookmark-fill' : 'ri-bookmark-line'}"></i></button>
    </span>
  </div>
</article>`;
}

/* Studio-style preview: the real component sits dead centre (horizontally and vertically) and is scaled to fit the stage. */
function fit(stage) {
  const ifr = stage.querySelector('iframe'); if (!ifr) return;
  const cw = stage.clientWidth, ch = stage.clientHeight;
  if (!cw || !ch) return;
  let w, h, k;
  if (stage.dataset.wide === '1') {
    // Lay wide components out at a desktop width (above the 1024px breakpoint) so they show their
    // real layout, then scale the whole frame down to fit the card.
    const fw = +stage.dataset.fw || 900, fh = +stage.dataset.fh || 400;
    let d; try { d = ifr.contentDocument; } catch { d = null; }
    w = fw; h = fh;
    if (d && d.body && d.body.firstElementChild) {
      const measure = (width) => {
        ifr.style.width = width + 'px'; ifr.style.height = '1600px'; ifr.style.transform = 'none';
        return Math.ceil(d.body.getBoundingClientRect().height);
      };
      // Short bars (navbars, banners) keep their compact width. Tall, page-like components are
      // laid out at desktop width so responsive layouts show their real shape.
      const compact = measure(fw);
      if (compact > 300) { w = 1100; const m = measure(w); h = m > 40 ? Math.min(m, Math.max(fh, 240)) : fh; }
      else if (compact > 40) h = compact;
    }
    k = Math.min((cw - 56) / w, (ch - 64) / h);
  } else {
    let d; try { d = ifr.contentDocument; } catch { return; }
    if (!d || !d.body || !d.body.firstElementChild) return;
    ifr.style.width = '1600px'; ifr.style.height = '1200px'; ifr.style.transform = 'none';
    const r = d.body.getBoundingClientRect();
    w = Math.max(1, Math.ceil(r.width)); h = Math.max(1, Math.ceil(r.height));
    k = Math.min(1, (cw - 72) / w, (ch - 80) / h);
  }
  ifr.style.width = w + 'px'; ifr.style.height = h + 'px';
  ifr.style.transform = `translate(-50%,-50%) scale(${k})`;
  ifr.style.opacity = '1';
}

const lazy = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { lazy.unobserve(e.target); e.target._load?.(); } });
}, { rootMargin: '500px 0px' });

export function paint(root, byslug) {
  root.querySelectorAll('iframe[data-slug]').forEach((f) => {
    const item = byslug.get(f.dataset.slug);
    if (!item) return;
    f.onload = () => [80, 350, 900].forEach((ms) => setTimeout(() => fit(f.closest('[data-stage]')), ms));
    f._load = () => { f.srcdoc = previewDocument(item, { transparent: true, bare: true }); };
    if (lazy) lazy.observe(f); else f._load();
  });
  root.querySelectorAll('[data-stage]').forEach(fit);
  fillCounts(root);
}

/* Bookmark clicks, theme changes and resizes for any grid of cards (used by mountCards and the Studio library). */
export function bindCards(grid) {
  if (grid._aaBound) return;
  grid._aaBound = true;
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-save]'); if (!b) return;
    const set = readSaved(), s = b.dataset.save, on = !set.has(s);
    on ? set.add(s) : set.delete(s); writeSaved(set);
    b.setAttribute('aria-pressed', on); b.setAttribute('text', on ? 'primary' : 'muted');
    b.firstElementChild.className = on ? 'ri-bookmark-fill' : 'ri-bookmark-line';
  });
  new MutationObserver(() => paint(grid, grid._aaMap || new Map())).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  new ResizeObserver(() => grid.querySelectorAll('[data-stage]').forEach(fit)).observe(grid);
}

/* Renders cards into `grid`, wires bookmarks, keeps previews in sync with theme + width. */
export function mountCards(grid, items) {
  const byslug = new Map(items.map((i) => [i.slug, i]));
  const saved = readSaved();
  grid.innerHTML = items.map((i) => componentCard(i, saved)).join('');
  paint(grid, byslug);
  bindCards(grid);
  grid._aaMap = byslug;
  if (window.__aaReveal) window.__aaReveal(grid);
}

export { loadItems, loadIndex, loadTiles, hydrate, loadGroup };
