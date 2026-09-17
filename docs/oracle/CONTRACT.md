# Captured-corpus oracle

This implements the active owner goal: independently win every frozen recorded
puzzle in at most the owner's best verified winning move count, under a 30-second
search allowance per puzzle. A loss-only puzzle still requires an oracle win.
The allowance includes baseline generation; loading and replay are timed separately.
These are development cases. Success concerns these identities only, not future
boards, optimality, or human difficulty. No gameplay or calibration change is authorized.

## Harness qualification contract (before oracle performance runs)

The consuming decision is whether this implementation satisfies that exact corpus
goal. The real seam is the public report verifier reading the committed corpus,
raw recordings and submitted report, and replaying both human and oracle chains.
The corpus identity is pinned separately in `solver/oracle/corpus.js`; submitted
reports cannot select their own expected input identity. Input identities include
rules, geometry, target, moves, seed, initial board and future random stream.

Qualification PASS requires a legal real-artifact positive control, rejection of
illegal chains, false board/spawn/timer claims, continuation after a terminal,
missing/duplicate rows, forged human comparisons, and coherent replacement of
the corpus and report. A planted defect must fail for its intended reason.
FAIL means an executed required control is incorrectly accepted or rejected.
UNVERIFIED means a required control was not run or identity could not be bound.
Domain acceptance (all oracle puzzle comparisons pass) is evaluated separately;
a valid losing/slower search report must remain a domain failure, not a harness fault.

Use hand-solvable fixtures and the actual recorded corpus for qualification,
with at most three attempts per unchanged failing qualification step and a
two-minute ceiling for one focused test invocation. Preserve attempt outputs.
Mechanism changes require rerunning qualification under new source identities.
Record source identities, commands, actual outcomes and limitations before
accepting a performance artifact. No population-level experiment is claimed.

## Delivery sequence

1. Freeze and replay all recordings; group only identical puzzles and retain the best human win.
2. Add a full-rule seeded transition and bounded search, retaining current-bot wins.
3. Qualify the independent verifier, then inspect all recorded comparisons.
4. Improve failing cases within the same input and time contract; retain failed reports.
5. Re-run focused/full regression checks and audit every goal requirement before completion.
