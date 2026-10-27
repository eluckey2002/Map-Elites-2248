# Levels 59-70: calibration receipt

Requested by the owner on 2026-10-27 ("the levels went up the high 50s ...
can we create the next levels"). Twelve classic score-target levels: 59-60
close the tile-scale-32 chapter, 61-70 open tile scale 64.

## Where they live

`src/more-levels.js`, not `LEVELS` in `src/game.js`. Level data is part of
the game-rule surface (`solver/game-rule-surface.js`), so a new entry in
`LEVELS` changes `gameRuleIdentity` and the experiment gate refuses it for
RESULT-0047, RESULT-0049 and RESULT-0082 (checked on 2026-10-27 by adding a
level to a scratch copy and running `node tools/verify-experiments.js`). The
browser loads `more-levels.js` straight after `game.js` and appends the
levels; Node code calls `allLevels(LEVELS)`.

## How targets were set

Same rule as levels 51-58: `deriveCandidate` in `solver/level-author.js`
(calib-1 bot, 150 fitting seeds from 0 with no target, target = median x
demand rounded down, then 300 holdout seeds from 100000 at that target with
the default gates: zero lockouts, bomb rate at most 5%, win rate at least
20%). No receipt files are committed; like 54-58 these are shipped play
content, not receipted authoring evidence.

Re-run one level with `node docs/game-design/levels/receipts/levels-59-70/derive.js <level>`
(writes `out-<level>.json` beside the script; do not commit it).

Demand was chosen so the bot's holdout win rate sits where most of 51-58 sit
today (51-58 measured 2026-10-27 on the same holdout: 99%, 99%, 66%, 22%,
93%, 78%, 82%, 83%), easing at the start of each chapter and tightening
toward its last level. The bot outscores a person who plays for score
(EVIDENCE_LEDGER.md, as-of-2026-09-05 note), so these rates are an upper
reference, not a prediction of human win rate.

Three first drafts (60, 68, 70) locked up on fitting or holdout seeds and
were reshaped (blocker positions or moves) before the final run; level 65's
demand was raised from 0.84 to 0.86 to keep the curve rising. The final
shapes are in `shapes.json`.

| Level | Name | Grid | Moves | Min chain | Blockers | Fit median | Demand | Target | Holdout wins | Lockouts | Bombs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 59 | square-stones | 6x6 | 22 | 3 | stone, stone | 122944 | 0.82 | 100000 | 273/300 | 0 | 0 |
| 60 | scale-32-finale | 5x7 | 26 | 4 | stone, ice, bomb | 155712 | 0.86 | 133000 | 218/300 | 0 | 1 |
| 61 | bigger-tiles | 5x7 | 26 | 4 | none | 399744 | 0.78 | 311000 | 281/300 | 0 | 0 |
| 62 | center-stone | 5x7 | 26 | 4 | stone | 333312 | 0.8 | 266000 | 269/300 | 0 | 0 |
| 63 | wide-run | 6x5 | 20 | 3 | none | 264320 | 0.82 | 216000 | 270/300 | 0 | 0 |
| 64 | narrow-pillars | 4x8 | 24 | 3 | stone, stone | 264448 | 0.82 | 216000 | 264/300 | 0 | 0 |
| 65 | double-ice | 5x8 | 26 | 4 | ice, ice | 416512 | 0.86 | 358000 | 265/300 | 0 | 0 |
| 66 | stone-and-bomb | 5x7 | 26 | 4 | stone, bomb | 308864 | 0.84 | 259000 | 256/300 | 0 | 0 |
| 67 | square-frost | 6x6 | 22 | 3 | stone, stone, ice | 284672 | 0.86 | 244000 | 237/300 | 0 | 0 |
| 68 | walled-timer | 5x8 | 28 | 4 | stone, stone, bomb | 321792 | 0.86 | 276000 | 243/300 | 0 | 0 |
| 69 | two-timers-and-ice | 5x7 | 28 | 4 | bomb, bomb, ice | 359552 | 0.88 | 316000 | 244/300 | 0 | 1 |
| 70 | scale-64-finale | 5x8 | 30 | 4 | stone, ice, bomb, bomb | 380416 | 0.9 | 342000 | 222/300 | 0 | 0 |

## Not checked

No person has played these yet; the owner's first plays are the next check.
The bot's numbers say each level is winnable and free of dead boards on 300
seeds, not that it is fun.
