# Check cards

One card per check. This file is not documentation — it is a **probe list** for
the next adversarial audit. The load-bearing line in every card is
**Does NOT catch**.

Cards are written when a check is created or modified, per the `gate-check`
skill. A stale card is worse than no card: if you change a check, update its
card in the same commit.

---

### receipt-verifies-against-current-code · HARD

- **Protects:** the project's dominant repeated failure — citing a measurement
  whose basis has drifted. `verifyCandidate` could always detect a receipt
  measured against a `bot.js` that has since changed; nothing ever ran it over
  the receipts on disk, so four of five shipped receipts went stale undetected
  and a session's conclusions were built on them.
- **Where:** `solver/tests/receiptGate.test.js`, calling `verifyCandidate` from
  `solver/level-author.js:252` with no options overrides.
- **Level:** record (one candidate store paired with its receipt) — probe: the
  receipt carries 9 top-level claims and the check emits **one** verdict for all
  of them, so you learn *this receipt is stale*, never *which claim moved*.
  Above the record level, the corpus boundary is the gap: moving a store into
  `solver/candidates-archive/` removes it from the walk entirely.
- **Kind:** meaning; `level-author.js:296-307` re-runs the full 450-seed replay
  (150 fitting + 300 holdout) and compares measured results to recorded ones, so
  the claims are checked *true of the current code*, not merely well-formed.
  Shape is checked at lines 254-257, value at 260-264 and 291. Unchecked:
  whether the level is any **good** — difficulty feel, curve fit, fun. Owned by
  human playtest: 8 recordings on disk, all one player.
- **Scope:** `solver/candidate-levels*.json` paired to
  `solver/candidate-levels*.receipt.json`, top level of `solver/` only — **3
  stores**, pinned by `solver/candidate-corpus.json`. Store-driven, not
  receipt-driven, so a deleted receipt fails rather than shrinking the corpus.
  Excludes 14 identically-named files elsewhere:
  `solver/candidates-archive/` (4) and
  `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo/solver/` (10).
  `.json` only; `schemaVersion: 1` only; stores of exactly one candidate
  (`level-author.js:253`).
- **Reads own output?:** yes — receipts are produced by `level-author.js` and
  re-verified using `level-author.js`. Safe because verification **recomputes
  from source** rather than comparing a record to a copy of itself. Proven, not
  assumed: appending one comment line to `solver/bot.js` flipped a passing
  receipt to `code/input identity mismatch`, and restoring the file made it
  clean again. Reads no git porcelain, so the `core.quotePath` trap is n/a.
- **Sampling memory:** n/a — exhaustive over the glob, not a sampler. Silence
  about the 2 archived candidates means "deliberately excluded", never "audited
  clean". `STORE_FLOOR` is what stops an accidentally-empty glob reading green.
- **Does NOT catch:**
  1. **One habitual red can camouflage a second.** Level 52 fails on every run
     by decision, so this suite's normal state is red. A new regression arrives as
     a second named failure beside a familiar one, and familiar red gets read as
     "still the old thing". The failure text names itself as known and decided, so
     an unfamiliar failure reads differently — but that only helps someone who
     looks. This is the accepted cost of not manufacturing green.
  1b. **The exemption informs, it does not excuse.** It was briefly wired to let
     exempt stores pass with a diagnostic — the third time in one day this suite
     was made green by changing what it looked at rather than what was wrong
     (archiving the stores, then exempting them). Reverted the same day. The
     computation stays, and only shapes the failure message. If a future change
     lets `exempt` bypass an assertion again, this gate has stopped working.
  1c. **The exemption's two lookups are shallow.** `shippedLevels()` regex-parses
     `{ level: N,` out of `src/game.js`; a format change silently shrinks the set,
     which fails *closed* (more failures, not fewer) but silently.
     `winningRecordingIdentities()` trusts the `outcome` field without replaying
     the recording, and one win from one player is the whole evidence base.
  2. **A receipt that was wrong when it was written.** A bad measurement recorded
     faithfully verifies forever. This proves consistency between receipt and
     code, never correctness of the measurement.
  3. **A bot and receipt regenerated together from a broken bot.** Both sides
     move, the hashes agree, the gate is silent.
  4. **Drift in an input that is not hashed at all.** This check trusts
     `inputIdentities` to name every file that matters; it never audits that
     list. Completeness of the list is guarded separately by
     `input-closure-is-complete` below — and that check has its own blind spots
     (computed requires, config files, env vars), each of which lands here as an
     undetectable drift.
  5. **Archiving to go green — now signed, not blocked.** Moving a failing
     store out of `solver/` silences it. This happened on 2026-08-21 to levels 52
     and 54 and was reversed the same day. `candidate-corpus.json` plus
     `corpus-matches-manifest` now makes the removal fail until the manifest is
     edited in the same commit — a paper trail, not a lock. Anyone willing to
     edit the manifest can still retire an inconvenient failure; the difference
     is that it is now a visible, reviewable act instead of a `git mv`. Nothing
     enforces the "archived numbers are not quotable" rule either.
  6. **Level quality, difficulty feel, and single-player bias.** Untouched.
  7. **Non-determinism in the bot**, if ever introduced — the replay would flap
     intermittently rather than fail cleanly.
