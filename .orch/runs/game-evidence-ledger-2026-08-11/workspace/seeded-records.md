# Seeded records draft

Draft identity: `game-evidence-ledger-2026-08-11/seeded-records`

## Current snapshot

As of 2026-08-11, the active proof question is narrow: under the shipped rules, can the frozen Level 26 seed-0 initial board and spawn stream reach 13,000 in 32 moves, and what is its exact maximum? The frozen input identity is `edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`. The best accepted score is a replayed lower bound of **12,336**. A complete relaxation gives a proven upper bound of **326,390**, but that bound is non-decisive because it exceeds the target. The exact maximum and target reachability remain unresolved. (`solver/tests/exact-score.test.js:77-85`; `.orch/runs/level26-certified-score-2026-08-10/worklog.md:60-69,111-120`)

The exact move-one maximum is **430**, but this does not identify the first move that maximizes the 32-move total. Threshold checks above 12,336 returned `UNKNOWN`; they rule out no score. Continue only with proof-oriented work that preserves the frozen scope. (`.orch/tickets/level26-move1-envelope-2026-08-11.md:57-69,105-111`; `solver/hinted-cp-sat/frozen-run.json:1-35,2375-2412`)

Repository baseline for this documentation run is `main` at `10a849d5336bdda89d2d3f5ed1f1ca87e536811d`, with pre-existing dirty work preserved. Recheck with `git status --short --branch` and `git log -1 --format='%H %s'`. (`.orch/runs/game-evidence-ledger-2026-08-11/worklog.md`, **State**)

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
- **evidence:** `.orch/tickets/level26-move1-envelope-2026-08-11.md:29-36,57-69`; position-aware enumerator invariants in `solver/tests/exact-score.test.js:31-68`.
- **proof_class:** `exact_result`
- **as_of:** 2026-08-11
- **reverify:** Follow the accepted pre-existing complete-enumerator and concrete-replay oracle recorded in `.orch/tickets/level26-move1-envelope-2026-08-11.md:29-36`.
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

## Decision registry

### DECISION-0001 — Keep the feasibility study frozen

- **type:** decision
- **status:** accepted
- **scope:** current Level 26 feasibility study
- **statement:** Preserve the shipped rules and evaluate one Level 26 seed-0 sequence. Do not substitute target changes, scoring changes, or generic bot tuning for the proof question.
- **evidence:** `.orch/runs/level26-certified-score-2026-08-10/worklog.md:3-9,34-39`; historical correction in `HANDOFF.md:38-68`.
- **proof_class:** `owner_decision`
- **as_of:** 2026-08-11
- **reverify:** not_applicable
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

### DECISION-0002 — Admit only decisive proof to close reachability

- **type:** decision
- **status:** accepted
- **scope:** reporting and continuation
- **statement:** Do not call 13,000 impossible from heuristic misses, terminal boards, timeouts, `UNKNOWN`, or a loose upper bound. Continue through a streaming or partitioned physical frontier with a materially tighter complete tail abstraction, or another exact formulation that produces a replayed witness or decisive bound.
- **evidence:** `HANDOFF.md:38-65`; `.orch/runs/level26-certified-score-2026-08-10/worklog.md:93-109,137-152`.
- **proof_class:** `owner_decision`
- **as_of:** 2026-08-11
- **reverify:** not_applicable
- **updated:** 2026-08-11
- **supersedes:** []
- **superseded_by:** []

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

## Cut log

- Omitted heuristic win-rate samples and terminal-board anecdotes from the registries because they do not bear on the frozen proof question.
- Omitted the failed near-target artifact because the certification worklog marks it unaccepted; the accepted lower bound remains 12,336.
