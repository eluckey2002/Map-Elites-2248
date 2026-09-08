---
id: current-game-state
run: 2026-08-29-current-game-state
status: complete
executor: orch-investigate
independence: checker
depends_on: []
write_scope: []
excluded_actions:
  - modify game, solver, backlog, or evidence-ledger content
  - commit, push, or publish
bound: 45 minutes; targeted reads of current status sources and directly cited primary artifacts only
claimed_by: /root
claimed_at: 2026-08-29T18:28:14-05:00
---

## Objective

Produce a source-backed snapshot of the game's verified playable state, active milestone, and main remaining uncertainty.

## Fixed inputs

- `EVIDENCE_LEDGER.md` at Git `788cfac3501677bc596018526269c6d7b86fc72a`
- `CURRENT.md` at Git `788cfac3501677bc596018526269c6d7b86fc72a`
- Primary repository artifacts directly cited by those two sources
- Current worktree identity and status from Git

## Completion test

1. The snapshot distinguishes current implementation, current proof standing, and planned/open work. Oracle: source-resolution procedure required by `AGENTS.md` (ledger, then current milestone, then cited primary artifacts); oracle_class: evidence; provenance: pre-existing.
2. Every material game-rule, solver-result, score-feasibility, and experiment-status claim has a resolving repository citation that supports its proof class. Oracle: `EVIDENCE_LEDGER.md` record schema and cited source check; oracle_class: evidence; provenance: pre-existing.
3. Contradictions, dead ends, and uncovered scope are explicitly reported. Oracle: `orch-investigate` return contract; oracle_class: evidence; provenance: pre-existing.

## Return fields

- status
- result identity
- verification verdict
- cited findings with confidence
- contradictions
- dead ends
- gaps and bound

## Result

Status: complete.

Result identity: this evidence packet, `.orch/tickets/2026-08-29-current-game-state/status.md`, covering Git `788cfac3501677bc596018526269c6d7b86fc72a` on branch `level-curve-retune`.

### Cited findings

1. **The shipped game is a working 52-level browser puzzle. Confidence: high.** `src/game.js:33-112` contains 52 shipped level records; Level 52 is a 5x7, min-chain-4, 24-move, scale-32 board with one stone and target 102,000. `node --test solver/tests/*.test.js` returned 144/144 passing on 2026-08-29. The checked-out source is ahead of `CURRENT.md`'s description of Level 52 as only ready to ship; `EVIDENCE_LEDGER.md:385-398` and `HANDOFF.md:32-44` agree with source that Levels 51 and 52 shipped.
2. **The current curve gate is green. Confidence: high within its sampled bot-policy scope.** `node solver/verify-loop.js` exited 0 on 2026-08-29: 52/52 levels have targets and tile scales, hardest sampled level Level 50 wins 57%, and sampled lockout and bomb-failure rates are 0%. This is a heuristic policy sample, not a bound on human difficulty. `EVIDENCE_LEDGER.md:415-428` records the harvest-policy improvement that removed sampled lockouts.
3. **The level-authoring and random level-generator tooling exists, but its calibration boundary is unfinished. Confidence: high.** `solver/generate-levels.js` and its tests are present; the newest handoff records four generated batches and gen-0014 (`HANDOFF.md:135-175`). `solver/level-author.js:14,127` still calls the live bot, while `solver/calibration.js` defines a frozen ruler. The handoff's open item at `HANDOFF.md:137-144` is confirmed by source.
4. **gen-0014 is a strong but not currently receipt-valid candidate, and it is not shipped. Confidence: high.** `solver/candidate-levels.json:2-17` describes a 6x5, 16-move, min-chain-3 candidate at target 101,000. Its receipt records 191/300 holdout wins and zero lockouts (`solver/candidate-levels.receipt.json:24-43`), and `recordings/7061bbf0132f36d071d6aa1367653116bbac064777a13461cda3e5e170f39af0.json` is the retained human play. However, the pre-existing verifier command `node solver/author-level.js --verify solver/candidate-levels.json solver/candidate-levels.receipt.json` currently returns `FAIL: code/input identity mismatch`. It therefore remains a candidate/lead until re-authored under a frozen calibration identity or explicitly adjudicated; it is absent from shipped `LEVELS`.
5. **The live 2248 project has not implemented a real MAP-Elites archive. Confidence: medium-high under the bounded repository search.** `HANDOFF-NEXT-MAP-ELITES.md:131-170` explicitly distinguishes the existing sample/measure/rank/top-K pipeline from an archive with mutation and iteration. A targeted repository search found policy-search references and generator artifacts, but no archive implementation or accepted archive result.
6. **The frozen Level 26 exact-proof question is parked and unresolved. Confidence: high.** `EVIDENCE_LEDGER.md:223-277,446-459,508-548,603-609` preserves a replayed lower bound of 12,336, a non-decisive proven upper bound of 326,390, `UNKNOWN` threshold attempts, and open reachability/exact-maximum questions. None of today's checks changes that proof standing.

### Contradictions

- `CURRENT.md:7-11,27` is stale against newer evidence and source: it treats Level 52 as unshipped, says the actual generator does not exist, and says late-level sampled lockouts persist. Current source has Level 52; generator code exists; today's curve gate saw 0% sampled lockouts.
- The ledger's top snapshot still speaks in terms of 50 levels (`EVIDENCE_LEDGER.md:15-19`), while later accepted records and current source contain 52. The per-record registry and primary source are newer than that snapshot prose.
- `HANDOFF.md:145-157` calls gen-0014 ready to ship, but the current repository verifier rejects its receipt identity. Human-play evidence remains retained; machine qualification is not currently green.
- The 2026-08-18 MAP-Elites handoff said to stop 2248 generation, while the later 2026-08-21 commit resumed generation and retained gen-0014. The newer checkout describes what actually landed; neither creates a MAP-Elites implementation.

### Dead ends

- `CURRENT.md` and the ledger's top snapshot were useful navigation but not sufficiently fresh to answer current shipped count, generator existence, or lockout-gate status without checking source and commands.
- Repository name and MAP-Elites planning documents did not identify a working MAP-Elites archive; the implemented system remains a level generator plus evaluators and policy searches.
- Pre-existing untracked `.orch/tickets/2026-08-29-*` folders were not used as game evidence.

### Gaps and bound

- No browser/rendered playthrough was run, so this packet does not assess current visual polish, feel, input ergonomics, or whether a local server is presently running.
- The curve gate samples 60 bot seeds on eleven levels; it does not establish human difficulty or prove lockouts impossible.
- The bounded search did not reconstruct the entire development history or re-run expensive policy-search experiments.

## Verification

1. PASS — evidence oracle: required source-resolution order was followed (`EVIDENCE_LEDGER.md`, then `CURRENT.md`, then cited source, tests, receipts, and current Git identity). Covers Git `788cfac3501677bc596018526269c6d7b86fc72a` and this result.
2. PASS — evidence oracle: all material rule, solver, feasibility, and experiment claims above cite resolving repository sources and retain the ledger's proof classes. Covers the cited findings in this packet.
3. PASS — evidence oracle: contradictions, dead ends, gaps, and the read bound are explicit above. Covers this packet.

Overall: PASS (weakest oracle class: evidence).

## Feedback

[]

## Risks

[]
