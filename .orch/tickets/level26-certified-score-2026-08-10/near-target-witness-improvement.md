---
id: near-target-witness-improvement
run: level26-certified-score-2026-08-10
status: failed
executor: deliver-goal-slice
profile: orch-worker
independence: gate
depends_on: []
write_scope:
  - solver/near-target-search/
  - solver/README.md
bound: 50 minutes
claimed_by: /root/near_target_witness_improvement_gpt_5_6_sol_high
claimed_at: 2026-08-10T07:32:44-05:00
excluded_actions:
  - Modify src/game.js, level data, scoring, spawn rules, target, player UI, or existing solver artifacts.
  - Treat a failed improvement search as a proof that the target is unreachable.
---

## Objective

Starting from the frozen 12,336 replayed witness, run a deterministic
large-neighborhood/local-improvement search for a legal Level 26 seed-0 score
of at least 13,000, with every retained candidate independently replayed.

## Fixed inputs

- Rule authority: `src/game.js`; rule mirror/replay: `solver/engine.js` and
  `solver/exact-score.js`.
- Starting witness and frozen identity:
  `solver/target-witness-search/frozen-run.json`, SHA-256
  `4e47c05ed42cfd978e85591913ae2062c10525d003ece73e6b2feeef0e12094e`,
  frozen stream SHA-256
  `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
- Existing solver/proof handoffs are in this run's other ticket files.
- Scope: Level 26 seed 0 only (5x8, 32 moves, min chain 4, target 13,000,
  no blockers).

## Completion test

1. The starting 12,336 witness is reproduced through a separate deterministic
   replay before search begins. Oracle: documented replay command/output.
   oracle_class: deterministic. provenance: pre-existing.
2. The improvement engine has a fixture plus malformed-candidate negative
   control and every claimed candidate is independently replayed. Oracle:
   documented fixture command/output. oracle_class: deterministic.
   provenance: pre-existing.
3. The frozen improvement run executes to its fixed budget, outputs the best
   replayed witness and exact score, and records target reached true/false.
   Oracle: documented target command/JSON. oracle_class: deterministic.
   provenance: pre-existing.
4. A target miss is labeled a non-decisive lower-bound result; a hit is
   labeled a reachability witness, not an exact maximum. Oracle: output and
   ticket result. oracle_class: evidence. provenance: pre-existing.

## Return fields

- `changed_artifacts`
- `starting_witness_replay`
- `fixture_verdict`
- `best_verified_lower_bound`
- `target_reached`
- `search_coverage`
- `commands_and_outputs`
- `residual_or_handoff`

## Result

Execution in progress. The frozen starting artifact SHA-256 was checked as
`4e47c05ed42cfd978e85591913ae2062c10525d003ece73e6b2feeef0e12094e` before
search. Its separate pre-search replay reproduced score 12,336, 32 moves,
spawn cursor 520, target reached false, and frozen input identity
`edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.

## Verification

1. PASS — before any improvement implementation/search,
   `sha256sum solver/target-witness-search/frozen-run.json` emitted the
   expected artifact hash, and `node solver/target-witness-search/verify.js
   solver/target-witness-search/frozen-run.json` exited 0 with `verdict:PASS`,
   score 12,336, 32 moves, cursor 520, and target reached false.
2. PASS — `node solver/near-target-search/cli.js --fixture` exited 0 with
   `verdict:PASS`; the search improved the deliberately suboptimal replayed
   score 18 to the known one-move optimum 40, its independent fixture replay
   returned score 40 / 1 move / cursor 4, and a repeated-cell candidate was
   rejected with `Candidate reuses a tile`. `node --test
   solver/near-target-search/*.test.js` exited 0 with 3 tests passed,
   including the fixture replay negative and a fresh frozen-base replay.
3. UNVERIFIED — ticket issued before execution.
4. UNVERIFIED — ticket issued before execution.

## Feedback

- The first attempted target budget (2 rounds over cuts 31 through 12, width
  192, 40 walk samples, 72 candidates, 2 variants) exceeded the ticket's
  50-minute wall bound before emitting a completed output and was interrupted.
  It contributes no score or coverage claim. The recorded run was reduced to
  an explicit late-suffix budget that completes inside the available bound.
- The initial implementation emitted coverage only after the whole target
  run, so the interrupted attempt had no honest mid-run checkpoint. This
  contract gap and the bound overrun were recorded with the required friction
  logger.

## Risks

- The near-target witness may be trapped in a local optimum; a miss does not
  constrain the exact maximum.
- A target-reaching witness changes only the reachability answer; the active
  maximum/upper-bound goal still requires its prescribed proof.
