/* View and copy counters.
   Set window.ATOMATTR_STATS_URL (before this module loads) to the URL of api/stats.php, or any endpoint with the same contract:
     GET  ?ids=a,b,c           -> { "a": { "v": 12, "c": 3 }, ... }
     POST { id, type: "view" | "copy" }
   Without an endpoint, counts are kept in this browser only (localStorage), so they start at 0 and reflect your own activity. */
const URL_ = (typeof window !== 'undefined' && window.ATOMATTR_STATS_URL) || '';
const LS = 'atomattr-stats-local';
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } };
const writeLocal = (o) => { try { localStorage.setItem(LS, JSON.stringify(o)); } catch { /* storage unavailable */ } };
export const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n || 0);

export async function getCounts(ids) {
  ids = [...new Set(ids)].filter(Boolean);
  if (!ids.length) return {};
  if (URL_) {
    try {
      const r = await fetch(`${URL_}${URL_.includes('?') ? '&' : '?'}ids=${encodeURIComponent(ids.join(','))}`);
      if (r.ok) return await r.json();
    } catch { /* fall through to local */ }
  }
  const l = readLocal(); const out = {};
  ids.forEach((id) => { out[id] = l[id] || { v: 0, c: 0 }; });
  return out;
}

export function hit(id, type) {
  if (!id) return;
  if (type === 'view') { // one view per item per browser session
    try { const k = 'atomattr-viewed'; const s = new Set(JSON.parse(sessionStorage.getItem(k) || '[]')); if (s.has(id)) return; s.add(id); sessionStorage.setItem(k, JSON.stringify([...s])); } catch { /* ignore */ }
  }
  if (URL_) {
    try { fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type }), keepalive: true }); } catch { /* ignore */ }
  } else {
    const l = readLocal(); const o = l[id] || { v: 0, c: 0 }; o[type === 'copy' ? 'c' : 'v']++; l[id] = o; writeLocal(l);
  }
}

/* Fill every [data-views="id"] and [data-copies="id"] inside root. */
export async function fillCounts(root = document) {
  const els = [...root.querySelectorAll('[data-views],[data-copies]')];
  const counts = await getCounts(els.map((e) => e.dataset.views || e.dataset.copies));
  els.forEach((e) => { const id = e.dataset.views || e.dataset.copies; const c = counts[id] || { v: 0, c: 0 }; e.textContent = fmt(e.dataset.views ? c.v : c.c); });
}
