---
id: investigate-next-best-course
run: 2026-08-29T01-59-57Z-adhoc-next-best-course
status: complete
executor: orch-investigate
depends_on: []
write_scope:
  - .orch/tickets/2026-08-29T01-59-57Z-adhoc-next-best-course/investigate-next-best-course.md
excluded_actions:
  - modify tracked project content
  - run new score or solver experiments
  - edit the evidence ledger or backlog
  - use web sources
  - commit
  - push
bound: 90 minutes
claimed_by: /root
claimed_at: 2026-08-29T02:00:31Z
---

## Objective

Answer one bounded question: based on the repository's current verified evidence, what is the single best next course of action for the 2248 project, and why is it preferable to the strongest alternatives?

## Fixed inputs

- Checkout: `/Users/eluckey/Developer/research and games/2248-challenge/.orch/runs/2026-08-29T01-57-14Z-adhoc-research-worktree/worktree`
- Revision: `90166907437c7b686f868be0e049325d97fb00f6`
- Required authority order: `EVIDENCE_LEDGER.md`, then `CURRENT.md`, then the active milestone's linked backlog records and primary repository artifacts cited by the ledger.
- Source policy: repository evidence at the fixed revision only; prefer primary code, receipts, test output artifacts, and commit history. Chat, memory, handoff prose, and backlog status are context, not proof standing. No web sources.
- Read bound: the full ledger and `CURRENT.md`; linked active-backlog records; primary artifacts needed to adjudicate the leading recommendation and two strongest alternatives. Record dead ends and remaining gaps rather than widening the search.

## Completion test

1. The evidence packet distinguishes the current proven results, accepted decisions, hypotheses, and unresolved questions relevant to choosing the next action, with path-and-line citations. Oracle: source-resolution review in which every cited path and line exists at revision `90166907437c7b686f868be0e049325d97fb00f6` and supports the associated claim without changing its proof class. Oracle class: evidence. Oracle provenance: pre-existing.
2. The evidence packet recommends exactly one next course, compares it against at least two credible alternatives, and identifies the recommendation's decisive rationale, expected decision value, stopping condition, and falsifier. Oracle: argument audit against the cited source record and the explicit fields in this criterion. Oracle class: evidence. Oracle provenance: pre-existing.
3. Every load-bearing claim in the argument is traceable to a cited primary repository artifact or is explicitly labeled as an inference; contradictions, dead ends, and uncovered gaps are recorded. Oracle: claim-to-source resolution review across the packet. Oracle class: evidence. Oracle provenance: pre-existing.

## Return fields

- status
- result identity
- verification
- cited findings with confidence
- recommendation and argument
- alternatives considered
- contradictions
- dead ends
- gaps

## Result

### Status and result identity

- status: `complete`
- result identity: `.orch/tickets/2026-08-29T01-59-57Z-adhoc-next-best-course/investigate-next-best-course.md` at repository revision `90166907437c7b686f868be0e049325d97fb00f6`
- overall confidence: high on repository state and the named failures; medium-high on priority, because priority is an inference from the accepted milestone and current technical dependencies rather than an owner decision

### Cited findings

