---
result: RESULT-0043
status: complete
registered: 2026-09-16T19:47:48Z
supersedes: RESULT-0042
reportable: confirmation
version_freeze:
  experiments/RESULT-0043/closeout-contract.json: 66c18f65643d528a
  experiments/RESULT-0043/manifest.js: b85c6436e0b8d6b1
  experiments/RESULT-0043/qualify.js: 32bc23be49f37d9b
  experiments/RESULT-0043/recompute.js: 023021959010c693
  experiments/RESULT-0043/registered-protocol.md: 8a161f6ac3686a6e
  experiments/RESULT-0043/result.js: 9de3e75b9717a15e
  experiments/RESULT-0043/result.test.js: f694fc77f6ce1184
  experiments/RESULT-0043/run.js: 37704556a7afcbba
  experiments/RESULT-0043/run.test.js: c980c3fadb695960
  experiments/RESULT-0043/subject.js: f7e8453e2f2ebe7d
  experiments/RESULT-0043/verify.js: 8e2e6b8b760d76a1
  experiments/RESULT-0043/verify.test.js: 627b55760deafd73
  solver/behavior-descriptors.js: b87820b67b8ea004
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/engine.js: 0ed4b31004df13e3
  solver/exact-greed-denominator.js: ee07a5031237590a
  solver/exact-greed-worker.js: facfb93a28207725
  solver/exact-score.js: 5574c9f60c503c28
  solver/experiment-guard.js: 200ad71fad9492a3
  solver/greed-descriptor-screen.js: c687bdbce2f09645
  solver/policy-eval.js: 2250754e430a2f1a
  solver/tests/behaviorDescriptors.test.js: edb68f6a46b23e4c
  solver/tests/exact-score.test.js: 82239db635831a72
  solver/tests/exactGreedDenominator.test.js: 6ca6762661e10491
  solver/tests/greedDescriptorScreen.test.js: 27b503bddcc9ef52
  src/game.js: 3d405595707621ce
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — executable-closeout greed-ratio replication

**Registered:** 2026-09-16, before any confirmation seed was opened.

This record supersedes RESULT-0042's `UNVERIFIED` closeout and binds
[the complete frozen protocol](registered-protocol.md) at SHA-256
`8a161f6ac3686a6e8c36672e933531882639fa10ee0797e12f658ddabdef356e`,
the [executable closure contract](closeout-contract.json) at SHA-256
`66c18f65643d528aa58b292116b005a4a96a4ef1cb1a2d5576394b19c6779f8f`,
and subject identity
`ca788bc698a5f9f61877d1d0a1d682bb15974cf321d681e38eaf2f6ac08ba5c8`.

## Question and decision

Does exact-denominator greed ratio respond to four fixed immediate-reward
policies, track policy win rate without merely tracking score, and remain
non-vacuously seed-stable on real shipped boards? A `SUPPORTED` result makes
the proxy eligible only for a separate owner adoption decision.

## Design and panel

Profiles are `candidate-measure`, `simulation-policy`, and
`mutation-qualification`. Percentiles 0.25, 0.50, 0.75, and 1.00 play shipped
Levels 10, 31, 53, and 54 on fresh seeds 34,000,000–34,000,007: 128 paired
games. Exact enumeration stops deterministically at 500,000 path states;
work-limit games remain `UNKNOWN`. The emergency watchdog is 120 seconds. Any
watchdog timeout invalidates the run. Half-score move is diagnostic only.

The scientific design and thresholds are unchanged from RESULT-0042. The only
closeout repair is `cwd: "../.."`, resolving the frozen argv from the repository
root. Qualification must execute that exact cwd/argv path against a fixture
before confirmation.

## Controls and mutations

C1–C7 freeze arithmetic, deterministic exact/reference behavior, the formerly
timed-out game under the calibrated watchdog, positive and scale-invariant
policy manipulation, four production-verifier mutation kills, independent
reducer agreement on four edge classes, executable closeout path qualification,
timing orthogonality, and the 420-test repository baseline. Confirmation cannot
start without qualification `PASS` and source restoration.

## Predictions

- P1: support at 128 games, >=25% exact overall, >=12.5% per policy, and every
  policy/level represented; falsify for an incomplete matrix, <10% overall, or
  an empty policy.
- P2: support strictly rising exact means spanning >=0.30; falsify unordered,
  missing, or <0.15.
- P3: support policy win/greed Pearson `r >=0.50`; falsify at `r <=0`.
- P4: support per-game score/greed `|r| <0.70`; falsify at `|r| >=0.85`.
- P5: support when every policy places >=80% of exact games in its exact modal
  greed bin; falsify when any is below 60%. No adjacency credit is allowed.
- P6: all P1–P5 supported and C1–C7 passing gives `SUPPORTED`; any falsified
  prediction gives `FALSIFIED`; otherwise `INCONCLUSIVE`.

## Stops

After a committed registration and one qualification attempt, run confirmation
exactly once. RESULT-0042's descriptive outcomes are not pooled or substituted.
No retries, replacement seeds, changed thresholds, caps, bins, policies,
levels, discarded capped games, partial averages, or alternate enumerators.
Recompute once from the immutable corpus. Report every claim and stop before
adoption.
