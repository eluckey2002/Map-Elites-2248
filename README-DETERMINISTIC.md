# Deterministic 2048 + exact solver

**Written:** 2026-08-18. Covers steps 1 and 2 of the build order in
`HANDOFF-NEXT-MAP-ELITES.md` §5. MAP-Elites itself (step 3) is not built.

## The decision this rests on

The previous handoff concluded that 2248's random tile spawns made every
difficulty number an estimate, and recommended changing to a deterministic game
(Rush Hour). The owner rejected the game change. This work keeps 2048 and gets
determinism a different way.

**A seed is part of the level definition.** A level is
`(board, walls, target, budget, seed)`. The same level always deals the same
tiles in the same order, so the game is a deterministic function of the
player's moves, and difficulty is a property that search computes exactly
rather than a mean that simulation estimates.

The cost is real and was accepted: every player gets the identical board and
the identical deal, so a level can be memorised and replay value drops.

What it buys: no sampling, no averaging, no sample-size question, and no
winner's curse. The re-evaluation diagnostic from §2 of the handoff is not
needed here because nothing is estimated — there is no second opinion to
disagree with the first.

## What exists

| file | what it is |
|---|---|
| `engine.js` | vanilla 2048 rules, with walls. Extended with a pure `rngStep` and a pure `step` so search can fork positions. |
| `solver-exact.js` | breadth-first exact search: minimum moves to reach the target, or proof that it cannot be done in budget. |
| `solver-exact.test.js` | 18 checks — hand-computed answers, agreement with an independent exhaustive search, and solution replay through the engine. |
| `prune-check.js` | proves the pruning bound never changes an answer (220/220, active on 65). |
| `expressive-range.js` | step 2: generate levels, measure exactly, look at the cloud. |
| `descriptor-check.js` | controlled test of whether a descriptor carries information. |
| `bench-solver.js` | search cost across level configurations. |

Run: `node engine.test.js && node solver-exact.test.js && node prune-check.js`

## The invariant the solver depends on

A successful move consumes exactly two random numbers (one picks the empty
cell, one picks 2-vs-4); a failed move consumes none. So after *k* moves the
RNG tape position is a function of *k* alone, never of which moves were made.
The spawn *positions* still depend on the board — only the tape position is
path-independent. This keeps the search state small.

The single exception: a board with no empty cell skips its spawn and draws
nothing, desynchronising the tape. `rngState` is therefore kept in the search
key even though it is nearly always implied by depth.

## The pruning bound

A merge preserves total board value (2 + 2 = 4), so board value only grows by
spawning, at most 4 per move. If current value plus 4 × remaining moves is
still below the target, no line of play can reach it. Branches failing that
test are discarded.

This is admissible — it discards only provably hopeless positions — and
`prune-check.js` verifies it changes no answer. It is what makes proving a
level *impossible* cheap; without it that proof means exhausting the tree.

## Cost

Solvable levels are fast because search stops at the first solution. Proving a
level impossible is the expensive case.

| level | result | cost |
|---|---|---|
| 4×4, target 16, budget 10 | solved in 8 | 14 ms |
| 4×4, target 32, budget 16 | impossible | 1.0 s |
| 4×4, target 64, budget 20 | impossible | 146 ms (bound bites) |

Distinct reachable positions on a 4×4: 3.3k at 8 moves, 32k at 12, 194k at 16.

Average across a random population: **316 ms per level**, dominated by the
impossible ones. At roughly 3 levels/second, 10,000 MAP-Elites evaluations is
about an hour. Affordable, not free. `status: 'unknown'` (node cap hit) is
always safe to discard, so cost can be capped without ever recording a wrong
number.

## Findings from the expressive range run (300 levels)

- **There is real range to search.** Difficulty spans 4 to 17 moves across 14
  distinct values. Bimodal, tracking the target tile.
- **132 solvable, 165 impossible, 3 over the node cap.** The generator wastes
  over half its effort on impossible levels.
- **Target 64 is never solvable** on a 4×4 within 20 moves. That value should be
  dropped from the space or paired with a much larger budget.
- **`target` correlates with difficulty at r = 0.94.** It is a fitness proxy, not
  an axis — using it would collapse the archive into a ranked list (trap 2).
- **`occupancy` is the best axis candidate so far:** r = −0.17 with 12 distinct
  values. Low correlation *and* real variation.

## The wall finding — and why the correlation lied

`wallCount` came back at r = −0.01, which is the signature of trap 3: a
descriptor that measures nothing. The previous project hit exactly this, and
separately concluded "blockers barely matter in 2248."

The controlled test (`descriptor-check.js`) says otherwise. Holding board,
target, budget and seed fixed and adding walls one at a time:

```
seed 11     walls 0..4 -> 7  7  7  7  11
seed 202    walls 0..4 -> 7  7  7  7  10
seed 3003   walls 0..4 -> 6  6  6  6   9
seed 40004  walls 0..4 -> 7  7  7  7   7
seed 57     walls 0..4 -> 7  7  7  7  10
```

**Walls have a threshold.** The first three do nothing whatsoever; the fourth
changes difficulty on 4 of 5 boards. The generator sampled 0–3 walls — entirely
inside the dead zone — so the population correlation averaged real effects that
were never sampled.

Two consequences:

1. The generator's wall range must move to 4+ before `wallCount` is usable as
   an archive axis.
2. **A near-zero correlation is not evidence that a descriptor is empty.** It
   can equally mean the generator never sampled the range where the descriptor
   bites. The handoff says to test both directions; this is what that catches.
   Worth noting that 2248's "blockers barely matter" conclusion was reached
   from population correlation alone and may have the same defect.

## Not done

- MAP-Elites itself: archive, mutation operator, elite rule (step 3).
- Human play as evaluator calibration (step 4).
- The generator space is not fixed yet — the target-64 waste and the wall dead
  zone above are both known and unaddressed.
