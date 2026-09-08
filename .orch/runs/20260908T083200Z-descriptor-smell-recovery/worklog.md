# Worklog — descriptor smell recovery

## Goal (frozen)

The repository can reject a malformed experiment protocol before registration,
reports descriptor prediction across both unseen levels and unseen policies,
and names `protocol.md` as the sole scientific authority without weakening any
existing evidence gate.

Acceptance is frozen as `DSR-DRAFT-01`, `DSR-HOLDOUT-02`,
`DSR-AUTHORITY-03`, `DSR-GATE-04`, and `DSR-REGRESSION-05` in
`spec.md@cb57d76`.

- **spec:** `.orch/runs/20260908T083200Z-descriptor-smell-recovery/spec.md@cb57d76`
- **tickets:** `.orch/tickets/20260908T083200Z-descriptor-smell-recovery/`

## Iterations

1. Workspace established in isolated worktree
   `/private/tmp/2248-synthetic-descriptor-validation-20260906`, branch
   `work/synthetic-descriptor-validation-20260906`, derived from
   `2248-challenge@154c44a`. The frozen spec and composition are commit
   `cb57d76`. Focused baseline: 44/44 PASS; `git diff --check` PASS; protected
   paths are unchanged from `9d125e8`. The only starting drift after opening
   the run is the required session friction log.
2. Decomposition cut one code tracer, `DSR-001`, because the public draft-check
   seam, calculator diagnostics, guidance, negative tests, and check card form
   one fixed-revision behavior and share a write scope. All five acceptance
   criteria are covered; uncovered remainder and decision gap are empty.
3. `DSR-001` returned at code revision `6c61d96`. Its public draft checker
   accepts the exact real-file freeze and rejects the planted 17-character
   hash; its calculator exposes both level- and policy-held-out diagnostics;
   and protocol authority is singular. Focused tests pass 45/45. The full suite
   remains 371/375 with exactly the four frozen failures. Protected paths match
   `9d125e8` and `git diff --check` is clean.

## Blame classes

[]

## Failed approaches

- The first nine-level policy-holdout assertion still generated the helper's
  default three-level fixture. The allowed correction pass made levels an
  explicit helper input, observed the intended red `3 !== 9`, then restored
  green at the registered 81-unit denominator.

## Queued scope

[]

## Terminal

- **Disposition:** accepted at the join.
- **Integrated state:** code result `6c61d96`, ticket return `8ce6b77`.
- **Invalidated evidence:** none; no covered artifact changed after its oracle
  ran, and every named changed artifact is inside the ticket write scope.
- **Next edge:** register the RESULT-0030 protocol against the accepted code
  result, then create the research delivery record that points to it.
