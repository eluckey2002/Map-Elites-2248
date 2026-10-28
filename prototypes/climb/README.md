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
- `page.html`: the phone page. It loads `engine.js` next to it. Finished and
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
