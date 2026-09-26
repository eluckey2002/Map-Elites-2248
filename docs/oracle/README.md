# Captured-corpus oracle

A bounded, seed-aware search for fewer moves to the existing target. It does
not change the live bot, game rules, level targets, or frozen `calib-1` evaluator.

The [verified corpus result](RESULT.md) contains the comparison and proof:
20 wins, 17 faster than the best recorded human win, 2 ties, and one loss-only
puzzle won. This is a result on the frozen corpus, not a future-board guarantee.

## Run and inspect

From the repository root, using Node (qualified on v26.0.0):

```bash
node solver/oracle/cli.js --out /tmp/oracle-new-run.json --budget-ms 30000
node solver/oracle/cli.js --verify /tmp/oracle-new-run.json
node solver/oracle/cli.js --show /tmp/oracle-new-run.json --puzzle 8de7adce
node --test solver/tests/oracle.test.js
```

Choose a new output filename for each run; existing reports are never overwritten.
The first command prints human, current-bot and oracle move counts, moves saved
relative to the best human win, search time, and pass/fail. JSON also retains the
termination reason, work counts, source identities, and every chain and resulting
board. `--show` displays chain order on spatial boards, after verifying the report.

For one diagnostic puzzle, add `--puzzle <identity-prefix>` to the run command.
A partial report cannot satisfy the full-corpus goal, even if that puzzle passes.
Exit codes: 0 = complete passing corpus; 1 = valid performance failure or partial
diagnostic; 2 = invalid report, input, or execution error. `--show` exits 0 when
it successfully displays a verified report row.

## What is frozen

`corpus.json` includes 25 recordings grouped into 20 exact puzzles. Repeated
attempts share a row only when the gameplay rules, target, move budget, board,
seed and future random stream match. Candidate metadata and original file hashes
remain attached. Nineteen puzzles have a human win; the loss-only puzzle still
requires an oracle win, but has no human winning move count.

The manifest's expected identity is pinned outside reports in `corpus.js`.
Loading recomputes it from `recordings/`, `play-sessions/`, and every
`pilots/*/recordings/` directory. New or changed captures therefore fail this
frozen benchmark instead of silently changing its population. A future corpus
needs a new explicit freeze; do not edit this manifest to make a run pass.

## Search contract

The worker receives only level rules, seed and budget. It has no human chains,
intermediate boards, best-move count, or result labels. These historical boards
were inspected during development; this is not a blind or held-out evaluation.

Search first reproduces the current bot, retaining its winning solution. It then
tries increasing beam widths with multiple path generators, legal setup prefixes,
and different survivor locations. It uses the actual future seeded refills and
full scoring, gravity, tile scaling, blocker ticking and terminal precedence.
Its ordering estimates are heuristics, not proof bounds.

Thirty seconds covers baseline generation plus search. A parent process enforces
the deadline; an internal reserve allows result transfer. Timeout retains the
latest winning witness. An absent witness means `UNKNOWN`, never impossible.
The search can finish its bounded portfolio early; unused time is not proof that
no better solution exists. Wall-clock cutoffs can change outcomes under load.

Loading, independent replay, baseline-policy validation, and controller elapsed
time are recorded separately. Verification may take additional time. The verifier
checks every chain and post-move board through the existing engine, separately
from the search transition, and rejects play after the first terminal move.

## Evidence boundary

These are **best-known replayed solutions**, not minimum-move proofs. Matching
the best recorded human win meets this milestone; it does not promise to beat
the owner's next attempt, prove future-board superiority, or measure difficulty.
Oracle witnesses can give an author a concrete achievable pace, not certify that
a level will challenge a person.

`CONTRACT.md` states acceptance; `QUALIFICATION.md` records positive and planted
negative controls. `runs/` preserves failed and partial attempts as well as later
results. Reports bind exact implementation hashes. Verify older reports from the
source version that produced them; the current verifier intentionally refuses
source drift. Attempts 1–3 belong to commit `de5386c`; attempt 4 is a retained
partial development diagnostic, not a final qualified full-corpus result.
