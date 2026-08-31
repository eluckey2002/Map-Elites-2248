# Runtime composition: Level 51 target-aware learning v3

- **name:** `level51-human-strategy-learning-v3-2026-08-30`
- **description:** Test one target-aware finish rule on the exact 52-level baseline without changing the champion.
- **entry:** `named`
- **supersedes:** v2, whose frozen denominator incorrectly included generated-but-unshipped Level 53; its stopped run produced no artifact.

## Steps

1. **id:** `diagnosis`
   - **unit:** `orch-deliver`
   - **pack:** `orch-research-pack`
   - **spec:** `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/spec.md`
   - **result:** report SHA-256 `be659e86cda9e9baca660ab1952cf6caf04fa73d86c9d5835abd5ec47b9658fd`.
   - **context packet:** exact human/champion replay diagnosis supporting a target-aware immediate finish.
   - **lens:** research provenance and causal-boundary lens.
2. **id:** `challenger`
   - **unit:** `orch-deliver`
   - **pack:** `orch-code-pack`
   - **spec:** `.orch/runs/level51-target-aware-challenger-v2-2026-08-30/spec.md`
   - **result:** five-file identity `c68247ce390bfec8f32e5c3c6a676efc1ea012ec81da958deeb5c19d840a20a7`.
   - **context packet:** fixed immediate-win challenger plus evaluator bound to shipped Levels 1-52.
   - **lens:** code correctness and scope lens.
3. **id:** `evaluation`
   - **unit:** `orch-deliver`
   - **pack:** `orch-research-pack`
   - **spec:** `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/spec.md`
   - **result:** `SUPPORTED`, four-artifact identity `1c813e47606ea49ea3a22211c52c5eb723e08c9356d1739ad4c7dcc997a31622`.
   - **context packet:** one 520-cell screen, then one 15,600-cell sealed holdout if screen is valid.
   - **lens:** research estimator, leakage, completeness, and claim-boundary lens.
4. **id:** `records`
   - **unit:** `orch-deliver`
   - **pack:** `orch-content-pack`
   - **spec:** `.orch/runs/level51-target-aware-records-2026-08-30/spec.md`
   - **result:** report SHA-256 `d69194cafdf2526305ae7f6097cf0fa927965304b34548730c1fa80015b4f766`; append-only ledger entry `RESULT-0018`.
   - **context packet:** append the exact verdict without changing policy or product code.
   - **lens:** content authority, correction, and claims lens.

## Edges

- **seq:** diagnosis identity is required evidence for challenger.
- **seq:** corrected challenger identity is required evidence for evaluation.
- **seq:** evaluation identity is required evidence for records.

## Frozen evaluation protocol

- Training only: Level 51 seed 1 and both human replays.
- Screen: Levels `[1,5,10,15,20,26,30,35,40,45,50,51,52]`, seeds `12000000-12000039` (520 cells).
- Holdout: shipped Levels `1-52`, seeds `13000000-13000299` (15,600 cells).
- Primary gate: zero champion-win regressions; zero slower both-win cells; at least 156 faster cells; faster cells span at least 10 levels; positive two-way-clustered all-cell mean move saving at `t > 3`.
- Product outcome is actual terminal play. Full-budget score cannot replace it.

## Invariants

- Challenger code is frozen before screen and cannot change thereafter.
- Evaluation runs each valid dataset at most once and never substitutes alternate seeds or Level 53.
- Records cannot promote the challenger or refresh receipts.
- Every step preserves champion, engine, levels, targets, recordings, receipts, calibration, and authoring hashes.
- Unconditional `offerFull` remains falsified and out of scope.
- Missing cells, identity drift, partial artifacts, or resource exhaustion are failure/`INCONCLUSIVE`.

## Done check

A fresh verifier must confirm corrected source identity, exact 520/15,600 level-major cell sets, disjoint seeds, one valid execution per dataset, every frozen gate, unchanged protected hashes and failure identities, and a final `SUPPORTED`, `NOT_SUPPORTED`, or `INCONCLUSIVE` verdict without champion promotion.

## Require

- Owner authorization from 2026-08-30.
- Diagnosis identity `be659e86...` and corrected challenger identity `c68247ce...`.
- V1 evaluation stop record showing no artifact/result.
- Baseline `be843368`, 52 exported shipped levels.

## Return

- Result envelope with terminal identity, corrected denominator, screen/holdout artifacts, gate verdict, protected-hash verdict, promotion recommendation only if supported, and this composition path.
