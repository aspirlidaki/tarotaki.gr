/*
   Ταρωτάκι — place-resolver.js
   Αναζήτηση τόπου γέννησης με συντεταγμένες και IANA ζώνη ώρας.
   Τα αποτελέσματα αποθηκεύονται στη συσκευή ώστε να μη γίνονται διπλά αιτήματα.
   ========================================================================== */
(function (global) {
  'use strict';

  var CACHE_PREFIX = 'tarotaki.place.';

  function cacheKey(query) { return CACHE_PREFIX + String(query || '').trim().toLowerCase(); }
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (error) { return null; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* cache προαιρετικό */ } }

  function result(item) {
    return {
      name: [item.name, item.admin1, item.country].filter(Boolean).join(', '),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      timezone: item.timezone || ''
    };
  }

  function search(query, options) {
    var text = String(query || '').trim();
    if (text.length < 2) return Promise.resolve([]);
    var key = cacheKey(text), cached = read(key);
    if (cached && cached.savedAt && Date.now() - cached.savedAt < 2592000000) return Promise.resolve(cached.results || []);

    var url = 'https://geocoding-api.open-meteo.com/v1/search?count=6&language=el&format=json&name=' + encodeURIComponent(text.split(',')[0].trim());
    return fetch(url, { headers: { Accept: 'application/json' }, signal: options && options.signal })
      .then(function (response) { if (!response.ok) throw new Error('geocoding'); return response.json(); })
      .then(function (data) {
        var results = (data.results || []).map(result).filter(function (item) {
          return isFinite(item.latitude) && isFinite(item.longitude) && item.timezone;
        });
        save(key, { savedAt: Date.now(), results: results });
        return results;
      });
  }

  global.PlaceResolver = { search: search };
})(window);
