/* ==========================================================================
   Ταρωτάκι — ephemeris.js
   Πραγματικές θέσεις πλανητών. Καμία εξάρτηση, τρέχει στον browser.

   Μέθοδοι:
   - Ήλιος:    Meeus, τύπος χαμηλής ακρίβειας            (~0.01°)
   - Σελήνη:   Meeus κεφ. 47, κύριοι όροι μήκους         (~0.02°)
   - Πλανήτες: JPL προσεγγιστικά στοιχεία Kepler,
               έγκυρα για 1800–2050                      (~1–2 λεπτά τόξου)

   Η ακρίβεια είναι υπεραρκετή για τοποθέτηση σε ζώδιο (τομείς 30°) και
   για όψεις με περιθώριο (orb) λίγων μοιρών.
   ========================================================================== */

(function (global) {
  'use strict';

  var D2R = Math.PI / 180;
  var R2D = 180 / Math.PI;

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function sind(x) { return Math.sin(x * D2R); }
  function cosd(x) { return Math.cos(x * D2R); }

  /* Ιουλιανή ημερομηνία από Date */
  function toJD(date) { return date.getTime() / 86400000 + 2440587.5; }

  /* ---------------------------------------------------------------------
     Ήλιος — γεωκεντρικό εκλειπτικό μήκος
     --------------------------------------------------------------------- */

  function sunLongitude(jd) {
    var n = jd - 2451545.0;
    var L = norm360(280.460 + 0.9856474 * n);
    var g = norm360(357.528 + 0.9856003 * n);
    return norm360(L + 1.915 * sind(g) + 0.020 * sind(2 * g));
  }

  /* ---------------------------------------------------------------------
     Σελήνη — Meeus κεφ. 47, οι 19 μεγαλύτεροι όροι
     --------------------------------------------------------------------- */

  function moonLongitude(jd) {
    var T = (jd - 2451545.0) / 36525;
    var T2 = T * T, T3 = T2 * T, T4 = T3 * T;

    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
    var D  = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
    var M  = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
    var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
    var F  = 93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;

    Lp = norm360(Lp); D = norm360(D); M = norm360(M); Mp = norm360(Mp); F = norm360(F);

    var s =
        6.288774 * sind(Mp)
      + 1.274027 * sind(2 * D - Mp)
      + 0.658314 * sind(2 * D)
      + 0.213618 * sind(2 * Mp)
      - 0.185116 * sind(M)
      - 0.114332 * sind(2 * F)
      + 0.058793 * sind(2 * D - 2 * Mp)
      + 0.057066 * sind(2 * D - M - Mp)
      + 0.053322 * sind(2 * D + Mp)
      + 0.045758 * sind(2 * D - M)
      - 0.040923 * sind(M - Mp)
      - 0.034720 * sind(D)
      - 0.030383 * sind(M + Mp)
      + 0.015327 * sind(2 * D - 2 * F)
      - 0.012528 * sind(Mp + 2 * F)
      + 0.010980 * sind(Mp - 2 * F)
      + 0.010675 * sind(4 * D - Mp)
      + 0.010034 * sind(3 * Mp)
      + 0.008548 * sind(4 * D - 2 * Mp);

    return norm360(Lp + s);
  }

  /* ---------------------------------------------------------------------
     Πλανήτες — JPL προσεγγιστικά στοιχεία Kepler (epoch J2000)
     Σειρά: a, e, I, L, longitude of perihelion, longitude of node
     Δεύτερη γραμμή: ρυθμοί μεταβολής ανά ιουλιανό αιώνα
     --------------------------------------------------------------------- */

  var ELEMENTS = {
    mercury: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593],
              [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
    venus:   [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255],
              [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
    earth:   [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
              [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0]],
    mars:    [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
              [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
    jupiter: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
              [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
    saturn:  [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
              [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
    uranus:  [[19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503],
              [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]],
    neptune: [[30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
              [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]],
    pluto:   [[39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 110.30393684],
              [-0.00031596, 0.00005170, 0.00004818, 145.20780515, -0.04062942, -0.01183482]]
  };

  /* Ηλιοκεντρικές εκλειπτικές συντεταγμένες */
  function heliocentric(name, jd) {
    var el = ELEMENTS[name];
    var T = (jd - 2451545.0) / 36525;

    var a  = el[0][0] + el[1][0] * T;
    var e  = el[0][1] + el[1][1] * T;
    var I  = el[0][2] + el[1][2] * T;
    var L  = el[0][3] + el[1][3] * T;
    var pi = el[0][4] + el[1][4] * T;
    var om = el[0][5] + el[1][5] * T;

    var w = pi - om;                 // όρισμα περιηλίου
    var M = norm360(L - pi);
    if (M > 180) M -= 360;

    // Εξίσωση του Kepler, με Newton-Raphson
    var estar = R2D * e;
    var E = M + estar * sind(M);
    for (var i = 0; i < 8; i++) {
      var dM = M - (E - estar * sind(E));
      E += dM / (1 - e * cosd(E));
    }

    var xp = a * (cosd(E) - e);
    var yp = a * Math.sqrt(1 - e * e) * sind(E);

    var cw = cosd(w), sw = sind(w);
    var co = cosd(om), so = sind(om);
    var ci = cosd(I), si = sind(I);

    return {
      x: (cw * co - sw * so * ci) * xp + (-sw * co - cw * so * ci) * yp,
      y: (cw * so + sw * co * ci) * xp + (-sw * so + cw * co * ci) * yp,
      z: (sw * si) * xp + (cw * si) * yp
    };
  }

  function planetLongitude(name, jd) {
    var p = heliocentric(name, jd);
    var e = heliocentric('earth', jd);
    return norm360(Math.atan2(p.y - e.y, p.x - e.x) * R2D);
  }

  /* ---------------------------------------------------------------------
     Δημόσιο API
     --------------------------------------------------------------------- */

  var BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
                'uranus', 'neptune', 'pluto'];

  /* Τα σώματα που χρησιμοποιεί η ημερήσια πρόβλεψη */
  var PERSONAL = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  var SIGN_IDS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
                  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

  /* Παραδοσιακοί κυβερνήτες των ζωδίων */
  var RULERS = {
    aries: 'mars',       taurus: 'venus',    gemini: 'mercury',
    cancer: 'moon',      leo: 'sun',         virgo: 'mercury',
    libra: 'venus',      scorpio: 'pluto',   sagittarius: 'jupiter',
    capricorn: 'saturn', aquarius: 'uranus', pisces: 'neptune'
  };

  /* Σύγχρονοι κυβερνήτες που δεν είναι στα προσωπικά σώματα -> εφεδρεία */
  var RULER_FALLBACK = { pluto: 'mars', uranus: 'saturn', neptune: 'jupiter' };

  function rulerOf(signId) {
    var r = RULERS[signId];
    return PERSONAL.indexOf(r) === -1 ? RULER_FALLBACK[r] : r;
  }

  function longitudeOf(body, jd) {
    if (body === 'sun') return sunLongitude(jd);
    if (body === 'moon') return moonLongitude(jd);
    return planetLongitude(body, jd);
  }

  function position(body, date) {
    var jd = toJD(date);
    var lon = longitudeOf(body, jd);
    var idx = Math.floor(norm360(lon) / 30);

    // Ανάδρομη κίνηση: σύγκριση με μία ημέρα μετά
    var retro = false;
    if (body !== 'sun' && body !== 'moon') {
      var delta = ((longitudeOf(body, jd + 1) - lon + 540) % 360) - 180;
      retro = delta < 0;
    }

    return {
      body: body,
      longitude: lon,
      sign: SIGN_IDS[idx],
      signIndex: idx,
      degree: lon - idx * 30,
      retrograde: retro
    };
  }

  function positions(date, bodies) {
    var out = {};
    (bodies || BODIES).forEach(function (b) { out[b] = position(b, date); });
    return out;
  }

  /* ---------------------------------------------------------------------
     Όψεις
     --------------------------------------------------------------------- */

  var ASPECTS = [
    { key: 'conjunction', angle: 0,   orb: 8, harmony: 'neutral' },
    { key: 'sextile',     angle: 60,  orb: 4, harmony: 'easy' },
    { key: 'square',      angle: 90,  orb: 6, harmony: 'hard' },
    { key: 'trine',       angle: 120, orb: 6, harmony: 'easy' },
    { key: 'opposition',  angle: 180, orb: 7, harmony: 'hard' }
  ];

  function separation(a, b) {
    var d = Math.abs(norm360(a) - norm360(b)) % 360;
    return d > 180 ? 360 - d : d;
  }

  function aspectBetween(lonA, lonB) {
    var sep = separation(lonA, lonB);
    for (var i = 0; i < ASPECTS.length; i++) {
      var asp = ASPECTS[i];
      var diff = Math.abs(sep - asp.angle);
      if (diff <= asp.orb) {
        return {
          key: asp.key, harmony: asp.harmony, angle: asp.angle,
          orb: diff, exact: diff < 1
        };
      }
    }
    return null;
  }

  /* Όλες οι όψεις μιας ημέρας, ταξινομημένες από τη στενότερη */
  function aspects(pos, bodies) {
    var list = bodies || PERSONAL;
    var out = [];
    for (var i = 0; i < list.length; i++) {
      for (var j = i + 1; j < list.length; j++) {
        var a = pos[list[i]], b = pos[list[j]];
        if (!a || !b) continue;
        var asp = aspectBetween(a.longitude, b.longitude);
        if (asp) { asp.a = list[i]; asp.b = list[j]; out.push(asp); }
      }
    }
    return out.sort(function (x, y) { return x.orb - y.orb; });
  }

  /* Όψεις ενός συγκεκριμένου σώματος προς τα υπόλοιπα */
  function aspectsTo(pos, body, bodies) {
    return aspects(pos, bodies).filter(function (a) {
      return a.a === body || a.b === body;
    });
  }

  /* Πότε η Σελήνη μπαίνει στο επόμενο ζώδιο (προσέγγιση με δυαδική
     αναζήτηση σε βήματα ωρών) */
  function nextMoonIngress(date) {
    var jd = toJD(date);
    var start = Math.floor(norm360(moonLongitude(jd)) / 30);
    for (var h = 1; h <= 24 * 4; h++) {
      var t = jd + h / 24;
      if (Math.floor(norm360(moonLongitude(t)) / 30) !== start) {
        return {
          date: new Date((t - 2440587.5) * 86400000),
          sign: SIGN_IDS[Math.floor(norm360(moonLongitude(t)) / 30)]
        };
      }
    }
    return null;
  }

  global.Ephemeris = {
    toJD: toJD,
    norm360: norm360,
    BODIES: BODIES,
    PERSONAL: PERSONAL,
    SIGN_IDS: SIGN_IDS,
    ASPECTS: ASPECTS,
    RULERS: RULERS,
    rulerOf: rulerOf,
    longitudeOf: longitudeOf,
    position: position,
    positions: positions,
    separation: separation,
    aspectBetween: aspectBetween,
    aspects: aspects,
    aspectsTo: aspectsTo,
    nextMoonIngress: nextMoonIngress
  };
})(window);
