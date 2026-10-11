# DELIVERY-PACK-1 — Delivery pack in the original game

Task: DELIVERY-PACK-1 · reviewer: owner · ledger: DECISION-0013 · playtest ledger: PDL-036

## Authorization

From the 2026-10-11 project thread, after a repository review:
- Asked "Should Delivery ship as the second puzzle type?", the owner answered "Yes and yes" (the second yes resumed level MAP-Elites, tracked separately).
- The plan ([2026-10-11 plan](../../../plans/2026-10-11-delivery-and-level-map-elites-plan.md), Part 1) was approved with "Both fresh run".

## What shipped

| # | Board | Prototype | Seed | Moves | Refills | Teaches |
|---|---|---|---|---|---|---|
| 1 | Pair Drop | `prototypes/delivery-pair-drop` | 416 | 8 | 2/4/8 | make room for the right partner |
| 2 | Staggered | `prototypes/delivery-sequence` | 624 | 8 | 2–128 | decide what should fall first |
| 3 | Landing | `prototypes/delivery-bridge` | 728 | 8 | 2–128 | choose where the merged value stays |

- Rules: `src/delivery-rules.js`, a Delivery-only port of `prototypes/archetype-trio/model.js`.
- Boards: `src/delivery-levels.js`, copied unchanged from the prototypes.
- Screen: `src/delivery-game.js` and `src/delivery-style.css`, reusing the Connections layout.
- Route: `?mode=delivery` in `src/game-library.js`, with a "Delivery puzzles" button in Level Select (`src/index.html`).
- `src/game.js` and `solver/engine.js` are untouched, so the HUMAN-PILOT-0002 and candidate receipts are unaffected.

Applied from the 2026-10-11 Connections review:
- Merge, Preview and Clear sit directly above the board. On a 1280×800 screen the whole board, its controls and the exit marker fit without scrolling.
- Retry asks before discarding moves.
- Enter is not captured.
- The result links straight to the next board.

**Change from the plan:** the plan proposed one *new* third board. Instead, the pack uses the owner-played Pair Drop as its opening board. It is the easiest of the three (PDL-011 called it too easy as a test of a decision), which suits a first board, and it adds no unplaytested design.

## Verification

- `solver/tests/deliveryRules.test.js`:
  - the boards equal the prototypes;
  - all 7 authored routes deliver;
  - 25 random legal games per board match the prototype model move for move (grid, score, refills, outcome);
  - retry, undo and preview behave as expected;
  - invalid input is rejected.
- `solver/tests/deliveryGame.test.js`: the actual page plays every authored route to a win without changing level progress. It also covers preview and undo, the retry confirmation, next-board links, and router script loading.
- Existing `gameLibrary`, `connectionGame` and `connectionCapture` tests still pass.
- Chromium against a scratch copy of `tools/play-server.js`: all three boards won at 1280×800 and 390×844; the first mobile chain used drag. There was no horizontal scroll and no console errors.

## Limits

- Authored routes prove each board can be won. They are not a difficulty or enjoyment result.
- The mode needs `tools/play-server.js` running, because it shares the generated `connection-core.js` with Connections.
- Play is not captured to the local server yet.
- The owner's in-app playtest is the acceptance check and is still open.
