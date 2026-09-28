# LC-0004 — move-6 versus move-8 causal contrast contract

**Frozen:** 2026-09-28, before implementation or any intervention outcome

**Status:** frozen exact-case diagnostic contract

**Consuming decision:** determine what the two exact replays justify investigating
next. This contract cannot define a candidate metric, make a population claim,
authorize fresh seeds, create a challenger, or change the champion.

## Experiment-type declaration

- **Primary design:** custom `paired-fixed-state-topology-intervention`.
- **Context profile:** `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- **Control contract:** SHA-256
  `10de8551b57dfb9ec888f8d2853c17e9c1efbc5ea678cda2b0b5cd72b5fdb031`.
- **Assurance profiles:** none. The harness must carry its own real-input,
  A/A, planted-swap, identity, and persistence controls before the retained
  exact cases run.

This is an exploratory exact-case probe, not a reportable confirmation
experiment. Its outcomes may be recorded only as direct observations about
the named states. Any general mechanism claim requires a separate registered
protocol on unopened cases.

## Question

On the exact three-step owner-arm afterstates for Level 54 moves 6 and 8, does
changing only the spatial arrangement of the existing tiles change how quickly
the unchanged champion converts the board to the target?

The comparison is deliberately paired within each state. It does not ask
whether one scalar distinguishes moves 6 and 8.

## Why these two states

The LC-0003 panel labels owner move 6 helpful and owner move 8 harmful by full
champion-takeover target cost. At their three-step cutoffs:

- move 6 owner is 9,024 score points behind its champion alternative and has
  8,192 more raw built-reservoir points, yet reaches the target in 15 moves
  versus 19;
- move 8 owner is 8,768 score points behind its champion alternative and has
  10,240 more raw built-reservoir points, yet reaches the target in 17 moves
  versus 15.

No fixed `score + w * reservoir` ordering can fit both: move 6 requires
`w > 9024 / 8192 = 1.1015625`, while move 8 requires
`w < 8768 / 10240 = 0.85625`.

Both owner arms require six further champion moves from their three-step
cutoffs. Their labels differ because the move-6 champion alternative needs ten
further moves from its cutoff while the move-8 alternative needs four. The
resource must therefore be interpreted relative to the forgone alternative,
not in isolation.

## Frozen states and objective

For each decision, replay the owner prefix, execute the owner candidate, and
let the unchanged production champion play exactly three continuation moves
with the recording's spawn stream and lookahead stream
`987654321 + absoluteMoveIndex`. The resulting state is the intervention seam.

The objective is the shipped target-stop objective. From the intervention
seam, continue the unchanged champion until target, bomb, no legal move, or
move-budget exhaustion. Record total target cost and remaining continuation
moves. All arms share the same score, move count, target, tile multiset, future
spawn stream, and lookahead schedule within their pair. A loss has target cost
`maxMoves + 1`.

## Frozen interventions

Coordinates are zero-based `(x,y)` in the normalized grids printed by the
harness. A swap exchanges whole non-blocked tiles, updates their coordinates,
and preserves score, move count, target, RNG position, blocker state, and exact
tile multiset. Any endpoint with an unexpected value makes the run
`UNVERIFIED`; endpoints cannot be changed after outcomes.

### M6-CONNECT

On the move-6 owner cutoff, swap `(3,6)=32` with `(2,6)=8`. This moves one
built tile into the gap between the left reservoir and the right-bottom built
tile, joining the built-tile occupancy into one component.

### M6-DISCONNECT

On the move-6 owner cutoff, swap `(1,4)=32` with `(3,0)=4`. This removes the
upper built anchor from the main lower-left reservoir and places it away from
all other built tiles.

### M8-CONNECT

On the move-8 owner cutoff, swap `(0,2)=32` with `(0,4)=2`. This fills the
single-cell vertical gap between the upper-left built pair and the lower
reservoir while leaving the lower left-to-right bridge in place.

### M8-DISCONNECT

On the move-8 owner cutoff, swap `(2,5)=32` with `(3,0)=4`. This removes the
built bridge connecting the lower-left and lower-right reservoir groups and
places it away from the remaining built tiles.

These four interventions test spatial arrangement only. Their names describe
the intended occupancy effect, not an expected game outcome.

## Frozen observations

For each baseline and intervention, retain:

- state identity before and after the swap;
- score, move count, target gap, and full normalized grid;
- sorted tile multiset and whether it is exactly preserved;
- built-tile component sizes under king-move adjacency;
- exact best built-only reservoir harvest already defined by LC-0002;
- the next champion-selected chain and its immediate points;
- complete champion continuation trace and terminal target cost.

Component sizes and reservoir harvest are diagnostics only. No threshold,
weight, or composite value may be derived in this task.

## Controls

### C1 — deterministic replay and identity control

- **Role:** assignment integrity required by `simulation-policy`.
- **Subject and seam:** the frozen recording, LC-0003 manifest and raw panel,
  resolved through their production paths.
- **Expected observation:** the recording replays cleanly; every frozen hash
  matches; moves 6 and 8 reconstruct the recorded score, grid, reservoir, and
  target costs.
- **Failure meaning:** stop before retained interventions; status
  `UNVERIFIED`.
- **Evidence:** control record in the raw artifact.

### C2 — reference A/A control

- **Role:** reference policy control required by `simulation-policy`.
- **Subject and seam:** reconstruct and finish each unmodified cutoff twice
  through the unchanged champion seam.
- **Expected observation:** byte-identical grid, choice trace, terminal state,
  and target cost for both reconstructions.
- **Failure meaning:** stop before retained interventions; status
  `UNVERIFIED`.
- **Evidence:** control record in the raw artifact.

### C3 — planted swap-endpoint control

- **Role:** positive instrumentation control.
- **Subject and seam:** call the real intervention function on a disposable
  move-6 reconstruction with an intentionally false expected endpoint value.
- **Expected observation:** the function refuses the swap before continuation.
- **Failure meaning:** stop before retained interventions; status
  `UNVERIFIED`.
- **Evidence:** control record in the raw artifact and focused test.

### C4 — objective-equivalence control

- **Role:** objective-equivalence control required by `simulation-policy`.
- **Subject and seam:** every baseline and intervention arm.
- **Expected observation:** identical target, max moves, terminal ordering,
  policy chooser, spawn position, and lookahead schedule within a pair; only
  the declared tile coordinates differ.
- **Failure meaning:** the affected pair is invalid and the complete probe is
  `UNVERIFIED`.
- **Evidence:** invariant block in every raw arm.

### C5 — tile-multiset negative control

- **Role:** negative control.
- **Subject and seam:** every declared intervention.
- **Expected observation:** sorted value/blocker multiset is exactly equal
  before and after, while the post-swap state identity differs.
- **Failure meaning:** the affected intervention is invalid and the complete
  probe is `UNVERIFIED`.
- **Evidence:** invariant block in every raw arm.

### C6 — persistence-before-interpretation control

- **Role:** evidence-retention control.
- **Subject and seam:** the raw-artifact writer.
- **Expected observation:** a planted interpretation exception occurs only
  after the complete disposable raw artifact is written.
- **Failure meaning:** stop before retained interventions; status
  `UNVERIFIED`.
- **Evidence:** control record and focused test.

## Harness qualification outcome

Harness qualification is separate from the exact board observations:

- `PASS`: the focused pure-function tests pass; the public collector validates
  the real manifest and every externally frozen file; C1, C2, C3, and C6 pass;
  and a coherent bundle with one changed frozen identity is rejected before an
  arm is collected.
- `FAIL`: the known-good real manifest is rejected, the planted endpoint defect
  is accepted, the coherent frozen-identity substitution is accepted, or the
  persistence control loses its disposable raw artifact.
- `UNVERIFIED`: a required input, external identity, command, artifact, or
  control result is absent or cannot be inspected.

The harness may receive at most two qualification attempts before the retained
probe. Preserve each attempt's harness identity, commands, outputs, and exit
state. A `PASS` qualifies only this exact collector, frozen contract, six arms,
and exact-case observation vocabulary; it cannot qualify a policy or a general
causal claim.

## Interpretation boundary

The exact observations may support only statements of these forms:

1. a named coordinate swap changed or did not change the exact continuation;
2. connecting or disconnecting built occupancy changed the diagnostics in the
   named state;
3. the two exact cases do or do not justify a later hypothesis about topology,
   conversion timing, or opportunity cost.

They cannot establish a generally causal board feature, predict unseen games,
rank policies, or become a champion scoring term. A directional asymmetry may
motivate a new hypothesis; it is not validation of that hypothesis.

## Frozen identities

- Source revision before this contract:
  `06a977c0b7b667bc347a0b7e3a3b8f477448fc1c`.
- Recording: `play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json`,
  SHA-256 `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.
