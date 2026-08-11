# Current work

This page is a bounded navigation record, not evidence. Read the [evidence ledger](EVIDENCE_LEDGER.md) for current proof standing and source-linked claims.

## Active milestone

Set the shipped levels' score targets from measured achievable score rather than a fixed 500-point step. Calibration across all 50 levels found that the current bot clears no level from 17 onward, and that targets grow linearly while achievable score stays flat or declines. See the ledger's [RESULT-0005](EVIDENCE_LEDGER.md#result-0005--level-26-is-not-a-tuning-outlier-the-whole-back-half-is-unbeaten).

The milestone exits when each level's target is set by a stated difficulty standard, and the calibration run shows the intended curve.

## Parked

The Level 26 exact-proof track. It is parked by [DECISION-0002](EVIDENCE_LEDGER.md#decision-0002--park-the-exact-proof-track-tune-levels-from-measured-calibration), not retracted: 13,000 reachability and the exact maximum stay open, all frozen receipts and verifiers remain committed and replayable, and no impossibility claim follows. It was parked because the shipped game seeds its board from `Math.random`, so a result about one frozen seed cannot decide whether a player can clear the level.

[BL-0001](docs/backlog/BL-0001-test-compact-state-signature.md) and [BL-0002](docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md) belong to that track and are parked with it.

## Blockers and decisions needed

- **Owner decision, blocking:** what difficulty standard should a target encode — what win rate, for which player? Targets cannot be set without it.
- The current bot is a weak proxy for a skilled player. On the one board where both were measured, a dedicated search scored about 1.5x the bot (12,336 against 8,174). That single ratio is enough for coarse triage, not for setting exact targets.

## Useful commands

```bash
node solver/target-calibration.js 200   # per-level target vs achievable score
node --test solver/tests/*.test.js
```

Last reviewed: 2026-08-11
