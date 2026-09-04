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
| 0–149 | candidate fitting (level authoring) | 2026-08 | `solver/level-author.js` |
| 100,000–100,299 | candidate verification holdout | 2026-08 | `solver/level-author.js` |
| 500,000–500,023 | generator screen | 2026-08-20 | `solver/generate-levels.js` |
| 1,000,000+ | policy search holdout | 2026-08 | `solver/routing-ablation.js` header |
| 2,000,000–2,000,299 | width ablation, third disjoint set | 2026-08-20 | `solver/policy-ablation.js` |
| 2,000,000 | Level 52 owner-game replay corpus, 4 sessions | 2026-09-02 | `solver/test-fixtures/level52-seed2000000-human-games.json` |
| 3,000,000–3,000,299 | routing-ablation confirmation (default `--first`) | 2026-08-20 | `solver/routing-ablation.js` |
| 4,000,000–4,000,299 | routing-ablation pilot; MAP-Elites screen also starts at 4,000,000 (12 seeds) | 2026-08-20 | `solver/routing-ablation.js`, `solver/README.md` |
| 5,000,000–5,000,099 | chain-offer ablation pilot; registered, never claimed by a result | 2026-08-21 | `.orch/runs/chain-offer-2026-08-21`, `-23` |
| 6,000,000–6,000,299 | chain-offer ablation confirmation default; 6,000,000–6,000,024 also a RESULT-0026 sandbox | 2026-08-21, 2026-09-02 | `solver/chain-offer-ablation.js`, `experiments/RESULT-0026/protocol.md` |
| 7,000,000–7,000,024 | RESULT-0026 qualification (seed 7,000,000, levels 5 and 50) and sandbox | 2026-09-02 | `experiments/RESULT-0026/protocol.md` |
| 8,000,000–8,000,024 | hand-made bot back-off floor, levels 5 through 50. Owner-reported 2026-09-03; no artifact in the repository, so it backs no claim | 2026-09 | owner statement |
| 9,000,000–9,000,039 | multipath-ablation screen (RESULT-0015, RESULT-0016); 9,000,000–9,000,009 also the chain-offer C1/C2 opening-board diagnostic | 2026-08-21 | `solver/multipath-ablation.js` |
| 10,000,000–10,000,299 | multipath-ablation confirmation (RESULT-0015, RESULT-0016) | 2026-08-21 | `solver/multipath-ablation.js` |
| 11,000,000–11,000,039 | heaviest-first-past-the-cap ablation screen, rejected; code only on tag `archive/codex/2026-08-29T10-29-19Z-adhoc-session-workspace` | 2026-08-28 | that tag's `solver/heavy-after-ablation.js` |
| 12,000,000–12,000,039 | target-aware screen | 2026-08-30 | `solver/target-aware-evaluation.js` |
| 13,000,000–13,000,299 | target-aware holdout (RESULT-0018, RESULT-0020) | 2026-08-30 | `solver/target-aware-evaluation.js` |
| 14,000,000–14,000,299 | Level 53 champion baseline for the invalidated promotion rehearsal | 2026-08-30 | tag `archive/codex/target-aware-promotion-rehearsal-2026-08-30` |
| 20,000,000–22,999,999 | generated-corpus protocol (never executed) and topology controls; 21,000,000 spent by the topology cross-eval, 22,000,000–22,000,011 by RESULT-0024 controls | 2026-08-29, 2026-09-02 | `experiments/RESULT-0024/protocol.md`, `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval` |
| 24,000,000–24,000,024 | RESULT-0026 confirmation | 2026-09-02 | `experiments/RESULT-0026/protocol.md` |
| 30,000,000–30,000,059 | RESULT-0021 sample A | 2026-09-01 | `experiments/RESULT-0021/protocol.md` |
| 31,000,000–31,000,059 | RESULT-0021 sample B | 2026-09-01 | `experiments/RESULT-0021/protocol.md` |
| 424242 | HUMAN-PILOT-0001 and HUMAN-PILOT-0002 fixed play seed | 2026-09-01, 2026-09-02 | `pilots/` |
