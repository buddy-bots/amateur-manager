var LITE = !!(window.matchMedia && (matchMedia('(pointer:coarse)').matches || (navigator.maxTouchPoints > 0 && !matchMedia('(hover:hover)').matches))); if (LITE) document.documentElement.classList.add('lite');
/* ===================================================================== Server-Anbindung (Supabase)
 * Login (E-Mail, Google, Passwort vergessen), Datenbank-Zugriffe und Spiel-Server.
 * Ohne externe Bibliothek: alles über die offizielle REST-Schnittstelle.
 * Der Spielstand wird ausschließlich auf dem Server verändert – der Browser hält nur eine Kopie zur Anzeige. */
var SB = window.AM_CONFIG || {
  url: 'https://wnzrakcsfwxsckrucfan.supabase.co',
  key: 'sb_publishable_xlzCh6qzM_Ve2r9PpOe5Sg_TlzWswH1'
};
var SESSION = null;            // { access_token, refresh_token, expires_at, user }
var SAVEID = null, SAVEVER = null, JOKER_OK = false;
var SESSKEY = 'am_session';

function sbHeaders(extra) {
  var h = { apikey: SB.key, 'Content-Type': 'application/json' };
  if (SESSION && SESSION.access_token) h.Authorization = 'Bearer ' + SESSION.access_token;
  for (var k in (extra || {})) h[k] = extra[k];
  return h;
}
function sbErr(j, status) {
  var m = (j && (j.error_description || j.msg || j.message || j.error)) || ('Fehler ' + status);
  var map = {
    'Invalid login credentials': 'E-Mail oder Passwort ist falsch.',
    'Email not confirmed': 'Bitte bestätige zuerst deine E-Mail-Adresse (Link im Postfach).',
    'User already registered': 'Diese E-Mail-Adresse ist schon registriert.',
    'Password should be at least 6 characters.': 'Das Passwort muss mindestens 8 Zeichen haben.',
    'Mindestalter 16 Jahre': 'Der Amateur Manager ist ab 16 Jahren.'
  };
  var e = new Error(map[m] || m); e.status = status; return e;
}
function sbFetch(path, opts) {
  opts = opts || {};
  return ensureFresh().then(function () {
    return fetch(SB.url + path, { method: opts.method || 'GET', headers: sbHeaders(opts.headers), body: opts.body != null ? JSON.stringify(opts.body) : undefined });
  }).then(function (res) {
    return res.text().then(function (t) {
      var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
      if (!res.ok) throw sbErr(j, res.status);
      return j;
    });
  });
}

/* ---------- Sitzung */
function sessSave(s) {
  SESSION = s && s.access_token ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600)), user: s.user || (SESSION && SESSION.user) || null } : null;
  try { if (SESSION) localStorage.setItem(SESSKEY, JSON.stringify(SESSION)); else localStorage.removeItem(SESSKEY); } catch (e) { }
}
function sessLoad() { try { var s = JSON.parse(localStorage.getItem(SESSKEY) || 'null'); if (s && s.refresh_token) SESSION = s; } catch (e) { SESSION = null; } return SESSION; }
var REFRESHING = null;
function ensureFresh() {
  if (!SESSION || !SESSION.refresh_token) return Promise.resolve();
  if (SESSION.expires_at - 60 > Date.now() / 1000) return Promise.resolve();
  if (REFRESHING) return REFRESHING;
  REFRESHING = fetch(SB.url + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: SESSION.refresh_token }) })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok) { sessSave(null); throw sbErr(j, r.status); } sessSave(j); }); })
    .finally(function () { REFRESHING = null; });
  return REFRESHING;
}

/* ---------- Login & Registrierung */
function authSignUp(email, password, meta) {
  return fetch(SB.url + '/auth/v1/signup', { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password, data: meta || {}, options: { emailRedirectTo: location.origin + location.pathname } }) })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw sbErr(j, r.status); if (j.access_token) sessSave(j); return j; }); });
}
function authSignIn(email, password) {
  return fetch(SB.url + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password }) })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw sbErr(j, r.status); sessSave(j); return j; }); });
}
function authGoogle() {
  location.href = SB.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.origin + location.pathname);
}
function authRecover(email) {
  return fetch(SB.url + '/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email }) })
    .then(function (r) { if (!r.ok) return r.json().then(function (j) { throw sbErr(j, r.status); }); });
}
function authSetPassword(pw) { return sbFetch('/auth/v1/user', { method: 'PUT', body: { password: pw } }); }
function authSignOut() {
  var t = SESSION && SESSION.access_token; sessSave(null); SAVEID = null;
  if (t) fetch(SB.url + '/auth/v1/logout', { method: 'POST', headers: { apikey: SB.key, Authorization: 'Bearer ' + t } }).catch(function () { });
}
// Rückkehr von Google / Bestätigungs- / Passwort-Link: Daten stehen im #-Teil der Adresse
function authFromUrl() {
  var h = location.hash.replace(/^#/, ''); if (!h) return null;
  var q = {}; h.split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) q[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); });
  if (!q.access_token && !q.error) return null;
  history.replaceState(null, '', location.pathname + location.search);
  if (q.error) return { error: q.error_description || q.error };
  sessSave({ access_token: q.access_token, refresh_token: q.refresh_token, expires_in: +q.expires_in || 3600 });
  return { type: q.type || 'login' };
}

