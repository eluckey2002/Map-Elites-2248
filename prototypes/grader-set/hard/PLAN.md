# Grader set v2, harder boards: scoring plan (committed before the owner plays)

Status: plan only. Nothing here is evidence or a ledger claim (same standing as `../PLAN.md`).

## Why

The owner won all 14 v1 boards played and never gave up, so the only struggle signal was undos (`../TUNING.md`,
run 1). On 2026-10-27 the owner chose "Harder boards": a set where losing is possible, so the grader has losses to
match.

## The boards

`make-hard.js` makes 12 boards, 2 per v5 keeper. The rules, goals, walls, spots, ★, gate and refills are the v5
ones; only the start layout (and refill seed) changes, made the same way as v1. Move limits use the same loose v5 rule
(30 refill draws), never the solver's best line plus a small slack, and are at least the board's own beam line + 4.
A board is picked as hard when a small planner (beam 20, up to 6 moves ahead, no random moves) loses it within that
limit; ties go to the lowest noisy ordinary-player win rate. Every board is checked winnable within its limit.

## How it is scored

Exactly as `../PLAN.md`: struggle score from the owner's first run per board (gave up / out of moves / no chain left
= 3; won with 3+ undos = 2; won with 1-2 undos or above 75% of the limit = 1; else 0); runs left open are not scored;
if more than 4 of the 12 are unscored the session is too thin.

Report, in this order:

1. How many boards the owner lost or gave up. If none, harder layouts alone did not make losses, and that is the
   finding.
2. Agreement of the planner grader (does it lose the board) and of the v1 pre-grade with the owner's struggle, over
   v2 boards only, then over v1 + v2 boards together.

No tuning happens in this step; a later tuning run gets its own rules first, with the owner's OK.
