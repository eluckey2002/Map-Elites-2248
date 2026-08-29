# Bounded measurement-baseline stabilization composition

- **name:** `bounded-measurement-baseline-stabilization`
- **description:** Make candidate target measurement use the frozen calibration, retire only the unshipped stale Level 54 candidate, then reconcile the evidence ledger and generated project navigation.
- **entry:** `routed`

## Steps

1. **id:** `stabilize-code-baseline`
   - **unit:** `orch-deliver`
   - **pack:** `orch-code-pack`
   - **spec:** `.orch/runs/2026-08-29-bounded-measurement-baseline-stabilization/code-spec.md`
   - **binding:** Return a committed revision proving frozen-calibration use and the exact intended live-corpus transition.
2. **id:** `reconcile-evidence-navigation`
   - **unit:** `orch-deliver`
   - **pack:** `orch-content-pack`
   - **spec:** Draft and stamp `.orch/runs/2026-08-29-bounded-measurement-baseline-stabilization/content-spec.md` only after `stabilize-code-baseline` returns its fixed revision identity.
   - **binding:** Use that predecessor revision as evidence; append ledger adjudications, update current navigation, and regenerate the Universe Map without changing any game or experiment result.

## Edges

- **seq:** `stabilize-code-baseline` -> `reconcile-evidence-navigation`; the committed code revision, archived candidate identity, and exact post-change gate result become fixed inputs to the content delivery.

## Invariants

Only the owner's four approved stabilization items may change. Preserve the deliberate historical receipt failures for shipped Levels 52 and 53. Do not re-author either shipped level, weaken an assertion, generate a new candidate, run a new MAP-Elites experiment, change rules or scoring, promote a policy, or clean unrelated repository state. Preserve every prior ledger claim append-only and preserve the shared-axis MAP artifact at its pinned revision and exact hashes.

## Done check

PASS only when the authoring measurement supplies all `calib-1` parameters explicitly; a permanent regression test proves mutations to the live bot defaults do not enter that measurement seam; the unshipped `0a3b9adf...` Level 54 candidate and receipt are preserved in the archive and removed from the live manifest; the receipt suite reports exactly the two deliberate shipped failures and no others; the ledger records Level 53 and the fixed shared-axis MAP artifact without proof-class promotion; `CURRENT.md` and the generated Universe Map agree with the ledger; and all unaffected deterministic checks pass. Otherwise return FAIL or UNVERIFIED with partial evidence retained.

Require: owner approval limited to the four named items, baseline revision `90166907437c7b686f868be0e049325d97fb00f6`, the completed investigation ticket, and the repository evidence rules.

Return: result envelope containing status, code and content revision identities, changed paths, verification verdicts, preserved historical failures, archived identities, ledger record IDs, remaining proof gaps, and feedback.
