# Step 2 executable measurement spec

- run: 2026-09-05-policy-measurement-code
- objective: The human comparison CLI produces identity-bound, replay-validated, case-weighted descriptive comparisons conforming to POLICY-EVAL-0001.
- routing: pack = orch-code-pack
- target repository: /Users/eluckey/Developer/research and games/2248-challenge
- standards owner: AGENTS.md; docs/evaluation/POLICY-EVAL-0001/contract.md; existing Node CommonJS idiom; experiments/README.md.
- bound: 120 minutes, one implementation item, one independent review-fix gate with at most one correction pass.
- plan_gate: false (owner explicitly said proceed with accepted Step 2).
- non_goals: Steps 3-4, changes to gameplay/reference, generalizing experiment, promotion, external shipping.

## binding_constraints

Step 2 only under DECISION-0006 and the unchanged pinned four-step plan. Preserve POLICY-EVAL-0001 contract.md and inputs.json byte-for-byte. Do not edit src/game.js, solver/engine.js, solver/bot.js, solver/level-author.js, frozen evaluator, candidates, receipts, raw recordings, old experiments, existing gates, or the four known failure exemptions. No bot audit, policy tuning, fresh holdout selection, generalized strength claim, PR, push, or main merge. Existing selected recordings are a descriptive panel, not independent population samples. Every required input is accounted for; missingness is never silent. Make durable changes with apply_patch. One writer per tree; implementation owns an isolated worktree and only its root ticket result sections while root does read-only work. Full-suite comparison is by failure identity, not count.

## evidence

Base 1a01263 (clean). Contract freeze e415df78b77a8f32ec2d97912ccd198bfaad2d21:
contract SHA-256 3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f;
inputs SHA-256 1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb.
All three reviewed artifacts match Git; all 27 source/recording hashes rechecked at intake.
Primary corpus/config/source paths are listed in inputs.json. Grounding sources and
contradictions at 505a6be: .orch/runs/2026-09-05-policy-grounding/report.md and its
recording-diagnostic.json, archive-diagnostic.json, pilot-position.json. No new theory inferred.
Existing human-benchmark collect/playBot and recording-replay candidateIndex/replay are
primary implementation seams; candidateIndex currently trusts receipt keys without rehash.

## acceptance

1. C1: collect() and CLI consume the frozen contract/input identity, include dispositions for all 15 required paths in distinct receipt-bound and current-subject panels, reject modified/missing files or subjects and out-of-range seeds, and expose unexpected extra recordings without silently changing the frozen panel. Runnable oracle: node --test solver/tests/humanBenchmark.test.js solver/tests/policyBenchmark.test.js, actual filesystem good/bad twins from existing real corpus. deterministic, pre-existing specification.

2. C2: real-chain replay validates legality, values, scores, moves, first crossing, and bomb -> target -> budget -> no-legal-move precedence; false win, premature loss, post-terminal continuation, bad coordinates, mismatched seed, missing trace, and missing/forged subject bindings return unresolved, never crash-as-detection. Oracle: the same focused tests against POLICY-EVAL-0001 sections 2-4 and E08-E10/E15, source engine/game transition, real-file mutated copies. deterministic, pre-existing specification.

3. C3: paired live bot retains shipped chooseMove/defaults and original B, same subject/seed and separate live/lookahead RNG. Diagnostic uses external H equal to human moves without changing maxMoves; target-disabled completion is horizon-complete, true failures absorb final score with reason, mixed intent is disclosed, percentages reference bot and zero gives null. Oracle: focused tests with observable policy state/RNG plus real paired baseline and E11-E16; compatibility playBot(candidate,seed,{uncapped}) retained, extra fields allowed. deterministic, pre-existing specification.

4. C4: case/attempt weighting, canonical payload duplicates, fixed S, veto, new wins first, empty sets/ties/missingness and target-distinct identities conform to sections 4-6 and E01-E18; raw counts and metrics trace to rows and unresolved rows cannot become full-panel PASS. Oracle: focused tests with exact independent arithmetic E06=-1 rather than +0.5 and all declared examples. deterministic, pre-existing specification.

5. C5: node solver/human-benchmark.js and --json reproduce a descriptive baseline whose text agrees with raw classifications; all required real inputs have traceable dispositions and provenance. Pin raw JSON output identity with executable source commit in ticket; do not promote unresolved historical runtime into qualified evidence. Check no dropped inputs, panel counts, source/subject identities, score horizons, and terminal labels through the same public path. deterministic/evidence, pre-existing specification.

6. C6: node --test --test-reporter=spec solver/tests/*.test.js is no worse than recorded baseline by exact failure names; node tools/verify-experiments.js passes; git diff --check passes. Protect existing fixture-vs-real regression checks; do not fix known failures by exemptions. deterministic, pre-existing.

7. C7: independent code gate against pack lens and standards owner finds no blocking correctness, contract, scope, or unnecessary-complexity defect. New/modified admission checks have a gate-check card and executed permanent negative tests; these are local instrument checks, no Challenge Receipt inflation. judged, gate.

## affected_surfaces

solver/human-benchmark.js; solver/benchmark-inputs.js; solver/benchmark-metrics.js;
solver/benchmark-replay.js; solver/tests/humanBenchmark.test.js;
solver/tests/policyBenchmark.test.js;
docs/evaluation/POLICY-EVAL-0001/measurement-checks.md.
Root run/ticket bookkeeping and raw outputs live in .orch. Supporting new modules
are optional; avoid parallel alternative implementations and unnecessary abstraction.

## exemplars

solver/tests/humanBenchmark.test.js at 1a01263: CommonJS, node:test and assert/strict,
public collect/playBot calls, real-corpus checks. Do not imitate its incorrect
"independent boards" premise. solver/tests/recordingReplay.test.js at 1a01263:
permanent legal-but-wrong and altered-coordinate controls with asserted specific reasons.

## risks and assumptions

Historical candidate indexes require receipt/content validation, not mere key lookup.
Existing replay omits terminal-order checks; wrap or supersede for this instrument
without altering the global helper unless scope is amended. Candidate receipt staleness
from unrelated engine revisions must not be cleared by regenerating receipts.
Contract engineering definitions are settled; any genuine missing choice is a gap,
not authority to edit the frozen contract. Complete-panel unresolved may coexist with
known regression evidence; do not conceal either. Descriptive outputs are not newly
admitted generalized results. Three startup commands are running; root supplies final
baseline failure identities before the gate.
