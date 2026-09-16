# Frozen protocol — deterministic exact greed-ratio validation

**Registered:** 2026-09-16, before any confirmation seed was opened.

## Experiment declaration

- Primary design profile: `candidate-measure`, SHA-256
  `5b1edc87a2e4c7bdcea493c7ba6b03c017fae6a13d05044b8df99586e5d167e4`.
- Context profile: `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Assurance profile: `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- Frozen final subject identity:
  `8fdee091fd35beb0d4b5cfdc868c909c062f8aa73715e428de69d490b5b7a37d`.

## Question and consuming decision

On a fresh paired panel, does greed ratio respond to a scripted player's
controlled immediate-reward percentile, predict policy win rate without merely
tracking score, and remain seed-stable when its exact denominator is bounded by
deterministic work rather than elapsed time?

A `SUPPORTED` result makes greed ratio eligible for a separate owner adoption
decision and a later two-axis experiment. It does not adopt the descriptor or
validate half-score move. `FALSIFIED` or `INCONCLUSIVE` stops adoption and names
the failed prediction.

RESULT-0036 is design evidence only. Its closure was `UNVERIFIED` because a
wall-clock-limited recomputation changed the exact-complete set. The current
instrument was calibrated only on already-burned seed 33,200,000: caps of
25,000, 100,000, 500,000, and 2,000,000 path states completed respectively
1, 4, 6, and 6 of 16 games. The 500,000 cap was selected before confirmation
because 2,000,000 doubled elapsed time without completing another game. No
descriptor or outcome measurements from calibration count here.

## Construct and executable proxy

- **Construct:** the share of immediately available scoring value captured by
  a played move.
- **Proxy:** `greedRatio`, the arithmetic mean of played move points divided by
  the exact maximum points of any legal chain on the same pre-move board.
- **Denominator bound:** enumerate at most 500,000 unique `(tail tile, visited
  tile set)` path states per move in deterministic traversal order. Completion
  produces an `exact_result`; reaching the cap produces `UNKNOWN/work-limit`
  with exactly 500,000 visited path states. A game's greed ratio is `UNKNOWN`
  if any move is not exact; partial moves are never averaged.
- **Emergency watchdog:** 30,000 ms per child process is infrastructure
  protection only. Any watchdog timeout invalidates and stops the confirmation
  run; it is never classified as ordinary descriptor evidence.
- **Bounds:** measured greed ratio lies in `[0, 1]`; the played move is included
  in the exact legal-chain set.

Half-score move is retained only as a diagnostic. Build potential remains a
policy term. This experiment makes no claim about difficulty, fun, player
preference, MAP-Elites fitness, humans, or levels outside the fixed panel.

## Policies, objective, and termination

Four policies use percentiles `0.25`, `0.50`, `0.75`, and `1.00`. On every
move, the production strong-settings greedy generator uses `tieBreak: degree`,
`pathWidth: 8`, untrimmed chains, and candidate limit 24. The policy selects
the candidate whose points are closest to its fixed fraction of the strongest
candidate's points, preferring the higher score on a tie.

Every arm plays the same level/seed board to its shipped move budget or a real
no-move/bomb terminal state. Crossing the target records a win but does not
stop play. Percentile 1 is the reference policy through the same public seam.

## Confirmation panel and matrix

- Shipped Levels 10, 31, 53, and 54.
- Fresh seeds 33,400,000–33,400,007 on each level.
- Four scripted percentile policies.
- Exactly 128 ordered games: percentile, then level, then seed.
- Unit of generalization: the fixed percentile policy across this four-level
  panel. Seeds repeat policy/profile observations and are not independent
  policies.
- Every policy receives identical level/seed boards and spawn streams.
- Missing matrix cells invalidate the run. Deterministic work-limit games stay
  recorded and feed P1. Any watchdog timeout invalidates the run.

## Qualification controls

### C1 — descriptor arithmetic

- **Role/profile:** positive and negative; `candidate-measure`.
- **Subject/seam:** `summarizeGameTrace` through the real play trace seam.
- **Expected:** a 20%/100% two-move fixture averages to 0.60 and an unmeasured
  move makes greed `null`.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `solver/tests/behaviorDescriptors.test.js`.

### C2 — deterministic exact denominator

- **Role/profile:** positive, negative, and restoration;
  `candidate-measure`, `simulation-policy`, `mutation-qualification`.
