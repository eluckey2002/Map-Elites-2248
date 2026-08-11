---
id: hinted-threshold-feasibility
run: level26-certified-score-2026-08-10
status: complete
executor: deliver-goal-slice
profile: orch-worker
independence: gate
depends_on: []
write_scope:
  - solver/hinted-cp-sat/
  - solver/tests/hinted-cp-sat.test.js
  - solver/README.md
bound: 45 minutes
claimed_by: /root/hinted_threshold_feasibility_gpt_5_6_sol_high
claimed_at: 2026-08-10T14:27:55-05:00
excluded_actions:
  - Modify src/game.js, level data, scoring, spawn rules, target, player UI, or existing certifier files.
  - Treat threshold timeout/miss as an upper bound or an exact maximum.
---

## Objective

Use the independently replayed 12,336 seed-0 witness as a validated starting
point for a separate hinted CP-SAT threshold escalation, and determine whether
it can produce a replayed `score >= 13000` witness within its stated budget.

## Fixed inputs

- Rule authority: `src/game.js`; headless/replay mirror: `solver/engine.js`
  and `solver/exact-score.js`.
- Existing CP-SAT formulation is read-only input:
  `solver/alternative-certifier.py` and its suspended ticket.
- Frozen source identity:
  `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
- Starting witness: `solver/target-witness-search/frozen-run.json`, verified
  score 12,336, 32 moves, cursor 520, target false.
- Scope: Level 26 seed 0 only (5x8, 32 moves, min chain 4, target 13,000,
  no blockers).

## Completion test

1. The hint trace is independently replayed at 12,336 before model use, and
   the hinted CP-SAT model accepts/replays it at threshold 12,336. Oracle:
   documented deterministic command/output. oracle_class: deterministic.
   provenance: pre-existing.
2. A small fixture proves the hinted runner retains the 18/19 decision and
   column-major spawn order. Oracle: documented fixture command/output.
   oracle_class: deterministic. provenance: pre-existing.
3. A finite threshold schedule records SAT, UNSAT, or UNKNOWN at every
   attempted score and emits/replays every SAT witness. The schedule includes
   13,000. Oracle: documented command/JSON. oracle_class: deterministic.
   provenance: pre-existing.
4. A target hit is labeled a reachability witness only; a non-hit preserves
   all UNKNOWNs as non-decisive. Oracle: emitted result/ticket. oracle_class:
   evidence. provenance: pre-existing.

## Return fields

- `changed_artifacts`
- `starting_witness_verdict`
- `fixture_verdict`
- `threshold_results`
- `target_reached`
- `commands_and_outputs`
- `residual_or_handoff`

## Result

**Delivery classification: REALIZED.** The bounded hinted-threshold experiment
is complete. The separate wrapper imports the read-only alternative CP-SAT
transition formulation, adds a full replay-derived solution hint, and sends
the starting trace and every SAT threshold output through a separate
Node/headless replay gate before retaining them.

The starting witness independently replays at score 12,336, 32 moves, cursor
520, target false, on frozen SHA-256
`edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
The hinted model accepts that exact fixed trace as SAT at threshold 12,336,
and its emitted witness independently replays to the same values. The
deterministic fixture reports `score >= 18` SAT, `score >= 19` UNSAT, and the
column-major post-spawn board `[2,8,4,12]`.

The finite 30-second-per-solve schedule returned replayed SAT at 12,336 and
UNKNOWN at 12,400, 12,600, 12,800, and 13,000. No score or witness is attached
to any UNKNOWN. The 13,000 target was not reached within this budget; that is
non-decisive about reachability and makes no maximum or upper-bound claim.

- `changed_artifacts`: `solver/hinted-cp-sat/runner.py`,
  `solver/hinted-cp-sat/replay-witness.js`,
  `solver/hinted-cp-sat/verify-result.js`,
  `solver/hinted-cp-sat/requirements.txt`,
  `solver/hinted-cp-sat/frozen-run.json`,
  `solver/tests/hinted-cp-sat.test.js`, `solver/README.md`, and this ticket's
  result sections.
- `starting_witness_verdict`: PASS — independent replay is score 12,336, 32
  moves, cursor 520, target false; fixed hinted-model acceptance is SAT and
  `matchesStartingWitness: true`.
- `fixture_verdict`: PASS — 18 SAT, 19 UNSAT, column-major board
  `[2,8,4,12]`.
- `threshold_results`: 12,336 SAT/replayed; 12,400 UNKNOWN; 12,600 UNKNOWN;
  12,800 UNKNOWN; 13,000 UNKNOWN.
