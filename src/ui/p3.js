
/* ===================================================================== Übersicht */
function kv(k, v) { return '<div class="row sp small" style="padding:4px 0"><span class="muted">' + k + '</span><b style="text-align:right">' + v + '</b></div>'; }
function gameLine(g) {
  var res = g.gf == null ? '<span class="muted small">' + (g.home === null ? 'neutral' : g.home ? 'Heim' : 'Auswärts') + '</span>' : '<b class="' + (g.gf > g.ga ? 'pos' : g.gf < g.ga ? 'neg' : '') + '">' + g.gf + ':' + g.ga + '</b>' + (g.pen ? ' <span class="small muted">(' + esc(g.pen) + ')</span>' : '');
  return '<div class="row sp" style="padding:7px 0;border-top:1px solid var(--linie)"><div style="min-width:0"><div class="xs muted">' + dF(g.d) + ' · ' + esc(g.label) + '</div><div class="tn">' + crest(g.opp) + '<b class="n">' + (g.home === false ? '@ ' : '') + esc(g.opp) + '</b></div></div><div>' + res + '</div></div>';
}
function barcode(seed) { var r = rng(seed), x = 2, o = ''; while (x < 82) { var w = 1 + Math.floor(r() * 3); if (r() > 0.35) o += '<rect x="' + x + '" y="1" width="' + w + '" height="24" fill="#111"/>'; x += w + 1; } return '<svg viewBox="0 0 84 30"><g>' + o + '</g><text x="42" y="29.5" text-anchor="middle" font-size="5" font-family="monospace" fill="#111">' + String(seed * 7919 % 1e9).padStart(9, '0') + '</text></svg>'; }
function ticketHTML(n, cls) {
  if (!n) return '<div class="box"><h3>Nächstes Spiel</h3><div class="muted">Gerade kein Spiel angesetzt.</div></div>';
  var home = n.home !== false, hn = home ? V.club : n.opp, an = home ? n.opp : V.club;
  var c1 = teamColor(hn), c2 = teamColor(an);
  var where = n.home === null ? 'Neutraler Platz' : home ? townOf((S && S.club) || 'SV Wachtberg') : townOf(n.opp);
  var seed = 0; for (var i = 0; i < n.d.length; i++) seed += n.d.charCodeAt(i) * (i + 7); seed += (n.opp.length * 131);
  var comp = n.comp === 'liga' ? V.ligaK : n.comp === 'test' ? 'Freundschaftsspiel' : n.label.split(' · ')[0];
  var vb = compLogoK(n.comp);
  var ol = n.comp !== 'liga' && n.comp !== 'test' ? (n.oppLiga || (n.oppLvl && DD().lv[n.oppLvl] ? DD().lv[n.oppLvl].short : '')) : ''; var olH = function (t) { return ol && t === n.opp ? '<small style="display:block;font-size:10px;opacity:.85;font-weight:600">' + esc(ol) + '</small>' : ''; };
  var lum = function (c) { var m = /^#?([0-9a-f]{6})$/i.exec(String(c).trim()); if (!m) { var r = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return r ? (0.299 * r[1] + 0.587 * r[2] + 0.114 * r[3]) / 255 : 0.3; } var n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };
  var light = (lum(c1) * 0.6 + lum(c2) * 0.4) > 0.6;
  var hl = home ? V.lvl : (n.oppLvl || V.lvl), cap = home ? (V.cap || 500) : [0, 60000, 30000, 15000, 8000, 4000, 2500, 1500, 1000, 600, 400, 300][hl] || 800;
  var img = imgOf('stad', hn), pic = img ? '<img src="' + img + '" alt="">' : stadSVG(cap, seed, c1);
  var sect = home ? ['HAUPTTRIBÜNE', 'GEGENGERADE', 'HEIMKURVE'][seed % 3] : 'GÄSTEBLOCK', tier = cap > 20000 ? ['UNTERRANG', 'OBERRANG'][seed % 2] : cap > 3000 ? 'SITZPLATZ' : 'STEHPLATZ';
  return '<div class="tk3 ' + (cls || '') + '"><div class="tkimg">' + pic + '<div class="tklogos"><img src="' + ELOGO + '" alt="Eventim">' + verbandLogo(vb) + '</div></div>' +
    '<div class="tkmid"><div class="tksec">' + esc(sect) + ' · ' + tier + '</div><div class="tkteams">' + crest(hn, 'tw') + '<b>' + esc(hn) + olH(hn) + '</b><i>vs</i><b>' + esc(an) + olH(an) + '</b>' + crest(an, 'tw') + '</div>' +
    '<div class="tkrsg"><div><small>BLOCK</small><b>' + (100 + seed % 140) + '</b></div><div><small>REIHE</small><b>' + (1 + seed % 24) + '</b></div><div><small>PLATZ</small><b>' + (1 + seed % 30) + '</b></div><div><small>TOR</small><b>' + 'NSWO'.charAt(seed % 4) + (1 + seed % 6) + '</b></div></div>' +
    '<div class="tkdate">📅 ' + WTG[dObj(n.d).getUTCDay()] + ', ' + dFull(n.d) + '</div><div class="tkfoot">' + esc(comp) + ' · ' + esc(where) + ' · Saison ' + esc(String(V.season)) + '</div></div>' +
    '<div class="tkstub"><div class="tkpr"><small>EUR</small><b>' + (home ? eur(V.fin.ticket).replace(' €', '') : 'Gast') + '</b></div><div class="tkbc">' + barcode(seed) + '</div><small class="tkno">Nr. ' + (100000 + seed * 37 % 899999) + '</small></div></div>';
}
function stadSVG(cap, seed, col) {
  var id = 'st' + seed;
  var R2 = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  var big = cap >= 25000, mid = cap >= 6000, small = cap >= 1500, seat = col && /^#/.test(col) ? col : '#c8102e';
  var sky = big ? ['#f6d9b0', '#fbeedd'] : ['#9fd0f0', '#e6f3fb'];
  var h = '<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sk' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient><linearGradient id="pt' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9a3a"/><stop offset="1" stop-color="#2f7a26"/></linearGradient><radialGradient id="sun' + id + '" cx=".75" cy=".15" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
  h += '<rect width="400" height="260" fill="url(#sk' + id + ')"/>';
  if (big) {
    h += '<path d="M0 30 Q200 -10 400 30 L400 60 Q200 25 0 60Z" fill="#e9e4dc"/>';
    for (var r = 0; r < 14; r++) { var y = 60 + r * 7; h += '<path d="M0 ' + y + ' Q200 ' + (y - 30 + r * 1.2) + ' 400 ' + y + ' L400 ' + (y + 6) + ' Q200 ' + (y - 24 + r * 1.2) + ' 0 ' + (y + 6) + 'Z" fill="' + seat + '" opacity="' + (0.75 + (r % 2) * 0.2) + '"/>'; }
    h += '<rect x="170" y="62" width="60" height="16" rx="2" fill="#222"/><rect x="174" y="65" width="52" height="10" fill="#3a6"/>';
  } else if (mid) {
    h += '<rect x="0" y="70" width="400" height="10" fill="#d9d4cc"/>';
    for (var r2 = 0; r2 < 9; r2++) h += '<rect x="20" y="' + (82 + r2 * 7) + '" width="360" height="5" fill="' + seat + '" opacity="' + (0.7 + (r2 % 2) * 0.25) + '"/>';
    h += '<path d="M10 70 L390 70 L370 52 L30 52Z" fill="#cfd5db"/>';
    [40, 360].forEach(function (x) { h += '<rect x="' + (x - 2) + '" y="10" width="4" height="70" fill="#9aa"/><rect x="' + (x - 12) + '" y="6" width="24" height="10" rx="2" fill="#eef"/>'; });
  } else if (small) {
    for (var t = 0; t < 9; t++) { var tx = t * 48 + R2() * 20; h += '<circle cx="' + tx + '" cy="' + (88 + R2() * 10) + '" r="' + (18 + R2() * 12) + '" fill="#3d7a35" opacity=".9"/>'; }
    h += '<rect x="110" y="96" width="180" height="30" fill="#e6e1d8"/>'; for (var r3 = 0; r3 < 4; r3++) h += '<rect x="114" y="' + (100 + r3 * 6) + '" width="172" height="4" fill="' + seat + '" opacity=".85"/>';
    h += '<path d="M104 96 L296 96 L286 86 L114 86Z" fill="#8a96a3"/>';
    [20, 380].forEach(function (x) { h += '<rect x="' + (x - 2) + '" y="40" width="4" height="86" fill="#8a9"/><rect x="' + (x - 9) + '" y="36" width="18" height="8" rx="2" fill="#eef"/>'; });
  } else {
    for (var t2 = 0; t2 < 11; t2++) { var tx2 = t2 * 40 + R2() * 18; h += '<circle cx="' + tx2 + '" cy="' + (95 + R2() * 14) + '" r="' + (16 + R2() * 14) + '" fill="#467f3a"/>'; }
    h += '<rect x="250" y="100" width="70" height="26" fill="#a0522d"/><path d="M244 100 L326 100 L285 82Z" fill="#7a3b1e"/><rect x="0" y="122" width="400" height="5" fill="#ddd"/>';
  }
  var py = big ? 158 : mid ? 146 : 126;
  h += '<path d="M-40 260 L60 ' + py + ' L340 ' + py + ' L440 260Z" fill="url(#pt' + id + ')"/>';
  for (var s2 = 0; s2 < 6; s2++) { var a = py + (260 - py) * s2 / 6, b2 = py + (260 - py) * (s2 + 1) / 6; if (s2 % 2) h += '<path d="M' + (60 - 100 * (a - py) / (260 - py)) + ' ' + a + ' L' + (340 + 100 * (a - py) / (260 - py)) + ' ' + a + ' L' + (340 + 100 * (b2 - py) / (260 - py)) + ' ' + b2 + ' L' + (60 - 100 * (b2 - py) / (260 - py)) + ' ' + b2 + 'Z" fill="#fff" opacity=".06"/>'; }
  h += '<path d="M60 ' + py + ' L340 ' + py + ' L440 260 L-40 260Z" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2"/><line x1="200" y1="' + py + '" x2="200" y2="260" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><ellipse cx="200" cy="' + (py + (260 - py) * 0.62) + '" rx="48" ry="16" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>';
  h += '<rect x="170" y="' + (py - 12) + '" width="60" height="12" fill="none" stroke="#fff" stroke-width="2"/><rect width="400" height="260" fill="url(#sun' + id + ')"/></svg>';
  return h;
}
function teamPop(name, lvl) {
  if (V.mlvl < 7) return toast('Fremde Kader ansehen und Spieler direkt holen: ab Manager-Level 7.', true);
  var sq = MGR.teamSquad(S, D, name); if (!sq) return;
  var avg = Math.round(sq.slice(0, 11).reduce(function (a, p) { return a + p.str; }, 0) / 11 * 10) / 10;
  pop('<div class="row" style="gap:10px;padding-right:26px">' + crest(name) + '<div><h2 style="padding:0;margin:0">' + esc(name) + '</h2><div class="xs muted">' + esc(DD().lv[lvl] ? DD().lv[lvl].short : '') + ' · Ø Stärke Startelf ' + String(avg).replace('.', ',') + '</div></div></div><div class="plist" style="margin-top:10px;max-height:420px;overflow:auto">' +
    sq.map(function (p) { return '<div class="pl" style="cursor:default"><span class="pb ' + p.pos + '">' + p.pos + '</span><div><b>' + esc(p.n) + '</b><div class="meta">' + stars(p.tal, p.tal) + '<span>' + p.age + ' J.</span><span>MW ' + eurK(p.mw) + '</span></div></div><div class="row" style="gap:6px">' + strBox(p.str) + (has('transfers') ? '<button class="sm pri" onclick="scoutBuy(\'' + esc(name).replace(/'/g, "\\'") + '\',' + p.i + ')">Holen</button>' : '') + '</div></div>'; }).join('') + '</div>', { wide: true });
}
function scoutBuy(team, i) { var nm = MGR.teamSquad(S, D, team)[i].n; act('scoutAdd', { team: team, i: i }, { quiet: true, norender: true }).then(function (r) { if (!r) return; var w = V.watch.filter(function (x) { return x.n === nm; })[0]; closePop(); if (w) buyPop(w.mid); else toast(r.info); }); }
function zoneOf(rank, n, lvl) { var L = DD().lv[lvl]; if (!L) return ''; var z = rank <= L.up ? 'up' : (L.upRel && rank <= L.up + L.upRel) ? 'uprel' : rank > n - L.down ? 'down' : (L.downRel && rank > n - L.down - L.downRel) ? 'downrel' : ''; if (lvl === 1 && z === 'up') z = ''; return z; }
function attBox() {
  var A = V.attLog || []; if (!A.length) return kv('Zuschauerschnitt', '<span class="muted">noch kein Heimspiel</span>');
  var avg = Math.round(A.reduce(function (a, b) { return a + b; }, 0) / A.length); var h = A.slice(-3), o = A.slice(-6, -3); var t = o.length ? (h.reduce(function (a, b) { return a + b; }, 0) / h.length) / (o.reduce(function (a, b) { return a + b; }, 0) / o.length) - 1 : 0;
  var col = t > 0.03 ? 'var(--g)' : t < -0.03 ? 'var(--r)' : 'var(--y)', arr = t > 0.03 ? '▲' : t < -0.03 ? '▼' : '▶', pct = Math.round(clamp01((t + 0.3) / 0.6) * 100);
  var mx = Math.max.apply(null, A); var spark = A.map(function (v) { return '<i style="display:inline-block;width:6px;margin-right:2px;border-radius:2px;background:' + col + ';opacity:.75;height:' + Math.max(3, Math.round(v / mx * 22)) + 'px"></i>'; }).join('');
  return '<div class="row sp small" style="padding:6px 0;border-top:1px solid var(--linie)"><span>Zuschauerschnitt</span><span style="display:inline-flex;align-items:flex-end;gap:8px"><span style="display:inline-flex;align-items:flex-end;height:22px">' + spark + '</span><b>' + num(avg) + '</b><b style="color:' + col + '">' + arr + ' ' + (t >= 0 ? '+' : '') + Math.round(t * 100) + ' %</b></span></div><div style="height:5px;border-radius:3px;background:linear-gradient(90deg,var(--r),var(--y),var(--g));position:relative;margin:2px 0 6px"><i style="position:absolute;top:-3px;left:calc(' + pct + '% - 5px);width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #14200c"></i></div>';
}
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function spLogo(firm, icon) {
  var hsh = 0; for (var i = 0; i < firm.length; i++) hsh = (hsh * 31 + firm.charCodeAt(i)) % 9973; var cols = ['#c0392b', '#1f6fb2', '#2e8b57', '#8e44ad', '#d35400', '#16a085', '#2c3e50', '#b8860b'], col = cols[hsh % cols.length];
  var w = firm.split(' '), main = w[0].length > 12 ? w[0].slice(0, 11) : w[0], sub = w.slice(1).join(' ');
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80"><rect x="2" y="2" width="76" height="76" rx="18" fill="' + col + '"/><text x="40" y="54" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="38" fill="#fff">' + esc(main.charAt(0) + (sub ? sub.charAt(0) : main.charAt(1) || '')) + '</text><text x="88" y="38" font-family="Arial,sans-serif" font-weight="900" font-size="' + (main.length > 9 ? 17 : 21) + '" fill="#222">' + esc(main) + '</text><text x="88" y="60" font-family="Arial,sans-serif" font-weight="600" font-size="12" fill="' + col + '">' + esc(sub.slice(0, 18)) + '</text></svg>';
  if (icon) svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect x="2" y="2" width="76" height="76" rx="18" fill="' + col + '"/><text x="40" y="54" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="38" fill="#fff">' + esc(main.charAt(0) + (sub ? sub.charAt(0) : main.charAt(1) || '')) + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function partnerBox() {
  var sp = V.mainSp ? '<img src="' + spLogo(V.mainSp.firm) + '" alt="">' : '<span class="xs" style="color:#888">kein Hauptsponsor</span>';
  var kt = V.kit && BRANDLOGO[V.kit.brand] ? '<img src="' + BRANDLOGO[V.kit.brand] + '" alt="">' : '<span class="xs" style="color:#888">kein Ausstatter</span>';
  var yl = function (to) { var y = to + 1 - (+V.date.slice(0, 4) + (+V.date.slice(5, 7) >= 7 ? 1 : 0)); return y <= 0 ? 'läuft zum Saisonende aus' : 'noch ' + (y + 1) + ' Saison' + (y ? 's' : '') + ' (bis 06/' + (to + 1) + ')'; };
  var pv = V.pv ? crest(V.pv.club, 'pvc') : '<span style="font-size:30px;opacity:.5">🔒</span>';
  var tip = [V.mainSp ? 'Hauptsponsor: ' + V.mainSp.firm + ' – ' + yl(V.mainSp.to) : 'Noch kein Hauptsponsor', V.kit ? 'Ausstatter: ' + V.kit.name + ' – ' + yl(V.kit.to) : 'Noch kein Ausstatter', V.pv ? 'Partnerverein: ' + V.pv.club + ' – ' + yl(V.pv.to) : (has('partner') ? 'Partnerverein: noch keiner – unter Verein → Partnerverein' : 'Partnerverein: ab Manager-Level ' + MGR.featLvl('partner'))];
  var st4 = '<div id="qrtile" style="display:grid;place-items:center;width:100%;height:100%">' + (QRC.svg ? QRC.svg : '<div style="text-align:center;color:#17201a"><div style="font-size:26px">📱</div><div style="font-weight:800;font-size:11px">Handy</div></div>') + '</div>';
  tip.push('📱 Auf dem Handy weiterspielen – QR-Code scannen (Spiel wird vorher gespeichert)');
  setTimeout(qrRefresh, 50);
  return '<div class="partner3 p4">' + [sp, kt, pv, st4].map(function (x, i) { return '<div class="pt" data-tip="' + esc(tip[i]) + '" ' + (i === 3 ? 'onmouseenter="qrHover()" ' : '') + 'onclick="' + (i === 3 ? 'qrPop()' : i === 2 && has('partner') ? 'go(\'partner\')' : i === 1 && has('ausbau') ? 'go(\'ausstatter\')' : '') + '">' + x + '</div>'; }).join('') + '</div>';
}
var QRC = { url: null, t: 0, svg: null, busy: false };
function qrRefresh(force) {
  if (!TOKEN || QRC.busy) return; if (!force && QRC.url && Date.now() - QRC.t < 12 * 60000) return qrFill();
  QRC.busy = true; call('apiHandoff', TOKEN).then(function (r) { QRC.busy = false; if (!r || !r.ok) return; QRC.url = r.url; QRC.t = Date.now(); try { QRC.svg = QRG.svg(r.url, 92, '#111', 'none'); } catch (e) { QRC.svg = null; } qrFill(); }).catch(function () { QRC.busy = false; });
}
function qrFill() { var el = $('#qrtile'); if (el && QRC.svg) el.innerHTML = QRC.svg; }
function qrHover() { if (S && DIRTY) save(true); }
function qrPop() {
  if (!TOKEN) return toast('Erst einloggen.', true);
  var show = function () { pop('<div style="text-align:center"><h2 style="padding:0">📱 Auf dem Handy weiterspielen</h2><div class="small muted" style="margin:6px 0 12px">Scanne den Code mit der Handy-Kamera – dein Spiel wird direkt geladen, ohne Login. Nach dem Scannen fragt dich dieser PC, ob das Handy übernehmen darf – fremde Handys kommen so nicht in dein Konto.</div><div style="display:inline-block;padding:10px;background:#fff;border-radius:14px;box-shadow:0 4px 18px rgba(0,0,0,.12)">' + QRG.svg(QRC.url, 230, '#111', '#fff') + '</div><div class="xs muted" style="margin-top:10px">Tipp: Am Handy das Gerät ins Querformat drehen.</div><button style="margin-top:10px" onclick="QRC.url=null;qrRefresh(true);closePop();setTimeout(qrPop,900)">🔄 Neuen Code erzeugen</button></div>', { atx: true }); };
  var go2 = function () { if (QRC.url && Date.now() - QRC.t < 12 * 60000) show(); else { loading(true); call('apiHandoff', TOKEN).then(function (r) { loading(false); if (!r || !r.ok) return toast((r && r.error) || 'Fehler', true); QRC.url = r.url; QRC.t = Date.now(); QRC.svg = QRG.svg(r.url, 92, '#111', 'none'); qrFill(); show(); }).catch(function (e) { loading(false); toast(String(e), true); }); } };
  if (S && DIRTY) save(true).then(go2, go2); else go2();
}
function compLogoK(c) { return c === 'dfb' ? 'dfbp' : c === 'mrp' ? 'bit' : c === 'kp' ? 'fvm' : V.lvl <= 4 ? 'dfb' : 'fvm'; }
function tableExcerpt() {
  var t = V.table, i = t.findIndex(function (r) { return r.svw; }); var st0 = Math.max(0, Math.min(t.length - 3, i - 1)); var rows = t.slice(st0, st0 + 3);
  return '<div class="box"><h3 style="display:flex;align-items:center;gap:6px"><span style="display:inline-flex;height:20px;align-items:center">' + verbandLogo(V.lvl <= 4 ? 'dfb' : 'fvm') + '</span>Tabelle · ' + esc(V.ligaK) + '</h3>' + tableHTML(rows, true) + '<button class="sm" style="margin-top:8px" onclick="go(\'liga\')">Ganze Tabelle</button></div>';
}
function cupExcerpt(n) {
  var c = V.cups.filter(function (x) { return x.k === n.comp; })[0]; if (!c) return '';
  var rn = ['1. Runde', '2. Runde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];
  var cur = c.next ? rn.indexOf(c.next.round) : c.rn; var rows = [];
  if (cur > 0 && c.games.length) { var g = c.games[c.games.length - 1]; rows.push('<div class="row sp small" style="padding:7px 0;border-top:1px solid var(--linie)"><span class="muted" style="width:96px">' + g.round + '</span><span class="tn" style="flex:1">' + crest(g.opp) + '<span class="n">' + esc(g.opp) + '</span></span><b class="' + (g.win ? 'pos' : 'neg') + '">' + g.gf + ':' + g.ga + '</b></div>'); }
  if (c.next) rows.push('<div class="row sp small" style="padding:7px 0;border-top:1px solid var(--linie);font-weight:700"><span style="width:96px;color:var(--g)">' + c.next.round + '</span><span class="tn" style="flex:1">' + crest(c.next.opp) + '<span class="n">' + esc(c.next.opp) + '</span></span><span class="muted">' + dF(c.next.d) + '</span></div>');
  var more = cur === 0 ? 2 : 1;
  for (var k = 1; k <= more && cur + k < 6; k++) rows.push('<div class="row sp small muted" style="padding:7px 0;border-top:1px solid var(--linie)"><span style="width:96px">' + rn[cur + k] + '</span><span style="flex:1">Gegner unbekannt</span></div>');
  return '<div class="box"><h3 style="display:flex;align-items:center;gap:6px"><span style="display:inline-flex;height:20px;align-items:center">' + verbandLogo(compLogoK(c.k)) + '</span>' + esc(c.name) + '</h3>' + rows.join('') + '<button class="sm" style="margin-top:8px" onclick="go(\'pokal\')">Zum Pokal</button></div>';
}
function tHome() {
  var n = V.next;
  var played = V.games.filter(function (g) { return g.gf != null; }).slice(-5).reverse();
  var c1 = compBox() + topBox1('lt', '⭐ Leistungsträger') + topBox1('tore', '⚽ Torschützen') + topBox1('vorl', '👟 Vorlagengeber') + injBox() + loanBox() + contractBox1() + buildBox();
  var c2 = partnerBox() + '<div style="margin-bottom:12px">' + ticketHTML(n) + '</div>' + (n && n.comp !== 'liga' && n.comp !== 'test' && n.comp !== 'rel' ? cupExcerpt(n) : tableExcerpt()) + '<div class="box"><h3>📅 Letzte Spiele</h3>' + (played.length ? played.map(gameLine).join('') : '<div class="muted small">Noch keine Spiele in dieser Saison.</div>') + '</div>';
  var c3 = mailsBox() + feedBox();
  return L4(c1, S2(c2, c3), mgrSide() + misBox() + clubSide());
}
/* ---------- Missionen: kleine Übersicht (zwei Kreise) und eigene Seite unter Manager */
function donut(p, col, lbl, sub, lock) { var r = 26, c = 2 * Math.PI * r, d = Math.max(0, Math.min(1, p)) * c; return '<div class="mdon' + (lock ? ' lock' : '') + '"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="7"/>' + (lock ? '' : '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + d.toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 32 32)"/>') + '<text x="32" y="36" text-anchor="middle" font-size="13" font-weight="900" fill="currentColor">' + (lock ? '🔒' : Math.round(p * 100) + '%') + '</text></svg><b>' + lbl + '</b><span class="xs muted">' + sub + '</span></div>'; }
function misBox() {
  var M = V.missions; if (!M || !M.dailyOn) return '<div class="box misbox"><h3>🎯 Missionen</h3><div class="mdons">' + donut(0, '#8fc852', 'Heute', 'ab Level ' + MGR.featLvl('tagesmissionen'), true) + donut(0, '#f0c24b', 'Karriere', 'ab Level ' + MGR.featLvl('missionen'), true) + '</div></div>';
  var d = M.daily, dn = d.filter(function (m) { return m.st !== 'open'; }).length, open = d.filter(function (m) { return m.st === 'done'; }).length + (M.careerOn ? M.career.filter(function (m) { return m.st === 'done'; }).length : 0);
  var cc = M.career.filter(function (m) { return m.st === 'claimed'; }).length;
  return '<div class="box misbox" onclick="if(V.missions.careerOn)go(\'missionen\');else pop(\'<h2>☀️ Tagesmissionen</h2>\' + V.missions.daily.map(misRow).join(\'\'), { white: true })" style="cursor:pointer"><h3>🎯 Missionen' + (open ? ' <span class="pill y">' + open + ' abholen</span>' : '') + '</h3><div class="mdons">' + donut(d.length ? dn / d.length : 0, '#8fc852', 'Heute', dn + '/' + d.length) + donut(cc / 50, '#f0c24b', 'Karriere', M.careerOn ? cc + '/50' : 'ab Level ' + MGR.featLvl('missionen'), !M.careerOn) + '</div></div>';
}
function misRow(m) {
  var rw = m.rw, t = []; if (rw.x) t.push('+' + rw.x + ' XP'); if (rw.m) t.push(eurK(rw.m)); if (rw.f) t.push('Fans +' + rw.f); if (rw.j) t.push(rw.j + ' 🃏'); if (rw.h) t.push(String(rw.h / 2).replace('.', ',') + ' ★');
  return '<div class="misr ' + m.st + '"><span class="mic">' + (m.st === 'claimed' ? '✅' : m.st === 'done' ? '🎁' : '⬜') + '</span><span class="mt">' + esc(m.t) + '<div class="mbar"><i style="width:' + Math.round(Math.min(1, m.have / m.n) * 100) + '%"></i></div></span><span class="xs muted" style="white-space:nowrap">' + num(m.have) + ' / ' + num(m.n) + '</span><span class="mrw">' + t.join(' · ') + '</span>' + (m.st === 'done' ? '<button class="pri sm" onclick="misClaim(\'' + m.id + '\')">Abholen</button>' : '') + '</div>';
}
function tMissionen() {
  var M = V.missions || { daily: [], career: [] };
  var daily = M.dailyOn ? '<div class="box"><h3>☀️ Tagesmissionen</h3><div class="xs muted" style="margin-bottom:6px">Jeden Tag drei neue Aufgaben – kleine Belohnungen, schnell erledigt. Neue Missionen gibt es morgen.</div>' + (M.daily.length ? M.daily.map(misRow).join('') : '<div class="muted small">Die heutigen Missionen kommen beim nächsten Tageswechsel.</div>') + '</div>' : '<div class="box"><h3>☀️ Tagesmissionen</h3><div class="muted small">🔒 Ab Level ' + MGR.featLvl('tagesmissionen') + '.</div></div>';
  var cc = M.career.filter(function (m) { return m.st === 'claimed'; }).length, tiers = ['Einsteiger', 'Aufsteiger', 'Etabliert', 'Profi', 'Legende'];
  var career = '<div class="box"><h3>🏆 Karriere-Missionen <span class="pill">' + cc + ' / 50</span></h3>' + (M.careerOn ? '<div class="xs muted" style="margin-bottom:6px">Fünf Stufen, jede schwerer als die vorige – und mit größeren Belohnungen.</div>' + [0, 1, 2, 3, 4].map(function (t) { var L = M.career.slice(t * 10, t * 10 + 10); return '<div class="mtier"><b>Stufe ' + (t + 1) + ' · ' + tiers[t] + '</b><span class="xs muted">' + L.filter(function (m) { return m.st === 'claimed'; }).length + '/10</span></div>' + L.map(misRow).join(''); }).join('') : '<div class="muted small">🔒 Ab Level ' + MGR.featLvl('missionen') + '.</div>') + '</div>';
  return '<div class="grid g2" style="gap:14px;align-items:start">' + daily + career + '</div>';
}
function compBox() {
  var t = V.table, me = t.findIndex(function (r) { return r.svw; }), cup = function (k) { return V.cups.filter(function (c) { return c.k === k; })[0]; }, Q = V.qual || {};
  var st = function (k) { var c = cup(k); if (!c) return null; return c.won ? '<b style="color:#f0c24b">🏆 Pokalsieger</b>' : c.alive ? '<b style="color:var(--g)">' + esc(c.round || '1. Runde') + '</b>' : '<b style="color:#e25c5c">' + esc(c.round || '') + ' · raus</b>'; };
  var lg = function (k) { return '<img src="' + VLOGO[k] + '" style="height:16px;width:16px;object-fit:contain;vertical-align:-3px">'; };
  var row = function (ic, n, v) { ic = ic === '🏟️' ? lg(V.lvl <= 4 ? 'dfb' : 'fvm') : ic === '🇩🇪' ? lg('dfb') : (ic === '🥇' || ic === '🍺') ? lg('fvm') : ic; return '<div class="row sp small" style="padding:7px 0;border-top:1px solid var(--linie);gap:8px"><span style="min-width:0">' + ic + ' ' + esc(n) + '</span><span style="white-space:nowrap">' + v + '</span></div>'; };
  var h = '<div class="box"><h3>🏆 Wettbewerbe</h3>' + row('🏟️', lsh(V.ligaK || V.liga || 'Liga'), '<b>' + (me + 1) + '. Platz</b>');
  h += row('🥇', 'Kreispokal', st('kp') || '<span class="muted">nicht dabei</span>');
  var mr = cup('mrp'); if (mr || Q.mrp) h += row('🍺', VPN(), st('mrp') || '<b style="color:var(--g)">qualifiziert (nächste Saison)</b>');
  if (cup('dfb') || Q.dfb) h += row('🏆', 'PRO Pokal', st('dfb') || '<b style="color:var(--g)">qualifiziert (nächste Saison)</b>');
  return h + '</div>';
}
function topBox1(seg, title) {
  var T = V.top[seg] || [];
  var val = function (p) { return seg === 'lt' ? '<span class="grd ' + gradeCls(p.avg) + '">' + gtx(p.avg) + '</span>' : seg === 'tore' ? '<b>' + p.g + '</b> ' + (p.g === 1 ? 'Tor' : 'Tore') : '<b>' + p.a + '</b> ' + (p.a === 1 ? 'Vorlage' : 'Vorlagen'); };
  return '<div class="box sm1"><h3>' + title + '</h3>' + (T.length ? T.map(function (p, i) { return '<div class="row sp" style="padding:6px 0;border-top:1px solid var(--linie);cursor:pointer;gap:6px" onclick="playerPop(' + p.id + ')"><div class="row" style="min-width:0;gap:6px"><span style="width:18px">' + ['🥇', '🥈', '🥉'][i] + '</span><span class="pb ' + p.pos + '">' + p.pos + '</span><b class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.n) + '</b></div><span class="small" style="white-space:nowrap">' + val(p) + '</span></div>'; }).join('') : '<div class="muted xs">Nach den ersten Pflichtspielen geht es hier los.</div>') + '</div>';
}
function plRow1(p, ic, txt) { return '<div class="row sp" style="padding:6px 0;border-top:1px solid var(--linie);cursor:pointer;gap:6px" onclick="playerPop(' + p.id + ')"><div class="row" style="min-width:0;gap:6px"><span class="pb ' + p.pos + '">' + p.pos + '</span><b class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.n) + '</b></div><span class="xs muted" style="text-align:right">' + ic + ' ' + esc(txt) + '</span></div>'; }
function injBox() {
  var O = V.out, r = O.inj.map(function (p) { return plRow1(p, '🚑', 'noch ' + p.inj + ' T.'); }).concat(O.ban.map(function (p) { return plRow1(p, '🟥', p.ban + ' Sp.'); }));
  return '<div class="box sm1"><h3>🚑 Ausfälle</h3>' + (r.length ? r.join('') : '<div class="muted xs">Alle an Bord – keine Verletzten oder Gesperrten.</div>') + '</div>';
}
function loanBox() {
  var O = V.out, r = O.loanOut.map(function (p) { return plRow1(p, '↗️', p.loan.to); }).concat(O.loanIn.map(function (p) { return plRow1(p, '↙️', p.loan.from); }));
  return '<div class="box sm1"><h3>🔁 Leihspieler</h3>' + (r.length ? r.join('') : '<div class="muted xs">Keine Leihspieler.</div>') + '</div>';
}
function contractBox1() {
  var n = V.players.filter(function (p) { return p.ending && !p.loan && !p.self; }).length;
  return '<div class="box sm1"><h3>📄 Auslaufende Verträge</h3><div class="row sp" style="gap:8px"><span class="small"><b style="font-size:22px;color:' + (n ? '#e25c5c' : 'var(--g)') + '">' + n + '</b> ' + (n === 1 ? 'Vertrag' : 'Verträge') + ' offen</span><button class="sm' + (n ? ' pri' : '') + '" ' + (n ? '' : 'disabled') + ' onclick="ST.kSort=\'ce\';go(\'kader\')">Verlängern</button></div></div>';
}
function L4(c1, mid, c4) { return '<div class="L4"><div class="c1">' + (c1 || '') + '</div><div class="cm">' + (mid || '') + '</div><div class="c4">' + (c4 || '') + '</div></div>'; }
function S2(a, b) { return '<div class="s2"><div>' + (a || '') + '</div><div>' + (b || '') + '</div></div>'; }
function repBar(v, lbl, sub, col) { return '<div style="margin:7px 0"><div class="row sp xs"><b>' + lbl + '</b><span style="color:' + col + ';font-weight:800">' + v + ' / 100</span></div><div class="psbar" style="height:8px"><i style="width:' + Math.max(v ? 3 : 0, v) + '%;background:linear-gradient(90deg,' + col + ',#fff6)"></i></div>' + (sub ? '<div class="muted" style="font-size:10.5px;margin-top:2px">' + sub + '</div>' : '') + '</div>'; }
function repName(v) { return v >= 85 ? 'Legende' : v >= 70 ? 'Top-Trainer' : v >= 55 ? 'Gefragt' : v >= 40 ? 'Solide' : v >= 25 ? 'Bekannt im Kreis' : 'Unbeschriebenes Blatt'; }
// Kleine Kreisdiagramme (wie bei Reichweite) für die Trainerbox
function miniRing(pct, col, big, lbl, sub, locked) {
  var R0 = 30, C = 2 * Math.PI * R0, p = Math.max(0, Math.min(100, pct || 0));
  return '<div class="mring' + (locked ? ' lock' : '') + '"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="' + R0 + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="7"/>' + (locked ? '' : '<circle cx="38" cy="38" r="' + R0 + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (C * p / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 38 38)"/>') + '<text x="38" y="' + (locked ? 46 : 43) + '" text-anchor="middle" font-size="' + (locked ? 22 : 15) + '" font-weight="900" fill="currentColor">' + (locked ? '🔒' : esc(big)) + '</text></svg><b>' + lbl + '</b><small>' + (locked ? 'ab Level ' + MGR.featLvl('privat') : esc(sub || '')) + '</small></div>';
}
function jobRing(J) {
  var JD = V.jobsDef || {}; J = J || {}; var lk = !has('privat');
  if (J.stage === 'study' && JD[J.path]) { var st = JD[J.path].study, pc = J.months / st[1] * 100; return miniRing(pc, '#6fb3e6', Math.round(pc) + '%', J.path === 'ausb' ? '🛠️ Ausbildung' : '📚 Studium', J.months + ' / ' + st[1] + ' Mon.', lk); }
  if (J.stage === 'job' && JD[J.path]) { var lad = JD[J.path].ladder; return miniRing((J.step + 1) / lad.length * 100, '#6fb3e6', (J.step + 1) + '/' + lad.length, '💼 Job', J.title || 'Stufe ' + (J.step + 1), lk); }
  return miniRing(0, '#6fb3e6', '–', '💼 Job / Studium', J.stage === 'abi' || !J.stage ? 'noch nichts' : 'ohne Job', lk);
}
function jobMini(J) {
  var JD = V.jobsDef || {}; J = J || {};
  if (J.stage === 'study' && JD[J.path]) { var st = JD[J.path].study; return fBar('📚 ' + esc(J.title || 'Studium'), J.months / st[1] * 100, J.months + ' / ' + st[1] + ' Mon.'); }
  if (J.stage === 'job' && JD[J.path]) { var lad = JD[J.path].ladder; return fBar('💼 ' + esc(J.title || 'Job'), (J.step + 1) / lad.length * 100, 'Stufe ' + (J.step + 1) + ' / ' + lad.length); }
  return fBar('💼 Job / Studium', 0, J.stage === 'abi' || !J.stage ? 'noch nichts gewählt' : 'ohne Job');
}
function mgrSide() {
  var P = V.priv || {}, own = Object.keys(P.owned || {}).filter(function (k) { return P.owned[k]; }).length, J = P.job || {}, F = (P.fam || {}).partner, r = V.mgrRep || 0, w = V.wld || [0, 0, 0];
  var h = '<div class="box" id="mgrside"><div class="row" style="gap:10px;align-items:center">' + (typeof avatarHTML === 'function' ? avatarHTML(ME && ME.avatar, ME && ME.pic, 40) : '') + '<div style="min-width:0"><b style="font-size:15px">' + esc(ME ? (ME.name || ME.vorname) : 'Manager') + '</b><div class="xs muted">Level ' + V.mlvl + ' · ' + esc(V.ligaK) + '</div></div></div>';
  var lzD = V.courses ? V.courses.filter(function (c) { return c.done; }).length : 0, lzT = V.courses ? V.courses.length : 0;
  var lockP = !has('privat');
  h += '<div class="mrings">' + miniRing(lzT ? lzD / lzT * 100 : 0, '#8fc852', lzD + '/' + (lzT || 13), '🎓 Lizenzen', 'abgeschlossen', lockP) + miniRing(r, '#f0c24b', Math.round(r), '⭐ Ansehen', repName(r), false) + jobRing(J) + '</div>';
  h += '<div class="mkv">' + kv('Karrierebilanz', '<b style="color:#5fbf3a">' + w[0] + 'S</b> · ' + w[1] + 'U · <b style="color:#e25c5c">' + w[2] + 'N</b>') + kv('Privatvermögen', '<b class="pos">' + eur(P.cash || 0) + '</b>') + kv('Gekauft', own + ' / ' + ((V.shop || []).length || own) + (own ? ' <a class="xs" style="cursor:pointer;color:var(--g)" onclick="go(\'privat\')">ansehen</a>' : '')) + '</div>' +
    '<div class="mkv">' + kv('Beziehung', F ? '❤️ ' + esc(F.n.split(' ')[0]) : 'Single') + (V.ps ? kv('Pers. Sponsor', esc(V.ps.firm)) : '') + '</div>';
  var L = V.lang || [];
  if (lockP) h += '<div style="margin-top:8px"><div class="row sp"><b class="xs">🗣️ Sprachen</b><span class="xs muted">🔒 ab Level ' + MGR.featLvl('privat') + '</span></div></div>'; else h += '<div style="margin-top:8px"><div class="row sp"><b class="xs">🗣️ Sprachen</b><a class="xs" style="cursor:pointer;color:var(--g)" onclick="go(\'manager\')">verwalten</a></div><div class="xs" style="margin-top:4px">' + flagImg('de') + ' Deutsch · Muttersprache</div>' + L.map(function (x) { return '<div class="row sp xs" style="margin-top:4px;gap:6px"><span>' + flagImg(FLC[x.k]) + ' ' + esc(x.n) + ' · ' + (CEFR[x.lvl] || '–') + '</span>' + (x.lvl >= 6 ? '<span>✔</span>' : x.exam ? '<button class="sm' + (x.block ? ' done' : ' pri') + '" style="padding:1px 7px;font-size:10px;line-height:1.4;min-height:0;width:auto" ' + (x.block ? 'disabled' : '') + ' onclick="act(\'langExam\',{k:\'' + x.k + '\'},{quiet:true})">' + (x.block ? '⏳ ' + dFull(x.block).slice(0, 6) : '🎓 Prüfung') + '</button>' : '<button class="sm' + (x.done ? ' done' : ' pri') + '" style="padding:1px 7px;font-size:10px;line-height:1.4;min-height:0;width:auto" ' + (x.done ? 'disabled title="Diese Woche schon geübt"' : '') + ' onclick="act(\'langAsk\',{k:\'' + x.k + '\'},{quiet:true})">' + (x.done ? '✓ geübt' : '📖 Lernen') + '</button>') + '</div>'; }).join('') + '</div>';
  var HB = V.hobbies || [], myH = (V.hobO || []).map(function (k) { return HB.filter(function (x) { return x.k === k; })[0]; }).filter(Boolean);
  if (lockP) h += '<div style="margin-top:8px"><div class="row sp"><b class="xs">🎯 Hobbys</b><span class="xs muted">🔒 ab Level ' + MGR.featLvl('privat') + '</span></div></div>'; else h += '<div style="margin-top:10px"><div class="row sp"><b class="xs">🎯 Hobbys</b><a class="xs" style="cursor:pointer;color:var(--g)" onclick="go(\'manager\')">verwalten</a></div>' + (myH.length ? myH.map(function (x) { return '<div class="row sp xs" style="margin-top:4px;gap:6px"><span>' + x.ic + ' ' + esc(x.n) + ' · ' + x.pct + ' %</span><button class="sm' + (x.done ? ' done' : ' pri') + '" style="padding:1px 7px;font-size:10px;line-height:1.4;min-height:0;width:auto" ' + (x.done ? 'disabled' : '') + ' onclick="act(\'hobbyDo\',{k:\'' + x.k + '\'})">' + (x.done ? '✓' : 'Hingehen') + '</button></div>'; }).join('') : '<div class="xs muted" style="margin-top:4px">Noch kein Hobby.</div>') + '</div>';
  return h + '</div>';
}
function clubSide() {
  var R = V.clubRep || { reg: 0, nat: 0, intl: 0 };
  var h = '<div class="box"><h3>🏟️ Verein</h3>' + repBar(R.reg, '📍 Regionales Ansehen', RX('Im Ländchen und im Kreis'), '#8fc852') + repBar(R.nat, '🇩🇪 Nationales Ansehen', R.nat ? 'Deutschlandweit bekannt' : 'Ab Regionalliga langsam möglich', '#4fa3e0') + repBar(R.intl, '🌍 Internationales Ansehen', R.intl ? 'Europa schaut zu' : 'Erst als Top-5-Team der Bundesliga', '#c77dff');
  h += '<div style="margin-top:10px">' + kv('Stadion', esc(V.stadion) + ' · ' + num(V.infra.cap) + ' Plätze') + kv('Abnutzung Hauptplatz', V.infra.pitch.type === 'natur' ? 'Naturrasen' : '<b style="color:' + (V.infra.pitch.cond >= 60 ? '#5fbf3a' : V.infra.pitch.cond >= 30 ? '#f0c24b' : '#e25c5c') + '">' + V.infra.pitch.cond + ' %</b>') + kv('Vereinswert', eurK(V.value)) + (V.masc ? kv('Maskottchen', (V.mascs.filter(function (m) { return m.k === V.masc; })[0] || {}).e + ' ' + esc((V.mascs.filter(function (m) { return m.k === V.masc; })[0] || {}).n || '')) : '') + '</div>' + attBox() +
    '';
  return h + '</div>';
}
var SI = function (p, vb) { return '<svg viewBox="' + (vb || '0 0 24 24') + '" width="16" height="16" fill="#fff">' + p + '</svg>'; };
var SOCIC = { ytshort: SI('<path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8z" fill="#fff"/><path d="M10 15.2 15.2 12 10 8.8z" fill="#ff0000"/>'), ytvlog: SI('<path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8z" fill="#fff"/><path d="M10 15.2 15.2 12 10 8.8z" fill="#cc0000"/>'),
  tiktok: SI('<path d="M16.5 3c.3 2 1.6 3.6 3.5 3.9v3a7 7 0 0 1-3.5-1.1v6.4a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.7 2.4V3z"/>'), igstory: SI('<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2"/>'), igreel: SI('<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" stroke-width="2"/><path d="M3 8.5h18M8 3l3 5.5M13.5 3l3 5.5" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M10 11.5v6l5-3z"/>'),
  wakanal: SI('<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/>'), fbpost: SI('<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8.5c0-.3.2-.5.5-.5z"/>'),
  xpost: SI('<path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zM16.7 19.2h1.7L7.4 4.7H5.6z"/>'), twitch: SI('<path d="M4 3 3 6.5V20h4.5v2.5H10l2.5-2.5h3.5l5-5V3zm15.5 11-3 3h-4l-2.5 2.5V17H6.5V4.5h13z"/><path d="M15.5 7.5H17v4.5h-1.5zM11.5 7.5H13v4.5h-1.5z"/>'), podcast: SI('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V22M8.5 22h7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>'),
  snap: SI('<path d="M12 2.5c3 0 5.2 2.3 5.2 5.3v2.3c.6.2 1.4-.2 1.8.2.5.5-.4 1.2-1.6 1.6.4 1.4 2 3.2 3.6 3.6-.2.9-2 .9-2.4 1.3-.2.4-.1 1.1-.6 1.2-.7.1-1.5-.3-2.5 0-1 .3-1.8 1.6-3.5 1.6s-2.5-1.3-3.5-1.6c-1-.3-1.8.1-2.5 0-.5-.1-.4-.8-.6-1.2-.4-.4-2.2-.4-2.4-1.3 1.6-.4 3.2-2.2 3.6-3.6C5.4 11.5 4.5 10.8 5 10.3c.4-.4 1.2 0 1.8-.2V7.8c0-3 2.2-5.3 5.2-5.3z" fill="#fff" stroke="#222" stroke-width=".8"/>'), threads: SI('<path d="M16.6 11.2c-.1 0-.2-.1-.3-.1-.2-3-1.8-4.7-4.6-4.7-1.7 0-3 .7-3.9 2l1.5 1c.6-1 1.6-1.2 2.4-1.2 1 0 1.7.3 2.1.9.3.4.5 1 .6 1.7-.8-.1-1.6-.2-2.5-.1-2.5.1-4.1 1.6-4 3.6.1 1.1.6 2 1.5 2.5.8.5 1.7.7 2.7.7 1.3-.1 2.4-.6 3.1-1.5.5-.7.9-1.6 1-2.7.6.4 1.1.9 1.4 1.5.5 1.1.5 2.8-.9 4.2-1.2 1.2-2.7 1.8-5 1.8-2.5 0-4.4-.8-5.6-2.4C4.9 16.9 4.3 14.8 4.3 12s.6-4.9 1.8-6.4C7.3 4 9.2 3.2 11.7 3.2s4.5.8 5.8 2.4c.6.8 1.1 1.8 1.4 2.9l1.8-.5c-.4-1.4-1-2.6-1.8-3.6C17.3 2.4 14.9 1.4 11.7 1.4 8.6 1.4 6.2 2.4 4.6 4.4 3.2 6.2 2.5 8.8 2.5 12s.7 5.8 2.1 7.6c1.6 2 4 3 7.1 3 2.8 0 4.7-.7 6.3-2.3 2.1-2.1 2-4.7 1.3-6.3-.5-1.2-1.5-2.1-2.7-2.8zm-4.4 4.1c-1.1.1-2.2-.4-2.2-1.4 0-.7.5-1.5 2.1-1.6h.6c.6 0 1.1.1 1.6.2-.2 2.3-1.3 2.7-2.1 2.8z"/>') };
function reachBox() {
  var f = V.follow || 0, m = V.mkt || 0, gp = Math.min(100, f / 10000);
  var MS = V.fms || [[10000, 'Sponsoren-Interesse']], ni = MS.findIndex(function (x) { return f < x[0]; }); if (ni < 0) ni = MS.length - 1;
  var st = [MS[ni][0], ['Erste Fans online', 'Lokale Sponsoren', 'Sponsoren-Interesse', 'Überregionale Sponsoren', 'Große Firmen', 'Nationale Marken', 'Top-Marken', 'Internationale Marke'][ni] || 'Nächste Stufe'];
  var prev = ni ? MS[ni - 1][0] : 0, sp = Math.max(0, Math.min(100, (f - prev) / (st[0] - prev) * 100));
  var R0 = 34, C = 2 * Math.PI * R0, ring = '<svg width="66" height="66" viewBox="0 0 86 86"><circle cx="43" cy="43" r="' + R0 + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="8"/><circle cx="43" cy="43" r="' + R0 + '" fill="none" stroke="url(#rgr)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (C * gp / 100) + ' ' + C + '" transform="rotate(-90 43 43)"/><defs><linearGradient id="rgr"><stop offset="0" stop-color="#f9ce34"/><stop offset=".5" stop-color="#ee2a7b"/><stop offset="1" stop-color="#6228d7"/></linearGradient></defs><text x="43" y="41" text-anchor="middle" font-size="13" font-weight="900" fill="#fff" font-family="Montserrat,sans-serif">' + (gp < 10 ? gp.toFixed(1).replace('.', ',') : Math.round(gp)) + '%</text><text x="43" y="55" text-anchor="middle" font-size="8.5" fill="#aab" font-family="Montserrat,sans-serif">von 1 Mio</text></svg>';
  var btns = (V.social || []).filter(function (x) { return x.k !== 'twitch'; }).map(function (x) { return '<button class="socb" data-k="' + x.k + '" style="--c:' + x.c + '" ' + (V.socDone ? 'disabled' : '') + ' onclick="socialDo(\'' + x.k + '\',event)"><span class="si">' + (SOCIC[x.k] || '★') + '</span><span>' + esc(x.n) + '</span></button>'; }).join('');
  var last = V.socLast && V.socDone ? '<div class="wkline" style="color:' + (V.socLast.g >= 0 ? '#8fc852' : '#ff6b6b') + '">Diese Woche: ' + (V.socLast.g >= 0 ? '+' : '') + num(V.socLast.g) + ' Follower · nächste Aktion ab Montag</div>' : '';
  var adrow = '<div class="adrow2">' +
    '<button class="adtile ad" ' + (V.socUsed || V.pots.cash < V.adCost ? 'disabled' : '') + ' onclick="adDo(event)"><span class="adic">📢</span><span class="adtx"><b>' + (V.adDone ? 'Werbung lief' : 'Werbung schalten') + '</b><small>' + (V.adDone ? (V.adLast && V.adLast.g ? '+' + num(V.adLast.g) + ' Follower' : 'ohne Wirkung') : eur(V.adCost)) + '</small></span></button>' +
    '<button class="adtile fl" ' + (V.socUsed || V.pots.cash < 40 ? 'disabled' : '') + ' onclick="flyDo(event)"><span class="adic">📄</span><span class="adtx"><b>' + (V.flyDone ? 'Flyer verteilt' : 'Flyer verteilen') + '</b><small>' + (V.flyDone ? '+' + V.flyLast + ' Follower' : '40 €') + '</small></span></button></div>';
  var msH = '<div class="msrow">' + MS.map(function (x, k) { var ok = f >= x[0]; return '<div class="msb' + (ok ? ' ok' : '') + '" title="' + num(x[0]) + ' Follower"><span>📣</span><b>' + (x[0] >= 1000 ? num(x[0] / 1000) + 'k' : num(x[0])) + '</b><small>' + esc(['Erste Fans online', 'Lokale Sponsoren', 'Sponsoren-Interesse', 'Überregionale Sponsoren', 'Große Firmen', 'Nationale Marken', 'Top-Marken', 'Internationale Marke'][k] || x[1] || '') + '</small></div>'; }).join('') + '</div>';
  return '<div class="box reach reachw" style="margin:0 0 14px"><div class="row sp"><h3 style="margin:0">📣 Reichweite' + (V.hype ? ' <span class="hypef" title="Guter Zeitpunkt für Beiträge">' + '🔥🔥🔥'.slice(0, 2 * (V.hype >= 2 ? 3 : V.hype >= 1 ? 2 : 1)) + '</span>' : '') + '</h3></div><div class="reachg"><div>' +
    '<div class="row" style="gap:12px;align-items:center;margin-top:4px">' + ring + '<div style="flex:1;min-width:0"><div class="xs muted">Follower</div><div id="follownum" class="fnum">' + num(f) + '</div>' + (V.followWeek ? '<span class="pill ' + (V.followWeek > 0 ? 'g' : 'r') + '" style="font-size:11px">' + (V.followWeek > 0 ? '+' : '') + num(V.followWeek) + ' letzte Woche</span>' : '') + '</div></div>' +
    '<div style="margin-top:6px"><div class="row sp xs"><b>💼 ' + st[1] + '</b><span class="muted">' + num(f) + ' / ' + num(st[0]) + '</span></div><div class="rbar"><i style="width:' + sp + '%"></i></div></div>' +
    '<div class="row sp xs" style="margin-top:5px"><span class="muted">Vermarktung</span><b style="color:' + (m >= 60 ? '#8fc852' : m >= 35 ? '#ffd34d' : '#ff6b6b') + '">' + m + ' / 100</b></div>' +
    '</div><div><div class="socg' + (V.socUsed ? ' used' : '') + '">' + btns + '</div>' + adrow + last + '</div></div>' + msH + '</div>';
}
var SOCBUSY = false;
function socLock() { if (SOCBUSY || V.socUsed) { toast('Diese Woche gab es schon eine Aktion – nur eine pro Woche.', true); return true; } SOCBUSY = true; setTimeout(function () { SOCBUSY = false; }, 4000); return false; }
function flyDo(ev) { if (socLock()) return; var before = V.follow; act('flyer', {}, { quiet: true, norender: true }).then(function (r) { if (!r) return; toast(r.info); var g = V.follow - before; if (g > 0) flyFollowers(ev.pageX, ev.pageY, before, g); else setTimeout(renderTab, 400); }); }
function adDo(ev) { if (socLock()) return; var before = V.follow; act('socialAd', {}, { quiet: true, norender: true }).then(function (r) { if (!r) return; toast(r.info); var g = V.follow - before; if (g > 0) flyFollowers(ev.pageX, ev.pageY, before, g); else setTimeout(renderTab, 400); }); }
function socialDo(k, ev) {
  if (socLock()) return; var before = V.follow; act('socialAct', { k: k }, { quiet: true, norender: true }).then(function (r) { if (!r) return;
  var gain = V.follow - before; toast(r.info);
  if (gain > 0) { flyFollowers(ev.pageX, ev.pageY, before, gain); xpFx(1, ev.pageX, ev.pageY); } else setTimeout(renderTab, 600);
  });
}
function flyFollowers(fx, fy, before, gain) {
  var tgt = $('#follownum'), ev = { pageX: fx, pageY: fy };
  if (tgt && gain > 0) { var tr = tgt.getBoundingClientRect(), tx = tr.left + tr.width / 2 + window.scrollX, ty = tr.top + tr.height / 2 + window.scrollY, n = Math.min(24, Math.max(4, Math.round(gain / 2)));
    for (var i = 0; i < n; i++) (function (i) { var e = document.createElement('span'); e.className = 'flyf'; e.textContent = ['👤', '❤️', '👍', '⭐'][i % 4]; e.style.left = ev.pageX + 'px'; e.style.top = ev.pageY + 'px'; e.style.setProperty('--tx', (tx - ev.pageX + (Math.random() - .5) * 30) + 'px'); e.style.setProperty('--ty', (ty - ev.pageY) + 'px'); e.style.animationDelay = i * 0.05 + 's'; $('#fxl').appendChild(e); setTimeout(function () { e.remove(); }, 1400 + i * 50); })(i);
    var t0 = Date.now(); var iv = setInterval(function () { var p = Math.min(1, (Date.now() - t0 - 600) / 900); if (p >= 0) tgt.textContent = num(Math.round(before + gain * p)); if (p >= 1) { clearInterval(iv); tgt.classList.add('pulse'); setTimeout(function () { renderTab(); }, 900); } }, 40);
  }
}
function buildBox() {
  var B = V.building || [];
  return '<div class="box"><h3>🏗️ Bauprojekte</h3>' + (B.length ? B.map(function (b) { var pct = b.total ? Math.round(100 * (1 - b.days / b.total)) : 50; return '<div style="padding:8px 0;border-top:1px solid var(--linie)"><div class="row sp small"><b>' + esc(b.n) + '</b><span class="xs muted">fertig am ' + dFull(b.done) + ' · noch ' + b.days + ' Tage</span></div>' + bar(Math.max(4, pct), 100, 'var(--y)') + '</div>'; }).join('') : '<div class="small muted">Gerade wird nichts gebaut. Erweiterungen gibt es unter Verein → Ausbau.</div>') + '</div>';
}
var AVC = ['#3d8fe0', '#d35b9a', '#e0883d', '#4aa36b', '#8a63d2', '#c94f4f', '#2f9e9e'];
function avColor(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return AVC[h % AVC.length]; }
function mailsBox() {
  var list = V.mails.filter(function (m) { return !m.answered || m.id === ST.mailOpen; });
  var open = V.mails.filter(function (m) { return !m.answered; }).length;
  var logo = '<img src="' + OLLOGO + '" alt="Outlook" style="height:26px;width:auto">';
  var h = '<div class="olk" id="mailbox"><div class="bar0">' + logo + '<span>Posteingang</span><span style="margin-left:auto;font-size:11px;font-weight:600;opacity:.85">Manager-Postfach · ' + esc(V.full) + '</span>' + (open ? '<span class="pill" style="background:#fff;color:#0b5cad">' + open + ' neu</span>' : '') + '</div>';
  if (!list.length) return h + '<div class="ol"><div class="small" style="padding:14px;color:#6a7a8e">Keine Nachrichten.</div></div></div>';
  h += '<div class="ol">' + list.map(mailItem).join('') + '</div>';
  return h + '</div>';
}
function mailItem(m) {
  var unread = !m.answered, o = ST.mailOpen === m.id || (ST.mailOpen == null && unread && !m.info && V.mails.filter(function (x) { return !x.answered && !x.info; })[0] === m);
  var from = String(m.from || ''); var ini = from.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  var h = '<div class="mi" id="mail' + m.id + '"><div class="it ' + (unread ? 'unread' : '') + '" onclick="openMail(' + m.id + ',' + (o ? 1 : 0) + ')">' + mailPortrait(from, 36) + '<div style="min-width:0"><div class="fr">' + esc(from) + '</div><div class="sj">' + esc(shortSubj(m)) + '</div></div><div class="xs muted">' + dF(m.d) + (m.info ? '' : unread ? ' <span style="color:var(--y)">●</span>' : '') + '</div></div>';
  if (o) {
    h += '<div class="rd"><div class="hd">Von: <b style="color:var(--t)">' + esc(from) + '</b> · An: Manager ' + esc(V.full) + ' · ' + dFull(m.d) + '</div><div class="tx">' + esc(m.text) + '</div>' + offerCard(m);
    if (m.kind === 'report' && m.data) {
      var dI = m.data.inn, dO = m.data.out;
      h += '<div style="margin-top:8px">' + Object.keys(dI).sort(function (a, b) { return dI[b] - dI[a]; }).map(function (k) { return kv(esc(k), '<span class="pos">+' + eur(dI[k]) + '</span>'); }).join('') + Object.keys(dO).sort(function (a, b) { return dO[b] - dO[a]; }).map(function (k) { return kv(esc(k), '<span class="neg">−' + eur(dO[k]) + '</span>'); }).join('') + kv('<b>Ergebnis</b>', '<span class="' + (m.data.ti - m.data.to >= 0 ? 'pos' : 'neg') + '">' + eur(m.data.ti - m.data.to) + '</span>') + '</div>';
    }
    if (!m.answered) {
      if (m.info) h += '';
      else h += (m.pid != null && /abwerb/i.test((m.subj || '') + ' ' + m.text) ? abwCard(m.pid) : m.pid != null && PCARD_RX.test((m.subj || '') + ' ' + m.text) ? pCard(m.pid, true) : '') + (m.data && m.data.mp ? extCard(m.data.mp) : '') + '<div class="opts ' + optCls(m.id) + '">' + rotIdx(m.id, m.opts.length, m.kind === 'sign').map(function (i) { var op = m.opts[i]; return '<button class="' + (m.kind === 'sign' && i === 0 ? 'pri' : '') + '" onclick="replyMail(' + m.id + ',' + i + ',event)">' + esc(op.label) + '</button>'; }).join('') + '</div>';
    } else if (m.answered.idx >= 0 && m.opts[m.answered.idx]) h += '<div class="xs muted" style="margin-top:8px">Deine Antwort: „' + esc(m.opts[m.answered.idx].label) + '“' + (m.answered.res && m.answered.res.length ? ' → ' + esc(m.answered.res.join(', ')) : '') + '</div>';
    else if (typeof m.answered === 'string') h += '<div class="xs muted" style="margin-top:8px">Nicht beantwortet.</div>';
    if (m.info) h += '<div style="margin-top:10px"><button class="sm" onclick="ackMail(' + m.id + ',event)">Zur Kenntnis genommen</button></div>';
    h += '</div>';
  }
  return h + '</div>';
}
function replyMail(id, idx, ev) {
  var el = $('#mail' + id); var x = ev.pageX, y = ev.pageY;
  var env = document.createElement('div'); env.className = 'envfly'; env.style.left = (x - 35) + 'px'; env.style.top = (y - 23) + 'px';
  env.innerHTML = '<svg viewBox="0 0 70 46"><rect x="1" y="1" width="68" height="44" rx="4" fill="#f2f4f0"/><path d="M1 3 L35 26 L69 3" fill="none" stroke="#8fc852" stroke-width="3"/></svg>';
  if (el) el.classList.add('fold'); SND.send();
  setTimeout(function () { document.body.appendChild(env); setTimeout(function () { env.remove(); }, 1100); }, 250);
  setTimeout(function () { ST.mailOpen = null; var m = V.mails.filter(function (q) { return q.id === id; })[0]; act('reply', { id: id, idx: idx }, { quiet: true }).then(function (r) { if (r) xpFx(0.1, x, y - 30); if (r && r.info) fxCard(m ? m.subj || 'Antwort' : 'Antwort', splitInfo(r.info), x, y); }); }, 480);
}
function offerCard(m) {
  if (m.kind !== 'offer' || !m.data) return ''; var p = V.players.filter(function (q) { return q.id === m.data.pid; })[0]; if (!p) return '';
  return '<div style="background:rgba(127,127,127,.12);border-radius:12px;padding:10px 12px;margin:10px 0"><div class="row sp"><div class="row" style="gap:8px"><span class="pb ' + p.pos + '">' + p.pos + '</span><b>' + esc(p.n) + '</b><span class="xs" style="opacity:.7">' + p.age + ' J.' + (p.pos2 ? ' · auch ' + p.pos2 : '') + '</span></div>' + strBox(p.str) + '</div>' +
    '<div class="row wr xs" style="gap:12px;margin-top:8px;opacity:.85"><span>' + stars(p.talLo, p.talHi) + '</span><span>Ligaspiele <b>' + p.lgp + '</b></span><span>Tore <b>' + p.lg + '</b></span><span>Vorlagen <b>' + p.la + '</b></span><span>Ø Note <b>' + (p.lgr != null ? gtx(p.lgr) : '–') + '</b></span><span>Marktwert <b>' + eurK(p.mw) + '</b></span><span>Gehalt <b>' + eur(p.sal) + '</b></span><span>Vertrag bis <b>06/' + p.ce + '</b></span></div>' +
    '<button class="sm" style="margin-top:8px" onclick="event.stopPropagation();playerPop(' + p.id + ')">Spielerinfo öffnen</button>' + (V.window ? '' : '<div class="xs" style="margin-top:6px;color:#b26a00">Außerhalb der Wechselperiode: Er bleibt bis zum nächsten Stichtag bei uns.</div>') + '</div>';
}
function openMail(id, wasOpen) {
  if (wasOpen) { ST.mailOpen = -1; renderTab(); return; }
  var m = V.mails.filter(function (q) { return q.id === id; })[0];
  ST.mailOpen = id;
  if (m && m.info && !m.answered) { act('reply', { id: id, idx: -1 }, { quiet: true, norender: true }).then(function () { renderTab(); }); }
  renderTab();
}
function ackMail(id, ev) { var el = $('#mail' + id); if (el) el.classList.add('swoosh'); SND.swoosh(); setTimeout(function () { ST.mailOpen = -1; var m = V.mails.filter(function (q) { return q.id === id; })[0]; if (m && !m.answered) act('reply', { id: id, idx: -1 }, { quiet: true }); else render(true); }, 430); }

/* Social Media (Karussell) */
var IGT = null;
function stopIg() { if (IGT) clearInterval(IGT); IGT = null; }
function startIg() { stopIg(); if (!V || !V.feed || V.feed.length < 2) return; IGT = setInterval(function () { ST.igIdx = (ST.igIdx + 1) % Math.min(8, V.feed.length); var b = $('#igbox'); if (b) b.innerHTML = igPost(); else stopIg(); }, 10000); }
var HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" fill="FILL" stroke="STROKE" stroke-width="1.8" stroke-linejoin="round"/></svg>';
var COMMENT = '<svg viewBox="0 0 24 24"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.1A8.5 8.5 0 1 1 20.5 11.5z" fill="none" stroke="#f2f4f0" stroke-width="1.8" stroke-linejoin="round"/></svg>';
var SHARE = '<svg viewBox="0 0 24 24"><path d="M21.5 3.5 10.5 13.8M21.5 3.5l-6.8 17-4.2-6.7-6.9-4.1z" fill="none" stroke="#f2f4f0" stroke-width="1.8" stroke-linejoin="round"/></svg>';
var IGURL = { kicker: 'https://www.instagram.com/kicker/?hl=de', transfermarkt: 'https://www.instagram.com/transfermarkt.de/?hl=de', dfb: 'https://www.instagram.com/dfb/?hl=de', fvm: 'https://www.instagram.com/fvm.de/?hl=de', fynn: 'https://www.instagram.com/f.schenten/?hl=de' };
function isAcc(p) { return String(p.media || '').indexOf('acc:') === 0; }
function igNm(p) { if (isAcc(p)) return p.u; return p.own ? (p.u || 'svwachtberg') : ({ kicker: 'kicker', transfermarkt: 'transfermarkt.de', dfb: 'dfb', fvm: 'fvm.de', fynn: 'f.schenten' })[p.media] || p.u; }
var SHAREXY = null;
function shareTargets() { return waFavs().slice(); }
function sharePost(id, re) {
  var p = V.feed.filter(function (x) { return x.id === id; })[0]; if (!p) return;
  if (!TOKEN) return toast('Teilen geht nur mit Login.', true);
  if (!re) SHAREXY = [LASTX, LASTY];
  var F = shareTargets(), favs = waFavs(), loading = !WA.contacts && !WA.fl;
  if (loading) { WA.fl = true; Promise.all([call('apiWaContacts', TOKEN).then(function (r) { if (r && r.ok) { WA.contacts = r.list; WA.me = r.me; } }), new Promise(function (res) { if (WA.fr) return res(); waFrLoad(res); }), new Promise(function (res) { if (Object.keys(WA.msgs).length) return res(); call('apiWaSync', TOKEN, 0).then(function (r) { if (r && r.ok) r.msgs.forEach(function (m) { WA.msgs[m.id] = m; if (m.ts > WA.since) WA.since = m.ts; }); res(); }).catch(res); })]).then(function () { WA.fl = false; if ($('#sharebox')) sharePost(id, true); }).catch(function () { WA.fl = false; }); }
  var row = function (n) { return '<button class="shr" onclick="shareTo(' + id + ',\'' + esc(n).replace(/'/g, '') + '\')"><span class="wav">' + esc(n.charAt(0).toUpperCase()) + '</span><span style="flex:1;text-align:left">' + esc(n) + '</span>' + (favs.indexOf(n) >= 0 ? '<span style="color:#e0a800">★</span>' : '<span class="xs muted">Chat</span>') + '</button>'; };
  var body = F.length ? '<div style="display:grid;gap:5px;max-height:280px;overflow:auto">' + F.map(row).join('') + '</div>' : (loading || WA.fl ? '<div class="small muted" style="padding:10px 0">⏳ Favoriten werden geladen …</div>' : '<div class="small muted" style="padding:6px 0">Noch keine Favoriten oder Chats – im Gehaltsranking bei Manager auf + tippen.</div>');
  pop('<div class="evw" id="sharebox"><div class="row" style="gap:10px;align-items:center"><span style="font-size:24px">📤</span><h2 style="padding:0;margin:0">Post teilen</h2></div><div class="small muted" style="margin:4px 0 10px">An deine ChatApp-Favoriten schicken:</div>' + body + '<button class="wabtn" style="width:100%;margin-top:10px" onclick="closePop();go(\'manager\');setTimeout(function(){var w=document.querySelector(\'.box.wa\');if(w)w.scrollIntoView({behavior:\'smooth\',block:\'center\'});},250)">💬 Zu WhatsApp</button></div>', { y: SHAREXY[1], x: SHAREXY[0] });
}
function shareTo(id, n) { var p = V.feed.filter(function (x) { return x.id === id; })[0]; if (!p) return; closePop(); call('apiWaSend', TOKEN, n, '📸 Schau mal auf Instagram – @' + igNm(p) + ': „' + p.t.slice(0, 300) + '“').then(function (r) { if (r && r.ok) { toast('An ' + n + ' geschickt ✅'); waSync(); } else toast((r && r.error) || 'Nicht gesendet.', true); }).catch(function () { toast('Keine Verbindung.', true); }); }
function igAv(p) { if (isAcc(p)) { var iu = imgOf('insta', p.media.slice(4)); return iu ? '<div class="av" style="padding:0;overflow:hidden"><img src="' + iu + '" style="width:100%;height:100%;object-fit:cover"></div>' : '<div class="av" style="background:' + (p.col || '#555') + '"><span>' + esc(String(p.u || '?').charAt(0).toUpperCase()) + '</span></div>'; } var src = p.own ? ownLogo() : ({ kicker: KICKERLOGO, transfermarkt: TMLOGO, dfb: VLOGO.dfb, fvm: VLOGO.fvm, fynn: FYNNPIC })[p.media] || null; if (p.media === 'fynn') return '<a href="' + IGURL.fynn + '" target="_blank" rel="noopener" class="av" style="padding:0;overflow:hidden;border-radius:0"><img src="' + FYNNPIC + '" style="width:100%;height:100%;border-radius:0;object-fit:cover"></a>'; var sq = p.media === 'kicker' || p.media === 'transfermarkt'; return src ? '<div class="av" style="background:#fff;padding:2px' + (sq ? ';border-radius:0' : '') + '"><img src="' + src + '" style="width:100%;height:100%;border-radius:' + (sq ? '0' : '50%') + ';object-fit:contain"></div>' : '<div class="av"><span>' + esc(p.u[0].toUpperCase()) + '</span></div>'; }
function mediaCard(p) { if (isAcc(p)) return '<div class="mcard" style="background:linear-gradient(135deg,' + (p.col || '#333') + ',#111)"><div class="mt">' + esc(p.t.slice(0, 140)) + '</div><div class="ms">@' + esc(p.u) + '</div></div>'; var bg = { kicker: 'linear-gradient(135deg,#cc0000,#7a0000)', transfermarkt: 'linear-gradient(135deg,#1a2b6b,#0a1338)', dfb: 'linear-gradient(135deg,#0b0b0b,#2b2b2b)', fvm: 'linear-gradient(135deg,#00843d,#004d24)', fynn: 'linear-gradient(135deg,#c8102e,#00843d)' }[p.media] || '#333'; var sub = { kicker: 'kicker · Amateure', transfermarkt: 'Transfermarkt · News', dfb: 'DFB · #UnsereAmateure', fvm: 'FVM · Mittelrhein', fynn: RX('🔴🟢 Grüße an den SVW') }[p.media] || ''; return '<div class="mcard" style="background:' + bg + '"><div class="mt">' + esc(p.t.slice(0, 140)) + '</div><div class="ms">' + sub + '</div></div>'; }
function igPost() {
  var F = V.feed.filter(function (p) { return dDiff(p.d, V.date) < 7; }); if (F.length < 2) F = V.feed.slice(0, 3); if (!F.length) return '<div class="muted small">Noch keine Beiträge.</div>';
  var n = Math.min(9, F.length); if (ST.igIdx >= n) ST.igIdx = 0; var p = F[ST.igIdx];
  var heart = HEART.replace('FILL', p.liked ? '#ff3b5c' : 'none').replace('STROKE', p.liked ? '#ff3b5c' : '#262626');
  return '<div class="ig igfade"><div class="hd">' + igAv(p) + (IGURL[p.media] ? '<a class="ign" href="' + IGURL[p.media] + '" target="_blank" rel="noopener">' + esc(igNm(p)) + '</a>' : '<span class="ign">' + esc(igNm(p)) + '</span>') + ((isAcc(p) ? p.ver : (p.own || p.media || (p.seed || p.id || 0) % 7 === 3)) ? '<span class="igv" title="Verifiziert">✔</span>' : '') + (p.viral ? '<span class="pill" style="margin-left:6px;background:#ff3b30;color:#fff;font-size:10px">🔥 viral</span>' : '') + '</div>' + (p.media ? mediaCard(p) : postSVG(p.k, p.seed)) +
    '<div class="ft"><div class="acts"><button onclick="likePost(' + p.id + ',event)">' + heart + '</button><button title="An ChatApp-Favoriten schicken" onclick="sharePost(' + p.id + ')">' + SHARE + '</button><b class="small" style="margin-left:auto">' + num(p.likes) + ' Likes</b></div><div class="igcap"><b>' + esc(igNm(p)) + '</b> ' + esc(p.t) + '</div></div></div>' +
    (n > 1 ? '<div class="dots">' + Array.apply(null, Array(n)).map(function (_, i) { return '<i class="' + (i === ST.igIdx ? 'on' : '') + '" onclick="ST.igIdx=' + i + ';$(\'#igbox\').innerHTML=igPost();startIg()"></i>'; }).join('') + '</div>' : '');
}
function likePost(id, ev) { var x = ev.pageX, y = ev.pageY; var before = V.xp, fb = V.follow; act('like', { id: id }, { quiet: true, norender: true }).then(function (r) { if (!r) return; if (V.likeFx) { var lg = V.likeFx; act('likeFxSeen', {}, { quiet: true, norender: true }); toast('🔥 Volltreffer! Der Post bringt +' + num(lg) + ' Follower!'); flyFollowers(x, y, fb, lg); rewardFx(x, y, true); } var b = $('#igbox'); if (b) b.innerHTML = igPost(); var k = $('#kpis'); if (k) k.innerHTML = kpiHTML(); if (V.xp > before) toast('+1 XP · Fans +0,4', false, '❤️ Like'); }); }
var YTLOGO = '<svg width="22" height="16" viewBox="0 0 28 20"><rect width="28" height="20" rx="5" fill="#ff0000"/><path d="M11 5.5v9l8-4.5z" fill="#fff"/></svg>';
var CLIPS = [['kickerfan_07', 'Fallrückzieher in der Kreisliga 🔥'], ['ballkunst.nrw', 'Freistoß direkt in den Winkel'], ['torwart_tom', 'Doppelparade in der Nachspielzeit'], ['amateurliga.tv', 'Tor des Monats-Kandidat'], ['bolzplatzhelden', 'Nutmeg-Show im Training'], ['rheinkick', 'Hacke, Spitze, eins, zwei, drei'], ['coach.lena', 'Pressing-Übung erklärt'], ['fvm_fans', 'Choreo beim Derby'], ['u19_highlights', 'Solo über den halben Platz'], ['flutlichtmomente', 'Last-Minute-Ausgleich'], ['dorfclub_doku', 'Ein Tag als Platzwart'], ['skillz_bonn', 'Rainbow-Flick im Spiel'], ['keeperschule', 'Elfmeter gehalten – und dann?'], ['kabinenpredigt', 'Halbzeitansprache, die alles dreht'], ['footy_daily', 'Tor aus 40 Metern'], ['siebengebirge_fc', 'Kopfballtor nach Ecke'], ['stadion_snacks', 'Bratwurst-Ranking der Liga'], ['ultras_lights', 'Fans singen im Regen'], ['trainingslager.vlog', 'Morgenlauf um 6 Uhr'], ['taktiktafel', 'Gegenpressing in 30 Sekunden']];
function clipPick() { var n = CLIPS.length, d = V.clipDay || 0, out = []; for (var k = 0; out.length < 3 && k < 12; k++) { var i = (d * 7 + k * 5 + (d % 3)) % n; if (out.indexOf(i) < 0) out.push(i); } return out; }
function clipGif(i) { var L = (D.media && D.media.gif) || []; if (L.length) return '<img src="' + L[(i * 3 + (V.clipDay || 0)) % L.length] + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">'; return '<svg viewBox="0 0 160 90" style="width:100%;height:100%;display:block"><rect width="160" height="90" fill="#2e7d32"/><rect y="0" width="160" height="90" fill="url(#cg' + i + ')" opacity=".25"/><defs><linearGradient id="cg' + i + '"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x="138" y="28" width="16" height="34" fill="none" stroke="#fff" stroke-width="2"/><line x1="0" y1="45" x2="160" y2="45" stroke="#fff" stroke-opacity=".3"/><g><circle r="5" fill="#fff" stroke="#111"><animateMotion dur="1.6s" repeatCount="indefinite" path="M20 70 Q 80 ' + (10 + i * 7 % 30) + ' 146 44"/></circle></g><g transform="translate(18 62)"><circle cy="-14" r="4" fill="#f1c8a0"/><rect x="-4" y="-10" width="8" height="12" rx="3" fill="#c62828"/><line x1="0" y1="2" x2="6" y2="9" stroke="#111" stroke-width="2.5"><animateTransform attributeName="transform" type="rotate" values="-40 0 2;30 0 2;-40 0 2" dur="1.6s" repeatCount="indefinite"/></line></g></svg>'; }
function clipPlay(i) { var el = $('#clip' + i); if (el) el.innerHTML = clipGif(i); }
function streamBox() {
  var mt = V.matchToday && !V.live, H = V.streamHist || [], mx = Math.max(10, Math.max.apply(null, H.concat([1])));
  var graph = '<svg viewBox="0 0 200 60" style="width:100%;height:60px;display:block;margin-top:6px"><line x1="0" y1="58" x2="200" y2="58" stroke="rgba(127,127,127,.3)"/>' + H.map(function (v, k) { var w = 200 / 12, h = Math.max(2, v / mx * 52); return '<rect x="' + (k * w + 2) + '" y="' + (58 - h) + '" width="' + (w - 4) + '" height="' + h + '" rx="3" fill="#ff3b3b" opacity="' + (0.5 + 0.5 * (k + 1) / H.length) + '"/>'; }).join('') + '</svg>';
  var h = '<div class="box streambox" style="margin:0"><h3 style="display:flex;align-items:center;gap:6px">' + YTLOGO + ' Livestream</h3>';
  var C = clipPick().slice(0, 1), lk = V.clipLk || [];
  if (mt) {
    var opp = V.matchToday && V.matchToday.opp ? (V.matchToday.opp.n || V.matchToday.opp) : 'den Gegner';
    h += '<div class="xs muted" style="margin-bottom:6px">Heute ist Spieltag – geh vor dem Anpfiff live!</div><div class="clipbig"><div class="clipv live' + (V.streamDone ? ' on' : '') + '">' + (V.streamDone ? '<div class="onair"><span class="dot"></span>LIVE</div><div class="lvtxt">Vorberichte vom Platz · ' + esc(opp) + '</div><div class="lvview">👁 ' + num(Math.round((V.follow || 500) * 0.04 + 30)) + ' Zuschauer</div>' : '<button class="golive" onclick="goLive(event)"><span class="dot"></span> LIVE gehen</button>') + '</div></div>';
  } else {
    h += '<div class="xs muted" style="margin-bottom:6px">Heute kein Spiel – Clip des Tages aus der Community:</div>' + C.map(function (i) { var c = CLIPS[i], liked = lk.indexOf(i) >= 0; return '<div class="clipbig"><div class="clipv" id="clip' + i + '" onclick="clipPlay(' + i + ')"><span class="play">▶</span></div><div class="row sp" style="gap:8px;margin-top:6px"><div style="min-width:0;flex:1"><b class="small" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(c[1]) + '</b><span class="xs muted">@' + esc(c[0]) + '</span></div><button class="thumb' + (liked ? ' on' : '') + '" ' + (liked ? 'disabled' : '') + ' onclick="thumbLike(this,' + i + ')" title="Gefällt mir"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M2 21h4V9H2v12zm20-11c0-1.1-.9-2-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6C6.2 8 6 8.5 6 9v10c0 1.1.9 2 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2z"/></svg><span>' + (liked ? 'Geliked' : 'Like') + '</span></button></div></div>'; }).join('');
  }
  var tw = (V.social || []).filter(function (x) { return x.k === 'twitch'; })[0]; if (tw) h += '<div class="xs" style="margin-top:10px;font-weight:700">💜 Die Fans wünschen sich diese Woche einen Twitch-Livestream</div><button class="adbtn" style="margin-top:6px;background:linear-gradient(90deg,#9146ff,#6a2fd6)" ' + (V.socDone ? 'disabled' : '') + ' onclick="socialDo(\'twitch\',event)">🟣 ' + (V.socDone ? 'Content diese Woche erledigt' : esc(tw.n) + ' starten') + '</button>';
  var sum = V.streamFol || H.reduce(function (a, b) { return a + b; }, 0), best = H.length ? Math.max.apply(null, H) : 0, avg = H.length ? Math.round(H.reduce(function (a, b) { return a + b; }, 0) / H.length) : 0;
  var tile = function (ic, l, v) { return '<div class="sttile"><span>' + ic + '</span><b>' + v + '</b><small>' + l + '</small></div>'; };
  h += '<div class="sttiles">' + tile('🎥', 'Streams', num(V.streams || 0)) + tile('👥', 'Follower', '+' + num(sum)) + tile('🏆', 'Rekord', '+' + num(best)) + tile('📊', 'Ø', '+' + num(avg)) + '</div>';
  return h + '</div>';
}
function goLive(ev) {
  var x = ev ? ev.pageX : LASTX, y = ev ? ev.pageY : LASTY, before = V.follow;
  act('stream', {}, { quiet: true, norender: true }).then(function (r) {
    if (!r) return; var g = V.follow - before; renderTab();
    toast(g > 0 ? 'Du bist live! +' + num(g) + ' Follower' : (r.info || 'Du bist live!'), false, '🔴 Livestream');
    if (g > 0) setTimeout(function () { flyFollowers(x, y, before, g); }, 120);
  });
}
function thumbLike(b, i) { b.classList.add('pop'); for (var k = 0; k < 8; k++) { var p = document.createElement('i'); p.className = 'tpart'; p.style.setProperty('--a', (k * 45) + 'deg'); b.appendChild(p); } try { SND.click(); } catch (e) {} setTimeout(function () { act('clipLike', { i: i }, { quiet: false }); }, 550); }
function feedBox() {
  var igLogo = '<svg width="18" height="18" viewBox="0 0 24 24"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f9ce34"/><stop offset=".5" stop-color="#ee2a7b"/><stop offset="1" stop-color="#6228d7"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="url(#igg)" stroke-width="2.2"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="url(#igg)" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.4" fill="url(#igg)"/></svg>';
  var sp = (V.sponsorsAll || []).filter(function (s) { return s.slot === 'social'; })[0];
  return reachBox() + '<div class="grid g2 feedrow" style="gap:14px;margin-bottom:14px;align-items:start"><div class="box igbox" style="margin:0"><h3>' + igLogo + ' Instagram' + (sp ? '<span class="xs muted" style="margin-left:auto;text-transform:none;letter-spacing:0">präsentiert von ' + esc(sp.firm) + '</span>' : '') + '</h3><div id="igbox">' + igPost() + '</div></div>' + streamBox() + '</div>';
}
function topBox() {
  var seg = ST.topSeg, T = V.top[seg] || [];
  var val = function (p) { return seg === 'lt' ? '<span class="grd ' + gradeCls(p.avg) + '">' + gtx(p.avg) + '</span>' : seg === 'tore' ? p.g + ' ' + (p.g === 1 ? 'Tor' : 'Tore') : p.a + ' ' + (p.a === 1 ? 'Vorlage' : 'Vorlagen'); };
  return '<div class="box"><h3>Top-Spieler</h3><div class="seg" style="margin-bottom:6px">' + [['lt', 'Leistungsträger'], ['tore', '⚽ Torschützen'], ['vorl', '👟 Vorlagengeber']].map(function (x) { return '<button class="sm ' + (seg === x[0] ? 'on' : '') + '" onclick="ST.topSeg=\'' + x[0] + '\';renderTab()">' + x[1] + '</button>'; }).join('') + '</div>' +
    (T.length ? T.map(function (p, i) { return '<div class="row sp" style="padding:7px 0;border-top:1px solid var(--linie);cursor:pointer" onclick="playerPop(' + p.id + ')"><div class="row"><span class="medal" style="width:22px">' + ['🥇', '🥈', '🥉'][i] + '</span><span class="pb ' + p.pos + '">' + p.pos + '</span><b class="small">' + esc(p.n) + '</b></div><b>' + val(p) + '</b></div>'; }).join('') : '<div class="muted small">Nach den ersten Pflichtspielen geht es hier los.</div>') + '</div>';
}
function outBox() {
  var O = V.out, rows = [];
  O.inj.forEach(function (p) { rows.push([p, '🚑', 'verletzt · noch ' + p.inj + ' Tage']); });
  O.ban.forEach(function (p) { rows.push([p, '🟥', 'gesperrt · ' + p.ban + ' Spiel' + (p.ban > 1 ? 'e' : '')]); });
  O.loanOut.forEach(function (p) { rows.push([p, '↗️', 'verliehen an ' + p.loan.to]); });
  O.loanIn.forEach(function (p) { rows.push([p, '↙️', 'ausgeliehen von ' + p.loan.from]); });
  return '<div class="box"><h3>Ausfälle & Leihspieler</h3>' + (rows.length ? rows.map(function (r) { return '<div class="row sp" style="padding:6px 0;border-top:1px solid var(--linie);cursor:pointer" onclick="playerPop(' + r[0].id + ')"><div class="row"><span class="pb ' + r[0].pos + '">' + r[0].pos + '</span><b class="small">' + esc(r[0].n) + '</b></div><span class="xs muted">' + r[1] + ' ' + esc(r[2]) + '</span></div>'; }).join('') : '<div class="muted small">Alle an Bord – keine Verletzten, Gesperrten oder Leihspieler.</div>') + '</div>';
}
function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
function postSVG(kind, seed) {
  var r = rng(seed * 7 + 3), o = '';
  var tod = r(); var skies = tod < 0.25 ? ['#0b1424', '#22345a'] : tod < 0.45 ? ['#f7a348', '#b9446a'] : tod < 0.7 ? ['#5aa2e0', '#cfe7fa'] : ['#87b8e8', '#e8f2fb'];
  if (kind === 'flutlicht') skies = ['#0b1424', '#1d2b4a']; if (kind === 'sonnenuntergang') skies = ['#f7a348', '#b9446a'];
  var id = 'sk' + seed;
  o += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + skies[0] + '"/><stop offset="1" stop-color="' + skies[1] + '"/></linearGradient></defs><rect width="400" height="250" fill="url(#' + id + ')"/>';
  if (tod < 0.25 || kind === 'flutlicht') for (var s0 = 0; s0 < 25; s0++) o += '<circle cx="' + r() * 400 + '" cy="' + r() * 100 + '" r="' + (0.6 + r()) + '" fill="#fff" opacity=".7"/>';
  else for (var cl = 0; cl < 3; cl++) { var cx0 = r() * 400, cy0 = 20 + r() * 60; o += '<g opacity=".8" fill="#fff"><ellipse cx="' + cx0 + '" cy="' + cy0 + '" rx="' + (26 + r() * 20) + '" ry="10"/><ellipse cx="' + (cx0 + 18) + '" cy="' + (cy0 - 6) + '" rx="18" ry="9"/></g>'; }
  var gA = ['#3f8a32', '#47963a'], gr = function (y) { var g = '<rect y="' + y + '" width="400" height="' + (250 - y) + '" fill="' + gA[0] + '"/>'; for (var i = 0; i < 8; i++) g += '<rect x="' + i * 50 + '" y="' + y + '" width="25" height="' + (250 - y) + '" fill="' + gA[1] + '"/>'; return g; };
  var crowd = function (y0, rows, w) { var c = ''; for (var row = 0; row < rows; row++) for (var k = 0; k < 400 / w; k++) { var x = k * w + (row % 2) * w / 2 + r() * 4, y = y0 + row * (w * 1.05); c += '<circle cx="' + x + '" cy="' + y + '" r="' + w * 0.34 + '" fill="' + ['#f1c6a6', '#c98d63', '#8a5a3c', '#e8b48a'][Math.floor(r() * 4)] + '"/><rect x="' + (x - w * 0.43) + '" y="' + (y + w * 0.3) + '" width="' + w * 0.86 + '" height="' + w * 0.7 + '" rx="' + w * 0.25 + '" fill="' + (r() < .6 ? '#8fc852' : r() < .5 ? '#f2f2f2' : '#2f6a2a') + '"/>'; if (r() < 0.12) c += '<rect x="' + (x + 6) + '" y="' + (y - w) + '" width="3" height="' + w + '" fill="#ddd"/><rect x="' + (x + 9) + '" y="' + (y - w) + '" width="' + w * 0.9 + '" height="' + w * 0.6 + '" fill="#8fc852"/>'; } return c; };
  if (kind === 'stadion' || kind === 'flutlicht') {
    var sy = 120 + Math.floor(r() * 30);
    o += gr(sy + 50) + '<polygon points="20,' + (sy + 50) + ' 380,' + (sy + 50) + ' 400,250 0,250" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><line x1="200" y1="' + (sy + 50) + '" x2="200" y2="250" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>';
    o += '<rect x="20" y="' + sy + '" width="360" height="50" fill="#2b332b"/><rect x="20" y="' + (sy - 8) + '" width="360" height="10" fill="#8fc852"/>' + crowd(sy + 8, 3, 13);
    if (kind === 'flutlicht') [40, 360].forEach(function (x) { o += '<rect x="' + (x - 2) + '" y="30" width="4" height="' + (sy - 30) + '" fill="#999"/><rect x="' + (x - 14) + '" y="22" width="28" height="12" rx="2" fill="#fff8d8"/><circle cx="' + x + '" cy="28" r="50" fill="#fff6c8" opacity=".16"/>'; });
  } else if (kind === 'fans' || kind === 'schal') {
    o += '<rect width="400" height="250" fill="#24301f"/>' + crowd(40 + r() * 20, 7, 22 + Math.floor(r() * 10));
    if (kind === 'schal') { var rot = -18 + r() * 14; o += '<g transform="rotate(' + rot + ' 200 120)">'; for (var k = 0; k < 10; k++) o += '<rect x="' + (10 + k * 38) + '" y="98" width="38" height="44" fill="' + (k % 2 ? '#ffffff' : '#8fc852') + '"/>'; o += '<text x="200" y="128" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="' + (((S && S.club) || '').length > 18 ? 15 : 22) + '" fill="#14200c">' + esc(((S && S.club) || 'SV Wachtberg').toUpperCase()) + '</text></g>'; }
  } else if (kind === 'ball' || kind === 'kunstrasen' || kind === 'training') {
    o += gr(kind === 'kunstrasen' ? 60 : 130 + r() * 20);
    if (kind === 'kunstrasen') for (var gl = 0; gl < 260; gl++) { var gx = r() * 400, gy = 60 + r() * 190; o += '<line x1="' + gx + '" y1="' + gy + '" x2="' + (gx + r() * 4 - 2) + '" y2="' + (gy - 6) + '" stroke="#6dc25a" stroke-width="1.2" opacity=".7"/>'; }
    if (kind === 'ball' || kind === 'kunstrasen') { var bx = 90 + r() * 220, br = 30 + r() * 22; o += '<ellipse cx="' + bx + '" cy="' + (190 + br) + '" rx="' + br + '" ry="6" fill="#000" opacity=".25"/><circle cx="' + bx + '" cy="190" r="' + br + '" fill="#fff"/><polygon points="' + bx + ',' + (190 - br * .4) + ' ' + (bx + br * .38) + ',' + (190 - br * .12) + ' ' + (bx + br * .24) + ',' + (190 + br * .32) + ' ' + (bx - br * .24) + ',' + (190 + br * .32) + ' ' + (bx - br * .38) + ',' + (190 - br * .12) + '" fill="#222"/>'; }
    if (kind === 'training') { for (var cn = 0; cn < 7; cn++) { var cx = 30 + cn * 56; o += '<polygon points="' + cx + ',195 ' + (cx - 9) + ',214 ' + (cx + 9) + ',214" fill="#f08a2e"/>'; } for (var pf = 0; pf < 5; pf++) { var px = 50 + pf * 75 + r() * 20, py = 140 + r() * 20; o += '<circle cx="' + px + '" cy="' + py + '" r="9" fill="' + ['#e8b48a', '#c98d63', '#8a5a3c'][pf % 3] + '"/><rect x="' + (px - 9) + '" y="' + (py + 10) + '" width="18" height="26" rx="6" fill="' + (pf % 2 ? '#8fc852' : '#f2f2f2') + '"/><rect x="' + (px - 8) + '" y="' + (py + 36) + '" width="6" height="18" fill="#222"/><rect x="' + (px + 2) + '" y="' + (py + 36) + '" width="6" height="18" fill="#222"/>'; } }
  } else if (kind === 'sonnenuntergang' || kind === 'drachenfels') {
    if (kind === 'sonnenuntergang') o += '<circle cx="' + (100 + r() * 200) + '" cy="150" r="44" fill="#ffd86b" opacity=".95"/>';
    o += '<path d="M0 170 Q 70 ' + (100 + r() * 30) + ' 140 150 T 280 130 T 400 150 L400 250 L0 250 Z" fill="' + (kind === 'drachenfels' ? '#3d7a3a' : '#5a2e4a') + '"/>';
    if (kind === 'drachenfels') o += '<path d="M240 140 L250 98 L262 98 L262 88 L270 88 L270 98 L282 98 L290 140 Z" fill="#6b5a4a"/><path d="M0 195 Q 120 160 240 190 T 400 185 L400 250 L0 250 Z" fill="#2f6a2a"/>';
    else o += '<path d="M0 205 Q 100 175 200 200 T 400 195 L400 250 L0 250 Z" fill="#2c1c2c"/>';
  } else {
    o += gr(150) + '<rect x="90" y="120" width="220" height="16" rx="3" fill="#555"/>';
    for (var bw = 0; bw < 4; bw++) o += '<rect x="' + (110 + bw * 48) + '" y="104" width="38" height="16" rx="8" fill="#b4643a"/>';
    for (var sm = 0; sm < 5; sm++) o += '<path d="M' + (120 + sm * 40) + ' 100 q -8 -15 0 -30 q 8 -15 0 -30" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>';
  }
  return '<svg class="img" viewBox="0 20 400 210" preserveAspectRatio="xMidYMid slice">' + o + '</svg>';
}

/* ===================================================================== Kader */
var SUBJ_KW = [[/vertrag|verläng/i, 'Vertrag'], [/verletz|knie|zwickt|muskel|physio/i, 'Verletzung'], [/gesperrt|sperre|rote karte/i, 'Sperre'], [/hochzeit/i, 'Hochzeit'], [/kind|baby|geburt/i, 'Nachwuchs'], [/pause|platt|urlaub|auszeit/i, 'Auszeit'], [/trikot/i, 'Trikots'], [/\bbälle|\bball\b|ballpartner/i, 'Bälle'], [/sponsor|werb|partner/i, 'Sponsoring'], [/leih/i, 'Leihe'], [/transfer|wechsel|angebot|ablöse/i, 'Transfer'], [/\bfans?\b|fanclub|zuschauer|ultra/i, 'Fans'], [/rasen|platz(wart|pflege)|flutlicht/i, 'Platz'], [/presse|zeitung|interview|reporter|radio/i, 'Presse'], [/jugend|talent|academy|u19|u17/i, 'Jugend'], [/training|einheit|lizenz/i, 'Training'], [/bus|fahrt|anreise/i, 'Fahrt'], [/feier|party|grill|fest/i, 'Feier'], [/vorstand|präsident|sitzung/i, 'Vorstand'], [/spende|geld|budget|kosten|rechnung|€/i, 'Finanzen'], [/bürgermeister|gemeinde|rathaus/i, 'Gemeinde'], [/schiri|schiedsrichter/i, 'Schiedsrichter'], [/job|arbeit|schicht/i, 'Job & Fußball']];
var MARKC = { eroeffnung: '#e8457a', fan: '#ff8a00', kids: '#22c55e', sponsor: '#3b82f6', gala: '#c026d3', foerder: '#eab308', weihnacht: '#dc2626', abschluss: '#14b8a6', halle: '#8b5cf6', camp3: '#3b82f6', camp5: '#3b82f6', test: '#64748b' };
function townOf(n) { var w = String(n || '').replace(/\b(19|20)\d{2}\b/g, '').replace(/\b(I{1,3}|[0-9]+\.)\b/g, ' ').split(/[\s\/-]+/).filter(function (x) { return x && !/^(SV|FC|SC|TuS|TuRa|TSV|SSV|VfL|VfB|VfR|DJK|SG|SpVg|SpVgg|FV|SF|BSV|ESV|PSV|TSG|TV|TB|SpG|JSG|FSV|SuS|Sportfreunde|Sportverein|Fortuna|Germania|Borussia|Viktoria|Alemannia|Eintracht|Rot-Weiß|Rot|Weiß|Blau|Schwarz|Grün|Union|Concordia|Teutonia|Olympia|Preußen|Rhenania|Hertha|Arminia|Kickers|Marokkanischer|Türkischer|Türk|Spor|Gücü|Club|Ballspielverein|Rheinsüd|Köln-?|e\.V\.|eV|1)$/i.test(x); }); return w.length ? w.slice(-1)[0] : n; }
var SUBJ_STOP = /^(Coach|Trainer|Hallo|Hi|Moin|Servus|Lieber|Liebe|Sehr|Herr|Frau|Chef|Boss|Mister|Leute|Team|Jungs|Darf|Kann|Können|Könnten|Wir|Ich|Du|Sie|Das|Der|Die|Ein|Eine|Es|Was|Wie|Wann|Wo|Warum|Hast|Haben|Habe|Gibt|Würde|Würden|Wäre|Bitte|Danke|Gruß|Grüße|Viele|Kurz|Kurze|Frage|Woche|Wochen|Tag|Tage|Jahr|Jahre|Monat|Monate|Zeit|Sache|Mal|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Uhr)$/;
function shortSubj(m) {
  var sj = String(m.subj || ''), tx = String(m.text || '');
  if (sj && sj.split(/\s+/).length <= 3 && sj !== tx) return sj;
  // 1) Stichwort im Betreff
  var hit = null; SUBJ_KW.forEach(function (k) { if (!hit && k[0].test(sj)) hit = k[1]; }); if (hit) return hit;
  // 2) die markantesten Hauptwörter aus dem Text (deutsche Nomen sind großgeschrieben)
  var nouns = []; (sj + '. ' + tx).replace(/[„“"()]/g, ' ').split(/(?<=[.!?])\s+/).forEach(function (sent) {
    sent.split(/[\s,;:]+/).forEach(function (w, i) { w = w.replace(/[.!?]/g, ''); if (i === 0 || w.length < 5 || !/^[A-ZÄÖÜ][a-zäöüß-]+$/.test(w) || SUBJ_STOP.test(w) || nouns.indexOf(w) >= 0) return; nouns.push(w); });
  });
  if (nouns.length) return nouns.sort(function (a, b) { return b.length - a.length; }).slice(0, nouns[0] && nouns[0].length > 11 ? 1 : 2).join(' & ');
  // 3) Stichwort im Text
  SUBJ_KW.forEach(function (k) { if (!hit && k[0].test(tx)) hit = k[1]; }); return hit || 'Info';
}
function rotIdx(id, n, keep) { var a = []; for (var i = 0; i < n; i++) a.push(i); if (keep) return a; var x = (id * 9301 + 49297) % 233280; for (var j = n - 1; j > 0; j--) { x = (x * 9301 + 49297) % 233280; var k = Math.floor(x / 233280 * (j + 1)); var t = a[j]; a[j] = a[k]; a[k] = t; } return a; }
function optCls(id) { return ['', 'rev'][id % 2]; }
var PCARD_RX = /^(?!.*(benefiz|verletzungsgefahr|testspiel|platzsperre|platz gesperrt|verleg|verzicht|dispo|kredit|darlehen)).*(vertrag|verläng|verletz|knie|zwickt|muskel|sperre|gesperrt|rote karte|gelbsperre|abwerb|abmeld|angebot|interesse|wechsel|verlassen|ablöse|gehalt|unzufrieden|stammplatz|bank)/i;
function roleBox(pid) {
  var L = V.lineup || {}, sl = L.slots || [], k = -1; sl.forEach(function (x, i) { if (x.pid === pid) k = i; });
  var bench = (V.benchIds || []).indexOf(pid) >= 0, P = (FPOS[L.form] || FPOS['4-4-2']);
  var p = V.players.filter(function (q) { return q.id === pid; })[0] || {}, pg = p.posG || {}, pgs = Object.keys(pg).sort(function (a, b) { return pg[b] - pg[a]; }).map(function (q) { return q + ' ' + pg[q]; }).join(' · ');
  var role = k >= 0 ? '<b style="color:#3f9e48">Stammspieler</b> – spielt ' + esc(sl[k].pos || '') : bench ? '<b style="color:#d9a03f">Ersatzbank</b>' : p.inj || p.ban ? '<b style="color:#e05858">fällt aus</b>' : '<b style="color:#8a93a3">Tribüne</b>';
  var pitch = '';
  if (k >= 0) { var W = 120, H = 150; pitch = '<svg viewBox="0 0 ' + W + ' ' + (H + 10) + '" width="96" style="flex:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))"><g transform="translate(0,0)"><polygon points="14,8 106,8 120,' + H + ' 0,' + H + '" fill="#3f9e48"/><polygon points="0,' + H + ' 120,' + H + ' 120,' + (H + 7) + ' 0,' + (H + 7) + '" fill="#26652c"/><polygon points="14,8 106,8 120,' + H + ' 0,' + H + '" fill="none" stroke="#fff" stroke-opacity=".7"/><line x1="7" y1="' + (H / 2 + 4) + '" x2="113" y2="' + (H / 2 + 4) + '" stroke="#fff" stroke-opacity=".6"/>' + P.map(function (c, i) { var yy = 8 + c[1] / 100 * (H - 8), sh = (yy - 8) / (H - 8), xx = 14 - 14 * sh + c[0] / 100 * (92 + 28 * sh); return '<circle cx="' + xx.toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="' + (i === k ? 6 : 3.6) + '" fill="' + (i === k ? '#ffd34d' : 'rgba(255,255,255,.75)') + '"' + (i === k ? ' stroke="#111" stroke-width="1.2"' : '') + '/>'; }).join('') + '</g></svg>'; }
  return '<div class="row" style="gap:10px;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(127,127,127,.2)">' + pitch + '<div class="xs" style="line-height:1.5">Rolle: ' + role + (pgs ? '<br><span class="muted">Pflichtspiele je Position: ' + pgs + '</span>' : '') + '</div></div>';
}
function extCard(x) {
  if (!x) return ''; var pos = x.dp || x.pos, tal = x.tal || 1;
  return '<div style="display:flex;gap:10px;align-items:center;background:rgba(127,127,127,.12);border-radius:10px;padding:8px 10px;margin:8px 0"><span class="pb ' + pos + '">' + pos + '</span><div style="flex:1;min-width:0"><b>' + esc(x.n) + '</b> <span class="xs muted">' + x.age + ' J.' + ((x.dp2 || x.pos2) ? ' · auch ' + (x.dp2 || x.pos2) : '') + (x.club ? ' · ' + esc(x.club) : '') + '</span><div class="xs" style="margin-top:2px">' + stars(x.talLo || tal, x.talHi || tal) + (x.sal ? ' · Gehalt ' + eur(x.sal) + '/Monat' : '') + (x.fee ? ' · Ablöse ' + eur(x.fee) : '') + (x.ce ? ' · Vertrag bis 06/' + String(x.ce).slice(-2) : '') + '</div></div>' + strBox(x.str) + '</div>';
}
function abwCard(pid) {
  var p = V.players.filter(function (q) { return q.id === pid; })[0]; if (!p) return '';
  var rb = roleBox(pid), m = rb.match(/<svg[\s\S]*?<\/svg>/), L = V.lineup || {}, inXI = (L.slots || []).some(function (x) { return x.pid === pid; }), bench = (V.benchIds || []).indexOf(pid) >= 0;
  var left = m ? m[0] : '<div style="width:96px;height:110px;border-radius:12px;display:grid;place-items:center;text-align:center;background:' + (bench ? 'rgba(217,160,63,.18)' : 'rgba(138,147,163,.18)') + ';font-weight:800;font-size:13px">' + (bench ? '🪑<br>Bank' : '🏟️<br>Tribüne') + '</div>';
  var mid = '<div style="min-width:0"><div class="row" style="gap:6px"><span class="pb ' + p.pos + '">' + p.pos + '</span><b>' + esc(p.n) + '</b></div><div class="xs muted" style="margin-top:3px">' + p.age + ' J.' + (p.pos2 ? ' · auch ' + p.pos2 : '') + ' · ' + (inXI ? 'Stammspieler' : bench ? 'Ersatzbank' : 'Tribüne') + '</div><div class="xs" style="margin-top:3px">' + stars(p.talLo, p.talHi) + '</div><div class="xs muted" style="margin-top:3px">Vertrag bis 06/' + p.ce + ' · ' + eur(p.sal) + '/Monat<br>Marktwert ' + eur(p.mw) + '</div></div>';
  var H = (p.sh || [p.str]).slice(-12); if (H.length < 2) H = [H[0], H[0]]; var mn = Math.min.apply(null, H) - 1, mx = Math.max.apply(null, H) + 1, W = 130, Hh = 46;
  var pts = H.map(function (v, i) { return (i * W / (H.length - 1)).toFixed(1) + ',' + (Hh - (v - mn) / (mx - mn) * Hh).toFixed(1); }).join(' '), up = H[H.length - 1] >= H[0];
  var right = '<div style="min-width:0"><div class="row sp" style="gap:6px">' + strBox(p.str) + '<span class="xs ' + (up ? 'pos' : 'neg') + '" style="font-weight:800">' + (up ? '▲' : '▼') + ' Entwicklung</span></div><svg viewBox="0 -3 ' + W + ' ' + (Hh + 6) + '" style="width:100%;height:50px;display:block;margin-top:4px"><polyline points="' + pts + '" fill="none" stroke="' + (up ? '#3f9e48' : '#e05858') + '" stroke-width="2.5" stroke-linejoin="round"/></svg><div class="xs muted">Fit ' + p.fit + ' · Form ' + (p.form > 0 ? '+' : '') + p.form + (p.lgp ? '<br>' + p.lgp + ' Spiele · ' + (p.g || 0) + ' T · ' + (p.a || 0) + ' V · Ø ' + gtx(p.lgr) : '') + '</div></div>';
  return '<div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:12px;align-items:center;background:rgba(127,127,127,.12);border-radius:12px;padding:10px 12px;margin:8px 0">' + left + mid + right + '</div>';
}
function pCard(pid, role) {
  var p = V.players.filter(function (q) { return q.id === pid; })[0]; if (!p) return '';
  return '<div style="display:flex;gap:10px;align-items:center;background:rgba(127,127,127,.12);border-radius:10px;padding:8px 10px;margin:8px 0"><span class="pb ' + p.pos + '">' + p.pos + '</span><div style="flex:1;min-width:0"><b>' + esc(p.n) + '</b> <span class="xs muted">' + p.age + ' J.' + (p.pos2 ? ' · auch ' + p.pos2 : '') + '</span><div class="xs" style="margin-top:2px">' + stars(p.talLo, p.talHi) + ' · Fit ' + p.fit + ' · Form ' + (p.form > 0 ? '+' : '') + p.form + (p.lgp ? ' · ' + p.lgp + ' Spiele, Ø Note ' + gtx(p.lgr) : '') + '</div><div class="xs muted">Vertrag bis 06/' + p.ce + ' · ' + eur(p.sal) + '/Monat · Marktwert ' + eur(p.mw) + '</div></div>' + strBox(p.str) + '</div>' + (role ? roleBox(pid) : '');
}
function sqList(ic, t, arr, valFn, empty) {
  return '<div class="box auto statc"><div class="xs muted" style="letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">' + ic + ' ' + t + '</div>' + (arr.length ? arr.map(function (p, i) { return '<div class="row sp" style="gap:6px;padding:5px 0;border-top:' + (i ? '1px solid var(--linie)' : '0') + ';cursor:pointer" onclick="playerPop(' + p.id + ')"><div class="row" style="gap:6px;min-width:0"><span class="xs" style="width:16px">' + ['🥇', '🥈', '🥉'][i] + '</span><span class="pb ' + p.pos + '">' + p.pos + '</span><b class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.n) + '</b></div><span class="row" style="gap:5px;white-space:nowrap">' + valFn(p) + '</span></div>'; }).join('') : '<div class="small muted">' + (empty || 'Noch keine Daten') + '</div>') + '</div>';
}
function squadStats() {
  var P = V.players.filter(function (p) { return !(p.loan && p.loan.to); });
  var best = P.filter(function (p) { return p.lgp >= 2 && p.lgr; }).sort(function (a, b) { return a.lgr - b.lgr; }).slice(0, 3);
  var sc = P.filter(function (p) { return p.g > 0; }).sort(function (a, b) { return (b.g || 0) - (a.g || 0); }).slice(0, 3), as = P.filter(function (p) { return p.a > 0; }).sort(function (a, b) { return (b.a || 0) - (a.a || 0); }).slice(0, 3);
  return '<div class="vstack">' +
    sqList('⭐', 'Bester Spieler', best, function (p) { return '<span class="gradeb ' + gradeCls(p.lgr) + '">' + gtx(p.lgr) + '</span>'; }) +
    sqList('⚽', 'Top-Torschütze', sc, function (p) { return '<b>' + p.g + '</b> <span class="xs muted">' + (p.g === 1 ? 'Tor' : 'Tore') + '</span>'; }) +
    sqList('👟', 'Top-Vorlagengeber', as, function (p) { return '<b>' + p.a + '</b> <span class="xs muted">' + (p.a === 1 ? 'Vorlage' : 'Vorlagen') + '</span>'; }) + minsTop3() + '</div>';
}
function minsTop3() {
  var P = V.players.filter(function (p) { return !(p.loan && p.loan.to) && !p.self; }), played = P.some(function (p) { return (p.mins || 0) > 0; });
  var lm = played ? P.slice().sort(function (a, b) { return (a.mins || 0) - (b.mins || 0) || b.str - a.str; }).slice(0, 3) : [];
  return sqList('⏱️', 'Wenigste Spielminuten', lm, function (p) { return strBox(p.str) + '<b>' + (p.mins || 0) + '</b><span class="xs muted">Min.</span>'; }, 'Erst nach dem ersten Spiel');
}
function gradeCls(g) { return g <= 2.0 ? 'g1' : g <= 2.8 ? 'g2' : g <= 3.6 ? 'g3' : 'g4'; }
function statusIcons(p) { return (p.inj ? '<b style="color:#ff4d4d;background:#fff;border-radius:3px;padding:0 2px">✚</b>' : '') + (p.ban ? '🟥' : '') + (p.abs ? '🏠' : '') + (!p.ban && p.yc >= 4 ? '🟨' : ''); }
function ytip(y) { var b = y.bday ? '🎂 ' + y.bday.slice(3) + '.' + y.bday.slice(0, 2) + '.' : ''; if (y.age >= 16 || !y.bday) return b || (y.age >= 16 ? 'Darf in die Erste' : ''); var t = new Date(V.date + 'T12:00:00'), nb = new Date(t.getFullYear() + '-' + y.bday + 'T12:00:00'); if (nb < t) nb.setFullYear(nb.getFullYear() + 1); var d = Math.round((nb - t) / 864e5) + (15 - y.age) * 365; return b + ' · noch ' + d + ' Tage bis zur Ersten'; }
function nmk(p) { return (ST.newShow || []).indexOf(p.id) >= 0 ? '<span class="newmk" title="Neu im Kader">' + esc(p.n) + '</span>' : esc(p.n); }
function newMarkTab() { if (ST.newTab === ST.tab) return; ST.newTab = ST.tab; ST.newShow = V.players.filter(function (p) { return p.isNew; }).map(function (p) { return p.id; }); if (ST.newShow.length && S) { S.players.forEach(function (q) { q.isNew = false; }); DIRTY = true; } }
function playerRow(p, onclick, extra, opt) {
  opt = opt || {}; var cp = !!opt.compact; var tags = [];
  if (p.self) tags.push('<span class="pill g">Spielertrainer</span>');
  if (V.captain === p.id) tags.push('<span class="pill g">©</span>');
  if (p.inj) tags.push('<span class="pill r"><b style="font-size:13px">✚</b> ' + p.inj + ' Tage</span>'); if (p.ban) tags.push('<span class="pill r">gesperrt</span>');
  if (p.loan && p.loan.to) tags.push('<span class="pill">verliehen</span>'); if (p.loan && p.loan.from && !cp) tags.push('<span class="pill y">Leihe</span>');
  if (p.tl) tags.push('<span class="pill y">Transferliste</span>'); if (p.ending && !(p.loan && p.loan.from) && !p.self && !cp) tags.push('<span class="pill r">Vertrag endet</span>');
  if (p.fp) tags.push('<span class="pill g">Förderspieler</span>'); if (p.retrain) tags.push('<span class="pill">Umschulung → ' + p.retrain.to + '</span>');
  return '<div class="pl" data-pid="' + p.id + '" ' + (opt.ctx ? 'oncontextmenu="event.preventDefault();playerPop(' + p.id + ')" title="Rechtsklick: Spielerinfo"' : 'onclick="' + (onclick || 'playerPop(' + p.id + ')') + '"') + '><span class="pb ' + p.pos + '">' + p.pos + '</span><div style="min-width:0"><div style="font-weight:700">' + nmk(p) + (p.loan && p.loan.from ? ' <span title="Leihspieler" class="loanic">🔁</span>' : '') + (cp && p.ending && !(p.loan && p.loan.from) && !p.self ? ' <span class="tip" data-tip="Vertrag läuft aus" style="font-size:12px">📄</span>' : '') + ' ' + (p.inXI ? '<span class="pill g">Startelf</span>' : '') + '</div><div class="meta">' + (opt.bench ? '<span class="wchip">' + p.age + ' J.</span>' + (p.pos2 ? '<span class="gchip">' + p.pos2 + (opt.nof2 || p.f2 == null ? '' : ' – ' + p.f2 + ' %') + '</span>' : '') + '<span class="wchip" title="Fitness">💪 ' + p.fit + '</span><span class="wchip" title="Form">' + (p.form > 0 ? '📈 +' : p.form < 0 ? '📉 ' : '➖ ') + p.form + '</span>' : '<span>' + (p.pos2 ? 'auch ' + p.pos2 + ' · ' : '') + p.age + ' J.</span>') + (opt.bench ? '' : stars(p.talLo, p.talHi) + '<span>Fit ' + p.fit + '</span><span>Form ' + (p.form > 0 ? '+' : '') + p.form + '</span><span>' + eurK(p.mw) + '</span><span>bis ' + String(p.ce).slice(2) + '</span>') + '</div>' + (tags.length || extra ? '<div class="acts">' + tags.join('') + (extra || '') + '</div>' : '') + '</div><div class="row" style="gap:4px">' + (opt.bench ? '<span class="bstars">' + stars(p.talLo, p.talHi) + '</span>' : '') + strBox(p.str) + '<span class="xs ' + (p.dS > 0 ? 'pos' : 'neg') + '" style="font-weight:800;min-width:' + (p.dS || !opt.bench ? 18 : 0) + 'px">' + (p.dS ? (p.dS > 0 ? '+' : '') + p.dS : '') + '</span>' + (opt.after || '') + '</div></div>';
}
var PORD = { TW: 0, RV: 1, LV: 2, IV: 3, DM: 4, ZM: 5, OM: 6, LM: 7, RM: 8, LA: 9, RA: 10, ST: 11 };
function tKader() {
  newMarkTab();
  var ps = V.players.slice(); var srt = ST.kSort;
  ps.sort(function (a, b) { return srt === 'str' ? b.str - a.str : srt === 'age' ? a.age - b.age : srt === 'mw' ? b.mw - a.mw : srt === 'ce' ? a.ce - b.ce : PORD[a.pos] - PORD[b.pos] || b.str - a.str; });
  var act0 = V.players.filter(function (p) { return !(p.loan && p.loan.to); });
  var sal = act0.reduce(function (a, p) { return a + p.sal; }, 0);
  var avg = act0.length ? Math.round(act0.reduce(function (a, p) { return a + p.str; }, 0) / act0.length * 10) / 10 : 0;
  var cnt = {}; act0.forEach(function (p) { cnt[p.pos] = (cnt[p.pos] || 0) + 1; });
  var hd = '<div class="kr hd"><span>Pos</span><span>Spieler</span><span title="Einsätze · Tore · Vorlagen">Sp · T · V</span><span>Talent</span><span class="hm2">Form</span><span class="hm2">Fit</span><span class="hm2">Gehalt</span><span class="hm2">Vertrag</span><span>Stärke</span><span>Entwicklung</span></div>';
  var list = '<div class="box" style="margin:0"><div class="row sp wr"><h3 style="margin:0">👥 Kader (' + V.players.length + '/30)</h3><div class="seg">' + [['pos', 'Position'], ['str', 'Stärke'], ['age', 'Alter'], ['mw', 'Marktwert'], ['ce', 'Vertrag']].map(function (x) { return '<button class="sm ' + (srt === x[0] ? 'on' : '') + '" onclick="ST.kSort=\'' + x[0] + '\';renderTab()">' + x[1] + '</button>'; }).join('') + '</div></div><div style="margin-top:8px">' + hd + ps.map(kaderRow).join('') + '</div></div>';
  var side = '<div style="display:flex;flex-direction:column;gap:14px"><div class="box" style="margin:0"><h3>📊 Übersicht</h3><div class="row sp" style="gap:6px;margin-bottom:8px"><span class="row small" style="gap:6px">Ø Stärke ' + strBox(avg) + '</span><span class="row small" style="gap:6px">Liga-Schnitt ' + strBox(V.lgAvg) + '</span></div>' + '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:6px 0">' + ['TW', 'RV', 'LV', 'IV', 'DM', 'ZM', 'OM', 'LM', 'RM', 'LA', 'ST', 'RA'].map(function (k) { return '<div class="row sp xs" style="background:var(--flaeche2);border-radius:7px;padding:4px 6px"><span class="pb ' + k + '" style="font-size:9px;padding:1px 4px">' + k + '</span><b>' + (cnt[k] || 0) + '</b></div>'; }).join('') + '</div>' +
    kv('Kaderwert', eurK(V.squadValue)) + kv('Gehälter / Monat', eur(sal)) + '</div>';
  if (V.hsPts >= 0.5) side += '<div class="box" style="margin:0"><h3>★ Halbe Sterne</h3><div class="small">Du hast noch <b style="color:#f0c24b">' + String(V.hsPts).replace('.', ',') + ' ★</b> zu verteilen.</div><button class="sm pri" style="margin-top:8px" onclick="S.starPop=S.starPop||{season:S.season,auto:[],gained:0,why:[]};V=MGR.view(S,D);starPop(false)">Jetzt verteilen</button></div>';
  if ((V.incoming || []).length) side += '<div class="box" style="margin:0"><h3>Neuzugänge zum Stichtag</h3>' + V.incoming.map(function (x) { return kv('<span class="pb ' + x.pos + '">' + x.pos + '</span> ' + esc(x.n), dFull(x.d)); }).join('') + '</div>';
  side += impBox() + posNewBox() + '</div>';
  var c1 = topBox1('lt', '⭐ Leistungsträger') + topBox1('tore', '⚽ Torschützen') + topBox1('vorl', '👟 Vorlagengeber') + injBox() + loanBox() + minsBox();
  return L4(c1, list, side);
}
function minsBox() {
  var L = V.players.filter(function (p) { return !(p.loan && p.loan.to) && !p.self; }); if (!L.some(function (p) { return (p.mins || 0) > 0; })) return ''; L = L.sort(function (a, b) { return (a.mins || 0) - (b.mins || 0); }).slice(0, 3);
  return '<div class="box sm1"><h3>⏱️ Wenigste Spielminuten</h3>' + L.map(function (p) { return plRow1(p, '', '<span class="row" style="gap:5px">' + strBox(p.str) + (p.mins || 0) + ' Min.</span>'); }).join('') + '</div>';
}
function impBox() {
  var L = V.players.filter(function (p) { return p.dStr > 0; }).sort(function (a, b) { return b.dStr - a.dStr; }).slice(0, 5);
  return '<div class="box" style="margin:0"><h3>📈 Verbessert</h3>' + (L.length ? L.map(function (p, i) { return '<div class="row sp" style="padding:6px 0;border-top:1px solid var(--linie);cursor:pointer;gap:6px" onclick="playerPop(' + p.id + ')"><div class="row" style="min-width:0;gap:6px"><span style="width:16px" class="xs muted">' + (i + 1) + '.</span><span class="pb ' + p.pos + '">' + p.pos + '</span><b class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.n) + '</b></div><span class="row" style="gap:5px">' + strBox(p.str) + '<b class="xs pos">+' + p.dStr + '</b></span></div>'; }).join('') : '<div class="muted xs">Noch hat sich niemand verbessert – Training wirkt mit der Zeit.</div>') + '</div>';
}
function posNewBox() {
  var L = []; V.players.forEach(function (p) { if (p.pos3 && p.f3 != null && p.f3 < 100) L.push([p, p.pos3, p.f3, '#4fa3e0', 'Wunsch']); else if (p.pos2 && p.f2 != null && p.f2 < 100) L.push([p, p.pos2, p.f2, '#e6c02e', 'Neben']); });
  L.sort(function (a, b) { return b[2] - a[2]; }); L = L.slice(0, 5);
  return '<div class="box" style="margin:0"><h3>🔄 Neue Positionen</h3>' + (L.length ? L.map(function (x) { return '<div style="padding:6px 0;border-top:1px solid var(--linie);cursor:pointer" onclick="playerPop(' + x[0].id + ')"><div class="row sp xs" style="gap:6px"><span class="row" style="gap:5px;min-width:0"><span class="pb ' + x[0].pos + '">' + x[0].pos + '</span><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x[0].n) + '</b></span><span class="muted">→ <span class="pb ' + x[1] + '">' + x[1] + '</span> ' + x[4] + '</span></div><div class="psbar"><i style="width:' + x[2] + '%;background:' + x[3] + '"></i></div><div class="xs" style="text-align:right;color:' + x[3] + ';font-weight:800">' + x[2] + ' %</div></div>'; }).join('') : '<div class="muted xs">Keine Positionsumschulung läuft. In der Spielerinfo kannst du eine Wunschposition anlegen.</div>') + '</div>';
}
function fcol(v, lo, hi) { return v >= hi ? 'var(--g)' : v >= lo ? 'var(--y)' : 'var(--r)'; }
function kaderRow(p) {
  var ic = '';
  if (p.ban) ic += '<span class="tip" data-tip="gesperrt">🟥</span>'; if (p.inXI) ic += '<span class="tip" data-tip="Stammspieler – steht in der Startelf"><svg width="15" height="11" viewBox="0 0 30 22" style="vertical-align:-1px"><rect width="30" height="22" rx="3" fill="#3f8a32"/><g fill="none" stroke="#fff" stroke-width="1.5"><rect x="1.5" y="1.5" width="27" height="19" rx="2"/><path d="M15 1.5v19"/><circle cx="15" cy="11" r="4"/></g></svg></span>';
  if (p.inj) ic += '<span class="tip" data-tip="verletzt (' + p.inj + ' T)">🚑</span>'; if (p.ending && !(p.loan && p.loan.from) && !p.self) ic += '<span class="tip" data-tip="Vertrag läuft aus – bald verlängern!">📄</span>'; if (p.leaving) ic += '<span class="pill r" style="font-size:9px" title="wechselt zum ' + dFull(p.leaving.d) + '">geht ' + dFull(p.leaving.d).slice(0, 6) + '</span>';
  if (V.captain === p.id) ic += '<span class="tip" data-tip="Kapitän" style="font-weight:800;color:var(--g)">©</span>'; if (p.self) ic += '<span class="pill g" style="font-size:9px">Spielertrainer</span>';
  if (p.loan && p.loan.to) ic += '<span class="pill" style="font-size:9px">verliehen</span>'; if (p.loan && p.loan.from) ic += '<span class="pill y" style="font-size:9px">Leihe</span>'; if (p.tl) ic += '<span class="pill y" style="font-size:9px">TL</span>';
  var dS = p.dStr ? '<span class="xs ' + (p.dStr > 0 ? 'pos' : 'neg') + '" style="font-weight:800">' + (p.dStr > 0 ? '+' : '') + p.dStr + '</span>' : '';
  return '<div class="kr" onclick="playerPop(' + p.id + ')"><span class="pb ' + p.pos + '">' + p.pos + '</span><div style="min-width:0"><div class="row" style="gap:5px;flex-wrap:nowrap"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + nmk(p) + '</b><span class="wchip">' + p.age + ' J.</span>' + (p.pos2 ? '<span class="gchip">' + p.pos2 + (p.f2 != null ? ' – ' + p.f2 + ' %' : '') + '</span>' : '') + '<span class="st">' + ic + '</span></div></div>' +
    '<span class="xs ksv"><b>' + (p.gp || 0) + '</b> · <b>' + (p.g || 0) + '</b> · <b>' + (p.a || 0) + '</b></span><span>' + stars(p.talLo, p.talHi) + '</span><span class="mini hm2" style="background:' + (p.form > 0 ? 'var(--g)' : p.form < 0 ? 'var(--r)' : 'var(--y)') + '">' + (p.form > 0 ? '+' : '') + p.form + '</span><span class="mini hm2" style="background:' + fcol(p.fit, 60, 80) + '">' + p.fit + '</span><span class="small hm2">' + eurK(p.sal) + '</span><span class="small hm2">06/' + p.ce + '</span>' + strBox(p.str) + devBar(p.dSeas || 0) + '</div>';
}
function devBar(d) { var w = Math.max(4, Math.min(100, 50 + d * 18)), c = d > 0.05 ? '#5fbf3a' : d < -0.05 ? '#e25c5c' : '#888'; return '<span class="devb" title="Entwicklung diese Saison"><i><b style="left:' + (d >= 0 ? 50 : w) + '%;width:' + Math.abs(w - 50) + '%;background:' + c + '"></b></i><em style="color:' + c + '">' + (d > 0 ? '+' : '') + String(d).replace('.', ',') + '</em></span>'; }
function lvlName(l) { return D && DD().lv[l] ? DD().lv[l].short : ''; }
var RPROF = { TW: [['Reflexe', 6], ['Stellung', 3], ['Strafraum', 0], ['Abstoß', -4], ['Mentalität', 1], ['Ausdauer', -2]], AB: [['Tempo', -1], ['Technik', -5], ['Passen', -2], ['Abschluss', -10], ['Zweikampf', 7], ['Kopfball', 5], ['Ausdauer', 1]], MF: [['Tempo', 0], ['Technik', 4], ['Passen', 6], ['Abschluss', -2], ['Zweikampf', 0], ['Kopfball', -5], ['Ausdauer', 3]], ST: [['Tempo', 4], ['Technik', 2], ['Passen', -3], ['Abschluss', 8], ['Zweikampf', -5], ['Kopfball', 3], ['Ausdauer', -1]] };
function radarSVG(p) {
  var prof = RPROF[{ TW: 'TW', IV: 'AB', RV: 'AB', LV: 'AB', DM: 'MF', ZM: 'MF', OM: 'MF', LM: 'MF', RM: 'MF', LA: 'ST', ST: 'ST', RA: 'ST' }[p.pos] || 'MF'], r0 = rng((p.id || 1) * 7919), n = prof.length, cx = 130, cy = 112, R = 82;
  var vals = prof.map(function (a) { var v = p.str + a[1] + (r0() - 0.5) * 12; if (a[0] === 'Ausdauer') v = v * 0.6 + p.fit * 0.4; return Math.max(1, Math.min(99, Math.round(v))); });
  var pt = function (i, f) { var an = -Math.PI / 2 + i / n * Math.PI * 2; return [cx + Math.cos(an) * R * f, cy + Math.sin(an) * R * f]; };
  var mx = Math.max(60, Math.ceil((Math.max.apply(null, vals) + 5) / 10) * 10);
  var o = '<svg viewBox="0 0 260 228" style="width:100%;max-width:300px;display:block;margin:6px auto 2px">';
  [0.25, 0.5, 0.75, 1].forEach(function (f) { o += '<polygon points="' + prof.map(function (a, i) { return pt(i, f).join(','); }).join(' ') + '" fill="none" stroke="rgba(255,255,255,' + (f === 1 ? .25 : .1) + ')"/>'; });
  prof.forEach(function (a, i) { var e = pt(i, 1); o += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0] + '" y2="' + e[1] + '" stroke="rgba(255,255,255,.1)"/>'; var l = pt(i, 1.2); o += '<text x="' + l[0] + '" y="' + (l[1] + 4) + '" font-size="10" fill="#cfd6cc" text-anchor="middle" font-family="Montserrat,sans-serif">' + a[0] + ' <tspan font-weight="800" fill="#8fc852">' + vals[i] + '</tspan></text>'; });
  o += '<polygon points="' + vals.map(function (v, i) { return pt(i, v / mx).join(','); }).join(' ') + '" fill="rgba(143,200,82,.32)" stroke="#8fc852" stroke-width="2"/>';
  vals.forEach(function (v, i) { var q = pt(i, v / mx); o += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3" fill="#8fc852"/>'; });
  return o + '</svg>';
}
function posBox(p) {
  var row = function (dp, v, lbl, col) { return '<div class="psrow"><span class="pb ' + dp + '">' + dp + '</span><div style="flex:1;min-width:0"><div class="row sp xs"><b>' + esc(V.dpn[dp] || dp) + '</b><span class="muted">' + lbl + ' · <b style="color:' + col + '">' + v + ' %</b></span></div><div class="psbar"><i style="width:' + v + '%;background:' + col + '"></i></div></div></div>'; };
  var h = '<div class="box" style="margin:10px 0;padding:10px 12px"><div class="row sp"><b class="small">📍 Positionen</b>' + (p.self ? '' : '<select class="sm" style="max-width:190px" onchange="if(this.value)act(\'posWish\',{pid:' + p.id + ',dp:this.value})"><option value="">' + (p.pos3 ? '🔁 Wunschposition ändern' : '➕ Wunschposition anlegen') + '</option>' + ['TW', 'RV', 'LV', 'IV', 'DM', 'ZM', 'OM', 'LM', 'RM', 'LA', 'ST', 'RA'].filter(function (d) { return d !== p.pos && d !== p.pos2 && d !== p.pos3; }).map(function (d) { return '<option value="' + d + '">' + d + ' – ' + esc(V.dpn[d] || d) + '</option>'; }).join('') + '</select>') + '</div><div style="display:grid;gap:7px;margin-top:8px">' + row(p.pos, 100, 'Hauptposition', '#2fa84f');
  if (p.pos2) h += row(p.pos2, p.f2, 'Nebenposition', p.f2 >= 100 ? '#2fa84f' : '#e6c02e');
  if (p.pos3) h += row(p.pos3, p.f3, 'Wunschposition', '#4fa3e0');
  return h + '</div><div class="xs muted" style="margin-top:6px">Jedes Spiel bringt Neben- und Wunschposition +1–3 %. Bei 100 % kannst du sie zur Hauptposition machen.</div></div>';
}
function playerPop(id) {
  var p = V.players.filter(function (x) { return x.id === id; })[0]; if (!p) return;
  var yrs = []; for (var y = p.ce + 1; y <= +V.season.slice(0, 4) + 5; y++) yrs.push(y);
  var h = '<div class="pp3"><div class="ppa"><div class="row"><span class="pb ' + p.pos + '">' + p.pos + '</span><h2 style="margin:0">' + esc(p.n) + '</h2></div><div class="xs muted" style="margin-top:4px">' + esc(V.dpn[p.pos]) + (false ? '' : '') + '</div>' +
    '<div class="grid" style="margin:12px 0;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px"><div class="kpi" style="min-height:0"><small>Stärke</small><b>' + p.strF + '</b></div><div class="kpi" style="min-height:0"><small>Talent</small>' + stars(p.talLo, p.talHi) + (p.pot ? '<div class="xs muted">Potenzial ' + p.pot + '</div>' : '') + '</div><div class="kpi" style="min-height:0"><small>Marktwert</small><b style="font-size:14px">' + eurK(p.mw) + '</b></div></div>' +
    posBox(p) + '</div><div class="ppb">' + radarSVG(p) +
    '<div class="small" style="line-height:1.8">Alter <b>' + p.age + '</b> · Fitness <b>' + p.fit + '</b> · Form <b>' + p.form + '</b> · Niveau ≈ <b>' + esc(lvlName(p.natLvl)) + '</b><br>Saison: <b>' + p.gp + '</b> Spiele · <b>' + p.g + '</b> Tore · <b>' + p.a + '</b> Vorlagen' + (p.avg ? ' · Ø Note <b>' + gtx(p.avg) + '</b>' : '') + (p.yc ? ' · ' + p.yc + '× Gelb' : '') + '<br>Gehalt <b>' + eur(p.sal) + '</b>/Monat · Vertrag bis <b>06/' + p.ce + '</b>' + (p.inj ? '<br><span class="neg">Verletzt: noch ' + p.inj + ' Tage</span>' : '') + (p.ban ? '<br><span class="neg">Gesperrt: ' + p.ban + ' Spiel(e)</span>' : '') + (p.loan ? '<br>' + (p.loan.to ? 'Verliehen an ' + esc(p.loan.to) : 'Ausgeliehen von ' + esc(p.loan.from)) + ' bis Saisonende' : '') + (p.untouch ? '<br><span class="gelb">Unverkäuflich</span>' : '') + '</div>' +
    '<div class="hint">Gute Noten, Tore, Vorlagen, Paraden und weiße Westen lassen die Stärke steigen – schwache Spiele lassen sie sinken. Ganz selten ändert sich sogar das Talent.</div>';
  h += '</div><div class="ppc">';
  if (p.self) h += '<div class="hint">Das bist du – als Spielertrainer verlässt du den Verein nie und spielst ohne Gehalt.</div>';
  if (has('trainingsplan')) {
    h += '<div class="box" style="margin-top:12px"><h3>Individueller Trainingsplan</h3><div class="row wr" style="gap:6px"><button class="sm ' + (!p.tp ? 'pri' : '') + '" onclick="act(\'tplan\',{pid:' + p.id + ',tp:\'\'})">Mannschaft</button>' + Object.keys(V.tplans).map(function (k) { return '<button class="sm ' + (p.tp === k ? 'pri' : '') + '" onclick="act(\'tplan\',{pid:' + p.id + ',tp:\'' + k + '\'})">' + esc(V.tplans[k]) + '</button>'; }).join('') + '</div>' +
      '<label>Umschulen auf (10 Wochen)</label><div class="row wr" style="gap:6px">' + Object.keys(PORD).filter(function (x) { return x !== p.pos; }).map(function (x) { return '<button class="sm ' + (p.retrain && p.retrain.to === x ? 'pri' : '') + '" onclick="act(\'tplan\',{pid:' + p.id + ',to:\'' + x + '\'})">' + x + '</button>'; }).join('') + (p.retrain ? '<button class="sm red" onclick="act(\'tplan\',{pid:' + p.id + ',to:\'\'})">Abbrechen (' + p.retrain.w + '/10)</button>' : '') + '</div>' +
      '<div class="row wr" style="margin-top:10px"><button class="sm" onclick="act(\'foerder\',{pid:' + p.id + '})">' + (p.fp ? 'Kein Förderspieler mehr' : '⭐ Als Förderspieler') + '</button></div></div>';
  } else h += '<div class="hint">🔒 Individuelle Trainingspläne & Förderspieler ab Level ' + MGR.featLvl('trainingsplan') + '.</div>';
  if (has('kapitaen')) h += '<div class="row wr" style="margin-top:10px"><button class="sm ' + (V.captain === p.id ? 'pri' : '') + '" onclick="act(\'captain\',{pid:' + p.id + '})">© Kapitän</button><button class="sm ' + (V.pen === p.id ? 'pri' : '') + '" onclick="act(\'pen\',{pid:' + p.id + '})">⚽ Elfmeterschütze</button></div>';
  if (!(p.loan && p.loan.from) && !p.self) {
    h += '<div class="box" style="margin-top:12px"><h3>Vertrag verlängern</h3>' + (p.block ? '<div class="neg small">' + esc(p.n) + ' will nicht mehr verhandeln.</div>' :
      '<div class="grid g2" style="gap:8px"><div><label>Neuer Vertrag bis</label><select id="eu">' + yrs.map(function (y) { return '<option value="' + y + '">06/' + y + '</option>'; }).join('') + '</select></div><div><label>Gehalt pro Monat (€)</label><input id="es" type="number" value="' + p.dem + '"></div></div><div class="hint">Er stellt sich ungefähr ' + eur(p.dem) + ' vor. Nach 3 Absagen bricht er ab.</div><button class="pri" style="margin-top:10px" onclick="act(\'extend\',{pid:' + p.id + ',until:+$(\'#eu\').value,sal:+$(\'#es\').value})">Angebot machen</button>') + '</div>';
  }
  if (!p.loan && !p.self) {
    if (has('transfers')) {
      h += '<div class="box"><h3>Verkaufen' + (has('leihe') ? ' & Verleihen' : '') + '</h3>' + (V.window ? '' : '<div class="xs muted" style="margin-bottom:8px">' + esc(V.tm.txt) + '</div>') +
        '<label>Transferliste – Wunschablöse (€)</label><div class="row"><input id="ta" type="number" value="' + (p.ask || p.mw) + '"><button onclick="act(\'list\',{pid:' + p.id + ',on:' + (!p.tl) + ',ask:+$(\'#ta\').value})">' + (p.tl ? 'Runter' : 'Drauf') + '</button></div>' +
        '<div class="row wr" style="margin-top:10px"><button ' + (V.window ? '' : 'disabled') + ' onclick="act(\'sellnow\',{pid:' + p.id + '})">Sofort verkaufen (' + eurK(p.mw * 0.6) + ')</button></div>' +
        (has('leihe') ? '<label>Verleihen – Leihgebühr (€)</label><div class="row"><input id="lf" type="number" value="' + Math.round(p.mw * 0.08) + '"><button ' + (V.window ? '' : 'disabled') + ' onclick="act(\'loanout\',{pid:' + p.id + ',fee:+$(\'#lf\').value})">Verleihen</button></div>' : '<div class="hint">🔒 Leihgeschäfte ab Level ' + MGR.featLvl('leihe') + '.</div>') +
        '<div class="row wr" style="margin-top:12px"><button class="sm red" onclick="relPop(' + p.id + ')">Vertrag auflösen</button></div><div class="xs muted" style="margin-top:6px">Im Kader müssen immer mindestens 2 Torhüter und 13 Feldspieler bleiben.</div></div>';
    } else h += '<div class="hint">🔒 Verkaufen und Verträge auflösen ab Level ' + MGR.featLvl('transfers') + '.</div>';
  }
  pop(h + '</div></div>', { xwide: true });
}
function relPop(id) { var p = V.players.filter(function (x) { return x.id === id; })[0]; pop('<h2>Vertrag auflösen?</h2><div class="muted small">' + esc(p.n) + ' verlässt den Verein. Es wird eine Abfindung fällig (halbes Restgehalt).</div><div class="row" style="margin-top:14px"><button class="red" style="flex:1" onclick="act(\'release\',{pid:' + id + '})">Auflösen</button><button style="flex:1" onclick="playerPop(' + id + ')">Zurück</button></div>'); }

/* ===================================================================== Aufstellung (Drag & Drop) */
var FPOS = {
  '4-4-2': [[50, 92], [12, 70], [36, 76], [64, 76], [88, 70], [12, 44], [37, 50], [63, 50], [88, 44], [37, 18], [63, 18]],
  '4-4-2 Raute': [[50, 92], [12, 70], [36, 76], [64, 76], [88, 70], [50, 60], [28, 46], [72, 46], [50, 32], [37, 16], [63, 16]],
  '4-3-3': [[50, 92], [12, 70], [36, 76], [64, 76], [88, 70], [28, 48], [50, 58], [72, 48], [16, 22], [50, 15], [84, 22]],
  '4-2-3-1': [[50, 92], [12, 70], [36, 76], [64, 76], [88, 70], [37, 58], [63, 58], [14, 36], [50, 36], [86, 36], [50, 14]],
  '4-2-1-3': [[50, 92], [12, 70], [36, 76], [64, 76], [88, 70], [37, 60], [63, 60], [50, 40], [18, 18], [50, 12], [82, 18]],
  '4-1-4-1': [[50, 92], [12, 70], [36, 76], [64, 76], [88, 70], [50, 60], [12, 40], [37, 44], [63, 44], [88, 40], [50, 15]],
  '4-3-2-1': [[50, 92], [12, 70], [36, 76], [64, 76], [88, 70], [26, 52], [50, 58], [74, 52], [34, 32], [66, 32], [50, 14]],
  '4-5-1': [[50, 92], [12, 70], [36, 76], [64, 76], [88, 70], [10, 42], [32, 46], [50, 56], [68, 46], [90, 42], [50, 15]],
  '3-5-2': [[50, 92], [25, 75], [50, 78], [75, 75], [10, 46], [50, 58], [32, 46], [68, 46], [90, 46], [37, 18], [63, 18]],
  '3-4-3': [[50, 92], [25, 75], [50, 78], [75, 75], [12, 48], [37, 52], [63, 52], [88, 48], [16, 22], [50, 15], [84, 22]],
  '3-4-1-2': [[50, 92], [25, 75], [50, 78], [75, 75], [12, 50], [37, 54], [63, 54], [88, 50], [50, 34], [37, 16], [63, 16]],
  '5-3-2': [[50, 92], [8, 64], [28, 75], [50, 78], [72, 75], [92, 64], [28, 48], [50, 56], [72, 48], [37, 18], [63, 18]],
  '5-4-1': [[50, 92], [8, 64], [28, 75], [50, 78], [72, 75], [92, 64], [12, 42], [37, 46], [63, 46], [88, 42], [50, 15]]
};
function pitchBG() {
  var o = '<defs><filter id="grn" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6 2.4" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .05  0 0 0 0 .22  0 0 0 0 .04  0 0 0 .42 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
    '<linearGradient id="strA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2e7d2b"/><stop offset=".5" stop-color="#38913a"/><stop offset="1" stop-color="#2e7d2b"/></linearGradient>' +
    '<linearGradient id="strB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a7027"/><stop offset=".5" stop-color="#318331"/><stop offset="1" stop-color="#2a7027"/></linearGradient>' +
    '<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>' +
    '<radialGradient id="spot" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
  for (var i = 0; i < 12; i++) o += '<rect y="' + (i * 92 / 12).toFixed(2) + '" width="68" height="' + (92 / 12 + .05).toFixed(2) + '" fill="url(#' + (i % 2 ? 'strB' : 'strA') + ')"/>';
  o += '<rect width="68" height="92" filter="url(#grn)"/><rect width="68" height="92" fill="url(#spot)"/>';
  var L = 'fill="none" stroke="rgba(255,255,255,.88)" stroke-width=".42" stroke-linecap="round"';
  o += '<g ' + L + '><rect x="3" y="3" width="62" height="86" rx=".3"/><line x1="3" y1="46" x2="65" y2="46"/><circle cx="34" cy="46" r="7.3"/>' +
    '<rect x="16.5" y="3" width="35" height="13.5"/><rect x="25" y="3" width="18" height="5"/><path d="M28.2 16.5 A7.3 7.3 0 0 0 39.8 16.5"/>' +
    '<rect x="16.5" y="75.5" width="35" height="13.5"/><rect x="25" y="84" width="18" height="5"/><path d="M28.2 75.5 A7.3 7.3 0 0 1 39.8 75.5"/>' +
    '<path d="M3 4.4 A1.4 1.4 0 0 0 4.4 3"/><path d="M63.6 3 A1.4 1.4 0 0 0 65 4.4"/><path d="M3 87.6 A1.4 1.4 0 0 1 4.4 89"/><path d="M63.6 89 A1.4 1.4 0 0 1 65 87.6"/></g>' +
    '<g fill="rgba(255,255,255,.9)"><circle cx="34" cy="46" r=".7"/><circle cx="34" cy="12" r=".5"/><circle cx="34" cy="80" r=".5"/></g>' +
    '<g fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.9)" stroke-width=".35"><rect x="30.3" y="1.4" width="7.4" height="1.6" rx=".2"/><rect x="30.3" y="89" width="7.4" height="1.6" rx=".2"/></g>';
  o += '<rect width="68" height="92" fill="url(#vig)"/>';
  return '<svg class="bg" viewBox="0 0 68 92" preserveAspectRatio="none">' + o + '</svg>';
}
function tAufst() {
  newMarkTab();
  var L = V.lineup, pos = FPOS[L.form] || FPOS['4-4-2'];
  var h = '<div class="box" style="margin:0"><h3 style="margin:0">🧩 Aufstellung</h3>' +
    '<div class="pitch" id="pitch" style="margin-top:12px">' + pitchBG();
  L.slots.forEach(function (s, i) {
    var p = pos[i].slice(); if (s.pos === 'TW') p[1] -= 2; else if (/^(DM|AM|OM)$/.test(s.pos)) p[1] -= 3.5;
    var pl = V.players.filter(function (q) { return q.id === s.pid; })[0];
    if (!pl) { var ms = s.missing; h += '<div class="slot" data-slot="' + i + '" style="left:' + p[0] + '%;top:' + p[1] + '%" onclick="slotMenu(' + i + ',event)"><div class="dot" style="background:rgba(0,0,0,.45);border:2px dashed var(--r);color:#fff;font-size:12px">frei</div><div class="nm" style="background:rgba(160,30,30,.85)">' + s.pos + ' besetzen</div>' + (ms ? '<div class="xs" style="margin-top:2px;color:#fff;text-shadow:0 1px 2px #000">' + (ms.why === 'inj' ? '🚑' : ms.why === 'ban' ? '🟥' : '↗') + ' ' + esc(ms.n.split(' ').slice(-1)[0]) + '</div>' : '') + '</div>'; return; }
    var sc = strCls(s.r); var bg = sc === 'g' ? 'var(--g)' : sc === 'y' ? 'var(--y)' : 'var(--r)'; var w = s.fitPct < 90 ? ' warn' : '';
    var dS = pl.dS ? '<span style="position:absolute;right:-8px;top:-6px;background:' + (pl.dS > 0 ? 'var(--g)' : 'var(--r)') + ';color:#fff;border-radius:999px;font-size:9px;font-weight:800;padding:1px 4px">' + (pl.dS > 0 ? '+' : '') + pl.dS + '</span>' : '';
    var stIc = statusIcons(pl);
    var jc = sc === 'g' ? '#8fc852' : sc === 'y' ? '#ffd34d' : '#ff6b6b';
    h += '<div class="slot" data-slot="' + i + '" style="left:' + p[0] + '%;top:' + p[1] + '%" oncontextmenu="event.preventDefault();slotMenu(' + i + ',event)" title="Rechtsklick: Menü & Spielerinfo"><div class="jers' + w + '"><svg viewBox="0 0 60 56" width="50" height="47"><path d="M18 3 L8 7 L1 19 L10 25 L13 21 L13 54 L47 54 L47 21 L50 25 L59 19 L52 7 L42 3 Q30 11 18 3 Z" fill="#141414" stroke="#3c3c3c" stroke-width="1.6" stroke-linejoin="round"/><path d="M22 4 Q30 10 38 4" stroke="#3c3c3c" stroke-width="2" fill="none"/><text x="30" y="39" text-anchor="middle" font-size="' + (s.pos.length > 2 ? 13 : 16) + '" font-weight="900" fill="#fff" font-family="Montserrat,sans-serif">' + s.pos + '</text></svg><span class="jstr" style="background:' + jc + '">' + Math.round(s.r) + '</span>' + dS + (stIc ? '<span style="position:absolute;left:-8px;top:-4px;font-size:13px">' + stIc + '</span>' : '') + '</div><div class="nm">' + ((ST.newShow || []).indexOf(s.pid) >= 0 ? '<span class="newmk">' + esc(s.n ? s.n.split(' ').slice(-1)[0] : '—') + '</span>' : esc(s.n ? s.n.split(' ').slice(-1)[0] : '—')) + (s.pid && s.pid === V.captain ? ' ©' : '') + '</div>' +
      '<div class="xichips"><span class="wchip" title="Alter">' + pl.age + ' J.</span><span class="wchip" title="Fitness">💪 ' + pl.fit + '</span><span class="wchip" title="Form">' + (pl.form > 0 ? '📈 +' : pl.form < 0 ? '📉 ' : '➖ ') + Math.round(pl.form) + '</span></div><div class="xistars">' + stars(pl.talLo, pl.talHi).replace('class="stars"', 'class="stars xs5"') + '</div></div>';
  });
  h += '</div>' + (L.slots.some(function (s) { return s.unavail; }) ? '<div class="warnbox">In deiner Startelf ist ein Platz frei – ein Spieler ist verletzt oder gesperrt. Tippe auf „frei“ und wähle einen Ersatz.</div>' : '');
  var xiP = L.slots.map(function (s) { return V.players.filter(function (q) { return q.id === s.pid; })[0]; }).filter(Boolean);
  var task = function (t, k, act0, cur) { return '<div><label>' + t + '</label><select class="sel" style="width:100%" onchange="act(\'' + act0 + '\',{pid:+this.value},{quiet:true})"><option value="">–</option>' + xiP.map(function (p) { return '<option value="' + p.id + '" ' + (p.id === cur ? 'selected' : '') + '>' + esc(p.n) + ' (' + p.pos + ')</option>'; }).join('') + '</select></div>'; };
  var MID = h + '</div>'; h = '';
  var AUFG = '<div class="box"><h3>📋 Aufgaben</h3>' + (has('kapitaen') ? '<div class="vstack" style="gap:8px">' + task('© Kapitän', 'c', 'captain', V.captain) + task('🎯 Elfmeterschütze', 'p', 'pen', V.pen) + task('🥅 Freistoßschütze', 'f', 'fk', V.fk) + task('🚩 Ecken', 'e', 'ck', V.ck) + '</div>' : '<div class="hint">🔒 Kapitän, Elfmeter-, Freistoß- und Eckenschützen festlegen: ab Manager-Level ' + MGR.featLvl('kapitaen') + '.</div>') + '</div>';
  var C1 = '<div class="vstack c1st">' + teamStrBox() + squadStats() + '</div>'; MID = formBox(L) + MID; h = '';
  var stl = { '4-4-2': 'Ausgewogen', '4-4-2 Raute': 'Zentrumsstark', '4-3-3': 'Offensiv über die Flügel', '4-2-3-1': 'Kontrolliert', '4-2-1-3': 'Doppel-Sechs, Zehner, drei Spitzen', '4-1-4-1': 'Sicher, wenig Risiko', '4-3-2-1': 'Tannenbaum – kompakt', '4-5-1': 'Defensiv, Konter', '3-5-2': 'Mittelfeld-Power', '3-4-3': 'Sehr offensiv', '3-4-1-2': 'Offensiv mit Zehner', '5-3-2': 'Defensiv – wenige Gegentore', '5-4-1': 'Bollwerk' };
  var notOut = function (p) { return !p.inj && !p.ban && !p.abs && !(p.loan && p.loan.to); };
  var BORD = { TW: 0, RV: 1, LV: 2, IV: 3, DM: 4, ZM: 5, OM: 6, LM: 7, RM: 8, LA: 9, RA: 10, ST: 11 }; var bIds = V.benchIds || [], bench = bIds.map(function (id) { return V.players.filter(function (q) { return q.id === id; })[0]; }).filter(Boolean); bench.sort(function (a, b) { return (BORD[a.pos] != null ? BORD[a.pos] : 9) - (BORD[b.pos] != null ? BORD[b.pos] : 9) || b.str - a.str; });
  var TO = V.tribOrd || [], toi = function (p) { var k = TO.indexOf(p.id); return k < 0 ? 999 : k; }; var trib = V.players.filter(function (p) { return !p.inXI && notOut(p) && bIds.indexOf(p.id) < 0; }).sort(function (a, b) { return PORD[a.pos] - PORD[b.pos] || b.str - a.str; });
  h += '<div class="box dropzone" data-z="bench"><div class="row sp"><h3 style="margin:0">🪑 Ersatzbank (' + bench.length + '/9)</h3>' + (V.benchSet ? '<button class="sm" onclick="benchSet(null)">Auto</button>' : '<span class="xs muted">automatisch</span>') + '</div><div style="height:8px"></div><div class="plist">' + bench.map(function (p) { return playerRow(p, null, null, { compact: true, ctx: true, bench: true, after: '<button class="icb" title="Auf die Tribüne" onclick="event.stopPropagation();benchMove(' + p.id + ',0)">⬇</button>' }); }).join('') + Array(Math.max(0, 9 - bench.length) + 1).join('<div class="benchfree">freier Bankplatz</div>') + '</div></div>';
  var B3 = h; h = '';
  h +=
    '<div class="box dropzone bt" data-z="trib"><h3>🏟️ Tribüne</h3><div class="plist tcomp">' + (trib.length ? trib.map(function (p) { return playerRow(p, null, null, { compact: true, ctx: true, bench: true, after: '<button class="icb" title="Auf die Bank" ' + (bench.length >= 9 ? 'disabled' : '') + ' onclick="event.stopPropagation();benchMove(' + p.id + ',1)">⬆</button>' }); }).join('') : '<div class="small muted">Niemand auf der Tribüne.</div>') + '</div></div>';
  var out = V.players.filter(function (p) { return !notOut(p); }).sort(function (a, b) { return PORD[a.pos] - PORD[b.pos] || b.str - a.str; });
  var injRow = function (p) {
    var ic = p.inj ? '🚑' : p.ban ? '🟥' : p.abs ? '🏠' : '↗', dur = p.inj ? p.inj + ' Tag' + (p.inj === 1 ? '' : 'e') : p.ban ? p.ban + ' Spiel' + (p.ban > 1 ? 'e' : '') : p.abs ? 'nächstes Spiel' : 'verliehen';
    var what = p.inj ? esc(p.injN || 'Verletzung') : p.ban ? (p.banWhy ? esc(p.banWhy) : 'Sperre') : p.abs ? 'Privat verhindert' : 'Leihe';
    var doc = p.inj ? (p.inj >= 10 ? '<button class="injc doc" ' + (p.docOk ? '' : 'disabled') + ' onclick="event.stopPropagation();act(\'injDoc\',{pid:' + p.id + '})" title="Spezialist: kostet Geld, verkürzt die Ausfallzeit etwas (alle 2 Wochen möglich)"><small>Arzt</small><b>🩺 ' + (p.docOk ? eurK(p.docCost) : 'in ' + p.docIn + ' T') + '</b></button>' : '<div class="injc"><small>Arzt</small><b class="muted">nicht nötig</b></div>') : '';
    return '<div class="injrow" oncontextmenu="event.preventDefault();playerPop(' + p.id + ')"><div class="row" style="gap:6px"><span class="pb ' + p.pos + '">' + p.pos + '</span><b class="small" style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + nmk(p) + '</b><span style="font-size:15px">' + ic + '</span></div><div class="injgrid"><div class="injc"><small>Dauer</small><b>' + dur + '</b></div><div class="injc"><small>' + (p.inj ? 'Verletzung' : 'Grund') + '</small><b>' + what + '</b></div>' + doc + '</div></div>';
  };
  h += '<div class="box outbox"><h3><b style="color:#ff4d4d">✚</b> Sperren & Verletzungen</h3>' + (out.length ? out.map(injRow).join('') : '<div class="small muted">Alle Spieler sind einsatzbereit.</div>') + '</div>' + AUFG;
  return '<div id="dragsrc">' + L4(C1, S2(MID, B3), h) + '</div>';
}
function teamStrBox() {
  var H = (V.strHist || []).slice(-12), cur = V.xiAvg, svg = '';
  if (H.length >= 2) { var lo = Math.min.apply(null, H) - 0.5, hi = Math.max.apply(null, H) + 0.5, w = 220, ht = 54, pts = H.map(function (v, i) { return [i / (H.length - 1) * w, ht - (v - lo) / (hi - lo) * ht]; });
    svg = '<svg viewBox="-4 -4 ' + (w + 8) + ' ' + (ht + 8) + '" style="width:100%;height:62px;margin-top:6px"><defs><linearGradient id="tsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc852" stop-opacity=".45"/><stop offset="1" stop-color="#8fc852" stop-opacity="0"/></linearGradient></defs><path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + ' L' + w + ' ' + ht + ' L0 ' + ht + 'Z" fill="url(#tsg)"/><polyline points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="#8fc852" stroke-width="2.5" stroke-linejoin="round"/><circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="4" fill="#8fc852"/></svg>'; }
  var d = H.length >= 2 ? Math.round((H[H.length - 1] - H[0]) * 10) / 10 : 0;
  return '<div class="box"><h3>💪 Teamstärke</h3><div class="row sp"><span class="row small" style="gap:6px">Startelf ' + strBox(cur, true) + '</span>' + (H.length >= 2 ? '<b class="xs ' + (d >= 0 ? 'pos' : 'neg') + '">' + (d >= 0 ? '+' : '') + String(d).replace('.', ',') + ' seit ' + H.length + ' Sp.</b>' : '') + '</div>' + (svg || '<div class="xs muted" style="margin-top:6px">Die Kurve zeigt nach den ersten Pflichtspielen, wie sich die Stärke entwickelt.</div>') + '<div class="row sp xs muted" style="margin-top:4px"><span>Liga-Schnitt</span><b>' + String(V.lgAvg).replace('.', ',') + '</b></div></div>';
}
function formMini(f) {
  var P = FPOS[f] || FPOS['4-4-2'], o = '<svg viewBox="0 0 100 104" style="width:72%;height:auto;display:block;margin:0 auto;border-radius:8px;background:repeating-linear-gradient(0deg,#2f7a2a 0 13px,#378530 13px 26px)"><rect x="3" y="3" width="94" height="98" fill="none" stroke="#fff8" stroke-width="1"/><line x1="3" y1="52" x2="97" y2="52" stroke="#fff8" stroke-width="1"/><circle cx="50" cy="52" r="9" fill="none" stroke="#fff8" stroke-width="1"/><rect x="30" y="86" width="40" height="15" fill="none" stroke="#fff8" stroke-width="1"/><rect x="30" y="3" width="40" height="15" fill="none" stroke="#fff8" stroke-width="1"/>';
  P.forEach(function (p, i) { o += '<circle cx="' + p[0] + '" cy="' + (p[1] + 4) + '" r="4.6" fill="' + (i ? '#fff' : '#f0c24b') + '" stroke="#14200c" stroke-width="1"/>'; });
  return o + '</svg>';
}
function formBox(L) {
  return '<div class="box fbox"><h3>🧠 Formation</h3><div class="row" style="gap:8px;align-items:stretch"><div class="fdd" style="flex:1"><button class="fddb" onclick="event.stopPropagation();this.parentNode.classList.toggle(\'open\')"><b>' + esc(L.form) + '</b><span>▾</span></button><div class="fddl">' + L.forms.map(function (f) { return '<div class="fddi' + (f === L.form ? ' on' : '') + '" onclick="this.closest(\'.fdd\').classList.remove(\'open\');act(\'lineup\',{form:\'' + f + '\',auto:' + L.auto + ',xi:' + (L.auto ? 'null' : JSON.stringify(L.slots.map(function (s) { return s.pid; }))) + '},{quiet:true})"><span>' + esc(f) + '</span><span class="fddp">' + formMini(f) + '</span></div>'; }).join('') + '</div></div>' +
    '<button class="sm ' + (L.auto ? 'pri' : '') + '" style="white-space:nowrap" title="Der Co-Trainer stellt automatisch auf" onclick="act(\'lineup\',{form:\'' + L.form + '\',auto:true},{quiet:true})">' + (L.auto ? '✓ ' : '🧑‍🏫 ') + 'Co-Trainer</button></div></div>';
}
function slotMenu(i, ev) {
  ev.stopPropagation(); var o = $('.minim'); if (o) o.remove(); var s = V.lineup.slots[i];
  var m = document.createElement('div'); m.className = 'minim'; m.style.left = Math.min(window.innerWidth - 180, ev.pageX - 20) + 'px'; m.style.top = (ev.pageY + 10) + 'px';
  m.innerHTML = '<button onclick="this.parentNode.remove();subPanel(' + i + ')">🔁 Wechseln</button>' + (s.pid ? '<button onclick="this.parentNode.remove();playerPop(' + s.pid + ')">ℹ️ Spielerinfo</button>' : '');
  document.body.appendChild(m); setTimeout(function () { document.addEventListener('click', function cl(e) { if (!m.contains(e.target)) { m.remove(); } document.removeEventListener('click', cl, true); }, true); }, 0);
}
function subPanel(i) {
  var s = V.lineup.slots[i]; var o = $('.side'); if (o) o.remove();
  var ps = V.players.filter(function (p) { return !p.inj && !p.ban && !(p.loan && p.loan.to) && p.id !== s.pid; }).sort(function (a, b) { return (b.pos === s.pos) - (a.pos === s.pos) || (b.pos2 === s.pos) - (a.pos2 === s.pos) || b.str - a.str; });
  var pt = $('#pitch'), r = pt ? pt.getBoundingClientRect() : { right: 400, top: 200 }; var wide = window.innerWidth > 900;
  var d = document.createElement('div'); d.className = 'side'; d.style.left = (wide ? Math.min(window.innerWidth - 310, r.right + window.scrollX + 12) : 10) + 'px'; d.style.top = (r.top + window.scrollY) + 'px';
  d.innerHTML = '<div class="hd"><span>⇄ ' + s.pos + (s.n ? ' · ' + esc(s.n) + ' raus' : '') + '</span><button class="sm" onclick="this.closest(\'.side\').remove()">✕</button></div><div class="bd">' + ps.map(function (p) { var f = p.pos === s.pos ? 100 : p.pos2 === s.pos ? 90 : null; return '<div class="pl" onclick="this.closest(\'.side\').remove();act(\'swap\',{slot:' + i + ',pid:' + p.id + '},{quiet:true})"><span class="pb ' + p.pos + '">' + p.pos + '</span><div><b>' + esc(p.n) + '</b><div class="meta">' + stars(p.talLo, p.talHi) + '<span>Fit ' + p.fit + '</span>' + (f ? '<span class="pill ' + (f === 100 ? 'g' : 'y') + '">' + f + ' %</span>' : '<span class="pill r">fremd</span>') + (p.inXI ? '<span class="pill g">spielt</span>' : '') + '</div></div>' + strBox(p.str) + '</div>'; }).join('') + '</div>';
  document.body.appendChild(d);
  var hd = d.querySelector('.hd'); hd.onpointerdown = function (e) { if (e.target.closest('button')) return; var x0 = e.clientX - d.offsetLeft, y0 = e.clientY - d.offsetTop; hd.setPointerCapture(e.pointerId); hd.onpointermove = function (m) { d.style.left = (m.clientX - x0) + 'px'; d.style.top = (m.clientY - y0) + 'px'; }; hd.onpointerup = function () { hd.onpointermove = null; }; };
}
function nameOf(id) { var p = V.players.filter(function (x) { return x.id === id; })[0]; return p ? p.n : null; }
function pickSlot(i) {
  var s = V.lineup.slots[i];
  var ps = V.players.filter(function (p) { return !p.inj && !p.ban && !(p.loan && p.loan.to); }).sort(function (a, b) { return (b.pos === s.pos) - (a.pos === s.pos) || (b.pos2 === s.pos) - (a.pos2 === s.pos) || b.str - a.str; });
  pop('<h2>' + s.pos + ' – ' + esc(V.dpn[s.pos]) + '</h2><div class="plist">' + ps.map(function (p) { var f = p.pos === s.pos ? 100 : p.pos2 === s.pos ? 90 : null; return '<div class="pl" onclick="act(\'swap\',{slot:' + i + ',pid:' + p.id + '},{quiet:true})"><span class="pb ' + p.pos + '">' + p.pos + '</span><div><b>' + esc(p.n) + '</b><div class="meta"><span>Fit ' + p.fit + '</span><span>Form ' + p.form + '</span>' + (f ? '<span class="pill ' + (f === 100 ? 'g' : 'y') + '">' + f + ' %</span>' : '<span class="pill r">fremd</span>') + (p.inXI ? '<span class="pill g">spielt</span>' : '') + '</div></div><div class="str">' + p.str + '</div></div>'; }).join('') + '</div>');
}
function reorderZone(dz, pid, tid, isB, y) {
  var ids = Array.prototype.map.call(dz.querySelectorAll('.pl[data-pid]'), function (r) { return +r.getAttribute('data-pid'); }).filter(function (x) { return x !== pid; });
  var at = ids.length; if (tid != null && tid !== pid) { var tr = dz.querySelector('.pl[data-pid="' + tid + '"]'), rc = tr.getBoundingClientRect(); at = ids.indexOf(tid) + (y > rc.top + rc.height / 2 ? 1 : 0); } else if (tid === pid) return;
  ids.splice(at, 0, pid);
  if (isB) act('bench', { ids: ids, ord: true }, { quiet: true }); else act('tribOrd', { ids: ids }, { quiet: true });
}
function benchSet(ids) { act('bench', { ids: ids }, { quiet: true }); }
function benchMove(pid, toBench) { var b = (V.benchIds || []).slice(); var i = b.indexOf(pid); if (toBench) { if (i >= 0) return; if (b.length >= 9) return toast('Die Bank ist voll (9 Plätze).', true); b.push(pid); } else { if (i < 0) return; b.splice(i, 1); } act('bench', { ids: b }, { quiet: true }); }
var DRAG = null;
function initDrag() {
  var src = $('#dragsrc'); if (!src) return;
  src.addEventListener('pointerdown', function (e) {
    var row = e.target.closest('.pl[data-pid]'), spid = null;
    if (!row) { var sl0 = e.target.closest('.slot'); if (sl0) { spid = (V.lineup.slots[+sl0.getAttribute('data-slot')] || {}).pid; if (spid) row = sl0; } }
    if (!row) return;
    DRAG = { pid: spid || +row.getAttribute('data-pid'), x0: e.clientX, y0: e.clientY, on: false, el: null, row: row, touch: e.pointerType === 'touch' && !spid, armed: e.pointerType !== 'touch' || !!spid };
    // Tablet: in Listen erst nach kurzem Halten ziehen (sonst scrollt man), auf dem Spielfeld sofort
    if (DRAG.touch) { var dd = DRAG; dd.tm = setTimeout(function () { if (DRAG === dd) { dd.armed = true; try { navigator.vibrate && navigator.vibrate(15); } catch (x) {} row.classList.add('dragarm'); } }, 220); }
  });
  if (!window.DRAGTM) { window.DRAGTM = 1; document.addEventListener('touchmove', function (e) { if (DRAG && DRAG.armed) e.preventDefault(); }, { passive: false }); window.addEventListener('pointercancel', function () { if (DRAG && DRAG.el) DRAG.el.remove(); if (DRAG && DRAG.row) DRAG.row.classList.remove('dragarm'); DRAG = null; }); }
  window.onpointermove = function (e) {
    if (!DRAG) return;
    if (!DRAG.armed) { if (Math.abs(e.clientX - DRAG.x0) + Math.abs(e.clientY - DRAG.y0) > 8) { clearTimeout(DRAG.tm); DRAG = null; } return; }
    if (!DRAG.on && Math.abs(e.clientX - DRAG.x0) + Math.abs(e.clientY - DRAG.y0) > 8) { DRAG.on = true; var p = V.players.filter(function (q) { return q.id === DRAG.pid; })[0]; DRAG.el = document.createElement('div'); DRAG.el.className = 'drag'; DRAG.el.textContent = p ? p.pos + ' · ' + p.n : ''; document.body.appendChild(DRAG.el); }
    if (DRAG.on) { e.preventDefault(); DRAG.el.style.left = e.clientX + 'px'; DRAG.el.style.top = e.clientY + 'px'; document.querySelectorAll('.slot').forEach(function (s) { s.classList.remove('over'); }); var t = document.elementFromPoint(e.clientX, e.clientY); var sl = t && t.closest ? t.closest('.slot') : null; if (sl) sl.classList.add('over'); }
  };
  window.onpointerup = function (e) {
    if (!DRAG) return; var d = DRAG; DRAG = null; clearTimeout(d.tm); if (d.row) d.row.classList.remove('dragarm');
    if (!d.on) return; if (d.el) d.el.remove();
    var t = document.elementFromPoint(e.clientX, e.clientY); var sl = t && t.closest ? t.closest('.slot') : null;
    d.row.onclick = null; setTimeout(function () { }, 0);
    if (sl) act('swap', { slot: +sl.getAttribute('data-slot'), pid: d.pid }, { quiet: true });
    else { var dz = t && t.closest ? t.closest('.dropzone') : null; if (dz) { var toB = dz.getAttribute('data-z') === 'bench', tr = t.closest('.pl[data-pid]'), b = (V.benchIds || []).slice(), inB = b.indexOf(d.pid) >= 0; if (toB === inB) { reorderZone(dz, d.pid, tr ? +tr.getAttribute('data-pid') : null, toB, e.clientY); return; } if (toB && !inB && b.length >= 9) { var tid = tr ? +tr.getAttribute('data-pid') : b[b.length - 1]; var ti = b.indexOf(tid); if (ti < 0) ti = b.length - 1; b[ti] = d.pid; act('bench', { ids: b }, { quiet: true }); toast('Getauscht – ' + (V.players.filter(function (q) { return q.id === tid; })[0] || {}).n + ' sitzt jetzt auf der Tribüne.'); } else benchMove(d.pid, toB ? 1 : 0); } }
  };
  src.addEventListener('click', function (e) { if (DRAG && DRAG.on) { e.stopPropagation(); e.preventDefault(); } }, true);
}

/* ===================================================================== Training */
function campPic(c) {
  if (c.img) return '<img class="im itimg" src="' + esc(driveImg(c.img)) + '" alt="" loading="lazy">';
  var sea = /meer|strand|türkei|spanien|portugal|mallorca|zypern|antalya|algarve/i.test((c.ort || '') + c.name), alp = /tirol|alpen|österreich|schweiz|berg|südtirol/i.test((c.ort || '') + c.name);
  var sky = sea ? ['#7cc7ff', '#e9f6ff'] : alp ? ['#9ec9f0', '#f2f7fc'] : ['#bfe3ff', '#fff6e0'];
  var o = '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice" class="im"><defs><linearGradient id="cs' + c.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs><rect width="200" height="110" fill="url(#cs' + c.id + ')"/>';
  if (alp) o += '<path d="M0 70 L40 25 L70 55 L105 15 L150 60 L175 35 L200 55 L200 110 L0 110Z" fill="#7d8ea3"/><path d="M40 25 L50 36 L32 36Z M105 15 L118 30 L93 30Z" fill="#fff"/>';
  else if (sea) o += '<circle cx="160" cy="26" r="13" fill="#ffd34d"/><rect y="62" width="200" height="16" fill="#2f8fd6"/><path d="M0 78 Q100 70 200 78 L200 110 L0 110Z" fill="#f2d79b"/><path d="M30 78 L34 48 M34 48 q-12 -2 -16 6 M34 48 q12 -4 16 4" stroke="#5a7a2a" stroke-width="3" fill="none"/>';
  else o += '<circle cx="40" cy="24" r="12" fill="#ffd34d"/><path d="M0 64 Q60 46 120 60 T200 56 L200 110 L0 110Z" fill="#6fae4f"/>';
  o += '<path d="M0 86 L200 86 L200 110 L0 110Z" fill="#3c9a3a"/><path d="M10 98 L190 98" stroke="#fff9"/>';
  return o + '</svg>';
}
function specialBox() {
  var L = V.special || [];
  return '<div class="box"><h3>✨ Sondertraining</h3>' + L.map(function (x) { return '<div style="padding:8px 0;border-top:1px solid var(--linie)"><div class="row sp" style="gap:6px"><b class="small">' + x.ic + ' ' + esc(x.n) + '</b><button class="sm tinyb' + (x.done ? ' done' : ' pri') + '" ' + (x.done ? 'disabled' : '') + ' onclick="act(\'special\',{k:\'' + x.k + '\'})">' + (x.done ? '✓' : eur(x.cost)) + '</button></div></div>'; }).join('') + '</div>';
}
var STAFFFX = { cotrainer: 'Spieler entwickeln sich 10 % schneller', twtrainer: 'Torhüter entwickeln sich 40 % schneller', athletik: '20 % schnellere Erholung, weniger Verletzungen, +3 % Tore in der Schlussphase', physio: 'Verletzungen heilen 25 % schneller', scout: 'Zeigt das genaue Talent, findet mehr Spieler', psychologe: 'Niederlagen schlagen weniger auf die Moral, Moral +3', ernaehrung: 'Schnellere Erholung', socialmedia: 'Mehr Fans und Werbewert', jugendkoord: 'Bessere Talente aus der eigenen Jugend', reha: 'Verletzte sind schneller zurück', fitnessraum: 'Weniger Verletzungen, schnellere Erholung', fitnesscenter: 'Noch weniger Verletzungen', kabinen2: 'Bessere Stimmung', videoraum: 'Taktischer Vorteil im Spiel', indoor: 'Volle Entwicklung auch im Winter, +1 % Schlussphasen-Tore', tplatz2: 'Bessere Entwicklung', tzentrum: 'Profi-Bedingungen' };
function personalBox() {
  var I = V.infra.items.filter(function (x) { return x.cat === 'Personal' || x.cat === 'Training'; });
  var on = I.filter(function (x) { return x.built; }), off = I.filter(function (x) { return !x.built && x.cat === 'Personal'; });
  return '<div class="box"><h3>👔 Personal & Ausstattung</h3>' + (on.length ? on.map(function (x) { return '<div style="padding:6px 0;border-top:1px solid var(--linie)"><b class="small">✅ ' + esc(x.name) + '</b><div class="xs muted">' + esc(STAFFFX[x.id] || x.desc) + '</div></div>'; }).join('') : '<div class="muted xs">Noch kein Personal eingestellt.</div>') +
    (off.length ? '<div class="xs muted" style="margin-top:8px">Noch nicht eingestellt: ' + off.map(function (x) { return esc(x.name); }).join(', ') + '</div><button class="sm" style="margin-top:6px;width:100%" onclick="ST.vCat=\'Personal\';go(\'verein\')">Personal einstellen</button>' : '') + '</div>';
}
function tTraining() {
  var T = V.train;
  var FIC = { kondition: '🫁', technik: '🎯', taktik: '📋', abschluss: '⚽', standards: '🚩', defensive: '🛡️', offensive: '⚡', schnelligkeit: '💨', torwart: '🧤', ausdauer: '🏃' };
  var h = '<div class="box trbox"><h3>🏋️ Mannschaftstraining</h3><div class="intg">' + [['locker', 'Locker', '🧘', '#4fa3e0'], ['normal', 'Normal', '🏃', '#8fc852'], ['hart', 'Hart', '🔥', '#ff6b3d']].map(function (x) { return '<button class="intc' + (T.int === x[0] ? ' on' : '') + '" style="--c:' + x[3] + '" onclick="act(\'training\',{int:\'' + x[0] + '\'},{quiet:true})"><span>' + x[2] + '</span><b>' + x[1] + '</b></button>'; }).join('') + '</div>' +
    '<div class="xs muted" style="margin:12px 0 6px;font-weight:800;text-transform:uppercase;letter-spacing:.06em">Schwerpunkt</div><div class="focg">' +
    Object.keys(T.foci).map(function (k) { return '<button class="focc' + (T.focus === k ? ' on' : '') + '" onclick="act(\'training\',{focus:\'' + k + '\'},{quiet:true})"><span>' + (FIC[k] || '•') + '</span>' + T.foci[k] + '</button>'; }).join('') + '</div>' +
    '</div>';
  var TD = V.trainDefs || {}, tl = V.ttLast;
  var mtB = h; h = '';
  h += '<div class="box trbox"><h3>⚽ Training durchführen</h3><div class="grid g4 ttg" style="gap:8px;margin-top:4px">' + Object.keys(TD).map(function (k, ki) { var d = TD[k]; return '<button class="ttc" style="--h:' + (ki * 47 % 360) + '" ' + (V.ttDone ? 'disabled' : '') + ' onclick="act(\'teamTrain\',{t:\'' + k + '\'})"><b>' + esc(d[0]) + '</b><span class="xs muted">' + (d[1] ? d[1].slice(0, 4).join(' · ') : 'ganzes Team') + '</span></button>'; }).join('') + '</div>' + (V.ttDone && tl ? '<div class="hint">✓ Diese Woche: <b>' + esc(tl.n) + '</b> – ' + tl.k + ' Spieler im Schnitt +' + String(tl.g).replace('.', ',') + ' Stärke. Nächste Einheit ab Montag.</div>' : '') + '</div>';
  var MID = S2(mtB, h); h = '';
  if (has('trainingsplan')) {
    var ind = V.players.filter(function (p) { return p.tp || p.retrain || p.fp; });
    h += '<div class="box"><h3>📋 Trainingspläne & Förderspieler (' + T.fp.length + '/3)</h3><div class="small muted">Förderspieler entwickeln sich 40 % schneller. Individuelle Pläne und Umschulungen stellst du beim Spieler ein.</div><div class="plist" style="margin-top:6px">' +
      (ind.length ? ind.map(function (p) { return playerRow(p); }).join('') : '<div class="muted small" style="padding:8px 0">Noch keine individuellen Pläne.</div>') + '</div></div>';
  } else h += lockHTML('trainingsplan');
  var C4 = h + personalBox(); h = '';
  MID += '<div class="box"><h3>⛺ Trainingslager</h3>' + (V.camp ? '<div class="hint">Gebucht: <b>' + esc(V.camp.name) + '</b> vom ' + dFull(V.camp.from) + ' bis ' + dFull(V.camp.to) + '</div>' : '<div class="small muted">Nur in der Sommerpause (Juli/August) oder Winterpause (Januar/Februar). Kurz-Trainingslager über 3 oder 5 Tage planst du im Kalender.</div>') +
    '<div class="grid g3" style="margin-top:10px">' + V.camps.map(function (c) { var lk = V.mlvl < (c.flvl || 1); return '<div class="item ' + (lk ? 'locked' : '') + '"><div class="picw">' + campPic(c) + '</div><div class="bd"><div class="row sp"><b>' + esc(c.name) + '</b><span class="pill">' + c.days + ' Tage</span></div><div class="small muted">📍 ' + esc(c.ort) + '</div><div class="small">Wirkung ' + '●'.repeat(Math.round(c.e)) + '<span style="opacity:.25">' + '●'.repeat(5 - Math.round(c.e)) + '</span></div><div class="row sp"><b class="neg">' + eur(c.cost) + '</b>' + (lk ? '<span class="pill">🔒 Level ' + c.flvl + '</span>' : '<button class="sm" ' + (V.camp ? 'disabled' : '') + ' onclick="campPop(\'' + c.id + '\')">Buchen</button>') + '</div></div></div>'; }).join('') + '</div></div>';
  var IP = V.itPool || [], il = V.itLast;
  var ind = '<div class="box sm1"><h3>🎯 Einzeltraining</h3>' + IP.map(function (q) { var pp = V.players.filter(function (x) { return x.id === q.id; })[0] || {}; return '<div class="itrow"><span class="pb ' + q.pos + '">' + q.pos + '</span><div style="min-width:0"><b class="small" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(q.n) + '</b><span class="row xs" style="gap:5px"><span class="wchip">' + q.age + ' J.</span>' + (pp.talLo ? stars(pp.talLo, pp.talHi) : '') + '</span></div><span class="itstr" id="its' + q.id + '" style="background:' + (strCls(q.str) === 'g' ? 'var(--g)' : strCls(q.str) === 'y' ? 'var(--y)' : 'var(--r)') + '">' + String(q.str.toFixed(2)).replace('.', ',') + '</span><button class="sm pri tinyb" ' + (V.itDone ? 'disabled' : '') + ' onclick="itDo(' + q.id + ',event)">🎯</button></div>'; }).join('') + (V.itDone && il ? '<div class="hint">✓ ' + esc(il.n) + ' +' + String(il.g).replace('.', ',') + ' Stärke</div>' : '') + '</div>';
  return L4(specialBox() + ind, MID, C4);
}
function itDo(pid, ev) {
  var b = ev && ev.currentTarget, br = b ? b.getBoundingClientRect() : null;
  act('indTrain', { pid: pid }, { quiet: true, norender: true }).then(function (r) {
    if (!r) return; var il = V.itLast, el = $('#its' + pid), L = $('#fxl');
    if (il && el && br && L) { var tr = el.getBoundingClientRect(), f = document.createElement('div'); f.className = 'itfly'; f.textContent = '+' + String(il.g).replace('.', ','); f.style.left = (br.left + br.width / 2 + window.scrollX) + 'px'; f.style.top = (br.top + window.scrollY) + 'px'; f.style.setProperty('--tx', (tr.left + tr.width / 2 - br.left - br.width / 2) + 'px'); f.style.setProperty('--ty', (tr.top - br.top) + 'px'); L.appendChild(f);
      setTimeout(function () { var q = (V.itPool || []).filter(function (x) { return x.id === pid; })[0]; if (q) el.textContent = String(q.str.toFixed(2)).replace('.', ','); el.classList.add('pulse'); }, 900);
      setTimeout(function () { f.remove(); closePop(); render(true); toast(r.info); }, 1700);
    } else { closePop(); render(true); toast(r.info); }
  });
}
function campPop(id) {
  var c = V.camps.filter(function (x) { return x.id === id; })[0];
  pop('<h2>' + esc(c.name) + '</h2><div class="muted small">' + esc(c.ort) + ' · ' + c.days + ' Tage · ' + eur(c.cost) + ' aus dem Bargeld</div><label>Anreise am</label><input id="cf" type="date" value="' + addD(V.date, 1) + '"><button class="pri" style="margin-top:12px;width:100%" onclick="act(\'camp\',{id:\'' + id + '\',from:$(\'#cf\').value})">Verbindlich buchen</button>', { nofocus: true });
}

/* ===================================================================== Academy */
function academyTeams() {
  var ok = has('jugend'), teams = V.infra.items.filter(function (it) { return /^u1[579]$/.test(it.id); }).sort(function (a, b) { return a.id < b.id ? 1 : -1; });
  return '<div class="box"><h3>👕 Jugendteams</h3>' + (ok ? '' : '<div class="hint" style="margin-bottom:8px">🔒 Jugendteams gründen ab Level ' + MGR.featLvl('jugend') + '.</div>') +
    teams.map(function (it) { return '<div class="row sp" style="padding:8px 0;border-top:1px solid var(--linie);gap:6px"><div style="min-width:0"><b class="small">' + esc(it.name) + '</b><div class="xs muted">' + esc(it.desc) + '<br><span class="neg">' + eur(it.cost) + '</span>' + (it.monthly ? ' · <span class="neg">−' + eur(it.monthly) + '/M.</span>' : '') + '</div></div>' + (it.built ? '<span class="pill g">✓ aktiv</span>' : it.building ? '<span class="pill y">ab ' + dFull(it.building) + '</span>' : ok ? '<button class="sm pri" onclick="buildPop(\'' + it.id + '\')">Gründen</button>' : '<span class="pill">🔒</span>') + '</div>'; }).join('') +
    '<div class="xs muted" style="margin-top:6px">Jedes Jugendteam bringt mehr Talente und 3 weitere Academy-Plätze.</div></div>';
}
/* ---------- moderne Iso-Grafik (Academy, Verein, Med. Abteilung) */
function isoP(cx, cy, x, y, z) { return [cx + (x - y), cy + (x + y) / 2 - (z || 0)]; }
function isoPoly(pts) { return pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
function shade(hex, f) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; var c = function (v) { return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))); }; return '#' + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1); }
function isoBox(cx, cy, a, b, h, col, o) {
  o = o || {}; var P = function (x, y, z) { return isoP(cx, cy, x, y, z); };
  var top = [P(a, -b, h), P(a, b, h), P(-a, b, h), P(-a, -b, h)], fr = [P(a, -b, 0), P(a, b, 0), P(a, b, h), P(a, -b, h)], fl = [P(a, b, 0), P(-a, b, 0), P(-a, b, h), P(a, b, h)];
  var s = '<polygon points="' + isoPoly(fl) + '" fill="' + shade(col, -0.18) + '"/><polygon points="' + isoPoly(fr) + '" fill="' + shade(col, -0.38) + '"/><polygon points="' + isoPoly(top) + '" fill="' + (o.roof || shade(col, 0.12)) + '"/>';
  if (o.win) { var wc = o.win, rows = Math.max(1, Math.floor(h / 13)), q;
    for (q = 0; q < rows; q++) { var z0 = 5 + q * 13, z1 = z0 + 7; if (z1 > h - 3) break;
      for (var t = -b + 5; t < b - 4; t += 10) s += '<polygon points="' + isoPoly([P(a, t, z0), P(a, t + 6, z0), P(a, t + 6, z1), P(a, t, z1)]) + '" fill="' + wc + '" opacity=".85"/>';
      for (var u = -a + 5; u < a - 4; u += 10) s += '<polygon points="' + isoPoly([P(u + 6, b, z0), P(u, b, z0), P(u, b, z1), P(u + 6, b, z1)]) + '" fill="' + wc + '" opacity=".95"/>'; } }
  if (o.glass) s += '<polygon points="' + isoPoly([P(-a * 0.5, b, 0), P(-a * 0.5 + a * 0.6, b, 0), P(-a * 0.5 + a * 0.6, b, Math.min(h - 4, 18)), P(-a * 0.5, b, Math.min(h - 4, 18))]) + '" fill="#9fd8ff" opacity=".9"/>';
  if (o.parapet) s += '<polygon points="' + isoPoly(top) + '" fill="none" stroke="' + shade(col, -0.25) + '" stroke-width="2"/>';
  if (o.ac) s += isoBoxRaw(P(a * 0.3, -b * 0.2, h), 5, 4, 4, '#cfd6de');
  if (o.sign) { var sp = P(a * 0.05, b, h * 0.62); s += '<text x="' + sp[0] + '" y="' + sp[1] + '" transform="skewY(26.6) translate(0,0)" font-size="8" font-weight="900" fill="' + (o.signCol || '#fff') + '" text-anchor="middle" style="transform-box:fill-box;transform-origin:center">' + o.sign + '</text>'; }
  return s;
}
function isoBoxRaw(pt, a, b, h, col) { return isoBox(pt[0], pt[1], a, b, h, col); }
function isoTree(cx, cy, r) { return '<ellipse cx="' + cx + '" cy="' + (cy + 3) + '" rx="' + r + '" ry="' + r * 0.45 + '" fill="#0005"/><rect x="' + (cx - 1.5) + '" y="' + (cy - r * 0.8) + '" width="3" height="' + r * 0.8 + '" fill="#6b4a2b"/><circle cx="' + cx + '" cy="' + (cy - r * 1.1) + '" r="' + r + '" fill="#2f7d3a"/><circle cx="' + (cx - r * 0.3) + '" cy="' + (cy - r * 1.35) + '" r="' + r * 0.55 + '" fill="#4aa055"/>'; }
function isoPitch(cx, cy, a, b, col) { var P = function (x, y) { return isoP(cx, cy, x, y, 0); };
  var o = '<polygon points="' + isoPoly([P(a + 6, -b - 6), P(a + 6, b + 6), P(-a - 6, b + 6), P(-a - 6, -b - 6)]) + '" fill="#2a6b30"/>';
  for (var i = 0; i < 8; i++) { var x0 = -a + i * (2 * a / 8); o += '<polygon points="' + isoPoly([P(x0, -b), P(x0 + a / 4, -b), P(x0 + a / 4, b), P(x0, b)]) + '" fill="' + (i % 2 ? shade(col, 0.08) : col) + '"/>'; }
  o += '<polygon points="' + isoPoly([P(a, -b), P(a, b), P(-a, b), P(-a, -b)]) + '" fill="none" stroke="#fff" stroke-width="1.6"/><polyline points="' + isoPoly([P(0, -b), P(0, b)]) + '" stroke="#fff" stroke-width="1.4" fill="none"/>';
  var c = P(0, 0); o += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + b * 0.42 + '" ry="' + b * 0.21 + '" fill="none" stroke="#fff" stroke-width="1.3"/>';
  [-1, 1].forEach(function (sgn) { o += '<polygon points="' + isoPoly([P(sgn * a, -b * 0.4), P(sgn * (a - a * 0.18), -b * 0.4), P(sgn * (a - a * 0.18), b * 0.4), P(sgn * a, b * 0.4)]) + '" fill="none" stroke="#fff" stroke-width="1.2"/>'; });
  return o;
}
function isoLabel(x, y, txt, st, cost) { var w = Math.max(54, txt.length * 5.6 + 22), ic = st === 'on' ? '✓' : st === 'bld' ? '🏗' : '+'; return '<g class="isolab ' + st + '"><rect x="' + (x - w / 2) + '" y="' + y + '" width="' + w + '" height="17" rx="8.5"/><text x="' + (x - w / 2 + 10) + '" y="' + (y + 12) + '" font-size="9.5" font-weight="800">' + ic + '</text><text x="' + (x + 6) + '" y="' + (y + 12) + '" text-anchor="middle" font-size="9" font-weight="700">' + esc(txt) + '</text></g>'; }
function isoObj(kind, x, y) {
  switch (kind) {
    case 'school': return isoBox(x, y, 30, 18, 34, '#e9dcc0', { win: '#7cc3f2', glass: 1, parapet: 1, ac: 1 });
    case 'tower': return isoBox(x, y, 18, 18, 64, '#c9d6e6', { win: '#ffd98a', parapet: 1, ac: 1 });
    case 'gym': return isoBox(x, y, 26, 18, 24, '#ef8f3c', { win: '#ffe1b8', glass: 1, roof: '#3b3f46' }) + '<text x="' + x + '" y="' + (y - 22) + '" text-anchor="middle" font-size="9" font-weight="900" fill="#fff">GYM</text>';
    case 'lang': return isoBox(x, y, 22, 16, 26, '#b49ae6', { win: '#e8f4ff', parapet: 1 }) + '<text x="' + x + '" y="' + (y - 30) + '" text-anchor="middle" font-size="11">🗣️</text>';
    case 'center': return isoBox(x, y, 34, 20, 22, '#f2f2f0', { win: '#5fb0e6', glass: 1, roof: '#8fc852' });
    case 'arena': var o = ''; for (var k = 3; k >= 0; k--) o += '<ellipse cx="' + x + '" cy="' + (y - k * 3) + '" rx="' + (48 - k) + '" ry="' + (24 - k / 2) + '" fill="' + (k ? '#9aa6b6' : '#c9d2dd') + '"/>'; return o + '<ellipse cx="' + x + '" cy="' + (y - 12) + '" rx="34" ry="16" fill="#3c9a3a"/><ellipse cx="' + x + '" cy="' + (y - 12) + '" rx="34" ry="16" fill="none" stroke="#fff" stroke-width="1"/><path d="M' + (x - 44) + ' ' + (y - 16) + ' Q' + x + ' ' + (y - 46) + ' ' + (x + 44) + ' ' + (y - 16) + '" fill="none" stroke="#e7ecf2" stroke-width="3"/>';
    case 'bus': return '<rect x="' + (x - 24) + '" y="' + (y - 16) + '" width="4" height="22" fill="#555"/><rect x="' + (x - 30) + '" y="' + (y - 20) + '" width="58" height="5" rx="2" fill="#2f6fbf"/><rect x="' + (x - 26) + '" y="' + (y - 15) + '" width="50" height="14" fill="#cbe9ff" opacity=".7"/><circle cx="' + (x + 30) + '" cy="' + (y - 28) + '" r="8" fill="#f0c24b"/><text x="' + (x + 30) + '" y="' + (y - 25) + '" text-anchor="middle" font-size="10" font-weight="900" fill="#222">H</text><g transform="translate(' + (x - 8) + ',' + (y + 4) + ')"><rect x="0" y="-12" width="44" height="14" rx="3" fill="#e9eef3"/><rect x="2" y="-10" width="38" height="5" fill="#2f6fbf"/><circle cx="8" cy="3" r="3" fill="#222"/><circle cx="34" cy="3" r="3" fill="#222"/></g>';
    case 'ubahn': return isoBox(x, y, 24, 14, 14, '#1f5fa8', { glass: 1, roof: '#2b2f36' }) + '<rect x="' + (x - 3) + '" y="' + (y - 44) + '" width="6" height="26" fill="#555"/><rect x="' + (x - 10) + '" y="' + (y - 56) + '" width="20" height="16" rx="3" fill="#1f5fa8" stroke="#fff" stroke-width="1.5"/><text x="' + x + '" y="' + (y - 44) + '" text-anchor="middle" font-size="12" font-weight="900" fill="#fff">U</text>';
    case 'stand': return isoBox(x, y, 52, 10, 20, '#b8c2cf', { roof: '#e25c5c' }) + [0, 1, 2].map(function (r) { var a = isoP(x, y, -50, 10 - r * 3, 4 + r * 5), b2 = isoP(x, y, 50, 10 - r * 3, 4 + r * 5); return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b2[0] + '" y2="' + b2[1] + '" stroke="' + ['#5fbf3a', '#e25c5c', '#5fbf3a'][r] + '" stroke-width="2"/>'; }).join('');
    case 'wall': return isoBox(x, y, 10, 40, 12, '#7fa86a', { roof: '#9ac485' });
    case 'mast': return '<rect x="' + (x - 2) + '" y="' + (y - 70) + '" width="4" height="70" fill="#7a8088"/><rect x="' + (x - 13) + '" y="' + (y - 82) + '" width="26" height="13" rx="2" fill="#e8ecf0" stroke="#9aa"/><circle cx="' + (x - 6) + '" cy="' + (y - 75) + '" r="3" fill="#fff6b0"/><circle cx="' + (x + 6) + '" cy="' + (y - 75) + '" r="3" fill="#fff6b0"/><ellipse cx="' + x + '" cy="' + (y - 60) + '" rx="30" ry="8" fill="#fff8" opacity=".15"/>';
    case 'screen': return '<rect x="' + (x - 3) + '" y="' + (y - 12) + '" width="6" height="14" fill="#555"/><rect x="' + (x - 34) + '" y="' + (y - 40) + '" width="68" height="30" rx="3" fill="#1b1b1b" stroke="#666"/><rect x="' + (x - 30) + '" y="' + (y - 36) + '" width="60" height="22" fill="#1f6fd6"/><text x="' + x + '" y="' + (y - 21) + '" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">' + esc(RX('SVW')) + ' 2:0</text>';
    case 'vip': return isoBox(x, y, 26, 10, 16, '#f0d48a', { win: '#fff6d8', roof: '#3b3f46' });
    case 'house': return isoBox(x, y, 28, 16, 22, '#e7d7b8', { win: '#8fd0ff', roof: '#b8473a' });
    case 'kiosk': return isoBox(x, y, 16, 12, 14, '#f6c2a0', { roof: '#e25c5c' }) + '<text x="' + x + '" y="' + (y - 18) + '" text-anchor="middle" font-size="11">🌭</text>';
    case 'shop': return isoBox(x, y, 18, 12, 16, '#d9f2c4', { glass: 1, roof: '#2f7a2a' }) + '<text x="' + x + '" y="' + (y - 20) + '" text-anchor="middle" font-size="11">👕</text>';
    case 'office': return isoBox(x, y, 16, 14, 40, '#dfe6ee', { win: '#7cc3f2', parapet: 1, ac: 1 });
    case 'hall': return isoBox(x, y, 34, 22, 20, '#cfd8e3', { roof: '#9aa6b6', glass: 1 }) + '<path d="M' + (x - 34) + ' ' + (y - 20) + ' Q' + x + ' ' + (y - 52) + ' ' + (x + 34) + ' ' + (y - 2) + '" fill="none" stroke="#e8eef5" stroke-width="2"/>';
    case 'parking': var p0 = function (a, b) { return isoP(x, y, a, b, 0); }; return '<polygon points="' + isoPoly([p0(30, -20), p0(30, 20), p0(-30, 20), p0(-30, -20)]) + '" fill="#4a4f57"/>' + [-18, -6, 6, 18].map(function (t) { var a = p0(t, -20), b2 = p0(t, 20); return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b2[0] + '" y2="' + b2[1] + '" stroke="#eee" stroke-width="1"/>'; }).join('') + '<rect x="' + (x - 14) + '" y="' + (y - 6) + '" width="12" height="7" rx="2" fill="#e25c5c"/><rect x="' + (x + 4) + '" y="' + (y + 2) + '" width="12" height="7" rx="2" fill="#4fa3e0"/>';
    case 'teambus': return '<g transform="translate(' + (x - 30) + ',' + (y - 14) + ')"><rect width="62" height="22" rx="5" fill="#141414"/><rect x="4" y="4" width="46" height="8" fill="#9fd3ff"/><rect y="14" width="62" height="3" fill="#8fc852"/><circle cx="14" cy="23" r="4" fill="#333"/><circle cx="48" cy="23" r="4" fill="#333"/></g>';
    case 'clinic': return isoBox(x, y, 26, 18, 30, '#f4f7fa', { win: '#9fd8ff', glass: 1, parapet: 1 }) + '<g transform="translate(' + x + ',' + (y - 40) + ')"><rect x="-8" y="-3" width="16" height="6" fill="#e25c5c"/><rect x="-3" y="-8" width="6" height="16" fill="#e25c5c"/></g>';
    case 'pool': var q0 = function (a, b) { return isoP(x, y, a, b, 0); }; return '<polygon points="' + isoPoly([q0(26, -14), q0(26, 14), q0(-26, 14), q0(-26, -14)]) + '" fill="#e6edf3"/><polygon points="' + isoPoly([q0(22, -10), q0(22, 10), q0(-22, 10), q0(-22, -10)]) + '" fill="#4fb6e6"/>';
    case 'lab': return isoBox(x, y, 22, 16, 22, '#e8eef6', { win: '#b8e2ff', glass: 1, roof: '#4fa3e0' });
    default: return isoBox(x, y, 20, 14, 20, '#cfd6de', { win: '#9fd8ff' });
  }
}
function isoScene(objs, items, decor, clickFn) {
  var o = '';
  objs.slice().sort(function (a, b) { return a[3] - b[3]; }).forEach(function (q) { var it = items.filter(function (x) { return x.id === q[0]; })[0]; if (!it) return; var st = it.built ? 'on' : it.building ? 'bld' : 'off';
    o += '<g class="yo ' + st + '" data-id="' + q[0] + '" onmouseenter="' + clickFn + '(\'' + q[0] + '\')" onclick="' + clickFn + '(\'' + q[0] + '\',1)">' + isoObj(q[4], q[2], q[3]) + (st === 'bld' ? '<text x="' + q[2] + '" y="' + (q[3] - 70) + '" text-anchor="middle" font-size="16">🏗️</text>' : '') + isoLabel(q[2], q[3] + 30, q[1], st) + '</g>'; });
  return decor + o;
}
function isoInfo(id, elId, clickBuy) {
  var it = (V.infra.items || []).filter(function (x) { return x.id === id; })[0], el = $('#' + elId); if (!it || !el) return; var lk = V.mlvl < (it.flvl || 1), buyable = !it.built && !it.building && !it.locked && !lk;
  el.innerHTML = '<div class="row" style="gap:12px;align-items:stretch"><div class="picw" style="flex:0 0 150px;border-radius:10px;overflow:hidden;height:86px">' + itemPic(it) + '</div><div style="min-width:0;flex:1;display:flex;flex-direction:column;gap:3px"><div class="row sp" style="gap:8px"><b>' + esc(it.name) + '</b>' + (it.built ? '<span class="pill g">✓ vorhanden</span>' : it.building ? '<span class="pill y">🏗️ fertig ' + dFull(it.building) + '</span>' : lk ? '<span class="pill">🔒 ab Level ' + it.flvl + '</span>' : it.locked ? '<span class="pill">braucht: ' + esc(it.reqName) + '</span>' : '') + '</div><div class="xs muted">' + esc(it.desc) + '</div>' + (it.built && (it.fxTxt || []).length ? '<div class="row wr" style="gap:4px">' + it.fxTxt.map(function (t) { return '<span class="pill g" style="font-size:10.5px">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
    '<div class="row sp" style="margin-top:auto;gap:8px"><span class="small">' + (it.cost ? '<b class="neg">' + eur(it.cost) + '</b>' : '') + (it.monthly ? ' <span class="xs neg">· −' + eur(it.monthly) + '/Monat</span>' : '') + (it.days ? ' <span class="xs gelb">· 🏗️ ' + it.days + ' T.</span>' : '') + '</span>' + (buyable ? '<button class="sm pri" ' + (V.pots.cash < it.cost ? 'disabled' : '') + ' onclick="buildPop(\'' + it.id + '\')">🛒 Kaufen</button>' : '') + '</div>' + (it.built && it.upOk ? upgHTML(it) : '') + '</div></div>';
  document.querySelectorAll('[data-scene="' + elId + '"] .yo').forEach(function (g) { g.classList.toggle('hl', g.getAttribute('data-id') === id); });
  if (clickBuy && buyable) buildPop(it.id);
}
function isoWrap(title, svg, infoId, hint) { return '<div class="box"><div class="row sp"><h3 style="margin:0">' + title + '</h3><span class="xs muted">' + (hint || 'Fahr über ein Gebäude · Klick auf „+“ zum Kaufen') + '</span></div><div class="isoframe" data-scene="' + infoId + '">' + svg + '</div><div id="' + infoId + '" class="yoinfo"><span class="muted small">Fahr mit der Maus über ein Gebäude.</span></div></div>'; }
function isoGround(W, H, c1, c2) { return '<defs><linearGradient id="isg' + W + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient><pattern id="isp" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#ffffff10"/></pattern></defs><rect width="' + W + '" height="' + H + '" rx="16" fill="url(#isg' + W + ')"/><rect width="' + W + '" height="' + H + '" rx="16" fill="url(#isp)"/>'; }

/* ===================================================================== 3D-Campus (v19) */
function shd(hex, f) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; var m = function (c) { return Math.max(0, Math.min(255, Math.round(f >= 0 ? c + (255 - c) * f : c * (1 + f)))); }; return '#' + ((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1); }
var SCPAL = ['#4f7be8', '#e8944f', '#e6b84a', '#3fae5a', '#e05858', '#b45fd9', '#7b6cf0', '#2fb3a5', '#e8618c', '#5aa6e8', '#d9a03f', '#6bbf4a'];
var SCICO = { pitchS: '⚽', arena: '🏟️', stand: '🏟️', wall: '📣', mast: '💡', screen: '📺', vip: '🥂', house: '🏠', kiosk: '🍔', shop: '🛍️', school: '🚿', gym: '🏋️', hall: '🏛️', parking: '🅿️', teambus: '🚌', office: '🗂️', center: '🏢', tower: '🛏️', lang: '🗣️', bus: '🚏', ubahn: '🚇', clinic: '🩺', pool: '💧', lab: '🧪' };
function scRoom(cx, cy, a, col, kind, seed, off) {
  var P = function (x, y, z) { return isoP(cx, cy, x, y, z); }, poly = function (pts, fill, extra) { return '<polygon points="' + isoPoly(pts) + '" fill="' + fill + '"' + (extra || '') + '/>'; };
  var R = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  var t = 7, H = a * 0.78, o = '';
  var fl = off ? '#3a4150' : shd(col, 0.62), wl = off ? '#4a5263' : col, wr = off ? '#3f4757' : shd(col, -0.18), sl = off ? '#262b36' : shd(col, -0.45), sr = off ? '#1f242d' : shd(col, -0.55);
  o += '<ellipse cx="' + cx + '" cy="' + (cy + t + 6) + '" rx="' + (a * 2.1) + '" ry="' + (a * 0.9) + '" fill="#000" opacity=".35"/>';
  o += poly([P(a, -a, 0), P(a, a, 0), P(a, a, -t), P(a, -a, -t)], sr) + poly([P(-a, a, 0), P(a, a, 0), P(a, a, -t), P(-a, a, -t)], sl);
  o += poly([P(-a, -a, 0), P(a, -a, 0), P(a, a, 0), P(-a, a, 0)], fl);
  // Wände
  o += poly([P(-a, -a, 0), P(-a, a, 0), P(-a, a, H), P(-a, -a, H)], wl) + poly([P(-a, -a, 0), P(a, -a, 0), P(a, -a, H), P(-a, -a, H)], wr);
  o += poly([P(-a, -a, H), P(-a, a, H), P(-a + 3, a, H), P(-a + 3, -a + 3, H), P(a, -a + 3, H), P(a, -a, H)], shd(off ? '#4a5263' : col, 0.25));
  var box = function (x, y, w, d, h, c) { var T = [P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)], L = [P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, h), P(x, y + d, h)], Rr = [P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, h), P(x + w, y, h)]; return poly(Rr, shd(c, -0.3)) + poly(L, shd(c, -0.15)) + poly(T, c); };
  var person = function (x, y, c) { var p = P(x, y, 0); return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="3.4" ry="1.6" fill="#000" opacity=".3"/><rect x="' + (p[0] - 2.6) + '" y="' + (p[1] - 11) + '" width="5.2" height="9" rx="2.4" fill="' + c + '"/><circle cx="' + p[0] + '" cy="' + (p[1] - 13.5) + '" r="2.8" fill="#f1c8a0"/>'; };
  var plant = function (x, y) { var p = P(x, y, 0); return '<rect x="' + (p[0] - 3) + '" y="' + (p[1] - 5) + '" width="6" height="5" rx="1" fill="#e9e4da"/><circle cx="' + p[0] + '" cy="' + (p[1] - 9) + '" r="5.2" fill="#3f9b47"/><circle cx="' + (p[0] + 2) + '" cy="' + (p[1] - 11) + '" r="3" fill="#57b85e"/>'; };
  var lamp = function (x, y) { var p = P(x, y, 0); return '<circle cx="' + p[0] + '" cy="' + (p[1] - 26) + '" r="16" fill="url(#scglow)"/><line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + p[0] + '" y2="' + (p[1] - 24) + '" stroke="#2a2f38" stroke-width="1.6"/><circle cx="' + p[0] + '" cy="' + (p[1] - 26) + '" r="3.4" fill="#fff6d6"/>'; };
  var wallScreen = function (y0, w, c) { return poly([P(-a + 0.5, y0, H * 0.35), P(-a + 0.5, y0 + w, H * 0.35), P(-a + 0.5, y0 + w, H * 0.8), P(-a + 0.5, y0, H * 0.8)], c || '#1d2330'); };
  var shelf = function (x0, w) { return poly([P(x0, -a + 0.5, H * 0.45), P(x0 + w, -a + 0.5, H * 0.45), P(x0 + w, -a + 0.5, H * 0.52), P(x0, -a + 0.5, H * 0.52)], '#f3eee4') + [0, 1, 2, 3].map(function (i) { return poly([P(x0 + 2 + i * w / 4.4, -a + 0.5, H * 0.52), P(x0 + 2 + i * w / 4.4 + w / 6, -a + 0.5, H * 0.52), P(x0 + 2 + i * w / 4.4 + w / 6, -a + 0.5, H * 0.66), P(x0 + 2 + i * w / 4.4, -a + 0.5, H * 0.66)], ['#e05858', '#4f7be8', '#e6b84a', '#3fae5a'][i]); }).join(''); };
  var pitch = function (m, c) { var g = c || '#3f9e48'; var s = poly([P(-a + m, -a + m, 0.5), P(a - m, -a + m, 0.5), P(a - m, a - m, 0.5), P(-a + m, a - m, 0.5)], g) + poly([P(-a + m, -a + m, 0.5), P(a - m, -a + m, 0.5), P(a - m, a - m, 0.5), P(-a + m, a - m, 0.5)], 'none', ' stroke="#fff" stroke-opacity=".85" stroke-width="1"'); var c1 = P(0, -a + m, 0.5), c2 = P(0, a - m, 0.5), cc = P(0, 0, 0.5); return s + '<line x1="' + c1[0] + '" y1="' + c1[1] + '" x2="' + c2[0] + '" y2="' + c2[1] + '" stroke="#fff" stroke-opacity=".85" stroke-width="1"/><ellipse cx="' + cc[0] + '" cy="' + cc[1] + '" rx="' + (a * 0.32) + '" ry="' + (a * 0.16) + '" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1"/>'; };
  var desk = function (x, y) { return box(x, y, a * 0.42, a * 0.22, a * 0.2, '#f4f1ea') + box(x + a * 0.08, y + a * 0.02, a * 0.2, a * 0.04, a * 0.4, '#1d2330'); };
  var rug = function (c) { return poly([P(-a * 0.55, -a * 0.35, 0.3), P(a * 0.45, -a * 0.35, 0.3), P(a * 0.45, a * 0.55, 0.3), P(-a * 0.55, a * 0.55, 0.3)], c, ' opacity=".55"'); };
  var cols = ['#3c6fd8', '#e05858', '#e6b84a', '#3fae5a', '#8b5cf6', '#ff8a3d'];
  var k = kind;
  if (/pitchS|hall|arena/.test(k)) { o += pitch(a * 0.14, k === 'hall' ? '#5a9e6a' : null); if (k === 'arena') o += box(-a * 0.95, -a * 0.9, a * 0.22, a * 1.8, a * 0.32, '#c9ced8') + box(-a * 0.9, -a * 0.95, a * 1.8, a * 0.2, a * 0.36, '#d8dde6'); o += person(-a * 0.2, 0, cols[0]) + person(a * 0.3, -a * 0.3, cols[1]) + person(a * 0.1, a * 0.4, cols[0]) + person(-a * 0.5, a * 0.3, cols[1]); o += box(a * 0.62, -a * 0.12, a * 0.06, a * 0.3, a * 0.22, '#fff'); }
  else if (/stand|wall/.test(k)) { for (var s2 = 0; s2 < 3; s2++) o += box(-a + s2 * a * 0.32, -a, a * 0.32, a * 2, a * (0.48 - s2 * 0.14), s2 % 2 ? '#c9ced8' : '#dfe3ea'); [[-0.8, -0.5], [-0.8, 0.2], [-0.5, -0.1], [-0.5, 0.6], [-0.2, 0.3]].forEach(function (q, i) { o += person(q[0] * a, q[1] * a, cols[i % cols.length]); }); o += pitch(a * 0.0, '#3f9e48').replace(/<polygon/, '<polygon opacity="0"'); }
  else if (/mast/.test(k)) { o += pitch(a * 0.18); [[-0.7, -0.7], [0.7, 0.7]].forEach(function (q) { var p = P(q[0] * a, q[1] * a, 0); o += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + p[0] + '" y2="' + (p[1] - a * 1.5) + '" stroke="#cfd5df" stroke-width="2.2"/><rect x="' + (p[0] - 8) + '" y="' + (p[1] - a * 1.5 - 7) + '" width="16" height="8" rx="2" fill="#fffbe0"/><circle cx="' + p[0] + '" cy="' + (p[1] - a * 1.5) + '" r="22" fill="url(#scglow)"/>'; }); }
  else if (/screen/.test(k)) { o += wallScreen(-a * 0.75, a * 1.5, '#0e1420') + poly([P(-a + 0.6, -a * 0.68, H * 0.42), P(-a + 0.6, a * 0.68, H * 0.42), P(-a + 0.6, a * 0.68, H * 0.74), P(-a + 0.6, -a * 0.68, H * 0.74)], '#2f7de1', ' opacity=".85"') + person(a * 0.1, 0, cols[2]) + person(a * 0.4, a * 0.3, cols[3]); }
  else if (/teambus|bus|parking|ubahn/.test(k)) { o += poly([P(-a * 0.2, -a, 0.4), P(a * 0.35, -a, 0.4), P(a * 0.35, a, 0.4), P(-a * 0.2, a, 0.4)], '#3a3f4a'); o += box(-a * 0.15, -a * 0.75, a * 0.42, a * 1.3, a * 0.42, k === 'ubahn' ? '#e6e9ef' : k === 'parking' ? '#e05858' : '#8fc852'); if (k === 'ubahn') o += box(-a * 0.15, -a * 0.75, a * 0.42, a * 1.3, a * 0.08, '#2f7de1'); if (k === 'bus') o += box(a * 0.5, -a * 0.6, a * 0.3, a * 0.08, a * 0.6, '#cfd5df') + box(a * 0.5, -a * 0.6, a * 0.3, a * 0.5, a * 0.05, '#cfd5df'); if (k === 'parking') o += box(a * 0.5, a * 0.1, a * 0.3, a * 0.5, a * 0.25, '#4f7be8'); o += person(a * 0.6, a * 0.5, cols[4]); }
  else if (/clinic/.test(k)) { o += box(-a * 0.8, -a * 0.6, a * 0.5, a * 0.9, a * 0.22, '#f7f7f7') + box(-a * 0.8, -a * 0.6, a * 0.5, a * 0.18, a * 0.3, '#dfe8f5') + box(a * 0.1, -a * 0.8, a * 0.3, a * 0.2, a * 0.5, '#f4f1ea') + person(-a * 0.1, a * 0.4, '#ffffff') + person(a * 0.4, a * 0.1, cols[0]) + wallScreen(a * 0.1, a * 0.5, '#d94848'); }
  else if (/pool/.test(k)) { o += poly([P(-a * 0.7, -a * 0.7, 0.6), P(a * 0.5, -a * 0.7, 0.6), P(a * 0.5, a * 0.5, 0.6), P(-a * 0.7, a * 0.5, 0.6)], '#4fb6ea') + poly([P(-a * 0.6, -a * 0.6, 0.7), P(a * 0.2, -a * 0.6, 0.7), P(a * 0.2, -a * 0.3, 0.7), P(-a * 0.6, -a * 0.3, 0.7)], '#bfe8ff', ' opacity=".5"') + person(a * 0.7, a * 0.6, cols[1]); }
  else if (/gym/.test(k)) { o += rug('#2a2f38') + box(-a * 0.8, -a * 0.8, a * 0.25, a * 1.4, a * 0.3, '#2a2f38') + box(a * 0.1, -a * 0.6, a * 0.4, a * 0.2, a * 0.16, '#e05858') + box(a * 0.1, a * 0.1, a * 0.4, a * 0.2, a * 0.16, '#4f7be8') + person(-a * 0.2, 0, cols[3]) + person(a * 0.5, a * 0.5, cols[5]); }
  else if (/lab/.test(k)) { o += desk(-a * 0.7, -a * 0.6) + desk(a * 0.05, -a * 0.6) + box(-a * 0.3, a * 0.2, a * 0.5, a * 0.25, a * 0.18, '#dfe3ea') + person(-a * 0.5, -a * 0.2, '#ffffff') + person(a * 0.3, -a * 0.2, cols[2]) + wallScreen(-a * 0.5, a * 0.8); }
  else if (/kiosk|shop/.test(k)) { o += box(-a * 0.2, -a * 0.8, a * 0.3, a * 1.4, a * 0.3, k === 'shop' ? '#8fc852' : '#e6b84a') + shelf(-a * 0.8, a * 1.4) + person(-a * 0.6, -a * 0.1, cols[0]) + person(a * 0.4, a * 0.2, cols[4]) + person(a * 0.6, -a * 0.4, cols[2]); }
  else if (/tower/.test(k)) { [[-0.85, -0.7], [-0.85, 0.1]].forEach(function (q) { o += box(q[0] * a, q[1] * a, a * 0.55, a * 0.5, a * 0.2, '#f4f1ea') + box(q[0] * a, q[1] * a, a * 0.55, a * 0.12, a * 0.34, '#e6b84a'); }); o += desk(a * 0.15, -a * 0.75) + person(a * 0.3, a * 0.3, cols[1]) + shelf(-a * 0.2, a * 0.9); }
  else { o += rug(off ? '#5a6273' : shd(col, 0.3)) + desk(-a * 0.55, -a * 0.6) + desk(a * 0.05, -a * 0.1) + wallScreen(-a * 0.6, a * 0.7) + shelf(a * 0.0, a * 0.8) + person(-a * 0.35, -a * 0.25, cols[R() * 6 | 0]) + person(a * 0.25, a * 0.25, cols[R() * 6 | 0]); if (/house|vip|center|office/.test(k)) o += box(-a * 0.8, a * 0.25, a * 0.25, a * 0.55, a * 0.18, '#e9e4da'); }
  o += plant(a * 0.8, -a * 0.8) + plant(-a * 0.8, a * 0.8) + lamp(-a * 0.82, -a * 0.82);
  return o;
}
function scLabel(x, y, ico, col, name, sub, st) {
  var w = Math.max(118, name.length * 6.6 + 50, sub.length * 5.2 + 50);
  var dot = st === 'on' ? '#8fc852' : st === 'bld' ? '#f0c24b' : st === 'lk' ? '#8a93a3' : '#5ab0ff';
  return '<g class="sclab" transform="translate(' + (x - w / 2).toFixed(1) + ',' + (y - 34).toFixed(1) + ')"><rect width="' + w + '" height="32" rx="9" fill="rgba(12,15,24,.88)" stroke="rgba(255,255,255,.14)"/><rect x="6" y="6" width="20" height="20" rx="6" fill="' + col + '"/><text x="16" y="20.5" text-anchor="middle" font-size="11">' + ico + '</text><text x="34" y="14.5" font-size="10.5" font-weight="800" fill="#fff">' + esc(name) + '</text><circle cx="37" cy="23" r="2.4" fill="' + dot + '"/><text x="43" y="26" font-size="8.6" fill="#b9c2d3">' + esc(sub) + '</text></g>';
}
function campusScene(cfg) {
  var objs = cfg.objs, n = objs.length, W = n > 10 ? 1080 : 940, H = n > 10 ? 780 : 600, cx = W / 2, cy = H / 2 + 22, o = '';
  o += '<defs><radialGradient id="scbg" cx="50%" cy="45%" r="78%"><stop offset="0" stop-color="#6cb84a"/><stop offset=".6" stop-color="#4a9a35"/><stop offset="1" stop-color="#2f6e22"/></radialGradient><pattern id="scgr" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M3 15 l1.5 -5 M9 16 l-1 -6 M14 14 l1.4 -4.5" stroke="#3d8a2a" stroke-width="1.2" stroke-linecap="round"/><circle cx="6" cy="5" r=".9" fill="#7dc95a"/></pattern><radialGradient id="scglow"><stop offset="0" stop-color="#fff2b8" stop-opacity=".75"/><stop offset="1" stop-color="#fff2b8" stop-opacity="0"/></radialGradient><radialGradient id="schub"><stop offset="0" stop-color="#bff07a" stop-opacity=".95"/><stop offset=".35" stop-color="#8fc852" stop-opacity=".55"/><stop offset="1" stop-color="#8fc852" stop-opacity="0"/></radialGradient><linearGradient id="scdisk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3346"/><stop offset="1" stop-color="#151b28"/></linearGradient></defs>';
  var bgU = cfg.bg ? imgOf('bg', cfg.bg) : '';
  if (bgU) o += '<image href="' + esc(bgU) + '" x="0" y="0" width="' + W + '" height="' + H + '" preserveAspectRatio="xMidYMid slice"/>';
  else { o += '<rect width="' + W + '" height="' + H + '" fill="url(#scbg)"/>';
  o += '<rect width="' + W + '" height="' + H + '" fill="url(#scgr)" opacity=".7"/>'; }
  var sd = 7; if (!bgU) for (var i = 0; i < 46; i++) { sd = (sd * 9301 + 49297) % 233280; var sx = sd / 233280 * W; sd = (sd * 9301 + 49297) % 233280; var sy = sd / 233280 * H; if (Math.abs(sx - cx) < 160 && Math.abs(sy - cy) < 90) continue; o += i % 4 ? '<circle cx="' + sx.toFixed(0) + '" cy="' + sy.toFixed(0) + '" r="' + (2 + i % 3) + '" fill="' + ['#f6e05e', '#fff', '#f49ac1'][i % 3] + '" opacity=".75"/>' : '<g transform="translate(' + sx.toFixed(0) + ',' + sy.toFixed(0) + ')"><ellipse cx="0" cy="10" rx="13" ry="5" fill="#000" opacity=".18"/><circle cx="0" cy="0" r="12" fill="#2f7d24"/><circle cx="-4" cy="-4" r="7" fill="#45a033"/></g>'; }
  // Positionen
  var pos = [], inner = n > 10 ? Math.ceil(n * 0.42) : n;
  var place = function (cnt, rx, ry, off) { for (var j = 0; j < cnt; j++) { var ang = -Math.PI / 2 + off + j * 2 * Math.PI / cnt; pos.push([cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry, ang]); } };
  if (n > 10) { place(inner, 275, 168, 0.2); place(n - inner, 462, 300, 0); } else place(n, Math.min(360, 220 + n * 18), Math.min(215, 130 + n * 10), 0);
  var a = n > 10 ? 34 : n > 6 ? 40 : 46;
  // Straßen
  var roads = '';
  pos.forEach(function (p, j) { var it = cfg.state(objs[j][0]); roads += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + (p[1] + a * 0.4).toFixed(1) + '" stroke="#1a2030" stroke-width="16" stroke-linecap="round"/><line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + (p[1] + a * 0.4).toFixed(1) + '" stroke="' + (it === 'on' ? '#8fc852' : '#ffffff') + '" stroke-opacity="' + (it === 'on' ? 0.45 : 0.12) + '" stroke-width="1.4" stroke-dasharray="6 7"/>'; if (it === 'on') roads += '<circle r="3" fill="#bff07a"><animateMotion dur="' + (3 + j % 4) + 's" repeatCount="indefinite" path="M' + cx + ' ' + cy + ' L' + p[0].toFixed(1) + ' ' + (p[1] + a * 0.4).toFixed(1) + '"/></circle>'; });
  o += roads;
  // Hub
  var built = objs.filter(function (q) { return cfg.state(q[0]) === 'on'; }).length;
  o += '<ellipse cx="' + cx + '" cy="' + (cy + 10) + '" rx="120" ry="58" fill="#000" opacity=".45"/><ellipse cx="' + cx + '" cy="' + cy + '" rx="112" ry="54" fill="url(#scdisk)" stroke="#3a4560" stroke-width="2"/>';
  [92, 74, 56].forEach(function (r, i) { o += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + (r * 0.48) + '" fill="none" stroke="#8fc852" stroke-opacity="' + (0.25 + i * 0.2) + '" stroke-width="' + (1 + i * 0.6) + '"><animate attributeName="stroke-opacity" values="' + (0.15 + i * 0.15) + ';' + (0.6 + i * 0.1) + ';' + (0.15 + i * 0.15) + '" dur="' + (2.4 + i * 0.7) + 's" repeatCount="indefinite"/></ellipse>'; });
  o += '<ellipse cx="' + cx + '" cy="' + (cy - 6) + '" rx="70" ry="44" fill="url(#schub)"/><line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - 60) + '" stroke="#bff07a" stroke-opacity=".5" stroke-width="2"/>';
  o += '<image href="' + ownLogo() + '" x="' + (cx - 26) + '" y="' + (cy - 96) + '" width="52" height="52"/>';
  o += '<g transform="translate(' + (cx - 80) + ',' + (cy + 26) + ')"><rect width="160" height="34" rx="9" fill="rgba(12,15,24,.9)" stroke="rgba(143,200,82,.5)"/><text x="80" y="15" text-anchor="middle" font-size="10" font-weight="900" fill="#bff07a" letter-spacing="1.5">' + esc(cfg.hub.toUpperCase()) + '</text><text x="80" y="27" text-anchor="middle" font-size="8.6" fill="#b9c2d3">' + built + ' / ' + n + ' ' + esc(cfg.unit || 'Bereiche') + ' aktiv</text></g>';
  // Räume (hinten zuerst)
  var order = pos.map(function (p, j) { return j; }).sort(function (x, y) { return pos[x][1] - pos[y][1]; });
  order.forEach(function (j) {
    var q = objs[j], p = pos[j], st = cfg.state(q[0]), col = SCPAL[j % SCPAL.length], ico = SCICO[q[2]] || '🏢';
    var sub = cfg.sub(q[0], st);
    o += '<g class="yo sc ' + st + '" data-id="' + q[0] + '" onmouseenter="' + cfg.fn + '(\'' + q[0] + '\')" onclick="' + cfg.fn + '(\'' + q[0] + '\',1)">' + '<g class="scr">' + scRoom(p[0], p[1], a, col, q[2], j * 37 + 11, st === 'lk') + '</g>';
    if (st === 'off' || st === 'lk') { var c0 = isoP(p[0], p[1], 0.15 * a, 0.15 * a, 2); o += '<circle cx="' + c0[0] + '" cy="' + c0[1] + '" r="13" fill="rgba(12,15,24,.85)" stroke="' + (st === 'lk' ? '#8a93a3' : '#8fc852') + '" stroke-width="1.6" stroke-dasharray="3 3"/><text x="' + c0[0] + '" y="' + (c0[1] + 5) + '" text-anchor="middle" font-size="' + (st === 'lk' ? 12 : 16) + '" font-weight="900" fill="' + (st === 'lk' ? '#c3cad6' : '#8fc852') + '">' + (st === 'lk' ? '🔒' : '+') + '</text>'; }
    if (st === 'bld') o += '<text x="' + p[0] + '" y="' + (p[1] - a * 0.9) + '" text-anchor="middle" font-size="18">🏗️</text>';
    o += scLabel(p[0], p[1] - a * 1.35, ico, st === 'lk' ? '#4a5263' : col, q[1], sub, st) + '</g>';
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="ymap scene">' + o + '</svg>';
}
function itemSt(id, items) { var it = (items || V.infra.items || []).filter(function (x) { return x.id === id; })[0]; if (!it) return 'lk'; return it.built ? 'on' : it.building ? 'bld' : (it.locked || V.mlvl < (it.flvl || 1)) ? 'lk' : 'off'; }
function itemSub(id, st) { var it = (V.infra.items || []).filter(function (x) { return x.id === id; })[0]; if (!it) return ''; return st === 'on' ? (it.upOk ? 'Stufe ' + (it.upg || 1) + '/10' : 'in Betrieb') : st === 'bld' ? 'im Bau · fertig ' + dFull(it.building) : st === 'lk' ? (V.mlvl < (it.flvl || 1) ? 'ab Level ' + it.flvl : 'braucht ' + (it.reqName || '…')) : eurK(it.cost) + ' · kaufen'; }

var YOBJ = [['aplatz', 'Trainingsplatz', 'pitchS'], ['jzentrum', 'Jugendzentrum', 'center'], ['internat', 'Internat', 'tower'], ['agym', 'Academy-Gym', 'gym'], ['astadion', 'Academy-Stadion', 'arena'], ['sprachschule', 'Sprachschule', 'lang'], ['bushalt', 'Bushaltestelle', 'bus'], ['ubahn', 'U-Bahn', 'ubahn']];
function youthMap() { return campusScene({ objs: YOBJ, fn: 'yoHover', hub: 'Academy Campus', unit: 'Gebäude', bg: 'karte_academy', state: function (id) { return itemSt(id); }, sub: itemSub }); }
function yoHover(id, click) { isoInfo(id, 'yoinfo', click); }
function tJugend() {
  var cap = V.youthCap || 3, full = V.youth.length >= cap;
  var talents = '<div class="box"><h3>🌱 Talente (' + V.youth.length + ' / ' + cap + ')</h3><div class="xs muted" style="margin:-4px 0 8px">🏃 Pro Woche darf <b>ein</b> Talent bei der Ersten mittrainieren' + (V.ytrDone ? ' – diese Woche erledigt ✓' : '') + '. +/− = Entwicklung seit Saisonbeginn.' + (full ? ' <b style="color:#e25c5c">Academy voll</b>' : '') + '</div>' + (V.youth.length ? V.youth.slice().sort(function (a, b) { return b.talHi - a.talHi || b.str - a.str; }).map(function (y) {
    var can = y.age >= 16;
    return '<div class="yrow"><span class="pb ' + y.pos + '">' + y.pos + '</span><div style="min-width:0"><div class="row sp" style="gap:6px"><b class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(y.n) + '</b><span class="row" style="gap:3px">' + strBox(y.str) + '<span class="dS" style="color:' + (y.dS > 0 ? '#5fbf3a' : y.dS < 0 ? '#e25c5c' : '#888') + '">' + (y.dS > 0 ? '+' : '') + String(y.dS || 0).replace('.', ',') + '</span></span></div><div class="row xs" style="margin-top:3px;gap:6px;flex-wrap:wrap"><span class="wchip tip" data-tip="' + ytip(y) + '">' + y.age + ' J.</span>' + stars(y.talLo, y.talHi) + '<span class="row" style="gap:4px"><button class="sm ybt" title="Trainiert diese Woche bei der Ersten mit (kleiner Stärke-Bonus)" ' + (V.ytrDone ? 'disabled' : '') + ' onclick="act(\'youthTrain\',{yid:' + y.id + '})">🏃</button><button class="sm ybt red" title="Verabschieden" onclick="act(\'dropyouth\',{yid:' + y.id + '})">✕</button><button class="sm ybt ' + (can ? 'pri' : '') + '" ' + (can ? '' : 'disabled') + ' title="' + (can ? 'In die Erste holen' : 'Ab 16 Jahren') + '" onclick="act(\'promote\',{yid:' + y.id + '})">⬆</button></span></div></div></div>';
  }).join('') : '<div class="muted small">Neue Talente kommen zum Saisonstart.</div>') + '<div class="xs muted" style="margin-top:6px">Ab 16 in die Erste, mit 19 verlassen sie die Academy.' + (V.youthNext ? ' ' + V.youthNext + ' Talent(e) unterwegs.' : '') + '</div></div>';
  var ai = (V.infra.items || []).filter(function (x) { return YOBJ.some(function (q) { return q[0] === x.id; }); });
  var map = isoWrap('🏫 Academy Campus', youthMap(), 'yoinfo') + (ai.length ? '<div class="box"><h3>🏗️ Academy-Erweiterungen</h3><div class="grid g4">' + ai.map(function (it) { return itemCard(it, 'Academy'); }).join('') + '</div></div>' : '');
  return L4(academyTeams(), map, talents);
}

/* ===================================================================== Kalender */
function tKal() {
  if (!ST.calMonth) ST.calMonth = V.date.slice(0, 7);
  var ym = ST.calMonth, y = +ym.slice(0, 4), m = +ym.slice(5, 7);
  var first = new Date(Date.UTC(y, m - 1, 1)); var start = (first.getUTCDay() + 6) % 7; var dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  var byDay = {}; V.games.forEach(function (g) { (byDay[g.d] = byDay[g.d] || []).push(g); });
  var evDay = {}; (V.dayEv || []).forEach(function (e) { evDay[e.d] = e; var nd = e.k === 'camp3' ? 3 : e.k === 'camp5' ? 5 : 1; for (var q = 1; q < nd; q++) { var dq = addD(e.d, q); if (!evDay[dq]) evDay[dq] = Object.assign({}, e, { name: '⛺ ' + e.name.replace(/\s*\(.*\)/, '') + ' · Tag ' + (q + 1) + '/' + nd, cont: true }); } });
  var mn = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][m - 1];
  var h = '<div class="box"><div class="row sp"><button class="sm" onclick="calNav(-1)">◀</button><b>' + mn + ' ' + y + '</b><button class="sm" onclick="calNav(1)">▶</button></div><div class="cal" style="margin-top:10px">' + ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(function (x, i) { return '<div class="h' + (i >= 5 ? ' we' : '') + '">' + x + '</div>'; }).join('');
  for (var i = 0; i < start; i++) h += '<div class="d o"></div>';
  for (var d = 1; d <= dim; d++) {
    var ds = ym + '-' + String(d).padStart(2, '0'); var ev = byDay[ds] || []; var de = evDay[ds];
    var inCamp = V.camp && ds >= V.camp.from && ds <= V.camp.to;
    var wdn = (start + d - 1) % 7, isWe = wdn >= 5; var trn = false;
    h += '<div class="d ' + (ds === V.date ? 'today ' : '') + (ds < V.date ? 'past ' : '') + (isWe ? 'we' : '') + '" onclick="dayClick(\'' + ds + '\')"><span class="n">' + d + '</span>' + (trn ? '<span title="Training" style="position:absolute;right:4px;bottom:2px;font-size:26px">🏃</span>' : '') +
      ev.map(function (g) { var cn = g.comp === 'liga' ? 'Liga' : g.comp === 'test' ? (g.label === 'Benefizspiel' ? 'Benefiz' : 'Test') : g.comp === 'rel' ? 'Relegation' : g.comp === 'kp' ? 'Kreispokal' : g.comp === 'mrp' ? VPN() : g.comp === 'dfb' ? 'PRO Pokal' : 'Pokal', cc = g.comp === 'liga' ? '#2f6fd6' : g.comp === 'test' ? '#6b7280' : g.comp === 'rel' ? '#c0392b' : '#c58a12'; return '<div class="calg">' + crest(g.opp) + '<span class="mark" style="--rot:' + (((ds.charCodeAt(9) * 5) % 7) - 3) + 'deg;--mc:' + cc + '">' + cn + ' (' + (g.home === false ? 'A' : 'H') + ')</span>' + (g.gf != null ? '<b class="xs" style="margin-left:2px">' + g.gf + ':' + g.ga + '</b>' : '') + '</div>'; }).join('') + (de ? '<span class="mark" style="--rot:' + (((ds.charCodeAt(9) * 7) % 9) - 5) + 'deg;--mc:' + (MARKC[de.k] || '#e8457a') + '">' + esc(de.name.replace(/„|“/g, '')) + '</span>' : '') + (inCamp ? '<span class="mark" style="--rot:-3deg;--mc:#3b82f6">⛺ Trainingslager</span>' : '') + (!ev.length && !de && !inCamp && ds > V.date ? '<span class="dplus">+</span>' : '') + '</div>';
  }
  h += '</div></div>';
  var list = V.games.filter(function (g) { return g.d.slice(0, 7) === ym; });
  var DE = V.dayEvDefs, KS = ['eroeffnung', 'fan', 'kids', 'sponsor', 'benefiz', 'gala', 'foerder', 'weihnacht', 'abschluss', 'halle', 'camp3', 'camp5'].filter(function (k) { return DE[k]; });
  var tot = 0, dn = 0; KS.forEach(function (k) { tot += DE[k].max; dn += Math.min(DE[k].max, DE[k].used); }); var pc = tot ? Math.round(dn / tot * 100) : 0;
  var CAL = h; h = '';
  h += '<div class="box" style="margin:0"><h3>📅 Spiele im ' + mn + '</h3>' + (list.length ? list.map(gameLine).join('') : '<div class="muted small">Keine Spiele.</div>') + '</div>'; var GM = h; h = '';
  h += '<div class="box" style="margin:0"><div class="row sp"><h3 style="margin:0">📌 Vereinstermine</h3><b class="small">' + dn + ' / ' + tot + '</b></div>' + bar(pc, 100, pc >= 75 ? 'var(--g)' : pc >= 40 ? 'var(--y)' : 'var(--r)') + '<div style="margin-top:8px">' + KS.map(function (k) { var e = DE[k], u = Math.min(e.max, e.used), ok = u >= e.max; return '<div class="row sp small" style="padding:6px 0;border-top:1px solid var(--linie)"><span>' + (ok ? '✅' : '⬜') + ' ' + esc(e.n.replace(/„|“/g, '')) + '</span><span class="row" style="gap:6px;align-items:center"><span style="display:inline-block;width:54px;height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden"><i style="display:block;height:100%;width:' + (u / e.max * 100) + '%;background:' + (ok ? 'var(--g)' : 'var(--y)') + '"></i></span><b class="xs">' + u + '/' + e.max + '</b></span></div>'; }).join('') + '</div></div>';
  if (V.prepCan) h = '<div class="box sm1"><h3>🗓️ Vorbereitung</h3><div class="xs muted">Geplante Testspiele und Trainingslager/Halle der aktuellen Vorbereitung absagen (50 % der Kosten zurück).</div><button class="sm red" style="width:100%;margin-top:8px" onclick="if(confirm(\'Vorbereitung wirklich abbrechen?\'))act(\'prepCancel\',{})">Vorbereitung abbrechen</button></div>' + h;
  return L4(GM, CAL, h);
}
function dayEvDo(ds, k) {
  if (k !== 'benefiz') return act('dayEvent', { d: ds, k: k });
  act('dayEvent', { d: ds, k: k }, { quiet: true }).then(function (r) { if (!r || !r.reveal) return; var R0 = r.reveal, n = 3;
  pop('<div style="text-align:center"><div class="xs muted" style="letter-spacing:.14em;font-weight:800">BENEFIZSPIEL · ' + dFull(ds) + '</div><h2 style="padding:0;margin:6px 0">' + RX('Wer kommt ins Ländchen?') + '</h2><div id="bfcd" style="font-size:72px;font-weight:900;color:#e8622c;line-height:1.1;margin:10px 0">3</div><div class="small muted">1.–3. Liga – die Lose sind gezogen …</div></div>', { lock: true });
  var t = setInterval(function () { n--; var el = $('#bfcd'); if (!el) return clearInterval(t); if (n > 0) { el.textContent = n; return; } clearInterval(t);
    $('#pop').innerHTML = '<div class="evw" style="text-align:center"><div class="xs muted" style="letter-spacing:.14em;font-weight:800">BENEFIZSPIEL · ' + dFull(ds) + '</div><div style="margin:14px auto 6px;width:90px;height:90px">' + crest(R0.opp, 'cbig') + '</div><h2 style="padding:0;margin:4px 0">' + esc(R0.opp) + '</h2><span class="pill y" style="font-size:13px">' + esc(R0.liga) + '</span><div class="small" style="margin:12px 0">Volle Hütte garantiert! Die Einnahmen gibt es nach dem Spiel – je höher die Liga des Gegners, desto mehr.</div><button class="pri" onclick="closePop();renderTab()">Super!</button></div>';
    try { fwBurst(); } catch (e) {} }, 1000);
  });
}
function calNav(k) { var y = +ST.calMonth.slice(0, 4), m = +ST.calMonth.slice(5, 7) + k; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } ST.calMonth = y + '-' + String(m).padStart(2, '0'); renderTab(); }
var TEST = { d: null, home: true };
function dayClick(ds) {
  var g = V.games.filter(function (x) { return x.d === ds; });
  var de = (V.dayEv || []).filter(function (x) { return x.d === ds; })[0];
  var mon = +ds.slice(5, 7); var DE = V.dayEvDefs;
  var row = function (k) { var e = DE[k]; if (!e) return ''; var okM = !e.months || e.months.indexOf(mon) >= 0; var left = e.max - e.used; var dis = !okM || left <= 0 || V.pots.cash < e.cost; return '<div class="row sp" style="padding:8px 0;border-top:1px solid var(--linie)"><div style="min-width:0"><b class="small">' + esc(e.n) + '</b><div class="xs muted">' + esc(e.d) + (!okM ? ' · nur ' + e.months.map(function (x) { return ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][x - 1]; }).join('/') : '') + ' · noch ' + Math.max(0, left) + '× diese Saison</div></div><button class="sm ' + (dis ? '' : 'pri') + '" ' + (dis ? 'disabled' : '') + ' onclick="dayEvDo(\'' + ds + '\',\'' + k + '\')">' + (e.cost ? eur(e.cost) : 'gratis') + '</button></div>'; };
  if (g.length) return pop('<h2>' + dF(ds) + '</h2>' + g.map(gameLine).join('') + (g.some(function (x) { return x.comp === 'test' && x.gf == null; }) && ds > V.date ? '<button class="sm red" style="width:100%;margin-top:12px" onclick="closePop();act(\'dayEvDel\',{d:\'' + ds + '\'})">🗑️ Testspiel absagen</button>' : '') + (ds === V.date && V.matchToday ? '<button class="pri" style="width:100%;margin-top:12px" onclick="closePop();matchDay()">⚽ MatchDay</button>' : '') + (de ? '<div class="small" style="margin-top:10px">Am Spieltag geplant: <b>' + esc(de.name) + '</b></div>' : ds > V.date ? '<div style="margin-top:12px"><b class="small">🎉 Am Spieltag ansetzen</b>' + ['fan', 'sponsor', 'gala', 'foerder'].map(row).join('') + '</div>' : ''));
  if (de) return pop('<h2>' + dF(ds) + '</h2><div class="small">Geplant: <b>' + esc(de.name) + '</b></div>' + (!de.done && ds > V.date ? '<button class="sm red" style="width:100%;margin-top:12px" onclick="closePop();act(\'dayEvDel\',{d:\'' + ds + '\'})">🗑️ Termin löschen' + (de.k === 'benefiz' ? ' (80 % zurück)' : ' (Kosten zurück)') + '</button>' : ''), { white: true });
  if (ds <= V.date) return pop('<h2>' + dF(ds) + '</h2><div class="small muted">' + (ds === V.date ? 'Heute ist nichts geplant. Planen kannst du ab morgen.' : 'Dieser Tag liegt in der Vergangenheit.') + '</div>');
  var mon = +ds.slice(5, 7); var DE = V.dayEvDefs;
  var row = function (k) { var e = DE[k]; var okM = !e.months || e.months.indexOf(mon) >= 0; var left = e.max - e.used; var dis = !okM || left <= 0 || V.pots.cash < e.cost; return '<div class="row sp" style="padding:8px 0;border-top:1px solid var(--linie)"><div style="min-width:0"><b class="small">' + esc(e.n) + '</b><div class="xs muted">' + esc(e.d) + (!okM ? ' · nur ' + e.months.map(function (x) { return ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][x - 1]; }).join('/') : '') + ' · noch ' + Math.max(0, left) + '× diese Saison</div></div><button class="sm" ' + (dis ? 'disabled' : '') + ' onclick="act(\'dayEvent\',{d:\'' + ds + '\',k:\'' + k + '\'})"><span class="neg">' + eur(e.cost) + '</span></button></div>'; };
  var h = '<h2>' + dF(ds) + ' ' + ds.slice(0, 4) + '</h2><div class="small muted">Was soll an diesem Tag passieren?</div>';
  h += '<div style="margin-top:8px"><b class="small">⚽ Testspiel</b>' + (has('testspiele') ? '<div class="row" style="margin-top:6px"><button class="sm" onclick="testPop(\'' + ds + '\')">Gegner suchen</button></div>' : '<div class="xs muted">🔒 ab Level ' + MGR.featLvl('testspiele') + '</div>') + '</div>';
  h += '<div style="margin-top:10px"><b class="small">🏃 Trainingslager</b>' + (has('trainingslager') ? row('camp3') + row('camp5') + (V.dayEvDefs.halle ? row('halle') : '') : '<div class="xs muted">🔒 ab Level ' + MGR.featLvl('trainingslager') + '</div>') + '</div>';
  h += '<div style="margin-top:10px"><b class="small">🎉 Vereinsleben</b>' + ['eroeffnung', 'fan', 'kids', 'sponsor', 'benefiz', 'gala', 'foerder', 'weihnacht', 'abschluss'].map(row).join('') + '</div>';
  pop(h);
}
function testPop(ds) {
  TEST = { d: ds, home: true };
  pop('<h2>Testspiel am ' + dF(ds) + '</h2><div class="seg" style="margin:6px 0 10px"><button class="on" id="th" onclick="TEST.home=true;this.classList.add(\'on\');$(\'#ta2\').classList.remove(\'on\')">Heim</button><button id="ta2" onclick="TEST.home=false;this.classList.add(\'on\');$(\'#th\').classList.remove(\'on\')">Auswärts</button></div><div class="xs muted">Stärkere Gegner sagen öfter ab. Testspiele bringen Form, etwas Geld und Spielpraxis.</div><div class="plist" style="margin-top:8px">' +
    V.tests.map(function (o, i) { return '<div class="pl" style="grid-template-columns:minmax(0,1fr) auto" onclick="act(\'test\',{d:TEST.d,opp:V.tests[' + i + '].n,home:TEST.home})"><div class="tn">' + crest(o.n) + '<div style="min-width:0"><b>' + esc(o.n) + '</b><div class="meta"><span>' + esc(o.liga) + '</span><span>Stärke ' + Math.round(o.s) + '</span></div></div></div><span class="pill ' + (o.chance >= 70 ? 'g' : o.chance >= 40 ? 'y' : 'r') + '">' + o.chance + ' %</span></div>'; }).join('') + '</div>');
}

/* ===================================================================== Liga */
function tableHTML(rows, mini) {
  return '<table class="t"><tr><th>#</th><th>Verein</th><th class="num">Sp</th>' + (mini ? '' : '<th class="num hm">S-U-N</th><th class="num">Tore</th>') + '<th class="num">Diff</th><th class="num">Pkt</th>' + (mini ? '' : '<th class="hm">Form</th>') + '</tr>' +
    rows.map(function (r) { return '<tr class="' + (r.svw ? 'me ' : '') + (r.rank === 1 && r.sp ? 'z-first ' : '') + (r.zone ? 'z-' + r.zone : '') + '" style="' + (r.click ? 'cursor:pointer' : '') + '" ' + (r.click ? 'onclick="teamPop(\'' + esc(r.n).replace(/'/g, "\\'") + '\',' + r.click + ')"' : '') + '><td>' + r.rank + '</td><td><div class="tn">' + crest(r.n) + '<span class="n">' + esc(r.n) + '</span></div></td><td class="num">' + r.sp + '</td>' + (mini ? '' : '<td class="num hm">' + r.s + '-' + r.u + '-' + r.nl + '</td><td class="num">' + r.tore + '</td>') + '<td class="num">' + (r.diff > 0 ? '+' : '') + r.diff + '</td><td class="num"><b>' + r.pts + '</b></td>' + (mini ? '' : '<td class="form hm">' + r.form.map(function (f) { return '<i class="' + f + '"></i>'; }).join('') + '</td>') + '</tr>'; }).join('') + '</table>';
}
function tLiga() {
  var Z = V.zones, lvl = ST.ligaLvl || V.lvl; var LV = MGR.leagueView(S, D, lvl); if (!LV) { lvl = V.lvl; LV = MGR.leagueView(S, D, lvl); }
  var own = lvl === V.lvl, md = ST.md && ST.mdLvl === lvl ? ST.md : LV.md.cur; md = Math.max(1, Math.min(LV.md.max, md)); var list = LV.byMd[md] || [];
  var rows = (own ? V.table : LV.rows).map(function (r, i) { var o = {}; for (var k in r) o[k] = r[k]; if (!o.svw) o.click = lvl; o.rank = o.rank || i + 1; if (o.diff == null) o.diff = (o.tf || 0) - (o.ta || 0); o.form = o.form || []; o.tore = o.tore || ((o.tf || 0) + ':' + (o.ta || 0)); o.sp = o.sp != null ? o.sp : (o.s + o.u + o.nl); return o; });
  var h = '<div class="box"><div class="row sp wr"><h3 style="margin:0">' + esc(own ? V.ligaK : LV.short) + ' · Saison ' + V.season + '</h3>' + (own ? '' : '<span class="pill">Fremde Liga</span>') + '</div>' + tableHTML(rows) +
    (own ? '<div class="row wr small muted" style="margin-top:8px;gap:12px">' + (Z.up ? '<span><span style="color:var(--g)">■</span> Aufstieg (' + Z.up + ')</span>' : '') + (Z.upRel ? '<span><span style="color:rgba(143,200,82,.5)">■</span> Aufstiegsrelegation</span>' : '') + (Z.downRel ? '<span><span style="color:rgba(226,92,92,.5)">■</span> Abstiegsrelegation</span>' : '') + (Z.down ? '<span><span style="color:var(--r)">■</span> Abstieg (' + Z.down + ')</span>' : '') + '</div>' : '') + '</div>';
  var TBL = h; h = '';
  h += '<div class="box"><div class="row sp"><button class="sm" style="padding:2px 8px;font-size:11px;min-width:0" onclick="ST.mdLvl=' + lvl + ';ST.md=' + Math.max(1, md - 1) + ';renderTab()">◀</button><b>' + md + '. Spieltag</b><button class="sm" style="padding:2px 8px;font-size:11px;min-width:0" onclick="ST.mdLvl=' + lvl + ';ST.md=' + Math.min(LV.md.max, md + 1) + ';renderTab()">▶</button></div>' +
    list.map(function (f) { var gd = f.svw ? V.games.filter(function (g) { return g.comp === 'liga' && g.opp === (f.h === V.club ? f.a : f.h) && (g.home !== false) === (f.h === V.club); })[0] : null; return '<div class="row sp small' + (gd ? ' hasdate' : '') + '"' + (gd ? ' data-d="' + dF(gd.d) + '"' : '') + ' style="padding:6px 0;border-top:1px solid var(--linie);' + (f.svw ? 'font-weight:700' : '') + '"><span class="tn" style="flex:1;min-width:0;justify-content:flex-end;text-align:right;gap:8px"><span class="n">' + esc(f.h) + '</span>' + crest(f.h) + '</span><b style="width:46px;text-align:center">' + (f.hg == null ? '–:–' : f.hg + ':' + f.ag) + '</b><span class="tn" style="flex:1;min-width:0;gap:8px">' + crest(f.a) + '<span class="n">' + esc(f.a) + '</span></span></div>'; }).join('') + '</div>';
  var W = V.world[lvl];
  h += '<div class="box"><div class="row sp wr"><h3 style="margin:0">🗺️ Ligen-Übersicht</h3><select class="sel" onchange="ST.ligaLvl=+this.value;ST.md=null;renderTab()">' + Object.keys(V.world).map(function (k) { return '<option value="' + k + '" ' + (+k === lvl ? 'selected' : '') + '>' + esc(V.world[k].short) + (+k === V.lvl ? ' (eigene)' : '') + '</option>'; }).join('') + '</select></div>' +
    '<table class="t" style="margin-top:8px"><tr><th>Verein</th><th class="num">Stärke</th></tr>' +
    (W ? W.teams.map(function (t) { var c = t.rating === 'Aufstiegsfavorit' || t.rating === 'Wir' ? 'g' : t.rating === 'Abstiegskandidat' ? 'r' : ''; return '<tr class="' + (t.svw ? 'me' : '') + '"><td><div class="tn">' + crest(t.n) + '<span class="n">' + esc(t.n) + '</span></div></td><td class="num">' + strBox(t.str, true) + '</td></tr>'; }).join('') : '') + '</table></div>';
  var C1 = h; h = '';
  var tb = function (t, T, fmt) { var l = T.top.map(function (x) { return '<div class="row sp small" style="padding:5px 0;border-top:1px solid var(--linie);gap:6px;' + (x.own ? 'color:var(--g);font-weight:700' : '') + '"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>' + x.rank + '.</b> ' + esc(x.n) + '<span class="xs muted"> · ' + esc(x.team) + '</span></span>' + fmt(x.v) + '</div>'; }).join(''); if (T.mine) l += '<div class="row sp small" style="padding:5px 0;border-top:1px dashed var(--linie);color:var(--g);font-weight:700;gap:6px"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.mine.rank + '. ' + esc(T.mine.n) + '</span>' + fmt(T.mine.v) + '</div>'; return '<div class="box"><h3>' + t + '</h3>' + (l || '<div class="small muted">Noch keine Daten.</div>') + '</div>'; };
  h += tb('⭐ Beste Spieler (Note)', LV.top.gr, function (v) { return gradeBox(v); }) + tb('⚽ Torjäger', LV.top.g, function (v) { return '<b>' + v + '</b>'; }) + tb('👟 Vorlagen', LV.top.a, function (v) { return '<b>' + v + '</b>'; }) + (LV.top.tw ? tb('🧤 Bester Torwart', LV.top.tw, function (v) { return '<b>' + String(v).replace('.', ',') + '</b>'; }) : '');
  var C4 = h; h = '';
  if (V.hist.length && own) h += '<div class="box"><h3>Vereinsgeschichte</h3><table class="t"><tr><th>Saison</th><th>Liga</th><th class="num">Platz</th><th class="num">Pkt</th><th>Ergebnis</th></tr>' + V.hist.slice().reverse().map(function (x) { return '<tr><td>' + x.season + '/' + String(x.season + 1).slice(2) + '</td><td>' + esc(lsh(x.liga)) + '</td><td class="num">' + x.rank + '.</td><td class="num">' + x.pts + '</td><td><span class="pill ' + (x.result === 'Aufstieg' ? 'g' : x.result === 'Abstieg' ? 'r' : '') + '">' + x.result + '</span> ' + (x.goalOk ? '✅' : '❌') + '</td></tr>'; }).join('') + '</table></div>';
  return L4(C1, TBL + h, C4);
}
function cupTop(seg, title) {
  var T = (V.topCup || {})[seg] || [];
  var val = function (p) { return seg === 'lt' ? '<span class="grd ' + gradeCls(p.avg) + '">' + gtx(p.avg) + '</span>' : seg === 'tore' ? '<b>' + p.g + '</b> ' + (p.g === 1 ? 'Tor' : 'Tore') : '<b>' + p.a + '</b> ' + (p.a === 1 ? 'Vorlage' : 'Vorlagen'); };
  return '<div class="box sm1"><h3>' + title + '</h3>' + (T.length ? T.map(function (p, i) { return '<div class="row sp" style="padding:6px 0;border-top:1px solid var(--linie);cursor:pointer;gap:6px" onclick="playerPop(' + p.id + ')"><div class="row" style="min-width:0;gap:6px"><span style="width:18px">' + ['🥇', '🥈', '🥉'][i] + '</span><span class="pb ' + p.pos + '">' + p.pos + '</span><b class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.n) + '</b></div><span class="small" style="white-space:nowrap">' + val(p) + '</span></div>'; }).join('') : '<div class="muted xs">Noch keine Pokalspiele.</div>') + '</div>';
}
function tPokal() {
  var C1 = cupTop('lt', '⭐ Leistungsträger (Pokal)') + cupTop('tore', '⚽ Torschützen (Pokal)') + cupTop('vorl', '👟 Vorlagen (Pokal)');
  var W = (V.achv || []).filter(function (a) { return /^pokal_/.test(a.k); });
  var C4 = '<div class="box"><h3>🏆 Pokalerfolge</h3>' + (W.length ? W.map(function (a) { return '<div class="row sp small" style="padding:6px 0;border-top:1px solid var(--linie);gap:6px"><b>🏆 ' + esc(a.title) + '</b><span class="xs muted">' + esc(a.season) + '</span></div>'; }).join('') : '<div class="muted xs">Noch kein Pokalsieg – das kann sich ändern!</div>') + '</div>';
  if (!V.cups.length) return L4(C1, '<div class="box"><h3>🏆 Pokal</h3><div class="muted">Diese Saison seid ihr in keinem Pokal vertreten.</div></div>', C4);
  var RN = ['1. Runde', '2. Runde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];
  var TREES = [], LIST = '<div class="box"><h3>🏆 Pokalwettbewerbe</h3>' + V.cups.map(function (c) {
    var tieH = function (t, done) { var hw = done && t.w === t.h, aw = done && t.w === t.a; return '<div class="bt' + (t.own || t.h === V.club || t.a === V.club ? ' own' : '') + (t.d ? ' hasdate" data-d="' + dF(t.d) : '') + '"><div class="r"><span class="tn" style="min-width:0">' + crest(t.h) + '<span class="n ' + (hw ? 'w' : '') + '">' + esc(t.h) + '</span></span><b>' + (done ? t.hg : '') + '</b></div><div class="r"><span class="tn" style="min-width:0">' + crest(t.a) + '<span class="n ' + (aw ? 'w' : '') + '">' + esc(t.a) + '</span></span><b>' + (done ? t.ag : '') + '</b></div>' + (done && t.pen ? '<div class="xs muted">' + esc(t.pen) + '</div>' : '') + '</div>'; };
    var cur = c.hist.length; var h = '<div class="cupsec"><div class="row sp"><h3 style="margin:0;font-size:15px">' + esc(c.name) + '</h3>' + (c.won ? '<span class="pill g">Pokalsieger</span>' : c.alive ? '' : '<span class="pill r">Ausgeschieden</span>') + '</div>';
    if (false) h += '<div class="hint">Nächste Runde: <b>' + esc(c.next.round) + '</b> am ' + dF(c.next.d) + ' gegen <b>' + esc(c.next.opp) + '</b> (' + esc(c.next.oppLiga) + ', ' + (c.next.home === null ? 'Finale' : c.next.home ? 'Heim' : 'Auswärts') + ')</div>';
    if (c.winner) h += '<div class="hint" style="text-align:center">🏆 Pokalsieger: <b>' + esc(c.winner) + '</b></div>';
    var openT = c.ties.slice(); if (c.next) openT.unshift({ h: c.next.home === false ? c.next.opp : V.club, a: c.next.home === false ? V.club : c.next.opp, own: true, d: c.next.d });
    var early = c.hist.filter(function (_, i) { return i < 3; });
    var tabs = c.hist.map(function (r, i) { return [r.name, r.ties, true]; }); if (openT.length) tabs.push([RN[Math.min(5, cur)], openT, false]);
    var sel = ST['cupR' + c.k] != null ? ST['cupR' + c.k] : Math.min(tabs.length - 1, 2) === tabs.length - 1 ? tabs.length - 1 : tabs.length - 1; sel = Math.min(sel, tabs.length - 1);
    var early2 = tabs.filter(function (t, i) { return i < 3; });
    if (early2.length) {
      var si = Math.min(sel, early2.length - 1); if (sel > 2) si = early2.length - 1;
      h += '<div class="subnav" style="margin-top:12px">' + early2.map(function (t, i) { return '<button class="' + (i === si ? 'on' : '') + '" onclick="ST.cupR' + c.k + '=' + i + ';renderTab()">' + esc(t[0]) + (t[2] ? '' : ' · offen') + '</button>'; }).join('') + '</div>';
      var T = early2[si]; h += '<div class="grid g4" style="gap:7px">' + T[1].map(function (t) { return tieH(t, T[2]); }).join('') + '</div>';
    }
    // Baum ab Viertelfinale
    var col = function (ri, n) { var t = tabs[ri]; var arr = t ? t[1].slice() : []; arr.sort(function (a, b) { return (b.own ? 1 : 0) - (a.own ? 1 : 0); }); while (arr.length < n) arr.push(null); return '<div class="col"><div class="xs muted" style="text-align:center;font-weight:700">' + RN[ri] + '</div>' + arr.slice(0, n).map(function (x) { return x ? tieH(x, t[2]) : '<div class="bt" style="opacity:.35"><div class="r"><span>—</span></div><div class="r"><span>—</span></div></div>'; }).join('') + '</div>'; };
    TREES.push(cur >= 3 ? '<div class="cupsec"><div class="row sp"><h3 style="margin:0;font-size:15px">' + esc(c.name) + '</h3>' + (c.won ? '<span class="pill g">Pokalsieger</span>' : c.alive ? '' : '<span class="pill r">Ausgeschieden</span>') + '</div><div class="bracket" style="margin-top:12px">' + col(3, 4) + col(4, 2) + col(5, 1) + '</div></div>' : '');
    return h + '</div>';
  }).join('') + '</div>';
  TREES = TREES.filter(Boolean); if (!TREES.length) ST.cupView = 'list';
  var nav = TREES.length ? '<div class="subnav" style="margin-bottom:12px"><button class="' + (ST.cupView !== 'tree' ? 'on' : '') + '" onclick="ST.cupView=\'list\';renderTab()">🏆 Pokalwettbewerbe</button><button class="' + (ST.cupView === 'tree' ? 'on' : '') + '" onclick="ST.cupView=\'tree\';renderTab()">🌳 Turnierbaum</button></div>' : '';
  return L4(C1, nav + (ST.cupView === 'tree' ? '<div class="box"><h3>🌳 Turnierbaum ab Viertelfinale</h3>' + TREES.join('') + '</div>' : LIST), C4);
}
/* ===================================================================== Transfers */
function tmPill() { var t = V.tm; return '<span class="pill ' + (t.st === 'open' ? 'g' : t.st === 'soon' ? 'y' : 'r') + '">' + (t.st === 'open' ? 'TM offen' : t.st === 'soon' ? 'TM öffnet bald' : 'TM geschlossen') + '</span>'; }
function mkRow(m, seg) {
  var watched = V.watch.some(function (w) { return w.mid === m.mid; }), dim = !m.free && seg !== 'leihe' && m.fee > V.pots.tb;
  return '<div class="pl mkr' + (dim ? ' dim' : '') + '" onclick="' + (seg === 'leihe' ? 'loanPop' : 'buyPop') + '(' + m.mid + ')"' + (dim ? ' title="Über deinem Transferbudget"' : '') + '><span class="pb ' + m.pos + '">' + m.pos + '</span><div style="min-width:0"><div style="font-weight:700">' + esc(m.n) + ' ' + (m.free ? '<span class="pill g">vereinslos</span>' : '') + '</div><div class="meta"><span class="wchip">' + m.age + ' J.</span>' + (m.pos2 ? '<span class="gchip">' + m.pos2 + '</span>' : '') + '<span>' + esc(m.club) + (m.liga ? ' (' + esc(m.liga) + ')' : '') + '</span><span>' + (seg === 'leihe' ? 'Leihe ' + eurK(m.loanFee) : m.free ? 'ablösefrei' : 'Ablöse ' + eurK(m.fee)) + '</span><span>Gehalt ~' + eur(m.dem) + '</span>' + (m.gap >= 3 ? '<span class="pill r">will höher spielen</span>' : m.gap >= 1 ? '<span class="pill y">will mehr Geld</span>' : '') + '</div></div><div class="mkst">' + stars(m.talLo, m.talHi) + '</div>' + strCircle(m.str, m.pos) + '<button class="wbtn' + (watched ? ' on' : '') + '" title="' + (watched ? 'Von der Watchlist nehmen' : 'Auf die Watchlist') + '" onclick="event.stopPropagation();act(\'watch\',{mid:' + m.mid + '},{quiet:true})">👁</button></div>';
}
function nlzBox(mini) {
  var L = V.market.list.filter(function (m) { return m.nlz; });
  return '<div class="box sm1 nlzb"><h3>🎓 Im NLZ keine Chance</h3>' + (L.length ? L.map(function (m) { return mini(m, 'frei') + '<div class="xs" style="color:#f0c24b;margin:-2px 0 6px">⏳ nur noch ' + Math.max(1, m.nlzLeft || 1) + ' Tag' + ((m.nlzLeft || 1) === 1 ? '' : 'e') + ' verfügbar</div>'; }).join('') : '<div class="xs muted">Gerade niemand. Ab und zu fliegt ein junges Talent aus einem Nachwuchsleistungszentrum – dann musst du schnell sein.</div>') + '</div>';
}
function actNegoBox() {
  var A = V.trAct || [];
  var stl = { wait: ['⏳', 'Angebot läuft'], renego: ['❗', 'Nachbessern gefordert'], sign: ['✍️', 'Zusage – unterschreiben'], fail: ['✖', 'Gescheitert'] };
  return '<div class="box sm1"><h3>🤝 Aktive Verhandlungen (' + A.filter(function (x) { return x.st !== 'fail'; }).length + ')</h3>' + (A.length ? '' : '<div class="xs muted">Gerade keine laufenden Verhandlungen.</div>') + A.map(function (x) {
    var t = stl[x.st] || stl.wait, fail = x.st === 'fail', act2 = (x.st === 'renego' || x.st === 'sign') && x.mail ? '<button class="xbtn" style="color:' + (x.st === 'renego' ? '#ff6b6b' : '#8fc852') + ';font-weight:900" title="' + t[1] + ' – jetzt ansehen" onclick="event.stopPropagation();go(\'home\');setTimeout(function(){try{openMail(' + x.mail + ')}catch(e){}},80)">' + (x.st === 'renego' ? '❗' : '✍️') + '</button>' : '';
    return '<div class="row sp mrow' + (fail ? ' negfail' : '') + '" style="gap:6px;padding:6px 0;border-top:1px solid var(--linie)"><div class="row" style="gap:6px;min-width:0"><span class="pb ' + x.pos + '">' + x.pos + '</span><div style="min-width:0"><b class="small" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x.n) + '</b><span class="xs muted">' + t[0] + ' ' + t[1] + ' · ' + esc(x.club) + '</span></div></div><div class="row" style="gap:4px">' + strCircle(x.str, x.pos, true) + act2 + '</div></div>';
  }).join('') + '</div>';
}
function posRef(pos) { var b = 0; V.players.forEach(function (p) { if (p.loan && p.loan.to) return; if (p.pos === pos || p.pos2 === pos) b = Math.max(b, p.pos === pos ? p.str : p.str - 2); }); return b || V.xiAvg; }
function strCircle(v, pos, sm) { var a = pos ? posRef(pos) : V.xiAvg; var c = v >= a + 2 ? 'g' : v >= a - 2 ? 'y' : 'r'; return '<div class="sc-c ' + c + (sm ? ' sm' : '') + '" title="' + (pos ? 'Dein bester ' + pos + ': ' + a : 'Euer Schnitt: ' + a) + '">' + v + '</div>'; }
var PSORT = { TW: 0, RV: 1, IV: 2, LV: 3, DM: 4, ZM: 5, RM: 6, LM: 7, OM: 8, RA: 9, LA: 10, ST: 11 };
function byPosStr(a, b) { return (PSORT[a.pos] || 0) - (PSORT[b.pos] || 0) || b.str - a.str; }
function tTransfer() {
  var seg = 'markt';
  var top = '<div class="box"><div class="row sp wr"><h3 style="margin:0">🛒 Transfermarkt</h3>' + tmPill() + '</div>' +
    '<div class="small muted" style="margin-top:8px">' + esc(V.tm.txt) + '. Der Markt wechselt jeden Tag – wen du beobachten willst, packst du auf die Watchlist.</div>' +
    (V.nego.length ? '<div class="hint">⏳ Laufende Verhandlungen: ' + V.nego.map(function (n) { return '<b>' + esc(n.n) + '</b>'; }).join(', ') + ' – die Antwort kommt per Nachricht.</div>' : '');
  var mid;
  var tl0 = V.players.filter(function (p) { return p.tl; });
  { var list = V.market.list.filter(function (m) { return !m.free; }).sort(function (a, b) { return b.str - a.str; }); mid = top + '<div class="plist" style="margin-top:8px">' + (list.length ? list.map(function (m) { return mkRow(m, 'markt'); }).join('') : '<div class="muted small">Heute keine Angebote.</div>') + '</div></div>'; }
  var mini = function (m, seg2) { return '<div class="row sp mrow' + (seg2 !== 'leihe' && !m.free && m.fee > V.pots.tb ? ' dim' : '') + '" style="padding:6px 0;border-top:1px solid var(--linie);gap:6px;cursor:pointer" onclick="' + (seg2 === 'leihe' ? 'loanPop' : 'buyPop') + '(' + m.mid + ')"><div class="row" style="min-width:0;gap:6px"><span class="pb ' + m.pos + '">' + m.pos + '</span><div style="min-width:0"><b class="small" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m.n) + (seg2 === 'watch' && m.free ? ' <span title="vertraglos">🆓</span>' : '') + (seg2 === 'watch' && m.moved ? ' <span title="Gerade zu ' + esc(m.moved.club) + ' gewechselt – Kauf erst im nächsten Fenster, Leihe möglich">🔄</span>' : '') + '</b><div style="margin:1px 0">' + stars(m.talLo, m.talHi) + '</div><span class="xs muted"><span class="wchip">' + m.age + ' J.</span>' + (m.pos2 ? ' <span class="gchip">' + m.pos2 + '</span>' : '') + ' ' + (seg2 === 'leihe' ? eurK(m.loanFee) + ' Leihe' : m.free ? (m.nlz ? 'aus dem NLZ' : 'ablösefrei') : eurK(m.fee)) + '</span></div></div><div class="row" style="gap:4px">' + strCircle(m.str, m.pos, true) + (seg2 === 'watch' ? '<button class="xbtn" title="Von der Watchlist löschen" onclick="event.stopPropagation();act(\'watch\',{mid:' + m.mid + '},{quiet:true})">✕</button>' : seg2 === 'frei' ? '<button class="wbtn sm' + (V.watch.some(function (w) { return w.mid === m.mid; }) ? ' on' : '') + '" title="Watchlist" onclick="event.stopPropagation();act(\'watch\',{mid:' + m.mid + '},{quiet:true})">👁</button>' : '') + '</div></div>'; };
  var free = V.market.list.filter(function (m) { return m.free && !m.nlz; }).sort(byPosStr);
  var c1 = '<div class="box sm1"><h3>🔁 Leihliste</h3>' + (!has('leihe') ? '<div class="xs muted">🔒 Leihen ab Level ' + MGR.featLvl('leihe') + '.</div>' : (V.market.loans.length ? V.market.loans.map(function (m) { return mini(m, 'leihe'); }).join('') : '<div class="xs muted">Heute keine Leihspieler.</div>')) + '</div>' +
    '<div class="box sm1"><h3>🆓 Vertraglos</h3>' + (free.length ? free.map(function (m) { return mini(m, 'frei'); }).join('') : '<div class="xs muted">Gerade keine vertragslosen Spieler.</div>') + '<div class="xs muted" style="margin-top:6px">Ablösefrei – aber selten ist hier ein Guter dabei.</div></div>' +
    nlzBox(mini);
  var T = V.trLog || [], ins = T.filter(function (x) { return x.t === 'in'; }), outs = T.filter(function (x) { return x.t === 'out'; }), si = ins.reduce(function (a, x) { return a + x.fee; }, 0), so = outs.reduce(function (a, x) { return a + x.fee; }, 0);
  var lst = function (arr, sum, neg) { return (arr.length ? arr.map(function (x) { return '<div class="row sp small" style="padding:5px 0;border-top:1px solid var(--linie);gap:6px"><span style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x.n) + ' <span class="xs muted">' + (neg ? 'von ' : 'zu ') + esc(x.club) + '</span></span><b class="' + (neg ? 'neg' : 'pos') + '">' + (x.fee ? eurK(x.fee) : 'frei') + '</b></div>'; }).join('') : '<div class="xs muted">Noch keine diese Saison.</div>') + '<div class="row sp small" style="padding-top:6px;border-top:2px solid var(--linie);margin-top:4px"><b>Gesamt</b><b class="' + (neg ? 'neg' : 'pos') + '">' + eur(sum) + '</b></div>'; };
  var bal = so - si;
  var c4 = '<div class="box sm1"><h3>👁 Watchlist (' + V.watch.length + ')</h3>' + (V.watch.length ? V.watch.slice().sort(byPosStr).map(function (m) { return mini(m, 'watch'); }).join('') : '<div class="xs muted">Leer – in der Spielerinfo auf „Watchlist“ tippen.</div>') + '</div>' + actNegoBox() +
    '<div class="box sm1"><h3>📥 Einkäufe ' + esc(String(V.season)) + '</h3>' + lst(ins, si, true) + '</div>' +
    '<div class="box sm1"><h3>📤 Verkäufe ' + esc(String(V.season)) + '</h3>' + lst(outs, so, false) + '</div>' +
    '<div class="box sm1"><h3>⚖️ Bilanz</h3><div class="row sp small"><span>Verkäufe</span><b class="pos">+' + eur(so) + '</b></div><div class="row sp small"><span>Einkäufe</span><b class="neg">−' + eur(si) + '</b></div><div class="row sp" style="margin-top:6px;padding-top:6px;border-top:2px solid var(--linie)"><b>Saldo</b><b style="font-size:18px;color:' + (bal > 0 ? '#5fbf3a' : bal < 0 ? '#e25c5c' : 'var(--t)') + '">' + (bal > 0 ? '+' : bal < 0 ? '−' : '±') + eur(Math.abs(bal)) + '</b></div></div>' +
'<div class="box sm1"><h3>📤 Meine Transferliste</h3>' + (tl0.length ? tl0.map(function (p) { return '<div class="row sp small" style="padding:5px 0;border-top:1px solid var(--linie);cursor:pointer" onclick="playerPop(' + p.id + ')"><span><span class="pb ' + p.pos + '">' + p.pos + '</span> ' + esc(p.n) + '</span>' + strBox(p.str) + '</div>'; }).join('') : '<div class="xs muted">Niemand – Spieler setzt du über die Spielerinfo drauf.</div>') + '</div>';
  return L4(c1, mid, c4);
}
function findMk(mid) { return V.market.list.filter(function (x) { return x.mid === mid; })[0] || V.watch.filter(function (x) { return x.mid === mid; })[0]; }
function buyPop(mid) {
  var m = findMk(mid); if (!m) return;
  var sy = +V.season.slice(0, 4) + 1; var ys = []; for (var y = sy; y <= sy + 4; y++) ys.push(y);
  var need = Math.round(m.dem * (1 + 0.35 * Math.max(0, m.gap)));
  var watched = V.watch.some(function (w) { return w.mid === mid; });
  var canBuy = has('transfers');
  var FN = (V.feeN || {})[m.mid];
  var dpn = (V.dpn || {})[m.pos] || m.pos, kp = function (t, v) { return '<div class="kpi" style="flex:1;min-width:84px"><small>' + t + '</small><b style="font-size:15px">' + v + '</b></div>'; };
  pop('<div class="row" style="gap:12px;align-items:center"><span class="pb ' + m.pos + '" style="transform:scale(1.35);margin:0 6px">' + m.pos + '</span><div style="flex:1;min-width:0"><h2 style="margin:0;padding:0">' + esc(m.n) + '</h2><div class="small muted">' + esc(dpn) + (m.pos2 ? ' · auch ' + m.pos2 : '') + ' · ' + m.age + ' Jahre</div><div style="margin-top:3px">' + stars(m.talLo, m.talHi) + '</div></div>' + strCircle(m.str) + '</div>' +
    '<div class="row wr" style="gap:6px;margin:10px 0">' + kp('Verein', esc(m.club) + (m.liga ? ' <span class="xs muted">' + esc(m.liga) + '</span>' : '')) + kp('Marktwert', eurK(m.mw)) + kp('Ablöse', m.free ? 'frei' : eurK(m.fee)) + kp('Gehaltswunsch', eur(m.dem)) + (m.pot ? kp('Potenzial', m.pot) : '') + kp('Passt zu uns', m.gap >= 3 ? '<span class="neg">will höher</span>' : m.gap >= 1 ? '<span class="gelb">will mehr Geld</span>' : '<span class="pos">ja</span>') + '</div>' +
    (m.moved ? '<div class="hint">🔄 Gerade zu ' + esc(m.moved.club) + ' gewechselt – ein Kauf geht erst ab ' + dFull(m.moved.until) + '. Eine Leihe wäre möglich.</div>' : '') +
    '<div><button class="sm" onclick="act(\'watch\',{mid:' + m.mid + '})">' + (watched ? 'Von der Watchlist nehmen' : '👁 Auf die Watchlist') + '</button></div>' +
    (canBuy ? (m.free ? '' : feeStage(m)) + (m.free || (FN && FN.ok) ? playerStage(m, ys, need) : '') : '<div class="hint">🔒 Spieler kaufen ab Level ' + MGR.featLvl('transfers') + '.</div>'), { nofocus: true, cls: 'buypop' });
  feeAnim(m.mid);
}
var FNPREV = {};
function feeScale(F, m) { return Math.max(F ? F.ask0 : m.fee, m.fee) * 1.1 || 1; }
function feeStage(m) {
  var F = (V.feeN || {})[m.mid], mx = feeScale(F, m), ask = F ? F.ask : null, bid = F && F.r ? F.bid : 0, md = F ? F.mood : 100;
  var mc = md >= 60 ? 'var(--g)' : md >= 30 ? 'var(--y)' : 'var(--r)', me = md >= 60 ? '🙂' : md >= 30 ? '😐' : '😠';
  var h = '<div class="negbox"><div class="row sp"><b>① Ablöse mit ' + esc(m.club) + '</b>' + (F && F.r ? '<span class="xs muted">Runde ' + F.r + ' / 6</span>' : '') + '</div>';
  if (F && F.ok) return h + '<div class="negok">✅ Ablöse vereinbart: <b>' + eur(F.fee) + '</b></div></div>';
  if (F && F.gone) return h + '<div class="negok neg">❌ ' + esc(m.club) + ' verhandelt erst wieder ab ' + dFull(F.until) + '.</div></div>';
  h += '<div class="negbars"><div class="nbl"><span>Forderung</span><b>' + (ask != null ? eur(ask) : 'ca. ' + eur(m.fee)) + '</b></div><div class="nbt"><i class="nb ask" id="nbAsk" data-w="' + Math.round((ask != null ? ask : m.fee) / mx * 100) + '"></i></div>' +
    '<div class="nbl"><span>Dein Angebot</span><b>' + (bid ? eur(bid) : '–') + '</b></div><div class="nbt"><i class="nb bid" id="nbBid" data-w="' + Math.round(bid / mx * 100) + '"></i></div></div>' +
    '<div class="row sp xs" style="margin-top:8px"><span>Laune ' + me + '</span><span>' + md + ' %</span></div><div class="nbt sm"><i class="nb" style="width:' + md + '%;background:' + mc + '"></i></div>' +
    '<div class="row" style="gap:8px;margin-top:10px"><input id="bf" type="number" style="flex:1;margin:0" value="' + (bid ? Math.round((bid + (ask || m.fee)) / 2) : Math.round(m.fee * 0.85)) + '"><button class="pri" style="margin:0" onclick="feeBid(' + m.mid + ')">Bieten</button></div>' +
    '<div class="xs muted" style="margin-top:6px">Jedes Gebot ist eine Runde. Zu niedrige Gebote drücken die Laune – bei 0 oder nach 6 Runden bricht der Verein ab.</div></div>';
  return h;
}
function playerStage(m, ys, need) {
  return '<div class="negbox"><b>' + (m.free ? '' : '② ') + 'Angebot an ' + esc(m.n) + '</b>' +
    '<label>Gehalt pro Monat (€)</label><input id="bs" type="number" value="' + need + '"><label>Vertrag bis</label><select id="bu">' + ys.map(function (y, i) { return '<option value="' + y + '" ' + (i === 1 ? 'selected' : '') + '>06/' + y + '</option>'; }).join('') + '</select>' +
    '<div class="hint">Gehaltswunsch ca. ' + eur(m.dem) + (m.gap >= 1 ? '. Für einen Wechsel in eure Liga will er mehr (≈ ' + eur(need) + ').' : '.') + ' Das Transferbudget (' + eur(V.pots.tb) + ') muss Ablöse + Gehalt bis Saisonende decken. Die Antwort kommt in 1–5 Tagen per Nachricht, am Deadline Day sofort.</div>' +
    '<button class="pri" style="width:100%;margin-top:12px" onclick="act(\'buy\',{mid:' + m.mid + ',sal:+$(\'#bs\').value,until:+$(\'#bu\').value})">Angebot an ' + esc(m.n.split(' ')[0]) + ' schicken</button></div>';
}
function feeAnim(mid) {
  var P = FNPREV[mid] || {}, a = $('#nbAsk'), b = $('#nbBid'); [[a, 'a'], [b, 'b']].forEach(function (x) { if (!x[0]) return; x[0].style.width = (P[x[1]] != null ? P[x[1]] : x[1] === 'a' ? 100 : 0) + '%'; });
  setTimeout(function () { var o = {}; if (a) { a.style.width = a.dataset.w + '%'; o.a = +a.dataset.w; } if (b) { b.style.width = b.dataset.w + '%'; o.b = +b.dataset.w; } FNPREV[mid] = o; }, 40);
}
function feeBid(mid) {
  var v = +($('#bf') || {}).value || 0;
  act('feeNego', { mid: mid, bid: v }, { quiet: true, norender: true }).then(function (r) { if (!r) return; render(true); buyPop(mid); toast(r.info, false, 'Transfer'); });
}
function loanPop(mid) {
  var m = V.market.loans.filter(function (x) { return x.mid === mid; })[0]; if (!m) return;
  pop('<div class="row"><span class="pb ' + m.pos + '">' + m.pos + '</span><h2 style="margin:0">' + esc(m.n) + '</h2></div><div class="small muted" style="margin:6px 0">' + m.age + ' Jahre · Stärke ' + m.str + ' · von ' + esc(m.club) + '</div>' + stars(m.talLo, m.talHi) +
    '<div class="small" style="margin-top:10px;line-height:1.8">Leihgebühr <b>' + eur(m.loanFee) + '</b> (Transferbudget)<br>Ihr zahlt <b>' + Math.round(m.share * 100) + ' %</b> seines Gehalts = <b>' + eur(m.dem) + '</b>/Monat<br>Leihe bis Saisonende</div>' +
    '<button class="pri" style="width:100%;margin-top:12px" onclick="act(\'loanin\',{mid:' + m.mid + '})">Ausleihen</button>');
}

/* ===================================================================== Finanzen */
var TKV = null;
function ticketBox(F) {
  if (TKV == null || TKV.base !== F.ticket) TKV = { base: F.ticket, v: F.ticket };
  var Hh = V.tHist || [], g = '';
  if (Hh.length) { var W = 230, Ht = 70, mxA = 1; Hh.forEach(function (x) { mxA = Math.max(mxA, x.att || 0); }); var st = W / Math.max(1, Hh.length - 1);
    var ln = function (key, sc) { return Hh.map(function (x, i) { var v = x[key] == null ? 0 : x[key]; return (i ? 'L' : 'M') + (Hh.length === 1 ? W / 2 : i * st).toFixed(1) + ' ' + (Ht - 6 - v / sc * (Ht - 14)).toFixed(1); }).join(' '); };
    g = '<svg viewBox="-4 0 ' + (W + 8) + ' ' + Ht + '" style="width:100%;height:auto;margin-top:8px"><path d="' + ln('att', mxA) + '" fill="none" stroke="#6fb3e6" stroke-width="2.5"/><path d="' + ln('fans', 100) + '" fill="none" stroke="#f0c24b" stroke-width="2.5"/>' + Hh.map(function (x, i) { var cx = Hh.length === 1 ? W / 2 : i * st; return x.df ? '<text x="' + cx + '" y="10" text-anchor="middle" font-size="9" font-weight="800" fill="' + (x.df >= 0 ? '#5fbf3a' : '#e25c5c') + '">' + (x.df > 0 ? '▲' : '▼') + '</text>' : ''; }).join('') + '</svg><div class="row sp xs muted"><span><b style="color:#6fb3e6">━</b> Zuschauerschnitt</span><span><b style="color:#f0c24b">━</b> Fan-Stimmung</span></div>';
    var last = Hh[Hh.length - 1]; g += '<div class="xs" style="margin-top:4px;color:' + (last.df >= 0 ? '#5fbf3a' : '#e25c5c') + '">Letzter Monat: ' + (last.att ? num(last.att) + ' Zuschauer im Schnitt · ' : '') + 'Fans ' + (last.df >= 0 ? '+' : '') + String(last.df).replace('.', ',') + (last.df < 0 ? ' – Preise zu hoch oder schwache Leistungen?' : ' – die Fans sind zufrieden') + '</div>';
  } else g = '<div class="xs muted" style="margin-top:8px">Die Reaktion der Fans siehst du nach dem ersten Monat.</div>';
  return '<div class="box"><h3>🎟️ Eintrittspreis</h3><div class="row" style="gap:6px"><button class="sm" ' + (V.ticketLock ? 'disabled' : '') + ' onclick="TKV.v=Math.max(0,TKV.v-0.5);renderTab()">−</button><div class="big" style="flex:1;text-align:center;font-size:22px">' + eur(TKV.v) + '</div><button class="sm" ' + (V.ticketLock ? 'disabled' : '') + ' onclick="TKV.v+=0.5;renderTab()">+</button></div>' + (V.ticketLock ? '<div class="xs muted" style="margin-top:6px">🔒 Diesen Monat schon geändert.</div>' : (TKV.v !== F.ticket ? '<button class="sm pri" style="width:100%;margin-top:6px" onclick="act(\'ticket\',{price:TKV.v},{quiet:true});TKV=null">Preis übernehmen</button>' : '<div class="xs muted" style="margin-top:6px">Einmal pro Monat änderbar.</div>')) + '<div class="xs muted" style="margin-top:4px">Üblich in der Liga: ' + eur(F.ticketDef) + '</div>' + g + '</div>';
}
var PRV = {};
function priceRows(L) { return L.map(function (x) { var v = PRV[x.k] != null ? PRV[x.k] : x.p, d = v / x.base, col = d > 1.25 ? '#e25c5c' : d < 0.85 ? '#5fbf3a' : 'var(--t)'; return '<div class="row sp" style="padding:5px 0;border-top:1px solid var(--linie);gap:4px"><span class="small" style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + x.ic + ' ' + esc(x.n) + '</span><span class="row" style="gap:3px">' + (x.lock ? '<b class="small" style="color:' + col + '">' + eur(x.p) + '</b><span class="xs">🔒</span>' : '<button class="sm ybt" onclick="PRV.' + x.k + '=Math.max(' + (x.base * 0.3) + ',(PRV.' + x.k + '!=null?PRV.' + x.k + ':' + x.p + ')-0.5);renderTab()">−</button><b class="small" style="min-width:44px;text-align:center;color:' + col + '">' + eur(v) + '</b><button class="sm ybt" onclick="PRV.' + x.k + '=(PRV.' + x.k + '!=null?PRV.' + x.k + ':' + x.p + ')+0.5;renderTab()">+</button>' + (v !== x.p ? '<button class="sm ybt pri" onclick="act(\'price\',{k:\'' + x.k + '\',p:' + v + '},{quiet:true});delete PRV.' + x.k + '">✓</button>' : '')) + '</span></div>'; }).join(''); }
function concBox() { return '<div class="box"><h3>🌭 Verkäufe am Spieltag</h3>' + priceRows(V.conc || []) + '<div class="xs muted" style="margin-top:6px">Jeder Preis einmal im Monat änderbar. Zu teuer = weniger Umsatz und sauere Fans, günstig = mehr Umsatz pro Kopf und gute Stimmung.</div></div>'; }
function merchBox() { return '<div class="box"><h3>👕 Merchandise</h3>' + priceRows(V.merch || []) + '<div class="xs muted" style="margin-top:6px">Je höher die Liga und je mehr Fans, desto mehr wird gekauft. Ein Fanshop (Erweiterungen) steigert den Absatz.</div></div>'; }
function tFin() {
  var F = V.fin, P = V.pots, A = V.alloc, mx = 1; F.hist.forEach(function (m) { mx = Math.max(mx, m.inn, m.out); });
  var cur = F.hist[F.hist.length - 1] || { detIn: {}, detOut: {} };
  var tot = Math.max(1, Math.abs(P.cash) + Math.abs(P.tb) + Math.abs(P.sav));
  var h = '<div class="box"><h3>💰 Vereinsvermögen</h3><div class="big" style="color:' + wealthCls() + '">' + eur(V.wealth) + '</div><div class="xs muted">Hochgerechnet aufs Saisonende: ' + eur(V.budgetPace.proj) + ' (' + (V.budgetPace.perM >= 0 ? '+' : '') + eur(V.budgetPace.perM) + '/Monat)</div>' +
    '<div class="potbar"><i style="width:' + Math.abs(P.cash) / tot * 100 + '%;background:var(--g)"></i><i style="width:' + Math.abs(P.tb) / tot * 100 + '%;background:#6fb3e6"></i><i style="width:' + Math.abs(P.sav) / tot * 100 + '%;background:var(--y)"></i></div>' +
    kv('<span style="color:var(--g)">●</span> Bargeld (laufende Kosten, Ausbau)', '<span class="' + (P.cash < 0 ? 'neg' : '') + '">' + eur(P.cash) + '</span>') + kv('<span style="color:#6fb3e6">●</span> Transferbudget', eur(P.tb)) + kv('<span style="color:var(--y)">●</span> Tagesgeld (2,5 % Zinsen p. a.)', eur(P.sav)) +
    '<label style="margin-top:12px">Umbuchen <span class="xs muted" style="text-transform:none">(noch ' + V.movesLeft + ' von 3 diese Saison)</span></label><div class="row" style="gap:6px"><select id="mf"><option value="cash">Bargeld</option><option value="tb">Transfer</option><option value="sav">Tagesgeld</option></select><span>→</span><select id="mt"><option value="tb">Transfer</option><option value="cash">Bargeld</option><option value="sav">Tagesgeld</option></select></div><div class="row" style="margin-top:6px"><input id="ma" class="nospin" type="number" placeholder="Betrag in €"><button onclick="act(\'move\',{from:$(\'#mf\').value,to:$(\'#mt\').value,amount:+$(\'#ma\').value})">Buchen</button></div>'  + '</div>';
  var C4 = '<div class="box"><h3>📊 Einnahmen & Ausgaben</h3>' + finChart(F.hist) +
    '<h3 style="margin-top:14px">Laufender Monat</h3>' + Object.keys(cur.detIn || {}).map(function (k) { return kv(esc(k), '<span class="pos">+' + eur(cur.detIn[k]) + '</span>'); }).join('') + Object.keys(cur.detOut || {}).map(function (k) { return kv(esc(k), '<span class="neg">−' + eur(cur.detOut[k]) + '</span>'); }).join('') +
    '<div class="hint">Jeden Monat kommt ein Monatsbericht vom Kassenwart in den Posteingang. Laufend: Gehälter ' + eur(F.monthlySal) + ' · Ausbau & Personal ' + eur(F.monthlyItems) + (F.tv ? ' · TV-Geld +' + eur(F.tv) : '') + '.</div></div>';
  var tkt = ticketBox(F);
  var bnk = '<div class="box"><h3>Bank & Kredite</h3>' + (!has('kredit') ? '<div class="muted small">🔒 Kredite ab Manager-Level ' + MGR.featLvl('kredit') + '.</div>' : V.loanInfo ? kv('Restschuld', eur(V.loanInfo.rest)) + kv('Monatsrate', eur(V.loanInfo.monthly)) + '<button class="sm" style="margin-top:8px" onclick="act(\'payoff\',{})">Komplett tilgen</button>' : '<div class="small muted">Bis ' + eur(V.credMax) + ', 24 Monate, 12 % Zinsen gesamt.</div><div class="row" style="margin-top:8px"><input id="cr" type="number" placeholder="Betrag"><button onclick="act(\'credit\',{amount:+$(\'#cr\').value})">Aufnehmen</button></div>') + '</div>';
  var msb = '<div class="box">' + mainSpBox().replace('margin-top:14px;', '') + '</div>';
  return L4(tkt + concBox() + merchBox(), S2(h + dkBox(), msb + bondBox() + bnk + boerseBox()), C4);
}
function sparkL(arr, col) { if (!arr || arr.length < 2) return ''; var mn = Math.min.apply(null, arr), mx = Math.max.apply(null, arr), W = 300, H = 60, rg = mx - mn || 1; var pts = arr.map(function (v, i) { return (i * W / (arr.length - 1)).toFixed(1) + ',' + (H - 6 - (v - mn) / rg * (H - 12)).toFixed(1); }); return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:60px;display:block;margin-top:6px"><polyline points="0,' + H + ' ' + pts.join(' ') + ' ' + W + ',' + H + '" fill="' + col + '22" stroke="none"/><polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round"/></svg>'; }
function dkBox() {
  var K = V.dk; if (!K) return '';
  // 10 Saisons: 2 frühere (gewürfelt, fest je Verein), die echten Werte, Rest leer; ab 11 rückt die älteste raus
  var H0 = (K.hist || []).slice(), f0 = H0[0], sd = 0; String(V.club || '').split('').forEach(function (c) { sd = (sd * 31 + c.charCodeAt(0)) >>> 0; });
  if (f0) { for (var pi = 1; pi <= 2; pi++) { sd = (sd * 1103515245 + 12345) >>> 0; H0.unshift({ s: f0.s - pi, n: Math.max(1, Math.round(f0.n * (0.82 + (sd % 30) / 100))), pre: 1 }); } H0.sort(function (a, b) { return a.s - b.s; }); }
  if (H0.length > 10) H0 = H0.slice(-10);
  var s0 = H0.length ? H0[0].s : (+V.season || 2026) - 2; var H = []; for (var hi = 0; hi < 10; hi++) H.push(H0[hi] || { s: s0 + hi, n: null });
  var mx = Math.max.apply(null, H.map(function (x) { return x.n || 0; }).concat([10])), W = 300, Hh = 110, bw = Math.min(46, (W - 10) / H.length - 6);
  var bars = H.map(function (x, i) { if (x.n == null) { var xe = 6 + i * ((W - 12) / H.length) + ((W - 12) / H.length - bw) / 2; return '<g><rect x="' + xe.toFixed(1) + '" y="' + (Hh - 30) + '" width="' + bw.toFixed(1) + '" height="12" rx="4" fill="none" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 3"/><text x="' + (xe + bw / 2).toFixed(1) + '" y="' + (Hh - 5) + '" text-anchor="middle" font-size="8" fill="rgba(255,255,255,.4)">' + String(x.s).slice(2) + '/' + String(x.s + 1).slice(2) + '</text></g>'; } var h0 = Math.max(4, x.n / mx * (Hh - 34)), xx = 6 + i * ((W - 12) / Math.max(1, H.length)) + ((W - 12) / Math.max(1, H.length) - bw) / 2; return '<g><rect x="' + xx.toFixed(1) + '" y="' + (Hh - 18 - h0).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h0.toFixed(1) + '" rx="4" fill="url(#dkg)"' + (x.pre ? ' opacity=".6"' : '') + '/><text x="' + (xx + bw / 2).toFixed(1) + '" y="' + (Hh - 22 - h0).toFixed(1) + '" text-anchor="middle" font-size="8" font-weight="800" fill="#fff">' + x.n + '</text><text x="' + (xx + bw / 2).toFixed(1) + '" y="' + (Hh - 5) + '" text-anchor="middle" font-size="8" fill="rgba(255,255,255,.6)">' + String(x.s).slice(2) + '/' + String(x.s + 1).slice(2) + '</text></g>'; }).join('');
  var last = (K.hist || [])[(K.hist || []).length - 1];
  return '<div class="box"><h3>🎫 Dauerkarten</h3><svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;height:auto;display:block"><defs><linearGradient id="dkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9e68a"/><stop offset="1" stop-color="#4f8f25"/></linearGradient></defs>' + bars + '</svg>' +
    (last ? kv('Diese Saison', '<b>' + last.n + ' Stück · ' + eur(last.rev) + '</b>') : '') + kv('Preis', '<b>' + eur(K.price) + '</b>') +
    (K.canSet ? '<div class="row" style="gap:6px;margin-top:8px"><input id="dkp" type="number" min="10" max="2000" step="1" value="' + K.price + '" style="flex:1"><button class="sm pri" onclick="act(\'dkPrice\',{price:+$(\'#dkp\').value})">Für nächste Saison festlegen</button></div><div class="xs muted" style="margin-top:4px">Einmal pro Saison änderbar. Zu teuer = weniger Käufer.</div>' : '<div class="xs muted" style="margin-top:6px">' + ((V.hist || []).length ? 'Preis für diese Saison schon festgelegt.' : 'Den Preis legst du ab der zweiten Saison fest.') + '</div>') + '</div>';
}
function boerseBox() {
  var A = V.ag, h = '<div class="box"><h3>📈 Börse</h3>';
  if (!A) {
    var w = V.agWhy || [];
    h += '<div class="small muted">Wandle den Verein in eine AG um und bring ihn an die Börse. 20 % der Aktien gehen an Investoren – der Erlös fließt ins Transferbudget.</div>' + kv('Geschätzter Erlös', '<b class="pos">' + eur((V.agBase || 0) * 20) + '</b>') +
      '<div class="xs" style="margin:8px 0">' + [['mind. Regionalliga', 'Regionalliga'], ['Manager-Level 15', 'Level 15'], ['3 Jahre in Folge positive Jahresbilanz', 'positive Bilanz 3 Jahre in Folge']].map(function (c) { var ok = w.indexOf(c[0]) < 0; return '<div>' + (ok ? '✅' : '🔒') + ' ' + c[1] + '</div>'; }).join('') + '</div>' +
      '<button class="pri" style="width:100%" ' + (w.length ? 'disabled' : '') + ' onclick="act(\'ipo\',{})">🔔 Börsengang</button>';
  } else {
    var H = A.hist || [], ch = H.length > 1 ? (H[H.length - 1] / H[H.length - 2] - 1) * 100 : 0;
    h += '<div class="row sp"><span class="small muted">Kurs (Wert pro 1 %)</span><b style="font-size:18px">' + eur(A.p) + ' <span class="xs ' + (ch >= 0 ? 'pos' : 'neg') + '">' + (ch >= 0 ? '▲' : '▼') + Math.abs(ch).toFixed(1).replace('.', ',') + ' %</span></b></div>' + sparkL(H, ch >= 0 ? '#8fc852' : '#ff6b6b') +
      kv('Im Streubesitz', A.sold + ' %') + kv('Beim Verein', (100 - A.sold) + ' %') + kv('Börsenwert', eur(A.p * 100)) +
      '<div class="row" style="gap:6px;margin-top:8px"><button class="sm" style="flex:1" ' + (A.sold >= 49 ? 'disabled' : '') + ' onclick="act(\'agSell\',{})">5 % verkaufen (+' + eurK(A.p * 5) + ')</button><button class="sm" style="flex:1" ' + (A.sold <= 0 ? 'disabled' : '') + ' onclick="act(\'agBuy\',{})">5 % zurückkaufen</button></div><div class="xs muted" style="margin-top:6px">Kurs schwankt monatlich mit Erfolg, Fans und Hype. Auf Aktien im Streubesitz wird monatlich eine kleine Dividende fällig.</div>';
  }
  return h + '</div>';
}
function bondBox() {
  var B = V.bond, O = V.bondOffer, h = '<div class="box"><h3>📜 Fan-Anleihen</h3>';
  if (B) {
    var pct = Math.round((1 - B.rest / B.total) * 100);
    h += kv('Anleihe', eur(B.amt) + ' · ' + String(B.rate).replace('.', ',') + ' %') + kv('Monatsrate', eur(B.monthly)) + kv('Restschuld', '<b class="neg">' + eur(B.rest) + '</b>') +
      '<div style="margin-top:8px;height:14px;border-radius:7px;background:rgba(255,255,255,.08);overflow:hidden;position:relative"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#5d9a2e,#8fc852);border-radius:7px"></div><span class="xs" style="position:absolute;inset:0;display:grid;place-items:center;font-weight:800">' + pct + ' % getilgt</span></div><div class="xs muted" style="margin-top:4px">' + B.paid + ' von ' + B.months + ' Raten bezahlt</div>';
  } else if (O) {
    h += '<div style="background:var(--flaeche2);border-radius:12px;padding:10px 12px' + (O.good ? ';box-shadow:inset 0 0 0 2px #8fc852' : '') + '">' + (O.good ? '<div class="pill g" style="margin-bottom:6px">⭐ Top-Angebot</div>' : '') + kv('Betrag', '<b class="pos">' + eur(O.amt) + '</b>') + kv('Zinsen', String(O.rate).replace('.', ',') + ' % p. a.') + kv('Laufzeit', O.months + ' Monate') + kv('Rückzahlung gesamt', eur(Math.round(O.amt * (1 + O.rate / 100 * O.months / 12)))) +
      '<div class="row" style="gap:6px;margin-top:8px"><button class="pri" style="flex:1" onclick="act(\'bondAcc\',{})">Annehmen</button><button class="sm" style="flex:1" onclick="act(\'bondNo\',{})">Ablehnen</button></div></div>';
  } else {
    var ok = V.fans >= 100;
    h += '<div class="small muted">Die Fans leihen dem Verein Geld – gegen Zinsen. Wird monatlich zurückgezahlt, immer nur eine Anleihe gleichzeitig.</div><div class="xs" style="margin:8px 0">' + (ok ? '✅' : '🔒') + ' Fan-Ansehen 100 (aktuell ' + Math.round(V.fans) + ')</div>' +
      '<button class="pri" style="width:100%" ' + (!ok || V.bondAskDone ? 'disabled' : '') + ' onclick="act(\'bondAsk\',{})">' + (V.bondAskDone ? 'Diese Woche schon angefragt' : 'Anfragen') + '</button><div class="xs muted" style="margin-top:6px">Ab und zu kommt auch von selbst ein gutes Angebot rein.</div>';
  }
  return h + '</div>';
}
function mainSpBox() {
  var M = V.mainSp; if (!M) return '<div style="margin-top:14px"><label>Hauptsponsor</label><div class="small muted">Noch kein Hauptsponsor unter Vertrag.</div></div>';
  return '<div style="margin-top:14px;background:transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);border-radius:12px;padding:10px 12px"><div class="row sp"><b>🤝 Hauptsponsor</b><span class="pill g">' + esc(M.firm) + '</span></div>' + kv('Betrag pro Saison', '<b class="pos">' + eur(M.amt) + '</b>') + kv('Laufzeit', M.from + '/' + String(M.from + 1).slice(2) + ' – ' + M.to + '/' + String(M.to + 1).slice(2)) + kv('Vertragsende', '30.06.' + (M.to + 1)) + '<div class="xs muted">Verlängerung wird 3 Monate vor Ablauf angeboten.</div></div>';
}
function finChart(H) {
  H = H.slice(-6); if (!H.length) return '<div class="small muted">Noch keine abgeschlossenen Monate.</div>';
  var W = 340, Ht = 150, mx = 1; H.forEach(function (m) { mx = Math.max(mx, m.inn, m.out); }); var stp = W / Math.max(1, H.length - 1), y = function (v) { return Ht - 12 - v / mx * (Ht - 28); };
  var line = function (k) { return H.map(function (m, i) { return (i ? 'L' : 'M') + (H.length === 1 ? W / 2 : i * stp).toFixed(1) + ' ' + y(m[k]).toFixed(1); }).join(' '); };
  var area = function (k) { return line(k) + ' L' + (H.length === 1 ? W / 2 : W) + ' ' + (Ht - 12) + ' L' + (H.length === 1 ? W / 2 : 0) + ' ' + (Ht - 12) + ' Z'; };
  var net = 0; var bars = H.map(function (m, i) { var d = m.inn - m.out; net += d; return '<div style="flex:1;text-align:center"><div class="xs" style="font-weight:800;color:' + (d >= 0 ? 'var(--g)' : 'var(--r)') + '">' + (d >= 0 ? '+' : '−') + eurK(Math.abs(d)) + '</div><div class="xs muted">' + esc(String(m.m || '').slice(5, 7) + (m.m ? '/' + String(m.m).slice(2, 4) : '')) + '</div></div>'; }).join('');
  return '<svg viewBox="0 0 ' + W + ' ' + Ht + '" style="width:100%;height:auto;display:block"><defs><linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc852" stop-opacity=".45"/><stop offset="1" stop-color="#8fc852" stop-opacity="0"/></linearGradient><linearGradient id="go" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e25c5c" stop-opacity=".35"/><stop offset="1" stop-color="#e25c5c" stop-opacity="0"/></linearGradient></defs>' +
    [0.25, 0.5, 0.75, 1].map(function (f) { return '<line x1="0" x2="' + W + '" y1="' + y(mx * f) + '" y2="' + y(mx * f) + '" stroke="rgba(255,255,255,.06)"/>'; }).join('') +
    '<path d="' + area('inn') + '" fill="url(#gi)"/><path d="' + area('out') + '" fill="url(#go)"/><path d="' + line('inn') + '" fill="none" stroke="#8fc852" stroke-width="2.5" stroke-linejoin="round"/><path d="' + line('out') + '" fill="none" stroke="#e25c5c" stroke-width="2.5" stroke-linejoin="round"/>' +
    H.map(function (m, i) { var x = H.length === 1 ? W / 2 : i * stp; return '<circle cx="' + x + '" cy="' + y(m.inn) + '" r="3" fill="#8fc852"/><circle cx="' + x + '" cy="' + y(m.out) + '" r="3" fill="#e25c5c"/>'; }).join('') + '</svg>' +
    '<div class="row" style="gap:2px;margin-top:4px">' + bars + '</div><div class="row sp small" style="margin-top:8px"><span><span style="color:var(--g)">━</span> Einnahmen <span style="color:var(--r);margin-left:8px">━</span> Ausgaben</span><span>Saldo: <b class="' + (net >= 0 ? 'pos' : 'neg') + '">' + (net >= 0 ? '+' : '−') + eur(Math.abs(net)) + '</b></span></div>';
}
function mktBox(title, actions) {
  var m = V.mkt || 0, col = m >= 60 ? '#8fc852' : m >= 35 ? '#ffd34d' : '#ff6b6b';
  var h = '<div class="box sm1"><h3>📣 ' + (title || 'Vermarktung') + '</h3><div class="row sp"><span class="small muted">Vermarktungswert</span><b style="font-size:22px;color:' + col + '">' + m + '<span class="xs muted"> / 100</span></b></div>' + bar(m, 100, col) + '<div class="xs muted" style="margin-top:6px">Steigt mit Followern, Fan-Stimmung und Aktionen. Höherer Wert = bessere Angebote.</div>';
  if (actions) {
    var A = [['post', '📱', 'Social-Media-Kampagne', 0, 2, 3], ['presse', '📰', 'Pressetermin', 0, 2, 3], ['auto', '✍️', 'Autogrammstunde', 150, 3, 4], ['abend', '🥂', 'Sponsorenabend', 400, 4, 5]];
    h += '<div class="xs" style="margin:10px 0 4px;font-weight:700">Aktion der Woche ' + (V.mktDone ? '<span class="pill g">erledigt</span>' : '') + '</div>' + A.map(function (a) { return '<button class="sm" style="width:100%;margin-top:5px;text-align:left;display:flex;justify-content:space-between" ' + (V.mktDone ? 'disabled' : '') + ' onclick="act(\'mktAct\',{k:\'' + a[0] + '\'})"><span>' + a[1] + ' ' + a[2] + '</span><span class="xs">' + (a[3] ? '−' + eur(a[3]) : 'kostenlos') + '</span></button>'; }).join('') + '<div class="xs muted" style="margin-top:6px">Eine Aktion pro Woche – wie gut sie ankommt, zeigt sich erst danach.</div>';
  }
  return h + '</div>';
}
function tSpons() {
  var M = V.mainSp, mainH = '<div class="box"><h3>🤝 Hauptsponsor</h3>' + (M ? '<div class="row" style="gap:14px;align-items:center"><div style="background:#fff;border-radius:12px;padding:8px;flex:0 0 220px"><img src="' + spLogo(M.firm) + '" alt="" style="width:100%;display:block"></div><div style="flex:1;min-width:0">' + mainSpBox().replace('margin-top:14px;', '').replace(/<div class="row sp"><b>🤝 Hauptsponsor<\/b>/, '<div class="row sp" style="display:none"><b></b>') + '</div></div>' : '<div class="small muted">Noch kein Hauptsponsor unter Vertrag. Angebote kommen zu Saisonbeginn – nicht immer sofort.</div>') + '</div>';
  var all = V.sponsorsAll || [], sum = all.reduce(function (a, s) { return a + s.m; }, 0);
  var wp = '<div class="box"><h3>🏷️ Werbepartner</h3><div class="row sp"><span class="small muted">Einnahmen aus Werbeverträgen</span><b class="pos">+' + eur(sum) + ' / Monat</b></div>' + (all.length ? '<div class="grid g3" style="gap:10px;margin-top:10px">' + all.map(function (c) { return '<div class="item built"><div class="bd"><div style="background:#fff;border-radius:8px;padding:4px"><img src="' + spLogo(c.firm) + '" alt="" style="width:100%;display:block"></div><b class="small">' + esc(c.firm) + '</b><div class="xs muted">' + esc((V.spons[c.slot] || {}).n || c.slot) + ' · bis ' + esc(String(c.until || '').replace(/^(\d{4})-(\d\d)$/, '$2/$1')) + '</div><div class="small pos">+' + eur(c.m) + '/Monat</div></div></div>'; }).join('') + '</div>' : '<div class="small muted" style="margin-top:8px">Noch keine Werbepartner – freie Flächen siehst du rechts.</div>') + '</div>';
  return L4(mktBox('Vermarktung', true), S2(mainH, wp), tSpons0());
}
function tSpons0() {
  var SP = V.spons, cur = {}; (V.sponsorsAll || []).forEach(function (s) { cur[s.slot] = s; });
  var keys = Object.keys(SP).sort(function (a, b) { return MGR.featLvl(SP[a].f) - MGR.featLvl(SP[b].f); });
  return '<div class="box sm1"><h3>📍 Werbeflächen</h3>' + keys.map(function (k) {
    var s = SP[k], lv = MGR.featLvl(s.f), lk = V.mlvl < lv, c = cur[k];
    return '<div style="padding:8px 0;border-top:1px solid var(--linie);' + (lk ? 'opacity:.5' : '') + '"><div class="row sp"><b class="small">' + esc(s.n) + '</b>' + (lk ? '<span class="pill">🔒 Lv ' + lv + '</span>' : c ? '<span class="pill g">belegt</span>' : '<span class="pill y">frei</span>') + '</div>' + (c ? '<div class="xs"><b>' + esc(c.firm) + '</b> · <span class="pos">+' + eur(c.m) + '/M</span></div>' : '<div class="xs muted">' + (lk ? esc(s.brand) : 'Warte auf Angebote …') + '</div>') + '</div>';
  }).join('') + '<div class="xs muted" style="margin-top:6px">Angebote kommen unregelmäßig – nicht jede Woche fragt jemand an.</div></div>';
}
