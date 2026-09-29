# LC-0012 — frozen early-ready timing panel contract

**Frozen:** 2026-09-28, after `RESULT-0063` closed the one-state timing tie and
before any immediate-cash counterfactual was executed on another recording

**Status:** frozen exhaustive-corpus paired comparison

**Consuming decision:** determine whether the exact single-state tie warrants a
broader cashout-timing rule. This contract may support, falsify, or leave that
rule unresolved on the frozen captured-play corpus. It cannot change the
champion, define a new policy metric, generalize beyond the selected frozen
opportunities, or authorize adoption.

## Experiment-type declaration

- **Primary design:** `ab-comparison`, SHA-256
  `a6f1c86ab5ce9c942a12888b0b8f9885d4ca53e5530683d382a7666d1a0fade9`.
- **Context profile:** `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- **Assurance profile:** `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- **Control contract:** SHA-256
  `10de8551b57dfb9ec888f8d2853c17e9c1efbc5ea678cda2b0b5cd72b5fdb031`.

This is an exhaustive paired comparison over a frozen file corpus, not random
sampling. The experimental unit is one deterministically selected early-ready
opportunity in one recording. The unit of generalization is only the selected
opportunities in the 24-file source manifest; recordings without an eligible
opportunity remain part of the selection denominator but are not experimental
units. No claim extends to another recording, player, level, seed, or policy.

## Question and primary comparison

Across the frozen captured-play corpus, when a route that the owner eventually
cashes is already legal before an earlier different move, does cashing that
route immediately improve target-stop performance, or does the observed wait
ever preserve a faster or more reliable finish?

Reliability is primary. Within a pair, an arm that reaches the target beats one
that does not. If both reach it, fewer moves from the common state to first
target crossing is better. The exact paired effect is
`cashNow.movesToTarget - observedWait.movesToTarget`; positive favors waiting,
negative favors cashing now, and zero is a target-cost tie. Score at stopping,
route points, wait length, post-move state identities, and refill consumption
are diagnostics only. In particular, score overshoot cannot decide the primary
comparison.

For the exhaustive selected panel, retain the count of:

- observed-wait-only wins;
- cash-now-only wins;
- mutual wins where observed wait is faster;
- mutual wins where cash-now is faster;
- mutual-win target-cost ties; and
- neither-wins pairs.

Define a harmful cash-now cell as an observed-wait-only win or a mutual win in
which cash-now is slower. Define a helpful cash-now cell as a cash-now-only win
or a mutual win in which cash-now is faster. Report every cell and the exact
mean and median paired effect over mutual wins, with conditional uncertainty
zero. There is no population uncertainty estimate because the fixed corpus is
exhausted; absence of population inference must be explicit.

## Frozen source universe

The source universe is exactly the 24 paths and file identities in
`docs/learning-cycles/LC-0012-timing-panel-source-manifest.json`, SHA-256
`adbd7ff672af65e0b9980d28327c8c6d8bcf42374c063299132a0bf0e1f64e55`.
The manifest also freezes the engine, champion, terminal classifier, replay and
recording resolvers, shipped level data, and the accepted LC-0011 antecedent.

Every listed recording stays in the selection denominator. A file that cannot
resolve to its shipped board, fails exact replay, has inconsistent move counts,
or violates terminal ordering makes the whole run `UNVERIFIED`; it is not
silently excluded. Files added after the manifest was frozen are out of scope.

## Outcome-blind opportunity selector

Replay each recording through the real engine while assigning stable ancestry
node IDs to initial tiles, refills, and merge survivors. Retain every pre-move
state and every later recorded chain's ordered direct-input node IDs.

A candidate opportunity `(recording, readyMove, cashoutMove, route)` is
eligible only when all of these are true:

1. `cashoutMove >= readyMove + 1`, so at least one different recorded move is
   taken while the route is already available.
2. At the pre-`readyMove` state, every ordered direct input of the chain the
   owner executes at `cashoutMove` is live exactly once, and those live objects
   form an engine-valid chain in that frozen order.
3. The same ordered node IDs remain live and engine-valid before every recorded
   move from `readyMove` through `cashoutMove`; no intervening recorded chain
   consumes or rewrites a route input.
4. The target has not been reached and no bomb, move-budget, or no-legal-move
   terminal condition has occurred at the common state.
5. Exact replay reaches the recorded cashout move without drift.

Select at most one opportunity per recording. Sort eligible candidates by
`readyMove` ascending, then `cashoutMove` ascending, then the SHA-256 of the
ordered route-node-ID list ascending; retain the first. This rule favors the
earliest observed timing choice and then the shortest observed delay without
using either counterfactual outcome. Duplicate boards, seeds, or paths remain
separate recordings, but each file contributes at most one unit.

The selector must retain the complete 24-row eligibility ledger, every
candidate key, selected/non-selected disposition, ready and cashout move
numbers, route-node IDs, live route coordinates and values at readiness, route
points if executed then, and the reason for every ineligible recording.

The LC-0011 anchor in recording
`ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`
must appear among the eligible candidates at pre-move 14 for the chain actually
cashed on move 15. It need not be that recording's selected opportunity if an
earlier candidate wins the frozen sort.

