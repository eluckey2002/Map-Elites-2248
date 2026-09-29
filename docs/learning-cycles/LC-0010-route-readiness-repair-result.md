# LC-0010 — route-readiness repair result

## Step: Exact Route-Readiness Repair

**Objective:** Determine when each frozen correction route becomes legally
executable, after fixing and regression-testing LC-0009's partial-route value
classification error.

**Finding:** The corrected replay confirms the first-ready timeline:

| Owner move | Owner route first ready | Champion route first ready | Correction move |
| ---: | ---: | ---: | ---: |
| 4 | 4 | 4 | 4 |
| 6 | 5 | 5 | 5 |
| 9 | 4 | 4 | 4 |
| 11 | **3** | 4 | 4 |

Seven of eight routes become executable only when they are cashed out. The
exception is the winning move-11 owner route. Its final missing input, the
`M002` 1,024 merge, is built on continuation 2. Before continuation 3 the full
ten-tile route is legal, but the unchanged champion selects a different
3,072-point chain. That move creates no correction-route node and moves none of
the route's direct inputs, so the ready route remains intact. On continuation
4 the champion selects it and scores 56,320 points.

This is exact evidence that **“the route is ready” and “cash it now” are two
different decisions**. It matches the owner's “there is enough game time, stay
the course” description on this named trajectory. It does not prove that the
one-move delay was optimal, because this run did not execute an earlier-cash
counterfactual.

LC-0009 is retained as an `INVALID` failed run with no outcome. The failed-run
ledger names the defect, and the LC-0010 gate proves the old assessor fails the
missing-earlier-input / later-valid-double case while the repaired assessor
passes it. The corrected closeout outcome is
`REPAIRED_TIMELINE_CONFIRMED`.

**Next Step:** At the exact move-11 owner state before continuation 3, replay
only two frozen alternatives: cash the already-ready 56,320-point route now,
or take the observed 3,072-point chain and cash the preserved route one move
later. Keep the board, RNG state, remaining moves, target-stop objective, and
subsequent champion fixed. This directly tests whether waiting bought anything
in the one state that exhibits it, without inventing a general metric or
changing the champion.

## Boundaries

- Exact result for eight retained arms on one Level 54 seed; no population
  claim.
- No route search, metric, threshold, parameter, level, target, or champion
  change.
- The apparent timing lesson remains a hypothesis until the named
  counterfactual is run.

## Verification

- Focused repair and result tests pass.
- The raw artifact has internal identity
  `452ba78783b6254110b25b23fdfa180e47062b324973010de18b987e45408a95`.
- The executable closeout verifier returns `PASS`, `CLOSED`, and recomputation
  `PASS` under externally frozen closeout-contract SHA-256
  `81d5d1aa3de3414d6c4e5066530b5efa0a2be2e86c24e94a788038931b4b5cde`.
- Protected gameplay hashes remain: `solver/bot.js`
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`,
  `solver/engine.js`
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`,
  and `src/game.js`
  `3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1`.
