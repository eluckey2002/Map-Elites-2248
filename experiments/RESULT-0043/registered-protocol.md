# Frozen protocol — executable-closeout greed-ratio replication

**Registered:** 2026-09-16, before any confirmation seed was opened.

## Declaration, claim, and consuming decision

- Primary profile: `candidate-measure`, SHA-256
  `5b1edc87a2e4c7bdcea493c7ba6b03c017fae6a13d05044b8df99586e5d167e4`.
- Context profile: `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Assurance profile: `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- Frozen subject identity:
  `ca788bc698a5f9f61877d1d0a1d682bb15974cf321d681e38eaf2f6ac08ba5c8`.

Claim: on the named shipped-board panel, exact-denominator `greedRatio` responds
to fixed immediate-reward policies, tracks policy win rate without merely
tracking score, and is stable enough across paired seeds to be considered for
one MAP-Elites behavior axis. The consuming decision is only whether the owner
may separately consider adoption. This experiment never adopts the measure.

This run supersedes RESULT-0042, whose complete 128-game corpus remained
`UNVERIFIED` because its frozen closeout argv was repository-root-relative
while its working directory resolved to the experiment directory. RESULT-0042
showed that the calibrated 120-second watchdog lets the full matrix complete,
but its descriptive outcomes are excluded from this confirmation. This
successor keeps every scientific threshold, policy, level, deterministic work
cap, and watchdog unchanged; it fixes only the closeout working directory,
qualifies that path before confirmation, and uses fresh seeds.

## Construct and executable proxy

The intended construct is **immediate-reward greed**: the fraction of the best
currently available chain value that a policy chooses to cash in.

The executable proxy `greedRatio` is the mean across played moves of played
points divided by the exact maximum points of any legal chain on that same
pre-move board. The played move is included, so complete ratios are in `[0,1]`.
Enumeration stops after 500,000 unique `(tail tile, visited tile set)` path
states in deterministic order. Completion is `exact_result`. A cap hit is
`UNKNOWN/work-limit`, must report exactly 500,000 visited path states, and
makes the whole game's ratio unknown; partial traces are never averaged. A
120,000 ms child-process watchdog is infrastructure protection, and any timeout
invalidates the run.

The proxy cannot establish human preference, fun, difficulty, player identity,
fitness, content quality, levels outside this panel, or a timing axis.
Half-score move remains diagnostic. Build potential remains a policy term.

## Subjects, production seam, and panel

Policies at percentiles 0.25, 0.50, 0.75, and 1.00 use the production
strong-settings candidate generator and choose the candidate closest to their
fixed fraction of its strongest candidate's points, preferring higher points
on ties. The positive manipulation is the ordered percentile ladder. Uniformly
scaling candidate values is the negative/no-change manipulation. Changing
half-score timing while holding greed observations fixed is the orthogonal
manipulation.

Each policy plays shipped Levels 10, 31, 53, and 54 on fresh seeds
34,000,000–34,000,007: 128 ordered games, percentile then level then seed.
These are real 5×8, 5×7, 6×5, and 4×8 shipped boards, not micro-boards. Boards
and spawn streams are paired. Arms play to the shipped move budget or a genuine
no-move/bomb terminal; target crossing records a win but does not stop play.
The unit of generalization is the fixed policy over this four-level panel, not
an individual seed. The production verification seam is
`experiments/RESULT-0043/verify.js#verifyArtifact`.

## Controls

- **C1 — candidate-measure, arithmetic baseline.** Production trace fixtures
  must distinguish measured exact ratios from unknown work-limited ratios.
  Failure means qualification `FAIL` and confirmation does not start.
- **C2 — simulation-policy, deterministic exact/reference and watchdog
  controls.** An exact fixture must return its known maximum; repeated capped
  results must be byte-identical; proxy and exact modes must produce the same
  score, win, move count, and terminal reason on burned seed 33,300,000. The
  formerly timed-out Level 10 / percentile 1.00 / seed 33,800,004 game must
  complete all 22 moves without a timeout under the 120-second watchdog.
  Work-limit standings are allowed and remain `UNKNOWN`. Failure stops
  confirmation.
