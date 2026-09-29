# LC-0012 — early-ready timing panel successor contract v2

**Frozen:** 2026-09-28, during pre-harness source validation and before any
new immediate-cash counterfactual was executed

**Status:** frozen successor; use this file together with the retained v1
contract named below. Where the two conflict, this successor controls.

## Reason for succession

The committed v1 protocol incorrectly described the LC-0011 positive control
as a continuation stored in recording
`ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.
Mechanical source inspection before harness construction showed that LC-0011's
post-decision path is instead an exact reconstruction using the unchanged
champion after the owner's move 11. The human recording takes different later
moves. No LC-0012 selector, qualification, or immediate-cash arm had run when
this defect was found.

The retained v1 protocol is
`docs/learning-cycles/LC-0012-early-ready-timing-panel-contract.md`, SHA-256
`200b262568182ed7363a68e891ee83d5570abd1ab8411b50310ebaa55112ec07`.
All of its question, experiment types, source corpus, opportunity selector,
arms, primary objective, matrix, bounds, outcomes, controls C1 and C3–C9,
evidence budget, forbidden adaptations, result locations, and frozen
identities remain unchanged except for the explicit replacements below.

## Replacement: positive-control source binding

The LC-0011 control is external to the 24-recording selection universe. Its
exact sources are frozen by
`docs/learning-cycles/LC-0012-timing-panel-source-extension-v2.json`, SHA-256
`1baceda14832332c263c8af2b09fc25847e79079ce2204d31a23c3badfb82608`. That extension must bind the retained v1 source
manifest and the LC-0011 protocol, manifest, qualification, raw pair, and
harness by full SHA-256.

The LC-0011 positive control cannot make a corpus recording eligible, satisfy
the LC-0012 diversity floor, enter the reportable matrix, or affect a panel
outcome. It calibrates only the generic early-ready assessment and pair
validation seams.

Delete this v1 requirement entirely:

> The LC-0011 anchor in recording `ecc405...` must appear among the eligible
> candidates at pre-move 14 for the chain actually cashed on move 15.

No expectation replaces it inside the corpus selector.

## Replacement C2 — exact-state early-ready positive control

- **Role/profile:** positive readiness and pair-validation control,
  `simulation-policy`.
- **Subject/seam:** the retained LC-0011 common state and `WAIT_ONE` raw trace
  through the new public early-ready assessor and pair validator. This is an
  exact real-engine trajectory, not a corpus recording continuation.
- **Expected:** before LC-0011's first 3,072-point wait action, the ten-tile
  route is live and engine-valid with common state identity
  `d6bf03cee41bd1539b167c8de37ea7b87e269f4fef473c3bf3144e74fc416dff`,
  ordered values nine 1,024 tiles followed by 2,048, and cashout points 56,320.
  The route remains valid after the separate wait action and is the next
  unchanged-champion action.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** qualification observation bound to the LC-0011 raw artifact and
  focused test.

## Replacement C4 — versioned control and deterministic A/A

- **Role/profile:** reference arm and synthetic null, `ab-comparison` /
  `simulation-policy`.
- **Subject/seam:** two independent validations of the retained LC-0011
  `WAIT_ONE` raw trace through the public pair validator, plus two independent
  `OBSERVED_WAIT` replays of a selected real corpus unit when at least one unit
  exists.
- **Expected:** the LC-0011 validations byte-match and retain target crossing on
  move 15 with zero paired target-cost difference. If the corpus selector
  yields any unit, its two disposable control-arm replays also byte-match. An
  empty selected panel is not converted into a qualification failure; it is
  handled only by the registered `INSUFFICIENT_PANEL` domain outcome.
- **Failure meaning:** qualification fails; no reportable run.
- **Evidence:** disposable traces and selected-unit count in the qualification
  receipt.

## Qualification interpretation

Qualification may enumerate corpus eligibility and retain the selected keys,
because selection uses no counterfactual outcome. It still may not execute
`CASH_NOW` for any corpus recording. A synthetic fixture may exercise that arm
only when its state and outcome cannot disclose a corpus cell.

The v1 contract defect is a preregistration correction, not a qualification
attempt: no harness existed and no qualification command or reportable outcome
had run. The two-attempt qualification budget therefore remains intact.