/* ---------- Datenbank */
function rest(path, opts) { return sbFetch('/rest/v1/' + path, opts); }
function rpc(fn, args) { return sbFetch('/rest/v1/rpc/' + fn, { method: 'POST', body: args || {} }); }
function myProfile() { return rest('profiles?select=*&id=eq.' + SESSION.user.id).then(function (a) { return a && a[0] || null; }); }
function loadUser() { return sbFetch('/auth/v1/user').then(function (u) { SESSION.user = u; sessSave(SESSION); return u; }); }

/* ---------- Spiel-Server */
function game(op, body) {
  body = body || {}; body.op = op;
  var pr = sbFetch('/functions/v1/game', { method: 'POST', body: body });
  if (op === 'init') pr.then(function (r) { if (r && r.profile && r.profile.ready) refTry(); }, function () {});
  return pr;
}
// Einladungslink: ?ref=CODE merken und nach der Anmeldung einmal dem Einladenden zuordnen
(function () { var m = /[?&]ref=([A-Za-z0-9-]{4,24})/.exec(location.search); if (m) { try { localStorage.setItem('am_ref', m[1].toUpperCase()); } catch (e) {} history.replaceState(null, '', location.pathname + location.search.replace(/([?&])ref=[^&]*&?/, '$1').replace(/[?&]$/, '')); } })();
function refTry() { var c = null; try { c = localStorage.getItem('am_ref'); } catch (e) {} if (!c) return; game('refClaim', { code: c }).then(function () { try { localStorage.removeItem('am_ref'); } catch (e) {} }, function () {}); }
// Aktionen laufen nacheinander (nie zwei gleichzeitig), damit nichts verloren geht
var ACTQ = Promise.resolve(), BUSY = 0;
function serverAct(action, params) {
  var p = ACTQ.then(function () {
    BUSY++; busyShow();
    return game('act', { saveId: SAVEID, version: SAVEVER, action: action, params: params || {} });
  }).then(function (j) {
    BUSY--; busyShow(); SAVEVER = j.version; JOKER_OK = !!j.joker; S = j.state; return j.r || {};
  }, function (e) {
    BUSY--; busyShow();
    if (e.status === 409) { reloadGame(); }
    if (e.status === 401) { toast('Bitte neu einloggen.', true); }
    throw e;
  });
  ACTQ = p.catch(function () { });
  return p;
}
function serverJoker() {
  return game('joker', { saveId: SAVEID }).then(function (j) { SAVEVER = j.version; JOKER_OK = false; S = j.state; return j.r || {}; });
}
function reloadGame() {
  if (!SAVEID) return Promise.resolve();
  return game('load', { saveId: SAVEID }).then(function (j) { SAVEVER = j.version; JOKER_OK = !!j.joker; S = j.state; V = MGR.view(S, D); render(true); toast('Spielstand neu geladen.'); });
}
var BUSYT = null;
function busyShow() {
  clearTimeout(BUSYT);
  BUSYT = setTimeout(function () { document.documentElement.classList.toggle('srvbusy', BUSY > 0); }, BUSY > 0 ? 350 : 0);
}
// Herzschlag für „online“-Statistik
setInterval(function () { if (SESSION && document.visibilityState === 'visible') rpc('heartbeat').catch(function () { }); }, 120000);

