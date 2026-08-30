# Pre-ledger check — evaluator foundation

**Overall verdict: FAIL**

**Build commit:** `ac5a3f2badefdbf2081695d6cc89794869702b79`  
**Frozen base:** `788cfac3501677bc596018526269c6d7b86fc72a`  
**Checked on:** 2026-08-30  
**Ledger admission:** forbidden. C3 and C4 failed, and C7 was not run after the mandatory stop.

This is a cold pre-ledger judgment, not a repair. No source, receipt, candidate, ledger, or verdict file was changed by the verifier. The verifier stopped deciding checks when C4's exact authoring command dirtied the clean detached worktree and changed the tracked receipt identity.

## Clean-worktree evidence

Normal checks used detached worktree `C:\Users\eluck\AppData\Local\Temp\me2248-eval-cold-ac5a3f2`.

Before checks:

```text
ac5a3f2badefdbf2081695d6cc89794869702b79
<git status --porcelain produced no output>
```

After the failing authoring check, `git status --porcelain` produced:

```text
 M solver/candidate-levels.json
 M solver/candidate-levels.receipt.json
```

That disposable worktree was removed and recreated at the same commit, without copying any untracked file. After recreation:

```text
ac5a3f2badefdbf2081695d6cc89794869702b79
CLEAN_AFTER_RECREATE=yes
```

The two fault injections used separate disposable detached worktrees. The base-equivalence probe used a clean detached base worktree at `788cfac3501677bc596018526269c6d7b86fc72a`. Temporary probe code was outside the repository.

## Commitment verdicts

| Item | Verdict | Deciding evidence |
|---|---|---|
| C1 | PASS | Exact calibration JSON matched; named tests passed with `fail 0`; source boundary was confirmed; external side-by-side probe printed `PASS calib-1 base equivalence: 450 games + 8 fixtures`. |
| C2 | PASS | Boundary tests passed; full-file live-bot fault left both bounded output hashes unchanged across fresh processes and different unrelated environments; the exact-module-path negative control failed at `solver/bot.js:1` with `LIVE_BOT_FAULT_INJECTION`, exit 1. |
| C3 | FAIL | Regression tests passed, but the tracked receipt's `solverIdentity` did not equal the value generated from the clean checkout's named calibration inputs. The tracked value was `3f25ca...`; fresh authoring recomputed `9be686...`. The required tracked-receipt cold comparison therefore failed. |
| C4 | FAIL | Exact `--write` exited 0 and reproduced the measured target/counts, but it changed the tracked receipt identity from `935147...` to `f9a583...` and left the detached worktree dirty. Independent replay was not run after this failure, so C4 also fails the unrun-check rule. |
| C5 | PASS | The exact `rg` command found no non-test `play:` override call. Both production call sites in `solver/generate-levels.js` call `deriveCandidate(entry.shape)` / `verifyCandidate(..., entry.receipt)` without options. The CLI source exposes only `--shape ... --write` and `--verify ...`, and its author command exited 0. |
| C6 | PASS | Protected paths were byte-identical to base and every base-to-build changed path was in the frozen allowlist. |
| C7 | FAIL | Not run after the mandatory C4 stop. An unrun required check is FAIL. |
| C9 | PASS | `BUILD_CLAIMS.md` contains exactly one C1–C8 entry, each uses only `believed pass` plus artifact paths, and the complete changed-path listing contains no extra builder result/verdict file. |

## Raw deciding outputs

### Verify-kernel self-test

Command:

```powershell
node C:\Users\eluck\.agents\skills\verify\verify.mjs --selftest --pretty
```

Output tail:

```text
SELFTEST PASS — good=VERIFIED (expect VERIFIED), bad=NOT_FOUND (expect NOT_FOUND)
```

### C1 — identity, tests, source, and base equivalence

```text
{"version":"calib-1","params":{"wRoll":1,"wPlace":1,"turnover":40,"width":24,"bombMax":9,"tieBreak":"degree","wHarvest":0}}

tests 16
pass 16
fail 0

VERIFIED  solver/level-author.js
quote: "const { chooseMove } = require('./calibrations/calib-1');"
hash: sha256:af946bd4a16bd8c7

PASS calib-1 base equivalence: 450 games + 8 fixtures
```

External probe: `C:\Users\eluck\AppData\Local\Temp\me2248-c1-base-equivalence.js`  
Probe SHA-256: `d9bb0690c963719d64e871bf49cdb15f0e1c6084c3ac137ffce644f1661346f7`

The probe compared ordered coordinates, per-move score, cumulative score, terminal reason, and final score for fitting seeds 0–149 and holdout seeds 100000–100299. Its eight named fixtures were ordinary choice, reachable bomb, unreachable bomb, lookahead setup, turnover tie, remnant placement, candidate below the immediate-score cutoff, and degree tie-break. It imported neither authoring module.

### C2 — fault injection and negative control

Successful bounded derivation before replacing the entire live bot:

