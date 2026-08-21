/* ==========================================================================
   Ταρωτάκι — natal.js
   Τα «τρία μεγάλα» του χρήστη από τα στοιχεία γέννησης:
   Ήλιος (ζώδιο), Σελήνη, Ωροσκόπος.

   Τι χρειάζεται το καθένα:
     Ήλιος      — μόνο ημερομηνία. Πάντα σωστός.
     Σελήνη     — ημερομηνία + ώρα. Η Σελήνη αλλάζει ζώδιο κάθε ~2,5 μέρες,
                  οπότε χωρίς ώρα υπάρχει μικρή πιθανότητα λάθους στα όρια.
     Ωροσκόπος  — ημερομηνία + ώρα + ΤΟΠΟΣ. Αλλάζει ζώδιο κάθε ~2 ώρες, άρα
                  χωρίς ακριβή τόπο και ώρα δεν υπολογίζεται καθόλου.

   Απαιτεί ephemeris.js και astro.js.
   ========================================================================== */

(function (global) {
  'use strict';

  var E = global.Ephemeris;
  var A = global.Astro;

  var D2R = Math.PI / 180;
  var R2D = 180 / Math.PI;

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  /* ---------------------------------------------------------------------
     Τόποι γέννησης

     Κρατάμε ελληνικές και κυπριακές πόλεις, που καλύπτουν το κοινό μας.
     Για άγνωστο τόπο ΔΕΝ μαντεύουμε: ο ωροσκόπος μένει κενός με εξήγηση,
     γιατί λάθος ωροσκόπος είναι χειρότερος από κανέναν.
     --------------------------------------------------------------------- */

  var CITIES = [
    { key: 'αθηνα',        lat: 37.98, lon: 23.73 },
    { key: 'πειραιας',     lat: 37.94, lon: 23.65 },
    { key: 'θεσσαλονικη',  lat: 40.64, lon: 22.94 },
    { key: 'πατρα',        lat: 38.25, lon: 21.73 },
    { key: 'ηρακλειο',     lat: 35.34, lon: 25.13 },
    { key: 'λαρισα',       lat: 39.64, lon: 22.42 },
    { key: 'βολος',        lat: 39.36, lon: 22.94 },
    { key: 'ιωαννινα',     lat: 39.67, lon: 20.85 },
    { key: 'καβαλα',       lat: 40.94, lon: 24.41 },
    { key: 'σερρες',       lat: 41.09, lon: 23.55 },
    { key: 'χανια',        lat: 35.51, lon: 24.02 },
    { key: 'ροδος',        lat: 36.43, lon: 28.22 },
    { key: 'χαλκιδα',      lat: 38.46, lon: 23.60 },
    { key: 'καλαματα',     lat: 37.04, lon: 22.11 },
    { key: 'κατερινη',     lat: 40.27, lon: 22.51 },
    { key: 'τριπολη',      lat: 37.51, lon: 22.37 },
    { key: 'κοζανη',       lat: 40.30, lon: 21.79 },
    { key: 'δραμα',        lat: 41.15, lon: 24.15 },
    { key: 'αλεξανδρουπολη', lat: 40.85, lon: 25.87 },
    { key: 'κερκυρα',      lat: 39.62, lon: 19.92 },
    { key: 'μυτιληνη',     lat: 39.11, lon: 26.55 },
    { key: 'ξανθη',        lat: 41.14, lon: 24.89 },
    { key: 'αγρινιο',      lat: 38.62, lon: 21.41 },
    { key: 'ρεθυμνο',      lat: 35.37, lon: 24.47 },
    { key: 'κορινθος',     lat: 37.94, lon: 22.93 },
    { key: 'λαμια',        lat: 38.90, lon: 22.43 },
    { key: 'τρικαλα',      lat: 39.56, lon: 21.77 },
    { key: 'βεροια',       lat: 40.52, lon: 22.20 },
    { key: 'συρος',        lat: 37.44, lon: 24.94 },
    { key: 'σαντορινη',    lat: 36.39, lon: 25.46 },
    { key: 'λευκωσια',     lat: 35.17, lon: 33.36 },
    { key: 'λεμεσος',      lat: 34.71, lon: 33.02 },
    { key: 'λαρνακα',      lat: 34.92, lon: 33.62 },
    { key: 'παφος',        lat: 34.78, lon: 32.42 }
  ];

  /* Λατινικά ονόματα για όσους γράφουν greeklish ή αγγλικά */
  var ALIASES = {
    'athens': 'αθηνα', 'athina': 'αθηνα', 'thessaloniki': 'θεσσαλονικη',
    'salonica': 'θεσσαλονικη', 'patras': 'πατρα', 'patra': 'πατρα',
    'heraklion': 'ηρακλειο', 'iraklio': 'ηρακλειο', 'larissa': 'λαρισα',
    'volos': 'βολος', 'ioannina': 'ιωαννινα', 'kavala': 'καβαλα',
    'chania': 'χανια', 'hania': 'χανια', 'rhodes': 'ροδος', 'rodos': 'ροδος',
    'kalamata': 'καλαματα', 'corfu': 'κερκυρα', 'kerkyra': 'κερκυρα',
    'nicosia': 'λευκωσια', 'limassol': 'λεμεσος', 'larnaca': 'λαρνακα',
    'paphos': 'παφος', 'piraeus': 'πειραιας', 'peiraias': 'πειραιας'
  };

  /* Χάρτης τόνων. Γράφεται ρητά ανά χαρακτήρα: με δύο παράλληλες
     συμβολοσειρές είχε ξεφύγει το ελληνικό «ί» και δεν έβρισκε ούτε τη
     Θεσσαλονίκη ούτε τη Λευκωσία. */
  var ACCENTS = {
    'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
    'ϊ': 'ι', 'ϋ': 'υ', 'ΐ': 'ι', 'ΰ': 'υ', 'ς': 'σ',
    'à': 'a', 'á': 'a', 'ä': 'a', 'â': 'a',
    'è': 'e', 'é': 'e', 'ë': 'e', 'ê': 'e',
    'ì': 'i', 'í': 'i', 'ï': 'i', 'î': 'i',
    'ò': 'o', 'ó': 'o', 'ö': 'o', 'ô': 'o',
    'ù': 'u', 'ú': 'u', 'ü': 'u', 'û': 'u'
  };

  /* Πεζά, χωρίς τόνους και τελικό σίγμα — ώστε «Αθήνα» = «ΑΘΗΝΑΣ» = «athens» */
  function normalise(text) {
    var s = String(text || '').toLowerCase().split(',')[0].trim();
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      out += ACCENTS.hasOwnProperty(ch) ? ACCENTS[ch] : ch;
    }
    return out.replace(/[^a-zα-ω\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  function findPlace(text) {
    var n = normalise(text);
    if (!n) return null;
    if (ALIASES[n]) n = ALIASES[n];

    for (var i = 0; i < CITIES.length; i++) {
      var k = CITIES[i].key;
      if (n === k) return CITIES[i];
    }
    /* Χαλαρό ταίριασμα: «αθηνα ελλαδα», «νεα σμυρνη αθηνα» */
    for (var j = 0; j < CITIES.length; j++) {
      if (n.indexOf(CITIES[j].key) !== -1) return CITIES[j];
    }
    return null;
  }

  /* ---------------------------------------------------------------------
     Ζώνη ώρας Ελλάδας / Κύπρου
     EET (+2) τον χειμώνα, EEST (+3) το καλοκαίρι. Ο κανόνας της ΕΕ ισχύει
     από το 1981: από την τελευταία Κυριακή Μαρτίου ως την τελευταία
     Κυριακή Οκτωβρίου.
     --------------------------------------------------------------------- */

  function lastSundayUTC(year, month) {
    var d = new Date(Date.UTC(year, month + 1, 0));   // τελευταία μέρα του μήνα
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
  }

  function greeceOffsetHours(year, month, day, hour, minute) {
    if (year < 1981) return 2;                        // πριν τον κανόνα της ΕΕ
    var local = Date.UTC(year, month - 1, day, hour, minute);
    var start = lastSundayUTC(year, 2).getTime() + 3 * 3600000;   // Μάρτιος 03:00
    var end   = lastSundayUTC(year, 9).getTime() + 4 * 3600000;   // Οκτώβριος 04:00
    return (local >= start && local < end) ? 3 : 2;
  }

  /* Μετατρέπει τοπική ώρα IANA (π.χ. Europe/Athens) σε UTC. Το Intl έχει
     τη βάση ζωνών ώρας του λειτουργικού, άρα καλύπτονται και ιστορικές
     αλλαγές θερινής ώρας — όχι μόνο η σημερινή Ελλάδα/Κύπρος. */
  function timeZoneOffsetHours(timeZone, timestamp) {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date(timestamp));
      var map = {};
      parts.forEach(function (part) { if (part.type !== 'literal') map[part.type] = part.value; });
      var shownAsUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
      return (shownAsUtc - timestamp) / 3600000;
    } catch (error) { return null; }
  }

  function localTimeToUtc(year, month, day, hour, minute, timeZone) {
    var localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    var offset = timeZoneOffsetHours(timeZone, localAsUtc);
    if (offset === null) return null;
    var utc = localAsUtc - offset * 3600000;
    var corrected = timeZoneOffsetHours(timeZone, utc);
    return localAsUtc - (corrected === null ? offset : corrected) * 3600000;
  }

  /* ---------------------------------------------------------------------
     Αστρονομία
     --------------------------------------------------------------------- */

  function julianDay(y, m, d, hourUTC) {
    if (m <= 2) { y -= 1; m += 12; }
    var a = Math.floor(y / 100);
    var b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) +
           d + b - 1524.5 + hourUTC / 24;
  }

  /* Μέσος αστρικός χρόνος Γκρίνουιτς, σε μοίρες */
  function gmst(jd) {
    var t = (jd - 2451545.0) / 36525;
    var g = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
            0.000387933 * t * t - (t * t * t) / 38710000;
    return norm360(g);
  }

  /* Ωροσκόπος: το εκλειπτικό μήκος που ανατέλλει στον ορίζοντα */
  function ascendant(jd, latitude, longitude) {
    var t = (jd - 2451545.0) / 36525;
    var obliquity = 23.439291 - 0.0130042 * t;
    var ramc = norm360(gmst(jd) + longitude);         // τοπικός αστρικός χρόνος

    var r = ramc * D2R, e = obliquity * D2R, f = latitude * D2R;
    var y = Math.cos(r);
    var x = -(Math.sin(r) * Math.cos(e) + Math.tan(f) * Math.sin(e));

    return norm360(Math.atan2(y, x) * R2D);
  }

  /* ---------------------------------------------------------------------
     Δημόσιο API
     --------------------------------------------------------------------- */

  function signOfLongitude(lon) {
    return E.SIGN_IDS[Math.floor(norm360(lon) / 30)];
  }

  function part(signId, lon) {
    return {
      sign: signId,                       /* π.χ. 'cancer' — το όνομα το βρίσκει ο καλών */
      degree: norm360(lon) % 30,
      longitude: norm360(lon)
    };
  }

  /**
   * profile = { birthDate: 'YYYY-MM-DD', birthTime: 'HH:MM', birthPlace: '…' }
   * Επιστρέφει { sun, moon, ascendant, place, needs: [...] }
   * Ό,τι δεν μπορεί να υπολογιστεί επιστρέφεται null, με λόγο στο needs.
   */
  function compute(profile) {
    profile = profile || {};
    var needs = [];

    var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.birthDate || '');
    if (!dm) return { sun: null, moon: null, ascendant: null, place: null, needs: ['date'] };

    var y = Number(dm[1]), mo = Number(dm[2]), da = Number(dm[3]);

    var tm = /^(\d{2}):(\d{2})$/.exec(profile.birthTime || '');
    var hasTime = !!tm;
    if (!hasTime) needs.push('time');

    var hh = hasTime ? Number(tm[1]) : 12;
    var mi = hasTime ? Number(tm[2]) : 0;

    var timeZone = String(profile.birthTimezone || '');
    var utcMillis = timeZone ? localTimeToUtc(y, mo, da, hh, mi, timeZone) : null;
    var offset = utcMillis === null ? greeceOffsetHours(y, mo, da, hh, mi) : (Date.UTC(y, mo - 1, da, hh, mi) - utcMillis) / 3600000;
    var jd = julianDay(y, mo, da, hh + mi / 60 - offset);
    var when = new Date((jd - 2440587.5) * 86400000);

    var sunLon = E.longitudeOf('sun', jd);
    var moonLon = E.longitudeOf('moon', jd);

    var hasCoordinates = profile.birthLatitude !== null && profile.birthLatitude !== '' &&
      profile.birthLongitude !== null && profile.birthLongitude !== '' &&
      isFinite(Number(profile.birthLatitude)) && isFinite(Number(profile.birthLongitude));
    var place = hasCoordinates ? {
      lat: Number(profile.birthLatitude), lon: Number(profile.birthLongitude), timezone: timeZone
    } : findPlace(profile.birthPlace);
    var asc = null;
    if (!profile.birthPlace) needs.push('place');
    else if (!place) needs.push('placeUnknown');
    else if (!hasTime) { /* ο ωροσκόπος χρειάζεται οπωσδήποτε ώρα */ }
    else {
      var ascLon = ascendant(jd, place.lat, place.lon);
      asc = part(signOfLongitude(ascLon), ascLon);
    }

    return {
      sun: part(signOfLongitude(sunLon), sunLon),
      moon: part(signOfLongitude(moonLon), moonLon),
      moonApproximate: !hasTime,
      ascendant: asc,
      place: place,
      when: when,
      offsetHours: offset,
      needs: needs
    };
  }

  global.Natal = {
    CITIES: CITIES,
    compute: compute,
    findPlace: findPlace,
    normalise: normalise,
    ascendant: ascendant,
    gmst: gmst,
    julianDay: julianDay,
    greeceOffsetHours: greeceOffsetHours,
    timeZoneOffsetHours: timeZoneOffsetHours,
    localTimeToUtc: localTimeToUtc
  };
})(window);
