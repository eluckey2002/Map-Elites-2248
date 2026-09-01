# Worklog — 2026-09-01-seed-variance-challenge-code

## Goal

### Objective

The production generated-level shortlist fails closed unless one
identity-bound seed-variance check has demonstrated PASS on the real evaluator
subject, FAIL on a controlled broken twin through that same seam, and a current
verdict whose covered identities still match.

### Acceptance

1. `node --test solver/tests/seedVariance.test.js` drives the production check
   through `playMeasured` and observes PASS on a valid subject.
2. The same command observes FAIL when the same verifier receives a controlled
   broken twin.
3. The focused test proves missing, malformed, stale, mismatched, and bypassed
   entitlement cannot yield a shortlist, including automatic invalidation
   after a covered identity changes.
4. The focused test drives the production `generate-levels.js` selection seam
   and observes selection under an entitled verdict and withholding under a
   failed or stale verdict.
5. `node --test solver/tests/generateLevels.test.js solver/tests/levelAuthor.test.js solver/tests/seedVariance.test.js`
   passes with no unrelated regression.
6. `git diff --check` and the code-pack gate pass.

## Spec

`.orch/runs/2026-09-01-seed-variance-challenge/spec.md`

## Tickets

`.orch/tickets/2026-09-01-seed-variance-challenge-code/`

## Iterations

1. **Workspace and decomposition** — baseline revision
   `4dd93219f69d5288654dd2aee395f6e6388bda4a`; isolated worktree
   `/private/tmp/2248-seed-variance-20260901`; baseline focused tests PASS
   16/16; one tracer ticket `SV-CODE-001`; uncovered remainder `[]`;
   decision gap `[]`.
2. **Code tracer producer** — red: missing production module; green: focused
   21/21 and seed-variance 6/6; result revision
   `5194faf55ca1c3a725f9f8ccb7fdbda07a818880`; full suite 278/282 with three
   retained stale-receipt failures and one external root-worktree `.orch`
   failure; code-lens gate dispatched against the fixed revision.
3. **Gate and correction** — the code lens rejected standalone entitlement,
   unproved protocol ordering, incomplete receipt cross-binding, and a real
   evaluator test that did not reach PASS. Revision `2aa3018` repaired all four.
   Integration then found the batch-production path unreachable; revision
   `c24a745` restored generation without exposing a shortlist. Focused evidence
   is 23/23 and the seed-variance suite is 7/7 at the accepted revision.
4. **Statistical scale audit** — revision `b149eda` replaced the mixed-scale
   comparison with a one-way random-effects between-candidate variance
   component. Focused evidence is 24/24 and the seed-variance suite is 8/8.

## Blame classes

[]

## Failed approaches

[]

## Queued scope

[]

## Terminal

- `complete`
- Deciding evidence: `SV-CODE-001` acceptance 1-6 PASS at `b149eda`; the code
  lens's accepted findings are corrected; known full-suite baseline failures
  remain explicitly non-green and outside this code result.