- **Crafted-bypass test:** `solver/tests/receiptGate.test.js` — four cases, each
  run and confirmed to fail with the *expected* fault rather than merely to
  fail. `a receipt whose code has drifted is refused, not verified`;
  `a tampered receipt is refused rather than verified` (win count +1 →
  `receipt identity mismatch`); `a candidate store with no receipt is a failure,
  not an absence`; `an empty corpus fails the floor instead of reading as clean`.
  **A first attempt at the drift control was a false positive**: zeroing the bot
  hash *inside the receipt* faults at `receipt identity mismatch` before the
  drift comparison ever runs, so it tested the harness rather than the check.
  Drift means the receipt is internally consistent and the code moved, so the
  control has to move the code side. The on-disk version was run by hand and
  confirmed; the landed test uses the `options.inputIdentities` seam to reach the
  same comparison without a test mutating `solver/bot.js`. A forged receipt with
  a *recomputed* signature is caught upstream by `assertTerminalTotals`
  (`terminal total must equal 300`), observed directly.
- **Retires:** NO. Argued past the default: this is a **widening** of the
  `verifyCandidate` cases in `solver/tests/levelAuthor.test.js:97-165`, which
  drive synthetic in-memory candidates with a stubbed `play` and stubbed
  identities and therefore by construction never read a shipped file. Widening
  them to the real corpus *is* this check. Nothing else could be widened: the
  other call sites (`author-level.js:35`, `generate-levels.js:275`) run at
  creation time, when the receipt has just been measured and passes by
  construction, so they can never detect drift.
- **Enforcement:** **HARD** (blocking) for every stale receipt, exempt or not.
  **Currently red on 1 of 3** — level 52 — and that is the intended resting
  state, not a defect to clear. Its failure text says so in the message, so the
  next reader does not mistake a settled decision for an unfixed bug.
  The exemption is **computed** each run from `src/game.js` and `recordings/`,
  requires BOTH halves (the level ships, AND a recording binds to the exact
  `candidateIdentity` with `outcome: "win"`), and a receipt declaring its own
  exemption gets nothing. It changes only what the failure *says*.
  **Demotion condition:** none. Do not archive, re-author, or exempt to clear a
  red here. All three were tried on 2026-08-21 and all three were reversed. Shipped report-only on 2026-08-21, promoted the same day. The
  promotion was first made to look clean by archiving the two failing stores;
  that was reversed within the hour because clearing a red gate by removing its
  input is precisely the failure this gate exists to catch, and the resulting
  green reported a number whose basis had moved — this project's signature
  pathology, reproduced inside the tool built to cure it.
  **The two reds are not the same problem**, and an earlier version of this card
  wrongly treated them as one by asserting both levels ship. `src/game.js` holds
  levels **1..52 only**, verified by parse:
  - **Level 52 ships, and its target stays at 102000. DECIDED 2026-08-21 by the
    owner; do not undo this to clear the red.** Refreshing its receipt
    necessarily *raises* that target, because the receipt derives target as
    `median x demand` and asserts the recorded median matches a fresh
    measurement. Measured, not projected (ticket T-003): the target would move
    to 107000, **+4.9% harder for every player** — while the bot's holdout win
    rate on this level moved 290/300 to 291/300, one seed in three hundred. The
    level did not get easier; only the bot's median score rose. Re-targeting
    would degrade a shipped level on a metric that is not measuring its
    difficulty. **The red on level 52 is therefore permanent and correct** until
    the integrity/currency split ships
    (`.orch/runs/receipt-currency-split-2026-08-21/spec.md`).
  - **Level 54 was unshipped, and its red is cleared.** Re-measured against the
    current bot on 2026-08-21 (ticket T-002): target 150000 -> 160000, holdout
    259/300. No player had seen it, so nothing was degraded. It is measured but
    **not human-validated** and should not ship on this receipt alone.
  **Demotion condition:** none. Do not return this to report-only, and do not
  archive to clear it.
