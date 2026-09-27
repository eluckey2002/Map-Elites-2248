---
id: BL-0022
title: Detect a stale checkout before any agent reads the ledger from it
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

An agent cannot silently reason from an out-of-date ledger. Before it reads
`EVIDENCE_LEDGER.md`, `LEDGER-INDEX.md` or `CURRENT.md`, one command tells it
whether its checkout is missing newer evidence, and fails when it is.

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

## Acceptance criteria

1. A command, for example `node tools/check-fresh.js`, fetches and reports:
   commits the checkout lacks from its own upstream; commits it lacks from
   `origin/main` that touch `EVIDENCE_LEDGER.md`, `LEDGER-INDEX.md` or
   `CURRENT.md`; and whether its branch is already merged into `main`.
2. It exits non-zero when either count of evidence-touching commits is above
   zero, and prints the exact `git` command that brings the checkout current.
3. `AGENTS.md`'s read chain runs it before `LEDGER-INDEX.md`.
4. Tested against real repository state: a checkout one evidence commit
   behind `main` fails; an up-to-date checkout passes (the baseline); a
   checkout behind only on non-evidence files passes.
5. It never pulls, merges or resets on its own: other agents own those trees.

## Current evidence

None in the ledger; the table above is a direct `git` observation.

## Next action

Write the check and its three-case test in a fresh worktree off `main`.

## History

- 2026-09-27: Proposed from the blast-radius audit; the owner flagged it as a
  priority.
