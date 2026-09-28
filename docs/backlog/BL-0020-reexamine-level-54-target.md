---
id: BL-0020
title: Re-examine Level 54's shipped target with same-seed comparisons
status: dropped
milestone: level-difficulty-calibration
depends_on: [BL-0017]
updated: 2026-09-28
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
   seed range (never observed for Level 54: exclude the whole prior panel 200000-200119 that `src/game.js`'s Level 54 comment records, plus any range in `experiments/SEEDS.md`; logged in `SEEDS.md` before use), both bots to be
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

None: dropped. See Disposition.

## Disposition

Dropped 2026-09-28. The 126,000 target is a deliberate owner decision, recorded
in the shipping commit `3bcb5a6` (2026-09-05): "Level 54 is a deliberate
exception to the demand rule ... the one level whose difficulty comes from
human evidence rather than bot measurement." This record wrongly treated the
decision as unjustified because one supporting sentence in that commit compared
the owner's game with the bot's median over other seeds (not a valid
comparison) and quoted a `calib-1` win rate. That sentence should not be cited
as a comparison; the decision itself stands. The valid same-seed comparison
(seed 424242: owner 140,544 in 20 moves, shipped bot 136,832 in 19) is
consistent with it. An exploratory 2026-09-27 run also found one `calib-1`
lockout at this target (seed 91,000,047; the shipped bot had none); it is a
note, not a reason to reopen.

## History

- 2026-09-27: Proposed from the blast-radius audit.
- 2026-09-27: Codex review (finding 4117059304) noted the record had no
  requirement to register a protocol before measuring either bot. Added
  criterion 1 requiring a registered protocol (seed range, both bots,
  keep/retune/re-author thresholds) committed before either bot is measured,
  renumbered the prior criteria, and updated Next action to match.
- 2026-09-27: Corrected the excluded seed range to the full prior Level 54 panel 200000-200119 (Codex review on b625881).
- 2026-09-28: Dropped: the target is an owner decision already recorded in `3bcb5a6`; see Disposition.
