/* ==========================================================================
   Ταρωτάκι — auth.js
   Λογαριασμοί χρηστών.

   ┌────────────────────────────────────────────────────────────────────┐
   │ ΔΙΑΒΑΣΕ ΑΥΤΟ ΠΡΙΝ ΒΓΕΙ ΣΤΟΝ ΑΕΡΑ                                   │
   │                                                                    │
   │ Ο τοπικός adapter αποθηκεύει τους λογαριασμούς στον browser        │
   │ (localStorage). Αυτό ΔΕΝ είναι ασφαλής ταυτοποίηση:                │
   │   - ο χρήστης μπορεί να επεξεργαστεί τα δεδομένα του               │
   │   - ο λογαριασμός υπάρχει μόνο σε αυτή τη συσκευή                  │
   │   - δεν μπορεί να προστατέψει πληρωμένο περιεχόμενο                │
   │                                                                    │
   │ Χρησιμεύει για να δουλέψουν οι οθόνες και η ροή. Για αληθινούς     │
   │ λογαριασμούς με επιβεβαίωση email, γύρνα τον ADAPTER σε 'supabase' │
   │ και συμπλήρωσε το CONFIG. Καμία άλλη αλλαγή δεν χρειάζεται.        │
   └────────────────────────────────────────────────────────────────────┘

   Το API είναι με callbacks — δουλεύει και με τους δύο adapters:
     Auth.signUp({name, email, password}, cb)
     Auth.signIn({email, password}, cb)
     Auth.signOut(cb)
     Auth.current()            -> ο συνδεδεμένος χρήστης ή null
     Auth.onChange(fn)         -> ειδοποίηση σε σύνδεση/αποσύνδεση
   Το cb καλείται ως cb(errorCodeOrNull, user).
   ========================================================================== */