- Champion: `solver/bot.js`, SHA-256
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.
- Ruleset: `solver/engine.js`, SHA-256
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Shipped environment: `src/game.js`, SHA-256
  `3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1`.
- Reservoir probe: `solver/built-reservoir-probe.js`, SHA-256
  `a3a11f9ba8db149430b05f6864b2cd70977e207fdc8872f2cf9d221f2b4b7e00`.
- Sequence probe: `solver/sequence-value-probe.js`, SHA-256
  `3521efc47424a7a445256f21470d9b19eb5d90676406c89d494b5292d446182e`.
- LC-0003 harness: `tools/qualify-three-step-target-progress.js`, SHA-256
  `d07ed37b0c90ffbbbafdee654173cc033e968a8a5d5e959ad574636f9144dfd0`.
- LC-0003 manifest: SHA-256
  `5877e06cc51a0bac598a30d55ba63b631aaabb91ea843720d335f4127ad08d48`.
- LC-0003 raw panel: SHA-256
  `e6f523dd72f60309351d4a2d8bd5a8d8851c43eadb44b4e3b86fa4f17394b2e2`.
- Four-miss raw diagnostic: SHA-256
  `58a6458367295823d56b29f5e4589077161648b0e3619c6e5d6d6cca8eb3c284`.

The new harness identity is empty until implementation. A mechanically
generated manifest must bind it and this contract before the retained probe.

## Bounds and stop rule

Run C1, C2, C3, and C6 before any retained intervention. Then reconstruct two
baselines and execute exactly the four frozen swaps once each. C4 and C5 are
per-intervention invariants: check them immediately after the swap and before
accessing that arm's continuation outcome. Persist all six arms before
interpretation. There are no retries, alternate coordinates, extra swaps,
tuned horizons, or fresh inputs.

A setup failure before any retained intervention may be repaired only if its
cause and prevention are recorded. Any failure after a retained intervention
has begun stops the probe and keeps the partial artifact. A valid negative or
mixed outcome is not a failed run.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, RESULT-0057 artifact, or prior
LC-0001/0002/0003 artifact.
