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

## Bauen

```
node tools/build-engine.mjs   # Engine für die Server-Funktion (wird beim Deploy automatisch gebaut)
node tools/build-ui.mjs       # index.html, engine.js und Rechtstexte für GitHub Pages
```

`index.html`, `engine.js` und die Rechtstexte im Hauptordner sind erzeugte Dateien – geändert wird in `src/`.

## Branches

- `main` – das, was auf amateur-manager.de läuft
- `umbau` – Umbau von Google Apps Script auf Supabase (Stand v24 als Ausgangspunkt)

## Grundsätze

- Spielstände schreibt nur der Server; der Browser schickt Aktionen.
- Belohnungen, Joker, Sterne und Käufe werden nur serverseitig vergeben.
- Keine geheimen Schlüssel im Repository.
