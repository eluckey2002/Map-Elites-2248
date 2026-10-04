# Delivery — authoring guide

Version 1, 2026-10-02. Practical design guidance drawn from two retained
prototypes and earlier revisions. Recommendations below are hypotheses for
future layouts, not established difficulty rules or production adoption.

## Purpose and signature choice

Teach the player to shape the board around a parcel's descent. A good move
must consider both the space it opens and the useful value it leaves behind.
The signature question is: **where and when should I keep a merged tile so
the parcel can move now, or another connection can become possible later?**

Keep the familiar core: the last selected tile becomes the sum, then gravity
acts. The parcel cannot join a chain and delivers at the bottom of its column.
Start with one parcel and no additional score quota. The retained boards use
eight moves and refills through 128; preserve those settings for an initial
comparison rather than treating them as a proven optimum.

The owner's baseline already builds tiles and harvests them later (PDL-008).
Delivery must create a choice *within* that plan. Merely asking for a setup,
a large survivor or a longer route does not establish a distinct experience.

## What the plays support

- **Pair Drop / Crossroads:** Delivery interested the owner, but easy value
  ladders made construction obvious. Several winning paths did not by themselves
  make an interesting choice (PDL-011–012).
- **Staggered:** The owner called it much better and non-obvious, reported a
  first-attempt loss and said that helped planning (PDL-019). Which move caused
  that learning was not established.
- **Landing:** The owner affirmed considering endpoints, the resulting
  placement affecting the next move, and that choice feeling satisfying
  (PDL-021). Retry learning and the exact played route were not established.

These are reports from this owner on these boards. Feedback followed prompts
about the intended choice, not a blind comparison. The boards' checked routes
establish feasibility; they do not establish enjoyment or general difficulty.
See the [playtest ledger](../../../prototypes/PLAYTEST-DECISION-LEDGER.md).

## Two reusable decision scenes

**Clearing order — Staggered.** A useful build and a bottom clear are both
available. Clearing first advances the parcel but changes where later partners
align. The player must reconsider the preparation order; a recovery remains
possible. Reuse this scene when the lesson is anticipating a falling partner.
[Exact scene and routes](../../../prototypes/delivery-sequence/README.md).

**Survivor placement — Landing.** The same tiles and sum can end inside or
outside the shaft. One placement advances the parcel farther immediately;
the other keeps the survivor closer to a future connection. Different support
clears make both placements useful. Reuse this scene when the lesson is choosing
an endpoint for its next position, not its immediate points.
[Exact scene and routes](../../../prototypes/delivery-bridge/README.md).

These are variations of one Delivery family, not two additional archetypes.
Neither should become a mandatory sequence the player must imitate.

## Build the decision before the full level

1. **Name both benefits.** Write what each plausible action gains and spends.
   “More parcel progress” versus “a better-positioned future partner” is a
   useful contrast. “Correct move” versus “mistake” is not enough to author from.
2. **Construct a small, visible scene.** Place the parcel, its supports, a
   possible survivor and its later partner. Compare equal-sum actions where
   possible so placement has a consequence independent of points.
3. **Follow gravity exactly.** Inspect the next board, including diagonal
   adjacency. A tile's starting column, final selected cell and settled height
   are different parts of the plan. Show which connection becomes available
   or disappears, not just how far the parcel falls.
4. **Give the alternative a continuation.** Both choices should have credible
   uses. Look for a repair after a plausible weak move; losing need not be
   required for the lesson. A stored repair proves availability, not that the
   player must spend an extra move.
5. **Add surrounding material deliberately.** Check whether another obvious
   sweep bypasses the scene, or refill makes its consequences irrelevant.
   Keep at least one checked route using opening/built material so the design
   does not depend entirely on a fortunate new tile.
6. **Hand it over without the route.** Describe the objective and controls.
   Let the player discover the connection. Ask what drove their move before
   explaining the designer's intended line.

## Variation knobs and their risks

- **Support geometry:** shift a support or partner's height to change which
  clear creates adjacency. Risk: a connection disappears without a readable
  reason. Check the settled board, not only the opening.
- **Partner placement and values:** create a real alignment gap. Risk: another
  nearly completed doubling ladder makes the missing construction obvious,
  as in PDL-012. Distance alone does not establish challenge.
- **Material spread / refill pool:** change how many incidental connections
  are available. The wider pool was an owner proposal, not proof that larger
  values are always harder. Change one aspect at a time when attribution matters.
- **Move allowance:** leave room to compare plans and recover before adding
  pressure. Reducing moves solely to force a loss does not improve the choice.
- **Additional objectives:** defer multiple parcels, quotas or special blockers
  until one readable Delivery decision works. Extra conditions can obscure it.

Keep Staggered and Landing unchanged as references while trying new variations.

## Review and play checkpoint

Watch for automatic delivery during ordinary harvesting, repeated shaft
cleanup with no endpoint choice, an obvious value ladder, or a future benefit
that depends on unseen luck. More legal paths and more moves are not substitutes
for competing consequences. A short win can still be satisfying.

Use existing rule/replay checks to establish the intended scene and feasible
routes. A bounded shortcut search must report exhaustion as unknown, not absence;
its result applies only to the searched opening. Do not introduce a difficulty
rating or stronger-bot claim from these checks.

Ask the player: **What affected where you ended or what you cleared first?**
Then: **Was that satisfying to work through?** If a plan failed, ask what became
clear afterward, without assuming there was a loss or useful learning.
Record exact feedback separately from interpretation. Keep/revise/retire the
layout from play; the full 3–5-family collection still needs owner acceptance.
