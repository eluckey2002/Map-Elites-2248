# Worklog: Git baseline stabilization v2

## Goal

### Objective

The repository has one clean, remotely recoverable canonical `main` baseline containing the verified MAP-Elites lineage and every admitted root change, with a deterministic guard that detects baseline and worktree drift before consequential experiments.

### Acceptance

- A1: Dated remote safety heads resolve to the frozen pre-mutation commits.
- A2: The recovery manifest and its negative control preserve the dirty root.
- A3: Every dirty path receives one disposition; unknown/hold is preserved.
- A4: The candidate contains `8508c3b` and only admitted root changes beyond it.
- A5: The solver suite has exactly the three frozen deliberate receipt failures and no others; curve, MAP-Elites, and diff gates pass.
- A6: The baseline guard fails closed on the four named drift cases and passes live.
- A7: Remote `main`, the clean root, and retained worktrees resolve to tested identities.
- A8: The project/code lens finds no standards or evidence-boundary defect.

## Spec

`.orch/runs/2026-08-28-git-baseline-stabilization-v2/spec.md`

## Tickets

`.orch/tickets/2026-08-28-git-baseline-stabilization-v2/`

## Iterations

### 1. Reuse preservation and establish isolated baseline

- Reused the failed predecessor's verified recovery manifest and exact remote safety refs; covered identities unchanged.
- Workspace: `/private/tmp/2248-git-baseline-stabilization`, branch `codex/git-baseline-stabilization`, clean at `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`.
- Baseline oracle: `node --test solver/tests/mapElites.test.js` -> 10/10 pass.
- Frozen unsandboxed full-suite baseline on the dirty-root feature set: 198 total, 195 pass, exactly three deliberate stale-receipt failures.

### 2. Classify and integrate the preserved root

- Disposition manifest: 67 paths, exactly one category each; 59 admitted and 8 held outside canonical history.
- Candidate comparison: no missing admitted path, no held path present, and no unexplained candidate path.
- Integrated every admitted path above the clean MAP-Elites tip in commit `530deb3dcf7f7edf43d86d74910ce92a25f2b18a`.
- Removed one semantically inert Markdown hard-break from the admitted measurement record to satisfy `git diff --check`.

### 3. Build and review the baseline guard

- Red: guard tests failed because the module did not exist.
- Green: the initial eight drift fixtures passed in commit `8dcd7f16f39201117fb66c36d39e58a06b02486b`.
- Review found that `trim()` corrupted the first reported unstaged path from porcelain status. A new red test reproduced it; commit `673e49bc88fb4d2832bb7da4fb62ea87240e0e30` preserves leading status columns and passes 9/9 guard tests.

### 4. Candidate verification

- Focused changed-surface suite: 40/40 pass.
- Full unsandboxed suite: 219 total, 216 pass, exactly the three frozen deliberate receipt failures and no others.
- Curve gate: pass across all named checks, including 53/53 levels with target and tile scale.
- Historical MAP-Elites verifier pinned to `8508c3b`: pass, 23 occupied cells and 3 representative elite replays.
- Candidate ancestry contains `8508c3b`; whitespace gate passes.
- T-001 completed. Remaining delivery work is remote containment, local held-material preservation, canonical promotion, contained-worktree retirement, and the live guard.

### 5. Preserve locally and promote without retiring worktrees

- Published the tested candidate branch, then moved all held/local-only material and pre-switch shadows into ignored `.recovery/2026-08-28/`; nothing was deleted.
- Switched the root to `main` at `404aae2ea424b7624f1b271c62f20c34f5226221` and fast-forwarded remote `main` to the same identity.
- Owner interruption clarified that the delay was the obsolete permission wait. The safer implementation retains every clean MAP-Elites worktree and ignores only their checkout directories from root status; the guard still inspects their registration and cleanliness.

### 6. Live guard correction

- The first canonical invocation correctly failed on a discovered nested Git marker, but inspection proved it was a historical self-contained repository with a full `.git` directory, not an unregistered linked worktree.
- Red: a discovery fixture returned both the linked `.git` pointer and the standalone `.git` directory.
- Green: discovery now returns only linked-worktree pointer files; targeted guard tests pass 10/10.
- Final full-suite correction: 221 total, 218 pass, exactly the same three deliberate stale-receipt failures and no others.

### 7. Canonical admission

- Fast-forwarded remote `main` through guard-correction commit `9f76a342656286487dc7cfd6d9f7937d9a14f901`.
- Live canonical guard passed with the clean root, exact remote safety identities, required MAP-Elites ancestry, and every retained registered worktree clean.
- The parked deterministic-solver line remains separate. No worktree, historical repository, evidence artifact, held file, or recovery snapshot was deleted.

## Blame classes

[]

## Failed approaches

- The first live guard treated every nested `.git` marker as a linked worktree. That would have forced a false choice between deleting preserved historical material and failing the baseline. The corrected implementation distinguishes linked pointer files from standalone repository directories.

## Queued scope

[]

## Terminal

- `complete`: A1-A8 satisfied. The final record-only closeout commit is rechecked against remote `main` by the live canonical guard after publication.
