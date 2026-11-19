// Amateur Manager – Spiel-Server
// Der Browser schickt nur Aktionen; Spielstand und Regeln liegen ausschließlich hier.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { ENGINE_VERSION, MGR, MGR_DATA } from '../_shared/engine.js';

const X = MGR_DATA;
const D = MGR.normalize({
  regeln: X.REGELN, ligen: X.LIGEN, ausbau: X.AUSBAU, camps: X.CAMPS, events: X.EVENTS,
  konfig: X.KONFIG, mails: X.MAILS, vornamen: X.VORNAMEN, nachnamen: X.NACHNAMEN,
});

const ORIGINS = ['https://amateur-manager.de', 'https://www.amateur-manager.de', 'https://buddy-bots.github.io'];
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const QUERY_FNS = new Set(['leagueView', 'teamSquad', 'oppInfo', 'tableBefore']);
const MAX_SAVES = 3;

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Bilder aus der Admin-Seite (z. B. Partnerbilder) – alle 10 Minuten neu geladen
let mediaAt = 0;
async function refreshMedia() {
  if (Date.now() - mediaAt < 600_000) return;
  mediaAt = Date.now();
  const { data } = await admin.from('media').select('key, path').order('key').limit(3000);
  const base = Deno.env.get('SUPABASE_URL') + '/storage/v1/object/public/media/';
  (D as any).relImgs = (data || []).filter((m: any) => m.key.startsWith('rel.')).map((m: any) => base + m.path.split('/').map(encodeURIComponent).join('/'));
}

// Echte Ligen eines Verbands (für die Vereinswahl beim Spielstart) – 10 Minuten zwischengespeichert
const ligCache: Record<string, { at: number; st: any[] }> = {};
async function verbandStaffeln(verband: string) {
  const c = ligCache[verband];
  if (c && Date.now() - c.at < 600_000) return c.st;
  const vbs = verband === 'Rheinland' || verband === 'Südwest' ? [verband, 'RV Südwest', 'DFB'] : ['Baden', 'Südbaden', 'Württemberg'].includes(verband) ? [verband, 'Oberliga BW', 'RV Südwest', 'DFB'] : verband === 'Bayern' ? [verband, 'DFB'] : [verband, 'RV West', 'DFB'];
  const st: any[] = []; let error: any = null;
  for (let o = 0; o < 20000; o += 1000) { const r = await admin.from('ligen_staffeln').select('id, ebene, klasse, name, gebiet').in('verband', vbs).eq('aktiv', true).order('id').range(o, o + 999); if (r.error) { error = r.error; break; } st.push(...(r.data || [])); if ((r.data || []).length < 1000) break; }
  if (error || !st.length) throw new HttpError(500, 'Ligadaten nicht verfügbar.');
  const ids = st.map((x: any) => x.id), teams: any[] = [];
  for (let i = 0; i < ids.length; i += 40) {
    const { data, error: e2 } = await admin.from('ligen_teams').select('id, staffel_id, verein_id, name, zone, aktiv').in('staffel_id', ids.slice(i, i + 40)).limit(1000);
    if (e2) throw new HttpError(500, 'Ligadaten nicht verfügbar.');
    teams.push(...(data || []));
  }
  const by: Record<string, any[]> = {};
  teams.forEach((t) => { (by[t.staffel_id] = by[t.staffel_id] || []).push(t); });
  st.forEach((x: any) => { x.teams = by[x.id] || []; });
  ligCache[verband] = { at: Date.now(), st };
  return st;
}
async function regFor(teamId: string) {
  if (!/^[0-9A-Z]{10,40}$/.test(teamId)) throw new HttpError(400, 'Ungültige Mannschaft.');
  const { data: t } = await admin.from('ligen_teams').select('id, aktiv, verein_id, kreis, ligen_staffeln(verband)').eq('id', teamId).maybeSingle();
  if (!t || !(t as any).ligen_staffeln) throw new HttpError(400, 'Mannschaft nicht gefunden.');
  if (!(t as any).aktiv) throw new HttpError(400, 'Diese Mannschaft ist nicht spielbar.');
  let verband = (t as any).ligen_staffeln.verband;
  if (['DFB', 'RV West', 'RV Südwest', 'Oberliga BW'].includes(verband)) {
    // Überregionale Liga: Verband über die eigenen Zweitmannschaften, sonst über den Fußballkreis des Ortes
    let vb = '';
    if ((t as any).verein_id) { const { data: o } = await admin.from('ligen_teams').select('ligen_staffeln!inner(verband)').eq('verein_id', (t as any).verein_id).not('ligen_staffeln.verband', 'in', '("DFB","RV West","RV Südwest","Oberliga BW")').limit(1); vb = (o?.[0] as any)?.ligen_staffeln?.verband || ''; }
    if (!vb && (t as any).kreis) { const { data: ks } = await admin.from('ligen_staffeln').select('verband').eq('gebiet', 'Kreis ' + (t as any).kreis).limit(1); vb = (ks?.[0] as any)?.verband || ''; }
    if (!vb && verband === 'RV Südwest') vb = 'Südwest';
    if (!vb) throw new HttpError(400, 'Dieser Verein liegt (noch) nicht in einem spielbaren Bundesland.');
    verband = vb;
  }
  const st = JSON.parse(JSON.stringify(await verbandStaffeln(verband)));
  return MGR.buildReg(verband, st, teamId);
}