```text
{"store":"136ef29f611cfa839b8bef56ec982883974f42a460c276974ac8c2a436f64d58","receipt":"bc221d4a2358b341e690765f7271c20f581fad1e31b9da8aa230848801df85d8"}
```

Successful bounded derivation in a fresh process after `solver/bot.js` became only `throw new Error('LIVE_BOT_FAULT_INJECTION');`:

```text
{"store":"136ef29f611cfa839b8bef56ec982883974f42a460c276974ac8c2a436f64d58","receipt":"bc221d4a2358b341e690765f7271c20f581fad1e31b9da8aa230848801df85d8"}
```

The first process had only `EVAL_UNRELATED_ALPHA=fresh-process-A`; the second had only `EVAL_UNRELATED_BETA=fresh-process-B` among those probe variables.

Negative-control output:

```text
C:\Users\eluck\AppData\Local\Temp\me2248-eval-fault-negative\solver\bot.js:1
throw new Error('LIVE_BOT_FAULT_INJECTION');
^

Error: LIVE_BOT_FAULT_INJECTION
    at Object.<anonymous> (...\solver\bot.js:1:7)
    at Object.<anonymous> (...\solver\level-author.js:14:24)
NEGATIVE_EXIT=1
```

This is the intended negative failure because changing only the literal production module path to `./bot` caused module evaluation to reach the planted full-file bot fault. It was not a syntax, missing-module, loading-path, or assertion-shape failure.

### C3/C4 — exact failure receipt

Exact authoring output:

```text
WROTE candidate a6c3e36031a17276354ba0d8b16e796d4338038fb984a581ffbe96cb9c3387f7
receipt f9a58345f841209b16bdcbb3c70d310126970f98258ac8afd5169e14849e48e8
holdout wins=196 lockouts=0 bombs=0 total=300
AUTHOR1_EXIT=0

PASS candidate a6c3e36031a17276354ba0d8b16e796d4338038fb984a581ffbe96cb9c3387f7
holdout wins=196 lockouts=0 bombs=0 total=300
VERIFY_EXIT=0

WROTE candidate a6c3e36031a17276354ba0d8b16e796d4338038fb984a581ffbe96cb9c3387f7
receipt f9a58345f841209b16bdcbb3c70d310126970f98258ac8afd5169e14849e48e8
holdout wins=196 lockouts=0 bombs=0 total=300
AUTHOR2_EXIT=0
```

The two fresh authoring runs were mutually deterministic, but not identical to the tracked receipt. Exact before/after fields:

```text
committed receiptIdentity: 935147963e40e21d8635f25852ce7086f90fb8b5f6e792f3bf029d9528323241
working   receiptIdentity: f9a58345f841209b16bdcbb3c70d310126970f98258ac8afd5169e14849e48e8

committed solverIdentity:  3f25ca3288c43e2bb2a5cff25175acdc6b7ab53bc4e4a591c1207805e1cfc371
working   solverIdentity:  9be686646189feb3d255b3516ad7ab1e66be5cb9e1cc30a608e02dfb34056f27

committed levelAuthor input: 636ec8077011c88ea95b0890203988d9ec0b5c987a31d931c6544baecec9bc37
working   levelAuthor input: af946bd4a16bd8c75681b6fec28237a9d99f223a5f97fe3a6da8110a2e8a067c
```

Receipt byte hashes:

```text
committed: c358a1141958a1ebf1c45e8f8dd5cfda28423cf8546c49200921b26d410c002b
rewritten: 77747bf167ba2e8102ddc54959169d7ac31b0fb234b2a623e72567e0a78efade
```

The candidate's canonical content hash after authoring was `457e5537816daeed2c421c592bc74c822a13e6bf7c076c878aa8c5147b2753bf`, equal to the commit blob. The receipt changed three substantive values: calibration solver identity, level-author input identity, and receipt identity. No causal claim beyond those observed byte/identity mismatches is made here.

### C5 — exact source listing

```text
solver\author-level.js:5:const { deriveCandidate, serialize, verifyCandidate } = require('./level-author');
solver\author-level.js:22:    const authored = deriveCandidate(readJson(shapePath));
solver\author-level.js:35:    const result = verifyCandidate(store, receipt);
solver\generate-levels.js:255:    const authored = deriveCandidate(entry.shape);
solver\generate-levels.js:275:      verifyCandidate({ schemaVersion: 1, candidates: [entry.candidate] }, entry.receipt);
solver\level-author.js:181:function deriveCandidate(shapeInput, options = {}) {
solver\level-author.js:253:function verifyCandidate(store, receipt, options = {}) {
```

No non-test call site passed `play:` or an options object selecting an evaluator.

### C6 — scope and protected bytes

Protected-byte command exited 0 with no diff output:

```text
C6_BYTE_IDENTITY_EXIT=0
```

Complete base-to-build changed-path output:

