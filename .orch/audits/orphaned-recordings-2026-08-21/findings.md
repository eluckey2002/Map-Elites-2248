# Why five recordings had no candidate definition — and whether they are lost

**Question:** why do 5 recordings in `recordings/` reference candidate
identities that exist nowhere on disk, and are those definitions recoverable?

**Status:** answered. **None of the five are lost.** Four are recoverable from
git; the fifth was never lost at all.

**Verification:** the dispatch named no oracle, so per rules this returns
UNVERIFIED against the dispatch. The investigation applied its own deterministic
oracle — *recover the candidate, replay the bound recording against it, and
require zero discrepancies* — and every recovery passed it. Findings below are
`deterministic` on that basis, not on inspection alone.

---

## Findings

### F1 — Level 51's store was overwritten by an authoring run. Recoverable. (high confidence)

Three recordings (`1c873567`, `78749fc0`, `8ac6c9d4` — the last is the project's
**only recorded loss**) bind to candidate `524f37c0063d61e5`.

`git log --all -S"524f37c0063d61e5" --name-only` shows the identity lived in
`solver/candidate-levels.receipt.json`, added at `420ba8e` and removed at
`1468392` ("Hand off: the bot got 8% stronger, and gen-0014 beat it"). That
commit replaced the level 51 store with gen-0014 — the hardcoded-output-path
behaviour fixed later in `36d8e73`.

Recovered `git show 1468392^:solver/candidate-levels.json` and its receipt:
level 51, target 124000, shape `level-51-split-channel`, candidateIdentity
`524f37c0063d61e5` — exact match.

All three recordings replay against it with **zero discrepancies**:
| recording | outcome | replayed score | recorded score |
|---|---|---|---|
| `1c873567` | win | 127040 | 127040 |
| `78749fc0` | win | 130496 | 130496 |
| `8ac6c9d4` | lose (out of moves) | 59584 | 59584 |

### F2 — Level 54's store was orphaned today, by this session. Recoverable. (high confidence)

Recording `3d3ba1f0` binds to `56c8eab00e4a6e2d`, which lived in
`solver/candidate-levels-54.receipt.json` until commit `0965038`
("Re-measure level 54 against the current bot") — **ticket T-002, run this
afternoon**. Re-authoring produced a new identity and severed the recording.

Recovered `git show 0965038^:solver/candidate-levels-54.json`: level 54, target
150000. The recording replays against it with zero discrepancies, final score
**152704**, matching exactly.

**Consequence for T-002's record:** its Risks section states the re-authored
level 54 is "measured but unvalidated by any human." That was false when
written. A human win existed; T-002 severed the link to it in the same run. The
re-measurement was still correct — level 54 is unshipped and its target moved
freely — but the claim of no human validation was not.

### F3 — Level 52's batch candidate was never lost. (high confidence)

Recording `44d3802d` binds to `5b12806fa862b530`, which `git log -S` places in
`solver/generated-batch-02.json` — a file that **exists at HEAD** (keys:
`gates`, `results`, `sampler`, `schemaVersion`, `screenSeeds`, `screened`).

This is not a loss. `recordingReplay.test.js`'s `candidateIndex()` scans only
`candidate-levels*.json` in `solver/` and `solver/candidates-archive/`, so a
candidate held inside a generated batch file is invisible to it and gets
classed as an orphan. **The orphan is a blind spot in the check, not missing
data.**

---

## Contradictions with what is already written down

- `docs/CHECK-CARDS.md`, card `recordings-replay-to-their-claims`, blind spot 1:
  "Orphans — 5 of 8 recordings cannot be verified at all… the board is gone and
  no replay is possible." **False.** Four are recoverable from git and one is
  present at HEAD; all five replay once their candidate is supplied.
- Commit `91321e4` body: "Five recordings can never be verified — their
  candidate store is gone, so the board is gone." **False**, same reason.
- Ticket `T-005` Result and Risks: "5 orphans… can never be verified",
  "Five human playthroughs are permanently unverifiable, including the only
  recorded loss." **False.**
- `HANDOFF.md` records level 51 living in `candidate-levels.json` and being
  overwritten. **Confirmed correct** — it was the one source that had this right.

## Dead ends

- Filtering `git show --name-only 32b90b3` to `*.json` returned no file carrying
  level 51's identity, which read as "not in history". The filter was wrong, not
  the history: the identity was in `.md` audit files in that commit and in
  `candidate-levels.receipt.json` in others. A narrow filter produced a false
  negative — the same "output narrower than the claim" pattern logged earlier
  this session.

## Gaps left by the bound

- Not checked: whether other generated-batch files hold further candidates that
  recordings bind to. Only `generated-batch-02.json` was traced, because only one
  orphan pointed into a batch.
- Not checked: whether the recovered level 51 and level 54 receipts still
  *verify* against the current bot. They almost certainly do not — both predate
  bot changes — but recovery for replay purposes does not require it, since
  replay reads the candidate, not the receipt.
- Not done: any repair. This lane is read-only; recovery is a separate ticket.
