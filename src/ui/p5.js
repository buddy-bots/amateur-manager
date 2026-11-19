
/* ===================================================================== Trainings-Minispiele (30) */
var MG = null, MGA = null;
function mgClamp(v) { return Math.max(0, Math.min(1, v)); }
function mgRnd(a, b) { return a + Math.random() * (b - a); }
function mgInt(a, b) { return Math.floor(mgRnd(a, b + 1)); }
function mgApi() {
  var A = { alive: true, timers: [], box: $('#mgbox') };
  var SPD = MG && MG.diff === 'hard' ? 0.62 : MG && MG.diff === 'mid' ? 1.3 : 1; A.spd = SPD;
  A.t = function (f, ms) { var h = setTimeout(function () { if (A.alive) f(); }, ms * SPD); A.timers.push(h); return h; };
  A.loop = function (f) { var last = performance.now(); var step = function (now) { if (!A.alive) return; var dt = Math.min(0.05, (now - last) / 1000) / SPD; last = now; if (f(dt, now) !== false && A.alive) requestAnimationFrame(step); }; requestAnimationFrame(step); };
  A.pow = function (v) { v = mgClamp(v); A.lastPow = v; var b = $('#mgpowi'), t = $('#mgpowt'); if (b) { b.style.height = (v * 100) + '%'; b.style.background = v >= 0.7 ? 'var(--g)' : v >= 0.4 ? 'var(--y)' : 'var(--r)'; } if (t) t.textContent = Math.round(v * 100); };
  A.info = function (s) { var e = $('#mginfo'); if (e) e.textContent = s; };
  A.end = function (s) { if (!A.alive) return; A.alive = false; A.timers.forEach(clearTimeout); A.pow(s); setTimeout(function () { mgEnd(s); }, 250); };
  A.hit = function () { beep(900, 0.05, 'square', 0.03); };
  A.miss = function () { beep(180, 0.08, 'sawtooth', 0.03); };
  A.canvas = function (h) {
    A.W = 340; A.H = h || 260; A.box.innerHTML = '<canvas width="340" height="' + A.H + '" style="width:100%;border-radius:12px;touch-action:none;display:block;cursor:pointer;user-select:none"></canvas>';
    A.cv = A.box.querySelector('canvas'); A.cx = A.cv.getContext('2d');
    A.pt = function (e) { var r = A.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * A.W / r.width, y: (e.clientY - r.top) * A.H / r.height }; };
    return A.cv;
  };
  A.pitch = function (col) { var x = A.cx; x.fillStyle = col || '#2f7a2c'; x.fillRect(0, 0, A.W, A.H); for (var i = 0; i < 8; i++) { x.fillStyle = 'rgba(255,255,255,.04)'; if (i % 2) x.fillRect(i * A.W / 8, 0, A.W / 8, A.H); } };
  A.ballAt = function (bx, by, r) { var x = A.cx; x.fillStyle = '#fff'; x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill(); x.fillStyle = '#222'; x.beginPath(); x.arc(bx, by, r * 0.32, 0, 7); x.fill(); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1; x.beginPath(); x.arc(bx, by, r, 0, 7); x.stroke(); };
  A.man = function (mx, my, col, r) { var x = A.cx; r = r || 11; x.fillStyle = col; x.beginPath(); x.arc(mx, my, r, 0, 7); x.fill(); x.fillStyle = '#e8b48a'; x.beginPath(); x.arc(mx, my - r - 5, r * 0.55, 0, 7); x.fill(); };
  A.goal = function (gx, gy, gw, gh) { var x = A.cx; x.strokeStyle = '#fff'; x.lineWidth = 4; x.strokeRect(gx, gy, gw, gh); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 1; for (var i = 1; i < 10; i++) { x.beginPath(); x.moveTo(gx + i * gw / 10, gy); x.lineTo(gx + i * gw / 10, gy + gh); x.stroke(); } for (var j = 1; j < 5; j++) { x.beginPath(); x.moveTo(gx, gy + j * gh / 5); x.lineTo(gx + gw, gy + j * gh / 5); x.stroke(); } };
  A.text = function (t, tx, ty, size, col, al) { var x = A.cx; x.fillStyle = col || '#fff'; x.font = 'bold ' + (size || 16) + 'px Montserrat,sans-serif'; x.textAlign = al || 'left'; x.fillText(t, tx, ty); x.textAlign = 'left'; };
  A.grid = function (n, cols, rowH, html) { var c = ''; for (var i = 0; i < n; i++) c += '<div data-i="' + i + '" style="border-radius:10px;background:rgba(255,255,255,.08);cursor:pointer;display:grid;place-items:center;font-weight:800;font-size:20px;user-select:none">' + (html ? html(i) : '') + '</div>'; A.box.innerHTML = '<div id="mgg" style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);grid-auto-rows:' + rowH + 'px;gap:6px;user-select:none;touch-action:manipulation">' + c + '</div>'; return $('#mgg'); };
  A.buttons = function (labels, cb) { var w = document.createElement('div'); w.style.cssText = 'display:grid;grid-template-columns:repeat(' + labels.length + ',1fr);gap:6px;margin-top:8px'; w.innerHTML = labels.map(function (l, i) { return '<button class="pri" data-b="' + i + '" style="padding:12px 4px;font-size:15px">' + l + '</button>'; }).join(''); A.box.appendChild(w); w.onpointerdown = function (e) { var b = e.target.closest('[data-b]'); if (b) { e.preventDefault(); cb(+b.getAttribute('data-b')); } }; return w; };
  return A;
}
/* Generische Timing-Bausteine */
function mgBarTiming(A, o) {
  A.box.innerHTML = '<div style="height:240px;border-radius:12px;background:' + (o.bg || '#2f7a2c') + ';position:relative;overflow:hidden;user-select:none;cursor:pointer;touch-action:manipulation" id="mgt"><div style="position:absolute;left:20px;right:20px;top:100px;height:36px;border-radius:18px;background:rgba(0,0,0,.3)"><div id="mgz" style="position:absolute;top:0;bottom:0;background:rgba(143,200,82,.9);border-radius:18px"></div><div id="mgm" style="position:absolute;top:-6px;width:6px;height:48px;background:#fff;border-radius:3px;box-shadow:0 0 8px #000"></div></div><div style="position:absolute;top:24px;width:100%;text-align:center;color:#fff;font-weight:800;font-size:22px" id="mglbl">' + (o.icon || '') + '</div><div style="position:absolute;bottom:16px;width:100%;text-align:center;color:#fff;font-weight:700">' + (o.hint || 'Tippe zum Stoppen!') + '</div></div>';
  var tries = 0, pts = 0, pos = 0, dir = 1, sp, zw, zx, N = o.n || 8;
  var setZ = function () { zw = Math.max(o.minW || 0.07, (o.w || 0.22) - tries * (o.shrink || 0.018)); zx = 0.05 + Math.random() * (0.9 - zw); $('#mgz').style.left = (zx * 100) + '%'; $('#mgz').style.width = (zw * 100) + '%'; sp = (o.sp || 0.8) + tries * (o.acc || 0.12); };
  setZ();
  A.loop(function (dt) { pos += dir * sp * dt; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } var m = $('#mgm'); if (m) m.style.left = 'calc(' + (pos * 100) + '% - 3px)'; });
  $('#mgt').onpointerdown = function () { if (!A.alive) return; tries++; var c = zx + zw / 2, d = Math.abs(pos - c); var p = pos >= zx && pos <= zx + zw ? 1 - d / (zw / 2) * 0.4 : 0; pts += p; p ? A.hit() : A.miss(); A.pow(pts / tries * Math.min(1, tries / N * 1.5)); A.info('Versuch ' + tries + '/' + N + ' · ' + (p ? 'Treffer!' : 'daneben')); if (tries >= N) return A.end(pts / N); setZ(); };
}
function mgWhack(A, o) {
  var g = A.grid(o.cells, o.cols, o.rowH || 60, o.cellHtml); var n = 0, hits = 0, miss = 0, cur = -1, tm = null, N = o.n, life = o.life || 1100, t0 = 0, tSum = 0;
  var next = function () { if (cur >= 0 && g.children[cur]) { g.children[cur].style.background = 'rgba(255,255,255,.08)'; g.children[cur].innerHTML = o.cellHtml ? o.cellHtml(cur) : ''; } if (n >= N) { clearTimeout(tm); var avg = hits ? tSum / hits : 1500; return A.end(mgClamp(hits / N * Math.max(0.35, Math.min(1, (life - avg) / (life * 0.6) + 0.45)) - miss * 0.03)); } n++; var c; do { c = mgInt(0, o.cells - 1); } while (c === cur); cur = c; g.children[cur].style.background = o.col || '#8fc852'; if (o.lit) g.children[cur].innerHTML = o.lit; t0 = Date.now(); A.info((o.label || 'Ziel') + ' ' + n + '/' + N + ' · Treffer ' + hits); clearTimeout(tm); tm = A.t(next, Math.max(o.minLife || 450, life - n * (o.speedup || 0))); };
  g.onpointerdown = function (e) { var el = e.target.closest('[data-i]'); if (!el || !A.alive) return; if (+el.getAttribute('data-i') === cur) { hits++; tSum += Date.now() - t0; A.hit(); el.style.background = '#fff'; var c0 = cur; cur = -1; clearTimeout(tm); A.pow(hits / N * 1.2); A.t(function () { el.style.background = 'rgba(255,255,255,.08)'; el.innerHTML = o.cellHtml ? o.cellHtml(c0) : ''; next(); }, 120); } else { miss++; A.miss(); } };
  A.t(next, 400);
}
function mgQuiz(A, o) {
  var round = 0, pts = 0;
  var ask = function () {
    if (round >= o.n) return A.end(pts / o.n); round++; var q = o.gen(round);
    A.box.innerHTML = '<div style="border-radius:12px;background:#2f7a2c;min-height:190px;display:grid;place-items:center;position:relative;overflow:hidden" id="mgq">' + q.show + '</div><div class="xs muted" style="text-align:center;margin-top:6px">' + (q.ask || '') + '</div>';
    var go = function () { if (!A.alive) return; if (q.hideAfter) $('#mgq').innerHTML = '<div style="color:#fff;font-weight:800;font-size:22px">?</div>'; A.buttons(q.opts, function (i) { if (!A.alive) return; if (i === q.ok) { pts++; A.hit(); } else A.miss(); A.pow(pts / o.n * 1.2); A.info('Runde ' + round + '/' + o.n + ' · ' + (i === q.ok ? 'richtig' : 'falsch')); A.box.querySelectorAll('[data-b]').forEach(function (b) { b.disabled = true; }); A.t(ask, 450); }); };
    if (q.hideAfter) A.t(go, q.hideAfter); else go();
  };
  ask();
}
var MGS = {
  react: { n: '⚡ Reaktion', d: 'Tippe so schnell wie möglich auf die grün aufleuchtenden Felder. 10 Ziele.', tags: 'all', run: function (A) { mgWhack(A, { cells: 16, cols: 4, n: 10, life: 1100 }); } },
  keepy: { n: '🤹 Ball hochhalten', d: 'Tippe unter den Ball, um ihn in der Luft zu halten (max. 20 Kontakte).', tags: 'kondition mittelfeld aussen', run: function (A) {
    var c = A.canvas(); var b = { x: 170, y: 60, vx: 0, vy: 0, r: 16 }, k = 0, t0 = Date.now(), floor = A.H * 0.75;
    A.loop(function (dt) { b.vy += 900 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < b.r || b.x > A.W - b.r) { b.vx *= -0.9; b.x = Math.max(b.r, Math.min(A.W - b.r, b.x)); } var x = A.cx; var gr = x.createLinearGradient(0, 0, 0, A.H); gr.addColorStop(0, '#7fc4ef'); gr.addColorStop(0.75, '#cfe9f8'); x.fillStyle = gr; x.fillRect(0, 0, A.W, A.H); x.fillStyle = '#3f8a32'; x.fillRect(0, floor, A.W, A.H - floor); A.ballAt(b.x, b.y, b.r); A.text('Kontakte: ' + k, 10, 22, 16, '#14200c'); if (b.y > floor - b.r) { A.end(k / 20); return false; } if (k >= 20 || Date.now() - t0 > 25000) { A.end(k / 20); return false; } });
    c.onpointerdown = function (e) { var p = A.pt(e); if (Math.abs(p.x - b.x) < 44 && p.y > b.y - 12 && p.y < b.y + 72) { k++; b.vy = -460 - Math.random() * 80; b.vx = (b.x - p.x) * 6 + mgRnd(-60, 60); A.hit(); A.pow(k / 20); } };
  } },
  timing: { n: '🎯 Präzision', d: 'Stoppe den Balken im grünen Bereich. 8 Versuche – die Zone wird kleiner.', tags: 'sturm standards abwehr', run: function (A) { mgBarTiming(A, { icon: '🎯' }); } },
  penalty: { n: '🥅 Elfmeter', d: 'Der Torwart bewegt sich. Tippe dorthin, wo er nicht ist. 6 Schüsse.', tags: 'sturm standards', run: function (A) {
    var c = A.canvas(); var gk = 170, dir = 1, sp = 120, shots = 0, goals = 0, shot = null;
    A.loop(function (dt) { gk += dir * sp * dt; if (gk > 280) dir = -1; if (gk < 60) dir = 1; A.pitch(); A.goal(40, 40, 260, 120); var x = A.cx; x.fillStyle = '#f0c24b'; x.fillRect(gk - 22, 70, 44, 90); x.fillStyle = '#e8b48a'; x.beginPath(); x.arc(gk, 60, 12, 0, 7); x.fill(); if (shot) { shot.t += dt * 3; A.ballAt(170 + (shot.x - 170) * shot.t, 230 + (shot.y - 230) * shot.t, 12 - shot.t * 4); if (shot.t >= 1) { var ok = shot.x > 44 && shot.x < 296 && shot.y > 44 && shot.y < 158 && Math.abs(shot.x - gk) > 30; ok ? (goals++, A.hit()) : A.miss(); shots++; A.pow(goals / 6 * 1.1); A.info('Schuss ' + shots + '/6 · Tore ' + goals); shot = null; sp += 25; if (shots >= 6) { A.end(goals / 6); return false; } } } else A.ballAt(170, 230, 12); });
    c.onpointerdown = function (e) { if (!shot) { var p = A.pt(e); shot = { x: p.x, y: p.y, t: 0 }; } };
  } },
  saves: { n: '🧤 Torwart-Reflexe', d: 'Bälle fliegen aufs Tor – tippe sie an, bevor sie im Netz landen. 12 Bälle.', tags: 'torwart abwehr', run: function (A) {
    var c = A.canvas(); var balls = [], sent = 0, saved = 0, done = 0, nextT = 0.4;
    A.loop(function (dt) { nextT -= dt; if (nextT <= 0 && sent < 12) { sent++; balls.push({ x: mgRnd(60, 280), y: 250, tx: mgRnd(50, 290), ty: mgRnd(30, 110), t: 0, sp: 0.5 + sent * 0.04 }); nextT = mgRnd(0.55, 1.0); } A.pitch(); A.goal(30, 20, 280, 110); balls.forEach(function (b) { b.t += dt * b.sp; A.ballAt(b.x + (b.tx - b.x) * b.t, b.y + (b.ty - b.y) * b.t, 9 + b.t * 7); }); balls = balls.filter(function (b) { if (b.t >= 1) { done++; A.miss(); A.info('Gehalten ' + saved + ' · Gegentore ' + (done - saved)); return false; } return true; }); if (done >= 12) { A.end(saved / 12); return false; } });
    c.onpointerdown = function (e) { var p = A.pt(e); for (var i = 0; i < balls.length; i++) { var b = balls[i], bx = b.x + (b.tx - b.x) * b.t, by = b.y + (b.ty - b.y) * b.t; if (Math.hypot(p.x - bx, p.y - by) < 26) { balls.splice(i, 1); saved++; done++; A.hit(); A.pow(saved / 12 * 1.1); A.info('Gehalten ' + saved + ' · Gegentore ' + (done - saved)); return; } } };
  } },
  lanes: { n: '🔶 Hütchen-Slalom', d: 'Tippe links, Mitte oder rechts, um den Hütchen auszuweichen. 20 Sekunden.', tags: 'kondition aussen mittelfeld', run: function (A) {
    var c = A.canvas(); var lane = 1, cones = [], t = 0, hits = 0, passed = 0, spawn = 0;
    A.loop(function (dt) { t += dt; spawn -= dt; if (spawn <= 0) { cones.push({ l: mgInt(0, 2), y: -20 }); spawn = Math.max(0.35, 0.9 - t * 0.03); } var sp = 170 + t * 9; A.pitch(); var x = A.cx; x.strokeStyle = 'rgba(255,255,255,.3)'; [113, 226].forEach(function (lx) { x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx, A.H); x.stroke(); }); cones.forEach(function (k) { k.y += sp * dt; x.fillStyle = '#f0954b'; x.beginPath(); x.moveTo(56 + k.l * 113, k.y - 14); x.lineTo(44 + k.l * 113, k.y + 10); x.lineTo(68 + k.l * 113, k.y + 10); x.fill(); }); cones = cones.filter(function (k) { if (k.y > 215 && k.y < 245 && k.l === lane && !k.hit) { k.hit = true; hits++; A.miss(); } if (k.y > A.H + 20) { if (!k.hit) passed++; return false; } return true; }); A.man(56 + lane * 113, 230, '#8fc852'); var sc = passed / Math.max(1, passed + hits * 2.5); A.pow(sc * Math.min(1, t / 20)); A.info('Ausgewichen ' + passed + ' · Kontakte ' + hits); if (t >= 20) { A.end(sc); return false; } });
    c.onpointerdown = function (e) { var p = A.pt(e); lane = p.x < 113 ? 0 : p.x < 226 ? 1 : 2; };
  } },
  pass: { n: '👟 Freier Mann', d: 'Tippe den freien Mitspieler (grün) an – nicht die Gegner (rot). 10 Pässe.', tags: 'mittelfeld taktik aussen', run: function (A) {
    var c = A.canvas(); var round = 0, pts = 0, spots = [], tLeft = 0;
    var newR = function () { round++; spots = []; var n = Math.min(9, 4 + round); for (var i = 0; i < n; i++) spots.push({ x: mgRnd(30, 310), y: mgRnd(40, 230), own: i === 0 }); tLeft = Math.max(0.9, 2.2 - round * 0.12); };
    newR();
    A.loop(function (dt) { tLeft -= dt; if (tLeft <= 0) { A.miss(); if (round >= 10) { A.end(pts / 10); return false; } newR(); } A.pitch(); spots.forEach(function (s) { A.man(s.x, s.y, s.own ? '#8fc852' : '#e25c5c'); }); A.text('Pass ' + round + '/10', 10, 20, 14); });
    c.onpointerdown = function (e) { var p = A.pt(e); var s = spots.filter(function (q) { return Math.hypot(q.x - p.x, q.y - p.y) < 22; })[0]; if (!s) return; if (s.own) { pts++; A.hit(); } else A.miss(); A.pow(pts / 10 * 1.1); A.info('Angekommen ' + pts + '/' + round); if (round >= 10) return A.end(pts / 10); newR(); };
  } },
  header: { n: '🙆 Kopfball-Timing', d: 'Tippe genau dann, wenn der Ball im Kreis über dem Kopf ist. 6 Flanken.', tags: 'sturm abwehr standards', run: function (A) {
    var c = A.canvas(); var n = 0, pts = 0, b = null, px = 0;
    var launch = function () { n++; px = mgRnd(140, 280); b = { t: 0, sp: 0.55 + n * 0.08 }; };
    launch();
    A.loop(function (dt) { A.pitch(); b.t += dt * b.sp; var bx = 20 + (px - 20) * b.t, by = 200 - Math.sin(b.t * Math.PI * 0.62) * 170; A.man(px, 215, '#8fc852', 13); var x = A.cx; x.strokeStyle = '#fff'; x.setLineDash([4, 4]); x.beginPath(); x.arc(px, 172, 20, 0, 7); x.stroke(); x.setLineDash([]); A.ballAt(bx, by, 10); if (b.t > 1.15) { A.miss(); next(); } });
    var next = function () { if (n >= 6) return A.end(pts / 6); launch(); };
    c.onpointerdown = function () { var bx = 20 + (px - 20) * b.t, by = 200 - Math.sin(b.t * Math.PI * 0.62) * 170; var d = Math.hypot(bx - px, by - 172); var p = d < 30 ? 1 - d / 45 : 0; pts += p; p ? A.hit() : A.miss(); A.pow(pts / 6 * 1.2); A.info('Flanke ' + n + '/6 · ' + (p ? 'Kopfball!' : 'verpasst')); next(); };
  } },
  sprint: { n: '🏃 Sprint', d: 'Tippe so schnell du kannst! 6 Sekunden – Ziel: 45 Schritte.', tags: 'kondition', run: function (A) {
    var c = A.canvas(); var taps = 0, t = 0, started = false;
    A.loop(function (dt) { if (started) t += dt; A.pitch(); var x = A.cx; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(310, 0, 4, A.H); var px = 20 + Math.min(1, taps / 45) * 280; A.man(px, 150, '#8fc852', 14); A.text(started ? (6 - t).toFixed(1) + ' s' : 'Tippe zum Start!', 170, 40, 22, '#fff', 'center'); A.text(taps + ' Schritte', 170, 240, 16, '#fff', 'center'); if (t >= 6) { A.end(taps / 45); return false; } });
    c.onpointerdown = function () { started = true; taps++; A.pow(taps / 45); if (taps % 4 === 0) beep(600, 0.03, 'square', 0.02); };
  } },
  simon: { n: '🧠 Taktik-Memory', d: 'Positionen leuchten nacheinander auf – tippe sie in derselben Reihenfolge nach.', tags: 'taktik mittelfeld', run: function (A) {
    var g = A.grid(9, 3, 62, function (i) { return ['LV', 'IV', 'RV', 'LM', 'ZM', 'RM', 'LA', 'ST', 'RA'][i]; }); var seq = [], inp = 0, best = 0, showing = true, lives = 2;
    var flash = function (i, col) { var el = g.children[i]; el.style.background = col; A.t(function () { el.style.background = 'rgba(255,255,255,.08)'; }, 380); };
    var play = function () { showing = true; seq.push(mgInt(0, 8)); inp = 0; A.info('Merken … Länge ' + seq.length); seq.forEach(function (s, k) { A.t(function () { flash(s, '#8fc852'); beep(400 + s * 60, 0.12, 'triangle', 0.04); }, 600 + k * 560); }); A.t(function () { showing = false; A.info('Jetzt du! (' + seq.length + ')'); }, 600 + seq.length * 560); };
    g.onpointerdown = function (e) { var el = e.target.closest('[data-i]'); if (!el || showing || !A.alive) return; var i = +el.getAttribute('data-i'); if (i === seq[inp]) { flash(i, '#fff'); inp++; if (inp >= seq.length) { best = seq.length; A.pow(best / 7); if (best >= 7) return A.end(1); A.t(play, 500); } } else { flash(i, '#e25c5c'); A.miss(); lives--; if (lives <= 0) return A.end(best / 7); seq.pop(); A.t(play, 700); } };
    play();
  } },
  numbers: { n: '🔢 Rückennummern', d: 'Tippe die Nummern 1 bis 12 der Reihe nach – so schnell wie möglich.', tags: 'taktik torwart mittelfeld', run: function (A) {
    var nums = []; for (var i = 1; i <= 12; i++) nums.push(i); nums.sort(function () { return Math.random() - 0.5; }); var g = A.grid(12, 4, 54, function (i) { return nums[i]; }); var nx = 1, t0 = Date.now(), err = 0;
    g.onpointerdown = function (e) { var el = e.target.closest('[data-i]'); if (!el || !A.alive) return; var v = nums[+el.getAttribute('data-i')]; if (v === nx) { el.style.background = '#8fc852'; el.style.color = '#14200c'; nx++; A.hit(); A.pow((nx - 1) / 12); if (nx > 12) { var s = (Date.now() - t0) / 1000; return A.end(mgClamp(1.25 - s / 16 - err * 0.05)); } } else { err++; A.miss(); } A.info('Nächste: ' + nx + ' · Fehler ' + err); };
    A.info('Nächste: 1');
  } },
  gonogo: { n: '🟢 Go / No-Go', d: 'Tippe nur grüne Trikots an. Rote Trikots NICHT antippen! 20 Erscheinungen.', tags: 'all', run: function (A) {
    mgWhackGo(A);
  } },
  cross: { n: '📐 Flanke', d: 'Tippe, wenn das Fadenkreuz über dem Stürmer ist. 7 Flanken.', tags: 'aussen sturm', run: function (A) {
    var c = A.canvas(); var n = 0, pts = 0, cx0 = 40, cd = 1, sx = 200, sd = -1, csp = 200, ssp = 60;
    A.loop(function (dt) { cx0 += cd * csp * dt; if (cx0 > 310) cd = -1; if (cx0 < 30) cd = 1; sx += sd * ssp * dt; if (sx > 300) sd = -1; if (sx < 40) sd = 1; A.pitch(); A.goal(90, 10, 160, 40); A.man(sx, 120, '#8fc852', 13); var x = A.cx; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(cx0, 112, 16, 0, 7); x.moveTo(cx0 - 24, 112); x.lineTo(cx0 + 24, 112); x.moveTo(cx0, 88); x.lineTo(cx0, 136); x.stroke(); A.text('Flanke ' + (n + 1) + '/7', 10, 245, 13); });
    c.onpointerdown = function () { if (!A.alive) return; n++; var d = Math.abs(cx0 - sx); var p = d < 22 ? 1 - d / 32 : 0; pts += p; p ? A.hit() : A.miss(); A.pow(pts / 7 * 1.2); A.info(p ? 'Perfekte Flanke!' : 'zu ungenau'); csp += 22; ssp += 12; if (n >= 7) A.end(pts / 7); };
  } },
  freekick: { n: '🌀 Freistoß', d: 'Erst die Kraft stoppen (grüner Bereich), dann die Richtung. 4 Freistöße.', tags: 'standards sturm', run: function (A) {
    var c = A.canvas(); var stage = 0, v = 0, dir = 1, kick = 0, pts = 0, pow = 0;
    A.loop(function (dt) { v += dir * dt * (1.2 + kick * 0.25); if (v > 1) { v = 1; dir = -1; } if (v < 0) { v = 0; dir = 1; } A.pitch(); A.goal(70, 20, 200, 70); var x = A.cx; for (var i = 0; i < 4; i++) A.man(130 + i * 26, 150, '#e25c5c', 9); A.ballAt(170, 230, 10); if (stage === 0) { x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(20, 60, 18, 160); x.fillStyle = 'rgba(143,200,82,.9)'; x.fillRect(20, 60 + 160 * 0.15, 18, 160 * 0.2); x.fillStyle = '#fff'; x.fillRect(16, 60 + 160 * (1 - v) - 2, 26, 5); A.text('KRAFT', 10, 50, 11); } else { var ang = -Math.PI / 2 + (v - 0.5) * 1.6; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(170, 230); x.lineTo(170 + Math.cos(ang) * 90, 230 + Math.sin(ang) * 90); x.stroke(); x.fillStyle = 'rgba(143,200,82,.35)'; x.fillRect(90, 20, 50, 70); x.fillRect(200, 20, 50, 70); A.text('RICHTUNG – in die Ecken!', 170, 250, 11, '#fff', 'center'); } });
    c.onpointerdown = function () { if (!A.alive) return; if (stage === 0) { var pv = 1 - v; pow = pv >= 0.65 && pv <= 0.85 ? 1 : pv >= 0.55 && pv <= 0.95 ? 0.5 : 0; stage = 1; v = 0.5; A.hit(); return; } var corner = Math.abs(v - 0.5) > 0.22 && Math.abs(v - 0.5) < 0.45 ? 1 : Math.abs(v - 0.5) <= 0.22 ? 0.3 : 0; var p = pow * corner; pts += p; kick++; p >= 0.5 ? A.hit() : A.miss(); A.pow(pts / 4 * 1.2); A.info('Freistoß ' + kick + '/4 · ' + (p >= 1 ? 'TOR in den Winkel!' : p >= 0.3 ? 'knapp' : 'drüber/vorbei')); stage = 0; if (kick >= 4) A.end(pts / 4); };
  } },
  rhythm: { n: '🥁 Dribbel-Rhythmus', d: 'Tippe genau dann, wenn ein Ball die weiße Linie erreicht. 16 Ballkontakte.', tags: 'mittelfeld aussen kondition', run: function (A) {
    var c = A.canvas(); var notes = [], spawned = 0, hits = 0, done = 0, t = 0, nextT = 0.5;
    A.loop(function (dt) { t += dt; nextT -= dt; if (nextT <= 0 && spawned < 16) { spawned++; notes.push({ x: A.W + 10 }); nextT = mgRnd(0.45, 0.9); } A.pitch(); var x = A.cx; x.fillStyle = '#fff'; x.fillRect(78, 60, 4, 140); notes.forEach(function (n) { n.x -= 160 * dt; A.ballAt(n.x, 130, 12); }); notes = notes.filter(function (n) { if (n.x < 40) { done++; A.miss(); return false; } return true; }); A.info('Kontakte ' + hits + '/16'); if (done >= 16) { A.end(hits / 16); return false; } });
    c.onpointerdown = function () { if (!A.alive) return; var best = null; notes.forEach(function (n) { if (!best || Math.abs(n.x - 80) < Math.abs(best.x - 80)) best = n; }); if (best && Math.abs(best.x - 80) < 22) { notes.splice(notes.indexOf(best), 1); hits++; done++; A.hit(); A.pow(hits / 16 * 1.1); } else A.miss(); };
  } },
  count: { n: '👀 Überblick', d: 'Wie viele Gegner (rot) waren kurz zu sehen? 5 Runden.', tags: 'taktik mittelfeld abwehr', run: function (A) {
    mgQuiz(A, { n: 5, gen: function (r) { var k = mgInt(3 + r, 6 + r), dots = ''; for (var i = 0; i < k; i++) dots += '<span style="position:absolute;left:' + mgRnd(5, 92) + '%;top:' + mgRnd(5, 85) + '%;width:16px;height:16px;border-radius:50%;background:#e25c5c"></span>'; for (var j = 0; j < 4; j++) dots += '<span style="position:absolute;left:' + mgRnd(5, 92) + '%;top:' + mgRnd(5, 85) + '%;width:16px;height:16px;border-radius:50%;background:#8fc852"></span>'; var opts = [k - 1, k, k + 1, k + 2].sort(function () { return Math.random() - 0.5; }); return { show: dots, ask: 'Wie viele rote Gegner?', opts: opts.map(String), ok: opts.indexOf(k), hideAfter: Math.max(700, 1400 - r * 120) }; } });
  } },
  arrows: { n: '↔️ Konter-Entscheidung', d: 'Ein Pfeil zeigt die Laufrichtung – tippe schnell den passenden Knopf. 15 Pfeile.', tags: 'all', run: function (A) {
    A.box.innerHTML = '<div id="mga" style="height:170px;border-radius:12px;background:#2f7a2c;display:grid;place-items:center;font-size:80px;color:#fff"></div>'; var cur = 0, n = 0, pts = 0, t0 = 0, tm; var AR = ['⬅️', '⬆️', '➡️'];
    var nx = function () { if (n >= 15) return A.end(pts / 15); n++; cur = mgInt(0, 2); $('#mga').textContent = AR[cur]; t0 = Date.now(); clearTimeout(tm); tm = A.t(function () { A.miss(); nx(); }, Math.max(700, 1500 - n * 50)); A.info('Pfeil ' + n + '/15'); };
    A.buttons(['⬅️ Links', '⬆️ Mitte', '➡️ Rechts'], function (i) { if (!A.alive) return; clearTimeout(tm); if (i === cur) { var rt = Date.now() - t0; pts += rt < 600 ? 1 : 0.7; A.hit(); } else A.miss(); A.pow(pts / 15 * 1.1); nx(); });
    A.t(nx, 400);
  } },
  offside: { n: '🚩 Abseitsfalle', d: 'Tippe, wenn der Stürmer (grün) gerade hinter der Abwehrlinie steht. 7 Versuche.', tags: 'abwehr taktik', run: function (A) {
    var c = A.canvas(); var line = 170, at = 60, ad = 1, sp = 90, n = 0, pts = 0;
    A.loop(function (dt) { at += ad * sp * dt; if (at > 280) ad = -1; if (at < 60) ad = 1; A.pitch(); var x = A.cx; x.strokeStyle = '#f0c24b'; x.setLineDash([6, 5]); x.lineWidth = 2; x.beginPath(); x.moveTo(line, 0); x.lineTo(line, A.H); x.stroke(); x.setLineDash([]); [50, 110, 170, 220].forEach(function (yy) { A.man(line - 12, yy, '#e25c5c', 10); }); A.man(at, 140, '#8fc852', 11); A.text('➡ Tor', 300, 20, 12); });
    c.onpointerdown = function () { if (!A.alive) return; n++; var d = at - line; var p = d > 0 && d < 30 ? 1 - d / 40 : 0; pts += p; p ? A.hit() : A.miss(); A.pow(pts / 7 * 1.2); A.info('Versuch ' + n + '/7 · ' + (p ? 'Abseits! 🚩' : 'kein Abseits')); line = mgRnd(120, 220); sp += 18; if (n >= 7) A.end(pts / 7); };
  } },
  catchb: { n: '🦶 Ballannahme', d: 'Bewege den Fuß mit dem Finger/der Maus und nimm die fallenden Bälle an. 15 Bälle.', tags: 'mittelfeld aussen torwart', run: function (A) {
    var c = A.canvas(); var fx = 170, balls = [], sent = 0, got = 0, done = 0, nt = 0.3;
    A.loop(function (dt) { nt -= dt; if (nt <= 0 && sent < 15) { sent++; balls.push({ x: mgRnd(20, 320), y: -10, v: 90 + sent * 9 }); nt = mgRnd(0.6, 1.1); } A.pitch(); balls.forEach(function (b) { b.y += b.v * dt; A.ballAt(b.x, b.y, 10); }); var x = A.cx; x.fillStyle = '#222'; x.fillRect(fx - 30, 232, 60, 12); x.fillStyle = '#8fc852'; x.fillRect(fx - 30, 228, 60, 5); balls = balls.filter(function (b) { if (b.y > 226 && b.y < 246 && Math.abs(b.x - fx) < 36) { got++; done++; A.hit(); A.pow(got / 15 * 1.1); return false; } if (b.y > A.H + 10) { done++; A.miss(); return false; } return true; }); A.info('Angenommen ' + got + '/' + done); if (done >= 15) { A.end(got / 15); return false; } });
    var mv = function (e) { fx = Math.max(30, Math.min(310, A.pt(e).x)); }; c.onpointermove = mv; c.onpointerdown = mv;
  } },
  torwand: { n: '🎯 Torwand', d: 'Die Löcher der Torwand leuchten auf – tippe das leuchtende Loch. 10 Schüsse.', tags: 'sturm standards', run: function (A) {
    mgWhack(A, { cells: 6, cols: 3, rowH: 80, n: 10, life: 1000, speedup: 30, col: '#1d5fa8', lit: '<span style="font-size:30px">⚽</span>', label: 'Schuss', cellHtml: function () { return '<span style="width:46px;height:46px;border-radius:50%;background:#14200c;display:block"></span>'; } });
  } },
  stamina: { n: '🫀 Ausdauerlauf', d: 'Halte gedrückt zum Laufen. Lass los, bevor der Puls im roten Bereich ist. 15 Sekunden.', tags: 'kondition', run: function (A) {
    var c = A.canvas(); var hold = false, pulse = 0.3, dist = 0, t = 0, over = 0;
    A.loop(function (dt) { t += dt; if (hold) { pulse += dt * 0.32; dist += dt * (1 + pulse); } else pulse = Math.max(0.2, pulse - dt * 0.28); if (pulse > 0.9) { over += dt; pulse = Math.min(1, pulse); } A.pitch(); var x = A.cx; x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(300, 30, 22, 200); var gr = x.createLinearGradient(0, 230, 0, 30); gr.addColorStop(0, '#8fc852'); gr.addColorStop(0.7, '#f0c24b'); gr.addColorStop(0.9, '#e25c5c'); x.fillStyle = gr; x.fillRect(300, 230 - 200 * pulse, 22, 200 * pulse); A.man(30 + (dist * 9) % 250, 150, '#8fc852', 13); A.text((15 - t).toFixed(1) + ' s', 20, 30, 18); A.text('Strecke ' + Math.round(dist * 40) + ' m', 20, 240, 14); var sc = mgClamp(dist / 22 - over * 0.12); A.pow(sc); if (t >= 15) { A.end(sc); return false; } });
    c.onpointerdown = function () { hold = true; }; c.onpointerup = c.onpointerleave = function () { hold = false; };
  } },
  whistle: { n: '📣 Anpfiff-Reaktion', d: 'Warte auf GRÜN und tippe sofort. Zu früh getippt = Fehlstart. 5 Runden.', tags: 'all', run: function (A) {
    A.box.innerHTML = '<div id="mgw" style="height:230px;border-radius:12px;background:#a33;display:grid;place-items:center;color:#fff;font-weight:800;font-size:24px;cursor:pointer;user-select:none;touch-action:manipulation">Warten …</div>'; var w = $('#mgw'), r = 0, green = false, t0 = 0, pts = 0, tm;
    var nx = function () { if (r >= 5) return A.end(pts / 5); r++; green = false; w.style.background = '#a33'; w.textContent = 'Warten … (' + r + '/5)'; tm = A.t(function () { green = true; t0 = Date.now(); w.style.background = '#3f9a32'; w.textContent = 'JETZT!'; beep(1200, 0.12, 'triangle', 0.05); }, mgRnd(900, 2600)); };
    w.onpointerdown = function () { if (!A.alive) return; if (!green) { clearTimeout(tm); A.miss(); w.textContent = 'Fehlstart!'; A.t(nx, 700); return; } var rt = Date.now() - t0; var p = mgClamp((650 - rt) / 400); pts += p; A.hit(); w.textContent = rt + ' ms'; A.pow(pts / 5 * 1.2); A.info('Reaktion ' + rt + ' ms'); green = false; A.t(nx, 700); };
    A.t(nx, 300);
  } },
  formation: { n: '📋 Taktiktafel', d: 'Welche Formation siehst du? 5 Fragen.', tags: 'taktik', run: function (A) {
    var F = { '4-4-2': [4, 4, 2], '4-3-3': [4, 3, 3], '3-5-2': [3, 5, 2], '4-5-1': [4, 5, 1], '5-3-2': [5, 3, 2], '3-4-3': [3, 4, 3], '4-2-3-1': [4, 2, 3, 1], '5-4-1': [5, 4, 1] }; var keys = Object.keys(F);
    mgQuiz(A, { n: 5, gen: function () { var k = keys[mgInt(0, keys.length - 1)], rows = F[k], dots = '<span style="position:absolute;left:47%;bottom:6%;width:16px;height:16px;border-radius:50%;background:#f0c24b"></span>'; rows.forEach(function (n, ri) { for (var i = 0; i < n; i++) dots += '<span style="position:absolute;left:' + ((i + 1) / (n + 1) * 100 - 3) + '%;bottom:' + (20 + ri * (68 / rows.length)) + '%;width:16px;height:16px;border-radius:50%;background:#8fc852"></span>'; }); var opts = [k]; while (opts.length < 4) { var o = keys[mgInt(0, keys.length - 1)]; if (opts.indexOf(o) < 0) opts.push(o); } opts.sort(function () { return Math.random() - 0.5; }); return { show: dots, ask: 'Welche Formation?', opts: opts, ok: opts.indexOf(k) }; } });
  } },
  ring: { n: '⭕ Ring-Timing', d: 'Der Ring schrumpft – tippe, wenn er genau auf dem Ball liegt. 8 Versuche.', tags: 'sturm standards torwart', run: function (A) {
    var c = A.canvas(); var r = 120, n = 0, pts = 0, sp = 110, bx = 170, by = 130;
    A.loop(function (dt) { r -= sp * dt; if (r < 4) { A.miss(); nx(0); } A.pitch(); A.ballAt(bx, by, 16); var x = A.cx; x.strokeStyle = Math.abs(r - 18) < 6 ? '#8fc852' : '#fff'; x.lineWidth = 4; x.beginPath(); x.arc(bx, by, Math.max(2, r), 0, 7); x.stroke(); });
    var nx = function (p) { n++; pts += p; A.pow(pts / 8 * 1.2); A.info('Versuch ' + n + '/8'); if (n >= 8) return A.end(pts / 8); r = 120; sp += 20; bx = mgRnd(60, 280); by = mgRnd(60, 200); };
    c.onpointerdown = function () { if (!A.alive) return; var d = Math.abs(r - 18); var p = d < 10 ? 1 - d / 14 : 0; p ? A.hit() : A.miss(); nx(p); };
  } },
  volley: { n: '💥 Volley', d: 'Der Ball fällt – tippe genau, wenn er die Schusslinie erreicht. 8 Volleys.', tags: 'sturm aussen', run: function (A) {
    var c = A.canvas(); var by = -10, v = 0, n = 0, pts = 0, bx = 170, lineY = 200;
    A.loop(function (dt) { v += 500 * dt; by += v * dt; if (by > A.H + 20) { A.miss(); nx(0); } A.pitch(); var x = A.cx; x.fillStyle = 'rgba(255,255,255,.65)'; x.fillRect(0, lineY - 2, A.W, 4); A.ballAt(bx, by, 12); A.man(bx - 30, 222, '#8fc852', 12); });
    var nx = function (p) { n++; pts += p; A.pow(pts / 8 * 1.2); A.info('Volley ' + n + '/8'); if (n >= 8) return A.end(pts / 8); by = -10; v = mgRnd(0, 60) + n * 15; bx = mgRnd(80, 280); lineY = mgRnd(170, 215); };
    c.onpointerdown = function () { if (!A.alive) return; var d = Math.abs(by - lineY); var p = d < 18 ? 1 - d / 26 : 0; p ? A.hit() : A.miss(); nx(p); };
  } },
  jersey: { n: '👕 Trikots merken', d: 'Merke dir die gezeigten Rückennummern und tippe dann die richtige an. 5 Runden.', tags: 'taktik mittelfeld torwart', run: function (A) {
    mgQuiz(A, { n: 5, gen: function (r) { var nums = []; while (nums.length < 2 + Math.ceil(r / 2)) { var k = mgInt(1, 33); if (nums.indexOf(k) < 0) nums.push(k); } var show = '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">' + nums.map(function (k) { return '<div style="width:56px;height:62px;border-radius:10px 10px 6px 6px;background:#14200c;color:#8fc852;display:grid;place-items:center;font-size:24px;font-weight:800">' + k + '</div>'; }).join('') + '</div>'; var target = nums[mgInt(0, nums.length - 1)], opts = [target]; while (opts.length < 4) { var o = mgInt(1, 33); if (nums.indexOf(o) < 0 && opts.indexOf(o) < 0) opts.push(o); } opts.sort(function () { return Math.random() - 0.5; }); return { show: show, ask: 'Welche Nummer war dabei?', opts: opts.map(String), ok: opts.indexOf(target), hideAfter: 1300 }; } });
  } },
  corner: { n: '🚩 Eckball', d: 'Tippe, wenn der Ball über dem grünen Mitspieler ist. 6 Ecken.', tags: 'standards abwehr sturm', run: function (A) {
    var c = A.canvas(); var n = 0, pts = 0, t = 0, px = 200, py = 110, sp = 0.5;
    A.loop(function (dt) { t += dt * sp; var bx = 10 + t * 330, by = 240 - Math.sin(t * Math.PI) * 200 + t * 40; if (t > 1.05) { A.miss(); nx(0); } A.pitch(); A.goal(100, 4, 140, 26); A.man(px, py, '#8fc852', 12); A.man(px + 34, py + 20, '#e25c5c', 11); A.man(px - 50, py - 10, '#e25c5c', 11); A.ballAt(bx, by, 9); });
    var nx = function (p) { n++; pts += p; A.pow(pts / 6 * 1.2); A.info('Ecke ' + n + '/6'); if (n >= 6) return A.end(pts / 6); t = 0; sp += 0.07; px = mgRnd(110, 290); py = mgRnd(70, 160); };
    c.onpointerdown = function () { if (!A.alive) return; var bx = 10 + t * 330, by = 240 - Math.sin(t * Math.PI) * 200 + t * 40; var d = Math.hypot(bx - px, by - py); var p = d < 32 ? 1 - d / 44 : 0; p ? A.hit() : A.miss(); nx(p); };
  } },
  throwout: { n: '🧤 Abwurf', d: 'Tippe einen Mitspieler (grün) an, wenn kein Gegner in seiner Nähe ist. 8 Abwürfe.', tags: 'torwart taktik', run: function (A) {
    var c = A.canvas(); var n = 0, pts = 0, men = [];
    for (var i = 0; i < 3; i++) men.push({ x: mgRnd(40, 300), y: 60 + i * 60, d: Math.random() < 0.5 ? 1 : -1, sp: mgRnd(50, 90), own: true });
    for (var j = 0; j < 4; j++) men.push({ x: mgRnd(40, 300), y: 50 + j * 45, d: Math.random() < 0.5 ? 1 : -1, sp: mgRnd(60, 110), own: false });
    A.loop(function (dt) { A.pitch(); men.forEach(function (m) { m.x += m.d * m.sp * dt; if (m.x > 320) m.d = -1; if (m.x < 20) m.d = 1; A.man(m.x, m.y, m.own ? '#8fc852' : '#e25c5c', 11); }); A.man(170, 240, '#f0c24b', 12); A.text('Abwurf ' + Math.min(8, n + 1) + '/8', 10, 20, 13); });
    c.onpointerdown = function (e) { if (!A.alive) return; var p = A.pt(e); var m = men.filter(function (q) { return q.own && Math.hypot(q.x - p.x, q.y - p.y) < 24; })[0]; if (!m) return; n++; var near = men.filter(function (q) { return !q.own && Math.hypot(q.x - m.x, q.y - m.y) < 45; }).length; var ok = near === 0 ? 1 : 0; pts += ok; ok ? A.hit() : A.miss(); A.pow(pts / 8 * 1.2); A.info(ok ? 'Abwurf kommt an!' : 'abgefangen'); men.forEach(function (q) { q.sp += 6; }); if (n >= 8) A.end(pts / 8); };
  } },
  wall: { n: '🧱 Wandpass', d: 'Der Ball prallt von der Wand zurück – tippe, wenn er in der grünen Zone ist. Es wird schneller!', tags: 'mittelfeld aussen kondition', run: function (A) {
    var c = A.canvas(); var bx = 60, dir = 1, sp = 160, hits = 0, misses = 0, waiting = false;
    A.loop(function (dt) { bx += dir * sp * dt; if (bx > 300) { dir = -1; bx = 300; beep(300, 0.03, 'square', 0.02); } if (bx < 30) { misses++; A.miss(); dir = 1; bx = 60; if (misses >= 3) { A.end(hits / 16); return false; } } A.pitch(); var x = A.cx; x.fillStyle = '#9a8f80'; x.fillRect(310, 30, 24, 200); x.fillStyle = 'rgba(143,200,82,.35)'; x.fillRect(40, 30, 60, 200); A.ballAt(bx, 130, 12); A.man(26, 150, '#8fc852', 12); A.text('Pässe ' + hits + ' · Fehler ' + misses + '/3', 110, 22, 13); if (hits >= 16) { A.end(1); return false; } });
    c.onpointerdown = function () { if (!A.alive) return; if (dir === -1 && bx >= 40 && bx <= 100) { hits++; dir = 1; sp += 14; A.hit(); A.pow(hits / 16); } else { misses++; A.miss(); if (misses >= 3) A.end(hits / 16); } };
  } },
  collect: { n: '⚽ Bälle einsammeln', d: 'Bewege den Spieler mit Finger/Maus: Bälle einsammeln, rote Hütchen meiden. 18 Sekunden.', tags: 'kondition aussen mittelfeld', run: function (A) {
    var c = A.canvas(); var me = { x: 170, y: 200 }, items = [], t = 0, got = 0, bad = 0, sp = 0;
    A.loop(function (dt) { t += dt; sp -= dt; if (sp <= 0) { items.push({ x: mgRnd(20, 320), y: -10, b: Math.random() < 0.3, v: mgRnd(80, 140) + t * 6 }); sp = mgRnd(0.3, 0.6); } A.pitch(); items.forEach(function (it) { it.y += it.v * dt; if (it.b) { var x = A.cx; x.fillStyle = '#e25c5c'; x.beginPath(); x.moveTo(it.x, it.y - 12); x.lineTo(it.x - 10, it.y + 8); x.lineTo(it.x + 10, it.y + 8); x.fill(); } else A.ballAt(it.x, it.y, 9); }); A.man(me.x, me.y, '#8fc852', 13); items = items.filter(function (it) { if (Math.hypot(it.x - me.x, it.y - me.y) < 22) { if (it.b) { bad++; A.miss(); } else { got++; A.hit(); } return false; } return it.y < A.H + 20; }); var sc = mgClamp((got - bad * 2) / 22); A.pow(sc); A.info('Bälle ' + got + ' · Hütchen ' + bad); A.text((18 - t).toFixed(1) + ' s', 10, 20, 14); if (t >= 18) { A.end(sc); return false; } });
    var mv = function (e) { var p = A.pt(e); me.x = Math.max(15, Math.min(325, p.x)); me.y = Math.max(140, Math.min(245, p.y)); }; c.onpointermove = mv; c.onpointerdown = mv;
  } },
  moles: { n: '🔶 Hütchen-Jagd', d: 'Hütchen tauchen auf und verschwinden immer schneller – tippe sie an. 14 Hütchen.', tags: 'all', run: function (A) {
    mgWhack(A, { cells: 12, cols: 4, rowH: 56, n: 14, life: 1000, speedup: 40, minLife: 420, col: 'rgba(240,149,75,.35)', lit: '<span style="font-size:28px">🔶</span>', label: 'Hütchen' });
  } },
  seq: { n: '🔁 Passfolge', d: 'Zahlen erscheinen kurz auf dem Feld – tippe sie danach in aufsteigender Reihenfolge. 4 Runden.', tags: 'taktik mittelfeld', run: function (A) {
    var round = 0, pts = 0;
    var go = function () {
      if (round >= 4) return A.end(pts / 4); round++; var k = 3 + round, cells = 16, pos = []; while (pos.length < k) { var p = mgInt(0, cells - 1); if (pos.indexOf(p) < 0) pos.push(p); }
      var g = A.grid(cells, 4, 54, function (i) { var j = pos.indexOf(i); return j >= 0 ? (j + 1) : ''; }); var nx = 1, hidden = false; A.info('Merken … Runde ' + round + '/4');
      A.t(function () { hidden = true; [].forEach.call(g.children, function (el) { el.textContent = ''; }); A.info('Jetzt der Reihe nach tippen!'); }, 900 + k * 220);
      g.onpointerdown = function (e) { var el = e.target.closest('[data-i]'); if (!el || !hidden || !A.alive) return; var i = +el.getAttribute('data-i'); if (pos[nx - 1] === i) { el.style.background = '#8fc852'; el.textContent = nx; nx++; A.hit(); if (nx > k) { pts++; A.pow(pts / 4 * 1.1); A.t(go, 500); } } else { el.style.background = '#e25c5c'; A.miss(); hidden = false; A.pow(pts / 4 * 1.1); A.t(go, 600); } };
    };
    go();
  } },
  dive: { n: '🦘 Torwart-Sprung', d: 'Der Schütze läuft an – tippe auf die Seite, in die er schießt (der Pfeil zeigt es kurz). 8 Schüsse.', tags: 'torwart', run: function (A) {
    A.box.innerHTML = '<div id="mgd" style="height:170px;border-radius:12px;background:#2f7a2c;position:relative;overflow:hidden"></div>'; var n = 0, pts = 0, side = 0, open = false, tm, t0 = 0;
    var nx = function () { if (n >= 8) return A.end(pts / 8); n++; side = mgInt(0, 2); open = false; $('#mgd').innerHTML = '<div style="position:absolute;left:10%;right:10%;top:12px;height:90px;border:4px solid #fff;border-bottom:none"></div><div style="position:absolute;bottom:12px;width:100%;text-align:center;color:#fff;font-weight:800">Anlauf …</div>'; A.info('Schuss ' + n + '/8'); tm = A.t(function () { open = true; t0 = Date.now(); $('#mgd').innerHTML += '<div style="position:absolute;top:40px;left:' + [18, 46, 74][side] + '%;font-size:40px">' + ['↖️', '⬆️', '↗️'][side] + '</div>'; tm = A.t(function () { if (open) { open = false; A.miss(); nx(); } }, Math.max(380, 750 - n * 40)); }, mgRnd(600, 1400)); };
    A.buttons(['↖️ Links', '⬆️ Mitte', '↗️ Rechts'], function (i) { if (!A.alive || !open) return; open = false; clearTimeout(tm); if (i === side) { pts++; A.hit(); } else A.miss(); A.pow(pts / 8 * 1.2); A.t(nx, 400); });
    A.t(nx, 300);
  } }
};
function mgWhackGo(A) {
  var g = A.grid(9, 3, 66); var n = 0, pts = 0, cur = -1, isGo = true, tm, N = 20, goCount = 0;
  var clear = function () { if (cur >= 0) { g.children[cur].style.background = 'rgba(255,255,255,.08)'; g.children[cur].textContent = ''; } };
  var nx = function () { clear(); if (n >= N) return A.end(mgClamp(pts / Math.max(1, goCount))); n++; cur = mgInt(0, 8); isGo = Math.random() < 0.65; if (isGo) goCount++; g.children[cur].style.background = isGo ? '#8fc852' : '#e25c5c'; g.children[cur].textContent = '👕'; A.info('Trikot ' + n + '/' + N); tm = A.t(function () { if (!isGo) pts += 0.3; else A.miss(); nx(); }, Math.max(550, 1000 - n * 20)); };
  g.onpointerdown = function (e) { var el = e.target.closest('[data-i]'); if (!el || !A.alive || +el.getAttribute('data-i') !== cur) return; clearTimeout(tm); if (isGo) { pts++; A.hit(); } else { pts -= 1; A.miss(); } A.pow(pts / Math.max(1, goCount)); nx(); };
  A.t(nx, 400);
}
function mgPick(t) {
  var keys = Object.keys(MGS), recent = (S && S.mgRecent) || [];
  var fit = keys.filter(function (k) { var tg = MGS[k].tags; return tg === 'all' || tg.split(' ').indexOf(t) >= 0; });
  var pool = fit.filter(function (k) { return recent.indexOf(k) < 0; }); if (pool.length < 3) pool = keys.filter(function (k) { return recent.indexOf(k) < 0; }); if (!pool.length) pool = keys;
  var k = pool[Math.floor(Math.random() * pool.length)]; if (S) { S.mgRecent = [k].concat(recent).slice(0, 12); uiFlag('mgRecent', S.mgRecent); } return k;
}
function mgStart(t, f, diff) {
  var g = mgPick(t); var G = MGS[g]; MG = { t: t, f: f, g: g, score: 0, done: false, diff: diff || null };
  pop('<div class="row sp" style="padding-right:26px"><h2 style="padding:0;margin:0">' + G.n + '</h2><span class="pill">' + (Object.keys(MGS).indexOf(g) + 1) + '/' + Object.keys(MGS).length + '</span></div><div class="small muted" style="margin-top:4px">' + esc(V.trainDefs[t][0]) + ' – ' + esc(f) + ' · ' + G.d + (MG.diff ? ' <span class="pill ' + (MG.diff === 'hard' ? 'r' : 'y') + '">' + (MG.diff === 'hard' ? 'Schwer' : 'Mittel') + '</span>' : '') + '</div>' +
    '<div style="display:flex;gap:10px;margin-top:12px;align-items:stretch"><div id="mgbox" style="flex:1;min-width:0"></div><div style="width:34px;display:flex;flex-direction:column;align-items:center;gap:4px"><span class="xs muted" style="font-weight:800">POWER</span><div style="flex:1;width:18px;border-radius:9px;background:rgba(0,0,0,.35);position:relative;overflow:hidden;min-height:180px"><i id="mgpowi" style="position:absolute;left:0;right:0;bottom:0;height:0;background:var(--r);transition:height .25s,background .25s;border-radius:9px"></i></div><b id="mgpowt" class="small">0</b></div></div>' +
    '<div class="row sp" style="margin-top:10px"><span class="small" id="mginfo"></span><span class="pill" id="mgtime">' + (MG.diff === 'hard' ? '9.0' : '10.5') + ' s</span><button class="pri" id="mggo" onclick="mgRun()">Los geht’s!</button></div>', { lock: true, y: (window.scrollY || 0) + 70 });
  $('#mgbox').innerHTML = '<div style="height:240px;border-radius:12px;background:#2f7a2c;display:grid;place-items:center;color:#fff;font-weight:800;font-size:40px">' + G.n.split(' ')[0] + '</div>';
}
function mgRun() { var b = $('#mggo'); if (b) b.style.display = 'none'; if (!MG.cd) { MG.cd = true; var box = $('#mgbox'), n = 3; var ov = document.createElement('div'); ov.className = 'mgcd'; ov.textContent = n; box.style.position = 'relative'; box.appendChild(ov); try { beep(660, .1, 'sine', .06); } catch (e) {} var iv = setInterval(function () { n--; if (n > 0) { ov.textContent = n; ov.style.animation = 'none'; void ov.offsetWidth; ov.style.animation = ''; try { beep(660, .1, 'sine', .06); } catch (e) {} } else { clearInterval(iv); ov.remove(); try { beep(990, .2, 'sine', .07); } catch (e) {} mgRun(); } }, 1000); return; } if (MGA) MGA.alive = false; MGA = mgApi(); var A0 = MGA; A0.pow(0.3); A0.lastPow = null; MGS[MG.g].run(A0); var lim = MG.diff === 'hard' ? 9000 : 10500; MG.tEnd = Date.now() + lim; var tick = setInterval(function () { if (!A0.alive) return clearInterval(tick); var left = Math.max(0, MG.tEnd - Date.now()); var e = $('#mgtime'); if (e) e.textContent = (left / 1000).toFixed(1) + ' s'; if (!left) { clearInterval(tick); A0.end(A0.lastPow != null ? A0.lastPow : 0.4); } }, 100); }
function mgEnd(score) {
  if (!MG || MG.done) return; MG.done = true; MG.score = mgClamp(score); var pct = Math.round(MG.score * 100);
  var verdict = pct >= 80 ? ['Überragend! Die Jungs ziehen voll mit.', 'var(--g)'] : pct >= 55 ? ['Gute Einheit.', 'var(--g)'] : pct >= 35 ? ['Durchwachsen – viel bleibt gleich.', 'var(--y)'] : ['Das war nichts – manche werden schlechter.', 'var(--r)'];
  $('#mgbox').innerHTML = '<div style="height:200px;border-radius:12px;background:var(--flaeche2);display:grid;place-items:center;text-align:center"><div><div style="font-size:44px;font-weight:800;color:' + verdict[1] + '">' + pct + ' %</div><div class="small">' + verdict[0] + '</div></div></div>';
  $('#mginfo').textContent = ''; var b = $('#mggo'); b.style.display = ''; b.textContent = MG.week ? 'Trainingswoche starten' : 'Ergebnis ansehen'; b.onclick = function () { if (MG.week) return weekSend(MG.t, MG.f, MG.diff, MG.score); trainSend(MG.t, MG.f, false, MG.score); }; if (pct >= 100) { rewardFx(window.innerWidth / 2, (window.scrollY || 0) + 220, true); xpFx(1, window.innerWidth / 2, (window.scrollY || 0) + 200); }
}