// Ligendaten aus dem öffentlichen Repo (data/nrw-*.json) in die Datenbank übernehmen.
// Braucht keinen Schlüssel: Quelle ist nur das eigene Repo, höchstens alle 3 Minuten. Von Hand geänderte Namen bleiben.
const LIG_RAW = 'https://raw.githubusercontent.com/buddy-bots/amateur-manager/';
const ligDec = (s: string) => String(s).replace(/&#8203;|​/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
// Mannschaftsnummer immer römisch: „SV Musterdorf 2“ → „SV Musterdorf II“
const ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
const ligTeam = (s: string) => ligDec(s).replace(/\s+(I|1)\.?$/, '').replace(/\s+([2-9])\.?$/, (_m, d) => ' ' + ROM[+d]).replace(/\s+([2-9])\.?\s*(Mannschaft|Mannsch\.)$/i, (_m, d) => ' ' + ROM[+d]);
function ligStaffel(n: string, gn: string, vb: string) {
  let s = ligDec(n).replace(/^\d{2,4}\s+/, '').replace(/^BZL\b/, 'Bezirksliga').replace(/^KL\b/, 'Kreisliga').replace(/^KK\b/, 'Kreisklasse').replace(/^LL\b/, 'Landesliga').replace(/\bHerren\b/gi, '').replace(/\b20\d\d\/20\d\d\b/g, '').replace(/\b\d\d\/\d\d\b/g, '').replace(/^IGA 20\d\d\s+/i, '').replace(/\s+-\s+/g, ' – ').replace(/\s{2,}/g, ' ').replace(/[\s,–-]+$/, '').trim();
  const kreis = /^Kreis /.test(gn || '') ? gn.replace(/^Kreis /, '') : '';
  if (kreis && s.toLowerCase().indexOf(kreis.toLowerCase().slice(0, 6)) < 0) {
    const m = s.match(/^(Kreisliga [A-D])(.*)$/);
    let rest = m ? m[2].replace(/^[\s,–-]+/, '').trim() : '';
    if (/^\d+$/.test(rest)) rest = 'Staffel ' + rest;
    s = m ? m[1] + ' ' + kreis + (rest ? ', ' + rest : '') : s + ' (' + kreis + ')';
  }
  const m2 = !kreis && vb && s.indexOf(vb) < 0 && s.match(/^(Landesliga|Bezirksliga|Westfalenliga)[\s,]*(.*)$/);
  if (m2 && m2[1] !== 'Westfalenliga') s = m2[1] + ' ' + vb + (m2[2] ? ', ' + m2[2].replace(/ 0(\d)$/, ' $1') : '');
  else if (m2) s = 'Westfalenliga' + (m2[2] ? ', ' + m2[2] : '');
  return s.replace(/\s+,/g, ',').trim();
}
async function ligenImport(ref: string) {
  const { data: last } = await admin.from('ligen_teams').select('updated_at').order('updated_at', { ascending: false }).limit(1);
  if (last?.[0] && Date.now() - new Date(last[0].updated_at).getTime() < 180_000) return { status: 'recent', at: last[0].updated_at };
  const r = /^[0-9a-f]{40}$/.test(ref) ? ref : 'umbau';
  let res = await fetch(LIG_RAW + r + '/data/ligen-2627.json');
  if (res.status === 404) res = await fetch(LIG_RAW + r + '/data/nrw-2627.json');
  if (!res.ok) throw new HttpError(502, 'Ligendatei nicht erreichbar (' + res.status + ').');
  const d = await res.json();
  // Ortskoordinaten für den Kartenmarker (Ort aus dem Vereinsnamen, sonst Kreisstadt)
  let orte: Record<string, any[]> = {};
  try { const ro = await fetch(LIG_RAW + r + '/data/orte-de.json'); if (ro.ok) orte = await ro.json(); } catch (_) { /* ohne Marker */ }
  const part = MGR.geoIndex(orte);
  const now = new Date().toISOString(), S: any[] = [], T: any[] = [], seen: Record<string, 1> = {}, drop: string[] = [];
  for (const v of d.verbaende || []) {
    const order: string[] = [];
    for (const s of v.staffeln) if (!order.includes(s.skn)) order.push(s.skn);
    for (const s of v.staffeln) {
      s.gn = MGR.gebietNorm(v.name, s.gn);
      // Eine Mannschaft steht manchmal in zwei Runden (Findungs-/Meisterrunde): nur die erste zählt, leere Staffeln entfallen
      // Ohne Team-ID (z. B. Bayern) eine feste ID aus Staffel und Name bilden; zurückgezogene Mannschaften (zg.) entfallen
      const hid = (x: string) => { let h1 = 5381, h2 = 52711; for (let i = 0; i < x.length; i++) { const c = x.charCodeAt(i); h1 = (h1 * 33) ^ c; h2 = (h2 * 31) ^ c; } return 'N' + ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)).toUpperCase(); };
      for (const t of s.teams) if (!t.id) t.id = hid(s.id + '|' + t.n);
      const own = s.teams.filter((t: any) => { if (seen[t.id] || /\bzg\.?\s*$/i.test(String(t.n).trim())) return false; seen[t.id] = 1; return true; });
      const eb = s.ebene || (v.start || 5) + order.indexOf(s.skn);
      if (own.length < 4 || eb > 11) { drop.push(s.id); continue; }
      S.push({ id: s.id, saison: d.season, verband: v.name, ebene: s.ebene || (v.start || 5) + order.indexOf(s.skn), klasse: s.skn, name: ligStaffel(s.n, s.gn, v.name), name_fd: s.n, gebiet: s.gn, updated_at: now });
      for (const t of own) { const g = MGR.geoFind(orte, part, ligTeam(t.n), v.name, s.gn); T.push({ id: t.id, staffel_id: s.id, verein_id: t.club, name: ligTeam(t.n), name_fd: t.n, rang: t.r | 0, zone: t.z || '', lat: g ? g[0] : null, lon: g ? g[1] : null, updated_at: now }); }
    }
  }
  if (S.length < 50) throw new HttpError(422, 'Ligendatei unvollständig.');
  // Profiligen (1.–3. Liga, Regionalliga West) aus der Spielwelt, damit auch diese Vereine wählbar sind
  const slug = (n: string) => n.normalize('NFD').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  for (const [l, vb, id] of [[1, 'DFB', 'AMLIGA1'], [2, 'DFB', 'AMLIGA2'], [3, 'DFB', 'AMLIGA3'], [4, 'RV West', 'AMLIGA4W']] as [number, string, string][]) {
    const nm = String((D.lv[l] || {}).name || ''); if (!nm || !(D.teams[l] || []).length) continue;
    S.push({ id, saison: d.season, verband: vb, ebene: l, klasse: nm, name: nm, name_fd: nm, gebiet: '', updated_at: now });
    for (const t of D.teams[l]) { const tid = ('AM' + l + slug(t.n) + 'XXXXXXXX').slice(0, 40); if (seen[tid]) continue; seen[tid] = 1; const g = MGR.geoFind(orte, part, t.n, vb, ''); T.push({ id: tid, staffel_id: id, verein_id: null, name: t.n, name_fd: t.n, rang: 0, zone: '', lat: g ? g[0] : null, lon: g ? g[1] : null, updated_at: now }); }
  }
  // Fußballkreis je Mannschaft: Kreis der eigenen Kreisliga-Teams des Vereins, sonst der nächstgelegene Kreis (für die Kartenauswahl)
  const stG: Record<string, string> = {}, stV: Record<string, string> = {}; S.forEach((x) => { stG[x.id] = x.gebiet || ''; stV[x.id] = x.verband; });
  const clubK: Record<string, string> = {}, cen: Record<string, [number, number, number, string]> = {};
  T.forEach((t) => { const g = stG[t.staffel_id]; if (!/^Kreis /.test(g)) return; const k = g.replace(/^Kreis\s+/, ''); if (t.verein_id && !clubK[t.verein_id]) clubK[t.verein_id] = k; if (t.lat) { const c = (cen[k] = cen[k] || [0, 0, 0, stV[t.staffel_id]]); c[0] += t.lat; c[1] += t.lon; c[2]++; } });
  const overall = (vb: string) => vb === 'RV Südwest' || vb === 'RV West' || vb === 'DFB' || vb === 'Oberliga BW';
  const kLand: Record<string, string> = {}; Object.keys(cen).forEach((k) => { kLand[k] = (MGR.VB_LAND[cen[k][3]] || [])[0] || ''; });
  const near = (lat: number, lon: number, vb: string, land?: string) => { let b = '', bd = 1e9; for (const k of Object.keys(cen)) { const c = cen[k]; if (land ? kLand[k] !== land : (!overall(vb) && c[3] !== vb)) continue; const d = (c[0] / c[2] - lat) ** 2 + (c[1] / c[2] - lon) ** 2; if (d < bd) { bd = d; b = k; } } return b && (!overall(vb) || bd < 0.12) ? b : null; };
  T.forEach((t) => { const vb = stV[t.staffel_id]; const po = MGR.PRO_ORT[t.name]; t.kreis = (t.verein_id && clubK[t.verein_id]) || (t.lat ? near(t.lat, t.lon, vb, po ? po[1] : vb === 'Oberliga BW' ? 'Baden-Württemberg' : undefined) : null); t.land = overall(vb) ? (po ? po[1] : (t.kreis ? kLand[t.kreis] || null : null)) : ((MGR.VB_LAND[vb] || [])[0] || null); });
  const fixS: Record<string, string> = {}, fixT: Record<string, string> = {};
  for (const [tb, fx] of [['ligen_staffeln', fixS], ['ligen_teams', fixT]] as const) {
    const { data } = await admin.from(tb).select('id, name').eq('name_fix', true).limit(5000);
    (data || []).forEach((x: any) => { (fx as any)[x.id] = x.name; });
  }
  S.forEach((x) => { x.name_fix = !!fixS[x.id]; if (x.name_fix) x.name = fixS[x.id]; });
  T.forEach((x) => { x.name_fix = !!fixT[x.id]; if (x.name_fix) x.name = fixT[x.id]; });
  for (let i = 0; i < S.length; i += 300) { const { error } = await admin.from('ligen_staffeln').upsert(S.slice(i, i + 300), { onConflict: 'id' }); if (error) throw new HttpError(500, error.message); }
  for (let i = 0; i < T.length; i += 800) { const { error } = await admin.from('ligen_teams').upsert(T.slice(i, i + 800), { onConflict: 'id' }); if (error) throw new HttpError(500, error.message); }
  await admin.from('ligen_teams').delete().like('name', '% zg.');
  for (let i = 0; i < drop.length; i += 100) await admin.from('ligen_staffeln').delete().in('id', drop.slice(i, i + 100));
  Object.keys(ligCache).forEach((k) => delete ligCache[k]);
  return { status: 'ok', staffeln: S.length, teams: T.length, ref: r };
}

