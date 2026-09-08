---
run: 20260908T083200Z-descriptor-smell-recovery-result-0030
question: >-
  What verdict does the preregistered RESULT-0030 experiment support, and what scientific gaps remain after its one permitted control and conditional confirmation?
source_policy: >-
  Use only experiments/RESULT-0030/protocol.md at its registration commit, artifacts produced by its frozen runner, outputs from its frozen verifier and calculator, Git identities, and repository test output. Human sessions and RESULT-0029 may explain provenance but cannot supply RESULT-0030 outcomes.
rigor_bar: >-
  Every reported observation resolves to a frozen artifact or reproducible analysis identity; every protocol check receives its exact predeclared classification; no rerun, substitution, post-outcome threshold change, or inference beyond the protocol's evidence boundary is permitted. Unknown or stopped outcomes remain explicit.
routing:
  pack: orch-research-pack
bound:
  tickets: 1
  tool_calls: 45
  correction_passes: 1
  plan_gate: false
target_repository: /private/tmp/2248-synthetic-descriptor-validation-20260906@fddbf05
standards_owner:
  - AGENTS.md
  - experiments/README.md
  - experiments/RESULT-0030/protocol.md@fddbf05
---

# RESULT-0030 registered descriptor validation

## Objective

Execute and report the single registered study in
`experiments/RESULT-0030/protocol.md@fddbf05`. That protocol is the sole
scientific authority; this record owns routing and acceptance only.

## Non-goals

- Do not restate or amend the protocol's scientific design.
- Do not validate the motivating human anecdote, formalize a descriptor, edit
  the ledger or CURRENT, alter a level or policy, or choose MAP-Elites axes.
- Do not merge, rebase, push, or write the canonical checkout.

## Acceptance

- `R30-REGISTER-01` — the registration commit strictly predates every outcome
  artifact and the pre-registration draft check is recorded as PASS.
- `R30-CONTROL-02` — the one permitted control artifact is produced once,
  verified, analyzed, and every control check in the protocol is answered. A
  stopping outcome withholds confirmation and is reported without repair.
- `R30-CONFIRM-03` — if and only if the protocol opens confirmation, its one
  permitted artifact is produced once and the report answers every primary,
  support, and diagnostic check without promoting diagnostics.
- `R30-REPRO-04` — every reportable artifact passes its frozen verifier and the
  confirmation calculation, when reached, reproduces byte-identically at a
  second new path.
- `R30-CLOSE-05` — the report preserves the protocol's evidence boundary, the
  protocol lifecycle closes only by `registered` to `complete`, the focused
  and repository gates add no new failure identity, and protected paths remain
  byte-identical to `9d125e8`.

## Evidence at cut

- Accepted code result `6c61d96`; recovery integration `230e620`.
- Protocol and seed registration `fddbf05`, created after `DRAFT OK
  RESULT-0030 8 frozen files` and before any RESULT-0030 game.
- RESULT-0030 directory contained only `run.js`, `verify.js`, `analyze.js`, and
  the draft protocol immediately before registration.

## Affected surfaces

- `experiments/RESULT-0030/evidence/`
- `experiments/RESULT-0030/report.md`
- `experiments/RESULT-0030/protocol.md` lifecycle field only
- `.orch/runs/20260908T083200Z-descriptor-smell-recovery-result-0030/`

## Risks

- The purposive level panel limits generalization even with a complete run.
- Policy-held-out estimates may be unstable at factorial corners and remain
  diagnostic under the registered protocol.
- An interrupted single permitted run cannot be retried on alternate seeds.
