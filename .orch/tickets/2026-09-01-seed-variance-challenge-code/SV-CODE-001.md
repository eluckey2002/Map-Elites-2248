---
id: SV-CODE-001
run: 2026-09-01-seed-variance-challenge-code
status: claimed
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


## Verification


## Feedback

[]

## Risks

[]
