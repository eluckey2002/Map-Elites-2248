---
id: START-001
run: 2026-09-05-startup-checks
status: claimed
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

All three commands launched against the fixed revision. Curve tool session
8757 remains active; the foreground caller polls its terminal output at
intervals below 60 seconds. Suite 90560 and paired benchmark 66935 completed.
No source or receipt edits.

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

Paired benchmark: exit 0; 12 resolved recorded sessions; human 11 wins,
target-stop bot 12 wins. Full-budget scoring bot higher on 12/12, mean +65.7%;
target-stop bot higher on 7/12, mean +9.3%. The latter compares different
objectives. Pilot c50b34f8: human 140544 / 20 moves; target-stop bot
136832 / 19 moves; full-budget scoring bot 152128. No unresolved recordings.

## Verification

1. FAIL at initial administrative state: six failures, not four. Retry pending
   after the ticket is committed; no code repair is proposed.
2. UNVERIFIED: curve process still running.
3. PASS, deterministic: paired benchmark output above, fixed source revision.
4. UNVERIFIED: final source/identity inspection pending.

## Feedback

Startup documentation does not enumerate a unique set of three commands.
Selected set stated to the owner before execution. Missing-path and process
inspection friction logged with the installed logger.

## Risks

Recorded-board comparisons are exploratory and are not a new preregistered
experiment. Curve simulation samples levels 1-50 and does not cover 51-58.
