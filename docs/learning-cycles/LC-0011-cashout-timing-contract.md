# LC-0011 — exact cash-now versus wait-one counterfactual contract

**Frozen:** 2026-09-28, after RESULT-0062 identified the single early-ready
route and before either counterfactual arm was executed

**Status:** frozen exact-state paired counterfactual

**Consuming decision:** determine whether the one observed move of waiting
improved target-stop performance in the exact Level 54 move-11 owner state.
This contract cannot define a general timing metric, search another action,
generalize beyond the named state, modify the champion, or authorize adoption.

## Experiment-type declaration

- **Primary design:** `ab-comparison`, SHA-256
  `a6f1c86ab5ce9c942a12888b0b8f9885d4ca53e5530683d382a7666d1a0fade9`.
- **Context profile:** `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- **Assurance profile:** `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- **Control contract:** SHA-256
  `10de8551b57dfb9ec888f8d2853c17e9c1efbc5ea678cda2b0b5cd72b5fdb031`.

This is a deterministic paired comparison on one exact state. The experimental
unit and unit of generalization are each the named pre-continuation-3 state;
there is no claim about another board, seed, move, route, player, or policy.

## Question and primary comparison

At the exact owner-move-11 state where the ten-tile correction route is already
legal, does cashing that route immediately or taking the observed separate
3,072-point move first produce the better target-stop outcome under the
unchanged champion?

Reliability is primary. If exactly one arm reaches the target, that arm is
better. If both reach it, fewer moves from the common state to first target
crossing is better. The paired effect is
`cashNow.movesToTarget - waitOne.movesToTarget`; positive favors waiting,
negative favors cashing now, and zero is a target-cost tie. One move is the
smallest practical difference because moves are integral. Score at stopping,
first-action points, terminal reason, and post-move state identities are exact
diagnostics and cannot replace the primary comparison.

There is no sampling uncertainty: one replay exhausts each deterministic arm
for this one exact unit. Report the exact effect with conditional uncertainty
zero and explicitly retain the absence of population inference.

## Frozen common state

Reconstruct Level 54 seed `1313839221` by replaying recording
`ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`
through recorded moves 1–10, the retained move-11 owner decision, and its first
two unchanged champion continuations. The common pre-action state must have:

- state identity
  `d6bf03cee41bd1539b167c8de37ea7b87e269f4fef473c3bf3144e74fc416dff`;
- score `66,752`, moves used `13`, maximum moves `24`, and target `126,000`;
- the same reconstructed RNG stream immediately after continuation 2; and
- the LC-0010 correction route executable with ordered node IDs
  `M002,P024,P028,P032,P031,P030,P029,P026,P021,P025`.

The frozen starting score is the exact sum of the first ten recording moves
(`42,752`), owner move 11 (`5,120`), and continuations 1 and 2 (`13,760` and
`5,120`). Qualification must recompute it from the named sources rather than
trust this prose.

## Arms, exposure, and continuation

### Control — `WAIT_ONE`

At the common state, call the unchanged champion through `analyzeMove` with its
normal `LOOKAHEAD_BASE + state.moves` lookahead RNG. It must select the exact
LC-0010 continuation-3 chain
`64,64,128,128,128,128,128,256` for 3,072 points. Apply the real engine
transition, refill from the reconstructed game RNG, tick blockers, and check
the target-stop terminal predicate. If play continues, use the same unchanged
champion and real transition until terminal.

### Treatment — `CASH_NOW`

At the identical common state, resolve the ten frozen correction input nodes
to their live tile objects in their frozen order and execute that exact legal
route immediately. Its already-established chain values are nine 1,024 tiles
followed by 2,048, for 56,320 points. Apply the same real transition, refill
from an independently reconstructed but initially identical game RNG, tick
blockers, and check the same target-stop terminal predicate. If play continues,
use the unchanged champion and real transition until terminal.

Each arm gets its own deterministic reconstruction of the common state and RNG
prefix. No random draw is shared after the arms take different actions, because
different chain lengths may consume different refill counts. The treatment is
only the first action; every later selection and every terminal check use the
same production seam.