- **C3 — candidate-measure, positive and negative manipulation.** The planted
  25/50/75/100-point offer must map to the four policies, while uniformly
  doubling all offers must leave each selected fraction unchanged. Failure
  stops confirmation.
- **C4 — mutation-qualification, known kills.** The exact production verifier
  must pass a clean fixture and kill stale body identity, coherent seed-panel
  substitution, wrong work-limit count, and coherent source substitution for
  their named reasons. A middle-modal policy split across all three bins must
  report exact-modal share 0.50 and fail the 0.60 stability floor. Any survivor
  makes qualification `FAIL`.
- **C5 — candidate-measure, independent analysis.** Registered analysis and
  the independent corpus reducer must byte-match on the valid fixture and on
  work-limited, zero-exact-policy, null-cell, and non-default-policy panels.
  The frozen closeout `cwd` and argv must also execute the reducer against a
  qualification fixture and byte-match its expected output. Failure stops
  confirmation.
- **C6 — candidate-measure, orthogonal manipulation.** Changing only
  half-score timing must leave P1–P5 and greed policy summaries unchanged.
  Failure stops confirmation.
- **C7 — common repository baseline.** The solver suite must retain exactly
  420 tests, 415 passes, four documented deliberate failures, and one skip
  before registration. Any new failure in the focused qualification suite
  stops confirmation.

The source-closure set and qualification test command are both derived from
`manifest.js`. The expected seed range and registered source hashes come from
the committed protocol, not from the candidate artifact. Qualification must
prove restoration by matching source hashes before and after in-memory mutants.

## Predictions and domain outcomes

- **P1 exact coverage:** `SUPPORTED` at 128 games, at least 25% exact overall,
  at least 12.5% exact per policy, and at least one exact game per policy/level;
  `FALSIFIED` for an incomplete matrix, below 10% overall, or an empty policy;
  otherwise `INCONCLUSIVE`.
- **P2 controlled response:** `SUPPORTED` for strictly rising exact policy
  means spanning at least 0.30; `FALSIFIED` when unordered, missing, or spanning
  less than 0.15; otherwise `INCONCLUSIVE`.
- **P3 win tracking:** `SUPPORTED` at policy-level Pearson `r >= 0.50`;
  `FALSIFIED` at `r <= 0`; otherwise `INCONCLUSIVE`.
- **P4 score non-redundancy:** `SUPPORTED` at per-game `|r| < 0.70`;
  `FALSIFIED` at `|r| >= 0.85`; otherwise `INCONCLUSIVE`.
- **P5 non-vacuous stability:** for each policy, calculate the share of exact
  games in that policy's exact modal fixed greed bin (`low <0.45`, `mid
  0.45..<0.75`, `high >=0.75`). `SUPPORTED` when every policy is at least 80%;
  `FALSIFIED` when any is below 60%; otherwise `INCONCLUSIVE`. No adjacency
  credit is allowed.
- **P6 primary:** all P1–P5 supported with C1–C7 passing gives `SUPPORTED`;
  any falsified prediction gives `FALSIFIED`; otherwise `INCONCLUSIVE`.

Diagnostics are exact-completeness by cell, greed mean range, both
correlations, per-policy modal shares, and half-score timing. They cannot
replace P6. Flip evidence is any threshold crossing caused by one additional
policy-level unit or by one exact game's bin assignment; it is reported, not
used to adapt the result.

## Budget, completeness, and forbidden adaptations

Commit this protocol, executable contract, harness, analysis, and manifest
before qualification. Qualification may use only synthetic fixtures and the
already-burned seeds 33,300,000 and 33,800,004. It has one attempt identity;
three failures at the same step end `UNVERIFIED` rather than trigger redesign
in place.

Only after qualification `PASS`, run exactly one 128-game confirmation. No
retries, replacement seeds, changed thresholds, caps, bins, policies, levels,
discarded work-limit games, partial-trace averages, or alternate enumerators.
Missing matrix cells or a watchdog timeout invalidate the run. Artifact
verification and one corpus-only independent stdout recomputation are allowed;
neither plays another game. Every C and P cell must be closed as `PASS`,
`FAIL`, or `UNVERIFIED`. Adoption and timing-axis validation are separate.