- `target_reached`: false. No replayed `score >= 13000` witness was produced.
- `commands_and_outputs`: recorded under Verification below.
- `residual_or_handoff`: the 12,336 witness remains a replayed lower witness.
  All four higher-threshold results, including 13,000, are bounded UNKNOWNs;
  they do not decide target reachability and must not be promoted into a
  maximum, upper bound, or unreachability result.

## Verification

1. PASS — `node solver/target-witness-search/verify.js
   solver/target-witness-search/frozen-run.json` exited 0 with `PASS`, score
   12,336, 32 moves, cursor 520, and target false. The separate command
   `/private/tmp/level26-hinted-cp-sat.BVU7Oy/bin/python
   solver/hinted-cp-sat/runner.py --base-model --timeout-seconds 20` exited 0
   with hinted-model `SAT`, score 12,336, 32 moves, cursor 520,
   `matchesStartingWitness: true`, independent replay `PASS`, and CP-SAT wall
   time 0.800210 seconds.
2. PASS — `/private/tmp/level26-hinted-cp-sat.BVU7Oy/bin/python
   solver/hinted-cp-sat/runner.py --fixture --timeout-seconds 20` exited 0
   with `{"columnMajorAfter":[2,8,4,12],"scoreGe18":"SAT",
   "scoreGe19":"UNSAT","verdict":"PASS"}`.
3. PASS — `/private/tmp/level26-hinted-cp-sat.BVU7Oy/bin/python
   solver/hinted-cp-sat/runner.py --run --timeout-seconds 30 --schedule
   12336,12400,12600,12800,13000 --output
   solver/hinted-cp-sat/frozen-run.json` exited 0. Threshold results and
   CP-SAT wall times were: 12,336 SAT/replayed score 12,336, 32 moves, cursor
   520 (0.514771s); 12,400 UNKNOWN (31.598964s); 12,600 UNKNOWN (31.791174s);
   12,800 UNKNOWN (34.027914s); 13,000 UNKNOWN (34.946874s). The result
   artifact SHA-256 is
   `5c076a3bbb8b58fc4d1f408b1b35b72f168194cb2101ad0bc977733cb8402b24`.
4. PASS — `node solver/hinted-cp-sat/verify-result.js
   solver/hinted-cp-sat/frozen-run.json` exited 0 with verifier `PASS`, replayed
   starting witness 12,336/32/520, fixture PASS, normalized threshold sequence
   `SAT,UNKNOWN,UNKNOWN,UNKNOWN,UNKNOWN`, and `targetReached:false`.
   `HINTED_CP_SAT_PYTHON=/private/tmp/level26-hinted-cp-sat.BVU7Oy/bin/python
   node --test solver/tests/hinted-cp-sat.test.js` passed 3/3. The full solver
   suite with that interpreter plus `ALTERNATIVE_CERTIFIER_PYTHON` passed
   71/71 with 0 failures and 0 skipped. Python byte-compilation also passed.

## Feedback

- The shared checkout already contains unrelated and concurrent uncommitted
  solver work, including `solver/README.md`; this lane will preserve it and
  restrict edits to its authorized paths plus these ticket sections.
- The system `python3` does not have OR-Tools installed. A disposable external
  virtual environment is required for this bounded run and will be removed
  before handoff.
- The first unconstrained schedule attempt at 12,336 returned `UNKNOWN` even
  though the separately fixed hinted trace was SAT. The schedule now treats
  12,336 as its validated fixed starting rung and uses ordinary hints only for
  higher threshold searches; this distinction is explicit in the JSON.
- The first durable-verifier pass compared JSON object serialization and
  rejected an otherwise identical replay because Python had sorted its keys.
  Verification now compares the replay receipt field by field.

## Risks

- A hint outside the target constraint can guide a search but is not itself a
  satisfying target witness.
- Threshold search may identify intermediate SAT scores yet still not decide
  13,000; only a replayed target witness changes reachability.
- CP-SAT wall time can exceed the nominal parameter slightly because solver
  shutdown and reporting are not instantaneous; the recorded values remain
  within the 45-minute ticket bound.
- Reusing the base trace as hints does not force higher-threshold feasibility.
  Each higher threshold must independently return SAT and survive replay.

## Handoff

Resume from `solver/hinted-cp-sat/frozen-run.json` and verify it with
`node solver/hinted-cp-sat/verify-result.js
solver/hinted-cp-sat/frozen-run.json`. The durable result is a replayed SAT
starting rung at 12,336 followed by four UNKNOWN higher rungs through 13,000.
The experiment completed as specified but did not produce a target witness;
reachability remains unresolved. Preserve that distinction and never report
the bounded UNKNOWNs as a maximum, upper bound, or proof of unreachability.
