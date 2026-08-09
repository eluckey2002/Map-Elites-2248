# 2248 Challenge — Handoff

**Stopped:** 2026-08-08 at owner request. No solver run, agent lane, or score
search remains active.

## Synopsis

This checkout now has a fresh local Git history on `main`. The current HEAD
contains the verified remnant-placement prototype and a separate level-authoring
design commit that was already present at handoff time.

The solver can now recognize when a merge survivor, after the real
merge → gravity → spawn sequence, can begin a future legal chain. That is a
real tactical signal, but it did **not** raise Level 26's measured win rate.

The session also produced terminal-board views and a 500-seed score sample of
the **current heuristic bot**. Those are useful diagnostics, but they do not
measure the game's policy-independent possible score range.

## Verified state

- Game scoring is implemented as: `chain sum × chain-length multiplier`.
  The final selected tile becomes the chain sum. Multipliers are 1.5x for
  3–4 tiles, 2x for 5–6, 3x for 7–8, and 5x for 9+.
  Source: `src/game.js:350-400`.
- Level 26 is a 5×8, minimum-four-tile level with **32 moves** and a
  13,000-point target. It is not a 13-move level.
  Source: `src/game.js:63-65`.
- Remnant-placement POC: `solver/bot.js` now simulates each ordinary candidate
  through gravity/spawn and scores a legal future chain anchored on the exact
  surviving tile. Urgent reachable bombs still take precedence.
  Source and evidence: `.orch/runs/remnant-placement-poc-2026-08-08/worklog.md`.
- Independent checker and final fresh run passed all 56 solver tests.
  `node solver/verify-loop.js` still exits 1 solely because Level 26's
  historical win-rate guard remains 0%, while Level 1, Level 11, and bomb
  safety guards pass.

## Important correction

Do **not** state that the 13,000 target is impossible yet.

The prior 500-seed result (median 7,842, best observed 11,370) measured the
current greedy/lookahead policy. It does **not** bound a stronger player or an
optimal policy. Likewise, three terminal boards that ran out of moves are
illustrations of the current agent's failure mode, not a proof about the game.

The remaining unresolved wording is whether the desired analysis concerns a
literal **13-move horizon** or Level 26's **13,000-point target over 32
moves**. These require different calculations.

## Correct next study

Build a policy-independent score-envelope study before changing targets or
doing more bot tuning.

1. Freeze the scenario: exact level, move horizon, initial board, and spawn
   sequence(s), or explicitly define the random scope (lucky possible, typical,
   or guaranteed).
2. Implement an optimal/branch-and-bound planner over legal chains, distinct
   from `solver/bot.js`'s heuristic policy.
3. Pair it with an admissible mathematical upper bound. Label every output as
   **exact optimum**, **proven upper bound**, or **heuristic lower bound**.
4. Validate the planner's scoring and transitions against `src/game.js` and
   test it on small fixtures where exhaustive enumeration is feasible.
5. Only then compare the policy-independent envelope with the level target.

Do not resume generic bot-weight tuning or player-UI work until that study has
separated level viability from agent quality.

## Useful commands

```bash
node --test solver/tests/*.test.js
node solver/verify-loop.js
```

The second command is expected to exit 1 at this handoff because its frozen
Level 26 target check is still red; that is not a solver-test failure.

## Repository state

- `main` HEAD at handoff: `44c04ff Add design spec for the level-authoring loop`.
- Relevant commits:
  - `d63fb29 Initial local snapshot`
  - `98e324e Add remnant placement signal`
  - `44c04ff Add design spec for the level-authoring loop` (present but not
    reviewed as part of this handoff).
- The repository has no configured remote and no recoverable pre-bootstrap
  history.
- `.codex/` is intentionally untracked. It contains the session's terminal
  board-gallery visualization and was not made part of the project history.
