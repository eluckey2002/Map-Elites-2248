# Delivery · Pair Drop

A second Delivery board, prepared on 2026-10-01 after the owner identified
planning dependencies as the enjoyable part of the first board. This is a
local playtest, not an accepted final level or a difficulty claim.

Play at http://127.0.0.1:8275. Start from the worktree root with:

```sh
node prototypes/delivery-pair-drop/serve.js
```

The original trio remains at port 8274. This process has its own rules instance,
identity and `sessions/` directory. It does not replace or restart that server.
The live chain sum, preview, undo and deterministic restart are shared.

## Design intent

The owner corrected the initial preference report: Delivery is the clear
winner; Feeder Choice remains undecided because it had not initially been
played; Gates did not require a meaningful decision. Do not treat Feeder
Choice as endorsed. The owner then explained Delivery's appeal:

> in delivery you have to plan and make sure that there is the correct path to move a tile value so something else can moce. so yes it was fun

This is owner-report evidence from the design conversation, not a reconstruction
of a specific saved move sequence. The existing baseline is build-and-harvest
(PDL-008 in `../PLAYTEST-DECISION-LEDGER.md`). The new board asks where a built
value should land and which existing tile will fall alongside it. It does not
claim that building matching values is itself new to this owner.

Rules are unchanged: chains, sums, gravity and parcel delivery work as before.
The eight-move allowance matches the first Delivery board. There are no new
blockers, timers, consumables, scoring bonuses or hidden rules.

## Concrete decision and feasibility — spoilers

Coordinates are zero-based `[column,row]`. The authored opening places a 64
at `[0,1]`, two 16s beneath it, two possible 32 endpoints at `[1,2]` and `[1,3]`,
and 128 obstructions at `[2,4]` and `[3,4]`.

Both `[[0,2],[0,3],[1,2]]` and `[[0,2],[0,3],[1,3]]` make a 64 and award the
same points. Both remove two supports and lower the existing 64 to `[0,3]`.
Ending at `[1,3]` puts the new 64 beside it in the useful orientation. Ending
at `[1,2]` leaves the pair unable to take the same immediate route through
the 128s. This contrast is directly tested, not a prediction about which move
the owner will choose, and does not prove the higher endpoint is unrecoverable.

The checked witness is:

1. Build and align: `[[0,2],[0,3],[1,3]]`.
2. Lower the parcel: `[[2,3],[2,2],[3,1]]`.
3. Use the pair to clear the obstruction, ending outside the shaft:
   `[[0,3],[1,3],[2,4],[3,4]]`.
4. Clear the final supports: `[[2,5],[1,5],[0,5]]`.

The parcel is delivered in four moves. This is one legal solution, not a proof
of optimality, exclusivity, human difficulty or enjoyment. It also does not
establish that the four actions must be taken in this order.

## Verification and boundary

```sh
node --test prototypes/archetype-trio/app.test.js prototypes/archetype-trio/model.test.js prototypes/archetype-trio/serve.test.js prototypes/delivery-pair-drop/model.test.js prototypes/delivery-pair-drop/serve.test.js
```

Nineteen checks pass. The original fourteen passed before implementation and
continue to pass. New checks cover the endpoint contrast, winning replay/undo,
non-mutation of the original board, shared live-sum UI and actual HTTP capture.
The HTTP check runs the browser-served core/model scripts and compares their
winning state with the server's saved replay. Cross-submitting the original
and variant identities is rejected. Temporary test captures are removed.

New model tests were written before the variant existed and initially failed
with a missing-module error; this is not a claimed behavioral red. The original
suite supplied the pre-change characterization of the shared implementation.
Syntax checks and whitespace checks pass; no lint/typecheck is configured.

The rules factory and server accept a separate level set so the same mechanics,
UI and capture code can serve both boards without a copied gameplay engine.
This session's reuse/quality/efficiency pass retained that small shared boundary;
no additional abstractions were added. Both running servers respond, and the
original server retained its pre-work rules identity. No browser actions were
taken while the owner was actively playing: final visual/native-touch checking
of this variant remains unverified. This is a local playtest handoff, not a
production release; production code review/PR delivery remain outside it.

## Next owner checkpoint

Does arranging the falling partner create another satisfying dependency, or
does this feel like the same puzzle with different numbers? Preserve it only
if the placement and gravity interaction is worth thinking through. If it is
too obvious, do not rescue it merely by cutting moves or adding obstructions.

Authoring lesson to test: give equally valuable constructions different future
reach, make the useful alignment visible in preview, and provide enough spare
moves for recovery. The parcel should give those choices a purpose throughout
the level, not disappear as soon as a long ordinary chain is drawn.
