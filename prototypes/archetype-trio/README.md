# Three archetype playtests

First playable checkpoint for Gates, Delivery and Feeder Choice. These are
isolated design prototypes, not accepted level families or experiment evidence.
The owner delegated selection with “Honestly any of them sound fine”; the
recommended trio was selected under the [approach plan](../../docs/plans/2026-10-01-level-archetypes-approach.md).

## Play

From this worktree's root:

```sh
node prototypes/archetype-trio/serve.js
```

Open http://127.0.0.1:8274. Try Gates, then Delivery, then Feeder Choice.
Tap consecutive tiles or drag a path; preview before merging. Undo freely.
The live **Chain sum** above the board updates from the first selected tile;
it is the sum of the tiles, not the points awarded for merging.
Restarts use the same opening and deterministic refill. Each new board or
restart starts a separate saved play. Moves, undo and feedback are stored
locally; nothing is sent to an external service.

The question for this checkpoint: **Which mechanic changed a decision you
would otherwise make, and was that change interesting?** Keep/revise/retire is
more useful than a numerical rating. A win alone does not answer the question.

## Decisions being explored

The baseline is the owner's build-and-harvest play, not greedy-longest-chain.
Prior lessons in [the playtest ledger](../PLAYTEST-DECISION-LEDGER.md) include
Cash or Compound feeling like ordinary strategy (PDL-008), bonus/dock rules not
changing decisions (PDL-009/010), and opening patterns vanishing after refill
(PDL-005). Bank and Break supplies one limited positive connectivity precedent
(PDL-002), not proof that every gate is interesting.

Coordinates below are zero-based `[column,row]`, matching `witnesses.json`.

### Gates — timing a change in connections

The lower passage initially connects five 128s; the upper passage holds a 512
behind a closed gate. Ending on `[1,2]` exchanges the open and closed passages.
A closed gate holds its tile and blocks chains and gravity. Its location and
the switch remain after refill.

Concrete contrast: harvest `[2,4]` through `[6,4]` before switching, or switch
first with `[[0,2],[0,3],[1,2]]` and lose that continuous lower-row chain while
opening the upper passage. A checked route harvests the lower row, switches,
then joins the upper 512s: 3 moves, 3,596 points, against 3,300 in 6 moves.

Hypothesis: access timing adds a spatial commitment to build-and-harvest. Risk:
the opening is simply an obvious order-of-operations puzzle. The winning route
proves feasibility, not necessity, difficulty, or lasting depth.

### Delivery — choosing what survives beneath the parcel

The parcel cannot join chains and must fall to the bottom of column 3. Clearing
the same three 4s at `[2,3]`, `[2,2]`, `[1,2]` with the endpoint outside the
shaft lets the parcel fall farther than reversing that path and leaving the
merged 12 in its way. Both consequences are directly tested.

A 64 farther down the shaft prevents the parcel from falling straight through
the opening. A checked four-move route builds another 64 outside the shaft,
uses it to clear the obstruction, then clears the final support. The parcel
remains the objective throughout refill; score is secondary.

Hypothesis: the objective makes endpoint and gravity planning feel different
from ordinary harvesting. Risk: experienced play already does this, or carrying
the parcel feels like cleanup rather than a new decision.

### Feeder Choice — allocating the next building material

Columns 2 and 4 are supplied by visible cyclic queues. Swap their assignments
before a merge at no move cost. Unused values remain in their source queue;
the other columns receive deterministic ordinary refill.

Concrete contrast: clear `[[1,0],[1,1],[2,1]]`. Keeping the assignments feeds
two 2s into column 2; swapping feeds two 8s there. The first allocation enables
`[[0,1],[1,1],[1,0],[2,0]]`; the second enables
`[[1,0],[1,1],[2,1],[2,2],[2,3],[3,3]]`. Each follow-up is illegal under the
other allocation. Both contrasts and queue consumption are tested.

A checked five-move route reaches 1,880 against a target of 1,700 in 10 moves.
It never swaps: swapping is an optional planning tool, not an artificial key
required to win. Hypothesis: allocating material extends build-and-harvest
planning. Risk: one queue is nearly always preferable or the extra control
adds bookkeeping without a worthwhile choice.

## Capture and verification

```sh
node --test prototypes/archetype-trio/app.test.js prototypes/archetype-trio/model.test.js prototypes/archetype-trio/serve.test.js
```

Fourteen checks pass after the live-sum repair. Three execute the actual UI
script with a minimal DOM stand-in to check sums during selection, shortening,
preview and reset actions; they do not replace visual/browser testing.
The original eleven checks cover legal winning routes for all
three authored boards, terminal rejection, gate and parcel restrictions,
endpoint contrasts, queue-specific follow-up chains, input immutability,
deterministic replay and undo. The HTTP test starts the actual server, writes
a real session file, reads it back, and verifies authoritative replay. It also
submits illegal moves and stale model identities and confirms rejection; a
lower revision cannot overwrite a newer saved play.

Browser smoke check in native Chrome: all three boards render; Gates tile
selection enables preview/merge, preview shows 576 without committing, merge
records that score, and undo returns to 0 with all 6 moves. Saved browser
actions are checked again from disk. Desktop screenshots and a narrow desktop
window were inspected. **Phone emulation/touch and full UI winning routes are
not verified.** An external browser change interrupted device-mode setup;
Chrome was left available to the owner. Rule-level winning routes are not
represented as end-to-end browser tests.

The code-simplification pass used reuse, quality and efficiency rubrics inline,
per the project's sequential-review mapping. No behavior-preserving changes
were warranted (reuse 0, quality 0, efficiency 0). Shared core chain legality,
scoring and random generation are reused; special gravity and refill stay
local because their behavior differs. Syntax and whitespace checks pass.
This dependency-free repo has no configured lint/typecheck for this prototype.
No production release review or full repository suite was run at this checkpoint.

The local `sessions/` directory is gitignored. Records include a hash of the
core and prototype rules, exact actions, feedback, and a server-recomputed final
state. The download button provides a client-side copy. A failed save is visible;
closing the tab while a save is pending can still lose that pending update.
Capture accepts at most 300 actions per play. Reload starts a new play rather
than resuming the previous one. QA plays are not owner feedback or evidence.

## Boundary and next step

`solver/engine.js`, `src/game.js`, shipped levels and policy research are
unchanged. No mechanics are promoted to the game. After owner play, refine
the retained concepts, add a contrasting variation per family and write their
authoring guidance. Do not tune indefinitely merely to rescue a rejected idea.
