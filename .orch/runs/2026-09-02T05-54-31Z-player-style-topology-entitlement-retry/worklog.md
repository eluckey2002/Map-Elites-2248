# Worklog — player-style topology entitlement retry

## Goal

### Objective

At one exact committed revision, RESULT-0024 contains a preregistered repeat of
the RESULT-0023 topology question on fresh seeds whose outcome-only positive
control rejects an outcome-identical twin before confirmation, whose
confirmation runner consumes that qualified control receipt, and whose report
ends in exactly one empirical verdict plus an explicit entitlement verdict.
The modified check has a permanent negative test and a Check Card, and the
RESULT-0023 false-PASS remains preserved unchanged.

### Acceptance

- A1 — Pre-change baseline.
- A2 — Outcome-only C2 check and permanent negative test.
- A3 — Gate-check card.
- A4 — Real control challenge before confirmation.
- A5 — Downstream consumption.
- A6 — Complete fresh confirmation and independent verdict.
- A7 — Artifact and control broken twins.
- A8 — Registration, report, and authority boundary.

The complete criterion text and named oracles are frozen in the spec.

## Spec

`.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/spec.md`

## Tickets

Codex session plan. The canonical shared-root ticket store was deliberately not
written because `lsof` showed multiple active Codex and Claude processes rooted
in the main checkout; the project one-writer rule requires this run to remain
inside its isolated worktree.

## Iterations

1. `86f56a1`: spec frozen. Isolated workspace branch
   `codex/player-style-cross-eval` derives from result-preservation commit
   `4c56335`; worktree clean after the spec commit.
2. Pre-change baseline: `node tools/verify-experiments.js` PASS and focused
   experiment tests 19/19 PASS before modifying the result-local control.

## Blame classes

- Ticket-store contract gap routes to orchflows: the canonical ticket location
  conflicts with the project's one-writer rule while the shared root is busy.

## Failed approaches

[]

## Queued scope

- Decide later whether experiment-local entitlement receipts should become a
  reusable aggregate experiment-admission gate. This retry stays result-local.

## Terminal

[]
