# Certification checklist — Levels 1-58 lineage

Repo: this repository, `origin/main`
(as pinned in `levels-lineage.md`: `ce0930a9865433254d6b16e9f42628bb4299e486`).
Claims covered: DECISION-0003, RESULT-0008, RESULT-0009, RESULT-0011,
RESULT-0012, RESULT-0027, RESULT-0028, DECISION-0007 (off-main), Level 53's
unadjudicated entry, and Levels 1-58 themselves.

Columns: **id** | **standard enforced (quote + file:line)** | **applies to**
(claim|level) | **PASS/FAIL/UNKNOWN rule** | **scripted/judgment** | **existing
tool (file:line) or none** | **planted-fault evidence** | **effort**

---

### CK-01 — Reverify reproduces the recorded outcome
- Standard: "**Reproduction** — command and expected output or artifact identity." — `docs/MEASUREMENT-AND-ANALYSIS-STANDARDS.md` (Evidence and reporting rules, item 10).
- Applies to: claim (every RESULT/DECISION with a `reverify:` field: RESULT-0008/9/11/12/27/28).
- Decide: run the ledger's own `reverify:` command; PASS only if stdout matches the recorded numbers exactly (score/win-rate/median fields named in the record). FAIL if it runs but numbers differ. UNKNOWN if the command errors for an environment reason unrelated to the claim (e.g. missing seed file) — must be resolved, not left.
- Scripted/judgment: scripted (diff of printed JSON/text vs. recorded string).
- Existing tool: none that runs it automatically outside CI; `tools/verify-experiments.js` (`EVIDENCE_LEDGER.md:36` per prompt spec) parses ledger structure but does not execute `reverify:` commands.
- Planted-fault evidence: no evidence — `verify-experiments.js` has never been shown to fail when a `reverify:` command is stale (this is the exact defect noted for RESULT-0003, which now prints 1720 vs. the recorded 430).
- Effort: **M** (need a small runner script that extracts each `reverify:` shell command and its expected-output snippet, executes it, and diffs).

### CK-02 — Frozen artifact/receipt identities verify
- Standard: "An artifact that publishes an `artifactIdentity` still hashes to it" — `experiments/README.md` (What the gate enforces, item 7).
- Applies to: claim (RESULT-0027's calib-1 identity `c3cefaf3...`; RESULT-0028's HUMAN-PILOT-0002 hash; RESULT-0009/0012 candidate receipts).
- Decide: recompute the file hash(es) named in the record and compare to the cited identity string; PASS on exact match, FAIL otherwise.
- Scripted/judgment: scripted.
- Existing tool: `tools/verify-experiments.js` item 7 logic (per `experiments/README.md`); `pilots/HUMAN-PILOT-0002/qualify.js write` re-derives that specific receipt (cited in `AGENTS.md`, "Before you edit anything" section).
- Planted-fault evidence: `solver/tests/experiments.test.js:9-35` (read this session) plants synthetic ledger text and checks `readLedgerResults`/`proofClass` parsing, not hash mismatch — no evidence the hash-check branch of item 7 has been exercised with a deliberately wrong hash.
- Effort: **S** (hash recompute + string compare per citation).

### CK-03 — Protocol registered before data (commit order)
- Standard: "Register the protocol and **commit it before the experiment runs**. A protocol committed after its evidence is not a preregistration; it is a reconstruction." — `experiments/README.md` ("Writing one").
- Applies to: claim (any `heuristic_observation` record: RESULT-0008, RESULT-0027).
- Decide: find the commit that first added `experiments/<RESULT-ID>/protocol.md` (or registered-protocol.md) and the first commit that added the experiment's data or report. PASS only if the protocol commit is a strict ancestor of the first evidence commit (`git merge-base --is-ancestor <protocol> <evidence>` succeeds and they are different commits); FAIL if they are the same commit or the evidence commit comes first; N/A if the record is explicitly grandfathered (no protocol required); UNKNOWN if either commit cannot be identified. Use Git ancestry, never commit timestamps.
- Scripted/judgment: scripted (git commit-time comparison), with a judgment call on pre-gate grandfathering.
- Existing tool: `tools/verify-experiments.js` item 4 (version-freeze hash check while `status: registered`) checks file integrity, not commit order; no tool directly checks commit timestamp ordering of protocol vs. report.
- Planted-fault evidence: no evidence found for a commit-order check specifically (the freeze-hash check is exercised by `solver/tests/experiments.test.js`, but that is a different property).
- Effort: **M** (needs `git log` traversal per experiment dir).

