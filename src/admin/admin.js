/* Amateur Manager – Admin-Seite: Übersicht, Feedback, Bilder */
var BG = [['titel', 'Titelbild Startseite (ganze Breite)'], ['publisher', 'Publisher-Logo oben rechts'], ['entwickler', 'Profilbild „Entwickler“ im Chat'],
  ['saisonziel', 'Popup Saisonziel'], ['hauptsponsor', 'Popup Hauptsponsor'], ['ausstatter', 'Popup Ausstatter'], ['budget', 'Popup Saisonbudget'], ['presse', 'Popup Pressekonferenz'], ['vorbereitung', 'Popup Saisonvorbereitung'],
  ['aufstieg', 'Saisonabschluss Aufstieg'], ['klassenerhalt', 'Saisonabschluss Klassenerhalt'], ['abstieg', 'Saisonabschluss Abstieg'], ['wahl', 'Saisonende: Wahl & Auszählung'], ['ligen', 'Saisonende: Ligenübersicht'], ['bestenliste', 'Saisonende: Bestenlisten'], ['vorstand', 'Saisonende: Vorstandsbewertung'], ['neue_saison', 'Saisonstart: Ladebildschirm'], ['entlassung', 'Entlassung'], ['talent', 'Popup Neues Talent / Sterne'],
  ['transfer_kauf', 'Ersatzbild Spielerkauf'], ['transfer_verkauf', 'Ersatzbild Spielerverkauf'],
  ['krypto_gewinn', 'Fazit Krypto mit Gewinn'], ['krypto_verlust', 'Fazit Krypto mit Verlust'], ['aktie_gewinn', 'Fazit Aktie mit Gewinn'], ['aktie_verlust', 'Fazit Aktie mit Verlust'],
  ['karte_academy', 'Hintergrund Karte Academy-Campus'], ['karte_verein', 'Hintergrund Karte Vereinsgelände'], ['karte_med', 'Hintergrund Karte Med-Abteilung']];
var SCOUT = [['region', 'Regionales Scout-Netzwerk'], ['video', 'Video-Analyse-Software'], ['daten', 'Talent-Datenbank'], ['sichtung', 'Leistungsdiagnostik & Sichtungstage'], ['tw', 'Torwart-Spezialscout'], ['abwehr', 'Abwehr-Scout'], ['sturm', 'Offensiv-Scout'], ['intl', 'Internationales Scouting']];
var MASC = [['adler', 'Adler'], ['baer', 'Bär'], ['fuchs', 'Fuchs'], ['eule', 'Eule'], ['pferd', 'Pferd'], ['panther', 'Panther'], ['katze', 'Katze'], ['krake', 'Krake'], ['gorilla', 'Gorilla'], ['schildkroete', 'Schildkröte'], ['nashorn', 'Nashorn'], ['elefant', 'Elefant'], ['stier', 'Stier'], ['wolf', 'Wolf'], ['dachs', 'Dachs'], ['gepard', 'Gepard'], ['loewe', 'Löwe'], ['hai', 'Hai'], ['falke', 'Falke'], ['tiger', 'Tiger']];
var FANS = [['autogramm', 'Autogrammstunde'], ['training', 'Öffentliches Training'], ['umfrage', 'Fan-Umfrage'], ['fanclub', 'Fanclub-Besuch'], ['stammtisch', 'Fan-Stammtisch'], ['social', 'Social-Media-Gewinnspiel'], ['freibier', 'Freibier-Runde'], ['bus', 'Fanbus Auswärtsspiel'], ['schal', 'Schal-Aktion'], ['camp', 'Kinder-Fußballcamp']];
var LISTS = [['hintergrund', 'Hintergrundbilder (Auswahl in den Einstellungen)'], ['kauf', 'Spielerkauf (zufällig)'], ['verkauf', 'Spielerverkauf (zufällig)'], ['gif', 'Clips im Livestream (GIF)'], ['rel', 'Partnerbilder (Privatleben)']];
var D0 = null, MAP = {}, SECTION = 'over';

function $(s) { return document.querySelector(s); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(t, err) { var el = document.createElement('div'); el.className = 'toast' + (err ? ' err' : ''); el.textContent = t; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 3500); }
function dt(s) { return s ? new Date(s).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '–'; }
function eur(c) { return ((c || 0) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }); }

