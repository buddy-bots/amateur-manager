// Erzeugt data/orte-de.json: Ortsname → [Breite, Länge] (gemittelt über alle PLZ eines Orts).
// Quelle: github.com/zauberware/postal-codes-json-xml-csv (data/DE/zipcodes.de.json)
import { readFileSync, writeFileSync } from 'node:fs';
const src = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const acc = {};
for (const r of src) {
  const lat = +r.latitude, lon = +r.longitude; if (!lat || !lon) continue;
  for (const n of new Set([r.place, r.community].filter(Boolean))) {
    const k = String(n).replace(/\s*\(.*?\)/g, '').trim();
    const a = (acc[k] = acc[k] || [0, 0, 0, r.state]); a[0] += lat; a[1] += lon; a[2]++;
  }
}
const out = {};
for (const k of Object.keys(acc)) { const a = acc[k]; out[k] = [+(a[0] / a[2]).toFixed(3), +(a[1] / a[2]).toFixed(3)]; }
writeFileSync('data/orte-de.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'Orte');
