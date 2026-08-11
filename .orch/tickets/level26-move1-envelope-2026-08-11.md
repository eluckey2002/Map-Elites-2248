# Level 26 seed-0 move-one envelope — 2026-08-11

## Route

- Executor: `orch-investigate`
- Rung: inline read-only investigation using pre-existing exact enumeration and replay code
- Bound: frozen Level 26 seed 0; initial board, reset/spawn semantics, and the exact one-move action/score envelope only; no solver edits and no 32-move search
- Source policy: `src/game.js`, the headless solver engine, `solver/exact-score.js`, existing tests, and reproducible read-only command output

## Question

What are the frozen seed-0 starting tiles, what is the exact highest score on move one, and what does the update/reset behavior imply for a tractable 32-move model?

## Acceptance criteria and oracles

1. Print the exact starting board and value counts.
   - Oracle: pre-existing seedable engine and frozen input-identity test.
2. Compute the complete legal move-one action count and exact maximum, including the maximizing chain and resulting survivor/spawn behavior.
   - Oracle: pre-existing complete position-aware enumerator plus independent concrete transition replay.
3. Correctly characterize what is conserved, updated, removed, and respawned.
   - Oracle: shipped `src/game.js` transition code and pre-existing engine parity tests.
4. State a bounded next modeling reduction without claiming a 32-move proof.
   - Oracle: the exact move-one observations and rule invariants above.

## Independence

The result relies on pre-existing engine, enumerator, replay, and parity tests. Any proposed 32-move reduction not yet implemented is a hypothesis, not a verified result.

## Result

- Status: complete.
- Result identity: this ticket; no solver or product artifact changed.
- Verification verdict: PASS at `pre-existing` oracle provenance. The complete
  position-aware enumerator, a separate concrete RNG-backed transition replay,
  the frozen input-identity test, and 46 focused engine/exact-search tests all
  passed.

## Findings

### Frozen starting state

- High confidence — Level 26 seed 0 starts with total board value 128:
  `2 x 24`, `4 x 12`, `8 x 4`.
- Rows from top to bottom:

  ```text
  2  2  2  2  2
  4  4  4  2  4
  2  2  8  2  4
  4  8  4  4  2
  2  8  2  2  4
  8  4  2  2  2
  4  4  2  2  2
  2  2  2  2  2
  ```

### Exact move-one envelope

- High confidence — the complete enumerator found 1,868,975 distinct physical
  board actions but only 65 distinct immediate scores and 345 distinct
  `(chain length, chain sum, points)` classes.
- High confidence — the exact move-one maximum is 430. There are three
  maximizing board actions. Each has chain sum 86 and the 5x multiplier; one
  uses 27 tiles and two use 28 tiles.
- High confidence — a fresh concrete replay of a 28-tile maximizer scored 430,
  conserved the initial 128 board value through the merge, removed/refilled 27
  cells, consumed frozen spawns totaling 84, and ended with board total 212.
- The next immediate score tiers are 420 (40 physical actions), 410 (234),
  400 (876), and 390 (2,396).

### Transition semantics

- High confidence — one selected tile survives and becomes the selected
  chain's sum. The other `L - 1` selected tiles are removed, gravity moves the
  surviving and unselected tiles, then exactly `L - 1` holes receive frozen
  2/4/8 spawns in column-major order.
- High confidence — unselected tiles do not reset. The merge itself conserves
  total board value; total value increases only by the known newly spawned
  values. Chain length therefore determines both multiplier and spawn-cursor
  advance.

## Contradiction corrected

- The proposed statement that all tiles except one reset is not the shipped
  behavior. Only the selected chain's removed `L - 1` tiles reset; every
  unselected tile persists, possibly at a gravity-shifted coordinate.

## Modeling implication

- The user's proposed compression is supported: 1,868,975 physical actions
  collapse to 65 immediate score values or 345 length/sum/score classes on
  move one.
- For an approximate 32-move model, a useful state can retain accumulated
  score, remaining moves, frozen spawn cursor, value histogram, and a compact
  connectivity/survivor-position summary. Histogram plus cursor alone gives a
  relaxation; geometry/connectivity is required if the result is to remain
  exact.

## Dead ends

- An initial replay diagnostic summed the chain after the survivor had mutated
  to 86 and therefore printed 164. The corrected diagnostic freezes the
  pre-transition values and reproduces chain sum 86 and score 430.

## Gap left by the bound

- This ticket establishes only move one. It does not show which first move
  maximizes the final 32-move score: the 27- and 28-tile maximizers leave
  different survivor positions, board layouts, board totals, and spawn cursors.
- No approximate state signature has yet been tested for predictive accuracy
  against exact small-horizon positions.