- **Decay:** re-runs on every `node --test solver/tests/*.test.js`. Debt trends
  as failing per-store tests (**1 of 3**: level 52, by decision). A count rising
  above 1 means new debt; the level 52 failure itself is expected and stable. Measured cost: suite
  went 1.3s → ~10.5s, the delta being one real 450-seed replay at ~8.9s; each
  additional *passing* live candidate adds ~9s, while a stale one short-circuits
  at ~3ms. Recalibration trigger: past roughly five passing live stores (~45s) the suite gets slow enough that people skip it, at which point
  split into a fast identity-only tier via a new `verifyCandidate` option — a
  change that comes back through `gate-check`, because an identity-only tier
  silently drops blind spots (2) and (3).
- **Shipped:** 2026-08-21 · closes the drift class behind the retracted
  win-condition thesis, the batch candidates invalidated mid-run, and the
  measurement variance misattributed to level design.

---

### input-closure-is-complete · HARD

- **Protects:** the drift check's own coverage. `defaultInputIdentities()` hashes
  exactly three files; if a new local require lands in the measurement path
  without being added to that set, the receipt check keeps passing while the
  code underneath it changes. This is a check that guards another check — it
  fails in precisely the case where the other one wrongly passes.
- **Where:** `solver/tests/receiptGate.test.js`, test `every file the
  measurement depends on is one of the hashed inputs`; walk implemented in
  `requireClosure()` over `localRequires()`.
- **Level:** file — nodes in the require graph. Probe: a require introduced
  inside a conditional or resolved lazily at call time is still literal text in
  the file, so it *is* caught; what slips through is any require whose path is
  not a string literal.
- **Kind:** value — set equality between the closure reachable from
  `level-author.js` and the hashed set. It does **not** check that the recorded
  hashes are correct or current; that belongs to
  `receipt-verifies-against-current-code`.
- **Scope:** static regex over `require('./x')` and `require("./x")` in
  `solver/level-author.js` and everything transitively reached — today `bot.js`
  and `engine.js`, three files total. Excludes: `node:` builtins, bare package
  specifiers, `node_modules`, absolute paths, parent-directory requires
  (`../`), and anything outside the walk root. Also asserts
  `Object.keys(defaultInputIdentities())` still matches `HASHED_FILES`, so
  silently dropping a hashed input fails rather than shrinking coverage.
- **Reads own output?:** no — reads source text from disk directly. Nothing it
  reads is produced by the thing it checks.
- **Sampling memory:** n/a — exhaustive over the reachable graph. Its silence
  means "no unhashed edge reachable from level-author.js", not "never looked".
- **Does NOT catch:**
  1. **Computed or templated requires** — `require(someVar)` and backtick
     requires are invisible to the regex. Confirmed by a live test rather than
     assumed. A dependency introduced either way leaves the drift check
     silently incomplete.
  2. **Non-require inputs entirely** — a JSON config, an env var, or a data file
     read at run time. The graph only knows `require`.
  3. **Requires outside the walk root** — `require('../x')` resolves outside
     `solver/` and is filtered by the `./` prefix.
  4. **Whether the hashes are right.** It checks the file *list* is complete,
     never that the recorded digests match anything.
  5. **A hashed file that is no longer reachable** (over-hashing). Harmless for
     drift detection, but it would go unreported.
  6. **Runtime behavior of a hashed file** — `engine.js` reading a fixture at
     run time changes results with the file hash unchanged.
- **Crafted-bypass test:** `solver/tests/receiptGate.test.js` — `a new unhashed
  require in the measurement path is detected` (staged fixture adds
  `require('./heuristics')`; confirmed reported as the single unhashed edge) and
  `the closure detector does not see computed or templated requires`, which pins
  blind spot 1 so that if the detector ever changes, this card is flagged stale
  rather than quietly wrong.
