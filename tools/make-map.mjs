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
writeFileSync(new URL('../src/ui/pmap.js', import.meta.url), '/* Bundesländer-Karte (erzeugt mit tools/make-map.mjs, Quelle: github.com/isellsoap/deutschlandGeoJSON) */\nvar DEMAP = ' + JSON.stringify({ w: W, h: H, p: [+minX.toFixed(4), +minY.toFixed(4), +s.toFixed(4), +kx.toFixed(5)], l: out }) + ';\n');
console.log('pmap.js', W, H, out.map((o) => o[0] + ':' + o[1].length).join(' '));
