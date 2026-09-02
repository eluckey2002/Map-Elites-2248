---
id: FIX-REPAIR
run: 2026-09-02-experiment-lifecycle-completion-fix
status: complete
executor: orch-repair
depends_on: [FIX-DIAG]
write_scope:
  - experiments/RESULT-0021/protocol.md
  - experiments/RESULT-0024/protocol.md
  - tools/verify-experiments.js
  - solver/tests/experiments.test.js
  - docs/CHECK-CARDS.md
bound: five files; status-only lifecycle repair plus one regression guard
claimed_by: Codex /root
claimed_at: 2026-09-02T07:35:33-05:00
---

## Objective

Completed RESULT-0021 and RESULT-0024 enter the verifier's durable artifact
branch, and any future protocol with a report that remains `registered` fails
the experiment gate immediately even before frozen source files drift.

## Fixed inputs

- Completed FIX-DIAG cause and toggle evidence.
- Existing `assessVersionFreeze` registered/complete behavior.
- Existing RESULT-0021 and RESULT-0024 reports, ledger standing, and protocol
  strict-ancestor history.

## Completion test

1. Both protocol files say `status: complete`, with all other protocol content
   unchanged. Oracle: `git diff --word-diff=porcelain -- experiments/RESULT-0021/protocol.md experiments/RESULT-0024/protocol.md` shows only the two lifecycle words; oracle_class: deterministic diff; oracle_provenance: pre-existing.
2. A reported `registered` protocol produces exactly one lifecycle problem,
   while an unreported `registered` protocol and a reported `complete` protocol
   produce none. Oracle: named regression test in
   `solver/tests/experiments.test.js`; oracle_class: deterministic executable;
   oracle_provenance: pre-existing (the three exact cases are frozen here).
3. The original live gate passes with the uncommitted SCP-001 source changes.
   Oracle: `node tools/verify-experiments.js`; oracle_class: deterministic
   executable; oracle_provenance: pre-existing.
4. The modified experiment gate retains all earlier negative controls. Oracle:
   `node --test solver/tests/experiments.test.js`; oracle_class: deterministic
   regression suite; oracle_provenance: pre-existing.
5. `docs/CHECK-CARDS.md` contains a distinct lifecycle card with exact scope,
   regression test, enforcement, decay, and blind spots. Oracle: gate-check card
   field inventory; oracle_class: structural inspection; oracle_provenance:
   pre-existing.

## Return fields

- changed_artifacts
- per_defect_disposition
- regression_guard
- rerun_evidence
- queued_scope

## Result

- **changed_artifacts:** `experiments/RESULT-0021/protocol.md` and
  `experiments/RESULT-0024/protocol.md` each change only `registered` to
  `complete`; `tools/verify-experiments.js` adds the lifecycle predicate;
  `solver/tests/experiments.test.js` adds its three-state regression;
  `docs/CHECK-CARDS.md` adds the required distinct Check Card.
- **per_defect_disposition:** both stale lifecycle markers corrected; the gate
  now fails the same state immediately when a report exists.
- **regression_guard:** `a reported protocol cannot remain in the registered
  lifecycle state` ran red before the predicate existed and green afterward.
- **rerun_evidence:** experiment gate PASS; experiment tests 20/20 PASS;
  protocol word diff shows only the two status words.
- **queued_scope:** [].

## Verification

1. PASS — protocol-only word diff contains two `registered` → `complete`
   replacements and no other protocol change.
2. PASS — reported/registered fails exactly once; registered/no-report and
   complete/report pass.
3. PASS — `EXPERIMENT GATE PASS` against the SCP-001 source changes.
4. PASS — 20/20 experiment tests pass, including every prior negative control.
5. PASS — `reported-protocol-lifecycle-is-complete` Check Card names scope,
   permanent negative test, enforcement, decay, and five blind spots.

## Feedback

[]

## Risks

- The check reads only ledger-admitted result records; an unadmitted report can
  still retain a stale lifecycle marker, explicitly recorded on the Check Card.
