// Holt alle Herren-Staffeln (Meisterschaft) der Verbände in NRW, Rheinland-Pfalz, Baden-Württemberg und Bayern von fussball.de
// und schreibt sie nach data/ligen-<saison>.json. Läuft in GitHub Actions (dort ist fussball.de erreichbar).
import { writeFileSync, mkdirSync } from 'node:fs';

const SAISON = process.env.SAISON || '2627';
// [Mandant, Name, Ebene der obersten Verbandsliga]
const VERB = [[23, 'Mittelrhein', 5], [22, 'Niederrhein', 5], [21, 'Westfalen', 5], [41, 'Rheinland', 6], [42, 'Südwest', 6], [31, 'Bayern', 4], [32, 'Baden', 6], [33, 'Südbaden', 6], [35, 'Württemberg', 6]];
// Oberliga Baden-Württemberg steht bei fussball.de unter Württemberg, gilt aber für alle drei BW-Verbände
const OBW = { id: 35, name: 'Oberliga BW', start: 5, klassen: {}, staffeln: [] };
const UA = 'Mozilla/5.0 (compatible; AmateurManagerDataBot/1.0; +https://amateur-manager.de)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let calls = 0;

async function get(url, json) {
  for (let t = 0; t < 4; t++) {
    try {
      calls++;
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'de-DE' } });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const tx = await r.text();
      await sleep(180);
      return json ? JSON.parse(tx) : tx;
    } catch (e) {
      console.warn('  retry', t + 1, url, e.message);
      await sleep(1500 * (t + 1));
    }
  }
  console.error('FEHLER', url);
  return null;
}
const strip = (k) => String(k).replace(/^_/, '');
const clean = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

function parseTable(html) {
  const out = [];
  const body = (html.split('<tbody>')[1] || '').split('</tbody>')[0];
  const rows = body.split(/<tr\b/).slice(1);
  for (const r of rows) {
    const cls = (/^[^>]*class="([^"]*)"/.exec(r) || [, ''])[1];
    const rank = parseInt((/column-rank">\s*(\d+)/.exec(r) || [, '0'])[1], 10) || 0;
    const team = (/team-id\/([0-9A-Z]+)/.exec(r) || [, ''])[1];
    const club = (/getLogo\/format\/\d+\/id\/([0-9A-Z]+)/.exec(r) || [, ''])[1];
    const name = clean((/class="club-name">([\s\S]*?)<\/div>/.exec(r) || [, ''])[1]);
    if (!name) continue;
    const zone = /row-promotion-playoff/.test(cls) ? 'up2' : /row-promotion/.test(cls) ? 'up' : /row-relegation-playoff/.test(cls) ? 'down2' : /row-relegation/.test(cls) ? 'down' : '';
    out.push({ id: team, club, n: name, r: rank, z: zone });
  }
  return out;
}

const result = { season: SAISON, fetched: new Date().toISOString(), source: 'fussball.de', verbaende: [] };
for (const [m, vname, start] of VERB) {
  console.log('== Verband', vname);
  const kinds = await get(`https://www.fussball.de/wam_kinds_${m}_${SAISON}_1.json`, true);
  if (!kinds) { console.error('keine Daten für', vname); continue; }
  const HERREN = strip((Object.entries(kinds.Mannschaftsart || {}).find(([, v]) => v === 'Herren') || ['_95'])[0]);
  const sks = kinds.Spielklasse?.[HERREN] || {};
  const geb = kinds.Gebiet?.[HERREN] || {};
  const V = { id: m, name: vname, start, klassen: {}, staffeln: [] };
  for (const [skk, skName] of Object.entries(sks)) {
    const sk = strip(skk); if (/Reserve|Freizeit|Senioren|Ü\d/i.test(skName)) continue; const isObw = m === 35 && /^Oberliga/.test(skName); if (!isObw) V.klassen[sk] = skName;
    for (const [gk, gName] of Object.entries(geb[sk] || {})) {
      const g = strip(gk);
      const comp = await get(`https://www.fussball.de/wam_competitions_${m}_${SAISON}_1_${HERREN}_${sk}_${g}.json`, true);
      const list = comp?.[sk]?.[g] || {};
      for (const [uk, sName] of Object.entries(list)) {
        const url = strip(uk); const id = (/\/staffel\/([0-9A-Z-]+)/.exec(url) || [, ''])[1];
        if (!id) continue;
        const html = await get(`https://www.fussball.de/ajax.actual.table/-/staffel/${id}`, false);
        const teams = html ? parseTable(html) : [];
        (isObw ? OBW : V).staffeln.push({ id, n: sName, sk, skn: skName, g, gn: gName, teams, ...(isObw ? { ebene: 5 } : {}) });
        console.log(`  ${skName} · ${gName} · ${sName}: ${teams.length} Teams`);
      }
    }
  }
  result.verbaende.push(V);
}
if (OBW.staffeln.length) result.verbaende.push(OBW);
// Überregional für Rheinland-Pfalz: Oberliga Rheinland-Pfalz/Saar (Ebene 5) und Regionalliga Südwest (Ebene 4)
{
  const V = { id: 29, name: 'RV Südwest', start: 4, klassen: {}, staffeln: [] };
  const add = async (id, n, skn, ebene) => { const html = await get(`https://www.fussball.de/ajax.actual.table/-/staffel/${id}`, false); const teams = html ? parseTable(html) : []; V.staffeln.push({ id, n, sk: skn, skn, g: 'RV', gn: 'Südwest', ebene, teams }); console.log(`  ${n}: ${teams.length} Teams`); };
  // Staffel-IDs der Saison 2026/27 (bei neuer Saison anpassen)
  await add('031D0NRQ3O000004VS5489BUVUR5FS5A-G', 'Regionalliga Südwest', 'Regionalliga', 4);
  await add('031DMS4JCO000009VS5489BUVUR5FS5A-G', 'Oberliga Rheinland-Pfalz/Saar', 'Oberliga', 5);
  result.verbaende.push(V);
}
mkdirSync('data', { recursive: true });
writeFileSync(`data/ligen-${SAISON}.json`, JSON.stringify(result));
const st = result.verbaende.reduce((a, v) => a + v.staffeln.length, 0), tm = result.verbaende.reduce((a, v) => a + v.staffeln.reduce((b, s) => b + s.teams.length, 0), 0);
console.log(`Fertig: ${st} Staffeln, ${tm} Teams, ${calls} Abrufe`);
