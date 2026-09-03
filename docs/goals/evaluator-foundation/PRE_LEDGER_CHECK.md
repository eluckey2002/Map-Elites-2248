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

---

# Run 2 — repair commit `3a2f5bb02724cf9e7483eaf2c16992b3fd530a8b`

**Overall Run 2 verdict: PASS**

**Frozen base:** `788cfac3501677bc596018526269c6d7b86fc72a`
**Checked on:** 2026-08-30
**Ledger admission:** permitted. The ledger was not edited and no `VERDICT.md` was written.

This was a fresh cold re-verification. No prior verdict was reused and no target was repaired. The preceding failed run is preserved as this file's exact first 13,070 canonical Git bytes; its pre-append Git-content SHA-256 is `1fea784152e6b3f265362da249d88ce9b0be18a748c01e2478ebe38b59b41331`.

## Run 2 verdicts

| Item | Verdict | Fresh deciding evidence |
|---|---|---|
| C1 | PASS | Exact calibration JSON; named tests `16 pass, 0 fail`; local graph only `calib-1 -> engine`; external side-by-side probe printed `PASS calib-1 base equivalence: 450 games + 8 fixtures`. |
| C2 | PASS | Boundary tests passed; full-file live-bot fault left bounded store/receipt hashes identical across fresh processes and different unrelated environments; exact import-path negative control failed specifically with `LIVE_BOT_FAULT_INJECTION`. |
| C3 | PASS | Receipt stamp exactly matched the recomputed engine-plus-evaluator identity `9be686...`; mismatch tests passed; independent replay recomputed the exact outer receipt identity. |
| C4 | PASS | Author, verify, and second author all exited 0 with identical tracked bytes; independent 150+300 replay matched measurements, target, terminal totals, identities, and canonical JSON. |
| C5 | PASS | Exact `rg` call-site search found no non-test `play:` override; every returned production call site passes no evaluator options; CLI exposes no evaluator selector. |
| C6 | PASS | Protected paths had no base diff; all 14 changed paths passed the frozen allowlist; the goal directory has only its six permitted tracked files. |
| C7 | PASS | Full suite `147 pass, 0 fail`; curve gate printed `52/52`, seven `[PASS]` lines, and `RESULT: PASS`. |
| C9 | PASS | Exactly eight C1-C8 build-claim lines, each `believed pass`, with no `verified` or `verdict`; complete path listings contain no extra builder result/verdict file. |

Overall Run 2 is PASS. Its weakest oracle class is source evidence because C5 and the role-ownership part of C9 require cold source inspection; the behavioral, replay, fault, identity, scope, suite, and curve checks are deterministic.

## Clean-worktree evidence

```text
normal: C:\ooo\Map-Elites-2248-verifier-run2-20260830-015559
HEAD=3a2f5bb02724cf9e7483eaf2c16992b3fd530a8b
STATUS_BEGIN=<empty>
STATUS_AFTER_DOUBLE_AUTHOR=<empty>
STATUS_AFTER_FULL_SUITE=<empty>
FINAL_NORMAL_CHECK_STATUS=<empty>

base:     C:\ooo\Map-Elites-2248-run2-base-20260830-015726
fault:    C:\ooo\Map-Elites-2248-run2-fault-20260830-015726
negative: C:\ooo\Map-Elites-2248-run2-negative-20260830-015726
```

The base and fault worktrees began clean at their stated commits. The two fault trees were then intentionally dirtied only by the frozen fault fixtures. No untracked file entered the normal detached worktree.

## Raw outputs and durable probes

Verify-kernel self-test:

```text
SELFTEST PASS — good=VERIFIED (expect VERIFIED), bad=NOT_FOUND (expect NOT_FOUND)
VERIFY_KERNEL_SELFTEST_EXIT=0
```

C1/C3 identity, source graph, and tests:

```text
{"version":"calib-1","params":{"wRoll":1,"wPlace":1,"turnover":40,"width":24,"bombMax":9,"tieBreak":"degree","wHarvest":0}}
tests 16
pass 16
fail 0
{"evaluatorLocal":["../engine"],"engineLocal":[],"ambientTokens":false,"exportsFrozen":true,"paramsFrozen":true}
```

Base equivalence:

```text
PASS calib-1 base equivalence: 450 games + 8 fixtures
shape=gen-0014-wide-sprint fitting=150 holdout=300 fixtureNames=ordinary choice|reachable bomb|unreachable bomb|lookahead setup|turnover tie|remnant placement|below immediate-score cutoff|degree tie-break
BASE_EQUIVALENCE_EXIT=0
```

`C:\ooo\Map-Elites-2248-run2-evidence-20260830-015726\base-equivalence.js`
SHA-256 `cbdc7f292544de4148b3a84014e25ec6e1a117062a4da7a575b0cc91960021b6`

