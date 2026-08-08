---
id: placement-signal
run: remnant-placement-poc-2026-08-08
status: ready
executor: orch-tdd
profile: orch-worker
depends_on: []
write_scope:
  - solver/bot.js
  - solver/tests/bot.test.js
bound: 30 tool calls
claimed_by:
claimed_at:
---

## Objective

Add a tested solver signal that values a merge candidate when its surviving
sum tile, after the game's gravity and spawn sequence, can begin a legal
future chain; use that signal when ranking the existing non-bomb candidates.

## Fixed inputs

- Baseline commit: `d63fb29c9bde844c7b196253f5bce29c46cf611d`.
- Rule source: `src/game.js:367-423` — a chain sum replaces its final selected
  tile, then gravity and spawning occur.
- Solver mirrors: `solver/engine.js:90-111` and `solver/sweep.js:24-39`.
- Current bot ranking and rollout: `solver/bot.js:53-103`.
- Prior findings: `.orch/runs/lockout-fix-2026-08-08/worklog.md:31-60` and
  `:119-130`. Do not retry rejected generic heuristic variants listed there.
- Scope boundary: do not change player-facing files, level data, the game
  rules, or the bomb-first policy. This is a placement-signal prototype, not
  exhaustive endpoint search.

## Completion test

1. A new deterministic unit test constructs a board where the selected
   survivor moves under gravity and verifies the placement signal evaluates
   that post-gravity survivor, rather than its pre-move coordinate. Oracle:
   `node --test solver/tests/bot.test.js` exit code. oracle_class:
   deterministic. provenance: authored-here.
2. A deterministic unit test verifies that a candidate whose survivor can
   begin a valid future chain receives a strictly higher placement evaluation
   than an otherwise comparable candidate whose survivor cannot. Oracle:
   `node --test solver/tests/bot.test.js` exit code. oracle_class:
   deterministic. provenance: authored-here.
3. `chooseMove` incorporates the signal only for ordinary candidates; the
   urgent-reachable bomb choice remains unchanged. Oracle: existing and new
   bot tests via `node --test solver/tests/*.test.js`. oracle_class:
   deterministic. provenance: pre-existing for bomb behavior; authored-here
   for the placement case.
4. The full deterministic solver test suite passes. Oracle:
   `node --test solver/tests/*.test.js` exit code. oracle_class:
   deterministic. provenance: pre-existing.
5. `node solver/verify-loop.js` is run and its exact stdout and exit code are
   recorded, whether it passes or fails. Oracle: script output and exit code.
   oracle_class: deterministic. provenance: pre-existing.

## Return fields

- `changed_artifacts`
- implementation summary
- test names and outputs
- `verify-loop` stdout and exit code
- measured limitations

## Result

Pending.

## Verification

Pending.

## Feedback

[]

## Risks

- The existing greedy candidate generator may not expose enough endpoint
  alternatives for this signal to move aggregate results.
- The POC may produce an honest no-improvement result; do not tune weights
  beyond the stated bound to force a win-rate claim.
