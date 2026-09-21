---
id: BL-0015
title: Repeat greed validation with receipts that bind the registered run
status: complete
milestone: descriptor-discovery
depends_on: [CORRECTION-0007]
updated: 2026-09-16
---

# BL-0015 — Harden greed validation receipts

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades the retained
greed measurements or adopts a MAP-Elites axis.

## Desired outcome

A fresh registered greed-validation result either supports, falsifies, or
leaves greed ratio inconclusive using a production verifier that binds the
registered seeds, deterministic work limit, executed source graph, and a
stability statistic capable of failing for every policy bin.

## Why this comes next

`CORRECTION-0007` leaves the deterministic path-state denominator intact but
removes three supports from `RESULT-0038`: its middle-bin stability statistic
is non-discriminating, its verifier does not bind the registered seed panel or
the exact work-limit count, and its source closure omits executed dependencies.
The primary result was already `INCONCLUSIVE`, so the correction does not turn
an adopted axis back into a rejected one. It means greed ratio still needs one
clean registered validation before promotion can be considered.

## Required successor design

- Register a new result before looking at fresh outcomes. Do not edit or rerun
  `RESULT-0037` or `RESULT-0038`, reuse their seeds, or raise their cap.
- Bind `artifact.panel.seeds` byte-for-byte to the registered seed constant and
  build the expected row matrix from that constant, not from artifact input.
- Require every `UNKNOWN/work-limit` observation to report exactly the frozen
  path-state cap, and plant a re-hashed mutation that proves a wrong or missing
  count is rejected.
- Freeze every test named by qualification and every transitive module executed
  by recomputation. The qualification receipt and source-closure list must be
  derivable from one manifest rather than maintained independently.
- Qualify independent reducer equivalence on work-limited rows, a zero-exact
  policy, a null descriptor cell, and a non-default policy panel before the run.

## Stability replacement

Do not reuse “same or adjacent” on a three-bin axis. Before registration,
choose one statistic that can fail for a middle-bin policy, such as exact-modal
share or a continuous greed-ratio dispersion measure, and demonstrate with a
planted unstable fixture that the check goes red. Freeze its threshold before
fresh seeds run.

## Acceptance criteria

- Every planted seed, work-count, source-closure, and reducer mutation fails
  through the same production verifier used on the retained artifact.
- The valid control passes from a clean checkout.
- Fresh seeds produce the full registered policy × level matrix with no
  emergency-watchdog timeout; deterministic work-limit observations remain
  `UNKNOWN` rather than being discarded.
- The report answers every registered prediction even if the result is
  falsified or inconclusive.
- Greed ratio remains a candidate until this successor closes; half-score move
  remains diagnostic and receives a separate independent manipulation later.

## Current evidence

- [CORRECTION-0007](../../EVIDENCE_LEDGER.md#correction-0007--result-0037-and-result-0038-overstate-stability-and-receipt-closure)
  records the vacuous stability statistic and receipt gaps without rewriting
  the frozen experiments.
- `experiments/RESULT-0038/corpus.json` retains the 128 measured rows and their
  exact/work-limit observations.
- `experiments/RESULT-0038/registered-protocol.md` preserves the prior frozen
  requirements and the boundary the successor must not edit after outcomes.

## Outcome

Completed by `RESULT-0043`. The successor bound the registered seeds and work
counts, derived source closure and qualification from one manifest, killed all
four planted verifier mutations, demonstrated a failing middle-bin stability
fixture, qualified the exact closeout cwd/argv path, completed all 128 fresh
games without a timeout, and closed through independent recomputation. Its
domain outcome is `INCONCLUSIVE`; greed ratio remains unadopted.

## History

- 2026-09-16 — created from the full review of `RESULT-0037`/`RESULT-0038` and
  `CORRECTION-0007`; frozen experiment sources were deliberately left intact.
- 2026-09-16 — completed by `RESULT-0043`; `RESULT-0042` retained the complete
  watchdog-calibration corpus but exposed a closeout cwd defect, and the fresh
  successor qualified that exact path before confirmation.