```text
A  docs/goals/evaluator-foundation/ATTACK-01.md
A  docs/goals/evaluator-foundation/ATTACK-02.md
A  docs/goals/evaluator-foundation/BUILD_CLAIMS.md
A  docs/goals/evaluator-foundation/CONTRACT.md
A  docs/goals/evaluator-foundation/INTENT_BRIEF.md
M  solver/calibration.js
A  solver/calibrations/calib-1.js
M  solver/candidate-levels.json
M  solver/candidate-levels.receipt.json
M  solver/level-author.js
M  solver/tests/calibration.test.js
A  solver/tests/evaluatorBoundary.test.js
M  solver/tests/levelAuthor.test.js
```

Every path is allowed by C6. `src/game.js`, `src/index.html`, `solver/engine.js`, and `solver/bot.js` were byte-identical to the frozen base.

### C7 — stopped and unrun

```text
NOT RUN: node --test solver/tests/*.test.js
NOT RUN: node solver/verify-loop.js
```

Per the frozen rule, this makes C7 FAIL. No builder output was substituted.

### C9 — bare build claims

```text
C1 — believed pass — `solver/calibrations/calib-1.js`, `solver/level-author.js`
C2 — believed pass — `solver/tests/evaluatorBoundary.test.js`, `solver/calibrations/calib-1.js`
C3 — believed pass — `solver/calibration.js`, `solver/candidate-levels.receipt.json`
C4 — believed pass — `solver/candidate-levels.json`, `solver/candidate-levels.receipt.json`
C5 — believed pass — `solver/level-author.js`, `solver/author-level.js`
C6 — believed pass — `solver/calibrations/calib-1.js`, `solver/calibration.js`, `solver/level-author.js`
C7 — believed pass — `solver/tests/calibration.test.js`, `solver/tests/levelAuthor.test.js`, `solver/tests/evaluatorBoundary.test.js`
C8 — believed pass — `EVIDENCE_LEDGER.md`
```

## SHA-256 of covered build artifacts

Hashes below are over the exact Git blob bytes at build commit `ac5a3f2badefdbf2081695d6cc89794869702b79`.

```text
a87e50bcff3a3d81640f6c46a3719627d4740538a34b8444527a4646cc88ce50  docs/goals/evaluator-foundation/CONTRACT.md
d8ca54c0437c3931909df3c2dfa10667611f8a780080dde2213dedc6647fc078  docs/goals/evaluator-foundation/BUILD_CLAIMS.md
8155ec75597e18d656b7dffb3a385dc8c0f49e160adbd8540f68b3f715f8cbe0  solver/level-author.js
46b8fed86bbd40d8834224664948ac25e97a23d1ef63c70ff067a5685713a445  solver/author-level.js
2c60efd5d2d7c6bac69422cd2633ee23ca19a7d5f1afffe52392b209b860c53f  solver/calibration.js
276fe4c893a193d940d4c8d80288d2db7f32253b618c9061cb9e64013dc5499c  solver/calibrations/calib-1.js
1327e13f7db9060ff6e54eb176d5f0cdd953c3f619330f115aed9abe6a57ae7a  solver/engine.js
c6ca87d430a5cfebb02738241a098eac41b1d08912ad68f4150c1b71b15e64b3  solver/bot.js
ff1d8900cd5d6e61a3895b1d9161b37486deaef846bb238f79fddf95747ae096  solver/tests/calibration.test.js
943fbd8aec1ec57c9ef4eced6a908664707baf6a4b4ced2acc64f1c923fcc1ff  solver/tests/evaluatorBoundary.test.js
bafc2a29eb1e7c23b2da871746896dec31300997199a9ffb503953853385ef6b  solver/tests/levelAuthor.test.js
a4c144bfb375e6c8bca0b2effaff18bd06f8be4639c4362de66e11429a6bfab8  solver/tests/bot.test.js
f5c5a56c106039d77ee16480fd1596f6d8bdea86c042744038385bc63d6bf66c  solver/candidate-shapes/gen-0014-wide-sprint.json
457e5537816daeed2c421c592bc74c822a13e6bf7c076c878aa8c5147b2753bf  solver/candidate-levels.json
c358a1141958a1ebf1c45e8f8dd5cfda28423cf8546c49200921b26d410c002b  solver/candidate-levels.receipt.json
426631d723b1d6a01ec58139151b502bd7ccfa96dd99539bad8d0557da9ba792  solver/verify-loop.js
9493407cd9dc8b7cefaefac811b52969c89a078aa7df4fd2a5fa1c1e64207115  src/game.js
20d6a71b3ee87b90b4ef53d2a2618bf5d0fe27b0ea3a3777e507e7fa9a7b7476  src/index.html
```

## Weakest evidence and class limitation

The weakest positive evidence is C5's source-level exclusion: it establishes the currently visible production call paths, not an exhaustive runtime noninterference proof. C1's eight fixture bodies were independently written by the cold verifier from the frozen names and allowed source inputs; they were not pre-existing frozen fixture bytes, although the load-bearing 450-game equivalence covered every required fitting and holdout seed.

This document establishes only pre-ledger verifier observations at the named commit. It does not establish human difficulty, fun, publication readiness, optimality, evaluator quality, or a MAP-Elites result. Because C3/C4 failed and C7 is unrun, none of these observations may be promoted into an evaluator-foundation ledger result.
