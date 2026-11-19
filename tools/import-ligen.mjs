// Schreibt data/nrw-*.json in die Tabellen ligen_staffeln / ligen_teams (über die Supabase-Management-API).
// Angezeigte Namen (Spalte name), die in der Admin-Seite geändert wurden, bleiben erhalten.
import { readFileSync, readdirSync } from 'node:fs';

const REF = process.env.SUPABASE_PROJECT_REF || 'wnzrakcsfwxsckrucfan';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DRY = process.argv.includes('--dry');
if (!TOKEN && !DRY) { console.error('SUPABASE_ACCESS_TOKEN fehlt'); process.exit(1); }

const q = (s) => s == null ? 'null' : "'" + String(s).replace(/'/g, "''") + "'";

export function cleanName(n, skn, gn, vb) {
  let s = String(n).replace(/\bHerren\b/gi, '').replace(/\b20\d\d\/20\d\d\b/g, '').replace(/\b\d\d\/\d\d\b/g, '')
    .replace(/^IGA 20\d\d\s+/i, '').replace(/\s+-\s+/g, ' – ').replace(/\s{2,}/g, ' ').replace(/[\s,–-]+$/, '').trim();
  const kreis = /^Kreis /.test(gn || '') ? gn.replace(/^Kreis /, '') : '';
  if (kreis && s.toLowerCase().indexOf(kreis.toLowerCase().slice(0, 6)) < 0) {
    const m = s.match(/^(Kreisliga [A-D])(.*)$/);
    let rest = m ? m[2].replace(/^[\s,–-]+/, '').trim() : '';
    if (/^\d+$/.test(rest)) rest = 'Staffel ' + rest;
    s = m ? m[1] + ' ' + kreis + (rest ? ', ' + rest : '') : s + ' (' + kreis + ')';
  }
  const m2 = !kreis && vb && s.indexOf(vb) < 0 && s.match(/^(Landesliga|Bezirksliga)[\s,]*(.*)$/);
  if (m2) s = m2[1] + ' ' + vb + (m2[2] ? ', ' + m2[2].replace(/^Gruppe/, 'Gruppe').replace(/ 0(\d)$/, ' $1') : '');
  return s.replace(/\s+,/g, ',').trim();
}

async function sql(query) {
  if (DRY) return [];
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(r.status + ' ' + t.slice(0, 400));
  return t;
}

const files = readdirSync('data').filter((f) => /^nrw-\d+\.json$/.test(f)).sort();
for (const f of files) {
  const d = JSON.parse(readFileSync('data/' + f, 'utf8'));
  const st = [], tm = [];
  for (const v of d.verbaende) {
    const order = [];
    for (const s of v.staffeln) if (!order.includes(s.skn)) order.push(s.skn);
    for (const s of v.staffeln) {
      st.push(`(${q(s.id)},${q(d.season)},${q(v.name)},${5 + order.indexOf(s.skn)},${q(s.skn)},${q(cleanName(s.n, s.skn, s.gn, v.name))},${q(s.n)},${q(s.gn)})`);
      for (const t of s.teams) tm.push(`(${q(t.id)},${q(s.id)},${q(t.club)},${q(t.n)},${q(t.n)},${t.r | 0},${q(t.z || '')})`);
    }
  }
  console.log(f, st.length, 'Staffeln,', tm.length, 'Mannschaften');
  for (let i = 0; i < st.length; i += 200) {
    await sql(`insert into public.ligen_staffeln (id,saison,verband,ebene,klasse,name,name_fd,gebiet) values ${st.slice(i, i + 200).join(',')}
      on conflict (id) do update set saison=excluded.saison, verband=excluded.verband, ebene=excluded.ebene, klasse=excluded.klasse,
      name = case when ligen_staffeln.name = ligen_staffeln.name_fd or ligen_staffeln.name = excluded.name then excluded.name else ligen_staffeln.name end,
      name_fd=excluded.name_fd, gebiet=excluded.gebiet, updated_at=now();`);
  }
  for (let i = 0; i < tm.length; i += 500) {
    await sql(`insert into public.ligen_teams (id,staffel_id,verein_id,name,name_fd,rang,zone) values ${tm.slice(i, i + 500).join(',')}
      on conflict (id) do update set staffel_id=excluded.staffel_id, verein_id=excluded.verein_id,
      name = case when ligen_teams.name = ligen_teams.name_fd then excluded.name else ligen_teams.name end,
      name_fd=excluded.name_fd, rang=excluded.rang, zone=excluded.zone, updated_at=now();`);
  }
  if (DRY) { const sample = d.verbaende.flatMap((v) => v.staffeln.slice(0, 40).map((s) => cleanName(s.n, s.skn, s.gn, v.name))); console.log([...new Set(sample)].join(' | ')); }
}
console.log('fertig');
