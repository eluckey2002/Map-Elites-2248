# Level 26 certified-score worklog

- **Run:** `level26-certified-score-2026-08-10`
- **Objective:** For the one frozen Level 26 seed-0 sequence, produce a
  replayable certified maximum score or a proven upper bound, then compare it
  explicitly with 13,000.
- **Fixed scope:** Preserve `src/game.js` rules and level data. This run may
  change only the solver, its tests, and its evidence documentation.
- **Status:** active.

## Evidence before the current ticket

- Seed `0` produces a deterministic 5x8 initial grid and frozen spawn stream.
  The headless solver and a temporary SMT encoding agree on the 40 initial
  values and the first ten spawn values.
- `solver/exact-score.js` has a replayed JavaScript beam witness of 10,132 in
  32 legal moves. It is a lower bound only.
- The position-aware exact search is validated on a four-cell fixture: 18 is
  reachable and 19 is not. The 40-cell bitmask regression is covered by the
  current JavaScript suite.
- A temporary Z3/CVC5 model passes that score fixture and a two-column,
  column-major spawn-order fixture. Constraining it to the JavaScript 10,132
  witness is satisfiable at exactly that score.
- Fresh unbounded-choice `score >= 13,000` queries returned `unknown` at
  120 seconds under Z3 and under a hard-capped CVC5 run. This is an
  inconclusive solver-budget observation, not an upper bound.

## Active external-process record

- The final CVC5 query was run as
  `ulimit -t 130; LEVEL26_SOLVER=cvc5 python3 /private/tmp/level26_z3.py 120000`.
  It completed with `unknown`; no process remains active.

## Next boundary

- Promote the checked formal model to a repository artifact and pursue a
  formulation or admissible branch-and-bound bound that can decide the frozen
  13,000 query. Do not report the target as impossible until a decisive,
  replayable upper bound exists.

## Ticket integration

- `certify-frozen-seed` was executed by
  `/root/certify_frozen_seed_gpt_5_6_sol_high` and integrated as
  **suspended**, not complete. Its deterministic fixture and JavaScript-suite
  criteria passed; its target-proof and conclusion criteria are not
  demonstrated because the durable 120,000 ms Z3 query returned `UNKNOWN`.
- The worker's returned artifacts stay inside its write scope. Its generated
  Python cache was removed before return. No rule, score, target, spawn, or UI
  file changed.
- Resume from the ticket's `## Handoff`; the frozen input identity is
  `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.

## Next execution lane

- `admissible-upper-bound` is issued as a separate no-overlap ticket. Its job
  is to create a sound upper-bound decomposition with small-fixture
  discrimination, not to repeat the already-timed-out SMT query.

## Upper-bound integration

- `admissible-upper-bound` was accepted as **complete**. Its mass/cursor
  relaxation was fully enumerated (17,888 states, 661,856 transitions), passed
  two exact-fixture admissibility checks and an intentionally-lowered negative
  control, and produced a certified upper bound of **326,390** for the frozen
  input identity above.
- That upper bound is safely non-decisive because it is far above 13,000. It
  is neither a score prediction nor a reachability witness; it is retained as
  a possible outer/tail bound for a tighter exact search.

## Next execution lane

- `alternative-exact-feasibility` is issued to test a distinct exact
  formulation/solver engine against the same frozen input and fixtures. A
  solver budget result is recorded separately from a proof verdict.

## Alternative exact-model integration

- `alternative-exact-feasibility` was integrated as **suspended**. Its
  independent CP-SAT formulation passes the 18/19, spawn-order, and early-stop
  fixtures, then replays every SAT trace concretely. The corrected frozen
  target query nevertheless returned `UNKNOWN` after 125.717 seconds.
- This strengthens confidence that the two durable formulations agree on the
  checked rules and fixtures, but supplies no score, witness, or upper bound
  for Level 26 seed 0. The central ticket remains open.

## Next execution lane

- `value-compatible-branch-bound` is issued to combine exact physical action
  branches with a tail relaxation that retains the value-chain rule. It must
  report coverage and may prune only from strict, certified upper bounds.

## Value-compatible branch-bound integration

- `value-compatible-branch-bound` was integrated as **suspended**. It
  reproduced exact small maxima 18 and 52, passed tail-bound and fail-closed
  cap tests, and generated all 1,868,975 exact root actions.
- The complete two-layer compatible tail was 325,340 at the root, so no root
  action was safely prunable. The output explicitly records one expanded guide
  action and 1,868,974 unexpanded actions; it contains no target score claim.
- The resume boundary is a streaming/partitioned physical action frontier plus
  a materially tighter complete tail abstraction. Never substitute the
  partially expanded root frontier for exact exhaustion.

## Complementary witness lane

- `target-witness-search` is issued independently to seek a replayed
  target-reaching sequence. A miss remains a lower-bound observation only;
  a hit settles reachability but not the requested exact maximum/upper bound.

## Witness-search integration

- `target-witness-search` was accepted as **complete**. Its six-restart,
  depth-32 portfolio generated 2,970,496 candidates and independently replayed
  a new best frozen-seed lower bound of **12,336** in 32 moves at cursor 520.
- The machine-readable witness is
  `solver/target-witness-search/frozen-run.json`, SHA-256
  `4e47c05ed42cfd978e85591913ae2062c10525d003ece73e6b2feeef0e12094e`.
  It is 664 points short of 13,000 and is explicitly a non-decisive miss; it
  changes neither the exact-maximum nor target-reachability proof status.

## Near-target improvement lane

- `near-target-witness-improvement` is issued as a follow-on lower-bound
  search from the replayed 12,336 witness. It may establish a target-reaching
  witness, but a miss remains non-decisive and cannot close the proof goal.

## Near-target lane join

- `near-target-witness-improvement` was rejected as **failed (child
  under-delivered)**. Its process and JSON artifact ended, but the executor did
  not complete the required ticket Result/Handoff after repeated return
  requests and was interrupted. The JSON is an unaccepted lead, not integrated
  evidence; the authoritative accepted lower bound remains 12,336 from
  `target-witness-search`.

## Hinted threshold lane

- `hinted-threshold-feasibility` is issued to seed a separate CP-SAT
  formulation from the accepted 12,336 witness and escalate score thresholds.
  It can establish target reachability with a replayed SAT trace but cannot
  turn any timeout/miss into a bound.

## Hinted threshold integration

- `hinted-threshold-feasibility` was accepted as **complete**. It
  independently replayed and CP-SAT-validated the 12,336 trace, then ran the
  fixed schedule: 12,336 SAT/replayed; 12,400, 12,600, 12,800, and 13,000 all
  `UNKNOWN` at their 30-second bounds.
- The schedule rules out no score and proves no bound. Its exact replay and
  fixture evidence make it a reusable, bounded reachability experiment only;
  the central frozen maximum/upper-bound goal remains active.
