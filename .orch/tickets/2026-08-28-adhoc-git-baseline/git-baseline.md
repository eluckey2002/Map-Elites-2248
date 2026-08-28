---
id: git-baseline
run: 2026-08-28-adhoc-git-baseline
status: limited
executor: orch-investigate
depends_on: []
write_scope: []
excluded_actions:
  - fetch, pull, push, reset, clean, checkout, switch, merge, rebase, commit, stash, stage, delete, move, or repair worktrees
bound: 15 read-only Git and filesystem probes
claimed_by: codex-root
claimed_at: 2026-08-28T00:00:00-05:00
---

## Objective

Establish the current preservation-first Git baseline and recommend the smallest operating system and action sequence that will support ongoing evidence, MAP-Elites, and Universe Map work without losing or blending work.

## Fixed inputs

- Current repository `.git` metadata and linked-worktree registry
- Current working-tree and index state in each registered worktree
- Local branch, upstream, stash, tag, and remote configuration visible without refreshing remote-tracking refs
- Existing durable experiment identities under `.orch/runs/`
- Source policy: read-only local Git and filesystem evidence only; no network refresh or mutations
- Bound: at most 15 probes; inventory before recommending any synchronization or cleanup

## Completion test

1. Inventory the root checkout, every registered worktree, local branches, upstream relationships, stashes, and untracked/modified scope without mutation.
   - Oracle: the named read-only Git commands and bounded filesystem summaries captured in Result
   - oracle_class: deterministic
   - provenance: pre-existing
2. Separate confirmed facts from remote-state gaps and recommend a preservation-first baseline sequence with explicit stop points.
   - Oracle: fixed rubric requiring current facts, gaps, no destructive action, and ordered rollback-safe steps
   - oracle_class: judged
   - provenance: pre-existing
3. Identify the minimum ongoing Git controls needed at session entry, experiment cut, integration, and handoff.
   - Oracle: fixed four-boundary completeness rubric stated in this criterion
   - oracle_class: judged
   - provenance: pre-existing

## Return fields

- status
- result identity
- verification
- cited findings with confidence
- contradictions
- dead ends
- gaps
- recommendation
- small baseline action plan

## Result

### Status

`limited`: the local and remote-visible Git state was inventoried read-only and supports a preservation-first recommendation. No classification of every dirty file, integration test, commit, push, or branch promotion was performed.

### Result identity

This ticket is the timestamped baseline packet. Remote head identities were read directly with `git ls-remote --heads origin`; local remote-tracking refs were not refreshed.

### Cited findings

1. **Root checkout. Confidence: high.** `git status --short --branch` reports `level-curve-retune` at `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`, 12 commits ahead of `origin/level-curve-retune`, with no staged changes, nine modified tracked files, 526 insertions/61 deletions, and 58 untracked files represented by 36 porcelain entries.
2. **Clean linear active lineage. Confidence: high.** `git rev-list --left-right --count` and `git merge-base` establish `main` `6a25695` -> `level-curve-retune` `52f500c` (+36) -> `map-elites-learning` `be84336` (+1) -> `codex/map-elites-measurement-controls` `8508c3b` (+3). Each arrow is ancestry, not merely timestamp order.
3. **Remote preservation gap. Confidence: high as of the live read.** `git ls-remote --heads origin` shows only `main` `6a25695`, `level-curve-retune` `788cfac`, `codex/level-authoring-tracer` `8096fa8`, and `worktree-deterministic-2048-solver` `717aa6a`. Therefore the root's latest 12 commits plus both MAP-Elites branches are not present as remote heads.
4. **Worktree state. Confidence: high.** `git worktree list --porcelain` reports five registered worktrees. The four non-root worktrees all return a clean short status: deterministic solver `717aa6a`, measurement controls `8508c3b`, level authoring `8096fa8`, and original MAP-Elites `be84336`.
5. **Merged/parked branches. Confidence: high.** `codex/level-authoring-tracer` is an ancestor of the active root line, which is 28 commits ahead of it. `worktree-deterministic-2048-solver` is a separate five-commit line from `main` and is remote-backed.
6. **No hidden staged or stash state. Confidence: high.** `git diff --name-only --cached` and `git stash list` are empty.
7. **Dirty-root categories. Confidence: moderate until file-by-file disposition.** The untracked set contains 24 files under `.orch/runs`, 15 under `.orch/tickets`, eight other `.orch` files, six solver files, two recordings, one document, one audit file, and one transcript. These categories mix durable evidence, source, local control state, and likely generated material; they cannot safely receive one blanket disposition.

### Contradictions

- `main` is named as the conventional canonical branch but is 36 commits behind the active root line and 40 commits behind the clean measurement-controls tip.
- The root branch is 12 commits ahead of its upstream while the actual remote has no branches at all for either MAP-Elites tip.
- The active experimental code is clean in a nested worktree, while the repository root carrying navigation/evidence artifacts is dirty and on an earlier commit.

### Dead ends

- `git stash list` contained no hidden work to recover.
- No staged changes exist, so the index provides no prior intended commit boundary.

### Gaps

- The 58 untracked files and nine tracked modifications were categorized by path but not given owner dispositions or exhaustively reviewed for secrets, generated bulk, or duplication.
- Branches were not tested or compared semantically; ancestry alone does not authorize promotion.
- No GitHub branch-protection settings, CI state, or PR history was inspected.

### Recommendation

Adopt one clean canonical trunk (`main`), remote-back every keeper line, keep experiments in short-lived clean worktrees outside the repository root when practical, and require a machine-readable baseline receipt at experiment cut and handoff. Never begin a consequential experiment from a mixed dirty root.

### Small baseline action plan

1. Preserve committed local-only work by publishing the three missing/advanced heads without merging: `level-curve-retune` at `52f500c`, `map-elites-learning` at `be84336`, and `codex/map-elites-measurement-controls` at `8508c3b`.
2. Classify the dirty root into four explicit dispositions: product/source change; durable evidence/receipt; generated or local-only artifact; unknown/hold. Delete nothing. Create narrow commits only after classification; do not use one broad `git add -A`, because nested worktrees and mixed `.orch` data are present.
3. Run the full project gates on the clean measurement-controls tip plus only the admitted dirty-root commits. If green, make that reviewed identity the candidate canonical baseline and explicitly fast-forward/promote `main` through an owner-approved integration step.
4. After remote backup and containment checks, retire only the authoring-tracer worktree already contained in the active line. Keep the deterministic solver parked and separately named. Move future worktrees outside the root or ignore only their container metadata by an explicit policy.
5. Add ongoing controls: session-entry identity check; experiment-cut clean-tree and upstream check; receipt-bound commit/hash capture; session-exit clean-or-explicit-WIP rule; a baseline verifier used by the Universe Map.

## Verification

1. `PASS` — deterministic oracle. The requested Git/worktree/stash/upstream inventory is recorded from named commands.
2. `UNVERIFIED` — judged oracle. Facts and gaps are separated and the plan is preservation-first, but no independent judged context reviewed it.
3. `UNVERIFIED` — judged oracle. Controls cover the four required boundaries, but no independent judged context reviewed them.

Overall: `UNVERIFIED`; the state inventory is deterministic, while the recommended plan remains an owner-facing architecture judgment.

## Feedback

[]

## Risks

- Pushing branches preserves committed work but not the dirty root.
- A broad snapshot commit would risk admitting nested-worktree metadata and generated `.orch` material as product history.
- Promoting the clean MAP-Elites tip before classifying the dirty root could strand newer level, replay, receipt, and governance work.
