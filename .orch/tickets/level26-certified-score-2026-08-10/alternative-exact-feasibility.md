---
id: alternative-exact-feasibility
run: level26-certified-score-2026-08-10
status: suspended
executor: deliver-goal-slice
profile: orch-worker
independence: gate
depends_on: []
write_scope:
  - solver/alternative-certifier.py
  - solver/requirements-alternative-certifier.txt
  - solver/tests/alternative-certifier.test.js
  - solver/README.md
bound: 45 minutes
claimed_by: /root/alternative_exact_feasibility_gpt_5_6_sol_high
claimed_at: 2026-08-10T06:46:13-05:00
excluded_actions:
  - Modify src/game.js, level data, scoring, spawn rules, target, player UI, or existing exact artifacts.
  - Treat a timeout, incomplete branch search, or relaxation as a target verdict.
---

## Objective

Create a genuinely different exact feasibility formulation for frozen Level
26 seed 0 `score >= 13000`, validate it against the same small rule fixtures,
and report a decisive SAT/UNSAT result if it obtains one.

## Fixed inputs

- Rule authority: `src/game.js`; headless rule mirror: `solver/engine.js`.
- Existing formal encoding, independent replay, and frozen stream identity:
  `solver/certify-level26.py` and its result ticket `certify-frozen-seed.md`.
