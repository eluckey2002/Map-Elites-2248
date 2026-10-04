# Delivery · Landing

Owner-play update, 2026-10-02: the owner affirmed considering chain endpoints,
their placement affecting the next move, and that choice feeling satisfying.
PDL-021 in the [playtest ledger](../PLAYTEST-DECISION-LEDGER.md) records the
wording and limits. Retain this as a contrasting Delivery reference alongside
Staggered. No retry-learning, exact route or final collection acceptance is
inferred. Gameplay is unchanged; the pre-play checks below are historical.

Play: **http://127.0.0.1:8283**. If stopped, run from the worktree root:
`node prototypes/delivery-bridge/serve.js`. For a restored copy, use
`DELIVERY_PORT` to select an unused port. Do not replace a running game.

One contrasting Delivery layout, now retained following owner feedback.
The pre-play question was whether
choosing between immediate parcel progress and a useful survivor placement
creates a decision that helps later planning. Staggered remains unchanged on
8282. Its positive owner feedback is recorded in PDL-019; it is not evidence
about this new board. Preparation and authorization are in PDL-020 of the
[playtest ledger](../PLAYTEST-DECISION-LEDGER.md).

## What changed

The layout and seed (728) are new. Rules, eight-move allowance, parcel objective,
shared UI and uniform refill pool of 2, 4, 8, 16, 32, 64, 128 match Staggered.
Chains contain at least three tiles; the first two match, later tiles match or
double the preceding value. The last tile becomes the sum, then gravity acts.
The parcel cannot be selected and delivers at the bottom of its column.

Live sum, preview, undo, feedback and Download this play are retained.
Reload/restart starts a new play. Owner captures use this variant's ignored
`sessions/`; HTTP tests use temporary directories. No earlier game was stopped
or changed, and no routes are shown on the play page.

## Design scene — spoilers

Baseline remains the owner's build-and-harvest play (PDL-008). Unlike Staggered's
clearing-order scene, this scene compares where the same merge leaves its value.
Coordinates are zero-based `[column,row]`.

The four 16s at `[1,2]`, `[2,2]`, `[2,3]`, `[3,3]` create the same 64 and points.
Ending inside at `[2,3]` leaves the parcel at row 2. Ending outside at `[3,3]`
lets it fall farther, to row 3, but leaves the new 64 in a different column.

The same left-side `2 → 2 → 4` clear then drops the inside survivor beside the
original bottom 64 and 128. After the outside placement that clear leaves the
survivor too high for the same connection. A different clear across both sides
can lower both parcel support and survivor support; the outside choice is useful
too. A separate repair clears support under the outside survivor after the
left-side clear. It is a feasible recovery, not proof that an extra move is needed.

[witnesses.json](witnesses.json) stores three-move routes for both placements and
a four-move recovery. All selected tiles originate in the opening or merges of
opening material; none are refills. These routes do not prescribe how to play
or establish perceived difficulty.

## Checks and limits

Six focused tests pass:
`node --test prototypes/delivery-bridge/model.test.js prototypes/delivery-bridge/serve.test.js`.
They read the actual model/page, verify the same-tile placement contrast,
tagged-material routes, replay/undo, unchanged configuration, served browser
model parity, actual HTTP capture and rejection of invalid saves.

Opening search enumerated 201 first moves and 28,397 second moves, including
normal refills: no one- or two-move win. It visited 37,620 enumeration nodes
within the 200,000 aggregate limit. The same helper finds a known easy-board
win; deliberate budget exhaustion fails instead of reporting no win. These
results apply only to this exact opening, not general difficulty or bot strength.

The actual page/shared app passed DOM-stand-in interactions: load, live sum,
preview/back, merges, completion, undo and restart. Native rendering, browser
console, screenshot and touch QA remain unverified. No blocked browser access
was retried. Syntax and whitespace checks pass. All nine older live identities
and 39 previous runtime source files were checked unchanged.

A low-cost read-only agent found no concrete defect in the placement contrast,
refill tagging, aggregate bound or shared UI wiring. The main agent was the
sole writer. No commit, remote publication, merge or production adoption.
Local source/capture preservation is under workspace
`preservation/delivery-landing-20261002/`; its receipt records restoration checks.

## Play checkpoint

Did choosing where the merged tile stayed change your plan? If a route failed,
could you see what to change? Losing is not required. Owner judgment is now
positive in PDL-021; broader family acceptance
and retry-learning remain open. Task: DELIVERY-BRIDGE-1; reviewer: owner.
