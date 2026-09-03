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
  Excludes 18 identically-named files elsewhere:
  `solver/candidates-archive/` (8, up from 4 when this card was written: two
  overwritten stores were recovered from git on 2026-08-21 and archived with
  their receipts) and
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
  about the 4 archived candidates means "deliberately excluded", never "audited
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
  across `solver/` and `solver/candidates-archive/` — both the
  `candidate-levels*.json` stores and the `results` entries inside
  `generated-batch*.json`. **10 of 10 replayable, 0 orphans** (2026-08-21). At
  ship this line read "3 replayable, 5 orphans"; that was a blind spot in the
  index plus two overwritten stores, not five lost boards — see blind spot 1.
  Excludes `.orch/runs/*/workspace/repo/recordings/`. Read at run time,
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
  1. **An orphan report does not tell you the board is lost.** All the check
     knows is that a recording's identity is missing from *its index*. Destroyed,
     sitting in git history, or sitting in a file the index does not read — it
     cannot tell those apart, and it prints "exists nowhere on disk" for all
     three. **This card asserted the strong reading, and I was wrong to.** It
     said 5 of 8 recordings were beyond checking because their boards were gone.
     That claim was false the day I wrote it; nothing about the situation
     changed underneath it. Every one of the five was recoverable, and all five
     were recovered on 2026-08-21: level 51's store came back from
     `git show 1468392^:solver/candidate-levels.json` and level 54's from
     `git show 0965038^:solver/candidate-levels-54.json` (both now in
     `solver/candidates-archive/`, with their receipts), and the fifth was never
     lost at all — it sits in `solver/generated-batch-02.json` at HEAD as
     `gen-0017`, invisible only because the index read `candidate-levels*.json`
     and nothing else. The count is now 10 replayable, 0 orphans. **The blind
     spot that produced the false claim is untouched:** nothing makes this check
     look in git history, or in an unindexed file, before it reports a board as
     gone — and nothing stops the next person believing the message the way I
     did.
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
  7. **A recording bound to a candidate nobody ever chose.** Widening the index
     to read `generated-batch*.json` took it from 5 resolvable identities to
     **84** — every candidate any generation run ever produced, including the 16
     whose own `verdict.pass` is `false`. Before, an identity outside the curated
     stores was flagged for a human to look at; now it resolves silently and
     replays green. A clean replay proves the moves are legal against *some*
     board that once existed, never that the board was a level anyone shipped or
     intended to. This is the price of freeing `44d3802d…`, whose board genuinely
     was inside a batch file — a trade, not a free win, and the weakest point of
     the 2026-08-21 recovery.
  8. **A `generated-batch*.json` file deleted or rewritten.** Those four files
     are now load-bearing for replay and nothing on disk says so. Removing
     `generated-batch-02.json` re-orphans `44d3802d…` and, with the ceiling at 0,
     turns the suite red — which is the good outcome only if the red is read as a
     lost board rather than as noise from deleted scratch output. Unlike the
     store corpus, which `solver/candidate-corpus.json` pins and which requires
     an edit to that manifest to shrink, no manifest and no signature stands
     between a person and deleting a batch file, and `solver/README.md` does not
     mention that anything references them.
- **Crafted-bypass test:** same file — a bumped final score, an altered chain
  coordinate, a truncated run still claiming a win, an unresolvable identity, a
  freshly staged recording, a candidate held only inside a batch file, and a
  chain that revisits a tile. **The altered-coordinate case initially failed**,
  and that failure was the point: the first version checked only that recorded
  tiles held recorded values, so a chain rewritten to a *different tile of the
  same value* replayed clean — and on a board full of 64s that is most of them.
  That is why `chainLegality()` was written.
  **It is not what kept `chainLegality()` honest, and this card claimed it was.**
  Measured by mutation on 2026-08-21 — delete the `chainLegality()` loop from
  `replay()` and 20 of 21 tests stay green, the altered-coordinate case among
  them. That case is refused by the tile-value check; it never reached the
  legality branch. So from the day this check shipped until that measurement,
  chain legality was enforced by code that no test held in place. The single test
  that dies under the mutation is `a chain that revisits a tile is refused as
  illegal, not merely as mis-scored`, added 2026-08-21: it appends a repeat of a
  chain's first tile, changing no coordinate and no value, so nothing but the
  legality rules can object to it.
