/* Quran Runner — Pakistan Journey
 * audio.js: tiny synth for sound effects and a soft background beat.
 * Modes: 'full' (drum + gentle melody), 'drum' (hand-drum only), 'off'.
 */
(function () {
  'use strict';
  var QR = (window.QR = window.QR || {});
  var ctx = null, master = null, mode = 'full', timer = null, step = 0, nextT = 0, part = 0, playing = false;

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; return false; }
    return true;
  }
  function tone(freq, t, dur, type, vol, slideTo) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  function drum(t, low, vol) { // "dum" (low) or "tek" (high) of a hand drum
    if (low) tone(150, t, 0.22, 'sine', vol || 0.5, 55);
    else { tone(620, t, 0.07, 'triangle', (vol || 0.5) * 0.45, 380); }
  }

  // 8-step drum patterns: D = dum, t = tek, . = rest
  var BEATS = ['D.tD.t.t', 'D.DtD.t.'];
  // Gentle melodies on a five-note scale (frequencies in Hz); 0 = rest.
  var TUNES = [
    [293.7, 0, 311.1, 370, 0, 392, 370, 0, 311.1, 0, 293.7, 0, 440, 392, 370, 0],
    [392, 0, 440, 493.9, 0, 587.3, 493.9, 0, 440, 392, 0, 329.6, 392, 0, 440, 0]
  ];
  function schedule() {
    if (!ctx || !playing) return;
    var spb = 0.21;
    while (nextT < ctx.currentTime + 0.25) {
      if (mode !== 'off') {
        var ch = BEATS[part][step % 8];
        if (ch === 'D') drum(nextT, true, 0.42); else if (ch === 't') drum(nextT, false, 0.4);
        if (mode === 'full' && step % 2 === 0) {
          var f = TUNES[part][(step / 2) % 16];
          if (f) tone(f, nextT, 0.36, 'triangle', 0.055);
        }
      }
      nextT += spb; step++;
    }
  }

  QR.Audio = {
    unlock: function () { if (ensure() && ctx.state === 'suspended') ctx.resume(); },
    setMode: function (m) { mode = m; },
    getMode: function () { return mode; },
    setPart: function (p) { part = p ? 1 : 0; },
    music: function (on) {
      if (!ensure()) return;
      if (on && !playing) { playing = true; step = 0; nextT = ctx.currentTime + 0.05; timer = setInterval(schedule, 80); }
      else if (!on && playing) { playing = false; clearInterval(timer); }
    },
    sfx: function (name) {
      if (mode === 'off' || !ensure()) return;
      var t = ctx.currentTime;
      switch (name) {
        case 'coin': tone(988, t, 0.07, 'square', 0.06); tone(1319, t + 0.05, 0.1, 'square', 0.06); break;
        case 'letter': tone(659, t, 0.09, 'triangle', 0.16); tone(880, t + 0.08, 0.14, 'triangle', 0.16); break;
        case 'word': [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.09, 0.2, 'triangle', 0.17); }); break;
        case 'item': [784, 988, 1175, 1568, 1976].forEach(function (f, i) { tone(f, t + i * 0.08, 0.3, 'sine', 0.15); }); break;
        case 'power': tone(330, t, 0.3, 'sawtooth', 0.09, 990); break;
        case 'jump': tone(300, t, 0.14, 'sine', 0.12, 520); break;
        case 'slide': tone(240, t, 0.16, 'sine', 0.1, 130); break;
        case 'hit': tone(170, t, 0.3, 'sawtooth', 0.2, 60); drum(t, true, 0.6); break;
        case 'launch': tone(110, t, 0.7, 'sawtooth', 0.14, 880); break;
        case 'tap': drum(t, false, 0.5); break;
        case 'win': [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.11, 0.35, 'triangle', 0.18); }); break;
        case 'lose': tone(392, t, 0.25, 'triangle', 0.16, 300); tone(294, t + 0.22, 0.4, 'triangle', 0.16, 200); break;
        case 'gate': [392, 523, 659, 784].forEach(function (f, i) { tone(f, t + i * 0.12, 0.4, 'sine', 0.16); }); break;
      }
    }
  };
})();
