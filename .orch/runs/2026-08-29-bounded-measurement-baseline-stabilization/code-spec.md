# Frozen-calibration and live-corpus stabilization

- **run:** `2026-08-29-bounded-measurement-baseline-stabilization`
- **objective:** A committed code revision makes new candidate target measurement use `calib-1` explicitly and leaves the live receipt corpus with exactly the two deliberate shipped historical failures after retiring the unshipped stale Level 54 candidate.
- **routing:**
  - **pack:** `orch-code-pack`
- **target repository:** Isolated worktree on branch `codex/research-session-2026-08-28`, derived exactly from `90166907437c7b686f868be0e049325d97fb00f6`.
- **standards owner:** Repository `AGENTS.md`, `EVIDENCE_LEDGER.md`, `CURRENT.md`, and the existing authoring, calibration, receipt-gate, archive, and check-card conventions at the baseline revision.
- **acceptance as runnable checks:** The deterministic commands and named negative controls below decide this code deliverable.

## Non-goals

- Do not change game rules, scoring, shipped levels, targets, the live bot defaults, the engine, the generator's search space, or any MAP-Elites code or artifact.
- Do not re-author Levels 52 or 53, and do not make their historical receipts pass.
- Do not run candidate generation or measurement to create a replacement Level 54.
- Do not admit ledger evidence or refresh project navigation in this code delivery; that is the successor content delivery.

## Acceptance

1. **Candidate measurement uses the complete frozen calibration.**
   - Oracle: `node --test solver/tests/calibration.test.js solver/tests/levelAuthor.test.js` passes a new test that observes `playMeasured` supplying `CALIBRATION_PARAMS` to `chooseMove`, including keys whose frozen value differs from `DEFAULT_PARAMS`, and proves a mutation to the live defaults cannot enter the candidate measurement seam.
   - Oracle class: `deterministic`, provenance `authored`; downstream independent review required.
2. **Receipts identify the ruler that produced the target.**
   - Oracle: the focused tests prove new receipts include `calibrationStamp()` and `defaultInputIdentities()` hashes `calibration.js`; the input-closure gate includes that new dependency and its existing staged unhashed-require negative control still fails for the intended reason.
   - Oracle class: `deterministic`, provenance mixed `authored` and `pre-existing`.
3. **Only the unshipped stale Level 54 leaves the live corpus.**
   - Oracle: its exact candidate and receipt bytes are preserved under unique identity-bearing names in `solver/candidates-archive/`; `solver/candidate-corpus.json` removes only `candidate-levels-54.json`; the archive README states that its receipt measurements are stale and not quotable; no replacement candidate is created.
   - Oracle class: `deterministic`, provenance `pre-existing` identities plus authored manifest change.
4. **The corpus gate is neither weakened nor cosmetically greened.**
   - Oracle: `node --test solver/tests/receiptGate.test.js` exits nonzero with exactly two failing per-store cases, `candidate-levels-52.json` and `candidate-levels.json`, both `code/input identity mismatch`; every other test passes. A permanent corpus-drift negative control remains green because it proves an unauthorized disappearance is detected. `docs/CHECK-CARDS.md` accurately records the new two-store live scope and the authorized retirement boundary.
   - Oracle class: `deterministic`, provenance mixed `pre-existing` and `authored`; the named-failure fingerprint substitutes for an impossible green baseline because the hard gate deliberately preserves historical failures.
5. **The result is scope-clean and protected.**
   - Oracle: `git diff --check`; changed source paths are limited to `solver/level-author.js`, `solver/tests/levelAuthor.test.js`, `solver/tests/receiptGate.test.js`, `solver/candidate-corpus.json`, the two uniquely named archived Level 54 files, `solver/candidates-archive/README.md`, and `docs/CHECK-CARDS.md`, plus run/ticket bookkeeping. SHA-256 for `src/game.js`, `solver/bot.js`, and `solver/engine.js` remains exact.
   - Oracle class: `deterministic`, provenance `pre-existing`.

## Binding constraints

- `playMeasured` must pass the literal frozen `CALIBRATION_PARAMS` object; omitting a key and falling back to `DEFAULT_PARAMS` is a failure.
- `calibration.js` remains append-only in meaning: do not edit `calib-1`.
- Preserve the Level 54 candidate identity `0a3b9adfd4ca7e31248170393dff025b25366f0f62090a55bf227930acaf863f` and exact source file hashes `85fec476d726fde61f2d5e37f3c6c0540853e653d0a542f84936a925116cfa7e` and `68bd8e99b85976c80ce108a3d92884904c3ead2c55dbc0b1d43cd384b916af9e`.
- Preserve baseline hashes: `src/game.js` `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee`, `solver/bot.js` `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`, `solver/engine.js` `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`, and `solver/calibration.js` `584f99aae3dafd7fccd7dc25e0adcb2ae9867f85d267a79261d528c40e1f774f`.
- The receipt gate's enforcement remains HARD. Membership changes only through the manifest signature and archive record the existing gate was designed to require.

## Evidence

- Completed investigation ticket `.orch/tickets/2026-08-29T01-59-57Z-adhoc-next-best-course/investigate-next-best-course.md` in the controlling checkout.
- Pre-change focused suite: 34 tests, 31 pass, exactly three stale-receipt failures: Levels 52, 53, and unshipped 54.
- `solver/calibration.js` already defines and stamps `calib-1`; `solver/level-author.js` does not import or pass it at baseline.
- `solver/tests/receiptGate.test.js` proves Levels 52 and 53 are shipped and exempt only in explanatory wording, while Level 54 is unshipped and not exempt.

## Affected surfaces

- `solver/level-author.js`
- `solver/tests/levelAuthor.test.js`
- `solver/tests/receiptGate.test.js`
- `solver/candidate-corpus.json`
- `solver/candidate-levels-54.json` and `.receipt.json` as retired inputs
- `solver/candidates-archive/`
- `docs/CHECK-CARDS.md`
- Run-owned worklog and ticket paths.

## Bound

- Two red-green slices: frozen calibration and authorized corpus retirement.
- No generated measurements, no rule changes, and no work outside the named paths.
- `plan_gate: false` — the owner approved only these four stabilization items.

## Risks

- A partial parameter override would look frozen while silently inheriting future live defaults; complete key-set parity and the observed-call test close that path.
- Archiving can hide inconvenient failures; exact identity preservation, manifest signature, the existing disappearance negative control, and an updated check card make this retirement explicit and reviewable.
