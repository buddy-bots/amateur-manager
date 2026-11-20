// Erzeugt src/ui/pmap.js: Bundesländer als SVG-Pfade (Quelle: isellsoap/deutschlandGeoJSON, data/de-laender.geo.json)
import { readFileSync, writeFileSync } from 'node:fs';
const g = JSON.parse(readFileSync(new URL('../data/de-laender.geo.json', import.meta.url)));
const W = 460, lat0 = 51.2, kx = Math.cos(lat0 * Math.PI / 180);
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
const polys = (f) => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
for (const f of g.features) for (const p of polys(f)) for (const r of p) for (const [lo, la] of r) { const x = lo * kx, y = -la; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
const s = W / (maxX - minX), H = Math.round((maxY - minY) * s);
const P = ([lo, la]) => [(lo * kx - minX) * s, (-la - minY) * s];
function simplify(pts, eps) { if (pts.length < 4) return pts; const d = (p, a, b) => { const [x, y] = p, [x1, y1] = a, [x2, y2] = b, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy; if (!L) return Math.hypot(x - x1, y - y1); let t = ((x - x1) * dx + (y - y1) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - x1 - t * dx, y - y1 - t * dy); }; let mx = 0, idx = 0; for (let i = 1; i < pts.length - 1; i++) { const v = d(pts[i], pts[0], pts[pts.length - 1]); if (v > mx) { mx = v; idx = i; } } if (mx > eps) { const a = simplify(pts.slice(0, idx + 1), eps), b = simplify(pts.slice(idx), eps); return a.slice(0, -1).concat(b); } return [pts[0], pts[pts.length - 1]]; }
const out = [];
for (const f of g.features) {
  let dStr = '', ax = 0, ay = 0, aw = 0;
  for (const p of polys(f)) {
    const ring = p[0].map(P), sp = simplify(ring, 0.9);
    if (sp.length < 3) continue;
    // Fläche für Schwerpunkt
    let A = 0, cx = 0, cy = 0; for (let i = 0; i < ring.length - 1; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[i + 1], c = x1 * y2 - x2 * y1; A += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c; }
    A /= 2; if (Math.abs(A) > 2) { ax += cx / (6 * A) * Math.abs(A); ay += cy / (6 * A) * Math.abs(A); aw += Math.abs(A); }
    dStr += 'M' + sp.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join('L') + 'Z';
  }
  out.push([f.properties.name, dStr, Math.round(ax / aw), Math.round(ay / aw)]);
}
// ---- Fußballkreise: Landkreise werden dem Fußballkreis zugeordnet, dessen Vereine (Kreisligen) überwiegend darin liegen
const { MGR } = await import('../supabase/functions/_shared/engine.js');
const LIG = JSON.parse(readFileSync(new URL('../data/ligen-2627.json', import.meta.url)));
const ORTE = JSON.parse(readFileSync(new URL('../data/orte-de.json', import.meta.url)));
const KR = JSON.parse(readFileSync(new URL('../data/de-kreise.geo.json', import.meta.url)));
const LANDV = { 'Nordrhein-Westfalen': ['Mittelrhein', 'Niederrhein', 'Westfalen'], 'Rheinland-Pfalz': ['Rheinland', 'Südwest'], 'Baden-Württemberg': ['Baden', 'Südbaden', 'Württemberg'], Bayern: ['Bayern'], Hessen: ['Hessen'], 'Thüringen': ['Thüringen'] };
for (const v of LIG.verbaende) for (const st of v.staffeln) st.gn = MGR.gebietNorm(v.name, st.gn);
const part = MGR.geoIndex(ORTE);
const inPoly = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const kreise = {};
for (const land of Object.keys(LANDV)) {
  const pts = [];
  for (const v of LIG.verbaende) { if (!LANDV[land].includes(v.name)) continue; for (const st of v.staffeln) { if (!/^Kreis /.test(st.gn || '')) continue; const kn = st.gn.replace(/^Kreis\s+/, ''); for (const t of st.teams) { const g = MGR.geoFind(ORTE, part, String(t.n).replace(/&#8203;/g, ''), v.name, ''); if (g) pts.push({ k: kn, vb: v.name, lon: g[1], lat: g[0] }); } } }
  const groups = {};
  const feats = KR.features.filter((f) => f.properties.NAME_1 === land);
  for (const f of feats) {
    const cnt = {}; const rings = polys(f).map((p) => p[0]);
    for (const q of pts) if (rings.some((r) => inPoly(q.lon, q.lat, r))) cnt[q.k] = (cnt[q.k] || 0) + 1;
    let best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    if (!best) { // kein Verein drin: nächstgelegener Punkt
      let [cx, cy] = rings[0].reduce((a, [x, y]) => [a[0] + x / rings[0].length, a[1] + y / rings[0].length], [0, 0]), bd = 1e9;
      for (const q of pts) { const dd = (q.lon - cx) ** 2 + (q.lat - cy) ** 2; if (dd < bd) { bd = dd; best = q.k; } }
    }
    (groups[best] = groups[best] || []).push(f);
  }
  kreise[land] = Object.keys(groups).map((k) => {
    let d = ''; for (const f of groups[k]) for (const p of polys(f)) { const sp = simplify(p[0].map(P), 0.35); if (sp.length >= 3) d += 'M' + sp.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join('L') + 'Z'; }
    const my = pts.filter((q) => q.k === k); let A = 0, cx = 0, cy = 0;
    for (const f of groups[k]) for (const p of polys(f)) { const ring = p[0].map(P); for (let i = 0; i < ring.length - 1; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[i + 1], c = x1 * y2 - x2 * y1; A += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c; } }
    return [k, (my[0] || {}).vb || '', d, Math.round(cx / (3 * A)), Math.round(cy / (3 * A))];
  });
  console.log(land, kreise[land].length, 'Fußballkreise', kreise[land].map((k) => k[0]).join(', '));
}
writeFileSync(new URL('../src/ui/pmap.js', import.meta.url), '/* Bundesländer- und Fußballkreis-Karte (erzeugt mit tools/make-map.mjs, Quellen: github.com/isellsoap/deutschlandGeoJSON, GeoNames) */\nvar DEMAP = ' + JSON.stringify({ w: W, h: H, p: [+minX.toFixed(4), +minY.toFixed(4), +s.toFixed(4), +kx.toFixed(5)], l: out, k: kreise }) + ';\n');
console.log('pmap.js', W, H, out.map((o) => o[0] + ':' + o[1].length).join(' '));
