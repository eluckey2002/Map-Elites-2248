---
id: START-001
run: 2026-09-05-startup-checks
status: limited
executor: orch-verify
depends_on: []
write_scope: []
bound: 20 minutes; one execution per named command, environment-only retry permitted
claimed_by: /root
claimed_at: 2026-09-05T21:49:29Z
---

## Objective

Establish the current startup baseline after reading AGENTS.md, CURRENT.md,
the newest HANDOFF.md section, and the evidence ledger. Interpret the user's
unspecified three commands as the suite, curve health check, and human benchmark.
No implementation or policy objective selection is in scope.

## Fixed inputs

- Repository: /Users/eluckey/Developer/research and games/2248-challenge
- Revision: 1d1bbdba70011f29518285a55cca558a6af45c0f; main, initially clean.
- AGENTS.md; CURRENT.md; HANDOFF.md (2026-09-05 section); EVIDENCE_LEDGER.md.
- docs/backlog/BL-0013-policy-vocabulary-gaps.md (proposed).
- Exclusivity: no other agent found with this checkout as cwd; processes
  42656 and 94007 are existing play and bot-vision servers; 67792 is a memory
  service. HEAD/reflog unchanged since initial inspection. This foreground
  agent is the only observed agent in this tree.

## Completion test

1. Run `node --test solver/tests/*.test.js` and compare the totals and failure
   identities with AGENTS.md: 348 tests, 344 passing, four retained failures
   (two receipt identities, generated view freshness, date drift).
   Oracle: existing Node test suite and its actual TAP output; oracle_class:
   deterministic; provenance: pre-existing. This criterion tests agreement
   with the documented baseline, not a wholly green suite.
2. Run `node solver/verify-loop.js`; expect exit 0 and RESULT: PASS.
   Oracle: existing curve health CLI; oracle_class: deterministic;
   provenance: pre-existing. Report its sampled-level coverage.
3. Run `node solver/human-benchmark.js`; expect exit 0, 12 resolved paired
   recordings, and both target-stop and full-budget scoring arms. Report
   actual values as a rerun of existing recordings, without a new general claim.
   Oracle: existing paired benchmark CLI; oracle_class: deterministic;
   provenance: pre-existing.
4. After the commands, verify HEAD remains the fixed revision and tracked
   source is unchanged. Oracle: `git rev-parse HEAD` and `git diff --exit-code`;
   oracle_class: deterministic; provenance: pre-existing.

## Return fields

Command exit statuses, totals and failures, benchmark results, sampled coverage,
fixed revision, changed artifacts, limitations, and next decision in the docs.

## Result

All three commands completed. No process remains owned by this run. No source
or receipt edits. Original source revision is
1d1bbdba70011f29518285a55cca558a6af45c0f; the administrative ticket was committed
at e8f7bf1d602d2a403729a5d753b11ea2ac0f5adb before the clean suite retry.

Initial suite: exit 1, 348 tests, 342 pass, 6 fail, 20.272 seconds.
Four failures match the documented source baseline:

- receiptGate.test.js:165, candidate-levels-52.json calibration stamp mismatch;
- receiptGate.test.js:165, candidate-levels-54.json calibration stamp mismatch;
- universeMap.test.js:138, committed generated view staleness (4 !== 0);
- universeMap.test.js:236, contract asOf 2026-08-28 versus today 2026-09-05.

The other two failures are repoBaseline.test.js:130 and :139: this newly
created uncommitted startup ticket. Both identify only this run's ticket
directory. Administrative retry: commit the ticket on the separate local
branch chore/startup-checks-2026-09-05, then rerun the suite without changing
source or receipts. The initial six-failure observation remains retained.

Clean suite retry (tool session 71134): exit 1, 348 tests, 344 pass, 4 fail,
26.205 seconds. The only failures are the four documented above. Both LIVE
repository-state guards pass with the ticket committed. No known failure was
re-authored, archived, exempted, or otherwise cleared.

Paired benchmark: exit 0; 12 resolved recorded sessions; human 11 wins,
target-stop bot 12 wins. Full-budget scoring bot higher on 12/12, mean +65.7%;
target-stop bot higher on 7/12, mean +9.3%. The latter compares different
objectives. Pilot c50b34f8: human 140544 / 20 moves; target-stop bot
136832 / 19 moves; full-budget scoring bot 152128. No unresolved recordings.

Curve (tool session 8757): exit 0, RESULT: PASS. Configuration checks cover
58/58 shipped levels. Simulation covers 60 seeds starting at 100000 on levels
1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 (660 games). Levels 1 through 45 in
that panel win 100%; level 50 wins 97% rounded. All sampled lockout rates are
0%; sampled bomb-loss maximum is 0%. Printed early/late win rates are
100% / 99%. No simulation coverage of levels 51-58 follows.

Live next work remains proposed BL-0013. Score, moves-to-win, and win rate
are different search objectives; the owner has not selected one. Existing
recordings reproduce the benchmark but do not establish a general superiority
claim for either player or the proposed building strategy.

Changed artifact: only this ticket. `git diff 1d1bbdba70011f29518285a55cca558a6af45c0f
--name-only` lists only this path. `git diff --exit-code` returns 0 at the
administrative commit. Main remains at its original revision.

## Verification

1. Initial FAIL retained; superseded for the clean administrative state by
   PASS, deterministic, existing full suite at e8f7bf1: 344/348 with exactly
   the four documented failures. This is a baseline-match verdict, not a
   wholly green test suite.
2. PASS, deterministic, existing curve CLI output above; covers unchanged
   game, solver, and level sources from 1d1bbdb.
3. PASS, deterministic, existing paired benchmark output above; covers
   unchanged sources and recorded corpus from 1d1bbdb.
4. FAIL under its literal frozen wording: HEAD became e8f7bf1 to commit
   administrative state. The source-unchanged portion passes: the sole diff
   from 1d1bbdb is this ticket, and the worktree was clean at inspection.
   The original criterion is retained rather than rewritten retrospectively.

Join (orch-integrate, /root): limited due to caller-under-supplied criterion 4,
which failed to allow the administrative commit demanded by the existing
repository-state guard. Required command reporting is delivered; the exact
unchanged-HEAD claim is not. Overall frozen-criterion verdict FAIL, weakest
oracle_class deterministic. No game or experiment conclusions are upgraded.
No further command reruns are needed. The final administrative commit does
not change any source or recording identity covered by commands 1-3.

## Feedback

Startup documentation does not enumerate a unique set of three commands.
Selected set stated to the owner before execution. Missing-path and process
inspection friction logged with the installed logger.

The ticket itself triggered two real repository-state guards; committing it
made those guards pass. This observation is retained, along with the resulting
fixed-HEAD criterion mismatch. No new gate or gate exception was introduced.

## Risks

Recorded-board comparisons are exploratory and are not a new preregistered
experiment. Curve simulation samples levels 1-50 and does not cover 51-58.
