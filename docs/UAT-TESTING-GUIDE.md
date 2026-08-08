# UAT Testing Guide - 2248 Challenge Game

## Overview
This document provides step-by-step instructions for performing User Acceptance Testing (UAT) on the 2248 Challenge game, focusing on the undo functionality and modal behavior.

---

## Prerequisites
- Game is accessible at: `/Users/eluckey/Developer/research/2248-challenge/index.html`
- Browser with Developer Console access (Chrome, Firefox, Safari, Edge)
- Screenshot tool ready

---

## Test Execution Instructions

### PART 1: Automated Testing

1. **Open the game in a browser**
   ```bash
   open /Users/eluckey/Developer/research/2248-challenge/index.html
   ```

2. **Open browser Developer Console**
   - Chrome/Edge: Press `F12` or `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Windows)
   - Firefox: Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - Safari: Enable Developer menu, then `Cmd+Option+C`

3. **Load and run the test script**
   - Open the file: `/Users/eluckey/Developer/research/2248-challenge/uat-test-script.js`
   - Copy the entire contents
   - Paste into browser console
   - Press Enter to execute

4. **Review automated test results**
   - All tests should show `✓ PASS` in green
   - Any `✗ FAIL` in red requires investigation
   - Check the summary at the end

---

### PART 2: Manual Testing with Screenshots

#### Test Case 1: Undo Button Disabled on Fresh Level

**Steps:**
1. Refresh the page (Ctrl+Shift+R or Cmd+Shift+R) to start fresh
2. Observe the game's initial state
3. Locate the "↩ Undo" button at the bottom

**Expected Result:**
- ✓ Undo button appears grayed out/disabled
- ✓ Button cannot be clicked
- ✓ No move history exists

**Screenshot Required:** `01-undo-disabled-initial.png`
- Show entire game interface
- Highlight disabled undo button
- Show score = 0, moves = 0

---

#### Test Case 2: Create a Chain (Make a Move)

**Steps:**
1. On the game grid, find two adjacent tiles with the same number (e.g., two "2" tiles)
2. Click/touch the first tile and drag to the second tile
3. Release to complete the chain

**Expected Result:**
- ✓ Tiles highlight during drag
- ✓ Chain line appears connecting tiles
- ✓ Chain indicator shows: "2 tiles → [sum] × [multiplier] = [points]" in green
- ✓ On release, tiles merge
- ✓ Score increases
- ✓ Moves counter increases by 1
- ✓ New tiles spawn to fill empty spaces

**Screenshot Required:** `02-chain-active.png`
- Show chain being drawn
- Chain indicator visible
- Highlighted tiles

---

#### Test Case 3: Undo Button Enabled After Move

**Steps:**
1. After completing the move from Test Case 2
2. Observe the undo button state

**Expected Result:**
- ✓ Undo button is now enabled (not grayed out)
- ✓ Button is clickable
- ✓ Score shows increased value
- ✓ Moves shows: "24/25" (or similar, depending on level)

**Screenshot Required:** `03-undo-enabled-after-move.png`
- Show enabled undo button
- Show increased score
- Show moves counter updated

---

#### Test Case 4: Click Undo - State Reverts

**Steps:**
1. Record current state:
   - Score value: _______
   - Moves remaining: _______
   - Notable tile positions: _______
2. Click the "↩ Undo" button
3. Observe the changes

**Expected Result:**
- ✓ Score reverts to previous value (should decrease)
- ✓ Moves counter reverts to previous value (should increase)
- ✓ Grid state reverts (tiles return to previous positions)
- ✓ Animation shows tiles returning to original state
- ✓ Undo button becomes disabled again (if this was the only move)

**Screenshot Required:** `04-after-undo-state-reverted.png`
- Show score reverted to 0
- Show moves back to original
- Show undo button disabled again
- Grid appears identical to initial state

---

#### Test Case 5: Multiple Moves and Multiple Undos

**Steps:**
1. Make 3 separate moves (create 3 different chains)
2. Record score after each move: Move1: _____, Move2: _____, Move3: _____
3. Click Undo once
4. Verify score matches Move2
5. Click Undo again
6. Verify score matches Move1
7. Click Undo once more
8. Verify score matches initial state (0)

**Expected Result:**
- ✓ Each undo steps back one move at a time
- ✓ Score decreases with each undo
- ✓ Moves counter increases with each undo
- ✓ Grid state reverts step by step
- ✓ After final undo, button becomes disabled

**Screenshot Required:** `05-multiple-undos.png`
- Show intermediate undo state (after 2nd move)

---

#### Test Case 6: Complete a Level - Modal Appears

**Steps:**
1. Play the game until you reach the target score
   - **Shortcut for testing:** In console, type: `game.score = game.targetScore; game.levelComplete = true; game.showLevelComplete();`
2. Observe the level complete modal

**Expected Result:**
- ✓ "Level Complete!" modal appears
- ✓ Modal shows:
  - Stars earned (1-3 stars)
  - Final score
  - Moves used
  - Best chain length
- ✓ "Next Level →" button visible
- ✓ Background is darkened/blurred
- ✓ Game grid is not interactive

**Screenshot Required:** `06-level-complete-modal.png`
- Show full modal overlay
- Show game grid in background
- Show stats displayed

---

#### Test Case 7: Modal Blocks Interaction - Try to Undo

**Steps:**
1. With the level complete modal still visible
2. Try clicking on the game grid (should not respond)
3. Try clicking the undo button (should not work)
4. Try creating a chain on the grid (should not work)

**Expected Result:**
- ✓ Cannot interact with grid while modal is visible
- ✓ Undo button clicks have no effect
- ✓ Modal remains visible
- ✓ No new moves can be made
- ✓ Only modal buttons are clickable

**Note:** This test confirms modal properly blocks background interaction.

---

#### Test Case 8: Close Modal - Verify Modal Hidden

**Steps:**
1. Click outside the modal content OR
2. Click the "Next Level →" button (will load next level) OR
3. In console, type: `game.hideModal('completeModal');`

**Expected Result:**
- ✓ Modal disappears
- ✓ Modal no longer has 'active' class
- ✓ Background is no longer darkened
- ✓ Game is playable again (if not progressing to next level)

**Screenshot Required:** `07-modal-hidden.png`
- Show game without modal
- Show game is interactive again

---

#### Test Case 9: Game Over Modal

**Steps:**
1. Start a new level
2. Make moves until you run out of moves without reaching target
   - **Shortcut:** In console, type: `game.moves = game.maxMoves; game.checkWinLose();`
3. Observe the game over modal

**Expected Result:**
- ✓ "Game Over" modal appears
- ✓ Modal shows:
  - Reason: "Out of moves!"
  - Final score
  - Target score (not reached)
- ✓ "Try Again" button visible
- ✓ "Level Select" button visible
- ✓ Game grid is not interactive

**Screenshot Required:** `08-game-over-modal.png`
- Show game over modal
- Show stats

---

#### Test Case 10: Undo During Game Over

**Steps:**
1. With game over modal visible
2. Have at least one move in history (made before game over)
3. Try clicking undo button
4. Alternatively, in console: `game.undo();`

**Expected Result:**
- ✓ Undo should work even during game over
- ✓ Modal should be hidden automatically
- ✓ Game state reverts to before the last move
- ✓ gameOver flag is cleared
- ✓ Game becomes playable again
- ✓ Score and moves revert

**Screenshot Required:** `09-undo-from-game-over.png`
- Show game after undo from game over
- Show modal hidden
- Show score reverted

---

#### Test Case 11: Chain Validation - Minimum Chain Length

**Steps:**
1. Load level 11 (has minChain = 3 requirement)
   - In console: `game.loadLevel(11);`
2. Try to create a chain of only 2 tiles
3. Observe the chain indicator

**Expected Result:**
- ✓ Chain indicator shows in RED (invalid)
- ✓ Message shows: "Need 1 more tiles"
- ✓ When you release, chain is not executed
- ✓ No score is added
- ✓ No move is counted
- ✓ Tiles deselect without merging

**Screenshot Required:** `10-invalid-chain-too-short.png`
- Show red chain indicator
- Show "Need X more tiles" message

---

#### Test Case 12: Valid Long Chain

**Steps:**
1. Create a valid chain of 3 or more tiles
   - Start with two matching numbers
   - Extend to adjacent matching or double value tiles
2. Observe chain indicator
3. Release to execute

**Expected Result:**
- ✓ Chain indicator shows in GREEN (valid)
- ✓ Shows calculation: "3 tiles → [sum] × 1.5 = [points]"
- ✓ Chain executes successfully
- ✓ Score increases
- ✓ Multiplier popup may appear (if chain ≥ 3)
- ✓ Undo button becomes enabled

**Screenshot Required:** `11-valid-long-chain.png`
- Show green chain indicator
- Show valid chain calculation
- Show 3+ tiles connected

---

## Additional Edge Cases to Test

### Test Case 13: Undo History Limit
**Steps:**
1. Make 15 moves (more than the 10-move history limit)
2. Click undo repeatedly
3. Count how many times you can undo

**Expected:**
- ✓ Can only undo last 10 moves
- ✓ After 10 undos, button becomes disabled
- ✓ History doesn't grow beyond 10 entries

---

### Test Case 14: Undo After Restart
**Steps:**
1. Make several moves
2. Click "↻ Restart" button
3. Try to undo

**Expected:**
- ✓ Undo button is disabled after restart
- ✓ History is cleared
- ✓ Cannot undo previous game session

---

### Test Case 15: Chain Backtracking
**Steps:**
1. Start creating a chain by dragging across 3 tiles
2. Without releasing, drag back over the 2nd tile
3. Observe behavior

**Expected:**
- ✓ Can backtrack by dragging over previous tile in chain
- ✓ Last tile is removed from chain
- ✓ Chain indicator updates to show reduced chain
- ✓ Removed tile is deselected visually

---

## Test Results Template

| Test Case | Status | Notes | Screenshot |
|-----------|--------|-------|------------|
| 1. Undo disabled initially | ☐ Pass / ☐ Fail | | ☐ Captured |
| 2. Create chain | ☐ Pass / ☐ Fail | | ☐ Captured |
| 3. Undo enabled after move | ☐ Pass / ☐ Fail | | ☐ Captured |
| 4. State reverts on undo | ☐ Pass / ☐ Fail | | ☐ Captured |
| 5. Multiple undos work | ☐ Pass / ☐ Fail | | ☐ Captured |
| 6. Level complete modal | ☐ Pass / ☐ Fail | | ☐ Captured |
| 7. Modal blocks interaction | ☐ Pass / ☐ Fail | | N/A |
| 8. Modal can be hidden | ☐ Pass / ☐ Fail | | ☐ Captured |
| 9. Game over modal | ☐ Pass / ☐ Fail | | ☐ Captured |
| 10. Undo during game over | ☐ Pass / ☐ Fail | | ☐ Captured |
| 11. Chain validation (too short) | ☐ Pass / ☐ Fail | | ☐ Captured |
| 12. Valid long chain | ☐ Pass / ☐ Fail | | ☐ Captured |
| 13. Undo history limit | ☐ Pass / ☐ Fail | | N/A |
| 14. Undo after restart | ☐ Pass / ☐ Fail | | N/A |
| 15. Chain backtracking | ☐ Pass / ☐ Fail | | N/A |

---

## Known Issues / Expected Behavior

1. **Undo button state:**
   - Disabled when: history is empty, currently animating
   - Enabled when: at least one move in history

2. **Modal behavior:**
   - Modals properly block grid interaction when visible
   - Undo can be used to escape game over (by design)
   - Level complete requires clicking "Next Level" or closing modal

3. **Chain validation:**
   - First two tiles must match
   - Subsequent tiles can be same value or double
   - Must meet minimum chain length for the level

4. **History management:**
   - Maximum 10 moves stored
   - Cleared on level load/restart
   - Saved before each valid move execution

---

## Browser Compatibility Testing

Test on multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Performance Notes

- Animations should be smooth (no lag)
- Touch/mouse input should be responsive
- Undo should execute instantly
- Modal transitions should be smooth

---

## Reporting Issues

If any test fails, document:
1. Test case number and name
2. Expected behavior
3. Actual behavior
4. Steps to reproduce
5. Browser and OS version
6. Screenshot or screen recording
7. Console errors (if any)

---

## Success Criteria

UAT passes if:
- ✓ All automated tests pass
- ✓ All manual test cases pass
- ✓ All screenshots captured showing expected behavior
- ✓ No critical bugs found
- ✓ Undo functionality works correctly in all scenarios
- ✓ Modals display and hide properly
- ✓ Game state consistency maintained
