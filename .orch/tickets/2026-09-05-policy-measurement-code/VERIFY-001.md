---
id: VERIFY-001
run: 2026-09-05-policy-measurement-code
status: failed
executor: orch-verify
pack: orch-code-pack
independence: checker
depends_on: [REPAIR-001]
write_scope: []
bound: 15 minutes
---

## Objective

Close the single code gate by independently rerunning the oracles for accepted
F1-F5 against fixed ce21196aca799b0c72c1e9b3025692dd45c3e861 in
/private/tmp/2248-policy-measurement-2026-09-05. This is verification, not another
correction pass. No writes, user interaction, or subdelegation.

## Criteria and evidence

All C1-C7 and constraints in .orch/runs/2026-09-05-policy-measurement-code/spec.md;
accepted findings in gate-f407d9c.md. Restate affected criteria from those inputs,
not from repair self-verdicts. Original lens/craft/oracles and standards apply.
Validate runtime unresolved propagation (reference and diagnostic separately),
real absent/forged receipt rejection, honest fixed coverage and subset labels,
N/n/distributions/identities, and truthful permanent public-path controls.
Explicitly ensure an unresolved panel can retain known regression evidence.
Run the final focused suite and necessary independent failure-path controls.
Check unchanged covered identities and inspect the complete correction diff.
Root separately runs final complete full suite and captures final CLI output.

## Completion test

Return per-F and per-affected-C verdicts with actual oracle/evidence/coverage,
surviving findings and uncertainties, fixed identity, changed_artifacts=[].
PASS requires every accepted finding closed by its actual failing oracle, no
blocking regression from repair, and C7 card coverage corresponding to exercised
public paths. Do not infer PASS from a check record. A survivor means the code
run stays incomplete; no second correction pass is silently authorized.

## Result

Fixed ce21196 independently verified: C1-C4/C6 PASS; C5/C7 FAIL. Complete
oracle/evidence/coverage, per-F dispositions and reproduction are in
../../runs/2026-09-05-policy-measurement-code/verification-ce21196.md.
Reviewer changed_artifacts=[]; root reproduced the survivor. One correction
pass is spent; the code run and Step 2 remain incomplete.
