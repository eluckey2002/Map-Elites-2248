# Spec: Level 51 human-strategy diagnosis

- **run:** `level51-human-strategy-diagnosis-2026-08-30`
- **objective:** A replay-derived evidence packet identifies one falsifiable principle shared by both Level 51 human wins that the current champion does not express, or returns `INCONCLUSIVE` without proposing a policy change.
- **routing:**
  - **pack:** `orch-research-pack`

## Question

What shared decision principle, if any, explains how both recorded human strategies reach the Level 51 seed-1 target faster than the current champion, and is the champion's miss caused by candidate generation, move valuation, lookahead horizon, or state/memory?

## Source policy

- Use only local primary artifacts fixed at Git `be843368be8e19ec59501aae38f19eebaf188b87` and immutable historical Git objects named below.
- Treat Level 51 seed 1 and every state derived from the two recordings as diagnostic/training evidence only.
- Do not inspect or execute the sealed screen or holdout seeds reserved by the composition.
- Cite a file plus SHA-256, Git object identity, or reproducible command for every load-bearing claim.

## Rigor bar

- Exact reconstruction and replay for both human trajectories and the champion trajectory.
- A claimed shared principle must be observed in both human trajectories, absent or systematically underweighted in the champion at named decision states, distinguishable from at least one plausible rival explanation, and paired with a stated falsifier.
- If no single principle clears that bar, the only admissible conclusion is `INCONCLUSIVE`; two unrelated anecdotes may not be blended into one rule.

## Non-goals

- Implementing, tuning, or promoting a policy.
- Changing the champion, levels, targets, recordings, receipts, calibration ruler, or level-authoring system.
- Claiming the human is globally stronger, that either human trajectory is optimal, or that Level 51 predicts generalization.
- Exhaustively enumerating Level 51's millions of legal chains.
- Reusing the MAP-Elites screen or holdout result as evidence for a new structural rule.

## Acceptance

1. The historical candidate is reconstructed from Git object `420ba8ef79e1850e7dc50124f7ab564801b1d314:solver/candidate-levels.json`, its canonical candidate identity recomputes to `524f37c0063d61e5ab4b636b720f3cd644ec83cba62324e48304d5a12bb3dd5c`, and its gameplay fields are mechanically equal to shipped Level 51.
   - **oracle:** independent reconstruction/replay check recorded in the evidence packet; **oracle_class:** evidence.
2. Both recordings replay exactly from seed 1, matching every recorded tile value, adjacency, chain score, move count, final score, and outcome; the current champion is replayed on the same reconstructed level and seed with its fixed default parameters.
   - **oracle:** deterministic replay command plus tamper negative control; **oracle_class:** evidence.
3. Every human decision is classified against the champion on that exact pre-move state as at least: champion agrees; human chain absent from generated candidates; human chain generated but ranked lower; or unresolved. The packet records the observable scoring features and the first material divergence for each trajectory.
   - **oracle:** machine-readable decision table checked for complete move coverage and valid category values; **oracle_class:** evidence.
4. The report tests the four causal families—generation, valuation, horizon, and state/memory—against both trajectories, preserves contradictions, and names evidence that would flip each load-bearing finding.
   - **oracle:** sampled claim-to-source reads and research rigor lens; **oracle_class:** judged.
5. The terminal conclusion is exactly one of: `SUPPORTED_SHARED_PRINCIPLE` with one implementation-ready but not implementation-binding rule; or `INCONCLUSIVE` with the missing evidence named. It never recommends a change from one trajectory alone.
   - **oracle:** coverage and contradiction audit against the packet; **oracle_class:** evidence.
6. The result changes only its run-scoped evidence and ticket bookkeeping, and all protected project hashes remain unchanged.
   - **oracle:** `git diff --name-only` plus protected SHA-256 manifest; **oracle_class:** evidence.

## Binding constraints

