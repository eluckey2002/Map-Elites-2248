---
id: BL-0029
title: Owner plays the kinds sampler
status: active
milestone: level-archetypes
depends_on: [BL-0028]
updated: 2026-10-11
---

# BL-0029 — Owner plays the kinds sampler

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class.

## Desired outcome

PDL-038 (REVISE) found that a single Recipe order varied only by numbers is "not
enough", while orders that feed each other "looks promising". The
[kinds sampler](../../prototypes/sampler/README.md) gives each of the five
expanded kinds (level-archetypes/11-five-kinds-expanded.md) one layer that makes
its steps depend on each other, plus a Shared Material board and a control with
three unrelated orders. The owner plays them and says which layers add planning.

## Acceptance criteria

- The owner has played the sampler on its private Artifact; runs and answers
  are read from its db.
- A PDL entry records the plays, the owner's reaction and KEEP / REVISE /
  RETIRE per board.

## Current evidence

PDL-038, REVISE. Screening for every board is in `prototypes/sampler/model.test.js`.

## Next action

Owner play on the private Artifact.

## History

- 2026-10-11 — Created after PDL-038. Eight boards published to a new private
  Artifact; owner play pending.
