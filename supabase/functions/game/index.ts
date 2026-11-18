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
  const { data, error } = await admin.from('saves').select('id, state, version, engine_version').eq('id', saveId).eq('user_id', userId).single();
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
  return { V: v, club: v.club || v.verein || null, league: v.liga || null, season: S.season || null };
}

async function persist(userId: string, saveId: string, S: any, version: number) {
  const m = meta(S);
  const { data, error } = await admin.from('saves')
    .update({ state: S, version: version + 1, summary: MGR.summary(S, D) || {}, club_name: m.club, league_name: m.league, season: m.season, updated_at: new Date().toISOString() })
    .eq('id', saveId).eq('user_id', userId).eq('version', version).select('version').single();
  if (error || !data) throw new HttpError(409, 'Der Spielstand wurde inzwischen an anderer Stelle geändert. Bitte neu laden.');
  return { V: m.V, version: data.version };
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
  const { data: profile } = await admin.from('profiles').select('id, display_name, xp, terms_accepted_at, patch_note_accepted_at, is_admin').eq('id', userId).single();
  if (!profile) throw new HttpError(403, 'Profil fehlt.');
  const ready = !!(profile.terms_accepted_at && profile.patch_note_accepted_at);
  const op = String(body.op || '');

  if (op === 'init') {
    await admin.from('daily_logins').upsert({ user_id: userId, day: berlinDay() }, { onConflict: 'user_id,day', ignoreDuplicates: true });
    const { data: saves } = await admin.from('saves').select('id, mode, engine_version, club_name, league_name, season, updated_at').eq('user_id', userId).order('updated_at', { ascending: false });
    return { profile: { name: profile.display_name, xp: profile.xp, level: MGR.levelOf(Number(profile.xp) || 0), ready, admin: profile.is_admin }, saves: saves || [], engineVersion: ENGINE_VERSION, today: berlinDay() };
  }
  if (!ready) throw new HttpError(403, 'Bitte zuerst das Profil vervollständigen.');

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
    return { saveId: data.id, version: data.version, V: m.V };
  }

  const saveId = String(body.saveId || '');
  if (!/^[0-9a-f-]{36}$/.test(saveId)) throw new HttpError(400, 'Spielstand fehlt.');

  if (op === 'load') {
    const sv = await loadSave(userId, saveId);
    const S = prepare(sv.state, profile);
    return { saveId, version: sv.version, engineVersion: sv.engine_version, V: MGR.view(S, D) };
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
    let r: any;
    try { r = MGR.act(S, D, action, sanitize(action, body.params)); }
    catch (e) { throw new HttpError(422, (e as Error).message || String(e)); }
    await addXp(userId, profile, (S.xpGame || 0) - xpBefore);
    S.xp = Number(profile.xp) || 0;
    const out = await persist(userId, saveId, S, sv.version);
    return { r: r || {}, ...out };
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req.headers.get('Origin')) });
  if (req.method !== 'POST') return reply(req, { error: 'Nur POST.' }, 405);
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await admin.auth.getUser(token);
    if (!auth?.user) throw new HttpError(401, 'Bitte neu einloggen.');
    const text = await req.text();
    if (text.length > 100_000) throw new HttpError(413, 'Anfrage zu groß.');
    const body = JSON.parse(text || '{}');
    return reply(req, await handle(req, auth.user.id, body));
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    return reply(req, { error: status === 500 ? 'Serverfehler – bitte später erneut versuchen.' : (e as Error).message }, status);
  }
});
