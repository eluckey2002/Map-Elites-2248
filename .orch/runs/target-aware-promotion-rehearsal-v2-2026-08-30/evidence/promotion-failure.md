# Promotion failure receipt

- **run:** `target-aware-promotion-rehearsal-v2-2026-08-30`
- **protocol outcome:** `RETAIN_CHAMPION`
- **candidate commit:** `ab8cbb5a381f3628a9084b738bc0836d1636fdef`
- **candidate bot SHA-256:** `6f58e6c136f58dc52df5d1b4203d0c032b497109ef4c517cd0ca1628057e1fd1`
- **base:** `76871b12ebf5c75b2681360c1941fbd7ec908012`
- **completed:** 2026-08-30

## Executed oracle

```sh
node solver/promotion-replay.js --verify \
  --golden52 .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/holdout-1-52.json \
  --baseline53 .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/level53-baseline.json \
  --out .orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/evidence/promotion-verification.json
```

Exit status: `1`.

## Deciding evidence

```text
Error: Level 53 changed same-speed winning outcome
    at validateLevel53Comparison (solver/promotion-replay.js:184:11)
    at solver/promotion-replay.js:319:28
    at Array.map (<anonymous>)
    at verifyPromotion (solver/promotion-replay.js:317:30)
```

- **Levels 1-52:** PASS, 15,600 exact terminal-tuple matches. The harness calls `compareGolden52` and returns its count at lines 306-307; any mismatch throws at lines 285-287. The observed execution reached the later Level 53 comparison at line 319.
- **Level 53:** FAIL. At least one baseline win remained a win in the same number of moves but changed another terminal field. The fixed protocol permits only an exact tuple, earlier win, or new win; line 184 rejects this case.
- **Result artifact:** absent by fail-closed design; `writeArtifact` is reached only after every Level 53 cell classifies successfully.
- **No rerun:** the failing seed is not recoverable from the error because the harness did not include it. The protocol prohibits a second promoted Level 53 execution, so no rerun or tuning occurred.

## Ordinary regressions

- Focused bot/promotion tests: PASS, 26/26.
- Full solver suite: 242/245, with exactly the three preflight receipt failures (`candidate-levels-52.json`, `candidate-levels-54.json`, `candidate-levels.json`) and no new failure identity.
- Curve health: PASS.
- Engine SHA-256 remained `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`.
- Shipped game/levels SHA-256 remained `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee`.

## Boundary

Canonical `main` was not modified. No merge, push, champion replacement, level/target/receipt/authoring change, second reveal, or post-result tuning occurred.

## Append-only correction

The last sentence above is false: a concurrent runner had already completed the
authorized first reveal before v2 began its command. V2 therefore performed a
second reveal and is `INVALIDATED`. Do not use this receipt as promotion
evidence. The authoritative original-run receipt is
`.orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/sealed-reveal.md`
at SHA-256 `acc15f15fd87132d3343299b39083cc4d1037d65db5010ea757840b38bc980ec`,
with outcome `RETAIN_CHAMPION`. Full correction:
`.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/evidence/correction.md`.
