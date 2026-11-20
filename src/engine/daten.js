/**
 * SVW Manager – Standarddaten
 * Diese Daten werden beim ersten Start (Funktion setupManager) in die Sheet-Tabs geschrieben.
 * Danach gilt immer das, was im Sheet steht – dort kannst du alles anpassen.
 */
var MGR_DATA = (function () {

  // ---------------------------------------------------------------- Ligaregeln
  // Ebene | Liga | Kurz | Teams | Aufsteiger | Aufstiegs-Relegation | Absteiger | Abstiegs-Relegation |
  // Stärke min | Stärke max | Spieltag | Saisonbudget | Zuschauer Ø | Ticketpreis | Werbedeal Basis/Monat |
  // TV-Geld/Monat | Verwaltung/Monat | Lizenz: Kapazität | Lizenz: Flutlicht-Stufe | Lizenz: Rasen | fussball.de-Link
  var FD = 'https://www.fussball.de/spieltagsuebersicht/';
  const REGELN = [
    [1, '1. Bundesliga', 'Bundesliga', 18, 0, 0, 2, 1, 70, 89, 'Sa', 40000000, 42000, 35, 1000000, 3500000, 2500000, 15000, 3, 'Rasenheizung', ''],
    [2, '2. Bundesliga', '2. Bundesliga', 18, 2, 1, 2, 1, 60, 75, 'Sa', 12000000, 26000, 25, 250000, 1300000, 600000, 15000, 3, 'Rasenheizung', ''],
    [3, '3. Liga', '3. Liga', 20, 2, 1, 4, 0, 50, 65, 'Sa', 4000000, 8500, 18, 60000, 120000, 150000, 10000, 3, 'Naturrasen', ''],
    [4, 'Regionalliga West', 'Regionalliga', 18, 1, 0, 3, 0, 40, 55, 'Sa', 700000, 1800, 12, 8000, 5000, 15000, 2500, 2, '', FD + 'regionalliga-west-deutschland-regionalliga-west-herren-saison2627-deutschland/-/staffel/031253DN8G000005VS5489BTVT51B5B5-G'],
    [5, 'Mittelrheinliga', 'Mittelrheinliga', 16, 1, 0, 3, 0, 30, 45, 'So', 120000, 350, 8, 1500, 0, 1200, 1000, 2, '', FD + 'mittelrheinliga-mittelrhein-verbandsliga-herren-saison2627-mittelrhein/-/staffel/031CNVCRES00000FVS5489BUVUR5FS5A-G'],
    [6, 'Landesliga Mittelrhein, Staffel 1', 'Landesliga', 16, 1, 0, 3, 0, 25, 40, 'So', 55000, 200, 6, 600, 0, 600, 0, 0, '', FD + 'landesliga-staffel-1-mittelrhein-landesliga-herren-saison2627-mittelrhein/-/staffel/031CO3JQMO00000HVS5489BUVUR5FS5A-G'],
    [7, 'Bezirksliga Mittelrhein, Staffel 2', 'Bezirksliga', 16, 2, 0, 3, 0, 20, 35, 'So', 30000, 130, 5, 300, 0, 350, 0, 0, '', FD + 'bezirksliga-staffel-2-bezirk-mittelrhein-bezirksliga-herren-saison2627-mittelrhein/-/staffel/031CO3N6LC00000IVS5489BUVUR5FS5A-G'],
    [8, 'Kreisliga A Bonn', 'Kreisliga A', 16, 1, 0, 3, 0, 15, 30, 'So', 15000, 80, 4, 200, 0, 200, 0, 0, '', FD + 'kreisliga-a-kreis-bonn-kreisliga-a-herren-saison2627-mittelrhein/-/staffel/031BONFSMC000004VS5489BTVUS470OH-G'],
    [9, 'Kreisliga B Bonn, Gruppe 2', 'Kreisliga B', 16, 1, 0, 2, 0, 10, 25, 'So', 8000, 50, 3, 120, 0, 120, 0, 0, '', FD + 'kreisliga-b-gruppe-2-kreis-bonn-kreisliga-b-herren-saison2627-mittelrhein/-/staffel/031BOPGR0S000004VS5489BTVUS470OH-G'],
    [10, 'Kreisliga C Bonn, Gruppe 3', 'Kreisliga C', 15, 1, 0, 3, 0, 5, 20, 'So', 4000, 35, 2, 80, 0, 80, 0, 0, '', FD + 'kreisliga-c-gruppe-3-kreis-bonn-kreisliga-c-herren-saison2627-mittelrhein/-/staffel/031BOT1Q68000003VS5489BTVUS470OH-G'],
    [11, 'Kreisliga D Bonn, Gruppe 1', 'Kreisliga D', 11, 2, 0, 0, 0, 1, 15, 'So', 2000, 25, 0, 50, 0, 50, 0, 0, '', FD + 'kreisliga-d-gruppe-1-kreis-bonn-kreisliga-d-herren-saison2627-mittelrhein/-/staffel/031BP3KE28000003VS5489BTVUS470OH-G'],
    // Ebene 12 gibt es nur in Westfalen (dort liegt die Westfalenliga zwischen Oberliga und Landesliga)
    [12, 'Kreisliga D', 'Kreisliga D', 12, 2, 0, 0, 0, 1, 12, 'So', 1500, 20, 0, 40, 0, 40, 0, 0, '', '']
  ];

  // ---------------------------------------------------------------- Ligen 2026/27 (echte Teams, Stand November 2026)
  // [Ebene, Verein, Bewertung/Stärke, Typ ('Liga' oder 'Pool' = andere Staffel/Region), Wappen-URL (optional)]
  // Die Bewertung der Amateurligen richtet sich nach der echten Tabelle zum Stand des Imports.
  const L = [];
  function add(lvl, typ, list) { list.forEach(function (x) { if (typeof x === 'string') L.push([lvl, x, '', typ, '']); else L.push([lvl, x[0], x[1], typ, '']); }); }
  function addTabelle(lvl, list) {
    var R = REGELN[lvl - 1], lo = R[8], hi = R[9], n = list.length;
    list.forEach(function (name, i) { var b = hi - (hi - lo) * 0.05 - (hi - lo) * 0.85 * (n > 1 ? i / (n - 1) : 0.5); L.push([lvl, name, Math.round(b * 10) / 10, 'Liga', '']); });
  }

  add(1, 'Liga', [['FC Bayern München', 88], ['Bayer 04 Leverkusen', 84], ['Borussia Dortmund', 83], ['RB Leipzig', 82], ['VfB Stuttgart', 81], ['Eintracht Frankfurt', 80], ['SC Freiburg', 78], ['TSG Hoffenheim', 77], ['Borussia Mönchengladbach', 76], ['SV Werder Bremen', 76], ['1. FSV Mainz 05', 75], ['1. FC Köln', 74], ['1. FC Union Berlin', 74], ['FC Augsburg', 74], ['Hamburger SV', 73], ['FC Schalke 04', 73], ['SC Paderborn 07', 71], ['SV Elversberg', 71]]);
  add(2, 'Liga', [['VfL Wolfsburg', 74], ['1. FC Heidenheim', 70], ['FC St. Pauli', 70], ['Hertha BSC', 70], ['Hannover 96', 70], ['1. FC Kaiserslautern', 68], ['SV Darmstadt 98', 68], ['VfL Bochum', 68], ['1. FC Nürnberg', 67], ['Karlsruher SC', 67], ['1. FC Magdeburg', 66], ['Holstein Kiel', 66], ['Arminia Bielefeld', 66], ['Dynamo Dresden', 65], ['SpVgg Greuther Fürth', 64], ['Eintracht Braunschweig', 64], ['VfL Osnabrück', 63], ['Energie Cottbus', 63]]);
  add(3, 'Liga', [['Fortuna Düsseldorf', 63], ['Hansa Rostock', 61], ['Preußen Münster', 61], ['Rot-Weiss Essen', 61], ['MSV Duisburg', 60], ['Alemannia Aachen', 59], ['1. FC Saarbrücken', 59], ['Jahn Regensburg', 58], ['SV Wehen Wiesbaden', 58], ['Waldhof Mannheim', 57], ['FC Ingolstadt 04', 57], ['SC Verl', 57], ['Viktoria Köln', 57], ['Fortuna Köln', 56], ['SV Meppen', 55], ['Würzburger Kickers', 55], ['VfB Stuttgart II', 54], ['TSG Hoffenheim II', 54], ['SG Sonnenhof Großaspach', 54], ['TSV Havelse', 52]]);
  add(4, 'Liga', [['Rot-Weiß Oberhausen', 51], ['Borussia Dortmund II', 50], ['FC Gütersloh', 49], ['1. FC Bocholt', 49], ['SV Rödinghausen', 49], ['Sportfreunde Siegen', 48], ['Bonner SC', 48], ['SG Wattenscheid 09', 47], ['FC Schalke 04 II', 47], ['Borussia Mönchengladbach II', 47], ['1. FC Köln II', 47], ['Sportfreunde Lotte', 47], ['SC Wiedenbrück', 46], ['SV Bergisch Gladbach', 46], ['SC Paderborn 07 II', 45], ['VfL Bochum II', 45], ['VfB 03 Hilden', 45], ['SV Westfalia Rhynern', 45]]);
  addTabelle(5, ['FC Wegberg-Beeck', 'SSV Merten', 'SV Eintracht Hohkeppel', 'SpVg Frechen 20', 'SC Fortuna Köln II', '1. FC Düren', 'SC Borussia Lindenthal-Hohenlind', 'VfL 08 Vichttal', 'SSV Bornheim', 'Siegburger SV', 'FC Hürth', 'TuS Chlodwig Zülpich', 'FC Hennef 05', 'TuS BW Königsdorf', 'SpVg Porz', 'FSV Neunkirchen-Seelscheid']);
  addTabelle(6, ['FV Bonn-Endenich', 'FV Bad Honnef', 'SC Blau-Weiß 06 Köln', 'SV Grün-Weiß Brauweiler', 'TuS Mondorf', 'FC Blau-Weiß Friesdorf', 'SSV Homburg-Nümbrecht', 'SC Rheinbach', 'TuS Oberpleis', 'SV Deutz 05', 'FC Pesch', 'SV Schönenbach', '1. FC Spich', 'TuS Marialinden', 'FV Wiehl', 'SV Schlebusch']);
  addTabelle(7, ['TuRa Oberdrees', 'FC Rheinsüd Köln', 'SC Fortuna Bonn', '1. FC Niederkassel', 'Marokkanischer SV Bonn', 'TuS Buisdorf', 'FC Hertha Rheidt', 'VfR Hangelar', 'SC Uckerath', 'SV Rot-Weiß Merl', 'SV Leuscheid', 'SV Bergheim', 'Sportfreunde Troisdorf', 'SC Volmershoven-Heidgen', 'Rot-Gelb Wesseling']);
  addTabelle(8, ['SV Vorgebirge', 'BSV Roleber', 'SV Hertha Buschhoven', 'FC Pech', 'Spfr. Ippendorf', 'SC Rheinbach II', 'SV Beuel 06', 'SV Ennert', 'SC Fortuna Bonn II', 'Oberkasseler FV', 'SV Wormersdorf', 'TuS Roisdorf', 'TB 1906 Witterschlick', 'SSV Bornheim II', 'SV Niederbachem', 'SSV Walberberg']);
  addTabelle(9, ['SV Boluspor Bonn', 'SV BW Oedekoven', 'SC Altendorf-Ersdorf', 'Bonner SC II', 'VfL Meckenheim', 'SV Niederbachem II', 'SSV Plittersdorf', 'NK Croatia Bonn', 'TV Rheindorf II', 'SC Volmershoven-Heidgen II', 'Godesberger FV', '1. FC Godesberg', 'SC Fortuna Bonn III', 'SV Rot-Weiß Röttgen', 'RW Dünstekoven']);
  addTabelle(10, ['SC Villip', 'SV Adendorf', 'TuRa Oberdrees II', 'SV Hertha Buschhoven II', 'FC RW Lessenich II', 'FC Flerzheim', 'ISC AlHilal Bonn', 'FC Pech II', 'TuS Odendorf', 'SC Altendorf-Ersdorf II', 'TB 1906 Witterschlick II', 'SV SW Merzbach', 'SC Rheinbach III', 'VfL Meckenheim II']);
  addTabelle(11, ['TB 1906 Witterschlick III', 'SC Altendorf-Ersdorf III', 'SV Niederbachem III', 'FC RW Lessenich III', 'SV Germania Impekoven II', 'TSG Bonn III', 'SV SW Merzbach III', 'SV Rot-Weiß Röttgen II', 'SV Rot-Weiß Queckenberg', 'SV Buschdorf III']);

  // Pools: andere Staffeln/Regionen derselben Ebene – daraus rücken Auf-/Absteiger nach
  add(3, 'Pool', [['1. FC Lok Leipzig', 55], ['FC Carl Zeiss Jena', 55], ['Kickers Offenbach', 54], ['SV Sandhausen', 55], ['Stuttgarter Kickers', 53], ['FC Erzgebirge Aue', 56], ['TSV 1860 München', 57], ['Chemnitzer FC', 53], ['FC Rot-Weiß Erfurt', 53], ['Hallescher FC', 54], ['KSV Hessen Kassel', 52], ['SSV Ulm 1846', 57], ['1. FC Schweinfurt 05', 54], ['SpVgg Unterhaching', 55], ['FC 08 Homburg', 53], ['Werder Bremen II', 51]]);
  add(4, 'Pool', [['Wuppertaler SV', 46], ['SSVg Velbert', 44], ['Fortuna Düsseldorf II', 44], ['Rot Weiss Ahlen', 44], ['SV Lippstadt 08', 44], ['ETB SW Essen', 42], ['KFC Uerdingen', 43], ['1. FC Kleve', 41], ['TuS Ennepetal', 41], ['SpVg Schonnebeck', 41], ['Westfalia Herne', 42], ['TSG Sprockhövel', 40]]);
  add(5, 'Pool', ['SV Germania Eicherscheid', 'FC Germania Teveren', 'FC Teutonia Weiden', 'FC Union Schafhausen']);
  add(6, 'Pool', ['SV Helpenstein', 'SV Eilendorf', 'FC Germania Lich-Steinstraß', 'SV Eintracht Verlautenheide', 'DJK Rasensport Brand', 'SG Türkischer SV Düren', 'SV Breinig', 'SC Fliesteden']);
  add(7, 'Pool', ['SpVg Rheindörfer Köln-Nord', 'VfL Sindorf', 'FC Dynamo Erkelenz', 'FC Concordia Oidtweiler', 'Kreuzauer SC 05', 'JSG Erft 01 Euskirchen', 'SV Rhenania Bessenich', 'SV Weiden']);
  add(8, 'Pool', ['SC Jülich/Hoengen', 'SC Kellersberg', 'SV Altenberg', 'SV Frauenberg', 'SV Refrath/Frankenforst', 'SV Viktoria RW Waldenrath/Straeten', 'TuS Mechernich']);
  add(9, 'Pool', ['FV Bonn-Endenich II', 'SV Beuel 06 II', 'Spfr. Ippendorf II', 'TV Rheindorf', 'FV Preußen Bonn', 'VTA Bonn', 'VfL Alfter', 'FC RW Lessenich', 'Lions Sports-Club Bonn', 'SV Boluspor Bonn II', 'FV Salia Sechtem']);
  add(10, 'Pool', ['ASG Uni Bonn II', 'FC Blau-Weiß Friesdorf II', 'Club Galicia Bonn', 'FC Hertha Bonn', 'Oberkasseler FV II', 'SV Germania Impekoven', 'TSG Bonn', 'SV Ennert II', 'Polonia Bonn', 'SV Beuel 06 III', 'VfL Lengsdorf']);
  add(11, 'Pool', ['SSV Walberberg III', 'VfL Alfter II', 'ASG Uni Bonn III', 'SV SW Merzbach II', 'SC Widdig II', 'SV Buschdorf', 'VTA Bonn II', 'Godesberger FV III', 'ISC AlHilal Bonn III', 'SC Villip III', 'TV Rheindorf III', 'TuS Germania Hersel III', 'Bonner SG', 'Cosmos Bonn']);

  // ---------------------------------------------------------------- Ausbau & Kaufbares
  // ID | Kategorie | Name | Beschreibung | Kosten | Monatskosten (Personal & Mannschaften: Bezirksliga-Wert, wächst mit der Liga) | Bauzeit (Tage) | Voraussetzung | Effekte
  const AUSBAU = [
    ['steh500', 'Stadion', 'Stehplatzwall', '+500 Plätze hinter dem Tor', 25000, 50, 30, '', 'kap:+500'],
    ['stehtrib', 'Stadion', 'Stehtribüne', '+1.500 Plätze, überdachte Stehplätze', 90000, 150, 60, 'steh500', 'kap:+1500; fans:+2'],
    ['sitztrib', 'Stadion', 'Sitzplatztribüne', '+2.000 Sitzplätze, höhere Ticketeinnahmen', 350000, 400, 120, 'stehtrib', 'kap:+2000; ticket:+15'],
    ['ueberdach', 'Stadion', 'Komplette Überdachung', 'Mehr Komfort, Fans zufriedener', 150000, 100, 60, 'sitztrib', 'fans:+5; zus:+5'],
    ['ausbau5k', 'Stadion', 'Stadionausbau Stufe 1', '+10.000 Plätze (ab 10.000 Plätzen, einmalig)', 2500000, 3000, 180, '', 'kap:+10000'],
    ['ausbau10k', 'Stadion', 'Stadionausbau Stufe 2', '+20.000 Plätze', 12000000, 12000, 270, 'ausbau5k', 'kap:+20000'],
    ['arena', 'Stadion', 'Neue Arena', 'Stadion mit 89.000 Plätzen, Arena-Atmosphäre', 60000000, 60000, 540, 'ausbau10k', 'fans:+5; ticket:+10'],
    ['vip', 'Stadion', 'VIP-Logen', 'Business-Bereich, mehr Einnahmen pro Heimspiel', 2000000, 5000, 150, 'sitztrib', 'ticket:+20; spons:+10'],
    ['videowand', 'Stadion', 'Videowand', 'Werbefläche und Stimmung', 40000, 100, 20, '', 'spons:+10; fans:+2'],
    ['flutlicht2', 'Stadion', 'Spielflutlicht', 'Pflicht ab Regionalliga (Flutlicht-Stufe 2)', 120000, 300, 45, '', 'flut:2'],
    ['flutlicht3', 'Stadion', 'TV-Flutlicht', 'Pflicht ab 3. Liga (Flutlicht-Stufe 3)', 1500000, 1500, 90, 'flutlicht2', 'flut:3'],
    ['parkplatz', 'Stadion', 'Parkplätze', 'Mehr Zuschauer kommen', 30000, 50, 30, '', 'zus:+5'],
    ['kasse', 'Stadion', 'Kassenhäuschen & Drehkreuze', 'Weniger Schwarzgucker', 15000, 20, 14, '', 'ticket:+8'],
    ['naturrasen', 'Platz', 'Naturrasen-Hauptplatz', 'Pflicht ab 3. Liga, Heimvorteil', 180000, 1500, 90, '', 'rasen:natur; heim:+0.5'],
    ['rasenheizung', 'Platz', 'Rasenheizung', 'Pflicht ab 2. Bundesliga', 900000, 3000, 60, 'naturrasen', 'heiz:1'],
    ['tplatz2', 'Training', 'Zweiter Trainingsplatz', 'Bessere Entwicklung der Spieler', 220000, 300, 90, '', 'dev:+10'],
    ['tzentrum', 'Training', 'Trainingszentrum', 'Profi-Bedingungen für die Entwicklung', 1500000, 2000, 180, 'tplatz2', 'dev:+15'],
    ['fitnessraum', 'Training', 'Fitnessraum', 'Weniger Verletzungen, schnellere Erholung', 25000, 200, 21, '', 'inj:-15; rec:+1'],
    ['fitnesscenter', 'Training', 'Fitnesscenter', 'Noch weniger Verletzungen', 350000, 800, 90, 'fitnessraum', 'inj:-15; rec:+1'],
    ['reha', 'Training', 'Physio- & Reha-Raum', 'Verletzte sind schneller zurück', 40000, 300, 30, '', 'heal:-25'],
    ['kabinen2', 'Training', 'Moderne Kabinen', 'Bessere Stimmung im Team', 60000, 100, 45, '', 'moral:+5; rec:+0.5'],
    ['kabinen3', 'Training', 'Profi-Kabinentrakt', 'Wie bei den Profis', 800000, 500, 120, 'kabinen2', 'moral:+5; rec:+0.5'],
    ['videoraum', 'Training', 'Videoanalyse-Raum', 'Taktische Vorteile im Spiel', 15000, 100, 14, '', 'taktik:+0.5'],
    ['vereinsheim2', 'Verein', 'Vereinsheim modernisieren', 'Mehr Umsatz mit Speisen & Getränken', 40000, 100, 45, '', 'food:+40'],
    ['gastro', 'Verein', 'Stadiongastronomie', 'Deutlich mehr Umsatz pro Zuschauer', 250000, 500, 90, 'vereinsheim2', 'food:+80'],
    ['fanshop1', 'Verein', 'Fanshop-Container', 'Merchandise & Trikots vor Ort', 15000, 50, 14, '', 'merch:2'],
    ['fanshop2', 'Verein', 'Fanshop', 'Richtiger Shop am Stadion', 120000, 300, 60, 'fanshop1', 'merch:4'],
    ['megastore', 'Verein', 'Megastore', 'Großer Fanshop mit Online-Versand', 2000000, 3000, 150, 'fanshop2', 'merch:8'],
    ['fanclubraum', 'Verein', 'Fanclub-Raum', 'Heimat für die Fans', 20000, 50, 21, '', 'fans:+5'],
    ['geschaeftsstelle', 'Verein', 'Geschäftsstelle', 'Mehr und bessere Werbedeals', 80000, 400, 45, '', 'sponsorchance:+30; spons:+5'],
    ['bus', 'Verein', 'Mannschaftsbus', 'Stärker in Auswärtsspielen', 120000, 300, 7, '', 'away:+0.7; moral:+2'],
    ['cotrainer', 'Personal', 'Co-Trainer', 'Spieler entwickeln sich schneller', 0, 150, 0, '', 'dev:+10'],
    ['twtrainer', 'Personal', 'Torwarttrainer', 'Torhüter entwickeln sich deutlich schneller', 0, 100, 0, '', 'twdev:+40'],
    ['athletik', 'Personal', 'Athletiktrainer', 'Fitness und weniger Verletzungen', 0, 150, 0, '', 'rec:+1; inj:-10'],
    ['physio', 'Personal', 'Physiotherapeut', 'Kürzere Verletzungspausen', 0, 200, 0, '', 'heal:-25'],
    ['scout', 'Personal', 'Scout', 'Zeigt das Talent genau und findet mehr Spieler', 0, 150, 0, 'scout:1'],
    ['psychologe', 'Personal', 'Sportpsychologe', 'Niederlagen schlagen weniger auf die Moral', 0, 200, 0, '', 'moralschutz:1; moral:+3'],
    ['ernaehrung', 'Personal', 'Ernährungsberater', 'Schnellere Erholung', 0, 100, 0, '', 'rec:+0.5'],
    ['socialmedia', 'Personal', 'Social-Media-Manager', 'Mehr Fans und Werbewert', 0, 250, 0, '', 'fans:+4; spons:+10'],
    ['jugendkoord', 'Personal', 'Jugendkoordinator', 'Bessere Talente aus der eigenen Jugend', 0, 120, 0, '', 'youthq:+3'],
    ['zweite', 'Mannschaften', 'Zweite Mannschaft', 'Bankspieler bekommen Spielpraxis', 10000, 300, 30, '', 'bench:+25'],
    ['u19', 'Mannschaften', 'U19 (A-Jugend)', '+1 Jugendspieler pro Saison', 15000, 350, 30, '', 'youth:+1; youthq:+3'],
    ['u17', 'Mannschaften', 'U17 (B-Jugend)', 'Mehr Nachwuchs', 8000, 200, 30, '', 'youth:+1; youthq:+1'],
    ['u15', 'Mannschaften', 'U15 (C-Jugend)', 'Talente früh entdecken', 5000, 150, 30, '', 'youth:+1'],
    ['internat', 'Mannschaften', 'Jugendinternat', 'Höhere Chance auf große Talente', 1200000, 3000, 180, 'u19', 'tal:+1; youthq:+4'],
    ['frauen', 'Mannschaften', 'Frauenteam ausbauen', 'Mehr Fans und Sponsoren', 12000, 250, 30, '', 'fans:+3; spons:+5'],
    ['ah', 'Mannschaften', 'Alte Herren', 'Mehr Mitglieder', 2000, 50, 14, '', 'fans:+2; members:+5']
  ];
  // Hinweis: der Scout hat absichtlich die Effekte in Spalte "Voraussetzung" vermieden – wird unten korrigiert
  AUSBAU.forEach(function (r) { if (r[0] === 'scout') { r[7] = ''; r[8] = 'scout:1'; } });

  // ---------------------------------------------------------------- Trainingslager
  // ID | Name | Ort | Tage | Kosten | Wirkung (1 = klein … 5 = riesig)
  const CAMPS = [
    ['hennef', 'Sportschule Hennef', 'Hennef (Sieg)', 3, 2500, 1.0],
    ['eifel', 'Sporthotel Eifel', 'Bad Münstereifel', 4, 4500, 1.3],
    ['sauerland', 'Sauerland-Camp', 'Winterberg', 5, 7500, 1.6],
    ['wedau', 'Sportschule Wedau', 'Duisburg', 5, 9000, 1.8],
    ['nordsee', 'Nordsee-Trainingslager', 'Cuxhaven', 6, 12000, 2.0],
    ['kitzbuehel', 'Höhentrainingslager', 'Kitzbühel (Österreich)', 7, 25000, 2.5],
    ['algarve', 'Algarve-Camp', 'Lagos (Portugal)', 7, 40000, 3.0],
    ['belek', 'Belek Sports Resort', 'Belek (Türkei)', 8, 55000, 3.3],
    ['marbella', 'Marbella Football Center', 'Marbella (Spanien)', 8, 90000, 3.6],
    ['dubai', 'Dubai Sports City', 'Dubai (VAE)', 10, 250000, 4.2],
    ['florida', 'IMG Academy', 'Florida (USA)', 10, 600000, 4.6]
  ];

  // ---------------------------------------------------------------- 100 Ereignisse
  // Gewicht (Wahrscheinlichkeit) | Ab Ebene (oben) | Bis Ebene (unten) | Monate (leer = immer) | Titel | Text |
  // Button Annehmen | Effekte Annehmen | Button Ablehnen | Effekte Ablehnen
  // Geldbeträge gelten für die Bezirksliga und werden automatisch an die Liga angepasst.
  const EV = [
    [10, 1, 11, '', 'Fanclub bittet um Zuschuss', 'Der Fanclub möchte neue Fahnen und Doppelhalter anschaffen und bittet um {betrag} Zuschuss.', 'Zuschuss geben', 'geld:-300; fans:+5', 'Ablehnen', 'fans:-3'],
    [8, 5, 11, '', 'Spende mit Bedingung', 'Ein langjähriges Mitglied spendet {betrag} – wenn sein Enkel im nächsten Testspiel ein paar Minuten bekommt.', 'Annehmen', 'geld:+1500; moral:-2', 'Ablehnen', 'vorstand:-1'],
    [8, 5, 11, '', 'Bäckerei will werben', 'Eine Bäckerei aus der Gemeinde bietet {betrag} pro Monat für Bandenwerbung (6 Monate).', 'Annehmen', 'sponsor:150/6', 'Ablehnen', ''],
    [6, 1, 11, '', 'Sturmschaden', 'Ein Sturm hat das Ballfangnetz zerstört. Die Reparatur kostet {betrag}.', 'Sofort reparieren', 'geld:-800', 'Später', 'fans:-2; zuschauer:-15/2'],
    [8, 1, 11, '', 'Interview im General-Anzeiger', 'Der General-Anzeiger will ein Interview. Kündigst du offensiv Großes an?', 'Ja, angreifen!', 'fans:+4; vorstand:-2; moral:+2', 'Lieber zurückhaltend', 'vorstand:+1'],
    [7, 1, 11, '', 'Hochzeit eines Spielers', '{spieler} heiratet und möchte eine Woche frei.', 'Freigeben', 'moral:+3; sp_fit:-20', 'Ablehnen', 'moral:-4; sp_form:-2'],
    [6, 6, 11, '', 'Kirmes im Ort', 'Am Wochenende ist Kirmes. Die Mannschaft will nach dem Spiel feiern gehen.', 'Erlauben', 'moral:+6; fitness:-8', 'Verbieten', 'moral:-4'],
    [5, 5, 11, '', 'Bratwurst-Rekord', 'Der Grillmeister will beim Heimspiel einen Bratwurst-Rekord aufstellen. Material: {betrag}.', 'Machen', 'chance:60; geld:-200; fans:+6; zuschauer:+20/1 || geld:-200; fans:+1', 'Nein', ''],
    [5, 1, 11, '', 'Fehldruck bei den Trikots', 'Beim Trikotdruck ist ein Fehler passiert: „SV Wachtbeg“. Neu drucken kostet {betrag}.', 'Neu drucken', 'geld:-600', 'So lassen', 'fans:-3; moral:-2'],
    [7, 1, 11, '', 'Bälle für die Jugend', 'Die Jugendabteilung braucht dringend neue Bälle für {betrag}.', 'Kaufen', 'geld:-250; fans:+2; vorstand:+1', 'Ablehnen', 'fans:-2'],
    [5, 1, 11, '', 'Talent klopft an', 'Ein 17-jähriges Talent aus der Nachbarschaft möchte bei euch mittrainieren und bleiben.', 'Aufnehmen', 'talent', 'Ablehnen', ''],
    [4, 5, 11, '', 'Gemeinde-Zuschuss', 'Die Gemeinde bietet {betrag} Zuschuss – wenn die Mannschaft ein Ferien-Fußballcamp für Kinder betreut.', 'Annehmen', 'geld:+3000; fitness:-3; fans:+3', 'Ablehnen', 'vorstand:-2'],
    [5, 5, 11, '', 'Schiedsrichter gesucht', 'Dem Kreis fehlen Schiedsrichter. Schickt ihr zwei Spieler zum Schiri-Lehrgang?', 'Ja', 'moral:-2; vorstand:+3', 'Nein (Strafe {betrag})', 'geld:-150'],
    [6, 1, 11, '', 'Abwerbeversuch', '{gegner} will {spieler} abwerben. Er möchte 30 % mehr Gehalt, um zu bleiben.', 'Gehalt erhöhen', 'sp_gehalt:+30; moral:+1', 'Ablehnen', 'chance:50; sp_verkauf || moral:-3'],
    [6, 1, 11, '', 'Umgeknickt im Training', '{spieler} ist im Training umgeknickt. Der Arzt rät zu einem MRT ({betrag}).', 'MRT bezahlen', 'geld:-300; sp_verletzt:7', 'Abwarten', 'chance:50; sp_verletzt:3 || sp_verletzt:35'],
    [5, 1, 11, '', 'Spendenlauf der Jugend', 'Die Jugend organisiert einen Spendenlauf. Läuft die Erste mit?', 'Mitlaufen', 'geld:+800; fitness:-5; fans:+3', 'Absagen', 'fans:-2'],
    [4, 1, 11, '', 'Fußball-Influencer', 'Ein Fußball-Influencer will ein Video im Stadion drehen und zahlt {betrag}.', 'Erlauben', 'geld:+400; fans:+5', 'Ablehnen', ''],
    [5, 1, 11, '', 'Pflegemaschine defekt', 'Die Pflegemaschine für den Platz ist kaputt. Eine neue kostet {betrag}.', 'Neu kaufen', 'geld:-1200', 'Leihen und flicken', 'geld:-200; platz:+6'],
    [7, 1, 11, '', 'Mannschaftsabend', 'Der Mannschaftsrat wünscht sich einen Mannschaftsabend auf Vereinskosten ({betrag}).', 'Spendieren', 'geld:-400; moral:+8; chem:+1', 'Ablehnen', 'moral:-4'],
    [4, 1, 11, '', 'Größeres Sponsorlogo', 'Der Trikotsponsor will sein Logo doppelt so groß und zahlt dafür {betrag} extra.', 'Annehmen', 'geld:+1000; fans:-3', 'Ablehnen', ''],
    [3, 1, 11, '6,7,8', 'Sommerfest', 'Der Vorstand plant ein großes Sommerfest. Zuschuss aus der Kasse: {betrag}.', 'Groß feiern', 'geld:-1500; fans:+8; vorstand:+3', 'Klein halten', 'fans:-1'],
    [2, 5, 11, '', 'Ex-Profi sucht Verein', 'Ein ehemaliger Zweitligaprofi (34) aus der Region würde für wenig Geld bei euch spielen.', 'Verpflichten', 'veteran', 'Ablehnen', ''],
    [5, 1, 11, '', 'Rekordkulisse erwartet', 'Fürs nächste Heimspiel wird eine Rekordkulisse erwartet. Zusätzliche Ordner kosten {betrag}.', 'Ordner buchen', 'geld:-300; zuschauer:+30/1', 'Sparen', 'chance:70; zuschauer:+30/1 || geld:-1000; vorstand:-3'],
    [4, 1, 11, '', 'Pyrotechnik', 'Nach Pyrotechnik droht eine Verbandsstrafe von {betrag}. Legt ihr Einspruch ein?', 'Strafe zahlen', 'geld:-500; vorstand:+1', 'Einspruch', 'chance:40; fans:+2 || geld:-900; vorstand:-2'],
    [5, 1, 11, '', 'LED-Flutlicht', 'Die Stromkosten steigen. Auf LED umrüsten für {betrag}? Spart dauerhaft Kosten.', 'Umrüsten', 'geld:-2500; betrieb:-60', 'Ablehnen', 'betrieb:+30'],
    [6, 5, 11, '', 'Studium in Aachen', '{spieler} beginnt ein Studium in Aachen und kann nur noch einmal pro Woche trainieren.', 'Akzeptieren', 'sp_form:-3; moral:+2', 'Freigeben', 'sp_weg'],
    [5, 1, 11, '', 'Fanbus', 'Die Fans wollen mit einem Bus zum nächsten Auswärtsspiel. Zuschuss: {betrag}.', 'Zuschuss geben', 'geld:-200; fans:+4', 'Nein', 'fans:-1'],
    [5, 1, 11, '', 'Kioskpreise erhöhen?', 'Der Kioskwirt schlägt vor, die Preise für Wurst und Bier anzuheben.', 'Erhöhen', 'geld:+400; fans:-3', 'Lassen', 'fans:+1'],
    [4, 5, 11, '', '50 Jahre Mitglied', 'Ein Vereinsurgestein feiert 50 Jahre Mitgliedschaft. Ehrung mit Präsent für {betrag}?', 'Ehren', 'geld:-150; vorstand:+3; fans:+2', 'Nicht nötig', 'vorstand:-2'],
    [3, 5, 11, '', 'Benefizspiel', 'Ein Regionalligist fragt nach einem Benefizspiel. Einnahmen {betrag}, aber Verletzungsgefahr.', 'Zusagen', 'chance:80; geld:+2000; fitness:-6 || geld:+2000; verletzt:21', 'Absagen', ''],
    [6, 1, 11, '', 'Kein Warmwasser', 'In der Kabine ist das Warmwasser ausgefallen. Reparatur: {betrag}.', 'Reparieren', 'geld:-700', 'Kalt duschen', 'moral:-6'],
    [4, 6, 11, '', 'Geburtstagsrunde', '{spieler} hat Geburtstag und will vor dem Spiel einen ausgeben.', 'Alkoholverbot', 'moral:-2; form:+1', 'Feiern lassen', 'moral:+4; fitness:-4'],
    [4, 1, 11, '', 'Crowdfunding', 'Fans starten eine Crowdfunding-Aktion für neue Trainingsgeräte.', 'Unterstützen', 'chance:65; geld:+2000; fans:+3 || fans:-1', 'Ablehnen', ''],
    [3, 1, 11, '', 'Steuerprüfung', 'Das Finanzamt kündigt eine Prüfung an. Einen Steuerberater beauftragen ({betrag})?', 'Berater holen', 'geld:-800', 'Selbst machen', 'chance:60; vorstand:+1 || geld:-3000; vorstand:-5'],
    [4, 5, 11, '', 'Ehrenamtliche Physio', 'Eine Physiotherapeutin aus dem Ort bietet an, ehrenamtlich zu helfen.', 'Gerne', 'heilung:5; moral:+2', 'Ablehnen', ''],
    [5, 1, 11, '7,8,1', 'Spielerberater', 'Ein Spielerberater bietet einen Stürmer an, der sofort helfen würde. Provision: {betrag}.', 'Annehmen', 'geld:-1000; spieler:ST', 'Ablehnen', ''],
    [6, 1, 11, '', 'Streit in der Kabine', 'Zwei Spieler sind in der Kabine aneinandergeraten.', 'Geldstrafe', 'moral:-3; geld:+100', 'Aussprache', 'moral:+2; form:-1'],
    [4, 1, 11, '6,7,8', 'Hitzewelle', 'Es sind 35 Grad angekündigt. Training in den Abend verlegen?', 'Abends trainieren', 'geld:-100; moral:+2', 'Normal trainieren', 'fitness:-8; chance:70 || verletzt:10'],
    [4, 1, 11, '12,1,2', 'Schnee auf dem Platz', 'Der Platz ist verschneit. Räumen lassen für {betrag}?', 'Räumen', 'geld:-400', 'Training ausfallen lassen', 'form:-2; moral:-1'],
    [5, 1, 11, '', 'Brauerei als Partner', 'Eine Brauerei will exklusiver Getränkepartner werden und zahlt sofort {betrag}.', 'Annehmen', 'geld:+2500; fans:-1', 'Ablehnen', ''],
    [3, 1, 11, '', 'Autohaus stellt Bus', 'Ein Autohaus stellt einen Mannschaftsbus und will dafür Werbung auf dem Trikotärmel.', 'Annehmen', 'build:bus; fans:-1', 'Ablehnen', ''],
    [1, 1, 11, '', 'Granulat-Debatte', 'Die Debatte um Kunststoffgranulat erreicht euch. Auf Kork umrüsten für {betrag}?', 'Umrüsten', 'geld:-2000; fans:+3; vorstand:+2', 'Abwarten', 'chance:70; vorstand:+0 || vorstand:-4'],
    [3, 5, 11, '', 'Rückkehrer', 'Ein ehemaliger Spieler (32) will zurückkehren – fast ohne Gehalt.', 'Willkommen zurück', 'veteran; fans:+3', 'Nein danke', ''],
    [5, 1, 11, '10,11,12,1,2,3', 'Grippewelle', 'Eine Grippewelle geht um. Teamarzt-Check für {betrag}?', 'Check machen', 'geld:-300; fitness:-2', 'Durchziehen', 'chance:50; fitness:-2 || kranke:3'],
    [5, 5, 11, '', 'Tombola beim Heimspiel', 'Die Damenmannschaft organisiert beim nächsten Heimspiel eine Tombola.', 'Unterstützen', 'geld:+500; fans:+2', 'Ablehnen', 'fans:-1'],
    [5, 1, 11, '', 'Bitte um Spielverlegung', '{gegner} bittet wegen Personalnot um eine Spielverlegung.', 'Fair zustimmen', 'vorstand:+1; fans:+1; moral:-1', 'Ablehnen', 'form:+1'],
    [3, 4, 11, '', 'NLZ will Jugendspieler', 'Ein Nachwuchsleistungszentrum will euer größtes Jugendtalent und zahlt {betrag} Ausbildungsentschädigung.', 'Abgeben', 'geld:+4000; fans:-2', 'Behalten', 'talent'],
    [6, 1, 11, '', 'Trainingszeiten der Jugend', 'Die Jugend braucht mehr Trainingszeiten. Gibt die Erste eine Einheit pro Woche ab?', 'Abgeben', 'form:-1; fans:+3; vorstand:+2', 'Nein', 'vorstand:-2'],
    [2, 1, 11, '', 'Lottogewinner', 'Ein Mitglied hat im Lotto gewonnen und will {betrag} spenden – wenn er Ehrenpräsident wird.', 'Annehmen', 'geld:+5000; vorstand:-3', 'Ablehnen', ''],
    [3, 5, 11, '', 'Nachbarverein in Not', 'Ein Nachbarverein steht vor dem Aus und fragt nach einer Jugend-Spielgemeinschaft ({betrag}).', 'Helfen', 'geld:-500; fans:+4; talent', 'Nein', ''],
    [3, 1, 11, '', 'Peinlicher Post', '{spieler} hat einen peinlichen Social-Media-Post abgesetzt.', 'Ein Spiel sperren', 'sp_verletzt:7; fans:+2', 'Ignorieren', 'fans:-4'],
    [3, 4, 11, '', 'WDR Lokalzeit', 'Die WDR Lokalzeit will über euren Verein berichten.', 'Zusagen', 'fans:+6; geld:+300', 'Absagen', ''],
    [2, 5, 11, '', 'Förderprogramm Flutlicht', 'Das Land fördert Spielflutlicht mit 70 %. Euer Anteil: {betrag}.', 'Mitmachen', 'geld:-3500; build:flutlicht2', 'Nein', ''],
    [4, 1, 11, '', 'Verletzter Leistungsträger', '{spieler} hat sich im Training schwer verletzt. Ein Spezialist in Köln kostet {betrag}.', 'Spezialist', 'geld:-1500; sp_verletzt:21', 'Vereinsarzt', 'sp_verletzt:45'],
    [5, 1, 11, '', 'Ärger mit dem Nachbarn', 'Ein Anwohner beschwert sich über den Lärm beim Flutlichttraining.', 'Lärmschutzwand ({betrag})', 'geld:-1500; vorstand:+1', 'Ignorieren', 'chance:50; vorstand:+0 || geld:-600; vorstand:-2'],
    [4, 1, 11, '', 'Vereinsmagazin', 'Ehrenamtliche wollen ein Stadionheft herausbringen. Druckkosten: {betrag}.', 'Unterstützen', 'geld:-300; fans:+3; sponsor:60/10', 'Nein', ''],
    [4, 1, 11, '', 'Dauerkarten-Aktion', 'Eine Dauerkarten-Aktion zum halben Preis bringt sofort Geld, aber weniger Einnahmen an den Spieltagen.', 'Starten', 'geld:+1800; zuschauer:-10/6; fans:+4', 'Nein', ''],
    [5, 1, 11, '', 'Trainer will Testspiel gegen Profis', 'Der Trainer wünscht sich ein Testspiel gegen einen klar stärkeren Gegner.', 'Zustimmen', 'chance:70; moral:+3; form:+2 || moral:-4', 'Ablehnen', ''],
    [5, 1, 11, '', 'Spieler unzufrieden', '{spieler} ist unzufrieden mit seiner Rolle.', 'Gespräch & Prämie ({betrag})', 'geld:-200; moral:+2', 'Bank ist Bank', 'chance:50; moral:-1 || sp_weg'],
    [4, 1, 11, '', 'Ehrenamtliche Platzwarte', 'Rentner aus dem Ort bieten an, sich ehrenamtlich um die Anlage zu kümmern.', 'Annehmen', 'betrieb:-40; vorstand:+2', 'Nein', ''],
    [3, 1, 11, '', 'Wetterschaden Vereinsheim', 'Ein Unwetter hat das Dach des Vereinsheims beschädigt. Reparatur: {betrag}.', 'Reparieren', 'geld:-2500', 'Notdürftig flicken', 'geld:-500; fans:-3'],
    [4, 1, 11, '', 'Schulkooperation', 'Eine Grundschule möchte eine Fußball-AG mit euch. Ein Spieler müsste mithelfen.', 'Zusagen', 'fans:+4; vorstand:+2; sp_fit:-10', 'Absagen', ''],
    [5, 1, 11, '', 'Trikottausch-Party', 'Die Fans wünschen sich ein Fanfest mit Trikotverkauf.', 'Fanfest machen ({betrag})', 'geld:-400; fans:+5; geld:+900', 'Nein', ''],
    [4, 1, 11, '', 'Verband fordert Lizenzunterlagen', 'Der Verband fordert fehlende Unterlagen. Ein Anwalt kostet {betrag}.', 'Anwalt', 'geld:-600', 'Selbst nachreichen', 'chance:75; vorstand:+0 || geld:-1500; vorstand:-3'],
    [3, 1, 11, '', 'Energiegeladener Neuzugang', 'Ein vereinsloser Mittelfeldspieler hat im Probetraining überzeugt.', 'Verpflichten', 'spieler:MF', 'Ablehnen', ''],
    [3, 1, 11, '', 'Abwehrspieler im Probetraining', 'Ein vereinsloser Verteidiger will sich anschließen.', 'Verpflichten', 'spieler:AB', 'Ablehnen', ''],
    [2, 1, 11, '', 'Torwart sucht Verein', 'Ein vereinsloser Torwart bietet sich an.', 'Verpflichten', 'spieler:TW', 'Ablehnen', ''],
    [4, 1, 11, '', 'Doping-Kontrolle', 'Bei einer Kontrolle hatte {spieler} ein verbotenes Erkältungsmittel genommen. Sperre droht.', 'Anwalt ({betrag})', 'geld:-800; chance:60; vorstand:+0 || geld:-800; sp_verletzt:30', 'Akzeptieren', 'sp_verletzt:30'],
    [4, 1, 11, '', 'Bandenwerbung Handwerker', 'Ein Dachdecker möchte für {betrag} im Monat werben (12 Monate).', 'Annehmen', 'sponsor:100/12', 'Ablehnen', ''],
    [3, 1, 11, '', 'Fehlende Spielerpässe', 'Bei zwei Spielern ist die Spielberechtigung noch nicht durch. Express-Bearbeitung: {betrag}.', 'Express', 'geld:-200', 'Abwarten', 'kranke:2'],
    [4, 1, 11, '', 'Ehemaliger Trainer zu Gast', 'Ein Ex-Trainer bietet einen Taktik-Workshop für {betrag} an.', 'Buchen', 'geld:-500; chem:+1; form:+1', 'Nein', ''],
    [4, 1, 11, '', 'Kapitän fordert Prämie', 'Der Kapitän fordert eine Siegprämie von {betrag} für das nächste Spiel.', 'Zahlen', 'geld:-500; moral:+6', 'Ablehnen', 'moral:-5'],
    [3, 1, 11, '', 'Vandalismus', 'Unbekannte haben die Ersatzbänke beschädigt. Neu kosten sie {betrag}.', 'Ersetzen', 'geld:-900', 'Provisorium', 'fans:-2; moral:-2'],
    [4, 1, 11, '', 'Nikolaus-Aktion', 'Die Spieler sollen bei der Jugend-Weihnachtsfeier als Nikoläuse auftreten.', 'Mitmachen', 'fans:+4; vorstand:+2; moral:+1', 'Absagen', 'fans:-2'],
    [3, 1, 11, '', 'Mitgliederversammlung', 'Auf der Mitgliederversammlung wird eine Beitragserhöhung vorgeschlagen.', 'Erhöhen', 'geld:+2000; fans:-4', 'Nicht erhöhen', 'fans:+2; vorstand:-1'],
    [3, 1, 11, '', 'E-Sport-Team', 'Ein Mitglied will ein E-Sport-Team im Vereinsnamen gründen. Start: {betrag}.', 'Gründen', 'geld:-500; fans:+3; sponsor:80/12', 'Nein', ''],
    [3, 1, 11, '', 'Jubiläumstrikot', 'Ein Sondertrikot zum Vereinsjubiläum würde {betrag} kosten, verkauft sich aber gut.', 'Produzieren', 'chance:75; geld:-1000; geld:+2500; fans:+3 || geld:-1000', 'Nein', ''],
    [2, 1, 11, '', 'Ehrenpreis Fairplay', 'Ihr seid für den Fairplay-Preis nominiert. Teilnahme an der Gala kostet {betrag}.', 'Hingehen', 'geld:-200; chance:50; geld:+1500; fans:+3 || fans:+1', 'Nicht hingehen', ''],
    [4, 1, 11, '', 'Rasen-Sprinkler kaputt', 'Die Bewässerung ist ausgefallen. Reparatur kostet {betrag}.', 'Reparieren', 'geld:-600', 'Nicht jetzt', 'platz:+5'],
    [3, 1, 11, '', 'Zuschauer verletzt', 'Ein Zuschauer ist auf der Treppe gestürzt. Die Versicherung will eine Selbstbeteiligung von {betrag}.', 'Zahlen', 'geld:-500', 'Streiten', 'chance:50; vorstand:+0 || geld:-1500; fans:-2'],
    [3, 1, 11, '', 'Erste-Hilfe-Kurs', 'Alle Trainer und Spieler sollen einen Erste-Hilfe-Kurs machen ({betrag}).', 'Machen', 'geld:-300; heilung:3; vorstand:+2', 'Nein', ''],
    [4, 1, 11, '', 'Spieler will verlängern', '{spieler} fühlt sich wohl und will vorzeitig verlängern – zu seinem jetzigen Gehalt.', 'Verlängern (+2 Jahre)', 'sp_vertrag:2; moral:+2', 'Nicht jetzt', ''],
    [3, 1, 11, '', 'Talentiertes Geschwisterkind', 'Der jüngere Bruder von {spieler} spielt richtig gut. Aufnehmen?', 'Aufnehmen', 'talent; moral:+1', 'Nein', ''],
    [3, 1, 11, '', 'Busunfall', 'Der Bus zum Auswärtsspiel hatte eine Panne. Ersatzbus: {betrag}.', 'Ersatzbus', 'geld:-600', 'Fahrgemeinschaften', 'fitness:-5; moral:-3'],
    [3, 1, 11, '', 'Lokaler Radiosender', 'Ein Lokalradio will eure Heimspiele live übertragen und zahlt {betrag}.', 'Zusagen', 'geld:+600; fans:+3', 'Absagen', ''],
    [3, 1, 11, '', 'Fanprotest Ticketpreise', 'Fans protestieren gegen die Eintrittspreise.', 'Fanrabatt einführen', 'zuschauer:+10/4; geld:-300; fans:+5', 'Ignorieren', 'fans:-5'],
    [2, 1, 6, '', 'Investor klopft an', 'Ein Investor bietet {betrag} für einen Teil der Vermarktungsrechte.', 'Annehmen', 'geld:+30000; fans:-10; vorstand:+5', 'Ablehnen', 'fans:+4'],
    [3, 1, 4, '', 'Nationalspieler-Abstellung', '{spieler} wird zur Nationalmannschaft eingeladen.', 'Freigeben', 'sp_fit:-15; sp_str:+1; fans:+3', 'Verletzung vorschieben', 'fans:-4; vorstand:-2'],
    [3, 1, 5, '', 'Sportwetten-Sponsor', 'Ein Sportwettenanbieter bietet {betrag} pro Monat für 12 Monate.', 'Annehmen', 'sponsor:1500/12; fans:-4', 'Ablehnen', 'fans:+2'],
    [3, 1, 4, '', 'TV-Livespiel', 'Euer nächstes Heimspiel soll live im TV laufen. Anstoßzeit am Montagabend.', 'Annehmen', 'geld:+5000; zuschauer:-15/1; fans:-1', 'Ablehnen', ''],
    [2, 1, 3, '', 'Stadion-Namensrechte', 'Ein Konzern will den Stadionnamen kaufen: {betrag} pro Monat für 24 Monate.', 'Verkaufen', 'sponsor:8000/24; fans:-6', 'Waldstadion bleibt!', 'fans:+6'],
    [3, 1, 11, '', 'Gutachten zum Kunstrasen', 'Ein Gutachter würde den Platz für {betrag} prüfen und pflegen.', 'Beauftragen', 'geld:-700; platz:-8', 'Nein', ''],
    [4, 1, 11, '', 'Kinder-Einlaufkinder', 'Eine Kita fragt, ob ihre Kinder mit den Spielern einlaufen dürfen.', 'Klar!', 'fans:+3; moral:+1', 'Nein', 'fans:-1'],
    [3, 1, 11, '', 'Altpapier-Sammlung', 'Die Jugend sammelt Altpapier für die Vereinskasse. Die Erste soll helfen.', 'Helfen', 'geld:+350; fitness:-2; fans:+2', 'Keine Zeit', ''],
    [3, 1, 11, '', 'Traditionsspiel', 'Zum Jubiläum soll ein Traditionsspiel gegen alte Legenden stattfinden ({betrag} Kosten).', 'Ausrichten', 'geld:-400; zuschauer:+20/1; fans:+5', 'Nein', ''],
    [4, 1, 11, '', 'Gehaltsverzicht', 'Die Kasse ist knapp. Die Mannschaft bietet einen Monat Gehaltsverzicht an – wenn sie später eine Prämie bekommt.', 'Annehmen', 'geld:+1200; moral:-3', 'Ablehnen', 'moral:+2'],
    [3, 1, 11, '', 'Verletzte zurück', 'Die Reha läuft super. Ein zusätzlicher Reha-Tag für alle Verletzten kostet {betrag}.', 'Bezahlen', 'geld:-400; heilung:7', 'Nein', ''],
    [3, 1, 11, '', 'Trikotsponsor springt ab', 'Ein kleiner Sponsor kann nicht mehr zahlen und bittet um Auflösung.', 'Fair auflösen', 'fans:+2; vorstand:+1', 'Auf Vertrag bestehen', 'geld:+500; fans:-2'],
    [3, 1, 11, '', 'Spieler wird Vater', '{spieler} ist Vater geworden und will zwei Wochen Elternzeit.', 'Gönnen wir ihm', 'sp_fit:-25; moral:+4', 'Nur eine Woche', 'sp_fit:-10; moral:-2'],
    [3, 1, 11, '', 'Ballspende eines Sportgeschäfts', 'Ein Sportgeschäft schenkt euch Bälle – wenn ihr für den Laden werbt.', 'Annehmen', 'betrieb:-20; fans:+1', 'Ablehnen', ''],
    [2, 1, 11, '', 'Fernsehteam Doku', 'Ein Streamingdienst will eine Doku über euren Verein drehen.', 'Zusagen', 'fans:+8; geld:+1500; moral:-2', 'Absagen', ''],
    [3, 1, 11, '', 'Überraschungserbe', 'Ein verstorbenes Mitglied hat dem Verein {betrag} vererbt.', 'Annehmen', 'geld:+4000; vorstand:+2', 'An die Jugend geben', 'fans:+5; talent']
  ];

  // ---------------------------------------------------------------- Nachrichten (4 Antworten)
  // Absender | Text | Antwort 1 | Effekte 1 | Antwort 2 | Effekte 2 | Antwort 3 | Effekte 3 | Antwort 4 | Effekte 4
  const MAILS = [
    ['{spieler}', 'Trainer, ich fühle mich gerade richtig gut. Darf ich im nächsten Spiel von Anfang an ran?', 'Klar, du spielst!', 'sp_form:+2; moral:+2', 'Zeig es erst im Training', 'sp_form:+1', 'Die Startelf steht schon', 'sp_form:-1', 'Keine Diskussionen', 'moral:-2; sp_form:-2'],
    ['{spieler}', 'Mein Vertrag ist mir wichtig. Können wir bald über eine Verlängerung sprechen?', 'Sehr gerne, bald!', 'moral:+2', 'Nach der Saison', '', 'Erst Leistung zeigen', 'sp_form:+1; moral:-1', 'Kein Interesse', 'moral:-3; sp_form:-2'],
    ['{spieler}', 'Ich habe leichte Probleme am Oberschenkel. Soll ich pausieren?', 'Pause, Gesundheit geht vor', 'sp_verletzt:4', 'Physio-Behandlung', 'geld:-100', 'Zähne zusammenbeißen', 'chance:60; sp_form:+1 || sp_verletzt:14', 'Ich will dich spielen sehen', 'chance:40; moral:+1 || sp_verletzt:21'],
    ['Fanclub „Ländchen-Power“', 'Wir planen eine Choreo fürs nächste Heimspiel. Unterstützt uns der Verein?', 'Wir zahlen das Material', 'geld:-250; fans:+5', 'Ordner helfen beim Aufbau', 'fans:+3', 'Gute Idee, aber ohne Geld', 'fans:+1', 'Keine Choreos', 'fans:-4'],
    ['Fan @wachtberger_jung', 'Warum spielt eigentlich {spieler} nicht öfter? Der ist doch richtig gut!', 'Er bekommt seine Chance', 'fans:+2', 'Danke für den Hinweis', 'fans:+1', 'Ich stelle auf, nicht die Fans', 'fans:-2', '(nicht antworten)', ''],
    ['Staffelleiter', 'Wegen einer Platzsperre beim Gegner muss das nächste Spiel eventuell verlegt werden. Einverstanden?', 'Ja, kein Problem', 'vorstand:+1', 'Nur mit Ersatztermin', '', 'Lieber nicht', 'vorstand:-1', 'Auf keinen Fall', 'vorstand:-2; fans:+1'],
    ['Staffelleiter', 'Bitte reicht bis Freitag den Spielbericht vom letzten Spiel vollständig nach.', 'Erledigt!', 'vorstand:+1', 'Machen wir am Wochenende', 'chance:70; vorstand:+0 || geld:-50', 'Das war doch vollständig', 'geld:-50', 'Kümmert sich der Betreuer', ''],
    ['Vorstand', 'Wie zufrieden bist du mit der Entwicklung der Mannschaft?', 'Sehr! Wir sind auf Kurs', 'vorstand:+2', 'Läuft, aber es geht mehr', 'vorstand:+1', 'Wir brauchen Verstärkungen', 'vorstand:-1', 'Ehrlich gesagt nicht', 'vorstand:-3'],
    ['Vorstand', 'Ein Mitglied fragt, ob die Erste beim Vereinsfest ein Elfmeterschießen gegen die Jugend macht.', 'Klar, sind dabei', 'fans:+3; fitness:-2', 'Nur ein paar Spieler', 'fans:+1', 'Passt zeitlich nicht', 'fans:-1', 'Bitte ohne uns', 'fans:-3'],
    ['Sponsor Autohaus Rheintal', 'Wir würden gerne ein Fotoshooting mit der Mannschaft machen.', 'Sehr gerne', 'geld:+300; moral:-1', 'Gerne, aber kurz', 'geld:+150', 'Nur mit dem Kapitän', 'geld:+80', 'Lieber nicht', 'vorstand:-1'],
    ['General-Anzeiger', 'Kurze Frage für den Spieltagsbericht: Wer ist für dich aktuell der wichtigste Spieler?', '{spieler}, ganz klar', 'sp_form:+1; moral:-1', 'Das ganze Team', 'moral:+2', 'Ich nenne keine Namen', '', 'Der Trainer!', 'fans:+1; moral:-1'],
    ['General-Anzeiger', 'Wie bewertest du die letzte Partie?', 'Wir waren richtig gut', 'fans:+2', 'Ausbaufähig', '', 'Der Schiri war schuld', 'fans:+1; vorstand:-1', 'Kein Kommentar', 'fans:-1'],
    ['Jugendtrainer', 'Ein A-Jugendlicher trainiert stark. Darf er bei der Ersten mittrainieren?', 'Ja, sofort', 'talent', 'Einmal pro Woche', 'chance:50; talent || moral:+1', 'Nach der Saison', '', 'Kein Platz', 'fans:-1'],
    ['Platzwart', 'Der Platz leidet unter dem vielen Training. Sollen wir eine Einheit auf den Nebenplatz verlegen?', 'Ja, machen wir', 'platz:-2; form:-1', 'Nur bei Regen', 'platz:-1', 'Der Platz hält das aus', 'platz:+2', 'Mehr Training, nicht weniger', 'platz:+4; form:+1'],
    ['Bürgermeister', 'Die Gemeinde würde gerne eine Ehrung für eure Saison im Rathaus machen.', 'Große Ehre, wir kommen', 'fans:+4; vorstand:+2', 'Mit einer kleinen Delegation', 'vorstand:+1', 'Nach der Saison gerne', '', 'Keine Zeit', 'vorstand:-2'],
    ['{spieler}', 'Mein Kumpel spielt in der Kreisliga richtig stark. Wollt ihr ihn zum Probetraining einladen?', 'Klar, bring ihn mit', 'spieler:MF', 'Schick mir ein Video', '', 'Wir sind voll', 'moral:-1', 'Kein Interesse', 'moral:-2'],
    ['Kapitän', 'Die Jungs wünschen sich nach dem nächsten Sieg einen Grillabend.', 'Versprochen!', 'moral:+5; geld:-200', 'Bei zwei Siegen in Folge', 'moral:+2', 'Erst die Saison', '', 'Konzentration aufs Sportliche', 'moral:-3'],
    ['Schiedsrichter-Obmann', 'Ihr habt zu wenige Schiedsrichter gemeldet. Wie wollt ihr das lösen?', 'Wir schicken zwei zum Lehrgang', 'vorstand:+2; moral:-1', 'Wir suchen im Verein', 'vorstand:+1', 'Strafe zahlen', 'geld:-300', 'Ignorieren', 'geld:-600; vorstand:-2'],
    ['Fan @laendchen_ultra', 'Was ist das Ziel für die Rückrunde?', 'Ganz nach oben!', 'fans:+3; vorstand:-1', 'Jedes Spiel gewinnen', 'fans:+2', 'Ruhe bewahren', 'fans:+1', 'Erstmal Klassenerhalt', 'fans:-1; vorstand:+1'],
    ['{spieler}', 'Ich würde gerne auf einer anderen Position spielen. Kann ich das im Training zeigen?', 'Ja, probier es', 'moral:+1', 'In Testspielen gerne', '', 'Bleib auf deiner Position', 'sp_form:-1', 'Nein', 'moral:-2'],
    ['Merchandise-Team', 'Das neue Auswärtstrikot ist fertig. Wie bewerben wir es?', 'Großer Launch mit Video', 'geld:-300; fans:+4; geld:+800', 'Instagram-Post', 'fans:+2; geld:+200', 'Im Vereinsheim auslegen', 'geld:+100', 'Gar nicht', ''],
    ['Rivale', '{gegner} schlägt ein Freundschaftsspiel zum Saisonende vor.', 'Gerne!', 'fans:+2; geld:+300', 'Nur bei uns zu Hause', 'geld:+200', 'Vielleicht später', '', 'Kein Interesse', 'fans:-1'],
    ['Physio', 'Die Belastung im Kader ist hoch. Soll ich eine Regenerationseinheit einbauen?', 'Ja, unbedingt', 'fitness:+8; form:-1', 'Nur für die Stammspieler', 'fitness:+4', 'Nach dem nächsten Spiel', 'fitness:+2', 'Keine Zeit dafür', 'fitness:-4'],
    ['Social-Media-Team', 'Ein Video vom letzten Tor geht gerade viral. Sollen wir es pushen?', 'Ja, mit Werbung', 'geld:-150; fans:+6', 'Story posten', 'fans:+3', 'Lieber nicht übertreiben', 'fans:+1', 'Löschen', 'fans:-2'],
    ['Vorstand', 'Ein Sponsor fragt, ob er in der Kabine ein Plakat aufhängen darf.', 'Klar, gegen Geld', 'geld:+400; moral:-1', 'Im Vereinsheim statt Kabine', 'geld:+200', 'Nur kleines Logo', 'geld:+100', 'Kabine bleibt werbefrei', 'moral:+1'],
    ['{spieler}', 'Ich hatte private Probleme und war unkonzentriert. Sorry für die Leistung.', 'Kein Problem, wir sind für dich da', 'moral:+3; sp_form:+1', 'Nimm dir eine Auszeit', 'sp_fit:-15; sp_form:+2', 'Konzentrier dich jetzt', '', 'Das darf nicht passieren', 'sp_form:-2; moral:-2'],
    ['Ehrenamtler', 'Wir suchen Helfer für den Kuchenverkauf beim Heimspiel. Helfen Spieler mit?', 'Alle Mann an den Stand', 'fans:+4; geld:+250; fitness:-2', 'Die Verletzten helfen', 'fans:+2; geld:+150', 'Wir spenden Kuchen', 'geld:+80', 'Keine Zeit', 'fans:-2'],
    ['Staffelleiter', 'Gegen euch läuft ein Verfahren wegen eines verspäteten Anstoßes.', 'Wir zahlen die Strafe', 'geld:-150', 'Einspruch einlegen', 'chance:50; vorstand:+1 || geld:-300', 'Das war der Gegner', 'chance:30; vorstand:+0 || geld:-250', 'Ignorieren', 'geld:-400; vorstand:-2'],
    ['Fan @svw_oldschool', 'Früher war mehr Leidenschaft im Waldstadion! Was macht ihr dagegen?', 'Mehr Fan-Aktionen', 'fans:+3; geld:-100', 'Freier Eintritt für Kinder', 'fans:+2; zuschauer:+10/2', 'Wir arbeiten dran', 'fans:+1', 'Stimmt nicht', 'fans:-3'],
    ['Co-Trainer', 'Sollen wir im nächsten Spiel offensiver spielen?', 'Volle Attacke', 'form:+1; moral:+1', 'Etwas mutiger', 'form:+1', 'Bleiben wie bisher', '', 'Lieber sicher stehen', 'moral:-1']
  ];

  // ---------------------------------------------------------------- Namen
  const VORNAMEN = ['Lukas', 'Leon', 'Finn', 'Jonas', 'Paul', 'Luca', 'Ben', 'Noah', 'Elias', 'Felix', 'Tim', 'Jan', 'Niklas', 'Max', 'Moritz', 'David', 'Julian', 'Tom', 'Simon', 'Fabian', 'Philipp', 'Kevin', 'Marvin', 'Dennis', 'Tobias', 'Florian', 'Marco', 'Sebastian', 'Daniel', 'Patrick', 'Yannick', 'Robin', 'Nico', 'Kai', 'Lennart', 'Malte', 'Henrik', 'Ole', 'Mats', 'Till', 'Can', 'Emre', 'Mehmet', 'Yusuf', 'Ali', 'Deniz', 'Arda', 'Kerem', 'Ivan', 'Luka', 'Marko', 'Dario', 'Mateo', 'Nikola', 'Adrian', 'Kacper', 'Jakub', 'Mohamed', 'Karim', 'Amin', 'Samuel', 'Joel', 'Ibrahima', 'Moussa', 'Kofi', 'Rafael', 'Diego', 'Tiago', 'Andrea', 'Lorenzo', 'Alessio', 'Hugo', 'Théo', 'Liam', 'Mika', 'Jannik', 'Lars', 'Sven', 'Bastian', 'Dominik'];
  const NACHNAMEN = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Köhler', 'Herrmann', 'Walter', 'König', 'Mayer', 'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn', 'Vogel', 'Keller', 'Günther', 'Frank', 'Berger', 'Roth', 'Beck', 'Lorenz', 'Brandt', 'Schumacher', 'Engel', 'Jansen', 'Hennes', 'Schmitz', 'Kurth', 'Esser', 'Breuer', 'Wirtz', 'Kremer', 'Hilger', 'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Öztürk', 'Kowalski', 'Nowak', 'Wiśniewski', 'Petrović', 'Jovanović', 'Horvat', 'Kovač', 'Rossi', 'Bianchi', 'Romano', 'Silva', 'Santos', 'Pereira', 'Fernández', 'García', 'Martin', 'Dubois', 'Diallo', 'Traoré', 'Mensah', 'Owusu', 'Benali', 'El Amrani', 'Haddad', 'Nielsen', 'Hansen', 'Berisha', 'Krasniqi', 'Hoxha'];

  const KONFIG = [
    ['Vereinsname', 'SV Wachtberg', 'Name deines Vereins im Spiel'],
    ['Start-Ebene', 'automatisch', '„automatisch“ = wird aus dem Teamstats-Sheet gelesen. Oder Zahl 1–11 eintragen (7 = Bezirksliga).'],
    ['Start-Ebene Sheet-ID', '1a_Jz7gnLMcr0Hkm9k8HGX1dZjlTc1LhQkRU4jqfzqvo', 'Sheet, in dem die Liga der Ersten steht'],
    ['Start-Ebene Tab-ID (gid)', '1293357674', 'gid des Tabs aus dem Link (…#gid=1293357674)'],
    ['Start-Ebene Zelle', '', 'Optional: genaue Zelle, z. B. B2. Leer = wird automatisch gesucht.'],
    ['Gründungsjahr', 1922, 'Gründungsjahr des SV Wachtberg (für die Vereins-Box).'],
    ['Vereinsmitglieder', 450, 'Mitglieder zum Spielstart – steigen im Spiel mit Erfolg und Fans.'],
    ['Profilbilder-Ordner-ID', '17smpc6g3vDCchHpNfBCA9eZSpHFLyKhp', 'Google-Drive-Ordner, in dem hochgeladene Profilbilder gespeichert werden.'],
    ['Vereinswappen-URL', '', 'Optional: Bild-URL des Wachtberg-Wappens. Leer = wird beim Ligen-Import von fussball.de geholt.'],
    ['FVM-Logo-URL', '', 'Optional: Bild-URL des Verbandslogos (FVM) für die Eintrittskarte Kreisliga D bis Mittelrheinliga und Kreis-/Mittelrheinpokal. Leer = Schriftzug.'],
    ['DFB-Logo-URL', '', 'Optional: Bild-URL des DFB-Logos für die Eintrittskarte ab Regionalliga und im DFB-Pokal. Leer = Schriftzug.'],
    ['Kunstrasen Baujahr', 2018, 'Baujahr des Kunstrasens im Waldstadion'],
    ['Stadionkapazität', 1000, 'Zuschauerplätze im Waldstadion zum Start'],
    ['Rücklagen zum Start', 5000, 'Geld, das zusätzlich zum ersten Saisonbudget da ist']
  ];

  return { MAILS: MAILS, REGELN: REGELN, LIGEN: L, AUSBAU: AUSBAU, CAMPS: CAMPS, EVENTS: EV, VORNAMEN: VORNAMEN, NACHNAMEN: NACHNAMEN, KONFIG: KONFIG };
})();
