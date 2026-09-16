---
result: RESULT-0038
status: registered
registered: 2026-09-16T15:51:29Z
supersedes: RESULT-0037
reportable: confirmation
version_freeze:
  experiments/RESULT-0038/registered-protocol.md: 734d3347520c4409
  experiments/RESULT-0038/closeout-contract.json: f778503c60c6681e
  experiments/RESULT-0038/subject.js: 6723a12ab53688bf
  experiments/RESULT-0038/run.js: f571553264b03a06
  experiments/RESULT-0038/verify.js: f2e84ed9bfe81294
  experiments/RESULT-0037/result.js: d1da6eb007a226c6
  experiments/RESULT-0037/recompute.js: 6234881e36ab5803
  experiments/RESULT-0037/result.test.js: 9eda3228e0bc577a
  experiments/RESULT-0037/run.test.js: 87db37c1dd0267b3
  experiments/RESULT-0037/verify.test.js: ad8d35ca874a659c
  solver/behavior-descriptors.js: b87820b67b8ea004
  solver/greed-descriptor-screen.js: c687bdbce2f09645
  solver/exact-greed-denominator.js: ee07a5031237590a
  solver/exact-greed-worker.js: facfb93a28207725
  solver/exact-score.js: 5574c9f60c503c28
  solver/tests/behaviorDescriptors.test.js: edb68f6a46b23e4c
  solver/tests/greedDescriptorScreen.test.js: 27b503bddcc9ef52
  solver/tests/exactGreedDenominator.test.js: 6ca6762661e10491
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — deterministic exact greed-ratio closure replication

**Registered:** 2026-09-16, before any confirmation seed was opened.

This record binds `registered-protocol.md` at SHA-256
`734d3347520c440922bff0c07cd860ebfbe6407b608705baa1fe0c063e285270`,
the executable contract at SHA-256
`f778503c60c6681e490df205735309e908fd83c56fee1b4407ccd9c5fa250b97`,
and subject identity
`2f17ec3c4db62546a7d1f0d328e3b69d30b411186eadba1ec4bb742fe3ba34b2`.

## Question and panel

Does deterministic exact-denominator greed ratio respond to four fixed
percentile policies, track win rate without merely tracking score, and remain
seed-stable? Percentiles 0.25, 0.50, 0.75, and 1.00 run on shipped Levels 10,
31, 53, and 54 with fresh seeds 33,500,000–33,500,007: 128 paired ordered
games. Arms play to budget or a genuine terminal; target crossing does not stop
play. Half-score move is diagnostic only.

## Instrument and closure correction

The exact denominator stops at 500,000 deterministic path states per move;
cap hits are `UNKNOWN/work-limit` for the whole game. A 30-second watchdog
invalidates the run. The independent reducer consumes only the immutable
corpus and emits its decision on stdout, which the closure verifier can compare
byte-for-byte without replaying games. This is the sole design change from
RESULT-0037; its outcomes are excluded and every threshold is unchanged.

## Frozen checks

- C1–C4: arithmetic, exact/work-limit behavior, percentile manipulation, and
  objective equivalence must pass their frozen production-seam controls.
- C5: independent analysis, known-kill mutations, externally anchored source
  closure, final artifact verification, and executable closeout must pass.
- C6: solver suite retains exactly four deliberate failures and one skip.
- P1: support at >=25% exact overall, >=12.5% per policy, and every
  policy/level represented; falsify below 10%, missing matrix, or empty policy.
- P2: support for strictly increasing greed means spanning >=0.30; falsify if
  unordered/missing or below 0.15.
- P3: support policy win/greed Pearson `r >=0.50`; falsify at `r <=0`.
- P4: support per-game score/greed `|r| <0.70`; falsify at `|r| >=0.85`.
- P5: support >=80% modal-or-adjacent greed-bin stability in every policy;
  falsify below 60%.
- P6: all supported gives `SUPPORTED`; any falsification gives `FALSIFIED`;
  otherwise `INCONCLUSIVE`.

## Stops

One confirmation attempt only. No retries, seed replacements, changed
thresholds/caps/bins/policies/levels, discarded capped games, partial-trace
averages, or alternate enumerator. Verification and one corpus-only independent
reduction are allowed. Adoption and timing-axis validation remain separate.
