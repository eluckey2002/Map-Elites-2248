---
id: BL-0027
title: Owner plays the Recipe prototype and decides whether it is its own level kind
status: active
milestone: level-archetypes
depends_on: []
updated: 2026-10-11
---

# BL-0027 — Owner plays the Recipe prototype

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class.

## Desired outcome

The owner's Recipe idea (2026-10-11: "create a 512 tile with only 128 tiles")
is played on the four boards in [`prototypes/recipe/`](../../prototypes/recipe/README.md),
and the result is recorded as a PDL entry: does "only this ingredient" change
which chain looks best, or does it feel like counting?

## Acceptance criteria

- The owner has played the boards on the private Recipe Artifact; runs and
  answers are read from its db.
- A PDL entry in `prototypes/PLAYTEST-DECISION-LEDGER.md` records the plays,
  the owner's reaction and KEEP / REVISE / RETIRE.

## Current evidence

None yet. The boards are screened (a beam-solver win in budget; the
largest-sum proxy loses), which is not owner evidence.

## Next action

Wait for owner play, then read the Artifact's `runs` and `answers` and write
the PDL entry.

## History

- 2026-10-11 — Prototype built with four boards and published as a private
  Artifact (PR #77). Owner play pending.
