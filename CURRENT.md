# Current work

This page is a bounded navigation record, not evidence. Read the [evidence ledger](EVIDENCE_LEDGER.md) for current proof standing and source-linked claims.

Open the generated [Universe Map](UNIVERSE.md) for the one-screen control panel of identities, evaluation coverage, evidence standing, warnings, and the current research frontier.

## Active milestone

Author new levels. The curve is fixed, so new levels can be born calibrated rather than hand-guessed. [BL-0004](docs/backlog/BL-0004-build-level-authoring-tracer.md)'s tracer is complete and its one candidate is shipped: Level 51, the first level whose target was never hand-picked (measured demand, `DECISION-0003`) and the first with direct human playtest evidence, not just a bot win rate (`RESULT-0009`). The historical design remains at [the level-authoring loop spec](docs/superpowers/specs/2026-08-08-level-authoring-loop-design.md); measurement is grounded in `solver/game-tester.js`.

**Read [HANDOFF.md](HANDOFF.md) before touching this milestone further** — a 2026-08-17 session conflated the pipeline built so far (measures and validates a *human-picked* shape) with a level generator (invents shapes on its own). That distinction still matters, but the generator is no longer hypothetical: `solver/generate-levels.js` (added 2026-08-20, `355dc5a`) proposes level shapes and screens them cheaply before spending the full 450-game authoring pipeline on the survivors. That handoff also lists three more candidates from that session, and their standing has since moved. **Level 53 ships**, as does 52 — `src/game.js` carries 53 levels and `solver/tests/gameLevels.test.js` pins that count. **54 does not**: its playtest still doesn't count (tested on a memorized board — needs a fresh seed before its 85%-demand question is actually answered), and its receipt is one of the three the suite reports stale. Level 53's move from rejected to shipped carries no ledger record; it entered `src/game.js` in `530deb3`, a commit about MAP-Elites evidence. Adjudicating that is open.

The milestone itself isn't closed, but the open choice has moved. The generator exists, so what is left is not whether to build it: it is whether to run it at scale, and against what acceptance bar.

## The open lead

The human recordings say the owner builds heavy tiles across several moves and then chains those together, and that this is worth far more than picking better tiles inside any single move ([RESULT-0018](EVIDENCE_LEDGER.md#result-0018--replayed-human-play-trades-early-points-for-a-late-harvest-the-bot-does-the-reverse)). `harvestValue` already reaches for exactly this at weight 2 and was worth +2.6% (`RESULT-0014`). Whether it is under-weighted, or whether the endgame should switch it off entirely — the human abandons lattice discipline in the last third while the bot holds it — is untested. Trying to express the same idea *inside* one walk was tried and failed (`RESULT-0019`).

## Done — the level curve

Every level is winnable. No level sits below a 5% bot win rate, against 34 levels at 0% before ([RESULT-0008](EVIDENCE_LEDGER.md#result-0008--every-level-is-winnable-after-the-demand-based-retune)).

A target is now a measured share of that level's achievable score, and tile scale doubles once per ten-level chapter so dealt tiles stay on the 2/4/8/16/32/64/128 family ([DECISION-0003](EVIDENCE_LEDGER.md#decision-0003--targets-are-a-measured-share-of-achievable-score-tile-scale-doubles-per-chapter)). Tile scale does not affect difficulty — it multiplies the target and achievable score together — so difficulty is carried entirely by demand.

## Parked

The Level 26 exact-proof track, by [DECISION-0002](EVIDENCE_LEDGER.md#decision-0002--park-the-exact-proof-track-tune-levels-from-measured-calibration). 13,000 reachability and the exact maximum stay open. The frozen study is pinned to its original scale-1 board and 13,000 target, so the retune did not move it. [BL-0001](docs/backlog/BL-0001-test-compact-state-signature.md) and [BL-0002](docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md) are parked with it.

## Accepted, not fixed

- **Roughly 15 levels have a target lower than the level before.** The remaining lever is the move budget, and spending it would make a level's pacing a side effect of target cosmetics. Revisit from playtest feel, not from a monotonicity rule.
- **The reference bot is a weak proxy for a skilled player.** Every recorded win rate is a floor on human success, not an estimate. The margin is still unquantified in general, but it is no longer unmeasured: on Level 51 the owner reached the target in 12 moves where the bot's median is 16 across 120 seeds, and the bot matches that 12-move pace on 8 of 120 boards. The gap narrowed with `RESULT-0011` and did not close. [RESULT-0018](EVIDENCE_LEDGER.md#result-0018--replayed-human-play-trades-early-points-for-a-late-harvest-the-bot-does-the-reverse) now compares the two move by move on the same scale: over a whole game they capture nearly the same share of the best available move, but the human is worse early and much better late, and the bot never learns that the game is about to end. Still one player on four boards, so it sizes nothing.
- **Lockouts persist at up to ~5% on the late levels.** A lockout is a dead board, not a fair loss. Bounded by `solver/verify-loop.js`.

## Priced and rejected — do not re-propose without new evidence

- **Enrich the spawn pool.** Raising spawned value 76% bought 13% more score ([RESULT-0006](EVIDENCE_LEDGER.md#result-0006--spawning-16s-does-not-lift-the-ceiling)). More distinct values means more chain sums fall off the matchable lattice ([FACT-0006](EVIDENCE_LEDGER.md#fact-0006--the-mergeable-sum-lattice-and-what-a-lockout-is)). Future direction only: [BL-0003](docs/backlog/BL-0003-widen-spawn-pool.md).
- **Enlarge the move budget.** Works to about level 31 and saturates after ([RESULT-0007](EVIDENCE_LEDGER.md#result-0007--more-moves-rescue-the-mid-levels-and-saturate-on-the-late-ones)).
- **Make the chain walk take the heaviest tile once the length multiplier is capped.** Worse at every threshold tried, by 6.6% to 32.7%, all significant against the `t > 3` bar ([RESULT-0019](EVIDENCE_LEDGER.md#result-0019--taking-the-heaviest-tile-past-the-multiplier-cap-is-worse-at-every-threshold)). A chain extends on equal-or-double, so grabbing a heavy tile raises the floor for every later tile and the walk dies; length keeps paying past the cap, just linearly. The `heavyAfter` parameter exists and is pinned at 0 so the result stays reverifiable.

## Useful commands

```bash
node solver/verify-loop.js                              # curve health gate; exit 0 = PASS
node solver/game-tester.js --seeds 150                  # compare tile-scaling policies
node solver/game-tester.js --policy powers2 --detail    # the shipped policy, per level
node --test solver/tests/*.test.js
node solver/chain-coverage.js                           # how much of the best move the walk finds
node solver/routing-ablation.js                         # what that is worth in play
node solver/human-replay.js                             # recorded human play vs the exact best move (~30 min)
node solver/heavy-after-ablation.js                     # the rejected heaviest-first-past-the-cap walk
```

Last reviewed: 2026-08-29
