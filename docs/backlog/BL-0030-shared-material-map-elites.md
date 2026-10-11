---
id: BL-0030
title: MAP-Elites search over Shared Material boards
status: proposed
milestone: level-archetypes
depends_on: [BL-0029]
updated: 2026-10-11
---

# BL-0030 — MAP-Elites search over Shared Material boards

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class.

## Desired outcome

The owner (2026-10-11) said Shared Material boards, where two or more orders want
the same tiles, "would be great for a map elites". The RESULT-0084 elites felt
ordinary because their axes were solver measures a player cannot see. This search
varies boards inside one kind along axes a player can count:

- how short the shared tile is (one spare, none spare, one or more missing);
- how many orders compete for it (2 or 3);
- how many setup moves the winning line needs before the first order fills.

## Acceptance criteria

- A registered experiment (AGENTS.md) with the axes above and a keeper test:
  a solver win exists; greedy and "do the obvious" play lose; no winning line
  ignores the shared-tile split.
- The owner plays a handful of elites from different cells and a PDL entry
  records the reaction.

## Current evidence

None yet. Depends on how the owner rates the Shared Material board in BL-0029.

## Next action

Wait for BL-0029's owner play.

## History

- 2026-10-11 — Proposed from the owner's remark in the kinds sampler thread.