/* ---------- Kompatibilität: frühere Server-Aufrufe (Apps Script) auf Supabase umgelenkt */
var DEV_NAME = 'Entwickler', WA_IDS = {}, WA_NAMES = {};
function seedOf(id) { var h = 0; id = String(id || ''); for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997; return h; }
function boardRow(m) {
  var s = m.summary || {}, b = {};
  for (var k in s) b[k] = s[k];
  b.full = m.display_name; b.pic = m.avatar_path || ''; b.avatar = seedOf(m.id); b.xp = Number(m.xp) || 0; b.mlvl = levelOf(b.xp).lvl;
  b.liga = m.league_name || s.liga || ''; b.status = s.fired ? 'Entlassen' : ''; b.id = m.id;
  return b;
}
function managers() {
  return rpc('manager_directory').then(function (rows) {
    rows = rows || []; WA_IDS = {}; WA_NAMES = {};
    rows.forEach(function (m) { WA_IDS[m.display_name] = m.id; WA_NAMES[m.id] = m.display_name; });
    return rows;
  });
}
var API = {
  apiHome: function () {
    if (!SESSION) return Promise.resolve({ ok: true, board: [], me: null, stats: null });
    return managers().then(function (rows) { return { ok: true, board: rows.map(boardRow).filter(function (b) { return b.games > 0 || b.days > 0; }), me: ME ? { name: ME.name, vorname: ME.vorname } : null }; });
  },
  apiWaContacts: function () {
    return Promise.all([managers(), rest('wa_favorites?select=contact')]).then(function (a) {
      var list = a[0].filter(function (m) { return m.id !== SESSION.user.id; }).map(function (m) { return { name: m.display_name, liga: m.league_name || '', avatar: seedOf(m.id), pic: m.avatar_path || '' }; });
      list.sort(function (x, y) { return x.name.localeCompare(y.name); });
      list.unshift({ name: DEV_NAME, liga: 'Feedback & Fragen', avatar: 0, pic: '', dev: true });
      var fav = (a[1] || []).map(function (r) { return r.contact; }).filter(function (n) { return n !== DEV_NAME; }); fav.unshift(DEV_NAME);
      return { ok: true, list: list, me: ME ? ME.name : '', fav: fav };
    });
  },
  apiWaSync: function (tok, since) {
    since = Number(since) || 0; var iso = new Date(since).toISOString(), me = SESSION.user.id;
    var q1 = rest('wa_messages?select=id,from_user,to_user,body,read_at,created_at&or=' + encodeURIComponent('(created_at.gt."' + iso + '",read_at.is.null)') + '&order=created_at.asc&limit=500');
    var q2 = rest('feedback_tickets?select=id,ticket_no,message,answer,answered_at,answer_read_at,created_at&order=created_at.asc&limit=200');
    return Promise.all([q1, q2, Object.keys(WA_NAMES).length ? null : managers()]).then(function (a) {
      var out = [];
      (a[0] || []).forEach(function (m) { var mine = m.from_user === me, ts = Date.parse(m.created_at); if (ts <= since && (mine || m.read_at)) return; out.push({ id: 'w' + m.id, ts: ts, mine: mine, other: WA_NAMES[mine ? m.to_user : m.from_user] || '?', text: m.body, read: !!m.read_at || mine }); });
      (a[1] || []).forEach(function (t) {
        var ts = Date.parse(t.created_at), tk = 'T' + t.ticket_no;
        if (ts > since) out.push({ id: 'fb' + t.id, ts: ts, mine: true, other: DEV_NAME, text: t.message, read: true, ticket: tk });
        if (t.answer) { var at = Date.parse(t.answered_at) || ts + 1000; if (at > since || !t.answer_read_at) out.push({ id: 'fa' + t.id, ts: at, mine: false, other: DEV_NAME, text: t.answer, read: !!t.answer_read_at, ticket: tk }); }
      });
      out.sort(function (x, y) { return x.ts - y.ts; });
      return { ok: true, msgs: out, now: Date.now() };
    });
  },
  apiWaSend: function (tok, toName, text) {
    text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 500); if (!text) return Promise.reject(new Error('Leere Nachricht.'));
    if (toName === DEV_NAME) return rest('feedback_tickets', { method: 'POST', body: { user_id: SESSION.user.id, message: text } }).then(function () { return { ok: true, ts: Date.now() }; });
    var to = WA_IDS[toName]; if (!to) return Promise.reject(new Error('Manager nicht gefunden.'));
    return rest('wa_messages', { method: 'POST', body: { from_user: SESSION.user.id, to_user: to, body: text } }).then(function () { return { ok: true, ts: Date.now() }; });
  },
  apiWaRead: function (tok, withName) {
    var now = new Date().toISOString();
    if (withName === DEV_NAME) return rest('feedback_tickets?answer=not.is.null&answer_read_at=is.null', { method: 'PATCH', body: { answer_read_at: now } }).then(function () { return { ok: true }; });
    var other = WA_IDS[withName]; if (!other) return Promise.resolve({ ok: true });
    return rest('wa_messages?from_user=eq.' + other + '&to_user=eq.' + SESSION.user.id + '&read_at=is.null', { method: 'PATCH', body: { read_at: now } }).then(function () { return { ok: true }; });
  },
  apiWaFavSet: function (tok, list) {
    list = (list || []).map(function (x) { return String(x).slice(0, 60); }).filter(function (x) { return x && x !== DEV_NAME; }).slice(0, 200);
    return rest('wa_favorites?user_id=eq.' + SESSION.user.id, { method: 'DELETE' }).then(function () {
      if (!list.length) return null;
      return rest('wa_favorites', { method: 'POST', body: list.map(function (c) { return { user_id: SESSION.user.id, contact: c }; }) });
    }).then(function () { return { ok: true }; });
  },
  apiSettings: function (tok, obj) {
    obj = obj || {}; var up = {};
    if ('lang' in obj) up.lang = /^(de|en|es|fr)$/.test(obj.lang) ? obj.lang : 'de';
    if ('bg' in obj) up.bg_key = String(obj.bg || '').slice(0, 400) || null;
    return rest('profiles?id=eq.' + SESSION.user.id, { method: 'PATCH', body: up }).then(function () {
      ME.settings = ME.settings || {}; if ('lang' in up) ME.settings.lang = up.lang; if ('bg_key' in up) ME.settings.bg = up.bg_key || '';
      return { ok: true, settings: ME.settings };
    });
  },
  apiPic: function (tok, dataUrl) {
    dataUrl = String(dataUrl || ''); if (dataUrl && (dataUrl.indexOf('data:image/') !== 0 || dataUrl.length > 45000)) return Promise.reject(new Error('Bild zu groß.'));
    return rest('profiles?id=eq.' + SESSION.user.id, { method: 'PATCH', body: { avatar_path: dataUrl || null } }).then(function () { ME.pic = dataUrl; return { ok: true }; });
  },
  apiSalary: function () {
    return managers().then(function (rows) {
      var me = SESSION.user.id;
      var list = rows.filter(function (m) { return m.summary && m.summary.sal > 0; }).map(function (m) { var s = m.summary; return { name: m.display_name, liga: String(m.league_name || s.liga || '').replace(/,.*$/, ''), seasons: s.seasons || 0, saison: String(s.season || ''), avg: s.avg || 0, sal: s.sal || 0, me: m.id === me, avatar: seedOf(m.id), pic: m.avatar_path || '' }; });
      list.sort(function (a, b) { return b.sal - a.sal; }); list.forEach(function (x, i) { x.rank = i + 1; });
      var mine = list.filter(function (x) { return x.me; })[0] || null; list.forEach(function (x) { if (!x.me) delete x.me; });
      return { ok: true, top: list.slice(0, 3), all: list, mine: mine && mine.rank > 3 ? mine : null, myRank: mine ? mine.rank : null, total: list.length };
    });
  },
  apiDeleteAccount: function (tok, confirm) {
    return game('deleteAccount', { confirm: String(confirm || '').trim().toUpperCase() }).then(function () { authSignOut(); return { ok: true }; });
  },
  apiWappen: function () { return Promise.resolve({ ok: true, w: {} }); },
  apiHandoff: function () { return game('handoff', { saveId: SAVEID }).then(function (r) { HOFF.code = r.code; HOFF.t = Date.now(); hoffWatch(); return { ok: true, url: location.origin + location.pathname + '?hc=' + r.code }; }); },
  apiHandoffUse: function () { return Promise.resolve({ ok: false, error: 'Bitte mit Google oder E-Mail anmelden.' }); }
};
function call(fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (!API[fn]) return Promise.reject(new Error('Unbekannter Aufruf: ' + fn));
  return API[fn].apply(null, args).catch(function (e) { if (e && e.status === 401) return { ok: false, relogin: true, error: 'Bitte neu einloggen.' }; return { ok: false, error: (e && e.message) || String(e) }; });
}

