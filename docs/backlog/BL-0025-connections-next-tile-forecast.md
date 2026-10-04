---
id: BL-0025
title: Show the next incoming tile above each Connections column
status: proposed
milestone: level-archetype-design
depends_on: []
updated: 2026-10-04
---

## Owner proposal

"So, my idea is that above each column you show the next tile."

The intended benefit is planning what to clear and preserve while keeping the
current board in view. This follows the owner's Keep a Line question about
whether a refill-dependent continuation was foreseeable, not a request for
automatic solutions or a harder puzzle.

## Existing behavior and open decision

Free **Preview result** already shows the exact immediate post-merge board,
including replacements. The owner reported never having used it. The earlier
chat's stronger guesswork framing was corrected; the source-grounded
clarification is appended to KEEP-A-LINE-PATH-1.

The current finite model uses one shared replacement stream. Which values
reach later columns depends on how many spaces are cleared in earlier columns.
A stable, always-visible promise for each column therefore changes refill
assignment, rather than only adding a display. A forecast tied to a selected
chain could instead retain the current rules. Neither behavior is selected.

The agent suggested showing one reliable upcoming tile per column and leaving
additional replacements undisclosed. That suggestion is not an owner decision.
Multiple-space clearance and which incoming tile the display represents still
need resolution before implementation.

## Boundary and next action

The owner then asked to continue the previous work. Preserve this proposal;
do not build it, change replacement assignment, re-author levels, migrate
captures or restart active play as part of the finite-pack handoff. Revisit
only when this idea is selected for a bounded trial.

## History

- 2026-10-03 — Captured the column display proposal and its refill-assignment
  consequence. No implementation or effectiveness claim; current work resumed.
- 2026-10-04 — Main-project integration is authorized for the existing pack
  (DECISION-0010, PDL-035). This proposal stays proposed and unimplemented;
  promotion does not silently select a forecast or change refill assignment.
