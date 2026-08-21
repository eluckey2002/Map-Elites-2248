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
  1. **Two expected reds can camouflage a third.** This check is deliberately
     failing on levels 52 and 54, so the suite's normal state is red. A new
     regression shows up as a third named failure among two habitual ones, and
     habitual red is read as "still the old thing" without being checked. This
     is the accepted cost of not hiding real debt, but it is a real cost and it
     grows the longer the two stay unfixed. Mitigation is weak: failures are
     named per store, so the new one has a new name — that only helps someone
     who reads them.
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
- **Enforcement:** **HARD** (blocking), and **currently red on 2 of 3** — by
  choice. Shipped report-only on 2026-08-21, promoted the same day. The
  promotion was first made to look clean by archiving the two failing stores;
  that was reversed within the hour because clearing a red gate by removing its
  input is precisely the failure this gate exists to catch, and the resulting
  green reported a number whose basis had moved — this project's signature
  pathology, reproduced inside the tool built to cure it.
  **The two reds are not the same problem**, and an earlier version of this card
  wrongly treated them as one by asserting both levels ship. `src/game.js` holds
  levels **1..52 only**, verified by parse:
  - **Level 52 ships.** Players see it; its target of 102000 is live. Refreshing
    its receipt necessarily *raises* that target, because the receipt derives
    target as `median x demand` and asserts the recorded median matches a fresh
    measurement — with the bot ~8% stronger, that makes a live level harder for
    humans on evidence about bot search quality. That is a difficulty-curve
    decision, deliberately unowned rather than smuggled in as a test fix.
  - **Level 54 is unshipped.** No player has ever seen it, so re-measuring it
    against the current bot clears its red at no player cost and needs no
    decision at all.
  **Demotion condition:** none. Do not return this to report-only, and do not
  archive to clear it.
- **Decay:** re-runs on every `node --test solver/tests/*.test.js`. Debt trends
  as failing per-store tests (**2 of 3**). Measured cost: suite
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
