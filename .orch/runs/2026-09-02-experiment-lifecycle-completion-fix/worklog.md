# Worklog — experiment lifecycle completion fix

## Goal

Prove and repair the cause of the live experiment gate treating completed,
ledger-accepted RESULT-0021 and RESULT-0024 as unfinished registrations after
their frozen code changes. Done only when the original live gate passes and a
new regression check fails a reported protocol left `registered` while passing
an unreported registration and a reported `complete` protocol.

## Spec

Ad-hoc `fix` composition; no separate stamped spec.

## Tickets

`.orch/tickets/2026-09-02-experiment-lifecycle-completion-fix/`

## Iterations

- 2026-09-02T07:35:33-05:00 — diagnosis iteration 1 opened from the live
  experiment-gate failure; bound: one cause toggle.
- 2026-09-02T07:35:33-05:00 — diagnosis iteration 1 PASS. Proven cause:
  RESULT-0021 and RESULT-0024 protocol lifecycle markers remained `registered`;
  status-only in-memory toggles reduced 2 problems to 0 for each result.
- 2026-09-02 — repair join PASS. Both lifecycle markers now read `complete`;
  the new three-state regression is green; experiment gate PASS and experiment
  tests 20/20 PASS.
- 2026-09-02 — independent-oracle verification join PASS at the fixed hashes in
  FIX-VERIFY; original gate and new regression both green.

## Blame classes

[]

## Failed approaches

[]

## Queued scope

[]

## Terminal

complete — FIX-VERIFY criteria 1–4 PASS; experiment gate PASS, experiment tests
20/20 PASS, protocol diff limited to two lifecycle words.
