---
id: current-game-state
run: 2026-08-29-current-game-state
status: complete
executor: orch-investigate
independence: checker
depends_on: []
write_scope: []
excluded_actions:
  - change game rules, scoring, solver behavior, experiments, backlog disposition, or evidence standing
bound: 30 minutes; EVIDENCE_LEDGER.md, CURRENT.md, and only the primary repository artifacts needed to resolve the active state
claimed_by: codex-root
claimed_at: 2026-08-29T00:00:00-05:00
---

## Objective

Produce a newcomer-readable statement of the game's current state that distinguishes the shipped game, active milestone, accepted solver/research evidence, and unresolved work.

## Fixed inputs

- `/Users/eluckey/Developer/research and games/2248-challenge/EVIDENCE_LEDGER.md` at the worktree state read during this run
- `/Users/eluckey/Developer/research and games/2248-challenge/CURRENT.md` at the worktree state read during this run
- Primary repository artifacts cited by those two files, selected only as needed to support the answer
- Source policy: ledger standing controls proof status; CURRENT/backlog records control navigation and intent only

## Completion test

1. The result identifies the player-facing game, the active milestone, the strongest accepted solver/research results, and the important unresolved or blocked items. Oracle: direct evidence-resolution procedure from each statement to `EVIDENCE_LEDGER.md`, `CURRENT.md`, and their cited primary artifacts; oracle_class: evidence; provenance: pre-existing.
2. Every numeric or proof-bearing statement preserves its recorded proof class and resolves to a source that supports it. Oracle: ledger-record-to-primary-artifact cross-check, including status and supersession fields; oracle_class: evidence; provenance: pre-existing.
3. Contradictions, dead ends, and uncovered scope are stated rather than silently reconciled. Oracle: explicit comparison of ledger standing with CURRENT and selected primary artifacts; oracle_class: evidence; provenance: pre-existing.

## Return fields

- status
- result identity
- verification verdicts
- cited findings with confidence
- contradictions
- dead ends
- gaps and bound

## Result

Status: complete within the frozen bound.

Result identity: this ticket, based on canonical `main` at
`90166907437c7b686f868be0e049325d97fb00f6` plus a separately identified,
clean, unmerged research worktree at
`codex/research-session-2026-08-28` / `c4a42fcf7ea83201901e165cccffa5555aec2dd0`.

### Findings

1. **The player-facing artifact is a working static browser game, mechanically
   carrying 53 levels. Confidence: high.** `src/index.html` loads `game.js`; the
   live `LEVELS` export contains levels 1 through 53, and
   `solver/tests/gameLevels.test.js:5-11` pins the shipped count to 53. Level 53
   is a 6x5, 16-move, min-chain-3 level at target 101,000
   (`src/game.js:114-128`). The core game remains whole-tile-chain play:
   king-move adjacency, equal first pair, then equal-or-double extensions, with
   chain-sum scoring and stepped length multipliers (`EVIDENCE_LEDGER.md`,
   FACT-0001 and FACT-0002).

2. **The current curve gate is green, but it is a sampled health gate rather
   than proof of all 53 levels. Confidence: high.** A fresh
   `node solver/verify-loop.js` exited 0 with all seven checks passing: 53/53
   levels have targets/tile scales; sampled Level 50 won 92% of 60 seeds, had
   0% lockouts and 2% bomb explosions; early sampled levels were 100% and late
   sampled levels 97%. The accepted all-level calibration evidence is the
   policy-dependent `RESULT-0008`, not an optimal-player proof.

3. **The main test tree is intentionally not all green. Confidence: high.** A
   fresh full run reported 236 tests: 233 pass and three receipt-identity
   failures (`candidate-levels-52.json`, `candidate-levels-54.json`, and
   `candidate-levels.json`). The failures say the receipts predate the current
   bot; they must not be cleared by pretending the old measurement is current.
   Game rules, engine behavior, 53-level export, recording replay, baseline
   guard, and Universe Map tests passed in that same run.

4. **Level authoring is the active product milestone, and a real generator now
   exists. Confidence: high.** `solver/generate-levels.js:1-12,68-104,206-296`
   samples shapes, performs a cheap target-free screen, runs selected survivors
   through the existing 450-game authoring path, verifies them, and ranks the
   verified shortlist. Main's `CURRENT.md:9-13` is stale: it still says the
   generator does not exist and describes Level 53 as rejected. The generated
   `UNIVERSE.md:7-8,33-43` already flags CURRENT as stale.

5. **Main's evidence ledger admits the retuned curve and Levels 51-52, but has
   no admission record for Level 53 even though current source and tests call it
   shipped. Confidence: high.** Main therefore has a real source-versus-standing
   gap. Level 53's source comment also says its receipt verifies against the
   current bot (`src/game.js:114-120`), while the fresh receipt gate proves that
   receipt now has a code/input identity mismatch. The statement may have been
   true at admission time; it is false as a current-bot claim.