- **Retires:** NO. Nothing existed to widen. `validateRecording` could not be
  extended to cover this: it runs once, at POST time, and cannot detect a
  recording that was valid when accepted but whose candidate later changed or
  vanished.
- **Enforcement:** HARD from ship, green today. The orphan count is a **ratchet**,
  lowered 5 → **0** on 2026-08-21 once every recording resolved — it may fall,
  never rise. A new orphan now means a candidate store was destroyed, or an
  identity was written into a recording that nothing on disk defines. At 0 the
  ratchet fires on the next authoring overwrite, which is the point and will be
  inconvenient: the response is a `git show` into `solver/candidates-archive/`,
  not a raised ceiling.
- **Decay:** runs on every `node --test solver/tests/*.test.js`; ~5ms, no replay
  search involved. Recalibration trigger: **if anyone raises `ORPHAN_CEILING`
  instead of recovering the store, this check has been defeated** — that is the
  same move as archiving a failing receipt, and it should be treated the same way.
- **Shipped:** 2026-08-21 · ticket `.orch/tickets/curve-debt-2026-08-21/T-005.md`.
- **Corrected:** 2026-08-21 · ticket
  `.orch/tickets/ranked-items-2026-08-21/T-008.md`, after
  `.orch/tickets/ranked-items-2026-08-21/T-007.md` recovered all five orphans and
  `.orch/audits/orphaned-recordings-2026-08-21/findings.md` established they were
  never lost. Three claims on this card were false as written, not overtaken by
  events: that the five orphans could not be checked, the archived-store counts
  in the first card, and the credit for chain legality. Commit `91321e4` carries
  the first of them in its body; it is history and stays as written.

---

### engine-mirrors-game · HARD

- **Protects:** the eight "Mirrors game.js" comments in `solver/engine.js`. Until
  2026-09-01 they were claims nothing enforced, and they had drifted: the
  engine has no end-of-level logic, and its comment that a bomb can only be
  removed by ending a chain on it was false (a bomb in any non-final position
  is deleted with the rest of the chain). Every solver number rests on the
  engine playing the same game the browser plays.
- **Where:** `solver/tests/mirrors-game.test.js`, driving `solver/engine.js` and
  `src/game.js` with identical inputs and comparing outputs: RNG sequence,
  opening board, chain extension and validity, blocked tiles, multiplier tiers,
  merge scoring and board mutation, bomb final/non-final handling, gravity
  across stones/ice/bombs, spawn values/positions/draw count, blocker ticking,
  and `checkBombs` in both directions.
- **Level:** one engine function against its `Game` counterpart on fixed
  boards. Whole-game equivalence over many moves is not asserted.
- **Kind:** value. It checks that both sides produce the same state and score;
  it does not check that either side is the intended game.
- **Scope:** the eleven compared behaviours above. The test's last case is a
  guard on its own honesty: it names what is game-only (`checkWinLose`,
  `hasValidMoves`, `undo`, `saveState`) and what the engine has that is NOT
  compared (`findTopChains`, `findBestChain`, `findGreedyChains`,
  `buildGreedyChain`), and fails if either list goes stale.
- **Reads own output?:** no. Both sides are production code; neither is a
  fixture written by the test.
- **Sampling memory:** fixed hand-built boards and lengths 0-30; silence about
  a board shape means it was never compared.
- **Does NOT catch:**
  1. A divergence in the four uncompared chain-search functions, which is
     where `solver/bot.js` spends its time.
  2. End-of-level, undo, and save behaviour: the engine has none, so nothing
     is compared.
  3. A bug shared by both sides, or a change to `src/game.js` that the browser
     never exercises.
  4. Multi-move drift that only appears after several transitions on one
     board; each comparison is a single transition.
  5. Rendering and animation, which the engine deliberately omits.
- **Crafted-bypass test:** planted through the real seam on 2026-09-02, on the
  merged tree, before merge. Raising the engine's length-9 multiplier from 5
  to 6 failed `chain multiplier agrees for lengths 0-30` and `merges agree at
  every multiplier tier` (12 pass, 2 fail). Making engine gravity treat ice
  like stone failed the gravity comparison. Engine restored byte-identical
  afterwards, 14 of 14 green. The adversarial review of the first version
  planted 21 defects and 17 survived; the second commit closed every hole it
  named. No Challenge Receipt: this is a local parity invariant, not evidence
  admission.
- **Retires:** the line-number references in the engine's mirror comments,
  which rotted whenever `src/game.js` moved.
