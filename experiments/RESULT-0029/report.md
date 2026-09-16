# Report — RESULT-0029

RESULT-0029 asked whether exact `budget tightness × chain-length dependence`
coordinates separate generated puzzle instances into four mechanically distinct
regions. The result is **INCONCLUSIVE**, and the frozen disposition is to
**reject both descriptors for the scoped exact micro-puzzle map**. This is a
failure to clear the promotion bar, not evidence that either mathematical
quantity is meaningless.

The protocol, instrument, generator, controls, seed blocks, verifier, and
decision rule were committed at `b85486ea44636aac14d314004d9ae9546f7239be`
before any reportable seed was opened. The one reportable run produced
`experiments/RESULT-0029/corpus.json`, artifact identity
`7a908767a40d4cb1acc28b417430e7ec4fbf44b8319127e2c221c80ef245d7af`.

## Outcome

| Region | Seeds screened | Exact selected | Coordinate pattern |
| --- | ---: | ---: | --- |
| relaxed-short | 4 | 4 | tightness `0.5`, cap `3` |
| relaxed-long | 48 | 1 | tightness `0.5`, cap `4` |
| tight-short | 48 | 1 | tightness `1`, cap `3` |
| tight-long | 4 | 4 | tightness `1`, caps `5–9` |

The run screened 104 distinct starting boards, selected 10, and encountered
zero node-cap `UNKNOWN` cases. Every selected instance has strict exact
counterfactuals below its target for fewer moves and for the next-shorter chain
cap. But the corpus missed the preregistered four-per-region requirement in two
regions and contained only 10 distinct selected starting boards, below the
required 12. P1 is therefore `INCONCLUSIVE` under the frozen rule.

The sparse relaxed-long corner also exposed a design collapse. Its only
selected puzzle excludes cap-4 success in **one** move, but the descriptor asks
whether cap-4 success is possible anywhere within the full **two**-move
budget. It is, so that instance lands at cap 4 rather than demonstrating the
stronger cap-5-or-more contrast the target recipe was meant to isolate. The
protocol and artifact are retained unchanged; repairing that construction
would require a new preregistered result.

## C1 — exact-repeat negative control — **PASS**

The qualification fixture reproduced its exact envelope, minimum move count,
budget tightness, chain cap, and witnesses. The complete focused suite passed
10 of 10 before the corpus was opened.

## C2 — planted bad-descriptor and missing-witness controls — **PASS**

The real instance verifier accepted the qualification subject, rejected a twin
whose minimum-move/tightness values were changed, and rejected a twin whose
minimum-cap witness was removed. Both bad inputs passed through the same
recomputation predicate used on reportable instances.

## C3 — registration, identity, and source closure — **PASS**

Before registration, the runner refused to execute. After registration, the
artifact bound protocol commit `b85486e`, recorded the complete frozen source
closure, and hashed to its evidence body independently of the registration
stamp. `node tools/verify-experiments.js` passed before the run.

## C4 — bounded-search standing remains honest — **PASS**

The permanent one-node-cap fixture returned `UNKNOWN`, not unreachable or an
exact miss. The reportable run recorded zero cap hits among its 104 screened
boards; no bounded search was admitted as exact evidence.

## P1 — four-region structural separation — **INCONCLUSIVE**

Observed occupancy was `4 / 1 / 1 / 4`, not the required `4 / 4 / 4 / 4`, and
the corpus had 10 rather than at least 12 distinct selected starting boards.
Strict counterfactuals passed for every selected puzzle, but all three frozen
conditions were required. No seed block was extended and no threshold or
region definition changed after the outcome.

## P2 — puzzle-instance identity and paired evidence — **PASS**

Every selected puzzle has one SHA-256 identity binding its rules, seed, initial
board, spawn stream, target, and move budget. Both descriptor coordinates,
both counterfactual maxima, and both witnesses were computed on that same
identity. No comparison substitutes a different seed, board, target, or move
budget.

## P3 — witness replay and full recomputation — **PASS**

Both witnesses for all 10 selected puzzles replayed through the frozen real
transition seam and reached their recorded targets. The verifier regenerated
all four screens, the first-qualifier selections, descriptor coordinates,
representative identities, and disposition, then agreed with the canonical
artifact body. Verification returned `PASS` for artifact `7a908767…`.

## P4 — scoped descriptor disposition and inspectable extremes — **INCONCLUSIVE**

The frozen decision rejects both axes for the scoped exact micro-puzzle map:

- `budgetTightness`: `REJECT_FOR_EXACT_MICRO_PUZZLE_INSTANCE_MAPS`
- `chainLengthDependence`: `REJECT_FOR_EXACT_MICRO_PUZZLE_INSTANCE_MAPS`

This means **do not promote the pair from candidate measurements to accepted
puzzle-space axes on this result**. It does not retract their definitions or
claim they cannot work under a repaired construction or a larger exact scope.

### Relaxed-short representative

- Puzzle identity: `a76568cfbbcd9b26bd941431c67f3a6e0725a815c43bb02a3d1e8013eb30267d`
- Seed `29000000`; target `36`; minimum `1/2` moves; tightness `0.5`;
  required cap `3`.
- Exact counterfactuals: fewer moves `0 < 36`; cap below 3 `0 < 36`.

```text
 8   2  16
 8   4  16
 8   4   4
```

Minimum-move witness:
`[(1,1),(2,2),(1,2),(0,2),(0,1),(0,0)]` → score `72` in one move.
Minimum-cap witness:
`[(1,1),(1,2),(0,2)]`, then `[(0,0),(0,1),(0,2)]` → score `72` in two moves.

### Relaxed-long representative

- Puzzle identity: `5dba1ee02bbbc8147fe8075a8b799031c0ab6f843007d8ff6386e3d64e70e904`
- Seed `29000118`; target `49`; minimum `1/2` moves; tightness `0.5`;
  required cap `4`.
- Exact counterfactuals: fewer moves `0 < 49`; cap 3 maximum `48 < 49`.

```text
 8   4   2
 8   8   2
 2   2   8
```

Minimum-move witness:
`[(0,2),(1,2),(2,1),(2,0),(1,0),(0,0),(0,1),(1,1),(2,2)]` → score `220`.
Minimum-cap witness:
`[(2,0),(2,1),(1,0),(0,0)]`, then
`[(2,0),(1,1),(0,1),(0,0)]` → score `84`.

This cap-4 coordinate is the construction collapse described above; it must not
be paraphrased as proof of a cap-5-or-more relaxed puzzle.

### Tight-short representative

- Puzzle identity: `77afdc629ef388491b7ce29f1e7e7eeb60314f3f5d35efc0a7e5f6de4fc44671`
- Seed `29000241`; target `49`; minimum `2/2` moves; tightness `1`;
  required cap `3`.
- Exact counterfactuals: one-move maximum `48 < 49`; cap below 3 `0 < 49`.

```text
 2  16   2
 2   8   8
 2   2   2
```

Minimum-move witness:
`[(0,0),(0,1),(1,2),(0,2)]`, then
`[(2,0),(1,0),(0,0),(0,1),(0,2),(1,2),(2,1),(1,1)]` → score `180`.
Minimum-cap witness:
`[(1,1),(2,1),(1,0)]`, then `[(0,0),(0,1),(1,0)]` → score `60`.

### Tight-long representative

- Puzzle identity: `188762499e53900d2a16b0c57378ed44ad3dc2120346d40ba0e20a4fc85e40d6`
- Seed `29000300`; target `131`; minimum `2/2` moves; tightness `1`;
  required cap `7`.
- Exact counterfactuals: one-move maximum `130 < 131`; cap-6 maximum
  `72 < 131`.

```text
 4   2   2
 8   2   2
 2   2   2
```

Minimum-move witness:
`[(1,0),(2,0),(2,1),(2,2),(1,2),(0,2),(1,1),(0,0),(0,1)]`, then
`[(0,0),(0,1),(1,0),(2,0),(2,1),(1,1),(1,2),(2,2)]` → score `196`.
Minimum-cap witness:
`[(1,0),(2,0),(2,1),(1,2),(0,2),(1,1),(0,0)]`, then
`[(0,0),(1,0),(1,1),(2,1),(1,2),(0,2),(0,1)]` → score `156`.

## Scope boundary

The result establishes exact reachability statements only for the identified
blocker-free 3x3, `minChain: 3`, scale-1, two-move puzzles. It makes no claim
about human difficulty, fun, preference, shipped-level quality, solver fitness,
policy behavior, larger-board reachability, or natural region frequency. It
does not replace the existing policy-behavior MAP-Elites axes, change game
rules, alter targets or move budgets, ship a level, or expand the descriptor
catalogue. Recovery and wasted-move tolerance remain one untested candidate
concept; RESULT-0029 neither separates nor adopts them.
