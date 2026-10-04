# Delivery · Staggered

Owner-play update, 2026-10-02: the owner called this much better and not obvious,
reported losing the first attempt, and said that helped planning. PDL-019 in
the [playtest ledger](../PLAYTEST-DECISION-LEDGER.md) records the wording and
limits. Working disposition: retain this board as a Delivery reference. The
pre-play design/checkpoint below is historical; no final family acceptance or
matched-replay claim follows from this conversation feedback.

Play: **http://127.0.0.1:8282**. If that server is stopped, run from the worktree
root: `node prototypes/delivery-sequence/serve.js`. Do not start another process
on an occupied port. `DELIVERY_PORT` can select an unused port for a restored copy.

One bounded layout playtest, not an accepted level or a new archetype. The
question is whether the order of clearing supports creates a worthwhile decision
inside familiar build-and-harvest play. The owner authorized this Delivery cycle
after consolidation. None of the earlier games or shared runtime files changed.

## What changed

The shaft's values are staggered rather than forming the earlier almost-complete
ascending ladder. There is a useful setup that leaves the parcel where it is,
and an immediately available bottom clear that advances it but changes later
alignment. Both can lead to delivery; this is not a forced one-route puzzle.

The layout uses seed 624, the existing eight-move allowance, ordinary chain and
gravity rules, and the existing parcel objective. Refills are uniformly drawn
from 2, 4, 8, 16, 32, 64, 128, applying the owner's earlier wider-pool suggestion
to this variation. Earlier Delivery games retain their smaller pool. Because
layout and pool both differ, this play cannot isolate which causes a reaction.

Live sum, preview, undo and local replay capture reuse the existing UI/server.
Reload/restart begins a new play; there is no Connection Run-style resume here.
Feedback and Download this play remain available. Owner captures go to ignored
`sessions/`; verification captures use temporary directories only.

## Design scene — spoilers

Baseline: the owner's normal strategy already builds values for later harvest
(PDL-008). This is a choice within that strategy, not a claim that building is
new or that a longest-chain bot models the owner. PDL-012 showed that multiple
construction routes need not create a meaningful choice. Human play must still
decide whether this layout does better.

Coordinates below are zero-based `[column,row]`.

- Two adjacent 16s at `[1,2]` and `[1,3]` can create 64 by ending on the 32 at
  `[0,4]` or `[0,1]`. Both score the same and leave the parcel at row 1.
  The lower endpoint aligns the created 64 with the original 64 falling to
  `[1,3]`. A checked chain can then clear the shaft's 128 and end outside it.
  The upper endpoint does not permit that same immediate chain.
- Alternatively, the bottom `4 → 4 → 8` advances the parcel immediately.
  Building the lower 64 afterward leaves two 64s at row 4, beside the shaft's
  128. However, the outside 128 is still at `[3,2]`: the final hop no longer
  connects. This particular preparation must change; the board is not declared
  unwinnable. A checked recovery delivers using only existing material.

[witnesses.json](witnesses.json) contains three-, four- and five-move routes for
the lower placement, upper placement and bottom-first approach. Their selected
tiles all originate in the opening or merges of opening material, not refills.
The four/five-move witnesses are not proofs those continuations need that many
moves. No route is shown on the play page.

## Checks and limits

25 scoped tests pass across this variant, the original trio and Pair Drop.
The new tests read the actual model and page. They cover the placement/timing
contrast, all three routes, undo/replay, rule isolation, browser-source parity,
real HTTP capture and rejection of invalid/mismatched saves.

An opening enumeration includes normal refills and finds no one/two-move win
on this exact board. A known easy board is found by the same check; forcing its
aggregate node bound to exhaust fails rather than reporting absence. The
three-move witness therefore establishes a short solution; none of this measures
human difficulty or claims the puzzle cannot feel obvious. The helper is a local
sanity check, not a new general bot or a reportable experiment.

The actual shared UI was driven with this page/model in its existing DOM stand-in:
load, sum, preview, merge to completion, undo and restart passed. Native browser,
screenshot, console and touch QA remain unverified; prior browser access was
unavailable/not approved and was not retried or bypassed. Existing server
identities on 8274–8281 were checked unchanged. Syntax/whitespace checks pass.

A low-cost read-only review found no runtime/capture/route-tagging issue and
flagged the short-search work bound; it now applies across the whole check.
Owner enjoyment and acceptance remain open. No main merge or remote publication.

## Next checkpoint

Did you compare what would fall before deciding what to clear? Or did another
obvious construction make the choice automatic? A short win is useful feedback,
not a defect by itself. Do not reduce the move allowance merely to manufacture
difficulty. Task: DELIVERY-SEQUENCE-1; reviewer: owner.
