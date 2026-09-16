# RESULT-0032 — Choice-density × recovery candidate descriptors

**Outcome:** `INCONCLUSIVE`; revise recovery before building a MAP corpus.

The 32-board confirmation supports the exact opening choice-density proxy and
its stability. The bounded recovery-witness proxy moved in the intended
direction on 7/8 eligible non-ceiling pairs with no decreases, but only eight
pairs were eligible against the frozen minimum of twelve. The panel therefore
did not provide enough unsaturated recovery observations for promotion.

## C1 — choice-density positive control: PASS

The all-2 six-cell row produced viable-start fraction 1. The isolated-pairs
fixture produced 0. The focused control ran before confirmation.

## C2 — recovery positive control: PASS

On excluded seed 32,300,000, the Level 53 calibration fixture produced a
bounded recovery-witness rate of 0.75 at 14 moves and 1 at 16 moves. Its exact
opening choice fraction was unchanged.

## C3 — negative and orthogonal controls: PASS

Uniform tile-and-target scaling preserved both proxies in the permanent test.
All 32 confirmation rows retained exactly the same opening choice fraction
across tight/slack budgets and shallow/deep search.

## C4 — replay, identity, registration, and source closure: PASS

The registered artifact passed legal replay and complete deterministic
recomputation. Planted illegal-witness and artifact-body mutations failed the
real verification paths. The corpus binds registration commit `2c1f0f5` and
artifact identity
`2f2f31bbc6b772b0a1710cfac4d69f821ac6d06d8f869ec32117fbf45a5a61dc`.

## C5 — suite unchanged: PASS

The post-run solver suite reported 395 tests: 390 pass, the same four
deliberate failures, and one skip. No new failure appeared.

## P1 — choice proxy range and invariance: SUPPORTED

The exact opening fractions ranged from 0.5667 to 0.95, a span of 0.3833
against the frozen 0.20 bar. All 32 rows were invariant across budgets and
search widths.

## P2 — held-out recovery sensitivity: INCONCLUSIVE

Only 8/32 deep-arm pairs were measured and below ceiling in the tight arm,
short of the required twelve. Seven of those eight improved by at least 0.125
with four extra moves, an 87.5% rate, and none decreased. The directional
signal is encouraging but cannot repair the preregistered denominator miss.

## P3 — search-width stability: SUPPORTED

Fifty-eight of 64 budget arms were measured at both widths. Forty-seven were
within 0.25, an 81.0% stability rate against the frozen 75% bar. Eleven arms
exceeded 0.25; this remains a bounded-search coordinate, not an exact recovery
quantity.

## P4 — scoped disposition: INCONCLUSIVE

The disposition is `REVISE_BEFORE_MAP_CORPUS`. The exact choice proxy is a
viable candidate. The recovery proxy remains too ceiling-prone on this panel
to promote as the other coordinate. The next repair should change the recovery
manipulation or sampling frame under a new protocol; it must not add seeds to
this opened range or retroactively lower the eligibility minimum.

## Panel summary

| Measure | Result | Frozen bar |
|---|---:|---:|
| Fresh opening boards | 32 | 32 |
| Choice range | 0.3833 | at least 0.20 |
| Choice-invariant rows | 32/32 | 32/32 |
| Eligible non-ceiling recovery pairs | 8 | at least 12 |
| Eligible pairs improving by at least 0.125 | 7/8 (87.5%) | at least 75% |
| Eligible pairs decreasing | 0 | 0 |
| Comparable search-width arms | 58/64 | at least 48 |
| Stable search-width arms | 47/58 (81.0%) | at least 75% |

## Exclusions preserved

Bounded misses remain `UNKNOWN`, not evidence of non-recoverability. This run
does not establish exact recovery, player-perceived choice, difficulty, fun,
preference, natural move frequency, or MAP-Elites fitness, and it changes no
shipped level or gameplay rule.
