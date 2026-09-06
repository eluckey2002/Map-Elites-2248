---
id: BL-0014
title: Follow the required sequence for reliable and faster policy improvement
status: ready
milestone: policy-strategy
depends_on: []
updated: 2026-09-05
---

# BL-0014 - Required policy improvement sequence

## Authority

This record tracks accepted owner intent, not empirical proof.
DECISION-0006 in [the evidence ledger](../../EVIDENCE_LEDGER.md#decision-0006--require-the-policy-improvement-sequence) records the authorization.
The normative sequence and completion conditions are in [the plan](../plans/2026-09-05-policy-improvement-sequence.md).

## Desired outcome

Policy changes follow the accepted measurement and investigation order, so a proposed fix is chosen and evaluated against a demonstrated problem.

## Acceptance criteria

- Record each step's accepted result path and source identity before releasing its successor, per plan R1-R2.
- Preserve the reliable-wins-first priority and require an owner amendment for deviations, per R3.
- Retain the exact proof standing and valid no-change dispositions, per R4-R5.
- Complete any applicable implementation, validation, review, and promotion requirements under R6.

## Current evidence

- [Grounding report](../../.orch/runs/2026-09-05-policy-grounding/report.md), fixed at commit `505a6be20ae1a514bb83a6a80aebaef73e855db1`.
- [BL-0013](BL-0013-policy-vocabulary-gaps.md), prior proposal retained and paused pending this sequence's disposition.

## Stage record

| Step | State | Completion evidence |
| --- | --- | --- |
| 1. Evaluation contract | Ready; not executed | None |
| 2. Measurement corrections and benchmark | Blocked on Step 1 | None |
| 3. Bot-trajectory audit | Blocked on Step 2 | None |
| 4. Supported change and validation | Blocked on Step 3 | None |

Planning this sequence and the earlier grounding report do not complete any row.
This record becomes active when Step 1 begins; this turn only established the requirement.

## Next action

Consult the [Atlas support shortlist](../plans/2026-09-05-policy-improvement-atlas-support.md) when executing the relevant step. It is advisory, not another stage or an amendment to the required order. The whole plan is pinned to commit `85d8684`, SHA-256 `6310780fa70e31951345f3fa35f1160b3b13fa5bc39bc22410e49a9765fadfb2`; the consultation leaves that file and every stage state unchanged.

Write and review the Step 1 evaluation contract, including loss eligibility, paired speed, separate score diagnostics, case identity, and weighting.
Do not begin Step 2 corrections, a fresh audit, or policy implementation before the corresponding prerequisite closes.

## History

- 2026-09-05 - Owner accepted the four-step order as a requirement: "Great. Lets keep this order a requirement so we do not deviate. For each of these what are the steps needed?" Recorded the plan, stage prerequisites, and routing instructions together.
- 2026-09-05 - Owner reaffirmed the plan and requested an Atlas consultation. Preserved the exact whole-plan identity and attached three source-pinned method recommendations with limits; no stage executed or released.
