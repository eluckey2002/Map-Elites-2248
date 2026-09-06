---
id: REPAIR-001
run: 2026-09-06-policy-trajectory-instrument
status: needs-verify
executor: orch-repair
pack: orch-code-pack
profile: orch-worker
independence: gate
depends_on: [GATE-001]
write_scope: [solver/trajectory-audit.js, solver/tests/trajectoryAudit.test.js, docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md]
bound: 8 minutes
claimed_by: /root/trajectory_build_gpt_5_6_sol_high
claimed_at: 2026-09-06T08:41:26Z
---

## Objective

The gate's ONE correction pass: fix only its three validated causes, with
permanent exact counterexamples, then return for affected independent verification.

## Fixed inputs

GATE-001 Feedback and independent repro evidence are the accepted defect set.
Target worktree /private/tmp/2248-trajectory-instrument.dX4Rcr at0c6b250;
canonical ROOT tickets under this run. Frozen spec unchanged, A1-A6 by reference.
Follow orch-repair and gate-check; preserve all protected files and plan.

## Completion test

F1/A3: Replay the selected action under the verified position/live RNG; an
already-winning production action cannot receive a miss cause merely because
the exhaustive witness differs. Emit unresolved for ambiguous override-pool
attribution, without widening or editing protected chooser sources. Retain
exact 2x2/seed0 good counterexample and attribution-stage coverage.
F2/A2,A4: Contain clock/search faults as UNKNOWN with requested dispositions,
denominators, declared limits and truthful telemetry; test initial and final
clock faults through public search/consumer paths, not only helper assertions.
F3/A1,A4: Reject legitimate producer-created empty 1x1/no-legal sessions as
UNRESOLVED, separately from corrupted/truncated nonempty recordings. Retain
the exact permanent producer-file control and make card scope truthful.
Run focused named command from spec, experiment gate, diff check and full
solver suite at clean committed result; compare exact known failure identities.
No ticket writes during custody tests: coordinate root ticket lease release
if bookkeeping has changed. Producer-authored tests still require downstream
affected independent verification; do not mark delivery accepted.

## Return fields

Fixed commit(s), exact changed artifacts, per-F1-F3 rerun evidence/covers,
focused/full counts and exact failure titles, preserved hashes, queued limits,
and explicit release of worktree plus ROOT ticket leases. Record raw command
outcomes in ticket; if raw output only exists in tool transcript, name it.

## Result

Correction committed as `bbf5fdec2553717c23bece400531cd619cdb2486`
(`Repair trajectory audit qualification defects`). Exact changed artifacts are
the same three granted paths: `solver/trajectory-audit.js`,
`solver/tests/trajectoryAudit.test.js`, and
`docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md`.

- F1: the public consumer now replays the production-selected action from the
  verified position and live RNG state. The exact subject-9001/seed-0 producer
  artifact retains a different exhaustive witness but reports
  `production-choice` because the selected action also reaches target. Bomb and
  immediate-target override traces that do not establish the relevant offered
  pool now return `unresolved`; normal-stage ranking/generation coverage remains.
- F2: initial, traversal, and final clock/search faults are caught at the search
  seam and returned as `UNKNOWN` with declared limits, known telemetry, and a
  `fault` reason. Public-consumer controls retain requested position dispositions
  and denominators when the injected clock throws.
- F3: a legitimate untouched `recordSession` artifact for the exact 1x1,
  no-legal, seed-0 subject is rejected as `UNRESOLVED` because it contains no
  auditable positions. This remains distinct from the existing corrupted and
  truncated nonempty controls. The check card now states the nonempty scope and
  actual producer-empty, clock-fault, and already-winning-production controls.

All protected hashes are preserved: `src/game.js` `22ebc237...`,
`solver/engine.js` `0ed4b310...`, `solver/level-author.js` `c0eef4a5...`,
`solver/bot.js` `3efd50ce...`, `solver/record-session.js` `c14ec394...`,
`solver/benchmark-replay.js` `a714232d...`, `solver/benchmark-inputs.js`
`970217cc...`, and `solver/targeted-chain-generator.js` `45eb66c7...`.

## Verification

Producer rerun result: **F1-F3 PASS at fixed commit `bbf5fde`; downstream
affected independent verification remains required.**

- Red: the four named repaired controls failed 4/4 at `0c6b250`: ambiguous
  override returned `control-flow`; selected transition was absent and the
  already-winning production case could not be recognized; initial clock fault
  threw; untouched producer zero-move artifact returned `VERIFIED`.
- Green focused command: `node --test solver/tests/trajectoryAudit.test.js
  solver/tests/botVision.test.js solver/tests/policyBenchmark.test.js` — 45
  tests, 45 pass, 0 fail.
- `node tools/verify-experiments.js` — `EXPERIMENT GATE PASS`.
- `git diff --check c8ad993..HEAD` — exit 0, no output.
- Clean full suite: `node --test --test-reporter=spec solver/tests/*.test.js` —
  395 tests, 391 pass, 4 fail, duration 82202.431166 ms. Exact unchanged failure
  titles: `candidate-levels-52.json has a receipt that verifies against the
  current bot`; `candidate-levels-54.json has a receipt that verifies against
  the current bot`; `the builder is byte-stable and the committed generated
  views are current`; `verification observations derive from rebound evidence
  instead of copied metrics in code`. No new failure identity appeared.
- Raw focused output is in this agent's tool transcript. Raw full output is only
  in unified exec session `74707`, chunks `af91a5` and `2873dc`; no output file
  was created.

## Feedback

Root join08:45:23Z: matching claimant returned within bound, released both
leases, and changed exactly three allowed files. Producer checks atbbf5fde
cover F1-F3; independent affected verification is the only qualification gap.

Owner stopped the prior claim before any repair edits landed. On approving the
read-only accounting, owner authorized one20minute correction-and-verification
attempt starting08:41:26Z, hardstop09:01:26Z. This supersedes the old interrupted
delivery time bound, not its scope or criteria. Worker8minute slice now ends
08:49:26Z; remaining time is reserved for independent checks and closeout.

One combined correction only; surviving defects return as findings, never a
second correction. Root integrated build blobs unchanged at7a06ab5.

No additional defect was repaired or queued by this producer. Independent
affected review owns qualification of the corrected seams.

## Risks

- Producer-authored negatives do not independently qualify the instrument.
  Override-pool ambiguity is deliberately `unresolved`; protected chooser
  internals were not widened. No fresh audit sample, protocol, policy,
  PR/push/main, Atlas, protected-source change, or scope expansion occurred.
