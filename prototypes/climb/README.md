# Climb (phase 1 prototype)

A new game, separate from the shipped 2248 game. `src/game.js` and its levels
are not used or changed. Spec: the "Climb: Phase 1 plan" doc
(https://claude.ai/artifact/6ERyDzVhSQpjMmaGZLjmef), with evan's picks of
2026-10-28: A leave stone as is and measure; B warn one move before stone;
C headline is climbs plus best; D odd tiles (24, 48...) measured only;
E simple start screen plus Advanced; F no extra options; G a test player
checks the defaults first.

This is a prototype to play and measure. It is not ledger evidence and
makes no claim about any bot.

## Files

- `engine.js`: the rules, no screen code. Settings (versioned), seeded drops,
  chains, slides ("climbs"), stranded tiles and the stone rule, game end,
  record and replay. Works in Node and the browser.
- `engine.test.js`: `node --test prototypes/climb/engine.test.js`.
- `players.js`: a random player and a longest-chain player, used by the tests
  and the defaults check. They are not the bots evan will choose.
- `check-defaults.js`: choice G. `node prototypes/climb/check-defaults.js 200`.
  `check-defaults.out.json` holds the run made for the first PR.
- `playout.js`: the play-out player (flat Monte Carlo). For each of up to 12
  chains (the 8 best by points plus 4 random) it plays `plays` quick random
  games to the end on its own random tiles and picks the chain whose games
  scored most. It is fair: it never sees the seed. `playout.test.js` checks
  that and that it only picks legal chains.
- `odds-sweep.js`: plays it on every fall-odds and pool-size setting across
  all cores. `node prototypes/climb/odds-sweep.js out.jsonl 30 8 32` made
  `odds-sweep.out.jsonl` (30 seeds, strengths 8 and 32 play-outs, 960 games).
- `td.js`: the self-taught player (TD(0) learning on after-move boards with
  an n-tuple network). It learns a board score by playing itself; no
  hand-written strategy. `td.test.js` checks fairness, the after-move board,
  the tile tokens, that learning changes the tables, and legal play.
- `train-td.js`: trains it on every core (shared tables, no locks) on evan's
  usual settings. `node prototypes/climb/train-td.js outDir minutes [threads]
  [alpha]` writes `progress.jsonl` every 30 s and `weights.bin` every 5 min,
  and carries on from them if rerun. Training boards use seeds from 1,000,000
  so they never overlap the check boards (seeds 1 to 100).
- `page.html`: the phone page source. `node prototypes/climb/build.js out.html` inlines `engine.js` into one file for the Artifact (a script file published next to the page did not load reliably). Finished and
  quit games are saved to the page's database (collection `games`, the record
  is a JSON string in `record`) and to the phone's own storage as a backup.

## Rules that the engine settles

- Each move: chain merges, the pool may climb (at most once), tiles fall and
  refill from the current pool, stranded tiles are checked, then game end.
- A new tile depends only on the seed, its column and how many tiles have
  dropped into that column. Undo then the same move gives the same tiles.
- Stranded tile = smaller than the smallest falling value. It can still merge
  if a same-value tile, or two half-value tiles, in its own or a neighbouring
  column can still reach it. Tiles only fall, and stone holds what is above
  it, so "reach" means the two tiles' possible rows come within one row of
  each other (same column: no stone between them). A tile that fails is
  marked at risk; if it fails again after the next move it becomes stone.
  Stone never turns back.

## Bots plug in later

`botView(state)` is the fair view: board, pool and odds, no seed, and any
look-ahead must supply its own random numbers. `botView(state,
'future-seeing')` is a labelled measuring mode that sees the real drops. No
bot is chosen here.
