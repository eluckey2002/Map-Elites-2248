# 2248 Challenge Evidence Ledger

## Read this first

Use this ledger to find the project's current accepted facts, experimental results, decisions, hypotheses, and open questions. Read the current snapshot first, then follow the cited evidence for any claim that affects game rules, solver behavior, or a proof conclusion. Update the relevant registry after new evidence is verified.

The ledger is the authority for a record's current standing. It is not the authority for the underlying claim. Source code, tests, frozen machine-readable receipts, replay verifiers, and immutable run records remain the evidence. Summary documents, including `HANDOFF.md`, provide navigation and historical context only. An uncited claim or unaccepted artifact is a lead, not project knowledge.

## Current snapshot

As of 2026-08-11, the frozen Level 26 seed-0 proof remains numerically unresolved: the best accepted score is a replayed lower bound of **12,336**, the proven **326,390** upper bound is non-decisive, and both 13,000 reachability and the exact 32-move maximum are unknown. The frozen input identity is `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`. (`solver/tests/exact-score.test.js:77-85`; `.orch/runs/level26-certified-score-2026-08-10/worklog.md:60-69,111-120`)

The exact move-one maximum is **430**, but this does not identify the first move that maximizes the 32-move total. Threshold checks above 12,336 returned `UNKNOWN`; they rule out no score. (`.orch/tickets/level26-move1-envelope-2026-08-11.md:57-69,105-111`; `solver/hinted-cp-sat/frozen-run.json:1-35,2375-2412`)

That proof track is **parked** as of 2026-08-11 (`DECISION-0002`), and active work has moved to level tuning. Calibration across all 50 levels shows Level 26 was never the outlier it was treated as: its target is the *lowest* multiple of achievable score of any level from 19 to 50, while the current bot clears no level at all from 17 onward and demand rises to roughly six times achievable score by level 49 (`RESULT-0005`). Parking decides nothing about 13,000; `QUESTION-0001` and `QUESTION-0002` remain open. (`solver/target-calibration.js`)

As of 2026-08-12 the level curve has been retuned and every level is winnable: no level sits below a 5% bot win rate, against 34 levels at 0% before (`RESULT-0008`). Targets are now a measured share of each level's achievable score, and tile scale doubles once per ten-level chapter (`DECISION-0003`). Two rules that were previously undocumented now carry records: only a chain sum equal to the tile scale times a power of two can ever be matched again, and the accumulation of sums that fall off that lattice *is* the board lockout (`FACT-0006`); and a uniform integer tile scale is an exact isomorphism, multiplying every score by the same factor while play is unchanged (`FACT-0007`). `FACT-0003` and `FACT-0004` are superseded by `CORRECTION-0001` and `CORRECTION-0002`. The frozen Level 26 seed-0 study is pinned to its original scale-1 board and 13,000 target and is unaffected.

As of 2026-08-30, the owner has promoted the target-aware immediate-finish policy as the current engineering champion at main commit `b82a9b6` (`DECISION-0004`). The decision uses `RESULT-0018` at its accepted bounded heuristic standing; it does not turn the observation into a universal proof or rewrite historical MAP, Universe Map, level, target, receipt, or authoring evidence.

As of 2026-09-02, one identity-bound owner pilot has an exact replay and an explicit `variant/repair` disposition (`RESULT-0025`, `DECISION-0005`). A retained failed study report, `RESULT-0023`, exposed a false-PASS control and remains lineage rather than an admitted ledger result. The question was then repeated on fresh seeds with a challenged outcome-only control and downstream receipt consumption (`RESULT-0024`). The repaired run is entitled evidence, but its empirical verdict is **`INCONCLUSIVE`**: these four policies remained behaviorally distinct yet did not show a stable, predeclared five-point difference in response to the exact one-stone/two-stone contrast. More seeds on that same contrast are not the active next step.

As of 2026-09-02, the frozen handmade exact-sum policy has one admissible fresh confirmation (`RESULT-0026`). It saved **0.68 moves/game** on average over the registered 225 pairs, but converted six reference wins into losses and therefore received the predeclared empirical verdict **`FALSIFIED`**. The policy is not supported for promotion. Its qualified gate passed a real subject, failed both a wrong-outcome twin and a covered-identity twin, and downstream admission consumed the resulting Challenge Receipt.

As of 2026-09-03, level authoring uses the frozen `calib-1` evaluator rather than the mutable live bot (`RESULT-0027`). The active gen-0014 authoring candidate reproducibly derives a 102,000 target (admitted as receipt contents, not as a difficulty measurement), while the shipped 101,000 Level 53 board remains unchanged and replayable from the candidate archive. This freezes the measuring instrument; it does not ship the new candidate or establish human difficulty.

Two candidate remedies were priced before that retune and neither rescues the late levels on its own. Enriching the spawn pool is the wrong lever — a 76% increase in spawned value buys 13% more score (`RESULT-0006`). Enlarging the move budget works in the mid game and saturates in the late game, where the board reaches a terminal state before extra moves can be spent (`RESULT-0007`). Levels past roughly 31 are short of their targets by two to four times with no parameter fix available, so their targets are the thing that has to move.

Repository baseline for this documentation run is `main` at `10a849d5336bdda89d2d3f5ed1f1ca87e536811d`, with pre-existing dirty work preserved. Recheck with `git status --short --branch` and `git log -1 --format='%H %s'`. (`.orch/runs/game-evidence-ledger-2026-08-11/worklog.md`, **State**)

## Authority and navigation

Apply this order when sources disagree:

1. Inspect the primary repository evidence named by the record. Prefer a path plus symbol, frozen identity or hash, and a reproducible verification command.
2. Use the record's `status`, `proof_class`, `scope`, and `as_of` fields to determine what the evidence establishes now.
3. Follow correction and supersession links before relying on an older record.
4. Use snapshots and handoffs to locate evidence, never to overrule it.

The ledger preserves distinctions that matter to this project. The integrated proof history in `.orch/runs/level26-certified-score-2026-08-10/worklog.md` separates accepted, suspended, failed, lower-bound, upper-bound, and non-decisive outcomes. `HANDOFF.md` demonstrates explicit correction of a prior feasibility inference. Both are navigation records; cite their underlying artifacts when a factual claim depends on them.

## Record types

Keep each entry in exactly one registry.

| Type | Registry job |
| --- | --- |
| `fact` | Record a verified rule, configuration, identity, or reproducible state. |
| `result` | Record an experiment or proof outcome at its exact scope and proof class. |
| `decision` | Record an owner or project choice, its rationale, and its effective scope. |
| `hypothesis` | Record a testable explanation or prediction. It remains non-factual even when well motivated. |
| `question` | Record an unresolved question and the evidence boundary that keeps it open. |
| `correction` | Replace or narrow an earlier entry without erasing it. |

Assign a stable ID when an entry is created: `FACT-NNNN`, `RESULT-NNNN`, `DECISION-NNNN`, `HYPOTHESIS-NNNN`, `QUESTION-NNNN`, or `CORRECTION-NNNN`. Never renumber, recycle, or silently repurpose an ID.

## Status vocabulary

`status` describes the standing of the record, not the strength of its proof.

| Status | Meaning |
| --- | --- |
| `accepted` | Admitted to its named registry at the stated type, scope, and proof class. |
| `provisional` | Retained as an unaccepted lead pending verification or review. |
| `open` | An unresolved question with no decisive answer recorded. |
| `superseded` | Replaced by a linked correction or newer record. The claim itself no longer holds. |
| `narrowed` | A linked correction fixes the record's reasoning, scope, or explanation while its measurements and conclusion stand. Cite the record and its correction together. |
| `stale` | Time-sensitive and no longer current without re-verification. |
| `rejected` | Considered but not admitted or no longer adopted; retain the reason and evidence. |

Acceptance never changes a record's type. An accepted hypothesis is still a hypothesis. An accepted bounded run that returned `UNKNOWN` is still non-decisive.

## Verification and proof classes

Use the narrowest class the evidence supports:

| `proof_class` | What it establishes |
| --- | --- |
| `direct_source` | A rule, configuration, identity, or state is present in cited primary evidence. |
| `exact_result` | The stated value is exact within the recorded scope. |
| `replayed_lower_bound` | A cited witness replays to the stated value; no higher-score claim follows. |
| `proven_upper_bound` | A cited admissible proof caps the stated scope; it is not a witness or prediction. |
| `heuristic_observation` | A named policy, sample, or incomplete search produced the observation; no policy-independent bound follows. |
| `UNKNOWN` | A bounded decision attempt returned no answer; it excludes nothing. |
| `unresolved` | Available evidence does not decide the question. |
| `owner_decision` | The entry records an explicit project choice rather than an empirical proof. |
| `hypothesis` | The statement is proposed for testing and is not factual evidence. |

Record decisiveness separately in the statement or scope. A valid upper bound above a target can be accepted and still non-decisive. A failed or timed-out search cannot become an upper bound. A heuristic miss cannot establish impossibility.

## Evidence and freshness rules

Every accepted `fact` or `result` must cite primary repository evidence. Give enough identity to survive line drift: path and symbol, receipt path and SHA-256, immutable ticket or run identity, or a reproducible command with the expected observation. A summary path alone is insufficient.

Set `as_of` and `reverify` for checkout-sensitive or time-sensitive claims. If re-verification fails or is not performed after the stated boundary, mark the entry `stale`; do not rewrite its historical statement. Keep invalid, incomplete, diagnostic, and `UNKNOWN` evidence distinct from accepted proof results.

## Append-only correction

Preserve the history of what the project believed and why. To correct an entry:

1. Add a new `correction` record with its own ID, date, scope, evidence, and replacement statement.
2. Set `supersedes` on the correction and `superseded_by` on the earlier entry.
3. Change the earlier entry's status to `superseded`; retain its original statement, evidence, and dates.
4. Update the current snapshot and any affected registry links.

Never delete a receipt, erase a challenged claim, or edit an old statement so that the history appears to have always been correct. If the replacement lacks support, record the gap as an open question and leave the earlier entry's standing unchanged.

## Entry template

```yaml
- id: TYPE-NNNN
  type: fact | result | decision | hypothesis | question | correction
  status: accepted | provisional | open | superseded | stale | rejected
  scope: <level, seed, ruleset, horizon, policy, checkout, or decision scope>
  statement: <one claim or question>
  evidence:
    - <primary path plus symbol, frozen identity/hash, or reproducible command>
  proof_class: direct_source | exact_result | replayed_lower_bound | proven_upper_bound | heuristic_observation | UNKNOWN | unresolved | owner_decision | hypothesis
  as_of: YYYY-MM-DD | not_time_sensitive
  reverify: <command and expected observation, or not_applicable>
  updated: YYYY-MM-DD
  supersedes: []
  superseded_by: []
  notes: <optional implication, rationale, or explicit evidence gap>
```

## Verified-fact registry

### FACT-0001 — Chain legality

- **type:** fact
- **status:** accepted
- **scope:** shipped game rules
- **statement:** Tiles connect by king-move adjacency. The first extension must equal the starting tile. Later extensions may equal or double the preceding tile. A tile cannot be reused, and a valid chain must meet the level's minimum length.
- **evidence:** `src/game.js`, `Game.handleMove` at lines 277-300 and `Game.isAdjacent`, `Game.canExtendChain`, and `Game.isValidChain` at lines 319-348; parity coverage in `solver/tests/engine.test.js:53-79`.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-11
- **reverify:** Run `node --test solver/tests/engine.test.js`; expect all tests to pass, then inspect the cited symbols.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### FACT-0002 — Score and merge transition

- **type:** fact
- **status:** accepted
- **scope:** shipped game rules
- **statement:** A legal chain scores `floor(chain sum × length multiplier)`. Multipliers are 1 for fewer than 3 tiles, 1.5 for 3-4, 2 for 5-6, 3 for 7-8, and 5 for 9 or more. The final selected tile survives with the chain sum; the other selected tiles are removed; one move is spent.
- **evidence:** `src/game.js`, `Game.calculateChainValue`, `Game.getChainMultiplier`, and `Game.executeChain` at lines 350-410; headless parity surface `solver/engine.js:77-113`; tests `solver/tests/engine.test.js:81-132`.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-11
- **reverify:** Run `node --test solver/tests/engine.test.js`; expect all tests to pass, then inspect the cited symbols.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### FACT-0003 — Gravity, persistence, and spawn order

