# Worklog — 2026-09-01-seed-variance-verdict

## Goal

Produce one preregistered, challenge-entitled seed-variance verdict and admit it
only if every proof condition passes.

## Spec

`.orch/runs/2026-09-01-seed-variance-verdict/spec.md`

## Predecessor

`b149eda598d59a9db3750cbbf721c3a9f6dad078`

## Iterations

1. Research spec frozen before data. Baseline 284 tests: 280 pass and four
   named pre-existing/external failures.
2. `RESULT-0021` preregistered at
   `e63f83c70ad1cf0725237e37f82d41491676d778`, including fixed samples,
   statistics, thresholds, controls, source identities, and decision rule.
   No all-level measurement had run when this entry was written.
3. Pre-measurement controls passed: deterministic replay 1/1;
   seed-variance valid/broken control 8/8. The one 6,360-game run produced
   artifact `73dfd91b…` without restart or alternate seeds.
4. Challenge and fresh verification passed at receipt `95d45522…`: valid
   subject PASS, controlled broken twin FAIL, exact production consumer
   PASS/FAIL, and covered evaluator mutation invalidation.
5. Post-challenge focused suite passed 43/43. A sandboxed broad-suite attempt
   introduced five listener and two DNS failures; the exact rerun with required
   capabilities returned the baseline 280/284 and the same four failures.
6. Canonical evidence, report, durable verifier, and append-only `RESULT-0021`
   ledger record committed at `1e5311e`. Fresh committed-state verifier and
   experiment gate both PASS.

## Terminal

- `complete`
- Deciding evidence: admission `aae5beca…`, challenge receipt `95d45522…`,
  evidence revision `1e5311e`, current result supported, historical exact
  `r = 0.98` provenance inconclusive.
