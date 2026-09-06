---
id: MEASURE-001
run: 2026-09-05-policy-measurement-code
status: ready
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
claimed_by: null
claimed_at: null
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

Pending.

## Verification

Pending.

## Feedback

[]

## Risks

See spec. Existing four deliberate failures remain outside repair scope.
