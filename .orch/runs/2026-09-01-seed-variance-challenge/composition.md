---
name: seed-variance-challenge-delivery
description: Build an entitled seed-variance check, then use it for a preregistered verdict and ledger admission.
entry: named
---

# Seed-variance challenge delivery

## Steps

1. `entitled-check`
   - unit: `orch-deliver`
   - pack: `orch-code-pack`
   - spec: `.orch/runs/2026-09-01-seed-variance-challenge/spec.md`
2. `bounded-verdict`
   - unit: `orch-deliver`
   - pack: `orch-research-pack`
   - spec: `.orch/runs/2026-09-01-seed-variance-verdict/spec.md`
   - predecessor: code result `b149eda598d59a9db3750cbbf721c3a9f6dad078`

## Edges

- `seq`: `entitled-check` result identity becomes `bounded-verdict.evidence`.

## Invariants

- `entitled-check` may change only the executable check, its production
  selector binding, and focused tests; it must not execute the generalizing
  study or edit the evidence ledger.
- `bounded-verdict` must preregister and commit its protocol before the first
  real-subject run; it may not change executable behavior after inheriting the
  predecessor identity.
- Both steps preserve game rules, shipped levels, scoring, champion policy,
  and unrelated user work.
- Neither step may treat a helper-only green test or a recorded claim as
  entitlement evidence.

## Done check

At the terminal revision, a fresh invocation of the production verifier must:

1. validate the real-subject artifact and immutable challenge receipt;
2. reproduce the declared correlation and variance comparison;
3. show the same verifier rejecting a controlled broken twin;
4. reject a receipt after any covered identity changes;
5. show the production shortlist path accepting or withholding candidates
   because of the entitlement verdict; and
6. resolve the ledger's admitted record to the frozen artifact and receipt.

The composition is complete only when all six observations are PASS and the
project's experiment gate plus focused and full relevant tests are green.

## Require

The accepted persistent Goal Contract and tracked repository state at
`4dd93219f69d5288654dd2aee395f6e6388bda4a`.

## Return

Status, terminal result identity, done-check verification, per-step result
identities, changed artifacts, and unresolved gaps.

## Result

- **Status:** complete.
- **Code result:** `b149eda598d59a9db3750cbbf721c3a9f6dad078`.
- **Research/evidence result:** `1e5311ef53d9fbf5c3e694e1bce371fd18ca4381`.
- **Done check:** `node experiments/RESULT-0021/verify.js` observes all six
  required relationships against committed evidence; experiment gate PASS;
  focused suite 43/43 PASS.
- **Repository-wide baseline:** 280/284, unchanged four failures. These are
  explicitly retained failures, not green checks and not caused by this run.
- **Unresolved:** the historical exact `r = 0.98` remains provenance-
  inconclusive; qualitative human-play need remains outside this result.