- **Enforcement:** HARD via `node --test solver/tests/*.test.js`.
- **Decay:** if you extend `solver/engine.js`, plant a break in the new code and
  watch this file go red before trusting it; shrink the `uncompared` list to
  improve coverage.
- **Shipped:** 2026-09-02 · branch `fix/engine-mirrors-game-test`, merged in
  the remote-branch triage run `2026-09-02-adhoc-remote-branch-triage`.

---

## The experiment gate

> **Enforcement wiring, 2026-09-03.** Until this date the gate was a script
> someone had to remember to run. Pull request #1 admitted `RESULT-0027` with
> the gate red and merged ten minutes later; nothing ran it. The gate now runs
> in `.github/workflows/experiment-gate.yml` on every pull request and every
> push to `main`. GitHub branch protection, which would make that job a
> required check, is unavailable on this private repository's plan (HTTP 403,
> "Upgrade to GitHub Pro or make this repository public"), so CI is a visible
> red mark, not a refusal. The refusal is local: `tools/hooks/pre-push`,
> installed into the clone's shared hooks directory by
> `node tools/hooks/install.js`, runs the gate on any push to `main` and exits
> non-zero on failure. Worktrees share that directory, so every session on the
> machine is covered. Proven 2026-09-03: green main passed; a scratch worktree
> with `RESULT-0028` re-labelled `heuristic_observation` was refused, exit 1.
> Does NOT catch: a push from another machine without the hook, a merge
> clicked in the GitHub web UI, or `git push --no-verify`.

`tools/verify-experiments.js`, run live by `solver/tests/experiments.test.js`.
It shipped 2026-08-31 with **no cards at all**; the five below were written
2026-09-01 when an adversarial review found that four of its five promises were
enforced by nothing. Each card's negative test plants a real failure against the
real artifacts, because every one of these checks had a fixture-only ancestor
that passed while inspecting nothing.

### report-answers-each-declared-check · HARD

- **Protects:** `experiments/README.md`'s central promise — "a prediction that
  came out badly cannot be quietly dropped".
- **Where:** `assessReportAnswers`, `tools/verify-experiments.js`.
- **Level:** section. A declared check must have a `##`–`######` heading of its
  own naming it, and that section must contain one of PASS / FAIL / SUPPORTED /
  FALSIFIED / INCONCLUSIVE / BREACH.
- **Kind:** shape, honestly. It proves an outcome was *stated*, never that the
  outcome is *true* or that the section's prose supports it. Truth is owned by
  human review and by the artifact-level cards below.
- **Scope:** checks matching `^### ([CP]\d+)'? [—-]` in `protocol.md`, resolved
  against `report.md` in the same directory. Only runs when a report exists.
- **Reads own output?:** no. Protocol and report are separate files by separate
  commits; the ordering check enforces that.
- **Sampling memory:** n/a — exhaustive over declared checks.
- **Does NOT catch:**
  1. **A verdict word used in passing inside the right section.** P4's real
     section says "the declared `SUPPORTED` condition was exact equality" — that
     alone satisfies this check even with the verdict deleted from the heading.
     Found while crafting the negative test: the first crafted input passed
     because of exactly this, and the test now replaces the whole section.
  2. **A wrong verdict.** `## P1 — **SUPPORTED**` over prose describing a
     falsification passes. This gate reads structure, not agreement.
  3. **A check the protocol never declared.** Scope that was never registered
     still cannot show up here — it shows up as a missing protocol section only
     if someone declared it.
  4. **A report for an experiment with no protocol.** Nothing to declare
     against, so nothing to answer.
- **Replaces:** the previous `\bC1\b`-anywhere mention test, which the real
  RESULT-0020 report satisfied for P1, P2 and P4 from incidental sentences in a
  *different* section — all three sections were deletable with the gate green.
- **Rung:** blocking. **Decay:** the live test fails if the real report ever
  stops answering all eight of RESULT-0020's checks.

### cited-path-resolves · HARD

- **Protects:** the rot `experiments/README.md` names as motivating the gate —
  "two ledger citations rotted to paths that never resolved".
- **Where:** `assessCitationsResolve`, over `openCitedArtifacts`.
- **Level:** citation. Every backticked `*.json` token in a ledger record that
  **contains a slash** must exist on disk and parse as JSON.
- **Kind:** existence plus parseability. Not contents — `artifact-identity-verifies`
  owns that.
- **Scope:** all 19 ledger records **including grandfathered ones** —
  grandfathering waives the protocol requirement, never the requirement that a
  receipt be a real file. 13 path-shaped citations today, all resolving.
