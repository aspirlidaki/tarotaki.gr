/* ==========================================================================
   Ταρωτάκι — page-account.js
   Εγγραφή, σύνδεση και σελίδα λογαριασμού.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var T = window.I18n;
  var A = window.Auth;

  var LOCALES = { el: 'el-GR', en: 'en-GB' };
  function locale() { return LOCALES[T.lang] || 'el-GR'; }

  var mode = 'signup';   // 'signup' | 'signin'

  /* Πού πάμε μετά τη σύνδεση, αν ήρθαμε από αλλού */
  var nextUrl = null;

  function hasBirthProfile(user) {
    return !!(user && /^\d{4}-\d{2}-\d{2}$/.test(user.birthDate || '') &&
      /^\d{2}:\d{2}$/.test(user.birthTime || ''));
  }

  function clearBirthProfileErrors() {
    ['rowBirthDate', 'rowBirthTime'].forEach(function (row) {
      $('#' + row).classList.remove('has-error');
    });
    ['errBirthDate', 'errBirthTime', 'birthProfileError'].forEach(function (id) {
      $('#' + id).textContent = '';
    });
  }

  function birthProfileError(row, error, key) {
    $('#' + row).classList.add('has-error');
    $('#' + error).textContent = T.t(key);
  }

  /* ---------------------------------------------------------------------
     Εναλλαγή εγγραφή / σύνδεση
     --------------------------------------------------------------------- */

  function applyMode() {
    var signup = mode === 'signup';

    $('#authTitle').textContent = T.t(signup ? 'acc.titleSignup' : 'acc.titleSignin');
    $('#authSub').textContent   = T.t(signup ? 'acc.subSignup' : 'acc.subSignin');
    $('#authSubmit').textContent = T.t(signup ? 'acc.doSignup' : 'acc.doSignin');
    $('#switchText').textContent = T.t(signup ? 'acc.haveAccount' : 'acc.noAccount');
    $('#switchBtn').textContent  = T.t(signup ? 'acc.goSignin' : 'acc.goSignup');

    $('#rowName').hidden = !signup;
    $('#rowPassword2').hidden = !signup;

    $('#acPassword').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');

    clearErrors();
  }

  function clearErrors() {
    ['rowName', 'rowEmail', 'rowPassword', 'rowPassword2'].forEach(function (r) {
      $('#' + r).classList.remove('has-error');
    });
    ['errAcName', 'errAcEmail', 'errAcPassword', 'errAcPassword2', 'authError'].forEach(function (e) {
      $('#' + e).textContent = '';
    });
  }

  function fieldError(row, err, key) {
    $('#' + row).classList.add('has-error');
    $('#' + err).textContent = T.t(key);
  }

  /* ---------------------------------------------------------------------
     Υποβολή
     --------------------------------------------------------------------- */

  function submit(e) {
    e.preventDefault();
    clearErrors();

    var name = $('#acName').value.trim();
    var email = $('#acEmail').value.trim();
    var pass = $('#acPassword').value;
    var pass2 = $('#acPassword2').value;
    var ok = true;

    if (mode === 'signup' && !name) { fieldError('rowName', 'errAcName', 'acc.errName'); ok = false; }
    if (!A.validEmail(email)) { fieldError('rowEmail', 'errAcEmail', 'acc.errEmail'); ok = false; }

    if (mode === 'signup') {
      if (pass.length < 8) { fieldError('rowPassword', 'errAcPassword', 'acc.errPassword'); ok = false; }
      else if (pass !== pass2) { fieldError('rowPassword2', 'errAcPassword2', 'acc.errPassword2'); ok = false; }
    } else if (!pass) {
      fieldError('rowPassword', 'errAcPassword', 'acc.errPassword'); ok = false;
    }

    if (!ok) return;

    var done = function (err) {
      if (err) {
        var map = {
          name: 'acc.errName', email: 'acc.errEmail', password: 'acc.errPassword',
          exists: 'acc.errExists', credentials: 'acc.errCredentials',
          storage: 'acc.errStorage', backend: 'acc.errBackend'
        };
        $('#authError').textContent = T.t(map[err] || 'acc.errCredentials');
        return;
      }
      if (nextUrl) { window.location.href = nextUrl; return; }
      render();
    };

    if (mode === 'signup') A.signUp({ name: name, email: email, password: pass }, done);
    else A.signIn({ email: email, password: pass }, done);
  }

  function submitBirthProfile(e) {
    e.preventDefault();
    clearBirthProfileErrors();

    var birthDate = $('#birthProfileDate').value;
    var birthTime = $('#birthProfileTime').value;
    var birthPlace = $('#birthProfilePlace').value.trim();
    var ok = true;
    var date = /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? new Date(birthDate + 'T12:00:00') : null;

    if (!date || isNaN(date.getTime()) || date.getTime() > Date.now()) {
      birthProfileError('rowBirthDate', 'errBirthDate', 'acc.errBirthDate');
      ok = false;
    }
    if (!/^\d{2}:\d{2}$/.test(birthTime)) {
      birthProfileError('rowBirthTime', 'errBirthTime', 'acc.errBirthTime');
      ok = false;
    }
    if (!ok) return;

    A.updateProfile({
      birthDate: birthDate,
      birthTime: birthTime,
      birthPlace: birthPlace
    }, function (err) {
      if (err) {
        $('#birthProfileError').textContent = T.t(err === 'storage' ? 'acc.errStorage' : 'acc.errBackend');
        return;
      }
      if (nextUrl) { window.location.href = nextUrl; return; }
      render();
    });
  }

  /* ---------------------------------------------------------------------
     Εμφάνιση
     --------------------------------------------------------------------- */

  function render() {
    var user = A.current();

    $('#stageForm').hidden = !!user;
    $('#stageBirthProfile').hidden = !user || hasBirthProfile(user);
    $('#stageAccount').hidden = !user || !hasBirthProfile(user);
    $('#protoNote').hidden = !A.isLocalPrototype;

    renderChip(user);
    if (!user) { applyMode(); return; }
    if (!hasBirthProfile(user)) {
      $('#birthProfileDate').max = new Date().toISOString().slice(0, 10);
      return;
    }

    $('#userName').textContent = user.name || user.email;
    $('#userEmail').textContent = user.email;
    $('#userPlan').textContent = T.t(user.plan === 'premium' ? 'acc.planPremium' : 'acc.planFree');

    var since = '—';
    if (user.createdAt) {
      var d = new Date(user.createdAt);
      if (!isNaN(d.getTime())) {
        since = new Intl.DateTimeFormat(locale(), {
          day: 'numeric', month: 'long', year: 'numeric'
        }).format(d);
      }
    }
    $('#userSince').textContent = since;
    $('#verifyNote').hidden = user.verified;
    $('#userBirthDate').textContent = new Intl.DateTimeFormat(locale(), {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(user.birthDate + 'T12:00:00'));
    $('#userBirthTime').textContent = user.birthTime;
    $('#userBirthPlace').textContent = user.birthPlace || '';
    $('#userBirthPlaceRow').hidden = !user.birthPlace;

    renderNatal(user);
  }

  /* ---------------------------------------------------------------------
     Ήλιος, Σελήνη, Ωροσκόπος από τα στοιχεία γέννησης
     --------------------------------------------------------------------- */

  function signLabel(part) {
    if (!part) return null;
    var sign = window.Astro && window.Astro.signById(part.sign);
    if (!sign) return null;
    return sign[L()].name;
  }

  function renderNatal(user) {
    var box = $('#natalTrio');
    if (!box || !window.Natal) return;

    var natal = window.Natal.compute({
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthPlace: user.birthPlace
    });

    if (!natal.sun) { box.hidden = true; return; }
    box.hidden = false;

    var deg = function (p) { return p ? Math.floor(p.degree) + '°' : ''; };

    $('#natalSun').textContent = signLabel(natal.sun) || '—';
    $('#natalSunDeg').textContent = deg(natal.sun);

    $('#natalMoon').textContent = signLabel(natal.moon) || '—';
    $('#natalMoonDeg').textContent = deg(natal.moon);

    if (natal.ascendant) {
      $('#natalAsc').textContent = signLabel(natal.ascendant) || '—';
      $('#natalAscDeg').textContent = deg(natal.ascendant);
    } else {
      $('#natalAsc').textContent = '—';
      $('#natalAscDeg').textContent = '';
    }

    /* Λέμε ρητά τι λείπει, αντί να δείξουμε λάθος ωροσκόπο */
    var note = $('#natalNote'), message = '';
    if (natal.needs.indexOf('placeUnknown') !== -1) {
      message = T.t('acc.natalPlaceUnknown');
    } else if (natal.needs.indexOf('place') !== -1) {
      message = T.t('acc.natalNeedPlace');
    } else if (natal.needs.indexOf('time') !== -1) {
      message = T.t('acc.natalNeedTime');
    }
    note.textContent = message;
    note.hidden = !message;
  }

  /* Το κουμπί λογαριασμού στην κεφαλίδα */
  function renderChip(user) {
    var chip = $('#authChip');
    if (!chip) return;
    chip.innerHTML = '';

    var a = document.createElement('a');
    a.href = 'account.html';
    a.className = 'chip-link';
    a.textContent = user ? (user.name || user.email) : T.t('acc.signIn');
    chip.appendChild(a);
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

  function init() {
    $('#year').textContent = String(new Date().getFullYear());
    wireChrome();

    var params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signin') mode = 'signin';
    nextUrl = params.get('next');

    $('#switchBtn').addEventListener('click', function () {
      mode = mode === 'signup' ? 'signin' : 'signup';
      applyMode();
    });

    $('#authForm').addEventListener('submit', submit);
    $('#birthProfileForm').addEventListener('submit', submitBirthProfile);

    $('#signOutBtn').addEventListener('click', function () {
      A.signOut(function () { render(); });
    });

    $('#deleteBtn').addEventListener('click', function () {
      if (!window.confirm || window.confirm(T.t('acc.deleteConfirm'))) {
        A.remove(function () { render(); });
      }
    });

    $$('.subscription-option').forEach(function (option) {
      option.addEventListener('click', function () {
        $('#subscriptionNote').textContent =
          'Το checkout για το πακέτο αυτό δεν έχει συνδεθεί ακόμη. Δεν έγινε χρέωση ή αλλαγή συνδρομής.';
      });
    });

    // Ο listener ΠΡΙΝ το T.init() — αλλιώς χάνεται το πρώτο render.
    document.addEventListener('languagechange', function () {
      buildLangMenu();
      render();
    });

    A.init();
    T.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
