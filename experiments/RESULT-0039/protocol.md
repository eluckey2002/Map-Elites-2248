---
result: RESULT-0039
status: registered
registered: 2026-09-16T17:15:27Z
supersedes: RESULT-0038
reportable: confirmation
version_freeze:
  experiments/RESULT-0039/closeout-contract.json: 5d0fcfa2fa898d6b
  experiments/RESULT-0039/manifest.js: 7f7ff7441a791d6b
  experiments/RESULT-0039/qualify.js: 6e5e3910f4fb30f7
  experiments/RESULT-0039/recompute.js: d899c14a328bb2fc
  experiments/RESULT-0039/registered-protocol.md: 1b41234cae7319bd
  experiments/RESULT-0039/result.js: 9de3e75b9717a15e
  experiments/RESULT-0039/result.test.js: f694fc77f6ce1184
  experiments/RESULT-0039/run.js: a182daa5319ffcde
  experiments/RESULT-0039/run.test.js: 87db37c1dd0267b3
  experiments/RESULT-0039/subject.js: 818fe95ea1c9cb7d
  experiments/RESULT-0039/verify.js: 2899d0fa5421436d
  experiments/RESULT-0039/verify.test.js: 4135832cd102f7c0
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

This record binds [the complete frozen protocol](registered-protocol.md) at
SHA-256 `1b41234cae7319bd95b1c867322ca0f178382963b538c971469561b48200ca9b`,
the [executable closure contract](closeout-contract.json) at SHA-256
`5d0fcfa2fa898d6bf2aab4ccac592ea77f109dd0809d2a7c9ef2dbc933e9376a`,
and subject identity
`2ff1df15db38dd571e61dc66ec9bff5d45b2f11b54cf26a1636d6bd4a350f681`.

## Question and decision

Does exact-denominator greed ratio respond to four fixed immediate-reward
policies, track policy win rate without merely tracking score, and remain
non-vacuously seed-stable on real shipped boards? A `SUPPORTED` result makes
the proxy eligible only for a separate owner adoption decision.

## Design and panel

Profiles are `candidate-measure`, `simulation-policy`, and
`mutation-qualification`. Percentiles 0.25, 0.50, 0.75, and 1.00 play shipped
Levels 10, 31, 53, and 54 on fresh seeds 33,600,000–33,600,007: 128 paired
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
