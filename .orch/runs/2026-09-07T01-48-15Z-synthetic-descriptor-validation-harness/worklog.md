# Worklog — synthetic descriptor validation harness

## Goal (frozen)

### Objective

A committed experiment-local harness exposes a deterministic nine-policy full
factorial whose two controls separately shift beam-relative capture greed and
early-versus-late harvesting, reports correctly defined half-score timing
against the full move budget, and fails closed before producing evidence when
registration, coverage, identity, or artifact integrity is absent. The nine
policies are three greed centers crossed with three timing slopes; they are not
a 3x3 MAP-Elites archive.

### Acceptance

1. Correct episode descriptor through the focused Node test, including an
   early-ending fixture whose denominator is the full move budget.
2. Two distinct synthetic controls through the focused Node test, with exactly
   three greed centers crossed by three signed timing slopes and stable subject
   identities.
3. Real legal candidate seam through the focused Node test, using
   `findGreedyChains`, legal prefixes, deterministic legal selection, and named
   `beamGreedRatio`.
4. Experiment ordering fails closed through the real CLI before output, and
   output overwrite is refused.
5. Artifact integrity reads the real artifact: a good fixture passes and a
   one-field tampered serialized twin fails through the production verifier;
   malformed coverage, values, sources, outcomes, and identities fail closed.
6. No premature evidence: only hand-built or tiny deterministic fixtures run.
7. Protected surfaces have no diff and the full suite retains exactly the four
   baseline failure identities among 361 tests / 357 pass.
8. `docs/CHECK-CARDS.md` carries the complete synthetic-validation check card.
9. `git diff --check` and the code-pack lens pass.

## Spec

`.orch/runs/2026-09-07T01-48-15Z-synthetic-descriptor-validation-harness/spec.md`

## Tickets

`.orch/tickets/2026-09-07T01-48-15Z-synthetic-descriptor-validation-harness/`

## Iterations

### 1 — Open and decompose

- workspace: `/private/tmp/2248-synthetic-descriptor-validation-20260906`
- provenance: branch `work/synthetic-descriptor-validation-20260906`, base
  `9d125e8c94f41282388a90402b1fba0b22ae83a8`, spec revision `c3a8bbd`
- baseline: `node --test solver/tests/*.test.js` at base returned 361 tests,
  357 pass, and exactly the two receipt failures plus two Universe Map
  failures recorded in `INV-0001`; duration 164.4 seconds
- decomposition: one end-to-end tracer ticket `SDV-001`; no dependency edges,
  uncovered remainder, or decision gap
- budget spent: one baseline suite and bounded source investigation

### 2 — Red/green tracer

- red: the first focused run failed on the missing RESULT-0029 module
- green: the real chooser, serializer, validator, crafted tampered twin, and
  real verifier CLI passed the initial focused harness tests
- terminology clarification: the frozen spec's “3x3 synthetic policy family”
  means a nine-policy factorial manipulation, not a MAP-Elites archive grid;
  mutable run records and user-facing checks now use the unambiguous term
- no evidence run: every case is a hand-built fixture on a synthetic level
  identifier; no shipped level, control seed, or confirmation seed ran
- gate-card comparison exposed and closed one boundary defect: reportable
  artifacts now reject unknown shipped levels while exploratory fixtures may
  retain synthetic level identifiers

### 3 — Fixed-revision gate and correction

- reviewed revision: `28c34dd92988be83fb43c49eee358a70b7d291a6`
  through one fresh-context orch-code-pack lens
- accepted findings: bounded-policy exhaustion was mislabeled as actual move
  exhaustion; contradictory terminal records passed; predictive analysis had
  widened beyond the frozen code spec; `tools/verify-experiments.js` was absent
  from source closure
- correction: actual move exhaustion now crosses an exact existence check and
  bounded-policy exhaustion aborts; terminal outcome/reason/count invariants
  fail closed; the predictive subsystem was removed; source closure includes
  the hashing helper
- focused correction evidence: 10/10 tests pass, both Node files parse,
  `git diff --check` passes, and protected-path diff is empty
- workflow exception: two required `orch-worker` repair dispatches returned no
  progress and left HEAD/worktree clean; each was retired after state checks,
  then the foreground writer applied the single correction pass inline

## Blame classes

- child under-delivered: repair dispatch
  `synthetic_descriptor_repair_gpt_5_6_sol_high` returned no work inside its
  bound and left the fixed revision clean
- child under-delivered: replacement repair dispatch
  `synthetic_descriptor_repair_gpt_5_6_sol_high_1` returned no work inside its
  bound and left the fixed revision clean

## Failed approaches

- The handed-off unique-cell premise is not used. Exact denominator
  recomputation in `INV-0001` showed the prior script divided by moves used,
  not move budget, and weakened the joint-cell interpretation.
- A predictive k-nearest-neighbor/Brier subsystem was added during the code
  widening pass before the successor research protocol existed. The fixed
  revision review rejected it as out of scope, and the correction removed it.

## Queued scope

- Formalizing half-score timing or exact greed ratio as production/MAP-Elites
  axes remains outside this run.
- Reassessing the human 15-game description after corrected timing remains a
  direct-source reporting task, not synthetic evidence.

## Terminal
