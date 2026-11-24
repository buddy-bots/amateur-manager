
/* ===================================================================== Spiel-Rahmen */
function has(k) { if (V && V.dev) return true; if (k === 'aufstellung' && V && V.testsDone >= 2) return true; return (V ? V.mlvl : 1) >= MGR.featLvl(k); }
function featName(k) { var f = MGR.FEATURES.filter(function (x) { return x[1] === k; })[0]; return f ? f[2] : k; }
function lockHTML(k) { return '<div class="box lockbox"><div class="ic">🔒</div><h2 style="margin:6px 0">' + esc(featName(k)) + '</h2><div class="muted">Wird ab <b style="color:var(--t)">Manager-Level ' + MGR.featLvl(k) + '</b> freigeschaltet. Du bist Level ' + V.mlvl + '.</div><div class="hint" style="display:inline-block;margin-top:12px">XP gibt es für Spiele, Siege, Entscheidungen, Nachrichten, Likes und Erfolge.</div><div style="margin-top:12px"><button onclick="levelPop()">Levelstruktur ansehen</button></div></div>'; }
function headHTML() {
  var L = V.level, next = MGR.FEATURES.filter(function (f) { return f[0] > V.mlvl; })[0], col = lvCol(V.mlvl);
  return '<div class="head"><div class="crestbox">' + '<img src="' + ownLogo() + '" alt="">' + '</div>' +
    '<div class="tt"><b>' + esc(V.club) + '</b><div class="mg">Manager ' + esc(V.full) + '</div></div>' +
    '<div class="lvbox" onclick="go(\'manager\')"><span class="ln" style="color:' + col + '">Level ' + V.mlvl + '</span>' + bar(L.pct, 100, col) +
    '<div class="qb"><b style="font-size:14px;color:' + col + '">Manager-Level ' + V.mlvl + '</b><br>' + num(V.xp) + ' XP · noch ' + num(Math.max(0, L.next - V.xp)) + ' XP bis Level ' + (V.mlvl + 1) + '<div style="margin:6px 0">' + bar(L.pct, 100, col) + '</div>' + (next ? 'Nächste Freischaltung: <b>' + esc(next[2]) + '</b> (Level ' + next[0] + ')<br><span class="muted">' + esc(next[3]) + '</span>' : 'Alles freigeschaltet!') + '<div class="muted" style="margin-top:6px">In diesem Spiel verdient: ' + num(V.xpGame) + ' XP</div></div></div>' +
    '<div class="ligabox">' + esc(V.ligaK) + '</div><div class="ligabox">Saison ' + esc(V.season) + '</div><div class="right"></div></div>';
}
function wealthCls() { if (V.wealth < 0) return 'var(--r)'; var p = V.budgetPace; return p.proj >= V.wealth && V.wealth > 0 ? 'var(--g)' : p.proj >= 0 ? 'var(--y)' : 'var(--r)'; }
function kpiHTML() {
  var P = V.pots;
  return '<div class="kpi"><small>Stärke</small><b>' + V.xiAvg + '</b><div class="xs muted" style="margin-top:3px">' + (V.rank ? V.rank + '. Platz · ' + V.pts + ' Pkt' : 'Saisonstart') + '</div><div class="xs muted">Amtszeit ' + amtK(V.days) + '</div></div>' +
    kpiBar('Fans', V.fans, V.stufen.fans, num(V.fanbase) + ' Fans') +
    '<div class="kpi"><small>Sponsoren</small><b>' + V.sponsBar + '</b>' + bar(V.sponsBar) + '<div class="xs muted" style="margin-top:3px">' + (V.partnerCount != null ? V.partnerCount : (V.sponsorsAll || []).length) + ' Partner</div></div>' +
    kpiBar('Vorstand', V.board, V.stufen.board) + kpiBar('Moral', V.moral, V.stufen.moral) +
    '<div class="kpi"><small>Fitness</small><b>' + V.fitness + '</b>' + bar(V.fitness) + '</div>' +
    '<div class="kpi fin" onclick="go(\'fin\')" style="cursor:pointer"><small>Vereinsvermögen</small><b style="font-size:15px;color:' + wealthCls() + '">' + eurK(V.wealth) + '</b><div class="fl"><span>Bargeld</span><b style="' + (P.cash < 0 ? 'color:var(--r)' : '') + '">' + eurK(P.cash) + '</b></div><div class="fl"><span>Transfer</span><b style="' + (P.tb < 0 ? 'color:var(--r)' : '') + '">' + eurK(P.tb) + '</b></div><div class="fl"><span>Tagesgeld</span><b style="' + (P.sav < 0 ? 'color:var(--r)' : '') + '">' + eurK(P.sav) + '</b></div></div>';
}
function kpiBar(t, v, st, sub) { return '<div class="kpi"><small>' + t + '</small><b>' + v + '</b><span class="st" title="Stufe">St. ' + st + '</span>' + bar(v) + (sub ? '<div class="xs muted" style="margin-top:3px">' + sub + '</div>' : '') + '</div>'; }
function compTag(c) { return c === 'liga' ? '<span class="tag liga">Liga</span>' : c === 'test' ? '<span class="tag test">Test</span>' : c === 'rel' ? '<span class="tag rel">Relegation</span>' : '<span class="tag pokal">' + (c === 'kp' ? 'Kreispokal' : c === 'mrp' ? VPN() : c === 'dfb' ? 'PRO Pokal' : 'Pokal') + '</span>'; }
function calDayHTML(ds, today) {
  var g = V.games.filter(function (x) { return x.d === ds; })[0]; var ev = (V.dayEv || []).filter(function (x) { var nd = x.k === 'camp3' ? 3 : x.k === 'camp5' ? 5 : 1; return x.d === ds || (nd > 1 && ds > x.d && ds <= addD(x.d, nd - 1)); })[0];
  var inCamp = V.camp && ds >= V.camp.from && ds <= V.camp.to; var wd = dObj(ds).getUTCDay(), we = wd === 0 || wd === 6, past = ds < V.date;
  var h = '<div class="cday' + (today ? ' today' : '') + (we ? ' we' : '') + '" style="' + (past ? 'opacity:.55' : '') + '" onclick="dayClick(\'' + ds + '\')"><span class="dh">' + (today ? 'Heute' : WTG[wd]) + '</span><span class="dn">' + ds.slice(8, 10) + '.' + ds.slice(5, 7) + '.</span>';
  if (g) { var cn = g.comp === 'liga' ? 'Liga' : g.comp === 'test' ? (g.label === 'Benefizspiel' ? 'Benefiz' : 'Test') : g.comp === 'rel' ? 'Relegation' : g.comp === 'kp' ? 'Kreispokal' : g.comp === 'mrp' ? VPN() : g.comp === 'dfb' ? 'PRO Pokal' : 'Pokal', cc = g.comp === 'liga' ? '#2f6fd6' : g.comp === 'test' ? '#6b7280' : g.comp === 'rel' ? '#c0392b' : '#c58a12'; var isB = g.benefiz || g.label === 'Benefizspiel'; if (isB) h += '<div class="calben"><b>Benefizspiel</b><span>' + esc(g.opp) + (g.gf != null ? ' · ' + g.gf + ':' + g.ga : '') + '</span></div>'; else h += '<span class="calha" style="--mc:' + cc + '">' + esc(gOrt(g)) + '</span><div class="cg2" style="margin-top:6px;gap:8px;align-items:center">' + crest(g.opp, 'cbig') + '<div style="line-height:1.2"><span class="mark" style="--rot:' + (((ds.charCodeAt(9) * 5) % 7) - 3) + 'deg;--mc:' + cc + ';font-size:12px">' + cn + ' (' + (g.home === false ? 'A' : 'H') + ')</span>' + (g.gf != null ? '<div class="xs" style="font-weight:700;margin-top:2px">' + g.gf + ':' + g.ga + '</div>' : '') + '</div></div>'; }
  if (ev && !(ev.k === 'benefiz' && g && (g.benefiz || g.label === 'Benefizspiel'))) h += '<span class="mark" style="--rot:' + (((ds.charCodeAt(9) * 7) % 9) - 5) + 'deg;--mc:' + (MARKC[ev.k] || '#e8457a') + ';font-size:12px;display:block;width:max-content;max-width:100%">' + esc(ev.name.replace(/„|“/g, '')) + '</span>';
  if (inCamp) h += '<span class="mark" style="--rot:-3deg;--mc:#3b82f6;font-size:12px;display:block;width:max-content">⛺ Trainingslager</span>';
  if (false) h += '<span title="Training" style="position:absolute;right:8px;bottom:4px;font-size:30px">🏃</span>';
  return h + '</div>';
}
function isTrainD(ds) { var w = dObj(ds).getUTCDay(); return V.lvl >= 7 && (w === 2 || w === 4); }
var LABK = { 1: 'BL', 2: '2.BL', 3: '3.L', 4: 'RL', 5: 'MRL', 6: 'LL', 7: 'BZL', 8: 'KLA', 9: 'KLB', 10: 'KLC', 11: 'KLD' };
function lAbk(l) { return LABK[l] || ''; }
function calN() { return window.innerWidth <= 760 ? 4 : 7; }
function dDiff(a, b) { return Math.round((dObj(b) - dObj(a)) / 864e5); }
function calWin() {
  if (!ST.calW || ST.calW > V.date || dDiff(ST.calW, V.date) > 13) { ST.calW = V.date; ST.calXp = V.xp; }
  var reset = false; if (dDiff(ST.calW, V.date) >= calN()) { var gained = V.xp - (ST.calXp || V.xp); ST.calW = V.date; ST.calXp = V.xp; reset = gained; }
  return reset;
}
function cal7HTML() { calWin(); var o = ''; for (var i = 0; i < 7; i++) { var ds = addD(ST.calW, i); o += calDayHTML(ds, ds === V.date); } return o; }
function cal7Update(anim) {
  var c = $('#cal7'); if (!c) return; var r = calWin(); var o = ''; for (var i = 0; i < 7; i++) { var ds = addD(ST.calW, i); o += calDayHTML(ds, ds === V.date); }
  if (r !== false) { c.innerHTML = o; c.classList.remove('slide'); void c.offsetWidth; c.classList.add('slide'); var b = c.getBoundingClientRect(); var x = document.createElement('div'); x.className = 'xpchip'; x.textContent = '+' + Math.max(1, r) + ' XP'; x.style.left = (b.right + window.scrollX - 90) + 'px'; x.style.top = (b.top + window.scrollY + 20) + 'px'; document.body.appendChild(x); setTimeout(function () { x.remove(); }, 1500); }
  else c.innerHTML = o;
}
function simRowHTML() {
  if (V.fired) return '';
  if (V.matchToday) return devBtnHTML() + '<button class="md" onclick="matchDay()">⚽ MatchDay</button>' + icBar();
  var bl = V.blockMails ? '<button class="btn-r" title="' + V.blockMails + ' Nachricht' + (V.blockMails > 1 ? 'en' : '') + ' beantworten" onclick="mailJump()" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><svg width="20" height="15" viewBox="0 0 20 15"><rect x="1" y="1" width="18" height="13" rx="2" fill="#fff"/><path d="M1.5 2 L10 8.5 L18.5 2" fill="none" stroke="#e25c5c" stroke-width="2"/></svg><b>' + V.blockMails + '</b></button>' : '';
  var tr = V.trainToday ? '<button class="btn-r" onclick="trainPop()">🏃 Training festlegen</button>' : '';
  return devBtnHTML() + bl + tr + '<button class="btn-o" onclick="sim(\'day\')">+1 Tag</button><button class="btn-g" onclick="sim(\'match\')">Bis zum nächsten Spiel</button><button class="btn-y" onclick="sim(\'event\')">Bis zum nächsten Ereignis</button>' + icBar();
}
function navHTML(extra) {
  var grp = groupOf(ST.tab);
  return '<nav class="nav" id="tabs">' + GROUPS.map(function (g) {
    var on = grp === g[0]; var sub = g[2];
    var badge = g[0] === 'home' && openMails() ? ' <span class="pill y" style="padding:0 6px">' + openMails() + '</span>' : '';
    if (sub && sub.some(function (x) { return featNew(x[2]); })) badge += ' <span class="newb">NEU</span>';
    if (!sub && g[3] && featNew(g[3])) badge += ' <span class="newb">NEU</span>';
    if (!sub && g[3] && !has(g[3])) badge += ' 🔒';
    return '<button data-g="' + g[0] + '" class="' + (on ? 'on' : '') + (badge.indexOf('newb') >= 0 ? ' hasnew' : '') + '">' + g[1] + (sub ? ' ▾' : '') + badge + '</button>';
  }).join('') + (extra || '') + '</nav>';
}
function render(keepScroll) {
  if (!V) return startScreen();
  ST.screen = 'game'; var sx = window.scrollY;
  applyBg();
  var h = headHTML();
  if (V.fired) h += '<div class="deci" style="background:rgba(226,92,92,.15);margin-top:10px"><h2>Du wurdest am ' + dFull(V.firedOn) + ' entlassen.</h2><div class="small muted">Deine Bilanz bleibt in der Bestenliste, dein Level bleibt sowieso.</div><div class="row" style="margin-top:10px"><button class="pri" onclick="newGameSetup()">Neues Spiel</button></div></div>';
  h += '<div class="kpis" id="kpis">' + kpiHTML() + '</div><div class="cal7" id="cal7">' + cal7HTML() + '</div>';
  h += '<div class="simrow" id="simrow">' + simRowHTML() + '</div>';
  // Joker & Sterne hängen auf allen Seiten wie in der Übersicht über Spalte 1; das Menü darf bis in Spalte 4 laufen
  h += '<div class="navL4"><div class="symwrap navsym" id="navsym">' + symHang() + '</div>' + navHTML('') + '</div><div id="main"></div>';
  $('#app').innerHTML = h;
  try { waBadge(); if (TOKEN && !WA.timer) setTimeout(function () { waSync(); }, 1500); } catch (e0) {}
  $('#tabs').onclick = function (e) { var b = e.target.closest('button[data-g]'); if (b) navClick(b.getAttribute('data-g'), b); };
  renderTab();
  if (keepScroll) window.scrollTo(0, sx);
  var on = document.querySelector('#tabs button.on'); if (on) { var nv = $('#tabs'); nv.scrollLeft = Math.max(0, on.offsetLeft - nv.clientWidth / 2 + on.clientWidth / 2); }
}
function navClick(gk, btn) {
  var g = GROUPS.filter(function (x) { return x[0] === gk; })[0]; if (!g) return;
  if (!g[2]) { go(gk); return; }
  var b = document.querySelector('#tabs button[data-g="' + gk + '"]') || btn; var r = b.getBoundingClientRect();
  var old = $('.dd'); if (old) { var same = old.getAttribute('data-g') === gk; old.remove(); if (same) return; }
  var dd = document.createElement('div'); dd.className = 'dd'; dd.setAttribute('data-g', gk); dd.style.left = Math.min(window.innerWidth - 210, r.left + window.scrollX) + 'px'; dd.style.top = (r.bottom + window.scrollY + 6) + 'px';
  dd.innerHTML = g[2].map(function (s) { var lk = s[2] && !has(s[2]); return '<button class="' + (ST.tab === s[0] ? 'on' : '') + (featNew(s[2]) ? ' hasnew' : '') + '" data-t="' + s[0] + '" style="' + (lk ? 'opacity:.6' : '') + '">' + (lk ? '🔒 ' : '') + s[1] + (lk ? ' <span class="xs muted">ab Level ' + MGR.featLvl(s[2]) + '</span>' : '') + (featNew(s[2]) ? ' <span class="newb">NEU</span>' : '') + '</button>'; }).join('');
  document.body.appendChild(dd);
  dd.onclick = function (e) { var x = e.target.closest('button[data-t]'); if (x) { dd.remove(); go(x.getAttribute('data-t')); } };
  setTimeout(function () { document.addEventListener('click', function cl(e) { if (!dd.contains(e.target)) { if (!e.target.closest('#tabs button[data-g="' + gk + '"]')) dd.remove(); document.removeEventListener('click', cl, true); } }, true); }, 0);
}
function imgOf(group, key) { var m = D && D.imgs && D.imgs[group]; var u = m && (m[key] || m[String(key).toLowerCase()]); return u ? (typeof driveImg === 'function' ? driveImg(u, group === 'bg' ? 2000 : 800) : u) : ''; }
function introSet(k) {
  var b = document.body, bg = $('#introbg');
  if (k) {
    if (!bg) { bg = document.createElement('div'); bg.id = 'introbg'; b.appendChild(bg); }
    var u = imgOf('bg', k); bg.style.backgroundImage = u ? 'linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.35)),url("' + u + '")' : '';
    if (u && introSet.last !== u) { introSet.last = u; var im = new Image(); im.onload = function () { var nh = Math.round((document.documentElement.clientWidth || 1200) * im.naturalHeight / im.naturalWidth); if (Math.abs((window.INTROH || 0) - nh) > 4) { window.INTROH = nh; var p = $('#pop'); if (p && document.body.classList.contains('intro')) p.style.top = Math.max(10, Math.round((nh - p.offsetHeight) / 2)) + 'px'; } }; im.src = u; }
    bg.className = u ? 'img' : 'art'; b.classList.remove('build'); b.classList.add('intro');
    if (!$('#introback')) { var ib = document.createElement('div'); ib.id = 'introback'; ib.innerHTML = fsBtn() + '<button class="icbtn" onclick="quit()" title="Zurück zum Hauptmenü – dein Spiel ist gespeichert">' + ICO.home + '</button>'; b.appendChild(ib); }
  } else if (b.classList.contains('intro')) {
    b.classList.remove('intro'); b.classList.add('build'); if (bg) bg.classList.add('out'); var ib2 = $('#introback'); if (ib2) ib2.remove();
    setTimeout(function () { b.classList.remove('build'); var x = $('#introbg'); if (x) x.remove(); if (V && V.daily && V.daily.open) afterUpdate(); }, 2600);
  }
}
function mailJump() {
  if (ST.tab !== 'home') go('home');
  setTimeout(function () { var m = (V.mails || []).filter(function (x) { return !x.answered; })[0]; if (m && typeof openMail === 'function' && !document.querySelector('#mailbox .opts')) { try { openMail(m.id); } catch (e) {} } var el = $('#mailbox'); if (el) { var y = el.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({ top: y, behavior: 'smooth' }); el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1400); } }, 250);
}
function openMails() { return V && V.mails ? V.mails.filter(function (m) { return !m.answered; }).length : 0; }
function featNew(k) { if (k && S && S.featSeen && S.featSeen[k] && !has(k)) delete S.featSeen[k]; if (!k || !S || !has(k)) return false; if (!S.featSeen) { S.featSeen = {}; GROUPS.forEach(function (g) { (g[2] || []).forEach(function (x) { if (x[2] && has(x[2])) S.featSeen[x[2]] = 1; }); }); } return !S.featSeen[k]; }
// Perl-Effekt: ein langsamer Lichtschimmer, der ab und zu quer über alle Boxen zieht
function sheen() {
  if (LITE || ST.screen !== 'game' || document.visibilityState !== 'visible' || document.querySelector('.sheen')) return;
  var el = document.createElement('div'); el.className = 'sheen';
  el.style.setProperty('--ang', (95 + Math.random() * 50).toFixed(0) + 'deg'); el.style.setProperty('--y0', (Math.random() * 50 - 25).toFixed(0) + '%');
  if (Math.random() < 0.5) el.style.animationDirection = 'reverse';
  document.body.appendChild(el); setTimeout(function () { el.remove(); }, 14500);
}
(function sheenLoop() { setTimeout(function () { try { sheen(); } catch (e) { } sheenLoop(); }, 30000 + Math.random() * 30000); })();
function uiFlag(k, v) { if (S && SAVEID) serverAct('uiSet', { k: k, v: v }).catch(function () { }); }
function go(t, keep) { var fk = tabFeat(t); if (fk && S && featNew(fk)) { S.featSeen[fk] = 1; uiFlag('featSeen', S.featSeen); } if (t !== ST.tab) { ST.newTab = null; ST.newShow = []; ST.calMonth = null; ST.ligaLvl = null; ST.md = null; ST.mdLvl = null; } var dd0 = $('.dd'); if (dd0) dd0.remove(); ST.tab = t; render(true); if (!keep) { var m = $('#tabs'); if (m && m.getBoundingClientRect().top < 0) window.scrollTo(0, Math.max(0, m.getBoundingClientRect().top + window.scrollY - 10)); } }
function renderTab() {
  stopIg(); try { pileClear(); } catch (e) {} var nsy = $('#navsym'); if (nsy) { nsy.innerHTML = symHang(); nsy.classList.toggle('onhome', ST.tab === 'home'); }
  var f = { skills: tSkills, stadion: tStadion, events: tEvents, privat: tPriv, home: tHome, kader: tKader, aufst: tAufst, training: tTraining, jugend: tJugend, kal: tKal, liga: tLiga, pokal: tPokal, transfer: tTransfer, fin: tFin, spons: tSpons, verein: tVerein, fans: tFans, partner: tPartner, med: tMed, psponsor: tPsponsor, jcamps: tJcamps, scout: tScout, masc: tMasc, kurse: tKurse, ausstatter: tAusstatter, manager: tManager, erfolge: tErfolge, news: tNews, missionen: tMissionen }[ST.tab] || tHome;
  var fk = tabFeat(ST.tab);
  $('#main').className = ST.tab === 'home' ? 'hvon' : '';
  $('#main').innerHTML = fk && !has(fk) ? lockHTML(fk) : f();
  if (ST.tab === 'home') { startIg(); setTimeout(fitPartner, 30); }
  if (ST.tab === 'aufst') initDrag();
}
function fitPartner() {
  var mb = $('#mailbox'), pt = document.querySelectorAll('.partner3 .pt'); if (!mb || !pt.length) return;
  var p3 = pt[0].parentNode; if (pt[0].offsetTop !== pt[pt.length - 1].offsetTop) { pt.forEach(function (x) { x.style.height = ''; }); return; }
  var empty = !document.querySelector('#mailbox .mi, #mailbox .mrow, #mailbox [id^=mail]'); var hgt = empty ? mb.offsetHeight : 96;
  pt.forEach(function (x) { x.style.height = Math.max(70, hgt) + 'px'; });
}
window.addEventListener('resize', function () { if (ST.tab === 'home') fitPartner(); });
// Offene Entscheidung direkt wieder anzeigen (falls ihr Fenster von einem anderen verdrängt wurde)
function pendShow() { if (!V.pending) return; if (V.pending.type === 'goal') goalPop(); else decisionPop(); }
// ---------- Entwicklermodus (nur für freigeschaltete Profile – der Server prüft jede Aktion)
function devBtnHTML() { if (!V || !V.devOk) return ''; return '<button class="icbtn devic" title="Entwicklermodus ' + (V.dev ? 'AN' : 'AUS') + '" onclick="devPop()">' + ICO.dev + '</button>'; }
function devPop() {
  if (!V.devOk) return;
  pop('<div class="ptitle"><span>🛠️</span><h2>Entwicklermodus</h2></div><div class="small muted" style="margin-bottom:12px">Nur für dich sichtbar. Alle Aktionen werden vom Server geprüft.</div>' +
    '<div class="devrow"><div><b>Alle Bereiche freischalten</b><div class="xs muted">Keine Level-Sperren mehr – du kannst alles nutzen, auch wenn dein Manager-Level niedriger ist.</div></div><button class="' + (V.dev ? 'pri' : '') + '" onclick="act(\'devToggle\').then(function(){closePop();devPop();})">' + (V.dev ? '✅ AN' : 'AUS') + '</button></div>' +
    '<div class="devrow"><div><b>Manager-Level zurücksetzen</b><div class="xs muted">Alle XP auf 0 – du startest wieder bei Level 1 und spielst ganz normal weiter (gilt für alle Spielstände).</div></div><button onclick="devReset()">🔄 Zurücksetzen</button></div>' +
    '<div class="devrow"><div><b>10.000.000 € gutschreiben</b><div class="xs muted">Je 10 Mio. € für den Verein und dein Privatvermögen – beliebig oft.</div></div><button onclick="act(\'devMoney\')">💶 +10 Mio.</button></div>', { wide: false });
}
function devReset() { if (!confirm('Manager-Level wirklich auf Level 1 (0 XP) zurücksetzen?')) return; act('devXpReset').then(function () { if (typeof ME !== 'undefined' && ME) ME.xp = 0; closePop(); render(true); }); }
function decisionPop() {
  var p = V.pending, ic = { event: '❓', offer: '💰', sponsor: '🤝' }[p.type] || '❓';
  pop('<div id="deci" class="evw"><div class="row" style="gap:10px;align-items:center"><span style="font-size:30px">' + ic + '</span><h2 style="padding:0;margin:0;flex:1">' + esc(p.title) + '</h2>' + (V.pendingCount > 1 ? '<span class="pill">noch ' + (V.pendingCount - 1) + ' weitere</span>' : '') + '</div><div style="line-height:1.55;margin:10px 0 12px">' + esc(p.text) + '</div>' + (p.vet ? extCard(p.vet) : p.pid != null && /abwerb/i.test(p.title) ? abwCard(p.pid) : p.pid != null && (PCARD_RX.test(p.title + ' ' + p.text) || p.type === 'offer') ? pCard(p.pid, true) : '') + '<div class="evbtns">' +
    rotIdx(p.id, p.opts.length).map(function (i) { var o = p.opts[i]; return '<button onclick="decide(' + p.id + ',\'' + o.k + '\',event)">' + esc(o.label) + '</button>'; }).join('') + '</div></div>', { lock: true, auto: 1, cls: 'white', nav: true });
}
function decide(id, k, ev) {
  var x = ev ? ev.pageX : LASTX, y = ev ? ev.pageY : LASTY; var it = V.pending; act('decide', { id: id, choice: k }, { quiet: true }).then(function (r) {
  if (r) fxCard(it.title, splitInfo(r.info), x, y); });
}

