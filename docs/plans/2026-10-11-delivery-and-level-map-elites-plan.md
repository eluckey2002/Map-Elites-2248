# Plan: ship Delivery, resume level MAP-Elites (2026-10-11)

Status: approved by the owner on 2026-10-11 ("Both fresh run").

You said "yes and yes" to:
1. Shipping Delivery as the second puzzle type.
2. Resuming the level MAP-Elites work.

## Top 3 assumptions
1. "Ship Delivery" means a small finite pack inside the original app, built the same way as the Connections pack. It is not an endless mode and not part of the 58-level campaign.
2. The pack starts from the two Delivery boards you liked, Staggered (PDL-019) and Landing (PDL-021), plus one new board.
3. "Resume MAP-Elites" means getting a working level-search on `main` that produces boards you can play. It does not mean preserving the September run's exact record IDs.

## Push-back on part 2: is resuming the old branch the best idea?
The old branch `feat/family-board-map-elites-20260919` is blocked for a bookkeeping reason, not a design one:
- Its experiment IDs (RESULT-0044–0047) collide with records on main.
- The rulebook requires a new "frozen renumbering" mechanism in the experiment gate before it can land (BL-0023, criterion 7).
- That mechanism is a change to a 1,362-line gate. It mostly preserves history; the game gains nothing from it.
- The branch is also 14 commits behind a main that has moved a lot. Its pinned bot and engine hashes have almost certainly drifted, so its archive would not replay as-is. This is inferred; I haven't checked it yet.

**Recommended instead: "fresh run".** BL-0023 criterion 4 already allows the stranded records to be "explicitly dropped".
- Record that drop.
- Port the *code* (board archive, axes, verifier) onto current main under new, reserved IDs.
- Re-run the search there, adding a third axis: "your usual strategy is the wrong move on this board". This lines the search up with your own playtest rule.

This gets you playable boards sooner and skips the gate surgery. The cost is that the September result is cited as history only, not carried forward as a live record.

## Part 1: Delivery pack (atomic steps)
1. Record your decision to ship Delivery (DECISION-0013, plus a PDL entry).
2. Reserve an ID for the pack's verification record.
3. Move the Delivery rules from `prototypes/delivery-sequence` and `prototypes/delivery-bridge` (their `model.js` files) into one `src/delivery-rules.js`. Keep the existing model tests and make them pass against the new file.
4. Add `src/delivery-levels.js` with Staggered, Landing and one new third board.
5. Add `src/delivery-game.js`, the play screen, reusing the Connections layout. The next goal is shown and Preview sits next to the board, applying the review's lessons.
6. Add a `?mode=delivery` route and a "Delivery" entry in Level Select (`src/game-library.js`, `src/index.html`).
7. Write tests:
   - every authored route wins;
   - retries are identical;
   - the existing score levels and Connections pack are unchanged.
8. Browser check on desktop and mobile widths, with screenshots.
9. Update the ledger and CURRENT.md, then open a draft PR.
10. You play all three boards; that playtest is the acceptance.

Steps 3–6 avoid touching `src/game.js`. That keeps the HUMAN-PILOT-0002 receipt intact and avoids conflict with the "Bug fix push" thread, which is changing `game.js` now. I'll still rebase onto that thread's PR once it merges.

## Part 2: Level MAP-Elites, fresh run (atomic steps)
1. Record the drop of the stranded September IDs (BL-0023 criterion 4) and your decision to resume (DECISION-0014).
2. Reserve new RESULT IDs.
3. Register the experiment protocol *before* any run (rulebook requirement). The protocol covers:
   - the axes: plan breadth, harvest payoff, and "baseline regret";
   - seeds;
   - archive size;
   - what counts as success: at least 5 cells filled with boards the bot can win and that differ on the new axis.
4. Port the board-archive code from the branch: `solver/board-map-elites*.js` and `verify-board-map-elites.js`. Pin it to the current bot and engine.
5. Add the baseline-regret measure, using your captured strategy as the baseline per the rulebook. Write a test on a known board.
6. Dry run with a small budget, then the registered run.
7. Write the result record, independent verifier output, and ledger + CURRENT.md updates. Open a draft PR.
8. Export the top 5 boards so you can play them in the app. Your playtest is the acceptance.

## In scope
- One Delivery pack of 3 boards in the original app.
- A fresh level-search run on main with a new axis.
- Records, tests and draft PRs for both.

## Not in scope
- Delivery boards inside the 58-level campaign.
- An endless Delivery mode.
- New Delivery mechanics.
- Building the BL-0023 renumbering mechanism (only if you reject the fresh-run recommendation).
- Retuning the existing 58 levels.
- Changes to `src/game.js`.
- Merging either PR without your playtest and the Codex review.

## Rigour
**High.** Both parts land through the experiment gate. Part 2 needs a preregistered protocol committed before the run, and an independent check before any record is accepted. In practice:
- each step lands with a test;
- protocols are committed first;
- no record self-accepts;
- a draft PR at each milestone.

## Order
Part 1 first, because it is mostly self-contained and gives you something to play soonest. Part 2 starts in parallel once the protocol is approved.
