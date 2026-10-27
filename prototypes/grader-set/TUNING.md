# Grader set v1: tuning rules (committed before tuning runs)

Status: plan only, not evidence or a ledger claim (same standing as PLAN.md). The owner said yes to tuning on 2026-10-27.

## Where it starts

The owner played 14 of the 18 boards and won all 14. Scored by PLAN.md, the pre-grade agreed on 30 of 64 pairs (47%),
which is chance. Unplayed: `feed-the-next-b`, `make-it-here-b`, `shared-material-b`, `see-it-coming-c`.

## Boards

- Tuning boards: every scored board that is not a `-b` board. That is 11 boards today.
- Held-out boards: the six `-b` boards fixed in PLAN.md. Only 3 are played so far (`see-it-coming-b`,
  `through-the-gate-b`, `the-drought-b`), which gives at most 2 pairs. The held-out check is reported, but it cannot
  decide anything until the owner plays the other three.

## The grader and what can change

A grader plays each board 40 times with a fixed random stream per board (seed × 31 + 7) and turns the games into one
difficulty number. `tune.js` holds the code. Settings start at the pre-grade: the greedy one-move player, 20% random
moves, a 40-move limit, and difficulty = the share of games lost.

One setting changes per round, in this fixed order:

1. Move limit: 40 moves, or the board's real limit.
2. Difficulty number: share of games lost, or average limit used (a loss counts as 2).
3. Random moves: 20%, 0%, 10%, 30%.
4. Player: greedy one-move, or a small planner (beam 20, looks up to 6 moves ahead, re-plans every move).

The first option of each round is the current setting. A new option is kept only if it raises agreement on the tuning
boards above the best so far; a tie keeps the earlier one. No other settings and no second pass are tried in this run.

## Report

Agreement on the tuning boards after each round, the final settings, and the held-out agreement of the pre-grade and
the final grader. With 11 tuning boards and all games won, the result is a direction at most.

## Result of run 1 (2026-10-27)

Raw output: `tune-run-1.txt` (`node prototypes/grader-set/tune.js <runs dir>`, the 14 owner runs of 2026-10-26).

| Round | Kept | Agreement on 11 tuning boards (36 pairs) |
|---|---|---|
| Start (pre-grade) | greedy, 20% random, 40 moves, share lost | 26% |
| 1 Move limit | 40 moves (board limit 25%) | 26% |
| 2 Difficulty number | share lost (average limit used tied) | 26% |
| 3 Random moves | 0% (10%: 25%, 30%: 31%) | 42% |
| 4 Player | planner | 56% |

Held-out: 3 played boards, 2 pairs; pre-grade and final grader both 25%. That decides nothing.

Reading, plainly:

- The pre-grade ran backwards on the tuning boards (26%): boards the noisy bot lost most were boards the owner found easy.
- The final grader is no real gain. With 0% random moves every game on a board is the same, so it grades each board
  only "planner wins" or "planner loses". It loses 4 of 14 boards, and most of its 56% comes from ties counting half.
- All 14 games were won, so the owner's score rests on undos. Undos may be the owner trying moves out rather than
  struggling.

Next options (not run; each needs its own rules first): the owner plays the 4 unplayed boards, so the held-out check
has pairs; or a planner with some random moves, which grades in steps instead of yes/no.
