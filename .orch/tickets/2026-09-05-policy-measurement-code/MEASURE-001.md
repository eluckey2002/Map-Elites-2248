---
id: MEASURE-001
run: 2026-09-05-policy-measurement-code
status: integrated
executor: orch-tdd
pack: orch-code-pack
independence: gate
depends_on: []
write_scope:
  - solver/human-benchmark.js
  - solver/benchmark-inputs.js
  - solver/benchmark-metrics.js
  - solver/benchmark-replay.js
  - solver/tests/humanBenchmark.test.js
  - solver/tests/policyBenchmark.test.js
  - docs/evaluation/POLICY-EVAL-0001/measurement-checks.md
bound: 85 minutes
claimed_by: /root/measurement_gpt_5_6_sol_high
claimed_at: 2026-09-06T01:21:00Z
---

## Objective

The human comparison CLI produces identity-bound, replay-validated, case-weighted descriptive comparisons conforming to POLICY-EVAL-0001.

## Fixed inputs

Spec: /Users/eluckey/Developer/research and games/2248-challenge/.orch/runs/2026-09-05-policy-measurement-code/spec.md, all fields and constraints binding.
Contract and manifest at the exact hashes in the spec; complete examples E01-E18.
Standards owner and craft: AGENTS.md and
/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md.
Workspace: supplied at dispatch; only that tree's code paths are writable.
Excluded: root code/docs writes, except this ticket's Result/Verification/Feedback/Risks;
no user interaction, subdelegation, pushing, merging, changing frozen subjects, or later stages.

Step 2 only under DECISION-0006 and the unchanged pinned four-step plan. Preserve POLICY-EVAL-0001 contract.md and inputs.json byte-for-byte. Do not edit src/game.js, solver/engine.js, solver/bot.js, solver/level-author.js, frozen evaluator, candidates, receipts, raw recordings, old experiments, existing gates, or the four known failure exemptions. No bot audit, policy tuning, fresh holdout selection, generalized strength claim, PR, push, or main merge. Existing selected recordings are a descriptive panel, not independent population samples. Every required input is accounted for; missingness is never silent. Make durable changes with apply_patch. One writer per tree; implementation owns an isolated worktree and only its root ticket result sections while root does read-only work. Full-suite comparison is by failure identity, not count.

## Completion test

1. C1: collect() and CLI consume the frozen contract/input identity, include dispositions for all 15 required paths in distinct receipt-bound and current-subject panels, reject modified/missing files or subjects and out-of-range seeds, and expose unexpected extra recordings without silently changing the frozen panel. Runnable oracle: node --test solver/tests/humanBenchmark.test.js solver/tests/policyBenchmark.test.js, actual filesystem good/bad twins from existing real corpus. deterministic, pre-existing specification.

2. C2: real-chain replay validates legality, values, scores, moves, first crossing, and bomb -> target -> budget -> no-legal-move precedence; false win, premature loss, post-terminal continuation, bad coordinates, mismatched seed, missing trace, and missing/forged subject bindings return unresolved, never crash-as-detection. Oracle: the same focused tests against POLICY-EVAL-0001 sections 2-4 and E08-E10/E15, source engine/game transition, real-file mutated copies. deterministic, pre-existing specification.

3. C3: paired live bot retains shipped chooseMove/defaults and original B, same subject/seed and separate live/lookahead RNG. Diagnostic uses external H equal to human moves without changing maxMoves; target-disabled completion is horizon-complete, true failures absorb final score with reason, mixed intent is disclosed, percentages reference bot and zero gives null. Oracle: focused tests with observable policy state/RNG plus real paired baseline and E11-E16; compatibility playBot(candidate,seed,{uncapped}) retained, extra fields allowed. deterministic, pre-existing specification.

4. C4: case/attempt weighting, canonical payload duplicates, fixed S, veto, new wins first, empty sets/ties/missingness and target-distinct identities conform to sections 4-6 and E01-E18; raw counts and metrics trace to rows and unresolved rows cannot become full-panel PASS. Oracle: focused tests with exact independent arithmetic E06=-1 rather than +0.5 and all declared examples. deterministic, pre-existing specification.

5. C5: node solver/human-benchmark.js and --json reproduce a descriptive baseline whose text agrees with raw classifications; all required real inputs have traceable dispositions and provenance. Pin raw JSON output identity with executable source commit in ticket; do not promote unresolved historical runtime into qualified evidence. Check no dropped inputs, panel counts, source/subject identities, score horizons, and terminal labels through the same public path. deterministic/evidence, pre-existing specification.

