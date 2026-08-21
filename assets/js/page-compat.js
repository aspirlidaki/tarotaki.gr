/* ==========================================================================
   Ταρωτάκι — page-compat.js
   Σελίδα συμβατότητας ζωδίων. Η γενική εικόνα είναι δωρεάν.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var A = window.Astro;
  var T = window.I18n;
  var C = window.Compat;

  function L() { return T.lang === 'en' ? 'en' : 'el'; }

  var state = { a: null, b: null, category: 'general', result: null };
  var flowState = { type: null, step: 0, first: null };
  var mobileTarget = 'a';

  function isLocked(categoryId) {
    return categoryId !== 'general' && !(window.Auth && window.Auth.isPremium && window.Auth.isPremium());
  }

  /* ---------------------------------------------------------------------
     Premium compatibility flows
     --------------------------------------------------------------------- */

  function flowRoot() { return $('#compatFlow'); }

  function closeFlow() {
    flowRoot().hidden = true;
    document.body.classList.remove('compat-flow-open');
    flowState = { type: null, step: 0, first: null };
  }

  function flowHeader() {
    return '<div class="compat-flow__top"><button class="flow-icon-btn" type="button" data-flow-close aria-label="Κλείσιμο">×</button><span class="flow-progress" aria-hidden="true"><i></i><i></i><i></i></span></div>';
  }

  function profileDefaults() {
    var profile = window.Auth && window.Auth.current && window.Auth.current();
    if (!profile) {
      try { profile = JSON.parse(localStorage.getItem('tarotaki.birthProfile') || 'null'); } catch (err) { profile = null; }
    }
    return profile || {};
  }

  function renderFlow() {
    var host = $('#compatFlowContent');
    var defaults = profileDefaults();
    var isChart = flowState.type === 'chart';
    var title = isChart ? 'Συναστρία γενέθλιων χαρτών' : 'Matrix of Destiny';

    if (flowState.step === 0) {
      host.innerHTML = flowHeader() +
        '<section class="flow-intro"><div class="flow-orbits" aria-hidden="true"><span></span><span></span></div>' +
        '<p class="flow-kicker">✦</p><h1 id="compatFlowTitle">' + title + '</h1>' +
        '<p>' + (isChart ? 'Μια πιο προσωπική ματιά στη δυναμική δύο ανθρώπων, με τα στοιχεία γέννησης και των δύο.' : 'Δύο ημερομηνίες, ένα κοινό μοτίβο. Δες μια σύντομη αριθμολογική προεπισκόπηση της σύνδεσής σας.') + '</p>' +
        '<button class="btn btn-primary flow-primary" type="button" data-flow-next>' + (isChart ? 'Ξεκίνα' : 'Υπολόγισε το Matrix') + '</button></section>';
    } else if (isChart && flowState.step === 1) {
      host.innerHTML = flowHeader() +
        '<section class="flow-form"><p class="flow-step">1 από 2</p><h1 id="compatFlowTitle">Τα στοιχεία σου</h1><p>Η ώρα και ο τόπος βοηθούν στον πλήρη γενέθλιο χάρτη.</p>' +
        '<label>Όνομα<input id="flowName" class="field" autocomplete="name"></label><label>Ημερομηνία γέννησης<input id="flowDate" class="field" type="date" required></label>' +
        '<label>Ώρα γέννησης <span class="flow-optional">προαιρετικά</span><input id="flowTime" class="field" type="time"></label><label>Τόπος γέννησης <span class="flow-optional">προαιρετικά</span><input id="flowPlace" class="field" autocomplete="address-level2"></label>' +
        '<p class="flow-error" id="flowError" aria-live="polite"></p><button class="btn btn-primary flow-primary" type="button" data-chart-first>Συνέχεια</button></section>';
      $('#flowName').value = defaults.name || '';
      $('#flowDate').value = defaults.birthDate || '';
      $('#flowTime').value = defaults.birthTime || '';
      $('#flowPlace').value = defaults.birthPlace || '';
    } else if (isChart && flowState.step === 2) {
      host.innerHTML = flowHeader() +
        '<section class="flow-form"><p class="flow-step">2 από 2</p><h1 id="compatFlowTitle">Τα στοιχεία του άλλου ατόμου</h1><p>Αρκεί η ημερομηνία για την προεπισκόπηση. Τα υπόλοιπα συμπληρώνουν τον πλήρη χάρτη.</p>' +
        '<label>Όνομα<input id="flowPartnerName" class="field" autocomplete="name"></label><label>Ημερομηνία γέννησης<input id="flowPartnerDate" class="field" type="date" required></label>' +
        '<label>Ώρα γέννησης <span class="flow-optional">προαιρετικά</span><input id="flowPartnerTime" class="field" type="time"></label><label>Τόπος γέννησης <span class="flow-optional">προαιρετικά</span><input id="flowPartnerPlace" class="field" autocomplete="address-level2"></label>' +
        '<p class="flow-error" id="flowError" aria-live="polite"></p><button class="btn btn-primary flow-primary" type="button" data-chart-partner>Δες την προεπισκόπηση</button></section>';
    } else if (!isChart && flowState.step === 1) {
      host.innerHTML = flowHeader() +
        '<section class="flow-form"><p class="flow-step">2 ημερομηνίες</p><h1 id="compatFlowTitle">Η κοινή σας διαδρομή</h1><p>Χρησιμοποιούμε μόνο τις ημερομηνίες γέννησης για αυτή την αριθμολογική προεπισκόπηση.</p>' +
        '<label>Η δική σου ημερομηνία γέννησης<input id="flowDate" class="field" type="date" required></label><label>Ημερομηνία γέννησης του άλλου ατόμου<input id="flowPartnerDate" class="field" type="date" required></label>' +
        '<p class="flow-error" id="flowError" aria-live="polite"></p><button class="btn btn-primary flow-primary" type="button" data-matrix-result>Δες την προεπισκόπηση</button></section>';
      $('#flowDate').value = defaults.birthDate || '';
    } else {
      renderFlowResult(host);
    }
    $$('[data-flow-close]', host).forEach(function (button) { button.addEventListener('click', closeFlow); });
    var next = $('[data-flow-next]', host);
    if (next) next.addEventListener('click', function () { flowState.step = 1; renderFlow(); });
    var chartFirst = $('[data-chart-first]', host);
    if (chartFirst) chartFirst.addEventListener('click', saveFirstChartProfile);
    var chartPartner = $('[data-chart-partner]', host);
    if (chartPartner) chartPartner.addEventListener('click', savePartnerChartProfile);
    var matrixResult = $('[data-matrix-result]', host);
    if (matrixResult) matrixResult.addEventListener('click', saveMatrixDates);
  }

  function showFlowError(message) { $('#flowError').textContent = message; }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
    });
  }

  function saveFirstChartProfile() {
    if (!$('#flowDate').value) return showFlowError('Συμπλήρωσε την ημερομηνία γέννησης.');
    flowState.first = { name: $('#flowName').value.trim() || 'Εσύ', date: $('#flowDate').value, time: $('#flowTime').value, place: $('#flowPlace').value.trim() };
    flowState.step = 2;
    renderFlow();
  }

  function savePartnerChartProfile() {
    if (!$('#flowPartnerDate').value) return showFlowError('Συμπλήρωσε την ημερομηνία γέννησης.');
    flowState.second = { name: $('#flowPartnerName').value.trim() || 'Το άλλο άτομο', date: $('#flowPartnerDate').value, time: $('#flowPartnerTime').value, place: $('#flowPartnerPlace').value.trim() };
    flowState.step = 3;
    renderFlow();
  }

  function saveMatrixDates() {
    if (!$('#flowDate').value || !$('#flowPartnerDate').value) return showFlowError('Συμπλήρωσε και τις δύο ημερομηνίες γέννησης.');
    flowState.first = { date: $('#flowDate').value };
    flowState.second = { date: $('#flowPartnerDate').value };
    flowState.step = 2;
    renderFlow();
  }

  function renderFlowResult(host) {
    var first = flowState.first, second = flowState.second;
    if (flowState.type === 'chart') {
      var signA = A.signForDate(new Date(first.date + 'T12:00:00')), signB = A.signForDate(new Date(second.date + 'T12:00:00')), match = C.match(signA.id, signB.id, L());
      host.innerHTML = flowHeader() + '<section class="flow-result"><p class="flow-kicker">ΠΡΟΕΠΙΣΚΟΠΗΣΗ</p><h1 id="compatFlowTitle">' + escapeHtml(first.name) + ' <span>↔</span> ' + escapeHtml(second.name) + '</h1><div class="flow-score"><b>' + match.categories.filter(function (category) { return category.id === 'general'; })[0].score + '%</b><span>γενική εικόνα</span></div><div class="flow-signs"><span>' + signA.glyph + '<small>' + signA[L()].name + '</small></span><i>+</i><span>' + signB.glyph + '<small>' + signB[L()].name + '</small></span></div><p>Η πρώτη εικόνα βασίζεται στα ηλιακά ζώδια. Ο πλήρης χάρτης συγκρίνει Σελήνη, Αφροδίτη, Άρη και ωροσκόπο όπου υπάρχουν ακριβή στοιχεία γέννησης.</p><a class="btn btn-primary flow-primary" href="account.html?next=compatibility.html">Ξεκλείδωσε το πλήρες report</a></section>';
      return;
    }
    var firstNumber = digitRoot(first.date), secondNumber = digitRoot(second.date), shared = digitRoot(firstNumber + secondNumber);
    host.innerHTML = flowHeader() + '<section class="flow-result matrix-destiny-result"><h1 id="compatFlowTitle">Η αριθμολογική<br>σας αναφορά</h1><p>Τι αποκαλύπτουν οι αριθμοί για τη σύνδεσή σας</p><div class="matrix-destiny-number"><b>' + shared + '</b></div><div class="matrix-destiny-list"><div><i>◎</i><span><b>Η κοινή σας διαδρομή</b><small>Ο λόγος που συναντιέστε</small></span></div><div><i>✦</i><span><b>Ταλέντα και δώρα</b><small>Τι φέρνετε ο ένας στον άλλον</small></span></div><div><i>⌘</i><span><b>Μαθήματα εξέλιξης</b><small>Τι καλείστε να κατανοήσετε</small></span></div></div><p class="matrix-destiny-note">Η πλήρης αναφορά εξηγεί το νόημα που κρύβεται στις ημερομηνίες σας.</p><a class="btn btn-primary flow-primary" href="account.html?next=compatibility.html#premiumPlansTitle">Δες το πλήρες report →</a></section>';
  }

  function openFlow(type) {
    flowState = { type: type, step: 0, first: null, second: null };
    flowRoot().hidden = false;
    document.body.classList.add('compat-flow-open');
    renderFlow();
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------------------
     Λίστες ζωδίων
     --------------------------------------------------------------------- */

  function fillSelect(sel) {
    var keep = sel.value;
    sel.innerHTML = '';

    var ph = document.createElement('option');
    ph.value = '';
    ph.textContent = T.t('hero.pickPlaceholder');
    sel.appendChild(ph);

    A.ZODIAC.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.glyph + '  ' + s[L()].name;
      sel.appendChild(o);
    });
    if (keep) sel.value = keep;
  }

  function renderMobilePicker() {
    var grid = $('#mobileSignGrid');
    if (!grid) return;
    var signA = $('#signA').value;
    var signB = $('#signB').value;
    var slotA = $('#mobileSignSlotA');
    var slotB = $('#mobileSignSlotB');
    var cta = $('#mobileCompatCta');

    function slotMarkup(id, label) {
      var sign = A.signById(id);
      if (!sign) return '<span class="mobile-slot-plus" aria-hidden="true">+</span><span>' + label + '</span>';
      return '<img class="zodiac-icon" src="' + sign.icon + '" alt=""><span>' + sign[L()].name + '</span>';
    }

    slotA.innerHTML = slotMarkup(signA, 'Εσύ');
    slotB.innerHTML = slotMarkup(signB, 'Το άλλο άτομο');
    slotA.classList.toggle('is-active', mobileTarget === 'a');
    slotB.classList.toggle('is-active', mobileTarget === 'b');
    slotA.classList.toggle('has-sign', !!signA);
    slotB.classList.toggle('has-sign', !!signB);
    cta.disabled = !(signA && signB);

    grid.innerHTML = '';
    A.ZODIAC.forEach(function (sign) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'mobile-zodiac';
      button.classList.toggle('is-selected', sign.id === signA || sign.id === signB);
      button.innerHTML = '<img class="zodiac-icon" src="' + sign.icon + '" alt=""><b></b><small></small>';
      $('b', button).textContent = sign[L()].name;
      $('small', button).textContent = sign[L()].range;
      button.addEventListener('click', function () {
        var target = mobileTarget === 'a' ? '#signA' : '#signB';
        $(target).value = sign.id;
        mobileTarget = mobileTarget === 'a' ? 'b' : 'a';
        renderMobilePicker();
      });
      grid.appendChild(button);
    });
  }

  /* ---------------------------------------------------------------------
     Υπολογισμός και εμφάνιση
     --------------------------------------------------------------------- */

  function run() {
    var a = $('#signA').value;
    var b = $('#signB').value;
    var err = $('#compatError');

    if (!a || !b) {
      err.textContent = T.t('cp.pickBoth');
      $('#resultSection').hidden = true;
      return;
    }
    err.textContent = '';

    state.a = a;
    state.b = b;
    state.result = C.match(a, b, L());
    render();
    renderMobilePicker();

    // Το αποτέλεσμα να μπει στο κάδρο χωρίς να χαθεί η φόρμα
    $('#resultSection').scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  function render() {
    if (!state.result) return;
    var r = state.result;

    $('#resultSection').hidden = false;

    $('#loveScore').textContent = r.love;
    $('#pairGlyphA').innerHTML = '<img class="zodiac-icon zodiac-icon--pair" src="' + r.a.icon + '" alt="">';
    $('#pairGlyphB').innerHTML = '<img class="zodiac-icon zodiac-icon--pair" src="' + r.b.icon + '" alt="">';
    $('#pairNameA').textContent = r.a[L()].name;
    $('#pairNameB').textContent = r.b[L()].name;

    renderCatBar();
    renderPanels();
  }

  function renderCatBar() {
    var bar = $('#catBar');
    bar.innerHTML = '';

    C.CATEGORIES.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cat-btn';
      b.setAttribute('aria-pressed', String(c.id === state.category));
      b.textContent = T.t('cat.' + c.id);
      if (isLocked(c.id)) {
        b.classList.add('is-locked');
        var lock = document.createElement('span');
        lock.className = 'compat-lock';
        lock.setAttribute('aria-hidden', 'true');
        b.appendChild(lock);
      }
      b.addEventListener('click', function () {
        state.category = c.id;
        renderCatBar();
        renderPanels();
      });
      bar.appendChild(b);
    });
  }

  function renderPanels() {
    var host = $('#catPanels');
    host.innerHTML = '';

    var cat = state.result.categories.filter(function (c) {
      return c.id === state.category;
    })[0];
    if (!cat) return;

    var card = document.createElement('article');
    card.className = 'cat-card';

    var head = document.createElement('div');
    head.className = 'cat-head';
    head.innerHTML = '<h3></h3>';
    $('h3', head).textContent = T.t('cat.' + cat.id);

    if (isLocked(cat.id)) {
      card.classList.add('cat-card-locked');
      card.appendChild(head);
      var lockedCopy = document.createElement('p');
      lockedCopy.className = 'cat-text';
      lockedCopy.textContent = T.t('cp.categoryLockedText').replace('{category}', T.t('cat.' + cat.id));
      card.appendChild(lockedCopy);
      var unlock = document.createElement('a');
      unlock.className = 'btn btn-primary btn-sm';
      unlock.href = 'account.html';
      unlock.textContent = T.t('nav.upgrade');
      card.appendChild(unlock);
      host.appendChild(card);
      return;
    }

    if (cat.scored) {
      var pct = document.createElement('span');
      pct.className = 'cat-pct';
      pct.textContent = cat.score + '%';
      head.appendChild(pct);
    }
    card.appendChild(head);

    if (cat.scored) {
      var track = document.createElement('div');
      track.className = 'cat-track';
      var fill = document.createElement('i');
      fill.style.width = cat.score + '%';
      fill.setAttribute('data-tier', cat.tier);
      track.appendChild(fill);
      card.appendChild(track);
    }

    var p = document.createElement('p');
    p.className = 'cat-text';
    p.textContent = cat.text;
    card.appendChild(p);

    host.appendChild(card);

    /* Σύνοψη όλων των κατηγοριών, ώστε να φαίνεται η εικόνα με μια ματιά */
    var summary = document.createElement('div');
    summary.className = 'cat-summary';
    state.result.categories.filter(function (c) { return c.scored && !isLocked(c.id); }).forEach(function (c) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'sum-row';
      row.setAttribute('aria-pressed', String(c.id === state.category));
      row.innerHTML = '<span class="sum-name"></span>' +
                      '<span class="bar"><i></i></span>' +
                      '<span class="sum-val"></span>';
      $('.sum-name', row).textContent = T.t('cat.' + c.id);
      $('.bar i', row).style.width = c.score + '%';
      $('.sum-val', row).textContent = c.score;
      row.addEventListener('click', function () {
        state.category = c.id;
        renderCatBar();
        renderPanels();
      });
      summary.appendChild(row);
    });
    host.appendChild(summary);
  }

  /* ---------------------------------------------------------------------
     Αναλυτική συναστρία (30 credits)
     --------------------------------------------------------------------- */

  function unlockSynastry() {
    if (!state.result) {
      $('#synastryStatus').textContent = 'Διάλεξε πρώτα τα δύο ζώδια.';
      return;
    }
    var Auth = window.Auth;
    if (!Auth || !Auth.current()) {
      window.location.href = 'account.html?next=compatibility.html';
      return;
    }
    Auth.spendCredits(30, function (err) {
      if (err === 'credits') {
        $('#synastryStatus').textContent = 'Χρειάζεσαι 30 credits για την αναλυτική συναστρία.';
        return;
      }
      if (err) {
        $('#synastryStatus').textContent = 'Η αγορά δεν μπόρεσε να ολοκληρωθεί αυτή τη στιγμή.';
        return;
      }
      var a = state.result.a[L()].name, b = state.result.b[L()].name;
      $('#synastryReport').innerHTML =
        '<h4>Η δυναμική ' + a + ' &amp; ' + b + '</h4>' +
        '<p>Η σύνδεσή σας έχει έντονο ρυθμό: λειτουργεί καλύτερα όταν δίνετε χώρο και στην πρωτοβουλία και στην ακρόαση. ' +
        'Τα σημεία που φάνηκαν στη βασική ανάλυση είναι οι πιο χρήσιμες αφορμές για ειλικρινή συζήτηση.</p>';
      $('#synastryReport').hidden = false;
      $('#synastryUnlock').hidden = true;
      $('#synastryStatus').textContent = 'Χρησιμοποιήθηκαν 30 credits και η αναλυτική συναστρία ξεκλείδωσε.';
    });
  }

  /* ---------------------------------------------------------------------
     Matrix of Destiny: αριθμολογική ανάγνωση δύο ημερομηνιών
     --------------------------------------------------------------------- */

  function digitRoot(value) {
    var n = String(value).replace(/\D/g, '').split('').reduce(function (sum, digit) { return sum + Number(digit); }, 0);
    while (n > 9 && n !== 11 && n !== 22) n = String(n).split('').reduce(function (sum, digit) { return sum + Number(digit); }, 0);
    return n;
  }

  function matrixFinding(number, index) {
    var patterns = [
      ['Ρυθμός και υπομονή', 'Η σχέση χρειάζεται κοινό ρυθμό. Όταν βιάζεστε να λύσετε τα πάντα αμέσως, χάνεται η ουσία.'],
      ['Όρια στην επικοινωνία', 'Υπάρχει τάση να μιλάτε από ένταση ή να κρατάτε πράγματα μέσα σας. Οι καθαρές συμφωνίες βοηθούν.'],
      ['Χώρος για ατομικότητα', 'Η εγγύτητα δυναμώνει όταν δεν γίνεται έλεγχος. Δώστε χώρο στα προσωπικά θέλω και των δύο.'],
      ['Προσδοκίες και πραγματικότητα', 'Ελέγξτε αν περιμένετε ο ένας να καλύψει ανάγκες που χρειάζονται πρώτα προσωπική φροντίδα.'],
      ['Ασφάλεια και αλλαγή', 'Ο ένας μπορεί να ζητά σταθερότητα ενώ ο άλλος αλλαγή. Η πρόκληση είναι να σχεδιάσετε και τα δύο.'],
      ['Συναισθηματική διαθεσιμότητα', 'Η σύνδεση βαθαίνει όταν ο καθένας λέει καθαρά τι χρειάζεται, χωρίς να θεωρεί ότι ο άλλος το μαντεύει.'],
      ['Κοινή κατεύθυνση', 'Η έλξη δεν αρκεί μόνη της: χρειάζεται να μοιράζεστε έναν πρακτικό τρόπο να προχωράτε μαζί.']
    ];
    var item = patterns[number % patterns.length];
    return '<article class="finding"><span class="finding-number">0' + (index + 1) + '</span><h3>' + item[0] + '</h3><p>' + item[1] + '</p></article>';
  }

  function calculateMatrix(event) {
    event.preventDefault();
    var a = $('#matrixDateA').value, b = $('#matrixDateB').value;
    if (!a || !b || isNaN(new Date(a).getTime()) || isNaN(new Date(b).getTime())) {
      $('#matrixError').textContent = 'Βάλε και τις δύο ημερομηνίες γέννησης.';
      return;
    }
    $('#matrixError').textContent = '';
    var first = digitRoot(a), second = digitRoot(b), shared = digitRoot(first + second);
    $('#matrixNumbers').innerHTML =
      '<div><span>Η δική σου διαδρομή</span><b>' + first + '</b></div>' +
      '<div><span>Η διαδρομή του/της συντρόφου</span><b>' + second + '</b></div>' +
      '<div><span>Κοινό Matrix</span><b>' + shared + '</b></div>';
    var seeds = [first + second, first * 2 + shared, second * 3 + shared];
    $('#matrixFindings').innerHTML = seeds.map(matrixFinding).join('');
    $('#matrixResult').hidden = false;
    $('#matrixReport').hidden = true;
    $('#matrixReportButton').onclick = function () {
      if (!window.Auth || !window.Auth.isPremium()) {
        window.location.href = 'account.html?next=compatibility.html';
        return;
      }
      $('#matrixReport').innerHTML = '<h2>Τι έρχεστε να μάθετε μαζί</h2><p>Το κοινό Matrix ' + shared + ' δείχνει ότι η σχέση σας αναπτύσσεται όταν μετατρέπετε τις διαφορές σε κοινές επιλογές. ' +
        'Η πιο ουσιαστική σας μάθηση είναι να ισορροπείτε την προσωπική ελευθερία με τη δέσμευση, χωρίς να μικραίνει κανείς για να χωρέσει.</p>';
      $('#matrixReport').hidden = false;
      $('#matrixReport').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    $('#matrixResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    fillSelect($('#signA'));
    fillSelect($('#signB'));
    if (state.a) $('#signA').value = state.a;
    if (state.b) $('#signB').value = state.b;
    if (state.result) {
      state.result = C.match(state.a, state.b, L());
      render();
    }
    renderMobilePicker();
  }

  function init() {
    $('#year').textContent = String(new Date().getFullYear());
    wireChrome();

    $('#compatCta').addEventListener('click', run);
    $('#mobileCompatCta').addEventListener('click', run);
    $('#mobileSignSlotA').addEventListener('click', function () { mobileTarget = 'a'; renderMobilePicker(); });
    $('#mobileSignSlotB').addEventListener('click', function () { mobileTarget = 'b'; renderMobilePicker(); });
    $('#signA').addEventListener('change', renderMobilePicker);
    $('#signB').addEventListener('change', renderMobilePicker);
    $('#synastryUnlock').addEventListener('click', unlockSynastry);
    $('#matrixForm').addEventListener('submit', calculateMatrix);

    $$('.compat-choice').forEach(function (choice) {
      choice.addEventListener('click', function () {
        $$('.compat-choice').forEach(function (item) { item.classList.toggle('is-selected', item === choice); });
        var type = choice.getAttribute('data-compat-choice');
        if (type === 'chart' || type === 'matrix') {
          openFlow(type);
          return;
        }
        var target = window.matchMedia('(max-width: 767px)').matches ? $('#compatMobilePicker') : $('#sunMatch');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    $('#swapBtn').addEventListener('click', function () {
      var a = $('#signA').value;
      $('#signA').value = $('#signB').value;
      $('#signB').value = a;
      if (state.result) run();
    });

    // Ο listener ΠΡΙΝ το T.init() — αλλιώς χάνεται το πρώτο render.
    document.addEventListener('languagechange', onLanguageChange);
    T.init();
    renderMobilePicker();

    // Προσυμπλήρωση από το URL: compatibility.html?a=aries&b=leo
    var params = new URLSearchParams(window.location.search);
    var a = params.get('a'), b = params.get('b');
    if (A.signById(a) && A.signById(b)) {
      $('#signA').value = a;
      $('#signB').value = b;
      run();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
