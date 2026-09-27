# Loop ladder record

## Part 1. Pin

| Field | Value |
|---|---|
| Project | Map-Elites-2248 |
| Date | 2026-09-23 |
| Commit hash (`git rev-parse --short HEAD`) | c5730c3 (branch main) |
| Record type | audit |
| Filled in by | Codex (GPT-6) |

## Part 2. Run record

This describes the audit itself.

| Field | Value |
|---|---|
| Task | Repository-wide loop ladder audit of code loops, gates, and agent/process loops |
| Ceiling | reread and revise |
| Starting rung | generate once |
| Ending rung | reread and revise |
| Result | passed |

Escalations:

| From rung | To rung | What triggered it |
|---|---|---|
| generate once | reread and revise | Direct inspection of source and current instructions was needed to distinguish executable loops, gates, and process rules from historical mentions. |

## Part 3. Loop inventory

| Loop | Loop kind | Entry (file:line) | Ceiling | Runs at | Same-source pair | Trigger | Blocks | Stop rule | Cost evidence | Recommendation | Basis |
|---|---|---|---|---|---|---|---|---|---|---|
| Level shape generation and screening | code loop | solver/generate-levels.js:250 | repeated with varied inputs | repeated with varied inputs; rank candidates | no | by hand | no | fixed count | no | record cost | verified [read generate-levels.js:250-350; iteration and candidate loop at 284-333] |
| Board and seed search | code loop | solver/search-boards.js:64 | repeated with varied inputs | repeated with varied inputs; rank candidates | shared functions (solver/search-boards.js:64-94, solver/fixed-board.js:114-149) | by hand | no | fixed count | no | record cost | inferred [searchBoards iterates board seeds; fixed-board runs fit and holdout ranges; no runtime cost record checked] |
| Level authoring fit and holdout | code loop | solver/level-author.js:128 | one external check | one external check | no | by hand | no | fixed count | yes, 450-seed replay described in docs/CHECK-CARDS.md:27 | record cost | verified [level-author.js:128-153,255-321; docs/CHECK-CARDS.md:27] |
| Candidate receipt verification | gate | solver/level-author.js:255 | one external check | one external check | identical rerun later (solver/level-author.js:255-321, solver/tests/receiptGate.test.js:372-385) | test suite | no | none | no | make it block | inferred [receipt test invokes it; no standalone blocking integration was verified] |
| Policy parameter search | code loop | solver/policy-search.js:131 | repeated with varied inputs | repeated with varied inputs; rank candidates | no | by hand | no | fixed count | no | record cost | verified [policy-search.js:131-188; protocol guard at 57-62] |
| MAP-Elites mutation and evaluation | code loop | solver/map-elites.js:236 | repeated with varied inputs | repeated with varied inputs; rank candidates | identical rerun in the same process (solver/map-elites.js:259-280 reevaluates generated mutants, solver/map-elites.js:264 caps failed batch attempts) | by hand | no | fixed count | no | record cost | verified [map-elites.js:236-282; configuration cap at 108,133-147] |
| Level curve sweep | code loop | solver/sweep.js:49 | repeated with varied inputs | repeated with varied inputs | no | by hand | no | fixed count | no | none | inferred [sweepLevel entry at solver/sweep.js:49-63; seed behavior not fully inspected] |
| Exact position search | code loop | solver/exact-score.js:166 | one external check | one external check; rank candidates | no | by hand | no | budget | no | none | verified [exact-score.js:166-206; node-cap failure at 180] |
| Relaxed upper-bound search | code loop | solver/exact-score.js:310; solver/upper-bound.js:27 | one external check | one external check; rank candidates | shared functions (solver/exact-score.js:310-342, solver/upper-bound.js:33-106) | by hand | no | budget | no | none | verified [node caps and fail-closed behavior at exact-score.js:310-325 and upper-bound.js:27-60] |
| Beam witness search | code loop | solver/exact-score.js:380 | one external check | one external check; rank candidates | no | by hand | no | target reached | no | none | verified [beam depth loop solver/exact-score.js:380-410] |
| Targeted chain generation | code loop | solver/targeted-chain-generator.js:105 | one external check | one external check; rank candidates | no | by hand | no | budget | no | none | verified [generator and node cutoff at targeted-chain-generator.js:105-175] |
| Experiment registration guard | gate | solver/experiment-guard.js:28 | one external check | one external check | shared functions (solver/experiment-guard.js:28-68, tools/verify-experiments.js:487-574) | by hand | yes | none | no | none | verified [requireProtocol rejects unregistered non-exploratory work; experiments.test.js:91-126 exercises it] |
| Experiment evidence gate | gate | tools/verify-experiments.js:487 | one external check | one external check | no | test suite; push hook; continuous integration | yes | none | no | none | verified [workflow .github/workflows/experiment-gate.yml:13-30; tools/hooks/pre-push:13-18; solver/tests/experiments.test.js:76-82] |
| Candidate receipt corpus gate | gate | solver/tests/receiptGate.test.js:372 | one external check | one external check | identical rerun later | test suite | no | none | no | make it block | inferred [test walks the candidate store at receiptGate.test.js:372-385; CI test-suite job is continue-on-error at .github/workflows/experiment-gate.yml:32-44] |
| MAP-Elites artifact verifier | gate | solver/verify-map-elites.js:18 | one external check | one external check | shared functions (solver/verify-map-elites.js:18-65 imports producer helpers) | by hand | no | none | no | wire a trigger | inferred [standalone verifier entry and PASS path at verify-map-elites.js:18-78; no automated invocation found in searched tests/workflows] |
| Level curve health verifier | gate | solver/verify-loop.js:31 | one external check | one external check | no | nothing | no | fixed count | no | wire a trigger | verified [checks at verify-loop.js:31-60; CURRENT.md documents command under Useful commands, while searched tests/workflows had no invocation] |
| Universe Map verifier | gate | tools/verify-universe-map.js:8 | one external check | one external check | no | test suite; by hand | no | none | no | make it block | inferred [entry at verify-universe-map.js:8-13; universeMap tests reference generated inputs at solver/tests/universeMap.test.js:36-37; full-suite CI is non-blocking] |
| Pull request experiment gate | agent process | AGENTS.md:47 | one external check | one external check | no | continuous integration | yes | target reached | no | none | verified [required PR gate and merge rule at AGENTS.md:47-68; workflow job at experiment-gate.yml:13-30] |
| Pull request review and finding resolution | agent process | AGENTS.md:58 | external check repeated | reread and revise; external check repeated | no | by hand | by rule only | target reached | no | record cost | verified [review completion, findings, resolution, and ownership rules at AGENTS.md:58-68] |
| Experiment protocol, execution, and admission | agent process | AGENTS.md:34 | one external check | one external check | no | by hand; test suite; push hook; continuous integration | yes | target reached | no | none | verified [protocol-before-run rule at AGENTS.md:34-46; execution guard at experiment-guard.js:28-68; admission gate triggers in workflow and hook] |

