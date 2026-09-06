---
id: REPAIR-001
run: 2026-09-05-policy-measurement-code
status: in_progress
executor: orch-repair
pack: orch-code-pack
independence: gate
depends_on: [GATE-001]
bound: 25 minutes
write_scope:
  - solver/human-benchmark.js
  - solver/benchmark-inputs.js
  - solver/benchmark-metrics.js
  - solver/benchmark-replay.js
  - solver/tests/humanBenchmark.test.js
  - solver/tests/policyBenchmark.test.js
  - docs/evaluation/POLICY-EVAL-0001/measurement-checks.md
---

## Objective and fixed inputs

Correct only F1-F5 accepted in the adjacent run's gate-f407d9c.md, under every
constraint and C1-C7 of spec.md. That report states each failed oracle and source.
This is the single orch-review-fix correction pass; no opportunistic changes.
No policy audit, frozen-input edits, receipt refreshes, external writes, or main operations.

Workspace: /private/tmp/2248-policy-measurement-2026-09-05, own branch. Before
writing, check exclusivity and fast-forward that branch to root's dispatch
commit, which preserves the exact reviewed code plus admin evidence. Nobody else
writes this worktree. Do not write any root-checkout file during this dispatch.
Ticket result may be written only in your own worktree and committed with your
return. Do not terminally accept the ticket yourself.

## Completion test

- F1: controlled reference/runtime faults through collect never become losses,
  converted wins or full-panel rankings; unavailable score data are not aggregated.
  Component missingness and any known regressions stay explicit per contract.
- F2: exact real candidate good control remains admitted; receipt lacking both
  identities and forged identities are rejected with precise reasons.
- F3: real missing-file collect/render control names required/available coverage
  and labels any resolved-subset metrics; cannot show full coverage by dropping it.
- F4: JSON and text include N/n with denominators, faster/slower/tied distribution,
  and subject/candidate identity appropriate to both provenance classes.
- F5: permanent negative controls drive public loading/collect/render for runtime
  faults, missing required file, actual extra file, and corrupted frozen package.
  Assert exact detection reasons, not crashes; cards state actual coverage.
- Run focused tests, both real CLI modes, full suite by exact failure identity,
  experiment gate and diff check. Preserve all protected hashes and all 15 inputs.
  The prior complete suite is 377/373 with only the four known failures. A new
  test count may grow; no new failure identity is acceptable.

Oracle provenance: pre-existing contract/spec, independent gate controls F1-F5.
New regression tests authored in repair, independently verified after return.
Read gate-check before altering checks; current cards are the scoped owner.
Return commits, changed_artifacts, per-F disposition, exact red/green evidence,
CLI summary/raw identity, no-worse failure names, limits and queued uncertainties.

## Result

Claimed in isolated worktree at `a28b4df`; exclusivity checked before the first
write. Repair implementation is `4602cd1` and the strengthened permanent
negative controls are `86a016a`. No terminal acceptance is claimed here.

Changed artifacts are exactly:

- `solver/human-benchmark.js`
- `solver/benchmark-inputs.js`
- `solver/benchmark-metrics.js`
- `solver/tests/humanBenchmark.test.js`
- `solver/tests/policyBenchmark.test.js`
- `docs/evaluation/POLICY-EVAL-0001/measurement-checks.md`

Per-defect disposition:

- F1 fixed: `collect` now classifies unavailable reference and diagnostic
  observations as explicit unresolved dispositions before row construction.
  Neither fault can enter win, speed, or score aggregation.
- F2 fixed: a receipt without `receiptIdentity` or `artifactIdentity` is rejected
  as `receipt missing receiptIdentity or artifactIdentity`; a forged self-identity
  is rejected as `receipt self-identity mismatch`. The real 15-row good control
  remains admitted.
- F3 fixed: score coverage carries both available attempts and the fixed
  manifest-file denominator. A panel with missing evidence is full-panel
  `UNRESOLVED`; any visible partial arithmetic is labeled `resolved-subset
  metrics; full panel UNRESOLVED`, and the missing disposition is rendered.
- F4 fixed: comparison JSON includes converted-win `caseCount` and
  `convertedWinFraction`; text exposes N/n, faster/slower/tied, score coverage,
  and the receipt-bound candidate/receipt or current-subject subject/source IDs.
- F5 fixed: the cards now name permanent controls through public collection and
  rendering for separate reference and diagnostic runtime faults, a real missing
  required file plus actual extra file, corrupted frozen contract bytes, and
  absent/forged receipt self-identities.

## Verification

- Independent RED at `f407d9c`: F1 produced `unresolved=[]`, converted wins
  `8.6667` and `3`, and aggregated faulted diagnostic scores; F2 admitted exact
  candidate content with only `{candidateIdentity}`; F3 displayed `11/11` for a
  12-file requirement without a subset label; F4 omitted N/n, distributions and
  text candidate identity; F5's 33/33 focused tests did not traverse those public
  failure paths.
- GREEN focused suite after implementation: 37/37. The permanent supplemental
  reference-fault, diagnostic-fault, and absent/forged-self-identity controls
  then passed 3/3 at `86a016a` with exact reasons.
- Both real CLI modes passed at clean `4602cd1`. JSON parsed as one 221,093-byte
  document with SHA-256 `5b1e838297f0071db9ac757f3d32a03531734e6ef998cf543fef0375db13e37b`,
  15 rows, 0 unresolved, 0 extras, and measurement-source identity
  `1c7ce6b4d6b270aedf06a3972007fa30cea18eac32d400d195b3f821566bfefd`.
  Text SHA-256 was `d759049518bd254757be42b157e0c09d23618742e0e7432532dff9867a346632`
  and contained every required N/n, distribution, coverage and provenance label.
  A final clean bookkeeping-commit identity is recorded in the return message.
- Full suite at clean `4602cd1`: 381 tests, 377 pass, exactly four known failures:
  `candidate-levels-52.json has a receipt that verifies against the current bot`;
  `candidate-levels-54.json has a receipt that verifies against the current bot`;
  `the builder is byte-stable and the committed generated views are current`;
  `verification observations derive from rebound evidence instead of copied
  metrics in code`. No new failure identity.
- `node tools/verify-experiments.js`: `EXPERIMENT GATE PASS`.
- `git diff --check a28b4df..HEAD`: PASS. Protected contract, manifest,
  `src/game.js`, `solver/engine.js`, `solver/level-author.js`, and `solver/bot.js`
  are unchanged from `a28b4df`.

## Feedback

F1 needed two controls, because a reference failure prevents the diagnostic arm
from running and therefore cannot prove that unavailable diagnostic score data
stay out of aggregation. The cards now state both exercised seams.

## Risks

- Acceptance remains with the independent affected-criteria verifier and root
  join; this repair does not self-accept.
- The selected panels remain descriptive, inspected cases rather than a
  population estimate or promotion result.
- The withdrawn HUMAN-PILOT receipt-wrapper question remains queued uncertainty,
  not an accepted defect and not changed here.