function start() {
  sessLoad(); authFromUrl();
  if (!SESSION) return loginGate();
  myProfile().then(function (p) {
    if (!p || !p.is_admin) return gate('Kein Zugriff. Diese Seite ist nur für den Entwickler.');
    var X = MGR_DATA; D0 = MGR.normalize({ regeln: X.REGELN, ligen: X.LIGEN, ausbau: X.AUSBAU, camps: X.CAMPS, events: X.EVENTS, konfig: X.KONFIG, mails: X.MAILS, vornamen: X.VORNAMEN, nachnamen: X.NACHNAMEN });
    $('#who').textContent = p.display_name; nav('over');
  }).catch(function (e) { gate('Fehler: ' + e.message); });
}
function loginGate(err) {
  $('#main').innerHTML = '<div class="card" style="max-width:380px;margin:40px auto"><h2>Admin-Login</h2>' + (err ? '<p class="err">' + esc(err) + '</p>' : '') + '<input id="lgm" type="email" placeholder="E-Mail" autocomplete="username" style="width:100%;margin:6px 0"><input id="lgp" type="password" placeholder="Passwort" autocomplete="current-password" style="width:100%;margin:6px 0" onkeydown="if(event.key===\'Enter\')admLogin()"><button class="btn" style="width:100%;margin-top:8px" onclick="admLogin()">Anmelden</button><button class="btn" style="width:100%;margin-top:8px;background:#fff;color:#222" onclick="authGoogle()">Mit Google anmelden</button><p class="small" style="opacity:.7;margin-top:12px">Gleiches Konto wie im Spiel. Nur Konten mit Admin-Rechten kommen hinein.</p></div>';
}
function admLogin() { var m = ($('#lgm').value || '').trim(), pw = $('#lgp').value || ''; if (!m || !pw) return toast('E-Mail und Passwort eingeben.', true); authSignIn(m, pw).then(function () { start(); }).catch(function (e) { loginGate(e.message || 'Anmeldung fehlgeschlagen.'); }); }
function admLogout() { authSignOut(); loginGate(); }
function gate(msg) { $('#main').innerHTML = '<div class="card"><h2>Admin</h2><p>' + esc(msg) + '</p><a class="btn" href="./">Zum Spiel</a> <button class="btn" onclick="admLogout()">Anderes Konto</button></div>'; }
function nav(k) { SECTION = k; document.querySelectorAll('nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.k === k); }); ({ over: showOver, fb: showFb, img: showImg, lig: showLig, inv: showInv, key: showKeys, cfg: showCfg })[k](); }

/* ---------- Übersicht */
function showOver() {
  $('#main').innerHTML = '<div class="spin"></div>';
  rpc('admin_overview').then(function (o) {
    var rev = o.revenue_cents || {}, tot = Object.keys(rev).reduce(function (a, k) { return a + rev[k]; }, 0);
    var tile = function (n, l) { return '<div class="tile"><b>' + n + '</b><span>' + l + '</span></div>'; };
    $('#main').innerHTML = '<div class="tiles">' + tile(o.users_total, 'Nutzer gesamt') + tile(o.online_now, 'Gerade online') + tile(o.peak_online, 'Höchststand gleichzeitig') + tile(o.saves_total, 'Spielstände') + tile(o.tickets_open, 'Offene Tickets') + '</div>' +
      '<div class="card"><h3>Umsatz</h3><table><tr><th>Modus</th><th class="r">Umsatz</th></tr>' + [['single', 'Single Mode'], ['club', 'Create a Club'], ['multi', 'Multiplayer']].map(function (m) { return '<tr><td>' + m[1] + '</td><td class="r">' + eur(rev[m[0]]) + '</td></tr>'; }).join('') + '<tr class="sum"><td>Gesamt</td><td class="r">' + eur(tot) + '</td></tr></table><p class="muted">In der Testphase ist alles kostenlos.</p></div>';
  }).catch(function (e) { $('#main').innerHTML = '<div class="card err">' + esc(e.message) + '</div>'; });
}

/* ---------- Feedback */
function showFb() {
  $('#main').innerHTML = '<div class="spin"></div>';
  rpc('admin_tickets').then(function (rows) {
    if (!rows.length) { $('#main').innerHTML = '<div class="card"><p class="muted">Noch kein Feedback.</p></div>'; return; }
    $('#main').innerHTML = rows.map(function (t) {
      return '<div class="card tk' + (t.answer ? ' done' : '') + '"><div class="tkh"><b>T' + t.ticket_no + '</b> · ' + esc(t.user_name || '?') + ' <span class="muted">' + dt(t.created_at) + '</span>' + (t.answer ? '<span class="pill g">beantwortet' + (t.answer_read_at ? ' · gelesen' : '') + '</span>' : '<span class="pill y">offen</span>') + '</div>' +
        '<div class="msg">' + esc(t.message) + '</div><textarea id="a' + t.id + '" placeholder="Antwort – erscheint beim Spieler im Entwickler-Chat">' + esc(t.answer || '') + '</textarea><button class="btn" onclick="answer(' + t.id + ')">' + (t.answer ? 'Antwort ändern' : 'Antworten') + '</button></div>';
    }).join('');
  }).catch(function (e) { $('#main').innerHTML = '<div class="card err">' + esc(e.message) + '</div>'; });
}
function answer(id) {
  var txt = $('#a' + id).value.trim(); if (!txt) return toast('Bitte eine Antwort eingeben.', true);
  rest('feedback_tickets?id=eq.' + id, { method: 'PATCH', body: { answer: txt } }).then(function () { toast('Antwort gesendet ✓'); showFb(); }).catch(function (e) { toast(e.message, true); });
}

/* ---------- Bilder */
function loadMap() { return fetch(SB.url + '/rest/v1/media?select=key,path,updated_at&order=key&limit=3000', { headers: sbHeaders() }).then(function (r) { return r.json(); }).then(function (rows) { MAP = {}; (rows || []).forEach(function (m) { MAP[m.key] = m; }); }); }
function showImg(keep) {
  var y = keep ? window.scrollY : 0;
  if (!keep) $('#main').innerHTML = '<div class="spin"></div>';
  Promise.all([loadMap(), rest('game_config?select=value&key=eq.bgDefault').then(function (r) { BGDEF = r && r[0] ? r[0].value : ''; }).catch(function () {})]).then(function () {
    var ab = function (L) { return L.slice().sort(function (a, b) { return String(a[1] || a[0]).localeCompare(String(b[1] || b[0]), 'de', { sensitivity: 'base' }); }); };
    var grp = function (title, g, list, note) { list = ab(list); return fold(title, list.length, (note ? '<p class="muted">' + note + '</p>' : '') + '<div class="grid">' + list.map(function (x) { return slot(g + '.' + x[0], x[1]); }).join('') + '</div>'); };
    var items = (D0.itemList || []).map(function (it) { return [it.id, it.name + ' (' + it.cat + ')']; });
    var camps = (D0.camps || []).map(function (c) { return [c.id, c.name]; });
    var shop = (MGR.SHOP || []).map(function (s) { return [s[0], s[2] + ' (' + s[1] + ')']; });
    var stad = Object.keys(MAP).filter(function (k) { return k.indexOf('stad.') === 0; }).map(function (k) { return [k.slice(5), k.slice(5)]; });
    $('#main').innerHTML =
      '<div class="card"><p class="muted">Klick auf ein Feld oder zieh ein Bild aus deinem Ordner direkt darauf, um es hochzuladen oder zu ersetzen. Bilder werden automatisch verkleinert und als WebP gespeichert (Hintergründe max. 1920 px, kleine Bilder max. 900 px). Änderungen sind sofort im Spiel sichtbar (Seite neu laden).</p>' + (function () { var n = Object.keys(MAP).filter(function (k) { return !/\.(webp|gif)$/i.test(MAP[k].path); }).length; return n ? '<p><button class="btn" id="optb" onclick="optimizeAll()">⚡ ' + n + ' ältere Bilder optimieren (schnelleres Laden)</button></p>' : '<p class="muted">✓ Alle Bilder sind optimiert.</p>'; })() + '</div>' +
      grp('Titel- & Popup-Bilder', 'bg', BG) +
      grp('Maskottchen', 'masc', MASC, 'Quadratisch sieht am besten aus.') + grp('Scouting-Tools', 'scout', SCOUT) + grp('Fan-Aktionen', 'fans', FANS) +
      grp('Ausbau & Erweiterungen', 'ausbau', items) + grp('Trainingslager', 'camp', camps) + grp('Privat-Shop', 'priv', shop) +
      fold('Stadionbilder (Eintrittskarte)', stad.length, '<p class="muted">Vereinsname exakt wie im Spiel.</p><div class="row"><input id="stn" placeholder="Vereinsname, z. B. SV Wachtberg"><button class="btn" onclick="pickNamed()">Bild wählen</button></div><div class="grid">' + ab(stad).map(function (x) { return slot('stad.' + x[0], x[1]); }).join('') + '</div>') +
      LISTS.slice().sort(function (a, b) { return a[1].localeCompare(b[1], 'de'); }).map(function (l) { var ks = Object.keys(MAP).filter(function (k) { return k.indexOf(l[0] + '.') === 0; }); return fold(l[1], ks.length, '<div class="grid">' + ks.map(function (k) { return slot(k, ''); }).join('') + '<div class="slot add" data-list="' + l[0] + '" onclick="pickList(\'' + l[0] + '\')"><span>＋ Bilder hinzufügen<br><small>oder hierher ziehen</small></span></div></div>'); }).join('');
    if (keep) window.scrollTo(0, y);
  });
}
// Kategorie zum Auf- und Zuklappen (Zustand bleibt im Browser gespeichert)
function fold(title, n, body) { var k = 'amfold.' + title, open = false; try { open = localStorage.getItem(k) === '1'; } catch (e) {} return '<details class="card fold"' + (open ? ' open' : '') + ' ontoggle="try{localStorage.setItem(\'' + k.replace(/'/g, '') + '\', this.open ? \'1\' : \'0\')}catch(e){}"><summary><h3>' + title + ' <span class="pill">' + n + '</span></h3></summary>' + body + '</details>'; }
var BGDEF = '';
// Standard-Hintergrund für alle, die noch keinen eigenen gewählt haben
function bgDef(u) { var p = u ? rest('game_config', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: { key: 'bgDefault', value: u, updated_at: new Date().toISOString(), updated_by: SESSION.user.id } }) : rest('game_config?key=eq.bgDefault', { method: 'DELETE' }); p.then(function () { toast(u ? 'Standard-Hintergrund gesetzt ✓' : 'Kein Standard mehr'); showImg(true); }).catch(function (e) { toast(e.message, true); }); }
function slot(key, label) {
  var m = MAP[key], u = m ? mediaUrl(m.path) : '';
  return '<div class="slot' + (m ? ' has' : '') + '" title="' + esc(key) + '"><div class="th" data-key="' + esc(key) + '" onclick="pick(\'' + esc(key).replace(/'/g, '') + '\')" style="' + (u ? 'background-image:url(&quot;' + u + '&quot;)' : '') + '">' + (u ? '' : '<span>＋</span>') + '</div><div class="lb">' + esc(label || key.split('.').slice(1).join('.')) + '</div>' + (m ? '<button class="x" onclick="delImg(\'' + esc(key).replace(/'/g, '') + '\')" title="Entfernen">✕</button>' : '') + (m && key.indexOf('hintergrund.') === 0 ? '<button class="bgstar' + (BGDEF === u ? ' on' : '') + '" onclick="bgDef(' + (BGDEF === u ? '\'\'' : '\'' + u.replace(/'/g, '') + '\'') + ')" title="' + (BGDEF === u ? 'Standard (klicken zum Aufheben)' : 'Als Standard für neue Spieler') + '">' + (BGDEF === u ? '★ Standard' : '☆ Standard') + '</button>' : '') + '</div>';
}
function chooser(multi, cb) { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = !!multi; i.onchange = function () { cb(Array.prototype.slice.call(i.files)); }; i.click(); }
function pick(key) { chooser(false, function (f) { if (f[0]) upload(key, f[0]).then(function () { showImg(true); }); }); }
function pickNamed() { var n = $('#stn').value.trim(); if (!n) return toast('Bitte Vereinsnamen eingeben.', true); pick('stad.' + n); }
function pickList(g) { chooser(true, function (fs) { uploadList(g, fs); }); }
function uploadList(g, fs) { var n = Date.now(), p = Promise.resolve(); fs.forEach(function (f, i) { p = p.then(function () { return upload(g + '.' + (n + i), f); }); }); return p.then(function () { showImg(true); }); }
// Bilder aus dem Explorer/Finder direkt auf ein Feld ziehen
function dropTarget(e) { var t = e.target.closest && e.target.closest('.th[data-key], .slot.add[data-list]'); return t; }
document.addEventListener('dragover', function (e) { var t = dropTarget(e); if (!t) return; e.preventDefault(); document.querySelectorAll('.drop').forEach(function (x) { if (x !== t) x.classList.remove('drop'); }); t.classList.add('drop'); });
document.addEventListener('dragleave', function (e) { var t = dropTarget(e); if (t && !t.contains(e.relatedTarget)) t.classList.remove('drop'); });
document.addEventListener('drop', function (e) {
  var t = dropTarget(e); if (!t) return; e.preventDefault(); t.classList.remove('drop');
  var fs = Array.prototype.slice.call(e.dataTransfer.files || []).filter(function (f) { return /^image\//.test(f.type); });
  if (!fs.length) return toast('Bitte eine Bilddatei hierher ziehen.', true);
  if (t.dataset.list) uploadList(t.dataset.list, fs); else upload(t.dataset.key, fs[0]).then(function () { showImg(true); });
});
window.addEventListener('dragover', function (e) { e.preventDefault(); }); window.addEventListener('drop', function (e) { e.preventDefault(); });
// Verkleinern (GIFs bleiben unverändert, damit die Animation erhalten bleibt)
function maxFor(key) { return /^(bg|hintergrund|kauf|verkauf|rel)\./.test(key) ? 1920 : 900; }
function optimizeAll() {
  var ks = Object.keys(MAP).filter(function (k) { return !/\.(webp|gif)$/i.test(MAP[k].path); }), i = 0, b = $('#optb'); if (!ks.length) return;
  if (b) b.disabled = true;
  var next = function () {
    if (i >= ks.length) { toast('Fertig – ' + ks.length + ' Bilder optimiert ✓'); return showImg(true); }
    var k = ks[i++]; if (b) b.textContent = '⏳ Optimiere ' + i + ' / ' + ks.length + ' …';
    fetch(mediaUrl(MAP[k].path)).then(function (r) { if (!r.ok) throw new Error('Laden fehlgeschlagen'); return r.blob(); }).then(function (bl) { return upload(k, bl, true); }).then(next, function () { next(); });
  };
  next();
}
function shrink(file, max) {
  if (file.type === 'image/gif') return Promise.resolve({ blob: file, ext: 'gif', type: 'image/gif' });
  return new Promise(function (res, rej) {
    var img = new Image(); img.onload = function () {
      var s = Math.min(1, (max || 1920) / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      var png = false; c.toBlob(function (b) { b ? res({ blob: b, ext: png ? 'png' : 'webp', type: png ? 'image/png' : 'image/webp' }) : rej(new Error('Bild konnte nicht gelesen werden.')); }, png ? 'image/png' : 'image/webp', 0.82);
    }; img.onerror = function () { rej(new Error('Bild konnte nicht gelesen werden.')); }; img.src = URL.createObjectURL(file);
  });
}
function upload(key, file, quiet) {
  if (!quiet) toast('Lade hoch …');
  return shrink(file, maxFor(key)).then(function (o) {
    var path = key.replace(/[^\w.-]+/g, '_') + '-' + Date.now() + '.' + o.ext;
    return ensureFresh().then(function () {
      return fetch(SB.url + '/storage/v1/object/media/' + encodeURIComponent(path), { method: 'POST', headers: { apikey: SB.key, Authorization: 'Bearer ' + SESSION.access_token, 'Content-Type': o.type }, body: o.blob });
    }).then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error('Upload fehlgeschlagen: ' + t); }); })
      .then(function () { var old = MAP[key]; return rest('media', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: { key: key, path: path, updated_at: new Date().toISOString() } }).then(function () { if (old) removeFile(old.path); }); })
      .then(function () { if (!quiet) toast('Gespeichert ✓'); MAP[key] = { key: key, path: path }; });
  }).catch(function (e) { toast(e.message, true); });
}
function removeFile(path) { return ensureFresh().then(function () { return fetch(SB.url + '/storage/v1/object/media', { method: 'DELETE', headers: { apikey: SB.key, Authorization: 'Bearer ' + SESSION.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [path] }) }); }).catch(function () { }); }
function delImg(key) {
  if (!confirm('Bild entfernen? Im Spiel erscheint dann wieder die Standardgrafik.')) return;
  var m = MAP[key]; rest('media?key=eq.' + encodeURIComponent(key), { method: 'DELETE' }).then(function () { if (m) removeFile(m.path); toast('Entfernt.'); showImg(true); }).catch(function (e) { toast(e.message, true); });
}
start();

/* ---------- Ligen (echte Staffeln aus fussball.de) */
var LG = { vb: 'Mittelrhein', eb: 0, st: null };
function ligDec(s) { return String(s).replace(/&#8203;|​/g, '').replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/\s+/g, ' ').trim(); }
function showLig() {
  $('#main').innerHTML = '<div class="card"><h3>Echte Ligen (NRW und Rheinland-Pfalz)</h3><p class="muted">Quelle: fussball.de, abgerufen per GitHub Actions („Ligadaten holen“). Nach jedem Abruf werden sie automatisch übernommen; der Knopf holt den aktuellen Stand von Hand. Von Hand geänderte Namen bleiben beim nächsten Import erhalten.</p>' +
    '<div class="row"><button class="btn" onclick="ligImport()">Ligendaten importieren</button><span class="muted" id="ligst"></span></div>' +
    '<div class="row"><select id="ligvb" onchange="LG.vb=this.value;LG.eb=0;LG.st=null;ligList()">' + ['Mittelrhein', 'Niederrhein', 'Westfalen', 'RV West', 'Rheinland', 'Südwest', 'RV Südwest', 'Baden', 'Südbaden', 'Württemberg', 'Oberliga BW', 'Bayern', 'DFB'].map(function (v) { return '<option' + (v === LG.vb ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select>' +
    '<input id="ligq" placeholder="Mannschaft suchen …" onkeydown="if(event.key===\'Enter\')ligSearch()"><button class="btn" onclick="ligSearch()">Suchen</button></div></div><div id="ligbox"><div class="spin"></div></div>';
  ligList();
}
function ligList() {
  rest('ligen_staffeln?select=id,ebene,klasse,name,name_fd,gebiet,aktiv,name_fix&verband=eq.' + encodeURIComponent(LG.vb) + '&order=ebene,name').then(function (rows) {
    if (!rows.length) { $('#ligbox').innerHTML = '<div class="card"><p class="muted">Noch keine Daten – bitte oben importieren.</p></div>'; return; }
    var by = {}; rows.forEach(function (r) { (by[r.ebene] = by[r.ebene] || []).push(r); });
    $('#ligbox').innerHTML = Object.keys(by).map(function (e) {
      return '<div class="card"><h3>Ebene ' + e + ' · ' + esc(by[e][0].klasse) + ' <span class="pill">' + by[e].length + ' Staffeln</span></h3><table>' + by[e].map(function (r) {
        return '<tr><td style="width:55%"><input value="' + esc(r.name) + '" id="sn_' + r.id + '"></td><td class="muted">' + esc(r.gebiet || '') + (r.name_fix ? ' <span class="pill y">angepasst</span>' : '') + '</td><td class="r"><button class="btn" onclick="ligSaveS(\'' + r.id + '\')">Speichern</button> <button class="btn" onclick="ligTeams(\'' + r.id + '\')">Teams</button></td></tr><tr><td colspan="3" id="tm_' + r.id + '"></td></tr>';
      }).join('') + '</table></div>';
    }).join('');
  }).catch(function (e) { $('#ligbox').innerHTML = '<div class="card err">' + esc(e.message) + '</div>'; });
}
function ligSaveS(id) { var v = $('#sn_' + id).value.trim(); if (!v) return; rest('ligen_staffeln?id=eq.' + id, { method: 'PATCH', body: { name: v, name_fix: true } }).then(function () { toast('Gespeichert ✓'); }).catch(function (e) { toast(e.message, true); }); }
function ligTeamRows(rows) {
  return '<table>' + rows.map(function (t) {
    return '<tr><td style="width:55%"><input value="' + esc(t.name) + '" id="tn_' + t.id + '"></td><td class="muted">' + (t.name_fd && ligDec(t.name_fd) !== t.name ? 'fussball.de: ' + esc(ligDec(t.name_fd)) : '') + (t.staffel ? ' ' + esc(t.staffel) : '') + '</td><td><label class="muted"><input type="checkbox" style="width:auto" ' + (t.aktiv ? 'checked' : '') + ' onchange="ligAkt(\'' + t.id + '\',this.checked)"> spielbar</label></td><td class="r"><button class="btn" onclick="ligSaveT(\'' + t.id + '\')">Speichern</button></td></tr>';
  }).join('') + '</table>';
}
function ligTeams(id) {
  var box = $('#tm_' + id); if (box.innerHTML) { box.innerHTML = ''; return; }
  rest('ligen_teams?select=id,name,name_fd,aktiv&staffel_id=eq.' + id + '&order=name').then(function (rows) { box.innerHTML = ligTeamRows(rows); });
}
function ligSearch() {
  var q = $('#ligq').value.trim(); if (q.length < 2) return;
  rest('ligen_teams?select=id,name,name_fd,aktiv,ligen_staffeln(name,verband)&name=ilike.*' + encodeURIComponent(q) + '*&limit=50').then(function (rows) {
    rows.forEach(function (t) { t.staffel = t.ligen_staffeln ? t.ligen_staffeln.name + ' (' + t.ligen_staffeln.verband + ')' : ''; });
    $('#ligbox').innerHTML = '<div class="card"><h3>Suche: ' + esc(q) + '</h3>' + (rows.length ? ligTeamRows(rows) : '<p class="muted">Nichts gefunden.</p>') + '</div>';
  }).catch(function (e) { toast(e.message, true); });
}
function ligSaveT(id) { var v = $('#tn_' + id).value.trim(); if (!v) return; rest('ligen_teams?id=eq.' + id, { method: 'PATCH', body: { name: v, name_fix: true } }).then(function () { toast('Gespeichert ✓'); }).catch(function (e) { toast(e.message, true); }); }
function ligAkt(id, on) { rest('ligen_teams?id=eq.' + id, { method: 'PATCH', body: { aktiv: on } }).then(function () { toast(on ? 'Spielbar ✓' : 'Ausgeblendet ✓'); }).catch(function (e) { toast(e.message, true); }); }
function ligImport() {
  var st = $('#ligst'); st.textContent = 'Import läuft …';
  game('ligenImport', {}).then(function (r) {
    if (r.status === 'recent') { st.textContent = 'Wurde gerade erst importiert (' + dt(r.at) + ') – höchstens alle 3 Minuten.'; return; }
    st.textContent = 'Fertig: ' + r.staffeln + ' Staffeln, ' + r.teams + ' Mannschaften.'; toast('Import fertig ✓'); ligList();
  }).catch(function (e) { st.textContent = ''; toast(e.message, true); });
}

/* ---------- Zugangscodes (Testphase) */
function keyNew() {
  var a = new Uint32Array(1); crypto.getRandomValues(a); var code = String(10000000 + (a[0] % 90000000));
  rest('access_keys', { method: 'POST', body: { code: code, note: ($('#keyn').value || '').trim().slice(0, 80) || null, created_by: SESSION.user.id } }).then(function () { toast('Key ' + code.slice(0, 4) + ' ' + code.slice(4) + ' erstellt ✓'); try { navigator.clipboard.writeText(code); } catch (e) {} showKeys(); }).catch(function (e) { toast(e.message, true); });
}
function keyDel(c) { if (!confirm('Key ' + c + ' löschen?')) return; rest('access_keys?code=eq.' + c, { method: 'DELETE' }).then(showKeys); }
function showKeys() {
  $('#main').innerHTML = '<div class="spin"></div>';
  Promise.all([rpc('admin_keys', {}), game('refAdmin', {})]).then(function (a) {
    var K = a[0] || [], used = K.filter(function (k) { return k.used_at; }), dv = (a[1] || {}).dev || { n: 0 };
    var fmt = function (c) { return c.slice(0, 4) + ' ' + c.slice(4); };
    $('#main').innerHTML = '<div class="card"><h3>Zugangscodes <span class="pill">' + K.length + ' erstellt</span> <span class="pill y">' + used.length + ' eingelöst</span> <span class="pill">' + (K.length - used.length) + ' frei</span> <span class="pill">' + dv.n + ' über deinen Affiliate-Link</span></h3><p class="muted">Ohne Code kann niemand ein Spiel starten oder laden. Jeder Code gilt genau einmal und schaltet das Konto dauerhaft frei. Beim Erstellen wird er in die Zwischenablage kopiert.</p>' +
      '<div class="row"><input id="keyn" placeholder="Für wen? (Notiz, optional)" style="max-width:300px" onkeydown="if(event.key===\'Enter\')keyNew()"><button class="btn" onclick="keyNew()">🔑 Key generieren</button></div></div>' +
      '<div class="card"><table><tr><th>Key</th><th>Notiz</th><th>erstellt</th><th>Status</th><th>verwendet von</th><th>eingeladen von</th><th></th></tr>' +
      (K.length ? K.map(function (k) { return '<tr' + (k.used_at ? ' style="opacity:.55"' : '') + '><td class="keyc">' + fmt(k.code) + '</td><td>' + esc(k.note || '') + '</td><td>' + new Date(k.created_at).toLocaleDateString('de-DE') + '</td><td>' + (k.used_at ? '<span class="pill">benutzt ' + new Date(k.used_at).toLocaleDateString('de-DE') + '</span>' : '<span class="pill y">frei</span>') + '</td><td>' + (k.used_name ? esc(k.used_name) + '<div class="muted" style="font-size:11px">' + esc(k.used_email || '') + '</div>' : '–') + '</td><td>' + esc(k.invited_by || '–') + '</td><td class="r">' + (k.used_at ? '' : '<button class="btn" onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + k.code + '\');toast(\'Kopiert\')">Kopieren</button> <button class="btn" onclick="keyDel(\'' + k.code + '\')">✕</button>') + '</td></tr>'; }).join('') : '<tr><td colspan="7" class="muted">Noch keine Keys.</td></tr>') + '</table></div>';
  }).catch(function (e) { $('#main').innerHTML = '<div class="card err">' + esc(e.message) + '</div>'; });
}
/* ---------- Affiliate / Seller-Team */
function affFlag(code, k, v) { var b = {}; b[k] = !!v; rest('invite_codes?code=eq.' + encodeURIComponent(code), { method: 'PATCH', body: b }).then(function () { toast((k === 'seller' ? 'Seller' : 'Partner') + (v ? ' gesetzt ✓' : ' entfernt')); showInv(); }).catch(function (e) { toast(e.message, true); }); }
function affBox(t, L) { var sum = function (k) { return L.reduce(function (a, x) { return a + (x[k] || 0); }, 0); }; return '<div class="card"><h3>' + t + ' <span class="pill">' + L.length + '</span> <span class="pill y">' + sum('reg') + ' Anmeldungen</span> <span class="pill">' + sum('s1') + ' mit 1+ Saison</span></h3>' + (L.length ? '<table><tr><th>Code</th><th>Wer</th><th class="r">Anmeldungen</th><th class="r">1+ Saison</th><th class="r">letzte 30 Tage</th></tr>' + L.map(function (x) { return '<tr><td><b>' + esc(x.code) + '</b></td><td>' + esc(x.label || x.owner || '–') + '</td><td class="r">' + x.reg + '</td><td class="r">' + x.s1 + '</td><td class="r">' + x.d30 + '</td></tr>'; }).join('') + '</table>' : '<p class="muted">Noch niemand markiert – Häkchen unten in der Liste setzen.</p>') + '</div>'; }
function showInv(add, label) {
  $('#main').innerHTML = '<div class="spin"></div>';
  game('refAdmin', add ? { add: add, label: label } : {}).then(function (r) {
    var rows = r.rows || [], tot = rows.reduce(function (a, x) { return a + x.reg; }, 0);
    var dv = r.dev || { n: 0, sub: 0, list: [] };
    $('#main').innerHTML = '<div class="card"><h3>Ich (Entwickler) <span class="pill">' + dv.n + ' eingeladen</span> <span class="pill y">' + dv.sub + ' von ihnen eingeladen</span></h3>' +
      (dv.list.length ? '<table><tr><th>Wer</th><th>seit</th><th class="r">Saisons</th><th class="r">hat eingeladen</th></tr>' + dv.list.map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td>' + new Date(x.at).toLocaleDateString('de-DE') + '</td><td class="r">' + x.s + '</td><td class="r">' + x.sub + '</td></tr>'; }).join('') + '</table>' : '<p class="muted">Über deinen Link hat sich noch niemand angemeldet.</p>') + '</div>' +
      affBox('🧑‍💼 Seller', rows.filter(function (x) { return x.seller; })) + affBox('🤝 Partner', rows.filter(function (x) { return x.partner; })) +
      '<div class="card"><h3>Seller-Code anlegen</h3><p class="muted">Für dein Vermarktungsteam (Link: amateur-manager.de/?ref=CODE). Gezählt wird, wer sich über den Code anmeldet und wer mindestens eine Saison spielt.</p>' +
      '<div class="row"><input id="invc" placeholder="Code, z. B. TEAM-MAX" style="max-width:220px"><input id="invl" placeholder="Name / Notiz" style="max-width:260px"><button class="btn" onclick="showInv($(\'#invc\').value, $(\'#invl\').value)">Seller-Code anlegen</button></div></div>' +
      '<div class="card"><h3>Alle Codes <span class="pill">' + tot + ' Anmeldungen gesamt</span></h3><table><tr><th>Code</th><th>Wer</th><th class="r">Anmeldungen</th><th class="r">bestätigt</th><th class="r">1+ Saison</th><th class="r">letzte 30 Tage</th><th>Seller</th><th>Partner</th><th></th></tr>' +
      (rows.length ? rows.map(function (x) { return '<tr><td><b>' + esc(x.code) + '</b></td><td>' + esc(x.label || x.owner || '–') + '</td><td class="r">' + x.reg + '</td><td class="r">' + x.conf + '</td><td class="r">' + x.s1 + '</td><td class="r">' + x.d30 + '</td><td><input type="checkbox"' + (x.seller ? ' checked' : '') + ' onchange="affFlag(\'' + esc(x.code) + '\',\'seller\',this.checked)"></td><td><input type="checkbox"' + (x.partner ? ' checked' : '') + ' onchange="affFlag(\'' + esc(x.code) + '\',\'partner\',this.checked)"></td><td class="r"><button class="btn" onclick="navigator.clipboard&&navigator.clipboard.writeText(\'https://amateur-manager.de/?ref=' + esc(x.code) + '\');toast(\'Link kopiert\')">Link</button></td></tr>'; }).join('') : '<tr><td colspan="9" class="muted">Noch keine Einladungen.</td></tr>') + '</table></div>';
    if (add) toast('Code angelegt ✓');
  }).catch(function (e) { $('#main').innerHTML = '<div class="card err">' + esc(e.message) + '</div>'; });
}

/* ---------- Vorgaben: Spielwerte ohne Code ändern (Tabelle game_config, gilt sofort für Server und Spiel) */
var CF = {}, CFI = null;
function cfgLoad() { return Promise.all([rest('game_config?select=key,value'), loadMap()]).then(function (a) { var rows = a[0]; CF = {}; (rows || []).forEach(function (r) { CF[r.key] = r.value; }); MGR.applyCfg(D0, rows || []); CFI = MGR.cfgInfo(D0); }); }
function cfgPut(key, val) {
  var p = val == null ? rest('game_config?key=eq.' + encodeURIComponent(key), { method: 'DELETE' }) : rest('game_config', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: { key: key, value: val, updated_at: new Date().toISOString(), updated_by: SESSION.user.id } });
  return p.then(function () { return game('cfgReload', {}).catch(function () {}); }).then(function () { toast(val == null ? 'Standardwerte wiederhergestellt ✓' : 'Gespeichert – gilt ab sofort im Spiel ✓'); showCfg(true); }).catch(function (e) { toast(e.message, true); });
}
function cfgNum(sel) { var o = {}; document.querySelectorAll(sel).forEach(function (i) { var v = i.value.trim(); if (v === '') return; var k = i.dataset.k, f = i.dataset.f; if (f) { o[k] = o[k] || {}; o[k][f] = i.type === 'number' ? +v : v; } else o[k] = i.type === 'number' ? +v : v; }); return o; }
function nIn(k, f, v, def, w) { var chg = def != null && v != null && v !== '' && +v !== +def; return '<input type="number" class="cfi' + (chg ? ' chg' : '') + '" data-k="' + k + '"' + (f != null ? ' data-f="' + f + '"' : '') + ' value="' + (v == null ? '' : v) + '" placeholder="' + (def == null ? '' : def) + '" style="width:' + (w || 90) + 'px"' + (chg ? ' title="Standard: ' + def + '"' : '') + '>'; }
function tIn(k, f, v, def, w) { var chg = v != null && v !== '' && v !== def; return '<input class="cfi' + (chg ? ' chg' : '') + '" data-k=""' + k + '"' + (f != null ? ' data-f="' + f + '"' : '') + ' value="' + esc(v == null ? '' : v) + '" placeholder="' + esc(def || '') + '" style="width:' + (w || 200) + 'px">'; }
function cfgBtns(key, saveJs) { return '<div class="row" style="margin-top:10px;gap:8px"><button class="btn" onclick="' + saveJs + '">Speichern</button>' + (CF[key] != null ? '<button class="btn ghost" onclick="if(confirm(\'Alle Änderungen in diesem Bereich zurücksetzen?\'))cfgPut(\'' + key + '\', null)">Auf Standard zurücksetzen</button><span class="pill y">geändert</span>' : '<span class="muted" style="font-size:12px">Standardwerte</span>') + '</div>'; }
function lvName(l) { var x = CFI.lv.filter(function (o) { return o.l === +l; })[0]; return x ? x.short : 'Liga ' + l; }
function lvRows() { return CFI.lv.filter(function (x) { return x.l <= 11; }).slice().sort(function (a, b) { return a.l - b.l; }); }
// Liga-Felder aus mehreren Bereichen in einem Schlüssel „liga“ zusammenführen
function cfgLiga(sel) { var cur = JSON.parse(JSON.stringify(CF.liga || {})), add = {}; document.querySelectorAll(sel).forEach(function (i) { var l = i.dataset.k, f = i.dataset.f; cur[l] = cur[l] || {}; if (i.value.trim() === '') delete cur[l][f]; else cur[l][f] = +i.value; if (!Object.keys(cur[l]).length) delete cur[l]; }); return Object.keys(cur).length ? cur : null; }
function showCfg(keep) {
  var y = keep ? window.scrollY : 0; if (!keep) $('#main').innerHTML = '<div class="spin"></div>';
  cfgLoad().then(function () {
    var I = CFI, L = lvRows(), eur = function (n) { return (+n || 0).toLocaleString('de-DE') + ' €'; };
    var h = '<div class="card"><h3>Vorgaben</h3><p class="muted">Hier stehen die wichtigsten Spielwerte. Änderungen gelten nach dem Speichern sofort im Spiel und auf dem Server – ohne Code. Leere Felder = Standardwert (grau als Platzhalter). Einmal gespeicherte Bereiche kannst du jederzeit auf Standard zurücksetzen.</p></div>';
    // Gehalt
    h += fold('💶 Gehaltsstruktur je Liga', L.length, '<p class="muted">Monatsgehalt eines Spielers: von einem schwachen (untere Stärke der Liga) bis zu einem starken Spieler (obere Stärke). Alle Gehälter der Liga werden auf deine Spanne umgerechnet.</p><table><tr><th>Ebene</th><th>Liga</th><th>Standard</th><th>von €</th><th>bis €</th></tr>' + L.map(function (x) { var s = (CF.sal || {})[x.l]; return '<tr><td>' + x.l + '</td><td>' + esc(x.short) + '</td><td class="muted">' + eur(x.salDef[0]) + ' – ' + eur(x.salDef[1]) + '</td><td>' + nIn(x.l, 0, s ? s[0] : '', x.salDef[0]) + '</td><td>' + nIn(x.l, 1, s ? s[1] : '', x.salDef[1]) + '</td></tr>'; }).join('').replace(/class="cfi/g, 'class="cfi csal') + '</table>' + cfgBtns('sal', 'cfgSal()'));
    // Level
    h += fold('⭐ Manager-Level (XP)', I.xp.length, '<table><tr><th>Level</th><th>ab XP</th><th>Standard</th></tr>' + I.xp.map(function (v, i) { return '<tr><td>' + (i + 1) + '</td><td>' + nIn(i, null, (CF.xp || [])[i] != null && CF.xp ? CF.xp[i] : '', I.def.xp[i], 110).replace('class=\"cfi', 'class=\"cfi cxp') + '</td><td class="muted">' + (I.def.xp[i] || 0).toLocaleString('de-DE') + '</td></tr>'; }).join('') + '</table>' + cfgBtns('xp', 'cfgXp()'));
    h += fold('🔓 Freischaltungen (ab welchem Manager-Level)', I.feat.length, '<table><tr><th>Funktion</th><th>Beschreibung</th><th>Level</th></tr>' + I.feat.slice().sort(function (a, b) { return a.lvl - b.lvl; }).map(function (f) { var i0 = I.feat.indexOf(f); return '<tr><td><b>' + esc(f.n) + '</b></td><td class="muted" style="font-size:12px">' + esc(f.d) + '</td><td>' + nIn(f.k, null, (CF.feat || {})[f.k], I.def.feat[i0], 70).replace('class=\"cfi', 'class=\"cfi cfeat') + '</td></tr>'; }).join('') + '</table>' + cfgBtns('feat', 'cfgPut(\'feat\', cfgObj(\'.cfeat\'))'));
    h += fold('🔒 Start-Sperren (Verein dieser Liga ab Manager-Level)', 4, '<p class="muted">Gilt nur für die Vereinswahl beim Spielstart – Aufstiege sind immer erlaubt.</p><table><tr><th>Liga</th><th>ab Level</th></tr>' + [1, 2, 3, 4].map(function (l) { return '<tr><td>' + esc(lvName(l)) + '</td><td>' + nIn(l, null, (CF.ligaLvl || {})[l], I.def.ligaLvl[l], 70).replace('class=\"cfi', 'class=\"cfi cll') + '</td></tr>'; }).join('') + '</table>' + cfgBtns('ligaLvl', 'cfgPut(\'ligaLvl\', cfgObj(\'.cll\'))'));
    // Stärke + Zuschauer + Finanzen + Meister in „liga“
    var lrow = function (cols, cls) { return L.map(function (x) { var o = (CF.liga || {})[x.l] || {}, d = I.def.lv[x.l] || {}; return '<tr><td>' + x.l + '</td><td>' + esc(x.short) + '</td>' + cols.map(function (c) { return '<td>' + nIn(x.l, c, o[c], d[c], c === 'budget' || c === 'prize' ? 110 : 80).replace('class="cfi', 'class="cfi ' + (cls || 'cliga')) + '</td>'; }).join('') + '</tr>'; }).join(''); };
    h += fold('💪 Stärke-Bereiche je Liga', L.length, '<p class="muted">Teamstärke der Gegner in dieser Liga (von – bis).</p><table><tr><th>Ebene</th><th>Liga</th><th>von</th><th>bis</th></tr>' + lrow(['lo', 'hi']) + '</table>' + cfgBtns('liga', 'cfgPut(\'liga\', cfgLiga(\'.cliga\'))'));
    h += fold('👥 Zuschauer je Liga', L.length, '<p class="muted">Durchschnittliche Zuschauer, Ticketpreis und die zufälligen Startplätze des Stadions (von – bis) für neue Spielstände.</p><table><tr><th>Ebene</th><th>Liga</th><th>Ø Zuschauer</th><th>Ticket €</th><th>Plätze von</th><th>Plätze bis</th></tr>' + L.map(function (x) { var o = (CF.liga || {})[x.l] || {}, d = I.def.lv[x.l] || {}, c = (CF.capr || {})[x.l], cd = I.def.capr[x.l] || ['', '']; return '<tr><td>' + x.l + '</td><td>' + esc(x.short) + '</td><td>' + nIn(x.l, 'zus', o.zus, d.zus).replace('class=\"cfi', 'class=\"cfi cliga2') + '</td><td>' + nIn(x.l, 'ticket', o.ticket, d.ticket, 70).replace('class=\"cfi', 'class=\"cfi cliga2') + '</td><td>' + nIn(x.l, 0, c ? c[0] : '', cd[0]).replace('class=\"cfi', 'class=\"cfi ccap') + '</td><td>' + nIn(x.l, 1, c ? c[1] : '', cd[1]).replace('class=\"cfi', 'class=\"cfi ccap') + '</td></tr>'; }).join('') + '</table>' + cfgBtns('capr', 'cfgZus()'));
    h += fold('🏆 Prämien: Meister je Liga & Saisonbudget', L.length, '<p class="muted">Meisterprämie wird am Saisonende ausgezahlt. Budget, Sponsoren- und TV-Geld sind die Grundwerte der Liga.</p><table><tr><th>Ebene</th><th>Liga</th><th>Meisterprämie €</th><th>Budget €</th><th>Sponsoren €</th><th>TV-Geld €</th></tr>' + lrow(['prize', 'budget', 'spons', 'tv'], 'cliga3') + '</table>' + cfgBtns('liga', 'cfgPut(\'liga\', cfgLiga(\'.cliga3\'))'));
    h += fold('🥇 Pokalprämien & Pokalnamen', I.cups.length, '<table><tr><th>Pokal</th>' + I.rounds.map(function (r) { return '<th>' + esc(r) + '</th>'; }).join('') + '</tr>' + I.cups.map(function (c) { var o = (CF.cups || {})[c.k] || []; return '<tr><td>' + tIn(c.k, null, (CF.cupn || {})[c.k], I.def.cupn[c.k], 150).replace('class=\"cfi', 'class=\"cfi ccupn') + '</td>' + c.prize.map(function (v, i) { return '<td>' + nIn(c.k, i, o[i], I.def.cups[c.k][i], 95).replace('class=\"cfi', 'class=\"cfi ccup') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table><p class="muted">Prämie fürs Erreichen der Runde; die letzte Spalte ist der Pokalsieg.</p>' + cfgBtns('cups', 'cfgCups()'));
    // Lizenzen je Liga: Erweiterungen zuordnen
    var used = {}; Object.keys(CF.licItems || {}).forEach(function (id) { used[id] = +CF.licItems[id]; });
    h += fold('📜 Lizenz-Erweiterungen je Liga', L.length, '<p class="muted">Welche Erweiterung braucht ein Verein spätestens für welche Liga? Jede Erweiterung kann nur einer Liga zugeordnet werden – sie gilt dann auch für alle Ligen darüber. Dazu kommen die festen Auflagen (Plätze, Flutlicht).</p>' +
      L.map(function (x) { var mine = I.items.filter(function (it) { return used[it.id] === x.l; }); return '<details class="fold sub"><summary><b>' + x.l + ' · ' + esc(x.short) + '</b> <span class="pill">' + mine.length + ' Erweiterungen</span>' + (x.licCap ? ' <span class="pill">' + x.licCap.toLocaleString('de-DE') + ' Plätze</span>' : '') + (x.licFlut ? ' <span class="pill">' + (x.licFlut >= 3 ? 'TV-Flutlicht' : 'Spielflutlicht') + '</span>' : '') + '</summary><div class="row" style="gap:12px;margin:6px 0">Mind. Plätze ' + nIn(x.l, 'licCap', ((CF.liga || {})[x.l] || {}).licCap, (I.def.lv[x.l] || {}).licCap).replace('class=\"cfi', 'class=\"cfi clic') + ' Flutlicht (0/2/3) ' + nIn(x.l, 'licFlut', ((CF.liga || {})[x.l] || {}).licFlut, (I.def.lv[x.l] || {}).licFlut, 60).replace('class=\"cfi', 'class=\"cfi clic') + '</div><div class="licg">' +
        I.items.slice().sort(function (a, b) { return a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name, 'de'); }).map(function (it) { var u = used[it.id], dis = u && u !== x.l; return '<label class="' + (dis ? 'dis' : '') + '" title="' + (dis ? 'schon bei ' + esc(lvName(u)) : esc(it.cat)) + '"><input type="checkbox" class="clici" data-id="' + it.id + '" data-l="' + x.l + '"' + (u === x.l ? ' checked' : '') + (dis ? ' disabled' : '') + ' onchange="licTog(this)"> ' + esc(it.name) + (dis ? ' <small>(' + esc(lvName(u)) + ')</small>' : '') + '</label>'; }).join('') + '</div></details>'; }).join('') +
      '<div class="row" style="margin-top:10px;gap:8px"><button class="btn" onclick="cfgLic()">Speichern</button>' + (CF.licItems ? '<button class="btn ghost" onclick="if(confirm(\'Zuordnung löschen?\'))cfgPut(\'licItems\', null)">Zuordnung löschen</button>' : '') + '</div>');
    // Lehrgänge
    h += fold('🎓 Manager-Lehrgänge (Lizenzen)', I.courses.length, '<table><tr><th>Name</th><th>Anbieter</th><th>Kosten</th><th>Dauer</th><th>Wirkung</th></tr>' + I.courses.map(function (c, i) { var o = (CF.courses || {})[c.id] || {}; return '<tr><td>' + tIn(c.id, 'name', o.name, I.def.courses[i][0], 260).replace('class=\"cfi', 'class=\"cfi ccrs') + '</td><td>' + tIn(c.id, 'by', o.by, I.def.courses[i][1], 140).replace('class=\"cfi', 'class=\"cfi ccrs') + '</td><td>' + eur(c.cost) + '</td><td>' + c.days + ' Tage</td><td class="muted" style="font-size:12px">' + esc(c.fx) + '</td></tr>'; }).join('') + '</table>' + cfgBtns('courses', 'cfgPut(\'courses\', cfgTxt(\'.ccrs\'))'));
    // Erweiterungen
    h += fold('🏗️ Alle Erweiterungen', I.items.length, '<table><tr><th>Bereich</th><th>Name</th><th>Beschreibung</th><th>Preis €</th><th>monatl. €</th><th>Bautage</th><th>ab Level</th><th>Voraussetzung</th></tr>' + I.items.slice().sort(function (a, b) { return a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name, 'de'); }).map(function (it) { var o = (CF.items || {})[it.id] || {}, d = I.def.items[it.id]; return '<tr><td class="muted">' + esc(it.cat) + '</td><td>' + tIn(it.id, 'name', o.name, d.name, 190).replace('class=\"cfi', 'class=\"cfi citm') + '</td><td>' + tIn(it.id, 'desc', o.desc, d.desc, 260).replace('class=\"cfi', 'class=\"cfi citm') + '</td><td>' + nIn(it.id, 'cost', o.cost, d.cost, 105).replace('class=\"cfi', 'class=\"cfi citm') + '</td><td>' + nIn(it.id, 'monthly', o.monthly, d.monthly, 80).replace('class=\"cfi', 'class=\"cfi citm') + '</td><td>' + nIn(it.id, 'days', o.days, d.days, 65).replace('class=\"cfi', 'class=\"cfi citm') + '</td><td>' + it.flvl + '</td><td class="muted" style="font-size:12px">' + esc(it.req ? (I.items.filter(function (q) { return q.id === it.req; })[0] || {}).name || it.req : '–') + '</td></tr>'; }).join('') + '</table>' + cfgBtns('items', 'cfgPut(\'items\', cfgTxt(\'.citm\'))'));
    // Vereinsfeste
    h += fold('📅 Kalender-Termine (Feste, Treffen)', I.dayev.length, '<table><tr><th>Name</th><th>Beschreibung</th><th>Kosten €</th></tr>' + I.dayev.map(function (e) { var o = (CF.dayev || {})[e.k] || {}, d = I.def.dayev[e.k]; return '<tr><td>' + tIn(e.k, 'name', o.name, d[0], 220).replace('class=\"cfi', 'class=\"cfi cday') + '</td><td class="muted" style="font-size:12px">' + esc(e.d) + '</td><td>' + nIn(e.k, 'cost', o.cost, d[1], 90).replace('class=\"cfi', 'class=\"cfi cday') + '</td></tr>'; }).join('') + '</table>' + cfgBtns('dayev', 'cfgPut(\'dayev\', cfgTxt(\'.cday\'))'));
    // Instagram
    h += fold('📸 Instagram-Profile', (I.insta || []).length, instaHtml());
    $('#main').innerHTML = h; if (keep) window.scrollTo(0, y);
  }).catch(function (e) { $('#main').innerHTML = '<div class="card err">' + esc(e.message) + '</div>'; });
}
function cfgObj(sel) { var o = {}; document.querySelectorAll(sel).forEach(function (i) { if (i.value.trim() !== '') o[i.dataset.k] = +i.value; }); return Object.keys(o).length ? o : null; }
function cfgTxt(sel) { var o = {}; document.querySelectorAll(sel).forEach(function (i) { var v = i.value.trim(); if (v === '') return; o[i.dataset.k] = o[i.dataset.k] || {}; o[i.dataset.k][i.dataset.f] = i.type === 'number' ? +v : v; }); return Object.keys(o).length ? o : null; }
function cfgSal() { var o = {}; document.querySelectorAll('.csal').forEach(function (i) { var l = i.dataset.k; o[l] = o[l] || ['', '']; o[l][+i.dataset.f] = i.value.trim(); }); Object.keys(o).forEach(function (l) { var d = CFI.lv.filter(function (x) { return x.l === +l; })[0].salDef; if (o[l][0] === '' && o[l][1] === '') delete o[l]; else o[l] = [o[l][0] === '' ? d[0] : +o[l][0], o[l][1] === '' ? d[1] : +o[l][1]]; }); cfgPut('sal', Object.keys(o).length ? o : null); }
function cfgXp() { var a = [], any = false; document.querySelectorAll('.cxp').forEach(function (i) { var v = i.value.trim(); if (v !== '') any = true; a[+i.dataset.k] = v === '' ? CFI.def.xp[+i.dataset.k] : +v; }); cfgPut('xp', any ? a : null); }
function cfgZus() { var lg = cfgLiga('.cliga2'), c = {}; document.querySelectorAll('.ccap').forEach(function (i) { var l = i.dataset.k; c[l] = c[l] || ['', '']; c[l][+i.dataset.f] = i.value.trim(); }); Object.keys(c).forEach(function (l) { var d = CFI.def.capr[l]; if (c[l][0] === '' && c[l][1] === '') delete c[l]; else c[l] = [c[l][0] === '' ? d[0] : +c[l][0], c[l][1] === '' ? d[1] : +c[l][1]]; });
  rest('game_config', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: { key: 'liga', value: lg || {}, updated_at: new Date().toISOString(), updated_by: SESSION.user.id } }).then(function () { cfgPut('capr', Object.keys(c).length ? c : null); }); }
function cfgCups() { var c = {}, n = {}; document.querySelectorAll('.ccup').forEach(function (i) { if (i.value.trim() === '') return; c[i.dataset.k] = c[i.dataset.k] || []; c[i.dataset.k][+i.dataset.f] = +i.value; }); Object.keys(c).forEach(function (k) { CFI.def.cups[k].forEach(function (v, i) { if (c[k][i] == null) c[k][i] = v; }); }); document.querySelectorAll('.ccupn').forEach(function (i) { if (i.value.trim()) n[i.dataset.k] = i.value.trim(); });
  rest('game_config', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: { key: 'cupn', value: n, updated_at: new Date().toISOString(), updated_by: SESSION.user.id } }).then(function () { cfgPut('cups', Object.keys(c).length ? c : null); }); }
function licTog(cb) { var id = cb.dataset.id; document.querySelectorAll('.clici[data-id="' + id + '"]').forEach(function (o) { if (o !== cb) { o.disabled = cb.checked; o.parentNode.classList.toggle('dis', cb.checked); } }); }
function cfgLic() { var o = {}; document.querySelectorAll('.clici:checked').forEach(function (i) { o[i.dataset.id] = +i.dataset.l; }); var lg = cfgLiga('.clic');
  rest('game_config', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: { key: 'liga', value: lg || {}, updated_at: new Date().toISOString(), updated_by: SESSION.user.id } }).then(function () { cfgPut('licItems', Object.keys(o).length ? o : null); }); }
// Instagram-Profile
function instaHtml() {
  var A = CFI.insta || [];
  return '<p class="muted">Eigene (erfundene) Profile, die im Spiel posten. Platzhalter in den Texten: {verein} {liga} {spieler} {spitze} {punkte} {platz} {trainer}. Ein Text pro Zeile – das Spiel wählt zufällig. „Pro Saison“ = wie viele Beiträge ungefähr kommen. Wirkung gilt bei jedem Beitrag.</p>' +
    A.map(function (a, i) { var u = MAP['insta.' + a.id] ? mediaUrl(MAP['insta.' + a.id].path) : ''; return '<div class="card" style="background:rgba(255,255,255,.04)"><div class="row" style="gap:12px;align-items:flex-start"><div style="text-align:center"><div onclick="instaPic(\'' + a.id + '\')" title="Profilbild hochladen" style="width:64px;height:64px;border-radius:50%;cursor:pointer;background:' + (u ? 'center/cover url(&quot;' + u + '&quot;)' : esc(a.col || '#555')) + ';display:grid;place-items:center;color:#fff;font-weight:900">' + (u ? '' : esc((a.name || '?').charAt(0).toUpperCase())) + '</div><small class="muted">Bild ändern</small></div><div style="flex:1;display:grid;gap:6px">' +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><label>Name <input class="ins" data-i="' + i + '" data-f="name" value="' + esc(a.name || '') + '" style="width:180px"></label><label><input type="checkbox" class="ins" data-i="' + i + '" data-f="ver"' + (a.ver ? ' checked' : '') + '> blauer Haken</label><label>pro Saison <input type="number" class="ins" data-i="' + i + '" data-f="per" value="' + (a.per || 0) + '" style="width:70px"></label><label>Farbe <input type="color" class="ins" data-i="' + i + '" data-f="col" value="' + esc(a.col || '#555555') + '"></label><button class="btn ghost" onclick="instaDel(' + i + ')">Profil löschen</button></div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap">Wirkung je Beitrag: ' + [['follow', 'Follower'], ['fans', 'Fans'], ['spons', 'Sponsoren'], ['moral', 'Moral'], ['board', 'Vorstand']].map(function (f) { return '<label>' + f[1] + ' <input type="number" class="ins" data-i="' + i + '" data-f="fx.' + f[0] + '" value="' + (((a.fx || {})[f[0]]) || '') + '" placeholder="0" style="width:70px"></label>'; }).join('') + '</div>' +
      '<textarea class="ins" data-i="' + i + '" data-f="texts" rows="4" style="width:100%" placeholder="Ein Text pro Zeile">' + esc((a.texts || []).join('\n')) + '</textarea></div></div></div>'; }).join('') +
    '<div class="row" style="gap:8px"><button class="btn ghost" onclick="instaAdd()">＋ Profil hinzufügen</button><button class="btn" onclick="instaSave()">Speichern</button>' + (CF.insta ? '<button class="btn ghost" onclick="if(confirm(\'Profile auf Standard zurücksetzen?\'))cfgPut(\'insta\', null)">Auf Standard zurücksetzen</button>' : '') + '</div>';
}
function instaRead() { var A = JSON.parse(JSON.stringify(CFI.insta || [])); document.querySelectorAll('.ins').forEach(function (el) { var a = A[+el.dataset.i], f = el.dataset.f; if (!a) return; if (f === 'ver') a.ver = el.checked; else if (f === 'per') a.per = +el.value || 0; else if (f === 'texts') a.texts = el.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); else if (f.indexOf('fx.') === 0) { a.fx = a.fx || {}; var k = f.slice(3); if (el.value.trim() === '') delete a.fx[k]; else a.fx[k] = +el.value; } else a[f] = el.value; }); return A; }
function instaSave() { var A = instaRead(); A.forEach(function (a) { a.name = String(a.name || '').trim().slice(0, 40) || a.id; }); cfgPut('insta', A); }
function instaAdd() { var A = instaRead(); var id = 'p' + Date.now().toString(36); A.push({ id: id, name: 'neues.profil', ver: false, per: 4, col: '#555555', fx: {}, texts: ['Grüße an {verein} aus der {liga}! ⚽'] }); CFI.insta = A; var el = document.querySelectorAll('details.fold'); showCfgInsta(); }
function instaDel(i) { if (!confirm('Profil löschen?')) return; var A = instaRead(); A.splice(i, 1); CFI.insta = A; showCfgInsta(); }
function showCfgInsta() { var d = Array.prototype.slice.call(document.querySelectorAll('details.fold')).filter(function (x) { return x.querySelector('summary').textContent.indexOf('Instagram') >= 0; })[0]; if (!d) return; var s = d.querySelector('summary').outerHTML; d.innerHTML = s + instaHtml(); d.open = true; }

function instaPic(id) { chooser(false, function (f) { if (f[0]) upload('insta.' + id, f[0]).then(function () { return loadMap(); }).then(function () { showCfgInsta(); }); }); }
