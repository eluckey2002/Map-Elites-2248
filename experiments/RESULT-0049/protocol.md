---
result: RESULT-0049
status: complete
registered: 2026-09-27T14:33:46Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0049/registered-protocol.md: 4dc2419b7e586fdc
  experiments/RESULT-0049/closeout-contract.json: c2fc316ae65bb1b1
  experiments/RESULT-0049/subject.js: 281aefc90dea0a1e
  experiments/RESULT-0049/worker.js: 6f411f80a999bb05
  experiments/RESULT-0049/run.js: 38a95addc0604771
  experiments/RESULT-0049/recompute.js: b132275352f2efdb
  experiments/RESULT-0049/subject.test.js: f3add10f4f9df280
  experiments/RESULT-0049/run.test.js: 07d186608de8c7d9
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/persist-before-verdict.js: 02df81dbcf6264f4
  tools/verify-experiments.js: 81cd755042ace88c
---

# Pre-registration — current target-aware champion confirmation

**Registered:** 2026-09-27, before any reportable seed is opened.

The complete immutable protocol is `registered-protocol.md`, SHA-256
`4dc2419b7e586fdc490719e44317257a393cc98311ffb2eb6965a5f5594a3681`.
The executable closeout contract is `closeout-contract.json`, SHA-256
`c2fc316ae65bb1b120f2c53f17de167c99568aecd669b0796a71c5cc9e17642f`.
The final subject identity is
`41d758a294aa491fd0a257209fc502dcc47a0c77730daf7d81251fa52ba84144`.

## Question

Does the current production `chooseMove` target-aware champion safely match or
improve on its preserved `chooseBaseMove` across all 58 shipped levels under a
fresh, paired 300-seed panel?

## Design and denominator

This is an `ab-comparison` with `simulation-policy` context and
`mutation-qualification` assurance. It contains 58 levels × 300 fresh seeds =
17,400 paired cells and 34,800 games. Seeds are
`45,000,000–45,000,299`; qualification uses only excluded seed `44,999,999`,
already-burned fixtures, and synthetic cells.

Both arms use identical levels, seeds, target-stop semantics, transitions,
spawn streams, and lookahead stream construction. Reliability is primary;
moves-to-target is compared among mutual wins. Crossing score is diagnostic.
Every raw pair is written once before the verdict is evaluated.

## Checks

### C1 — reference and deterministic replay

An A/A production-seam run must be identical and classify `INCONCLUSIVE`.

### C2 — target-aware positive control

The real public arms must expose a trace difference on the excluded Level 51
seed 1 fixture.

### C3 — assignment-integrity control

The validator must reject missing, duplicated, reordered, or mismatched pairs.

### C4 — objective-equivalence control

Both arms must share the exact objective, move budget, and terminal semantics.

### C5 — known-kill regression mutation

A planted one-move champion regression must be present and must produce
`DOES_NOT_SUPPORT_CURRENT_CHAMPION` for the intended reason.

### C6 — identity, persistence, restoration, and closeout

Coherent source substitution must fail, verdict failure must retain the raw
artifact, frozen hashes must be restored, and the exact synthetic closeout
route must pass before reportable execution.

### P1 — safety

`PASS` requires zero base-only wins and zero slower champion mutual wins.

### P2 — non-vacuous benefit

`PASS` requires at least one champion-only win or faster champion mutual win.

### P3 — registered outcome

P1 failure is `DOES_NOT_SUPPORT_CURRENT_CHAMPION`; P1 and P2 passing is
`SUPPORTS_CURRENT_CHAMPION`; P1 passing with P2 failing is `INCONCLUSIVE`.

## Run and adoption boundary

One reportable run, no retry, replacement seed, partial resume, threshold
change, or second reveal. Missing cells or identity drift make the run invalid.
Closure stops before any production decision: support does not newly promote
the champion, and non-support does not automatically roll it back.