- **Reads own output?:** no.
- **Does NOT catch:**
  1. **A filename named in prose.** Four live citations have no slash
     (`-52.receipt.json`, `candidate-levels*.json`) and are deliberately
     skipped; firing on them would make the gate red on English. So a real path
     written without a directory is invisible here.
  2. **A path that resolves to the *wrong* file.** Existence only.
  3. **Non-JSON evidence.** `citedArtifacts` only matches `.json`; a cited `.md`,
     `.html`, or commit-scoped path is not checked by anything.
  4. **A citation inside a decision or hypothesis record.** `readLedgerResults`
     only parses `### RESULT-NNNN` blocks, so `DECISION-0004`'s citations are
     unchecked.
- **Rung:** blocking. **Decay:** live test plants a nonexistent path each run.

### artifact-identity-verifies · HARD

- **Protects:** the ledger's `artifactIdentity` values, published as
  `direct_source` facts. Nothing ever recomputed one: every cell of a 15,600-cell
  holdout could be edited with all four gates green.
- **Where:** `assessArtifactIdentity`; sha256 over `canonicalJson(body)` with
  `artifactIdentity` and `registration` removed.
- **Level:** whole artifact — one verdict for the file, so you learn *this
  artifact moved*, never *which cell*.
- **Kind:** meaning. It recomputes from content rather than comparing a record to
  a copy of itself.
- **Scope:** cited artifacts carrying a string `artifactIdentity` — **3 today**
  (RESULT-0018's holdout, RESULT-0020's holdout and screen, 13.2 MB total,
  ~0.4 s). Artifacts without the field are silently skipped.
- **Reads own output?:** yes — the identity was written by
  `solver/target-aware-evaluation.js` and is re-derived here by a *duplicate* of
  its `canonicalJson`, deliberately not an import: `solver/experiment-guard.js`
  requires this file, so importing solver code back would close a require cycle
  on every worker thread. **That duplication is the risk:** if the two canonical
  forms ever diverge, this check goes red on honest artifacts.
- **Does NOT catch:**
  1. **An artifact with no `artifactIdentity` field.** 10 of the 13 cited
     artifacts have none — `.orch/policy-search-*.json`, the map-elites archive,
     RESULT-0018's `verification.json`. Silence about those means "carries no
     identity", never "verified".
  2. **An artifact that was wrong when written.** Consistency with itself, never
     correctness of the measurement.
  3. **Artifact and identity regenerated together from broken code.** Both move,
     the hash agrees, the gate is silent. `version-freeze-covers-the-evidence`
     is the partial answer.
  4. **A different canonical form.** `solver/map-elites-core.js` has its own
     `validateArtifact`; if a map-elites artifact ever grows an
     `artifactIdentity` computed differently, this fires a false red.
- **Rung:** blocking. **Decay:** live test tampers with cell 0 of the real
  15,600-cell holdout and asserts the clean state first.

### stamp-commit-is-real · HARD

- **Protects:** the whole pre-registration argument. `registration.protocolCommit`
  is the one field that cannot be produced after the fact — and nothing read it.
  A forged sha, an absent field, and a real-but-wrong commit all passed.
- **Where:** `assessStampProvenance`.
- **Level:** stamp. Four clauses: 40-hex; **reachable from HEAD** (not merely
  present in the object store, so an amended-away commit that would not exist in
  a fresh clone fails); contains `experiments/<ID>/protocol.md` at that commit;
  and strictly precedes the commit that added `report.md`.
- **Kind:** meaning — it resolves the sha against real git history.
- **Scope:** non-exploratory stamps on artifacts cited by non-grandfathered
  `heuristic_observation` records. Complements the existing ordering check, which
  compares the two *files'* add-commits and never looked at the artifact.
- **Reads own output?:** yes, and this is the important one — the stamp is
  written by `solver/experiment-guard.js` from `addedIn()` in this same file.
  Safe because verification re-resolves against git rather than against the
  writer's record of git.
- **Does NOT catch:**
  1. **A protocol whose *content* was written after the data**, then committed
     and only then run. The sha proves the file existed, never that its
     predictions were authored blind. Owned by human review.
  2. **An artifact produced by a different run** under the same registration.
     Nothing binds a stamp to the compute that made the cells.
  3. **An exploratory artifact**, skipped here — `assessArtifactStamps` owns it.
  4. **History rewrite.** Reachability is evaluated against today's HEAD; a
     force-push that drops the registration commit turns this red, which is the
     intended direction but reads as a data failure rather than a history one.
