// Erzeugt data/orte-de.json: Ortsname → [[Breite, Länge, Bundesland], …] (gemittelt je Ort und Land).
// Quelle: GeoNames-Postleitzahlen (download.geonames.org/export/zip/DE.zip, CC BY 4.0)
import { readFileSync, writeFileSync } from 'node:fs';
const rows = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'));
const acc = {};
for (const c of rows) {
  const LDE = { Bavaria: 'Bayern', Thuringia: 'Thüringen', 'Saxony-Anhalt': 'Sachsen-Anhalt', Saxony: 'Sachsen', 'Mecklenburg-Western Pomerania': 'Mecklenburg-Vorpommern', 'Lower Saxony': 'Niedersachsen', 'Land Berlin': 'Berlin' };
  const lat = +c[9], lon = +c[10], land = LDE[c[3]] || c[3]; if (!lat || !lon) continue;
  for (const n of new Set([c[2], c[7]].filter(Boolean))) {
    const k = String(n).replace(/\s*\(.*?\)/g, '').trim(), kk = k + '|' + land;
    const a = (acc[kk] = acc[kk] || [k, land, 0, 0, 0]); a[2] += lat; a[3] += lon; a[4]++;
  }
}
const out = {};
for (const a of Object.values(acc)) (out[a[0]] = out[a[0]] || []).push([+(a[2] / a[4]).toFixed(3), +(a[3] / a[4]).toFixed(3), a[1]]);
writeFileSync('data/orte-de.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'Orte');
