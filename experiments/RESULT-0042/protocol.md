---
result: RESULT-0042
status: complete
registered: 2026-09-16T19:25:33Z
supersedes: RESULT-0041
reportable: confirmation
version_freeze:
  experiments/RESULT-0042/closeout-contract.json: 6bed5404140e6d55
  experiments/RESULT-0042/manifest.js: 4d6fba540c484d68
  experiments/RESULT-0042/qualify.js: b4ccc88bbe551b58
  experiments/RESULT-0042/recompute.js: 023021959010c693
  experiments/RESULT-0042/registered-protocol.md: 0fe8bdb222656ca2
  experiments/RESULT-0042/result.js: 9de3e75b9717a15e
  experiments/RESULT-0042/result.test.js: f694fc77f6ce1184
  experiments/RESULT-0042/run.js: 682a3e9d6895aba1
  experiments/RESULT-0042/run.test.js: c980c3fadb695960
  experiments/RESULT-0042/subject.js: 6db6d2c719b53686
  experiments/RESULT-0042/verify.js: 0544e076b8ab7240
  experiments/RESULT-0042/verify.test.js: 0f74376a23e769e8
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

# Pre-registration — real-board greed-ratio validation with a calibrated watchdog

**Registered:** 2026-09-16, before any confirmation seed was opened.

This record supersedes RESULT-0041's invalid confirmation and binds
[the complete frozen protocol](registered-protocol.md) at SHA-256
`0fe8bdb222656ca2c1d3a9d3e3638fb6b13e9053df329afd6815d7650bee9da8`,
the [executable closure contract](closeout-contract.json) at SHA-256
`6bed5404140e6d55cb7a9cfdd44b5e652ce3e26b4c70ddfd81570111cf3f8a91`,
and subject identity
`95f2a943e5edd534560399ffeae8d4b67363a5f40cea137654448a358e62d3e8`.

## Question and decision

Does exact-denominator greed ratio respond to four fixed immediate-reward
policies, track policy win rate without merely tracking score, and remain
non-vacuously seed-stable on real shipped boards? A `SUPPORTED` result makes
the proxy eligible only for a separate owner adoption decision.

## Design and panel

Profiles are `candidate-measure`, `simulation-policy`, and
`mutation-qualification`. Percentiles 0.25, 0.50, 0.75, and 1.00 play shipped
Levels 10, 31, 53, and 54 on fresh seeds 33,900,000–33,900,007: 128 paired
games. Exact enumeration stops deterministically at 500,000 path states;
work-limit games remain `UNKNOWN`. The infrastructure watchdog is relaxed from
30 to 120 seconds after the already-burned failure position completed in
14.584 seconds under the unchanged work cap. Any 120-second timeout invalidates
the run. Half-score move is diagnostic only.

## Controls and mutations

C1–C7 freeze arithmetic, deterministic exact/reference behavior, the formerly
timed-out game under the relaxed watchdog, positive and scale-invariant policy
manipulation, four production-verifier mutation kills, independent reducer
agreement on four edge classes, timing orthogonality, and the 420-test
repository baseline. The same manifest derives qualification tests and source
closure. Confirmation cannot start without qualification `PASS` and source
restoration.

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
exactly once. No retries, replacement seeds, changed thresholds, caps, bins,
policies, levels, discarded capped games, partial averages, or alternate
enumerators. Recompute once from the immutable corpus. Report every claim and
stop before adoption.
