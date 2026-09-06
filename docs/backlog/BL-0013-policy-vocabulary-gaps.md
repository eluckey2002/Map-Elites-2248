---
id: BL-0013
title: Define the policy terms the bot is missing before searching its parameters again
status: blocked
milestone: policy-strategy
depends_on: [BL-0011, BL-0012]
updated: 2026-09-05
---

# BL-0013 — The terms the policy cannot express

## Current disposition - 2026-09-05

The prior proposal and rationale below are retained.
Its implementation direction is paused by `DECISION-0006` and [BL-0014](BL-0014-policy-improvement-sequence.md).
Follow [the required sequence](../plans/2026-09-05-policy-improvement-sequence.md): this record may be re-scoped or replaced only after the Step 3 disposition supports work in Step 4.
The completion of planning alone does not release it for implementation.
The factual corrections identified in the grounding report are assigned to Step 2.
Those corrections are now source-pinned in
[CORRECTION-0005](../../EVIDENCE_LEDGER.md#correction-0005--recorded-stopping-horizons-repeats-and-provenance),
[CORRECTION-0006](../../EVIDENCE_LEDGER.md#correction-0006--current-policy-capabilities-and-the-pilot-generation-miss),
and [CORRECTION-0007](../../EVIDENCE_LEDGER.md#correction-0007--result-0017-attribution-and-objective).
They do not authorize this proposal. Current source has future-opportunity
terms; the pilot shows one generation miss on a human position, not a bot-own
defect or proof these terms are needed. RESULT-0017 stays unchanged: its cited
representative is -3.5723% on disjoint score holdout; -0.64% is unresolved.

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## Historical rationale — why this was proposed before another search

The following is retained history: candidate terms, not current source findings
or implementation scope.

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

## Historical proposed gaps

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

## Historical proposal acceptance criteria

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

## Historical evidence list

- `solver/bot.js` — `DEFAULT_PARAMS`, `turnover` at 40/cell, `harvestValue`
- `EVIDENCE_LEDGER.md` `RESULT-0017` (the MAP-Elites wash)
- `play-sessions/` — owner games on levels 56, 57, 58 with seeds
- Session measurements: greedy-max 88/120 wins vs shipped 108/120, lockouts
  concentrated on long and cramped boards

## Historical next action — blocked and not authorized

Implement the three terms as inert-by-default parameters, then one search over
the whole space. Not one term at a time.

## History

- 2026-09-05 — captured at the owner's direction, after agreeing that
  enumerating the missing vocabulary should precede any further parameter
  search.
- 2026-09-05 - Owner required the four-step sequence in DECISION-0006. Changed this proposal to blocked and retained its earlier text; a supported Step 4 scope will determine whether these terms are implemented at all.
