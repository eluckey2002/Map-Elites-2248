# Recovery manifest

Status: `RECOVERY ONLY — NOT APPROVED FOR MERGE`

## Source boundary

- Root branch: `level-curve-retune`
- Root commit: `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`
- Porcelain-v2 status SHA-256 before capture: `1f276a59ca3f6812a6def0b0382fad9c7e770b7d16327427ebdfc60220a784e8`
- Porcelain-v2 status SHA-256 after capture: `1f276a59ca3f6812a6def0b0382fad9c7e770b7d16327427ebdfc60220a784e8`
- Tracked modifications: 9 files, 526 insertions, 61 deletions
- Untracked source enumeration: 59 files from `git ls-files --others --exclude-standard`

## Recovery artifacts

- `root-tracked.patch`: SHA-256 `e3432a9ba31ba1918eb865aa7ee252ae448b8fe3fc4245681c9cc0750fea55c7`, 45,602 bytes
- `root-untracked.tar.gz`: SHA-256 `c1c4ad747415bcfbe3eb51a97786b80ee26c7cbc7b7c0197bcf86fa774145145`, 212,232 bytes
- `root-untracked-paths.txt`: SHA-256 `a23f58c1888d2db51f303521d57202d7bd82d03721fd55e9c89e9072fb9c9290`, 58 regular files

The untracked archive was constructed from Git's untracked enumeration. Registered nested worktree contents are not present; their preservation is by exact branch commit.

### Append-only correction: nested worktree exclusion

The first tar invocation received the registered measurement-controls worktree as one directory path from Git and recursively descended into it. That overbroad archive is retained as `root-untracked-with-nested-worktree.invalid.tar.gz`, SHA-256 `349427e8795e5c12a10c994cd070c402f97aa2f3f19d9bf613c1a5d26c9ee380`; it is invalid for A2 and must not be used for restore.

The valid `root-untracked.tar.gz` was derived from that frozen archive by excluding every path beneath `.orch/runs/2026-08-28-map-elites-measurement-controls/worktree/`. It contains exactly the 58 regular untracked files outside the registered worktree.

## Restore verification

A temporary detached worktree at `52f500c` provided the independent clean base.

- `git apply --check root-tracked.patch`: exit `0`
- `git apply root-tracked.patch`: exit `0`
- Negative control, re-running `git apply --check` after application: exit `1`
- `tar -xzf root-untracked.tar.gz`: exit `0`
- Worktree-prefix absence check: `worktree_captured=0`
- Restored Git enumeration: 58 untracked regular files
- Restored status displayed the same nine tracked paths and the captured untracked categories.

The temporary verification worktree was removed after verification.

## Remote safety heads

- `refs/heads/safety/2026-08-28-level-curve-retune` -> `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`
- `refs/heads/safety/2026-08-28-map-elites-learning` -> `be843368be8e19ec59501aae38f19eebaf188b87`
- `refs/heads/safety/2026-08-28-map-elites-measurement-controls` -> `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`

All three were re-read directly with `git ls-remote --heads origin` after creation.
