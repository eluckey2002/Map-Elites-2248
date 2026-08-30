# Sealed promotion reveal

- Timestamp: `2026-08-30T23:26:53Z`
- Protocol outcome: `RETAIN_CHAMPION`
- Candidate commit: `ab8cbb5a381f3628a9084b738bc0836d1636fdef`
- Candidate `solver/bot.js` SHA-256: `6f58e6c136f58dc52df5d1b4203d0c032b497109ef4c517cd0ca1628057e1fd1`
- Engine SHA-256: `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`
- `src/game.js` SHA-256: `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee`

## Pre-reveal gates

- The write-once Level 53 champion baseline contains 300 complete, unique, ordered cells for seeds `14000000-14000299`. Artifact identity: `21ae8d14c949f9993a428fc2d6cbd078b9c086c17693efa258e4516b378d430a`; file SHA-256: `d8305fc9f3908ce767d4094c75363d25c4f77b7f53a49fc4af43031a4878bdde`.
- Baseline outcomes: 296 target wins and 4 out-of-moves losses.
- The sealed verifier compared the promoted public chooser against all 15,600 ordered challenger terminal tuples. It reached the Level 53 phase, which is reachable only after `compareGolden52` returns 15,600 exact matches and the candidate source identity is frozen unchanged. No translation correction was used.

## Level 53 reveal

The single authorized command was:

```text
node solver/promotion-replay.js --verify --golden52 .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/holdout-1-52.json --baseline53 .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/level53-baseline.json --out .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/promotion-verification.json
```

All 300 promoted Level 53 games executed before comparison. Comparison then exited nonzero with:

```text
Error: Level 53 changed same-speed winning outcome
    at validateLevel53Comparison (solver/promotion-replay.js:184:11)
```

The frozen gate permits only an exact baseline tuple, an earlier win, or a new win. A changed same-speed winning tuple therefore establishes a real Level 53 regression and requires `RETAIN_CHAMPION`.

The fail-fast comparator exited before writing `promotion-verification.json`; that file is absent. Therefore exact/earlier/new per-cell counts are not available, the first failing seed was not persisted, and the only sound promoted count is at least one changed same-speed winning outcome. Level 53 was not rerun, and no code, seeds, thresholds, or gates changed after reveal.

## Post-reveal checks

- Focused tests: 26/26 PASS.
- Full solver suite: 245 tests, 242 PASS, with exactly the three preflight failure identities:
  - `candidate-levels-52.json has a receipt that verifies against the current bot`
  - `candidate-levels-54.json has a receipt that verifies against the current bot`
  - `candidate-levels.json has a receipt that verifies against the current bot`
- Curve health: `RESULT: PASS`; hardest sampled Level 50 92% wins, 0% lockouts, 2% bombs.
- Public exports remain `DEFAULT_PARAMS`, `chooseMove`, `harvestValue`, and `remnantPlacementValue`; no base chooser API is exported.
- `git diff --check` passed. Main remained at `76871b12ebf5c75b2681360c1941fbd7ec908012`; no merge or push occurred.

## Post-terminal custody correction

The statements above that Level 53 “was not rerun” were true when this receipt
was written. A later v2 lane, claimed at `2026-08-30T23:30:42Z`, failed to
notice this run had completed at `2026-08-30T23:26:53Z` and duplicated the
fixed replay. That v2 run is `INVALIDATED` and excluded from the evidence basis;
see `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/evidence/correction.md`.
The first authorized result and its `RETAIN_CHAMPION` decision remain unchanged,
but the repository-wide claim that no later rerun occurred is superseded.

## Authority revoked

This receipt has no authoritative decision standing. Its `RETAIN_CHAMPION`
classification is superseded by `evidence/authority-revocation.md`; the combined
promotion experiment is `INVALIDATED`.