1. **The accepted project direction is level authoring, while the exact-proof track remains parked. Confidence: high.** The ledger's resume boundary says tuning is done and active work resumes at authoring new levels; it separately preserves the unresolved Level 26 interval and the conditions that would close it (`EVIDENCE_LEDGER.md:663-669`). This is the current accepted decision boundary, not an inference from chat.
2. **The level generator already exists, so “build the generator” is no longer the missing capability. Confidence: high.** `solver/generate-levels.js:130-168` implements cheap screening and the real holdout gate; `:246-280` sends survivors through `deriveCandidate` and replays all 450 fitting/holdout games through `verifyCandidate`. `CURRENT.md:7-13`, last reviewed on 2026-08-20 (`:47`), still presents the choice as hand-picking more levels versus building the generator. The current generated control panel correctly marks that navigation stale (`UNIVERSE.md:5-8`).
3. **The frozen calibration ruler exists but is not wired into candidate authoring. Confidence: high.** `solver/calibration.js:20-28,33-54` defines literal `calib-1` parameters specifically to keep target meaning stable across live-bot changes. But `solver/level-author.js:14,121-128` imports `chooseMove` directly and invokes it without the calibration parameters; `deriveCandidate` uses that live `playMeasured` by default and derives target from its median (`solver/level-author.js:181-230`). This is the exact drift mechanism the calibration file says it is meant to prevent.
4. **The drift is already observable, not hypothetical. Confidence: high.** The current targeted gate command, `node --test solver/tests/calibration.test.js solver/tests/levelAuthor.test.js solver/tests/receiptGate.test.js`, returned 31 PASS and three FAIL: `candidate-levels-52.json`, `candidate-levels-54.json`, and `candidate-levels.json`, each for `code/input identity mismatch`. The gate deliberately refuses to hide stale inputs (`solver/tests/receiptGate.test.js:135-181`). Its standing policy is also precise: shipped Levels 52 and 53 have owner/human evidence and remain visible historical exceptions; unshipped Level 54 must be re-authored or retired, and the check must not be weakened (`:143-181,510-535`).
5. **Repository source and authority surfaces disagree about Level 53. Confidence: high.** The isolated research worktree is clean at `9016690`, equal to `origin/main`, and `src/game.js:114-128` contains shipped Level 53, including its provisional 0.95 demand and three recorded owner wins. `solver/tests/gameLevels.test.js:5-9` deliberately pins 53 shipped levels. The ledger ends its result registry at `RESULT-0017` and contains no Level 53 admission record; `CURRENT.md` still describes only Level 51 in its active-milestone summary (`CURRENT.md:7-13`).
6. **MAP-Elites is producing bounded diversity evidence but no champion evidence. Confidence: high within the recorded scopes.** The ledger-admitted first run occupied 20/25 cells and its best-looking representative reversed from +3.30% on screen to -3.57% on holdout (`EVIDENCE_LEDGER.md:460-473`). The corrected independent round deterministically verified 23/25 cells on shared axes, but all three representatives had negative holdout lift; the best reversed from +0.7337% to -1.4739%, so the champion stayed unchanged (`.orch/runs/2026-08-28-map-elites-independent-round-verification/evidence/measurement.md:14-24,34-46,60-78`).
7. **The latest MAP-Elites result is verified at a pinned 52-level revision, not reverified against current main. Confidence: high.** Its runner hard-codes selection levels `[1,10,20,30,40,52]`, holdout levels through 52, and a protected `src/game.js` hash (`solver/map-elites.js:20-30`). A live verifier run in this investigation against current `main` failed exactly with `FAIL: protected file changed: src/game.js`, because Level 53 was added after the pinned revision. This does not invalidate the historical artifact; it prevents describing it as a current-53-level evaluation. The Universe Map preserves the distinction but also shows the result is not ledger-admitted (`UNIVERSE.md:24-43`).
8. **The MAP-Elites benchmark is too narrow to justify spending the next cycle on champion search. Confidence: high for coverage, medium for the priority implication.** Selection covers six fixed layouts and holdout covers twelve (`solver/map-elites.js:29-30`); only three of 23 elites received holdout evaluation, and the latest measurement names the remaining generalization and occupancy questions explicitly (`.orch/runs/2026-08-28-map-elites-independent-round-verification/evidence/measurement.md:101-106`). Fresh spawn seeds protect against seed reuse, not layout-space overfitting.

### Recommendation — one course

**Run a bounded measurement-baseline stabilization and evidence-convergence pass before generating another level or running another MAP-Elites round.**

The pass has one observable purpose: make “the instrument, the receipts, and the authority surfaces all describe the same current baseline.” Its in-scope work should be:

1. Wire `calib-1` explicitly into `level-author.js`'s candidate measurement path and add a regression oracle showing that changing live bot defaults does not change a newly derived target under the same calibration identity.
2. Preserve the deliberate Level 52/53 historical receipt failures exactly as decided; re-author or retire only the unshipped stale Level 54 artifact, without weakening the corpus gate.
3. Append ledger records that adjudicate Level 53 and the fixed `ab8ed417...` MAP-Elites artifact at their exact proof classes and pinned revisions. If Level 53 lacks the owner-decision evidence required for admission, record that gap rather than promoting it.
4. Refresh `CURRENT.md` and regenerate the Universe Map so the active milestone, generator existence, 53-level source state, MAP artifact standing, and next empirical frontier agree.

### Why this is the best next course

The project does not currently lack experiments; it lacks a stable comparison surface. Another level would be measured by a live bot even though a frozen ruler exists. Another MAP-Elites round would optimize on a six-layout/52-level benchmark while current `main` ships 53 levels, and would add a third artifact before the second has ledger standing. In both cases, the new result would increase evidence volume while preserving the ambiguity that makes results hard to compare.

This stabilization has higher decision value because it makes every later fork cheaper and interpretable: future level targets have a fixed meaning, stale candidate evidence has explicit disposition, MAP-Elites results name the exact level universe they cover, and the ledger/navigation surfaces stop disagreeing about what exists.

