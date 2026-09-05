---
id: BL-0009
title: Re-validate single-seed reliability on the actual candidate population it gates
status: proposed
milestone: level-difficulty-calibration
depends_on: []
updated: 2026-09-05
---

# BL-0009 — Re-validate single-seed reliability on the candidate population it actually gates

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## Desired outcome

The single-seed reliability figure used to justify measuring a candidate
level with one 60-game sample instead of more is validated on a population
that resembles what it actually gates: a handful of generated candidates
competing for one level slot, not the full spread of already-shipped levels.

## What was found and independently verified this session

`RESULT-0021` measured single-seed reliability (`between / (between +
within)`, `SUPPORTED` at >= 0.80) using the 53 already-shipped levels
(`src/game.js`). Recomputing directly from `LEVELS[].target`: n=53, mean
30,481, coefficient of variation **0.976** -- shipped levels vary enormously
in target, by design (they span a difficulty curve from tutorial to
end-game).

The reliability figure is downstream-consumed to decide how many seeds are
needed when picking among several generated *candidates* for a single level
slot. Recomputing the same statistic over the candidate pool actually
produced for that purpose (`solver/generated-batch-01..04.json`, combined):
n=79, mean 158,803, coefficient of variation **0.437** -- roughly half the
spread of the population the reliability figure was measured on.

`between / (between + within)` reliability rises with between-item variance
at fixed within-item (seed) noise. A population with roughly half the
spread plausibly has a materially different reliability figure than the one
measured -- in the direction of being *less* reliable than 0.967 suggested,
since there is less real signal to separate from the same seed noise.
Nothing in `RESULT-0021`'s protocol or report checks this.

## What is NOT established

The actual reliability figure on the candidate population. This record
does not claim the 0.967 figure is wrong -- only that it was validated on a
population roughly twice as spread out as the one it is used to gate
decisions for, and the direction of the likely error (lower reliability on a
tighter population) is a real risk worth measuring rather than assuming away.

## Acceptance criteria

- Single-seed reliability is recomputed with the same method
  (`between / (between + within)`) directly on a real candidate pool for one
  level slot (e.g. the 79-119 `generated-batch-*` candidates for level 53),
  not the 53 shipped levels.
- The result is compared against the existing `>= 0.80` / `< 0.50` bar from
  `RESULT-0021`'s protocol, and either confirms the existing seed count is
  still adequate or names how many seeds a tighter population actually needs.

## Current evidence

- `experiments/RESULT-0021/protocol.md:109,147-148`
- `src/game.js` `LEVELS` (recomputed CV = 0.976, n = 53)
- `solver/generated-batch-01.json` through `-04.json` (recomputed CV = 0.437,
  n = 79, combined across all four files)

## Next action

None authorized yet. Next step is a proper pre-registered protocol (per
`solver/AGENTS.md`) if this reliability re-measurement is run, since it is a
generalizing claim about how many seeds are enough.

## History

- 2026-09-05 — captured from an independent fresh-eyes review of the repo's
  experiments and findings; the population-variance gap was independently
  recomputed from the raw files in this session and confirmed close to the
  review's original figures (0.976 vs. reported ~0.95, 0.437 vs. reported
  ~0.43), requested by the owner as a follow-up pass after the review's
  higher-priority items were fixed.
