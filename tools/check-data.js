#!/usr/bin/env node
/* Checks pakistan-runner/js/data.js for gaps and mistakes, including that every
 * picture and 3D model it names really exists in art.js and world.js.
 * Run:  node tools/check-data.js
 */
'use strict';
const path = require('path');
const dir = path.join(__dirname, '../pakistan-runner/js');
global.window = { THREE: require(path.join(dir, 'vendor/three.min.js')) };
require(path.join(dir, 'art.js'));
require(path.join(dir, 'data.js'));
require(path.join(dir, 'world.js'));
const D = window.QR.DATA, A = window.QR.Art.keys, Wk = window.QR.World.keys;

const errors = [];
const err = (m) => errors.push(m);
const need = (obj, fields, where) => fields.forEach((f) => { if (obj[f] === undefined || obj[f] === null || obj[f] === '') err(`${where}: missing "${f}"`); });
const GIFTS = ['fly', 'magnet', 'double', 'slow', 'dash', 'shield', 'jump', 'coins', 'feast', 'clear', 'heart', 'arm', 'skate'];
const HOLY = ['الله', 'اللہ'];

const parts = [0, 0];
const seenIds = new Set(), seenWords = new Map(), seenCameos = new Set(), scrollNs = new Set();
let words = 0, cameos = 0, stamps = 0;

