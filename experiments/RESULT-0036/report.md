# RESULT-0036 — Exact greed descriptor validation

The registered confirmation completed its 128-game matrix, but its executable
closure did not verify. The original run and the one allowed recomputation
both assigned the same qualitative prediction outcomes, yet wall-clock timeout
jitter changed exact completeness from 70 to 68 games and changed the required
decision bytes. Closure is therefore **`UNVERIFIED`** and no primary domain
outcome or descriptor adoption is claimed.

The original-run quantities below are retained as partial diagnostics only.

## C1 — per-game descriptor arithmetic: PASS

The fixed early/late timing, greed averaging, unknown propagation, and real
trace-seam controls passed in `solver/tests/behaviorDescriptors.test.js`.

## C2 — exact denominator and timeout: PASS

The child process returned the hand-enumerated maximum of 24 and converted the
induced timeout into `UNKNOWN`; it did not publish zero or a partial maximum.

## C3 — percentile manipulation and semantic bins: PASS

The four planted score percentiles selected their intended candidates, and all
frozen boundaries reached their named cells.

## C4 — objective equivalence: PASS

Proxy and exact measurement modes produced identical score, win, move count,
and terminal reason on the exposed control game.

## C5 — mutation and identity closure: FAIL

Artifact and exact-standing mutants failed as intended, source and
registration identities closed, and the retained corpus verified. The final
executable closure failed, however: its registered recomputation repeated the
wall-clock-limited matrix rather than reducing the retained corpus. Timeout
jitter changed exact-complete games from 70 to 68, so the recomputation did not
byte-match the retained decision artifact. This makes closure `UNVERIFIED`.

## C6 — suite baseline: PASS

The post-run solver suite reported 417 tests: 412 passed, the same four
documented deliberate failures remained, and one test was skipped. No new
failure appeared.

## P1 — exact denominator completeness: INCONCLUSIVE

The original run completed exact denominators for **70/128 (54.7%)** games.
The minimum percentile/level cell completeness was zero: percentile 1.00 on
Level 10 completed 0/8. The preregistered rule assigned `INCONCLUSIVE`.
Because closure is unverified, this remains a partial diagnostic rather than
an entitled domain outcome. The recomputation completed 68/128 (53.1%).

## P2 — controlled greed response: INCONCLUSIVE

The original run's exact mean greed rose monotonically across all four
policies: **0.376, 0.519, 0.722, 0.958**, a range of **0.582**. That would have
met the registered `SUPPORTED` rule, and the recomputation preserved the same
classification. Closure failure leaves the claim `INCONCLUSIVE` overall.

## P3 — win rate tracks greed: INCONCLUSIVE

Original policy win rates were **0%, 0%, 15.6%, 78.1%** and their correlation
with exact mean greed was **0.912**. That would have met the registered
`SUPPORTED` rule; the recomputation reported 0.912 as well after rounding.
Closure failure prevents promotion beyond a partial diagnostic.

## P4 — greed is not a score proxy: INCONCLUSIVE

The original per-game score/greed correlation was **0.638**, below the frozen
0.70 support boundary and well below the 0.85 falsification boundary. The
recomputation shifted it to 0.652 as its timeout set changed. Both would be
`SUPPORTED`, but the mismatch is why no closed claim is made.

## P5 — seed stability: INCONCLUSIVE

Every policy's exact-complete games landed in its modal or edge-adjacent cell,
for a minimum stability of **100%** in both executions. This would meet the
registered `SUPPORTED` rule, but closure is unverified.

## P6 — expressive range of the pair: INCONCLUSIVE

The original run occupied all three greed bins but only the early and steady
timing bins, across four cells. The frozen rule assigns that middle case
`INCONCLUSIVE`: half-score move did not populate the late-cash-in row, so the
proposed 3×3 pair is not established.

## P7 — primary domain outcome: INCONCLUSIVE

The retained corpus mechanically assigned `INCONCLUSIVE`, and the repeated
matrix reached the same label. The executable closure did not reproduce the
decision bytes, so the experiment is not entitled to publish that as its
primary domain outcome. `closure.json` records `primary_outcome: null`.

## Evidence boundary and next step

The registered run gives useful engineering direction: greed ratio is the
promising coordinate; half-score move needs a stronger timing manipulation or
replacement before it can support the named 3×3 map. A successor experiment
must also recompute decisions from the immutable corpus rather than rerunning
wall-clock timeouts. It needs a new result identity and fresh seeds. This run
does not adopt either descriptor, alter MAP-Elites, or validate build potential.
