/* ==========================================================================
   Ταρωτάκι — page-horoscope.js
   Η σελίδα ενός ζωδίου: περίοδοι, κατηγορίες, πραγματικά δεδομένα ουρανού.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var A = window.Astro;
  var T = window.I18n;
  var E = window.Ephemeris;
  var H = window.Horoscope;

  var LOCALES = { el: 'el-GR', en: 'en-GB' };
  function locale() { return LOCALES[T.lang] || 'el-GR'; }
  function L() { return T.lang === 'en' ? 'en' : 'el'; }

  var FREE_PERIODS = ['today', 'tomorrow', 'weekly'];

  var PERIODS = ['today', 'tomorrow', 'weekly', 'monthly', 'yearly'];
  var CATEGORIES = ['general', 'love', 'career', 'luck'];

  var state = { sign: null, period: 'today', category: 'general', readingExpanded: false };

  /* Ονόματα ζωδίων στις πτώσεις που χρειάζεται το κείμενο */
  function buildNames() {
    var out = {};
    A.ZODIAC.forEach(function (s) {
      out[s.id] = L() === 'en'
        ? { nom: s.en.name, acc: s.en.name, loc: s.en.name }
        : { nom: s.el.name, acc: s.el.acc, loc: 'σ' + s.el.acc };
    });
    return out;
  }

  function isLocked(period) {
    if (window.Auth && window.Auth.isPremium && window.Auth.isPremium()) return false;
    return FREE_PERIODS.indexOf(period) === -1;
  }

  /* ---------------------------------------------------------------------
     Κεφαλίδα σελίδας
     --------------------------------------------------------------------- */

  function renderHeader() {
    var sign = A.signById(state.sign);
    $('#signGlyph').innerHTML = '<img class="zodiac-icon zodiac-icon--hero" src="' + sign.icon + '" alt="">';
    $('#signName').textContent = sign[L()].name;
    $('#signRange').textContent = sign[L()].range;
    document.title = sign[L()].name + ' — ' + T.t('nav.horoscope') + ' | Ταρωτάκι';
    var homeTab = document.querySelector('.app-bottom-nav .app-tab');
    if (homeTab) homeTab.href = 'horoscope.html?sign=' + state.sign;
  }

  function renderTabs() {
    var pt = $('#periodTabs');
    pt.innerHTML = '';
    PERIODS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn';
      b.setAttribute('aria-pressed', String(p === state.period));
      b.textContent = T.t('hp.' + p);
      if (isLocked(p)) {
        b.appendChild(lockIcon());
        b.classList.add('is-locked');
      }
      b.addEventListener('click', function () { state.period = p; render(); });
      pt.appendChild(b);
    });

    var ct = $('#categoryTabs');
    ct.innerHTML = '';
    CATEGORIES.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cat-btn';
      b.setAttribute('aria-pressed', String(c === state.category));
      b.textContent = T.t('hp.' + c);
      b.addEventListener('click', function () { state.category = c; render(); });
      ct.appendChild(b);
    });
  }

  function lockIcon() {
    var s = document.createElement('span');
    s.className = 'lock';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = '';
    return s;
  }

  /* ---------------------------------------------------------------------
     Το κύριο κείμενο
     --------------------------------------------------------------------- */

  function render() {
    renderHeader();
    renderTabs();

    var names = buildNames();
    var today = new Date();
    var locked = isLocked(state.period);

    // Ημερομηνία της επιλεγμένης περιόδου
    var shown = new Date(today.getTime());
    if (state.period === 'tomorrow') shown = new Date(today.getTime() + 86400000);
    $('#readingDate').textContent = new Intl.DateTimeFormat(locale(), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(shown);

    var body = $('#readingBody');
    var lock = $('#lockPanel');
    state.readingExpanded = false;
    $('#readingMore').setAttribute('aria-expanded', 'false');
    $('#readingMore').innerHTML = 'Διάβασε περισσότερα <span aria-hidden="true">⌄</span>';
    $('#readingText').classList.remove('is-expanded');

    if (locked) {
      body.hidden = true;
      lock.hidden = false;
      renderScores(null);
      renderSky(today, names);
      return;
    }

    lock.hidden = true;
    body.hidden = false;

    var reading = H.daily(state.sign, shown, L());
    var text;

    if (state.period === 'today' || state.period === 'tomorrow') {
      text = state.category === 'general'
        ? H.generalText(reading, L(), names)
        : H.categoryText(reading, state.category, L(), names);
    } else {
      var p = H.period(state.sign, state.period, today, L(), names, state.category);
      text = p.text;
      reading = p.reading;
    }

    $('#readingTitle').textContent = T.t('hp.' + state.category);
    $('#readingText').textContent = text;

    renderFacts(reading, names);
    renderScores(reading);
    renderSky(today, names);
  }

  /* Τα «γιατί» πίσω από την πρόβλεψη */
  function renderFacts(reading, names) {
    var facts = $('#readingFacts');
    facts.innerHTML = '';

    var rows = [
      [T.t('hp.moonIn'), names[reading.moon.sign].nom + '  ' +
        reading.moon.degree.toFixed(1) + '°'],
      [T.t('hp.house'), String(reading.house)],
      [T.t('hp.ruler'), H.BODY[reading.ruler].glyph + '  ' +
        H.BODY[reading.ruler][L()].name.replace(/^(ο|η) /, '')]
    ];

    rows.forEach(function (r) {
      var d = document.createElement('div');
      d.className = 'fact';
      d.innerHTML = '<dt></dt><dd></dd>';
      $('dt', d).textContent = r[0];
      $('dd', d).textContent = r[1];
      facts.appendChild(d);
    });
  }

  function renderScores(reading) {
    var host = $('#scoreList');
    host.innerHTML = '';
    if (!reading) { $('#scoresBlock').hidden = true; return; }
    $('#scoresBlock').hidden = false;

    [['forecast.love', reading.scores.love],
     ['forecast.work', reading.scores.work],
     ['forecast.money', reading.scores.money],
     ['forecast.mood', reading.scores.mood]].forEach(function (row) {
      var el = document.createElement('div');
      el.className = 'bar-row';
      el.innerHTML =
        '<span></span><span class="bar"><i></i></span><span class="val"></span>';
      $('span', el).textContent = T.t(row[0]);
      $('.bar i', el).style.width = row[1] + '%';
      $('.val', el).textContent = row[1];
      host.appendChild(el);
    });
  }

  /* Ο πραγματικός ουρανός — η απόδειξη ότι δεν είναι τυχαία κείμενα */
  function renderSky(date, names) {
    var pos = E.positions(date, E.PERSONAL);

    var tbody = $('#skyRows');
    tbody.innerHTML = '';
    E.PERSONAL.forEach(function (b) {
      var p = pos[b];
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="g"></td><td class="n"></td><td class="s"></td><td class="d"></td>';
      $('.g', tr).textContent = H.BODY[b].glyph;
      $('.n', tr).textContent = H.BODY[b][L()].name.replace(/^(ο|η|the) /, '');
      $('.s', tr).textContent = names[p.sign].nom;
      $('.d', tr).textContent = p.degree.toFixed(1) + '°' +
        (p.retrograde ? '  ℞' : '');
      if (p.retrograde) tr.classList.add('is-retro');
      tbody.appendChild(tr);
    });

    var list = $('#aspectList');
    list.innerHTML = '';
    var asp = E.aspects(pos, E.PERSONAL).slice(0, 6);
    if (!asp.length) {
      var li = document.createElement('li');
      li.textContent = T.t('hp.noAspects');
      list.appendChild(li);
      return;
    }
    asp.forEach(function (a) {
      var li = document.createElement('li');
      li.className = 'aspect ' + a.harmony;
      li.innerHTML = '<span class="pair"></span><span class="kind"></span><span class="orb"></span>';
      $('.pair', li).textContent =
        H.BODY[a.a].glyph + ' ' + H.BODY[a.b].glyph;
      $('.kind', li).textContent = H.ASPECT[a.key][L()].replace(/^σε /, '').replace(/ με$/, '');
      $('.orb', li).textContent = a.orb.toFixed(1) + '°';
      list.appendChild(li);
    });
  }

  /* Τα υπόλοιπα ζώδια */
  function renderOthers() {
    var host = $('#otherSigns');
    host.innerHTML = '';
    A.ZODIAC.forEach(function (s) {
      if (s.id === state.sign) return;
      var a = document.createElement('a');
      a.className = 'mini-sign';
      a.href = 'horoscope.html?sign=' + s.id;
      a.innerHTML = '<span class="g" aria-hidden="true"></span><span class="n"></span>';
      $('.g', a).innerHTML = '<img class="zodiac-icon zodiac-icon--mini" src="' + s.icon + '" alt="">';
      $('.n', a).textContent = s[L()].name;
      host.appendChild(a);
    });
  }

  /* ---------------------------------------------------------------------
     Μοίρασμα
     Χρησιμοποιεί το native share όπου υπάρχει (κινητά), αλλιώς αντιγράφει
     τον σύνδεσμο στο πρόχειρο.
     --------------------------------------------------------------------- */

  function shareReading() {
    var sign = A.signById(state.sign);
    var title = sign[L()].name + ' — ' + T.t('nav.horoscope');
    var text = $('#readingText').textContent || '';
    var url = window.location.href;

    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () { /* άκυρο */ });
      return;
    }

    var done = function () {
      $('#shareStatus').textContent = T.t('hp.copied');
      window.setTimeout(function () { $('#shareStatus').textContent = ''; }, 2500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { /* άκυρο */ });
    } else {
      // Εφεδρεία για παλιότερους browsers
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* άκυρο */ }
      document.body.removeChild(ta);
    }
  }

  /* ---------------------------------------------------------------------
     Κεφαλίδα ιστοσελίδας (γλώσσα + συρτάρι)
     --------------------------------------------------------------------- */

  function wireChrome() {
    var menu = $('#langMenu'), btn = $('#langBtn');

    function closeLang() {
      menu.setAttribute('data-open', 'false');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.getAttribute('data-open') === 'true';
      menu.setAttribute('data-open', String(!open));
      btn.setAttribute('aria-expanded', String(!open));
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.lang')) closeLang();
    });

    $('#navToggle').addEventListener('click', function () {
      var open = $('#drawer').getAttribute('data-open') !== 'true';
      $('#drawer').setAttribute('data-open', String(open));
      $('#navToggle').setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    $$('#drawer a').forEach(function (a) {
      a.addEventListener('click', function () {
        $('#drawer').setAttribute('data-open', 'false');
        $('#navToggle').setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLang();
    });
  }

  function buildLangMenu() {
    var menu = $('#langMenu');
    menu.innerHTML = '';
    T.LANGS.forEach(function (lang) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(lang.code === T.lang));
      b.textContent = lang.label;
      b.addEventListener('click', function () {
        T.apply(lang.code);
        menu.setAttribute('data-open', 'false');
        $('#langBtn').setAttribute('aria-expanded', 'false');
      });
      menu.appendChild(b);
    });
    $('#langShort').textContent =
      (T.LANGS.filter(function (x) { return x.code === T.lang; })[0] || T.LANGS[0]).short;
  }

  /* ---------------------------------------------------------------------
     Εκκίνηση
     --------------------------------------------------------------------- */

  function readSignFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('sign');
    return A.signById(id) ? id : null;
  }

  function onLanguageChange() {
    buildLangMenu();
    renderOthers();
    render();
  }

  function init() {
    $('#year').textContent = String(new Date().getFullYear());

    state.sign = readSignFromUrl();
    if (!state.sign) {
      // Χωρίς έγκυρο ζώδιο στο URL γυρνάμε στη λίστα της αρχικής
      window.location.replace('index.html#horoscope');
      return;
    }

    wireChrome();
    $('#shareBtn').addEventListener('click', shareReading);
    $('#readingMore').addEventListener('click', function () {
      state.readingExpanded = !state.readingExpanded;
      $('#readingText').classList.toggle('is-expanded', state.readingExpanded);
      $('#readingMore').setAttribute('aria-expanded', String(state.readingExpanded));
      $('#readingMore').innerHTML = state.readingExpanded
        ? 'Λιγότερα <span aria-hidden="true">⌃</span>'
        : 'Διάβασε περισσότερα <span aria-hidden="true">⌄</span>';
    });

    // Ο listener ΠΡΙΝ το T.init() — αλλιώς χάνεται το πρώτο render.
    document.addEventListener('languagechange', onLanguageChange);
    T.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
