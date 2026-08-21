(function () {
  'use strict';
  var A = window.Astro;
  var T = window.I18n;
  var $ = function (selector) { return document.querySelector(selector); };
  function language() { return T.lang === 'en' ? 'en' : 'el'; }
  function buildSigns() {
    var grid = $('#signsGrid'); grid.innerHTML = '';
    A.ZODIAC.forEach(function (sign) {
      var card = document.createElement('a'); card.className = 'sign-card'; card.href = 'horoscope.html?sign=' + sign.id;
      card.innerHTML = '<span class="glyph" aria-hidden="true"><img class="zodiac-icon zodiac-icon--card" src="' + sign.icon + '" alt=""></span><span class="name"></span><span class="range"></span>';
      card.querySelector('.name').textContent = sign[language()].name; card.querySelector('.range').textContent = sign[language()].range; grid.appendChild(card);
    });
  }
  function wireMenu() {
    var button = $('#navToggle'), drawer = $('#drawer');
    button.addEventListener('click', function () { var open = drawer.getAttribute('data-open') !== 'true'; drawer.setAttribute('data-open', String(open)); button.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('is-locked', open); });
    drawer.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { drawer.setAttribute('data-open', 'false'); button.setAttribute('aria-expanded', 'false'); document.body.classList.remove('is-locked'); }); });
  }
  function init() { $('#year').textContent = String(new Date().getFullYear()); buildSigns(); wireMenu(); document.addEventListener('languagechange', buildSigns); T.init(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
