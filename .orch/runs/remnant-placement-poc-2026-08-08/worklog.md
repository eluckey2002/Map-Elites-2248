# Remnant-placement POC worklog

- Run: `remnant-placement-poc-2026-08-08`
- Objective: test whether the solver can recognize and value a chain survivor's
  post-gravity potential for a later legal chain.
- Scope boundary: solver behavior and deterministic tests only. Player UI
  preview and unlock mechanics are explicitly deferred.
- Baseline: `d63fb29c9bde844c7b196253f5bce29c46cf611d` (`Initial local snapshot`).

## Result

- Accepted prototype: `solver/bot.js` now scores an ordinary merge candidate
  by whether its exact surviving tile, after execute, gravity, and spawn, can
  begin a legal future chain. The urgent reachable-bomb branch remains first.
- Independent checker confirmed the new tests reject both a removed placement
  signal and an erroneous pre-gravity lookup.
- Final deterministic suite: 56 passing, 0 failing. The frozen historical
  verify loop was also rerun: Level 1, Level 11, and bomb safety passed; Level
  26 remained at 0% against its 30% historical target. This POC is complete
  because it implemented and verified the placement signal; it does not claim
  to have solved the level-design ceiling.

## Next boundary

This signal ranks only endpoint variants already produced by the greedy
candidate generator. A future experiment would need to generate or search
new chain orders/endpoints before it can test the full spatial-planning
strategy.
