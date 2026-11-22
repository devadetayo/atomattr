/* Scroll-reveal: adds .is-in to [data-reveal] elements as they enter the viewport.
   window.__aaReveal(root) lets late-rendered content (galleries) join in. */
(function () {
  document.documentElement.classList.add('aa-js');
  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.1 });
  function reveal(root) {
    (root || document).querySelectorAll('[data-reveal]:not(.is-in)').forEach(function (e, i) {
      if (!io) { e.classList.add('is-in'); return; }
      if (!e.style.getPropertyValue('--d') && e.hasAttribute('group')) e.style.setProperty('--d', (i % 6) * 60 + 'ms');
      io.observe(e);
    });
  }
  window.__aaReveal = reveal;
  reveal(document);
})();
