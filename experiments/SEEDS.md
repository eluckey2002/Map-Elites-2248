# Burned seeds

Every seed range this game has used for a measurement, screen, pilot,
confirmation, control, or play session. Burned means never reusable as fresh
holdout evidence. The convention was stated in comments at the top of
`solver/routing-ablation.js` and `solver/chain-offer-ablation.js` and scattered
through protocols; this file is the one place. The ladder game keeps its own
file (`2248-ladder/EXPOSED.md`); nothing here touched the ladder engine.

Add the row when you run, not after. A registered protocol must search this
file and the repository before declaring a range fresh.

| Seeds | Used for | Date | Source |
|---|---|---|---|
| 0–499 | the historical 500-seed Level 26 sample (RESULT-0005) through `solver/sweep.js`, which like `solver/game-tester.js` counts from seed 0, so any `--seeds N` run exposes 0–N-1; board search screened and measured 400 boards on seeds 0–399; target calibration and move-budget measurements (RESULT-0005, RESULT-0006, RESULT-0007) iterate 0–199; candidate fitting uses 0–149; policy-search screen uses 0–39 | 2026-08 | `solver/sweep.js`, `EVIDENCE_LEDGER.md` RESULT-0005, `solver/board-search-01.json`, `solver/target-calibration.js`, `solver/move-budget.js`, `solver/level-author.js`, `.orch/policy-search-02.cells.json` |
| 1–40 and 10,001–10,060 | board-search per-board variant fitting and holdout ranges | 2026-08-20 | `solver/board-search-01.json` (`receipt.fitting.variantRange`, `receipt.holdout.variantRange`) |
| 100,000–100,299 | candidate verification holdout | 2026-08 | `solver/level-author.js` |
| 200,000–200,039 | shape profiling, 40 seeds | 2026-08 | `solver/profile-shapes.js`, `solver/README.md`, `HANDOFF.md` |
| 200,000–200,119 | Levels 54–58 check at their shipped targets (derived for 55–58; Level 54 at its owner-set 126,000, DECISION-0007), 120 seeds per level; **reuses** 200,000–200,039 from shape profiling above | 2026-09-05 | commit `3bcb5a6`, `src/game.js` Levels 54–58 comments |
| 500,000–500,023 | generator screen | 2026-08-20 | `solver/generate-levels.js` |
| 1,000,000–1,000,249 | policy-search holdout, 250 seeds (`--holdout-seeds` default) | 2026-08 | `solver/policy-search.js`, `.orch/policy-search-02.cells.json` |
| 2,000,000–2,000,299 | width ablation, third disjoint set; 2,000,000–2,000,011 also the MAP-Elites transition-round screen (RESULT-0017) | 2026-08-20, 2026-08-22 | `solver/policy-ablation.js`, `.orch/policy-ablation-01.json`, `solver/map-elites-output/archive.json` |
| 2,000,000 | Level 52 owner-game replay corpus, 4 sessions | 2026-09-02 | `solver/test-fixtures/level52-seed2000000-human-games.json` |
| 3,000,000–3,000,299 | routing-ablation confirmation (default `--first`); 3,000,000–3,000,023 also the MAP-Elites transition-round holdout (RESULT-0017) | 2026-08-20, 2026-08-22 | `solver/routing-ablation.js`, `.orch/routing-ablation-01.json`, `solver/map-elites-output/archive.json` |
| 4,000,000–4,000,299 | routing-ablation pilot; 4,000,000–4,000,011 also the MAP-Elites independent-round screen (RESULT-0019) | 2026-08-20, 2026-08-28 | `solver/routing-ablation.js`, `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json` |
| 5,000,000–5,000,099 | chain-offer ablation pilot; registered, never claimed by a result; 5,000,000–5,000,023 also the MAP-Elites independent-round holdout (RESULT-0019) | 2026-08-21, 2026-08-28 | `.orch/runs/chain-offer-2026-08-21`, `-23`, `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json` |
| 6,000,000–6,000,299 | chain-offer ablation confirmation default; 6,000,000–6,000,024 also a RESULT-0026 sandbox | 2026-08-21, 2026-09-02 | `solver/chain-offer-ablation.js`, `experiments/RESULT-0026/protocol.md` |
| 7,000,000–7,000,024 | RESULT-0026 qualification (seed 7,000,000, levels 5 and 50) and sandbox | 2026-09-02 | `experiments/RESULT-0026/protocol.md` |
| 8,000,000–8,000,024 | hand-made bot back-off floor, levels 5 through 50. Owner-reported 2026-09-03; no artifact in the repository, so it backs no claim | 2026-09 | owner statement |
| 9,000,000–9,000,039 | multipath-ablation screen (RESULT-0015, RESULT-0016); 9,000,000–9,000,009 also the chain-offer C1/C2 opening-board diagnostic | 2026-08-21 | `solver/multipath-ablation.js` |
| 10,000,000–10,000,299 | multipath-ablation confirmation (RESULT-0015, RESULT-0016) | 2026-08-21 | `solver/multipath-ablation.js` |
| 11,000,000–11,000,039 | heaviest-first-past-the-cap ablation screen, rejected; code only on tag `archive/codex/2026-08-29T10-29-19Z-adhoc-session-workspace` | 2026-08-28 | that tag's `solver/heavy-after-ablation.js` |
| 12,000,000–12,000,039 | target-aware screen | 2026-08-30 | `solver/target-aware-evaluation.js` |
| 13,000,000–13,000,299 | target-aware holdout (RESULT-0018, RESULT-0020) | 2026-08-30 | `solver/target-aware-evaluation.js` |
| 14,000,000–14,000,299 | Level 53 champion baseline for the invalidated promotion rehearsal | 2026-08-30 | tag `archive/codex/target-aware-promotion-rehearsal-2026-08-30` |
| 20,000,000–20,000,011 and 21,000,000–21,000,199 | player-style topology cross-eval (RESULT-0023, retained failed study): 12 development-check seeds and 200 confirmation seeds | 2026-09-02 | `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/` |
| 20,000,000–22,999,999 (reserved) | generated-corpus protocol on tag `archive/codex/research-session-2026-08-28`, never executed; its reservation now collides with the rows above and below | 2026-08-29 | that tag's `.orch/runs/2026-08-29-generated-level-corpus-preregistration/preregistration.md` |
| 22,000,000–22,000,011 | RESULT-0024 topology controls, executed twice | 2026-09-02 | `experiments/RESULT-0024/protocol.md` |
| 23,000,000–23,000,199 | RESULT-0024 confirmation, executed and reported | 2026-09-02 | `experiments/RESULT-0024/protocol.md`, `report.md` |
| 24,000,000–24,000,024 | RESULT-0026 confirmation | 2026-09-02 | `experiments/RESULT-0026/protocol.md` |
| 29,000,000–29,000,047; 29,000,100–29,000,147; 29,000,200–29,000,247; 29,000,300–29,000,347 | RESULT-0029 exact puzzle-descriptor corpus; each disjoint block searches one predeclared structural region and stops after four qualifying boards | 2026-09-16 | `experiments/RESULT-0029/protocol.md` |
| 30,000,000–30,000,059 | RESULT-0021 sample A | 2026-09-01 | `experiments/RESULT-0021/protocol.md` |
| 31,000,000–31,000,059 | RESULT-0021 sample B | 2026-09-01 | `experiments/RESULT-0021/protocol.md` |
| 32,000,000; 32,100,000–32,100,001 | RESULT-0030 diagnostic runtime calibration (excluded) and paired representative-board confirmation across Levels 10, 31, 53, and 54 | 2026-09-16 | `experiments/RESULT-0030/protocol.md` |
| 32,200,000–32,200,001 | RESULT-0031 corrected-cap paired representative-board confirmation across Levels 10, 31, 53, and 54 | 2026-09-16 | `experiments/RESULT-0031/protocol.md` |
| 32,300,000 | choice-density × recovery runtime and positive-control calibration; excluded from confirmation | 2026-09-16 | `solver/choice-recovery-descriptors.js` development calibration |
| 32,400,000–32,400,007 | RESULT-0032 choice-density × recovery confirmation across four static/no-blocker board profiles | 2026-09-16 | `experiments/RESULT-0032/protocol.md` |
| 32,500,000 | merge-depth × spatial-spread runtime and range calibration; excluded from confirmation | 2026-09-16 | `solver/merge-spread-descriptors.js` development calibration |
| 32,600,000–32,600,007 | RESULT-0033 merge-depth × spatial-spread confirmation across four static/no-blocker board profiles | 2026-09-16 | `experiments/RESULT-0033/protocol.md` |
| 32,700,000 | forced-prefix × bounded-diversity runtime and range calibration; excluded from confirmation | 2026-09-16 | `solver/forced-diversity-descriptors.js` development calibration |
| 32,800,000–32,800,007 | RESULT-0034 forced-prefix × bounded-diversity confirmation across four static/no-blocker board profiles | 2026-09-16 | `experiments/RESULT-0034/protocol.md` |
| 33,000,000–33,000,031 | RESULT-0035 merge-depth × spatial-spread MAP-corpus confirmation across four representative board profiles | 2026-09-16 | `experiments/RESULT-0035/protocol.md` |
| 33,100,000–33,100,063 | exploratory half-score-move × greed-ratio scripted-percentile screen across Levels 10, 31, 53, and 54; not confirmation evidence | 2026-09-16 | `solver/greed-descriptor-screen.js` |
| 33,200,000–33,200,007 | RESULT-0036 exact-denominator half-score-move × greed-ratio confirmation across Levels 10, 31, 53, and 54 and four scripted percentile policies | 2026-09-16 | `experiments/RESULT-0036/protocol.md` |
| 33,300,000 | RESULT-0037 deterministic work-limit qualification control on Level 54; excluded from confirmation | 2026-09-16 | `experiments/RESULT-0037/run.test.js` |
| 33,400,000–33,400,007 | RESULT-0037 deterministic exact greed-ratio confirmation across Levels 10, 31, 53, and 54 and four scripted percentile policies | 2026-09-16 | `experiments/RESULT-0037/protocol.md` |
| 33,500,000–33,500,007 | RESULT-0038 deterministic exact greed-ratio closure replication across Levels 10, 31, 53, and 54 and four scripted percentile policies | 2026-09-16 | `experiments/RESULT-0038/protocol.md` |
| 33,800,000–33,800,007 | RESULT-0041 bound-receipt exact greed-ratio confirmation across Levels 10, 31, 53, and 54 and four scripted percentile policies | 2026-09-16 | `experiments/RESULT-0041/protocol.md` |
| 33,900,000–33,900,007 | RESULT-0042 calibrated-watchdog exact greed-ratio confirmation across Levels 10, 31, 53, and 54 and four scripted percentile policies | 2026-09-16 | `experiments/RESULT-0042/protocol.md` |
| 34,000,000–34,000,007 | RESULT-0043 executable-closeout exact greed-ratio replication across Levels 10, 31, 53, and 54 and four scripted percentile policies | 2026-09-16 | `experiments/RESULT-0043/protocol.md` |
| 41,000,000–41,000,001 | RESULT-0044 fresh-board owner-versus-oracle challenge (registered, not run): Level 56 uses 41,000,000; Level 58 uses 41,000,001 | 2026-09-22 | `experiments/RESULT-0044/protocol.md` |
| 42,000,000–42,000,001 | RESULT-0044 fresh run (protocol option 1), committed before owner play: Level 56 uses 42,000,000; Level 58 uses 42,000,001 | 2026-09-28 | `experiments/RESULT-0044/fresh-boards.json` |
| 43,999,999; 44,000,000–44,004,095 | RESULT-0048 family-island qualification fixture and paired island/refill confirmation panel | 2026-09-19 | `experiments/RESULT-0048/registered-protocol.md` |
| 44,999,999; 45,000,000–45,000,299 | RESULT-0049 excluded harness qualification and fresh paired current-champion confirmation across all 58 shipped levels | 2026-09-27 | `experiments/RESULT-0049/registered-protocol.md` |
| 424242 | HUMAN-PILOT-0001 and HUMAN-PILOT-0002 fixed play seed | 2026-09-01, 2026-09-02 | `pilots/` |
| 1, 2, 10, 777 | owner play recordings on levels 51–54 (ten recordings in `recordings/`; seed 777 twice on level 52) | 2026-08 | `recordings/*.json` |
| 9,100,000–9,100,001 and 9,200,004–9,200,005 | seed-variance bounded test, real control through the production `playMeasured` seam | 2026-09-01 | `solver/tests/seedVariance.test.js`, `experiments/RESULT-0021/protocol.md` |

