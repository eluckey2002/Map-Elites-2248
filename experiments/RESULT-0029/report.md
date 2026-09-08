# RESULT-0029 — invalid registration, no games executed

## Summary

**BREACH.** RESULT-0029 produced no control or confirmation evidence. The first
control invocation stopped inside `solver/experiment-guard.js` before compute
because the registered `solver/experiment-guard.js` prefix had 17 hexadecimal
characters instead of the required first 16. No evidence directory or artifact
was created.

The frozen protocol remains unchanged apart from its permitted lifecycle status
transition to `complete`. Its 32M and 33M ranges remain burned. Any retry must
use a new result id, protocol, source closure, and fresh seeds.

## C1 — deterministic repeated controls — BREACH

No first control artifact exists, so no repeat comparison was possible. The
invocation exited 1 before game execution.

## C2 — factorial manipulation — FAIL

No control cells exist and no conditional slice was measured. Confirmation was
not opened.

## C3 — registration, source, and matrix closure — FAIL

Registration commit `b735afe5afd25effa3f12dfc9c948603eeb051ed`
froze `solver/experiment-guard.js` as `200ad71fad9492a3f`; the actual required
first-16 identity was `200ad71fad9492a3`. The production guard rejected the
registration before compute. There is no artifact or matrix to verify.

## P1 — joint out-of-level prediction — INCONCLUSIVE

No reportable outcomes exist. RESULT-0029 says nothing about joint prediction.

## P2 — usable outcome and descriptor support — INCONCLUSIVE

No outcomes or descriptors were generated.

## P3 — fixed diagnostics — PASS

- attempted command kind: `controls`
- intended denominator: 324 cells
- exit: 1, before compute
- artifact: absent
- game executions: 0
- guard observation: version-freeze mismatch on
  `solver/experiment-guard.js`
- controls B: not invoked
- confirmation: not invoked

## Evidence boundary

This is a registration failure only. It is not `FALSIFIED` evidence about the
descriptors, and it does not change any human-game interpretation, production
axis, policy, level, ledger record, or champion.
