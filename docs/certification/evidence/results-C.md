# Certification results — Slice C (Levels 51, 52, 54)

Snapshot: `origin/main` at `ce0930a9865433254d6b16e9f42628bb4299e486`.

| Subject | Check | Verdict | Evidence (short) |
|---|---|---|---|
| RESULT-0028 | CK-01 | PASS | `qualify.js verify` + focused tests, 27/27 pass, in clean archive |
| RESULT-0028 | CK-02 | UNKNOWN | verify PASS implies hash checks passed; no independent hand recompute done |
| RESULT-0028 | CK-05 | PASS | single-seed comparison only, no median mixing |
| RESULT-0028 | CK-08 | PASS | proof_class matches evidence (exact_result/direct_source) |
| RESULT-0028 | CK-13 | PASS | present on main, accepted |
| RESULT-0009 (L51) | CK-01 | UNKNOWN | not executed (time-box); not in known answers |
| RESULT-0009 (L51) | CK-06 | PASS | commit 32b90b3 predates bug window start (4ded51c) by ~48 min |
| RESULT-0009 (L51) | CK-10 | N/A | grandfathered, pre-2026-09-25 |
| RESULT-0009 (L51) | CK-13 | PASS | TRACED, accepted on main |
| RESULT-0012 (L52) | CK-01 | UNKNOWN | not executed (time-box) |
| RESULT-0012 (L52) | CK-06 | **FAIL** | commit 0a73bf5 is inside named bug window (4ded51c..a2bf18d); win-rate measurement unverified against fixed bot |
| RESULT-0012 (L52) | CK-09 | PASS | record discloses its own effective-demand drift |
| RESULT-0012 (L52) | CK-10 | N/A | grandfathered |
| RESULT-0012 (L52) | CK-13 | PASS | TRACED, accepted on main |
| DECISION-0007 (L54) | CK-13 | **FAIL** | DECISION-0007 not on origin/main; only on branch `docs/owner-decisions-0007-0008`, provisional |
| DECISION-0007 (L54) | CK-12 | UNKNOWN | correctly not failed for differing from demand formula (deliberate exception); recording status is the open item (see CK-13) |
| DECISION-0007 (L54) | CK-06 | UNKNOWN | the one bot-comparison figure offered (105,664 median) is disclaimed by DECISION-0007's own text as invalid |
| DECISION-0007 (L54) | CK-08 | PASS | owner_decision proof_class appropriate for an explicit exception |
| All three | CK-07 | PASS | ledger sections and cited commits all resolve on origin/main |

## Summary
- 19 checks applied across 3 claims/levels (51, 52, 54).
- Counts: 10 PASS, 2 FAIL, 6 UNKNOWN, 1 N/A.
- FAILs: (1) RESULT-0012/Level 52 CK-06 — shipping commit `0a73bf5` falls inside the known `bot.js` rolloutValue weak-settings window (`4ded51c`..`a2bf18d`), so its 300-seed win-rate measurement is unverified against the fixed bot (does not itself invalidate the level, since the target was an owner decision to hold rather than re-derive). (2) DECISION-0007/Level 54 CK-13 — the owner-exception record is absent from `origin/main`, present only on branch `docs/owner-decisions-0007-0008` as provisional; the exception itself is legitimate (correctly not failed under CK-12) but its custody trail on main is incomplete.
- Known answers confirmed: RESULT-0028 reverify reproduces 140,544 in 20 moves (CK-01 PASS, via the passing qualify/test suite). DECISION-0007 confirmed absent from origin/main (CK-13 FAIL), matching the pinned known answer.
