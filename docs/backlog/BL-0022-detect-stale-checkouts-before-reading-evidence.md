---
id: BL-0022
title: Detect stale checkouts before reading evidence, and sweep merged worktrees/branches
status: proposed
milestone: experiment-discipline
depends_on: []
updated: 2026-09-27
---

# BL-0022 — Detect stale checkouts before reading evidence

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class.

## Priority

Owner-flagged priority on 2026-09-27. It is `proposed` rather than `ready`
only because `CURRENT.md` names the sole ready item and PR #46 is editing
`CURRENT.md`; promote it there once that lands.

## Desired outcome

An agent cannot silently reason from an out-of-date ledger, and merged
worktrees/branches stop accumulating unnoticed. Before any agent session
opens any checkout — regardless of which one, including ones that predate
this record — a machine-level check (not an in-repo tool a stale checkout
could simply lack) tells it whether that checkout is missing newer evidence
and fails when it is; the same startup mechanism also finds and removes
worktrees/branches already merged into `origin/main`.

## Why

Checked on 2026-09-27, after `git fetch`:

| Checkout | `git status` says | Commits on `origin/main` it lacks |
|---|---|---|
| `~/orca/workspaces/2248-challenge/Map-Elites-QA` | behind its upstream by 84 | — |
| `2248-challenge` (root) | up to date with its upstream | 87 |
| `2248-challenge-worktrees/nemesis-challenges` | up to date with its upstream | 87 |
| `2248-challenge-worktrees/universe-map-refresh` | up to date with its upstream | 85 |
| `2248-challenge-worktrees/board-map-elites-20260919` | up to date with its upstream | 104 |

Two failure shapes. The first is visible only after a fetch. The second is
invisible even then: the root checkout sits on
`fix/authoring-server-keeper-assets`, which is already merged into `main`, so
`git status` reports "up to date" while the ledger it shows is 87 commits old.

Both caused wrong reads in one session. The 2026-09-26/27 blast-radius audit
built its experiment and metric inventories from the root checkout (missing
RESULT-0049..0051 and CORRECTION-0010..0016), and later named `9c442d7` as the
newest ledger from the orca working copy while its remote was 84 commits
ahead. Both were caught by hand, not by a check.

An in-repo tool plus an `AGENTS.md` line cannot protect a checkout that
predates them — the checkout's copy of `AGENTS.md` is itself part of what a
stale checkout is missing, so a session that opens it never sees the
instruction to run the check. Codex review (finding 4117027138) raised this;
confirmed by re-reading the acceptance criteria below, which only wired the
check into this repo's own `AGENTS.md`.

Separately, checked on 2026-09-27: three worktrees whose PRs had already
merged — `2248-challenge-oracle` (PR #36, `experiment/harvest-policy-corpus`,
merged 2026-09-27), `nemesis-challenges` (PR #39, `feat/nemesis-challenges`,
merged 2026-09-23) and `universe-map-refresh` (PR #38,
`fix/universe-map-refresh`, merged 2026-09-23) — were still present on disk,
along with six merged local branches, and the root checkout sat on merged
branch `fix/authoring-server-keeper-assets`, 87 commits behind `main`. None of
this was caught by any existing check; it took an owner walking the
filesystem by hand.

## Acceptance criteria

1. A machine-level startup mechanism — for example a Claude Code
   `SessionStart` hook installed under `~/.claude` (and the equivalent
   mechanism for Codex) — runs before any agent session begins work,
   regardless of which checkout it opens, including checkouts that predate
   this record. It does not depend on anything inside the checkout (no
   reliance on that checkout's own `AGENTS.md` or an in-repo tool file, since
   a stale or pre-existing checkout may lack either).
2. That mechanism fetches and reports, for the checkout the session opened:
   commits the checkout lacks from its own upstream; commits it lacks from
   `origin/main` that touch `EVIDENCE_LEDGER.md`, `LEDGER-INDEX.md` or
   `CURRENT.md`; and whether its branch is already merged into `main`. It
   exits non-zero when either count of evidence-touching commits is above
   zero, and prints the exact `git` command that brings the checkout current.
3. A one-time rollout sweep runs the same freshness check over every existing
   worktree listed by `git worktree list` from the main clone, so checkouts
   created before this record are covered immediately rather than only on
   their next natural update.
