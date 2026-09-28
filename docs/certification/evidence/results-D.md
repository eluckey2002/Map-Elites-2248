# Slice D results — Level 53 and Levels 55-58 (PARTIAL custody)

> **Snapshot note:** written against `origin/main` at `e3b89c0` (see the pinned snapshot below), before PR #53 merged `DECISION-0007` and `DECISION-0009` into the ledger. Statements here that those records are absent from `main` were true then and are not true now; see `../levels-2026-09-28.md` for the current state.


Snapshot: `origin/main` at `e3b89c0d277946254d230d26fcd99fa0689d7ef2` (fetched and confirmed this session).

| Subject | Check | Verdict | Note |
|---|---|---|---|
| Level 53 | CK-13 | FAIL | No ledger record on main (commit 530deb3 is a MAP-Elites-evidence commit, not authoring). Known answer confirmed. |
| Level 53 | CK-12 | FAIL | RESULT-0027 reproduces fitted median 107,904 -> target 102,000; shipped target is 101,000. 1,000-point gap, no accepted bridge. |
| Level 53 | CK-02 | N/A | No receipt exists for the shipped level; inherited gen-0014 receipt already called "stale and non-quotable" by RESULT-0027, not independently re-hashed this session. |
| Level 56 | CK-12 | PASS | Full recompute this session via `solver/level-author.js`'s `deriveCandidate` (uses frozen calib-1, FIT_SEEDS 0-149): measuredMedian 120832, target 108000 -- exact match to `src/game.js`. |
| Levels 55, 57, 58 | CK-12 | UNKNOWN | Same method as 56 (which passed), not independently re-run under the time box. |
| Levels 55-58 | CK-02 | FAIL | Commit 3bcb5a6 states plainly no authoring receipt was produced (calibrated by rule, not via `deriveCandidate`). Known answer confirmed. |
| Levels 54-58 ship (3bcb5a6) | CK-04 | FAIL | The cited 120-seed fresh-check range 200000-200119 is not logged in `experiments/SEEDS.md` (only 200,000-200,039 is declared, for a different purpose). The 150 fit seeds are covered by the existing 0-499 general row. |

## Summary (5 lines)
- 7 check rows produced: 3 FAIL, 1 PASS, 2 UNKNOWN, 1 N/A.
- Both KNOWN ANSWERS confirmed: Level 53 CK-13 is FAIL (no ledger record); Levels 55-58 CK-02 is FAIL (no authoring receipt, per the commit's own words).
- New finding beyond the known answers: Level 56's CK-12 target recomputes exactly (108,000) from calib-1 + the stated 150 fit seeds, so the demand-rule math itself is sound for at least one of the four levels; Levels 55/57/58 are UNKNOWN only for lack of session time, not for any found defect.
- New finding: the 120-seed fresh-check range (200000-200119) used to validate Levels 55-58 is undeclared in `experiments/SEEDS.md` (CK-04 FAIL) -- a bookkeeping gap distinct from the already-known "no receipt" gap.
- Level 53's CK-12 mismatch (102,000 recomputed vs. 101,000 shipped) was not independently re-run this session; it rests on RESULT-0027's own recorded number, which the ledger record itself already presents as a disclaimed non-match.
