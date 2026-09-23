# Loop ladder record

## Part 1. Pin

| Field | Value |
|---|---|
| Project | Map-Elites-2248 |
| Date | 2026-09-19 |
| Commit hash (`git rev-parse --short HEAD`) | 9d125e8 (branch main) |
| Record type | audit |
| Filled in by | Claude (Fable 5.1), with three Sonnet-class inventory sub-agents |

## Part 2. Run record

This describes the audit itself.

| Field | Value |
|---|---|
| Task | Loop ladder audit across the repository: code loops, gates, and agent process loops |
| Ceiling | reread and revise |
| Starting rung | generate once |
| Ending rung | reread and revise |
| Result | passed |

Escalations:

| From rung | To rung | What triggered it |
|---|---|---|
| generate once | reread and revise | Standing owner rule: never relay a sub-agent finding without re-checking it against the source. No checked claim was found wrong. |

## Part 3. Loop inventory

| Loop | Loop kind | Entry (file:line) | Ceiling | Runs at | Same-source pair | Trigger | Blocks | Stop rule | Cost evidence | Recommendation | Basis |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Level shape generator | code loop | solver/generate-levels.js:284 | repeated with varied inputs | repeated with varied inputs; rank candidates | identical rerun in the same process (generate-levels.js:333 repeats level-author.js:199,215 as level-author.js:302,312) | by hand | no | fixed count | yes, 5 to 18 seconds per shape, comment at solver/generate-levels.js:5 | rename a stage | verified [read generate-levels.js 300-349; grep of `measure(` in level-author.js] |
| Board search for one shape | code loop | solver/search-boards.js:66 | repeated with varied inputs | repeated with varied inputs; rank candidates | identical rerun in the same process (search-boards.js:140 repeats fixed-board.js:198,216 as fixed-board.js:280,292) | by hand | no | fixed count | no | rename a stage; record cost | verified [grep of search-boards.js and fixed-board.js] |
| Policy search | code loop | solver/policy-search.js:173 | unknown | repeated with varied inputs; rank candidates | no | by hand | no | fixed count | no | add a stop rule; record cost | verified [grep of policy-search.js lines 49, 74-75, 173, 175, 215; grep of output files for elapsed time: none] |
| MAP-Elites policy search | code loop | solver/map-elites.js:259 | unknown | repeated with varied inputs; rank candidates | identical rerun later (map-elites.js:377 reruns the evaluation with the same policy and seeds) | by hand | no | fixed count | no | add a stop rule; record cost | verified [grep of map-elites.js lines 108-112, 147, 259, 377] |
| Level sweep | code loop | solver/sweep.js:52 | external check repeated | external check repeated | no | by hand | no | fixed count | no | none | inferred [entry line verified by grep; stages from sub-agent report] |
| Exact position search | code loop | solver/exact-score.js:143 | one external check | one external check; rank candidates | no | by hand | no | budget | no | none | inferred [entry line and node cap verified by grep; stages from sub-agent report] |
| Relaxed upper-bound search | code loop | solver/exact-score.js:289; solver/upper-bound.js:49 | one external check | one external check; rank candidates | no | by hand | no | budget | no | none | inferred [entry lines and node caps verified by grep; stages from sub-agent report] |
| Beam witness finder | code loop | solver/exact-score.js:360 | one external check | one external check; rank candidates | no | by hand | no | target reached (solver/exact-score.js:381) | no | none | verified [grep of exact-score.js lines 353-395; function bodies not read in full] |
| Targeted chain generator | code loop | solver/targeted-chain-generator.js:134 | one external check | one external check; rank candidates | no | by hand | no | budget | no | none | inferred [entry line and node cap verified by grep; stages from sub-agent report] |
| Experiment gate | gate | tools/verify-experiments.js:562 | one external check | one external check | no | test suite; push hook; continuous integration | yes | none | yes, about 0.4 seconds for the artifact identity sub-check, docs/CHECK-CARDS.md:653 | none | verified for triggers [grep: experiment-gate.yml:30, tools/hooks/pre-push:16]; inferred for entry line and cost [sub-agent report] |
| Artifact identity sub-check of the experiment gate | gate | tools/verify-experiments.js:309 | one external check | one external check | duplicated code (tools/verify-experiments.js:128 copies the canonical form from solver/target-aware-evaluation.js) | test suite; push hook; continuous integration | yes | none | no | none | verified [grep of the comment at line 128] |
| Report check of the experiment gate | gate | tools/verify-experiments.js:464 | one external check | one external check | no | test suite; push hook; continuous integration | yes | none | no | none | verified for what it proves [read docs/CHECK-CARDS.md 586-591]; inferred for entry line [sub-agent report] |
| Run-time registration guard | gate | solver/experiment-guard.js:28 | one external check | one external check | shared functions (solver/experiment-guard.js:15 imports its checks from tools/verify-experiments.js) | by hand | yes | none | no | none | verified for the import [grep]; inferred for entry line and blocking [sub-agent report] |
| Full test suite in continuous integration | gate | .github/workflows/experiment-gate.yml:32 | one external check | one external check | no | continuous integration | no | none | no | make it block | verified [read workflow lines 1-12 and 32-44; test suite not run] |
| Level-curve health check | gate | solver/verify-loop.js:1 | external check repeated | external check repeated | no | nothing | no | fixed count | no | wire a trigger | verified [read verify-loop.js 1-60; grep for `verify-loop` in solver/tests, .github, tools: no matches] |
| MAP-Elites artifact verifier | gate | solver/verify-map-elites.js:18 | one external check | one external check | shared functions (solver/verify-map-elites.js:9-10 imports from the producer); identical rerun later | by hand | no | none | no | none | verified for the imports [grep]; inferred for the rest [sub-agent report] |
| Candidate receipt gate | gate | solver/level-author.js:255 | one external check | one external check | identical rerun later | test suite | no | none | no | none | inferred [sub-agent report; level-author.js:255 verified by grep] |
| Universe map check | gate | tools/verify-universe-map.js:8 | one external check | one external check | identical rerun later | test suite; by hand | no | none | no | none | inferred [sub-agent report only] |
| Pull request review | agent process | AGENTS.md:56 | one external check | reread and revise; one external check | no | continuous integration | by rule only | target reached | no | none | verified [read AGENTS.md 47-68] |
| Experiment registration, run, report, gate | agent process | AGENTS.md:34 | one external check | one external check | no | test suite; push hook; continuous integration | yes | none | no | none | verified [read AGENTS.md 34-46 for the test suite trigger and AGENTS.md 47-54 for the push hook and continuous integration triggers] |