/* ===================================================================== Aktionen (laufen auf dem Server, Antwort ist der neue Spielstand) */
function act(action, params, o) {
  o = o || {};
  if (!S) return Promise.resolve(null); var mailsBefore = openMails();
  return serverAct(action, params || {}).then(function (r) {
    V = MGR.view(S, D);
    if (r.levelUp) NOTE.levelUp = r.levelUp;
    if (!o.norender) { closePop(); render(true); }
    if (r.info && !o.quiet) toast(r.info);
    if (!o.norender) afterUpdate(mailsBefore);
    return r;
  }, function (e) { var em = (e && e.message) || String(e);
    // Server sieht noch eine offene Entscheidung, die hier nicht angezeigt wird: Spielstand neu laden und das Fenster zeigen
    if (/offene Entscheidung|Saisonbericht|höhere Mannschaft/.test(em)) { reloadGame().then(function () { if (V.pending) pendShow(); else afterUpdate(openMails()); }); return null; }
    if (e && e.status !== 409) toast(em, true); return null; });
}
function afterUpdate(mailsBefore) { try { symWatch(); } catch (e) {}
  if (!V || ST.screen !== 'game') return;
  if (mailsBefore != null && openMails() > mailsBefore) SND.mail();
  introSet(V.pending && V.pending.type === 'goal' ? 'saisonziel' : V.spNeed ? 'hauptsponsor' : V.kitNeed ? 'ausstatter' : (V.pressPending === true && V.needAlloc) ? 'budget' : V.pressPending ? 'presse' : (V.prep && V.prep.need) ? (V.prep.phase === 'winter' && imgOf('bg', 'vorbereitung_winter') ? 'vorbereitung_winter' : 'vorbereitung') : null);
  if (!V.seasonRep) { ST.voteDone = false; ST.votes = {}; }
  if (V.seasonRep) return seasonPop(V.seasonRep.vote && !ST.voteDone ? 'v0' : 0);
  if (V.twin) return twinPop();
  if (V.fired) return firedPop();
  if (V.jokNew) { act('jokSeen', {}, { quiet: true, norender: true }); try { SND.joker(); } catch (e) {} pop('<div class="evw" style="text-align:center"><div class="jokcard">🃏</div><h2>Joker erhalten!</h2><div class="small">Für deinen Einsatz bei Fans und Social Media. Direkt nach einem Spiel kannst du damit in der Übersicht die Zeit zurückdrehen und das Spiel wiederholen.</div><button class="pri" style="width:100%;margin-top:12px" onclick="closePop();render(true)">Super!</button></div>', { lock: true }); return; }
  if (V.warnPop) return warnPopShow();
  if (V.inhPop) return inhPopShow();
  if (V.jokIntro) return jokIntroPop();
  if (V.starIntro) return starIntroPop();
  if (V.sellPop) return sellPopShow();
  if (V.tipPop) return tipPopShow();
  if (V.certPop) return certPopShow();
  if (V.starPop) return starPop(true);
  if (V.pending && V.pending.type === 'goal') return goalPop();
  if (V.spNeed) return spPop();
  if (V.kitNeed) return kitPop('kit');
  if (V.pressPending === true && V.needAlloc) return allocPop();
  if (V.pressPending) return pressPop();
  if (V.cupPop) return cupPop();
  if (V.lastGate && V.lastGate.fx && ST.tab === 'home') { act('gateSeen', {}, { quiet: true, norender: true }); setTimeout(gateFx, 400); }
  if (V.twPop) return twPop();
  if (V.weekNeed) return weekPop();
  if (V.potsPop) return potsPop();
  if (V.unlockNote) return unlockPop();
  if (V.posPop) return posPop();
  if (V.trPop) return trPopShow();
  if (V.giftPop) return sgPop();
  if (V.langExam) return examPop();
  if (V.benefizRes) return benefizPop();
  if (V.langQ) return langPop();
  if (V.trialRes) return trialPop();
  if (V.hsAnim) { starFx(V.hsAnim); act('hsSeen', {}, { quiet: true, norender: true }); toast('½ Stern für den Pokalsieg gesammelt!'); }
  if (V.prep && V.prep.need && V.prep.phase === 'summer' && !S.prepSeen) return prepIntroPop();
  if (V.prep && V.prep.need) return prepPop();
  if (V.needAlloc) return allocPop();
  if (V.pending) return decisionPop();
  if (NOTE.levelUp) { var u = NOTE.levelUp; NOTE.levelUp = null; return levelUpPop(u); }
  if (V.lastSigned) { var s = V.lastSigned; S.lastSigned = null; V.lastSigned = null; uiFlag('lastSigned'); }
  if (V.priv && V.priv.fam && V.priv.fam.res) return famResPop();
  if (V.priv && V.priv.fam && V.priv.fam.pend) return famNamePop();
  if (V.trainToday) return trainPop();
  if (V.prep && V.prep.info) return prepInfoPop();
  if (V.daily && V.daily.open && !V.live && !document.body.classList.contains('intro') && !$('#pop')) return dailyPop();
}
function sim(mode) { if (mode === 'match') { try { pileClear(); } catch (e) {} }
  if (SIMRUN) return;
  if (V.pending) { pendShow(); return; }
  if (V.blockMails) { toast('Erst die offenen Nachrichten beantworten.', true); go('home'); return; }
  if (V.trainToday) { trainPop(); return; }
  if (ST.tab !== 'home') { ST.tab = 'home'; render(true); }
  SIMRUN = true; SND.click(); var mailsBefore = openMails(), ib0 = S.inbox && S.inbox[0] ? S.inbox[0].d + S.inbox[0].t : '';
  serverAct('run', { mode: mode }).then(function (r) {
    SIMRUN = false; V = MGR.view(S, D); if (r.levelUp) NOTE.levelUp = r.levelUp;
    try { var nev = []; for (var ii = 0; ii < (S.inbox || []).length && ii < 40; ii++) { var it = S.inbox[ii]; if (it.d + it.t === ib0) break; if (it.k === 'verein' && /^🎉/.test(it.t)) nev.push(it.t); } nev.slice(0, 3).reverse().forEach(function (t) { var m = /^🎉\s*([^:]+):\s*(.*)$/.exec(t); toast(m ? m[2] : t.replace(/^🎉\s*/, ''), false, m ? '🎉 ' + m[1] : '🎉 Ereignis'); }); } catch (e) {}
    var k = $('#kpis'), sr = $('#simrow');
    if (k) k.innerHTML = kpiHTML(); cal7Update(); if (sr) sr.innerHTML = simRowHTML();
    render(true); afterUpdate(mailsBefore);
  }, function (e) { SIMRUN = false; if (e && e.status !== 409) toast((e && e.message) || String(e), true); V = MGR.view(S, D); render(true); afterUpdate(mailsBefore); });
}
/* ---------- Pressekonferenz */
function pressSVG() {
  var logos = [ownLogo(), S && S.reg && S.reg.verband !== 'Mittelrhein' ? VLOGO.dfb : VLOGO.fvm, VLOGO.dfb]; if (V.mainSp) logos.push(spLogo(V.mainSp.firm, true)); if (V.kit && BRANDLOGO[V.kit.brand]) logos.push(BRANDLOGO[V.kit.brand]); var defs = '<defs>' + logos.map(function (u, i) { return '<image id="pl' + i + '" href="' + u + '" width="19" height="19" preserveAspectRatio="xMidYMid meet"/>'; }).join('') + '<clipPath id="hc"><circle cx="200" cy="58" r="21"/></clipPath></defs>';
  var wall = '<rect width="400" height="118" fill="#f7f7f5"/>'; for (var y = 0; y < 3; y++) for (var x = 0; x < 8; x++) wall += '<use href="#pl' + ((x + y * 2) % logos.length) + '" x="' + (x * 52 + (y % 2 ? 26 : 0) + 4) + '" y="' + (y * 38 + 8) + '"/>';
  var head = '<ellipse cx="200" cy="58" rx="17" ry="20" fill="#e8b48a"/><ellipse cx="183" cy="60" rx="3" ry="5" fill="#dca37a"/><ellipse cx="217" cy="60" rx="3" ry="5" fill="#dca37a"/><path d="M183 52 q0 -20 17 -20 q17 0 17 20 q-4 -9 -17 -9 q-13 0 -17 9z" fill="#3a2a1a"/><path d="M190 54 h6 M204 54 h6" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/><circle cx="193" cy="59" r="2" fill="#1a1a1a"/><circle cx="207" cy="59" r="2" fill="#1a1a1a"/><path d="M200 60 q-2 6 1 7" stroke="#c98d63" stroke-width="1.6" fill="none"/><path d="M193 70 q7 5 14 0" stroke="#8a3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>';
  return '<svg viewBox="0 0 400 180" style="display:block;width:100%;border-radius:12px;background:#f7f7f5">' + defs + wall +
    '<path d="M150 150 Q152 92 200 86 Q248 92 250 150z" fill="#1f2a38"/><path d="M188 86 L200 112 L212 86z" fill="#fff"/><path d="M196 90 L204 90 L202 96 L206 124 L200 132 L194 124 L198 96z" fill="#d42a2a"/><path d="M176 92 L196 128 L186 100z M224 92 L204 128 L214 100z" fill="#141d27"/>' +
    '<rect x="193" y="72" width="14" height="16" fill="#e8b48a"/>' + head +
    '<rect x="0" y="132" width="400" height="48" fill="#2a3a52"/><rect x="0" y="128" width="400" height="8" fill="#3a4d6a"/><text x="200" y="158" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="13" fill="#fff" letter-spacing="2">PRESSEKONFERENZ</text><text x="200" y="173" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9.5" fill="#8fc852">' + esc(V.pressTitle || '') + '</text>' +
    [[-62, '#e24b4b'], [-36, '#f0c24b'], [36, '#3d8fe0'], [62, '#ffffff']].map(function (m) { return '<g transform="translate(' + (200 + m[0]) + ' 122)"><rect x="-2.5" y="-4" width="5" height="12" fill="#222"/><circle cx="0" cy="-8" r="6" fill="#333"/><rect x="-6" y="-2" width="12" height="5" fill="' + m[1] + '"/></g>'; }).join('') + '</svg>';
}
var PRESS = { step: 0, ans: [] };
function pressPop() {
  PRESS = { step: 0, ans: [] };
  pop(pressSVG() + '<div id="pressQ" style="margin-top:12px"></div>', { lock: true, wide: true, top: true });
  pressDraw();
}
function pressDraw() {
  var Q = V.press[PRESS.step], el = $('#pressQ'); if (!el) return;
  el.innerHTML = '<div class="row sp"><span class="xs muted">Frage ' + (PRESS.step + 1) + ' von ' + V.press.length + '</span><span class="xs muted">Lokalpresse · Radio · Vereins-TV</span></div><h2 style="padding:0;margin:6px 0 12px;animation:fxin .3s">„' + esc(Q[0]) + '“</h2><div class="pqa">' +
    pick3(Q).map(function (i) { var o = Q[1][i]; return '<button style="text-align:left;padding:12px;min-height:58px" onclick="pressAns(' + i + ')">' + esc(o[0]) + '</button>'; }).join('') + '</div>';
  popRecenter();
}
// Immer genau drei Antworten (fest je Frage gewählt, Index bleibt der Originalindex)
function pick3(Q) { var ix = Q[1].map(function (_o, i) { return i; }); if (ix.length <= 3) return ix; var h = 0; String(Q[0]).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); while (ix.length > 3) { ix.splice(h % ix.length, 1); h = Math.floor(h / 7) + 13; } return ix; }
function pressAns(i) {
  if (PRESS.busy) return; PRESS.ans.push(i); SND.click();
  var o = (V.press[PRESS.step][1] || [])[i] || [], FL = { fans: 'Fans', vorstand: 'Vorstand', moral: 'Moral', sponsoren: 'Sponsoren' };
  var fx = String(o[1] || '').split(';').map(function (x) { var m = x.trim().match(/^(\w+):([+-]?\d+)$/); return m && FL[m[1]] ? FL[m[1]] + ' ' + (+m[2] > 0 ? '+' : '') + (+m[2]) : null; }).filter(Boolean);
  var el = $('#pressQ'); if (el) el.querySelectorAll('.pqa button').forEach(function (b, k) { b.disabled = true; if (k === i) b.style.outline = '3px solid #8fc852'; });
  toast(fx.length ? fx.join(' · ') : 'Keine Auswirkung', false, '🎤 Pressekonferenz – Frage ' + (PRESS.step + 1));
  PRESS.busy = true;
  if (PRESS.step + 1 < V.press.length) { setTimeout(function () { PRESS.busy = false; PRESS.step++; pressDraw(); }, 1300); return; }
  setTimeout(function () { PRESS.busy = false; pressFinish(); }, 1300);
}
function pressFinish() {
  act('press', { a: PRESS.ans }, { quiet: true, norender: true }).then(function (r) { if (!r) return; closePop(); render(true);
  var agg = {}; splitInfo(r.info).forEach(function (x) { var m = x.match(/^(.*) ([+-]\d+)$/); if (m) agg[m[1]] = (agg[m[1]] || 0) + +m[2]; }); fxCard('Pressekonferenz', ['+5 XP'], LASTX, LASTY); setTimeout(function () { afterUpdate(); }, 900); });
}
/* Zweitmannschaft: höhere Mannschaft übernehmen – Spieler aus beiden Kadern wählen */
var TWSEL = null;
function twinPop() {
  var T = V.twin, own = V.players.filter(function (p) { return !(p.loan && p.loan.to); });
  if (!TWSEL || TWSEL.up !== T.up) { var all = own.map(function (p) { return ['o', p]; }).concat(T.sq.map(function (p) { return ['n', p]; })).sort(function (a, b) { return b[1].str - a[1].str; }); TWSEL = { up: T.up, o: {}, n: {} }; all.slice(0, 24).forEach(function (x) { TWSEL[x[0]][x[1].id] = 1; }); own.forEach(function (p) { if (p.self) TWSEL.o[p.id] = 1; }); }
  var row = function (k, p) { var on = !!TWSEL[k][p.id]; return '<label class="twr' + (on ? ' on' : '') + '"><input type="checkbox" ' + (on ? 'checked' : '') + (p.self ? ' disabled' : '') + ' onchange="TWSEL.' + k + '[' + p.id + ']=this.checked?1:0;twinPop()"><span class="pb ' + p.pos + '">' + p.pos + '</span><b>' + esc(p.n) + '</b><span class="xs muted">' + p.age + ' J.</span><span class="twst">' + String(p.str).replace('.', ',') + '</span></label>'; };
  var cnt = Object.keys(TWSEL.o).filter(function (k) { return TWSEL.o[k]; }).length + Object.keys(TWSEL.n).filter(function (k) { return TWSEL.n[k]; }).length;
  var srt = function (L) { return L.slice().sort(function (a, b) { return (PORD[a.pos] || 0) - (PORD[b.pos] || 0) || b.str - a.str; }); };
  pop('<div class="evw"><div class="ptitle"><span>🛑</span><h2>Kein Aufstieg für die ' + esc(V.club) + '</h2></div><div class="small" style="line-height:1.55;margin:6px 0 10px">In der ' + esc(T.name) + ' spielt schon die <b>' + esc(T.up) + '</b>. Der Vorstand möchte, dass du sie übernimmst. Such dir aus beiden Kadern deine Mannschaft zusammen (16 bis 30 Spieler, mindestens ein Torwart).</div>' +
    '<div class="grid g2" style="gap:10px"><div><h3 style="margin:0 0 6px">' + esc(V.club) + '</h3><div class="twl">' + srt(own).map(function (p) { return row('o', p); }).join('') + '</div></div><div><h3 style="margin:0 0 6px">' + esc(T.up) + '</h3><div class="twl">' + srt(T.sq).map(function (p) { return row('n', p); }).join('') + '</div></div></div>' +
    '<div class="row sp" style="margin-top:10px"><b>' + cnt + ' Spieler ausgewählt</b></div><div class="grid g2" style="gap:8px;margin-top:8px"><button class="pri" onclick="twinGo(true)">Die ' + esc(T.up) + ' übernehmen</button><button onclick="twinGo(false)">Bei der ' + esc(V.club) + ' bleiben</button></div></div>', { lock: true, xwide: true });
}
function twinGo(take) {
  var keep = Object.keys(TWSEL.o).filter(function (k) { return TWSEL.o[k]; }).map(Number), add = Object.keys(TWSEL.n).filter(function (k) { return TWSEL.n[k]; }).map(Number);
  act('twinDecide', { take: take, keep: keep, add: add }, { quiet: true }).then(function (r) { if (!r) return; TWSEL = null; closePop(); render(true); toast(r.info || '', false, take ? '🏟️ Neue Mannschaft' : 'Entscheidung'); afterUpdate(); });
}
function icBar() { return '<span class="icbar">' + fsBtn() + '<button class="icbtn' + (DIRTY ? ' dirty' : '') + '" id="savebtn" title="Speichern' + (DIRTY ? ' – ungespeicherte Änderungen' : '') + '" onclick="save(false)">' + ICO.save + '</button><button class="icbtn" title="Beenden" onclick="quitPop()">' + ICO.power + '</button><button class="icbtn" title="Einstellungen" onclick="settingsPop()">' + ICO.gear + '</button></span>'; }
/* ---------- Hauptsponsor */
var NW = {};
function negoOffers(kind) { return kind === 'sp' ? V.spOffers : kind === 'ps' ? V.psOffers : kind === 'pv' ? V.pvOffers : kind === 'ball' ? V.ballOffers : V.kitOffers; }
function negoRefresh(kind, m) { if (kind === 'sp') spPop(m); else if (kind === 'pv' || kind === 'ps') { renderTab(); if (m) toast(m); } else kitPop(kind, m); }
function negoCtl(kind, i, what, v) { var o = negoOffers(kind)[i]; var yrs = what === 'y' ? Math.max(1, Math.min(3, o.yrs + v)) : o.yrs; if (what === 'y' && yrs === o.yrs) return toast(v > 0 ? 'Länger als 3 Jahre geht nicht.' : 'Mindestens 1 Jahr.', true); NW[kind + i] = { yrs: yrs, more: what === 'm' ? v : 0 }; negoGo(kind, i); }
function negoGo(kind, i) { var o = negoOffers(kind)[i], w = NW[kind + i] || { yrs: o.yrs, more: 0 }; act('nego', { kind: kind, i: i, yrs: w.yrs, more: w.more }, { quiet: true, norender: true }).then(function (r) { if (!r) return; delete NW[kind + i]; if ((!V.kitNeed && kind === 'kit') || (!V.spNeed && kind === 'sp')) { closePop(); render(true); fxCard(kind === 'sp' ? 'Hauptsponsor' : 'Ausstatter', splitInfo(r.info), LASTX, LASTY); xpFx(5, LASTX, LASTY); setTimeout(afterUpdate, 900); return; }
  if (/stimmt zu/.test(r.info)) rewardFx(LASTX, LASTY); negoRefresh(kind, r.info); }); }