- **Subject/seam:** `exactGreedDenominator` spawning the production worker.
- **Expected:** a hand-enumerated fixture returns exact maximum 24; the large
  board returns byte-identical `UNKNOWN/work-limit` results twice at cap 1,000;
  the clean exact fixture still passes afterward.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `solver/tests/exactGreedDenominator.test.js`.

### C3 — controlled percentile manipulation

- **Role/profile:** positive manipulation; `candidate-measure`.
- **Subject/seam:** production percentile selector.
- **Expected:** planted 25/50/75/100-point candidates are selected by matching
  percentiles.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `solver/tests/greedDescriptorScreen.test.js`.

### C4 — objective equivalence

- **Role/profile:** reference and objective-equivalence; `simulation-policy`.
- **Subject/seam:** Level 54, qualification seed 33,300,000, percentile 0.75,
  through proxy and deterministic exact measurement modes.
- **Expected:** score, win, moves, and terminal reason are identical.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `experiments/RESULT-0037/run.test.js`.

### C5 — analysis, mutation, and identity closure

- **Role/profile:** known-kill, independent oracle, and restoration;
  `mutation-qualification`.
- **Subject/seam:** registered analysis, independent corpus reducer, artifact
  identity, row work cap, exact standing, source closure, registration ancestry,
  ordered matrix, and production verifier.
- **Expected:** independent reduction byte-matches the registered analysis on a
  planted supported panel; body, work-cap, and exact-standing mutants fail for
  named reasons; the retained corpus passes the production verifier.
- **Failure meaning:** qualification or closure fails; no domain outcome.
- **Evidence:** `result.test.js`, `verify.test.js`, source hashes, final verifier,
  and `primary-recomputation.json` reduced from the immutable corpus.

### C6 — suite baseline

- **Role/profile:** reference; common lifecycle.
- **Subject/seam:** `node --test solver/tests/*.test.js`.
- **Expected:** 420 tests, 415 pass, the same four documented deliberate
  failures, and one skip; no new failure.
- **Failure meaning:** confirmation may not start on a changed baseline.
- **Evidence:** pre-run output and post-run report.

## Registered predictions

### P1 — exact denominator coverage

- `SUPPORTED`: complete 128-game matrix, at least 25% exact-complete overall,
  at least 12.5% within every percentile, and at least one exact game in every
  percentile/level cell.
- `FALSIFIED`: incomplete matrix, below 10% exact-complete overall, or any
  percentile with zero exact games.
- `INCONCLUSIVE`: otherwise.

### P2 — controlled greed response

- `SUPPORTED`: exact mean greed rises strictly from percentile 0.25 through
  1.00 and spans at least 0.30.
- `FALSIFIED`: any reversal/missing policy or span below 0.15.
- `INCONCLUSIVE`: otherwise.

### P3 — win rate tracks greed

- `SUPPORTED`: Pearson correlation between the four policy mean exact-greed
  ratios and their all-game win rates is at least 0.50.
- `FALSIFIED`: correlation is at most zero.
- `INCONCLUSIVE`: otherwise.

### P4 — greed is not a score proxy

- `SUPPORTED`: absolute per-game Pearson correlation between exact greed and
  final score is below 0.70.
- `FALSIFIED`: absolute correlation is at least 0.85.
- `INCONCLUSIVE`: otherwise.

### P5 — seed stability

- `SUPPORTED`: every percentile has at least 80% of exact-complete games in
  its modal or adjacent frozen greed bin (`low <0.45`, `mid 0.45..<0.75`,
  `high >=0.75`).
- `FALSIFIED`: minimum policy stability is below 60%.
- `INCONCLUSIVE`: otherwise.

### P6 — primary domain outcome

`SUPPORTED` requires P1–P5 supported and C1–C6 passing. Any falsified
prediction gives `FALSIFIED`. Every other valid complete run gives
`INCONCLUSIVE`. No outcome adopts greed ratio.

## Budget, attempts, and forbidden adaptations

1. Commit this protocol, closeout contract, sources, tests, and seed reservation
   before opening any confirmation seed.
2. C1–C6 must pass before confirmation.
3. One confirmation attempt: exactly 128 games, cap 500,000, 30-second emergency
   watchdog, no timeout retry, and no replacement seed.
4. Deterministic artifact verification and one independent reduction of the
   immutable corpus are allowed; neither plays another game.
5. Do not change thresholds, percentiles, caps, bins, seeds, policies, levels,
   discard work-limit games, average partial traces, or substitute an
   enumerator after outcomes are visible.
6. The report records every prediction and the half-score diagnostic without
   promoting it. Adoption and a second-axis experiment are separate decisions.
