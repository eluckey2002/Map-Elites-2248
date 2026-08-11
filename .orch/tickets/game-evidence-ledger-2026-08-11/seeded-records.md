---
id: seeded-records
run: game-evidence-ledger-2026-08-11
status: complete
executor: orch-draft
pack: orch-content-pack
independence: gate
depends_on: []
write_scope:
  - .orch/runs/game-evidence-ledger-2026-08-11/workspace/seeded-records.md
excluded_actions:
  - modify product or solver artifacts
  - commit or publish
bound: 35 minutes
claimed_by: seeded_records_gpt_5_6_sol_high
claimed_at: 2026-08-11T06:27:09Z
---

## Objective

A source-pinned draft of the ledger's initial snapshot and registries captures the game's established rules, accepted experiments, decisions, hypotheses, and open questions with correct proof classes.

## Fixed inputs

- Spec: `.orch/runs/game-evidence-ledger-2026-08-11/spec.md`
- Primary evidence: `src/game.js`; `solver/engine.js`; `solver/tests/engine.test.js`; `solver/tests/exact-score.test.js`; `.orch/runs/level26-certified-score-2026-08-10/worklog.md`; `solver/target-witness-search/frozen-run.json`; `solver/hinted-cp-sat/frozen-run.json`; `solver/upper-bound.js`; `.orch/tickets/level26-move1-envelope-2026-08-11.md`; `HANDOFF.md`; current Git status/log recorded in the spec/worklog.
- Outline slot: current snapshot plus fact, result, decision, hypothesis, and question registries; do not draft ledger protocol or discovery hooks.
- Voice contract: precise, calm, compact, evidence-first; explicitly uncertain where proof is absent.
- Citation policy: every accepted fact/result uses primary paths plus line/symbol, identity/hash, or reproducible command.
- Length bound: 1,900 words.

## Completion test

1. Draft includes the required initial rules and Level 26 result set named by spec acceptance criterion 2.
   - Oracle: claim-by-claim trace to fixed evidence; oracle_class: evidence; provenance: authored-here.
2. Facts, results, decisions, hypotheses, and questions have unique stable IDs and are not blended.
   - Oracle: deterministic ID/type/status scan; oracle_class: deterministic; provenance: authored-here.
3. No `UNKNOWN`, heuristic miss, non-decisive bound, or unaccepted artifact is promoted to proof.
   - Oracle: content lens plus primary evidence trace; oracle_class: judged; provenance: authored-here.

## Return fields

- Draft identity
- Verification entries
- Gaps
- Risks

## Result

- **Draft identity:** `.orch/runs/game-evidence-ledger-2026-08-11/workspace/seeded-records.md`
- **SHA-256:** `9d8eea06e771aa1a0be68a5c4a3ccd88bfe630ef55f02f39192c5443e5d9b051`
- **Length:** 1,622 words, within the 1,900-word slot bound.
- **Contents:** current proof snapshot; five facts; four results; two decisions; one hypothesis; three open questions; and a cut log. The 15 records use unique four-digit stable IDs and the sibling ledger protocol's required fields and controlled status/proof-class vocabulary.
- **Gaps:** The exact 32-move maximum, reachability of 13,000, and globally best first move remain unresolved by the fixed evidence. They are recorded as open questions rather than promoted claims. No accepted fixed evidence supplies a newer decisive result.

## Verification

1. **PASS — required rules and Level 26 result set.** Claim tracing covers shipped chain/scoring/merge/gravity/spawn rules, Level 26 configuration, frozen input identity, replayed 12,336 lower bound, proven but non-decisive 326,390 upper bound, exact move-one maximum 430, and the current `UNKNOWN` boundary. Fresh commands passed: `node --test solver/tests/engine.test.js solver/tests/exact-score.test.js` (46/46); `node solver/target-witness-search/verify.js solver/target-witness-search/frozen-run.json`; `node solver/hinted-cp-sat/verify-result.js solver/hinted-cp-sat/frozen-run.json`; and `node solver/upper-bound.js`.
2. **PASS — record separation and schema.** A deterministic scan found 15 unique `TYPE-NNNN` IDs, each with exactly the 11 required fields: type, status, scope, statement/question, evidence, proof class, `as_of`, `reverify`, update date, and supersession links. Allowed-status and allowed-proof-class scans both passed 15/15.
3. **PASS — proof-class preservation.** The accepted witness is labeled only `replayed_lower_bound`; 326,390 only `proven_upper_bound` and explicitly non-decisive; 430 only `exact_result` at the one-move scope; higher threshold outcomes only `UNKNOWN`; the modeling reduction only `hypothesis`; and all undecided claims only `unresolved`. The failed near-target artifact is excluded as unaccepted.

## Feedback

[]

## Risks

- Line-number citations can drift. Material records pair them with symbols, immutable run/ticket identities, receipt hashes, or reproducible verification commands.
- The exact move-one result relies on the accepted immutable investigation ticket's recorded complete-enumeration and independent-replay oracle; the fixed evidence set does not name a separate one-command full move-one enumeration rerun.