### CK-04 — Seeds fresh and logged, no reuse
- Standard: "Burned ranges are listed in [SEEDS.md]... a new protocol declares its ranges there before it runs." — `experiments/README.md` ("Settled: there is no escape hatch"); file is `experiments/SEEDS.md`.
- Applies to: claim (RESULT-0008's 100 seeds/level from seed 100000; RESULT-0009/0012's 300-seed holdout 100000-100299; RESULT-0027's calib-1 150+120 seeds).
- Decide: PASS if the claim's seed range appears in `experiments/SEEDS.md` as burned/declared and does not overlap a different experiment's declared range; FAIL on undeclared or overlapping ranges; UNKNOWN if `SEEDS.md` predates the record (pre-gate).
- Scripted/judgment: scripted (range parse + overlap check).
- Existing tool: none — `experiments/SEEDS.md` exists as a ledger file but no script cross-checks ledger-cited seed ranges against it.
- Planted-fault evidence: no evidence.
- Effort: **M**.

### CK-05 — Same-board/seed comparisons only
- Standard: "Never compare one seed with a median over other seeds." — `docs/MEASUREMENT-AND-ANALYSIS-STANDARDS.md` (Bot and human comparison standard).
- Applies to: claim (any comparison record, e.g. RESULT-0011's chain-tiebreak fix, RESULT-0028 vs. bot).
- Decide: read the record's `scope`/`evidence` fields; PASS if every comparison pairs identical level+seed across arms; FAIL if a single seed is compared to an aggregate/median from a different seed set (this is the named DECISION-0007 defect: 105,664 median vs. one seed).
- Scripted/judgment: judgment (requires reading the comparison's construction, not just a number).
- Existing tool: `solver/human-benchmark.js` (cited `AGENTS.md`) is built to always pair on identical seed/board — but nothing prevents a human-authored ledger sentence from mixing a benchmark output with an unrelated median. No automated cross-check of ledger prose against this rule.
- Planted-fault evidence: no evidence.
- Effort: **M** (mostly judgment, some scriptable pattern-matching for "median" near a single-seed citation).

### CK-06 — Code identity outside known bug windows, or re-measured
- Standard: derived from named defect: "bot.js rolloutValue used weakest settings from `4ded51c` (2026-08-20) to `a2bf18d` (2026-09-04)" (prompt-supplied audit finding) and `AGENTS.md`: "`solver/engine.js` and `solver/level-author.js` are hashed into every candidate receipt via `defaultInputIdentities()` in `level-author.js`" (`solver/level-author.js:42-47`, confirmed this session).
- Applies to: claim (RESULT-0009 commit `32b90b3` 2026-08-20; RESULT-0012 commit `0a73bf5` 2026-08-20; RESULT-0027 commit dated 2026-09-03 — both inside the named 4ded51c→a2bf18d bug window) and level (any level whose target derives from a bot rollout measurement taken in that window).
- Decide: `git log --oneline 4ded51c..a2bf18d -- solver/bot.js` to confirm window bounds, then check whether the claim's measurement commit falls inside it; PASS (code identity clean) if outside, FAIL/needs-remeasure if inside and not since re-run, UNKNOWN if the specific evaluator used (e.g. `calib-1`'s own frozen rollout, `solver/calibrations/calib-1.js:38-41`) is independent of `bot.js` and therefore exempt.
- Scripted/judgment: scripted for the window/commit check; judgment for whether the specific record's evaluator was actually affected (calib-1's frozen rollout is a separate, deliberately frozen code path per the prompt's own framing).
- Existing tool: none — no script currently maps a ledger record's evaluator commit against the named bug window.
- Planted-fault evidence: no evidence.
- Effort: **M**.

### CK-07 — Cited commits/files/lines exist
- Standard: "the ledger... its citations lead to the primary repository evidence" — `EVIDENCE_LEDGER.md` ("Read this first", read this session); and "Every path-shaped `.json` citation in the ledger resolves and parses" — `experiments/README.md` (What the gate enforces, item 6).
- Applies to: claim (every citation in DECISION-0003/RESULT-0008/9/11/12/27/28 and DECISION-0007) and level (`src/game.js` line numbers cited in `levels-lineage.md`, e.g. `src/game.js:101`, `:112`, `:128`, `:147`, `:149-158`).
- Decide: `git show <ref>:<file>` for each cited commit/file; for line-number citations, confirm the cited content actually matches what's claimed at that line, in that commit (not just that it exists today). PASS/FAIL on exact match; FAIL if line numbers have drifted (the prompt's own audit already flags "line ~NNN references pointed at a layout that had moved" as a known failure mode elsewhere in this codebase's history).
- Scripted/judgment: scripted existence check (git show); judgment for content-matches-claim.
- Existing tool: `tools/verify-experiments.js` item 6 (`.json` citation resolution) per `experiments/README.md`; no equivalent for `.md`/`.js` line-number citations.
- Planted-fault evidence: no evidence for the `.json`-resolution branch specifically.
- Effort: **S** per citation, **M** in aggregate (dozens of citations across 8 claims + 6 levels).

### CK-08 — proof_class matches what the evidence can support
- Standard: "Preserve each proof class exactly: a replayed lower bound, exact result, proven upper bound, heuristic observation, `UNKNOWN`, or unresolved question must not be promoted into another class." — `AGENTS.md`; vocabulary defined `EVIDENCE_LEDGER.md:245` (Entry template, read this session: `proof_class: direct_source | exact_result | replayed_lower_bound | proven_upper_bound | heuristic_observation | UNKNOWN | unresolved | owner_decision | hypothesis`).
- Applies to: claim (all eight).
- Decide: judgment — read the record's `statement`/`evidence`/`scope` and confirm the declared `proof_class` is the weakest class the evidence actually supports (e.g. a 100-seed sample cannot be `exact_result`). PASS/FAIL by inspection.
- Scripted/judgment: judgment.
- Existing tool: `tools/verify-experiments.js` mechanically reads `proof_class` string (confirmed `readLedgerResults`, this session) to decide whether a protocol is required, but does not judge whether the *label itself* is honest.
- Planted-fault evidence: `solver/tests/experiments.test.js:9-35` (read this session) confirms the parser correctly extracts `proof_class` substrings including `heuristic_observation`/`direct_source` — that's a parser test, not a test of mislabeling detection (there is none, since none exists).
- Effort: **S** per record (judgment read), not scriptable.

### CK-09 — Claim does not exceed its evidence
- Standard: "**Boundary** — what the result does not establish." — `docs/MEASUREMENT-AND-ANALYSIS-STANDARDS.md` (Evidence and reporting rules, item 9); reinforced by RESULT-0027's own text (read this session) explicitly disclaiming retargeting/shipping Level 53.
- Applies to: claim (all eight) and level (53-58, since these are exactly where the audit says overreach occurred — Level 53 used RESULT-0027's numbers despite RESULT-0027's own disclaimer; Levels 55-58 cite calib-1/RESULT-0027 as "mechanism TRACED" while their own per-level figures were never captured in an accepted record).
- Decide: judgment — for each level, compare the shipped value against what its cited upstream claim states it does/does not establish; FAIL if the level's shipped number (e.g. Level 53's 101,000) differs from the one number the cited claim actually produced (102,000) with no ledger record bridging the gap.
- Scripted/judgment: judgment.
- Existing tool: none.
- Planted-fault evidence: no evidence.
- Effort: **M** (six levels, each needs a side-by-side read of claim text vs. shipped value).

### CK-10 — Authorship: written_by / checked_by distinct
- Standard: "Every new record names `written_by`... A record reaches `accepted` or `narrowed` only when `checked_by` names a different agent, a script run, or the owner who actually checked it." — `AGENTS.md` ("Before you edit anything"), enforced by `tools/verify-ledger-authorship.js` (read this session, `tools/verify-ledger-authorship.js:1-27`).
- Applies to: claim (all eight, where accepted/narrowed).
- Decide: scripted — run `tools/verify-ledger-authorship.js` against the commit range containing each record; PASS if it exits 0 for that record, FAIL if it flags same-author accept.
- Scripted/judgment: scripted.
- Existing tool: `tools/verify-ledger-authorship.js:1-50` (confirmed this session) — compares `EVIDENCE_LEDGER.md` against `git merge-base HEAD origin/main`, requires `written_by`/distinct `checked_by` for accepted/narrowed records.
- Planted-fault evidence: no evidence found this session of a test file for this gate (no `verify-ledger-authorship.test.js` located); tool's own header comment describes intended behavior but nothing confirms it has been driven with a same-author-accept fixture and observed to fail.
- Effort: **S** (tool exists and is directly runnable; effort is just invocation across the 8 claims' commits).

### CK-11 — Supersede links consistent both ways
- Standard: entry template fields `supersedes:` / `superseded_by:` — `EVIDENCE_LEDGER.md:240-255` (Entry template, read this session, e.g. RESULT-0001 lines showing both fields); "Make every correction append-only. Add a correction or supersession record... retain the prior claim and receipt." — `AGENTS.md`.
- Applies to: claim (RESULT-0011 vs. RESULT-0012's "held at pre-0011 value" relationship; DECISION-0007 vs. the commit `3bcb5a6` it formalizes).
- Decide: scripted graph check — for every record listing `superseded_by: [X]`, confirm X's `supersedes:` list contains it back, and vice versa; PASS on symmetric match, FAIL on dangling/one-directional link.
- Scripted/judgment: scripted.
- Existing tool: `tools/ledger-index.js` (cited `AGENTS.md`, generates `LEDGER-INDEX.md`) parses records via `parseLedgerRecords` (imported by `tools/verify-ledger-authorship.js:29`, confirmed this session) but the index's role is described as navigation, not symmetry validation — no evidence it checks bidirectional consistency.
- Planted-fault evidence: no evidence.
- Effort: **S** (straightforward graph symmetry script once records are parsed — `parseLedgerRecords` already exists to reuse).

### CK-12 — Level target equals what its origin method produces (recompute from recorded inputs)
- Standard: "A level's target is *demand* (a chosen share of measured achievable score)" — DECISION-0003 as summarized in `levels-lineage.md`; cross-checked against `docs/MEASUREMENT-AND-ANALYSIS-STANDARDS.md`'s "Standard analysis sequence" item 1-2 (freeze inputs, replay, confirm outcome).
- Applies to: level (all 58, but concretely re-runnable for 1-52 and 55-58 where a rollout/demand formula is named; not for 53 (no ledger record) or 54 (deliberate owner exception, no formula)).
- Decide: scripted — recompute `round(measured_median × demand)` from the cited seeds/commit and compare to the shipped `target` field in `src/game.js`; PASS on exact/rounding match, FAIL otherwise, UNKNOWN where inputs (e.g. Level 53's) don't exist to recompute from.
- Scripted/judgment: scripted, contingent on the named "verify loop samples levels 1-50 only" gap (per prompt) meaning 51-58 currently have no automated recompute at all.
- Existing tool: `solver/game-tester.js` (present in repo per `git ls-tree`, confirmed this session) is the named mechanism for measuring a rule/scoring change against the shipped curve (`AGENTS.md`, "How to work here"); not confirmed to already do a level-by-level recompute-and-diff against `src/game.js` targets, and known to stop at level 50 per the prompt's audit note.
- Planted-fault evidence: no evidence; the audit finding itself ("verify loop samples levels 1-50 only") is evidence the tool has a known blind spot for 51-58, not that it's been fault-tested.
- Effort: **L** (extending/adapting the verify loop to levels 51-58, including levels with no ledger-recorded inputs to recompute from).

### CK-13 — Level custody: a ledger/decision record exists on `origin/main`
- Standard: "Read the current snapshot first... An uncited claim or unaccepted artifact is a lead, not project knowledge." — `EVIDENCE_LEDGER.md` ("Read this first"); directly the basis for the PARTIAL verdicts in `levels-lineage.md` for Levels 53-58 (Level 53: "No ledger record for the shipping decision"; Levels 54-58: DECISION-0007 off-main / "carry no authoring receipt").
- Applies to: level (all 58; this is the check that already produced the TRACED/PARTIAL split).
- Decide: scripted existence check — `git show origin/main:EVIDENCE_LEDGER.md` grep for a DECISION/RESULT id covering the level's shipping commit; PASS if found and accepted, FAIL/PARTIAL if the only record is off-main (DECISION-0007) or absent (Level 53).
- Scripted/judgment: scripted (grep/parse), the PARTIAL-vs-FAIL line is judgment.
- Existing tool: none automated; `levels-lineage.md`/`.json` (this session's primary source) is itself the manually-produced output of this check, not a repeatable tool.
- Planted-fault evidence: no evidence (no tool exists).
- Effort: **M** (scripting the level→commit→ledger-record join is the main cost; the manual version was already done once for this audit).

---

## Summary

- **Total checks: 13** (CK-01 through CK-13), covering 8 upstream claims and levels 1-58, per the id/claim/level scheme above.
- **Scripted vs. judgment:** 7 fully or mostly scripted (CK-01, CK-02, CK-03, CK-04, CK-06, CK-10, CK-11, CK-13 — note CK-06 and CK-13 mix in a judgment sub-step) and CK-05, CK-08, CK-09 are judgment-only; CK-07 and CK-12 are scripted with a judgment residual. Net: **8 scripted-primary, 5 judgment-primary**.
- **Existing tool present:** 5 of 13 (CK-02, CK-06 partial via bug-window commits, CK-07 partial, CK-10, CK-12 partial via `solver/game-tester.js`) — concretely: `tools/verify-experiments.js`, `pilots/HUMAN-PILOT-0002/qualify.js`, `tools/verify-ledger-authorship.js`, `tools/ledger-index.js`'s `parseLedgerRecords`, `solver/game-tester.js`, `solver/human-benchmark.js`. The rest (CK-01, CK-03, CK-04, CK-05, CK-08, CK-09, CK-11, CK-13) have **no existing tool**.
- **Planted-fault evidence:** **0 of the 5 existing tools** have confirmed planted-fault test evidence for the specific property this checklist needs from them. `solver/tests/experiments.test.js` only tests string-parsing (`readLedgerResults`/`proofClass`/`declaredChecks`), not the hash-mismatch or commit-order branches; no test file for `tools/verify-ledger-authorship.js` was located. All five are "no evidence," not "tested and passed."
