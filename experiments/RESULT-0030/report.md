# RESULT-0030 — Representative-board witness-bounded descriptors

**Outcome:** `INCONCLUSIVE` for promotion to a MAP corpus.

The bounded proxy reached every target on the confirmation panel, but only
five of eight puzzle identities retained the same coarse descriptor bin when
beam width increased from 12 to 48. That 62.5% agreement missed the frozen
75% stability threshold. The result therefore routes the proxy to revision,
not into MAP-Elites.

## Scope and standing

The confirmation contains two fresh seeds on each of four shipped level
configurations: Level 10 (5x8), Level 31 (5x7), Level 53 (6x5), and Level 54
(4x8 with two stones). Successful measurements are replayed upper bounds:

- `minimumMovesUpperBound` is the fewest moves among found witnesses.
- `budgetTightnessUpperBound` divides that value by the allowed moves.
- `chainLengthDependenceUpperBound` is the smallest tested cap with a found
  witness.

These are not exact minimum moves or exact chain dependence. A bounded miss
would remain `UNKNOWN`; none occurred in the deep arm.

## C1 — deterministic repeat and scale control: PASS

The focused qualification repeated the same analysis byte-for-byte and
confirmed that scale-32 frozen spawns remain in the 64/128/256 lattice.

## C2 — planted identity and witness defects: PASS

The real verifier seams rejected a changed artifact body, mismatched paired
puzzle identities, and an unavailable-tile witness. The permanent tests ran
before confirmation and passed 9/9 across all focused controls.

## C3 — suite unchanged: PASS

The post-run suite reported 394 tests: 389 pass, the same four deliberate
failures, and one skip. There was no new failure.

## C4 — standing and source closure: PASS

The reportable runner accepted the committed registration and refused
overwrite by construction. Independent verification replayed every successful
witness, checked cap and puzzle identity, checked source closure and artifact
identity, then regenerated the full corpus byte-for-byte. Artifact identity:
`4f961ed015a191f0d98ce37377cccbdca48881f0bb3ff1b1dd2283b89767bbf8`.

## P1 — representative-panel coverage: SUPPORTED

The deep arm found a replayable target witness on all 8/8 puzzle identities
and covered all four board profiles. The frozen bar was at least 7/8 and all
four profiles.

## P2 — paired search-width stability: INCONCLUSIVE

All eight identities had witnesses in both arms, and the deeper search
worsened neither upper bound on any pair. Five of eight retained the same
coarse bin, an agreement rate of 62.5%, below the required 75%.

The three changes were informative rather than random failures:

- Level 10, seed 32,100,001 moved from `tight-short` to `relaxed-short` when
  the move upper bound improved from 12/22 to 11/22.
- Level 53, seed 32,100,000 moved from `tight-long` to `tight-short` when the
  cap upper bound improved from 30 to 12.
- Level 54, seed 32,100,000 moved from `tight-long` to `tight-short` when the
  cap upper bound improved from 32 to 12.

The instability is concentrated at threshold crossings. It shows that these
coarse cells still depend materially on bounded-search strength.

## P3 — compute accounting: PASS

The shallow arm expanded 11,424 states and the deep arm expanded 43,445, a
3.803x ratio. This is diagnostic only; the comparison is not compute matched.

## P4 — scoped disposition: INCONCLUSIVE

The frozen disposition is `REVISE_BEFORE_MAP_CORPUS`. Coverage passed, but
stability did not. The upper-bound proxies are usable as measurements of the
specific witnesses found; they are not yet stable enough to define archive
cells on representative boards.

The next repair should avoid thresholding raw search upper bounds as if they
were settled coordinates. A stronger candidate is to store intervals or
search-depth-qualified coordinates, then test whether cell membership is
monotone as the witness improves. That requires a new protocol and fresh
seeds. No additional seed, width, or cap was opened here.

## Confirmation rows

| Level | Shape | Seed | Shallow bin | Deep bin | Deep move UB | Deep tightness UB | Deep cap UB |
|---:|:---:|---:|:---|:---|---:|---:|---:|
| 10 | 5x8 | 32,100,000 | tight-short | tight-short | 13 | 0.591 | 12 |
| 10 | 5x8 | 32,100,001 | tight-short | relaxed-short | 11 | 0.500 | 12 |
| 31 | 5x7 | 32,100,000 | relaxed-short | relaxed-short | 15 | 0.500 | 12 |
| 31 | 5x7 | 32,100,001 | relaxed-short | relaxed-short | 13 | 0.433 | 12 |
| 53 | 6x5 | 32,100,000 | tight-long | tight-short | 11 | 0.688 | 12 |
| 53 | 6x5 | 32,100,001 | tight-short | tight-short | 11 | 0.688 | 12 |
| 54 | 4x8 | 32,100,000 | tight-long | tight-short | 17 | 0.708 | 12 |
| 54 | 4x8 | 32,100,001 | tight-short | tight-short | 17 | 0.708 | 12 |

## Exclusions preserved

This result does not establish exact reachability, exact minimum moves,
solver-independent chain dependence, human difficulty, fun, preference,
policy quality, natural puzzle frequency, or a reason to change any shipped
level or rule. It does not overturn `RESULT-0029` or `DECISION-0006`.
