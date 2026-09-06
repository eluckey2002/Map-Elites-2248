---
id: GATE-001
run: 2026-09-05-policy-measurement-code
status: complete
executor: orch-critique
pack: orch-code-pack
independence: checker
depends_on: [MEASURE-001]
write_scope: []
bound: 25 minutes
---

## Objective

Independently attack fixed code revision f407d9c8e85eb407fea3cb2483c1720e7d7daaec
against C1-C7 in the code spec. Baseline e0ed5a15f982b6584428de031f778ceb008c1d19.

## Fixed inputs

Spec: .orch/runs/2026-09-05-policy-measurement-code/spec.md (all constraints).
Artifact checkout: /private/tmp/2248-policy-measurement-2026-09-05, read-only.
Lens: /Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/lens.md.
Oracle policy and craft: sibling oracles.md and craft.md.
Standards: repository AGENTS.md, solver/AGENTS.md, frozen contract.md and inputs.json.
Do not read implementation ticket self-verdicts as criteria or gate evidence.

## Completion test

Return ranked evidenced findings, uncertainties, exact evidence inspected,
criteria coverage and changed_artifacts=[]; no edits, user interaction,
subdelegation, fresh games outside the benchmark, or policy audit.
Review complete public filesystem-to-CLI path and adversarial cases implied by
the contract, not only happy-path tests. Gate-check cards and negative controls
must genuinely exercise the guarded artifact. Assess API compatibility,
failure/missingness classifications, denominator labels, identities, terminal
order, horizons/RNG and scope/complexity. Never weaken a finding for repair cost.

Independent judged oracle: the pre-existing spec and frozen E01-E18 meanings;
direct source and runnable controls may support findings. New tests alone are
not independent proof. A suspicion without reproducible evidence is uncertainty.
Root separately reruns full suite after administrative commit; the four baseline
failures are the two stale candidate receipts, generated-view staleness and
date-drift verification. Do not repair or exempt these.

## Result

Read-only result integrated in ../../runs/2026-09-05-policy-measurement-code/gate-f407d9c.md.
Five evidenced findings accepted; no gate PASS. REPAIR-001 is the single correction pass.
