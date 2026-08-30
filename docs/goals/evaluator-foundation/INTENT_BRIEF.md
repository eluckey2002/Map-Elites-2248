# Intent Brief — Trustworthy evaluator foundation

## Owner selection

On 2026-08-29, the owner invoked `$goal-forge` after the evaluator was identified as the system's weakest link, then selected finish line **A — Trustworthy evaluator foundation**.

## Goal

Make level authoring use one frozen, explicitly identified calibration evaluator so that improvements to the live bot cannot silently change candidate targets or invalidate newly authored receipts. Re-author gen-0014 through that boundary and leave a currently verifying receipt.

## Non-goals

- Do not change game rules, scoring, merging, refill behavior, shipped levels, or shipped targets.
- Do not improve or retune the live bot.
- Do not ship gen-0014 or any other candidate.
- Do not build a new generator or a MAP-Elites archive.
- Do not claim that the frozen evaluator represents human difficulty or human quality.
- Do not use the eight retained recordings as a training set in this delivery.

## Stakes

Tier 1. A drifting evaluator can silently corrupt every later candidate comparison, but this delivery is locally reversible and does not alter the shipped game.

## Effort bound

Stop and return to the owner if the frozen contract has not passed within 15 build/repair rounds.

## Ownership

This brief records the owner's selected intent. Only the owner may change the goal, non-goals, stakes tier, or effort bound.