// ---------------------------------------------------------------- Einladungen & Konto-Missionen
const REF_XP = 50; // XP für den Einladenden, sobald sich eine echte Person (bestätigte E-Mail) anmeldet
const REF_MIS: [string, string, number, { j?: number; h?: number }][] = [
  ['s1', '1 eingeladene Person spielt eine Saison', 1, { j: 1 }],
  ['s3', '3 eingeladene Personen spielen eine Saison', 3, { j: 1, h: 2 }],
  ['s10', '10 eingeladene Personen spielen eine Saison', 10, { j: 3, h: 4 }],
];
function refCode(name: string) { const b = String(name || 'AM').normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5) || 'AM'; const r = Array.from(crypto.getRandomValues(new Uint8Array(4))).map((x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join(''); return b + '-' + r; }
async function seasonsOf(ids: string[]) {
  const out: Record<string, number> = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin.from('saves').select('user_id, season, start:state->>start').in('user_id', ids.slice(i, i + 200));
    (data || []).forEach((r: any) => { const y0 = parseInt(String(r.start || '').slice(0, 4)) || r.season; const n = Math.max(0, (Number(r.season) || 0) - y0); out[r.user_id] = Math.max(out[r.user_id] || 0, n); });
  }
  return out;
}
async function refInfo(userId: string, profile: any) {
  let { data: c } = await admin.from('invite_codes').select('code').eq('user_id', userId).eq('seller', false).maybeSingle();
  if (!c) { for (let t = 0; t < 4 && !c; t++) { const code = refCode(profile.display_name); const { error } = await admin.from('invite_codes').insert({ code, user_id: userId }); if (!error) c = { code }; } }
  const { data: inv } = await admin.from('invites').select('invitee, confirmed, seasons').eq('inviter', userId);
  const list = inv || [], ss = await seasonsOf(list.map((x: any) => x.invitee));
  for (const x of list) { const n = ss[x.invitee] || 0; if (n !== x.seasons) { x.seasons = n; await admin.from('invites').update({ seasons: n }).eq('invitee', x.invitee); } }
  const played = list.filter((x: any) => x.seasons >= 1).length, b = profile.bonus || {}, done = b.m || {};
  return { code: c?.code, invited: list.length, confirmed: list.filter((x: any) => x.confirmed).length, played, xpEach: REF_XP, credit: b.cr || { j: 0, h: 0 },
    missions: REF_MIS.map(([k, t, n, rw]) => ({ k, t, n, rw, have: played, st: done[k] ? 'claimed' : played >= n ? 'done' : 'open' })) };
}
async function refClaim(userId: string, profile: any, code: string) {
  code = code.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  if (!code) return { ok: false };
  const { data: had } = await admin.from('invites').select('invitee').eq('invitee', userId).maybeSingle();
  if (had) return { ok: false, why: 'schon zugeordnet' };
  if (Date.now() - new Date(profile.created_at).getTime() > 14 * 864e5) return { ok: false, why: 'Konto zu alt' };
  const { data: c } = await admin.from('invite_codes').select('code, user_id').eq('code', code).maybeSingle();
  if (!c || c.user_id === userId) return { ok: false, why: 'ungültiger Code' };
  const { data: au } = await admin.auth.admin.getUserById(userId);
  const confirmed = !!(au?.user?.email_confirmed_at || au?.user?.confirmed_at);
  const { error } = await admin.from('invites').insert({ invitee: userId, code: c.code, inviter: c.user_id, confirmed });
  if (error) return { ok: false };
  if (confirmed && c.user_id) { const { data: ip } = await admin.from('profiles').select('id, xp').eq('id', c.user_id).maybeSingle(); if (ip) await addXp(c.user_id, ip, REF_XP); }
  return { ok: true };
}
async function refMission(userId: string, profile: any, k: string) {
  const info = await refInfo(userId, profile), m = info.missions.find((x) => x.k === k);
  if (!m || m.st !== 'done') throw new HttpError(422, 'Diese Mission ist noch nicht geschafft.');
  const b = { ...(profile.bonus || {}) }; b.m = { ...(b.m || {}), [k]: 1 }; const cr = b.cr || { j: 0, h: 0 }; b.cr = { j: (cr.j | 0) + (m.rw.j || 0), h: (cr.h | 0) + (m.rw.h || 0) };
  await admin.from('profiles').update({ bonus: b }).eq('id', userId); profile.bonus = b;
  return await refInfo(userId, profile);
}
async function refAdmin(add: string, label: string, me = '') {
  if (add) { const code = add.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24); if (code.length < 4) throw new HttpError(400, 'Code zu kurz.'); const { error } = await admin.from('invite_codes').insert({ code, label: label.slice(0, 60) || null, seller: true }); if (error) throw new HttpError(400, 'Code existiert schon.'); }
  const { data: codes } = await admin.from('invite_codes').select('code, user_id, label, seller, created_at').limit(5000);
  const { data: inv } = await admin.from('invites').select('invitee, inviter, code, confirmed, seasons, created_at').limit(20000);
  const ss = await seasonsOf((inv || []).map((x: any) => x.invitee));
  const owners = [...new Set((codes || []).map((c: any) => c.user_id).filter(Boolean))];
  const names: Record<string, string> = {};
  for (let i = 0; i < owners.length; i += 200) { const { data } = await admin.from('profiles').select('id, display_name').in('id', owners.slice(i, i + 200)); (data || []).forEach((p: any) => { names[p.id] = p.display_name; }); }
  const by: Record<string, any> = {}, now = Date.now();
  (inv || []).forEach((x: any) => { const n = ss[x.invitee] || 0; const o = (by[x.code] = by[x.code] || { reg: 0, conf: 0, s1: 0, d30: 0 }); o.reg++; if (x.confirmed) o.conf++; if (n >= 1) o.s1++; if (now - new Date(x.created_at).getTime() < 30 * 864e5) o.d30++; });
  const rows = (codes || []).map((c: any) => ({ code: c.code, seller: c.seller, label: c.label || '', owner: c.user_id ? names[c.user_id] || '' : '', created_at: c.created_at, ...(by[c.code] || { reg: 0, conf: 0, s1: 0, d30: 0 }) }))
    .filter((r: any) => r.seller || r.reg > 0).sort((a: any, b: any) => (b.seller - a.seller) || (b.reg - a.reg));
  // Entwickler-Box: wen ich eingeladen habe und wie viele die wiederum eingeladen haben
  const mine = (inv || []).filter((x: any) => x.inviter === me);
  const { data: inv2 } = await admin.from('invites').select('invitee, inviter').limit(20000);
  const sub: Record<string, number> = {}; (inv2 || []).forEach((x: any) => { if (x.inviter) sub[x.inviter] = (sub[x.inviter] || 0) + 1; });
  const ids = mine.map((x: any) => x.invitee); const nm: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += 200) { const { data } = await admin.from('profiles').select('id, display_name, access_at').in('id', ids.slice(i, i + 200)); (data || []).forEach((p: any) => { nm[p.id] = p.display_name + (p.access_at ? '' : ' (ohne Code)'); }); }
  const dev = { n: mine.length, sub: mine.reduce((a: number, x: any) => a + (sub[x.invitee] || 0), 0), list: mine.map((x: any) => ({ name: nm[x.invitee] || '?', at: x.created_at, s: ss[x.invitee] || 0, sub: sub[x.invitee] || 0 })) };
  return { rows, dev };
}

