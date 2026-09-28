# LC-0005 — complete-harvest-chain exact-state contract

**Frozen:** 2026-09-28, after the retained LC-0004 state and its selected
13-tile chain were opened, but before any new counterfactual continuation was
run

**Status:** frozen exact-state diagnostic contract

**Consuming decision:** determine whether the owner's stated endgame intent—one
small-to-large chain that consumes every built tile—has a concrete topological
meaning on the exact `M8-CONNECT` state. This contract cannot define a metric,
generalize to other states, authorize fresh seeds, change the policy, or promote
a champion.

## Experiment-type declaration

- **Primary design:** custom `fixed-state-path-repair-intervention`.
- **Context profile:** `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- **Assurance profile:** `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- **Control contract:** SHA-256
  `10de8551b57dfb9ec888f8d2853c17e9c1efbc5ea678cda2b0b5cd72b5fdb031`.

This is an exploratory exact-state probe. Its outcomes are direct observations
about one named board state, not a reportable population confirmation. The
opened LC-0004 chain is used to select the intervention; only the unchanged
champion's response and continuation after that intervention remain unopened.

## Question

In the exact `M8-CONNECT` after-state, why can the selected chain consume only
seven of the ten built tiles, and does one frozen, tile-multiset-preserving
placement repair expose a legal small-to-large chain containing all ten built
tiles to the unchanged champion?

## Existing observation and structural accounting

The bound LC-0004 artifact already shows:

- ten built tiles, defined exactly as non-blocked tiles above the initial-board
  maximum of normalized `16`;
- one king-adjacent built component of size ten;
- a selected 13-tile chain with normalized values
  `4,4,4,8,8,16,32,32,32,32,32,32,32`;
- seven built tiles in that chain; and
- exact target cost 14 after the intervention.

The harness must independently recover those facts from the real retained
artifact. It must list the three excluded built coordinates and test actual
chain legality rather than infer coverage from component size.

The expected topological obstruction is a fork, stated before the new
continuation is run: the built-tile graph is connected, but the selected
small-to-large route reaches a branching lower reservoir. A legal chain is a
single non-revisiting path whose next value is equal to or double the prior
value. It cannot visit both branches and still finish at the `64` tile.

## Frozen subject and intervention

The subject is the exact LC-0004 `M8-CONNECT` after-state with state identity
`416f6b90b1cde7d6761cf9f0177d0f8b17b42a27cd69223eceab07333e65fbe6`.
Reconstruct it from the frozen recording through the unchanged game rules,
owner prefix, champion continuation schedule, and the already-declared
`M8-CONNECT` swap. Do not manufacture a state from the retained JSON grid.

### M8-PATH-REPAIR

Swap normalized `(3,7)=32` with `(2,7)=8`.

This coordinate pair is frozen before the champion outcome because it performs
the smallest available edit—a single swap—that moves the right-hand built leaf
into the bottom-center gap. The predicted legal complete-harvest route is:

```text
(2,0)=4, (3,0)=4, (2,1)=4,
(3,2)=8, (2,2)=8, (1,2)=16,
(0,3)=32, (0,4)=32, (0,5)=32,
(1,6)=32, (2,5)=32, (3,6)=32,
(2,7)=32, (1,7)=32, (0,7)=32,
(0,6)=64
```

The prediction is a topology assertion, not the champion outcome. The
intervention name does not assert that the champion will choose this chain or
that it will improve target cost.

No alternate coordinate is permitted. If an endpoint differs, the run is
`UNVERIFIED` and stops before continuation.

## Decision-bearing outcome and exact dispositions

The one decision-bearing comparison is the unchanged champion's next choice on
the unmodified `M8-CONNECT` state versus `M8-PATH-REPAIR`, followed by the same
target-stop continuation.

- `COMPLETE_HARVEST_SELECTED`: the repaired state's champion-selected chain is
  legal and contains all ten built tiles.
- `COMPLETE_HARVEST_AVAILABLE_NOT_SELECTED`: the frozen 16-tile route is legal
  and contains all ten built tiles, but the champion selects another chain.
- `NO_COMPLETE_HARVEST`: the frozen route is not legal or does not contain all
  ten built tiles.
- `UNVERIFIED`: a source, reconstruction, control, endpoint, invariant, or
  outcome is missing or inconsistent.

Record, but do not use to redefine those dispositions: chain length, normalized
value sequence, chain sum, immediate points, score after the move, survivor
value and coordinate, continuation trace, and terminal target cost.

The experimental unit and unit of generalization are both this one exact board
state. There is no statistical estimator, uncertainty claim, missing-data
imputation, or population effect. A loss has target cost `maxMoves + 1`.

## Controls

### C1 — deterministic source and replay identity

- **Role/profile:** assignment integrity, `simulation-policy`.
- **Subject/seam:** committed protocol, retained LC-0004 artifact, recording,
  production rules, and champion through their real repository paths.
- **Expected:** every full SHA-256 matches; the recording replays cleanly; the
  reconstruction reaches the exact frozen `M8-CONNECT` state identity.
- **Failure meaning:** stop before the retained intervention; `UNVERIFIED`.
- **Evidence:** qualification and raw control records.

### C2 — reference-policy A/A

