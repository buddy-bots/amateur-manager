// Einmalig: welche fussball.de-Mandanten gibt es, welche Herren-Spielklassen haben sie?
import { writeFileSync } from 'node:fs';
const UA = 'Mozilla/5.0 (compatible; AmateurManagerDataBot/1.0; +https://amateur-manager.de)';
const out = {};
for (let m = 1; m <= 130; m++) {
  try {
    const r = await fetch(`https://www.fussball.de/wam_kinds_${m}_2627_1.json`, { headers: { 'User-Agent': UA } });
    if (!r.ok) { if (m > 40) out[m] = { status: r.status }; continue; }
    const k = await r.json();
    const h = Object.entries(k.Mannschaftsart || {}).find(([, v]) => v === 'Herren');
    if (!h) { out[m] = { arten: Object.values(k.Mannschaftsart || {}) }; continue; }
    const id = h[0].replace(/^_/, '');
    out[m] = { herren: id, klassen: k.Spielklasse?.[id] || {}, gebiete: Object.values(k.Gebiet?.[id] || {}).map((g) => Object.values(g)).flat().slice(0, 30) };
  } catch (e) { out[m] = { err: e.message }; }
  await new Promise((r) => setTimeout(r, 200));
}
// Regionalligen (Mandant 29): Staffel-Liste
try { const k = await (await fetch('https://www.fussball.de/wam_kinds_29_2627_1.json', { headers: { 'User-Agent': UA } })).json(); out.rl = { kinds: k.Gebiet };
  for (const g of Object.keys((k.Gebiet || {})['1']?.['_4'] || {})) { const c = await (await fetch(`https://www.fussball.de/wam_competitions_29_2627_1_1_4_${g.replace(/^_/, '')}.json`, { headers: { 'User-Agent': UA } })).json(); out.rl[g] = c; } } catch (e) { out.rl = { err: e.message }; }
writeFileSync('data/mandanten.json', JSON.stringify(out, null, 1));
console.log(Object.keys(out).join(','));