- **Rung:** blocking. **Decay:** live test forges four shas — malformed,
  unreachable, real-but-pre-protocol (`52f500c`), and real-but-not-an-ancestor
  (HEAD) — and asserts the real stamps pass first.

### version-freeze-covers-the-evidence · HARD

- **Protects:** `experiments/README.md` item 4, which claimed the gate enforced
  the freeze while `tools/verify-experiments.js` said in its own header that it
  deliberately did not. A record asserted a property no check inspected.
- **Where:** `assessVersionFreeze` at ledger time and `requireProtocol` in
  `solver/experiment-guard.js` at run time. Three clauses.
  **(a)** while `status: registered`, every frozen file must still match the
  tree — literally what README item 4 always claimed.
  **(b)** once complete, every hash in the artifact's `sources` must be covered
  by a `version_freeze` entry. This is the durable half: it stays checkable
  after a frozen file legitimately moves on, and goes red if the freeze list
  never covered a file that carried the measurement.
  **(c)** since 2026-09-02, the freeze both clauses read is the one at the
  protocol's **registration commit** (`git show <commit>:protocol.md`), and the
  working-tree copy must equal it. Before this, both read the working tree
  while the artifact was stamped with the registration commit: edit a frozen
  file, rewrite the hash line to match, and guard and gate both passed, with
  the original commit stamped as provenance. Two independent gate-check
  reviews found it on the same day. A freeze that is empty or still holds
  `TEMPLATE.md` placeholders is refused outright (it was silently skipped), and
  the guard refuses any protocol whose status is not `registered`.
- **Level:** file hash, first 16 hex of sha256.
- **Kind:** value. Whether the frozen *set* is the right set is unchecked —
  clause (b) is the only pressure on that, and only for files the artifact
  happens to record.
- **Scope:** records with a protocol carrying `version_freeze`. **Clause (a) is
  vacuous today** — no protocol is in `registered` state, so its only exercise is
  the negative test. Clause (b) covers RESULT-0020's 5 recorded sources against
  its 7 frozen files.
- **Reads own output?:** clause (b) yes — `sources` is written by the evaluator
  and the freeze by `tools/new-experiment.js`. They are independent writers, so
  agreement is informative. Clause (c) exists because the previous version read
  `protocol.md` from the working tree — a file the experimenter controls after
  registration — while vouching for it with a commit it had not read.
- **Does NOT catch:**
  1. **A frozen file moving after a completed run.** Deliberate: that is a fact
     about the present, not about the evidence. `solver/target-aware-challenger.js`
     is off RESULT-0020's frozen hash right now, by an intended fix, and this
     stays green. Clause (b) is what keeps the evidence pinned.
  2. **A measurement file absent from BOTH the freeze and the artifact's
     `sources`.** `solver/target-aware-worker.js` is frozen but never appears in
     `sources`; a file in neither is invisible to both clauses.
  3. **`policy-eval.js`-style freeze theatre.** It is frozen by default and never
     loaded by the measurement. Freezing an irrelevant file costs nothing and
     proves nothing.
  4. **A 64-bit truncation collision.** `sha16` is the first 16 hex chars.
  5. **The wrong instrument under a valid protocol.** The guard's `name` is
     message text; any of the six guarded scripts accepts any registered id.
     Nothing ties a protocol to the script it describes.
  6. **Scripts that never call the guard**, and numbers transcribed from stdout
     into the ledger with no artifact cited. The guard is opt-in per script and
     fires only on the artifact-writing flag.
  7. **`--exploratory` alongside `--protocol`.** Exploratory wins silently; the
     compute is spent and the artifact cannot back a claim. A wasted run, not
     bad evidence.
  8. **A protocol body that describes a different experiment.** Only `result`
     and `version_freeze` are compared against the registration commit; the
     question, checks, and stopping rules can be rewritten after the fact.
     Open follow-up, not fixed by the 2026-09-02 merge: `BL-0007`.
  9. **A protocol with no `version_freeze` at all, at ledger time.**
     `assessVersionFreeze` returns no problems when the registered frontmatter
     has no freeze object, so the ledger gate false-PASSes it; only the run-time
     guard refuses it. Open follow-up: `BL-0007`.
