---
id: BL-0020
title: Re-examine Level 54's shipped target with same-seed comparisons
status: proposed
milestone: level-difficulty-calibration
depends_on: [BL-0017]
updated: 2026-09-27
---

# BL-0020 — Re-examine the Level 54 target

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class, and nothing here changes `src/game.js`.

## Desired outcome

Level 54's target rests on a comparison the measurement standard admits, and
the owner decides to keep, retune, or re-author it with the cost of each
option stated.

## Why

- Checked: commit `3bcb5a6` (2026-09-05) shipped Level 54 at 126,000 using
  `calib-1` figures (bot median 105,664; bot wins 23.3%) and one owner game
  compared with the bot's median over other seeds.
- Reported: commit `b848994`, fifteen minutes later, found that on the same
  seed the bot trails that owner game by 2.6%, the kind of comparison the
  standard requires.
- Reported: the current bot wins Level 54 about 98% of the time at 126,000,
  and the routine health check samples levels 1-50 only.

## Acceptance criteria

1. A protocol is registered and committed before either bot is measured: the
   seed range (fresh, logged, avoiding seeds 200000-200039), both bots to be
   measured (shipped bot and `calib-1`), and the decision thresholds that
   determine keep, retune, or re-author, all fixed before any outcome data
   exists.
2. Win rates at 126,000 for both the shipped bot and `calib-1`, measured
   under that registered protocol.
3. A same-seed comparison of every speed-intent owner session on Level 54
   (depends on BL-0017's intent tags).
4. A written recommendation to keep, retune, or re-author, with costs, made
   against the protocol's pre-registered thresholds rather than chosen after
   seeing the outcome.

## Current evidence

RESULT-0028; RESULT-0027; the measurement standard's bot and human comparison
rules.

## Next action

Register a protocol (seed range, both bots, keep/retune/re-author thresholds)
before measuring either bot at 126,000.

## History

- 2026-09-27: Proposed from the blast-radius audit.
- 2026-09-27: Codex review (finding 4117059304) noted the record had no
  requirement to register a protocol before measuring either bot. Added
  criterion 1 requiring a registered protocol (seed range, both bots,
  keep/retune/re-author thresholds) committed before either bot is measured,
  renumbered the prior criteria, and updated Next action to match.
