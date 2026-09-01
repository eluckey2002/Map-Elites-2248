---
id: SV-CODE-001
run: 2026-09-01-seed-variance-challenge-code
status: complete
executor: orch-tdd
pack: orch-code-pack
independence: gate
depends_on: []
write_scope:
  - solver/seed-variance.js
  - solver/generate-levels.js
  - solver/tests/seedVariance.test.js
  - solver/tests/generateLevels.test.js
excluded_actions:
  - execute the real 53-level generalizing seed-variance study
  - edit experiments/, EVIDENCE_LEDGER.md, CURRENT.md, src/, solver/bot.js, or solver/engine.js
  - change game rules, shipped levels, scoring, or champion policy
bound: one tracer with red-green slices and one correction pass
claimed_by: root-codex
claimed_at: 2026-09-01T23:25:12Z
checked_by: orch_planner_gpt_5_6_sol_ultra
---

# SV-CODE-001 — Entitled seed-variance check and selection seam

## Objective

The production shortlist returns candidates only when an identity-current
seed-variance challenge receipt proves that the same production verifier passed
the valid subject, failed a controlled broken twin, and issued the declared
seed-noise verdict.

## Fixed inputs

- Frozen spec:
  `.orch/runs/2026-09-01-seed-variance-challenge/spec.md`.
- Baseline revision: `4dd93219f69d5288654dd2aee395f6e6388bda4a`.
- Real evaluator seam: `solver/level-author.js`, exported `playMeasured`.
- Real consumer seam: `solver/generate-levels.js`, `main -> rankShortlist`.
- Code craft:
  `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md`.
- Standards owner: `AGENTS.md`.

## Completion test

1. `node --test solver/tests/seedVariance.test.js` observes PASS through the
   production verifier on a valid subject and FAIL through that same verifier
   on a controlled broken twin.
   - oracle_class: deterministic
   - provenance: authored-here; independence supplied by the run gate
2. The same command proves absent, malformed, stale, mismatched, and bypassed
   entitlement fail closed, including a one-identity mutation.
   - oracle_class: deterministic
   - provenance: authored-here; independence supplied by the run gate
3. The same command drives the production shortlist seam with identical
   candidates and observes selection only under the entitled receipt.
   - oracle_class: deterministic
   - provenance: authored-here; independence supplied by the run gate
4. `node --test solver/tests/generateLevels.test.js solver/tests/levelAuthor.test.js solver/tests/seedVariance.test.js`
   passes.
   - oracle_class: deterministic
   - provenance: pre-existing runner and existing suites plus authored-here suite
5. `git diff --check` passes and no path outside `write_scope` changes during
   ticket execution.
   - oracle_class: deterministic
   - provenance: pre-existing

## Return fields

- changed artifact identities
- red and green observations per slice
- completion-test verdicts
- residual risks

## Result

- **Accepted revision:** `b149eda598d59a9db3750cbbf721c3a9f6dad078`.
- **Changed artifacts:**
  - `solver/seed-variance.js` — real-subject measurement, statistical
    reduction, decision, valid/broken entitlement, challenge receipt, and
    replaying CLI verifier.
  - `solver/generate-levels.js` — production `main -> selectShortlist ->
    rankShortlist` binding; selection now fails closed without a current
    passing entitlement.
  - `solver/tests/seedVariance.test.js` — real evaluator probe, statistically
    broken twin, stale/missing/failed entitlement, production CLI consumption,
    immutable receipt, and verifier replay.
- **Red observation:** before implementation,
  `node --test solver/tests/seedVariance.test.js` failed with
  `Cannot find module '../seed-variance'`.
- **Green observation:** focused completion tests pass 24/24 at the accepted
  revision; the seed-variance suite passes 8/8 including spawned production
  CLI paths.

## Gate review and correction

The fixed-revision code lens rejected producer revision `5194faf` on four
load-bearing defects: a standalone self-issued entitlement could be consumed
without a receipt; protocol ordering was not proved; receipt fields were not
fully cross-bound; and the real evaluator test did not reach PASS. Correction
revision `2aa3018` bound selection to one replayed, self-identified challenge
bundle, required a tracked protocol commit that is a strict ancestor of the
measurement commit, cross-bound the receipt, and reached PASS through the real
`playMeasured` seam.

A final integration audit found that correction had made the generator's batch
production path unreachable. Revision `c24a745` retained the fail-closed
selector while restoring a two-stage workflow: generation writes an unselected
batch, and `--select-from` requires the verified bundle for that exact batch.
The added regression test proves generation emits no shortlist before the
challenge exists.

Before preregistration, a dimensional audit found that the first analysis had
compared variance of candidate sample means with single-game within-level
variance. Revision `b149eda` replaces that with the one-way random-effects
between-candidate component and derives the between/within ratio and
single-seed reliability from components on the same scale. A focused numeric
test fixes that interpretation.

## Verification

1. **PASS — valid subject and broken twin.** The focused suite reaches
   `solver/level-author.js#playMeasured`; the same `issueEntitlement` verifier
   returns PASS for the valid artifact and FAIL for a structurally valid twin
   whose second-sample candidate ordering is reversed.
2. **PASS — fail closed and identity invalidation.** Null, malformed, failed,
   and stale entitlements throw; the production CLI exits 1 for absent, failed,
   and stale identities; changing the evaluator identity invalidates a formerly
   valid entitlement.
3. **PASS — downstream consumption.** With identical batch input, the spawned
   `generate-levels.js --select-from` production path outputs
   `SELECTED hardest,easy` for the passing entitlement and exits 1 without a
   selection for the broken entitlement.
4. **PASS — focused regression.** `node --test
   solver/tests/generateLevels.test.js solver/tests/levelAuthor.test.js
   solver/tests/seedVariance.test.js` passes 24/24.
5. **PASS — deterministic scope checks.** `git diff 1b40d80..5194faf --check`
   passes; the producer commit changes only the three ticket-authorized source
   and test paths.
6. **BASELINE FAILURES PRESERVED — full suite.** `node --test
   solver/tests/*.test.js` reports 278/282. Three failures are the repository's
   explicit retained stale candidate receipts; the fourth names two untracked
   `.orch` ticket directories in the concurrently active root checkout. None
   intersects this ticket's diff. The focused and new suites are green.
7. **PASS — judged code lens and correction.** All four accepted findings from
   the fixed-revision review were repaired. The integration audit's generator
   reachability defect was also repaired and regression-tested before join.

## Feedback

[]

## Risks

- The full repository suite is not globally green because of three deliberate
  stale receipts and concurrent root-checkout `.orch` state. These are retained
  failures, not passes and not repaired here.
- Receipt self-identities detect drift and tampering; they are provenance
  bindings, not cryptographic signatures against a malicious repository writer.
