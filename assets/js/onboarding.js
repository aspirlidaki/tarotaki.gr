/*
   Ταρωτάκι — onboarding.js
   Πρώτη είσοδος: στοιχεία γέννησης για προσωπική εμπειρία.
   Τα στοιχεία μένουν τοπικά στον browser μέχρι να δημιουργηθεί λογαριασμός.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'tarotaki.birthProfile';
  var FLOW_KEY = 'tarotaki.onboardingComplete';
  var form = { birthDate: '', birthTime: '', birthPlace: '', birthLatitude: null, birthLongitude: null, birthTimezone: '', timeKnown: true };
  var step = 0;
  var root;
  var placeSearchTimer = 0;
  var placeRequestId = 0;
  var placeSearchController = null;

  var cities = [
    'Αθήνα, Ελλάδα', 'Θεσσαλονίκη, Ελλάδα', 'Πάτρα, Ελλάδα', 'Ηράκλειο, Ελλάδα',
    'Λάρισα, Ελλάδα', 'Βόλος, Ελλάδα', 'Ιωάννινα, Ελλάδα', 'Χανιά, Ελλάδα',
    'Καλαμάτα, Ελλάδα', 'Ρόδος, Ελλάδα', 'Λευκωσία, Κύπρος', 'Λεμεσός, Κύπρος'
  ];

  function read(key, fallback) {
    try { var item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; }
    catch (error) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { return false; }
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function show() {
    root.hidden = false;
    document.body.classList.add('onboarding-open');
    render();
  }

  function close() {
    root.hidden = true;
    document.body.classList.remove('onboarding-open');
  }

  function wheel() {
    return '<div class="onboarding-wheel" aria-hidden="true">' +
      '<span>♈</span><span>♉</span><span>♊</span><span>♋</span><span>♌</span><span>♍</span>' +
      '<span>♎</span><span>♏</span><span>♐</span><span>♑</span><span>♒</span><span>♓</span>' +
      '<b>☾</b></div>';
  }

  function progress() {
    return '<div class="onboarding-progress" aria-label="Βήμα ' + (step + 1) + ' από 4">' +
      [0, 1, 2, 3].map(function (number) {
        return '<i class="' + (number === step ? 'is-current' : number < step ? 'is-complete' : '') + '"></i>';
      }).join('') + '</div>';
  }

  function intro() {
    return '<section class="onboarding-screen onboarding-intro">' +
      wheel() +
      '<p class="onboarding-kicker">TAROTAKI.GR</p>' +
      '<h1>Ο προσωπικός σου<br>αστρολογικός χάρτης.</h1>' +
      '<p>Θα χρειαστούμε μόνο τα στοιχεία γέννησής σου. Χρησιμοποιούνται για να προσαρμόζουμε τις προβλέψεις σου.</p>' +
      '<button class="btn btn-primary onboarding-next" type="button">Ξεκίνα</button>' +
      '<button class="onboarding-skip" id="onboardingIntroSkip" type="button">Παράλειψη για τώρα</button>' +
      '<small>Τα στοιχεία αποθηκεύονται στη συσκευή σου.</small>' +
      progress() +
    '</section>';
  }

  function birth() {
    return '<section class="onboarding-screen">' +
      '<button class="onboarding-back" type="button" aria-label="Πίσω">←</button>' +
      '<p class="onboarding-kicker">ΒΗΜΑ 2 ΑΠΟ 4</p>' +
      '<h1>Πότε γεννήθηκες;</h1>' +
      '<p class="onboarding-copy">Η ημερομηνία δείχνει το ζώδιό σου. Η ώρα βοηθά στον υπολογισμό του ωροσκόπου.</p>' +
      '<label class="onboarding-field"><span>Ημερομηνία γέννησης</span><input id="onboardingDate" type="date" value="' + escapeHtml(form.birthDate) + '" max="' + new Date().toISOString().slice(0, 10) + '" required></label>' +
      '<label class="onboarding-field"><span>Ώρα γέννησης</span><input id="onboardingTime" type="time" value="' + escapeHtml(form.birthTime) + '" ' + (form.timeKnown ? 'required' : 'disabled') + '></label>' +
      '<label class="onboarding-check"><input id="onboardingUnknownTime" type="checkbox" ' + (form.timeKnown ? '' : 'checked') + '><span>Δεν γνωρίζω την ώρα γέννησης</span></label>' +
      '<p class="onboarding-note">Η ώρα δεν είναι απαραίτητη για το ημερήσιο ωροσκόπιο.</p>' +
      '<button class="btn btn-primary onboarding-next" id="onboardingDateNext" type="button">Συνέχεια</button>' +
      progress() +
    '</section>';
  }

  function place() {
    var options = cities.map(function (city) { return '<option value="' + city + '"></option>'; }).join('');
    return '<section class="onboarding-screen">' +
      '<button class="onboarding-back" type="button" aria-label="Πίσω">←</button>' +
      '<p class="onboarding-kicker">ΒΗΜΑ 3 ΑΠΟ 4</p>' +
      '<h1>Πού γεννήθηκες;</h1>' +
      '<p class="onboarding-copy">Γράψε πόλη και χώρα, για παράδειγμα «Πάτρα, Ελλάδα».</p>' +
      '<label class="onboarding-field"><span>Τόπος γέννησης</span><input id="onboardingPlace" list="onboardingCities" autocomplete="address-level2" placeholder="Πόλη, χώρα" value="' + escapeHtml(form.birthPlace) + '" required></label>' +
      '<datalist id="onboardingCities">' + options + '</datalist>' +
      '<p class="onboarding-note">Θα επιλέξεις την ακριβή πόλη και ζώνη ώρας στο επόμενο βήμα.</p>' +
      '<div class="place-results" id="onboardingPlaceResults" aria-live="polite"></div>' +
      '<button class="btn btn-primary onboarding-next" id="onboardingPlaceNext" type="button">Συνέχεια</button>' +
      '<button class="onboarding-skip" id="onboardingPlaceSkip" type="button">Συνέχεια χωρίς ακριβή τόπο</button>' +
      progress() +
    '</section>';
  }

  function result() {
    var date = new Date(form.birthDate + 'T12:00:00');
    var sign = window.Astro && window.Astro.signForDate(date);
    var name = sign ? sign.el.name : '—';
    var glyph = sign ? sign.glyph : '☾';
    return '<section class="onboarding-screen onboarding-result">' +
      '<button class="onboarding-back" type="button" aria-label="Πίσω">←</button>' +
      '<p class="onboarding-kicker">ΒΗΜΑ 4 ΑΠΟ 4</p>' +
      '<p class="onboarding-result-label">Το ζώδιό σου είναι</p>' +
      '<div class="onboarding-sign" aria-hidden="true">' + glyph + '</div>' +
      '<h1>' + name + '</h1>' +
      '<p class="onboarding-copy">Θα ετοιμάσουμε τη σημερινή σου πρόβλεψη με βάση τα στοιχεία που έδωσες.</p>' +
      '<dl class="onboarding-summary"><div><dt>Ημερομηνία</dt><dd>' + new Intl.DateTimeFormat('el-GR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date) + '</dd></div><div><dt>Ώρα</dt><dd>' + (form.timeKnown && form.birthTime ? form.birthTime : 'Δεν είναι γνωστή') + '</dd></div><div><dt>Τόπος</dt><dd>' + escapeHtml(form.birthPlace) + '</dd></div></dl>' +
      '<button class="btn btn-primary onboarding-next" id="onboardingFinish" type="button">Δες το ωροσκόπιό μου</button>' +
      progress() +
    '</section>';
  }

  function render() {
    root.innerHTML = step === 0 ? intro() : step === 1 ? birth() : step === 2 ? place() : result();
    root.querySelectorAll('.onboarding-next').forEach(function (button) { button.addEventListener('click', next); });
    root.querySelectorAll('.onboarding-back').forEach(function (button) { button.addEventListener('click', function () { step = Math.max(0, step - 1); render(); }); });

    var unknownTime = root.querySelector('#onboardingUnknownTime');
    if (unknownTime) unknownTime.addEventListener('change', function () {
      form.timeKnown = !unknownTime.checked;
      root.querySelector('#onboardingTime').disabled = !form.timeKnown;
      if (!form.timeKnown) root.querySelector('#onboardingTime').value = '';
    });

    var introSkip = root.querySelector('#onboardingIntroSkip');
    if (introSkip) introSkip.addEventListener('click', skipOnboarding);

    var placeSkip = root.querySelector('#onboardingPlaceSkip');
    if (placeSkip) placeSkip.addEventListener('click', function () {
      var placeInput = root.querySelector('#onboardingPlace');
      form.birthPlace = placeInput && placeInput.value.trim() ? placeInput.value.trim().slice(0, 120) : 'Δεν δηλώθηκε';
      form.birthLatitude = null;
      form.birthLongitude = null;
      form.birthTimezone = '';
      step = 3;
      render();
    });

    var placeInput = root.querySelector('#onboardingPlace');
    if (placeInput) placeInput.addEventListener('input', function () {
      var query = placeInput.value.trim();
      form.birthLatitude = null;
      form.birthLongitude = null;
      form.birthTimezone = '';
      window.clearTimeout(placeSearchTimer);
      if (placeSearchController) placeSearchController.abort();
      if (query.length < 3) return;
      placeSearchTimer = window.setTimeout(function () { searchPlaceWhileTyping(query); }, 350);
    });
  }

  function skipOnboarding() {
    write(FLOW_KEY, true);
    var savedProfile = read(STORAGE_KEY, null);
    var signId = 'aries';
    if (savedProfile && savedProfile.birthDate && window.Astro) {
      var sign = window.Astro.signForDate(new Date(savedProfile.birthDate + 'T12:00:00'));
      if (sign) signId = sign.id;
    }
    window.location.href = 'horoscope.html?sign=' + signId;
  }

  function searchPlaceWhileTyping(query) {
    var host = root.querySelector('#onboardingPlaceResults');
    if (!host || !window.PlaceResolver) return;
    var requestId = ++placeRequestId;
    host.innerHTML = '<p class="onboarding-choice-title">Αναζήτηση πόλης…</p>';
    if (window.AbortController) placeSearchController = new AbortController();
    window.PlaceResolver.search(query, placeSearchController ? { signal: placeSearchController.signal } : null).then(function (items) {
      if (requestId === placeRequestId) showPlaceResults(items);
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;
      if (requestId === placeRequestId) showPlaceResults([]);
    });
  }

  function showPlaceResults(items) {
    var host = root.querySelector('#onboardingPlaceResults');
    if (!host) return;
    if (!items.length) {
      host.innerHTML = '<p class="onboarding-form-error">Δεν βρέθηκε πόλη. Δοκίμασε «Πόλη, Χώρα» ή μια κοντινή μεγαλύτερη πόλη.</p>';
      return;
    }
    host.innerHTML = '<p class="onboarding-choice-title">Επίλεξε τον σωστό τόπο</p>';
    items.forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'place-choice';
      button.textContent = item.name;
      button.addEventListener('click', function () {
        form.birthPlace = item.name;
        form.birthLatitude = item.latitude;
        form.birthLongitude = item.longitude;
        form.birthTimezone = item.timezone;
        step = 3;
        render();
      });
      host.appendChild(button);
    });
  }

  function next() {
    if (step === 1) {
      var dateInput = root.querySelector('#onboardingDate');
      var timeInput = root.querySelector('#onboardingTime');
      if (!dateInput.value || new Date(dateInput.value + 'T12:00:00') > new Date()) { dateInput.reportValidity(); return; }
      if (form.timeKnown && !timeInput.value) { timeInput.reportValidity(); return; }
      form.birthDate = dateInput.value;
      form.birthTime = form.timeKnown ? timeInput.value : '';
      step = 2;
    } else if (step === 2) {
      var placeInput = root.querySelector('#onboardingPlace');
      if (!placeInput.value.trim()) { placeInput.reportValidity(); return; }
      form.birthPlace = placeInput.value.trim().slice(0, 120);
      if (form.birthLatitude !== null && form.birthLongitude !== null && form.birthTimezone) { step = 3; render(); return; }
      var button = root.querySelector('#onboardingPlaceNext');
      button.disabled = true;
      button.textContent = 'Αναζήτηση πόλης…';
      if (!window.PlaceResolver) { showPlaceResults([]); button.disabled = false; button.textContent = 'Συνέχεια'; return; }
      window.PlaceResolver.search(form.birthPlace).then(showPlaceResults).catch(function () { showPlaceResults([]); }).then(function () {
        button.disabled = false;
        button.textContent = 'Συνέχεια';
      });
      return;
    } else if (step === 3) {
      write(STORAGE_KEY, form);
      write(FLOW_KEY, true);
      if (window.Auth && window.Auth.current()) window.Auth.updateProfile(form, function () {});
      var sign = window.Astro.signForDate(new Date(form.birthDate + 'T12:00:00'));
      window.location.href = 'horoscope.html?sign=' + (sign ? sign.id : 'aries');
      return;
    } else {
      step = 1;
    }
    render();
  }

  function init() {
    root = document.createElement('div');
    root.className = 'onboarding';
    root.id = 'onboarding';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Συμπλήρωσε τα στοιχεία γέννησής σου');
    document.body.appendChild(root);

    var forced = new URLSearchParams(window.location.search).get('onboarding') === '1';
    if (forced || !read(FLOW_KEY, false)) show();
  }

  window.TarotakiOnboarding = { open: show, profile: function () { return read(STORAGE_KEY, null); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