6. C6: node --test --test-reporter=spec solver/tests/*.test.js is no worse than recorded baseline by exact failure names; node tools/verify-experiments.js passes; git diff --check passes. Protect existing fixture-vs-real regression checks; do not fix known failures by exemptions. deterministic, pre-existing.

C7 is owned by the independent gate. Unit acceptance is provisional until that gate.
New tests are authored-here; independence enters through the gate. Exact expected
example results and source semantics were fixed before implementation.

## Return fields

Commit, changed_artifacts, commands/outcomes and exact failure identities,
red-then-green evidence, real good/bad input checks, raw baseline (message or artifact),
limits, compatibility changes. Write progress into this ticket as it is produced;
root will not edit it during the dispatch. Do not set terminal status.

## Result

In progress in isolated worktree `/private/tmp/2248-policy-measurement-2026-09-05`
at clean baseline `e0ed5a15f982b6584428de031f778ceb008c1d19`. Writer check found no
other process targeting this worktree; branch is
`work/policy-measurement-2026-09-05`. Frozen spec, ticket, code craft, and
gate-check contract have been read.

Verified slice 1 committed as `ace3a2e` (`Add policy benchmark identity and
metric core`): frozen-package hashes, canonical subject identity, uint32 seed
validation, case-then-attempt weighting, reliability/wins/fixed-S ordering,
score percentages, permanent real-file bad twin, and two gate-check cards.

Verified slice 2 committed as `18e72a6` (`Validate benchmark subjects and replay
semantics`): all 15 manifest rows resolve through recomputed candidate content
identity plus receipt or pinned current shipped subject; strict real-chain replay
and terminal ordering; separate live/lookahead RNG; external horizon retaining
original B; policy-failure distinction; and the ineligible-D correction with a
labeled joint-win diagnostic.

Verified slice 3 committed as `f47686f` (`Assemble frozen descriptive benchmark
panels`): `collect()` and both CLI renderings now use the 15-path manifest,
admitted/duplicate/unresolved dispositions, explicit extras, separate 12-file
receipt-bound and 3-file current-subject panels, traceable rows, case metrics,
and deterministic descriptive v2 labels.

Verified correction slice committed as `0f17452` (`Close benchmark contract edge
cases`): illegal live choices are policy failures before scoring; B=H score mode
is horizon-complete after bomb precedence; thrown measurement paths are
unresolved; initialized boards and post-initialization live-RNG draw positions
are preserved; behavior hashes/defaults and actual measurement-source hashes are
bound; text exposes T, B, crossings, regressions, score deltas/percent coverage;
and all E01-E18 expectations have permanent checks.

Verified output-flush slice committed as `f407d9c` (`Flush complete benchmark
JSON output`): the actual `--json` document grew beyond 64 KiB after preserving
initialized boards; the old immediate `process.exit()` truncated it at exactly
65,536 bytes. The CLI now lets stdout flush, and a permanent subprocess test
parses a document larger than that boundary.

Final commit chain from baseline `e0ed5a1`:

- `ace3a2e` Add policy benchmark identity and metric core
- `18e72a6` Validate benchmark subjects and replay semantics
- `f47686f` Assemble frozen descriptive benchmark panels
- `0f17452` Close benchmark contract edge cases
- `f407d9c` Flush complete benchmark JSON output

Changed artifacts are exactly:

- `solver/human-benchmark.js`
- `solver/benchmark-inputs.js`
- `solver/benchmark-metrics.js`
- `solver/benchmark-replay.js`
- `solver/tests/humanBenchmark.test.js`
- `solver/tests/policyBenchmark.test.js`
- `docs/evaluation/POLICY-EVAL-0001/measurement-checks.md`

Final raw JSON identity at clean `f407d9c8e85eb407fea3cb2483c1720e7d7daaec`:

- 220,783 bytes; SHA-256
  `d1a217242b0333906af2ed5c10775cd5edcca41d647852894c9f77ef6a042966`
- measurement-source identity
  `8d41e1b1a766de500d6a31b85b1771398a86b99a2adebd42e749e007dffaad65`;
  source tree state `clean`
- 15 admitted paths, 0 duplicate, 0 unresolved, 0 unexpected extras
- receipt-bound: 12 files, 12 attempts, 9 cases, `INELIGIBLE`, one lost
  reference win, primary D unavailable
- current-subject: 3 files, 3 attempts, 3 cases, `FASTER_ON_THIS_SET`,
  D = `1.3333333333333333`, no regressions
- score diagnostics remain separately labeled matched-horizon,
  mixed/unknown-intent diagnostics; they do not affect ordering.

## Verification

- Baseline identity: PASS — `git status --short --branch` was clean at
  `e0ed5a15f982b6584428de031f778ceb008c1d19`.
- Slice 1 RED: `node --test solver/tests/policyBenchmark.test.js` failed with
  `Cannot find module '../benchmark-inputs'` before implementation.
- Slice 1 GREEN: the same command passed 10/10 after implementation; the E06
  control returned exactly `-1`, and the appended-byte twin of real recording
  `1352aa7a...json` failed with `sha256-mismatch`.
- Gate-check: PROCEED at HARD local-instrument rung; cards and permanent
  negative tests are in `docs/evaluation/POLICY-EVAL-0001/measurement-checks.md`
  and `solver/tests/policyBenchmark.test.js`.
- Slice 2 RED: missing `benchmark-replay` made the expanded focused suite fail;
  a direct E02 assertion separately failed `8 !== null`, proving losing-attempt
  moves had entered primary D.
- Slice 2 GREEN: `node --test solver/tests/humanBenchmark.test.js
  solver/tests/policyBenchmark.test.js` passed 23/23. The real 15-row resolution
  control passed, and the forged receipt-key twin produced `candidate content
  identity mismatch` rather than resolving.
- Slice 3 RED: the replacement human benchmark tests rejected the legacy
  mutable-directory collector because `discoverRecordingPaths` and `renderText`
  were absent.
- Slice 3 GREEN: the combined focused suite passed 25/25; actual CLI text at
  `f47686f` accounted for 12 receipt-bound files / 9 cases and 3 current-subject
  files / 3 cases without pooling.
- Correction RED: six focused cases failed at `f47686f`, including illegal
  choice misclassified as win, B=H misclassified as out-of-moves, missing RNG
  position, unequal-horizon percentage, absent explicit defaults binding, and
  thrown harness error.
- Correction GREEN: `node --test solver/tests/policyBenchmark.test.js` passed
  26/26 at `0f17452`; `node --test solver/tests/humanBenchmark.test.js` passed
  6/6 immediately before the correction commit, and its changed output fields
  are covered by the fast suite and final CLI run.
- Output-flush RED: the actual `node solver/human-benchmark.js --json | <JSON
  parser>` failed `Unterminated string in JSON at position 65536`.
- Output-flush GREEN: the same public command produced and parsed the 220,783
  byte JSON document above; `node solver/human-benchmark.js` separately exited
  0 and printed matching panel verdicts/counts at `f407d9c`.
- Final focused oracle: `node --test solver/tests/humanBenchmark.test.js
  solver/tests/policyBenchmark.test.js` passed 32/32 at `0f17452`; the additional
  final public-path flush check passed at `f407d9c` and is permanent in the human
  benchmark suite.
- Final full suite: 377 tests, 372 pass, 5 fail. Four failure names exactly match
  the supplied 348-test baseline: `candidate-levels-52.json has a receipt that
  verifies against the current bot`; `candidate-levels-54.json has a receipt
  that verifies against the current bot`; `the builder is byte-stable and the
  committed generated views are current`; `verification observations derive
  from rebound evidence instead of copied metrics in code`. The only additional
  failure is `LIVE: no linked worktree is holding uncommitted .orch state`,
  naming the root-owned run worklog and this required durable ticket. Re-run
  after root commits/integrates its bookkeeping to close C6 by exact identity.
- `node tools/verify-experiments.js`: PASS (`EXPERIMENT GATE PASS`).
- `git diff --check`: PASS. Worktree is clean at `f407d9c`.
- Frozen inputs unchanged: contract SHA-256
  `3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f`;
  inputs SHA-256
  `1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb`.

## Feedback

- The required full-board/RNG evidence made JSON exceed a common pipe-buffer
  boundary; the real CLI control found truncation that direct object tests could
  not. Keeping the subprocess parser is warranted despite its runtime cost.

## Risks

Root join: implementation return integrated provisionally at
`f407d9c8e85eb407fea3cb2483c1720e7d7daaec`; child completed and released its
write lease. Acceptance awaits independent gate and clean-bookkeeping C6 rerun.

- C6 remains provisional solely because the root checkout's required `.orch`
  bookkeeping is uncommitted during this dispatch; the fifth exact failure is
  named above. No scoped code/test path is dirty.
- The selected panels are descriptive and already inspected, not independent
  population samples or promotion evidence. Ordinary-play rows are labeled
  current-subject replay and do not establish historical runtime identity.
- Candidate resolution verifies content/receipt binding without regenerating or
  upgrading stale calibration receipts; the two known stale receipt failures
  remain intact.
