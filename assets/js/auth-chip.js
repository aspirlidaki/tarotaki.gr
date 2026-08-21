/* ==========================================================================
   Ταρωτάκι — auth-chip.js
   Το κουμπί λογαριασμού στην κεφαλίδα. Αυτόνομο: μπαίνει σε κάθε σελίδα
   χωρίς να αλλάξει η λογική της. Απαιτεί auth.js και i18n.js πριν από αυτό.
   ========================================================================== */

(function () {
  'use strict';

  function render() {
    var chip = document.querySelector('#authChip');
    if (!chip || !window.Auth || !window.I18n) return;

    var user = window.Auth.current();
    chip.innerHTML = '';

    var a = document.createElement('a');
    a.className = 'chip-link';
    a.href = 'account.html';
    a.textContent = user ? (user.name || user.email) : window.I18n.t('acc.signIn');
    chip.appendChild(a);
  }

  /* Ο listener μπαίνει τώρα, ώστε να προλάβει το πρώτο T.init() της σελίδας */
  document.addEventListener('languagechange', render);
  if (window.Auth) window.Auth.onChange(render);

  function boot() {
    if (window.Auth) window.Auth.init();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
