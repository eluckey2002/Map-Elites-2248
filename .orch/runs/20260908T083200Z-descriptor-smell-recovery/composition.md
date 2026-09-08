---
name: descriptor-validation-smell-recovery
description: Remove the observed experiment traps, then complete one bounded synthetic descriptor validation.
entry: named
---

# Descriptor validation with smell recovery

## Steps

1. `recover`
   - unit: `orch-deliver`
   - pack: `orch-code-pack`
   - spec: `.orch/runs/20260908T083200Z-descriptor-smell-recovery/spec.md`
2. `validate`
   - unit: `orch-deliver`
   - pack: `orch-research-pack`
   - spec: `.orch/runs/20260908T083200Z-descriptor-smell-recovery-result-0030/spec.md`
   - binding: write this successor spec only after `recover` returns its fixed
     code revision; it points to the committed RESULT-0030 protocol rather than
     duplicating the scientific design.

## Edges

- `seq`: `recover.result` becomes `validate.evidence` and supplies every
  executable identity frozen by RESULT-0030.

## Invariants

- `recover` executes no synthetic outcome game and changes no protected
  production or evidence surface.
- `validate` starts only after one complete RESULT-0030 protocol, calculator,
  tests, and seed reservation are committed and the real draft check passes.
- The protocol is the sole authority for the question, level-selection basis,
  denominator, analysis, thresholds, and stopping rules.
- Controls run once. Confirmation runs once only if the manipulation check
  passes. No alternate seeds, retry, model, threshold, or post-outcome repair.
- Leave-one-policy-out results remain diagnostic unless the blind protocol
  explicitly makes them load-bearing before data.
- No result validates the existing human anecdote, formalizes a MAP-Elites
  axis, changes a level or policy, edits the ledger, merges, rebases, pushes,
  or writes to the canonical checkout.

## Done check

PASS only when the fixed code revision rejects the exact malformed-hash draft,
accepts the exact draft, and reproduces both holdout diagnostics; the committed
RESULT-0030 protocol predates all games; the single control artifact passes its
manipulation and integrity checks; confirmation is either correctly withheld or
executed exactly once; every declared check receives an honest outcome; the
same four repository-wide failure identities remain and no new failure appears;
and protected paths are byte-identical to `9d125e8`.

## Require

- User direction to complete descriptor work and remove the process smells that
  made prior attempts churn.
- Code baseline `154c44a76188b884afcdb7e4b4e644950c59d57a` in the isolated worktree.
- RESULT-0029's no-game BREACH and RESULT-0030's corrected harness as historical
  evidence, never empirical descriptor evidence.

## Return

Status, code result identity, registered protocol identity, artifact and
analysis identities, predeclared verdicts, exact test standing, protected-path
verdict, remaining scientific gaps, and isolated branch location.
