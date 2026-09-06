---
id: BL-0014
title: Follow the required sequence for reliable and faster policy improvement
status: active
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
- [Step 2 descriptive baseline](../evaluation/POLICY-EVAL-0001/baseline.md), raw JSON SHA-256 `a79fe73494dbff59dc7bc8a822c558caf18f3ce0b194412f4e02cbf38b03889e`.
- [Step 2 measurement acceptance](../evaluation/POLICY-EVAL-0001/measurement-acceptance.md), independently accepted; exact final document/source identities linked there.

## Stage record

| Step | State | Completion evidence |
| --- | --- | --- |
| 1. Evaluation contract | Complete; accepted | [POLICY-EVAL-0001 acceptance](../evaluation/POLICY-EVAL-0001/acceptance.md); frozen at `e415df78b77a8f32ec2d97912ccd198bfaad2d21` |
| 2. Measurement corrections and benchmark | Complete; accepted | [Measurement acceptance](../evaluation/POLICY-EVAL-0001/measurement-acceptance.md); source `c61d443...`, baseline `a79fe734...`, independent WHOLE-001 PASS, final envelope linked there |
| 3. Bot-trajectory audit | Ready; unexecuted | Accepted Step 2 predecessor; no audit result |
| 4. Supported change and validation | Blocked on Step 3 | None |

Planning this sequence and the earlier grounding report did not complete any row.
Step 1 closed only after the independent review and committed freeze below;
its document acceptance is not a new policy result or a benchmark baseline.

Accepted Step 1 package at `e415df78b77a8f32ec2d97912ccd198bfaad2d21`:

- [contract.md](../evaluation/POLICY-EVAL-0001/contract.md), whole-file SHA-256 `3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f`.
- [inputs.json](../evaluation/POLICY-EVAL-0001/inputs.json), whole-file SHA-256 `1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb`.
- [Independent review](../evaluation/POLICY-EVAL-0001/review.md): contract readiness and all 18 worked examples PASS. Source inventory checks covered 58 shipped objects and 15 raw recording paths, not 15 qualified cases.

## Next action

Recheck the accepted Step 1 and Step 2 identities, then define the bounded
Step 3 audit of the unchanged bot's own trajectories before collecting any
new measurements. Register and commit a protocol before any generalizing run.
No audit or policy change has run in this closeout. The earlier next-action
text below is retained as stage history.

Consult the [Atlas support shortlist](../plans/2026-09-05-policy-improvement-atlas-support.md) when executing the relevant step. It is advisory, not another stage or an amendment to the required order. The whole plan is pinned to commit `85d8684`, SHA-256 `6310780fa70e31951345f3fa35f1160b3b13fa5bc39bc22410e49a9765fadfb2`; the consultation leaves that file and every stage state unchanged.

### Historical next action before the accepted code repair

Begin Step 2 only after citing and rechecking the accepted Step 1 package and
relevant subject/reference inputs. Correct the source-pinned premises and
benchmark under that contract, verify real and controlled-misleading inputs,
and reproduce the descriptive baseline. No Step 2 work ran in the contract
session. Do not start the bot-trajectory audit or policy implementation until
their corresponding prerequisites close.

## History

- 2026-09-05 - Owner resumed the six-title correction and final verification.
  Independent content verification passed; the eleven-document bundle landed
  locally at `d6b6e05`. Whole verification at `49214e5` passed with weakest
  class judged; the fresh clean suite passed 378/382 with the same four known
  failures. Step 2 accepted, Step 3 ready-unexecuted, Step 4 still blocked.

- 2026-09-05 - The extra repair at `c61d443...` passed independent VERIFY-002 and was accepted at `36b0455...`. METHOD-003 carried the unchanged contract/input identities; METHOD-029 exercised real and controlled bad collect/render paths. The source corrections and baseline are now drafted for independent final composition checks. Step 2 remains incomplete; METHOD-025 and Step 3 remain blocked.

- 2026-09-05 - Step 2 implementation and one independent review/repair cycle ran. Final code `ce21196` preserves all 15 inputs and protected sources; full suite 378/382 retains the same four failures. Independent final verification leaves C5/C7 failed on the all-unresolved renderer. No Step 2 acceptance, record-correction delivery, bot audit, or policy change is claimed.

- 2026-09-05 - Owner's next "proceed" opened Step 2. Rechecked the frozen predecessor and 27 source/recording hashes. Code and records are sequential delivery kinds; no Step 3 audit or policy change has begun. Intermediate implementation/test output is not Step 2 acceptance.

- 2026-09-05 - Owner accepted the four-step order as a requirement: "Great. Lets keep this order a requirement so we do not deviate. For each of these what are the steps needed?" Recorded the plan, stage prerequisites, and routing instructions together.
- 2026-09-05 - Owner reaffirmed the plan and requested an Atlas consultation. Preserved the exact whole-plan identity and attached three source-pinned method recommendations with limits; no stage executed or released.
- 2026-09-05 - Executed Step 1 after the owner's "proceed": froze POLICY-EVAL-0001 at `e415df78b77a8f32ec2d97912ccd198bfaad2d21`, preserved an independent PASS review, and recorded acceptance. METHOD-003 supplies the whole-contract/input freeze and successor reference; no Atlas change or effectiveness claim. Released Step 2 as ready, not executed; Steps 3-4 stay blocked. No games, benchmark changes, or policy edits.
