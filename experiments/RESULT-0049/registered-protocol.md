# RESULT-0049 — current-champion paired confirmation

Registered before any reportable seed in `45,000,000–45,000,299` is opened.
This is a post-adoption confirmation audit. It does not retroactively authorize
the 2026-08-30 promotion and cannot automatically keep, replace, or roll back
the current champion.

## Question and consuming decision

On the current 58 shipped levels, does the production `chooseMove` target-aware
champion safely match or improve on its preserved `chooseBaseMove` when both
play the same fresh boards and stop on the target-crossing move?

The owner may use the closed result to decide whether the current champion
remains satisfactory or whether replacement work should be opened. No domain
outcome changes production code by itself.

## Experiment type

- Primary design: `ab-comparison`, profile SHA-256
  `a6f1c86ab5ce9c942a12888b0b8f9885d4ca53e5530683d382a7666d1a0fade9`.
- Context: `simulation-policy`, profile SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Assurance: `mutation-qualification`, profile SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.

## Subjects and production seam

- Control arm `base`: exported `chooseBaseMove` from `solver/bot.js`.
- Treatment arm `champion`: exported production `chooseMove` from the same
  file. This is the policy identified by `DECISION-0004`, including subsequent
  fixes present in the frozen source identity.
- Both arms run through `playToTerminal` in `subject.js`, using the real
  `solver/engine.js` transitions and shipped `src/game.js` level definitions.
- Final subject identity:
  `41d758a294aa491fd0a257209fc502dcc47a0c77730daf7d81251fa52ba84144`.

The only permitted free variables are level number and seed. Rules, levels,
targets, move budgets, spawn stream, lookahead stream, termination, and
measurement code are shared and frozen.

## Units, assignment, panel, and completeness

- Experimental unit: one `(shipped level, seed)` pair.
- Unit of generalization: the current set of 58 shipped levels under the
  game's seeded spawn process, not future levels and not human play.
- Assignment: deterministic paired crossover in code; both arms receive the
  identical level and seed. Cells are stored level-major.
- Levels: every shipped level, 1 through 58.
- Seeds: fresh reportable range `45,000,000–45,000,299`, 300 seeds per level.
- Matrix: 58 × 300 = 17,400 paired cells, 34,800 games.
- Completeness: every declared cell contains both terminal outcomes in exact
  order. No exclusion, imputation, attrition, timeout substitution, or partial
  denominator is allowed. A missing or duplicate cell makes closure `INVALID`.

The 300-seed count matches the per-level denominator of the accepted
RESULT-0018/RESULT-0020 comparison while extending the panel to all 58 current
levels. It is a fixed bounded audit, not a power-derived stopping rule and not
a sequential design.

Qualification seed `44,999,999` and the already-burned Level 51 seed 1 fixture
are excluded from the reportable panel. The reportable range was absent from
`experiments/SEEDS.md` and repository search at registration time.

## Objective and termination

Both arms optimize and are measured on the same target-stop objective. A game
ends on target reached, bomb explosion, no legal move, or exhausted move
budget. Reliability is evaluated before speed. Crossing score is retained only
as a diagnostic of final-move overshoot; a same-speed score difference is not
a regression and cannot change the primary outcome.

For the effect estimate, target cost is `movesToTarget` for a win and
`moveBudget + 1` for a loss. The effect is base cost minus champion cost, so a
positive value favors the champion. The reported mean uses every paired cell.
Uncertainty is the larger of the standard errors across 58 level means and 300
seed means, with a symmetric 95% interval of estimate ± 1.96 × that standard
error. This estimate is descriptive; the strict cellwise safety rule below is
decision-bearing.

## Frozen controls

### C1 — reference and deterministic replay

- Role/profile: baseline and reference policy; `simulation-policy`.
- Subject/seam: `chooseBaseMove` and `chooseMove` through real
  `playToTerminal`.
- Expected: an A/A run using `chooseBaseMove` for both arms is byte-equivalent
  at the outcome level and classifies `INCONCLUSIVE`; replay of the same
  level/seed/arm is deterministic.
- Failure meaning: qualification `FAIL`; reportable seeds remain unopened.
- Evidence: focused tests and qualification receipt.

### C2 — target-aware positive control

- Role/profile: positive control; `ab-comparison`.
- Subject/seam: production exports on the already-burned Level 51 seed 1
  fixture.
- Expected: base and champion trace identities differ while both use identical
  objective and transition code.
- Failure meaning: qualification `FAIL`; the harness has not shown treatment
  exposure.
- Evidence: focused test and qualification receipt.

### C3 — assignment-integrity control

- Role/profile: assignment integrity; `ab-comparison`.
- Subject/seam: corpus validator over the exact level-major matrix.
- Expected: complete real pairs pass; a removed pair, changed order, duplicate,
  or mismatched level/seed fails.