Retain, per arm, the common-state identity, score and move count, first-action
identity, every selected chain, points, cumulative score, move number,
post-state identity, RNG-refill count when observable, blocker/terminal result,
first target crossing, and final outcome.

## Assignment and analysis

Assignment is deterministic matched crossover: both labels receive independent
reconstructions of the exact same state and RNG prefix. `WAIT_ONE` receives the
champion-selected 3,072-point action; `CASH_NOW` receives only the exact frozen
ready route. An arm-label or first-action swap is invalid.

No exclusions, attrition, imputation, covariates, stratification, pre-period
adjustment, or multiple comparison exists. A missing arm, identity mismatch,
illegal action, replay drift, runtime error, bomb/objective mismatch, or
incomplete terminal trace makes the comparison `UNVERIFIED`.

## Registered domain outcomes

- `WAIT_ONE_MOVE_BETTER`: waiting wins when cashing now does not, or both win
  and waiting reaches the target at least one move earlier.
- `CASH_NOW_BETTER`: cashing now wins when waiting does not, or both win and
  cashing now reaches the target at least one move earlier.
- `TARGET_COST_TIE`: both arms have the same terminal win/loss status and, when
  both win, the same first target-crossing move.
- `NEITHER_WINS`: both arms terminate without reaching the target; this is kept
  separate from a successful timing comparison.
- `UNVERIFIED`: any required identity, control, arm, trace, or terminal fact is
  absent or inconsistent.

`TARGET_COST_TIE` does not mean the boards or scores are identical; it means
waiting did not buy a move on this exact target-stop question.

## Controls

### C1 — frozen source and common-state replay

- **Role/profile:** assignment integrity and deterministic replay,
  `ab-comparison` / `simulation-policy`.
- **Subject/seam:** the committed LC-0010 evidence, recording, ruleset,
  champion, and the real replay path used by both arms.
- **Expected:** every identity matches and both reconstructions produce the
  frozen state identity, score, move count, target, route, and RNG-prefix
  fingerprint.
- **Failure meaning:** qualification fails or the run is `UNVERIFIED`.
- **Evidence:** qualification receipt and raw arm-start records.

### C2 — versioned reference and synthetic A/A

- **Role/profile:** reference policy and synthetic null, `ab-comparison` /
  `simulation-policy`.
- **Subject/seam:** two independent `WAIT_ONE` replays through the actual public
  chooser, transition, and target-stop seam.
- **Expected:** both traces byte-match; the first two points are 3,072 and
  56,320; the first target crossing is move 15; the paired difference is zero.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification receipt with both retained disposable traces.

### C3 — arm assignment and planted swap

- **Role/profile:** assignment-integrity and known-kill mutation,
  `ab-comparison` / `mutation-qualification`.
- **Subject/seam:** the public artifact validator and each arm's first-action
  identity.
- **Mutation:** relabel the known `WAIT_ONE` first action as `CASH_NOW` while
  retaining its 3,072-point chain.
- **Expected:** mutation presence and reachability are recorded; rejection is
  specifically for first-action/arm mismatch.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** focused test and qualification mutant disposition.

### C4 — objective equivalence

- **Role/profile:** objective equivalence, `simulation-policy`.
- **Subject/seam:** both common-state reconstructions and terminal classifier.
- **Expected:** target 126,000, score 66,752, move 13 of 24, bomb semantics,
  target-stop ordering, and subsequent champion are identical; only the first
  action differs.
- **Failure meaning:** qualification fails or comparison is `UNVERIFIED`.
- **Evidence:** qualification receipt and raw invariant block.

### C5 — known target-stop reference

- **Role/profile:** positive control, `simulation-policy`.
- **Subject/seam:** the real `WAIT_ONE` reference through the production
  transition and terminal path.
- **Expected:** its known 3,072 then 56,320 sequence stops at the first target
  crossing on move 15 rather than continuing.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** disposable reference trace and focused test.

