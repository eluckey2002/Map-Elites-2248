# Archived candidates

Superseded candidate stores and receipts, kept as history rather than as live
measurement records. They sit outside the receipt gate
(`solver/tests/receiptGate.test.js`), which walks `solver/` top level only, and
outside the corpus manifest (`solver/candidate-corpus.json`).

**The rule that makes this archive honest: do not quote a number from anything
in here.** Every receipt below fails the current `verifyCandidate`: each was
measured before the frozen evaluator stamp existed and against evaluator code
that has since changed, so its win rates, medians, and terminal counts describe
a ruler that is no longer used. That is a checked statement, not a standing
assumption: re-run it against every archived store with

```
node -e "const fs=require('fs'),path=require('path');const{verifyCandidate}=require('./solver/level-author.js');
const A='solver/candidates-archive',rj=f=>JSON.parse(fs.readFileSync(f,'utf8'));
for(const b of fs.readdirSync(A).filter(n=>n.startsWith('candidate-levels')&&n.endsWith('.json')&&!n.endsWith('.receipt.json')).sort()){
try{verifyCandidate(rj(path.join(A,b)),rj(path.join(A,b.replace(/\.json$/,'.receipt.json'))));console.log('VERIFIES '+b);}
catch(e){console.log('FAILS    '+b+' -> '+e.message);}}"
```

All five stores printed `FAILS ... calibration stamp mismatch` on 2026-09-03.
A store here that starts printing `VERIFIES` is not thereby quotable — it means
someone refreshed a receipt in the archive, which is not what the archive is
for.

A **target** is not a measurement, and neither is a **board**. Those are the
level as authored, and a human playthrough recorded against them stays valid
however far the bot drifts. Quoting is barred for what the receipts *measured*:
win rates, medians, holdout counts, terminal tallies.

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

Superseded by later candidates and never shipped. Recordings in `recordings/`
bind to a candidate by content hash (`candidateIdentity`), not by file path, so
archiving these files does not orphan them:

- `gen-0010` (`7dfcb056…`, played as level 52, seed 777) — recording
  `d36e875d…` replays against it.
- `gen-0021` (`3b03d52a…`) — **no recording binds to this one.** An earlier
  version of this section said the second file was `gen-0017` from batch-02 and
  paired it with recording `44d3802d…`. Both halves were wrong. The file here
  has always been `gen-0021`; `gen-0017` was never copied into the archive at
  all and still lives only inside `solver/generated-batch-02.json`. That mistake
  is why `44d3802d…` spent months listed as a recording whose board was "gone" —
  the archive said it was covered, so nobody looked in the batch file.

Human play data is independent of bot drift: the bot changing does not
invalidate what a person actually did on a board. That is why the two categories
are separated at all.

**Naming caveat:** candidate names restart at `gen-0000` in every batch, so
`gen-0010` names two unrelated levels across batches 01 and 03. Resolve by
content hash, never by name — as the `gen-0017`/`gen-0021` mix-up above shows.

## The two recovered stores — level 51 and level 54

Added 2026-08-21 (ticket T-007). These are not superseded candidates that were
tidied away. They are boards a human actually played that stopped existing on
disk, recovered from git so their recordings can be replayed again. Both files
are byte-identical to the git blob they came from; nothing was re-authored.

- `candidate-levels-51-split-channel-524f37c0.*` — level 51,
  `level-51-split-channel`, target 124000, identity `524f37c0063d61e5…`.
  Recovered from `git show 1468392^:solver/candidate-levels.json` (and its
  receipt). Commit `1468392` re-authored level 51 straight over this store, back
  when `author-level.js` had its output path hardcoded (fixed later in
  `36d8e73`). Three recordings bind to it — `1c873567…` (win, 127040),
  `78749fc0…` (win, 130496), and `8ac6c9d4…` (**the project's only recorded
  loss**, 59584). All three replay with zero discrepancies.
- `candidate-levels-54-tighter-pace-56c8eab0.*` — level 54,
  `level-54-tighter-pace`, target 150000, identity `56c8eab00e4a6e2d…`.
  Recovered from `git show 0965038^:solver/candidate-levels-54.json` (and its
  receipt). Commit `0965038` re-measured level 54 against the current bot, which
  produced a new identity and severed the recording bound to the old one — same
  day, same session as this recovery. Recording `3d3ba1f0…` (win, 152704)
  replays against it with zero discrepancies.

**Why here and not in `solver/`.** Both receipts fail
`code/input identity mismatch`, so putting them in the live corpus would add two
failing tests and prove nothing new — the receipt gate already reports the one
stale receipt that matters. `recordingReplay.test.js` indexes this directory, so
archiving is enough to make the replays run.

The filename carries the first 8 hex of the identity because the live
`solver/candidate-levels-54.json` shares the shape name `level-54-tighter-pace`
at a different target (160000). Same name, different board; the hash is what
tells them apart.

Everything above about these two — targets, boards, recorded scores — is
quotable. Their receipts' win rates and medians are not, same as the rest of
this directory.

## Recovered shipped Level 53 identity

`candidate-levels-gen0014-wide-sprint-043ca53f.*` preserves the exact Level 53
candidate that shipped at target 101000. Both files are byte-identical to
`8de076a000ead141d45f2a34629f51ea5aa1cbfe:solver/candidate-levels.json` and
`8de076a000ead141d45f2a34629f51ea5aa1cbfe:solver/candidate-levels.receipt.json`.
Its candidate identity is
`043ca53f234d4092202677b3e48a1855c0194c208742bba94a2c75ebd2227f16`.

The active `solver/candidate-levels.json` now holds a separately measured 102000
authoring candidate with a different identity. The archived 101000 board and
target remain the subject of the three Level 53 human recordings, so those
replays remain valid and replayable. Its old bot measurements — including its
median, win rate, and terminal counts — are stale and must not be quoted.
