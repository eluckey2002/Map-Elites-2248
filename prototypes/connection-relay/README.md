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
other; Recipe board 8) applied to Connections. In every board the tile a connection
makes sits on its ② and is part of a later connection:

| Board | Kind | Targets | Witness moves | Budget | Ordinary player wins at budget |
|---|---|---|---|---|---|
| Bring Them Together | reunion: goals 1 and 2 each leave a tile; goal 3 joins them | 32 → 256 → 704 | 6 | 14 | 59/60 |
| Back Again | home: all three use the same two places | 64 → 128 → 448 | 8 | 14 | 58/60 |
| Same Two Spots | home | 64 → 128 → 384 | 8 | 14 | 56/60 |
| Keep Growing | relay: the next goal uses the tile just made | 64 → 128 → 320 | 8 | 14 | 53/60 |
| Big Finish | relay | 64 → 128 → 512 | 8 | 14 | 51/60 |
| Ladder Up | relay | 32 → 128 → 384 | 7 | 21 | 48/60 |

Each goal shows a one-line hint that names the dependency ("End on ②. The tile you
make there is part of the next connection."). `finalize.js` checks every hint against
the marker layout.

## How boards were made and screened

- `search.js` builds random 6 × 5 start grids (2 to 128) and authors three goals on
  each by play: from the current board, one or two ordinary setup moves, then a goal
  chain of 3 to 7 tiles whose ends are at least two steps apart, under the kind's
  constraint. Each goal must not be completable on the board where it appears, and
  the first two targets are powers of two so the made tile can chain again.
- `finalize.js` orders markers (② is where the witness leaves its tile), rejects a
  goal whose marked tile is already as big as its target, writes `levels.js` and
  `witnesses.json`, and sets the budget: at least 14, at least witness + 6, and raised
  by 2 until a crude ordinary player wins 48 of 60 fresh tries.
- The ordinary player: finishes the goal when it can; else makes a move after which
  it can (random among those); else a random merge that leaves marked tiles alone and
  stays at or under half the target. No undo, no preview, no look-ahead past one move.
- About 300 drafts were screened; most failed the ordinary-player screen. `drafts.jsonl`
  keeps the six chosen drafts so `node finalize.js drafts.jsonl` reproduces `levels.js`.

Build the page: `node prototypes/connection-relay/build.js <out.html>`.

## Limits

The ordinary player and witness show the boards are winnable and forgiving for plain
goal-seeking play; they say nothing about fun or difficulty for a person. Owner play
decides. The goal hints are new text on this page only.
