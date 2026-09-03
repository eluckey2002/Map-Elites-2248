---
id: BRANCH-TRIAGE-001
run: 2026-09-02-adhoc-remote-branch-triage
status: complete
executor: orch-task
depends_on: []
write_scope:
  - .orch/tickets/2026-09-02T-adhoc-remote-branch-triage/
  - git tags archive/*
  - remote branch deletions limited to branches proven merged
  - main (merge of qualified fix and recovered capabilities only)
excluded_actions:
  - delete any branch whose tip is not an ancestor of origin/main
  - touch local-only worktree branches under /private/tmp
  - add EVIDENCE_LEDGER entries for recovered code without a new admitted claim
  - edit untracked files left by other sessions in the root checkout
bound: this session
claimed_by: claude-fable-5.1 foreground session
claimed_at: 2026-09-02T22:00:00-05:00
---

## Objective

Owner-ordered triage of the 17 remote branches, in this order:

1. Inspect and qualify the unique guard fix (`fix/experiment-guard-reads-registration-commit`).
2. Tag every remote branch tip before deleting anything.
3. Prove the eight pointers are merged into current main, then delete only those.
4. Compare the two proposed rescues (human replay + heavy-after ablation; generated level corpus) against current main.
5. Recover only genuinely unique capabilities.
6. Create new ledger entries only for new admitted claims, not because code was recovered.

## Completion tests

1. Step 1: full `node --test` suite and `node tools/verify-experiments.js` pass on the fix merged onto current main. Oracle: deterministic; provenance: pre-existing.
2. Step 2: `git tag -l 'archive/*' | wc -l` equals the number of remote branches (excluding main), each tag pointing at the branch tip at time of tagging, and tags pushed.
3. Step 3: for each deleted branch, `git merge-base --is-ancestor <tag> origin/main` is true; no other branch deleted.
4. Step 4/5: each recovered file either does not exist on main or differs and the difference is recorded here; recovered tools run on current main.
5. Step 6: `git diff origin/main -- EVIDENCE_LEDGER.md` is empty unless a new claim is admitted through the experiment gate.

## Result

1. **Guard fix qualified and landed.** `fix/experiment-guard-reads-registration-commit` (2563abb) conflicted with main in `tools/verify-experiments.js` (main's newer `assessProtocolLifecycle`) and `docs/CHECK-CARDS.md`; resolved by keeping both. On the merged tree: 315 tests, 310 pass, 5 fail, and the 5 failures are identical to plain main (three known receipt mismatches, the linked-worktree `.orch` state check, the generated-views staleness check). `node tools/verify-experiments.js`: EXPERIMENT GATE PASS. Landed as merge `de3ef93`, pushed. **Scope of qualification:** the registration-commit `version_freeze` repair only (clause (c) of `version-freeze-covers-the-evidence`). Two defects seen and not fixed are preserved in `docs/backlog/BL-0007-experiment-guard-follow-ups.md`: the protocol body remains rewritable after registration, and the ledger-side check false-PASSes a protocol with no `version_freeze`.
2. **16 archive tags** `archive/<branch>` created at every remote branch tip (all remote branches except main) and pushed.
3. **8 branches deleted**, each only after `git merge-base --is-ancestor archive/<branch> origin/main` returned true: codex/git-baseline-stabilization, codex/level-authoring-tracer, codex/map-elites-measurement-controls, codex/universe-map-v1, level-curve-retune, safety/2026-08-28-level-curve-retune, safety/2026-08-28-map-elites-learning, safety/2026-08-28-map-elites-measurement-controls. Every `recordings/` file on those tips exists on main (0 missing across 8 tips); no remaining remote branch holds a recording main lacks. Owner instruction mid-run: never delete a branch holding gameplay; none was.
4. **Rescue comparison.** (a) `solver/human-replay.js`: all imports resolve on main; `--from` mode reproduces the 135-move table; main's `human-vs-bot.js` and `recording-replay.js` do not enumerate the exact best move or group setup/payoff moves, so the capability is unique. (b) `solver/generated-level-corpus.js`: 7 of 17 of its own tests fail on main: its frozen protocol's source hashes are stale (preflight INVALIDATED), its reserved seed range 21,000,000+ now collides with seeds spent by the 2026-09-02 topology cross-eval, and two `TypeError`s show API drift in the calibration/measurement path. Not a drop-in; recovering it means registering a new protocol and porting, which is new research, not recovery. (c) `heavy-after-ablation.js` plus the `heavyAfter` engine knob: a rejected variant, worse at every threshold; not recovered.
5. **Recovered:** `solver/human-replay.js` and its 2026-08-28 table with a provenance README at `.orch/runs/2026-08-29-human-replay-exploratory/evidence/`, one command line in `CURRENT.md`. Commit `d0e7887`.
6. **Ledger:** `git diff origin/main -- EVIDENCE_LEDGER.md` empty. No claim admitted.

Remaining remote branches (all tagged, none deleted): codex/2026-08-29T10-29-19Z-adhoc-session-workspace, codex/preserve-pre-promotion-untracked-2026-08-30, codex/research-session-2026-08-28, codex/target-aware-promotion-rehearsal-2026-08-30, fix/experiment-guard-reads-registration-commit (now merged), map-elites-learning, worktree-archify-diagrams, worktree-deterministic-2048-solver.

Not in scope: nine local-only branches checked out in worktrees under /private/tmp (e.g. codex/human-pilot-evidence, codex/player-style-cross-eval) never reached the remote and were not touched.
