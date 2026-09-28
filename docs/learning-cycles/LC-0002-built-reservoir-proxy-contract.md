# LC-0002 — built-reservoir proxy qualification contract

**Frozen:** 2026-09-28, before the retained qualification rerun

**Status:** frozen qualification contract; known-case design work only

**Consuming decision:** decide whether this one proxy is adequate to carry
forward into a disjoint candidate-measure validation. It cannot authorize a
challenger, a fresh-seed run, adoption, or a champion change.

## Question

On the already-open Level 54 owner sequence, does one untuned measure of the
immediately harvestable built-tile reservoir distinguish every owner move that
improves champion takeover from every owner move that worsens it?

## Construct and executable proxy

The intended construct is **immediately harvestable built-tile reservoir**:
valuable material created during play that can already form a legal scoring
chain without using dealt or initially possible tiles.

The separately named executable proxy is
`normalizedBuiltReservoirHarvest`:

1. Inspect the state after the candidate move, gravity, and the same
   deterministic refill used by the champion lookahead.
2. Retain only non-blocked tiles whose value is strictly greater than
   `16 * tileScale`. Sixteen is the largest value the initial-board generator
   can deal, so every retained tile must have been built during play.
3. Find the exact highest-scoring legal chain using only retained tiles.
4. Return its points divided by `tileScale`, or zero when no such chain exists.

The exact search is permitted only when at most 12 built tiles remain. More
than 12 is `UNMEASURED`, not zero. All decision-bearing cells must be measured.
The proxy is non-negative and has no fixed upper bound below JavaScript's safe
integer limit.

This proxy cannot measure future tiles that could be built, low-value bridge
tiles, the cost of constructing a compatible off-lattice family, target
distance, when to harvest, or general policy quality. It is not the broader
`build-preserve-harvest` construct and must not be renamed as such.

## Frozen identities

- Source revision before this contract: `6e48c30289701a8f26509d03737a36174fe25441`.
- Recording:
  `play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json`,
  SHA-256 `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.
- Champion: `solver/bot.js`, SHA-256
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.
- Ruleset: `solver/engine.js`, SHA-256
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Prior diagnostic card:
  `docs/learning-cycles/LC-0001-level-54-route-diversity.md`, SHA-256
  `b477d20a0d093688c5522762e14145a354a0e0cd412605132a69a35a39b4b8f1`.

The harness identity is intentionally empty until implementation. It must be
filled in the result record without changing this contract.

## Public seam and terminal semantics

The harness must resolve and replay the real recording through
`solver/engine.js`, verify the recording before measurement, reconstruct each
owner-prefix state, and compare the owner's next move with the unchanged
champion's next move on that exact state. After either action, the unchanged
champion takes over with lookahead stream `987654321 + absoluteMoveIndex` and
the recording's spawn stream. A win stops on the move that reaches the shipped
target; ordinary loss semantics are no move, bomb explosion, or move-budget
exhaustion.

For decision `n`, takeover gain is:

`champion finish after owner prefix n-1 - champion finish after owner prefix n`

Positive is helpful, negative is harmful, and zero is neutral. The measure is
computed on both afterstates before takeover. Crossing score is not used.

## Controlled manipulations

All controls use the same public proxy function as the real panel.

1. **Positive topology control:** an adjacent legal `32, 32, 64` chain at
   `tileScale = 1` must measure exactly `192`; removing the `64` must measure
   zero.
2. **Scale negative control:** multiplying every tile value and `tileScale` by
   32 must leave the normalized result exactly `192`.
3. **Orthogonal isolated-mass control:** adding an isolated built tile that
   cannot join the best chain must leave the result exactly `192`.
4. **Initial-value boundary control:** a legal chain made only of values at or
   below `16 * tileScale` must measure zero.
5. **Real-input integrity control:** the unmodified recording must replay
   cleanly; a copy with one false tile-value claim must be rejected before any
   measure is returned.

Any failed control stops the panel and yields qualification `UNVERIFIED`.

## Frozen decision panel

The panel is design material already inspected during LC-0001 and the
long-horizon review. It is not confirmation evidence.

- Helpful owner moves: `2, 6, 10, 11, 13`.
- Harmful owner moves: `1, 4, 8, 9, 12`.
- Neutral diagnostics, excluded from the verdict: `3, 5, 7, 14, 15`.

Every named move is required exactly once. Missing, duplicated, reordered, or
unmeasured cells make the result `UNVERIFIED`.

## Qualification verdict

- `PASS`: every helpful move has owner proxy strictly greater than the
  champion alternative, and every harmful move has owner proxy less than or
  equal to the champion alternative.
- `FAIL`: the complete measured panel contains any helpful tie/loss or any
  harmful strict owner advantage.
- `UNVERIFIED`: a control, identity, replay, completeness, or bound check
  fails.

This is an intentionally strict discriminator test. There is no partial-pass
threshold and no statistical inference: the unit is the exact known decision.

## Attempt and stop rule

Implement the frozen proxy and harness once, qualify the harness with the
controls, and run this deterministic panel once. Preserve the raw cell output
before assigning the verdict. Do not tune the threshold, add terms, relabel
moves, alter the proxy, or try a successor in this task. `FAIL` stops this
candidate before preregistration or fresh confirmation inputs.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, or RESULT-0057 artifact.
