# Strongest-bot steps 1 and 2 (2026-10-30)

Observations of these games only, on evan's usual settings (7 values from
8, Equal odds). No claim beyond them. Raw games: `step2-checks.jsonl`
(one row per bot and seed; `bestPow2` is the highest power of 2 reached).
Every bot was compared seed by seed, on check seeds 1 to 100, with
`lookahead-strong` from `settings-sweep.jsonl` (variant
`evan-pool-7-start-8`). `check-bot.js` replays any row.

## Step 1: look-ahead 3 moves deep (`la3`)

`lookaheadChooser({depth: 3, widths: [8, 6, 4], samples: [4, 2], leafPlays: 2})`,
run on a 32-core Google Spot machine (about 15 minutes, about $0.09).

## Step 2: self-taught, 6-square view (`td6`, `td6-la3`)

`td6.js` is the paper-style learner: 38 tables, each reading a 2x3 or 3x2
block of squares, mirrored left-right, with each entry's step scaled by
how consistently its errors point one way (temporal coherence). Training:
`train-td6.js` on a 32-core Google Spot machine, 17:55 to 20:46 UTC,
alpha 1, 1,858,796 self-play games on seeds from 100,000,000, about $0.96.
Typical game length rose from 25 to about 48 moves in the first 80 minutes,
then stayed near 50; the typical best tile stayed 4096 after the first few
minutes. Training log: `td6-training.jsonl`.

`td6` plays the move with the best learned score. `td6-la3` is the step-1
look-ahead with the learned score in place of the play-outs at the end of
each line (`leaf` option of `lookaheadChooser`).

## Check

| Player | Median best tile | Median moves | Best tile vs look-ahead 2 deep (higher / lower / same) | Highest |
|---|---|---|---|---|
| Look-ahead 3 deep (`la3`) | 131072 | 72.5 | 70 / 22 / 8 | 16777216 |
| Look-ahead 3 deep + learned score (`td6-la3`) | 4096 | 53 | 12 / 79 / 9 | 65536 |
| Self-taught 6-square alone (`td6`) | 4096 | 51.5 | 4 / 87 / 9 | 32768 |
| Look-ahead 2 deep, strong (reference) | 32768 | 62 | | |

The deeper look-ahead beat the reference on most boards. The 6-square
learner did not beat it, alone or inside the look-ahead, and stalled at the
same game length as the 4-square pilot (`TD-PILOT.md`).
