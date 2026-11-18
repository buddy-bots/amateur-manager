# Amateur Manager

Fußballmanager für den Amateurfußball – jeder Verein aus NRW bis hinunter zur Kreisliga D.
Live unter <https://amateur-manager.de>.

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `src/engine/` | Spiel-Engine (`engine.js`) und Grunddaten (`daten.js`). Läuft auf dem Server. |
| `src/ui/` | Oberfläche (Styles in `head.html`, Logik in `p1.js` … `p5.js`). |
| `supabase/migrations/` | Datenbank-Schema mit Zugriffsregeln (Supabase, Region Frankfurt). |
| `supabase/functions/` | Server-Funktionen (Engine, Admin, Bezahlung). |

## Branches

- `main` – das, was auf amateur-manager.de läuft
- `umbau` – Umbau von Google Apps Script auf Supabase (Stand v24 als Ausgangspunkt)

## Grundsätze

- Spielstände schreibt nur der Server; der Browser schickt Aktionen.
- Belohnungen, Joker, Sterne und Käufe werden nur serverseitig vergeben.
- Keine geheimen Schlüssel im Repository.