(function (global) {
  'use strict';

  /* 'local' = πρωτότυπο στον browser · 'supabase' = αληθινοί λογαριασμοί */
  var ADAPTER = 'local';

  var CONFIG = {
    supabaseUrl: '',      // π.χ. 'https://xxxx.supabase.co'
    supabaseAnonKey: ''   // το public anon key
  };

  var USERS_KEY = 'tarotaki.users';
  var SESSION_KEY = 'tarotaki.session';

  var listeners = [];
  var session = null;

  /* ---------------------------------------------------------------------
     Βοηθητικά
     --------------------------------------------------------------------- */

  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
  }

  function normalise(email) {
    return String(email || '').trim().toLowerCase();
  }

  function uid() {
    return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* Ανακάτεμα κωδικού.
     ΠΡΟΣΟΧΗ: αυτό δεν αντικαθιστά σωστό hashing στον server (bcrypt/argon2).
     Υπάρχει ώστε να μη γράφεται ο κωδικός καθαρός στον δίσκο. */
  function hashPassword(password, salt) {
    var input = salt + '|' + password;
    var h1 = 2166136261, h2 = 5381;
    for (var i = 0; i < input.length; i++) {
      var c = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = ((h2 * 33) ^ c) >>> 0;
    }
    // δεύτερο πέρασμα ώστε να μην είναι τετριμμένη η αντιστροφή
    for (var r = 0; r < 512; r++) {
      h1 = Math.imul(h1 ^ (h2 >>> 3), 2246822519) >>> 0;
      h2 = Math.imul(h2 ^ (h1 >>> 5), 3266489917) >>> 0;
    }
    return ('00000000' + h1.toString(16)).slice(-8) +
           ('00000000' + h2.toString(16)).slice(-8);
  }

  function makeSalt() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  /* Ο χρήστης όπως τον βλέπει η εφαρμογή — ποτέ με salt/hash μέσα */
  function publicUser(rec) {
    if (!rec) return null;
    return {
      id: rec.id,
      name: rec.name,
      email: rec.email,
      plan: rec.plan || 'free',
      verified: !!rec.verified,
      createdAt: rec.createdAt,
      birthDate: rec.birthDate || '',
      birthTime: rec.birthTime || '',
      birthPlace: rec.birthPlace || '',
      birthLatitude: typeof rec.birthLatitude === 'number' ? rec.birthLatitude : null,
      birthLongitude: typeof rec.birthLongitude === 'number' ? rec.birthLongitude : null,
      birthTimezone: rec.birthTimezone || '',
      credits: Number(rec.credits || 0)
    };
  }

  function emit() {
    var u = current();
    listeners.forEach(function (fn) {
      try { fn(u); } catch (e) { /* ο listener δεν ρίχνει τη σελίδα */ }
    });
  }

  /* ---------------------------------------------------------------------
     Τοπικός adapter
     --------------------------------------------------------------------- */

  var localAdapter = {
    signUp: function (data, cb) {
      var name = String(data.name || '').trim();
      var email = normalise(data.email);
      var password = String(data.password || '');

      if (!name) return cb('name');
      if (!validEmail(email)) return cb('email');
      if (password.length < 8) return cb('password');

      var users = load(USERS_KEY, []);
      for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) return cb('exists');
      }

      var salt = makeSalt();
      var rec = {
        id: uid(),
        name: name,
        email: email,
        salt: salt,
        hash: hashPassword(password, salt),
        plan: 'free',
        verified: false,          // η επιβεβαίωση email έρχεται στη 2η φάση
        credits: 0,
        aiUsage: { date: '', count: 0 },
        createdAt: new Date().toISOString()
      };

      users.push(rec);
      if (!store(USERS_KEY, users)) return cb('storage');

      session = { id: rec.id, at: Date.now() };
      store(SESSION_KEY, session);
      emit();
      cb(null, publicUser(rec));
    },

    signIn: function (data, cb) {
      var email = normalise(data.email);
      var password = String(data.password || '');

      if (!validEmail(email)) return cb('email');
      if (!password) return cb('password');

      var users = load(USERS_KEY, []);
      for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
          if (users[i].hash !== hashPassword(password, users[i].salt)) return cb('credentials');
          session = { id: users[i].id, at: Date.now() };
          store(SESSION_KEY, session);
          emit();
          return cb(null, publicUser(users[i]));
        }
      }
      // Ίδιο μήνυμα για άγνωστο email και λάθος κωδικό, ώστε να μη
      // φανερώνεται ποια emails υπάρχουν.
      cb('credentials');
    },

    signOut: function (cb) {
      session = null;
      store(SESSION_KEY, null);
      emit();
      if (cb) cb(null);
    },

    current: function () {
      if (!session) return null;
      var users = load(USERS_KEY, []);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === session.id) return publicUser(users[i]);
      }
      return null;
    },

    remove: function (cb) {
      if (!session) return cb('nosession');
      var users = load(USERS_KEY, []).filter(function (u) { return u.id !== session.id; });
      store(USERS_KEY, users);
      session = null;
      store(SESSION_KEY, null);
      emit();
      cb(null);
    },

    updateProfile: function (data, cb) {
      if (!session) return cb('nosession');
      var users = load(USERS_KEY, []);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id !== session.id) continue;
        users[i].birthDate = String(data.birthDate || '');
        users[i].birthTime = String(data.birthTime || '');
        users[i].birthPlace = String(data.birthPlace || '').trim().slice(0, 120);
        if (Object.prototype.hasOwnProperty.call(data, 'birthLatitude')) users[i].birthLatitude = isFinite(Number(data.birthLatitude)) ? Number(data.birthLatitude) : null;
        if (Object.prototype.hasOwnProperty.call(data, 'birthLongitude')) users[i].birthLongitude = isFinite(Number(data.birthLongitude)) ? Number(data.birthLongitude) : null;
        if (Object.prototype.hasOwnProperty.call(data, 'birthTimezone')) users[i].birthTimezone = String(data.birthTimezone || '').trim().slice(0, 80);
        if (!store(USERS_KEY, users)) return cb('storage');
        emit();
        return cb(null, publicUser(users[i]));
      }
      cb('nosession');
    },

    aiQuote: function (cb) {
      if (!session) return cb('nosession');
      var users = load(USERS_KEY, []), today = new Date().toISOString().slice(0, 10);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id !== session.id) continue;
        if (users[i].plan !== 'premium') return cb('premium');
        var usage = users[i].aiUsage || { date: '', count: 0 };
        if (usage.date !== today) usage = { date: today, count: 0 };
        var limit = 3;
        return cb(null, { count: usage.count, limit: limit, cost: usage.count < limit ? 0 : (usage.count - limit + 1) * 3, credits: Number(users[i].credits || 0) });
      }
      cb('nosession');
    },

    recordAiQuestion: function (cb) {
      if (!session) return cb('nosession');
      var users = load(USERS_KEY, []), today = new Date().toISOString().slice(0, 10);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id !== session.id) continue;
        if (users[i].plan !== 'premium') return cb('premium');
        var usage = users[i].aiUsage || { date: '', count: 0 };
        if (usage.date !== today) usage = { date: today, count: 0 };
        var limit = 3;
        var cost = usage.count < limit ? 0 : (usage.count - limit + 1) * 3;
        if (Number(users[i].credits || 0) < cost) return cb('credits', { cost: cost });
        users[i].credits = Number(users[i].credits || 0) - cost;
        users[i].aiUsage = { date: today, count: usage.count + 1 };
        if (!store(USERS_KEY, users)) return cb('storage');
        emit();
        return cb(null, { cost: cost, credits: users[i].credits, count: usage.count + 1, limit: limit });
      }
      cb('nosession');
    },

    spendCredits: function (cost, cb) {
      if (!session) return cb('nosession');
      cost = Number(cost || 0);
      var users = load(USERS_KEY, []);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id !== session.id) continue;
        if (Number(users[i].credits || 0) < cost) return cb('credits', { cost: cost });
        users[i].credits = Number(users[i].credits || 0) - cost;
        if (!store(USERS_KEY, users)) return cb('storage');
        emit();
        return cb(null, publicUser(users[i]));
      }
      cb('nosession');
    },

    count: function () { return load(USERS_KEY, []).length; }
  };

  /* ---------------------------------------------------------------------
     Supabase adapter — 2η φάση
     Φόρτωσε το SDK στη σελίδα και βάλε ADAPTER = 'supabase'.
     Οι υπογραφές είναι ίδιες, οπότε η υπόλοιπη εφαρμογή δεν αλλάζει.
     --------------------------------------------------------------------- */

  var supabaseAdapter = {
    _client: function () {
      if (!global.supabase || !CONFIG.supabaseUrl) return null;
      if (!this._c) {
        this._c = global.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
      }
      return this._c;
    },
    signUp: function (data, cb) {
      var c = this._client();
      if (!c) return cb('backend');
      c.auth.signUp({
        email: normalise(data.email),
        password: data.password,
        options: { data: { name: data.name } }
      }).then(function (res) {
        if (res.error) return cb(res.error.message);
        // Το Supabase στέλνει μόνο του το email επιβεβαίωσης
        emit();
        cb(null, res.data && res.data.user ? publicUser({
          id: res.data.user.id, name: data.name,
          email: res.data.user.email, verified: false
        }) : null);
      });
    },
    signIn: function (data, cb) {
      var c = this._client();
      if (!c) return cb('backend');
      c.auth.signInWithPassword({
        email: normalise(data.email), password: data.password
      }).then(function (res) {
        if (res.error) return cb('credentials');
        emit();
        cb(null, publicUser({
          id: res.data.user.id,
          name: (res.data.user.user_metadata || {}).name,
          email: res.data.user.email,
          verified: !!res.data.user.email_confirmed_at
        }));
      });
    },
    signOut: function (cb) {
      var c = this._client();
      if (!c) return cb && cb('backend');
      c.auth.signOut().then(function () { emit(); if (cb) cb(null); });
    },
    current: function () { return null; },   // συμπληρώνεται με getSession()
    remove: function (cb) { cb('unsupported'); },
    updateProfile: function (data, cb) {
      var c = this._client();
      if (!c) return cb('backend');
      c.auth.updateUser({ data: {
        birthDate: String(data.birthDate || ''),
        birthTime: String(data.birthTime || ''),
        birthPlace: String(data.birthPlace || '').trim().slice(0, 120),
        birthLatitude: isFinite(Number(data.birthLatitude)) ? Number(data.birthLatitude) : null,
        birthLongitude: isFinite(Number(data.birthLongitude)) ? Number(data.birthLongitude) : null,
        birthTimezone: String(data.birthTimezone || '').trim().slice(0, 80)
      }}).then(function (res) {
        if (res.error) return cb(res.error.message);
        emit();
        cb(null, res.data && res.data.user ? publicUser({
          id: res.data.user.id,
          name: (res.data.user.user_metadata || {}).name,
          email: res.data.user.email,
          verified: !!res.data.user.email_confirmed_at,
          birthDate: (res.data.user.user_metadata || {}).birthDate,
          birthTime: (res.data.user.user_metadata || {}).birthTime,
          birthPlace: (res.data.user.user_metadata || {}).birthPlace,
          birthLatitude: (res.data.user.user_metadata || {}).birthLatitude,
          birthLongitude: (res.data.user.user_metadata || {}).birthLongitude,
          birthTimezone: (res.data.user.user_metadata || {}).birthTimezone
        }) : null);
      });
    },
    count: function () { return 0; }
  };

  var impl = ADAPTER === 'supabase' ? supabaseAdapter : localAdapter;

  /* ---------------------------------------------------------------------
     Δημόσιο API
     --------------------------------------------------------------------- */

  function current() { return impl.current(); }

  function init() {
    session = load(SESSION_KEY, null);
    emit();
  }

  global.Auth = {
    adapter: ADAPTER,
    isLocalPrototype: ADAPTER === 'local',
    init: init,
    signUp: function (d, cb) { impl.signUp(d, cb || function () {}); },
    signIn: function (d, cb) { impl.signIn(d, cb || function () {}); },
    signOut: function (cb) { impl.signOut(cb); },
    remove: function (cb) { impl.remove(cb || function () {}); },
    updateProfile: function (d, cb) { impl.updateProfile(d || {}, cb || function () {}); },
    aiQuote: function (cb) { impl.aiQuote(cb || function () {}); },
    recordAiQuestion: function (cb) { impl.recordAiQuestion(cb || function () {}); },
    spendCredits: function (cost, cb) { impl.spendCredits(cost, cb || function () {}); },
    current: current,
    isSignedIn: function () { return !!current(); },
    isPremium: function () {
      var user = current();
      return !!(user && user.plan === 'premium');
    },
    count: function () { return impl.count(); },
    validEmail: validEmail,
    onChange: function (fn) { listeners.push(fn); }
  };
})(window);
