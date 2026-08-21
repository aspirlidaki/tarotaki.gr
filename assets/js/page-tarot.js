/* ==========================================================================
   Ταρωτάκι — page-tarot.js
   Ροή: επιλογή ρίψης -> ανακάτεμα -> διάλεξε 3 κάρτες -> ερμηνεία.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var T = window.I18n;
  var K = window.Tarot;

  var LOCALES = { el: 'el-GR', en: 'en-GB' };
  function locale() { return LOCALES[T.lang] || 'el-GR'; }
  function L() { return T.lang === 'en' ? 'en' : 'el'; }

  /* Η συνδρομή διαβάζεται από τον λογαριασμό. Χωρίς σύστημα πληρωμών το
     plan μένει 'free', αλλά η σύνδεση είναι ήδη σωστή. */
  function isPremium() {
    return !!(window.Auth && window.Auth.isPremium && window.Auth.isPremium());
  }

  /* Πόσες ανάποδες κάρτες δείχνουμε για να διαλέξει ο χρήστης */
  var POOL = 12;

  var state = {
    spread: null,      // το αντικείμενο της ρίψης
    pool: [],          // οι POOL ανακατεμένες κάρτες
    picked: [],        // δείκτες μέσα στο pool
    active: 0,         // ποια κάρτα δείχνουμε στο αποτέλεσμα
    topic: ''
  };

  var TOPICS = {
    monthly: ['Μηνιαίο tarot overview', 'Μηνιαίο love tarot', 'Μηνιαίο career tarot', 'Μηνιαίες προκλήσεις'],
    personality: ['Yes / No tarot', 'Τα δυνατά μου σημεία', 'Οι αδυναμίες μου', 'Ο σκοπός ζωής μου'],
    love: ['Τα αισθήματά του/της για εσένα', 'Σκέφτεται εσένα;', 'Η τωρινή ερωτική του/της κατάσταση', 'Η τωρινή σχέση του/της'],
    money: ['Career tarot', 'Business tarot', 'Money tarot', 'Το κλειδί για την επιτυχία']
  };

  var STAGES = ['stageChooser', 'stageTopic', 'stageShuffle', 'stagePick', 'stageResult',
                'stageLocked', 'stageGate', 'stageAdvice'];

  function show(stage) {
    STAGES.forEach(function (id) { $('#' + id).hidden = (id !== stage); });
    document.body.classList.toggle('tarot-reading-active', stage !== 'stageChooser');
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------------------
     1. Επιλογή ρίψης
     --------------------------------------------------------------------- */

  function buildSpreads() {
    var grid = $('#spreadGrid');
    grid.innerHTML = '';

    K.SPREADS.forEach(function (sp) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'spread-card tarot-option tarot-option--' + sp.id + (sp.free ? '' : ' is-premium');

      card.innerHTML =
        '<span class="sp-glyph" aria-hidden="true"></span>' +
        '<span class="sp-copy"><span class="sp-name"></span><span class="sp-sub"></span></span>' +
        '<span class="sp-tag"></span>' +
        '<span class="sp-cta"></span>';

      $('.sp-tag', card).textContent = sp.free ? T.t('common.free') : T.t('common.premium');
      $('.sp-tag', card).className = 'sp-tag ' + (sp.free ? 'tag-free' : 'tag-premium');
      if (sp.icon) {
        $('.sp-glyph', card).innerHTML =
          '<img class="app-icon app-icon--spread" src="' + sp.icon + '" alt="">';
      } else {
        $('.sp-glyph', card).textContent = sp.glyph;
      }
      $('.sp-name', card).textContent = T.t('spread.' + sp.id);
      $('.sp-sub', card).textContent = T.t('spread.' + sp.id + 'Sub');
      $('.sp-cta', card).textContent = '›';
      $('.sp-cta', card).setAttribute('aria-hidden', 'true');

      card.addEventListener('click', function () { choose(sp); });
      grid.appendChild(card);
    });
  }

  function choose(sp) {
    state.spread = sp;
    state.topic = '';

    if (TOPICS[sp.id]) { showTopics(sp); return; }

    beginSelectedDraw();
  }

  function showTopics(sp) {
    $('#stageTopic').setAttribute('data-topic', sp.id);
    $('#topicTitle').textContent = T.t('spread.' + sp.id);
    var list = $('#topicList');
    list.innerHTML = '';
    TOPICS[sp.id].forEach(function (topic) {
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'tarot-topic'; button.textContent = topic;
      button.addEventListener('click', function () { state.topic = topic; beginSelectedDraw(); });
      list.appendChild(button);
    });
    show('stageTopic');
  }

  function beginSelectedDraw() {
    var sp = state.spread;
    var premium = isPremium();

    if (premium) {
      /* Απεριόριστες ρίψεις — μία σύσταση μετά τη 2η, όχι φραγμός */
      if (K.shouldAdvise(sp.id)) { show('stageAdvice'); return; }
    } else if (sp.free) {
      /* Δωρεάν: μία ανάγνωση ανά 24ωρο */
      var g = K.gate();
      if (!g.allowed) {
        $('#gateCountdown').textContent = countdownText(g.remainingMs);
        show('stageGate');
        return;
      }
    }

    beginDraw();
  }

  function beginDraw() {
    $('#shuffleTitle').textContent = state.topic || T.t('spread.' + state.spread.id);
    show('stageShuffle');
    state.shuffleTimer = window.setTimeout(startPicking, 1100);
  }

  /* «σε 7 ώρες και 20 λεπτά» */
  function countdownText(ms) {
    var mins = Math.max(1, Math.round(ms / 60000));
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var parts = [];
    if (h) parts.push(h + ' ' + T.t(h === 1 ? 'tp.hour' : 'tp.hours'));
    if (m) parts.push(m + ' ' + T.t(m === 1 ? 'tp.minute' : 'tp.minutes'));
    return T.t('tp.gateIn') + ' ' + parts.join(' ' + T.t('tp.and') + ' ');
  }

  /* ---------------------------------------------------------------------
     2. Διάλεξε κάρτες
     --------------------------------------------------------------------- */

  function startPicking(salt) {
    var deck = K.shuffled(state.spread.id, new Date(), salt || '');
    state.pool = deck.slice(0, POOL);
    state.picked = [];
    state.active = 0;

    $('#remaining').textContent = String(state.spread.cards);

    var grid = $('#pickGrid');
    grid.innerHTML = '';

    state.pool.forEach(function (entry, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick-card';
      b.setAttribute('aria-label', String(i + 1));
      b.innerHTML = '<span class="pc-mark" aria-hidden="true">☾</span>';
      b.addEventListener('click', function () { pick(i, b); });
      grid.appendChild(b);
    });

    show('stagePick');
  }

  function pick(index, el) {
    if (state.picked.indexOf(index) !== -1) return;
    if (state.picked.length >= state.spread.cards) return;

    state.picked.push(index);
    el.classList.add('is-picked');
    el.disabled = true;
    var card = state.pool[index].card;
    el.setAttribute('aria-label', card[L()].name);
    el.innerHTML = '<span class="pick-reveal"><span class="pick-reveal-glyph" aria-hidden="true"></span><span class="pick-reveal-name"></span></span>';
    $('.pick-reveal-glyph', el).textContent = card.glyph;
    $('.pick-reveal-name', el).textContent = card[L()].name;
    $('#remaining').textContent = String(state.spread.cards - state.picked.length);

    if (state.picked.length === state.spread.cards) {
      window.setTimeout(showResult, 420);
    }
  }

  /* ---------------------------------------------------------------------
     3. Αποτέλεσμα
     --------------------------------------------------------------------- */

  function showResult() {
    $('#resultTitle').textContent = state.topic || T.t('spread.' + state.spread.id);
    $('#resultDate').textContent = new Intl.DateTimeFormat(locale(), {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());

    var canRead = state.spread.free || isPremium();
    renderCards(canRead);
    $('#synthesisPanel').hidden = !canRead;
    $('#resultPremiumGate').hidden = canRead;
    if (canRead) renderSynthesis();

    /* Η ρίψη μετράει μόλις αποκαλυφθεί */
    K.markDraw(state.spread.id);
    if (state.spread.free && !isPremium()) K.markRead();

    show('stageResult');
  }

  function pickedEntries() {
    return state.picked.map(function (i) { return state.pool[i]; });
  }

  /* Και οι τρεις κάρτες, ανοιχτές μαζί */
  function renderCards(canRead) {
    var row = $('#cardsRow');
    row.innerHTML = '';

    pickedEntries().forEach(function (entry, i) {
      var c = entry.card;
      var art = document.createElement('article');
      art.className = 'draw-card';
      art.innerHTML =
        '<span class="dc-pos"></span>' +
        '<span class="dc-face" aria-hidden="true"></span>' +
        '<span class="dc-arcana"></span>' +
        '<h3 class="dc-name"></h3>' +
        '<span class="dc-rev" hidden></span>' +
        '<p class="dc-text"></p>';

      $('.dc-pos', art).textContent = T.t('pos.' + state.spread.id + '.' + i);
      $('.dc-face', art).textContent = c.glyph;
      $('.dc-arcana', art).textContent = c.arcana === 'major'
        ? T.t('tp.major') + (c.roman ? '  ·  ' + c.roman : '')
        : T.t('tp.minor');
      $('.dc-name', art).textContent = c[L()].name;
      $('.dc-text', art).textContent = canRead
        ? c[L()].text
        : 'Η ερμηνεία αυτής της κάρτας είναι διαθέσιμη με Premium.';
      if (!canRead) art.classList.add('is-locked-reading');

      if (entry.reversed) {
        var rev = $('.dc-rev', art);
        rev.hidden = false;
        rev.textContent = T.t('tp.reversed');
        art.classList.add('is-reversed');
      }

      row.appendChild(art);
    });
  }

  /* Το συμπέρασμα από τον συνδυασμό των τριών */
  function renderSynthesis() {
    $('#synthesisText').textContent = K.synthesis(pickedEntries(), state.spread.id, L());
  }

  /* ---------------------------------------------------------------------
     Κεφαλίδα ιστοσελίδας
     --------------------------------------------------------------------- */

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

  function wireChrome() {
    var menu = $('#langMenu'), btn = $('#langBtn');

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.getAttribute('data-open') === 'true';
      menu.setAttribute('data-open', String(!open));
      btn.setAttribute('aria-expanded', String(!open));
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.lang')) {
        menu.setAttribute('data-open', 'false');
        btn.setAttribute('aria-expanded', 'false');
      }
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
  }

  /* ---------------------------------------------------------------------
     Εκκίνηση
     --------------------------------------------------------------------- */

  function onLanguageChange() {
    buildLangMenu();
    buildSpreads();
    var combo = $('#comboNote');
    if (combo) {
      combo.textContent = K.combinations().toLocaleString(locale()) + ' ' + T.t('tp.combos');
    }
    if (state.spread && !$('#stageResult').hidden) {
      $('#resultTitle').textContent = T.t('spread.' + state.spread.id);
      var canRead = state.spread.free || isPremium();
      renderCards(canRead);
      if (canRead) renderSynthesis();
    }
  }

  function init() {
    $('#year').textContent = String(new Date().getFullYear());
    wireChrome();

    ['#backFromTopic', '#backFromShuffle', '#backFromPick', '#backFromResult', '#backFromLocked', '#backFromGate', '#backFromAdvice']
      .forEach(function (sel) {
        $(sel).addEventListener('click', function () { show('stageChooser'); });
      });

    $('#adviceContinue').addEventListener('click', function () {
      K.markAdvice(state.spread.id);
      beginDraw();
    });
    $('#adviceOther').addEventListener('click', function () { show('stageChooser'); });

    $('#skipShuffle').addEventListener('click', function () {
      window.clearTimeout(state.shuffleTimer);
      startPicking('skip');
    });

    // Ο listener ΠΡΙΝ το T.init() — αλλιώς χάνεται το πρώτο render.
    document.addEventListener('languagechange', onLanguageChange);
    T.init();

    // Απευθείας σύνδεσμος: tarot.html?spread=daily
    var params = new URLSearchParams(window.location.search);
    var sp = K.spreadById(params.get('spread'));
    if (sp) choose(sp);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
