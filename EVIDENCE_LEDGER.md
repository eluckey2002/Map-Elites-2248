# 2248 Challenge Evidence Ledger

## Read this first

Use this ledger to find the project's current accepted facts, experimental results, decisions, hypotheses, and open questions. Read the current snapshot first, then follow the cited evidence for any claim that affects game rules, solver behavior, or a proof conclusion. Update the relevant registry after new evidence is verified.

The ledger is the authority for a record's current standing. It is not the authority for the underlying claim. Source code, tests, frozen machine-readable receipts, replay verifiers, and immutable run records remain the evidence. Summary documents, including `HANDOFF.md`, provide navigation and historical context only. An uncited claim or unaccepted artifact is a lead, not project knowledge.

## Current snapshot

As of 2026-08-11, the frozen Level 26 seed-0 proof remains numerically unresolved: the best accepted score is a replayed lower bound of **12,336**, the proven **326,390** upper bound is non-decisive, and both 13,000 reachability and the exact 32-move maximum are unknown. The frozen input identity is `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`. (`solver/tests/exact-score.test.js:77-85`; `.orch/runs/level26-certified-score-2026-08-10/worklog.md:60-69,111-120`)

The exact move-one maximum is **430**, but this does not identify the first move that maximizes the 32-move total. Threshold checks above 12,336 returned `UNKNOWN`; they rule out no score. (`.orch/tickets/level26-move1-envelope-2026-08-11.md:57-69,105-111`; `solver/hinted-cp-sat/frozen-run.json:1-35,2375-2412`)

That proof track is **parked** as of 2026-08-11 (`DECISION-0002`), and active work has moved to level tuning. Calibration across all 50 levels shows Level 26 was never the outlier it was treated as: its target is the *lowest* multiple of achievable score of any level from 19 to 50, while the current bot clears no level at all from 17 onward and demand rises to roughly six times achievable score by level 49 (`RESULT-0005`). Parking decides nothing about 13,000; `QUESTION-0001` and `QUESTION-0002` remain open. (`solver/target-calibration.js`)

Two candidate remedies were then priced and neither rescues the late levels. Enriching the spawn pool is the wrong lever — a 76% increase in spawned value buys 13% more score (`RESULT-0006`). Enlarging the move budget works in the mid game and saturates in the late game, where the board reaches a terminal state before extra moves can be spent (`RESULT-0007`). Levels past roughly 31 are short of their targets by two to four times with no parameter fix available, so their targets are the thing that has to move.

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
| `superseded` | Replaced or narrowed by a linked correction or newer record. |
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
- **status:** accepted
- **scope:** blocker-free Level 26 transition
- **statement:** Unselected tiles persist. After a length-`L` merge, gravity acts by column and exactly `L - 1` empty cells are refilled in column-major order. Refill values are 2, 4, or 8 with probabilities 0.6, 0.3, and 0.1. The merge conserves board value; only refills add value.
- **evidence:** `src/game.js`, `Game.applyGravity` and `Game.spawnNewTiles` at lines 416-470; `solver/engine.js:115-151`; parity tests `solver/tests/engine.test.js:134-182`; concrete conservation replay in `.orch/tickets/level26-move1-envelope-2026-08-11.md:65-80`.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-11
- **reverify:** Run `node --test solver/tests/engine.test.js solver/tests/exact-score.test.js`; expect all tests to pass, then inspect the cited symbols.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### FACT-0004 — Level 26 configuration

- **type:** fact
- **status:** accepted
- **scope:** shipped Level 26
- **statement:** Level 26 has a 5×8 grid, no blockers, a minimum chain length of 4, 32 moves, and a 13,000-point target.
- **evidence:** `src/game.js:63-65`, `LEVELS` entry for level 26.
- **proof_class:** `direct_source`
- **as_of:** 2026-08-11
- **reverify:** Inspect the exported `LEVELS` entry for level 26; expect target 13000, moves 32, minChain 4, gridW 5, gridH 8, and no blockers.
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

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

## Assembly cut log

- Omitted draft labels and repeated draft identities because the root ledger is the assembled authority surface.
- Omitted heuristic win-rate samples and terminal-board anecdotes because they do not bear on the frozen proof question.
- Omitted the failed near-target artifact because the certification worklog marks it unaccepted; the accepted lower bound remains 12,336.
- Kept the full protocol and all 15 seeded records; no acceptance coverage was cut for length.

## Resume boundary

Active work resumes at level tuning: choose a difficulty standard for the shipped levels and set targets from measured achievable score (`DECISION-0002`, `RESULT-0005`). The open design question is what win rate a target should imply and for which player; the current bot is a weak proxy and understates a skilled player by an unquantified margin.

The proof track is parked, not closed. It resumes from the unresolved **12,336–326,390** interval for frozen Level 26 seed 0. Closure still requires an accepted replayed 13,000 witness, an exact result, or a proven upper bound below 13,000; heuristic misses, terminal boards, timeouts, and `UNKNOWN` remain non-decisive.
