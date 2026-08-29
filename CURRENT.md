# Current work

This page is a bounded navigation record, not evidence. Read the [evidence ledger](EVIDENCE_LEDGER.md) for current proof standing and source-linked claims.

Open the generated [Universe Map](UNIVERSE.md) for the one-screen control panel of identities, evaluation coverage, evidence standing, warnings, and the current research frontier.

## Active milestone

Author new levels. The curve is fixed, and the authoring baseline is now bounded and stable:

- **53 levels ship.** Level 53 is the exact `043ca53f...` candidate and has three replayed human wins. Its old authoring receipt is historical, not current-bot performance evidence ([RESULT-0018](EVIDENCE_LEDGER.md#result-0018--level-53-ships-with-replayed-human-wins-and-a-historical-receipt)).
- **The generator exists.** `solver/generate-levels.js` samples legal shapes, screens them, derives one candidate through the authoring path, and verifies it before writing. It does not make a shipping decision.
- **New target measurement uses `calib-1`.** `solver/level-author.js` now passes the complete frozen calibration parameters and records the calibration stamp, so live bot-default changes cannot silently move a future candidate's target.
- **The unshipped stale Level 54 candidate is retired.** Candidate `0a3b9adf...` and its receipt remain byte-for-byte in `solver/candidates-archive/`; no replacement was generated. The live receipt corpus intentionally retains the two shipped Level 52 and 53 identity failures.

The milestone is not closed, but no next candidate or experiment is implied by this stabilization. Continue only from a separately approved level-authoring choice. The historical design remains at [the level-authoring loop spec](docs/superpowers/specs/2026-08-08-level-authoring-loop-design.md).

## Admitted MAP-Elites standing

The fixed-axis independent round is accepted as bounded quality-diversity evidence ([RESULT-0019](EVIDENCE_LEDGER.md#result-0019--a-fixed-axis-map-elites-round-expands-admitted-coverage-to-23-cells-without-a-champion)). On the original 5×5 behavior grid it occupied 23/25 cells, up from 20/25 in the first accepted run. None of its three representatives had positive disjoint-holdout lift, so the champion is unchanged. The selection universe covered six levels and omitted Level 53; this is not broad generalization evidence and does not authorize another run.

## Done — the level curve

Every level is winnable. No level sits below a 5% bot win rate, against 34 levels at 0% before ([RESULT-0008](EVIDENCE_LEDGER.md#result-0008--every-level-is-winnable-after-the-demand-based-retune)).

A target is now a measured share of that level's achievable score, and tile scale doubles once per ten-level chapter so dealt tiles stay on the 2/4/8/16/32/64/128 family ([DECISION-0003](EVIDENCE_LEDGER.md#decision-0003--targets-are-a-measured-share-of-achievable-score-tile-scale-doubles-per-chapter)). Tile scale does not affect difficulty — it multiplies the target and achievable score together — so difficulty is carried entirely by demand.

## Parked

The Level 26 exact-proof track, by [DECISION-0002](EVIDENCE_LEDGER.md#decision-0002--park-the-exact-proof-track-tune-levels-from-measured-calibration). 13,000 reachability and the exact maximum stay open. The frozen study is pinned to its original scale-1 board and 13,000 target, so the retune did not move it. [BL-0001](docs/backlog/BL-0001-test-compact-state-signature.md) and [BL-0002](docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md) are parked with it.

## Accepted, not fixed

- **Roughly 15 levels have a target lower than the level before.** The remaining lever is the move budget, and spending it would make a level's pacing a side effect of target cosmetics. Revisit from playtest feel, not from a monotonicity rule.
- **The reference bot is a weak proxy for a skilled player.** Every recorded win rate is a floor on human success, not an estimate. The margin is still unquantified in general, but it is no longer unmeasured: on Level 51 the owner reached the target in 12 moves where the bot's median is 16 across 120 seeds, and the bot matches that 12-move pace on 8 of 120 boards. The gap narrowed with `RESULT-0011` and did not close.
- **Lockouts persist at up to ~5% on the late levels.** A lockout is a dead board, not a fair loss. Bounded by `solver/verify-loop.js`.

## Priced and rejected — do not re-propose without new evidence

- **Enrich the spawn pool.** Raising spawned value 76% bought 13% more score ([RESULT-0006](EVIDENCE_LEDGER.md#result-0006--spawning-16s-does-not-lift-the-ceiling)). More distinct values means more chain sums fall off the matchable lattice ([FACT-0006](EVIDENCE_LEDGER.md#fact-0006--the-mergeable-sum-lattice-and-what-a-lockout-is)). Future direction only: [BL-0003](docs/backlog/BL-0003-widen-spawn-pool.md).
- **Enlarge the move budget.** Works to about level 31 and saturates after ([RESULT-0007](EVIDENCE_LEDGER.md#result-0007--more-moves-rescue-the-mid-levels-and-saturate-on-the-late-ones)).

## Useful commands

```bash
node solver/verify-loop.js                              # curve health gate; exit 0 = PASS
node solver/game-tester.js --seeds 150                  # compare tile-scaling policies
node solver/game-tester.js --policy powers2 --detail    # the shipped policy, per level
node --test solver/tests/*.test.js
node solver/chain-coverage.js                           # how much of the best move the walk finds
node solver/routing-ablation.js                         # what that is worth in play
```

Last reviewed: 2026-08-28
