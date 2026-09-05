---
id: BL-0010
title: Document (without editing) the hand-copied win/lose rule in level-author.js
status: proposed
milestone: level-difficulty-calibration
depends_on: []
updated: 2026-09-05
---

# BL-0010 — The hand-copied win/lose rule in level-author.js

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## What was found

`solver/level-author.js`'s `playMeasured` (used to measure whether an
authored candidate level is winnable, for difficulty calibration) hand-copies
`src/game.js`'s win/lose rule: `checkBombs(state)` first, then
`state.score >= state.targetScore`, then `state.moves >= state.maxMoves`.
Found by an independent fresh-eyes review of this repo.

Checked directly this session: the `checkBombs` half of this duplication is
**not** an unguarded drift risk — `solver/tests/mirrors-game.test.js`
("checkBombs agrees in BOTH directions") already differentially tests
`solver/engine.js`'s `checkBombs` against `src/game.js`'s real method. The
remaining duplicated surface is the two trivial comparisons
(`score >= targetScore`, `moves >= maxMoves`) and their order relative to the
bomb check. If `src/game.js`'s `checkWinLose()` ever gains a new terminal
condition, reorders these two checks, or changes either comparison, nothing
would fail here to say `level-author.js` needs the same update.

## Why this is a backlog note and not a code comment or a test

Both were tried this session and reverted. `solver/level-author.js` is one of
exactly two files (`engine.js` and itself) hashed into every candidate
receipt's `code/input identity` via `defaultInputIdentities()` in the same
file. A pure comment addition there — zero logic change — still changed the
file's byte identity, which failed `candidate-levels.json`'s receipt gate:
"Not exempt (ships=true, human win recorded=false)... Re-author it against
the current bot, or archive it and stop quoting its numbers." Re-authoring a
shipped level's receipt is a real, potentially expensive operation (fresh
fitting + holdout evaluation) and not something to trigger as a side effect
of documentation. This is recorded here instead, in a file nothing hashes.

## Desired outcome

Either a differential test proving `level-author.js`'s two trivial
comparisons agree with `src/game.js`'s real `checkWinLose()` on representative
score/move states, or an explicit, owner-accepted decision that this residual
risk is small enough to leave undocumented in code. Either way, any future
change here should be made deliberately, with a fresh `defaultInputIdentities()`
re-derivation of affected receipts folded into the same change, not
discovered as an unexpected receipt-gate failure.

## Acceptance criteria

- A differential check (test, not a comment) exists comparing
  `level-author.js`'s terminal-condition logic against `src/game.js`'s real
  `checkWinLose()` for a matrix of score/target/move/maxMoves combinations, OR
- The owner explicitly decides this residual risk does not warrant one, and
  that decision is recorded here.

## Current evidence

- `solver/level-author.js:123-140` (`playMeasured`), `:42-47`
  (`defaultInputIdentities`)
- `src/game.js` `checkWinLose()`/`checkBombs()`
- `solver/tests/mirrors-game.test.js` ("checkBombs agrees in BOTH directions")
- `solver/tests/receiptGate.test.js:165` (the gate that fired when this was
  tried as a code comment)

## Next action

None authorized yet. Whoever picks this up should budget for a receipt
re-authoring pass if any code (not just a comment) in `level-author.js` or
`engine.js` changes as part of the fix.

## History

- 2026-09-05 — captured from an independent fresh-eyes review of the repo;
  a code-comment attempt was made and reverted in the same session after it
  broke `candidate-levels.json`'s receipt gate, which is recorded above as
  the reason this is a backlog note rather than an inline comment.
