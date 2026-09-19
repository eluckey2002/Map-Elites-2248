---
result: RESULT-0048
status: registered
registered: 2026-09-19T09:11:35Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0048/registered-protocol.md: a5738aed3bf7dd1e
  experiments/RESULT-0048/closeout-contract.json: 2e5a52bd651bf7d0
  experiments/RESULT-0048/subject.js: 4e3c527236b003b3
  experiments/RESULT-0048/run.js: 51429599101f0d09
  experiments/RESULT-0048/recompute.js: 2e7c9294a894ccf7
  experiments/RESULT-0048/verify.js: 9559de1817ebd3ff
  experiments/RESULT-0048/subject.test.js: 0dd664d860131640
  experiments/RESULT-0048/verify.test.js: 3ebaae73ea8bcd27
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — family-island persistence and refill search

**Registered:** 2026-09-19, before any confirmation seed was opened.

The immutable protocol is `registered-protocol.md` at full SHA-256
`a5738aed3bf7dd1e5e604e3274200aca397b4b4d73828e23beb59c0c7c1765c7`.
The executable closeout contract is `closeout-contract.json` at full SHA-256
`2e5a52bd651bf7d0b2b9a6b0a34f46bb9960ff4d44caada48f92418e364002f4`.
The frozen harness subject identity is
`33453c6b5024f0488d9d837b3e87d731140b5a9717fddd2fcfada2dfc98c7a24`.

## Question

Can high-ratio family openings be separated into enough real islands that the
target family remains playable after two consolidation moves with blue-only
refills, or does sustained family play require mixed-family refills?

## Shape and denominator

This is a custom `paired-bounded-board-search` with the `simulation-policy`
context and `mutation-qualification` assurance profiles. It evaluates 4,096
fresh 5×8 openings across families 3/5/7/9 and five row/column island
templates. Every opening runs through blue-only, 25%, 50%, and 75%
target-family refill arms: 16,384 deterministic games, at most 16 legal moves
each. Seeds are 44,000,000–44,004,095; qualification seed 43,999,999 is
excluded.

The complete definitions, controls, thresholds, failure meanings, subject
selection, search bounds, permitted output, and adoption boundary are frozen
in `registered-protocol.md` and projected into `closeout-contract.json`.

## Checks

### C1 — clean production-seam baseline

Deterministic replay and all declared island counts must pass before outcomes.

### C2 — positive refill manipulation

The exact refill seam must produce only blue at rate 0 and only target family
at rate 1 on the frozen fixture.

### C3 — known-kill family-classification mutation

A planted classifier that treats 54/60 as recognized family values must fail.

### C4 — known-kill pairing and artifact mutations

Missing-arm and changed-outcome mutations must fail through the public
verifier.

### C5 — objective equivalence

Paired arms must differ only in refill family rate before path divergence.

### C6 — restoration and suite

Frozen identities must be restored, focused controls must pass, and no new
solver-suite failure may appear.

### P1 — islands alone sustain family play

`SUPPORTED` only when every target family has at least 10 blue-only
move-six-sustained boards and at least 5 conversion-rejoin boards; otherwise
`FALSIFIED` within this bounded panel.

### P2 — mixed spawning supplies candidates when islands do not

`SUPPORTED` only when P1 fails and at least one mixed arm has at least 20
move-six-sustained boards in every family; `FALSIFIED` when P1 passes;
otherwise `INCONCLUSIVE`.

### P3 — scoped disposition

Exactly one of `ISLANDS_SUFFICIENT`, `MIXED_SPAWN_NEEDED`, or `INCONCLUSIVE`
is selected by the frozen P1/P2 rule. This is candidate routing, not adoption.

## Stops

One run, no overwrite, replacement seeds, changed policy, new topology,
threshold adjustment, or rerun. Missing matrix cells or identity mismatch
invalidate the run. Bounded absence never establishes impossibility.
