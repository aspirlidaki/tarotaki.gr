(function () {
  'use strict';

  function zodiacId(birthDate) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate || '');
    if (!match) return 'aries';
    var month = Number(match[2]);
    var day = Number(match[3]);
    var value = month * 100 + day;
    if (value >= 1222 || value <= 119) return 'capricorn';
    if (value <= 218) return 'aquarius';
    if (value <= 320) return 'pisces';
    if (value <= 419) return 'aries';
    if (value <= 520) return 'taurus';
    if (value <= 620) return 'gemini';
    if (value <= 722) return 'cancer';
    if (value <= 822) return 'leo';
    if (value <= 922) return 'virgo';
    if (value <= 1022) return 'libra';
    if (value <= 1121) return 'scorpio';
    return 'sagittarius';
  }

  function init() {
    var profile = null;
    try { profile = JSON.parse(localStorage.getItem('tarotaki.birthProfile') || 'null'); } catch (error) { profile = null; }
    var href = 'horoscope.html?sign=' + zodiacId(profile && profile.birthDate);
    document.querySelectorAll('[data-app-home]').forEach(function (link) { link.href = href; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
