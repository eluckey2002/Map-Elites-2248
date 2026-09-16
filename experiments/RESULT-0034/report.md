# RESULT-0034 — Forced-prefix × bounded-diversity candidate descriptors

**Outcome:** `INCONCLUSIVE`; revise before MAP use.

## C1 — linear-versus-branching positive control: PASS

The linear fixture reported forced ratio 1 and opening diversity 1; the
branching fixture reported forced ratio 0 and opening diversity 4.

## C2 — bounded-miss negative control: PASS

The unreachable-within-budget fixture remained `UNKNOWN`.

## C3 — registration, identity, source closure, and recomputation: PASS

Full deterministic recomputation matched artifact identity
`48876a4151535ec0b72b55059dabc91e962c2df424385e9686ac27a0a486999b`
and registration commit `a0608db`.

## C4 — suite unchanged: PASS

The solver suite reported 401 tests: 396 pass, the same four deliberate
failures, and one skip.

## P1 — representative coverage: SUPPORTED

Deep search found bounded success sets on all 32/32 puzzles and four profiles.

## P2 — descriptor range: INCONCLUSIVE

Forced-prefix ratio spanned 0.1974, clearing its 0.15 bar. Opening diversity
collapsed: 30 boards reported one opening and only two reported two openings.
Only one value had the required four rows, against the required two values.

## P3 — search-width stability: SUPPORTED

Twenty-eight pairs were measured. Forced-prefix ratio stayed within 0.15 on
26/28 (92.9%), and exact opening diversity agreed on 26/28 (92.9%).

## P4 — scoped disposition: INCONCLUSIVE

The disposition is `REVISE_BEFORE_MAP_CORPUS`. The forced-prefix proxy showed
range and stability, but the bounded beam's opening-diversity coordinate is
too collapsed to organize a useful map. A repair needs a new sampling method,
protocol, and fresh seeds—not more seeds on this same bounded search.

Bounded success sets are not exhaustive solution sets. This result changes no
level, rule, policy, or archive and establishes nothing about difficulty, fun,
preference, or player strategy.