function negoCard(kind, o, i, head, valHtml, acceptJs, mcol) {
  if (o.gone) return '<div class="o" style="opacity:.45">' + head + '<div class="small" style="color:var(--r);font-weight:700">❌ Verhandlung abgebrochen</div></div>';
  var left = 3 - (o.nego || 0), mood = o.mood == null ? 100 : o.mood, mc = mood >= 65 ? 'var(--g)' : mood >= 35 ? 'var(--y)' : 'var(--r)';
  var moreL = kind === 'pv' ? '＋ Leihspieler' : '💶 Mehr Geld';
  var b = function (what, v, lbl) { return '<button class="sm" style="flex:1" ' + (left > 0 ? '' : 'disabled') + ' onclick="negoCtl(\'' + kind + '\',' + i + ',\'' + what + '\',' + v + ')">' + lbl + '</button>'; };
  return '<div class="o"' + (mcol ? ' style="box-shadow:inset 0 3px 0 ' + mcol + '"' : '') + '>' + head + valHtml + '<div class="xs muted">Laufzeit: <b style="color:var(--t)">' + o.yrs + (o.yrs === 1 ? ' Jahr' : ' Jahre') + '</b></div>' +
    '<div class="xs muted" style="display:flex;align-items:center;gap:6px">Laune <div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden"><div style="height:100%;width:' + mood + '%;background:' + mc + '"></div></div>' + (o.last === 'ok' ? '✅' : o.last === 'no' ? '✋' : '') + '</div>' +
    '<div style="border-top:1px solid var(--linie);padding-top:8px;margin-top:2px"><div class="xs muted" style="margin-bottom:4px">' + (left > 0 ? 'Verhandeln – jeder Klick ist ein Versuch (' + left + ' übrig)' : 'Keine Verhandlung mehr möglich') + '</div><div class="row" style="gap:5px">' + b('y', -1, '− Jahr') + b('y', 1, '+ Jahr') + '</div><div class="row" style="gap:5px;margin-top:5px">' + b('m', 1, moreL) + (kind === 'pv' && !o.army ? b('m', 2, '＋ Kaufoptionen') : '') + '</div></div>' +
    '<button class="pri" style="margin-top:4px" onclick="' + acceptJs + '">Unterschreiben</button></div>';
}
function amtCols(O) { var live = O.filter(function (o) { return !o.gone; }).map(function (o) { return o.amt; }).sort(function (a, b) { return a - b; }); return function (a) { if (live.length < 2) return '#3f9a1c'; return a === live[live.length - 1] ? '#3f9a1c' : a === live[0] ? '#d43c3c' : '#c28400'; }; }
function spPop(msg0) {
  var O = V.spOffers || [], renew = O.some(function (o) { return o.renew; });
  var h = '<div class="row" style="gap:10px"><span style="font-size:30px">🤝</span><div><h2 style="padding:0;margin:0">' + (renew ? 'Hauptsponsor: Verlängerung' : 'Neuer Hauptsponsor') + '</h2><div class="small muted">Jeder Sponsor nennt Summe und Laufzeit. Jeder Klick auf − Jahr, + Jahr oder Mehr Geld ist ein Verhandlungsversuch (max. 3) – die Laune sinkt. Scheitern zwei Verhandlungen, unterschreibst du automatisch beim dritten.</div></div></div>' + (msg0 ? '<div class="hint">' + esc(msg0) + '</div>' : '') +
    '<div class="spoff" style="margin-top:12px">' + O.map(function (o, i) {
      var head = '<div style="background:#fff;border-radius:10px;height:54px;display:grid;place-items:center"><img src="' + spLogo(o.firm) + '" style="max-height:40px;max-width:90%"></div><b>' + esc(o.firm) + '</b>' + (o.renew ? '<span class="pill g" style="align-self:flex-start;font-size:10px">bisheriger Partner</span>' : '');
      var cf = amtCols(O)(o.amt); return negoCard('sp', o, i, head, '<div class="big" style="font-size:19px;color:' + cf + '">' + eur(o.amt) + '<span class="xs muted"> / Saison</span></div>', 'spDo(\'spAccept\',' + i + ')', cf);
    }).join('') + '</div>';
  pop(h, { lock: true, wide: true, top: true });
}
function spDo(a, i) {
  var p = { i: i }; if (a === 'spAccept') p.yrs = V.spOffers[i].yrs;
  act(a, p, { quiet: true, norender: true }).then(function (r) { if (!r) return; NW = {};
  if (a === 'spAccept') { closePop(); render(true); SND.sign && SND.sign(); fxCard('Hauptsponsor', splitInfo(r.info.replace('Hauptsponsor: ', '')), LASTX, LASTY); xpFx(5, LASTX, LASTY); rewardFx(LASTX, LASTY); setTimeout(afterUpdate, 900); return; }
  spPop(r.info); });
}
/* ---------- Ausstatter */
function kitPop(kind, msg0) {
  var O = negoOffers(kind) || [];
  var h = '<div class="row" style="gap:10px"><span style="font-size:30px">' + (kind === 'ball' ? '⚽' : '👕') + '</span><div><h2 style="padding:0;margin:0">' + (kind === 'ball' ? 'Ballpartner wählen' : 'Ausstatter wählen') + '</h2><div class="small muted">Der Betrag fließt pro Saison ins Budget. Jeder Klick auf − Jahr, + Jahr oder Mehr Geld ist ein Versuch (max. 3) – ' + (kind === 'kit' ? 'brechen zwei Marken ab, unterschreibst du automatisch bei der letzten.' : 'mit jedem Versuch sinkt die Laune.') + '</div></div></div>' + (msg0 ? '<div class="hint">' + esc(msg0) + '</div>' : '') +
    '<div class="spoff" style="margin-top:12px">' + O.map(function (o, i) {
      var head = '<div style="background:#fff;border-radius:10px;height:64px;display:grid;place-items:center"><img src="' + (BRANDLOGO[o.brand] || '') + '" alt="' + esc(o.name) + '" style="max-height:42px;max-width:85%"></div><b>' + esc(o.name) + '</b>';
      var cf = amtCols(O)(o.amt); return negoCard(kind, o, i, head, '<div class="big" style="font-size:19px;color:' + cf + '">' + eur(o.amt) + '<span class="xs muted"> / Saison</span></div>', 'kitDo(\'' + kind + '\',\'kitAccept\',' + i + ')', cf);
    }).join('') + '</div>' + (kind === 'ball' ? '<button class="sm" style="margin-top:10px" onclick="closePop()">Später</button>' : '');
  pop(h, { lock: kind !== 'ball', wide: true, top: true, cls: 'tilt glass' });
}
function kitDo(kind, a, i) {
  var p = { kind: kind, i: i }; if (a === 'kitAccept') p.yrs = negoOffers(kind)[i].yrs;
  act(a, p, { quiet: true, norender: true }).then(function (r) { if (!r) return; NW = {};
  if (a === 'kitAccept') { closePop(); render(true); fxCard(kind === 'ball' ? 'Ballpartner' : 'Ausstatter', splitInfo(r.info.replace(/^(Ausstatter|Ballpartner): /, '')), LASTX, LASTY); xpFx(kind === 'ball' ? 3 : 5, LASTX, LASTY); rewardFx(LASTX, LASTY); setTimeout(afterUpdate, 900); return; }
  kitPop(kind, r.info); });
}
/* ---------- Positionswechsel */
function benefizPop() {
  var B = V.benefizRes;
  pop('<div style="text-align:center"><div style="font-size:40px">🌟</div><h2 style="padding:0">Benefizspiel gegen ' + esc(B.opp) + '</h2><div style="font-size:34px;font-weight:900;margin:6px 0">' + B.gf + ':' + B.ga + '</div><div class="small muted">' + (B.win ? RX('Sensation im Ländchen! 🔥') : 'Ein Fest für die ganze Region!') + '</div><div class="row" style="justify-content:center;gap:8px;margin:14px 0;flex-wrap:wrap"><span class="pill g" style="font-size:13px">💶 +' + eur(B.inc) + '</span><span class="pill g" style="font-size:13px">📣 +' + num(B.fg) + ' Follower</span><span class="pill g" style="font-size:13px">❤️ Fans ↑</span></div><button class="pri" onclick="closePop();act(\'benefizAck\',{},{quiet:true})">Klasse!</button></div>', { lock: true });
  try { fwBurst(); } catch (e) {}
}
var EXAM = { t: null, end: 0, ans: [], i: 0 };
function examPop() {
  var E = V.langExam; if (!EXAM.end || EXAM.k !== E.k) { EXAM = { t: null, end: Date.now() + 5 * 60000, ans: [], i: 0, k: E.k }; }
  var q = E.q[EXAM.i], left = Math.max(0, Math.round((EXAM.end - Date.now()) / 1000));
  pop('<div class="evtilt"><div class="row sp"><b>🎓 Abschlussprüfung ' + esc(E.n) + ' · ' + esc(E.lvN) + '</b><b id="exT" style="color:' + (left < 60 ? '#e25c5c' : '#17201a') + '">' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + '</b></div><div class="psbar" style="margin:8px 0"><i style="width:' + (EXAM.i / E.q.length * 100) + '%;background:#8fc852"></i></div><div class="xs muted">Frage ' + (EXAM.i + 1) + ' von ' + E.q.length + ' · 55 % richtig zum Bestehen · 5 Minuten</div><div style="font-size:17px;font-weight:700;margin:16px 0;line-height:1.4">' + esc(q.q) + '</div><div class="evbtns">' + q.o.map(function (o, i) { return '<button onclick="examAns(' + i + ')">' + esc(o) + '</button>'; }).join('') + '</div></div>', { lock: true, wide: true, keep: 1 });
  clearInterval(EXAM.t); EXAM.t = setInterval(function () { var el = $('#exT'); if (!el) { clearInterval(EXAM.t); return; } var l = Math.max(0, Math.round((EXAM.end - Date.now()) / 1000)); el.textContent = Math.floor(l / 60) + ':' + String(l % 60).padStart(2, '0'); if (l < 60) el.style.color = '#e25c5c'; if (l <= 0) { clearInterval(EXAM.t); examEnd(); } }, 500);
}
function examAns(i) { EXAM.ans[EXAM.i] = i; EXAM.i++; if (EXAM.i >= V.langExam.q.length) return examEnd(); examPop(); }
function examEnd() { clearInterval(EXAM.t); var a = EXAM.ans.slice(); EXAM = { t: null, end: 0, ans: [], i: 0 }; closePop(); act('langExamDone', { a: a }, { quiet: true }).then(function (r) { if (!r || !r.info) return; var ok = /Bestanden/.test(r.info), m = String(r.info).match(/(\d+) von (\d+)/), pc = m ? Math.round(+m[1] / +m[2] * 100) : 0, xm = String(r.info).match(/\+(\d+) XP/);
  pop('<div class="evtilt" style="text-align:center"><div style="font-size:44px">' + (ok ? '🎓' : '📚') + '</div><h2 style="padding:0">' + (ok ? 'Prüfung bestanden!' : 'Leider nicht bestanden') + '</h2><div class="exbar"><i id="exbi" style="width:0%;background:' + (ok ? '#5fbf3a' : '#e25c5c') + '"></i><b id="exbt">0 %</b></div>' + (ok && xm ? '<div class="pill g" style="margin-top:8px">+' + xm[1] + ' XP</div>' : '') + '<div class="xs muted" style="margin-top:8px">' + (ok ? '' : esc(String(r.info).replace(/^❌\s*/, ''))) + '</div><button class="pri" style="margin-top:12px" onclick="closePop()">OK</button></div>', { white: true });
  var t0 = Date.now(); (function an() { var k = Math.min(1, (Date.now() - t0) / 1400), v = Math.round(pc * (1 - Math.pow(1 - k, 3))), bi = $('#exbi'), bt = $('#exbt'); if (!bi) return; bi.style.width = v + '%'; bt.textContent = v + ' %'; if (k < 1) requestAnimationFrame(an); else if (ok) try { fwBurst(); } catch (e) {} })(); }); }
