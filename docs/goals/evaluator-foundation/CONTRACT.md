# Contract — Trustworthy evaluator foundation

**Status:** FROZEN — BUILD AUTHORIZED WITHIN THIS CONTRACT

**Intent:** [INTENT_BRIEF.md](INTENT_BRIEF.md)

**Frozen base candidate:** Git `788cfac3501677bc596018526269c6d7b86fc72a` on `level-curve-retune`.

## Commitments

### C1. Production authoring uses a genuinely versioned evaluator

Create `solver/calibrations/calib-1.js` as the frozen evaluator used for candidate fitting and holdout play. It owns both the complete `calib-1` parameter set and the move-selection implementation needed to apply those parameters. It must not import `solver/bot.js`, `DEFAULT_PARAMS`, or any live-bot function. `solver/level-author.js` must import its production `chooseMove` directly from `./calibrations/calib-1`; test-only fake play remains injectable only through the existing programmatic test seam.

The exact frozen identity is:

```json
{"version":"calib-1","params":{"wRoll":1,"wPlace":1,"turnover":40,"width":24,"bombMax":9,"tieBreak":"degree","wHarvest":0}}
```

Separation must preserve behavior before it freezes it. Against Git `788cfac3501677bc596018526269c6d7b86fc72a`, `calib-1` must choose the same ordered tile coordinates and produce the same per-move score, terminal reason, and final score as the base `solver/bot.js` called with the exact parameters above. The required corpus is all 450 gen-0014 fitting/holdout games plus fixed fixtures for: ordinary choice, reachable bomb, unreachable bomb, lookahead setup, turnover tie, remnant placement, a candidate below the immediate-score cutoff, and the degree tie-break. Harvest remains disabled at `wHarvest: 0`.

Deciding checks:

```powershell
node -e "const c=require('./solver/calibrations/calib-1'); console.log(JSON.stringify({version:c.CALIBRATION_VERSION,params:c.CALIBRATION_PARAMS}))"
node --test solver/tests/calibration.test.js solver/tests/levelAuthor.test.js solver/tests/evaluatorBoundary.test.js
```

Expected: the first command prints the exact JSON above. The tests exit 0 with `fail 0` and include these passing names:

- `production authoring imports the versioned evaluator and not the live bot`
- `production authoring passes the complete frozen calibration parameters`
- `the frozen ruler pins every live-bot parameter name`

Cold source check: `solver/calibrations/calib-1.js` has no import path to `solver/bot.js`, and no non-test caller can supply the `play` override. Expected: yes.

Cold base-equivalence check: a verifier script outside the repository loads the base-commit bot with the frozen parameters and the build's `calib-1` side-by-side on the required corpus. Expected: `PASS calib-1 base equivalence: 450 games + 8 fixtures`, with no move or outcome mismatch.

### C2. Live-bot parameter and algorithm changes cannot move authored output

The frozen evaluator's output and identity must be independent of both the live bot's parameter values and its implementation bytes.

Deciding check:

```powershell
node --test solver/tests/evaluatorBoundary.test.js
```

Expected: exit 0, `fail 0`, and a passing test named `live bot parameter changes cannot move frozen evaluator output`. That test derives the same bounded fixture twice through the production evaluator, mutates every in-memory `DEFAULT_PARAMS` value between arms, restores it afterward, and requires byte-identical store, target, measurements, calibration stamp, and receipt. It may use the same reduced seed ranges in both arms, but it may not inject a fake `play` function or fake input identities.

Cold algorithm-fault check in a clean temporary checkout:

1. Author the bounded fixture and retain its two output hashes.
2. Replace the entire temporary checkout's `solver/bot.js` with `throw new Error('LIVE_BOT_FAULT_INJECTION');`.
3. Author the same fixture again. Both derivations must complete and both output hashes must remain identical.
4. In a second temporary checkout, change only the literal module path `./calibrations/calib-1` in `solver/level-author.js` to `./bot`, apply the same live-bot fault, and repeat. This negative control must fail specifically with `LIVE_BOT_FAULT_INJECTION`, not a syntax, loading, or assertion-shape error.

The two successful derivations also run in separate fresh Node processes with different unrelated environment-variable sets. Their hashes must remain identical.

### C3. Every receipt identifies and enforces its calibration

`calibrationStamp()` must return the exact `calib-1` version and parameters from C1 plus a lowercase SHA-256 `solverIdentity` covering `solver/engine.js` and `solver/calibrations/calib-1.js`. It must not hash `solver/bot.js`. New receipts contain that stamp as `calibration`. Verification fails closed if the stamp is missing or differs in version, parameters, or solver identity, even if the altered receipt's outer identity has been recomputed.

