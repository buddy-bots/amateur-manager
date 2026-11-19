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
  if (action === 'dailyCheck') p.today = berlinDay(); // Serverzeit statt Geräteuhr
  return p;
}

async function handle(req: Request, userId: string, body: any) {
  try { await refreshMedia(); } catch (_e) { /* Bilder sind optional */ }
  const { data: profile } = await admin.from('profiles').select('id, display_name, xp, terms_accepted_at, patch_note_accepted_at, is_admin').eq('id', userId).single();
  if (!profile) throw new HttpError(403, 'Profil fehlt.');
  const ready = !!(profile.terms_accepted_at && profile.patch_note_accepted_at);
  const op = String(body.op || '');

  if (op === 'init') {
    await admin.from('daily_logins').upsert({ user_id: userId, day: berlinDay() }, { onConflict: 'user_id,day', ignoreDuplicates: true });
    const { data: saves } = await admin.from('saves').select('id, mode, engine_version, club_name, league_name, season, updated_at').eq('user_id', userId).order('updated_at', { ascending: false });
    return { profile: { name: profile.display_name, xp: profile.xp, level: MGR.levelOf(Number(profile.xp) || 0), ready, admin: profile.is_admin }, saves: saves || [], engineVersion: ENGINE_VERSION, today: berlinDay() };
  }
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
    let S: any;
    try { S = MGR.newGame(D, { mgr: profile.display_name.split(' ')[0], full: profile.display_name, xp, mlvl: MGR.levelOf(xp).lvl, self }); }
    catch (e) { throw new HttpError(400, (e as Error).message || String(e)); }
    const m = meta(S);
    const { data, error } = await admin.from('saves').insert({ user_id: userId, mode: 'single', engine_version: ENGINE_VERSION, state: S, summary: MGR.summary(S, D) || {}, club_name: m.club, league_name: m.league, season: m.season }).select('id, version').single();
    if (error) throw new HttpError(500, 'Spielstand konnte nicht angelegt werden.');
    return { saveId: data.id, version: data.version, state: S };
  }

  const saveId = String(body.saveId || '');
  if (!/^[0-9a-f-]{36}$/.test(saveId)) throw new HttpError(400, 'Spielstand fehlt.');

  if (op === 'load') {
    const sv = await loadSave(userId, saveId);
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
    let r: any;
    try { r = action === 'run' ? runSim(S, String((body.params || {}).mode || 'day')) : MGR.act(S, D, action, sanitize(action, body.params)); }
    catch (e) { throw new HttpError(422, (e as Error).message || String(e)); }
    if (!extra.joker_snap && sv.joker_date && sv.joker_date !== S.date) { extra.joker_snap = null; extra.joker_date = null; }
    await addXp(userId, profile, (S.xpGame || 0) - xpBefore);
    S.xp = Number(profile.xp) || 0;
    const out = await persist(userId, saveId, S, sv.version, extra);
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
