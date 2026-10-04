# Delivery · Crossroads

Third Delivery playtest, 2026-10-01. Question: do two plausible places to leave
the same value lead to different plans worth thinking through? This is a
throwaway layout, not a new mechanic, accepted level, or difficulty result.

Play at http://127.0.0.1:8276. From the worktree root:

```sh
node prototypes/delivery-crossroads/serve.js
```

The original trio (8274) and Pair Drop (8275) remain running unchanged. This
board has its own rules instance, identity and session directory. Shared rules,
UI and capture implementation are unchanged. Live sum, preview, undo and the
eight-move allowance are retained. Existing play capture is reused; no new
prototype framework, dependencies or persistent service were introduced.

## What led here

The owner identified Delivery as the clear winner because moving one value
to make room for another required planning. Feeder Choice remains undecided;
Gates did not create a real decision. After Pair Drop the owner said:

> Ya, I think the puzzle layout made it a little easy for me but it has the right idea. or i just had a lucky first move

The saved Pair Drop session `f268a423-e38c-4cc6-a72e-f9ac77f11254` replays to a
three-move delivery, versus the four-move authored witness. Its second chain
uses one newly spawned 4 and clears multiple dependencies together. That is a
specific shortcut, not proof of optimality or general ease. The owner agreed
with refining placement consequences and continued playing while this board
was prepared. See [the playtest ledger](../PLAYTEST-DECISION-LEDGER.md#pdl-011--delivery-pair-drop).

## Intended decision — spoilers

The captured baseline is **build-and-harvest**, not longest-chain greed
(PDL-008). Building a matching value is already normal play. This board asks
where that value should remain relative to the parcel and its existing partner;
it does not claim to invent or defeat the owner's baseline strategy.

Coordinates are zero-based `[column,row]`. Initially the two 16s at `[1,4]`
and `[2,3]` can end on either 32 at `[1,3]` or `[2,4]`. Both chains sum to 64,
award the same points and lower the parcel to row 2. Their consequences differ:

- End left: the new 64 falls to `[1,4]`, beside the old 64 at `[0,5]`. Those
  two can immediately clear the bottom 128, ending on the 256 outside the
  shaft. The 32 still beneath the parcel then needs another setup chain.
- End in the shaft: the new 64 stays at `[2,4]`, too far from the old left-hand
  64 for that harvest. A reserve pair of 16s can build a bridge at `[1,5]`;
  the subsequent harvest clears both the shaft's 64 and its bottom 128.

Both routes have checked four-move witnesses in [witnesses.json](witnesses.json).
Neither is asserted to be uniquely correct or faster. Each uses only initial
tiles or values built from initial tiles; no selected tile is a refill. This
removes refill luck from these two authored solutions, not from every possible
play. Other shortcuts may exist. The deciding evidence is still owner play.

## Verification performed

- Replayed both witness files against the actual model: parcel delivered.
- Tagged initial tiles in a scratch state and checked that every selected tile
  in both routes retained that origin. New refill tiles had no tag.
- Checked equal opening scores/sums and the left-hand harvest's legality after
  one opening versus illegality after the other.
- Exercised the actual HTML and shared app script through the existing DOM
  stand-in: selection, 64 live sum, preview, merge, both wins, undo and restart.
- Fetched the running page/core/model scripts; executed the served rules and
  compared the resulting state with local replay.
- Used a separate temporary HTTP server and QA-labeled capture directory
  `/private/tmp/delivery-crossroads-qa-79xM86` to verify saved replay equality
  and rejection of a mismatched rules identity. No synthetic play was added
  to the owner's Crossroads sessions.
- All 19 existing scoped tests passed; syntax and whitespace checks passed.
- Both older live servers retained their previously recorded identities.

Crossroads rules identity:
`018cfbf3fad18f3d87cf961693cda6b216891fac4267fe4e96b139e43077b8f1`.

No browser rendering, console, screenshot or native-touch verification is
claimed: the Browser plugin and local Playwright were unavailable, and an
isolated hidden in-app browser returned `Browser is not available: iab`.
The owner's active browser was not controlled. The shared UI was not edited.

## Next checkpoint

Did you actually compare placements and anticipate their consequences, or did
another easy sweep make the choice irrelevant? Preserve alternate solutions;
do not treat finding one as a defect. Revisit the layout if both placements
feel interchangeable or the preparation remains automatic. Do not manufacture
difficulty by cutting the move budget. Await owner judgment; no acceptance,
enjoyment, optimality or population-difficulty claim is made here.