| 50,000,000–50,000,099 | RESULT-0058 champion/champion null control, 10 levels × 100 seeds | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,100,000–50,100,249 | RESULT-0058 champion/chooseBaseMove 3,000-cell positive control | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,200,000–50,200,299 | RESULT-0058 positive-control 50 disjoint six-seed blocks, 72 cells per block | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,300,000–50,300,005 | RESULT-0058 short-myopic stage-1 control | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,301,000–50,301,049 | RESULT-0058 short-myopic stage-2 contingency; reserved even if stage 1 cuts | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,400,000–50,400,005 | RESULT-0058 one-gene winner-curse screens | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,401,000–50,401,005 | RESULT-0058 one-gene winner-curse fresh checks | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,500,000–50,500,005 | RESULT-0058 MAP-Elites 72-game screens | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,501,000–50,501,049 | RESULT-0058 MAP-Elites 600-game stage; reserved if no candidate advances | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,502,000–50,502,249 | RESULT-0058 MAP-Elites 3,000-game stage; reserved if no candidate advances | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,503,000–50,503,005 | RESULT-0058 MAP-Elites independent fresh admission recheck; reserved if no nominee | 2026-10-02 | experiments/RESULT-0058/protocol.md |
| 50,504,000–50,504,249 | RESULT-0058 MAP-Elites final holdout; reserved if archive empty | 2026-10-02 | experiments/RESULT-0058/protocol.md |

