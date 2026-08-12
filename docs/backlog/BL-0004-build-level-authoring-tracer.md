---
id: BL-0004
title: Build the level-authoring tracer
status: active
milestone: level-authoring
depends_on: []
updated: 2026-08-12
---

# BL-0004 — Build the level-authoring tracer

## Authority

This record captures accepted planning intent, not evidence. The [evidence ledger](../../EVIDENCE_LEDGER.md) remains authoritative for proof standing; generated measurements require separate verification and admission.

## Desired outcome

One proposed level shape can become a measured-target candidate, open in the existing game as seeded custom play, and leave a replayable human playthrough without changing the 50 shipped levels.

This is the first tracer through the approved authoring loop. It proves the seams with one candidate before spending the historical five-level or ten-iteration bound.

## Acceptance criteria

- Candidate shape and pacing are declared while target and chapter tile scale are derived mechanically from the current measured-demand policy.
- A disjoint 300-seed holdout records win, lockout, bomb, and terminal-reason rates; the candidate fails closed on any lockout, more than 5% bomb failures, or less than 20% bot wins.
- The custom player opens the candidate without adding it to shipped `LEVELS` and labels its seed and candidate identity.
- A completed human play records the candidate, seed, ordered legal chains, score, moves, and outcome under `recordings/`.
- The shipped level identity, curve gate, and solver regressions remain green.

## Current evidence

- [DECISION-0003](../../EVIDENCE_LEDGER.md#decision-0003--targets-are-a-measured-share-of-achievable-score-tile-scale-doubles-per-chapter) fixes measured demand and chapter tile scaling for level authoring.
- [RESULT-0008](../../EVIDENCE_LEDGER.md#result-0008--every-level-is-winnable-after-the-demand-based-retune) records the green shipped curve and its bot-proxy limitation.
- The historical [level-authoring design](../superpowers/specs/2026-08-08-level-authoring-loop-design.md) supplies the generator/player/recorder shape; its pre-retune target and win-band assumptions are not carried forward unchanged.

## Next action

Execute the frozen code delivery at `.orch/runs/level-authoring-tracer-2026-08-12/spec.md`, then present candidate 51 for owner play and review.

## History

- 2026-08-12 — Activated after owner approval. Scope narrowed to one end-to-end tracer because the original design predates the completed curve retune.
