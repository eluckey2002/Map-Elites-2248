# Goal 3 revision 5 — exploration plan

Owner-selected 2026-10-04. Assigned RESULT-0083. This plan must be committed before the first fresh game and becomes immutable then. Exploration artifacts are diagnostic, live under solver/policy-fit/runs/ or this goal's documentation, and are never offered as confirmation evidence. A direct_source closure may describe exact application of the frozen rules without generalizing exploration observations.

## Subject and dependencies

Base: origin/main 6fea334c2f5fd61a86cce4a1842cb9b03f709ee1. PR61 merge cd83127f176111a0b0fb40eb14402f301a1fab07 is an ancestor. Statistics and target-stop outcome decisions import solver/ruler/core.js unchanged. Do not import ruler/config.js LEVELS: import all 58 shipped levels from src/game.js. Implement a separate loop and pool/worker in solver/policy-fit/ if the prerequisites allow fresh games. Never change bot.js, engine.js, level-author.js, generate-levels.js, src/game.js, calibrations/calib-1.js, solver/ruler/, experiments/RESULT-0058/, existing tests, shipped levels, targets, or rules.

## Features, labels, fit, and policy

Fit standardized ridge regression, penalty alpha = 1, unpenalized intercept. Fit full and simple judges separately to the same chosen-move labels, split by entire games (sixth seed of each T block is held out, other five seeds train). Fit statistics are informational; no fit-quality selection threshold.

Full features of candidate post-move, post-spawn boards: tile counts for each tileScale doubling exponent 0 through 16, plus a higher-exponent overflow count; neutral off-lattice tile count (CORRECTION-0008); undirected king-adjacent equal pairs and double pairs, each counted once; points still needed / tileScale; moves left; cells emptied; immediate chain points / tileScale; champion rollout, placement, turnover, and harvest contributions / tileScale. Stones do not count as value-bearing tiles. The two-feature simple judge uses only remaining points / tileScale and moves left.

Label is additional moves from that post-move board until target crossing. For a losing game, label = remaining budget at that board + P, P = 10. Rows are recorded after the actual chosen chain and actual spawn, never labelled with an unplayed alternative's outcome. Exploration makes alternate candidates receive real outcomes by choosing uniformly among the top three candidates (or all if fewer) with epsilon = 0.20. Bomb priority and immediate target finish retain champion behavior.

K = 3 independent sampled spawn sets, common random numbers across candidates, bases deterministically derived from block seed, move index, and sample index, separate from real spawn RNG. Judge contribution J = minus the average predicted remaining moves on those post-move, post-spawn boards. Blend total = champion total + lambda × J, lambda = 32 × tileScale. lambda = 0 delegates exactly to chooseMove, including its target-aware finish. No generator modification or new chain generation. Champion four ranking terms and tie order remain intact. The current round's carried model determines the next round's training policy; initial policy is the champion.

## Panels and resource ledger

Gate G, every recheck R, and every control C have ONE design: all 58 levels × 10 seeds = 580 games per policy panel. Other designs in the historical table are information only. Training T1–T6: all 58 levels × 6 seeds = 348 games each. Confirmation F: all 58 levels × 150 seeds = 8,700 games per arm, 17,400 paired games. Every block's champion reference panel is run once and shared only inside that block; never share reference games across blocks. Recheck Ri is used for exactly one round and then burned. G is fixed across rounds. Every block is reserved in SEEDS.md before use; no block is reused as fresh evidence.

| Block | First seed | Last seed | Seeds/level | Role |
|---|---:|---:|---:|---|
| T1 | 70000000 | 70000005 | 6 | training round 1 |
| T2 | 70001000 | 70001005 | 6 | training round 2 |
| T3 | 70002000 | 70002005 | 6 | training round 3 |
| T4 | 70003000 | 70003005 | 6 | training round 4 |
| T5 | 70004000 | 70004005 | 6 | training round 5 |
| T6 | 70005000 | 70005005 | 6 | training round 6 |
| G | 70100000 | 70100009 | 10 | fixed gate |
| R1 | 70200000 | 70200009 | 10 | recheck round 1 |
| R2 | 70201000 | 70201009 | 10 | recheck round 2 |
| R3 | 70202000 | 70202009 | 10 | recheck round 3 |
| R4 | 70203000 | 70203009 | 10 | recheck round 4 |
| R5 | 70204000 | 70204009 | 10 | recheck round 5 |
| R6 | 70205000 | 70205009 | 10 | recheck round 6 |
| C1 | 70300000 | 70300009 | 10 | zero effect and small harm |
| C2 | 70301000 | 70301009 | 10 | zero effect and small harm |
| C3 | 70302000 | 70302009 | 10 | zero effect and small harm |
| C4 | 70303000 | 70303009 | 10 | zero effect and small harm |
| C5 | 70304000 | 70304009 | 10 | zero effect and small harm |
| C6 | 70305000 | 70305009 | 10 | zero effect and small harm |
| C7 | 70306000 | 70306009 | 10 | zero effect and small harm |
| C8 | 70307000 | 70307009 | 10 | zero effect and small harm |
| O | 70400000 | 70400019 | 20 | parity, inert, null overhead |
| F | 70900000 | 70900149 | 150 | confirmation only |