- **Retires:** NO. Nothing existed to widen — before this, the completeness of
  the hashed input set was assumed and asserted nowhere in the repo. It is not a
  duplicate of the receipt check: that check passes, wrongly, in exactly the
  case this one fails.
- **Enforcement:** HARD from ship. Unlike the receipt walk it lands **green** —
  the closure is complete today (`level-author.js` reaches only `bot.js` and
  `engine.js`, all three hashed), so there is no pre-existing debt requiring a
  report-only stage. No promotion condition: it is already at its final rung.
- **Decay:** re-runs on every `node --test solver/tests/*.test.js`; cost ~1ms,
  so it carries no runtime pressure. Recalibration trigger: the first legitimate
  `require('../x')` or config file entering the measurement path turns blind
  spots 2 and 3 from theoretical into live, at which point the hashed set must
  grow to cover them and this card is rewritten — not waived.
- **Shipped:** 2026-08-21 · same commit as the receipt check it guards.

---

### corpus-matches-manifest · HARD

- **Protects:** the receipt gate's own scope. Without it, every failure that gate
  reports can be cleared by deleting the input, and the suite goes green having
  said nothing. Not hypothetical — it happened on 2026-08-21, when levels 52 and
  54 were archived to clear a red gate and the suite reported 154/154. The
  resulting "improvement" was a number whose basis had moved, which is this
  project's signature failure reproduced inside the tool built to cure it.
- **Where:** `solver/tests/receiptGate.test.js`, test `the live corpus matches
  the committed manifest exactly`; manifest at `solver/candidate-corpus.json`.
- **Level:** file — store filenames as set members. Probe: it compares **names,
  not contents**, so a store renamed and re-added with different contents passes
  here. Content integrity is the receipt check's job.
- **Kind:** value — set equality between the live glob and the declared list. Not
  meaning: it never asks whether a declared store is any good, or whether its
  receipt verifies. It is green today while two of the three stores are red.
- **Scope:** `solver/candidate-levels*.json` (excluding `*.receipt.json`) against
  the `stores` array of `solver/candidate-corpus.json` — 3 entries. Excludes
  `solver/candidates-archive/` and all `.orch/` copies. **Deliberately records
  membership only, never pass/fail status:** a manifest able to mark a store
  "known stale" would be a quarantine list, and would excuse precisely what it
  exists to surface.
- **Reads own output?:** no. It reads the directory and a hand-maintained file.
  The manifest is written by a person and never generated from the directory it
  checks — generating it would make it agree with reality by construction and
  check nothing.
- **Sampling memory:** n/a — exhaustive set comparison in both directions.
- **Does NOT catch:**
  1. **A manifest edit made in bad faith.** Deleting a store *and* its manifest
     line in one commit passes clean. This is a signature requirement, not a
     lock: the protection is that the removal becomes a visible, reviewable edit
     rather than a `git mv` nobody sees. Anyone willing to sign can still retire
     an inconvenient failure.
  2. **Content changes.** Names only. A store whose contents were swapped for
     different ones passes here; the receipt check is what catches that.
  3. **Whether anything actually verifies.** This check is green while levels 52
     and 54 fail. It guards scope, not truth.
  4. **Candidates authored outside `solver/` top level.** Invisible to both the
     glob and the manifest — neither would report a store in a subdirectory.
  5. **A manifest that was wrong when written.** It was hand-written on
     2026-08-21 from the then-current directory. Had a store been missing at that
     moment, the manifest would have canonised its absence.
  6. **The "archived numbers are not quotable" rule**, which lives in prose in
     `solver/candidates-archive/README.md` and is enforced by nothing.
- **Crafted-bypass test:** `solver/tests/receiptGate.test.js` — `a store
  vanishing from the corpus is detected, not silently tolerated`: a declared
  store missing from the live set is reported; an undeclared live store is
  reported; identical sets report clean. Run and confirmed, all three.
- **Retires:** partially subsumes `STORE_FLOOR` (the `the shipped candidate
  corpus is not empty` test). The floor only ever caught a corpus of zero; the
  manifest catches any deviation, zero included. The floor is **kept** for one
  specific case it still owns alone: the manifest and the corpus being emptied in
  the *same* commit, where set comparison finds no drift and only an absolute
  floor fires. That is the whole of its remaining job, and it should be deleted
  if that case is ever covered elsewhere.
