# Premise Discovery for Next-Action Readiness

## Goal

At repository baseline `5090098337be5e8cfd8f78ee6ee2971cd843cf52`, resolve the three premises that determine whether the next level-authoring action should be an experiment, a human pilot, or a repair: measurement-instrument authority, eligible-candidate authority, and acceptance-criteria authority. Each premise must carry a compact challenge receipt, and no experiment, pilot, repair, measurement run, candidate generation, or production change is authorized.

Acceptance requires all three premise tickets to reach an evidence-supported verdict or honest `UNRESOLVED`, followed by one synthesis that consumes and independently challenges all three receipts without silently filling gaps.

## Spec

Ad-hoc frontier; no frozen delivery spec. Management intent is tracked on branch `codex/premise-discovery-readiness` in `docs/backlog/BL-0006-premise-discovery-readiness.md`.

## Tickets

`.orch/tickets/2026-09-01-premise-discovery-readiness/`

## Bound

- Initial lanes: 15 minutes or 10 tool calls each, whichever binds first.
- Synthesis: 15 minutes or 10 tool calls.
- No lane may run a broad test suite or a gameplay/measurement workload.
- At most one suspension or escalation per ticket; no automatic scope widening.

## Iterations

### 0 — Graph frozen

- Baseline: `5090098337be5e8cfd8f78ee6ee2971cd843cf52`.
- Retrospective: `experiments/RESULT-0021/retrospective.md`, SHA-256 `291ea771fc592fca50895a88b3f01cdd2915864487fe0520ff8ad7179dc0cc9e`.
- Ready frontier: `PD-001`, `PD-002`, `PD-003`.
- Dependent synthesis: `PD-004`.
- Budget spent: graph cutting only; no premise investigation dispatched yet.

### 1 — Initial frontier dispatched

- `PD-001` claimed by `/root/orch_worker_gpt_5_6_sol_high` at `2026-09-02T00:48:40Z`.
- `PD-002` claimed by `/root/orch_worker_gpt_5_6_sol_high_1` at `2026-09-02T00:48:40Z`.
- `PD-003` claimed by `/root/orch_worker_gpt_5_6_sol_high_2` at `2026-09-02T00:48:40Z`.
- All three use profile `orch-worker` through executor `orch-investigate`, with no repository write scope.
- Caller re-check cadence armed at five minutes, bounded above by each ticket's 15-minute lease. Ticket identity and durable progress decide state; transport silence does not.

### 2 — Initial frontier rejected at the join

- `PD-001`: `limited`; child under-delivered. A transport-only conclusion arrived after the 10-call bound, with no durable result.
- `PD-002`: `failed`; child under-delivered. A reported patch collision did not correspond to a changed canonical ticket; no result landed.
- `PD-003`: `failed`; child under-delivered. A complete-looking result was written outside the granted canonical ticket path and is not admitted.
- `PD-004`: `blocked` by the three terminal dependencies; it did not run.
- Failed join owner: child for all three. The packets named the canonical absolute ticket path and root-versus-worktree rule; each executor failed to deliver within that authority.
- Recovery rule: do not rerun broad discovery. Three bounded recovery tickets may use the failed transport/out-of-scope results only as untrusted leads, recheck the decisive primary evidence, and prove the canonical write seam before spending their remaining calls.

### 3 — Persistence-first recovery frontier dispatched

- `PD-001R`, `PD-002R`, and `PD-003R` were dispatched back to their original capability-matched workers as new work items, not resumptions of accepted work.
- Bounds: 5, 5, and 4 tool calls respectively; required first action is a canonical ticket progress marker.
- `PD-004R` replaces the blocked synthesis and remains pending on the three recovered packets.
- Caller re-check cadence: two minutes, below every recovery lease.

### 4 — Recovery frontier accepted; synthesis dispatched

- `PD-001R`: accepted to downstream gate with `LIVE_AUTHORING_PATH_AUTHORITATIVE`; canonical packet persisted; tracked diff empty.
- `PD-002R`: accepted to downstream gate with `AUTHORITATIVE_SET_IDENTIFIED`; exact 15-member set and batch/receipt identities persisted; tracked diff empty.
- `PD-003R`: accepted to downstream gate with `OWNER_JUDGMENT_REQUIRED`; mechanical/ranking/qualitative layers remain distinct; tracked diff empty.
- Independence for all three remains delegated to `PD-004R`; none is final merely because its producer ticket is complete.
- `PD-004R` claimed by `/root/orch_planner_gpt_5_6_sol_ultra` at `2026-09-02T00:57:35Z`; 15-minute/10-call bound; caller re-check cadence five minutes.

### 5 — Synthesis authored; fresh checker dispatched

- `PD-004R` authored `READY_TO_CHOOSE` with all three premises accepted, exact claim traces, disagreement/dependency registers, receipt challenges, and a non-executing decision surface.
- Authored-here synthesis is not accepted yet.
- Fresh `orch-check` dispatched as `/root/orch_worker_gpt_5_6_sol_high_3`; it may append one correction and set `checked_by`, but may not render verdicts.

