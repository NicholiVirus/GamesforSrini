# GamesforSrini

## Quran Runner — Pakistan Journey

A three-lane running game that teaches Arabic and Urdu words while you run through
30 scenes: ten stories from the Quran, then twenty stops across Pakistan, from the
Arabian Sea to the top of K2. A full run takes about 30 minutes.

**Play it:** open `quran-runner/index.html` in a browser. No install, no build step.
Some browsers block saving when a page is opened straight from disk; to keep your
progress, serve the folder instead:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/quran-runner/`.

### How to play

| Action | Keyboard | Touch |
|---|---|---|
| Change lane | ← → (or A / D) | Swipe left / right |
| Jump low things | ↑, W or Space | Swipe up or tap |
| Slide under high things | ↓ or S | Swipe down |
| Pause | P or Esc | Pause button |

- Catch the glowing letters in order to spell each word.
- Find the hidden **Wisdom scroll** (Part 1) or **History stamp** (Part 2) in every scene.
- Three bumps and you restart the scene. Coins and words are never lost.

### The route

**Part 1 · The Stories** (Arabic words, ten Wisdom scrolls from Surat al-Isra 17:23–37)

1. The First Garden
2. The Ark of Nuh
3. The Cool Fire
4. The Valley of Zamzam
5. The Well of Yusuf
6. The Parted Sea
7. The Great Fish
8. The Cave of the Sleepers
9. The Mountain of Light (Hira)
10. The Kaaba

**Part 2 · Pakistan** (Urdu words, twenty History stamps, cameo guests)

| # | Stop | Key date | Roadside guest |
|---|---|---|---|
| 11 | The Makran Coast | 711 CE · 1958 | Mooroo |
| 12 | Karachi, City of Lights | 14 August 1947 | Irfan Junejo |
| 13 | Makli & Thatta | 727 CE · 1647 | Abida Parveen |
| 14 | Mohenjo-daro | about 2500 BCE | **The Tyre Launchers** |
| 15 | Derawar Fort | rebuilt 1732 | Chahat Fateh Ali Khan |
| 16 | Multan, City of Saints | 1320–1324 | Arshad Nadeem |
| 17 | Lahore Fort & Shalimar | 1631 · 1641 | Ali Sethi & Shae Gill |
| 18 | Badshahi Mosque | 1673 | none (a place of prayer) |
| 19 | Lahore Food Street | tonight | **Mr Greedy** |
| 20 | Minar-e-Pakistan | 23 March 1940 | Momin Saqib |
| 21 | Gaddafi Stadium | 25 March 1992 | Sarim Akhtar |
| 22 | Sialkot | 9 November 1877 | Mubashir Saddique |
| 23 | Rohtas Fort & the Grand Trunk Road | 1541 | **The Arm Wrestlers** |
| 24 | Khewra Salt Mine | legend: 326 BCE | The Salt-Licking Horse |
| 25 | Islamabad | 1967 · 1986 | Arshad Khan, the Chaiwala |
| 26 | Nathia Gali | February 2021 | Dananeer Mobeen |
| 27 | Taxila | 500 BCE – 500 CE | Shoaib Akhtar |
| 28 | Peshawar & the Khyber Pass | thousands of years | Jahangir Khan |
| 29 | The Karakoram Highway & Hunza | 1979 | Zenith Irfan |
| 30 | K2, the Roof of the World | 31 July 1954 | Samina Baig |

Three guests change how the game plays:

- **The Tyre Launchers** launch you into the sky on a spinning tyre. In Part 2 the
  flying power-up is a tyre launch instead of a flying carpet.
- **Mr Greedy** starts a samosa feast: the whole road fills with samosas.
- **The Arm Wrestlers** start a tap-as-fast-as-you-can arm-wrestling duel.

### Content rules

- **Nobody holy is shown.** Part 1 scenes are places, objects, plants and animals only.
- **No name of God is ever a letter you catch.**
- **Verses are given by reference** and retold in simple English; no verse text is quoted.
- **Cameo guests appear only in Part 2**, drawn as simple cartoons. Each is described
  by what they are publicly known for, and the game puts no invented words in their mouths.
- This is a fan-made learning game. Nobody named in it made or endorsed it.

**Have someone who reads Arabic and Urdu, and who knows the history, look it over
before children play.** The spellings, references and dates were checked carefully,
but a second pair of eyes is worth it.

### Files

| File | What it holds |
|---|---|
| `quran-runner/js/data.js` | All content: scenes, words, stories, facts, cameos, shop, badges, on-screen text |
| `quran-runner/js/art.js` | Every picture, drawn with canvas shapes (no image files) |
| `quran-runner/js/game.js` | The engine: running, spawning, collisions, screens, saving |
| `quran-runner/js/audio.js` | Sound effects and the background beat (full, drum-only or off) |
| `tools/check-data.js` | Checks `data.js` for gaps and spelling-set mistakes |

To change a word, a fact or a guest, edit `data.js` only, then run the checker:

```bash
node tools/check-data.js
```

### Testing shortcuts

- `quran-runner/index.html?scene=14` opens scene 14 directly.
- `quran-runner/index.html?scene=14&secs=10` shortens every scene to 10 seconds.
