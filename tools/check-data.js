#!/usr/bin/env node
/* Checks quran-runner/js/data.js for gaps and mistakes.
 * Run:  node tools/check-data.js
 */
'use strict';
const path = require('path');
global.window = {};
require(path.join(__dirname, '../quran-runner/js/art.js'));
require(path.join(__dirname, '../quran-runner/js/data.js'));
const D = window.QR.DATA, K = window.QR.Art.keys;

const errors = [];
const err = (m) => errors.push(m);
const need = (obj, fields, where) => fields.forEach((f) => { if (obj[f] === undefined || obj[f] === null || obj[f] === '') err(`${where}: missing "${f}"`); });

if (D.scenes.length !== 30) err(`expected 30 scenes, found ${D.scenes.length}`);
const perPart = [0, 0];
const seenIds = new Set(), seenWords = new Map(), seenCameos = new Set(), scrollNs = new Set();
const HOLY = ['الله', 'اللہ'];
let words = 0, cameos = 0, stamps = 0;

D.scenes.forEach((s, i) => {
  const w = `scene ${i + 1} (${s.id})`;
  need(s, ['id', 'name', 'native', 'tr', 'where', 'when', 'banner', 'story', 'ref', 'sky', 'far', 'ground', 'props', 'weather', 'obst', 'chaser', 'coin', 'words', 'item'], w);
  if (seenIds.has(s.id)) err(`${w}: duplicate id`); seenIds.add(s.id);
  perPart[s.part]++;
  const lang = D.parts[s.part].lang, allowed = new Set(D.alphabet[lang]);

  if (!Array.isArray(s.sky) || s.sky.length !== 3) err(`${w}: sky needs 3 colours`);
  if (!K.far.includes(s.far.type)) err(`${w}: unknown horizon "${s.far.type}"`);
  if (s.lm && !K.landmark.includes(s.lm.name)) err(`${w}: unknown landmark "${s.lm.name}"`);
  s.props.forEach((p) => { if (!K.prop.includes(p)) err(`${w}: unknown prop "${p}"`); });
  ['low', 'high', 'full'].forEach((c) => {
    if (!s.obst[c]) return err(`${w}: missing ${c} obstacle`);
    if (!K.obstacle.includes(s.obst[c][0])) err(`${w}: unknown ${c} obstacle style "${s.obst[c][0]}"`);
    if (!s.obst[c][1]) err(`${w}: ${c} obstacle has no name`);
  });
  if (s.hat && !K.hat.includes(s.hat)) err(`${w}: unknown hat "${s.hat}"`);
  ['road', 'line', 'side', 'side2', 'edge'].forEach((g) => { if (!/^#[0-9a-f]{6}$/i.test(s.ground[g] || '')) err(`${w}: ground.${g} is not a #rrggbb colour`); });
  s.sky.forEach((c) => { if (!/^#[0-9a-f]{6}$/i.test(c)) err(`${w}: sky colour "${c}" is not #rrggbb`); });

  if (s.words.length !== 4) err(`${w}: expected 4 words, found ${s.words.length}`);
  s.words.forEach((wd) => {
    words++;
    if (wd.length !== 3 || !wd[0] || !wd[1] || !wd[2]) err(`${w}: word ${JSON.stringify(wd)} is incomplete`);
    if (seenWords.has(wd[0])) err(`${w}: word "${wd[0]}" already used in ${seenWords.get(wd[0])}`);
    seenWords.set(wd[0], w);
    if (HOLY.some((h) => wd[0].includes(h))) err(`${w}: word "${wd[0]}" contains a name of God — not allowed as catchable letters`);
    Array.from(wd[0]).forEach((ch) => {
      if (!allowed.has(ch)) err(`${w}: letter "${ch}" (U+${ch.codePointAt(0).toString(16).toUpperCase()}) in "${wd[0]}" is not in the ${lang} alphabet`);
      if (!D.letters[ch]) err(`${w}: letter "${ch}" in "${wd[0]}" has no entry in the letter list`);
    });
  });

  need(s.item, ['kind', 'title', 'text', 'ref'], `${w} item`);
  if (s.part === 0) { if (s.item.kind !== 'scroll') err(`${w}: Part 1 scenes hide a scroll`); scrollNs.add(s.item.n); if (s.cameo) err(`${w}: no cameos in Part 1`); }
  else { if (s.item.kind !== 'stamp') err(`${w}: Part 2 scenes hide a stamp`); stamps++; }

  if (s.cameo2 && !s.cameo) err(`${w}: has a second guest but no first guest`);
  [s.cameo, s.cameo2].filter(Boolean).forEach((cm) => {
    cameos++;
    need(cm, ['id', 'kind', 'type', 'name', 'known', 'gift', 'giftText'], `${w} cameo`);
    if (seenCameos.has(cm.id)) err(`${w}: duplicate cameo id "${cm.id}"`); seenCameos.add(cm.id);
    if (!K.cameo.includes(cm.kind)) err(`${w}: unknown cameo drawing "${cm.kind}"`);
    if (!['fly', 'magnet', 'double', 'slow', 'dash', 'shield', 'coins', 'feast', 'clear', 'heart', 'arm', 'skate'].includes(cm.gift)) err(`${w}: unknown cameo gift "${cm.gift}"`);
  });
  if (!s.cameo && s.part === 1 && !s.quiet) err(`${w}: Part 2 scene has neither a cameo nor a quiet note`);
});

if (perPart[0] !== 10 || perPart[1] !== 20) err(`expected 10 + 20 scenes, found ${perPart.join(' + ')}`);
for (let n = 1; n <= 10; n++) if (!scrollNs.has(n)) err(`Wisdom scroll ${n} is missing`);
if (D.alphabet.ar.length !== 36) err(`Arabic letter list should have 28 + 8 = 36 entries, found ${D.alphabet.ar.length}`);
D.alphabet.ur.forEach((ch) => { if (!D.letters[ch]) err(`Urdu letter "${ch}" has no entry in the letter list`); });
D.parts.forEach((p) => p.cheers.forEach((c) => { if (c.length !== 3) err(`cheer ${JSON.stringify(c)} is incomplete`); }));
const badge = (id) => D.badges.find((b) => b.id === id);
['word1', 'word25', 'word120', 'wisdom10', 'stamp20', 'guests', 'tyre', 'arm', 'feast', 'skate', 'pillars', 'summit', 'flawless'].forEach((id) => { if (!badge(id)) err(`badge "${id}" is missing`); });
if (words !== 120) err(`badge text says 120 words but there are ${words}`);
if (cameos !== 20) err(`expected 20 cameo guests, found ${cameos}`);

console.log(`scenes: ${D.scenes.length} (${perPart[0]} stories + ${perPart[1]} Pakistan)`);
console.log(`words: ${words} (${seenWords.size} unique) · scrolls: ${scrollNs.size} · stamps: ${stamps} · cameos: ${cameos}`);
console.log(`letters: ${Object.keys(D.letters).length} · facts: ${D.facts.length} · badges: ${D.badges.length}`);
if (errors.length) { console.error(`\n${errors.length} problem(s):`); errors.forEach((e) => console.error(' - ' + e)); process.exit(1); }
console.log('\nAll checks passed.');
