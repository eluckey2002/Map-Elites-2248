# Worklog — RESULT-0030 descriptor validation

## Goal (frozen)

Execute and report `experiments/RESULT-0030/protocol.md@fddbf05` without
restating or changing its scientific design. Acceptance is frozen in
`spec.md@593cdc7` as `R30-REGISTER-01` through `R30-CLOSE-05`.

- **spec:** `.orch/runs/20260908T083200Z-descriptor-smell-recovery-result-0030/spec.md@593cdc7`
- **protocol:** `experiments/RESULT-0030/protocol.md@fddbf05`
- **tickets:** `.orch/tickets/20260908T083200Z-descriptor-smell-recovery-result-0030/`

## Iterations

1. Opened after recovery result `6c61d96` was accepted and integrated. The
   public draft checker returned `DRAFT OK RESULT-0030 8 frozen files` before
   registration commit `fddbf05`; the RESULT-0030 directory contained no game
   or analysis artifact.
2. Decomposition cut one empirical lane, `R30-001`, because the registered
   protocol defines one sequential evidence chain: control decides whether
   confirmation opens, and all later findings depend on that result. Parallel
   lanes would either duplicate computation or violate the stopping rule.
3. The one control invocation produced artifact `5a4cf84e...f480`; its frozen
   verifier passed all 324 cells. Analysis `82256f24...9de` passed all six C2
   slices, opening confirmation.
4. The one permitted confirmation invocation exited 1 before artifact creation:
   `bounded candidate pool exhausted before an actual game terminal`. It was
   not retried. RESULT-0030 closed at report revision `af9d06d` with C1 FAIL,
   C2 PASS, P1/P2 INCONCLUSIVE, and P3 partial.
5. The fixed-result research lens found one unsupported durable timing claim:
   command wall time existed only in transient tool output. The single report
   correction removed the numeric values and recorded runtime as `UNRECORDED`.
   Experiment gate and focused tests pass; full suite remains 371/375 at the
   same four identities; protected paths match `9d125e8`.

## Blame classes

[]

## Failed approaches

- The registered confirmation could not complete because its bounded heuristic
  candidate enumerator returned empty on a state where the independent legal
  move predicate returned true. The frozen runner did not retain the failing
  cell, so replay was rejected under the protocol rather than used to diagnose
  the result after outcomes began.

## Queued scope

- Repair candidate-pool totality and failure receipts under a new code identity,
  then register any successor descriptor study with a new result id and fresh
  seeds. RESULT-0030 itself is closed and cannot be repaired or rerun.

## Terminal
