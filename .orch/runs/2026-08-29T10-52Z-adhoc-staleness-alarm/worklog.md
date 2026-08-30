# Worklog — 2026-08-29T10-52Z-adhoc-staleness-alarm

## goal

Restore the property that this repository reports when its own navigation has
gone stale, and answer the alarm that was silenced rather than answered.

Acceptance: T-001 and T-002 complete per their completion tests. Frozen at
iteration 1; not edited thereafter.

## spec

None — ad-hoc set, no frozen spec required.

## tickets

`.orch/tickets/2026-08-29T10-52Z-adhoc-staleness-alarm/`

## workspace

Established workspace `.orch/runs/2026-08-29T10-29-19Z-adhoc-session-workspace/worktree`
(branch `codex/2026-08-29T10-29-19Z-adhoc-session-workspace`, base `9016690`,
provenance and clean baseline recorded in that run's `workspace.md`).

DEVIATION from the code pack's workspace cell, recorded rather than hidden: the
cell binds one worktree per frontier item, branched at dispatch and merged at
the join. Not used here. T-001 and T-002 have disjoint `write_scope`s, run
sequentially inline, and each is verified at its own file identities
(sha256 before/after). Per-item worktrees would buy no isolation these two
items can use, and the work builds on uncommitted changes that have no
revision to branch from.

Identities are file hashes, not commits: nothing is committed, because the
owner authorised repair, not a commit.

## iterations

### 1 — cut and freeze

Wrote T-001 and T-002 as ad-hoc tickets. Every criterion's oracle was executed
against the pre-work state before the ticket was frozen, and each records the
FAIL reading it returned. Independence enters per rules/verification.md §10
source 1: all oracles carry `pre-existing` provenance, specified before any
work, so acceptance does not rest on checks authored after the fact.

One oracle was rejected during this step and replaced — see failed_approaches.

## blame_classes

[]

## failed_approaches

- Oracle for T-002 criterion 1 drafted as `grep -c` on the full sentence "the
  stale path is covered by the fails-closed tests below". Returned 0 against the
  known-bad state, which would have read PASS while the defect stood: the
  sentence wraps across two comment lines and grep is line-based. Replaced with
  the single-line fragment `the stale path is covered by the`, which returns 1
  against the bad state. Logged to friction.

## queued_scope

- Level 53 ships with no `RESULT-` or `DECISION-` record in EVIDENCE_LEDGER.md;
  it entered `src/game.js` in `530deb3`, a commit about MAP-Elites evidence.
  Adjudication is owner work, outside this run's goal.
- `solver/level-author.js:14,127` calls `chooseMove` with no params, so
  `CALIBRATION_PARAMS` does not govern the authoring path. Pre-existing.
- 10 unmerged commits on `codex/research-session-2026-08-28`, unaudited.

## terminal

accepted — T-001 and T-002 crossed the join with every frozen deterministic criterion covered. Their ticket-owned changes were isolated from the mixed temporary worktree for commit during session closeout.