| 60,000,000–60,000,009 | RESULT-0080 reserved G; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,010,000–60,010,009 | RESULT-0080 reserved S; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,020,000–60,020,009 | RESULT-0080 reserved R1; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,021,000–60,021,009 | RESULT-0080 reserved R2; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,022,000–60,022,009 | RESULT-0080 reserved R3; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,023,000–60,023,009 | RESULT-0080 reserved R4; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,024,000–60,024,009 | RESULT-0080 reserved R5; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,025,000–60,025,009 | RESULT-0080 reserved R6; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,026,000–60,026,009 | RESULT-0080 reserved R7; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,027,000–60,027,009 | RESULT-0080 reserved R8; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,028,000–60,028,009 | RESULT-0080 reserved R9; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,029,000–60,029,009 | RESULT-0080 reserved R10; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,030,000–60,030,009 | RESULT-0080 reserved R11; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,040,000–60,040,009 | RESULT-0080 reserved C1; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,041,000–60,041,009 | RESULT-0080 reserved C2; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,042,000–60,042,009 | RESULT-0080 reserved C3; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,043,000–60,043,009 | RESULT-0080 reserved C4; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,044,000–60,044,009 | RESULT-0080 reserved C5; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,045,000–60,045,009 | RESULT-0080 reserved C6; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,046,000–60,046,009 | RESULT-0080 reserved C7; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,047,000–60,047,009 | RESULT-0080 reserved C8; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,048,000–60,048,009 | RESULT-0080 reserved C9; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,049,000–60,049,009 | RESULT-0080 reserved C10; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,050,000–60,050,009 | RESULT-0080 reserved C11; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,051,000–60,051,009 | RESULT-0080 reserved C12; 58 x 10 experimental panel; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |
| 60,100,000–60,100,149 | RESULT-0080 reserved F; one-shot confirmation, 58 x 150; never reused even if not run | 2026-10-03 | docs/goals/policy-terms-loop/EXPLORATION_PLAN.md |

| 60,052,000–60,052,009 | RESULT-0080 approved journaled recovery replacement C3; 58 x 10, four arms; old C3 remains burned | 2026-10-03 | docs/goals/policy-terms-loop/RECOVERY_PLAN.md; RECOVERY_APPROVAL.txt |

| 60,052,000–60,052,009; original reserved C4–C12, G/S/R/F ranges above | RESULT-0081 continuation of RESULT-0080 under original assigned-ID collision fallback; only C3 is replaced; existing G/C1/C2 results are retained, not replayed; other ranges keep their original purposes and are never dispatched twice | 2026-10-03 | docs/goals/policy-terms-loop/RECOVERY_PLAN.md; recovery-result-id-check.json |
