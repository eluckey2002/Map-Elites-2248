# LC-0003 — three-step target-progress proxy qualification contract

**Frozen:** 2026-09-28, before implementation and retained qualification

**Status:** frozen known-case qualification contract

**Consuming decision:** decide whether this one bounded sequence proxy is
adequate to justify a later disjoint candidate-measure validation. This
qualification cannot assign `SUPPORTED`, `FALSIFIED`, or `INCONCLUSIVE`, run
fresh evidence, create a challenger, authorize adoption, or change the
champion.

## Question

On the already-open Level 54 owner sequence, does three-step target progress
distinguish every owner choice known to improve champion takeover from every
owner choice known to worsen it?

## Construct and executable proxy

The intended construct is **near-term strategic value under champion
continuation**: whether a candidate action creates progress that the unchanged
champion can convert toward the target within a short fixed horizon.

The separately named executable proxy is `threeStepTargetCost`, computed as
follows:

1. Starting from the exact live decision state, execute the candidate action,
   gravity, refill, blocker tick, bomb check, and target check.
2. If still active, let the unchanged production champion play at most three
   additional moves. Use the recording's continued spawn stream and champion
   lookahead stream `987654321 + absoluteMoveIndex` for each decision.
3. Stop at target reached, bomb explosion, no legal move, exhausted move
   budget, or three continuation moves.
4. Let `d` be champion continuation moves used, excluding the candidate move;
   let `g = max(0, target - finalScore) / target`.
5. Return the lower-is-better cost:
   - target reached: `d`, where `0 <= d <= 3`;
   - still active after the horizon: `4 + g`, where `4 <= cost <= 5`;
   - terminal loss: `6 + g`, where `6 <= cost <= 7`.

The constants create non-overlapping outcome bands; they are not fitted
weights. Any target reached inside the horizon outranks any active non-win,
and any active non-win outranks a terminal loss. Within a band, faster target
arrival or smaller remaining target gap is better.

The horizon is exactly three continuation decisions per arm. It cannot be
tuned, extended, shortened, or replaced after seeing the panel.

## Frozen diagnostics

Diagnostics explain the primary result but cannot change it:

- candidate points and continuation points realized;
- normalized built material before the candidate, after it, and after the
  horizon, where built material is non-blocked value above
  `16 * tileScale`;
- `normalizedBuiltReservoirHarvest` after the candidate and after the horizon,
  including `UNMEASURED` when its 12-built-tile cap binds;
- final target gap, terminal reason, continuation moves, and chooser-call
  count.

These separately expose material built, reservoir preserved, value realized,
and target distance. No diagnostic is a tie-break or alternate verdict.

## Bounds and claims not supported

Each arm may call the champion chooser at most three times after the candidate
action. There is no search retry. An absent champion move is terminal loss,
not evidence that no useful policy exists.

The proxy cannot measure value appearing after three continuation moves,
owner intent, general policy quality, future levels, human skill, terminal
score maximization, or causal contributions of individual diagnostics. It is
not the broader build-preserve-harvest construct and must not be renamed as
that construct.

## Frozen identities

- Source revision before this contract:
  `fc79e98c395efde104c7a4a9dd97570af1c8d080`.
- Recording:
  `play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json`,
  SHA-256 `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.
- Champion: `solver/bot.js`, SHA-256
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.
- Ruleset: `solver/engine.js`, SHA-256
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Shipped environment: `src/game.js`, SHA-256
  `3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1`.
- Frozen diagnostic dependency: `solver/built-reservoir-probe.js`, SHA-256
  `a3a11f9ba8db149430b05f6864b2cd70977e207fdc8872f2cf9d221f2b4b7e00`.
- Predecessor result:
  `docs/learning-cycles/LC-0002-built-reservoir-proxy-result.md`, SHA-256
  `011831d0c364ce8d98f2a8b9308bc864f8df533c336d747d23ac4968cec37577`.

The new proxy and harness identities are empty until implementation. A
mechanically generated, committed manifest must bind them before the retained
panel. Qualification accepts the manifest only; manual expected-hash arguments
are forbidden.

## Public seam and terminal semantics

The harness must verify and replay the real recording through
`solver/engine.js`, reconstruct every owner-prefix decision state, and compare
the owner's next action with the unchanged champion's next action on that same
state. Both arms receive identical future spawn and lookahead streams. The
candidate move is excluded from `d` because both alternatives spend it.

Game ordering is execute, gravity, refill, blocker tick, bomb check, then
target check. A bomb explosion is a loss even if the same move's score crosses
the target, matching the existing evaluator. Move-budget exhaustion and no
legal move are losses. Crossing score is diagnostic only.

Known labels remain based on full champion takeover target cost:

`champion target cost after owner prefix n-1 - champion target cost after owner prefix n`

Positive is helpful, negative harmful, and zero neutral.

## Qualification controls

All controls must pass before the real panel is persisted.

1. **Band-order control:** the pure reducer must return exact costs `0`, `3`,
   `4.25`, and `6.25` for an immediate target, third-step target, active state
   with 25% gap, and terminal loss with 25% gap respectively.
2. **Horizon positive control:** a scripted subject that reaches the target on
   exactly the third continuation step must return cost `3`; a planted
   two-step horizon must remain active with cost greater than `4`. Failure
   means the collector does not enforce the frozen horizon.
3. **Scale negative control:** uniformly multiplying score and target by 32
   must leave the active-state cost exactly unchanged.
4. **Orthogonal diagnostic control:** changing only a diagnostic built-material
   value while terminal state, score, target, and continuation count stay fixed
   must leave primary cost unchanged.
5. **Reference A/A control:** evaluating the same champion candidate twice on
   one real excluded decision must produce identical trace, terminal state,
   score, and proxy cost.
6. **Real-input integrity control:** the clean recording must replay and a copy
   with one false tile-value claim must be rejected before measurement.
7. **Identity control:** coherent recording substitution must fail against the
   committed external manifest; every frozen path must match its manifest
   identity.
8. **Persistence control:** a planted thrown verdict must leave the complete
   raw artifact on disk.

Any failed control stops the panel and yields `UNVERIFIED`.

## Frozen decision panel

This is already-inspected design material, never confirmation evidence.

- Helpful owner moves: `2, 6, 10, 11, 13`.
- Harmful owner moves: `1, 4, 8, 9, 12`.
- Neutral diagnostics, excluded from the verdict: `3, 5, 7, 14, 15`.

Every move must appear exactly once and both arms must be measured. Any
missing, duplicate, reordered, identity-mismatched, or unmeasured cell is
`UNVERIFIED`.

## Qualification verdict

- `PASS`: on every helpful move, owner cost is strictly less than champion
  cost; on every harmful move, owner cost is greater than or equal to champion
  cost.
- `FAIL`: the complete panel contains any helpful tie/loss or any harmful
  strict owner advantage.
- `UNVERIFIED`: any control, identity, replay, completeness, bound,
  persistence, or objective-equivalence check fails.

There is no partial-pass threshold and no statistical inference. The exact
known decision is the unit.

## Attempt and stop rule

Implement and qualify the proxy once, freeze its harness in Git, generate and
commit the manifest mechanically, then collect one complete retained panel.
Persist raw cells before assigning the verdict. Do not tune the horizon,
bands, diagnostics, labels, or matrix. `FAIL` stops the proxy before
preregistration or fresh inputs. A pre-panel setup failure must be recorded in
`FAILED-RUN-LEDGER.CSV` and prevented before retry; the panel remains unspent
only when zero real cells were collected.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, or RESULT-0057/LC-0002 artifact.
