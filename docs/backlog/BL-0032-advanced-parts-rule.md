---
id: BL-0032
title: Confirm the proposed Advanced Feed the Next rule
status: proposed
milestone: level-archetypes
depends_on: [BL-0029]
updated: 2026-10-11
---

# BL-0032 — Confirm the proposed Advanced Feed the Next rule

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class.

## Desired outcome

The v3 sampler's "Feed the Next — Advanced" board uses a rule the owner has not
approved: orders fill in any order, each fill makes a part, at most two parts can
be on the board, and a fill that would make a third is refused. It was written
to answer the owner's own v2 note ("this was the exact same as previous board -
how was this advanced?"), and the README labels it proposed.

## Acceptance criteria

- The owner plays the Advanced board in sampler v3 and says whether the rule
  makes it feel harder in a good way.
- The result is recorded as a playtest decision (PDL-041). If rejected, the
  board and the "anyOrder" rule are removed from the sampler; if accepted, the
  rule moves from proposed to a standing rule.

## History

- 2026-10-11: opened from Codex review of PR #86, which asked that the unapproved
  rule be tracked rather than live without a record.