### Stopping condition

Stop the course when all of the following are externally true:

- a regression test proves candidate target derivation is invariant to live-bot default changes under one fixed calibration identity;
- the candidate corpus gate reports only the two deliberately preserved shipped-history failures, with unshipped Level 54 either current or explicitly retired, and no gate weakening;
- the ledger explicitly adjudicates Level 53 and `ab8ed417...` without promoting heuristic or pinned-revision evidence;
- regenerated `CURRENT.md`/Universe output contains no unintentional stale-navigation or ledger-admission warning;
- the exact branch/revision and clean status are recorded.

### Falsifier

The recommendation is falsified if a pre-existing test or direct source proves that `deriveCandidate` already passes `CALIBRATION_PARAMS` (the inspected code does not), or if the owner explicitly changes the project objective away from level authoring and baseline comparability. In the latter case, the best research alternative would be a separately frozen evaluation-universe expansion before more evolution, not another unchanged six-layout MAP-Elites round.

### Alternatives considered

1. **Run another fixed-axis MAP-Elites round now — reject for now.** It could estimate whether 23/25 occupancy repeats, but it would still select on six layouts, leave 20 of 23 cells without holdout, omit Level 53, and add evidence before the prior result has ledger standing. Useful later, after baseline convergence.
2. **Generate and ship more levels now — reject for now.** The generator and 450-game gate exist, but the live-bot authoring path makes target meaning drift, and Level 53's provisional 0.95 demand is not yet reconciled with the ledger. More candidates would compound the split.
3. **Resume exact Level 26 proof — reject under current scope.** The track is explicitly parked and remains numerically non-decisive; resumption is an owner decision and does not repair the active authoring/MAP evidence surface.

### Contradictions

- `CURRENT.md` says the generator is an open choice; current source contains the generator.
- `main` and its tests say Level 53 ships; the evidence ledger has no Level 53 record.
- The independent-round correction worklog says the artifact was admitted by that run, while the root ledger never admitted it. These are different admission scopes and should not share ambiguous wording.
- The latest artifact verifier passes at pinned revision `8508c3b` but fails on current main because protected `src/game.js` changed. Historical verification and current compatibility must remain separate.
- `solver/tests/receiptGate.test.js:143-146` still comments that Level 53 and 54 are current, while the same live test now fails both; the executable verdict and failure text control over the stale comment.

### Dead ends

- Re-running the current MAP verifier from current main cannot establish artifact corruption or validity because its protected-source contract intentionally fails after Level 53 changed `src/game.js`; the pinned verification packet is the valid historical oracle.
- The generated Universe Map is current and deterministic, but it is a projection, not authority; it cannot itself admit Level 53 or the newer archive.
- Backlog and handoff rankings were used only to locate code and receipts, not to establish proof standing.

### Gaps left by the bound

- No code or documentation changes were made beyond this read-only evidence ticket.
- No fresh level, MAP-Elites, policy, or exact-score experiment was run.
- The investigation did not locate an explicit standalone owner-decision record for Level 53 beyond the shipping ticket/tests/source history; ledger admission must adjudicate that rather than infer it.
- The best post-stabilization empirical program remains open: wider level-universe evaluation, more cell holdouts, learned evaluation, or broader human play evidence.

## Verification

1. PASS — `evidence`. Every cited path and line resolves at revision `90166907437c7b686f868be0e049325d97fb00f6`; claims preserve `owner_decision`, `heuristic_observation`, pinned artifact verification, current direct source, and unresolved standing separately.
2. PASS — `evidence`. The packet recommends exactly one course, compares three alternatives, and states its rationale, expected decision value, stopping condition, and falsifier.
3. PASS — `evidence`. Load-bearing claims trace to the ledger, current code/tests, fixed MAP receipts, or live command output; priority statements are labeled as inference. Contradictions, dead ends, and uncovered gaps are explicit.

## Feedback

- The highest-value discovery was not a new performance result but a boundary failure: current source, historical protected hashes, receipts, and root authority files are each internally legible but no longer describe one common baseline.
- The live MAP verifier failure is expected under its pinned-protection model, but the current control panel should make that revision boundary more prominent to prevent “verified artifact” from being read as “reverified on current main.”

## Risks

- Stabilization can sprawl into redesign. Keep it bounded to the existing `calib-1` contract, current candidate corpus, append-only ledger admission, and regenerated navigation; do not use it to invent a new calibration policy or MAP descriptor system.
- Wiring calibration changes future candidate measurements. It requires a before/after identity and regression proof, not silent receipt refreshes.
