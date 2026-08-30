# Pre-change baseline

- Candidate branch: `codex/target-aware-promotion-rehearsal-2026-08-30`
- Base: `76871b12ebf5c75b2681360c1941fbd7ec908012`
- Repository baseline: `BASELINE PASS 76871b12ebf5c75b2681360c1941fbd7ec908012 (candidate)`
- Universe Map: `PASS`
- Champion SHA-256: `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`
- Engine SHA-256: `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`
- `src/game.js` SHA-256: `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee`
- Levels 1-52 JSON projection SHA-256: `dfa4cbb20140a17fbfa03a6f157575c8c905f5dbf564142ffc9d7ab6e2dcb7a9`
- Level 53: target 101000, scale 32, 16 moves, minChain 3, 6x5, no blockers.
- Full suite: 237 tests, 234 pass, 3 fail.
- Baseline failing tests:
  - `candidate-levels-52.json has a receipt that verifies against the current bot`
  - `candidate-levels-54.json has a receipt that verifies against the current bot`
  - `candidate-levels.json has a receipt that verifies against the current bot`
- Curve health: `RESULT: PASS`; hardest sampled Level 50 92% wins, 0% lockouts, 2% bombs.
- Frozen 1-52 holdout file SHA-256: `b6fe43d6a7818868c10b40cc95399259c689bf958679f5c8fb4aa4e37e3217c8`.
- Frozen independent verification SHA-256: `5bdf5baa5b55672337d52379d5b43920671f5ae2e9ef4a8fd0d51063010e41e9`.