- `AGENTS.md`, `EVIDENCE_LEDGER.md`, `CURRENT.md`, and `HANDOFF.md` govern evidence language and project scope.
- Reconstruct the exact candidate from Git history; do not edit or restore it into a live candidate/receipt path.
- Compare the champion on each human pre-move state as well as on its own trajectory; trajectory-only comparison cannot distinguish policy from state-history effects.
- The current generator defines only whether the human move was offered to the evaluator. Absence from that bounded set is a generator omission, not proof that the move is globally optimal.
- Observation and inference must be separate in every finding.
- The result may propose at most one shared principle. No parameter value, threshold, or implementation shape may be selected here.
- Keep the champion, `src/game.js`, all recordings, all receipts, calibration, and authoring surfaces byte-identical.

## Evidence

- Intake investigation `.orch/tickets/level51-human-strategy-learning-2026-08-30/intake-investigation.md`.
- Git baseline `be843368be8e19ec59501aae38f19eebaf188b87`, branch `map-elites-learning`, clean before run bookkeeping.
- Recording `recordings/1c87356748ee23c9388d27f6c66ae60ed7d448f2f327f27dbe4d36a46ea6a0d0.json`, SHA-256 `335bdcf43b446fa6ed9f1a35df221f9a9bfcb4eb4a4c440c9cbb06774af78bb9`.
- Recording `recordings/78749fc07834f892542e7abd3317e9ed0b124082fe5b9b36876dac5918aa4b40.json`, SHA-256 `ffbf55ae111b4f71fe608c34336585ea3a05e898873d3b5a304d80d4cd0d9de3`.
- Historical candidate Git object `420ba8ef79e1850e7dc50124f7ab564801b1d314:solver/candidate-levels.json`, blob content SHA-256 `49920ea643bbb060fc351be38f46ad5382513713becc0b05e491c1e921a73f33`.
- `solver/bot.js` SHA-256 `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`.
- `solver/engine.js` SHA-256 `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`.
- `solver/policy-eval.js` SHA-256 `ab76eeb937b61b85835602f4db431de9f8686dfa281a48cfd2c97caa039457a1`.
- `src/game.js` SHA-256 `9493407cd9dc8b7cefaefac811b52969c89a078aa7df4fd2a5fa1c1e64207115`.
- Independent replay audit `.orch/audits/recording-replay-verification-2026-08-17/verdict.md`, SHA-256 `ad24cb55e27770a3c9e4af9efa416f9b4e4f88de5785b1ca4c1f8c4330f29fd3`.
- Accepted project records `RESULT-0009`, `RESULT-0014`, `RESULT-0016`, and `RESULT-0017` in `EVIDENCE_LEDGER.md`, SHA-256 `ff30067d23e4d1bd1b40dd6c6882c7dda5ecf721e43127a0ab0f182e6766d716`.

## Affected surfaces

- `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/evidence/decision-table.json`
- `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/evidence/report.md`
- `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/evidence/verification.json`
- `.orch/tickets/level51-human-strategy-diagnosis-2026-08-30/`

## Exemplars

- `.orch/audits/recording-replay-verification-2026-08-17/verdict.md` at its fixed hash: imitate from-scratch replay, explicit provenance gaps, and exact-versus-inferred separation.
- `solver/map-elites-output/archive.json` verified by `solver/verify-map-elites.js`: imitate self-identifying inputs, disjoint evaluation sets, and refusal to call a selected policy a champion.
- `EVIDENCE_LEDGER.md` at its fixed hash: imitate proof-class boundaries and explicit `INCONCLUSIVE` outcomes.

## Bound

- **evidence scope:** exactly two human Level 51 seed-1 wins plus one champion replay and champion counterfactuals on those human states.
- **effort:** one evidence packet, one independent verification pass, and at most one correction pass.
- **runtime:** under 10 minutes; any uncapped exhaustive chain enumeration is out of scope.
- **plan_gate:** false; the owner approved this bounded sequence on 2026-08-30.

## Risks

- The two trajectories share one board and one player, so apparent commonality may be board-specific.
- A human chain can be absent because the bounded generator omits it; that says nothing about how the evaluator would rank it if offered.
- A feature correlated with a good move may be an effect rather than the decision rule; the report must test rival explanations.

## Assumptions

- The owner confirms the two replay-valid recordings are their own play; file evidence alone cannot prove human provenance.
- Gameplay-field equality is sufficient to replay the historical candidate with the current engine only if exact replay succeeds.
- One shared principle is the maximum useful output from two trajectories; more would outrun the evidence.