function sgPop() {
  var L = V.giftPop;
  var h = '<div class="evw"><div style="text-align:center"><div style="font-size:42px">🎁</div><h2 style="padding:0">Geschenk vom Hauptsponsor</h2><div class="small" style="line-height:1.6;max-width:520px;margin:0 auto">Der <b>Transfermarkt</b> ist erst ab <b>Manager-Level ' + (MGR.featLvl('transfers') || 5) + '</b> verfügbar – aber ' + (V.fin && V.fin.sponsors && V.fin.sponsors[0] ? 'dein Hauptsponsor <b>' + esc(V.fin.sponsors[0].firm) + '</b>' : 'dein Hauptsponsor') + ' übernimmt die Ablöse für deinen <b>ersten Transfer</b>. Wähle einen Spieler:</div></div>' +
    '<div class="sgl">' + L.map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) { return (PORD[a.p.dp] || 0) - (PORD[b.p.dp] || 0) || b.p.str - a.p.str; }).map(function (o) { var p = o.p, i = o.i; return '<button class="sgr" onclick="closePop();act(\'giftPick\',{i:' + i + '})"><span class="pb ' + p.dp + '">' + p.dp + '</span><b class="sgn">' + esc(p.n) + '</b><span class="wchip">' + p.age + ' J.</span>' + stars(p.talLo, p.talHi) + '<span class="small muted" style="text-align:right">' + eur(p.sal) + '/M</span>' + strBox(p.str) + '</button>'; }).join('') + '</div></div>';
  var pm = {}; V.players.forEach(function (p) { pm[p.id] = p; });
  var row = function (p, pos) { return p ? '<div class="row" style="gap:6px;padding:4px 0;border-top:1px solid #e3e8df"><span class="pb ' + (pos || p.pos) + '">' + (pos || p.pos) + '</span><span class="small" style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.n) + '</span>' + strBox(p.str) + '</div>' : ''; };
  var LU = V.lineup || {}, xi = (LU.slots || []).map(function (sl) { return row(pm[sl.pid], sl.pos); }).join(''), bn = (V.benchIds || []).map(function (id) { return row(pm[id]); }).join('');
  var side = function (t, b) { return '<div class="box" style="margin:0;padding:10px"><h3 style="margin:0 0 6px">' + t + '</h3>' + (b || '<div class="xs muted">–</div>') + '</div>'; };
  h = '<div style="display:grid;grid-template-columns:1fr 2fr 1fr;gap:12px;align-items:end">' + side('👕 Erste Elf', xi) + h + side('🪑 Ersatzbank', bn) + '</div>';
  pop(h, { lock: true, xwide: true, top: true }); var pe = $('#pop'); if (pe) pe.classList.add('sgpop');
}
function langAns(i, btn) {
  if (LANGBUSY) return; LANGBUSY = true; act('langAnswer', { i: i }, { quiet: true, norender: true }).then(function (r) { if (!r) { LANGBUSY = false; return; }
  var ok = /^✅/.test(r.info || ''), m = /„([^“]+)“/.exec(r.info || ''), corr = ok ? btn.getAttribute('data-o') : (m ? m[1] : '');
  document.querySelectorAll('.lqb').forEach(function (b) { b.disabled = true; var t = b.getAttribute('data-o'); if (t === corr) { b.style.background = '#2e9b46'; b.style.color = '#fff'; b.style.transform = 'scale(1.04)'; } else if (b === btn) { b.style.background = '#d84343'; b.style.color = '#fff'; } else b.style.opacity = '.45'; });
  try { speakAns(LQCUR, corr); } catch (e) {}
  var res = $('#lqres'); if (res) res.innerHTML = ok ? '<span style="color:#2e9b46;font-size:18px">✅ Richtig! +2 XP</span>' : '<span style="color:#d84343">❌ Leider falsch – richtig ist „' + esc(corr) + '“. Die Frage kommt später nochmal.</span>';
  if (ok) { try { SND.coin && SND.coin(); } catch (e) {} try { xpFx(2, LASTX, LASTY); } catch (e) {} } else { var p = $('#pop'); if (p) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = 'shake .4s'; } }
  setTimeout(function () { LANGBUSY = false; closePop(); if (r.info && /Abschlussprüfung/.test(r.info)) toast(r.info.replace(/^.*?📝/, '📝')); render(true); }, ok ? 1300 : 2400);
  });
}
var LANGBUSY = false, LQCUR = null;
var TTSL = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', pl: 'pl-PL' };
function speakAns(q, corr) {
  if (!q || !corr || !window.speechSynthesis || !TTSL[q.k]) return;
  var txt = corr, m = /^(Was bedeutet|Welche Zahl ist)[^„]*„([^“]+)“/.exec(q.q || ''); if (m) txt = m[2];
  else { var mt = /^[^?:]*[?:] (.*___.*)$/.exec(q.q || ''); if (mt) txt = mt[1].replace('___', corr); }
  var u = new SpeechSynthesisUtterance(txt); u.lang = TTSL[q.k]; u.rate = 0.9; var vs = speechSynthesis.getVoices().filter(function (v) { return v.lang && v.lang.replace('_', '-').indexOf(TTSL[q.k].slice(0, 2)) === 0; }); if (vs.length) u.voice = vs[0];
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function langPop() {
  var q = V.langQ, lg = (V.lang || []).filter(function (x) { return x.k === q.k; })[0] || {}; LQCUR = q;
  pop('<div class="evw" style="text-align:center"><div style="font-size:38px">' + (FLC[q.k] ? flagImg(FLC[q.k], 34) : '🗣️') + '</div><h2 style="padding:0;margin:4px 0">' + esc(q.n) + ' üben</h2><div class="small muted">Frage für ' + esc(V.slpNames[q.lv]) + '</div><div style="font-size:17px;font-weight:700;margin:16px 0;line-height:1.4">' + esc(q.q) + '</div><div class="evbtns">' + q.o.map(function (o, i) { return '<button class="lqb" data-o="' + esc(o) + '" onclick="langAns(' + i + ',this)">' + esc(o) + '</button>'; }).join('') + '</div><div id="lqres" style="min-height:22px;margin-top:10px;font-weight:800"></div></div>', { lock: true, y: Math.max((window.scrollY || 0) + 10, (LASTY || 200) - 120), x: LASTX || null });
}
function trPopShow() {
  var T = V.trPop, isIn = T.t === 'in', X = T.x || {}, L = (D.media && D.media[isIn ? 'kauf' : 'verkauf']) || [], u = L.length ? L[(V.mediaN * 7 + (T.n || '').length) % L.length] : imgOf('bg', isIn ? 'transfer_kauf' : 'transfer_verkauf');
  var ev = X.ev || (isIn ? ['✍️', 'Neuzugang'] : ['👋', 'Abschied']);
  var card = '<div class="trcard"><div class="row" style="gap:10px;align-items:center">' + (X.pos ? '<span class="pb ' + X.pos + '">' + X.pos + '</span>' : '') + '<div style="text-align:left;flex:1;min-width:0"><div style="font-size:18px;font-weight:800">' + esc(T.n) + '</div><div class="xs muted" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' + (X.age ? '<span class="wchip">' + X.age + ' J.</span>' : '') + (X.tal ? stars(X.tal, X.tal) : '') + (isIn ? (T.club ? 'von ' + esc(T.club) : '') : (T.club ? 'zu ' + esc(T.club) : '')) + '</div></div>' + (X.str ? strBox(X.str) : '') + '</div>' +
    '<div class="trk"><div class="trfee ' + (isIn ? 'in' : 'out') + '"><small>' + (isIn ? '💸 Ablösesumme' : '💰 Erlös') + '</small><b>' + (T.fee ? eur(T.fee) : 'ablösefrei') + '</b></div><div class="trev2"><span class="trevic">' + ev[0] + '</span><div><small>Bewertung</small><b>' + esc(ev[1]) + '</b></div></div></div></div>';
  var posted = T.posted;
  pop('<div class="evw" style="text-align:center">' + (u ? '<div class="popban" style="height:200px;background-image:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.7)),url(&quot;' + driveImg(u, 1200) + '&quot;)"><h2 style="padding:0;margin:0;color:#fff">' + (isIn ? '✍️ Neuzugang!' : '👋 Abschied') + '</h2></div>' : '<div style="font-size:44px">' + (isIn ? '✍️' : '👋') + '</div><h2 style="padding:0">' + (isIn ? 'Neuzugang!' : 'Abschied') + '</h2>') + card +
    '<div class="row" style="gap:8px;margin-top:14px"><button class="' + (posted ? 'done' : 'sm') + '" style="flex:1" ' + (posted ? 'disabled' : '') + ' onclick="trPostDo()">' + (posted ? '✔ Gepostet' : '📱 Posten') + '</button><button class="pri" style="flex:2" onclick="act(\'trPopSeen\',{},{quiet:true})">Weiter</button></div></div>', { lock: true, nav: true });
}
function trPostDo() { act('trPost', {}, { quiet: true, norender: true }).then(function (r) { if (!r) return; try { SND.send(); } catch (e) {} trPopShow(); toast(String(r.info || '').replace(/^📱\s*/, ''), /−|-\d/.test(r.info || ''), '📱 Post'); }); }
function posPop() {
  var q = V.posPop, nm = V.dpn || {}, w3 = q.w === 3;
  pop('<div class="evw" style="text-align:center"><div style="font-size:46px">🔄</div><h2 style="padding:0">Neue Hauptposition?</h2><div class="small" style="line-height:1.6"><b>' + esc(q.n) + '</b> (' + q.age + ' J.) ist auf seiner ' + (w3 ? 'Wunschposition' : 'Nebenposition') + ' <b>' + q.dp2 + '</b>' + (nm[q.dp2] ? ' (' + esc(nm[q.dp2]) + ')' : '') + ' bei <b>100 %</b> angekommen – genauso stark wie als <b>' + q.dp + '</b>.</div><div class="xs muted" style="margin-top:8px">' + (w3 ? 'Wird ' + q.dp2 + ' Hauptposition, wird ' + q.dp + ' zur Nebenposition' + (q.old2 ? ' und ' + q.old2 + ' fällt weg' : '') + '.' : 'Wird ' + q.dp2 + ' Hauptposition, wird ' + q.dp + ' zur Nebenposition (95 %).') + ' <b style="color:#2e7d32">+5 XP</b></div><div style="text-align:left">' + pCard(q.pid, true) + '</div><div class="evbtns" style="margin-top:14px"><button class="pri" onclick="closePop();act(\'posSwap\',{yes:true})">✅ Ja, ' + q.dp2 + ' wird Hauptposition</button><button onclick="closePop();act(\'posSwap\',{yes:false})">Nein, ' + q.dp + ' bleibt</button></div></div>', { lock: true, auto: 1 });
}
/* ---------- Transferfenster */
function twPop() {
  var k = V.twPop, wnt = parseInt(V.date.slice(5, 7), 10) <= 2;
  var T = { open: ['🔓', 'Das Transferfenster ist geöffnet!', 'Ab heute kannst du Spieler kaufen, verkaufen und verleihen. Das ' + (wnt ? 'Winterfenster läuft bis 31.01.' : 'Sommerfenster läuft bis 31.08.'), 'var(--g)'], deadline: ['⏰', 'DEADLINE DAY!', 'Heute ist der letzte Tag des Transferfensters. Wer noch einen Spieler holen oder abgeben will, muss es jetzt erledigen! Danach wechseln Spieler erst zum nächsten Stichtag.', 'var(--o)'], close: ['🔒', 'Das Transferfenster ist geschlossen', 'Neue Transfers werden ab jetzt erst zum nächsten Stichtag (' + (wnt ? '01.07.' : '01.01.') + ') wirksam.', 'var(--r)'] }[k];
  pop('<div style="text-align:center"><div style="font-size:52px">' + T[0] + '</div><h2 style="padding:0;color:' + T[3] + '">' + T[1] + '</h2><div class="small" style="line-height:1.6">' + T[2] + '</div></div><div class="row" style="gap:8px;margin-top:14px"><button class="pri" style="flex:1" onclick="act(\'twAck\',{},{quiet:true})">Verstanden</button>' + (k !== 'close' && has('transfers') ? '<button style="flex:1" onclick="act(\'twAck\',{},{quiet:true,norender:true});closePop();go(\'transfer\')">Zum Transfermarkt</button>' : '') + '</div>', { lock: true, auto: 1 });
  if (k === 'deadline') beep(880, .2, 'square', .05);
}
/* ---------- Saisonende: Sterne */
function starFx(n) { for (var k = 0; k < (n || 1); k++) (function (k) { setTimeout(function () { var d = document.createElement('div'); d.className = 'starfx'; d.textContent = '★'; d.style.left = (window.innerWidth / 2 - 20 + (k - (n - 1) / 2) * 50) + 'px'; d.style.top = ((window.scrollY || 0) + 160) + 'px'; document.body.appendChild(d); SND.ding ? SND.ding() : beep(1200 + k * 200, .15, 'triangle'); setTimeout(function () { d.remove(); }, 1700); }, k * 350); })(k); }
function starPop(first) {
  var P = V.starPop; if (!P) return;
  if (first && P.gained) starFx(Math.round(P.gained * 2));
  var cost = function (t) { return t >= 4.5 ? 1.5 : t >= 4 ? 1 : 0.5; };
  var ps = V.players.filter(function (p) { return !(p.loan && p.loan.from) && p.tal < 5; }).slice().sort(function (a, b) { return (PORD[a.pos] || 0) - (PORD[b.pos] || 0) || b.str - a.str; });
  var h = popBan('talent', '⭐', 'Neues Talent – Saison ' + P.season + '/' + String(P.season + 1).slice(2), 'Halbe Sterne an deine Spieler verteilen');
  h += P.auto.length ? '<h3>Automatische Anpassungen</h3>' + P.auto.map(function (a) { return '<div class="row sp small" style="padding:5px 0;border-top:1px solid var(--linie)"><span><span class="pb ' + a.pos + '">' + a.pos + '</span> ' + esc(a.n) + ' <span class="xs muted">' + esc(a.why) + '</span></span><b class="' + (a.d > 0 ? 'pos' : 'neg') + '">' + (a.d > 0 ? '+' : '−') + '½ ★</b></div>'; }).join('') : '';
  h += '<h3 style="margin-top:12px">Gesammelte halbe Sterne</h3>' + (P.why.length ? '<div class="xs muted">' + P.why.map(esc).join(' · ') + '</div>' : '<div class="xs muted">Diese Saison keine Titel – halbe Sterne gibt es für Meisterschaft (2 × ½), Aufstieg (½) und Pokalsiege (½).</div>') +
    '<div class="row sp" style="margin:8px 0"><b>Verfügbar</b><span class="pill g" style="font-size:14px">' + String(V.hsPts).replace('.', ',') + ' ★</span></div><div class="xs muted" style="margin-bottom:6px">Pro Spieler ½ Stern pro Saison. Von 4 auf 4,5 kostet 1 ★, von 4,5 auf 5 kostet 1,5 ★. Sterne kannst du auch aufheben.</div>';
  if (V.hsPts >= 0.5) h += '<div class="plist" style="max-height:320px;overflow:auto">' + ps.map(function (p) { var c = cost(p.tal), dis = p.starDone || V.hsPts < c; return '<div class="pl" style="cursor:default"><span class="pb ' + p.pos + '">' + p.pos + '</span><div><b>' + esc(p.n) + '</b><div class="meta">' + stars(p.tal, p.tal) + '<span>' + p.age + ' J.</span></div></div><div class="row" style="gap:6px">' + strBox(p.str) + '<button class="sm pri" ' + (dis ? 'disabled' : '') + ' onclick="giveStar(' + p.id + ')">' + (p.starDone ? '✓ diese Saison' : '+½ ★ · ' + String(c).replace('.', ',')) + '</button></div></div>'; }).join('') + '</div>';
  h += '<button class="pri" style="width:100%;margin-top:12px" onclick="act(\'starDone\',{},{quiet:true})">' + (V.hsPts >= 0.5 ? 'Bestätigen – restliche Sterne aufheben' : 'Fertig') + '</button>';
  pop(h, { lock: true, auto: 1, wide: true });
}
function giveStar(pid) { act('giveStar', { pid: pid }, { quiet: true, norender: true }).then(function (r) { if (!r) return; starFx(1); toast(r.info); starPop(false); }); }
/* ---------- Vorbereitung (Ausnahme auf Level 1) */
function prepIntroPop() {
  S.prepSeen = true; uiFlag('prepSeen');
  pop('<div class="ptitle"><span>📋</span><h2>Deine erste Vorbereitung</h2></div><div class="small" style="line-height:1.6">Normalerweise darfst du Vorbereitungen (Testspiele, Trainingslager, Turniere) erst ab <b>Manager-Level ' + MGR.featLvl('testspiele') + '</b> selbst planen.<br><br>Zum Einstieg gibt es eine <b style="color:var(--g)">Ausnahme</b>: Plane jetzt <b>2 Testspiele</b> und ein <b>kurzes Trainingslager</b>. Im Winter folgen 1 Testspiel und ein Hallenturnier.</div><div class="row" style="gap:8px;margin-top:14px"><button class="pri" style="flex:1" onclick="prepPop()">Vorbereitung planen</button><button style="flex:1" onclick="prepSkip()">Ohne Vorbereitung</button></div>', { lock: true, top: true });
}
function prepSkip() {
  act('prepPlan', { skip: true }, { quiet: true, norender: true }).then(function (r) { if (!r) return; closePop(); render(true); toast(r.info); setTimeout(afterUpdate, 300); });
}
function prepPop() {
  var P = V.prep, summer = P.phase === 'summer', nT = summer ? 2 : 1;
  var sy = parseInt(V.season, 10); var win = V.prepWin || (summer ? [sy + '-07-02', sy + '-08-31'] : [sy + '-12-15', (sy + 1) + '-02-28']); var min = V.date >= win[0] ? addD(V.date, 1) : win[0];
  var gd = V.games.map(function (g) { return g.d; }); var free = []; for (var d = min; d <= win[1]; d = addD(d, 1)) { if (gd.some(function (x) { return Math.abs(dDiff(x, d)) <= 1; }) || isTrainD(d)) continue; free.push(d); }
  var wk = free.filter(function (d) { var w = dObj(d).getUTCDay(); return w === 0 || w === 6 || w === 3; });
  var first = V.games.filter(function (g) { return g.comp !== 'test' && g.d >= win[0] && g.d >= V.date; }).sort(function (a, b) { return a.d < b.d ? -1 : 1; })[0]; if (first) { wk = wk.filter(function (d) { return d < first.d; }); free = free.filter(function (d) { return d < first.d; }); }
  var fixOpt = first ? '<option disabled data-fix="1" value="" class="optfix">🏆 ' + WTG[dObj(first.d).getUTCDay()] + ', ' + dFull(first.d) + ' · ' + esc(first.label.split(' · ')[0]) + ' (Pflichtspiel)</option>' : '';
  var dOpt = function (sel) { return (summer ? '<option value="">– Datum wählen –</option>' : '') + wk.map(function (d) { return '<option value="' + d + '" ' + (d === sel ? 'selected' : '') + '>' + WTG[dObj(d).getUTCDay()] + ', ' + dFull(d) + '</option>'; }).join('') + fixOpt; };
  var opps = (V.tests || []).slice().sort(function (a, b) { return a.l - b.l; }); var oOpt = function (k) { return opps.map(function (o, i) { return '<option value="' + esc(o.n) + '" ' + (i === k ? 'selected' : '') + '>' + esc(o.n) + ' (' + lAbk(o.l) + ')</option>'; }).join(''); };
  var h = '<div class="ptitle"><span>' + (summer ? '☀️' : '❄️') + '</span><h2>' + (summer ? 'Sommer' : 'Winter') + '-Vorbereitung planen</h2></div><div class="small muted">' + (summer ? '2 Testspiele + Trainingslager (3 Tage)' : '1 Testspiel + Hallenturnier (1 Tag)') + ' · Zeitraum ' + dFull(min) + ' – ' + dFull(win[1]) + '</div>';
  for (var i = 0; i < nT; i++) h += '<div class="prep-row"><b class="small">⚽ Test ' + (i + 1) + '</b><select id="pd' + i + '" onchange="prepCamp()">' + dOpt(summer ? '' : wk[Math.min(wk.length - 1, i * 5 + 2)]) + '</select><select id="po' + i + '">' + oOpt(i) + '</select></div>';
  h += '<div class="prep-row"><b class="small">' + (summer ? '⛺ Trainingslager' : '🏟️ Halle') + '</b><select id="pe"' + (summer ? ' disabled' : '') + '>' + free.map(function (d) { return '<option value="' + d + '">' + WTG[dObj(d).getUTCDay()] + ', ' + dFull(d) + '</option>'; }).join('') + '</select></div>';
  if (!wk.length) h += '<div class="hint">Im Zeitraum ist kein Testspiel-Termin mehr frei. Du kannst die Vorbereitung abbrechen.</div>';
  h += '<div class="prep-row prep-btns" style="margin-top:14px"><span></span><button class="pri" ' + (wk.length ? '' : 'disabled') + ' onclick="prepSend(' + nT + ',' + summer + ')">Vorbereitung planen</button><button onclick="act(\'prepCancel\',{})">Abbrechen</button></div>';
  pop(h, { lock: true, top: true, nofocus: true, fit: true });
  PREPFREE = free; PREPFIRST = first || null; var pe = $('#pe'); if (pe && free.length) pe.value = free[Math.min(free.length - 1, 8)]; if (summer) prepCamp();
}
var PREPFREE = [], PREPFIRST = null;
function prepCamp() {
  ['pd0', 'pd1'].forEach(function (id, ix) { var me = $('#' + id), ot = $('#' + (ix ? 'pd0' : 'pd1')); if (!me || !ot) return; Array.prototype.forEach.call(me.options, function (o) { if (!o.value || o.dataset.fix) return; var blk = o.value === ot.value; o.disabled = blk; o.className = blk ? 'optfix' : ''; o.textContent = o.textContent.replace(/^⚽ /, '').replace(/ · Test \d$/, '') ; if (blk) o.textContent = '⚽ ' + o.textContent + ' · Test ' + (ix ? 1 : 2); }); });
  var a = $('#pd0'), b = $('#pd1'), pe = $('#pe'); if (!a || !b || !pe) return;
  if (!a.value || !b.value) { pe.disabled = true; pe.innerHTML = '<option value="">🔒 Erst beide Testspiele wählen</option>'; return; }
  var cur = pe.value, tl = [a.value, b.value];
  var all = PREPFREE.filter(function (d) { return tl.indexOf(d) < 0; }).map(function (d) { return [d, 0]; }).concat(tl.map(function (d) { return [d, 1]; })).sort(function (x, y) { return x[0] < y[0] ? -1 : 1; });
  pe.innerHTML = all.map(function (x) { var t = WTG[dObj(x[0]).getUTCDay()] + ', ' + dFull(x[0]); return x[1] ? '<option disabled class="optfix">⚽ ' + t + ' · Testspiel</option>' : '<option value="' + x[0] + '">' + t + '</option>'; }).join('') + (PREPFIRST ? '<option disabled data-fix="1" value="" class="optfix">🏆 ' + WTG[dObj(PREPFIRST.d).getUTCDay()] + ', ' + dFull(PREPFIRST.d) + ' · ' + esc(PREPFIRST.label.split(' · ')[0]) + ' (Pflichtspiel)</option>' : '');
  pe.disabled = false; var ok = all.filter(function (x) { return !x[1]; }).map(function (x) { return x[0]; }); pe.value = ok.indexOf(cur) >= 0 ? cur : ok[Math.min(ok.length - 1, 8)];
}
function prepSend(nT, summer) {
  for (var k = 0; k < nT; k++) if (!$('#pd' + k).value) return toast('Bitte für ' + (nT > 1 ? 'beide Testspiele' : 'das Testspiel') + ' ein Datum wählen.', true);
  if (!$('#pe').value) return toast('Bitte ' + (summer ? 'das Trainingslager' : 'das Hallenturnier') + ' wählen.', true);
  var tests = []; for (var i = 0; i < nT; i++) tests.push({ d: $('#pd' + i).value, opp: $('#po' + i).value, home: i % 2 === 0 });
  if (nT > 1 && tests[0].d === tests[1].d) return toast('Zwei Testspiele am selben Tag geht nicht.', true);
  var ev = { d: $('#pe').value }; var p = { tests: tests }; p[summer ? 'camp' : 'halle'] = ev;
  act('prepPlan', p, { quiet: true, norender: true }).then(function (r) { if (!r) return; closePop(); render(true); toast(r.info); setTimeout(afterUpdate, 300); });
}
function prepInfoPop() {
  pop('<div style="font-size:30px">🔒</div><h2>Vorbereitung abgeschlossen</h2><div class="small" style="line-height:1.6">Das war die Einsteiger-Ausnahme. Ab jetzt kannst du Testspiele, Trainingslager und Turniere erst wieder ab <b>Manager-Level ' + MGR.featLvl('testspiele') + '</b> selbst planen.</div><button class="pri" style="width:100%;margin-top:14px" onclick="act(\'prepAck\',{},{quiet:true})">Verstanden</button>', { lock: true });
}
/* ---------- Trainingstag */
var TR_IC = { abwehr: '🛡️', sturm: '🎯', aussen: '↔️', mittelfeld: '🔄', torwart: '🧤', kondition: '🫁', standards: '🚩', taktik: '📋' };
var WP = null, DIFF = { easy: ['Co-Trainer machen lassen', 'var(--g)', 'Läuft automatisch · kleiner Effekt'], mid: ['Training beobachten', 'var(--y)', 'Kurzes, leichtes Minispiel · mittlerer Effekt'], hard: ['Selber mitkicken', 'var(--r)', 'Schnelles, schweres Minispiel · großer Effekt'] };
function weekPop() {
  var T = V.trainDefs, days = V.weekNeed; if (!WP || WP._k !== days.join()) WP = { _k: days.join() };
  var h = '<div class="evw wkw"><div class="row" style="gap:10px"><span style="font-size:30px">📋</span><div><h2 style="padding:0;margin:0">Trainingswoche planen</h2><div class="small muted">Einmal für die ganze Woche (' + days.map(function (d) { return WTG[dObj(d).getUTCDay()]; }).join(' + ') + '): Einheit, Übung, dann wie du dabei bist.</div></div></div><div class="box" style="margin:12px 0 0;padding:12px">';
  if (!WP.t) h += '<div class="grid g4" style="gap:6px">' + Object.keys(T).map(function (k) { return '<button class="sm" style="text-align:left" onclick="wpSet(\'t\',\'' + k + '\')">' + TR_IC[k] + ' ' + esc(T[k][0]) + '</button>'; }).join('') + '</div>';
  else if (!WP.f) h += '<div class="row sp"><div class="xs muted">' + TR_IC[WP.t] + ' ' + esc(T[WP.t][0]) + ' – welche Übung?</div><button class="sm" onclick="wpSet(null)">↺</button></div><div class="grid g3" style="gap:6px;margin-top:6px">' + T[WP.t][2].map(function (f) { return '<button class="sm" onclick="wpSet(\'f\',\'' + esc(f).replace(/'/g, '') + '\')">' + esc(f) + '</button>'; }).join('') + '</div>';
  else h += '<div class="row sp"><div class="xs muted">' + TR_IC[WP.t] + ' ' + esc(T[WP.t][0]) + ' · ' + esc(WP.f) + '</div><button class="sm" onclick="wpSet(null)">↺</button></div><div class="grid g3" style="gap:8px;margin-top:8px">' + ['easy', 'mid', 'hard'].map(function (k) { return '<button class="dfb" style="background:' + DIFF[k][1] + '" onclick="wpGo(\'' + k + '\')">' + DIFF[k][0] + '<div class="xs">' + DIFF[k][2] + '</div></button>'; }).join('') + '</div>';
  h += '</div>';
  h += '</div>';
  pop(h, { lock: true, wide: true, auto: 1 });
}
function wpSet(k, v) { if (k === null) WP = { _k: WP._k }; else { WP[k] = v; if (k === 't') delete WP.f; } weekPop(); }
function wpGo(diff) { if (diff === 'easy') return weekSend(WP.t, WP.f, 'easy', null); closePop(); mgStart(WP.t, WP.f, diff); MG.week = true; }
function weekSend(t, f, diff, score) { act('weekPlan', { t: t, f: f, diff: diff, score: score }, { quiet: true, norender: true }).then(function (r) { if (!r) return; WP = null; closePop(); render(true); toast(r.info); setTimeout(afterUpdate, 300); }); }
function gateFx() {
  var src = $('#gateamt'), dst = document.querySelector('#kpis .kpi:last-child') || $('#kpis'); if (!src || !dst || !V.lastGate) return;
  var a = src.getBoundingClientRect(), b = dst.getBoundingClientRect(), sx = a.left + a.width / 2 + scrollX, sy = a.top + a.height / 2 + scrollY, tx = b.left + b.width / 2 + scrollX, ty = b.top + 30 + scrollY;
  for (var i = 0; i < 14; i++) (function (i) { var e = document.createElement('span'); e.className = 'flyf'; e.textContent = i % 3 ? '💶' : '🪙'; e.style.left = sx + 'px'; e.style.top = sy + 'px'; e.style.setProperty('--tx', (tx - sx + (Math.random() - .5) * 60) + 'px'); e.style.setProperty('--ty', (ty - sy) + 'px'); e.style.animationDelay = i * 0.06 + 's'; $('#fxl').appendChild(e); setTimeout(function () { e.remove(); }, 1500 + i * 60); })(i);
  setTimeout(function () { dst.classList.add('cashpulse'); var f = document.createElement('div'); f.className = 'xpfly'; f.style.color = '#8fc852'; f.textContent = '+' + eur(V.lastGate.amt); f.style.left = tx + 'px'; f.style.top = ty + 'px'; $('#fxl').appendChild(f); setTimeout(function () { f.remove(); dst.classList.remove('cashpulse'); }, 1600); try { SND.coin && SND.coin(); } catch (e) {} }, 1100);
}
function cupPop() {
  var C = V.cupPop, win = C.t === 'win';
  pop('<div class="evw" style="text-align:center"><div class="row" style="justify-content:center;gap:14px;align-items:center"><img src="' + VLOGO.fvm + '" style="height:54px">' + (VLOGO.bit ? '<img src="' + VLOGO.bit + '" style="height:54px">' : '') + '</div><div style="font-size:46px;margin-top:8px">' + (win ? '🏆' : '🎟️') + '</div><h2 style="padding:0">' + (win ? esc(C.n) + ' gewonnen!' : 'Ab ins Finale!') + '</h2><div class="small" style="line-height:1.6">' + (win ? RX('Was für ein Erfolg für die Macht im Ländchen! ') + (C.mrp ? 'Als Kreispokalsieger seid ihr nächste Saison im <b>' + esc(VPN(true)) + '</b> dabei.' : '') : 'Mit dem Einzug ins Kreispokal-Finale habt ihr euch für den <b>' + esc(VPN(true)) + '</b> der nächsten Saison qualifiziert!') + '</div><button class="pri" style="width:100%;margin-top:14px" onclick="act(\'cupAck\',{},{quiet:true})">' + (win ? 'Feiern! 🍾' : 'Stark! 💪') + '</button></div>', { lock: true, auto: 1 });
  rewardFx(window.innerWidth / 2, (window.scrollY || 0) + 200, true); if (win) fwBurst();
}
function potsPop() {
  var P = V.potsPop;
  pop('<div style="text-align:center"><div style="font-size:54px">' + (P.own ? '🏆' : '🎖️') + '</div><div class="xs muted" style="letter-spacing:.12em;text-transform:uppercase">Spieler der Saison ' + P.season + '/' + String(P.season + 1).slice(2) + ' · ' + esc(P.liga || '') + '</div><h2 style="padding:4px 0 0;' + (P.own ? 'color:var(--g)' : '') + '">' + esc(P.n) + '</h2><div class="small">' + esc(P.team) + ' · ' + esc(P.pos) + (P.v ? ' · Ø Note ' + gtx(P.v) : '') + '</div>' + (P.own ? '<div class="hint" style="margin-top:12px">Einer von deinen Jungs! Der Verein ist stolz – <b>+100 XP</b> für dich.</div>' : '<div class="small muted" style="margin-top:10px">Diesmal ging die Auszeichnung an einen anderen Verein. Nächste Saison holt ihn einer von euch!</div>') + '</div><button class="pri" style="width:100%;margin-top:14px" onclick="act(\'potsAck\',{},{quiet:true})">' + (P.own ? 'Feiern! 🎉' : 'Weiter') + '</button>', { lock: true, auto: 1 });
  if (P.own) { fwBurst(); setTimeout(function () { xpFx(100, window.innerWidth / 2, (window.scrollY || 0) + 160); }, 500); }
}
function unlockPop() {
  pop('<div style="text-align:center"><div style="font-size:50px">🔓</div><h2 style="padding:0">Aufstellung freigeschaltet!</h2><div class="small" style="line-height:1.6">Die Vorbereitung ist vorbei – du kennst jetzt deine Jungs. Ab sofort stellst du die Mannschaft für jedes Spiel selbst auf, rechtzeitig vor dem ersten Pflichtspiel.</div></div><div class="row" style="gap:8px;margin-top:14px"><button class="pri" style="flex:1" onclick="act(\'unlockAck\',{},{quiet:true,norender:true});closePop();go(\'aufst\')">Zur Aufstellung</button><button style="flex:1" onclick="act(\'unlockAck\',{},{quiet:true})">Später</button></div>', { lock: true, auto: 1 });
  rewardFx(window.innerWidth / 2, (window.scrollY || 0) + 180, true);
}
function trainPop(sel) {
  var T = V.trainDefs, fit = Math.round(V.players.reduce(function (a, p) { return a + p.fit; }, 0) / Math.max(1, V.players.length));
  var h = '<div class="row sp"><span style="font-size:28px">🏃</span><span class="pill ' + (fit >= 80 ? 'g' : fit >= 60 ? 'y' : 'r') + '">Ø Fitness ' + fit + ' %</span></div><h2>Trainingstag · ' + WTG[dObj(V.date).getUTCDay()] + ' ' + dFull(V.date) + '</h2>';
  if (!sel) {
    h += '<div class="small muted" style="margin-bottom:10px">Welche Einheit steht heute an? Danach leitest du die Übung selbst – je besser du bist, desto mehr verbessern sich die Spieler.</div><div class="grid g2" style="gap:7px">' +
      Object.keys(T).map(function (k) { return '<button style="text-align:left;padding:10px" onclick="trainPop(\'' + k + '\')"><span style="font-size:18px">' + TR_IC[k] + '</span> <b>' + esc(T[k][0]) + '</b><div class="xs muted">' + (T[k][1] ? T[k][1].join(', ') : 'ganzes Team') + '</div></button>'; }).join('') + '</div>' +
      '<button style="width:100%;margin-top:10px" onclick="trainSend(null,null,true)">Training absagen (Fitness +4)</button>';
  } else {
    h += '<div class="small" style="margin-bottom:10px">' + TR_IC[sel] + ' <b>' + esc(T[sel][0]) + '</b> – wähle den Schwerpunkt:</div><div style="display:flex;flex-direction:column;gap:7px">' +
      T[sel][2].map(function (f) { return '<button class="pri" onclick="mgStart(\'' + sel + '\',\'' + esc(f) + '\')">' + esc(f) + '</button>'; }).join('') + '</div><button class="sm" style="margin-top:10px" onclick="trainPop()">◀ Zurück</button>';
  }
  pop(h, { lock: true, auto: 1 });
}
function trainSend(t, f, skip, score, diff) {
  act('trainDay', skip ? { skip: true } : { t: t, f: f, score: score, diff: diff || (MG && MG.diff) || null }, { quiet: true, norender: true }).then(function (r) { if (!r) return;
  if (skip) { closePop(); render(true); toast(r.info); return; }
  var L = V.lastTrain, res = (L && L.res) || [];
  pop('<div style="font-size:28px">' + TR_IC[t] + '</div><h2>' + esc(L.t) + ' – ' + esc(L.f) + (L.score != null ? ' <span class="pill ' + (L.score >= 0.55 ? 'g' : L.score >= 0.35 ? 'y' : 'r') + '">' + Math.round(L.score * 100) + ' %</span>' : '') + '</h2>' + (res.length ? '<table class="t">' + res.map(function (x) { return '<tr><td><span class="pb ' + x.pos + '">' + x.pos + '</span></td><td>' + esc(x.n) + '</td><td class="num ' + (x.d > 0 ? 'pos' : 'neg') + '"><b>' + (x.d > 0 ? '+' : '') + x.d.toFixed(2).replace('.', ',') + '</b></td></tr>'; }).join('') + '</table>' : '<div class="small muted">Keine spürbaren Veränderungen.</div>') + '<div class="xs muted" style="margin-top:8px">Fitness der Spieler ist gesunken und erholt sich an freien Tagen. Gutes Training erhöht auch die Siegchance im nächsten Spiel.</div><button class="pri" style="width:100%;margin-top:12px" onclick="closePop();render(true);afterUpdate()">Weiter</button>', { auto: 1 });
  });
}
/* ---------- Probetraining */
function trialPop() {
  var T = V.trialRes; var col = T.verdict === 'hilft' ? 'var(--g)' : T.verdict === 'knapp' ? 'var(--y)' : 'var(--r)';
  var txt = T.verdict === 'hilft' ? 'Würde uns sofort weiterhelfen.' : T.verdict === 'knapp' ? 'Knappe Sache – wäre eine Option für die Breite.' : 'Hilft uns aktuell eher nicht.';
  pop('<div class="row" style="gap:10px"><span style="font-size:30px">📋</span><div><h2 style="padding:0;margin:0">Probetraining ' + (T.again ? '(2. Anlauf) ' : '') + 'beendet</h2><div class="xs muted">Bericht des Trainerteams</div></div></div>' +
    '<div class="row sp" style="margin-top:12px;background:var(--flaeche2);border-radius:12px;padding:12px"><div><div class="row" style="gap:8px"><span class="pb ' + T.pos + '">' + T.pos + '</span><b style="font-size:16px">' + esc(T.n) + '</b></div><div class="xs muted" style="margin-top:4px">' + T.age + ' Jahre' + (T.pos2 ? ' · auch ' + T.pos2 : '') + '</div><div style="margin-top:4px">' + stars(T.tal) + '</div></div>' + strBox(T.str) + '</div>' +
    kv('Ø Stärke auf seiner Position bei uns', String(T.ga).replace('.', ',')) + kv('Gehaltsvorstellung', eur(T.sal) + ' / Monat') + kv('Marktwert', eurK(T.mw)) +
    '<div class="hint" style="border-left:3px solid ' + col + '"><b style="color:' + col + '">' + txt + '</b><br><span class="small">„' + esc(T.note) + '“</span></div>' +
    '<div style="display:flex;flex-direction:column;gap:7px;margin-top:10px"><button class="pri" onclick="act(\'trial\',{c:\'sign\',yrs:1})">Unter Vertrag nehmen (1 Jahr)</button><button onclick="act(\'trial\',{c:\'sign\',yrs:2})">Unter Vertrag nehmen (2 Jahre)</button>' + (T.again ? '' : '<button onclick="act(\'trial\',{c:\'later\'})">Nächstes Jahr nochmal kommen</button>') + '<button class="red" onclick="act(\'trial\',{c:\'no\'})">Ablehnen</button></div>', { lock: true, auto: 1 });
}
function goalPop() {
  var p = V.pending;
  pop('<div class="evw"><div class="ptitle"><span>🎯</span><h2>' + esc(p.title) + '</h2></div><div class="small" style="line-height:1.55;margin:6px 0 12px">' + esc(p.text) + '</div><div class="grid g2" style="gap:8px" id="goalopts">' +
    p.opts.map(function (o) { return '<button onclick="goalPick(\'' + o.k + '\',event)">' + esc(String(o.label).replace(/\s*\(Vorschlag\)/i, '')) + '</button>'; }).join('') + '</div></div>', { lock: true, top: true });
}
function goalPick(k, ev) {
  var p = V.pending; var cash0 = V.wealth, fans0 = V.fans;
  act('decide', { id: p.id, choice: k }, { quiet: true, norender: true }).then(function (r) { if (!r) return;
  var dm = V.wealth - cash0, df = V.fans - fans0;
  var ch = []; if (dm) ch.push('+' + eur(dm) + ' Zuschuss'); if (df) ch.push('Fans +' + df);
  toast(ch.length ? ch.join(' · ') : 'Keine Sofort-Effekte', false, '🎯 Saisonziel: ' + V.goal);
  closePop(); render(true); afterUpdate();

  });
}
function popBan(key, ic, title, sub) { var u = imgOf('bg', key) || (key === 'aufstieg' ? imgOf('bg', 'saisonende') : ''); if (u) return '<div class="popban" style="background-image:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.75)),url(&quot;' + u + '&quot;)"><div><h2 style="padding:0;margin:0;color:#fff">' + esc(title) + '</h2>' + (sub ? '<div class="small" style="color:rgba(255,255,255,.85)">' + esc(sub) + '</div>' : '') + '</div></div>'; return '<div class="row" style="gap:12px;align-items:center;margin-bottom:6px"><span style="font-size:34px;line-height:1">' + ic + '</span><div><h2 style="padding:0;margin:0">' + esc(title) + '</h2>' + (sub ? '<div class="small muted">' + esc(sub) + '</div>' : '') + '</div></div>'; }
function jokerAvail() { return JOKER_OK && V && !V.live && !V.matchToday && V.jokers > 0; }
function jokerUse() {
  if (!jokerAvail()) return toast('Den Joker kannst du direkt nach einem Spiel einsetzen – zurück in der Übersicht, bevor du weiterspielst.', true);
  pop('<div class="evw"><div class="ptitle"><span>🃏</span><h2>Spiel wiederholen?</h2></div><div class="small" style="line-height:1.55;margin:6px 0 12px">Mit dem Joker spulst du zurück bis zum Anpfiff. Das Spiel wird komplett neu ausgetragen.</div><div class="grid g2" style="gap:8px"><button class="pri" onclick="jokerGo()">🃏 Zurückspulen</button><button onclick="closePop()">Abbrechen</button></div></div>');
}
function jokerGo() {
  closePop();
  try { SND.rewind(); } catch (e) {}
  var o = document.createElement('div'); o.className = 'rewind'; o.innerHTML = '<div class="rwin"><div class="rwclock">⏪</div><div class="rwtxt">Zurück zum Anpfiff …</div></div>'; document.body.appendChild(o);
  var jp = serverJoker(); setTimeout(function () { jp.then(function () { V = MGR.view(S, D); render(true); }); }, 900); setTimeout(function () { o.classList.add('out'); }, 1500); setTimeout(function () { o.remove(); }, 2100); jp.then(function () { toast('🃏 Joker eingesetzt – das Spiel kann neu beginnen!'); }, function (e) { toast((e && e.message) || String(e), true); });
}
function firedPop() {
  pop('<div class="evw">' + popBan('entlassung', '❌', 'Du wurdest entlassen', 'am ' + dFull(V.firedOn)) + '<div class="small" style="margin:10px 0">' + esc((V.firedTxt || '').replace(/^❌ ?/, '')) + '</div><div class="xs muted">Deine Bilanz bleibt in der Bestenliste, dein Manager-Level bleibt erhalten.</div><button class="pri" style="width:100%;margin-top:14px" onclick="quit()">Zurück ins Hauptmenü</button></div>', { lock: true });
}
function inhPopShow() { var I = V.inhPop; pop('<div style="text-align:center"><div style="font-size:46px">🕊️</div><h2 style="padding:0">Eine Erbschaft</h2><div class="small" style="line-height:1.7">' + esc(I.rel) + ' ist leider verstorben. Ihr hattet kaum Kontakt – umso überraschender: Du wurdest im Testament bedacht.</div><div class="kpi" style="margin:14px auto 0;max-width:260px"><small>Erbe (privates Vermögen)</small><b class="pos" style="font-size:24px">+' + eur(I.amt) + '</b></div><button class="pri" style="width:100%;margin-top:14px" onclick="act(\'inhSeen\',{},{quiet:true})">Weiter</button></div>', { lock: true }); }
function warnPopShow() {
  pop('<div class="evw"><div class="row" style="gap:12px;align-items:center"><span style="font-size:38px">⚠️</span><div><h2 style="padding:0;margin:0">Verwarnung vom Vorstand</h2><div class="small muted">Saison im Minus: ' + eur(V.warnPop.cash) + '</div></div></div><div class="small" style="margin-top:10px">Das Minus wird mit dem Budget der neuen Saison ausgeglichen. <b>Schließt du auch die nächste Saison im Minus ab, wirst du entlassen.</b></div><button class="pri" style="width:100%;margin-top:14px" onclick="act(\'warnSeen\',{},{quiet:true})">Verstanden</button></div>', { lock: true });
}
function seasonPop(page) {
  var R = V.seasonRep; var y = (window.scrollY || 0) + 80; if (typeof page === 'string') return seasonPage(page);
  if (page === 0) {
    var t = R.table; var i = t.findIndex(function (r) { return r.svw; }); var a = Math.max(0, Math.min(t.length - 7, i - 3));
    pop(popBan(R.result === 'Aufstieg' ? 'aufstieg' : R.result === 'Abstieg' ? 'abstieg' : 'klassenerhalt', R.result === 'Aufstieg' ? '🏆' : R.result === 'Abstieg' ? '📉' : '🛡️', 'Saisonende ' + R.season + '/' + String(R.season + 1).slice(2), lsh(R.liga)) +
      '<div class="grid g3" style="gap:8px;margin:12px 0"><div class="kpi"><small>Platz</small><b>' + R.rank + '.</b><div class="xs muted">von ' + R.n + '</div></div><div class="kpi"><small>Punkte</small><b>' + R.pts + '</b><div class="xs muted">' + R.s + '-' + R.u + '-' + R.nl + '</div></div><div class="kpi"><small>Tore</small><b>' + R.tore + '</b></div></div>' +
      '<div class="row wr" style="gap:6px;margin-bottom:10px"><span class="pill ' + (R.result === 'Aufstieg' ? 'g' : R.result === 'Abstieg' ? 'r' : '') + '">' + R.result + (R.result !== 'Klassenerhalt' ? ' → ' + esc(lsh(R.newLiga)) : '') + '</span><span class="pill ' + (R.goalOk ? 'g' : 'r') + '">Saisonziel „' + esc(R.goal) + '“ ' + (R.goalOk ? 'erreicht' : 'verfehlt') + '</span></div>' +
      '<table class="t">' + t.slice(a, a + 7).map(function (r) { return '<tr class="' + (r.svw ? 'me ' : '') + (r.zone ? 'z-' + r.zone : '') + '"><td>' + r.rank + '</td><td><div class="tn">' + crest(r.n) + '<span class="n">' + esc(r.n) + '</span></div></td><td class="num">' + (r.diff > 0 ? '+' : '') + r.diff + '</td><td class="num"><b>' + r.pts + '</b></td></tr>'; }).join('') + '</table>' +
      '<div class="small" style="margin-top:10px;line-height:1.8">' + (R.scorer ? '⚽ Bester Torschütze: <b>' + esc(R.scorer.n) + '</b> (' + R.scorer.g + ' Tore)<br>' : '') + (R.best ? '⭐ Spieler der Saison: <b>' + esc(R.best.n) + '</b> (Ø ' + String(R.best.avg).replace('.', ',') + ')<br>' : '') + (R.cups ? '🏆 ' + esc(R.cups) : '') + '</div>' +
      '<button class="pri" style="width:100%;margin-top:14px" onclick="seasonPop(1)">Weiter zu den Finanzen</button>', { lock: true, wide: true, y: y });
  } else {
    pop('<div style="font-size:30px">💶</div><h2>Finanzbilanz der Saison</h2>' + kv('Einnahmen', '<span class="pos">+' + eur(R.inn) + '</span>') + kv('Ausgaben', '<span class="neg">−' + eur(R.out) + '</span>') + kv('Ergebnis', '<b class="' + (R.inn - R.out >= 0 ? 'pos' : 'neg') + '">' + eur(R.inn - R.out) + '</b>') +
      '<div class="hint">Alles, was nicht ausgegeben wurde, nimmst du mit in die neue Saison: <b style="color:var(--t)">' + eur(R.wealth) + '</b> (Bargeld ' + eur(R.pots.cash) + ', Transfer ' + eur(R.pots.tb) + ', Tagesgeld ' + eur(R.pots.sav) + ').</div>' +
      '<button class="pri" style="width:100%;margin-top:14px" onclick="seasonPop(\'lg\')">Weiter</button>', { lock: true, y: y });
  }
}
// ---------- Saisonabschluss: Wahl, Auszählung, Ligen, Bestenlisten, Vorstand, Ladebildschirm
var VOTEK = [['gr', '⭐ Spieler der Saison', function (v) { return 'Ø ' + gtx(v); }], ['g', '⚽ Torschützenkönig', function (v) { return v + ' Tore'; }], ['a', '👟 Bester Vorlagengeber', function (v) { return v + ' Vorlagen'; }]];
function seasonPage(pg) {
  var R = V.seasonRep, y = (window.scrollY || 0) + 80, nx = function (t, to) { return '<button class="pri" style="width:100%;margin-top:14px" onclick="seasonPage(\'' + to + '\')">' + t + '</button>'; };
  ST.votes = ST.votes || {};
  if (/^v\d$/.test(pg)) { var k = +pg.slice(1), VK = VOTEK[k], C = (R.vote && R.vote[VK[0]] && R.vote[VK[0]].top) || []; if (!C.length) return seasonPage(k < 2 ? 'v' + (k + 1) : 'vc');
    return pop(popBan('wahl', '🗳️', 'Die große Wahl · ' + (k + 1) + '/3', VK[1]) + '<div class="small muted" style="margin:8px 0">Die Saison ist vorbei! Trainer, Spieler und Fans der Liga stimmen ab – auch du hast eine Stimme. Wen wählst du?</div>' +
      C.map(function (c, i) { return '<button class="votec' + (c.own ? ' own' : '') + '" onclick="ST.votes[\'' + VK[0] + '\']=' + i + ';seasonPage(\'' + (k < 2 ? 'v' + (k + 1) : 'vc') + '\')">' + crest(c.team) + '<div style="min-width:0;flex:1;text-align:left"><b>' + esc(c.n) + '</b><div class="xs muted">' + esc(c.team) + ' · ' + esc(c.pos || '') + '</div></div><span class="pill">' + VK[2](c.v) + '</span></button>'; }).join(''), { lock: true, y: y }); }
  if (pg === 'vc') { ST.voteDone = true; var h = popBan('wahl', '📊', 'Die Auszählung', 'Saison ' + R.season + '/' + String(R.season + 1).slice(2)), bars = [];
    VOTEK.forEach(function (VK) { var C = (R.vote && R.vote[VK[0]] && R.vote[VK[0]].top) || []; if (!C.length) return; var my = ST.votes[VK[0]]; var vs = C.map(function (c, i) { var sd = 0; for (var q = 0; q < c.n.length; q++) sd = (sd * 31 + c.n.charCodeAt(q)) % 997; return Math.round((5 - i) * 18 + sd % 14) + (i === my ? 6 : 0); }); var mx = Math.max.apply(null, vs), tot = vs.reduce(function (a, b) { return a + b; }, 0);
      h += '<div class="vcbox"><b class="small">' + VK[1] + '</b>' + C.map(function (c, i) { bars.push([vs[i] / tot * 100]); return '<div class="vcrow' + (vs[i] === mx ? ' win' : '') + '"><span class="vcn">' + (vs[i] === mx ? '🏆 ' : '') + esc(c.n) + (i === my ? ' <span class="xs" title="deine Stimme">✔</span>' : '') + '</span><div class="vctrk"><i data-w="' + (vs[i] / tot * 100).toFixed(1) + '"></i></div><span class="xs vcp" data-p="' + Math.round(vs[i] / tot * 100) + '">0 %</span></div>'; }).join('') + '</div>'; });
    pop(h + nx('Weiter zum Saisonabschluss', '0'), { lock: true, wide: true, y: y });
    setTimeout(function () { document.querySelectorAll('.vctrk i').forEach(function (el, i) { setTimeout(function () { el.style.width = el.getAttribute('data-w') + '%'; }, i * 120); }); document.querySelectorAll('.vcp').forEach(function (el, i) { setTimeout(function () { el.textContent = el.getAttribute('data-p') + ' %'; }, 600 + i * 120); }); }, 200); return; }
  if (pg === '0') return seasonPop(0);
  if (pg === 'lg') { var Lg = (R.ligen || []).slice().reverse(); if (!Lg.length) return seasonPage('best');
    return pop(popBan('ligen', '🗺️', 'Die Ligen im Überblick', 'Meister, Auf- und Absteiger') + '<div class="lgladder">' + Lg.map(function (x, i) { return (i ? '<div class="lgarr"><span class="up">▲ ' + (Lg[i].up.length || 0) + '</span><span class="dn">▼ ' + (Lg[i - 1].down.length || 0) + '</span></div>' : '') + '<div class="lgcard' + (x.own ? ' own' : '') + '"><div class="row sp"><b>' + esc(x.n) + '</b>' + (x.own ? '<span class="pill g">deine Liga</span>' : '') + '</div><div class="xs">🏆 ' + esc(x.champ || '–') + '</div>' + (x.up.length ? '<div class="xs pos">⬆ ' + x.up.map(esc).join(', ') + '</div>' : '') + (x.down.length ? '<div class="xs neg">⬇ ' + x.down.map(esc).join(', ') + '</div>' : '') + '</div>'; }).join('') + '</div>' + nx('Weiter zu den Bestenlisten', 'best'), { lock: true, wide: true, y: y }); }
  if (pg === 'best') { var Bv = R.vote; if (!Bv) return seasonPage('board');
    return pop(popBan('bestenliste', '🥇', 'Die Besten der Saison', lsh(R.liga)) + '<div class="grid g3" style="gap:10px;margin-top:10px">' + VOTEK.map(function (VK) { var T0 = Bv[VK[0]]; if (!T0) return ''; return '<div class="vcbox"><b class="small">' + VK[1] + '</b>' + T0.top.slice(0, 3).map(function (c, i) { return '<div class="row sp small" style="padding:4px 0;' + (c.own ? 'color:var(--g);font-weight:800' : '') + '"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ['🥇', '🥈', '🥉'][i] + ' ' + esc(c.n) + '</span><span class="xs">' + VK[2](c.v) + '</span></div>'; }).join('') + (T0.mine ? '<div class="row sp small" style="padding:4px 0;border-top:1px dashed var(--linie);color:var(--g);font-weight:800"><span>' + T0.mine.rank + '. ' + esc(T0.mine.n) + '</span><span class="xs">' + VK[2](T0.mine.v) + '</span></div>' : '') + '</div>'; }).join('') + '</div>' + nx('Weiter zur Bewertung', 'board'), { lock: true, wide: true, y: y }); }
  if (pg === 'board') { var B = R.board; if (!B) return seasonPage('load'); var gt = function (g) { return '<span class="grade g' + g + '">' + g + '</span>'; }, txt = ['', 'Herausragend', 'Sehr gut', 'Ordentlich', 'Ausbaufähig', 'Enttäuschend', 'Ungenügend'];
    return pop(popBan('vorstand', '🧑‍💼', 'Bewertung durch den Vorstand', 'Saison ' + R.season + '/' + String(R.season + 1).slice(2)) + '<div class="small" style="margin:8px 0">„' + txt[B.all] + ' – so fasst der Vorstand deine Saison zusammen.“</div>' +
      '<div class="brdrow"><span>💶 Finanzen</span><span class="xs muted">' + (B.res >= 0 ? 'Plus von ' + eur(B.res) : 'Minus von ' + eur(-B.res)) + '</span>' + gt(B.fin) + '</div><div class="brdrow"><span>⚽ Sportlicher Erfolg</span><span class="xs muted">Platz ' + R.rank + ' · ' + esc(R.result) + '</span>' + gt(B.sport) + '</div><div class="brdrow"><span>📣 Fans & Presse</span><span class="xs muted">' + num(B.follow) + ' Follower</span>' + gt(B.fans) + '</div><div class="brdrow tot"><b>Gesamtnote</b><span></span>' + gt(B.all) + '</div>' +
      (B.xp || B.fol ? '<div class="row" style="gap:8px;justify-content:center;margin-top:10px">' + (B.xp ? '<span class="pill g">+' + B.xp + ' XP</span>' : '') + (B.fol ? '<span class="pill">+' + num(B.fol) + ' Follower</span>' : '') + '</div>' : '') + nx('Weiter', 'load'), { lock: true, y: y }); }
  if (pg === 'load') { var lv = levelOf(ME.xp || V.xp || 0), mc = R.mc;
    pop(popBan('neue_saison', '🚀', 'Saison ' + (R.season + 1) + '/' + String(R.season + 2).slice(2), lsh(R.newLiga)) + '<div class="grid g3" style="gap:8px;margin:10px 0"><div class="kpi"><small>Manager-Level</small><b>' + lv.lvl + '</b><div class="psbar"><i style="width:' + lv.pct + '%;background:#8fc852"></i></div></div><div class="kpi"><small>XP letzte Saison</small><b class="pos">+' + num(R.xpSeason || 0) + '</b></div><div class="kpi"><small>Dein Vertrag</small><b>' + (mc ? eur(mc.sal) : '–') + '</b><div class="xs muted">' + (mc ? '/ Monat · bis ' + mc.until : '') + '</div></div></div>' +
      '<div class="small" style="text-align:center;font-weight:800">Die neue Saison in der ' + esc(lsh(R.newLiga)) + ' wird vorbereitet …</div><div class="ldbar"><i id="ldi"></i><b id="ldt">0 %</b></div><div class="xs muted" id="ldm" style="text-align:center;margin-top:6px">Spielplan wird erstellt …</div><button class="pri" id="ldgo" style="width:100%;margin-top:14px;visibility:hidden" onclick="act(\'ackSeason\',{},{quiet:true})">Neue Saison starten</button>', { lock: true, y: y });
    var t0 = Date.now(), msgs = ['Spielplan wird erstellt …', 'Kader werden gemeldet …', 'Sponsoren unterschreiben …', 'Rasen wird gemäht …', 'Trikots werden gewaschen …', 'Fans kaufen Dauerkarten …', 'Alles bereit!'];
    (function an() { var k = Math.min(1, (Date.now() - t0) / 4200), v = Math.round(k * 100), i = $('#ldi'); if (!i) return; i.style.width = v + '%'; $('#ldt').textContent = v + ' %'; $('#ldm').textContent = msgs[Math.min(msgs.length - 1, Math.floor(k * (msgs.length - 1)))]; if (k < 1) setTimeout(an, 60); else $('#ldgo').style.visibility = 'visible'; })(); return; }
}
function allocPop() {
  var A = V.alloc;
  pop('<div class="row" style="gap:10px;align-items:center"><span style="font-size:30px">🧮</span><h2 style="padding:0;margin:0">Saisonbudget verteilen</h2></div><div class="small muted">Zum Saisonstart kommen <b style="color:var(--t)">' + eur(V.budgetHold) + '</b> aus Sponsoring, Mitgliedsbeiträgen und Spenden. Wie sollen sie (und alle weiteren Einnahmen) verteilt werden?</div>' +
    '<div class="grid g3" style="gap:6px;margin-top:10px"><div><label>Bargeld %</label><input id="al1" type="number" value="' + A.cash + '" oninput="allocPrev()"></div><div><label>Transfer %</label><input id="al2" type="number" value="' + A.tb + '" oninput="allocPrev()"></div><div><label>Tagesgeld %</label><input id="al3" type="number" value="' + A.sav + '" oninput="allocPrev()"></div></div><div id="alp" class="hint"></div>' +
    '<div class="xs muted" style="margin-top:6px">Bargeld zahlt Gehälter, Betrieb und Ausbau (mind. 20 %). Das Transferbudget brauchst du für Ablösen und Gehälter von Neuzugängen. Tagesgeld bringt 2,5 % Zinsen.</div><button class="pri" style="width:100%;margin-top:12px" onclick="act(\'alloc\',{cash:+$(\'#al1\').value,tb:+$(\'#al2\').value,sav:+$(\'#al3\').value})">Budget verteilen</button>', { lock: true, top: true, nofocus: true });
  allocPrev();
}
function allocPrev() { var a = +$('#al1').value || 0, b = +$('#al2').value || 0, c = +$('#al3').value || 0, t = V.budgetHold; $('#alp').innerHTML = (a + b + c !== 100 ? '<span class="neg">Summe ' + (a + b + c) + ' % – muss 100 % ergeben</span>' : 'Bargeld ' + eur(t * a / 100) + ' · Transfer ' + eur(t * b / 100) + ' · Tagesgeld ' + eur(t * c / 100)); }
function levelUpPop(u) {
  var p = pop('<div style="text-align:center"><div style="font-size:56px;animation:popin .6s cubic-bezier(.2,1.6,.4,1)">⭐</div><h2 style="padding:0;color:' + lvCol(u.lvl) + '">Manager-Level ' + u.lvl + '!</h2>' + (u.feats.length ? u.feats.map(function (f) { return '<div class="small" style="margin-top:6px">🔓 <b>' + esc(f.n) + '</b><br><span class="muted">' + esc(f.d) + '</span></div>'; }).join('') : '<div class="small muted">Weiter so – die nächste Freischaltung kommt bald.</div>') + '<button class="pri" style="margin-top:14px" onclick="closePop()">Weiter</button></div>', { auto: 1 });
  SND.level(); fireworks(p);
}
function fireworks(anchor) {
  var r = anchor.getBoundingClientRect(); var cv = document.createElement('canvas'); cv.className = 'cvs-fw';
  var W = window.innerWidth, H = Math.max(420, r.height + 260); cv.width = W; cv.height = H; cv.style.top = Math.max(0, r.top + window.scrollY - 130) + 'px'; document.body.appendChild(cv);
  var x = cv.getContext('2d'), parts = [], t = 0, cols = ['#8fc852', '#f0c24b', '#ffffff', '#6fb3e6', '#ee4b6a', '#f0954b'];
  function burst() { var cx = W * (0.2 + Math.random() * 0.6), cy = 60 + Math.random() * (H * 0.45), c = cols[Math.floor(Math.random() * cols.length)]; for (var i = 0; i < 46; i++) { var a = Math.PI * 2 * i / 46, s = 1.5 + Math.random() * 3.2; parts.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 60 + Math.random() * 30, c: c }); } }
  (function loop() { t++; if (t % 22 === 1 && t < 140) burst(); x.clearRect(0, 0, W, H); parts.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.vx *= 0.99; p.l--; x.globalAlpha = Math.max(0, p.l / 80); x.fillStyle = p.c; x.fillRect(p.x, p.y, 3, 3); }); parts = parts.filter(function (p) { return p.l > 0; }); if (t < 260) requestAnimationFrame(loop); else cv.remove(); })();
}
function signedPop(s) {
  var tc = teamColor(V.club);
  pop('<div class="signcard"><svg viewBox="0 0 400 230" style="display:block;width:100%"><defs><linearGradient id="sgsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a44"/><stop offset="1" stop-color="#3b5a7a"/></linearGradient></defs><rect width="400" height="230" fill="url(#sgsky)"/>' +
    '<rect y="70" width="400" height="60" fill="#2b332b"/><rect y="64" width="400" height="8" fill="#8fc852"/>' + Array.apply(null, Array(90)).map(function (_, i) { return '<circle cx="' + (5 + (i * 37) % 395) + '" cy="' + (78 + (i * 13) % 48) + '" r="2.2" fill="' + (i % 3 ? '#8fc852' : '#fff') + '" opacity=".8"/>'; }).join('') +
    '<rect y="130" width="400" height="100" fill="#3f8a32"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<rect x="' + i * 50 + '" y="130" width="25" height="100" fill="#47963a"/>'; }).join('') +
    '<g transform="translate(200 120)"><circle cx="0" cy="-48" r="17" fill="#e8b48a"/><path d="M-30 0 Q-28 -30 0 -30 Q28 -30 30 0 L26 70 L-26 70Z" fill="' + tc + '"/><text x="0" y="22" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="22" fill="#fff">' + (s.id % 30 + 1) + '</text>' +
    '<g transform="rotate(-18)"><rect x="-95" y="-38" width="190" height="18" fill="#8fc852"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return '<rect x="' + (-95 + i * 21) + '" y="-38" width="10" height="18" fill="#fff"/>'; }).join('') + '</g></g>' +
    '<rect x="14" y="160" width="230" height="56" rx="10" fill="rgba(0,0,0,.65)"/><text x="26" y="184" font-family="Montserrat,sans-serif" font-weight="800" font-size="17" fill="#fff">' + esc(s.n) + '</text><text x="26" y="204" font-family="Montserrat,sans-serif" font-size="12" fill="#cfeeb0">' + s.pos + (s.pos2 ? '/' + s.pos2 : '') + ' · ' + s.age + ' Jahre · Stärke ' + s.str + '</text>' +
    '<text x="386" y="30" text-anchor="end" font-family="Montserrat,sans-serif" font-weight="800" font-size="14" fill="#f0c24b">WILLKOMMEN IM LÄNDCHEN!</text></svg></div>' +
    '<h2 style="margin-top:12px">' + esc(s.n) + ' ist da!</h2><div class="small" style="line-height:1.8">Kommt von <b>' + esc(s.club) + '</b> · Ablöse <b>' + (s.fee ? eur(s.fee) : 'keine') + '</b><br>Gehalt <b>' + eur(s.sal) + '</b>/Monat · Vertrag bis <b>06/' + s.until + '</b></div><button class="pri" style="width:100%;margin-top:12px" onclick="closePop()">Herzlich willkommen!</button>', { wide: true });
  SND.goal();
}
