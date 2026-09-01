---
id: BL-0005
title: Register a protocol for RESULT-0018 and re-run its holdout
status: deferred
milestone: experiment-discipline
depends_on: []
updated: 2026-08-31
---

# BL-0005 — Register a protocol for RESULT-0018 and re-run its holdout

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## Why this is open

`DECISION-0004` promoted the target-aware finish rule into the shipped bot on
the strength of `RESULT-0018`. That result was accepted before the experiment
protocol gate existed, so it is grandfathered in
[experiments/GRANDFATHERED.md](../../experiments/GRANDFATHERED.md).

It is the only shipped change resting on an unprotocolled result. Nobody
doubts the measurement — 15,600 paired games, zero regressions, all 52 levels
represented. The gap is narrower than that: if someone asks "how do you know
the analysis was not shaped by the outcome," the honest answer today is "we
checked afterward."

## Desired outcome

`experiments/RESULT-0018/protocol.md` registered against the current bot, and
one fresh holdout run under it, producing an artifact stamped with that
protocol's commit. `RESULT-0018` then leaves the grandfather list and
`DECISION-0004` rests on evidence a clean checkout can regenerate.

## The trigger, recorded because it is the whole reason this is deferred

The holdout is about 30 minutes of unattended compute. The owner's condition,
2026-08-31: **run it when there is 30 minutes of other work to spare** — it
occupies a machine, not a person. This is not blocked on a decision and needs
no discussion; it is waiting for a convenient half hour.

## Not to be done instead

- Do **not** write the protocol without re-running. A protocol authored after
  the outcome is a reconstruction; the gate rejects one committed with or
  after its own report, and it should.
- Do **not** revert the bot change to satisfy the rule. The change works,
  every gate passes, and removing shipped behavior to tidy a record written
  afterward would be the wrong trade.
- Do **not** quietly drop RESULT-0018 from the grandfather list. The list is
  the record that this exception exists.
