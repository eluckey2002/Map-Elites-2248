# Connections — three goals, one board

Local playtest at http://127.0.0.1:8277. Start from the worktree root:

```sh
node prototypes/connections/serve.js
```

Question: does completing several connections on the same changing board make
the order and use of shared values worth planning? This prototype is not a
shipped rule change or a claim of difficulty. The Delivery games remain separate.

## Authorization and scope

On 2026-10-01, after the Delivery playtests, the owner proposed fixed-place
and moving-tile connections, including equal-value and increasing-value pairs.
They then proposed requiring several connections per level and asked to try it.
The discussed starting scope was all goals visible, any order, permanent
completion on one shared board. The implementation keeps the ordinary chain,
sum, gravity and refill rules; the new objective and marked-tile restrictions
exist only here. A wider opening/refill value pool remains a separate proposal,
not an adopted rule change.

The producer explicitly announced this first-version convention before building:
unfinished marked tiles move with gravity but can only be consumed as the two
ends of their own completed connection. This is a prototype assumption, not
independent owner acceptance of endpoint protection. Revisit it after play.

## Rules

- A: join the marked 16s, A1 and A2, in either direction.
- B: start at B1 (16), finish at B2 (64).
- C: start and finish at the fixed C1/C2 cells, in either direction. Their
  contents can change; their coordinates do not.
- Endpoints must be the actual first and last tiles of one legal chain.
  Passing through both fixed places does not complete C.
- A/B labels belong to tiles and follow gravity. Until their goal is complete,
  they cannot be used in unrelated chains or as interior tiles. Upon completion,
  their labels are removed and the merged survivor is ordinary material.
- A completed goal stays complete after further merges. Undo restores the
  preceding board, marks, goal state, moves and refill cursor.
- Finish all three goals within ten moves; score is informational.

The live chain sum, preview and undo are retained. Preview shows projected
completion with a PREVIEW label; it does not commit anything. The starting
board and refill seed 624 repeat on restart. Capture uses the existing local
replay-checked server with a separate session directory and identity.

## Concrete interaction — spoilers

The owner baseline is build-and-harvest (PDL-008), not longest-chain greed.
Crossroads showed that a visible near-complete value ladder is easy for this
owner to recognize and repair; see PDL-012. This prototype changes which chain
counts, not simply where an obvious finishing value is missing.

At the opening, A can use the unmarked 16 at zero-based `[1,4]` between its two
marked 16s. B can use that same 16 before stepping through 32 to its marked 64.
Completing either removes that shared tile, so the other's original chain is
no longer legal. Ordinary building remains useful, but where its result goes
now depends on the remaining marked endpoints. This does not predict what the
owner will choose or prove that the remaining task is difficult.

There is also a positive interaction: completing C with four 4s creates a 16
at `[3,3]`. After A uses the original shared 16, B can route through C's built
16 instead. This gives a checked three-move solution, intentionally retained
rather than blocked to inflate the move count.

[witnesses.json](witnesses.json) includes that route and two four-move routes
with different objective orders. These are feasibility examples, not optimality
proofs or a list of all solutions. All three can be executed without selecting
refill tiles; authored tile-origin tracking checked the two four-move routes.

## Checks performed

- Exact goal completion, protection against consuming marked endpoints in an
  unrelated chain, and non-completion for fixed endpoints used only internally.
- Moving B1 falls after clearing underneath it; C's coordinate pair stays fixed.
- Both original shared-16 chains become illegal after the other consumes it.
- Winning routes, replay equality, undo and rejection of play after completion.
- Actual HTML/app script with a DOM stand-in: all goal cards, live sum, preview,
  completion, undo, restart, incomplete-goal merge disabled, invalid extension
  message. This is not a browser layout or native-input check.
- Live browser-served rules match local replay for all three witnesses. Separate
  QA-only HTTP captures match the same final states; wrong identity and
  wrong/missing level are rejected. QA records are isolated at
  `/private/tmp/connections-qa-atInnV`, not mixed with owner play.
- All 19 existing scoped prototype tests pass. Syntax and whitespace pass.
- Ports 8274, 8275 and 8276 still return their previously recorded identities.

Current rules identity:
`de9d2475555f66d26bdd6602b5e3091215ac056600eac1a553ff954f786d7906`.

Browser plugin/local Playwright are unavailable in this environment; isolated
Chrome session creation failed. Native Chrome inspection was blocked by risk
review because it could expose active tabs, and explicit permission was requested.
Until permitted and performed, rendering, browser console and native mouse/touch
behavior remain unverified. Existing browser games were not accessed or reset.

## Owner checkpoint

Does one completed connection affect how you plan another? Are moving labels
versus fixed places readable? Treat a quick, planned solution as evidence about
the interaction, not automatically as a defect. The first-version protection
rule, move allowance and perceived challenge remain open for owner judgment.
