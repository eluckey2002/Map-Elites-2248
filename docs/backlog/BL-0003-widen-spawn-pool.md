---
id: BL-0003
title: Widen the spawn pool beyond three values
status: proposed
milestone: level-difficulty-calibration
depends_on: []
updated: 2026-08-12
---

# BL-0003 — Widen the spawn pool beyond three values

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## Desired outcome

Levels deal from more than three distinct starting values. Three values
(`2/4/8`, or that set scaled by the chapter's tile scale) makes chains easy to
find; a longer pool is a difficulty lever that works differently from fewer
moves or a higher target, because it makes the board harder to *match* rather
than simply shorter or more demanding.

Deliberately not scheduled. Raised 2026-08-12 as a direction for once the
difficulty curve is stable, not as a change to make now.

## Acceptance criteria

- Pool width is a per-level parameter, measured by `solver/game-tester.js` the
  same way tile scale is, rather than hand-set.
- The lockout rate does not rise. This is the specific risk: a wider pool means
  more distinct values, so more chain sums fall off the tile family and become
  permanently unmatchable. That accumulation is what board lockout is.
- Any change is priced against `RESULT-0006`, which measured the closest thing
  tried so far and found it a poor trade.

## Current evidence

- `RESULT-0006` — adding a 16 to the pool raised spawned value 76% and bought
  13% more score. That is the one measurement pointing at this lever, and it
  points *against* naive widening: the extra value could not be chained.
- The lattice rule (`solver/engine.js`, `isMergeableSum`) — only a chain sum
  landing back on the tile family can ever be matched again. Widening the pool
  makes that harder, which is the intended difficulty, and also the risk.
- Tile scaling is a verified exact isomorphism, so pool *scale* changes nothing
  about difficulty. Pool *width* is a genuinely different change and has to be
  measured directly; it cannot be derived from existing runs.

## Next action

None authorized. Revisit after the difficulty curve is stable and the level
targets have been retuned.

## History

- 2026-08-12 — captured from chat as a future direction. Explicitly not a
  change request; the owner asked that rule changes be systematic rather than
  ad hoc.
