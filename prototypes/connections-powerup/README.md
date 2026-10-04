# Connection Run + Power-up

Owner-authorized isolated playtest, 2026-10-02. Current URL:
**http://127.0.0.1:8285**. The original run at 8281 and both Delivery references
remain unchanged. This adds board control to the retained Connections mode;
it is not a new archetype to fill the superseded quota.

## Play contract

- Each normal merge producing a tile worth **2048 or more** earns one removal
  charge, including non-power-of-two results above the threshold. One charge
  per qualifying merge, not per turn that a large tile remains on the board.
- Start with zero charges. Save up to three; awards at capacity are discarded.
- Press **Remove a tile**, then choose any tile. Cancel without spending, or
  spend one charge to remove that tile and apply normal gravity and refill.
- Removal gives no score, completes no objective, and leaves the current
  objective unchanged. It counts as one move; the mode has no move limit.
- A saved charge is usable even when no legal chain remains.
- Undo restores the board, refill cursor, objective and bank together. Preview
  predicts an award but grants no real charge.
- Skip and New board preserve the bank. Restart entire run clears it.
- Opening boards, seeds, 2–128 refill pool, ordinary chain rules, objective
  bank and optional arithmetic aids are the existing Connection Run design.

Zero initial charges, discarded excess awards and move accounting are announced
first-playtest defaults, not separately measured balance decisions. Three is
the owner's proposed initial cap. See [concept and decision history](../../docs/backlog/BL-0024-connections-earned-cleanup.md).

## Playtest question

Does earning and saving removal charges support the owner's build-and-harvest
planning, and do charges arrive before incompatible material blocks that work?
Notice spending to open a useful path versus saving for later recovery. No
claim that the threshold/cap solves sustained-board health has been established.

The existing residue scene is recorded in PDL-027; PDL-028 records this selected
response in the [playtest ledger](../PLAYTEST-DECISION-LEDGER.md). The earlier
capture is not retroactively credited with charges or imported into this mode.

## Run, save and resume

From this worktree: `node prototypes/connections-powerup/serve.js`.
Default port is 8285; override with `CONNECTION_POWERUP_PORT`. Check whether
the port is already occupied before starting another server. Assets are cached
at startup; do not restart somebody's active play to demonstrate an update.

Keep the new mode's `?session=...` URL to continue. Reload replays its last
saved actions into a new capture, preserving the source. Bare URL starts a fresh
run. Captures live in this directory's ignored `sessions/`, not the experiment
corpus. The rules identity is distinct from 8281; old captures are not silently
reinterpreted. Download this play retains a copy if local saving is unavailable.

## Verification and limits

`node --test prototypes/connections-powerup/*.test.js` — 15 checks pass.
The wider focused run, including unchanged Connection Run, trio and engine
checks, passes 88 checks. Tests execute the actual model, page/script with DOM
stand-ins, served browser JavaScript and authoritative HTTP persistence.
They cover awards/cap, standing-tile non-awards, preview, removal/gravity/refill,
no-chain rescue, undo/resume, rejected unearned spends, stale identity and
capture non-overwrite. A hidden fixture proves earning from the unchanged
opening board; it is not a human policy, shortest route or difficulty result.

Native desktop/mobile rendering, console and touch behavior remain unverified
under the previous browser-access restriction. Read-only source/spec/standards
and simplification scans ran inline; dedicated independent review remains open.
No configured lint/typecheck exists; changed JavaScript is syntax-checked.
Full solver-suite status and the separately diagnosed existing collector gap
are recorded in the [receipt](../../.blackboard/runtime/CONNECTIONS-POWERUP-1.md).
This is ready for owner play, not release, production adoption or task acceptance.

## Local preservation

Workspace checkpoint: `preservation/connections-powerup-20261002/`, outside
the worktree. Its manifest and README define the frozen source/document bundle
and fresh-directory restore procedure. It is a local same-machine copy, not a
remote backup or commit. Later owner captures are not automatically included.