- **type:** fact
- **status:** superseded
- **scope:** blocker-free Level 26 transition
- **statement:** Unselected tiles persist. After a length-`L` merge, gravity acts by column and exactly `L - 1` empty cells are refilled in column-major order. Refill values are 2, 4, or 8 with probabilities 0.6, 0.3, and 0.1. The merge conserves board value; only refills add value.
- **evidence:** `src/game.js`, `Game.applyGravity` and `Game.spawnNewTiles` at lines 416-470; `solver/engine.js:115-151`; parity tests `solver/tests/engine.test.js:134-182`; concrete conservation replay in `.orch/tickets/level26-move1-envelope-2026-08-11.md:65-80`.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-11
- **reverify:** Run `node --test solver/tests/engine.test.js solver/tests/exact-score.test.js`; expect all tests to pass, then inspect the cited symbols.
- **updated:** 2026-08-12
- **supersedes:** []
- **superseded_by:** [CORRECTION-0001]

### FACT-0004 — Level 26 configuration

- **type:** fact
- **status:** superseded
- **scope:** shipped Level 26
- **statement:** Level 26 has a 5×8 grid, no blockers, a minimum chain length of 4, 32 moves, and a 13,000-point target.
- **evidence:** `src/game.js:63-65`, `LEVELS` entry for level 26.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-11
- **reverify:** Inspect the exported `LEVELS` entry for level 26; expect target 13000, moves 32, minChain 4, gridW 5, gridH 8, and no blockers.
- **updated:** 2026-08-12
- **supersedes:** []
- **superseded_by:** [CORRECTION-0002]

### FACT-0005 — Frozen seed-0 input