- **Enforcement:** HARD from ship, **green today**. No promotion condition — it
  is already at its final rung. Do not weaken it to accommodate a corpus change;
  edit the manifest, which is the point.
- **Decay:** re-runs on every `node --test solver/tests/*.test.js`; cost ~1ms.
  Recalibration trigger: the first candidate authored outside `solver/` top level
  turns blind spot 4 from theoretical into live, and both the glob and the
  manifest need rebasing on the real layout.
- **Shipped:** 2026-08-21 · closes the corpus-shrink pathology observed the same
  day, in the same session that created it.

---

### authoring-refuses-silent-overwrite · HARD

- **Protects:** candidate stores from being destroyed by an authoring run.
  `author-level.js --shape X --write` used to write the hardcoded
  `candidate-levels.*` pair unconditionally. That destroyed level 51's candidate
  store — it ships in `src/game.js`, three recordings still bind to identity
  `524f37c0063d61e5`, and no receipt carries that identity any more. The same
  command was run three times in one session against the only passing receipt,
  each time guarded by nothing but a manual backup.
- **Where:** `solver/author-level.js` — `assertWritable()`, called from `main()`
  before `deriveCandidate()` runs.
- **Level:** file — the two output paths, checked as a pair. Probe: it checks
  *existence*, not contents, so it cannot tell a precious store from a scratch
  one. Every existing file is equally protected and equally unblockable by
  `--force`.
- **Kind:** shape — "does this path already hold a file". It makes no judgment
  about whether overwriting would lose anything valuable; that judgment stays
  with the person typing `--force`.
- **Scope:** `solver/<basename>.json` and `solver/<basename>.receipt.json`, where
  basename defaults to `candidate-levels` and `--out` may replace it. `--out`
  rejects path separators, absolute paths, `..`, and a `.json` suffix, so
  authoring cannot write outside `solver/`. Covers only the `--write` path;
  `--verify` writes nothing.
- **Reads own output?:** no — `fs.existsSync` on the filesystem it is about to
  write.
- **Sampling memory:** n/a — both paths checked every run.
- **Does NOT catch:**
  1. **`--force`.** The escape hatch is one flag and unaudited. Anyone who hits
     the refusal and reflexively adds `--force` gets the old behavior exactly,
     including the old loss.
  2. **Overwrites by any other route.** `generate-levels.js`, the authoring
     server, a stray `mv`, or an editor all still write these paths freely. This
     guard covers one CLI entry point, not the files.
  3. **A store already lost.** It prevents the next loss, recovers nothing.
     Level 51 stays gone.
  4. **Whether the thing being overwritten mattered.** Existence only — a
     scratch file and the champion receipt are indistinguishable to it.
  5. **Partial writes.** Both paths are checked before authoring, but the two
     `writeFileSync` calls are not atomic; a crash between them leaves a store
     without its receipt. The receipt gate's pairing check is what catches that
     afterwards.
- **Crafted-bypass test:** `solver/tests/authorLevelCli.test.js` — 10 cases.
  The load-bearing one is `writing over an existing candidate is refused, and
  the refusal says how to proceed`, run against the real live store rather than a
  fixture, asserting the message names the file and both exits. Also verified by
  hand: the destructive command from `HANDOFF.md:425` was run verbatim and
  refused, with the champion confirmed untouched.
  `a free store but an occupied receipt is still refused` pins the pair check —
  guarding only the store would half-clobber.
- **Retires:** NO. Nothing existed to widen; there was no check on this path at
  all. It is not covered by the receipt gate, which reports damage after the
  fact and cannot prevent it.
- **Enforcement:** HARD from ship, green today. **This changes default CLI
  behavior**: the historical 3-argument form now refuses instead of overwriting.
  Verified safe because nothing imports or invokes it — `grep -rln author-level
  solver/tests/` returns nothing, and only prose referenced it.
- **Decay:** exercised on every `node --test solver/tests/*.test.js`; cost ~5ms.
  Recalibration trigger: if `--force` starts appearing in scripts or docs as
  routine, blind spot 1 has become the normal path and the guard is decorative.
- **Shipped:** 2026-08-21 · closes the friction logged three times in run
  `curve-debt-2026-08-21`.

---

### recordings-replay-to-their-claims · HARD

