# Current work

This page is a bounded navigation record, not evidence. Read the [evidence ledger](EVIDENCE_LEDGER.md) for current proof standing and source-linked claims.

Open the generated [Universe Map](UNIVERSE.md) for the one-screen control panel of identities, evaluation coverage, evidence standing, warnings, and the current research frontier.

## Current decision frontier — 2026-09-02

The latest trustworthy sequence is now visible in the ledger:

- [RESULT-0021](EVIDENCE_LEDGER.md#result-0021--structural-level-ranking-is-stable-across-disjoint-seed-samples) found that repeated human plays are not supported as necessary merely to average seed noise when differentiating candidates. It does not remove qualitative human review.
- [RESULT-0025](EVIDENCE_LEDGER.md#result-0025--one-owner-pilot-session-replays-exactly-on-its-identified-subject) qualifies one exact owner-play session. [DECISION-0005](EVIDENCE_LEDGER.md#decision-0005--route-the-qualified-owner-pilot-to-variantrepair) disposes that candidate as `variant/repair`: preserve the narrow-board direction, treat blocker benefit as topology-dependent, and resolve or explicitly accept the stone/refill behavior before relying on it.
- The first topology study, [RESULT-0023](experiments/RESULT-0023/report.md), remains a retained failed run because its positive control could false-PASS. It is not a ledger-admitted result. [RESULT-0024](EVIDENCE_LEDGER.md#result-0024--the-repaired-topology-response-study-is-entitled-but-inconclusive) repaired that control, consumed its receipt, used fresh seeds, and produced entitled evidence with empirical verdict `INCONCLUSIVE`.
- [RESULT-0026](EVIDENCE_LEDGER.md#result-0026--the-frozen-handmade-policy-saves-moves-on-average-but-regresses-six-wins) is the first fresh confirmation admitted through the qualified policy-comparison gate. The frozen handmade policy saved 0.68 moves/game on average, but converted six reference wins into losses, so its predeclared empirical verdict is `FALSIFIED`. Do not promote that frozen policy; a repair is a new subject.

Do **not** repeat RESULT-0024's same one-stone/two-stone policy interaction with more seeds. The four policies remained behaviorally distinct, but their response to that exact contrast did not show the stable predeclared five-point separation needed to justify scale-up.

**Selected next descriptor: `stranded-cell pressure`; measurement seam now mechanized.** After each completed move, once gravity, refill, and blocker ticking have run, count non-stone cells occupied by a tile whose value is not `tileScale × 2^n` and divide by the level's non-stone grid footprint; the descriptor is that fraction averaged across the played moves. `solver/behavior-descriptors.js` defines the measure and its post-move registry, while `solver/policy-eval.js#playToBudget` emits the real trace and `evaluatePolicy` aggregates it without retaining every game's trace. `FACT-0006` makes the numerator mechanically meaningful: those off-lattice tiles can never be matched again and permanently consume maneuvering space. This directly tests the planning pressure reported in the pilot and is distinct from the existing mean-chain-length and late-score-share axes.

The implementation check now distinguishes an open 2x2 real play from its one-stone twin (`0` versus `1/3`) and pins a non-power-of-two scale fixture, but this is still only a mechanized candidate descriptor—not an accepted MAP-Elites axis. The completed [48-game range probe](.orch/tickets/2026-09-02-stranded-pressure-range-probe/SPR-001.md) observed four distinct rounded policy aggregates but only `0.02385060610977495` total range, below its predeclared `0.05` promising threshold. Its exact verdict is `AMBIGUOUS_ON_EXACT_PROBE`: it does not justify a preregistered policy-range experiment and does not establish separation of play styles, prediction of fun, or fitness value. If pursued, the next cheap discriminator should use one stronger topology contrast rather than add seeds to this same panel or repeat RESULT-0024.

## Active milestone

Author new levels. The curve is fixed, so new levels can be born calibrated rather than hand-guessed. [BL-0004](docs/backlog/BL-0004-build-level-authoring-tracer.md)'s tracer is complete and its one candidate is shipped: Level 51, the first level whose target was never hand-picked (measured demand, `DECISION-0003`) and the first with direct human playtest evidence, not just a bot win rate (`RESULT-0009`). The historical design remains at [the level-authoring loop spec](docs/superpowers/specs/2026-08-08-level-authoring-loop-design.md); measurement is grounded in `solver/game-tester.js`.

**Read [HANDOFF.md](HANDOFF.md) before touching this milestone further** — a 2026-08-17 session conflated the pipeline built so far (measures and validates a *human-picked* shape) with a level generator (invents shapes on its own). That distinction still matters, but the generator is no longer hypothetical: `solver/generate-levels.js` (added 2026-08-20, `355dc5a`) proposes level shapes and screens them cheaply before spending the full 450-game authoring pipeline on the survivors. That handoff also lists three more candidates from that session, and their standing has since moved. **Level 53 ships**, as does 52 — `src/game.js` carries 53 levels and `solver/tests/gameLevels.test.js` pins that count. **54 does not**: its playtest still doesn't count (tested on a memorized board — needs a fresh seed before its 85%-demand question is actually answered), and its receipt is one of the three the suite reports stale. Level 53's move from rejected to shipped carries no ledger record; it entered `src/game.js` in `530deb3`, a commit about MAP-Elites evidence. Adjudicating that is open.

The milestone itself isn't closed, but the open choice has moved. The generator exists, so what is left is not whether to build it: it is whether to run it at scale, and against what acceptance bar.

## Done — the level curve

Every level is winnable. No level sits below a 5% bot win rate, against 34 levels at 0% before ([RESULT-0008](EVIDENCE_LEDGER.md#result-0008--every-level-is-winnable-after-the-demand-based-retune)).

A target is now a measured share of that level's achievable score, and tile scale doubles once per ten-level chapter so dealt tiles stay on the 2/4/8/16/32/64/128 family ([DECISION-0003](EVIDENCE_LEDGER.md#decision-0003--targets-are-a-measured-share-of-achievable-score-tile-scale-doubles-per-chapter)). Tile scale does not affect difficulty — it multiplies the target and achievable score together — so difficulty is carried entirely by demand.


## Experiments now require a protocol registered before the run

As of 2026-08-31 a claim that generalizes beyond what it measured — a ledger
record whose `proof_class` includes `heuristic_observation` — needs a protocol
registered in advance at `experiments/<RESULT-ID>/protocol.md`. Observations
(`direct_source`), proofs (`exact_result`), and owner rulings
(`owner_decision`) need nothing.

The rule and its rationale: [experiments/README.md](experiments/README.md).
The worked example remains `.orch/runs/chain-offer-2026-08-23/preregistration.md`,
which is where the format came from.

Enforcement fires at three points, earliest first. All five evidence-producing
scripts (`target-aware-evaluation`, `map-elites`, `policy-ablation`,
`routing-ablation`, `policy-search`) refuse to run without `--protocol` and
stamp the protocol's commit into the artifact they write. `node
tools/new-experiment.js RESULT-NNNN` registers and commits in one step.
`tools/verify-experiments.js` checks the ledger, run live by
`solver/tests/experiments.test.js`.

The 14 results accepted before the cutoff are grandfathered explicitly in
[experiments/GRANDFATHERED.md](experiments/GRANDFATHERED.md) rather than
backfilled, because a protocol written after the outcome is fiction. **There is
no escape hatch and one is not to be proposed without new evidence** — the
reasoning is recorded in `experiments/README.md`.

`RESULT-0018` was the one grandfathered result a shipped decision rested on
(`DECISION-0004` promoted the target-aware policy into `solver/bot.js`).
**Closed 2026-09-01.** `RESULT-0020` registered a protocol, re-ran the same
52 x 300 holdout, and reproduced every count exactly — 9,354 wins made faster,
zero made slower, zero champion-win regressions, mean saving 1.271 moves. That
decision now has evidence a clean checkout can regenerate. `RESULT-0018` was
not edited and stays grandfathered; the re-run replicates it rather than
replacing it. [BL-0005](docs/backlog/BL-0005-retrofit-result-0018-protocol.md)
and its [finish line](docs/backlog/BL-0005-FINISH-LINE.md) are done.

Two things the re-run found that reading the records could not. The evaluation
had been comparing the promoted policy against itself — 520 of 520 identical
cells, exit 0, indistinguishable from a real null. And the promotion *copied*
the policy into `solver/bot.js` instead of moving it, so `chooseMove` and
`chooseTargetAwareMove` are now byte-identical apart from their identifiers and
the challenger evaluated the same override twice per move. Both are fixed —
the wiring at `ab4b9d7`, the duplication at `c37c83a`, once the run was over
and the file was no longer frozen. `solver/bot.js` still carries its own copy
of the rule; that half is untouched and is a question for `DECISION-0004`, not
a measurement.

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

Last reviewed: 2026-09-02
