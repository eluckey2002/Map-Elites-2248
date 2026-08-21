# Recording/replay verification — independent re-derivation

- **scope:** whether the recording file cited by `finding.md`
  (`.orch/audits/recording-replay-verification-2026-08-17/finding.md`)
  closes `F-001` from the earlier audit
  (`.orch/audits/recording-replay-closure-2026-08-12/report.md`) — that
  ticket `authoring-tracer` (run `level-authoring-tracer-2026-08-12`) was
  suspended because no human terminal recording existed in the isolated
  worktree and no independent replay/semantic verification of one had been
  done.
- **target:** `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo`,
  the same isolated worktree named in both prior documents.
- **method:** every check below was re-derived from scratch — the file was
  re-hashed independently, the candidate identity was recomputed (not just
  string-compared) using the repo's own `identity()` function, and the
  replay script was written fresh against `solver/engine.js`'s exported
  primitives without reading or reusing any script described in
  `finding.md`. Nothing in this document was taken on `finding.md`'s word.

## 1. Does the recording file exist, and does its hash match the claim?

Yes. Confirmed by direct filesystem listing and independent SHA-256:

```
$ shasum -a 256 recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json
ed367f1e504cd241ecf215a4845a16aa1e18ffd773ad5aa0e02087d95bbb34b5  recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json
```

This matches `finding.md`'s claimed hash exactly. The file is untracked
(`git status --short` shows `??`), consistent with `finding.md`'s claim that
it is not yet committed. The worktree's `HEAD` is
`2e26ad26ab725300b6441edaa21864162703fe54`, matching the commit `finding.md`
and the ticket's own verification both cite.

The recordings directory also still contains the original `.gitkeep` from
the `F-001` audit — this is a genuinely new file added alongside it, not a
replacement or edit of prior evidence.

## 2. Does the recording's `candidateIdentity` bind to the real candidate?

Yes, but the binding is a *derived* match, not a literal one, and
`finding.md`'s wording overstates this slightly: `candidate-levels.json`
itself has no `candidateIdentity` field to compare against — it holds the
raw candidate object (grid, moves, target, etc.) plus a
`sourceShapeIdentity`. The identity has to be computed from that object
using the repo's own `identity()` function
(`solver/level-author.js:31`, a SHA-256 of a canonical-JSON encoding).

Recomputing it directly:

```
computed identity(candidate-levels.json's level-51 entry): 524f37c0063d61e5ab4b636b720f3cd644ec83cba62324e48304d5a12bb3dd5c
candidate-levels.receipt.json's candidateIdentity:          524f37c0063d61e5ab4b636b720f3cd644ec83cba62324e48304d5a12bb3dd5c
recording's candidateIdentity:                               524f37c0063d61e5ab4b636b720f3cd644ec83cba62324e48304d5a12bb3dd5c
```

All three agree. This is exactly the same check `solver/authoring-server.js`
performs at startup (`identity(candidate) !== receipt.candidateIdentity`
throws) and on every recording it accepts
(`validateRecording`, `authoring-server.js:37`) — so the recording is bound
to the real, currently-shipped Candidate 51 definition, not some other
shape. I also independently confirmed the recording's filename equals
`recordingIdentity(recording)` (the server's own content-addressed naming
scheme) — i.e., the file wasn't renamed to a mismatched digest.

## 3. Independent from-scratch replay

I wrote a new script (not derived from anything in `finding.md`) using only
`makeRng`, `createLevelState`, `isValidChain`, `canExtendChain`,
`executeChain`, `applyGravity`, `spawnNewTiles`, `tickBlockers`, and
`checkBombs` from `solver/engine.js`. For each of the recording's 24 chains,
in order, it:

1. Resolved each recorded `(x, y, value)` tile against the **live board
   state** (not the recording's own claim) and required an exact value
   match.
2. Checked legality two ways: value-legality via `canExtendChain`/
   `isValidChain` (what `finding.md` describes checking), **and**
   king-move spatial adjacency + no-tile-reuse between consecutive chain
   tiles — this second check matters because neither `canExtendChain` nor
   `isValidChain` on their own verify that chain tiles are actually
   adjacent on the board; `finding.md`'s described procedure only names the
   first check. I added the adjacency check myself as a stronger bar a
   value-only fabrication would not automatically clear.
3. Recomputed each chain's points from the live tile values and compared to
   the recording's claimed `chain.points`, before mutating any state.
4. Executed the move for real (`executeChain` → `applyGravity` →
   `spawnNewTiles` → `tickBlockers` → `checkBombs`), in the same order
   `solver/sweep.js`'s own move loop uses, so the PRNG stream and board
   evolve exactly as a real playthrough would.

Result:

```
replayed score: 59584   claimed score: 59584   match: true
replayed moves: 24      claimed movesUsed: 24   match: true
replayed outcome: lose out of moves   claimed outcome: lose out of moves
outcome match: true
Problems found: 0
```

**Yes — my independently-written replay reproduces the recording's claimed
score, move count, and outcome exactly: score 59584, 24 moves, lose /
"out of moves".** All 24 chains matched real board values at every step and
were legal both by value rule and by spatial adjacency.

I also checked that the outcome follows from the game's own rules rather
than being an arbitrary label: `movesUsed (24) === candidate.moves (24)`
and `score (59584) < candidate.target (124000)`, so `lose` / `out of moves`
is the only outcome the engine's terminal-state logic
(mirrored in `solver/sweep.js:34-42`) could produce here. Nothing about the
outcome is inconsistent with a genuine terminal state.

As a sanity check on `engine.js` itself being a faithful mirror of the real
client (not a stale or diverged copy), I confirmed `chainMultiplier` in
`solver/engine.js` is byte-identical in behavior to `Game.getChainMultiplier`
in `src/game.js` (both: length≥9→5, ≥7→3, ≥5→2, ≥3→1.5, else 1). Combined
with `executeChain`'s call to `authoringCapture.recordChain(this.chain,
points)` at `src/game.js:492` using the same `points` value passed to
scoring, this confirms the recorded schema is what the real client would
actually emit, not an engine-only construct.

## 4. Could this recording exist without a genuine human playthrough?

I looked specifically for this, beyond what `finding.md` covered.

**Not a test artifact.** I read both `solver/tests/customLevel.test.js` and
`solver/tests/authoringServer.test.js`:
- `customLevel.test.js` only exercises `AuthoringCapture` in memory (a
  `submit` callback capturing into a JS array); it never touches disk.
- `authoringServer.test.js` always starts the server with
  `recordingsDir: fs.mkdtempSync(path.join(os.tmpdir(), '2248-recordings-'))`
  — a fresh OS temp directory, never the repo's real `recordings/`
  directory. A grep across the whole repo for `recordingsDir`/`recordings/`
  usage confirms only `solver/authoring-server.js` (the real server, whose
  *default* recordings dir is the real `recordings/` when run without an
  override) and this test file reference it at all, and `package.json` has
  no scripts that could invoke either path automatically.

  So there is no plausible way for the checked-in test suite to have
  deposited this file in the real directory as a side effect.

**Not the bundled bot's self-play output.** I ran the shipped solver bot
(`solver/bot.js`'s `chooseMove`, the same heuristic
`solver/sweep.js` uses) against the identical seed and candidate, replaying
move-by-move exactly as sweep.js's loop does. The bot **wins in 17 moves at
score 152512** — a completely different trajectory (different chains at
every one of the first 15 moves I compared) from the recording's 24-move,
59584-point loss. So this file is not simply the shipped bot's deterministic
output saved into the recordings folder.

**What I cannot rule out:** the file's content is engine-legal and
board-accurate, which rules out hand-typing a plausible-looking fake (with
35 randomly-seeded tiles evolving through 24 sequential merge/gravity/spawn
cycles, guessing correct values and adjacency at every step without
actually running the real rules forward is not practically feasible). But
`solver/authoring-server.js`'s `validateRecording` (the endpoint that writes
into the real `recordings/` directory) only checks *schema* legality
(types, ranges, `candidateIdentity`/`candidateLevel` match, chain length
bounds) — it does **not** check game legality (board-value matching,
adjacency) itself. That means the file could in principle have been
produced by some other program that itself drove `solver/engine.js` (or an
equivalent correct reimplementation) forward for 24 real moves and then
POSTed or wrote the resulting JSON directly — i.e., a genuine engine-legal
*simulated* playthrough that never touched a browser or a human. I found no
such script checked into the repo (only the real client's `fetch('/api/
recordings', …)` at `src/game.js:783` and the two test files above
reference the recording endpoint at all), and no server logs, browser
history, or worklog entry corroborating an actual browser session on
2026-08-13 — `worklog.md`'s Iteration 4 (the suspension) is the last entry
and records nothing after it. `finding.md` itself already flags this same
gap in its "does not establish" section; my check does not close it, only
narrows it (rules out the checked-in tests and the shipped bot specifically
as the source).

## Verdict

- **Independently-reproduced replay matches the recording's claimed
  score/moves/outcome: yes.** Score 59584, moves 24, outcome
  lose/"out of moves" — exact match, zero discrepancies, checked against
  live board state and adjacency, not just internal self-consistency.
- **Plausible innocent (non-malicious, non-human) explanation for the
  file's existence:** partially ruled out, not eliminated. It is
  definitively **not** an artifact of the checked-in test suite (neither
  test can write there) and **not** the shipped bot's self-play output
  (different trajectory entirely). What remains open is whether it came
  from the real browser client's `AuthoringCapture` → `/api/recordings`
  save path (the intended human-playtest path) versus some other,
  not-checked-in program that also drove the real engine rules forward
  move-by-move and saved a legally valid result. Both would pass every
  check available from the file and the code alone.
- **Overall:** this recording satisfies the *mechanical* half of AC-4's
  outstanding requirement — a real, non-placeholder recording exists in the
  worktree, is bound to the correct candidate, and independently replays to
  its exact claimed score, move count, and outcome against the live engine.
  That is strictly more than existed at the time of `F-001` (which was only
  a `.gitkeep`). **It does not, by itself, establish that a human played
  it**, which is what AC-4 appears to actually require ("human terminal
  recording"). My recommendation: this is enough to correct the *replay/
  semantic-verification* half of `F-001`'s gap, but not enough on its own
  to lift the suspension outright, because the human-provenance question is
  still open and is exactly the kind of gap `F-001` was written to catch.
  What would close it: something outside the recording file itself —
  e.g., the owner (Evan) confirming they personally played this session on
  2026-08-13, a terminal/shell history entry showing the browser session
  and server process running at that time, or (more durably) a code change
  that has the server log enough request metadata (timestamp, a per-session
  token minted when `/index.html` is served) to distinguish a real browser
  session from a direct POST to `/api/recordings` — the latter is cheap to
  build going forward but wasn't in place for this file, so it can only be
  corroborated out-of-band, not re-derived from the artifact alone.

## What remains unresolved

- Human provenance of the recording (browser session vs. some other
  engine-driving program) is not decidable from the file, the code, or the
  worklog alone.
- No server access logs or browser history were found in the repo to
  corroborate a session at the 2026-08-13 09:47 mtime.