6. **The exact Level 26 proof remains parked and unresolved. Confidence: high.**
   For the historical frozen scale-1, target-13,000 seed, the accepted evidence
   remains a replayed lower bound of 12,336 and a proven but non-decisive upper
   bound of 326,390; reachability and the exact maximum remain open
   (`EVIDENCE_LEDGER.md:223-249,553-579,663-669`). The currently shipped Level
   26 was retuned to tile scale 4 and target 23,700; that does not answer or
   retract the frozen study (`EVIDENCE_LEDGER.md:611-624`).

7. **The protected solver champion has not been displaced. Confidence: high.**
   Main admits `RESULT-0017`: 20/25 MAP-Elites behavior cells and no stronger
   replacement. The later verified artifact fills 23/25 cells, but all three
   representatives lose on disjoint holdout and main's Universe Map marks it
   not ledger-admitted (`UNIVERSE.md:24-43`).

8. **A clean worktree contains the next, unmerged research state. Confidence:
   high for its contents; it is not canonical main.** The branch is ten commits
   ahead. It reconciles Level 53 as `RESULT-0018`, admits the fixed-axis 23/25
   MAP-Elites run as bounded `RESULT-0019`, freezes candidate measurement to
   `calib-1`, retires the unshipped stale Level 54 store from the live corpus,
   and adds a guarded generated-level-corpus runner. Its full suite currently
   reports 254 tests, 252 pass, with only the two deliberately visible shipped
   Level 52/53 stale-receipt failures. Focused corpus/authoring tests pass 25/25.
   The protocol remains explicitly **execution not authorized**; no generated
   corpus or policy evaluation result follows from the implementation
   (`.orch/runs/2026-08-29-generated-level-corpus-preregistration/preregistration.md:1-26,65-80`).

9. **The UI is not release-polished despite the healthy engine. Confidence:
   high for the markup defect; rendered impact not browser-verified here.**
   `src/index.html:354-364` contains two visible buttons with the same
   `id="submitBtn"`, while `src/game.js:399` wires only the first element returned
   by `getElementById`. No rendered browser smoke was run in this investigation.

### Contradictions

- Canonical source/tests say 53 levels ship; canonical ledger standing stops at
  Level 52, and canonical CURRENT still describes Level 53 as rejected.
- Main's Level 53 comment calls its receipt current; the receipt gate reports it
  stale against the current bot.
- Main's accepted MAP-Elites standing is 20/25 and the later 23/25 artifact is
  unadmitted; the unmerged branch contains a proposed/admitted RESULT-0019.
- The curve gate passes while the full suite deliberately fails receipt-currency
  checks. These answer different questions and must not be blended into one
  green/red label.

### Dead ends

- A first static-page read targeted nonexistent root `index.html`; the probe had
  already located the real file at `src/index.html`. Corrected immediately and
  logged as friction.
- Existing `.orch` status tickets were treated only as leads; findings above
  were resolved to source, tests, ledger records, Git identities, or fresh
  commands.

### Gaps and bound

- No browser-rendered play session or human playtest was performed, so current
  visual polish and end-to-end interaction remain unverified beyond static
  markup and existing tests.
- The live curve gate samples 11 of 53 levels and does not sample 51-53.
- No exhaustive per-level current-bot table was run.
- The ten-commit research branch was inspected only for status-bearing changes
  and named tests; it was not code-reviewed for merge readiness.
- The generated-level corpus protocol was not executed, consistent with its
  owner gate.

## Verification

1. PASS — direct source, ledger, Git-identity, and fresh command evidence cover
   the player artifact, active milestone, accepted research standing, parked
   proof track, and unresolved work. `oracle_class: evidence`.
2. PASS — numeric claims retain their recorded classes: exact source identity,
   sampled heuristic observation, replayed lower bound, proven upper bound,
   owner decision, or unresolved. No heuristic result was promoted to a bound.
   `oracle_class: evidence`.
3. PASS — contradictions, dead ends, and the uncovered browser/per-level/branch
   review scope are explicit. `oracle_class: evidence`.

Overall: PASS. Weakest oracle class: evidence. All acceptance oracles were
pre-existing and able to fail against the observed stale/red states.

## Feedback

- Main's navigation and evidence standing lag its shipped source. The separate
  clean branch already contains a reconciliation, but merge/admission is outside
  this read-only ticket.

## Risks

- A reader who collapses main and the unmerged research branch will overstate
  what is canonical today.
- A reader who treats the full-suite receipt failures as engine failures will
  understate game health; a reader who ignores them will erase provenance debt.
