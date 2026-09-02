---
id: FIX-DIAG
run: 2026-09-02-experiment-lifecycle-completion-fix
status: complete
executor: orch-diagnose
depends_on: []
write_scope: []
bound: one deterministic reproduction and one cause toggle
claimed_by: Codex /root
claimed_at: 2026-09-02T07:35:33-05:00
---

## Objective

The cause of the four new RESULT-0021/RESULT-0024 version-freeze failures is
proven by a deterministic toggle, without modifying the repository.

## Fixed inputs

- `node tools/verify-experiments.js` failure after the uncommitted SCP-001
  changes to `solver/engine.js` and `solver/policy-eval.js`.
- Actual protocol files and cited artifacts for RESULT-0021 and RESULT-0024.
- `tools/verify-experiments.js#assessVersionFreeze`.

## Completion test

1. The live gate deterministically reports two freeze problems for RESULT-0021
   and two for RESULT-0024. Oracle: `node tools/verify-experiments.js`;
   oracle_class: deterministic executable; oracle_provenance: pre-existing.
2. With no file edit, applying only an in-memory `status: complete` toggle to
   each parsed protocol makes `assessVersionFreeze` return zero problems against
   the same cited artifacts. Oracle: Node invocation recorded in Result;
   oracle_class: deterministic executable; oracle_provenance: pre-existing.
3. Artifact-source mismatch is killed as an alternate cause: the complete-state
   branch returns zero uncovered-source problems. Oracle: the same toggle output;
   oracle_class: deterministic executable; oracle_provenance: pre-existing.

## Return fields

- reproduction
- proven_cause
- toggle_evidence
- killed_hypotheses

## Result

- **reproduction:** live focused suite and `assessExperiments()` returned four
  problems: current `solver/engine.js` and `solver/policy-eval.js` differ from
  each still-registered freeze for both RESULT-0021 and RESULT-0024.
- **proven_cause:** both completed runs retain `status: registered` in protocol
  frontmatter, so the verifier applies the live-tree pre-run freeze branch
  instead of the durable completed-artifact branch.
- **toggle_evidence:** against unchanged files and artifacts, the in-memory
  toggle produced `{registeredProblems:2, completeProblems:0}` for each result.
- **killed_hypotheses:** uncovered artifact-source hashes; both complete-state
  checks returned `completeProblemsDetail: []`.

## Verification

1. PASS — four deterministic live failures reproduced.
2. PASS — status-only in-memory toggle removed both failures for each result.
3. PASS — completed artifact-source coverage returned no problem.

## Feedback

[]

## Risks

- This diagnosis does not itself prevent a future completed run from retaining
  `status: registered`; the repair requires a new lifecycle regression guard.
