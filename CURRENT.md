# Current work

This page is a bounded navigation record, not evidence. Read the [evidence ledger](EVIDENCE_LEDGER.md) for current proof standing and source-linked claims.

## Level archetype design — current as of 2026-10-04

**2026-10-04 main integration authorized:** DECISION-0010 and PDL-035 record
the owner's request to land this work in the original game. The finite pack is
already inside the app; this pass commits the selected variant and retained
design references, integrates current main and follows the protected PR path.
See [release state and verification](docs/game-design/levels/connections-integration.md).
The protected PR's live state determines whether review and merge completed;
the integration record preserves the verified candidate and QA limits.
Saved games and live servers stay intact; forecast, campaign ordering, Delivery
integration and legacy restyling remain outside scope.

Start with the [archetype workbench](docs/game-design/levels/archetype-workbench.md).
Current direction: **keep the one strong Connections mode; do not force three
archetypes** (PDL-026). Existing Delivery Staggered and Landing remain retained.
The owner has removed the numerical collection target and the need for another
Connections variant solely to satisfy the old plan. No third-family search,
quota-driven replacement build or new mechanic is queued. Task: ARCHETYPES-SCOPE-1.

**Next selected mode: separate, budgeted Connection puzzles** (PDL-030).
The [confirmed requirements brief](docs/plans/2026-10-03-0341-feat-connection-puzzle-levels-plan.md)
covers a first pack with designed boards, ordered connections and repeatable
retries. Removal costs a budgeted move; inventory is independent between levels.
Same-board chapters remain a future option. PDL-031 now explicitly places the
variants in the original game; PDL-032 makes the Connections prototype the
preferred visual reference. The same artifact now contains a source-grounded
integration plan, a proposed teaching sequence and verification units.
**The first finite pack is now a local original-app playtest** (PDL-033), at
[Connection puzzles](http://127.0.0.1:8286/?mode=connections): Crosscurrent,
Keep a Line and Borrow a Space. Each has three ordered goals, one shared move
budget, identical retries and independent earned-removal inventory. Existing
score levels and unlock keys are unchanged; the original app's Level Select
contains the variant entry. Campaign interleaving and whole-game restyling are
not selected. The current 8285 game has not been replaced or restarted.
Task: CONNECTIONS-LEVELS-BUILD-1; [local verification and limits](docs/game-design/levels/receipts/CONNECTIONS-LEVELS-BUILD-1.md).
Owner play, native visual/touch QA and independent review remain open. Authored
routes prove feasibility, not difficulty or a sustained-play lifecycle fix.
No commit, PR, release or formal acceptance is claimed.

The later Keep a Line discussion is in
[the exact-attempt analysis](docs/game-design/levels/receipts/KEEP-A-LINE-PATH-1.md), including
an append-only correction: free Preview result already reveals immediate
refills; the ordinary board does not. The owner had not used that control.
[BL-0025](docs/backlog/BL-0025-connections-next-tile-forecast.md) preserves the
proposed next tile above each column. It is not an authorized refill change
or the next scheduled build. The owner requested continuing the finite-pack
handoff instead; task CONNECTIONS-LEVELS-HANDOFF-1 preserves that boundary.

The [completed local handoff](docs/game-design/levels/receipts/CONNECTIONS-LEVELS-HANDOFF-1.md)
records restored tests, capture replay and a verified same-machine snapshot
under workspace `preservation/connections-levels-20261003-r2/`. The initial
snapshot is retained and explicitly superseded. Native Chrome rendered the
library, but its next observation switched to the owner's active window;
interaction was stopped. Native gameplay/touch QA and independent review
therefore remain open. No gameplay tuning or live-server change followed.

**New sustained-play issue before close-out:** the owner reports non-power-of-two
results accumulating and becoming difficult to use (PDL-027). A frozen local
41-move capture replays exactly and has three such values with no current legal
complete-chain participation. Targets favor non-power results every third card,
ordinary merges can create them too, and refills supply only powers of two.
New board resets the material; there is no dedicated in-board recycling rule.
Retention remains, but continuous-play material lifecycle needs a decision
before calling this ready for sustained play. The subsequent selected response
is an isolated playtest, not an established lifecycle fix.
Task: CONNECTIONS-RESIDUE-1; [diagnosis](docs/game-design/levels/receipts/CONNECTIONS-RESIDUE-1.md).

**Connection Run + Power-up is ready for owner play at http://127.0.0.1:8285**
(PDL-028). The owner authorized a separate bankable tile-removal trial,
with three charges as the initial inventory cap. The owner's intent is to
encourage planning, building up and scoring high tiles as well as board recovery.
The owner selected one charge per merge creating a tile worth 2048 or higher,
over the score-meter alternative and exactly-2048 restriction. The announced
first-trial defaults are zero initial charges, discarded awards at capacity,
one move/no score per removal, bank preserved on Skip/New board and cleared on
Restart. See [concept and trial record](docs/backlog/BL-0024-connections-earned-cleanup.md).
The owner agreed that spending a charge removes the selected tile, applies
normal gravity/refill and leaves the objective unchanged. Original 8281 play,
spawn pool, ordinary rules and objective bank are untouched. Fifteen new-mode
checks and 88 focused checks pass; native rendered/touch QA and independent
review remain open. The full solver suite is not green; the
[implementation receipt](docs/game-design/levels/receipts/CONNECTIONS-POWERUP-1.md) records
its four failures, including a separately reproduced existing collector gap.
Owner feedback now calls the balance good and the game fun, describing competing
growth, connection and removal-earning priorities and difficulty saving charges
(PDL-029). This supports the current loop for this owner, not a proven long-run
lifecycle fix. No tuning followed. Task: CONNECTIONS-POWERUP-1; reviewer: owner.

**Turn the Board remains parked as this archetype version** (PDL-025).
The owner found it interesting but was mixed on whether it was worthwhile or
just compacted/re-aligned the pieces, then clarified they were not trying to
create a setup or strategy. The owner agreed to park it. Keep rotation as a
possible board-control mechanic, not a retained third family or a selected
future build. The playable version remains unchanged at http://127.0.0.1:8284;
see [rules and prior checks](prototypes/turn-the-board/README.md).
Task: TURN-BOARD-1. Native rendering/touch QA remains unverified.
PDL-026 removes the need to select a replacement; no further Turn tuning is
scheduled.

The owner reports Feeder Choice did not change play (PDL-023). Keep that
version unchanged and parked. Its existing page remains on
http://127.0.0.1:8274/?level=feeders for reference.
The [Delivery authoring guide](docs/game-design/levels/delivery-authoring-guide.md)
is complete as a first version. Task: DELIVERY-GUIDE-1. No further Delivery
layout or Feeder tuning was started; both retained Delivery references remain.

Retained Delivery contrast: **Delivery · Landing**, http://127.0.0.1:8283.
The owner authorized a contrasting layout after Staggered's encouraging play.
Landing explores immediate parcel progress versus the placement of a merged
survivor, with the same rules, eight moves and refill pool through 128.
See [design and checks](prototypes/delivery-bridge/README.md). Six focused tests
and shared-UI stand-in interactions pass; native browser/touch QA remains
unverified. Owner now reports considering the endpoint, its placement affecting
the next move, and that choice feeling satisfying. Retain Landing as a
contrasting Delivery reference (PDL-021). This is conversation feedback, not
a matched replay or final collection acceptance. Task: DELIVERY-BRIDGE-1.

**Delivery · Staggered** remains unchanged at http://127.0.0.1:8282.
Owner feedback calls it much better and not obvious, reports losing the first
attempt, and says that helped subsequent planning (PDL-019). Retain this board
as a Delivery reference; do not automatically make it harder. This is owner
report, not a matched replay or final family acceptance. See its
[design and checks](prototypes/delivery-sequence/README.md).

Connection Run with optional combinations remains available at 8281. Preserve
its existing session URL when continuing; opening its bare URL starts another
capture. Delivery reload starts a new play. Older servers remain untouched.

The preceding bounded consolidation pass preserved source and captures,
clarified current versus historical records, and recorded dispositions. No gameplay,
server shutdown, production adoption, or change to the original portfolio goal
was part of that pass. PDL-017 records the latest aid feedback verbatim;
PDL-018 records Staggered's preparation, PDL-019 its owner feedback, and PDL-020
the authorized contrasting layout. PDL-021 records Landing's positive owner
feedback; gameplay remains unchanged.

Delivery remains the strongest endorsed direction, with Staggered and Landing retained as references;
Connections is now retained as the single current mode on the owner's strong
endorsement (PDL-026). Current Gates, Feeder Choice and Turn the Board
designs are parked; Heat remains an unselected reserve.
The original 3–5-archetype count and required Connections contrast are
superseded, not unfinished mandatory work. Delivery has two retained references
and a first guide. Keep known QA and optional-aid questions explicit; this
scope decision is not release approval, production adoption or formal task
acceptance. No exclusive Connections-only product direction is inferred.
PDL-027 adds the later long-run residue concern without reinstating the quota.

Current scope task: ARCHETYPES-SCOPE-1; reviewer: owner. The earlier
consolidation task was ARCHETYPES-CONSOLIDATE-1. See the workbench
for preservation/restore instructions, remaining checks, and next decisions.

### Historical progression — 2026-10-01

The entries below retain the checkpoints and verification reported at the time.
Their "current", "ready", and "await" wording is historical, not today's queue.

The owner requests three to five distinct archetypes, conceptual design before
technical experimentation, and autonomous work between human decision
checkpoints. The owner explicitly allows new mechanics. This design work is
separate from the historical policy and experiment frontier below.

The [working plan](docs/plans/2026-10-01-level-archetypes-approach.md) owns the
approach. The [concept packet](docs/game-design/levels/2026-10-01-archetype-concepts.md)
recommended Gates, Delivery, and Feeder Choice, with Heat and Turn the Board as
reserves. The owner replied “Honestly any of them sound fine,” delegating the
selection. Codex selected the recommended trio and built isolated representatives.

Current checkpoint: owner play of [the three prototypes](prototypes/archetype-trio/README.md)
at http://127.0.0.1:8274. Eleven rule/replay/capture tests pass; desktop selection,
preview, merge, undo, navigation and saving were checked in Chrome. A narrow
desktop layout was inspected; phone-touch testing remains unverified. The
owner subsequently clarified that Delivery is the clear winner and Feeder
Choice is still undecided (it had not initially been played). Gates did not
require a real decision. Prioritize Delivery and park the current Gates design. The requested
live chain-sum readout is implemented above the board (ARCHETYPES-CHAIN-SUM-1),
with fourteen focused checks passing. Reload starts a new play; do not reset
an active owner game to demonstrate the update.

The next Delivery variation, [Pair Drop](prototypes/delivery-pair-drop/README.md),
is ready at http://127.0.0.1:8275, separately from the original game on 8274.
It explores making a matching value while lowering its partner into position.
The rules and move allowance are unchanged; an exact endpoint contrast and a
winning witness are checked. Nineteen scoped tests pass. The owner has now
played it: the idea is right, but the layout felt easy. The saved three-move
play and its refill-assisted sweep are described in PDL-011 in the
[playtest ledger](prototypes/PLAYTEST-DECISION-LEDGER.md). Keep the Delivery
direction and revise the placement consequences; do not infer family acceptance.
Operational task: DELIVERY-PAIR-DROP-1. The original server was not restarted.

The third board, [Crossroads](prototypes/delivery-crossroads/README.md), is
ready separately at http://127.0.0.1:8276. Two equal-value opening placements
lead to different preparation sequences; both authored routes deliver without
selecting any refill tile. This is feasibility, not difficulty evidence.
Shared rules/UI were untouched. Replay, DOM-stand-in interaction and HTTP
capture checks passed; isolated browser rendering could not be checked.
Both older servers and identities remain unchanged. The owner subsequently
won Crossroads in two moves using no refill tiles. They reported multiple
two-move solutions and explained that the almost-complete value ladder made
the missing construction obvious. See PDL-012 in the playtest ledger.
Operational task: DELIVERY-CROSSROADS-1; reviewer: owner.

The owner then proposed fixed-place and moving-tile connection objectives,
including several per level, and authorized a playtest. [Connections](prototypes/connections/README.md)
is ready separately at http://127.0.0.1:8277: two moving-tile goals plus one
fixed-place goal, all visible, any order, completion retained. A/B endpoints
are protected until their own connection completes; this first-version
convention was announced, not separately accepted. Wider value pools remain
unimplemented. Legal solution routes, marker gravity, undo, UI-script and HTTP
capture checks pass. Visual/native-input QA awaits browser permission.
Operational task: CONNECTIONS-SHARED-1; reviewer: owner. All three Delivery
servers remain unchanged. No shipped gameplay rules were modified.

The owner rejected the first Connections spacing: A and C were adjacent.
[Across the Board](prototypes/connections-spaced/README.md) revises only the
layout and is ready at http://127.0.0.1:8278. Each pair spans four columns;
no goal can be completed on the opening board. Two different goal orders
have checked winning routes without selecting refill tiles. The original
four servers remain live with unchanged identities. Browser QA still awaits
permission; no additional Chrome access was attempted. Operational task:
CONNECTIONS-SPACED-1; reviewer: owner. Await play, not acceptance from checks.

The owner found the spacing more fun but three simultaneous goals too cluttered.
They clarified that ordinary moves must remain unrestricted: an objective is
only satisfied when its endpoint and exact resulting-value conditions match.
The requested longer-running [Connection Run](prototypes/connections-continuous/README.md)
is ready separately at http://127.0.0.1:8279. One fixed-position objective is
active at a time; a 24-entry board-adapted bank wraps without resetting the board.
Opening/refill values range from 2 through 128. Skip, new board, undo, live sum,
per-challenge feedback and local replay capture are available. See PDL-014.
Twenty-five scoped checks pass, including 32 witnessed completions and actual
HTTP capture. Visual/native-input QA remains unverified; no additional browser
access was attempted. All five older games retain their live identities.
Operational task: CONNECTIONS-CONTINUOUS-1; reviewer: owner. Await owner play.

The owner reports enjoying the non-power-of-two twist, but requests help with
repeated target arithmetic. The [updated UI](http://127.0.0.1:8280) adds a
whole-number halving reference and live remaining/over-target amounts, without
changing gameplay or revealing a route. Saved-run continuation preserves the
owner's current 352 challenge in a new capture; the original 8279 game remains
untouched. Twenty-eight scoped checks pass; browser visual/native-input QA
remains unverified. Operational task: CONNECTIONS-MATH-AID-1; reviewer: owner.

The owner clarified that the 352 difficulty was finding the seven-tile numerical
composition, not recognizing the 64's required placement. They approved an
optional **Show combinations** aid. It is ready at http://127.0.0.1:8281, with
saved-run continuation, no board-route spoilers, and unchanged rules. Examples
use power-of-two values and are explicitly non-exhaustive arithmetic possibilities,
not guaranteed board paths. All seven earlier games remain unchanged. Thirty-two
scoped checks pass; native browser QA and dedicated review remain unverified.
See PDL-016. Operational task: CONNECTIONS-COMBINATIONS-1; reviewer: owner.

Do not interpret “continue” for this task as a request to resume policy research.
No shipped game rules changed and no new reportable experiment was run.
Operational task: ARCHETYPES-PROTOTYPES-1; reviewer: owner. After the play
checkpoint, refine retained concepts and provide contrasting variations and
authoring guidance; do not treat this first playable packet as final acceptance.

Open the generated [Universe Map](UNIVERSE.md) for the one-screen control panel of identities, evaluation coverage, evidence standing, warnings, and the current research frontier.

## Trustworthy ruler — 2026-10-02

[RESULT-0058](EVIDENCE_LEDGER.md#result-0058--paired-target-race-ruler-controls-match-the-independent-recompute-bounded-search-is-falsified) records the owner-specified paired target-race ruler provisionally. Its controls and bounded search are independently recomputed; the search outcome is FALSIFIED. Read the [protocol and report](experiments/RESULT-0058/report.md) and [raw-output command](docs/goals/trustworthy-ruler/print-report.js) for its scope, unreached panels and timing-unit limitation. Scientific acceptance and any policy adoption remain separate owner decisions.

The append-only audit and reporting repair is [CORRECTION-0018](EVIDENCE_LEDGER.md#correction-0018--result-0058-gains-complete-win-uncertainty-and-a-stricter-independent-input-audit). It preserves RESULT-0058's sealed data and outcome while adding complete uncertainty output and stricter independent checks. Both records remain provisional; PR #61 is under review and must stay unmerged.

## Learned-judge prerequisite — 2026-10-04

Owner-selected Goal 3 revision 5 closes on Path E in [RESULT-0083](EVIDENCE_LEDGER.md#result-0083--learned-judge-revision-5-stops-at-its-generation-prerequisite). The frozen recorded-board diagnostic triggers its generation prerequisite. No judge was trained, no fresh evaluation or confirmation ran, and no policy was adopted. The result applies only to the specified diagnostic subset; it says nothing about ranking improvements on other moves. See the [closure report](experiments/RESULT-0083/report.md), selected [intent brief](docs/goals/policy-learned-judge/INTENT_BRIEF.md) and frozen [plan](docs/goals/policy-learned-judge/EXPLORATION_PLAN.md). The record remains provisional and the pull request must remain unmerged for the owner. All future seed blocks remain reserved and unrun. No backlog item was changed.

## Evidence-capture hardening — 2026-09-26

[BL-0016](docs/backlog/BL-0016-harden-cross-session-evidence-capture.md) changed how sessions record and check findings. Read [LEDGER-INDEX.md](LEDGER-INDEX.md) first; the experiment gate now checks every record's structure, citations and append-only history, and every new run must name its ledger record. [RESULT-0049](EVIDENCE_LEDGER.md) is the preregistered confirmation supporting the current target-aware champion. The lost 2026-08-28 MAP-Elites archives are [RESULT-0050](EVIDENCE_LEDGER.md) and [RESULT-0051](EVIDENCE_LEDGER.md), neither replacing the then-champion `52f500c`; they were renumbered from PR #46's original RESULT-0049/0050 labels when PR #49 landed first. CORRECTION-0010 to CORRECTION-0017 repair stale evidence pointers and reverify commands. Open: the nightly reverify report still awaits RESULT-0016's confirmation run; two solver bugs found by it are listed in BL-0016.

## Current decision frontier — 2026-09-28

The latest trustworthy sequence is now visible in the ledger:

- [DECISION-0007](EVIDENCE_LEDGER.md#decision-0007--level-54s-126000-target-is-a-deliberate-owner-exception-to-the-demand-rule) records, provisionally, that Level 54's 126,000 target is a deliberate owner exception to the demand rule, not a measurement error; `BL-0020` was dropped on this basis. [DECISION-0008](EVIDENCE_LEDGER.md#decision-0008--pause-porting-the-family-board-map-elites-work-until-frozen-renumbering-is-defined) records, provisionally, that porting the family-board MAP-Elites work is paused until `BL-0023` criterion 7 defines frozen renumbering.
- [DECISION-0009](EVIDENCE_LEDGER.md#decision-0009--keep-level-53-as-shipped-at-101000) records, provisionally, that the owner keeps Level 53 as shipped at 101,000 with its 0.95 demand; this closes the open adjudication of how it entered the game.

- [RESULT-0056](EVIDENCE_LEDGER.md#result-0056--fresh-board-owner-vs-oracle-run-for-result-0044-board-2-human-attempt-invalid-inconclusive) closes `RESULT-0044` by its fresh-run option, and `RESULT-0044` is now superseded. The outcome is `INCONCLUSIVE`: before the oracle ran, the owner ruled one of the two owner attempts invalid because bombs had no readable art. Open: give bombs readable art before more owner play counts as evidence, and make oracle runners record and check HEAD.

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

**The owner-specified fitness ruler is implemented and provisionally qualified in RESULT-0058.** Compare paired wins gained or lost first, then moves-to-target on mutual wins, with independent fresh admission for archive nominees. The [report](experiments/RESULT-0058/report.md) bounds that qualification to its declared shipped-level panel. [BL-0011](docs/backlog/BL-0011-shipped-levels-cannot-measure-policy-quality.md) still governs benchmark saturation, and `solver/human-benchmark.js` supplies the recorded-human comparison. BL-0013's proposed policy vocabulary remains open.

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