Budgets frozen: training 10,000; rounds/gate/recheck/simple 30,000; controls 15,000; confirmation 20,000 RESERVED (no borrowing); overhead including historical bot recompute replays 5,000; buffer 10,000; total 90,000. One game is one level/seed/policy play, references counted once, replay games charged as overhead. Increment reservations before scheduling jobs, persist counts and outcomes continuously. At most 4 workers. Stop before a job exceeding a sub-budget; maximum 6 rounds and one confirmation. Round 1 prints elapsed wall time and summed worker elapsed time, keeping those separate from physical CPU time. Each paired arm prints elapsed compute cost, and round 1 projects the remaining workload.

## Historical prerequisites, frozen before fresh games

Item 1 prints HEAD, branch, baseline suite's observed failure names, remote ID check, and SEEDS.md. RESULT-0081 conflict means RESULT-0083 replaces it everywhere. Preserve raw output.

Item 2 reads RESULT-0049/corpus.json, champion versus base, all levels with 300 seeds; RESULT-0058/raw-games.json positive3000 panel cross-checks its twelve levels. Print per-level sample variance on mutual-win paired move differences and source coverage. No challenger pairs exist in either history. twoAxis provides the historical level and seed standard errors. For planned seed counts, project historical seed standard error by sqrt(300/plannedSeeds); level standard error is unchanged for 58 levels. Use the larger axis as the standard error, matching core.js. Print both axes, 1.96×SE half-width, and 2.8×SE detectable gain at 5% significance and 80% power, explicitly conditional on historical champion-vs-base variance. Adding seeds does not shrink level-axis error. After zero-effect controls print their move uncertainty and the larger historical/control detectable gain.

Item 3 replays EVERY recorded session resolved by the existing human benchmark's corpus discovery. At every recorded position call analyzeMove with defaults and lookaheadRngFactory = () => makeRng(987654321 + moveIndex). Validate recorded chains against replay and exclude bomb-priority moves, printing their count. Compare owner immediate points with maximum pool immediate points and bot chosen points overall, on levels 56–58, and on the diagnostic subset. Subset = owner-faster boards among mutual target-stop wins, and owner chain points above bot choice. N_MIN = 30. Below N_MIN print exactly `ceiling check inconclusive: subset too small (n = ...)` and continue. At or above N_MIN, if pool points below owner points on at least half the subset, print exactly `Candidate coverage failed the prerequisite for this ranking experiment; stop and report a generation bottleneck.` and close Path E. No conclusion applies outside that subset. Unresolvable or unreplayable sessions stop as an unmet item; do not silently omit them or claim item 3 completed.

## Control bars

PARITY: ≥200 level/seed cells, independent ruler/game.js champion and new loop, identical traceIdentity. INERT: ≥1,000 decision cells with exact chain equality at lambda = 0, including target finish. NULL: champion through new pipeline, zero wins gained/lost and moves difference. Replay/inert/null O blocks are overhead, not confirmation.

PLANTED FUNCTION: synthetic independent training and held-out data from deterministic feature inputs, known linear function plus bounded noise; held-out R² ≥0.95 for ridge. This is a synthetic fit check, no game expenditure. LEAKAGE: training, gate, recheck, controls, overhead, and confirmation seeds all pairwise disjoint and inside the authorized range. The learning/evaluation pipeline reads no recordings; preflight alone reads historical recordings for the mandatory generation diagnostic. Print every data/source path read by each pipeline phase.

ZERO EFFECT: champion alternate lookahead base 135791113 against champion base 987654321 on C1–C8; apply ACCEPTED directly per fresh block, no extra gate/recheck. ≤1 of 8 blocks ACCEPTED; ≥2 stops Path C. Eight blocks only catch a large false-accept rate; sanity check, not calibration. SMALL HARM: champion takes its second-ranked candidate on every tenth move, otherwise champion; rank target override first then score order, stable generated-order ties, bomb-priority stays one candidate. Print mean moves lost and fraction of eight blocks whose lower bound on mean lost is >0. Fraction ≥0.80 (at least 7/8) required; below stops Path C. One champion reference per C shared between both controls. Freeze no other control thresholds.

