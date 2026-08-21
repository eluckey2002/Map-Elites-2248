# Archived candidates

Superseded candidate stores and receipts, kept as history rather than as live
measurement records. They sit outside the receipt gate
(`solver/tests/receiptGate.test.js`), which walks `solver/` top level only, and
outside the corpus manifest (`solver/candidate-corpus.json`).

**The rule that makes this archive honest: do not quote a number from anything
in here.** Every receipt below fails `verifyCandidate` with
`code/input identity mismatch` — each was measured against a `bot.js` that has
since changed, so its win rates, medians, and terminal counts describe a bot
that no longer exists.

**What this archive is not for.** It is not a way to clear a failing gate. On
2026-08-21 levels 52 and 54 were moved here because their receipts were stale
and that turned the suite green; they were put back the same day. Removing the
input a check just flagged is the exact failure the check exists to catch. Those
two now sit in the live corpus and fail honestly, and the manifest means a
future store cannot leave silently — retiring one requires editing
`solver/candidate-corpus.json` in the same commit, which is the signature.

Archive something here when it is genuinely superseded and nobody intends to
cite it again. Not when it is inconvenient.

## gen-0010 and gen-0021 — superseded candidates

Superseded by later candidates and never shipped. Kept rather than deleted
because they are the substrate for the only human playtest evidence in the
project. Recordings in `recordings/` bind to a candidate by content hash
(`candidateIdentity`), not by file path, so archiving these files does not
orphan them:

- `gen-0010` (played as level 52, seed 777) — recording `d36e875d...`
- `gen-0017` from batch-02, stored here as part of the same session's set —
  recording `44d3802d...`

Human play data is independent of bot drift: the bot changing does not
invalidate what a person actually did on a board. That is why the two categories
are separated at all.

**Naming caveat:** candidate names restart at `gen-0000` in every batch, so
`gen-0010` names two unrelated levels across batches 01 and 03. Resolve by
content hash, never by name.
