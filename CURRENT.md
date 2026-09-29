# Current work

This page is a bounded navigation record, not evidence. Read the [evidence ledger](EVIDENCE_LEDGER.md) for current proof standing and source-linked claims.

Open the generated [Universe Map](UNIVERSE.md) for the one-screen control panel of identities, evaluation coverage, evidence standing, warnings, and the current research frontier.

## Evidence-capture hardening — 2026-09-26

[BL-0016](docs/backlog/BL-0016-harden-cross-session-evidence-capture.md) changed how sessions record and check findings. Read [LEDGER-INDEX.md](LEDGER-INDEX.md) first; the experiment gate now checks every record's structure, citations and append-only history, and every new run must name its ledger record. [RESULT-0049](EVIDENCE_LEDGER.md) is the preregistered confirmation supporting the current target-aware champion. The lost 2026-08-28 MAP-Elites archives are [RESULT-0050](EVIDENCE_LEDGER.md) and [RESULT-0051](EVIDENCE_LEDGER.md), neither replacing the then-champion `52f500c`; they were renumbered from PR #46's original RESULT-0049/0050 labels when PR #49 landed first. CORRECTION-0010 to CORRECTION-0017 repair stale evidence pointers and reverify commands. Open: the nightly reverify report still awaits RESULT-0016's confirmation run; two solver bugs found by it are listed in BL-0016.

## Current decision frontier — 2026-09-28

The latest trustworthy sequence is now visible in the ledger:

- [DECISION-0007](EVIDENCE_LEDGER.md#decision-0007--level-54s-126000-target-is-a-deliberate-owner-exception-to-the-demand-rule) records, provisionally, that Level 54's 126,000 target is a deliberate owner exception to the demand rule, not a measurement error; `BL-0020` was dropped on this basis. [DECISION-0008](EVIDENCE_LEDGER.md#decision-0008--pause-porting-the-family-board-map-elites-work-until-frozen-renumbering-is-defined) records, provisionally, that porting the family-board MAP-Elites work is paused until `BL-0023` criterion 7 defines frozen renumbering.
- [DECISION-0009](EVIDENCE_LEDGER.md#decision-0009--keep-level-53-as-shipped-at-101000) records, provisionally, that the owner keeps Level 53 as shipped at 101,000 with its 0.95 demand; this closes the open adjudication of how it entered the game.

- [RESULT-0056](EVIDENCE_LEDGER.md#result-0056--fresh-board-owner-vs-oracle-run-for-result-0044-board-2-human-attempt-invalid-inconclusive) closes `RESULT-0044` by its fresh-run option, and `RESULT-0044` is now superseded. The outcome is `INCONCLUSIVE`: before the oracle ran, the owner ruled one of the two owner attempts invalid because bombs had no readable art. Open: give bombs readable art before more owner play counts as evidence, and make oracle runners record and check HEAD.

- [RESULT-0057](EVIDENCE_LEDGER.md#result-0057--equal-score-continuation-density-is-broadly-harmful-and-must-not-replace-the-champion) is the closed continuation-density validation. Its primary outcome is `FALSIFIED`: the challenger caused 24 champion-win regressions, was slower in 881 mutual wins versus 116 in the other direction, and worsened mean target cost by 2.78 moves while using 1.85× compute. Do not promote this global tie-break rule. The champion is unchanged; the ledger record is provisional only until an independent checker signs it.

- [RESULT-0045](EVIDENCE_LEDGER.md#result-0045--oracle-witnesses-meet-every-frozen-captured-puzzle-move-comparator) closes the captured-corpus oracle milestone: all 20 exact puzzles have verified wins within the 30-second search allowance; 17 beat the best recorded human win, 2 tie, and the loss-only puzzle is also won. [Run, verify and inspect it](docs/oracle/README.md). This gives authoring an achieved move-count reference on these puzzles; it does not establish optimality, future-board superiority, or human difficulty, and does not replace `calib-1` or the live bot.

- [CORRECTION-0009](EVIDENCE_LEDGER.md#correction-0009--recorded-human-games-stop-at-the-target) corrects the human benchmark's objective model. Recorded human wins and the shipped bot both stop on the target-crossing move; the uncapped bot continues alone and is not a human comparison. Across all 25 mixed-corpus sessions, the human and bot are each faster on 9 of 23 mutual wins, with 5 ties. In the 13 ordinary shipped-level captures, the human is faster on 6 of 12 mutual wins, the bot on 3, and 3 are ties; every bot-faster capture and the remaining human loss are on Level 54.

- [CORRECTION-0008](EVIDENCE_LEDGER.md#correction-0008--off-lattice-tiles-are-recoverable-not-permanently-dead) narrows `FACT-0006`: an off-lattice survivor has no partner in the normal spawn family, but it is not permanently unmatchable. A player can deliberately construct compatible off-lattice values; for example, `6 → 6 → 12` is legal and collapses three occupied cells into one reusable `24`. The value remains off-lattice, but the move reclaims two cells. Treat `strandedCellPressure` as neutral off-lattice occupancy until reuse cost and strategic pressure are separately validated. The measurement vocabulary and bot/human comparison rules are consolidated in [Measurement & Analysis Standards](docs/MEASUREMENT-AND-ANALYSIS-STANDARDS.md).

- [RESULT-0043](EVIDENCE_LEDGER.md#result-0043--greed-responds-and-tracks-wins-but-coverage-redundancy-and-stability-remain-inconclusive) is the closed, hardened greed-ratio result. The calibrated watchdog completed 128/128 fresh games with zero timeouts, the exact closeout cwd/argv path qualified before confirmation, and executable closure passed. Greed means rose 0.385→0.946 and win/greed correlation was 0.956, supporting controlled response and win tracking. The primary outcome is still `INCONCLUSIVE`: all Level 10 policy cells lacked exact games at the 500,000-state cap, score/greed correlation was 0.730, and minimum exact-modal stability was 66.7%. Greed ratio remains a responsive but unadopted candidate. Half-score move occupied only the early bin and still needs a separate timing manipulation.

- [RESULT-0042](EVIDENCE_LEDGER.md#result-0042--calibrated-watchdog-completes-the-matrix-frozen-closeout-path-remains-unverified) first demonstrated that the 120-second watchdog lets all 128 games finish, but its frozen closeout command resolved from the wrong directory. Its corpus is retained as descriptive data with `UNVERIFIED` closure; RESULT-0043 is the fresh-seed replacement and must be cited for domain standing.

- [RESULT-0041](EVIDENCE_LEDGER.md#result-0041--hardened-greed-harness-qualifies-confirmation-watchdog-invalidates-the-run) repaired the specific receipt and stability defects from CORRECTION-0007 and passed mutation qualification, including a non-vacuous middle-bin failure. Its one allowed 128-game confirmation then hit the registered emergency watchdog at percentile 1.00, Level 10, seed 33,800,004 after 96 reported completions. Closure is `INVALID`, P1–P6 remain `UNVERIFIED`, and the run cannot be retried or used for greed-ratio adoption. The open choice is now a genuinely new exact-denominator/compute subject, not another repair of the same receipt.

- [CORRECTION-0007](EVIDENCE_LEDGER.md#correction-0007--result-0037-and-result-0038-overstate-stability-and-receipt-closure) supersedes the evidence standing of RESULT-0037 and RESULT-0038 without changing their retained rows. Its required repair, [BL-0015](docs/backlog/BL-0015-harden-greed-validation-receipts.md), is now complete through RESULT-0043. Do not cite RESULT-0038's vacuous adjacent-bin statistic; use RESULT-0043 for current greed-ratio standing. Half-score move remains diagnostic and still needs a separate independent timing manipulation.

- [RESULT-0035](EVIDENCE_LEDGER.md#result-0035--four-cell-occupancy-succeeds-but-witness-dependent-cell-stability-does-not) built the preregistered merge-depth × spatial-spread corpus on 128 fresh puzzles. Deep witnesses covered 128/128 and all four cells retained four representatives, but only 63/115 paired puzzles (54.8%) kept the same cell within the registered spread tolerance. The disposition is `MAP_CORPUS_INCONCLUSIVE`; keep the 16 representatives diagnostic and repair witness uncertainty under a new protocol rather than moving the 0.82 boundary or adding seeds here.

- [RESULT-0034](EVIDENCE_LEDGER.md#result-0034--bounded-opening-diversity-collapses-on-representative-boards) completed the third recommended pair. Forced-prefix ratio showed range and both proxies were width-stable, but bounded opening diversity was 1 on 30/32 boards and 2 on only 2/32. Revise the success-set sampler before MAP use; do not add seeds to this panel.

- [RESULT-0033](EVIDENCE_LEDGER.md#result-0033--merge-depth-and-spatial-spread-clear-the-candidate-measure-bars) validated merge depth × spatial spread on 32 fresh boards. Deep witnesses covered 32/32; both coordinates showed registered range; paired width stability was 89.3% for exact peak depth and 96.4% for spatial spread. This is the first recommended pair to become eligible for a separate registered MAP corpus, with both names kept witness-qualified.

- [RESULT-0032](EVIDENCE_LEDGER.md#result-0032--choice-density-clears-its-bars-recovery-lacks-enough-non-ceiling-pairs) tested choice density × recovery on 32 fresh representative boards. The exact opening choice proxy cleared its range and invariance bars. Recovery moved in the intended direction on 7/8 eligible pairs and passed the registered width-stability bar, but only eight pairs were below ceiling against the required twelve. Keep choice density as a candidate; revise recovery before a MAP corpus.

- [RESULT-0029](EVIDENCE_LEDGER.md#result-0029--exact-micro-puzzle-descriptors-do-not-clear-the-frozen-four-region-promotion-bar) is the first exact puzzle-instance descriptor validation, kept separate from policy behavior. It screened 104 generated micro-puzzles and retained 10, but occupied the intended relaxed-short / relaxed-long / tight-short / tight-long regions **4 / 1 / 1 / 4**, below its frozen **4 / 4 / 4 / 4** bar. [DECISION-0006](EVIDENCE_LEDGER.md#decision-0006--do-not-promote-the-two-puzzle-instance-descriptors-from-result-0029) therefore rejects promotion of both axes for that exact scoped map. A repair is a new registered result; do not extend the opened seed blocks or rewrite the relaxed-long construction after seeing its cap-4 collapse.

- [RESULT-0021](EVIDENCE_LEDGER.md#result-0021--structural-level-ranking-is-stable-across-disjoint-seed-samples) found that repeated human plays are not supported as necessary merely to average seed noise when differentiating candidates. It does not remove qualitative human review.
- [RESULT-0025](EVIDENCE_LEDGER.md#result-0025--one-owner-pilot-session-replays-exactly-on-its-identified-subject) qualifies one exact owner-play session. [DECISION-0005](EVIDENCE_LEDGER.md#decision-0005--route-the-qualified-owner-pilot-to-variantrepair) disposes that candidate as `variant/repair`: preserve the narrow-board direction, treat blocker benefit as topology-dependent, and resolve or explicitly accept the stone/refill behavior before relying on it.
- The first topology study, [RESULT-0023](experiments/RESULT-0023/report.md), remains a retained failed run because its positive control could false-PASS. It is not a ledger-admitted result. [RESULT-0024](EVIDENCE_LEDGER.md#result-0024--the-repaired-topology-response-study-is-entitled-but-inconclusive) repaired that control, consumed its receipt, used fresh seeds, and produced entitled evidence with empirical verdict `INCONCLUSIVE`.
- [RESULT-0026](EVIDENCE_LEDGER.md#result-0026--the-frozen-handmade-policy-saves-moves-on-average-but-regresses-six-wins) is the first fresh confirmation admitted through the qualified policy-comparison gate. The frozen handmade policy saved 0.68 moves/game on average, but converted six reference wins into losses, so its predeclared empirical verdict is `FALSIFIED`. Do not promote that frozen policy; a repair is a new subject.

Do **not** repeat RESULT-0024's same one-stone/two-stone policy interaction with more seeds. The four policies remained behaviorally distinct, but their response to that exact contrast did not show the stable predeclared five-point separation needed to justify scale-up.

**Selected next descriptor: `stranded-cell pressure`; measurement seam now mechanized.** After each completed move, once gravity, refill, and blocker ticking have run, count non-stone cells occupied by a tile whose value is not `tileScale × 2^n` and divide by the level's non-stone grid footprint; the descriptor is that fraction averaged across the played moves. `solver/behavior-descriptors.js` defines the measure and its post-move registry, while `solver/policy-eval.js#playToBudget` emits the real trace and `evaluatePolicy` aggregates it without retaining every game's trace. `CORRECTION-0008` narrows its interpretation: the measure records off-lattice occupancy, not permanently dead cells. Those values have no partner in the spawn family but can be reused when the player constructs compatible off-lattice values. Whether that construction cost creates meaningful pressure is unresolved. The measure remains distinct from the existing mean-chain-length and late-score-share axes.

The implementation check now distinguishes an open 2x2 real play from its one-stone twin (`0` versus `1/3`) and pins a non-power-of-two scale fixture, but this is still only a mechanized candidate descriptor—not an accepted MAP-Elites axis. The completed [48-game range probe](.orch/tickets/2026-09-02-stranded-pressure-range-probe/SPR-001.md) observed four distinct rounded policy aggregates but only `0.02385060610977495` total range, below its predeclared `0.05` promising threshold. Its exact verdict is `AMBIGUOUS_ON_EXACT_PROBE`: it does not justify a preregistered policy-range experiment and does not establish separation of play styles, prediction of fun, or fitness value. If pursued, the next cheap discriminator should use one stronger topology contrast rather than add seeds to this same panel or repeat RESULT-0024.

## Open now — the policy vocabulary, not its parameters

[BL-0013](docs/backlog/BL-0013-policy-vocabulary-gaps.md) is the live piece of work. `RESULT-0017`'s MAP-Elites search over the existing weights returned -0.64%, usually read as the weights being near optimal; the 2026-09-05 session found evidence for a second reading, that the answer is not in the space being searched. The policy has no term for holding value now to build a larger chain later, which is the strategy measurably outscoring it in owner play — owner chains sum 264-356, bot chains sum near 64. Three replacement terms are specified there.

The latest known-case design qualification is
[LC-0003](docs/learning-cycles/LC-0003-three-step-target-progress-result.md).
Its frozen three-step target-progress proxy failed 4 of 10 decision cells and
stopped before fresh evidence: short-horizon target gap reversed the eventual
takeover value of harmful moves 4 and 9 and helpful moves 6 and 11. The result
rules out that exact horizon and proxy on the known panel; it is design
material, not ledger-admitted evidence or a new policy.

The follow-up
[four-miss diagnostic](docs/learning-cycles/LC-0003-four-miss-diagnostic.md)
found one common delayed state: at the three-move cutoff, the eventual winner
had the larger immediately harvestable connected reservoir of built tiles in
all four misses, and converted it one or two moves later. This is a post-hoc
design clue, not a validated feature; do not fit another horizon to those
opened cases.

The bounded
[LC-0004 causal contrast](docs/learning-cycles/LC-0004-move6-move8-causal-contrast-result.md)
then changed only tile placement on the exact move-6 and move-8 owner cutoff
states. Disconnecting either reservoir cost three moves. Connecting move 8
saved three moves and exposed a 42,880-point mixed-tier bridge chain without
increasing the built-only reservoir measure, while connecting move 6 increased
that measure and still cost one move. Placement is causally consequential in
those four edits, but neither reservoir amount nor component size is a
monotonic rule. Keep `executable bridge compatibility` as a replay-grounded
hypothesis only; inspect its chain mechanics and a counterexample before
formalizing another measure.

[RESULT-0058](EVIDENCE_LEDGER.md#result-0058--one-exact-path-repair-makes-every-built-tile-harvestable-in-the-level-54-move-8-state)
now resolves the chain-mechanics half on that exact state. The connected
reservoir was forked, so a legal path could use at most seven of ten built
tiles. Moving one `32` into the bottom-center gap turned it into one legal
small-to-large path; the unchanged champion selected all ten built tiles and
scored 63,360 immediately instead of 42,880. Both arms still reached the
target on move 14. Keep the result exact and provisional: the remaining next
step is an already-existing superficially similar state where maximizing
built-tile coverage is harmful or impossible, before any metric is named.

[RESULT-0059](EVIDENCE_LEDGER.md#result-0059--a-connected-built-reservoir-can-still-be-impossible-to-harvest-completely)
supplies that counterexample from the already-retained `M6-CONNECT` state.
Its eight built tiles are one connected component, but neither `16` can enter
a built `32`, exhaustive traversal covers at most seven of eight, and the
connected arm costs one move versus baseline. Together, RESULT-0058 and
RESULT-0059 support a narrower exact-state explanation: harvest readiness
requires both ladder entry and a complete value-ordered path, not connectivity
alone. The next bounded step is to check that explanation against the four
already-opened misses without naming or implementing a metric.

[RESULT-0060](EVIDENCE_LEDGER.md#result-0060--exact-decision-tile-lineage-explains-two-of-four-delayed-reversals)
performs the first “stay the course” check on those four misses. The winner's
exact decision survivor enters the reversal chain at moves 4 and 9, but not at
moves 6 and 11. At move 6 the winning owner leaves its anchor untouched until
three moves after the ordering has reversed; at move 11 it uses the anchor in
an earlier setup merge while other tiles deliver the reversal. Course
persistence is therefore broader than one tile: the next diagnostic should
trace the full reversal chain back to the post-decision board and expose the
persistent entry, connectors, and reservoir. Do not define a metric yet.

[RESULT-0061](EVIDENCE_LEDGER.md#result-0061--every-delayed-winner-cashes-out-a-larger-prepared-route)
completes that ancestry trace. In all four pairs, the eventual winner's
correction chain draws on more roots and more value already present after the
decision, and every winner manufactures at least one missing rung before the
cash-out. The move-9 loser also manufactures a rung but lacks the higher-value
reservoir behind it, so a bridge alone is not enough. The exact retained pattern
is now: preserve the reservoir, build the missing entry or connector, then use
the compatible small-to-large route. This is hindsight ancestry, not yet a
prospective policy signal. Next show when each route becomes executable during
the replay and what exact rung or adjacency was missing beforehand; still do
not define a metric.

**The decision that gates it: the search needs a fitness function and one has not been chosen.** Score, moves-to-win and win rate give different answers, and conflating them produced a wrong conclusion during that session. Shipped-level win rate cannot serve — the bot wins 71-100% of every shipped level ([BL-0011](docs/backlog/BL-0011-shipped-levels-cannot-measure-policy-quality.md)). `solver/human-benchmark.js` provides an unsaturated alternative.

Read [HANDOFF.md](HANDOFF.md)'s 2026-09-05 section before editing `src/game.js`, `solver/engine.js` or `solver/level-author.js` — each is hash-pinned into receipts that break on any edit, including comments.

## Active milestone

Author new levels. The curve is fixed, so new levels can be born calibrated rather than hand-guessed. [BL-0004](docs/backlog/BL-0004-build-level-authoring-tracer.md)'s tracer is complete and its one candidate is shipped: Level 51, the first level whose target was never hand-picked (measured demand, `DECISION-0003`) and the first with direct human playtest evidence, not just a bot win rate (`RESULT-0009`). The historical design remains at [the level-authoring loop spec](docs/superpowers/specs/2026-08-08-level-authoring-loop-design.md); measurement is grounded in `solver/game-tester.js`.

**Read [HANDOFF.md](HANDOFF.md) before touching this milestone further** — a 2026-08-17 session conflated the pipeline built so far (measures and validates a *human-picked* shape) with a level generator (invents shapes on its own). That distinction still matters, but the generator is no longer hypothetical: `solver/generate-levels.js` (added 2026-08-20, `355dc5a`) proposes level shapes and screens them cheaply before spending the full 450-game authoring pipeline on the survivors. That handoff also lists three more candidates from that session, and their standing has since moved. **Levels 51-58 all ship** as of 2026-09-05 — `src/game.js` carries 58 levels and `solver/tests/gameLevels.test.js` pins that count. Level 54 now ships as `central-choke`, the `HUMAN-PILOT-0002` geometry, at a 126,000 target set from the owner's replayed score (`RESULT-0028`) rather than from bot measurement (the authoring rule would have set 89,800). Note it does **not** ship as `candidate-levels-54.json`'s `tighter-pace` board, which shares only the level number and whose receipt remains stale and non-exempt. Level 53's move from rejected to shipped carries no ledger record; it entered `src/game.js` in `530deb3`, a commit about MAP-Elites evidence. The owner has since kept it as shipped (`DECISION-0009`, provisional).

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
- **Lockouts measured 0% on sampled levels as of 2026-09-26 (`RESULT-0052`); earlier measurements reached about 5% (`RESULT-0008`, stale).** A lockout is a dead board, not a fair loss. Bounded by `solver/verify-loop.js`.

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
node solver/human-replay.js --from .orch/runs/2026-08-29-human-replay-exploratory/evidence/human-replay-01.json   # recorded human play vs the exact best move (exploratory)
node solver/routing-ablation.js                         # what that is worth in play
```

Last reviewed: 2026-09-28