The probe compared ordered coordinates, per-move score, terminal reason, final score, and moves used on all 450 games. Each fixture compared ordered choice and move score; the degree fixture also proved that `tieBreak: none` selects differently.

C2 fault arms:

```text
baseline storeSha256=f32bba2ca2c1726ec8c78a150f9e0d77a78c75f5dffa4853e98ac9ccfd614b22
baseline receiptSha256=1bab610fb20ae928a2f74cd0182c36834716cfd7542fd9c975c15c4c9462cd8f
fault    storeSha256=f32bba2ca2c1726ec8c78a150f9e0d77a78c75f5dffa4853e98ac9ccfd614b22
fault    receiptSha256=1bab610fb20ae928a2f74cd0182c36834716cfd7542fd9c975c15c4c9462cd8f
BASELINE_EXIT=0
FAULT_EXIT=0
STORE_HASH_IDENTICAL=True
RECEIPT_HASH_IDENTICAL=True

Error: LIVE_BOT_FAULT_INJECTION
    at Object.<anonymous> (...\solver\bot.js:1:7)
    at Object.<anonymous> (...\solver\level-author.js:14:24)
NEGATIVE_EXIT=1
NEGATIVE_HAS_EXACT_FAULT=True
```

The success processes had distinct unrelated marker sets: `RUN2_PROBE_ARM=baseline, UNRELATED_ALPHA=one` versus `RUN2_PROBE_ARM=fault, UNRELATED_BETA=two`. The negative tree changed only the literal evaluator module path before the same complete live-bot replacement.

`C:\ooo\Map-Elites-2248-run2-evidence-20260830-015726\bounded-author.js`
SHA-256 `e006beea13c7fc0b90d18f40a73d61b8687dcbb9a7d5e42152aab455187aec2a`

C4 exact authoring and replay:

```text
WROTE candidate a6c3e36031a17276354ba0d8b16e796d4338038fb984a581ffbe96cb9c3387f7
receipt ceee608e194c291c122aa50bfaca22495c3382468d0109301692928a11886347
holdout wins=196 lockouts=0 bombs=0 total=300
PASS candidate a6c3e36031a17276354ba0d8b16e796d4338038fb984a581ffbe96cb9c3387f7
holdout wins=196 lockouts=0 bombs=0 total=300
WRITE1_EXIT=0 VERIFY_EXIT=0 WRITE2_EXIT=0
STORE1=d2b6bf08251b7a9f16b0844523322edc591a4ece68cc277eec927c3c7a42f73e
STORE2=d2b6bf08251b7a9f16b0844523322edc591a4ece68cc277eec927c3c7a42f73e
RECEIPT1=a351e9c3df0a2887f6a0764751919d235d9d70e91014155cd1e9209f0e1d30eb
RECEIPT2=a351e9c3df0a2887f6a0764751919d235d9d70e91014155cd1e9209f0e1d30eb

PASS independent replay 150 fitting + 300 holdout
shapeIdentity=129c358075bb4cca00678ebc597be45bf59dea7b8c661a2372b2e4b3ee2be0a4
candidateIdentity=a6c3e36031a17276354ba0d8b16e796d4338038fb984a581ffbe96cb9c3387f7
receiptIdentity=ceee608e194c291c122aa50bfaca22495c3382468d0109301692928a11886347
solverIdentity=9be686646189feb3d255b3516ad7ab1e66be5cb9e1cc30a608e02dfb34056f27
fitting median=107904 target=102000
holdout wins=196 outOfMoves=104 lockouts=0 bombs=0 total=300
INDEPENDENT_REPLAY_EXIT=0
```

`C:\ooo\Map-Elites-2248-run2-evidence-20260830-015726\independent-replay.js`
SHA-256 `e959e7bd3a9c71a60a57cdfc34f60474845d1e0a1a028ac644c25fad0ad17e53`

The replay imported neither authoring module and independently implemented play, measurements, quantiles, target rounding, canonical JSON, and identities.

C5 relevant production call sites from the exact frozen `rg` command:

```text
solver\author-level.js:22:    const authored = deriveCandidate(readJson(shapePath));
solver\author-level.js:35:    const result = verifyCandidate(store, receipt);
solver\generate-levels.js:255:    const authored = deriveCandidate(entry.shape);
solver\generate-levels.js:275:      verifyCandidate({ schemaVersion: 1, candidates: [entry.candidate] }, entry.receipt);
C5_RG_EXIT=0
```

The complete output contained no `play:`. Every returned code call site was read. CLI usage is exactly `author-level.js --shape <manifest.json> --write | --verify <candidates.json> <receipt.json>`.

C6 scope:

```text
IMMUTABLE_DIFF_EXIT=0
CHANGED_COUNT=14
ALLOWLIST_BAD_COUNT=0
GOAL_DOC_COUNT=6
GOAL_DIRECTORY_BAD_COUNT=0
```