/* ---------- Bilder (Supabase Storage, Bucket „media“) – tauschbar über die Admin-Seite, ohne neuen Code */
var MEDIA = [];
function mediaUrl(path) { return SB.url + '/storage/v1/object/public/media/' + String(path).split('/').map(encodeURIComponent).join('/'); }
function loadMedia() {
  return fetch(SB.url + '/rest/v1/media?select=key,path&order=key&limit=3000', { headers: { apikey: SB.key } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) { MEDIA = rows || []; if (D) applyMedia(D, MEDIA); return MEDIA; })
    .catch(function () { return []; });
}
// Schlüssel „gruppe.name“ → Stelle in den Spieldaten
function applyMedia(D, rows) {
  D.imgs = D.imgs || {}; ['bg', 'scout', 'masc', 'fans', 'stad'].forEach(function (g) { D.imgs[g] = {}; });
  D.privImg = {}; D.relImgs = []; D.media = { gif: [], kauf: [], verkauf: [], hintergrund: [] };
  (rows || []).forEach(function (m) {
    var i = m.key.indexOf('.'); if (i < 1) return; var g = m.key.slice(0, i), k = m.key.slice(i + 1), u = mediaUrl(m.path);
    if (D.imgs[g]) D.imgs[g][k] = u;
    else if (g === 'ausbau') { if (D.items && D.items[k]) D.items[k].img = u; }
    else if (g === 'camp') (D.camps || []).forEach(function (c) { if (c.id === k) c.img = u; });
    else if (g === 'priv') D.privImg[k] = u;
    else if (g === 'rel') D.relImgs.push(u);
    else if (D.media[g]) D.media[g].push(u);
  });
}
