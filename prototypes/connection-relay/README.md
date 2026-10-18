# Connection Relay

Six new finite Connection puzzles (2026-10-18), asked for by the owner as "more new
connection run puzzles". Playtest only: nothing here changes the shipped game.
Private Artifact: https://claude.ai/artifact/PNBxjsFMGsZpJPRaKoJcL9 (finished and
in-progress attempts save to its db collection `runs`, study `connection-relay-v1`).

## Same rules as the shipped Connection puzzles

The page runs `src/connection-rules.js`, `src/connection-math.js` and
`solver/engine.js` unchanged: three connections shown one at a time, a shared move
budget, refills 2 to 128 from a fixed seed (Start over replays the same draws), earned
removals at 2,048. No rule, refill or scoring change.

## What is new: each connection feeds the next

The owner's principle (core idea plus one element that makes steps depend on each
other; Recipe board 8) applied to Connections. The tile a connection makes is part of a
later connection, and the marker on it follows that tile (`relay-play.js`): when gravity
drops the tile, ① drops with it; when a finish lands somewhere else, ① is wherever it
landed. If the tile is merged into some other chain or removed, the marker stays at its
last place, as in the shipped fixed-place rules, so a puzzle never locks. This is the
"moving-tile" goal the owner proposed in PDL-012; `src/connection-rules.js` still
decides every move.

| Board | Kind | Targets | Witness moves | Budget | Ordinary player wins at budget |
|---|---|---|---|---|---|
| Bring Them Together | reunion: goals 1 and 2 each make a tile; goal 3 joins them | 64 → 128 → 384 | 7 | 14 | 60/60 |
| Meet in the Middle | reunion | 32 → 128 → 384 | 8 | 14 | 59/60 |
| Big Finish | reunion | 64 → 256 → 960 | 7 | 20 | 50/60 |
| Keep Growing | relay: the next goal starts on the tile just made | 32 → 128 → 384 | 8 | 14 | 60/60 |
| Ladder Up | relay | 16 → 128 → 384 | 7 | 16 | 48/60 |
| Climb High | relay | 32 → 128 → 384 | 8 | 14 | 51/60 |

Each goal shows a one-line hint naming the dependency. `relay-play.test.js` checks the
followed positions against the engine, every witness, a finish in the other direction,
and the never-locks case.

## Baseline and the decision it should change (PDL rule)

- **Baseline:** the owner's captured build-and-harvest play (PDL-008): take the biggest
  convenient merge. In Connection play (PDL-014 to PDL-016) each goal was built on its
  own; nothing carried from one goal to the next.
- **Exact state:** Keep Growing after witness move 2 (connection 1 done). ① is the 32
  just made, fourth column, fourth row from the top; goal 2 is 128. The biggest chain on
  the board (448, eight tiles) can run through that 32 or through another 32 two columns to its left.
  Build-and-harvest has no reason to prefer either. Through ① it spends the made tile:
  goal 2 falls back to an ordinary fixed-place goal on whatever drops in, and the 32
  head start is gone. The other route keeps the relay. `relay-play.test.js` replays this state.
- **Open:** whether the owner notices or cares. Owner play decides; nothing here is a
  difficulty or enjoyment claim.

## How boards were made and screened

- `search.js` builds random 6 × 5 start grids (2 to 128) and authors three goals on
  each by play: from the current board, one or two ordinary setup moves that leave the
  needed made tiles alone (their positions are tracked through each move), then a goal
  chain of 3 to 7 tiles whose ends are at least two steps apart and that starts on the
  made tile. Each goal must not be completable on the board where it appears, and the
  first two targets are powers of two so the made tile can chain again.
- `finalize.js` checks every linked marker sits on its made tile along the witness,
  rejects a goal whose marked tile is already as big as its target when it appears,
  writes `levels.js` and `witnesses.json`, and sets the budget: at least 14, at least
  witness + 6, and raised by 2 until a crude ordinary player wins 48 of 60 fresh tries.
- The ordinary player: finishes the goal when it can; else makes a move after which
  it can (random among those); else a random merge that leaves the marked tiles and
  later-needed made tiles alone and stays at or under half the target. No undo, no
  preview, no look-ahead past one move.
- About 3,900 seeds were tried; most failed to author or failed the screen. The
  "home" kind (all goals on the same two places) no longer authored cleanly once made
  tiles are tracked, so it was dropped. `drafts.jsonl` keeps the six chosen drafts so
  `node finalize.js drafts.jsonl` reproduces `levels.js`.

Build the page: `node prototypes/connection-relay/build.js <out.html>`.
Plays save under study `connection-relay-v2` (v1 boards were replaced before any play).

## Limits

The ordinary player and witness show the boards are winnable and forgiving for plain
goal-seeking play; they say nothing about fun or difficulty for a person. Owner play
decides. The goal hints are new text on this page only.
