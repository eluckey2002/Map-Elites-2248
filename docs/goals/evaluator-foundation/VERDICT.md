# Final verdict — evaluator foundation

**Overall verdict: PASS**

**Frozen base:** `788cfac3501677bc596018526269c6d7b86fc72a`
**Verified code commit:** `3a2f5bb02724cf9e7483eaf2c16992b3fd530a8b`
**Pre-ledger verification commit:** `92682ced67b3df64b5d2d3c5ac04ab8f9d3c9686`
**Final evaluated ledger commit:** `8caf6a4ecc7635a88a549bd91a10d103a90e7f7b`
**Checked on:** 2026-08-30

This is the immutable final cold-verifier judgment required by the frozen contract. The same verifier that authored `PRE_LEDGER_CHECK.md` Run 2 confirmed that the steward commit is a direct child of the pre-ledger commit and that only `EVIDENCE_LEDGER.md` changed between them. No target was repaired during this phase.

## Cold answer for C8

**Yes.** From `92682ced67b3df64b5d2d3c5ac04ab8f9d3c9686` to `8caf6a4ecc7635a88a549bd91a10d103a90e7f7b`, the complete changed-path output is:

```text
M  EVIDENCE_LEDGER.md
19 additions, 0 deletions
```

The ledger adds one accepted record, `RESULT-0015`, plus its current-snapshot and resume-boundary navigation. Every load-bearing clause resolves to the preserved Run 2 evidence:

- behavior equivalence: 450 fitting-plus-holdout games and 8 focused fixtures;
- independent replay: 150 fitting seeds and 300 holdout seeds;
- exact target and fitting median: `102000` and `107904`;
- exact holdout totals: 196 wins, 104 out-of-moves, 0 lockouts, 0 bombs, total 300;
- receipt identity: `ceee608e194c291c122aa50bfaca22495c3382468d0109301692928a11886347`;
- engine-plus-evaluator identity: `9be686646189feb3d255b3516ad7ab1e66be5cb9e1cc30a608e02dfb34056f27`;
- clean-checkout reproducibility: exact double-author artifact hashes and an empty normal verification worktree before and after checks.

All cited repository paths resolve at the evaluated ledger commit. The ledger proof class remains `exact_result` at the exact evaluator, candidate, seed, and repository scope; it does not convert sampled outcomes into human difficulty, fun, publication approval, optimality, or a MAP-Elites result. The original failed pre-ledger run remains intact. The frozen-base-to-ledger diff likewise contains additions only, so no prior ledger record text was deleted.

The evaluated canonical ledger blob has SHA-256 `2777780b911230c83bbdb18278569fdaa85167a7a55339be27418fdd0babeed9`.

## Commitment verdicts

### C1 — PASS

- **oracle:** `PRE_LEDGER_CHECK.md` Run 2 C1: exact calibration command, named 16-test command, cold import-graph inspection, and external 450-game-plus-8-fixture base-equivalence probe.
- **oracle_class:** `evidence` (deterministic outputs plus cold source resolution).
- **evidence:** exact frozen parameter JSON; 16 pass / 0 fail; local graph only `calib-1 -> engine`; `PASS calib-1 base equivalence: 450 games + 8 fixtures`.
- **covers:** frozen base `788cfac...`, code `3a2f5bb...`, and the artifact hashes recorded by Run 2. Those covered inputs are unchanged through ledger commit `8caf6a4...`.

### C2 — PASS

- **oracle:** `PRE_LEDGER_CHECK.md` Run 2 C2: evaluator-boundary regression, full live-bot file fault, and exact import-path negative control.
- **oracle_class:** `deterministic`.
- **evidence:** successful bounded derivations had identical store and receipt SHA-256 values across fresh processes and distinct unrelated environments; the negative control exited 1 specifically with `LIVE_BOT_FAULT_INJECTION`.
- **covers:** code and evaluator artifacts at `3a2f5bb...`, unchanged through `8caf6a4...`.

### C3 — PASS

