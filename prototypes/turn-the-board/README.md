# Turn the Board

Play: **http://127.0.0.1:8284**. If stopped, run from the worktree root:
`node prototypes/turn-the-board/serve.js`. `TURN_PORT` selects an unused port
for a restored copy; do not replace another running game.

Owner selected this previously proposed reserve with "sure" after the
recommendation to spend a move changing gravity, gaining one alignment while
disrupting another. Owner play is now recorded in PDL-025: interesting but
mixed, and not used to create a setup or strategy. The owner agreed to
**park this archetype version**, keeping rotation as a possible board-control
mechanic. No redesign or replacement selected. Source and playable reference
are preserved; no shipped gameplay, existing prototype or hashed engine changed.

Baseline: the owner's build-and-harvest strategy (PDL-008). Intended choice:
whether changing the settling direction is worth spending a move and disturbing
a currently prepared harvest. This is not another reward for merely building.

## Rules and controls

Reach 550 points in eight actions. Ordinary chains keep the existing legality,
score multiplier and final-tile survivor. A clockwise or counterclockwise
quarter-turn changes gravity, settles existing tiles, costs one move and earns
no points. The direction persists for later merges. This changes gravity,
not the board's screen orientation.

Both turn buttons preview the complete next board for free. Commit explicitly,
or Cancel / Back to board. Chain preview, live sum, undo, restart, feedback and
download remain available. Undo reverses both turns and merges, including a
terminal action. If no chain is available, paid turns still work while moves
remain. Reload/restart starts a separate capture; there is no saved-run resume.

## Decision scene — spoilers

Coordinates are zero-based `[column,row]`. With gravity down, a ready
`32 → 32 → 64` uses `[3,2]`, `[4,3]`, `[4,4]`. Clockwise gravity (down to left)
separates its first two tiles while connecting the initially separated
64s at `[4,2]`, `[2,3]` with the 128 at `[0,4]`. Harvesting the ready chain first
changes that later alignment. This is a checked constructed contrast, not a prediction
of the owner's next move or evidence of enjoyment.

## Essential space convention

Changing gravity cannot shift a completely full rectangle. The prototype
therefore begins with 17 tiles in 25 cells. A turn only settles existing tiles;
it costs one move, scores no points and adds no tiles. A merge replaces only
the selected tiles it removes, in their affected gravity lanes. Refill is
deterministic, lane-major and upstream-to-downstream within each changed lane.
The eight
empty cells persist; they are usable space, not walls. Gravity persists until
the next quarter-turn. This convention was announced before implementation.

The final layout uses seed 905 and a uniform refill pool of 2, 4, 8, 16, 32,
64, 128. The opening also contains a 256. Sparse occupancy and gravity are being
tried together; owner reaction cannot isolate either one's contribution.

[witnesses.json](witnesses.json) stores turn-first and harvest-first wins in
four actions, scoring 576 and 624. Every selected tile comes from the opening
or merges of opening material; no refill is selected. The harvested opening
also has an ordinary follow-up, so it does not force an immediate rescue turn.
These routes prove feasibility, not optimality, required length or enjoyment.
No route is shown on the game page.

## Checks and limits

Ten focused tests pass:
`node --test prototypes/turn-the-board/model.test.js prototypes/turn-the-board/app.test.js prototypes/turn-the-board/serve.test.js`.
They exercise the actual model/page/script and HTTP server: four-direction
settling on a non-square board, lane refill and space conservation, immutable
preview, turn cost/terminal guards, both tagged-material routes, replay/undo,
served browser-rule parity, real capture and rejection of invalid/stale saves.

The bounded full opening check includes merges, both turns and normal refills.
It finds no one- or two-action win on this exact opening. A known easy target
is found by the same helper; forced aggregate exhaustion fails rather than
claiming absence. The check caught a real earlier two-action ladder shortcut
before two incidental values were changed. It is not a difficulty model or
a strongest-bot comparison. Three-action wins were not excluded.

The actual UI script passed free turn previews/cancellation, live sums, chain
preview, both routes, capture actions, undo and restart in its DOM stand-in.
A separate read-only correctness review found no concrete issue in directional
settling/refill, preview/commit boundaries, action guards or replay parity. The
reviewer inspected source and test coverage; it did not run additional checks.
Native rendered layout, console, screenshot and touch QA remain unverified;
unavailable browser access was not retried. Live page/assets respond, syntax
and whitespace checks pass. All 44 earlier runtime files match the preserved
Landing manifest; the two running earlier games retain their identities.

Owner captures use ignored `sessions/`; HTTP tests use a temporary directory.
Captures record committed turns and merges, not preview exposure. No policy
experiment, commit, merge, publication or production adoption. PDL-024 in the
[playtest ledger](../PLAYTEST-DECISION-LEDGER.md) records preparation and scope.
PDL-025 records the later owner feedback and agreement to park. Task:
TURN-BOARD-1; reviewer: owner. Formal task acceptance is not inferred.

A scoped local checkpoint is under workspace
`preservation/turn-the-board-20261002/`; its verification receipt records
manifest checking and both stored routes after extraction. Older archives are
unchanged. This is same-machine preservation, not a commit or remote backup.
That checkpoint predates the PDL-025 feedback and these disposition updates.

## Owner play disposition — 2026-10-02

The owner reported an interesting but mixed experience: worthwhile choice
versus compacting/re-aligning pieces. They clarified: "it wasn't that I was
trying to create a setup or strategy". After the recommendation to park this
version as an archetype while retaining rotation as a possible board-control
mechanic, the owner replied "Ok. I agree". See PDL-025 for verbatim feedback
and interpretation limits. No exact capture or outcome was matched.

Keep this version unchanged and parked. It is not an accepted third family;
PDL-026 later removed the original 3–5-family quota and the need for a
replacement. No further tuning, new constraint or replacement build is
authorized by either disposition.
