/**
 * SVW Manager – Spiel-Engine (reine Spiellogik, ohne Google-Dienste)
 */
var MGR = (function () {
  'use strict';

  // ============================================================ Helfer
  var R = Math.random;
  function rnd(a, b) { return a + R() * (b - a); }
  function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(a) { return a[Math.floor(R() * a.length)]; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function gauss() { var u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function poisson(l) { l = clamp(l, 0.05, 8); var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= R(); } while (p > L); return k - 1; }
  function wpick(items, wf) { var t = 0, i; for (i = 0; i < items.length; i++) t += Math.max(0, wf(items[i])); var r = R() * t; for (i = 0; i < items.length; i++) { r -= Math.max(0, wf(items[i])); if (r <= 0) return items[i]; } return items[items.length - 1]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nice(x) { var a = Math.abs(x); var s = a < 1000 ? 10 : a < 10000 ? 100 : a < 100000 ? 500 : a < 1000000 ? 5000 : a < 10000000 ? 50000 : 500000; return Math.round(x / s) * s; }
  function num(x, d) { var n = Number(String(x).replace(',', '.')); return isNaN(n) ? (d || 0) : n; }

  // Datum als 'YYYY-MM-DD'
  function toD(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function toS(d) { return d.toISOString().slice(0, 10); }
  function addDays(s, n) { var d = toD(s); d.setUTCDate(d.getUTCDate() + n); return toS(d); }
  function dow(s) { return toD(s).getUTCDay(); }
  function diffDays(a, b) { return Math.round((toD(b) - toD(a)) / 86400000); }
  function mon(s) { return +s.slice(5, 7); }
  function dayOf(s) { return +s.slice(8, 10); }
  function yr(s) { return +s.slice(0, 4); }
  function seasonOf(s) { return mon(s) >= 7 ? yr(s) : yr(s) - 1; }
  function sd(season, md) { var m = +md.slice(0, 2); return (m >= 7 ? season : season + 1) + '-' + md; }
  function toDow(s, w) { var d = dow(s); var diff = w - d; if (diff > 3) diff -= 7; if (diff < -3) diff += 7; return addDays(s, diff); }
  var WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  function fmtD(s) { return WT[dow(s)] + ', ' + s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4); }
  function euro(x) { return (x < 0 ? '−' : '') + Math.round(Math.abs(x)).toLocaleString('de-DE') + ' €'; }

  var FORMS = {
    '4-4-2': ['TW', 'LV', 'IV', 'IV', 'RV', 'LM', 'ZM', 'ZM', 'RM', 'ST', 'ST'],
    '4-4-2 Raute': ['TW', 'LV', 'IV', 'IV', 'RV', 'DM', 'ZM', 'ZM', 'OM', 'ST', 'ST'],
    '4-3-3': ['TW', 'LV', 'IV', 'IV', 'RV', 'ZM', 'DM', 'ZM', 'LA', 'ST', 'RA'],
    '4-2-3-1': ['TW', 'LV', 'IV', 'IV', 'RV', 'DM', 'DM', 'LM', 'OM', 'RM', 'ST'],
    '4-2-1-3': ['TW', 'LV', 'IV', 'IV', 'RV', 'DM', 'DM', 'OM', 'LA', 'ST', 'RA'],
    '4-1-4-1': ['TW', 'LV', 'IV', 'IV', 'RV', 'DM', 'LM', 'ZM', 'ZM', 'RM', 'ST'],
    '4-3-2-1': ['TW', 'LV', 'IV', 'IV', 'RV', 'ZM', 'DM', 'ZM', 'OM', 'OM', 'ST'],
    '4-5-1': ['TW', 'LV', 'IV', 'IV', 'RV', 'LM', 'ZM', 'DM', 'ZM', 'RM', 'ST'],
    '3-5-2': ['TW', 'IV', 'IV', 'IV', 'LM', 'DM', 'ZM', 'ZM', 'RM', 'ST', 'ST'],
    '3-4-3': ['TW', 'IV', 'IV', 'IV', 'LM', 'ZM', 'ZM', 'RM', 'LA', 'ST', 'RA'],
    '3-4-1-2': ['TW', 'IV', 'IV', 'IV', 'LM', 'ZM', 'ZM', 'RM', 'OM', 'ST', 'ST'],
    '5-3-2': ['TW', 'LV', 'IV', 'IV', 'IV', 'RV', 'ZM', 'DM', 'ZM', 'ST', 'ST'],
    '5-4-1': ['TW', 'LV', 'IV', 'IV', 'IV', 'RV', 'LM', 'ZM', 'ZM', 'RM', 'ST']
  };
  var FSTYLE = { '4-2-1-3': [1.08, 1.0], '4-4-2': [1, 1], '4-4-2 Raute': [1.03, 1.02], '4-3-3': [1.1, 1.07], '4-2-3-1': [1.02, 0.97], '4-1-4-1': [0.97, 0.93], '4-3-2-1': [1.04, 1.01], '4-5-1': [0.93, 0.9], '3-5-2': [1.04, 1.04], '3-4-3': [1.13, 1.12], '3-4-1-2': [1.08, 1.08], '5-3-2': [0.88, 0.85], '5-4-1': [0.82, 0.8] };
  var DPN = { TW: 'Torwart', RV: 'Rechter Verteidiger', LV: 'Linker Verteidiger', IV: 'Innenverteidiger', DM: 'Defensives Mittelfeld', ZM: 'Zentrales Mittelfeld', OM: 'Offensives Mittelfeld', LM: 'Linkes Mittelfeld', RM: 'Rechtes Mittelfeld', LA: 'Linksaußen', ST: 'Mittelstürmer', RA: 'Rechtsaußen' };
  var GRP = { TW: 'TW', IV: 'AB', RV: 'AB', LV: 'AB', DM: 'MF', ZM: 'MF', OM: 'MF', LM: 'MF', RM: 'MF', LA: 'ST', ST: 'ST', RA: 'ST' };
  var MIRR = { RV: 'LV', LV: 'RV', RM: 'LM', LM: 'RM', RA: 'LA', LA: 'RA' };
  var OLDPOS = { AV: ['RV', 'LV'], AM: ['RM', 'LM'], AS: ['RA', 'LA'] };
  var SEC = { TW: [], IV: ['DM', 'RV', 'LV'], RV: ['LV', 'RM', 'IV'], LV: ['RV', 'LM', 'IV'], DM: ['ZM', 'IV'], ZM: ['DM', 'OM'], OM: ['ZM', 'ST'], RM: ['LM', 'RA', 'RV'], LM: ['RM', 'LA', 'LV'], RA: ['LA', 'ST', 'RM'], LA: ['RA', 'ST', 'LM'], ST: ['RA', 'LA', 'OM'] };
  var DPGEN = { TW: ['TW'], AB: ['IV', 'IV', 'IV', 'RV', 'LV'], MF: ['DM', 'ZM', 'ZM', 'RM', 'LM', 'OM'], ST: ['ST', 'ST', 'ST', 'RA', 'LA'] };
  var SW = { ST: 5, RA: 3.5, LA: 3.5, OM: 3, RM: 2, LM: 2, ZM: 1.8, DM: 1, RV: 0.8, LV: 0.8, IV: 0.7, TW: 0.02 };
  var AW = { OM: 3.5, RM: 3.5, LM: 3.5, RA: 3, LA: 3, ZM: 2.5, ST: 2, RV: 1.6, LV: 1.6, DM: 1.2, IV: 0.6, TW: 0.1 };
  function setDp(p, dp) {
    if (dp && GRP[dp]) { p.dp = dp; p.pos = GRP[dp]; } else p.dp = pick(DPGEN[p.pos] || ['ZM']);
    var sc = SEC[p.dp]; p.dp2 = sc.length ? pick(sc) : null; return p;
  }
  function ensureDp(p) { if (!p.dp || !GRP[p.dp]) setDp(p); return p; }
  function migrate(S) {
    if (S.players && !S.dupFix2) { S.dupFix2 = true; var seen = {}; S.players.slice().sort(function (a, b) { return (b.gp || 0) - (a.gp || 0); }).forEach(function (p) { if (p.self) return; var k = p.n + '|' + (p.str0 != null ? p.str0.toFixed(3) : '') + '|' + p.age; if (seen[k] && p.str0 != null) { S.players = S.players.filter(function (q) { return q !== p; }); if (S.lineup) { S.lineup.xi = (S.lineup.xi || []).map(function (x) { return x === p.id ? seen[k] : x; }); S.lineup.bench = (S.lineup.bench || []).filter(function (x) { return x !== p.id; }); } if (S.train && S.train.fp) S.train.fp = S.train.fp.filter(function (x) { return x !== p.id; }); } else seen[k] = p.id; }); if (S.lineup && S.lineup.xi) { var used = {}; S.lineup.xi = S.lineup.xi.map(function (x) { if (x != null && used[x]) return null; used[x] = 1; return x; }); } }
    if (S.world && !S.firstOk) { var rm1 = function (t) { t.n = String(t.n).replace(/\s+(1|I)$/, ''); }; Object.keys(S.world.lv).forEach(function (l) { S.world.lv[l].forEach(rm1); }); Object.keys(S.world.pool).forEach(function (l) { S.world.pool[l].forEach(rm1); }); S.firstOk = true; }
    if (S.world && !S.romanOk) { var rm = function (t) { t.n = String(t.n).replace(/\s+2$/, ' II').replace(/\s+3$/, ' III'); }; Object.keys(S.world.lv).forEach(function (l) { S.world.lv[l].forEach(rm); }); Object.keys(S.world.pool).forEach(function (l) { S.world.pool[l].forEach(rm); }); S.romanOk = true; }
    if (S.world && S.fix) { if (!S.mc) S.mc = { sal: salRoll(S), until: S.season + 2, startLvl: S.lvl, offer: null }; if (!S.priv) S.priv = { cash: 0, owned: {}, rent: null, log: [] }; if (S.relStreak == null) S.relStreak = 0; }
    S.players.forEach(ensureDp); (S.youth || []).forEach(ensureDp);
    if (S.market) { (S.market.list || []).forEach(ensureDp); (S.market.loans || []).forEach(ensureDp); }
    (S.watch || []).forEach(function (w) { ensureDp(w); if (!w.wd) w.wd = S.date; });
    if (!S.skt) { S.skt = {}; S.skc = (S.skc || 0) + 3; S.skcLog = [[S.date, 'Start Fähigkeitsbaum', 3]]; }
    if (!FORMS[S.lineup.form]) { S.lineup.form = '4-4-2'; S.lineup.xi = null; }
    if (!S.mq) S.mq = [];
  }
  var FOCI = { ausgewogen: 'Ausgewogen', kondition: 'Kondition', technik: 'Technik (MF)', abschluss: 'Torabschluss (ST)', abwehr: 'Abwehr (AB)', torwart: 'Torwart (TW)', taktik: 'Taktik', regeneration: 'Regeneration' };
  var TPLANS = { technik: 'Technik (MF)', abschluss: 'Abschluss (ST)', abwehr: 'Zweikampf (AB)', torwart: 'Torwart (TW)', kondition: 'Kondition', allround: 'Allround' };
  var FOCUSPOS = { technik: 'MF', abschluss: 'ST', abwehr: 'AB', torwart: 'TW' };
  var GOALS = { aufstieg: 'Aufstieg', oben: 'Oberes Drittel', mitte: 'Gesichertes Mittelfeld', erhalt: 'Klassenerhalt' };
  var CUPS = {
    kp: { name: 'Kreispokal', dates: ['08-12', '09-09', '10-14', '11-11', '04-07', '05-13'], prize: [0, 0, 300, 500, 1000, 2000] },
    mrp: { name: 'Landespokal', dates: ['08-19', '10-07', '11-18', '03-10', '04-14', '05-29'], prize: [1500, 3000, 5000, 8000, 12000, 20000] },
    dfb: { name: 'PRO Pokal', dates: ['08-15', '10-28', '12-09', '02-03', '04-21', '05-22'], prize: [230000, 460000, 920000, 1800000, 3600000, 5000000] }
  };
  var RNAMES = ['1. Runde', '2. Runde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];
  var MR_TOP = ['Alemannia Aachen', 'Viktoria Köln', 'Fortuna Köln', 'Bonner SC', 'SV Bergisch Gladbach', '1. FC Köln II'];
  var SPONS = {
    brust: { n: 'Brustsponsor', w: 1.0, f: 'sponsor1', brand: 'Trikotaufdruck' },
    bande1: { n: 'Werbebande 1', w: 0.2, f: 'sponsor1', brand: 'Bande an der Haupttribüne' },
    bande2: { n: 'Werbebande 2', w: 0.2, f: 'sponsor1', brand: 'Bande hinter dem Tor' },
    bande3: { n: 'Werbebande 3', w: 0.15, f: 'sponsor2', brand: 'Bande Gegengerade' },
    bande4: { n: 'Werbebande 4', w: 0.15, f: 'sponsor3', brand: 'Bande am Vereinsheim' },
    ausruester: { n: 'Ausrüster', w: 0.5, f: 'sponsor2', brand: 'Trikots, Bälle & Trainingsanzüge' },
    getraenk: { n: 'Getränkepartner', w: 0.35, f: 'sponsor2', brand: 'Exklusiv im Vereinsheim' },
    training: { n: 'Trainingsplatz-Name', w: 0.3, f: 'personal', brand: 'Name des Trainingsplatzes' },
    jugend: { n: 'Jugend-Partner', w: 0.3, f: 'jugend', brand: 'Logo auf allen Jugendtrikots' },
    social: { n: 'Social-Media-Partner', w: 0.35, f: 'sponsor3', brand: 'Präsentiert alle Exchangegram-Posts' },
    aermel: { n: 'Ärmelsponsor', w: 0.4, f: 'sponsor3', brand: 'Logo auf dem Trikotärmel' },
    haupt: { n: 'Hauptsponsor', w: 1.6, f: 'sponsor4', brand: 'Offizieller Hauptsponsor des Vereins' },
    stadion: { n: 'Stadionname', w: 1.4, f: 'sponsor4', brand: 'Namensrechte am Waldstadion' },
    // Werbeflächen, die erst nach dem Bau im Stadion verfügbar sind (b = Bauprojekt)
    led: { n: 'LED-Bande', w: 0.3, f: 'sponsor1', b: 'ledbande', brand: 'Digitale Bandenwerbung rund ums Spielfeld' },
    video: { n: 'Videowand-Spots', w: 0.25, f: 'sponsor2', b: 'videowand', brand: 'Werbespots auf der Videowand' },
    vipl: { n: 'VIP-Logen-Partner', w: 0.5, f: 'sponsor3', b: 'vip', brand: 'Namensgeber der VIP-Logen' },
    tg: { n: 'Tiefgaragen-Partner', w: 0.2, f: 'sponsor2', b: 'tg_vip', brand: 'Branding der VIP-Tiefgarage' },
    dach: { n: 'Dachwerbung', w: 0.4, f: 'sponsor3', b: 'dachwerbung', brand: 'Logo auf dem Stadiondach' }
  };
  var FEATURES = [
    [1, 'basis', 'Grundspiel', 'Kader, Liga, Kalender, Finanzen, Nachrichten und Verträge verlängern'],
    [2, 'aufstellung', 'Eigene Aufstellung', 'Formation wählen und Spieler selbst aufstellen (oder schon nach den ersten beiden Testspielen)'],
    [2, 'academy', 'Academy', 'Eigene Talente fördern und in die Erste holen'],
    [5, 'partner', 'Partnerverein', 'Kooperation mit einem Profiverein: Leihspieler und Kaufoptionen'],
    [3, 'training', 'Training', 'Intensität und Schwerpunkt festlegen'],
    [3, 'tagesmissionen', 'Tagesmissionen', 'Jeden Tag drei neue kleine Aufgaben mit Belohnung'],
    [5, 'missionen', 'Karriere-Missionen', '50 Meilensteine mit großen Belohnungen'],
    [4, 'testspiele', 'Testspiele', 'Testspiele im Kalender vereinbaren'],
    [4, 'kapitaen', 'Aufgaben', 'Kapitän, Elfmeter-, Freistoß- und Eckenschützen bestimmen; Vorbereitung planen'],
    [10, 'events', 'Events', 'Zeitlich begrenzte Aufgaben mit besonderen Preisen'],
    [12, 'maskottchen', 'Maskottchen', 'Ein Maskottchen mit Spezialeffekt für den Verein'],
    [13, 'lehrgang', 'Lehrgänge', 'Trainerlizenzen und Fortbildungen machen dich zum besseren Trainer'],
    [14, 'scouting', 'Scouting', 'Scouting-Tools liefern jede Woche neue Talente'],
    [8, 'psponsor', 'Persönlicher Sponsor', 'Ein eigener Sponsor für dich – das Geld geht ins Privatvermögen'],
    [20, 'jcamps', 'Internationale Camps', 'Eigene Fußballcamps weltweit – jeden Monat neue Talente'],
    [10, 'med', 'Med. Abteilung', 'Physiotherapie, Ärzte und Reha für weniger und kürzere Verletzungen'],
    [4, 'privat', 'Privater Bereich', 'Haus, Auto, Familie und Aktien des Managers'],
    [5, 'transfers', 'Transfermarkt', 'Spieler kaufen und verkaufen'],
    [6, 'ausbau', 'Infrastruktur', 'Stadion, Platz, Trainingsgelände und Verein ausbauen'],
    [7, 'sponsor1', 'Sponsoren I', 'Brustsponsor und die ersten Werbebanden'],
    [8, 'trainingsplan', 'Trainingspläne', 'Förderspieler, individuelle Pläne und Umschulungen'],
    [9, 'sponsor2', 'Sponsoren II', 'Ausrüster, Getränkepartner und weitere Bande'],
    [10, 'leihe', 'Leihgeschäfte', 'Spieler ausleihen und verleihen'],
    [8, 'trainingslager', 'Trainingslager Region', 'Camps in der Region buchen'],
    [12, 'personal', 'Personal', 'Co-Trainer, Physio, Scout & Co. einstellen, Trainingsplatz-Name verkaufen'],
    [13, 'jugend', 'Jugendteams', 'U15, U17, U19 gründen, Talente hochziehen, Jugend-Partner'],
    [14, 'sponsor3', 'Sponsoren III', 'Social-Media-Partner, Ärmelsponsor und vierte Bande'],
    [15, 'ausland', 'Trainingslager Ausland', 'Camps in Österreich, Portugal, Türkei, Spanien, Dubai und den USA'],
    [18, 'spielertrainer', 'Spielertrainer', 'Bei einem neuen Spiel dich selbst als Superspieler erstellen'],
    [20, 'sponsor4', 'Sponsoren IV', 'Hauptsponsor und Stadionname verkaufen'],
    [22, 'akademie', 'Akademie', 'Jugendinternat und Scouting-Netzwerk'],
    [24, 'kredit', 'Bank & Kredite', 'Kredite für große Investitionen aufnehmen'],
    [25, 'hollywood', 'Hollywood-Effekt', 'Ein Weltstar als Werbegesicht (ab 2. Bundesliga)'],
    [26, 'medienstar', 'Medienstar', '+10 % Follower bei allen Social-Media-Aktionen'],
    [27, 'legende', 'Legende', '+15 % Startkapital in jedem neuen Spiel'],
    [28, 'netzwerk', 'Scout-Netzwerk', '+1 Talent-Vorschlag pro Woche im Scouting'],
    [29, 'verhandler', 'Verhandlungsprofi', '5 % Rabatt auf alle Ablösesummen'],
    [30, 'ikone', 'Vereinsikone', '+10 % XP auf alles – du bist eine lebende Legende']
  ];
  var XPLV = [0, 300, 750, 1400, 2250, 3400, 4750, 6500, 8500, 10750, 13250, 16250, 19500, 23250, 27500, 32250, 37500, 43250, 49500, 56250, 63750, 72000, 81000, 90750, 101250, 112500, 125000, 138750, 153750, 170000];
  function levelOf(xp) { var l = 1; for (var i = 0; i < XPLV.length; i++) if (xp >= XPLV[i]) l = i + 1; var cur = XPLV[l - 1], nx = XPLV[l] || (cur + 2500); return { lvl: l, cur: cur, next: nx, pct: Math.round(clamp((xp - cur) / (nx - cur), 0, 1) * 100) }; }
  function featLvl(k) { for (var i = 0; i < FEATURES.length; i++) if (FEATURES[i][1] === k) return FEATURES[i][0]; return 1; }
  function has(S, k) { if (S._dev) return true; if (k === 'aufstellung' && S.aufstOk) return true; return mlv(S) >= featLvl(k); }
  function need(S, k) { if (!has(S, k)) { var f = FEATURES.filter(function (x) { return x[1] === k; })[0]; throw new Error('Ab Manager-Level ' + f[0] + ' freigeschaltet: ' + f[2]); } }
  function itemFeat(it) { if (it.id === 'internat' || it.id === 'scout') return it.id === 'scout' ? 'personal' : 'akademie'; if (/^u1[579]$/.test(it.id)) return 'jugend'; if (it.cat === 'Personal') return 'personal'; return 'ausbau'; }
  function campFeat(c) { return c.ort.indexOf('(') >= 0 ? 'ausland' : 'trainingslager'; }
  function xp(S, n) { if ((S.mlvl || 1) >= 30 && n > 0) n = Math.round(n * 1.1); if (n > 0 && S.skt) n = Math.round(n * (1 + skv(S, 'xp'))); S.xp = (S.xp || 0) + n; S.xpGame = (S.xpGame || 0) + n; }
  var ACH = {
    meister: ['Meisterschaft', 'schale', 150, 'Titel'], aufstieg: ['Aufstieg', 'pfeil', 100, 'Titel'], ungeschlagen: ['Ungeschlagene Saison', 'schild', 120, 'Titel'], saisonziel: ['Saisonziel erreicht', 'medaille', 40, 'Titel'], klassenerhalt: ['Klassenerhalt gesichert', 'schild', 25, 'Titel'],
    pokal_kp: ['Kreispokalsieg', 'pokal', 80, 'Pokal'], pokal_mrp: ['Landespokalsieg', 'pokal', 120, 'Pokal'], pokal_dfb: ['PRO-Pokalsieg', 'pokal', 300, 'Pokal'], sensation: ['Pokalsensation', 'blitz', 60, 'Pokal'], pokal_finale: ['Pokalfinale erreicht', 'pokal', 40, 'Pokal'],
    torjaeger: ['Torschützenkönig', 'schuh', 60, 'Spieler'], spieler_jahr: ['Spieler des Jahres', 'stern', 50, 'Spieler'], hattrick: ['Hattrick', 'schuh', 30, 'Spieler'], eigengewaechs: ['Eigengewächs in der Ersten', 'herz', 25, 'Spieler'], rekordtransfer: ['Transfer über 10.000 €', 'diamant', 30, 'Spieler'], topverkauf: ['Verkauf über 25.000 €', 'diamant', 40, 'Spieler'], elfer: ['Elfmeter gehalten', 'schild', 15, 'Spieler'],
    kantersieg: ['Kantersieg (5+ Tore Differenz)', 'blitz', 25, 'Meilensteine'], serie5: ['5 Pflichtspielsiege in Folge', 'blitz', 40, 'Meilensteine'], siege10: ['10 Pflichtspielsiege', 'medaille', 20, 'Meilensteine'], siege50: ['50 Pflichtspielsiege', 'medaille', 60, 'Meilensteine'], siege100: ['100 Pflichtspielsiege', 'medaille', 120, 'Meilensteine'],
    tore100: ['100 Ligatore', 'schuh', 50, 'Meilensteine'], punkte100: ['100 Ligapunkte', 'medaille', 40, 'Meilensteine'], amt1: ['1 Jahr im Amt', 'medaille', 30, 'Meilensteine'], amt3: ['3 Jahre im Amt', 'medaille', 80, 'Meilensteine'], amt5: ['5 Jahre im Amt', 'krone', 150, 'Meilensteine'],
    fans1000: ['1.000 Fans', 'herz', 40, 'Verein'], fans5000: ['5.000 Fans', 'herz', 100, 'Verein'], wert1m: ['Vereinswert 1 Mio. €', 'diamant', 80, 'Verein'], wert10m: ['Vereinswert 10 Mio. €', 'diamant', 200, 'Verein'], stadion2000: ['Stadion mit 2.000 Plätzen', 'krone', 50, 'Verein'], sponsor5: ['5 Werbepartner gleichzeitig', 'medaille', 40, 'Verein'], ausbau10: ['10 Ausbauten', 'krone', 50, 'Verein'], jugend3: ['Alle Jugendteams gegründet', 'herz', 50, 'Verein'], fest: ['Erstes Vereinsfest', 'herz', 15, 'Verein'],
    lz_6: ['Landesliga erreicht', 'pfeil', 60, 'Ligen'], lz_5: ['5. Liga erreicht', 'pfeil', 100, 'Ligen'], rl: ['Regionalliga erreicht', 'stern', 200, 'Ligen'], profi: ['3. Liga – Profifußball!', 'krone', 400, 'Ligen'], bl2: ['2. Bundesliga erreicht', 'krone', 600, 'Ligen'], bl1: ['Bundesliga erreicht', 'krone', 1000, 'Ligen']
  };
  function ach(S, k, detail, once, lvl) {
    S.achv = S.achv || [];
    if (once && S.achv.some(function (a) { return a.k === k; })) return;
    var def = ACH[k] || [k, 'stern', 25, 'Meilensteine'];
    S.achv.push({ k: k, title: def[0], d: S.date, season: S.season + '/' + String(S.season + 1).slice(2), detail: detail || '', lvl: lvl || S.lvl, xp: def[2] });
    xp(S, def[2]); msg(S, 'erfolg', '🏆 Erfolg: ' + def[0] + (detail ? ' – ' + detail : '') + ' (+' + def[2] + ' XP)');
  }
  function milestones(S) {
    var w = S.wins || 0; if (w >= 10) ach(S, 'siege10', '', true); if (w >= 50) ach(S, 'siege50', '', true); if (w >= 100) ach(S, 'siege100', '', true);
    if ((S.goalsTotal || 0) >= 100) ach(S, 'tore100', '', true); if ((S.ptsTotal || 0) >= 100) ach(S, 'punkte100', '', true);
    if (S.days >= 365) ach(S, 'amt1', '', true); if (S.days >= 1095) ach(S, 'amt3', '', true); if (S.days >= 1825) ach(S, 'amt5', '', true);
    if (S.fanbase >= 1000) ach(S, 'fans1000', '', true); if (S.fanbase >= 5000) ach(S, 'fans5000', '', true);
    if ((S.sponsors || []).length >= 5) ach(S, 'sponsor5', '', true);
    if (Object.keys(S.built || {}).length >= 10) ach(S, 'ausbau10', '', true);
    if (S.built && S.built.u15 && S.built.u17 && S.built.u19) ach(S, 'jugend3', '', true);
    var v = S.cash + S.tb + S.sav + S.players.reduce(function (a, p) { return a + mw(p); }, 0);
    if (v >= 1000000) ach(S, 'wert1m', '', true); if (v >= 10000000) ach(S, 'wert10m', '', true);
  }
  var USERS = ['wachtberger_jung', 'laendchen_ultra', 'svw_oldschool', 'drachenfels_fan', 'berkum_kicker', 'pech_power', 'villip_vibes', 'niederbachem_nr1', 'kunstrasen_king', 'waldstadion_wanderer', 'adendorf_anna', 'ließem_lisa', 'werthhoven_wolf', 'fritzdorf_flo', 'arzdorf_andi', 'groupie_gruen', 'svw_mama', 'bratwurst_bernd', 'flutlicht_fabi', 'ländchen_lena'];
  var POSTKIND = ['stadion', 'flutlicht', 'fans', 'ball', 'sonnenuntergang', 'bratwurst', 'training', 'kunstrasen', 'drachenfels', 'schal'];
  var FIRMS = ['Bäckerei Schmitz', 'Autohaus Rheintal', 'Elektro Becker', 'Dachdeckerei Wolff', 'Drachenfels Getränke', 'Siebengebirgs-Bau', 'Rheinblick Immobilien', 'Ländchen-Apotheke', 'Physio am Kottenforst', 'Malerbetrieb Kremer', 'Gartenbau Esser', 'Kfz-Technik Breuer', 'Rhein-Sieg Logistik', 'Versicherungsbüro Hennes', 'Metzgerei Wirtz', 'Hotel Godesburg-Blick', 'Brauhaus Ahrtal', 'Solar Ländchen', 'IT-Systemhaus Venusberg', 'Steuerbüro Hilger'];

  // ============================================================ Daten normalisieren
  function trEval(S, D, t, p, fee) {
    if (!p) return null; var pos = p.dp || p.pos, str = Math.round(p.str), tal = p.tal || 0, age = p.age || 25, best = 0, same = 0;
    S.players.forEach(function (q) { if (q === p || q.id === p.id) return; var qp = q.dp || q.pos; if (qp === pos) { same++; best = Math.max(best, q.str); } });
    var ev;
    if (t === 'in') { if (str > best + 1) ev = ['💪', 'Hilft uns direkt']; else if (str >= best - 1) ev = ['🧩', 'Gibt uns Breite']; else if (tal >= 3.5 && age < 20) ev = ['🌱', 'Einer für die Zukunft']; else ev = ['➕', 'Erweitert den Kader']; }
    else {
      var gp = S.players.reduce(function (m, q) { return Math.max(m, q.lgp || 0); }, 0), share = gp ? (p.lgp || 0) / gp : 0, sc = (p.g || 0) + (p.a || 0), avgFee = (D.lv[S.lvl].budget || 50000) * 0.03;
      var inXI = (FORMS[S.lineup.form] || []).indexOf(pos) >= 0;
      if (share < 0.25 && sc < 3) ev = ['🤝', 'Guter Deal für beide'];
      else if (fee > avgFee * 1.3) ev = ['💰', 'Wirtschaftlich gut'];
      else if (!inXI) ev = ['🧭', 'Passt nicht ins Spielsystem'];
      else if (same >= 2) ev = ['🚪', 'Platz für Neue geschaffen'];
      else ev = fee > avgFee ? ['💰', 'Wirtschaftlich gut'] : ['🤝', 'Guter Deal für beide'];
    }
    return { pos: pos, str: str, tal: tal, age: age, ev: ev };
  }
  function trLog(S, t, n, fee, club, p, D2) { S.trLog = (S.trLog || []).concat([{ s: S.season, t: t, n: n, fee: fee || 0, club: club || '', d: S.date }]).slice(-80); var ex = null; try { ex = trEval(S, D2 || GD, t, p, fee || 0); } catch (e) {} S.trPopQ = (S.trPopQ || []).concat([{ t: t, n: n, fee: fee || 0, club: club || '', x: ex }]).slice(-5); }
  function balanceSides(L) {
    [['RV', 'LV'], ['RM', 'LM'], ['RA', 'LA']].forEach(function (pr) { var a = L.filter(function (p) { return p.dp === pr[0]; }), b = L.filter(function (p) { return p.dp === pr[1]; });
      while (Math.abs(a.length - b.length) > 1) { var from = a.length > b.length ? a : b, to = from === a ? b : a, p = from.pop(); p.dp = from === a ? pr[1] : pr[0]; if (p.dp2 === p.dp) p.dp2 = MIRR[p.dp]; to.push(p); } });
    var wing = L.filter(function (p) { return /^(RM|LM|RA|LA)$/.test(p.dp); }).length, zm = L.filter(function (p) { return p.dp === 'ZM'; });
    if (wing < 3) zm.slice(0, Math.min(zm.length - 2, 3 - wing)).forEach(function (p, i) { p.dp = i % 2 ? 'LM' : 'RM'; });
  }
  function migratePos(S) {
    if (S.posV === 2) { var RN = { LS: 'LA', RS: 'RA' }; var fx3 = function (o, d) { if (!o || typeof o !== 'object' || d > 7) return; if (Array.isArray(o)) { o.forEach(function (x, i) { if (typeof x === 'string' && RN[x]) o[i] = RN[x]; else fx3(x, d + 1); }); return; } Object.keys(o).forEach(function (k) { var v = o[k]; if (typeof v === 'string' && RN[v] && /^(dp|dp2|dp3|pos|to|wish|fp|pos2|pos3|p)$/.test(k)) o[k] = RN[v]; else if (k === 'posG' && v) { Object.keys(RN).forEach(function (q) { if (v[q] != null) { v[RN[q]] = (v[RN[q]] || 0) + v[q]; delete v[q]; } }); } else if (typeof v === 'object') fx3(v, d + 1); }); }; fx3(S.players, 0); fx3(S.youth, 0); fx3(S.market, 0); fx3(S.watch, 0); fx3(S.trials, 0); S.posV = 3; return; }
    if (S.posV === 3) return; var n = 0;
    var fix = function (o, depth) { if (!o || typeof o !== 'object' || depth > 6) return; if (Array.isArray(o)) { o.forEach(function (x) { fix(x, depth + 1); }); return; }
      ['dp', 'dp2', 'dp3', 'pos', 'to', 'wish', 'fp', 'pos2', 'pos3'].forEach(function (k) { var v = o[k]; if (typeof v === 'string' && OLDPOS[v]) { o[k] = OLDPOS[v][((o.id || n++) % 2)]; } });
      Object.keys(o).forEach(function (k) { var v = o[k]; if (v && typeof v === 'object') fix(v, depth + 1); }); };
    fix(S, 0);
    (S.players || []).forEach(function (p) { if (p.dp2 && p.dp2 === p.dp) p.dp2 = MIRR[p.dp] || null; });
    S.posV = 2;
  }
  function normalize(raw) {
    var roman = function (n) { return String(n || '').trim().replace(/\s+(1|I)$/, '').replace(/\s+2$/, ' II').replace(/\s+3$/, ' III').replace(/\s+4$/, ' IV'); };
    var D = { lv: {}, teams: {}, pool: {}, items: {}, itemList: [], camps: [], events: [], cfg: {} };
    (raw.konfig || []).forEach(function (r) { D.cfg[String(r[0]).trim()] = r[1]; });
    D.club = String(D.cfg['Vereinsname'] || 'SV Wachtberg');
    D.startLvl = parseStartLvl(D.cfg['Start-Ebene'], raw.regeln);
    D.turfYear = num(D.cfg['Kunstrasen Baujahr'], 2018);
    D.cap0 = num(D.cfg['Stadionkapazität'], 1000);
    D.reserve = num(D.cfg['Rücklagen zum Start'], 5000);
    raw.regeln.forEach(function (r) {
      var l = num(r[0]); if (!l) return;
      D.lv[l] = { l: l, name: ligaName(String(r[1])), short: String(r[2]), size: num(r[3], 16), up: num(r[4]), upRel: num(r[5]), down: num(r[6]), downRel: num(r[7]), lo: num(r[8]), hi: num(r[9]),
        day: String(r[10]).indexOf('Sa') === 0 ? 6 : 0, budget: num(r[11]), zus: num(r[12]), ticket: num(r[13]), spons: num(r[14]), tv: num(r[15]), admin: num(r[16]),
        licCap: num(r[17]), licFlut: num(r[18]), licRasen: String(r[19] || ''), link: String(r[20] || '') };
    });
    D.maxLvl = Math.min(11, Math.max.apply(null, Object.keys(D.lv).map(Number)));
    raw.ligen.forEach(function (r) {
      var l = num(r[0]); var n = roman(r[1]); if (!l || !n || !D.lv[l]) return;
      var t = { n: n, b: r[2] === '' || r[2] == null ? null : num(r[2]), w: String(r[4] || '') };
      var typ = String(r[3] || 'Liga').toLowerCase().indexOf('pool') === 0 ? 'pool' : 'teams';
      (D[typ][l] = D[typ][l] || []).push(t);
    });
    raw.ausbau.forEach(function (r) {
      if (!r[0]) return;
      var it = { id: String(r[0]), cat: String(r[1]), name: String(r[2]), desc: String(r[3]), cost: num(r[4]), monthly: num(r[5]), days: num(r[6]), req: String(r[7] || ''), fx: parseFx(String(r[8] || '')), img: String(r[9] || '').trim() };
      D.items[it.id] = it; D.itemList.push(it);
    });
    EXTRA_ITEMS.forEach(function (r) { if (D.items[r[0]]) return; var it = { id: r[0], cat: r[1], name: r[2], desc: r[3], cost: r[4], monthly: r[5], days: r[6], req: r[7] || '', fx: parseFx(r[8]), img: '' }; D.items[it.id] = it; D.itemList.push(it); });
    D.privImg = raw.privImg || {}; D.relImgs = raw.relImgs || []; D.media = raw.media || { gif: [], kauf: [], verkauf: [] };
    raw.camps.forEach(function (r) { if (r[0]) D.camps.push({ id: String(r[0]), name: String(r[1]), ort: String(r[2]), days: num(r[3]), cost: num(r[4]), e: num(r[5], 1), img: String(r[6] || '').trim() }); });
    raw.events.forEach(function (r, i) {
      if (!r[4]) return;
      if (/spieler:/.test(String(r[7] || '')) && /^(Verpflichten|Annehmen)$/.test(String(r[6]))) r = r.slice(), r[6] = 'Zum Probetraining einladen';
      D.events.push({ i: i, w: num(r[0], 1), top: num(r[1], 1), bot: num(r[2], 11), months: String(r[3] || '').split(/[,; ]+/).filter(String).map(Number), title: String(r[4]), text: String(r[5]), yes: String(r[6] || 'Annehmen'), yesFx: String(r[7] || ''), no: String(r[8] || 'Ablehnen'), noFx: String(r[9] || '') });
    });
    var evN = raw.events.length + 1000; EXTRA_EVENTS.forEach(function (r, k) { if (D.events.some(function (e) { return e.title === r[4]; })) return; D.events.push({ i: evN + k, w: r[0], top: r[1], bot: r[2], months: [], title: r[4], text: r[5], yes: r[6], yesFx: r[7], no: r[8], noFx: r[9] }); });
    D.imgs = raw.imgs || {};
    var EVN = ["Maximilian", "Alexander", "Elias", "Noah", "Felix", "Tim", "Julian", "Niklas", "Moritz", "David", "Jan", "Fabian", "Philipp", "Tobias", "Simon", "Lennard", "Mats", "Jannik", "Kilian", "Malte", "Ole", "Hannes", "Till", "Lasse", "Bennet", "Joshua", "Leo", "Theo", "Henry", "Emil", "Anton", "Jakob", "Matteo", "Raphael", "Milan", "Vincent", "Liam", "Nico", "Robin", "Marvin", "Dennis", "Kevin", "Marcel", "Patrick", "Sebastian", "Daniel", "Florian", "Christian", "Dominik", "Benedikt", "Constantin", "Leonard", "Valentin", "Linus", "Mika", "Yannick", "Pascal", "Sven", "Torben", "Jonte", "Aaron", "Samuel", "Elia", "Carlo", "Ilias", "Can", "Emre", "Yusuf", "Mehmet", "Kerem", "Deniz", "Arda", "Burak", "Luis", "Diego", "Marco", "Andrea", "Giovanni", "Lorenzo", "Sandro", "Dario", "Ivan", "Luka", "Marko", "Nikola", "Stefan", "Tomasz", "Kacper", "Mateusz", "Adrian", "Bartosz", "Jonathan", "Gabriel", "Rafael", "Mario", "Enrico", "Fynn", "Bastian", "Jeremy", "Kai", "Colin", "Tyler", "Dustin", "Silas", "Joel", "Mattis", "Piet", "Jarne", "Lio", "Malik", "Amir", "Karim", "Samir", "Omar", "Adem", "Ismail", "Ayoub", "Kofi", "Kwame", "Yaw", "Moussa", "Ibrahima", "Sekou", "Mamadou"], ENN = ["Becker", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann", "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier", "Lehmann", "Schmid", "Schulze", "Maier", "Köhler", "Herrmann", "König", "Walter", "Mayer", "Huber", "Kaiser", "Fuchs", "Peters", "Lang", "Scholz", "Möller", "Weiß", "Jung", "Hahn", "Schubert", "Vogel", "Friedrich", "Keller", "Günther", "Frank", "Berger", "Winkler", "Roth", "Beck", "Lorenz", "Baumann", "Franke", "Albrecht", "Schuster", "Simon", "Ludwig", "Böhm", "Winter", "Kraus", "Martin", "Schumacher", "Krämer", "Vogt", "Stein", "Jäger", "Otto", "Sommer", "Groß", "Seidel", "Heinrich", "Brandt", "Haas", "Schreiber", "Graf", "Schulte", "Dietrich", "Ziegler", "Kuhn", "Kühn", "Pohl", "Engel", "Horn", "Busch", "Bergmann", "Thomas", "Voigt", "Sauer", "Arnold", "Wolff", "Pfeiffer", "Brenner", "Esser", "Thelen", "Lohmar", "Pütz", "Krings", "Over", "Weidenfeld", "Rösgen", "Nettekoven", "Hennes", "Schäfers", "Felder", "Höhner", "Kurth", "Dahmen", "Jansen", "Breuer", "Heinen", "Kremer", "Sieben", "Wirtz", "Bodden", "Gerhards", "Klöckner", "Lindlar", "Steffens", "Wittmann", "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Öztürk", "Aydın", "Arslan", "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Nowak", "Kowalski", "Wiśniewski", "Petrović", "Jovanović", "Horvat", "Kovač", "Silva", "Santos", "Costa", "Pereira", "Diallo", "Traoré", "Mensah", "Owusu", "Boateng", "Kamara"];
    D.vn = (raw.vornamen || []).concat(EVN).filter(function (x, i, a) { return x && a.indexOf(x) === i; }); D.nn = (raw.nachnamen || []).concat(ENN).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    D.mails = (raw.mails || []).concat(EXTRA_MAILS.filter(function (e) { return !(raw.mails || []).some(function (r) { return r[1] === e[1]; }); })).filter(function (r) { return r[1]; }).map(function (r) { return { from: String(r[0]), text: String(r[1]), opts: [[r[2], r[3]], [r[4], r[5]], [r[6], r[7]], [r[8], r[9]]].map(function (o) { return { label: String(o[0] || ''), fx: String(o[1] || '') }; }) }; });
    lv7fix(D);
    D.founded = String(D.cfg['Gründungsjahr'] || '1922'); D.members0 = num(D.cfg['Vereinsmitglieder'], 450) || 450;
    return D;
  }

  var EXTRA_EVENTS = [
    [4, 1, 11, '', 'Flutlicht defekt', 'Beim Abschlusstraining fällt das Flutlicht aus. Ein Elektriker kostet {betrag}.', 'Sofort reparieren', 'geld:-900; moral:+1', 'Im Dunkeln weiter', 'moral:-4; verletzt:7'],
    [4, 1, 11, '', 'Einbruch im Vereinsheim', 'Unbekannte sind ins Vereinsheim eingebrochen und haben Bälle und Trikots gestohlen. Neuanschaffung: {betrag}.', 'Neu kaufen', 'geld:-1200', 'Mit alten Sachen weitermachen', 'moral:-5; fans:-1'],
    [4, 1, 11, '', 'Grippewelle', 'Eine Grippewelle geht durch die Kabine. Mehrere Spieler fühlen sich schlapp.', 'Training absagen', 'fitness:+2; form:-1', 'Durchziehen', 'kranke:2; fitness:-5'],
    [3, 1, 11, '', 'Streit in der Kabine', '{spieler} und ein Mitspieler sind nach dem Training aneinandergeraten.', 'Klärendes Gespräch', 'moral:+2; chem:+1', 'Geldstrafe für beide', 'moral:-3; geld:+100'],
    [3, 1, 11, '', 'Shitstorm nach Niederlage', 'Nach der letzten Pleite tobt in den sozialen Medien ein Shitstorm gegen das Team.', 'Stellung beziehen', 'fans:+2; moral:+1', 'Ignorieren', 'fans:-4'],
    [3, 1, 11, '', 'Schiedsrichter-Ärger', 'Der Verband ermittelt wegen Beleidigungen gegen den Schiedsrichter beim letzten Heimspiel. Strafe: {betrag}.', 'Strafe zahlen', 'geld:-600; vorstand:-1', 'Einspruch einlegen', 'chance:40; vorstand:+2 || geld:-1200; vorstand:-3'],
    [4, 1, 11, '', 'Rasen unter Wasser', 'Nach tagelangem Regen steht der Platz unter Wasser. Eine Pumpe leihen kostet {betrag}.', 'Pumpe leihen', 'geld:-500', 'Abwarten', 'platz:-8; moral:-2'],
    [3, 1, 11, '', 'Sponsor in der Krise', 'Ein kleiner Werbepartner hat finanzielle Probleme und bittet um eine Pause bei den Zahlungen.', 'Entgegenkommen', 'sponsor:+3; geld:-800', 'Auf Vertrag bestehen', 'sponsor:-5; geld:+300'],
    [3, 1, 11, '', 'Spieler nachts unterwegs', '{spieler} wurde zwei Tage vor dem Spiel um 3 Uhr nachts in der Altstadt gesehen.', 'Suspendieren', 'sp_abs:1; moral:+1', 'Ermahnen', 'moral:-2; sp_form:-2'],
    [4, 1, 11, '', 'Vereinsbus kaputt', 'Der Mannschaftsbus springt nicht mehr an. Reparatur: {betrag}.', 'Reparieren', 'geld:-1500', 'Fahrgemeinschaften', 'moral:-3; fitness:-2'],
    [3, 1, 11, '', 'Lokalzeitung kritisiert', 'Der General-Anzeiger schreibt einen bissigen Kommentar über deine Taktik.', 'Interview geben', 'fans:+2; vorstand:+1', 'Schweigen', 'vorstand:-2'],
    [3, 1, 11, '', 'Ehrenamtliche hören auf', 'Zwei langjährige Helfer am Kiosk hören auf. Ersatz muss bezahlt werden: {betrag}.', 'Aushilfen bezahlen', 'geld:-700', 'Spieler müssen helfen', 'moral:-3; fans:+1'],
    [4, 1, 11, '', 'Spende vom Bäcker', 'Die Bäckerei aus dem Ort möchte der Jugend 500 € spenden – gegen ein Foto mit der Mannschaft.', 'Gerne!', 'geld:+500; fans:+2', 'Keine Zeit', 'fans:-1'],
    [3, 1, 11, '', 'Ex-Profi will helfen', 'Ein ehemaliger Zweitliga-Profi aus dem Ort bietet an, einmal pro Woche das Stürmertraining zu leiten.', 'Super, gerne!', 'form:+2; moral:+2; geld:-200', 'Danke, nein', ''],
    [3, 1, 11, '', 'Doping-Kontrolle', 'Überraschend steht die NADA zur Trainingskontrolle vor der Tür. Alles sauber – aber die Einheit ist dahin.', 'Kooperieren', 'form:-1; vorstand:+2', 'Unter Protest', 'vorstand:-3'],
    [3, 1, 11, '', 'Hitzewelle', 'Über 35 Grad – die Spieler stöhnen. Training verlegen?', 'Auf den Abend verlegen', 'fitness:+2', 'Wie geplant', 'fitness:-6; verletzt:5'],
    [3, 1, 11, '', 'TV-Team am Platz', 'Ein Regionalsender will eine Reportage über den Verein drehen.', 'Drehgenehmigung geben', 'fans:+4; sponsor:+2', 'Ablehnen', ''],
    [3, 1, 11, '', 'Pyro im Fanblock', 'Beim letzten Spiel wurde im Fanblock gezündelt. Der Verband verhängt {betrag} Strafe.', 'Zahlen und Stadionverbote', 'geld:-800; fans:-3; vorstand:+2', 'Zahlen, Fans schützen', 'geld:-800; fans:+2; vorstand:-3'],
    [3, 1, 11, '', 'Talent will wechseln', '{spieler} hat ein Angebot von einem höherklassigen Verein bekommen und ist unruhig.', 'Gehalt erhöhen', 'sp_gehalt:+15; moral:+1', 'Bleiben muss er', 'sp_form:-3; moral:-1'],
    [2, 1, 11, '', 'Wasserrohrbruch', 'In den Kabinen ist ein Rohr geplatzt. Die Reparatur kostet {betrag}.', 'Sofort reparieren', 'geld:-2500', 'Notdürftig flicken', 'geld:-600; moral:-4']
  ];
  var EXTRA_MAILS = [
    ['Busfahrer Günther', 'Trainer, der Mannschaftsbus braucht neue Winterreifen. Machen wir das jetzt oder fahren wir die alten noch?', 'Sofort wechseln', 'geld:-600; moral:+1', 'Nach der Hinrunde', 'geld:-300', 'Die halten noch', 'chance:20; moral:-3 || ', 'Wir fahren mit Fahrgemeinschaften', 'moral:-2; geld:+100'],
    ['Stadionsprecher Ralf', 'Ich hätte gern eine neue Torhymne fürs Heimspiel. Darf ich die Fans abstimmen lassen?', 'Ja, Fanvoting!', 'fans:+3', 'Ich such sie selbst aus', 'fans:+1', 'Die alte bleibt', '', 'Keine Musik mehr', 'fans:-3'],
    ['{spieler}', 'Coach, ich würde gern mal auf einer anderen Position spielen. Kann ich das im Training probieren?', 'Klar, probier dich aus', 'sp_form:+1; moral:+1', 'Nur in Testspielen', 'sp_form:+1', 'Konzentrier dich auf deine Position', 'sp_form:-1', 'Darüber reden wir nach der Saison', ''],
    ['Kinderschutzbeauftragte', 'Wir sollten für alle Jugendtrainer eine Schulung zum Kinderschutz machen. Übernimmt der Verein die Kosten?', 'Ja, selbstverständlich', 'geld:-350; vorstand:+3', 'Die Hälfte', 'geld:-175; vorstand:+1', 'Nur für die Cheftrainer', 'vorstand:-1', 'Später', 'vorstand:-3'],
    ['Nachbar Herr Schulte', 'Die Flutlichter blenden bis in mein Schlafzimmer. Können Sie die nach 21 Uhr ausschalten?', 'Wir trainieren früher', 'moral:-1; fans:+1', 'Wir bauen Blenden an', 'geld:-450; fans:+2', 'Das ist ein Sportplatz', 'fans:-1; vorstand:-1', 'Kommen Sie doch mal zum Spiel!', 'fans:+2'],
    ['Fan @svw_oldschool', 'Können wir zum Derby einen Fanbus organisieren? Viele wollen mit!', 'Der Verein zahlt die Hälfte', 'geld:-300; fans:+4', 'Organisiert ihr, wir werben dafür', 'fans:+2', 'Zu teuer', 'fans:-2', 'Nur wenn wir gewinnen', 'fans:+1'],
    ['Physiotherapeutin Jana', 'Ich würde gern ein Präventionsprogramm gegen Muskelverletzungen einführen. 15 Minuten vor jedem Training.', 'Super, machen wir', 'moral:-1; form:+1', 'Nur zweimal pro Woche', 'form:+1', 'Wir haben keine Zeit dafür', '', 'Die Jungs sollen das zuhause machen', 'moral:-1'],
    ['Jugendspieler {spieler}', 'Coach, ich habe in drei Wochen Abiprüfungen. Darf ich weniger trainieren?', 'Schule geht vor', 'moral:+2; sp_form:-1', 'Komm zu den Abschlusstrainings', '', 'Fußball ist wichtiger', 'moral:-3; vorstand:-1', 'Ich frag deine Eltern', ''],
    ['Ortsvorsteher', 'Beim Weihnachtsmarkt im Ort fehlt noch ein Stand. Hat der {verein} Lust?', 'Glühwein-Stand!', 'geld:+500; fans:+3; moral:-1', 'Waffeln mit der Jugend', 'geld:+250; fans:+2', 'Nur Infostand', 'fans:+1', 'Keine Zeit', 'fans:-2'],
    ['Schiedsrichterobmann', 'Uns fehlen Schiedsrichter. Kann der Verein zwei junge Leute zum Neulingslehrgang schicken?', 'Ja, wir suchen Freiwillige', 'vorstand:+3; geld:-100', 'Einen schaffen wir', 'vorstand:+1', 'Wir haben selbst zu wenig Leute', 'vorstand:-2', 'Zahlen lieber die Strafe', 'geld:-250'],
    ['{spieler}', 'Trainer, meine Freundin bekommt ein Baby! Kann ich zur Geburt ein paar Tage frei haben?', 'Natürlich – herzlichen Glückwunsch!', 'moral:+4; sp_form:-1', 'Nach dem Spiel', 'moral:+1', 'Nur einen Tag', 'moral:-2', 'Wir schenken einen Babystrampler!', 'geld:-40; moral:+5'],
    ['Sponsor Bäckerei Krämer', 'Wir würden gern Brötchen für die Kabine nach dem Training sponsern – dafür ein Foto auf Social Media?', 'Gerne!', 'moral:+2; fans:+1', 'Nur Obst bitte', 'moral:+1', 'Keine Werbung in der Kabine', '', 'Lieber Geld statt Brötchen', 'geld:+150'],
    ['Video-Analyst (Praktikant)', 'Ich könnte unsere Spiele filmen und schneiden – brauche nur eine Kamera für 600 €.', 'Kaufen wir!', 'geld:-600; form:+1', 'Leih dir eine', 'geld:-100', 'Handy reicht', '', 'Brauchen wir nicht', 'moral:-1'],
    ['Kapitän', 'Coach, in der Kabine gibt es Streit wegen der Musik. Wer darf die Box bedienen?', 'Der Kapitän entscheidet', 'moral:+1', 'Jeder Spieltag ein anderer', 'moral:+2', 'Keine Musik mehr', 'moral:-3', 'Nur Schlager!', 'moral:-1; fans:+1'],
    ['Gegnerischer Trainer', 'Hallo Kollege, wollen wir nach dem Spiel gemeinsam ein Bier trinken? Gute Stimmung zwischen den Vereinen.', 'Sehr gerne', 'fans:+1; moral:+1', 'Ein alkoholfreies', 'fans:+1', 'Ich fahre direkt heim', '', 'Lieber nicht', 'fans:-1'],
    ['Frauenteam-Trainerin', 'Unser Frauenteam braucht dringend neue Trikots. Gibt der Verein etwas dazu?', 'Ja, komplett', 'geld:-800; vorstand:+3; fans:+2', 'Die Hälfte', 'geld:-400; vorstand:+1', 'Sucht euch einen Sponsor', 'vorstand:-1', 'Gebrauchte von den Herren', 'vorstand:-2'],
    ['Zeugwart', 'Die Waschmaschine im Vereinsheim ist kaputt. Neu kaufen oder reparieren?', 'Neue Profimaschine', 'geld:-900; moral:+1', 'Reparieren lassen', 'geld:-250', 'Spieler waschen selbst', 'moral:-3', 'Waschsalon im Ort', 'geld:-120; moral:-1'],
    ['Fan @berkum_kicker', 'Warum spielt {spieler} eigentlich so selten? Er ist der Liebling der Fans!', 'Er bekommt seine Chance', 'fans:+2', 'Ich stelle nach Leistung auf', 'vorstand:+1', 'Das entscheide ich allein', 'fans:-2', 'Er muss im Training mehr zeigen', 'sp_form:+1'],
    ['Bürgerverein', 'Wir veranstalten ein Seniorenturnier im Walking Football. Dürfen wir euren Platz nutzen?', 'Natürlich!', 'fans:+3; moral:-1', 'Nur den Trainingsplatz', 'fans:+2', 'Nur gegen Platzmiete', 'geld:+200; fans:-1', 'Leider belegt', 'fans:-1'],
    ['Influencer @kickmitmax', 'Ich hab 80.000 Follower und würde gern ein Video mit eurem Team drehen. Deal?', 'Klar, los geht\'s', 'fans:+3; moral:-1', 'Nur mit der Jugend', 'fans:+2', 'Nur gegen Bezahlung', 'geld:+300', 'Kein Interesse', ''],
    ['Platzwart Heinz', 'Ein Maulwurf hat den Strafraum umgegraben! Was machen wir?', 'Profi-Schädlingsbekämpfer', 'geld:-200', 'Natürlich vertreiben (Geräusche)', 'chance:50; geld:-30 || geld:-30; moral:-1', 'Trainieren drumherum', 'moral:-1', 'Maskottchen-Idee daraus machen!', 'fans:+2'],
    ['Vorstand Finanzen', 'Die Bank bietet uns einen günstigen Dispo an. Sollen wir den einrichten?', 'Ja, zur Sicherheit', 'vorstand:+1', 'Nur einen kleinen', '', 'Keine Schulden!', 'vorstand:+2', 'Gleich voll ausnutzen', 'geld:+1000; vorstand:-4'],
    ['{spieler}', 'Coach, ich hab ein Angebot für ein Probetraining bei einem höherklassigen Verein. Darf ich hin?', 'Ja, viel Erfolg', 'moral:+2; sp_form:+1', 'Nach der Saison', 'sp_form:-1', 'Nein, du bleibst', 'moral:-2; sp_form:-2', 'Nur wenn er bei uns verlängert', ''],
    ['Kreisjugendwart', 'Wir suchen einen Ausrichter für den Kreis-Jugendtag. Habt ihr Interesse?', 'Ja, gern!', 'geld:-300; vorstand:+3; fans:+2', 'Wenn der Kreis zahlt', 'vorstand:+1', 'Zu viel Aufwand', 'vorstand:-1', 'Nächstes Jahr', ''],
    ['Stammtisch „Alte Herren“', 'Die AH möchte ihr 40-jähriges Jubiläum im Vereinsheim feiern – mit Freibier vom Verein?', 'Freibier für alle!', 'geld:-500; fans:+3; vorstand:+1', 'Ein Fass gibt es', 'geld:-200; fans:+1', 'Feiern ja, zahlen nein', '', 'Ohne mich', 'vorstand:-2'],
    ['Platzwart Heinz', 'Trainer, die Linien auf dem Trainingsplatz sind kaum noch zu sehen. Soll ich neu abstreuen?', 'Ja, sofort', 'geld:-120; moral:+1', 'Erst nach dem Wochenende', '', 'Machen die Spieler selbst', 'moral:-2', 'Ist doch egal', 'vorstand:-1'],
    ['Jugendleiterin Sabine', 'Die D-Jugend möchte beim nächsten Heimspiel als Einlaufkinder dabei sein. Geht das klar?', 'Sehr gerne!', 'fans:+3; moral:+1', 'Nur beim Topspiel', 'fans:+1', 'Lieber nicht, zu viel Trubel', 'fans:-2', 'Nächste Saison', ''],
    ['Kassenwart', 'Die Getränkepreise im Vereinsheim sind seit Jahren gleich. Sollen wir sie anheben?', 'Ja, um 50 Cent', 'geld:+400; fans:-2', 'Nur bei Spitzenspielen', 'geld:+150', 'Nein, bleibt fan-freundlich', 'fans:+2', 'Freibier am Saisonende!', 'geld:-300; fans:+5'],
    ['{spieler}', 'Coach, mein Knie zwickt etwas. Soll ich lieber kürzertreten?', 'Ja, zwei Tage Pause', 'sp_fit:+8; sp_form:-1', 'Physio soll draufschauen', 'geld:-80; sp_fit:+5', 'Beiß auf die Zähne', 'chance:15; sp_verletzt:10 || sp_form:+1', 'Du bist doch kein Weichei', 'moral:-2'],
    ['Lokalzeitung', 'Wir planen eine Serie „Ein Tag beim {verein}“. Dürfen wir eine Woche lang begleiten?', 'Klar, kommt vorbei', 'fans:+4; moral:-1', 'Nur einen Tag', 'fans:+2', 'Nur das Training, keine Kabine', 'fans:+1', 'Kein Interesse', 'fans:-2'],
    ['Bürgermeister', 'Die Gemeinde feiert ein Ortsfest. Kann die Mannschaft beim Aufbau helfen?', 'Alle packen mit an', 'fans:+4; vorstand:+2; fitness:-3', 'Ein paar Freiwillige', 'fans:+2', 'Wir spenden stattdessen', 'geld:-200; vorstand:+1', 'Keine Zeit, Saison läuft', 'vorstand:-2'],
    ['{spieler}', 'Ich würde gerne die Trainer-C-Lizenz machen. Unterstützt der Verein das?', 'Wir zahlen die Hälfte', 'geld:-250; moral:+3', 'Wenn du dich verpflichtest', 'sp_vertrag:+1', 'Später vielleicht', '', 'Konzentrier dich aufs Spielen', 'sp_form:-1; moral:-1'],
    ['Fanclub „Drachenherz“', 'Wir wollen bei Auswärtsspielen eine Choreo machen. Gibt der Verein etwas dazu?', 'Ja, 300 € Zuschuss', 'geld:-300; fans:+6', 'Wir drucken die Fahnen', 'geld:-120; fans:+3', 'Macht ihr mal selbst', 'fans:+1', 'Choreos brauchen wir nicht', 'fans:-4'],
    ['Zeugwart', 'Die Trainingsbälle sind abgenutzt, wir bräuchten 20 neue. Bestellen?', 'Ja, Markenbälle', 'geld:-400; form:+1', 'Günstige Bälle reichen', 'geld:-150', 'Erst zur Rückrunde', '', 'Kicken geht auch so', 'moral:-1'],
    ['Schiedsrichter-Obmann', 'Uns fehlen Schiedsrichter. Kann der Verein jemanden zum Lehrgang schicken?', 'Ja, wir finden jemanden', 'vorstand:+2; geld:-100', 'Wir fragen in der Jugend', 'vorstand:+1', 'Leider nein', 'vorstand:-1', 'Nicht unser Problem', 'vorstand:-3'],
    ['Sportheim-Wirtin', 'Am Sonntag ist Muttertag – sollen wir ein Frühstück vor dem Spiel anbieten?', 'Ja, mit Live-Musik', 'geld:-150; zuschauer:+40/1; fans:+3', 'Ein kleines Buffet', 'zuschauer:+20/1; fans:+1', 'Normaler Betrieb', '', 'Zu viel Aufwand', 'fans:-1'],
    ['{spieler}', 'Coach, meine Frau bekommt in den nächsten Tagen unser Kind. Kann ich beim nächsten Spiel fehlen?', 'Natürlich, alles Gute!', 'moral:+3; sp_form:+1; sp_abs:+1', 'Nur wenn es losgeht', 'moral:+1', 'Wir brauchen dich', 'moral:-2; sp_form:-1', 'Handy aus, Fokus aufs Spiel', 'moral:-4; sp_form:-2'],
    ['{spieler}', 'Ich bin echt platt, Coach. Kann ich ein Spiel Pause machen?', 'Ja, nimm dir die Auszeit', 'sp_fit:+15; sp_abs:+1', 'Nur Training aussetzen', 'sp_fit:+6', 'Zähne zusammenbeißen', 'sp_form:-1; chance:10; sp_verletzt:1', 'Pause gibt es im Sommer', 'moral:-2'],
    ['{spieler}', 'Darf ich am Wochenende auf die Hochzeit meines Bruders? Das wäre das Spiel …', 'Familie geht vor', 'moral:+3; sp_form:+1; sp_abs:+1', 'Komm direkt nach dem Spiel', 'moral:+1', 'Nur wenn wir genug Leute haben', '', 'Nein, du spielst', 'moral:-3; sp_form:-2'],
    ['Förderverein', 'Wir möchten einen Bandenplatz für einen neuen Unterstützer reservieren. Einverstanden?', 'Ja, gerne', 'geld:+500; fans:-1', 'Nur gegen Jahresvertrag', 'geld:+800; vorstand:+1', 'Erst mit dem Vorstand klären', '', 'Banden sind voll', 'vorstand:-1'],
    ['Physiotherapeut', 'Ich könnte ein Präventionsprogramm gegen Muskelverletzungen einführen. 15 Minuten vor jedem Training.', 'Machen wir', 'geld:-200; fitness:+3', 'Nur für Ältere', 'fitness:+1', 'Kostet zu viel Trainingszeit', 'form:+1', 'Brauchen wir nicht', 'chance:20; verletzt:7 || form:+1'],
    ['Nachbarverein', 'Wir haben Platzprobleme. Dürfen wir zwei Wochen auf eurem Kunstrasen trainieren?', 'Ja, gegen Miete', 'geld:+300; platz:-2', 'Ja, kostenlos', 'vorstand:+2; platz:-2', 'Nur einmal die Woche', 'geld:+100; platz:-1', 'Leider nein', 'vorstand:-1'],
    ['{spieler}', 'Ich habe ein Angebot für einen Job in Köln. Dann könnte ich nur noch einmal pro Woche trainieren.', 'Wir finden eine Lösung', 'moral:+2; sp_form:-1', 'Training ist Pflicht', 'sp_form:+1; moral:-1', 'Dann ab auf die Bank', 'sp_form:-2', 'Nimm den Job, viel Glück', 'sp_weg'],
    ['Grundschule Berkum', 'Hättet ihr Lust auf ein Schul-Fußballtraining mit zwei Spielern?', 'Klar, machen wir', 'fans:+4; moral:+1', 'Einmal im Monat', 'fans:+2', 'Gerne in den Ferien', 'fans:+1', 'Keine Zeit', 'fans:-1'],
    ['Vorstand', 'Ein Mitglied beschwert sich über den Ton auf dem Platz. Sollen wir einen Fair-Play-Kodex einführen?', 'Ja, mit Aushang', 'vorstand:+3; moral:-1', 'Ein Gespräch reicht', 'vorstand:+1', 'Ist halt Fußball', 'vorstand:-2', 'Wer sich beschwert, kann gehen', 'vorstand:-4; fans:-2'],
    ['Fotograf Lars', 'Ich würde gerne kostenlos Spielfotos für eure Social-Media-Kanäle machen.', 'Super, gerne', 'fans:+3', 'Nur Heimspiele', 'fans:+2', 'Nur gegen Namensnennung', 'fans:+1', 'Haben wir schon', ''],
    ['Busunternehmen', 'Für das nächste Auswärtsspiel könnten wir einen Fanbus stellen – 15 € pro Person.', 'Organisieren!', 'fans:+4; zuschauer:+15/1', 'Wir zahlen die Hälfte', 'geld:-250; fans:+6', 'Fans sollen selbst fahren', '', 'Lohnt sich nicht', 'fans:-1'],
    ['{spieler}', 'Ich will mehr Verantwortung übernehmen. Kann ich alle Aufgaben übernehmen – Elfmeter, Freistöße und Ecken?', 'Ja, du übernimmst sie', 'sp_form:+2; moral:+1; sp_aufg:1', 'Im Training zeigen', 'sp_form:+1', 'Die Aufgaben sind verteilt', '', 'Erst mal Tore schießen', 'sp_form:-1'],
    ['Ehrenpräsident', 'Zum 100-jährigen Jubiläum 2022 haben wir einen Film gedreht. Sollen wir ihn im Sportheim zeigen?', 'Ja, Filmabend!', 'fans:+3; moral:+2; geld:-80', 'Online stellen', 'fans:+2', 'Am Saisonende', 'fans:+1', 'Kein Interesse', 'vorstand:-2'],
    ['Getränkehändler', 'Wir bieten euch neue Kühlschränke fürs Vereinsheim – im Gegenzug exklusiv unsere Marke.', 'Deal!', 'geld:+600; fans:-1', 'Nur mit Rabatt', 'geld:+300', 'Wir bleiben unabhängig', 'fans:+1', 'Kein Interesse', ''],
    ['Mannschaftsrat', 'Die Jungs wünschen sich eine Mannschaftsfahrt nach der Saison. Gibt es einen Zuschuss?', 'Ja, großzügig', 'geld:-800; moral:+6', 'Kleiner Zuschuss', 'geld:-300; moral:+3', 'Nur bei Saisonziel', 'moral:+1', 'Zahlt ihr selbst', 'moral:-3'],
    ['Schiedsrichter-Obmann', 'Wir suchen dringend Schiedsrichter-Nachwuchs. Kann euer Verein zwei junge Leute zum Lehrgang schicken?', 'Klar, wir schicken zwei', 'vorstand:+3; geld:-100', 'Einen schicken wir', 'vorstand:+1', 'Haben keine Leute', 'vorstand:-2', 'Wir melden uns', ''],
    ['Ortsvorsteher', 'Beim Dorffest brauchen wir starke Hände für den Aufbau. Hilft die Mannschaft mit?', 'Ehrensache!', 'fans:+3; fitness:-2', 'Ein paar Spieler kommen', 'fans:+1', 'Wir müssen trainieren', 'fans:-2', 'Nur gegen Freibier', 'moral:+2; fans:+1'],
    ['Lokalradio', 'Hallo Trainer, wir würden Sie gerne live zur Lage im Verein interviewen – Samstagfrüh, 8 Uhr.', 'Gerne!', 'fans:+2; sponsor:+1', 'Nur per Telefon', 'fans:+1', 'Keine Zeit', '', 'Schicken Sie die Fragen vorher', 'vorstand:+1'],
    ['Kapitän', 'Coach, die Jungs wünschen sich mal wieder ein Teamevent – Kartfahren oder Bowling?', 'Kartfahren!', 'moral:+4; geld:-300', 'Bowling', 'moral:+3; geld:-150', 'Erst wenn wir gewinnen', 'moral:-2', 'Grillen am Platz', 'moral:+2; geld:-80'],
    ['Zeugwart Günther', 'Die Waschmaschine im Vereinsheim gibt den Geist auf. Neue kostet 600 €.', 'Kaufen', 'geld:-600; moral:+1', 'Gebraucht kaufen', 'geld:-250', 'Spieler waschen selbst', 'moral:-3', 'Bitte beim Sponsor fragen', 'sponsor:-1'],
    ['Mutter eines Jugendspielers', 'Mein Sohn träumt davon, einmal bei der Ersten mitzutrainieren. Wäre das möglich?', 'Na klar, nächste Woche!', 'fans:+3', 'Wenn er gut ist', 'fans:+1', 'Leider nein', 'fans:-1', 'Beim nächsten Fan Tag', 'fans:+2'],
    ['Stadtsportbund', 'Wir vergeben Fördermittel für Vereinsprojekte. Sollen wir euren Antrag für neue Tore prüfen?', 'Ja bitte!', 'geld:+800; vorstand:+2', 'Lieber für die Jugend', 'geld:+500; fans:+2', 'Zu viel Bürokratie', '', 'Später', ''],
    ['Physio Jana', 'Mehrere Spieler klagen über Muskelprobleme. Ein Massagegerät würde helfen – 450 €.', 'Kaufen', 'geld:-450; fitness:+3', 'Nur für die Stammspieler', 'fitness:+1', 'Geht auch so', 'fitness:-2', 'Dehnen reicht', ''],
    ['Fan-Beauftragter', 'Die Ultras planen eine große Choreo fürs Derby. Sie brauchen 300 € für Material.', 'Unterstützen wir', 'geld:-300; fans:+5', 'Die Hälfte', 'geld:-150; fans:+2', 'Kein Geld dafür', 'fans:-3', 'Nur ohne Pyro!', 'fans:+1; vorstand:+1'],
    ['Gemeinde Wachtberg', 'Die Gemeinde bittet um Unterstützung bei der Aktion „Saubere Landschaft“ am Samstag.', 'Ganze Mannschaft hilft', 'fans:+3; vorstand:+2; fitness:-1', 'Die Jugend hilft', 'fans:+2', 'Keine Zeit', 'vorstand:-2', 'Wir spenden Müllsäcke', 'geld:-50; fans:+1'],
    ['Ex-Spieler Markus', 'Hey Trainer, ich hab gehört, ihr sucht einen Co-Trainer für die Zweite. Ich hätte Lust!', 'Willkommen an Bord', 'moral:+2; geld:-150', 'Erst mal zur Probe', 'moral:+1', 'Haben wir schon', '', 'Melde dich nächste Saison', ''],
    ['Kicker-Reporter', 'Wir machen eine Serie über Amateurvereine mit Tradition. Dürfen wir über euch berichten?', 'Sehr gerne', 'fans:+4; sponsor:+2', 'Nur mit Abstimmung', 'fans:+2', 'Kein Interesse', '', 'Bitte erst nach der Saison', '']
  ];
  function lv7fix(D) { if (D.lv[7]) { D.lv[7].up = Math.max(2, D.lv[7].up); D.lv[7].upRel = 0; } }
  function parseStartLvl(v, regeln) {
    var n = Number(v); if (n >= 1 && n <= 11) return n;
    var s = String(v || '').toLowerCase();
    var map = [['2. bundesliga', 2], ['bundesliga', 1], ['3. liga', 3], ['regionalliga', 4], ['mittelrheinliga', 5], ['oberliga', 5], ['landesliga', 6], ['bezirksliga', 7], ['kreisliga a', 8], ['kreisliga b', 9], ['kreisliga c', 10], ['kreisliga d', 11]];
    for (var i = 0; i < map.length; i++) if (s.indexOf(map[i][0]) >= 0) return map[i][1];
    return 7;
  }
  function parseFx(s) { var o = {}; s.split(';').forEach(function (t) { var p = t.split(':'); if (p.length < 2) return; var k = p[0].trim(), v = p[1].trim(); o[k] = isNaN(Number(v)) ? v : Number(v); }); return o; }

  // ============================================================ Spieler
  function natLvl(D, s) { var best = 1, bd = 1e9; Object.keys(D.lv).forEach(function (k) { var L = D.lv[k]; var m = (L.lo + L.hi) / 2; var d = Math.abs(m - s); if (d < bd) { bd = d; best = +k; } }); return best; }
  function genStr(D, l) {
    var r = R(), lvl = l;
    if (r < 0.02) lvl = l + (R() < 0.5 ? -2 : 2); else if (r < 0.08) lvl = l - 1; else if (r < 0.20) lvl = l + 1;
    lvl = clamp(lvl, 1, D.maxLvl); var L = D.lv[lvl];
    var t = (R() + R()) / 2; var s = L.lo + t * (L.hi - L.lo);
    if (l === 1 && R() < 0.035) s = rnd(90, 99);
    return clamp(s, 1, 99);
  }
  // 4,5 und 5 Sterne sind selten (Wunsch 24.11.)
  function talRare(v) { if (v >= 5 && R() < 0.65) v = 4.5; if (v >= 4.5 && R() < 0.5) v = 4; return v; }
  function genTal(bonus) { var w = [38, 33, 21, 7, 1]; if (bonus) w = [24, 35, 28, 11, 2]; var r = R() * 100, a = 0; for (var i = 0; i < 5; i++) { a += w[i]; if (r < a) return i + 1; } return 5; }
  function potOf(str, age, tal) { var bt = [0, 4, 10, 17, 25, 34], tf = Math.floor(clamp(tal, 0, 5)), bonus = bt[tf] + ((bt[Math.min(5, tf + 1)] - bt[tf]) * (tal - tf)); var yf = clamp((29 - age) / 11, 0, 1); return Math.min(99, str + bonus * yf * rnd(0.8, 1.2)); }
  function genAge() { var r = R(); return r < 0.3 ? rint(18, 22) : r < 0.75 ? rint(23, 28) : rint(29, 35); }
  var NAT_NAMES = [
    [['Mehmet', 'Emre', 'Yusuf', 'Kerem', 'Burak', 'Can', 'Arda', 'Deniz', 'Hakan', 'Okan', 'Serkan', 'Furkan'], ['Yılmaz', 'Öztürk', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Aydın', 'Arslan', 'Doğan', 'Koç', 'Kurt', 'Özdemir']],
    [['Luca', 'Marco', 'Matteo', 'Alessio', 'Lorenzo', 'Davide', 'Andrea', 'Simone'], ['Rossi', 'Bianchi', 'Romano', 'Esposito', 'Ricci', 'Greco', 'Conti', 'Ferrari']],
    [['Lukas', 'Jakub', 'Mateusz', 'Kacper', 'Szymon', 'Piotr', 'Bartosz'], ['Nowak', 'Kowalski', 'Wiśniewski', 'Lewandowski', 'Kamiński', 'Zieliński', 'Wójcik']],
    [['Luka', 'Ivan', 'Marko', 'Nikola', 'Stefan', 'Filip', 'Dario'], ['Kovač', 'Horvat', 'Petrović', 'Jovanović', 'Marić', 'Babić', 'Perić']],
    [['Mamadou', 'Moussa', 'Ibrahim', 'Ousmane', 'Cheikh', 'Abdou'], ['Diallo', 'Traoré', 'Koné', 'Camara', 'Sow', 'Ba']],
    [['Kwame', 'Kofi', 'Yaw', 'Emmanuel', 'Prince'], ['Mensah', 'Boateng', 'Owusu', 'Asante', 'Appiah']],
    [['João', 'Tiago', 'Diogo', 'Rafael', 'Bruno', 'Pedro'], ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Oliveira']],
    [['Youssef', 'Karim', 'Amine', 'Bilal', 'Hamza', 'Anas'], ['Benali', 'El Amrani', 'Haddad', 'Mansouri', 'Bouzid', 'Chaouki']],
    [['Daan', 'Sem', 'Bram', 'Jesse', 'Thijs'], ['de Jong', 'Jansen', 'Bakker', 'Visser', 'de Vries']],
    [['Nikolaos', 'Georgios', 'Dimitrios', 'Konstantinos'], ['Papadopoulos', 'Georgiou', 'Nikolaidis', 'Christodoulou', 'Ioannou']]
  ];
  var NAT_ALL = {}; NAT_NAMES.forEach(function (g) { g[0].concat(g[1]).forEach(function (x) { NAT_ALL[x] = 1; }); });
  var GER_OK = { Lukas: 1, Luca: 1 };
  ['Marco', 'Can', 'Emre', 'Mehmet', 'Yusuf', 'Ali', 'Deniz', 'Arda', 'Kerem', 'Ivan', 'Luka', 'Marko', 'Dario', 'Mateo', 'Nikola', 'Kacper', 'Jakub', 'Mohamed', 'Karim', 'Amin', 'Ibrahima', 'Moussa', 'Kofi', 'Rafael', 'Diego', 'Tiago', 'Andrea', 'Lorenzo', 'Alessio', 'Hugo', 'Théo', 'Liam', 'Matteo', 'Elia', 'Carlo', 'Ilias', 'Burak', 'Luis', 'Giovanni', 'Sandro', 'Tomasz', 'Mateusz', 'Bartosz', 'Gabriel', 'Mario', 'Enrico', 'Jeremy', 'Tyler', 'Malik', 'Amir', 'Samir', 'Omar', 'Adem', 'Ismail', 'Ayoub', 'Kwame', 'Yaw', 'Sekou', 'Mamadou',
   'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Öztürk', 'Kowalski', 'Nowak', 'Wiśniewski', 'Petrović', 'Jovanović', 'Horvat', 'Kovač', 'Rossi', 'Bianchi', 'Romano', 'Silva', 'Santos', 'Pereira', 'Fernández', 'García', 'Dubois', 'Diallo', 'Traoré', 'Mensah', 'Owusu', 'Benali', 'El Amrani', 'Haddad', 'Nielsen', 'Hansen', 'Berisha', 'Krasniqi', 'Hoxha', 'Çelik', 'Aydın', 'Arslan', 'Russo', 'Ferrari', 'Esposito', 'Costa', 'Boateng', 'Kamara'].forEach(function (x) { NAT_ALL[x] = 1; });
  NAT_NAMES.push([['Berat', 'Arben', 'Driton', 'Liridon', 'Florent'], ['Berisha', 'Krasniqi', 'Hoxha', 'Gashi', 'Morina']], [['Mads', 'Jonas', 'Rasmus', 'Magnus'], ['Nielsen', 'Hansen', 'Jensen', 'Andersen']], [['Pablo', 'Diego', 'Sergio', 'Álvaro', 'Iván'], ['García', 'Fernández', 'López', 'Martínez', 'Sánchez']], [['Hugo', 'Théo', 'Lucas', 'Mathis', 'Enzo'], ['Dubois', 'Moreau', 'Laurent', 'Lefèvre', 'Girard']]);
  function genName(S, D) {
    var used = {}, vnU = {}, nnU = {};
    var gvn = D.vn.filter(function (x) { return !NAT_ALL[x] || GER_OK[x]; }), gnn = D.nn.filter(function (x) { return !NAT_ALL[x]; }); if (gvn.length < 20) gvn = D.vn; if (gnn.length < 20) gnn = D.nn;
    if (S) { var add = function (p) { used[p.n] = 1; var k = String(p.n).split(' '); vnU[k[0]] = (vnU[k[0]] || 0) + 1; nnU[k.slice(1).join(' ')] = (nnU[k.slice(1).join(' ')] || 0) + 1; }; (S.players || []).forEach(add); (S.youth || []).forEach(add); if (S.market) { (S.market.list || []).forEach(add); (S.market.loans || []).forEach(add); } (S.watch || []).forEach(add); }
    var fg0 = R() < 0.12 ? pick(NAT_NAMES) : null;
    for (var i = 0; i < 400; i++) { var fg = fg0 && i < 60 ? fg0 : null, v = fg ? pick(fg[0]) : pick(gvn), nn = fg ? pick(fg[1]) : pick(gnn), n = v + ' ' + nn; if (used[n]) continue; if (i < 300 && ((vnU[v] || 0) >= 1 || (nnU[nn] || 0) >= 1)) continue; return n; }
    return pick(gvn) + ' ' + pick(gnn);
  }
  function mw(p, old) {
    var b = old ? 25 * Math.exp(0.155 * p.str) : 25 * Math.exp(0.155 * Math.min(p.str, 35)) * Math.exp(0.115 * Math.max(0, p.str - 35));
    var a = p.age <= 21 ? 1.35 : p.age <= 25 ? 1.2 : p.age <= 29 ? 1 : p.age <= 31 ? 0.7 : p.age <= 33 ? 0.45 : 0.25;
    var t = p.age < 25 ? 1 + (p.tal - 1) * 0.12 : 1;
    return nice(b * a * t);
  }
  function salDemand0(p, l) { var v = mw(p, true); var s = l >= 5 ? v * 0.0066 + 10 : v * 0.012 + 200; return Math.max(0, nice(s)); }
  // Gehalt je Liga: Standard-Spanne (SALDEF) linear auf die Spanne aus den Vorgaben (SALR) umrechnen
  function salDemand(p, l) { var s = salDemand0(p, l), r = SALR[l], d = SALDEF[l]; if (r && d && r.length === 2) { s = d[1] > d[0] ? +r[0] + (s - d[0]) * (+r[1] - +r[0]) / (d[1] - d[0]) : (+r[0] + +r[1]) / 2; } if (l <= 5) s *= 1.1; /* Balancing: höhere Ligen etwas teurer */ return Math.max(0, nice(s)); }
  function newPlayer(S, D, o) {
    var age = o.age || genAge(); var tal = o.tal || genTal(o.talBonus);
    var str = o.str != null ? o.str : genStr(D, o.lvl);
    var dpIn = o.dp || (o.pos && GRP[o.pos] && o.pos !== 'TW' && o.pos !== 'ST' ? o.pos : null);
    var grp0 = dpIn ? GRP[dpIn] : (o.pos ? (GRP[o.pos] && o.pos !== 'ST' ? GRP[o.pos] : o.pos) : pick(['TW', 'AB', 'AB', 'AB', 'MF', 'MF', 'MF', 'ST', 'ST']));
    var p = { id: S ? S.nextPid++ : 0, n: o.name || genName(S, D), pos: grp0, age: age, str: str, tal: tal, pot: o.pot || potOf(str, age, tal), fit: 100, form: 0, inj: 0, g: 0, a: 0, gp: 0, gr: 0, recent: 0, tries: 0 };
    p.pot = Math.max(p.pot, p.str); setDp(p, dpIn);
    return p;
  }

  // ============================================================ Effekte aus Ausbau
  /* ---------- Fremdsprachen: Fragen werden aus Tabellen erzeugt (je SLP-Stufe 40–60 Fragen) */
  var LANGS = { en: ['Englisch', '🇬🇧'], es: ['Spanisch', '🇪🇸'], fr: ['Französisch', '🇫🇷'], it: ['Italienisch', '🇮🇹'], ja: ['Japanisch', '🇯🇵'], pl: ['Polnisch', '🇵🇱'] };
  var SLPN = ['Keine Kenntnisse', 'A1 · Anfänger', 'A2 · Grundlagen', 'B1 · Mittelstufe', 'B2 · Gute Mittelstufe', 'C1 · Fortgeschritten', 'C2 · Annähernd muttersprachlich'];
  var SLPXP = [0, 24, 60, 130, 234, 420, 702];
  var EN2 = [['Verlaufsform: Look! The team ___ (train) right now.', 'is training', ['is training', 'trains', 'trained', 'train']], ['Verlaufsform: We ___ (wait) for the bus.', 'are waiting', ['are waiting', 'wait', 'waited', 'is waiting']], ['Vergangenheit: Yesterday we ___ (win) 3:1.', 'won', ['won', 'win', 'winned', 'have win']], ['Vergangenheit: He ___ (score) two goals last week.', 'scored', ['scored', 'scores', 'score', 'is scoring']], ['Zukunft: Tomorrow I ___ (play) in the first team.', 'will play', ['will play', 'play', 'played', 'am play']], ['Zukunft (going to): We ___ win the cup!', 'are going to', ['are going to', 'going to', 'will to', 'go to']], ['Frage: ___ you like football?', 'Do', ['Do', 'Does', 'Are', 'Is']], ['Frage: ___ she play on Sunday?', 'Does', ['Does', 'Do', 'Is', 'Has']], ['Verneinung: The coach ___ like late players.', "doesn't", ["doesn't", "don't", "isn't", 'not']], ['Vergangenheit: Where ___ you yesterday?', 'were', ['were', 'was', 'are', 'did']], ['Vergangenheit-Frage: ___ you see the match?', 'Did', ['Did', 'Do', 'Were', 'Have']], ['Present Perfect: I ___ never been to Wembley.', 'have', ['have', 'has', 'am', 'did']], ['Verlaufsform Vergangenheit: It ___ raining during the game.', 'was', ['was', 'were', 'is', 'did']], ['Steigerung: He is ___ than his brother.', 'faster', ['faster', 'more fast', 'fastest', 'fast']]];
  var SENT = {
    de: [['Ich spiele Fußball.', 'Wir haben gewonnen.', 'Wo ist das Stadion?', 'Der Trainer ist gut.', 'Ich heiße Max.', 'Das Spiel beginnt heute.', 'Ich trinke Wasser.', 'Mein Freund ist Spieler.', 'Wir sind eine Mannschaft.', 'Das Tor ist groß.'],
      ['Wir spielen am Samstag gegen Bonn.', 'Kannst du mir den Ball geben?', 'Der Schiedsrichter hat Rot gezeigt.', 'Ich muss morgen früh trainieren.', 'Unsere Fans singen sehr laut.'],
      ['Wenn wir gewinnen, steigen wir auf.', 'Der Spieler, den wir gekauft haben, ist verletzt.', 'Obwohl es regnete, kamen viele Zuschauer.', 'Ich hätte ihn früher auswechseln sollen.', 'Wir müssen hinten kompakter stehen.']],
    en: [['I play football.', 'We won.', 'Where is the stadium?', 'The coach is good.', 'My name is Max.', 'The match starts today.', 'I drink water.', 'My friend is a player.', 'We are a team.', 'The goal is big.'],
      ['We play against Bonn on Saturday.', 'Can you give me the ball?', 'The referee showed a red card.', 'I have to train early tomorrow.', 'Our fans sing very loudly.'],
      ['If we win, we will be promoted.', 'The player we bought is injured.', 'Although it was raining, many spectators came.', 'I should have substituted him earlier.', 'We have to be more compact at the back.']],
    es: [['Juego al fútbol.', 'Hemos ganado.', '¿Dónde está el estadio?', 'El entrenador es bueno.', 'Me llamo Max.', 'El partido empieza hoy.', 'Bebo agua.', 'Mi amigo es jugador.', 'Somos un equipo.', 'La portería es grande.'],
      ['Jugamos contra Bonn el sábado.', '¿Puedes darme el balón?', 'El árbitro mostró la tarjeta roja.', 'Mañana tengo que entrenar temprano.', 'Nuestros aficionados cantan muy fuerte.'],
      ['Si ganamos, subiremos de categoría.', 'El jugador que compramos está lesionado.', 'Aunque llovía, vinieron muchos espectadores.', 'Debería haberlo cambiado antes.', 'Tenemos que estar más compactos atrás.']],
    fr: [['Je joue au football.', 'Nous avons gagné.', 'Où est le stade ?', 'L’entraîneur est bon.', 'Je m’appelle Max.', 'Le match commence aujourd’hui.', 'Je bois de l’eau.', 'Mon ami est joueur.', 'Nous sommes une équipe.', 'Le but est grand.'],
      ['Nous jouons contre Bonn samedi.', 'Tu peux me donner le ballon ?', 'L’arbitre a montré un carton rouge.', 'Je dois m’entraîner tôt demain.', 'Nos supporters chantent très fort.'],
      ['Si nous gagnons, nous monterons.', 'Le joueur que nous avons acheté est blessé.', 'Bien qu’il pleuve, beaucoup de spectateurs sont venus.', 'J’aurais dû le remplacer plus tôt.', 'Nous devons être plus compacts derrière.']],
    it: [['Gioco a calcio.', 'Abbiamo vinto.', 'Dov’è lo stadio?', 'L’allenatore è bravo.', 'Mi chiamo Max.', 'La partita inizia oggi.', 'Bevo acqua.', 'Il mio amico è un giocatore.', 'Siamo una squadra.', 'La porta è grande.'],
      ['Sabato giochiamo contro il Bonn.', 'Puoi darmi il pallone?', 'L’arbitro ha mostrato il cartellino rosso.', 'Domani devo allenarmi presto.', 'I nostri tifosi cantano molto forte.'],
      ['Se vinciamo, saliremo di categoria.', 'Il giocatore che abbiamo comprato è infortunato.', 'Anche se pioveva, sono venuti molti spettatori.', 'Avrei dovuto sostituirlo prima.', 'Dobbiamo essere più compatti dietro.']],
    ja: [['Watashi wa sakkā o shimasu.', 'Watashitachi wa kachimashita.', 'Sutajiamu wa doko desu ka?', 'Kantoku wa ii desu.', 'Watashi wa Max desu.', 'Shiai wa kyō hajimarimasu.', 'Mizu o nomimasu.', 'Tomodachi wa senshu desu.', 'Watashitachi wa chīmu desu.', 'Gōru wa ōkii desu.'],
      ['Doyōbi ni Bonn to shiai o shimasu.', 'Bōru o kuremasen ka?', 'Shinpan wa reddo kādo o dashimashita.', 'Ashita wa hayaku renshū shinakereba narimasen.', 'Watashitachi no fan wa ōkii koe de utaimasu.'],
      ['Kateba shōkaku shimasu.', 'Katta senshu wa kega o shite imasu.', 'Ame datta noni, kankyaku ga takusan kimashita.', 'Motto hayaku kōtai sasereba yokatta.', 'Ushiro wa motto konpakuto ni shinakereba narimasen.']]
  };
  SENT.pl = [['Gram w piłkę nożną.', 'Wygraliśmy.', 'Gdzie jest stadion?', 'Trener jest dobry.', 'Nazywam się Max.', 'Mecz zaczyna się dzisiaj.', 'Piję wodę.', 'Mój przyjaciel jest zawodnikiem.', 'Jesteśmy drużyną.', 'Bramka jest duża.'],
    ['W sobotę gramy z Bonn.', 'Możesz mi podać piłkę?', 'Sędzia pokazał czerwoną kartkę.', 'Jutro muszę wcześnie trenować.', 'Nasi kibice śpiewają bardzo głośno.'],
    ['Jeśli wygramy, awansujemy.', 'Zawodnik, którego kupiliśmy, jest kontuzjowany.', 'Chociaż padało, przyszło wielu widzów.', 'Powinienem był go wcześniej zmienić.', 'Musimy grać bardziej zwarcie w obronie.']];
  var LV_DE = ['Fußball', 'Tor', 'Spieler', 'Trainer', 'Mannschaft', 'Ball', 'Sieg', 'Niederlage', 'Schiedsrichter', 'Stadion', 'Fan', 'Spiel', 'Wasser', 'Brot', 'Haus', 'Auto', 'Freund', 'heute', 'morgen', 'gestern', 'gut', 'schlecht', 'groß', 'klein', 'schnell', 'danke', 'bitte', 'ja', 'nein', 'Hallo'];
  var GR_DE = ['Guten Morgen', 'Gute Nacht', 'Auf Wiedersehen', 'Entschuldigung', 'Wie geht’s?'];
  var PERS = ['ich', 'du', 'er/sie', 'wir', 'ihr', 'sie (Plural)'];
  var LD = {
    en: { voc: ['football', 'goal', 'player', 'coach', 'team', 'ball', 'victory', 'defeat', 'referee', 'stadium', 'fan', 'match', 'water', 'bread', 'house', 'car', 'friend', 'today', 'tomorrow', 'yesterday', 'good', 'bad', 'big', 'small', 'fast', 'thank you', 'please', 'yes', 'no', 'hello'],
      gr: ['Good morning', 'Good night', 'Goodbye', 'Excuse me', 'How are you?'], num: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
      be: ['I am', 'you are', 'he is', 'we are', 'you are', 'they are'], pro: ['I', 'you', 'he', 'we', 'you', 'they'],
      conj: { play: ['play', 'play', 'plays', 'play', 'play', 'play'], work: ['work', 'work', 'works', 'work', 'work', 'work'], watch: ['watch', 'watch', 'watches', 'watch', 'watch', 'watch'], have: ['have', 'have', 'has', 'have', 'have', 'have'], go: ['go', 'go', 'goes', 'go', 'go', 'go'], train: ['train', 'train', 'trains', 'train', 'train', 'train'], win: ['win', 'win', 'wins', 'win', 'win', 'win'] },
      art: [['apple', 'an'], ['ball', 'a'], ['hour', 'an'], ['university', 'a'], ['umbrella', 'an'], ['team', 'a'], ['idea', 'an'], ['player', 'a'], ['elephant', 'an'], ['game', 'a'], ['orange', 'an'], ['coach', 'a'], ['egg', 'an'], ['European', 'a'], ['honest man', 'an'], ['stadium', 'a']], artO: ['a', 'an', 'the', '–'],
      past: [['go', 'went'], ['win', 'won'], ['lose', 'lost'], ['run', 'ran'], ['see', 'saw'], ['take', 'took'], ['give', 'gave'], ['make', 'made'], ['buy', 'bought'], ['eat', 'ate'], ['drink', 'drank'], ['think', 'thought'], ['bring', 'brought'], ['catch', 'caught'], ['teach', 'taught'], ['write', 'wrote'], ['speak', 'spoke'], ['come', 'came'], ['begin', 'began'], ['choose', 'chose']],
      part: [['go', 'gone'], ['win', 'won'], ['lose', 'lost'], ['run', 'run'], ['see', 'seen'], ['take', 'taken'], ['give', 'given'], ['eat', 'eaten'], ['drink', 'drunk'], ['write', 'written'], ['speak', 'spoken'], ['begin', 'begun'], ['choose', 'chosen'], ['bring', 'brought'], ['teach', 'taught'], ['fall', 'fallen'], ['forget', 'forgotten'], ['break', 'broken']],
      prep: [['The match starts ___ 3 pm.', 'at'], ['We play ___ Saturday.', 'on'], ['He was born ___ 1999.', 'in'], ['The ball is ___ the box.', 'in'], ['I am waiting ___ the bus.', 'for'], ['She is good ___ football.', 'at'], ['We travel ___ train.', 'by'], ['He depends ___ his coach.', 'on'], ['The team is proud ___ its fans.', 'of'], ['I am interested ___ tactics.', 'in']], prepO: ['at', 'on', 'in', 'for', 'by', 'of', 'to', 'with'],
      cond: [['If I ___ rich, I would buy a club.', 'were'], ['If we win today, we ___ celebrate.', 'will'], ['If he had trained, he ___ played better.', 'would have'], ['If it rains, the match ___ cancelled.', 'will be'], ['I wish I ___ taller.', 'were'], ['If she ___ harder, she would be in the team.', 'trained'], ['Had we scored, we ___ won.', 'would have'], ['If you heat ice, it ___.', 'melts']], condO: ['were', 'will', 'would have', 'will be', 'trained', 'melts', 'was', 'would'],
      idi: [['own goal', 'Eigentor'], ['move the goalposts', 'die Regeln ändern'], ['a level playing field', 'gleiche Bedingungen'], ['the ball is in your court', 'du bist am Zug'], ['on the ball', 'aufmerksam, auf Zack'], ['get the ball rolling', 'etwas in Gang bringen'], ['keep your eye on the ball', 'konzentriert bleiben'], ['a whole new ball game', 'eine völlig neue Lage'], ['drop the ball', 'einen Fehler machen'], ['back to square one', 'zurück auf Anfang']] },
    es: { voc: ['fútbol', 'gol', 'jugador', 'entrenador', 'equipo', 'balón', 'victoria', 'derrota', 'árbitro', 'estadio', 'aficionado', 'partido', 'agua', 'pan', 'casa', 'coche', 'amigo', 'hoy', 'mañana', 'ayer', 'bueno', 'malo', 'grande', 'pequeño', 'rápido', 'gracias', 'por favor', 'sí', 'no', 'hola'],
      gr: ['Buenos días', 'Buenas noches', 'Adiós', 'Perdón', '¿Qué tal?'], num: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'],
      be: ['soy', 'eres', 'es', 'somos', 'sois', 'son'], pro: ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos'],
      conj: { hablar: ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'], comer: ['como', 'comes', 'come', 'comemos', 'coméis', 'comen'], vivir: ['vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven'], jugar: ['juego', 'juegas', 'juega', 'jugamos', 'jugáis', 'juegan'], tener: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'], ganar: ['gano', 'ganas', 'gana', 'ganamos', 'ganáis', 'ganan'], ir: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'] },
      art: [['equipo', 'el'], ['victoria', 'la'], ['derrota', 'la'], ['partido', 'el'], ['casa', 'la'], ['coche', 'el'], ['jugador', 'el'], ['pelota', 'la'], ['ciudad', 'la'], ['problema', 'el'], ['mano', 'la'], ['día', 'el'], ['noche', 'la'], ['camiseta', 'la'], ['campo', 'el'], ['estadio', 'el']], artO: ['el', 'la', 'los', 'las'],
      pastP: ['yo', 'nosotros', 'ellos'], past: { hablar: ['hablé', 'hablamos', 'hablaron'], comer: ['comí', 'comimos', 'comieron'], vivir: ['viví', 'vivimos', 'vivieron'], jugar: ['jugué', 'jugamos', 'jugaron'], ganar: ['gané', 'ganamos', 'ganaron'], tener: ['tuve', 'tuvimos', 'tuvieron'], ir: ['fui', 'fuimos', 'fueron'], hacer: ['hice', 'hicimos', 'hicieron'], marcar: ['marqué', 'marcamos', 'marcaron'], perder: ['perdí', 'perdimos', 'perdieron'] },
      prep: [['Voy ___ estadio.', 'al'], ['Vivo ___ Madrid.', 'en'], ['El regalo es ___ ti.', 'para'], ['Gracias ___ todo.', 'por'], ['Juego ___ mis amigos.', 'con'], ['Vengo ___ Alemania.', 'de'], ['El partido empieza ___ las tres.', 'a'], ['Pienso ___ ti.', 'en'], ['Estoy cansado ___ entrenar.', 'de'], ['Hablo ___ el entrenador.', 'con']], prepO: ['a', 'al', 'en', 'de', 'para', 'por', 'con', 'sin'],
      cond: { hablar: ['hablaría', 'hablaríamos', 'hablarían'], comer: ['comería', 'comeríamos', 'comerían'], vivir: ['viviría', 'viviríamos', 'vivirían'], jugar: ['jugaría', 'jugaríamos', 'jugarían'], ganar: ['ganaría', 'ganaríamos', 'ganarían'], tener: ['tendría', 'tendríamos', 'tendrían'], hacer: ['haría', 'haríamos', 'harían'], poder: ['podría', 'podríamos', 'podrían'] },
      subj: [['hablar', 'hable'], ['comer', 'coma'], ['vivir', 'viva'], ['jugar', 'juegue'], ['ganar', 'gane'], ['tener', 'tenga'], ['hacer', 'haga'], ['poder', 'pueda'], ['ser', 'sea'], ['ir', 'vaya']], subjL: 'Subjuntivo (yo)',
      idi: [['meter un gol', 'ein Tor schießen'], ['estar en forma', 'fit sein'], ['tirar la toalla', 'aufgeben'], ['estar en las nubes', 'geistesabwesend sein'], ['ser pan comido', 'ein Kinderspiel sein'], ['costar un ojo de la cara', 'sehr teuer sein'], ['no tener pelos en la lengua', 'kein Blatt vor den Mund nehmen'], ['dar en el clavo', 'den Nagel auf den Kopf treffen']] },
    fr: { voc: ['football', 'but', 'joueur', 'entraîneur', 'équipe', 'ballon', 'victoire', 'défaite', 'arbitre', 'stade', 'supporter', 'match', 'eau', 'pain', 'maison', 'voiture', 'ami', 'aujourd’hui', 'demain', 'hier', 'bon', 'mauvais', 'grand', 'petit', 'rapide', 'merci', 's’il vous plaît', 'oui', 'non', 'salut'],
      gr: ['Bonjour', 'Bonne nuit', 'Au revoir', 'Excusez-moi', 'Comment ça va ?'], num: ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'],
      be: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], pro: ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils'],
      conj: { parler: ['parle', 'parles', 'parle', 'parlons', 'parlez', 'parlent'], jouer: ['joue', 'joues', 'joue', 'jouons', 'jouez', 'jouent'], finir: ['finis', 'finis', 'finit', 'finissons', 'finissez', 'finissent'], avoir: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], aller: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], gagner: ['gagne', 'gagnes', 'gagne', 'gagnons', 'gagnez', 'gagnent'], manger: ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent'] },
      art: [['but', 'le'], ['équipe', 'la'], ['victoire', 'la'], ['match', 'le'], ['maison', 'la'], ['voiture', 'la'], ['joueur', 'le'], ['ballon', 'le'], ['ville', 'la'], ['stade', 'le'], ['main', 'la'], ['jour', 'le'], ['nuit', 'la'], ['maillot', 'le'], ['défaite', 'la'], ['terrain', 'le']], artO: ['le', 'la', 'les', 'l’'],
      pastP: ['je / j’', 'nous', 'ils'], past: { parler: ['j’ai parlé', 'nous avons parlé', 'ils ont parlé'], jouer: ['j’ai joué', 'nous avons joué', 'ils ont joué'], finir: ['j’ai fini', 'nous avons fini', 'ils ont fini'], gagner: ['j’ai gagné', 'nous avons gagné', 'ils ont gagné'], manger: ['j’ai mangé', 'nous avons mangé', 'ils ont mangé'], avoir: ['j’ai eu', 'nous avons eu', 'ils ont eu'], aller: ['je suis allé', 'nous sommes allés', 'ils sont allés'], faire: ['j’ai fait', 'nous avons fait', 'ils ont fait'], perdre: ['j’ai perdu', 'nous avons perdu', 'ils ont perdu'], venir: ['je suis venu', 'nous sommes venus', 'ils sont venus'] },
      prep: [['Je vais ___ stade.', 'au'], ['J’habite ___ Paris.', 'à'], ['Il vient ___ Allemagne.', 'd’'], ['Je joue ___ football.', 'au'], ['Je pense ___ toi.', 'à'], ['C’est un cadeau ___ toi.', 'pour'], ['Nous allons ___ France.', 'en'], ['Elle parle ___ son ami.', 'avec'], ['Le match commence ___ 15 heures.', 'à'], ['Le ballon est ___ la table.', 'sur']], prepO: ['à', 'au', 'en', 'de', 'd’', 'pour', 'avec', 'sur'],
      cond: { parler: ['parlerais', 'parlerions', 'parleraient'], jouer: ['jouerais', 'jouerions', 'joueraient'], finir: ['finirais', 'finirions', 'finiraient'], gagner: ['gagnerais', 'gagnerions', 'gagneraient'], avoir: ['aurais', 'aurions', 'auraient'], aller: ['irais', 'irions', 'iraient'], faire: ['ferais', 'ferions', 'feraient'], pouvoir: ['pourrais', 'pourrions', 'pourraient'] },
      subj: [['parler', 'parle'], ['finir', 'finisse'], ['être', 'sois'], ['avoir', 'aie'], ['aller', 'aille'], ['faire', 'fasse'], ['pouvoir', 'puisse'], ['venir', 'vienne'], ['prendre', 'prenne'], ['savoir', 'sache']], subjL: 'Subjonctif (que je)',
      idi: [['marquer un but', 'ein Tor schießen'], ['avoir le cafard', 'niedergeschlagen sein'], ['poser un lapin', 'jemanden versetzen'], ['coûter les yeux de la tête', 'sehr teuer sein'], ['avoir la pêche', 'gut drauf sein'], ['tomber dans les pommes', 'ohnmächtig werden']] },
    it: { voc: ['calcio', 'gol', 'giocatore', 'allenatore', 'squadra', 'pallone', 'vittoria', 'sconfitta', 'arbitro', 'stadio', 'tifoso', 'partita', 'acqua', 'pane', 'casa', 'macchina', 'amico', 'oggi', 'domani', 'ieri', 'buono', 'cattivo', 'grande', 'piccolo', 'veloce', 'grazie', 'per favore', 'sì', 'no', 'ciao'],
      gr: ['Buongiorno', 'Buonanotte', 'Arrivederci', 'Scusi', 'Come stai?'], num: ['uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci'],
      be: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'], pro: ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'],
      conj: { parlare: ['parlo', 'parli', 'parla', 'parliamo', 'parlate', 'parlano'], giocare: ['gioco', 'giochi', 'gioca', 'giochiamo', 'giocate', 'giocano'], vincere: ['vinco', 'vinci', 'vince', 'vinciamo', 'vincete', 'vincono'], dormire: ['dormo', 'dormi', 'dorme', 'dormiamo', 'dormite', 'dormono'], avere: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'], andare: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'], mangiare: ['mangio', 'mangi', 'mangia', 'mangiamo', 'mangiate', 'mangiano'] },
      art: [['squadra', 'la'], ['gol', 'il'], ['vittoria', 'la'], ['stadio', 'lo'], ['partita', 'la'], ['casa', 'la'], ['giocatore', 'il'], ['pallone', 'il'], ['città', 'la'], ['sport', 'lo'], ['mano', 'la'], ['giorno', 'il'], ['notte', 'la'], ['maglia', 'la'], ['campo', 'il'], ['zaino', 'lo']], artO: ['il', 'lo', 'la', 'i'],
      pastP: ['io', 'noi', 'loro'], past: { parlare: ['ho parlato', 'abbiamo parlato', 'hanno parlato'], giocare: ['ho giocato', 'abbiamo giocato', 'hanno giocato'], vincere: ['ho vinto', 'abbiamo vinto', 'hanno vinto'], mangiare: ['ho mangiato', 'abbiamo mangiato', 'hanno mangiato'], avere: ['ho avuto', 'abbiamo avuto', 'hanno avuto'], andare: ['sono andato', 'siamo andati', 'sono andati'], fare: ['ho fatto', 'abbiamo fatto', 'hanno fatto'], perdere: ['ho perso', 'abbiamo perso', 'hanno perso'], venire: ['sono venuto', 'siamo venuti', 'sono venuti'], dormire: ['ho dormito', 'abbiamo dormito', 'hanno dormito'] },
      prep: [['Vado ___ stadio.', 'allo'], ['Abito ___ Roma.', 'a'], ['Vengo ___ Germania.', 'dalla'], ['Gioco ___ i miei amici.', 'con'], ['Il regalo è ___ te.', 'per'], ['Siamo ___ Italia.', 'in'], ['Penso ___ te.', 'a'], ['La partita inizia ___ tre.', 'alle'], ['Il libro è ___ tavolo.', 'sul'], ['Torno ___ casa.', 'a']], prepO: ['a', 'allo', 'alle', 'in', 'da', 'dalla', 'con', 'per', 'sul'],
      cond: { parlare: ['parlerei', 'parleremmo', 'parlerebbero'], giocare: ['giocherei', 'giocheremmo', 'giocherebbero'], vincere: ['vincerei', 'vinceremmo', 'vincerebbero'], avere: ['avrei', 'avremmo', 'avrebbero'], andare: ['andrei', 'andremmo', 'andrebbero'], fare: ['farei', 'faremmo', 'farebbero'], potere: ['potrei', 'potremmo', 'potrebbero'], mangiare: ['mangerei', 'mangeremmo', 'mangerebbero'] },
      subj: [['parlare', 'parli'], ['finire', 'finisca'], ['essere', 'sia'], ['avere', 'abbia'], ['andare', 'vada'], ['fare', 'faccia'], ['potere', 'possa'], ['venire', 'venga'], ['prendere', 'prenda'], ['sapere', 'sappia']], subjL: 'Congiuntivo (che io)',
      idi: [['in bocca al lupo', 'viel Glück'], ['fare un gol', 'ein Tor schießen'], ['costare un occhio della testa', 'sehr teuer sein'], ['avere le mani bucate', 'das Geld zum Fenster rauswerfen'], ['essere al verde', 'pleite sein'], ['prendere due piccioni con una fava', 'zwei Fliegen mit einer Klappe schlagen']] },
    pl: { voc: ['piłka nożna', 'bramka', 'zawodnik', 'trener', 'drużyna', 'piłka', 'zwycięstwo', 'porażka', 'sędzia', 'stadion', 'kibic', 'mecz', 'woda', 'chleb', 'dom', 'samochód', 'przyjaciel', 'dzisiaj', 'jutro', 'wczoraj', 'dobry', 'zły', 'duży', 'mały', 'szybki', 'dziękuję', 'proszę', 'tak', 'nie', 'cześć'],
      gr: ['Dzień dobry', 'Dobranoc', 'Do widzenia', 'Przepraszam', 'Jak się masz?'], num: ['jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć'],
      be: ['jestem', 'jesteś', 'jest', 'jesteśmy', 'jesteście', 'są'], pro: ['ja', 'ty', 'on/ona', 'my', 'wy', 'oni'],
      conj: { grać: ['gram', 'grasz', 'gra', 'gramy', 'gracie', 'grają'], mówić: ['mówię', 'mówisz', 'mówi', 'mówimy', 'mówicie', 'mówią'], mieć: ['mam', 'masz', 'ma', 'mamy', 'macie', 'mają'], iść: ['idę', 'idziesz', 'idzie', 'idziemy', 'idziecie', 'idą'], wygrywać: ['wygrywam', 'wygrywasz', 'wygrywa', 'wygrywamy', 'wygrywacie', 'wygrywają'], pić: ['piję', 'pijesz', 'pije', 'pijemy', 'pijecie', 'piją'], robić: ['robię', 'robisz', 'robi', 'robimy', 'robicie', 'robią'] },
      art: [['mecz', 'ten'], ['drużyna', 'ta'], ['stadion', 'ten'], ['piłka', 'ta'], ['boisko', 'to'], ['zwycięstwo', 'to'], ['trener', 'ten'], ['bramka', 'ta'], ['miasto', 'to'], ['koszulka', 'ta'], ['dom', 'ten'], ['okno', 'to'], ['noc', 'ta'], ['dzień', 'ten'], ['piwo', 'to'], ['woda', 'ta']], artO: ['ten', 'ta', 'to', 'ci'], artQ: 'Welches Wort passt (ten / ta / to)?',
      pastP: ['ja (m.)', 'my (m.)', 'oni'], past: { grać: ['grałem', 'graliśmy', 'grali'], mówić: ['mówiłem', 'mówiliśmy', 'mówili'], mieć: ['miałem', 'mieliśmy', 'mieli'], iść: ['szedłem', 'szliśmy', 'szli'], wygrać: ['wygrałem', 'wygraliśmy', 'wygrali'], przegrać: ['przegrałem', 'przegraliśmy', 'przegrali'], strzelić: ['strzeliłem', 'strzeliliśmy', 'strzelili'], być: ['byłem', 'byliśmy', 'byli'], robić: ['robiłem', 'robiliśmy', 'robili'], pić: ['piłem', 'piliśmy', 'pili'] },
      prep: [['Idę ___ stadion.', 'na'], ['Mieszkam ___ Warszawie.', 'w'], ['To prezent ___ ciebie.', 'dla'], ['Gram ___ przyjaciółmi.', 'z'], ['Jestem ___ Niemiec.', 'z'], ['Mecz zaczyna się ___ trzeciej.', 'o'], ['Myślę ___ tobie.', 'o'], ['Jedziemy ___ Krakowa.', 'do'], ['Piłka jest ___ stołem.', 'pod'], ['Czekam ___ autobus.', 'na']], prepO: ['na', 'w', 'dla', 'z', 'o', 'do', 'pod', 'przez'],
      cond: { grać: ['grałbym', 'gralibyśmy', 'graliby'], mówić: ['mówiłbym', 'mówilibyśmy', 'mówiliby'], mieć: ['miałbym', 'mielibyśmy', 'mieliby'], wygrać: ['wygrałbym', 'wygralibyśmy', 'wygraliby'], być: ['byłbym', 'bylibyśmy', 'byliby'], robić: ['robiłbym', 'robilibyśmy', 'robiliby'], móc: ['mógłbym', 'moglibyśmy', 'mogliby'], chcieć: ['chciałbym', 'chcielibyśmy', 'chcieliby'] },
      subj: [['grać', 'graj'], ['mówić', 'mów'], ['iść', 'idź'], ['robić', 'rób'], ['pić', 'pij'], ['czekać', 'czekaj'], ['biegać', 'biegaj'], ['strzelać', 'strzelaj'], ['podać', 'podaj'], ['być', 'bądź']], subjL: 'Imperativ (ty)',
      idi: [['strzelić gola', 'ein Tor schießen'], ['trzymać kciuki', 'die Daumen drücken'], ['bułka z masłem', 'ein Kinderspiel'], ['mieć muchy w nosie', 'schlecht gelaunt sein'], ['nie mój cyrk, nie moje małpy', 'nicht mein Problem'], ['kosztować majątek', 'sehr teuer sein'], ['mieć głowę na karku', 'einen klaren Kopf haben'], ['być w formie', 'fit sein']] },
    ja: { voc: ['sakkā', 'gōru', 'senshu', 'kantoku', 'chīmu', 'bōru', 'shōri', 'haiboku', 'shinpan', 'sutajiamu', 'fan', 'shiai', 'mizu', 'pan', 'ie', 'kuruma', 'tomodachi', 'kyō', 'ashita', 'kinō', 'ii', 'warui', 'ōkii', 'chiisai', 'hayai', 'arigatō', 'onegaishimasu', 'hai', 'iie', 'konnichiwa'],
      gr: ['Ohayō gozaimasu', 'Oyasuminasai', 'Sayōnara', 'Sumimasen', 'O-genki desu ka?'], num: ['ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyū', 'jū'],
      verbs: { taberu: ['tabemasu', 'tabemasen', 'tabemashita', 'tabete', 'tabeta', 'tabenai', 'taberareru', 'tabereba', 'tabetara'], nomu: ['nomimasu', 'nomimasen', 'nomimashita', 'nonde', 'nonda', 'nomanai', 'nomeru', 'nomeba', 'nondara'], iku: ['ikimasu', 'ikimasen', 'ikimashita', 'itte', 'itta', 'ikanai', 'ikeru', 'ikeba', 'ittara'], miru: ['mimasu', 'mimasen', 'mimashita', 'mite', 'mita', 'minai', 'mirareru', 'mireba', 'mitara'], suru: ['shimasu', 'shimasen', 'shimashita', 'shite', 'shita', 'shinai', 'dekiru', 'sureba', 'shitara'], kuru: ['kimasu', 'kimasen', 'kimashita', 'kite', 'kita', 'konai', 'korareru', 'kureba', 'kitara'], kau: ['kaimasu', 'kaimasen', 'kaimashita', 'katte', 'katta', 'kawanai', 'kaeru', 'kaeba', 'kattara'], hanasu: ['hanashimasu', 'hanashimasen', 'hanashimashita', 'hanashite', 'hanashita', 'hanasanai', 'hanaseru', 'hanaseba', 'hanashitara'], matsu: ['machimasu', 'machimasen', 'machimashita', 'matte', 'matta', 'matanai', 'materu', 'mateba', 'mattara'], yomu: ['yomimasu', 'yomimasen', 'yomimashita', 'yonde', 'yonda', 'yomanai', 'yomeru', 'yomeba', 'yondara'] },
      vf: ['höfliche Form (-masu)', 'höfliche Verneinung (-masen)', 'höfliche Vergangenheit (-mashita)', 'te-Form', 'einfache Vergangenheit (-ta)', 'einfache Verneinung (-nai)', 'Potentialform (können)', 'Konditional (-ba)', 'Konditional (-tara)'],
      part: [['Watashi ___ gakusei desu.', 'wa'], ['Sakkā ___ shimasu.', 'o'], ['Gakkō ___ ikimasu.', 'ni'], ['Kōen ___ asobimasu.', 'de'], ['Dare ___ kimashita ka?', 'ga'], ['Tomodachi ___ eiga o mimasu.', 'to'], ['Kore wa watashi ___ bōru desu.', 'no'], ['Kuji ___ hajimarimasu.', 'ni'], ['Basu ___ ikimasu.', 'de'], ['Nihon ___ kimashita.', 'kara'], ['Eki ___ arukimasu.', 'made']], partO: ['wa', 'ga', 'o', 'ni', 'de', 'to', 'no', 'kara', 'made'],
      adj: [['ii', 'yokatta'], ['takai', 'takakatta'], ['samui', 'samukatta'], ['atsui', 'atsukatta'], ['oishii', 'oishikatta'], ['hayai', 'hayakatta'], ['tanoshii', 'tanoshikatta'], ['muzukashii', 'muzukashikatta']],
      kei: [['iku (Respekt)', 'irassharu'], ['taberu (Respekt)', 'meshiagaru'], ['iu (Respekt)', 'ossharu'], ['suru (Respekt)', 'nasaru'], ['miru (Respekt)', 'goran ni naru'], ['iku (Bescheiden)', 'mairu'], ['taberu (Bescheiden)', 'itadaku'], ['iu (Bescheiden)', 'mōsu'], ['suru (Bescheiden)', 'itasu'], ['miru (Bescheiden)', 'haiken suru'], ['iru (Bescheiden)', 'oru']] }
  };
  // Englisch: kurze Sätze statt Einzelwörter (A1 bzw. A2 mit gemischten Zeiten)
  var EN_S1 = [['Der Spieler ist sehr schnell.', 'The player is very fast.'], ['Wir spielen heute im Stadion.', 'We are playing in the stadium today.'], ['Der Trainer ist zufrieden.', 'The coach is happy.'], ['Ich trinke gern Wasser.', 'I like drinking water.'], ['Das Spiel beginnt um drei Uhr.', 'The match starts at three o’clock.'], ['Mein Freund ist ein großer Fan.', 'My friend is a big fan.'], ['Die Mannschaft hat zwei Torhüter.', 'The team has two goalkeepers.'], ['Das Auto steht vor dem Haus.', 'The car is in front of the house.'], ['Der Schiedsrichter pfeift ab.', 'The referee blows the final whistle.'], ['Morgen haben wir Training.', 'We have training tomorrow.'], ['Der Ball ist im Tor.', 'The ball is in the goal.'], ['Das war ein gutes Spiel.', 'That was a good game.'], ['Wie heißt du?', 'What is your name?'], ['Ich wohne in einem kleinen Dorf.', 'I live in a small village.'], ['Wir haben heute gewonnen.', 'We won today.'], ['Kannst du mir helfen?', 'Can you help me?'], ['Das Stadion ist voll.', 'The stadium is full.'], ['Er spielt jeden Samstag Fußball.', 'He plays football every Saturday.'], ['Die Fans singen laut.', 'The fans are singing loudly.'], ['Ich habe Hunger.', 'I am hungry.']];
  var EN_S2 = [['Gestern haben wir zwei Tore geschossen.', 'Yesterday we scored two goals.'], ['Nächste Woche spielen wir auswärts.', 'Next week we will play away.'], ['Der Stürmer läuft gerade zum Tor.', 'The striker is running towards the goal right now.'], ['Ich habe den Trainer noch nie so wütend gesehen.', 'I have never seen the coach so angry.'], ['Wir haben das Spiel leider verloren.', 'Unfortunately, we lost the match.'], ['Sie wird morgen einen neuen Vertrag unterschreiben.', 'She is going to sign a new contract tomorrow.'], ['Als ich ankam, regnete es.', 'When I arrived, it was raining.'], ['Der Verein sucht seit Wochen einen Torwart.', 'The club has been looking for a goalkeeper for weeks.'], ['Er war letzte Saison verletzt.', 'He was injured last season.'], ['Wir trainieren gerade im Regen.', 'We are training in the rain at the moment.'], ['Hast du schon das Ergebnis gehört?', 'Have you heard the result yet?'], ['Das Stadion wurde 1995 gebaut.', 'The stadium was built in 1995.'], ['Ich werde dich nach dem Spiel anrufen.', 'I will call you after the match.'], ['Die Spieler waren nach dem Spiel müde.', 'The players were tired after the game.'], ['Was hast du am Wochenende gemacht?', 'What did you do at the weekend?'], ['Der Bus kommt in zehn Minuten.', 'The bus is coming in ten minutes.']];
  var EN_PDE = { go: 'Ich wäre gegangen', win: 'Ich hätte gewonnen', lose: 'Ich hätte verloren', run: 'Ich wäre gelaufen', see: 'Ich hätte es gesehen', take: 'Ich hätte es genommen', give: 'Ich hätte es gegeben', eat: 'Ich hätte gegessen', drink: 'Ich hätte getrunken', write: 'Ich hätte geschrieben', speak: 'Ich hätte gesprochen', begin: 'Ich hätte angefangen', choose: 'Ich hätte gewählt', bring: 'Ich hätte es mitgebracht', teach: 'Ich hätte es beigebracht', fall: 'Ich wäre gefallen', forget: 'Ich hätte es vergessen', break: 'Ich hätte es kaputt gemacht' };
  function mcq(q, a, pool, R2) { var o = [a], p = pool.filter(function (x) { return x !== a; }), t = 0; while (o.length < 4 && p.length && t++ < 40) { var c = p[Math.floor(R2() * p.length)]; if (o.indexOf(c) < 0) o.push(c); } for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(R2() * (i + 1)); var tt = o[i]; o[i] = o[j]; o[j] = tt; } return { q: q, a: a, o: o }; }
  function langQs(L, lvl) {
    var lvl0 = Math.min(6, Math.max(1, lvl)); lvl = [0, 1, 2, 3, 3, 4, 4][lvl0];
    var d = LD[L], R2 = srng(hashS(L + lvl0)), Q = [], nm = LANGS[L][0], tail = [];
    if ((lvl0 === 4 || lvl0 === 6) && d.idi) d.idi.forEach(function (x) { Q.push(mcq('Was bedeutet „' + x[0] + '“?', x[1], d.idi.map(function (y) { return y[1]; }), R2)); });
    var si = Math.min(3, Math.max(1, lvl)) - 1, sd = SENT.de[si], sf = (SENT[L] || SENT.en)[si];
    sd.forEach(function (de, i) { var q = R2() < 0.5 ? mcq('Übersetze: „' + de + '“', sf[i], sf, R2) : mcq('Was bedeutet: „' + sf[i] + '“?', de, sd, R2); q.s = 1; tail.push(q); });
    if (lvl <= 1) {
      if (L !== 'en') { LV_DE.slice(0, 22).forEach(function (w, i) { Q.push(mcq('Was heißt „' + w + '“ auf ' + nm + '?', d.voc[i], d.voc, R2)); }); d.num.forEach(function (w, i) { if (i % 3 === 1) Q.push(mcq('Welche Zahl ist „' + w + '“?', String(i + 1), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], R2)); }); LV_DE.slice(0, 22).forEach(function (w, i) { if (i % 2 === 0) Q.push(mcq('Was bedeutet „' + d.voc[i] + '“?', w, LV_DE.slice(0, 22), R2)); }); }
      if (L === 'en') EN_S1.forEach(function (x, i) { Q.push(i % 2 ? mcq('Übersetze: „' + x[0] + '“', x[1], EN_S1.map(function (y) { return y[1]; }), R2) : mcq('Was bedeutet: „' + x[1] + '“?', x[0], EN_S1.map(function (y) { return y[0]; }), R2)); });
      GR_DE.forEach(function (w, i) { Q.push(mcq('Wie sagt man „' + w + '“ auf ' + nm + '?', d.gr[i], d.gr, R2)); });
      if (d.be) d.be.forEach(function (f, i) { Q.push(mcq('„' + PERS[i] + ' ' + (['bin', 'bist', 'ist', 'sind', 'seid', 'sind'][i]) + '“ auf ' + nm + ' (' + d.pro[i] + ' …):', f, d.be, R2)); });
      if (L === 'ja') d.part.slice(0, 5).forEach(function (x) { Q.push(mcq('Welche Partikel passt? ' + x[0], x[1], d.partO, R2)); });
    } else if (lvl === 2) {
      if (L === 'ja') { Object.keys(d.verbs).forEach(function (v) { [0, 1, 2].forEach(function (f) { var all = Object.keys(d.verbs).map(function (k) { return d.verbs[k][f]; }).concat(d.verbs[v]); Q.push(mcq(d.vf[f] + ' von „' + v + '“?', d.verbs[v][f], all, R2)); }); }); d.part.forEach(function (x) { Q.push(mcq('Welche Partikel passt? ' + x[0], x[1], d.partO, R2)); }); }
      else if (L === 'en') { EN_S2.forEach(function (x, i) { Q.push(i % 2 ? mcq('Übersetze: „' + x[0] + '“', x[1], EN_S2.map(function (y) { return y[1]; }), R2) : mcq('Was bedeutet: „' + x[1] + '“?', x[0], EN_S2.map(function (y) { return y[0]; }), R2)); }); Object.keys(d.conj).forEach(function (v) { d.conj[v].forEach(function (f, i) { if (i === 2) Q.push(mcq('Präsens von „' + v + '“: ' + d.pro[i] + ' ___', f, d.conj[v].concat([v + 'ed', v + 'ing']), R2)); }); }); d.past.slice(0, 10).forEach(function (x) { Q.push(mcq('Ergänze im Simple Past: „Yesterday I ___ (' + x[0] + ').“', x[1], d.past.map(function (y) { return y[1]; }).concat([x[0] + 'ed']), R2)); }); }
      else { Object.keys(d.conj).forEach(function (v) { d.conj[v].forEach(function (f, i) { if (i % 2 === 0 || L !== 'en') Q.push(mcq('Präsens von „' + v + '“: ' + d.pro[i] + ' ___', f, d.conj[v].concat(L === 'en' ? [v + 'ed', v + 'ing'] : []), R2)); }); }); d.art.forEach(function (x) { Q.push(mcq((d.artQ || 'Welcher Artikel passt?') + ' ___ ' + x[0], x[1], d.artO, R2)); }); if (L === 'en') EN2.forEach(function (x) { Q.push(mcq(x[0], x[1], x[2], R2)); }); LV_DE.slice(22).forEach(function (w, i) { if (d.voc[22 + i]) Q.push(mcq('Was heißt „' + w + '“ auf ' + nm + '?', d.voc[22 + i], d.voc.slice(22), R2)); }); }
    } else if (lvl === 3) {
      if (L === 'ja') { Object.keys(d.verbs).forEach(function (v) { [3, 4, 5].forEach(function (f) { Q.push(mcq(d.vf[f] + ' von „' + v + '“?', d.verbs[v][f], d.verbs[v].concat(Object.keys(d.verbs).map(function (k) { return d.verbs[k][f]; })), R2)); }); }); d.adj.forEach(function (x) { Q.push(mcq('Vergangenheit des Adjektivs „' + x[0] + '“?', x[1], d.adj.map(function (y) { return y[1]; }).concat([x[0] + 'katta', x[0] + 'deshita']), R2)); }); }
      else if (L === 'en') { d.past.forEach(function (x) { Q.push(mcq('Simple Past von „' + x[0] + '“?', x[1], d.past.map(function (y) { return y[1]; }).concat([x[0] + 'ed']), R2)); }); d.part.forEach(function (x) { Q.push(mcq('Partizip (Past Participle) von „' + x[0] + '“?', x[1], d.part.map(function (y) { return y[1]; }).concat([x[0] + 'ed']), R2)); }); d.prep.forEach(function (x) { Q.push(mcq('Welche Präposition passt? ' + x[0], x[1], d.prepO, R2)); }); }
      else { Object.keys(d.past).forEach(function (v) { d.past[v].forEach(function (f, i) { var pool = Object.keys(d.past).map(function (k) { return d.past[k][i]; }).concat(d.past[v]); Q.push(mcq('Vergangenheit von „' + v + '“ (' + d.pastP[i] + '):', f, pool, R2)); }); }); d.prep.forEach(function (x) { Q.push(mcq('Welche Präposition passt? ' + x[0], x[1], d.prepO, R2)); }); }
    } else {
      if (L === 'ja') { Object.keys(d.verbs).forEach(function (v) { [6, 7, 8].forEach(function (f) { Q.push(mcq(d.vf[f] + ' von „' + v + '“?', d.verbs[v][f], d.verbs[v].concat(Object.keys(d.verbs).map(function (k) { return d.verbs[k][f]; })), R2)); }); }); d.kei.forEach(function (x) { Q.push(mcq('Keigo-Form von „' + x[0] + '“?', x[1], d.kei.map(function (y) { return y[1]; }), R2)); }); }
      else if (L === 'en') { d.cond.forEach(function (x) { Q.push(mcq('Ergänze: ' + x[0], x[1], d.condO, R2)); }); d.part.forEach(function (x) { Q.push(mcq('Ergänze: „If I had known, I would have ___.“ – Deutsch: „Hätte ich es gewusst … ' + (EN_PDE[x[0]] || '') + '.“', x[1], d.part.map(function (y) { return y[1]; }).concat([x[0] + 'ed']), R2)); }); d.idi.forEach(function (x) { Q.push(mcq('Was bedeutet „' + x[0] + '“?', x[1], d.idi.map(function (y) { return y[1]; }), R2)); }); }
      else { Object.keys(d.cond).forEach(function (v) { d.cond[v].forEach(function (f, i) { var pool = Object.keys(d.cond).map(function (k) { return d.cond[k][i]; }).concat(d.cond[v]); Q.push(mcq('Konditional von „' + v + '“ (' + d.pastP[i] + '):', f, pool, R2)); }); }); d.subj.forEach(function (x) { Q.push(mcq(d.subjL + ' von „' + x[0] + '“?', x[1], d.subj.map(function (y) { return y[1]; }), R2)); }); d.idi.forEach(function (x) { Q.push(mcq('Was bedeutet „' + x[0] + '“?', x[1], d.idi.map(function (y) { return y[1]; }), R2)); }); }
    }
    return Q.slice(0, 50 - tail.length).concat(tail);
  }
  function slpOf(xp) { var l = 0; for (var i = 1; i < SLPXP.length; i++) if (xp >= SLPXP[i]) l = i; return l; }
  function qualF(S) { var c = S.courses || []; var f = 1 + c.length * 0.025; ['b', 'a', 'pro', 'ejl'].forEach(function (k) { if (c.indexOf(k) >= 0) f += { b: 0.05, a: 0.08, pro: 0.15, ejl: 0.05 }[k]; }); return f; }
  function langF(S) { var f = 1; Object.keys(S.lang || {}).forEach(function (k) { var l = langLvl(S.lang[k]); f += Math.max(0, l - 1) * 0.05; }); return f; }

  /* ===================== v16: Maskottchen, Lehrgänge, Scouting, Benefiz, Ansehen */
  var MASCM = 250; // Maskottchen: monatliche Kosten
  // Showbusiness: kurze Promi-Jobs für den Manager (Geld privat) – [key, Titel, Emoji, min €, max €, Tage, kann verlängert werden]
  var SHOWBIZ = [
    ['tv3', 'Gastrolle in einer Vorabendserie (3 Folgen)', '📺', 900, 1800, 21, 1],
    ['cover', 'Titelbild eines Sportmagazins', '📰', 400, 900, 7, 0],
    ['podcast', 'Gast in einem Fußball-Podcast', '🎙️', 150, 350, 3, 1],
    ['spotauto', 'Werbespot für ein Autohaus', '🚗', 600, 1400, 10, 1],
    ['autogramm', 'Autogrammstunde im Einkaufszentrum', '✍️', 200, 450, 2, 1],
    ['kochshow', 'Kochshow mit Promi-Gästen', '🍳', 500, 1100, 7, 0],
    ['quiz', 'Kandidat in einer Quizshow', '❓', 400, 1200, 5, 0],
    ['talk', 'Gast in einer Talkshow', '🛋️', 300, 700, 3, 1],
    ['radio', 'Radio-Interview am Morgen', '📻', 120, 300, 2, 1],
    ['doku', 'Mitwirkung an einer Fußball-Doku', '🎬', 800, 1600, 14, 0],
    ['buch', 'Vorwort für ein Fußballbuch', '📖', 300, 650, 10, 0],
    ['lesung', 'Lesung in der Stadtbibliothek', '📚', 150, 350, 2, 0],
    ['mode', 'Fotoshooting für eine Modemarke', '📸', 500, 1300, 4, 1],
    ['uhr', 'Gesicht einer Uhren-Kampagne', '⌚', 900, 2000, 21, 1],
    ['getraenk', 'Werbung für ein Sportgetränk', '🥤', 500, 1200, 10, 1],
    ['schule', 'Schulbesuch als Ehrengast', '🏫', 100, 250, 1, 0],
    ['stadtfest', 'Moderation auf dem Stadtfest', '🎪', 300, 700, 2, 1],
    ['gala', 'Laudator bei einer Sportgala', '🏆', 400, 900, 2, 0],
    ['esports', 'Showmatch im Fußball-Videospiel', '🎮', 250, 600, 3, 1],
    ['youtube', 'Challenge-Video mit einem TubeClip-Star', '▶️', 300, 800, 3, 1],
    ['tiktok', 'Klipster-Kooperation', '🎵', 250, 700, 7, 1],
    ['reise', 'Werbung für ein Reisebüro', '✈️', 500, 1100, 14, 0],
    ['baumarkt', 'Spot für einen Baumarkt', '🔨', 400, 900, 7, 1],
    ['brille', 'Kampagne für einen Optiker', '👓', 400, 1000, 14, 1],
    ['kinder', 'Gastauftritt in einer Kindersendung', '🧸', 300, 650, 5, 0],
    ['wetter', 'Wetteransage im Lokal-TV', '🌦️', 150, 350, 1, 0],
    ['theater', 'Kurzer Auftritt im Volkstheater', '🎭', 350, 800, 7, 0],
    ['hoerbuch', 'Sprechrolle in einem Hörspiel', '🎧', 300, 700, 5, 0],
    ['kalender', 'Fotos für einen Benefiz-Kalender', '🗓️', 200, 500, 3, 0],
    ['bank', 'Werbung für eine Regionalbank', '🏦', 600, 1500, 21, 1],
    ['pizza', 'Werbegesicht einer Pizzakette', '🍕', 500, 1200, 14, 1],
    ['fitness', 'Kampagne für ein Fitnessstudio', '💪', 400, 1000, 14, 1],
    ['messe', 'Stargast auf einer Sportmesse', '🏟️', 300, 800, 2, 0],
    ['expert', 'TV-Experte bei einem Länderspiel', '🎤', 500, 1300, 1, 1],
    ['kolumne', 'Kolumne in der Lokalzeitung', '🗞️', 150, 400, 30, 1],
    ['app', 'Werbung für eine Fitness-App', '📱', 300, 800, 10, 1],
    ['game', 'Synchronstimme in einem Fußballspiel', '🕹️', 400, 1100, 7, 0],
    ['charity', 'Charity-Spiel mit Prominenten', '❤️', 200, 500, 1, 0],
    ['event', 'Eröffnung eines Fanshops', '🛍️', 250, 600, 1, 0],
    ['musik', 'Gastauftritt in einem Musikvideo', '🎶', 400, 1000, 3, 0],
    ['reality', 'Kurzauftritt in einer Reality-Show', '🏝️', 600, 1500, 7, 0],
    ['golf', 'Promi-Golfturnier', '⛳', 300, 800, 2, 0],
    ['werkstatt', 'Spot für eine Autowerkstatt', '🔧', 300, 700, 7, 1],
    ['kaffee', 'Kampagne für eine Kaffeerösterei', '☕', 400, 900, 14, 1],
    ['mobil', 'Werbung für einen Mobilfunkanbieter', '📶', 700, 1600, 14, 1],
    ['kinospot', 'Mini-Rolle in einem Kinofilm', '🎞️', 900, 2000, 10, 0],
    ['panel', 'Podiumsdiskussion zum Amateurfußball', '🗣️', 150, 400, 1, 0],
    ['modell', 'Testimonial für ein E-Bike', '🚲', 400, 1000, 14, 1],
    ['sendung', 'Eigene Rubrik im Regional-TV', '📡', 500, 1200, 30, 1],
    ['weihnacht', 'Weihnachtsspot für einen Supermarkt', '🎄', 500, 1100, 7, 1]
  ];
  function sbInit(S) { if (!S.sb) S.sb = { offers: [], act: [], log: [], sum: 0 }; return S.sb; }
  function sbOffer(S, ext) { var B = sbInit(S), used = B.act.map(function (a) { return a.k; }).concat(B.offers.map(function (o) { return o.k; })), pool = SHOWBIZ.filter(function (g) { return used.indexOf(g[0]) < 0; }); if (!pool.length) return; var g = ext ? SHOWBIZ.filter(function (x) { return x[0] === ext.k; })[0] : pick(pool); if (!g) return; var f = 1 + Math.min(1.5, (S.follow || 0) / 40000);
    B.offers.push({ k: g[0], t: g[1], e: g[2], amt: nice(rint(g[3], g[4]) * f * (ext ? 1.2 : 1)), days: g[5], ext: !!ext, until: addDays(S.date, 7) }); }
  function sbDay(S, D) { if (!has(S, 'psponsor')) return; var B = sbInit(S);
    B.offers = B.offers.filter(function (o) { return o.until >= S.date; });
    B.act = B.act.filter(function (a) { if (a.done > S.date) return true; var P = privInit(S); P.cash += a.amt; P.log.unshift([S.date, a.e + ' ' + a.t, a.amt]); B.sum += a.amt; B.log.unshift([S.date, a.t, a.amt]); if (B.log.length > 40) B.log.length = 40; msg(S, 'privat', a.e + ' Fertig: ' + a.t + ' – ' + euro(a.amt) + ' gehen auf dein Privatkonto.'); followAdd(S, rint(30, 120)); var g = SHOWBIZ.filter(function (x) { return x[0] === a.k; })[0]; if (g && g[6] && R() < 0.35 && B.offers.length < 3) { sbOffer(S, a); msg(S, 'privat', a.e + ' Die Produktion war begeistert und möchte verlängern – schau unter Manager → Persönlicher Sponsor.'); } return false; });
    if (B.offers.length < 2 && R() < 0.06) sbOffer(S); }
  var MASC = [
    ['adler', 'Adler', '🦅', 'Verein', 8000, '+10 % Fan-Zuwachs, Fans +3', { fansG: 0.1 }],
    ['baer', 'Bär', '🐻', 'Verein', 9000, '+6 % Zuschauer bei Heimspielen', { zus: 6 }],
    ['fuchs', 'Fuchs', '🦊', 'Verein', 9500, '+8 % Sponsoren-Ansehen pro Saison', { spons: 3 }],
    ['eule', 'Eule', '🦉', 'Verein', 10000, '+8 % Trainingsfortschritt', { dev: 8 }],
    ['pferd', 'Pferd', '🐴', 'Verein', 7000, 'Moral der Mannschaft dauerhaft +3', { moral: 3 }],
    ['panther', 'Panther', '🐆', 'Torwart', 11000, 'Torwart hält 4 % mehr Bälle', { gk: 0.04 }],
    ['katze', 'Katze', '🐈', 'Torwart', 8500, 'Elfmeter-Paraden +10 %', { pen: 0.1 }],
    ['krake', 'Krake', '🐙', 'Torwart', 12000, 'Torwart-Entwicklung +15 %', { twdev: 15 }],
    ['gorilla', 'Gorilla', '🦍', 'Torwart', 10500, 'Weniger Gegentore in der Schlussphase (−8 %)', { defLate: 0.08 }],
    ['schildkroete', 'Schildkröte', '🐢', 'Torwart', 7500, 'Zu-Null-Chance +3 %', { gk: 0.03 }],
    ['nashorn', 'Nashorn', '🦏', 'Abwehr', 11000, 'Abwehr 3 % stabiler', { def: 0.03 }],
    ['elefant', 'Elefant', '🐘', 'Abwehr', 12500, '−6 % Gegentore in den letzten 10 Minuten', { defLate: 0.06 }],
    ['stier', 'Stier', '🐂', 'Abwehr', 9000, '−20 % Gelbe und Rote Karten', { cards: -0.2 }],
    ['wolf', 'Wolf', '🐺', 'Abwehr', 10000, 'Heimspiele: Abwehr +4 %', { defHome: 0.04 }],
    ['dachs', 'Dachs', '🦡', 'Abwehr', 8000, '−15 % Verletzungen', { inj: -15 }],
    ['gepard', 'Gepard', '🐆', 'Sturm', 11500, 'Konter: Angriff +3 %', { att: 0.03 }],
    ['loewe', 'Löwe', '🦁', 'Sturm', 14000, '+5 % Chance auf ein Tor in der letzten Minute', { late: 0.05 }],
    ['hai', 'Hai', '🦈', 'Sturm', 13000, 'Chancenverwertung +4 %', { att: 0.04 }],
    ['falke', 'Falke', '🦅', 'Sturm', 9500, '+4 % Chance auf ein frühes Tor (1.–10. Min.)', { early: 0.04 }],
    ['tiger', 'Tiger', '🐅', 'Sturm', 12000, 'Auswärts: Angriff +5 %', { attAway: 0.05 }]
  ];
  var COURSES = [
    ['kinder', 'Kindertrainer-Zertifikat', 'FVM', 150, 14, null, 'Academy-Talente entwickeln sich 5 % schneller', { ydev: 5 }],
    ['teamleiter', 'Teammanager-Lehrgang', 'FVM', 290, 21, null, 'Moral +2', { moral: 2 }],
    ['cbreit', 'Trainer-C-Lizenz Breitenfußball', 'FVM', 480, 56, null, 'Training +5 %', { dev: 5 }],
    ['cleist', 'Trainer-C-Lizenz Leistungsfußball', 'FVM', 650, 63, 'cbreit', 'Teamstärke +0,3', { taktik: 0.3 }],
    ['tw', 'Torwarttrainer-Lizenz', 'FVM', 420, 35, null, 'Torwart-Entwicklung +10 %, Paraden +1 %', { twdev: 10, gk: 0.01 }],
    ['athletik', 'Athletiktrainer-Fortbildung', 'FVM', 380, 28, null, '−10 % Verletzungen, schnellere Erholung', { inj: -10, rec: 5 }],
    ['standard', 'Standardsituationen-Workshop', 'DFB', 450, 14, 'cbreit', 'Angriff und Abwehr je +1,5 %', { att: 0.015, def: 0.015 }],
    ['psycho', 'Sportpsychologie-Seminar', 'DFB', 600, 21, null, 'Moral +2, +1 % Schlussphasen-Tore', { moral: 2, late: 0.01 }],
    ['video', 'Video-Analyst-Zertifikat', 'DFB', 900, 42, 'cleist', 'Angriff +2 %', { att: 0.02 }],
    ['b', 'Trainer-B-Lizenz', 'FVM', 1450, 120, 'cleist', 'Teamstärke +0,5, Training +5 %', { taktik: 0.5, dev: 5 }],
    ['ejl', 'DFB-Elite-Jugend-Lizenz', 'DFB', 2600, 150, 'b', 'Academy-Talente +12 % schneller, bessere Talente', { ydev: 12, youthq: 4 }],
    ['a', 'UEFA-A-Lizenz', 'DFB', 6500, 180, 'b', 'Teamstärke +0,8', { taktik: 0.8 }],
    ['pro', 'UEFA-Pro-Lizenz (Fußballlehrer)', 'DFB', 26000, 330, 'a', 'Teamstärke +1,2, Training +10 %', { taktik: 1.2, dev: 10 }]
  ];
  var CORG = {}; COURSES.forEach(function (c) { CORG[c[0]] = c[2]; }); // feste Zuordnung Landesverband/PRO, auch wenn der Anbieter umbenannt wird
  var SCOUTT = [
    ['region', 'Regionales Scout-Netzwerk', 250, 'Viele Talente aus der Umgebung – solide, selten Ausnahmetalente', { tal: 0, str: 0 }],
    ['video', 'Video-Analyse-Software', 450, 'Erkennt spielstarke Jugendliche', { tal: 0, str: 2 }],
    ['daten', 'Talent-Datenbank', 900, 'Findet mehr Talent', { tal: 0.5, str: 0, ml: 15, lg: 6 }],
    ['sichtung', 'Leistungsdiagnostik & Sichtungstage', 700, 'Ältere, fertigere Jugendliche', { tal: 0, str: 3, old: 1 }],
    ['tw', 'Torwart-Spezialscout', 350, 'Nur Torhüter – dafür mehr Talent', { tal: 0.5, str: 1, pos: ['TW'] }],
    ['abwehr', 'Abwehr-Scout', 450, 'Innen-, Außenverteidiger und Sechser', { tal: 0.3, str: 1, pos: ['IV', 'RV', 'LV', 'DM'] }],
    ['sturm', 'Offensiv-Scout', 450, 'Flügel, Zehner und Stürmer', { tal: 0.3, str: 1, pos: ['OM', 'RA', 'LA', 'ST', 'RM', 'LM'] }],
    ['intl', 'Internationales Scouting', 2500, 'Weltweite Suche – Chance auf Ausnahmetalente', { tal: 1, str: 1, intl: 1, ml: 20, lg: 4 }]
  ];
  var BENEFIZ = { 1: ['Bayer 04 Leverkusen', 'Borussia Mönchengladbach', 'Borussia Dortmund', 'Eintracht Frankfurt', 'VfL Wolfsburg', 'SC Freiburg', 'VfB Stuttgart', 'TSG Hoffenheim', '1. FSV Mainz 05', 'Werder Bremen', 'FC Augsburg', 'Union Berlin'], 2: ['Fortuna Düsseldorf', 'FC Schalke 04', 'Hertha BSC', 'Hannover 96', '1. FC Kaiserslautern', 'Karlsruher SC', 'SC Paderborn', 'VfL Bochum', 'Hamburger SV', '1. FC Nürnberg', 'SV Darmstadt 98', 'Holstein Kiel'], 3: ['Alemannia Aachen', 'MSV Duisburg', 'Rot-Weiss Essen', 'Viktoria Köln', 'SC Verl', 'Energie Cottbus', 'Rot-Weiß Oberhausen', 'Wuppertaler SV', 'SC Preußen Münster', 'Arminia Bielefeld', 'VfL Osnabrück', 'Dynamo Dresden'] };
  function benPick(S, tier) { var used = S.benUsed || [], pool = BENEFIZ[tier].filter(function (n) { return used.indexOf(n) < 0; }); if (!pool.length) pool = BENEFIZ[tier]; var n = pick(pool); S.benUsed = used.concat([n]).slice(-8); return n; }
  function bon(S, k) { var v = (k === 'att' || k === 'def' || k === 'late' || k === 'ydev') ? skv(S, k) : 0; if (k === 'late' && S.built && S.built.athletik) v += 0.03; if (k === 'late' && S.built && S.built.indoor) v += 0.01; var m = S.masc && MASC.filter(function (x) { return x[0] === S.masc; })[0]; if (m && m[6][k]) v += m[6][k] * (0.4 + 0.6 * (((S.mascBond || {})[S.masc] || 0) / 100)); (S.courses || []).forEach(function (c) { var C = COURSES.filter(function (x) { return x[0] === c; })[0]; if (C && C[7][k]) v += C[7][k]; }); return v; }
  function mgrRep(S, D) { var g = (S.wins || 0) + (S.draws || 0) + (S.losses || 0), ppg = g ? (3 * (S.wins || 0) + (S.draws || 0)) / g : 1.3; var tit = (S.achv || []).filter(function (a) { return /meister|aufstieg|pokal/.test(a.k); }).length; return Math.round(clamp(ppg / 3 * 40 + (11 - S.lvl) * 4.2 + tit * 2.5 + Math.min(10, (S.courses || []).length * 1.2) + Math.min(6, g / 40) + Math.min(8, S.shopRep || 0), 0, 100)); }
  function clubRep(S, D) { var l = S.lvl, tit = (S.achv || []).filter(function (a) { return /meister|aufstieg|pokal/.test(a.k); }).length; var me = null; try { me = table(S).filter(function (r) { return r.svw; })[0]; } catch (e) { } var rank = me ? me.rank : 9;
    var reg = clamp(18 + (11 - l) * 8 + (S.fans - 50) * 0.3 + tit * 2, 3, 100), nat = l <= 4 ? clamp((5 - l) * 18 + (l <= 3 ? 10 : 0) + tit * 2 + (S.fans - 60) * 0.2, 2, 100) : l === 5 ? 1 : 0, intl = l === 1 && rank <= 5 ? clamp(40 + (6 - rank) * 10 + tit, 5, 100) : (l === 1 ? 4 : 0);
    return { reg: Math.round(reg), nat: Math.round(nat), intl: Math.round(intl) }; }
  function scLimit(S) { var n = S.scout ? SCOUTT.filter(function (t) { return S.scout.tools[t[0]]; }).length : 0; return n ? 1 + Math.floor((n - 1) / 2) : 0; }
  function scLock(S, t) { if (S._dev) return ''; var f = t[4]; if (f.ml && mlv(S) < f.ml) return 'ab Manager-Level ' + f.ml; if (f.lg && S.lvl > f.lg) return 'ab ' + ((D0LV[f.lg]) || ('Liga ' + f.lg)); return ''; }
  var D0LV = { 4: 'Regionalliga', 6: 'Landesliga' };
  function scoutGen(S, D) { var SC = S.scout; if (!SC) return; var tAvg = S.players.length ? S.players.reduce(function (a, p) { return a + p.str; }, 0) / S.players.length : 30; var act = SCOUTT.filter(function (t) { return SC.tools[t[0]]; }); if (!act.length) { SC.pool = []; return; } SC.pool = [];
    var nP = 5 + act.length - 1 + (has(S, 'netzwerk') ? 1 : 0), seq = []; for (var q = 0; q < nP; q++) seq.push(act[q % act.length]); seq.sort(function () { return R() - 0.5; });
    for (var i = 0; i < nP; i++) { var t = seq[i], f = t[4], y = newYouth(S, D, false); y.age = f.old ? rint(17, 18) : rint(14, 17); if (f.pos) { y.dp = pick(f.pos); y.pos = GRP[y.dp] || y.pos; } y.tal = talRare(Math.max(1, Math.min(5, Math.round((rnd(1, 2.9) + f.tal * 0.6 + (SC.score || 0) / 220 + (f.intl && R() < 0.1 ? 0.5 : 0)) * 2) / 2))); y.str = Math.max(4, Math.round((y.str * 0.85 + f.str * 0.5 + rnd(-2, 1)) * 10) / 10); if (y.str > tAvg - 4 && R() < 0.85) y.str = Math.round((tAvg - rnd(4, 9)) * 10) / 10; /* Scouting gedämpft (Wunsch 25.11.) */ y.pot = potOf(y.str, y.age, y.tal); y.s0 = y.str; y.via = t[1]; if (f.intl) y.from = pick(['Brasilien', 'Ghana', 'Japan', 'Frankreich', 'Kroatien', 'Argentinien', 'Senegal', 'Portugal', 'Dänemark']); SC.pool.push(y); } }

  var EXTRA_ITEMS = [
    ['indoor', 'Training', 'Indoor-Trainingshalle', 'Training bei jedem Wetter – auch im Winter volle Entwicklung', 600000, 1200, 120, '', 'dev:+8; inj:-8; rec:+0.5'],
    ['aplatz', 'Academy', 'Academy-Trainingsplatz', 'Eigener Platz für die Jugend – Talente entwickeln sich schneller', 180000, 400, 60, '', 'ydev:+15'],
    ['jzentrum', 'Academy', 'Jugendzentrum', 'Treffpunkt, Büros und Kabinen für alle Jugendteams', 350000, 800, 120, '', 'ydev:+10; youthq:+2'],
    ['astadion', 'Academy', 'Academy-Stadion', 'Kleines Stadion für die Jugend – zieht Top-Talente an', 900000, 2000, 180, 'aplatz', 'youthq:+4; fans:+2'],
    ['sprachschule', 'Academy', 'Sprachschule', 'Internationale Talente kommen lieber – und lernen schneller', 120000, 300, 60, '', 'youthq:+2; ydev:+5'],
    ['agym', 'Academy', 'Academy-Gym', 'Kraft und Athletik für die Jugend', 150000, 400, 45, '', 'ydev:+10'],
    ['bushalt', 'Academy', 'Bushaltestelle', 'Talente aus der Region kommen leichter zum Training', 40000, 50, 30, '', 'youthq:+1'],
    ['ubahn', 'Academy', 'U-Bahn-Station', 'Anbindung an die Stadt – mehr Talente und Zuschauer', 2500000, 0, 365, 'bushalt', 'youthq:+3; zus:+8'],
    // Stadion-Ebenen (Wunsch 24.11.): −1 Untergeschoss, 0 Spielfeld, 2 Dach
    ['bauhof', 'Verein', 'Bauhof', 'Eigene Bautruppe: kürzere Bauzeiten, günstigere Projekte – ab Stufe 3 mehr Projekte gleichzeitig', 45000, 400, 30, '', ''],
    ['tg_profi', 'Stadion', 'Tiefgarage Profis', 'Eigene Zufahrt für die Mannschaft – entspannter Spieltag', 180000, 200, 60, '', 'moral:+3; heim:+0.2'],
    ['tg_vip', 'Stadion', 'Tiefgarage VIP', 'Parkplätze für Sponsoren und VIP-Gäste – neue Werbefläche', 350000, 300, 75, 'tg_profi', 'spons:+6; sponsorchance:+10'],
    ['st_kabine', 'Stadion', 'Stadion-Kabinen', 'Heim- und Gästekabine direkt unter der Tribüne', 120000, 150, 45, '', 'moral:+3; rec:+0.5'],
    ['st_gym', 'Stadion', 'Aufwärm-Gym', 'Kraftraum zum Aufwärmen vor dem Anpfiff', 90000, 150, 30, 'st_kabine', 'inj:-8; heim:+0.2'],
    ['st_physio', 'Stadion', 'Physio-Bereich', 'Behandlung direkt neben dem Spielfeld', 70000, 200, 30, 'st_kabine', 'heal:-15; rec:+0.5'],
    ['st_eisbad', 'Stadion', 'Eisbad & Sauna', 'Schnellere Regeneration nach dem Spiel', 60000, 120, 21, 'st_physio', 'rec:+1; inj:-5'],
    ['st_presse', 'Stadion', 'Presseraum', 'Pressekonferenzen im Stadion – mehr Aufmerksamkeit', 80000, 100, 30, '', 'fans:+3; spons:+4'],
    ['ledbande', 'Stadion', 'LED-Werbebande', 'Digitale Bande rund ums Spielfeld – neue Werbefläche', 150000, 250, 30, '', 'spons:+5'],
    ['tunnel', 'Stadion', 'Spielertunnel', 'Einlauf mit Gänsehaut-Atmosphäre', 50000, 50, 21, 'st_kabine', 'heim:+0.3; fans:+2'],
    ['trainerbank', 'Stadion', 'Überdachte Trainerbänke', 'Moderne Auswechselbänke mit Sitzheizung', 20000, 20, 10, '', 'moral:+1'],
    ['solardach', 'Stadion', 'Solardach', 'Strom vom Dach – grünes Image bei Sponsoren', 400000, 0, 60, 'ueberdach', 'spons:+3; fans:+2'],
    ['dachwerbung', 'Stadion', 'Dach-Werbefläche', 'Riesiges Logo auf dem Dach – neue Werbefläche', 120000, 50, 30, 'ueberdach', 'spons:+4'],
    ['dachkamera', 'Stadion', 'Kameraplattform', 'TV-Kameras unterm Dach – mehr Reichweite', 250000, 100, 45, 'ueberdach', 'fans:+3; spons:+3']
  ];
  var SPECIAL = { mental: ['Mentaltrainer', '🧠', 900, 'Moral +6, Form +1 für alle', 3], fitness: ['Fitnessguru', '💪', 1100, 'Fitness +8, Fitnessgrenze +2', 3], ernaehrung: ['Ernährungsberater', '🥗', 700, 'Fitnessgrenze +3, schnellere Erholung', 2], profi: ['Ehemaliger Profi', '⭐', 2000, '5 Spieler +0,2 Stärke, Moral +3', 5] };
  var HOBBIES = [['ski', 'Skifahren', '⛷️', 'Moral +1', { moral: 1 }], ['boxen', 'Boxen', '🥊', 'Vorstand +1', { board: 1 }], ['kickbox', 'Kickboxen', '🦵', 'Moral +1', { moral: 1 }], ['marathon', 'Marathon', '🏃', 'Fitness +2', { fit: 2 }], ['fussball', 'Fußball', '⚽', '+3 XP', { xp: 3 }], ['basket', 'Basketball', '🏀', 'Fans +1', { fans: 1 }], ['yoga', 'Yoga', '🧘', 'Moral +2', { moral: 2 }], ['tennis', 'Tennis', '🎾', 'Sponsoren +1', { spons: 1 }], ['schwimmen', 'Schwimmen', '🏊', 'Fitness +1', { fit: 1 }], ['rudern', 'Rudern', '🚣', 'Teamgeist', { moral: 1, xp: 1 }], ['fallschirm', 'Fallschirmspringen', '🪂', 'Follower', { follow: 60 }], ['paintball', 'Paintball', '🎯', 'Moral +2', { moral: 2 }], ['schach', 'Schach', '♟️', '+3 XP', { xp: 3 }], ['code', 'Programmieren', '💻', 'Privatgeld', { cash: 140 }], ['kunst', 'Künstler', '🎨', 'Fans & Follower', { fans: 1, follow: 25 }], ['holz', 'Holzarbeiten', '🪵', 'Privatgeld', { cash: 90 }]];
  var CONC = [['schnibbel', 'Schnibbelchen', '🍟', 3, 0.24, 'f'], ['wurst', 'Bratwurst', '🌭', 3.5, 0.34, 'f'], ['bier', 'Bier', '🍺', 3.5, 0.5, 'd'], ['cola', 'Cola', '🥤', 2.5, 0.22, 'd'], ['wasser', 'Wasser', '💧', 2, 0.14, 'd'], ['kaffee', 'Kaffee', '☕', 2, 0.12, 'd']];
  var MERCH = [['trikot', 'Trikot', '👕', 69, 0.3], ['anzug', 'Trainingsanzug', '🧥', 89, 0.12], ['fanshirt', 'Fan-Shirt', '🎽', 25, 0.6], ['rucksack', 'Rucksack', '🎒', 35, 0.18], ['handtuch', 'Handtuch', '🧺', 20, 0.2], ['schal', 'Fan-Schal', '🧣', 18, 0.7], ['cap', 'Basecap', '🧢', 22, 0.35]];
  function prc(S, k, base) { var P = S.prices || {}; return P[k] && P[k].p != null ? P[k].p : base; }
  function demand(price, base, el) { return clamp(Math.pow(base / Math.max(0.1, price), el || 1.4), 0.15, 1.9); }
  function concF(S) { var a = 0, b = 0; CONC.forEach(function (c) { var p = prc(S, c[0], c[3]); a += c[4] * demand(p, c[3]) * p; b += c[4] * c[3]; }); return a / b; }
  function merchF(S) { var a = 0, b = 0; MERCH.forEach(function (c) { var p = prc(S, c[0], c[3]); a += c[4] * demand(p, c[3], 1.6) * p; b += c[4] * c[3]; }); return a / b; }
  function priceMood(S) { var r = 0, n = 0; CONC.concat(MERCH).forEach(function (c) { var p = prc(S, c[0], c[3]); r += p / c[3]; n++; }); return r / n; }
  // ============================================================ Jugendteams: eigene Liga je Team, Jugendtrainer, Torschützen
  var YTL = ['Normalgruppe', 'Leistungsgruppe', 'Sonderliga', 'Mittelrheinliga', 'Regionalliga West', 'Junioren-Bundesliga'];
  var YTN = { u19: 'U19 (A-Jugend)', u17: 'U17 (B-Jugend)', u15: 'U15 (C-Jugend)' };
  var YTC = [[0, 'Kein Trainer', 0, 0], [1, 'Jugendtrainer (C-Lizenz)', 250, 0.15], [2, 'Jugendtrainer (B-Lizenz)', 600, 0.3], [3, 'Jugendtrainer (A-Lizenz)', 1200, 0.5]];
  function ytOf(y) { return y.age >= 17 ? 'u19' : y.age >= 15 ? 'u17' : 'u15'; }
  var YTAGE = { u19: [17, 18], u17: [15, 16], u15: [13, 14] };
  function ytGen(S, D, k, age) { var y = newYouth(S, D, false), dA = 18 - age; y.age = age; y.str = Math.max(3, Math.round((y.str - dA * 2.2 - rnd(2, 6)) * 10) / 10); y.tal = clamp(Math.round(y.tal * 2 - (R() < 0.6 ? 1 : 0)) / 2, 1, 5); y.pot = potOf(y.str, y.age, y.tal); y.s0 = y.str; y.ytk = k; return y; }
  function ytSquad(S, D, k) { var T = S.yt[k]; if (!T.sq) { T.sq = []; for (var i = 0; i < 14; i++) T.sq.push(ytGen(S, D, k, rint(YTAGE[k][0], YTAGE[k][1]))); } return T.sq; }
  function ytAge(S, D) { if (!S.yt) return; var up = { u15: 'u17', u17: 'u19', u19: null }, moved = {};
    ['u19', 'u17', 'u15'].forEach(function (k) { var T = S.yt[k]; if (!T || !T.sq) return; T.sq.forEach(function (y) { y.age++; }); var keep = [], go = []; T.sq.forEach(function (y) { if (y.age > YTAGE[k][1]) go.push(y); else keep.push(y); }); T.sq = keep;
      go.forEach(function (y) { var nk = up[k]; if (nk && S.built[nk]) { (moved[nk] = moved[nk] || []).push(y); y.ytk = nk; } else msg(S, 'jugend', '👋 ' + y.n + ' (' + y.age + ') verlässt die ' + YTN[k] + (nk ? '' : ' – zu alt für die Jugend') + '.'); }); });
    Object.keys(moved).forEach(function (k) { var T = S.yt[k]; if (T && T.sq) T.sq = T.sq.concat(moved[k]); });
    ['u19', 'u17', 'u15'].forEach(function (k) { var T = S.yt[k]; if (!T || !T.sq || !S.built[k]) return; while (T.sq.length < 14) T.sq.push(ytGen(S, D, k, YTAGE[k][0])); }); }
  function ytFind(S, k, id) { var T = S.yt && S.yt[k]; return T && T.sq ? T.sq.filter(function (y) { return y.id === +id; })[0] : null; }
  function ytBack(S) { var w = wkStart(S); S.players.filter(function (p) { return p.ytTmp && p.ytTmp.w !== w; }).forEach(function (p) { var y = ytFind(S, p.ytTmp.k, p.ytTmp.id); if (y) { y.str = p.str; y.gp1 = (y.gp1 || 0) + (p.gp || 0); y.g1 = (y.g1 || 0) + (p.g || 0); } removePlayer(S, p); if (S.lineup.bench) S.lineup.bench = S.lineup.bench.filter(function (x) { return x !== p.id; }); }); }
  function ytInit(S, k, D) { S.yt = S.yt || {}; var T = S.yt[k]; if (!T) T = S.yt[k] = { lg: 0, coach: 0 }; if (T.season !== S.season) { T.season = S.season; T.w = 0; T.d = 0; T.l = 0; T.gf = 0; T.ga = 0; T.gp = 0; T.games = []; T.sc = {}; T.opp = ytOpps(S, k, T.lg, D); } return T; }
  function ytOpps(S, k, lg, D) { var L = locOf(S), base = ['SV', 'FC', 'TuS', 'SC', 'JSG', 'SG', 'VfL', 'Spvg'], out = [], d = D ? dOf(S, D) : { teams: {} }; var names = []; var Lt = Math.max(2, 10 - lg * 2); try { Object.keys(d.teams || {}).forEach(function (l) { if (Math.abs(+l - Lt) > 1) return; (d.teams[l] || []).forEach(function (t) { if (!/ II| III/.test(t.n) && t.n !== S.club) names.push(t.n); }); }); } catch (e) {}
    var sd = clubSeed(k + lg + S.season); for (var i = 0; i < 11; i++) { var n = names.length ? names[(sd + i * 7919) % names.length] : base[i % base.length] + ' ' + (L ? L.ort : 'Nord') + ' ' + (i + 1); if (out.some(function (o) { return o.n === n; })) n = n + ' (' + (i + 1) + ')'; out.push({ n: n, s: 18 + lg * 6 + (k === 'u19' ? 4 : k === 'u17' ? 2 : 0) + rnd(-5, 5), w: 0, d: 0, l: 0, gf: 0, ga: 0 }); } return out; }
  function ytStr(S, k) { var T = S.yt[k], Y = S.youth.filter(function (y) { return ytOf(y) === k; }).concat(T.sq || []), base = Y.length ? Y.reduce(function (a, y) { return a + y.str; }, 0) / Y.length : 15; return base * 0.9 + 6 + (Y.length < 5 ? -3 : 0) + (YTC[T.coach || 0][3] * 8); }
  function ytWeekly(S, D) { var mo = mon(S.date), dy = +S.date.slice(8, 10); if (!S.youth || mo === 6 || mo === 7 || (mo === 12 && dy > 12) || mo === 1 || (mo === 2 && dy < 10) || wkNo(S) % 3 === 2) return; ['u19', 'u17', 'u15'].forEach(function (k) { if (!S.built[k]) return; var T = ytInit(S, k, D); ytSquad(S, D, k); if (T.gp >= 22) return;
    var o = T.opp[T.gp % T.opp.length], ms = ytStr(S, k), dd = clamp(ms - o.s, -15, 15), lf = 1.5 * Math.exp(0.07 * dd), la = 1.5 * Math.exp(-0.07 * dd), gf = poisson(lf), ga = poisson(la), home = T.gp % 2 === 0;
    T.gp++; T.gf += gf; T.ga += ga; if (gf > ga) { T.w++; o.l++; } else if (gf === ga) { T.d++; o.d++; } else { T.l++; o.w++; } o.gf += ga; o.ga += gf;
    T.opp.forEach(function (x) { if (x !== o) { var r = R(); if (r < 0.45) x.w++; else if (r < 0.7) x.d++; else x.l++; var a = rint(0, 3), b = rint(0, 3); x.gf += a; x.ga += b; } });
    var Y = S.youth.filter(function (y) { return ytOf(y) === k; }).concat(T.sq || []); (T.sq || []).forEach(function (y) { y.str = Math.min(y.pot, y.str + Math.max(0, y.pot - y.str) * 0.006 * (1 + YTC[T.coach || 0][3])); }); for (var g = 0; g < gf && Y.length; g++) { var sh = wpick(Y, function (y) { return y.pos === 'ST' ? 5 : y.pos === 'MF' ? 2.5 : y.pos === 'AB' ? 0.8 : 0.05; }); T.sc[sh.id] = (T.sc[sh.id] || 0) + 1; }
    T.games.unshift({ d: S.date, o: o.n, h: home, gf: gf, ga: ga }); T.games = T.games.slice(0, 22);
    if (T.gp === 22) { var tb = ytTable(S, k), me = tb.filter(function (r) { return r.me; })[0]; if (me.rk <= 2 && T.lg < YTL.length - 1) { T.lg++; msg(S, 'jugend', '🏆 Die ' + YTN[k] + ' wird ' + me.rk + '. und steigt in die ' + YTL[T.lg] + ' auf!'); xp(S, 25); } else if (me.rk >= 11 && T.lg > 0) { T.lg--; msg(S, 'jugend', '📉 Die ' + YTN[k] + ' steigt in die ' + YTL[T.lg] + ' ab.'); } else msg(S, 'jugend', 'Die ' + YTN[k] + ' beendet die Saison auf Platz ' + me.rk + '.'); }
  }); }
  function poisson(l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= R(); } while (p > L && k < 12); return k - 1; }
  function ytTable(S, k) { var T = S.yt[k]; var rows = T.opp.map(function (o) { return { n: o.n, p: o.w * 3 + o.d, gd: o.gf - o.ga, gp: o.w + o.d + o.l }; }); rows.push({ n: S.club, me: true, p: T.w * 3 + T.d, gd: T.gf - T.ga, gp: T.gp }); rows.sort(function (a, b) { return b.p - a.p || b.gd - a.gd; }); rows.forEach(function (r, i) { r.rk = i + 1; }); return rows; }
  function ytView(S, D) { return ['u19', 'u17', 'u15'].filter(function (k) { return S.built[k]; }).map(function (k) { var T = ytInit(S, k, D), tb = ytTable(S, k), me = tb.filter(function (r) { return r.me; })[0], Y = S.youth.filter(function (y) { return ytOf(y) === k; });
    ytSquad(S, D, k); var w0 = wkStart(S);
    var sc = Object.keys(T.sc).map(function (id) { var y = S.youth.concat(T.sq || []).filter(function (q) { return q.id === +id; })[0]; return y ? { n: y.n, g: T.sc[id] } : null; }).filter(Boolean).sort(function (a, b) { return b.g - a.g; }).slice(0, 3);
    return { k: k, n: YTN[k], lg: YTL[T.lg], lgI: T.lg, rk: me.rk, pts: me.p, gp: T.gp, w: T.w, d: T.d, l: T.l, gf: T.gf, ga: T.ga, coach: T.coach || 0, coachN: YTC[T.coach || 0][1], coaches: YTC, ids: Y.map(function (y) { return y.id; }), top: tb.slice(0, 3).map(function (r) { return [r.rk, r.n, r.p, !!r.me]; }), sc: sc, last: T.games.slice(0, 3), str: Math.round(ytStr(S, k)), upUsed: S.ytUpW === w0, sq: T.sq.map(function (y) { return { id: y.id, n: y.n, pos: y.pos, dp: y.dp, age: y.age, str: Math.round(y.str * 10) / 10, tal: y.tal, talLo: S.built.scout || S._dev ? y.tal : Math.max(1, y.tal - 1), talHi: S.built.scout || S._dev ? y.tal : Math.min(5, y.tal + 1), up: S.players.some(function (p) { return p.ytTmp && p.ytTmp.id === y.id; }), gp1: y.gp1 || 0 }; }).sort(function (a, b) { return b.str - a.str; }) }; }); }
  function youthCap(S) { return 3 + 3 * ['u15', 'u17', 'u19'].filter(function (k) { return S.built[k]; }).length + (S.built.internat ? 2 : 0); }
  function youthAdd(S, y, manual) { if (S.youth.length >= youthCap(S)) { if (manual) err('Die Academy ist voll (' + youthCap(S) + ' Plätze). Mehr Plätze gibt es mit weiteren Jugendteams.'); return false; } S.youth.push(y); return true; }
  function langLvl(x) { if (x.passed == null) x.passed = slpOf(x.xp || 0); return Math.min(slpOf(x.xp || 0), x.passed); }
  function itPool(S) {
    var w = wkStart(S); if (S.itPoolW === w || !S.players || !S.players.length) return;
    var prev = S.itPool || [], cand = S.players.filter(function (p) { return !(p.loan && p.loan.to) && prev.indexOf(p.id) < 0; });
    if (cand.length < 3) cand = S.players.filter(function (p) { return !(p.loan && p.loan.to); });
    var out = []; while (out.length < 3 && cand.length) out.push(cand.splice(Math.floor(R() * cand.length), 1)[0].id);
    S.itPool = out; S.itPoolW = w;
  }
  function wkStart(S) { return addDays(S.date, -((dow(S.date) + 6) % 7)); }
  var MEDIT = {
    physio: ['Physiotherapie', 'Behandlung nach Training und Spiel – schnellere Erholung', [3000, 6000, 11000], [250, 450, 700], { rec: 0.7, heal: -8 }, 21],
    arzt: ['Mannschaftsarzt', 'Vorsorge und schnelle Diagnosen – weniger Verletzungen', [2000, 5000, 10000], [350, 600, 1000], { inj: -10, heal: -6 }, 14],
    reha: ['Reha-Raum', 'Geräte und Bewegungsbad – Verletzte sind schneller zurück', [8000, 15000, 28000], [120, 220, 380], { heal: -12, rec: 0.3 }, 45],
    lab: ['Leistungsdiagnostik', 'Laktattests und Belastungssteuerung – weniger Muskelverletzungen', [5000, 11000, 20000], [160, 300, 500], { inj: -8, rec: 0.3 }, 30],
    ernaehrung: ['Ernährungsberatung', 'Pläne für Essen und Regeneration', [1000, 2200, 4500], [130, 240, 400], { rec: 0.4, inj: -4 }, 10],
    mrt: ['MRT', 'Eigenes MRT – exakte Diagnosen, kein Warten auf Termine', [45000, 70000, 110000], [400, 650, 1000], { heal: -9, inj: -4 }, 90],
    pool: ['Schwimmbad', 'Aqua-Training und Regeneration im eigenen Becken', [35000, 60000, 95000], [110, 190, 320], { rec: 0.6, heal: -5 }, 120],
    therapeut: ['Therapeut', 'Mentale Stärke und Umgang mit Druck', [1200, 2500, 5000], [200, 350, 560], { moral: 2, inj: -1 }, 7],
    ortho: ['Orthopädie', 'Gelenke, Bänder, Knochen – Spezialisten im Haus', [11000, 20000, 35000], [380, 640, 1000], { inj: -7, heal: -8 }, 40],
    auge: ['Augenarzt', 'Sehtests und Sportbrillen – bessere Wahrnehmung', [3500, 7000, 13000], [200, 350, 560], { dev: 2, inj: -1 }, 20],
    zahn: ['Zahnarzt', 'Entzündungen im Mund kosten Kraft – Vorsorge hilft', [4000, 8000, 14000], [190, 320, 520], { rec: 0.2, inj: -3 }, 20]
  };
  function medMS(S, D) { return clamp(moneyScale(S, D), 0.5, 40); }
  function medSt(S) { var M = S.med2 = S.med2 || {}; if (S.med && !S.medMig) { Object.keys(S.med).forEach(function (k) { if (S.med[k] && MEDIT[k]) M[k] = { lvl: S.med[k], staff: true, bld: null, ren: addDays(S.date, 365 * rint(7, 15)) }; }); S.medMig = true; } return M; }
  function medActive(S, k) { var m = medSt(S)[k]; if (!m || !m.lvl || !m.staff || (m.bld && m.bld > S.date && m.lvl === 1)) return 0; var l = m.bld && m.bld > S.date ? m.lvl - 1 : m.lvl; return l * (m.ren && m.ren < S.date && m.lvl === 3 ? 0.6 : 1); }

  function eff(S, D) {
    var e = { kap: 0, fans: 0, dev: 0, twdev: 0, inj: 0, heal: 0, rec: 0, taktik: 0, moral: 0, food: 0, merch: 1, spons: 0, ticket: 0, zus: 0, away: 0, youth: 0, youthq: 0, tal: 0, flut: 1, rasen: 'kunst', heiz: 0, scout: 0, bench: 0, members: 0, heim: 0, sponsorchance: 0, moralschutz: 0 };
    Object.keys(S.built).forEach(function (id) {
      var it = D.items[id]; if (!it) return; var um = 1 + (((S.upg || {})[id] || 1) - 1) * 0.15;
      Object.keys(it.fx).forEach(function (k) {
        var v = it.fx[k];
        if (k === 'merch') e[k] = Math.max(e[k], 1 + (v - 1) * um);
        else if (k === 'flut') e[k] = Math.max(e[k], v);
        else if (typeof v === 'number' && k !== 'kap') { e[k] = (e[k] || 0) + v * um; return; }
        else if (k === 'rasen') e.rasen = v;
        else if (typeof v === 'number') e[k] = (e[k] || 0) + v;
      });
    });
    if (S.pitch.type === 'natur') e.rasen = 'natur';
    ['dev', 'twdev', 'inj', 'rec', 'moral', 'zus', 'taktik', 'youthq'].forEach(function (k) { var b = bon(S, k); if (b) e[k] = (e[k] || 0) + b; });
    Object.keys(MEDIT).forEach(function (k) { var lv = medActive(S, k); if (!lv) return; var it = MEDIT[k]; Object.keys(it[4]).forEach(function (fk) { e[fk] = (e[fk] || 0) + it[4][fk] * lv; }); });
    var fcp = fcPct(S); if (fcp) { e.ticket = (e.ticket || 0) + fcp; e.zus = (e.zus || 0) + fcp; e.merch = (e.merch || 1) * (1 + fcp / 100); }
    if (S.hollyStar) { var hf = S.hollyStar.eff; e.merch = (e.merch || 1) * (1 + hf * 0.6); e.spons = (e.spons || 0) + hf * 20; e.ticket = (e.ticket || 0) + hf * 10; e.zus = (e.zus || 0) + hf * 15; }
    if (S.skt) { e.taktik += skv(S, 'str'); e.dev += skv(S, 'dev'); e.inj += skv(S, 'inj'); e.rec = (e.rec || 0) + skv(S, 'rec'); e.spons = (e.spons || 0) + skv(S, 'spons'); e.zus = (e.zus || 0) + skv(S, 'zus'); e.ticket = (e.ticket || 0) + skv(S, 'ticket'); e.food = (e.food || 0) + skv(S, 'food'); }
    return e;
  }
  function itemMonthly(S, D, it) { return (it.cat === 'Personal' || it.cat === 'Mannschaften') ? nice(it.monthly * Math.max(0.3, Math.pow(moneyScale(S, D), 0.7))) : Math.round(it.monthly * (1 + (((S.upg || {})[it.id] || 1) - 1) * 0.08)); }
  function capacity(S, D) { if (S.built && S.built.arena) return 89000; return (S.cap0 || D.cap0) + (S.capX || 0) + eff(S, D).kap; }
  // Zuschauerplätze zum Start: zufällig je Spielklasse (Ebene), auf 50 gerundet
  var CAPR = { 1: [30000, 75000], 2: [15000, 40000], 3: [8000, 25000], 4: [3000, 12000], 5: [1500, 5000], 6: [800, 3000], 7: [500, 2000], 8: [300, 1500], 9: [200, 1000], 10: [150, 800], 11: [100, 600] };
  function capStart(lvl, seed) { var r = CAPR[lvl] || CAPR[8], x = Math.abs(Math.sin((seed || 1) * 9301 + lvl * 49297)) % 1; return Math.round((r[0] + x * (r[1] - r[0])) / 50) * 50; }
  // Kleine Ausbauten bis 10.000 Plätze (Box oben links im Verein)
  var CAPMAX = 10000;
  function capOpts(S, D) { var c = capacity(S, D); if (S.built && (S.built.arena || S.built.ausbau5k)) return []; var left = CAPMAX - c; if (left <= 0 || S.capB) return []; var n = Math.min(CAPSTEP, left), per = 90 + Math.round(c / 80); return [{ n: n, cost: Math.round(n * per / 500) * 500, days: 21 }]; }
  var CAPSTEP = 500;

  // ============================================================ Welt & Ligen
  function lvMid(D, l) { var L = D.lv[l]; return (L.lo + L.hi) / 2; }
  function genTeamName(S) {
    var pre = ['SV', 'TuS', 'FC', 'SC', 'SpVg', 'VfL', 'DJK', 'TSV', 'SSV', 'FV', 'VfR', 'SG'];
    var ort = ['Swisttal', 'Rheinbach', 'Meckenheim', 'Bornheim', 'Königswinter', 'Hennef', 'Lohmar', 'Much', 'Eitorf', 'Windeck', 'Niederkassel', 'Remagen', 'Grafschaft', 'Sinzig', 'Euskirchen', 'Weilerswist', 'Bad Neuenahr', 'Ahrweiler', 'Brohl', 'Unkel', 'Erpel', 'Linz', 'Wesseling', 'Brühl', 'Kerpen', 'Zülpich', 'Mechernich', 'Kall', 'Nettersheim', 'Blankenheim'];
    if (S && S.reg && S.world) { var ro = {}; Object.keys(S.world.pool).forEach(function (l) { S.world.pool[l].forEach(function (t) { var o = clubTown(t.n); if (o) ro[o] = 1; }); }); var rl = Object.keys(ro); if (rl.length > 8) ort = rl; }
    for (var i = 0; i < 50; i++) { var n = pick(pre) + ' ' + pick(ort) + (R() < 0.4 ? ' ' + pick(['II', 'III']) : ''); if (!S || !allTeamNames(S)[n]) return n; }
    return 'SV Neustadt ' + rint(2, 99);
  }
  function allTeamNames(S) { var o = {}; Object.keys(S.world.lv).forEach(function (l) { S.world.lv[l].forEach(function (t) { o[t.n] = 1; }); }); Object.keys(S.world.pool).forEach(function (l) { S.world.pool[l].forEach(function (t) { o[t.n] = 1; }); }); return o; }
  function mkTeam(D, l, src) { var L = D.lv[l]; var b = src && src.b != null ? src.b + gauss() * (L.hi - L.lo) * 0.07 : clamp(lvMid(D, l) + gauss() * (L.hi - L.lo) / 6, L.lo - 3, L.hi + 3); return { n: src ? src.n : '', b: Math.round(b * 10) / 10, s: Math.round(b * 10) / 10, r: l >= 5 ? 1 : 0 }; }

  // Echte Ligen (Verband gewählt): Regeln je Spielstand – Namen, Größen, Auf-/Abstiegsplätze der eigenen Staffel-Kette
  // ============================================================ Vorgaben (im Admin änderbar, Tabelle game_config)
  var INSTA_DEF = [
    { id: 'ligaradar', name: 'ligaradar', ver: true, per: 18, col: '#b3261e', fx: {}, texts: ['{liga}: {spitze} grüßt von der Tabellenspitze ({punkte} Punkte). Wer stoppt den Primus? 📊', 'Amateur-Check {liga}: {verein} aktuell auf Platz {platz}. Trainer {trainer} hat einen Plan. 🔎', 'Spieler der Woche-Kandidat: {spieler} von {verein} überzeugt mit starken Leistungen. ⭐', '{liga}: Torflut am Wochenende! Die Highlights im Überblick ⚽'] },
    { id: 'marktcheck', name: 'marktwert.check', ver: true, per: 14, col: '#1a2b6b', fx: {}, texts: ['Gerüchteküche {liga}: Mehrere Vereine sollen an Talenten von {verein} interessiert sein. 👀', 'Vertragsticker: Bleibt {spieler} bei {verein}? 📝', 'Transferbilanz: Wer hat in der {liga} am besten eingekauft? Jetzt abstimmen! 🗳️'] },
    { id: 'verbandsecho', name: 'verbandsecho', ver: true, per: 2, col: '#0b6e3b', fx: { follow: 120, fans: 1 }, texts: ['Amateurfußball ist Herzblut! ❤️ Heute grüßen wir {verein} aus der {liga} – #UnsereAmateure', 'Ehrenamt verdient Applaus 👏 Danke an alle Helferinnen und Helfer bei {verein}!'] }
  ];
  var INSTA = INSTA_DEF, LICI = {}, SALR = {}, SALDEF = {}, CFGV = 0, CFGDEF = null, CFGNOW = {};
  var CFG_LV = ['budget', 'zus', 'ticket', 'spons', 'tv', 'lo', 'hi', 'licCap', 'licFlut', 'prize'];
  function salSample(l, D) { var L = D.lv[l]; if (!L) return [0, 0]; var f = function (str) { return salDemand0({ str: str, age: 26, tal: 3 }, +l); }; return [f(L.lo), f(L.hi)]; }
  function cfgSnap(D) {
    if (CFGDEF) return;
    CFGDEF = { lv: {}, xp: XPLV.slice(), feat: FEATURES.map(function (f) { return f[0]; }), items: {}, courses: COURSES.map(function (c) { return [c[1], c[2]]; }), capr: JSON.parse(JSON.stringify(CAPR)), cups: {}, cupn: {}, ligaLvl: JSON.parse(JSON.stringify(LIGA_LVL)), dayev: {} };
    Object.keys(D.lv).forEach(function (l) { var o = {}; CFG_LV.forEach(function (k) { o[k] = D.lv[l][k]; }); if (o.prize == null) o.prize = nice((D.lv[l].budget || 0) * 0.04); CFGDEF.lv[l] = o; SALDEF[l] = salSample(l, D); });
    D.itemList.forEach(function (it) { CFGDEF.items[it.id] = { name: it.name, desc: it.desc, cost: it.cost, monthly: it.monthly, days: it.days }; });
    Object.keys(CUPS).forEach(function (k) { CFGDEF.cups[k] = CUPS[k].prize.slice(); CFGDEF.cupn[k] = CUPS[k].name; });
    Object.keys(DAYEV).forEach(function (k) { CFGDEF.dayev[k] = [DAYEV[k][0], DAYEV[k][2]]; });
  }
  // rows: [{key, value}] aus game_config – setzt immer erst die Standardwerte, dann die Änderungen (mehrfach aufrufbar)
  function applyCfg(D, rows) {
    cfgSnap(D); var C = {}; (rows || []).forEach(function (r) { if (r && r.key) C[r.key] = r.value; }); CFGNOW = C;
    var nv = function (v, d) { return v === '' || v == null || isNaN(+v) ? d : +v; };
    Object.keys(CFGDEF.lv).forEach(function (l) { var o = (C.liga || {})[l] || {}; CFG_LV.forEach(function (k) { D.lv[l][k] = nv(o[k], CFGDEF.lv[l][k]); }); });
    var xp = Array.isArray(C.xp) && C.xp.length ? C.xp : CFGDEF.xp; XPLV.length = 0; xp.forEach(function (v, i) { XPLV.push(nv(v, CFGDEF.xp[i] || 0)); });
    FEATURES.forEach(function (f, i) { f[0] = nv((C.feat || {})[f[1]], CFGDEF.feat[i]); });
    D.itemList.forEach(function (it) { var d0 = CFGDEF.items[it.id], o = (C.items || {})[it.id] || {}; it.name = o.name || d0.name; it.desc = o.desc != null && o.desc !== '' ? o.desc : d0.desc; it.cost = nv(o.cost, d0.cost); it.monthly = nv(o.monthly, d0.monthly); it.days = nv(o.days, d0.days); });
    COURSES.forEach(function (c, i) { var o = (C.courses || {})[c[0]] || {}; c[1] = o.name || CFGDEF.courses[i][0]; c[2] = o.by || CFGDEF.courses[i][1]; });
    Object.keys(CFGDEF.capr).forEach(function (l) { var o = (C.capr || {})[l]; CAPR[l] = o && o.length === 2 ? [nv(o[0], CFGDEF.capr[l][0]), nv(o[1], CFGDEF.capr[l][1])] : CFGDEF.capr[l].slice(); });
    Object.keys(CUPS).forEach(function (k) { var o = (C.cups || {})[k]; CUPS[k].prize = CFGDEF.cups[k].map(function (v, i) { return o ? nv(o[i], v) : v; }); CUPS[k].name = ((C.cupn || {})[k]) || CFGDEF.cupn[k]; });
    Object.keys(CFGDEF.ligaLvl).forEach(function (l) { LIGA_LVL[l] = 999; });
    Object.keys(CFGDEF.dayev).forEach(function (k) { var o = (C.dayev || {})[k] || {}; DAYEV[k][0] = o.name || CFGDEF.dayev[k][0]; DAYEV[k][2] = nv(o.cost, CFGDEF.dayev[k][1]); });
    LICI = C.licItems || {}; SALR = C.sal || {}; INSTA = Array.isArray(C.insta) ? C.insta : INSTA_DEF; INJL = Array.isArray(C.inj) && C.inj.length >= 3 ? C.inj : INJ_DEF;
    CFGV++; DCACHE = {};
  }
  // Alles, was die Vorgaben-Seite anzeigt: Standardwerte + aktuelle Werte
  function cfgInfo(D) {
    cfgSnap(D);
    return { def: CFGDEF, now: CFGNOW, lv: Object.keys(D.lv).map(function (l) { var L = D.lv[l]; return { l: +l, name: L.name, short: L.short, size: L.size, up: L.up, down: L.down, budget: L.budget, zus: L.zus, ticket: L.ticket, spons: L.spons, tv: L.tv, lo: L.lo, hi: L.hi, licCap: L.licCap, licFlut: L.licFlut, licRasen: L.licRasen, prize: L.prize, sal: SALR[l] || SALDEF[l], salDef: SALDEF[l], cap: CAPR[l] || null, start: LIGA_LVL[l] || 0 }; }),
      xp: XPLV.slice(), feat: FEATURES.map(function (f) { return { lvl: f[0], k: f[1], n: f[2], d: f[3] || '' }; }), items: D.itemList.map(function (it) { return { id: it.id, cat: it.cat, name: it.name, desc: it.desc, cost: it.cost, monthly: it.monthly, days: it.days, req: it.req, flvl: itemLvl(it), lic: LICI[it.id] || 0 }; }),
      courses: COURSES.map(function (c) { return { id: c[0], name: c[1], by: c[2], cost: c[3], days: c[4], fx: c[6] }; }), cups: Object.keys(CUPS).map(function (k) { return { k: k, name: CUPS[k].name, prize: CUPS[k].prize.slice() }; }),
      insta: INSTA, inj: INJL, injDef: INJ_DEF, dayev: Object.keys(DAYEV).map(function (k) { return { k: k, name: DAYEV[k][0], d: DAYEV[k][1], cost: DAYEV[k][2] }; }), rounds: RNAMES };
  }
  // Liganame ohne Staffel/Gruppe/Nummer: „Landesliga Südbaden 2“ → „Landesliga Südbaden“
  function ligaName(n) { var s = String(n || '').replace(/^\d{2,4}\s+/, '').replace(/^BZL\b/, 'Bezirksliga').replace(/\bHerren\b/g, '').replace(/\s*\([^)]*Staffel\)/g, '').replace(/,?\s*\b(Staffel|Gruppe)\s+[\wÄÖÜäöü]+\b/gi, '').replace(/,\s*\d+\b/g, '').replace(/\s*\(K\)/g, '').replace(/\s*\(([^)]+)\)$/, ' $1').replace(/\s{2,}/g, ' ').trim();
    s = s.replace(/^VL\b/, 'Verbandsliga').replace(/^GL\b/, 'Gruppenliga').replace(/^KOL\b/, 'Kreisoberliga').replace(/^KL([A-D])\b/, 'Kreisliga $1').replace(/^(\d)\.\s?KK\b/, '$1. Kreisklasse').replace(/^KK\b/, 'Kreisklasse');
    // Sponsor vor dem Liganamen weg: „Lotto Hessenliga“ → „Hessenliga“
    var m = s.match(/^(.+?)\s((?:\d\.\s)?[A-ZÄÖÜ][\wäöüß./-]*(?:liga|klasse|Liga|Klasse)\b.*)$/); if (m && !/^\d+\.$/.test(m[1]) && !/(liga|klasse)$/i.test(m[1])) s = m[2];
    s = s.replace(/^BZL\b/, 'Bezirksliga').replace(/^KL\b/, 'Kreisliga').replace(/^KK\b/, 'Kreisklasse').replace(/\s*\(Verband\)/, '').replace(/^(Bezirksliga|Landesliga|Kreisliga|Kreisklasse) Bayern,\s*/, '$1 ').replace(/,?\s*(Staffel|Gruppe|Gr\.|St\.)\s*[\wÄÖÜäöü-]*$/i, '').replace(/\s*[–-]\s*(Staffel\s*)?\d+$/, '').replace(/\s+\d+\s+Flex$/i, '').replace(/\b([A-D])\d+$/, '$1').replace(/\s+(\d+|[IVX]+)$/, '').replace(/\s+[–-]\s+/g, ' ').replace(/[\s,–-]+$/, '').trim(); return s || String(n || ''); }
  var DCACHE = {};
  function dOf(S, D) {
    if (!S || !S.reg || !S.reg.lv) return D;
    var key = S.reg.key + '|' + CFGV + '|' + (D.lv[1] && D.lv[1].budget);
    if (DCACHE[key] && DCACHE[key].base === D) { DCACHE[key].d.club = S.club; return DCACHE[key].d; }
    var d = Object.create(D); d.lv = {}; Object.keys(D.lv).forEach(function (l) { d.lv[l] = D.lv[l]; });
    Object.keys(S.reg.lv).forEach(function (l) { var b = D.lv[l] || D.lv[11]; var o = {}; Object.keys(b).forEach(function (k) { o[k] = b[k]; }); var r = S.reg.lv[l]; if (r.name) r.name = ligaName(r.name); ['name', 'short', 'size', 'up', 'upRel', 'down', 'downRel'].forEach(function (k) { if (r[k] != null) o[k] = r[k]; }); o.l = +l; o.link = r.link || ''; d.lv[l] = o; });
    d.maxLvl = S.reg.max; d.club = S.club; d.startLvl = S.reg.lvl0 || D.startLvl;
    DCACHE[key] = { base: D, d: d }; return d;
  }
  // ---------------------------------------------------------------- Regionale Namen
  // Im Standardspiel (SV Wachtberg) bleiben alle Texte wie sie sind. Bei echten Vereinen werden Bonn/Wachtberg-Bezüge
  // durch Ort, Kreisstadt und Kreis des gewählten Vereins ersetzt (Sponsoren, Versorger, Wohnungen, Spenden, Texte).
  var TOWN_SKIP = /^(\d+\.?|[IVX]+|e\.?V\.?|SV|FC|TuS|SC|SG|SpVg|Spvgg|SpVgg|VfL|VfB|VfR|DJK|TSV|SSV|BSV|FSV|ESV|PSV|TV|TuRa|TuWa|SuS|SuF|BV|BW|GW|RW|SW|FSG|JSG|SF|SpF|Spfr|FV|TSG|TSC|TuB|TB|TG|SVG|SGE|SpG|KF|SKV|ASV|ATV|BSC|CfR|CSV|DSC|DSV|ETB|FFC|FK|GSV|JFV|KSV|MSV|OSV|RSV|SSG|TTC|VfJ|VFL|VFB|SV\.|S\.C\.|F\.C\.|Sportfreunde|Sportclub|Sportverein|Turnverein|Spielvereinigung|Eintracht|Fortuna|Germania|Borussia|Viktoria|Victoria|Preußen|Preussen|Arminia|Teutonia|Alemannia|Union|Concordia|Westfalia|Rhenania|Olympia|Hertha|Phönix|Adler|Blau-Weiß|Blau-Weiss|Rot-Weiß|Rot-Weiss|Grün-Weiß|Grün-Weiss|Schwarz-Weiß|Schwarz-Weiss|Rot-Gold|Blau-Gelb|Glück-Auf|Glückauf|Sparta|Vorwärts|Wacker|Kickers|Wormatia|Rot-Weiss|Rot-Weiß|Palatia|Bavaria|Saxonia|Hassia|Moguntia|Treveris|Sportfreunde|SpVgg|Rapid|Dynamo|Ballspiel|Rasensport|Türkspor|Türkiyemspor|Türkgücü|Inter|Real|Sporting|Junkersdorf-|Club|Verein|Jugend|Sport|Spiel|BC|SVS|YEG|Al|Ay|de|von|am|an|der|im|in)$/i;
  function clubTown(n) {
    // Ort = letztes passendes Wort vor einem „/“ (SV Anadolu Spor Koblenz → Koblenz, SG Holzen/Eisborn → Holzen)
    var w = String(n || '').replace(/\(.*?\)/g, ' ').split('/')[0].replace(/\b(19|20)\d\d\b/g, ' ').split(/\s+/).filter(Boolean).reverse();
    for (var i = 0; i < w.length; i++) { var x = w[i].replace(/[.,]$/, ''); if (x.length > 2 && /^[A-ZÄÖÜ]/.test(x) && !TOWN_SKIP.test(x) && !/^\d/.test(x) && !/^[A-Z]{2,4}$/.test(x)) return x.replace(/-$/, ''); }
    return '';
  }
  function homeStadion(S) { var L = locOf(S); return L ? 'Sportpark ' + L.ort : 'Waldstadion'; }
  function regFix(S) { if (!S) return; if (S.feed && S.feed.some(function (x) { return /^(kicker|transfermarkt|dfb|fvm|fynn)$/.test(x.media || ''); })) S.feed = S.feed.filter(function (x) { return !/^(kicker|transfermarkt|dfb|fvm|fynn)$/.test(x.media || ''); }); if (S.cap0 == null && S.lvl) S.cap0 = capStart((S.reg && S.reg.lvl0) || S.lvl, S.pseed || 7); if (S.follow0 == null && S.follow != null) S.follow0 = S.follow; ['kit', 'ball'].forEach(function (k) { var B = k === 'ball' ? BALL_BRANDS : KIT_BRANDS; if (S[k] && B[S[k].brand]) S[k].name = B[S[k].brand]; (S[k + 'Offers'] || []).forEach(function (o) { if (B[o.brand]) o.name = B[o.brand]; }); }); if (S.reg && S.stadion === 'Waldstadion') S.stadion = homeStadion(S); (S.cups || []).forEach(function (c) { if (CUPS[c.k] && c.name !== CUPS[c.k].name) c.name = CUPS[c.k].name; }); }
  // Ortskoordinaten: orte = { Name: [[lat, lon, Land], …] }, part = Index der Namensteile; nur Treffer im passenden Bundesland
  var VB_LAND = { Mittelrhein: ['Nordrhein-Westfalen'], Niederrhein: ['Nordrhein-Westfalen'], Westfalen: ['Nordrhein-Westfalen'], Rheinland: ['Rheinland-Pfalz'], 'Südwest': ['Rheinland-Pfalz'], 'RV Südwest': ['Rheinland-Pfalz', 'Saarland', 'Baden-Württemberg', 'Hessen'], 'RV West': ['Nordrhein-Westfalen'], DFB: [], Bayern: ['Bayern'], Baden: ['Baden-Württemberg'], 'Südbaden': ['Baden-Württemberg'], 'Württemberg': ['Baden-Württemberg'], 'Oberliga BW': ['Baden-Württemberg'], Hessen: ['Hessen'], 'Thüringen': ['Thüringen'], 'RV Nordost': ['Thüringen', 'Sachsen', 'Sachsen-Anhalt', 'Berlin', 'Brandenburg', 'Mecklenburg-Vorpommern'] };
  function geoIndex(orte) { var part = {}; Object.keys(orte).forEach(function (k) { k.split(/[-\s]+/).forEach(function (p) { if (p.length > 3) (part[p] = part[p] || []).push.apply(part[p], orte[k]); }); }); return part; }
  // Ort und Bundesland der Profivereine (Name allein ist oft kein Ort: Bonner SC, Preußen Münster)
  var PRO_ORT = {}; (function () { var LN = { NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland', BY: 'Bayern', BW: 'Baden-Württemberg', HE: 'Hessen', NI: 'Niedersachsen', HB: 'Bremen', HH: 'Hamburg', BE: 'Berlin', BB: 'Brandenburg', SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', MV: 'Mecklenburg-Vorpommern', TH: 'Thüringen' }; 'FC Bayern München|München|BY;Bayer 04 Leverkusen|Leverkusen|NW;Borussia Dortmund|Dortmund|NW;RB Leipzig|Leipzig|SN;VfB Stuttgart|Stuttgart|BW;Eintracht Frankfurt|Frankfurt am Main|HE;SC Freiburg|Freiburg|BW;TSG Hoffenheim|Sinsheim|BW;Borussia Mönchengladbach|Mönchengladbach|NW;SV Werder Bremen|Bremen|HB;1. FSV Mainz 05|Mainz|RP;1. FC Köln|Köln|NW;1. FC Union Berlin|Berlin|BE;FC Augsburg|Augsburg|BY;Hamburger SV|Hamburg|HH;FC Schalke 04|Gelsenkirchen|NW;SC Paderborn 07|Paderborn|NW;SV Elversberg|Spiesen-Elversberg|SL;VfL Wolfsburg|Wolfsburg|NI;1. FC Heidenheim|Heidenheim an der Brenz|BW;FC St. Pauli|Hamburg|HH;Hertha BSC|Berlin|BE;Hannover 96|Hannover|NI;1. FC Kaiserslautern|Kaiserslautern|RP;SV Darmstadt 98|Darmstadt|HE;VfL Bochum|Bochum|NW;1. FC Nürnberg|Nürnberg|BY;Karlsruher SC|Karlsruhe|BW;1. FC Magdeburg|Magdeburg|ST;Holstein Kiel|Kiel|SH;Arminia Bielefeld|Bielefeld|NW;Dynamo Dresden|Dresden|SN;SpVgg Greuther Fürth|Fürth|BY;Eintracht Braunschweig|Braunschweig|NI;VfL Osnabrück|Osnabrück|NI;Energie Cottbus|Cottbus|BB;Fortuna Düsseldorf|Düsseldorf|NW;Hansa Rostock|Rostock|MV;Preußen Münster|Münster|NW;Rot-Weiss Essen|Essen|NW;MSV Duisburg|Duisburg|NW;Alemannia Aachen|Aachen|NW;1. FC Saarbrücken|Saarbrücken|SL;Jahn Regensburg|Regensburg|BY;SV Wehen Wiesbaden|Wiesbaden|HE;Waldhof Mannheim|Mannheim|BW;FC Ingolstadt 04|Ingolstadt|BY;SC Verl|Verl|NW;Viktoria Köln|Köln|NW;Fortuna Köln|Köln|NW;SV Meppen|Meppen|NI;Würzburger Kickers|Würzburg|BY;VfB Stuttgart II|Stuttgart|BW;TSG Hoffenheim II|Sinsheim|BW;SG Sonnenhof Großaspach|Aspach|BW;TSV Havelse|Garbsen|NI;Rot-Weiß Oberhausen|Oberhausen|NW;Borussia Dortmund II|Dortmund|NW;FC Gütersloh|Gütersloh|NW;1. FC Bocholt|Bocholt|NW;SV Rödinghausen|Rödinghausen|NW;Sportfreunde Siegen|Siegen|NW;Bonner SC|Bonn|NW;SG Wattenscheid 09|Bochum|NW;FC Schalke 04 II|Gelsenkirchen|NW;Borussia Mönchengladbach II|Mönchengladbach|NW;1. FC Köln II|Köln|NW;Sportfreunde Lotte|Lotte|NW;SC Wiedenbrück|Rheda-Wiedenbrück|NW;SV Bergisch Gladbach|Bergisch Gladbach|NW;SC Paderborn 07 II|Paderborn|NW;VfL Bochum II|Bochum|NW;VfB 03 Hilden|Hilden|NW;SV Westfalia Rhynern|Hamm|NW'.split(';').forEach(function (r) { var x = r.split('|'); PRO_ORT[x[0]] = [x[1], LN[x[2]]]; }); })();
  function geoFind(orte, part, name, verband, kreis) {
    var po = PRO_ORT[name]; if (po) { var PL = orte[po[0]] || orte[po[0].split(' ')[0]] || []; for (var pi = 0; pi < PL.length; pi++) if (PL[pi][2] === po[1]) return [PL[pi][0], PL[pi][1]]; if (PL.length) return [PL[0][0], PL[0][1]]; }
    var lands = VB_LAND[verband] || [], pickL = function (L) { if (!L || !L.length) return null; if (!lands.length) return [L[0][0], L[0][1]]; for (var i = 0; i < lands.length; i++) for (var j = 0; j < L.length; j++) if (L[j][2] === lands[i]) return [L[j][0], L[j][1]]; return null; };
    var t = clubTown(name), k = String(kreis || '').replace(/^Kreis\s+/, '').split(/[-\/\s]/)[0];
    return pickL(orte[t]) || pickL(orte[t.replace(/-.*$/, '')]) || pickL(part[t]) || pickL(orte[k]) || pickL(part[k]) || null;
  }
  function adjOf(o) { return /e$/.test(o) ? o + 'r' : o + 'er'; }
  var LOCC = {};
  function locOf(S) {
    if (!S || !S.reg) return null;
    var k = S.club + '|' + S.reg.kreis; if (LOCC[k]) return LOCC[k];
    var kreis = String(S.reg.kreis || '').replace(/^K_\d+\s*/, '').replace(/Dinslak$/, 'Dinslaken').trim();
    var stadt = kreis.split(/[-\s]/)[0] || '', ort = clubTown(S.club) || stadt || 'Heimatort'; if (!stadt) stadt = ort;
    var ini = String(S.club).split(/[\s\/-]+/).filter(function (x) { return /^[A-ZÄÖÜ]/.test(x); }).map(function (x) { return x[0]; }).join('').slice(0, 4) || 'Verein';
    return (LOCC[k] = { ort: ort, ortA: adjOf(ort), stadt: stadt, stadtA: adjOf(stadt), kreis: kreis || stadt, ini: ini, club: S.club, handle: String(S.club).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '').slice(0, 24) });
  }
  // safe: nur eindeutige Bezüge (für freie Texte); list: zusätzlich Ortsteile und Landschaften (für Firmen-/Ortsnamen)
  function rxPairs(L, list) {
    var p = [[/SV Wachtberg/g, L.club], [/Förderverein SVW/g, 'Förderverein ' + L.ini], [/\bdie Macht im Ländchen\b/g, 'die Macht in ' + L.ort], [/\bder SVW\b/g, 'der ' + L.ini], [/\bSVW\b/g, L.ini],
      [/vom Ländchen auf den Drachenfels/g, 'über ' + L.ort], [/ins Ländchen/g, 'nach ' + L.ort], [/für das Ländchen/g, 'für ' + L.ort], [/im Ländchen/g, 'in ' + L.ort], [/aus dem Ländchen/g, 'aus ' + L.ort], [/Wachtberger/g, L.ortA], [/Wachtberg/g, L.ort], [/Bonner/g, L.stadtA], [/\bBonn\b/g, L.stadt],
      [/Ländchen-/g, L.ort + '-'], [/Ländchen/g, L.ort], [/Waldstadion/g, 'Sportpark ' + L.ort], [/Rhein-Sieg/g, L.kreis], [/Penthouse am Rhein|Villa am Rhein/g, function (m) { return m.split(' ')[0] + ' in ' + L.stadt; }], [/am Rhein/g, 'in ' + L.stadt]];
    if (list) p = p.concat([[/Berkumer|Villiper|Niederbachemer|Pecher|Adendorfer|Arzdorfer|Meckenheimer/g, L.ortA], [/Villiprott|Niederbachem|Fritzdorf|Adendorf|Arzdorf|Berkum|Villip|\bPech\b/g, L.ort],
      [/Siebengebirgs-/g, L.kreis + '-'], [/Siebengebirge/g, L.kreis], [/Drachenfels/g, L.ort], [/Rheintal|Rheinhöhe|Rheinquelle/g, L.ort], [/Rheinblick/g, L.stadt + '-Blick'], [/RheinFunk/g, L.stadtA + ' Funk'],
      [/Hotel Godesburg-Blick/g, 'Hotel ' + L.stadt], [/Bad Godesberg|Godesberg|Godesburg/g, L.stadt], [/Godesnet/g, L.ort + 'Net'], [/Siebennet/g, L.kreis + ' Net'], [/Ahrtal/g, L.kreis], [/Kottenforst/g, 'Stadtwald'], [/Voreifel/g, L.kreis], [/Ville\b/g, L.kreis]]);
    return p;
  }
  function rxDo(S, t, list) {
    var L = locOf(S); if (!L || t == null || typeof t !== 'string' || !/Wachtberg|Bonn|SVW|Ländchen|Waldstadion|Rhein|Siebengeb|Drachenfels|Berkum|Villip|Godes|Ahrtal|Kottenforst|Voreifel|Ville|Pech|Adendorf|Arzdorf|Niederbachem|Meckenheim|Fritzdorf|Siebennet/.test(t)) return t;
    // echte Gegner mit solchen Namen (z. B. SV Wachtberg in der eigenen Liga) bleiben unverändert
    var keep = []; t = t.replace(/(SV Wachtberg|SC Fortuna Bonn|Bonner SC|[A-Za-zÄÖÜäöüß.\d]+ (Bonn|Wachtberg)[A-Za-zÄÖÜäöüß\-]*( II| III)?)/g, function (m) { if (m !== L.club && S.world && teamExists(S, m)) { keep.push(m); return '\u0001' + (keep.length - 1) + '\u0001'; } return m; });
    rxPairs(L, list).forEach(function (r) { t = t.replace(r[0], r[1]); });
    return t.replace(/\u0001(\d+)\u0001/g, function (_, i) { return keep[+i]; });
  }
  function rx(S, t) { return rxDo(S, t, false); }
  function rxPub(S, t) { return S && S.reg ? rx(S, t) : t; }
  // Fan-Nutzernamen: Ortsteil-Präfixe (berkum_kicker …) durch den eigenen Ort ersetzen
  function rxU(S, u) { var L = locOf(S); if (!L) return u; var o = L.ort.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '');
    return u.replace(/^(wachtberger|wachtberg|laendchen|ländchen|waldstadion|drachenfels|berkum|pech|villip|niederbachem|adendorf|ließem|werthhoven|fritzdorf|arzdorf)(?=_)/, o).replace(/^svw_/, L.ini.toLowerCase() + '_'); }
  function rxL(S, t) { return rxDo(S, t, true); }
  function teamExists(S, n) { var w = S.world; for (var l in w.lv) for (var i = 0; i < w.lv[l].length; i++) if (w.lv[l][i].n === n) return true; for (l in w.pool) for (i = 0; i < w.pool[l].length; i++) if (w.pool[l][i].n === n) return true; return false; }

  // Aus allen Staffeln eines Verbands die Kette für eine gewählte Mannschaft bauen:
  // je Ebene die Staffel, in die man (geografisch) auf- bzw. absteigen würde, plus Nachbarstaffeln als Reserve.
  // st: [{ id, ebene, klasse, name, gebiet, teams: [{ id, verein_id, name, zone }] }]
  var SHORTN = { Verbandsliga: { Mittelrhein: 'Mittelrheinliga', Westfalen: 'Westfalenliga' } };
  function buildReg(verband, st, teamId) {
    var own = null, ownT = null;
    st = st.filter(function (x) { return x.teams && x.teams.length >= 4; });
    st.forEach(function (x) { x.teams.forEach(function (t) { if (t.id === teamId) { own = x; ownT = t; } }); });
    if (!own) throw new Error('Mannschaft nicht gefunden.');
    var clubs = function (x) { var o = {}; x.teams.forEach(function (t) { if (t.verein_id) o[t.verein_id] = 1; }); return o; };
    st.forEach(function (x) { x._c = clubs(x); });
    var ov = function (a, b) { var n = 0; for (var k in a) if (b[k]) n++; return n; };
    var isK = function (g) { return /^Kreis /.test(g || ''); };
    var byL = {}; st.forEach(function (x) { (byL[x.ebene] = byL[x.ebene] || []).push(x); });
    var levels = Object.keys(byL).map(Number).sort(function (a, b) { return a - b; }), lo = levels[0], hi = levels[levels.length - 1];
    // Heimatkreis: Kreis-Staffel mit eigener Zweitmannschaft, sonst eigene Staffel, sonst größte Überschneidung
    var town = clubTown(ownT.name);
    var kreis = isK(own.gebiet) ? own.gebiet : '';
    if (!kreis) { var kc = {}; st.forEach(function (x) { if (!isK(x.gebiet)) return; kc[x.gebiet] = (kc[x.gebiet] || 0) + (ownT.verein_id && x._c[ownT.verein_id] ? 100 : 0) + ov(own._c, x._c) + (town ? 30 * x.teams.filter(function (t) { return t.name.indexOf(town) >= 0; }).length : 0); }); var bk = 0; Object.keys(kc).forEach(function (g) { if (kc[g] > bk) { bk = kc[g]; kreis = g; } }); }
    var kClubs = {}; st.forEach(function (x) { if (x.gebiet === kreis) for (var k in x._c) kClubs[k] = 1; });
    // Region bei geteilten Ligen (z. B. NOFV-Oberliga Nord/Süd)
    var LPREF = { 'Thüringen': /Süd/, Sachsen: /Süd/, 'Sachsen-Anhalt': /Süd/, Berlin: /Nord/, Brandenburg: /Nord/, 'Mecklenburg-Vorpommern': /Nord/ };
    var chain = {}; chain[own.ebene] = own;
    var best = function (cands, sc) { var b = null, bs = -1; cands.forEach(function (x) { var v = sc(x); if (v > bs) { bs = v; b = x; } }); return b; };
    for (var l = own.ebene - 1; l >= lo; l--) { var below = chain[l + 1]; chain[l] = best(byL[l] || [], function (x) { return (x.gebiet === kreis ? 200 : 0) + 2 * ov(x._c, below._c) + ov(x._c, kClubs) + (l === 5 && LPREF[verband] && LPREF[verband].test(x.name) ? 500 : 0); }); if (!chain[l]) break; }
    var max = own.ebene;
    for (l = own.ebene + 1; l <= hi; l++) { var above = chain[l - 1]; var all = byL[l] || [], c = all.some(function (x) { return isK(x.gebiet); }) ? all.filter(function (x) { return x.gebiet === kreis; }) : all; if (!c.length) break; chain[l] = best(c, function (x) { return 2 * ov(x._c, above._c) + ov(x._c, kClubs) - (x.teams.length < 6 ? 50 : 0); }); max = l; }
    var reg = { verband: verband, kreis: kreis.replace(/^Kreis /, ''), team: { id: ownT.id, n: ownT.name }, lvl: own.ebene, max: max, lv: {}, teams: {}, pool: {} };
    for (l = Math.min(5, lo); l <= max; l++) {
      var x = chain[l]; if (!x) continue;
      var z = { up: 0, up2: 0, down: 0, down2: 0 }; x.teams.forEach(function (t) { if (z[t.zone] != null) z[t.zone]++; });
      var any = z.up + z.up2 + z.down + z.down2 > 0, sh = (SHORTN[x.klasse] || {})[verband] || x.klasse.replace(/ \(Verband\)$/, '').replace(/ (Niederrhein|Westfalen|Mittelrhein)$/, '');
      reg.lv[l] = { name: ligaName(x.name), short: sh, size: Math.max(6, x.teams.length) };
      if (any) { reg.lv[l].up = l === 5 ? Math.max(1, z.up) : z.up; reg.lv[l].upRel = z.up2; reg.lv[l].down = z.down; reg.lv[l].downRel = z.down2; }
      if (l === max) { reg.lv[l].down = 0; reg.lv[l].downRel = 0; }
      reg.teams[l] = x.teams.map(function (t) { return t.name; });
      var seen = {}; reg.teams[l].forEach(function (n) { seen[n] = 1; });
      var others = (byL[l] || []).filter(function (y) { return y !== x; }).sort(function (a, b) { return ((b.gebiet === kreis) - (a.gebiet === kreis)) || (ov(b._c, kClubs) - ov(a._c, kClubs)); });
      var pool = []; others.forEach(function (y) { y.teams.forEach(function (t) { if (pool.length < 40 && !seen[t.name]) { seen[t.name] = 1; pool.push(t.name); } }); });
      reg.pool[l] = pool;
    }
    st.forEach(function (x) { delete x._c; });
    return reg;
  }
  function buildWorldReg(S, D, reg) {
    S.world = { lv: {}, pool: {}, last: {} };
    for (var l = 1; l <= D.maxLvl; l++) {
      var base4 = {}; (D.teams[l] || []).forEach(function (t) { base4[t.n] = t; });
      var src = l <= 4 && !reg.teams[l] ? (D.teams[l] || []) : (reg.teams[l] || []).map(function (n) { return base4[n] || { n: n, b: null }; });
      var list = src.filter(function (t) { return t.n !== S.club; }).map(function (t) { var x = mkTeam(D, l, t); if (l >= 5 || MR_TOP.indexOf(t.n) >= 0) x.r = 1; return x; });
      var pool = (l <= 4 && !reg.teams[l] ? (D.pool[l] || []) : (reg.pool[l] || []).map(function (n) { return { n: n, b: null }; })).filter(function (t) { return t.n !== S.club; }).map(function (t) { var x = mkTeam(D, l, t); if (l >= 5) x.r = 1; return x; });
      S.world.pool[l] = pool;
      var need = D.lv[l].size - (l === S.lvl ? 1 : 0);
      list = list.slice(0, need);
      while (list.length < need) { var t = pool.length ? pool.splice(Math.floor(R() * pool.length), 1)[0] : (function () { var x = mkTeam(D, l, null); x.n = genTeamName(S); return x; })(); list.push(t); }
      if (l === S.lvl) list.push({ n: S.club, b: lvMid(D, l), s: lvMid(D, l), svw: true, r: 1 });
      S.world.lv[l] = list;
    }
  }
  function buildWorld(S, D) {
    var club = D.club.toLowerCase();
    S.world = { lv: {}, pool: {}, last: {} };
    for (var l = 1; l <= D.maxLvl; l++) {
      var list = (D.teams[l] || []).filter(function (t) { return t.n.toLowerCase().indexOf(club) !== 0; }).map(function (t) { var x = mkTeam(D, l, t); if (l >= 5 || MR_TOP.indexOf(t.n) >= 0) x.r = 1; return x; });
      var pool = (D.pool[l] || []).map(function (t) { var x = mkTeam(D, l, t); if (l >= 5) x.r = 1; return x; });
      S.world.pool[l] = pool;
      var need = D.lv[l].size - (l === S.lvl ? 1 : 0);
      list = list.slice(0, need);
      while (list.length < need) { var t = pool.length ? pool.splice(Math.floor(R() * pool.length), 1)[0] : (function () { var x = mkTeam(D, l, null); x.n = genTeamName(S); return x; })(); list.push(t); }
      if (l === S.lvl) list.push({ n: D.club, b: lvMid(D, l), s: lvMid(D, l), svw: true, r: 1 });
      S.world.lv[l] = list;
    }
  }
  function svwTeam(S) { return S.world.lv[S.lvl].filter(function (t) { return t.svw; })[0]; }

  function roundRobin(n) {
    var t = []; for (var i = 0; i < n; i++) t.push(i); if (n % 2) t.push(-1);
    var m = t.length, rounds = [];
    for (var r = 0; r < m - 1; r++) {
      var pairs = [];
      for (var k = 0; k < m / 2; k++) { var a = t[k], b = t[m - 1 - k]; if (a < 0 || b < 0) continue; pairs.push((r + k) % 2 === 0 ? [a, b] : [b, a]); }
      rounds.push(pairs); t.splice(1, 0, t.pop());
    }
    return rounds;
  }
  function weekdaysBetween(a, b, w, block) { var out = []; var d = a; while (dow(d) !== w) d = addDays(d, 1); while (d <= b) { if (!block || block.indexOf(d) < 0) out.push(d); d = addDays(d, 7); } return out; }
  function spread(list, n, extraDow) {
    if (list.length >= n) { if (n <= 1) return list.slice(0, n); var out = []; for (var i = 0; i < n; i++) out.push(list[Math.round(i * (list.length - 1) / (n - 1))]); return out; }
    var res = list.slice(); var i2 = 0;
    while (res.length < n && i2 < 60) { var base = list[(i2 * 3) % Math.max(1, list.length - 1)]; var mid = addDays(base, extraDow); if (res.indexOf(mid) < 0) res.push(mid); i2++; }
    return res.sort().slice(0, n);
  }
  function leagueDates(D, l, season, n) {
    var L = D.lv[l], pro = l <= 4, w = L.day;
    var s1 = pro ? (l === 4 ? '07-31' : l === 3 ? '08-07' : '08-21') : (l <= 6 ? '08-16' : '08-23');
    var e1 = pro ? '12-20' : '12-13';
    var s2 = l <= 2 ? '01-15' : l === 3 ? '01-17' : l === 4 ? '02-01' : l <= 7 ? '02-28' : '03-07';
    var e2 = l <= 3 ? '05-22' : l === 4 ? '05-16' : '06-07';
    var block = [sd(season, CUPS.dfb.dates[0])];
    var h = n / 2;
    var p1 = spread(weekdaysBetween(sd(season, s1), sd(season, e1), w, block), h, w === 6 ? -3 : -4);
    var p2 = spread(weekdaysBetween(sd(season, s2), sd(season, e2), w, block), h, w === 6 ? -3 : -4);
    return p1.concat(p2);
  }
  function makeFixtures(S, D) {
    var teams = S.world.lv[S.lvl]; var n = teams.length;
    var order = shuffle(teams.map(function (_, i) { return i; }));
    var rr = roundRobin(n); var dates = leagueDates(D, S.lvl, S.season, rr.length * 2);
    var fx = [];
    rr.forEach(function (pairs, r) { pairs.forEach(function (p) { fx.push({ md: r + 1, d: dates[r], h: order[p[0]], a: order[p[1]] }); }); });
    rr.forEach(function (pairs, r) { pairs.forEach(function (p) { fx.push({ md: rr.length + r + 1, d: dates[rr.length + r], h: order[p[1]], a: order[p[0]] }); }); });
    var si = -1; teams.forEach(function (t, i) { if (t.svw) si = i; });
    if (si >= 0) { var home = R() < 0.5; fx.filter(function (f) { return f.h === si || f.a === si; }).sort(function (a, b) { return a.md - b.md; }).forEach(function (f) { var isH = f.h === si; if (isH !== home) { var t = f.h; f.h = f.a; f.a = t; } home = !home; }); }
    S.fix = fx;
  }
  function table(S, teams, fix) {
    teams = teams || S.world.lv[S.lvl]; fix = fix || S.fix;
    var rows = teams.map(function (t, i) { return { i: i, n: t.n, svw: !!t.svw, sp: 0, s: 0, u: 0, nl: 0, tf: 0, ta: 0, pts: 0, form: [] }; });
    fix.forEach(function (f) {
      if (f.hg == null) return; var h = rows[f.h], a = rows[f.a];
      h.sp++; a.sp++; h.tf += f.hg; h.ta += f.ag; a.tf += f.ag; a.ta += f.hg;
      if (f.hg > f.ag) { h.s++; a.nl++; h.pts += 3; h.form.push('S'); a.form.push('N'); }
      else if (f.hg < f.ag) { a.s++; h.nl++; a.pts += 3; h.form.push('N'); a.form.push('S'); }
      else { h.u++; a.u++; h.pts++; a.pts++; h.form.push('U'); a.form.push('U'); }
    });
    rows.sort(function (x, y) { return y.pts - x.pts || (y.tf - y.ta) - (x.tf - x.ta) || y.tf - x.tf || x.n.localeCompare(y.n); });
    rows.forEach(function (r, k) { r.rank = k + 1; r.form = r.form.slice(-5); });
    return rows;
  }
  function svwRank(S) { var t = table(S); for (var i = 0; i < t.length; i++) if (t[i].svw) return t[i]; return null; }
  function rating(S, D, l, t) {
    var list = S.world.lv[l].slice().sort(function (a, b) { return b.s - a.s; }); var r = list.indexOf(t) + 1; var L = D.lv[l]; var n = list.length;
    if (r <= Math.max(1, L.up)) return 'Aufstiegsfavorit';
    if (r <= Math.ceil(n / 3)) return 'Oberes Drittel';
    if (r > n - Math.max(1, L.down) - 1) return 'Abstiegskandidat';
    return 'Klassenerhalt';
  }

  // ============================================================ Neues Spiel
  function newGame(D, o) {
    o = o || {};
    var mgrName = o.mgr || 'Manager', startDate = o.date || '2026-07-01';
    var REG = o.reg && o.reg.team && o.reg.lv ? o.reg : null;
    if (REG) { var sReg = { reg: { key: REG.verband + ':' + REG.team.id, verband: REG.verband, kreis: REG.kreis || '', team: REG.team.id, max: REG.max, lvl0: REG.lvl, lv: REG.lv } }; sReg.club = REG.team.n; D = dOf(sReg, D); }
    var season = seasonOf(startDate);
    var L0 = D.lv[D.startLvl];
    var S = { posV: 2,
      v: 2, season0: seasonOf(startDate), pseed: Math.floor(R() * 1e6), mgr: mgrName, full: o.full || mgrName, club: D.club, reg: REG ? { key: REG.verband + ':' + REG.team.id, verband: REG.verband, kreis: REG.kreis || '', team: REG.team.id, max: REG.max, lvl0: REG.lvl, lv: REG.lv } : undefined, start: season + '-07-01', date: season + '-07-01', season: season, lvl: D.startLvl, mlvl: Math.max(o.mlvl || 1, levelOf(o.xp || 0).lvl),
      cash: 0, tb: 0, sav: 0, alloc: { cash: 70, tb: 25, sav: 5 }, fans: rint(36, 50), board: 70, moral: 65, lvFans: 1, lvBoard: 1, lvMoral: 1, fanbase: 0,
      goal: null, ticket: L0.ticket, players: [], youth: [], nextPid: 1, lineup: { form: '4-4-2', xi: null }, train: { int: 'normal', focus: 'ausgewogen', fp: [] },
      camp: null, chem: null, built: {}, building: [], pitch: { type: 'kunst', age: rnd(2, 7) + 0.3, life: 0 },
      sponsors: [], tmp: { zus: null, sponsors: [] }, betrieb: 0, fix: [], cups: [], qual: {}, tests: [], market: { list: [], loans: [] },
      inbox: [], pending: [], mails: [], mq: [], watch: [], nego: [], dayEv: [], spons: 60, live: null, feed: [], achv: [], fin: { cur: null, hist: [] }, hist: [], evCd: {}, fired: false, days: 0, nextId: 1, reports: [], lastRank: null, peak: D.startLvl,
      xp: o.xp || 0, xpGame: 0, ptsTotal: 0, wins: 0, captain: null, pen: null, loan: null, stadion: 'Waldstadion', jersey: null, skc: 3, skt: {}, skcLog: [['', 'Start in ein neues Spiel', 3]]
    };
    S.pitch.life = Math.max(rnd(15, 20), S.pitch.age + rnd(2, 4));
    var reserve = Math.max(D.reserve, nice((L0.budget || 0) * 0.06)) * ((S.mlvl >= featLvl('legende')) ? 1.15 : 1);
    bookPot(S, 'Rücklagen', reserve, 'cash');
    if (REG) { buildWorldReg(S, D, REG); S.stadion = homeStadion(S); } else buildWorld(S, D);
    // Kader je Spiel unterschiedlich: zufällige Grundformation, dazu passende Positionen + Ersatz; jede Mannschaftsgruppe ist immer ausreichend besetzt
    var F0 = pick(['4-4-2', '4-3-3', '4-2-3-1', '4-1-4-1', '3-5-2', '4-4-2 Raute', '5-3-2', '3-4-3']); S.lineup.form = F0;
    var dps = FORMS[F0].slice(); dps.push(pick(['TW', 'TW', 'TW'])); if (R() < 0.6) dps.push('TW');
    for (var bi = 0, nb = rint(3, 4); bi < nb; bi++) dps.push(pick(['IV', 'IV', 'RV', 'LV']));
    for (var bm = 0, nm = rint(3, 4); bm < nm; bm++) dps.push(pick(['ZM', 'ZM', 'DM', 'OM', 'LM', 'RM']));
    for (var bs = 0, ns = rint(2, 3); bs < ns; bs++) dps.push(pick(['ST', 'ST', 'LA', 'RA']));
    var cntG = function (g) { return dps.filter(function (d) { return GRP[d] === g; }).length; }, minG = { TW: 2, AB: 7, MF: 7, ST: 4 }, fillG = { TW: 'TW', AB: 'IV', MF: 'ZM', ST: 'ST' };
    Object.keys(minG).forEach(function (g) { while (cntG(g) < minG[g]) dps.push(fillG[g]); });
    dps.forEach(function (dp) { S.players.push(newPlayer(S, D, { lvl: S.lvl, pos: GRP[dp], dp: dp })); });
    var target = L0.hi - (L0.hi - L0.lo) * 0.18 + rnd(0, 1.2);
    var xa = xiAvg(S, D); var shift = target - xa;
    S.players.forEach(function (p) { p.str = clamp(p.str + shift, 1, 99); p.pot = clamp(p.pot + shift, p.str, 99); p.sal = salDemand(p, S.lvl); p.ce = season + 1 + rint(0, 2); });
    var field = S.players.filter(function (p) { return p.pos !== 'TW'; }).sort(function (a, b) { return b.str - a.str; });
    S.players.forEach(function (p) { if (p.tal > 3) { p.tal = 3; p.pot = potOf(p.str, p.age, 3); } });
    var star = field[0]; if (star) { star.str = Math.min(97, Math.max(star.str + 3, L0.hi + rint(5, 9))); star.tal = pick([4, 4.5]); star.str = Math.min(97, Math.max(star.str, L0.hi + rint(3, 6))); star.pot = Math.max(star.pot, star.str + 9); star.age = rint(24, 27); star.sal = salDemand(star, S.lvl); star.ce = season + 2; }
    if (o.self && S.mlvl >= featLvl('spielertrainer')) {
    var me = newPlayer(S, D, { name: S.full, dp: GRP[o.self.pos] && o.self.pos !== 'AB' ? o.self.pos : 'ST', age: clamp(+o.self.age || 24, 16, 45), tal: 5, str: Math.min(99, L0.hi + 12) });
      me.tal = 5; me.pot = 99; me.self = true; me.sal = 0; me.ce = season + 10; S.players.push(me); selfBoost(S, D);
    }
    for (var y = 0; y < 3; y++) S.youth.push(newYouth(S, D, false));
    var yk = S.youth[0]; yk.age = 14; yk.tal = pick([4, 4.5]); yk.str = Math.max(1, yk.str - 3); yk.pot = potOf(yk.str, yk.age, yk.tal);
    svwTeam(S).s = Math.round(xiAvg(S, D) * 10) / 10; svwTeam(S).b = svwTeam(S).s; S.follow = followStart(S); S.follow0 = S.follow; if (!S.kit) kitOffers(S, D, 'kit');
    S.members = rint(420, 870); S.fanbase = S.members; S.pressPending = true; S.prep = { phase: 'summer', need: true };
    balanceSides(S.players); S.salt = rint(1, 999999); startSeason(S, D, true); rivalsFix(S, D); S.youth.forEach(function (y) { y.s0 = y.str; });
    msg(S, 'verein', 'Willkommen, ' + S.full + '! Du bist neuer Manager beim ' + D.club + ' in der ' + D.lv[S.lvl].name + '.');
    for (var k = 0; k < 3; k++) makePost(S, D, null);
    maybeMail(S, D, true);
    return S;
  }
  /* ============================================================ Hauptsponsor */
  var SP_FIRMS = ['Autohaus Drachenfels', 'Bäckerei Ländchen', 'Elektro Berkum', 'Wachtberger Bau GmbH', 'Pflegedienst Siebengebirge', 'Dachdecker Meyer & Söhne', 'IT-Service Rheinblick', 'Getränke Kessel', 'Sanitär Adendorf', 'Brauhaus Villiprott', 'Steuerkanzlei Lenz', 'Fahrschule Pech', 'Gartenbau Grünland', 'Optik Klarsicht', 'Immobilien Rheinhöhe', 'Physio Vital Wachtberg', 'Landmetzgerei Fritzdorf', 'Solartechnik Sonnhang'];
  function spOffers(S, D, worse, keepFirm) {
    var base = S.spBase || nice(D.lv[S.lvl].budget * 0.3); var mf = (1 + ((S.mlvl || 1) - 1) * 0.015) * followF(S); var used = {}; if (S.mainSp) used[S.mainSp.firm] = 1;
    var list = []; if (keepFirm) { list.push({ firm: keepFirm, amt: nice(base * mf * rnd(0.9, 1.2)), yrs: rint(1, 3), renew: true, nego: 0 }); used[keepFirm] = 1; }
    var want = 3;
    while (list.length < want) { var f = rxL(S, pick(SP_FIRMS)); if (used[f]) continue; used[f] = 1; list.push({ firm: f, amt: nice(base * mf * rnd(0.82, 1.15) * (worse ? rnd(0.85, 0.97) : 1)), yrs: rint(1, 3), nego: 0 }); }
    S.spOffers = list; S.spNeed = true;
  }
  function spAccept(S, D, o, yrs) {
    yrs = clamp(Math.round(+yrs || o.yrs), 1, 3); var amt = nice(o.amt * (yrs === o.yrs ? 1 : yrs < o.yrs ? 0.96 : 0.98));
    var renew = S.mainSp && S.mainSp.to === S.season && !S.needAlloc && mon(S.date) >= 3 && mon(S.date) <= 6;
    var from = renew ? S.season + 1 : S.season;
    S.mainSp = { firm: o.firm, amt: amt, from: from, to: from + yrs - 1, since: S.date };
    S.spOffers = null; S.spNeed = false;
    if (from === S.season) { if (S.needAlloc && S.budgetHold) S.budgetHold.push(['Hauptsponsor ' + o.firm, amt]); else book(S, 'Hauptsponsor ' + o.firm, amt); }
    return o.firm + ': ' + euro(amt) + ' pro Saison bis ' + (from + yrs) + ' (' + yrs + (yrs === 1 ? ' Jahr' : ' Jahre') + ')';
  }
  /* ============================================================ Ausstatter (Trikots) & Bälle */
  // Fiktive Ausstatter (Schlüssel bleiben für alte Spielstände gleich)
  var KIT_BRANDS = { adidas: 'Kickwerk', nb: 'Nordline', hummel: 'Fieldmark', reebok: 'Avantis', asics: 'Kairo Sport', ua: 'Stratos', puma: 'Volt', erima: 'Teamhaus', nike: 'Swiftline' };
  var BALL_BRANDS = { derbystar: 'Sternball', erima: 'Teamhaus', adidas: 'Kickwerk', puma: 'Volt', uhlsport: 'Torwerk' };
  function negoList(S, k) { return k === 'sp' ? S.spOffers : k === 'ps' ? S.psOffers : k === 'pv' ? S.pvOffers : (k === 'kit' || k === 'ball') ? S[k + 'Offers'] : null; }
  var FANACT = {
    autogramm: ['Autogrammstunde', 'Nach dem Training schreiben die Spieler Autogramme', 0, 14, { fans: 2 }],
    training: ['Öffentliches Training', 'Fans dürfen beim Abschlusstraining zuschauen', 0, 14, { fans: 2, moral: 1 }],
    umfrage: ['Fan-Umfrage', 'Die Fans stimmen über das Ausweichtrikot ab', 0, 30, { fans: 1, fanbase: 1 }],
    fanclub: ['Fanclub-Besuch', 'Du besuchst mit zwei Spielern den Fanclub', 100, 30, { fans: 4 }],
    stammtisch: ['Fan-Stammtisch', 'Der Trainer beantwortet im Vereinsheim Fragen der Fans', 150, 21, { fans: 3, moral: 1 }],
    social: ['Social-Media-Gewinnspiel', 'Trikots und VIP-Karten werden verlost', 250, 21, { fans: 3, fanbase: 2 }],
    freibier: ['Freibier-Runde', 'Eine Runde aufs Haus nach dem nächsten Heimspiel', 400, 30, { fans: 5 }],
    bus: ['Fanbus Auswärtsspiel', 'Der Verein bezahlt den Bus zum nächsten Auswärtsspiel', 500, 45, { fans: 5, moral: 2 }],
    schal: ['Schal-Aktion', 'Jedes Mitglied bekommt einen Vereinsschal geschenkt', 600, 120, { fans: 4, fanbase: 2 }],
    camp: ['Kinder-Fußballcamp', 'Ferien-Camp für die Kids aus der Region', 900, 90, { fans: 6, spons: 2, fanbase: 3 }]
  };
  var PS_FIRMS = ['Rheinblick Optik', 'Siebengebirgs-Brauerei', 'Bonner Autohaus Kessler', 'Ländchen Immobilien', 'FitWerk Bad Godesberg', 'Drachenfels Uhren', 'Kurfürsten Bank', 'Godesburg Sportswear', 'Meckenheimer Apfelsaft', 'Rhein-Sieg Versicherung', 'Voreifel Energie', 'Bonner Kaffeerösterei'];
  function psOffers(S, D) { var used = {}, list = []; var base = (1500 + (S.mlvl || 1) * 450 + (11 - S.lvl) * 1100) * langF(S) * qualF(S) * (0.8 + mgrRep(S, D) / 250); while (list.length < 3) { var fm = rxL(S, pick(PS_FIRMS)); if (used[fm]) continue; used[fm] = 1; list.push({ firm: fm, amt: nice(base * rnd(0.8, 1.25)), yrs: rint(1, 3), nego: 0, mood: 100 }); } S.psOffers = list; }
  var YCAMPS = [['es', 'Spanien', 'Europa', 660000, 240, 4.5], ['pt', 'Portugal', 'Europa', 540000, 220, 3.5], ['nl', 'Niederlande', 'Europa', 480000, 210, 3], ['fr', 'Frankreich', 'Europa', 720000, 250, 5], ['br', 'Brasilien', 'Südamerika', 540000, 420, 3.5], ['ar', 'Argentinien', 'Südamerika', 600000, 400, 4], ['uy', 'Uruguay', 'Südamerika', 480000, 360, 3], ['co', 'Kolumbien', 'Südamerika', 420000, 360, 2.5], ['gh', 'Ghana', 'Afrika', 360000, 380, 2], ['sn', 'Senegal', 'Afrika', 360000, 380, 2], ['ng', 'Nigeria', 'Afrika', 240000, 400, 1], ['ci', 'Elfenbeinküste', 'Afrika', 420000, 390, 2.5], ['jp', 'Japan', 'Asien', 540000, 450, 3.5], ['kr', 'Südkorea', 'Asien', 540000, 430, 3.5], ['us', 'USA', 'Nordamerika', 480000, 480, 3], ['mx', 'Mexiko', 'Nordamerika', 420000, 400, 2.5]];
  function ycMonthly(S, D) { var built = YCAMPS.filter(function (c) { return S.yc[c[0]] && (S.yc[c[0]] <= S.date || ((S.ycL || {})[c[0]] || 1) > 1); }); if (!built.length) return; var lvs = built.reduce(function (a, c) { return a + ((S.ycL || {})[c[0]] || 1); }, 0); var n = Math.min(10, rint(3, 5) + lvs - 1 + rint(0, 2)); S.ycPool = []; for (var i = 0; i < n; i++) { var c = pick(built), y = newYouth(S, D, false); y.age = rint(15, 18); var cl0 = (S.ycL || {})[c[0]] || 1, cq = (c[5] - 1) / 4 * 1.6 - 0.3; y.tal = Math.max(1.5, Math.min(5, Math.round((rnd(1.5, 4) + cq * 0.6 + (cl0 - 1) * 0.35) * 2) / 2)); y.str = Math.max(5, Math.round((y.str + rnd(-3, 4)) * 10) / 10); y.pot = potOf(y.str, y.age, y.tal); y.from = c[1]; y.fee = nice(1500 + y.tal * y.tal * 900); S.ycPool.push(y); } msg(S, 'jugend', '🌍 Internationale Camps: ' + n + ' neue Talente stehen zur Verpflichtung bereit.'); }
  function pvPropGen(S, D) { var P = S.pv; if (!P || P.army || P.to < S.season) { S.pvProp = null; return; } var base = xiAvg(S, D), L = [];
    for (var i = 0; i < Math.max(3, P.loans * 2); i++) { var np = newPlayer(S, D, { str: Math.round(base * rnd(0.95, 1.12) * 10) / 10, age: rint(18, 22) }); np.fit = 80; np.fitCap = 85; np.loan = { from: P.club, pv: true, buy: nice(Math.max(500, mw(np) * rnd(0.8, 1.15))) }; np.sal = 0; np.ce = S.season + 1; var lgp = rint(8, 30), ofs = /ST|RA|LA/.test(np.dp) ? 0.32 : /OM|RM|LM|ZM/.test(np.dp) ? 0.16 : /RV|LV|IV|DM/.test(np.dp) ? 0.05 : 0; np.lastS = { gp: lgp, avg: Math.round(rnd(5.2, 8.4) * 10) / 10, g: Math.round(lgp * ofs * rnd(0.4, 1.4)), a: Math.round(lgp * (ofs ? 0.12 : 0.04) * rnd(0.3, 1.6)), hist: (function () { var hh = [], v = np.str; for (var q = 0; q < 4; q++) { hh.unshift(Math.round(v * 10) / 10); v -= rnd(-0.6, 2.2); } return hh; })() }; L.push({ p: np, taken: false }); }
    S.pvProp = L; S.pvPropWk = addDays(S.date, -((dow(S.date) + 6) % 7)); }
  function pvBuyLeft(S) { var P = S.pv; if (!P || P.army) return 0; var u = P.buyUsed && P.buyUsed.season === S.season ? P.buyUsed.n : 0; return Math.max(0, (P.buy || 0) - u); }
  function pvTier(S) { var m = S.mlvl || 1; return m >= 15 ? 1 : m >= 12 ? 2 : m >= 8 ? 3 : m >= 6 ? 4 : 5; }
  function pvOffers(S, D) {
    var army = S.lvl <= 3, list = [], used = {}, seen = S.pvSeen || []; if (S.pv) used[S.pv.club] = 1;
    var tiers = army ? [4, 5, 6, 7] : [pvTier(S)]; var tries = 0;
    while (list.length < 3 && tries++ < 200) {
      var tl = pick(tiers); var pool = ((S.world.lv[tl]) || []).filter(function (t) { return !t.svw && !used[t.n]; }); if (!pool.length) continue;
      var tm = pick(pool); if (seen.indexOf(tm.n) >= 0 && tries < 120) continue; used[tm.n] = 1;
      var rb = R(); list.push({ club: tm.n, lvl: tl, yrs: rint(1, 3), loans: R() < 0.55 ? 1 : R() < 0.75 ? 2 : 3, buy: rb < 0.7 ? 0 : rb < 0.95 ? 1 : 2, nego: 0, mood: 100, army: army });
    }
    list.forEach(function (o) { o.buy = Math.min(o.buy, o.loans); }); S.pvSeen = seen.concat(list.map(function (o) { return o.club; })).slice(-15); S.pvOffers = list;
  }
  function pvAccept(S, D, o) {
    S.pv = { club: o.club, lvl: o.lvl, from: S.season, to: S.season + o.yrs - 1, loans: o.loans, buy: o.buy, army: o.army }; S.pvOffers = null; S.pvGiven = null; pvLoans(S, D);
    return o.club + ' ist euer Partnerverein bis 06/' + (S.pv.to + 1) + (o.army ? ' – ihr seid die Loan Army und könnt ' + o.loans + ' Spieler pro Saison dorthin verleihen.' : ' – ' + o.loans + ' Leihspieler pro Saison, ' + o.buy + ' mit Kaufoption.');
  }
  function pvLoans(S, D) {
    var P = S.pv; if (!P || P.army || P.to < S.season) return; pvPropGen(S, D); if (S.pvGiven === S.season) return; S.pvGiven = S.season; return;
    var base = xiAvg(S, D), names = [];
    for (var i = 0; i < P.loans; i++) {
      var np = newPlayer(S, D, { str: Math.round(base * rnd(0.97, 1.12) * 10) / 10, age: rint(18, 22) }); np.fit = 80; np.fitCap = 85;
      np.loan = { from: P.club, pv: true, buy: nice(Math.max(500, mw(np) * rnd(0.8, 1.15))) }; np.sal = 0; np.ce = S.season + 1; S.players.push(np); names.push(np.n + ' (' + np.dp + ', ' + Math.round(np.str) + (np.loan.buy ? ', Kaufoption' : '') + ')');
    }
    if (names.length) infoMail(S, P.club, 'Leihspieler vom Partnerverein', 'Wie vereinbart schicken wir euch für diese Saison: ' + names.join(', ') + '. Ihr Gehalt zahlen wir.' + (P.buy ? ' Spieler mit Kaufoption könnt ihr unter Verein → Partnerverein fest verpflichten.' : ''), 'info');
  }
  var UTIL = { strom: ['⚡', 'Stromanbieter', ['Rhein-Sieg Energie', 'Drachenfels Strom', 'Siebengebirgs-Werke', 'Ahrtal Power']], wasser: ['💧', 'Wasseranbieter', ['Quellwerk Wachtberg', 'Rheinquelle Wasser', 'Wasserverband Ville']], komm: ['📶', 'Kommunikationsanbieter', ['Godesnet Glasfaser', 'RheinFunk Telekom', 'Siebennet Mobil']], fuhr: ['🚐', 'Fuhrparkpartner', ['Autohaus Berkum', 'Drachenfels Mobil', 'Villiper Autoservice']], gym: ['🏋️', 'Gym-Partner', ['FitWerk Wachtberg', 'Siebengebirge Athletics', 'PowerHouse Meckenheim']], food: ['🥗', 'Food-Partner', ['Ländchen Catering', 'Metzgerei Hoffmann', 'Bio-Hof Villip']], werb: ['📣', 'Werbepartner', ['Godesberger Druckerei', 'Rhein-Sieg Werbetechnik', 'Plakat & Banner Bonn']] };
  function agCheck(S, D) { var H = (S.hist || []).slice(-3), why = []; if (S.lvl > 4) why.push('mind. Regionalliga'); if (mlv(S) < 15) why.push('Manager-Level 15'); if (H.length < 3 || H.some(function (h) { return !(h.cash > 0); })) why.push('3 Jahre in Folge positive Jahresbilanz'); return why; }
  function agBase(S, D) { return nice(D.lv[S.lvl].budget * 0.022 * (1 + (S.fans - 50) / 200)); }
  function bondWeekly(S, D) { if (S.bond || S.bondOffer || S.fans < 60 || R() > 0.015) return; var avl = Math.max(0, S.cash) + Math.max(0, S.tb || 0); if (avl < 5000) return; S.bondOffer = { amt: nice(avl * rnd(0.02, 0.15)), rate: Math.round(rnd(1.5, 3.5) * 10) / 10, months: rint(12, 24), good: true, exp: addDays(S.date, 14) }; msg(S, 'finanzen', '📜 Eine Fan-Initiative bietet eine Anleihe zu Top-Konditionen an (' + S.bondOffer.rate + ' % Zinsen). Siehe Finanzen → Budget.'); }
  function utilWeekly(S, D) {
    if (S.bondOffer && S.bondOffer.exp && S.bondOffer.exp < S.date) S.bondOffer = null; bondWeekly(S, D);
    if (S.season - (S.inhS == null ? -9 : S.inhS) >= 3 && R() < 0.006) { var P9 = privInit(S), rels = ['Großonkel Heinrich', 'Großtante Margarete', 'Onkel Friedhelm aus Bielefeld', 'Tante Hildegard aus Kanada', 'ein entfernter Cousin aus Australien', 'Großcousine Ilse', 'Onkel Walter aus Bayern'], rl = pick(rels), ia = nice(rnd(2000, 50000)); if (R() < 0.6) ia = nice(rnd(2000, 15000)); P9.cash += ia; P9.log.unshift([S.date, 'Erbschaft (' + rl + ')', ia]); S.inhS = S.season; S.inhPop = { amt: ia, rel: rl }; msg(S, 'privat', '🕊️ Traurige Nachricht: ' + rl + ' ist verstorben und hat dir ' + euro(ia) + ' vererbt.'); }
    S.util = S.util || {}; S.utilOff = (S.utilOff || []).filter(function (o) { return o.exp > S.date; });
    Object.keys(UTIL).forEach(function (k) {
      var c = S.util[k]; if (c && c.to < S.season) { delete S.util[k]; c = null; }
      if (c || S.utilOff.some(function (o) { return o.k === k; }) || R() > 0.07) return;
      var nm = rxL(S, UTIL[k][2][Math.floor(R() * UTIL[k][2].length)]), base = D.lv[S.lvl].budget * (k === 'fuhr' ? 0.0045 : 0.003) * followF(S) * (1 + (mktVal(S) - 40) / 200);
      S.utilOff.push({ k: k, firm: nm, m: Math.max(20, Math.round(base * rnd(0.8, 1.2) / 10) * 10), yrs: rint(1, 3), exp: addDays(S.date, 21) });
    });
  }
  function kitOffers(S, D, kind, worse) {
    var B = kind === 'ball' ? BALL_BRANDS : KIT_BRANDS, keys = Object.keys(B).slice(); var cur = S[kind];
    var base = nice(D.lv[S.lvl].budget * (kind === 'ball' ? 0.035 : 0.1)) * (1 + ((S.mlvl || 1) - 1) * 0.015) * followF(S); var list = [];
    var want = 3;
    while (list.length < want && keys.length) { var k = keys.splice(Math.floor(R() * keys.length), 1)[0]; if (cur && cur.brand === k && !worse) continue; list.push({ brand: k, name: B[k], amt: nice(base * rnd(0.8, 1.2) * (worse ? rnd(0.85, 0.97) : 1)), yrs: rint(1, 3), nego: 0 }); }
    S[kind + 'Offers'] = list; S[kind + 'Need'] = kind === 'kit';
  }
  function kitAccept(S, D, kind, o, yrs) {
    yrs = clamp(Math.round(+yrs || o.yrs), 1, 3); var amt = nice(o.amt * (yrs === o.yrs ? 1 : 0.97));
    S[kind] = { brand: o.brand, name: o.name, amt: amt, from: S.season, to: S.season + yrs - 1, since: S.date }; S[kind + 'Offers'] = null; S[kind + 'Need'] = false;
    var lbl = (kind === 'ball' ? 'Ballpartner ' : 'Ausstatter ') + o.name; if (S.needAlloc && S.budgetHold) S.budgetHold.push([lbl, amt]); else book(S, lbl, amt);
    return o.name + ': ' + euro(amt) + ' pro Saison bis ' + (S.season + yrs) + ' (' + yrs + (yrs === 1 ? ' Jahr' : ' Jahre') + ')';
  }
  /* Startstärken: Oberdrees & Rheinsüd leicht stärker, MSV & Fortuna etwa gleich, Rest darunter */
  function rivalsFix(S, D) {
    var sv = xiAvg(S, D); var T = S.world.lv[S.lvl], second = R() < 0.5, cand = T.filter(function (t) { return !t.svw && /Oberdrees|Rheinsüd/i.test(t.n); }), top = second ? (cand.length ? pick(cand) : T.filter(function (t) { return !t.svw; }).sort(function (a, b) { return b.s - a.s; })[0]) : null;
    T.forEach(function (t) {
      if (t.svw) { t.s = Math.round(sv * 10) / 10; t.b = t.s; return; } var v = null;
      if (t === top) v = sv + rnd(0.3, 1.2); else if (/Oberdrees|Rheinsüd|Marokkan|Fortuna Bonn/i.test(t.n)) v = sv - rnd(0.2, 1.1); else if (t.s > sv - 0.4) v = sv - rnd(0.6, 2.5);
      if (v != null) { t.s = Math.round(v * 10) / 10; t.b = t.s; }
    });
  }
  function newYouth(S, D, bonus) {
    var e = eff(S, D); var lv = D.lv[Math.min(D.maxLvl, S.lvl + 1)];
    var ref = S.players && S.players.length ? xiAvg(S, D) : lvMid(D, S.lvl); var cool = R() < 0.28 + (e.youthq || 0) * 0.03;
    var p = newPlayer(S, D, { age: rint(15, 18), str: clamp((cool ? ref - rnd(0, 4.5) : ref - rnd(6, 15)) + (e.youthq || 0) * 0.5, 1, 90), talBonus: bonus || e.tal > 0 || e.youthq >= 4, pos: pick(['TW', 'AB', 'AB', 'MF', 'MF', 'MF', 'ST', 'ST']) });
    p.tal = cool ? talRare(pick([3, 3.5, 3.5, 4, 4, 4.5, 5])) : clamp(pick([1, 1.5, 2, 2, 2.5, 3, 3.5]) + (e.tal > 0 && R() < 0.3 ? 1 : 0), 1, 5);
    p.pot = potOf(p.str, p.age, p.tal); p.youth = true; p.bday = ('0' + rint(1, 12)).slice(-2) + '-' + ('0' + rint(1, 28)).slice(-2);
    p.s0 = p.str; return p;
  }
  function msg(S, k, t) { S.inbox.unshift({ d: S.date, k: k, t: rx(S, t) }); if (S.inbox.length > 150) S.inbox.length = 150; }
  var TBKEYS = { 'Ablösezahlungen': 1, 'Leihgebühren': 1, 'Abfindungen': 1, 'Transfererlöse': 1, 'Leiheinnahmen': 1 };
  function finRec(S, key, amount) {
    var m = S.date.slice(0, 7);
    if (!S.fin.cur || S.fin.cur.m !== m) { if (S.fin.cur) { S.fin.hist.push(S.fin.cur); if (S.fin.hist.length > 24) S.fin.hist.shift(); } S.fin.cur = { m: m, inn: {}, out: {} }; }
    var o = amount >= 0 ? S.fin.cur.inn : S.fin.cur.out; o[key] = (o[key] || 0) + Math.abs(amount);
  }
  function bookPot(S, key, amount, pot) { finRec(S, key, amount); S[pot] += amount; }
  function book(S, key, amount) {
    if (!amount) return;
    if (S.skt) { // Fähigkeitsbaum wirkt direkt auf Buchungen
      if (amount > 0 && key === 'Transfererlöse') amount = Math.round(amount * (1 + skv(S, 'sell')));
      else if (amount > 0 && (key === 'Pokalprämien' || key === 'Meisterprämie' || key === 'TV-Gelder')) amount = Math.round(amount * (1 + skv(S, 'prize')));
      else if (amount > 0 && key === 'Merchandise & Trikots') amount = Math.round(amount * (1 + skv(S, 'merch')));
      else if (amount < 0 && /^(Investitionen|Stadion: \+|Camp-Ausbau|Med\. Abteilung: )/.test(key)) amount = Math.round(amount * (1 - skv(S, 'build')));
      else if (amount < 0 && key === 'Gehälter') amount = Math.round(amount * (1 - skv(S, 'sal')));
      else if (amount < 0 && key === 'Ablösezahlungen') { if (skv(S, 'tfM') && S.tfMs !== S.season) { S.tfMs = S.season; msg(S, 'transfer', '🎩 Transfercoup: Diesmal keine Ablöse – ' + euro(-amount) + ' gespart!'); return; } amount = Math.round(amount * (1 - skv(S, 'fee'))); }
    }
    if (TBKEYS[key]) return bookPot(S, key, amount, 'tb');
    if (amount < 0) return bookPot(S, key, amount, 'cash');
    finRec(S, key, amount);
    var A = S.alloc; S.cash += amount * A.cash / 100; S.tb += amount * A.tb / 100; S.sav += amount * A.sav / 100;
  }
  function wealth(S) { return S.cash + S.tb + S.sav; }
  function checkBars(S) {
    if (S.fans >= 100) { S.lvFans++; S.fanbase = Math.round(S.fanbase * 1.08 + 10); S.fans = 65; xp(S, 15); msg(S, 'verein', '📣 Fan-Stufe ' + S.lvFans + '! Die Fanbasis wächst auf ' + S.fanbase.toLocaleString('de-DE') + ' Fans.'); }
    if (S.board >= 100) { S.lvBoard++; S.board = 65; xp(S, 15); msg(S, 'verein', '🤝 Vorstands-Stufe ' + S.lvBoard + '! Der Vorstand vertraut dir – das Saisonbudget steigt um weitere 3 %.'); }
    if (S.moral >= 100) { S.lvMoral++; S.moral = 70; xp(S, 15); msg(S, 'verein', '💪 Moral-Stufe ' + S.lvMoral + '! Das Team wächst zusammen (dauerhaft stärker).'); }
  }
  function pend(S, o) { if (S.reg) { if (o.title) o.title = rx(S, o.title); if (o.text) o.text = rx(S, o.text); } o.id = S.nextId++; S.pending.push(o); return o; }
  function moneyScale(S, D) { var b7 = (D.lv[7] && D.lv[7].budget) || 30000; return Math.pow(Math.max(1, D.lv[S.lvl].budget) / b7, 0.85); }

  // ============================================================ Saisonstart / -ende
  // Spielertrainer: immer mit Abstand der Beste der Liga (5 Sterne, wächst mit jeder Liga mit)
  function selfBoost(S, D) { var L = D.lv[S.lvl]; if (!L) return; S.players.forEach(function (p) { if (!p.self) return; var best = Math.max.apply(null, S.players.filter(function (q) { return !q.self; }).map(function (q) { return q.str; }).concat([L.hi])); p.str = Math.min(99, Math.max(p.str, best + 8, L.hi + 10)); p.tal = 5; p.pot = 99; if (p.ce < S.season + 1) p.ce = S.season + 10; }); }
  function startSeason(S, D, first) { selfBoost(S, D); if (!first) { ownSeason(S, D); try { ytAge(S, D); } catch (ya) { } }
    if (S.expLvl != null && S.lvl !== S.expLvl) { var dl = S.expLvl - S.lvl; S.players.forEach(function (p) { p.exAdj = clamp((p.exAdj || 0) - dl * 1.2, -3, 0); }); if (dl > 0) msg(S, 'kader', '🎓 Neue Liga, neue Gegner: Die Erfahrung deiner Spieler zählt hier erst mal weniger – mit jedem Spiel wächst sie wieder.'); } S.expLvl = S.lvl;
    if (!first && S.skt) { if (skv(S, 'trM')) { try { var wy = newYouth(S, D, false); wy.tal = 5; wy.pot = Math.max(wy.pot || 0, wy.str + 25); if (youthAdd(S, wy)) msg(S, 'jugend', '🌟 Wunderkind: ' + wy.n + ' (5 Sterne) wechselt in deine Academy!'); } catch (e0) {} } var jkS = Math.floor(skv(S, 'jk')); if (jkS) { S.jokers = (S.jokers || 0) + jkS; msg(S, 'erfolg', '🃏 Fähigkeiten: +' + jkS + ' Joker zum Saisonstart.'); } }
    if (!first) kidsToAcademy(S, D);
    var prevS = S.season; S.season = seasonOf(S.date);
    var L = D.lv[S.lvl];
    if (!first) { S.players.forEach(function (p) { if (!p.gp && !p.mins) return; p.hist = (p.hist || []).filter(function (h) { return h.s !== prevS; }); p.hist.push({ s: prevS, c: p.loan && p.loan.to ? p.loan.to : S.club, gp: p.gp, g: p.g, a: p.a, avg: p.gp ? Math.round(p.gr / p.gp * 10) / 10 : null }); if (p.hist.length > 8) p.hist = p.hist.slice(-8); });
      S.players.forEach(function (p) { p.age++; }); S.youth.forEach(function (y) { y.s0 = y.str; }); S.inbox = []; S.mails = (S.mails || []).filter(function (m) { return !m.answered && !m.info; });
    }
    S.players.forEach(function (p) { p.fitCap = 80; p.fit = Math.min(p.fit, rnd(60, 72)); }); try { carEnsure(S, D); } catch (ce) { }
    S.players.forEach(function (p) { p.mins = 0; p.g = 0; p.a = 0; p.gp = 0; p.gr = 0; p.lg = 0; p.la = 0; p.lgp = 0; p.lgr = 0; p.lkg = 0; p.lga = 0; p.cgp = 0; p.cg = 0; p.ca = 0; p.cgr = 0; p.str0 = p.str; p.tries = 0; p.block = false; });
    var need = { TW: 2, AB: 5, MF: 5, ST: 3 }, added = [];
    Object.keys(need).forEach(function (pos) {
      var have = S.players.filter(function (p) { return p.pos === pos && !(p.loan && p.loan.to); }).length;
      for (var i = have; i < need[pos]; i++) { var fp = newPlayer(S, D, { lvl: Math.min(D.maxLvl, S.lvl + 1), pos: pos, age: rint(19, 30) }); fp.sal = nice(salDemand(fp, S.lvl) * 0.5); fp.ce = S.season + 1; S.players.push(fp); added.push(fp.n + ' (' + pos + ')'); }
    });
    if (added.length) msg(S, 'transfer', 'Der Kader war zu dünn. Aus der Zweiten und dem Probetraining rücken nach: ' + added.join(', ') + '.');
    makeFixtures(S, D);
    // Budget
    var fb = 0.8 + 0.4 * S.fans / 100;
    var e = eff(S, D);
    var b = L.budget * fb * (1 + e.members / 100) * (1 + 0.03 * ((S.lvBoard || 1) - 1));
    var pro = S.lvl <= 4;
    S.spBase = nice(b * (pro ? 0.45 : 0.32));
    S.budgetHold = [['Sponsoring (Saisonbudget)', nice(b * (pro ? 0.8 : 0.55)) - S.spBase], ['Mitgliedsbeiträge', nice(b * (pro ? 0.2 : 0.3) * clamp((S.members || 600) / 640, 0.65, 3))]];
    var ms0 = S.mainSp; if (ms0 && ms0.from <= S.season && ms0.to >= S.season) S.budgetHold.push(['Hauptsponsor ' + ms0.firm, ms0.amt]); else { S.mainSp = ms0 && ms0.to >= S.season ? ms0 : null; spOffers(S, D, false); }
    if (!first) ['kit', 'ball'].forEach(function (kd) { var kc = S[kd]; if (kc && kc.from < S.season && kc.to >= S.season) S.budgetHold.push([(kd === 'ball' ? 'Ballpartner ' : 'Ausstatter ') + kc.name, kc.amt]); else if (kc && kc.to < S.season) { S[kd] = null; if (kd === 'kit') kitOffers(S, D, 'kit'); } else if (!kc && kd === 'kit') kitOffers(S, D, 'kit'); });
    if (!pro) S.budgetHold.push(['Spenden', nice(b * 0.15)]);
    S.needAlloc = true;
    if (S.pv && S.pv.to < S.season) { var oldPv = S.pv.club; S.pv = null; if (has(S, 'partner')) { pvOffers(S, D); infoMail(S, oldPv, 'Partnerschaft ausgelaufen', 'Unsere Kooperation ist ausgelaufen. Unter Verein → Partnerverein liegen neue Angebote anderer Vereine.', 'info'); } } else if (S.pv) pvLoans(S, D);
    book(S, 'Verbandsabgaben', -nice(L.budget * 0.03));
    try { dkSeason(S, D); } catch (e) { }
    // Pokale
    S.cups = [];
    if (S.lvl >= 6) S.cups.push(newCup(S, 'kp'));
    if ((S.lvl >= 4 && S.lvl <= 5) || (S.qual.mrp && S.lvl >= 4)) S.cups.push(newCup(S, 'mrp'));
    if (S.lvl <= 3 || S.qual.dfb) S.cups.push(newCup(S, 'dfb'));
    S.qual = {};
    S.cups.forEach(function (c) { drawCup(S, D, c); });
    S.tests = []; S.rel = null; S.camp = null;
    S.market = { list: [], loans: [] }; refreshMarket(S, D, true);
    S.ticket = S.ticket == null ? L.ticket : S.ticket;
    if (!first) S.ticket = L.ticket;
    // Saisonziel
    var ranks = S.world.lv[S.lvl].slice().sort(function (a, b) { return b.s - a.s; });
    svwTeam(S).s = Math.round(xiAvg(S, D) * 10) / 10;
    var myR = ranks.indexOf(svwTeam(S)) + 1; var n = ranks.length;
    var sug = myR <= Math.max(1, L.up) + 1 ? 'aufstieg' : myR <= n / 3 ? 'oben' : myR <= n * 2 / 3 ? 'mitte' : 'erhalt';
    S.goal = sug;
    pend(S, { type: 'goal', title: 'Saisonziel ' + S.season + '/' + String(S.season + 1).slice(2), text: 'Der Vorstand schätzt den Kader auf Platz ' + myR + ' von ' + n + ' ein und schlägt „' + GOALS[sug] + '“ vor. Ein höheres Ziel bringt mehr Geld und Fan-Begeisterung, aber der Druck steigt.', opts: Object.keys(GOALS).map(function (k) { return { k: k, label: GOALS[k] + (k === sug ? ' (Vorschlag)' : '') }; }) });
  }
  // Pokalfinale ausrichten: Vorgaben, Gebühr, Chance, Belohnung
  var CUPBID = { kp: { n: 'Kreispokal', fee: 500, cap: 800, flut: 2, natur: false, items: [], ch: 0.22, cash: 12000, fol: 250, fans: 3, xp: 40 },
    mrp: { n: 'Landespokal', fee: 2500, cap: 3000, flut: 2, natur: true, items: ['sitztrib', 'parkplatz'], ch: 0.12, cash: 55000, fol: 1200, fans: 5, xp: 120 } };
  function cupBidMiss(S, D, k) { var B = CUPBID[k], e = eff(S, D), m = [], cap = capacity(S, D); if (cap < B.cap) m.push('mind. ' + B.cap + ' Plätze'); if ((e.flut || 1) < B.flut) m.push('Spielflutlicht');
    if (B.natur && S.pitch.type !== 'natur') m.push('Naturrasen'); if (!B.natur && S.pitch.type === 'kunst' && pitchCond(S) < 0.5) m.push('Platz in gutem Zustand');
    B.items.forEach(function (id) { if (!(S.built || {})[id]) m.push(D.items[id] ? D.items[id].name : id); }); return m; }
  function cupBidDay(S, D) {
    var md = S.date.slice(5);
    if (md === '04-15') (S.cupBids || []).forEach(function (b) { if (b.st !== 'open' || b.s !== S.season) return; var B = CUPBID[b.c], cap = capacity(S, D), ch = clamp(B.ch + Math.max(0, cap - B.cap) / 1000 * 0.005 + (S.fans - 50) / 1000, 0.05, b.c === 'kp' ? 0.35 : 0.25);
      if (R() < ch) { b.st = 'won'; S.cupHost = { c: b.c, s: S.season + 1, paid: false }; infoMail(S, 'Fußballverband', '🏆 Zuschlag: ' + cupName(S, b.c) + '-Finale bei uns!', 'Glückwunsch! Das ' + cupName(S, b.c) + '-Finale der Saison ' + (S.season + 1) + '/' + String(S.season + 2).slice(2) + ' wird in unserem Stadion ausgetragen. Das bringt Geld, Follower und Ansehen.'); }
      else { b.st = 'lost'; infoMail(S, 'Fußballverband', 'Absage: ' + cupName(S, b.c) + '-Finale', 'Leider hat diesmal ein anderer Verein den Zuschlag für das ' + cupName(S, b.c) + '-Finale bekommen. Nächste Saison kannst du dich erneut bewerben.'); } });
    var H = S.cupHost; if (H && !H.paid && H.s === S.season && md === CUPS[H.c].dates[5]) { var B2 = CUPBID[H.c]; H.paid = true; book(S, 'Ausrichtung Pokalfinale', B2.cash); followAdd(S, B2.fol); S.fans = clamp(S.fans + B2.fans, 0, 100); xp(S, B2.xp);
      msg(S, 'verein', '🏆 Heute war das ' + cupName(S, H.c) + '-Finale bei uns zu Gast – volles Haus, ' + euro(B2.cash) + ' Einnahmen, +' + B2.fol + ' Follower und jede Menge Ansehen!'); }
  }
  function cupName(S, k) { var c = CUPS[k]; if (!S.reg) return c.name; if (k === 'kp') return 'Kreispokal'; return c.name; }
  function newCup(S, k) { var c = CUPS[k]; return { k: k, name: cupName(S, k), alive: true, rn: 0, games: [], next: null, field: null, hist: [], ties: [], dates: c.dates.map(function (x, i) { var d = sd(S.season, x); return (i === 5 || (k === 'dfb' && i === 0)) ? toDow(d, 6) : toDow(d, 3); }) }; }
  function drawCup(S, D, c) {
    if (!c.alive || c.rn >= 6) { c.next = null; return; }
    if (!c.field) c.field = cupField(S, D, c);
    var lvls = [], rn = c.rn, k = c.k, opp = null;
    if (k === 'kp') { for (var l = 6; l <= D.maxLvl; l++) lvls.push(l); }
    else if (k === 'mrp') { lvls = [3, 4, 5, 6, 7, 8, 9]; }
    else { lvls = S.lvl >= 3 ? (rn === 0 ? [1, 2] : [1, 2, 3]) : (rn === 0 ? [3, 4, 5, 6] : [1, 2, 3]); }
    lvls = lvls.filter(function (l) { return l !== S.lvl || S.world.lv[l].length > 1; });
    if (c.field && c.field.length) {
      var fw = c.field.filter(function (t) { return t.n !== D.club; });
      var minL = rn === 0 ? S.lvl + 1 : rn === 1 ? S.lvl : 0; if (minL) { var fl = fw.filter(function (t) { return t.l >= minL; }); if (fl.length < 6) fl = fw.filter(function (t) { return t.l >= S.lvl; }); if (fl.length < 4) fl = fw.slice(); if (!fl.length) { var mxL = Math.max.apply(null, fw.map(function (t) { return t.l; })); fl = fw.filter(function (t) { return t.l === mxL; }); } fw = fl; }
      var tt = wpick(fw, function (t) { var l = t.l; if (k === 'kp') return rn < 2 ? 1 : 1 + (11 - l) * 0.3; if (k === 'mrp') return l <= 4 ? (rn < 2 ? 0.3 : 1.5) : l === 5 ? 2 : 1.5 / Math.max(1, l - 4); return 1; });
      if (tt) opp = { n: tt.n, s: Math.max(1, tt.s), l: tt.l };
    }
    for (var tries = 0; tries < 20 && !opp; tries++) {
      var l2 = wpick(lvls, function (l) {
        if (k === 'kp') return rn < 2 ? 1 : 1 + (11 - l) * 0.3;
        if (k === 'mrp') return l <= 4 ? (rn < 2 ? 0.3 : 1.5) : l === 5 ? 2 : 1.5 / (l - 4);
        return 1;
      });
      var cands = (c.field || []).filter(function (t) { return t.l === l2; }); if (!cands.length) cands = S.world.lv[l2].filter(function (t) { return !t.svw && !/\s(II|III|IV|U\d\d)$/.test(t.n); }).map(function (t) { return { n: t.n, s: Math.max(1, t.s), l: l2 }; });
      if (k === 'mrp' && l2 <= 4 && !S.reg) cands = cands.filter(function (t) { return MR_TOP.indexOf(t.n) >= 0; });
      if (cands.length) { var t = pick(cands); opp = { n: t.n, s: Math.max(1, t.s), l: t.l || l2 }; }
    }
    if (!opp && c.field && c.field.length) { var t9 = pick(c.field); opp = { n: t9.n, s: t9.s, l: t9.l }; }
    if (!opp) opp = { n: genTeamName(S), s: lvMid(D, Math.min(D.maxLvl, S.lvl + 1)), l: Math.min(D.maxLvl, S.lvl + 1) };
    cupPairOthers(S, D, c, [opp.n]);
    var home = rn === 5 ? null : (opp.l > S.lvl ? false : opp.l < S.lvl ? true : R() < 0.5);
    c.next = { d: c.dates[rn], opp: opp, home: home, rn: rn };
  }

  function seasonEnd(S, D) {
    var L = D.lv[S.lvl];
    var lvS = null; try { lvS = leagueView(S, D, S.lvl); } catch (e0) {}
    var tab = table(S); var me = tab.filter(function (r) { return r.svw; })[0];
    var oldLvl = S.lvl;
    // Tabellen aller Ebenen
    var T = {};
    for (var l = 1; l <= D.maxLvl; l++) {
      var teams = S.world.lv[l];
      if (l === S.lvl) { T[l] = tab.map(function (r) { return teams[r.i]; }); S.world.last[l] = tab.map(function (r) { return [r.n, r.pts, r.tf - r.ta]; }); }
      else { var vl = vLeague(S, D, l, null); T[l] = vl.order; S.world.last[l] = vl.last; }
    }
    var up = {}, down = {};
    for (l = 1; l <= D.maxLvl; l++) { up[l] = []; down[l] = []; }
    for (l = 1; l <= D.maxLvl; l++) {
      var Ll = D.lv[l], list = T[l];
      if (l > 1) {
        var k = 0, cnt = 0;
        while (cnt < Ll.up && k < list.length) { var t = list[k]; if (t.svw && !licenseOk(S, D, l - 1)) { var lfine = nice(Math.max(2000, (D.lv[l - 1].ticket || 5) * 1500)); book(S, 'Lizenz-Ausnahmegenehmigung', -lfine); S.licDue = S.season + 1; msg(S, 'verein', '⚠️ Aufstieg mit Ausnahmegenehmigung: Für die ' + D.lv[l - 1].name + ' fehlt noch ' + licenseIssues(S, D, l - 1).join(', ') + '. Strafe ' + euro(lfine) + ' – bis Saisonende muss alles gebaut sein.'); } up[l].push(t); cnt++; k++; }
      }
      if (l < D.maxLvl) { var dn = D.lv[l].down; for (var j = 0; j < dn; j++) { var t2 = list[list.length - 1 - j]; if (t2) down[l].push(t2); } }
    }
    // Relegation (Aufstiegsrelegation der unteren Liga gegen Abstiegsrelegation der oberen)
    for (l = 2; l <= D.maxLvl; l++) {
      if (!D.lv[l].upRel || !D.lv[l - 1].downRel) continue;
      var A = T[l].filter(function (t) { return up[l].indexOf(t) < 0; })[0];
      var upper = T[l - 1].filter(function (t) { return down[l - 1].indexOf(t) < 0; });
      var B = upper[upper.length - 1];
      if (!A || !B) continue;
      var aWins;
      if (S.rel && (A.svw || B.svw)) aWins = A.svw ? S.rel.won : !S.rel.won;
      else aWins = R() < 1 / (1 + Math.exp(-(A.s - B.s) * 0.25));
      if (A.svw && aWins && !licenseOk(S, D, l - 1)) aWins = false;
      if (aWins) { up[l].push(A); down[l - 1].push(B); }
      if (A.svw || B.svw) msg(S, 'liga', 'Relegation: ' + (aWins ? A.n + ' setzt sich gegen ' + B.n + ' durch.' : B.n + ' behauptet sich gegen ' + A.n + '.'));
    }
    // Saisonbilanz aller Ligen für das Ligen-Fenster (vor der Bewegung festhalten)
    var ligRep = []; for (l = D.maxLvl; l >= 1; l--) { var tl = T[l] || []; ligRep.push({ l: l, n: D.lv[l].short || D.lv[l].name, champ: tl[0] ? tl[0].n : '', up: up[l].map(function (t) { return t.n; }), down: down[l].map(function (t) { return t.n; }), own: l === oldLvl }); }
    // Bewegung
    var nw = {};
    for (l = 1; l <= D.maxLvl; l++) {
      nw[l] = S.world.lv[l].filter(function (t) { return up[l].indexOf(t) < 0 && down[l].indexOf(t) < 0; });
      if (l > 1) down[l - 1].forEach(function (t) { t.moved = -1; if (l >= 5 && !t.r && !t.svw) { (S.world.pool[l - 1] = S.world.pool[l - 1] || []).push(t); return; } nw[l].push(t); });
      if (l < D.maxLvl) up[l + 1].forEach(function (t) { t.moved = 1; nw[l].push(t); });
    }
    for (l = 1; l <= D.maxLvl; l++) {
      var size = D.lv[l].size;
      while (nw[l].length > size) {
        var cand = nw[l].filter(function (t) { return !t.svw && t.moved === -1; }); if (!cand.length) cand = nw[l].filter(function (t) { return !t.svw && t.moved; }); if (!cand.length) cand = nw[l].filter(function (t) { return !t.svw; });
        var out = pick(cand); nw[l].splice(nw[l].indexOf(out), 1); (S.world.pool[l] = S.world.pool[l] || []).push(out);
      }
      while (nw[l].length < size) {
        var pool = S.world.pool[l] = S.world.pool[l] || []; var t3; if (l >= 5) pool = pool.filter(function (t) { return t.r; });
        if (pool.length) { pool.sort(function (a, b) { return Math.abs(a.s - lvMid(D, l)) - Math.abs(b.s - lvMid(D, l)); }); t3 = pool[Math.floor(R() * Math.min(4, pool.length))]; S.world.pool[l].splice(S.world.pool[l].indexOf(t3), 1); }
        else { t3 = mkTeam(D, l, null); t3.n = genTeamName(S); }
        nw[l].push(t3);
      }
    }
    // Stärke-Update
    for (l = 1; l <= D.maxLvl; l++) {
      nw[l].forEach(function (t) {
        if (t.svw) { S.lvl = l; return; }
        if (t.moved === 1) t.b += 1.2; if (t.moved === -1) t.b -= 1.2;
        t.b = clamp(t.b + gauss() * 0.6, lvMid(D, l) - 14, lvMid(D, l) + 14);
        if (t.b > 88 && t.n !== 'FC Bayern München') t.b = 88;
        t.s = Math.round(clamp(t.s + 0.35 * (t.b - t.s) + 0.1 * (lvMid(D, l) - t.s) + gauss() * 2, 1, 97) * 10) / 10;
        delete t.moved;
      });
      S.world.lv[l] = nw[l];
      (S.world.pool[l] || []).forEach(function (t) { t.s = Math.round(clamp(t.s + 0.3 * (t.b - t.s) + gauss(), 1, 97) * 10) / 10; delete t.moved; });
    }
    var sv = svwTeam(S); delete sv.moved;
    // Bilanz
    var n = tab.length; var goalOk = goalReached(S, D, me.rank, n, L, oldLvl);
    var result = S.lvl < oldLvl ? 'Aufstieg' : S.lvl > oldLvl ? 'Abstieg' : 'Klassenerhalt';
    skCoin(S, 2 + Math.floor(skv(S, 'coinS')), 'Saisonende'); if (result === 'Aufstieg' || me.rank === 1) skCoin(S, 5, me.rank === 1 ? 'Meisterschaft' : 'Aufstieg'); else if (result === 'Klassenerhalt') skCoin(S, 1, 'Klassenerhalt');
    mgrSeasonEnd(S, D, result);
    var cupBest = S.cups.map(function (c) { return c.name + ': ' + (c.won ? 'Sieger' : RNAMES[Math.min(5, c.rn)]); }).join(' · ');
    S.hist.push({ season: S.season, lvl: oldLvl, liga: L.name, rank: me.rank, pts: me.pts, tore: me.tf + ':' + me.ta, result: result, goal: GOALS[S.goal], goalOk: goalOk, cups: cupBest, cash: Math.round(S.cash + (S.tb || 0)) });
    S.lastRank = me.rank;
    if (me.rank === 1 && L.prize > 0) book(S, 'Meisterprämie', L.prize);
    if (me.rank === 1) { ach(S, 'meister', L.name, false, oldLvl); hypeUp(S, 2.5); ownPost(S, '🏆 MEISTER! Der SV Wachtberg holt den Titel in der ' + L.short + '! Danke an alle Fans – ihr seid die Besten! 💚🍾', 'pokal'); }
    if (oldLvl === 1 && me && me.rank === 1) { S.blMeister = true; S.blTitles = (S.blTitles || 0) + 1; }
    if (oldLvl === 1 && me) S.blBest = Math.min(S.blBest || 99, me.rank);
    if (!S.fired && S.mc && (result === 'Aufstieg' || oldLvl === 1)) { var nsal = salRoll(S); if (nsal > S.mc.sal) { S.mc.sal = nsal; msg(S, 'verein', '💶 Der Vorstand passt dein Gehalt an: ' + euro(nsal) + ' pro Monat.'); } }
    if (result === 'Aufstieg') { hypeUp(S, 2); if (me.rank !== 1) ownPost(S, '🚀 AUFSTIEG! Nächste Saison spielen wir in der ' + D.lv[S.lvl].short + '! Was für eine Saison! 💚', 'fans'); }
    if (!S.fired) S.pressPending = me.rank === 1 ? 'meister' : result === 'Aufstieg' ? 'aufstieg' : result === 'Abstieg' ? 'abstieg' : S.pressPending;
    // Halbe Sterne: Saison-Ausbeute & automatische Anpassungen
    var hs = S.hsSeason || 0, hsWhy = (S.hsWhy || []).slice();
    if (me.rank === 1) { hs += 1; hsWhy.push('Meisterschaft (2 × ½ ★)'); }
    if (result === 'Aufstieg') { hs += 0.5; hsWhy.push('Aufstieg (½ ★)'); }
    var autoS = []; var addHalf = function (p, d, why) { if (!p) return; var nt = clamp(p.tal + d, 1, 5); if (nt === p.tal) return; p.tal = nt; p.pot = d > 0 ? Math.min(99, p.pot + 2.5) : Math.max(p.str, p.pot - 2); autoS.push({ id: p.id, n: p.n, pos: p.dp, d: d, why: why, tal: nt }); };
    var byName = function (x) { return x && x.own ? S.players.filter(function (p) { return p.n === x.n; })[0] : null; };
    if (lvS) { var tg = lvS.top.g.all3[0], ta = lvS.top.a.all3[0], tb2 = lvS.top.gr.all3[0]; addHalf(byName(tg), 0.5, 'Torschützenkönig'); addHalf(byName(ta), 0.5, 'Bester Vorlagengeber'); addHalf(byName(tb2), 0.5, 'Bester Spieler der Liga'); }
    if (lvS && lvS.top.gr.all3[0]) { var pb = lvS.top.gr.all3[0]; S.potsPop = { n: pb.n, team: pb.team, pos: pb.pos, own: !!pb.own, v: pb.v, season: S.season, liga: L.short }; if (pb.own) { xp(S, 100); msg(S, 'erfolg', '🏆 ' + pb.n + ' ist Spieler der Saison! (+100 XP)'); } }
    S.players.forEach(function (p) { if (p.lgp >= 8 && p.lgr / p.lgp >= 4.2 && !p.self) addHalf(p, -0.5, 'Schwache Saison (Ø Note ' + g10t(p.lgr / p.lgp) + ')'); });
    S.hsPts = (S.hsPts || 0) + hs; S.hsSeason = 0; S.hsWhy = [];
    S.starPop = { season: S.season, auto: autoS, gained: hs, why: hsWhy };
    if (result === 'Aufstieg') { S.board += 25; S.fans += 10; S.fanbase = Math.round(S.fanbase * 1.25); ach(S, 'aufstieg', 'in die ' + D.lv[S.lvl].name, false, oldLvl); if (S.lvl === 6) ach(S, 'lz_6', '', true); if (S.lvl === 5) ach(S, 'lz_5', '', true); if (S.lvl === 2) ach(S, 'bl2', '', true); if (S.lvl === 1) ach(S, 'bl1', '', true); msg(S, 'liga', '🏆 AUFSTIEG! Der ' + D.club + ' spielt nächste Saison in der ' + D.lv[S.lvl].name + '!'); if (S.lvl === 4) ach(S, 'rl', '', true); if (S.lvl === 3) ach(S, 'profi', '', true); }
    else if (result === 'Abstieg') { S.board -= 15; S.fans -= 10; S.fanbase = Math.round(S.fanbase * 0.85); msg(S, 'liga', 'Abstieg in die ' + D.lv[S.lvl].name + '. Bitter.'); }
    if (me.nl === 0) ach(S, 'ungeschlagen', L.name, false, oldLvl); if (result === 'Klassenerhalt' && me.rank > n - L.down - L.downRel - 3) ach(S, 'klassenerhalt', L.name, false, oldLvl);
    var scorer = S.players.slice().sort(function (a, b) { return b.g - a.g; })[0];
    var games = (n - 1) * 2, kingGoals = Math.round(rnd(0.55, 0.85) * games);
    if (scorer && scorer.g >= kingGoals) ach(S, 'torjaeger', scorer.n + ' mit ' + scorer.g + ' Toren', false, oldLvl);
    // Torwandschießen im TV mit dem Torschützenkönig – Ausgang zufällig, Follower gibt es immer
    if (scorer && scorer.g >= kingGoals) { var tw = rint(0, 2), tf = [rint(900, 2200), rint(500, 1400), rint(250, 700)][tw]; S.follow = (S.follow != null ? S.follow : followStart(S)) + tf;
      var tt = [scorer.n + ' räumt im TV-Studio beim Torwandschießen richtig ab – 5 von 6 Treffern! Das Netz feiert ihn.', scorer.n + ' tritt im TV beim Torwandschießen an … und trifft kein einziges Mal. Peinlich – aber das Video geht viral.', scorer.n + ' sollte im TV zum Torwandschießen antreten, musste aber mit Bauchweh absagen. Die Fans schicken Genesungswünsche.'][tw];
      infoMail(S, 'TV-Redaktion', ['🎯 Torwand-Held!', '😬 Torwand-Blamage', '🤒 Torwand fällt aus'][tw], tt + ' (+' + tf.toLocaleString('de-DE') + ' Follower)', 'info'); ownPost(S, ['🎯 Was für eine Show an der Torwand! ' + scorer.n + ' hat abgeräumt 🔥', '😂 Torwand 0/6 – ' + scorer.n + ' nimmt es mit Humor. Tore schießt er lieber auf dem Platz!', '🤒 Gute Besserung, ' + scorer.n + '! Die Torwand muss warten.'][tw], 'stadion'); }
    var best = S.players.filter(function (p) { return p.gp >= Math.min(15, games / 2); }).sort(function (a, b) { return a.gr / a.gp - b.gr / b.gp; })[0];
    if (best) ach(S, 'spieler_jahr', best.n + ' (Ø Note ' + g10t(best.gr / best.gp) + ')', false, oldLvl);
    if (goalOk) ach(S, 'saisonziel', GOALS[S.goal], false, oldLvl);
    var mths = S.fin.hist.slice(-12).concat(S.fin.cur ? [S.fin.cur] : []).filter(function (m) { return m.m >= S.season + '-07'; }); var sIn = 0, sOut = 0; mths.forEach(function (m) { Object.keys(m.inn).forEach(function (k) { sIn += m.inn[k]; }); Object.keys(m.out).forEach(function (k) { sOut += m.out[k]; }); });
    S.seasonRep = { season: S.season, liga: L.name, newLiga: D.lv[S.lvl].name, rank: me.rank, n: n, pts: me.pts, tore: me.tf + ':' + me.ta, s: me.s, u: me.u, nl: me.nl, result: result, goal: GOALS[S.goal], goalOk: goalOk, table: tab.map(function (r) { return { rank: r.rank, n: r.n, pts: r.pts, diff: r.diff, svw: !!r.svw, zone: r.zone }; }), scorer: scorer ? { n: scorer.n, g: scorer.g } : null, best: best ? { n: best.n, avg: Math.round(best.gr / best.gp * 10) / 10 } : null, cups: cupBest, inn: Math.round(sIn), out: Math.round(sOut), wealth: Math.round(wealth(S)), pots: { cash: Math.round(S.cash), tb: Math.round(S.tb), sav: Math.round(S.sav) }, ack: false };
    if (goalOk) { S.board += 15; msg(S, 'verein', 'Saisonziel „' + GOALS[S.goal] + '“ erreicht (Platz ' + me.rank + '). Der Vorstand ist zufrieden.'); }
    else { S.board -= S.goal === 'aufstieg' ? 12 : 20; msg(S, 'verein', 'Saisonziel „' + GOALS[S.goal] + '“ verfehlt (Platz ' + me.rank + '). Der Vorstand ist unzufrieden.'); }
    // Zusatzseiten für den Saisonabschluss: Wahl, Ligen, Bestenlisten, Vorstand, neue Saison
    try { var SR = S.seasonRep, mapT = function (T0) { return T0 ? { top: (T0.top5 || []).map(function (x) { return { n: x.n, team: x.team, pos: x.pos, own: x.own, v: x.v, rank: x.rank }; }), mine: T0.mineAny && T0.mineAny.rank > 3 ? { n: T0.mineAny.n, v: T0.mineAny.v, rank: T0.mineAny.rank } : null } : null; };
      SR.vote = lvS ? { gr: mapT(lvS.top.gr), g: mapT(lvS.top.g), a: mapT(lvS.top.a) } : null; SR.ligen = ligRep;
      var resM = SR.inn - SR.out, gFin = resM >= 0 ? (resM > SR.inn * 0.1 ? 1 : 2) : (resM > -SR.inn * 0.1 ? 3 : 5), gSport = goalOk ? (me.rank === 1 ? 1 : 2) : (result === 'Abstieg' ? 6 : me.rank <= Math.ceil(n / 2) ? 3 : 4), gFans = S.fans >= 80 ? 1 : S.fans >= 65 ? 2 : S.fans >= 50 ? 3 : S.fans >= 35 ? 4 : 5, gAll = Math.round((gFin + gSport * 2 + gFans) / 4);
      var bX = [0, 120, 80, 50, 25, 10, 0][gAll], bF = [0, 900, 600, 350, 150, 50, 0][gAll]; if (bX) xp(S, bX); if (bF) S.follow = (S.follow != null ? S.follow : followStart(S)) + bF;
      SR.board = { fin: gFin, sport: gSport, fans: gFans, all: gAll, xp: bX, fol: bF, res: resM, follow: Math.round(S.follow || 0) };
      SR.xpSeason = Math.max(0, Math.floor((S.xpGame || 0) - (S.xpS0 || 0))); S.xpS0 = S.xpGame || 0; SR.mc = S.mc ? { sal: S.mc.sal, until: S.mc.until } : null; SR.mlvl = S.mlvl || 1;
    } catch (eSR) {}
    S.peak = Math.min(S.peak || S.lvl, S.lvl);
    S.board = clamp(S.board, 0, 100); S.fans = clamp(S.fans, 0, 100); checkBars(S);
    // Verträge, Leihen, Karriereende
    var ending = S.season + 1;
    S.players = S.players.filter(function (p) {
      if (p.loan && p.loan.from) { msg(S, 'transfer', p.n + ' kehrt nach der Leihe zu ' + p.loan.from + ' zurück.'); return false; }
      if (p.loan && p.loan.to) { if (p.loan.pv) p.str = Math.min(Math.max(p.pot + 1, p.str), p.str * (1 + rnd(0.03, 0.07) * (0.6 + 0.14 * (p.tal || 3)))); msg(S, 'transfer', p.n + ' kommt von der Leihe bei ' + p.loan.to + ' zurück' + (p.loan.pv ? ' – mit viel Spielpraxis.' : '.')); p.loan = null; }
      if (p.ce <= ending && !p.self) { msg(S, 'transfer', p.n + ' verlässt den Verein – sein Vertrag ist ausgelaufen.'); return false; }
      if (p.age >= 34 && !p.self && R() < (p.age - 33) * 0.3) { msg(S, 'transfer', p.n + ' (' + p.age + ') beendet seine Karriere.'); return false; }
      return true;
    });
    // Jugend
    S.youth = S.youth.filter(function (y) { if (!y.bday) y.age++; if (y.age >= 19) { msg(S, 'jugend', y.n + ' ist zu alt für die Jugend und verlässt den Verein.'); return false; } return true; });
    var e = eff(S, D); var nY = 2 + e.youth;
    for (var yy = 0; yy < nY; yy++) youthAdd(S, newYouth(S, D, false));
    msg(S, 'jugend', nY + ' neue Talente sind in die Jugend gekommen. Schau im Kader unter „Jugend“ vorbei.');
    if (S.cash < 0) {
      if (S.budgetWarn === S.season - 1) { S.fireWhy = 'budget'; fire(S, 'Zum zweiten Mal in Folge hast du die Saison im Minus abgeschlossen (' + euro(Math.round(S.cash)) + '). Der Vorstand trennt sich von dir.'); }
      else { S.budgetWarn = S.season; infoMail(S, 'Vorstand', '⚠️ Verwarnung: Saison im Minus', 'Die Saison endet mit ' + euro(Math.round(S.cash)) + '. Das Minus wird mit dem Budget der neuen Saison ausgeglichen. Das ist deine Verwarnung: Schließt du auch die nächste Saison im Minus ab, wirst du entlassen.', 'warn'); S.warnPop = { cash: Math.round(S.cash) }; }
    }
    if (S.board <= 0 && !S.fired) fire(S, 'Nach der Saison hat der Vorstand die Reißleine gezogen.');
    mcAdd(S, 'season'); try { if (me && tab.indexOf(me) === 0) mcAdd(S, 'title'); } catch (e) { }
    if (!S.fired) twinCheck(S, D, oldLvl);
    if (S.lvl < oldLvl) mcAdd(S, 'promo');
  }
  // Zweit-/Drittmannschaft darf nicht in die Liga der eigenen höheren Mannschaft aufsteigen.
  // Der Aufstieg wird zurückgenommen; der Vorstand bietet an, die höhere Mannschaft zu übernehmen (mit Kaderwahl).
  // ---------------------------------------------------------------- Missionen
  // Zähler S.mc wachsen mit allem, was im Spiel passiert. Tagesmissionen (ab Level 3) messen den Zuwachs seit Tagesbeginn,
  // Karriere-Missionen (ab Level 5) den Gesamtstand.
  function mcAdd(S, k, n) { S.mcnt = S.mcnt || {}; S.mcnt[k] = (S.mcnt[k] || 0) + (n == null ? 1 : n); }
  var ACT_MC = { training: 'train', teamTrain: 'train', trainDay: 'train', indTrain: 'indiv', test: 'test', liveSub: 'sub', talk: 'talk', like: 'social', reply: 'social', trPost: 'post', socialAct: 'post', socialAd: 'post', flyer: 'post', stream: 'post',
    fanAct: 'fan', spAccept: 'spons', kitAccept: 'spons', psAccept: 'spons', press: 'press', liveStart: 'live', liveAuto: 'inst', instantMatch: 'inst', decide: 'event', buy: 'offer', extend: 'extend', scoutAdd: 'youth', promote: 'youth', ycSign: 'youth', donate: 'donate', upgrade: 'build', build: 'build' };
  // [Zähler, Text für 1, Text für n, Ziele]
  var DM_T = [['win', 'Gewinne ein Spiel', 'Gewinne {n} Spiele', [1, 2, 3, 4]], ['goal', 'Schieße ein Tor', 'Schieße {n} Tore', [2, 3, 4, 5, 6, 8]], ['game', 'Bestreite ein Pflichtspiel', 'Bestreite {n} Pflichtspiele', [1, 2, 3, 4]],
    ['csheet', 'Spiele zu Null', 'Spiele {n}-mal zu Null', [1, 2, 3]], ['homewin', 'Gewinne ein Heimspiel', 'Gewinne {n} Heimspiele', [1, 2, 3]], ['awaywin', 'Gewinne auswärts', 'Gewinne {n} Auswärtsspiele', [1, 2]],
    ['bigwin', 'Gewinne mit mind. 3 Toren Unterschied', 'Gewinne {n}-mal mit mind. 3 Toren Unterschied', [1, 2]], ['scored3', 'Schieße in einem Spiel mind. 3 Tore', 'Schieße {n}-mal mind. 3 Tore in einem Spiel', [1, 2]], ['draw', 'Hol ein Unentschieden', 'Hol {n} Unentschieden', [1, 2]],
    ['train', 'Leg ein Training fest', 'Leg {n}-mal das Training fest', [1, 2, 3, 4]], ['indiv', 'Mach ein Einzeltraining', 'Mach {n} Einzeltrainings', [1, 2, 3, 5, 8]], ['test', 'Vereinbare ein Testspiel', 'Vereinbare {n} Testspiele', [1, 2]],
    ['sub', 'Wechsle im Live-Spiel einmal', 'Wechsle im Live-Spiel {n}-mal', [1, 2, 3, 5]], ['talk', 'Halte eine Halbzeitansprache', 'Halte {n} Halbzeitansprachen', [1, 2, 3]], ['live', 'Spiel ein Spiel live', 'Spiel {n} Spiele live', [1, 2, 3]],
    ['social', 'Like oder beantworte einen Fan-Post', 'Like oder beantworte {n} Fan-Posts', [1, 2, 3, 5, 8]], ['post', 'Setz einen Post ab', 'Setz {n} Posts ab', [1, 2, 3]], ['fan', 'Mach eine Fan-Aktion', 'Mach {n} Fan-Aktionen', [1, 2, 3]],
    ['day', 'Spiel einen Tag weiter', 'Spiel {n} Tage weiter', [2, 3, 5, 7, 10, 14]], ['event', 'Triff eine Entscheidung', 'Triff {n} Entscheidungen', [1, 2, 3]], ['press', 'Gib eine Pressekonferenz', 'Gib {n} Pressekonferenzen', [1]],
    ['offer', 'Gib ein Transferangebot ab', 'Gib {n} Transferangebote ab', [1, 2]], ['extend', 'Verlängere einen Vertrag', 'Verlängere {n} Verträge', [1, 2]], ['youth', 'Hol ein Talent', 'Hol {n} Talente', [1, 2]], ['spons', 'Schließ einen Sponsorvertrag ab', 'Schließ {n} Sponsorverträge ab', [1]]];
  var DMISS = []; DM_T.forEach(function (t) { t[3].forEach(function (n, i) { DMISS.push({ id: t[0] + n, k: t[0], n: n, t: n === 1 ? t[1] : t[2].replace('{n}', n), d: Math.min(3, 1 + i * 0.6) }); }); });
  DMISS = DMISS.slice(0, 100);
  // Karriere: 50 Meilensteine, sortiert nach Schwierigkeit. [Zähler/Wert, Ziel, Text]; Belohnung steigt mit der Stufe
  // Karriere: 100 Missionen nacheinander (immer nur die aktuelle ist offen und zählt erst ab dem Öffnen). [Zähler, Ziel, Text]
  var CMISS = [['win', 1, 'Gewinne ein Spiel'], ['game', 3, 'Bestreite 3 Pflichtspiele'], ['goal', 5, 'Schieße 5 Tore'], ['dmdone', 5, 'Schließe 5 Tagesmissionen ab'], ['train', 3, 'Leg 3-mal das Training fest'],
    ['indiv', 3, 'Mach 3 Einzeltrainings'], ['live', 1, 'Spiele ein Spiel in der Simulation'], ['inst', 1, 'Spiele ein Spiel mit Sofortergebnis'], ['social', 5, 'Like oder beantworte 5 Fan-Posts'], ['post', 2, 'Setz 2 Posts ab'],
    ['csheet', 1, 'Spiele einmal zu Null'], ['homewin', 2, 'Gewinne 2 Heimspiele'], ['awaywin', 1, 'Gewinne ein Auswärtsspiel'], ['draw', 1, 'Hol ein Unentschieden'], ['fan', 2, 'Mach 2 Fan-Aktionen'],
    ['win', 10, 'Gewinne 10 Spiele'], ['goal', 25, 'Schieße 25 Tore'], ['dmdone', 10, 'Schließe 10 Tagesmissionen ab'], ['game', 15, 'Bestreite 15 Pflichtspiele'], ['streak', 3, 'Gewinne 3 Spiele in Folge'],
    ['hat', 1, 'Schieße einen Hattrick'], ['bigwin', 3, 'Gewinne 3-mal mit 3 Toren Unterschied'], ['youth', 2, 'Hol 2 Talente'], ['follow', 1000, 'Gewinne 1.000 neue Follower'], ['season', 1, 'Spiele eine komplette Saison'],
    ['test', 3, 'Vereinbare 3 Testspiele'], ['extend', 2, 'Verlängere 2 Verträge'], ['offer', 3, 'Gib 3 Transferangebote ab'], ['press', 3, 'Gib 3 Pressekonferenzen'], ['sub', 10, 'Wechsle im Live-Spiel 10-mal'],
    ['win', 25, 'Gewinne 25 Spiele'], ['goal', 50, 'Schieße 50 Tore'], ['dmdone', 25, 'Schließe 25 Tagesmissionen ab'], ['csheet', 10, 'Spiele 10-mal zu Null'], ['streak', 5, 'Gewinne 5 Spiele in Folge'],
    ['cuptitle', 1, 'Gewinne einen Pokal'], ['promo', 1, 'Steige auf'], ['live', 10, 'Spiele 10 Spiele in der Simulation'], ['inst', 10, 'Spiele 10 Spiele mit Sofortergebnis'], ['youth', 5, 'Hol 5 Talente'],
    ['follow', 5000, 'Gewinne 5.000 neue Follower'], ['bigwin', 10, 'Gewinne 10-mal mit 3 Toren Unterschied'], ['hat', 3, 'Schieße 3 Hattricks'], ['build', 5, 'Starte 5 Bauprojekte'], ['talk', 10, 'Halte 10 Halbzeitansprachen'],
    ['win', 50, 'Gewinne 50 Spiele'], ['goal', 100, 'Schieße 100 Tore'], ['dmdone', 50, 'Schließe 50 Tagesmissionen ab'], ['title', 1, 'Werde Meister'], ['season', 3, 'Spiele 3 komplette Saisons'],
    ['streak', 7, 'Gewinne 7 Spiele in Folge'], ['cuptitle', 2, 'Gewinne 2 Pokale'], ['promo', 2, 'Steige 2-mal auf'], ['peak', 5, 'Erreiche die Oberliga'], ['csheet', 25, 'Spiele 25-mal zu Null'],
    ['follow', 10000, 'Gewinne 10.000 neue Follower'], ['live', 25, 'Spiele 25 Spiele in der Simulation'], ['inst', 25, 'Spiele 25 Spiele mit Sofortergebnis'], ['spons', 3, 'Schließe 3 Sponsorverträge ab'], ['extend', 10, 'Verlängere 10 Verträge'],
    ['win', 100, 'Gewinne 100 Spiele'], ['goal', 200, 'Schieße 200 Tore'], ['dmdone', 100, 'Schließe 100 Tagesmissionen ab'], ['season', 5, 'Spiele 5 komplette Saisons'], ['title', 2, 'Werde 2-mal Meister'],
    ['promo', 3, 'Steige 3-mal auf'], ['peak', 4, 'Erreiche die Regionalliga'], ['cuptitle', 3, 'Gewinne 3 Pokale'], ['streak', 10, 'Gewinne 10 Spiele in Folge'], ['hat', 10, 'Schieße 10 Hattricks'],
    ['bigwin', 25, 'Gewinne 25-mal mit 3 Toren Unterschied'], ['follow', 25000, 'Gewinne 25.000 neue Follower'], ['youth', 15, 'Hol 15 Talente'], ['live', 50, 'Spiele 50 Spiele in der Simulation'], ['inst', 50, 'Spiele 50 Spiele mit Sofortergebnis'],
    ['win', 200, 'Gewinne 200 Spiele'], ['goal', 400, 'Schieße 400 Tore'], ['dmdone', 200, 'Schließe 200 Tagesmissionen ab'], ['season', 7, 'Spiele 7 komplette Saisons'], ['title', 4, 'Werde 4-mal Meister'],
    ['peak', 3, 'Erreiche die 3. Liga'], ['cuptitle', 5, 'Gewinne 5 Pokale'], ['streak', 12, 'Gewinne 12 Spiele in Folge'], ['csheet', 60, 'Spiele 60-mal zu Null'], ['follow', 50000, 'Gewinne 50.000 neue Follower'],
    ['promo', 5, 'Steige 5-mal auf'], ['bigwin', 50, 'Gewinne 50-mal mit 3 Toren Unterschied'], ['hat', 20, 'Schieße 20 Hattricks'], ['dmdone', 300, 'Schließe 300 Tagesmissionen ab'], ['season', 10, 'Spiele 10 komplette Saisons'],
    ['win', 400, 'Gewinne 400 Spiele'], ['goal', 800, 'Schieße 800 Tore'], ['peak', 2, 'Erreiche die 2. Bundesliga'], ['title', 6, 'Werde 6-mal Meister'], ['cuptitle', 8, 'Gewinne 8 Pokale'],
    ['streak', 15, 'Gewinne 15 Spiele in Folge'], ['dmdone', 500, 'Schließe 500 Tagesmissionen ab'], ['season', 15, 'Spiele 15 komplette Saisons'], ['title', 8, 'Werde 8-mal Meister'], ['peak', 1, 'Erreiche die Bundesliga']];
  function cmRw(i) { i = Math.floor(i / 2); return i < 10 ? { x: 60, c: 0.02 } : i < 20 ? { x: 120, c: 0.04, j: 1 } : i < 30 ? { x: 200, c: 0.06, h: 1 } : i < 40 ? { x: 300, c: 0.1, j: 1, h: 1 } : { x: 500, c: 0.15, j: 2, h: 2 }; }
  function cmHave(S, k) { var mc = S.mcnt || {}; if (k === 'follow') return Math.max(0, Math.round((S.follow || 0) - (S.follow0 != null ? S.follow0 : (S.follow || 0)))); if (k === 'streak') return S.cmStr || 0; if (k === 'peak') return S.peak || S.lvl; return mc[k] || 0; }
  function dmRw(S, D, m) { var B = D.lv[S.lvl].budget || 20000; return { x: Math.round(8 + m.d * 8), m: nice(Math.max(50, B * 0.004 * m.d)), f: m.d >= 2 ? 2 : 1 }; }
  function dmRoll(S, today) { // drei zufällige Tagesmissionen, nicht dieselben wie gestern
    var old = (S.dm && S.dm.ids) || [], pool = DMISS.filter(function (m) { return old.indexOf(m.id) < 0; }), ids = [];
    var seed = 0; String(today + (S.pseed || 0)).split('').forEach(function (c) { seed = (seed * 31 + c.charCodeAt(0)) % 100003; });
    while (ids.length < 3 && pool.length) { seed = (seed * 9301 + 49297) % 233280; var m = pool.splice(seed % pool.length, 1)[0]; if (!ids.some(function (x) { return DMISS.filter(function (y) { return y.id === x; })[0].k === m.k; })) ids.push(m.id); }
    S.dm = { day: today, ids: ids, base: JSON.parse(JSON.stringify(S.mcnt || {})), got: {} };
  }
  function misView(S, D) {
    var lv = S.mlvl || 1, mc = S.mcnt || {}, out = { dailyOn: has(S, 'tagesmissionen'), careerOn: has(S, 'missionen'), daily: [], career: [] };
    if (S.dm) out.daily = S.dm.ids.map(function (id) { var m = DMISS.filter(function (x) { return x.id === id; })[0]; if (!m) return null; var have = Math.min(m.n, (mc[m.k] || 0) + (mc['t_' + m.k] || 0) - (S.dm.base[m.k] || 0) - (S.dm.base['t_' + m.k] || 0)); return { id: 'd:' + id, t: m.t, n: m.n, have: Math.max(0, have), st: S.dm.got[id] ? 'claimed' : have >= m.n ? 'done' : 'open', rw: dmRw(S, D, m) }; }).filter(Boolean);
    cmInit(S); var ci = S.cmi || 0, stg = S.cms;
    out.cmi = ci; out.dmTotal = (S.mcnt || {}).dmdone || 0; out.stage = stg + 1; out.stages = Math.ceil(CMISS.length / 10);
    out.career = CMISS.map(function (m, i) { var rw = cmRw(i), ms = Math.floor(i / 10), n = m[0] === 'peak' ? 1 : m[1], have = 0, st;
      if (ms < stg || (ms === stg && S.cmc[i])) { st = 'claimed'; have = n; }
      else if (ms > stg) st = 'locked';
      else { if (m[0] === 'peak') have = (S.peak || S.lvl) <= m[1] ? 1 : 0; else if (m[0] === 'streak') have = Math.min(n, S.cmStr || 0); else have = Math.max(0, Math.min(n, cmHave(S, m[0]) - (S.cmb2[i] || 0))); st = have >= n ? 'done' : 'open'; }
      return { id: 'c:' + i, t: ms <= stg ? m[2] : '', n: n, have: have, st: st, rw: { x: rw.x, m: nice((D.lv[S.lvl].budget || 20000) * rw.c), j: rw.j || 0, h: rw.h || 0 }, tier: ms + 1 }; });
    return out;
  }
  // Neue Karriere-Mission öffnen: Startwert merken, damit nur zählt, was ab jetzt passiert
  function cmOpen(S, i) { cmInit(S); }
  // 10 Stufen à 10 Missionen: eine Stufe ist komplett offen, gezählt wird ab dem Öffnen der Stufe
  function cmStageOpen(S, stg) { S.cms = stg; S.cmc = {}; S.cmb2 = {}; S.cmStr = 0; for (var i = stg * 10; i < Math.min(CMISS.length, stg * 10 + 10); i++) { var m = CMISS[i]; S.cmb2[i] = m[0] !== 'peak' && m[0] !== 'streak' ? cmHave(S, m[0]) : 0; } }
  function cmInit(S) { if (S.cms != null && S.cmc && S.cmb2) return; var ci = S.cmi || 0, stg = Math.floor(ci / 10); cmStageOpen(S, stg); for (var k = stg * 10; k < ci; k++) S.cmc[k] = 1; }
  function misPay(S, rw, why) { var t = []; if (rw.x) { xp(S, rw.x); t.push('+' + rw.x + ' XP'); } if (rw.m) { book(S, 'Missionsprämie', rw.m); t.push('+' + euro(rw.m)); } if (rw.f) { S.fans = clamp((S.fans || 50) + rw.f, 0, 100); t.push('Fans +' + rw.f); } if (rw.j) { S.jokers = (S.jokers || 0) + rw.j; t.push(rw.j + ' Joker'); } if (rw.h) { S.hsPts = (S.hsPts || 0) + rw.h * 0.5; t.push(String(rw.h * 0.5).replace('.', ',') + ' Sterne'); } return '🎯 ' + why + ': ' + t.join(' · '); }
  function giveBonus(S, rw, why) { var t = []; if (rw.j) { S.jokers = (S.jokers || 0) + rw.j; t.push(rw.j + ' Joker'); } if (rw.h) { S.hsPts = (S.hsPts || 0) + rw.h * 0.5; t.push(String(rw.h * 0.5).replace('.', ',') + ' Sterne'); } return '🎁 ' + why + ': ' + t.join(' + '); }
  function misTrack(S, r) { mcAdd(S, 'game'); if (r.win) mcAdd(S, 'win'); else if (r.gf === r.ga) mcAdd(S, 'draw'); mcAdd(S, 'goal', r.gf); mcAdd(S, 'ga', r.ga || 0); if (r.ga === 0) mcAdd(S, 'csheet'); if (r.win && r.home) mcAdd(S, 'homewin'); if (r.win && !r.home) mcAdd(S, 'awaywin'); if (r.win && r.gf - r.ga >= 3) mcAdd(S, 'bigwin'); if (r.gf >= 3) mcAdd(S, 'scored3'); if (r.hat) mcAdd(S, 'hat'); S.bestStreak = Math.max(S.bestStreak || 0, S.streak || 0); if (r.win) S.cmStr = Math.max(S.cmStr || 0, S.streak || 0); }
  function higherOf(n) { var m = String(n).match(/^(.*?)\s+(II|III|IV)$/); if (!m) return []; var b = m[1]; return m[2] === 'II' ? [b, b + ' I'] : m[2] === 'III' ? [b + ' II', b, b + ' I'] : [b + ' III', b + ' II', b, b + ' I']; }
  function twinCheck(S, D, oldLvl) {
    if (!(S.lvl < oldLvl)) return; var hs = higherOf(S.club); if (!hs.length) return;
    var up = S.lvl, Lu = S.world.lv[up] || [], low = S.world.lv[up + 1]; if (!low) return;
    var hi = Lu.filter(function (t) { return !t.svw && hs.indexOf(t.n) >= 0; })[0]; if (!hi) return;
    var me = Lu.filter(function (t) { return t.svw; })[0], cand = low.filter(function (t) { return !t.svw && hs.indexOf(t.n) < 0; }).sort(function (a, b) { return (b.s || 0) - (a.s || 0); })[0]; if (!me || !cand) return;
    Lu[Lu.indexOf(me)] = cand; low[low.indexOf(cand)] = me; S.lvl = up + 1; if (S.peak === up) S.peak = up + 1;
    var plan = { TW: 2, AB: 7, MF: 7, ST: 4 }, sq = [];
    Object.keys(plan).forEach(function (pos) { for (var i = 0; i < plan[pos]; i++) { var p = newPlayer(S, D, { lvl: up, pos: pos }); p.sal = salDemand(p, up); p.ce = S.season + 2 + rint(0, 1); sq.push(p); } });
    S.twin = { up: hi.n, lvl: up, name: D.lv[up].name, sq: sq };
    infoMail(S, 'Vorstand', '🛑 Kein Aufstieg für die ' + S.club, 'Sportlich hättet ihr den Aufstieg geschafft – Glückwunsch! Aber in der ' + D.lv[up].name + ' spielt schon unsere ' + hi.n + '. Zwei Mannschaften eines Vereins dürfen nicht in derselben Liga spielen. Der Vorstand möchte, dass du die ' + hi.n + ' übernimmst. Du darfst dir aus beiden Kadern die Spieler aussuchen.');
  }
  function goalReached(S, D, rank, n, L, oldLvl) {
    var g = S.goal;
    if (g === 'aufstieg') return S.lvl < oldLvl;
    if (g === 'oben') return rank <= Math.ceil(n / 3);
    if (g === 'mitte') return rank <= Math.ceil(n * 2 / 3);
    return rank <= n - L.down - (L.downRel ? 1 : 0) || (S.rel && S.rel.type === 'down' && S.rel.won);
  }
  function licenseOk(S, D, l) { return licenseIssues(S, D, l).length === 0; }
  function licenseIssues(S, D, l) {
    var L = D.lv[l]; var e = eff(S, D); var out = [];
    if (!L) return out;
    if (L.licCap && capacity(S, D) < L.licCap) out.push('Stadion mit mind. ' + L.licCap.toLocaleString('de-DE') + ' Plätzen');
    if (L.licFlut && e.flut < L.licFlut) out.push(L.licFlut >= 3 ? 'TV-Flutlicht' : 'Spielflutlicht');
    var r = L.licRasen.toLowerCase();
    if (r.indexOf('natur') >= 0 && S.pitch.type !== 'natur') out.push('Naturrasen');
    if (r.indexOf('heiz') >= 0 && (S.pitch.type !== 'natur' || !e.heiz)) out.push('Naturrasen mit Rasenheizung');
    Object.keys(LICI).forEach(function (id) { if (+LICI[id] >= +l && D.items[id] && !S.built[id]) out.push(D.items[id].name); });
    return out;
  }
  function simSeasonTable(teams) {
    var n = teams.length; var pts = teams.map(function () { return 0; }); var gd = teams.map(function () { return 0; });
    var form = teams.map(function () { return gauss() * 1.5; });
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      if (i === j) continue;
      var si = teams[i].s + form[i] + 1.5, sj = teams[j].s + form[j];
      var hg = poisson(1.45 * Math.exp(0.07 * (si - sj))), ag = poisson(1.15 * Math.exp(0.07 * (sj - si)));
      gd[i] += hg - ag; gd[j] += ag - hg;
      if (hg > ag) pts[i] += 3; else if (hg < ag) pts[j] += 3; else { pts[i]++; pts[j]++; }
    }
    var idx = teams.map(function (_, i) { return i; }).sort(function (a, b) { return pts[b] - pts[a] || gd[b] - gd[a]; });
    return { order: idx.map(function (i) { return teams[i]; }), rows: idx.map(function (i) { return [teams[i].n, pts[i], gd[i]]; }) };
  }
  function fire(S, why) { if (S.fired) return; if (S.own && S.own.pct >= 100) { msg(S, 'verein', '🛡️ Der Vorstand wollte dich entlassen – aber als Alleineigentümer entscheidest du selbst. ' + (why || '')); S.board = Math.max(S.board, 35); return; } S.fired = true; S.firedOn = S.date; msg(S, 'verein', '❌ Du wurdest entlassen. ' + (why || '')); S.pending = []; }

  // ============================================================ Mannschaftsstärke & Aufstellung
  function g10t(g) { return String(Math.max(1, Math.min(10, Math.round((10 - (g - 1) * 1.8) * 10) / 10)).toFixed(1)).replace('.', ','); }
  function fitF(p) { return 0.85 + 0.15 * (p.fit / 100); }
  function posFit(slot, p) {
    var dp = p.dp || p.pos; if (slot === dp) return 1; if (MIRR[dp] === slot) return 0.95; if (slot === p.dp2) return Math.max(0.73, p.f2 || 0.78); if (p.dp3 && slot === p.dp3) return Math.max(0.3, p.f3 || 0.3);
    if (slot === 'TW' || dp === 'TW') return 0.3;
    var gs = GRP[slot], gp = GRP[dp]; if (gs === gp) return 0.8;
    if ((SEC[dp] || []).indexOf(slot) >= 0 || (SEC[slot] || []).indexOf(dp) >= 0) return 0.75;
    var ord = { AB: 0, MF: 1, ST: 2 }; return Math.abs(ord[gs] - ord[gp]) === 1 ? 0.65 : 0.5;
  }
  var SOCIAL = [['ytshort', 'TubeClip Short', '#ff0000', 1.1], ['tiktok', 'Klipster-Video', '#7b2ff7', 1.3], ['igstory', 'Exchangegram Story', '#d62976', 1.0], ['wakanal', 'Call Up Kanal', '#25d366', 0.8], ['fbpost', 'FaceSpace-Post', '#1877f2', 0.7], ['xpost', 'Chirp-Post', '#000000', 0.6], ['twitch', 'Streamly-Livestream', '#9146ff', 1.2], ['podcast', 'Vereins-Podcast', '#8e44ad', 0.9], ['snap', 'Snapflash-Story', '#e8d800', 0.8], ['threads', 'Strands-Post', '#222222', 0.6], ['igreel', 'Exchangegram Reel', '#962fbf', 1.25], ['ytvlog', 'TubeClip Vlog', '#cc0000', 1.15], ['callup', 'Call Up Gruppe', '#2bb673', 0.85]];
  function socialPick(S) { var wk = addDays(S.date, -((dow(S.date) + 6) % 7)); var sd = parseInt(wk.replace(/-/g, ''), 10); var ids = SOCIAL.map(function (x) { return x[0]; }).filter(function (k) { return k !== 'twitch'; }); var out = []; for (var i = 0; out.length < 3 && i < 40; i++) { sd = (sd * 9301 + 49297) % 233280; var k = ids[Math.floor(sd / 233280 * ids.length)]; if (out.indexOf(k) < 0) out.push(k); } return out; } // pro Woche genau 3 zufällige Plattformen
  function adCost(S) { var wk = addDays(S.date, -((dow(S.date) + 6) % 7)); var sd = (parseInt(wk.replace(/-/g, ''), 10) * 7919) % 233280; return 25 + Math.round(sd / 233280 * 225); } // Werbung: 25–250 € pro Woche
  function flyCost(S) { var wk = addDays(S.date, -((dow(S.date) + 6) % 7)); var sd = (parseInt(wk.replace(/-/g, ''), 10) * 4271) % 233280; return 10 + Math.round(sd / 233280 * 90); } // Flyer: 10–100 €
  function followStart(S) { var lo = 253 + Math.max(0, 11 - S.lvl) / 10 * 3650; return Math.round(Math.min(4315, lo + rnd(0, 415))); }
  function followAdd(S, n) { if (n > 0) n *= 0.7 * (1 + skv(S, 'fol')); /* Balancing: Follower-Zuwachs −30 % */ if (S.hollyStar && n > 0) n = n * (1 + S.hollyStar.eff * 1.5); if ((S.mlvl || 1) >= 26 && n > 0) n *= 1.1; n = Math.round(n); S.follow = Math.max(0, (S.follow || 0) + n); S.fwGain = (S.fwGain || 0) + n; }
  var FMS = [[1000, 'Die ersten 1.000 Follower – lokale Firmen werden neugierig', 0.02], [5000, 'Im Ländchen kennt man euch online – kleine Sponsoren melden sich', 0.04], [10000, 'Sponsoren werden auf euch aufmerksam', 0.06], [50000, 'Überregionale Sponsoren klopfen an', 0.12], [100000, 'Große Firmen wollen mit euch werben – ab jetzt bringen eure Posts Geld', 0.2], [250000, 'Deutschlandweite Marken interessieren sich für euch', 0.3], [500000, 'Ihr seid ein Social-Media-Phänomen – Top-Marken stehen Schlange', 0.45], [1000000, 'EINE MILLION Follower! Ihr seid eine internationale Marke', 0.7]];
  function followF(S) { return 1 + (S.fMs2 || 0) * 0.05 + ((S.fMs2 || 0) >= 6 ? 0.15 : 0) + ((S.fMs2 || 0) >= 8 ? 0.25 : 0); }
  function followMs(S, D) {
    if (S.fMs2 == null) { S.fMs2 = FMS.filter(function (x) { return (S.follow || 0) >= x[0]; }).length; return; }
    FMS.forEach(function (st, i) { if (S.fMs2 > i || S.follow < st[0]) return; S.fMs2 = i + 1; var bonus = nice(D.lv[S.lvl].budget * st[2] + 500); book(S, 'Social-Media-Sponsoring', bonus); S.spons = clamp(S.spons + 3 + i * 2, 0, 100); xp(S, 5 + i * 5); infoMail(S, 'Social-Media-Team', num(st[0]) + ' Follower! 🎉', st[1] + '. Ein neuer Partner zahlt einmalig ' + euro(bonus) + ', das Ansehen bei Sponsoren steigt – und künftige Angebote von Hauptsponsor und Ausstatter fallen ' + Math.round((followF(S) - 1) * 100) + ' % besser aus.', 'info'); });
  }
  function mktVal(S) { var f = S.follow || 0; return Math.round(clamp(Math.log(f + 1) / Math.log(10) * 26 - 50 + (S.fans - 50) * 0.2 + (S.mktB || 0), 0, 100)); }
  function prepWin(S, D, phase) {
    var off = svwGames(S, D).filter(function (x) { return x.comp !== 'test'; }).map(function (x) { return x.d; }).sort(), y1 = (S.season + 1) + '-01-01', from, to, first;
    if (phase === 'summer') { from = S.season + '-07-02'; first = off.filter(function (d) { return d >= S.season + '-07-01'; })[0] || (S.season + '-08-31'); }
    else { var bef = off.filter(function (d) { return d < y1 && d >= S.season + '-10-01'; }); from = bef.length ? addDays(bef[bef.length - 1], 1) : S.season + '-12-15'; if (from < S.season + '-12-01') from = S.season + '-12-01'; first = off.filter(function (d) { return d >= y1; })[0] || ((S.season + 1) + '-03-01'); }
    to = addDays(first, -1); if (from <= S.date) from = addDays(S.date, 1);
    return [from, to, first];
  }
  function firstOff(S, D, d) { var md = d.slice(5), from = md >= '06-01' && md <= '09-30' ? S.season + '-07-01' : (md >= '12-01' ? d.slice(0, 4) : (+d.slice(0, 4) - 1)) + '-12-10'; var g = svwGames(S, D).filter(function (x) { return x.comp !== 'test' && x.d >= from; }).sort(function (a, b) { return a.d < b.d ? -1 : 1; })[0]; return g ? g.d : null; }
  function giftList(S, D) {
    var base = xiAvg(S, D), out = [];
    for (var i = 0; i < 10; i++) { var young = i < 5, p = newPlayer(S, D, { str: Math.round((young ? base - rnd(1, 4.5) : base + rnd(1, 5)) * 10) / 10, age: young ? rint(17, 21) : rint(27, 32) }); p.tal = young ? pick([3, 3.5, 3.5, 4]) : pick([1.5, 2, 2, 2.5]); p.pot = potOf(p.str, p.age, p.tal); p.sal = salDemand(p, S.lvl); out.push(p); }
    return out.sort(function () { return R() - 0.5; });
  }
  function benchIds(S) { var xi = (S.lineup.xi ? S.lineup.xi.filter(function (id) { return id != null; }) : currentXI(S).filter(Boolean).map(function (p) { return p.id; })); var av = avail(S).filter(function (p) { return xi.indexOf(p.id) < 0; }), avA = availA(S).filter(function (p) { return xi.indexOf(p.id) < 0; }); var b = (S.lineup.bench || []).filter(function (id) { return av.some(function (p) { return p.id === id; }); }); if (!S.lineup.bench) b = avA.slice().sort(function (a, c) { return c.str - a.str; }).slice(0, 9).map(function (p) { return p.id; }); return b.slice(0, 9); }
  // Anzeige: Verletzte/Gesperrte bleiben in Startelf und Bank stehen (fürs Spiel springt dann automatisch jemand ein)
  function outOk(q) { return q && !(q.loan && q.loan.to); }
  function benchView(S) { if (!S.lineup.bench) return benchIds(S); var xi = S.lineup.xi || []; return S.lineup.bench.filter(function (id) { return xi.indexOf(id) < 0 && outOk(S.players.filter(function (z) { return z.id === id; })[0]); }).slice(0, 9); }
  function avail(S) { return S.players.filter(function (p) { return !p.inj && !p.ban && !p.abs && !(p.loan && p.loan.to); }); }
  function availA(S) { var a = avail(S), b = a.filter(function (p) { return !p.trib; }); return b.length >= 11 ? b : a; }
  function rateIn(p, slot) { return p.str * posFit(slot, p) * fitF(p) * (1 + p.form * 0.01); }
  var SLOTORD = ['TW', 'ST', 'IV', 'RV', 'LV', 'DM', 'OM', 'ZM', 'RM', 'LM', 'RA', 'LA'];
  function autoXI(S, form, pool) {
    var slots = FORMS[form]; var left = (pool || availA(S)).slice(); if (pool) { var lf2 = left.filter(function (p) { return !p.trib; }); if (lf2.length >= 4) left = lf2; } var xi = new Array(slots.length);
    SLOTORD.forEach(function (pos) {
      slots.forEach(function (sl, i) {
        if (sl !== pos || xi[i]) return;
        var best = null, bv = -1;
        left.forEach(function (p) { var v = rateIn(p, sl) * (p.dp === sl ? 1.08 : 1); if (v > bv) { bv = v; best = p; } });
        if (best) { xi[i] = best; left.splice(left.indexOf(best), 1); }
      });
    });
    return xi;
  }
  function currentXI(S) {
    var form = S.lineup.form; var av = avail(S); var slots = FORMS[form];
    if (S.lineup.xi) {
      var used = [], xi = slots.map(function (sl, i) { var p = S.players.filter(function (q) { return q.id === S.lineup.xi[i]; })[0]; if (p && av.indexOf(p) >= 0 && used.indexOf(p) < 0) { used.push(p); return p; } return null; });
      if (xi.some(function (p) { return !p; })) {
        var rest = av.filter(function (p) { return used.indexOf(p) < 0; });
        var fill = autoXI(S, form, rest);
        xi = xi.map(function (p, i) { if (p) return p; var f = fill[i]; if (f) rest.splice(rest.indexOf(f), 1); return f || null; });
      }
      return xi;
    }
    return autoXI(S, form);
  }
  function xiAvg(S, D) { var xi = S.lineup ? currentXI(S) : autoXI(S, '4-4-2'); var slots = FORMS[S.lineup ? S.lineup.form : '4-4-2']; var sum = 0; for (var i = 0; i < 11; i++) sum += xi[i] ? rateIn(xi[i], slots[i]) : 0; return sum / 11; }
  function teamStr(S, D, home) {
    var e = eff(S, D); var s = xiAvg(S, D);
    s += (S.moral - 60) / 20 + e.taktik + (S.train.focus === 'taktik' ? 0.8 : 0) + (S.talk && S.talk.d === S.date ? S.talk.b : 0);
    if (S.chem && S.chem.until >= S.date) s += S.chem.v;
    s += Math.min(2, ((S.lvMoral || 1) - 1) * 0.25) + (S.trainBoost || 0);
    var xiIds = currentXI(S).map(function (p) { return p ? p.id : null; });
    if (S.captain && xiIds.indexOf(S.captain) >= 0) s += 0.3;
    (function () { var xi0 = currentXI(S).filter(Boolean); if (!xi0.length) return; s += (xi0.reduce(function (a, q) { return a + skExp(q); }, 0) / xi0.length - 3) * 0.3; if (xi0.some(function (q) { return skTraits(q).pers === 0; })) s += 0.25; })();
    ['pen', 'fk', 'ck'].forEach(function (k) { if (S[k] && xiIds.indexOf(S[k]) >= 0) s += 0.15; });
    s += home ? 1.0 + e.heim : e.away;
    if (S.start && S.season === +S.start.slice(0, 4)) s += 0.5;
    return Math.max(1, s);
  }

  // ============================================================ Spiel
  // Balancing 11/2026: Gegner +15 %, kein Pauschalvorteil mehr für den eigenen Verein (vorher +2 und bis zu +3 bei Überlegenheit)
  var OPPF = 1.2; function oppS(t) { return (t && t.s || 0) * OPPF; }
  function svwEdge(S, ms, os, o) { var lh = (S.hist || [])[(S.hist || []).length - 1], newUp = lh && lh.lvl > S.lvl && o.comp === 'liga'; return (newUp ? -1.2 : 0) + (o.comp === 'test' ? 3.5 : 0) + ((o.opp.l || S.lvl) > S.lvl ? 0.6 : 0); }
  function fastResult(S, D, o) {
    var xi = currentXI(S); var ms = teamStr(S, D, o.home === true); var os = oppS(o.opp) + gauss() * 1.2 + (o.home === false ? 1.0 : 0) - clamp(((o.opp.l || S.lvl) - S.lvl) * 1.6, -8, 8);
    os -= svwEdge(S, ms, os, o);
    var st = FSTYLE[S.lineup.form] || [1, 1]; var e = eff(S, D);
    if (o.comp !== 'test' && R() < 0.04) os -= 1.5; var dd = clamp(ms - os, -20, 20); var lf = 1.2 * Math.exp(0.075 * dd) * st[0], la = 1.2 * Math.exp(-0.075 * dd) * st[1];
    if (o.home === true) { lf *= 1.05; la *= 0.95; } else if (o.home === false) { lf *= 0.95; la *= 1.05; }
    lf *= 1 + bon(S, 'att') + (o.home === false ? bon(S, 'attAway') : 0); lf += bon(S, 'late') + bon(S, 'early'); la *= Math.max(0.6, 1 - bon(S, 'def') - bon(S, 'gk') - bon(S, 'defLate') * 0.15 - (o.home === true ? bon(S, 'defHome') : 0));
    var gf = poisson(lf), ga = poisson(la); if (gf - ga > 3) gf = ga + 3 + Math.floor((gf - ga - 3) / 2); if (ga - gf > 3) ga = gf + 3 + Math.floor((ga - gf - 3) / 2); var on = xi.filter(Boolean);
    var res = { gf: gf, ga: ga, ms: ms, os: os, scorers: [], played: {}, inj: [], cards: [], pen: null };
    on.forEach(function (p) { res.played[p.id] = { min: 90, g: 0, a: 0, sv: 0, grade: 0, sub: false }; });
    for (var g = 0; g < gf; g++) {
      var sc = wpick(on, function (p) { return SW[p.dp] * scW(p); });
      var as = R() < 0.75 ? wpick(on.filter(function (p) { return p !== sc; }), function (p) { return AW[p.dp] * asW(p); }) : null;
      res.played[sc.id].g++; if (as) res.played[as.id].a++;
      res.scorers.push({ min: rint(1, 90), n: sc.n, a: as ? as.n : null });
    }
    res.scorers.sort(function (a, b) { return a.min - b.min; });
    on.forEach(function (p) {
      var x = res.played[p.id];
      if (p.dp === 'TW') x.sv = Math.max(0, Math.round(la * 2 + gauss()));
      x.grade = clamp(3.5 - (gf - ga) * 0.35 - (p.str - ms) * 0.04 + gauss() * 0.7 - x.g * 0.6 - x.a * 0.3 - x.sv * 0.08, 1, 6);
      var pr = 0.02 * [0.6, 1, 1.8][skTraits(p).ip] * (S.pitch.type === 'kunst' && pitchCond(S) < 0.2 ? 1.4 : 1) * (p.fit < 60 ? 1.6 : 1) * (1 + e.inj / 100) * (S.train.int === 'hart' ? 1.15 : 1);
      if (R() < pr) res.inj.push({ id: p.id, days: injDays(e) });
      if (o.comp !== 'test') { var cq = skTraits(p).pers === 5 ? 0.6 : 1; if (R() < 0.0035 * cq) res.cards.push({ id: p.id, t: 'r' }); else if (R() < 0.085 * cq) res.cards.push({ id: p.id, t: 'y' }); }
    });
    if (o.ko && gf === ga) {
      res.et = true; var eg = poisson(lf / 3), ea = poisson(la / 3);
      for (var q = 0; q < eg; q++) { var sc2 = wpick(on, function (p) { return SW[p.dp] * scW(p); }); res.played[sc2.id].g++; res.scorers.push({ min: rint(91, 120), n: sc2.n, a: null }); }
      res.gf += eg; res.ga += ea; gf = res.gf; ga = res.ga; on.forEach(function (p) { res.played[p.id].min = 120; });
      if (gf === ga) { var pb = S.pen && on.some(function (p) { return p.id === S.pen; }) ? 0.6 : 0; res.pen = R() < 1 / (1 + Math.exp(-(ms - os + pb * 6) * 0.08)) ? 'n.E. gewonnen' : 'n.E. verloren'; }
    }
    res.stats = mkStats(ms, os, lf, la, gf, ga, res.et ? 120 : 90);
    return res;
  }
  function mkStats(ms, os, lf, la, gf, ga, mins) {
    var f = mins / 90; var poss = Math.round(clamp(50 + (ms - os) * 1.3 + gauss() * 4, 22, 78));
    var shF = gf + poisson(lf * 3.2 * f), shA = ga + poisson(la * 3.2 * f), onF = gf + Math.min(shF - gf, poisson(lf * 1.3 * f)), onA = ga + Math.min(shA - ga, poisson(la * 1.3 * f));
    return { poss: [poss, 100 - poss], shots: [shF, shA], on: [onF, onA], cor: [poisson(lf * 3.5 * f), poisson(la * 3.5 * f)], fouls: [poisson(12 * f), poisson(12 * f)], pass: [Math.round(clamp(70 + (ms - os) * 0.6 + (poss - 50) * 0.3 + gauss() * 2, 48, 93)), Math.round(clamp(70 + (os - ms) * 0.6 + (50 - poss) * 0.3 + gauss() * 2, 48, 93))], off: [poisson(2 * f), poisson(2 * f)] };
  }
  function playMatch(S, D, o, res) {
    if (!res) res = fastResult(S, D, o); S.trainBoost = 0;
    if (o.comp === 'liga' && res.ga - res.gf === 1 && skv(S, 'tkM') && S.tkMs !== S.season) { S.tkMs = S.season; res.ga = res.gf; msg(S, 'erfolg', '🧠 Meistertaktiker: Ein Gegentor wurde nach Videobeweis zurückgenommen – aus der Niederlage wird ein Unentschieden!'); }
    var e = eff(S, D); var gf = res.gf, ga = res.ga, pen = res.pen, scorers = res.scorers;
    var win = gf > ga || pen === 'n.E. gewonnen', draw = gf === ga && !pen;
    var injuries = [], cards = [], grades = [], devMsgs = [], rf = S._rf != null ? S._rf : 1; S._rf = null; // rf: Belohnungsfaktor (Power/Sofortergebnis)
    S.talk = null;
    var test = o.comp === 'test';
    if (o.benefiz) { var BT = o.benefiz.tier, binc = nice(BT === 3 ? rint(5000, 8000) : BT === 2 ? rint(8000, 15000) : rint(15000, 30000)), bfg = (4 - BT) * rint(250, 600) + rint(150, 400) + (win ? 400 : 0); book(S, 'Benefizspiel', binc); S.fans = clamp(S.fans + 4 + (4 - BT) * 2 + (win ? 3 : 0), 0, 100); S.spons = clamp(S.spons + 2 + (4 - BT), 0, 100); S.fanbase = Math.round(S.fanbase * (1.02 + (4 - BT) * 0.015)); S.follow = (S.follow || 0) + bfg; S.board = clamp(S.board + 2, 0, 100); xp(S, win ? 25 : 10); S.benefizRes = { opp: o.opp.n, tier: BT, inc: binc, fg: bfg, gf: gf, ga: ga, win: win }; ownPost(S, '⚽ Benefizspiel gegen ' + o.opp.n + '! Volle Hütte im Ländchen – ' + gf + ':' + ga + '. Danke an alle! 💚❤️', 'stadion'); msg(S, 'verein', '🌟 Benefizspiel gegen ' + o.opp.n + ': ' + gf + ':' + ga + ' · Einnahmen ' + euro(binc) + ' · +' + bfg + ' Follower'); }
    if (test && !o.benefiz) { S.testsDone = (S.testsDone || 0) + 1; if (S.testsDone === 2 && !S.giftDone && S.start && S.season === +S.start.slice(0, 4)) S.giftPop = giftList(S, D); }
    var SLOTMAP = {}; (function () { var xs = S.live && S.live.on ? S.live.on : (S.lineup.xi || currentXI(S).map(function (q) { return q ? q.id : null; })); var sl = FORMS[S.lineup.form]; xs.forEach(function (id, i) { if (id != null) SLOTMAP[id] = sl[i]; }); if (S.live && S.live.st) Object.keys(S.live.st).forEach(function (id) { if (S.live.st[id].slot) SLOTMAP[id] = SLOTMAP[id] || S.live.st[id].slot; }); })();
    Object.keys(res.played).forEach(function (id) {
      var x = res.played[id]; var p = S.players.filter(function (q) { return q.id === +id; })[0]; if (!p || !x.min) return;
      p.gp++; p.xgp = (p.xgp || 0) + 1; if (p.exAdj && !test) p.exAdj = Math.min(0, p.exAdj + 1 / 18); p.recent = (p.recent || 0) + 1; p.g += x.g; p.a += x.a; if (!test) p.mins = (p.mins || 0) + (x.min || 0);
      var grade = Math.round(clamp(x.grade, 1, 6) * 10) / 10; p.gr += grade;
      if (o.comp === 'kp' || o.comp === 'mrp' || o.comp === 'dfb') { p.cgp = (p.cgp || 0) + 1; p.cg = (p.cg || 0) + x.g; p.ca = (p.ca || 0) + x.a; p.cgr = (p.cgr || 0) + grade; } if (o.comp === 'liga') { p.lgp = (p.lgp || 0) + 1; p.lg = (p.lg || 0) + x.g; p.la = (p.la || 0) + x.a; p.lgr = (p.lgr || 0) + grade; if (p.dp === 'TW' && x.min >= 60) { p.lkg = (p.lkg || 0) + 1; p.lga = (p.lga || 0) + ga; } } p.lastGrade = grade; grades.push({ id: p.id, n: p.n, pos: p.dp, grade: grade, min: x.min, g: x.g, a: x.a, sv: x.sv || 0, sub: !!x.sub });
      p.form = clamp(p.form * 0.7 + (3.5 - grade) * 1.5, -5, 5);
      var drop = (test ? rnd(8, 14) : rnd(17, 28)) * x.min / 90 * (p.age >= 31 ? 1.1 : 1) * clamp(1 - (skAt(p, 'aus') - p.str) / 50, 0.75, 1.25) * (skTraits(p).pers === 7 ? 0.88 : 1) * (S.live && S.live.wx && S.live.wx.heat ? 1.25 : 1); p.fit = clamp(p.fit - drop, 20, 100);
      // Entwicklung durch Leistung
      var spos = SLOTMAP[id]; if (x.min >= 30 && spos && !test) { p.posG = p.posG || {}; p.posG[spos] = (p.posG[spos] || 0) + 1; }
      if (x.min >= 30 && !test) { if (p.dp2 && spos === p.dp2) { if (p.f2 == null) p.f2 = rnd(0.73, 0.82); if (p.f2 < 1) { p.f2 = Math.min(1, p.f2 + rnd(0.012, 0.026)); if (p.f2 >= 1 && (p.posG[p.dp2] || 0) >= 12 && !p.posAsked && !S.posPop) S.posPop = { pid: p.id, w: 2 }; } } if (p.dp3 && spos === p.dp3 && p.f3 < 1) { p.f3 = Math.min(1, p.f3 + rnd(0.012, 0.026)); if (p.f3 >= 1 && (p.posG[p.dp3] || 0) >= 12 && !p.posAsked3 && !S.posPop) S.posPop = { pid: p.id, w: 3 }; } }
      var cs = ga === 0 && (p.dp === 'TW' || p.dp === 'IV' || p.dp === 'RV' || p.dp === 'LV') ? 0.05 : 0;
      var dev = (3.5 - grade) * 0.06 + x.g * 0.05 + x.a * 0.03 + (x.sv || 0) * 0.015 + cs;
      if (dev > 0) dev *= (0.6 + 0.14 * (p.tal || 3)) * rf;
      dev *= 0.4 * (p.age <= 23 ? 1.3 : p.age <= 28 ? 1 : p.age <= 31 ? 0.6 : 0.4) * (x.sub ? 1.25 : 1) * (test ? 0.5 : 1) * (x.min / 90);
      var bef = p.str; if (dev > 0) p.str = Math.min(p.pot + 1, p.str + dev); else p.str = Math.max(1, p.str + dev * 0.6); p.dStr = Math.round(p.str) - Math.round(bef); grades[grades.length - 1].dStr = p.dStr; grades[grades.length - 1].tal = p.tal;
      if (!test && p.gp >= 8) {
        var avg = p.gr / p.gp;
        if (avg <= 2.4 && p.tal < 5 && R() < 0.012) { p.tal++; p.pot = Math.min(99, p.pot + 5); devMsgs.push('⭐ ' + p.n + ' spielt überragend – sein Talent steigt auf ' + p.tal + ' Sterne!'); }
        else if (avg >= 4.6 && p.tal > 1 && R() < 0.012) { p.tal--; p.pot = Math.max(p.str, p.pot - 4); devMsgs.push('📉 ' + p.n + ' enttäuscht dauerhaft – sein Talent sinkt auf ' + p.tal + ' Sterne.'); }
      }
    });
    res.inj.forEach(function (j) { var p = S.players.filter(function (q) { return q.id === j.id; })[0]; if (!p) return; p.inj = Math.max(p.inj, j.days); injuries.push(p.n + ' (' + j.days + ' Tage)'); });
    if (!test) res.cards.forEach(function (c) {
      var p = S.players.filter(function (q) { return q.id === c.id; })[0]; if (!p) return;
      if (c.t === 'r') { p.ban = rint(1, 3); cards.push(p.n + ' (Rot, ' + p.ban + ' Sp. Sperre)'); }
      else { p.yc = (p.yc || 0) + 1; if (p.yc % 5 === 0) { p.ban = 1; cards.push(p.n + ' (5. Gelbe, 1 Sp. Sperre)'); } }
    });
    if (!test) S.players.forEach(function (p) { if (p.abs) p.abs--; });
    if (!test) S.players.forEach(function (p) { if (p.ban && !res.played[p.id] && !res.cards.some(function (c) { return c.id === p.id; })) p.ban--; });
    devMsgs.forEach(function (m) { msg(S, 'training', m); });
    res.inj.forEach(function (j) { var p = S.players.filter(function (q) { return q.id === j.id; })[0]; if (p && j.days >= 21) infoMail(S, 'Mannschaftsarzt', 'Verletzung: ' + p.n, p.n + ' hat sich im Spiel gegen ' + o.opp.n + ' verletzt und fällt voraussichtlich ' + j.days + ' Tage aus.', 'info'); });
    grades.forEach(function (g) { g.y = res.cards.filter(function (c) { return c.id === g.id && c.t === 'y'; }).length; g.r = res.cards.some(function (c) { return c.id === g.id && c.t === 'r'; }); g.inj = res.inj.some(function (j) { return j.id === g.id; }); });
    var potm = grades.slice().sort(function (a, b) { return a.grade - b.grade; })[0] || null;
    var ms = res.ms || teamStr(S, D, o.home === true), os = res.os || o.opp.s;
    if (!test) {
      var mprot = e.moralschutz ? 0.5 : 1;
      S.moral = clamp(S.moral + (win ? 5 * rf : draw ? 0 : -5 * mprot), 10, 100);
      S.fans = clamp(S.fans + (win ? 1.2 * rf : draw ? 0.2 * rf : (S.fans > 80 ? -2.2 : -1.6)), 0, 100);
      S.spons = clamp((S.spons || 60) + (win ? 0.8 : draw ? 0.1 : -0.7), 0, 100);
      var exp = ms - os;
      S.board = clamp(S.board + (win ? 0.5 : draw ? (exp > 4 ? -0.3 : 0.1) : (exp > 4 ? -1.1 : -0.5)), 0, 100);
      try { S.strHist = (S.strHist || []).concat([Math.round(xiAvg(S, D) * 10) / 10]).slice(-20); if (S.masc) { S.mascBond = S.mascBond || {}; S.mascBond[S.masc] = Math.min(100, (S.mascBond[S.masc] || 0) + (win ? 0.4 : draw ? 0.15 : 0)); } } catch (e) {}
      xp(S, Math.round((win ? 10 : draw ? 5 : 2) * rf)); if (win) { S.wins = (S.wins || 0) + 1; S.fwWins = (S.fwWins || 0) + 1; milestones(S); } else if (draw) S.draws = (S.draws || 0) + 1; else S.losses = (S.losses || 0) + 1; S.streak = win ? (S.streak || 0) + 1 : 0; if (S.streak >= 5) ach(S, 'serie5', '', true);
      if (!test) misTrack(S, { win: win, gf: gf, ga: ga, home: o.home !== false, hat: grades.some(function (g) { return g.g >= 3; }) });
      else { if (win) mcAdd(S, 't_win'); else if (gf === ga) mcAdd(S, 't_draw'); mcAdd(S, 't_goal', gf); if (ga === 0) mcAdd(S, 't_csheet'); if (win && o.home !== false) mcAdd(S, 't_homewin'); if (win && o.home === false) mcAdd(S, 't_awaywin'); if (win && gf - ga >= 3) mcAdd(S, 't_bigwin'); if (gf >= 3) mcAdd(S, 't_scored3'); } // Testspiele zählen für Tagesmissionen mit
      grades.forEach(function (g) { if (g.g >= 3) { ach(S, 'hattrick', g.n + ' gegen ' + o.opp.n); ownPost(S, '⚽⚽⚽ HATTRICK! ' + g.n + ' schnürt gegen ' + o.opp.n + ' den Dreierpack. Was für ein Tag! 🎩🔥', 'tor'); } });
      (function () { var hy = 0; if (win && gf - ga >= 3) hy = 0.6; if (win && o.ko) { hy = Math.max(hy, 0.8); ownPost(S, '🏆 Eine Runde weiter! ' + gf + ':' + ga + ' gegen ' + o.opp.n + ' im ' + o.label + '. Weiter geht die Pokalreise! 💚', 'pokal'); }
        if (win && o.comp === 'liga') { try { var tb0 = table(S, null, S.fix.filter(function (f) { return f.md < o.md; })); if (tb0[0] && tb0[0].n === o.opp.n) { hy = Math.max(hy, 0.9); ownPost(S, '👑 Den Spitzenreiter geschlagen! ' + gf + ':' + ga + ' gegen ' + o.opp.n + '. Die Macht im Ländchen hat zugeschlagen! 🔴🟢💪', 'fans'); } else if (tb0.slice(0, 3).some(function (t) { return t.n === o.opp.n; })) hy = Math.max(hy, 0.7); } catch (e) {} }
        if (hy) hypeUp(S, hy); })();
      if (o.comp === 'liga') { S.gamesTotal = (S.gamesTotal || 0) + 1; S.ptsTotal = (S.ptsTotal || 0) + (win ? 3 : draw ? 1 : 0); S.goalsTotal = (S.goalsTotal || 0) + gf; }
      if (win && o.ko && o.opp.l && o.opp.l <= S.lvl - 3) ach(S, 'sensation', o.opp.n + ' (' + o.label + ')');
      if (gf - ga >= 5) ach(S, 'kantersieg', gf + ':' + ga + ' gegen ' + o.opp.n);
      checkBars(S);
    } else { S.moral = clamp(S.moral + (win ? 1 : draw ? 0 : -1), 10, 100); }
    var att = 0;
    if (o.home === true || (o.home === null && !test)) {
      att = attendance(S, D, o); if (!test && att > 0) { S.attLog = S.attLog || []; S.attLog.push(att); if (S.attLog.length > 30) S.attLog.shift(); }
      if (att > 0) {
        var price = S.ticket * (test && !o.benefiz ? 0.5 : 1) * (o.comp === 'dfb' ? 1.5 : 1) * (o.benefiz ? 1.5 : 1);
        var t = att * price * (1 + e.ticket / 100);
        var attract = clamp(1 + (o.opp.s - lvMid(D, S.lvl)) * 0.03 + (o.opp.l && o.opp.l < S.lvl ? (S.lvl - o.opp.l) * 0.15 : 0), 0.7, 2.5);
        var cf = concF(S), food = att * foodBase(S.lvl) * (1 + e.food / 100) * attract * 0.6 * cf, drinks = att * foodBase(S.lvl) * (1 + e.food / 100) * attract * 0.55 * cf;
        if (o.comp === 'mrp' && o.home !== false && /Achtelfinale|Viertelfinale|Halbfinale|Finale/.test(o.label || '')) { var mb = /Halbfinale|Finale/.test(o.label) ? 3.2 : 2.4; t *= mb; food *= mb * 0.8; drinks *= mb * 0.8; }
        if (o.home === null) { t *= 0.5; food = 0; drinks = 0; }
        t *= rf; food *= rf; drinks *= rf; book(S, 'Zuschauereinnahmen', Math.round(t)); book(S, 'Speisen', Math.round(food)); book(S, 'Getränke', Math.round(drinks)); if (!S.stadInc || S.stadInc.s !== S.season) S.stadInc = { s: S.season, t: 0, f: 0, n: 0, prev: S.stadInc && S.stadInc.s === S.season - 1 ? { t: S.stadInc.t, f: S.stadInc.f, n: S.stadInc.n } : null }; if (o.home !== false) { S.stadInc.t += Math.round(t); S.stadInc.f += Math.round(food + drinks); S.stadInc.n++; } S.lastGate = { d: S.date, amt: Math.round(t + food + drinks), t: Math.round(t), f: Math.round(food + drinks), opp: o.opp.n, fx: true };
      }
    }
    if (!test) book(S, 'Schiri & Fahrtkosten', -nice(D.lv[S.lvl].admin * 0.3 + 60));
    var rep = { d: o.d, comp: o.comp, label: o.label, opp: o.opp.n, oppLvl: o.opp.l, home: o.home, gf: gf, ga: ga, pen: pen, et: !!res.et, stats: res.stats || null, scorers: scorers, att: att, inj: injuries, cards: cards, xi: grades.map(function (g) { return g.n; }), grades: grades, potm: potm, win: win, draw: draw };
    S.reports.push(rep);
    var resT = (o.home === false ? o.opp.n + ' – ' + D.club + ' ' + ga + ':' + gf : D.club + ' – ' + o.opp.n + ' ' + gf + ':' + ga) + (pen ? ' (' + pen + ')' : res.et ? ' n.V.' : '');
    msg(S, o.comp === 'liga' ? 'liga' : test ? 'test' : 'pokal', o.label + ': ' + resT + (potm ? ' · Spieler des Spiels: ' + potm.n : '') + (injuries.length ? ' · Verletzt: ' + injuries.join(', ') : '') + (cards.length ? ' · Gesperrt: ' + cards.join(', ') : ''));
    if (!test) { var np = win ? rint(1, 3) + (gf - ga >= 3 ? 1 : 0) + (o.ko ? 1 : 0) : draw ? rint(0, 1) : rint(0, 1); for (var k = 0; k < np; k++) if (R() < 0.7) makePost(S, null, rep); }
    return rep;
  }

  // ============================================================ Live-Spiel (Matchday)
  var CM = {
    kick: ['Anpfiff! Der Ball rollt.', 'Los geht’s – der Schiri pfeift an!'],
    goal: ['TOOOR! {p} trifft{a}!', 'Drin! {p} schiebt eiskalt ein{a}.', 'Was für ein Ding von {p}{a}! Der Torwart ist chancenlos.', 'Kopfball {p} – TOR{a}!'],
    goalA: ['Gegentor. {o} trifft, unsere Abwehr sah nicht gut aus.', '{o} kontert eiskalt – Gegentreffer.', 'Distanzschuss von {o} – unhaltbar.'],
    save: ['Glanzparade von {p}!', '{p} fischt den Ball aus dem Winkel!', 'Starke Reaktion von {p} auf der Linie.'],
    chance: ['{p} scheitert knapp am Pfosten!', 'Großchance für {p} – drüber!', '{p} zieht ab, knapp vorbei.', 'Schöner Spielzug über {q}, aber {p} trifft den Ball nicht richtig.'],
    chanceA: ['{o} mit einer Großchance – knapp vorbei!', 'Lattentreffer für {o}. Glück gehabt!'],
    foul: ['Foul von {p} im Mittelfeld.', 'Harter Zweikampf, {p} sieht den Pfiff gegen sich.'],
    foulA: ['{o} foult rüde – Freistoß für uns.', 'Taktisches Foul von {o}.'],
    yellow: ['Gelbe Karte für {p}.', '{p} sieht Gelb nach einem Zweikampf.'],
    yellowA: ['Gelb für einen Spieler von {o}.'],
    red: ['ROT! {p} muss vom Platz!', 'Glatt Rot für {p} – wir sind nur noch zu zehnt.'],
    inj: ['{p} bleibt verletzt liegen und muss behandelt werden.', 'Oh nein, {p} humpelt – das sieht nicht gut aus.'],
    penF: ['ELFMETER für uns! {p} wurde im Strafraum gelegt.'], penA: ['Elfmeter gegen uns! Unser Verteidiger kam zu spät.'],
    play: ['Schöne Kombination über {p} und {q}.', '{p} treibt den Ball nach vorne.', 'Wir haben das Spiel im Griff, {p} verteilt die Bälle.', '{o} macht Druck, wir stehen tief.']
  };
  function cm(k, o) { return pick(CM[k]).replace(/\{p\}/g, o.p || '').replace(/\{q\}/g, o.q || '').replace(/\{o\}/g, o.o || '').replace(/\{a\}/g, o.a ? ' – Vorlage ' + o.a : ''); }
  function liveOn(S) { var L = S.live; return L.on.map(function (id) { return id == null ? null : S.players.filter(function (p) { return p.id === id; })[0] || null; }); }
  function liveStr(S, D) {
    var L = S.live; var slots = FORMS[S.lineup.form]; var on = liveOn(S); var sum = 0;
    on.forEach(function (p, i) { if (p) { var tired = clamp(1 - Math.max(0, L.min - (L.st[p.id].from || 0) - 60) * 0.002, 0.9, 1); sum += rateIn(p, slots[i]) * tired * (L.st[p.id].inj ? 0.5 : 1); } });
    var miss = on.filter(function (p) { return !p; }).length; // jede Lücke (Rot / verletzt ohne Wechsel) kostet zusätzlich
    return sum / 11 + L.base + (L.inst ? 0 : 0.8) - (L.gkEm ? 1.6 : 0) - miss * 0.8; // Notfall-Torwart: Abwehr deutlich schwächer
  }
  function gkPick(S, D, pid) {
    var L = S.live; if (!L || !L.pause || L.pause.type !== 'gk') err('Gerade ist keine Torwart-Entscheidung offen.'); var slot = L.pause.slot, on = liveOn(S);
    var cands = on.map(function (p, i) { return p ? { p: p, i: i } : null; }).filter(function (x) { return x && x.i !== slot; });
    var c = pid != null ? cands.filter(function (x) { return x.p.id === +pid; })[0] : cands.slice().sort(function (a, b) { return rateIn(b.p, 'TW') - rateIn(a.p, 'TW'); })[0]; if (!c) err('Spieler nicht auf dem Platz.');
    L.on[slot] = c.p.id; L.on[c.i] = null; (L.injOut = L.injOut || []).push(c.i); L.st[c.p.id].slot = 'TW'; L.gkEm = c.p.id; L.pause = null;
    liveEv(L, 'sub', '🧤 ' + c.p.n + ' geht ins Tor – wir spielen mit zehn Mann und einem Notfall-Keeper.');
  }
  function liveMinLabel(L) { if (L.half >= 3) return String(L.min); return L.half === 1 ? (L.min > 45 ? '45+' + (L.min - 45) : String(L.min)) : (L.min > 90 ? '90+' + (L.min - 90) : String(L.min)); }
  function liveEv(L, k, t, x, y, w) { L.ev.push(x != null ? { m: liveMinLabel(L), k: k, t: t, x: Math.round(x), y: Math.round(clamp(y, 3, 97)) } : { m: liveMinLabel(L), k: k, t: t }); if ((k === 'goal' || k === 'goalA') && x != null) (L.goals = L.goals || []).push([Math.round(x), Math.round(clamp(y, 5, 95)), k === 'goal' ? 1 : 0]); if (x != null) for (var i = 0; i < (w || 3); i++) L.heat.push([Math.round(clamp(x + gauss() * 4, 1, 99)), Math.round(clamp(y + gauss() * 6, 1, 99))]); }
  function liveStart(S, D) {
    if (S.live) return S.live; var q = S.mq[0]; if (!q) err('Heute ist kein Spiel.');
    if (S.pending.length) err('Erst die offenen Entscheidungen treffen.');
    var savedLU = JSON.parse(JSON.stringify(S.lineup)); var wasAuto = !S.lineup.xi; var xi = currentXI(S); S.lineup.xi = xi.map(function (p) { return p ? p.id : null; });
    var o = q.o; var ms = teamStr(S, D, o.home === true); var base = ms - xiAvg(S, D);
    var L = S.live = { bench: benchIds(S), qid: q.id, label: o.label, comp: o.comp, opp: o.opp.n, home: o.home, ko: !!o.ko, d: o.d, min: 0, half: 1, gf: 0, ga: 0, ev: [], heat: [], subs: 0, maxSubs: o.comp === 'test' ? 9 : 5, wx: wxFor(o.d || S.date, o.opp && o.opp.n), base: base, os: oppS(o.opp) + gauss() * 1.2 + (o.home === false ? 1.0 : 0) - clamp(((o.opp.l || S.lvl) - S.lvl) * 1.6, -8, 8), on: S.lineup.xi.slice(), red: [], st: {}, stop1: rint(1, 3), stop2: rint(2, 4), pause: null, done: false, scorers: [], cards: [], inj: [], wasAuto: wasAuto, xpPen: 0, ss: { pos: 0, n: 0, shF: 0, shA: 0, onF: 0, onA: 0, corF: 0, corA: 0, foulF: 0, foulA: 0, offF: 0, offA: 0 } };
    L.os -= svwEdge(S, ms, L.os, o); L.savedLU = savedLU;
    xi.forEach(function (p) { if (p) L.st[p.id] = { from: 0, to: null, g: 0, a: 0, sv: 0, gr: 3.5, sub: false }; });
    liveEv(L, 'kick', cm('kick', {}), 50, 50, 1);
    return L;
  }
  // ---------- Spielfeld-Engine: Ballwege pro Minute (für Heatmap, Momentum, Drittel und die Animation)
  // Koordinaten: x 0 = eigenes Tor … 100 = gegnerisches Tor, y 0–100 quer. Gespeichert in L.pz als flache Liste [x, y, Team(1 wir / 0 Gegner), …]
  var PZ_STEPS = 6;
  function pitchMinute(L, dd, men, evs) {
    if (!L.pz) L.pz = []; if (!L.mom) L.mom = []; var B = L.pzB || (L.pzB = { x: 50, y: 50, t: R() < 0.5 ? 1 : 0 });
    var redD = (11 - men) - (L.oppRed || 0), diff = L.gf - L.ga;
    var pF = clamp(0.5 + dd * 0.012 + (L.home === true ? 0.03 : L.home === false ? -0.03 : 0) + (diff < 0 ? 0.04 : diff > 0 ? -0.03 : 0) - redD * 0.05, 0.22, 0.78);
    var push = function (x, y, t) { L.pz.push(Math.round(clamp(x, 2, 98)), Math.round(clamp(y, 3, 97)), t); };
    var thr = 0, n = 0, track = function (x, t) { thr += t ? Math.max(0, x - 45) / 55 : -Math.max(0, 55 - x) / 55; n++; };
    // Ereignisse dieser Minute bestimmen das Ziel des Ballwegs
    var key = null; evs.forEach(function (e) { if (e.x == null) return; var pr = { goal: 5, goalA: 5, pen: 4, penA: 4, chance: 3, chanceA: 3, save: 3, play: 2 }[e.k] || 1; if (!key || pr > key.pr) key = { e: e, pr: pr }; });
    var steps = key ? PZ_STEPS - 2 : PZ_STEPS;
    for (var i = 0; i < steps; i++) {
      var att = B.t === 1, prog = att ? B.x / 100 : (100 - B.x) / 100, pOwn = att ? pF : 1 - pF;
      var lose = 0.07 + prog * 0.16 + (0.5 - pOwn) * 0.22;
      if (R() < lose) { B.t = 1 - B.t; B.x += (att ? -1 : 1) * rnd(2, 8); }
      else { var adv = gauss() * 9 + 5 + pOwn * 9; B.x += att ? adv : -adv; B.y += gauss() * 15 + (50 - B.y) * 0.12; }
      if (B.x > 92 && B.t === 1) { B.t = 0; B.x = rnd(86, 94); B.y = rnd(35, 65); } else if (B.x < 8 && B.t === 0) { B.t = 1; B.x = rnd(6, 14); B.y = rnd(35, 65); } // Abschluss vorbei → Abstoß des Verteidigers
      B.x = clamp(B.x, 3, 97); B.y = clamp(B.y, 4, 96); push(B.x, B.y, B.t); track(B.x, B.t);
    }
    if (key) { var e = key.e, us = { goal: 1, chance: 1, pen: 1, play: 1, foulA: 1, yellowA: 1, redA: 1, goalA: 0, chanceA: 0, penA: 0, save: 0, foul: 0 }[e.k]; if (us == null) us = B.t; // wer hatte bei dem Ereignis den Ball
      var mx = (B.x + e.x) / 2 + gauss() * 4, my = (B.y + e.y) / 2 + gauss() * 8; push(mx, my, us); track(mx, us); push(e.x, e.y, us); track(e.x, us); B.x = e.x; B.y = e.y; B.t = us;
      if (e.k === 'goal') { B.x = 50; B.y = 50; B.t = 0; thr += 2; } else if (e.k === 'goalA') { B.x = 50; B.y = 50; B.t = 1; thr -= 2; }
      else if (e.k === 'chance') { B.t = 0; B.x = rnd(88, 95); thr += 1; } else if (e.k === 'chanceA') { B.t = 1; B.x = rnd(5, 12); thr -= 1; } else if (e.k === 'save') { B.t = 1; B.x = rnd(6, 12); thr -= 0.8; } }
    L.mom.push(Math.round(clamp(thr / Math.max(1, n) * 140, -100, 100)));
  }
  function liveScorer(S, on, w) { var c = on.filter(Boolean); return c.length ? wpick(c, function (p) { return w[p.dp] * (w === AW ? asW(p) : scW(p)); }) : null; }
  function scW(p) { var k = skillsOf(p); return p.str * 0.45 + k.sch * 0.4 + k.kop * 0.15; }
  function asW(p) { var k = skillsOf(p); return (p.str * 0.5 + k.pas * 0.3 + k.fla * 0.2) * (skTraits(p).pers === 2 ? 1.3 : 1); }
  function liveMinute(S, D) {
    var L = S.live; L.min++;
    var on = liveOn(S); var ms = liveStr(S, D); var os = L.os;
    var st = FSTYLE[S.lineup.form] || [1, 1]; var hf = L.home === true ? 1.05 : L.home === false ? 0.95 : 1;
    var men = on.filter(Boolean).length, slF = FORMS[S.lineup.form], gapF = 1, gapA = 1; on.forEach(function (p, i) { if (p) return; var g = slF[i] === 'TW' ? 'TW' : GRP[slF[i]]; gapF *= { TW: 0.96, AB: 0.95, MF: 0.88, ST: 0.8 }[g] || 0.9; gapA *= { TW: 1.6, AB: 1.22, MF: 1.1, ST: 1.03 }[g] || 1.1; }); var redF = 1 / Math.pow(0.88, L.oppRed || 0);
    var dd = clamp(ms - os, -20, 20); var lf = 1.2 * Math.exp(0.075 * dd) * st[0] * hf * redF * gapF / 90, la = 1.2 * Math.exp(-0.075 * dd) * st[1] * (2 - hf) / redF * gapA / 90;
    if (L.gf - L.ga >= 3) { lf *= 0.55; la *= 1.15; } else if (L.ga - L.gf >= 3) { la *= 0.55; lf *= 1.15; }
    lf *= 1 + bon(S, 'att') + (L.home === false ? bon(S, 'attAway') : 0); la *= Math.max(0.6, 1 - bon(S, 'def') - bon(S, 'gk') - (L.home === true ? bon(S, 'defHome') : 0) - (L.min >= 80 ? bon(S, 'defLate') : 0)); if (L.min >= 88 && L.half === 2) lf += bon(S, 'late') / 3; if (L.min <= 10 && L.half === 1) lf += bon(S, 'early') / 10;
    var tw = on.filter(function (p) { return p && p.dp === 'TW'; })[0] || null;
    var pr = function (p) { return p ? p.n : 'unser Mann'; };
    var SS = L.ss; SS.pos += clamp(50 + (ms - os) * 1.3 + gauss() * 8, 15, 85); SS.n++;
    if (R() < lf * 2.4) { SS.shF++; if (R() < 0.33) SS.onF++; } if (R() < la * 2.4) { SS.shA++; if (R() < 0.33) SS.onA++; }
    if (R() < lf * 3.5) SS.corF++; if (R() < la * 3.5) SS.corA++; if (R() < 0.022) SS.offF++; if (R() < 0.022) SS.offA++; if (R() < 0.06) SS.foulF++; if (R() < 0.06) SS.foulA++;
    var evN = L.ev.length;
    if (L.wx && L.wx.heat && R() < 0.08) { var hp = pick(on.filter(Boolean)); if (hp) hp.fit = clamp(hp.fit - 1, 20, 100); }
    if (L.wx && L.wx.wet && R() < (L.wx.c === 'storm' ? 0.006 : 0.003)) { if (R() < 0.5) { var ss = liveScorer(S, on, SW); if (ss) { L.gf++; L.st[ss.id].g++; L.st[ss.id].gr -= 0.4; L.scorers.push({ min: L.min, ml: liveMinLabel(L), n: ss.n, a: null }); liveEv(L, 'goal', 'TOR! Bei dem Regen rutscht dem Torwart ein harmloser Schuss von ' + ss.n + ' durch die Hände!', rnd(88, 97), rnd(35, 65), 6); return; } } else { var ktw = on.filter(function (p) { return p && p.dp === 'TW'; })[0]; L.ga++; liveEv(L, 'goalA', 'Pech! Der nasse Ball rutscht ' + (ktw ? ktw.n : 'unserem Keeper') + ' durch die Hände – Gegentor für ' + L.opp + '.', rnd(3, 12), rnd(35, 65), 6); if (ktw) L.st[ktw.id].gr += 0.4; return; } }
    if (R() < lf * 0.93) {
      var sc = liveScorer(S, on, SW); var as = R() < 0.75 ? liveScorer(S, on.filter(function (p) { return p !== sc; }), AW) : null;
      if (sc) { L.gf++; if (L.min >= 80 && L.comp !== 'test') { if (L.gf === L.ga) { xp(S, 1); L.xpFx = (L.xpFx || []).concat([{ t: 'Später Ausgleich!', x: 1 }]); } else if (L.gf === L.ga + 1) { xp(S, 5); L.xpFx = (L.xpFx || []).concat([{ t: 'Last-Minute-Führung!', x: 5 }]); } } L.st[sc.id].g++; L.st[sc.id].gr -= 0.7; if (as) { L.st[as.id].a++; L.st[as.id].gr -= 0.4; } L.scorers.push({ min: L.min, ml: liveMinLabel(L), n: sc.n, a: as ? as.n : null }); liveEv(L, 'goal', cm('goal', { p: sc.n, a: as ? as.n : null }), rnd(88, 97), rnd(35, 65), 6); on.forEach(function (p) { if (p) L.st[p.id].gr -= 0.04; }); }
    } else if (R() < la * 0.93) {
      L.ga++; liveEv(L, 'goalA', cm('goalA', { o: L.opp }), rnd(3, 12), rnd(35, 65), 6);
      var culp = pick(on.filter(function (p) { return p && (p.dp === 'TW' || GRP[p.dp] === 'AB' || p.dp === 'DM'); })); on.forEach(function (p) { if (p && (p.dp === 'TW' || GRP[p.dp] === 'AB')) L.st[p.id].gr += 0.12; else if (p) L.st[p.id].gr += 0.03; }); if (culp) L.st[culp.id].gr += 0.3;
    } else if (R() < 0.25 / 90 * clamp(lf * 90 / 1.3, 0.5, 2)) {
      var tk = (S.pen && on.filter(function (p) { return p && p.id === S.pen; })[0]) || liveScorer(S, on, SW);
      if (tk) { L.pause = { type: 'penF', pid: tk.id, n: tk.n }; liveEv(L, 'pen', cm('penF', { p: pick(on.filter(Boolean)).n }), 88, 50, 4); return; }
    } else if (R() < 0.22 / 90 * clamp(la * 90 / 1.3, 0.5, 2) && tw) {
      L.pause = { type: 'penA', pid: tw.id, n: tw.n }; liveEv(L, 'penA', cm('penA', {}), 10, 50, 4); return;
    } else if (tw && R() < la * 2.1) { L.st[tw.id].sv++; L.st[tw.id].gr -= 0.15; liveEv(L, 'save', cm('save', { p: tw.n }), rnd(4, 12), rnd(30, 70), 3); }
    else if (R() < lf * 2.4) { var cp = liveScorer(S, on, SW); var cq = liveScorer(S, on, AW); if (cp) { L.st[cp.id].gr -= 0.05; liveEv(L, 'chance', cm('chance', { p: cp.n, q: cq ? cq.n : cp.n }), rnd(80, 95), rnd(25, 75), 3); } }
    else if (R() < la * 1.2) liveEv(L, 'chanceA', cm('chanceA', { o: L.opp }), rnd(5, 18), rnd(25, 75), 3);
    if (L.comp !== 'test' && R() < 1.6 / 90) { var yp = pick(on.filter(Boolean)); if (yp) { var already = L.cards.filter(function (c) { return c.id === yp.id && c.t === 'y'; }).length; if (already && R() < 0.5) { liveRed(S, yp, true); } else if (already) { liveEv(L, 'foul', yp.n + ' kommt nach einem Foul mit einer Ermahnung davon – Glück gehabt, er war schon verwarnt.', rnd(30, 70), rnd(10, 90), 1); } else { L.cards.push({ id: yp.id, t: 'y' }); L.st[yp.id].gr += 0.2; liveEv(L, 'yellow', cm('yellow', { p: yp.n }), rnd(30, 70), rnd(10, 90), 1); } } }
    else if (L.comp !== 'test' && R() < 0.02 / 90) { var rp = pick(on.filter(Boolean)); if (rp) liveRed(S, rp, false); }
    else if (L.comp !== 'test' && R() < 0.05 / 90 && (L.oppRed || 0) < 2) { L.oppRed = (L.oppRed || 0) + 1; liveEv(L, 'redA', (R() < 0.5 ? 'Gelb-Rot' : 'Rote Karte') + ' für ' + L.opp + '! Der Gegner ist in Unterzahl.', rnd(30, 70), rnd(10, 90), 1); }
    else if (R() < 1.6 / 90) liveEv(L, 'yellowA', cm('yellowA', { o: L.opp }), rnd(30, 70), rnd(10, 90), 1);
    else if (R() < 6 / 90) { var fp = pick(on.filter(Boolean)); if (fp) liveEv(L, 'foul', cm('foul', { p: fp.n }), rnd(25, 75), rnd(10, 90), 1); }
    else if (R() < 5 / 90) liveEv(L, 'foulA', cm('foulA', { o: L.opp }), rnd(25, 75), rnd(10, 90), 1);
    else if (R() < 4 / 90) { var a1 = pick(on.filter(Boolean)), a2 = pick(on.filter(Boolean)); if (a1) liveEv(L, 'play', cm('play', { p: a1.n, q: a2 ? a2.n : a1.n, o: L.opp }), rnd(45, 85), rnd(10, 90), 2); }
    pitchMinute(L, dd, men, L.ev.slice(evN));
    L.ev.slice(evN).forEach(function (x) { if (x.k === 'goal') { SS.shF++; SS.onF++; } else if (x.k === 'chance') { SS.shF++; if (R() < 0.35) SS.onF++; } else if (x.k === 'goalA') { SS.shA++; SS.onA++; } else if (x.k === 'save') { SS.shA++; SS.onA++; } else if (x.k === 'chanceA') SS.shA++; else if (x.k === 'foul') SS.foulF++; else if (x.k === 'foulA') SS.foulA++; });
    on.forEach(function (p) { if (!p || R() > 0.07) return; var bias = clamp((rateIn(p, p.dp) - os) * 0.012, -0.12, 0.12); var dlt = gauss() * 0.22 - bias; if (Math.abs(dlt) < 0.05) return; L.st[p.id].gr = clamp(L.st[p.id].gr + dlt, 1, 6); if (Math.abs(dlt) > 0.35 && R() < 0.5) liveEv(L, dlt < 0 ? 'play' : 'foul', dlt < 0 ? pick([p.n + ' mit einer starken Aktion – gewinnt den Zweikampf und leitet weiter.', 'Klasse Ballgewinn von ' + p.n + '!', p.n + ' mit einem feinen Pass in die Tiefe.']) : pick([p.n + ' mit einem leichten Ballverlust im Aufbau.', 'Fehlpass von ' + p.n + ' – das war unnötig.', p.n + ' verliert das Laufduell.']), rnd(25, 75), rnd(10, 90), 1); });
    var e = eff(S, D);
    on.forEach(function (p, i) {
      if (!p || L.st[p.id].inj) return;
      var ip = 0.018 / 90 * [0.6, 1, 1.8][skTraits(p).ip] * (p.fit < 60 ? 1.6 : 1) * (1 + e.inj / 100) * (S.train.int === 'hart' ? 1.15 : 1) * (S.pitch.type === 'kunst' && pitchCond(S) < 0.2 ? 1.4 : 1);
      if (R() < ip) { var days = injDays(e); L.st[p.id].inj = days; L.inj.push({ id: p.id, days: days }); liveEv(L, 'inj', cm('inj', { p: p.n + ' (' + p.dp + ')' }), rnd(20, 80), rnd(10, 90), 1); if (L.subs < L.maxSubs && avail(S).some(function (q) { return !L.st[q.id]; })) L.pause = { type: 'inj', slot: i, pid: p.id, n: p.n, pos: p.dp }; else if (FORMS[S.lineup.form][i] === 'TW') { L.st[p.id].to = L.min; L.on[i] = null; L.pause = { type: 'gk', slot: i, pid: p.id, n: p.n }; liveEv(L, 'inj', 'Kein Wechsel mehr – ein Feldspieler muss ins Tor!'); } else { L.st[p.id].to = L.min; L.on[i] = null; (L.injOut = L.injOut || []).push(i); liveEv(L, 'inj', 'Kein Wechsel mehr möglich – wir spielen mit einem Mann weniger.'); } }
    });
  }
  function liveRed(S, p, second) {
    var L = S.live; var i = L.on.indexOf(p.id); if (i < 0) return;
    L.cards.push({ id: p.id, t: 'r' }); L.st[p.id].gr += 1.5; L.st[p.id].to = L.min; L.st[p.id].red = 1; L.on[i] = null; L.red.push(i); L.redP = L.redP || {}; L.redP[i] = p.id;
    liveEv(L, 'red', second ? 'Gelb-Rot für ' + p.n + '! Wir sind in Unterzahl.' : cm('red', { p: p.n }), rnd(30, 70), rnd(10, 90), 1);
    L.pause = { type: 'red', slot: i, pid: p.id, n: p.n, pos: FORMS[S.lineup.form][i], second: !!second };
  }
  function liveStep(S, D, to) {
    var L = S.live; if (!L) err('Kein laufendes Spiel.'); if (L.done) return L;
    if (L.pause) { if (L.pause.type === 'penF' || L.pause.type === 'penA') err('Erst den Elfmeter entscheiden.'); if (L.pause.type === 'gk') gkPick(S, D, null); L.pause = null; }
    var lim = Math.max(L.min + 1, Math.min(+to || 999, 200));
    while (L.min < lim && !L.pause && !L.done) {
      if (L.half === 1 && L.min >= 45 + L.stop1) { L.ht1 = [L.gf, L.ga]; L.half = 2; L.min = 45; L.stop2 = Math.max(2, Math.round(rnd(1, 3) + L.subs * 0.5 + (L.gf + L.ga) * 0.4 + L.inj.length * 0.7)); liveEv(L, 'ht', 'Halbzeit! Es steht ' + L.gf + ':' + L.ga + '.'); L.pause = { type: 'ht' }; break; }
      if (L.half === 2 && L.min >= 90 + L.stop2) {
        if (L.ko && L.gf === L.ga) { L.half = 3; L.min = 90; liveEv(L, 'et', 'Unentschieden nach 90 Minuten – es geht in die Verlängerung (2 × 15 Minuten)! Es gibt 2 zusätzliche Wechsel.'); L.maxSubs += 2; L.etSubs = true; L.pause = { type: 'et' }; break; }
        liveEnd(S, D); break;
      }
      if (L.half === 3 && L.min >= 105) { L.half = 4; liveEv(L, 'ht', 'Seitenwechsel in der Verlängerung. Es steht ' + L.gf + ':' + L.ga + '.'); L.pause = { type: 'et2' }; break; }
      if (L.half === 4 && L.min >= 120) { liveEnd(S, D); break; }
      liveMinute(S, D);
      if (L.half === 2 && L.min === 90) { L.stop2 = Math.max(L.stop2, Math.round(rnd(1, 3) + L.subs * 0.5 + (L.gf + L.ga) * 0.4 + L.inj.length * 0.7 + (R() < 0.15 ? 2 : 0))); liveEv(L, 'stop', 'Die Nachspielzeit beträgt ' + L.stop2 + ' Minuten.'); }
    }
    return L;
  }
  function livePen(S, D, dir) {
    var L = S.live; if (!L || !L.pause || (L.pause.type !== 'penF' && L.pause.type !== 'penA')) err('Kein Elfmeter.');
    if (['l', 'm', 'r'].indexOf(dir) < 0) err('Richtung wählen.');
    var other = wpick(['l', 'm', 'r'], function (d) { return d === 'm' ? 1 : 2; }); var pp = L.pause; var ok;
    var lbl = { l: 'links', m: 'Mitte', r: 'rechts' };
    if (pp.type === 'penF') {
      var tk = S.players.filter(function (p) { return p.id === pp.pid; })[0];
      var goal = dir === other ? R() < 0.25 : R() < 0.9; ok = goal;
      if (goal) { L.gf++; L.st[tk.id].g++; L.st[tk.id].gr -= 0.6; L.scorers.push({ min: L.min, ml: liveMinLabel(L), n: tk.n + ' (FE)', a: null }); liveEv(L, 'goal', 'TOR! ' + tk.n + ' verwandelt nach ' + lbl[dir] + ', der Keeper springt nach ' + lbl[other] + '.', 92, 50, 6); xp(S, 1); L.xpPen++; }
      else { L.st[tk.id].gr += 0.5; liveEv(L, 'miss', dir === other ? 'Gehalten! Der Keeper ahnt die Ecke (' + lbl[dir] + ').' : tk.n + ' schießt ' + lbl[dir] + ' – an den Pfosten!', 92, 50, 3); }
      L.pause = { type: 'penRes', ok: ok, dir: dir, other: other, side: 'F' };
    } else {
      var saved = dir === other ? R() < 0.7 : R() < 0.04; ok = saved; var tw = S.players.filter(function (p) { return p.id === pp.pid; })[0];
      if (saved) { L.st[tw.id].sv++; L.st[tw.id].gr -= 0.8; ach(S, 'elfer', tw.n, true); liveEv(L, 'save', 'GEHALTEN! ' + tw.n + ' springt nach ' + lbl[dir] + ' und pariert den Elfmeter!', 6, 50, 4); xp(S, 1); L.xpPen++; }
      else { L.ga++; liveEv(L, 'goalA', 'Der Elfmeter sitzt (' + lbl[other] + '), ' + tw.n + ' war in der falschen Ecke (' + lbl[dir] + ').', 6, 50, 5); }
      L.pause = { type: 'penRes', ok: ok, dir: dir, other: other, side: 'A' };
    }
    return L;
  }
  function liveSub(S, D, slot, pin) {
    var L = S.live; if (!L || L.done) err('Kein laufendes Spiel.');
    if (L.subs >= L.maxSubs) err('Alle ' + L.maxSubs + ' Wechsel sind verbraucht.');
    slot = +slot; if (L.red.indexOf(slot) >= 0) err('Nach einer Roten Karte darf niemand nachrücken.');
    var np = getP(S, pin); if (L.st[np.id]) err(np.n + ' war schon im Spiel.'); if (L.bench && L.bench.indexOf(np.id) < 0) err(np.n + ' sitzt nicht auf der Bank.'); if (avail(S).indexOf(np) < 0) err(np.n + ' ist nicht einsatzbereit.');
    var oid = L.on[slot]; var op = oid != null ? S.players.filter(function (p) { return p.id === oid; })[0] : null;
    if (op) L.st[op.id].to = L.min;
    L.undo = { slot: slot, oid: oid, nid: np.id, min: L.min, evN: L.ev.length, oldSt: op ? JSON.parse(JSON.stringify(L.st[op.id])) : null };
    L.on[slot] = np.id; L.st[np.id] = { from: L.min, to: null, g: 0, a: 0, sv: 0, gr: 3.4, sub: true, slot: FORMS[S.lineup.form][slot] }; L.subs++;
    S.lineup.xi = L.on.slice();
    liveEv(L, 'sub', 'Wechsel: ' + np.n + ' kommt' + (op ? ' für ' + op.n : '') + '.', 50, 50, 1);
    if (L.pause && L.pause.type === 'inj') L.pause = null;
    return L;
  }
  function liveUndo(S) {
    var L = S.live; if (!L || L.done || !L.undo) err('Nichts rückgängig zu machen.'); var U = L.undo; if (U.min !== L.min) err('Rückgängig geht nur direkt nach dem Wechsel.');
    delete L.st[U.nid]; if (U.oid != null && U.oldSt) { L.st[U.oid] = U.oldSt; L.st[U.oid].to = null; } L.on[U.slot] = U.oid; L.subs = Math.max(0, L.subs - 1); S.lineup.xi = L.on.slice();
    var nn = (S.players.filter(function (p) { return p.id === U.nid; })[0] || {}).n || ''; liveEv(L, 'sub', 'Wechsel zurückgenommen – ' + nn + ' bleibt auf der Bank.', 50, 50, 1); L.undo = null; return L;
  }
  // Power-System für Sofortergebnisse: Belohnungsfaktor & Strafen
  function instMode(S, L) { if (L.instMode) return; if (L.half === 1 || L.min < 46) L.instMode = 'full'; else if (L.min < 75 && L.half <= 2) { S.instMidN = (S.instMidN || 0) + 1; if (S.instMidN >= 3) L.instMode = 'full'; else { L.instMode = 'mid'; L.instPct = rint(8, 23); if (S.instMidN === 2) { L.instCut = true; S.salCut = 1; } } } else L.instMode = 'late'; }
  function liveAutoRun(S, D) {
    if (!S.live) { autoMatches(S, D); return; } if (S.live.done) return;
    var LA = S.live; if (!LA.inst && S.mcnt && S.mcnt.live > 0) S.mcnt.live--; LA.inst = true; instMode(S, LA); var g = 0;
    var benchFor = function (pos, gk) { return avail(S).filter(function (q) { return !LA.st[q.id] && (!LA.bench || LA.bench.indexOf(q.id) >= 0) && (gk ? true : q.pos !== 'TW'); }).sort(function (a, b) { return rateIn(b, pos) - rateIn(a, pos); }); };
    var autoSub = function (slot) { var on = liveOn(S); var op = on[slot]; var pos = op ? op.dp : FORMS[S.lineup.form][slot]; var bench = benchFor(pos, pos === 'TW'); if (bench.length && LA.subs < LA.maxSubs && LA.red.indexOf(slot) < 0) { try { liveSub(S, D, slot, bench[0].id); } catch (e) {} } };
    // zufällig 1–5 Wechsel, meist ab ca. Minute 53, selten schon in der 1. Halbzeit; Torwart nur bei Verletzung
    if (!LA.plan) { var nS = Math.max(0, Math.min(rint(1, 5), LA.maxSubs - LA.subs)), pl = []; for (var si = 0; si < nS; si++) { var mm = R() < 0.12 ? rint(25, 44) : rint(53, 88); if (mm > LA.min) pl.push(mm); } LA.plan = pl.sort(function (a, b) { return a - b; }); }
    var subOne = function () { var on = liveOn(S), cand = []; on.forEach(function (p, i) { if (!p || p.dp === 'TW' || FORMS[S.lineup.form][i] === 'TW') return; var st = LA.st[p.id]; if (!st || LA.red.indexOf(i) >= 0) return; var yel = LA.cards.some(function (c) { return c.id === p.id && c.t === 'y'; }); var tired = (LA.min - (st.from || 0)) > 55 && p.fit < 80; cand.push({ i: i, w: (st.gr || 3.5) + (yel ? 1.2 : 0) + (tired ? 0.8 : 0) + R() * 0.6 - (st.sub ? 3 : 0) }); }); cand.sort(function (a, b) { return b.w - a.w; }); if (cand[0] && LA.subs < LA.maxSubs) autoSub(cand[0].i); };
    while (!LA.done && g++ < 500) {
      if (LA.pause && (LA.pause.type === 'penF' || LA.pause.type === 'penA')) { livePen(S, D, pick(['l', 'm', 'r'])); continue; }
      if (LA.pause && LA.pause.type === 'inj') { autoSub(LA.pause.slot); if (LA.pause && LA.pause.type === 'inj') LA.pause = null; continue; }
      if (LA.pause && LA.pause.type === 'gk') { gkPick(S, D, null); continue; }
      while (LA.plan.length && LA.plan[0] <= LA.min) { LA.plan.shift(); subOne(); }
      var nx = LA.plan.length ? LA.plan[0] : 999;
      liveStep(S, D, LA.half === 1 ? Math.min(nx, 999) : nx);
    }
  }
  function liveEnd(S, D) {
    var L = S.live; L.done = true;
    // Belohnungsfaktor aus dem Power-Balken
    if (S.power == null) S.power = 100;
    if (L.inst && L.instMode === 'full') { S._rf = S.power / 100; L.powB = S.power; S.power = Math.max(10, S.power - 10); L.powA = S.power; S.instMidN = 0; }
    else if (L.inst && L.instMode === 'mid') { S._rf = 1 - (L.instPct || 10) / 100; }
    else if (L.inst) { S._rf = 1; }
    else { S._rf = 1; S.instMidN = 0; L.powB = S.power; S.power = Math.min(100, S.power + 5); L.powA = S.power; }
    var pen = null;
    if (L.ko && L.gf === L.ga && L.half >= 3) {
      var ms = liveStr(S, D); var a = 0, b = 0, sh = [];
      for (var k = 0; k < 5 || a === b; k++) { var pa = R() < clamp(0.76 + (ms - L.os) * 0.004, 0.6, 0.9), pb = R() < 0.74; a += pa ? 1 : 0; b += pb ? 1 : 0; sh.push((pa ? '✔' : '✘') + (pb ? '✔' : '✘')); if (k >= 4 && a !== b) break; if (k < 5 && (a > b + (4 - k) || b > a + (4 - k))) break; }
      pen = a > b ? 'n.E. gewonnen' : 'n.E. verloren'; L.penTxt = 'n.E. ' + (L.home === false ? b + ':' + a : a + ':' + b); L.shoot = { a: a, b: b, sh: sh }; liveEv(L, 'pens', 'Elfmeterschießen ' + (a > b ? 'gewonnen' : 'verloren') + ' – wir ' + a + ', ' + L.opp + ' ' + b + (a > b ? '. Wir sind weiter!' : '. Ausgeschieden.'));
    }
    liveEv(L, 'ft', 'Abpfiff! Endstand ' + L.gf + ':' + L.ga + (pen ? ' (' + pen + ')' : L.half >= 3 ? ' n.V.' : '') + '.');
    var et = L.half >= 3; var played = {}; var endMin = et ? 120 : 90;
    Object.keys(L.st).forEach(function (id) { var x = L.st[id]; var from = Math.min(x.from, endMin), to = x.to == null ? endMin : Math.min(x.to, endMin); var min = Math.max(1, to - from); played[id] = { min: min, g: x.g, a: x.a, sv: x.sv, grade: clamp(x.gr + gauss() * 0.35, 1, 6), sub: x.sub }; });
    var q = S.mq[0];
    var SS = L.ss, ms2 = liveStr(S, D); var poss = Math.round(SS.n ? SS.pos / SS.n : 50);
    var stats = { poss: [poss, 100 - poss], shots: [SS.shF, SS.shA], on: [SS.onF, SS.onA], cor: [SS.corF, SS.corA], fouls: [SS.foulF, SS.foulA], pass: [Math.round(clamp(70 + (ms2 - L.os) * 0.6 + (poss - 50) * 0.3 + gauss() * 2, 48, 93)), Math.round(clamp(70 + (L.os - ms2) * 0.6 + (50 - poss) * 0.3 + gauss() * 2, 48, 93))], off: [SS.offF, SS.offA] };
    var res = { et: et, stats: stats, gf: L.gf, ga: L.ga, pen: pen, scorers: L.scorers.map(function (s) { return { min: s.min, ml: s.ml, n: s.n, a: s.a }; }), played: played, inj: L.inj, cards: L.cards, ms: liveStr(S, D), os: L.os };
    L.rep = resolveMatch(S, D, q, res);
    L.msEnd = liveStr(S, D);
    if (L.savedLU) { var gone = function (id) { return !S.players.some(function (z) { return z.id === id; }); }; var LU = L.savedLU; if (LU.xi) LU.xi = LU.xi.map(function (id) { return id != null && gone(id) ? null : id; }); if (LU.bench) LU.bench = LU.bench.filter(function (id) { return !gone(id); }); S.lineup = LU; } else if (L.wasAuto) S.lineup.xi = null;
  }
  function resolveMatch(S, D, q, res) {
    S.mq = S.mq.filter(function (x) { return x !== q; });
    var rep = playMatch(S, D, q.o, res); var d = q.o.d;
    if (q.kind === 'liga') {
      var f = S.fix[q.ref]; var home = q.o.home; f.hg = home ? rep.gf : rep.ga; f.ag = home ? rep.ga : rep.gf;
      if (S.fix.every(function (x) { return x.hg != null; })) leagueFinished(S, D);
    } else if (q.kind === 'cup') {
      var c = S.cups.filter(function (x) { return x.k === q.ref; })[0]; var g = c.next;
      var prize = CUPS[c.k].prize[g.rn] || 0; if (prize) book(S, 'Pokalprämien', prize);
      c.games.push({ d: d, rn: g.rn, opp: g.opp.n, home: g.home, gf: rep.gf, ga: rep.ga, pen: rep.pen, win: rep.win });
      var hN = g.home === false ? g.opp.n : D.club, aN = g.home === false ? D.club : g.opp.n; c.field = (c.field || []).filter(function (t) { return t.n !== g.opp.n; });
      cupAfterRound(S, D, c, { h: hN, a: aN, hg: g.home === false ? rep.ga : rep.gf, ag: g.home === false ? rep.gf : rep.ga, pen: rep.pen ? 'n.E.' : null, w: rep.win ? D.club : g.opp.n, wonUs: rep.win, oppT: g.opp });
      if (rep.win) {
        c.rn++;
        if (c.k === 'kp' && c.rn === 5) { S.qual.mrp = true; S.cupPop = { t: 'qual', n: c.name }; msg(S, 'pokal', 'Finale im ' + c.name + ' erreicht – damit spielen wir nächste Saison zusätzlich im ' + (S.reg ? cupName(S, 'mrp') : 'Bitburger-Pokal (Mittelrheinpokal)') + '!'); }
        xp(S, 10);
        if (c.rn >= 6) { mcAdd(S, 'cuptitle'); skCoin(S, 3, c.name + '-Sieg'); S.cupPop = { t: 'win', n: c.name, mrp: c.k === 'kp' }; hypeUp(S, 1.5); ownPost(S, '🏆 POKALSIEGER! ' + svwN() + ' holt den ' + c.name + '! Rot-Grün feiert! 🔴🟢🍾', 'pokal'); S.hsSeason = (S.hsSeason || 0) + 0.5; (S.hsWhy = S.hsWhy || []).push(c.name + ' gewonnen (½ ★)'); S.hsAnim = (S.hsAnim || 0) + 1; c.won = true; c.alive = false; c.next = null; xp(S, 100); ach(S, 'pokal_' + c.k, c.name); S.fans = clamp(S.fans + 8, 0, 100); S.board = clamp(S.board + 8, 0, 100); msg(S, 'pokal', '🏆 POKALSIEG im ' + c.name + '!' + (c.k === 'mrp' ? ' Nächste Saison spielen wir im PRO Pokal!' : '')); if (c.k === 'mrp') S.qual.dfb = true; }
        else { drawCup(S, D, c); if (c.rn === 5) ach(S, 'pokal_finale', c.name, false); }
      } else { c.alive = false; c.next = null; c.rn++; cupFinishWithoutUs(S, D, c); }
    } else if (q.kind === 'rel') {
      var rg = S.rel.games[q.ref]; rg.gf = rep.gf; rg.ga = rep.ga; rg.done = true;
      if (rg.leg === 2) {
        var g0 = S.rel.games[0]; var tf = g0.gf + rg.gf, ta = g0.ga + rg.ga;
        S.rel.won = tf > ta || (tf === ta && (g0.ga > rg.ga || (g0.ga === rg.ga && R() < 0.5)));
        msg(S, 'liga', 'Relegation ' + (S.rel.won ? 'gewonnen' : 'verloren') + ' (Gesamt ' + tf + ':' + ta + ').');
      }
    } else if (q.kind === 'test') {
      var t = S.tests[q.ref]; t.gf = rep.gf; t.ga = rep.ga; t.done = true;
      if (t.pv) { var pg = rint(120, 400) * (t.home ? 1 : 1.4); S.follow = (S.follow || 0) + Math.round(pg); if (t.home) { var gi = nice(rint(1500, 4000) * Math.max(1, moneyScale(S, D))); book(S, 'Zuschauer Partner-Test', gi); S.spons = clamp(S.spons + 2, 0, 100); } else { S.fans = clamp(S.fans + 4, 0, 100); } ownPost(S, '🤝 Freundschaftsspiel gegen unseren Partnerverein ' + t.opp.n + ' – ' + (t.home ? 'ausverkauft im Ländchen!' : 'unsere Fans haben die Gäste-Kurve gerockt!') + ' 💚❤️', t.home ? 'stadion' : 'fans'); }
      avail(S).forEach(function (p) { if (p.age <= 23) p.str = Math.min(p.pot, p.str + 0.05); });
    }
    var sv = svwTeam(S); if (sv) sv.s = Math.round(xiAvg(S, D) * 10) / 10;
    return rep;
  }
  function autoMatches(S, D) { var out = []; while (S.mq.length && !S.fired) out.push(resolveMatch(S, D, S.mq[0], null)); return out; }
  // Verletzungskatalog (im Admin unter „Verletzungen“ änderbar): [Name, Häufigkeit, min. Tage, max. Tage, Arzt-Kostenfaktor (0 = kein Arzt möglich), max. Minderung durch Arzt in %]
  var INJ_DEF = [
    ['Prellung', 7, 2, 5, 0, 0], ['Muskelverhärtung', 6, 2, 6, 0, 0], ['Pferdekuss', 5, 3, 7, 0, 0], ['Leichte Zerrung', 6, 4, 9, 0, 0], ['Grippaler Infekt', 5, 3, 8, 0, 0],
    ['Knöchelblessur', 4, 3, 8, 0, 0], ['Platzwunde', 3, 2, 5, 0, 0], ['Leichte Gehirnerschütterung', 2, 5, 10, 1, 20], ['Rückenprobleme', 4, 3, 10, 1, 15], ['Magen-Darm-Infekt', 3, 2, 6, 0, 0],
    ['Wadenkrampf-Nachwirkungen', 3, 2, 4, 0, 0], ['Fußprellung', 3, 3, 7, 0, 0], ['Blasen an den Füßen', 2, 2, 4, 0, 0], ['Nackenverspannung', 2, 2, 5, 0, 0], ['Hüftprellung', 2, 3, 8, 0, 0],
    ['Muskelfaserriss', 5, 12, 25, 1, 25], ['Zerrung im Oberschenkel', 4, 10, 21, 1, 25], ['Bänderdehnung', 3, 10, 20, 1, 20], ['Verstauchtes Sprunggelenk', 3, 10, 24, 1, 20], ['Leistenprobleme', 2, 12, 28, 1, 25],
    ['Rippenprellung', 2, 10, 18, 0.8, 15], ['Adduktorenzerrung', 2, 12, 24, 1, 25], ['Wadenzerrung', 2, 10, 20, 1, 25], ['Patellasehnenreizung', 1.5, 12, 30, 1, 30], ['Kapselverletzung im Knie', 1.5, 14, 30, 1.2, 25],
    ['Nasenbeinbruch', 1, 12, 21, 0.8, 20], ['Schulterprellung', 1, 10, 18, 0.8, 15], ['Fingerbruch', 1, 14, 28, 0.8, 15], ['Knochenhautentzündung', 1, 14, 30, 1, 30], ['Gehirnerschütterung', 1, 12, 25, 1.2, 15],
    ['Hexenschuss', 1, 10, 18, 0.8, 25], ['Mittelfußprellung', 1, 10, 20, 1, 20], ['Bänderriss im Sprunggelenk', 1.5, 35, 60, 1.5, 25], ['Muskelbündelriss', 1.2, 30, 50, 1.5, 25], ['Meniskusreizung', 1, 25, 45, 1.3, 25],
    ['Innenbandanriss', 1, 30, 55, 1.5, 25], ['Ermüdungsbruch', 0.7, 40, 70, 1.6, 20], ['Schambeinentzündung', 0.7, 35, 80, 1.5, 30], ['Schlüsselbeinbruch', 0.5, 35, 60, 1.5, 20], ['Achillessehnenentzündung', 0.8, 25, 50, 1.3, 30],
    ['Schulterluxation', 0.5, 30, 60, 1.5, 25], ['Mittelfußbruch', 0.5, 45, 80, 1.8, 20], ['Bandscheibenvorfall', 0.4, 40, 90, 2, 25], ['Kreuzbandriss', 0.35, 120, 200, 3, 15], ['Meniskusriss', 0.5, 60, 110, 2.5, 20],
    ['Achillessehnenriss', 0.2, 120, 200, 3, 15], ['Syndesmosebandriss', 0.4, 60, 100, 2.5, 20], ['Schienbeinbruch', 0.2, 90, 160, 3, 15], ['Innenbandriss', 0.4, 50, 90, 2, 25], ['Wadenbeinbruch', 0.3, 70, 120, 2.5, 20]
  ];
  var INJL = INJ_DEF, INJMEM = {};
  function injCat(n) { return INJL.filter(function (x) { return x[0] === n; })[0] || null; }
  function injDays(e) { var t = INJL.reduce(function (a, x) { return a + Math.max(0, +x[1] || 0); }, 0), r = R() * t, I = INJL[0]; for (var i = 0; i < INJL.length; i++) { r -= Math.max(0, +INJL[i][1] || 0); if (r <= 0) { I = INJL[i]; break; } }
    var d = Math.max(2, Math.round(rint(+I[2] || 2, Math.max(+I[2] || 2, +I[3] || 2)) * (1 + e.heal / 100))); INJMEM[d] = I[0]; return d; }
  function foodBase(l) { return l <= 3 ? 3 : l === 4 ? 1.5 : 1; }
  function pitchCond(S) { return S.pitch.type === 'natur' ? 1 : clamp(1 - S.pitch.age / S.pitch.life, 0, 1); }
  function attendance(S, D, o) {
    var L = D.lv[S.lvl], e = eff(S, D);
    var def = L.ticket || 2; var pf = S.ticket <= 0 ? 1.2 : clamp(Math.pow(def / S.ticket, 1.1), 0.3, 1.5);
    var of = 1; if (o.comp === 'liga') { var top = S.world.lv[S.lvl].slice().sort(function (a, b) { return b.s - a.s; }).slice(0, 3).map(function (t) { return t.n; }); if (top.indexOf(o.opp.n) >= 0) of = 1.3; }
    else if (o.comp === 'test') of = o.benefiz ? 2.2 + (4 - o.benefiz.tier) * 1.2 : 0.4; else if (o.opp.l) of = 1 + clamp((S.lvl - o.opp.l) * 0.6, 0, 6);
    var tz = 1; if (S.tmp.zus && S.tmp.zus.n > 0) { tz = 1 + S.tmp.zus.p / 100; S.tmp.zus.n--; }
    var closed = S.pitch.type === 'kunst' && S.pitch.age > S.pitch.life + 1 && o.home === true;
    var a = (S.fanbase / 4) * (0.4 + S.fans / 100) * pf * of * rnd(0.85, 1.15) * (1 + e.zus / 100) * tz * (closed ? 0.4 : 1);
    if (skv(S, 'fmM') && o.comp === 'liga' && o.home !== false) a = Math.max(a, capacity(S, D) * 0.8);
    return Math.round(Math.min(capacity(S, D), Math.max(10, a)));
  }

  // ============================================================ Tagesablauf
  function v16Day(S, D) {
    var d = S.date;
    if (S.courseRun && S.courseRun.until <= d) { var CC = COURSES.filter(function (x) { return x[0] === S.courseRun.k; })[0]; S.courses = S.courses || []; S.courses.push(S.courseRun.k); S.courseRun = null; if (CC) { var cxp = Math.min(400, 20 + Math.round(CC[3] / 40)), cfo = R() < 0.55 ? Math.round(rint(5, 30) * (1 + CC[3] / 2000)) : 0; xp(S, cxp); if (cfo) followAdd(S, cfo); S.certPop = { k: CC[0], n: CC[1], org: CC[2], txt: CC[6], xp: cxp, fol: cfo, d: d }; msg(S, 'privat', '🎓 Lehrgang bestanden: ' + CC[1] + ' (' + (CC[2] === 'FVM' ? 'Landesverband' : CC[2]) + ') – ' + CC[6] + '.'); infoMail(S, CC[2] === 'DFB' ? 'DFB-Akademie' : 'Landesverband – Lehrgänge', 'Herzlichen Glückwunsch!', 'Sie haben den Lehrgang „' + CC[1] + '“ erfolgreich abgeschlossen. ' + CC[6] + '.', 'info'); } }
    try { nlzDaily(S, D); } catch (e) { }
    try { ytrNudge(S, D); } catch (e) { }
    if (dow(d) === 2) { try { fcCheck(S, D); fcMail(S, D); } catch (e) { } }
    S.players.forEach(function (p) { if (p.inj > 0) { if (!p.injN || p.inj > (p.injD0 || 0)) { p.injN = injName(p.inj); p.injD0 = p.inj; } } else if (p.injN) { p.injN = null; p.injD0 = 0; p.docD = null; } });
    // Erster Joker am Spieltag des ersten Pflichtspiels, halber Stern nach fünf Ligaspielen
    if (!S.jokIntro || !S.starIntro) { try { var sg = svwGames(S, D);
      // Der Tag eines Spiels wird erst nach dem Spiel verarbeitet: daher schon am Vortag (oder nachholen, falls verpasst)
      var nd1 = addDays(d, 1); if (!S.jokIntro && sg.some(function (g) { return g.comp !== 'test' && (g.gf != null || (g.d >= d && g.d <= nd1)); })) S.jokIntro = 1;
      if (!S.starIntro && sg.filter(function (g) { return g.comp === 'liga' && g.gf != null; }).length >= 5) S.starIntro = 1; } catch (e) { } }
    if (dow(d) === 1) { utilWeekly(S, D); if (diffDays(S.lastFanAct || S.start, d) > 42 && S.fans > 35) { S.fans = clamp(S.fans - 0.5, 0, 100); } if (S.mktB) S.mktB = Math.max(0, S.mktB - 0.6); if (S.utilB) S.utilB = Math.max(0, S.utilB - 0.4); S.fanPrev = S.fanCur || null; S.fanCur = { f: S.fans, fb: S.fanbase, m: S.members || 0 }; }
    if (dow(d) === 1) { if (S.scout) { var ntl = Object.keys(S.scout.tools || {}).length; S.scout.score = clamp((S.scout.score || 0) + ntl * 0.3 - 0.4, 0, 100); } if (S.masc) { S.mascBond = S.mascBond || {}; S.mascBond[S.masc] = Math.min(100, (S.mascBond[S.masc] || 0) + 0.15); } }
    if (dow(d) === 1) { if (S.scout && Object.keys(S.scout.tools || {}).length) scoutGen(S, D); if (S.pv && S.pv.to >= S.season && !S.pv.army) pvPropGen(S, D); }
    if (d.slice(8) === '01' && S.scout) { var tot = 0; SCOUTT.forEach(function (t) { if (S.scout.tools[t[0]]) tot += t[2]; }); if (tot) book(S, 'Scouting-Tools', -tot); var SPd = S.scout.spend = S.scout.spend || []; SPd.push([d.slice(0, 7), tot]); if (SPd.length > 24) SPd.shift(); }
    if (S.pvPend && S.pvPend.length && inWindow(d)) { S.pvPend.forEach(function (lp) { S.players.push(lp); }); infoMail(S, S.pv ? S.pv.club : 'Partnerverein', 'Leihspieler sind da', 'Das Transferfenster ist offen – ' + S.pvPend.map(function (x) { return x.n; }).join(', ') + ' trainieren ab heute bei euch mit.', 'info'); S.pvPend = []; }
  }
  function simDay(S, D) {
    mcAdd(S, 'day');
    v16Day(S, D); fixClash(S, D);
    (function () { var md = S.date.slice(5); if (md !== '05-31' && md !== '06-24') return; var en = S.players.filter(function (p) { return p.ce <= S.season + 1 && !p.self && !(p.loan && p.loan.from); }); if (!en.length) return; infoMail(S, 'Sportlicher Leiter', (md === '05-31' ? 'In einem Monat: ' : 'Letzte Erinnerung: ') + en.length + ' Verträge laufen aus', 'Zum 30.06. laufen diese Verträge aus: ' + en.map(function (p) { return p.n + ' (' + p.dp + ', ' + p.age + ' J.)'; }).join(', ') + '. Wer bleiben soll, braucht vorher eine Verlängerung – sonst ist er zur neuen Saison weg.', 'info'); })();
    var nd = addDays(S.date, 1);
    if (mon(nd) === 7 && dayOf(nd) === 1) { S.date = nd; seasonEnd(S, D); if (S.fired) return; startSeason(S, D, false); }
    else S.date = nd;
    (function () { var md0 = S.date.slice(5); (S.youth || []).forEach(function (y) { if (!y.bday) y.bday = ('0' + rint(1, 12)).slice(-2) + '-' + ('0' + rint(1, 28)).slice(-2); if (y.bday === md0) { y.age++; msg(S, 'jugend', '🎂 ' + y.n + ' wird heute ' + y.age + '!'); } }); })();
    if (!S.aufstOk && mlv(S) < featLvl('aufstellung')) { var pfl = svwGames(S, D).filter(function (g) { return g.d >= S.date && g.comp !== 'test'; })[0]; var tst = svwGames(S, D).filter(function (g) { return g.d >= S.date && g.comp === 'test' && (!pfl || g.d < pfl.d); }); if (pfl && !tst.length) { S.aufstOk = true; S.unlockNote = 'aufstellung'; msg(S, 'verein', '🔓 Vorbereitung abgeschlossen: Ab sofort stellst du deine Mannschaft selbst auf!'); } }
    S.days++;
    if (S.trials && S.trials.length && !S.trialRes) { var tdue = S.trials.filter(function (t) { return t.until <= S.date; })[0]; if (tdue) { S.trials.splice(S.trials.indexOf(tdue), 1); var tp = tdue.p; var grpP = S.players.filter(function (q) { return q.pos === tp.pos && !(q.loan && q.loan.to); }); var ga = grpP.length ? grpP.reduce(function (a, q) { return a + q.str; }, 0) / grpP.length : xiAvg(S, D); var diff = tp.str - ga; tp.fit = 95; tp.form = rnd(-1, 2);
      S.trialRes = { p: tp, ga: Math.round(ga * 10) / 10, verdict: diff >= 2 ? 'hilft' : diff >= -2 ? 'knapp' : 'nein', again: !!tdue.again, note: pick(diff >= 2 ? ['Hat im Training die Zweikämpfe dominiert.', 'Technisch stark, sofort eine Option für die Startelf.', 'Die Mannschaft war begeistert.'] : diff >= -2 ? ['Solide Woche, aber kein Unterschiedsspieler.', 'Gute Ansätze, braucht noch Zeit.', 'Würde den Kader in der Breite verstärken.'] : ['Konnte das Tempo noch nicht mitgehen.', 'Bemüht, aber noch zu weit weg.', 'Eher eine Option für die Zweite.']) }; } }
    if (S.trialLater && S.trialLater.length) S.trialLater = S.trialLater.filter(function (t) { if (t.d > S.date) return true; var tp2 = t.p; tp2.age++; tp2.str = clamp(tp2.str + rnd(-1.5, 3.5) * (tp2.age <= 23 ? 1.3 : 1), 1, 99); tp2.pot = Math.max(tp2.str, tp2.pot); tp2.sal = salDemand(tp2, S.lvl); (S.trials = S.trials || []).push({ p: tp2, until: addDays(S.date, 7), again: true }); msg(S, 'transfer', tp2.n + ' ist wie vereinbart erneut zum Probetraining da.'); return false; });
    var mdd = S.date.slice(5); if (mdd === '01-01') S.players.forEach(function (p) { p.fitCap = Math.max(75, (p.fitCap || 100) - 8); p.fit = Math.min(p.fit, p.fitCap); }); if (mdd === '07-01' || mdd === '01-01') S.twPop = 'open'; else if (mdd === '08-31' || mdd === '01-31') S.twPop = 'deadline'; else if (mdd === '09-01' || mdd === '02-01') S.twPop = 'close';
    if (S.youthNext && S.youthNext.length) S.youthNext = S.youthNext.filter(function (yd) { if (yd > S.date) return true; var ny = newYouth(S, D, false); if (!youthAdd(S, ny)) return false; infoMail(S, 'Academy-Leitung', 'Neues Talent: ' + ny.n, ny.n + ' (' + ny.age + ', ' + ny.dp + ') kommt neu in die Academy. Schau ihn dir an!'); return false; });
    if (S.incoming && S.incoming.length) S.incoming = S.incoming.filter(function (x) { if (x.d > S.date) return true; S.players.push(x.p); x.sig.arrived = true; S.lastSigned = x.sig; msg(S, 'transfer', '🧳 ' + x.p.n + ' ist da und trainiert ab heute mit!'); return false; });
    S.players.filter(function (p) { return p.leaving && p.leaving.d <= S.date; }).forEach(function (p) { msg(S, 'transfer', '👋 ' + p.n + ' wechselt heute zu ' + p.leaving.club + '.'); removePlayer(S, p); });
    if (S.cash < 0 && (S.tb > 0 || S.sav > 0)) { var nd0 = -S.cash, f1 = Math.min(nd0, Math.max(0, S.tb)); S.tb -= f1; S.cash += f1; nd0 -= f1; var f2 = Math.min(nd0, Math.max(0, S.sav)); S.sav -= f2; S.cash += f2; }
    cupBidDay(S, D);
    var d = S.date, e = eff(S, D);
    // Bauprojekte
    S.building = S.building.filter(function (b) { if (b.done <= d) { S.built[b.id] = true; if (b.id === 'naturrasen') S.pitch.type = 'natur'; msg(S, 'verein', '🏗️ Fertig: ' + (D.items[b.id] ? D.items[b.id].name : b.id) + '.'); return false; } return true; });
    if (S.capB && S.capB.done <= d) { S.capX = (S.capX || 0) + S.capB.n; msg(S, 'verein', '🏟️ Fertig: +' + S.capB.n + ' Zuschauerplätze. Jetzt passen ' + capacity(S, D) + ' Fans ins Stadion.'); S.capB = null; }
    if (S.pitchBuild && S.pitchBuild <= d) { S.pitch.age = 0; S.pitch.life = rnd(15, 20); S.pitchBuild = null; msg(S, 'verein', '🏗️ Der neue Kunstrasen ist verlegt!'); }
    // Erholung & Verletzungen
    var inCamp = S.camp && S.camp.from <= d && S.camp.to >= d;
    if (S.camp && S.camp.from === d && !S.camp.boost) { S.camp.boost = true; var cb = Math.round(clamp((S.camp.e || 2) * 5, 6, 20)); S.players.forEach(function (p) { if (p.loan && p.loan.to) return; p.fitCap = Math.min(100, (p.fitCap || 80) + cb); p.fit = Math.min(p.fitCap, p.fit + cb + 2); }); S.moral = clamp(S.moral + 3, 0, 100); msg(S, 'training', '🏕️ ' + S.camp.name + ': Fitness-Grundlage +' + cb + ', Moral +3.'); }
    var wk0 = addDays(d, -((dow(d) + 6) % 7));
    if (false && !S.autoTr && S.lvl >= 7 && S.weekWk !== wk0) { S.weekWk = wk0; var tds = []; for (var wi = 0; wi < 7; wi++) { var wdd = addDays(wk0, wi); if (wdd >= d && isTrainDay(S, D, wdd)) tds.push(wdd); } if (tds.length) S.weekNeed = tds; }
    var rec = (S.built.athletik ? 1.2 : 1) * 3 + (e.rec || 0) * 0.6 + (S.train.int === 'locker' ? 1.2 : S.train.int === 'hart' ? -1.2 : 0) + (S.train.focus === 'regeneration' ? 1.8 : S.train.focus === 'kondition' ? 0.6 : 0) + (inCamp ? 1 : 0);
    S.players.forEach(function (p) { if (p.inj > 0) { p.inj--; if (!p.inj) p.fit = Math.min(p.fit, 70); } else { var r1 = (rec * 0.55 + 0.17 * (100 - p.fit)) * rnd(0.7, 1.3) * skRegF(p) * 0.95; if (R() < 0.08) r1 -= rnd(2, 6); p.fit = clamp(p.fit + r1, 35, p.fitCap || 100); } });
    if (S.camp && S.camp.to === d) {
      var ce = S.camp.e; S.moral = clamp(S.moral + 3 * ce, 0, 100); S.chem = { v: 0.4 * ce, until: addDays(d, 30) };
      S.players.forEach(function (p) { if (!p.inj && !(p.loan && p.loan.to)) { p.form = clamp(p.form + ce, -5, 5); p.str = Math.min(p.pot, p.str + 0.15 * ce * (p.age <= 25 ? 1 : 0.4)); } });
      msg(S, 'training', 'Trainingslager „' + S.camp.name + '“ beendet: Teamgeist, Form und Fitness sind deutlich besser.'); S.camp = null;
    }
    if (dow(d) === 1) weekly(S, D);
    stocksDaily(S); try { tipDaily(S, D); } catch (e) { }
    if (isTrainDay(S, D, d) && S.weekPlan && S.weekPlan.wk && S.weekPlan.wk === addDays(d, -((dow(d) + 6) % 7)) && !S.autoTr) { var WP = S.weekPlan; doTraining(S, D, WP.t, WP.f, WP.score, WP.diff === 'easy' ? 0.3 : WP.diff === 'mid' ? 0.8 : 1.5); }
    else if (isTrainDay(S, D, d)) { if (S.autoTr) { var tk = Object.keys(TRAIN); var tt = pick(tk); doTraining(S, D, tt, pick(TRAIN[tt][2])); } else { var tk2 = Object.keys(TRAIN); var tt2 = pick(tk2); doTraining(S, D, tt2, TRAIN[tt2][2][0], 0.6, 0.3); } }
    if (S.prep && S.prep.phase === 'summerDone' && mon(d) === 12 && dayOf(d) === 1) S.prep = { phase: 'winter', need: true };
    refreshMarket(S, D, false, 0.35);
    (S.dayEv || []).forEach(function (ev) { if (ev.d === d && !ev.done) { ev.done = true; runDayEv(S, D, ev); } });
    S.nego = (S.nego || []).filter(function (ng) { if (ng.due > d) return true; negoResult(S, D, ng); return false; });
    if (S.trAct && S.trAct.length && !inWindow(d)) S.trAct = S.trAct.filter(function (x) { return x.st !== 'fail'; });
    milestones(S);
    if (S.follow == null) S.follow = followStart(S);
    if (S.priv && S.priv.fam && S.priv.fam.partner && !S.priv.fam.partner.img && (D.relImgs || []).length) S.priv.fam.partner.img = relImg(S, D);
    if (dow(d) === 1) { var lvF = 1 + (11 - S.lvl) * 0.25; var g0 = Math.round(S.follow * rnd(0.001, 0.0028) + Math.max(0, S.fans - 55) * 0.22 * lvF + (S.fwWins || 0) * rint(3, 8) * lvF + (S.fwGain || 0)) + (R() < 0.15 ? -rint(1, 6) : 0); S.follow += g0 - (S.fwGain || 0); S.followWeek = g0; S.fwGain = 0; S.fwWins = 0; followMs(S, D);
      if (S.follow >= 100000) { var np = rint(1, 3), per = nice(rnd(10, 60) * Math.pow(1.38, 11 - S.lvl)), tot = 0; for (var pi = 0; pi < np; pi++) tot += Math.min(1000, nice(per * rnd(0.8, 1.2))); book(S, 'Social-Media-Posts (' + np + ')', tot); } }
    if (dow(d) === 1) { var mk0 = mktVal(S); if (mk0 >= 60) { S.spons = clamp(S.spons + (mk0 >= 80 ? 2 : 1), 0, 100); S.fans = clamp(S.fans + (mk0 >= 80 ? 1 : 0.5), 0, 100); } }
    if (dayOf(d) === 1) { var mc = 0, M2 = medSt(S); Object.keys(M2).forEach(function (k) { var m = M2[k]; if (m && m.staff && MEDIT[k]) mc += MEDIT[k][3][Math.max(0, m.lvl - 1)]; }); mc = nice(mc * medMS(S, D)); if (mc) book(S, 'Med. Abteilung (Personal)', -mc); Object.keys(M2).forEach(function (k) { var m = M2[k]; if (m.bld && m.bld === d) msg(S, 'verein', '🏥 ' + MEDIT[k][0] + ' ist fertig gebaut' + (m.staff ? '.' : ' – jetzt noch Personal einstellen!')); }); }
    if (dayOf(d) === 1) { privMonthly(S, D); if (R() < 0.012) { var big = nice(D.lv[S.lvl].budget * rnd(0.1, 0.35)); book(S, 'Großspende', big); infoMail(S, pick(['Unternehmer aus Berkum', 'Anonymer Mäzen', 'Ehemaliger Spieler', 'Stiftung Ländchen']), 'Überraschende Großspende!', 'Wir möchten den ' + D.club + ' mit ' + euro(big) + ' unterstützen. Macht etwas Großes daraus!', 'info'); }
      S.members = Math.max(50, Math.round((S.members || D.members0) * (1 + 0.005 + (S.fans - 50) / 12000 + (R() - 0.5) * 0.004)));
      S.fanbase = Math.max(50, Math.round((S.fanbase || 500) * (1 + Math.max(0.003, 0.014 + (S.fans - 50) / 2200 + rnd(-0.004, 0.009)))));
      var pm = S.fin.cur; monthly(S, D); if (pm && S.fin.cur !== pm) monthReport(S, pm); }
    // Spiele aller Wettbewerbe an diesem Tag
    playDay(S, D, d);
    if (S.fired) return;
    maybeEvent(S, D);
    if (R() < 0.07) maybeMail(S, D);
    S.mails.forEach(function (m) { if (!m.answered && diffDays(m.d, S.date) > 21) m.answered = 'verfallen'; });
  }
  function queue(S, kind, ref, o) { S.mq.push({ id: S.nextId++, kind: kind, ref: ref, o: o }); }
  function playDay(S, D, d) {
    var todays = S.fix.filter(function (f) { return f.d === d && f.hg == null; });
    var teams = S.world.lv[S.lvl];
    todays.forEach(function (f) {
      var h = teams[f.h], a = teams[f.a];
      if (h.svw || a.svw) { var opp = h.svw ? a : h; queue(S, 'liga', S.fix.indexOf(f), { comp: 'liga', label: f.md + '. Spieltag', opp: { n: opp.n, s: opp.s, l: S.lvl }, home: !!h.svw, d: d }); }
      else {
        var hs = h.s + gauss() * 2.5 + 1.5, as = a.s + gauss() * 2.5;
        f.hg = poisson(1.45 * Math.exp(0.07 * (hs - as))); f.ag = poisson(1.15 * Math.exp(0.07 * (as - hs)));
      }
    });
    if (todays.length && S.fix.every(function (f) { return f.hg != null; })) leagueFinished(S, D);
    S.cups.forEach(function (c) { if (c.alive && c.next && c.next.d === d) queue(S, 'cup', c.k, { comp: c.k, label: c.name + ' · ' + RNAMES[c.next.rn], opp: c.next.opp, home: c.next.home, d: d, ko: true }); });
    if (S.rel && S.rel.games) S.rel.games.forEach(function (g, i) { if (g.d === d && !g.done) queue(S, 'rel', i, { comp: 'rel', label: 'Relegation ' + (g.leg === 1 ? 'Hinspiel' : 'Rückspiel'), opp: S.rel.opp, home: g.home, d: d, ko: false }); });
    S.tests.forEach(function (t, i) { if (t.d === d && !t.done) queue(S, 'test', i, { comp: 'test', label: t.benefiz ? 'Benefizspiel' : 'Testspiel', opp: t.opp, home: t.home, d: d, benefiz: t.benefiz || null }); });
    if (S.mq.length) S.playedToday = true;
  }
  function leagueFinished(S, D) {
    var L = D.lv[S.lvl]; var me = svwRank(S); var n = S.world.lv[S.lvl].length; var last = S.fix[S.fix.length - 1].d;
    if (L.upRel && me.rank === L.up + 1 && S.lvl > 1 && D.lv[S.lvl - 1].downRel) {
      var up = S.world.lv[S.lvl - 1].slice().sort(function (a, b) { return a.s - b.s; }); var opp = up[2] || up[0];
      S.rel = { type: 'up', opp: { n: opp.n, s: opp.s, l: S.lvl - 1 }, games: [{ leg: 1, d: addDays(last, 4), home: true }, { leg: 2, d: addDays(last, 8), home: false }] };
      msg(S, 'liga', 'Platz ' + me.rank + '! Wir spielen die Aufstiegsrelegation gegen ' + opp.n + '.');
    } else if (L.downRel && me.rank === n - L.down && S.lvl < D.maxLvl && D.lv[S.lvl + 1].upRel) {
      var lo = S.world.lv[S.lvl + 1].slice().sort(function (a, b) { return b.s - a.s; }); var o2 = lo[2] || lo[0];
      S.rel = { type: 'down', opp: { n: o2.n, s: o2.s, l: S.lvl + 1 }, games: [{ leg: 1, d: addDays(last, 4), home: false }, { leg: 2, d: addDays(last, 8), home: true }] };
      msg(S, 'liga', 'Platz ' + me.rank + ' – Abstiegsrelegation gegen ' + o2.n + '.');
    } else msg(S, 'liga', 'Saison beendet: Platz ' + me.rank + ' mit ' + me.pts + ' Punkten.');
  }

  function weekly(S, D) {
    xp(S, 2); try { carEnsure(S, D); } catch (ce) { }
    ['captain', 'pen', 'fk', 'ck'].forEach(function (k) { var tp = S[k] && S.players.filter(function (p) { return p.id === S[k]; })[0]; if (tp) tp.form = clamp(tp.form + (k === 'captain' ? 0.35 : 0.2), -5, 5); });
    var e = eff(S, D); var inCamp = !!(S.camp && S.camp.from <= S.date);
    var tf = S.train; var intM = { locker: 0.8, normal: 1, hart: 1.25 }[tf.int];
    S.players.forEach(function (p) {
      if (p.inj) { p.recent = 0; return; }
      var ageF = p.age <= 20 ? 1.25 : p.age <= 23 ? 1 : p.age <= 26 ? 0.6 : p.age <= 29 ? 0.25 : 0;
      var m = intM * (FOCUSPOS[tf.focus] ? (FOCUSPOS[tf.focus] === p.pos ? 1.3 : 0.95) : tf.focus === 'regeneration' ? 0.7 : 1.05);
      if (tf.fp.indexOf(p.id) >= 0) m *= 1.4;
      if (p.tp && (FOCUSPOS[p.tp] === p.pos || p.tp === 'kondition' || p.tp === 'allround')) m *= p.tp === 'allround' ? 1.15 : 1.3;
      if (p.retrain) { p.retrain.w++; if (p.retrain.w >= 8) { msg(S, 'training', p.n + ' ist jetzt umgeschult: ' + p.dp + ' → ' + p.retrain.to + '.'); var oldDp = p.dp; p.dp = p.retrain.to; p.pos = GRP[p.dp]; p.dp2 = oldDp === 'TW' ? null : oldDp; p.str = Math.max(1, p.str - 1); p.retrain = null; p.tp = ''; } }
      if (inCamp) m *= 1 + 0.15 * S.camp.e;
      var fac = 1 + (e.dev + (p.pos === 'TW' ? e.twdev : 0)) / 100;
      var play = p.loan && p.loan.to ? 1.15 : (p.recent >= 1 ? 1.15 : 0.85 * (1 + e.bench / 100));
      var g = Math.max(0, p.pot - p.str) * 0.0055 * ageF * (0.55 + p.tal * 0.2) * m * fac * play;
      var trt = skTraits(p); if (trt.pers === 1 && g > 0) g *= 1.1; if (g > 0) g *= [1.18, 1.06, 1, 0.82][trt.ein];
      if (p.age >= 31) g -= 0.035 + (p.age - 31) * 0.02;
      p.str = clamp(p.str + g, 1, 99); skTrain(p, g, p.tp || tf.focus);
      p.form = p.form * 0.85 + (trt.pers === 4 ? gauss() * 0.6 : 0); p.recent = 0;
      var ir = 0.006 * { locker: 0.6, normal: 1, hart: 1.6 }[tf.int] * (1 + e.inj / 100) * [0.6, 1, 1.8][trt.ip];
      if (!(p.loan && p.loan.to) && R() < ir) { p.inj = injDays(e); msg(S, 'training', p.n + ' hat sich im Training verletzt (' + p.inj + ' Tage).'); }
    });
    if (tf.int === 'hart') S.moral = clamp(S.moral - 1, 10, 100);
    S.moral = clamp(S.moral + (60 + e.moral - S.moral) * 0.08, 10, 100);
    try { ytBack(S); ytWeekly(S, D); } catch (ye) { }
    S.youth.forEach(function (y) { var ytc = S.yt && S.yt[ytOf(y)] && S.built[ytOf(y)] ? YTC[S.yt[ytOf(y)].coach || 0][3] : 0; var g = Math.max(0, y.pot - y.str) * 0.007 * (0.8 + y.tal * 0.1) * (1 + (bon(S, 'ydev') + (e.ydev || 0)) / 100) * (1 + e.dev / 100) * (1 + ytc); y.str = clamp(y.str + g, 1, 99); });
    if (dow(S.date) === 1 && S.lvl > 1 && S.licWarn !== S.season && [10, 11, 12, 1, 2, 3, 4].indexOf(mon(S.date)) >= 0) { try { var lt = table(S), lme = lt.filter(function (r) { return r.svw; })[0]; if (lme && lme.rank <= 3) { var li = licenseIssues(S, D, S.lvl - 1); if (li.length) { S.licWarn = S.season; infoMail(S, 'Verband (Lizenzierung)', 'Achtung: Ihr steht auf Platz ' + lme.rank + '. Für einen Aufstieg in die ' + D.lv[S.lvl - 1].short + ' fehlt euch noch: ' + li.join(', ') + '. Ohne diese Voraussetzungen gibt es keine Lizenz – auch nicht als Meister! Baut rechtzeitig (Verein → Erweiterungen), die Bauzeit zählt.'); msg(S, 'verein', '⚠️ Lizenz-Warnung: Für die ' + D.lv[S.lvl - 1].short + ' fehlt noch ' + li.join(', ')); } } } catch (e) {} }
    try { sbDay(S, D); } catch (e) { }
    if (dow(S.date) === 1) { selfBoost(S, D); if (R() < 0.065) rarePost(S, D, 'viral');
      var nP = rint(1, 5); for (var pk = 0; pk < nP; pk++) makePost(S, D, null); }
    // Eigene Instagram-Profile (im Admin unter Vorgaben verwaltet): Beiträge pro Saison
    try { INSTA.forEach(function (a) { if (a && a.id && (a.per || 0) > 0 && R() < a.per / 330) accPost(S, D, a); }); } catch (e) { }
    refreshMarket(S, D, false);
    if (inWindow(S.date) || R() < 0.3) aiOffers(S, D);
    (S.watch || []).forEach(function (w) { if (w.moved && w.moved.until <= S.date) w.moved = null; if (!w.moved && R() < 0.06) { var nc = pick(S.world.lv[Math.max(1, Math.min(11, (w.lvl || S.lvl) + rint(-1, 1)))] || S.world.lv[S.lvl]).n; var mon0 = mon(S.date), un = mon0 <= 1 ? S.date.slice(0, 4) + '-07-01' : mon0 >= 7 ? (+S.date.slice(0, 4) + 1) + '-01-01' : S.date.slice(0, 4) + '-07-01'; w.moved = { club: nc, until: un }; w.club = nc; w.free = false; infoMail(S, 'Scout', 'Watchlist: ' + w.n + ' hat gewechselt', w.n + ' hat bei ' + nc + ' unterschrieben. Ein Transfer geht erst im nächsten Transferfenster wieder – eine Leihe wäre möglich.', 'info'); } });
    var sc = 0.12 * (1 + e.sponsorchance / 100) * (S.fans / 60);
    if (R() < sc) sponsorOffer(S, D);
  }
  function monthly(S, D) {
    // Balancing: Zuschuss von Gemeinde & Kreis für kleine Vereine (ab Landesliga abwärts)
    var zus = [0, 0, 0, 0, 0, 0, 0, 350, 450, 550, 650, 750, 850][S.lvl] || 0; if (zus) book(S, 'Zuschuss Gemeinde & Kreis', zus);
    // Erinnerung: Weihnachtsfeier (Dezember) bzw. Saisonabschlussfeier (ab Mai) noch nicht geplant
    try { var mo0 = mon(S.date), yr0 = S.date.slice(0, 4); [['weihnacht', 12], ['abschluss', 5]].forEach(function (x) { if (mo0 !== x[1]) return; var plan = (S.dayEv || []).some(function (e) { return e.k === x[0] && e.d.slice(0, 4) === yr0; }); if (!plan) infoMail(S, 'Vereinsvorstand', 'Erinnerung: ' + DAYEV[x[0]][0], 'Der Zeitraum für die ' + DAYEV[x[0]][0] + ' hat begonnen – geplant ist aber noch nichts. Leg im Kalender einen Termin fest, das Team und die Helfer freuen sich darauf!', 'info', { go: 'kal' }); }); } catch (e) {}
    if (S.mainSp && S.mainSp.to === S.season && mon(S.date) === 4 && !S.spNeed) { spOffers(S, D, false, S.mainSp.firm); infoMail(S, S.mainSp.firm, 'Vertragsverlängerung Hauptsponsor', 'Unser Vertrag läuft zum 30.06. aus. Wir würden gerne verlängern – auch andere Firmen haben Interesse angemeldet.'); }
    if (S.cash < 0) { var need0 = -S.cash; var fs = Math.min(need0, Math.max(0, S.sav)); S.sav -= fs; S.cash += fs; need0 -= fs; var ft = Math.min(need0, Math.max(0, S.tb)); S.tb -= ft; S.cash += ft; if (fs + ft > 0) infoMail(S, 'Kassenwart', 'Bargeld aufgefüllt', 'Die Kasse war im Minus. Ich habe ' + euro(fs + ft) + ' vom ' + (fs ? 'Tagesgeld' : '') + (fs && ft ? ' und ' : '') + (ft ? 'Transferbudget' : '') + ' umgebucht.', 'info'); }
    mgrMonthly(S, D);
    if (S.masc) book(S, 'Maskottchen (monatlich)', -MASCM);
    if (S.util) Object.keys(S.util).forEach(function (k) { var c = S.util[k]; if (c && c.to >= S.season) book(S, 'Partner (' + UTIL[k][1] + ')', c.m); });
    var L = D.lv[S.lvl], e = eff(S, D);
    var sal = S.players.reduce(function (a, p) { return a + (p.loan && p.loan.to ? 0 : p.sal); }, 0);
    book(S, 'Gehälter', -sal);
    var items = 0; Object.keys(S.built).forEach(function (id) { if (D.items[id]) items += itemMonthly(S, D, D.items[id]); });
    if (items) book(S, 'Personal & Unterhalt Ausbau', -items);
    var ytcM = Object.keys(S.yt || {}).reduce(function (a, k) { return a + (S.built[k] ? YTC[S.yt[k].coach || 0][2] : 0); }, 0); if (ytcM) book(S, 'Jugendtrainer', -ytcM);
    var adm = Math.max(0, L.admin + S.betrieb * moneyScale(S, D)); var winter = [11, 12, 1, 2, 3].indexOf(mon(S.date)) >= 0;
    book(S, 'Strom', -nice(adm * (winter ? 0.32 : 0.24))); book(S, 'Wasser', -nice(adm * 0.12)); book(S, 'Heizung & Gas', -nice(adm * (winter ? 0.26 : 0.06)));
    book(S, 'Versicherungen', -nice(adm * 0.2)); book(S, 'Reinigung & Material', -nice(adm * 0.18)); book(S, 'Verbandsgebühren & Verwaltung', -nice(adm * 0.12));
    S.spons = clamp((S.spons == null ? 60 : S.spons) + (55 - (S.spons == null ? 60 : S.spons)) * 0.08, 0, 100);
    if (R() < 0.12) { var don = nice(D.lv[S.lvl].budget * rnd(0.005, 0.02)); book(S, 'Spenden', don); infoMail(S, pick(['Familie Schäfer', 'Förderverein SVW', 'Anonymer Gönner', 'Ortsbauernschaft Wachtberg', 'Kegelclub Alle Neune']), 'Spende für den Verein', 'Wir möchten den ' + D.club + ' mit einer Spende von ' + euro(don) + ' unterstützen. Weiter so!', 'info'); }
    book(S, 'Platzpflege', -(S.pitch.type === 'natur' ? 1500 : 300) - (e.heiz ? 2500 : 0));
    if (L.tv) book(S, 'TV-Gelder', L.tv);
    if (S.sav > 0) bookPot(S, 'Tagesgeld-Zinsen', Math.round(S.sav * 0.025 / 12), 'sav');
    S.players.forEach(function (pp) { pp.sh = (pp.sh || []).concat([Math.round(pp.str * 10) / 10]).slice(-11); });
    hollyMonthly(S, D);
    (function () { var P7 = S.priv; if (!P7 || !P7.inv || !P7.inv.cost) return; P7.inv.alert = P7.inv.alert || {}; Object.keys(P7.inv.stocks || {}).forEach(function (k) { var b = P7.inv.cost[k], v = (P7.inv.prices[k] || 0) * P7.inv.stocks[k]; if (!b) return; var pc = (v - b) / b * 100, lvl = pc >= 50 ? 2 : pc >= 25 ? 1 : pc <= -50 ? -2 : pc <= -25 ? -1 : 0, prev = P7.inv.alert[k] || 0; if (lvl && Math.abs(lvl) > Math.abs(prev) || (lvl && Math.sign(lvl) !== Math.sign(prev))) { P7.inv.alert[k] = lvl; infoMail(S, 'Dein Bankberater', (pc > 0 ? '📈 ' : '📉 ') + k + ' ' + (pc > 0 ? '+' : '') + Math.round(pc) + ' %', 'Hallo ' + S.full.split(' ')[0] + ', deine Position ' + k + ' steht aktuell bei ' + (pc > 0 ? '+' : '') + Math.round(pc) + ' % (' + euro(Math.round(v)) + ' Wert, ' + euro(Math.round(b)) + ' eingesetzt). Schau doch mal rein, ob du ' + (pc > 0 ? 'Gewinne mitnehmen' : 'die Reißleine ziehen oder nachkaufen') + ' möchtest.', 'info'); } }); })();
    if (S.bond) { var brt = Math.min(S.bond.rest, S.bond.monthly); bookPot(S, 'Fan-Anleihe (Rate)', -brt, 'cash'); S.bond.rest = Math.round(S.bond.rest - brt); S.bond.paid = (S.bond.paid || 0) + 1; if (S.bond.rest <= 1) { S.bond = null; msg(S, 'finanzen', '📜 Die Fan-Anleihe ist vollständig zurückgezahlt.'); } }
    if (S.ag) { var agm = 1 + rnd(-0.07, 0.08) + (S.fans - 55) / 1500 + (S.hypeUntil >= S.date ? (S.hype || 0) * 0.012 : 0); S.ag.p = Math.max(Math.round(S.ag.p0 * 0.25), Math.round(S.ag.p * agm)); S.ag.hist = (S.ag.hist || []).concat([S.ag.p]).slice(-12); if (S.ag.sold > 0) { var dv = Math.round(S.ag.p * S.ag.sold * 0.004); if (dv > 0) { bookPot(S, 'Dividende an Aktionäre', -dv, 'cash'); } } }
    if (S.loan) { var rate = Math.min(S.loan.rest, S.loan.monthly); bookPot(S, 'Kreditrate', -rate, 'cash'); S.loan.rest -= rate; if (S.loan.rest <= 1) { S.loan = null; msg(S, 'finanzen', 'Der Kredit ist vollständig abbezahlt.'); } }
    var merch = S.fanbase * (S.fans / 100) * 0.15 * e.merch * (mon(S.date) === 7 ? 3 : 1) * merchF(S) * (1 + (11 - S.lvl) * 0.05);
    book(S, 'Merchandise & Trikots', Math.round(merch));
    S.sponsors = S.sponsors.filter(function (s) { if (s.until < S.date.slice(0, 7)) { msg(S, 'finanzen', 'Werbevertrag mit ' + s.firm + ' (' + s.slotName + ') ist ausgelaufen.'); if (s.slot === 'stadion') S.stadion = homeStadion(S); if (s.slot === 'brust') S.jersey = null; return false; } book(S, 'Werbedeals', s.m); return true; });
    S.tmp.sponsors = S.tmp.sponsors.filter(function (s) { if (s.n <= 0) return false; book(S, 'Werbedeals', s.m); s.n--; return true; });
    if (mon(S.date) === 1 || mon(S.date) === 4) { var exp = S.players.filter(function (p) { return p.ce <= S.season + 1 && !p.loan && !p.block; }); if (exp.length) msg(S, 'transfer', '📝 Verträge laufen im Sommer aus: ' + exp.map(function (p) { return p.n; }).join(', ') + '. Im Kader verlängern, sonst gehen sie ablösefrei!'); }
    // Platz
    if (S.pitch.type === 'kunst') {
      S.pitch.age += 1 / 12;
      var c = pitchCond(S);
      if (c < 0.2 && c > 0.12) msg(S, 'verein', '⚠️ Der Kunstrasen ist stark abgenutzt (' + Math.round(c * 100) + ' %). Mehr Verletzungen – erneuern!');
      if (S.pitch.age > S.pitch.life + 1) { msg(S, 'verein', '⛔ Der Kunstrasen ist gesperrt! Heimspiele finden auf einem Ausweichplatz statt (deutlich weniger Zuschauer), bis er erneuert ist.'); S.fans = clamp(S.fans - 3, 0, 100); }
    }
    // Vorstand
    var me = svwRank(S); var n = S.world.lv[S.lvl].length; var played = S.fix.filter(function (f) { return f.hg != null; }).length;
    if (me && played > n * 2) {
      var tgt = { aufstieg: Math.max(1, L.up), oben: Math.ceil(n / 3), mitte: Math.ceil(n * 2 / 3), erhalt: n - L.down }[S.goal] || n;
      S.board += me.rank <= tgt ? 2 : -Math.min(4, (me.rank - tgt) * 0.6);
    }
    if (S.cash < 0) { S.board -= 6; msg(S, 'finanzen', 'Die Kasse ist im Minus (' + euro(S.cash) + ')! Der Vorstand wird nervös.'); }
    if (S.cash < -Math.max(5000, L.budget * 0.3)) { S.board -= 10; }
    S.board = clamp(S.board, 0, 100);
    S.fans = clamp(S.fans + (55 + e.fans - S.fans) * 0.05, 0, 100); checkBars(S);
    if (S.board <= 0 && diffDays(S.start, S.date) > 180) fire(S, 'Der Vorstand hat das Vertrauen verloren.');
    else if (S.board <= 0) S.board = 5;
    else if (S.board < 20) msg(S, 'verein', '⚠️ Der Vorstand stellt dir ein Ultimatum. Das Vertrauen ist fast weg.');
  }

  // ============================================================ Ereignisse
  function monthReport(S, prevM) {
    if (!prevM) return; var m = prevM.m; var mn = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][+m.slice(5, 7) - 1];
    var ti = 0, to = 0; Object.keys(prevM.inn).forEach(function (k) { ti += prevM.inn[k]; }); Object.keys(prevM.out).forEach(function (k) { to += prevM.out[k]; });
    if ([1, 4, 7, 10].indexOf(+m.slice(5, 7)) >= 0) infoMail(S, 'Kassenwart', 'Monatsbericht Finanzen ' + mn + ' ' + m.slice(0, 4), 'Einnahmen ' + euro(ti) + ', Ausgaben ' + euro(to) + ', Ergebnis ' + euro(ti - to) + '.', 'report', { m: m, mn: mn, inn: prevM.inn, out: prevM.out, ti: Math.round(ti), to: Math.round(to) });
  }
  function maybeEvent(S, D) {
    if (R() > 0.08) return; // etwas seltener (vorher 11 %)
    var m = mon(S.date);
    var el = D.events.filter(function (ev) { return S.lvl >= ev.top && S.lvl <= ev.bot && (!ev.months.length || ev.months.indexOf(m) >= 0) && !(S.evCd[ev.i] && diffDays(S.evCd[ev.i], S.date) < 150) && !(/veteran/.test(ev.yesFx) && (S.vetSeason === S.season || R() < 0.5)) && !(ev.title === 'Granulat-Debatte' && (pitchCond(S) >= 0.4 || S.pitch.type === 'natur' || R() < 0.6)); });
    if (!el.length) return;
    var ev = wpick(el, function (x) { return x.w; });
    S.evCd[ev.i] = S.date;
    var cands = avail(S).filter(function (p) { return !(p.loan && p.loan.to) && !p.self; }); var pl = cands.length ? pick(cands) : null;
    var opp = pick(S.world.lv[S.lvl].filter(function (t) { return !t.svw; }));
    var amt = (ev.yesFx + ' ' + ev.noFx).match(/geld:\s*([+-]?\d+)/);
    var betrag = amt ? euro(nice(Math.abs(+amt[1]) * moneyScale(S, D))) : '';
    var fill = function (s) { return rxL(S, s).replace(/\{spieler\}/g, pl ? pl.n : 'Ein Spieler').replace(/\{gegner\}/g, opp ? opp.n : 'Ein Rivale').replace(/\{betrag\}/g, betrag).replace(/\{verein\}/g, D.club); };
    var vet = null; if (/veteran/.test(ev.yesFx)) { S.vetSeason = S.season; var vt0 = newPlayer(S, D, { age: rint(32, 34), lvl: Math.max(1, S.lvl - 2), tal: 1 }); vt0.sal = nice(salDemand(vt0, S.lvl) * 0.3); vt0.ce = S.season + 1; vet = vt0; }
    pend(S, { type: 'event', ev: ev.i, vet: vet, pid: pl ? pl.id : null, opp: opp ? opp.n : null, title: fill(ev.title), text: fill(ev.text), opts: [{ k: 'yes', label: fill(ev.yes) }, { k: 'no', label: fill(ev.no) }] });
  }
  function applyFx(S, D, fx, ctx) {
    var out = [];
    if (!fx) return out;
    if (fx.indexOf('||') >= 0) {
      var parts = fx.split('||'); var ch = (parts[0].match(/chance:\s*(\d+)/) || [0, 50])[1];
      var ok = R() * 100 < +ch; fx = ok ? parts[0] : parts[1]; out.push(ok ? 'Es hat geklappt!' : 'Leider ging es schief.');
    }
    var p = ctx.pid != null ? S.players.filter(function (x) { return x.id === ctx.pid; })[0] : null;
    var ms = moneyScale(S, D);
    fx.split(';').forEach(function (tok) {
      tok = tok.trim(); if (!tok) return; var kv = tok.split(':'); var k = kv[0].trim(), v = kv.length > 1 ? kv[1].trim() : '';
      var n = parseFloat(v);
      switch (k) {
        case 'chance': break;
        case 'geld': var a = nice(n * ms); book(S, 'Ereignisse', a); out.push((a >= 0 ? '+' : '') + euro(a)); break;
        case 'fans': S.fans = clamp(S.fans + n, 0, 100); out.push('Fans ' + (n >= 0 ? '+' : '') + n); break;
        case 'vorstand': S.board = clamp(S.board + n, 0, 100); if (n) out.push('Vorstand ' + (n >= 0 ? '+' : '') + n); break;
        case 'moral': S.moral = clamp(S.moral + n, 10, 100); out.push('Moral ' + (n >= 0 ? '+' : '') + n); break;
        case 'fitness': S.players.forEach(function (q) { q.fit = clamp(q.fit + n, 20, 100); }); out.push('Fitness ' + n); break;
        case 'form': S.players.forEach(function (q) { q.form = clamp(q.form + n, -5, 5); }); out.push('Form ' + (n >= 0 ? '+' : '') + n); break;
        case 'chem': S.chem = { v: n, until: addDays(S.date, 30) }; out.push('Teamgeist gestärkt'); break;
        case 'sp_fit': if (p) p.fit = clamp(p.fit + n, 20, 100); break;
        case 'sp_form': if (p) p.form = clamp(p.form + n, -5, 5); break; case 'sp_aufg': if (p) { S.pen = p.id; S.fk = p.id; S.ck = p.id; out.push(p.n + ' übernimmt ab sofort Elfmeter, Freistöße und Ecken.'); } break;
        case 'sp_abs': if (p) { p.abs = Math.max(p.abs || 0, n); } break;
        case 'sp_str': if (p) { p.str = clamp(p.str + n, 1, 99); p.pot = Math.max(p.pot, p.str); } break;
        case 'sp_verletzt': if (p) { p.inj = Math.max(p.inj, n); out.push(p.n + ' fällt ' + n + ' Tage aus'); } break;
        case 'sp_gehalt': if (p) { p.sal = nice(p.sal * (1 + n / 100)); out.push(p.n + ' verdient jetzt ' + euro(p.sal)); } break;
        case 'sp_vertrag': if (p) { p.ce += n; out.push(p.n + ' verlängert bis 06/' + p.ce); } break;
        case 'sp_weg': if (p) { removePlayer(S, p); out.push(p.n + ' verlässt den Verein'); } break;
        case 'sp_verkauf': if (p) { var fee = nice(mw(p) * 0.5); book(S, 'Transfererlöse', fee); trLog(S, 'out', p.n, fee, ctx.opp || 'Rivale', p, D); removePlayer(S, p); out.push(p.n + ' wechselt zu ' + (ctx.opp || 'einem Rivalen') + ' (' + euro(fee) + ')'); } break;
        case 'verletzt': var c = avail(S); if (c.length) { var q = pick(c); q.inj = Math.max(q.inj, n); out.push(q.n + ' verletzt (' + n + ' Tage)'); } break;
        case 'kranke': shuffle(avail(S)).slice(0, n).forEach(function (q) { q.inj = Math.max(q.inj, 7); }); out.push(n + ' Spieler fallen eine Woche aus'); break;
        case 'heilung': S.players.forEach(function (q) { if (q.inj) q.inj = Math.max(1, q.inj - n); }); out.push('Verletzte schneller zurück'); break;
        case 'talent': var y = newPlayer(S, D, { age: rint(16, 17), lvl: Math.min(D.maxLvl, S.lvl + 1), talBonus: true }); y.str = clamp(D.lv[Math.min(D.maxLvl, S.lvl + 1)].lo + rnd(0, 6), 1, 90); y.pot = potOf(y.str, y.age, y.tal); y.sal = salDemand(y, S.lvl); y.ce = S.season + 3; y.youth = true; S.trials = S.trials || []; S.trials.push({ p: y, until: addDays(S.date, 7) }); out.push(y.n + ' (' + y.age + ' J.) kommt eine Woche zum Probetraining – danach entscheidest du'); break;
        case 'veteran': var vt = ctx.vet ? JSON.parse(JSON.stringify(ctx.vet)) : newPlayer(S, D, { age: rint(32, 34), lvl: Math.max(1, S.lvl - 2), tal: 1 }); if (ctx.vet) { vt.id = S.nextId++; S.players.push(vt); out.push(vt.n + ' (' + vt.dp + ', Stärke ' + Math.round(vt.str) + ') verstärkt das Team'); break; } vt.sal = nice(salDemand(vt, S.lvl) * 0.3); vt.ce = S.season + 1; S.players.push(vt); out.push(vt.n + ' (' + vt.pos + ', Stärke ' + Math.round(vt.str) + ') verstärkt das Team'); break;
        case 'spieler': var np = newPlayer(S, D, { age: rint(19, 29), lvl: S.lvl, pos: v || undefined }); var ref0 = S.players.length ? xiAvg(S, D) : lvMid(D, S.lvl); np.str = clamp(ref0 + (R() < 0.25 ? rnd(1, 5) : rnd(-8, 2)), 1, 99); np.tal = pick([1, 1.5, 2, 2, 2.5, 3, 3, 3.5, 4]); np.pot = potOf(np.str, np.age, np.tal); np.sal = salDemand(np, S.lvl);
          S.trials = S.trials || []; S.trials.push({ p: np, until: addDays(S.date, 7) }); out.push(np.n + ' (' + np.dp + ', ' + np.age + ' J.) kommt eine Woche zum Probetraining'); break;
        case 'sponsor': var sp = v.split('/'); S.tmp.sponsors.push({ m: nice(+sp[0] * ms), n: +sp[1] || 6 }); out.push('+' + euro(nice(+sp[0] * ms)) + ' pro Monat für ' + (+sp[1] || 6) + ' Monate'); break;
        case 'zuschauer': var zp = v.split('/'); S.tmp.zus = { p: +zp[0], n: +zp[1] || 1 }; out.push('Zuschauer ' + (+zp[0] >= 0 ? '+' : '') + zp[0] + ' % (nächste ' + (+zp[1] || 1) + ' Heimspiele)'); break;
        case 'betrieb': S.betrieb += n; out.push('Laufende Kosten ' + (n >= 0 ? '+' : '') + euro(nice(n * ms)) + '/Monat'); break;
        case 'platz': if (S.pitch.type === 'kunst') S.pitch.age += S.pitch.life * n / 100; out.push('Platzzustand ' + (n > 0 ? 'schlechter' : 'besser')); break;
        case 'build': if (D.items[v]) { S.built[v] = true; out.push(D.items[v].name + ' ist jetzt vorhanden'); } break;
      }
    });
    return out;
  }
  function removePlayer(S, p) { S.players = S.players.filter(function (x) { return x !== p; }); if (S.lineup.xi) S.lineup.xi = S.lineup.xi.map(function (id) { return id === p.id ? null : id; }); S.train.fp = S.train.fp.filter(function (id) { return id !== p.id; }); }

  // ============================================================ Social Media & Nachrichten
  function clubSquad(S) { return S.players.reduce(function (a, p) { return a + (p.loan && p.loan.from ? 0 : mw(p)); }, 0); }
  function svwN() { return pick(['SV Wachtberg', 'der SVW', 'die Macht im Ländchen', 'die Rot-Grünen', 'der SV Wachtberg']); }
  function hypeUp(S, v) { if (!S.hypeUntil || S.hypeUntil < S.date || (S.hype || 0) < v) { S.hype = Math.max(v, S.hypeUntil >= S.date ? S.hype || 0 : 0); S.hypeUntil = addDays(S.date, 7); } }
  function ownPost(S, txt, kind) { S.feed.unshift({ id: S.nextId++, u: S.reg ? locOf(S).handle : 'svwachtberg', own: true, t: rx(S, txt), k: kind || 'fans', seed: rint(1, 9999), likes: rint(20, 80) + Math.round((S.follow || 0) / 25), liked: true, d: S.date }); if (S.feed.length > 30) S.feed.length = 30; }
  function rarePost(S, D, kind) {
    if (kind === 'fvm' && S.reg && S.reg.verband !== 'Mittelrhein') kind = 'dfb';
    var L = D.lv[S.lvl], P = { dfb: ['dfb', ['Amateurfußball ist Herzblut! ❤️ Heute grüßen wir ' + svwN() + ' aus der ' + L.short + ' – #UnsereAmateure', 'Ehrenamt verdient Applaus 👏 Danke an alle Helferinnen und Helfer beim SV Wachtberg – der Macht im Ländchen!', 'Fair Play im Ländchen: Der SVW zeigt, wie Amateurfußball geht. 🤝⚽']], fvm: ['fvm', ['Vereins-Spotlight Mittelrhein: Der SV Wachtberg 🔴🟢 – die Macht im Ländchen begeistert in der ' + L.short + '!', 'Starke Jugendarbeit beim SVW – so geht Talentförderung am Mittelrhein. 💪', 'FVM-Tipp: Am Wochenende lohnt sich der Besuch bei den Rot-Grünen aus Wachtberg! ⚽']], fynn: ['fynn', ['Stark, Jungs! 🔴🟢 Mein Heimatverein zeigt, was im Ländchen steckt. Weiter so, SVW! 💪 #DieMachtImLändchen', 'Was beim SV Wachtberg gerade entsteht, ist richtig stark. Das Projekt hat Zukunft – ich drücke euch die Daumen! 🙌', 'Hier hat für mich alles angefangen. Glückwunsch zum Lauf, SVW – gebt weiter Gas! ⚽❤️', 'Grüße aus Kerkrade! 🇳🇱 Hab euer letztes Spiel verfolgt – starke Truppe. Macht weiter so, Coach ' + S.mgr + '! 👊']], viral: ['viral', ['😂 Dieser Torjubel vom SV Wachtberg geht gerade durch die Decke! #Amateurfußball', '🔥 Unfassbar: Fallrückzieher-Tor im Ländchen – das Video hat schon zigtausend Aufrufe!', '🐐 Der Platzwart des SVW mäht das Vereinslogo in den Rasen – das Netz feiert die Macht im Ländchen!', '⚽ 60-Meter-Treffer beim SV Wachtberg – Tor des Monats?!']] }[kind];
    var lk = kind === 'viral' ? rint(4000, 25000) : kind === 'fynn' ? rint(800, 3500) : rint(1500, 9000);
    S.feed.unshift({ id: S.nextId++, u: P[0], media: kind === 'viral' ? null : P[0], viral: kind === 'viral', rare: kind, t: rx(S, pick(P[1])), k: kind === 'viral' ? pick(['tor', 'fans', 'stadion']) : P[0], seed: rint(1, 9999), likes: lk, liked: false, d: S.date }); if (S.feed.length > 30) S.feed.length = 30;
  }
  // Beitrag eines Instagram-Profils aus den Vorgaben; Platzhalter {verein} {liga} {spieler} {spitze} {punkte} {platz} {trainer}
  function accPost(S, D, a) {
    var T = (a.texts || []).filter(function (x) { return String(x || '').trim(); }); if (!T.length) return;
    var L = D.lv[S.lvl], pl = S.players.length ? pick(S.players.filter(function (p) { return !p.self; })) : null, tb = []; try { tb = table(S); } catch (e) {}
    var me = tb.filter(function (t) { return t.svw; })[0], top = tb[0];
    var txt = String(pick(T)).replace(/\{verein\}/g, S.club).replace(/\{liga\}/g, L.short).replace(/\{spieler\}/g, pl ? pl.n : 'unser Kapitän').replace(/\{spitze\}/g, top ? top.n : S.club).replace(/\{punkte\}/g, top ? top.pts : 0).replace(/\{platz\}/g, me ? tb.indexOf(me) + 1 : '–').replace(/\{trainer\}/g, S.mgr || 'Trainer');
    var fx = a.fx || {}; if (fx.follow) followAdd(S, fx.follow); if (fx.fans) S.fans = clamp((S.fans || 50) + fx.fans, 0, 100); if (fx.spons) S.spons = clamp((S.spons || 50) + fx.spons, 0, 100); if (fx.moral) S.moral = clamp((S.moral || 60) + fx.moral, 0, 100); if (fx.board) S.board = clamp((S.board || 60) + fx.board, 0, 100);
    S.feed.unshift({ id: S.nextId++, u: a.name || a.id, media: 'acc:' + a.id, ver: !!a.ver, col: a.col || '', t: txt, k: 'acc', seed: rint(1, 9999), likes: rint(40, 400) + Math.round((S.follow || 0) / 40), liked: false, d: S.date }); if (S.feed.length > 30) S.feed.length = 30;
  }
  function mediaPost(S, D) {
    var src = R() < 0.5 ? 'kicker' : 'transfermarkt', L = D.lv[S.lvl], pl = S.players.length ? pick(S.players.filter(function (p) { return !p.self; })) : null, tb = []; try { tb = table(S); } catch (e) {}
    var me = tb.filter(function (t) { return t.svw; })[0], top = tb[0];
    var K = [top ? L.short + ': ' + top.n + ' grüßt von der Tabellenspitze (' + top.pts + ' Punkte). Wer stoppt den Primus? 📊' : null, me ? 'Amateur-Check ' + L.short + ': ' + pick(['Der SV Wachtberg', 'Die Macht im Ländchen', 'Der SVW']) + ' aktuell auf Platz ' + (tb.indexOf(me) + 1) + '. Trainer ' + S.mgr + ' hat einen Plan. 🔎' : null, pl ? 'Spieler der Woche-Kandidat: ' + pl.n + ' (' + pl.dp + ') vom SVW überzeugt mit starken Leistungen. ⭐' : null, 'Die Elf des Spieltags in der ' + L.short + ' – ist euer Verein dabei? Jetzt auf kicker.de 🗞️', L.short + ': Torflut am Wochenende! Die Highlights im Überblick ⚽'].filter(Boolean);
    var T = [pl ? 'Marktwert-Update: ' + pl.n + ' (SV Wachtberg) steht jetzt bei ' + euro(mw(pl)) + '. 📈' : null, 'Gerüchteküche ' + L.short + ': Mehrere Vereine sollen an Talenten aus dem Ländchen interessiert sein. 👀', pl ? 'Vertragsticker: Bleibt ' + pl.n + ' über ' + pl.ce + ' hinaus beim SV Wachtberg? 📝' : null, 'Die wertvollsten Kader der ' + L.short + ' – der SV Wachtberg liegt bei ' + euro(clubSquad(S)) + '. 💶', 'Transferbilanz: Wer hat im Ländchen am besten eingekauft? Jetzt abstimmen! 🗳️'].filter(Boolean);
    var txt = rx(S, pick(src === 'kicker' ? K : T)); S.feed.unshift({ id: S.nextId++, u: src, media: src, t: txt, k: src, seed: rint(1, 9999), likes: rint(40, 400) + Math.round((S.follow || 0) / 40), liked: false, d: S.date }); if (S.feed.length > 30) S.feed.length = 30;
  }
  function makePost(S, D, rep) {
    var u = rxU(S, pick(USERS)), pl = S.players.length ? pick(S.players) : null, txt, kind = pick(POSTKIND);
    if (rep) {
      var res = rep.gf + ':' + rep.ga, sc = rep.scorers.length ? pick(rep.scorers).n : null;
      txt = rep.win ? pick(['Was für ein Spiel! ' + res + ' gegen ' + rep.opp + ' 💚⚽', res + '! ' + (sc ? sc + ' mit dem Dosenöffner 🔥' : 'Kampf pur!') + ' #SVW', 'Drei Punkte bleiben im Ländchen! ' + res + ' vs. ' + rep.opp, 'Gänsehaut im ' + S.stadion + '! ' + res + ' 🙌'])
        : rep.draw ? pick(['Punkt mitgenommen. ' + res + ' gegen ' + rep.opp + '. Weiter geht’s! 💪', res + ' – nächstes Mal holen wir die drei Punkte!', 'Unentschieden gegen ' + rep.opp + '. Kopf hoch, Jungs!'])
        : pick(['Bitter heute. ' + res + ' gegen ' + rep.opp + '. Wir stehen hinter euch! 💚', 'Mund abputzen, weitermachen. ' + res, 'Nicht unser Tag. Nächste Woche zeigen wir’s allen!']);
      kind = rep.win ? pick(['fans', 'schal', 'stadion']) : pick(['stadion', 'sonnenuntergang']);
    } else {
      var pp = pick([['Sonntag im ' + S.stadion + ' – gibt nichts Schöneres ☀️⚽', 'stadion'], ['Bratwurst, Bier und SVW. Perfekt 🌭', 'bratwurst'], ['Training im Flutlicht 💡 Die Jungs ziehen voll durch!', 'flutlicht'], [(pl ? pl.n + ' heute im Training mit einem Traumtor 😍' : 'Traumtor im Training 😍'), 'training'], ['Blick vom Ländchen auf den Drachenfels 🏔️ Heimat!', 'drachenfels'], ['Neuer Schal ist da 💚🤍 #Wachtberg', 'schal'], ['Hütchen stehen, Bälle sind aufgepumpt – Trainingsabend! ⚽', 'training'], ['Wer kommt Sonntag mit ins Stadion? 🙋', 'fans'], ['Der Kunstrasen glänzt in der Abendsonne ✨', 'kunstrasen'], ['Fanbus ist gebucht! Auswärtsfahrt wir kommen 🚌', 'fans'], ['Sonnenuntergang über dem Ländchen 🌅 Gleich ist Anstoß.', 'sonnenuntergang'], ['Neuer Spielball ist da. Wer will testen? ⚽', 'ball']]);
      txt = pp[0]; kind = pp[1];
    }
    var lk0 = rint(3, 40) + Math.round(S.fanbase / 30) + Math.round((S.follow || 0) / 60); S.feed.unshift({ id: S.nextId++, u: u, t: rx(S, txt), k: kind, seed: rint(1, 9999), likes: lk0, liked: false, d: S.date }); if (S.follow == null) S.follow = followStart(S); followAdd(S, lk0 * rnd(0.01, 0.05));
    if (S.feed.length > 30) S.feed.length = 30;
  }
  function infoMail(S, from, subj, text, kind, data) {
    S.mails.unshift({ id: S.nextId++, from: rxL(S, from), subj: rx(S, subj), text: rx(S, text), opts: [], d: S.date, info: true, kind: kind || 'info', data: data || null, answered: null });
    if (S.mails.length > 40) S.mails.length = 40;
  }
  function actMail(S, from, subj, text, opts, kind, data) {
    if (S.reg && opts) opts.forEach(function (o) { if (o && typeof o.label === 'string') o.label = rx(S, o.label); });
    S.mails.unshift({ id: S.nextId++, from: rxL(S, from), subj: rx(S, subj), text: rx(S, text), opts: opts, d: S.date, info: false, kind: kind, data: data || null, answered: null });
  }
  function maybeMail(S, D, force) {
    if (!D || !D.mails || !D.mails.length) return;
    if (!force && S.mails.filter(function (m) { return !m.answered && !m.info; }).length >= 1) return;
    S.mailCd = S.mailCd || {}; var wpw = prepWin(S, D, 'winter'), inWinter = S.date >= (S.season + '-12-01') && S.date <= wpw[1]; var pool = D.mails.filter(function (m) { var k = m.text.slice(0, 40); if (/Rückrunde|Winterpause|Wintervorbereitung/i.test(m.text) && !inWinter) return false; return !(S.mailCd[k] && diffDays(S.mailCd[k], S.date) < 240); }); if (!pool.length) pool = D.mails; var t = pick(pool); S.mailCd[t.text.slice(0, 40)] = S.date; var mc = avail(S).filter(function (q) { return !q.self; }); var pl = mc.length ? pick(mc) : null; var opp = pick(S.world.lv[S.lvl].filter(function (x) { return !x.svw; }));
    var fill = function (x) { return rx(S, String(x)).replace(/\{spieler\}/g, pl ? pl.n : 'Ein Spieler').replace(/\{gegner\}/g, opp ? opp.n : 'Ein Rivale').replace(/\{verein\}/g, D.club); };
    S.mails.unshift({ id: S.nextId++, from: fill(t.from), subj: fill(t.text).split(/[.!?]/)[0].slice(0, 60), text: fill(t.text), opts: t.opts.map(function (o) { return { label: fill(o.label), fx: o.fx }; }), d: S.date, pid: pl ? pl.id : null, opp: opp ? opp.n : null, answered: null });
    if (S.mails.length > 25) S.mails.length = 25;
  }

  // ============================================================ Transfermarkt
  function inWindow(d) { var m = mon(d); return m === 7 || m === 8 || m === 1; }
  function nextWindow(d) { var m = mon(d), y = yr(d); return m >= 2 && m <= 6 ? y + '-07-01' : m >= 9 ? (y + 1) + '-01-01' : d; }
  function mkMarketPlayer(S, D, free) {
    var src = clamp(S.lvl + (free ? pick([0, 1, 1, 2]) : pick([-2, -1, -1, 0, 0, 0, 1, 1, 2])), 1, D.maxLvl);
    var p = newPlayer(null, D, { lvl: src, talBonus: eff(S, D).scout > 0 && R() < 0.3 });
    if (free) { p.age = rint(24, 34); p.str = clamp(p.str - rnd(0, 5), 1, 99); p.pot = potOf(p.str, p.age, p.tal); }
    p.mid = S.nextId++; p.club = free ? 'vereinslos' : pick(S.world.lv[src].filter(function (t) { return !t.svw; })).n; p.clubLvl = src; p.free = !!free;
    p.fee = free ? 0 : nice(mw(p) * rnd(0.9, 1.5) * 0.8); p.dem = salDemand(p, S.lvl); p.n = genName(S, D); p.ce = 0; p.att = 0;
    return p;
  }
  function ytrNudge(S, D) {
    if (!S.youth || !S.youth.length) { S.ytrStart = null; return; } if (!S.ytrStart) S.ytrStart = S.date;
    var last = S.ytrLast && S.ytrLast > S.ytrStart ? S.ytrLast : S.ytrStart; if (diffDays(last, S.date) < 14) return; if (S.ytrMail && diffDays(S.ytrMail, S.date) < 14) return;
    S.ytrMail = S.date; var best = S.youth.slice().sort(function (a, b) { return b.str - a.str; })[0];
    infoMail(S, 'Jugendtrainer der Academy', 'Darf mal einer bei der Ersten mittrainieren?', 'Hallo Trainer, seit zwei Wochen hat keiner meiner Jungs mehr bei der Ersten mittrainiert. ' + (best ? best.n + ' (' + best.dp + ') brennt darauf, sich zu zeigen. ' : '') + 'Ein Training pro Woche bei euch bringt den Talenten richtig was – unter Academy → Talente kannst du einen hochholen.', 'info');
  }
  function nlzDaily(S, D) {
    var Z = S.nlzS; if (!Z || Z.season !== S.season) Z = S.nlzS = { season: S.season, n: 0, target: rint(1, 3), next: addDays(S.date, rint(35, 90)) };
    var M = S.market; if (!M) return; M.list = M.list.filter(function (p) { return !p.nlz || p.nlzUntil >= S.date; });
    if (!has(S, 'transfers')) return; // NLZ-Spieler erst, wenn Transfers freigeschaltet sind
    if (M.list.some(function (p) { return p.nlz; }) || Z.n >= Z.target || S.date < Z.next) return;
    var p = mkMarketPlayer(S, D, true); p.age = rint(16, 18); p.tal = Math.round(rnd(3.5, 4.6) * 2) / 2; var avg = xiAvg(S, D); p.str = clamp(avg - rnd(1, 3.5), 1, 99); p.pot = potOf(p.str, p.age, p.tal); p.mw = 0; p.dem = salDemand(p, S.lvl); p.nlz = true; p.nlzUntil = addDays(S.date, 2); p.club = 'vereinslos (NLZ)';
    M.list.push(p); Z.n++; Z.next = addDays(S.date, rint(18, 40));
    infoMail(S, 'Scout-Tipp', '🎓 Talent ohne Verein: ' + p.n, p.n + ' (' + p.age + ', ' + p.dp + ') hat im Nachwuchsleistungszentrum keine Chance mehr bekommen und sucht einen Verein. Er ist nur 3 Tage zu haben – schau unter Finanzen → Transfers.', 'info');
  }
  function refreshMarket(S, D, full, keep) {
    var e = eff(S, D); var N = 16 + (e.scout ? 10 : 0);
    var M = S.market;
    if (full) { M.list = []; M.loans = []; }
    M.list = M.list.filter(function (p) { return p.nlz ? (!full && p.nlzUntil >= S.date) : R() < (keep || 0.65); });
    while (M.list.length < N) M.list.push(mkMarketPlayer(S, D, false));
    var free = M.list.filter(function (p) { return p.free && !p.nlz; }).length;
    for (var i = free; i < 5; i++) M.list.push(mkMarketPlayer(S, D, true));
    M.loans = M.loans.filter(function () { return R() < 0.6; });
    while (M.loans.length < 6) {
      var src = clamp(S.lvl - rint(1, 3), 1, D.maxLvl); var p = newPlayer(null, D, { lvl: src, age: rint(18, 22) });
      p.mid = S.nextId++; p.n = genName(S, D); p.club = pick(S.world.lv[src].filter(function (t) { return !t.svw; })).n; p.clubLvl = src;
      p.loanFee = nice(mw(p) * rnd(0.08, 0.18)); p.share = pick([0.5, 0.75, 1]); p.dem = nice(salDemand(p, S.lvl) * p.share);
      M.loans.push(p);
    }
  }
  function aiOffers(S, D) {
    if (!has(S, 'transfers')) return;
    S.players.forEach(function (p) {
      if (p.loan || p.self || p.untouch) return;
      if (S.mails.some(function (m) { return m.kind === 'offer' && !m.answered && m.data.pid === p.id; })) return;
      var v = mw(p); var chance = p.tl ? (p.ask <= v * 1.0 ? 0.45 : p.ask <= v * 1.3 ? 0.2 : 0.05) : 0;
      var top = S.players.slice().sort(function (a, b) { return b.str - a.str; }).slice(0, 5);
      if (!p.tl && top.indexOf(p) >= 0) chance = 0.03; else if (!p.tl && p.gp >= 3) chance = 0.006;
      if (p.leaving) chance = 0;
      if (R() < chance) {
        var src = clamp(S.lvl - (p.tl ? rint(-1, 1) : rint(1, 2)), 1, D.maxLvl); var club = pick(S.world.lv[src].filter(function (t) { return !t.svw; })).n;
        var fee = p.tl ? nice(Math.min(p.ask * rnd(0.85, 1.05), v * rnd(0.8, 1.3))) : nice(v * rnd(1.1, 1.7));
        if (fee <= 0) fee = nice(v * 0.5) || 100;
        actMail(S, 'Sportdirektor ' + club, 'Transferanfrage: ' + p.n, 'Guten Tag, wir würden ' + p.n + ' (' + p.dp + ', ' + p.age + ' J., Marktwert ' + euro(v) + ') gerne verpflichten und bieten ' + euro(fee) + ' Ablöse. Wir freuen uns auf Ihre Antwort.', [{ label: 'Verkaufen für ' + euro(fee), fx: '' }, { label: 'Ablehnen', fx: '' }, { label: 'Mehr fordern (+25 %)', fx: '' }, { label: 'Unverkäuflich erklären', fx: '' }], 'offer', { pid: p.id, fee: fee, club: club });
      }
    });
  }
  function squadOk(S, without) {
    var ps = S.players.filter(function (p) { return p !== without && !(p.loan && p.loan.to); });
    var tw = ps.filter(function (p) { return p.pos === 'TW'; }).length; var fl = ps.length - tw;
    if (without && without.pos === 'TW' && tw < 2) err('Mindestens 2 Torhüter müssen im Kader bleiben.');
    if (without && without.pos !== 'TW' && fl < 13) err('Mindestens 13 Feldspieler müssen im Kader bleiben.');
  }
  function tmStatus(d) {
    var y = yr(d), m = mon(d);
    if (m === 7 || m === 8) return { st: 'open', txt: 'Transfermarkt offen bis 31.08.' + y, to: y + '-08-31' };
    if (m === 1) return { st: 'open', txt: 'Transfermarkt offen bis 31.01.' + y, to: y + '-01-31' };
    var next = m < 7 && m > 1 ? y + '-07-01' : (m === 12 ? (y + 1) + '-01-01' : y + '-01-01');
    if (m >= 9) next = (y + 1) + '-01-01';
    var dd = diffDays(d, next);
    return { st: dd <= 14 ? 'soon' : 'closed', txt: 'Transfermarkt öffnet am ' + next.slice(8, 10) + '.' + next.slice(5, 7) + '.' + next.slice(0, 4) + (dd <= 14 ? ' (in ' + dd + ' Tagen)' : ''), from: next };
  }
  var ILVL = { ausbau5k: 1, ausbau10k: 1, arena: 1, bushalt: 6, sprachschule: 8, agym: 3, internat: 10, jzentrum: 9, aplatz: 4, parkplatz: 5, videowand: 6, flutlicht3: 12, flutlicht2: 7, indoor: 14, kabinen2: 12 };
  // Bauhof: Stufe 1–10 → Bauzeit −3 % (+1 % je Stufe), Kosten −5 % (+1 % je Stufe); gleichzeitige Projekte 2 / 3 (St. 3) / 4 (St. 6) / 5 (St. 10)
  function bhLvl(S) { return S.built && S.built.bauhof ? ((S.upg || {}).bauhof || 1) : 0; }
  function bhCostF(S) { var l = bhLvl(S); return l ? 1 - (0.05 + (l - 1) * 0.01) : 1; }
  function bhDaysF(S) { var l = bhLvl(S); return l ? 1 - (0.03 + (l - 1) * 0.01) : 1; }
  function bhMax(S) { var l = bhLvl(S); return S._dev ? 99 : l >= 10 ? 5 : l >= 6 ? 4 : l >= 3 ? 3 : 2; }
  function upgOk(it) { return it && it.cat !== 'Personal' && it.cat !== 'Mannschaften' && (it.cost || 0) > 0; }
  function upgCost(it, lv) { return nice((it.cost || 0) * 0.22 * lv); }
  function itemLvl(it) {
    if (ILVL[it.id] != null) return ILVL[it.id];
    var c = it.cost || 0; var l = c >= 400000 ? 22 : c >= 150000 ? 18 : c >= 60000 ? 14 : c >= 25000 ? 11 : c >= 8000 ? 8 : 6;
    if (it.cat === 'Personal') l = Math.max(l, 8);
    var h = 0; for (var i = 0; i < it.id.length; i++) h = (h * 7 + it.id.charCodeAt(i)) % 5;
    return Math.max(6, l + (h - 2 > 0 ? 1 : h - 2 < 0 ? -1 : 0));
  }
  function itemIncome(S, D, it) {
    var L = D.lv[S.lvl], fx = it.fx || {}; var att = Math.min(capacity(S, D), S.fanbase / 4 * (0.4 + S.fans / 100)); var homeM = 2;
    var inc = 0;
    if (fx.food) inc += att * foodBase(S.lvl) * 1.15 * homeM * fx.food / 100;
    if (fx.ticket) inc += att * S.ticket * homeM * fx.ticket / 100;
    if (fx.zus) inc += att * fx.zus / 100 * (S.ticket + foodBase(S.lvl) * 1.15) * homeM;
    if (fx.kap) inc += Math.max(0, Math.min(fx.kap, att * 0.15)) * (S.ticket + foodBase(S.lvl)) * homeM * 0.3;
    if (fx.spons) inc += L.spons * fx.spons / 100 * 3;
    if (fx.members) inc += L.budget * 0.3 * fx.members / 100 / 12;
    if (fx.merch && fx.merch > 1) inc += S.fanbase * (S.fans / 100) * 0.15 * (fx.merch - 1);
    return nice(inc);
  }
  var DAYEV = {
    eroeffnung: ['Saisoneröffnung', 'Großes Fest mit Mannschaftsvorstellung', 800, [7, 8], 1],
    abschluss: ['Saisonabschlussfeier', 'Feier mit Team, Helfern und Fans', 600, [5, 6], 1],
    weihnacht: ['Weihnachtsfeier', 'Team- und Vereinsfeier zum Jahresende', 500, [12], 1],
    kids: ['KidsDay', 'Fußballtag für Kinder – vielleicht entdeckt ihr Talente', 300, null, 2],
    fan: ['Fan Tag', 'Autogramme, Grillen, Torwandschießen', 400, null, 2],
    sponsor: ['Sponsoren Tag', 'Partner einladen, Netzwerken, Business-Lunch', 500, null, 2],
    camp3: ['Kurz-Trainingslager (3 Tage)', 'Regional, Sportschule Hennef', 1500, null, 2],
    camp5: ['Trainingslager (5 Tage)', 'Regional, Eifel', 3000, null, 2],
    halle: ['Hallenturnier', 'Ein Tag in der Halle – Spaß, Fitness und Zuschauer', 250, [12, 1, 2], 1],
    gala: ['Spendengala „Kinder in Not“', 'Benefizabend für Kinder in Not – kostet 2.500 €, bringt viel Ansehen bei Fans und Sponsoren', 2500, null, 1, true],
    benefiz: ['Benefizspiel gegen Profiteam', 'Ihr ladet ein Team aus der 1.–3. Liga ein – wer kommt, ist eine Überraschung. Kostet 10.000 €', 10000, null, 1],
    foerder: ['Förderverein-Treffen', 'Die Gönner des Vereins treffen sich – kostet 125 €, meistens gibt es ein Geldgeschenk', 125, null, 1, true]
  };
  DAYEV.fan[5] = true; DAYEV.sponsor[5] = true;
  function dayEvCost(S, D, k) { if (k === 'gala') return 2500; if (k === 'benefiz') return 10000; if (k === 'foerder') return 125; return nice(DAYEV[k][2] * moneyScale(S, D)); }
  function runDayEv(S, D, ev) {
    var k = ev.k, out = [];
    if (k === 'benefiz' && ev.opp) return []; if (k === 'benefiz') { var rr = R(), tier = rr < 0.6 ? 3 : rr < 0.88 ? 2 : 1, opp = benPick(S, tier), inc = tier === 3 ? rint(5000, 8000) : tier === 2 ? rint(8000, 15000) : rint(15000, 30000); inc = nice(inc); var fg = (4 - tier) * rint(250, 600) + rint(150, 400); book(S, 'Benefizspiel', inc); S.fans = clamp(S.fans + 4 + (4 - tier) * 2, 0, 100); S.spons = clamp(S.spons + 2 + (4 - tier), 0, 100); S.fanbase = Math.round(S.fanbase * (1.02 + (4 - tier) * 0.015)); S.follow = (S.follow || 0) + fg; S.board = clamp(S.board + 2, 0, 100); var sc = rint(0, 2) + ':' + rint(2 + (3 - tier), 7 - tier); xp(S, 10); ownPost(S, '⚽ Benefizspiel gegen ' + opp + '! Volle Hütte im Ländchen – ' + sc + '. Danke an alle! 💚❤️', 'stadion'); msg(S, 'verein', '🌟 Benefizspiel: ' + opp + ' (' + ['', 'Bundesliga', '2. Bundesliga', '3. Liga'][tier] + ') kam ins Ländchen – ' + sc + '. Einnahmen ' + euro(inc) + ', +' + num(fg) + ' Follower.'); return ['Gast: ' + opp, 'Einnahmen ' + euro(inc), 'Fans +' + (4 + (4 - tier) * 2), '+' + num(fg) + ' Follower']; }
    if (DAYEV[k] && ['camp3', 'camp5', 'halle'].indexOf(k) < 0 && R() < 0.85) ownPost(S, '🎉 ' + DAYEV[k][0] + ' im Ländchen – danke an alle, die dabei waren! 📸💚', k === 'kids' ? 'fans' : 'stadion');
    if (k === 'eroeffnung') { S.fans = clamp(S.fans + 6, 0, 100); S.spons = clamp(S.spons + 5, 0, 100); S.fanbase = Math.round(S.fanbase * 1.03); book(S, 'Einnahmen Vereinsfeste', nice(S.fanbase * 1.5)); out = ['Fans +6', 'Sponsoren +5', 'Fanbasis +3 %']; }
    if (k === 'abschluss') { S.moral = clamp(S.moral + 8, 0, 100); S.board = clamp(S.board + 3, 0, 100); out = ['Moral +8', 'Vorstand +3']; }
    if (k === 'weihnacht') { S.moral = clamp(S.moral + 6, 0, 100); S.fans = clamp(S.fans + 2, 0, 100); out = ['Moral +6', 'Fans +2']; }
    if (k === 'kids') { S.fans = clamp(S.fans + 3, 0, 100); if (R() < 0.5) { var n = rint(1, 2); for (var i = 0; i < n; i++) { var y = newYouth(S, D, R() < 0.3); y.age = rint(14, 15); youthAdd(S, y); } out = ['Fans +3', n + ' neue(s) Talent(e) für die Academy']; } else out = ['Fans +3', 'Kein Talent dabei']; }
    if (k === 'fan') { S.fans = clamp(S.fans + 8, 0, 100); S.fanbase = Math.round(S.fanbase * 1.05); book(S, 'Einnahmen Vereinsfeste', nice(S.fanbase * 0.8)); out = ['Fans +8', 'Fanbasis +5 %']; }
    if (k === 'sponsor') { S.spons = clamp(S.spons + 10, 0, 100); if (R() < 0.6) sponsorOffer(S, D); out = ['Sponsoren +10']; }
    if (k === 'halle') { S.moral = clamp(S.moral + 4, 0, 100); S.fans = clamp(S.fans + 2, 0, 100); book(S, 'Hallenturnier', nice(D.lv[S.lvl].zus * 3)); out = [pick(['Turniersieg! 🏆', 'Halbfinale erreicht', 'Gruppenphase überstanden']), 'Moral +4', 'Fans +2']; }
    if (k === 'camp3' || k === 'camp5') { var days = k === 'camp3' ? 3 : 5; var cb2 = k === 'camp3' ? 8 : 14; S.camp = { name: DAYEV[k][0], from: S.date, to: addDays(S.date, days - 1), e: k === 'camp3' ? 1.5 : 2.5, boost: true }; S.players.forEach(function (p) { if (p.loan && p.loan.to) return; p.fitCap = Math.min(100, (p.fitCap || 80) + cb2); p.fit = Math.min(p.fitCap, p.fit + cb2 + 2); }); S.moral = clamp(S.moral + 3, 0, 100); S.chem = { v: Math.min(2, ((S.chem && S.chem.v) || 0) + 0.5), until: addDays(S.date, 30) }; out = ['Fitness-Grundlage +' + cb2 + ' (Obergrenze steigt)', 'Fitness +' + (cb2 + 2), 'Moral +3', 'Eingespielter (Teamgeist 30 Tage)']; }
    if (k === 'gala') { S.fans = clamp(S.fans + 5, 0, 100); S.spons = clamp(S.spons + 9, 0, 100); S.board = clamp(S.board + 3, 0, 100); out = ['Fans +5', 'Sponsoren +9', 'Vorstand +3', 'Gutes Image in der Region']; }
    if (k === 'foerder') { var rr = R(); var gift = nice(rr < 0.55 ? rnd(250, 1500) : rr < 0.85 ? rnd(1500, 4000) : rr < 0.96 ? rnd(4000, 7500) : rnd(7500, 10000)); book(S, 'Förderverein', gift); out = ['Geldgeschenk: ' + euro(gift), gift >= 5000 ? 'Ein Gönner war besonders großzügig!' : 'Danke an alle Unterstützer']; }
    if (k !== 'camp3' && k !== 'camp5') ach(S, 'fest', DAYEV[k][0], true);
    checkBars(S);
    if (k === 'kids' || k === 'kidsday' || k === 'fantag' || k === 'fan') jokPt(S, 4);
    if (k === 'foerder') infoMail(S, 'Förderverein SVW', 'Bericht vom Förderverein-Treffen', 'Lieber Trainer, das Treffen am ' + fmtD(S.date) + ' war ein Erfolg. Die Mitglieder haben zusammengelegt – Ergebnis: ' + out.join(' · ') + '. Das Geld ist bereits auf dem Vereinskonto. Sportliche Grüße, der Vorstand des Fördervereins', 'info');
    else if (k === 'gala') { var spend = nice(rnd(1500, 6000) * Math.max(0.6, moneyScale(S, D))); infoMail(S, 'Vereinsvorstand', 'Spendengala „Kinder in Not“ – Bericht', 'Was für ein Abend! Die Gäste haben ' + euro(spend) + ' für Kinder in Not gespendet. Ergebnis für den Verein: ' + out.join(' · ') + '.', 'info'); }
    else if (R() < 0.3) infoMail(S, 'Vereinsvorstand', DAYEV[k][0] + ' – Rückblick', DAYEV[k][0] + ' am ' + fmtD(S.date) + ' ist gelaufen. Auswirkungen: ' + out.join(', ') + '.', 'info');
    msg(S, 'verein', '🎉 ' + DAYEV[k][0] + ': ' + out.join(', '));
  }
  function sponsorOffer(S, D) {
    var e = eff(S, D); var taken = S.sponsors.map(function (x) { return x.slot; });
    var open = Object.keys(SPONS).filter(function (k) { return has(S, SPONS[k].f) && (!SPONS[k].b || S.built[SPONS[k].b]); });
    if (!open.length) return;
    if (S.pending.some(function (x) { return x.type === 'sponsor'; })) return;
    var free = open.filter(function (k) { return taken.indexOf(k) < 0; });
    var slot = free.length && R() < 0.8 ? pick(free) : pick(open);
    var cur = S.sponsors.filter(function (x) { return x.slot === slot; })[0];
    var q = (1 + Math.max(0, (S.mlvl || 1) - 7) * 0.04) * (1 + e.spons / 100) * (0.6 + S.fans / 100 * 0.4) * (0.6 + (S.spons == null ? 60 : S.spons) / 100 * 0.7) * (1 + (S.fanbase / Math.max(1, D.lv[S.lvl].zus * 4) - 1) * 0.3);
    var m = nice(D.lv[S.lvl].spons * SPONS[slot].w * rnd(0.6, 1.4) * q);
    if (m <= 0 || (cur && m <= cur.m)) return;
    var years = rint(1, 3), firm = rxL(S, pick(FIRMS)), bonus = nice(m * rnd(1, 4));
    var brand = slot === 'stadion' ? firm.split(' ').slice(-1)[0] + '-Arena' : slot === 'training' ? firm.split(' ').slice(-1)[0] + '-Trainingspark' : '';
    var deal = { slot: slot, slotName: SPONS[slot].n, firm: firm, m: m, bonus: bonus, until: (S.season + years) + '-06', brand: brand, desc: rx(S, SPONS[slot].brand) };
    pend(S, { type: 'sponsor', deal: deal, title: 'Angebot: ' + SPONS[slot].n, text: firm + ' bietet ' + euro(m) + ' pro Monat + ' + euro(bonus) + ' Unterschriftsprämie bis 06/' + (S.season + years) + '. Leistung: ' + SPONS[slot].brand + (brand ? ' („' + brand + '“)' : '') + '.' + (cur ? ' Ersetzt den Vertrag mit ' + cur.firm + ' (' + euro(cur.m) + '/Monat).' : ''), opts: [{ k: 'yes', label: 'Unterschreiben' }, { k: 'no', label: 'Ablehnen' }] });
  }

  // ============================================================ Aktionen
  function err(t) { throw new Error(t); }
  function monthsLeft(S) { var m = mon(S.date); return m >= 7 ? 12 - (m - 7) : 6 - m + 1; }
  function trAct(S, mp, st) { S.trAct = S.trAct || []; var e = S.trAct.filter(function (x) { return x.mid === mp.mid; })[0]; if (!e) { e = { mid: mp.mid, n: mp.n, pos: mp.dp, str: Math.round(mp.str), club: mp.club || 'vereinslos', mp: JSON.parse(JSON.stringify(mp)) }; S.trAct.unshift(e); } e.st = st; e.d = S.date; if (st === 'fail') { S.watch = S.watch || []; if (!S.watch.some(function (w) { return w.mid === mp.mid; })) S.watch.push(e.mp); } return e; }
  function trActDone(S, mid) { S.trAct = (S.trAct || []).filter(function (x) { return x.mid !== mid; }); }
  function negoResult(S, D, ng) {
    var mp = ng.mp, fee = ng.fee, sal = ng.sal, ok = true, why = '';
    var reFee = fee, reSal = sal, fix = false;
    var askF = (S.mlvl || 1) >= 29 ? nice(mp.fee * 0.95) : mp.fee;
    if (!mp.free && !ng.feeOk && fee < askF && (fee < askF * 0.85 || R() < 0.5)) { ok = false; why = mp.club + ' lehnt das Angebot ab und fordert ' + euro(askF) + ' Ablöse.'; reFee = askF; fix = true; }
    var gap = S.lvl - natLvl(D, mp.str), wvB = skTraits(mp).wv; var needSal = nice(mp.dem * (1 + 0.35 * Math.max(0, gap)) * [0.92, 1.15, 1, gap < 0 ? 0.88 : gap > 0 ? 1.15 : 1][wvB]);
    if (ok && gap >= 3 && sal < mp.dem * 3) { ok = false; why = mp.n + ' möchte nicht in der ' + D.lv[S.lvl].name + ' spielen.'; }
    if (sal < needSal * 0.98 && !(sal >= needSal * 0.9 && R() < 0.4)) { if (ok) why = mp.n + ' lehnt ab. Er möchte ' + euro(needSal) + ' im Monat verdienen.'; else if (fix) why += ' Außerdem möchte ' + mp.n + ' ' + euro(needSal) + ' im Monat.'; ok = false; reSal = needSal; fix = true; }
    if (!ok && fix && !(gap >= 3 && sal < mp.dem * 3)) { var ng2 = JSON.parse(JSON.stringify(ng)); ng2.fee = reFee; ng2.sal = reSal; var tre = trAct(S, mp, 'renego'); tre.mail = S.nextId; actMail(S, (mp.free || ng.feeOk) ? 'Berater von ' + mp.n : 'Sportdirektor ' + mp.club, 'Nachbessern? ' + mp.n, why + ' Wenn du auf die Forderung eingehst, ist der Wechsel durch.', [{ label: 'Nachbessern: ' + (reFee ? euro(reFee) + ' Ablöse · ' : '') + euro(reSal) + '/Monat', fx: '' }, { label: 'Verzichten', fx: '' }], 'renego', ng2); return; }
    if (!ok) { infoMail(S, (mp.free || ng.feeOk) ? 'Berater von ' + mp.n : 'Sportdirektor ' + mp.club, 'Absage: ' + mp.n, why, 'info'); trAct(S, mp, 'fail'); return; }
    var trs = trAct(S, mp, 'sign'); trs.mail = S.nextId;
    actMail(S, (mp.free || ng.feeOk) ? 'Berater von ' + mp.n : 'Sportdirektor ' + mp.club, 'Zusage: ' + mp.n + ' will kommen!', 'Gute Nachrichten: ' + (mp.free ? '' : mp.club + ' akzeptiert ' + euro(fee) + ' Ablöse und ') + mp.n + ' ist mit ' + euro(sal) + ' im Monat bis 06/' + ng.until + ' einverstanden. Jetzt nur noch unterschreiben!', [{ label: 'Spieler holen', fx: '' }, { label: 'Doch absagen', fx: '' }], 'sign', ng);
  }
  function getP(S, id) { var p = S.players.filter(function (x) { return x.id === +id; })[0]; if (!p) err('Spieler nicht gefunden.'); return p; }
  function seasonEndYear(S) { return S.season + 1; }

  var INJ_T = [[6, ['Prellung', 'Muskelverhärtung', 'Pferdekuss', 'Leichte Zerrung', 'Grippaler Infekt', 'Knöchelblessur']], [20, ['Muskelfaserriss', 'Zerrung im Oberschenkel', 'Bänderdehnung', 'Verstauchtes Sprunggelenk', 'Leistenprobleme', 'Rippenprellung']], [60, ['Bänderriss im Sprunggelenk', 'Muskelbündelriss', 'Meniskusreizung', 'Innenbandanriss', 'Ermüdungsbruch', 'Schambeinentzündung']], [999, ['Kreuzbandriss', 'Meniskusriss', 'Achillessehnenriss', 'Syndesmosebandriss', 'Schienbeinbruch']]];
  function injName(days) { if (INJMEM[days]) { var nm = INJMEM[days]; delete INJMEM[days]; return nm; } var fit = INJL.filter(function (x) { return days >= x[2] * 0.6 && days <= x[3] * 1.6; }); if (fit.length) return wpick(fit, function (x) { return Math.max(0.01, +x[1] || 0); })[0]; var g = INJ_T.filter(function (x) { return days <= x[0]; })[0] || INJ_T[3], L = g[1], w = L.map(function (_, i) { return Math.max(1, 4 - i); }), t = w.reduce(function (a, b) { return a + b; }, 0), r = R() * t; for (var i = 0; i < L.length; i++) { r -= w[i]; if (r <= 0) return L[i]; } return L[0]; }
  function docCost(S, D, p) { return nice(Math.max(250, (D.lv[S.lvl].budget || 50000) * 0.004 + p.inj * 18)); }
  var HOLLY = [['Lia Monroe', 'Popstar', '🎤'], ['Jack Rivers', 'Hollywood-Schauspieler', '🎬'], ['Marcus Steele', 'Basketball-Legende', '🏀'], ['DJ Novaro', 'Weltstar-DJ', '🎧'], ['Elena Vasquez', 'Oscar-Preisträgerin', '🏆'], ['Kai Thunder', 'Rap-Superstar', '🎙️'], ['Sophie Laurent', 'Tennis-Ikone', '🎾'], ['Ryan Blake', 'Action-Star', '🎬'], ['Mira Sky', 'Pop-Ikone', '🎤'], ['Leo Kanter', 'Formel-1-Weltmeister', '🏎️'], ['Nina Rose', 'Supermodel & Schauspielerin', '📸'], ['Tom Brennan', 'Golf-Legende', '⛳'], ['Ava Stone', 'Serienstar', '📺'], ['Big Mo', 'Box-Weltmeister', '🥊']];
  function hollyOn(S) { return (S.mlvl || 1) >= 25 && S.lvl <= 2; }
  function hollyMonthly(S, D) {
    if (S.hollyStar) { bookPot(S, 'Hollywood-Effekt (' + S.hollyStar.n + ')', -S.hollyStar.cost, 'cash'); }
    if (!hollyOn(S)) return; S.holly = S.holly || { list: [], season: S.season, n: 0 }; if (S.holly.season !== S.season) { S.holly.season = S.season; S.holly.n = 0; }
    S.holly.list = S.holly.list.filter(function (x) { return x.exp >= S.date; });
    var want = S.holly.n === 0 ? 0.35 : 0.18; if (S.holly.n < 3 && S.holly.list.length < 3 && R() < want) {
      var used = S.holly.list.map(function (x) { return x.n; }).concat(S.hollyStar ? [S.hollyStar.n] : []), pool = HOLLY.filter(function (h) { return used.indexOf(h[0]) < 0; }); if (!pool.length) return; var h = pick(pool);
      var cost = nice(Math.round(50000 * Math.pow(40, R()))); var eff = Math.round((0.15 + 0.85 * Math.log(cost / 50000) / Math.log(40)) * 100) / 100;
      S.holly.list.push({ n: h[0], type: h[1], ic: h[2], cost: cost, eff: eff, exp: addDays(S.date, 75) }); S.holly.n++;
      msg(S, 'finanzen', '🌟 Hollywood-Effekt: ' + h[1] + ' ' + h[0] + ' könnte das Werbegesicht des Vereins werden (' + euro(cost) + '/Monat).');
    }
  }
  var TALKDEF = { ruhig: [0.35, 0.35, 'Die Jungs wirken konzentriert.'], feuer: [-0.4, 1.0, 'Die Kabine bebt!'], taktik: [0.2, 0.6, 'Jeder kennt seine Aufgabe.'], spass: [0.1, 0.5, 'Lockere Stimmung, alle lachen.'], druck: [-0.6, 1.2, 'Hoher Druck – das kann kippen.'],
    stolz: [0.1, 0.8, 'Die Brust ist breit – für das Wappen!'], fans: [0.0, 0.7, 'Der Gedanke an die Fans gibt Gänsehaut.'], gegner: [-0.3, 0.6, 'Ihr wisst, was die über euch gesagt haben …'], vertrauen: [0.25, 0.55, 'Die Jungs fühlen sich gestärkt.'], einfach: [0.15, 0.45, 'Klare Ansage, klarer Kopf.'],
    drohung: [-1.0, 0.3, 'Wer heute versagt, sitzt nächste Woche auf der Tribüne!'], sieg: [-0.7, 0.4, 'Das gewinnen wir locker – klar.'], schweigen: [-0.5, 0.5, 'Du sagst nichts. Betretenes Schweigen.'], bonus: [-0.2, 0.9, 'Prämie in Aussicht gestellt – alle sind heiß.'], kritik: [-0.9, 0.5, 'Du zählst jeden Fehler vom letzten Spiel auf.'] };
  function talkOpts(S) { var keys = Object.keys(TALKDEF), h = 0, sd = String(S.date); for (var i = 0; i < sd.length; i++) h = (h * 31 + sd.charCodeAt(i)) % 9973; var out = []; while (out.length < 4) { var k = keys[(h + out.length * 7 + out.length * out.length * 3) % keys.length]; if (out.indexOf(k) < 0) out.push(k); else h++; } return out; }
  function wxFor(d, key) {
    var m = +String(d).slice(5, 7), base = [0, 2, 3, 7, 11, 15, 19, 22, 21, 17, 12, 7, 4][m] || 12, h = 0, k = String(d) + (key || ''); for (var i = 0; i < k.length; i++) h = (h * 33 + k.charCodeAt(i)) % 100003;
    var r1 = (h % 1000) / 1000, r2 = ((h / 1000 | 0) % 100) / 100, r3 = ((h * 7) % 997) / 997;
    var t = Math.round(base + (r1 - 0.5) * 12 + (m >= 6 && m <= 8 && r3 > 0.8 ? 6 : 0)), rainP = [0, .45, .4, .4, .35, .35, .3, .3, .3, .35, .45, .5, .5][m] || .35;
    var c = 'sun'; if (r2 < rainP * 0.35) c = t <= 1 ? 'snow' : 'storm'; else if (r2 < rainP * 0.75) c = t <= 1 ? 'snow' : 'rain'; else if (r2 < rainP + 0.15) c = 'cloud'; else if (r2 < rainP + 0.3) c = 'part';
    var wind = Math.round(5 + r3 * 20 + (c === 'storm' ? 25 : c === 'rain' ? 8 : 0));
    return { t: t, c: c, wind: wind, rain: c === 'storm' ? 85 : c === 'rain' ? 60 : c === 'snow' ? 70 : c === 'cloud' ? 25 : c === 'part' ? 15 : 5, heat: t >= 27, wet: c === 'storm' || c === 'rain' };
  }
  // Hinrunde der ersten Saison eines neuen Spiels: keine zufälligen Joker/Sterne
  function firstHalf(S) { return S.season0 != null && S.season === S.season0 && String(S.date) < (S.season0 + 1) + '-01-01'; }
  function dailyPrize(S, D, day) {
    var B = (D.lv[S.lvl] || {}).budget || 50000, k = Math.max(0.4, Math.min(3, Math.sqrt(B / 60000)));
    if (day === 7) { var r = R(); if (firstHalf(S)) r = 0.6; if (r < 0.25) return { t: 'joker', amt: 1, ic: '🃏', txt: '1 Joker' }; if (r < 0.5) return { t: 'star', amt: 0.5, ic: '⭐', txt: '½ Stern' }; var big = nice(Math.max(800, B * 0.08)); return { t: 'club', amt: big, ic: '💰', txt: euro(big) + ' für den Verein' }; }
    var T = [null, ['club', 0.02], ['xp', 40], ['fol', 60], ['priv', 0], ['club', 0.035], ['xp', 90]][day] || ['xp', 30];
    if (T[0] === 'club') { var a = nice(Math.max(250, B * T[1] * rnd(0.85, 1.2))); return { t: 'club', amt: a, ic: '💶', txt: euro(a) + ' Vereinsspende' }; }
    if (T[0] === 'priv') { var pa = nice(Math.round(rnd(120, 300) * k)); return { t: 'priv', amt: pa, ic: '👛', txt: euro(pa) + ' für dich privat' }; }
    if (T[0] === 'fol') { var fa = Math.round(T[1] * k * rnd(0.8, 1.4)); return { t: 'fol', amt: fa, ic: '📱', txt: '+' + fa + ' Follower' }; }
    var xa = Math.round(T[1] * rnd(0.9, 1.3)); return { t: 'xp', amt: xa, ic: '✨', txt: '+' + xa + ' XP' };
  }
  var DK_FAIR = [0, 420, 300, 210, 150, 105, 78, 62, 54, 48, 44, 40];
  function dkSeason(S, D) {
    var K = S.dk = S.dk || { price: rint(45, 65), setS: null, hist: [] }; if (K.hist.some(function (h) { return h.s === S.season; })) return;
    var fair = DK_FAIR[S.lvl] || 50, dem = clamp(1.25 - (K.price - fair) / fair * 1.4, 0.15, 1.7), n = Math.max(5, Math.round((S.fanbase || 500) * 0.06 * (1 + (S.fans - 50) / 160) * dem * (S.lvl <= 4 ? 2.2 : 1)));
    var rev = nice(n * K.price); K.hist.push({ s: S.season, n: n, price: K.price, rev: rev }); K.hist = K.hist.slice(-10); bookPot(S, 'Dauerkarten (' + n + ' Stück)', rev, 'cash');
  }
  var FC_PRE = ['Rot-Grün', 'Ländchen', 'Drachenfels', 'Berkumer', 'Villiper', 'Niederbachemer', 'Pecher', 'Adendorfer', 'Wachtberger', 'Arzdorfer'], FC_POST = ['Ultras', 'Jungs', 'Stammtisch', 'Fanatics', 'Kurve', 'Freunde', 'Supporters', 'Bande', 'Löwen', 'Adler'];
  var FC_STEPS = [[3, 3, function (S) { return true; }, 'Manager-Level 3'], [7, 4, function (S) { return (S.achv || []).filter(function (a) { return a.k === 'aufstieg'; }).length >= 2; }, 'Level 7 + 2 Aufstiege'], [15, 5, function (S) { return S.lvl <= 4; }, 'Level 15 + mind. Regionalliga'], [22, 8, function (S) { return S.lvl <= 2; }, 'Level 22 + mind. 2. Bundesliga'], [1, 20, function (S) { return !!S.blMeister; }, 'Deutscher Meister']];
  function fcPct(S) { return (S.fcs || []).reduce(function (a, f) { return a + f.pct; }, 0); }
  function fcCheck(S, D) {
    S.fcs = S.fcs || []; var n = S.fcs.length; if (n >= FC_STEPS.length) return; var st = FC_STEPS[n]; if (mlv(S) < st[0] || !st[2](S)) return;
    var used = S.fcs.map(function (f) { return f.n; }), nm = ''; for (var i = 0; i < 20 && (!nm || used.indexOf(nm) >= 0); i++) nm = rxL(S, pick(FC_PRE)) + ' ' + pick(FC_POST);
    S.fcs.push({ n: nm, pct: st[1], since: S.date, mem: rint(12, 40) * (n + 1) });
    msg(S, 'verein', '🍻 Neuer Fanclub gegründet: „' + nm + '“! +' + st[1] + ' % auf Zuschauer und Einnahmen.'); xp(S, 20);
  }
  function fcMail(S, D) {
    if (!(S.fcs || []).length || R() > 0.035) return; var f = pick(S.fcs), k = rint(0, 3);
    if (k === 0) actMail(S, 'Fanclub ' + f.n, 'Besuch beim Stammtisch?', 'Hallo Trainer! Wir würden uns riesig freuen, wenn du mal bei unserem Stammtisch vorbeischaust – gerne mit ein, zwei Spielern.', [{ label: 'Klar, ich komme!', fx: 'fans:+3; moral:+1' }, { label: 'Diesmal leider nicht', fx: 'fans:-1' }]);
    else if (k === 1) actMail(S, 'Fanclub ' + f.n, 'Freikarten für die Jugend?', 'Wir möchten mit unserer Jugendgruppe zum nächsten Heimspiel. Gibt es ein paar Freikarten?', [{ label: '20 Freikarten', fx: 'fans:+3; geld:-200' }, { label: '10 Freikarten', fx: 'fans:+2; geld:-100' }, { label: 'Leider nein', fx: 'fans:-2' }]);
    else if (k === 2) actMail(S, 'Fanclub ' + f.n, 'Autogramme für die Tombola', 'Für unsere Weihnachtstombola bräuchten wir ein paar signierte Autogrammkarten. Geht das?', [{ label: 'Die Mannschaft unterschreibt', fx: 'fans:+2; moral:+1' }, { label: 'Nur der Kapitän', fx: 'fans:+1' }]);
    else actMail(S, 'Fanclub ' + f.n, 'Signiertes Trikot?', 'Wir feiern Jubiläum! Ein signiertes Trikot wäre der Höhepunkt unserer Feier.', [{ label: 'Gerne – Geschenk!', fx: 'fans:+4; geld:-90' }, { label: 'Zum Selbstkostenpreis', fx: 'fans:+1; geld:+0' }]);
  }
  function markNew(S) {
    if (!S.knownIds) { S.knownIds = S.players.map(function (p) { return p.id; }); return; }
    S.players.forEach(function (p) { if (S.knownIds.indexOf(p.id) < 0) { S.knownIds.push(p.id); if (!p.self) { p.trib = true; p.isNew = true; } } });
    if (S.knownIds.length > 200) S.knownIds = S.knownIds.slice(-150).concat(S.players.map(function (p) { return p.id; })).filter(function (x, i, a) { return a.indexOf(x) === i; });
  }
  // ---------- Events (im Admin gepflegt, echte Kalenderdaten). D.gev = Liste aus der Tabelle game_events, S._now = Serverzeit
  var GEV_TASKS = { win: ['mcnt', 'win', 'Siege'], game: ['mcnt', 'game', 'Pflichtspiele'], goal: ['mcnt', 'goal', 'Tore'], csheet: ['mcnt', 'csheet', 'Zu-null-Spiele'], bigwin: ['mcnt', 'bigwin', 'Siege mit 3+ Toren Unterschied'], homewin: ['mcnt', 'homewin', 'Heimsiege'], awaywin: ['mcnt', 'awaywin', 'Auswärtssiege'], scored3: ['mcnt', 'scored3', 'Spiele mit 3+ eigenen Toren'], post: ['mcnt', 'post', 'Posts'], social: ['mcnt', 'social', 'Fan-Posts liken/beantworten'], fan: ['mcnt', 'fan', 'Fan-Aktionen'], train: ['mcnt', 'train', 'Trainings'], dmdone: ['mcnt', 'dmdone', 'Tagesmissionen'], test: ['mcnt', 'test', 'Testspiele'], live: ['mcnt', 'live', 'Spiele in der Live-Simulation'], title: ['mcnt', 'title', 'Meisterschaft'], follow: ['s', 'follow', 'neue Follower'] };
  function gevNow(S) { return S._now || new Date().toISOString(); }
  function gevCount(S, task) { var T = GEV_TASKS[task]; if (!T) return 0; return T[0] === 's' ? Math.round(S[T[1]] || 0) : ((S.mcnt || {})[T[1]] || 0); }
  function gevSync(S, D) { var now = gevNow(S); S.evb = S.evb || {}; (D.gev || []).forEach(function (e) { if (now >= e.starts_at && now < e.ends_at && S.evb[e.id] == null) S.evb[e.id] = gevCount(S, e.task); }); }
  function gevTiers(e) { var T = (e.tiers || []).filter(function (t) { return t && +t.at > 0; }); return T.length ? T.sort(function (a, b) { return a.at - b.at; }) : [{ at: e.target || 1 }]; }
  function gevView(S, D) { var now = gevNow(S), cl = S.evc || {}; return (D.gev || []).map(function (e) { var st = now < e.starts_at ? 'soon' : now < e.ends_at ? 'run' : 'over', base = (S.evb || {})[e.id], have = base == null ? 0 : Math.max(0, gevCount(S, e.task) - base), T = gevTiers(e), goal = Math.max(e.target || 0, T[T.length - 1].at);
      return { id: e.id, title: e.title, body: e.body || '', task: e.task, tname: (GEV_TASKS[e.task] || [0, 0, e.task])[2], target: goal, have: Math.min(have, goal), st: st, starts: e.starts_at, ends: e.ends_at, tiers: T.map(function (t, i) { return { i: i, at: +t.at, xp: +t.xp || 0, cash: +t.cash || 0, jk: +t.jk || 0, hs: +t.hs || 0, fol: +t.fol || 0, done: have >= +t.at, claimed: !!(cl[e.id] && cl[e.id][i]) }; }) }; }); }
  function act(S, D, a, p) {
    migratePos(S); S.weekNeed = null; itPool(S);
    migrate(S);
    p = p || {}; S.reports = []; var info = null, reveal = null; try { gevSync(S, D); } catch (eG) {}
    if (S.fired && a !== 'noop') err('Du wurdest entlassen. Starte ein neues Spiel.');
    switch (a) {
      case 'noop': break;
      case 'misClaim': { var MV = misView(S, D), mk = String(p.k || ''), mm = MV.daily.concat(MV.career).filter(function (x) { return x.id === mk; })[0]; if (!mm || mm.st !== 'done') err('Diese Mission ist noch nicht geschafft.');
        if (mk.indexOf('d:') === 0) { if (!MV.dailyOn) err('Tagesmissionen gibt es ab Level ' + featLvl('tagesmissionen') + '.'); S.dm.got[mk.slice(2)] = 1; mcAdd(S, 'dmdone'); if (Object.keys(S.dm.got).length >= 3 && S.dm.coin !== S.dm.day) { S.dm.coin = S.dm.day; skCoin(S, 1, 'Alle Tagesmissionen'); } } else { if (!MV.careerOn) err('Karriere-Missionen gibt es ab Level ' + featLvl('missionen') + '.'); cmInit(S); var cix = +mk.slice(2); if (Math.floor(cix / 10) !== S.cms || S.cmc[cix]) err('Diese Mission ist nicht offen.'); S.cmc[cix] = 1; S.cmi = (S.cmi || 0) + 1; if (Object.keys(S.cmc).length >= Math.min(10, CMISS.length - S.cms * 10) && S.cms * 10 + 10 < CMISS.length) { cmStageOpen(S, S.cms + 1); skCoin(S, 2, 'Karriere-Stufe ' + S.cms); msg(S, 'erfolg', '🏆 Karriere-Stufe ' + S.cms + ' abgeschlossen – Stufe ' + (S.cms + 1) + ' ist jetzt offen!'); } }
        info = misPay(S, mm.rw, mm.t);
        // Tagesmission: kleiner Nebeneffekt auf Follower, Fans und Moral
        if (mk.indexOf('d:') === 0) { var fo = rint(4, 12) + Math.round(Math.sqrt(S.follow || 0) * 0.15); followAdd(S, fo); S.fans = clamp((S.fans || 50) + 0.3, 0, 100); S.moral = clamp((S.moral || 60) + 0.5, 0, 100); info += ' · +' + fo + ' Follower'; }
        break; }
      case 'bonusRedeem': { var rw = p._srv; if (!rw) err('Kein Bonus verfügbar.'); info = giveBonus(S, rw, 'Bonus eingelöst'); break; }
      case 'twinDecide': { var TW = S.twin; if (!TW) err('Keine Entscheidung offen.');
        if (!p.take) { S.twin = null; info = 'Du bleibst bei der ' + S.club + '.'; break; }
        var keep = (p.keep || []).map(Number), add = (p.add || []).map(Number);
        var nsq = S.players.filter(function (q) { return keep.indexOf(q.id) >= 0 || q.self; }).concat(TW.sq.filter(function (q) { return add.indexOf(q.id) >= 0; }));
        if (nsq.length < 16) err('Wähle mindestens 16 Spieler aus.'); if (nsq.length > 30) err('Höchstens 30 Spieler.'); if (!nsq.some(function (q) { return q.pos === 'TW'; })) err('Du brauchst mindestens einen Torwart.');
        S.players.filter(function (q) { return nsq.indexOf(q) < 0; }).forEach(function (q) { removePlayer(S, q); });
        TW.sq.filter(function (q) { return add.indexOf(q.id) >= 0; }).forEach(function (q) { S.players.push(q); });
        var Lu2 = S.world.lv[TW.lvl] || [], Ll2 = S.world.lv[S.lvl] || [], hiT = Lu2.filter(function (t) { return t.n === TW.up; })[0], me2 = Ll2.filter(function (t) { return t.svw; })[0], old = S.club;
        if (hiT && me2) { var rt = mkTeam(D, S.lvl, { n: old, b: null }); rt.n = old; rt.r = 1; Ll2[Ll2.indexOf(me2)] = rt; Lu2[Lu2.indexOf(hiT)] = me2; me2.n = TW.up; }
        S.club = TW.up; S.lvl = TW.lvl; S.peak = Math.min(S.peak || 99, S.lvl); if (S.lineup) S.lineup.xi = null; makeFixtures(S, D); S.twin = null;
        info = '🏟️ Du übernimmst die ' + S.club + ' in der ' + D.lv[S.lvl].name + '!'; break; }
      case 'setCrest': { var ci = String(p.img || ''); if (ci && (!/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(ci) || ci.length > 80000)) err('Das Bild ist zu groß oder kein PNG/JPG/WebP.'); S.crest = ci || null; info = ci ? '🛡️ Neues Wappen gespeichert.' : 'Wappen zurückgesetzt.'; break; }
      case 'sim': {
        if (S.pending.length) err('Erst die offene Entscheidung treffen.');
        if (S.twin) err('Erst entscheiden, ob du die höhere Mannschaft übernimmst.');
        if (S.seasonRep && !S.seasonRep.ack) err('Erst den Saisonbericht ansehen.');
        if (S.needAlloc) err('Erst das Saisonbudget verteilen.');
        if (S.live || S.mq.length) err('Heute ist Matchday – erst das Spiel spielen.');
        if (S.trainDay) err('Heute ist Trainingstag – erst das Training festlegen.');
        if (S.prep && S.prep.need) err('Erst die Vorbereitung planen.');
        if (S.pressPending) err('Erst die Pressekonferenz.');
        if (S.spNeed) err('Erst den Hauptsponsor festlegen.');
        if (S.kitNeed) err('Erst den Ausstatter festlegen.');
        if (S.twPop) err('Erst die Transfer-Info bestätigen.');
        if (S.posPop) err('Erst die Positionsfrage beantworten.');
        if (S.giftPop) err('Erst den Wunschspieler vom Hauptsponsor auswählen.');
        if (S.weekNeed) S.weekNeed = null;
        S.autoTr = !!p.auto;
        if (blockingMails(S)) err('Erst die offenen Nachrichten beantworten.');
        var mode = p.mode || 'day'; var max = mode === 'day' ? 1 : 90;
        for (var i = 0; i < max; i++) {
          S.playedToday = false; var before = S.inbox.length ? S.inbox[0] : null; simDay(S, D);
          if (S.fired || S.pending.length || S.mq.length || blockingMails(S) || S.trainDay) break;
          if (S.playedToday && mode !== 'day') break;
          if (mode === 'event' && S.inbox.length && S.inbox[0] !== before) break;
        }
        S.playedToday = false;
        break;
      }
      case 'decide': {
        var it = S.pending.filter(function (x) { return x.id === +p.id; })[0]; if (!it) err('Entscheidung nicht gefunden.');
        S.pending = S.pending.filter(function (x) { return x !== it; });
        var choice = p.choice; xp(S, 3);
        if (it.type === 'goal') {
          S.goal = GOALS[choice] ? choice : 'mitte';
          var L = D.lv[S.lvl];
          if (S.goal === 'aufstieg') { book(S, 'Zuschuss für Saisonziel', nice(L.budget * 0.08)); S.fans = clamp(S.fans + 3, 0, 100); }
          if (S.goal === 'oben') book(S, 'Zuschuss für Saisonziel', nice(L.budget * 0.04));
          info = 'Saisonziel: ' + GOALS[S.goal];
          msg(S, 'verein', info + '.');
        } else if (it.type === 'event') {
          var ev = D.events.filter(function (x) { return x.i === it.ev; })[0];
          var res = ev ? applyFx(S, D, choice === 'yes' ? ev.yesFx : ev.noFx, { pid: it.pid, opp: it.opp, vet: it.vet }) : [];
          info = it.title + ': ' + (choice === 'yes' ? it.opts[0].label : it.opts[1].label) + (res.length ? ' → ' + res.join(', ') : '');
          msg(S, 'ereignis', info);
        } else if (it.type === 'offer') {
          var pl = S.players.filter(function (x) { return x.id === it.pid; })[0];
          if (choice === 'yes' && pl) { book(S, 'Transfererlöse', it.fee); trLog(S, 'out', pl.n, it.fee, it.club, pl, D); removePlayer(S, pl); info = pl.n + ' wechselt für ' + euro(it.fee) + ' zu ' + it.club + '.'; msg(S, 'transfer', info); S.fans = clamp(S.fans - (mw(pl) > 0 && pl.str > xiAvg(S, D) ? 2 : 0), 0, 100); }
          else info = 'Angebot von ' + it.club + ' abgelehnt.';
        } else if (it.type === 'sponsor') {
          if (choice === 'yes') { S.sponsors = S.sponsors.filter(function (s) { return s.slot !== it.deal.slot; }); S.sponsors.push(it.deal); if (it.deal.bonus) book(S, 'Unterschriftsprämien', it.deal.bonus); if (it.deal.slot === 'stadion') S.stadion = it.deal.brand; if (it.deal.slot === 'brust') S.jersey = it.deal.firm; xp(S, 5); info = 'Werbevertrag mit ' + it.deal.firm + ' unterschrieben.'; msg(S, 'finanzen', info + ' (' + euro(it.deal.m) + '/Monat)'); }
          else info = 'Werbedeal abgelehnt.';
        }
        break;
      }
      case 'lineup': {
        need(S, 'aufstellung');
        if (!FORMS[p.form]) err('Unbekannte Formation.');
        S.lineup.form = p.form; S.lineup.xi = p.auto ? null : (p.xi || null); if (S.lineup.xi) S.players.forEach(function (q) { if (S.lineup.xi.indexOf(q.id) >= 0) q.trib = false; });
        info = p.auto ? 'Automatische Aufstellung aktiv.' : 'Aufstellung gespeichert.'; break;
      }
      case 'swap': {
        need(S, 'aufstellung');
        var avS = avail(S), xi = S.lineup.xi ? FORMS[S.lineup.form].map(function (sl, i) { var id = S.lineup.xi[i]; return id != null && avS.some(function (q) { return q.id === id; }) ? id : null; }) : currentXI(S).map(function (q) { return q ? q.id : null; });
        var slot = +p.slot; if (slot < 0 || slot > 10) err('Ungültige Position.');
        var other = xi.indexOf(+p.pid), old = xi[slot];
        if (other >= 0) xi[other] = xi[slot];
        else { var bl = benchIds(S), bi = bl.indexOf(+p.pid); if (bi >= 0) { if (old != null) bl[bi] = old; else bl.splice(bi, 1); S.lineup.bench = bl; } }
        xi[slot] = +p.pid; S.lineup.xi = xi; info = 'Aufstellung geändert.'; break;
      }
      case 'training': {
        need(S, 'training');
        if (p.int && { locker: 1, normal: 1, hart: 1 }[p.int]) S.train.int = p.int;
        if (p.focus && FOCI[p.focus]) S.train.focus = p.focus;
        info = 'Training: ' + S.train.int + ' · ' + FOCI[S.train.focus]; break;
      }
      case 'foerder': {
        need(S, 'trainingsplan');
        var pid = +p.pid; var idx = S.train.fp.indexOf(pid);
        if (idx >= 0) S.train.fp.splice(idx, 1); else { if (S.train.fp.length >= 3) err('Maximal 3 Förderspieler.'); getP(S, pid); S.train.fp.push(pid); }
        info = 'Förderspieler aktualisiert.'; break;
      }
      case 'camp': {
        var c = D.camps.filter(function (x) { return x.id === p.id; })[0]; if (!c) err('Trainingslager nicht gefunden.'); need(S, campFeat(c));
        if (S.camp) err('Es ist schon ein Trainingslager gebucht.');
        var from = p.from || addDays(S.date, 1); if (from <= S.date) err('Das Datum muss in der Zukunft liegen.');
        var m = mon(from); if ([7, 8, 1, 2].indexOf(m) < 0) err('Trainingslager nur in der Sommer- (Juli/August) oder Winterpause (Januar/Februar).');
        var to = addDays(from, c.days - 1);
        if (svwGames(S, D).some(function (g) { return g.d >= from && g.d <= to && g.comp !== 'test'; })) err('In diesem Zeitraum hast du Pflichtspiele.');
        if (S.cash < c.cost) err('Nicht genug Geld (' + euro(c.cost) + ').');
        book(S, 'Trainingslager', -c.cost); S.camp = { id: c.id, name: c.name, from: from, to: to, e: c.e };
        S.tests = S.tests.filter(function (t) { return t.done || t.d < from || t.d > to; });
        info = 'Trainingslager „' + c.name + '“ gebucht: ' + fmtD(from) + ' bis ' + fmtD(to) + '.'; msg(S, 'training', info); break;
      }
      case 'test': {
        need(S, 'testspiele');
        var d = p.d; if (!d || d <= S.date) err('Bitte ein Datum in der Zukunft wählen.');
        if (seasonOf(d) !== S.season) err('Nur Termine in der laufenden Saison.');
        var tw1 = prepWin(S, D, 'summer'), tw2 = prepWin(S, D, 'winter'); if (!((d >= tw1[0] && d <= tw1[1]) || (d >= tw2[0] && d <= tw2[1]))) err('Testspiele gehen nur in der Vorbereitung: Sommer bis ' + fmtD(tw1[1]) + ', Winter ' + fmtD(tw2[0]) + ' – ' + fmtD(tw2[1]) + '.');
        var games = svwGames(S, D);
        if (games.some(function (g) { return Math.abs(diffDays(g.d, d)) <= 1; })) err('Zu nah an einem anderen Spiel (mind. 2 Tage Abstand).');
        if (S.tests.some(function (t) { return !t.done && Math.abs(diffDays(t.d, d)) < 5; })) err('Maximal ein Testspiel in 5 Tagen.');
        if (S.camp && d >= S.camp.from && d <= S.camp.to) err('Da ist das Trainingslager.');
        var o = testOpps(S, D).filter(function (x) { return x.n === p.opp; })[0]; if (!o) err('Gegner nicht verfügbar.');
        if (R() * 100 > o.chance) { info = o.n + ' hat abgesagt.'; msg(S, 'test', info); break; }
        S.tests.push({ d: d, opp: { n: o.n, s: o.s, l: o.l }, home: p.home !== false });
        info = 'Testspiel gegen ' + o.n + ' am ' + fmtD(d) + ' vereinbart.'; msg(S, 'test', info); break;
      }
      case 'buy': {
        need(S, 'transfers');
        var mp = S.market.list.filter(function (x) { return x.mid === +p.mid; })[0] || (S.watch || []).filter(function (x) { return x.mid === +p.mid; })[0]; if (!mp) err('Spieler nicht mehr auf dem Markt.'); if (mp.moved && mp.moved.until > S.date) err(mp.n + ' hat gerade gewechselt – ein Kauf geht erst ab ' + fmtD(mp.moved.until) + '. Eine Leihe wäre möglich.');
        if (S.players.length + (S.nego || []).length >= 30) err('Der Kader ist voll (max. 30).');
        if ((S.nego || []).some(function (n) { return n.mp.mid === mp.mid; })) err('Mit ' + mp.n + ' wird schon verhandelt.');
        var FN = (S.feeN || {})[mp.mid]; if (!mp.free && !(FN && FN.ok)) err('Erst die Ablöse mit ' + mp.club + ' aushandeln.');
        var fee = mp.free ? 0 : FN.fee, sal = nice(Math.max(0, +p.sal || 0)), until = +p.until || seasonEndYear(S) + 1;
        if (until < seasonEndYear(S) || until > seasonEndYear(S) + 4) err('Vertragslaufzeit ungültig.');
        var reserve = sal * monthsLeft(S);
        if (S.tb < fee + reserve) err('Das Transferbudget (' + euro(Math.max(0, S.tb)) + ') reicht nicht für Ablöse + Gehalt bis Saisonende (' + euro(fee + reserve) + ').');
        var isDDay = /-(08-31|01-31)$/.test(S.date); S.nego = S.nego || []; var ngN = { mp: mp, fee: fee, sal: sal, until: until, feeOk: !mp.free, due: addDays(S.date, rint(1, 5)) }; if (S.feeN) delete S.feeN[mp.mid]; trAct(S, mp, 'wait'); if (isDDay) negoResult(S, D, ngN); else S.nego.push(ngN);
        S.market.list = S.market.list.filter(function (x) { return x !== mp; }); S.watch = (S.watch || []).filter(function (x) { return x !== mp; });
        info = isDDay ? '⏰ Deadline Day! ' + (mp.free ? mp.n : mp.club) + ' hat sofort geantwortet – schau in dein Postfach.' : 'Angebot an ' + mp.n + ' verschickt. Die Antwort kommt in 1–5 Tagen per Nachricht.'; break;
      }
      case 'feeNego': {
        need(S, 'transfers'); S.feeN = S.feeN || {};
        var fm = S.market.list.filter(function (x) { return x.mid === +p.mid; })[0] || (S.watch || []).filter(function (x) { return x.mid === +p.mid; })[0]; if (!fm) err('Spieler nicht mehr auf dem Markt.'); if (fm.free) err('Vertragslos – keine Ablöse nötig.');
        if (fm.moved && fm.moved.until > S.date) err(fm.n + ' hat gerade gewechselt – ein Kauf geht erst ab ' + fmtD(fm.moved.until) + '.');
        Object.keys(S.feeN).forEach(function (k) { var q = S.feeN[k]; if (q.gone ? q.until < S.date : q.d < addDays(S.date, -30)) delete S.feeN[k]; });
        var askF0 = (S.mlvl || 1) >= 29 ? nice(fm.fee * 0.95) : fm.fee;
        var F = S.feeN[fm.mid]; if (!F) F = S.feeN[fm.mid] = { ask: nice(askF0 * rnd(1.05, 1.22)), ask0: 0, floor: nice(askF0 * rnd(0.78, 0.94)), mood: 100, r: 0, ok: false, bid: 0, d: S.date }; if (!F.ask0) F.ask0 = F.ask;
        if (F.gone) err(fm.club + ' verhandelt erst wieder ab ' + fmtD(F.until) + '.'); if (F.ok) err('Die Ablöse ist schon vereinbart.');
        var bid = nice(Math.max(0, +p.bid || 0)); if (bid <= F.bid && F.r) err('Biete mehr als beim letzten Mal (' + euro(F.bid) + ').'); if (S.tb < bid) err('So viel Transferbudget hast du nicht (' + euro(Math.max(0, S.tb)) + ').');
        F.r++; F.bid = bid; F.d = S.date;
        if (bid >= F.ask) { F.ok = true; F.fee = F.ask; F.bid = F.ask; info = fm.club + ' ist einverstanden: ' + euro(F.ask) + ' Ablöse. Jetzt das Angebot an ' + fm.n + '.'; break; }
        var gp = (F.ask - bid) / F.ask; F.mood = Math.max(0, F.mood - Math.round(6 + gp * 40) - (bid < F.floor * 0.6 ? 25 : 0));
        var newAsk = Math.max(F.floor, nice(F.ask - (F.ask - bid) * clamp(0.12 + F.mood / 320, 0.1, 0.4)));
        if (newAsk <= bid || (bid >= F.floor && (F.ask - bid) <= F.ask * 0.04)) { F.ok = true; F.fee = bid; F.ask = bid; info = fm.club + ' schlägt ein: ' + euro(bid) + ' Ablöse. Jetzt das Angebot an ' + fm.n + '.'; break; }
        F.ask = newAsk;
        if (F.mood <= 0 || F.r >= 6) { F.gone = true; F.until = addDays(S.date, 14); info = fm.club + ' bricht die Verhandlungen ab. Neuer Versuch ab ' + fmtD(F.until) + '.'; break; }
        info = fm.club + (bid < F.floor * 0.6 ? ' findet das Angebot lächerlich' : ' lehnt ab') + ' und fordert jetzt ' + euro(F.ask) + '.'; break;
      }
      case 'watch': {
        S.watch = S.watch || []; var wi = S.watch.filter(function (x) { return x.mid === +p.mid; })[0];
        if (wi) { S.watch = S.watch.filter(function (x) { return x !== wi; }); info = wi.n + ' von der Watchlist entfernt.'; break; }
        var wm = S.market.list.filter(function (x) { return x.mid === +p.mid; })[0]; if (!wm) err('Spieler nicht gefunden.');
        if (S.watch.length >= 12) err('Die Watchlist ist voll (12).'); wm.wd = S.date; S.watch.push(wm); info = wm.n + ' steht auf deiner Watchlist – die Werte siehst du nach und nach (komplett nach 3–5 Tagen).'; break;
      }
      case 'loanin': {
        need(S, 'leihe');
        var lp = S.market.loans.filter(function (x) { return x.mid === +p.mid; })[0]; if (!lp) err('Leihspieler nicht mehr verfügbar.');
        if (!inWindow(S.date)) err('Leihen nur in der Wechselperiode.');
        if (S.players.length >= 30) err('Der Kader ist voll.');
        if (S.tb < lp.loanFee) err('Das Transferbudget reicht nicht.');
        var gap2 = S.lvl - natLvl(D, lp.str);
        if (gap2 >= 3) { info = lp.n + ' will nicht so tief spielen.'; break; }
        book(S, 'Leihgebühren', -lp.loanFee);
        S.players.push({ id: S.nextPid++, n: lp.n, pos: lp.pos, dp: lp.dp, dp2: lp.dp2, age: lp.age, str: lp.str, tal: lp.tal, pot: lp.pot, fit: 90, form: 0, inj: 0, g: 0, a: 0, gp: 0, gr: 0, recent: 0, tries: 0, sal: lp.dem, ce: seasonEndYear(S), loan: { from: lp.club } });
        S.market.loans = S.market.loans.filter(function (x) { return x !== lp; });
        info = lp.n + ' kommt bis Saisonende von ' + lp.club + ' (Gebühr ' + euro(lp.loanFee) + ').'; msg(S, 'transfer', info); break;
      }
      case 'list': { need(S, 'transfers'); var lpl = getP(S, p.pid); if (lpl.loan) err('Leihspieler können nicht verkauft werden.'); lpl.tl = !!p.on; lpl.ask = nice(Math.max(0, +p.ask || mw(lpl))); info = lpl.tl ? lpl.n + ' steht für ' + euro(lpl.ask) + ' auf der Transferliste.' : lpl.n + ' ist nicht mehr auf der Transferliste.'; break; }
      case 'sellnow': {
        need(S, 'transfers'); var sp = getP(S, p.pid); if (sp.self) err('Dich selbst kannst du nicht verkaufen.'); squadOk(S, sp); if (sp.loan) err('Leihspieler können nicht verkauft werden.'); if (sp.leaving) err(sp.n + ' ist bereits verkauft.');
        var f2 = nice(mw(sp) * 0.6); book(S, 'Transfererlöse', f2); trLog(S, 'out', sp.n, f2, 'Probetraining-Verein', sp, D); if (inWindow(S.date)) removePlayer(S, sp); else sp.leaving = { d: nextWindow(S.date), club: 'Probetraining-Verein' };
        info = sp.n + ' für ' + euro(f2) + ' verkauft' + (sp.leaving ? ' – er bleibt bis zum Stichtag ' + fmtD(sp.leaving.d) : '') + '.'; msg(S, 'transfer', info); break;
      }
      case 'loanout': {
        need(S, 'leihe'); var op = getP(S, p.pid); if (op.self) err('Nicht möglich.'); squadOk(S, op); if (op.loan) err('Spieler ist bereits verliehen/ausgeliehen.'); if (!inWindow(S.date)) err('Nur in der Wechselperiode.');
        var ask = Math.max(0, +p.fee || 0); var fair = mw(op) * 0.1;
        var ok = R() < (ask <= fair ? 0.8 : ask <= fair * 1.5 ? 0.4 : 0.1);
        if (!ok) { info = 'Kein Verein will ' + op.n + ' zu diesen Bedingungen leihen.'; break; }
        var tl = clamp(natLvl(D, op.str), 1, D.maxLvl); var club = pick(S.world.lv[tl].filter(function (t) { return !t.svw; })).n;
        if (ask) book(S, 'Leiheinnahmen', nice(ask));
        op.loan = { to: club }; removeFromXI(S, op);
        info = op.n + ' wird bis Saisonende an ' + club + ' verliehen' + (ask ? ' (' + euro(nice(ask)) + ')' : '') + '. Sein Gehalt zahlt der neue Verein.'; msg(S, 'transfer', info); break;
      }
      case 'release': {
        need(S, 'transfers'); var rp = getP(S, p.pid); if (rp.self) err('Du bleibst!'); if (rp.loan && rp.loan.to) err('Spieler ist verliehen.'); if (!(rp.loan && rp.loan.from)) squadOk(S, rp);
        var months = Math.max(0, (rp.ce - seasonEndYear(S)) * 12 + (6 - mon(S.date) + (mon(S.date) >= 7 ? 12 : 0)));
        var cost = rp.loan && rp.loan.from ? 0 : nice(rp.sal * months * 0.5);
        if (S.cash < cost) err('Die Abfindung (' + euro(cost) + ') ist nicht gedeckt.');
        if (cost) book(S, 'Abfindungen', -cost); removePlayer(S, rp);
        info = 'Vertrag mit ' + rp.n + ' aufgelöst' + (cost ? ' (Abfindung ' + euro(cost) + ')' : '') + '.'; msg(S, 'transfer', info); break;
      }
      case 'extend': {
        var ep = getP(S, p.pid); if (ep.loan && ep.loan.from) err('Leihspieler kannst du nicht verlängern.');
        if (ep.block) { info = ep.n + ' will nicht mehr verhandeln.'; break; }
        var unt = +p.until; if (!(unt > ep.ce && unt <= seasonEndYear(S) + 5)) err('Ungültige Laufzeit.');
        var dem = salDemand(ep, S.lvl) * (ep.gp < 3 && S.fix.some(function (f) { return f.hg != null; }) ? 1.1 : 1) * (1 + Math.max(0, unt - ep.ce - 2) * 0.05) * (ep.age >= 31 ? 0.85 : 1); var wvE = skTraits(ep).wv, gapE = S.lvl - natLvl(D, ep.str); dem *= [1.12, 0.9, 1, gapE > 0 ? 1.15 : 1][wvE];
        dem = Math.max(dem, ep.sal * 0.9);
        var off = +p.sal;
        if (off >= dem || (off >= dem * 0.9 && R() < 0.5)) { ep.sal = nice(off); ep.ce = unt; info = ep.n + ' verlängert bis 06/' + unt + ' für ' + euro(ep.sal) + ' im Monat.'; msg(S, 'transfer', '✍️ ' + info); }
        else { ep.tries++; if (ep.tries >= 3) { ep.block = true; info = ep.n + ' bricht die Verhandlungen ab.'; } else info = ep.n + ' lehnt ab. Er möchte etwa ' + euro(nice(dem)) + ' im Monat.'; }
        break;
      }
      case 'ticket': { var tmo = S.date.slice(0, 7); if (S.ticketM === tmo) err('Den Eintrittspreis kannst du nur einmal im Monat ändern.'); var t2 = Math.max(0, Math.min(500, +p.price || 0)); S.ticket = Math.round(t2 * 2) / 2; S.ticketM = tmo; info = 'Eintrittspreis: ' + euro(S.ticket) + ' – die Reaktion der Fans siehst du nach den nächsten Heimspielen.'; break; }
      case 'price': { var it0 = CONC.concat(MERCH).filter(function (x) { return x[0] === p.k; })[0]; if (!it0) err('?'); S.prices = S.prices || {}; var pm = S.date.slice(0, 7), cur0 = S.prices[p.k] || {}; if (cur0.m === pm) err(it0[1] + ': Preis nur einmal im Monat änderbar.'); var np2 = Math.round(clamp(+p.p || it0[3], it0[3] * 0.3, it0[3] * 3) * 2) / 2; S.prices[p.k] = { p: np2, m: pm }; info = it0[2] + ' ' + it0[1] + ': neuer Preis ' + euro(np2) + '.'; break; }
      case 'special': { var SP2 = SPECIAL[p.k]; if (!SP2) err('?'); S.spt = S.spt || {}; var sm2 = S.date.slice(0, 7); if (S.spt[p.k] === sm2) err(SP2[0] + ' kannst du nur einmal im Monat buchen.'); var sc2 = nice(SP2[2] * Math.max(0.6, moneyScale(S, D))); if (S.cash < sc2) err('Nicht genug Bargeld (' + euro(sc2) + ').'); book(S, 'Sondertraining ' + SP2[0], -sc2); S.spt[p.k] = sm2; xp(S, SP2[4]);
        if (p.k === 'mental') { S.moral = clamp(S.moral + 6, 0, 100); S.players.forEach(function (q) { q.form = clamp(q.form + 1, -5, 5); }); }
        if (p.k === 'fitness') S.players.forEach(function (q) { q.fitCap = Math.min(100, (q.fitCap || 90) + 2); q.fit = Math.min(q.fitCap, q.fit + 8); });
        if (p.k === 'ernaehrung') S.players.forEach(function (q) { q.fitCap = Math.min(100, (q.fitCap || 90) + 3); q.fit = Math.min(q.fitCap, q.fit + 3); });
        if (p.k === 'profi') { S.players.slice().sort(function () { return R() - 0.5; }).slice(0, 5).forEach(function (q) { q.str = Math.min(q.pot + 1, q.str + 0.2); }); S.moral = clamp(S.moral + 3, 0, 100); }
        info = SP2[1] + ' ' + SP2[0] + ' war einen Tag da: ' + SP2[3] + ' (+' + SP2[4] + ' XP).'; break; }
      case 'hobbyAdd': { var HB = HOBBIES.filter(function (x) { return x[0] === p.k; })[0]; if (!HB) err('?'); S.hob = S.hob || {}; S.hobO = S.hobO || []; if (S.hob[p.k]) err('Hast du schon.'); if (S.hobO.length >= 4) err('Maximal 4 Hobbys.'); var lastH = S.hobO[S.hobO.length - 1]; if (lastH && S.hob[lastH].pct < 70) err('Ein neues Hobby gibt es erst, wenn ' + HOBBIES.filter(function (x) { return x[0] === lastH; })[0][1] + ' bei 70 % ist.'); S.hob[p.k] = { pct: rint(3, 26), wk: null }; S.hobO.push(p.k); info = HB[2] + ' ' + HB[1] + ' ist jetzt dein Hobby (Start: ' + S.hob[p.k].pct + ' %).'; break; }
      case 'hobbyDo': { var hb = (S.hob || {})[p.k], HB2 = HOBBIES.filter(function (x) { return x[0] === p.k; })[0]; if (!hb || !HB2) err('?'); var hw = wkStart(S); if (S.hobW === hw) err('Diese Woche warst du schon bei einem Hobby – nur eins pro Woche.'); hb.wk = hw; S.hobW = hw; var hg = rnd(0.6, 2.2) * (1 - hb.pct / 140); hb.pct = Math.min(100, Math.round((hb.pct + Math.max(0.4, hg)) * 10) / 10); var hf = 0.5 + hb.pct / 100, X2 = HB2[4], got = [];
        if (X2.moral) { var mv = Math.max(1, Math.round(X2.moral * hf)); S.moral = clamp(S.moral + mv, 0, 100); got.push('Moral +' + mv); }
        if (X2.board) { S.board = clamp(S.board + X2.board * hf, 0, 100); got.push('Vorstand +' + Math.round(X2.board * hf)); }
        if (X2.fit) { S.players.forEach(function (q) { q.fit = Math.min(q.fitCap || 100, q.fit + X2.fit * hf); }); got.push('Fitness +' + Math.round(X2.fit * hf)); }
        if (X2.fans) { S.fans = clamp(S.fans + X2.fans * hf, 0, 100); got.push('Fans +' + Math.round(X2.fans * hf)); }
        if (X2.spons) { S.spons = clamp(S.spons + X2.spons * hf, 0, 100); got.push('Sponsoren +' + Math.round(X2.spons * hf)); }
        if (X2.follow) { var fgn = Math.round(X2.follow * hf * rnd(0.6, 1.4)); S.follow = (S.follow || 0) + fgn; got.push('+' + fgn + ' Follower'); }
        if (X2.cash) { var cg2 = nice(X2.cash * hf * rnd(0.7, 1.3)); privInit(S).cash += cg2; got.push('+' + euro(cg2) + ' privat'); }
        if (hb.pct >= 100) { var hm = nice(rnd(60, 220)); privInit(S).cash += hm; S.priv.log.unshift([S.date, HB2[1] + ' (Profi-Niveau)', hm]); got.push('+' + euro(hm) + ' verdient'); }
        var hx = 1 + (X2.xp ? Math.round(X2.xp * hf) : 0); xp(S, hx); got.push('+' + hx + ' XP');
        info = HB2[2] + ' ' + HB2[1] + ' (' + Math.floor(hb.pct) + ' %): ' + got.join(' · '); break; }
      case 'hobbyQuit': { if (!(S.hob || {})[p.k]) err('?'); delete S.hob[p.k]; S.hobO = (S.hobO || []).filter(function (x) { return x !== p.k; }); info = 'Hobby aufgegeben.'; break; }
      case 'pvExtend': { need(S, 'partner'); var PE = S.pv; if (!PE || PE.army) err('Kein Partnerverein.'); if (S.pvExt === S.season) err('Diese Saison hast du schon angefragt.'); S.pvExt = S.season; var pch = clamp(0.3 + (11 - S.lvl) * 0.03 + mgrRep(S, D) / 250, 0.2, 0.8); if (R() < pch) { var py = rint(1, 2); PE.to += py; xp(S, 5); info = '🤝 ' + PE.club + ' verlängert die Partnerschaft um ' + py + ' Jahr' + (py > 1 ? 'e' : '') + ' (bis 06/' + (PE.to + 1) + ').'; msg(S, 'verein', info); } else info = '😕 ' + PE.club + ' möchte (noch) nicht verlängern. Nächste Saison kannst du es erneut versuchen.'; break; }
      case 'langExam': { var lgE = (S.lang || {})[p.k]; if (!lgE) err('?'); var curL = langLvl(lgE), nl = curL + 1; if (nl > 6 || slpOf(lgE.xp || 0) < nl) err('Für die Prüfung fehlen dir noch Sprach-Punkte.'); if (lgE.block && S.date < lgE.block) err('Wiederholung erst ab ' + fmtD(lgE.block) + '.'); var QE = langQs(p.k, nl), idx = QE.map(function (q, i) { return i; }).sort(function () { return R() - 0.5; }).slice(0, 20); S.langExam = { k: p.k, lv: nl, q: idx }; break; }
      case 'langExamDone': { var LE = S.langExam; if (!LE) err('?'); var lgD = S.lang[LE.k], QD = langQs(LE.k, LE.lv), ans = p.a || [], ok2 = 0; LE.q.forEach(function (qi, i) { var q = QD[qi]; if (q && ans[i] != null && q.o[ans[i]] === q.a) ok2++; }); var need2 = Math.ceil(LE.q.length * 0.55); S.langExam = null;
        var exX = 20 + Math.round(40 * ok2 / Math.max(1, LE.q.length)); S.langExamRes = { ok: ok2, n: LE.q.length, need: need2, pass: ok2 >= need2, xp: ok2 >= need2 ? exX : 3, lang: LANGS[LE.k][0], lvl: SLPN[LE.lv] }; if (ok2 >= need2) { lgD.passed = LE.lv; lgD.block = null; xp(S, exX); info = '🎓 Bestanden! ' + ok2 + ' von ' + LE.q.length + ' richtig – ' + LANGS[LE.k][0] + ': ' + SLPN[LE.lv] + ' (+' + exX + ' XP).'; msg(S, 'privat', '🎓 ' + LANGS[LE.k][0] + ': ' + SLPN[LE.lv] + ' – Prüfung bestanden'); } else { lgD.block = addDays(S.date, 14); xp(S, 3); info = '❌ Nicht bestanden – ' + ok2 + ' von ' + LE.q.length + ' richtig (nötig: ' + need2 + '). Wiederholung ab ' + fmtD(lgD.block) + '.'; } break; }
      case 'capAdd': {
        var co = capOpts(S, D).filter(function (o) { return o.n === +p.n; })[0]; if (!co) err('Diese Erweiterung ist gerade nicht möglich.');
        if (S.cash < co.cost) err('Dafür fehlt das Geld (' + euro(co.cost) + ').');
        book(S, 'Stadion: +' + co.n + ' Plätze', -co.cost); S.capB = { n: co.n, done: addDays(S.date, co.days) };
        info = 'Bauauftrag: +' + co.n + ' Zuschauerplätze für ' + euro(co.cost) + '. Fertig am ' + fmtD(S.capB.done) + '.'; msg(S, 'verein', info); break; }
      case 'build': {
        var item = D.items[p.id]; if (!item) err('Unbekannt.'); if (mlv(S) < itemLvl(item)) err('Ab Manager-Level ' + itemLvl(item) + ' freigeschaltet: ' + item.name);
        if (S.built[item.id] || S.building.some(function (b) { return b.id === item.id; })) err('Schon vorhanden oder im Bau.');
        if (item.req && !S.built[item.req] && !S._dev) err('Voraussetzung fehlt: ' + (D.items[item.req] ? D.items[item.req].name : item.req));
        if (item.id === 'stehtrib' && (S.capX || 0) < 1500 && !S._dev) err('Erst die Gegengerade mit Stehplätzen füllen (3 × 500 Plätze), dann kann daraus eine Stehtribüne werden.');
        if (item.id === 'sitztrib' && (S.capX || 0) < 3000 && !S._dev) err('Erst die Hauptseite mit Plätzen füllen (6 × 500 Plätze insgesamt), dann kann daraus eine Sitzplatztribüne werden.');
        if (item.id === 'ausbau5k' && capacity(S, D) < CAPMAX && !S._dev) err('Stadionausbau Stufe 1 gibt es erst ab 10.000 Plätzen – erweitere vorher über „Mehr Zuschauerplätze“.');
        var bc = nice(item.cost * bhCostF(S)), bd = item.days > 0 ? Math.max(1, Math.round(item.days * bhDaysF(S))) : 0;
        if (bd > 0 && S.building.length >= bhMax(S)) err('Es laufen schon ' + S.building.length + ' Bauprojekte gleichzeitig (max. ' + bhMax(S) + '). ' + (bhLvl(S) < 10 ? 'Mit einem besseren Bauhof gehen mehr.' : ''));
        if (S.cash < bc) err('Nicht genug Geld (' + euro(bc) + ').');
        if (bc) book(S, 'Investitionen', -bc);
        if (bd > 0) { S.building.push({ id: item.id, done: addDays(S.date, bd) }); info = item.name + ' wird gebaut – fertig am ' + fmtD(addDays(S.date, bd)) + '.'; }
        else { S.built[item.id] = true; info = item.name + (item.cat === 'Personal' ? ' eingestellt.' : ' ist da.'); }
        msg(S, 'verein', info); break;
      }
      case 'upgrade': { var ug = D.items[p.id]; if (!ug || !S.built[ug.id]) err('Erst bauen.'); if (!upgOk(ug)) err('Kann nicht ausgebaut werden.'); S.upg = S.upg || {}; var ul = S.upg[ug.id] || 1; if (ul >= 10) err('Höchste Stufe erreicht.'); var uc = nice(upgCost(ug, ul) * (ug.id === 'bauhof' ? 1 : bhCostF(S))); if (S.cash < uc) err('Nicht genug Geld (' + euro(uc) + ').'); book(S, 'Investitionen', -uc); S.upg[ug.id] = ul + 1; xp(S, 2); info = ug.name + ' auf Stufe ' + (ul + 1) + '/10 ausgebaut – ' + (ug.id === 'bauhof' ? 'Bauzeit −' + Math.round((1 - bhDaysF(S)) * 100) + ' %, Kosten −' + Math.round((1 - bhCostF(S)) * 100) + ' %, bis zu ' + bhMax(S) + ' Projekte gleichzeitig.' : 'Effekt +' + Math.round(ul * 15) + ' %.'); msg(S, 'verein', info); break; }
      case 'unbuild': { var ui = D.items[p.id]; if (!ui || !S.built[ui.id] || ui.cat !== 'Personal' && ui.cat !== 'Mannschaften') err('Nur Personal und Mannschaften können beendet werden.'); delete S.built[ui.id]; info = ui.name + ' beendet.'; msg(S, 'verein', info); break; }
      case 'pitch': {
        need(S, 'ausbau'); if (S.pitch.type !== 'kunst') err('Ihr habt Naturrasen.'); if (S.pitchBuild) err('Der Kunstrasen wird schon erneuert.');
        var pc = pitchCost(S, D); if (S.cash < pc.own) err('Nicht genug Geld (' + euro(pc.own) + ').');
        book(S, 'Investitionen', -pc.own); S.pitchBuild = addDays(S.date, 45);
        info = 'Neuer Kunstrasen bestellt (Eigenanteil ' + euro(pc.own) + ', Zuschuss ' + euro(pc.sub) + '). Fertig am ' + fmtD(S.pitchBuild) + '.'; msg(S, 'verein', info); break;
      }
      case 'liveStart': liveStart(S, D); break;
      case 'liveStep': liveStep(S, D, p.to); break;
      case 'livePen': livePen(S, D, p.dir); break;
      case 'liveSub': liveSub(S, D, p.slot, p.pid); break;
      case 'liveGk': gkPick(S, D, p.pid); break;
      case 'gevClaim': { need(S, 'events'); var GE = gevView(S, D).filter(function (x) { return x.id === +p.id; })[0]; if (!GE) err('Event nicht gefunden.'); var GT = GE.tiers[+p.t | 0]; if (!GT || !GT.done) err('Diese Stufe ist noch nicht geschafft.'); if (GT.claimed) err('Schon abgeholt.'); if (gevNow(S) > addDays(GE.ends.slice(0, 10), 3)) err('Das Event ist vorbei.');
        S.evc = S.evc || {}; S.evc[GE.id] = S.evc[GE.id] || {}; S.evc[GE.id][GT.i] = 1; var gout = [];
        if (GT.xp) { xp(S, GT.xp); gout.push('+' + GT.xp + ' XP'); } if (GT.cash) { book(S, 'Event-Prämie', GT.cash); gout.push('+' + euro(GT.cash)); } if (GT.jk) { S.jokers = (S.jokers || 0) + GT.jk; gout.push('+' + GT.jk + ' Joker'); } if (GT.hs) { S.hsPts = (S.hsPts || 0) + GT.hs * 0.5; gout.push('+' + GT.hs + ' halbe Sterne'); } if (GT.mc) { skCoin(S, GT.mc, 'Event: ' + (GE.title || '')); gout.push('+' + GT.mc + ' Manager Coins'); } if (GT.fol) { S.follow = (S.follow || 0) + GT.fol; gout.push('+' + GT.fol.toLocaleString('de-DE') + ' Follower'); }
        info = '🎉 ' + GE.title + ': ' + (gout.join(' · ') || 'geschafft!'); break; }
      case 'liveUndo': liveUndo(S); break;
      case 'instantMatch': { if (S.live && !S.live.done) err('Das Spiel läuft schon.'); liveStart(S, D); liveAutoRun(S, D); break; }
      case 'liveAuto': { liveAutoRun(S, D); break; }
      case 'liveClose': { if (S.live && !S.live.done) err('Das Spiel läuft noch.'); S.live = null; break; }
      case 'like': {
        var po = S.feed.filter(function (x) { return x.id === +p.id; })[0]; if (!po) err('Beitrag nicht gefunden.');
        if (po.liked) { po.liked = false; po.likes--; break; }
        po.liked = true; po.likes++; var lvB = 1 + (11 - S.lvl) * 0.15; if (po.rare === 'viral') { var vg = Math.round(rint(150, 600) * lvB); followAdd(S, vg); S.likeFx = vg; } else if (po.rare === 'fynn') { var fg = Math.round(rint(80, 260) * lvB); followAdd(S, fg); S.likeFx = fg; S.moral = clamp(S.moral + 2, 0, 100); } else if (po.rare) { var rg = Math.round(rint(50, 180) * lvB); followAdd(S, rg); S.likeFx = rg; } else if (R() < 0.35) { var lgN = Math.max(1, Math.round(rint(2, 8) * lvB)); followAdd(S, lgN); S.likeSm = lgN; } S.likesToday = S.likesToday || {};
        var dk = S.date; if (S.likesDay !== dk) { S.likesDay = dk; S.likesN = 0; }
        if (S.likesN < 1) { S.likesN++; xp(S, 1); S.fans = clamp(S.fans + 0.4, 0, 100); checkBars(S); }
        break;
      }
      case 'reply': {
        var ml = S.mails.filter(function (x) { return x.id === +p.id; })[0]; if (!ml) err('Nachricht nicht gefunden.'); if (ml.answered) err('Schon beantwortet.'); if (!ml.info) xp(S, 0.1);
        if (ml.info) { ml.answered = { idx: -1, res: [] }; info = ''; break; }
        if (ml.kind === 'offer') {
          var od = ml.data; var opl = S.players.filter(function (x) { return x.id === od.pid; })[0]; var ix = +p.idx; var r3 = [];
          if (!opl) { ml.answered = { idx: ix, res: ['Spieler nicht mehr da'] }; break; }
          if (ix === 0 || ix === 2) {
            var feeX = ix === 2 ? nice(od.fee * 1.25) : od.fee;
            if (ix === 2 && R() < 0.5) { r3 = [od.club + ' zieht das Angebot zurück']; }
            else { squadOk(S, opl); book(S, 'Transfererlöse', feeX); trLog(S, 'out', opl.n, feeX, od.club, opl, D); if (inWindow(S.date)) removePlayer(S, opl); else { opl.leaving = { d: nextWindow(S.date), club: od.club }; opl.tl = false; } r3 = [opl.n + ' wechselt für ' + euro(feeX) + ' zu ' + od.club + (opl.leaving ? ' (zum ' + fmtD(opl.leaving.d) + ')' : '')]; msg(S, 'transfer', r3[0] + '.'); if (feeX >= 25000) ach(S, 'topverkauf', opl.n + ' für ' + euro(feeX), true); }
          } else if (ix === 1) r3 = ['Angebot abgelehnt'];
          else { opl.untouch = true; opl.form = clamp(opl.form + 1, -5, 5); r3 = [opl.n + ' ist unverkäuflich', 'Form +1']; }
          ml.answered = { idx: ix, res: r3 }; xp(S, 2); info = r3.join(', '); break;
        }
        if (ml.kind === 'mgr') {
          var ofm = ml.data, im = +p.idx, rm = [];
          if (im === 0 || (im === 1 && R() < 0.5)) { var ns = im === 1 ? nice(ofm.sal * 1.15) : ofm.sal; S.mc.sal = ns; S.mc.until = ofm.until; S.mc.offer = null; S.pressPending = 'verl'; rm = ['Vertrag bis 06/' + ofm.until, 'Gehalt ' + euro(ns) + '/Monat']; xp(S, 10); }
          else if (im === 1) { rm = ['Der Vorstand bleibt bei seinem Angebot']; }
          else if (im === 2) { rm = ['Angebot gilt weiter – unter Manager annehmen']; }
          else { S.mc.offer = null; S.board = clamp(S.board - 3, 0, 100); rm = ['Angebot abgelehnt', 'Vorstand −3']; }
          ml.answered = { idx: im, res: rm }; info = rm.join(', '); break;
        }
        if (ml.kind === 'renego') {
          if (+p.idx === 1) { ml.answered = { idx: 1, res: ['Verzichtet'] }; trAct(S, ml.data.mp, 'fail'); info = 'Du verzichtest auf ' + ml.data.mp.n + '.'; break; }
          var rn = ml.data; if (rn.fee && S.tb < rn.fee) err('Nicht genug Transferbudget (' + euro(rn.fee) + ').');
          ml.answered = { idx: 0, res: ['Nachgebessert'] }; var trs2 = trAct(S, rn.mp, 'sign'); trs2.mail = S.nextId; actMail(S, rn.mp.free ? 'Berater von ' + rn.mp.n : 'Sportdirektor ' + rn.mp.club, 'Zusage: ' + rn.mp.n + ' will kommen!', 'Einigung erzielt: ' + (rn.fee ? euro(rn.fee) + ' Ablöse, ' : '') + euro(rn.sal) + ' im Monat bis 06/' + rn.until + '. Jetzt nur noch unterschreiben!', [{ label: 'Spieler holen', fx: '' }, { label: 'Doch absagen', fx: '' }], 'sign', rn); info = 'Nachgebessert – ' + rn.mp.n + ' sagt zu.'; break;
        }
        if (ml.kind === 'sign') {
          var ng = ml.data, ix2 = +p.idx;
          if (ix2 === 1) { ml.answered = { idx: 1, res: ['Transfer abgesagt'] }; trAct(S, ng.mp, 'fail'); info = 'Transfer abgesagt.'; break; }
          if (S.players.length >= 30) err('Der Kader ist voll (max. 30).');
          var rs = ng.sal * monthsLeft(S); if (S.tb < ng.fee + rs) err('Das Transferbudget reicht nicht mehr für Ablöse + Gehalt (' + euro(ng.fee + rs) + ').');
          if (ng.fee) book(S, 'Ablösezahlungen', -ng.fee); trLog(S, 'in', ng.mp.n, ng.fee || 0, ng.mp.club || 'vereinslos', ng.mp, D);
          if (rs) { S.tb -= rs; S.cash += rs; }
          var m2 = ng.mp; S.sgMid = S.sgMid || {}; if (m2.mid && S.sgMid[m2.mid]) { ml.answered = { idx: 0, res: ['Schon verpflichtet'] }; err(m2.n + ' hat schon bei dir unterschrieben.'); } if (S.players.concat((S.incoming || []).map(function (x) { return x.p; })).some(function (q) { return q.n === m2.n && Math.abs((q.str0 || q.str) - m2.str) < 0.01 && q.age === m2.age; })) { ml.answered = { idx: 0, res: ['Schon im Kader'] }; err(m2.n + ' ist schon in deinem Kader.'); } if (m2.mid) S.sgMid[m2.mid] = 1;
          var np = { id: S.nextPid++, n: m2.n, pos: m2.pos, dp: m2.dp, dp2: m2.dp2, age: m2.age, str: m2.str, tal: m2.tal, pot: m2.pot, fit: 90, form: 0, inj: 0, g: 0, a: 0, gp: 0, gr: 0, recent: 0, tries: 0, sal: ng.sal, ce: ng.until, fee0: ng.fee || 0 };
          np.str0 = np.str; var sig = { id: np.id, n: np.n, pos: np.dp, pos2: np.dp2, age: np.age, str: Math.round(np.str), tal: np.tal, fee: ng.fee, sal: ng.sal, until: ng.until, club: m2.club || 'vereinslos' };
          if (ng.fee >= 10000) ach(S, 'rekordtransfer', m2.n + ' für ' + euro(ng.fee), true);
          var late = !m2.free && !inWindow(S.date);
          if (late) { (S.incoming = S.incoming || []).push({ p: np, d: nextWindow(S.date), sig: sig }); sig.arrive = nextWindow(S.date); }
          else { S.players.push(np); S.lastSigned = sig; }
          ml.answered = { idx: 0, res: [np.n + ' unterschreibt' + (late ? ' – kommt am ' + fmtD(sig.arrive) : '')] }; xp(S, 5); trActDone(S, m2.mid);
          info = np.n + ' unterschreibt bis 06/' + ng.until + (ng.fee ? ' (Ablöse ' + euro(ng.fee) + ')' : '') + (late ? '. Er stößt zum Stichtag ' + fmtD(sig.arrive) + ' dazu' : '') + '.'; msg(S, 'transfer', '✍️ ' + info); break;
        }
        var o2 = ml.opts[+p.idx]; if (!o2) err('Antwort ungültig.');
        var r2 = applyFx(S, D, o2.fx, { pid: ml.pid, opp: ml.opp });
        ml.answered = { idx: +p.idx, res: r2 }; xp(S, 2); checkBars(S);
        info = 'Antwort an ' + ml.from + ': „' + o2.label + '“' + (r2.length ? ' → ' + r2.join(', ') : '');
        msg(S, 'nachricht', info); break;
      }
      case 'alloc': {
        var ac = Math.round(+p.cash || 0), at = Math.round(+p.tb || 0), as = Math.round(+p.sav || 0);
        if (ac < 0 || at < 0 || as < 0 || ac + at + as !== 100) err('Die Aufteilung muss zusammen 100 % ergeben.');
        if (ac < 20) err('Mindestens 20 % müssen in die Kasse (laufende Kosten).');
        if (S.spNeed && S.needAlloc) err('Erst den Hauptsponsor festlegen.');
        if (S.kitNeed && S.needAlloc) err('Erst den Ausstatter festlegen.');
        S.alloc = { cash: ac, tb: at, sav: as }; info = 'Neue Aufteilung: Bargeld ' + ac + ' %, Transferbudget ' + at + ' %, Tagesgeld ' + as + ' %.';
        if (S.needAlloc && !S.startCapDone) { S.startCapDone = true; S.budgetHold = S.budgetHold || []; var tot0 = S.budgetHold.reduce(function (x, b) { return x + b[1]; }, 0) + S.cash + S.tb + S.sav, lvF0 = Math.min(1, ((S.mlvl || 1) - 1) / 30), tgt0 = Math.round((31000 + 6000 * lvF0 + rnd(0, 5000)) / 100) * 100; if (Math.abs(tgt0 - tot0) >= 100) S.budgetHold.push([tgt0 > tot0 ? 'Startkapital (Gönner & Verband)' : 'Altlasten Vorgänger', tgt0 - tot0]); }
        if (S.needAlloc) { (S.budgetHold || []).forEach(function (b) { book(S, b[0], b[1]); }); S.budgetHold = null; S.needAlloc = false; info = 'Saisonbudget verteilt: ' + info; }
        break;
      }
      case 'spAccept': { var so = (S.spOffers || [])[+p.i]; if (!so || so.gone) err('Angebot nicht mehr gültig.'); info = 'Hauptsponsor: ' + spAccept(S, D, so, p.yrs); xp(S, 5); msg(S, 'finanzen', '🤝 ' + info); break; }
      case 'spNego': {
        var sn = (S.spOffers || [])[+p.i]; if (!sn) err('Angebot nicht mehr gültig.'); if (sn.nego >= 2) err(sn.firm + ' will nicht weiter verhandeln.');
        sn.nego++; var chance = (sn.nego === 1 ? 0.6 : 0.35) + ((S.mlvl || 1) - 1) * 0.01;
        if (R() < chance) { var up0 = rnd(0.06, 0.14); sn.amt = nice(sn.amt * (1 + up0)); info = sn.firm + ' legt nach: jetzt ' + euro(sn.amt) + ' pro Saison.'; sn.last = 'ok'; }
        else if (R() < 0.5) { S.spOffers.splice(+p.i, 1); info = sn.firm + ' bricht die Verhandlungen ab.'; if (!S.spOffers.length) { spOffers(S, D, true); info += ' Es liegen neue Angebote vor.'; } }
        else { sn.nego = 2; sn.last = 'no'; info = sn.firm + ' bleibt hart: ' + euro(sn.amt) + ' ist das letzte Wort.'; }
        break;
      }
      case 'giveStar': {
        var gp0 = getP(S, p.pid); if (gp0.tal >= 5) err(gp0.n + ' hat schon 5 Sterne.'); if (gp0.starS === S.season) err(gp0.n + ' hat diese Saison schon einen halben Stern bekommen.'); var scost = gp0.tal >= 4.5 ? 1.5 : gp0.tal >= 4 ? 1 : 0.5; if ((S.hsPts || 0) < scost) err('Dafür brauchst du ' + String(scost).replace('.', ',') + ' Sterne.');
        gp0.tal = Math.min(5, gp0.tal + 0.5); gp0.pot = Math.min(99, gp0.pot + 2.5); S.hsPts -= scost; gp0.starS = S.season; info = gp0.n + ' hat jetzt ' + String(gp0.tal).replace('.', ',') + ' Sterne.'; break;
      }
      case 'starDone': { S.starPop = null; S.hsAnim = 0; break; }
      case 'hsSeen': { S.hsAnim = 0; break; }
      case 'scoutAdd': {
        need(S, 'transfers'); var sq = teamSquad(S, D, p.team); if (!sq) err('Verein nicht gefunden.'); var sx = sq[+p.i]; if (!sx) err('Spieler nicht gefunden.');
        S.watch = S.watch || []; if (S.watch.some(function (w) { return w.n === sx.n; })) { info = sx.n + ' steht schon auf deiner Watchlist.'; break; }
        if (S.watch.length >= 12) err('Die Watchlist ist voll (12).');
        var np2 = newPlayer(null, D, { dp: sx.pos === 'TW' || sx.pos === 'ST' ? null : sx.pos, pos: sx.pos === 'TW' ? 'TW' : sx.pos === 'ST' ? 'ST' : null, age: sx.age, str: sx.str, tal: sx.tal, name: sx.n });
        np2.mid = S.nextId++; np2.club = sx.team; np2.clubLvl = sx.lvl; np2.free = false; np2.fee = nice(mw(np2) * rnd(1.1, 1.6)); np2.dem = salDemand(np2, S.lvl); np2.ce = 0; np2.att = 0;
        S.watch.push(np2); info = sx.n + ' (' + sx.team + ') steht jetzt auf deiner Watchlist.'; break;
      }
      case 'trial': {
        var TR = S.trialRes; if (!TR) err('Kein Probetraining offen.'); var tp3 = TR.p;
        if (p.c === 'sign') { if (S.players.length >= 30) err('Der Kader ist voll (max. 30).'); tp3.ce = seasonEndYear(S) + (+p.yrs || 1); tp3.sal = salDemand(tp3, S.lvl); tp3.str0 = tp3.str; S.players.push(tp3); info = tp3.n + ' unterschreibt bis 06/' + tp3.ce + ' (' + euro(tp3.sal) + '/Monat).'; msg(S, 'transfer', '✍️ ' + info); xp(S, 2); }
        else if (p.c === 'later') { (S.trialLater = S.trialLater || []).push({ p: tp3, d: (seasonEndYear(S)) + '-07-10' }); info = tp3.n + ' kommt im Juli nächsten Jahres noch einmal zum Probetraining.'; }
        else info = tp3.n + ' bekommt eine Absage.';
        S.trialRes = null; break;
      }
      case 'kitAccept': { var kd0 = p.kind === 'ball' ? 'ball' : 'kit'; if (kd0 === 'ball') need(S, 'ausbau'); var ko = (S[kd0 + 'Offers'] || [])[+p.i]; if (!ko || ko.gone) err('Angebot nicht mehr gültig.'); xp(S, 2); info = (kd0 === 'ball' ? 'Ballpartner: ' : 'Ausstatter: ') + kitAccept(S, D, kd0, ko, p.yrs); xp(S, 3); msg(S, 'finanzen', '🤝 ' + info); break; }
      case 'kitNego': {
        var kd1 = p.kind === 'ball' ? 'ball' : 'kit'; var kn = (S[kd1 + 'Offers'] || [])[+p.i]; if (!kn) err('Angebot nicht mehr gültig.'); if (kn.nego >= 2) err(kn.name + ' will nicht weiter verhandeln.');
        kn.nego++; if (R() < (kn.nego === 1 ? 0.6 : 0.35)) { kn.amt = nice(kn.amt * (1 + rnd(0.06, 0.14))); info = kn.name + ' bessert nach: ' + euro(kn.amt) + ' pro Saison.'; }
        else if (R() < 0.5) { S[kd1 + 'Offers'].splice(+p.i, 1); info = kn.name + ' zieht das Angebot zurück.'; if (!S[kd1 + 'Offers'].length) { kitOffers(S, D, kd1, true); info += ' Neue Angebote liegen vor.'; } }
        else { kn.nego = 2; info = kn.name + ' bleibt bei ' + euro(kn.amt) + '.'; }
        break;
      }
      case 'kitReject': { var kd2 = p.kind === 'ball' ? 'ball' : 'kit'; if (kd2 === 'kit') err('Einen Ausstatter musst du wählen.'); kitOffers(S, D, kd2, true); info = 'Neue Angebote liegen vor.'; break; }
      case 'ballOffers': { need(S, 'ausbau'); if (S.ball && S.ball.to >= S.season) err('Du hast bereits einen Ballpartner.'); if (S.ballAskW === wkStart(S)) err('Diese Woche hast du schon angefragt.'); S.ballAskW = wkStart(S); kitOffers(S, D, 'ball'); info = S.ballOffers.length ? 'Ballhersteller haben Angebote geschickt.' : 'Gerade hat kein Ballhersteller Interesse – frag nächste Woche nochmal.'; break; }
      case 'twAck': { S.twPop = null; break; }
      case 'unlockAck': { S.unlockNote = null; break; }
      case 'benefizAck': { S.benefizRes = null; break; }
      case 'giftPick': { var gp = (S.giftPop || [])[+p.i]; if (!gp) err('?'); gp.ce = S.season + 2; S.players.push(gp); S.giftPop = null; S.giftDone = true; xp(S, 5); try { trLog(S, 'in', gp.n, 0, S.mainSp ? S.mainSp.firm + ' (Geschenk)' : 'Geschenk vom Hauptsponsor', gp, D); } catch (e) { } info = gp.n + ' (' + gp.dp + ', ' + gp.age + ' J.) kommt – der Hauptsponsor übernimmt die Ablöse. Vertrag bis 06/' + gp.ce + '.'; msg(S, 'transfer', '🎁 ' + info); break; }
      case 'psOffers': { need(S, 'psponsor'); if (S.ps && S.ps.to >= S.season) err('Du hast schon einen persönlichen Sponsor.'); if (S.psBlock === S.season && !S.psOffers) err('Nach den geplatzten Verhandlungen gibt es erst nächste Saison neue Angebote.'); if (!S.psOffers) psOffers(S, D); info = 'Neue Angebote für einen persönlichen Sponsor.'; break; }
      case 'sbAccept': { need(S, 'psponsor'); var B5 = sbInit(S), so = B5.offers[+p.i]; if (!so) err('Angebot nicht mehr gültig.'); if (B5.act.length >= 3) err('Mehr als 3 Jobs gleichzeitig gehen nicht.'); B5.offers.splice(+p.i, 1); B5.act.push({ k: so.k, t: so.t, e: so.e, amt: so.amt, done: addDays(S.date, so.days) }); info = so.e + ' Zugesagt: ' + so.t + '. Geld gibt es nach ' + so.days + ' Tag' + (so.days === 1 ? '' : 'en') + '.'; msg(S, 'privat', info); break; }
      case 'sbDecline': { var B6 = sbInit(S); B6.offers.splice(+p.i, 1); info = 'Abgesagt.'; break; }
      case 'psAccept': { need(S, 'psponsor'); var po2 = (S.psOffers || [])[+p.i]; if (!po2 || po2.gone) err('Angebot nicht mehr gültig.'); S.ps = { firm: po2.firm, amt: po2.amt, from: S.season, to: S.season + po2.yrs - 1 }; S.psOffers = null; xp(S, 5); info = po2.firm + ' ist dein persönlicher Sponsor: ' + euro(po2.amt) + ' pro Jahr bis 06/' + (S.ps.to + 1) + ' (monatlich ins Privatvermögen).'; msg(S, 'privat', '🤝 ' + info); break; }
      case 'langAdd': { S.lang = S.lang || {}; var lk = p.k; if (!LANGS[lk] || S.lang[lk]) err('?'); var fl = Object.keys(S.lang); if (fl.length >= 4) err('Maximal 5 Sprachen.'); if (fl.length && fl.some(function (k) { return langLvl(S.lang[k]) < 3; })) err('Erst wenn alle bisherigen Fremdsprachen B1 erreicht haben, kannst du eine weitere lernen.'); S.lang[lk] = { xp: 0, wk: null, passed: 0 }; info = LANGS[lk][0] + ' hinzugefügt – viel Erfolg beim Lernen!'; break; }
      case 'langAsk': { var lg = (S.lang || {})[p.k]; if (!lg) err('?'); var lwk = addDays(S.date, -((dow(S.date) + 6) % 7)); if (lg.wk === lwk) err('Diese Woche hast du ' + LANGS[p.k][0] + ' schon geübt.'); var lv = Math.min(6, langLvl(lg) + 1), QQ = langQs(p.k, lv); lg.seen = lg.seen || []; var cand = QQ.map(function (q, i) { return i; }).filter(function (i) { return lg.seen.indexOf(lv * 100 + i) < 0; }); if (!cand.length) { lg.seen = lg.seen.filter(function (x) { return Math.floor(x / 100) !== lv; }); cand = QQ.map(function (q, i) { return i; }); } var lfr = (((lg.xp || 0) - SLPXP[lv - 1]) / Math.max(1, SLPXP[lv] - SLPXP[lv - 1])), cS = cand.filter(function (i) { return QQ[i].s; }), cN = cand.filter(function (i) { return !QQ[i].s; }); var qi = lfr >= 0.5 && cS.length && (R() < 0.65 || !cN.length) ? pick(cS) : pick(cN.length ? cN : cand); var dueW = (lg.wrong || []).filter(function (w) { return Math.floor(w.q / 100) === lv && w.due <= S.date; }); if (dueW.length && R() < 0.5) { var wq = dueW[0]; lg.wrong = lg.wrong.filter(function (w) { return w !== wq; }); qi = wq.q % 100; } S.langQ = { k: p.k, lv: lv, i: qi }; break; }
      case 'langAnswer': { var LQ = S.langQ; if (!LQ) err('?'); var lg2 = S.lang[LQ.k], qq = langQs(LQ.k, LQ.lv)[LQ.i], ok = qq.o[+p.i] === qq.a; S.langQ = null; lg2.wk = addDays(S.date, -((dow(S.date) + 6) % 7)); lg2.seen.push(LQ.lv * 100 + LQ.i); if (!ok) lg2.wrong = (lg2.wrong || []).concat([{ q: LQ.lv * 100 + LQ.i, due: addDays(S.date, rint(14, 28)) }]).slice(-20); var before2 = slpOf(lg2.xp || 0); langLvl(lg2); lg2.xp = (lg2.xp || 0) + (ok ? 1 : 0.3); xp(S, ok ? 2 : 1); var after2 = slpOf(lg2.xp); info = (ok ? '✅ Richtig! ' : '❌ Leider falsch – richtig ist „' + qq.a + '“. ') + (after2 > before2 ? '📝 Genug gelernt: Die Abschlussprüfung für ' + SLPN[after2] + ' ist freigeschaltet!' : ''); if (after2 > before2) { xp(S, 5); msg(S, 'privat', '📝 ' + LANGS[LQ.k][0] + ': Abschlussprüfung ' + SLPN[after2] + ' freigeschaltet'); } break; }
      case 'ycUp': { need(S, 'jcamps'); var yu = YCAMPS.filter(function (c) { return c[0] === p.k; })[0]; if (!yu || !S.yc || !S.yc[yu[0]]) err('?'); if (S.yc[yu[0]] > S.date) err('Das Camp ist noch im Bau.'); S.ycL = S.ycL || {}; var cl = S.ycL[yu[0]] || 1; if (cl >= 3) err('Höchste Stufe erreicht.'); var ucost = nice(yu[3] * 0.6 * cl); if (S.cash < ucost) err('Nicht genug Bargeld (' + euro(ucost) + ').'); book(S, 'Camp-Ausbau ' + yu[1], -ucost); S.ycL[yu[0]] = cl + 1; S.yc[yu[0]] = addDays(S.date, Math.round(yu[4] * 0.5)); xp(S, 8); info = 'Camp ' + yu[1] + ' wird auf Stufe ' + (cl + 1) + ' ausgebaut – fertig am ' + fmtD(S.yc[yu[0]]) + '.'; break; }
      case 'utilAcc': { S.utilOff = S.utilOff || []; var uo = S.utilOff[+p.i]; if (!uo) err('Angebot nicht mehr da.'); S.util = S.util || {}; S.util[uo.k] = { firm: uo.firm, m: uo.m, from: S.season, to: S.season + uo.yrs - 1 }; S.utilOff.splice(+p.i, 1); xp(S, 2); info = uo.firm + ' ist jetzt euer ' + UTIL[uo.k][1] + ' (+' + euro(uo.m) + '/Monat).'; break; }
      case 'utilDec': { S.utilOff = S.utilOff || []; S.utilOff.splice(+p.i, 1); info = 'Angebot abgelehnt.'; break; }
      case 'teamTrain': { var tw = wkStart(S); if (S.ttW === tw) err('Diese Woche wurde schon trainiert.'); var TT = TRAIN[p.t]; if (!TT) err('Unbekanntes Training.'); S.ttW = tw; var gs = 0, gn = 0;
        S.players.forEach(function (q) { if ((q.loan && q.loan.to) || q.inj > 0) return; var rel = !TT[1] || TT[1].indexOf(q.dp) >= 0 || TT[1].indexOf(q.dp2) >= 0; var g = rnd(0.01, 0.025) * (rel ? 1 : 0.3); q.str += g; if (rel) { gs += g; gn++; skTrain(q, g, TTSK[p.t]); } });
        S.ttLast = { t: p.t, n: TT[0], g: gn ? Math.round(gs / gn * 1000) / 1000 : 0, k: gn, w: tw }; xp(S, 1); info = TT[0] + '-Training durchgeführt: ' + gn + ' Spieler im Schnitt +' + String(S.ttLast.g).replace('.', ',') + ' Stärke.'; break; }
      case 'indTrain': { var iw = wkStart(S); if (S.itW === iw) err('Diese Woche gab es schon ein Einzeltraining.'); itPool(S); if ((S.itPool || []).indexOf(+p.pid) < 0) err('Spieler steht diese Woche nicht zur Auswahl.'); var ip = S.players.filter(function (q) { return q.id === +p.pid; })[0]; if (!ip) err('Spieler nicht gefunden.'); var ig = Math.round(rnd(0.04, 0.09) * 1000) / 1000; ip.str += ig; S.itW = iw; S.itLast = { n: ip.n, g: ig }; info = 'Einzeltraining mit ' + ip.n + ': Stärke +' + String(ig).replace('.', ',') + '.'; break; }
      case 'stream': { var mtd = svwGames(S, D).filter(function (g) { return g.d === S.date && g.gf == null; })[0]; if (!mtd && S.mq && S.mq.length && S.mq[0].o && S.mq[0].o.d === S.date) { var mo0 = S.mq[0].o; mtd = { opp: mo0.opp, comp: mo0.comp }; } if (!mtd) err('Livestreams gehen nur an Spieltagen vor dem Anpfiff.'); if (S.streamD === S.date) err('Heute läuft dein Stream schon.'); S.streamD = S.date; S.streams = (S.streams || 0) + 1;
        var ol = (mtd.opp && typeof mtd.opp === 'object' ? mtd.opp.l : null) || S.lvl, lf0 = 1 + Math.max(0, 11 - S.lvl) * 0.04 + (mtd.comp !== 'liga' && mtd.comp !== 'test' ? 0.25 : 0) + (ol < S.lvl ? 0.2 : 0), ex = Math.min(1.3, S.streams * 0.04);
        var sg = Math.max(1, Math.min(134, Math.round(1 + 133 * Math.pow(R(), Math.max(0.9, 2.6 - ex)) * lf0))); followAdd(S, sg); xp(S, 1); S.streamHist = (S.streamHist || []).concat([sg]).slice(-12);
        S.streamFol = (S.streamFol || 0) + sg; info = '🔴 Livestream vor dem Spiel gegen ' + (mtd.opp && mtd.opp.n ? mtd.opp.n : mtd.opp) + ': +' + sg + ' Follower.'; break; }
      case 'clipLike': { var cd = S.date; S.clipLk = S.clipLk && S.clipLk.d === cd ? S.clipLk : { d: cd, ids: [] }; if (S.clipLk.ids.indexOf(+p.i) >= 0) err('Schon geliked.'); if (S.clipLk.ids.length >= 3) err('Für heute reicht es mit Clips.'); S.clipLk.ids.push(+p.i); xp(S, 1); var cf = R() < 0.4 ? rint(3, 12) : 0; if (cf) followAdd(S, cf); info = '👍 Geliked: +1 XP' + (cf ? ' · +' + cf + ' Follower sind bei dir hängen geblieben' : '') + '.'; break; }
      case 'jokSeen': { S.jokNew = false; break; }
      case 'jokIntroOk': { if (S.jokIntro !== 1) err('Schon erledigt.'); S.jokIntro = 2; S.jokers = (S.jokers || 0) + 1; info = '🃏 Dein erster Joker!'; break; }
      case 'starIntroOk': { if (S.starIntro !== 1) err('Schon erledigt.'); S.starIntro = 2; S.hsPts = (S.hsPts || 0) + 0.5; info = '★ Ein halber Stern für dich!'; break; }
      case 'inhSeen': { S.inhPop = null; break; }
      case 'injDoc': { var dp0 = S.players.filter(function (q) { return q.id === +p.pid; })[0]; if (!dp0 || !(dp0.inj > 0)) err('Spieler ist nicht verletzt.'); var ic0 = injCat(dp0.injN); if (ic0 && !(+ic0[4] > 0)) err('Bei ' + ic0[0] + ' kann ein Arzt nichts beschleunigen.'); if (dp0.inj < 10) err('Nur bei schwereren Verletzungen (ab 10 Tagen).'); if (dp0.docD && diffDays(dp0.docD, S.date) < 14) err('Der Spezialist hat erst in ' + (14 - diffDays(dp0.docD, S.date)) + ' Tagen wieder einen Termin.'); var dc = nice(docCost(S, D, dp0) * (ic0 ? +ic0[4] || 1 : 1)); if (S.cash < dc) err('Nicht genug Bargeld (' + euro(dc) + ').'); book(S, 'Spezialist (' + dp0.n + ')', -dc); var mxr = ic0 ? (+ic0[5] || 20) / 100 : 0.28, red = Math.max(1, Math.round(dp0.inj * rnd(mxr * 0.25, mxr))); dp0.inj = Math.max(1, dp0.inj - red); dp0.injD0 = dp0.inj; dp0.docD = S.date; info = '🩺 Der Spezialist hat ' + dp0.n + ' behandelt: ' + red + ' Tag' + (red === 1 ? '' : 'e') + ' schneller fit (' + euro(dc) + ').'; break; }
      case 'hollySign': { if (!hollyOn(S)) err('Erst ab Manager-Level 25 und 2. Bundesliga.'); if (S.hollyStar) err('Ihr habt schon ein Werbegesicht.'); var hs = ((S.holly || {}).list || [])[+p.i]; if (!hs) err('Angebot nicht mehr da.'); if (S.cash < hs.cost) err('Nicht genug Bargeld für den ersten Monat (' + euro(hs.cost) + ').'); S.hollyStar = { n: hs.n, type: hs.type, ic: hs.ic, cost: hs.cost, eff: hs.eff, since: S.date }; S.holly.list.splice(+p.i, 1); bookPot(S, 'Hollywood-Effekt (' + hs.n + ')', -hs.cost, 'cash'); followAdd(S, 500 + hs.eff * 8000); S.fans = clamp(S.fans + 5, 0, 100); info = '🌟 ' + hs.type + ' ' + hs.n + ' ist das neue Werbegesicht des SV Wachtberg!'; msg(S, 'finanzen', info); break; }
      case 'hollyEnd': { if (!S.hollyStar) err('Kein Werbegesicht.'); info = 'Die Zusammenarbeit mit ' + S.hollyStar.n + ' wurde beendet.'; S.hollyStar = null; break; }
      case 'sellSeen': { S.sellPop = null; break; }
      case 'dailyCheck': { var td = String(p.today || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(td)) err('Datum fehlt.'); if (!S.dm || S.dm.day !== td) dmRoll(S, td); var DL = S.daily = S.daily || { last: '', streak: 0, open: false }; if (DL.last === td) break; var yd = addDays(td, -1); DL.streak = DL.last === yd && DL.streak < 7 ? DL.streak + 1 : 1; DL.last = td; DL.open = true; break; }
      case 'dailyClaim': { var DL2 = S.daily; if (!DL2 || !DL2.open) err('Heute schon abgeholt.'); var pz = dailyPrize(S, D, DL2.streak); DL2.open = false;
        if (pz.t === 'club') bookPot(S, 'Login-Belohnung', pz.amt, 'cash'); else if (pz.t === 'priv') { var Pd = privInit(S); Pd.cash += pz.amt; Pd.log.unshift([S.date, 'Login-Belohnung', pz.amt]); } else if (pz.t === 'fol') followAdd(S, pz.amt); else if (pz.t === 'xp') xp(S, pz.amt); else if (pz.t === 'joker') S.jokers = (S.jokers || 0) + 1; else if (pz.t === 'star') S.hsPts = (S.hsPts || 0) + 0.5;
        S.dailyLast = pz; info = '🎁 ' + pz.txt; break; }
      case 'dkPrice': { var K2 = S.dk; if (!K2) err('Noch keine Dauerkarten.'); if (!(S.hist || []).length) err('Den Preis kannst du ab der zweiten Saison festlegen.'); if (K2.setS === S.season) err('Diese Saison schon geändert.'); var np2 = Math.round(+p.price || 0); if (np2 < 10 || np2 > 2000) err('Preis zwischen 10 und 2.000 €.'); K2.price = np2; K2.setS = S.season; info = '🎫 Dauerkartenpreis für die nächste Saison: ' + euro(np2) + '.'; break; }
      case 'tipSeen': { S.tipPop = null; break; }
      case 'certSeen': { S.certPop = null; break; }
      case 'uiSet': { // reine Anzeige-Merker, ohne Einfluss auf das Spiel
        if (p.k === 'featSeen' && p.v && typeof p.v === 'object') { S.featSeen = S.featSeen || {}; Object.keys(p.v).slice(0, 200).forEach(function (k) { S.featSeen[String(k).slice(0, 40)] = !!p.v[k]; }); }
        else if (p.k === 'prepSeen') S.prepSeen = true;
        else if (p.k === 'lastSigned') S.lastSigned = null;
        else if (p.k === 'prefFast') S.prefFast = !!p.v;
        else if (p.k === 'mgRecent' && Array.isArray(p.v)) S.mgRecent = p.v.slice(0, 12).map(function (x) { return String(x).slice(0, 30); });
        else err('?');
        break; }
      case 'newSeen': { S.players.forEach(function (q) { q.isNew = false; }); break; }
      case 'warnSeen': { S.warnPop = null; break; }
      case 'trPost': { var tq = (S.trPopQ || [])[0]; if (!tq) err('Nichts zu posten.'); if (tq.posted) err('Schon gepostet.'); var tx = tq.x || {}; var fg = Math.round((8 + Math.max(0, (tx.str || 20) - 20) * 3 + (tx.tal || 2) * 10) * (tq.t === 'in' ? 1.4 : 0.7) * (1 + (S.lvl < 5 ? 1.5 : 0) + rnd(0, 0.6))); if (tq.t !== 'in') { var avgS = S.players.length ? S.players.reduce(function (a, q) { return a + (q.str || 0); }, 0) / S.players.length : 30, good = (tx.str || 0) >= avgS + 3 || (tx.tal || 0) >= 4; if (R() < (good ? 0.6 : 0.2)) fg = -Math.max(3, Math.round(fg * (good ? 0.8 : 0.4))); }
        followAdd(S, fg); tq.posted = fg || 1; jokPt(S, 1); info = fg >= 0 ? '📱 Post ist online: +' + fg + ' Follower!' : '📱 Post ist online – die Fans sind sauer über den Abgang: ' + fg + ' Follower.'; break; }
      case 'trPopSeen': { (S.trPopQ || []).shift(); S.mediaN = (S.mediaN || 0) + 1; break; }
      case 'mktAct': { var mwk = wkStart(S); if (S.mktW === mwk) err('Diese Woche gab es schon eine Vermarktungs-Aktion.'); var MKA = { post: ['Social-Media-Kampagne', 0, 2, 3], abend: ['Sponsorenabend', 400, 4, 5], presse: ['Pressetermin mit Lokalzeitung', 0, 2, 3], auto: ['Autogrammstunde im Ort', 150, 3, 4] }, mk = MKA[p.k]; if (!mk) err('Unbekannte Aktion.'); if (mk[1] && S.cash < mk[1]) err('Nicht genug Geld.'); if (mk[1]) book(S, 'Vermarktung', -mk[1]); S.mktW = mwk; var mg = Math.max(0, Math.round(mk[2] * rnd(0.3, 1.9))), mx = Math.max(1, Math.round(mk[3] * rnd(0.6, 1.5))), flop = mg === 0; S.mktB = Math.min(30, (S.mktB || 0) + mg); if (p.k === 'post') followAdd(S, rnd(10, 90)); xp(S, mx); info = mk[0] + (flop ? ' – leider kaum Resonanz. ' : ' durchgeführt – Vermarktung +' + mg + ', ') + '+' + mx + ' XP.'; break; }
      case 'scoutTrain': { need(S, 'scouting'); S.scout = S.scout || { tools: {}, pool: [], n: 0, season: S.season }; var swk = wkStart(S); if (S.scout.trW === swk) err('Diese Woche gab es schon eine Schulung.'); var SCT = [['video', 'Video-Workshop', 2], ['sicht', 'Sichtungslehrgang', 3], ['daten', 'Datenanalyse-Seminar', 2], ['netz', 'Netzwerk-Treffen', 2]], sct = SCT.filter(function (x) { return x[0] === p.k; })[0] || SCT[0]; S.scout.trW = swk; S.scout.score = Math.min(100, (S.scout.score || 0) + sct[2]); xp(S, 2); info = '🎓 ' + sct[1] + ': Scouting-Score +' + sct[2] + ' (+2 XP).'; break; }
      case 'ycBuild': { need(S, 'jcamps'); var yc = YCAMPS.filter(function (c) { return c[0] === p.k; })[0]; if (!yc) err('?'); S.yc = S.yc || {}; if (S.yc[yc[0]]) err('Schon gebaut bzw. im Bau.'); var ycost = yc[3]; if (S.cash < ycost) err('Nicht genug Bargeld (' + euro(ycost) + ').'); book(S, 'Internationales Camp ' + yc[1], -ycost); S.yc[yc[0]] = addDays(S.date, yc[4]); xp(S, 10); info = 'Camp ' + yc[1] + ' wird gebaut – fertig am ' + fmtD(S.yc[yc[0]]) + '.'; msg(S, 'jugend', '🏗️ ' + info); break; }
      case 'ycSign': { var yp = (S.ycPool || [])[+p.i]; if (!yp) err('?'); if (S.cash < yp.fee) err('Nicht genug Bargeld.'); if (S.youth.length >= youthCap(S)) youthAdd(S, yp, true); book(S, 'Jugendcamp-Talent', -yp.fee); S.ycPool.splice(+p.i, 1); S.youth.push(yp); xp(S, 3); info = yp.n + ' (' + yp.from + ', ' + yp.age + ' J.) kommt in die Academy.'; msg(S, 'jugend', '🌍 ' + info); break; }
      case 'waFav': { S.waFav = (S.waFav || []).filter(function (x) { return x !== p.n; }); if (p.on) S.waFav.push(String(p.n).slice(0, 60)); break; }
      case 'waHide': { S.waHide = S.waHide || {}; S.waHide[String(p.n).slice(0, 60)] = +p.ts || 0; break; }
      case 'socialAd': { jokPt(S, 1);
        var awk = addDays(S.date, -((dow(S.date) + 6) % 7)); if (socUsed(S)) err(SOCMSG); var ac = adCost(S); if (S.cash < ac) err('Nicht genug Bargeld (' + euro(ac) + ').'); book(S, 'Social-Media-Werbung', -ac); S.adWeek = awk; var lvA = 1 + (11 - S.lvl) * 0.2, ag = R() < Math.max(0.03, 0.15 - ac / 2000) ? 0 : Math.round(Math.pow(ac / 250, 1.15) * rnd(20, 70) * lvA * (1 + (S.hypeUntil >= S.date ? S.hype || 0 : 0) * 0.5)); followAdd(S, ag); S.adLast = { g: ag, c: ac, d: S.date };
        info = ag ? 'Werbung geschaltet (' + euro(ac) + '): +' + num(ag) + ' Follower.' : 'Werbung geschaltet (' + euro(ac) + ') – leider ohne Wirkung. 😕'; break;
      }
      case 'flyer': { var fwk = wkStart(S); if (socUsed(S)) err(SOCMSG); var fc = flyCost(S); if (S.cash < fc) err('Nicht genug Bargeld (' + euro(fc) + ').'); book(S, 'Flyer', -fc);  S.flyW = fwk; var fg = Math.max(1, Math.round(fc / 100 * rint(6, 14) + rint(0, 3))); followAdd(S, fg); if (R() < 0.3) S.fans = clamp(S.fans + 1, 0, 100); S.flyLast = fg; info = 'Flyer im Ort verteilt (' + euro(fc) + '): +' + fg + ' Follower.'; break; }
      case 'likeFxSeen': { S.likeFx = 0; S.likeSm = 0; break; }
      case 'cupAck': { S.cupPop = null; break; }
      case 'gateSeen': { if (S.lastGate) S.lastGate.fx = false; break; }
      case 'socialAct': { jokPt(S, 1);
        var sa = SOCIAL.filter(function (x) { return x[0] === p.k; })[0]; if (!sa) err('?'); var swk = addDays(S.date, -((dow(S.date) + 6) % 7)); if (socUsed(S)) err(SOCMSG); if (socialPick(S).indexOf(p.k) < 0) err('Diese Aktion steht diese Woche nicht zur Auswahl.');
        S.socWeek = swk; var hyp = S.hypeUntil >= S.date ? S.hype || 0 : 0, lvF2 = 1 + (11 - S.lvl) * 0.3, r0 = R();
        var g1 = r0 < 0.12 ? -rint(1, 8) * lvF2 : Math.round((rnd(2, 8) * lvF2 + S.follow * rnd(0.001, 0.004)) * sa[3] * (1 + hyp));
        g1 = Math.round(g1); followAdd(S, g1); if (g1 > 0) xp(S, 1); S.socLast = { k: p.k, g: g1, d: S.date };
        info = sa[1] + ': ' + (g1 >= 0 ? '+' + num(g1) + ' Follower' : num(g1) + ' Follower – kam nicht gut an') + (hyp && g1 > 0 ? ' (guter Zeitpunkt! 🔥)' : '') + '.'; break;
      }
      case 'potsAck': { S.potsPop = null; break; }
      case 'talk': { var TK = TALKDEF[p.k]; if (!TK) err('?'); var tb = Math.round(rnd(TK[0], TK[1]) * 100) / 100; var xiT = currentXI(S).filter(Boolean), np2 = tb >= 0.6 ? rint(2, 4) : tb < 0 ? rint(1, 3) : rint(1, 2), plT = {}; for (var ti = 0; ti < np2 && xiT.length; ti++) { var tp = xiT.splice(rint(0, xiT.length - 1), 1)[0]; plT[tp.id] = tb < 0 ? -1 : 1; } S.talk = { d: S.date, k: p.k, b: Math.round((tb + Object.keys(plT).reduce(function (a, k) { return a + plT[k]; }, 0) * 0.12) * 100) / 100, pl: plT }; if (p.k === 'spass') S.moral = clamp(S.moral + 1, 0, 100); info = TK[2] + (tb >= 0.6 ? ' Volle Motivation!' : tb < 0 ? ' Hm, das kam nicht so gut an.' : ''); break; }
      case 'medBuy': case 'medBuild': { need(S, 'med'); var mi = MEDIT[p.k]; if (!mi) err('?'); var M3 = medSt(S), mm = M3[p.k] || { lvl: 0, staff: false, bld: null, ren: null }; if (mm.bld && mm.bld > S.date) err('Wird gerade gebaut – fertig am ' + fmtD(mm.bld) + '.'); var ren = mm.lvl >= 3; if (ren && mm.ren && diffDays(S.date, mm.ren) > 365) err('Eine Sanierung ist erst ab ' + fmtD(addDays(mm.ren, -365)) + ' nötig.'); var mcost = nice((ren ? mi[2][2] * 0.35 : mi[2][mm.lvl]) * medMS(S, D)); if (S.cash < mcost) err('Nicht genug Bargeld (' + euro(mcost) + ').'); book(S, 'Med. Abteilung: ' + mi[0] + (ren ? ' (Sanierung)' : ''), -mcost); var bd = Math.round(mi[5] * (ren ? 0.5 : 1 + mm.lvl * 0.3)); if (!ren) mm.lvl++; mm.bld = addDays(S.date, bd); if (mm.lvl >= 3) mm.ren = addDays(S.date, 365 * rint(7, 15)); M3[p.k] = mm; xp(S, 4); info = '🏗️ ' + mi[0] + (ren ? ' wird saniert' : mm.lvl === 1 ? ' wird gebaut' : ' wird auf Stufe ' + mm.lvl + ' ausgebaut') + ' – fertig in ' + bd + ' Tagen.'; msg(S, 'verein', info); break; }
      case 'medStaff': { need(S, 'med'); var mi2 = MEDIT[p.k], M4 = medSt(S), m4 = M4[p.k]; if (!mi2 || !m4 || !m4.lvl) err('Erst bauen.'); if (m4.lvl === 1 && m4.bld && m4.bld > S.date) err('Personal erst nach der Bauzeit (' + fmtD(m4.bld) + ').'); m4.staff = !m4.staff; info = m4.staff ? '👩‍⚕️ Personal für ' + mi2[0] + ' eingestellt – ' + euro(nice(mi2[3][m4.lvl - 1] * medMS(S, D))) + ' pro Monat.' : 'Personal für ' + mi2[0] + ' gekündigt.'; break; }
      case 'bench': { if (p.ids === null) { delete S.lineup.bench; break; } var ids = (p.ids || []).map(Number).filter(function (id) { return S.players.some(function (q) { return q.id === id; }); }).slice(0, 9); S.lineup.bench = ids; S.players.forEach(function (q) { if (ids.indexOf(q.id) >= 0) q.trib = false; }); if (p.ord != null) S.lineup.bord = !!p.ord; break; }
      case 'tribOrd': { S.tribOrd = (p.ids || []).map(Number); break; }
      case 'nego': {
        var nk = p.kind, NL = negoList(S, nk); var no = NL && NL[+p.i]; if (!no || no.gone) err('Angebot nicht mehr gültig.');
        var nn = no.firm || no.name || no.club; no.mood = no.mood == null ? 100 : no.mood; no.nego = no.nego || 0; if (no.nego >= 3) err(nn + ' verhandelt nicht weiter.');
        var ny = clamp(Math.round(+p.yrs || no.yrs), 1, 3), dy = ny - no.yrs, more = clamp(Math.round(+p.more || 0), 0, 2), bo = nk === 'pv' && more === 2; if (bo) { if (no.army) err('Loan-Army-Partner bieten keine Kaufoptionen.'); if ((no.buy || 0) >= no.loans) err('Schon alle Leihspieler mit Kaufoption.'); more = 0; } if (nk === 'pv' && more && no.loans >= 3) more = 0;
        if (!dy && !more && !bo) err('Wähle erst, was du ändern willst: Laufzeit oder ' + (nk === 'pv' ? 'mehr Leihspieler' : 'mehr Geld') + '.');
        no.nego++; var nch = bo ? clamp(0.06 + no.mood / 700 - Math.abs(dy) * 0.04, 0.04, 0.22) : clamp(0.22 + no.mood / 140 - more * 0.13 - Math.abs(dy) * 0.09, 0.08, 0.9); if (bo) no.mood = Math.max(0, no.mood - 8); no.mood = Math.max(0, no.mood - rint(14, 24) - more * 6 - Math.abs(dy) * 4);
        if (R() < nch) { var ch2 = []; if (bo) { no.buy = (no.buy || 0) + 1; ch2.push(no.buy + ' Spieler mit Kaufoption'); } if (more) { if (nk === 'pv') { no.loans = Math.min(3, no.loans + 1); ch2.push(no.loans + ' Leihspieler pro Saison'); } else { no.amt = nice(no.amt * (1 + more * 0.05 + rnd(0, 0.03))); ch2.push(euro(no.amt) + ' pro Saison'); } } if (dy) { no.yrs = ny; ch2.push(ny + (ny === 1 ? ' Jahr' : ' Jahre') + ' Laufzeit'); } no.last = 'ok'; info = nn + ' stimmt zu: ' + ch2.join(', ') + '.'; }
        else if (no.mood < 30 && R() < 0.65) { no.gone = true; no.last = 'gone'; info = nn + ' ist verärgert und bricht die Verhandlungen ab.'; }
        else { no.last = 'no'; info = nn + ' lehnt ab' + (no.nego >= 3 ? ' – das Angebot steht, aber verhandelt wird nicht mehr.' : '. Die Laune sinkt.'); }
        var rest = NL.filter(function (x) { return !x.gone; });
        if (no.gone && nk === 'sp' && rest.length === 1) { var lastS = rest[0]; info += ' Damit bleibt nur ' + lastS.firm + ' – der Vertrag wird automatisch unterschrieben: ' + spAccept(S, D, lastS, lastS.yrs); xp(S, 5); msg(S, 'finanzen', '🤝 Hauptsponsor: ' + lastS.firm); }
        else if (no.gone && nk === 'kit' && rest.length === 1) { var lastO = rest[0]; info += ' Damit bleibt nur ' + lastO.name + ' – der Ausstattervertrag wird automatisch unterschrieben: ' + kitAccept(S, D, 'kit', lastO, lastO.yrs); xp(S, 5); msg(S, 'finanzen', '🤝 Ausstatter: ' + lastO.name); }
        else if (!rest.length) { if (nk === 'sp') { spOffers(S, D, true); info += ' Es liegen neue Angebote vor.'; } else if (nk === 'pv') { pvOffers(S, D); info += ' Neue Vereine haben Interesse.'; } else if (nk === 'ball') { S.ballOffers = null; } else if (nk === 'ps') { S.psOffers = null; S.psBlock = S.season; info += ' Neue Angebote gibt es erst nächste Saison.'; } }
        break;
      }
      case 'pvAccept': { need(S, 'partner'); var po = (S.pvOffers || [])[+p.i]; if (!po || po.gone) err('Angebot nicht mehr gültig.'); if (S.pv && S.pv.to >= S.season) err('Du hast bereits einen Partnerverein.'); info = pvAccept(S, D, po); xp(S, 5); msg(S, 'verein', '🤝 ' + info); break; }
      case 'skUp': {
        var TT = SKTREE.filter(function (x) { return x[0] === p.k; })[0]; if (!TT) err('Unbekannte Rubrik.'); S.skt = S.skt || {}; var si0 = S.skt[TT[0]] || 0; if (si0 >= 25) err('Diese Rubrik ist komplett.');
        if (mlv(S) < skStepLvl(si0)) err('Diese Fähigkeit gibt es ab Manager-Level ' + skStepLvl(si0) + '.'); var sc0 = skStepCost(si0); if ((S.skc || 0) < sc0) err('Dafür brauchst du ' + sc0 + ' Manager Coin' + (sc0 > 1 ? 's' : '') + '.');
        S.skc -= sc0; S.skt[TT[0]] = si0 + 1; var sf = skStepFx(TT, si0); info = TT[2] + ' ' + (si0 === 24 ? 'Meisterfähigkeit freigeschaltet: ' + TT[5] + '!' : 'Neue Fähigkeit: ' + skFxTxt(sf[0], sf[1]) + '.'); if (si0 === 24) xp(S, 50); break;
      }
      case 'skGod': {
        if (S.skGod) err('God Mode ist schon aktiv.'); if (!SKTREE.every(function (T) { return ((S.skt || {})[T[0]] || 0) >= 25; })) err('Erst alle 150 Fähigkeiten freischalten.');
        if ((S.skc || 0) < SKGOD) err('Dafür brauchst du ' + SKGOD + ' Manager Coins.'); S.skc -= SKGOD; S.skGod = true; xp(S, 150); info = '⚡ GOD MODE freigeschaltet! Alle Fähigkeiten wirken 10 % stärker.'; break;
      }
      case 'cupBid': {
        var cbk = p.c === 'mrp' ? 'mrp' : 'kp', CB = CUPBID[cbk], md0 = S.date.slice(5), inWin = md0 >= '08-01' || md0 <= '03-31';
        if (!inWin) err('Bewerbungen sind von August bis Ende März möglich – entschieden wird Mitte April.');
        S.cupBids = (S.cupBids || []).filter(function (b) { return b.s >= S.season; });
        if (S.cupBids.some(function (b) { return b.c === cbk && b.s === S.season; })) err('Für ' + CB.n + ' hast du dich diese Saison schon beworben.');
        var miss = cupBidMiss(S, D, cbk); if (miss.length) err('Noch nicht erfüllt: ' + miss.join(', ') + '.');
        if (S.cash < CB.fee) err('Die Bewerbungsgebühr von ' + euro(CB.fee) + ' fehlt in der Kasse.');
        book(S, 'Bewerbung Pokalfinale', -CB.fee); S.cupBids.push({ c: cbk, s: S.season, st: 'open' });
        info = '📨 Bewerbung für das ' + cupName(S, cbk) + '-Finale ' + (S.season + 1) + '/' + String(S.season + 2).slice(2) + ' abgeschickt – Entscheidung Mitte April.'; break;
      }
      case 'pvOffers': { need(S, 'partner'); if (S.pv && S.pv.to >= S.season) err('Du hast bereits einen Partnerverein.'); if (S.pvOffers && S.pvOffers.length) { info = 'Es liegen bereits Angebote vor.'; break; }
        if (!S.pvAsk || S.pvAsk.s !== S.season) S.pvAsk = { s: S.season, n: 0 }; if (S.pvAsk.n >= 3) err('Du hast diese Saison schon 3 Vereine angefragt – nächste Saison kannst du es wieder versuchen.');
        S.pvAsk.n++; var pvLeft = 3 - S.pvAsk.n, pvCh = clamp(0.45 + (S.spons || 50) / 400 + (S.lvl <= 5 ? 0.05 : 0), 0.35, 0.7);
        if (R() < pvCh) { pvOffers(S, D); var nOff = R() < 0.5 ? 1 : R() < 0.7 ? 2 : 3; S.pvOffers = S.pvOffers.slice(0, nOff); info = (nOff === 1 ? 'Ein Verein hat' : nOff + ' Vereine haben') + ' Interesse an einer Partnerschaft.'; }
        else info = 'Leider hat diesmal kein Verein Interesse. ' + (pvLeft ? 'Du kannst es diese Saison noch ' + pvLeft + '× versuchen.' : 'Diese Saison sind keine Anfragen mehr möglich.');
        break; }
      case 'pvBuy': {
        need(S, 'partner'); var bp = getP(S, p.pid); if (!bp.loan || !bp.loan.pv || !bp.loan.buy) err('Keine Kaufoption.'); if (pvBuyLeft(S) <= 0) err('Laut Partnerschaftsvertrag sind keine Kaufoptionen (mehr) frei.'); S.pv.buyUsed = { season: S.season, n: (S.pv.buyUsed && S.pv.buyUsed.season === S.season ? S.pv.buyUsed.n : 0) + 1 }; var fee = bp.loan.buy; if (S.tb < fee) err('Nicht genug Transferbudget (' + euro(fee) + ').');
        bookPot(S, 'Kaufoption ' + bp.n, -fee, 'tb'); var frm = bp.loan.from; bp.loan = null; bp.ce = S.season + 2; bp.sal = salDemand(bp, S.lvl); info = bp.n + ' wird fest von ' + frm + ' verpflichtet (' + euro(fee) + ', Vertrag bis 06/' + bp.ce + ').'; msg(S, 'transfer', '✍️ ' + info); xp(S, 3); break;
      }
      case 'pvSend': {
        need(S, 'partner'); if (!S.pv || !S.pv.army) err('Nur als Loan Army möglich.'); var sp2 = getP(S, p.pid); if (sp2.self || sp2.loan) err('Nicht möglich.'); squadOk(S, sp2);
        var sent = S.players.filter(function (q) { return q.loan && q.loan.to && q.loan.pv; }).length; if (sent >= S.pv.loans) err('Du kannst diese Saison höchstens ' + S.pv.loans + ' Spieler zu ' + S.pv.club + ' schicken.');
        sp2.loan = { to: S.pv.club, pv: true }; removeFromXI(S, sp2); info = sp2.n + ' spielt bis Saisonende bei ' + S.pv.club + ' und sammelt Spielpraxis (+Entwicklung).'; msg(S, 'transfer', info); break;
      }
      case 'fanAct': { jokPt(S, 2); S.lastFanAct = S.date;
        var fa = FANACT[p.k]; if (!fa) err('Unbekannte Aktion.'); var nFC = (S.fcs || []).length; if ((p.k === 'stammtisch' || p.k === 'fanclub') && !nFC) err('Dafür brauchst du erst einen Fanclub (ab Manager-Level 3).'); S.fanCd = S.fanCd || {}; var fwk = addDays(S.date, -((dow(S.date) + 6) % 7)); if (S.fanWeek === fwk) err('Diese Woche gab es schon eine Fan-Aktion. Nächste Woche wieder!'); if (S.fanCd[p.k] && S.fanCd[p.k] > S.date) err(fa[0] + ' geht erst wieder ab ' + fmtD(S.fanCd[p.k]) + '.'); S.fanN = S.fanN && S.fanN.s === S.season ? S.fanN : { s: S.season }; var fLim = p.k === 'fanclub' ? nFC : 4; if ((S.fanN[p.k] || 0) >= fLim) err(fa[0] + ' gab es diese Saison schon ' + fLim + '×' + (p.k === 'fanclub' ? ' (so oft, wie du Fanclubs hast)' : '') + '. Ab der neuen Saison wieder.'); S.fanN[p.k] = (S.fanN[p.k] || 0) + 1; S.fanWeek = fwk;
        var fc = nice(fa[2] * moneyScale(S, D)); if (S.cash < fc) err('Nicht genug Bargeld (' + euro(fc) + ').'); if (fc) book(S, 'Fan-Aktion ' + fa[0], -fc);
        var damp = S.fans > 85 ? 0.5 : 1, fx = fa[4], outF = [];
        Object.keys(fx).forEach(function (kk) { var v = Math.max(1, Math.round(fx[kk] * damp)); if (kk === 'fans') { S.fans = clamp(S.fans + v, 0, 100); outF.push('Fans +' + v); } if (kk === 'moral') { S.moral = clamp(S.moral + v, 0, 100); outF.push('Moral +' + v); } if (kk === 'spons') { S.spons = clamp(S.spons + v, 0, 100); outF.push('Sponsoren +' + v); } if (kk === 'fanbase') { S.fanbase = Math.round(S.fanbase * (1 + v / 100)); outF.push('Fanbasis +' + v + ' %'); } });
        { var sfol = p.k === 'social' ? rint(17, 83) : Math.max(3, Math.round(((fx.fans || 0) * 2.5 + (fx.fanbase || 0) * 3 + (fx.moral || 0) + 4) * rnd(0.7, 1.3) * damp)); S.follow = (S.follow != null ? S.follow : followStart(S)) + sfol; outF.push('+' + sfol + ' Follower'); }
        // Fan-Stammtisch: als Single kann man dort jemanden kennenlernen (wie beim Dating)
        if (p.k === 'stammtisch' || p.k === 'fanclub') { var FS = privInit(S).fam; if (!FS.partner && R() < 0.25) { FS.partner = { img: relImg(S, D), n: pick(VN_W) + ' ' + pick(D.nn), age: rint(21, 55), job: pick(JOB_W), look: rint(30, 100), char: rint(30, 100), intl: rint(30, 100), rel: rint(40, 60), since: S.date, engaged: null, married: null, tries: 0 }; FS.res = { ok: true, p: FS.partner, via: fa[0] }; S.fans = clamp(S.fans + 1, 0, 100); outF.push('💘 Match! Du hast ' + FS.partner.n.split(' ')[0] + ' kennengelernt (Fans +1)'); } else if (!FS.partner && R() < 0.5) outF.push(pick(['Eine Frau hat dir zugezwinkert – aber dann kam ihr Mann mit zwei Bier.', 'Du hast nett mit einer Fanbeauftragten geplaudert, mehr war nicht.', 'Kein Match heute – dafür viele Fragen zur Aufstellung.'])); }
        if (p.k === 'camp') { var cy = newYouth(S, D, R() < 0.3); cy.age = rint(14, 15); outF.push(youthAdd(S, cy) ? '1 neues Talent für die Academy (' + cy.n + ')' : 'ein Talent war dabei, aber die Academy ist voll'); }
        S.fanCd[p.k] = addDays(S.date, fa[3]); xp(S, 1); info = fa[0] + ': ' + outF.join(', ') + '.'; msg(S, 'verein', '🎉 ' + info); break;
      }
      case 'weekPlan': {
        if (!S.weekNeed) err('Keine Trainingswoche offen.'); var tk = TRAIN[p.t] ? p.t : 'taktik'; var ft = TRAIN[tk][2].indexOf(p.f) >= 0 ? p.f : TRAIN[tk][2][0]; var dif = ['easy', 'mid', 'hard'].indexOf(p.diff) >= 0 ? p.diff : 'easy'; var wsc = dif === 'easy' ? 0.6 : clamp(+p.score || 0, 0, 1);
        S.weekPlan = { wk: S.weekWk, t: tk, f: ft, diff: dif, score: wsc }; S.weekNeed = null; if (dif !== 'easy' && wsc >= 0.999) { xp(S, 1); info = 'Perfektes Training! +1 XP · '; } else info = '';
        info += 'Trainingswoche: ' + TRAIN[tk][0] + ' – ' + ft + ' (' + { easy: 'Co-Trainer', mid: 'Training beobachten', hard: 'selbst mitgekickt' }[dif] + ').'; break;
      }
      case 'posWish': { var pwq = getP(S, +p.pid); if (!pwq) err('?'); if (!GRP[p.dp] || p.dp === pwq.dp || p.dp === pwq.dp2) err('Diese Position hat er schon.'); pwq.dp3 = p.dp; pwq.f3 = rnd(0.07, 0.44); pwq.posAsked3 = false; info = pwq.n + ' trainiert jetzt zusätzlich als ' + p.dp + ' (Wunschposition, Start ' + Math.round(pwq.f3 * 100) + ' %).'; break; }
      case 'posSwap': {
        var pq = S.posPop ? getP(S, S.posPop.pid) : null; S.posPopW = S.posPop ? S.posPop.w || 2 : 2; S.posPop = null; if (!pq) break;
        var pw = (S.posPopW || 2); S.posPopW = null;
        if (p.yes) { var od = pq.dp; if (pw === 3) { var dropped = pq.dp2; pq.dp = pq.dp3; pq.dp2 = od; pq.f2 = 0.95; pq.dp3 = null; pq.f3 = null; pq.posAsked3 = false; info = pq.n + ' spielt ab sofort als ' + pq.dp + ' (Hauptposition, Wunschposition erreicht!). ' + od + ' ist jetzt Nebenposition' + (dropped ? ', ' + dropped + ' fällt weg' : '') + '.'; } else { pq.dp = pq.dp2; pq.dp2 = od; pq.f2 = 0.95; info = pq.n + ' spielt ab sofort als ' + pq.dp + ' (Hauptposition). ' + od + ' ist jetzt seine Nebenposition.'; } pq.pos = GRP[pq.dp] || pq.pos; pq.posAsked = false; xp(S, 5); msg(S, 'kader', '🔄 ' + info); }
        else { if (pw === 3) pq.posAsked3 = true; else pq.posAsked = true; info = pq.n + ' bleibt ' + pq.dp + '.'; }
        break;
      }
      case 'fillXI': { if (S.lineup.xi) S.lineup.xi = currentXI(S).map(function (q) { return q ? q.id : null; }); info = 'Startelf aufgefüllt.'; break; }
      case 'spReject': { err('Einen Hauptsponsor musst du wählen.'); if (!S.spNeed) err('Keine Angebote offen.'); spOffers(S, D, true); info = 'Neue Angebote von anderen Firmen liegen vor.'; break; }
      case 'move': {
        var POTS = { cash: 'Kasse', tb: 'Transferbudget', sav: 'Tagesgeld' };
        if (!POTS[p.from] || !POTS[p.to] || p.from === p.to) err('Ungültige Umbuchung.');
        var amt = nice(Math.max(0, +p.amount || 0)); if (!amt) err('Betrag fehlt.'); if (S[p.from] < amt) err('Nicht genug auf ' + POTS[p.from] + '.');
        if (S.movesSeason !== S.season) { S.movesSeason = S.season; S.moves = 0; } if (S.moves >= 3) err('Du kannst nur 3× pro Saison umbuchen.');
        S[p.from] -= amt; S[p.to] += amt; S.moves++; info = euro(amt) + ' von ' + POTS[p.from] + ' auf ' + POTS[p.to] + ' umgebucht (' + (3 - S.moves) + ' Umbuchungen übrig).'; break;
      }
      case 'tplan': {
        need(S, 'trainingsplan'); var tp = getP(S, p.pid);
        if (p.tp != null) { if (p.tp && !TPLANS[p.tp]) err('Unbekannter Plan.'); tp.tp = p.tp || null; }
        if (p.to !== undefined) { if (p.to && !GRP[p.to]) err('Position ungültig.'); if (p.to === tp.dp) err('Spielt schon auf dieser Position.'); tp.retrain = p.to ? { to: p.to, w: 0 } : null; }
        info = tp.n + ': ' + (tp.tp ? TPLANS[tp.tp] : 'Mannschaftstraining') + (tp.retrain ? ' · Umschulung zu ' + tp.retrain.to : ''); break;
      }
      case 'captain': { need(S, 'kapitaen'); var cp = getP(S, p.pid); S.captain = cp.id; cp.form = clamp(cp.form + 1.5, -5, 5); S.moral = clamp(S.moral + 1, 0, 100); info = cp.n + ' ist neuer Kapitän → Form +1,5, Moral +1'; msg(S, 'verein', '©️ ' + info); break; }
      case 'pen': { need(S, 'kapitaen'); var pp = getP(S, p.pid); S.pen = pp.id; pp.form = clamp(pp.form + 1, -5, 5); info = pp.n + ' schießt die Elfmeter → Form +1'; break; }
      case 'promote': {
        var yi = S.youth.filter(function (x) { return x.id === +p.yid; })[0]; if (!yi) err('Talent nicht gefunden.'); if (yi.age < 16) err(yi.n + ' ist erst ' + yi.age + ' – in die Erste geht es ab 16.');
        if (S.players.length >= 30) err('Der Kader ist voll (max. 30).');
        S.youth = S.youth.filter(function (x) { return x !== yi; }); yi.sal = nice(Math.max(50, salDemand(yi, S.lvl) * 0.5)); yi.ce = seasonEndYear(S) + 2; yi.fit = 90; yi.form = 0; yi.inj = 0; yi.g = 0; yi.a = 0; yi.gp = 0; yi.gr = 0; yi.recent = 0; yi.tries = 0;
        S.players.push(yi); xp(S, 3); ach(S, 'eigengewaechs', yi.n, true); S.fans = clamp(S.fans + 1, 0, 100);
        info = yi.n + ' (' + yi.age + ') rückt aus der Jugend in den Kader auf.'; msg(S, 'jugend', '🌱 ' + info); break;
      }
      case 'dropyouth': { var yd = S.youth.filter(function (x) { return x.id === +p.yid; })[0]; if (!yd) err('Talent nicht gefunden.'); (S.youthNext = S.youthNext || []).push(addDays(S.date, rint(17, 84))); S.youth = S.youth.filter(function (x) { return x !== yd; }); info = yd.n + ' wurde aus der Jugend verabschiedet.'; break; }
      case 'credit': {
        need(S, 'kredit'); if (S.loan) err('Es läuft bereits ein Kredit.');
        var maxC = nice(D.lv[S.lvl].budget * 0.6); var ca = nice(Math.max(0, +p.amount || 0)); if (!ca || ca > maxC) err('Kredit zwischen 1 € und ' + euro(maxC) + ' möglich.');
        var tot = nice(ca * 1.12); S.loan = { amount: ca, rest: tot, monthly: nice(tot / 24) }; bookPot(S, 'Kredit', ca, 'cash');
        info = 'Kredit über ' + euro(ca) + ' aufgenommen. Rate: ' + euro(S.loan.monthly) + '/Monat (24 Monate, 12 % Zinsen gesamt).'; msg(S, 'finanzen', info); break;
      }
      case 'ipo': { if (S.ag) err('Der Verein ist bereits eine AG.'); var aw = agCheck(S, D); if (aw.length) err('Börsengang noch nicht möglich: ' + aw.join(', ') + '.'); var p0 = agBase(S, D); S.ag = { p0: p0, p: p0, sold: 20, hist: [p0], since: S.season }; var ipoG = p0 * 20; bookPot(S, 'Börsengang (20 % Aktien)', ipoG, 'tb'); xp(S, 25); hypeUp(S, 1); info = '🔔 Glocke geläutet! Der SV Wachtberg ist jetzt eine AG. 20 % der Aktien bringen ' + euro(ipoG) + ' ins Transferbudget.'; msg(S, 'finanzen', info); break; }
      case 'agSell': { if (!S.ag) err('Keine AG.'); if (S.ag.sold >= 49) err('Mehr als 49 % dürfen nicht verkauft werden – die Mehrheit bleibt beim Verein.'); var sg = S.ag.p * 5; S.ag.sold += 5; bookPot(S, 'Aktienverkauf 5 %', sg, 'tb'); S.board = clamp(S.board - 2, 0, 100); S.fans = clamp(S.fans - 1, 0, 100); info = '5 % Aktien verkauft: +' + euro(sg) + ' (Transferbudget). Fans & Vorstand sehen das kritisch.'; break; }
      case 'agBuy': { if (!S.ag) err('Keine AG.'); if (S.ag.sold <= 0) err('Alle Aktien sind beim Verein.'); var bg = S.ag.p * 5; if (S.cash < bg) err('Nicht genug Bargeld (' + euro(bg) + ').'); S.ag.sold = Math.max(0, S.ag.sold - 5); bookPot(S, 'Aktienrückkauf 5 %', -bg, 'cash'); S.board = clamp(S.board + 1, 0, 100); info = '5 % Aktien zurückgekauft (−' + euro(bg) + ').'; break; }
      case 'bondAsk': { if (S.fans < 90) err('Fan-Anleihen erst ab 90 % Fan-Ansehen.'); if (S.bond) err('Es läuft bereits eine Fan-Anleihe.'); var bw = wkStart(S); if (S.bondAskW === bw) err('Diese Woche wurde schon angefragt.'); S.bondAskW = bw; if (R() < 1 / 3) { var avb = Math.max(0, S.cash) + Math.max(0, S.tb || 0); S.bondOffer = { amt: nice(Math.max(2000, avb * rnd(0.05, 0.25))), rate: Math.round(rnd(6, 14) * 10) / 10, months: rint(12, 24), exp: addDays(S.date, 14) }; info = '📜 Die Fans zeichnen eine Anleihe: ' + euro(S.bondOffer.amt) + ' zu ' + S.bondOffer.rate + ' % Zinsen.'; } else info = 'Diesmal kam keine Anleihe zustande. Nächste Woche nochmal versuchen.'; break; }
      case 'bondAcc': { var bo2 = S.bondOffer; if (!bo2) err('Kein Angebot.'); if (S.bond) err('Es läuft bereits eine Fan-Anleihe.'); var tot = Math.round(bo2.amt * (1 + bo2.rate / 100 * bo2.months / 12)); S.bond = { amt: bo2.amt, total: tot, rest: tot, monthly: Math.ceil(tot / bo2.months), months: bo2.months, rate: bo2.rate, paid: 0 }; S.bondOffer = null; bookPot(S, 'Fan-Anleihe', bo2.amt, 'cash'); info = 'Fan-Anleihe angenommen: +' + euro(bo2.amt) + '. Rückzahlung ' + euro(S.bond.monthly) + ' pro Monat.'; break; }
      case 'bondNo': { S.bondOffer = null; info = 'Angebot abgelehnt.'; break; }
      case 'payoff': { if (!S.loan) err('Kein Kredit.'); if (S.cash < S.loan.rest) err('Nicht genug in der Kasse.'); bookPot(S, 'Kreditrate', -S.loan.rest, 'cash'); S.loan = null; info = 'Kredit vollständig getilgt.'; break; }
      case 'hidepost': break;
      case 'press': {
        if (!S.pressPending) err('Keine Pressekonferenz.'); var ans = p.a || []; var outP = [];
        pressQs(S).forEach(function (q, i) { var o = q[1][+ans[i]] || q[1][0]; outP = outP.concat(applySimpleFx(S, o[1])); });
        S.pressPending = false; xp(S, 5); checkBars(S); info = 'Pressekonferenz → ' + outP.join(', '); break;
      }
      case 'trainDay': {
        if (!S.trainDay) err('Heute ist kein Trainingstag.');
        if (p.skip) { S.trainDay = null; S.players.forEach(function (q) { q.fit = clamp(q.fit + 4, 20, 100); }); info = 'Training abgesagt – die Jungs erholen sich (Fitness +4).'; break; }
        var dfc = p.diff, sc0 = dfc === 'easy' ? 0.6 : p.score == null ? null : clamp(+p.score, 0, 1); var mlt = dfc === 'easy' ? 0.3 : dfc === 'mid' ? 0.8 : dfc === 'hard' ? 1.5 : 1; var tr = doTraining(S, D, p.t, p.f || '', sc0, mlt); S.trainDay = null; info = 'Training ' + TRAIN[p.t][0] + ' (' + (p.f || '') + ')' + (sc0 != null ? ' – Leistung ' + Math.round(sc0 * 100) + ' %' : ''); break;
      }
      case 'prepCancel': {
        var PC = S.prep || {}; var ph = PC.need ? PC.phase : (PC.phase === 'summerDone' ? 'summer' : 'winter');
        var nT0 = (S.tests || []).length; S.tests = (S.tests || []).filter(function (t) { return !(t.prep === ph && t.d > S.date); }); var rmT = nT0 - S.tests.length, refund = 0;
        S.dayEv = (S.dayEv || []).filter(function (x) { if (x.prep === ph && !x.done && x.d > S.date) { refund += Math.round((x.cost || 0) * 0.5); return false; } return true; });
        if (refund) book(S, 'Erstattung Vorbereitung', refund);
        S.prep = ph === 'summer' ? { phase: 'summerDone', need: false } : { phase: 'done', need: false };
        info = 'Vorbereitung abgebrochen' + (rmT ? ' – ' + rmT + ' Testspiel(e) abgesagt' : '') + (refund ? ', ' + euro(refund) + ' erstattet' : '') + '.'; break;
      }
      case 'prepPlan': {
        var PP = S.prep; if (!PP || !PP.need) err('Keine Vorbereitung offen.');
        if (p.skip) { S.prep = PP.phase === 'summer' ? { phase: 'summerDone', need: false } : { phase: 'done', need: false }; info = 'Ohne Vorbereitung in die Saison – die Mannschaft startet direkt in den Ligabetrieb.'; break; }
        var tests = p.tests || [], ok = 0;
        var win = prepWin(S, D, PP.phase);
        var games = svwGames(S, D); var opps = testOpps(S, D);
        tests.forEach(function (t) { if (!t.d || t.d < win[0] || t.d > win[1] || t.d <= S.date) err('Testspiel-Termin außerhalb der Vorbereitung (' + fmtD(win[0]) + ' – ' + fmtD(win[1]) + ').'); if (games.some(function (g) { return Math.abs(diffDays(g.d, t.d)) <= 1; })) err('Ein Testspiel liegt zu nah an einem anderen Spiel.'); if ((S.dayEv || []).some(function (x) { return x.k === 'benefiz' && !x.done && x.d === t.d; })) err('An dem Tag ist schon ein Benefizspiel.'); var o = opps.filter(function (x) { return x.n === t.opp; })[0] || opps[0]; S.tests.push({ d: t.d, opp: { n: o.n, s: o.s, l: o.l }, home: t.home !== false, prep: PP.phase }); ok++; });
        var ev = PP.phase === 'summer' ? p.camp : p.halle; var k = PP.phase === 'summer' ? 'camp3' : 'halle';
        if (!ev || !ev.d || ev.d < win[0] || ev.d > win[1]) err(PP.phase === 'summer' ? 'Bitte einen Termin für das Trainingslager wählen.' : 'Bitte einen Termin für das Hallenturnier wählen.');
        if (games.some(function (g) { return g.d === ev.d; })) err('An dem Tag ist schon ein Spiel.');
        var cost = dayEvCost(S, D, k); book(S, DAYEV[k][0], -cost); S.dayEv = S.dayEv || []; S.dayEv.push({ d: ev.d, k: k, season: S.season, done: false, name: DAYEV[k][0], prep: PP.phase, cost: cost });
        S.prep = PP.phase === 'summer' ? { phase: 'summerDone', need: false } : { phase: 'done', need: false, info: true };
        info = 'Vorbereitung geplant: ' + ok + ' Testspiel(e) + ' + DAYEV[k][0] + '.'; break;
      }
      case 'prepAck': { if (S.prep) S.prep.info = false; break; }
      case 'fk': { need(S, 'kapitaen'); var fp = getP(S, p.pid); S.fk = fp.id; fp.form = clamp(fp.form + 1, -5, 5); info = fp.n + ' tritt die Freistöße → Form +1'; break; }
      case 'ck': { need(S, 'kapitaen'); var cp2 = getP(S, p.pid); S.ck = cp2.id; cp2.form = clamp(cp2.form + 1, -5, 5); info = cp2.n + ' tritt die Ecken → Form +1'; break; }
      case 'donate': {
        var P2 = privInit(S); var amt = Math.round(+p.amount || 0); if (amt < 10) err('Mindestens 10 €.'); if (P2.cash < amt) err('So viel hast du privat nicht.');
        if (P2.don.season !== S.season) P2.don = { season: S.season, n: 0, club: false };
        var rel = amt / Math.max(1000, D.lv[S.lvl].budget); var outD = [];
        if (p.to === 'club') { if (P2.don.club) err('Dem Verein kannst du nur einmal pro Saison spenden.'); P2.don.club = true; P2.cash -= amt; book(S, 'Spende vom Manager', amt); var bf = Math.min(15, Math.round(2 + rel * 40)); S.board = clamp(S.board + bf, 0, 100); S.fans = clamp(S.fans + Math.round(bf / 2), 0, 100); outD = ['Vorstand +' + bf, 'Fans +' + Math.round(bf / 2)]; }
        else { var ch = CHARITY.filter(function (x) { return x[0] === p.to; })[0]; if (!ch) err('Unbekannter Zweck.'); if (P2.don.n >= 2) err('Du kannst zweimal pro Saison spenden.'); P2.don.n++; P2.cash -= amt; var ff = Math.min(20, Math.round(2 + rel * 60)); S.fans = clamp(S.fans + ff, 0, 100); S.spons = clamp((S.spons || 60) + Math.round(ff / 2), 0, 100); S.fanbase = Math.round(S.fanbase * (1 + Math.min(0.08, rel * 0.2))); outD = ['Fans +' + ff, 'Sponsoren +' + Math.round(ff / 2)]; makePost(S, D, null); S.feed[0].t = 'Stark! Unser Trainer ' + S.full + ' spendet ' + euro(amt) + ' an ' + ch[1] + ' 💚'; }
        P2.log.unshift([S.date, 'Spende', -amt]); checkBars(S); info = 'Danke für ' + euro(amt) + '! → ' + outD.join(', '); break;
      }
      case 'famDate': {
        var F = privInit(S).fam; if (F.partner) err('Du bist vergeben.'); var mk = S.date.slice(0, 7); if (F.lastDate === mk) err('Dating geht nur einmal im Monat.'); F.lastDate = mk;
        var ch2 = { tinder: 0.25, ausgehen: 0.33, freunde: 0.42 }[p.how]; if (!ch2) err('Art wählen.');
        if (R() < ch2) { F.partner = { img: relImg(S, D), n: pick(VN_W) + ' ' + pick(D.nn), age: rint(21, 55), job: pick(JOB_W), look: rint(30, 100), char: rint(30, 100), intl: rint(30, 100), rel: rint(35, 55), since: S.date, engaged: null, married: null, tries: 0 }; F.res = { ok: true, p: F.partner }; info = 'Du hast jemanden kennengelernt!'; }
        else { F.res = { ok: false, t: pick(DATE_TXT[p.how] || DATE_TXT.ausgehen) }; info = F.res.t; }
        break;
      }
      case 'famAck': { var F2 = privInit(S).fam; F2.res = null; break; }
      case 'famTime': { var F3 = privInit(S).fam; if (!F3.partner) err('Keine Partnerin.'); if (F3.lastTime && diffDays(F3.lastTime, S.date) < 7) err('Ihr habt diese Woche schon Zeit verbracht.'); F3.lastTime = S.date; var g3 = rint(3, 7); F3.partner.rel = clamp(F3.partner.rel + g3, 0, 100); info = 'Schöne Zeit mit ' + F3.partner.n + ' (Beziehung +' + g3 + ').'; break; }
      case 'famGift': { var P4 = privInit(S), F4 = P4.fam; if (!F4.partner) err('Keine Partnerin.'); var tier = { klein: [80, 3], mittel: [400, 7], gross: [2000, 14] }[p.tier]; if (!tier) err('Geschenk wählen.'); if (P4.cash < tier[0]) err('Dafür fehlt dir das Geld.'); P4.cash -= tier[0]; P4.log.unshift([S.date, 'Geschenk für ' + F4.partner.n, -tier[0]]); F4.partner.rel = clamp(F4.partner.rel + tier[1], 0, 100); info = F4.partner.n + ' freut sich (Beziehung +' + tier[1] + ').'; break; }
      case 'famEngage': { var F5 = privInit(S).fam, pr = F5.partner; if (!pr) err('Keine Partnerin.'); if (pr.engaged) err('Ihr seid schon verlobt.'); if (pr.rel <= 80) err('Die Beziehung muss über 80 % liegen.'); if (R() < 0.88) { pr.engaged = S.date; pr.rel = clamp(pr.rel + 5, 0, 100); info = pr.n + ' hat JA gesagt! 💍'; } else { pr.rel = clamp(pr.rel - 15, 0, 100); info = pr.n + ' braucht noch Zeit … (Beziehung −15)'; } break; }
      case 'famMarry': { var F6 = privInit(S).fam, pm2 = F6.partner; if (!pm2 || !pm2.engaged) err('Erst verloben.'); if (pm2.married) err('Ihr seid schon verheiratet.'); if (diffDays(pm2.engaged, S.date) < 730) err('Heiraten geht erst 2 Jahre nach der Verlobung.'); if (pm2.rel <= 90) err('Die Beziehung muss über 90 % liegen.'); var P6 = privInit(S); var wc = 15000; if (P6.cash < wc) err('Die Hochzeit kostet ' + euro(wc) + '.'); P6.cash -= wc; P6.log.unshift([S.date, 'Hochzeit', -wc]); pm2.married = S.date; S.fans = clamp(S.fans + 4, 0, 100); info = 'Ihr habt geheiratet! 💒 Die Fans gratulieren.'; break; }
      case 'famBaby': { var F7 = privInit(S).fam, pb = F7.partner; if (!pb) err('Keine Partnerin.'); if (F7.preg) err('Ihr erwartet schon ein Kind.'); if (diffDays(pb.since, S.date) < 182) err('Erst nach 6 Monaten Beziehung.'); var chb = clamp(0.1 + pb.tries * 0.08, 0.1, 0.8); pb.tries++; if (R() < chb) { F7.preg = addDays(S.date, 270); info = 'Ihr bekommt ein Baby! 🍼 Geburt ca. ' + fmtD(F7.preg) + '.'; } else info = 'Diesmal hat es nicht geklappt.'; break; }
      case 'famName': { var F8 = privInit(S).fam; if (!F8.pend) err('Kein Baby.'); var nm = String(p.name || '').trim().slice(0, 30); if (!nm) err('Bitte einen Namen eingeben.'); F8.kids.push({ n: nm, g: F8.pend.g, born: F8.pend.born }); F8.pend = null; info = 'Willkommen, ' + nm + '! 👶'; break; }
      case 'famSplit': { var F9 = privInit(S).fam; if (!F9.partner) err('Keine Partnerin.'); info = 'Du hast dich von ' + F9.partner.n + ' getrennt.'; F9.partner = null; F9.preg = null; break; }
      case 'jobChoose': {
        var J = privInit(S).job; var path = p.path; if (!JOBS[path]) err('Weg wählen.');
        if (J.stage === 'study' || J.stage === 'job') err('Erst kündigen bzw. abschließen.');
        if (J.stage === 'abi') { var st = JOBS[path].study; if (st && st[3] && privInit(S).cash < st[3] * 3) err('Für das Studium brauchst du ein Polster von mindestens ' + euro(st[3] * 3) + ' (Studiengebühr ' + euro(st[3]) + '/Monat). Vielleicht erst mal ein Minijob?'); J.path = path; if (st) { J.stage = 'study'; J.title = st[0]; J.sal = st[2]; J.months = 0; info = 'Los geht’s: ' + st[0] + '.'; break; } }
        if (J.path !== path && J.stage !== 'abi') err('Dein Weg steht fest: ' + ({ uni: 'Studium', ausb: 'Ausbildung', arbeit: 'Arbeit' }[J.path]) + '.');
        J.path = path; J.stage = 'job'; J.step = Math.min(J.step || 0, JOBS[path].ladder.length - 1); J.title = JOBS[path].ladder[J.step][0]; J.sal = JOBS[path].ladder[J.step][1]; J.months = 0; info = 'Neuer Job: ' + J.title + ' (' + euro(J.sal) + ' netto).'; break;
      }
      case 'ownBuy': { var Ob = ownInit(S); if (Ob.pct >= 100) err('Der Verein gehört dir schon ganz.'); var rq = ownReq(S, D).filter(function (r) { return !r[1]; }); if (rq.length) err('Noch nicht möglich: ' + rq[0][0] + '.'); var opr = ownStepPrice(S, D); privInit(S).cash -= opr; privInit(S).log.unshift([S.date, 'Vereinsanteile ' + S.club, -opr]); Ob.pct += 10; if (!Ob.since) Ob.since = S.date; if (Ob.pct >= 51 && !Ob.maj) Ob.maj = S.season; if (Ob.pct === 30) S.board = Math.min(100, S.board + 10); book(S, 'Kapitalerhöhung durch Manager', nice(opr * 0.5)); xp(S, 10); var pk = OWNPERK.filter(function (x) { return x[0] === Ob.pct || (Ob.pct === 60 && x[0] === 51); })[0]; Ob.log.unshift([S.date, 'Anteile auf ' + Ob.pct + ' % erhöht']); info = '🏢 Dir gehören jetzt ' + Ob.pct + ' % von ' + S.club + '. Die Hälfte des Kaufpreises fließt als Kapitalerhöhung in die Vereinskasse.' + (pk ? ' Neu: ' + pk[1] + '!' : ''); break; }
      case 'clubBuy': { // Anteile an fremden Vereinen (10 % je Schritt)
        var Oc = ownInit(S), cb = Oc.clubs[p.n]; if (mlv(S) < 15) err('Vereine kaufen kannst du ab Manager-Level 15.');
        if (!cb) { if (Object.keys(Oc.clubs).length >= OWNMAX) err('Mehr als ' + OWNMAX + ' fremde Vereine sind nicht erlaubt.'); var mk = ownMarket(S, D).filter(function (x) { return x.n === p.n; })[0] || ((Oc.open || {})[p.n] ? ownAll(S, D).filter(function (x) { return x.n === p.n; })[0] : null); if (!mk) err('Dieser Verein verkauft gerade keine Anteile – frag erst an.'); cb = { l: mk.l, pct: 0, price: 0, val: mk.val, since: S.date, form: 0, paid: 0, hist: [[S.date.slice(0, 7), mk.val]], sup: 0 }; }
        if (cb.pct >= 100) err('Der Verein gehört dir schon ganz.'); var tp = ownTr(cb), Pc = privInit(S); if (Pc.cash < tp) err('Dafür fehlen ' + euro(tp - Pc.cash) + ' Privatvermögen.');
        Pc.cash -= tp; Pc.log.unshift([S.date, 'Anteile ' + p.n, -tp]); var first = !Oc.clubs[p.n]; Oc.clubs[p.n] = cb; cb.pct += 10; cb.price += tp; if (Oc.open) delete Oc.open[p.n]; Oc.log.unshift([S.date, p.n + ': Anteile auf ' + cb.pct + ' % (' + euro(tp) + ')']); xp(S, first ? 15 : 5);
        info = '🏢 Dir gehören jetzt ' + cb.pct + ' % von ' + p.n + '.'; reveal = { n: p.n, pct: cb.pct, paid: tp, total: cb.price, val: cb.val, my: Math.round(cb.val * cb.pct / 100), incM: nice(cb.val * cb.pct / 100 * 0.007), ln: dOf(S, D).lv[cb.l] ? ligaName(dOf(S, D).lv[cb.l].name) : '', first: first, up: ownChance(cb).up, dn: ownChance(cb).dn }; break; }
      case 'clubAsk': { var Oa = ownInit(S), w0 = wkNo(S); Oa.asksW = Oa.asksW || {}; if ((Oa.asksW[w0] || 0) >= 3) err('Diese Woche hast du schon 3 Anfragen gestellt.'); var ca = ownAll(S, D).filter(function (x) { return x.n === p.n; })[0]; if (!ca) err('Verein nicht gefunden (nur bis zur Mittelrheinliga, ohne 2. und 3. Mannschaften).'); if (Oa.clubs[ca.n]) err('Daran bist du schon beteiligt.');
        var akc = (Oa.asksW[w0] || 0) + 1; Oa.asksW = {}; Oa.asksW[w0] = akc; var pc = clamp(0.35 + (mlv(S) - 15) * 0.01 + (ca.l >= 9 ? 0.15 : ca.l <= 6 ? -0.12 : 0) + (S.fame || 0) * 0.002, 0.12, 0.8);
        if (R() < pc) { Oa.open = Oa.open || {}; Oa.open[ca.n] = S.date; info = '✅ ' + ca.n + ' ist offen für einen Einstieg! Du kannst jetzt erste Anteile kaufen.'; } else info = '❌ ' + ca.n + ' hat abgelehnt – „Wir bleiben unabhängig.“ Versuch es später noch einmal.'; break; }
      case 'clubSupport': { var Ou = ownInit(S), cu = Ou.clubs[p.n]; if (!cu) err('?'); var am = Math.round(+p.amt || 0); if (am < 1000) err('Mindestens 1.000 €.'); var Pu = privInit(S); if (Pu.cash < am) err('Nicht genug Privatvermögen.'); Pu.cash -= am; Pu.log.unshift([S.date, 'Unterstützung ' + p.n, -am]); cu.sup = (cu.sup || 0) + am; var chU = ownChance(cu); info = '💶 ' + euro(am) + ' an ' + p.n + ' – Aufstiegschance jetzt ' + chU.up + ' %, Abstiegsrisiko ' + chU.dn + ' %.'; break; }
      case 'clubSell': { var Os = ownInit(S), cs = Os.clubs[p.n]; if (!cs) err('?'); if (cs.pct == null) cs.pct = 100; var sv = nice(cs.val * cs.pct / 100 * 0.9), gn = sv - cs.price; privInit(S).cash += sv; privInit(S).log.unshift([S.date, 'Verkauf ' + p.n, sv]); delete Os.clubs[p.n]; Os.log.unshift([S.date, p.n + ' verkauft (' + euro(sv) + ', ' + (gn >= 0 ? 'Gewinn ' : 'Verlust ') + euro(Math.abs(gn)) + ')']); info = p.n + ' verkauft für ' + euro(sv) + ' – ' + (gn >= 0 ? 'Gewinn ' : 'Verlust ') + euro(Math.abs(gn)) + ' (+ ' + euro(cs.paid || 0) + ' Einnahmen bisher).'; break; }
      case 'kitSet': { // Trikot-Designer (Unser Club): je Trikot Oberteil, Hose, Stutzen + Logo-Darstellung – wird automatisch gespeichert
        var kd = p.d || {}, okc = function (c, d) { return /^#[0-9a-fA-F]{6}$/.test(c || '') ? c : d; }, lm = function (v) { return ['orig', 'black', 'white', 'acc', 'wb', 'bw', 'wm'].indexOf(v) >= 0 ? v : 'orig'; }, kout = {};
        ['home', 'away', 'gk'].forEach(function (k) { var x = kd[k] || {}, sh = x.sh || {}, ho = x.ho || {}, so = x.so || {};
          kout[k] = { sh: { ds: clamp(+sh.ds || 0, 0, 11), a: okc(sh.a, '#4f8f2a'), b: okc(sh.b, '#ffffff'), sl: okc(sh.sl, okc(sh.a, '#4f8f2a')), kr: clamp(+sh.kr || 0, 0, 2) }, ho: { ds: clamp(+ho.ds || 0, 0, 3), a: okc(ho.a, '#ffffff'), b: okc(ho.b, '#4f8f2a') }, so: { ds: clamp(+so.ds || 0, 0, 3), a: okc(so.a, '#4f8f2a'), b: okc(so.b, '#ffffff') }, lsp: lm(x.lsp), lout: lm(x.lout), sm: ['both', 'logo', 'text'].indexOf(x.sm) >= 0 ? x.sm : 'both', s2: !!x.s2 }; });
        S.kitD = kout; info = ''; break; }
      case 'ytCoach': { if (!S.built[p.k]) err('Dieses Jugendteam gibt es noch nicht.'); var Tc = ytInit(S, p.k, D), ytl = +p.lv; if (!YTC[ytl]) err('?'); Tc.coach = ytl; info = ytl ? YTC[ytl][1] + ' für die ' + YTN[p.k] + ' eingestellt (' + euro(YTC[ytl][2]) + '/Monat).' : 'Jugendtrainer der ' + YTN[p.k] + ' entlassen.'; break; }
      case 'ownRepSeen': { if (S.own && S.own.rep) S.own.rep.seen = true; info = ''; break; }
      case 'miniTake': { var Pm = privInit(S), mj = miniWeek(S).filter(function (x) { return x[0] === p.k; })[0]; if (!mj) err('Dieser Minijob ist diese Woche nicht mehr frei.'); if (miniBlock(S)) err(miniBlock(S)); if (Pm.mini) err('Du hast schon einen Minijob – erst kündigen.'); Pm.mini = { k: mj[0], n: mj[1], sal: mj[2], since: S.date }; info = 'Minijob angetreten: ' + mj[1] + ' (' + euro(mj[2]) + '/Monat).'; break; }
      case 'miniQuit': { var Pq = privInit(S); if (!Pq.mini) err('Du hast keinen Minijob.'); info = 'Minijob gekündigt: ' + Pq.mini.n + '.'; Pq.mini = null; break; }
      case 'jobQuit': { var J2 = privInit(S).job; if (J2.stage === 'study') { info = (J2.path === 'ausb' ? 'Ausbildung' : 'Studium') + ' abgebrochen. Du kannst dich neu entscheiden.'; J2.stage = 'abi'; J2.path = null; J2.title = null; J2.sal = 0; J2.months = 0; break; } if (J2.stage !== 'job') err('Du hast keinen Job.'); info = 'Du hast als ' + J2.title + ' gekündigt.'; J2.stage = 'done'; J2.title = null; J2.sal = 0; J2.step = Math.max(0, (J2.step || 0) - 1); break; }
      case 'stockBuy': case 'stockSell': {
        var P5 = privInit(S); var sym = p.sym; var px = P5.inv.prices[sym]; if (!px) err('Unbekannt.'); var qn = +p.qty || 0; if (qn <= 0) err('Menge eingeben.');
        P5.inv.cost = P5.inv.cost || {}; P5.inv.alert = P5.inv.alert || {};
        if (a === 'stockBuy') { var cost2 = Math.round(px * qn * 100) / 100 + 5; if (P5.cash < cost2) err('Nicht genug Geld (inkl. 5 € Gebühr).'); P5.cash -= cost2; P5.inv.stocks[sym] = (P5.inv.stocks[sym] || 0) + qn; P5.inv.cost[sym] = Math.round(((P5.inv.cost[sym] || 0) + px * qn) * 100) / 100; P5.inv.alert[sym] = 0; P5.log.unshift([S.date, 'Kauf ' + qn + '× ' + sym, -Math.round(cost2)]); info = qn + '× ' + sym + ' gekauft.'; }
        else { var have = P5.inv.stocks[sym] || 0; if (have < qn) err('So viele hast du nicht.'); var gross = Math.round(px * qn * 100) / 100, got = gross - 5, basis = have ? Math.round((P5.inv.cost[sym] || px * have) * qn / have * 100) / 100 : 0; P5.cash += got; P5.inv.stocks[sym] = have - qn; P5.inv.cost[sym] = Math.max(0, Math.round(((P5.inv.cost[sym] || 0) - basis) * 100) / 100); if (!P5.inv.stocks[sym]) { delete P5.inv.stocks[sym]; delete P5.inv.cost[sym]; delete P5.inv.alert[sym]; } P5.log.unshift([S.date, 'Verkauf ' + qn + '× ' + sym, Math.round(got)]); var isC = CRYPTO.some(function (c) { return c[0] === sym; }); S.sellPop = { sym: sym, qty: qn, crypto: isC, basis: basis, gross: gross, fee: 5, net: got, pct: basis ? Math.round((got - basis) / basis * 1000) / 10 : 0 }; info = qn + '× ' + sym + ' verkauft (' + euro(got) + ').'; }
        break;
      }
      case 'deposit': {
        var P7 = privInit(S); var dt = DEPOS[p.t]; if (!dt) err('Anlage wählen.'); var am = Math.round(+p.amount || 0); if (am < 100) err('Mindestens 100 €.'); if (P7.cash < am) err('Nicht genug Geld.');
        P7.cash -= am; P7.inv.dep.push({ t: p.t, amount: am, inv0: am, cur: am, hist: [am], start: S.date, end: dt[1] ? addDays(S.date, Math.round(dt[1] * 30.4)) : null }); P7.log.unshift([S.date, dt[0], -am]); info = euro(am) + ' angelegt: ' + dt[0] + '.'; break;
      }
      case 'withdraw': { var P8 = privInit(S); var dd = P8.inv.dep[+p.i]; if (!dd || dd.t !== 'tagesgeld') err('Nur Tagesgeld ist jederzeit verfügbar.'); P8.cash += dd.amount; P8.log.unshift([S.date, 'Tagesgeld ausgezahlt', dd.amount]); P8.inv.dep.splice(+p.i, 1); info = 'Tagesgeld ausgezahlt.'; break; }
      case 'uploadPic': { S.pic = String(p.pic || '').slice(0, 60000); break; }
      case 'mgrAsk': {
        mgrInit(S, D); if (mgrMonthsLeft(S) > 12) err('Verlängern kannst du ab einem Jahr Restlaufzeit.');
        var cc = mgrCan(S, D); if (!cc.ok) err(cc.why);
        S.mc.offer = S.mc.offer || mgrOffer(S, D); info = 'Angebot des Vorstands: ' + euro(S.mc.offer.sal) + '/Monat bis 06/' + S.mc.offer.until + '.'; break;
      }
      case 'mgrAccept': { if (!S.mc || !S.mc.offer) err('Kein Angebot.'); S.mc.sal = S.mc.offer.sal; S.mc.until = S.mc.offer.until; S.mc.offer = null; S.pressPending = 'verl'; xp(S, 10); info = 'Vertrag verlängert bis 06/' + S.mc.until + ' (' + euro(S.mc.sal) + '/Monat).'; break; }
      case 'privBuy': {
        mgrInit(S, D); var si = shopItem(p.id, S); if (!si) err('Unbekannt.');
        if (si.rent) { if (S.priv.rent === si.id) err('Wohnst du schon.'); if (S.priv.rent && !S.priv.rentEnd) err('Erst die alte Wohnung kündigen (3 Monate Frist).'); if (S.priv.cash < si.rent) err('Für die erste Miete fehlt Geld.'); S.priv.cash -= si.rent; S.priv.rent = si.id; S.priv.log.unshift([S.date, 'Miete ' + si.n, -si.rent]); info = 'Du wohnst jetzt: ' + si.n + '.'; break; }
        if (S.priv.cash < si.price) err('Dein privates Vermögen reicht nicht (' + euro(S.priv.cash) + ').');
        S.priv.cash -= si.price; S.priv.owned[si.id] = (S.priv.owned[si.id] || 0) + 1; S.priv.log.unshift([S.date, si.n, -si.price]);
        if (si.cat === 'Wohnen' && S.priv.rent && !S.priv.rentEnd) { S.priv.rentEnd = addDays(S.date, 90).slice(0, 8) + '01'; }
        var sr = Math.min(3, Math.max(0.2, Math.log(Math.max(1, si.price) / 500) / Math.log(10) * 1.2)); S.shopRep = Math.min(8, (S.shopRep || 0) + sr); var sfx = ['Ansehen +' + String(Math.round(sr * 10) / 10).replace('.', ',')];
        if (si.price >= 20000) { S.follow = (S.follow || 0) + rint(10, 60); sfx.push('neue Follower'); } if (si.price >= 5000) { S.board = clamp(S.board + (si.cat === 'Autos' ? -1 : 1), 0, 100); sfx.push(si.cat === 'Autos' ? 'Vorstand findet das protzig (−1)' : 'Vorstand +1'); } if (si.cat === 'Wohnen') { S.moral = clamp(S.moral + 2, 0, 100); sfx.push('Moral +2'); }
        info = 'Gekauft: ' + si.n + '! ' + sfx.join(' · '); break;
      }
      case 'privSell': {
        mgrInit(S, D); var sx = shopItem(p.id, S); if (!sx || !S.priv.owned[sx.id]) err('Nicht in deinem Besitz.');
        var back = Math.round(sx.price * (sx.cat === 'Wohnen' ? 0.95 : sx.cat === 'Fahrzeuge' ? 0.7 : 0.3)); S.priv.owned[sx.id]--; if (!S.priv.owned[sx.id]) delete S.priv.owned[sx.id]; S.priv.cash += back; S.priv.log.unshift([S.date, 'Verkauf ' + sx.n, back]); info = sx.n + ' für ' + euro(back) + ' verkauft.'; break;
      }
      case 'privMoveOut': { mgrInit(S, D); if (!S.priv.rent) err('Kein Mietvertrag.'); if (S.priv.rentEnd) err('Schon gekündigt – Auszug am ' + fmtD(S.priv.rentEnd) + '.'); var re = addDays(S.date, 90); S.priv.rentEnd = re.slice(0, 8) + '01'; info = 'Gekündigt mit 3 Monaten Frist – Auszug am ' + fmtD(S.priv.rentEnd) + '.'; break; }
      case 'ackSeason': { if (S.seasonRep) S.seasonRep.ack = true; break; }
      case 'dayEvDel': { S.dayEv = S.dayEv || []; var dx = S.dayEv.filter(function (x) { return x.d === p.d && !x.done; })[0]; if (!dx) { var tx = (S.tests || []).filter(function (t) { return t.d === p.d && !t.done; })[0]; if (!tx) err('Kein löschbarer Termin.'); if (tx.d <= S.date) err('Zu spät zum Absagen.'); S.tests = S.tests.filter(function (t) { return t !== tx; }); info = 'Testspiel am ' + fmtD(p.d) + ' abgesagt.'; break; } if (dx.d <= S.date) err('Zu spät zum Absagen.'); if (dx.k === 'benefiz') S.tests = (S.tests || []).filter(function (t) { return !(t.benefiz && t.d === dx.d); }); var refund = dayEvCost(S, D, dx.k); if (dx.k === 'benefiz') refund = Math.round(refund * 0.8); book(S, dx.name + ' (Storno)', refund); S.dayEv = S.dayEv.filter(function (x) { return x !== dx; }); if ((dx.k === 'camp3' || dx.k === 'camp5') && S.camp && S.camp.from === dx.d) S.camp = null; info = dx.name + ' am ' + fmtD(dx.d) + ' gelöscht – ' + euro(refund) + ' zurück.'; break; }
      case 'mascBuy': { need(S, 'maskottchen'); if (S.masc === p.k) err('Das ist schon euer Maskottchen.'); if (S.masc && S.mascSeason === S.season) err('Ein neues Maskottchen könnt ihr erst nächste Saison wählen.'); S.mascSeason = S.season; S.mascBond = S.mascBond || {}; var mm = MASC.filter(function (x) { return x[0] === p.k; })[0]; if (!mm) err('?'); S.masc = mm[0]; if (mm[6].fansG) S.fans = clamp(S.fans + 3, 0, 100); if (mm[6].spons) S.spons = clamp(S.spons + mm[6].spons, 0, 100); xp(S, 10); ownPost(S, mm[2] + ' Darf ich vorstellen: unser neues Maskottchen, der ' + mm[1] + '! 💚❤️', 'fans'); info = mm[2] + ' Der ' + mm[1] + ' ist euer neues Maskottchen – ' + mm[5] + '.'; msg(S, 'verein', info); break; }
      case 'course': { need(S, 'lehrgang'); var CC = COURSES.filter(function (x) { return x[0] === p.k; })[0]; if (!CC) err('?'); S.courses = S.courses || []; if (S.courses.indexOf(CC[0]) >= 0) err('Schon abgeschlossen.'); if (S.courseRun) err('Du bist schon in einem Lehrgang.'); if (CC[5] && S.courses.indexOf(CC[5]) < 0) err('Voraussetzung fehlt: ' + COURSES.filter(function (x) { return x[0] === CC[5]; })[0][1] + '.'); var PV = privInit(S); if (PV.cash < CC[3]) err('Nicht genug Privatvermögen (' + euro(CC[3]) + ').'); PV.cash -= CC[3]; PV.log.unshift([S.date, 'Lehrgang ' + CC[1], -CC[3]]); S.courseSpent = (S.courseSpent || 0) + CC[3]; S.courseRun = { k: CC[0], until: addDays(S.date, CC[4]) }; xp(S, 3); info = 'Angemeldet: ' + CC[1] + ' (' + CC[2] + ') – Abschluss am ' + fmtD(S.courseRun.until) + '.'; break; }
      case 'scoutTool': { need(S, 'scouting'); S.scout = S.scout || { tools: {}, pool: [], n: 0, season: S.season }; var stt = SCOUTT.filter(function (x) { return x[0] === p.k; })[0]; if (!stt) err('?'); if (S.scout.tools[stt[0]]) { delete S.scout.tools[stt[0]]; info = stt[1] + ' gekündigt.'; } else { var lk0 = scLock(S, stt); if (lk0) err(stt[1] + ': ' + lk0 + '.'); if (S.cash < stt[2]) err('Nicht genug Bargeld.'); book(S, 'Scouting ' + stt[1], -stt[2]); S.scout.tools[stt[0]] = S.date; S.scout.score = Math.min(100, (S.scout.score || 0) + 8); if (!S.scout.pool.length) scoutGen(S, D); info = stt[1] + ' gebucht (' + euro(stt[2]) + '/Monat).'; } break; }
      case 'scoutSign': { need(S, 'scouting'); var SCx = S.scout; if (!SCx) err('?'); if (SCx.season !== S.season) { SCx.season = S.season; SCx.n = 0; } var lim = scLimit(S); if (SCx.n >= lim) err('Diese Saison sind keine Scouting-Plätze mehr frei (' + lim + ' bei deinen Tools).'); var sy = SCx.pool[+p.i]; if (!sy) err('?'); SCx.pool.splice(+p.i, 1); SCx.n++; S.youth.push(sy); xp(S, 3); info = sy.n + ' (' + sy.dp + ', ' + sy.age + ' J.) kommt in die Academy (' + SCx.n + '/' + lim + ' diese Saison).'; msg(S, 'jugend', '🔭 ' + info); break; }
      case 'youthTrain': { var yt = S.youth.filter(function (x) { return x.id === +p.yid; })[0]; if (!yt) err('?'); var ywk = wkStart(S); if (S.ytrM === ywk) err('Diese Woche hat schon ein Talent bei der Ersten mittrainiert.'); S.ytrM = ywk; S.ytrLast = S.date; S.ytr = S.ytr && S.ytr.season === S.season ? S.ytr : { season: S.season, n: 0 }; S.ytr.n++; var yg = Math.round(rnd(0.05, 0.15) * 100) / 100; yt.str += yg; xp(S, 1); info = yt.n + ' trainiert diese Woche bei der Ersten mit: Stärke +' + String(yg).replace('.', ',') + '.'; break; }
      case 'pvPick': { need(S, 'partner'); var PVp = S.pv; if (!PVp || PVp.to < S.season) err('Kein Partnerverein.'); var pr = (S.pvProp || [])[+p.i]; if (!pr || pr.taken) err('?'); var used2 = (S.pvTaken && S.pvTaken.season === S.season) ? S.pvTaken.n : 0; if (used2 >= PVp.loans) err('Diese Saison sind schon ' + PVp.loans + ' Leihspieler vereinbart.'); S.pvTaken = { season: S.season, n: used2 + 1 }; pr.taken = true; var lp = JSON.parse(JSON.stringify(pr.p)); lp.id = S.nextPid++; if (inWindow(S.date)) { S.players.push(lp); info = lp.n + ' ist ab sofort im Kader (Leihe bis Saisonende).'; } else { (S.pvPend = S.pvPend || []).push(lp); info = lp.n + ' ist vereinbart und kommt, sobald das Transferfenster öffnet (' + fmtD(nextWindow(S.date)) + ').'; } msg(S, 'transfer', '🤝 ' + info); break; }
      case 'pvTest': { need(S, 'partner'); var PVt = S.pv; if (!PVt || PVt.to < S.season) err('Kein Partnerverein.'); if (S.pvTest === S.season) err('Das Testspiel gegen den Partnerverein gibt es einmal pro Saison.'); var td = String(p.d || ''); if (!(td > S.date)) err('Bitte einen Tag in der Zukunft.'); var pw1 = prepWin(S, D, 'summer'), pw2 = prepWin(S, D, 'winter'); if (!((td >= pw1[0] && td <= pw1[1]) || (td >= pw2[0] && td <= pw2[1]))) err('Nur in der Sommer- oder Wintervorbereitung (vor dem ersten Pflichtspiel).'); if (svwGames(S, D).some(function (g) { return Math.abs(diffDays(g.d, td)) <= 1; })) err('Zu nah an einem anderen Spiel.'); var plv = PVt.lvl || Math.max(1, S.lvl - 2); var pmid = lvMid(D, plv); S.tests.push({ d: td, opp: { n: PVt.club, s: Math.round(pmid * 10) / 10, l: plv }, home: !!p.home, pv: true }); S.pvTest = S.season; info = 'Testspiel gegen ' + PVt.club + ' am ' + fmtD(td) + ' (' + (p.home ? 'Heimspiel' : 'Auswärts') + ') vereinbart.'; msg(S, 'test', '🤝 ' + info); break; }
      case 'liveRedMove': { // Positionswechsel nach Roter Karte: ein Spieler rückt in die Lücke, die Lücke wandert auf seine Position
        var Lr = S.live; if (!Lr || Lr.done) err('Kein laufendes Spiel.'); var fs = +p.slot, ti = Lr.on.indexOf(+p.pid); if (Lr.on[fs] !== null || Lr.on[fs] === undefined) err('Diese Position ist besetzt.'); if (ti < 0) err('Spieler ist nicht auf dem Platz.');
        Lr.on[fs] = Lr.on[ti]; Lr.on[ti] = null; Lr.redP = Lr.redP || {}; if (Lr.redP[fs] != null) { Lr.redP[ti] = Lr.redP[fs]; delete Lr.redP[fs]; } Lr.red = Lr.red.map(function (x) { return x === fs ? ti : x; }); (Lr.injOut || []).forEach(function (x, k) { if (x === fs) Lr.injOut[k] = ti; });
        if (Lr.pause && Lr.pause.type === 'red') Lr.pause = null; var mvp = S.players.filter(function (q) { return q.id === +p.pid; })[0]; liveEv(Lr, 'play', (mvp ? mvp.n : 'Ein Spieler') + ' rückt auf die Position ' + FORMS[S.lineup.form][fs] + '.'); info = 'Umgestellt.'; break;
      }
      case 'dayEvent': {
        var dk = p.k; if (!DAYEV[dk]) err('Unbekannte Aktion.'); var dd = String(p.d || '');
        if (!(dd > S.date)) err('Nur für zukünftige Tage.');
        var de = DAYEV[dk]; if (de[3] && de[3].indexOf(mon(dd)) < 0) err(de[0] + ' geht nur in bestimmten Monaten.');
        if (!de[5] && svwGames(S, D).some(function (g) { return g.d === dd; })) err('An diesem Tag ist ein Spiel.');
        if (dk === 'benefiz' && (svwGames(S, D).some(function (g) { return g.d === dd; }) || (S.tests || []).some(function (t) { return t.d === dd; }))) err('An diesem Tag ist schon ein Spiel – pro Tag ist nur ein Spiel möglich.');
        S.dayEv = S.dayEv || []; if (S.dayEv.some(function (x) { return x.d === dd && !x.done; })) err('An diesem Tag ist schon etwas geplant.');
        var cnt = S.dayEv.filter(function (x) { return x.k === dk && x.season === S.season; }).length; if (cnt >= de[4]) err(de[0] + ' gibt es höchstens ' + de[4] + '× pro Saison.');
        if ((dk === 'camp3' || dk === 'camp5') && S.camp) err('Es ist schon ein Trainingslager gebucht.');
        var cost = dayEvCost(S, D, dk); if (S.cash < cost) err('Nicht genug Bargeld (' + euro(cost) + ').');
        book(S, de[0], -cost); var dev2 = { d: dd, k: dk, season: S.season, done: false, name: de[0] }; S.dayEv.push(dev2);
        info = de[0] + ' am ' + fmtD(dd) + ' geplant (' + euro(cost) + ').';
        if (dk === 'benefiz') { var br = R(), btier = br < 0.6 ? 3 : br < 0.88 ? 2 : 1, bopp = benPick(S, btier); dev2.opp = bopp; dev2.tier = btier; dev2.name = 'Benefizspiel vs. ' + bopp; S.tests.push({ d: dd, opp: { n: bopp, s: Math.round(lvMid(D, btier) * 10) / 10, l: btier }, home: true, benefiz: { tier: btier } }); reveal = { opp: bopp, tier: btier, liga: ['', 'Bundesliga', '2. Bundesliga', '3. Liga'][btier] }; info = 'Benefizspiel am ' + fmtD(dd) + ': ' + bopp + ' (' + reveal.liga + ') kommt ins Ländchen!'; }
        break;
      }
      default: err('Unbekannte Aktion: ' + a);
    }
    markNew(S);
    var up = levelUp(S);
    return { info: info, reports: S.reports, levelUp: up, reveal: reveal };
  }
  // ============================================================ Seeded-Simulation (andere Ligen, Statistiken)
  function srng(seed) { var x = (seed >>> 0) || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function hashS(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function sPois(l, r) { l = clamp(l, 0.05, 8); var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }
  // ============================================================ Fähigkeitsbaum (Manager Coins) – 6 Rubriken × 25 Stufen, fest nacheinander, pro Spielstand
  var SKTREE = [
    ['tk', 'Taktik & Spiel', '🧠', [['str', 0.15], ['att', 0.02], ['def', 0.02], ['late', 0.016]], ['str', 0.55], 'Meistertaktiker', 'Einmal pro Saison wird eine 1-Tor-Niederlage in der Liga noch zum Unentschieden.', ['Spielidee', 'Pressingfalle', 'Kompakte Kette', 'Joker von der Bank', 'Matchplan', 'Umschaltspiel', 'Standardvarianten', 'Gegneranalyse', 'Raumdeckung', 'Ballbesitz', 'Konterfalle', 'Taktiktafel']],
    ['tr', 'Training & Jugend', '🏃', [['dev', 4], ['inj', -4], ['rec', 0.6], ['ydev', 5]], ['dev', 6], 'Wunderkind', 'Jede Saison kommt ein 5-Sterne-Talent in deine Academy.', ['Trainingsplan', 'Athletikcoach', 'Physio-Routine', 'Jugendförderung', 'Videoanalyse', 'Leistungsdiagnostik', 'Regeneration', 'Talentsichtung', 'Krafttraining', 'Ernährungsplan', 'Mentaltraining', 'Nachwuchskonzept']],
    ['tf', 'Transfers & Scouting', '🔁', [['fee', 0.02], ['sal', 0.02], ['sell', 0.03], ['scout', 1]], ['fee', 0.04], 'Transfercoup', 'Einmal pro Saison zahlst du für einen Neuzugang keine Ablöse.', ['Verhandlungsgeschick', 'Scoutnetzwerk', 'Beraterkontakte', 'Gehaltsstruktur', 'Marktkenntnis', 'Schnäppchenjäger', 'Videoscouting', 'Ablösepoker', 'Datenanalyse', 'Ausstiegsklausel', 'Vertragskunst', 'Transferfenster']],
    ['sp', 'Sponsoren & Finanzen', '💼', [['spons', 3], ['prize', 0.03], ['build', 0.03], ['merch', 0.03]], ['spons', 6], 'Mäzen', 'Jeden Monat überweist ein Gönner dem Verein Extra-Geld.', ['Netzwerken', 'Sponsorenpflege', 'Businessclub', 'Finanzplanung', 'Bauherrenwissen', 'Merch-Strategie', 'Werbepartner', 'Prämienverhandlung', 'Kostenkontrolle', 'Markenaufbau', 'Investorenpitch', 'Bilanzprofi']],
    ['fm', 'Fans & Medien', '📣', [['zus', 3], ['ticket', 3], ['fol', 0.04], ['food', 3]], ['fol', 0.08], 'Ausverkauft', 'Ligaheimspiele sind immer mindestens zu 80 % ausgelastet.', ['Fannähe', 'Social Media', 'Stadionerlebnis', 'Pressearbeit', 'Fanclub-Pflege', 'Ticketing', 'Catering-Konzept', 'Influencer', 'Choreo-Support', 'Stadionsprecher', 'Fanfest', 'Kultstatus']],
    ['mg', 'Manager', '🎩', [['xp', 0.03], ['priv', 0.06], ['coinS', 0.4], ['jk', 0.4]], ['xp', 0.05], 'Legende', 'Jeden Monat bekommst du einen Joker geschenkt.', ['Ehrgeiz', 'Selbstvermarktung', 'Karriereplan', 'Glückshand', 'Führungsstil', 'Medienprofi', 'Gehaltsverhandlung', 'Visionär', 'Ruhe bewahren', 'Ausstrahlung', 'Erfahrung', 'Charisma']]
  ];
  var SKN = { str: 'Teamstärke', att: 'Torgefahr', def: 'Abwehr', late: 'Schlussphase', dev: 'Spielerentwicklung', inj: 'Verletzungsrisiko', rec: 'Regeneration', ydev: 'Jugendentwicklung', fee: 'Ablösen', sal: 'Gehälter', sell: 'Verkaufserlöse', scout: 'Scouting', spons: 'Sponsorengeld', prize: 'Prämien & TV-Geld', build: 'Baukosten', merch: 'Merchandise', zus: 'Zuschauer', ticket: 'Ticketeinnahmen', fol: 'Follower', food: 'Catering', xp: 'Manager-XP', priv: 'Privatgehalt', coinS: 'Coins zum Saisonende', jk: 'Joker zum Saisonstart' };
  function skStepFx(T, i) { if (i === 24) return [T[0] + 'M', 1]; if ((i + 1) % 5 === 0) return T[4]; return T[3][i % 4]; }
  function mlv(S) { return S._dev ? 999 : (S.mlvl || 1); } // Entwicklermodus: alle Level-Sperren aufgehoben
  function skStepLvl(i) { return 1 + Math.floor(i * 14 / 24); }
  function skStepCost(i) { return i < 8 ? 1 : i < 16 ? 2 : i < 22 ? 3 : 5; }
  function skFxTxt(k, v) { if (/M$/.test(k)) return 'Meisterfähigkeit'; var pc = ['att', 'def', 'late', 'fee', 'sal', 'sell', 'prize', 'build', 'merch', 'fol', 'xp', 'priv'].indexOf(k) >= 0; var neg = k === 'fee' || k === 'sal' || k === 'build' || k === 'inj';
    if (k === 'str') return '+' + String(v).replace('.', ',') + ' ' + SKN[k]; if (k === 'rec') return '+' + String(v).replace('.', ',') + ' ' + SKN[k]; if (k === 'scout') return 'schnellerer Scout'; if (k === 'coinS' || k === 'jk') return '+' + String(v).replace('.', ',') + ' ' + SKN[k];
    var n = pc ? Math.round(v * 1000) / 10 : Math.abs(v); return (neg ? '−' : '+') + String(Math.abs(n)).replace('.', ',') + ' % ' + SKN[k]; }
  var SKC = { sig: null, v: {} };
  function skv(S, k) { var t = (S && S.skt) || null; if (!t) return 0; var sig = SKTREE.map(function (T) { return t[T[0]] || 0; }).join(','); if (SKC.sig !== sig) { var v = {}; SKTREE.forEach(function (T) { for (var i = 0; i < (t[T[0]] || 0); i++) { var f = skStepFx(T, i); v[f[0]] = (v[f[0]] || 0) + f[1]; } }); SKC = { sig: sig, v: v }; } return (SKC.v[k] || 0) * (S.skGod ? 1.1 : 1) + (S.skGod && k === 'str' ? 0.5 : 0); }
  var SKGOD = 10; // God Mode: letzte Fähigkeit in der Mitte des Baums
  function skCoin(S, n, why) { if (!n) return; S.skc = (S.skc || 0) + n; S.skcLog = S.skcLog || []; S.skcLog.unshift([S.date, why, n]); if (S.skcLog.length > 30) S.skcLog.length = 30; }
  function skView(S) {
    var t = S.skt || {}, ml = mlv(S), spent = 0, tot = 0;
    var trees = SKTREE.map(function (T) { var n = t[T[0]] || 0, steps = []; for (var i = 0; i < 25; i++) { var f = skStepFx(T, i), c = skStepCost(i); tot += c; if (i < n) spent += c; steps.push({ i: i, n: i === 24 ? T[5] : T[7][i % T[7].length] + ' ' + ['I', 'II', 'III'][Math.floor(i / T[7].length)], fx: i === 24 ? T[6] : skFxTxt(f[0], f[1]), c: c, lvl: skStepLvl(i), ms: (i + 1) % 5 === 0, st: i < n ? 'on' : i === n ? (ml < skStepLvl(i) ? 'lvl' : (S.skc || 0) < c ? 'coin' : 'next') : 'off' }); }
      var sum = {}; for (var j = 0; j < n; j++) { var g = skStepFx(T, j); if (j < 24) sum[g[0]] = (sum[g[0]] || 0) + g[1]; } return { k: T[0], n: T[1], ic: T[2], lv: n, steps: steps, sum: Object.keys(sum).map(function (k) { return skFxTxt(k, Math.round(sum[k] * 1000) / 1000); }), master: n >= 25 ? T[5] : null }; });
    return { coins: S.skc || 0, trees: trees, spent: spent, tot: tot, log: (S.skcLog || []).slice(0, 12), god: { on: !!S.skGod, cost: SKGOD, can: SKTREE.every(function (T) { return (t[T[0]] || 0) >= 25; }), fx: 'Alle Fähigkeiten wirken 10 % stärker, Teamstärke +0,5' } };
  }
  // ============================================================ Spielerwerte (1–100): Fähigkeiten, Erfahrung, Regeneration, Verletzungsanfälligkeit, Persönlichkeit
  // Die Werte ergeben sich fest aus Name, Position und Stärke – ihr gewichteter Schnitt ist immer die Stärke. Training verschiebt sie (p.skd).
  var SKL = [['tem', 'Tempo', 'phy'], ['aus', 'Ausdauer', 'phy'], ['zwk', 'Zweikampf', 'def'], ['gra', 'Grätsche', 'def'], ['stl', 'Stellungsspiel', 'def'], ['kop', 'Kopfball', 'def'], ['pas', 'Passspiel', 'mid'], ['tec', 'Technik', 'mid'], ['fla', 'Flanken', 'mid'], ['sch', 'Schuss', 'off'], ['ref', 'Reflexe', 'tw'], ['fan', 'Fangsicherheit', 'tw'], ['ant', 'Antritt', 'phy'], ['tst', 'Stellungsspiel', 'tw'], ['abs', 'Abschlag', 'tw'], ['lin', 'Auf der Linie', 'tw'], ['phs', 'Physis', 'phy'], ['spo', 'Spieleröffnung', 'def'], ['dis', 'Distanzschüsse', 'mid'], ['kre', 'Kreativität', 'mid'], ['lfw', 'Laufwege', 'off'], ['dri', 'Dribbling', 'off'], ['elf', 'Elfmeter', 'off']];
  var SKW = { // Gewicht je Position: tem aus zwk gra stl kop pas tec fla sch ref fan ant tst abs lin phs spo dis kre lfw dri elf
    TW: [.5, .5, .1, .1, .5, .3, .5, .2, .05, .05, 4, 3, .3, 3, 1.5, 2.5, .5, .4, .02, .02, .02, .02, .05], IV: [1, 1, 3, 2.5, 2.5, 2.5, 1, .5, .2, .2, 0, 0, .8, 0, 0, 0, 2, 1.5, .3, .2, .3, .2, .2], RV: [2.5, 2, 2, 1.5, 1.5, .6, 1, .8, 2, .3, 0, 0, 2, 0, 0, 0, 1.5, 1, .4, .5, .6, 1, .2],
    DM: [.8, 2, 2.5, 2, 2, 1, 2.5, 1, .3, .5, 0, 0, .8, 0, 0, 0, 1.5, 2.5, .8, .8, .5, .5, .3], ZM: [1, 2, 1.2, .6, 1.2, .5, 3, 2.5, .6, 1, 0, 0, 1, 0, 0, 0, 1, 1.5, 1.5, 2, 1, 1, .5], OM: [1.5, 1, .5, .2, .8, .4, 3, 3, 1, 2, 0, 0, 1.5, 0, 0, 0, .6, .6, 2, 3, 1.5, 2, 1],
    RM: [2.5, 2, .8, .4, .7, .4, 1.5, 2, 3, 1, 0, 0, 2, 0, 0, 0, .8, .5, 1, 1.5, 1.5, 2.5, .5], RA: [3, 1.2, .3, .1, .8, .5, 1.2, 2.5, 2, 2, 0, 0, 2.5, 0, 0, 0, .8, .3, 1.5, 1.5, 2, 3, .8], ST: [2, 1, 1, .1, 2, 2.5, .8, 1.5, .2, 3.5, 0, 0, 2, 0, 0, 0, 2, .2, 1.5, .8, 3, 1.5, 2] };
  var SKWM = { LV: 'RV', LM: 'RM', LA: 'RA' };
  var SKPERS = [['Führungsspieler', 'Hebt die Stimmung im Team, wenn er regelmäßig spielt'], ['Ehrgeizig', 'Entwickelt sich etwas schneller'], ['Teamplayer', 'Legt öfter Tore auf'], ['Profi', 'Regeneriert schneller'], ['Launisch', 'Seine Form schwankt stärker'], ['Ruhig', 'Sieht seltener Karten'], ['Lebemann', 'Regeneriert etwas langsamer'], ['Kämpfer', 'Ermüdet im Spiel weniger']];
  var IPN = ['gering', 'normal', 'hoch'];
  // Stationen + frühere Saisons: einmal (deterministisch) simuliert, danach mit echten Wechseln fortgeschrieben
  function carEnsure(S, D) {
    var names = []; try { Object.keys(S.world.lv).forEach(function (l) { S.world.lv[l].forEach(function (t) { if (t.n !== S.club && !/ (II|III|IV)$/.test(t.n)) names.push([+l, t.n]); }); }); } catch (e) { }
    S.players.forEach(function (p) {
      if (!p.car) {
        var r = srng(hashS(String(p.n) + '|car')), t = skTraits(p), age = p.age || 22, y0 = S.season - Math.max(0, age - 18), fr = [0.42, 0.05, 0.16, 0.24][t.wv], car = [], hist = [];
        var strAt = function (y) { return Math.max(3, p.str - Math.max(0, S.season - y) * (age - (S.season - y) < 25 ? 1.6 : 0.4)); };
        var clubAt = function (y) { var lv = natLvl(D, strAt(y)), c = names.filter(function (x) { return Math.abs(x[0] - lv) <= 1; }); if (!c.length) c = names; return c.length ? c[Math.floor(r() * c.length)][1] : 'FC Blau-Weiß'; };
        var moves = []; if (!p.youth && !p.self) for (var y = y0 + 1; y <= S.season; y++) if (r() < fr) moves.push(y);
        if (!moves.length) car.push({ c: S.club, y: y0, f: 0, u: 1 });
        else { car.push({ c: clubAt(y0), y: y0, f: 0, u: 1 }); moves.forEach(function (y, i) { var last = i === moves.length - 1, c = last ? S.club : clubAt(y); for (var tz = 0; tz < 6 && c === car[car.length - 1].c; tz++) c = clubAt(y); var a = age - (S.season - y), fe = r() < 0.28 ? 0 : nice(mw({ str: strAt(y), age: a, tal: p.tal || 2 }) * (0.5 + r() * 0.9)); car.push({ c: c, y: y, f: fe }); }); if (car[car.length - 1].c !== S.club) car.push({ c: S.club, y: S.season, f: 0 }); }
        if (p.fee0 != null) { car = car.filter(function (x) { return x.c !== S.club; }); if (!car.length) car.push({ c: clubAt(y0), y: y0, f: 0, u: 1 }); car.push({ c: S.club, y: S.season, f: p.fee0 }); }
        p.car = car;
        if (!p.hist) { for (var k = 3; k >= 1; k--) { var ys = S.season - k; if (age - k < 18) continue; var cl = car.filter(function (x) { return x.y <= ys; }).pop(); var gp = Math.round(6 + r() * 26), at = p.pos === 'ST' ? 0.45 : p.pos === 'MF' ? 0.18 : p.pos === 'AB' ? 0.05 : 0; hist.push({ s: ys, c: cl ? cl.c : S.club, gp: gp, g: Math.round(gp * at * (0.4 + r())), a: Math.round(gp * (at * 0.6 + 0.04) * (0.3 + r())), avg: Math.round((2.4 + r() * 1.5) * 10) / 10, sim: 1 }); } p.hist = hist; }
      } else { var lc = p.car[p.car.length - 1]; if (lc && lc.c !== S.club && !(p.loan && p.loan.to)) p.car.push({ c: S.club, y: S.season, f: p.fee0 || 0 }); }
    });
  }
  function skSeed(p) { return srng(hashS(String(p.n || '') + '|sk')); }
  function skTraits(p) { var r = skSeed(p); for (var i = 0; i < 14; i++) r(); var a = r(), b = r(), c = r(), d = r(); return { ip: a < 0.2 ? 0 : a < 0.92 ? 1 : 2, pers: Math.floor(b * SKPERS.length), wv: c < 0.15 ? 0 : c < 0.3 ? 1 : c < 0.85 ? 2 : 3, ein: d < 0.12 ? 0 : d < 0.27 ? 1 : d < 0.85 ? 2 : 3 }; }
  var WVN = [['Wandervogel', 'Wechselt gern – lässt sich leichter locken, verlängert aber ungern'], ['Vereinstreu', 'Bleibt am liebsten – verlängert günstiger, ist schwer wegzulocken'], ['Neutral', 'Keine besonderen Vorlieben'], ['Will nach oben', 'Kommt gern zu höherklassigen Vereinen, will aus schwächeren weg']];
  var EINN = [['Trainingsweltmeister', 'Entwickelt sich deutlich schneller'], ['Achtet auf seinen Körper', 'Entwickelt sich etwas schneller, ist fitter'], ['Neutral', 'Normale Entwicklung'], ['Trainingsfaul', 'Entwickelt sich langsamer']];
  // Erfahrung ist ligabezogen: nach einem Aufstieg sinkt sie (exAdj), mit Spielen in der neuen Liga kommt sie zurück
  function skExp(p) { return clamp(Math.floor(1 + Math.max(0, (p.age || 25) - 18) / 4.5 + (p.xgp || 0) / 90 + (p.exAdj || 0)), 1, 5); }
  function skRegF(p) { var t = skTraits(p); return clamp(1.15 - Math.max(0, (p.age || 25) - 23) * 0.03, 0.6, 1.15) * (t.pers === 3 ? 1.1 : t.pers === 6 ? 0.9 : 1); }
  function skillsOf(p) {
    var dp = p.dp || p.pos || 'ZM'; if (dp === 'AB') dp = 'IV'; if (dp === 'MF') dp = 'ZM'; var w = SKW[SKWM[dp] || dp] || SKW.ZM, tw = dp === 'TW', r = skSeed(p), d = p.skd || {};
    var mx = Math.max.apply(null, w), raw = SKL.map(function (s, i) { var b = 13 * w[i] / mx - 6.5 + sGauss(r) * 4; var st0 = p.str || 40; if (!tw && s[2] === 'tw') b -= st0 * 0.6; if (tw && s[2] !== 'tw' && s[0] !== 'stl' && s[0] !== 'aus' && s[0] !== 'tem' && s[0] !== 'pas' && s[0] !== 'ant' && s[0] !== 'spo' && s[0] !== 'phs') b -= st0 * 0.3; return b + (d[s[0]] || 0); });
    var sw = 0, sv = 0; raw.forEach(function (b, i) { var wi = w[i] || 0.02; sw += wi; sv += wi * b; }); var c = sv / sw, str = p.str || 1, o = {};
    SKL.forEach(function (s, i) { o[s[0]] = Math.round(clamp(str + raw[i] - c, 1, 100)); }); return o;
  }
  function skInfo(p) { var t = skTraits(p); return { sk: skillsOf(p), ex: skExp(p), rg: Math.round(skRegF(p) / 1.265 * 100), ip: t.ip, pers: t.pers, wv: t.wv, ein: t.ein }; }
  var SKFOC = { aussen: ['fla', 'tem', 'ant'], standards: ['elf', 'dis', 'fla', 'tec'], technik: ['tec', 'pas', 'dri', 'kre'], abschluss: ['sch', 'kop', 'lfw'], abwehr: ['zwk', 'gra', 'stl', 'spo'], torwart: ['ref', 'fan', 'tst', 'abs', 'lin'], kondition: ['aus', 'tem', 'ant', 'phs'], taktik: ['stl', 'pas'], x_elf: ['elf'], x_spr: ['tem', 'ant'], x_tec: ['tec', 'dri'], x_pas: ['pas', 'spo'] };
  function skTrain(p, g, focus) { var ks = SKFOC[focus]; if (!ks || !(g > 0)) return; p.skd = p.skd || {}; ks.forEach(function (k) { p.skd[k] = clamp((p.skd[k] || 0) + g * 5, -15, 15); }); }
  function skAt(p, k) { return skillsOf(p)[k] || p.str; }
  function potVis(S) { return !!(S.scout && (S.scout.score || 0) >= 40 - skv(S, 'scout') * 2); }
  // Watchlist: in 3–5 Tagen werden die Werte nach und nach aufgedeckt (fest gemischte Reihenfolge)
  function wReveal(S, mp) { var w = (S.watch || []).filter(function (x) { return x.mid === mp.mid; })[0]; if (!w) return null; var rv = Math.max(1, 3 + hashS(mp.n + '|rv') % 3 - Math.floor(skv(S, 'scout') / 3)), days = w.wd ? Math.max(0, diffDays(w.wd, S.date)) : 0; var ks = SKL.map(function (s) { return s[0]; }).concat(['_ex', '_tr']), N = ks.length; var n = days >= rv ? N : Math.floor(N * (days + 0.5) / (rv + 0.5)); var r = srng(hashS(mp.n + '|ord')), ord = ks.map(function (k) { return [k, r()]; }).sort(function (a, b) { return a[1] - b[1]; }).map(function (x) { return x[0]; }); return { keys: ord.slice(0, n), n: n, all: N, left: Math.max(0, rv - days) }; }
  function mkSkills(S, mp) { var rv = wReveal(S, mp); if (!rv) return null; var I = skInfo(mp), o = { n: rv.n, all: rv.all, left: rv.left, sk: {} }; rv.keys.forEach(function (k) { if (k === '_ex') { o.ex = I.ex; o.rg = I.rg; } else if (k === '_tr') { o.ip = I.ip; o.pers = I.pers; } else o.sk[k] = I.sk[k]; }); return o; }
  function sGauss(r) { var u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function synthPlayers(S, D, team) {
    var r = srng(hashS(team + '|' + S.season)); var pk = function (a) { return a[Math.floor(r() * a.length)]; };
    var mk = function (pos) { return { n: pk(D.vn) + ' ' + pk(D.nn), pos: pos, team: team, g: 0, a: 0, gr: 0, gp: 0, ga: 0 }; };
    return [mk('ST'), mk('OM'), mk('IV'), mk(pick(['RA', 'LA'])), mk('TW')];
  }
  function distGoals(pl, gf, ga, r) {
    for (var i = 0; i < gf; i++) { var x = r(); var sc = x < 0.4 ? pl[0] : x < 0.62 ? pl[1] : x < 0.8 ? pl[3] : x < 0.88 ? pl[2] : null; if (sc) sc.g++; var y = r(); var as = y < 0.3 ? pl[1] : y < 0.45 ? pl[3] : y < 0.55 ? pl[0] : null; if (as && as !== sc) as.a++; }
    pl.forEach(function (p) { p.gp++; p.gr += clamp(3.5 - (gf - ga) * 0.3 + sGauss(r) * 0.6, 1.2, 5.8); }); pl[4].ga += ga;
  }
  function teamSquad(S, D, name) {
    var lvl = null, tm = null; Object.keys(S.world.lv).forEach(function (l) { S.world.lv[l].forEach(function (t) { if (t.n === name) { lvl = +l; tm = t; } }); }); if (!tm || tm.svw) return null;
    var r = srng(hashS(name + '|sq|' + S.season)); var pk = function (a) { return a[Math.floor(r() * a.length)]; };
    var syn = synthPlayers(S, D, name); var pos = ['TW', 'IV', 'IV', 'RV', 'LV', 'DM', 'ZM', 'ZM', 'RM', 'LM', 'OM', 'ST', 'TW', 'IV', 'RV', 'ZM', 'RA', 'ST', 'LA'];
    var synMap = { 0: 4, 10: 0, 9: 1, 1: 2, 15: 3 };
    return pos.map(function (ps, i) { var nm = synMap[i] != null ? syn[synMap[i]].n : pk(D.vn) + ' ' + pk(D.nn); var age = Math.floor(18 + r() * 16); var str = Math.round((tm.s + sGauss(r) * 3 - (i >= 11 ? 2 : 0)) * 10) / 10; var tal = Math.max(1, Math.min(4, Math.round((1 + Math.pow(r(), 1.8) * 2.6) * 2) / 2));
      var p = { n: nm, dp: ps, pos: GRP[ps] || ps, age: age, str: str, tal: tal }; return { i: i, n: nm, pos: ps, age: age, str: Math.round(str), tal: tal, mw: mw(p), lvl: lvl, team: name }; });
  }
  function curMdOwn(S) { var m = 0; S.fix.forEach(function (f) { if (f.hg != null) m = Math.max(m, f.md); }); return m; }
  function leagueView(S, D, lvl) {
    lvl = +lvl || S.lvl; var L = D.lv[lvl]; var teams = S.world.lv[lvl]; if (!teams) return null;
    var maxOwn = S.fix.length ? Math.max.apply(null, S.fix.map(function (f) { return f.md; })) : 1;
    var syn = {}; teams.forEach(function (t) { if (!t.svw) syn[t.n] = synthPlayers(S, D, t.n); });
    var fix, rows, maxMd, cur;
    if (lvl === S.lvl) {
      fix = S.fix.map(function (f) { return { md: f.md, d: f.d, h: teams[f.h].n, a: teams[f.a].n, hg: f.hg, ag: f.ag, svw: teams[f.h].svw || teams[f.a].svw }; });
      S.fix.forEach(function (f, i) { if (f.hg == null) return; var r = srng(hashS(S.season + '|' + i)); var h = teams[f.h], a = teams[f.a]; if (!h.svw) distGoals(syn[h.n], f.hg, f.ag, r); if (!a.svw) distGoals(syn[a.n], f.ag, f.hg, r); });
      rows = table(S); maxMd = maxOwn; cur = curMdOwn(S);
    } else {
      var res = vLeague(S, D, lvl, Math.round(curMdOwn(S) / maxOwn * (2 * (teams.length - 1 + teams.length % 2))));
      fix = res.fix; rows = res.rows; maxMd = res.maxMd; cur = res.cur;
      fix.forEach(function (f, i) { if (f.hg == null) return; var r = srng(hashS(S.season + '|' + lvl + '|' + i)); distGoals(syn[f.h], f.hg, f.ag, r); distGoals(syn[f.a], f.ag, f.hg, r); });
    }
    var all = []; Object.keys(syn).forEach(function (k) { all = all.concat(syn[k]); });
    if (lvl === S.lvl) S.players.forEach(function (p) { if (p.lgp) all.push({ n: p.n, pos: p.dp, team: D.club, g: p.lg || 0, a: p.la || 0, gr: p.lgr || 0, gp: p.lgp, kg: p.lkg || 0, ga: p.lga || 0, own: true }); });
    all.forEach(function (p) { if (p.kg == null && p.pos === 'TW') { p.kg = p.gp; } });
    var minGp = Math.max(1, Math.floor(cur * 0.4));
    var mkTop = function (key, fn, asc) {
      var list = all.filter(function (p) { return key === 'gr' ? p.gp >= minGp : key === 'tw' ? p.pos === 'TW' && p.kg >= minGp : p[key] > 0; }).map(function (p) { return { n: p.n, team: p.team, pos: p.pos, own: !!p.own, v: fn(p) }; });
      list.sort(function (a, b) { return asc ? a.v - b.v : b.v - a.v; }); list.forEach(function (x, i) { x.rank = i + 1; });
      var top = list.slice(0, 4); var mine = list.filter(function (x) { return x.own; })[0];
      return { top: top, mine: mine && mine.rank > 4 ? mine : null, all3: list.slice(0, 3), top5: list.slice(0, 5), mine3: mine && mine.rank > 3 ? mine : null, mineAny: mine || null };
    };
    var byMd = {}; fix.forEach(function (f) { (byMd[f.md] = byMd[f.md] || []).push(f); });
    return { lvl: lvl, name: L.name, short: L.short, rows: rows, byMd: byMd, md: { cur: cur || 1, max: maxMd }, own: lvl === S.lvl,
      top: { gr: mkTop('gr', function (p) { return Math.round(p.gr / p.gp * 100) / 100; }, true), g: mkTop('g', function (p) { return p.g; }), a: mkTop('a', function (p) { return p.a; }), tw: mkTop('tw', function (p) { return Math.round(p.ga / p.kg * 100) / 100; }, true) } };
  }
  function vLeague(S, D, lvl, mdLimit) {
    var teams = S.world.lv[lvl]; var n = teams.length; var L = D.lv[lvl];
    var r = srng(hashS('liga|' + S.season + '|' + lvl));
    var order = teams.map(function (_, i) { return i; }); for (var i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
    var rr = roundRobin(n); var form = teams.map(function () { return sGauss(r) * 1.5; });
    var fix = [];
    rr.forEach(function (pairs, k) { pairs.forEach(function (p) { fix.push({ md: k + 1, h: order[p[0]], a: order[p[1]] }); }); });
    rr.forEach(function (pairs, k) { pairs.forEach(function (p) { fix.push({ md: rr.length + k + 1, h: order[p[1]], a: order[p[0]] }); }); });
    var maxMd = rr.length * 2; var lim = mdLimit == null ? maxMd : Math.min(maxMd, mdLimit);
    var stat = teams.map(function (t) { return { n: t.n, sp: 0, s: 0, u: 0, nl: 0, tf: 0, ta: 0, pts: 0, form: [] }; });
    fix.forEach(function (f) {
      var si = teams[f.h].s + form[f.h] + 1.5, sj = teams[f.a].s + form[f.a];
      var hg = sPois(1.45 * Math.exp(0.07 * (si - sj)), r), ag = sPois(1.15 * Math.exp(0.07 * (sj - si)), r);
      if (f.md > lim) return; f.hg = hg; f.ag = ag;
      var A = stat[f.h], B = stat[f.a]; A.sp++; B.sp++; A.tf += hg; A.ta += ag; B.tf += ag; B.ta += hg;
      if (hg > ag) { A.s++; B.nl++; A.pts += 3; A.form.push('S'); B.form.push('N'); } else if (hg < ag) { B.s++; A.nl++; B.pts += 3; A.form.push('N'); B.form.push('S'); } else { A.u++; B.u++; A.pts++; B.pts++; A.form.push('U'); B.form.push('U'); }
    });
    var idx = stat.map(function (_, i) { return i; }).sort(function (a, b) { return stat[b].pts - stat[a].pts || (stat[b].tf - stat[b].ta) - (stat[a].tf - stat[a].ta) || stat[b].tf - stat[a].tf; });
    var rows = idx.map(function (i, k) { var x = stat[i]; var rank = k + 1; var zone = rank <= L.up ? 'up' : rank <= L.up + L.upRel ? 'uprel' : rank > n - L.down ? 'down' : rank > n - L.down - L.downRel ? 'downrel' : ''; if (lvl === 1 && rank <= L.up) zone = ''; return { rank: rank, n: x.n, sp: x.sp, s: x.s, u: x.u, nl: x.nl, tore: x.tf + ':' + x.ta, tf: x.tf, ta: x.ta, diff: x.tf - x.ta, pts: x.pts, form: x.form.slice(-5), zone: zone, i: i }; });
    return { rows: rows, order: idx.map(function (i) { return teams[i]; }), last: idx.map(function (i) { return [stat[i].n, stat[i].pts, stat[i].tf - stat[i].ta]; }), fix: fix.map(function (f) { return { md: f.md, h: teams[f.h].n, a: teams[f.a].n, hg: f.hg, ag: f.ag }; }), maxMd: maxMd, cur: lim };
  }
  function tableBefore(S, D, md) { return table(S, null, S.fix.filter(function (f) { return f.md < md; })); }
  function oppInfo(S, D) {
    var q = S.mq[0]; if (!q) return null; var o = q.o; var oppL = o.opp.l || S.lvl; var LL = D.lv[oppL] || D.lv[S.lvl];
    var r = srng(hashS(o.opp.n + '|' + S.season)); var pk = function (a) { return a[Math.floor(r() * a.length)]; };
    var lvAvg = (LL.lo + LL.hi) / 2; var tal = Math.round(clamp(2.0 + (o.opp.s - lvAvg) / Math.max(1, LL.hi - LL.lo) * 2 + sGauss(r) * 0.3, 1, 4.2) * 10) / 10;
    var syn = synthPlayers(S, D, o.opp.n); var lv = oppL === S.lvl ? leagueView(S, D, S.lvl) : null; var sc = syn[0], as = syn[1];
    if (lv) { var mineT = []; }
    var usedN = {}; syn.forEach(function (x) { usedN[x.n] = 1; usedN[x.n.split(' ').pop()] = 1; }); var xi = FORMS['4-4-2'].map(function (pos, i) { var nm = i === 10 ? syn[0].n : i === 8 ? syn[3].n : i === 6 ? syn[1].n : i === 2 ? syn[2].n : i === 0 ? syn[4].n : null; if (!nm) { var g = 0, ln; do { ln = pk(D.nn); } while (usedN[ln] && g++ < 30); usedN[ln] = 1; nm = pk(D.vn) + ' ' + ln; } return { pos: pos, n: nm, str: Math.round((o.opp.s + sGauss(r) * 2.5) * 10) / 10, tal: (function () { var t0 = Math.round(clamp(tal + sGauss(r) * 0.6, 1, 5)); if (t0 >= 4 && r() < 0.6) t0--; return t0; })() }; });
    var xiO = currentXI(S); var sel = xiO.filter(Boolean);
    var bestG = S.players.slice().sort(function (a, b) { return b.g - a.g; })[0], bestA = S.players.slice().sort(function (a, b) { return b.a - a.a; })[0];
    var tg = 0, ta = 0; if (lv) { lv.top.g.top.concat([]).forEach(function () {}); }
    return {
      opp: { n: o.opp.n, liga: (D.lv[oppL] || {}).short || '', s: Math.round(o.opp.s * 10) / 10, tal: tal, best: { n: sc.n, g: Math.max(0, Math.round((o.opp.s - lvAvg) / 3 + r() * 6)) }, ast: { n: as.n, a: Math.max(0, Math.round(r() * 5)) }, xi: xi },
      own: { n: D.club, liga: D.lv[S.lvl].short, s: Math.round(teamStr(S, D, o.home === true) * 10) / 10, tal: Math.round(sel.reduce(function (a, p) { return a + p.tal; }, 0) / Math.max(1, sel.length) * 10) / 10, best: bestG && bestG.g ? { n: bestG.n, g: bestG.g } : null, ast: bestA && bestA.a ? { n: bestA.n, a: bestA.a } : null,
        xi: FORMS[S.lineup.form].map(function (pos, i) { var p = xiO[i]; return p ? { pos: pos, n: p.n, str: Math.round(p.str), tal: p.tal, id: p.id } : { pos: pos, n: '—', str: 0, tal: 0 }; }) },
      form: S.lineup.form, label: o.label, home: o.home, comp: o.comp, ranks: (function () { var t = table(S), m = {}; t.forEach(function (x) { m[x.n] = x.rank; }); return o.comp === 'liga' ? { own: m[D.club], opp: m[o.opp.n] } : null; })()
    };
  }
  // ============================================================ Pokal-Baum
  function cupField(S, D, c) {
    var lvls = c.k === 'kp' ? [6, 7, 8, 9, 10, 11] : c.k === 'mrp' ? [4, 5, 6, 7, 8, 9, 10, 11] : [1, 2, 3, 4, 5, 6];
    var pool = [];
    lvls.forEach(function (l) { (S.world.lv[l] || []).forEach(function (t) { if (!t.svw && !/\s(II|III|IV|U\d\d)$/.test(t.n)) pool.push({ n: t.n, s: Math.max(1, t.s), l: l }); }); });
    shuffle(pool);
    if (c.k === 'dfb') pool.sort(function (a, b) { return a.l - b.l; });
    if (c.k === 'mrp') { var core = pool.filter(function (t) { return t.l >= 4 && t.l <= 6; }), bl = pool.filter(function (t) { return t.l === 7; }).sort(function (a, b) { return b.s - a.s; }).slice(0, rint(2, 4)), up = []; (S.world.lv[3] || []).forEach(function (t) { if (!t.svw && !/\s(II|III|IV|U\d\d)$/.test(t.n)) up.push({ n: t.n, s: Math.max(1, t.s), l: 3 }); }); shuffle(up); var fld = core.concat(bl); fld = fld.concat(up.slice(0, Math.max(0, 63 - fld.length))); if (fld.length < 63) fld = fld.concat(pool.filter(function (t) { return t.l >= 7 && fld.indexOf(t) < 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 63 - fld.length)); shuffle(fld); return fld.slice(0, 63); }
    return pool.slice(0, 63);
  }
  function cupTie(a, b) { var hg = poisson(1.35 * Math.exp(0.07 * (a.s - b.s + 1))), ag = poisson(1.2 * Math.exp(0.07 * (b.s - a.s))); var pen = null, w = hg > ag ? a : hg < ag ? b : null; if (!w) { w = R() < 1 / (1 + Math.exp(-(a.s - b.s) * 0.08)) ? a : b; pen = 'n.E.'; } return { h: a.n, a: b.n, hl: a.l, al: b.l, hg: hg, ag: ag, pen: pen, w: w.n, wt: w }; }
  function cupPairOthers(S, D, c, excl) {
    var rest = (c.field || []).filter(function (t) { return excl.indexOf(t.n) < 0; }); shuffle(rest);
    c.ties = []; for (var i = 0; i + 1 < rest.length; i += 2) c.ties.push({ h: rest[i].n, a: rest[i + 1].n, hl: rest[i].l, al: rest[i + 1].l, ht: rest[i], at: rest[i + 1] });
    c.bye = rest.length % 2 ? rest[rest.length - 1] : null;
  }
  function cupAfterRound(S, D, c, ourRes) {
    c.hist = c.hist || []; var winners = [];
    var round = { rn: c.rn, name: RNAMES[Math.min(5, c.hist.length)], ties: [] };
    if (ourRes) { round.ties.push({ h: ourRes.h, a: ourRes.a, hg: ourRes.hg, ag: ourRes.ag, pen: ourRes.pen, w: ourRes.w, own: true }); if (!ourRes.wonUs) winners.push(ourRes.oppT); }
    (c.ties || []).forEach(function (t) { var x = cupTie(t.ht, t.at); round.ties.push({ h: x.h, a: x.a, hl: t.hl, al: t.al, hg: x.hg, ag: x.ag, pen: x.pen, w: x.w }); winners.push(x.wt); });
    if (c.bye) winners.push(c.bye);
    c.hist.push(round); c.field = winners; c.ties = []; c.bye = null;
  }
  function cupFinishWithoutUs(S, D, c) {
    var g = 0; while ((c.field || []).length > 1 && c.hist.length < 6 && g++ < 8) { var rn = c.hist.length; cupPairOthers(S, D, c, []); c.rn = rn; cupAfterRound(S, D, c, null); }
    if (c.field && c.field.length === 1) c.winner = c.field[0].n;
  }
  // ============================================================ Training an Trainingstagen
  var TRAIN = {
    abwehr: ['Abwehr', ['IV', 'RV', 'LV', 'DM'], ['Zweikampf', 'Kopfball', 'Stellungsspiel']],
    sturm: ['Sturm', ['ST', 'RA', 'LA', 'OM'], ['Abschluss', 'Kombinationen', 'Konter']],
    aussen: ['Außenbahn', ['RM', 'LM', 'RA', 'LA', 'RV', 'LV'], ['Flanken', 'Tempo', '1-gegen-1']],
    mittelfeld: ['Mittelfeld', ['ZM', 'DM', 'OM', 'RM', 'LM'], ['Passspiel', 'Spielaufbau', 'Ballkontrolle']],
    torwart: ['Torwart', ['TW'], ['Reflexe', 'Strafraum', 'Spieleröffnung']],
    kondition: ['Kondition', null, ['Ausdauer', 'Sprints', 'Kraft']],
    standards: ['Standards', null, ['Ecken', 'Freistöße', 'Elfmeter']],
    taktik: ['Taktik', null, ['Pressing', 'Umschalten', 'Spielzug']],
    // für alle Spieler (zweite Reihe im Training)
    elfmeter: ['Elfmeter', null, ['Elfmeter']], sprints: ['Sprints', null, ['Tempo', 'Antritt']], technik: ['Technik', null, ['Technik', 'Dribbling']], passspiel: ['Passspiel', null, ['Passspiel', 'Spieleröffnung']]
  };
  var TTSK = { abwehr: 'abwehr', sturm: 'abschluss', aussen: 'aussen', mittelfeld: 'technik', torwart: 'torwart', kondition: 'kondition', standards: 'standards', taktik: 'taktik', elfmeter: 'x_elf', sprints: 'x_spr', technik: 'x_tec', passspiel: 'x_pas' };
  function isTrainDay(S, D, d) { return S.lvl >= 7 && (dow(d) === 2 || dow(d) === 4) && !(S.camp && d >= S.camp.from && d <= S.camp.to) && !svwGames(S, D).some(function (g) { return g.d === d; }); }
  function doTraining(S, D, t, focus, score, mult) {
    var T = TRAIN[t]; if (!T) err('Unbekanntes Training.'); var e = eff(S, D);
    var pos = T[1]; var out = []; var man = score != null; var good = (man ? 0.3 + score * 0.65 : 0.56) + (e.dev || 0) / 300 + (S.train.int === 'hart' ? -0.04 : 0);
    var ps = S.players.filter(function (p) { return !p.inj && !(p.loan && p.loan.to); });
    ps.forEach(function (p) {
      // Nur wer betroffen ist, trainiert mit (z. B. Torwarttraining nur für Torhüter) – die anderen erholen sich leicht
      if (pos && pos.indexOf(p.dp) < 0) { p.fit = clamp(p.fit + 1, 20, 100); return; }
      p.fit = clamp(p.fit - (t === 'kondition' ? rnd(5, 8) : rnd(2, 5)), 20, 100); p.fitCap = Math.min(100, (p.fitCap || 100) + (t === 'kondition' ? 1.5 : 0.6) * (mult || 1));
      var neutral = man && R() < 0.25 - Math.abs(score - 0.5) * 0.3; if (neutral) return; var pct = 0.65 * (man ? rnd(0.002, 0.01) * (0.6 + score * 0.8) : (R() < 0.08 ? rnd(0.01, 0.02) : rnd(0.001, 0.008))) * (pos ? 1 : 0.5) * (p.age <= 23 ? 1.2 : p.age >= 31 ? 0.7 : 1); var sign = R() < good ? 1 : -1;
      var before = p.str; p.str = clamp(p.str * (1 + sign * pct * (mult || 1) * (sign > 0 ? 0.6 + 0.14 * (p.tal || 3) : 1)), 1, Math.max(p.pot + 1, p.str)); var d = Math.round((p.str - before) * 100) / 100;
      if (d > 0) skTrain(p, d * 2, { abwehr: 'abwehr', sturm: 'abschluss', aussen: 'aussen', mittelfeld: 'technik', torwart: 'torwart', kondition: 'kondition', standards: 'standards', taktik: 'taktik' }[t]);
      if (Math.abs(d) >= 0.15) out.push({ n: p.n, pos: p.dp, d: d });
    });
    if (t === 'taktik') S.chem = { v: Math.min(2, ((S.chem && S.chem.v) || 0) + 0.3), until: addDays(S.date, 10) };
    if (t === 'kondition') ps.forEach(function (p) { p.fitBonus = 3; });
    S.moral = clamp(S.moral + rnd(-1, 1.5), 10, 100); xp(S, 1); S.trainBoost = Math.min(man ? 2 : 1.2, (S.trainBoost || 0) + (man ? (0.4 + score * 0.8) * Math.min(1.3, mult || 1) : 0.4));
    out.sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
    S.lastTrain = { d: S.date, t: T[0], f: focus, res: out.slice(0, 10), score: score };
    msg(S, 'training', 'Training (' + T[0] + ' – ' + focus + '): ' + (out.length ? out.slice(0, 3).map(function (x) { return x.n + ' ' + (x.d > 0 ? '+' : '') + x.d.toFixed(2); }).join(', ') : 'solide Einheit'));
    return out;
  }
  // ============================================================ Pressekonferenz, Vorbereitung, Spenden
  var PRESS = [
    ['Herzlich willkommen beim SV Wachtberg! Was dürfen die Fans von Ihnen erwarten?', [['Offensiven, mutigen Fußball – wir wollen begeistern!', 'fans:+4; vorstand:+1'], ['Harte Arbeit, Disziplin und Zusammenhalt.', 'vorstand:+4; moral:+2'], ['Erstmal schauen, was die Mannschaft draufhat.', 'moral:+1'], ['Titel. Ich bin nicht hier, um Mittelmaß zu verwalten.', 'fans:+6; vorstand:-2; moral:+3']]],
    ['Wie sehen Sie die Rolle der Jugend und der eigenen Talente?', [['Eigene Talente bekommen bei mir ihre Chance.', 'fans:+3; moral:+2'], ['Wer gut ist, spielt – egal wie alt.', 'moral:+2'], ['Wir brauchen erfahrene Leute, um oben mitzuspielen.', 'vorstand:+2; fans:-1'], ['Die Academy wird das Herzstück des Vereins.', 'fans:+2; vorstand:+2']]],
    ['Ein Wort an die Sponsoren und das Umfeld?', [['Ohne unsere Partner geht nichts – danke!', 'sponsoren:+6'], ['Lasst uns gemeinsam das Ländchen stolz machen.', 'fans:+3; sponsoren:+3'], ['Ergebnisse überzeugen mehr als Worte.', 'vorstand:+2'], ['Wer jetzt einsteigt, ist später Teil einer Erfolgsgeschichte.', 'sponsoren:+8; vorstand:-1']]]
  ];
  var PRESS_POOL = [
    [['Welche Spielidee bringen Sie mit?', [['Pressing, Tempo, Tore!', 'fans:+4; moral:+1'], ['Kompakt stehen, eiskalt kontern.', 'vorstand:+3'], ['Ballbesitz und Geduld.', 'moral:+2'], ['Das hängt vom Gegner ab.', 'vorstand:+1']]],
     ['Wo sehen Sie den Verein am Saisonende?', [['Ganz oben.', 'fans:+5; vorstand:-2'], ['Im oberen Drittel.', 'vorstand:+3; fans:+1'], ['Sorgenfrei im Mittelfeld.', 'vorstand:+2'], ['Das sage ich erst nach zehn Spielen.', 'moral:+1']]],
     ['Was war ausschlaggebend für Ihre Zusage?', [['Das Projekt und die Menschen hier.', 'fans:+3; vorstand:+2'], ['Die Perspektive nach oben.', 'vorstand:+2; sponsoren:+2'], ['Die Region – ich fühle mich hier zuhause.', 'fans:+4'], ['Ehrlich gesagt das Gesamtpaket.', 'sponsoren:+2']]],
     ['Wie gehen Sie mit Druck um?', [['Druck ist ein Privileg.', 'moral:+3; fans:+2'], ['Ich konzentriere mich nur aufs Training.', 'vorstand:+2; moral:+1'], ['Den spüre ich gar nicht.', 'fans:+1'], ['Den mache ich mir selbst am meisten.', 'vorstand:+3']]],
     ['Werden Sie Spieler aussortieren?', [['Jeder fängt bei null an.', 'moral:+4'], ['Wer nicht mitzieht, hat keine Zukunft.', 'vorstand:+3; moral:-2'], ['Ich schaue mir alles in Ruhe an.', 'moral:+2'], ['Es wird Veränderungen geben, ja.', 'vorstand:+2; moral:-1']]],
     ['Was unterscheidet Sie von Ihrem Vorgänger?', [['Ich will nach vorne verteidigen.', 'fans:+3'], ['Darüber rede ich nicht – Respekt vor seiner Arbeit.', 'vorstand:+3; moral:+1'], ['Mehr Fokus auf Fitness.', 'moral:-1; vorstand:+2'], ['Mehr Leidenschaft an der Linie.', 'fans:+4']]],
     ['Wie wichtig ist Ihnen der Pokal?', [['Sehr – Pokalnächte sind Magie!', 'fans:+4'], ['Die Liga hat Vorrang.', 'vorstand:+3'], ['Wir nehmen jedes Spiel ernst.', 'moral:+2'], ['Da bekommen junge Spieler Chancen.', 'moral:+2; fans:+1']]],
     ['Welche Rolle spielt der Kapitän für Sie?', [['Er ist mein verlängerter Arm.', 'moral:+3'], ['Die Binde wird neu vergeben.', 'moral:-2; vorstand:+2'], ['Wir haben einen Mannschaftsrat.', 'moral:+2; vorstand:+1'], ['Das entscheidet die Mannschaft.', 'moral:+3; vorstand:-1']]],
     ['Wie wollen Sie die Fans ins Stadion holen?', [['Mit attraktivem Fußball.', 'fans:+4'], ['Mit Siegen – alles andere ist zweitrangig.', 'vorstand:+2; fans:+1'], ['Mit Nähe: offenes Training, Autogramme.', 'fans:+5; moral:-1'], ['Die Fans kommen, wenn die Leistung stimmt.', 'vorstand:+1']]],
     ['Haben Sie ein Vorbild als Trainer?', [['Jürgen Klopp – Emotion pur.', 'fans:+3'], ['Ich gehe meinen eigenen Weg.', 'vorstand:+2'], ['Mein erster Jugendtrainer.', 'fans:+2; moral:+1'], ['Von jedem ein bisschen.', 'moral:+1']]]],
    [['Wie viele Eigengewächse sehen wir in der Startelf?', [['So viele wie möglich.', 'fans:+4; vorstand:-1'], ['Mindestens zwei pro Spiel.', 'fans:+2; moral:+1'], ['Das hängt nur von der Leistung ab.', 'vorstand:+2'], ['Erstmal müssen sie sich hinten anstellen.', 'vorstand:+1; fans:-2']]],
     ['Ist der Kader breit genug?', [['Absolut – ich vertraue der Truppe.', 'moral:+4'], ['Wir brauchen noch zwei, drei Spieler.', 'vorstand:-1; fans:+2'], ['Für die Liga reicht es.', 'vorstand:+2'], ['Breite schlägt Qualität nicht.', 'moral:+1']]],
     ['Wollen Sie Talente auch mal verleihen?', [['Ja, Spielpraxis ist alles.', 'vorstand:+2; moral:+1'], ['Nur zum Partnerverein.', 'vorstand:+3'], ['Nein, die sollen hier wachsen.', 'fans:+3'], ['Im Einzelfall.', 'moral:+1']]],
     ['Was erwarten Sie von den Routiniers?', [['Sie sollen die Jungen führen.', 'moral:+3'], ['Leistung – Erfahrung allein reicht nicht.', 'vorstand:+2; moral:-1'], ['Ruhe in schwierigen Phasen.', 'vorstand:+2; moral:+1'], ['Dass sie Vorbilder sind, auch neben dem Platz.', 'fans:+2; moral:+1']]],
     ['Wie wichtig ist Ihnen die Durchlässigkeit von der U19?', [['Das ist unser Fundament.', 'fans:+3; vorstand:+1'], ['Wichtig, aber kein Selbstzweck.', 'vorstand:+2'], ['Wir trainieren künftig öfter zusammen.', 'moral:+2; fans:+1'], ['Die Lücke zur Ersten ist noch groß.', 'vorstand:+1']]],
     ['Planen Sie Transfers im Winter?', [['Nur wenn es nötig ist.', 'vorstand:+3'], ['Ja, wir wollen nachlegen.', 'fans:+3; vorstand:-2'], ['Lieber aus der Academy.', 'fans:+2; moral:+1'], ['Der Markt ist leer, mal schauen.', 'moral:+1']]],
     ['Welche Position ist Ihr Sorgenkind?', [['Gar keine.', 'moral:+3'], ['Die Innenverteidigung.', 'vorstand:+2'], ['Wir brauchen mehr Torgefahr.', 'fans:+2'], ['Das bleibt intern.', 'vorstand:+2; moral:+1']]],
     ['Wie fördern Sie junge Spieler konkret?', [['Individuelle Trainingspläne.', 'moral:+2; vorstand:+2'], ['Paten aus der Ersten.', 'moral:+3'], ['Einsatzzeiten in Testspielen.', 'moral:+1; fans:+1'], ['Durch Konkurrenz.', 'vorstand:+2; moral:-1']]],
     ['Haben Sie schon ein Lieblingstalent entdeckt?', [['Ja – aber den Namen verrate ich nicht.', 'fans:+3'], ['Alle sind gleich wichtig.', 'moral:+3'], ['Ich hatte erst ein Training.', 'vorstand:+1'], ['Ein paar, die mich überrascht haben.', 'moral:+2; fans:+1']]],
     ['Was halten Sie von einer zweiten Mannschaft?', [['Unbedingt – als Sprungbrett.', 'fans:+2; vorstand:+1'], ['Zu teuer im Moment.', 'vorstand:+3'], ['Vielleicht in zwei Jahren.', 'vorstand:+2'], ['Der Partnerverein erfüllt die Rolle.', 'sponsoren:+1; vorstand:+1']]]],
    [['Was sagen Sie den Ehrenamtlichen im Verein?', [['Ihr seid das Herz des Vereins!', 'fans:+3; moral:+2'], ['Ohne euch gäbe es kein Spiel.', 'fans:+3; vorstand:+1'], ['Ich packe selbst mit an.', 'fans:+4; moral:-1'], ['Danke – wir zahlen es mit Siegen zurück.', 'fans:+2']]],
     ['Wie sehen Sie die Zusammenarbeit mit dem Vorstand?', [['Eng und vertrauensvoll.', 'vorstand:+4'], ['Jeder macht seinen Job.', 'vorstand:+2'], ['Ich will sportlich freie Hand.', 'vorstand:-2; moral:+2'], ['Wir sind ein Team.', 'vorstand:+3; moral:+1']]],
     ['Braucht der Verein neue Sponsoren?', [['Jeder Partner ist willkommen!', 'sponsoren:+5'], ['Wir müssen erst sportlich liefern.', 'vorstand:+2; sponsoren:+1'], ['Regionale Partner sind uns am liebsten.', 'sponsoren:+3; fans:+2'], ['Das ist nicht mein Bereich.', 'sponsoren:-1']]],
     ['Was halten Sie vom Ländchen-Derby?', [['Das wichtigste Spiel des Jahres!', 'fans:+5'], ['Drei Punkte wie jedes andere.', 'vorstand:+2; fans:-1'], ['Ein Fest für die Region.', 'fans:+3; sponsoren:+1'], ['Da wird keiner geschont.', 'moral:+2; fans:+2']]],
     ['Wie wichtig ist Social Media für Sie?', [['Sehr – wir müssen sichtbar sein.', 'fans:+3; sponsoren:+2'], ['Das macht unser Medienteam.', 'vorstand:+1'], ['Ich bin kein Fan davon.', 'fans:-1'], ['Spieler-Content bringt Nähe.', 'fans:+3; moral:-1']]],
     ['Werden Sie im Ort präsent sein?', [['Man wird mich beim Bäcker treffen!', 'fans:+4'], ['Ich lebe für den Fußball, nicht für Auftritte.', 'vorstand:+1'], ['Bei Vereinsfesten auf jeden Fall.', 'fans:+3; sponsoren:+1'], ['Wenn es die Zeit zulässt.', 'fans:+1']]],
     ['Was ist Ihre Botschaft an die Wirtschaft der Region?', [['Investiert in euren Heimatverein!', 'sponsoren:+5'], ['Wir bieten Sichtbarkeit und Emotion.', 'sponsoren:+4'], ['Gemeinsam wachsen.', 'sponsoren:+3; fans:+1'], ['Wir überzeugen mit Leistung.', 'vorstand:+2']]],
     ['Sind die Trainingsbedingungen gut genug?', [['Ja, wir haben alles, was wir brauchen.', 'vorstand:+3'], ['Da gibt es Luft nach oben.', 'vorstand:-1; moral:+2'], ['Ein neuer Kunstrasen wäre ein Traum.', 'fans:+1; vorstand:-1'], ['Bedingungen sind keine Ausrede.', 'vorstand:+2; moral:+1']]],
     ['Wie gehen Sie mit Kritik in der Lokalpresse um?', [['Kritik gehört dazu.', 'vorstand:+2; fans:+1'], ['Ich lese keine Zeitung.', 'fans:-1'], ['Die Tür steht der Presse immer offen.', 'fans:+2; sponsoren:+1'], ['Wir antworten auf dem Platz.', 'moral:+2']]],
     ['Was wünschen Sie sich vom Umfeld in schweren Zeiten?', [['Geduld und Rückhalt.', 'fans:+2; vorstand:+1'], ['Ehrliche Kritik, aber gemeinsam.', 'vorstand:+2; fans:+1'], ['Lautstarke Unterstützung!', 'fans:+4'], ['Dass alle an einem Strang ziehen.', 'moral:+2; vorstand:+1']]]]
  ];
  var PRESS_EXTRA = {
    verl: [
      ['Was hat am Ende den Ausschlag gegeben?', [['Die Menschen hier. Ehrenamt, Fans, Kabine – das passt einfach.', 'fans:+3; moral:+2'], ['Die Gespräche mit dem Vorstand waren sehr offen.', 'vorstand:+4'], ['Die sportliche Perspektive.', 'moral:+2; vorstand:+1'], ['Ehrlich gesagt: das Gehalt stimmt auch.', 'vorstand:-1; sponsoren:+2']]],
      ['Was wollen Sie in der neuen Laufzeit anders machen?', [['Noch mehr auf die Jugend setzen.', 'fans:+2; moral:+2'], ['Die Trainingsarbeit weiter professionalisieren.', 'moral:+3'], ['Nichts – warum etwas ändern, das funktioniert?', 'vorstand:+2'], ['Mehr Präsenz im Ort, näher an die Fans.', 'fans:+4']]],
      ['Wie lange sehen Sie sich noch hier?', [['So lange man mich lässt.', 'vorstand:+3; fans:+2'], ['Ich denke von Saison zu Saison.', 'moral:+1'], ['Bis wir ganz oben angekommen sind.', 'fans:+4; vorstand:-1'], ['Das entscheidet der Erfolg.', 'vorstand:+2']]],
      ['Haben Sie schon Wunschspieler für den Sommer?', [['Ein, zwei Namen gibt es – mehr verrate ich nicht.', 'fans:+2'], ['Erst mal schauen wir auf den eigenen Kader.', 'moral:+3'], ['Wir brauchen dringend Verstärkung, ja.', 'vorstand:-1; sponsoren:+2'], ['Transfers macht der Vorstand, ich mache Vorschläge.', 'vorstand:+3']]]],
    meister: [
      ['Gab es einen Moment, in dem Sie wussten: Das wird was?', [['Nach dem Sieg gegen den direkten Konkurrenten.', 'moral:+3'], ['In der Vorbereitung – da hat alles gepasst.', 'vorstand:+2; moral:+1'], ['Erst am letzten Spieltag, ehrlich gesagt.', 'fans:+2'], ['Ich wusste es von Anfang an.', 'fans:+3; vorstand:-1']]],
      ['Ihre Botschaft an die Konkurrenz?', [['Respekt – es war eine starke Saison von allen.', 'vorstand:+3'], ['Nächstes Jahr wieder!', 'fans:+4; moral:+1'], ['Wir sind noch lange nicht satt.', 'moral:+3; fans:+2'], ['Keine. Wir schauen nur auf uns.', 'moral:+2']]],
      ['Was ändert der Titel für den Verein?', [['Mehr Aufmerksamkeit, mehr Partner.', 'sponsoren:+4'], ['Die Jugend sieht: Hier geht was.', 'fans:+3; moral:+1'], ['Eine Verpflichtung, dranzubleiben.', 'vorstand:+3'], ['Vor allem gute Laune im ganzen Ort.', 'fans:+4']]],
      ['Wer hat Sie diese Saison am meisten überrascht?', [['Die jungen Spieler – unglaublich, wie die gewachsen sind.', 'moral:+3; fans:+1'], ['Unsere Abwehr – kaum Gegentore.', 'moral:+2'], ['Die Fans, so viele Leute bei Auswärtsspielen!', 'fans:+4'], ['Ehrlich? Ich mich selbst.', 'fans:+1; moral:-1']]]],
    aufstieg: [
      ['Welche Gegner freuen Sie in der neuen Liga am meisten?', [['Die Derbys – darauf freut sich der ganze Ort.', 'fans:+4'], ['Die großen Namen, gegen die wollen wir uns messen.', 'moral:+3'], ['Jeder Gegner ist gleich wichtig.', 'vorstand:+2'], ['Die Auswärtsfahrten werden ein Erlebnis.', 'fans:+3; moral:+1']]],
      ['Bleibt die Mannschaft zusammen?', [['Der Kern bleibt, dafür sorge ich.', 'moral:+4'], ['Es wird ein paar Veränderungen geben müssen.', 'vorstand:+2; moral:-1'], ['Wer will, darf bleiben.', 'moral:+3; vorstand:-1'], ['Das hängt vom Budget ab.', 'vorstand:+1; sponsoren:+2']]],
      ['Wie war die Aufstiegsfeier?', [['Legendär – mehr sage ich nicht!', 'fans:+4; moral:+2'], ['Kurz und herzlich, dann ging es heim.', 'vorstand:+2'], ['Die Jungs haben bis morgens gefeiert.', 'moral:+3; vorstand:-1'], ['Mit dem ganzen Ort auf dem Sportplatz.', 'fans:+5']]],
      ['Brauchen Sie ein größeres Budget?', [['Ein bisschen mehr würde helfen.', 'vorstand:-1; sponsoren:+2'], ['Wir kommen mit dem aus, was wir haben.', 'vorstand:+4'], ['Unsere Partner ziehen hoffentlich mit.', 'sponsoren:+4'], ['Ohne Investitionen wird es schwer.', 'vorstand:-2; fans:+1']]]],
    abstieg: [
      ['Haben Sie an Rücktritt gedacht?', [['Nein. Ich will das wieder geraderücken.', 'vorstand:+3; moral:+2'], ['Kurz, ja. Aber ich laufe nicht weg.', 'fans:+3'], ['Das entscheidet der Vorstand.', 'vorstand:+2'], ['Kein Kommentar.', 'fans:-1']]],
      ['Was sagen Sie den enttäuschten Fans?', [['Danke, dass ihr trotzdem da wart. Wir kommen zurück.', 'fans:+5'], ['Es tut uns leid. Wir haben es nicht geschafft.', 'fans:+3; moral:+1'], ['Kritik ist berechtigt, wir nehmen sie an.', 'vorstand:+2; fans:+2'], ['Wir brauchen jetzt Geduld.', 'vorstand:+2']]],
      ['Wer muss den Verein jetzt verlassen?', [['Darüber reden wir intern, nicht hier.', 'moral:+3'], ['Es wird einen Umbruch geben.', 'vorstand:+2; moral:-2'], ['Am liebsten niemand.', 'moral:+3; vorstand:-1'], ['Wer nicht mitzieht, hat hier keine Zukunft.', 'vorstand:+3; moral:-2']]],
      ['Wann wollen Sie wieder aufsteigen?', [['So schnell wie möglich – am besten sofort.', 'fans:+4; vorstand:-1'], ['Erst mal Ruhe reinbringen.', 'vorstand:+3'], ['In zwei Jahren sind wir zurück.', 'fans:+2; vorstand:+1'], ['Keine Versprechen mehr.', 'moral:+1']]]]
  };
  var PRESS_SETS = {
    verl: ['Vertragsverlängerung', [
      ['Sie bleiben dem SV Wachtberg treu – warum?', [['Hier ist etwas entstanden, das ich weiterführen will.', 'fans:+3; vorstand:+2'], ['Der Verein hat mir Vertrauen geschenkt, das zahle ich zurück.', 'vorstand:+4'], ['Das Gesamtpaket hat einfach gestimmt.', 'sponsoren:+3'], ['Weil wir noch lange nicht fertig sind!', 'fans:+4; moral:+2']]],
      ['Was ist Ihr Ziel für die neue Vertragslaufzeit?', [['Den nächsten Schritt machen – nach oben.', 'fans:+4; vorstand:-1'], ['Stabilität und eine eingespielte Mannschaft.', 'vorstand:+3; moral:+1'], ['Mehr eigene Talente in die Erste bringen.', 'fans:+2; moral:+2'], ['Erst mal die laufende Saison sauber zu Ende spielen.', 'vorstand:+2']]],
      ['Gab es auch Angebote anderer Vereine?', [['Ja, aber mein Herz schlägt fürs Ländchen.', 'fans:+5'], ['Dazu sage ich nichts.', 'vorstand:+1'], ['Ein paar Anfragen – aber nichts Ernstes.', 'moral:+1'], ['Natürlich, ich bin ja nicht irgendwer.', 'fans:+1; vorstand:-2']]]]],
    meister: ['Meisterschaft', [
      ['Meister! Wie fühlt sich das an?', [['Unbeschreiblich – das gehört der ganzen Mannschaft!', 'moral:+4; fans:+3'], ['Verdient. Wir waren über die Saison die Besten.', 'vorstand:+3'], ['Ein Traum für das ganze Ländchen.', 'fans:+5'], ['Schön – aber morgen geht die Arbeit weiter.', 'vorstand:+4; moral:-1']]],
      ['Wer war für Sie der Schlüssel zum Titel?', [['Die Kabine. Der Zusammenhalt war einmalig.', 'moral:+4'], ['Unsere Fans, die uns überall hingetragen haben.', 'fans:+4'], ['Der Vorstand, der mir freie Hand gelassen hat.', 'vorstand:+4'], ['Die Partner, die das alles möglich machen.', 'sponsoren:+5']]],
      ['Wie wird gefeiert?', [['Mit allen – Fans, Spieler, Ehrenamtliche!', 'fans:+4; moral:+2'], ['Erst intern, dann groß im Ort.', 'moral:+3'], ['Kurz – wir haben noch Ziele.', 'vorstand:+3'], ['Die Mannschaft hat jeden Freiraum verdient.', 'moral:+4; vorstand:-1']]]]],
    aufstieg: ['Aufstieg', [
      ['Aufgestiegen! Was bedeutet das für den Verein?', [['Ein riesiger Schritt für den SV Wachtberg.', 'fans:+4; vorstand:+2'], ['Belohnung für ein Jahr harte Arbeit.', 'moral:+3'], ['Jetzt beginnt das eigentliche Abenteuer.', 'fans:+3; sponsoren:+2'], ['Endlich da, wo wir hingehören.', 'fans:+2; vorstand:-1']]],
      ['Ist die Mannschaft stark genug für die neue Liga?', [['Ja – wir haben Qualität und Charakter.', 'moral:+4'], ['Wir werden punktuell nachlegen.', 'vorstand:+2; sponsoren:+2'], ['Es wird schwer, aber wir kämpfen um jeden Punkt.', 'vorstand:+3'], ['Wir wollen direkt oben mitspielen.', 'fans:+4; vorstand:-2']]],
      ['Ihr Wunsch an die Sponsoren?', [['Geht den Weg mit uns weiter!', 'sponsoren:+5'], ['Gemeinsam schaffen wir die nächste Liga.', 'sponsoren:+3; fans:+2'], ['Jetzt ist der beste Zeitpunkt, einzusteigen.', 'sponsoren:+7; vorstand:-1'], ['Erst mal danke für alles.', 'sponsoren:+3; vorstand:+1']]]]],
    abstieg: ['Abstieg', [
      ['Der Abstieg ist besiegelt. Ihre Erklärung?', [['Ich übernehme die volle Verantwortung.', 'vorstand:+4; moral:+1'], ['Wir hatten viel Verletzungspech.', 'moral:+2; vorstand:-1'], ['Die Mannschaft hat nicht genug investiert.', 'moral:-3; vorstand:+2'], ['Kein Kommentar.', 'fans:-3']]],
      ['Bleiben Sie Trainer?', [['Ja – ich will den direkten Wiederaufstieg.', 'fans:+4; vorstand:+2'], ['Das entscheidet der Vorstand.', 'vorstand:+3'], ['Ich bin für den Neuaufbau der Richtige.', 'vorstand:+2; moral:+2'], ['Ich lasse mir jede Option offen.', 'vorstand:-3; fans:-2']]],
      ['Was sagen Sie den enttäuschten Fans?', [['Wir kommen stärker zurück – versprochen!', 'fans:+5'], ['Danke, dass ihr auch jetzt hinter uns steht.', 'fans:+4; moral:+1'], ['Wir müssen jetzt alle zusammenhalten.', 'fans:+2; moral:+2; vorstand:+1'], ['Jeder darf enttäuscht sein, ich auch.', 'fans:+1']]]]]
  };
  // Fragen je Pressekonferenz zufällig, aber für diese eine Konferenz fest (Startwert pro Spielstand + Datum)
  function pressQs(S) { var k = S.pressPending, hs = 0, sd = String(S.date) + (S.season || '') + (S.club || '') + (S.pseed || 0); for (var hi = 0; hi < sd.length; hi++) hs = (hs * 31 + sd.charCodeAt(hi)) % 100003;
    if (typeof k === 'string' && PRESS_SETS[k]) { var L = PRESS_SETS[k][1].concat(PRESS_EXTRA[k] || []), out = [], h2 = hs; while (out.length < 3 && L.length) { h2 = (h2 * 9301 + 49297) % 233280; out.push(L.splice(h2 % L.length, 1)[0]); } return out; }
    return PRESS.map(function (q0, i) { var pl = [q0].concat(PRESS_POOL[i] || []); return pl[(hs + i * 7) % pl.length]; }); }
  function pressTitle(S) { var k = S.pressPending; return typeof k === 'string' && PRESS_SETS[k] ? PRESS_SETS[k][0] : 'Vorstellung des neuen Trainers'; }
  function applySimpleFx(S, fx) {
    var out = []; String(fx || '').split(';').forEach(function (x) { var m = x.trim().match(/^(\w+):([+-]?\d+)$/); if (!m) return; var n = +m[2];
      if (m[1] === 'fans') S.fans = clamp(S.fans + n, 0, 100); if (m[1] === 'vorstand') S.board = clamp(S.board + n, 0, 100); if (m[1] === 'moral') S.moral = clamp(S.moral + n, 10, 100); if (m[1] === 'sponsoren') S.spons = clamp((S.spons || 60) + n, 0, 100);
      out.push({ fans: 'Fans', vorstand: 'Vorstand', moral: 'Moral', sponsoren: 'Sponsoren' }[m[1]] + ' ' + (n > 0 ? '+' : '') + n); });
    return out;
  }
  var CHARITY = [['kinderkrebs', 'Kinderkrebshilfe Bonn'], ['missionerde', 'Mission Erde'], ['tierschutz', 'Tierschutzverein Wachtberg'], ['tafel', 'Bonner Tafel'], ['sos', 'SOS-Kinderdorf'], ['jugendfeuer', 'Jugendfeuerwehr Wachtberg'], ['hospiz', 'Hospizverein Bonn'], ['sportkids', 'Sportstiftung Kids in Bewegung']];
  // ============================================================ Privatleben: Lebenshaltung, Familie, Job, Anlagen
  var JOBS = {
    uni: { study: ['Studium (BWL)', 48, 450, 650], ladder: [['Junior Consultant', 3200], ['Consultant', 4200], ['Senior Consultant', 5600], ['Manager', 7400], ['Director', 10500], ['Partner', 15000]] },
    ausb: { study: ['Ausbildung (Industriekaufmann)', 36, 950], ladder: [['Sachbearbeiter', 2500], ['Fachkraft', 3000], ['Teamleiter', 3700], ['Abteilungsleiter', 4600], ['Betriebsleiter', 5800]] },
    arbeit: { study: null, ladder: [['Lagerhelfer', 1900], ['Fahrer', 2200], ['Schichtleiter', 2700], ['Lagerleiter', 3300], ['Logistikleiter', 4000]] }
  };
  // Minijobs: nebenher (nicht neben einem Vollzeitjob), jederzeit kündbar
  var MINIJOBS = [['zeitung', 'Zeitungen austragen', 320, '📰'], ['nachhilfe', 'Nachhilfe geben', 400, '📚'], ['kellner', 'Kellnern am Wochenende', 538, '🍽️'], ['tanke', 'Tankstellen-Aushilfe', 538, '⛽'], ['kasse', 'Supermarkt-Kasse', 480, '🛒'], ['lager', 'Lagerhilfe', 450, '📦'], ['kurier', 'Fahrradkurier', 500, '🚲'], ['hund', 'Hundesitter', 300, '🐕'], ['event', 'Event-Aushilfe', 420, '🎪'], ['garten', 'Gartenhilfe', 360, '🌿']];
  function miniWeek(S) { var w = Math.floor(diffDays('2020-01-06', S.date) / 7), out = [], k = 0; while (out.length < 3 && k < 30) { var j = (w * 7 + k * 3 + clubSeed(S.club || 'x')) % MINIJOBS.length; if (out.indexOf(MINIJOBS[j]) < 0) out.push(MINIJOBS[j]); k++; } return out; }
  function miniBlock(S) { var J = privInit(S).job; return J.stage === 'job' ? 'Neben deinem Hauptjob ist kein Minijob drin.' : S.lvl <= 5 ? 'Als Trainer ab der Mittelrheinliga bleibt keine Zeit mehr für einen Minijob.' : ''; }
  function privBal(S) { // Monatsbilanz nach allen Abzügen
    var P = privInit(S), J = P.job, inc = [], exp = [];
    if (S.mc) inc.push(['Trainergehalt', S.mc.sal]); var skb = S.mc ? Math.round(S.mc.sal * skv(S, 'priv')) : 0; if (skb) inc.push(['Bonus (Fähigkeiten)', skb]);
    if (J.stage === 'job') inc.push([J.title, Math.round(J.sal * langF(S))]); if (J.stage === 'study') { inc.push([J.title + ' (BAföG/Ausbildungsgeld)', J.sal]); var tu = (JOBS[J.path].study || [])[3]; if (tu) exp.push(['Studiengebühr', tu]); }
    if (P.mini) inc.push(['Minijob: ' + P.mini.n, P.mini.sal]); if (S.ps && S.ps.to >= S.season) inc.push(['Persönlicher Sponsor', Math.round(S.ps.amt / 12)]);
    if (P.rent) { var it = shopItem(P.rent, S); if (it) exp.push(['Miete ' + it.n, it.rent]); } livingCosts(S).forEach(function (c) { exp.push(c); });
    var a = inc.reduce(function (x, c) { return x + c[1]; }, 0), b = exp.reduce(function (x, c) { return x + c[1]; }, 0);
    return { inc: inc, exp: exp, inS: a, exS: b, net: a - b, hist: (P.hist || []).slice(-12), mini: P.mini || null, minis: miniWeek(S), miniBlock: miniBlock(S) };
  }
  // 100 fiktive Aktien (keine echten Firmennamen)
var STOCKS = [['MAST', 'Mainstahl AG', 23.02, 0.03, '#009999'], ['VESP', 'Vega Sport AG', 154.45, 0.009, '#3c3c3c'], ['LISP', 'Licht Sport AG', 8.95, 0.032, '#76b900'], ['SOCH', 'Sonnen Chemie AG', 10.5, 0.011, '#c8102e'], ['SIBA', 'Silber Bau AG', 313.51, 0.012, '#0faaff'], ['WESO', 'West Solar AG', 82.86, 0.026, '#009999'], ['SUGA', 'Süd Gaming SE', 9.15, 0.036, '#0faaff'], ['KRFO', 'Kristall Foods AG', 20.16, 0.029, '#009999'], ['OROP', 'Orion Optik AG', 92.91, 0.017, '#003781'], ['ADRE', 'Adler Reisen AG', 42.9, 0.021, '#009999'], ['WEAI', 'Weser Airlines AG', 51.47, 0.036, '#d0569f'], ['RUTE', 'Ruhr Telekom AG', 252.47, 0.027, '#0faaff'], ['GOVE', 'Gold Versicherung SE', 29.93, 0.036, '#ff9900'], ['EIGA', 'Eifel Gaming SE', 26.35, 0.025, '#1c69d4'], ['MAGA', 'Main Gaming SE', 95.09, 0.012, '#a07a1a'], ['EIFO', 'Eifel Foods AG', 310.3, 0.032, '#c8102e'], ['FAOP', 'Falken Optik AG', 16.71, 0.025, '#1c69d4'], ['ORCH', 'Orion Chemie AG', 31.19, 0.016, '#003781'], ['NOEN', 'Nova Energie SE', 102.15, 0.033, '#ff9900'], ['BESO', 'Berg Solar AG', 7.46, 0.038, '#3c3c3c'], ['FAME', 'Falken Medien AG', 220.19, 0.022, '#003781'], ['MOEN', 'Mosel Energie SE', 12.13, 0.008, '#e20074'], ['SUCH', 'Süd Chemie AG', 4.91, 0.025, '#4b8bc4'], ['HABR', 'Hansa Brauerei AG', 39.04, 0.019, '#a07a1a'], ['WEHA', 'Wellen Halbleiter AG', 4.46, 0.021, '#e8944f'], ['ELVE', 'Elb Versicherung SE', 8.17, 0.017, '#003781'], ['OSFO', 'Ost Foods AG', 111.33, 0.04, '#1c69d4'], ['WERE', 'West Reisen AG', 25.91, 0.036, '#e20074'], ['EIME', 'Eifel Medien AG', 59.04, 0.017, '#4b8bc4'], ['RUBA', 'Ruhr Bank AG', 265.34, 0.01, '#e8944f'], ['ALWE', 'Alpenwerk AG', 18.77, 0.01, '#009999'], ['TAEN', 'Taunus Energie SE', 19.07, 0.038, '#003781'], ['VETE', 'Vega Textil AG', 290.36, 0.025, '#9945ff'], ['WEGA', 'Weser Gaming SE', 206.65, 0.029, '#d0569f'], ['OSST', 'Oststahl AG', 15.37, 0.025, '#9945ff'], ['DOBA', 'Donau Bau AG', 26.78, 0.022, '#2f9e5b'], ['ATOP', 'Atlas Optik AG', 257.47, 0.011, '#ff9900'], ['SILO', 'Sieben Logistik AG', 94.24, 0.027, '#e8944f'], ['SIRO', 'Sieben Robotics SE', 16.19, 0.028, '#9945ff'], ['SUST', 'Südstahl AG', 12.01, 0.032, '#a07a1a'], ['QUST', 'Quantenstahl AG', 6.02, 0.025, '#b45fd9'], ['VESO', 'Vega Solar AG', 7.0, 0.037, '#3c3c3c'], ['HAGA', 'Hansa Gaming SE', 98.01, 0.039, '#ff9900'], ['HAMO', 'Hansa Motoren AG', 29.36, 0.014, '#e8944f'], ['POGA', 'Polar Gaming SE', 165.38, 0.011, '#e20074'], ['BEVE', 'Berg Versicherung SE', 8.39, 0.015, '#3c3c3c'], ['KUCH', 'Kupfer Chemie AG', 26.94, 0.029, '#0faaff'], ['LICH', 'Licht Chemie AG', 28.36, 0.027, '#9945ff'], ['SULO', 'Süd Logistik AG', 54.57, 0.027, '#c8102e'], ['EIAI', 'Eisen Airlines AG', 219.54, 0.038, '#3c3c3c'], ['GOSP', 'Gold Sport AG', 86.42, 0.029, '#c8102e'], ['FARO', 'Falken Robotics SE', 60.84, 0.026, '#3c3c3c'], ['TATE', 'Taunus Textil AG', 60.61, 0.017, '#a07a1a'], ['ADFO', 'Adler Foods AG', 243.58, 0.013, '#009999'], ['STRO', 'Stern Robotics SE', 20.92, 0.03, '#003781'], ['HAPH', 'Harz Pharma AG', 3.66, 0.023, '#3c3c3c'], ['EIBR', 'Eisen Brauerei AG', 13.79, 0.033, '#003781'], ['TAMO', 'Taunus Mobility AG', 16.98, 0.023, '#d0569f'], ['FESO', 'Feld Solar AG', 365.26, 0.034, '#a07a1a'], ['QUFO', 'Quanten Foods AG', 94.37, 0.032, '#9945ff'], ['FEBR', 'Feld Brauerei AG', 47.46, 0.016, '#e8944f'], ['ADSO', 'Adler Solar AG', 5.18, 0.031, '#009999'], ['POSP', 'Polar Sport AG', 66.59, 0.02, '#1c69d4'], ['NOME', 'Nova Medien AG', 114.27, 0.035, '#a07a1a'], ['LIHA', 'Licht Halbleiter AG', 99.99, 0.015, '#a07a1a'], ['TAST', 'Talstahl AG', 335.41, 0.013, '#d0569f'], ['DOTE', 'Donau Textil AG', 269.41, 0.009, '#a07a1a'], ['DOFO', 'Donau Foods AG', 46.02, 0.018, '#0faaff'], ['KRRE', 'Kristall Reisen AG', 62.16, 0.009, '#e20074'], ['SIVE', 'Silber Versicherung SE', 20.55, 0.038, '#3c3c3c'], ['NOTE', 'Nord Textil AG', 294.23, 0.038, '#d0569f'], ['SIRE', 'Sieben Reisen AG', 388.4, 0.012, '#76b900'], ['FALO', 'Falken Logistik AG', 112.89, 0.021, '#3c3c3c'], ['OSAI', 'Ost Airlines AG', 82.72, 0.035, '#c8102e'], ['NOWE', 'Novawerk AG', 198.58, 0.029, '#1c69d4'], ['POBR', 'Polar Brauerei AG', 116.08, 0.031, '#a07a1a'], ['TAHA', 'Taunus Halbleiter AG', 277.09, 0.033, '#d0569f'], ['SOHA', 'Sonnen Halbleiter AG', 19.0, 0.017, '#d0569f'], ['HARE', 'Hansa Reisen AG', 15.55, 0.024, '#e8944f'], ['TABR', 'Taunus Brauerei AG', 188.91, 0.03, '#9945ff'], ['FEBA', 'Feld Bank AG', 5.31, 0.03, '#4b8bc4'], ['WIST', 'Windstahl AG', 42.16, 0.029, '#b45fd9'], ['FEBE', 'Feld Bau AG', 185.85, 0.023, '#2f9e5b'], ['SIVF', 'Sieben Versicherung SE', 118.26, 0.038, '#76b900'], ['HABA', 'Harz Bank AG', 268.67, 0.027, '#c8102e'], ['HASO', 'Harz Software SE', 84.53, 0.012, '#e20074'], ['ALSO', 'Alpen Solar AG', 114.41, 0.011, '#1c69d4'], ['NOSO', 'Nova Software SE', 15.67, 0.016, '#4b8bc4'], ['MAEN', 'Main Energie SE', 13.82, 0.013, '#2f9e5b'], ['WEVE', 'West Versicherung SE', 274.02, 0.015, '#0faaff'], ['WIFO', 'Wind Foods AG', 217.23, 0.028, '#c8102e'], ['WEOP', 'Weser Optik AG', 8.7, 0.026, '#76b900'], ['RHSP', 'Rhein Sport AG', 15.16, 0.017, '#2f9e5b'], ['WEEN', 'Wellen Energie SE', 332.1, 0.027, '#3c3c3c'], ['SOLO', 'Sonnen Logistik AG', 17.7, 0.01, '#76b900'], ['FATE', 'Falken Textil AG', 23.22, 0.023, '#2f9e5b'], ['KUTE', 'Kupfer Telekom AG', 16.51, 0.036, '#e8944f'], ['ORTE', 'Orion Telekom AG', 295.78, 0.027, '#1c69d4'], ['KRAI', 'Kristall Airlines AG', 230.56, 0.022, '#9945ff'], ['TAAI', 'Taunus Airlines AG', 101.42, 0.019, '#e8944f']];
  var STOCK_OLD = {'AAPL': 'MAST', 'MSFT': 'VESP', 'NVDA': 'LISP', 'AMZN': 'SOCH', 'TSLA': 'SIBA', 'SAP': 'WESO', 'ADS': 'SUGA', 'PUM': 'KRFO', 'BMW': 'OROP', 'DTE': 'ADRE', 'MBG': 'WEAI', 'ALV': 'RUTE', 'SIE': 'GOVE', 'BAYN': 'EIGA', 'GOOGL': 'MAGA', 'META': 'EIFO', 'NFLX': 'FAOP', 'NKE': 'ORCH', 'DHL': 'NOEN', 'LHA': 'BESO'}; // alte Ticker → neue (Spielstände umziehen)
  var CRYPTO = [['BTC', 'Bitcoin', 85000, 0.045, '#f7931a', 0.0006], ['ETH', 'Ethereum', 3200, 0.055, '#627eea', 0.0005], ['SOL', 'Solana', 150, 0.07, '#9945ff', 0.0006], ['XRP', 'XRP', 2.2, 0.065, '#23292f', 0.0003], ['DOGE', 'Dogecoin', 0.18, 0.09, '#c2a633', 0.0002], ['ADA', 'Cardano', 0.7, 0.07, '#0033ad', 0.0002], ['WBC', 'Wachtberg-Coin', 0.5, 0.12, '#8fc852', 0.0025], ['LAEND', 'Ländchen-Token', 0.08, 0.15, '#2f9e5b', 0.0015], ['KICK', 'KickCoin', 1.2, 0.11, '#e8944f', 0.0008], ['DRCH', 'Drachenfels-Coin', 3, 0.1, '#b45fd9', -0.0004], ['STRX', 'Strafraum-Coin', 0.2982, 0.126, '#627eea', 0.0002], ['ABSX', 'Abseits-Coin', 4.8132, 0.093, '#2f9e5b', -0.0003], ['FLAX', 'Flanke-Coin', 0.3878, 0.11, '#4b8bc4', 0.0011], ['LIBX', 'Libero-Coin', 0.5236, 0.105, '#9945ff', 0.0001], ['KONX', 'Konter-Coin', 40.4754, 0.074, '#4b8bc4', 0.0005], ['PREX', 'Pressing-Coin', 86.8927, 0.065, '#2f9e5b', 0.0004], ['ELFX', 'Elfer-Coin', 7.1064, 0.089, '#2f9e5b', 0.0009], ['FALX', 'Fallrückzieher-Coin', 71.0587, 0.1, '#b45fd9', 0.0008], ['NACX', 'Nachspielzeit-Coin', 8.8315, 0.073, '#b45fd9', -0.0002], ['VIEX', 'Viererkette-Coin', 81.8448, 0.106, '#b45fd9', 0.0001], ['DOPX', 'Doppelpass-Coin', 0.3217, 0.127, '#e8944f', 0.0004], ['TORX', 'Torjäger-Coin', 85.6716, 0.106, '#c2a633', 0.0001], ['RASX', 'Rasen-Coin', 6.1835, 0.088, '#4b8bc4', -0.0002], ['FLUX', 'Flutlicht-Coin', 0.0625, 0.092, '#c2a633', -0.0003], ['ANSX', 'Anstoß-Coin', 5.1702, 0.129, '#e8944f', 0.0007], ['ECKX', 'Ecke-Coin', 0.888, 0.072, '#9945ff', -0.0002], ['GRAX', 'Grätsche-Coin', 0.5961, 0.081, '#f7931a', -0.0002], ['KOPX', 'Kopfball-Coin', 0.4858, 0.115, '#d0569f', 0.0011], ['ZEHX', 'Zehner-Coin', 57.514, 0.124, '#0faaff', 0.0002], ['SECX', 'Sechser-Coin', 0.3608, 0.065, '#2f9e5b', 0.0003]];
  var ALLSTK = STOCKS.concat(CRYPTO);
  function stockVis(S) { return STOCKS; }
  var DEPOS = { tagesgeld: ['Tagesgeld', 0, 0.02, 0], fest1: ['Festgeld 1 Jahr', 12, 0.03, 0], fest3: ['Festgeld 3 Jahre', 36, 0.037, 0], etf: ['ETF-Sparplan (Welt)', 12, 0.07, 0.15], fonds: ['Aktienfonds (Risiko)', 24, 0.1, 0.28] };
  var DATE_TXT = {
    tinder: ['Kein einziges Match diese Woche. Vielleicht doch ein anderes Profilbild?', 'Ihr Profilbild war mindestens zehn Jahre alt.', 'Nach drei Nachrichten wurdest du geghostet.', 'Sie hat nur gefragt, ob du Freikarten besorgen kannst.', 'Match! Sie hat aber nach „Fußballtrainer“ sofort aufgehört zu schreiben.', 'Das Date kam 40 Minuten zu spät und ging nach 20.', 'Sie wollte eigentlich nur ein Selfie mit dem Trainer.'],
    ausgehen: ['Die Bar war voll, aber keine hat sich für dich interessiert.', 'Du hast den ganzen Abend über Viererkette geredet. Sie ist gegangen.', 'Sie hat den ganzen Abend nur von ihrem Ex erzählt.', 'Kein Funke. Freundlich verabschiedet.', 'Ihr Freund kam vom Klo zurück. Autsch.', 'Sie ist Fan vom Lokalrivalen. Das wird nichts.', 'Du hattest deinen Spaß – mehr aber auch nicht.', 'Match beim Fan-Stammtisch? Leider nicht – sie wollte nur ein Autogramm für ihren Sohn.', 'Ihr habt euch beim Stammtisch super verstanden – bis sie erfahren hat, dass du die Startelf machst und ihr Bruder auf der Bank sitzt.'],
    freunde: ['Die Freundin deiner Kumpels hatte schon einen anderen im Blick.', 'Nett, aber eher wie eine Cousine. Kein Funke.', 'Sie hat sich nach dem Essen nicht mehr gemeldet.', 'Eure Freunde waren begeisterter als ihr beiden.', 'Sie zieht nächsten Monat nach München.', 'Ihr habt euch nur über die Gastgeber unterhalten.', 'Gut gemeint von deinen Freunden – aber leider nicht dein Typ.']
  };
  var JOB_W = ['Lehrerin', 'Ärztin', 'Krankenpflegerin', 'Architektin', 'Polizistin', 'Bankkauffrau', 'Grafikdesignerin', 'Rechtsanwältin', 'Erzieherin', 'Physiotherapeutin', 'Ingenieurin', 'Friseurin', 'Unternehmerin', 'Journalistin', 'Steuerberaterin'];
  var VN_W = ['Laura', 'Julia', 'Lena', 'Sarah', 'Anna', 'Lisa', 'Marie', 'Sophie', 'Katharina', 'Nina', 'Jana', 'Christina', 'Vanessa', 'Melanie', 'Svenja', 'Leonie', 'Carina', 'Elif', 'Aylin', 'Natalia'];
  function relImg(S, D) { var L = D.relImgs || []; if (!L.length) return ''; var P = S.priv; P.relUsed = (P.relUsed || []).filter(function (u) { return L.indexOf(u) >= 0; }); var free = L.filter(function (u) { return P.relUsed.indexOf(u) < 0; }); if (!free.length) { P.relUsed = []; free = L.slice(); } var u = pick(free); P.relUsed.push(u); return u; }
  function privInit(S) {
    var P = S.priv = S.priv || { cash: 2500, owned: {}, rent: null, log: [] };
    if (!P.fam) P.fam = { partner: null, kids: [], lastDate: null, lastTime: null, pend: null };
    if (!P.job) P.job = { stage: 'abi', path: null, title: null, sal: 0, since: null, step: 0, months: 0 };
    if (!P.inv) P.inv = { stocks: {}, dep: [], prices: {}, hist: {} }; if (!P.inv.v2) { P.inv.v2 = 1; Object.keys(STOCK_OLD).forEach(function (o) { var nw = STOCK_OLD[o]; if (P.inv.stocks[o]) { var oldPx = P.inv.prices[o] || 1, nb = STOCKS.filter(function (x) { return x[0] === nw; })[0]; var val = P.inv.stocks[o] * oldPx, np = nb ? nb[2] : 1; P.inv.stocks[nw] = Math.max(1, Math.round(val / np)); P.inv.cost = P.inv.cost || {}; P.inv.cost[nw] = P.inv.cost[o] || val; delete P.inv.cost[o]; } delete P.inv.stocks[o]; delete P.inv.prices[o]; delete P.inv.hist[o]; }); } ALLSTK.forEach(function (x) { if (P.inv.prices[x[0]] == null) { P.inv.prices[x[0]] = x[2]; P.inv.hist[x[0]] = [x[2]]; } });
    if (!P.don) P.don = { season: null, n: 0, club: false };
    return P;
  }
  function livingCosts(S) {
    var P = privInit(S), o = P.owned || {}; var c = [];
    var home = o.villa ? 'villa' : o.haus ? 'haus' : o.etw ? 'etw' : P.rent;
    var util = { villa: 420, haus: 220, etw: 140, penthouse: 190, hausmiete: 200, wohnung: 110, wg: 60 }[home] || 40;
    c.push(['Strom', Math.round(util * 0.55)], ['Wasser & Heizung', Math.round(util * 0.45)]);
    var car = o.ferrari ? 650 : o.porsche ? 430 : o.bmw ? 320 : o.golf ? 170 : 0; var fuel = car ? car : o.ebike ? 15 : 55;
    c.push([car ? 'Benzin' : o.ebike ? 'E-Bike-Akku' : 'ÖPNV-Ticket', fuel]); if (car) c.push(['Kfz-Versicherung', Math.round(car * 0.35)]);
    var kids = (P.fam.kids || []).length; c.push(['Essen & Trinken', 280 + (P.fam.partner ? 160 : 0) + kids * 180]);
    c.push(['Kleidung', 70 + (o.uhr ? 30 : 0) + (o.anzug ? 20 : 0)]); c.push(['Handy & Internet', o.iphone ? 55 : 35]);
    if (o.yacht) c.push(['Liegeplatz Yacht', 1800]); if (kids) c.push(['Kinder (Kita, Sport)', kids * 250]);
    return c;
  }
  function econMonthly(S, D) {
    var L = S.attLog || [], from = S.attIdx || 0; if (from > L.length) from = 0; var part = L.slice(from); S.attIdx = L.length;
    var avg = part.length ? Math.round(part.reduce(function (a, b) { return a + b; }, 0) / part.length) : null;
    var r = S.ticket / Math.max(0.5, (D.lv[S.lvl] && D.lv[S.lvl].ticket) || 2), pm = priceMood(S), df = clamp((1 - r) * 2.5, -3, 1.5) + clamp((1 - pm) * 2, -2, 1);
    S.fans = clamp(S.fans + df, 0, 100);
    S.tHist = (S.tHist || []).concat([{ m: addDays(S.date, -2).slice(0, 7), p: S.ticket, att: avg, fans: Math.round(S.fans), df: Math.round(df * 10) / 10 }]).slice(-12);
  }
  function privMonthly(S, D) {
    econMonthly(S, D);
    var P = privInit(S); var J = P.job;
    if (S.ps && S.ps.to >= S.season) { var pm = Math.round(S.ps.amt / 12); P.cash += pm; P.log.unshift([S.date, 'Persönlicher Sponsor ' + S.ps.firm, pm]); } else if (S.ps && S.ps.to < S.season) { S.ps = null; if (has(S, 'psponsor')) psOffers(S, D); }
    if (S.yc && Object.keys(S.yc).some(function (k) { return S.yc[k] <= S.date || ((S.ycL || {})[k] || 1) > 1; })) ycMonthly(S, D);
    if (P.mini) { if (J.stage === 'job' || S.lvl <= 5) { msg(S, 'privat', '🧺 Minijob ' + P.mini.n + ' beendet – ' + (J.stage === 'job' ? 'neben dem Hauptjob' : 'als Trainer ab der Mittelrheinliga') + ' geht das nicht mehr.'); P.mini = null; } else { P.cash += P.mini.sal; P.log.unshift([S.date, 'Minijob ' + P.mini.n, P.mini.sal]); } }
    if (J.stage === 'study') { J.months++; P.cash += J.sal; P.log.unshift([S.date, J.title, J.sal]); var tu0 = (JOBS[J.path].study || [])[3]; if (tu0) { P.cash -= tu0; P.log.unshift([S.date, 'Studiengebühr', -tu0]); } var st = JOBS[J.path].study; if (J.months >= st[1]) { J.stage = 'done'; J.title = null; J.sal = 0; infoMail(S, 'Prüfungsamt', 'Abschluss geschafft!', 'Glückwunsch, du hast ' + st[0] + ' abgeschlossen. Jetzt kannst du dich auf einen Job bewerben.', 'info'); } }
    else if (J.stage === 'job') {
      J.months++; var jsal = Math.round(J.sal * langF(S)); P.cash += jsal; P.log.unshift([S.date, 'Gehalt ' + J.title, jsal]);
      if (J.months % 12 === 0) J.sal = Math.round(J.sal * 1.025);
      var lad = JOBS[J.path].ladder; if (J.months >= 18 && J.step < lad.length - 1 && R() < 0.12) { J.step++; J.title = lad[J.step][0]; J.sal = lad[J.step][1]; J.months = 0; infoMail(S, 'Personalabteilung', 'Beförderung!', 'Du wurdest befördert: ' + J.title + ' (' + euro(J.sal) + ' netto/Monat).', 'info'); }
      else if (R() < 0.006) { infoMail(S, 'Personalabteilung', 'Kündigung', 'Leider müssen wir dir als ' + J.title + ' kündigen. Betriebsbedingt.', 'info'); J.stage = 'done'; J.title = null; J.sal = 0; }
    }
    if (P.rent && P.rentEnd && S.date >= P.rentEnd) { infoMail(S, 'Vermieter', 'Auszug', 'Dein Mietvertrag ist beendet.', 'info'); P.rent = null; P.rentEnd = null; }
    livingCosts(S).forEach(function (c) { P.cash -= c[1]; P.log.unshift([S.date, c[0], -c[1]]); });
    var F = P.fam;
    if (F.partner) {
      var pr = F.partner; pr.rel = clamp(pr.rel + rnd(-4, 2), 0, 100);
      if (pr.rel < 15 && R() < 0.4) { infoMail(S, pr.n, 'Es ist vorbei', pr.n + ' hat sich von dir getrennt. Ihr habt euch auseinandergelebt.', 'info'); F.partner = null; }
    }
    if (F.preg && S.date >= F.preg) { F.pend = { g: R() < 0.5 ? 'm' : 'w', born: S.date }; F.preg = null; }
    (P.inv.dep || []).forEach(function (d) { var y0 = DEPOS[d.t]; if (d.t !== 'tagesgeld') { d.cur = Math.round((d.cur || d.amount) * (1 + y0[2] / 12 + gauss() * y0[3] / 3.46)); } (d.hist = d.hist || [d.amount]).push(d.t === 'tagesgeld' ? Math.round(d.amount * (1 + 0.02 / 12)) : d.cur); if (d.hist.length > 24) d.hist.shift(); });
    (P.inv.dep || []).forEach(function (d) { if (!d.done && d.end && S.date >= d.end) { var y = DEPOS[d.t]; var val = Math.round(d.cur || d.amount); d.done = true; d.val = val; P.cash += val; P.log.unshift([S.date, 'Auszahlung ' + y[0], val]); infoMail(S, 'Hausbank', 'Anlage ausgezahlt', y[0] + ': ' + euro(d.amount) + ' wurden zu ' + euro(val) + '.', 'info'); } });
    P.inv.dep = P.inv.dep.filter(function (d) { return !d.done; });
    var tg = P.inv.dep.filter(function (d) { return d.t === 'tagesgeld'; }); tg.forEach(function (d) { d.amount = Math.round(d.amount * (1 + 0.02 / 12)); });
    if (P.log.length > 40) P.log.length = 40; (P.hist = P.hist || []).push([S.date.slice(0, 7), Math.round(P.cash)]); if (P.hist.length > 24) P.hist.shift();
  }
  var TIP_NAMES = ['Thorsten', 'Mehmet', 'Claudia', 'Rüdiger', 'Sandra', 'Kai', 'Jens', 'Bianca', 'Holger', 'Nina'];
  function tipDaily(S, D) {
    var P = privInit(S), T = S.tip;
    if (T && !T.done && S.date >= T.due) { var cur = P.inv.prices[T.k] || T.p0; var tgt = T.p0 * (1 + T.gain); P.inv.prices[T.k] = tgt < 10 ? Math.round(tgt * 10000) / 10000 : Math.round(tgt * 100) / 100; T.done = true; T.p1 = P.inv.prices[T.k]; T.own = (P.inv.stocks || {})[T.k] || 0; S.tipPop = { k: T.k, nm: T.nm, crypto: T.crypto, from: T.from, hob: T.hob, p0: T.p0, p1: T.p1, pct: Math.round((T.p1 / T.p0 - 1) * 1000) / 10, own: T.own, stage: 2 }; return; }
    if (T && !T.done) return;
    var hb = Object.keys(S.hob || {}).filter(function (k) { return (S.hob[k].pct || 0) >= 70; }); if (!hb.length) return;
    if (S.tipSeason === S.season || R() > 0.01) return;
    var crypto = R() < 0.6, pool = crypto ? CRYPTO.filter(function (c) { return c[0] !== 'BTC' && c[0] !== 'ETH'; }) : stockVis(S), a = pick(pool), hk = pick(hb), HB = HOBBIES.filter(function (x) { return x[0] === hk; })[0] || ['', 'deinem Hobby', '⭐'];
    var p0 = P.inv.prices[a[0]] || a[2];
    S.tip = { k: a[0], nm: a[1], crypto: crypto, p0: p0, due: addDays(S.date, 14), gain: rnd(0.12, 0.64), from: pick(TIP_NAMES), hob: HB[1], hic: HB[2], done: false }; S.tipSeason = S.season;
    S.tipPop = { k: a[0], nm: a[1], crypto: crypto, from: S.tip.from, hob: HB[1], hic: HB[2], p0: p0, stage: 1 };
  }
  function stocksDaily(S) {
    var P = privInit(S); ALLSTK.forEach(function (x) { var p = P.inv.prices[x[0]]; p = Math.max(x[2] * 0.01, p * (1 + (x[5] != null ? x[5] : 0.0002) + gauss() * x[3] * 0.6)); if (x[5] != null && x[2] < 5 && R() < 0.004) p *= R() < 0.55 ? rnd(1.6, 3.2) : rnd(0.25, 0.6); P.inv.prices[x[0]] = p < 10 ? Math.round(p * 10000) / 10000 : Math.round(p * 100) / 100; var h = P.inv.hist[x[0]]; if (dow(S.date) === 1) { h.push(P.inv.prices[x[0]]); if (h.length > 26) h.shift(); } });
  }
  function kidsToAcademy(S, D) {
    var P = privInit(S); (P.fam.kids || []).forEach(function (k) { if (k.academy) return; var age = yr(S.date) - yr(k.born); if (age >= 14) { var y = newYouth(S, D, true); y.n = k.n + ' ' + String(S.full).split(' ').slice(-1)[0]; y.age = 14; y.tal = Math.max(4, y.tal); y.pot = Math.max(y.pot, lvMid(D, S.lvl) + 10); S.youth.push(y); k.academy = true; infoMail(S, 'Academy', 'Dein Kind ist in der Academy!', k.n + ' ist jetzt 14 und spielt ab sofort in der Academy des ' + D.club + '. Ein echtes Talent!', 'info'); } });
  }
  var MSAL = { 11: 150, 10: 250, 9: 350, 8: 450, 7: 600, 6: 1000, 5: 1800, 4: 4000, 3: 12000, 2: 35000, 1: 110000 };
  // Monatsgehalt-Spannen je Liga (Bundesliga zusätzlich nach Erfolgen), plus 2 % je Manager-Level
  var SALBAND = { 12: [80, 150], 11: [100, 200], 10: [150, 250], 9: [200, 300], 8: [350, 500], 7: [500, 650], 6: [700, 900], 5: [800, 1200], 4: [1500, 3000], 3: [2500, 7500], 2: [10000, 50000], 1: [50000, 100000] };
  function salBand(S) {
    if (S.lvl === 1) { var t = S.blTitles || 0, b = S.blBest || 99; if (t > 3) return [1000000, 2500000]; if (t >= 1) return [500000, 1000000]; if (b <= 3) return [250000, 500000]; if (b <= 9) return [100000, 250000]; }
    return SALBAND[S.lvl] || [500, 650];
  }
  function salRoll(S) { var b = salBand(S); return nice((b[0] + R() * (b[1] - b[0])) * (1 + (S.mlvl || 1) * 0.02) * qualF(S)); }
  // Reichweite: pro Woche genau eine Aktion – Post, Werbung oder Flyer
  var SOCMSG = 'Diese Woche gab es schon eine Aktion (Post, Werbung oder Flyer) – nur eine pro Woche.';
  function socUsed(S) { var wk = addDays(S.date, -((dow(S.date) + 6) % 7)); return S.socWeek === wk || S.adWeek === wk || S.flyW === wkStart(S); }
  function mgrInit(S, D) { if (!S.mc) S.mc = { sal: salRoll(S), until: seasonEndYear(S) + 1, startLvl: D.startLvl, offer: null }; if (!S.priv) S.priv = { cash: 0, owned: {}, rent: null, log: [] }; if (S.relStreak == null) S.relStreak = 0; }
  function mgrMonthsLeft(S) { var m = mon(S.date); var endY = S.mc.until; var y = yr(S.date); return (endY - y) * 12 + (6 - m) + (m <= 6 ? 0 : 0); }
  function mgrCan(S, D) {
    var tab = S.fix && S.fix.length ? table(S) : []; var me = tab.filter(function (r) { return r.svw; })[0]; var L = D.lv[S.lvl];
    var inDown = me && L && me.rank > tab.length - L.down - L.downRel && me.sp > 5;
    if (S.relStreak >= 2 && inDown) return { ok: false, why: 'Zwei Abstiege in Folge und schon wieder auf einem Abstiegsplatz – der Vorstand verlängert nicht.' };
    if (S.board < 25) return { ok: false, why: 'Der Vorstand hat kein Vertrauen mehr in dich.' };
    return { ok: true };
  }
  function mgrOffer(S, D) {
    // neues Angebot: Spanne der aktuellen Liga, Vorstandsvertrauen verschiebt leicht; nie unter dem bisherigen Gehalt, wenn erfolgreich
    var roll = salRoll(S) * (0.92 + S.board / 100 * 0.16) * (1 - 0.08 * (S.relStreak || 0));
    var sal = nice(S.board >= 60 ? Math.max(roll, S.mc.sal) : roll);
    return { sal: sal, until: seasonEndYear(S) + 2 };
  }
  var SHOP = [
    ['iphone', 'Technik', 'iPhone 17 Pro', 1299, 0, 'phone'], ['airpods', 'Technik', 'AirPods Pro', 279, 0, 'buds'], ['tv', 'Technik', 'OLED-TV 65 Zoll', 1899, 0, 'tv'], ['ps5', 'Technik', 'PlayStation 5 Pro', 799, 0, 'console'], ['gta6', 'Technik', 'GTA 6', 79, 0, 'game'], ['cod', 'Technik', 'Call of Duty', 79, 0, 'game'], ['eafc', 'Technik', 'EA FC 27', 79, 0, 'game'], ['macbook', 'Technik', 'MacBook Pro', 2499, 0, 'laptop'], ['gamingpc', 'Technik', 'Gaming-PC', 2999, 0, 'pc'],
    ['sneaker', 'Mode', 'Limitierte Sneaker', 220, 0, 'shoe'], ['anzug', 'Mode', 'Maßanzug für die Seitenlinie', 1400, 0, 'suit'], ['uhr', 'Mode', 'Luxusuhr', 9800, 0, 'watch'],
    ['ebike', 'Fahrzeuge', 'E-Bike', 3500, 0, 'bike'], ['golf', 'Fahrzeuge', 'VW Golf', 34000, 0, 'car1'], ['bmw', 'Fahrzeuge', 'BMW M3', 98000, 0, 'car2'], ['porsche', 'Fahrzeuge', 'Porsche 911', 149000, 0, 'car3'], ['ferrari', 'Fahrzeuge', 'Ferrari', 290000, 0, 'car4'],
    ['wg', 'Wohnen', 'WG-Zimmer in Bonn', 0, 450, 'room'], ['wohnung', 'Wohnen', '2-Zimmer-Wohnung in Wachtberg', 0, 850, 'flat'], ['hausmiete', 'Wohnen', 'Haus zur Miete in Berkum', 0, 1900, 'house'], ['penthouse', 'Wohnen', 'Penthouse am Rhein', 0, 3800, 'pent'],
    ['etw', 'Wohnen', 'Eigentumswohnung kaufen', 320000, 0, 'flat'], ['haus', 'Wohnen', 'Einfamilienhaus in Wachtberg kaufen', 650000, 0, 'house'], ['villa', 'Wohnen', 'Villa am Rhein kaufen', 2400000, 0, 'villa'],
    ['mallorca', 'Freizeit', 'Urlaub auf Mallorca', 1800, 0, 'beach'], ['dubai', 'Freizeit', 'Luxusurlaub Dubai', 6500, 0, 'plane'], ['yacht', 'Freizeit', 'Yacht', 1200000, 0, 'yacht']
  ];
  function shopItem(id, S) { var r = SHOP.filter(function (x) { return x[0] === id; })[0]; return r ? { id: r[0], cat: r[1], n: rxL(S, r[2]), price: r[3], rent: r[4], ic: r[5] } : null; }
  function mgrMonthly(S, D) {
    mgrInit(S, D); ownMonthly(S, D); var sal = S.mc.sal; if (S.salCut) { sal = Math.round(sal * 0.75); S.salCut = 0; msg(S, 'finanzen', '✂️ Dein Gehalt wurde diesen Monat um 25 % gekürzt (zweimal hintereinander Sofortergebnis in der 2. Halbzeit).'); } book(S, 'Trainergehalt', -sal); S.priv.cash += sal; S.priv.log.unshift([S.date, 'Gehalt', sal]); var skpb = Math.round(sal * skv(S, 'priv')); if (skpb > 0) { S.priv.cash += skpb; S.priv.log.unshift([S.date, 'Bonus (Fähigkeiten)', skpb]); }
    if (skv(S, 'spMx') || skv(S, 'spM')) book(S, 'Mäzen', [0, 250000, 120000, 60000, 30000, 15000, 8000, 5000, 3000, 2000, 1500, 1000, 800][S.lvl] || 800);
    if (skv(S, 'mgM')) { S.jokers = (S.jokers || 0) + 1; msg(S, 'erfolg', '🃏 Legende: Dein monatlicher Joker ist da.'); }
    if (S.priv.rent) { var it = shopItem(S.priv.rent, S); if (S.priv.cash >= it.rent) { S.priv.cash -= it.rent; S.priv.log.unshift([S.date, 'Miete ' + it.n, -it.rent]); } else { infoMail(S, 'Vermieter', 'Kündigung: ' + it.n, 'Die Miete konnte nicht bezahlt werden. Der Mietvertrag für „' + it.n + '“ ist beendet.', 'info'); S.priv.rent = null; } }
    if (S.priv.log.length > 30) S.priv.log.length = 30;
    if (!S.mc.offer && mgrMonthsLeft(S) <= 12 && S.board >= 70 && R() < 0.35 && mgrCan(S, D).ok) {
      var of = mgrOffer(S, D); S.mc.offer = of;
      actMail(S, 'Vorstand ' + D.club, 'Vertragsverlängerung für dich', 'Wir sind sehr zufrieden mit deiner Arbeit und möchten deinen Vertrag vorzeitig bis 06/' + of.until + ' verlängern. Wir bieten ' + euro(of.sal) + ' im Monat.', [{ label: 'Annehmen', fx: '' }, { label: 'Mehr fordern (+15 %)', fx: '' }, { label: 'Später entscheiden', fx: '' }, { label: 'Ablehnen', fx: '' }], 'mgr', of);
    }
  }
  function mgrSeasonEnd(S, D, result) {
    mgrInit(S, D);
    S.relStreak = result === 'Abstieg' ? (S.relStreak || 0) + 1 : 0;
    if (S.mc.until <= S.season + 1 - 0) {
      if (S.mc.until > yr(S.date)) return;
      var c = mgrCan(S, D);
      if (!c.ok) { fire(S, 'Dein Vertrag ist ausgelaufen und wurde nicht verlängert. ' + c.why); return; }
      var of = mgrOffer(S, D); S.mc.sal = of.sal; S.mc.until = seasonEndYear(S) + 2; S.mc.offer = null;
      infoMail(S, 'Vorstand ' + D.club, 'Dein Vertrag wurde verlängert', 'Dein Vertrag lief aus – der Vorstand hat ihn bis 06/' + S.mc.until + ' verlängert. Neues Gehalt: ' + euro(S.mc.sal) + ' im Monat.', 'info');
    }
  }
  function blockingMails(S) { return (S.mails || []).filter(function (m) { return !m.answered && !m.info; }).length; }
  function levelUp(S) {
    var nl = levelOf(S.xp || 0).lvl; if (nl <= (S.mlvl || 1)) return null;
    var old = S.mlvl || 1; S.mlvl = nl; skCoin(S, nl - old, 'Manager-Level ' + nl);
    // Neu freigeschaltete Bereiche wieder als NEU markieren (Highlight in der Navigation)
    if (!S.featSeen) { S.featSeen = {}; FEATURES.forEach(function (f) { if (f[0] <= old) S.featSeen[f[1]] = true; }); } FEATURES.forEach(function (f) { if (f[0] > old && f[0] <= nl) delete S.featSeen[f[1]]; });
    var feats = FEATURES.filter(function (f) { return f[0] > old && f[0] <= nl && !(f[1] === 'aufstellung' && S.aufstOk); }).map(function (f) { return { lvl: f[0], k: f[1], n: f[2], d: f[3] }; });
    msg(S, 'erfolg', '⭐ Manager-Level ' + nl + ' erreicht!' + (feats.length ? ' Neu: ' + feats.map(function (f) { return f.n; }).join(', ') : ''));
    return { lvl: nl, feats: feats };
  }
  function removeFromXI(S, p) { if (S.lineup.xi) S.lineup.xi = S.lineup.xi.map(function (id) { return id === p.id ? null : id; }); }
  function pitchCost(S, D) { var full = 120000; var sub = S.lvl >= 5 ? 0.6 : 0.2; return { full: full, sub: nice(full * sub), own: nice(full * (1 - sub)) }; }
  function testOpps(S, D) {
    var out = []; var rr = srng(hashS(S.season + '|' + (S.salt || 0) + '|' + (mon(S.date) >= 9 || mon(S.date) <= 2 ? 'w' : 's') + '|' + Math.floor((S.days || 0) / 40)));
    for (var dl = -2; dl <= 2; dl++) {
      var l = S.lvl + dl; if (l < 1 || l > D.maxLvl) continue; var list = S.world.lv[l].filter(function (t) { return !t.svw; }).slice();
      for (var q = list.length - 1; q > 0; q--) { var j = Math.floor(rr() * (q + 1)); var tmp = list[q]; list[q] = list[j]; list[j] = tmp; }
      var k = Math.min(3, list.length);
      for (var i = 0; i < k; i++) { var t = list[i]; if (out.some(function (o) { return o.n === t.n; })) continue; var ch = dl >= 0 ? 90 : clamp(70 + dl * 20, 15, 90); out.push({ n: t.n, s: Math.max(1, t.s), l: l, liga: D.lv[l].short, chance: ch }); }
    }
    return out;
  }
  function jokPt(S, n) {
    S.jok = S.jok && S.jok.s === S.season ? S.jok : { s: S.season, pts: 0, got: S.jok && S.jok.s === S.season ? S.jok.got : false };
    S.jok.pts += n; if (!S.jok.got && !firstHalf(S) && S.jok.pts >= 14 && R() < 0.06 * (S.jok.pts - 12)) { S.jok.got = true; S.jokers = (S.jokers || 0) + 1; S.jokNew = true; infoMail(S, 'Fanclub', '🃏 Ihr habt einen Joker verdient!', 'Euer Einsatz für die Fans und auf Social Media hat sich herumgesprochen – als Dank gibt es einen Joker. Mit ihm kannst du direkt nach einem Spiel die Zeit zurückdrehen und das Spiel wiederholen. Max. 1 Joker pro Saison, du kannst sie sammeln.', 'info'); }
  }
  function fixClash(S, D) {
    var teams = S.world.lv[S.lvl], cupD = []; S.cups.forEach(function (c) { if (c.alive && c.next) cupD.push(c.next.d); });
    if (!cupD.length) return;
    S.fix.forEach(function (f) {
      if (f.hg != null || f.d <= S.date) return; var h = teams[f.h], a = teams[f.a]; if (!h || !a || (!h.svw && !a.svw)) return;
      if (!cupD.some(function (c) { return Math.abs(diffDays(c, f.d)) <= 1; })) return;
      var busy = svwGames(S, D).map(function (g) { return g.d; }), nd = f.d;
      for (var t = 0; t < 30; t++) { nd = addDays(nd, 1); if (busy.every(function (b) { return Math.abs(diffDays(b, nd)) >= 2; })) break; }
      var old = f.d; f.d = nd; infoMail(S, 'Staffelleiter', 'Spielverlegung ' + f.md + '. Spieltag', 'Wegen eures Pokalspiels wurde das Ligaspiel gegen ' + (h.svw ? a.n : h.n) + ' vom ' + fmtD(old) + ' auf den ' + fmtD(nd) + ' verlegt.', 'info');
    });
  }
  function svwGames(S, D) {
    var g = [], teams = S.world.lv[S.lvl];
    S.fix.forEach(function (f) { var h = teams[f.h], a = teams[f.a]; if (!h.svw && !a.svw) return; g.push({ d: f.d, comp: 'liga', label: f.md + '. Spieltag', opp: h.svw ? a.n : h.n, home: !!h.svw, gf: f.hg == null ? null : (h.svw ? f.hg : f.ag), ga: f.hg == null ? null : (h.svw ? f.ag : f.hg) }); });
    S.cups.forEach(function (c) {
      c.games.forEach(function (x) { g.push({ d: x.d, comp: c.k, label: c.name + ' · ' + RNAMES[x.rn], opp: x.opp, home: x.home, gf: x.gf, ga: x.ga, pen: x.pen }); });
      if (c.next) g.push({ d: c.next.d, comp: c.k, label: c.name + ' · ' + RNAMES[c.next.rn], opp: c.next.opp.n, oppLiga: c.next.opp.l && D.lv[c.next.opp.l] ? D.lv[c.next.opp.l].short : '', home: c.next.home, gf: null, ga: null });
    });
    S.tests.forEach(function (t) { g.push({ d: t.d, comp: 'test', label: t.benefiz ? 'Benefizspiel' : 'Testspiel', benefiz: !!t.benefiz, opp: t.opp.n, home: t.home, gf: t.done ? t.gf : null, ga: t.done ? t.ga : null }); });
    if (S.rel && S.rel.games) S.rel.games.forEach(function (x) { g.push({ d: x.d, comp: 'rel', label: 'Relegation', opp: S.rel.opp.n, home: x.home, gf: x.done ? x.gf : null, ga: x.done ? x.ga : null }); });
    return g.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  }

  // ============================================================ Werte für Bestenliste & Ansicht
  // ============================================================ Vereine kaufen (Manager): eigener Verein in 10-%-Schritten, fremde Vereine bis zur 5. Liga (Mittelrheinliga)
  var OWNMAX = 3;
  function ownInit(S) { return S.own = S.own || { pct: 0, clubs: {}, log: [], since: null }; }
  function ownStepPrice(S, D) { var O = ownInit(S); return nice(Math.max(25000, clubValue(S, D) * 0.1 * (1 + O.pct / 100) * 1.4)); }
  function ownReq(S, D) { var O = ownInit(S), n = O.pct + 10, L = [];
    L.push(['Genug Privatvermögen (' + euro(ownStepPrice(S, D)) + ')', privInit(S).cash >= ownStepPrice(S, D)]);
    if (n >= 20) L.push(['Manager-Level 12', mlv(S) >= 12]);
    if (n >= 30) L.push(['Vorstand stimmt zu (Vorstand ≥ 60)', S.board >= 60]);
    if (n >= 50) L.push(['Mitgliederversammlung: Fans ≥ 60', S.fans >= 60], ['Mindestens 2 Saisons im Amt', (S.season - +String(S.start || S.date).slice(0, 4)) >= 2]);
    if (n >= 80) L.push(['Manager-Level 25', mlv(S) >= 25]);
    if (n >= 100) L.push(['Seit einer Saison Mehrheitseigner (≥ 51 %)', !!(O.maj && O.maj < S.season)]);
    return L; }
  var OWNPERK = [[10, 'Investor', 'Du bist am Verein beteiligt – jeden Monat gibt es eine kleine Gewinnausschüttung.'], [30, 'Sitz im Vorstand', 'Der Vorstand wird +10 zufriedener, seine Laune sinkt langsamer.'], [51, 'Mehrheitseigner', 'Doppelte Gewinnausschüttung – und du bestimmst die Richtung im Verein.'], [75, 'Präsident', 'Die Fans lieben die Identifikation: +5 Fans je Saison.'], [100, 'Alleineigentümer', 'Niemand kann dich mehr entlassen. Höchste Gewinnausschüttung.']];
  function ownDivM(S, D) { var O = ownInit(S); if (!O.pct) return 0; return nice(clubValue(S, D) * O.pct / 100 * (O.pct >= 51 ? 0.006 : 0.003)); }
  function clubSeed(n) { var h = 7; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 100003; return h; }
  function mktPrice(D, l, t) { var b = D.lv[l] ? D.lv[l].budget : 5000, sd = clubSeed(t.n) % 100 / 100; return nice(b * (5 + (t.b || 40) / 18) * (0.85 + sd * 0.3)); }
  function ownAll(S, D) { var d = dOf(S, D), out = []; Object.keys(d.lv).map(Number).filter(function (l) { return l >= 5; }).forEach(function (l) { ((d.teams || {})[l] || []).forEach(function (t) { if (t.n === S.club || / (II|III|IV)$/.test(t.n)) return; out.push({ n: t.n, l: l, ln: ligaName(d.lv[l].name), val: mktPrice(D, l, t) }); }); }); return out; }
  function wkNo(S) { return Math.floor(diffDays('2020-01-06', S.date) / 7); }
  function ownMarket(S, D) { var O = ownInit(S), all = ownAll(S, D).filter(function (x) { return !O.clubs[x.n]; }), w = wkNo(S), out = [];
    if (!all.length) return out; for (var i = 0; out.length < 3 && i < 40; i++) { var x = all[(clubSeed(S.club + w + ':' + i) * 7 + i * 131) % all.length]; if (out.indexOf(x) < 0) out.push(x); } return out; }
  function ownTr(c) { return nice(c.val * 0.1 * (1 + (c.pct || 0) / 200)); }
  function ownChance(c) { var r = c.val ? (c.sup || 0) / c.val : 0; return { up: Math.round((0.14 + Math.min(0.26, r * 0.9) + (c.form > 0 ? 0.02 : 0)) * 100), dn: Math.round(Math.max(0.03, 0.14 - Math.min(0.11, r * 0.5)) * 100) }; }
  function ownMonthly(S, D) { var O = S.own; if (!O) return; var P = privInit(S);
    var dv = ownDivM(S, D); if (dv > 0 && S.cash > dv * 2) { book(S, 'Gewinnausschüttung an Eigentümer', -dv); P.cash += dv; P.log.unshift([S.date, 'Ausschüttung ' + S.club + ' (' + O.pct + ' %)', dv]); }
    Object.keys(O.clubs).forEach(function (n) { var c = O.clubs[n]; if (c.pct == null) c.pct = 100; var inc = nice(c.val * c.pct / 100 * (0.007 + (c.form || 0) * 0.003) * rnd(0.8, 1.2)); if (inc > 0) { P.cash += inc; P.log.unshift([S.date, 'Einnahmen ' + n + ' (' + c.pct + ' %)', inc]); c.paid = (c.paid || 0) + inc; c.sInc = (c.sInc || 0) + inc; }
      c.val = nice(c.val * rnd(0.985, 1.025) * (1 + Math.min(0.02, (c.sup || 0) / Math.max(1, c.val) * 0.05))); (c.hist = c.hist || []).push([S.date.slice(0, 7), c.val]); if (c.hist.length > 60) c.hist.shift(); });
    if (O.pct >= 30 && S.board < 70) S.board = Math.min(100, S.board + 1); }
  function ownSeason(S, D) { var O = S.own; if (!O) return; if (O.pct >= 75) S.fans = clamp(S.fans + 5, 0, 100); if (O.pct >= 51 && !O.maj) O.maj = S.season; var rows = [], d = dOf(S, D);
    Object.keys(O.clubs).forEach(function (n) { var c = O.clubs[n], ch = ownChance(c), r = R() * 100, v0 = c.val, l0 = c.l, rk, msgT;
      if (r < ch.up && c.l > 1) { c.l--; c.val = nice(c.val * (c.l <= 4 ? 3 : 1.6)); c.form = 1; rk = rint(1, 2); msgT = '⬆️ ' + n + ' ist aufgestiegen!'; }
      else if (r > 100 - ch.dn && c.l < 12) { c.l++; c.val = nice(c.val * 0.55); c.form = -1; rk = rint(14, 16); msgT = '⬇️ ' + n + ' ist abgestiegen.'; }
      else { c.val = nice(c.val * rnd(0.95, 1.12)); c.form = 0; rk = rint(3, 13); msgT = n + ': solide Saison.'; }
      rows.push({ n: n, rk: rk, up: c.l < l0, dn: c.l > l0, l0: d.lv[l0] ? ligaName(d.lv[l0].name) : '', l1: d.lv[c.l] ? ligaName(d.lv[c.l].name) : '', v0: Math.round(v0 * c.pct / 100), v1: Math.round(c.val * c.pct / 100), inc: c.sInc || 0, sup: c.sup || 0, pct: c.pct });
      c.sInc = 0; c.sup = 0; O.log.unshift([S.date, msgT + ' Wert ' + euro(c.val)]); });
    if (rows.length) O.rep = { season: S.season - 1, rows: rows, seen: false }; O.asks = {}; O.log = O.log.slice(0, 20); }
  function ownView(S, D) { var O = ownInit(S), d = dOf(S, D), price = ownStepPrice(S, D), req = ownReq(S, D), w = wkNo(S);
    return { pct: O.pct, value: clubValue(S, D), step: price, req: req, can: O.pct < 100 && req.every(function (r) { return r[1]; }), perks: OWNPERK, divM: ownDivM(S, D), max: OWNMAX, log: O.log.slice(0, 8), asksLeft: Math.max(0, 3 - ((O.asksW || {})[w] || 0)),
      clubs: Object.keys(O.clubs).map(function (n) { var c = O.clubs[n]; if (c.pct == null) c.pct = 100; var my = Math.round(c.val * c.pct / 100), ch = ownChance(c); return { n: n, l: c.l, ln: d.lv[c.l] ? ligaName(d.lv[c.l].name) : 'Liga ' + c.l, pct: c.pct, price: c.price, val: c.val, my: my, sell: nice(my * 0.9), gain: nice(my * 0.9) - c.price, chg: c.price ? Math.round((my - c.price) / c.price * 100) : 0, since: c.since, paid: c.paid || 0, incM: nice(c.val * c.pct / 100 * (0.007 + (c.form || 0) * 0.003)), form: c.form || 0, tr: c.pct < 100 ? ownTr(c) : 0, hist: (c.hist || []).slice(-36), sup: c.sup || 0, up: ch.up, dn: ch.dn }; }),
      market: ownMarket(S, D).map(function (x) { return { n: x.n, l: x.l, ln: x.ln, val: x.val, tr: nice(x.val * 0.1), incM: nice(x.val * 0.1 * 0.007) }; }), open: Object.keys(O.open || {}), rep: O.rep && !O.rep.seen ? O.rep : null }; }
  function clubValue(S, D) {
    var squad = S.players.reduce(function (a, p) { return a + (p.loan && p.loan.from ? 0 : mw(p)); }, 0);
    var infra = 40000 + Object.keys(S.built).reduce(function (a, id) { return a + (D.items[id] ? D.items[id].cost * 0.6 : 0); }, 0);
    return nice(squad + infra + S.cash);
  }
  function summary(S, D) { var A = S.achv || []; var cnt = function (re) { return A.filter(function (a) { return re.test(a.k); }).length; }; return { games: S.gamesTotal || 0, avg: S.gamesTotal ? Math.round(S.ptsTotal / S.gamesTotal * 100) / 100 : 0, seasons: (S.hist || []).length + 1, meister: cnt(/^meister$/), aufstieg: cnt(/^aufstieg$/), pokal: cnt(/^pokal_(kp|mrp|dfb)$/), abstieg: (S.hist || []).filter(function (h) { return h.result === 'Abstieg'; }).length, sal: S.mc ? S.mc.sal : 0, liga: D.lv[S.lvl] ? D.lv[S.lvl].short : '', lvl: S.lvl, cash: Math.round(S.cash), pts: S.ptsTotal || 0, xp: Math.floor(S.xpGame || 0), ach: (S.achv || []).length, w: (S.mcnt || {}).win || 0, d: (S.mcnt || {}).draw || 0, mg: (S.mcnt || {}).game || 0, gf: (S.mcnt || {}).goal || 0, ga: (S.mcnt || {}).ga || 0, cm: S.cmi || 0, cmN: CMISS.length, value: clubValue(S, D), days: diffDays(S.start, S.date), fired: !!S.fired, season: S.season, date: S.date }; }

  function view(S, D) {
    migratePos(S); S.weekNeed = null; itPool(S);
    migrate(S);
    var L = D.lv[S.lvl], e = eff(S, D);
    var xi = currentXI(S); var slots = FORMS[S.lineup.form]; if (S.lineup.xi && !S.live) { xi = slots.map(function (sl, i) { var q = S.players.filter(function (z) { return z.id === S.lineup.xi[i]; })[0]; return outOk(q) ? q : null; }); }
    var tab = table(S); var me = tab.filter(function (r) { return r.svw; })[0];
    var games = svwGames(S, D); var next = games.filter(function (g) { return g.gf == null && g.d >= S.date; })[0] || null;
    var n = tab.length;
    var teams = S.world.lv[S.lvl];
    var tabV = tab.map(function (r) { var t = teams[r.i]; var zone = r.rank <= L.up ? 'up' : (L.upRel && r.rank === L.up + 1) ? 'uprel' : r.rank > n - L.down ? 'down' : (L.downRel && r.rank === n - L.down) ? 'downrel' : ''; return { rank: r.rank, n: r.n, svw: r.svw, sp: r.sp, s: r.s, u: r.u, nl: r.nl, tore: r.tf + ':' + r.ta, diff: r.tf - r.ta, pts: r.pts, form: r.form, zone: zone, rating: t.svw ? '' : rating(S, D, S.lvl, t), str: Math.round(t.svw ? (t.s || 0) : oppS(t)) }; });
    var curMd = 0; S.fix.forEach(function (f) { if (f.hg != null) curMd = Math.max(curMd, f.md); });
    var mdShow = Math.max(1, curMd);
    var matchday = function (md) { return S.fix.filter(function (f) { return f.md === md; }).map(function (f) { return { h: teams[f.h].n, a: teams[f.a].n, hg: f.hg, ag: f.ag, d: f.d, svw: !!(teams[f.h].svw || teams[f.a].svw) }; }); };
    try { if (S.players.some(function (p) { return !p.car; })) carEnsure(S, D); } catch (ce) { }
    var players = S.players.map(function (p) {
      return { id: p.id, n: p.n, pos: p.dp, pos2: p.dp2, f2: p.dp2 ? Math.round((p.f2 == null ? 0.78 : p.f2) * 100) : null, pos3: p.dp3 || null, f3: p.dp3 ? Math.round((p.f3 || 0) * 100) : null, grp: p.pos, age: p.age, str: Math.round(p.str), dS: p.str0 != null ? Math.round(p.str) - Math.round(p.str0) : 0, sh: (p.sh || []).concat([Math.round(p.str * 10) / 10]), isNew: !!p.isNew, injN: p.injN || (p.inj > 0 ? ((INJ_T.filter(function (x) { return p.inj <= x[0]; })[0] || INJ_T[3])[1][p.id % 3]) : null), docOk: !!(p.inj >= 10 && !(injCat(p.injN) && !(+injCat(p.injN)[4] > 0)) && (!p.docD || diffDays(p.docD, S.date) >= 14)), docIn: p.docD ? Math.max(0, 14 - diffDays(p.docD, S.date)) : 0, docCost: p.inj > 0 ? nice((injCat(p.injN) ? +injCat(p.injN)[4] || 1 : 1) * docCost(S, D, p)) : 0, leaving: p.leaving || null, lgp: p.lgp || 0, mins: p.mins || 0, lg: p.lg || 0, la: p.la || 0, lgr: p.lgp ? Math.round(p.lgr / p.lgp * 10) / 10 : null, strF: Math.round(p.str * 10) / 10, tal: p.tal, talLo: e.scout ? p.tal : Math.max(1, p.tal - 1), talHi: e.scout ? p.tal : Math.min(5, p.tal + 1), pot: potVis(S) ? Math.round(p.pot) : null, skx: skInfo(p),
        fit: Math.round(p.fit), form: Math.round(p.form * 10) / 10, inj: p.inj, mw: mw(p), sal: p.sal, ce: p.ce, g: p.g, a: p.a, gp: p.gp, avg: p.gp ? Math.round(p.gr / p.gp * 10) / 10 : null, last: p.lastGrade || null,
        loan: p.loan || null, tl: !!p.tl, ask: p.ask || null, fp: S.train.fp.indexOf(p.id) >= 0, youth: !!p.youth, block: !!p.block, ending: p.ce <= seasonEndYear(S), dem: salDemand(p, S.lvl), natLvl: natLvl(D, p.str), inXI: xi.indexOf(p) >= 0, posG: p.posG || null, starDone: p.starS === S.season, dStr: p.dStr || 0, dSeas: Math.round((p.str - (p.str0 == null ? p.str : p.str0)) * 10) / 10, tp: p.tp || null, retrain: p.retrain || null, self: !!p.self, ban: p.ban || 0, abs: p.abs || 0, yc: p.yc || 0, untouch: !!p.untouch, car: p.car || [], hist: p.hist || [] };
    });
    var mkMarket = function (mp) { return { nlz: !!mp.nlz, nlzLeft: mp.nlz ? diffDays(S.date, mp.nlzUntil) + 1 : 0, mid: mp.mid, n: mp.n, pos: mp.dp, pos2: mp.dp2, age: mp.age, str: Math.round(mp.str), talLo: e.scout ? mp.tal : Math.max(1, mp.tal - 1), talHi: e.scout ? mp.tal : Math.min(5, mp.tal + 1), pot: potVis(S) ? Math.round(mp.pot) : null, skx: mkSkills(S, mp), mw: mw(mp), fee: mp.fee, dem: mp.dem, club: mp.club, clubLvl: mp.clubLvl, liga: D.lv[mp.clubLvl] ? D.lv[mp.clubLvl].short : '', free: mp.free, loanFee: mp.loanFee, share: mp.share, gap: S.lvl - natLvl(D, mp.str), moved: mp.moved || null, watched: (S.watch || []).some(function (w) { return w.mid === mp.mid; }) }; };
    var hist = S.fin.hist.concat(S.fin.cur ? [S.fin.cur] : []).slice(-12).map(function (m) { var i = 0, o = 0; Object.keys(m.inn).forEach(function (k) { i += m.inn[k]; }); Object.keys(m.out).forEach(function (k) { o += m.out[k]; }); return { m: m.m, inn: Math.round(i), out: Math.round(o), detIn: m.inn, detOut: m.out }; });
    var monthlySal = S.players.reduce(function (a, p) { return a + (p.loan && p.loan.to ? 0 : p.sal); }, 0);
    var monthlyItems = Object.keys(S.built).reduce(function (a, id) { return a + (D.items[id] ? itemMonthly(S, D, D.items[id]) : 0); }, 0);
    var items = D.itemList.map(function (it) { var b = S.building.filter(function (x) { return x.id === it.id; })[0]; return { id: it.id, cat: it.cat, name: it.name, desc: it.desc, cost: nice(it.cost * bhCostF(S)), monthly: itemMonthly(S, D, it), days: it.days > 0 ? Math.max(1, Math.round(it.days * bhDaysF(S))) : it.days, req: it.req, reqName: it.id === 'ausbau5k' ? '10.000 Plätze' : it.id === 'stehtrib' && (S.capX || 0) < 1500 ? 'Gegengerade voll (+1.500)' : it.id === 'sitztrib' && (S.capX || 0) < 3000 ? 'Hauptseite voll (+3.000)' : it.req && D.items[it.req] ? D.items[it.req].name : '', built: !!S.built[it.id], building: b ? b.done : null, locked: !S._dev && (!!(it.req && !S.built[it.req]) || (it.id === 'ausbau5k' && capacity(S, D) < CAPMAX) || (it.id === 'stehtrib' && (S.capX || 0) < 1500) || (it.id === 'sitztrib' && (S.capX || 0) < 3000)), flvl: itemLvl(it), inc: itemIncome(S, D, it), upg: (S.upg || {})[it.id] || 1, upOk: upgOk(it), upCost: nice(upgCost(it, (S.upg || {})[it.id] || 1) * (it.id === 'bauhof' ? 1 : bhCostF(S))), fxTxt: Object.keys(it.fx || {}).map(function (k) { var v = it.fx[k], N = { dev: 'Training', ydev: 'Jugend-Entwicklung', youthq: 'Talent-Qualität', inj: 'Verletzungsrisiko', rec: 'Erholung', heal: 'Heilung', zus: 'Zuschauer', fans: 'Fans', merch: 'Merchandise', food: 'Gastro-Umsatz', spons: 'Sponsoren', moral: 'Moral', cap: 'Plätze', fit: 'Fitness', tac: 'Taktik', att: 'Zuschauer' }; return (N[k] || k) + ' ' + (v > 0 ? '+' : '') + v + (k === 'cap' || k === 'rec' ? '' : ' %'); }) }; });
    var worldV = {}; for (var l = 1; l <= D.maxLvl; l++) worldV[l] = { name: D.lv[l].name, short: D.lv[l].short, teams: S.world.lv[l].slice().sort(function (a, b) { return b.s - a.s; }).map(function (t) { return { n: t.n, str: Math.round(t.s * 10) / 10, rating: t.svw ? 'Wir' : rating(S, D, l, t), svw: !!t.svw }; }), last: S.world.last[l] || null };
    var cups = S.cups.map(function (c) { var LSH = function (l) { return D.lv[l] ? D.lv[l].short : ''; }; return { k: c.k, name: CUPS[c.k] ? CUPS[c.k].name : c.name, alive: c.alive, won: !!c.won, rn: c.rn, winner: c.winner || (c.won ? D.club : null), hist: (c.hist || []).map(function (h) { return { name: h.name, ties: h.ties.map(function (t) { return { h: t.h, a: t.a, hl: LSH(t.hl), al: LSH(t.al), hg: t.hg, ag: t.ag, pen: t.pen, w: t.w, own: !!t.own }; }) }; }), ties: (c.ties || []).map(function (t) { return { h: t.h, a: t.a, hl: LSH(t.hl), al: LSH(t.al) }; }), fieldN: (c.field || []).length, round: RNAMES[Math.min(5, c.rn)], games: c.games.map(function (g) { return { d: g.d, round: RNAMES[g.rn], opp: g.opp, home: g.home, gf: g.gf, ga: g.ga, pen: g.pen, win: g.win }; }), next: c.next ? { d: c.next.d, round: RNAMES[c.next.rn], opp: c.next.opp.n, oppLiga: D.lv[c.next.opp.l] ? D.lv[c.next.opp.l].short : '', home: c.next.home } : null }; });
    var pc = pitchCost(S, D);
    var pub = function (p) { return { id: p.id, n: p.n, pos: p.dp, str: Math.round(p.str), g: p.g, a: p.a, gp: p.gp, avg: p.gp ? Math.round(p.gr / p.gp * 10) / 10 : null, inj: p.inj, ban: p.ban || 0, loan: p.loan || null, self: !!p.self }; };
    var rated = S.players.filter(function (p) { return p.gp >= 1; });
    var top = {
      lt: rated.slice().sort(function (a, b) { return a.gr / a.gp - b.gr / b.gp; }).slice(0, 3).map(pub),
      tore: S.players.filter(function (p) { return p.g > 0; }).sort(function (a, b) { return b.g - a.g; }).slice(0, 3).map(pub),
      vorl: S.players.filter(function (p) { return p.a > 0; }).sort(function (a, b) { return b.a - a.a; }).slice(0, 3).map(pub)
    };
    var pubC = function (p) { var o = pub(p); o.g = p.cg || 0; o.a = p.ca || 0; o.gp = p.cgp || 0; o.avg = p.cgp ? Math.round(p.cgr / p.cgp * 10) / 10 : null; return o; };
    var topCup = { lt: S.players.filter(function (p) { return p.cgp >= 1; }).sort(function (a, b) { return a.cgr / a.cgp - b.cgr / b.cgp; }).slice(0, 3).map(pubC), tore: S.players.filter(function (p) { return p.cg > 0; }).sort(function (a, b) { return b.cg - a.cg; }).slice(0, 3).map(pubC), vorl: S.players.filter(function (p) { return p.ca > 0; }).sort(function (a, b) { return b.ca - a.ca; }).slice(0, 3).map(pubC) };
    var fitAvg = S.players.length ? Math.round(S.players.reduce(function (a, p) { return a + p.fit; }, 0) / S.players.length) : 0;
    var lv = levelOf(S.xp || 0);
    return {
      full: S.full, mlvl: S.mlvl || 1, xp: Math.floor(S.xp || 0), xpGame: Math.floor(S.xpGame || 0), level: lv, features: FEATURES, xplv: XPLV,
      pots: { cash: Math.round(S.cash), tb: Math.round(S.tb), sav: Math.round(S.sav) }, wealth: Math.round(wealth(S)), alloc: S.alloc,
      stufen: { fans: S.lvFans, board: S.lvBoard, moral: S.lvMoral }, fanbase: S.fanbase, fitness: fitAvg,
      feed: S.feed, mails: S.mails, youth: S.youth.map(function (y) { return { bday: y.bday || null, id: y.id, dS: Math.round((y.str - (y.s0 != null ? y.s0 : y.str)) * 10) / 10, from: y.from || null, n: y.n, pos: y.dp, pos2: y.dp2, age: y.age, str: Math.round(y.str), tal: y.tal, talLo: e.scout ? y.tal : Math.max(1, y.tal - 1), talHi: e.scout ? y.tal : Math.min(5, y.tal + 1), pot: potVis(S) ? Math.round(y.pot) : null, skx: skInfo(y) }; }),
      youthTeams: ['u15', 'u17', 'u19'].filter(function (k) { return S.built[k]; }),
      achv: S.achv || [], achDef: ACH, spons: SPONS, sponsorsAll: S.sponsors, captain: S.captain, pen: S.pen, loanInfo: S.loan, fcs: S.fcs || [], fcNext: (S.fcs || []).length < FC_STEPS.length ? { pct: FC_STEPS[(S.fcs || []).length][1], need: FC_STEPS[(S.fcs || []).length][3] } : null, dk: S.dk ? { price: S.dk.price, hist: S.dk.hist, canSet: (S.hist || []).length > 0 && S.dk.setS !== S.season, fair: DK_FAIR[S.lvl] || 50 } : null, sellPop: S.sellPop || null, matchWx: S.mq && S.mq.length ? wxFor(S.mq[0].o.d || S.date, S.mq[0].o.opp && S.mq[0].o.opp.n) : null, talkOpts: talkOpts(S), hollyOn: hollyOn(S), holly: S.holly ? S.holly.list.filter(function (x) { return x.exp >= S.date; }) : [], hollyStar: S.hollyStar || null, streamFol: S.streamFol || 0, inhPop: S.inhPop || null, socUsed: socUsed(S), certPop: S.certPop || null, courseSpent: S.courseSpent || 0, qualF: qualF(S), tipPop: S.tipPop || null, daily: S.daily ? { streak: S.daily.streak, open: !!S.daily.open } : null, dailyLast: S.dailyLast || null, jokIntro: S.jokIntro === 1 && !S.live, starIntro: S.starIntro === 1 && !S.live && S.jokIntro !== 1, ag: S.ag || null, agWhy: S.ag ? [] : agCheck(S, D), agBase: agBase(S, D), bond: S.bond || null, bondOffer: S.bondOffer || null, bondAskDone: S.bondAskW === wkStart(S), credMax: nice(L.budget * 0.6), stadion: S.stadion, jersey: S.jersey,
      top: top, out: { inj: S.players.filter(function (p) { return p.inj > 0; }).map(pub), ban: S.players.filter(function (p) { return p.ban > 0; }).map(pub), loanOut: S.players.filter(function (p) { return p.loan && p.loan.to; }).map(pub), loanIn: S.players.filter(function (p) { return p.loan && p.loan.from; }).map(pub) },
      pvAskLeft: 3 - (S.pvAsk && S.pvAsk.s === S.season ? S.pvAsk.n : 0), likeSm: S.likeSm || 0, mlvlG: mlv(S), skill: skView(S), seasonNum: S.season, stad: (function () { var e0 = eff(S, D), bids = (S.cupBids || []).filter(function (b) { return b.s >= S.season - 1; }); if (!S.stadBuilt) S.stadBuilt = 1952 + hashS(String(S.club || 'x')) % 46; return { built: S.stadBuilt, inc: S.stadInc && S.stadInc.s === S.season ? S.stadInc : { s: S.season, t: 0, f: 0, n: 0, prev: S.stadInc && S.stadInc.s === S.season - 1 ? { t: S.stadInc.t, f: S.stadInc.f, n: S.stadInc.n } : null }, avgAtt: S.attLog && S.attLog.length ? Math.round(S.attLog.reduce(function (a, b) { return a + b; }, 0) / S.attLog.length) : 0, ticket: S.ticket, flut: e0.flut, bids: bids, host: S.cupHost || null, req: Object.keys(CUPBID).map(function (k) { var B = CUPBID[k]; return { k: k, n: cupName(S, k), fee: B.fee, cap: B.cap, natur: B.natur, items: B.items.map(function (id) { return D.items[id] ? D.items[id].name : id; }), miss: cupBidMiss(S, D, k), cash: B.cash, fol: B.fol, xp: B.xp }; }), win: S.date.slice(5) >= '08-01' || S.date.slice(5) <= '03-31' }; })(), tplans: TPLANS, dev: !!S._dev, devOk: !!S._devOk, potVis: potVis(S), scoutScore2: S.scout ? Math.round(S.scout.score || 0) : 0, ptsTotal: S.ptsTotal || 0, wins: S.wins || 0, draws: S.draws || 0, losses: S.losses || 0, start: S.start, peak: S.peak,

      club: D.club, mgr: S.mgr, date: S.date, dateF: fmtD(S.date), season: S.season + '/' + String(S.season + 1).slice(2), lvl: S.lvl, liga: L.name, ligaShort: L.short,
      cash: Math.round(S.cash), fans: Math.round(S.fans), board: Math.round(S.board), moral: Math.round(S.moral), goal: S.goal ? GOALS[S.goal] : '', fired: S.fired, firedOn: S.firedOn || null, fireWhy: S.fireWhy || null, firedTxt: S.fired ? ((S.inbox || []).filter(function (m) { return /entlassen/.test(m.t || m.text || ''); })[0] || {}).t || '' : '', warnPop: S.warnPop || null, jokers: S.jokers || 0, gev: gevView(S, D), power: S.power == null ? 100 : S.power, jokNew: !!S.jokNew,
      teamStr: Math.round(teamStr(S, D, true) * 10) / 10, xiAvg: Math.round(xiAvg(S, D) * 10) / 10, value: clubValue(S, D), days: diffDays(S.start, S.date), window: inWindow(S.date),
      rank: me ? me.rank : null, pts: me ? me.pts : 0, next: next, games: games, table: tabV, md: { cur: mdShow, max: S.fix.length ? S.fix[S.fix.length - 1].md : 0, list: matchday(mdShow), next: matchday(Math.min(mdShow + 1, S.fix.length ? S.fix[S.fix.length - 1].md : 1)) },
      allMd: (function () { var o = {}; S.fix.forEach(function (f) { (o[f.md] = o[f.md] || []).push({ h: teams[f.h].n, a: teams[f.a].n, hg: f.hg, ag: f.ag, d: f.d, svw: !!(teams[f.h].svw || teams[f.a].svw) }); }); return o; })(),
      zones: { up: L.up, upRel: L.upRel, down: L.down, downRel: L.downRel, n: n },
      players: players, lineup: { form: S.lineup.form, auto: !S.lineup.xi, forms: Object.keys(FORMS), slots: slots.map(function (sl, i) { var p = xi[i]; return { pos: sl, pid: p ? p.id : null, n: p ? p.n : null, ppos: p ? p.dp : null, fitPct: p ? Math.round(posFit(sl, p) * 100) : 0, unavail: !!(S.lineup.xi && !p), out: p && (p.inj || p.ban || p.abs) ? (p.inj ? 'inj' : p.ban ? 'ban' : 'abs') : null, missing: (function () { if (!S.lineup.xi || p) return null; var q = S.players.filter(function (z) { return z.id === S.lineup.xi[i]; })[0]; return q ? { n: q.n, why: q.inj ? 'inj' : q.ban ? 'ban' : q.abs ? 'abs' : 'loan' } : null; })(), r: p ? Math.round(p.str * posFit(sl, p) * 10) / 10 : 0, rEff: p ? Math.round(rateIn(p, sl) * 10) / 10 : 0, fit: p ? Math.round(p.fit) : 0 }; }) },
      train: { int: S.train.int, focus: S.train.focus, foci: FOCI, fp: S.train.fp }, camp: S.camp, camps: D.camps.map(function (c) { var k = campFeat(c); return Object.assign({}, c, { flvl: featLvl(k) }); }), chem: S.chem && S.chem.until >= S.date ? S.chem : null,
      tests: testOpps(S, D), market: { list: S.market.list.map(mkMarket), loans: S.market.loans.map(mkMarket) },
      fin: { hist: hist, sponsors: S.sponsors.concat(S.tmp.sponsors.map(function (s) { return { slotName: 'Sonderdeal', firm: 'Aktion', m: s.m, until: s.n + ' Monate' }; })), ticket: S.ticket, ticketDef: L.ticket, budget: L.budget, monthlySal: monthlySal, monthlyItems: monthlyItems, tv: L.tv, admin: L.admin },
      infra: { items: items, cap: capacity(S, D), capX: S.capX || 0, capOpts: capOpts(S, D), capB: S.capB || null, capMax: CAPMAX, turfY: S.pitch.type === 'kunst' ? Math.round(+String(S.date).slice(0, 4) - S.pitch.age) : null, pitch: { type: S.pitch.type, cond: Math.round(pitchCond(S) * 100), age: Math.round(S.pitch.age * 10) / 10, building: S.pitchBuild || null, cost: pc }, flut: e.flut, lic: licenseIssues(S, D, S.lvl - 1), licLiga: D.lv[S.lvl - 1] ? D.lv[S.lvl - 1].name : null, licOwn: licenseIssues(S, D, S.lvl), licOwnLiga: L.name, life: Math.round(S.pitch.life) },
      cups: cups, world: worldV, hist: S.hist, inbox: S.inbox.slice(0, 80), pending: S.pending[0] || null, pendingCount: S.pending.length, reports: S.reports || [],
      squadValue: S.players.reduce(function (a, p) { return a + mw(p); }, 0),
      matchToday: S.mq.length ? { label: S.mq[0].o.label, comp: S.mq[0].o.comp, opp: S.mq[0].o.opp.n, home: S.mq[0].o.home, d: S.mq[0].o.d, oppLvl: S.mq[0].o.opp.l || S.lvl } : null,
      lineupIssues: (function () { if (!S.lineup.xi) return []; return S.lineup.xi.map(function (id) { var p = S.players.filter(function (q) { return q.id === id; })[0]; return p && (p.inj || p.ban || (p.loan && p.loan.to)) ? p.n + (p.inj ? ' (verletzt)' : p.ban ? ' (gesperrt)' : ' (verliehen)') : null; }).filter(Boolean); })(),
      liveS: S.live ? { own: Math.round((S.live.done && S.live.msEnd != null ? S.live.msEnd : liveStr(S, D)) * 10) / 10, opp: Math.round(S.live.os * 10) / 10, inj: S.live.injOut || [] } : null, live: S.live, liveOn: S.live ? S.live.on.map(function (id, i) { var rp = id == null && S.live.redP && S.live.redP[i] != null ? S.players.filter(function (q) { return q.id === S.live.redP[i]; })[0] : null; if (rp) return { id: rp.id, n: rp.n, pos: rp.dp, slot: FORMS[S.lineup.form][i], red: true, tal: rp.tal, str: Math.round(rp.str), st: S.live.st[rp.id] }; var p = S.players.filter(function (q) { return q.id === id; })[0]; return p ? { id: p.id, n: p.n, pos: p.dp, slot: FORMS[S.lineup.form][i], fit: Math.round(p.fit), tal: p.tal, str: Math.round(p.str), st: S.live.st[p.id] } : null; }) : null,
      tm: tmStatus(S.date), watch: (S.watch || []).map(mkMarket), nego: (S.nego || []).map(function (n) { return { n: n.mp.n, club: n.mp.club, fee: n.fee, sal: n.sal }; }), trAct: (S.trAct || []).map(function (x) { return { mid: x.mid, n: x.n, pos: x.pos, str: x.str, club: x.club, st: x.st, mail: x.mail || null }; }),
      dayEv: (S.dayEv || []).filter(function (x) { return !x.done; }), dayEvDefs: (function () { var o = {}; Object.keys(DAYEV).forEach(function (k) { o[k] = { n: DAYEV[k][0], d: DAYEV[k][1], cost: dayEvCost(S, D, k), months: DAYEV[k][3], max: DAYEV[k][4], used: (S.dayEv || []).filter(function (x) { return x.k === k && x.season === S.season; }).length }; }); return o; })(),
      seasonRep: S.seasonRep && !S.seasonRep.ack ? S.seasonRep : null, needAlloc: !!S.needAlloc, budgetHold: (S.budgetHold || []).reduce(function (a, b) { return a + b[1]; }, 0),
      trialRes: S.trialRes ? (function (T) { var q = T.p; return { n: q.n, pos: q.dp, pos2: q.dp2, age: q.age, str: Math.round(q.str), tal: q.tal, sal: salDemand(q, S.lvl), mw: mw(q), ga: T.ga, verdict: T.verdict, note: T.note, again: T.again }; })(S.trialRes) : null, trials: (S.trials || []).map(function (t) { return { n: t.p.n, pos: t.p.dp, until: t.until }; }), attLog: (S.attLog || []).slice(-10), kit: S.kit || null, kitD: S.kitD || null, ball: S.ball || null, kitOffers: S.kitOffers || null, ballOffers: S.ballOffers || null, kitNeed: !!S.kitNeed, twPop: S.twPop || null, potsPop: S.potsPop || null, talk: S.talk && S.talk.d === S.date ? S.talk : null, med: S.med || {}, medItems: Object.keys(MEDIT).map(function (k) { var m = MEDIT[k], st = medSt(S)[k] || { lvl: 0 }, l = st.lvl || 0, ms = medMS(S, D), bld = st.bld && st.bld > S.date ? st.bld : null; return { k: k, n: m[0], d: m[1], lvl: l, bld: bld, staff: !!st.staff, ren: st.ren || null, renDue: l >= 3 && st.ren ? diffDays(S.date, st.ren) <= 365 : false, next: l < 3 ? nice(m[2][l] * ms) : nice(m[2][2] * 0.35 * ms), monthly: st.staff && l ? nice(m[3][l - 1] * ms) : 0, staffCost: nice(m[3][Math.max(0, l - 1)] * ms), days: Math.round(m[5] * (1 + l * 0.3)), fx: m[4], act: medActive(S, k) }; }), jobTile: (function () { var J = S.priv && S.priv.job; if (!J) return null; var st = J.path && JOBS[J.path] && JOBS[J.path].study; if (J.stage === 'study' && st) return { t: J.title, pct: Math.min(100, Math.round((J.months || 0) / st[1] * 100)), lbl: (J.months || 0) + ' / ' + st[1] + ' Monate' }; if (J.stage === 'job') return { t: J.title, pct: 100, lbl: 'Abgeschlossen · im Job' }; return { t: 'Weg noch offen', pct: 0, lbl: 'Studium, Ausbildung oder Arbeit wählen' }; })(), giftPop: S.giftPop ? S.giftPop.map(function (p) { return { n: p.n, dp: p.dp, pos: p.pos, age: p.age, str: Math.round(p.str), talLo: p.tal, talHi: p.tal, sal: p.sal }; }) : null, ps: S.ps || null, psOffers: S.psOffers || null, langs: Object.keys(LANGS).map(function (k) { return { k: k, n: LANGS[k][0], f: LANGS[k][1] }; }), lang: Object.keys(S.lang || {}).map(function (k) { var x = S.lang[k], l = langLvl(x); return { k: k, n: LANGS[k][0], f: LANGS[k][1], xp: x.xp || 0, lvl: l, exam: slpOf(x.xp || 0) > l && l < 6, block: x.block && x.block > S.date ? x.block : null, lvlN: SLPN[l], next: SLPXP[Math.min(6, l + 1)], prev: SLPXP[l], done: x.wk === addDays(S.date, -((dow(S.date) + 6) % 7)) }; }), slpNames: SLPN, langQ: S.langQ ? (function (LQ) { var q = langQs(LQ.k, LQ.lv)[LQ.i]; return { k: LQ.k, n: LANGS[LQ.k][0], lv: LQ.lv, q: q.q, o: q.o }; })(S.langQ) : null, langF: Math.round(langF(S) * 100) / 100, ycamps: YCAMPS.map(function (c) { return { k: c[0], n: c[1], c: c[2], cost: c[3], days: c[4], done: S.yc && S.yc[c[0]] || null, lvl: S.yc && S.yc[c[0]] ? ((S.ycL || {})[c[0]] || 1) : 0, stars: c[5], up: nice(c[3] * 0.6 * ((S.ycL || {})[c[0]] || 1)) }; }), acadRep: (function () { var r = 5 + ['u15', 'u17', 'u19'].filter(function (k) { return S.built[k]; }).length * 8 + ['aplatz', 'jzentrum', 'internat', 'astadion', 'sprachschule', 'agym', 'bushalt', 'ubahn'].filter(function (k) { return S.built[k]; }).length * 5 + Object.keys(S.yc || {}).reduce(function (a, k) { return a + 4 * ((S.ycL || {})[k] || 1); }, 0) + Math.round(((S.scout || {}).score || 0) / 8) + Math.max(0, 11 - S.lvl) * 1.5; return Math.min(100, Math.round(r)); })(), scoutScore: Math.round(((S.scout || {}).score || 0)), scoutTrDone: (S.scout || {}).trW === wkStart(S), mktDone: S.mktW === wkStart(S), ttDone: S.ttW === wkStart(S), ttLast: S.ttLast || null, itDone: S.itW === wkStart(S), itLast: S.itLast || null, itPool: (S.itPool || []).map(function (id) { var q = S.players.filter(function (x) { return x.id === id; })[0]; return q ? { id: q.id, n: q.n, pos: q.dp, age: q.age, str: Math.round(q.str * 100) / 100 } : null; }).filter(Boolean), util: (function () { var o = {}; Object.keys(UTIL).forEach(function (k) { o[k] = { ico: UTIL[k][0], n: UTIL[k][1], c: (S.util || {})[k] || null }; }); return o; })(), utilOff: S.utilOff || [], ballAsked: S.ballAskW === wkStart(S), feeN: (function () { var o = {}; Object.keys(S.feeN || {}).forEach(function (k) { var q = S.feeN[k]; o[k] = { ask: q.ask, ask0: q.ask0 || q.ask, mood: q.mood, r: q.r, ok: q.ok, fee: q.fee || 0, bid: q.bid, gone: !!q.gone, until: q.until || null }; }); return o; })(), mktB: S.mktB || 0, mascBond: S.mascBond || {}, mascLock: !!(S.masc && S.mascSeason === S.season), ycPool: (S.ycPool || []).map(function (y) { return { n: y.n, dp: y.dp, age: y.age, str: Math.round(y.str), tal: y.tal, from: y.from, fee: y.fee }; }), fms: FMS.map(function (x) { return [x[0], x[1].split(' – ')[0]]; }), fMs2: S.fMs2 || 0, followF: Math.round(followF(S) * 100) / 100, masc: S.masc || null, sb: S.sb ? { offers: S.sb.offers, act: S.sb.act, log: (S.sb.log || []).slice(0, 12), sum: S.sb.sum || 0 } : { offers: [], act: [], log: [], sum: 0 }, privLog: S.priv ? (S.priv.log || []).slice(0, 20) : [], mascs: MASC.map(function (m) { return { k: m[0], n: m[1], e: m[2], c: m[3], cost: MASCM, txt: m[5] }; }), courses: COURSES.map(function (c) { return { k: c[0], n: c[1], org: CORG[c[0]] || c[2], by: c[2], cost: c[3], days: c[4], req: c[5], reqN: c[5] ? COURSES.filter(function (x) { return x[0] === c[5]; })[0][1] : null, txt: c[6], done: (S.courses || []).indexOf(c[0]) >= 0 }; }), courseRun: S.courseRun || null, scout: { tools: SCOUTT.map(function (t) { return { k: t[0], n: t[1], cost: t[2], txt: t[3], on: !!(S.scout && S.scout.tools[t[0]]), lock: scLock(S, t) }; }), pool: (S.scout && S.scout.pool || []).map(function (y) { return { n: y.n, dp: y.dp, age: y.age, str: Math.round(y.str), tal: y.tal, via: y.via, from: y.from || null }; }), n: S.scout && S.scout.season === S.season ? S.scout.n : 0, lim: scLimit(S), spend: (S.scout && S.scout.spend) || [] }, ytrN: S.ytr && S.ytr.season === S.season ? S.ytr.n : 0, pvBuyLeft: pvBuyLeft(S), pvProp: (S.pvProp || []).map(function (x) { return { n: x.p.n, dp: x.p.dp, dp2: x.p.dp2 || null, age: x.p.age, str: Math.round(x.p.str), tal: x.p.tal, buy: x.p.loan.buy, taken: x.taken, ls: x.p.lastS || null }; }), pvTaken: S.pvTaken && S.pvTaken.season === S.season ? S.pvTaken.n : 0, pvPend: (S.pvPend || []).map(function (x) { return x.n; }), pvTestDone: S.pvTest === S.season, mgrRep: mgrRep(S, D), clubRep: clubRep(S, D), wld: [S.wins || 0, S.draws || 0, S.losses || 0], adCost: adCost(S), flyCost: flyCost(S), flyDone: S.flyW === wkStart(S), flyLast: S.flyLast || 0, adDone: S.adWeek === addDays(S.date, -((dow(S.date) + 6) % 7)) || S.socWeek === addDays(S.date, -((dow(S.date) + 6) % 7)), adLast: S.adLast || null, likeFx: S.likeFx || 0, cupPop: S.cupPop || null, lastGate: S.lastGate || null, waFav: S.waFav || [], waHide: S.waHide || {}, social: socialPick(S).map(function (k) { var x = SOCIAL.filter(function (y) { return y[0] === k; })[0]; return { k: k, n: x[1], c: x[2] }; }), socDone: S.socWeek === addDays(S.date, -((dow(S.date) + 6) % 7)) || S.adWeek === addDays(S.date, -((dow(S.date) + 6) % 7)), socLast: S.socLast || null, hype: S.hypeUntil >= S.date ? S.hype || 0 : 0, follow: S.follow != null ? S.follow : followStart(S), followWeek: S.followWeek || 0, fMs: S.fMs || 0, mkt: mktVal(S), benchIds: benchView(S), benchSet: !!S.lineup.bench, benchOrd: !!(S.lineup.bench && S.lineup.bord), tribOrd: S.tribOrd || [], building: (S.building || []).map(function (b) { return { id: b.id, n: D.items[b.id] ? D.items[b.id].name : b.id, done: b.done, days: diffDays(S.date, b.done), total: D.items[b.id] ? D.items[b.id].days : 0 }; }), fanWeekDone: S.fanWeek === addDays(S.date, -((dow(S.date) + 6) % 7)), weekNeed: S.weekNeed || null, weekPlan: S.weekPlan || {}, pv: S.pv || null, pvOffers: S.pvOffers || null, pvTier: pvTier(S), pvArmy: S.lvl <= 3, fanActs: Object.keys(FANACT).map(function (k) { var a = FANACT[k]; return { k: k, n: a[0], d: a[1], cost: nice(a[2] * moneyScale(S, D)), cd: a[3], fx: a[4], until: S.fanCd && S.fanCd[k] > S.date ? S.fanCd[k] : null, used: S.fanN && S.fanN.s === S.season ? (S.fanN[k] || 0) : 0 }; }), fanbase: S.fanbase, fansV: Math.round(S.fans), fanDw: S.fanPrev ? { f: Math.round((S.fans - S.fanPrev.f) * 10) / 10, fb: S.fanbase - S.fanPrev.fb, m: (S.members || 0) - S.fanPrev.m } : null, testsDone: S.testsDone || 0, aufstOk: !!S.aufstOk, unlockNote: S.unlockNote || null, partnerCount: S.sponsors.length + (S.mainSp ? 1 : 0) + (S.kit ? 1 : 0) + (S.ball ? 1 : 0), posPop: S.posPop ? (function (q) { return q ? { pid: q.id, n: q.n, dp: q.dp, dp2: S.posPop.w === 3 ? q.dp3 : q.dp2, old2: q.dp2, w: S.posPop.w || 2, age: q.age, str: Math.round(q.str) } : null; })(S.players.filter(function (x) { return x.id === S.posPop.pid; })[0]) : null, recordLvl: S.reg ? (S.peak || S.lvl) : Math.min(5, S.peak || 99), mainSp: S.mainSp || null, spOffers: S.spOffers || null, spNeed: !!S.spNeed, spBase: S.spBase || 0, movesLeft: S.movesSeason === S.season ? 3 - (S.moves || 0) : 3, starPop: S.starPop || null, hsPts: S.hsPts || 0, hsAnim: S.hsAnim || 0, hsSeason: S.hsSeason || 0, incoming: (S.incoming || []).map(function (x) { return { n: x.p.n, pos: x.p.dp, d: x.d }; }), youthNext: (S.youthNext || []).length,
      trainToday: S.trainDay || null, trainDefs: TRAIN, lastTrain: S.lastTrain || null, prep: S.prep || null, prepWin: S.prep && S.prep.need ? prepWin(S, D, S.prep.phase) : null, prepWins: [prepWin(S, D, 'summer'), prepWin(S, D, 'winter')], trPop: (S.trPopQ || [])[0] || null, mediaN: S.mediaN || 0, streamDone: S.streamD === S.date, streams: S.streams || 0, streamHist: S.streamHist || [], clipLk: S.clipLk && S.clipLk.d === S.date ? S.clipLk.ids : [], clipDay: Math.floor(toD(S.date) / 86400000), prepCan: (S.tests || []).some(function (t) { return t.prep && t.d > S.date; }) || (S.dayEv || []).some(function (x) { return x.prep && !x.done && x.d > S.date; }), pressPending: !!S.pressPending, missions: misView(S, D), twin: S.twin ? { up: S.twin.up, name: S.twin.name, sq: S.twin.sq.map(function (q) { return { id: q.id, n: q.n, pos: q.pos, dp: q.dp, age: q.age, str: Math.round(q.str * 10) / 10, tal: q.tal, sal: q.sal }; }) } : null, press: S.reg && pressQs(S) ? pressQs(S).map(function (q) { return [rx(S, q[0]), q[1].map(function (o) { var y = o.slice(); y[0] = rx(S, y[0]); return y; })].concat(q.slice(2)); }) : pressQs(S), pressTitle: pressTitle(S), members: S.members || D.members0, founded: D.founded, fk: S.fk || null, ck: S.ck || null, pic: S.pic || null,
      lgAvg: Math.round(S.world.lv[S.lvl].reduce(function (a, t) { return a + t.s; }, 0) / S.world.lv[S.lvl].length * 10) / 10, avgPts: S.gamesTotal ? Math.round(S.ptsTotal / S.gamesTotal * 100) / 100 : 0,
      stocksDef: stockVis(S), cryptoDef: S.reg ? CRYPTO.map(function (c) { var x = c.slice(); x[1] = c[0] === 'DRCH' ? locOf(S).stadtA + ' Taler' : rxL(S, x[1]); if (c[0] === 'LAEND') x[1] = locOf(S).stadt + '-Token'; return x; }) : CRYPTO, deposDef: DEPOS, charity: S.reg ? CHARITY.map(function (c) { return [c[0], rxL(S, c[1])]; }) : CHARITY, jobsDef: JOBS, bhMax: bhMax(S), bhLvl: bhLvl(S), own: S.priv ? ownView(S, D) : null, ownNames: S.priv && S._tab !== 'x' ? ownAll(S, D).map(function (x) { return x.n; }) : [], privBal: S.priv ? privBal(S) : null, living: S.priv ? livingCosts(S) : [], seasonsN: (S.hist || []).length + 1,
      qual: S.qual || {}, trLog: (S.trLog || []).filter(function (x) { return x.s === S.season; }), strHist: S.strHist || [], topCup: topCup, youthCap: youthCap(S), yt: ytView(S, D), ytrDone: S.ytrM === wkStart(S), special: Object.keys(SPECIAL).map(function (k) { var x = SPECIAL[k]; return { k: k, n: x[0], ic: x[1], cost: nice(x[2] * Math.max(0.6, moneyScale(S, D))), d: x[3], xp: x[4], done: (S.spt || {})[k] === S.date.slice(0, 7) }; }), hobbies: HOBBIES.map(function (x) { var h = (S.hob || {})[x[0]]; return { k: x[0], n: x[1], ic: x[2], fx: x[3], pct: h ? Math.floor(h.pct) : null, done: S.hobW === wkStart(S) || (h ? h.wk === wkStart(S) : false) }; }), hobO: S.hobO || [], hobOffer: (function () { var rr = srng(hashS(wkStart(S) + '|' + (S.salt || 0))), L2 = HOBBIES.filter(function (x) { return !(S.hob || {})[x[0]]; }).map(function (x) { return x[0]; }); return L2.sort(function () { return rr() - 0.5; }).slice(0, 4); })(), conc: CONC.map(function (c) { var P2 = (S.prices || {})[c[0]] || {}; return { k: c[0], n: c[1], ic: c[2], base: c[3], p: prc(S, c[0], c[3]), lock: P2.m === S.date.slice(0, 7) }; }), merch: MERCH.map(function (c) { var P2 = (S.prices || {})[c[0]] || {}; return { k: c[0], n: c[1], ic: c[2], base: c[3], p: prc(S, c[0], c[3]), lock: P2.m === S.date.slice(0, 7) }; }), priceMood: Math.round(priceMood(S) * 100) / 100, ticketLock: S.ticketM === S.date.slice(0, 7), tHist: S.tHist || [], licNext: S.lvl > 1 ? licenseIssues(S, D, S.lvl - 1) : [], pvExtDone: S.pvExt === S.season, benefizRes: S.benefizRes || null, langExam: S.langExam ? (function (LE) { var Q = langQs(LE.k, LE.lv); return { k: LE.k, n: LANGS[LE.k][0], lv: LE.lv, lvN: SLPN[LE.lv], q: LE.q.map(function (i) { return { q: Q[i].q, o: Q[i].o }; }) }; })(S.langExam) : null, ligaK: L.short, mc: S.mc ? { sal: S.mc.sal, until: S.mc.until, offer: S.mc.offer, left: mgrMonthsLeft(S), can: mgrCan(S, D) } : null, priv: S.priv || null, shop: SHOP.map(function (r) { return shopItem(r[0], S); }),
      sponsBar: Math.round(S.spons == null ? 60 : S.spons), lastSigned: S.lastSigned || null, blockMails: blockingMails(S), dpn: DPN, sec: SEC,
      budgetPace: (function () { var mths = S.fin.hist.concat(S.fin.cur ? [S.fin.cur] : []).slice(-3); var net = 0; mths.forEach(function (m) { Object.keys(m.inn).forEach(function (k) { if (k.indexOf('Saisonbudget') < 0 && k !== 'Mitgliedsbeiträge' && k !== 'Spenden') net += m.inn[k]; }); Object.keys(m.out).forEach(function (k) { net -= m.out[k]; }); }); var perM = mths.length ? net / mths.length : 0; return { perM: Math.round(perM), proj: Math.round(wealth(S) + perM * monthsLeft(S)) }; })()
    };
  }

  function actW(S, D, a, p) { var r = act(S, D, a, p); if (ACT_MC[a]) mcAdd(S, ACT_MC[a]);
    if (!S.refHint && ((S.mcnt || {}).game || 0) >= 10) { S.refHint = 1; infoMail(S, 'Amateur Manager', '🤝 Gemeinsam macht’s mehr Spaß', 'Schon zehn Pflichtspiele – stark! Wusstest du, dass du Freunde einladen kannst? Für jede Anmeldung bekommst du XP, und wenn deine Freunde eine ganze Saison spielen, gibt es Joker und Sterne für deinen Spielstand. Deinen persönlichen Link findest du unter ⚙️ Einstellungen → Freunde einladen.'); }
    return r; }
  function wrapD(fn) { return function (S, D) { regFix(S); var a = Array.prototype.slice.call(arguments); a[1] = dOf(S, D); return fn.apply(null, a); }; }
  // Manager-Level, ab dem man einen Verein dieser Spielklasse zum Start wählen darf (Aufstiege sind frei)
  // Ab Regionalliga (Ebene 1–4) grundsätzlich gesperrt – Amateur Manager, keine Profi-/Lizenzvereine
  var LIGA_LVL = { 1: 999, 2: 999, 3: 999, 4: 999 };
  // Gebiet einheitlich: in Württemberg und Südbaden sind die Bezirke die unterste Ebene (= Fußballkreis)
  function gebietNorm(vb, g) { g = String(g || ''); if (vb === 'Württemberg' || vb === 'Südbaden') { if (/^Bezirk /.test(g)) return g.replace(/^Bezirk /, 'Kreis '); if (vb === 'Südbaden' && g && !/^(Kreis |Südbaden)/.test(g)) return 'Kreis ' + g; } return g; }
  return { skInfo: skInfo, SKL: SKL, PERS: SKPERS, IPN: IPN, WVN: WVN, EINN: EINN, applyCfg: applyCfg, cfgInfo: cfgInfo, _injT: function (n) { var e = { heal: 0 }, c = {}; for (var i = 0; i < n; i++) { var d = injDays(e), nm = injName(d); c[nm] = (c[nm] || 0) + 1; } return c; }, ligaName: ligaName, gebietNorm: gebietNorm, LIGA_LVL: LIGA_LVL, VB_LAND: VB_LAND, PRO_ORT: PRO_ORT, dOf: dOf, buildReg: buildReg, rx: rxPub, clubTown: clubTown, geoIndex: geoIndex, geoFind: geoFind, leagueView: wrapD(leagueView), teamSquad: wrapD(teamSquad), oppInfo: wrapD(oppInfo), tableBefore: wrapD(tableBefore), normalize: normalize, newGame: newGame, act: wrapD(actW), view: wrapD(view), summary: wrapD(summary), FEATURES: FEATURES, XPLV: XPLV, levelOf: levelOf, ACH: ACH, SPONS: SPONS, featLvl: featLvl, FORMS: FORMS, DPN: DPN, GRP: GRP, SHOP: SHOP, _int: { simDay: simDay, table: table, xiAvg: xiAvg, mw: mw, eff: eff, natLvl: natLvl } };
})();
