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
3. `e6da102`: complete protocol, runner, two verifiers, permanent negative
   tests, and Check Card committed before any RESULT-0024 game. Post-change
   baseline PASS; focused tests 19/19 and RESULT-0024 tests 4/4 PASS.
4. Control `aa69b123…`: 144 cells repeated exactly; all 48 outcome-only pairs
   differed. Entitlement receipt `dabcb1b3…`: valid PASS and outcome-identical
   twin with zero changed outcomes FAIL. Confirmation released only through
   receipt consumption.
5. Confirmation `77a8d7d6…`: one invocation, exactly 2,400 fresh cells, recorded
   control receipt `dabcb1b3…`, runtime 145,197.92 ms.
6. Primary verification `6634724c…` and independent recomputation `049534b5…`
   agree on `INCONCLUSIVE`, style guard PASS, 0.0373308 interaction spread, and
   unstable fixed-half extremes. Challenge `e04ae952…`: both controlled twins
   FAIL.
7. Precision defect: primary verification labeled its partial artifact-chain
   result `ENTITLED` before reading the independent and challenge receipts. The
   report narrows that field and assigns final P4 only at the six-artifact join.
8. One review gate at fixed revision `773c4a9`: support, implementation
   independence, coverage, disagreement handling, source policy, and rigor PASS;
   weakest oracle class `evidence`. No correction pass: changing frozen source
   after execution would invalidate the result.

## Blame classes

- Ticket-store contract gap routes to orchflows: the canonical ticket location
  conflicts with the project's one-writer rule while the shared root is busy.

## Failed approaches

- Treating the primary verification receipt's `entitlementVerdict` as final was
  rejected because that script does not read the independent recomputation or
  final challenge receipts. Exact coverage is documented in the report.

## Queued scope

- Decide later whether experiment-local entitlement receipts should become a
  reusable aggregate experiment-admission gate. This retry stays result-local.
- When that aggregate gate is designed, reserve `ENTITLED` for its output;
  component receipts should name only the checks they actually consumed.

## Terminal

- **complete** — empirical verdict `INCONCLUSIVE`; aggregate evidence verdict
  `PASS — ENTITLED`; confirmation identity `77a8d7d623d23d12…`; control receipt
  `dabcb1b3e8313b7b…`; independent recomputation `049534b508eeedd7…`;
  challenge receipt `e04ae952677fd59c…`; review gate fixed revision `773c4a9`,
  weakest oracle class `evidence`.
