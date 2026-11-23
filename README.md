# Ember Duel

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Auttzy/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Auttzy/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A complete, original card duel that runs offline in a desktop browser: you,
the Ember Knight, against the Cinder Warden. Thirty life each, a 24-card
deck, four suits told apart by colour and shape. Played with mouse and
keyboard, with a title screen, a live table, and win and loss screens.

## How to play

- **Mana** grows every turn (1, then 2, up to 10) and refills at the start
  of your turn. Every card costs mana.
- **Flame ▲** (red) deals its power as damage. **Tide ●** (blue) deals
  damage and draws a card. **Leaf ◆** (green) gains block equal to its
  power — block absorbs damage until it is used up. **Stone ■** (amber)
  deals damage and shatters: it removes all of the enemy's block first.
- Draw a card at the start of your turn. Drawing from an empty deck costs
  2 life (fatigue). First duelist at 0 life loses.
- Click a card to select it, click it again (or press Enter) to play it.
  Keys **1–7** select a card in hand, **E** ends your turn, **R** restarts
  from an end screen, **M** mutes the sound.

## The Warden

The Cinder Warden is greedy but readable: it strikes when it can end the
fight, favours Stone while you hide behind block, saves Tide for a thin
hand, and only raises Leaf when its life is low. Watch what it plays and
counter it — block its big turns, shatter its guard, and save your Tide
draws for when your hand runs dry.

## Files

- `game/index.html` + `game/style.css` — the table.
- `game/src/cards.js` — the four suits and the 24-card deck.
- `game/src/engine.js` — the rules: turns, mana, damage, block, fatigue.
- `game/src/ai.js` — the Warden's brain.
- `game/src/render.js` — everything the player sees.
- `game/src/shots.js` — the deterministic `?shot=` scenes used for the
  screenshots (title, table, win, loss).
- `game/src/audio.js` — synthesized WebAudio sound effects, no files.
- `game/src/main.js` — boots the game and wires the controls.
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json`.

## Run it

Serve `game/` with any static server and open it in desktop Chrome — no
build step, no network requests:

```sh
node serve.ts
```

or hand it in with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## The bounty

Built for [make.fun](https://make.fun)'s
[`best-card-game-20261122-1826`](https://make.fun/bounty/best-card-game-20261122-1826)
bounty: make the best card game. The $50 prize pool is shared by the top 10
entries.
