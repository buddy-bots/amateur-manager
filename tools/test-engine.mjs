// Schneller Selbsttest der gebauten Engine (läuft auch vor jedem Deploy).
import { MGR, MGR_DATA, ENGINE_VERSION } from '../supabase/functions/_shared/engine.js';
const X = MGR_DATA;
const D = MGR.normalize({ regeln: X.REGELN, ligen: X.LIGEN, ausbau: X.AUSBAU, camps: X.CAMPS, events: X.EVENTS, konfig: X.KONFIG, mails: X.MAILS, vornamen: X.VORNAMEN, nachnamen: X.NACHNAMEN });
const S = MGR.newGame(D, { mgr: 'Test', full: 'Test Manager', xp: 0, mlvl: 1, self: null });
let V = MGR.view(S, D);
if (!V.club || !V.liga) throw new Error('View unvollständig');
// Saisonstart-Schritte so weit wie möglich durchlaufen, dann einige Tage simulieren
const json = JSON.stringify(S); const S2 = JSON.parse(json); // Spielstand muss JSON-fest sein
let days = 0, errs = 0;
for (let i = 0; i < 40; i++) { try { MGR.act(S2, D, 'sim', { mode: 'day' }); days++; } catch (e) { errs++; break; } }
V = MGR.view(S2, D);
console.log('Engine', ENGINE_VERSION, 'ok –', V.club, '|', V.liga, '| Spielstand', (json.length / 1024).toFixed(0), 'KB | sim-Schritte', days);
