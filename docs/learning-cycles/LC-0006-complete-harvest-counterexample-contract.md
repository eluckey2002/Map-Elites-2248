# LC-0006 — complete-harvest counterexample contract

**Frozen:** 2026-09-28, after LC-0004 and LC-0005 were opened, before the
retrospective topology classifier was implemented

**Status:** frozen retrospective exact-state contract

**Consuming decision:** determine whether the already-retained `M6-CONNECT`
state is a counterexample to the broad rule “a connected, high-coverage built
reservoir should now be harvested completely.” This contract cannot define a
metric, create a gameplay intervention, run a fresh seed, change the policy, or
promote a champion.

## Experiment-type declaration

- **Primary design:** custom `retrospective-fixed-state-path-counterexample`.
- **Context profile:** `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- **Assurance profile:** `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- **Control contract:** SHA-256
  `10de8551b57dfb9ec888f8d2853c17e9c1efbc5ea678cda2b0b5cd72b5fdb031`.

All gameplay outcomes used here were opened and retained by LC-0004. This run
adds no outcome data. It automates one exact topological classification against
the real chain-extension rule and reports the already-retained comparison.

## Question

On the exact `M6-CONNECT` after-state, can one legal small-to-large chain use
all eight built tiles? If not, what board obstruction prevents it, and did the
connected placement improve or worsen the retained target cost relative to the
frozen `M6-BASELINE` arm?

## Deterministic subject selection

`M6-CONNECT` is fixed because it is the only other LC-0004 `CONNECT`
intervention besides the `M8-CONNECT` state already used by LC-0005. It is not
selected by its outcome. The subject is the exact after-state with identity
`535a53040732ccc4047de5254dd7c9da278d0cd2e005f28e2316c0d3d2e4b2aa`.

Built tiles are exactly the non-blocked tiles above the initial-board maximum
of normalized `16`. On this state the retained artifact records eight built
tiles, normalized built value `288`, one king-adjacent component of size eight,
and a maximum built-only path covering seven tiles. The analyzer must recover
those facts from the real artifact rather than accept them as assertions.

## Exact topological question

A complete harvest is available only if a legal, non-revisiting path can:

1. enter the built reservoir from a normalized `16` into a king-adjacent
   normalized `32`; and
2. continue through all eight built tiles under the production rule that each
   next tile is equal to or double the preceding tile.

The analyzer must exhaustively enumerate the eight-node built graph from every
built starting tile using `solver/engine.js` `canExtendChain`. It must report
the maximum reachable built coverage and every `16`→`32` entry edge. Because
the subject contains only eight built nodes, this is exact enumeration, not a
heuristic search.

## Frozen comparison and dispositions

The decision-bearing retained comparison is `M6-BASELINE` versus `M6-CONNECT`:
same LC-0004 source, cutoff state, champion, continuation schedule, target,
move budget, tile multiset, and RNG position; only the declared LC-0004
placement differs.

- `HARMFUL_COMPLETE_HARVEST`: a complete legal harvest exists, the champion
  selects it, and `M6-CONNECT` has a higher target cost than `M6-BASELINE`.
- `AVAILABLE_UNSELECTED_COMPLETE_HARVEST`: a complete legal harvest exists but
  the retained champion choice does not cover every built tile.
- `IMPOSSIBLE_COMPLETE_HARVEST`: no legal complete harvest exists on the exact
  state.
- `NO_COUNTEREXAMPLE`: a complete legal harvest exists and the retained
  comparison does not refute the broad rule.
- `UNVERIFIED`: any bound identity, source fact, exact enumeration, control, or
  retained comparison is missing or inconsistent.

These are exact-case labels only. `IMPOSSIBLE_COMPLETE_HARVEST` means “do not
harvest yet on this board”; it does not reject the owner's longer-term strategy
of eventually building one complete, high-valued chain.

## Controls

### C1 — frozen source identity

The LC-0004 raw file must match both its external SHA-256 and internal artifact
identity, and the selected arm must match the frozen M6 state identity.
Failure yields `UNVERIFIED`.

### C2 — retained comparison identity

The analyzer must recover target cost `15` for `M6-BASELINE` and `16` for
`M6-CONNECT`, plus the LC-0004 objective-equivalence invariants. Failure yields
`UNVERIFIED`.

### C3 — real predicate positive and negative controls

The production chain-extension rule must accept a known king-adjacent
`32,32,32,64` built path and reject the same values when one required adjacency
is broken. The focused test must plant both cases through the public analyzer
seam.

### C4 — planted coverage mutation

The coverage verifier must reject a claim that adds a known absent built
coordinate to a path without adding it to the path itself.

### C5 — persistence

The raw classification artifact must be written before its disposition is
summarized. A planted interpretation failure must leave a complete disposable
raw artifact on disk.

## Frozen identities

- Source revision: `75e864597ae760d079c43ca6de8930cd47164ea3`.
- LC-0004 raw artifact:
  `docs/learning-cycles/LC-0004-move6-move8-causal-contrast-raw.json`, SHA-256
  `5afba90eada26b0d3a5b6e5d0f6d92578a4db606c0adaadf93250d746f4d8d90`,
  internal identity
  `aba76b65d3c7a89a034c6dc8b2937e1c5b086f9ac23c23f9bcf00b27a42280d1`.
- Ruleset: `solver/engine.js`, SHA-256
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Champion: `solver/bot.js`, SHA-256
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.
- LC-0005 result:
  `docs/learning-cycles/LC-0005-complete-harvest-chain-result.md`, SHA-256
  `19605fb32d05472abd4050301570dd8bc3852316315d5525827f7df8636b802f`.

The analyzer, focused test, and manifest identities are filled only after this
contract is committed. The contract itself does not change.

## Bound and stop rule

One read-only classification of the retained `M6-CONNECT` state is permitted.
No new gameplay continuation, coordinate change, alternate state, seed,
policy, descriptor, or scoring term may be tried. Stop after persisting the
raw evidence and exact-case disposition.

## Interpretation boundary

The result may show the board, selected-chain built coverage, exhaustive
maximum built-path coverage, entry edges, the retained target-cost comparison,
and the exact obstruction. It may not call this a general law, design a metric,
or recommend changing the champion.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, prior experiment, or prior learning
cycle artifact.
