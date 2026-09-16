---
result: RESULT-0036
status: complete
registered: 2026-09-16T13:00:00Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0036/registered-protocol.md: 56672e9cbab04f3b
  experiments/RESULT-0036/closeout-contract.json: 9d2dd1c68aa1db9e
  experiments/RESULT-0036/subject.js: 0756d7a7cecc27ba
  experiments/RESULT-0036/run.js: 20b35c25c0e6cbbc
  experiments/RESULT-0036/recompute.js: 6b0c6da822b190a4
  experiments/RESULT-0036/verify.js: 73c7b77c910f6cb5
  experiments/RESULT-0036/run.test.js: 6450c6462fdcc272
  experiments/RESULT-0036/verify.test.js: 50272e8db18706de
  solver/behavior-descriptors.js: b87820b67b8ea004
  solver/greed-descriptor-screen.js: a4a8e29307df53f2
  solver/greed-descriptor-result.js: 4af428cbb7548a7f
  solver/exact-greed-denominator.js: c2d95427dc7b12af
  solver/exact-greed-worker.js: 069578e74f4f363d
  solver/tests/behaviorDescriptors.test.js: edb68f6a46b23e4c
  solver/tests/greedDescriptorScreen.test.js: f653f85dea1fe75a
  solver/tests/greedDescriptorResult.test.js: 762c2e3f12a9454b
  solver/tests/exactGreedDenominator.test.js: a4b5b686ee3d1d1c
  solver/exact-score.js: edf48486735048e8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — exact half-score-move × greed-ratio validation

**Registered:** 2026-09-16, before any confirmation seed was opened.

This lifecycle record binds the immutable scientific protocol at
`registered-protocol.md` (SHA-256
`56672e9cbab04f3ba8b3c1cab3d6c2a5ba42999dbfdf23a842123a3b59b591fa`)
and executable closeout contract at `closeout-contract.json` (SHA-256
`9d2dd1c68aa1db9e7494e80705f836058be7089042fb92d42b3f8688023a553e`).
The frozen final subject identity is
`7f24cd320b5aaeb679d57136ff101efdd4144ed0859c5fead0fa213993365e1b`.

## Question

Does exact-denominator greed ratio respond to four fixed-percentile scripted
players, track win rate without merely tracking score, and remain seed-stable
beside half-score move on a fresh fixed panel?

## Profiles and measures

The registered profiles are `candidate-measure`, `simulation-policy`, and
`mutation-qualification`, with identities recorded in the immutable protocol.
Half-score move is the normalized first move reaching half the final score.
Greed ratio averages played points divided by the exact maximum legal-chain
points on the same pre-move board. Exact enumeration runs in a child process
with a 2,000 ms per-move timeout; any timeout makes that game's greed value
`UNKNOWN`.

Build potential remains a policy term and is not measured here.

## Panel and frozen map

Percentiles 0.25, 0.50, 0.75, and 1.00 run on shipped Levels 10, 31, 53, and
54 with seeds 33,200,000–33,200,007: exactly 128 ordered games. Every arm plays
to budget or a genuine terminal state; target crossing records a win but does
not stop play.

The 3×3 names and boundaries are frozen in `registered-protocol.md`: timing at
0.45 and 0.70, greed at 0.45 and 0.75. The exploratory screen is excluded.

## Checks, classified before outcomes are assigned

### C1 — per-game descriptor arithmetic (PASS / FAIL)

Early/late timing, greed averaging, unknown propagation, and the real trace
seam must pass their fixed controls.

### C2 — exact denominator and timeout (PASS / FAIL)

The exact child must return the hand-enumerated maximum 24 and turn an induced
timeout into `UNKNOWN`.

### C3 — percentile manipulation and semantic bins (PASS / FAIL)

The selector and all frozen bin boundaries must pass their fixtures.

### C4 — objective equivalence (PASS / FAIL)

Proxy versus exact measurement must leave score, win, moves, and terminal
reason unchanged on the exposed control game.

### C5 — mutation and identity closure (PASS / FAIL)

Body and exact-standing mutants must fail the production verifier; source,
registration, matrix, and decision identities must close.

### C6 — suite baseline (PASS / FAIL)

The full solver suite must retain only the four documented deliberate failures
and one skip.

### P1 — exact denominator completeness

Supported at a complete matrix, at least 75% complete overall and 50% per
percentile/level cell; falsified on an incomplete matrix, below 50% overall,
or a percentile with no exact games; otherwise inconclusive.

### P2 — controlled greed response

Supported for strictly increasing exact mean greed with range at least 0.30;
falsified for reversal, missing policy, or range below 0.15; otherwise
inconclusive.

### P3 — win rate tracks greed

Supported at policy-level Pearson `r >= 0.50`; falsified at `r <= 0`;
otherwise inconclusive.

### P4 — greed is not a score proxy

Supported at per-game `|r| < 0.70`; falsified at `|r| >= 0.85`; otherwise
inconclusive.

### P5 — seed stability

Supported when every percentile has at least 80% same-or-edge-adjacent cell
membership; falsified below 60%; otherwise inconclusive.

### P6 — expressive range of the pair

Supported when both axes occupy all three bins and at least five cells;
falsified at one timing bin, fewer than two greed bins, or at most three cells;
otherwise inconclusive.

### P7 — primary domain outcome

All supported gives `SUPPORTED`; any falsification gives `FALSIFIED`; every
other conforming run gives `INCONCLUSIVE`. No outcome adopts the descriptors.

## Stops and forbidden adaptations

One confirmation attempt; no retries, replacement seeds, partial-trace
averaging, moved bins, new policies, extra seeds, or alternate enumerator.
Verification and one deterministic closure recomputation are allowed.
