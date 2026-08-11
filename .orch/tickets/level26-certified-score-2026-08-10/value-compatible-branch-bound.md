---
id: value-compatible-branch-bound
run: level26-certified-score-2026-08-10
status: suspended
executor: deliver-goal-slice
profile: orch-worker
independence: gate
depends_on: []
write_scope:
  - solver/physical-branch-bound/
  - solver/README.md
bound: 55 minutes
claimed_by: /root/value_compatible_branch_bound_gpt_5_6_sol_high
claimed_at: 2026-08-10T06:57:59-05:00
excluded_actions:
  - Modify src/game.js, level data, scoring, spawn rules, target, player UI, or existing solver artifacts.
  - Prune a physical state using a heuristic, incomplete relaxation, or a non-strict upper bound.
---

## Objective

Build a sound exact physical-search decomposition for frozen Level 26 seed 0
that uses a value-compatible relaxed tail bound to prune branches; either
decide `score >= 13000` or return auditable pruning/coverage statistics and a
precise handoff.

## Fixed inputs

- Rule authority: `src/game.js`; headless behavior: `solver/engine.js`.
- Frozen replay/oracle: `solver/exact-score.js` and its current tests.
- Exact Z3 and CP-SAT formulations, their common frozen identity, and their
  suspended handoffs: `certify-frozen-seed.md` and
  `alternative-exact-feasibility.md` in this run.
- Existing mass/cursor outer bound: `solver/upper-bound.js` and its complete
  ticket. It is sound but too loose; retain value compatibility in the new
  tail abstraction.
- Scope: Level 26 seed 0 only (5x8, 32 moves, min chain 4, target 13000,
  no blockers).

## Completion test

1. On small frozen fixtures, physical action enumeration plus the branch
   search reproduces `solveExactPosition`'s exact maximum. Oracle: documented
   deterministic fixture command. oracle_class: deterministic. provenance:
   pre-existing.
2. The value-compatible tail calculation is proven admissible on at least two
   small physical fixtures, and a negative control demonstrates rejection of
   a deliberately-too-low tail bound. Oracle: documented fixture command and
   output. oracle_class: deterministic. provenance: pre-existing.
3. Every emitted physical-branch prune has a strict certified tail upper bound
   below the remaining target; the target run reports searched, pruned, and
   unexpanded counts. Oracle: target output and pruning invariant check.
   oracle_class: deterministic. provenance: pre-existing.
4. The target run is classified as SAT (with replay), UNSAT (complete exact
   exhaustion), or non-decisive with coverage and no score claim. Oracle:
   documented target command and exit code. oracle_class: deterministic.
   provenance: pre-existing.

## Return fields

- `changed_artifacts`
- `fixture_verdict`
- `tail_bound_soundness`
- `target_query_verdict`
- `coverage_and_pruning`
- `score_or_bound`
- `commands_and_outputs`
- `residual_or_handoff`

## Result

**Delivery classification: PARTIAL.** A sound exact-prefix decomposition now
exists under `solver/physical-branch-bound/`. It completely enumerates
physical actions at searched nodes. Its certified tail completely enumerates
a declared number of count-relaxed layers while preserving equal-or-double
value compatibility, exact sum survivors, and exact `L-1` frozen-spawn
consumption, then switches to the complete mass/cursor outer relaxation.
Position relaxation and the later mass relaxation only add continuations, so
the composed maximum is admissible. Either resource cap throws before
returning a bound; the search catches that as `boundUnavailable` and performs
no prune.

- `changed_artifacts`: `solver/physical-branch-bound/index.js`,
  `solver/physical-branch-bound/branch-bound.test.js`,
  `solver/physical-branch-bound/target.js`, the physical-prefix section of
  `solver/README.md`, and this ticket's result sections.
- `fixture_verdict`: PASS. The independent pre-existing
  `solveExactPosition` oracle and the new complete physical target search both
  establish maxima 18 for `[2,2,4,4]` over one move and 52 for
  `[2,2,4,4,8]` over two frozen-spawn moves (SAT at the maximum, complete
  UNSAT at maximum+1).
- `tail_bound_soundness`: PASS on the frozen fixtures. Complete
  value-compatible tails are 18 >= exact 18 and 52 >= exact 52. The negative
  control deliberately submits 17 against exact 18 and is rejected. A
  zero-state resource cap throws `no bound produced`; the corresponding
  physical search records `boundUnavailable` and zero prunes. The target
  pruning invariant checks that every emitted prune is complete and strictly
  below the remaining target.
