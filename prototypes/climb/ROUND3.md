# Strongest-bot round 3 (2026-10-30/31)

Observations of these games only, on evan's usual settings (7 values from
8, Equal odds). No claim beyond them. Raw games: `round3-checks.jsonl`
(`bestPow2` is the highest power of 2 reached). Every bot is compared seed
by seed on check seeds 1 to 100 with `lookahead-strong` from
`settings-sweep.jsonl` (variant `evan-pool-7-start-8`) and with `la3` from
`step2-checks.jsonl`. `check-bot.js` replays any row.

## Look-ahead 4 moves deep (`la4`)

`lookaheadChooser({depth: 4, widths: [8, 6, 4, 3], samples: [4, 2, 2], leafPlays: 2})`,
on Google machines (Spot machines were taken back three times; the boards
they finished were kept and the rest rerun), about $2.20.

## Self-taught in stages, from strong-bot boards (`tds`)

`tds.js`: the 6-square tables of `td6.js`, one set per stage (pool climbs
0, 1, 2, 3 or more); an untouched entry reads the stage below. `train-tds.js`
started half its games from one of 51,405 boards that the 2-deep bot reached
on seeds 3,000,000 to 3,000,799 (`collect-boards.js`). Training: 16-core
Google Spot machine, 01:18 to 02:26 UTC, alpha 1, about 1.06 million games
on seeds from 200,000,000, about $0.19. It was stopped by the rule set
before the run: the 20-board checks at 30 minutes and at 1 hour were both
median 2048, below the 6-square learner's 4096. The check below uses the
1-hour save. Training log (fresh-board games only): `tds-training.jsonl`.

## Check

| Player | Median best tile | Median moves | vs look-ahead 2 deep (higher / lower) | vs look-ahead 3 deep (higher / lower) | Highest |
|---|---|---|---|---|---|
| Look-ahead 4 deep (`la4`) | 262144 | 74 | 78 / 11 | 60 / 35 | 33554432 |
| Self-taught in stages (`tds`) | 2048 | 35.5 | 0 / 95 | | 8192 |

A 4-deep game took a median of about 46 minutes on one core (3 deep: about
5 minutes).
