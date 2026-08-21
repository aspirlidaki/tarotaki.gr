/* ==========================================================================
   Ταρωτάκι — page-astrologer.js
   AI Astrologer: ημερήσιο όριο ερωτήσεων + credits για ό,τι το ξεπερνά.

   Τα νούμερα στην οθόνη γράφονται ΟΛΑ από εδώ. Τίποτα σταθερό στο HTML,
   γιατί έτσι έβγαινε «2 / 5» και στους δωρεάν χρήστες που έχουν όριο 2.
   ========================================================================== */

(function () {
  'use strict';

  var A = window.Auth;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* Βάλε το username χωρίς @ όταν ετοιμαστεί ο λογαριασμός Telegram */
  var TELEGRAM_USERNAME = '';

  var SERVICE_COST = { chart: 15, compat: 30 };
  var PROMPTS = [
    'Έχει πραγματικά αισθήματα για μένα;',
    'Γιατί με ελκύει συνεχώς αυτό το άτομο;',
    'Πότε θα νιώσω ξανά χαρούμενος/η;',
    'Τι χρειάζεται να προσέξω στα επαγγελματικά μου;',
    'Ποια είναι η επόμενη καλή κίνηση για την καριέρα μου;',
    'Τι δείχνει η περίοδος για την ερωτική μου ζωή;',
    'Πώς μπορώ να αφήσω πίσω μου μια δύσκολη σχέση;',
    'Πού αξίζει να δώσω την ενέργειά μου αυτή την εβδομάδα;',
    'Τι χρειάζεται να μάθω από αυτό που ζω τώρα;'
  ];
  var recentPrompts = [];

  function shuffledPrompts() {
    var available = PROMPTS.filter(function (prompt) { return recentPrompts.indexOf(prompt) === -1; });
    if (available.length < 3) available = PROMPTS.slice();
    var selected = available.sort(function () { return Math.random() - 0.5; }).slice(0, 3);
    recentPrompts = selected;
    return selected;
  }

  function renderPrompts() {
    $$('[data-ai-prompts]').forEach(function (host) {
      var list = host.querySelector('.ai-prompt-list');
      list.innerHTML = '';
      shuffledPrompts().forEach(function (prompt) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ai-prompt';
        button.textContent = prompt;
        button.addEventListener('click', function () {
          if (host.hasAttribute('data-guest-prompts')) {
            window.location.href = 'account.html?next=astrologer.html#premiumPlansTitle';
            return;
          }
          var input = $('#aiQuestion');
          input.value = prompt;
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        list.appendChild(button);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Κατάσταση χρήστη στην κορυφή
     --------------------------------------------------------------------- */

  function renderStatus() {
    A.aiQuote(function (err, q) {
      var gate = $('#aiPremiumGate');
      if (err === 'premium') {
        if (gate) gate.hidden = false;
        $('#remainingToday').textContent = 'Premium';
        $('#remainingHint').textContent = 'απαιτείται συνδρομή';
        $('#creditBalance').textContent = '—';
        $('#nextQuestionCost').textContent = 'Premium';
        $('#planName').textContent = 'δωρεάν λογαριασμός';
        $('#aiQuestionForm').querySelectorAll('textarea, button').forEach(function (el) { el.disabled = true; });
        return;
      }
      if (err) return;
      if (gate) gate.hidden = true;

      var left = Math.max(0, q.limit - q.count);
      var user = A.current();
      var premium = A.isPremium();

      /* Ρητό υπόλοιπο των ημερήσιων Premium ερωτήσεων. */
      $('#remainingToday').textContent = left + ' από ' + q.limit;
      $('#remainingHint').textContent = left > 0
        ? 'σου μένουν δωρεάν σήμερα'
        : 'εξάντλησες τις δωρεάν για σήμερα';

      $('#creditBalance').textContent = q.credits;

      $('#nextQuestionCost').textContent = q.cost ? q.cost + ' credits' : 'δωρεάν';
      $('#planName').textContent = premium ? 'λογαριασμός Premium' : 'απαιτείται Premium';

      /* Το live chat είναι μόνο για Premium — να φαίνεται πριν το πατήσεις */
      var tg = $('#telegramOption');
      if (tg) {
        tg.classList.toggle('is-disabled', !premium);
        tg.setAttribute('aria-disabled', String(!premium));
        var note = tg.querySelector('small');
        if (note) {
          note.textContent = premium
            ? 'Προσωπική συνομιλία μέσω Telegram. 5 credits για σύντομη ερώτηση, 7 για μεγαλύτερη.'
            : 'Προσωπική συνομιλία μέσω Telegram. Διαθέσιμο μόνο με συνδρομή Premium.';
        }
      }
    });
  }

  /* ---------------------------------------------------------------------
     Συνομιλία
     --------------------------------------------------------------------- */

  function say(kind, text) {
    var log = $('#chatLog');
    if (log.querySelector('p')) log.innerHTML = '';
    var item = document.createElement('div');
    item.className = 'chat-message ' + kind;
    item.textContent = text;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
  }

  function askAi(event) {
    event.preventDefault();
    var input = $('#aiQuestion');
    var question = input.value.trim();

    if (question.length < 8) {
      say('system', 'Γράψε μια λίγο πιο συγκεκριμένη ερώτηση.');
      return;
    }

    A.recordAiQuestion(function (err, result) {
      if (err === 'credits') {
        say('system', 'Η επόμενη ερώτηση κοστίζει ' + result.cost +
                      ' credits και δεν σου φτάνουν. Δες τα πακέτα πιο κάτω.');
        $('#creditPacks').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (err === 'premium') {
        say('system', 'Ο AI Astrologer είναι διαθέσιμος μόνο με Premium.');
        return;
      }
      if (err) { say('system', 'Η αποθήκευση δεν είναι διαθέσιμη αυτή τη στιγμή.'); return; }

      say('user', question);
      say('assistant', result.cost
        ? 'Καταγράφηκε και χρεώθηκαν ' + result.cost + ' credits. Η πραγματική απάντηση ' +
          'θα εμφανίζεται εδώ μόλις συνδεθεί ο AI backend.'
        : 'Καταγράφηκε χωρίς χρέωση. Η πραγματική απάντηση θα εμφανίζεται εδώ ' +
          'μόλις συνδεθεί ο AI backend.');

      input.value = '';
      renderStatus();
    });
  }

  /* ---------------------------------------------------------------------
     Έξτρα υπηρεσίες
     --------------------------------------------------------------------- */

  function status(message) { $('#serviceStatus').textContent = message; }

  function requestService(event) {
    var user = A.current();
    var type = event.currentTarget.getAttribute('data-service');

    if (type === 'telegram') return requestTelegram(user);

    var cost = SERVICE_COST[type] || 0;
    A.spendCredits(cost, function (err) {
      if (err === 'credits') {
        status('Χρειάζονται ' + cost + ' credits και δεν σου φτάνουν.');
        $('#creditPacks').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (err) { status('Το αίτημα δεν μπόρεσε να αποθηκευτεί.'); return; }
      renderStatus();
      status('Καταγράφηκε. Η ανάλυση θα σταλεί στο ' + user.email + '.');
    });
  }

  function requestTelegram(user) {
    if (!user || !A.isPremium()) {
      status('Το live chat είναι διαθέσιμο μόνο με συνδρομή Premium.');
      return;
    }
    if (!TELEGRAM_USERNAME) {
      status('Το Telegram δεν έχει συνδεθεί ακόμη. Δεν αφαιρέθηκαν credits.');
      return;
    }

    var question = window.prompt('Γράψε την ερώτησή σου για την αστρολόγο:');
    if (!question || !question.trim()) return;

    /* Σύντομη ερώτηση 5 credits, μεγαλύτερη 7 — το λέμε πριν χρεώσουμε */
    var words = question.trim().split(/\s+/).length;
    var cost = words <= 10 ? 5 : 7;

    if (window.confirm && !window.confirm('Η ερώτηση χρεώνεται ' + cost + ' credits. Να συνεχίσω;')) return;

    A.spendCredits(cost, function (err) {
      if (err === 'credits') { status('Χρειάζονται ' + cost + ' credits και δεν σου φτάνουν.'); return; }
      if (err) { status('Το αίτημα δεν μπόρεσε να αποθηκευτεί.'); return; }
      renderStatus();
      window.open('https://t.me/' + TELEGRAM_USERNAME, '_blank', 'noopener');
      status('Αφαιρέθηκαν ' + cost + ' credits. Άνοιξε το Telegram για να συνεχίσεις.');
    });
  }

  /* ---------------------------------------------------------------------
     Κεφαλίδα και μενού κινητού
     --------------------------------------------------------------------- */

  function wireMenu() {
    var button = $('#navToggle'), drawer = $('#drawer');
    if (!button || !drawer) return;

    button.addEventListener('click', function () {
      var open = drawer.getAttribute('data-open') !== 'true';
      drawer.setAttribute('data-open', String(open));
      button.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    $$('#drawer a').forEach(function (link) {
      link.addEventListener('click', function () {
        drawer.setAttribute('data-open', 'false');
        button.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
      });
    });
  }

  function wireShowcase(user) {
    var pricing = $('#astroPricingModal');
    $('#openPricing').addEventListener('click', function () { pricing.hidden = false; });
    $('#closePricing').addEventListener('click', function () { pricing.hidden = true; });
    pricing.addEventListener('click', function (event) {
      if (event.target === pricing) pricing.hidden = true;
    });

    $('#openAiComposer').addEventListener('click', function () {
      if (!user) {
        pricing.hidden = false;
        return;
      }
      $('#aiQuestion').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#aiQuestion').focus();
    });
  }

  /* ---------------------------------------------------------------------
     Εκκίνηση
     --------------------------------------------------------------------- */

  function init() {
    var y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());

    wireMenu();
    A.init();
    renderPrompts();

    var user = A.current();
    $('#authRequired').hidden = true;
    $('#astrologerApp').hidden = false;
    wireShowcase(user);

    window.setInterval(function () {
      if (document.visibilityState === 'visible') renderPrompts();
    }, 45000);

    if (!user) return;

    renderStatus();
    var refresh = $('#refreshPrompts');
    if (refresh) refresh.addEventListener('click', renderPrompts);
    $('#aiQuestionForm').addEventListener('submit', askAi);

    $$('[data-service]').forEach(function (button) {
      button.addEventListener('click', requestService);
    });

    $$('.credit-pack').forEach(function (button) {
      button.addEventListener('click', function () {
        $('#paymentNote').textContent =
          'Το checkout για ' + button.getAttribute('data-credits') +
          ' credits δεν έχει συνδεθεί ακόμη. Δεν έγινε χρέωση.';
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
