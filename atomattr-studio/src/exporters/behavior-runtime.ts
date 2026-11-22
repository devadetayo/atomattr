import { ANIM_CSS, ANIM_JS, customKeyframes } from '../document/animations';
import type { Node } from '../document/types';
import { uiCss } from '../document/ui-css';
/** The runtime that makes `data-ast-*` attributes (see document/behavior.ts) work. Plain ES5, no dependencies, ~2 KB. */
export const BEHAVIOR_CSS = `[data-ast-panel][data-ast-state="closed"]:not([data-ast-mobile]){display:none!important}
@media (max-width:767px){[data-ast-panel][data-ast-mobile][data-ast-state="closed"]{display:none!important}}
@media (min-width:768px){[data-ast-mobile-only]{display:none!important}}
[data-ast-tab][aria-selected="true"]{box-shadow:inset 0 -2px 0 currentColor}
${ANIM_CSS}`;

/** Behavior CSS plus the keyframes of any custom animations used by these page roots. */
export const behaviorCss = (roots: Node[]) => [BEHAVIOR_CSS, customKeyframes(roots), uiCss(roots)].filter(Boolean).join('\n');

export const BEHAVIOR_JS = `(function () {
  if (window.__astBehavior) return;
  window.__astBehavior = true;
  var scopeOf = function (el) { return el.closest('[data-ast-scope]') || document; };
  var panelsFor = function (el, key) { return Array.prototype.slice.call(scopeOf(el).querySelectorAll('[data-ast-panel="' + key + '"]')); };
  var isOpen = function (p) { return p.getAttribute('data-ast-state') === 'open'; };
  function sync(p) {
    var key = p.getAttribute('data-ast-panel');
    Array.prototype.forEach.call(scopeOf(p).querySelectorAll('[data-ast-toggle="' + key + '"]'), function (t) { t.setAttribute('aria-expanded', String(isOpen(p))); });
  }
  function setOpen(p, open) { p.setAttribute('data-ast-state', open ? 'open' : 'closed'); sync(p); }
  function selectTab(tab) {
    var group = tab.getAttribute('data-ast-group'), key = tab.getAttribute('data-ast-tab'), scope = scopeOf(tab);
    Array.prototype.forEach.call(scope.querySelectorAll('[data-ast-panel][data-ast-group="' + group + '"]'), function (p) { setOpen(p, p.getAttribute('data-ast-panel') === key); });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-ast-tab][data-ast-group="' + group + '"]'), function (t) { t.setAttribute('aria-selected', String(t === tab)); });
  }
  document.addEventListener('click', function (e) {
    var act = e.target.closest ? e.target.closest('[data-ast-scroll],[data-ast-theme],[data-ast-copy],[data-ast-click]') : null;
    if (act) {
      if (act.hasAttribute('data-ast-scroll')) { var to = document.getElementById(act.getAttribute('data-ast-scroll')); if (to) { to.scrollIntoView({ behavior: 'smooth', block: 'start' }); e.preventDefault(); } }
      else if (act.hasAttribute('data-ast-theme')) { document.documentElement.classList.toggle('dark'); e.preventDefault(); }
      else if (act.hasAttribute('data-ast-copy')) { var txt = act.getAttribute('data-ast-copy'); if (navigator.clipboard) navigator.clipboard.writeText(txt); act.setAttribute('data-ast-copied', ''); setTimeout(function () { act.removeAttribute('data-ast-copied'); }, 1500); e.preventDefault(); }
      var ca = act.getAttribute('data-ast-click');
      if (ca) { act.style.animation = 'none'; void act.offsetWidth; act.style.animation = ca; }
    }
    var touched = [];
    var t = e.target.closest ? e.target.closest('[data-ast-toggle],[data-ast-open],[data-ast-close],[data-ast-tab]') : null;
    if (t) {
      if (t.hasAttribute('data-ast-tab')) { selectTab(t); e.preventDefault(); return; }
      var key = t.getAttribute('data-ast-toggle') || t.getAttribute('data-ast-open') || t.getAttribute('data-ast-close');
      var list = key ? panelsFor(t, key) : [t.closest('[data-ast-panel]')].filter(Boolean);
      list.forEach(function (p) { setOpen(p, t.hasAttribute('data-ast-toggle') ? !isOpen(p) : t.hasAttribute('data-ast-open')); touched.push(p); });
      e.preventDefault();
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-ast-panel][data-ast-state="open"]'), function (p) {
      if (touched.indexOf(p) > -1) return;
      if (p.hasAttribute('data-ast-modal') && e.target === p) setOpen(p, false);
      else if (p.hasAttribute('data-ast-dismiss') && !p.contains(e.target)) setOpen(p, false);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-ast-panel][data-ast-state="open"][data-ast-dismiss],[data-ast-panel][data-ast-state="open"][data-ast-modal]'), function (p) { setOpen(p, false); });
  });
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ast-tab]'), function (t) {
      var open = panelsFor(t, t.getAttribute('data-ast-tab'))[0];
      t.setAttribute('aria-selected', String(!!open && isOpen(open)));
    });
  }
  init();
  document.addEventListener('DOMContentLoaded', init);
  // Frameworks render after this script runs, so mark tabs again whenever content is added (only attributes change, so this cannot loop).
  if (window.MutationObserver) new MutationObserver(init).observe(document.documentElement, { childList: true, subtree: true });
})();
${ANIM_JS}`;
