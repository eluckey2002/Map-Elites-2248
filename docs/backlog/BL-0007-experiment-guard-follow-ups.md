---
id: BL-0007
title: Two holes the registration-commit freeze fix left open
status: open
milestone: experiment-discipline
depends_on: []
updated: 2026-09-02
---

# BL-0007 — Experiment-guard follow-ups

The 2026-09-02 merge of `fix/experiment-guard-reads-registration-commit`
(`de3ef93`) qualifies one repair only: the guard and the ledger gate read a
protocol's `version_freeze` from its registration commit, require the
working-tree copy to match, and refuse empty or placeholder freezes. The
check card `version-freeze-covers-the-evidence` in `docs/CHECK-CARDS.md`
records that scope. Two defects were seen during that work and deliberately
not fixed there; this record keeps them from being forgotten.

## 1. The protocol's decision body can still be rewritten after registration

Only `result` and `version_freeze` are compared against the registration
commit. The question, declared checks, stopping rules, and seed ranges in
`protocol.md` can be edited after the data is seen and neither the guard nor
the gate notices. A pre-registration whose body is editable is a
reconstruction with a frozen hash line.

## 2. The ledger-side check false-PASSes when `version_freeze` is absent

`assessVersionFreeze` in `tools/verify-experiments.js` returns no problems
when the registered frontmatter carries no freeze object, so a protocol with
no freeze passes the ledger gate. The run-time guard refuses the same
protocol, so the hole is reachable only by a result whose artifact was made
without the guard, which item 6 of the same check card already lists as
uncaught.

## Not in scope of this record

Fixing either defect. Each needs its own gate-check pass with a planted bad
input observed failing, per `docs/CHECK-CARDS.md`.