`solver/calibrations/calib-1.js` may import repository code only from `solver/engine.js`; standard Node modules are allowed only when they do not read time, randomness, environment, filesystem, network, or process state. Its exported version and parameter object must be frozen, and its move choice may depend only on the supplied game state, supplied deterministic lookahead RNG, and the frozen parameters. No mutable module-level evaluation state is allowed. The cold verifier checks the complete local import graph; if any additional local dependency exists, C3 fails rather than silently omitting it from the identity.

Deciding check:

```powershell
node --test solver/tests/calibration.test.js solver/tests/evaluatorBoundary.test.js solver/tests/levelAuthor.test.js
```

Expected: exit 0, `fail 0`, and these passing names:

- `calibration identity covers the engine and versioned evaluator but not the live bot`
- `authored receipts carry the exact frozen calibration stamp`
- `verification rejects missing or re-signed mismatched calibration stamps`
- `calibration exports are frozen and evaluation has no ambient-state dependency`

The cold verifier recomputes the stamp from the two named files and compares it byte-for-byte with the receipt.

### C4. gen-0014 is re-authored and independently replayed

Re-author `solver/candidate-shapes/gen-0014-wide-sprint.json` through the frozen evaluator. The tracked `solver/candidate-levels.json` and `solver/candidate-levels.receipt.json` must describe gen-0014, contain the enforced calibration stamp, use disjoint fitting seeds 0–149 and holdout seeds 100000–100299, and pass the existing gates. Its target and win count are measured outputs, not preselected success criteria.

The frozen-base measurement, made before contract freeze with Git `788cfac3501677bc596018526269c6d7b86fc72a` plus the exact C1 parameters, is normative: fitting median `107904`, rounded target `102000`, holdout wins `196`, holdout out-of-moves `104`, lockouts `0`, bombs `0`, total `300`. The build must reproduce these exact values; it may not tune behavior to cross a looser gate.

Authoring mathematics remain unchanged from the frozen base:

- sort scores numerically ascending;
- quantile index is `min(floor(count × q), count - 1)` for `q` = 0.25, 0.5, and 0.75;
- target is `floor(median × demand / step) × step`, where step is 1000 at values at least 100000, 100 at values at least 10000, 50 at values at least 1000, otherwise 10;
- tile scale is `2 ** floor((level - 1) / 10)`;
- identities are lowercase SHA-256 of UTF-8 canonical JSON with recursively sorted object keys and preserved array order;
- tracked JSON is canonical data rendered with two-space indentation and one trailing newline.

Builder checks:

```powershell
node solver/author-level.js --shape solver/candidate-shapes/gen-0014-wide-sprint.json --write
node solver/author-level.js --verify solver/candidate-levels.json solver/candidate-levels.receipt.json
```

Expected: both exit 0. Verification prints `PASS candidate <64 lowercase hex characters>` and `holdout wins=196 lockouts=0 bombs=0 total=300`; the candidate target is exactly `102000`.

Determinism check: run authoring twice without changing inputs. SHA-256 hashes of both output JSON files must be identical across runs.

Independent replay check: the cold verifier runs a temporary script outside the repository that must not import `solver/level-author.js` or `solver/author-level.js`. From only the tracked shape, candidate, receipt, `solver/engine.js`, and `solver/calibrations/calib-1.js`, it independently replays all 150 fitting seeds and 300 holdout seeds; recomputes quantiles, terminal totals, rounded target, shape identity, candidate identity, receipt identity, and calibration identity; and compares every value with the tracked artifacts. Expected: `PASS independent replay 150 fitting + 300 holdout`, with exact equality throughout.

### C5. Test-only evaluator injection cannot bypass production

The programmatic `play` override may remain for deterministic unit fixtures, but only files under `solver/tests/` may pass it. The CLI and every non-test production caller must use the frozen evaluator and offer no flag, environment variable, configuration field, or alternate call path that selects a different evaluator.

Deciding checks:

```powershell
rg -n "deriveCandidate|verifyCandidate|play:" solver --glob "!solver/tests/**"
node solver/author-level.js --shape solver/candidate-shapes/gen-0014-wide-sprint.json --write
```

Expected: the source listing shows the override only inside the two function implementations, never at a non-test call site; the CLI author command exits 0 and its usage surface exposes no evaluator override. A cold verifier answers yes after reading every returned call site.

### C6. The shipped game and live bot do not change

Allowed build paths are limited to:

- `solver/level-author.js`
- `solver/calibration.js`
- `solver/calibrations/calib-1.js`
- evaluator, calibration, and level-author tests under `solver/tests/`
- `solver/candidate-levels.json`
- `solver/candidate-levels.receipt.json`
- `EVIDENCE_LEDGER.md`
- `docs/goals/evaluator-foundation/`

No other source or artifact may change. In particular, `src/game.js`, `src/index.html`, `solver/engine.js`, `solver/bot.js`, game rules, shipped levels, shipped targets, and live-bot behavior remain byte-identical to the frozen base.

