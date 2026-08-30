# Workspace record — 2026-08-29T10-29-19Z-adhoc-session-workspace

## Identity
- worktree: `.orch/runs/2026-08-29T10-29-19Z-adhoc-session-workspace/worktree` (gitignored via `.orch/runs/*/worktree/`)
- branch: `codex/2026-08-29T10-29-19Z-adhoc-session-workspace`

## Provenance
- derived from: `9016690` "Close Universe Map verification run" (tip of `main` at cut time)
- NOT derived from `codex/research-session-2026-08-28` (c4a42fc, 10 commits ahead of main).
  That branch is held by another live agent in
  `.orch/runs/2026-08-29T01-57-14Z-adhoc-research-worktree/worktree`; last commit 2026-08-29 05:14 -0500.
  Left untouched.
- The root tree carries uncommitted work (prior session: human-replay, heavy-after ablation,
  RESULT-0018/0019 ledger entries, test fixes). Left in place, untouched. Non-destructive
  snapshot taken here for recovery:
  - `root-dirty-tracked.patch` (tracked-file diff vs 9016690)
  - `root-untracked.tar.gz` + `root-untracked.txt` (untracked files)

## Baseline (clean, attributable)
- oracle: `node --test solver/tests/*.test.js` run inside this worktree at cut time
- result: 236 tests / 233 pass / 3 fail — full output in `baseline-tests.txt`
- the 3 failures are the documented pre-existing receipt-gate failures
  (candidate-levels.json, -52, -54); they predate this workspace and are not attributable to it
- git status inside the worktree at cut: clean

## Overlap warning
The other agent's branch touches CURRENT.md, EVIDENCE_LEDGER.md, UNIVERSE.md,
universe/resolved.json, universe/map.html, solver/tests/universeMap.test.js.
Work here that edits those files will conflict at merge.
