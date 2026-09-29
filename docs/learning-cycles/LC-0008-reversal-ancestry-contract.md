# LC-0008 — reversal-chain ancestry contract

**Frozen:** 2026-09-28, after LC-0007 exposed the exact decision-survivor
lineage, before any full correction-chain ancestry was collected

**Status:** frozen retrospective exact-trajectory contract

**Consuming decision:** expose what “stay the course” physically consists of
in the four already-opened LC-0003 misses. Trace the exact correction-producing
chain backward through intermediate merges to the post-decision board and later
spawns. This contract cannot define a metric, rank a candidate policy, change
candidate generation or scoring, run a fresh seed, modify the champion, or
authorize promotion.

## Experiment-type declaration

- **Primary design:** custom
  `retrospective-fixed-trajectory-reversal-ancestry-diagnostic`.
- **Context profile:** `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- **Assurance profile:** `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- **Control contract:** SHA-256
  `10de8551b57dfb9ec888f8d2853c17e9c1efbc5ea678cda2b0b5cd72b5fdb031`.

All gameplay outcomes and the one-tile lineage result are already opened. The
new information is the complete ancestry graph of eight retained correction
chains. The experimental unit and unit of generalization are each the four
named decision states; no claim is made about unseen games, boards, seeds, or
policies.

## Question

For both the owner and champion arms at owner moves 4, 6, 9, and 11, which
post-decision tiles, later spawned tiles, and intermediate merges assemble the
exact selected chain whose post-state first corrects the frozen three-step
target-gap ordering?

## Frozen ancestry model

Immediately after each arm's decision chain, gravity, refill, and blocker tick,
assign one **post-decision root** to every live tile object. Record its
coordinate, value, and one of these origins:

- `decision-survivor`: the final survivor of the decision chain;
- `decision-refill`: a tile spawned by the decision refill; or
- `carried-board`: any other tile already present before the decision and still
  live after it.

Every tile spawned by a later continuation is a **continuation-spawn root**
with its spawn continuation, coordinate, and value. Gravity moves a tile
without changing its current ancestry node.

Every selected continuation chain creates one **merge node**. Its ordered
inputs are the current ancestry nodes of the chain's tile objects immediately
before execution; its output is attached to the chain's final surviving tile.
The output's root set is the exact union of all input root sets. No root may be
duplicated, lost, or introduced by a merge.

The **correction ancestry graph** contains the correction-producing merge node
and every root or earlier merge node reachable backward from its inputs. It
must preserve ordered chain coordinates and values at every included merge.
Its root-value sum must equal the correction chain's tile-value sum. Roots live
on the post-decision board or arise from a named continuation spawn; no other
origin is allowed.

This graph is the route being inspected. Root counts, root values, origin
labels, merge counts, and first-use times are exact replay diagnostics, not a
candidate score or proposed policy feature.

## Frozen panel and result

The correction continuations and eventual winners remain fixed:

| Owner move | Frozen label | Eventual winner | Correction continuation |
| ---: | --- | --- | ---: |
| 4 | harmful | champion | 4 |
| 6 | helpful | owner | 5 |
| 9 | harmful | champion | 4 |
| 11 | helpful | owner | 4 |

Within each cell, trace the owner and champion arms from the identical decision
state with their already-retained decision chains, RNG streams, champion
continuation, objective, and target-stop rule. For each arm record:

- all post-decision roots and their origins;
- all later-spawn roots that contribute to the correction chain;
- the ordered correction-chain inputs;
- every contributing intermediate merge and its ordered inputs;
- which post-decision roots contribute and which do not;
- exact contributing root counts and value sums by origin;
- whether the decision-survivor root contributes; and
- a mass-conservation and graph-reachability verdict.

The registered panel disposition is:

- `FULL_ANCESTRY_TRACED`: all eight arms reproduce and all eight correction
  graphs are complete, reachable, origin-valid, and mass-conserving.
- `UNVERIFIED`: any source, arm, correction chain, root origin, graph edge,
  reachability check, or conservation check is missing or inconsistent.

The result may compare the eight exact graphs and name repeated or contrasting
facts. It may not turn those facts into a metric or claim they distinguish
policies outside these four paired states.

## Controls

### C1 — frozen replay and panel identity

- **Role/profile:** assignment integrity, `simulation-policy`.
- **Subject/seam:** frozen LC-0003 and LC-0007 artifacts, recording, rules, and
  champion through their real repository paths.
- **Expected:** every identity matches; the four decision states, eight arm
  decisions, correction continuations, correction chains, and terminal costs
  reproduce exactly.
- **Failure meaning:** stop; `UNVERIFIED`.
- **Evidence:** qualification and raw controls.

### C2 — objective and continuation equivalence

- **Role/profile:** reference/objective equivalence, `simulation-policy`.
- **Subject/seam:** owner and champion arms within each decision cell.
- **Expected:** shared decision state, target, move budget, RNG prefix,
  unchanged champion continuation, and target-stop semantics; only the retained
  decision chain differs.
- **Failure meaning:** affected cell and panel are `UNVERIFIED`.
- **Evidence:** raw invariant records.

### C3 — merge-union known-good

