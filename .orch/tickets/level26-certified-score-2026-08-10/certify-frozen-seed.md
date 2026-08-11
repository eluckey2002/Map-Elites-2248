---
id: certify-frozen-seed
run: level26-certified-score-2026-08-10
status: suspended
executor: deliver-goal-slice
profile: orch-worker
independence: gate
depends_on: []
write_scope:
  - solver/exact-score.js
  - solver/tests/exact-score.test.js
  - solver/tests/beam-witness.test.js
  - solver/certify-level26.py
  - solver/requirements-certifier.txt
  - solver/README.md
bound: 45 minutes
claimed_by: /root/certify_frozen_seed_gpt_5_6_sol_high
claimed_at: 2026-08-10T06:27:18-05:00
excluded_actions:
  - Change src/game.js, LEVELS, scoring, spawn rules, target, or player UI.
  - Claim a result for any seed other than Level 26 seed 0.
---

## Objective

For the frozen Level 26 seed-0 sequence, produce a replayable certified
maximum score or a proven upper bound and state whether it reaches 13,000.

## Fixed inputs

- Active goal contract in thread `019feb11-7fae-7a02-a3d5-b6dd6139878d`.
- Rule authority: `src/game.js`, especially the level-26 entry and the chain,
  scoring, gravity, and column-major spawning behavior.
- Headless rule mirror: `solver/engine.js`.
- Existing search/replay artifact: `solver/exact-score.js` and its two test
  files.
- Current evidence and bounded-solver history:
  `.orch/runs/level26-certified-score-2026-08-10/worklog.md`.
- A temporary, fixture-checked formal prototype exists at
  `/private/tmp/level26_z3.py`; it is a lead, not a durable result.

## Completion test

1. The complete JavaScript solver suite passes, including the exact-fixture,
   high-index mask, and replay-witness checks. Oracle:
   `node --test solver/tests/*.test.js` exit code. oracle_class:
   deterministic. provenance: pre-existing.
2. A durable deterministic verifier or formal certifier is present within the
   granted write scope, uses the frozen seed-0 initial board and spawn stream,
   and passes an exhaustive small fixture where max=18 and 19 is rejected.
   Oracle: its documented fixture command, fixed before this ticket is
   claimed. oracle_class: deterministic. provenance: pre-existing.
3. The durable certifier completes a frozen Level-26 `score >= 13000` query
   with either a SAT replay witness or an UNSAT/proven upper bound. Oracle:
   its documented target command and deterministic replay/verifier output.
   oracle_class: deterministic. provenance: pre-existing.
4. The result labels the conclusion exactly as `exact maximum` or `upper
   bound`, explicitly compares it with 13,000, and preserves the limitation
   to seed 0 only. Oracle: the durable result section and command output.
   oracle_class: evidence. provenance: pre-existing.

## Return fields

- `changed_artifacts`
- `fixture_verdict`
- `frozen_query_verdict`
- `score_or_bound`
- `target_comparison`
- `commands_and_outputs`
- `residual_or_handoff`

## Result

**Delivery classification: PARTIAL.** A durable exact SMT certifier now exists at
`solver/certify-level26.py`, with its dependency pinned in
`solver/requirements-certifier.txt` and replay semantics documented in
`solver/README.md`. It is limited to Level 26 seed 0 for the frozen target
query. `SAT` emits a witness that the script independently replays;
`UNSAT` proves the target unreachable; `UNKNOWN` is explicitly non-decisive.

The deterministic small fixture completed with exact maximum 18: `score >=
18` was `SAT`, `score >= 19` was `UNSAT`, and the two-column post-spawn board
was `[2, 8, 4, 12]`, confirming column-major fill.

The frozen `score >= 13000` query completed its 120,000 ms bound with
`UNKNOWN` / `timeout` and `score_claim: null`. Therefore neither an **exact
maximum** nor an **upper bound** has been demonstrated. The already-replayed
10,132 score remains only a lower bound: it is 2,868 below 13,000 and cannot
decide whether the target is reachable.

- `changed_artifacts`: `solver/certify-level26.py`,
  `solver/requirements-certifier.txt`, `solver/README.md`,
  `solver/tests/exact-score.test.js`, and this ticket's result sections.
- `fixture_verdict`: PASS — exact maximum 18; `score >= 18` SAT; `score >=
  19` UNSAT; column-major result `[2, 8, 4, 12]`.
- `frozen_query_verdict`: UNKNOWN (`timeout`), explicitly inconclusive.
- `score_or_bound`: no certified exact maximum or upper bound; 10,132 is a
  pre-existing replayed lower bound only.
- `target_comparison`: unresolved. The replayed lower bound is 2,868 below
  13,000; no proof establishes whether 13,000 is reachable.
- `commands_and_outputs`: recorded under Verification below.
- `residual_or_handoff`: the exact 32-move query needs a stronger encoding,
  decomposition, or admissible branch-and-bound proof; reuse the frozen hash
  and exact fixtures below and do not convert another timeout into a bound.

## Verification

1. PASS — `node --test solver/tests/*.test.js` exited 0: 62 tests, 62 pass,
   0 fail. This includes the exact fixture, high-index mask, witness replay,
   and new JS-to-certifier frozen-value hash check.
2. PASS — `PYTHONPATH=/private/tmp/level26-z3 python3 -m py_compile
   solver/certify-level26.py` exited 0, then
   `PYTHONPATH=/private/tmp/level26-z3 python3 solver/certify-level26.py
   --fixture` exited 0 with
   `{"column_major_after":[2,8,4,12],"exact_maximum":18,
   "score_ge_18":"SAT","score_ge_19":"UNSAT","verdict":"PASS"}`.
3. NOT DEMONSTRATED —
   `PYTHONPATH=/private/tmp/level26-z3 python3
   solver/certify-level26.py --target --timeout-ms 120000` exited 2 with
   `{"frozen_values_sha256":"edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880",
   "level":26,"query":"score >= 13000","reason":"timeout",
   "score_claim":null,"seed":0,"timeout_ms":120000,
   "verdict":"UNKNOWN"}`. This is not SAT, UNSAT, or a bound.
4. NOT DEMONSTRATED — no conclusion can honestly be labeled `exact maximum`
   or `upper bound`. The comparison with 13,000 remains unresolved and is
   limited throughout to Level 26 seed 0.

## Feedback

- The temporary prototype was a useful formulation lead. A suspected
  adjacency issue was checked directly and retracted: in Z3Py, division of an
  Int expression by the integer width stays integer-sorted, so the row
  coordinate is floor/integer division as required.
- The durable certifier's emitted frozen-value SHA-256 is checked from the
  JavaScript rule mirror, preventing silent initial-board or spawn-stream
  drift between the two implementations.

## Risks

- A 32-turn physical-board proof may exceed the bounded solver capacity.
- A heuristic witness is a lower bound only and cannot satisfy criterion 3
  without a proof of optimality or a valid upper bound.
- The exact formulation builds successfully and proves the fixtures, but its
  current unbounded-choice Level 26 query times out at 120 seconds. Repeating
  the same formulation with another finite timeout may again yield UNKNOWN.

## Handoff

Residual: decide the exact frozen query represented by SHA-256
`edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
Start from `solver/certify-level26.py`, whose fixture proves max=18 and whose
SAT path is independently replayed. The current 120-second target run is
UNKNOWN (`timeout`, exit 2). No exact maximum, upper bound, or answer to
whether seed 0 reaches 13,000 exists yet; 10,132 remains a lower bound only.
