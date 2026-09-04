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
| 30,000,000–30,000,059 | RESULT-0021 sample A | 2026-09-01 | `experiments/RESULT-0021/protocol.md` |
| 31,000,000–31,000,059 | RESULT-0021 sample B | 2026-09-01 | `experiments/RESULT-0021/protocol.md` |
| 424242 | HUMAN-PILOT-0001 and HUMAN-PILOT-0002 fixed play seed | 2026-09-01, 2026-09-02 | `pilots/` |
| 1, 2, 10, 777 | owner play recordings on levels 51–54 (ten recordings in `recordings/`; seed 777 twice on level 52) | 2026-08 | `recordings/*.json` |
| 9,100,000–9,100,001 and 9,200,004–9,200,005 | seed-variance bounded test, real control through the production `playMeasured` seam | 2026-09-01 | `solver/tests/seedVariance.test.js`, `experiments/RESULT-0021/protocol.md` |
