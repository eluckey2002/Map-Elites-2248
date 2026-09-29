---
id: BL-0013
title: Define the policy terms the bot is missing before searching its parameters again
status: proposed
milestone: policy-strategy
depends_on: [BL-0011, BL-0012]
updated: 2026-09-05
---

# BL-0013 — The terms the policy cannot express

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## Why this comes before another parameter search

`RESULT-0017`'s MAP-Elites search over the existing weights returned -0.64%
against the champion — no improvement. The usual reading is that the weights
are near optimal. A second reading fits the evidence better: **the answer is
not in the space being searched.**

Search only finds what the representation can express. The current vocabulary
is `wRoll`, `wPlace`, `turnover`, `wHarvest`, plus generator settings. None of
it can express holding value now to build a larger chain later, which is the
strategy measurably outperforming the bot in owner play. No setting of those
weights produces it.

Adding terms one at a time is also the wrong shape. Terms interact:
`turnover` pays 40 points per cell cleared, which directly opposes building.
`wHarvest` was added alone against that standing incentive and completes a
built-tile chain roughly once per game. Each term added separately also costs
its own ~15,000-game validation and never tests the interaction.

## The gaps, each grounded in a measured divergence

**1. Build potential across the board, not just the survivor.**
`harvestValue` scores only the tile just created. Nothing scores the board's
accumulated buildable material. Measured: the owner's highest-scoring moves
chain tiles summing 264-356 (level 58 moves 14 and 16: 49,920 and 42,240,
together 54% of that game's score). Every bot chain sums near 64 — it chains
dealt 2s and 4s. The owner harvests what was built; the bot harvests what was
dealt. Proposed term: value of tiles above the dealt range, weighted by how
much of that value is mutually chainable.

**2. A dead tile has a price, and the price is not constant.**
Trimming is currently binary — prefer a power-of-two sum, always. Measured:
taking the maximum chain every move wins 12/12 on the open boards (51, 52, 53,
56, 58) and 1/12 on level 54, a 4x8 board with two stones. Same tactic,
opposite outcome, because a dead tile costs a much larger share of a small
board. Proposed term: price a dead tile against free space and the count of
dead tiles already present, instead of refusing it outright.

**3. How long this game has left to run.**
Measured: lockouts appear past roughly 19 dead tiles, which is only reached in
games running 20+ moves. Games ending inside 16 moves never get there. The
policy has no estimate of remaining length, so it pays for board health it may
never use. Proposed term: moves remaining against points still needed, used to
scale how much board health is worth.

**4. Endgame is a special case of 3, not a separate term.** On the final move
of `HUMAN-PILOT-0002` the bot took 1,536 where 37,760 existed, still protecting
a board with no future. If 3 is defined properly this disappears into it, which
is the reason to define the vocabulary as a set rather than as four patches.

## Acceptance criteria

- Each term above is implemented as a parameter defaulting to the current
  behaviour, so the shipped policy is unchanged until a search moves it.
- The enlarged space is searched **as a whole** — CMA-ES or Bayesian
  optimisation with successive halving and shared seeds — not one term at a
  time.
- The objective is measured on a benchmark the bot has not saturated (BL-0011);
  shipped-level win rate cannot rank these.
- Any winning configuration is validated at the project's usual sample size
  before it is proposed for promotion, and goes through a registered protocol,
  since it is a generalising claim.

## Current evidence

- `solver/bot.js` — `DEFAULT_PARAMS`, `turnover` at 40/cell, `harvestValue`
- `EVIDENCE_LEDGER.md` `RESULT-0017` (the MAP-Elites wash)
- `play-sessions/` — owner games on levels 56, 57, 58 with seeds
- Session measurements: greedy-max 88/120 wins vs shipped 108/120, lockouts
  concentrated on long and cramped boards

## Next action

Do not implement another term yet. `RESULT-0062` shows that seven of the eight
frozen correction routes become executable only at cash-out, but the winning
move-11 owner route is already legal one move earlier. The unchanged champion
takes a separate 3,072-point chain without moving or consuming any route input,
then cashes the preserved route for 56,320. Next run one exact two-arm
counterfactual from that pre-continuation-3 state: cash now versus the observed
one-move wait, with RNG, remaining moves, target-stop objective, and subsequent
champion frozen. This tests timing directly without naming a general metric.

## History

- 2026-09-05 — captured at the owner's direction, after agreeing that
  enumerating the missing vocabulary should precede any further parameter
  search.
- 2026-09-28 — `LC-0002` tested one untuned static proxy for immediately
  harvestable built material against the known Level 54 helpful/harmful
  decisions. It failed the strict qualification and stopped before fresh
  evidence: current maximum harvest detects preservation at one decision but
  cannot represent setup, accumulation, realization, or target timing.
- 2026-09-28 — `LC-0003` tested an exactly three-step target-progress proxy
  against the same known panel. It failed 4/10 decision cells and stopped
  before fresh evidence: short-horizon target gap reversed eventual takeover
  value at harmful moves 4 and 9 and helpful moves 6 and 11. Do not tune the
  horizon on this opened panel.
- 2026-09-28 — the bounded LC-0003 four-miss diagnostic found that the
  eventual winner held the larger immediately harvestable connected built
  reservoir at the cutoff in all four misses and converted it one or two moves
  later. Raw built mass did not distinguish all four. This is a post-hoc clue
  for a separately validated convertible-value construct, not an adopted term.
- 2026-09-28 — `LC-0004` made four frozen tile-placement interventions on the
  exact move-6 and move-8 cutoff states while preserving score, tile multiset,
  RNG position, and champion. Both disconnects cost three moves. Connecting
  move 8 saved three moves by unlocking a 42,880-point mixed-tier chain, but
  connecting move 6 enlarged the built-only reservoir and still cost one move.
  Spatial arrangement matters in these exact cases; reservoir amount and
  component size still do not supply a general rule.
- 2026-09-28 — `RESULT-0058` repaired the exact `M8-CONNECT` reservoir fork
  with one frozen tile-multiset-preserving swap. The unchanged champion then
  selected a legal 16-tile small-to-large chain containing all ten built tiles
  and scored 63,360 immediately instead of 42,880, while both arms still won
  on move 14. This validates the complete-harvest interpretation only for the
  named state; an already-existing counterexample remains required before a
  measure is designed.
- 2026-09-28 — `RESULT-0059` found that counterexample in the already-retained
  `M6-CONNECT` state. All eight built tiles were connected, but neither `16`
  touched a built `32`, exhaustive traversal covered at most seven built tiles,
  and the connected arm took one extra move versus baseline. Connectivity is
  therefore not harvest readiness; the next diagnostic must test the narrower
  ladder-entry plus complete-path explanation on the four opened misses.
- 2026-09-28 — `RESULT-0060` traced the exact survivor created by both options
  through all eight retained arms. Winner lineage directly powered the move-4
  and move-9 reversals, but not move 6 or 11. At move 6, earlier reuse belonged
  to the loser while the winner preserved its anchor; at move 11, the winner
  used its anchor in an earlier setup and reversed with other tiles. “Stay the
  course” is therefore a board-plan claim, not a one-tile claim. Trace the full
  reversal-chain ancestry next; do not define a metric yet.
- 2026-09-28 — `RESULT-0061` completed the full ancestry graph for all eight
  retained correction chains. Every eventual winner used more post-decision
  roots and value than its loser and manufactured at least one missing rung
  before cashing out. The move-9 loser also made an intermediate merge but had
  no comparable high-value reservoir behind it, establishing the exact-state
  counterexample to bridge-building alone. The next diagnostic is when each
  route becomes executable and which rung or adjacency is missing beforehand;
  no metric is yet authorized.
- 2026-09-28 — LC-0009 attempted that readiness timeline but was closed
  `INVALID`: filtering absent inputs out of the prefix made three valid later
  doubles appear invalid. `FR-0007` records the defect and LC-0010 proves the
  old assessor fails the missing-earlier-input regression while the repaired
  assessor passes it.
- 2026-09-28 — `RESULT-0062` then confirmed the corrected eight-arm timeline.
  Seven routes first become executable at cash-out. The move-11 winning owner
  route is ready one move early, survives a separate 3,072-point move intact,
  and is cashed for 56,320 next. Route readiness and urgency are distinct in
  this exact state; whether waiting is better remains the next counterfactual,
  not an adopted policy term.