- **Qualified 2026-09-02:** the merged fix (`de3ef93`) qualifies clause (c)
  only — the registration-commit read of `version_freeze`, its working-tree
  equality, and the empty/placeholder refusal. Items 8 and 9 above are what
  that merge deliberately did not touch.
- **Rung:** blocking. **Decay:** live test breaks a registered freeze against the
  real `solver/bot.js` and plants an uncovered source hash, with positive
  controls for both; `solver/tests/experiments.test.js` builds a throwaway git
  repository and plants the rewrite as real commits (uncommitted, committed,
  placeholder, empty, finished), each with a positive control. Mutation check
  2026-09-02: removing only the rewrite comparison turns exactly that test red.

### reported-protocol-lifecycle-is-complete · HARD

- **Protects:** a finished, ledger-admitted experiment cannot retain
  `status: registered` and remain silently coupled to the current working tree.
  RESULT-0021 and RESULT-0024 did so until later measurement work changed two
  frozen sources and made both accepted results fail as unfinished runs.
- **Where:** `tools/verify-experiments.js#assessProtocolLifecycle`, called by
  `assessExperiments`; exercised by `solver/tests/experiments.test.js`.
- **Level:** one ledger result, its protocol frontmatter, and report presence.
  A lifecycle defect in an experiment absent from the ledger slips past.
- **Kind:** value. It checks the transition marker, not whether the report is
  correct, entitled, or accepted at the right proof class; the remaining
  experiment checks own those questions.
- **Scope:** every result parsed from `EVIDENCE_LEDGER.md` that has both
  `experiments/<RESULT-ID>/protocol.md` and `report.md`, including grandfathered
  results if they carry a protocol. It reads only exact `registered` and
  `complete` values; other unknown values are outside this check.
- **Reads own output?:** no. The experiment workflow writes protocol and report;
  this repository gate reads them afterward and does not mutate either.
- **Sampling memory:** n/a — exhaustive over ledger result records. Silence
  about a result not admitted to the ledger means it was never inspected.
- **Does NOT catch:**
  1. A completed or failed run with a report that is not in the ledger.
  2. A falsely authored `status: complete`; artifact identity, report answers,
     stamp ancestry, and source coverage remain separate checks.
  3. A registered protocol with no report whose run actually happened
     elsewhere or whose evidence was lost.
  4. Unknown lifecycle values other than the exact stale `registered` state.
  5. Whether a lifecycle transition and its report landed in the same commit.
- **Crafted-bypass test:** `solver/tests/experiments.test.js`, case `a reported
  protocol cannot remain in the registered lifecycle state`: reported plus
  `registered` returns exactly one failure; no report plus `registered` and
  report plus `complete` both pass. Before the implementation existed, this
  test failed with `assessProtocolLifecycle is not a function` while the live
  gate independently reproduced four freeze failures.
- **Retires:** NO — `version-freeze-covers-the-evidence` detects this state only
  after a frozen source drifts. This check closes the earlier silent interval by
  failing as soon as an admitted report exists while the lifecycle remains
  registered.
- **Enforcement:** HARD in `tools/verify-experiments.js`; a lifecycle failure
  blocks the experiment gate and therefore ledger admission checks.
- **Decay:** run `node --test solver/tests/experiments.test.js`; the synthetic
  three-state negative test and the live ledger gate execute together.
- **Shipped:** 2026-09-02 · fix run
  `2026-09-02-experiment-lifecycle-completion-fix`.

---

### stranded-cell-pressure-real-state-seam · HARD

- **Protects:** `strandedCellPressure` cannot look qualified while reading only
  hand-built snapshots or while returning the same value for an open board and
  a topology change that creates an off-lattice remnant.
- **Where:** `solver/tests/behaviorDescriptors.test.js`, calling the public
  `playToBudget` seam in `solver/policy-eval.js`; the measure and registry live
  in `solver/behavior-descriptors.js`.
- **Level:** one completed move and its cells. Differences between observations
  can still disappear when they are averaged across a whole game or corpus.
- **Kind:** value. It checks exact pressure values and transition timing on
  fixed subjects. Strategic meaning, usefulness, and human experience remain
  owner/research questions.
- **Scope:** a deterministic 2x2 open level, its one-stone twin, and a
  duration-1 ice timing subject, constant RNG 0, one move, `minChain: 3`,
  `tileScale: 1`; plus a two-cell scale-3 lattice fixture. The denominator is
  the non-stone grid footprint. `playToBudget`
  observes after `executeChain`, gravity, refill, and blocker ticking. Other
  game runners, browser gameplay, bombs, multi-move accumulation, and sampled
  level or policy populations are excluded.
