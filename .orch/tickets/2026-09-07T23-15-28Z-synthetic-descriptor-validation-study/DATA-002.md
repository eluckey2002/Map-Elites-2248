---
id: DATA-002
run: 2026-09-07T23-15-28Z-synthetic-descriptor-validation-study
status: claimed
executor: orch-investigate
pack: orch-research-pack
independence: checker
depends_on:
  - METH-001
write_scope:
  - .orch/runs/2026-09-07T23-15-28Z-synthetic-descriptor-validation-study/evidence/
excluded_actions:
  - Run confirmation unless both repeated controls verify and C1-C2 pass.
  - Rerun confirmation, substitute seeds/levels/policies, change code/protocol/thresholds, or edit reports.
  - Modify any tracked source, merge, rebase, push, or write to the canonical checkout.
bound: exactly two 324-cell controls and at most one 972-cell confirmation
claimed_by: /root
claimed_at: 2026-09-08T06:25:00Z
---

# DATA-002 — Execute registered controls and confirmation

## Question

Do the registered controls entitle opening the one confirmation, and if so what
complete verified raw and calculated artifacts result?

## Fixed evidence and source slice

- METH-001 registration commit
  `b735afe5afd25effa3f12dfc9c948603eeb051ed` and passing gates.
- Frozen study spec and registered RESULT-0029 protocol.
- Source policy slice: production runner/verifier, frozen calculator, declared
  control/confirmation seeds, and only this ticket's evidence store.
- Craft: `/Users/eluckey/.orchflows/lib/packs/orch-research-pack/references/craft.md`.

## Completion test

1. Two control artifacts verify, cover 324 cells each, and are canonically
   identical. Oracle: verifier plus exact bytes/body; deterministic.
2. Control calculation is byte-stable and C2's six slices all pass, or the
   ticket stops without confirmation and preserves the failure. Oracle: frozen
   calculator and registered thresholds; deterministic.
3. If controls pass, exactly one confirmation artifact verifies with 972 cells
   on the declared seeds, and its analysis reproduces byte-identically. Oracle:
   production verifier, frozen calculator, artifact/run-state inspection;
   deterministic and evidence.
4. Every artifact identity, runtime, command, exit, and stop decision is stored
   in the lane evidence packet. Oracle: evidence-store inspection.

## Return fields

Status, control identities and C1-C2, confirmation identity or stop reason,
analysis identities, commands/runtime, artifact paths, verification, breaches,
gaps, risks.

## Result


## Verification


## Feedback


## Risks
