---
id: FIX-VERIFY
run: 2026-09-02-experiment-lifecycle-completion-fix
status: complete
executor: orch-verify
depends_on: [FIX-REPAIR]
write_scope: []
bound: original failure oracle plus regression and scope guards
claimed_by: Codex /root
claimed_at: 2026-09-02T07:35:33-05:00
---

## Objective

The fixed lifecycle result passes the original experiment gate and its new
regression without changing either completed experiment beyond its status word.

## Fixed inputs

- FIX-REPAIR completed result.
- Fixed identities: RESULT-0021 protocol `daaf1c1d…`; RESULT-0024 protocol
  `5aefc34c…`; verifier `e958d0e0…`; experiment tests `76416f69…`; Check Cards
  `7229fa58…`.

## Completion test

1. Original oracle: `node tools/verify-experiments.js` outputs
   `EXPERIMENT GATE PASS`. oracle_class: deterministic executable;
   oracle_provenance: pre-existing.
2. Regression oracle: `node --test solver/tests/experiments.test.js` passes all
   20 tests including the reported/registered broken case. oracle_class:
   deterministic executable; oracle_provenance: pre-existing.
3. Scope oracle: protocol word diff shows only two `registered` → `complete`
   replacements. oracle_class: deterministic diff; oracle_provenance:
   pre-existing.
4. Check-card oracle: the lifecycle Check Card names exact scope, blind spots,
   negative test, rung, and decay. oracle_class: structural inspection;
   oracle_provenance: pre-existing.

## Return fields

- verdicts
- overall_verdict
- fixed_result_identity

## Result

- **verdicts:** four of four criteria PASS.
- **overall_verdict:** PASS; weakest oracle class is structural inspection.
- **fixed_result_identity:** RESULT-0021 protocol `daaf1c1d…`, RESULT-0024
  protocol `5aefc34c…`, verifier `e958d0e0…`, experiment test
  `76416f69…`, Check Cards `7229fa58…`.

## Verification

1. PASS — `EXPERIMENT GATE PASS`.
2. PASS — 20/20 experiment tests, including the new three-state regression.
3. PASS — protocol word diff shows exactly two lifecycle-word replacements.
4. PASS — lifecycle Check Card exposes its scope, five blind spots, permanent
   negative, HARD rung, and decay command.

## Feedback

[]

## Risks

[]