D.scenes.forEach((s, i) => {
  const w = `scene ${i + 1} (${s.id})`;
  need(s, ['id', 'name', 'native', 'tr', 'where', 'when', 'banner', 'story', 'ref', 'sky', 'far', 'ground', 'props', 'weather', 'obst', 'chaser', 'coin', 'words', 'item', 'track', 'ride', 'side', 'chase'], w);
  if (seenIds.has(s.id)) err(`${w}: duplicate id`); seenIds.add(s.id);
  parts[s.part]++;
  const lang = D.parts[s.part].lang, allowed = new Set(D.alphabet[lang]);

  // pictures (2D backdrop) and models (3D)
  if (!A.far.includes(s.far.type)) err(`${w}: unknown horizon "${s.far.type}"`);
  if (s.lm && !A.landmark.includes(s.lm.name)) err(`${w}: unknown landmark "${s.lm.name}"`);
  s.props.forEach((p) => { if (!Wk.prop.includes(p)) err(`${w}: no 3D model for prop "${p}"`); });
  ['low', 'high', 'full'].forEach((c) => {
    if (!s.obst[c]) return err(`${w}: missing ${c} obstacle`);
    if (!Wk[c].includes(s.obst[c][0])) err(`${w}: no 3D model for ${c} obstacle "${s.obst[c][0]}"`);
    if (!s.obst[c][1]) err(`${w}: ${c} obstacle has no name`);
  });
  if (!['rails', 'road', 'path'].includes(s.track)) err(`${w}: unknown track "${s.track}"`);
  if (!Wk.ride.includes(s.ride)) err(`${w}: no 3D model for ride "${s.ride}"`);
  if (!Wk.side.includes(s.side)) err(`${w}: no roadside style "${s.side}"`);
  if (!Array.isArray(s.chase) || !Wk.chase.includes(s.chase[0]) || !/^#[0-9a-f]{6}$/i.test(s.chase[1] || '')) err(`${w}: bad chaser ${JSON.stringify(s.chase)}`);
  if (s.hat && !Wk.hat.includes(s.hat)) err(`${w}: unknown hat "${s.hat}"`);
  ['road', 'line', 'side', 'side2', 'edge'].forEach((g) => { if (!/^#[0-9a-f]{6}$/i.test(s.ground[g] || '')) err(`${w}: ground.${g} is not a #rrggbb colour`); });
  (s.sky || []).forEach((c) => { if (!/^#[0-9a-f]{6}$/i.test(c)) err(`${w}: sky colour "${c}" is not #rrggbb`); });
  if (!Array.isArray(s.sky) || s.sky.length !== 3) err(`${w}: sky needs 3 colours`);

  // words
  if (s.words.length !== 4) err(`${w}: expected 4 words, found ${s.words.length}`);
  s.words.forEach((wd) => {
    words++;
    if (wd.length !== 3 || !wd[0] || !wd[1] || !wd[2]) err(`${w}: word ${JSON.stringify(wd)} is incomplete`);
    if (seenWords.has(wd[0])) err(`${w}: word "${wd[0]}" already used in ${seenWords.get(wd[0])}`);
    seenWords.set(wd[0], w);
    if (HOLY.some((h) => wd[0].includes(h))) err(`${w}: word "${wd[0]}" contains a name of God, which is not allowed as catchable letters`);
    Array.from(wd[0]).forEach((ch) => {
      if (!allowed.has(ch)) err(`${w}: letter "${ch}" (U+${ch.codePointAt(0).toString(16).toUpperCase()}) in "${wd[0]}" is not in the ${lang} alphabet`);
      if (!D.letters[ch]) err(`${w}: letter "${ch}" in "${wd[0]}" has no entry in the letter list`);
    });
  });

  // hidden item
  need(s.item, ['kind', 'title', 'text', 'ref'], `${w} item`);
  if (s.part === 0) { if (s.item.kind !== 'scroll') err(`${w}: Part 1 scenes hide a scroll`); scrollNs.add(s.item.n); if (s.cameo) err(`${w}: no cameos in Part 1`); }
  else { if (s.item.kind !== 'stamp') err(`${w}: Part 2 scenes hide a stamp`); stamps++; }

  // guests
  if (s.cameo2 && !s.cameo) err(`${w}: has a second guest but no first guest`);
  [s.cameo, s.cameo2].filter(Boolean).forEach((cm) => {
    cameos++;
    need(cm, ['id', 'kind', 'type', 'name', 'known', 'gift', 'giftText'], `${w} cameo`);
    if (seenCameos.has(cm.id)) err(`${w}: duplicate cameo id "${cm.id}"`); seenCameos.add(cm.id);
    if (!A.cameo.includes(cm.kind)) err(`${w}: no drawing for cameo "${cm.kind}"`);
    if (!GIFTS.includes(cm.gift)) err(`${w}: unknown cameo gift "${cm.gift}"`);
  });
  if (!s.cameo && s.part === 1 && !s.quiet && !s.parade) err(`${w}: Part 2 scene has no cameo, quiet note or parade`);
});

if (parts[0] !== 10) err(`expected 10 story scenes, found ${parts[0]}`);
for (let n = 1; n <= 10; n++) if (!scrollNs.has(n)) err(`Wisdom scroll ${n} is missing`);
if (D.alphabet.ar.length !== 36) err(`Arabic letter list should have 28 + 8 = 36 entries, found ${D.alphabet.ar.length}`);
D.alphabet.ur.forEach((ch) => { if (!D.letters[ch]) err(`Urdu letter "${ch}" has no entry in the letter list`); });
D.parts.forEach((p) => p.cheers.forEach((c) => { if (c.length !== 3) err(`cheer ${JSON.stringify(c)} is incomplete`); }));
Object.keys(D.powerups).forEach((k) => { const p = D.powerups[k]; if (!p.name || p.name.length !== 2 || !p.color || !p.text) err(`power-up "${k}" is incomplete`); });
['word1', 'word25', 'wordAll', 'wisdom10', 'stamps', 'guests', 'tyre', 'arm', 'feast', 'skate', 'pillars', 'summit', 'roof', 'azadi', 'flawless'].forEach((id) => { if (!D.badges.find((b) => b.id === id)) err(`badge "${id}" is missing`); });
const wordBadge = D.badges.find((b) => b.id === 'wordAll');
if (wordBadge && !wordBadge.text.includes(String(words))) err(`"Master of letters" badge text should say ${words} words`);
if (!D.str.blurb.includes(`${D.scenes.length} scenes`) || !D.str.blurb.includes(`${words} words`)) err(`title blurb should mention ${D.scenes.length} scenes and ${words} words`);

console.log(`scenes: ${D.scenes.length} (${parts[0]} stories + ${parts[1]} Pakistan) · about ${Math.round(D.scenes.length * D.sceneSeconds / 60)} minutes`);
console.log(`words: ${words} (${seenWords.size} unique) · scrolls: ${scrollNs.size} · stamps: ${stamps} · guests: ${cameos}`);
console.log(`letters: ${Object.keys(D.letters).length} · facts: ${D.facts.length} · badges: ${D.badges.length} · 3D props: ${Wk.prop.length}`);
if (errors.length) { console.error(`\n${errors.length} problem(s):`); errors.forEach((e) => console.error(' - ' + e)); process.exit(1); }
console.log('\nAll checks passed.');
