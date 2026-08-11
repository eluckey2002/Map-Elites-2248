---
id: target-witness-search
run: level26-certified-score-2026-08-10
status: complete
executor: deliver-goal-slice
profile: orch-worker
independence: gate
depends_on: []
write_scope:
  - solver/target-witness-search/
  - solver/README.md
bound: 50 minutes
claimed_by: /root/target_witness_search_gpt_5_6_sol_high
claimed_at: 2026-08-10T07:08:53-05:00
excluded_actions:
  - Modify src/game.js, level data, scoring, spawn rules, target, player UI, or existing solver artifacts.
  - Treat a failed heuristic search as an upper bound or impossibility proof.
---

## Objective

Search the frozen Level 26 seed-0 sequence for a legal, deterministically
replayed score of at least 13,000. If none is found in the fixed budget,
preserve the best verified lower bound without a feasibility claim.

## Fixed inputs

- Rule authority: `src/game.js`; headless behavior: `solver/engine.js`.
- Frozen generation/replayer: `solver/exact-score.js`.
- Frozen identity and formal-conformance evidence:
  `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`,
  `certify-frozen-seed.md`, and `alternative-exact-feasibility.md`.
- Existing verified lower bound: 10,132 in 32 moves. Existing 326,390 and
  325,340 relaxations are not reachable-score evidence.
- Scope: Level 26 seed 0 only (5x8, 32 moves, min chain 4, target 13,000,
  no blockers).

## Completion test

1. Every reported candidate witness is independently replayed through the
   rule mirror and its score, move count, cursor, and target status are
   recorded. Oracle: documented deterministic replay command. oracle_class:
   deterministic. provenance: pre-existing.
2. The search's fixture mode recovers a known small-board legal optimum or
   target witness and rejects a malformed candidate in a negative control.
   Oracle: documented deterministic fixture command/output. oracle_class:
   deterministic. provenance: pre-existing.
3. The frozen run executes to its explicit fixed compute budget and reports
   the best replayed lower bound, whether target reached, search coverage, and
   a machine-readable witness if any. Oracle: documented target command and
   JSON output. oracle_class: deterministic. provenance: pre-existing.
4. The run labels a miss as non-decisive and makes no upper-bound claim.
   Oracle: emitted JSON and ticket result. oracle_class: evidence. provenance:
   pre-existing.

## Return fields

- `changed_artifacts`
- `fixture_verdict`
- `best_verified_lower_bound`
- `target_reached`
- `search_coverage`
- `commands_and_outputs`
- `residual_or_handoff`

## Result

**Delivery classification: PARTIAL.** The search completed its declared fixed
compute budget and produced a stronger independently replayed lower bound of
**12,336 in 32 moves**, 664 below 13,000. It did not find a target witness.
The result is therefore `NON_DECISIVE_MISS`: it makes no feasibility, exact
maximum, or upper-bound claim.

The durable candidate generator now combines (a) the pre-existing greedy
walks, (b) a bounded per-depth self-avoiding path beam, and (c) seeded legal
walk sampling. A portfolio state beam retains pure accumulated-score,
one-move-lookahead, and value-compatibility/pairing profiles. All bounds are
finite integer counts, and a separate call to `replayFrozenWitness` must agree
on score, move count, spawn cursor, and target status before a run is retained.

The completed six-restart fixed run (`width 256 / 24 walk
samples / 64 candidates`) independently replayed **12,336 in 32 moves at
frozen spawn cursor 520**. It completed all six restarts and all 32 depths,
expanding 46,414 states and generating 2,970,496 candidates, of which
2,101,986 were unique successors and 868,506 were duplicates. The result is
stored machine-readably in `solver/target-witness-search/frozen-run.json`
(SHA-256 `4e47c05ed42cfd978e85591913ae2062c10525d003ece73e6b2feeef0e12094e`).
This improves the pre-existing verified lower bound of 10,132 by 2,204 but
remains 664 below target; it is a non-decisive miss and does not imply an upper
bound or infeasibility. Because restart 0 supplied the best result and remains
close to target, it is the handoff point for any future search.

