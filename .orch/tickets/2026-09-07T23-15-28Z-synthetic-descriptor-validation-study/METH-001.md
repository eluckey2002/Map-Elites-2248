---
id: METH-001
run: 2026-09-07T23-15-28Z-synthetic-descriptor-validation-study
status: claimed
executor: orch-investigate
pack: orch-research-pack
independence: gate
depends_on: []
write_scope:
  - experiments/RESULT-0029/protocol.md
  - experiments/RESULT-0029/analyze.js
  - experiments/SEEDS.md
  - solver/tests/syntheticDescriptorValidation.test.js
excluded_actions:
  - Execute a control, confirmation, pilot, or any shipped-level outcome game.
  - Modify run.js, verify.js, protected product/policy/evidence files, prior experiments, or the frozen spec.
  - Merge, rebase, push, or write to the canonical checkout.
bound: one red-green analysis tracer and one registration commit
claimed_by: /root
claimed_at: 2026-09-07T23:20:00Z
---

# METH-001 — Freeze method and registration

## Question

Can one committed pre-data method encode the spec's factor diagnostics and
level-held-out prediction exactly, while the project gate accepts the
RESULT-0029 registration and fresh seed reservation?

## Fixed evidence and source slice

- Frozen study spec at commit `40d5151`, SHA-256
  `4443a50282337fb389edf480f2f5e97297c695f59693cc6ae77985525d0c9192`.
- Predecessor code result `7f9caf7bdd5769ce27630b36d4bce3090c45b6a6`.
- Source policy slice: current RESULT-0029 runner/verifier, experiment rules,
  seed registry, shipped level data, and code-result test harness only.
- Craft: `/Users/eluckey/.orchflows/lib/packs/orch-research-pack/references/craft.md`.

## Completion test

1. Literal tests fail before and pass after the calculator implements every
   frozen aggregation, factor-slice, standardization, k=5, tie-break, Brier,
   outcome-support, and diagnostic field. Oracle: focused Node test;
   deterministic, authored-here/gate.
2. Calculator first validates its real input with RESULT-0029's production
   verifier, binds input and analyzer identities, writes new only, and is
   byte-stable. Oracle: focused Node test; deterministic, authored-here/gate.
3. Protocol declares C1-C3/P1-P3, exact policies/levels/seeds/thresholds,
   source freeze, one confirmation, stop rules, and adoption boundary. Oracle:
   experiment gate plus inspection; deterministic and judged.
4. SEEDS declares both fresh ranges before use, with controls nonreportable and
   confirmation reportable. Oracle: source search plus inspection; evidence.
5. No outcome file exists and protected/harness diffs are empty. Oracle: Git
   and artifact search; deterministic.

## Return fields

Status, registration commit, changed artifacts, focused tests, experiment-gate
outcome, source hashes, seed verdict, no-data verdict, feedback, risks.

## Result


## Verification


## Feedback


## Risks
