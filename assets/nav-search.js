/* Navbar search: injects a search box into [data-site-nav], works with any nav markup.
   Desktop: inline input + dropdown. Mobile: icon that opens a full-screen search. Shortcuts: Ctrl/Cmd+K or "/". */
(function () {
  var base = (function () { var s = document.currentScript; return s ? s.src.replace(/assets\/nav-search\.js.*$/, '') : ''; })();
  var CSS = '.ns{position:relative;display:flex;align-items:center;font-family:inherit;--ns-bg:#f3f4f6;--ns-pn:#fff;--ns-bd:transparent;--ns-fg:#0f172a;--ns-mut:#64748b;--ns-hov:rgba(91,92,246,.1);--ns-acc:#5b5cf6}' +
    'html.dark .ns{--ns-bg:#111827;--ns-pn:#0b0f17;--ns-bd:transparent;--ns-fg:#f1f5f9;--ns-mut:#94a3b8;--ns-hov:rgba(129,140,248,.16);--ns-acc:#a5b4fc}' +
    '.ns-box{display:flex;align-items:center;gap:.5rem;height:2.25rem;width:15rem;padding:0 .6rem 0 .75rem;border-radius:6px;background:var(--ns-bg);color:var(--ns-mut);transition:width .2s,border-color .2s,box-shadow .2s}' +
    '.ns-box:focus-within{width:19rem;box-shadow:0 0 0 2px var(--ns-acc)}' +
    '.ns-in{all:unset;flex:1;min-width:0;font-size:.875rem;color:var(--ns-fg)}.ns-in::placeholder{color:var(--ns-mut)}' +
    '.ns-key{font:600 .7rem/1 inherit;background:var(--ns-hov);border-radius:4px;padding:.2rem .4rem;color:var(--ns-mut)}' +
    '.ns-ico{width:1rem;height:1rem;flex:none}.ns-btn{all:unset;display:none;cursor:pointer;width:2.25rem;height:2.25rem;border-radius:6px;align-items:center;justify-content:center;color:var(--ns-fg);background:var(--ns-bg);box-sizing:border-box}' +
    '.ns-close{all:unset;display:none;cursor:pointer;width:2rem;height:2rem;align-items:center;justify-content:center;color:var(--ns-mut);border-radius:6px}' +
    '.ns-panel{position:absolute;top:calc(100% + .5rem);right:0;width:min(28rem,92vw);max-height:min(26rem,70vh);overflow:auto;background:var(--ns-pn);color:var(--ns-fg);border-radius:8px;box-shadow:0 24px 48px -16px rgba(2,6,23,.35);padding:.4rem;display:none;z-index:1000}' +
    '.ns.open .ns-panel{display:block}.ns-h{font:700 .68rem/1 inherit;letter-spacing:.08em;text-transform:uppercase;color:var(--ns-mut);padding:.7rem .7rem .3rem}' +
    '.ns-r{display:flex;flex-direction:column;gap:.1rem;padding:.5rem .7rem;border-radius:6px;text-decoration:none;color:inherit;cursor:pointer}.ns-r b{font-size:.875rem;font-weight:600}.ns-r span{font-size:.78rem;color:var(--ns-mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ns-r[aria-selected=true],.ns-r:hover{background:var(--ns-hov)}.ns-r mark{background:none;color:var(--ns-acc);font-weight:800}.ns-e{padding:1.2rem;text-align:center;color:var(--ns-mut);font-size:.875rem}' +
    '@media(max-width:767px){.ns-box{display:none}.ns-btn{display:flex}.ns.open{position:fixed;inset:0;z-index:2000;background:var(--ns-pn);align-items:flex-start;padding:.75rem;flex-wrap:wrap;gap:.5rem}' +
    '.ns.open .ns-btn{display:none}.ns.open .ns-box{display:flex;flex:1;width:auto;height:2.75rem}.ns.open .ns-box:focus-within{width:auto}.ns.open .ns-close{display:flex}' +
    '.ns.open .ns-panel{position:static;display:block;width:100%;max-height:none;flex-basis:100%;border:0;box-shadow:none;padding:0;overflow:visible}.ns-key{display:none}}';
  var ICON = '<svg class="ns-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  var data = null, loading = null, sel = -1, shown = [], root, input, panel;
  function load() { if (data) return Promise.resolve(); if (!loading) loading = fetch(base + 'assets/search-index.json').then(function (r) { return r.json(); }).then(function (d) { data = d; }).catch(function () { data = []; }); return loading; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mark(t, q) { var i = t.toLowerCase().indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); }
  var ORDER = ['Docs', 'Components', 'Attribute', 'Blog', 'Pages'];
  function score(e, q) { var t = e.t.toLowerCase(), d = (e.d || '').toLowerCase(); if (t === q) return 100; if (t.indexOf(q) === 0) return 80; if (t.indexOf(q) > -1) return 60; var words = q.split(/\s+/); if (words.every(function (w) { return (t + ' ' + d).indexOf(w) > -1; })) return 30; return 0; }
  function search(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    var out = []; data.forEach(function (e) { var s = score(e, q); if (s) out.push({ e: e, s: s + (e.k === 'Docs' ? 5 : 0) }); });
    out.sort(function (a, b) { return b.s - a.s; }); var per = {}; var res = [];
    out.forEach(function (o) { per[o.e.k] = (per[o.e.k] || 0) + 1; if (per[o.e.k] <= 5) res.push(o.e); });
    res.sort(function (a, b) { return ORDER.indexOf(a.k) - ORDER.indexOf(b.k); }); return res;
  }
  function render() {
    var q = input.value.trim().toLowerCase();
    if (!q) { panel.innerHTML = '<div class="ns-e">Search docs, attributes, components and the blog</div>'; shown = []; return; }
    shown = search(q); sel = shown.length ? 0 : -1;
    if (!shown.length) { panel.innerHTML = '<div class="ns-e">No results for “' + esc(input.value) + '”</div>'; return; }
    var h = '', last = ''; shown.forEach(function (e, i) { if (e.k !== last) { h += '<div class="ns-h">' + (e.k === 'Attribute' ? 'Attributes' : e.k) + '</div>'; last = e.k; }
      h += '<a class="ns-r" role="option" href="' + base + e.u + '" data-i="' + i + '" aria-selected="' + (i === 0) + '"><b>' + mark(e.t, q) + '</b><span>' + esc(e.d || '') + '</span></a>'; });
    panel.innerHTML = h;
  }
  function move(d) { if (!shown.length) return; sel = (sel + d + shown.length) % shown.length; panel.querySelectorAll('.ns-r').forEach(function (a, i) { a.setAttribute('aria-selected', i === sel); if (i === sel) a.scrollIntoView({ block: 'nearest' }); }); }
  var ph = null;
  function lift() { if (window.innerWidth < 768 && root.parentNode !== document.body) { ph = document.createComment('ns'); root.parentNode.insertBefore(ph, root); document.body.appendChild(root); } }
  function drop() { if (ph && ph.parentNode) { ph.parentNode.insertBefore(root, ph); ph.parentNode.removeChild(ph); } ph = null; }
  function open() { root.classList.add('open'); lift(); load().then(render); }
  function close() { root.classList.remove('open'); input.blur(); drop(); }
  function build() {
    root = document.createElement('div'); root.className = 'ns'; root.setAttribute('data-ns', '');
    root.innerHTML = '<button type="button" class="ns-btn" aria-label="Search">' + ICON + '</button><div class="ns-box" role="search">' + ICON + '<input class="ns-in" type="text" placeholder="Search" aria-label="Search the site" autocomplete="off" spellcheck="false"><span class="ns-key">Ctrl K</span></div><button type="button" class="ns-close" aria-label="Close search">✕</button><div class="ns-panel" role="listbox"></div>';
    input = root.querySelector('.ns-in'); panel = root.querySelector('.ns-panel');
    root.querySelector('.ns-btn').addEventListener('click', function () { open(); setTimeout(function () { input.focus(); }, 30); });
    root.querySelector('.ns-close').addEventListener('click', close);
    input.addEventListener('focus', function () { if (window.innerWidth >= 768) open(); }); input.addEventListener('input', function () { root.classList.add('open'); load().then(render); });
    input.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); } else if (e.key === 'Enter') { var a = panel.querySelector('.ns-r[aria-selected=true]'); if (a) location.href = a.href; } else if (e.key === 'Escape') close(); });
    panel.addEventListener('mousemove', function (e) { var a = e.target.closest('.ns-r'); if (a) { sel = +a.dataset.i; panel.querySelectorAll('.ns-r').forEach(function (x, i) { x.setAttribute('aria-selected', i === sel); }); } });
    document.addEventListener('mousedown', function (e) { if (!root.contains(e.target) && window.innerWidth >= 768) root.classList.remove('open'); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 768 && root.classList.contains('open')) { drop(); } });
    document.addEventListener('keydown', function (e) { var typing = /input|textarea|select/i.test((e.target.tagName || '')) || e.target.isContentEditable;
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) { e.preventDefault(); if (window.innerWidth < 768) { open(); setTimeout(function () { input.focus(); }, 30); } else input.focus(); } });
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform); if (isMac) root.querySelector('.ns-key').textContent = '⌘K';
  }
  function place() {
    var nav = document.querySelector('[data-site-nav]'); if (!nav) return false;
    if (document.querySelector('[data-ns]') && (root.parentNode === document.body || nav.contains(root))) return true;
    if (!root) build();
    // Put the search in the same group as the theme toggle and the GitHub / Discord buttons.
    var sel = '[data-theme-toggle],[data-color-toggle],button[aria-label="Toggle color theme"],a[href*="github.com"],a[href*="discord."],a[href*="discord.gg"]';
    var els = Array.prototype.slice.call(nav.querySelectorAll(sel)).filter(function (e) { return !e.closest('#main-nav, [data-ns-skip]'); });
    var first = els[0], host;
    if (first) {
      host = first.parentNode;
      // climb until the host contains every one of those buttons
      while (host !== nav && !els.every(function (e) { return host.contains(e); })) host = host.parentNode;
      var ref = first; while (ref.parentNode !== host) ref = ref.parentNode;
      host.insertBefore(root, ref);
    } else { host = nav.firstElementChild || nav; host.appendChild(root); }
    if (!document.getElementById('ns-css')) { var st = document.createElement('style'); st.id = 'ns-css'; st.textContent = CSS; document.head.appendChild(st); }
    return true;
  }
  function start() {
    place(); var nav = document.querySelector('[data-site-nav]');
    new MutationObserver(function () { if (!root || !(root.parentNode === document.body || nav.contains(root))) place(); }).observe(nav || document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // cheatsheet deep link: ?q=
})();