## Arms, exposure, and continuation

Each arm independently reconstructs the exact selected pre-`readyMove` state
and RNG prefix.

### Control — `OBSERVED_WAIT`

Execute the recording's exact chains from `readyMove` through `cashoutMove`,
including the eventual ready route, through the real engine and original game
RNG. Check the target-stop terminal predicate after every transition and stop
at the first terminal condition. If the arm remains active after the recorded
cashout, use the unchanged champion through its public chooser and real engine
transition until terminal.

### Treatment — `CASH_NOW`

At the identical common state, resolve the selected route's ordered node IDs
to their current live tile objects and execute that exact legal route
immediately. Check the same target-stop predicate. If play remains active, use
the unchanged champion through the same public chooser and real engine
transition until terminal.

The arms intentionally receive different numbers and identities of initial
actions: `OBSERVED_WAIT` is the owner's retained waiting package through the
recorded cashout; `CASH_NOW` changes only that timing package. After the package
ends, both use the same champion. Each arm owns an independent identical RNG
prefix and consumes its own subsequent draws; divergent refill counts are part
of the intervention, not contamination.

Retain the pair identity, common-state identity and objective, assignment,
every action source, chain, points, score, move number, post-state identity,
refill draw count, terminal result, first target crossing, and moves-to-target.
No arm may continue after its first terminal state.

## Run matrix, completeness, and bounds

The matrix is exactly two arms for every selected recording. Completeness
requires:

- all 24 source rows retained in the eligibility ledger;
- exactly one pair for every selected row and none for an unselected row;
- both arms complete to a real terminal state;
- identical common state, target, move budget, and RNG prefix within each pair;
- exact registered assignment of the observed waiting package and immediate
  route; and
- no missing, retried, imputed, or silently excluded cell.

Each arm may execute at most the common state's actual remaining move budget.
Any attempt to exceed it, any runtime failure, or any missing legal champion
choice before a classified terminal state makes the run `UNVERIFIED`. The
selector is exhaustive over the 24 files and their recorded move pairs; it has
no stochastic search and no retry.

The panel diversity floor is four selected recordings spanning at least three
distinct shipped level numbers. This is not a power claim: it is the smallest
declared boundary that makes the panel broader than the prior one-state and
one-level result. Failing the floor yields `INSUFFICIENT_PANEL` without changing
the selector or adding recordings.

## Registered domain outcomes

Apply these in order after validity and the diversity floor:

1. `UNVERIFIED`: any source, replay, selection, assignment, objective,
   completeness, terminal, identity, or control requirement fails.
2. `INSUFFICIENT_PANEL`: the run is valid but fewer than four recordings or
   fewer than three level numbers are selected.
3. `MIXED_TARGET_EFFECT`: at least one harmful and at least one helpful
   cash-now cell exist.
4. `WAIT_HAS_TARGET_VALUE`: at least one harmful cash-now cell exists and no
   helpful cell exists.
5. `CASH_NOW_TARGET_SUPPORTED`: at least one helpful cash-now cell exists and
   no harmful cell exists.
6. `TARGET_COST_TIE_PANEL`: every selected pair is a mutual win with equal
   moves-to-target.
7. `NO_TARGET_RESOLUTION`: the valid, diverse panel fits none of the above,
   including a panel containing neither-wins cells but no directional cell.

`CASH_NOW_TARGET_SUPPORTED` is corpus-bounded evidence, not authority to change
the champion. Any harmful cell prevents that outcome regardless of the mean.

## Controls

### C1 — frozen corpus, ruleset, and exact replay

- **Role/profile:** deterministic identity and replay,
  `ab-comparison` / `simulation-policy`.
- **Subject/seam:** all paths in the source manifest through the real resolver,
  recording replay, engine, and terminal classifier.
- **Expected:** all identities match; all 24 recordings resolve and replay
  exactly; the frozen source count is neither reduced nor expanded.
- **Failure meaning:** qualification fails or the run is `UNVERIFIED`.
- **Evidence:** qualification receipt and raw 24-row eligibility ledger.

### C2 — known early-ready positive anchor

- **Role/profile:** positive selector control, `simulation-policy`.
- **Subject/seam:** the LC-0011 Level 54 recording through the new public
  selector.
- **Expected:** an eligible candidate exists at pre-move 14 for the route
  cashed on move 15, with the LC-0011 common state identity and ordered values
  nine 1,024 tiles followed by 2,048.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification anchor observation and focused test.

### C3 — planted missing route input

- **Role/profile:** negative selector control and known-kill mutation,
  `mutation-qualification`.
- **Subject/seam:** the public eligibility validator on the C2 anchor.
- **Mutation:** remove one named live direct input before readiness validation.
- **Expected:** mutation presence and reachability are recorded; it is rejected
  specifically for a missing route input.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification mutant disposition and focused test.

### C4 — versioned control and deterministic A/A

- **Role/profile:** reference arm and synthetic null, `ab-comparison` /
  `simulation-policy`.
