---
id: RETRY-001
run: 2026-09-08-adhoc-result-0030-retry
status: complete
executor: orch-tdd
pack: orch-code-pack
independence: gate
depends_on: []
write_scope:
  - experiments/RESULT-0030/run.js
  - experiments/RESULT-0030/verify.js
  - experiments/RESULT-0030/analyze.js
  - solver/tests/syntheticDescriptorValidation.test.js
  - docs/CHECK-CARDS.md
  - .orch/tickets/2026-09-08-adhoc-result-0030-retry/RETRY-001.md
excluded_actions:
  - Modify or delete RESULT-0029 protocol/report/source files.
  - Register RESULT-0030, reserve seeds, or execute any shipped-level game.
  - Modify protected game, engine, policy, ledger, current-status, receipt, or prior-experiment files.
  - Merge, rebase, push, or write to the canonical checkout.
bound: one mechanical identity migration and one verification pass
claimed_by: /root
claimed_at: 2026-09-08T06:35:00Z
---

# RETRY-001 — Materialize RESULT-0030 harness identity

## Objective

Create a RESULT-0030 copy of the already reviewed RESULT-0029 runner, verifier,
and calculator whose only semantic change is the result-local identity/path,
while preserving the invalid RESULT-0029 record unchanged and generating no
outcomes.

## Completion test

1. After normalizing `RESULT-0030` to `RESULT-0029`, each new source is
   byte-identical to its RESULT-0029 counterpart. Oracle: deterministic Node
   byte comparison; oracle_class: deterministic; provenance: pre-existing
   RESULT-0029 code and authored-here mechanical copy.
2. `node --test solver/tests/syntheticDescriptorValidation.test.js` passes all
   thirteen tests through RESULT-0030's production seams. Oracle class:
   deterministic; provenance: pre-existing/authored-here, gate re-verifies.
3. The real RESULT-0030 CLI without a registered protocol exits nonzero and
   writes nothing. Oracle: focused production-CLI test; oracle_class:
   deterministic; provenance: authored-here, gate re-verifies.
4. `docs/CHECK-CARDS.md` names RESULT-0030 and notes that RESULT-0029 was
   invalidated before compute. Oracle: card inspection; oracle_class: judged;
   provenance: authored-here, gate re-verifies.
5. Git shows no diff to RESULT-0029 protocol/report/source files or protected
   project surfaces, no outcome artifact, and `git diff --check` passes.
   Oracle class: deterministic; provenance: Git.

## Return fields

Status, result commit, changed artifacts, normalized-copy verdict, focused
tests, no-registration/no-data verdict, check-card verdict, protected-source
verdict, feedback, risks.

## Result

**Status:** complete

**Result commit:** `77bb0bb9b791c4cf3d12c99b3c3ee83bc02e1459`

**Changed artifacts:** RESULT-0030 runner/verifier/calculator, focused test
bindings, live Check Card, and this ticket.

## Verification

1. `NORMALIZED COPY PASS`: each RESULT-0030 source equals its reviewed
   RESULT-0029 counterpart after result-id normalization.
2. Focused tests: 13/13 pass through RESULT-0030 paths.
3. The production RESULT-0030 CLI without registration exits nonzero before
   output; no result artifact exists.
4. The Check Card names RESULT-0030 as live and RESULT-0029 as invalidated
   before compute; gate-check disposition is PROCEED for the identity-only
   migration.
5. Baseline-to-result diff is empty for RESULT-0029, every protected project
   surface, ledger, and CURRENT; `git diff --check` passes.

## Feedback

- Duplication is intentional custody: the invalidated RESULT-0029 source and
  protocol remain reproducible while RESULT-0030 receives a distinct identity.

## Risks

- Future changes must not update both result directories as if they were one
  live abstraction. RESULT-0029 is historical; RESULT-0030 is the only live
  harness.
