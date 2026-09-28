# LC-0007 — decision-lineage course-persistence contract

**Frozen:** 2026-09-28, after LC-0003 through LC-0006 were opened, before any
decision-survivor lineage was traced through the four miss continuations

**Status:** frozen retrospective exact-trajectory contract

**Consuming decision:** determine whether “stay the course” has a concrete
replay meaning in the four already-opened LC-0003 misses: does the tile created
by the eventual winner's decision survive and contribute to the later move
that reverses the short-horizon ordering? This contract cannot define a metric,
change candidate generation or scoring, run a fresh seed, modify the champion,
or authorize promotion.

## Experiment-type declaration

- **Primary design:** custom `retrospective-fixed-trajectory-lineage-diagnostic`.
- **Context profile:** `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- **Assurance profile:** `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- **Control contract:** SHA-256
  `10de8551b57dfb9ec888f8d2853c17e9c1efbc5ea678cda2b0b5cd72b5fdb031`.

All gameplay outcomes are already opened in LC-0003. The new information is
only exact object lineage through the retained replay. The experimental unit
and unit of generalization are each the four named decision states; no claim is
made about unseen games or policies.

## Question

For each of owner moves 4, 6, 9, and 11, trace both the owner and champion
decision survivor through the unchanged champion continuation. Is the eventual
winner's lineage present in the exact selected chain whose resulting state
first corrects the three-step target-gap ordering?

## “Stay the course” operational definition

The **decision lineage** begins as the final tile of the arm's decision chain,
after that chain receives its sum, gravity moves it, and refill completes.

On every later selected chain:

- if the lineage carrier is absent, the same tile object remains the carrier
  and its post-gravity location is recorded;
- if the carrier is the chain's final tile, that object remains the carrier at
  its larger summed value; and
- if the carrier is consumed in any other chain position, lineage transfers to
  that chain's final surviving tile because it contains the carrier's value.

Thus gravity cannot break identity, and a merge cannot erase ancestry. A chain
**uses the course** exactly when it contains the current carrier before
execution. This is provenance, not a score or policy feature.

The **correction-producing chain** is the selected continuation move whose
post-move state is the already-retained `firstGapOrderCorrection` for that
decision. No later move may substitute for it.

## Frozen panel and comparison

The four cells and eventual winners are fixed by LC-0003:

| Owner move | Frozen label | Eventual winner | First correction continuation |
| ---: | --- | --- | ---: |
| 4 | harmful | champion | 4 |
| 6 | helpful | owner | 5 |
| 9 | harmful | champion | 4 |
| 11 | helpful | owner | 4 |

Within each cell, compare the owner and champion lineages on the same decision
state, recording, RNG stream, continuation policy, objective, and stop rule.
The one decision-bearing observation is whether each arm's correction-producing
chain contains its own decision lineage.

Per-cell outcomes are `WINNER_ONLY`, `BOTH`, `NEITHER`, or `LOSER_ONLY`.
The registered panel disposition is:

- `WINNER_LINEAGE_EXPLAINS_ALL_FOUR`: the winner lineage is used by the
  correction-producing chain in all four cells.
- `WINNER_LINEAGE_EXPLAINS_SOME`: it is used in one to three cells.
- `WINNER_LINEAGE_EXPLAINS_NONE`: it is used in zero cells.
- `UNVERIFIED`: any source, replay, lineage transfer, correction identity,
  control, or cell is missing or inconsistent.

The loser comparison is retained to show whether lineage use distinguishes the
arms, but it cannot change the panel disposition. Record landed coordinate and
value, every carrier coordinate/value after each move, first reuse delay,
number of lineage-using merges before correction, correction-chain points and
length, and terminal target cost as diagnostics only.

## Controls

### C1 — frozen replay and panel identity

- **Role/profile:** assignment integrity, `simulation-policy`.
- **Subject/seam:** frozen LC-0003 manifest, qualification, four-miss artifact,
  recording, rules, and champion through their real repository paths.
- **Expected:** every identity matches; the four exact decision states,
  three-step costs, first-correction continuations, and terminal target costs
  reproduce.
- **Failure meaning:** stop; `UNVERIFIED`.
- **Evidence:** qualification and raw controls.

### C2 — objective and continuation equivalence

- **Role/profile:** reference/objective equivalence, `simulation-policy`.
- **Subject/seam:** owner and champion arms within each decision cell.
- **Expected:** shared decision state, target, move budget, RNG prefix, unchanged
  champion continuation, and target-stop semantics; only the decision chain
  differs.
