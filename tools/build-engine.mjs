// Baut die Engine als ES-Modul für die Server-Funktion (und für Tests).
// Aufruf: node tools/build-engine.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const daten = readFileSync(root + 'src/engine/daten.js', 'utf8');
const engine = readFileSync(root + 'src/engine/engine.js', 'utf8');
const pkg = JSON.parse(readFileSync(root + 'package.json', 'utf8'));
const out = '// AUTOMATISCH ERZEUGT aus src/engine – nicht von Hand ändern (node tools/build-engine.mjs)\n'
  + daten + '\n' + engine + '\n'
  + 'export const ENGINE_VERSION = ' + JSON.stringify(pkg.engineVersion) + ';\n'
  + 'export { MGR, MGR_DATA };\n';
mkdirSync(root + 'supabase/functions/_shared', { recursive: true });
writeFileSync(root + 'supabase/functions/_shared/engine.js', out);
console.log('engine.js gebaut:', (out.length / 1024).toFixed(0), 'KB, Version', pkg.engineVersion);

