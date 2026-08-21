/* ==========================================================================
   Ταρωτάκι — horoscope.js
   Παράγει την πρόβλεψη από τον ΠΡΑΓΜΑΤΙΚΟ ουρανό της ημέρας.

   Μέθοδος (κλασική, για προβλέψεις ηλιακού ζωδίου):
   1. Ηλιακοί οίκοι — μετράμε από το ζώδιο του χρήστη. Ο οίκος όπου
      βρίσκεται η Σελήνη δείχνει τον τομέα της ημέρας.
   2. Όψεις — η στενότερη πραγματική όψη της Σελήνης δίνει τον τόνο.
   3. Κυβερνήτης — ο πλανήτης του ζωδίου και ο οίκος όπου βρίσκεται.

   Το κείμενο δεν είναι ανακάτεμα φράσεων: κάθε πρόταση αντιστοιχεί σε
   συγκεκριμένο αστρονομικό γεγονός της ημέρας.

   ΣΗΜΕΙΩΣΗ: οι θέσεις είναι αστρονομικά υπολογισμένες. Οι ερμηνείες
   ακολουθούν την παραδοσιακή αστρολογία και προσφέρονται για αυτογνωσία
   και ψυχαγωγία.
   ========================================================================== */

(function (global) {
  'use strict';

  var E = global.Ephemeris;

  /* ---------------------------------------------------------------------
     Πλανήτες, με πτώσεις και γένος
     Το γένος χρειάζεται για τη συμφωνία: «ανάδρομος» / «ανάδρομη».
     --------------------------------------------------------------------- */

  var BODY = {
    sun:     { glyph: '☉', g: 'm',
               el: { name: 'ο Ήλιος', acc: 'τον Ήλιο', gen: 'του Ήλιου' },
               en: { name: 'the Sun', acc: 'the Sun', gen: 'the Sun' } },
    moon:    { glyph: '☾', g: 'f',
               el: { name: 'η Σελήνη', acc: 'τη Σελήνη', gen: 'της Σελήνης' },
               en: { name: 'the Moon', acc: 'the Moon', gen: 'the Moon' } },
    mercury: { glyph: '☿', g: 'm',
               el: { name: 'ο Ερμής', acc: 'τον Ερμή', gen: 'του Ερμή' },
               en: { name: 'Mercury', acc: 'Mercury', gen: 'Mercury' } },
    venus:   { glyph: '♀', g: 'f',
               el: { name: 'η Αφροδίτη', acc: 'την Αφροδίτη', gen: 'της Αφροδίτης' },
               en: { name: 'Venus', acc: 'Venus', gen: 'Venus' } },
    mars:    { glyph: '♂', g: 'm',
               el: { name: 'ο Άρης', acc: 'τον Άρη', gen: 'του Άρη' },
               en: { name: 'Mars', acc: 'Mars', gen: 'Mars' } },
    jupiter: { glyph: '♃', g: 'm',
               el: { name: 'ο Δίας', acc: 'τον Δία', gen: 'του Δία' },
               en: { name: 'Jupiter', acc: 'Jupiter', gen: 'Jupiter' } },
    saturn:  { glyph: '♄', g: 'm',
               el: { name: 'ο Κρόνος', acc: 'τον Κρόνο', gen: 'του Κρόνου' },
               en: { name: 'Saturn', acc: 'Saturn', gen: 'Saturn' } },
    uranus:  { glyph: '♅', g: 'm',
               el: { name: 'ο Ουρανός', acc: 'τον Ουρανό', gen: 'του Ουρανού' },
               en: { name: 'Uranus', acc: 'Uranus', gen: 'Uranus' } },
    neptune: { glyph: '♆', g: 'm',
               el: { name: 'ο Ποσειδώνας', acc: 'τον Ποσειδώνα', gen: 'του Ποσειδώνα' },
               en: { name: 'Neptune', acc: 'Neptune', gen: 'Neptune' } },
    pluto:   { glyph: '♇', g: 'm',
               el: { name: 'ο Πλούτωνας', acc: 'τον Πλούτωνα', gen: 'του Πλούτωνα' },
               en: { name: 'Pluto', acc: 'Pluto', gen: 'Pluto' } }
  };

  function retroWord(body, L) {
    if (L === 'en') return 'retrograde';
    return BODY[body].g === 'f' ? 'ανάδρομη' : 'ανάδρομος';
  }

  var ASPECT = {
    conjunction: { el: 'σε σύνοδο με', en: 'conjunct' },
    sextile:     { el: 'σε εξάγωνο με', en: 'sextile' },
    square:      { el: 'σε τετράγωνο με', en: 'square' },
    trine:       { el: 'σε τρίγωνο με', en: 'trine' },
    opposition:  { el: 'σε αντίθεση με', en: 'opposite' }
  };

  /* ---------------------------------------------------------------------
     Τι ΣΗΜΑΙΝΕΙ η όψη της Σελήνης με κάθε πλανήτη.
     Αυτό είναι η ουσία: όχι «ο Ερμής αφορά τα λόγια», αλλά τι νιώθεις
     όταν η Σελήνη τον δοκιμάζει ή τον στηρίζει.
     --------------------------------------------------------------------- */

  var MEANING = {
    sun: {
      easy:    { el: 'Αυτό που νιώθεις και αυτό που θέλεις δείχνουν προς την ίδια κατεύθυνση, κι αυτό σου καθαρίζει το κεφάλι.',
                 en: 'What you feel and what you want point the same way, and that clears your head.' },
      hard:    { el: 'Αυτό που θέλεις και αυτό που νιώθεις τραβάνε αλλού το καθένα. Η ένταση δεν είναι με τους άλλους, είναι μέσα σου.',
                 en: 'What you want and what you feel pull in different directions. The tension is not with other people, it is inside you.' },
      neutral: { el: 'Συναίσθημα και θέληση λένε το ίδιο πράγμα, οπότε ό,τι ξεκινήσεις σήμερα σε εκφράζει.',
                 en: 'Feeling and will say the same thing, so whatever you start today speaks for you.' }
    },
    mercury: {
      easy:    { el: 'Τα λόγια βρίσκουν εύκολα τον δρόμο τους. Καλή στιγμή για μια κουβέντα που την ανέβαλλες.',
                 en: 'Words find their way easily. A good moment for a conversation you had postponed.' },
      hard:    { el: 'Το μυαλό τρέχει πιο γρήγορα από το συναίσθημα και οι κουβέντες βγαίνουν πιο κοφτές απ᾽ ό,τι θα ήθελες.',
                 en: 'The mind runs faster than the feeling, and things come out sharper than you meant.' },
      neutral: { el: 'Σκέψη και διάθεση συμφωνούν. Ό,τι πεις σήμερα θα ακουστεί ειλικρινές.',
                 en: 'Thought and mood agree. Whatever you say today will sound sincere.' }
    },
    venus: {
      easy:    { el: 'Υπάρχει μια ευκολία στις σχέσεις σήμερα: οι άνθρωποι σε συναντούν στα μισά του δρόμου.',
                 en: 'There is an ease in relationships today: people meet you halfway.' },
      hard:    { el: 'Θέλεις κοντινότητα και αποστάσεις ταυτόχρονα. Μην το λύσεις με αγορές ή με υπερβολές.',
                 en: 'You want closeness and distance at the same time. Do not solve it with spending or excess.' },
      neutral: { el: 'Η ανάγκη για ομορφιά και ηρεμία δυναμώνει. Άφησε χώρο για κάτι που σου αρέσει πραγματικά.',
                 en: 'The need for beauty and calm grows. Leave room for something you genuinely enjoy.' }
    },
    mars: {
      easy:    { el: 'Έχεις ενέργεια και ξέρεις πού να τη βάλεις. Κάτι που θέλει τόλμη προχωράει.',
                 en: 'You have energy and you know where to put it. Something that takes nerve moves forward.' },
      hard:    { el: 'Η υπομονή είναι κοντή και το αίμα ανεβαίνει γρήγορα. Μέτρα ως το δέκα πριν απαντήσεις.',
                 en: 'Patience is short and the blood rises quickly. Count to ten before you answer.' },
      neutral: { el: 'Η διάθεση ζητά δράση. Δώσε της κάτι συγκεκριμένο να κάνει.',
                 en: 'The mood wants action. Give it something specific to do.' }
    },
    jupiter: {
      easy:    { el: 'Τα πράγματα δείχνουν πιο εφικτά απ᾽ ό,τι χθες, και δικαιολογημένα.',
                 en: 'Things look more possible than they did yesterday, and with reason.' },
      hard:    { el: 'Η αισιοδοξία σε παρασύρει να υποσχεθείς περισσότερα απ᾽ όσα προλαβαίνεις.',
                 en: 'Optimism tempts you to promise more than you can deliver.' },
      neutral: { el: 'Ανοίγει λίγη προοπτική. Κοίτα πιο μακριά από τη σημερινή λίστα.',
                 en: 'Some perspective opens up. Look further than today’s list.' }
    },
    saturn: {
      easy:    { el: 'Το συναίσθημα βρίσκει δομή. Ό,τι χτίσεις σήμερα αντέχει.',
                 en: 'Feeling finds structure. What you build today will hold.' },
      hard:    { el: 'Νιώθεις πιο βαρύς απ᾽ ό,τι είναι πραγματικά η κατάσταση. Είναι πέρασμα, όχι συμπέρασμα.',
                 en: 'You feel heavier than the situation actually is. It is a passage, not a conclusion.' },
      neutral: { el: 'Η μέρα ζητά ρεαλισμό: λιγότερες υποσχέσεις, περισσότερη συνέπεια.',
                 en: 'The day asks for realism: fewer promises, more consistency.' }
    }
  };

  /* ---------------------------------------------------------------------
     Ηλιακοί οίκοι
     open  = η εναρκτήρια πρόταση της ημέρας
     area  = σύντομη φράση για χρήση μέσα σε πρόταση
     --------------------------------------------------------------------- */

  var HOUSES = {
    1:  { el: { open: 'Η μέρα γυρίζει τον προβολέα πάνω σου: πώς είσαι, τι δείχνεις, τι θέλεις στ᾽ αλήθεια.', area: 'τον ίδιο σου τον εαυτό' },
          en: { open: 'The day turns the spotlight on you: how you are, what you show, what you actually want.', area: 'yourself' } },
    2:  { el: { open: 'Το βάρος πέφτει στα οικονομικά και σε ό,τι σου δίνει σιγουριά.', area: 'τα οικονομικά σου' },
          en: { open: 'The weight falls on money and on whatever gives you security.', area: 'your finances' } },
    3:  { el: { open: 'Κουβέντες, μηνύματα και μικροδιευθετήσεις γεμίζουν τη μέρα.', area: 'την επικοινωνία' },
          en: { open: 'Conversations, messages and small arrangements fill the day.', area: 'communication' } },
    4:  { el: { open: 'Το σπίτι και οι δικοί σου τραβάνε την προσοχή.', area: 'το σπίτι και την οικογένεια' },
          en: { open: 'Home and your people pull your attention.', area: 'home and family' } },
    5:  { el: { open: 'Ζητάς λίγη χαρά που να είναι δική σου: έρωτα, παιχνίδι, κάτι δημιουργικό.', area: 'τη χαρά και τον έρωτα' },
          en: { open: 'You want some joy that belongs to you: romance, play, something creative.', area: 'joy and romance' } },
    6:  { el: { open: 'Η καθημερινότητα και το σώμα ζητούν τα δικαιώματά τους.', area: 'τη δουλειά και την υγεία' },
          en: { open: 'Routine and the body ask for their due.', area: 'work and health' } },
    7:  { el: { open: 'Σήμερα ο άλλος έχει λόγο. Οι αποφάσεις παίρνονται μαζί.', area: 'τις σχέσεις σου' },
          en: { open: 'Today the other person has a say. Decisions get made together.', area: 'your relationships' } },
    8:  { el: { open: 'Κάτι που έμενε κάτω από την επιφάνεια ζητά να ειπωθεί.', area: 'τα βαθύτερα θέματα' },
          en: { open: 'Something kept below the surface asks to be said.', area: 'deeper matters' } },
    9:  { el: { open: 'Η ματιά ανοίγει πέρα από το γνωστό: σπουδές, ταξίδια, το μεγάλο ερώτημα.', area: 'τη γνώση και τα ταξίδια' },
          en: { open: 'The view opens past the familiar: study, travel, the larger question.', area: 'learning and travel' } },
    10: { el: { open: 'Ό,τι κάνεις φαίνεται. Η δουλειά και η θέση σου μπαίνουν στο κάδρο.', area: 'την καριέρα σου' },
          en: { open: 'What you do is visible. Work and your standing enter the frame.', area: 'your career' } },
    11: { el: { open: 'Οι φίλοι και τα σχέδια για το μετά παίρνουν χώρο.', area: 'τους φίλους και τα σχέδιά σου' },
          en: { open: 'Friends and plans for later take up space.', area: 'friends and plans' } },
    12: { el: { open: 'Χρειάζεσαι πιο πολλή ησυχία απ᾽ ό,τι παραδέχεσαι.', area: 'την ξεκούρασή σου' },
          en: { open: 'You need more quiet than you admit.', area: 'rest' } }
  };

  /* Κλείσιμο, ανάλογα με τον χαρακτήρα της ημέρας */
  var CLOSING = {
    easy: {
      el: ['Αν έχεις κάτι να ζητήσεις, σήμερα βρίσκεις καλύτερη ανταπόκριση.',
           'Προχώρα κάτι που το κρατούσες στην άκρη· η μέρα σε βοηθάει.',
           'Μη σπαταλήσεις τη ροή σε ασήμαντα. Διάλεξε το ένα που μετράει.'],
      en: ['If you have something to ask for, today you get a better response.',
           'Move something you had set aside; the day is helping.',
           'Do not spend the flow on trivia. Pick the one thing that matters.']
    },
    hard: {
      el: ['Μη βιαστείς να απαντήσεις. Η καθυστέρηση σήμερα σε συμφέρει.',
           'Ό,τι μοιάζει επείγον, δεν είναι. Άφησέ το να κατακάτσει ως αύριο.',
           'Κράτα χαμηλούς τόνους. Δεν χρειάζεται να κερδίσεις κάθε κουβέντα.'],
      en: ['Do not rush to reply. Delay works in your favour today.',
           'What looks urgent is not. Let it settle until tomorrow.',
           'Keep your tone low. You do not need to win every exchange.']
    },
    neutral: {
      el: ['Κράτα τα πράγματα απλά και τα λόγια ξεκάθαρα.',
           'Μέρα για να τακτοποιήσεις παρά για να ξεκινήσεις.',
           'Δώσε βάρος σε ένα πράγμα και άφησε τα υπόλοιπα να περιμένουν.'],
      en: ['Keep things simple and your words clear.',
           'A day for tidying rather than starting.',
           'Give weight to one thing and let the rest wait.']
    }
  };

  /* ---------------------------------------------------------------------
     Βοηθητικά
     --------------------------------------------------------------------- */

  function signIndex(signId) { return E.SIGN_IDS.indexOf(signId); }

  function solarHouse(signId, bodySignIndex) {
    return ((bodySignIndex - signIndex(signId) + 12) % 12) + 1;
  }

  function other(aspect, body) { return aspect.a === body ? aspect.b : aspect.a; }

  function startOfDay(date) {
    var d = new Date(date.getTime());
    d.setHours(12, 0, 0, 0);
    return d;
  }

  function dayNumber(date) {
    return Math.floor(date.getTime() / 86400000);
  }

  function scoreFrom(aspects, bodies) {
    var score = 55;
    aspects.forEach(function (a) {
      if (bodies.indexOf(a.a) === -1 && bodies.indexOf(a.b) === -1) return;
      var weight = 18 * Math.max(0.15, 1 - (a.orb / 8));
      if (a.harmony === 'easy') score += weight;
      else if (a.harmony === 'hard') score -= weight;
      else score += weight * 0.25;
    });
    return Math.max(20, Math.min(98, Math.round(score)));
  }

  /* ---------------------------------------------------------------------
     Ημερήσια ανάγνωση του ουρανού
     --------------------------------------------------------------------- */

  function daily(signId, date, lang) {
    var when = startOfDay(date);
    var pos = E.positions(when, E.PERSONAL);
    var asp = E.aspects(pos, E.PERSONAL);
    var moon = pos.moon;
    var ruler = E.rulerOf(signId);

    var moonAspects = asp.filter(function (a) {
      return (a.a === 'moon' || a.b === 'moon') && other(a, 'moon') !== 'moon';
    });

    return {
      date: when,
      sign: signId,
      house: solarHouse(signId, moon.signIndex),
      moon: moon,
      lead: moonAspects[0] || null,
      ruler: ruler,
      rulerPosition: pos[ruler],
      rulerHouse: solarHouse(signId, pos[ruler].signIndex),
      positions: pos,
      aspects: asp,
      retrogrades: E.PERSONAL.filter(function (b) { return pos[b].retrograde; }),
      scores: {
        love:  scoreFrom(asp, ['venus', 'moon']),
        work:  scoreFrom(asp, ['mars', 'saturn', 'sun']),
        money: scoreFrom(asp, ['jupiter', 'venus']),
        mood:  scoreFrom(asp, ['moon', 'sun'])
      }
    };
  }

  /* ---------------------------------------------------------------------
     Το κείμενο της γενικής εικόνας

     Κάθε πρόταση αντιστοιχεί σε αστρονομικό γεγονός:
       1. θέση Σελήνης -> ηλιακός οίκος
       2. στενότερη όψη Σελήνης -> ερμηνεία
       3. θέση κυβερνήτη -> πού πάει η προσοχή σου
       4. κλείσιμο ανάλογα με τον χαρακτήρα της ημέρας
     Η σειρά εναλλάσσεται ανά ημέρα ώστε να μη διαβάζεται σαν φόρμα.
     --------------------------------------------------------------------- */

  function generalText(reading, lang, names) {
    var L = lang === 'en' ? 'en' : 'el';
    var h = HOUSES[reading.house][L];
    var moonSign = names[reading.moon.sign];

    /* 1. Η Σελήνη και ο οίκος */
    var sMoon = L === 'el'
      ? 'Η Σελήνη περνά από ' + moonSign.acc + '. ' + h.open
      : 'The Moon is moving through ' + moonSign.nom + '. ' + h.open;

    /* 2. Η κύρια όψη, ερμηνευμένη.
       Αν η πρόταση μπει πρώτη, χρειάζεται ρητό υποκείμενο· αλλιώς
       το «Βρίσκεται» κρέμεται χωρίς αναφορά. */
    function aspectSentence(leading) {
      if (!reading.lead) return '';
      var p = other(reading.lead, 'moon');
      var meaning = MEANING[p] ? MEANING[p][reading.lead.harmony][L] : '';
      var nm = BODY[p][L];
      if (L === 'el') {
        return (leading ? 'Η Σελήνη βρίσκεται ' : 'Βρίσκεται ') +
               ASPECT[reading.lead.key].el + ' ' + nm.acc + '. ' + meaning;
      }
      return (leading ? 'The Moon is ' : 'It is ') +
             ASPECT[reading.lead.key].en + ' ' + nm.nom + '. ' + meaning;
    }

    /* 3. Ο κυβερνήτης — τι σημαίνει, όχι απλώς πού είναι */
    var rb = BODY[reading.ruler][L];
    var rHouse = HOUSES[reading.rulerHouse][L];
    var rSign = names[reading.rulerPosition.sign];
    var sRuler;

    if (reading.ruler === 'moon') {
      // Καρκίνος: κυβερνήτης είναι η ίδια η Σελήνη — μη λέμε δυο φορές
      // πού βρίσκεται· πούμε τι σημαίνει.
      sRuler = L === 'el'
        ? 'Η Σελήνη σε κυβερνά, γι᾽ αυτό η διάθεσή σου αλλάζει πιο γρήγορα απ᾽ ό,τι στους υπόλοιπους — και γι᾽ αυτό σε καθοδηγεί καλύτερα από κάθε λογική.'
        : 'The Moon rules you, which is why your mood shifts faster than most people’s — and why it guides you better than any argument.';
    } else if (reading.lead && other(reading.lead, 'moon') === reading.ruler) {
      // Ο κυβερνήτης είναι αυτός που δοκιμάζει τη Σελήνη σήμερα.
      sRuler = L === 'el'
        ? 'Επειδή ' + rb.name + ' κυβερνά το ζώδιό σου, η μέρα σε αγγίζει πιο προσωπικά απ᾽ ό,τι τους υπόλοιπους.'
        : 'Because ' + rb.name + ' rules your sign, the day touches you more personally than most.';
    } else {
      // «που σε κυβερνά»: δουλεύει και για αρσενικό και για θηλυκό,
      // σε αντίθεση με το «ο κυβερνήτης σου».
      sRuler = L === 'el'
        ? rb.name.charAt(0).toUpperCase() + rb.name.slice(1) + ', που σε κυβερνά, βρίσκεται σ' + rSign.acc +
          (reading.rulerPosition.retrograde ? ' και είναι ' + retroWord(reading.ruler, L) : '') +
          ', οπότε η προσοχή σου πάει σταθερά σ' + rHouse.area + '.'
        : rb.name.charAt(0).toUpperCase() + rb.name.slice(1) + ', your ruler, sits in ' + rSign.nom +
          (reading.rulerPosition.retrograde ? ' and is retrograde' : '') +
          ', so your attention keeps returning to ' + rHouse.area + '.';
    }

    /* Ανάδρομος Ερμής: πρακτική σημείωση που αξίζει ξεχωριστά */
    var sMercury = '';
    if (reading.positions.mercury.retrograde && reading.ruler !== 'mercury') {
      sMercury = L === 'el'
        ? 'Με τον Ερμή ανάδρομο, έλεγξε δύο φορές ό,τι υπογράφεις ή στέλνεις.'
        : 'With Mercury retrograde, double-check anything you sign or send.';
    }

    /* 4. Κλείσιμο */
    var harmony = reading.lead ? reading.lead.harmony : 'neutral';
    var pool = CLOSING[harmony][L];
    var sClose = pool[dayNumber(reading.date) % pool.length];

    /* Η σειρά αλλάζει μέρα με τη μέρα */
    var moonFirst = dayNumber(reading.date) % 2 === 0;
    var order = moonFirst
      ? [sMoon, aspectSentence(false), sRuler, sMercury, sClose]
      : [aspectSentence(true), sMoon, sRuler, sMercury, sClose];

    return order.filter(Boolean).join(' ');
  }

  /* ---------------------------------------------------------------------
     Κατηγορίες (premium)
     --------------------------------------------------------------------- */

  function categoryText(reading, category, lang, names) {
    var L = lang === 'en' ? 'en' : 'el';
    var pos = reading.positions;

    var map = {
      love:   { body: 'venus',   el: 'Στον έρωτα', en: 'In love' },
      career: { body: 'mars',    el: 'Στη δουλειά', en: 'At work' },
      luck:   { body: 'jupiter', el: 'Στις ευκαιρίες', en: 'In opportunity' }
    };
    var cfg = map[category];
    if (!cfg) return '';

    var b = cfg.body;
    var nm = BODY[b][L];
    var sign = names[pos[b].sign];
    var house = solarHouse(reading.sign, pos[b].signIndex);
    var hs = HOUSES[house][L];

    // Η στενότερη όψη του πλανήτη της κατηγορίας
    var asp = reading.aspects.filter(function (a) {
      return a.a === b || a.b === b;
    })[0];

    var parts = [];

    parts.push(L === 'el'
      ? nm.name.charAt(0).toUpperCase() + nm.name.slice(1) + ' βρίσκεται σ' + sign.acc +
        (pos[b].retrograde ? ' και είναι ' + retroWord(b, L) : '') + ', στον ' + house + 'ο ηλιακό σου οίκο.'
      : nm.name.charAt(0).toUpperCase() + nm.name.slice(1) + ' is in ' + sign.nom +
        (pos[b].retrograde ? ' and retrograde' : '') + ', in your ' + house + 'th solar house.');

    parts.push(hs.open);

    if (asp) {
      var p2 = other(asp, b);
      var nm2 = BODY[p2][L];
      parts.push(L === 'el'
        ? 'Σχηματίζει ' + ASPECT[asp.key].el.replace('σε ', '') + ' ' + nm2.acc +
          ', οπότε το θέμα δεν μένει θεωρητικό.'
        : 'It forms a ' + ASPECT[asp.key].en + ' to ' + nm2.nom +
          ', so the matter does not stay theoretical.');
      var mean = MEANING[p2] && MEANING[p2][asp.harmony];
      if (mean) parts.push(mean[L]);
    }

    return parts.join(' ');
  }

  /* ---------------------------------------------------------------------
     Μεγαλύτερες περίοδοι (premium)
     --------------------------------------------------------------------- */

  function period(signId, kind, date, lang, names, category) {
    var L = lang === 'en' ? 'en' : 'el';
    var base = startOfDay(date);

    if (kind === 'tomorrow') {
      var t = new Date(base.getTime() + 86400000);
      return { reading: daily(signId, t, lang), date: t };
    }

    var span = kind === 'weekly' ? 7 : (kind === 'monthly' ? 30 : 365);
    var end = new Date(base.getTime() + span * 86400000);
    var a = E.positions(base, E.PERSONAL);
    var b = E.positions(end, E.PERSONAL);

    var focus = {
      love: ['venus', 'moon'],
      career: ['mercury', 'mars', 'saturn'],
      luck: ['jupiter', 'venus'],
      general: E.PERSONAL
    }[category || 'general'];

    var shifts = E.PERSONAL.filter(function (body) {
      if (focus.indexOf(body) === -1) return false;
      return body !== 'moon' && a[body].sign !== b[body].sign;
    }).map(function (body) {
      return { body: body, from: a[body].sign, to: b[body].sign,
               house: solarHouse(signId, b[body].signIndex) };
    });

    var lines = [];
    shifts.forEach(function (s) {
      var nm = BODY[s.body][L];
      var hs = HOUSES[s.house][L];
      lines.push(L === 'el'
        ? nm.name.charAt(0).toUpperCase() + nm.name.slice(1) + ' αλλάζει ζώδιο και περνά σ' +
          names[s.to].acc + '. ' + hs.open
        : nm.name.charAt(0).toUpperCase() + nm.name.slice(1) + ' changes sign into ' +
          names[s.to].nom + '. ' + hs.open);
    });

    if (!lines.length) {
      var startReading = daily(signId, base, lang);
      var endReading = daily(signId, end, lang);
      var scoreKey = category === 'love' ? 'love' : category === 'career' ? 'work' : category === 'luck' ? 'money' : 'mood';
      var direction = endReading.scores[scoreKey] >= startReading.scores[scoreKey] ? 'up' : 'down';
      lines.push(L === 'el'
        ? (direction === 'up'
          ? 'Η δυναμική ενισχύεται όσο προχωρά η περίοδος. Δώσε χρόνο στα πράγματα να ανοίξουν.'
          : 'Η δυναμική ζητά πιο ήρεμο ρυθμό όσο προχωρά η περίοδος. Μην πιέσεις μια απόφαση πριν ωριμάσει.')
        : (direction === 'up'
          ? 'The momentum strengthens as the period unfolds. Give things time to open up.'
          : 'The momentum asks for a quieter pace as the period unfolds. Do not force a decision before it is ready.'));
    }

    return { reading: daily(signId, base, lang), shifts: shifts,
             text: lines.join(' '), date: base, end: end };
  }

  global.Horoscope = {
    BODY: BODY,
    ASPECT: ASPECT,
    HOUSES: HOUSES,
    MEANING: MEANING,
    solarHouse: solarHouse,
    daily: daily,
    generalText: generalText,
    categoryText: categoryText,
    period: period
  };
})(window);
