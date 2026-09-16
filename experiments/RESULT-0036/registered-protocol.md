# Frozen protocol — exact half-score-move × greed-ratio validation

**Registered:** 2026-09-16, before any confirmation seed was opened.

## Experiment declaration

- Primary design profile: `candidate-measure`, SHA-256
  `5b1edc87a2e4c7bdcea493c7ba6b03c017fae6a13d05044b8df99586e5d167e4`.
- Context profile: `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Assurance profile: `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- Frozen final subject identity:
  `7f24cd320b5aaeb679d57136ff101efdd4144ed0859c5fead0fa213993365e1b`.

## Question and consuming decision

On a fresh fixed panel, does exact-denominator greed ratio respond to a
scripted player's controlled immediate-reward percentile, track win rate
without merely tracking score, and remain seed-stable beside half-score move?
If every prediction is supported, the pair becomes eligible for a later
MAP-Elites archive design. Any other outcome stops before adoption and names
which coordinate or instrument needs repair.

The exploratory strong-greedy screen on seeds 33,100,000–33,100,063 is design
evidence only and is excluded from confirmation. Its artifact SHA-256 is
`9abd6d849842ffc12d8c23d769c9ecb7bc6442b073d5bf148fa880a3fa2da97b`.
It found policy-level
win/greed correlation 0.957, per-game score/greed correlation 0.337, minimum
same-or-adjacent stability 0.977, all three greed bins, and only early/steady
timing bins. These observations fixed the confirmation thresholds below; they
cannot count toward them.

## Constructs and executable proxies

- **Cash-in timing construct.** When during the played game score is realized.
  **Proxy:** `halfScoreMove`, the first one-indexed move whose cumulative score
  reaches at least half the final score, divided by moves used. Its bounds are
  `(0, 1]`; a scoreless or zero-move game is `null`.
- **Greed construct.** The share of immediately available scoring value taken
  on each move. **Proxy:** `greedRatio`, the arithmetic mean of played move
  points divided by the exact maximum points of any legal chain on the same
  pre-move board. The exact denominator is computed by
  `enumerateLegalChains` in a child process with a 2,000 ms timeout per move.
  Any timeout makes the entire game's greed ratio `UNKNOWN`; partial moves are
  never averaged into a game value. The played move is included in the
  denominator bound, keeping measured ratios in `[0, 1]`.

The policy term `build potential` is excluded. This experiment neither
defines nor validates it as a descriptor. Neither descriptor is difficulty,
fun, preference, fitness, or a statement about all human strategies.

## Fixed semantic map

Half-score bins are `early <0.45`, `steady 0.45..<0.70`, and `late >=0.70`.
Greed bins are `low <0.45`, `mid 0.45..<0.75`, and `high >=0.75`.

| | Low greed | Mid greed | High greed |
| --- | --- | --- | --- |
| Late cash-in | Patient Hoarder | Builder | Late Sprinter |
| Steady | Wanderer | Balanced | Steady Maximizer |
| Early cash-in | Dawdler | Opportunist | Greedy Sprinter |

The boundaries and names are frozen before confirmation and will not be moved
to improve occupancy.

## Scripted policies, objective, and termination

Four policies use percentiles `0.25`, `0.50`, `0.75`, and `1.00`. On every
move, the production strong-settings greedy generator uses `tieBreak: degree`,
`pathWidth: 8`, untrimmed chains, and the shipped candidate limit 24. The
policy selects the candidate whose points are closest to its fixed fraction
of the strongest candidate's points, preferring the higher score on a tie.

Every arm plays the same level/seed board to its shipped move budget or a real
no-move/bomb terminal state. Crossing the target records a win but does not
stop play, so score and descriptor comparisons have identical termination
semantics. Percentile 1 is the reference arm through the same public seam.

## Confirmation panel and matrix

- Shipped Levels 10, 31, 53, and 54.
- Fresh seeds 33,200,000–33,200,007 on each level.
- Four scripted percentile policies.
- Exactly 128 ordered games: percentile, then level, then seed.
- Unit of generalization: the fixed percentile policy across this four-profile
  panel. Seeds repeat a policy/profile and are not independent policies.
- Pairing: every percentile receives the identical level/seed boards and spawn
  streams.
- Missing cells invalidate the matrix. Exact-denominator timeouts remain
  recorded `UNKNOWN` games and feed P1's completeness rule.

## Qualification controls

### C1 — per-game descriptor arithmetic

- **Role/profile:** positive and negative controls; `candidate-measure`.
- **Subject/seam:** `PER_GAME_DESCRIPTORS` through `summarizeGameTrace` and the
  real `playToBudget` trace seam.
