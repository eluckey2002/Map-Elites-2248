# Worklog: compact-signature experiment runner v2

- **run:** `bl0001-compact-signature-code-v2-2026-08-11`
- **spec:** `.orch/runs/bl0001-compact-signature-code-v2-2026-08-11/spec.md`
- **tickets:** `.orch/tickets/bl0001-compact-signature-code-v2-2026-08-11/`

## Goal

### Objective

A deterministic, tested runner can exhaustively compare declared compact state signatures against exact future maxima over a frozen reduced-board corpus and emit a self-identifying machine-readable receipt for independent re-verification.

### Acceptance

1. The scenario manifest completely freezes the diagnostic corpus, rules, signatures, metric, identities, and caps.
2. The runner exhaustively enumerates boards and prefix actions, preserves exact successors, computes exact future maxima, and returns canonical collision evidence.
3. Signature definitions are explicit and malformed/incomplete/capped executions fail closed.
4. A separate verifier recomputes valid results and rejects tampering.
5. Existing behavior and protected identities remain fixed, and only authorized diffs integrate into the live checkout.
6. Code holds the existing solver idiom and does not fork game rules.

## State

- **opened:** 2026-08-11
- **workspace:** `/private/tmp/bl0001-compact-signature.GRVRPr`
- **workspace provenance:** live working-tree snapshot excluding `.git`, `.orch`, `.codex`, and `node_modules`, committed as clean baseline `831cf3cf070ef261b0a20478e5175a7f442313a3`.
- **integration target:** `/Users/eluckey/Developer/research and games/2248-challenge`; no target-repository commit or publication authorized.
- **protected identities:** engine `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b`; exact-score `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`; ledger `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`; handoff `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.

## Iterations

### Iteration 1 — corrected workspace freeze

- Predecessor run `bl0001-compact-signature-code-2026-08-11` failed before execution because its workspace contract contradicted `orch-tdd`; no deliverable changed.
- Corrected spec `.orch/runs/bl0001-compact-signature-code-v2-2026-08-11/spec.md` permits per-slice commits only in the disposable clean snapshot and requires parent-controlled path-only integration.
- Next: decompose the corrected code spec.

## Blame classes

[]

## Failed approaches

- The predecessor live-checkout/no-commit spec is preserved in its own terminal worklog and will not be retried.

## Queued scope

- Full experiment execution and claim synthesis remain in the successor research step.
- Project-record admission remains in the successor content step.

## Terminal

[]