- `target_query_verdict`: **NON_DECISIVE**, exit 2. This is neither replayed
  SAT nor complete UNSAT and carries `scoreClaim: null`.
- `coverage_and_pruning`: The finite target run searched 1 physical node,
  exactly generated all 1,868,975 distinct root actions, expanded 1
  guide-matched branch, left 1,868,974 enumerated root branches unexpanded,
  and emitted 0 prunes. There were 0 unavailable bounds, 0 enumeration
  failures, and 0 unknown-frontier nodes in the recorded run. The complete
  two-layer tail assessed 1,454 compatible states / 1,796,773 compatible
  actions before its complete mass tail. Its root bound was 325,340, which is
  not strictly below 13,000, so pruning there would have been unsound.
- `score_or_bound`: no physical score claim or physical optimum bound is
  produced by the target query. The run independently replays its search
  guide at 9,238 in 32 moves as a lower bound only; the stronger pre-existing
  10,132 replay remains the best recorded lower bound. The 325,340 tail is a
  local certified relaxation bound, not an achievable score and not a
  decisive bound for the physical optimum.
- `commands_and_outputs`: recorded under Verification.
- `residual_or_handoff`: exact coverage must resume from the explicit
  1,868,974 root frontier. The current bound is sound but ineffective near
  the root. A resumed implementation needs streaming/external-memory physical
  action generation before deep prefix expansion, plus a substantially deeper
  or stronger complete compatibility relaxation; see Handoff.

## Verification

1. PASS — `node --test solver/physical-branch-bound/*.test.js` exited 0:
   6 tests, 6 passed. Complete physical target searches reproduce exact maxima
   18 and 52 by returning SAT at each maximum and complete UNSAT at maximum+1.
2. PASS — the same command confirms complete compatible tail 18 >= 18 and
   52 >= 52, rejects deliberately-low 17 against exact 18, and proves a
   capped/unfinished tail throws without creating a prune.
3. PASS for the invariant and bounded reporting; non-decisive for the target —
   `node solver/physical-branch-bound/target.js` emitted frozen identity
   `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`,
   `pruningInvariant:true`, searched 1, generated 1,868,975, expanded 1,
   pruned 0, unexpanded 1,868,974, and root tail 325,340. It exited 2 with
   `verdict:"NON_DECISIVE"`, `complete:false`, and `scoreClaim:null`.
4. PASS for honest classification — the target output is explicitly neither
   SAT nor UNSAT and makes no score claim. The combined command
   `node --test solver/tests/*.test.js
   solver/physical-branch-bound/*.test.js` exited 0: 74 tests, 72 passed,
   0 failed, 2 skipped because OR-Tools is not installed for the default
   `python3`; all non-optional JavaScript checks and all new checks passed.

## Feedback

- The initial board counts are `2x24,4x12,8x4`. Position relaxation compresses
  1,868,975 physical root actions to 1,453 compatible multiset actions, a
  useful decomposition seam, but two complete compatible layers reduce the
  prior 326,390 mass bound only to 325,340.
- A four-node trial reached a dense guide child where the pre-existing exact
  enumerator's path-state `Set` exceeded the JavaScript maximum size. The
  recorded target run therefore uses one fully enumerated root node and
  exposes the remaining frontier rather than crashing or hiding coverage.

## Risks

- Exact action enumeration may still produce too many branches before a tail
  bound becomes effective.
- A tail relaxation that finds an above-target relaxed continuation must leave
  the physical branch unpruned; it cannot be used as a failure conclusion.
- Realized: the two-layer compatible tail is still 25 times the target at the
  root, so it legally prunes nothing there.
- Realized: retaining complete path-state/action sets for multiple dense
  physical levels can exceed the JavaScript `Set` size before the node bound;
  exact resumption needs streaming, partitioning, or external-memory action
  enumeration without changing action identity.

## Handoff

Resume from frozen identity
`edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880` and
the explicit 1,868,974 unexpanded root branches. Do not infer anything from
the zero target prunes: the assessed root tail is complete but non-discriminating.
The next safe technical step is to partition physical actions by
`(survivor, removed-mask)` and stream one partition at a time, so deep states
do not retain million-entry path/action sets. Pair that with a stronger
complete tail (more compatible layers with state memoization or a provably
tighter compatibility resource invariant). Any cap must continue to throw or
return unavailable, never a numeric pruning value. Re-run the six-fixture
suite and retain the negative control before accepting deeper target coverage.
