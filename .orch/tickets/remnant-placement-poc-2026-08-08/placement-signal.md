---
id: placement-signal
run: remnant-placement-poc-2026-08-08
status: complete
executor: orch-tdd
profile: orch-worker
depends_on: []
write_scope:
  - solver/bot.js
  - solver/tests/bot.test.js
bound: 30 tool calls
claimed_by: /root/remnant_placement_poc_gpt_5_6_sol_high
claimed_at: 2026-08-08T17:50:49-05:00
checked_by: /root/remnant_placement_check_gpt_5_6_sol_high
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

- `changed_artifacts`:
  - `solver/bot.js` — SHA-256
    `5b6b4547498c4eaaa9ad591b18e01895e7e98bd60b1ee3f6c2d996d92bcfd37c`
  - `solver/tests/bot.test.js` — SHA-256
    `78faa8d3dae672905560a5bab25e509c4fb9bf7f6e69cb940401547064391ecc`
- Implementation summary: candidate simulation now retains the cloned surviving
  tile object through execute, gravity, and spawn. `remnantPlacementValue`
  scores the best legal `minChain`-length chain constrained to start at that
  post-gravity survivor. `chooseMove` adds that points-valued signal only while
  ranking ordinary lookahead candidates; the pre-existing urgent-bomb return
  remains ahead of candidate generation and is unchanged.
- Test names and outputs:
  - `remnantPlacementValue: evaluates the survivor after gravity moves it` —
    PASS; returned `8` for the moved merged `4`, distinguishing it from the new
    spawn at the survivor's old coordinate.
  - `remnantPlacementValue: rewards a survivor that can begin a future chain`
    — PASS; chainable placement `16`, stranded placement `0`.
  - `chooseMove: placement signal breaks an ordinary-candidate tie toward a
    chainable survivor` — PASS; chose the reverse endpoint whose merged `16`
    lands beside another `16` while immediate points, turnover, and ordinary
    rollout are equal.
  - TDD red run, `node --test solver/tests/bot.test.js` — exit `1`, 7 passed / 3
    failed for the expected missing signal and unchanged endpoint tie.
  - Green run, `node --test solver/tests/bot.test.js` — exit `0`, 10 passed / 0
    failed.
  - Full suite, `node --test solver/tests/*.test.js` — exit `0`, 56 passed / 0
    failed.
- Measured limitations: the fixed verification loop still reports level 26 win
  rate `0`, so this POC demonstrates a working placement-ranking signal but no
  aggregate target improvement. The signal evaluates only the already-generated
  greedy candidates and caps its anchored DFS at `minChain`; it does not search
  new endpoint orderings or value chains beyond the shortest legality proof.

Checker append (`/root/remnant_placement_check_gpt_5_6_sol_high`):

- Findings: no validated implementation or test defect. The simulation retains
  the cloned surviving tile by object identity while gravity updates its
  coordinates, and the new score term is reached only after the unchanged
  urgent-reachable bomb return.
- Authored-check discrimination: an in-memory no-placement-signal variant made
  the ordinary-candidate integration test fail (`9` passed / `1` failed), and an
  in-memory pre-gravity-coordinate variant made the moved-survivor test fail
  with `4 !== 8` (`8` passed / `2` failed). Neither negative control modified
  the tree.
- Independent executions: `node --test solver/tests/bot.test.js` exited `0`
  (`10` passed); `node --test solver/tests/*.test.js` exited `0` (`56` passed);
  `node solver/verify-loop.js` reproduced the recorded stdout and exited `1`,
  including level 26 win rate `0` and bomb-exploded rate `1/550`.
- Changes: none to `solver/bot.js` or `solver/tests/bot.test.js`.
- Invalidated verification entries: `[]`.

## Verification

Fixed result identity: the two SHA-256 artifact identities recorded in
`## Result`.

1. **PASS (deterministic)** — `node --test solver/tests/bot.test.js` exit `0`;
   moved-survivor test passed with exact placement value `8`.
2. **PASS (deterministic)** — same command exit `0`; comparable placements
   evaluated `16 > 0`.
3. **PASS (deterministic)** — same command exit `0`; the ordinary-candidate tie
   test and existing reachable/unreachable bomb-priority tests all passed.
4. **PASS (deterministic)** — `node --test solver/tests/*.test.js` exit `0`;
   `56` tests passed, `0` failed.
5. **PASS (deterministic execution/recording)** — `node solver/verify-loop.js`
   was run; process exit code `1`. Exact stdout:

   ```text
   Lockout-fix verify:
     [PASS] level 1 win rate (no regression): 1 (must stay 100%)
     [PASS] level 11 win rate (no regression): 1 (baseline was 67%, floor at 60%)
     [FAIL] level 26 win rate (the actual target): 0 (baseline was ~0%, target >=30%)
     [PASS] bomb-exploded rate on levels 40-50 (no regression): 1/550 (baseline was ~0-1/300 (~0%), ceiling 2%)
   RESULT: FAIL
   ```

Overall completion-test verdict: **PASS (deterministic)**. The required
verification loop was executed and recorded exactly; its own aggregate gameplay
verdict remains **FAIL** because level 26 stayed at `0`.

## Feedback

- The natural points-valued placement signal was sufficient to break an
  otherwise exact ordinary-candidate ranking tie without introducing another
  fitted weight.
- The ticket names baseline `d63fb29c9bde844c7b196253f5bce29c46cf611d`,
  while the delegated workspace and live HEAD were
  `8f8adae6bb763bcb565ad910940885020c996f10`; all recorded verification ran on
  the latter, with the artifact hashes above fixing the result precisely.

## Risks

- The existing greedy candidate generator may not expose enough endpoint
  alternatives for this signal to move aggregate results.
- The POC may produce an honest no-improvement result; do not tune weights
  beyond the stated bound to force a win-rate claim.
- Measured no-improvement result: the fixed loop's level 26 win rate is `0`.
- The prototype cannot prefer endpoint orderings absent from the existing
  greedy candidate set.