The only permitted files under `docs/goals/evaluator-foundation/` are `INTENT_BRIEF.md`, `CONTRACT.md`, `ATTACK-01.md`, `ATTACK-02.md`, `BUILD_CLAIMS.md`, `PRE_LEDGER_CHECK.md`, and `VERDICT.md`. Only the builder may write `BUILD_CLAIMS.md`; only the cold verifier may write the two check/verdict files. No other builder-authored result, evidence, or verdict file is permitted.

Deciding check:

```powershell
git diff --exit-code 788cfac3501677bc596018526269c6d7b86fc72a -- src/game.js src/index.html solver/engine.js solver/bot.js
```

Expected: exit 0 and no output. A cold verifier checks the complete base-to-build changed-path list, including formerly untracked files, against the allowlist and answers yes only when every path is allowed.

### C7. Existing repository gates stay green

Deciding checks:

```powershell
node --test solver/tests/*.test.js
node solver/verify-loop.js
```

Expected: both exit 0; tests print `fail 0`; the curve check prints `52/52`, seven `[PASS]` lines, and `RESULT: PASS`.

All C1–C7 checks run from a clean detached worktree of one local build commit. `git status --porcelain` must be empty before and after. The verifier copies no untracked file into that worktree and records the build commit hash. Creating that local verification commit is authorized by this contract after freeze; push, PR, and merge are not.

### C8. The evidence ledger records only independently checked facts

Verification is two-phase:

1. The cold verifier writes `PRE_LEDGER_CHECK.md` covering C1–C7 and C9, including artifact hashes and raw outputs. It is evidence for ledger admission, not the final verdict.
2. Only after that check passes may the steward append one source-pinned ledger record and any required current-snapshot/resume navigation updates.
3. The same cold verifier confirms that only `EVIDENCE_LEDGER.md` changed since the pre-ledger commit, checks the new text against its own hashes and outputs, and then writes the immutable final `VERDICT.md` covering C1–C9.

The ledger record must state only that the frozen evaluator boundary and gen-0014 receipt/replay passed at their exact identities. It must not promote sampled bot outcomes into human difficulty, publication approval, optimality, or a MAP-Elites result. Prior records remain intact.

Deciding check:

```powershell
git diff --unified=0 788cfac3501677bc596018526269c6d7b86fc72a -- EVIDENCE_LEDGER.md
```

Expected: no prior record text is deleted; each new factual clause resolves to source, receipt identity, `PRE_LEDGER_CHECK.md`, or raw output; proof classes remain exact. The final verdict includes the cold answer and the pre-ledger/final commit hashes.

### C9. The build makes only bare claims

The builder writes `BUILD_CLAIMS.md` beside this contract. For C1–C8 it contains only `believed pass` or `known fail`, plus artifact paths. It contains no self-issued verdict.

Deciding check:

```powershell
Get-Content docs/goals/evaluator-foundation/BUILD_CLAIMS.md
```

Expected: exactly one entry for C1–C8, each using `believed pass` or `known fail`.

Cold directory check: no other builder-authored file under `docs/goals/evaluator-foundation/` contains `PASS`, `FAIL`, `verified`, `verdict`, or an evidentiary claim. Expected: no findings outside the role-owned files named in C6.

## Waived

- **Human-quality improvement:** waived because the selected finish line is evaluator stability, and all eight retained recordings come from one player.
- **Training or tuning:** waived; changing evaluator competence would prevent isolation of evaluator drift.
- **Shipping gen-0014:** waived; publication remains an owner decision after qualification.
- **A second calibration version:** waived until one is proposed. This delivery preserves `calib-1`; it does not invent `calib-2`.
- **Browser/visual review:** waived because no player-facing code or shipped level may change.
- **MAP-Elites implementation:** waived as a separate future goal that depends on a trustworthy evaluator.
- **Remote publication:** waived. The clean-checkout verdict requires local commits, but this contract does not authorize push, PR, merge, or branch cleanup.

## Verdict rules

- Each commitment receives PASS or FAIL with raw command output or the specified cold answer.
- Builder-written tests are regression support, not sufficient independent judgment for C1–C5; the cold source, fault, and replay checks are mandatory.
- The verifier reads only the frozen contract, allowed build artifacts, and exact source inputs named by the contract. It does not read `ATTACK-01.md`, builder reasoning, or chat history.
- The verifier never repairs.
- Overall PASS requires C1–C9 all PASS. Any unrun required check is FAIL.

## Freeze

Owner sign-off wording: `freeze evaluator-foundation contract`

Frozen at: `2026-08-30T01:33:09-05:00`

Session: `/root` goal-forge run, evaluator-foundation

SHA-256 immediately before this freeze stamp: `ca2cd2328ecac7b679fc3df22251a515aeddd36554fe30b804e5365bbda9f356`

Post-freeze amendments require explicit owner approval and an append-only diff record. Any amendment that follows a failing verdict and weakens its deciding check must be flagged as freeze erosion.