4. The same startup mechanism separately lists worktrees (via `git worktree
   list` from the main clone) whose branch is merged into `origin/main` and
   whose tree is clean. A cwd check alone only protects the session running
   the sweep — it says nothing about a different agent session concurrently
   working in some other merged-and-clean worktree, which this mechanism
   cannot see from its own cwd. Instead, removal is gated on a **lease**: each
   agent session writes and periodically refreshes an untracked lease file
   scoped to its own worktree (for example `.git`-adjacent, or under
   `$GIT_DIR/worktrees/<name>/agent-lease`) containing its pid, host, and last
   heartbeat time. The sweep removes a clean, merged worktree with
   `git worktree remove` (never `rm -rf`, and never a directory whose `.git`
   is a directory rather than a file, since that means a real clone, not a
   worktree) — and deletes the corresponding merged local branch with
   `git branch -d` — only when BOTH: a lease exists and its heartbeat is
   older than a stated staleness threshold; AND the leased pid is not alive on
   this host. An ABSENT lease is never proof of inactivity: a worktree with no
   lease stays report-only (sessions started before the hooks existed cannot
   have one). Each session writes its lease before the sweep runs, and the
   sweep is serialized (one sweep at a time, under a lock) so no lease can be
   created mid-sweep. A worktree that is dirty, has unpushed commits, has a live
   lease, or whose branch is merged only on a remote other than `origin/main`
   is reported, not removed. A lease whose host differs from the sweeping host
   is always report-only, because its process cannot be checked from here.
   Remote merged branches are reported only — deleting them needs owner action.
   **Until the lease mechanism exists and is wired into every agent's session
   start, the sweep is report-only**: it never removes a worktree or deletes a
   branch, only lists candidates.
5. `AGENTS.md`'s read chain also runs the freshness check before
   `LEDGER-INDEX.md`, as a repo-level backstop, but criterion 1 is what makes
   this record's outcome true for checkouts that predate that line.
6. Tested against real repository state: a checkout one evidence commit
   behind `main` fails the freshness check; an up-to-date checkout passes
   (the baseline); a checkout behind only on non-evidence files passes; a
   merged-and-clean worktree with a live lease is NOT removed and is
   reported; a merged-and-clean worktree with a stale lease held on this host AND a
   dead pid IS removed; a merged-and-clean worktree with NO lease → reported, not removed; a stale lease from another host → reported, not
   removed; and, until the lease mechanism exists, the sweep removes nothing
   and only reports candidates (report-only mode).
7. The mechanism never pulls, merges, or resets on its own, and never removes
   a worktree it does not own: other agents own those trees, and this
   criterion holds even when criterion 4's sweep runs.

## Current evidence

None in the ledger; the table above is a direct `git` observation.

## Next action

Write the check, the `SessionStart`-hook (and Codex-equivalent) startup
wiring, the merged-worktree sweep, and their tests in a fresh worktree off
`main`.

## History

- 2026-09-27: Proposed from the blast-radius audit; the owner flagged it as a
  priority.
- 2026-09-27: Codex review (finding 4117027138) noted an in-repo tool plus an
  `AGENTS.md` line cannot protect checkouts that predate them. Confirmed by
  re-reading the original acceptance criteria. Rewrote them to require an
  out-of-checkout startup mechanism (e.g. a Claude Code `SessionStart` hook
  under `~/.claude` and the Codex equivalent) plus a one-time rollout sweep
  over every existing worktree from `git worktree list`. Retitled and widened
  to also cover the owner's 2026-09-27 finding that three merged worktrees
  (`2248-challenge-oracle`, `nemesis-challenges`, `universe-map-refresh`; PRs
  #36/#39/#38) and six merged local branches were still present, and the root
  checkout sat on merged branch `fix/authoring-server-keeper-assets`, 87
  commits behind `main`; added criteria for the same startup mechanism to
  list merged-and-clean worktrees, remove them with `git worktree remove`
  (never `rm -rf`, never a real clone, never dirty/unpushed trees), and
  delete merged local branches with `git branch -d`, reporting remote merged
  branches for owner action rather than deleting them.
- 2026-09-27: Codex review (finding 4117059308) noted the sweep as written
  could remove the session's own active worktree out from under it.
  Confirmed by re-reading criterion 4. Added an exclusion for the worktree
  containing the process's cwd (via `git rev-parse --show-toplevel`) and any
  ancestor-directory worktree, reported rather than removed, plus a test
  case for a clean merged worktree that is the active cwd.
- 2026-09-27: Codex review (finding 4117108539) noted a cwd exclusion only
  protects the session running the sweep, not a different concurrent agent
  session working in some other merged-and-clean worktree. Confirmed by
  re-reading criterion 4. Replaced the cwd exclusion with a lease mechanism:
  each session writes and refreshes an untracked lease file (pid, host,
  heartbeat) in its own worktree; the sweep removes a clean, merged worktree
  only when its lease is absent/stale AND its pid is dead on this host, and
  the sweep is report-only until the lease mechanism exists and is wired into
  every agent's session start. Rewrote the test cases in criterion 6
  accordingly.
- 2026-09-27: Addressed Codex review on b774c96 (sidecar location; foreign-host leases).
- 2026-09-27: Addressed Codex review on bb3bbd8: absent leases are report-only; lease-before-sweep ordering and a serialized sweep.
- 2026-09-27: Removed the leftover "or absent" from the deletion test case; only an existing stale local-host lease with a dead pid qualifies (Codex review on 07007de).
- 2026-10-03: Delivered tools/freshness/check.js (criterion 2, with tests in solver/tests/freshnessCheck.test.js) and tools/freshness/sweep.js (criteria 4 and 7, REPORT-ONLY, with tests in solver/tests/worktreeSweep.test.js). Not delivered: machine-level SessionStart wiring for Claude Code and Codex (criterion 1) and the lease writer; sweep removes nothing.