- **Protects:** the evidence that licenses real decisions. Level 52 keeps its
  target because a human won it; level 53 is a shipping candidate on a recorded
  win. Nothing had ever checked that a recording's moves actually produce its
  claimed score — `authoring-server.js:34` validates a recording's *shape* when
  it arrives (schema, identity binding, integer bounds) and never replays it. So
  "a human beat this level" was an unverified claim underneath two decisions.
- **Where:** `solver/tests/recordingReplay.test.js` — `replay()` re-executes the
  game move by move through `solver/engine.js`; `chainLegality()` enforces the
  engine's own rules on every chain.
- **Level:** record — one recording, replayed move by move. Probe: within a
  recording every move is checked, but the *set* of recordings is not. Nothing
  pins how many should exist, so deleting a recording silently deletes its check.
- **Kind:** meaning — it re-runs the game and compares outcomes, not field
  shapes. Every recorded coordinate must hold the recorded value, every chain
  must be legal (8-way adjacency, no revisits, the value progression
  `canExtendChain` allows, the level's `minChain`), every chain must score what
  it claims, and the final score, move count, and win/lose must reproduce.
  Unchecked: whether the playthrough was skillful, representative, or human.
- **Scope:** `recordings/*.json`, resolved to candidates by `candidateIdentity`
  across `solver/` and `solver/candidates-archive/`. At ship: 3 replayable, 5
  orphans. Excludes `.orch/runs/*/workspace/repo/recordings/`. Read at run time,
  so a playthrough recorded minutes ago is checked without editing this file.
- **Reads own output?:** no, and this is the check's quiet strength. The
  recording is produced by the **browser** running `src/game.js`; the replay runs
  `solver/engine.js`, a separate implementation that mirrors it (its comments
  cite the game.js line numbers it mirrors). A recording replaying exactly is
  therefore a cross-check between two independent implementations of the rules.
  If they ever drift apart, this fails.
- **Sampling memory:** n/a — exhaustive. Orphans are printed by name and by the
  identity they want, so silence about them would mean "never looked".
- **Does NOT catch:**
  1. **Orphans — 5 of 8 recordings cannot be verified at all.** Their candidate
     store no longer exists, so the board is gone and no replay is possible. This
     check reports them; it cannot check them. Includes all three level 51
     recordings and the project's only recorded *loss*.
  2. **Who played, or when.** Recordings carry no author and no timestamp. A
     clean replay proves a valid playthrough happened, never that a human did it
     or which human. Every "human-validated" claim in this repo rests on the fact
     that only the browser writes recordings and only one person plays.
  3. **A rule bug present identically in both implementations.** The cross-check
     in *Reads own output?* only catches divergence, not shared error.
  4. **Whether a playthrough is representative.** One win on one seed says
     nothing about the difficulty distribution. Level 53 was cleared by 0.1%.
  5. **A recording deleted outright.** No manifest pins the expected set, unlike
     `candidate-corpus.json` for stores. Removing a file removes its check.
  6. **A recording POSTed directly to the server** rather than played. The
     endpoint has no authentication; a forged-but-legal playthrough would pass.
- **Crafted-bypass test:** same file — a bumped final score, an altered chain
  coordinate, a truncated run still claiming a win, an unresolvable identity, and
  a freshly staged recording. **The altered-coordinate case initially failed**,
  and that failure was the point: the first version checked only that recorded
  tiles held recorded values, so a chain rewritten to a *different tile of the
  same value* replayed clean — and on a board full of 64s that is most of them.
  `chainLegality()` exists because a control caught its absence.
- **Retires:** NO. Nothing existed to widen. `validateRecording` could not be
  extended to cover this: it runs once, at POST time, and cannot detect a
  recording that was valid when accepted but whose candidate later changed or
  vanished.
- **Enforcement:** HARD from ship, green today. The orphan count is a **ratchet**
  at 5 — it may fall, never rise. A new orphan means a candidate store was
  destroyed while a recording still referenced it.
- **Decay:** runs on every `node --test solver/tests/*.test.js`; ~5ms, no replay
  search involved. Recalibration trigger: **if anyone raises `ORPHAN_CEILING`
  instead of recovering the store, this check has been defeated** — that is the
  same move as archiving a failing receipt, and it should be treated the same way.
- **Shipped:** 2026-08-21 · ticket `.orch/tickets/curve-debt-2026-08-21/T-005.md`.
