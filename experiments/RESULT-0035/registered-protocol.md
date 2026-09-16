# Frozen protocol — merge-depth × spatial-spread MAP corpus

**Registered:** 2026-09-16, before any confirmation seed was opened.

This immutable copy is the protocol object named by the executable closeout
contract. The repository lifecycle copy is `protocol.md`; only its frontmatter
status may change after the run.

## Question

Can 128 fresh representative puzzle identities populate a reproducible 2×2
quality-diversity corpus using the validated successful-witness coordinates
from RESULT-0033?

## Prior evidence and fixed axes

RESULT-0033 is the design evidence and is excluded from confirmation. Its 32
deep witnesses had peak merge depth 1 on 20 puzzles and depth 2 on 12, while
mean normalized chain span had median 0.8218253968253968. Before opening fresh
seeds, the map rounds that median to a fixed spread cut of 0.82 and fixes these
cells:

- `depth-1/compact`: peak depth 1 and spread below 0.82.
- `depth-1/broad`: peak depth 1 and spread at least 0.82.
- `depth-2-plus/compact`: peak depth at least 2 and spread below 0.82.
- `depth-2-plus/broad`: peak depth at least 2 and spread at least 0.82.

Each cell retains at most four representatives. A puzzle is eligible only when
widths 12 and 48 both find a target witness, both witnesses land in the same
fixed cell, and their spread differs by at most 0.10. Retention prefers smaller
spread difference, then greater distance from the 0.82 boundary, then puzzle
identity. This is measurement reproducibility, not gameplay quality.

The axes remain properties of successful bounded-search witnesses. They are
not minimum puzzle requirements, exhaustive solution properties, difficulty,
fun, or preference.

## Shape, denominator, and seeds

One deterministic confirmation uses shipped Levels 10, 31, 53, and 54,
covering 5x8, 5x7, 6x5, and 4x8-with-stones profiles. Seeds
33,000,000–33,000,031 are applied to each profile: 128 fresh puzzle identities
and 256 paired search observations. Widths are 12 and 48, with 16 combined
candidates per expanded state and path width 2. Shipped targets and move
budgets are unchanged.

This constructs and qualifies a fixed archive from sampled puzzles. It is not
an evolutionary MAP-Elites search, a player study, or a content shipment.

## Starting state

- Parent HEAD `207886bbc51f3669ed8f3455112c39653214ec83`, isolated branch
  `feat/merge-spread-map-corpus`.
- Focused pre-run controls: 12 pass, 0 fail.
- Solver baseline: 401 tests, 396 pass, the same four deliberate failures, and
  one skip.

## Controls and predictions

### C1 — axis boundary control (PASS / FAIL)

Four planted descriptor pairs must land in the four named cells, including the
0.82 boundary on the broad side.

### C2 — archive positive and negative controls (PASS / FAIL)

A planted balanced 128-row panel must fill all four cells and receive the ready
disposition. A planted two-cell collapse must be `FALSIFIED`. Cross-width cell
flips, spread drift above 0.10, and bounded misses must be refused admission.

### C3 — inherited descriptor controls (PASS / FAIL)

The RESULT-0033 lineage-depth, spatial-span, uniform-scale negative control,
bounded-miss, and planted-illegal-witness checks must all pass unchanged.

### C4 — replay, identity, registration, and closure (PASS / FAIL)

Unregistered execution and overwrite must be refused. Every retained row must
bind one puzzle identity across widths and every witness must replay legally.
Planted artifact and row mutations must fail. Source hashes, registration
ancestry, artifact identity, deterministic decision recomputation, and the
executable closeout contract must verify.

### C5 — suite unchanged (PASS / FAIL)

The post-run solver suite must retain exactly the four named deliberate
failures and one skip. Any new failure is `FAIL`.

### P1 — representative-panel coverage

- `SUPPORTED`: at least 120/128 deep witnesses and all four profiles covered.
- `FALSIFIED`: fewer than 96 deep witnesses or any profile absent.
- `INCONCLUSIVE`: anything else.

### P2 — four-cell corpus occupancy

- `SUPPORTED`: all four cells retain four stable representatives.
- `FALSIFIED`: at most two cells are occupied.
- `INCONCLUSIVE`: anything else.

### P3 — cross-width cell stability

- `SUPPORTED`: at least 112 paired witnesses and at least 75% exact cell
  agreement with spread difference at most 0.10.
- `FALSIFIED`: fewer than 96 paired witnesses or stability below 50%.
- `INCONCLUSIVE`: anything else.

### P4 — disposition

`CANONICAL_MAP_CORPUS_READY` requires P1–P3 all `SUPPORTED` and C1–C5 passing.
Any falsified prediction gives `MAP_CORPUS_NOT_SUPPORTED`; all remaining valid
outcomes give `MAP_CORPUS_INCONCLUSIVE`.

## Budget and stopping rules

1. Commit this protocol, code, tests, seed reservation, and closeout contract
   before opening any confirmation seed.
2. Run C1–C3 first and stop on failure.
3. Run the 128-puzzle confirmation exactly once and refuse overwrite.
4. Replay every witness, recompute the decision independently, and close the
   executable contract.
5. Preserve bounded misses as `UNKNOWN`. Do not add seeds, levels, widths,
   cells, or thresholds after seeing outcomes.
6. One confirmation run; deterministic verification is allowed, new evidence
   runs are not.

## Unit of generalization and adoption boundary

The unit is a distinct level/seed puzzle identity. Repeated search widths on
one identity are paired measurements, not independent units. The aggregation
is the fixed four-profile panel and the fixed cell-level retention rule.

A ready disposition admits this exact corpus as a deterministic research
surface. It does not ship puzzles, validate player-facing labels, or establish
that any cell is more difficult or enjoyable than another.
