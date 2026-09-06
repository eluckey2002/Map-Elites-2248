# Measurement worklog

## goal

Objective: The human comparison CLI produces identity-bound, replay-validated, case-weighted descriptive comparisons conforming to POLICY-EVAL-0001.

1. C1: collect() and CLI consume the frozen contract/input identity, include dispositions for all 15 required paths in distinct receipt-bound and current-subject panels, reject modified/missing files or subjects and out-of-range seeds, and expose unexpected extra recordings without silently changing the frozen panel. Runnable oracle: node --test solver/tests/humanBenchmark.test.js solver/tests/policyBenchmark.test.js, actual filesystem good/bad twins from existing real corpus. deterministic, pre-existing specification.

2. C2: real-chain replay validates legality, values, scores, moves, first crossing, and bomb -> target -> budget -> no-legal-move precedence; false win, premature loss, post-terminal continuation, bad coordinates, mismatched seed, missing trace, and missing/forged subject bindings return unresolved, never crash-as-detection. Oracle: the same focused tests against POLICY-EVAL-0001 sections 2-4 and E08-E10/E15, source engine/game transition, real-file mutated copies. deterministic, pre-existing specification.

3. C3: paired live bot retains shipped chooseMove/defaults and original B, same subject/seed and separate live/lookahead RNG. Diagnostic uses external H equal to human moves without changing maxMoves; target-disabled completion is horizon-complete, true failures absorb final score with reason, mixed intent is disclosed, percentages reference bot and zero gives null. Oracle: focused tests with observable policy state/RNG plus real paired baseline and E11-E16; compatibility playBot(candidate,seed,{uncapped}) retained, extra fields allowed. deterministic, pre-existing specification.

4. C4: case/attempt weighting, canonical payload duplicates, fixed S, veto, new wins first, empty sets/ties/missingness and target-distinct identities conform to sections 4-6 and E01-E18; raw counts and metrics trace to rows and unresolved rows cannot become full-panel PASS. Oracle: focused tests with exact independent arithmetic E06=-1 rather than +0.5 and all declared examples. deterministic, pre-existing specification.

5. C5: node solver/human-benchmark.js and --json reproduce a descriptive baseline whose text agrees with raw classifications; all required real inputs have traceable dispositions and provenance. Pin raw JSON output identity with executable source commit in ticket; do not promote unresolved historical runtime into qualified evidence. Check no dropped inputs, panel counts, source/subject identities, score horizons, and terminal labels through the same public path. deterministic/evidence, pre-existing specification.

6. C6: node --test --test-reporter=spec solver/tests/*.test.js is no worse than recorded baseline by exact failure names; node tools/verify-experiments.js passes; git diff --check passes. Protect existing fixture-vs-real regression checks; do not fix known failures by exemptions. deterministic, pre-existing.

7. C7: independent code gate against pack lens and standards owner finds no blocking correctness, contract, scope, or unnecessary-complexity defect. New/modified admission checks have a gate-check card and executed permanent negative tests; these are local instrument checks, no Challenge Receipt inflation. judged, gate.

## spec

.orch/runs/2026-09-05-policy-measurement-code/spec.md

## tickets

.orch/tickets/2026-09-05-policy-measurement-code/

## iterations

- Intake: predecessor Git bytes and 27 hashes PASS. Root clean at 1a01263;
  log/reflog unchanged, only root Codex/tool children plus play/vision servers and
  memory service in this checkout. Startup suite (session 66033), curve (29121),
  old benchmark (8154) running, tracked for baseline only. Fixed-spec question
  answered by source inspection: collect trusts raw outcomes, misses ordinary play,
  weights files and changes objectives/horizons; recording-replay lacks terminal
  checks and candidateIndex alone is not content validation. Confidence direct source.
- Decomposition: one end-to-end public comparison item MEASURE-001, no artificial
  layer slicing, C1-C6 mapped to it and C7 to gate; no uncovered remainder/decision gap.

## failed_approaches

- None in implementation. Intake guessed pack paths were absent; resolved through
  pack inventory. Large combined output was truncated; relevant reads narrowed.

## blame_classes

[]

## queued_scope

[]

## terminal
