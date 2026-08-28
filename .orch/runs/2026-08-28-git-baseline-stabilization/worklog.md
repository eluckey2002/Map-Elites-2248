# Worklog: Git baseline stabilization

## Goal

### Objective

The repository has one clean, remotely recoverable canonical `main` baseline containing the verified MAP-Elites lineage and every admitted root change, with a deterministic guard that detects baseline and worktree drift before consequential experiments.

### Acceptance

- A1: Dated remote safety heads resolve to the three frozen pre-mutation commits.
- A2: A verified recovery manifest preserves the dirty root without recursively archiving registered worktrees.
- A3: Every dirty path receives exactly one disposition; unknown/hold is preserved.
- A4: The candidate baseline contains `8508c3b` and only explicitly admitted root changes beyond it.
- A5: Full solver, curve, MAP-Elites, and diff gates pass.
- A6: The baseline guard fails closed on the four named drift cases and passes live.
- A7: Remote `main`, the clean root, and retained worktrees resolve to the tested identities.
- A8: The code-pack lens finds no project-standard or evidence-boundary defect.

## Spec

`.orch/runs/2026-08-28-git-baseline-stabilization/spec.md`

## Tickets

`.orch/tickets/2026-08-28-git-baseline-stabilization/`

## Iterations

### 1. Preservation checkpoint

- Root status identity before and after capture: `1f276a59ca3f6812a6def0b0382fad9c7e770b7d16327427ebdfc60220a784e8`.
- Recovery artifacts and verification: `.orch/runs/2026-08-28-git-baseline-stabilization/evidence/recovery-manifest.md`.
- Remote safety heads created and exact live identities re-read from `origin`.
- Budget spent: one preservation pass.

## Blame classes

[]

## Failed approaches

- Temporary recovery worktree removal first hit sandbox denial while deleting shared `.git/worktrees` metadata. It was then removed through the approved `git worktree remove` permission; no repository content was affected.
- Acceptance A5 required the full solver suite to pass. The project intentionally carries three load-bearing stale-receipt failures (`candidate-levels-52.json`, `candidate-levels-54.json`, and `candidate-levels.json`); their failure text explicitly forbids weakening, re-authoring, or exempting them. An unsandboxed run proved every other test passes: 198 total, 195 pass, exactly those 3 fail. A5 is therefore a frozen spec defect, not a code defect.

## Queued scope

[]

## Terminal

- `failed`: acceptance A5 names an impossible and harmful oracle. Deciding evidence is the unsandboxed full-suite result: 198 tests, 195 pass, exactly three deliberate receipt-identity failures. Preservation artifacts and remote safety refs remain valid reusable evidence for the corrected successor run.
