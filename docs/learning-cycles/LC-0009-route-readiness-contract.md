# LC-0009 — correction-route readiness timeline contract

**Frozen:** 2026-09-28, after LC-0008 exposed all eight correction ancestry
graphs, before any replay-time route-readiness timeline was collected

**Status:** frozen retrospective exact-trajectory contract

**Consuming decision:** determine what the frozen correction route is still
waiting for at each continuation and when it first becomes executable. This
contract cannot define a metric, score readiness, search for an alternative
route, tune a threshold, run a fresh seed, modify the champion, or authorize
promotion.

## Experiment-type declaration

- **Primary design:** custom
  `retrospective-fixed-trajectory-route-readiness-diagnostic`.
- **Context profile:** `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- **Assurance profile:** `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- **Control contract:** SHA-256
  `10de8551b57dfb9ec888f8d2853c17e9c1efbc5ea678cda2b0b5cd72b5fdb031`.

All gameplay outcomes and correction ancestry graphs are already opened. The
new information is the exact pre-continuation readiness state of each frozen
correction route. The experimental unit and unit of generalization are each
the four named decision states; no claim is made about unseen games, boards,
seeds, routes, or policies.

## Question

For both the owner and champion arms at owner moves 4, 6, 9, and 11, at which
pre-continuation board does the exact LC-0008 correction route first become a
legal selectable chain? Before then, which exact future correction-input node,
value-order link, or king-adjacency link is absent?

## Frozen readiness definition

The route is the LC-0008 correction merge's ordered `inputNodeIds`. No alternate
ordering, substitute tile, shorter chain, or different future chain may count.

At the board immediately before each continuation, locate the live tile object
whose current ancestry node equals each frozen correction input. A route is
**executable** exactly when:

1. every ordered correction input node exists as a distinct live tile;
2. the first two tile values are equal and each later value equals or doubles
   its predecessor, exactly as the game requires;
3. every consecutive pair is king-adjacent; and
4. the ordered objects pass the real engine's chain-validity seam.

For every non-executable snapshot, record:

- each missing direct input node, its expected value, and whether it is an
  unspawned root or an unbuilt intermediate merge;
- each consecutive pair that is simultaneously present but not king-adjacent;
- each simultaneously present consecutive pair that violates value order; and
- the exact state identity and live coordinate/value of every present direct
  input.

After each selected continuation, record which contributing LC-0008 roots or
merge nodes were newly created and which already-present direct inputs moved
under gravity. These are replay facts only. They do not become a score or
ranking.

The **first-ready continuation** is the earliest pre-continuation snapshot
meeting all four conditions. The correction continuation itself must be ready,
or the arm is `UNVERIFIED`.

## Frozen panel and comparison

| Owner move | Frozen label | Eventual winner | Correction continuation |
| ---: | --- | --- | ---: |
| 4 | harmful | champion | 4 |
| 6 | helpful | owner | 5 |
| 9 | harmful | champion | 4 |
| 11 | helpful | owner | 4 |

Trace owner and champion from the same retained decision state through every
pre-continuation board up to and including the correction. The primary result
is the eight first-ready continuations and their exact earlier missing nodes or
links. The registered panel disposition is:

- `ALL_ROUTES_READY_ONLY_AT_CASHOUT`: all eight routes first become executable
  immediately before their frozen correction-producing move.
- `SOME_ROUTES_READY_EARLIER`: at least one route is already executable at an
  earlier pre-continuation board while every arm remains fully verified.
- `UNVERIFIED`: any source, arm, node identity, timeline state, correction
  route, or readiness condition is missing or inconsistent.

The result may compare winner and loser timelines and name exact repeated or
contrasting facts. It may not infer that delayed execution was optimal, because
the diagnostic does not search alternative chains or counterfactual timing.

## Controls

### C1 — frozen ancestry and replay identity

- **Role/profile:** assignment integrity, `simulation-policy`.
- **Subject/seam:** frozen LC-0008 contract, manifest, qualification, raw
  graphs, recording, rules, and champion through their real repository paths.
- **Expected:** every identity matches; all four cells, eight arms, correction
  continuations, ordered correction inputs, and replay states reproduce.
- **Failure meaning:** stop; `UNVERIFIED`.
- **Evidence:** qualification and raw controls.

### C2 — objective and continuation equivalence

- **Role/profile:** reference/objective equivalence, `simulation-policy`.
- **Subject/seam:** owner and champion arms within each decision cell.
- **Expected:** shared decision state, target, move budget, RNG prefix,
  unchanged champion continuation, and target-stop objective; only the retained
  decision chain differs.