## Part 4. Extra rounds

| Loop or run family | Round | Source used | Trigger class | Changed the result | Confound | Evidence (file:line) | Basis |
|---|---|---|---|---|---|---|---|
| Start-game ticket, retry | 2 | external check | defect in the specification | yes | none | .orch/tickets/2026-08-15T17-18-05Z-adhoc-start-game/start-game.md:59 | verified for the trigger [grep]; inferred for the outcome [sub-agent report] |
| Git baseline stabilization, second version | 2 | external check | defect in the specification | yes | none | .orch/runs/2026-08-28-git-baseline-stabilization/worklog.md:52 | verified for the trigger [grep]; inferred for the outcome [sub-agent report] |
| MAP-Elites independent round, verification run | 2 | external check | defect in the specification | no | none | .orch/runs/2026-08-28-map-elites-independent-round/worklog.md:16 | verified [grep] |
| Level 51 target-aware evaluation, second version | 2 | external check | defect in the specification | yes | none | .orch/runs/level51-target-aware-evaluation-2026-08-30/stop-record.md:5 | verified for the trigger [grep]; inferred for the outcome [sub-agent report] |
| Seed-variance challenge code, first review | 2 | rereading | reviewer finding | yes | unknown | .orch/tickets/2026-09-01-seed-variance-challenge-code/SV-CODE-001.md:97 | verified [read lines 95-118] |
| Seed-variance challenge code, integration audit | 3 | rereading | reviewer finding | yes | artifact changed between rounds; different reviewer | .orch/tickets/2026-09-01-seed-variance-challenge-code/SV-CODE-001.md:106 | verified [read lines 95-118] |
| Seed-variance challenge code, dimensional audit | 4 | rereading | reviewer finding | yes | artifact changed between rounds; different reviewer | .orch/tickets/2026-09-01-seed-variance-challenge-code/SV-CODE-001.md:113 | verified [read lines 95-118] |
| Pull request 7, version freeze check, nine review rounds | 2 to 10 | rereading | reviewer finding | yes | artifact changed between rounds | docs/CHECK-CARDS.md:746 | verified [read lines 740-756] |
| Pull request 18, second reviewer | 2 | rereading | reviewer finding | yes | different reviewer | HANDOFF.md:13 | verified [read lines 9-18] |
| Target-aware policy replication (RESULT-0020 rerun of RESULT-0018) | 2 | repetition | scheduled | yes | none | CURRENT.md:81 | verified [read lines 71-90] |
| Ranking-weight search, second run (RESULT-0013) | 2 | repetition | scheduled | no | none | HANDOFF.md:240 | verified [read lines 238-245] |
| Policy comparison confirmation, adversarial review | 2 | rereading | scheduled | no | none | .orch/tickets/2026-09-02-result-0026-confirmation/DGS-001.md:78 | verified [grep] |
| Stranded-cell measurement audit | 3 | other (the owner's stated intent); external check | scheduled | yes | reviewer ran its own probes | .orch/tickets/2026-09-02-stranded-measurement-audit/SMA-001.md:57 | verified [read lines 54-63] |
| Level authoring tracer, review through re-audit | 2 to 6 | rereading; external check | reviewer finding | yes | reviewer ran its own probes; artifact changed between rounds | .orch/runs/level-authoring-tracer-2026-08-12/review.md | inferred [sub-agent report only] |
| Player-style topology experiment, entitlement retry | 2 | external check | defect in the work | unknown | none | .orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/worklog.md:52 | inferred [sub-agent report only] |
| Compact signature code run, second version | 2 | external check | defect in the specification | no | none | .orch/runs/bl0001-compact-signature-code-v2-2026-08-11/worklog.md | inferred [sub-agent report only] |

## Part 5. Could not audit

| Loop | Reason | Evidence |
|---|---|---|
| Target witness search | The directory holds only `frozen-run.json`. The command-line tool and verifier that solver/README.md describes are not in this checkout. | verified [listed solver/target-witness-search] |
| Hinted constraint solver threshold escalation | The directory holds only `frozen-run.json`. The Python runner that solver/README.md describes is not in this checkout. | verified [listed solver/hinted-cp-sat] |
| Physical branch-and-bound; near-target search | solver/README.md describes them. The directories do not exist. | verified [listed: no such directory] |

