---
id: BL-0006
title: Resolve the premises for the next level-authoring action
status: done
milestone: next-action-readiness
depends_on: []
updated: 2026-09-01
---

# BL-0006 — Resolve the premises for the next level-authoring action

## Authority

This record captures accepted planning intent, not evidence. The [evidence ledger](../../EVIDENCE_LEDGER.md) controls proof standing, and the result-local challenge receipts control whether another agent may trust a premise. Tickets and chat do not promote a claim.

## Desired outcome

The project can cheaply determine whether its next level-authoring action should be an experiment, a bounded human pilot, or a repair because the four load-bearing premises are explicit and challengeable:

1. Seed variance does or does not require repeated plays for noise control.
2. The authoritative measurement instrument is identified, or the conflict remains explicit.
3. The eligible candidate population is identified, or its absence remains explicit.
4. The authority for acceptance criteria is identified, including what remains owner judgment.

`RESULT-0021` resolves premise 1 at its recorded scope. This record manages premises 2–4 and their integration; it does not authorize the action selected afterward.

## Done — 2026-09-01

The bounded frontier completed with final readiness verdict `READY_TO_CHOOSE`. That means the premises now support an owner choice among experiment, human pilot, and repair; it does not select or authorize any of them.

- Measurement authority: `LIVE_AUTHORING_PATH_AUTHORITATIVE`. The executable generator and authoring verifier consume the live bot; this contradicts the recorded intent that `calib-1` serve as an independent frozen ruler.
- Eligible population: `AUTHORITATIVE_SET_IDENTIFIED`. RESULT-0021 binds one exact 15-member population to `generated-batch-04`; generated, entitled, and shipped remain distinct states.
- Acceptance authority: `OWNER_JUDGMENT_REQUIRED`. Mechanical gates and presentation ranking are executable, but qualitative disposition remains owner-gated and has no accepted dimensions or thresholds.

Canonical result: `.orch/tickets/2026-09-01-premise-discovery-readiness/PD-004R.md`, checked fixed-result SHA-256 `e3653c48482066d78971487f013a28f7e7f774cc5ab89efbcb5a0570d2739273`. Fresh verification: `PD-004V.md`, five of five criteria `PASS`, weakest oracle class `judged`. Original `PD-001` through `PD-004` remain retained failure records; the accepted recovery lineage is `PD-001R` through `PD-004R` plus `PD-004V`.

Cost exception: the original four-unit topology was not met. All three first-pass agents failed to persist to the canonical ticket location, requiring three separately bounded persistence-first recovery tickets, followed by the planned synthesis plus its required checker and verifier. Broad discovery, gameplay, measurements, and broad suites were not repeated, but this campaign is evidence-valid rather than a clean demonstration of the intended cost envelope.

## Acceptance criteria

- One compact evidence packet classifies measurement-instrument authority against primary source identities and records contradictions between declared intent and executable consumers.
- One compact evidence packet identifies the authoritative candidate set, proves that none currently exists, or returns `UNRESOLVED`; shipped levels, historical candidates, generated batches, entitled shortlists, stale receipts, and human-play candidates remain distinct.
- One compact evidence packet maps mechanical gates, ranking heuristics, historical intent, and qualitative owner judgment without inventing a threshold.
- Every packet includes the challenge-receipt fields retained by the RESULT-0021 retrospective: exact claim, real subject identity and seam, same-rule valid and controlled-false outcomes, downstream consumption, and identity-change invalidation.
- One independent synthesis consumes and challenges all three packets, then returns `READY_TO_CHOOSE`, `NOT_READY_UNRESOLVED_PREMISE`, or `NOT_READY_STALE_IDENTITY` without running an experiment, pilot, repair, gameplay session, measurement, or broad test suite.
- Every lane obeys its own frozen bound; any recovery or correction is separately bounded, retained in the run history, and does not silently rerun broad discovery. There is no duplicated row-level measurement evidence.

## Current evidence

- `RESULT-0021` in [the branch evidence ledger](../../EVIDENCE_LEDGER.md#result-0021--structural-level-ranking-is-stable-across-disjoint-seed-samples) records the accepted seed-variance verdict and its canonical challenge receipt.
- [The RESULT-0021 retrospective](../../experiments/RESULT-0021/retrospective.md), SHA-256 `291ea771fc592fca50895a88b3f01cdd2915864487fe0520ff8ad7179dc0cc9e`, distinguishes load-bearing rigor from avoidable delivery cost. Its prevention mechanisms remain proposals, not adopted project law.
- [CURRENT.md](../../CURRENT.md) says the open milestone choice is whether to run the generator at scale and against what acceptance bar; it also records unresolved candidate and stale-receipt state.
- `solver/calibration.js` declares `calib-1` as the frozen ruler that set existing targets. This campaign traced the current default authoring consumer to the live bot and retained the contradiction rather than treating the declaration as executable use.

## Next action

Choose which bounded action class to shape next. A human pilot requires the owner to state what qualitative evidence will count and how it routes to continue, repair/variant, reject, or later ship. A repair requires an owner decision that the frozen `calib-1` ruler is a prerequisite rather than merely recorded intent. An experiment requires one named unresolved question and preregistration when it generalizes beyond exact evidence. Do not execute any path from this backlog record alone.

## History

- 2026-09-01 — Activated after owner authorization. Based at commit `5090098337be5e8cfd8f78ee6ee2971cd843cf52`, which includes the completed RESULT-0021 retrospective. Scope deliberately excludes execution, repair, candidate generation, gameplay interpretation, and permanent process-rule changes.
- 2026-09-01 — Completed after three initial results failed the canonical ticket-location join, three persistence-first recovery packets succeeded, one planner synthesized them, one fresh checker restored an omitted downstream-consumption constraint, and one further verifier rendered five of five criteria `PASS`. The failure records were retained rather than rewritten.