## Loop and decision rules

PROMISING: net wins ≥0 and gate mean moves saved >0. ACCEPTED: net wins ≥0 and recheck lower 95% bound on mean moves saved >0. Print wins gained/lost, both uncertainty axes, means, intervals, and cost. Every trained round gets its one fresh recheck, even if G is not promising, to support the specified carried-round choice. Full judge must also be ACCEPTED against the two-feature simple judge on the same recheck block, or learning beyond the simple judge is INCONCLUSIVE. Simple judge gate/recheck games share reference panels.

At least 4 and at most 6 rounds unless a named control, prerequisite, budget or protected-file stop occurs. Fixed probe: first 200 post-move boards from T1 persisted once before evaluating later rounds. After round 4, early convergence requires mean absolute prediction change <0.02 moves twice consecutively. No changing probe after outcomes. Round status: converged if tolerance rule; else oscillating if consecutive mean-saving signs changed; else plateaued if last two recheck means differ by at most the larger of their standard errors; else progressing. Report held-out fit quality, label summary, training row counts and moves, gate/recheck and simple comparisons, and cost. Carry best recheck mean among rounds with net wins ≥0, tie earlier. If none eligible, retain champion.

## Confirmation and valid closures

After exploration, if any round ACCEPTED and ahead of simple judge under its ACCEPTED rule, select the eligible round with best recheck mean, tie earlier. Commit model and chooser first. Register ONE RESULT-0083 confirmation protocol with tools/new-experiment.js, freezing chooser, model, thresholds, F and all confirmation sources by hash BEFORE any confirmation game. One run, no rerun. Persist complete all-58 paired games with tools/persist-before-verdict.js before verdict. Primary SUPPORTED iff net wins ≥0 and lower 95% move-saving bound >0; FALSIFIED iff net wins <0 or upper 95% bound ≤0; otherwise INCONCLUSIVE. Report levels 56–58 and levels 1–55 as secondary only: they cannot rescue overall FALSIFIED or INCONCLUSIVE.

A separate arithmetic/recompute script imports neither runner, statistics nor loop code. On Path A it imports only Node builtins, engine, bot, and frozen chooser/model by exact protocol path/hash; verifies every headline and prints MATCH or diff. Same-author arithmetic reimplementation is NOT independent verification. Actual Codex PR reviewer is the distinct acceptance reviewer; no self-approval and no checked_by.

Path A CONFIRMED: items 1–12, provisional heuristic_observation, registered protocol. Path B NO_CANDIDATE: items 1–9, item 9 NO_CANDIDATE, item 12 exploration coverage, no 10/11; report controls, per-round table, detectable gain and exact sentence `no round was ACCEPTED and ahead of the simple judge at this resolution`. Never claim learned judges cannot help. Path C CONTROL FAILURE: items 1–4 and failing control raw output. Path D BUDGET OR EFFORT STOP: exhausted bound and raw completed items. Path E GENERATION BOTTLENECK: items 1–4 and item 3 tables, subset definition and no claim outside it. Paths B–E use provisional direct_source only, exact measured scope. Do not invent a named closure if required items cannot be met; report the unmet item and stop.

Item 12 reads frozen plan, optional registered protocol and every raw artifact. Asserts all actually-run G/R/C panels cover 58×10, training 58×6, blocks disjoint and inside range. Only Path A asserts F≥58×150. Unrun blocks print `not run`, never FAIL. Any coverage FAIL makes closure INVALID, with FAILED-RUN-LEDGER.CSV row, implemented prevention artifact and negative test. Every retained INVALID/UNVERIFIED closure has that same failed-run treatment.

## Allowed writes, stops and closeout

Only new solver/policy-fit/ and solver/tests/ files; experiments/RESULT-0083/; SEEDS.md append only; this goal directory; FAILED-RUN-LEDGER.CSV append for failed closure only; EVIDENCE_LEDGER.md; generated LEDGER-INDEX.md; CURRENT.md; History only for touched backlogs. Blackboard operational writes and friction logs follow standing instructions. Do not append HANDOFF.md. No sub-agents. Stop for unmet required item, protected-file violation, third failure of a step, bound exhausted. Nothing changes thresholds after first fresh game.

Closeout: all run worklogs finish with ledger line; provisional record with written_by, no checked_by; ledger-index generated and committed; CURRENT cites record; History appended if backlog touched; baseline-named failures only, no existing test edits/skips; verify-experiments passes. Publish to user's verified repository, PR open, experiment gate green, actual Codex review completed and findings answered. DO NOT MERGE or promote. Retain worktree while PR open. Blackboard submitted until actual reviewer decision.