class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

function cors(origin: string | null) {
  const ok = origin && (ORIGINS.includes(origin) || LOCAL.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin! : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

async function reply(req: Request, body: unknown, status = 200) {
  const headers: Record<string, string> = { ...cors(req.headers.get('Origin')), 'Content-Type': 'application/json' };
  const json = JSON.stringify(body);
  if (json.length > 4096 && (req.headers.get('Accept-Encoding') || '').includes('gzip')) {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    headers['Content-Encoding'] = 'gzip';
    return new Response(stream, { status, headers });
  }
  return new Response(json, { status, headers });
}

// Datum in deutscher Zeit (für tägliche Belohnung, nie die Uhr des Geräts)
function berlinDay() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
}

async function loadSave(userId: string, saveId: string) {
  const { data, error } = await admin.from('saves').select('id, state, version, engine_version, joker_snap, joker_date').eq('id', saveId).eq('user_id', userId).single();
  if (error || !data) throw new HttpError(404, 'Spielstand nicht gefunden.');
  return data;
}

function prepare(S: any, profile: any) {
  S.xp = Number(profile.xp) || 0;
  const l = MGR.levelOf(S.xp).lvl;
  if (l > (S.mlvl || 1)) S.mlvl = l;
  return S;
}

function meta(S: any) {
  const v = MGR.view(S, D);
  return { club: v.club || null, league: v.liga || null, season: S.season || null };
}

async function persist(userId: string, saveId: string, S: any, version: number, extra: Record<string, unknown> = {}) {
  const m = meta(S);
  const { data, error } = await admin.from('saves')
    .update({ state: S, version: version + 1, summary: MGR.summary(S, D) || {}, club_name: m.club, league_name: m.league, season: m.season, updated_at: new Date().toISOString(), ...extra })
    .eq('id', saveId).eq('user_id', userId).eq('version', version).select('version').single();
  if (error || !data) throw new HttpError(409, 'Der Spielstand wurde inzwischen an anderer Stelle geändert. Bitte neu laden.');
  return { state: S, version: data.version };
}

// Joker verfügbar: Snapshot vom heutigen Spieltag, Spiel vorbei
function jokerOk(S: any, sv: any) {
  return !!(sv.joker_snap && sv.joker_date === S.date && !S.live && (S.jokers || 0) > 0);
}

// "Weiter"-Lauf: simuliert Tag für Tag bis zum nächsten Halt (wie früher im Browser)
function runSim(S: any, mode: string) {
  const openMails = (V: any) => (V && V.mails ? V.mails.filter((m: any) => !m.answered).length : 0);
  let V = MGR.view(S, D);
  const mails0 = openMails(V), inbox0 = S.inbox && S.inbox.length ? S.inbox[0] : null;
  let steps = 0, levelUp: any = null, info = '';
  for (;;) {
    const r = MGR.act(S, D, 'sim', { mode: 'day', auto: mode === 'match' });
    steps++; if (r && r.levelUp && !levelUp) levelUp = r.levelUp; if (r && r.info) info = r.info;
    V = MGR.view(S, D);
    const stop = mode === 'day' || V.fired || V.twPop || V.cupPop || V.weekNeed || V.potsPop || V.unlockNote || V.posPop || V.trPop || V.kitNeed || V.trialRes || V.pressPending || V.spNeed || V.starPop || V.pending || V.blockMails || V.matchToday || V.seasonRep || V.needAlloc || levelUp || V.trainToday || (V.prep && (V.prep.need || V.prep.info)) || (V.priv && V.priv.fam && V.priv.fam.pend) || steps > 150 ||
      (mode === 'event' && (openMails(V) > mails0 || (S.inbox[0] !== inbox0 && /^(ereignis|transfer|verein|erfolg)$/.test(S.inbox[0].k))));
    if (stop) break;
  }
  return { steps, levelUp, info };
}

async function addXp(userId: string, profile: any, delta: number) {
  if (!(delta > 0)) return;
  await admin.from('profiles').update({ xp: (Number(profile.xp) || 0) + Math.round(delta) }).eq('id', userId);
  profile.xp = (Number(profile.xp) || 0) + Math.round(delta);
}

function sanitize(action: string, params: any) {
  const p = params && typeof params === 'object' ? { ...params } : {};
  delete p._srv; // nur der Server setzt Bonus-Belohnungen
  if (action === 'dailyCheck') p.today = berlinDay(); // Serverzeit statt Geräteuhr
  return p;
}

async function handle(req: Request, userId: string, body: any) {
  try { await refreshMedia(); } catch (_e) { /* Bilder sind optional */ }
  const { data: profile } = await admin.from('profiles').select('id, display_name, xp, terms_accepted_at, patch_note_accepted_at, is_admin, bonus, created_at, access_at').eq('id', userId).single();
  if (!profile) throw new HttpError(403, 'Profil fehlt.');
  const ready = !!(profile.terms_accepted_at && profile.patch_note_accepted_at);
  const op = String(body.op || '');

  if (op === 'init') {
    await admin.from('daily_logins').upsert({ user_id: userId, day: berlinDay() }, { onConflict: 'user_id,day', ignoreDuplicates: true });
    const { data: saves } = await admin.from('saves').select('id, mode, engine_version, club_name, league_name, season, updated_at').eq('user_id', userId).order('updated_at', { ascending: false });
    return { profile: { name: profile.display_name, xp: profile.xp, level: MGR.levelOf(Number(profile.xp) || 0), ready, admin: profile.is_admin, access: !!(profile.access_at || profile.is_admin) }, saves: saves || [], engineVersion: ENGINE_VERSION, today: berlinDay() };
  }
  if (op === 'keyRedeem') {
    // Zugangscode einmalig einlösen
    if (profile.access_at || profile.is_admin) return { ok: true, already: true };
    const code = String(body.code || '').replace(/\D/g, '');
    if (code.length !== 8) throw new HttpError(400, 'Der Zugangscode hat 8 Ziffern.');
    const { data: k } = await admin.from('access_keys').update({ used_by: userId, used_at: new Date().toISOString() }).eq('code', code).is('used_by', null).select('code').maybeSingle();
    if (!k) throw new HttpError(400, 'Dieser Zugangscode ist ungültig oder wurde schon benutzt.');
    await admin.from('profiles').update({ access_at: new Date().toISOString() }).eq('id', userId);
    return { ok: true };
  }
  if ((op === 'new' || op === 'load') && !profile.access_at && !profile.is_admin) throw new HttpError(403, 'Zum Spielen brauchst du einen Zugangscode.');
  if (op === 'export') {
    const [saves, tickets, msgs, purchases, favs, logins] = await Promise.all([
      admin.from('saves').select('id, mode, engine_version, club_name, league_name, season, created_at, updated_at, state').eq('user_id', userId),
      admin.from('feedback_tickets').select('ticket_no, message, answer, answered_at, created_at').eq('user_id', userId),
      admin.from('wa_messages').select('from_user, to_user, body, read_at, created_at').or('from_user.eq.' + userId + ',to_user.eq.' + userId),
      admin.from('purchases').select('product, mode, amount_cents, currency, status, created_at').eq('user_id', userId),
      admin.from('wa_favorites').select('contact, created_at').eq('user_id', userId),
      admin.from('daily_logins').select('day').eq('user_id', userId),
    ]);
    const { data: prof } = await admin.from('profiles').select('display_name, birth_year, lang, created_at, last_seen_at, xp, terms_accepted_at, patch_note_accepted_at').eq('id', userId).single();
    const { data: au } = await admin.auth.admin.getUserById(userId);
    return { exportedAt: new Date().toISOString(), account: { email: au?.user?.email, provider: au?.user?.app_metadata?.provider, created_at: au?.user?.created_at }, profile: prof, saves: saves.data, feedback: tickets.data, chat: msgs.data, purchases: purchases.data, favorites: favs.data, dailyLogins: logins.data };
  }
  if (op === 'deleteAccount') {
    if (body.confirm !== 'LÖSCHEN') throw new HttpError(400, 'Bitte zur Bestätigung LÖSCHEN eingeben.');
    const { data: files } = await admin.storage.from('avatars').list(userId);
    if (files && files.length) await admin.storage.from('avatars').remove(files.map((f: any) => userId + '/' + f.name));
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new HttpError(500, 'Konto konnte nicht gelöscht werden.');
    return { ok: true };
  }
  if (!ready) throw new HttpError(403, 'Bitte zuerst das Profil vervollständigen.');

  if (op === 'handoff') {
    // PC zeigt einen QR-Code; das Handy meldet sich damit, der PC muss bestätigen
    await admin.from('handoffs').delete().eq('user_id', userId);
    const code = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const sid = body.saveId && /^[0-9a-f-]{36}$/.test(String(body.saveId)) ? String(body.saveId) : null;
    const { error } = await admin.from('handoffs').insert({ code, user_id: userId, save_id: sid });
    if (error) throw new HttpError(500, 'Code konnte nicht erstellt werden.');
    return { ok: true, code };
  }
  if (op === 'handoffState') {
    const { data: h } = await admin.from('handoffs').select('status, created_at').eq('code', String(body.code || '')).eq('user_id', userId).maybeSingle();
    if (!h || Date.now() - Date.parse(h.created_at) > 15 * 60000) return { status: 'expired' };
    return { status: h.status };
  }
  if (op === 'handoffApprove') {
    const { data: h } = await admin.from('handoffs').select('status, created_at').eq('code', String(body.code || '')).eq('user_id', userId).maybeSingle();
    if (!h || h.status !== 'scanned' || Date.now() - Date.parse(h.created_at) > 15 * 60000) throw new HttpError(400, 'Die Anfrage ist abgelaufen.');
    if (!body.ok) { await admin.from('handoffs').update({ status: 'denied' }).eq('code', String(body.code)); return { ok: true }; }
    const { data: u } = await admin.auth.admin.getUserById(userId);
    if (!u?.user?.email) throw new HttpError(400, 'Für dieses Konto ist kein Handy-Login möglich.');
    const { data: lk, error: le } = await admin.auth.admin.generateLink({ type: 'magiclink', email: u.user.email });
    if (le || !lk?.properties?.hashed_token) throw new HttpError(500, 'Freigabe fehlgeschlagen.');
    await admin.from('handoffs').update({ status: 'approved', hash: lk.properties.hashed_token }).eq('code', String(body.code));
    return { ok: true };
  }
  if (op === 'new') {
    const { count } = await admin.from('saves').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    if ((count || 0) >= MAX_SAVES) throw new HttpError(400, 'Maximal ' + MAX_SAVES + ' Spielstände – bitte erst einen löschen.');
    const self = body.self && typeof body.self.pos === 'string' ? { pos: body.self.pos.slice(0, 3) } : null;
    const xp = Number(profile.xp) || 0;
    const reg = body.team ? await regFor(String(body.team)) : null;
    const needL = reg ? MGR.LIGA_LVL[reg.lvl] || 0 : 0;
    if (needL && MGR.levelOf(xp).lvl < needL) throw new HttpError(403, 'Vereine aus der ' + ((reg as any).lv[reg.lvl] || {}).name + ' kannst du ab Manager-Level ' + needL + ' wählen.');
    let S: any;
    try { S = MGR.newGame(D, { mgr: profile.display_name.split(' ')[0], full: profile.display_name, xp, mlvl: MGR.levelOf(xp).lvl, self, reg }); }
    catch (e) { throw new HttpError(400, (e as Error).message || String(e)); }
    const m = meta(S);
    const { data, error } = await admin.from('saves').insert({ user_id: userId, mode: 'single', engine_version: ENGINE_VERSION, state: S, summary: MGR.summary(S, D) || {}, club_name: m.club, league_name: m.league, season: m.season }).select('id, version').single();
    if (error) throw new HttpError(500, 'Spielstand konnte nicht angelegt werden.');
    return { saveId: data.id, version: data.version, state: S };
  }

  if (op === 'refInfo') return await refInfo(userId, profile);
  if (op === 'refClaim') return await refClaim(userId, profile, String(body.code || ''));
  if (op === 'refMission') return await refMission(userId, profile, String(body.k || ''));
  if (op === 'refAdmin') { if (!profile.is_admin) throw new HttpError(403, 'Nur für Admins.'); return await refAdmin(String(body.add || ''), String(body.label || ''), userId); }
  const saveId = String(body.saveId || '');
  if (!/^[0-9a-f-]{36}$/.test(saveId)) throw new HttpError(400, 'Spielstand fehlt.');

  if (op === 'load') {
    const sv = await loadSave(userId, saveId);
    // Laden zählt als Benutzung (Spielstände werden nach 3 Monaten ohne Nutzung gelöscht)
    await admin.from('saves').update({ updated_at: new Date().toISOString() }).eq('id', saveId).eq('user_id', userId);
    const S = prepare(sv.state, profile);
    return { saveId, version: sv.version, engineVersion: sv.engine_version, state: S, joker: jokerOk(S, sv) };
  }
  if (op === 'delete') {
    const { error } = await admin.from('saves').delete().eq('id', saveId).eq('user_id', userId);
    if (error) throw new HttpError(500, 'Löschen fehlgeschlagen.');
    return { ok: true };
  }
  if (op === 'act') {
    const action = String(body.action || '');
    if (!/^[a-zA-Z0-9]{1,40}$/.test(action)) throw new HttpError(400, 'Ungültige Aktion.');
    const sv = await loadSave(userId, saveId);
    if (body.version != null && Number(body.version) !== sv.version) throw new HttpError(409, 'Der Spielstand wurde inzwischen an anderer Stelle geändert. Bitte neu laden.');
    const S = prepare(sv.state, profile);
    const xpBefore = S.xpGame || 0;
    const extra: Record<string, unknown> = {};
    if (action === 'liveStart' && (S.jokers || 0) > 0) { extra.joker_snap = JSON.parse(JSON.stringify(S)); extra.joker_date = S.date; }
    const params = sanitize(action, body.params);
    let credit: any = null;
    if (action === 'bonusRedeem') { credit = (profile.bonus || {}).cr || {}; if (!(credit.j > 0 || credit.h > 0)) throw new HttpError(422, 'Kein Bonus-Guthaben vorhanden.'); params._srv = { j: credit.j | 0, h: credit.h | 0 }; }
    let r: any;
    try { r = action === 'run' ? runSim(S, String((body.params || {}).mode || 'day'))    : MGR.act(S, D, action, params); }
    catch (e) { throw new HttpError(422, (e as Error).message || String(e)); }
    if (!extra.joker_snap && sv.joker_date && sv.joker_date !== S.date) { extra.joker_snap = null; extra.joker_date = null; }
    await addXp(userId, profile, (S.xpGame || 0) - xpBefore);
    S.xp = Number(profile.xp) || 0;
    const out = await persist(userId, saveId, S, sv.version, extra);
    if (credit) { const b = { ...(profile.bonus || {}), cr: { j: 0, h: 0 } }; await admin.from('profiles').update({ bonus: b }).eq('id', userId); }
    const jk = extra.joker_snap === undefined && jokerOk(S, sv);
    return { r: r || {}, ...out, joker: jk };
  }
  if (op === 'joker') {
    const sv = await loadSave(userId, saveId);
    const S = prepare(sv.state, profile);
    if (!jokerOk(S, sv)) throw new HttpError(422, 'Den Joker kannst du direkt nach einem Spiel einsetzen – bevor du weiterspielst.');
    const S2 = prepare(JSON.parse(JSON.stringify(sv.joker_snap)), profile);
    S2.jokers = (S.jokers || 1) - 1; if (S.jok) S2.jok = S.jok;
    const out = await persist(userId, saveId, S2, sv.version, { joker_snap: null, joker_date: null });
    return { r: { info: '🃏 Joker eingesetzt – das Spiel kann neu beginnen!' }, ...out, joker: false };
  }
  if (op === 'q') {
    const fn = String(body.fn || '');
    if (!QUERY_FNS.has(fn)) throw new HttpError(400, 'Unbekannte Abfrage.');
    const sv = await loadSave(userId, saveId);
    const S = prepare(sv.state, profile);
    const args = Array.isArray(body.args) ? body.args.slice(0, 4) : [];
    return { result: (MGR as any)[fn](S, D, ...args) };
  }
  throw new HttpError(400, 'Unbekannte Anfrage.');
}

// Handy ohne Login: meldet den gescannten Code und holt nach der Bestätigung am PC den Einmal-Login ab
async function handoffClaim(code: string) {
  if (!/^[0-9a-f]{40}$/.test(code)) throw new HttpError(400, 'Ungültiger Code.');
  const { data: h } = await admin.from('handoffs').select('status, hash, save_id, created_at').eq('code', code).maybeSingle();
  if (!h || Date.now() - Date.parse(h.created_at) > 15 * 60000) return { status: 'expired' };
  if (h.status === 'open') { await admin.from('handoffs').update({ status: 'scanned' }).eq('code', code).eq('status', 'open'); return { status: 'waiting' }; }
  if (h.status === 'scanned') return { status: 'waiting' };
  if (h.status === 'denied') return { status: 'denied' };
  if (h.status === 'approved') { await admin.from('handoffs').update({ status: 'used', hash: null }).eq('code', code); return { status: 'ok', hash: h.hash, saveId: h.save_id }; }
  return { status: 'expired' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req.headers.get('Origin')) });
  if (req.method !== 'POST') return reply(req, { error: 'Nur POST.' }, 405);
  try {
    const text = await req.text();
    if (text.length > 100_000) throw new HttpError(413, 'Anfrage zu groß.');
    const body = JSON.parse(text || '{}');
    if (body.op === 'handoffClaim') return reply(req, await handoffClaim(String(body.code || '')));
    if (body.op === 'ligenImport') return reply(req, await ligenImport(String(body.ref || '')));
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await admin.auth.getUser(token);
    if (!auth?.user) throw new HttpError(401, 'Bitte neu einloggen.');
    return reply(req, await handle(req, auth.user.id, body));
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    return reply(req, { error: status === 500 ? 'Serverfehler – bitte später erneut versuchen.' : (e as Error).message }, status);
  }
});
