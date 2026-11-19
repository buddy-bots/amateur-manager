// Baut die Spielseite: index.html (Oberfläche) und engine.js (Spielregeln zur Anzeige).
// Aufruf: node tools/build-ui.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const r = (p) => readFileSync(root + p, 'utf8');
const pkg = JSON.parse(r('package.json'));
const ver = pkg.engineVersion;
const head = r('src/ui/head.html').replaceAll('__ENGINE_VERSION__', ver);
const parts = ['p0', 'p1', 'p2', 'p3', 'p5', 'p4'].map((p) => r('src/ui/' + p + '.js'));
const html = head + '\n' + parts.join('\n');
if (html.includes('\x3c?')) throw new Error('Apps-Script-Platzhalter gefunden');
if (html.includes('google.script.run')) throw new Error('google.script.run gefunden');
writeFileSync(root + 'index.html', html);
writeFileSync(root + 'engine.js', '// AUTOMATISCH ERZEUGT – Spielregeln zur Anzeige im Browser (verbindlich rechnet der Server)\n' + r('src/engine/daten.js') + '\n' + r('src/engine/engine.js'));
const layout = r('src/legal/_layout.html');
for (const [k, t] of [['impressum', 'Impressum'], ['datenschutz', 'Datenschutz'], ['agb', 'AGB']]) writeFileSync(root + k + '.html', layout.replace('__TITLE__', t).replace('__BODY__', r('src/legal/' + k + '.body.html')));
console.log('index.html', (html.length / 1024).toFixed(0), 'KB · engine.js gebaut · Version', ver);
