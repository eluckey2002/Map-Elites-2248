# Certification results — Slice B (RESULT-0011, RESULT-0027, target-era comparability)

> **Snapshot note:** written against `origin/main` at `ce0930a`, before PR #53 merged `DECISION-0007` and `DECISION-0009` into the ledger. Statements here that those records are absent from `main` were true then and are not true now; see `../levels-2026-09-28.md` for the current state.


Snapshot: origin/main @ ce0930a. PR #46 (origin/eluckey2002/Map-Elites-QA, unmerged) consulted for CORRECTION-0017.

| Subject | Check | Verdict | Note |
|---|---|---|---|
| RESULT-0011 | CK-06 | **FAIL** | Measurement commit 4ded51c is the opening commit of the named bot.js rolloutValue bug window (4ded51c..a2bf18d); unmerged CORRECTION-0017 re-measured the same tie-break outside the window and got +3.19% (t=18.8) vs the recorded +5.25%. |
| RESULT-0011 | CK-11 | FAIL | Main's copy has `superseded_by: []`; PR #46's copy has `superseded_by: [CORRECTION-0017]`. Main is stale relative to the unmerged correction. |
| RESULT-0027 | CK-06 | **PASS** | calib-1.js's rolloutValue is frozen and self-contained (own file, calls engine.js directly, never imports bot.js) — independent of the bot.js bug window despite falling inside it by date. |
| RESULT-0011 / 0012 | CK-09 | PASS | Both records explicitly disclose that pre- vs post-0011 level targets are not directly comparable; no overclaim. |
| target-era comparability | CK-12 | UNKNOWN | No standard requires reconciling the two eras; RESULT-0012 frames re-deriving the curve as an open owner decision, not a violation. |
| RESULT-0011 | CK-01 | UNKNOWN | `engine.test.js` (45/45) reverified; `routing-ablation.js`/`chain-coverage.js` numeric reverify did not complete inside the time box (routing-ablation alone runs ~460 min per CORRECTION-0017). |
| RESULT-0027 | CK-01 | UNKNOWN | `author-level.js --verify` reverify launched but did not return in time. |
| RESULT-0011 / 0027 | CK-04 | UNKNOWN | No seed-range entries for either found in `experiments/SEEDS.md`; not resolved whether pre-gate-grandfathered or undeclared. |

## Summary

8 checks recorded: 2 FAIL, 1 PASS-on-the-headline-question (CK-06/RESULT-0027), 1 PASS (CK-09), 4 UNKNOWN (mostly time-boxed long-running reverifies plus an open, disclosed owner-decision item). The known-answer check holds: RESULT-0011's CK-06 is FAIL, not PASS, because its own tie-break lift was measured inside the exact commit window that later turned out to have a broken bot.js rollout, and an unmerged correction (PR #46, CORRECTION-0017) already found a materially smaller effect (+3.19% vs +5.25%) when re-measured outside that window — main has not absorbed this correction. RESULT-0027's frozen calib-1 evaluator is correctly exempt (CK-06 PASS) since it never touches bot.js's buggy code path.