- **oracle:** `PRE_LEDGER_CHECK.md` Run 2 C3: named tests, complete local import-graph probe, and independent calibration/receipt identity recomputation.
- **oracle_class:** `evidence`.
- **evidence:** solver identity `9be686646189feb3d255b3516ad7ab1e66be5cb9e1cc30a608e02dfb34056f27`; frozen exports; no ambient tokens; exact outer receipt identity; missing and re-signed mismatch cases rejected.
- **covers:** named engine, evaluator, calibration, and receipt bytes at `3a2f5bb...`, unchanged through `8caf6a4...`.

### C4 — PASS

- **oracle:** `PRE_LEDGER_CHECK.md` Run 2 C4: exact author/verify/double-author commands and the independent replay script importing neither authoring module.
- **oracle_class:** `deterministic`.
- **evidence:** candidate identity `a6c3e36031a17276354ba0d8b16e796d4338038fb984a581ffbe96cb9c3387f7`; receipt identity `ceee608e...`; identical output artifact hashes across both authoring runs; `PASS independent replay 150 fitting + 300 holdout` with all normative measurements exact.
- **covers:** gen-0014 shape, candidate, receipt, engine, and evaluator at `3a2f5bb...`, unchanged through `8caf6a4...`.

### C5 — PASS

- **oracle:** `PRE_LEDGER_CHECK.md` Run 2 C5: frozen `rg` command plus cold reading of every returned production call site and CLI usage.
- **oracle_class:** `evidence`.
- **evidence:** no non-test `play:` override; author and generator call sites pass no evaluator-selection options; CLI exposes only author and verify operations.
- **covers:** production call sites and CLI source at `3a2f5bb...`, unchanged through `8caf6a4...`.

### C6 — PASS

- **oracle:** `PRE_LEDGER_CHECK.md` Run 2 C6 protected-byte diff and complete base-to-build allowlist; final-phase pre-to-steward complete changed-path diff.
- **oracle_class:** `deterministic`.
- **evidence:** protected source diff exit 0; Run 2 allowlist bad count 0; final phase changed only `EVIDENCE_LEDGER.md`, an explicitly allowed path.
- **covers:** frozen base through final evaluated ledger commit `8caf6a4...`.

### C7 — PASS

- **oracle:** `PRE_LEDGER_CHECK.md` Run 2 full suite and curve gate.
- **oracle_class:** `deterministic`.
- **evidence:** 147 pass / 0 fail; curve `52/52`; seven `[PASS]` lines; `RESULT: PASS`.
- **covers:** test, solver, bot, engine, and shipped-game bytes at `3a2f5bb...`, unchanged through `8caf6a4...`.

### C8 — PASS

- **oracle:** direct-parent and complete changed-path checks; frozen-base and pre-ledger `git diff --unified=0` over `EVIDENCE_LEDGER.md`; clause-by-clause resolution against `PRE_LEDGER_CHECK.md` Run 2 and its identities.
- **oracle_class:** `evidence`.
- **evidence:** steward parent exactly `92682ced...`; only `EVIDENCE_LEDGER.md` changed; 19 additions / 0 deletions; one `RESULT-0015`; exact identities and measurements match Run 2; proof class and explicit non-promotions are correct; every cited repository path resolves.
- **covers:** pre-ledger commit `92682ced...`, final evaluated ledger commit `8caf6a4...`, and ledger SHA-256 `2777780b...`.

### C9 — PASS

- **oracle:** `PRE_LEDGER_CHECK.md` Run 2 C9 parser and complete directory/path inspection.
- **oracle_class:** `evidence`.
- **evidence:** exactly eight valid C1-C8 bare-claim lines; no `verified` or `verdict` finding; no extra builder result/verdict path.
- **covers:** builder claims and goal-directory paths at `3a2f5bb...`, unchanged through `8caf6a4...` except the role-owned pre-ledger evidence and this authorized final-verdict file.

## Overall judgment

All frozen commitments C1 through C9 are PASS. The overall verdict is therefore **PASS**, and its weakest oracle class is **evidence**.

This verdict establishes only the trustworthy evaluator boundary and the exact reproducible gen-0014 receipt/replay result at the identities above. It does not ship gen-0014, approve publication, measure human difficulty or fun, establish candidate optimality, or establish a MAP-Elites result.