### 6 — Checker correction accepted; fresh verifier dispatched

- Checker set `checked_by: /root/orch_worker_gpt_5_6_sol_high_3` and restored an original downstream-consumption constraint omitted from the recovery ticket.
- Checker narrowed `READY_TO_CHOOSE` to evidence sufficiency for choosing an action class, never permission to execute it.
- Checker invalidated the synthesis author's self-verification summary; deterministic identity and receipt observations remained covered.
- Fixed checked result SHA-256: `e3653c48482066d78971487f013a28f7e7f774cc5ab89efbcb5a0570d2739273`.
- `PD-004V` dispatched to fresh `/root/orch_worker_gpt_5_6_sol_high_4` for verdict rendering; it may not edit `PD-004R`.

### 7 — Verification accepted; campaign complete

- `PD-004V` rendered five of five criteria `PASS`; overall `PASS`; weakest oracle class `judged`.
- Checked synthesis identity remained `e3653c48482066d78971487f013a28f7e7f774cc5ab89efbcb5a0570d2739273` after verification.
- Verifier identity: `PD-004V` SHA-256 `3a210644cf8f442da1372f405320081d0602cf28e184973172b7faa28ac3f7aa` before caller-owned terminal-status update.
- Final readiness verdict: `READY_TO_CHOOSE`, meaning evidence suffices to choose among bounded action classes; it is not execution authorization.
- No tracked evidence-workspace content changed from `5090098337be5e8cfd8f78ee6ee2971cd843cf52`.

### 8 — Terminal lifecycle invalidated the full-file verifier identity

- Caller-owned transition `PD-004R status: claimed -> complete` changed the verifier-covered full-file SHA-256 from `e3653c48...` to `4d34aac3...`.
- Deterministic normalization of only that lifecycle field reproduces the prior checked hash exactly; result prose, checker append, and evidence identities did not change.
- The run is reopened for one narrow terminal-state verifier `PD-004V2`; no investigation, source mutation, or broad command is repeated.

### 9 — First terminal-state verifier failed on a moved evidence workspace

- `PD-004V2` proved the target's lifecycle-only delta and rendered criteria 1, 2, 3, and 5 `PASS`.
- Criterion 4 `FAIL`: the named evidence worktree had advanced to management commit `9fa8a1b`, so it no longer matched frozen baseline `5090098` even though the covered source hashes were unchanged.
- The failure is retained. Existing clean worktree `/private/tmp/2248-seed-variance-20260901` remains exactly at `5090098`; a final verifier may reuse unchanged verdict entries and re-run only the invalidated workspace criterion there.

### 10 — Final narrow verifier dispatched

- `PD-004V3` may reuse PD-004V2 criteria 1, 2, 3, and 5 because their covered identities remain unchanged.
- It reruns only criterion 4 against clean exact-baseline worktree `/private/tmp/2248-seed-variance-20260901`.
- Bound: four minutes or four tool calls; no source investigation or broad execution.

### 11 — Child lifecycle violation rejected; caller-run deterministic join prepared

- `PD-004V3` set its own terminal status and included unrelated extraction fragments in criterion-4 evidence. The join rejected it as child under-delivery despite its underlying clean-worktree commands.
- `PD-004V4` runs inline under pre-existing independence: it reuses the unchanged fresh judged entries from terminal `PD-004V2` and reruns criterion 4 with exact deterministic commands against the clean evidence worktree.

### 12 — Final join complete

- `PD-004V4` confirmed target `4d34aac3...`, terminal prior-verifier `45d3b6fc...`, four unchanged independent judged `PASS` entries, and a fresh deterministic criterion-4 `PASS` at clean evidence worktree `5090098`.
- Final dispositions: five of five `PASS`; overall `PASS`; weakest oracle class `judged`.
- Final readiness verdict remains `READY_TO_CHOOSE`, narrowed to choosing an action class and never execution authorization.

## Blame classes

- `PD-001`: child under-delivered — bound exhausted before canonical persistence.
- `PD-002`: child under-delivered — no durable return after alleged collision.
- `PD-003`: child under-delivered — changed artifact outside granted canonical path.

## Failed approaches

- Dispatching read-only investigators with a frozen worktree plus a main-root canonical ticket path did not reliably preserve the ticket-location distinction. Future recovery packets require the canonical progress marker as their first write, before source rechecks.

## Queued scope

- Any repair to calibration, generator, candidate stores, criteria, receipts, or project documentation beyond this campaign record.
- Any experiment, human pilot, gameplay interpretation, or candidate-selection decision.
- Any permanent adoption of RESULT-0021 retrospective proposals; they remain proposals until separately accepted.

## Terminal

- `complete` — final integration ticket `PD-004V4` combines unchanged independent judged entries for criteria 1, 2, 3, and 5 with a fresh deterministic criterion-4 PASS against the exact frozen evidence checkout. The campaign performed no experiment, pilot, repair, gameplay, measurement, candidate selection, or production mutation.
