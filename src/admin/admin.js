/* Amateur Manager – Admin-Seite: Übersicht, Feedback, Bilder */
var BG = [['titel', 'Titelbild Startseite (ganze Breite)'], ['publisher', 'Publisher-Logo oben rechts'], ['entwickler', 'Profilbild „Entwickler“ im Chat'],
  ['saisonziel', 'Popup Saisonziel'], ['hauptsponsor', 'Popup Hauptsponsor'], ['ausstatter', 'Popup Ausstatter'], ['budget', 'Popup Saisonbudget'], ['presse', 'Popup Pressekonferenz'], ['vorbereitung', 'Popup Saisonvorbereitung'],
  ['aufstieg', 'Saisonabschluss Aufstieg'], ['klassenerhalt', 'Saisonabschluss Klassenerhalt'], ['abstieg', 'Saisonabschluss Abstieg'], ['entlassung', 'Entlassung'], ['talent', 'Popup Neues Talent / Sterne'],
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
  if (!SESSION) return gate('Bitte zuerst im Spiel anmelden – dann diese Seite neu laden.');
  myProfile().then(function (p) {
    if (!p || !p.is_admin) return gate('Kein Zugriff. Diese Seite ist nur für den Entwickler.');
    var X = MGR_DATA; D0 = MGR.normalize({ regeln: X.REGELN, ligen: X.LIGEN, ausbau: X.AUSBAU, camps: X.CAMPS, events: X.EVENTS, konfig: X.KONFIG, mails: X.MAILS, vornamen: X.VORNAMEN, nachnamen: X.NACHNAMEN });
    $('#who').textContent = p.display_name; nav('over');
  }).catch(function (e) { gate('Fehler: ' + e.message); });
}
function gate(msg) { $('#main').innerHTML = '<div class="card"><h2>Admin</h2><p>' + esc(msg) + '</p><a class="btn" href="./">Zum Spiel</a></div>'; }
function nav(k) { SECTION = k; document.querySelectorAll('nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.k === k); }); ({ over: showOver, fb: showFb, img: showImg, lig: showLig })[k](); }

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
  loadMap().then(function () {
    var grp = function (title, g, list, note) { return '<div class="card"><h3>' + title + '</h3>' + (note ? '<p class="muted">' + note + '</p>' : '') + '<div class="grid">' + list.map(function (x) { return slot(g + '.' + x[0], x[1]); }).join('') + '</div></div>'; };
    var items = (D0.itemList || []).map(function (it) { return [it.id, it.name + ' (' + it.cat + ')']; });
    var camps = (D0.camps || []).map(function (c) { return [c.id, c.name]; });
    var shop = (MGR.SHOP || []).map(function (s) { return [s[0], s[2] + ' (' + s[1] + ')']; });
    var stad = Object.keys(MAP).filter(function (k) { return k.indexOf('stad.') === 0; }).map(function (k) { return [k.slice(5), k.slice(5)]; });
    $('#main').innerHTML =
      '<div class="card"><p class="muted">Klick auf ein Feld oder zieh ein Bild aus deinem Ordner direkt darauf, um es hochzuladen oder zu ersetzen. Bilder werden automatisch verkleinert und als WebP gespeichert (Hintergründe max. 1920 px, kleine Bilder max. 900 px). Änderungen sind sofort im Spiel sichtbar (Seite neu laden).</p>' + (function () { var n = Object.keys(MAP).filter(function (k) { return !/\.(webp|gif)$/i.test(MAP[k].path); }).length; return n ? '<p><button class="btn" id="optb" onclick="optimizeAll()">⚡ ' + n + ' ältere Bilder optimieren (schnelleres Laden)</button></p>' : '<p class="muted">✓ Alle Bilder sind optimiert.</p>'; })() + '</div>' +
      grp('Titel- & Popup-Bilder', 'bg', BG) +
      grp('Maskottchen', 'masc', MASC, 'Quadratisch sieht am besten aus.') + grp('Scouting-Tools', 'scout', SCOUT) + grp('Fan-Aktionen', 'fans', FANS) +
      grp('Ausbau & Erweiterungen', 'ausbau', items) + grp('Trainingslager', 'camp', camps) + grp('Privat-Shop', 'priv', shop) +
      '<div class="card"><h3>Stadionbilder (Eintrittskarte)</h3><p class="muted">Vereinsname exakt wie im Spiel.</p><div class="row"><input id="stn" placeholder="Vereinsname, z. B. SV Wachtberg"><button class="btn" onclick="pickNamed()">Bild wählen</button></div><div class="grid">' + stad.map(function (x) { return slot('stad.' + x[0], x[1]); }).join('') + '</div></div>' +
      LISTS.map(function (l) { var ks = Object.keys(MAP).filter(function (k) { return k.indexOf(l[0] + '.') === 0; }); return '<div class="card"><h3>' + l[1] + '</h3><div class="grid">' + ks.map(function (k) { return slot(k, ''); }).join('') + '<div class="slot add" data-list="' + l[0] + '" onclick="pickList(\'' + l[0] + '\')"><span>＋ Bilder hinzufügen<br><small>oder hierher ziehen</small></span></div></div></div>'; }).join('');
    if (keep) window.scrollTo(0, y);
  });
}
function slot(key, label) {
  var m = MAP[key], u = m ? mediaUrl(m.path) : '';
  return '<div class="slot' + (m ? ' has' : '') + '" title="' + esc(key) + '"><div class="th" data-key="' + esc(key) + '" onclick="pick(\'' + esc(key).replace(/'/g, '') + '\')" style="' + (u ? 'background-image:url(&quot;' + u + '&quot;)' : '') + '">' + (u ? '' : '<span>＋</span>') + '</div><div class="lb">' + esc(label || key.split('.').slice(1).join('.')) + '</div>' + (m ? '<button class="x" onclick="delImg(\'' + esc(key).replace(/'/g, '') + '\')" title="Entfernen">✕</button>' : '') + '</div>';
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
  $('#main').innerHTML = '<div class="card"><h3>Echte Ligen (NRW)</h3><p class="muted">Quelle: fussball.de, abgerufen per GitHub Actions („Ligadaten holen“). Nach jedem Abruf werden sie automatisch übernommen; der Knopf holt den aktuellen Stand von Hand. Von Hand geänderte Namen bleiben beim nächsten Import erhalten.</p>' +
    '<div class="row"><button class="btn" onclick="ligImport()">Ligendaten importieren</button><span class="muted" id="ligst"></span></div>' +
    '<div class="row"><select id="ligvb" onchange="LG.vb=this.value;LG.eb=0;LG.st=null;ligList()">' + ['Mittelrhein', 'Niederrhein', 'Westfalen'].map(function (v) { return '<option' + (v === LG.vb ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select>' +
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
    if (r.status === 'recent') { st.textContent = 'Wurde gerade erst importiert (' + dt(r.at) + ') – höchstens alle 10 Minuten.'; return; }
    st.textContent = 'Fertig: ' + r.staffeln + ' Staffeln, ' + r.teams + ' Mannschaften.'; toast('Import fertig ✓'); ligList();
  }).catch(function (e) { st.textContent = ''; toast(e.message, true); });
}
