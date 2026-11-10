# GamesforSrini

## Pakistan Runner

A 3D running game in the style of Subway Surfers. You run along train tracks,
roads and desert paths, dodge, jump, roll, ride ramps up onto the roofs of trains,
buses and jingle trucks, and spell Arabic and Urdu words as you go.

There are 35 scenes of about 52 seconds each, roughly 30 minutes in all: ten stories
from the Quran, then twenty-five stops across Pakistan, from the Arabian Sea to the
top of K2 and home to Islamabad for the Independence Day fireworks.

**Play it:** open `pakistan-runner/index.html` in a browser. No install, no build step,
no internet needed. The browser must support WebGL (every modern browser does).
Some browsers block saving when a page is opened straight from disk; to keep your
progress, serve the folder instead:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/pakistan-runner/`.

### How to play

| Action | Keyboard | Touch |
|---|---|---|
| Change lane | ← → (or A / D) | Swipe left / right |
| Jump | ↑, W or Space | Swipe up or tap |
| Roll under things (in the air: drop fast) | ↓ or S | Swipe down |
| Pause | P or Esc | Pause button |

- **Ramps** lead up onto the roofs of trains, buses, trucks, wagons and walls. Run along
  the roofs and hop from one to the next.
- **Side bumps:** changing lane into the side of something makes you stumble, and the
  chaser appears behind you. Two stumbles close together cost a heart.
- **Head-on bumps** cost a heart. Three hearts gone and you restart the scene. Coins and
  words are never lost.
- Catch the glowing letters in order to spell each word.
- Find the hidden **Wisdom scroll** (Part 1) or **History stamp** (Part 2) in every scene.

### Power-ups

| Part 1 | Part 2 | What it does |
|---|---|---|
| Crescent shield | Crescent shield | Blocks one bump |
| Flying carpet | Tyre launch | Soar over everything and collect sky coins |
| Magnet | Magnet | Pulls coins to you |
| 2× dinars | 2× rupees | Every coin counts twice |
| Sakinah (calm) | Chai break | Everything slows down |
| Desert wind | Express dash | Smash through anything |
| Swift sandals | Peshawari chappals | Jump twice as high |

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

**Part 2 · Pakistan** (Urdu words, twenty-five History stamps, roadside guests)

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
| 19 | Lahore Food Street | tonight | **Mr Greedy**, then **Ibra Raza** |
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
| 31 | Deosai, Land of Giants | national park since 1993 | The Deosai Brown Bear |
| 32 | Shandur Polo Festival | every July | The Polo Riders |
| 33 | Swat Valley | Nobel Peace Prize, 2014 | Malala Yousafzai |
| 34 | A Mehndi Night | wedding season | The Dhol Players |
| 35 | Jashn-e-Azadi | 14 August | **every guest lines the road**, under fireworks |

Four guests change how the game plays:

- **The Tyre Launchers** launch you into the sky on a spinning tyre.
- **Mr Greedy** fills the road with samosas.
- **Ibra Raza**, the roller-skating waiter, skates alongside you and hands you roller
  skates: a fast, unstoppable glide over a trail of coins while the beat speeds up.
- **The Arm Wrestlers** start a tap-as-fast-as-you-can arm-wrestling duel.

### Content rules

- **Nobody holy is shown.** Part 1 scenes are places, objects, plants and animals only.
- **No name of God is ever a letter you catch.**
- **Verses are given by reference** and retold in simple English; no verse text is quoted.
- **Cameo guests appear only in Part 2**, drawn as simple cartoon standees. Each is
  described by what they are publicly known for, and the game puts no invented words
  in their mouths.
- This is a fan-made learning game. Nobody named in it made or endorsed it.

**Have someone who reads Arabic and Urdu, and who knows the history, look it over
before children play.** The spellings, references and dates were checked carefully,
but a second pair of eyes is worth it.

### Files

| File | What it holds |
|---|---|
| `pakistan-runner/js/data.js` | All content: scenes, words, stories, facts, guests, shop, badges, on-screen text, and each scene's 3D settings |
| `pakistan-runner/js/world.js` | The 3D world: track, scenery, trains and obstacles, the runner, chasers, weather |
| `pakistan-runner/js/art.js` | 2D pictures: the painted skyline behind the 3D world, guest standees, icons |
| `pakistan-runner/js/game.js` | The engine: running, jumping, rolling, roofs, spawning, collisions, screens, saving |
| `pakistan-runner/js/audio.js` | Sound effects and the background beat (full, drum-only or off) |
| `pakistan-runner/js/vendor/three.min.js` | The three.js 3D library (r149, MIT licence) |
| `tools/check-data.js` | Checks `data.js` for gaps, wrong letters and missing models |

To change a word, a fact or a guest, edit `data.js` only, then run the checker:

```bash
node tools/check-data.js
```

### Testing shortcuts

- `pakistan-runner/index.html?scene=14` opens scene 14 directly.
- `pakistan-runner/index.html?scene=14&secs=10` shortens every scene to 10 seconds.
- `pakistan-runner/index.html?low=1` turns off shadows for slower devices
  (phones and tablets get this automatically; `?low=0` turns shadows back on).