- **Role/profile:** positive control, `mutation-qualification`.
- **Subject/seam:** the public ancestry tracker on a disposable real-engine
  sequence with separately tagged roots, gravity, and two successive merges.
- **Expected:** the second merge output reaches every input root exactly once,
  includes the first merge node, and conserves root value.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification control and focused test.

### C4 — unrelated-root known-negative

- **Role/profile:** negative control, `mutation-qualification`.
- **Subject/seam:** the same tracker with one tagged live root excluded from all
  selected chains.
- **Expected:** the excluded root is absent from the final graph while its live
  tile and ancestry node remain unchanged.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification control and focused test.

### C5 — planted false-origin mutation

- **Role/profile:** known-kill mutation, `mutation-qualification`.
- **Subject/seam:** the public graph validator's retained root-origin claim.
- **Mutation:** change one contributing root from its observed origin to a
  different allowed origin while preserving every other graph field.
- **Expected:** rejection for a root-origin mismatch against the live tracker's
  externally retained root registry.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification receipt with mutant presence, reachability, and
  intended rejection reason.

### C6 — conservation mutation

- **Role/profile:** known-kill mutation, `mutation-qualification`.
- **Subject/seam:** the public graph validator's correction root set.
- **Mutation:** remove one contributing root ID while preserving the correction
  chain and merge nodes.
- **Expected:** rejection for graph reachability or root-value conservation.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification receipt and focused test.

### C7 — restoration and persistence

- **Role/profile:** restoration, `mutation-qualification`.
- **Subject/seam:** tracker identity and raw writer.
- **Expected:** tracker identity is unchanged after controls; a planted
  interpretation failure occurs only after a complete disposable raw artifact
  is persisted.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification receipt and focused test.

## Harness qualification and pre-outcome admission

The not-yet-built analyzer must be bound by a generated manifest containing
full identities for this committed contract, every frozen input, its own source,
and focused test. Before the retained ancestry run:

1. all manifest paths and identities must match committed bytes;
2. C1–C7 must pass through the real public seams;
3. one coherently rehashed changed-input manifest must be rejected against an
   expected manifest identity supplied outside the manifest;
4. the committed closeout contract must pass the real closure verifier against
   disposable artifacts using its resolved contract-relative paths;
5. reportable raw and recomputation paths must be absent; and
6. at most two qualification attempts are permitted.

## Frozen identities

- Source revision: `755636ba5f4ef011744d079dbb46d586ccc4d6c7`.
- LC-0003 four-miss raw:
  `docs/learning-cycles/LC-0003-four-miss-diagnostic-raw.json`, SHA-256
  `58a6458367295823d56b29f5e4589077161648b0e3619c6e5d6d6cca8eb3c284`,
  internal identity
  `10a05405746480e7232690115a877c6a0a431cdc7bc182f1147178444d4b23fd`.
- LC-0007 contract SHA-256
  `f4b7b577e8fef08406b0e24dcd2d40b752e7a124d4e09addad0a2f9fb7de1a3d`.
- LC-0007 manifest SHA-256
  `f960ef1e4eb77377e967bfff41a80c42d627369befdd595fb7c02676c5355c1b`,
  internal identity
  `f2f5b5bd82b13eb665bf20251a904fd3f57716e5c58af0dce23b0e45cbfe4f01`.
- LC-0007 qualification SHA-256
  `b7e86156e8d1817e89ade2413567e15ce595996aeafef86e041f24f28b427bf8`,
  internal identity
  `592ad88a1804095baee2fbd01381bb6e0c41ab533eb8f4d32716aeecb0d1a4ac`.
- LC-0007 raw SHA-256
  `546582c6010eca867582505241e262ddff2888fe22057c2580dbe99c51da3fea`,
  internal identity
  `6074b33ac0d68aba78c0ddd68c94041dc2e871392f9c50d573c00e1fd218dc19`.
- Prior lineage analyzer: `tools/diagnose-lc0007-decision-lineage.js`, SHA-256
  `d5c68a094bbbff716954cbfd21243ba77e83819beed6a26dc848ce4b57bedf37`.
- Recording:
  `play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json`,
  SHA-256
  `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.
- Ruleset: `solver/engine.js`, SHA-256
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Champion: `solver/bot.js`, SHA-256
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.

The analyzer, focused test, manifest, and closeout-contract identities are empty
until implementation. They must be committed before qualification; this
contract does not change.

## Bounds and stop rule

After qualification, replay exactly eight arms: owner and champion at each of
moves 4, 6, 9, and 11. Stop each arm immediately after executing its frozen
correction-producing chain; later terminal moves may only be checked against
the already-retained LC-0007 result, not newly explored. Persist the complete
raw artifact before interpretation and stop. No alternative decision, future
chain, spawn, seed, horizon, correction point, ancestry definition, or result
category may be tried after outcomes are visible.

## Interpretation boundary

The result may show the exact route that assembled each correction chain and
state whether a categorical ancestry fact repeats or has a counterexample in
the eight named arms. It may not name a score, threshold, weight, feature, or
champion rule, and it may not claim generality beyond the retained replay.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, prior experiment, or prior learning
cycle artifact.
