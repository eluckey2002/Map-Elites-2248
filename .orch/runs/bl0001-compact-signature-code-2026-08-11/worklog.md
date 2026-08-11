# Worklog: compact-signature experiment runner

- **run:** `bl0001-compact-signature-code-2026-08-11`
- **spec:** `.orch/runs/bl0001-compact-signature-code-2026-08-11/spec.md`
- **tickets:** `.orch/tickets/bl0001-compact-signature-code-2026-08-11/`

## Goal

### Objective

A deterministic, tested runner can exhaustively compare declared compact state signatures against exact future maxima over a frozen reduced-board corpus and emit a self-identifying machine-readable receipt for independent re-verification.

### Acceptance

1. The frozen scenario manifest declares its schema version, experiment ID, shipped-rule parameters, deterministic refill stream, exhaustive board alphabets/shapes, horizons, prefix depth, signature definitions, exact comparison metric, resource caps, and fixed source identities.
2. The runner exhaustively generates each declared starting board and physical prefix action, deduplicates exact successor boards without merging distinct futures, computes the exact remaining maximum under the frozen cursor/stream, groups successors by each declared signature, and reports collision counts plus the smallest reproducible counterexample.
3. The baseline signature and the survivor/action-class extensions have explicit, searchable definitions whose fields are serialized canonically; malformed manifests, exhausted spawn streams, exact-node caps, and incomplete fixture results fail closed rather than appearing collision-free.
4. A separate verifier can recompute the frozen run from the manifest and reject a tampered collision count, counterexample, input identity, or incomplete result.
5. Existing solver behavior remains green and the new module does not alter `solver/engine.js`, `solver/exact-score.js`, product code, or prior frozen receipts.
6. The code follows the existing solver's explicit CommonJS/module-export style, keeps one concept per named helper, and exposes only the runner/verifier seams required by tests and CLI use.

## State

- **opened:** 2026-08-11
- **base:** Git `main` at `10a849d5336bdda89d2d3f5ed1f1ca87e536811d` with pre-existing dirty work.
- **workspace:** exclusive live-checkout path scope because required exact-search seams are untracked relative to `HEAD`; exception logged in `.orch/friction/2026-08.jsonl`.
- **authorized project paths:** `solver/compact-signature/` and `docs/experiments/EXP-0001-compact-state-signature/scenario.json` only.
- **protected identities:** `solver/engine.js` `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b`; `solver/exact-score.js` `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`; ledger `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`; handoff `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.

## Iterations

### Iteration 1 — intake and spec freeze

- Completed investigation `.orch/tickets/bl0001-compact-signature-2026-08-11/intake-investigation.md` at SHA-256 `60beb9498bb300772ac48472caf7f85bed3acd73a6b8718f3ce7af21413a99e2`; 52 focused tests passed and bounded fixture sizing established the code seam.
- `orch-spec` froze `.orch/runs/bl0001-compact-signature-code-2026-08-11/spec.md` as the first step of runtime composition `.orch/runs/bl0001-compact-signature-2026-08-11/composition.md`.
- Kind count: three end-state kinds—code, research, content—chained in that order. Only the code spec exists now; successor specs wait for predecessor result identities.
- Next: decompose and execute the code delivery.

## Blame classes

- **caller under-supplied:** the frozen code spec bound a shared dirty live checkout and prohibited commits while the stamped executor requires an isolated clean Git baseline and per-slice commits.

## Failed approaches

- The initial code spec/ticket was rejected before execution. Evidence: `orch-tdd` Require/Never contract versus the spec's Target repository workspace exception and no-commit constraint. No deliverable or test changed. A successor run must use a disposable isolated Git snapshot and integrate only the authorized path diff back into the live checkout.

## Queued scope

- Full frozen execution and claim synthesis belong to the successor research step.
- Experiment protocol and project-record updates belong to the successor content step.
- Dead-end catalog and structural validator remain conditional on observed repeated need.

## Terminal

- **state:** `failed`
- **deciding evidence:** `.orch/tickets/bl0001-compact-signature-code-2026-08-11/compact-signature-tracer.md` records the unsatisfied executor precondition; no acceptance criterion ran.
