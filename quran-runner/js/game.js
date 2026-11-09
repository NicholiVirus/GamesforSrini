/* Quran Runner — Pakistan Journey
 * game.js: the engine. A three-lane runner drawn on one canvas.
 * All content comes from QR.DATA (data.js); all pictures from QR.Art (art.js).
 */
(function () {
  'use strict';
  var QR = window.QR, D = QR.DATA, Art = QR.Art, Au = QR.Audio, S = D.str;
  var $ = function (id) { return document.getElementById(id); };
  var FONT = '"Noto Naskh Arabic","Geeza Pro","Segoe UI",Tahoma,Arial,sans-serif';
  var cv = $('game'), c = cv.getContext('2d');
  if (!c.roundRect) c.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); }; // older browsers
  var V = { w: 0, h: 0, dpr: 1, cx: 0, hy: 0, gy: 0, lane: 0, unit: 0 };
  var K = 0.085, ZFAR = 118, SPAWN_Z = 112, ZNEAR = -2.9, FLY_Y = 2.05;
  var qs = new URLSearchParams(location.search);
  var SECS = Math.max(5, +qs.get('secs') || D.sceneSeconds);
  var N = D.scenes.length;
  var TOTAL_WORDS = D.scenes.reduce(function (n, s) { return n + s.words.length; }, 0);
  function guests(sc) { return [sc.cameo, sc.cameo2].filter(Boolean); }
  var TOTAL_CAMEOS = D.scenes.reduce(function (n, s) { return n + guests(s).length; }, 0);

  /* ───────────────────────── SAVE ───────────────────────── */
  var SAVE_KEY = 'quran-runner-pk-v1';
  function freshSave() {
    return { last: 0, coins: 0, best: 0, done: {}, items: {}, cameos: {}, words: {}, badges: {}, upg: { power: 0, magnet: 0, heart: 0, value: 0 }, robe: 0, cap: 'kufi', ownRobes: [0], ownCaps: ['kufi'], sound: 'full', played: false };
  }
  function loadSave() {
    try {
      var s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === 'object') { var f = freshSave(); for (var k in f) if (s[k] === undefined) s[k] = f[k]; return s; }
    } catch (e) { /* storage blocked: play without saving */ }
    return freshSave();
  }
  var save = loadSave();
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
  function unlocked(i) { return i === 0 || i === 10 || !!save.done[D.scenes[i - 1].id]; }
  function count(o) { return Object.keys(o).length; }

  /* ───────────────────────── STATE ───────────────────────── */
  var G = {
    state: 'title', idx: 0, sc: D.scenes[0], part: D.parts[0], t: 0, st: 0, dist: 0, scroll: 0, speed: 0, score: 0,
    objs: [], props: [], parts: [], p: { lane: 0, x: 0, y: 0, vy: 0, slide: 0, inv: 0, phase: 0 },
    fx: { shield: false, fly: 0, magnet: 0, double: 0, slow: 0, dash: 0 }, max: {}, hearts: 3, maxHearts: 3
  };
  var arm = null, lastCoinSfx = 0, toastTimer = 0, cameoTimer = 0, hintTimer = 0, showcase = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function lower(s) { return s.replace(/^(A|An|The) /, function (m) { return m.toLowerCase(); }); }
  function arNum(n) { return String(n).split('').map(function (d) { return D.numerals[+d]; }).join(''); }
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  /* ───────────────────────── VIEW ───────────────────────── */
  function resize() {
    V.dpr = Math.min(window.devicePixelRatio || 1, 2);
    V.w = window.innerWidth; V.h = window.innerHeight;
    cv.width = Math.round(V.w * V.dpr); cv.height = Math.round(V.h * V.dpr);
    V.cx = V.w / 2; V.hy = V.h * 0.4; V.gy = V.h * 0.87;
    V.lane = Math.min(V.w * 0.27, V.h * 0.2); V.unit = V.lane * 0.84;
  }
  function sOf(z) { return 1 / (1 + Math.max(z, -8) * K); }
  function yOf(s) { return V.hy + (V.gy - V.hy) * s; }
  function proj(x, y, z) { var s = sOf(z); return { x: V.cx + x * V.lane * s, y: yOf(s) - y * V.unit * s, s: s, u: V.unit * s }; }

  /* ───────────────────────── SCENE SET-UP ───────────────────────── */
  function setScene(idx) {
    G.idx = idx; G.sc = D.scenes[idx]; G.part = D.parts[G.sc.part]; Au.setPart(G.sc.part);
  }
  function addProp(z, side) {
    var sc = G.sc; side = side || (Math.random() < 0.5 ? -1 : 1);
    G.props.push({ k: 'prop', name: pick(sc.props), x: side * rnd(2.3, 4.1), z: z, seed: Math.random() * 100 });
  }
  function seedProps() { G.props = []; for (var z = 6; z < ZFAR; z += 6) { addProp(z, -1); addProp(z + 3, 1); } G.nextProp = 4; }
  function resetRun() {
    G.st = 0; G.dist = 0; G.nextChunk = 6; G.chunk = 0; G.objs = []; G.parts = [];
    G.maxHearts = 3 + save.upg.heart; G.hearts = G.maxHearts; G.bumps = 0; G.sceneCoins = 0;
    G.p = { lane: 0, x: 0, y: 0, vy: 0, slide: 0, inv: 1.2, phase: 0 };
    G.fx = { shield: false, fly: 0, magnet: 0, double: 0, slow: 0, dash: 0 }; G.max = {};
    G.wi = 0; G.li = 0; G.spelled = {}; G.round = 0;
    G.item = 0; G.itemAt = 26 * SECS / 60; G.itemTries = 0; G.gotItem = false;
    G.cameo = 0; G.met = {}; G.skate = 0; G.gate = false; G.calm = 0; G.dip = 0; G.shake = 0;
    G.feast = 0; G.feastCount = 0; G.pendingArm = 0; G.armResult = null;
    seedProps(); setWord();
    // something to grab straight away: a line of coins, then the first letter
    addCoins(0, 34, 5); G.objs.push({ k: 'let', lane: pick([-1, 1]), z: 66 });
  }
  function word() { return G.sc.words[G.wi]; }
  function letters(w) { return Array.from(w[0]).filter(function (ch) { return ch !== ' '; }); }
  function curLetter() { return letters(word())[G.li]; }

  /* ───────────────────────── SPAWNING ───────────────────────── */
  function addOb(cls, lane, z) { G.objs.push({ k: 'ob', cls: cls, style: G.sc.obst[cls][0], lane: lane, z: z }); }
  function addCoins(lane, z, n, y, skin) { for (var i = 0; i < n; i++) G.objs.push({ k: 'coin', lane: lane, z: z + i * 3, y: y || 0.6, skin: skin }); }
  function clearObstacles(zMax) {
    G.objs = G.objs.filter(function (o) {
      if (o.k === 'ob' && o.z > 1 && o.z < zMax) { var q = proj(o.lane, 0.8, o.z); burst(q.x, q.y, '#ffffff', 5); return false; }
      return true;
    });
  }
  function coinCarpet(len, skin) {
    clearObstacles(len + 8);
    for (var z = 14; z < len; z += 3) for (var l = -1; l <= 1; l++) G.objs.push({ k: 'coin', lane: l, z: z, y: 0.6, skin: skin });
    G.calm = Math.max(G.calm, Math.max(0, (len - SPAWN_Z) / G.speed) + 0.4);
  }
  function spawnChunk() {
    var d = G.idx / (N - 1), z = SPAWN_Z, L = shuffle([-1, 0, 1]), i;
    G.chunk++;
    if (G.calm > 0) return 8;
    if (G.chunk % 10 === 7) { // a power-up
      var kinds = ['shield', 'magnet', 'double', 'slow', 'dash', 'shield', 'magnet', 'double', 'fly'];
      G.objs.push({ k: 'pow', kind: pick(kinds), lane: L[0], z: z + 4 });
      addOb(pick(['low', 'full']), L[1], z + 4);
      return 12;
    }
    if (G.chunk % 5 === 0 || G.chunk % 5 === 2) { // a letter to catch (two chunks in every five)
      addCoins(L[0], z, 3);
      G.objs.push({ k: 'let', lane: L[0], z: z + 11 });
      if (d > 0.2 && Math.random() < 0.55) addOb(pick(['low', 'full', 'high']), L[1], z + 11);
      return 15;
    }
    var pats = d < 0.1 ? ['single', 'single', 'single', 'coins', 'zig', 'double']
      : d < 0.4 ? ['single', 'double', 'double', 'zig', 'jumpAll', 'slideAll', 'single', 'mix']
        : ['single', 'double', 'double', 'jumpAll', 'slideAll', 'mix', 'mix', 'stairs', 'zig'];
    switch (pick(pats)) {
      case 'single': addOb(pick(['low', 'high', 'full']), L[0], z + 5); addCoins(L[1], z, 5); return 15;
      case 'double': addOb(pick(['full', 'full', 'low', 'high']), L[0], z + 6); addOb(pick(['full', 'low', 'high']), L[1], z + 6); addCoins(L[2], z, 5); return 15;
      case 'jumpAll':
        for (i = -1; i <= 1; i++) addOb('low', i, z + 6);
        G.objs.push({ k: 'coin', lane: L[0], z: z + 3.5, y: 1.2 }, { k: 'coin', lane: L[0], z: z + 6, y: 1.9 }, { k: 'coin', lane: L[0], z: z + 8.5, y: 1.2 });
        return 12;
      case 'slideAll': for (i = -1; i <= 1; i++) addOb('high', i, z + 6); addCoins(L[0], z + 3, 3, 0.4); return 12;
      case 'mix': addOb('low', L[0], z + 6); addOb('high', L[1], z + 6); addOb('full', L[2], z + 6); return 12;
      case 'stairs':
        var dir = Math.random() < 0.5 ? 1 : -1;
        addOb('full', -dir, z + 2); addOb('full', 0, z + 13); addOb('full', dir, z + 24);
        addCoins(dir, z, 3); addCoins(-dir, z + 11, 3); addCoins(0, z + 22, 3);
        return 30;
      case 'zig': addCoins(L[0], z, 3); addCoins(L[1], z + 9, 3); addCoins(L[2], z + 18, 3); return 27;
      default: addCoins(L[0], z, 6); return 18;
    }
  }

  /* ───────────────────────── EVENTS ───────────────────────── */
  function burst(x, y, col, n) {
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = rnd(60, 240); G.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: rnd(0.3, 0.7), col: col, r: rnd(2, 5) }); }
  }
  function toast(html, cls, ms) {
    var el = $('toast'); el.innerHTML = html; el.className = 'on ' + (cls || ''); toastTimer = (ms || 1800) / 1000;
  }
  function award(id) {
    if (save.badges[id]) return;
    var b = D.badges.filter(function (x) { return x.id === id; })[0]; if (!b) return;
    save.badges[id] = true; persist();
    if (G.state === 'run') toast('Badge unlocked<small>' + esc(b.name) + '</small>', 'gold', 2200);
  }
  function powerSecs(kind) { return D.powerups[kind].secs * (1 + 0.2 * save.upg.power); }
  function activate(kind, quiet) {
    var fx = G.fx, p = G.p, pu = D.powerups[kind], name = pu.name[G.sc.part];
    if (kind === 'shield') fx.shield = true;
    else { fx[kind] = powerSecs(kind); G.max[kind] = fx[kind]; }
    if (kind === 'fly') {
      p.slide = 0; p.vy = 0;
      var lane = p.lane, n = 0;
      for (var z = 12; z < G.speed * fx.fly - 8; z += 3) { if (n++ % 7 === 6) lane = Math.max(-1, Math.min(1, lane + pick([-1, 1]))); G.objs.push({ k: 'coin', lane: lane, z: z, y: FLY_Y + 0.8 }); }
      Au.sfx('launch');
    } else Au.sfx('power');
    if (!quiet) toast(esc(name) + '<small>' + esc(pu.text) + '</small>', 'gold', 1500);
  }
  function cameoEvent(cm) {
    cm = cm || G.sc.cameo; var first = !G.met[cm.id]; G.met[cm.id] = true;
    if (!save.cameos[cm.id]) { save.cameos[cm.id] = true; persist(); if (count(save.cameos) >= TOTAL_CAMEOS) award('guests'); }
    if (!first) { toast(esc(cm.name) + '<small>+25 ' + esc(G.part.coinName) + '</small>', 'gold', 1400); earn(25); return; }
    var card = $('cameoCard');
    card.innerHTML = '<div class="k">' + (cm.type === 'mascot' ? 'Legend of the place' : cm.type === 'legend' ? 'Pakistani legend' : 'Cameo') + '</div><div class="n">' + esc(cm.name) + '</div><div>' + esc(cm.known) + '</div><div class="g">' + esc(cm.giftText) + '</div>';
    card.classList.remove('hidden'); cameoTimer = 7; G.score += 100;
    switch (cm.gift) {
      case 'fly': activate('fly', true); if (cm.id === 'tyres') award('tyre'); break;
      case 'magnet': case 'double': case 'slow': case 'dash': case 'shield': activate(cm.gift, true); break;
      case 'coins': coinCarpet(80); Au.sfx('power'); break;
      case 'feast': coinCarpet(Math.round(G.speed * 7), 'samosa'); G.feast = 9; G.feastCount = 0; Au.sfx('power'); break;
      case 'clear': clearObstacles(ZFAR + 10); G.calm = Math.max(G.calm, 2.5); Au.sfx('launch'); break;
      case 'heart': if (G.hearts < G.maxHearts) G.hearts++; else earn(50); Au.sfx('power'); break;
      case 'arm': G.pendingArm = 1.1; break;
      case 'skate': // roller skates: a fast, unstoppable glide over a trail of spilled coins
        activate('dash', true); G.fx.dash = G.max.dash = powerSecs('dash') * 1.5; G.skate = G.fx.dash;
        coinCarpet(Math.round(G.speed * 1.7 * G.fx.dash) + 14); Au.boost(G.fx.dash); award('skate'); break;
    }
  }
  function earn(n) { save.coins += n; G.sceneCoins += n; }
  function bump(o) {
    var fx = G.fx, p = G.p, sc = G.sc, q = proj(o.lane, 0.8, 0);
    o.dead = true; burst(q.x, q.y, '#ffffff', 10);
    if (fx.shield) { fx.shield = false; p.inv = 1.2; Au.sfx('power'); toast('The shield saved you!', 'gold', 1200); return; }
    G.hearts--; G.bumps++; p.inv = 2; G.dip = 0.9; G.shake = 0.4; Au.sfx('hit');
    toast('Ouch — ' + esc(sc.obst[o.cls][1]) + '!<small>Right behind you: ' + esc(lower(sc.chaser)) + '</small>', 'bad', 1700);
    if (G.hearts <= 0) fail();
  }
  function wordDone() {
    var w = word(), cheer = pick(G.part.cheers), firstTime = !G.spelled[w[0]];
    G.spelled[w[0]] = true;
    if (!save.words[w[0]]) { save.words[w[0]] = true; }
    var n = count(save.words);
    earn(firstTime ? 20 : 5); G.score += 250; Au.sfx('word');
    toast('<span class="native" dir="rtl">' + esc(w[0]) + '</span>' + esc(w[1]) + ' · ' + esc(w[2]) + '<small>' + esc(cheer[1]) + ' — ' + esc(cheer[2]) + '</small>', 'gold', 2400);
    if (n >= 1) award('word1'); if (n >= 25) award('word25'); if (n >= TOTAL_WORDS) award('word120');
    G.wi = (G.wi + 1) % G.sc.words.length; G.li = 0; if (G.wi === 0) G.round++;
    setWord(); persist();
  }
  function collect(o) {
    var p = G.p, fx = G.fx, sc = G.sc, q;
    o.dead = true;
    if (o.k === 'coin') {
      earn((1 + save.upg.value) * (fx.double > 0 ? 2 : 1)); G.score += 10;
      if (o.skin === 'samosa' && G.feast > 0 && ++G.feastCount >= 40) award('feast');
      if (G.t - lastCoinSfx > 0.07) { Au.sfx('coin'); lastCoinSfx = G.t; }
      q = proj(o.lane, o.y, 0); burst(q.x, q.y, '#ffe58a', 3);
    } else if (o.k === 'let') {
      G.li++; G.score += 50; Au.sfx('letter'); q = proj(o.lane, 0.95, 0); burst(q.x, q.y, '#8affdc', 10);
      if (G.li >= letters(word()).length) wordDone(); else drawSlots();
    } else if (o.k === 'pow') { activate(o.kind); q = proj(o.lane, 0.95, 0); burst(q.x, q.y, D.powerups[o.kind].color, 12); }
    else if (o.k === 'item') {
      G.item = 2; G.gotItem = true; save.items[sc.id] = true; G.score += 500; earn(30); Au.sfx('item');
      q = proj(o.lane, 1, 0); burst(q.x, q.y, '#fff3b0', 24);
      var it = sc.item, label = it.kind === 'scroll' ? 'Wisdom scroll ' + arNum(it.n) : 'History stamp';
      toast(esc(label) + ' found!<small>' + esc(it.title) + '</small>', 'gold', 2400);
      var scrolls = 0, stamps = 0; D.scenes.forEach(function (s) { if (save.items[s.id]) { if (s.item.kind === 'scroll') scrolls++; else stamps++; } });
      if (scrolls >= 10) award('wisdom10'); if (stamps >= 20) award('stamp20');
      persist();
    }
  }

  /* ───────────────────────── UPDATE ───────────────────────── */
  function update(dt) {
    G.t += dt;
    if (toastTimer > 0 && (toastTimer -= dt) <= 0) $('toast').className = '';
    if (cameoTimer > 0 && (cameoTimer -= dt) <= 0) $('cameoCard').classList.add('hidden');
    if (hintTimer > 0 && (hintTimer -= dt) <= 0) $('hint').classList.add('hidden');
    if (G.state === 'arm') { armUpdate(dt); return; }
    if (G.state === 'title') { // a slow slideshow of scenes behind the menu
      G.scroll += dt * 5; showcase += dt;
      if (showcase > 5) { showcase = 0; setScene((G.idx + 7) % N); seedProps(); }
      return;
    }
    if (G.state !== 'run') { for (var k = G.parts.length - 1; k >= 0; k--) if ((G.parts[k].life -= dt) <= 0) G.parts.splice(k, 1); return; }

    var p = G.p, fx = G.fx, i, o;
    G.st += dt;
    var base = 23 + G.idx * 0.33 + Math.min(2, G.st / 30);
    G.speed = base * (fx.slow > 0 ? 0.55 : 1) * (fx.dash > 0 ? 1.7 : 1) * (G.dip > 0 ? 0.65 : 1);
    var mv = G.speed * dt; G.dist += mv; G.scroll = G.dist; G.score += mv;

    ['magnet', 'double', 'slow', 'dash'].forEach(function (n) { if (fx[n] > 0) fx[n] -= dt; });
    if (fx.fly > 0) { fx.fly -= dt; if (fx.fly <= 0) p.inv = Math.max(p.inv, 1.4); }
    if (p.inv > 0) p.inv -= dt; if (G.dip > 0) G.dip -= dt; if (G.calm > 0) G.calm -= dt;
    if (G.shake > 0) G.shake -= dt; if (G.feast > 0) G.feast -= dt; if (G.skate > 0) G.skate -= dt;
    if (G.pendingArm > 0 && (G.pendingArm -= dt) <= 0) { startArm(); return; }

    // the runner
    p.x += (p.lane - p.x) * Math.min(1, dt * 14);
    if (fx.fly > 0) { p.y += (FLY_Y - p.y) * Math.min(1, dt * 5); p.vy = 0; }
    else if (p.y > 0 || p.vy > 0) { p.vy -= 26 * dt; p.y += p.vy * dt; if (p.y <= 0) { p.y = 0; p.vy = 0; } }
    if (p.slide > 0) p.slide -= dt;
    p.phase += dt * G.speed * 0.42;

    // new things on the road
    if (!G.gate && G.st < SECS) {
      while (G.dist >= G.nextChunk) { var len = spawnChunk(); G.nextChunk += len + (16 - 7 * (G.idx / (N - 1))) + rnd(0, 4); }
      var cm = G.sc.cameo;
      if (cm && ((G.cameo === 0 && G.st > SECS * 0.15) || (G.cameo === 2 && G.st > SECS * 0.68))) {
        var who = G.cameo === 0 ? cm : (G.sc.cameo2 || cm), side = G.cameo === 0 ? 1 : -1, sk = who.kind === 'skater';
        G.objs.push({ k: 'cameo', cm: who, x: side * (sk ? 1.95 : 2.25), z: SPAWN_Z, skate: sk, paceT: sk ? 3.6 : 0 }); G.cameo++;
      }
      if (G.item === 0 && G.st > G.itemAt && G.itemTries < 3) {
        var lane = pick([-1, 0, 1]), zz = SPAWN_Z + 3;
        G.objs = G.objs.filter(function (a) { return !(a.k === 'ob' && Math.abs(a.z - zz) < 7); });
        G.objs.push({ k: 'item', lane: lane, z: zz }); G.item = 1; G.itemTries++;
      }
    } else if (!G.gate) { G.gate = true; G.objs.push({ k: 'gate', z: SPAWN_Z + 4 }); }

    G.nextProp -= mv;
    if (G.nextProp <= 0) { addProp(SPAWN_Z + 4, -1); addProp(SPAWN_Z + 6, 1); G.nextProp = rnd(4.5, 7.5); }
    for (i = G.props.length - 1; i >= 0; i--) { G.props[i].z -= mv; if (G.props[i].z < ZNEAR - 1) G.props.splice(i, 1); }

    var magR = 13 + save.upg.magnet * 5;
    for (i = G.objs.length - 1; i >= 0; i--) {
      o = G.objs[i]; o.z -= mv;
      if (o.k === 'coin' && fx.magnet > 0 && o.z < magR && o.z > -1) { o.lane += (p.x - o.lane) * Math.min(1, dt * 9); o.y += (p.y + 0.8 - o.y) * Math.min(1, dt * 9); }
      if (o.k === 'gate') { if (o.z <= 0.2) { completeScene(); return; } continue; }
      if (o.k === 'cameo') {
        if (!o.done && o.z < 14) { o.done = true; cameoEvent(o.cm); if (G.cameo === 1) G.cameo = 2; }
        if (o.skate && o.done && o.paceT > 0) { o.paceT -= dt; o.z += mv; o.z += (6.5 - o.z) * Math.min(1, dt * 1.6); } // skates alongside you for a moment
        if (o.z < ZNEAR - 2) G.objs.splice(i, 1); continue;
      }
      if (!o.dead && o.z < 0.9 && o.z > -0.9) {
        var dx = Math.abs(o.lane - p.x);
        if (o.k === 'ob') {
          if (dx < 0.5 && !o.pass && o.z > -0.35) { // once it is beside you, it can no longer hit you
            if (fx.fly > 0 && p.y > 1.4) { /* soaring over it */ }
            else if (fx.dash > 0) { o.dead = true; G.score += 30; var q = proj(o.lane, 0.8, 0); burst(q.x, q.y, '#ffd9a0', 12); Au.sfx('tap'); }
            else {
              var hit = o.cls === 'full' || (o.cls === 'low' && p.y < 0.75) || (o.cls === 'high' && !(p.slide > 0));
              if (hit) { o.pass = true; if (p.inv <= 0) { bump(o); if (G.state !== 'run') return; } }
            }
          }
        } else if (dx < 0.62) {
          if (o.k === 'coin') { if (Math.abs(p.y + 0.8 - o.y) < 1.25) collect(o); }
          else collect(o);
        }
      }
      if (o.dead || o.z < ZNEAR - 1) {
        if (o.k === 'item' && !o.dead) { G.item = 0; G.itemAt = G.st + 11 * SECS / 60; }
        G.objs.splice(i, 1);
      }
    }
    for (i = G.parts.length - 1; i >= 0; i--) { var pt = G.parts[i]; pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 500 * dt; if (pt.life <= 0) G.parts.splice(i, 1); }
    updateHud();
  }

  /* ───────────────────────── DRAW ───────────────────────── */
  function quad(x1, y1, x2, y2, x3, y3, x4, y4, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath(); c.fill(); }
  function drawGround() {
    var w = V.w, h = V.h, g = G.sc.ground, z, s0, s1;
    c.fillStyle = g.side; c.fillRect(0, V.hy, w, h - V.hy);
    var off = G.scroll % 10; c.fillStyle = g.side2;
    for (z = ZNEAR - off; z < ZFAR; z += 10) { var y0 = yOf(sOf(Math.max(z, ZNEAR))), y1 = yOf(sOf(z + 5)); if (y0 > y1) c.fillRect(0, y1, w, y0 - y1); }
    var sN = sOf(ZNEAR), sF = sOf(ZFAR), E = 1.62;
    quad(V.cx - (E + 0.1) * V.lane * sF, yOf(sF), V.cx + (E + 0.1) * V.lane * sF, yOf(sF), V.cx + (E + 0.1) * V.lane * sN, yOf(sN), V.cx - (E + 0.1) * V.lane * sN, yOf(sN), g.edge);
    quad(V.cx - E * V.lane * sF, yOf(sF), V.cx + E * V.lane * sF, yOf(sF), V.cx + E * V.lane * sN, yOf(sN), V.cx - E * V.lane * sN, yOf(sN), g.road);
    off = G.scroll % 6;
    for (z = ZNEAR - off; z < ZFAR; z += 6) {
      s0 = sOf(Math.max(z, ZNEAR)); s1 = sOf(z + 2.4);
      for (var k = -1; k <= 1; k += 2) quad(V.cx + (k * 0.5 - 0.03) * V.lane * s1, yOf(s1), V.cx + (k * 0.5 + 0.03) * V.lane * s1, yOf(s1), V.cx + (k * 0.5 + 0.03) * V.lane * s0, yOf(s0), V.cx + (k * 0.5 - 0.03) * V.lane * s0, yOf(s0), g.line);
    }
    var hz = c.createLinearGradient(0, V.hy, 0, V.hy + (h - V.hy) * 0.18);
    hz.addColorStop(0, hexA(G.sc.sky[2], 0.55)); hz.addColorStop(1, hexA(G.sc.sky[2], 0));
    c.fillStyle = hz; c.fillRect(0, V.hy, w, (h - V.hy) * 0.18);
  }
  function hatNow() { return save.cap !== 'kufi' ? save.cap : (G.sc.hat || 'kufi'); }
  function drawPlayer() {
    var p = G.p, fx = G.fx, q = proj(p.x, p.y, 0), gq = proj(p.x, 0, 0), t = G.t;
    if (fx.fly > 0 || p.y > FLY_Y - 0.6) (G.sc.part === 1 ? Art.flyTyre : Art.carpet)(c, q.x, q.y + 0.04 * q.u, q.u, t);
    Art.player(c, q.x, q.y, q.u * 0.92, {
      t: t, phase: p.phase, slide: p.slide > 0 && p.y < 0.05, air: p.y > 0.05, robe: D.shop.robes[save.robe].c, hat: hatNow(),
      outfit: G.sc.outfit, skates: G.skate > 0, blink: p.inv > 0 && G.state === 'run' && Math.sin(t * 30) > 0, groundY: gq.y, height: p.y
    });
    if (fx.shield) Art.shieldBubble(c, q.x, q.y - 0.85 * q.u, 1.05 * q.u, t);
    if (fx.magnet > 0) { c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#ff6b6b'; c.lineWidth = 3; c.beginPath(); c.arc(q.x, q.y - 0.8 * q.u, (1.2 + Math.sin(t * 8) * 0.1) * q.u, 0, 6.283); c.stroke(); c.restore(); }
  }
  function drawObj(o) {
    var sc = G.sc, t = G.t, q, a = Math.max(0, Math.min(1, (ZFAR - o.z) / 18));
    if (a <= 0) return; c.globalAlpha = a;
    switch (o.k) {
      case 'prop': q = proj(o.x, 0, o.z); Art.prop(c, o.name, q.x, q.y, q.u, sc, t, o.seed); break;
      case 'coin': q = proj(o.lane, o.y, o.z); Art.coin(c, o.skin || sc.coin, q.x, q.y, q.u * 0.24, t); break;
      case 'let': q = proj(o.lane, 0.95, o.z); Art.letter(c, curLetter(), q.x, q.y, q.u * 0.44, t, FONT); break;
      case 'pow': q = proj(o.lane, 0.95, o.z); Art.powerup(c, o.kind, q.x, q.y, q.u * 0.4, t, D.powerups[o.kind].color, sc.part); break;
      case 'item': q = proj(o.lane, 1.05, o.z); Art.item(c, sc.item.kind, q.x, q.y, q.u * 0.46, t); break;
      case 'ob':
        q = proj(o.lane, 0, o.z); c.globalAlpha = a * 0.22; c.fillStyle = '#000'; c.beginPath(); c.ellipse(q.x, q.y, 0.5 * q.u, 0.09 * q.u, 0, 0, 6.283); c.fill(); c.globalAlpha = a;
        Art.obstacle(c, o.cls, o.style, q.x, q.y, q.u, t); break;
      case 'cameo':
        var gm = o.cm || sc.cameo; q = proj(o.x, 0, o.z); Art.cameo(c, gm.kind, q.x, q.y, q.u * 1.2, t);
        if (o.z < 75) {
          var fs = Math.max(10, Math.min(20, q.u * 0.3)); c.font = '800 ' + fs + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          var tw = c.measureText(gm.name).width + fs * 1.2, ty = q.y - 2.75 * q.u;
          c.fillStyle = '#01411c'; c.beginPath(); c.roundRect(q.x - tw / 2, ty - fs * 0.85, tw, fs * 1.7, fs * 0.85); c.fill();
          c.fillStyle = '#ffffff'; c.fillText(gm.name, q.x, ty + 1);
        }
        break;
      case 'gate': q = proj(0, 0, o.z); Art.gate(c, q.x, q.y, q.u, V.lane * q.s, t); break;
    }
    c.globalAlpha = 1;
  }
  function drawPowers() {
    var fx = G.fx, x = V.w - 34, y = V.h - 40, list = [];
    if (fx.shield) list.push(['shield', 1]);
    ['fly', 'magnet', 'double', 'slow', 'dash'].forEach(function (n) { if (fx[n] > 0) list.push([n, fx[n] / (G.max[n] || 1)]); });
    list.forEach(function (it) {
      var col = D.powerups[it[0]].color;
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.arc(x, y, 24, 0, 6.283); c.fill();
      Art.powerup(c, it[0], x, y, 17, 0, col, G.sc.part);
      c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 22, -1.5708, -1.5708 + 6.283 * it[1]); c.stroke();
      x -= 56;
    });
  }
  function draw() {
    var w = V.w, h = V.h, sc = G.sc, t = G.t, i;
    c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    c.save();
    if (G.shake > 0 && G.state === 'run') c.translate((Math.random() - 0.5) * 22 * G.shake, (Math.random() - 0.5) * 14 * G.shake);
    Art.sky(c, w, h, V.hy, sc, t); Art.far(c, w, V.hy, sc, t); Art.landmark(c, w, h, V.hy, sc, t);
    drawGround();
    var list = G.props.concat(G.objs); list.sort(function (a, b) { return b.z - a.z; });
    var drewPlayer = false, showPlayer = G.state !== 'title';
    for (i = 0; i < list.length; i++) {
      if (!drewPlayer && showPlayer && list[i].z < 0) { drawPlayer(); drewPlayer = true; }
      drawObj(list[i]);
    }
    if (!drewPlayer && showPlayer) drawPlayer();
    for (i = 0; i < G.parts.length; i++) { var pt = G.parts[i]; c.globalAlpha = Math.max(0, Math.min(1, pt.life * 2.5)); c.fillStyle = pt.col; c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 6.283); c.fill(); }
    c.globalAlpha = 1;
    Art.weather(c, w, h, sc, t);
    if (G.state === 'run' || G.state === 'arm') {
      if (G.fx.slow > 0) { c.fillStyle = 'rgba(120,200,255,0.13)'; c.fillRect(0, 0, w, h); }
      if (G.fx.dash > 0) { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; for (i = 0; i < 16; i++) { var a = Art.hash(i + Math.floor(t * 20)) * 6.283, r0 = h * 0.25 + Art.hash(i * 3 + Math.floor(t * 20)) * h * 0.2; c.beginPath(); c.moveTo(V.cx + Math.cos(a) * r0, V.hy + Math.sin(a) * r0); c.lineTo(V.cx + Math.cos(a) * (r0 + 90), V.hy + Math.sin(a) * (r0 + 90)); c.stroke(); } }
      if (G.hearts === 1) { var vg = c.createRadialGradient(V.cx, h / 2, h * 0.35, V.cx, h / 2, h * 0.85); vg.addColorStop(0, 'rgba(255,0,40,0)'); vg.addColorStop(1, 'rgba(255,0,40,' + (0.2 + 0.08 * Math.sin(t * 5)) + ')'); c.fillStyle = vg; c.fillRect(0, 0, w, h); }
      drawPowers();
    }
    c.restore();
  }

  /* ───────────────────────── HUD ───────────────────────── */
  var hudCache = {};
  function setWord() {
    var w = word();
    $('wordNative').textContent = w[0];
    $('wordMeta').innerHTML = '<b>' + esc(w[1]) + '</b> · ' + esc(w[2]);
    drawSlots();
  }
  function drawSlots() {
    var ls = letters(word()), html = '';
    for (var i = 0; i < ls.length; i++) html += '<span class="slot ' + (i < G.li ? 'got' : i === G.li ? 'next' : '') + '">' + esc(ls[i]) + '</span>';
    $('wordSlots').innerHTML = html;
  }
  function updateHud() {
    var hk = G.hearts + '/' + G.maxHearts;
    if (hudCache.h !== hk) { hudCache.h = hk; var s = ''; for (var i = 0; i < G.maxHearts; i++) s += '<span class="' + (i < G.hearts ? '' : 'lost') + '">♥</span>'; $('hearts').innerHTML = s; }
    if (hudCache.c !== save.coins) { hudCache.c = save.coins; $('coins').textContent = save.coins; }
    var sc = Math.floor(G.score); if (hudCache.s !== sc) { hudCache.s = sc; $('score').textContent = sc; }
    $('progressBar').style.width = Math.min(100, G.st / SECS * 100) + '%';
  }

  /* ───────────────────────── SCREENS ───────────────────────── */
  var SCREENS = ['s-title', 's-intro', 's-outro', 's-msg', 's-pause', 's-list', 's-arm'];
  function show(id) { SCREENS.forEach(function (s) { $(s).classList.toggle('hidden', s !== id); }); $('hud').classList.toggle('hidden', !(id === null || id === 's-pause' || id === 's-arm')); }
  function chips(sc, dimMissing) {
    return '<div class="chips">' + sc.words.map(function (w) {
      var miss = dimMissing && !G.spelled[w[0]];
      return '<div class="chip' + (miss ? ' miss' : '') + '"><span class="native" dir="rtl">' + esc(w[0]) + '</span>' + esc(w[1]) + ' · ' + esc(w[2]) + '</div>';
    }).join('') + '</div>';
  }
  function itemLabel(sc) { return sc.item.kind === 'scroll' ? 'Wisdom scroll ' + arNum(sc.item.n) : 'History stamp'; }
  function cameoBox(sc) {
    var gs = guests(sc);
    if (gs.length) return gs.map(function (cm) { return '<div class="box cameo"><span class="k">' + (cm.type === 'mascot' ? 'Legend of the place' : cm.type === 'legend' ? 'Pakistani legend on the roadside' : 'Cameo on the roadside') + '</span><b>' + esc(cm.name) + '</b>' + esc(cm.known) + '</div>'; }).join('');
    if (sc.quiet) return '<div class="box quiet">' + esc(sc.quiet) + '</div>';
    return '';
  }
  function openIntro(idx) {
    setScene(idx); resetRun(); G.state = 'intro'; save.last = idx; persist(); Au.music(false);
    var sc = G.sc, part = G.part;
    $('introCard').innerHTML =
      '<div class="eyebrow">Scene ' + (idx + 1) + ' of ' + N + ' · ' + esc(part.title) + '</div>' +
      '<div class="scene-head"><h2>' + esc(sc.name) + '</h2><div class="native" dir="rtl">' + esc(sc.native) + '</div></div>' +
      '<p class="meta">' + esc(sc.where) + ' · ' + esc(sc.when) + '</p>' +
      '<p class="banner">' + esc(sc.banner) + '</p><p>' + esc(sc.story) + '</p><p class="ref">' + esc(sc.ref) + '</p>' +
      '<h3>Words to spell in ' + esc(part.langName) + '</h3>' + chips(sc) +
      '<div class="box item"><span class="k">Hidden in this scene</span><b>' + esc(itemLabel(sc)) + (save.items[sc.id] ? ' ✓ found' : '') + '</b>Watch for the glow about halfway along.</div>' +
      cameoBox(sc) +
      '<div class="btn-col"><button id="i-run" class="btn primary">Run!</button><button id="i-back" class="btn ghost">' + esc(S.quit) + '</button></div>';
    $('i-run').onclick = startRun; $('i-back').onclick = openTitle;
    show('s-intro');
  }
  function startRun() {
    Au.unlock(); if (G.st > 0 || G.state === 'fail') resetRun();
    G.state = 'run'; save.played = true; hudCache = {}; show(null); updateHud();
    $('sceneLabel').textContent = 'Scene ' + (G.idx + 1) + ' · ' + G.sc.name;
    $('cameoCard').classList.add('hidden');
    if (count(save.done) === 0) { $('hint').innerHTML = esc(S.howtoText[0]) + '<br>' + esc(S.howtoText[1]) + '<br>' + esc(S.howtoText[2]); $('hint').classList.remove('hidden'); hintTimer = 7; }
    Au.music(true);
  }
  function completeScene() {
    var sc = G.sc; G.state = 'outro'; Au.music(false); Au.sfx('gate');
    save.done[sc.id] = true; save.last = Math.min(N - 1, G.idx + 1); if (G.score > save.best) save.best = Math.floor(G.score);
    if (G.bumps === 0) award('flawless'); if (G.idx === 9) award('pillars'); if (G.idx === N - 1) award('summit');
    persist();
    var cheer = pick(G.part.cheers), spelled = count(G.spelled), it = sc.item;
    var itemHtml = G.gotItem || save.items[sc.id]
      ? '<div class="box item"><span class="k">' + esc(itemLabel(sc)) + '</span><b>' + esc(it.title) + '</b>' + esc(it.text) + ' <i>(' + esc(it.ref) + ')</i></div>'
      : '<div class="box quiet">You missed the hidden ' + esc(G.part.itemName.toLowerCase()) + '. Play the scene again to find it.</div>';
    $('outroCard').innerHTML =
      '<div class="eyebrow">' + esc(S.sceneDone) + ' · ' + (G.idx + 1) + ' of ' + N + '</div><h2>' + esc(sc.name) + '</h2>' +
      '<p class="cheer"><span class="native" dir="rtl">' + esc(cheer[0]) + '</span>' + esc(cheer[1]) + ' — ' + esc(cheer[2]) + '</p>' +
      '<div class="stats"><div class="stat"><b>' + G.sceneCoins + '</b>' + esc(G.part.coinName) + '</div><div class="stat"><b>' + spelled + ' / ' + sc.words.length + '</b>words spelled</div><div class="stat"><b>' + G.bumps + '</b>bumps</div></div>' +
      chips(sc, true) + itemHtml + (function () { var m = guests(sc).filter(function (g) { return G.met[g.id]; }).map(function (g) { return esc(g.name); }); return m.length ? '<div class="box cameo"><span class="k">You met</span><b>' + m.join(' and ') + '</b></div>' : ''; })() +
      '<div class="btn-col"><button id="o-next" class="btn primary">' + (G.idx === N - 1 ? 'Finish' : esc(S.next)) + '</button><div class="btn-row"><button id="o-again" class="btn">Play again</button><button id="o-title" class="btn">' + esc(S.quit) + '</button></div></div>';
    $('o-next').onclick = nextScene; $('o-again').onclick = function () { openIntro(G.idx); }; $('o-title').onclick = openTitle;
    show('s-outro');
  }
  function nextScene() {
    if (G.idx === 9) {
      message('<div class="eyebrow">' + esc(S.part1Done) + '</div><h2>The Five Pillars</h2><p>' + esc(S.part1Text) + '</p>' +
        '<div class="chips">' + D.pillars.map(function (p) { return '<div class="chip"><span class="native" dir="rtl">' + esc(p[0]) + '</span><b>' + esc(p[1]) + '</b><br>' + esc(p[2]) + '</div>'; }).join('') + '</div>',
        'Sail to Pakistan', function () { openIntro(10); });
    } else if (G.idx === N - 1) {
      message('<div class="eyebrow">Journey complete</div><h2>' + esc(S.endTitle) + '</h2><p>' + esc(S.endText) + '</p>' +
        '<div class="stats"><div class="stat"><b>' + count(save.words) + ' / ' + TOTAL_WORDS + '</b>words</div><div class="stat"><b>' + count(save.items) + ' / ' + N + '</b>scrolls & stamps</div><div class="stat"><b>' + count(save.cameos) + ' / ' + TOTAL_CAMEOS + '</b>guests met</div></div>' +
        '<p class="cheer"><span class="native" dir="rtl">پاکستان زندہ باد</span>Pākistān zindabād</p>', S.quit, openTitle);
    } else openIntro(G.idx + 1);
  }
  function fail() {
    G.state = 'fail'; Au.music(false); Au.sfx('lose'); persist();
    message('<div class="eyebrow">Scene ' + (G.idx + 1) + ' · ' + esc(G.sc.name) + '</div><h2>' + esc(S.failTitle) + '</h2><p><b>' + esc(G.sc.chaser) + '</b> caught up with you.</p><p class="muted">' + esc(S.failText) + '</p>',
      S.retry, function () { resetRun(); startRun(); }, S.quit, openTitle);
  }
  function message(html, btn, fn, btn2, fn2) {
    $('msgCard').innerHTML = html + '<div class="btn-col"><button id="m-ok" class="btn primary">' + esc(btn) + '</button>' + (btn2 ? '<button id="m-2" class="btn ghost">' + esc(btn2) + '</button>' : '') + '</div>';
    $('m-ok').onclick = fn; if (btn2) $('m-2').onclick = fn2;
    show('s-msg');
  }
  function soundLabel() { return 'Sound: ' + { full: 'Drum + melody', drum: 'Drum only', off: 'Off' }[save.sound]; }
  function cycleSound() {
    save.sound = { full: 'drum', drum: 'off', off: 'full' }[save.sound]; Au.setMode(save.sound); persist();
    $('b-sound').textContent = soundLabel(); $('p-sound').textContent = soundLabel(); Au.unlock(); Au.sfx('coin');
  }
  function openTitle() {
    G.state = 'title'; Au.music(false); showcase = 0; G.objs = []; G.parts = [];
    $('t-title').textContent = S.title; $('t-sub').textContent = S.subtitle; $('t-tag').textContent = S.tagline; $('t-blurb').textContent = S.blurb;
    $('b-new').textContent = S.newGame; $('b-pk').textContent = S.jumpPk; $('b-scenes').textContent = S.scenes; $('b-album').textContent = S.album; $('b-shop').textContent = S.shop;
    $('b-how').textContent = S.howto; $('b-sound').textContent = soundLabel(); $('t-credits').textContent = S.credits;
    $('t-fact').textContent = 'Did you know? ' + pick(D.facts);
    var cont = $('b-continue');
    if (save.played) { cont.classList.remove('hidden'); cont.textContent = S.cont + ' · Scene ' + (save.last + 1) + ': ' + D.scenes[save.last].name; $('b-new').className = 'btn'; }
    else { cont.classList.add('hidden'); $('b-new').className = 'btn primary'; }
    show('s-title');
  }

  /* lists: scenes, album, shop */
  function listShell(title, bodyHtml, extraHead) {
    $('listCard').innerHTML = '<div class="list-head"><h2>' + esc(title) + '</h2><div>' + (extraHead || '') + ' <button id="l-close" class="btn">Close</button></div></div>' + bodyHtml;
    $('l-close').onclick = openTitle; show('s-list');
  }
  function openScenes() {
    var html = '';
    D.parts.forEach(function (part, pi) {
      html += '<h3>' + esc(part.title) + '</h3><p class="muted">' + esc(part.sub) + '</p><div class="grid">';
      D.scenes.forEach(function (sc, i) {
        if (sc.part !== pi) return; var open = unlocked(i);
        html += '<button class="tile ' + (pi ? 'pk' : 'st') + (open ? '' : ' locked') + (save.done[sc.id] ? ' done' : '') + '" data-i="' + i + '"' + (open ? '' : ' disabled') + '><span class="num">SCENE ' + (i + 1) + (save.done[sc.id] ? ' ✓' : open ? '' : ' · locked') + '</span><span class="native" dir="rtl">' + esc(sc.native) + '</span><span class="nm">' + esc(sc.name) + '</span>' + esc(sc.when) + '</button>';
      });
      html += '</div>';
    });
    html += '<p style="text-align:center"><button id="l-reset" class="btn ghost">Reset all progress</button></p>';
    listShell(S.scenes, html);
    $('l-reset').onclick = function () { if (window.confirm('Erase all coins, words, stamps and badges and start again?')) { save = freshSave(); Au.setMode(save.sound); persist(); openTitle(); } };
    Array.prototype.forEach.call($('listCard').querySelectorAll('button.tile'), function (b) { b.onclick = function () { openIntro(+b.getAttribute('data-i')); }; });
  }
  var albumTab = 'wisdoms';
  function openAlbum() {
    var tabs = [['wisdoms', 'Ten Wisdoms'], ['stamps', 'History stamps'], ['cameos', 'Guests'], ['words', 'Words'], ['badges', 'Badges']];
    var html = '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab' + (albumTab === t[0] ? ' on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div class="grid">';
    if (albumTab === 'wisdoms' || albumTab === 'stamps') {
      D.scenes.forEach(function (sc, i) {
        var it = sc.item; if ((albumTab === 'wisdoms') !== (it.kind === 'scroll')) return; var has = save.items[sc.id];
        html += '<div class="tile ' + (has ? 'done' : 'locked') + '"><span class="num">' + esc(itemLabel(sc)).toUpperCase() + ' · SCENE ' + (i + 1) + '</span><span class="nm">' + (has ? esc(it.title) : '???') + '</span>' + (has ? esc(it.text) + ' <i>(' + esc(it.ref) + ')</i>' : 'Hidden in ' + esc(sc.name)) + '</div>';
      });
    } else if (albumTab === 'cameos') {
      D.scenes.forEach(function (sc, i) {
        guests(sc).forEach(function (cm) { var has = save.cameos[cm.id];
        html += '<div class="tile ' + (has ? 'done' : 'locked') + '"><span class="num">SCENE ' + (i + 1) + ' · ' + esc(sc.name).toUpperCase() + '</span><span class="nm">' + (has ? esc(cm.name) : '???') + '</span>' + (has ? esc(cm.known) : 'Meet this guest on the roadside.') + '</div>'; });
      });
    } else if (albumTab === 'words') {
      D.scenes.forEach(function (sc) { sc.words.forEach(function (w) { var has = save.words[w[0]]; html += '<div class="tile ' + (has ? 'done' : 'locked') + '"><span class="native" dir="rtl">' + esc(w[0]) + '</span><span class="nm">' + esc(w[1]) + '</span>' + esc(w[2]) + '</div>'; }); });
    } else {
      D.badges.forEach(function (b) { var has = save.badges[b.id]; html += '<div class="tile ' + (has ? 'done' : 'locked') + '"><span class="num">' + (has ? 'EARNED' : 'LOCKED') + '</span><span class="nm">' + esc(b.name) + '</span>' + esc(b.text) + '</div>'; });
    }
    listShell(S.album, html + '</div>');
    Array.prototype.forEach.call($('listCard').querySelectorAll('.tab'), function (b) { b.onclick = function () { albumTab = b.getAttribute('data-t'); openAlbum(); }; });
  }
  function openShop() {
    var html = '<h3>Upgrades</h3>';
    D.shop.upgrades.forEach(function (u) {
      var lv = save.upg[u.id], maxed = lv >= u.costs.length, cost = u.costs[lv];
      html += '<div class="row-item"><div><b>' + esc(u.name) + '</b> · level ' + lv + ' of ' + u.costs.length + '<small>' + esc(u.text) + '</small></div><button class="btn" data-up="' + u.id + '"' + (maxed || save.coins < cost ? ' disabled' : '') + '>' + (maxed ? 'MAX' : cost) + '</button></div>';
    });
    html += '<h3>Robe colour</h3><div class="swatches">';
    D.shop.robes.forEach(function (r, i) { var own = save.ownRobes.indexOf(i) >= 0; html += '<button class="swatch' + (save.robe === i ? ' on' : '') + '" data-robe="' + i + '"' + (!own && save.coins < r.cost ? ' disabled' : '') + '><i style="background:' + r.c + '"></i>' + esc(r.name) + '<br>' + (own ? (save.robe === i ? 'wearing' : 'owned') : r.cost) + '</button>'; });
    html += '</div><h3>Cap</h3><div class="swatches">';
    D.shop.caps.forEach(function (cp) { var own = save.ownCaps.indexOf(cp.id) >= 0; html += '<button class="swatch' + (save.cap === cp.id ? ' on' : '') + '" data-cap="' + cp.id + '"' + (!own && save.coins < cp.cost ? ' disabled' : '') + '>' + esc(cp.name) + '<br>' + (own ? (save.cap === cp.id ? 'wearing' : 'owned') : cp.cost) + '</button>'; });
    html += '</div><p class="muted">Coins are earned in every scene and are never lost when you are caught.</p>';
    listShell(S.shop, html, '<span class="bank"><span class="coin-dot"></span>' + save.coins + '</span>');
    var card = $('listCard');
    Array.prototype.forEach.call(card.querySelectorAll('[data-up]'), function (b) { b.onclick = function () { var u = D.shop.upgrades.filter(function (x) { return x.id === b.getAttribute('data-up'); })[0], cost = u.costs[save.upg[u.id]]; if (cost != null && save.coins >= cost) { save.coins -= cost; save.upg[u.id]++; persist(); Au.sfx('power'); openShop(); } }; });
    Array.prototype.forEach.call(card.querySelectorAll('[data-robe]'), function (b) { b.onclick = function () { var i = +b.getAttribute('data-robe'), r = D.shop.robes[i]; if (save.ownRobes.indexOf(i) < 0) { if (save.coins < r.cost) return; save.coins -= r.cost; save.ownRobes.push(i); } save.robe = i; persist(); Au.sfx('coin'); openShop(); }; });
    Array.prototype.forEach.call(card.querySelectorAll('[data-cap]'), function (b) { b.onclick = function () { var id = b.getAttribute('data-cap'), cp = D.shop.caps.filter(function (x) { return x.id === id; })[0]; if (save.ownCaps.indexOf(id) < 0) { if (save.coins < cp.cost) return; save.coins -= cp.cost; save.ownCaps.push(id); } save.cap = id; persist(); Au.sfx('coin'); openShop(); }; });
  }
  function openHow() {
    message('<h2>' + esc(S.howto) + '</h2>' + S.howtoText.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
      '<h3>Power-ups</h3>' + Object.keys(D.powerups).map(function (k) { var p = D.powerups[k]; return '<p><b>' + esc(p.name[0]) + (p.name[1] !== p.name[0] ? ' / ' + esc(p.name[1]) : '') + '</b> — ' + esc(p.text) + '</p>'; }).join(''), 'Got it', openTitle);
  }
  function pause() { if (G.state !== 'run') return; G.state = 'pause'; Au.music(false); persist(); $('p-title').textContent = S.paused; $('p-resume').textContent = S.resume; $('p-restart').textContent = 'Restart scene'; $('p-sound').textContent = soundLabel(); $('p-quit').textContent = S.quit; show('s-pause'); }
  function resume() { if (G.state !== 'pause') return; G.state = 'run'; show(null); Au.music(true); }

  /* ───────────────────────── ARM WRESTLE ───────────────────────── */
  function startArm() {
    if (G.state !== 'run') return;
    G.state = 'arm'; arm = { v: 50, t: 0, over: 0 }; $('a-title').textContent = S.armTitle; $('a-hint').textContent = S.armHint; show('s-arm'); armRender();
  }
  function armTap() { if (!arm || arm.over > 0) return; arm.v = Math.min(100, arm.v + 5.4); Au.sfx('tap'); }
  function armRender() {
    var th = (arm.v - 50) / 50 * 1.25, fx = 150 + Math.sin(th) * 72, fy = 118 - Math.cos(th) * 72;
    $('armL').setAttribute('x2', fx); $('armL').setAttribute('y2', fy); $('armR').setAttribute('x2', fx); $('armR').setAttribute('y2', fy);
    $('armFist').setAttribute('cx', fx); $('armFist').setAttribute('cy', fy); $('armFill').style.width = arm.v + '%';
  }
  function armUpdate(dt) {
    if (!arm) return;
    if (arm.over > 0) { arm.over -= dt; if (arm.over <= 0) { arm = null; G.state = 'run'; G.p.inv = 2; clearObstacles(45); show(null); } return; }
    arm.t += dt; if (arm.t > 0.7) arm.v -= (12 + Math.sin(arm.t * 3) * 4) * dt;
    var win = arm.v >= 100 || (arm.t > 9 && arm.v >= 50), lose = arm.v <= 0 || (arm.t > 9 && arm.v < 50);
    arm.v = Math.max(0, arm.v); armRender();
    if (win) { arm.over = 1.7; earn(150); award('arm'); Au.sfx('win'); $('a-hint').textContent = S.armWin; persist(); }
    else if (lose) { arm.over = 1.7; Au.sfx('lose'); $('a-hint').textContent = S.armLose; }
  }

  /* ───────────────────────── INPUT ───────────────────────── */
  function act(a) {
    if (G.state !== 'run') return;
    var p = G.p, flying = G.fx.fly > 0;
    if (a === 'left') { if (p.lane > -1) p.lane--; }
    else if (a === 'right') { if (p.lane < 1) p.lane++; }
    else if (a === 'up') { if (p.y <= 0.01 && !flying) { p.vy = 9.6; p.slide = 0; Au.sfx('jump'); } }
    else if (a === 'down') { if (!flying) { if (p.y > 0.01) p.vy = -16; p.slide = 0.72; Au.sfx('slide'); } }
  }
  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (G.state === 'arm') { if (!e.repeat) armTap(); e.preventDefault(); return; }
    if (G.state === 'run') {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') act('left');
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') act('right');
      else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') act('up');
      else if (k === 'ArrowDown' || k === 's' || k === 'S') act('down');
      else if (k === 'p' || k === 'P' || k === 'Escape') pause();
      else return;
      e.preventDefault(); return;
    }
    if (G.state === 'pause' && (k === 'p' || k === 'P' || k === 'Escape')) { resume(); return; }
    if (k === 'Enter' || k === ' ') {
      var b = document.querySelector('.screen:not(.hidden) .btn.primary:not(.hidden)');
      if (b) { b.click(); e.preventDefault(); }
    }
  });
  var touch = null;
  cv.addEventListener('pointerdown', function (e) { Au.unlock(); touch = { x: e.clientX, y: e.clientY, used: false }; });
  cv.addEventListener('pointermove', function (e) {
    if (!touch || touch.used) return;
    var dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (Math.abs(dx) < 26 && Math.abs(dy) < 26) return;
    touch.used = true;
    if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left'); else act(dy > 0 ? 'down' : 'up');
  });
  cv.addEventListener('pointerup', function () { if (touch && !touch.used) act('up'); touch = null; });
  cv.addEventListener('pointercancel', function () { touch = null; });
  $('s-arm').addEventListener('pointerdown', function (e) { e.preventDefault(); Au.unlock(); armTap(); });
  $('btnPause').onclick = pause; $('p-resume').onclick = resume;
  $('p-restart').onclick = function () { resetRun(); G.state = 'intro'; startRun(); };
  $('p-quit').onclick = openTitle; $('p-sound').onclick = cycleSound; $('b-sound').onclick = cycleSound;
  $('b-new').onclick = function () { Au.unlock(); openIntro(0); };
  $('b-pk').onclick = function () { Au.unlock(); openIntro(10); };
  $('b-continue').onclick = function () { Au.unlock(); openIntro(unlocked(save.last) ? save.last : 0); };
  $('b-scenes').onclick = openScenes; $('b-album').onclick = openAlbum; $('b-shop').onclick = openShop; $('b-how').onclick = openHow;
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);
  window.addEventListener('resize', resize);

  /* ───────────────────────── MAIN LOOP ───────────────────────── */
  var last = 0;
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000 || 0); last = now;
    update(dt); draw();
    requestAnimationFrame(frame);
  }
  resize(); Au.setMode(save.sound);
  setScene(pick([9, 14, 17, 19, 24, 29])); seedProps(); G.objs = [];
  if (qs.get('scene')) { openIntro(Math.max(0, Math.min(N - 1, +qs.get('scene') - 1))); } else openTitle();
  requestAnimationFrame(frame);

  // Small hooks used by the automated tests in tools/.
  QR.debug = { G: G, save: function () { return save; }, act: act, step: update, startRun: startRun, openIntro: openIntro, cameo: cameoEvent, activate: activate, armTap: armTap, startArm: startArm };
})();
