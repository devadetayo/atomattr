/* Theme toggle icon: always the Remix "contrast" icon (outline in light mode, filled in dark mode).
   The nav script can redraw the button whenever the theme changes, so this watches the button and puts the icon back. */
(function () {
  var SEL = 'button[aria-label="Toggle color theme"], [data-color-toggle], [data-theme-toggle]';
  var busy = false;
  function icon() {
    return document.documentElement.classList.contains('dark') ? 'ri-contrast-fill' : 'ri-contrast-line';
  }
  function apply() {
    if (busy) return;
    busy = true;
    document.querySelectorAll(SEL).forEach(function (b) {
      var want = '<i class="' + icon() + '" aria-hidden="true"></i>';
      if (b.innerHTML.trim() !== want) b.innerHTML = want;
    });
    busy = false;
  }
  function start() {
    apply();
    new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