## Part 4. Extra rounds

| Loop or run family | Round | Source used | Trigger class | Changed the result | Confound | Evidence (file:line) | Basis |
|---|---|---|---|---|---|---|---|
| Pull request 7 protocol drift test review | 2 | rereading | reviewer finding | yes | artifact changed between rounds | solver/tests/experiments.test.js:424-432 | verified [comments tie additional cases to Codex review rounds 2 and 3] |
| Pull request 7 protocol drift test review | 3 | rereading | reviewer finding | yes | artifact changed between rounds | solver/tests/experiments.test.js:432-441 | verified [comment identifies round 3 and the added newline edge case] |
| Pull request 7 protocol drift test review | 4 | rereading | reviewer finding | yes | artifact changed between rounds | solver/tests/experiments.test.js:441-448 | verified [comment identifies round 4 and lifecycle-line behavior] |
| Pull request 7 protocol drift test review | 7 | rereading | reviewer finding | yes | artifact changed between rounds | solver/tests/experiments.test.js:448-455 | verified [comment identifies round 7 and byte-level drift] |
| Pull request 7 protocol drift test review | 9 | rereading | reviewer finding | yes | artifact changed between rounds | solver/tests/experiments.test.js:487-499 | verified [comment identifies round nine and history-based status check] |
| MAP-Elites independent run and corrected verification | 2 | external check | defect in the specification | yes | artifact changed between rounds | .orch/runs/2026-08-28-map-elites-independent-round/worklog.md:32; .orch/runs/2026-08-28-map-elites-independent-round-verification/worklog.md:14,32 | verified [first run retained evidence but failed frozen identity criterion; second admitted unchanged artifact without rerunning evolution] |
| Level-authoring tracer repair and review | 2 | external check; rereading | reviewer finding | yes | artifact changed between rounds | .orch/runs/level-authoring-tracer-2026-08-12/review.md:36; .orch/runs/level-authoring-tracer-2026-08-12/repair.md:13 | verified [review identified missing remeasurement; repair reruns fitting checks and adds negative controls] |
| Greed validation RESULT-0041 to RESULT-0043 | 2 | external check | defect in the work | yes | artifact changed between rounds | EVIDENCE_LEDGER.md:839-852,865-875 | verified [RESULT-0041 records invalid watchdog closure; RESULT-0043 records the corrected fresh-seed successor] |

## Part 5. Could not audit

| Loop | Reason | Evidence |
|---|---|---|
| Local test suite execution cost and blocking behavior | CI marks the complete suite continue-on-error; this audit did not run the suite, and the repository documentation reports known failures without a current duration measurement. | .github/workflows/experiment-gate.yml:32-44; AGENTS.md:5-7 |
| Local pre-push hook installation and actual enforcement | Repository source describes installation and behavior, but this checkout's active Git hooks path and installed hook state were not checked. | tools/hooks/install.js:2-12; tools/hooks/pre-push:7-18 |
| Search and sweep wall-clock cost | No durable runtime cost evidence was located for the solver search loops during this read-only inspection. | solver/policy-search.js:131-188; solver/map-elites.js:236-282; solver/sweep.js:49-63 |
| Complete inventory of historical extra rounds | The record includes directly source-pinned examples, but I did not enumerate every archived review or retry across the full history. | .orch/runs/2026-08-28-map-elites-independent-round/worklog.md:32; solver/tests/experiments.test.js:424-499 |
