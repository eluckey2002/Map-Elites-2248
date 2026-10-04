---
id: BL-0026
title: Closeout audit pins reject every ledger, CURRENT.md or gate change
status: proposed
milestone: experiment-discipline
depends_on: []
updated: 2026-10-04
---

# BL-0026 — Closeout audit pins reject every ledger, CURRENT.md or gate change

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class.

## Desired outcome

A pull request that adds a ledger record, edits `CURRENT.md` or changes the
experiment gate does not turn the policy-lab closeout tests red. The pins keep
their purpose (a retained closeout cannot be silently reinterpreted) without
requiring the navigation files and the gate to stay byte-identical forever.

## Why

Found on 2026-10-04 while resolving PR #66's conflicts (see `DECISION-0011`).
`docs/goals/policy-terms-loop/audit-source-pin.js` pins the SHA-256 of
`EVIDENCE_LEDGER.md`, `CURRENT.md`, `LEDGER-INDEX.md` and
`tools/verify-experiments.js` for the RESULT-0082 closeout family, and allows a
byte change only through one hard-coded exception (`audit-source-pin.js` lines
27-28, anchored at commit `d9b5475f`). `AGENTS.md` requires every new ledger
record to touch `CURRENT.md` and regenerate `LEDGER-INDEX.md`, so each such pull
request breaks these tests:

- `solver/tests/policyLabResumeReviewedCloseout.test.js`: "LIVE completed result
  requires the anchored full-history custody proof before completion"
  (`routing correction input drift: CURRENT.md`)
- `solver/tests/policyLabResumeCloseout.test.js`: "closeout rejects successful
  exits with incomplete numeric audits and keeps the active run pending"
  (`closeout audit identity differs: tools/verify-experiments.js`)
- `solver/tests/policyLabRecoveryCloseout.test.js`: "recurring final-tree suite
  revalidates every retained closeout and committed audit pin"

Checked on 2026-10-04: all three pass on `origin/main` and fail on both the
`DECISION-0011` branch and PR #66's merged tree, so the cause is the pin design,
not either change.

## Sketch

Pin the navigation files and the gate to the admission commit's bytes read from
git (the way `FROZEN-TREE-RECOMPUTE.json` now does for RESULT-0082's
recomputation) instead of to the working tree. The closeout then verifies what
it was admitted against, and later ledger growth is irrelevant to it.

## Open questions

- Whether CI runs these tests at all. The experiment-gate workflow runs only
  `node tools/verify-experiments.js`; the unit-test job, if any, was not read.
- Whether the same pins exist for the earlier `policyLabRecovery*` closeouts
  beyond the three failing tests above.