- `changed_artifacts`: `solver/target-witness-search/index.js`,
  `solver/target-witness-search/cli.js`,
  `solver/target-witness-search/verify.js`,
  `solver/target-witness-search/search.test.js`,
  `solver/target-witness-search/frozen-run.json`, `solver/README.md`, and this
  ticket's result sections.
- `fixture_verdict`: PASS — known optimum 18 recovered and independently
  replayed in one move at cursor 3; malformed repeated-cell candidate rejected.
- `best_verified_lower_bound`: 12,336 in 32 moves at cursor 520, improving the
  supplied 10,132 bound by 2,204.
- `target_reached`: false; the gap is 664.
- `search_coverage`: 6/6 restarts and depth 32/32; 46,414 expanded states;
  2,970,496 generated candidates; 2,101,986 unique successors; 868,506
  duplicate successors; elapsed 764.11 seconds.
- `commands_and_outputs`: recorded under Verification below.
- `residual_or_handoff`: preserve 12,336 as a replayed lower bound and resume,
  if useful, from deterministic restart 0 with a wider or more structurally
  informed search. Do not convert this miss into a claim that 13,000 is
  unreachable; the active maximum/upper-bound goal remains unresolved.

## Verification

1. PASS — `node solver/target-witness-search/verify.js
   solver/target-witness-search/frozen-run.json` exited 0 with frozen identity
   `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`,
   score 12,336, moves 32, cursor 520, and `targetReached: false`. This command
   reads the machine witness and independently invokes the frozen rule replayer.
2. PASS — `node solver/target-witness-search/cli.js --fixture` recovered the
   known one-move optimum 18 with cursor 3 and rejected a repeated-cell
   malformed candidate; `node --test solver/target-witness-search/*.test.js`
   passed 3/3, including a frozen-verifier malformed-candidate negative.
3. PASS for bounded execution — `/usr/bin/time -p node
   solver/target-witness-search/cli.js --target --restarts 6 --width 256
   --walk-samples 24 --candidate-limit 64 >
   solver/target-witness-search/frozen-run.json` exited 2 as designed for a
   miss after `real 764.11` seconds. Its JSON records `NON_DECISIVE_MISS`,
   12,336, 6 completed restarts, all 32 depths, and the coverage above.
   `shasum -a 256` returned
   `4e47c05ed42cfd978e85591913ae2062c10525d003ece73e6b2feeef0e12094e`.
4. PASS — both the JSON interpretation and independent verification output say
   `replayed lower bound only` and `non-decisive miss with no feasibility or
   upper-bound claim`. The complete JS check `node --test
   solver/tests/*.test.js solver/physical-branch-bound/*.test.js
   solver/target-witness-search/*.test.js` exited 0: 76 tests, 74 pass, 0
   fail, 2 skipped because OR-Tools was not installed for the optional Python
   fixture bridge.

## Feedback

- Exact immediate-action enumeration found better early moves but a later
  board exceeded the JavaScript `Set` size while materializing path states;
  that aborted probe was logged as friction and was not reported as coverage.
- Adding finite per-depth path beams and one-move state lookahead materially
  improved the legal lower bound: 10,546 in the smoke run and 12,336 in the
  final fixed run, versus the supplied 10,132.
- A first reply to the packet's `main` alias resolved as a nonexistent child
  path; the checkpoint was sent to the canonical `/root` parent and the
  misrouting was logged as friction.

## Risks

- The actual target may be unreachable, in which case a heuristic search will
  remain a lower-bound study only.
- A high score is not an exact maximum; it changes only the reachability part
  of the main question.
- The portfolio is deterministic for the recorded Node/runtime and fixed
  integer budget, but a wider beam may choose a different lower witness; no
  monotonic-improvement or completeness claim is made.

## Handoff

The durable result is `solver/target-witness-search/frozen-run.json`: a
machine-readable, independently replayed 12,336-point witness for Level 26
seed 0 under frozen identity
`edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
It is 664 below target and the completed search is a non-decisive miss. The
target's reachability and the active exact maximum/upper-bound goal remain
unresolved. Any continuation should retain this lower bound, run through
`verify.js`, and report finite coverage separately from proof status.
