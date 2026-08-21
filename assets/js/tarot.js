/* ==========================================================================
   Ταρωτάκι — tarot.js
   Πλήρης τράπουλα 78 καρτών και οι ρίψεις.

   Τα 22 Μείζονα Αρκάνα έχουν δικό τους κείμενο. Τα 56 Ελάσσονα συντίθενται
   από βαθμίδα + χρώμα, όπως δουλεύει και στην πράξη το ταρώ: η βαθμίδα λέει
   ΤΙ συμβαίνει, το χρώμα λέει ΠΟΥ. Έτσι κάθε κάρτα βγάζει συνεπές νόημα
   χωρίς 56 χειρόγραφα κείμενα που θα απέκλιναν μεταξύ τους.

   Εικόνες: δεν υπάρχουν ακόμα. Δείχνουμε όνομα και ερμηνεία.
   Όταν έρθουν, μπαίνει πεδίο `img` σε κάθε κάρτα.
   ========================================================================== */

(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------
     Μείζονα Αρκάνα
     glyph = η παραδοσιακή αστρολογική αντιστοιχία
     --------------------------------------------------------------------- */

  var MAJORS = [
    { n: 0,  roman: '0',     glyph: '♅', el: { name: 'Ο Τρελός',           text: 'Νέα αρχή χωρίς εγγυήσεις. Ένα άλμα που θέλει εμπιστοσύνη περισσότερο από σχέδιο.' },
                                          en: { name: 'The Fool',           text: 'A beginning without guarantees. A leap that needs trust more than a plan.' } },
    { n: 1,  roman: 'I',     glyph: '☿', el: { name: 'Ο Μάγος',            text: 'Έχεις ήδη ό,τι χρειάζεσαι. Το ζήτημα είναι να το χρησιμοποιήσεις.' },
                                          en: { name: 'The Magician',       text: 'You already have what you need. The question is whether you use it.' } },
    { n: 2,  roman: 'II',    glyph: '☽', el: { name: 'Η Ιέρεια',           text: 'Ξέρεις κάτι που δεν το έχεις πει ακόμα ούτε στον εαυτό σου. Άκου το.' },
                                          en: { name: 'The High Priestess', text: 'You know something you have not admitted even to yourself. Listen to it.' } },
    { n: 3,  roman: 'III',   glyph: '♀', el: { name: 'Η Αυτοκράτειρα',     text: 'Δημιουργία, αφθονία και φροντίδα. Κάτι μεγαλώνει επειδή του δίνεις χώρο.' },
                                          en: { name: 'The Empress',        text: 'Creation, abundance and care. Something grows because you give it room.' } },
    { n: 4,  roman: 'IV',    glyph: '♈', el: { name: 'Ο Αυτοκράτορας',     text: 'Δομή και όρια. Η ελευθερία εδώ έρχεται μέσα από τάξη, όχι παρά αυτήν.' },
                                          en: { name: 'The Emperor',        text: 'Structure and limits. Here freedom comes through order, not despite it.' } },
    { n: 5,  roman: 'V',     glyph: '♉', el: { name: 'Ο Ιεροφάντης',       text: 'Παράδοση και καθοδήγηση. Κάποιος έχει ήδη περπατήσει αυτόν τον δρόμο.' },
                                          en: { name: 'The Hierophant',     text: 'Tradition and guidance. Someone has walked this road before you.' } },
    { n: 6,  roman: 'VI',    glyph: '♊', el: { name: 'Οι Εραστές',         text: 'Μια επιλογή που δεν είναι λογική αλλά αξιακή. Τι είσαι πρόθυμος να αφήσεις;' },
                                          en: { name: 'The Lovers',         text: 'A choice that is not logical but about values. What are you willing to give up?' } },
    { n: 7,  roman: 'VII',   glyph: '♋', el: { name: 'Το Άρμα',            text: 'Θέληση και κατεύθυνση. Κερδίζεις όσο κρατάς τα ηνία και τα δύο.' },
                                          en: { name: 'The Chariot',        text: 'Will and direction. You win as long as you hold both reins.' } },
    { n: 8,  roman: 'VIII',  glyph: '♌', el: { name: 'Η Δύναμη',           text: 'Ήπια δύναμη. Η υπομονή εδώ πετυχαίνει ό,τι δεν πετυχαίνει η πίεση.' },
                                          en: { name: 'Strength',           text: 'Gentle power. Patience achieves here what force cannot.' } },
    { n: 9,  roman: 'IX',    glyph: '♍', el: { name: 'Ο Ερημίτης',         text: 'Απόσυρση για να δεις καθαρά. Η απάντηση θέλει ησυχία, όχι γνώμες.' },
                                          en: { name: 'The Hermit',         text: 'Withdrawal to see clearly. The answer needs quiet, not opinions.' } },
    { n: 10, roman: 'X',     glyph: '♃', el: { name: 'Ο Τροχός της Τύχης', text: 'Κάτι γυρίζει χωρίς εσένα. Οι κύκλοι αλλάζουν, το τάιμινγκ μετράει.' },
                                          en: { name: 'Wheel of Fortune',   text: 'Something turns without you. Cycles shift and timing matters.' } },
    { n: 11, roman: 'XI',    glyph: '♎', el: { name: 'Η Δικαιοσύνη',       text: 'Αιτία και αποτέλεσμα. Ό,τι έγινε, μετράει — και θα ζυγιστεί.' },
                                          en: { name: 'Justice',            text: 'Cause and effect. What was done counts, and it will be weighed.' } },
    { n: 12, roman: 'XII',   glyph: '♆', el: { name: 'Ο Κρεμασμένος',      text: 'Αναγκαστική παύση. Η λύση έρχεται αν δεις το θέμα ανάποδα.' },
                                          en: { name: 'The Hanged Man',     text: 'An enforced pause. The answer comes if you turn the problem upside down.' } },
    { n: 13, roman: 'XIII',  glyph: '♏', el: { name: 'Ο Θάνατος',          text: 'Τέλος και μεταμόρφωση — ποτέ κυριολεκτικά. Κάτι πρέπει να κλείσει.' },
                                          en: { name: 'Death',              text: 'An ending and a transformation — never literal. Something has to close.' } },
    { n: 14, roman: 'XIV',   glyph: '♐', el: { name: 'Η Εγκράτεια',        text: 'Κράμα και μέτρο. Δύο αντίθετα βρίσκουν αναλογία που δουλεύει.' },
                                          en: { name: 'Temperance',         text: 'Blending and moderation. Two opposites find a workable ratio.' } },
    { n: 15, roman: 'XV',    glyph: '♑', el: { name: 'Ο Διάβολος',         text: 'Δεσμά που τα κρατάς εσύ. Η αλυσίδα είναι πιο χαλαρή απ᾽ ό,τι νομίζεις.' },
                                          en: { name: 'The Devil',          text: 'Chains you hold yourself. The link is looser than you think.' } },
    { n: 16, roman: 'XVI',   glyph: '♂', el: { name: 'Ο Πύργος',           text: 'Ξαφνική ανατροπή που ρίχνει ό,τι δεν στεκόταν. Δυσάρεστο, αλλά καθαρτικό.' },
                                          en: { name: 'The Tower',          text: 'A sudden collapse of what was not standing. Unpleasant, but clearing.' } },
    { n: 17, roman: 'XVII',  glyph: '♒', el: { name: 'Το Άστρο',           text: 'Ελπίδα μετά τη ζημιά. Ήρεμη πίστη ότι αξίζει να συνεχίσεις.' },
                                          en: { name: 'The Star',           text: 'Hope after damage. A quiet faith that it is worth continuing.' } },
    { n: 18, roman: 'XVIII', glyph: '♓', el: { name: 'Η Σελήνη',           text: 'Θολά νερά. Όνειρα, φόβοι και ένστικτο μπερδεύονται — μη βιαστείς.' },
                                          en: { name: 'The Moon',           text: 'Murky water. Dreams, fears and instinct blur together — do not rush.' } },
    { n: 19, roman: 'XIX',   glyph: '☉', el: { name: 'Ο Ήλιος',            text: 'Καθαρότητα και χαρά. Τα πράγματα είναι όπως φαίνονται, και είναι καλά.' },
                                          en: { name: 'The Sun',            text: 'Clarity and joy. Things are as they look, and they are good.' } },
    { n: 20, roman: 'XX',    glyph: '♇', el: { name: 'Η Κρίση',            text: 'Απολογισμός και κάλεσμα. Κάτι από το παρελθόν ζητά απάντηση τώρα.' },
                                          en: { name: 'Judgement',          text: 'A reckoning and a call. Something from the past asks for an answer now.' } },
    { n: 21, roman: 'XXI',   glyph: '♄', el: { name: 'Ο Κόσμος',           text: 'Ο κύκλος κλείνει σωστά. Ολοκλήρωση που σου δίνει το δικαίωμα στο επόμενο.' },
                                          en: { name: 'The World',          text: 'The cycle closes properly. A completion that earns you the next one.' } }
  ];

  /* ---------------------------------------------------------------------
     Ελάσσονα Αρκάνα — χρώματα και βαθμίδες
     --------------------------------------------------------------------- */

  var SUITS = [
    { id: 'wands', glyph: '✦',
      el: { gen: 'των Ράβδων',      domain: 'στη δράση, το πάθος και τα ξεκινήματα' },
      en: { gen: 'of Wands',        domain: 'in action, passion and beginnings' } },
    { id: 'cups', glyph: '❥',
      el: { gen: 'των Κυπέλλων',    domain: 'στο συναίσθημα, τις σχέσεις και ό,τι σε αγγίζει' },
      en: { gen: 'of Cups',         domain: 'in feeling, relationships and what touches you' } },
    { id: 'swords', glyph: '†',
      el: { gen: 'των Ξιφών',       domain: 'στο μυαλό, τα λόγια και τις δύσκολες αλήθειες' },
      en: { gen: 'of Swords',       domain: 'in the mind, in words and in hard truths' } },
    { id: 'pentacles', glyph: '⬟',
      el: { gen: 'των Πεντάκτυπων', domain: 'στα υλικά πράγματα, τη δουλειά και την ασφάλεια' },
      en: { gen: 'of Pentacles',    domain: 'in material things, work and security' } }
  ];

  var RANKS = [
    { id: 'ace',    el: { name: 'Άσος',       text: 'Καθαρό ξεκίνημα. Μια σπίθα που δεν έχει ακόμα σχήμα, αλλά υπάρχει.' },
                    en: { name: 'Ace',        text: 'A clean start. A spark with no shape yet, but it is there.' } },
    { id: 'two',    el: { name: 'Δύο',        text: 'Ισορροπία ανάμεσα σε δύο πράγματα, ή μια επιλογή που δεν αναβάλλεται άλλο.' },
                    en: { name: 'Two',        text: 'A balance between two things, or a choice that cannot wait longer.' } },
    { id: 'three',  el: { name: 'Τρία',       text: 'Το πρώτο απτό αποτέλεσμα. Κάτι πήρε μορφή και φαίνεται.' },
                    en: { name: 'Three',      text: 'The first tangible result. Something took shape and shows.' } },
    { id: 'four',   el: { name: 'Τέσσερα',    text: 'Σταθερότητα και παύση. Χρήσιμη, αρκεί να μη γίνει στασιμότητα.' },
                    en: { name: 'Four',       text: 'Stability and pause. Useful, as long as it does not become stagnation.' } },
    { id: 'five',   el: { name: 'Πέντε',      text: 'Τριβή και έλλειψη. Κάτι λείπει ή κάτι πιέζει, και το νιώθεις.' },
                    en: { name: 'Five',       text: 'Friction and lack. Something is missing or pressing, and you feel it.' } },
    { id: 'six',    el: { name: 'Έξι',        text: 'Αποκατάσταση. Μετά τη δυσκολία έρχεται ισορροπία, συχνά με βοήθεια.' },
                    en: { name: 'Six',        text: 'Recovery. After the difficulty comes balance, often with help.' } },
    { id: 'seven',  el: { name: 'Επτά',       text: 'Δοκιμασία υπομονής. Κρατάς θέση χωρίς άμεση επιβεβαίωση.' },
                    en: { name: 'Seven',      text: 'A test of patience. You hold your ground without immediate proof.' } },
    { id: 'eight',  el: { name: 'Οκτώ',       text: 'Κίνηση και επιμονή. Δουλεύεις, και η δουλειά μετράει.' },
                    en: { name: 'Eight',      text: 'Movement and persistence. You are working, and the work counts.' } },
    { id: 'nine',   el: { name: 'Εννέα',      text: 'Κοντά στο τέλος. Έχεις σχεδόν φτάσει, με ό,τι κόστος είχε.' },
                    en: { name: 'Nine',       text: 'Near the end. You have almost arrived, at whatever it cost.' } },
    { id: 'ten',    el: { name: 'Δέκα',       text: 'Ολοκλήρωση κύκλου. Κάτι κλείνει — ανακούφιση ή βάρος, ανάλογα.' },
                    en: { name: 'Ten',        text: 'A cycle completes. Something closes — relief or burden, depending.' } },
    { id: 'page',   el: { name: 'Βαλές',      text: 'Μαθητεία και περιέργεια. Νέο μήνυμα, νέα αρχή, χωρίς εμπειρία ακόμα.' },
                    en: { name: 'Page',       text: 'Apprenticeship and curiosity. A new message, a new start, no experience yet.' } },
    { id: 'knight', el: { name: 'Ιππότης',    text: 'Ορμή και κυνήγι. Κινείσαι γρήγορα — ίσως πολύ γρήγορα.' },
                    en: { name: 'Knight',     text: 'Drive and pursuit. You are moving fast — perhaps too fast.' } },
    { id: 'queen',  el: { name: 'Βασίλισσα',  text: 'Ώριμη κατοχή προς τα μέσα. Ξέρεις τι νιώθεις και το κρατάς σταθερά.' },
                    en: { name: 'Queen',      text: 'Mature mastery turned inward. You know what you feel and hold it steady.' } },
    { id: 'king',   el: { name: 'Βασιλιάς',   text: 'Ώριμη κυριαρχία προς τα έξω. Ξέρεις τι κάνεις και το αναλαμβάνεις.' },
                    en: { name: 'King',       text: 'Mature mastery turned outward. You know what you are doing and you own it.' } }
  ];

  /* ---------------------------------------------------------------------
     Η τράπουλα
     --------------------------------------------------------------------- */

  function buildDeck() {
    var deck = [];

    MAJORS.forEach(function (m) {
      deck.push({
        id: 'major-' + m.n,
        arcana: 'major',
        glyph: m.glyph,
        roman: m.roman,
        el: { name: m.el.name, text: m.el.text },
        en: { name: m.en.name, text: m.en.text }
      });
    });

    SUITS.forEach(function (s) {
      RANKS.forEach(function (r) {
        deck.push({
          id: s.id + '-' + r.id,
          arcana: 'minor',
          suit: s.id,
          rank: r.id,
          glyph: s.glyph,
          roman: '',
          el: {
            name: r.el.name + ' ' + s.el.gen,
            text: r.el.text + ' Εδώ παίζεται ' + s.el.domain + '.'
          },
          en: {
            name: r.en.name + ' ' + s.en.gen,
            text: r.en.text + ' Here it plays out ' + s.en.domain + '.'
          }
        });
      });
    });

    return deck;
  }

  var DECK = buildDeck();

  /* ---------------------------------------------------------------------
     Ρίψεις
     free: διαθέσιμη χωρίς συνδρομή
     --------------------------------------------------------------------- */

  var SPREADS = [
    { id: 'daily',       free: true,  cards: 3, glyph: '☾', icon: 'assets/icons/moon.webp' },
    { id: 'weekly',      free: true,  cards: 3, glyph: '☉', icon: 'assets/icons/sun.webp' },
    { id: 'love',        free: false, cards: 3, glyph: '♀', icon: 'assets/icons/star.webp' },
    { id: 'monthly',     free: false, cards: 3, glyph: '♃', icon: 'assets/icons/astrology.webp' },
    { id: 'money',       free: false, cards: 3, glyph: '⬟', icon: 'assets/icons/rising-star.webp' },
    { id: 'personality', free: false, cards: 3, glyph: '✦', icon: 'assets/icons/star.webp' }
  ];

  function spreadById(id) {
    for (var i = 0; i < SPREADS.length; i++) if (SPREADS[i].id === id) return SPREADS[i];
    return null;
  }

  /* ---------------------------------------------------------------------
     Ανακάτεμα
     Σταθερό ανά ημέρα και ρίψη: αν ξαναμπείς την ίδια μέρα, βρίσκεις τις
     ίδιες κάρτες στις ίδιες θέσεις. Αλλιώς η «πρόβλεψη» θα άλλαζε σε κάθε
     refresh και δεν θα σήμαινε τίποτα.
     --------------------------------------------------------------------- */

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dayKey(date) {
    return date.getFullYear() + '-' +
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0');
  }

  /* Ανακατεμένη τράπουλα για συγκεκριμένη ρίψη και ημέρα */
  function shuffled(spreadId, date, salt) {
    var rand = rng(hash('tarot|' + spreadId + '|' + dayKey(date) + '|' + (salt || '')));
    var deck = DECK.slice();
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
    }
    // Μερικές κάρτες έρχονται ανάποδα, όπως σε πραγματική ρίψη
    return deck.map(function (c) {
      return { card: c, reversed: rand() < 0.26 };
    });
  }

  /* ---------------------------------------------------------------------
     Σύνθεση: τι λένε οι τρεις κάρτες ΜΑΖΙ

     Δεν είναι τυχαίο κείμενο. Διαβάζει τη δομή της ρίψης όπως ένας
     αναγνώστης: πόσα Μείζονα έπεσαν, ποιο χρώμα κυριαρχεί, πόσες κάρτες
     ήρθαν ανάποδα, αν υπάρχουν φιγούρες, Άσοι ή Δεκάρια.
     --------------------------------------------------------------------- */

  var SYNTH_MAJORS = {
    0: { el: 'Καμία κάρτα από τα Μείζονα Αρκάνα. Το θέμα είναι καθημερινό και το κρατάς εσύ στα χέρια σου — δεν σε παρασύρει κάτι μεγαλύτερο.',
         en: 'No Major Arcana here. This is an everyday matter and it is in your hands.' },
    1: { el: 'Ένα Μείζον Αρκάνο ανάμεσα στις τρεις δίνει βάρος: κάτι σε αυτή τη ρίψη ξεπερνά την απλή καθημερινότητα.',
         en: 'One Major Arcana among the three adds weight: something here goes beyond routine.' },
    2: { el: 'Δύο Μείζονα Αρκάνα μαζί δεν είναι μικρό πράγμα. Κάτι ουσιαστικό μετακινείται, είτε το έχεις αποφασίσει είτε όχι.',
         en: 'Two Major Arcana together is not small. Something substantial is moving.' },
    3: { el: 'Και οι τρεις κάρτες από τα Μείζονα Αρκάνα. Είναι σπάνιο και δείχνει καμπή, όχι επεισόδιο.',
         en: 'All three from the Major Arcana. Rare, and it points to a turning point.' }
  };

  var SYNTH_SUIT = {
    wands:     { el: 'Το βάρος πέφτει στις Ράβδους: δράση, ορμή και ό,τι ζητά ξεκίνημα.',
                 en: 'The weight falls on Wands: action, drive and whatever needs starting.' },
    cups:      { el: 'Το βάρος πέφτει στα Κύπελλα: συναίσθημα, σχέσεις και ό,τι σε αγγίζει προσωπικά.',
                 en: 'The weight falls on Cups: feeling, relationships and what touches you.' },
    swords:    { el: 'Το βάρος πέφτει στα Ξίφη: σκέψεις, λόγια και αλήθειες που πιέζουν να ειπωθούν.',
                 en: 'The weight falls on Swords: thoughts, words and truths pressing to be said.' },
    pentacles: { el: 'Το βάρος πέφτει στα Πεντάκτυπα: χρήματα, δουλειά και πρακτική ασφάλεια.',
                 en: 'The weight falls on Pentacles: money, work and practical security.' },
    mixed:     { el: 'Οι κάρτες έρχονται από διαφορετικά χρώματα, οπότε το θέμα αγγίζει πολλά κομμάτια της ζωής σου ταυτόχρονα.',
                 en: 'The cards come from different suits, so this touches several parts of your life at once.' }
  };

  var SYNTH_REVERSED = {
    0: { el: 'Καμία ανάποδη κάρτα: η ενέργεια κυλάει ελεύθερα και ό,τι δείχνεται, δείχνεται καθαρά.',
         en: 'No reversed cards: the energy runs freely and what shows, shows clearly.' },
    1: { el: 'Μία ανάποδη κάρτα δείχνει ένα σημείο που κολλάει. Δεν είναι φραγμός, είναι καθυστέρηση.',
         en: 'One reversed card marks a sticking point. Not a wall, a delay.' },
    2: { el: 'Δύο ανάποδες κάρτες σημαίνουν αρκετή αντίσταση. Κάτι δεν αφήνεται να προχωρήσει όσο γρήγορα θα ήθελες.',
         en: 'Two reversed cards mean real resistance. Something will not move as fast as you want.' },
    3: { el: 'Και οι τρεις ανάποδες. Η ενέργεια είναι μπλοκαρισμένη και η κίνηση πρέπει να γίνει πρώτα μέσα σου.',
         en: 'All three reversed. The energy is blocked; the movement has to happen inside you first.' }
  };

  var SYNTH_EXTRA = {
    court: { el: 'Υπάρχουν φιγούρες στη ρίψη, που συνήθως σημαίνει ότι μπλέκονται και άλλοι άνθρωποι — δεν είναι μόνο δικό σου.',
             en: 'There are court cards here, which usually means other people are involved.' },
    ace:   { el: 'Ένας Άσος δείχνει ότι κάτι πραγματικά ξεκινά τώρα, όχι κάποτε.',
             en: 'An Ace shows something genuinely starting now, not someday.' },
    ten:   { el: 'Ένα Δέκα κλείνει κύκλο. Ό,τι τελειώνει εδώ, τελειώνει σωστά.',
             en: 'A Ten closes a cycle. What ends here, ends properly.' }
  };

  /* Κλείσιμο που δείχνει τι θα πρόσθετε άλλη ρίψη */
  var SYNTH_NEXT = {
    daily:       { el: 'Αυτό είναι το σχήμα της ημέρας. Η εβδομαδιαία ρίψη δείχνει πού οδηγεί.',
                   en: 'That is the shape of the day. The weekly spread shows where it leads.' },
    weekly:      { el: 'Αυτό είναι το τόξο της εβδομάδας. Η μηνιαία ρίψη δείχνει αν είναι φάση ή τάση.',
                   en: 'That is the arc of the week. The monthly spread shows whether it is a phase or a trend.' },
    love:        { el: 'Αυτό είναι το τρίγωνο της σχέσης. Η ρίψη προσωπικότητας δείχνει τι φέρνεις εσύ μέσα του.',
                   en: 'That is the triangle of the relationship. The personality spread shows what you bring into it.' },
    monthly:     { el: 'Αυτό είναι το σχήμα του μήνα. Η ρίψη χρημάτων δείχνει τι τον χρηματοδοτεί.',
                   en: 'That is the shape of the month. The money spread shows what funds it.' },
    money:       { el: 'Αυτή είναι η οικονομική εικόνα. Η ρίψη προσωπικότητας δείχνει ποια συνήθεια τη διαμορφώνει.',
                   en: 'That is the financial picture. The personality spread shows which habit shapes it.' },
    personality: { el: 'Αυτό είναι το πορτρέτο. Η ημερήσια ρίψη δείχνει πώς φαίνεται σήμερα στην πράξη.',
                   en: 'That is the portrait. The daily spread shows how it looks in practice today.' }
  };

  var COURT = { page: 1, knight: 1, queen: 1, king: 1 };

  function synthesis(entries, spreadId, lang) {
    var L = lang === 'en' ? 'en' : 'el';
    var majors = 0, reversed = 0, court = 0, ace = 0, ten = 0;
    var suits = {};

    entries.forEach(function (e) {
      var c = e.card;
      if (c.arcana === 'major') majors++;
      else {
        suits[c.suit] = (suits[c.suit] || 0) + 1;
        if (COURT[c.rank]) court++;
        if (c.rank === 'ace') ace++;
        if (c.rank === 'ten') ten++;
      }
      if (e.reversed) reversed++;
    });

    /* Κυρίαρχο χρώμα: χρειάζεται τουλάχιστον δύο κάρτες ίδιου χρώματος */
    var top = null, topCount = 0;
    Object.keys(suits).forEach(function (s) {
      if (suits[s] > topCount) { top = s; topCount = suits[s]; }
    });
    var suitKey = (topCount >= 2) ? top : 'mixed';

    var parts = [SYNTH_MAJORS[majors][L]];
    if (majors < 3) parts.push(SYNTH_SUIT[suitKey][L]);
    parts.push(SYNTH_REVERSED[reversed][L]);
    if (court) parts.push(SYNTH_EXTRA.court[L]);
    if (ace) parts.push(SYNTH_EXTRA.ace[L]);
    if (ten) parts.push(SYNTH_EXTRA.ten[L]);
    if (SYNTH_NEXT[spreadId]) parts.push(SYNTH_NEXT[spreadId][L]);

    return parts.join(' ');
  }

  /* ---------------------------------------------------------------------
     Όριο: μία δωρεάν ανάγνωση κάθε 24 ώρες

     ΠΡΟΣΟΧΗ: ο έλεγχος γίνεται στον browser, άρα παρακάμπτεται εύκολα
     (καθάρισμα localStorage). Είναι η σωστή δομή, όχι πραγματικό paywall.
     Το τελευταίο θέλει server που κρατά τη συνδρομή.
     --------------------------------------------------------------------- */

  var LAST_KEY = 'tarotaki.lastReading';
  var WINDOW_MS = 24 * 60 * 60 * 1000;

  function lastReadingAt() {
    try {
      var v = localStorage.getItem(LAST_KEY);
      return v ? Number(v) : 0;
    } catch (e) { return 0; }
  }

  function markRead() {
    try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) { /* private mode */ }
  }

  function gate() {
    var last = lastReadingAt();
    var elapsed = Date.now() - last;
    if (!last || elapsed >= WINDOW_MS) {
      return { allowed: true, first: !last, remainingMs: 0, nextAt: null };
    }
    return {
      allowed: false,
      first: false,
      remainingMs: WINDOW_MS - elapsed,
      nextAt: new Date(last + WINDOW_MS)
    };
  }

  /* Πόσοι διαφορετικοί συνδυασμοί τριών καρτών υπάρχουν πραγματικά */
  function combinations() {
    var n = DECK.length;
    return n * (n - 1) * (n - 2) * 8;   /* x8 για όρθιες/ανάποδες */
  }

  /* ---------------------------------------------------------------------
     Μετρητής ρίψεων ανά κατηγορία και ανά ημέρα

     Οι συνδρομητές τραβούν όσο θέλουν. Μετά τη 2η ρίψη στην ίδια
     κατηγορία εμφανίζεται συμβουλευτική σημείωση: στο ταρώ, η
     επαναλαμβανόμενη ερώτηση για το ίδιο θέμα αραιώνει την απάντηση.
     Είναι σύσταση, όχι φραγμός.
     --------------------------------------------------------------------- */

  var DRAWS_KEY = 'tarotaki.draws';
  var ADVICE_KEY = 'tarotaki.advice';
  var ADVICE_AFTER = 2;

  function readMap(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function writeMap(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  /* Κρατάμε μόνο τη σημερινή ημέρα — δεν χρειάζεται ιστορικό */
  function todayBucket(key) {
    var all = readMap(key);
    var today = dayKey(new Date());
    return { all: all, today: today, bucket: all[today] || {} };
  }

  function drawCount(spreadId) {
    return todayBucket(DRAWS_KEY).bucket[spreadId] || 0;
  }

  function markDraw(spreadId) {
    var s = todayBucket(DRAWS_KEY);
    s.bucket[spreadId] = (s.bucket[spreadId] || 0) + 1;
    writeMap(DRAWS_KEY, (function () { var o = {}; o[s.today] = s.bucket; return o; })());
  }

  function adviceSeen(spreadId) {
    return !!todayBucket(ADVICE_KEY).bucket[spreadId];
  }

  function markAdvice(spreadId) {
    var s = todayBucket(ADVICE_KEY);
    s.bucket[spreadId] = true;
    writeMap(ADVICE_KEY, (function () { var o = {}; o[s.today] = s.bucket; return o; })());
  }

  /* Πρέπει να δείξουμε τη σύσταση πριν από αυτή τη ρίψη; */
  function shouldAdvise(spreadId) {
    return drawCount(spreadId) >= ADVICE_AFTER && !adviceSeen(spreadId);
  }

  global.Tarot = {
    DECK: DECK,
    MAJORS: MAJORS,
    SUITS: SUITS,
    RANKS: RANKS,
    SPREADS: SPREADS,
    spreadById: spreadById,
    shuffled: shuffled,
    dayKey: dayKey,
    synthesis: synthesis,
    gate: gate,
    markRead: markRead,
    drawCount: drawCount,
    markDraw: markDraw,
    adviceSeen: adviceSeen,
    markAdvice: markAdvice,
    shouldAdvise: shouldAdvise,
    ADVICE_AFTER: ADVICE_AFTER,
    combinations: combinations,
    WINDOW_MS: WINDOW_MS,
    size: DECK.length
  };
})(window);