- **Reads own output?:** no. It executes the headless game transition and reads
  the live state passed to the production descriptor. Expected values are
  frozen literals (`0`, `1/3`, and `1/2`), not recomputed by the test.
- **Sampling memory:** n/a — the subjects are exhaustive fixed worked examples,
  not a sample. Silence about other boards means never measured.
- **Does NOT catch:**
  1. Whether the descriptor has useful range across levels, seeds, layouts, or
     policies.
  2. Whether it separates strategically or experientially distinct play.
  3. Whether it predicts fun, difficulty, player identity, or score quality.
  4. Whether it should replace or supplement either current MAP-Elites axis.
  5. Browser/headless parity outside the transition behavior already owned by
     the engine parity tests.
  6. State paths that do not call `policy-eval.js#playToBudget`; those runners
     receive no trace merely because this check passes.
- **Crafted-bypass test:** `solver/tests/behaviorDescriptors.test.js`, case `the
  real post-move seam distinguishes an open subject from its one-stone twin`.
  The open subject reports zero; the otherwise-identical one-stone subject
  creates a six-valued remnant and reports exactly `1/3`. The test first ran red
  because the live path returned no trace, then passed only after the production
  seam consumed both subjects. Its literal `1/3` assertion makes an always-zero
  implementation fail.
- **Retires:** NO — the existing behavior tests cover chain length and late
  score, neither of which reads post-transition board state or the mergeable-sum
  lattice. Widening either would mix distinct measurement units and still not
  expose a reusable post-move descriptor registry.
- **Enforcement:** HARD for the implementation claim only: the targeted Node
  test must pass. It grants no evidence-admission, candidate-selection, or
  MAP-Elites-axis entitlement. Any such promotion requires a separately
  registered experiment and its own downstream-consumed verdict.
- **Decay:** run
  `node --test solver/tests/behaviorDescriptors.test.js solver/tests/policy-eval.test.js`;
  both also run under `node --test solver/tests/*.test.js`.
- **Shipped:** 2026-09-02 · run
  `2026-09-02-stranded-cell-pressure-seam`, ticket `SCP-001`.

---

## Experiment-local entitlement checks

### topology-control-outcomes-differ · HARD

- **Protects:** RESULT-0024 confirmation cannot start merely because the
  one-stone and two-stone cells carry different layout labels. RESULT-0023's C2
  did exactly that and false-passed an outcome-identical twin.
- **Where:** `experiments/RESULT-0024/verify.js`,
  `countOutcomeChangedPairs`, `verifyControls`, `issueControlReceipt`, and
  `validateControlEntitlement`; consumed by
  `experiments/RESULT-0024/run.js` before confirmation.
- **Level:** paired gameplay-outcome record. Metadata differences between
  records intentionally slip past this comparison.
- **Kind:** value. It proves at least one recorded gameplay outcome changed and
  that an outcome-identical twin fails. Simulator correctness and strategic
  meaning remain owned by their separate checks and P1/P2.
- **Scope:** the 48 fixed policy-seed pairs on RESULT-0024's
  `one-center-stone` and `two-center-stones` control layouts; compares exactly
  `score`, `movesUsed`, `behaviorTotals`, and `behavior`. It excludes identity
  fields, the open layout, confirmation seeds, and unrecorded runtime state.
- **Reads own output?:** yes — it reads the result-local runner's control
  artifact. This is informative only because the permanent crafted twin and
  real control receipt challenge the same function, and the confirmation runner
  consumes that receipt.
- **Sampling memory:** fixed seeds `22000000..22000011`; silence means only that
  this 12-seed control did not observe a gameplay difference, never that no
  difference exists elsewhere.
- **Does NOT catch:**
  1. A difference too small, unstable, or irrelevant to strategy; P1 owns
     magnitude and fixed-half stability.
  2. Identically wrong outcomes produced on both arms by a broken simulator.
  3. A topology effect outside the four policies, two compared layouts, or 12
     control seeds.
  4. A changed gameplay property absent from the four serialized outcome fields.
- **Crafted-bypass test:**
  `experiments/RESULT-0024/control-gate.test.js`, case `outcome-identical twin
  fails even though layout identity fields differ`; the fixture asserts zero
  gameplay differences before requiring the check to fail.
