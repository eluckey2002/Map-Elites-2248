---
name: synthetic-descriptor-validation
description: Build a challenged two-control harness, then run one preregistered out-of-sample descriptor test.
entry: named
---

# Synthetic descriptor validation

## Steps

1. `harness`
   - unit: `orch-deliver`
   - pack: `orch-code-pack`
   - spec: `.orch/runs/2026-09-07T01-48-15Z-synthetic-descriptor-validation-harness/spec.md`
   - binding: Return a committed code revision whose real CLI, verifier,
     crafted bad artifact, focused tests, check card, protected-source check,
     and exact baseline comparison pass without executing synthetic outcome
     games.
2. `validation`
   - unit: `orch-deliver`
   - pack: `orch-research-pack`
   - spec: deferred; draft and stamp it only after `harness` returns its exact
     committed result identity.
   - binding: Freeze the predecessor revision into a complete RESULT-0029
     protocol, commit it before controls, run each allowed dataset once, and
     synthesize the predeclared verdict without changing executable behavior.

## Edges

- `seq`: `harness` result identity and verification become
  `validation.evidence`.

## Invariants

- `harness` does not execute controls, pilot, confirmation, or any new
  shipped-level synthetic outcome corpus.
- `validation` does not start until its complete protocol and seed reservation
  are committed against the harness result identity.
- Both steps call the approximation `beamGreedRatio`; neither converts it into
  the exhaustive human `greed ratio` or treats a positive proxy result as
  retroactive validation of the 15 human games.
- Both steps use half-score move divided by the full move budget.
- Both steps preserve `src/game.js`, `solver/engine.js`,
  `solver/level-author.js`, `solver/bot.js`, existing receipts, accepted
  protocols, game rules, levels, targets, scoring, and champion identity.
- No step formalizes an axis, edits the ledger, promotes a policy, merges,
  rebases, or writes to the canonical root checkout.
- Every new verifier crosses the gate-check garbage test against serialized
  bad input and carries an explicit `Does NOT catch` card.

## Done check

PASS only when a fresh invocation at the terminal revision: validates the
committed RESULT-0029 artifact and registration ancestry; reproduces exact 3x3
subject and level-by-seed coverage; proves greed-center and timing-slope
controls did not collapse; reproduces the frozen out-of-sample prediction
verdict and every guard outcome; rejects a one-field tampered artifact through
the same verifier; reports the four baseline failures unchanged by identity;
and confirms every protected source is byte-identical to `9d125e8`. A positive
verdict remains evidence about the beam-relative proxy only. Any failed
precondition, partial denominator, identity drift, or resource breach returns
FAIL, INCONCLUSIVE, or UNVERIFIED with partial evidence retained.

## Require

- User confirmation to continue from the selected handoff.
- Baseline revision `9d125e8c94f41282388a90402b1fba0b22ae83a8`.
- Investigation packet identity
  `ed993bf19514b9cd904184bbd4aaab40b9ca1197dd137aac8e9b2300edb6c962`.
- The corrected half-score denominator and the exhaustive-versus-beam
  contradiction carried by that packet.

## Return

Status, terminal result identity, per-step result identities and verification,
RESULT-0029 protocol and artifact identities, predeclared verdict, protected
source verdict, unchanged baseline-failure identities, gaps, and the isolated
branch/worktree location. No merge or promotion recommendation follows merely
from completion.
