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

1. Intent/for/exclusion labels live in a **sidecar index** outside both
   `play-sessions/` and `recordings/` (for example `data/session-intent.json`),
   keyed by recording id (at minimum `intent`: `race` | `explore`, and `for`
   naming the backlog item, experiment, or study the session served).
   `solver/human-benchmark.js` reads every JSON file under `play-sessions/`,
   and `solver/recording-replay.js` and its zero-orphan check read every JSON
   file under `recordings/`, so an index inside either folder would be treated
   as a recording. Recording files themselves are never edited: they are
   content-addressed (filename = SHA-256 of contents, per
   `authoring-server.js`'s `recordingIdentity`), and at least one —
   `recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json`
   — has its exact hash independently re-derived and pinned by
   `.orch/audits/recording-replay-verification-2026-08-17/verdict.md` for
   RESULT-0009; tagging in place would change that hash and break the
   verified chain.
2. The sidecar index is populated for existing sessions, including the five
   explore sessions above (`267a4373`, `4721079f`, `8dc8e825`, `8f9e1207`,
   `e81f8323`) tagged `explore`, and `8ac6c9d4` tagged excluded with its
   reason — the recording files are untouched.
3. `solver/human-benchmark.js` counts only sessions the sidecar index marks
   `race` AND not excluded, and prints how many it left out and why.
4. A test fails if an untagged, `explore`, or excluded session (including an
   excluded `race` session such as `8ac6c9d4`) enters the speed comparison.
5. A test asserts that no hash-pinned recording changed: it parses
   `recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json`
   (and any other recording a verification record cites by hash), calls
   `recordingIdentity` from `solver/authoring-server.js` on the parsed JSON,
   and fails if the result no longer matches the filename/verdict. It must
   NOT hash the raw file bytes: those give a different digest (`ed367f1e...`
   for this file) and would report the valid baseline as corrupt. The test
   is first run against the unchanged recordings and must pass.
6. Both capture paths that write a recording without any intent field today
   — `tools/play-server.js:116-132` (`POST /api/play-sessions`, which stamps
   `capturedAt`/`source` but never `intent`) and
   `solver/authoring-server.js:157-193` (`POST /api/recordings`, which
   validates and writes the recording verbatim with no intent field at all)
   — are changed so each either writes the corresponding sidecar intent entry
   at capture time (same request, before responding success) or rejects an
   intent-less capture outright; a capture is never accepted silently
   untagged.
7. A test per endpoint proves criterion 6: one test posts to
   `/api/play-sessions` and asserts a sidecar entry now exists (or the
   request is rejected) before the session is considered captured; one test
   posts to `/api/recordings` and asserts the same.

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
- 2026-09-27: Codex review (finding 4117108538) asked whether
  `tools/play-server.js:116-132` and `solver/authoring-server.js:157-193`
  store recordings without intent. Confirmed by reading both: neither writes
  or checks any intent field today. Added criterion 6 requiring both capture
  paths to write the sidecar intent entry at capture time or reject an
  intent-less capture, and criterion 7, a test per endpoint.
- 2026-09-27: Addressed Codex review on b774c96 (sidecar location; foreign-host leases).
- 2026-09-27: Criterion 5 now checks `recordingIdentity` of the parsed recording, not raw bytes (Codex review on 5174e82; confirmed raw bytes hash to `ed367f1e...` vs identity `8ac6c9d4...`).
- 2026-09-27: Benchmark filter is `race` AND not excluded, tested with an excluded race session (Codex review on 0d9fdb3).