Complete changed paths were the six permitted goal files, `solver/calibration.js`, `solver/calibrations/calib-1.js`, both candidate JSON artifacts, `solver/level-author.js`, and the three permitted evaluator/calibration/level-author tests. No protected source or artifact was outside the allowlist.

C7 full suite and curve:

```text
tests 147
pass 147
fail 0
FULL_SUITE_EXIT=0

  [PASS] every level has a target and a tileScale: 52/52
  [PASS] tile scale doubles and never steps back: 1,2,4,8,16,32
  [PASS] level 1 is a guaranteed win: 1
  [PASS] hardest sampled level stays winnable: 57% at level 50
  [PASS] board lockouts stay rare: 0% at level 50
  [PASS] bomb explosions stay rare on 40-50: 0% at level 50
  [PASS] late levels are harder than early ones: 95% early vs 80% late
RESULT: PASS
CURVE_EXIT=0
```

C9 parser:

```text
CLAIM_LINES=8
VALID_CLAIM_LINES=8
CLAIM_NUMBERS=1,2,3,4,5,6,7,8
SELF_VERDICT_FINDINGS=0
```

## Artifact hashes

SHA-256 over exact on-disk bytes in the clean detached Windows worktree:

```text
1b29c2a7cc511ef2eb7df1f31eb12fbe2bfdd5380085d5644c29c7d0a7e13544  docs/goals/evaluator-foundation/CONTRACT.md
773b7f56473fe9c27dfc27546df54885a421e494c5c00ed336ba32586c48a891  docs/goals/evaluator-foundation/BUILD_CLAIMS.md
0e0ff8d43409f907529464ca115d9739049e0b3240d381c659570b94d3fee333  solver/level-author.js
6b3ea9b87420b14f7b7e5fb67216f892bf58b57081d0ce49880b04c68025f22d  solver/author-level.js
5435be6bb055d2b9bcdc8d2f372480a9660317abcedb64d98116d87ef3817491  solver/calibration.js
9043f9054340fff2928547aa6da71db520f5702bb7741848cdfc91174bce2300  solver/calibrations/calib-1.js
cb031d296014042795dcb8701b276c07cad78ac279038140595db0fb2ca944b1  solver/engine.js
2ee8ff985b24842969c9344c77bb2ec35b60a54399b17e31129dec7a49a13aa0  solver/bot.js
69255f3e71fa9c9de4f55304ad62de3fbca7d68d94e35f36f6a9454d480fb258  solver/tests/calibration.test.js
77af94ac175051649e10795352ba1870fd7e1a2dca5cf44f525e154f8a1afdf2  solver/tests/evaluatorBoundary.test.js
cb250239f1b2e9d8cc800172f8480d65c0fd84f4cf4ae41930788e1f041cb2b0  solver/tests/levelAuthor.test.js
38cdddc7a793d7109660023155f3c6438cb047f37fb2888c4f11f495783dcf0e  solver/tests/bot.test.js
dda7b2fd7aef1758db7867feed1a1a4422fd3ad52631c18aeba799e2e5e4fb47  solver/candidate-shapes/gen-0014-wide-sprint.json
d2b6bf08251b7a9f16b0844523322edc591a4ece68cc277eec927c3c7a42f73e  solver/candidate-levels.json
a351e9c3df0a2887f6a0764751919d235d9d70e91014155cd1e9209f0e1d30eb  solver/candidate-levels.receipt.json
df517044fad399db473892791c42ca14a48e3c2633503650ca87420dafff2a94  solver/verify-loop.js
405f13d5cd52408db3d3109ad1540a2bc7f9ad70626463fece18d26de83fb55c  src/game.js
95dbd3d2fd3af2dd73b08017737af298bc9e091778d25e9648791440a4cbfb5d  src/index.html
```

Runtime: Node `v24.19.0`.

## Limitations

- This admits only the frozen evaluator boundary and exact gen-0014 receipt/replay facts at the named identities. It does not establish human difficulty, fun, publication approval, optimality, evaluator competence, or a MAP-Elites result.
- The independent replay treats `receipt.inputIdentities` as signed receipt content while recomputing the complete outer receipt identity; its contract-limited inputs omit `solver/level-author.js`. The exact author/verify commands separately enforce current input identities.
- C5 is source-level exclusion over every returned call site, not proof over hypothetical dynamically generated code.
- For C9, `BUILD_CLAIMS.md` is the only builder-owned goal file under the frozen role ownership. Forbidden cold-context files were not content-scanned; complete path listings show no additional builder result/verdict file.
- Temporary probes are outside Git; their durable paths and SHA-256 hashes bind the exact scripts used.

All required Run 2 C1-C7 and C9 checks ran and passed. Ledger admission is permitted; the ledger remains untouched pending the steward phase.
