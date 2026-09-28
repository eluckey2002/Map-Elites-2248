---
result: RESULT-0057
status: complete
registered: 2026-09-28T14:17:48.886Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0057/registered-protocol.md: 32d89466b7ea0f53
  experiments/RESULT-0057/closeout-contract.json: dae081391227bb8c
  experiments/RESULT-0057/subject.js: f9ea153d572065cd
  experiments/RESULT-0057/worker.js: 6f411f80a999bb05
  experiments/RESULT-0057/run.js: 38a95addc0604771
  experiments/RESULT-0057/recompute.js: b132275352f2efdb
  experiments/RESULT-0057/subject.test.js: f0452b4ae3e2860d
  experiments/RESULT-0057/run.test.js: 7306ddf97adf4df9
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/route-diverse-challenger.js: 59c57bd274e8b00d
  solver/continuation-density-probe.js: d77648a25f6dca2a
  solver/continuation-density-challenger.js: a7e3247b72b3ef4f
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/persist-before-verdict.js: 02df81dbcf6264f4
  tools/verify-experiments.js: 27a2cd2b686753cd
  tools/vendor/close-experiment/verify_closure.py: 7ed2647d28bfe3df
---

# Pre-registration — equal-score continuation-density validation

**Registered:** 2026-09-28, before any reportable seed is opened.

The complete immutable protocol is `registered-protocol.md`, SHA-256
`32d89466b7ea0f5316ad4f12e2da2a741b688e630f46c8583fa63e602962a4db`.
The executable closeout contract is `closeout-contract.json`, SHA-256
`dae081391227bb8cdab04a6fcc7f7f4a2870fbe1bf75e22486578ddad649fb36`.
The final subject identity is
`5693094f23d5e2fbd3c10f13c195ea95184d3870ed4d2b676d3232bf3610a4b0`.

## Question

Does continuation density safely improve target cost when it is used only to
break exact immediate-score route ties, without exceeding twice the
champion's aggregate runtime?

## Design and denominator

This is a `candidate-measure` design with `simulation-policy` context and
`mutation-qualification` assurance. It contains all 58 shipped levels × 20
fresh seeds = 1,160 paired cells and 2,320 games. Seeds are
`46,000,000–46,000,019`; qualification uses excluded seed `45,999,999`,
already-inspected fixtures, and synthetic cells.

The control is the unchanged champion. The challenger may replace its route
only with a strictly denser route earning the exact same immediate points;
bomb-priority and immediate-target-win choices remain under full champion
control. Both arms share levels, targets, transitions, spawn and lookahead
streams, move budgets, and target-stop semantics. Raw complete pairs are
persisted before a verdict is evaluated.

## Sample size and margin

- **Per verdict:** 1,160 complete same-seed pairs spanning every current
  shipped level. This is a bounded decision panel, not a power-derived design.
- **Margin:** one champion-only win or one slower challenger mutual win flips
  safety to FAIL. Positive signal requires benefit on at least two levels;
  losing one of exactly two beneficial levels flips that check. A runtime
  ratio above 2.0 by any amount flips the compute check.
- **Downstream quantity:** support requires safety, positive mean target-cost
  reduction, benefit on at least two levels, and runtime ratio at most 2.0.

## Starting state, recorded independently

- git HEAD `0352434`, branch `codex/game51-learning-cycle-2026-09-27`.
- Focused qualification harness: 21/21 pass before registration.
- Broad solver suite: 603 tests, 587 pass, 15 fail, 1 skip. Failures were
  sandbox socket-binding tests (10), offline remote baseline checks (2), known
  stale Level 52/54 receipts (2), and generated-view drift while this work was
  uncommitted (1); no challenger behavior regression was observed.

## Checks

### C1 — controlled proxy manipulation

Fixed values and count: line density `1`, compact-cluster density `6`.

### C2 — scale negative control

Uniform 64× value scaling leaves compact density exactly `6`.

### C3 — orthogonal isolated-mass control

Adding one unrelated isolated tile leaves compact density exactly `6`.

### C4 — reference and treatment exposure

Real-seam A/A is identical and `INCONCLUSIVE`; the excluded motivating
decision exposes a strictly denser equal-score alternative.

### C5 — assignment and objective integrity

Missing, reordered, duplicated, or mismatched pairs are rejected, and both
arms have identical move budgets and termination semantics.

### C6 — known-kill regression mutation

A planted one-move challenger regression must classify `FALSIFIED`.

### C7 — breadth and compute boundary controls

Safe two-level benefit at 1.5× is `SUPPORTED`; one-level benefit or 2.001× is
`INCONCLUSIVE`.

### C8 — identity, persistence, restoration, and closeout

Coherent substitution fails, verdict failure preserves raw evidence, frozen
hashes restore exactly, and the exact synthetic closeout route passes.

### P1 — safety

PASS requires zero champion-only wins and zero slower challenger mutual wins.

### P2 — non-vacuous signal

PASS requires positive mean target-cost reduction and benefit on at least two
distinct levels.

### P3 — bounded compute

PASS requires aggregate challenger/champion runtime ratio at most 2.0.

### P4 — registered outcome

P1 failure is `FALSIFIED`; P1–P3 all passing is `SUPPORTED`; otherwise the
result is `INCONCLUSIVE`.

## Budget and stopping rules

1. C1–C8 pass before reportable measurement.
2. Pre-outcome admission passes against the committed identities and exact
   synthetic closeout route.
3. One reportable run, no retry, replacement seed, partial resume, threshold
   edit, or second reveal.
4. Missing cells, identity drift, registration failure, or objective mismatch
   makes closure `INVALID` or `UNVERIFIED`, not a domain result.

## Instrument bound

Cellwise safety, mean target cost, beneficial-level breadth, and aggregate
runtime ratio are decision-bearing exactly as registered. Score overshoot,
trace-change count, individual route narratives, and the uncertainty interval
are diagnostic and cannot be promoted into acceptance criteria after seeing
the outcome.

## Adoption is a separate decision

`SUPPORTED` means only that this bounded rule earned consideration in a later
promotion experiment. This run cannot modify or replace the champion, levels,
targets, receipts, recordings, or authoring system.