- **Retires:** RESULT-0023's whole-cell C2 comparison at
  `experiments/RESULT-0023/verify.js#verifyControls`; the historical file and
  failed receipt remain unchanged.
- **Enforcement:** blocking. `run.js confirmation` requires an identity-bound
  receipt carrying valid-subject PASS and outcome-identical-twin FAIL.
- **Decay:** run `node --test experiments/RESULT-0024/control-gate.test.js`;
  the negative test and receipt-refusal assertions execute together.
- **Shipped:** 2026-09-02 · run
  `2026-09-02T05-54-31Z-player-style-topology-entitlement-retry`.

### policy-comparison-admission · HARD

- **Protects:** RESULT-0026 cannot spend its reserved confirmation seeds or
  become ledger-admissible unless the exact reference and frozen handmade
  policies are replayed through the real move budget by a checker already
  challenged on a real subject and a controlled wrong-outcome twin.
- **Where:** `experiments/RESULT-0026/gate.js#verifyArtifact`,
  `issueChallengeReceipt`, and `validateChallengeReceipt`; consumed before
  fresh compute by `run.js` and before admission by `admit.js`.
- **Level:** one paired policy/level/seed record plus its complete move trace.
  A shared semantic error inside the engine or both policy implementations can
  remain invisible between records.
- **Kind:** value. It checks exact identities, matrix closure, every selected
  chain and transition, registered provenance, arithmetic, and receipt
  consumption. Human strategic interpretation and cross-domain truth remain
  owned by review and the bounded experiment verdict.
- **Scope:** policies `reference` and `handmade`; qualification levels 5 and 50
  at burned seed 7000000; confirmation levels 5, 11, 17, 23, 29, 35, 41, 47,
  and 50 at seeds 24000000..24000024; current `solver/bot.js`,
  `solver/engine.js`, `src/game.js`, registration guard, result-local runner,
  frozen policy, gate, independent recomputation, and admission consumer. It
  accepts JSON schema version 1 only and excludes exploratory confirmation.
- **Reads own output?:** yes — the gate reads the result-local runner's JSON.
  This is informative because it independently re-executes every chooser
  decision and transition, the arithmetic path shares no result-local imports,
  and downstream consumers freshly regenerate the Challenge Receipt and
  independent recomputation before accepting either.
- **Sampling memory:** the real qualification subject is fixed and deliberately
  non-reportable. Silence means only that the gate was qualified on its four
  cells; performance inference comes only from the registered 225 paired
  confirmation cells.
- **Does NOT catch:**
  1. A bug shared by `src/game.js`, `solver/engine.js`, and both execution paths.
  2. Whether the frozen bomb-first, pre-gravity placement heuristic is the best
     reading of the owner's strategy or should ship.
  3. Performance outside the nine named levels, 25 reserved seeds, current
     policy identities, or current game rules.
  4. Whether the 150,000-node exact-sum cap bound on a particular move; the
     frozen policy exposes no cap-hit telemetry.
  5. A compute-matched explanation for any gain; runtime is diagnostic only.
  6. Dishonest protocol authorship before its commit; git proves ordering, not
     what a human or agent had already seen elsewhere.
- **Crafted-bypass test:**
  `experiments/RESULT-0026/policy-comparison-gate.test.js`, cases `real
  qualification subject passes and a resigned wrong-outcome twin fails the
  same gate`, `a re-signed forged receipt still fails because consumers rerun
  the challenge`, `a caller-fabricated independent receipt cannot substitute
  for executing recompute.js`, and `two-way clustered intersection correction
  blocks the additive false-SUPPORTED panel`.
- **Retires:** NO — the repository experiment gate owns protocol presence,
  report completeness, citation resolution, artifact hashes, and commit
  ordering. It does not replay policy decisions, qualify a measurement
  instrument, or require the result-local admission consumer to use that
  qualification.
- **Enforcement:** blocking for RESULT-0026. The confirmation runner requires
  the freshly regenerated PASS/FAIL/FAIL Challenge Receipt; `admit.js` requires
  the same receipt, its identity in the confirmation artifact, full replay, and
  exact agreement from the independently implemented arithmetic path.
- **Decay:** run
  `node --test experiments/RESULT-0026/policy-comparison-gate.test.js`, then
  `node experiments/RESULT-0026/admit.js` with the committed artifacts. Any
  covered source change invalidates both commands by identity.
- **Shipped:** pending RESULT-0026 preregistration and qualification; run
  `2026-09-02-result-0026-confirmation`, ticket `DGS-001`.