- **Role/profile:** reference and synthetic null, `simulation-policy`.
- **Subject/seam:** reconstruct and finish the unmodified `M8-CONNECT` state
  twice through the unchanged champion.
- **Expected:** byte-identical next choice, continuation, terminal state, and
  target cost, reproducing LC-0004 target cost 14.
- **Failure meaning:** stop before the retained intervention; `UNVERIFIED`.
- **Evidence:** qualification control record.

### C3 — chain-legality known-kill pair

- **Role/profile:** positive and negative harness controls,
  `mutation-qualification`.
- **Subject/seam:** the real complete-harvest predicate on disposable fixtures.
- **Expected:** an independently specified `4,4,8,16,32,64` king-adjacent path
  is accepted; moving its `16` beyond king adjacency is rejected for the
  intended discontinuity reason.
- **Failure meaning:** qualification fails; no retained intervention.
- **Evidence:** qualification control record and focused test.

### C4 — planted coverage mutation

- **Role/profile:** known-kill mutation, `mutation-qualification`.
- **Protected claim/seam:** exact accounting of which built coordinates occur
  in the selected chain.
- **Mutation:** add one known excluded coordinate to a disposable claimed
  coverage set without adding it to the chain.
- **Expected:** the real coverage verifier rejects the claim as inconsistent.
- **Failure meaning:** qualification fails; no retained intervention.
- **Evidence:** qualification receipt with mutant identity, presence,
  reachability, and intended rejection reason.

### C5 — objective and intervention equivalence

- **Role/profile:** objective equivalence, `simulation-policy`.
- **Subject/seam:** baseline and `M8-PATH-REPAIR` arms.
- **Expected:** score, moves, target, move budget, exact tile/blocker multiset,
  RNG position, chooser, spawn stream, lookahead schedule, and termination
  rules are identical before continuation; only the two declared coordinates
  differ.
- **Failure meaning:** intervention invalid; `UNVERIFIED`.
- **Evidence:** raw invariant block.

### C6 — restoration and persistence

- **Role/profile:** restoration, `mutation-qualification`, plus evidence
  retention.
- **Subject/seam:** disposable mutation subject and raw-artifact writer.
- **Expected:** the clean predicate identity is restored after the planted
  mutation; a planted interpretation exception occurs only after a complete
  disposable raw artifact has been written.
- **Failure meaning:** qualification fails; no retained intervention.
- **Evidence:** qualification receipt and focused test.

## Harness qualification and pre-outcome admission

The not-yet-built harness must be bound by a mechanically generated manifest
containing its full SHA-256, its focused test's full SHA-256, this committed
protocol, and every frozen input below. Before any retained arm runs:

1. the committed protocol, harness, test, manifest, and closeout contract bytes
   must match the working tree;
2. C1–C4 and C6 must pass through the real public seams;
3. one coherent changed-identity manifest must be rejected using an expected
   manifest identity supplied outside that manifest;
4. the exact committed closeout contract must pass the closure verifier against
   disposable artifacts, including its resolved `cwd` and recomputation path;
5. the reportable raw output must not exist; and
6. no more than two qualification attempts are permitted.

Preserve every qualification attempt. A passing qualification applies only to
this subject, one intervention, and the stated observation vocabulary.

## Frozen identities

- Source revision before this contract:
  `6ba96007d1cb988f2f20c741dce218d2c600f797`.
- LC-0004 raw artifact:
  `docs/learning-cycles/LC-0004-move6-move8-causal-contrast-raw.json`,
  SHA-256 `5afba90eada26b0d3a5b6e5d0f6d92578a4db606c0adaadf93250d746f4d8d90`,
  internal artifact identity
  `aba76b65d3c7a89a034c6dc8b2937e1c5b086f9ac23c23f9bcf00b27a42280d1`.
- LC-0004 reconstruction harness:
  `tools/diagnose-lc0004-move6-move8.js`, SHA-256
  `ad8b53311d129fe4eafb856637758d7d9e223680f5bef2cf840bb977f10d09e6`.
- Recording:
  `play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json`,
  SHA-256 `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.
- Champion: `solver/bot.js`, SHA-256
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.
- Ruleset: `solver/engine.js`, SHA-256
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Shipped environment: `src/game.js`, SHA-256
  `3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1`.

The harness, focused test, manifest, and closeout-contract identity slots are
empty until implementation. They must be filled in new committed pre-outcome
artifacts; this protocol does not change.

## Bounds and stop rule

After qualification, reconstruct the baseline and intervention once each,
check C5 before continuation, persist the complete raw artifact before
interpretation, and stop. There are no retries, alternate coordinates, extra
swaps, fresh seeds, tuned paths, or second policy.

A setup failure before the retained intervention may be repaired within the
two-attempt qualification bound if its observation and prevention are recorded.
Any failure after retained collection begins stops the run and preserves the
partial artifact. A valid negative outcome is not a failed run.

## Interpretation boundary

The result may say why the exact baseline route excludes named tiles, whether
the frozen repair makes one complete chain legal, whether the unchanged
champion selects it, and what happens next on this exact replay. It may not say
that complete-harvest structure is generally better, define a score term, rank
policies, or modify the champion.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, prior experiment, or prior learning
cycle artifact.