- **type:** fact
- **status:** accepted
- **scope:** Level 26, seed 0
- **statement:** The deterministic initial board totals 128: twenty-four 2s, twelve 4s, and four 8s. The initial values plus frozen spawn stream hash to `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
- **evidence:** starting board and counts in `.orch/tickets/level26-move1-envelope-2026-08-11.md:40-55`; hash oracle in `solver/tests/exact-score.test.js:77-85`; seedable construction in `solver/engine.js:1-59`.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-11
- **reverify:** Run `node --test solver/tests/exact-score.test.js`; expect the durable frozen-hash test to pass.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### FACT-0006 — The mergeable-sum lattice and what a lockout is

- **type:** fact
- **status:** accepted
- **scope:** shipped game rules, all levels
- **statement:** A merge leaves exactly one tile behind, valued at the chain's sum. Spawns are the level's tile scale times 2, 4, or 8, and every chain extension is equal-or-double, so a sum lands back in the matchable lattice only when it equals the tile scale times a power of two. Any other sum is a tile nothing can ever match again. One such tile can accrue per move and they never leave, so they accumulate until no legal chain remains. That accumulation *is* the "no valid moves" lockout; it is a property of the scoring rule, not a coding defect.
- **evidence:** `solver/engine.js`, `isMergeableSum` and its use in `buildGreedyChain`; the level-26 instrumentation recorded at that symbol (5x8 grid, 32 moves, 31 of 40 cells holding unmatchable sums such as 78, 46, 34 at termination); lockout rates per level reported by `node solver/verify-loop.js`.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-12
- **reverify:** Inspect `isMergeableSum` and `buildGreedyChain` in `solver/engine.js`; run `node solver/verify-loop.js` and expect the lockout-rate check to report a nonzero but bounded rate on the late levels.
- **updated:** 2026-08-12
- **supersedes:** []
- **superseded_by:** []
- **notes:** This is the mechanism behind the original Level 26 failure and behind the whole score-pace ceiling. It also bounds any future change to the spawn pool: more distinct spawn values means more sums fall off the lattice, so widening the pool trades matchability for value. See `BL-0003` and `RESULT-0006`.

### FACT-0007 — Uniform integer tile scaling is an exact isomorphism

- **type:** fact
- **status:** accepted
- **scope:** levels 1, 15, 26, 35, 50 at scales 2, 3, 5, 6, 7, 11, 13, 16, seeds 0-3, reference bot at `solver/bot.js`
- **statement:** Multiplying every tile value on a level by a positive integer `k` multiplies the final score by exactly `k` and leaves play otherwise identical: same move count, same termination reason. Chain legality is equal-or-double and merges sum, and both relations are preserved by a uniform scale; stone blockers carry value 0, which scaling leaves unchanged. Verified 160 of 160 checks over the stated scope.
- **evidence:** `solver/game-tester.js`, `verifyScaleInvariance`, which compares score, move count, and end reason against `score x k` for each case and refuses to emit derived numbers if any case fails.
- **proof_class:** `exact_result`
- **as_of:** 2026-08-12
- **reverify:** Run `node solver/game-tester.js --seeds 20`; expect the header line `PASS - 60/60 checks: score scales exactly, play is identical.`
- **updated:** 2026-08-12
- **supersedes:** []
- **superseded_by:** []
- **notes:** Exactness holds only after two scale-dependent constants in the reference bot were corrected on 2026-08-12: its turnover bonus was a fixed 40 points per emptied cell while every other ranking term is in game points, and `isMergeableSum` tested for a power of two rather than for `k` times a power of two. Both are inert at scale 1, so no result recorded before this date changes. The structural argument generalises beyond the tested scope, but only the stated scope is verified. This fact is what permits a target to be derived by multiplication rather than re-measured per scale.

## Result registry

### RESULT-0001 — Accepted 12,336 score

- **type:** result
- **status:** accepted
- **scope:** frozen Level 26 seed 0, 32 moves
- **statement:** A 32-move witness replays to 12,336 at spawn cursor 520. This is a **replayed lower bound**, 664 short of 13,000. The search miss is not an upper bound and does not decide reachability.
- **evidence:** `solver/target-witness-search/frozen-run.json:1-24,106-113`; receipt SHA-256 `4e47c05ed42cfd978e85591913ae2062c10525d003ece73e6b2feeef0e12094e`; integration at `.orch/runs/level26-certified-score-2026-08-10/worklog.md:111-120`.
- **proof_class:** `replayed_lower_bound`
- **as_of:** 2026-08-11
- **reverify:** Run `node solver/target-witness-search/verify.js solver/target-witness-search/frozen-run.json`; expect `PASS`, score 12336, moves 32, cursor 520, and `targetReached: false`.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### RESULT-0002 — Mass/cursor upper bound

- **type:** result
- **status:** accepted
- **scope:** frozen Level 26 seed 0, 32 moves
- **statement:** Complete enumeration of the mass/cursor relaxation proves a **326,390 upper bound**. It is a sound proven upper bound, not a predicted score or witness. Because 326,390 is above 13,000, it does not decide the target.
- **evidence:** relaxation and complete-search contract in `solver/upper-bound.js:15-109`; frozen invocation at lines 112-128; accepted integration and counts in `.orch/runs/level26-certified-score-2026-08-10/worklog.md:60-69`.
- **proof_class:** `proven_upper_bound`
- **as_of:** 2026-08-11
- **reverify:** Run `node solver/upper-bound.js`; expect `complete: true`, score 326390, `targetComparison: "non-decisive"`, and the frozen input identity.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### RESULT-0003 — Exact move-one envelope

- **type:** result
- **status:** accepted
- **scope:** frozen Level 26 seed 0, move one only
- **statement:** Complete position-aware enumeration finds 1,868,975 physical first moves and an **exact move-one maximum of 430**. Three actions attain it: one length-27 chain and two length-28 chains, each with sum 86 and multiplier 5.
- **evidence:** Complete position-aware enumerator in `solver/exact-score.js`, `enumerateLegalChains` at lines 25-106; frozen Level 26 construction in `solver/engine.js`, `makeRng` and `createLevelState`; accepted independent replay in `.orch/tickets/level26-move1-envelope-2026-08-11.md:29-36,57-69`; small-fixture invariants in `solver/tests/exact-score.test.js:31-68`.
- **proof_class:** `exact_result`
- **as_of:** 2026-08-11
- **reverify:** Run `node -e 'const {LEVELS}=require("./src/game"); const {makeRng,createLevelState,chainMultiplier}=require("./solver/engine"); const {enumerateLegalChains}=require("./solver/exact-score"); const level=LEVELS.find(({level})=>level===26); const actions=enumerateLegalChains(createLevelState(level,makeRng(0))); let maxScore=-Infinity,maximizers=[]; for(const chain of actions){const sum=chain.reduce((n,t)=>n+t.value,0); const score=Math.floor(sum*chainMultiplier(chain.length)); if(score>maxScore){maxScore=score;maximizers=[];} if(score===maxScore)maximizers.push({length:chain.length,sum});} console.log(JSON.stringify({actions:actions.length,maxScore,maximizers}));'`; expect `{"actions":1868975,"maxScore":430,"maximizers":[{"length":28,"sum":86},{"length":27,"sum":86},{"length":28,"sum":86}]}`.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### RESULT-0004 — Higher hinted thresholds remained unknown

- **type:** result
- **status:** accepted
- **scope:** frozen Level 26 seed 0, bounded CP-SAT reachability checks
- **statement:** Thresholds 12,400, 12,600, 12,800, and 13,000 are `UNKNOWN` at their bounded runs. These outcomes prove no upper bound and rule out no score.
- **evidence:** `solver/hinted-cp-sat/frozen-run.json:1-35,36-75,2375-2412`; integration at `.orch/runs/level26-certified-score-2026-08-10/worklog.md:137-152`; receipt SHA-256 `5c076a3bbb8b58fc4d1f408b1b35b72f168194cb2101ad0bc977733cb8402b24`.
- **proof_class:** `UNKNOWN`
- **as_of:** 2026-08-11
- **reverify:** Run `node solver/hinted-cp-sat/verify-result.js solver/hinted-cp-sat/frozen-run.json`; expect `PASS` and `UNKNOWN` at 12400, 12600, 12800, and 13000.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### RESULT-0005 — Level 26 is not a tuning outlier; the whole back half is unbeaten

- **type:** result
- **status:** accepted
- **scope:** all 50 shipped levels, current `solver/bot.js` policy, 200 seeds per level
- **statement:** Against the shipped targets, the current bot wins every level through 14, wins none from level 17 onward, and never once reaches a target between levels 17 and 50. Expressing each target as a multiple of the bot's median achievable score, Level 26 sits at **1.66** — the *lowest* demand of any level from 19 to 50, and below levels 24 (2.32), 28 (2.18), 29 (2.35), 30 (2.39), and 31 (2.22). Demand climbs to 6.24 by level 49. Targets rise in fixed 500-point steps while achievable score stays flat or declines as move budgets shrink, blockers accumulate, and the grid narrows from 5x8 to 5x7 at level 31. This is a heuristic observation about one policy; it bounds no optimal player.
- **evidence:** `solver/target-calibration.js` (full-budget play with the target raised out of reach; `chooseMove` never reads `targetScore`, so removing the target does not change play); consistent with the 500-seed Level 26 sample recorded under `HANDOFF.md`, **Synopsis** (median 7,842, max 11,370).
- **proof_class:** `heuristic_observation`
- **as_of:** 2026-08-11
- **reverify:** Run `node solver/target-calibration.js 200`; expect Level 26 demand near 1.66, zero bot wins from level 17 onward, and demand rising monotonically in trend toward roughly 6 by level 49.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []
- **notes:** Level 26 became the proof subject because it was studied first, not because it was the worst-tuned level. Thirty-four levels share its condition.

### RESULT-0006 — Spawning 16s does not lift the ceiling

- **type:** result
- **status:** accepted
- **scope:** levels 11, 20, 26, 30, 40, 45, 50; current `solver/bot.js` policy; 200 seeds per level per variant
- **statement:** Adding 16 to the refill pool was tested as a remedy for the recorded "hole at 16" and **fails as a fix**. Raising mean spawned value by 50% (16 at 10%) lifts Level 26's median from 7,832 to 8,416, about 7.5%. Raising it 76% (16 and 32) reaches 8,856, about 13%. Response is strongly sublinear, so input value is not the binding constraint; re-chaining of value already on the board is. Level 50 rises from 4,398 to 4,982 against a 25,000 target. This tests the remedy, not the diagnosis: the recorded value-conservation and recycling analysis stands.
- **evidence:** `solver/spawn-experiment.js`; its baseline variant reproduces `solver/target-calibration.js` exactly (level 11 → 6,832; level 26 → 7,832 at 200 seeds), which is the correctness check on its replicated spawn step; original diagnosis in `solver/README.md`, **The score-pace ceiling, quantified**, iteration 2.
- **proof_class:** `heuristic_observation`
- **as_of:** 2026-08-11
- **reverify:** Run `node solver/spawn-experiment.js 200`; expect the baseline column to match `target-calibration.js` and every variant to leave levels 20-50 at a 0% win rate.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []
- **notes:** `src/game.js:607-611` already seeds the initial board with 16s while `src/game.js:460-463` omits them from refills. That asymmetry is real, but closing it does not make the targets reachable.

### RESULT-0007 — More moves rescue the mid levels and saturate on the late ones

- **type:** result
- **status:** accepted
- **scope:** levels 26, 40, 50; current `solver/bot.js` policy; 200 seeds per level per budget
- **statement:** Scaling the move budget is the effective lever in the mid game and dies in the late game. Level 26 goes 7,832 → 11,078 → **13,443** → 14,888 at 1x, 1.5x, 2x, and 3x its 32 moves, so doubling moves clears its 13,000 target. Level 40 saturates near 10,000 against a 20,000 target, and Level 50 returns an identical 6,072 at both 2x and 3x against a 25,000 target — the board reaches a terminal state before the extra moves can be spent. No move budget makes the late targets reachable.
- **evidence:** `solver/move-budget.js`; shipped budgets and targets in `src/game.js`, `LEVELS`.
- **proof_class:** `heuristic_observation`
- **as_of:** 2026-08-11
- **reverify:** Run `node solver/move-budget.js`; expect Level 26 above 13,000 at 2x and Level 50 identical at 2x and 3x.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []
- **notes:** Identical scores at 2x and 3x are the signature of a terminal board, not of a scoring plateau.

### RESULT-0008 — Every level is winnable after the demand-based retune

- **type:** result
- **status:** accepted
- **scope:** all 50 shipped levels, reference bot at `solver/bot.js`, 100 seeds per level from seed 100000
- **statement:** With targets and tile scales set by `DECISION-0003`, no level sits below a 5% bot win rate. Win rate ranges from 37% to 100% across the 50 levels and trends downward with level number. Before the retune, 34 of 50 levels were at 0%. Seeds 100000-100099 are disjoint from seeds 0-149, on which the targets were fitted, so this is not the measurement that set them. Board lockouts persist at a low rate on the late levels, up to roughly 5% at level 50.
- **evidence:** `node solver/verify-loop.js` (60 seeds from 100000, sampled levels) exits 0 with all seven checks passing; per-level policy table reproducible with `node solver/game-tester.js --seeds 150 --policy powers2 --detail`.
- **proof_class:** `heuristic_observation`
- **as_of:** 2026-08-12
- **reverify:** Run `node solver/verify-loop.js`; expect `RESULT: PASS` and exit code 0.
- **updated:** 2026-08-12
- **supersedes:** []
- **superseded_by:** []
- **notes:** Policy-dependent and no bound follows. The reference bot understates a skilled player by an unquantified margin, so these win rates are floors on human success rather than estimates of it. `RESULT-0005`'s finding that the back half was unbeatable is superseded in practice by this retune but is retained as the measurement that motivated it.

### RESULT-0009 — Level 51 shipped: the first level admitted through the authoring tracer

- **type:** result
- **status:** accepted
- **scope:** new shipped Level 51 (`src/game.js`, `LEVELS`), authoring tracer `authoring-tracer` / run `level-authoring-tracer-2026-08-12`
- **statement:** Candidate "level-51-split-channel" (5×7 grid, min chain 4, 24 moves, tile scale 32, no blockers) is now shipped as Level 51, continuing the chapter tile-scale ladder (16→32). Its target, 124,000, is 70% of the measured achievable score (300-seed disjoint holdout, seeds 100000-100299: 297 wins, 0 lockouts, 0 bomb failures), per `DECISION-0003`'s methodology. Unlike every other shipped level, this one also has direct human evidence: three real playthroughs of the same seed were played, recorded, and independently replay-verified against `solver/engine.js` — a loss under a since-fixed input bug (24 moves, 59,584), and two different winning strategies once input was fixed (12 moves/127,040 and 14 moves/130,496). The owner's acceptance was explicitly informed by the tension between those two wins, not just winnability.
- **evidence:** ticket `.orch/tickets/level-authoring-tracer-2026-08-12/authoring-tracer.md` (status `complete`, all six ACs `PASS`); replay verification `.orch/audits/recording-replay-verification-2026-08-17/finding.md` and `verdict.md` (independent re-derivation); worklog `.orch/runs/level-authoring-tracer-2026-08-12/worklog.md`, Iterations 5-8; `node solver/verify-loop.js` and `node --test solver/tests/*.test.js` both pass with 51 levels present.
- **proof_class:** `owner_decision` for shipping itself; `heuristic_observation` for the underlying win-rate measurement; the three human sessions are `direct_source` (replayed, not simulated).
- **as_of:** 2026-08-17
- **reverify:** `node solver/verify-loop.js` (expect `RESULT: PASS`, `51/51` on the target/tileScale check); `node --test solver/tests/*.test.js` (expect 73 pass).
- **updated:** 2026-08-17
- **supersedes:** []
- **superseded_by:** []
- **notes:** This is the first level whose target was never hand-picked at all — BL-0004's stated milestone exit condition, for one level. Batch generation of further candidates and any additional shipping remain open, separate work.

### RESULT-0010 — The bot's candidate cap was discarding real options on two-thirds of moves

- **type:** result
- **status:** narrowed
- **scope:** `solver/bot.js`, `CANDIDATE_LIMIT` (12 -> 24); reference-bot strength only, no level, target, or rule changed
- **statement:** The lookahead's pre-filter kept only the 12 highest-immediate-point chains, ranked by the very criterion the lookahead exists to overrule. Raising the cap to 24 is worth **+1.10%** median score against the previous bot (geometric mean of per-game log-ratios, 51 levels x 150 unseen seeds = 7,650 games per width, paired per (level, seed), standard error clustered by level, n = 51, **t = 4.1**). The gain saturates exactly at 24: widths 26 and 32 produce bit-identical play, because boards offer a median of 15 legal chains and at most 30, so lookahead work plateaus at 1.37x no matter how high the cap goes. The old cap bound on **65.5%** of real in-game decisions. The prior setting rested on a misreading of correct data: the original level-26 / 50-seed measurement recorded 12 -> 7584 and 24 -> 7678 and called it "flat past ~12", but that is a 1.2% gain that 50 seeds of a single level could not resolve, so a real effect was filed as noise. Effect on the shipped curve is small and does not require re-calibration: median achievable score rises **1.25%** on average across all 51 levels and win rate at the shipped target rises **0.6 points**, the largest single move being level 17 at 97% -> 99%.
- **evidence:** `solver/policy-search.js`, `solver/policy-eval.js`, `solver/policy-ablation.js` (search, paired estimator, arm comparison); `.orch/policy-search-01.json` and `.orch/policy-ablation-01.json`; `node --test solver/tests/*.test.js` 79 pass, including `solver/tests/policy-eval.test.js` covering the clustered estimator; `node solver/verify-loop.js` -> `RESULT: PASS` with the new cap.
- **proof_class:** `heuristic_observation` — a measured improvement in a heuristic player, not a bound on achievable score. It moves no proof standing for Level 26 or any other level.
- **as_of:** 2026-08-19
- **reverify:** `node --test solver/tests/*.test.js` (expect 79 pass); `node solver/verify-loop.js` (expect `RESULT: PASS`).
- **updated:** 2026-08-19
- **supersedes:** []
- **superseded_by:** []
- **notes:** Two corrections are recorded here deliberately, because both were believed and reported before being checked. (1) The searched policy's weight changes — `wRoll` 0.813, `wPlace` 1.432, `turnover` 44.655 — measured +1.31% at fixed width under an arithmetic mean of per-cell ratios, and **+0.10% (t 0.4)** under the log-ratio estimator. They are not adopted; essentially the entire gain is the width. (2) The same estimator change cut the headline holdout lift from +3.30% to +1.68%, because a mean of ratios was being carried by a right tail of games where the new policy scored several times the reference. Clustering by level inflated the standard error only 1.5x, well below the 3.7x that the seeds-per-level count would suggest, because the policy improves most levels by a similar amount rather than winning big on a few. The reference bot remains a weak proxy for a skilled player; 1.1% does not change that, and the open note on unquantified human margin stands.
- **appended 2026-08-20:** The mechanism named in the statement above — "boards offer a median of 15 legal chains and at most 30" — is wrong, and `CORRECTION-0003` records why. Boards offer hundreds of thousands; 15 to 30 is what the candidate *generator* returns. Every measurement in this record stands and the saturation was re-confirmed under a changed generator, so the status stays `accepted`; only the explanation is narrowed. Read this record together with `CORRECTION-0003` and `RESULT-0011`.

### RESULT-0011 — The chain walk stranded tiles it could have used; a tie-break recovers 5%

- **type:** result
- **status:** accepted
- **scope:** `solver/engine.js` (`buildGreedyChain`, `findGreedyChains`), `solver/bot.js` `CHAIN_TIE_BREAK`; reference-bot strength only, no level, target, or rule changed
- **statement:** The bot's move generator walks one path from each start tile, taking the lowest-value legal neighbour and never backtracking, so it can wall itself off from tiles it could still have reached — it finds 11-tile chains on boards where 19-tile chains exist. Because points scale with the chain sum, that is close to half the points available: measured against full enumeration of every legal chain, the walk reaches **0.563** of the best chain the bot would accept (highest-scoring chain whose sum stays on the mergeable lattice, `FACT-0006`), averaged over 16 boards across six levels. Breaking ties by **Warnsdorff's rule** — among next tiles of equal value, take the one with the fewest onward moves, because a nearly cut-off tile must be used now or lost — lifts that to **0.688** and never scored below the plain walk on any board tested. In play it is worth **+5.25%** median score (geometric mean of per-game log-ratios, 51 levels x 300 unseen seeds = 15,300 games per arm, paired per (level, seed), standard error clustered by level, n = 51, **t = 15.7**), for about 1.16x the compute. 50 of 51 levels improve; the worst is level 45 at -0.5%. A 100-seed pilot on a separate disjoint seed set measured +4.87%, so the confirmation came back *larger* and the effect is not a selection artifact. It remains a tie-break: ranking on connectivity ahead of value scores **0.19**, far worse than doing nothing, because lowest-value-first is what makes the walk long in the first place.
- **evidence:** `solver/chain-coverage.js` (coverage against `enumerateLegalChains`); `solver/routing-ablation.js` and `.orch/routing-ablation-01.json` (paired outcome measurement); `solver/tests/engine.test.js` — three tests covering the stranding case, the tie-break's fix, and a negative control that fails if connectivity is made the primary rule; `node --test solver/tests/*.test.js` 82 pass; `node solver/verify-loop.js` -> `RESULT: PASS`, all seven checks.
- **proof_class:** `heuristic_observation` — a measured improvement in a heuristic player, not a bound on achievable score. It moves no proof standing for Level 26 or any other level.
- **as_of:** 2026-08-20
- **reverify:** `node --test solver/tests/*.test.js` (expect 82 pass); `node solver/routing-ablation.js` (expect roughly +5% at t > 3); `node solver/chain-coverage.js` (expect 0.563 -> 0.688); `node solver/verify-loop.js` (expect `RESULT: PASS`).
- **updated:** 2026-08-20
- **supersedes:** []
- **superseded_by:** []
- **notes:** Calibration consequence, unresolved: a target is `demand x measured achievable score` (`DECISION-0003`), so a level authored after this change is pitched about 5% higher at the same demand. Shipped levels keep the targets they were admitted with, and the curve gate passes unchanged, so nothing needs to move — but the two eras of authored target are no longer directly comparable. Candidate width is unaffected: a width-32 arm produced bit-identical play to width 24 under the new generator, so `RESULT-0010`'s saturation still holds, though its stated reason does not — see `CORRECTION-0003`. On the standing note that the reference bot is a weak proxy for a skilled player: on Level 51 the bot's median moves-to-target improves from 17 to 16 across 120 seeds, and it matches the owner's recorded 12-move pace on 8 of 120 boards against 1 of 119 before. The gap narrows and does not close; the margin remains unquantified in general.

### RESULT-0012 — Level 52 shipped at the target it was admitted with, not a re-derived one

- **type:** result
- **status:** accepted
- **scope:** new shipped Level 52 (`src/game.js`, `LEVELS`); no rule, bot, or existing level changed
- **statement:** Candidate "level-52-stone-gate" (Level 51's 5x7 shape with one stone at (2,3), min chain 4, 24 moves, tile scale 32) is shipped as Level 52. Target 102,000 is 70% of the measured achievable score (median 146,688; 300-seed disjoint holdout, seeds 100000-100299: **290 wins, 0 lockouts, 0 bomb failures**), by `DECISION-0003`'s methodology. It carries human evidence: the owner played and won it at 124,864 in 15 of 24 moves, replay-verified. Both the measurement and the playtest were done before `RESULT-0011` made the reference bot about 5% stronger, and the target is **held at the value it was admitted and played with rather than re-derived**. Re-deriving would raise it to roughly 107,000 and would silently retune a level a human had already validated at 102,000. The consequence is recorded rather than hidden: measured against the current bot this level's effective demand is nearer 0.667 than 0.700, so it sits marginally easier than its stated demand implies. Direction of error is safe — the level is more winnable than its label claims, not less.
- **evidence:** candidate store and receipt `solver/candidate-levels-52.json` and `-52.receipt.json` (`targetDerivation`, `holdout`); `src/game.js` `LEVELS` entry for level 52; `node --test solver/tests/*.test.js` 82 pass; `node solver/verify-loop.js` -> `RESULT: PASS`, all seven checks with 52 levels present.
- **proof_class:** `owner_decision` for shipping and for holding the target; `heuristic_observation` for the win-rate measurement; the owner's session is `direct_source`.
- **as_of:** 2026-08-20
- **reverify:** `node solver/verify-loop.js` (expect `RESULT: PASS`, `52/52` on the target/tileScale check); `node --test solver/tests/*.test.js` (expect 82 pass).
- **updated:** 2026-08-20
- **citation-repair:** 2026-08-31. The candidate-store path above previously pointed into `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo/`, a linked worktree excluded by `.gitignore`, so the citation never resolved in any clone. Repointed to the committed copy at `solver/candidate-levels-52.json`, SHA-256 `6637108c3a067491a4ca6221e8d869a41dfc565f6095d740891c61a0e0aaaaba`, byte-identical to the worktree copy. The claim, its proof class, and its receipt are unchanged; only the pointer moved.
- **supersedes:** []
- **superseded_by:** []
- **notes:** This is the first level to land on the far side of a bot-strength change, and it makes the split named in `RESULT-0011` concrete rather than hypothetical: levels 1-52 carry targets derived against the pre-`RESULT-0011` bot, anything authored later will not. That comparability question is open and is **not** settled by this record — it is only deferred for one level, on the ground that a human-validated target should not move underneath the human who validated it. Whether to re-derive the whole curve remains an owner decision.

### RESULT-0013 — Re-searching the ranking weights over the fixed generator still establishes nothing

- **type:** result
- **status:** accepted
- **scope:** `solver/policy-search.js` run `.orch/policy-search-02.json`, 52 levels; the searched weights are **not adopted** and `DEFAULT_PARAMS` is unchanged
- **statement:** The obvious objection to `RESULT-0010`'s finding that the ranking weights are worth nothing was that the search had been ranking a crippled candidate list. `RESULT-0011` fixed the generator, so the search was re-run against it: 12 generations, 108 distinct policies screened, finalists re-scored on 250 disjoint holdout seeds across all 52 levels. **It still does not clear the bar.** Best holdout lift **+0.78% at t = 2.6**, against the project's own t > 3 threshold, and the mean generalization gap is **-0.57 points** — the finalists screened better than they held up, which is the winner's curse in its policy-search form and the reason the two-stage design exists. Two finalists that screened at +0.94% fell to +0.11% and +0.08% on unseen seeds. The conclusion of `RESULT-0010` therefore survives a fair re-test: the gains in this bot are structural, not in the weights. One narrow lead is recorded and **not** claimed as a finding: `turnover` moved from 40 to roughly 63-67 in every one of the six finalists, the only gene to move consistently. That is the term rewarding emptied cells, and a stronger preference for it is what one would expect once the walk can actually build long chains — but at t = 2.6 it is a direction, not a result.
- **evidence:** `.orch/policy-search-02.json` (config, finalists, per-level lift) and `.orch/policy-search-02.cells.json` (the full policy x level x seed score table, 108 screened policies x 480 cells plus 6 validated x 13,000 cells); `solver/policy-search.js`; `solver/policy-eval.js` for the clustered log-ratio estimator.
- **proof_class:** `heuristic_observation` — a bounded search that returned no established gain. It excludes nothing: a better-designed search, a wider genome, or a different objective could still find one.
- **as_of:** 2026-08-20
- **reverify:** `node solver/policy-search.js --out <path>`; expect a best holdout lift near 1% with t below 3, and a negative mean generalization gap.
- **updated:** 2026-08-20
- **supersedes:** []
- **superseded_by:** []
- **notes:** First run to leave its score table behind rather than six summary numbers, so the next question about these 121,000 games can be answered without replaying them. Two doors this closes and one it does not. Closed: re-running this same search shape over these same five genes, twice now, has produced nothing adoptable — a third run needs a changed genome or a changed objective to be worth the hour. Also closed: the suspicion that `RESULT-0010`'s weight finding was an artifact of the stranded candidate list. Not closed: the bot's real deficits are structural, and the largest known one is that placement is scored only one move ahead — `wPlace` asks whether the surviving tile can begin any legal chain next move, and nothing rewards surviving tiles landing equal-valued and connected to each other, which is what a mid-game harvest chain requires. No gene in this genome can express that.

### RESULT-0014 — Teaching the bot to keep its built tiles usable is worth 2.6% and removes the sampled lockouts

- **type:** result
- **status:** accepted
- **scope:** `solver/bot.js` `HARVEST_WEIGHT` / `harvestValue`; reference-bot strength only, no level, target, or rule changed
- **statement:** The owner described a strategy the bot did not play: build tiles a few doublings above the dealt ones, then chain **those** together mid game. The bot completed such a chain about **once per game** across a 24-30 move budget. The existing placement term could not express it — it asks only whether the survivor can begin *some* legal chain next move, so it is blind to which tile survived and to what sits near it. `harvestValue` scores how usable the built tile is, and is worth **+2.60%** median score (51 levels x 300 unseen seeds = 15,300 games per arm, paired per (level, seed), standard error clustered by level, **t = 9.4**), win rate 92.3% -> 93.9%. A 100-seed pilot on a separate disjoint seed set measured +1.76%, so the confirmation came back *larger* and the weight is not a selection artifact. The response is unimodal — 0.25 -> +0.80%, 0.5 -> +1.16%, 1 -> +1.67%, 2 -> +2.60%, 4 -> +1.43% — so 2 sits on a peak rather than at the edge of the swept range. **Side effect, larger than the score gain in practice:** every lockout in the curve gate's sample disappeared, from 7% at level 35 and 3% at level 50 to 0% across all eleven sampled levels, and level 50's win rate rose 42% -> 57%. Keeping built tiles mergeable is directly the opposite of the mechanism `FACT-0006` names as the cause of a dead board.
- **evidence:** `solver/bot.js` (`HARVEST_WEIGHT`, `HARVEST_KINSHIP`, `harvestValue`); `solver/tests/bot.test.js` (six tests, including that a built tile with only half-value company still counts and that the built threshold follows tile scale); `node --test solver/tests/*.test.js` 144 pass; `node solver/verify-loop.js` -> `RESULT: PASS`, all seven checks, 0% lockouts on every sampled level.
- **proof_class:** `heuristic_observation` — a measured improvement in a heuristic player. No bound on achievable score follows and no proof standing moves.
- **as_of:** 2026-08-21
- **reverify:** `node --test solver/tests/*.test.js` (expect 144 pass); `node solver/verify-loop.js` (expect `RESULT: PASS`).
- **updated:** 2026-08-21
- **supersedes:** []
- **superseded_by:** []
- **notes:** The one rule here that comes from the engine rather than from a guess: to consume a tile of value v the board needs a v or a v/2 adjacent to it, because a chain opens with an equal pair and then climbs equal-or-double. A lone 32 is therefore *not* stranded — `16, 16, 32` is legal — and an earlier version of this term that counted only equal-valued twins was wrong, because it would have pushed the bot to reach the whole way in one chain instead of building a 16 and then a 32. Overshooting is how a sum lands off the lattice. **Everything else in the term is invented**: the 1.0/0.7/0.4 kinship weights, the `1/(1+distance)` decay, matching on exact ratios only. Those are guesses about good play and they cap the bot at what was thought of, which is the standing argument for a learned evaluation rather than more hand-written terms. Adopting this exposed a defect in `solver/calibration.js`: `chooseMove` resolves `{ ...DEFAULT_PARAMS, ...params }`, so a parameter present on the live bot but absent from the frozen ruler silently takes the live value — the ruler would look frozen and not be. `calib-1` now pins `wHarvest: 0` explicitly and a test fails if the two key sets ever diverge. Existing targets are therefore unaffected by this change.

### RESULT-0015 — Keeping eight low-value chain routes raises score 13.8% and win rate 5.5 points

- **type:** result
- **status:** superseded
- **scope:** `solver/engine.js` bounded low-value-first path beam and `solver/bot.js` `pathWidth` (1 -> 8); live reference-bot strength only, no game rule, level, target, or calibration changed
- **statement:** The prior chain walk retained exactly one route from each start tile. Even after `RESULT-0011`'s degree tie-break, one early choice could wall off a much longer route before the bot's afterstate evaluator ever saw it. The new generator keeps eight partial paths, but branches **only among extensions tied at the lowest tile value**; it therefore preserves the accepted low-value-first strategy rather than becoming greedier. Width 8 was selected on 12 levels x 40 screen seeds, then evaluated exactly once on all 53 levels x 300 disjoint confirmation seeds (15,900 games per arm). Confirmation measured **+13.83%** paired score (geometric mean of per-game log-ratios, clustered by level/seed, **t = 20.6**), mean score 42,355.9 -> 48,776.9, and win rate **93.64% -> 99.18%** (+5.53 points), at **2.69x** the previous bot's compute cost. The screen estimate was +14.82%, so the reportable confirmation came back slightly smaller but remained decisive. A first implementation that also branched to doubled values was rejected before confirmation after its screen reduced score by 23.86% or more and collapsed win rate; the negative control is retained in the bot tests.
- **evidence:** `solver/multipath-ablation.js`; confirmation command `node solver/multipath-ablation.js --confirm` using screen seeds 9,000,000-9,000,039 and confirmation seeds 10,000,000-10,000,299; fixed public-seam tests in `solver/tests/bot.test.js`; failed predecessor and accepted run records under `.orch/tickets/2026-08-21-adhoc-multipath-bot/T-001.md` and `.orch/tickets/2026-08-21-adhoc-low-value-multipath/T-001.md`.
- **proof_class:** `heuristic_observation` — a measured improvement in this heuristic player, not a percentage of human strength and not a bound on achievable score.
- **as_of:** 2026-08-21
- **reverify:** Run `node solver/multipath-ablation.js --confirm`; expect width 8 selected, confirmation lift near +14% at t > 3, no win-rate fall, and roughly 2.7x cost. Run the targeted bot, engine, policy-evaluation, and calibration tests.
- **updated:** 2026-08-21
- **supersedes:** []
- **superseded_by:** [CORRECTION-0004]
- **notes:** `calib-1` pins `pathWidth: 1`, so existing level targets remain tied to the historical ruler. Future authoring can continue to use that ruler independently of the stronger live bot. The result says nothing about the owner's human margin; that comparison remains separate.

### RESULT-0016 — Preserving the old route plus bounded alternatives raises score 23.0% and win rate 5.9 points

- **type:** result
- **status:** accepted
- **scope:** corrected `solver/engine.js` bounded low-value-first path beam and `solver/bot.js` `pathWidth` (1 -> 8); live reference-bot strength only, no game rule, level, target, or calibration changed
- **statement:** `RESULT-0015`'s first beam could replace the historical one-path candidate with its alternatives. A pre-existing bot test caught one board where that hid a valuable eight-tile chain, so the corrected generator always keeps the historical route and supplements it with a beam of up to eight alternatives. It still branches only among extensions tied at the lowest tile value. With the corrected identity fixed, beam width 8 was selected on 12 levels x 40 screen seeds at **+24.32%**, then evaluated on all 53 levels x 300 confirmation seeds (15,900 games per arm). Confirmation measured **+23.00%** paired score (geometric mean of per-game log-ratios, clustered by level/seed, **t = 50.8**), mean score 42,355.9 -> 52,268.0, and win rate **93.64% -> 99.58%** (+5.94 points), at **2.68x** the one-path bot's compute cost. Targeted tests passed 74/74. The full solver suite passed 195/198; its only three failures are the already-recorded receipt-identity mismatches for `candidate-levels-52.json`, `candidate-levels-54.json`, and `candidate-levels.json`.
- **evidence:** `solver/engine.js`, `buildGreedyPathBeam`; `solver/bot.js`, `CHAIN_PATH_WIDTH`; `solver/multipath-ablation.js`; command `node solver/multipath-ablation.js --confirm` on screen seeds 9,000,000-9,000,039 and confirmation seeds 10,000,000-10,000,299; public-seam positive and negative controls in `solver/tests/bot.test.js`; durable execution record `.orch/tickets/2026-08-21-adhoc-low-value-multipath/T-001.md`.
- **proof_class:** `heuristic_observation` — a measured improvement in this heuristic player, not a percentage of human strength and not a bound on achievable score.
- **as_of:** 2026-08-21
- **reverify:** Run `node solver/multipath-ablation.js --confirm`; expect width 8 selected, confirmation lift near +23% at t > 3, no win-rate fall, and roughly 2.7x cost. Run `node --test solver/tests/bot.test.js solver/tests/engine.test.js solver/tests/policy-eval.test.js solver/tests/calibration.test.js` and the full solver suite.
- **updated:** 2026-08-21
- **supersedes:** []
- **superseded_by:** []
- **notes:** `calib-1` explicitly pins `pathWidth: 1`, so existing level targets remain tied to the historical ruler. Future authoring can use that ruler independently of the stronger live bot. The result says nothing about the owner's human margin; that comparison remains separate.

### RESULT-0017 — A bounded MAP-Elites run finds 20 distinct behavior cells without changing the champion

- **type:** result
- **status:** accepted
- **scope:** isolated `map-elites-learning` experiment at champion commit `52f500c`; 11-policy descriptor pilot, 48 archive iterations, six fixed screen cases with six seeds each, and twelve disjoint holdout cases with twelve seeds each for three representative elites; no level, target, receipt, authoring path, or champion file changed
- **statement:** The two proposed behavior descriptors are usable for this bounded learning experiment rather than collapsing to one value. The pilot's mean-chain-length range is **2.4327 tiles** (9.7917 to 12.2244), above the preregistered 0.15 minimum, and its late-score-share range is **0.1089** (0.2758 to 0.3847), above the preregistered 0.02 minimum. The deterministic 5x5 MAP-Elites archive occupies **20 of 25 cells**, spanning all five bins on both axes, and retains the best screened policy independently inside each occupied cell. Three replayable representatives expose distinct styles: `a61e8b8e23b7` at cell `4,2` (12.61 mean-chain length, 32.9% late-score share, +3.30% screen lift, **-3.57% disjoint holdout lift**); `4cbec6509c34` at `0,0` (10.13, 27.9%, -35.07%, -36.55%); and `ebeb9e326a01` at `2,4` (11.24, 37.6%, -14.91%, -11.93%). The first representative is also a concrete winner's-curse lesson: it looked 3.30% better on the cases that selected it but 3.57% worse on unseen holdout cases. This is evidence of behavior diversity and honest selection/holdout separation, **not** evidence that any discovered policy is a stronger replacement champion.
- **evidence:** `solver/map-elites-output/archive.json` SHA-256 `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`; `solver/map-elites-output/map.html` SHA-256 `c1e27d78431f64e4378c286bc6a3cb1882db131573f1aa0cbba357174a692b1a`; producer `solver/map-elites.js`; independent checker `solver/verify-map-elites.js`; public-seam tests `solver/tests/mapElites.test.js` and `solver/tests/policy-eval.test.js`; rendered browser inspection of the generated 25-cell grid; durable execution record `.orch/tickets/2026-08-22-map-elites-learning/T-001.md`.
- **proof_class:** `heuristic_observation` for the bounded archive and policy results; `direct_source` for the artifact identities, replay equality, disjoint seeds, and unchanged protected hashes. No optimality, human-strength, or complete behavior-space claim follows.
- **as_of:** 2026-08-22
- **reverify:** Run the documented fixed command in `solver/README.md`, then `node solver/verify-map-elites.js solver/map-elites-output`; expect 20 occupied cells across five chain bins and five patience bins, three exact representative replays, and unchanged champion/authoring hashes. Run the focused 83-test command recorded in ticket T-001.
- **updated:** 2026-08-22
- **supersedes:** []
- **superseded_by:** []
- **notes:** The archive axes are calibrated from the bounded pilot and may clip policies outside that pilot's observed range. The experiment explores the existing parameter seam only; it does not learn a value function, add search depth, or discover new policy structure. The full solver suite remains 193/196 because of the same three pre-existing receipt-identity failures named in `RESULT-0016`; no receipt was refreshed or weakened.

### RESULT-0018 — A target-aware finish rule extracted from human Level 51 play generalizes across all shipped levels

- **type:** result
- **status:** accepted
- **scope:** fixed experimental challenger at code identity `c68247ce390bfec8f32e5c3c6a676efc1ea012ec81da958deeb5c19d840a20a7`; one 13-level x 40-seed screen followed by one sealed 52-level x 300-seed paired holdout; champion and protected product/authoring surfaces unchanged
- **statement:** Exact comparison of the owner's two Level 51 seed-1 replays with the champion supported one narrow endgame rule: if an alternate untrimmed legal route reaches the target immediately, use it instead of preserving a merge-friendly survivor for a future move that will not occur. A challenger applying only that override, and never applying it while a bomb is present, changed Level 51 seed 1 from 17 to 13 moves. On 15,600 unseen paired games, it made **9,354 existing wins faster**, tied 6,186 existing wins, made no existing win slower, caused **zero champion-win regressions**, and converted 9 champion losses into wins. Mean all-cell saving was **1.271 moves** (median 1; conservative level/seed-clustered **t = 15.68**), and faster cases appeared on **all 52 shipped levels**. Challenger compute was 1.45x the champion's. This supports the endgame rule for reaching the current targets sooner; it does not show higher terminal score, autonomous learning, or authorize champion promotion.
- **evidence:** diagnosis `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/evidence/report.md`; holdout artifact `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/holdout.json`, identity `83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0`; independent recomputation `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/verification.json`, SHA-256 `5bdf5baa5b55672337d52379d5b43920671f5ae2e9ef4a8fd0d51063010e41e9`; report `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/report.md`.
- **proof_class:** `heuristic_observation` for generalization over the fixed unseen sample; `direct_source` for artifact identity, completeness, disjoint seeds, source hashes, and unchanged protected surfaces. Zero observed regressions is not a proof over every possible board.
- **as_of:** 2026-08-30
- **reverify:** Independently validate the screen and holdout artifact identities and recompute the frozen gate from the level-major cells; run the targeted challenger tests, MAP-Elites verifier, protected hash check, and full solver suite. Expect 15,600 unique holdout pairs, 9,354 faster both-win cells, 9 challenger-only wins, zero champion-only wins, zero slower both-win cells, all 52 levels represented among faster cases, and the same three pre-existing receipt failures.
- **updated:** 2026-08-30
- **supersedes:** []
- **superseded_by:** []
- **notes:** Terminal score averaged 970 points lower because the challenger often stopped earlier with less target overshoot. If maximizing score rather than reaching the target were the objective, this result would not support it. Promotion remains a separate owner decision. Replicated 2026-09-01 by `RESULT-0020`, which registered a protocol before running and reproduced every count here exactly; this record is unchanged by that and keeps its own standing.

### RESULT-0020 — RESULT-0018's holdout reproduces exactly under a protocol registered before the run

- **type:** result
- **status:** accepted
- **scope:** one sealed 52-level x 300-seed paired holdout, 15,600 cells, replicating `RESULT-0018`'s comparison on a clean checkout of `main` at commit `b09737b`; champion arm `chooseBaseMove`, challenger `chooseTargetAwareMove`; seven source files frozen at registration; shipped bot and protected surfaces unchanged
- **statement:** Run under a protocol committed before any game was played, the target-aware immediate-finish rule reproduces `RESULT-0018` exactly on all six predeclared counts: **9,354 existing wins made faster**, 6,186 tied, **zero made slower**, **zero champion-win regressions**, 9 champion losses converted to wins, and faster cases on **all 52 shipped levels**. Mean all-cell saving **1.271 moves**, matching to three decimals; mean terminal score **970.3 points lower**, matching the original's stated cost. The predeclared compute check **breached**: 1.965x against a declared 1.3x–1.6x band. That breach is a defect the replication exposed rather than a property of the policy — `solver/bot.js`'s promoted `chooseMove` is byte-identical to `chooseTargetAwareMove` apart from identifiers, and the challenger calls it as its fallback, so it evaluates the target-aware override twice per move; on identical plays (260 of 260) the second evaluation costs ~17% and changes nothing. This record establishes reproducibility and provenance for a claim already made; it does not extend that claim.
- **evidence:** protocol `experiments/RESULT-0020/protocol.md` registered at commit `b09737b58e30e9263bb1ccc82c605a22f5f8b8ab`, a strict ancestor of the report commit; report `experiments/RESULT-0020/report.md`; holdout artifact `.orch/runs/result-0020-target-aware-replication-2026-09-01/evidence/holdout.json`, identity `90c4dc6fffc4aab824a6ca557a201c48ca10fe35dc9edaeb077b902163610ca8`, carrying `registration.protocol = RESULT-0020` and `registration.protocolCommit = b09737b`; screen artifact `.orch/runs/result-0020-target-aware-replication-2026-09-01/evidence/screen.json`, identity `08a87042a4f663211dffa6a7c714c82885c4443531f509606c1359153d1e91e5`, diagnostic only.
- **proof_class:** `heuristic_observation` for generalization over the fixed unseen sample; `direct_source` for artifact identity, completeness, disjoint seeds, registration stamps, source hashes, and the commit ordering that makes this a pre-registration. Zero observed regressions is not a proof over every possible board.
- **as_of:** 2026-09-01
- **reverify:** From a clean checkout at `b09737b` or later, confirm the holdout artifact's `artifactIdentity` and its 15,600 level-major cells with `validateArtifact`; recompute the six counts, the 1.271 mean saving, and the compute ratio from the cells; confirm `registration.protocolCommit` is a strict ancestor of the commit adding `report.md`; run `node tools/verify-experiments.js`. Expect exact agreement with `RESULT-0018` on every move-based figure and the 1.965x compute breach.
- **updated:** 2026-09-01
- **supersedes:** []
- **superseded_by:** []
- **notes:** A replication, not a promotion. `RESULT-0018` keeps its own `proof_class` and its grandfather entry; nothing here upgrades it. The compute figure is wall-clock on a shared machine and was declared diagnostic before the run; it is reported as a breach because the protocol named a band and the run left it, not because the timing is authoritative. The challenger's doubled override is recorded here and not fixed — `solver/target-aware-challenger.js` is frozen for this record. **Fixed after this record completed**: the challenger now calls `chooseBaseMove` directly, verified play-identical on 1,040 games across all 52 levels, with a spy test pinning that it never routes through the promoted champion. That edit moves the file off its frozen hash, so this protocol correctly refuses to re-run — the record is complete and its artifact stands.

### RESULT-0021 — Structural level ranking is stable across disjoint seed samples

- **type:** result
- **status:** accepted
- **scope:** all 53 shipped levels under the current reference policy and evaluator; disjoint seed ranges 30,000,000–30,000,059 and 31,000,000–31,000,059; 60 games per level per range, 6,360 games total; terminal achievable score before target stopping; registered protocol and frozen source identities
- **statement:** Across the two predeclared 60-game samples, the 53 per-level mean scores correlate at **r = 0.99942855**. The one-way random-effects between-candidate variance component is **2,481,397,518.78**, pooled within-level seed variance is **84,459,875.41**, and between/within is **29.3796x**, yielding estimated single-seed reliability **0.967083**. Both predeclared support thresholds cleared. The same production check passed the real subject, failed a controlled twin whose sample-B candidate assignments were reversed, drove the exact production batch to selection only under the valid verdict, and invalidated on a covered evaluator identity change. Repeated human plays are therefore **not supported as necessary for seed-noise control** in candidate differentiation. This does not decide whether human qualitative play is needed. The older `r = 0.98` sentence remains provenance-inconclusive: its introducing commit changed only `HANDOFF.md`, and no original measurement artifact or seed ranges were found.
- **evidence:** protocol `experiments/RESULT-0021/protocol.md` registered at commit `e63f83c70ad1cf0725237e37f82d41491676d778`, a strict ancestor of measurement commit `0acfb6b191a3c8f3633533fa3f36893a694d4516`; report `experiments/RESULT-0021/report.md`; canonical admission receipt `experiments/RESULT-0021/admission.json`, identity `aae5beca8a054b5d495e62f3da6c9d689a41ec2c2496200ff6382f4b61518549`, binding measurement artifact identity `73dfd91b04229cfcd2c60b4482f443ea73b9fa5a865cac9d170980b724f6710e`, challenge bundle identity `c099d3a38caa989253bda46f67b6d634ec491255e54292d25b9c38000158af3d`, and challenge receipt identity `95d4552269c15c8ff8f61631c3c5c03b930071a93da59673fe77e03490d2ce86`.
- **proof_class:** `heuristic_observation` for generalization from the fixed seed samples and reference policy; `direct_source` for artifact completeness, identities, disjoint seed ranges, registered commit ordering, challenge outcomes, downstream consumption, and identity invalidation. No policy-independent score bound or claim about qualitative human judgment follows.
- **as_of:** 2026-09-01
- **reverify:** Run `node experiments/RESULT-0021/verify.js`, `node tools/verify-experiments.js`, and `node --test solver/tests/generateLevels.test.js solver/tests/levelAuthor.test.js solver/tests/seedVariance.test.js solver/tests/experiments.test.js`. Expect challenge receipt `95d45522…`, experiment gate PASS, and 43/43 focused tests. The full suite remains 280/284 with the same three stale-receipt failures and one unrelated root-worktree state failure.
- **updated:** 2026-09-01
- **supersedes:** []
- **superseded_by:** []
- **notes:** The current `r = 0.99943` is a new registered result, not evidence for the exact historical `r = 0.98`. Human repetition may still be appropriate for learning, fun, frustration, strategy discovery, or reliability of subjective judgments; this result removes only seed averaging as an independently supported requirement.

### RESULT-0024 — The repaired topology-response study is entitled but inconclusive

- **type:** result
- **status:** accepted
- **scope:** four fixed policy identities on open, one-center-stone, and two-adjacent-center-stone 4x8 layouts; 48 control seeds and 200 fresh confirmation seeds `23000000..23000199`; exactly 2,400 reportable cells under one evaluator and 24-move budget; protocol, source identities, outcome-only control receipt, and downstream consumption frozen before confirmation
- **statement:** The valid real control passed with gameplay outcomes differing in all 48 one-stone/two-stone pairs; an outcome-identical twin had zero changed outcomes and failed the same check before confirmation. The confirmation runner consumed that exact qualified receipt. On fresh confirmation seeds, two-stone versus one-stone score responses ranged from **-18.338%** to **-22.071%**, an interaction spread of **0.0373308141** or **3.733 percentage points**. The policies remained behaviorally distinct on the open layout, clearing both style guards, but the most- and least-affected policies changed between fixed seed halves. The predeclared empirical verdict is therefore **`INCONCLUSIVE`**: this exact contrast neither supports nor falsifies a stable five-point policy-by-topology interaction. Aggregate evidence entitlement is **PASS**, but it does not authorize treating this topology response as a MAP-Elites axis or scaling it into OpenEvolve or co-evolution.
- **evidence:** protocol `experiments/RESULT-0024/protocol.md` registered at commit `e6da102cfbbfb6605bfb1c21c3c7e46a72565002`; report `experiments/RESULT-0024/report.md`; controls identity `aa69b1233176124efc086300c11584eae0820971d1d4c1f0a5d84ca1acbf7bf5`; control-entitlement identity `dabcb1b3e8313b7b1f3fff0c920ca4370623ec92798a1a51217be486f22b40d5`; confirmation identity `77a8d7d623d23d123cf383bd8b080db458574a7ef0a11a148f8291cb04ff84be`; primary verification identity `6634724c54ee448a57c5233d7b758e6fc89cf2eaba3549fc0a8dba75283e9ff6`; independent recomputation identity `049534b508eeedd748cdc57b7e8d40072dfadc1b558bfce91f050dc67d0e6d2c`; challenge receipt identity `e04ae952677fd59c851327329afe92455a8eecd9c2d9b30f7aa5208c362d560a`.
- **proof_class:** `heuristic_observation` for the empirical response over these fixed policies, layouts, and seeds; `direct_source` for identities, complete matrix, protocol ordering, valid-control PASS, same-check broken-control FAIL, downstream receipt consumption, independent recomputation, and confirmation-identity twin failure. No policy-independent topology law, human-persona claim, or product decision follows.
- **as_of:** 2026-09-02
- **reverify:** Call `verifyAll` from `experiments/RESULT-0024/verify.js` on the committed controls, control-entitlement, and confirmation artifacts; expect PASS, confirmation `77a8d7d6...`, empirical verdict `INCONCLUSIVE`, interaction spread `0.03733081406203867`, style guard true, and stable ordering false. Run `node --test experiments/RESULT-0024/control-gate.test.js` and `node tools/verify-experiments.js`; expect 4/4 and `EXPERIMENT GATE PASS`.
- **updated:** 2026-09-02
- **supersedes:** []
- **superseded_by:** []
- **notes:** `verification.json` says `ENTITLED` before reading the independent recomputation or final challenge receipt. The report narrows that component field to primary artifact-chain PASS; final entitlement is the report-level join over all six identified artifacts. The frozen component receipt is retained unchanged. The rejected `RESULT-0023` report preserves the predecessor's false-PASS finding and diagnostic arithmetic but is not admitted as its own ledger result; `RESULT-0022` contains only an unused incomplete protocol template and produced no measurement.

### RESULT-0025 — One owner pilot session replays exactly on its identified subject

- **type:** result
- **status:** accepted
- **scope:** `HUMAN-PILOT-0001`; one owner, candidate `gen-0008` identity `4db4d815f7f36f59b2710b195a56a1a36b35053a5c19ad283db679b6c4f7876d`, fixed seed `424242`, subject identity `55b57be2805413f2e0466fad8b7272d9ee6caa89ae6e1da674ff0c158a7ff257`, one terminal browser recording; not the shipped Level 53 identity and not a population sample
- **statement:** The browser-produced recording replays through the headless engine to **164,096 points in 19 moves** with no replay problems. The execution receipt binds the candidate, subject, recording, checker, runtime bundle, and reusable replay challenge receipt. This pilot recording passes the qualified replay predicate; the reusable checker challenge separately passed its real qualification subject and failed a controlled broken twin through that same predicate. The owner attested that the session was personally played with no automated player. This establishes one exact replayable session and nothing about calibration, representativeness, eligibility, ranking, shipping readiness, or a human-performance distribution.
- **evidence:** execution receipt `pilots/HUMAN-PILOT-0001/execution-receipt.json`, identity `1f45d07cc9a8a2b38493e9f6d022c9549cf60e3c0ba57a057ef5e3ea5d4f89bb`; recording file identity `687dfd7d9bc25a858e50d398830b7b6bb52b697e5364e3b104824047adb3a903`, recording identity `3823dfcec50558d84e65510c1e0598a34083089e347c52c400bb962164d49f8b`; reusable replay challenge `pilots/HUMAN-PILOT-0001/replay-challenge.json`, identity `85dbc51d6bef9d89bd96a25f861c9f773070e7f352dee1fa9fb2700f5e4b269c`; owner attestation and disposition `pilots/HUMAN-PILOT-0001/owner-disposition.json`, identity `284c9d4aa6223f965c206714ab5f833a387ac27f7015bc7181223c856a748dfb`.
- **proof_class:** `exact_result` for replay on the identified subject; `direct_source` for bound identities, challenge outcomes, and owner attestation. Qualitative interpretation remains the owner decision in `DECISION-0005`.
- **as_of:** 2026-09-02
- **reverify:** Run `node tools/human-pilot.js verify-execution` and `node --test solver/tests/humanPilot.test.js solver/tests/recordingReplay.test.js`; expect execution PASS and all focused tests PASS, including real-subject PASS, broken-twin FAIL, and covered-identity invalidation.
- **updated:** 2026-09-02
- **supersedes:** []
- **superseded_by:** []
- **notes:** Candidate labels are batch-local. Use the candidate and subject identities, not bare `gen-0008` or the pilot's presentation level, to refer to this session. The challenge receipt qualifies the reusable checker on its own real recording and broken twin; the execution receipt is the per-invocation application to this pilot's distinct recording.

### RESULT-0026 — The frozen handmade policy saves moves on average but regresses six wins

- **type:** result
- **status:** accepted
- **scope:** frozen handmade policy identity `338be26be2b8` versus current reference identity `ec59341e1a98`; levels `5,11,17,23,29,35,41,47,50`; fresh seeds `24000000..24000024`; real shipped move budgets; 450 games forming 225 paired comparisons; one preregistered confirmation
- **statement:** The qualified comparison gate passed its real burned-seed subject, failed a controlled wrong-outcome twin, failed a covered source-identity twin, and issued Challenge Receipt `56b8b29e...`; the confirmation runner and final admission both consumed that exact receipt. On the fresh registered panel, the handmade policy saved **0.68 effective moves/game** on average (`SE 0.4881769708`, `t 1.392937481`) but won **216/225** games against the reference bot's **222/225**. It converted six reference wins into losses: Level 47 seeds `24000000`, `24000008`, `24000011`, and Level 50 seeds `24000010`, `24000019`, `24000023`. Because the predeclared win non-regression condition fails upon one such pair, the admissible empirical verdict is **`FALSIFIED`**. This frozen policy is not supported for promotion.
- **evidence:** protocol `experiments/RESULT-0026/protocol.md` registered at commit `3d02387347c7872a2ce6d8052ade46836f6d874b`; report `experiments/RESULT-0026/report.md`; qualification identity `3a30456161b7f1cbbe9005b86a98fc4e50bd5007acaa2e0a873e794c3a4190c5`; Challenge Receipt identity `56b8b29e8acca8c98fd45acd1001a87e20b041405e8b1c630fd371d2498f3ed2`; raw confirmation identity `4a5ce7674faabab4a3b39ee47efb86d8adee93cf73c7cd2c65b8440b58b7d90b`; independent recomputation identity `8f9916dcd88e27d4220dc3964da19eb7617bc74a2113aae527cf31139b06760e`; downstream admission identity `95604ad0bcf98dcecc33692c89b36e6444faa368b817a09587fa5b6ae50fbc7f`.
- **proof_class:** `heuristic_observation` for the paired policy comparison over the fixed levels and fresh seeds; `direct_source` for protocol ordering, complete raw matrix, source and artifact identities, real-subject PASS, same-verifier challenge failures, downstream receipt consumption, full deterministic replay, and independent arithmetic agreement. No policy-independent bound, human-performance claim, or conclusion about the separate targeted-chain generator follows.
- **as_of:** 2026-09-02
- **reverify:** Run `node --test experiments/RESULT-0026/policy-comparison-gate.test.js` and `node tools/verify-experiments.js`; expect all focused tests and the experiment gate to pass. Regenerate the arithmetic with `node experiments/RESULT-0026/recompute.js --confirmation experiments/RESULT-0026/confirmation.json --out /private/tmp/result-0026-recomputation.json`; expect identity `8f9916dc...` and verdict `FALSIFIED`. Run `node experiments/RESULT-0026/admit.js --confirmation experiments/RESULT-0026/confirmation.json --qualification experiments/RESULT-0026/qualification.json --challenge-receipt experiments/RESULT-0026/challenge-receipt.json --independent experiments/RESULT-0026/recomputation.json --out /private/tmp/result-0026-admission.json`; expect `ADMITTED FALSIFIED` and identity `95604ad0...`. Do not rerun confirmation.
- **updated:** 2026-09-02
- **supersedes:** []
- **superseded_by:** []
- **notes:** The earlier sandbox `+0.72` estimate remains retrospective discovery, not confirmation. RESULT-0026's `+0.68` mean does not rescue the combined claim because P2 was frozen as a hard safety condition. A repaired policy is a new subject requiring a new protocol and fresh evidence.

### RESULT-0027 — Level authoring now uses a frozen evaluator without changing the shipped game

- **type:** result
- **status:** accepted
- **scope:** evaluator-main integration at commit `e95b1159ea496f0d78a9d821a1f2928f2b7af82b`; `solver/level-author.js`, `solver/calibration.js`, `solver/calibrations/calib-1.js`, active gen-0014 candidate and receipt, and historical Level 53 candidate preservation; shipped game, levels, rules, live bot, and recordings excluded
- **statement:** Production level authoring now imports versioned evaluator `calib-1` and not the mutable live bot. Its calibration solver identity is `c3cefaf3ab0387180349948ba1adc9a0737cc07ae1ebfcdf51b1e8c0396f77ed`, covering the engine and frozen evaluator. Re-authoring gen-0014 twice produced stable tracked bytes and candidate identity `a6c3e36031a17276354ba0d8b16e796d4338038fb984a581ffbe96cb9c3387f7`: fitting median **107,904**, rounded target **102,000**, and the fixed 300-seed holdout at **196 wins / 104 out-of-moves / 0 lockouts / 0 bombs**. An independent implementation replayed all 150 fitting and 300 holdout seeds and recomputed the same candidate, receipt, calibration, quantiles, target, and terminal totals. Live-bot fault injection left authoring output unchanged, while a planted live-bot import failed the boundary gate. No shipped gameplay surface changed. The already-shipped 101,000 Level 53 candidate identity `043ca53f234d4092202677b3e48a1855c0194c208742bba94a2c75ebd2227f16` is preserved byte-identically in `solver/candidates-archive/`; all three recordings bound to it replay exactly and the orphan ceiling remains zero.
- **evidence:** integration commit `e95b1159ea496f0d78a9d821a1f2928f2b7af82b`; frozen contract and independent historical checks under `docs/goals/evaluator-foundation/`; active artifacts `solver/candidate-levels.json` and `solver/candidate-levels.receipt.json`, receipt identity `3b83de41726b57d5d39d5c83bb44fda412fb6413da7bdaa7aaf11a7db8953bc1`; archived historical artifacts `solver/candidates-archive/candidate-levels-gen0014-wide-sprint-043ca53f.json` and `.receipt.json`, byte-identical to Git blobs `1307a3c7873b01782989af594a6be347169b04b7` and `4b244c82c6c7555271d234d70c7a28fae680bebd` from main commit `8de076a000ead141d45f2a34629f51ea5aa1cbfe`; evaluator boundary, calibration, authoring, seed-variance identity, human-pilot identity, and recording-replay tests under `solver/tests/`.
- **proof_class:** `exact_result` for the identified deterministic authoring outputs, complete fixed-seed replay, dependency identities, and historical recording replays; `direct_source` for the receipt contents. The fitting median, rounded target, and holdout counts are admitted only as the reproducible contents of the identified receipt, not as a measurement of level difficulty or evaluator performance: that would be a sample-based performance claim and requires a protocol registered before the run, which this integration did not have. No policy-independent score bound, difficulty claim, or human-performance conclusion follows.
- **as_of:** 2026-09-03
- **reverify:** Run `node solver/author-level.js --verify solver/candidate-levels.json solver/candidate-levels.receipt.json`; expect candidate `a6c3e360...`, 196 holdout wins, 0 lockouts, 0 bombs, and 300 total. Run `node --test solver/tests/calibration.test.js solver/tests/evaluatorBoundary.test.js solver/tests/levelAuthor.test.js solver/tests/humanPilot.test.js solver/tests/recordingReplay.test.js solver/tests/seedVariance.test.js`; expect all 53 tests to pass, including the live-bot boundary control, calibration-identity invalidation, all ten recording replays, and orphan ceiling zero. Run `node solver/verify-loop.js`; expect 53/53 and `RESULT: PASS`.
- **updated:** 2026-09-03
- **supersedes:** []
- **superseded_by:** []
- **notes:** **Narrowed 2026-09-03**, the day it was admitted: the entry was merged (pull request #1) while `tools/verify-experiments.js` was red on it, because it claimed `heuristic_observation` with no `experiments/RESULT-0027/protocol.md` and cited three artifacts with no registration stamp. The heuristic half is withdrawn rather than retro-registered; the deterministic half is unchanged. A performance claim about `calib-1` needs its own registered protocol. This freezes a level-authoring evaluator and admits one reproducible candidate receipt. It does **not** ship the 102,000 candidate, retarget Level 53, validate human difficulty, establish optimality, or constitute a MAP-Elites result. The archived 101,000 receipt's old bot measurements remain stale and non-quotable; its board, target, identity, provenance, and exact human replays remain valid. The historical evaluator branch used the label `RESULT-0015`, which is not imported because main already assigned that stable ID to a different accepted result; this record is the non-colliding main-ledger admission.


### RESULT-0028 — A second owner pilot session replays exactly on its identified subject

- **type:** result
- **status:** accepted
- **scope:** `HUMAN-PILOT-0002`; one owner, exploratory candidate `prototype-central-choke` identity `0d7604e7b6d6142dce6ad8c6f4d1a2a62b2ea1031b5e3ccf3fd93643799585f4` (the HUMAN-PILOT-0001 board with its blockers replaced by two horizontally adjacent permanent center stones), fixed seed `424242`, subject identity `d06b1679b0984eaec4e6193b51e0216768a7f2dcb48029e2d149c6ba046cd595`, one terminal browser recording; not a shipped level and not a population sample
- **statement:** The browser-produced recording replays through the headless engine to **140,544 points in 20 moves** with no replay problems. The execution receipt binds the candidate, subject, seed, recording, checker, runtime files, and a replay challenge receipt; the challenge passed the real subject and failed a controlled score-plus-one twin through the same predicate, using the same checker identity `c7284bb2fac849db00049a46663f287edf34167cb1d688875b75f0ba543ddbd4` that `RESULT-0025` qualified. The owner attested that the session was personally played with no automated player. This establishes one exact replayable session and nothing about calibration (the 126,000 target is inherited from `HUMAN-PILOT-0001` and uncalibrated for this layout), causal blocker-position effect, representativeness, eligibility, ranking, shipping readiness, or a human-performance distribution.
- **evidence:** execution receipt `pilots/HUMAN-PILOT-0002/execution-receipt.json`, identity `c84a8481498fbdc37cd59c028c9ce8a4627c53e89731776a07f4c083a6b59e5e`; recording file identity `846513bc9a0e1e31d5f42b9378ba12a0bad092e9e95b8bc6ebc5c7e9dbfec48a`, recording identity `c50b34f85e9ee53762ab3093bc4af0839965dd8c275bdc7893c31e011e0a32f6`; replay challenge `pilots/HUMAN-PILOT-0002/replay-challenge.json`, identity `e1416049da8fac5224e2f1b592c4d700e7afdf6f27e30116bee3f71d13070d6f`; owner attestation `pilots/HUMAN-PILOT-0002/owner-attestation.json`, identity `d5807f5f18bd2e6fc4989941597cd57c7ed84d0a2b459fe5d73118161dedf340`; manifest limitations in `pilots/HUMAN-PILOT-0002/manifest.json`.
- **proof_class:** `exact_result` for replay on the identified subject; `direct_source` for bound identities, challenge outcomes, and owner attestation. No qualitative disposition is recorded; any interpretation of the chokepoint contrast is a separate owner decision.
- **as_of:** 2026-09-03
- **reverify:** Run `node pilots/HUMAN-PILOT-0002/qualify.js verify` and `node --test solver/tests/humanPilot0002.test.js solver/tests/recordingReplay.test.js`; expect PASS and all focused tests PASS, including real-subject PASS, broken-twin FAIL, and receipt invalidation on a changed recording file, checker identity, or forged verdict.
- **updated:** 2026-09-03
- **supersedes:** []
- **superseded_by:** []
- **notes:** The recording was recovered on 2026-09-02 from an untracked worktree (`.orch/tickets/2026-09-02-adhoc-remote-branch-triage`) and committed byte-for-byte before qualification. Unlike `RESULT-0025`, this pilot has no runtime-bundle manifest from before the session; the receipt binds the runtime files as they were at qualification, which is a weaker provenance claim and is why the scope is replay exactness only.
## Decision registry

### DECISION-0001 — Keep the feasibility study frozen

- **type:** decision
- **status:** superseded
- **scope:** current Level 26 feasibility study
- **statement:** The feasibility study preserves the shipped rules and evaluates one Level 26 seed-0 sequence. Target changes, scoring changes, and generic bot tuning remain outside the proof question.
- **evidence:** `.orch/runs/level26-certified-score-2026-08-10/worklog.md:3-9,34-39`; historical correction under `HANDOFF.md`, **Important correction**.
- **proof_class:** `owner_decision`
- **as_of:** 2026-08-11
- **reverify:** not_applicable
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** [DECISION-0002]

### DECISION-0002 — Park the exact-proof track; tune levels from measured calibration

- **type:** decision
- **status:** accepted
- **scope:** level tuning and the Level 26 feasibility study
- **statement:** The exact-proof track is parked, not retracted. `QUESTION-0001` and `QUESTION-0002` stay open and every accepted proof record keeps its standing; no impossibility claim follows from parking. The reason is scope, not difficulty: the shipped game seeds its board from `Math.random`, so a result about one frozen seed cannot decide whether a player can clear the level, which is the question the solver was built to answer. Level tuning now proceeds from measured calibration across seeds (`RESULT-0005`). This lifts DECISION-0001's exclusion of target changes.
- **evidence:** owner instruction in session 2026-08-11; unseeded shipped randomizer noted in `solver/README.md`, **Level solver** opening; calibration evidence `RESULT-0005`.
- **proof_class:** `owner_decision`
- **as_of:** 2026-08-11
- **reverify:** not_applicable
- **updated:** 2026-08-11
- **supersedes:** [DECISION-0001]
- **superseded_by:** []
- **notes:** Resuming the proof track requires only an owner decision; the frozen inputs, receipts, and verifiers remain committed and replayable.

### DECISION-0003 — Targets are a measured share of achievable score; tile scale doubles per chapter

- **type:** decision
- **status:** accepted
- **scope:** all 50 shipped levels, level-authoring going forward
- **statement:** A level's target is set as *demand* — a chosen share of that level's measured achievable score — rather than as a fixed step. Demand rises across a ten-level chapter and resets downward when a chapter doubles the tile scale. Win rate is reported as the outcome, never used as the input, because it saturates: every trivially winnable level maps to 100% and the target then has nowhere to climb, which is what made an earlier win-rate-driven attempt inflate level 2's target to 7,250. Tile scale doubles exactly once per ten-level chapter (1, 2, 4, 8, 16) so dealt tiles stay on the 2/4/8/16/32/64/128 family; arbitrary integer scales were rejected because they deal off-family values such as 6/12/24, which in this game appear only as dead tiles.
- **evidence:** `solver/game-tester.js`, `CHAPTERS`, `sawtoothDemand`, and the `powers2` policy; applied values in `src/game.js`, `LEVELS`.
- **proof_class:** `owner_decision`
- **as_of:** 2026-08-12
- **reverify:** `not_applicable`
- **updated:** 2026-08-12
- **supersedes:** []
- **superseded_by:** []
- **notes:** Consequence worth stating plainly: tile scale has no effect on difficulty. Scaling multiplies the target and achievable score by the same factor, so win rate is unchanged and scale buys presentation only. Difficulty is carried entirely by demand. The move budget was deliberately left as authored — it is a pacing lever, and deriving it from a target curve would make how a level feels a side effect of number cosmetics. That leaves roughly 15 levels whose target is lower than the level before, accepted as honest: a level with more blockers and fewer moves genuinely pays less.

### DECISION-0004 — Promote the target-aware policy as the current engineering champion

- **type:** decision
- **status:** accepted
- **scope:** the reference solver policy on `main` beginning at commit `b82a9b6a0786ab1518fb534735c5f08d5539a4cf`; historical experiment artifacts and level-authoring evidence excluded
- **statement:** The owner promotes the target-aware immediate-finish policy in `solver/bot.js` as the current engineering champion. The policy keeps the prior chooser, but when a deterministic untrimmed legal route reaches the finite unmet target immediately, it takes that route; it never applies the override while a bomb is present. Promotion is an engineering decision supported by the bounded heuristic observation in `RESULT-0018` and post-promotion regression gates. It is not a claim of universal non-regression, higher terminal-score optimization, autonomous learning, or pristine experimental provenance. The previous champion remains the historical identity for artifacts that were generated against it; levels, targets, receipts, MAP/Universe artifacts, and the level-authoring system are not rewritten.
- **evidence:** owner instructions `Promote it` and `Proceed with these tasks` on 2026-08-30; promoted code commit `b82a9b6a0786ab1518fb534735c5f08d5539a4cf`, `solver/bot.js` SHA-256 `6f58e6c136f58dc52df5d1b4203d0c032b497109ef4c517cd0ca1628057e1fd1`; accepted `RESULT-0018` and its primary evidence at immutable commit `6a07294571644d963a5a9b728f8e4aed3b29a835`; promotion checks and corrected push status at `f0ba51864c11cc6a1bb2d97bdf8bb589efb886a3:.orch/tickets/proportional-target-aware-promotion-2026-08-30/T-001.md`.
- **proof_class:** `owner_decision`
- **as_of:** 2026-08-30
- **reverify:** Inspect commit `b82a9b6a0786ab1518fb534735c5f08d5539a4cf`; run `node --test solver/tests/bot.test.js`, `node solver/verify-loop.js`, and `node tools/verify-universe-map.js`; expect focused tests and both gates to pass. Resolve the bounded evidence with `git show 6a07294571644d963a5a9b728f8e4aed3b29a835:EVIDENCE_LEDGER.md` and retain its `heuristic_observation` limits.
- **updated:** 2026-08-30
- **supersedes:** []
- **superseded_by:** []
- **notes:** This decision changes which policy is current; it does not change the historical standing or identity of any earlier result. The evidence under it is now reproducible: `RESULT-0020` (2026-09-01) registered a protocol before running and reproduced RESULT-0018 holdout counts exactly, so this decision no longer rests solely on a grandfathered result. That replication also found that the promotion copied the target-aware policy into `solver/bot.js` rather than moving it — `chooseMove` and `chooseTargetAwareMove` are now byte-identical apart from their identifiers, and the experimental challenger called the promoted one, evaluating the override twice per move. The challenger was repointed at `chooseBaseMove` on 2026-09-01 (`c37c83a`), verified play-identical on 1,040 games; `solver/bot.js` still carries its own copy of the rule, which is a code question for this decision to answer, not a change this measurement makes.

### DECISION-0005 — Route the qualified owner pilot to variant/repair

- **type:** decision
- **status:** accepted
- **scope:** disposition of the one exact `HUMAN-PILOT-0001` session in `RESULT-0025`; no candidate admission, shipping, rule change, or population claim
- **statement:** The owner disposes the played candidate as **`variant/repair`**. Preserve the narrow-board direction because it amplified the existing planning challenge while remaining fun. Treat blocker benefit as topology-dependent rather than assuming any blocker placement is beneficial. Resolve or explicitly accept the stone and below-stone refill behavior before relying on that pressure as a desired level property. This is a qualitative owner decision about what to explore next, not an empirical claim that the candidate is calibrated, representative, eligible, or ready to ship.
- **evidence:** owner-authored `pilots/HUMAN-PILOT-0001/owner-disposition.json`, identity `284c9d4aa6223f965c206714ab5f833a387ac27f7015bc7181223c856a748dfb`, consuming execution receipt `1f45d07cc9a8a2b38493e9f6d022c9549cf60e3c0ba57a057ef5e3ea5d4f89bb`, recording identity `3823dfcec50558d84e65510c1e0598a34083089e347c52c400bb962164d49f8b`, candidate identity `4db4d815f7f36f59b2710b195a56a1a36b35053a5c19ad283db679b6c4f7876d`, and subject identity `55b57be2805413f2e0466fad8b7272d9ee6caa89ae6e1da674ff0c158a7ff257`.
- **proof_class:** `owner_decision`
- **as_of:** 2026-09-02
- **reverify:** Confirm the disposition artifact identity and that all four consumed identities match `RESULT-0025`; no gameplay rerun is required to re-establish the recorded owner decision.
- **updated:** 2026-09-02
- **supersedes:** []
- **superseded_by:** []
- **notes:** The disposition chooses a direction for another bounded iteration. It does not select a particular repair, change blocker mechanics, or admit the candidate.

## Hypothesis registry

### HYPOTHESIS-0001 — Compact state may guide an approximate search

- **type:** hypothesis
- **status:** provisional
- **scope:** prospective 32-move modeling
- **statement:** A state retaining score, moves remaining, spawn cursor, value histogram, and compact connectivity/survivor-position information may compress the search usefully. Histogram plus cursor alone is only a relaxation; geometry is required for exactness.
- **evidence:** move-one compression and modeling implication in `.orch/tickets/level26-move1-envelope-2026-08-11.md:88-97`.
- **proof_class:** `hypothesis`
- **as_of:** 2026-08-11
- **reverify:** Test the proposed signature against exact small-horizon positions; no such test is recorded.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### HYPOTHESIS-0002 — A partitioned frontier may enable decisive proof

- **type:** hypothesis
- **status:** provisional
- **scope:** prospective frozen Level 26 seed-0 continuation
- **statement:** A streaming or partitioned physical frontier with a materially tighter complete tail abstraction, or another exact formulation, may produce a replayed target witness or decisive bound without exhausting memory.
- **evidence:** Resume boundary of the physical branch-and-bound in `.orch/runs/level26-certified-score-2026-08-10/worklog.md:93-109`; bounded threshold outcomes at lines 137-152; technical recommendation under `HANDOFF.md`, **Correct next study**.
- **proof_class:** `hypothesis`
- **as_of:** 2026-08-11
- **reverify:** Test a frozen formulation for completeness and require either a replayed target witness or a decisive bound; no such result is recorded.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

## Open-question registry

### QUESTION-0001 — Is 13,000 reachable?

- **type:** question
- **status:** open
- **scope:** frozen Level 26 seed 0, 32 moves
- **question:** Does any legal 32-move sequence score at least 13,000?
- **evidence:** lower-bound boundary `RESULT-0001`; non-decisive upper bound `RESULT-0002`; `UNKNOWN` schedule `RESULT-0004`.
- **proof_class:** `unresolved`
- **as_of:** 2026-08-11
- **reverify:** Check for a newer accepted replayed target witness or proven upper bound below 13000.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### QUESTION-0002 — What is the exact maximum?

- **type:** question
- **status:** open
- **scope:** frozen Level 26 seed 0, 32 moves
- **question:** What is the maximum legal score over the full frozen horizon?
- **evidence:** accepted interval implied by `RESULT-0001` and `RESULT-0002`; active proof goal in `.orch/runs/level26-certified-score-2026-08-10/worklog.md:3-6`.
- **proof_class:** `unresolved`
- **as_of:** 2026-08-11
- **reverify:** Check for a newer accepted exact certificate; a target witness alone does not settle exactness.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### QUESTION-0003 — Which first move is globally best?

- **type:** question
- **status:** open
- **scope:** frozen Level 26 seed 0, first decision within the 32-move horizon
- **question:** Which first move maximizes final score rather than immediate score?
- **evidence:** `.orch/tickets/level26-move1-envelope-2026-08-11.md:105-111` records that the 27- and 28-tile move-one maximizers leave different boards and cursors.
- **proof_class:** `unresolved`
- **as_of:** 2026-08-11
- **reverify:** Check for a complete accepted 32-move search that distinguishes the move-one maximizers.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

## Correction registry

### CORRECTION-0001 — Spawn values are scale-dependent

- **type:** correction
- **status:** accepted
- **scope:** shipped game rules, all levels
- **statement:** Narrows `FACT-0003`. Gravity, persistence, and refill order are unchanged. Refill values are now the level's `tileScale` times 2, 4, or 8 with probabilities 0.6, 0.3, and 0.1, and the initial grid is `tileScale` times 2, 4, 8, or 16 with probabilities 0.5, 0.3, 0.15, and 0.05. `FACT-0003` stated the unscaled values, correct when written and correct today only for levels at scale 1. Value conservation across a merge is unaffected.
- **evidence:** `src/game.js`, `Game.loadLevel` (sets `this.tileScale`), `Game.spawnNewTiles`, and the initial-grid loop in `loadLevel`; `solver/engine.js`, `randomInitialValue`, `randomSpawnValue`, and `createLevelState`; parity test `solver/tests/engine.test.js`.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-12
- **reverify:** Run `node --test solver/tests/engine.test.js`; expect all tests to pass, then inspect the cited symbols.
- **updated:** 2026-08-12
- **supersedes:** [FACT-0003]
- **superseded_by:** []

### CORRECTION-0002 — Level 26 configuration after the retune

- **type:** correction
- **status:** accepted
- **scope:** shipped Level 26
- **statement:** Supersedes `FACT-0004`. Level 26 now has a 5x8 grid, no blockers, a minimum chain length of 4, 32 moves, a `tileScale` of 4, and a 23,700-point target. The 13,000 target and scale-1 board named in `FACT-0004` describe the level before 2026-08-12 and remain the configuration the frozen seed-0 proof work refers to.
- **evidence:** `src/game.js`, `LEVELS` entry for level 26; the frozen study is pinned independently at `solver/upper-bound.js`, `FROZEN_LEVEL_26_TARGET` and `solveFrozenLevel26`, and at `solver/tests/exact-score.test.js`, `FROZEN_LEVEL_26`.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-12
- **reverify:** Inspect the exported `LEVELS` entry for level 26; expect target 23700, tileScale 4, moves 32, minChain 4. Run `node --test solver/tests/upper-bound.test.js solver/tests/exact-score.test.js`; expect the frozen-hash and frozen-target assertions to pass unchanged.
- **updated:** 2026-08-12
- **supersedes:** [FACT-0004]
- **superseded_by:** []
- **notes:** `QUESTION-0001` and `QUESTION-0002` concern the frozen scale-1 board at target 13,000 and are unaffected. The retune neither answers nor retracts them.

### CORRECTION-0003 — Candidate width saturates because of the generator, not the board

- **type:** correction
- **status:** accepted
- **scope:** the stated mechanism inside `RESULT-0010`; its conclusion is unaffected
- **statement:** `RESULT-0010` explains the candidate cap's saturation with "boards offer a median of 15 legal chains and at most 30". That is not what boards offer. Level 51's opening boards hold **198,563 to 8,284,580 distinct legal chains** on the seeds measured. The 15-to-30 figure counts what `findGreedyChains` *produces* — it runs one walk per start tile and dedupes, so it can never return more candidates than the board has unblocked tiles, whatever the cap is set to. The cap saturates against the generator's output, not against the move space. `RESULT-0010`'s conclusion stands unchanged and was re-confirmed under the new generator: widths 26 and 32 still produce bit-identical play to width 24, and raising the cap still buys nothing. What changes is the reading of *why*, and therefore what was left on the table: the recorded wording implied the bot was near the limit of its options, when it was seeing a hand-filtered fraction of them. `RESULT-0011` measures that fraction and recovers part of it.
- **evidence:** `solver/chain-coverage.js` (enumerated chain counts per board, via `enumerateLegalChains` from `solver/exact-score.js`); `solver/engine.js`, `findGreedyChains` — one `buildGreedyChain` call per non-blocked tile; `solver/routing-ablation.js` width arms.
- **proof_class:** `direct_source` for the chain counts and the generator's structure; `heuristic_observation` for the saturation itself.
- **as_of:** 2026-08-20
- **reverify:** `node solver/chain-coverage.js`; compare the enumerated totals against the candidate counts `findGreedyChains` returns on the same state.
- **updated:** 2026-08-20
- **supersedes:** []
- **superseded_by:** []
- **notes:** Appended rather than edited into `RESULT-0010`, which keeps its original wording and receipt. The correction is to an explanation, not to a measurement — every number `RESULT-0010` reports was and remains correct.

### CORRECTION-0004 — RESULT-0015 was invalidated when the beam was made additive

- **type:** correction
- **status:** accepted
- **scope:** `RESULT-0015` and the exact `solver/engine.js` identity it measured
- **statement:** Supersedes `RESULT-0015`. After its confirmation, the pre-existing test `chooseMove: considers candidates ranked below the top few on immediate points` failed: beam alternatives had replaced, rather than supplemented, the historical one-path candidate. Correcting that behavior changed `solver/engine.js`, so the +13.83% confirmation no longer covered the live result and was invalidated. The corrected identity was re-screened and re-confirmed; its accepted measurement is `RESULT-0016`.
- **evidence:** failed then passing targeted test recorded in `.orch/tickets/2026-08-21-adhoc-low-value-multipath/T-001.md`; corrected `buildGreedyPathBeam` in `solver/engine.js`; replacement measurement `RESULT-0016`.
- **proof_class:** `direct_source` for the identity invalidation; replacement performance remains the `heuristic_observation` in `RESULT-0016`.
- **as_of:** 2026-08-21
- **reverify:** Inspect `buildGreedyPathBeam` and run the named bot test; expect the historical candidate to remain available. Use `RESULT-0016`, not `RESULT-0015`, for performance.
- **updated:** 2026-08-21
- **supersedes:** [RESULT-0015]
- **superseded_by:** []
- **notes:** The correction was driven by a deterministic regression test, not by the first confirmation's outcome. The frozen seed sets were then rerun against the corrected identity; only the corrected run is accepted.

## Assembly cut log

- Omitted draft labels and repeated draft identities because the root ledger is the assembled authority surface.
- Omitted heuristic win-rate samples and terminal-board anecdotes because they do not bear on the frozen proof question.
- Omitted the failed near-target artifact because the certification worklog marks it unaccepted; the accepted lower bound remains 12,336.
- Kept the full protocol and all 15 seeded records; no acceptance coverage was cut for length.

## Resume boundary

Level tuning is done (`DECISION-0003`, `RESULT-0008`). Active work resumes at authoring new levels, against the design at `docs/superpowers/specs/2026-08-08-level-authoring-loop-design.md` and the measurement harness at `solver/game-tester.js`.

The latest authoring branch is now narrower: the qualified pilot routes its exact candidate to `variant/repair` (`RESULT-0025`, `DECISION-0005`), the first repaired automated topology-response study is entitled but empirically `INCONCLUSIVE` (`RESULT-0024`), and the frozen handmade policy confirmation is admissible but `FALSIFIED` because six reference wins regressed (`RESULT-0026`). Do not repeat the same one-stone/two-stone contrast with more seeds or promote the frozen handmade policy. The next research question must either name a mechanically stronger contrast, test a different behavior descriptor tied directly to observed planning pressure, or define a repaired policy as a new subject.

Two things are knowingly left open. The reference bot remains a weak proxy for a skilled player, so every recorded win rate is a floor on human success and not an estimate of it; the margin is unquantified. And roughly 15 levels carry a target lower than the level before, accepted rather than fixed, because the remaining lever is the move budget and spending it would make a level's pacing a side effect of target cosmetics (`DECISION-0003`).

The proof track is parked, not closed. It resumes from the unresolved **12,336–326,390** interval for frozen Level 26 seed 0. Closure still requires an accepted replayed 13,000 witness, an exact result, or a proven upper bound below 13,000; heuristic misses, terminal boards, timeouts, and `UNKNOWN` remain non-decisive.
