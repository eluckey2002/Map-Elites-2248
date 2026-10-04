# Connections — Across the Board

Revision after the owner's 2026-10-01 feedback: "you put them all nxt to
eachother". A and C in the first layout were adjacent; that failed to exercise
the proposed path-building problem. This version changes the layout, not the
connection rules, board dimensions, refill distribution, seed or move budget.

Play at http://127.0.0.1:8278. Start from the worktree root:

```sh
node prototypes/connections-spaced/serve.js
```

The old Connections game stays on 8277, and the Delivery games stay on
8274–8276. None was restarted or modified in its running process. The shared
Connections module gained a layout factory; its default board still replays
all three original witnesses. Existing processes retain their served source
and identity snapshots; restarting one later would load the new source.

## Question and concrete change

Does arranging values across a gap make these connections worth planning?
All three endpoint pairs now span four columns, from the leftmost column to
the rightmost. Zero-based positions:

- A, moving 16s: `[0,2]` and `[4,4]`.
- B, moving 16 → 64: `[0,4]` and `[4,1]`.
- C, fixed cells: `[0,5]` and `[4,5]`.

No objective has a legal completing chain on the initial board. This was
checked by visiting every legal chain prefix rooted at the six endpoints
(34 prefixes). The same check detects immediate completions on the original
board, providing a known-bad control for this layout requirement. The check
does not claim optimality, difficulty or freedom from later shortcuts.

The baseline remains build-and-harvest (PDL-008), including the owner's ability
to read an obvious missing value in a nearly complete ladder (PDL-012).
This revision targets missing spatial connections, not a claim that building
values is a new strategy. Owner judgment is still required.

## Checked routes — spoilers

[witnesses.json](witnesses.json) retains two legal five-move solutions with
orders A → B → C and B → C → A. Both select only initial tiles or values
built from them; no refill tile is selected.

One prepares the middle 16 bridge for A, then uses the resulting gravity
changes to prepare B. The other solves B first, completes C along the bottom,
and builds A's connection after its endpoints have fallen. C's fixed positions
remain on the bottom row while A/B marks move with their tiles. These are
examples, not exhaustive solutions or a prescribed order.

## Verification and limits

- Both witnesses replay to all goals complete; initial-tile origin checks pass.
- Every pair spans four columns; exhaustive opening scan finds no goal chain.
- The original three witnesses still win after adding the layout factory.
- Actual shared HTML/app script with a DOM stand-in exercises both routes,
  live sum, preview without commitment, completion, undo and restart.
- Actual served core/model scripts match local replay. Separately labeled
  temporary HTTP captures match both wins; wrong identities are rejected.
  QA capture directory: `/private/tmp/connections-spaced-qa-u1Ff6f`.
- All four existing server identities were checked unchanged.
- Existing scoped tests, syntax and whitespace checks pass.

Revised rules identity:
`371b5eb801ec76ff64c862a51f9332dc452783f5799e7aef23748199a18c77e3`.

No browser access was attempted: permission for inspecting Chrome remains
unanswered after the preceding risk-review block. Visual rendering and native
mouse/touch are unverified; UI behavior was checked through the DOM stand-in.
No shipped game files, scoring rules or experiments were changed.

Await owner play. Do not infer enjoyment or adequate challenge from distance
or the authored move count alone.
