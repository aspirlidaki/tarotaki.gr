/* ==========================================================================
   Ταρωτάκι — compat.js
   Συμβατότητα ζωδίων ανά κατηγορία.

   ΔΩΡΕΑΝ: ταίριασμα ζωδίου με ζώδιο (αυτό το αρχείο).
   PREMIUM: πλήρης συναστρία με ημερομηνία και ώρα γέννησης — θέλει
            γενέθλιους χάρτες, όχι μόνο ηλιακά ζώδια.

   Το μοντέλο στηρίζεται σε τρία πραγματικά αστρολογικά δεδομένα:
     1. Στοιχείο (φωτιά/γη/αέρας/νερό) και πώς συνδυάζονται
     2. Ποιότητα (αρχικό/σταθερό/μεταβλητό) — ίδια ποιότητα = σύγκρουση
     3. Απόσταση στον ζωδιακό κύκλο = η όψη μεταξύ τους
   Κάθε κατηγορία δίνει διαφορετικό βάρος σε αυτά, γιατί άλλα μετράνε
   στην επικοινωνία και άλλα στην εμπιστοσύνη.
   ========================================================================== */

(function (global) {
  'use strict';

  var A = global.Astro;

  /* Οι κατηγορίες, με τη σειρά που εμφανίζονται */
  var CATEGORIES = [
    { id: 'general',       scored: true },
    { id: 'love',          scored: true },
    { id: 'intimacy',      scored: true },
    { id: 'trust',         scored: true },
    { id: 'communication', scored: true },
    { id: 'work',          scored: true },
    { id: 'friendship',    scored: true },
    { id: 'strengths',     scored: false },
    { id: 'challenges',    scored: false }
  ];

  /* ---------------------------------------------------------------------
     Τι μετράει για κάθε ζώδιο — ονοματικές φράσεις, ώστε να μπαίνουν
     σε πρόταση χωρίς πρόβλημα συμφωνίας ρήματος (ενικός/πληθυντικός).
     --------------------------------------------------------------------- */

  var WANTS = {
    aries:       { el: 'η ορμή και το ξεκάθαρο ναι ή όχι',            en: 'drive and a clear yes or no' },
    taurus:      { el: 'η σταθερότητα και η απτή ασφάλεια',           en: 'steadiness and tangible security' },
    gemini:      { el: 'η ελευθερία και η ποικιλία',                  en: 'freedom and variety' },
    cancer:      { el: 'η φροντίδα και η συναισθηματική ασφάλεια',    en: 'care and emotional safety' },
    leo:         { el: 'η αναγνώριση και η γενναιοδωρία',             en: 'recognition and generosity' },
    virgo:       { el: 'η τάξη και η αίσθηση ότι κάτι χρησιμεύει',    en: 'order and the sense of being useful' },
    libra:       { el: 'η ισορροπία και η καλή συνεννόηση',           en: 'balance and good understanding' },
    scorpio:     { el: 'η ένταση και η απόλυτη εμπιστοσύνη',          en: 'intensity and absolute trust' },
    sagittarius: { el: 'ο ανοιχτός ορίζοντας και η ειλικρίνεια',      en: 'an open horizon and honesty' },
    capricorn:   { el: 'η συνέπεια και ο μακροπρόθεσμος στόχος',      en: 'consistency and the long-term goal' },
    aquarius:    { el: 'η ανεξαρτησία και μια κοινή ιδέα',            en: 'independence and a shared idea' },
    pisces:      { el: 'η τρυφερότητα και η κατανόηση χωρίς λόγια',   en: 'tenderness and being understood without words' }
  };

  /* Πώς δένουν τα στοιχεία μεταξύ τους */
  function elementPhrase(a, b, L) {
    var key = [a, b].sort().join('|');
    var map = {
      'fire|fire':   { el: 'μοιράζονται το ίδιο στοιχείο: καταλαβαίνονται χωρίς πολλή εξήγηση, αλλά κανείς δεν χαμηλώνει τη φωνή.',
                       en: 'share the same element: they understand each other without much explaining, but neither one lowers their voice.' },
      'earth|earth': { el: 'πατούν στο ίδιο έδαφος. Η σχέση χτίζεται αργά και κρατάει.',
                       en: 'stand on the same ground. The bond builds slowly and lasts.' },
      'air|air':     { el: 'κινούνται στο ίδιο μήκος κύματος. Η κουβέντα δεν σταματάει ποτέ, το συναίσθημα ίσως αργήσει.',
                       en: 'move on the same wavelength. The conversation never stops; the feeling may take longer.' },
      'water|water': { el: 'νιώθουν το ίδιο πράγμα ταυτόχρονα. Βαθιά σύνδεση, με ρίσκο να πνιγούν ο ένας στη διάθεση του άλλου.',
                       en: 'feel the same thing at the same time. A deep bond, with the risk of drowning in each other’s moods.' },
      'air|fire':    { el: 'ανάβουν ο ένας τον άλλο: η φωτιά θέλει αέρα για να κρατηθεί.',
                       en: 'light each other up: fire needs air to keep burning.' },
      'earth|water': { el: 'δένουν φυσικά: το νερό δίνει ζωή στο χώμα και το χώμα δίνει σχήμα στο νερό.',
                       en: 'bond naturally: water gives life to earth, and earth gives water a shape.' },
      'earth|fire':  { el: 'κινούνται με διαφορετική ταχύτητα. Ο ένας τρέχει, ο άλλος χτίζει.',
                       en: 'move at different speeds. One runs, the other builds.' },
      'fire|water':  { el: 'αντιδρούν έντονα ο ένας στον άλλο, άλλοτε δημιουργικά κι άλλοτε εξαντλητικά.',
                       en: 'react strongly to each other, sometimes creatively and sometimes exhaustingly.' },
      'air|earth':   { el: 'ο ένας θεωρεί και ο άλλος εφαρμόζει. Χρειάζεται μετάφραση και από τις δύο πλευρές.',
                       en: 'one theorises, the other applies. Both sides need to translate.' },
      'air|water':   { el: 'ο ένας εξηγεί και ο άλλος νιώθει. Σπάνια μιλάνε την ίδια στιγμή για το ίδιο πράγμα.',
                       en: 'one explains, the other feels. They rarely talk about the same thing at the same moment.' }
    };
    return map[key] ? map[key][L] : '';
  }

  /* Η απόσταση στον ζωδιακό = η όψη τους */
  function aspectPhrase(dist, L) {
    var map = {
      0: { el: 'Ίδιο ζώδιο: βλέπεις τον εαυτό σου απέναντι, με ό,τι καλό και ό,τι δύσκολο έχει αυτό.',
           en: 'Same sign: you are looking at yourself, with everything good and hard that brings.' },
      2: { el: 'Βρίσκονται σε εξάγωνο — φιλική απόσταση, η συνεννόηση έρχεται εύκολα.',
           en: 'They are sextile — a friendly distance where understanding comes easily.' },
      3: { el: 'Βρίσκονται σε τετράγωνο — έλξη με τριβή. Η σχέση σας αναγκάζει και τους δύο να αλλάξετε.',
           en: 'They are square — attraction with friction. The relationship forces both of you to change.' },
      4: { el: 'Βρίσκονται σε τρίγωνο — η πιο αρμονική απόσταση του ζωδιακού.',
           en: 'They are trine — the most harmonious distance in the zodiac.' },
      6: { el: 'Βρίσκονται σε αντίθεση — αντίθετα άκρα που έλκονται και, όταν θέλουν, συμπληρώνονται.',
           en: 'They are opposite — two poles that attract and, when they choose to, complete each other.' }
    };
    return map[dist] ? map[dist][L] :
      (L === 'el'
        ? 'Δεν σχηματίζουν κλασική όψη, οπότε η σχέση χτίζεται με επιλογή περισσότερο παρά με αυτοματισμό.'
        : 'They form no classical aspect, so the bond is built by choice rather than by default.');
  }

  /* ---------------------------------------------------------------------
     Κλείσιμο ανά κατηγορία και επίπεδο
     high = 72+, mid = 55–71, low = κάτω από 55
     --------------------------------------------------------------------- */

  var VERDICT = {
    love: {
      high: { el: 'Στον έρωτα λειτουργεί: υπάρχει έλξη και ταυτόχρονα άνεση, που σπάνια πάνε μαζί.',
              en: 'In love it works: there is attraction and ease at the same time, which rarely go together.' },
      mid:  { el: 'Στον έρωτα θέλει δουλειά, αλλά η βάση υπάρχει. Το ζητούμενο είναι να μη θεωρείτε δεδομένο ότι ο άλλος καταλαβαίνει.',
              en: 'In love it takes work, but the base is there. The point is not to assume the other one understands.' },
      low:  { el: 'Στον έρωτα είναι απαιτητικό. Έλκεστε, αλλά η καθημερινότητα θα δοκιμάσει και τους δύο.',
              en: 'In love it is demanding. You attract each other, but daily life will test you both.' }
    },
    intimacy: {
      high: { el: 'Στην οικειότητα υπάρχει εμπιστοσύνη χωρίς πολλά λόγια. Το σώμα και το συναίσθημα συμφωνούν.',
              en: 'In intimacy there is trust without many words. Body and feeling agree.' },
      mid:  { el: 'Η οικειότητα χτίζεται με τον χρόνο. Χρειάζεται να ειπωθούν πράγματα που συνήθως υπονοούνται.',
              en: 'Intimacy builds over time. Things usually left implied need to be said out loud.' },
      low:  { el: 'Στην οικειότητα υπάρχει απόσταση. Ο ένας θέλει περισσότερο και ο άλλος λιγότερο, και αυτό πονάει αν δεν συζητηθεί.',
              en: 'In intimacy there is distance. One wants more and the other less, and that hurts if left unspoken.' }
    },
    trust: {
      high: { el: 'Η εμπιστοσύνη έρχεται φυσικά. Κανείς δεν χρειάζεται να ελέγχει τον άλλο.',
              en: 'Trust comes naturally. Neither one needs to check up on the other.' },
      mid:  { el: 'Η εμπιστοσύνη θέλει αποδείξεις στην αρχή. Μόλις δοθούν, κρατάει.',
              en: 'Trust needs proof at first. Once given, it holds.' },
      low:  { el: 'Η εμπιστοσύνη είναι το δύσκολο σημείο. Η διαφάνεια εδώ δεν είναι πολυτέλεια, είναι προϋπόθεση.',
              en: 'Trust is the hard part. Transparency here is not a luxury, it is a requirement.' }
    },
    communication: {
      high: { el: 'Η επικοινωνία κυλάει. Λέτε τα δύσκολα χωρίς να γίνονται καβγάς.',
              en: 'Communication flows. You can say the hard things without them turning into a fight.' },
      mid:  { el: 'Η επικοινωνία χρειάζεται προσοχή στον τόνο. Το ίδιο πράγμα ειπωμένο αλλιώς αλλάζει τα πάντα.',
              en: 'Communication needs care with tone. The same thing said differently changes everything.' },
      low:  { el: 'Η επικοινωνία μπερδεύεται εύκολα. Ρωτήστε αντί να υποθέτετε — τα μισά προβλήματα λύνονται εκεί.',
              en: 'Communication tangles easily. Ask instead of assuming; half the problems end there.' }
    },
    work: {
      high: { el: 'Ως συνεργάτες είστε δυνατός συνδυασμός. Ο ένας καλύπτει ό,τι λείπει από τον άλλο.',
              en: 'As partners you are a strong combination. Each covers what the other lacks.' },
      mid:  { el: 'Στη δουλειά χρειάζεστε ξεκάθαρους ρόλους. Με μοιρασμένες αρμοδιότητες πάει καλά.',
              en: 'At work you need clear roles. With divided responsibilities it goes well.' },
      low:  { el: 'Στη δουλειά τρίβεστε. Λειτουργεί καλύτερα αν ο καθένας έχει το δικό του κομμάτι και δεν επικαλύπτεστε.',
              en: 'At work you grate. It goes better when each of you owns a separate piece.' }
    },
    friendship: {
      high: { el: 'Ως φίλοι είστε από τους ανθρώπους που κρατάνε δεκαετίες. Η παρέα σας δεν κουράζει.',
              en: 'As friends you are the kind that lasts decades. Your company does not wear thin.' },
      mid:  { el: 'Η φιλία σας δουλεύει καλύτερα με χώρο. Δεν χρειάζεται να τα κάνετε όλα μαζί.',
              en: 'Your friendship works better with space. You do not need to do everything together.' },
      low:  { el: 'Ως φίλοι έχετε λίγα κοινά σημεία αναφοράς. Χρειάζεται πρόθεση για να κρατηθεί η σχέση.',
              en: 'As friends you share few reference points. Keeping it going takes intention.' }
    },
    general: {
      high: { el: 'Συνολικά, είναι από τα ζευγάρια που λειτουργούν χωρίς να το ψάχνουν.',
              en: 'Overall, this is one of the pairings that works without having to try.' },
      mid:  { el: 'Συνολικά, είναι μια σχέση που αξίζει αλλά δεν είναι αυτόματη. Ό,τι χτιστεί, θα χτιστεί συνειδητά.',
              en: 'Overall, a relationship worth having but not automatic. Whatever gets built will be built on purpose.' },
      low:  { el: 'Συνολικά, είναι απαιτητικό ζευγάρι. Δεν σημαίνει ότι δεν γίνεται — σημαίνει ότι θέλει δουλειά και από τους δύο.',
              en: 'Overall, a demanding pairing. It does not mean it cannot work; it means it takes effort from both.' }
    }
  };

  /* Δυνάμεις και προκλήσεις: κείμενο χωρίς ποσοστό */
  var STRENGTHS = {
    same_element: { el: 'Η μεγαλύτερη δύναμή σας είναι ότι δεν χρειάζεται να εξηγήσετε τα βασικά — τα εννοείτε με τον ίδιο τρόπο.',
                    en: 'Your greatest strength is that you do not need to explain the basics; you mean them the same way.' },
    complement:   { el: 'Η δύναμή σας είναι η συμπληρωματικότητα: ο ένας φέρνει ακριβώς αυτό που λείπει από τον άλλο.',
                    en: 'Your strength is complementarity: each brings exactly what the other is missing.' },
    tension:      { el: 'Η δύναμή σας κρύβεται στην τριβή. Αυτή η σχέση σας κάνει καλύτερους, όχι απλώς πιο άνετους.',
                    en: 'Your strength hides in the friction. This relationship makes you better, not just more comfortable.' }
  };

  var CHALLENGES = {
    same_modality: { el: 'Η μεγαλύτερη πρόκληση είναι ότι κανείς δεν υποχωρεί πρώτος. Έχετε την ίδια ποιότητα, άρα την ίδια επιμονή.',
                     en: 'The biggest challenge is that neither gives in first. You share the same modality, so the same stubbornness.' },
    pace:          { el: 'Η πρόκληση είναι ο ρυθμός: ο ένας αποφασίζει γρήγορα και ο άλλος θέλει χρόνο. Καμία ταχύτητα δεν είναι λάθος.',
                     en: 'The challenge is pace: one decides fast, the other needs time. Neither speed is wrong.' },
    language:     { el: 'Η πρόκληση είναι ότι εκφράζετε την αγάπη με διαφορετική γλώσσα. Ο ένας τη λέει, ο άλλος την κάνει.',
                     en: 'The challenge is that you express affection in different languages. One says it, the other does it.' }
  };

  /* ---------------------------------------------------------------------
     Βαθμολόγηση
     --------------------------------------------------------------------- */

  var ELEMENT_BASE = {
    'fire|fire': 82, 'earth|earth': 80, 'air|air': 81, 'water|water': 83,
    'air|fire': 88, 'earth|water': 86,
    'earth|fire': 58, 'fire|water': 52, 'air|earth': 55, 'air|water': 57
  };

  /* Βάρη ανά κατηγορία: [στοιχείο, ποιότητα, όψη] */
  var WEIGHTS = {
    love:          [1.00, 0.8, 1.20],
    intimacy:      [1.10, 0.6, 1.00],
    trust:         [0.90, 1.2, 1.10],
    communication: [1.05, 0.7, 0.95],
    work:          [0.85, 1.3, 0.90],
    friendship:    [1.00, 0.5, 1.05],
    general:       [1.00, 1.0, 1.00]
  };

  /* Μπόνους όψης ανά απόσταση */
  var ASPECT_BONUS = { 0: 4, 1: -6, 2: 7, 3: -10, 4: 9, 5: -5, 6: 5 };

  /* Κατηγορίες όπου η αντίθεση μετράει θετικά (έλξη αντιθέτων) */
  var OPPOSITION_LIKES = ['love', 'intimacy'];

  function distance(ia, ib) {
    var d = Math.abs(ia - ib);
    return d > 6 ? 12 - d : d;
  }

  function categoryScore(a, b, category) {
    var base = ELEMENT_BASE[[a.element, b.element].sort().join('|')] || 65;
    var ia = A.ZODIAC.indexOf(a), ib = A.ZODIAC.indexOf(b);
    var dist = distance(ia, ib);
    var w = WEIGHTS[category] || WEIGHTS.general;

    var elementPart = (base - 65) * w[0];
    var modalityPart = (a.modality === b.modality && dist !== 0) ? -8 * w[1] : 3 * w[1];
    var aspectPart = (ASPECT_BONUS[dist] || 0) * w[2];

    if (dist === 6 && OPPOSITION_LIKES.indexOf(category) !== -1) aspectPart += 6;

    var score = 65 + elementPart + modalityPart + aspectPart;

    /* Μικρή σταθερή διακύμανση, ίδια πάντα για το ίδιο ζευγάρι και
       κατηγορία, ώστε τα νούμερα να μη βγαίνουν «στρογγυλά». */
    var seed = 0, key = [a.id, b.id].sort().join('|') + '|' + category;
    for (var i = 0; i < key.length; i++) {
      seed = (Math.imul(seed ^ key.charCodeAt(i), 16777619)) >>> 0;
    }
    score += (seed % 7) - 3;

    return Math.max(22, Math.min(98, Math.round(score)));
  }

  function tierOf(score) {
    return score >= 72 ? 'high' : (score >= 55 ? 'mid' : 'low');
  }

  /* ---------------------------------------------------------------------
     Κείμενο ανά κατηγορία
     --------------------------------------------------------------------- */

  function categoryText(a, b, category, score, L) {
    var lang = L === 'en' ? 'en' : 'el';
    var ia = A.ZODIAC.indexOf(a), ib = A.ZODIAC.indexOf(b);
    var dist = distance(ia, ib);
    var parts = [];

    var nameA = lang === 'en' ? a.en.name : a.el.name;
    var nameB = lang === 'en' ? b.en.name : b.el.name;
    var accA = lang === 'en' ? a.en.name : a.el.acc;
    var accB = lang === 'en' ? b.en.name : b.el.acc;

    if (category === 'strengths') {
      var kind = a.element === b.element ? 'same_element'
        : (dist === 6 || dist === 4 || dist === 2) ? 'complement' : 'tension';
      parts.push(lang === 'el'
        ? nameA + ' και ' + nameB + ' ' + elementPhrase(a.element, b.element, lang)
        : nameA + ' and ' + nameB + ' ' + elementPhrase(a.element, b.element, lang));
      parts.push(STRENGTHS[kind][lang]);
      return parts.join(' ');
    }

    if (category === 'challenges') {
      var ch = (a.modality === b.modality && dist !== 0) ? 'same_modality'
        : (a.element === 'fire' || b.element === 'fire') && (a.element === 'earth' || b.element === 'earth') ? 'pace'
        : 'language';
      parts.push(aspectPhrase(dist, lang));
      parts.push(CHALLENGES[ch][lang]);
      return parts.join(' ');
    }

    /* Οι μετρήσιμες κατηγορίες */
    parts.push(lang === 'el'
      ? 'Σ' + accA + ' μετράει ' + WANTS[a.id].el + '· σ' + accB + ', ' + WANTS[b.id].el + '.'
      : 'For ' + nameA + ', what matters is ' + WANTS[a.id].en + '; for ' + nameB + ', ' + WANTS[b.id].en + '.');

    parts.push(aspectPhrase(dist, lang));

    var v = VERDICT[category];
    if (v) parts.push(v[tierOf(score)][lang]);

    return parts.join(' ');
  }

  /* ---------------------------------------------------------------------
     Δημόσιο API
     --------------------------------------------------------------------- */

  function match(idA, idB, L) {
    var a = A.signById(idA), b = A.signById(idB);
    if (!a || !b) return null;

    var out = { a: a, b: b, categories: [], overall: 0 };

    CATEGORIES.forEach(function (c) {
      var score = c.scored ? categoryScore(a, b, c.id) : null;
      out.categories.push({
        id: c.id,
        scored: c.scored,
        score: score,
        tier: c.scored ? tierOf(score) : null,
        text: categoryText(a, b, c.id, score, L)
      });
    });

    out.overall = out.categories.filter(function (c) { return c.id === 'general'; })[0].score;
    out.love = out.categories.filter(function (c) { return c.id === 'love'; })[0].score;
    return out;
  }

  global.Compat = {
    CATEGORIES: CATEGORIES,
    match: match,
    categoryScore: categoryScore,
    tierOf: tierOf
  };
})(window);
