---
id: admissible-upper-bound
run: level26-certified-score-2026-08-10
status: complete
executor: deliver-goal-slice
profile: orch-worker
independence: gate
depends_on: []
write_scope:
  - solver/upper-bound.js
  - solver/tests/upper-bound.test.js
  - solver/README.md
bound: 35 minutes
claimed_by: /root/admissible_upper_bound_gpt_5_6_sol_high
claimed_at: 2026-08-10T06:39:33-05:00
excluded_actions:
  - Modify src/game.js, level data, scoring, spawn rules, target, player UI, or existing exact-score artifacts.
  - Present a heuristic or incomplete search as an upper bound.
---

## Objective

Implement and validate a deterministic, admissible upper-bound decomposition
for the frozen Level 26 seed-0 score search, then report its actual bound and
whether it decides the 13,000 target.

## Fixed inputs

- Rule authority: `src/game.js`; rule mirror: `solver/engine.js`.
- Frozen replay and exhaustive small-board oracle: `solver/exact-score.js` and
  `solver/tests/exact-score.test.js`.
- Existing durable SMT certifier and its frozen input identity:
  `solver/certify-level26.py` and ticket
  `certify-frozen-seed.md` in this run directory.
- Run context: `.orch/runs/level26-certified-score-2026-08-10/worklog.md`.
- Fixed seed/level: Level 26, seed 0 only; target 13,000, 32 moves, 5x8,
  minChain 4, no blockers.

## Completion test

1. The new upper-bound transition/search is demonstrably admissible on at
   least two small frozen fixtures whose physical maxima are found by
   `solveExactPosition`: every asserted upper bound is greater than or equal
   to its exact physical maximum. Oracle:
   `node --test solver/tests/upper-bound.test.js` exit code. oracle_class:
   deterministic. provenance: pre-existing.
2. A negative control in the same test suite shows the oracle would reject an
   intentionally lowered bound for a known fixture. Oracle:
   `node --test solver/tests/upper-bound.test.js` exit code. oracle_class:
   deterministic. provenance: pre-existing.
3. The Level-26 seed-0 bound calculation completes under the chosen stated
   finite bound, emits its assumptions and input identity, and is honestly
   classified as either a certified upper bound or non-decisive. Oracle:
   documented command and JSON output. oracle_class: deterministic.
   provenance: pre-existing.
4. The complete JavaScript solver suite passes. Oracle:
   `node --test solver/tests/*.test.js` exit code. oracle_class:
   deterministic. provenance: pre-existing.

## Return fields

- `changed_artifacts`
- `admissibility_fixtures`
- `negative_control`
- `level26_upper_bound`
- `target_comparison`
- `commands_and_outputs`
- `residual_or_handoff`

## Result

- `changed_artifacts`: `solver/upper-bound.js`,
  `solver/tests/upper-bound.test.js`, and the deterministic-upper-bound
  section of `solver/README.md`.
- Implemented a complete dynamic program over the finite relaxation state
  `(moves remaining, frozen spawn cursor)`. For every relaxed chain length
  from `minChain` through board capacity, it awards the shipped multiplier
  against the entire current board mass, then advances the frozen cursor by
  `length - 1`. This over-approximates a physical move because chain value is
  at most board mass; merges conserve mass; and a physical length-`L` merge
  consumes exactly `L - 1` spawn values. Geometry, value compatibility,
  blocker restrictions, and move existence are discarded, so no physical
  continuation is excluded.
- `admissibility_fixtures`: the one-move `[2,2,4,4]` fixture has exact
  physical maximum 18 and bound 18; the distinct multiplier-tier fixture
  `[2,2,4,4,8]` has exact physical maximum 40 and bound 40. Both maxima come
  from the pre-existing `solveExactPosition` oracle.
- `negative_control`: the suite constructs 17 as an intentionally lowered
  bound for the exact-18 fixture and asserts that the admissibility assertion
  rejects it.
- `level26_upper_bound`: 326,390, classified
  `certified-mass-cursor-upper-bound`, `complete: true`. The calculation used
  17,888 memo states and 661,856 transitions under the stated 50,000-state
  fail-closed cap. Frozen input identity:
  `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
- `target_comparison`: **non-decisive**. 326,390 is above 13,000, so this
  relaxation proves neither reachability nor unreachability. It is not a
  witness and is not an achievable score.

## Verification

1. PASS — `node --test solver/tests/upper-bound.test.js` exited 0: 4 tests,
   4 passed. The exact-18 and exact-40 physical fixtures are each no greater
   than their calculated bounds (18 and 40 respectively).
2. PASS — the same command's negative-control test passed by observing that
   the exact-18 fixture rejects the intentionally lowered candidate 17.
3. PASS — `node solver/upper-bound.js` exited 0 and emitted deterministic
   JSON with `complete: true`, `score: 326390`, `target: 13000`,
   `targetComparison: "non-decisive"`, the frozen identity above, all five
   assumptions, a 32-length relaxation witness, the 50,000-state cap, and
   stats `{visited:17888,memoHits:602640,transitions:661856}`.
4. PASS — `node --test solver/tests/*.test.js` exited 0: 66 tests, 66 passed,
   0 failed.

## Feedback

- The mass/cursor decomposition terminates quickly and gives a compact,
  auditable soundness argument. Its deliberate removal of value compatibility
  makes it far too loose to decide this target.

## Risks

- A sound relaxation may remain above 13,000 and therefore improve pruning
  without deciding the main goal.
- The bound must over-approximate every physical legal future; a lower
  heuristic is not an acceptable substitute.
- Realized risk: the certified bound is 326,390, well above the target. It
  cannot replace the suspended exact SMT proof and must not be described as
  achievable.

## Handoff

- `residual_or_handoff`: Target status remains unresolved. A subsequent lane
  needs a strictly tighter sound abstraction that retains at least value-class
  compatibility or a completed exact proof. This result can safely serve as
  an outer bound or branch-and-bound tail oracle, but by itself it does not
  decide 13,000.
- Reproduce the bound with `node solver/upper-bound.js`; reproduce all new
  fixture evidence with `node --test solver/tests/upper-bound.test.js`; run
  the full JavaScript regression oracle with
  `node --test solver/tests/*.test.js`.