- **Subject/seam:** two independent `OBSERVED_WAIT` replays of the C2 anchor
  through the real transition and terminal seams.
- **Expected:** byte-identical traces, target crossing on move 15, paired
  moves-to-target difference zero.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** disposable A/A traces in the qualification receipt.

### C5 — assignment integrity and planted arm swap

- **Role/profile:** assignment-integrity and known-kill mutation,
  `ab-comparison` / `mutation-qualification`.
- **Subject/seam:** the public pair validator and first package/action identity.
- **Mutation:** label the anchor's first observed 3,072-point wait action as the
  `CASH_NOW` route.
- **Expected:** rejection specifically for arm/package mismatch.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification mutant disposition and focused test.

### C6 — objective equivalence and target-stop ordering

- **Role/profile:** objective-equivalence, `simulation-policy`.
- **Subject/seam:** both reconstructed arms and the production terminal
  classifier.
- **Expected:** common states, targets, move budgets, bomb semantics, and
  target-stop ordering match; a planted post-target action is rejected.
- **Failure meaning:** qualification fails or the pair is `UNVERIFIED`.
- **Evidence:** qualification receipt and raw pair invariants.

### C7 — one unit per recording

- **Role/profile:** assignment integrity, `ab-comparison`.
- **Subject/seam:** selector reduction from all candidates to selected units.
- **Expected:** a fixture with two eligible candidates in one recording retains
  exactly the candidate first under the registered three-key sort.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** focused test and qualification fixture.

### C8 — restoration and persistence before verdict

- **Role/profile:** restoration, `mutation-qualification`.
- **Subject/seam:** harness identity and persist-before-verdict writer.
- **Expected:** clean harness identity is unchanged after mutations; a planted
  interpretation failure occurs only after a complete disposable artifact has
  been persisted.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification receipt and focused test.

### C9 — executable closeout admission

- **Role/profile:** closeout integrity, common lifecycle.
- **Subject/seam:** committed closeout contract, vendored verifier, and exact
  contract-relative paths.
- **Expected:** a disposable synthetic panel closes with byte-matched
  recomputation and intact hashes; reportable paths remain absent afterward.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification receipt with resolved paths and verifier output.

## Qualification and evidence budget

The not-yet-built harness and focused test must be bound by a mechanically
generated manifest covering this committed contract, the source manifest and
every file it names, the LC-0011 antecedent, harness, and test. Expected input
identities must reach validation from outside candidate-controlled artifacts.
A coherently rehashed changed recording, engine, selector input, or arm label
must be rejected against the external manifest identity.

At most two qualification attempts are allowed. Qualification may enumerate
eligibility, exercise the known `OBSERVED_WAIT` anchor, and run disposable
fixtures and mutations. It may not execute `CASH_NOW` for any recording other
than a synthetic fixture that cannot disclose a corpus outcome. After
qualification, execute exactly one exhaustive reportable matrix with no retry.
Persist the complete source ledger and every paired raw trace before applying
the registered outcome rule.

Forbidden adaptations after freeze include adding/removing recordings,
changing the selector or tie-break, selecting a second opportunity from a
recording, changing the diversity floor, changing the primary objective,
downgrading a harmful cell to a diagnostic, changing the champion, retrying a
cell, or using score overshoot to resolve target-cost ambiguity.

## Result locations

- Raw matrix: `docs/learning-cycles/LC-0012-early-ready-timing-panel-raw.json`.
- Primary recomputation:
  `docs/learning-cycles/LC-0012-early-ready-timing-panel-recomputed.json`.
- Closure: `docs/learning-cycles/LC-0012-early-ready-timing-panel-closure.json`.
- Explanation:
  `docs/learning-cycles/LC-0012-early-ready-timing-panel-result.md`.

## Frozen identities

- Source revision:
  `67c67ea401bafcdbf8bbddcc2b5ed04f27313181`.
- Source manifest SHA-256:
  `adbd7ff672af65e0b9980d28327c8c6d8bcf42374c063299132a0bf0e1f64e55`.
- LC-0011 result SHA-256:
  `3d70ce3dfa717487fa136df41fc1bc50505b23adfd3dfb7b8309bed40f28e8c9`.
- LC-0011 closure SHA-256:
  `6222cf5941438ca90db896e45efda488694ee30653bca231e8ac919748ea1bdd`.
- Ruleset `solver/engine.js` SHA-256:
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Champion `solver/bot.js` SHA-256:
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.
- Terminal classifier `solver/benchmark-replay.js` SHA-256:
  `a714232d4e4bf308c7c6231d792ee90259f5bc9b4f33d9d1a2c21f0157e15167`.
- Recording replay `solver/recording-replay.js` SHA-256:
  `c7284bb2fac849db00049a46663f287edf34167cb1d688875b75f0ba543ddbd4`.
- Recording resolver `solver/human-benchmark.js` SHA-256:
  `aeb2bef796ecedb8ab07a8f9a878b133e037ddffd8d09ac31afb64aac9005772`.
- Shipped level data `src/game.js` SHA-256:
  `3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1`.
