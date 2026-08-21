/* ===========================================================================
   Small, progressive visual enhancements shared by every page.
   =========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var selector = [
    'main > section', '.section-head', '.feature', '.sign-card', '.unlock-card',
    '.review', '.intro-card', '.spread-card', '.cat-card', '.auth-box', '.lock-panel'
  ].join(', ');

  function revealNow(items) {
    items.forEach(function (item) { item.classList.add('is-visible'); });
  }

  function init() {
    var items = Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (item) {
      return !item.closest('[hidden]');
    });
    if (!items.length) return;

    items.forEach(function (item) { item.setAttribute('data-reveal', ''); });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealNow(items);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px' });

    items.forEach(function (item) { observer.observe(item); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
