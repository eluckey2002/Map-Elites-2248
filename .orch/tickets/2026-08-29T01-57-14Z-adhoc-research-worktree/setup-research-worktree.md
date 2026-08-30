---
id: setup-research-worktree
run: 2026-08-29T01-57-14Z-adhoc-research-worktree
status: failed
executor: ce-worktree
depends_on: []
write_scope:
  - Git worktree registration for /Users/eluckey/Developer/research and games/2248-challenge/.orch/runs/2026-08-29T01-57-14Z-adhoc-research-worktree/worktree
  - refs/heads/codex/research-session-2026-08-28
  - .orch/tickets/2026-08-29T01-57-14Z-adhoc-research-worktree/setup-research-worktree.md
excluded_actions:
  - edit tracked project content
  - commit
  - push
  - begin substantive research
bound: 15 minutes
claimed_by: /root
claimed_at: 2026-08-29T01:57:49Z
---

## Objective

An isolated linked worktree exists for this research session without changing tracked content in the main checkout.

## Fixed inputs

- Main repository: `/Users/eluckey/Developer/research and games/2248-challenge`
- Starting main HEAD: `90166907437c7b686f868be0e049325d97fb00f6`
- Remote base ref: `refs/remotes/origin/main`
- Branch to create: `codex/research-session-2026-08-28`
- Worktree path: `/Users/eluckey/Developer/research and games/2248-challenge/.orch/runs/2026-08-29T01-57-14Z-adhoc-research-worktree/worktree`
- Pre-action main status from `git status --porcelain=v1`: empty

## Completion test

1. The target is a linked Git worktree. Oracle: `git -C <target> rev-parse --is-inside-work-tree` returns `true`, and its absolute Git dir differs from its absolute common Git dir. Oracle class: deterministic. Oracle provenance: pre-existing.
2. The target is on `codex/research-session-2026-08-28`. Oracle: `git -C <target> branch --show-current` returns the exact branch name. Oracle class: deterministic. Oracle provenance: pre-existing.
3. The target starts at the fetched `origin/main` revision. Oracle: `git -C <target> rev-parse HEAD` equals `git rev-parse refs/remotes/origin/main`. Oracle class: deterministic. Oracle provenance: pre-existing.
4. The main checkout has no tracked or untracked project-content changes after setup. Oracle: `git status --porcelain=v1` in the main checkout remains empty. Oracle class: deterministic. Oracle provenance: pre-existing.

## Return fields

- worktree_path
- branch
- base_revision
- per-criterion verdicts with command evidence

## Result

- worktree_path: `/Users/eluckey/Developer/research and games/2248-challenge/.orch/runs/2026-08-29T01-57-14Z-adhoc-research-worktree/worktree`
- branch: `codex/research-session-2026-08-28`
- base_revision: `90166907437c7b686f868be0e049325d97fb00f6`
- Created one linked worktree from fetched `origin/main`; no tracked project content was edited.

## Verification

1. PASS — deterministic, pre-existing. `rev-parse --is-inside-work-tree` returned `true`; absolute Git dir `/Users/eluckey/Developer/research and games/2248-challenge/.git/worktrees/worktree1` differs from common dir `/Users/eluckey/Developer/research and games/2248-challenge/.git`.
2. PASS — deterministic, pre-existing. `branch --show-current` returned `codex/research-session-2026-08-28`.
3. PASS — deterministic, pre-existing. Target `HEAD` and `refs/remotes/origin/main` both resolved to `90166907437c7b686f868be0e049325d97fb00f6`.
4. FAIL — deterministic, pre-existing. Main `git status --porcelain=v1 --untracked-files=all` returned only the required ticket bookkeeping path `?? .orch/tickets/2026-08-29T01-57-14Z-adhoc-research-worktree/setup-research-worktree.md`, rather than literal empty output. No project-content path appeared.

## Feedback

- join disposition: rejected (caller under-supplied)
- `orch-task` requires a durable ticket under `.orch/tickets/`, but this repository does not ignore that directory; a literal clean-status oracle therefore conflicts with the required bookkeeping file.

## Risks

- The setup ticket cannot reach `complete` under its frozen fourth oracle even though the requested linked worktree exists and is clean.
