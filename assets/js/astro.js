/* ==========================================================================
   Ταρωτάκι — astro.js
   Δεδομένα ζωδίων, υπολογισμός φάσης σελήνης, τράπουλα ταρώ, συμβατότητα.
   Καθαρές συναρτήσεις, χωρίς εξαρτήσεις. Όλα τρέχουν στον browser.
   ========================================================================== */

(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------
     Ζώδια
     element: fire | earth | air | water
     modality: cardinal | fixed | mutable
     --------------------------------------------------------------------- */

  var ZODIAC = [
    { id: 'aries',       glyph: '♈', icon: 'assets/zodiac_icons/aries.webp',       element: 'fire',  modality: 'cardinal', from: [3, 21],  to: [4, 19],
      el: { name: 'Κριός',      range: '21 Μαρ – 19 Απρ', acc: 'τον Κριό', ruler: 'Άρης' },
      en: { name: 'Aries',      range: '21 Mar – 19 Apr', ruler: 'Mars' } },

    { id: 'taurus',      glyph: '♉', icon: 'assets/zodiac_icons/taurus.webp',  element: 'earth', modality: 'fixed',    from: [4, 20],  to: [5, 20],
      el: { name: 'Ταύρος',     range: '20 Απρ – 20 Μαΐ', acc: 'τον Ταύρο', ruler: 'Αφροδίτη' },
      en: { name: 'Taurus',     range: '20 Apr – 20 May', ruler: 'Venus' } },

    { id: 'gemini',      glyph: '♊', icon: 'assets/zodiac_icons/gemini.webp',      element: 'air',   modality: 'mutable',  from: [5, 21],  to: [6, 20],
      el: { name: 'Δίδυμοι',    range: '21 Μαΐ – 20 Ιουν', acc: 'τους Διδύμους', ruler: 'Ερμής' },
      en: { name: 'Gemini',     range: '21 May – 20 Jun', ruler: 'Mercury' } },

    { id: 'cancer',      glyph: '♋', icon: 'assets/zodiac_icons/cancer.webp',      element: 'water', modality: 'cardinal', from: [6, 21],  to: [7, 22],
      el: { name: 'Καρκίνος',   range: '21 Ιουν – 22 Ιουλ', acc: 'τον Καρκίνο', ruler: 'Σελήνη' },
      en: { name: 'Cancer',     range: '21 Jun – 22 Jul', ruler: 'Moon' } },

    { id: 'leo',         glyph: '♌', icon: 'assets/zodiac_icons/leo.webp',         element: 'fire',  modality: 'fixed',    from: [7, 23],  to: [8, 22],
      el: { name: 'Λέων',       range: '23 Ιουλ – 22 Αυγ', acc: 'τον Λέοντα', ruler: 'Ήλιος' },
      en: { name: 'Leo',        range: '23 Jul – 22 Aug', ruler: 'Sun' } },

    { id: 'virgo',       glyph: '♍', icon: 'assets/zodiac_icons/virgo.webp',       element: 'earth', modality: 'mutable',  from: [8, 23],  to: [9, 22],
      el: { name: 'Παρθένος',   range: '23 Αυγ – 22 Σεπ', acc: 'την Παρθένο', ruler: 'Ερμής' },
      en: { name: 'Virgo',      range: '23 Aug – 22 Sep', ruler: 'Mercury' } },

    { id: 'libra',       glyph: '♎', icon: 'assets/zodiac_icons/libra.webp',       element: 'air',   modality: 'cardinal', from: [9, 23],  to: [10, 22],
      el: { name: 'Ζυγός',      range: '23 Σεπ – 22 Οκτ', acc: 'τον Ζυγό', ruler: 'Αφροδίτη' },
      en: { name: 'Libra',      range: '23 Sep – 22 Oct', ruler: 'Venus' } },

    { id: 'scorpio',     glyph: '♏', icon: 'assets/zodiac_icons/scorpio.webp',     element: 'water', modality: 'fixed',    from: [10, 23], to: [11, 21],
      el: { name: 'Σκορπιός',   range: '23 Οκτ – 21 Νοε', acc: 'τον Σκορπιό', ruler: 'Πλούτωνας' },
      en: { name: 'Scorpio',    range: '23 Oct – 21 Nov', ruler: 'Pluto' } },

    { id: 'sagittarius', glyph: '♐', icon: 'assets/zodiac_icons/sagittarius.webp', element: 'fire',  modality: 'mutable',  from: [11, 22], to: [12, 21],
      el: { name: 'Τοξότης',    range: '22 Νοε – 21 Δεκ', acc: 'τον Τοξότη', ruler: 'Δίας' },
      en: { name: 'Sagittarius', range: '22 Nov – 21 Dec', ruler: 'Jupiter' } },

    { id: 'capricorn',   glyph: '♑', icon: 'assets/zodiac_icons/capricorn.webp',   element: 'earth', modality: 'cardinal', from: [12, 22], to: [1, 19],
      el: { name: 'Αιγόκερως',  range: '22 Δεκ – 19 Ιαν', acc: 'τον Αιγόκερω', ruler: 'Κρόνος' },
      en: { name: 'Capricorn',  range: '22 Dec – 19 Jan', ruler: 'Saturn' } },

    { id: 'aquarius',    glyph: '♒', icon: 'assets/zodiac_icons/aquarius.webp',    element: 'air',   modality: 'fixed',    from: [1, 20],  to: [2, 18],
      el: { name: 'Υδροχόος',   range: '20 Ιαν – 18 Φεβ', acc: 'τον Υδροχόο', ruler: 'Ουρανός' },
      en: { name: 'Aquarius',   range: '20 Jan – 18 Feb', ruler: 'Uranus' } },

    { id: 'pisces',      glyph: '♓', icon: 'assets/zodiac_icons/pisces.webp',      element: 'water', modality: 'mutable',  from: [2, 19],  to: [3, 20],
      el: { name: 'Ιχθύες',     range: '19 Φεβ – 20 Μαρ', acc: 'τους Ιχθύες', ruler: 'Ποσειδώνας' },
      en: { name: 'Pisces',     range: '19 Feb – 20 Mar', ruler: 'Neptune' } }
  ];

  function signById(id) {
    for (var i = 0; i < ZODIAC.length; i++) {
      if (ZODIAC[i].id === id) return ZODIAC[i];
    }
    return null;
  }

  /* Βρίσκει το ζώδιο από ημερομηνία γέννησης */
  function signForDate(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    for (var i = 0; i < ZODIAC.length; i++) {
      var s = ZODIAC[i];
      var fm = s.from[0], fd = s.from[1], tm = s.to[0], td = s.to[1];
      if (fm > tm) {
        // Αιγόκερως: περνάει από τον Δεκέμβριο στον Ιανουάριο
        if ((m === fm && d >= fd) || (m === tm && d <= td)) return s;
      } else if ((m === fm && d >= fd) || (m === tm && d <= td)) {
        return s;
      }
    }
    return null;
  }

  /* ---------------------------------------------------------------------
     Ντετερμινιστική τυχαιότητα
     Ίδια είσοδος -> ίδιο αποτέλεσμα. Έτσι η "πρόβλεψη της ημέρας"
     μένει σταθερή όλη μέρα και δεν αλλάζει σε κάθε refresh.
     --------------------------------------------------------------------- */

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* mulberry32 — μικρή, γρήγορη γεννήτρια ψευδοτυχαίων */
  function seededRandom(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Κλειδί ημέρας σε τοπική ώρα: "2026-08-20" */
  function dayKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /* ---------------------------------------------------------------------
     Φάση σελήνης
     Αναφορά: νέα σελήνη 6 Ιαν 2000, 18:14 UTC (JD 2451550.1)
     Συνοδικός μήνας: 29.530588853 ημέρες
     Ακρίβεια ~ λίγες ώρες — αρκετή για εμφάνιση φάσης.
     --------------------------------------------------------------------- */

  var SYNODIC = 29.530588853;
  var NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14, 0);

  var PHASE_KEYS = [
    'newMoon', 'waxingCrescent', 'firstQuarter', 'waxingGibbous',
    'fullMoon', 'waningGibbous', 'lastQuarter', 'waningCrescent'
  ];

  function moonPhase(date) {
    var days = (date.getTime() - NEW_MOON_EPOCH) / 86400000;
    var age = days % SYNODIC;
    if (age < 0) age += SYNODIC;

    var phase = age / SYNODIC;                       // 0 = νέα, 0.5 = πανσέληνος
    var illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;

    // Κατηγοριοποίηση σε 8 φάσεις, με τις "ακριβείς" (νέα/τέταρτα/πανσέληνος)
    // να πιάνουν στενό παράθυρο γύρω από το ακριβές σημείο.
    var idx;
    var p = phase;
    if      (p < 0.0225 || p >= 0.9775) idx = 0;
    else if (p < 0.2275)                idx = 1;
    else if (p < 0.2725)                idx = 2;
    else if (p < 0.4775)                idx = 3;
    else if (p < 0.5225)                idx = 4;
    else if (p < 0.7275)                idx = 5;
    else if (p < 0.7725)                idx = 6;
    else                                idx = 7;

    return {
      phase: phase,
      age: age,
      illumination: illumination,
      index: idx,
      key: PHASE_KEYS[idx],
      waxing: phase < 0.5,
      nextNewMoon: new Date(date.getTime() + (SYNODIC - age) * 86400000),
      nextFullMoon: new Date(
        date.getTime() + (((0.5 - phase + 1) % 1) * SYNODIC) * 86400000
      )
    };
  }

  /* Δημιουργεί SVG path για τον φωτισμένο δίσκο της σελήνης.
     r = ακτίνα, phase = 0..1 */
  function moonPath(r, phase) {
    var d = Math.cos(2 * Math.PI * phase);   // 1 = νέα, -1 = πανσέληνος
    var rx = Math.abs(d) * r;
    var waxing = phase < 0.5;

    // Εξωτερικό ημικύκλιο: δεξιά όταν αυξάνει, αριστερά όταν φθίνει.
    var outerSweep = waxing ? 1 : 0;
    // Ο τερματιστής (η καμπύλη διαχωρισμού φωτός/σκιάς).
    var innerSweep;
    if (waxing) innerSweep = d > 0 ? 0 : 1;
    else        innerSweep = d > 0 ? 1 : 0;

    return 'M 0 ' + (-r) +
           ' A ' + r + ' ' + r + ' 0 0 ' + outerSweep + ' 0 ' + r +
           ' A ' + rx + ' ' + r + ' 0 0 ' + innerSweep + ' 0 ' + (-r) +
           ' Z';
  }

  /* ---------------------------------------------------------------------
     Ταρώ — Μείζονα Αρκάνα (22 κάρτες)
     --------------------------------------------------------------------- */

  var TAROT = [
    { n: 0,  roman: '0',      glyph: '♅', el: { name: 'Ο Τρελός',           key: 'Νέα αρχή, εμπιστοσύνη, άλμα στο άγνωστο' },        en: { name: 'The Fool',           key: 'New beginnings, trust, a leap of faith' } },
    { n: 1,  roman: 'I',      glyph: '☿', el: { name: 'Ο Μάγος',            key: 'Δύναμη, πρωτοβουλία, όλα τα εργαλεία στα χέρια σου' }, en: { name: 'The Magician',       key: 'Power, initiative, having every tool you need' } },
    { n: 2,  roman: 'II',     glyph: '☽', el: { name: 'Η Ιέρεια',           key: 'Διαίσθηση, σιωπή, κρυμμένη γνώση' },               en: { name: 'The High Priestess', key: 'Intuition, silence, hidden knowledge' } },
    { n: 3,  roman: 'III',    glyph: '♀', el: { name: 'Η Αυτοκράτειρα',     key: 'Δημιουργία, αφθονία, φροντίδα' },                  en: { name: 'The Empress',        key: 'Creation, abundance, nurture' } },
    { n: 4,  roman: 'IV',     glyph: '♈', el: { name: 'Ο Αυτοκράτορας',     key: 'Δομή, όρια, σταθερότητα' },                        en: { name: 'The Emperor',        key: 'Structure, boundaries, stability' } },
    { n: 5,  roman: 'V',      glyph: '♉', el: { name: 'Ο Ιεροφάντης',       key: 'Παράδοση, καθοδήγηση, μάθηση' },                   en: { name: 'The Hierophant',     key: 'Tradition, guidance, learning' } },
    { n: 6,  roman: 'VI',     glyph: '♊', el: { name: 'Οι Εραστές',         key: 'Επιλογή καρδιάς, ένωση, αξίες' },                  en: { name: 'The Lovers',         key: 'A choice of the heart, union, values' } },
    { n: 7,  roman: 'VII',    glyph: '♋', el: { name: 'Το Άρμα',            key: 'Θέληση, κατεύθυνση, νίκη με έλεγχο' },             en: { name: 'The Chariot',        key: 'Will, direction, victory through control' } },
    { n: 8,  roman: 'VIII',   glyph: '♌', el: { name: 'Η Δύναμη',           key: 'Ήπια δύναμη, θάρρος, υπομονή' },                   en: { name: 'Strength',           key: 'Gentle power, courage, patience' } },
    { n: 9,  roman: 'IX',     glyph: '♍', el: { name: 'Ο Ερημίτης',         key: 'Περισυλλογή, αναζήτηση, εσωτερικό φως' },          en: { name: 'The Hermit',         key: 'Reflection, seeking, inner light' } },
    { n: 10, roman: 'X',      glyph: '♃', el: { name: 'Ο Τροχός της Τύχης', key: 'Κύκλοι, στροφή, συγκυρία' },                       en: { name: 'Wheel of Fortune',   key: 'Cycles, a turn, timing' } },
    { n: 11, roman: 'XI',     glyph: '♎', el: { name: 'Η Δικαιοσύνη',       key: 'Ισορροπία, αλήθεια, συνέπεια' },                   en: { name: 'Justice',            key: 'Balance, truth, consequence' } },
    { n: 12, roman: 'XII',    glyph: '♆', el: { name: 'Ο Κρεμασμένος',      key: 'Παύση, άλλη οπτική, παράδοση' },                   en: { name: 'The Hanged Man',     key: 'Pause, new perspective, surrender' } },
    { n: 13, roman: 'XIII',   glyph: '♏', el: { name: 'Ο Θάνατος',          key: 'Τέλος και μεταμόρφωση — όχι κυριολεκτικά' },       en: { name: 'Death',              key: 'Endings and transformation — not literal' } },
    { n: 14, roman: 'XIV',    glyph: '♐', el: { name: 'Η Εγκράτεια',        key: 'Μέτρο, κράμα, υπομονετική ισορροπία' },            en: { name: 'Temperance',         key: 'Moderation, blending, patient balance' } },
    { n: 15, roman: 'XV',     glyph: '♑', el: { name: 'Ο Διάβολος',         key: 'Εξαρτήσεις, δεσμά που επιλέγουμε' },               en: { name: 'The Devil',          key: 'Attachment, chains we choose' } },
    { n: 16, roman: 'XVI',    glyph: '♂', el: { name: 'Ο Πύργος',           key: 'Ξαφνική αλλαγή, αποκάλυψη, καθαρισμός' },          en: { name: 'The Tower',          key: 'Sudden change, revelation, clearing' } },
    { n: 17, roman: 'XVII',   glyph: '♒', el: { name: 'Το Άστρο',           key: 'Ελπίδα, έμπνευση, ήρεμη πίστη' },                  en: { name: 'The Star',           key: 'Hope, inspiration, quiet faith' } },
    { n: 18, roman: 'XVIII',  glyph: '♓', el: { name: 'Η Σελήνη',           key: 'Όνειρα, αβεβαιότητα, ένστικτο' },                  en: { name: 'The Moon',           key: 'Dreams, uncertainty, instinct' } },
    { n: 19, roman: 'XIX',    glyph: '☉', el: { name: 'Ο Ήλιος',            key: 'Χαρά, διαύγεια, επιτυχία' },                       en: { name: 'The Sun',            key: 'Joy, clarity, success' } },
    { n: 20, roman: 'XX',     glyph: '♇', el: { name: 'Η Κρίση',            key: 'Κάλεσμα, απολογισμός, αφύπνιση' },                 en: { name: 'Judgement',          key: 'A calling, reckoning, awakening' } },
    { n: 21, roman: 'XXI',    glyph: '♄', el: { name: 'Ο Κόσμος',           key: 'Ολοκλήρωση, κλείσιμο κύκλου, πληρότητα' },         en: { name: 'The World',          key: 'Completion, closing a cycle, wholeness' } }
  ];

  /* Κάρτα της ημέρας — σταθερή για όλη τη μέρα */
  function cardOfTheDay(date, salt) {
    var seed = hashString('tarot|' + dayKey(date) + '|' + (salt || ''));
    var rand = seededRandom(seed);
    var card = TAROT[Math.floor(rand() * TAROT.length)];
    return { card: card, reversed: rand() < 0.28 };
  }

  /* Τυχαία κάρτα (για το κουμπί "τράβα ξανά") */
  function drawCard() {
    var i = Math.floor(Math.random() * TAROT.length);
    return { card: TAROT[i], reversed: Math.random() < 0.28 };
  }

  /* ---------------------------------------------------------------------
     Συμβατότητα
     Απλό μοντέλο: στοιχείο + ποιότητα + απόσταση στον ζωδιακό κύκλο.
     Ντετερμινιστικό — το ίδιο ζευγάρι δίνει πάντα το ίδιο σκορ.
     --------------------------------------------------------------------- */

  var ELEMENT_PAIRS = {
    'fire|fire': 88,  'earth|earth': 86, 'air|air': 87,   'water|water': 89,
    'fire|air': 92,   'air|fire': 92,
    'earth|water': 90, 'water|earth': 90,
    'fire|earth': 62, 'earth|fire': 62,
    'fire|water': 54, 'water|fire': 54,
    'air|earth': 58,  'earth|air': 58,
    'air|water': 60,  'water|air': 60
  };

  function compatibility(idA, idB) {
    var a = signById(idA), b = signById(idB);
    if (!a || !b) return null;

    var base = ELEMENT_PAIRS[a.element + '|' + b.element] || 65;

    var ia = ZODIAC.indexOf(a), ib = ZODIAC.indexOf(b);
    var dist = Math.abs(ia - ib);
    if (dist > 6) dist = 12 - dist;

    // Όψεις: τρίγωνο (4) και εξάγωνο (2) βοηθούν, τετράγωνο (3) τρίβει.
    var aspect = 0;
    if (dist === 0) aspect = 4;        // ίδιο ζώδιο
    else if (dist === 2) aspect = 6;   // εξάγωνο
    else if (dist === 3) aspect = -9;  // τετράγωνο
    else if (dist === 4) aspect = 8;   // τρίγωνο
    else if (dist === 6) aspect = 3;   // αντίθεση: έλκονται αλλά κουράζονται
    else aspect = -3;

    // Ίδια ποιότητα σε διαφορετικά ζώδια = σύγκρουση θέλησης.
    var modality = 0;
    if (a.modality === b.modality && dist !== 0) modality = -5;

    // Μικρή σταθερή διακύμανση ώστε τα σκορ να μη μοιάζουν "στρογγυλά".
    var jitter = Math.floor(seededRandom(hashString('compat|' + [idA, idB].sort().join('|')))() * 7) - 3;

    var score = base + aspect + modality + jitter;
    score = Math.max(38, Math.min(98, Math.round(score)));

    var tier;
    if (score >= 85) tier = 'excellent';
    else if (score >= 72) tier = 'good';
    else if (score >= 58) tier = 'mixed';
    else tier = 'challenging';

    return { a: a, b: b, score: score, tier: tier, distance: dist };
  }

  /* ---------------------------------------------------------------------
     Ημερήσια πρόβλεψη (placeholder generator)
     ΠΡΟΣΟΧΗ: το κείμενο εδώ είναι δείγμα για να ζωντανέψει η σελίδα.
     Αντικατάστησέ το με το πραγματικό σου περιεχόμενο ή με API.
     --------------------------------------------------------------------- */

  var FORECAST_FRAGMENTS = {
    el: {
      open: [
        'Η μέρα ξεκινά με καθαρό μυαλό',
        'Κάτι που περίμενες καιρό δείχνει επιτέλους σημάδια κίνησης',
        'Ένα μικρό γεγονός το πρωί δίνει τον τόνο',
        'Η διάθεσή σου σήμερα είναι πιο σταθερή απ’ ό,τι νομίζεις',
        'Μια κουβέντα που απέφευγες γίνεται πιο εύκολη σήμερα'
      ],
      middle: [
        'και οι σχέσεις γύρω σου ζητούν λίγη περισσότερη προσοχή',
        'ενώ στα οικονομικά αξίζει να μην βιαστείς',
        'και η δουλειά σού δίνει την ευκαιρία να δείξεις κάτι δικό σου',
        'ενώ το σώμα σου ζητάει ξεκούραση περισσότερο από ένταση',
        'και μια παλιά ιδέα επιστρέφει με καλύτερο τάιμινγκ'
      ],
      close: [
        'Άφησε χώρο για το απρόοπτο — συνήθως εκεί κρύβεται το καλό.',
        'Μη λες ναι σε όλα· η ενέργειά σου έχει όριο.',
        'Ένα μικρό βήμα σήμερα αξίζει περισσότερο από ένα μεγάλο σχέδιο.',
        'Εμπιστεύσου το ένστικτό σου, αλλά ζήτα και μια δεύτερη γνώμη.',
        'Το βράδυ κλείσε τον κύκλο με κάτι που σε ηρεμεί.'
      ]
    },
    en: {
      open: [
        'The day starts with a clear head',
        'Something you have waited on finally shows movement',
        'A small event this morning sets the tone',
        'Your mood today is steadier than you think',
        'A conversation you were avoiding gets easier today'
      ],
      middle: [
        'and the people around you need a little more attention',
        'while money matters reward patience over speed',
        'and work gives you room to show something of your own',
        'while your body is asking for rest rather than intensity',
        'and an old idea returns with better timing'
      ],
      close: [
        'Leave room for the unexpected — that is usually where the good part hides.',
        'Do not say yes to everything; your energy has a limit.',
        'One small step today beats one big plan.',
        'Trust your instinct, but ask for a second opinion too.',
        'Close the day with something that calms you.'
      ]
    }
  };

  function dailyForecast(signId, date, lang) {
    var L = FORECAST_FRAGMENTS[lang] ? lang : 'el';
    var frag = FORECAST_FRAGMENTS[L];
    var rand = seededRandom(hashString('forecast|' + signId + '|' + dayKey(date)));

    var pick = function (arr) { return arr[Math.floor(rand() * arr.length)]; };
    var text = pick(frag.open) + ' ' + pick(frag.middle) + '. ' + pick(frag.close);

    // Σκορ 45–95, σταθερά ανά ημέρα/ζώδιο
    var score = function () { return 45 + Math.floor(rand() * 51); };

    return {
      text: text,
      scores: { love: score(), work: score(), money: score(), mood: score() },
      luckyNumber: 1 + Math.floor(rand() * 49)
    };
  }

  /* --------------------------------------------------------------------- */

  global.Astro = {
    ZODIAC: ZODIAC,
    TAROT: TAROT,
    PHASE_KEYS: PHASE_KEYS,
    signById: signById,
    signForDate: signForDate,
    moonPhase: moonPhase,
    moonPath: moonPath,
    cardOfTheDay: cardOfTheDay,
    drawCard: drawCard,
    compatibility: compatibility,
    dailyForecast: dailyForecast,
    dayKey: dayKey
  };
})(window);
