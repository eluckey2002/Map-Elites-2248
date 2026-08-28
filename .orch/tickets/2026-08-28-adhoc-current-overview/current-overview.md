# Current game and research overview

- Status: complete
- Question: What is the current state of the shipped game and its research, and is the evidence sufficient to pivot into MAP-Elites now?
- Source policy: `EVIDENCE_LEDGER.md`, then `CURRENT.md`, then primary repository artifacts directly cited or linked by those files. For the pivot-readiness question, also inspect the isolated read-only MAP-Elites experiment at `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites`, beginning with its named verifier. Memory may locate that checkout but may not establish current standing.
- Bound: read the two required status files, at most 12 directly cited project artifacts, and at most 5 artifacts from the isolated MAP-Elites checkout; run existing verifiers only, not new experiments; do not alter game, solver, backlog, ledger, archive, or experiment state.
- Oracle: the result is accepted if every substantive status claim cites current repository evidence, proof classes remain distinct, contradictions and unknowns are explicit, and shipped game state is separated from research state and planned work.
- Evidence independence: the ledger is the standing authority; cited primary artifacts are checked as corroborating receipts. Backlog and chat are intent only.

## Acceptance criteria

- Explain the game and what is currently shipped.
- State the strongest established research results without promoting lower bounds, heuristics, or unknowns.
- Identify the active milestone and immediate backlog items.
- Give a graded yes/no answer on MAP-Elites readiness, separating readiness to experiment from readiness to replace the current game direction or adopt a champion.
- Name contradictions, dead ends, and what the investigation bound leaves uncovered.

## Result

### Status and result identity

- Status: `complete`
- Evidence packet: this ticket, `.orch/tickets/2026-08-28-adhoc-current-overview/current-overview.md`
- Oracle verdict: `PASS` — the overview can distinguish shipped/admitted state, working-tree state, research proof classes, and three different MAP-Elites decisions: experiment, product-direction pivot, and champion adoption.

### Cited findings

1. **The admitted game is healthy through Level 52; the current dirty checkout also contains a pending Level 53.** `RESULT-0008`, `RESULT-0009`, and `RESULT-0012` admit the retuned curve and Levels 51-52. The exact working tree exports 53 levels and its live curve gate passes all seven checks, including `53/53` target/tile-scale coverage, 92% win rate and 0% lockouts at sampled Level 50. `src/game.js` and its associated tests add Level 53 only as uncommitted work, so it is not promoted to ledger-admitted shipped status here. Confidence: high.
2. **The old Level 26 proof question is parked and unresolved.** Accepted evidence remains a replayed 12,336 lower bound, a non-decisive proven 326,390 upper bound, exact move-one maximum 430, and `UNKNOWN` threshold searches above 12,336. Neither 13,000 reachability nor the exact 32-move maximum is known. Confidence: high.
3. **The level curve was repaired, but the product still carries design debt.** Targets now use measured demand and chapter tile scaling; the late curve is winnable. Roughly 15 target steps descend, much of the back half reuses one 5x7/min-chain-4 shape, human evidence comes from one person, and bot-derived target comparability is split across bot eras. Confidence: high for recorded state, medium for design implications.
4. **Bot research found structural gains, not proof of human strength.** Accepted heuristic results include +5.25% from a path tie-break, +2.60% from preserving harvestable built tiles, and +23.00% from a corrected width-8 low-value path beam. These are paired bot-score improvements and do not establish optimal play, human difficulty, or a Level 26 bound. Confidence: high within the recorded scopes.
5. **MAP-Elites is already technically viable as a bounded research method here.** The isolated `map-elites-learning` checkout has accepted `RESULT-0017`: a 5x5 archive with 20 occupied cells, all five bins represented on both axes, and three replayed representatives. The independent verifier passed in this investigation and protected the champion and level-authoring hashes. Confidence: high for artifact integrity and bounded archive behavior.
6. **The existing MAP-Elites run does not support replacing the champion.** Its best-looking representative measured +3.30% on its selection screen and -3.57% on disjoint holdout cases. The result proves discoverable behavior diversity and a functioning archive, not a stronger policy. Confidence: high.
7. **There is enough evidence to pivot into a scoped MAP-Elites program, but not enough to abandon the current game direction or claim a learned champion.** For 2248, the correct use is behavior-space exploration with screen/holdout separation and explicit noisy-fitness controls. If the objective is exact, stable fitness, the evidence supports prototyping a deterministic puzzle next, but no Rush Hour, Sokoban, or Nonogram engine/solver is present in either inspected checkout. Confidence: high on the readiness distinction; the choice of domain remains an owner decision.

### Verification

- `node solver/verify-loop.js` on the exact 2248 working tree: `RESULT: PASS`, all seven curve checks, 53/53 configuration coverage.
- `node --test solver/tests/*.test.js`: 190/198 inside the sandbox. Five localhost failures were environmental (`listen EPERM`) and passed 5/5 when rerun with socket permission. The remaining three are the project-preserved stale receipt-identity failures for candidate 52, candidate 54, and the current candidate store; they were not weakened or repaired.
- `node solver/verify-map-elites.js solver/map-elites-output` in the isolated checkout: `PASS`, 20 occupied cells, five chain bins, five patience bins, three representative replays, protected champion `52f500c` and authoring hashes unchanged.

### Contradictions

- `CURRENT.md` says the tracer has only shipped Level 51 and that the generator does not exist; newer accepted records and handoff history show Levels 51-52 shipped and a generator was built. Treat `CURRENT.md` as stale navigation where those claims conflict.
- The main checkout's uncommitted source and tests call Level 53 shipped, while the authoritative ledger has no Level 53 admission record. This result preserves the discrepancy instead of blending it.
- The 2026-08-18 handoff's instruction to stop all 2248 level generation was explicitly narrowed on 2026-08-20: the noisy result applied to reseeding one shape, not structurally varied levels. It does not by itself authorize a total product pivot.

### Dead ends

- No deterministic Rush Hour, Sokoban, or Nonogram implementation was found outside navigation prose in either inspected checkout.
- The main 2248 checkout contains no MAP-Elites output; the accepted experiment lives only in the isolated `map-elites-learning` checkout.

### Gaps left by the bound

- No new MAP-Elites run, larger archive, alternate descriptor study, or noise-aware 2248 archive was executed.
- No deterministic puzzle prototype was built or benchmarked, so exact-fitness performance and human interest remain untested.
- No external-player evidence exists in the inspected records; recorded human comparison is still one owner.
- The dirty working tree's Level 53 has not been reconciled with the append-only evidence ledger in this investigation.