### C6 — planted post-target continuation

- **Role/profile:** negative control and known-kill mutation,
  `mutation-qualification`.
- **Subject/seam:** the public trace validator.
- **Mutation:** append one legal-looking move after the reference trace's first
  target crossing.
- **Expected:** rejection specifically for continuation after target.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification mutant disposition and focused test.

### C7 — restoration and raw persistence

- **Role/profile:** restoration, `mutation-qualification`.
- **Subject/seam:** harness identity and persist-before-verdict writer.
- **Expected:** clean harness identity is unchanged after controls; a planted
  interpretation failure occurs only after a complete disposable pair artifact
  is persisted.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification receipt and focused test.

### C8 — executable closeout admission

- **Role/profile:** closeout integrity, common lifecycle.
- **Subject/seam:** committed closeout contract, real vendored verifier, and
  exact contract-relative paths.
- **Expected:** a disposable synthetic pair closes with byte-matched
  recomputation and intact hashes; reportable paths remain absent afterward.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification receipt with resolved paths and verifier output.

## Qualification and evidence budget

The not-yet-built harness and focused test must be bound by a mechanically
generated manifest containing full identities for this committed contract,
all frozen LC-0010 evidence, the recording, ruleset, champion, harness, and
test. Expected input identities must reach validation from outside any
candidate-controlled artifact. A coherently rehashed changed recording or
engine must be rejected against the external manifest identity.

At most two qualification attempts are allowed. Qualification may replay only
the already-known `WAIT_ONE` reference and disposable controls; it may not
execute `CASH_NOW` beyond validating that its frozen route is present and legal
at the common state. After qualification, execute exactly one reportable pair,
at most eleven continuation moves per arm (the remaining move budget), with no
retry. Persist both complete raw arm traces before applying the outcome rule.

## Frozen identities

- Source revision: `23a27f57eb19a7ffa97e6c3c184605665aa4a728`.
- LC-0010 contract SHA-256:
  `4bc0403313d3675821e9183fd33dd4988d2ef7e05d3249fc1caf1b09fcb9840d`.
- LC-0010 manifest file SHA-256:
  `c65e2829d93d0dbc7ca3a62cee8a6ad287837cd61ecbc25d0dad03c72dfc3c39`.
- LC-0010 qualification SHA-256:
  `3e95292925673aee42e5a9e9c2476010394c6bb05eb5d6d1549e9bf24a9399dd`.
- LC-0010 raw SHA-256:
  `65d842dc417b76064e2b623a9d7a4be0bfbac9875580b8fa51848dcb65f1b5db`.
- LC-0010 result SHA-256:
  `1849e64ae2c7f2bfb5da63a8946065627a088265ed07506808f953d4373eb9e7`.
- LC-0010 closure SHA-256:
  `fb06cac5df9428f833b3d5d6d1e23d0be784d200c9d5ff3211cb0110a9edc01c`.
- LC-0010 analyzer SHA-256:
  `56bccabbb57ae609e3649a88af4d14d3b9dfe77507827c6c0874ba6dcfa643e7`.
- LC-0010 focused test SHA-256:
  `0f365fc5e3529024b4b299874c37a64d6bb28a7f81eaaaebcbd33ef5e3891c35`.
- LC-0010 result test SHA-256:
  `af4e57566bdf2774680e4f9b9237c697b5d7f348c323cde50b3f9d46ba2ff175`.
- Recording SHA-256:
  `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.
- Ruleset `solver/engine.js` SHA-256:
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Champion `solver/bot.js` SHA-256:
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.

The harness, focused test, manifest, and closeout-contract identity slots are
empty until implementation. They must be committed before qualification and
the reportable pair; this contract does not change.

## Stop and interpretation boundaries

Stop after the one pair is persisted, recomputed, and closed. Report whether
waiting wins, cashing now wins, or target cost ties, with exact trajectories.
Do not tune the route, try a second cash timing, add another state, call the
winner a policy rule, define a metric, or modify the champion.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, or prior learning-cycle artifact.
