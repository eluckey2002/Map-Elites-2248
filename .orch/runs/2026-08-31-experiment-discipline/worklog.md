# Session record — experiment discipline, 2026-08-31

Not evidence. Navigation and decision record for a session that began as
"what is the current state of the repo" and closed with a preregistration
gate. Proof standing lives in the [evidence ledger](../../../EVIDENCE_LEDGER.md).

## What changed in this repo

- **Universe Map gate repaired.** `universe/resolved.json` pinned a stale
  ledger hash after `DECISION-0004` was appended, so
  `tools/verify-universe-map.js` exited 1 while `DECISION-0004`'s own reverify
  block named it as passing. Re-pinned (`bc569e1`).
- **Target-aware harness ported to `main`.** `DECISION-0004` cited
  `RESULT-0018`, whose producing code lived only on `map-elites-learning`. Five
  files brought over as files, not by merging that branch, which forked before
  the 2026-08-28 measurement controls and would have regressed frozen-axes
  provenance. Exposed a dead test: `targetAwareChallenger` compared `chooseMove`
  against the challenger, but `chooseMove` *is* the promoted policy, so the
  comparison asserted nothing. `bot.js` now exports `chooseBaseMove`.
- **Baseline guard made live.** `repoBaseline.test.js` proved `assessBaseline`
  against hand-built snapshots, imported `collectSnapshot`, and never called
  it — nine green tests that had never looked at this repository. Two LIVE
  tests added.
- **`RESULT-0018` record and 23 evidence artifacts ported**; two ledger
  citations repaired, one of which pointed inside a gitignored worktree and had
  never resolved in any clone.
- **Experiment protocol gate built.** See `experiments/README.md`.
- **Nine worktrees pruned**; all 11 branches backed up to GitHub.

## Decisions

| Decision | Call | Recorded in |
|---|---|---|
| What requires a protocol | `proof_class` includes `heuristic_observation` | `experiments/README.md` |
| Escape hatch | **None.** No `preregistered: false`, no exception flag. An easy exception becomes the default path — that is how the August habit died. Not to be re-proposed without new evidence. | `experiments/README.md` |
| Pre-cutoff results | Grandfathered explicitly, never backfilled. A protocol written after the outcome is fiction. Nothing may be added to the list. | `experiments/GRANDFATHERED.md` |
| `RESULT-0018` | Re-run rather than un-grandfather or revert. Deferred, not blocked. | `BL-0005` |
| Agents sharing a tree | One writer per tree; owner authorization does not make a second writer safe. | `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` |

## Deferred

- **[BL-0005](../../../docs/backlog/BL-0005-retrofit-result-0018-protocol.md)** —
  register a protocol for `RESULT-0018` and re-run its holdout. Trigger is a
  spare half hour of compute, not a decision. **The record carries a
  read-this-first warning**: `chooseMove` is now the challenger, so the champion
  arm must use `chooseBaseMove` or the run measures nothing.

## Known-and-unchanged

Three receipt-gate failures (`candidate-levels.json`, `-52`, `-54`) remain red
by owner decision on 2026-08-21. Refreshing them would re-derive a live level's
target from a stronger bot. They are not to be "fixed."

## Honest limits of the gate

Git proves commit order, not authorship order. An agent that runs an experiment
entirely uncommitted, then commits the protocol before the results, still
passes the ordering check. The artifact stamp closes this for the five guarded
scripts — a commit hash cannot be embedded before it exists — but a result
citing only a markdown report has no stamp, which is why the ordering check was
kept rather than cut as redundant.

The artifact-stamp check currently inspects nothing, because every result on
this ledger is grandfathered. It was mutation-tested with three planted results
instead. First real exercise will be `RESULT-0019`.
