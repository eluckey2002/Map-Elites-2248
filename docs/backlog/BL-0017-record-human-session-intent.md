---
id: BL-0017
title: Record why each human session was played, and benchmark only speed attempts
status: proposed
milestone: measurement-definitions
depends_on: []
updated: 2026-09-27
---

# BL-0017 — Record human session intent

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class. It comes from a 2026-09-26/27 owner-session
blast-radius audit. "Checked" below means re-run or read by that session.

## Desired outcome

Every recorded human session says why it was played, and the human-vs-bot
speed benchmark compares only sessions whose objective matches the bot's
target-stop objective, as the measurement standard already requires.

## Why

- Checked: recordings carry no field for intent. Keys of
  `play-sessions/10e4dff8….json` are `candidateIdentity`, `candidateLevel`,
  `capturedAt`, `chains`, `movesUsed`, `outcome`, `reason`, `schemaVersion`,
  `score`, `seed`, `source`.
- Checked: `solver/human-benchmark.js:96` assumes every human session shares
  the bot's target-stop objective.
- Owner statement (2026-09-27): the five ordinary early-level sessions
  `267a4373`, `4721079f`, `8dc8e825`, `8f9e1207`, `e81f8323` (levels 1, 2, 3,
  4, 30) were not speed attempts; they were generating other play and
  behavior data. With them counted, the benchmark reports the bot faster; with
  them excluded, human and bot are effectively even. See BL-0019 for the
  headline correction.
- Recording `8ac6c9d4` (the Level 51 seed 1 input-bug loss, RESULT-0009) is
  also counted as a genuine human loss; an intent/validity field is the
  natural place to exclude it.

## Acceptance criteria

1. The recording format gains an `intent` field (at minimum `race` and
   `explore`) and a `for` field naming the backlog item, experiment, or study
   the session served.
2. Existing sessions are tagged, including the five above as `explore` and
   `8ac6c9d4` as excluded with its reason, without altering their replay data.
3. `solver/human-benchmark.js` counts only `race` sessions and prints how many
   sessions it excluded and why.
4. A test fails if an untagged or `explore` session enters the speed
   comparison.

## Current evidence

- [Measurement standard](../MEASUREMENT-AND-ANALYSIS-STANDARDS.md), bot and
  human comparison: same board, seed, budget, and objective.
- CORRECTION-0009 (current benchmark headline).

## Next action

Decide the field names and allowed values; then tag the six sessions above.

## History

- 2026-09-27: Proposed from the blast-radius audit and the owner's statement
  about exploration sessions.
