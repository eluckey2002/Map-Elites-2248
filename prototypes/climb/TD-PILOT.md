# Self-taught player pilot (2026-10-30)

Observations of these games only, on evan's usual settings (7 values from
8, Equal odds). No claim beyond them.

Training: `train-td.js` on a 32-core Google Spot machine, 15:03 to 17:03 UTC,
alpha 0.1, 899,235 self-play games (training seeds from 1,000,000). Typical
game length rose from 25 to 49 moves in the first 20 minutes, then stayed
near 50; the typical best tile stayed 4096 throughout.

Check: the finished tables on seeds 1 to 100, paired by seed with
`lookahead-strong` from `settings-sweep.jsonl` (variant
`evan-pool-7-start-8`). Best tile is the highest power of 2 reached.
Raw games: `td-pilot.jsonl`.

| Player | Median best tile | Median moves | Median score | Best tile vs look-ahead (higher / lower / same) | Highest |
|---|---|---|---|---|---|
| Self-taught alone (`tdChooser`) | 4096 | 51 | 72,384 | 2 / 90 / 8 | 16384 |
| Self-taught + short look-ahead (`tdLookaheadChooser`) | 4096 | 68 | 129,900 | 9 / 78 / 13 | 65536 |
| Look-ahead, strong (reference) | 32768 | 62 | 326,120 | | |

Neither self-taught player beat the look-ahead bot on these boards.