- **Failure meaning:** affected cell and panel are `UNVERIFIED`.
- **Evidence:** raw invariant records.

### C3 — ready-route known-good

- **Role/profile:** positive control, `mutation-qualification`.
- **Subject/seam:** the public readiness assessor on a disposable real-engine
  board whose five frozen input nodes form a legal `8-8-8-8-16` route.
- **Expected:** all inputs are present, no link is missing, and the route is
  executable through the real chain-validity seam.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification control and focused test.

### C4 — missing-node known-negative

- **Role/profile:** negative control, `mutation-qualification`.
- **Subject/seam:** the same frozen route with one expected direct input absent.
- **Expected:** readiness is false and the exact missing node/value is named.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification control and focused test.

### C5 — broken-adjacency known-negative

- **Role/profile:** negative control, `mutation-qualification`.
- **Subject/seam:** five present, correctly ordered values with one consecutive
  pair separated beyond king adjacency.
- **Expected:** readiness is false and the exact broken pair is named.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification control and focused test.

### C6 — planted false-ready mutation

- **Role/profile:** known-kill mutation, `mutation-qualification`.
- **Subject/seam:** the public readiness-claim validator.
- **Mutation:** flip a real missing-node observation from not ready to ready
  while preserving its missing-input evidence.
- **Expected:** rejection for readiness/evidence contradiction.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification receipt with mutant presence, reachability, and
  intended rejection reason.

### C7 — restoration and persistence

- **Role/profile:** restoration, `mutation-qualification`.
- **Subject/seam:** readiness assessor identity and raw writer.
- **Expected:** assessor identity is unchanged after controls; a planted
  interpretation failure occurs only after a complete disposable raw artifact
  is persisted.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification receipt and focused test.

## Harness qualification and pre-outcome admission

The not-yet-built analyzer must be bound by a generated manifest containing
full identities for this committed contract, every frozen input, its own source,
and focused test. Before the retained timeline run:

1. all manifest paths and identities must match committed bytes;
2. C1–C7 must pass through the real public seams;
3. one coherently rehashed changed-input manifest must be rejected against an
   expected manifest identity supplied outside the manifest;
4. the committed closeout contract must pass the real closure verifier against
   disposable artifacts using its resolved contract-relative paths;
5. reportable raw and recomputation paths must be absent; and
6. at most two qualification attempts are permitted.

## Frozen identities

- Source revision: `c80cc5bd8eedb9bc13bae4e7a6452583d7ddd4ca`.
- LC-0008 contract SHA-256
  `33831b27fc62473440f71bf0efd1475906c9ee9d8d69ea95121d1b07bb0b6421`.
- LC-0008 manifest SHA-256
  `defcf7ff98140c0cd0a2246d669a7c906350e5a1b53a81436f2037665d9624e9`,
  internal identity
  `2c202a7a11dc7ac3164692145fc962d4aa2dd7d28017c417efd09bad11ed9c28`.
- LC-0008 qualification SHA-256
  `26ffb1bd5d9c88b496d47d33f540ddf8970e7ec5de004972760b25a32c51d76f`,
  internal identity
  `09ce87ea6a4087f2948c5aced2f99858a7e4515cce617b3eb3c9bfe200905df9`.
- LC-0008 raw SHA-256
  `62b5da0a13698fd34cb27dd9ced8f2924b8880b9cba08433499af23fac68d900`,
  internal identity
  `2f9558a9c81adf2459b9762e4fbe1ee1515c3358a7edb34d01afe4f093b9fea8`.
- LC-0008 result SHA-256
  `984da56c53ccf4cf8cf237795978c4536728802ca4eaa327c1042bbf125d3e5a`.
- Prior ancestry analyzer: `tools/diagnose-lc0008-reversal-ancestry.js`,
  SHA-256
  `f1b780435d77592104c4d1190935f60d49d96bff1613e6a7653bd07551e7ff58`.
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

After qualification, replay exactly eight arms and inspect only the
pre-continuation boards from one through the frozen correction continuation.
Persist the full timelines before interpretation and stop. No alternative
route, ordering, chain, spawn, seed, horizon, readiness definition, or result
category may be tried after outcomes are visible.

## Interpretation boundary

The result may name the exact missing nodes and links, first-ready timing, and
selected replay event that supplied them. It may not call that hindsight state
a policy feature, say that an earlier legal route should have been selected, or
generalize beyond the eight retained arms.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, prior experiment, or prior learning
cycle artifact.
