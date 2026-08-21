# Recording/replay closure audit

- **scope:** the claim that the fixed Candidate 51 tracer can be closed as a demonstrated human recording and replay result.
- **mode:** `focused`; two attack rounds, a source-versus-note comparison and an artifact/consumer inventory.
- **target:** `.orch/runs/level-authoring-tracer-2026-08-12` at structural-scan SHA-256 `c11ccf4cd268b82eae25e60a0f4503b4f32953bb63095cb7d2efbd0d3adbbf96`.
- **verifier:** `/root/recording_replay_review_gpt_5_6_sol_high`, independent of producer `/root`; its source-pinned review is `independent-review.md` SHA-256 `ba9b18ce4de9fe073bc8aaad2f4daa710f71097d3f5368ba4ee33f7d25ac0ca8`.
- **completion state:** `snapshot` — the audit is complete at its focused bound, but the experiment itself remains open.

## Critical finding

`F-001` is a confirmed high-severity `invalid-evidence-state`: the ticket and verification declared the tracer complete even though the frozen AC-4 requires successful recording submission, the screenshot itself records only the initial display state, and the actual fixed-worktree `recordings/` directory contains only `.gitkeep`.

The tests establish capability, not the missing event. `AuthoringCapture` can form a payload; the server can structurally validate and persist a synthetic fixture in a temporary directory. Neither source shows a person reaching a terminal game state, a resulting JSON in the actual worktree, or a replay/semantic recomputation of that JSON.

## Supported and unresolved candidates

- Supported: the screenshot demonstrates the Level 51, Candidate 51 seed-1 ready display and a 5x7 board.
- Unverified: a real terminal recording was saved.
- Unverified: a saved recording can be replayed or semantically verified from its seed and chains. No dedicated consumer or test was located in the bounded authoring inventory, and no actual recording exists to exercise one.

## Smallest safe correction

Restore AC-4's recording/replay portion and the ticket/run closure to `UNVERIFIED` or suspended. Do not alter source code. Reopen only when a human terminal play creates a source-pinned recording in the actual worktree and an independent replay or semantic verifier checks its candidate, seed, chains, score, moves, and outcome.

## Integration

The independent review packet was accepted after its cited frozen-spec, verification-note, and screenshot identities matched the audit corpus, and the fixed code worktree resolved cleanly to `2e26ad26ab725300b6441edaa21864162703fe54`. This accepts `F-001` as a correction to the evidence state; it does not close the experiment.