- Frozen input identity:
  `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
- Small exhaustive/replay oracles: `solver/exact-score.js` and its tests.
- Existing complete outer bound: `solver/upper-bound.js`; it is safe but
  non-decisive and may not be misreported as the answer.
- Scope is Level 26 seed 0 only (5x8, 32 moves, min chain 4, target 13000,
  no blockers).

## Completion test

1. The alternative formulation accepts the known 18-point one-move fixture
   and rejects the same fixture at 19, and verifies the two-column
   column-major spawn-order fixture. Oracle: documented deterministic fixture
   command and output. oracle_class: deterministic. provenance: pre-existing.
2. The alternative formulation has either an independently replayed SAT
   witness or an UNSAT/proven upper-bound interpretation; test coverage
   demonstrates that the emitted success/failure result is not only solver
   text. Oracle: documented deterministic replay/verification command.
   oracle_class: deterministic. provenance: pre-existing.
3. The frozen Level-26 target query is run to its explicit finite bound and
   records exactly SAT, UNSAT, or UNKNOWN. Only SAT/UNSAT satisfies the
   primary proof result; UNKNOWN must be recorded as non-decisive. Oracle:
   command JSON and exit code. oracle_class: deterministic. provenance:
   pre-existing.
4. The complete JavaScript solver suite passes after the new fixture harness
   is added. Oracle: `node --test solver/tests/*.test.js` exit code.
   oracle_class: deterministic. provenance: pre-existing.

## Return fields

- `changed_artifacts`
- `fixture_verdict`
- `alternative_formulation`
- `frozen_query_verdict`
- `score_or_bound`
- `target_comparison`
- `commands_and_outputs`
- `residual_or_handoff`

## Result

**Delivery classification: PARTIAL.** A separate OR-Tools CP-SAT formulation
now exists in `solver/alternative-certifier.py`, pinned by
`solver/requirements-alternative-certifier.txt`. It is materially different
from the existing Z3 array encoding: finite-domain, sentinel-terminated path
variables represent ordered non-repeating chains; reified membership and
endpoint variables drive cell mutation; and a per-column stable-compaction
network implements gravity before frozen column-major spawning. Score and
cursor transitions are integral finite-domain constraints. A CP-SAT `SAT`
result is emitted only after a separate concrete replay checks the full
witness, including score, spawn cursor, and every post-move board.

The deterministic fixture passes: exact maximum 18, `score >= 18` SAT,
`score >= 19` UNSAT, fixed two-column post-spawn board `[2, 8, 4, 12]`, and a
two-turn harness confirms that the model stops after the first target-reaching
move.

The corrected frozen Level-26 seed-0 `score >= 13000` query exhausted its
120-second solver bound and returned `UNKNOWN` / exit 2 with
`score_claim: null`. It produced neither a SAT witness nor an UNSAT proof, so
there is no exact score or new upper bound and the target comparison remains
unresolved.

- `changed_artifacts`: `solver/alternative-certifier.py`,
  `solver/requirements-alternative-certifier.txt`,
  `solver/tests/alternative-certifier.test.js`, `solver/README.md`, and this
  ticket's result sections.
- `fixture_verdict`: PASS — exact maximum 18; `score >= 18` SAT; `score >=
  19` UNSAT; column-major board `[2, 8, 4, 12]`; early stop after 1 move.
- `alternative_formulation`: OR-Tools CP-SAT finite-domain ordered paths plus
  an explicit stable gravity-compaction and frozen-spawn transition network,
  followed by independent concrete replay for SAT.
- `frozen_query_verdict`: UNKNOWN (`UNKNOWN` solver status), exit 2 after the
  explicit 120-second bound; non-decisive.
- `score_or_bound`: none. The query emitted `score_claim: null`; the
  pre-existing 10,132 replay remains only a lower bound and the pre-existing
  326,390 resource bound remains non-decisive.
- `target_comparison`: unresolved; this alternative run neither reaches nor
  proves an upper bound below 13,000.
- `commands_and_outputs`: recorded under Verification below.
- `residual_or_handoff`: use the exact frozen hash and passing fixtures below;
  pursue decomposition or a stronger exact search, and preserve `UNKNOWN` as
  non-decisive unless an independently replayed SAT witness or UNSAT proof is
  obtained.

## Verification

1. PASS — `/private/tmp/level26-alternative-venv/bin/python
   solver/alternative-certifier.py --fixture --timeout-seconds 20` exited 0
   with `{"column_major_after":[2,8,4,12],"early_stop_moves":1,
   "exact_maximum":18,"score_ge_18":"SAT","score_ge_19":"UNSAT",
   "verdict":"PASS"}`.
2. NOT DEMONSTRATED for the target — the implementation independently replays
   every SAT result before emitting it, and the negative-control Node test
   confirms replay rejects a repeated-cell witness. The frozen query did not
   produce SAT or UNSAT, so no target witness/bound was available to verify.
3. PASS for bounded execution and honest classification, but non-decisive —
   `/private/tmp/level26-alternative-venv/bin/python
   solver/alternative-certifier.py --target --timeout-seconds 120` exited 2
   with `{"frozen_values_sha256":"edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880",
   "level":26,"query":"score >= 13000","reason":"UNKNOWN",
   "score_claim":null,"seed":0,"timeout_seconds":120.0,
   "verdict":"UNKNOWN","wall_time_seconds":125.717173}`. This does not
   satisfy the primary proof result.
4. PASS — `ALTERNATIVE_CERTIFIER_PYTHON=/private/tmp/level26-alternative-venv/bin/python
   node --test solver/tests/*.test.js` exited 0: 68 tests, 68 pass, 0 fail,
   0 skipped. `python -m py_compile solver/alternative-certifier.py` also
   exited 0 before the suite.

## Feedback

- OR-Tools 9.14.6206 was unavailable from the configured package index; the
  available 9.15.6755 build installed successfully and is pinned. This was
  logged through the required friction logger.
- The first fixture run exposed a gravity reification defect: a removed
  source was forced to occupy a destination. Restricting the exactly-one
  landing constraint to surviving sources fixed it; the fixture then passed.
- A post-fixture exactness review found that the inactive-turn endpoint was
  over-constrained. Endpoint equivalence is now conditional on an active move,
  and the added two-turn fixture proves immediate game-end behavior. The
  frozen query was rerun only after this correction.
- Task-only `__pycache__` and `/private/tmp/level26-alternative-venv` artifacts
  were removed after verification. The shell refused the first `rm` cleanup
  command, so the explicit targets were removed with depth-first `find
  -delete`; the refusal was logged through the friction logger.

## Risks

- A different solver engine can still time out on the same combinatorial
  instance; that does not weaken or contradict the existing formal model.
- An encoding that omits order, gravity, or frozen-spawn constraints is a
  relaxation and cannot substitute for exact feasibility.
- CP-SAT may still exhaust its finite wall-clock bound without a proof; such
  a result will remain `UNKNOWN`, exit 2, and carry no score claim.

## Handoff

The alternative exact CP-SAT route is durable and fixture-checked, but its
corrected 120-second frozen query is `UNKNOWN` (exit 2). No exact maximum,
target-reaching witness, or upper bound was produced. Resume only from frozen
SHA-256 `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`;
the next exact route needs stronger decomposition/search, not a reinterpretation
of this timeout. Preserve the pre-existing 10,132 as a replayed lower bound
and 326,390 as a non-decisive outer upper bound.
