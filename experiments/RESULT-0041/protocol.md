---
result: RESULT-0041
status: registered
registered: 2026-09-17T02:30:05Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0041/registered-protocol.md: 99d3657699c2be9e
  experiments/RESULT-0041/closeout-contract.json: c017becc63f714dd
  experiments/RESULT-0041/subject.json: 0e9f79cf38d7a97d
  experiments/RESULT-0041/subject.js: 35918219abbd1188
  experiments/RESULT-0041/run.js: bde75fec08cbb418
  experiments/RESULT-0041/verify.js: 6f137b49ed218101
  experiments/RESULT-0041/recompute.js: 344a002634294559
  experiments/RESULT-0041/run.test.js: b382070ac9d84127
  solver/oracle/harvest-policy.js: 2b6c6ff96a6d10f6
  solver/oracle/search.js: 592d155120892330
  solver/oracle/simulation.js: 9cafa661bfb9bed1
  solver/oracle/verify.js: 6eeba60f146e1641
  solver/oracle/corpus.js: 15d9c87486696778
  solver/benchmark-inputs.js: 655ce8a84ffa03ccd
  solver/benchmark-replay.js: a714232d4e4bf308
  solver/human-benchmark.js: aeb2bef796ecedb8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — evolved harvesting policy on the captured corpus

**Registered:** 2026-09-17, before either policy was executed on the frozen
20-puzzle comparison matrix.

This lifecycle record binds the immutable scientific protocol at
`registered-protocol.md` (SHA-256
`99d3657699c2be9ef618d95c0ca764d53bf9a1fc49de14c87396021820b174ad`),
the subject manifest at `subject.json` (identity
`cd6491312ef5d34eb941a1fb7abdcbc47a37ce49a94f41199d49fccef1c95295`),
and the executable closure contract at `closeout-contract.json` (SHA-256
`c017becc63f714dd1601020abf38855da568f0046b235f1cc2e98693752ac415`).

## Experiment declaration

- Primary profile: `ab-comparison`, full SHA-256
  `a6f1c86ab5ce9c942a12888b0b8f9885d4ca53e5530683d382a7666d1a0fade9`.
- Context profile: `simulation-policy`, full SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Design: exact deterministic paired comparison of the pre-evolution and
  evolved harvest rankers on the frozen captured corpus.
- Primary panel: the 18 corpus puzzles absent from the four-board optimization
  panel. The two overlapping Level 56 puzzles are diagnostics only.
- Unit: each exact puzzle identity. No inference beyond this fixed panel.

## Question and outcome

Under identical seeded rules and exactly 600 expanded states per cell, does the
evolved ranker transfer better than the baseline ranker across the 18 non-tuning
captured puzzles without adding human misses or regressing any puzzle the
baseline wins?

- `SUPPORTED`: evolved wins at least as many puzzles with lower loss-adjusted
  moves, has no more human misses, and never loses or takes more moves on a
  baseline-winning primary puzzle.
- `FALSIFIED`: evolved wins fewer puzzles, has higher loss-adjusted moves, adds
  a human miss, loses a baseline-winning puzzle, or is slower on one.
- `INCONCLUSIVE`: the aggregate is tied without a strict efficiency gain, or
  required valid evidence is unavailable.

The exact estimators, each component outcome, controls, failure meanings, and
forbidden adaptations are frozen in `registered-protocol.md`.

## Starting state and evidence budget

- Parent HEAD: `2c178ad660f1f9cbf5f1ea0b471b82905ae99714` on branch
  `experiment/harvest-policy-corpus`, derived from `optimize/harvest-planning`.
- Repository baseline: 437 tests, 432 pass, the same four documented deliberate
  failures, and one skip.
- Qualification budget: one frozen-harness attempt, with at most three repeats
  at an unchanged failing infrastructure step.
- Reportable budget: one sequential 40-cell matrix; 600 expanded states and one
  emergency 30-second ceiling per cell.
- Verification and deterministic corpus reduction may repeat. Search may not.

No reruns, alternate policies, raised caps, row exclusions, replacement puzzles,
changed thresholds, or best-of selection are permitted after outcomes. Adoption,
shipping, and fresh-board confirmation remain separate decisions.
