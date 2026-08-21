/* ==========================================================================
   Ταρωτάκι — main.js
   Συνδέει τα δεδομένα (astro.js, reviews.js) και τις μεταφράσεις (i18n.js)
   με το DOM.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var A = window.Astro;
  var T = window.I18n;
  var R = window.Reviews;

  var LOCALES = { el: 'el-GR', en: 'en-GB' };
  function locale() { return LOCALES[T.lang] || 'el-GR'; }
  function L() { return T.lang === 'en' ? 'en' : 'el'; }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Ρυθμίσεις που θα αλλάξεις όταν μπει backend ---------------------- */

  // Άφησέ τα κενά για να ανοίγει το πρόγραμμα email του χρήστη (mailto).
  var CONTACT_ENDPOINT = '';
  var CONTACT_EMAIL = 'hello@tarotaki.gr';

  // Ενδεικτικές τιμές — δεν έχει συνδεθεί σύστημα πληρωμών.
  var PRICE_MONTHLY = 9.99;
  var PRICE_YEARLY = 79.99;

  var state = {
    billing: 'monthly',
    railIndex: 0,
    railTimer: null
  };

  /* ---------------------------------------------------------------------
     Ροδακας ζωδίων (hero) — λεπτή γραμμή, χτίζεται από τα δεδομένα
     --------------------------------------------------------------------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function buildZodiacWheel() {
    var svg = $('#zodiacWheel');
    if (!svg) return;
    svg.innerHTML = '';

    var rOuter = 170, rInner = 132, rGlyph = 151, rCore = 96;

    [rOuter, rInner, rCore].forEach(function (r) {
      svg.appendChild(svgEl('circle', { cx: 0, cy: 0, r: r, class: 'w-line' }));
    });

    A.ZODIAC.forEach(function (sign, i) {
      // Διαχωριστικές γραμμές στα όρια των οίκων
      var edge = (-90 + 30 * i + 15) * Math.PI / 180;
      svg.appendChild(svgEl('line', {
        x1: (rInner * Math.cos(edge)).toFixed(2), y1: (rInner * Math.sin(edge)).toFixed(2),
        x2: (rOuter * Math.cos(edge)).toFixed(2), y2: (rOuter * Math.sin(edge)).toFixed(2),
        class: 'w-line'
      }));

      // Σύμβολο ζωδίου στο κέντρο κάθε τομέα
      var mid = (-90 + 30 * i) * Math.PI / 180;
      var x = rGlyph * Math.cos(mid);
      var y = rGlyph * Math.sin(mid);
      var icon = svgEl('image', {
        x: (x - 11).toFixed(2),
        y: (y - 11).toFixed(2),
        width: 22,
        height: 22,
        href: sign.icon,
        class: 'w-icon'
      });
      svg.appendChild(icon);
    });
  }

  /* ---------------------------------------------------------------------
     Γλώσσα
     --------------------------------------------------------------------- */

  function buildLangMenu() {
    var menu = $('#langMenu');
    if (!menu) return;
    menu.innerHTML = '';
    T.LANGS.forEach(function (lang) {
      var item = document.createElement('button');
      item.type = 'button';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(lang.code === T.lang));
      item.textContent = lang.label;
      item.addEventListener('click', function () {
        T.apply(lang.code);
        closeLangMenu();
        $('#langBtn').focus();
      });
      menu.appendChild(item);
    });
  }

  function openLangMenu() {
    $('#langMenu').setAttribute('data-open', 'true');
    $('#langBtn').setAttribute('aria-expanded', 'true');
  }
  function closeLangMenu() {
    $('#langMenu').setAttribute('data-open', 'false');
    $('#langBtn').setAttribute('aria-expanded', 'false');
  }
  function syncLangButton() {
    var lang = T.LANGS.filter(function (x) { return x.code === T.lang; })[0] || T.LANGS[0];
    $('#langShort').textContent = lang.short;
  }

  /* ---------------------------------------------------------------------
     Συρτάρι
     --------------------------------------------------------------------- */

  function setDrawer(open) {
    $('#drawer').setAttribute('data-open', String(open));
    $('#navToggle').setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  }

  /* ---------------------------------------------------------------------
     Ζώδια
     --------------------------------------------------------------------- */

  function fillSelect(select, placeholderKey) {
    if (!select) return;
    var keep = select.value;
    select.innerHTML = '';

    var ph = document.createElement('option');
    ph.value = '';
    ph.textContent = T.t(placeholderKey);
    select.appendChild(ph);

    A.ZODIAC.forEach(function (sign) {
      var opt = document.createElement('option');
      opt.value = sign.id;
      opt.textContent = sign.glyph + '  ' + sign[L()].name + '  ·  ' + sign[L()].range;
      select.appendChild(opt);
    });

    if (keep) select.value = keep;
  }

  function buildSignsGrid() {
    var grid = $('#signsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    A.ZODIAC.forEach(function (sign) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'sign-card';
      card.innerHTML =
        '<span class="glyph" aria-hidden="true"><img class="zodiac-icon zodiac-icon--card" src="' + sign.icon + '" alt=""></span>' +
        '<span class="name">' + sign[L()].name + '</span>' +
        '<span class="range">' + sign[L()].range + '</span>';

      card.addEventListener('click', function () {
        window.location.href = 'horoscope.html?sign=' + sign.id;
      });

      grid.appendChild(card);
    });
  }

  function buildFooterSigns() {
    var list = $('#footerSigns');
    if (!list) return;
    list.innerHTML = '';
    A.ZODIAC.slice(0, 6).forEach(function (sign) {
      var li = document.createElement('li');
      li.innerHTML = '<a href="#horoscope"><img class="zodiac-icon zodiac-icon--footer" src="' + sign.icon + '" alt="">' + sign[L()].name + '</a>';
      list.appendChild(li);
    });
  }

  /* ---------------------------------------------------------------------
     Συνδρομή
     --------------------------------------------------------------------- */

  function money(value) {
    return new Intl.NumberFormat(locale(), {
      style: 'currency', currency: 'EUR', minimumFractionDigits: 2
    }).format(value);
  }

  function renderPricing() {
    var yearly = state.billing === 'yearly';
    $('#billMonthly').setAttribute('aria-pressed', String(!yearly));
    $('#billYearly').setAttribute('aria-pressed', String(yearly));
    $('#planAmount').textContent = money(yearly ? PRICE_YEARLY / 12 : PRICE_MONTHLY);
    $('#planPeriod').textContent = T.t('pricing.perMonth');

    var pct = Math.round((1 - (PRICE_YEARLY / 12) / PRICE_MONTHLY) * 100);
    $('#billYearly .save-pill').textContent = T.t('pricing.save') + ' ' + pct + '%';

    var billed = $('#planBilled');
    if (yearly) {
      billed.hidden = false;
      billed.textContent = money(PRICE_YEARLY) + ' · ' + T.t('pricing.billedYearly');
    } else {
      billed.hidden = true;
    }
  }

  /* ---------------------------------------------------------------------
     Κριτικές
     Σχετικές ημερομηνίες + σήμα «Νέο» — έτσι το section φρεσκάρεται
     μόνο του όσο περνάνε οι μέρες, χωρίς να πειράξεις τίποτα.
     --------------------------------------------------------------------- */

  function formatWhen(review) {
    if (review.age <= 30) {
      if (review.age === 0) return T.t('reviews.today');
      try {
        return new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' })
          .format(-review.age, 'day');
      } catch (e) { /* παλιός browser: πέφτουμε στην απόλυτη ημερομηνία */ }
    }
    return new Intl.DateTimeFormat(locale(), {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(review.when);
  }

  function buildReviews() {
    var rail = $('#reviewsRail');
    var dots = $('#railDots');
    if (!rail) return;

    var items = R.list();

    rail.hidden = items.length === 0;

    // Χωρίς κριτικές δεν δείχνουμε άδεια ενότητα — κρύβεται όλη.
    var section = $('#reviews');
    if (section) section.hidden = items.length === 0;

    rail.innerHTML = '';
    dots.innerHTML = '';
    stopRail();

    if (!items.length) return;

    items.forEach(function (r) {
      var card = document.createElement('article');
      card.className = 'review';

      var top = '<div class="review-top"><span class="stars" aria-label="' + r.stars + '/5">' +
        '★'.repeat(r.stars) + '<span class="off">' + '★'.repeat(5 - r.stars) + '</span></span>' +
        (r.isNew ? '<span class="tag-new">' + T.t('reviews.new') + '</span>' : '') +
        '</div>';

      card.innerHTML = top +
        '<blockquote></blockquote>' +
        '<div class="who"><b></b><time datetime="' + r.date + '"></time></div>';

      // textContent για το περιεχόμενο χρήστη — καμία ερμηνεία HTML
      card.querySelector('blockquote').textContent = r[L()].text;
      card.querySelector('.who b').textContent = r.user;
      card.querySelector('.who time').textContent = formatWhen(r);

      rail.appendChild(card);
    });

    items.forEach(function (r, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', String(i + 1));
      dot.setAttribute('aria-current', String(i === 0));
      dot.addEventListener('click', function () { goToReview(i); });
      dots.appendChild(dot);
    });

    state.railIndex = 0;
    startRail();
  }

  function railStep() {
    var rail = $('#reviewsRail');
    return rail.scrollWidth / Math.max(1, rail.children.length);
  }

  function goToReview(i) {
    var rail = $('#reviewsRail');
    var count = rail.children.length;
    if (!count) return;
    state.railIndex = ((i % count) + count) % count;
    rail.scrollTo({
      left: state.railIndex * railStep(),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
    syncDots();
  }

  function syncDots() {
    $$('#railDots button').forEach(function (dot, i) {
      dot.setAttribute('aria-current', String(i === state.railIndex));
    });
  }

  function startRail() {
    stopRail();
    if (reduceMotion) return;
    var rail = $('#reviewsRail');
    if (!rail || rail.children.length < 2) return;
    state.railTimer = window.setInterval(function () {
      goToReview(state.railIndex + 1);
    }, 6000);
  }

  function stopRail() {
    if (state.railTimer) {
      window.clearInterval(state.railTimer);
      state.railTimer = null;
    }
  }

  function setFieldError(rowId, errId, message) {
    $('#' + rowId).classList.toggle('has-error', Boolean(message));
    $('#' + errId).textContent = message || '';
  }

  /* ---------------------------------------------------------------------
     Φόρμα επικοινωνίας
     --------------------------------------------------------------------- */

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function handleContact(e) {
    e.preventDefault();
    var name = $('#cName').value.trim();
    var email = $('#cEmail').value.trim();
    var message = $('#cMessage').value.trim();
    var ok = true;

    if (!name) { ok = false; setFieldError('rowName', 'errName', T.t('contact.errName')); }
    else setFieldError('rowName', 'errName', '');

    if (!validEmail(email)) { ok = false; setFieldError('rowEmail', 'errEmail', T.t('contact.errEmail')); }
    else setFieldError('rowEmail', 'errEmail', '');

    if (message.length < 5) { ok = false; setFieldError('rowMessage', 'errMessage', T.t('contact.errMessage')); }
    else setFieldError('rowMessage', 'errMessage', '');

    if (!ok) return;

    if (CONTACT_ENDPOINT) {
      var form = $('#contactForm');
      form.setAttribute('action', CONTACT_ENDPOINT);
      form.setAttribute('method', 'POST');
      form.submit();
      return;
    }

    $('#formStatus').textContent = T.t('contact.opening');
    window.location.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent('Ταρωτάκι — ' + name) +
      '&body=' + encodeURIComponent(message + '\n\n—\n' + name + ' <' + email + '>');
  }

  /* ---------------------------------------------------------------------
     Ό,τι εξαρτάται από τη γλώσσα
     --------------------------------------------------------------------- */

  function renderLanguageDependent() {
    syncLangButton();
    buildLangMenu();

    fillSelect($('#heroSign'), 'hero.pickPlaceholder');
    fillSelect($('#compatA'), 'hero.pickPlaceholder');
    fillSelect($('#compatB'), 'hero.pickPlaceholder');

    buildSignsGrid();
    buildFooterSigns();
    buildReviews();
    renderPricing();

  }

  /* ---------------------------------------------------------------------
     Εκκίνηση
     --------------------------------------------------------------------- */

  function init() {
    $('#year').textContent = String(new Date().getFullYear());

    buildZodiacWheel();


    /* ΣΗΜΑΝΤΙΚΟ: ο listener μπαίνει ΠΡΙΝ το T.init().
       Το T.init() στέλνει αμέσως το 'languagechange'· αν ο listener
       δηλωθεί μετά, δεν τρέχει ποτέ το πρώτο render και μένουν άδεια
       τα select, το πλέγμα ζωδίων, η σελήνη και οι κριτικές. */
    document.addEventListener('languagechange', renderLanguageDependent);
    T.init();

    /* Γλώσσα */
    $('#langBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      if ($('#langMenu').getAttribute('data-open') === 'true') closeLangMenu();
      else openLangMenu();
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.lang')) closeLangMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeLangMenu();
      if ($('#drawer').getAttribute('data-open') === 'true') {
        setDrawer(false);
        $('#navToggle').focus();
      }
    });

    /* Συρτάρι */
    $('#navToggle').addEventListener('click', function () {
      setDrawer($('#drawer').getAttribute('data-open') !== 'true');
    });
    $$('#drawer a').forEach(function (link) {
      link.addEventListener('click', function () { setDrawer(false); });
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (ev) {
      if (ev.matches) setDrawer(false);
    });

    /* Hero */
    $('#heroCta').addEventListener('click', function () {
      var v = $('#heroSign').value;
      if (!v) { $('#heroSign').focus(); return; }
      window.location.href = 'horoscope.html?sign=' + v;
    });
    /* Συμβατότητα */
    $('#compatCta').addEventListener('click', function () {
      var a = $('#compatA').value, b = $('#compatB').value;
      if (!a || !b) { $('#compatError').textContent = T.t('cp.pickBoth'); return; }
      window.location.href = 'compatibility.html?a=' + a + '&b=' + b;
    });

    /* Συνδρομή */
    $('#billMonthly').addEventListener('click', function () { state.billing = 'monthly'; renderPricing(); });
    $('#billYearly').addEventListener('click', function () { state.billing = 'yearly'; renderPricing(); });

    /* Κριτικές */
    var rail = $('#reviewsRail');
    rail.addEventListener('scroll', function () {
      var step = railStep();
      if (step > 0) {
        state.railIndex = Math.round(rail.scrollLeft / step);
        syncDots();
      }
    });
    rail.addEventListener('pointerenter', stopRail);
    rail.addEventListener('pointerleave', startRail);
    rail.addEventListener('focusin', stopRail);

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