- **Failure meaning:** affected cell and panel are `UNVERIFIED`.
- **Evidence:** raw invariant records.

### C3 — lineage-transfer known-good

- **Role/profile:** positive control, `mutation-qualification`.
- **Subject/seam:** the public lineage tracker on a disposable real-engine
  sequence where a decision survivor is later consumed as a non-final tile.
- **Expected:** lineage transfers to the later chain's final survivor and
  retains the correct coordinate and summed value after gravity.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification control and focused test.

### C4 — unrelated-chain known-negative

- **Role/profile:** negative control, `mutation-qualification`.
- **Subject/seam:** the same tracker on a selected chain that does not contain
  the lineage carrier.
- **Expected:** it reports no lineage use and keeps the original carrier.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification control and focused test.

### C5 — planted false-carrier mutation

- **Role/profile:** known-kill mutation, `mutation-qualification`.
- **Subject/seam:** the trace validator's claimed carrier coordinate/value.
- **Mutation:** change one observed carrier coordinate while preserving all
  other trace fields.
- **Expected:** rejection for carrier mismatch through the public validator.
- **Failure meaning:** qualification fails; no retained run.
- **Evidence:** qualification receipt with mutant presence, reachability, and
  intended rejection reason.

### C6 — restoration and persistence

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
and focused test. Before the retained lineage run:

1. all manifest paths and identities must match committed bytes;
2. C1–C6 must pass through the real public seams;
3. one coherently rehashed changed-input manifest must be rejected against an
   expected manifest identity supplied outside the manifest;
4. the committed closeout contract must pass the real closure verifier against
   disposable artifacts using its resolved contract-relative paths;
5. reportable raw and recomputation paths must be absent; and
6. at most two qualification attempts are permitted.

## Frozen identities

- Source revision: `646104174c0e9e0337ccd5910b8c12474c62f934`.
- LC-0003 four-miss raw:
  `docs/learning-cycles/LC-0003-four-miss-diagnostic-raw.json`, SHA-256
  `58a6458367295823d56b29f5e4589077161648b0e3619c6e5d6d6cca8eb3c284`,
  internal identity
  `10a05405746480e7232690115a877c6a0a431cdc7bc182f1147178444d4b23fd`.
- LC-0003 manifest:
  `docs/learning-cycles/LC-0003-three-step-target-progress-manifest.json`,
  SHA-256
  `5877e06cc51a0bac598a30d55ba63b631aaabb91ea843720d335f4127ad08d48`,
  internal identity
  `f1a001094916ac3e6220a030b2cf3e9b83be116f3cd89e48071bc54f86812a7a`.
- LC-0003 qualification/raw:
  `docs/learning-cycles/LC-0003-three-step-target-progress-raw.json`, SHA-256
  `e6f523dd72f60309351d4a2d8bd5a8d8851c43eadb44b4e3b86fa4f17394b2e2`,
  internal identity
  `e922f53063f04213c49ee7b39cb9aafbf1c3ca4531765f3dcf5b68502b50c8ae`.
- Prior diagnostic collector: `tools/diagnose-lc0003-misses.js`, SHA-256
  `2d46260aaa540bead45f19f658544a13512eaef93517ac63b4f093dd89e31cd2`.
- Recording:
  `play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json`,
  SHA-256
  `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.
- Ruleset: `solver/engine.js`, SHA-256
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Champion: `solver/bot.js`, SHA-256
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.
- Positive exact-state result: LC-0005 result SHA-256
  `19605fb32d05472abd4050301570dd8bc3852316315d5525827f7df8636b802f`.
- Negative exact-state result: LC-0006 result SHA-256
  `f8a10cfc80803940550adbdc51abd78d807c9c1eb0020f88baf123899612c77d`.

The analyzer, focused test, manifest, and closeout-contract identities are empty
until implementation. They must be committed before qualification; this
contract does not change.

## Bounds and stop rule

After qualification, replay exactly eight arms: owner and champion at each of
moves 4, 6, 9, and 11. Continue only with the unchanged champion until the
already-retained correction state and terminal outcome are identified. Persist
the raw artifact before interpretation and stop. No alternative decision,
future chain, spawn, seed, horizon, correction point, or definition may be
tried after lineage outcomes are visible.

## Interpretation boundary

The result may state whether the original decision survivor actually
contributed to each correction-producing chain and describe its exact replayed
trajectory. It may not claim that one-tile lineage is the full strategy, that
the four opened cases generalize, or that the observation should become a
metric or champion rule.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, prior experiment, or prior learning
cycle artifact.
