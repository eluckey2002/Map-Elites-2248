---
run: 2026-09-01-seed-variance-challenge-code
routing:
  pack: orch-code-pack
---

# Entitled seed-variance check

## Objective

The production generated-level shortlist fails closed unless one
identity-bound seed-variance check has demonstrated PASS on the real evaluator
subject, FAIL on a controlled broken twin through that same seam, and a current
verdict whose covered identities still match.

## Non-goals

- Execute or interpret the generalizing seed-variance study.
- Edit `EVIDENCE_LEDGER.md` or admit a research result.
- Repair unrelated generator, calibration, receipt, or verifier defects.
- Change game rules, shipped levels, scoring, or the champion policy.
- Create a general-purpose gate framework.

## Acceptance

1. **Real seam and valid subject.** `node --test solver/tests/seedVariance.test.js`
   drives the exported production check through `playMeasured` with an
   identity-bound subject fixture and observes PASS.
   - oracle: Node's existing test runner invoking the production seam
   - oracle_class: deterministic
   - provenance: authored-here; must cross the run gate
2. **Controlled broken twin.** The same command sends a one-change broken twin
   through the same production verifier and observes FAIL for the declared
   claim rather than a separate helper path.
   - oracle: Node's existing test runner invoking the production verifier
   - oracle_class: deterministic
   - provenance: authored-here; must cross the run gate
3. **Automatic identity invalidation and fail-closed behavior.** The focused
   test proves missing, malformed, stale, mismatched, and bypassed entitlement
   cannot yield a shortlist, and that changing one covered identity invalidates
   a formerly valid receipt.
   - oracle: `node --test solver/tests/seedVariance.test.js`
   - oracle_class: deterministic
   - provenance: authored-here; must cross the run gate
4. **Downstream consumption.** The focused test exercises the production
   `generate-levels.js` selection seam and proves the same candidate inputs are
   selected under an entitled verdict and withheld under a failed or stale
   verdict.
   - oracle: `node --test solver/tests/seedVariance.test.js`
   - oracle_class: deterministic
   - provenance: authored-here; must cross the run gate
5. **Regression.** Existing generator and authoring behavior remains no worse
   outside the new entitlement requirement.
   - oracle: `node --test solver/tests/generateLevels.test.js solver/tests/levelAuthor.test.js solver/tests/seedVariance.test.js`
   - oracle_class: deterministic
   - provenance: pre-existing runner and suites plus authored-here focused suite
6. **Repository standards and scope.** `git diff --check` passes and the gate's
   judged code lens finds no correctness, contract, scope, or shape defect.
   - oracle: `git diff --check` plus the orch-code-pack lens at the single run gate
   - oracle_class: deterministic for diff check; judged for lens
   - provenance: pre-existing plus authored-here gate

## Binding constraints

- One verifier implementation handles valid subject, broken twin, stale
  identity, and downstream consumption; no test-only verifier or alternate
  helper seam.
- Fail closed when the artifact, receipt, covered source, subject, selector, or
  protocol identity is absent or mismatched.
- A receipt identifies the exact claim, candidates, evaluator, policy, metric,
  sample sizes, seed ranges, code identities, execution seam, challenge
  outcomes, and downstream consumption observation.
- The code step may use synthetic small fixtures but must not run the real
  generalizing experiment before its successor protocol is committed.
- Preserve unrelated files and pre-existing failures by identity, not count.

## Evidence

- Baseline revision: `4dd93219f69d5288654dd2aee395f6e6388bda4a`.
- Historical claim commit: `c782111d46842e56f2fd10b273e1ff0a53b30ff0`;
  only `HANDOFF.md` changed there.
- Investigation packet:
  `.orch/tickets/2026-09-01-adhoc-seed-variance-investigation/INV-0001.md`.
- Current source identities:
  - `src/game.js` — `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee`
  - `solver/engine.js` — `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`
  - `solver/bot.js` — `8d0dec5f6b0669ca7c039e6493b4014fdc5cefb4df9d93ad54dba2cb168b0b10`
  - `solver/level-author.js` — `305731fbfd7e664075dc177e8be48f5bf530d1f8475f5fd8c501cef84149b257`
  - `solver/generate-levels.js` — `d7a8bf832fa0baea07045cb5546ce6683a3dca0c49024262658f09f23ecc3842`

## Affected surfaces

- `solver/seed-variance.js` (new)
- `solver/generate-levels.js`
- `solver/tests/seedVariance.test.js` (new)
- focused existing generator tests only if the public seam changes require it
- run worklog and ticket state under `.orch/`

## Exemplars

- `solver/level-author.js` at baseline revision: imitate canonical JSON,
  SHA-256 input identities, receipt self-identity, seed-range validation, and
  replay through the real `playMeasured` seam.
- `solver/target-aware-evaluation.js` at baseline revision: imitate explicit
  artifact validation before reduction and fail-closed CLI behavior.

## Bound

- One tracer ticket and one correction pass.
- No experiment execution in this run.
- `plan_gate: false` because the accepted Goal Contract already authorizes
  delivery and this spec preserves its boundaries.

## Target repository

`/private/tmp/2248-seed-variance-20260901` on branch
`codex/seed-variance-challenge`.

## Standards owner by pointer

- `AGENTS.md`
- `EVIDENCE_LEDGER.md`
- `experiments/README.md`

## Acceptance as runnable checks

```bash
node --test solver/tests/seedVariance.test.js
node --test solver/tests/generateLevels.test.js solver/tests/levelAuthor.test.js solver/tests/seedVariance.test.js
git diff --check
```

## Risks

- A helper-only test could appear green while `generate-levels.js` bypasses the
  entitlement; criterion 4 therefore exercises the production selection seam.
- Hashing an incomplete source inventory could make drift invisible; the
  receipt schema must name every measurement- and selection-relevant identity.
- A synthetic fixture could accidentally execute the generalizing study; tests
  must use bounded injected outcomes and never the real level population.

## Assumptions

- `rankShortlist` remains the concrete downstream candidate-selection seam.
- `playMeasured` remains the real evaluator seam for the successor study.
