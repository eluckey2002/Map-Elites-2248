# Strongest-bot round 4 (2026-10-31)

Observations of these games only, on evan's usual settings (7 values from
8, Equal odds). No claim beyond them. Raw games: `round4-checks.jsonl`
(`bestPow2` is the highest power of 2 reached). Each bot is compared seed
by seed on check seeds 1 to 100 with `lookahead-strong` (2 deep) from
`settings-sweep.jsonl` (variant `evan-pool-7-start-8`), `la3` from
`step2-checks.jsonl` and `la4` from `round3-checks.jsonl`. `check-bot.js`
replays any row. evan chose "only look-ahead, no learning bot" and then
"All 3 steps" (hand-made board score, speed-up, 5 deep); the move habits
were his own idea, tested at his pick "Test both now (free)".

## Step 1: hand-made board score (`h3`)

`heur.js` scores the board after a move by hand-picked signs (tiles one
chain from merging, equal neighbour pairs, at-risk tiles, stones, game
over) instead of quick random games. `h3` is 3 deep with that score as the
leaf (`check-bot.js h3 <seed> a`). It played fast but lost to plain 3 deep
on almost every board, so it was dropped.

## Step 2: faster search, same moves

`fastchains.js` lists chains the same way and in the same order as the
engine; `fastplay.js` plays the quick random game on flat arrays. Both use
the same random numbers in the same order, so the bot picks exactly the
same moves, only faster (6 to 8 times on one core). `fastplay.test.js`
checks the play-outs against the engine on boards from 4 settings, and 8
replayed check games (`la3` boards 1 to 6, `la4` boards 23 and 28) gave
the same best tile and move count as before.

## Step 3: look-ahead 5 deep (`la5`)

`lookaheadChooser({depth: 5, widths: [8, 6, 4, 3, 3], samples: [4, 2, 2, 2], leafPlays: 2})`
on standard Google machines in us-west1-a. A run-time limit set too short
stopped both machines with 91 of 100 boards done; the 9 unfinished boards
were rerun from the start on a third machine. About $10.89 in all; a 5-deep game took a median of about 2 hours 20 minutes on Google.

## Move habits (evan's idea)

The game rules are unchanged; the bot only picks moves differently.
Options on `lookaheadChooser`, used as `la3-<habits>` in `check-bot.js`:

- `noOdd` (habit "odd"): only chains whose sum is a power of 2, unless no
  such chain exists.
- `noStone` (habit "stone"): skip moves that turn a tile to stone, unless
  every move the bot is weighing does. Whether a move makes stone does not depend on the new
  tiles, so it is checked exactly.
- `objective: 'moves'` (habit "alive"): score each line by moves survived
  instead of points.

All on 3 deep. Boards 33 to 100 ran on one Google machine, boards 1 to 32
here, about $0.92.

Correction: the first run's `noOdd` check used a bit operation, which
JavaScript does on 32 bits, so it was wrong for tiles past 2^32 and the
habit stopped working in the biggest games. It now uses
`Number.isInteger(Math.log2(sum))`, and a test in `lookahead.test.js`
fails on the old check. All 200 games that use `noOdd` were replayed here
with the fix; the rows below are the replays. 163 came out the same as
before (including Google games, so the result does not depend on the
machine) and 37 changed: 15 higher, 15 lower, 7 same tile with a different
length. The medians and the paired counts did not change; the highest
tiles did.

## Check

| Player | Median best tile | Median moves | vs 2 deep (higher / lower) | vs 3 deep (higher / lower) | vs 4 deep (higher / lower) | Highest |
|---|---|---|---|---|---|---|
| Hand-made score, 3 deep (`h3`) | 4096 | 43.5 | 7 / 85 | 2 / 91 | 0 / 97 | 65536 |
| Look-ahead 5 deep (`la5`) | 524288 | 80 | 92 / 3 | 71 / 19 | 61 / 33 | 268435456 |
| 3 deep + no odd tiles (`la3-odd`) | 33554432 | 138.5 | 99 / 0 | 96 / 2 | 93 / 6 | 1099511627776 |
| 3 deep + no stones (`la3-stone`) | 131072 | 73.5 | 68 / 22 | 15 / 9 | 38 / 57 | 8388608 |
| 3 deep + stay alive (`la3-alive`) | 131072 | 193.5 | 72 / 13 | 54 / 33 | 37 / 51 | 536870912 |
| 3 deep + all three (`la3-odd+stone+alive`) | 268435456 | 380 | 99 / 1 | 98 / 1 | 94 / 4 | 2199023255552 |

`seconds` in the rows mixes this machine's cores and Google's (about 3
times slower per game), so it only gives a rough size: a 5-deep game took
hours on Google; a 3-deep game with all three habits took a few minutes
here.

## What this shows, and does not

On these boards, avoiding odd tiles did most of the work, and all three
habits together was the strongest bot of the round. Searching deeper
helped less. Nothing is claimed about other settings, other widths, other
depths with habits, or human play.
