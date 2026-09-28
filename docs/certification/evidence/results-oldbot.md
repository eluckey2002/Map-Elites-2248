# Recompute with the bot as of commit 8e1e232

> **Superseded by the full run.** This file records the first, 10-level sample (10/10 exact). The same method was then run on all 50 levels with `recompute-levels-1-50.js`; its complete output, `recompute-levels-1-50.out.txt`, shows 50/50 exact and is what the certificate relies on.


## Method (reproducing 8e1e232's `solver/game-tester.js`, `powers2` policy)

Read directly from `solver/game-tester.js` at commit `8e1e232` (`/private/tmp/claude-501/-Users-eluckey-Developer/1258c844-d8c5-416f-bf4b-f74620be66ea/scratchpad/oldbot/repo`, the exact commit that set DECISION-0003 / RESULT-0008 targets):

- **Policy**: `powers2` — tile scale is fixed per power-of-two chapter (1/2/4/8/16 across levels 1-10/11-20/21-30/31-40/41-50); demand "sawtooths" linearly within each chapter between two anchor values, resetting down at each chapter break.
- **Chapters** (scale, demand range): `1-10: 1, [0.09,0.80]`; `11-20: 2, [0.55,0.85]`; `21-30: 4, [0.58,0.90]`; `31-40: 8, [0.62,0.96]`; `41-50: 16, [0.66,1.06]`.
- **Play**: live bot (`solver/bot.js` `chooseMove`) plays each level with `solver/engine.js`, 150 seeds (0-149), lookahead RNG seeded from `987654321 + move index` (must match `solver/sweep.js`).
- **Median**: 150 final scores sorted, `quantile(0.5)` (index `floor(150*0.5)=75`, i.e. the 76th-lowest score — a "lower-median" convention, not an average of the two middle values).
- **Target**: `roundTarget(median * demand)` — rounds down to a step of 10/50/100/1000 depending on magnitude, floor at one step.
- This is identical in every particular (chapters, seeds, RNG base, rounding, quantile convention) to the recompute script the prior agent ran against today's bot (`job3.js`), confirming the two runs are apples-to-apples except for which bot/engine code executed the moves.

Adapted `job3.js` only by pointing its `ROOT` at the 8e1e232 checkout and pulling `shippedTarget`/`shippedScale` from `origin/main`'s `src/game.js` (not the 8e1e232 checkout's own `src/game.js`, which the task specified as the comparison baseline) — level definitions (moves, grid, blockers) used for play came from the 8e1e232 checkout itself, since that's the code whose scoring behavior is under test.

## Per-level results (10 sampled, seed 20260927)

| Level | Scale | Median (8e1e232 bot) | Demand | Recomputed target | Shipped target (origin/main) | Match |
|---|---|---|---|---|---|---|
| 4  | 1  | 5,784  | 0.3267 | 1,850  | 1,850  | yes |
| 8  | 1  | 5,224  | 0.6422 | 3,350  | 3,350  | yes |
| 15 | 2  | 11,876 | 0.6833 | 8,100  | 8,100  | yes |
| 16 | 2  | 11,632 | 0.7167 | 8,300  | 8,300  | yes |
| 17 | 2  | 11,764 | 0.75   | 8,800  | 8,800  | yes |
| 24 | 4  | 19,936 | 0.6867 | 13,600 | 13,600 | yes |
| 30 | 4  | 24,832 | 0.9    | 22,300 | 22,300 | yes |
| 36 | 8  | 46,064 | 0.8089 | 37,200 | 37,200 | yes |
| 39 | 8  | 35,312 | 0.9222 | 32,500 | 32,500 | yes |
| 48 | 16 | 68,384 | 0.9711 | 66,400 | 66,400 | yes |

## Runtime

78 seconds wall (10 levels x 150 seeds), vs. ~40 minutes for the prior agent's 10-level run against today's bot — consistent with the 8e1e232-era bot needing far fewer moves/less lookahead work per seed (median scores here are roughly 25-30% lower than the same levels' medians under today's bot in `job3.out`, matching the certification's ~28% overshoot finding).

## Verdict

10/10 exact matches. The shipped targets in `src/game.js` on `origin/main` reproduce exactly — to the target dollar — what commit 8e1e232's own `game-tester.js` `powers2` policy would have derived, using the bot and engine as they existed at that commit. This confirms the ~28% gap the certification found is not a bug in how targets were originally set (DECISION-0003 / RESULT-0008 was computed correctly against the bot of the day); it is bot/engine drift since 2026-08-12 — the live bot today scores measurably higher than it did at 8e1e232, which raises today's recomputed medians (and therefore targets) above the shipped ones uniformly, without the shipped targets themselves being wrong relative to their own baseline.
