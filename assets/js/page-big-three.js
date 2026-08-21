(function () {
  'use strict';
  var $ = function (selector) { return document.querySelector(selector); };
  var A = window.Astro, N = window.Natal, Auth = window.Auth;
  var state = { step: 0, date: '', time: '', place: '', profile: null };

  function savedProfile() { try { return Auth.current() || JSON.parse(localStorage.getItem('tarotaki.birthProfile') || 'null') || {}; } catch (error) { return {}; } }
  function header(back) { return '<div class="chart-flow__top">' + (back ? '<button class="chart-flow-back" type="button" data-back aria-label="Πίσω">←</button>' : '<span></span>') + '<button class="chart-flow-close" type="button" data-close aria-label="Κλείσιμο">×</button></div>'; }
  function wheel() { return '<div class="chart-flow-wheel big-three-symbol" aria-hidden="true"><img src="assets/img/big-three-symbol.svg" alt=""></div>'; }
  function error(message) { $('#bigThreeError').textContent = message; }
  function signName(position) { var sign = position && A.signById(position.sign); return sign ? sign.el.name : '—'; }
  function glyph(position) { var sign = position && A.signById(position.sign); return sign ? sign.glyph : '—'; }

  function render() {
    var host = $('#bigThreeContent');
    if (state.step === 0) {
      host.innerHTML = header(false) + '<section class="chart-flow-intro big-three-intro">' + wheel() + '<p class="chart-flow-kicker">✦</p><h1 id="bigThreeTitle">Big Three<br>Analysis</h1><p>Ανακάλυψε Ήλιο, Σελήνη και Ωροσκόπο για να γνωρίσεις καλύτερα τον εαυτό σου.</p><button class="btn btn-primary chart-flow-primary" type="button" data-start>Ξεκίνα</button></section>';
    } else if (state.step === 1) {
      host.innerHTML = header(true) + '<section class="chart-flow-form big-three-form">' + wheel() + '<h1 id="bigThreeTitle">Τα στοιχεία γέννησης</h1><p>Χρησιμοποιούνται μόνο για να υπολογίσουμε το Big Three σου.</p><label>Ημερομηνία γέννησης<input class="field" id="bigDate" type="date" required></label><label>Ώρα γέννησης<input class="field" id="bigTime" type="time" required></label><label>Πόλη και χώρα<input class="field" id="bigPlace" type="text" autocomplete="address-level2" placeholder="π.χ. Ηράκλειο, Ελλάδα" required></label><p class="chart-flow-note">Χρειάζονται και τα τρία στοιχεία για ακριβή Ωροσκόπο.</p><p class="chart-flow-error" id="bigThreeError" aria-live="polite"></p><button class="btn btn-primary chart-flow-primary" type="button" data-calculate>Δες το Big Three</button></section>';
      $('#bigDate').value = state.date; $('#bigTime').value = state.time; $('#bigPlace').value = state.place;
    } else { renderResult(host); }
    var back = $('[data-back]'); if (back) back.addEventListener('click', function () { state.step--; render(); });
    var start = $('[data-start]'); if (start) start.addEventListener('click', function () { state.step = 1; render(); });
    var calculate = $('[data-calculate]'); if (calculate) calculate.addEventListener('click', buildResult);
    var close = $('[data-close]'); if (close) close.addEventListener('click', function () { window.location.href = 'index.html'; });
  }

  function buildResult() {
    state.date = $('#bigDate').value; state.time = $('#bigTime').value; state.place = $('#bigPlace').value.trim();
    if (!state.date || !state.time || !state.place) return error('Συμπλήρωσε ημερομηνία, ώρα και τόπο γέννησης.');
    var old = savedProfile(), samePlace = old.birthPlace === state.place;
    state.profile = { birthDate: state.date, birthTime: state.time, birthPlace: state.place, birthLatitude: samePlace ? old.birthLatitude : null, birthLongitude: samePlace ? old.birthLongitude : null, birthTimezone: samePlace ? old.birthTimezone : '' };
    var natal = N.compute(state.profile);
    if (!natal.ascendant) return error('Χρειάζεται αναγνωρίσιμη πόλη γέννησης για τον Ωροσκόπο. Δοκίμασε π.χ. «Αθήνα, Ελλάδα».');
    state.natal = natal; state.step = 2; render();
  }

  function renderResult(host) {
    var natal = state.natal;
    var items = [{ label: 'Ήλιος', value: signName(natal.sun), glyph: glyph(natal.sun), className: 'sun' }, { label: 'Σελήνη', value: signName(natal.moon), glyph: glyph(natal.moon), className: 'moon' }, { label: 'Ωροσκόπος', value: signName(natal.ascendant), glyph: glyph(natal.ascendant), className: 'rising' }];
    host.innerHTML = header(true) + '<section class="chart-flow-preview big-three-result"><h1 id="bigThreeTitle">Το Big Three σου</h1><div class="big-three-signs">' + items.map(function (item) { return '<div class="big-three-sign big-three-sign--' + item.className + '"><b>' + item.glyph + '</b><span>' + item.label + '</span><strong>' + item.value + '</strong></div>'; }).join('') + '</div><div class="chart-flow-teasers"><div>✦ <span><b>Καθαρή σκέψη, ζεστή καρδιά</b><small>Ο τρόπος που σε διαβάζουν οι άλλοι</small></span></div><div>🔥 <span><b>Σταθερότητα όταν κάτι μετράει</b><small>Η δύναμη που σε κρατά σε πορεία</small></span></div><div>🌊 <span><b>Φροντίδα με υγιή όρια</b><small>Η συναισθηματική σου πυξίδα</small></span></div></div><p>Η πλήρης αναφορά εξηγεί πώς συνδέονται μεταξύ τους.</p><a class="btn btn-primary chart-flow-primary" href="account.html#premiumPlansTitle">Δες το πλήρες report →</a></section>';
  }

  function init() { Auth.init(); var profile = savedProfile(); state.date = profile.birthDate || ''; state.time = profile.birthTime || ''; state.place = profile.birthPlace || ''; render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