- **Expected:** early and late fixtures separate; a two-move 20%/100% greed
  fixture averages to 0.60; an unmeasured move makes greed `null`.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `solver/tests/behaviorDescriptors.test.js`.

### C2 — exact denominator and timeout

- **Role/profile:** positive and negative controls; `candidate-measure` and
  `simulation-policy`.
- **Subject/seam:** `exactGreedDenominator` spawning the production worker.
- **Expected:** the hand-enumerated four-tile fixture returns exact maximum 24
  across two legal chains; an intentionally impossible 1 ms large-board run
  returns `UNKNOWN/timeout`, never zero or a partial maximum.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `solver/tests/exactGreedDenominator.test.js`.

### C3 — percentile manipulation and semantic bins

- **Role/profile:** positive manipulation; `candidate-measure`.
- **Subject/seam:** production percentile selector and `descriptorCell`.
- **Expected:** planted 25/50/75/100-point candidates are selected by their
  matching percentiles, and boundary fixtures reach the frozen named bins.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `solver/tests/greedDescriptorScreen.test.js`.

### C4 — objective equivalence

- **Role/profile:** reference and objective-equivalence control;
  `simulation-policy`.
- **Subject/seam:** Level 54, exposed seed 33,100,000, percentile 0.75 through
  proxy and exact measurement modes.
- **Expected:** score, win, moves, and terminal reason are identical; changing
  the measurement denominator cannot change play.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `experiments/RESULT-0036/run.test.js`.

### C5 — mutation and identity closure

- **Role/profile:** known-kill and restoration controls;
  `mutation-qualification`.
- **Subject/seam:** artifact identity, exact-standing field, source closure,
  registration ancestry, ordered matrix, and decision recomputation in the
  production verifier.
- **Expected:** clean fixtures pass; a body mutation and a flipped
  `exactComplete` value fail for the named reasons; clean source hashes remain
  unchanged after qualification.
- **Failure meaning:** qualification fails; confirmation stops.
- **Evidence:** `experiments/RESULT-0036/verify.test.js`, source hashes in the
  confirmation artifact, and the final verifier.

### C6 — suite baseline

- **Role/profile:** reference control; common lifecycle.
- **Subject/seam:** `node --test solver/tests/*.test.js`.
- **Expected:** exactly the four documented deliberate failures and one skip;
  no new failure.
- **Failure meaning:** confirmation may not start on a changed baseline.
- **Evidence:** pre-run output and post-run report.

## Registered predictions

### P1 — exact denominator completeness

- `SUPPORTED`: complete 128-game matrix, at least 75% exact-complete games
  overall, and at least 50% in every percentile/level cell.
- `FALSIFIED`: incomplete matrix, below 50% exact completeness overall, or any
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

- `SUPPORTED`: for every percentile policy, at least 80% of exact-complete
  games land in its modal or edge-adjacent frozen cell.
- `FALSIFIED`: minimum policy stability is below 60%.
- `INCONCLUSIVE`: otherwise.

### P6 — expressive range of the pair

- `SUPPORTED`: both coordinates occupy all three frozen bins and at least five
  of nine named cells.
- `FALSIFIED`: timing occupies one bin, greed fewer than two, or at most three
  cells are occupied.
- `INCONCLUSIVE`: otherwise. Two timing bins therefore remain inconclusive,
  matching the exploratory warning instead of becoming a post-hoc rejection.

### P7 — primary domain outcome

`SUPPORTED` requires P1–P6 all supported and C1–C6 passing. Any falsified
prediction gives `FALSIFIED`. Every other valid complete run gives
`INCONCLUSIVE`. This outcome concerns the descriptor pair on the registered
panel; it is not an adoption decision.

## Budget, attempts, and forbidden adaptations

1. Commit this protocol, closeout contract, sources, tests, and seed
   reservation before opening any confirmation seed.
2. C1–C6 must pass first. The qualified harness identity is the frozen final
   subject identity above.
3. One confirmation attempt, exactly 128 games, 2,000 ms per exact move, no
   timeout retry and no replacement seed.
4. Deterministic artifact verification and one closure recomputation are
   allowed; they are not additional evidence attempts.
5. Do not move bin boundaries, change percentiles, add timing policies, add
   seeds, discard timeout games, average partial greed traces, or replace the
   exact enumerator after outcomes are visible.
6. The report records every prediction. Adoption, MAP-Elites integration, and
   any build-potential work are separate owner decisions.
