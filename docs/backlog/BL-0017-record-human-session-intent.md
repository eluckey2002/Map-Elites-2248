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

1. Intent/for/exclusion labels live in a **sidecar index** (for example
   `play-sessions/intent-index.json` or `recordings/INTENT.json`), keyed by
   recording id (at minimum `intent`: `race` | `explore`, and `for` naming
   the backlog item, experiment, or study the session served). Recording
   files themselves are never edited: they are content-addressed (filename =
   SHA-256 of contents, per `authoring-server.js`'s `recordingIdentity`), and
   at least one — `recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json`
   — has its exact hash independently re-derived and pinned by
   `.orch/audits/recording-replay-verification-2026-08-17/verdict.md` for
   RESULT-0009; tagging in place would change that hash and break the
   verified chain.
2. The sidecar index is populated for existing sessions, including the five
   explore sessions above (`267a4373`, `4721079f`, `8dc8e825`, `8f9e1207`,
   `e81f8323`) tagged `explore`, and `8ac6c9d4` tagged excluded with its
   reason — the recording files are untouched.
3. `solver/human-benchmark.js` counts only sessions the sidecar index marks
   `race` and prints how many it excluded and why.
4. A test fails if an untagged or `explore` session enters the speed
   comparison.
5. A test asserts that no hash-pinned recording file changed: it re-derives
   the SHA-256 of `recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json`
   (and any other recording a verification record cites by hash) and fails if
   it no longer matches the filename/verdict.

## Current evidence

- [Measurement standard](../MEASUREMENT-AND-ANALYSIS-STANDARDS.md), bot and
  human comparison: same board, seed, budget, and objective.
- CORRECTION-0009 (current benchmark headline).

## Next action

Decide the field names and allowed values; then tag the six sessions above.

## History

- 2026-09-27: Proposed from the blast-radius audit and the owner's statement
  about exploration sessions.
- 2026-09-27: Codex review (finding 4117027130) noted that tagging in the
  recording file itself would change the SHA-256 of at least
  `recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json`,
  which `.orch/audits/recording-replay-verification-2026-08-17/verdict.md`
  independently re-derived and pinned for RESULT-0009. Confirmed by reading
  that verdict and `git grep`ing the repo for the recording's filename/hash;
  rewrote acceptance criteria 1-2 to move labels into a sidecar index and
  added criterion 5, a test that no hash-pinned recording changed.
