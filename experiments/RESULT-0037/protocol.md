---
result: RESULT-0037
status: complete
registered: 2026-09-16T15:35:32Z
supersedes: RESULT-0036
reportable: confirmation
version_freeze:
  experiments/RESULT-0037/registered-protocol.md: 278014b02d32dd86
  experiments/RESULT-0037/closeout-contract.json: b8c6adcb8d9e3f82
  experiments/RESULT-0037/subject.js: 0a2fe70f5e1cc22d
  experiments/RESULT-0037/result.js: d1da6eb007a226c6
  experiments/RESULT-0037/run.js: ea2531878d03d069
  experiments/RESULT-0037/recompute.js: 6234881e36ab5803
  experiments/RESULT-0037/verify.js: bb68531163ccb19e
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

# Pre-registration — deterministic exact greed-ratio validation

**Registered:** 2026-09-16, before any confirmation seed was opened.

This lifecycle record binds the immutable scientific protocol at
`registered-protocol.md` (SHA-256
`278014b02d32dd863be307d59f192fc8dc110f0649d4755bf052189ead4d1a3f`)
and executable closeout contract at `closeout-contract.json` (SHA-256
`b8c6adcb8d9e3f823a6a2bc72b85c9613a556e24b4f4fdc5d73b68a2bc2ae65f`).
The frozen final subject identity is
`8fdee091fd35beb0d4b5cfdc868c909c062f8aa73715e428de69d490b5b7a37d`.

## Question

Does deterministic exact-denominator greed ratio respond to four fixed
percentile policies, track win rate without merely tracking score, and remain
seed-stable on a fresh paired panel?

## Profiles and measure

The profiles are `candidate-measure`, `simulation-policy`, and
`mutation-qualification`, with identities in the immutable protocol. Greed
ratio averages played points divided by the exact maximum legal-chain points
on the same pre-move board. Exact enumeration stops after 500,000 unique path
states; a hit is `UNKNOWN/work-limit`. A 30-second child watchdog invalidates
the run if it fires. Half-score move is diagnostic only.

## Panel

Percentiles 0.25, 0.50, 0.75, and 1.00 run on shipped Levels 10, 31, 53, and
54 with fresh seeds 33,400,000–33,400,007: exactly 128 ordered, paired games.
Every arm plays to budget or a genuine terminal state; target crossing records
a win but does not stop play.

## Checks, classified before outcomes

- **C1:** descriptor arithmetic and unknown propagation pass.
- **C2:** exact fixture returns 24 and repeated work-limit results are identical.
- **C3:** fixed-percentile selection passes planted candidates.
- **C4:** measurement mode leaves game outcome unchanged.
- **C5:** the independent reducer matches planted analysis; identity, cap, and
  standing mutants die; final source, matrix, registration, and artifact
  identities close.
- **C6:** full solver suite retains exactly four deliberate failures and one skip.
- **P1:** exact coverage is supported at >=25% overall, >=12.5% per policy,
  and at least one exact game per policy/level; falsified below 10% overall,
  incomplete matrix, or an empty policy.
- **P2:** controlled response is supported for strictly increasing policy means
  spanning >=0.30; falsified if unordered/missing or spanning <0.15.
- **P3:** win tracking is supported at policy Pearson `r >= 0.50`; falsified at
  `r <= 0`.
- **P4:** non-redundancy with score is supported at per-game `|r| < 0.70`;
  falsified at `|r| >= 0.85`.
- **P5:** greed-bin stability is supported at >=80% for every policy and
  falsified below 60%.
- **P6:** all P1–P5 supported gives `SUPPORTED`; any falsification gives
  `FALSIFIED`; otherwise `INCONCLUSIVE`.

## Stops and forbidden adaptations

One confirmation attempt; no retries, replacement seeds, partial-trace
averaging, changed thresholds/caps/policies, or alternate enumerator.
Verification and one independent reduction of the retained corpus are allowed;
neither replays a game. Adoption and the second-axis experiment are separate.