- Failure meaning: qualification `FAIL` before the run, or run `INVALID` after
  reportable execution.
- Evidence: negative tests and corpus validation output.

### C4 — objective-equivalence control

- Role/profile: custom objective integrity; `simulation-policy`.
- Subject/seam: paired cell validation and shared play function.
- Expected: both arms share level, seed, move budget, target-stop semantics,
  transition sequence, and lookahead RNG construction.
- Failure meaning: qualification `FAIL` or run `INVALID`; score and speed
  comparisons are forbidden.
- Evidence: source identity, tests, and corpus validation.

### C5 — known-kill regression mutation

- Role/profile: known-kill; `mutation-qualification`.
- Protected claim/seam: strict safety classification through `summarize`.
- Mutation: a signed paired cell in which the champion reaches the target one
  move later than the base.
- Expected: mutation is independently shown present and returns exactly
  `DOES_NOT_SUPPORT_CURRENT_CHAMPION` for the intended `baseFaster` reason.
- Failure meaning: qualification `FAIL`; reportable seeds remain unopened.
- Evidence: focused test and qualification receipt.

### C6 — identity, persistence, restoration, and closeout

- Role/profile: coherent-substitution, restoration, and custom publication
  integrity; `mutation-qualification`.
- Subject/seam: public corpus validator, `persist-before-verdict`, and the exact
  executable closeout contract.
- Expected: a coherently re-signed bundle with a substituted bot hash fails
  against the externally frozen identity; a thrown verdict leaves the complete
  raw artifact; all source hashes are restored; a disposable synthetic closure
  passes the exact contract/recomputation route; the reportable corpus path is
  absent before the one run.
- Failure meaning: qualification `FAIL` or `UNVERIFIED`; reportable seeds remain
  unopened.
- Evidence: focused tests, qualification receipt, hash check, and synthetic
  closeout transcript.

Equivalent, stillborn, duplicate, or unreachable mutations do not count as
kills. The frozen C5 mutation is the single denominator and must fail for the
named reason. Harness errors and timeouts are not kills.

## Primary comparisons and domain outcomes

### P1 — safety

`PASS` only with exactly zero base-only wins and zero mutual-win cells where
the champion is slower. Any such cell is `FAIL`.

### P2 — non-vacuous benefit

`PASS` with at least one champion-only win or at least one mutual-win cell
where the champion is faster. Otherwise `FAIL`.

### P3 — registered outcome

- `DOES_NOT_SUPPORT_CURRENT_CHAMPION`: P1 fails.
- `SUPPORTS_CURRENT_CHAMPION`: P1 passes and P2 passes.
- `INCONCLUSIVE`: P1 passes and P2 fails.

P1 dominates the mean effect: average gains cannot compensate for even one
observed reliability or speed regression in this fixed panel. Same-speed score
differences, changed trace counts, compute time, per-level summaries, and the
uncertainty interval are diagnostics only.

## Attempts, budget, and stop rules

1. Qualification may use only seed `44,999,999`, already-burned fixtures, and
   synthetic cells. It must pass C1–C6 before reportable execution.
2. The exact committed protocol, contract, hashes, paths, and synthetic
   closeout route must pass pre-outcome admission.
3. One reportable run is authorized, bounded to 17,400 pairs. No retry,
   replacement seed, partial resume, threshold change, or second reveal.
4. Raw complete pairs are validated and written once before verdict
   evaluation. The output file may not be overwritten.
5. Runtime failure preserves partial diagnostics but closes `INVALID` or
   `UNVERIFIED` without a primary domain outcome.
6. Any frozen identity drift, missing cell, registration failure, or objective
   mismatch stops the run. A later repair requires a new result ID and fresh
   seeds.

## Required evidence and closure

Required artifacts are `corpus`, `report`, and `primary-recomputation`.
Required claim cells are C1–C6 and P1–P3. Closure is executable through the
adjacent `closeout-contract.json`; its trusted SHA-256 is recorded in the
registered `protocol.md`. The closure verifier identity used at registration
is `7ed2647d28bfe3df9bed227216f28959c9a7e767dd112c2952f7c2d3c3619830`.

The final report must state the complete pair counts, effect estimate and
uncertainty, deviations, evidence identities, and limitations. It must not
claim human superiority, future-level generalization, terminal-score
optimization, autonomous learning, or causal explanation beyond the exact
target-aware wrapper contrast.

## Adoption boundary

This experiment stops at a verified closure. `SUPPORTS_CURRENT_CHAMPION` does
not newly promote the policy; `DOES_NOT_SUPPORT_CURRENT_CHAMPION` does not
automatically roll it back. Either production decision requires a separate
owner action and record.
