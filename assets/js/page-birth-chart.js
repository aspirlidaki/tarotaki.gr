(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var A = window.Astro, E = window.Ephemeris, Auth = window.Auth, Natal = window.Natal;
  var NAMES = { sun: 'Ήλιος', moon: 'Σελήνη', mercury: 'Ερμής', venus: 'Αφροδίτη', mars: 'Άρης', jupiter: 'Δίας', saturn: 'Κρόνος' };
  var ASPECTS = { conjunction: 'σύνοδος', sextile: 'εξάγωνο', square: 'τετράγωνο', trine: 'τρίγωνο', opposition: 'αντίθεση' };
  var INSIGHTS = {
    conjunction: 'Δύο βασικές πλευρές σου λειτουργούν σαν μία δυνατή εστίαση.',
    sextile: 'Υπάρχει ένα φυσικό σημείο συνεργασίας που αξιοποιείται όταν το επιλέγεις συνειδητά.',
    square: 'Η ένταση εδώ γίνεται κίνηση: σε σπρώχνει να βρεις τον δικό σου τρόπο.',
    trine: 'Αυτό το στοιχείο ρέει αβίαστα και είναι ένα από τα πιο φυσικά σου στηρίγματα.',
    opposition: 'Βλέπεις καθαρά και τις δύο πλευρές μιας κατάστασης· η ισορροπία είναι το κλειδί.'
  };

  function signName(position) {
    var sign = A.signById(position.sign);
    return sign ? sign.el.name : '—';
  }

  function savedOnboardingProfile() {
    try { return JSON.parse(localStorage.getItem('tarotaki.birthProfile') || 'null'); }
    catch (error) { return null; }
  }

  function setupProfile() {
    Auth.init();
    var user = Auth.current(), profile = user || savedOnboardingProfile();
    if (!profile) return;
    $('#chartDate').value = profile.birthDate || '';
    $('#chartTime').value = profile.birthTime || '';
    $('#chartPlace').value = profile.birthPlace || '';
    $('#rememberBirthData').checked = !!user;
  }

  function makeFinding(aspect, index) {
    var title = NAMES[aspect.a] + ' σε ' + ASPECTS[aspect.key] + ' με ' + NAMES[aspect.b];
    return '<article class="finding"><span class="finding-number">0' + (index + 1) + '</span><h3>' + title + '</h3><p>' + INSIGHTS[aspect.key] + '</p><small>Απόκλιση ' + aspect.orb.toFixed(1).replace('.', ',') + '°</small></article>';
  }

  function renderReport(pos) {
    var result = $('#fullReportDetails');
    result.innerHTML = '<h2>Οι προσωπικές σου θέσεις</h2><div class="planet-list">' + E.PERSONAL.map(function (body) {
      return '<div><span>' + NAMES[body] + '</span><b>' + signName(pos[body]) + '</b><small>' + pos[body].degree.toFixed(1).replace('.', ',') + '°</small></div>';
    }).join('') + '</div>';
    result.hidden = false;
  }

  function calculate(event, suppressFocus) {
    event.preventDefault();
    var date = $('#chartDate').value, enteredTime = $('#chartTime').value, time = enteredTime || '12:00', place = $('#chartPlace').value.trim();
    $('#chartError').textContent = '';
    if (!date) { $('#chartError').textContent = 'Βάλε την ημερομηνία γέννησής σου για να συνεχίσεις.'; return; }
    var birth = new Date(date + 'T' + time + ':00');
    if (isNaN(birth.getTime()) || birth > new Date()) { $('#chartError').textContent = 'Έλεγξε την ημερομηνία γέννησης.'; return; }

    var persisted = Auth.current() || savedOnboardingProfile() || {};
    var keepCoordinates = persisted.birthPlace === place;
    var profile = {
      birthDate: date,
      birthTime: enteredTime,
      birthPlace: place,
      birthLatitude: keepCoordinates ? persisted.birthLatitude : null,
      birthLongitude: keepCoordinates ? persisted.birthLongitude : null,
      birthTimezone: keepCoordinates ? persisted.birthTimezone : ''
    };
    var natal = Natal.compute(profile);
    var pos = E.positions(natal.when || birth, E.PERSONAL);
    var aspects = E.aspects(pos, E.PERSONAL).slice(0, 3);
    if (aspects.length < 3) {
      E.PERSONAL.slice(0, 3 - aspects.length).forEach(function (body) {
        aspects.push({ a: body, b: 'sun', key: 'conjunction', orb: 0 });
      });
    }
    $('#chartSummary').textContent = 'Ο Ήλιος σου είναι στον ' + signName(pos.sun) + '.';
    $('#chartMeta').textContent = (enteredTime ? 'Ώρα: ' + time + '.' : 'Χωρίς ώρα γέννησης: η ανάγνωση είναι ενδεικτική.') +
      (place ? ' Τόπος: ' + place + '.' : '') +
      (natal.place && natal.place.timezone ? ' Ζώνη ώρας: ' + natal.place.timezone + '.' : '');
    $('#chartBasics').innerHTML = ['sun', 'moon', 'venus'].map(function (body) {
      return '<div><span>' + NAMES[body] + '</span><b>' + signName(pos[body]) + '</b></div>';
    }).join('');
    $('#findings').innerHTML = aspects.map(makeFinding).join('');
    $('#chartResult').hidden = false;
    $('#fullReportDetails').hidden = true;

    if ($('#rememberBirthData').checked && Auth.current()) {
      Auth.updateProfile(profile, function () {});
    }
    if (!suppressFocus) $('#chartResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#fullReportButton').onclick = function () {
      if (!Auth.isPremium()) { window.location.href = 'account.html'; return; }
      renderReport(pos);
      $('#fullReportDetails').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  }

  /* ---------------------------------------------------------------------
     Mobile-first birth chart flow
     --------------------------------------------------------------------- */

  var flow = { step: 0, date: '', time: '', place: '', timeKnown: true };

  function flowRoot() { return $('#chartFlowContent'); }
  function flowHeader(back) {
    return '<div class="chart-flow__top">' + (back ? '<button class="chart-flow-back" type="button" data-chart-back aria-label="Πίσω">←</button>' : '<span></span>') + '<span class="chart-flow-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>';
  }
  function flowWheel() {
    return '<div class="chart-flow-wheel" aria-hidden="true"><span>♈</span><span>♉</span><span>♊</span><span>♋</span><span>♌</span><span>♍</span><span>♎</span><span>♏</span><span>♐</span><span>♑</span><span>♒</span><span>♓</span></div>';
  }
  function flowError(text) { $('#chartFlowError').textContent = text; }

  function renderFlow() {
    var host = flowRoot();
    if (flow.step === 0) {
      host.innerHTML = flowHeader(false) + '<section class="chart-flow-intro">' + flowWheel() + '<p class="chart-flow-kicker">✦</p><h1 id="chartFlowTitle">Υπολόγισε τον<br>γενέθλιο χάρτη σου</h1><p>Κάθε πλανήτης έχει ένα μήνυμα για εσένα. Ανακάλυψε το αστρολογικό σου αποτύπωμα.</p><button class="btn btn-primary chart-flow-primary" type="button" data-chart-next>Ξεκίνα</button></section>';
    } else if (flow.step === 1) {
      host.innerHTML = flowHeader(true) + '<section class="chart-flow-form">' + flowWheel() + '<h1 id="chartFlowTitle">Πότε γεννήθηκες;</h1><p>Η ημερομηνία και η ώρα χρησιμοποιούνται μόνο για τον γενέθλιο χάρτη σου.</p><label>Ημερομηνία γέννησης<input id="flowChartDate" class="field" type="date" required></label><label>Ώρα γέννησης <span>προαιρετικά</span><input id="flowChartTime" class="field" type="time" ' + (flow.timeKnown ? '' : 'disabled') + '></label><label class="chart-flow-check"><input id="flowChartUnknown" type="checkbox" ' + (flow.timeKnown ? '' : 'checked') + '> Δεν γνωρίζω την ώρα γέννησης</label><p class="chart-flow-note">Χωρίς ώρα δεν υπολογίζεται ο ωροσκόπος.</p><p class="chart-flow-error" id="chartFlowError" aria-live="polite"></p><button class="btn btn-primary chart-flow-primary" type="button" data-chart-date>Συνέχεια</button></section>';
      $('#flowChartDate').value = flow.date;
      $('#flowChartTime').value = flow.time;
      $('#flowChartUnknown').addEventListener('change', function () { flow.timeKnown = !this.checked; $('#flowChartTime').disabled = !flow.timeKnown; });
    } else if (flow.step === 2) {
      host.innerHTML = flowHeader(true) + '<section class="chart-flow-form chart-flow-place">' + flowWheel() + '<h1 id="chartFlowTitle">Πού γεννήθηκες;</h1><p>Η πόλη βοηθά να βρεθεί η σωστή ζώνη ώρας στον χάρτη σου.</p><label>Πόλη και χώρα<input id="flowChartPlace" class="field" type="text" autocomplete="address-level2" placeholder="π.χ. Ηράκλειο, Ελλάδα" required></label><p class="chart-flow-note">Τα στοιχεία χρησιμοποιούνται μόνο για τον υπολογισμό του χάρτη.</p><p class="chart-flow-error" id="chartFlowError" aria-live="polite"></p><button class="btn btn-primary chart-flow-primary" type="button" data-chart-place>Δες την προεπισκόπηση</button></section>';
      $('#flowChartPlace').value = flow.place;
    } else {
      renderFlowPreview(host);
    }
    var back = $('[data-chart-back]', host);
    if (back) back.addEventListener('click', function () { flow.step--; renderFlow(); });
    var next = $('[data-chart-next]', host);
    if (next) next.addEventListener('click', function () { flow.step = 1; renderFlow(); });
    var dateNext = $('[data-chart-date]', host);
    if (dateNext) dateNext.addEventListener('click', function () {
      var value = $('#flowChartDate').value;
      if (!value || new Date(value + 'T12:00:00') > new Date()) return flowError('Συμπλήρωσε μια έγκυρη ημερομηνία γέννησης.');
      flow.date = value; flow.time = flow.timeKnown ? $('#flowChartTime').value : ''; flow.step = 2; renderFlow();
    });
    var placeNext = $('[data-chart-place]', host);
    if (placeNext) placeNext.addEventListener('click', function () {
      var value = $('#flowChartPlace').value.trim();
      if (!value) return flowError('Συμπλήρωσε την πόλη γέννησης.');
      flow.place = value; showFlowPreview();
    });
  }

  function showFlowPreview() {
    $('#chartDate').value = flow.date;
    $('#chartTime').value = flow.time;
    $('#chartPlace').value = flow.place;
    calculate({ preventDefault: function () {} }, true);
    if ($('#chartError').textContent) return flowError($('#chartError').textContent);
    flow.step = 3;
    renderFlow();
  }

  function renderFlowPreview(host) {
    var basics = Array.prototype.slice.call($('#chartBasics').children).map(function (item) { return { label: item.querySelector('span').textContent, value: item.querySelector('b').textContent }; });
    host.innerHTML = flowHeader(true) + '<section class="chart-flow-preview">' + flowWheel() + '<p class="chart-flow-kicker">ΠΡΟΕΠΙΣΚΟΠΗΣΗ</p><h1 id="chartFlowTitle">Κάτι ξεχωριστό<br>φαίνεται στον χάρτη σου</h1><div class="chart-flow-basics">' + basics.map(function (item) { return '<div><span>' + item.label + '</span><strong>' + item.value + '</strong></div>'; }).join('') + '</div><div class="chart-flow-teasers"><div>♥ <span><b>Αφροδίτη και σχέσεις</b><small>Πώς αγαπάς και συνδέεσαι</small></span></div><div>✦ <span><b>Άρης και επιθυμίες</b><small>Τι σε κινεί να προχωράς</small></span></div><div>☾ <span><b>Σελήνη και συναίσθημα</b><small>Πού νιώθεις ασφάλεια</small></span></div></div><p>Ετοιμάσου να γνωρίσεις καλύτερα τον εαυτό σου.</p><a class="btn btn-primary chart-flow-primary" href="account.html#premiumPlansTitle">Δες το πλήρες report →</a></section>';
  }

  function init() {
    $('#year').textContent = String(new Date().getFullYear());
    setupProfile();
    $('#birthChartForm').addEventListener('submit', calculate);
    var saved = savedOnboardingProfile() || Auth.current() || {};
    flow.date = saved.birthDate || '';
    flow.time = saved.birthTime || '';
    flow.place = saved.birthPlace || '';
    document.body.classList.add('chart-flow-open');
    renderFlow();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
