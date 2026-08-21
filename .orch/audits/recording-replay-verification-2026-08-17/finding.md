# Finding: a real recording now exists for the authoring-tracer AC-4 gap

**Scope:** whether the file below closes the specific gap left open by
`.orch/audits/recording-replay-closure-2026-08-12/report.md` (`F-001`) — that
ticket `authoring-tracer` (run `level-authoring-tracer-2026-08-12`) was
restored to `suspended` because no human terminal recording existed in the
worktree and no independent replay/semantic verification of one had been
done.

**Author of this finding:** the same conversation/context that is proposing
it. This document is evidence only — it does not close the ticket. Per the
project's own independence rule (the exact rule `F-001` exists to enforce),
a separate context must re-derive the check below from primary sources
before `authoring-tracer` is un-suspended.

## What was found

A recording file now exists in the isolated ticket worktree that did not
exist (or was not evidenced) at the time of the `F-001` audit:

- **Path:** `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo/recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json`
- **SHA-256:** `ed367f1e504cd241ecf215a4845a16aa1e18ffd773ad5aa0e02087d95bbb34b5`
- **Filesystem mtime:** 2026-08-13 09:47 (one day after the `F-001` audit; untracked, not yet committed)
- **Contents:** `candidateIdentity`, `candidateLevel: 51`, `seed: 1`, 24 ordered
  chains (tiles + points each), `movesUsed: 24`, `outcome: "lose"`,
  `reason: "out of moves"`, `score: 59584`, `schemaVersion: 1`.

Worktree state the recording sits in, for reproducibility:

- **Workspace commit:** `2e26ad26ab725300b6441edaa21864162703fe54` (the same
  result revision the ticket's Iteration 2/3 verification already covers).
- `solver/candidate-levels.json` SHA-256:
  `49920ea643bbb060fc351be38f46ad5382513713becc0b05e491c1e921a73f33`
- `solver/candidate-levels.receipt.json` SHA-256:
  `4886484a092f03da0fd0cb638b8f514cf3215e837ba3002d4acee1db0f719878`
- The recording's `candidateIdentity` (`524f37c0063d61e5ab4b636b720f3cd644ec83cba62324e48304d5a12bb3dd5c`)
  matches the identity recorded in both `candidate-levels.json` and
  `candidate-levels.receipt.json` at that commit — it is bound to the correct
  candidate, not some other shape.

## Check performed (reproduce independently — do not trust this output)

From `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo` at commit
`2e26ad26ab725300b6441edaa21864162703fe54`:

1. Load the candidate's level definition from `solver/candidate-levels.json`
   (5x7 grid, minChain 4, moves 24, tileScale 32, no blockers).
2. Re-create the initial board from scratch using `solver/engine.js`'s
   `createLevelState(levelData, makeRng(1))` — seed 1, matching the
   recording's `seed` field and the `?candidate=51&seed=1` URL the rendered
   smoke evidence in `evidence/rendered-smoke-2026-08-12.png` already shows.
3. Replay the recording's 24 chains **in order**, against the live board
   state, using only `solver/engine.js` primitives
   (`isValidChain`, `canExtendChain`, `executeChain`, `applyGravity`,
   `spawnNewTiles`, `tickBlockers`) — the same functions `solver/sweep.js`
   and every existing solver test use, not a new/forked implementation.
4. At each step, confirm the recorded tile *values* at the recorded (x, y)
   positions match what is actually on the live board before accepting the
   move (this is what makes it a replay against the real state, not a replay
   of the recording's own claims).
5. Compare the replayed final score/moves to the recording's claimed
   `score`/`movesUsed`.

**Result:** zero problems found. Every one of the 24 recorded chains matched
real board tiles at that exact moment and was legal
(`isValidChain`/`canExtendChain` both true). The replayed score (`59584`)
and move count (`24`) exactly match the recording's claimed values. Given
`movesUsed (24) === maxMoves (24)` and `score (59584) < target (124000)`,
the recorded `outcome: "lose"` / `reason: "out of moves"` is the only
outcome the engine's own rules would produce — consistent with the
recording.

## What this does and does not establish

- **Does establish:** the recording is internally consistent with the real
  engine rules and the real candidate's initial random deal for seed 1. It
  is not a hand-edited or fabricated file — producing a fake JSON that
  satisfies a from-scratch adversarial replay (correct tile values at every
  position, at every one of 24 steps, against a PRNG-determined board) is,
  for practical purposes, equivalent to having actually played it.
- **Does not establish by itself:** *who* produced the recording, or that it
  came from the browser's real `AuthoringCapture` → authoring-server save
  path rather than some other route that happens to write the same schema.
  If that provenance matters for AC-4's intent (a genuine human playtest,
  not just a mechanically valid file), the independent check should also
  look for corroborating evidence — e.g., server logs, browser history, or
  asking the owner directly whether they played it on 2026-08-13.

## Not done by this finding

No ticket frontmatter, worklog, receipt, or source file was modified. No
commit was made in the isolated worktree. This is a read-only investigation
record, filed outside `authoring-tracer`'s `write_scope` (this repo's
`.orch/audits/`, mirroring where `F-001` itself was filed).
