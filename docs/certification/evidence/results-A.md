# Certification results — Slice A (Levels 1-50, DECISION-0003, RESULT-0008)

> **Snapshot note:** written against `origin/main` at `ce0930a`, before PR #53 merged `DECISION-0007` and `DECISION-0009` into the ledger. Statements here that those records are absent from `main` were true then and are not true now; see `../levels-2026-09-28.md` for the current state.


Snapshot: `origin/main` at `ce0930a9865433254d6b16e9f42628bb4299e486` (verified via clean `git archive` extraction into a scratchpad dir; no writes made to the working repo).

| Subject | Check | Verdict | Note |
| --- | --- | --- | --- |
| RESULT-0008 | CK-01 Reverify reproduces outcome | UNKNOWN | `verify-loop.js` run did not finish in time-box under CPU contention |
| RESULT-0008 | CK-02 Frozen artifact identity | N/A | No hashed artifact identity published for this record |
| RESULT-0008 | CK-03 Protocol before data | N/A | Explicitly grandfathered (pre-2026-08-31 gate): no protocol was required, so none can be checked. Originally recorded here as PASS; corrected to N/A under the strict-ancestry rule in `../checklist.md`. |
| RESULT-0008 | CK-04 Seeds fresh/logged | UNKNOWN | `experiments/SEEDS.md` does not exist in this snapshot |
| RESULT-0008 | CK-05 Same-board/seed comparisons | PASS | Uniform 100-seed/level scope, no seed-mixing found |
| RESULT-0008 | CK-06 Code identity vs. bug window | **PASS (known-answer match)** | `8e1e232` (2026-08-12) is an ancestor of, and predates, `4ded51c` (2026-08-20 bug-window start) |
| RESULT-0008 | CK-07 Citations exist | PASS | All cited files/lines resolve and match content |
| RESULT-0008 | CK-08 proof_class honesty | PASS | `heuristic_observation` is the weakest supportable class |
| RESULT-0008 | CK-09 Claim within evidence | PASS | Record explicitly disclaims overreach |
| RESULT-0008 / DECISION-0003 | CK-10 Authorship distinct | PASS | `verify-ledger-authorship.js` exits 0 |
| RESULT-0008 / DECISION-0003 | CK-11 Supersede symmetry | PASS | Both records have empty supersede lists |
| Levels 1-50 | CK-12 Target recompute | UNKNOWN | `game-tester.js` run did not finish/complete in time-box under CPU contention |
| Levels 1-50 | CK-13 Custody record exists on main | PASS | DECISION-0003 + RESULT-0008 both accepted, on `origin/main` |

## Summary

- 8 PASS, 3 UNKNOWN, 2 N/A, 0 FAIL (CK-03 for RESULT-0008 corrected from PASS to N/A).
- **Known-answer check (CK-06) confirms the supplied answer**: RESULT-0008's measurement commit `8e1e232` (2026-08-12) predates the `bot.js rolloutValue` weakest-settings bug window (`4ded51c`, 2026-08-20, to `a2bf18d`, 2026-09-04) — PASS, code identity clean, no re-measurement needed.
- The 3 UNKNOWNs (CK-01, CK-04, CK-12) are honest incompletions, not failures: CK-04 is a structural absence (no `SEEDS.md` in this snapshot to check against, pre-dates any seed ledger); CK-01 and CK-12 both require executing `solver/verify-loop.js` / `solver/game-tester.js`, and both runs failed to terminate within the session's time-box while a concurrent verification process (a parallel slice-B agent) was consuming CPU on the same machine — recommend re-running both in isolation.
- No FAILs found in slice A.
