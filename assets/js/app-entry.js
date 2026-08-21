(function () {
  'use strict';

  var forced = new URLSearchParams(window.location.search).get('onboarding') === '1';
  var complete = false;
  var profile = null;

  try {
    complete = JSON.parse(localStorage.getItem('tarotaki.onboardingComplete') || 'false');
    profile = JSON.parse(localStorage.getItem('tarotaki.birthProfile') || 'null');
  } catch (error) {
    complete = false;
    profile = null;
  }

  if (!forced && complete) {
    var signId = 'aries';
    if (profile && profile.birthDate && window.Astro) {
      var sign = window.Astro.signForDate(new Date(profile.birthDate + 'T12:00:00'));
      if (sign) signId = sign.id;
    }
    window.location.replace('horoscope.html?sign=' + signId);
  }
})();
