---
result: RESULT-0041
status: complete
registered: 2026-09-16T17:15:27Z
supersedes: RESULT-0040
reportable: confirmation
version_freeze:
  experiments/RESULT-0041/closeout-contract.json: 280fe43bc1091b53
  experiments/RESULT-0041/manifest.js: 1eba649927369648
  experiments/RESULT-0041/qualify.js: 3ffcb83610963720
  experiments/RESULT-0041/recompute.js: 023021959010c693
  experiments/RESULT-0041/registered-protocol.md: 9f5dd043bcc2793c
  experiments/RESULT-0041/result.js: 9de3e75b9717a15e
  experiments/RESULT-0041/result.test.js: f694fc77f6ce1184
  experiments/RESULT-0041/run.js: 575c043514b162f7
  experiments/RESULT-0041/run.test.js: 87db37c1dd0267b3
  experiments/RESULT-0041/subject.js: 68640746f89e735a
  experiments/RESULT-0041/verify.js: 882e8064259e8f58
  experiments/RESULT-0041/verify.test.js: eb85751ba04689b8
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

# Pre-registration — real-board greed-ratio validation with bound receipts

**Registered:** 2026-09-16, before any confirmation seed was opened.

This record supersedes RESULT-0040's failed pre-outcome qualification and binds
[the complete frozen protocol](registered-protocol.md) at SHA-256
`9f5dd043bcc2793c51f6820862c2dda63183e383a2e3a97bcfc3213f3e3b6eb6`,
the [executable closure contract](closeout-contract.json) at SHA-256
`280fe43bc1091b5377a4c1b11b3b46afbec126bbc87aa6048c9587c05621b4b4`,
and subject identity
`4afc2ef4e5ea125d066dfcc494fc9c56c63df0faede3562e3a23593b8f4c984c`.

## Question and decision

Does exact-denominator greed ratio respond to four fixed immediate-reward
policies, track policy win rate without merely tracking score, and remain
non-vacuously seed-stable on real shipped boards? A `SUPPORTED` result makes
the proxy eligible only for a separate owner adoption decision.

## Design and panel

Profiles are `candidate-measure`, `simulation-policy`, and
`mutation-qualification`. Percentiles 0.25, 0.50, 0.75, and 1.00 play shipped
Levels 10, 31, 53, and 54 on fresh seeds 33,800,000–33,800,007: 128 paired
games. Exact enumeration stops deterministically at 500,000 path states;
work-limit games remain `UNKNOWN`. Any 30-second watchdog timeout invalidates
the run. Half-score move is diagnostic only.

## Controls and mutations

C1–C7 freeze arithmetic, deterministic exact/reference behavior, positive and
scale-invariant policy manipulation, four production-verifier mutation kills,
independent reducer agreement on four edge classes, timing orthogonality, and
the 420-test repository baseline. The same manifest derives both qualification
tests and source closure. Confirmation cannot start without qualification
`PASS` and source restoration.

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
