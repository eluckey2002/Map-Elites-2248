# Screenshot Guide for UAT Testing

## How to Take Screenshots on macOS

### Method 1: Built-in Screenshot Tools

#### Entire Screen
- Press: `Cmd + Shift + 3`
- File saved to: Desktop

#### Selected Area
- Press: `Cmd + Shift + 4`
- Drag to select area
- File saved to: Desktop

#### Specific Window
- Press: `Cmd + Shift + 4`, then press `Space`
- Click on the window to capture
- File saved to: Desktop

#### Screenshot to Clipboard (not saved as file)
- Add `Ctrl` to any of the above combinations
- Example: `Cmd + Shift + Ctrl + 4` for selection to clipboard

### Method 2: Screenshot App
1. Press: `Cmd + Shift + 5`
2. Choose capture mode (screen, window, or selection)
3. Click "Capture"

## What to Screenshot

### Screenshot 1: Initial Game State
**What to capture:**
- Full browser window showing the game
- Level 40 loaded
- Bomb tile visible with timer (💣8)

**How:**
1. Load level 40: `game.loadLevel(40)`
2. Wait for grid to fully load
3. Press `Cmd + Shift + 4`
4. Select the entire game area
5. Name: `01-initial-state-level-40.png`

---

### Screenshot 2: Console Output - Bomb Inspection
**What to capture:**
- Browser console showing bomb position output
- Grid display (if using visual grid command)

**How:**
1. Run bomb inspection command (from test-helper)
2. Wait for output to appear
3. Press `Cmd + Shift + 4`
4. Select console area showing output
5. Name: `02-console-bomb-inspection.png`

---

### Screenshot 3: Before Merge - Chain with Bomb
**What to capture:**
- Game grid showing selected chain
- Chain should include the bomb tile
- Chain line drawn connecting tiles
- Bomb timer visible

**How:**
1. Start dragging to create a chain
2. Include the bomb tile in your chain
3. **DON'T RELEASE YET** - keep finger/mouse down
4. With other hand, press `Cmd + Shift + 3` (full screen)
5. Then release to complete merge
6. Name: `03-before-merge-with-bomb.png`

**Tips:**
- You may need a second person or keyboard macro
- Alternative: Use screen recording and take frame from video

---

### Screenshot 4: After Merge - Bomb Defused
**What to capture:**
- Game grid after merge completes
- The tile where bomb was should show merged value
- NO bomb icon or timer visible
- Score updated

**How:**
1. Immediately after releasing merge with bomb
2. Press `Cmd + Shift + 4`
3. Select game grid area
4. Name: `04-after-merge-bomb-defused.png`

---

### Screenshot 5: Timer Decrease Test
**What to capture:**
- Bomb timer showing decreased value (e.g., 7 instead of 8)
- After a merge that did NOT include the bomb

**How:**
1. Make a merge without the bomb
2. After merge completes, check bomb timer
3. Press `Cmd + Shift + 4`
4. Select area showing bomb with reduced timer
5. Name: `05-timer-decreased.png`

---

### Screenshot 6: Visual Grid Console Output
**What to capture:**
- Console showing the visual grid representation
- Grid should show bomb positions with emoji

**How:**
1. Run visual grid command
2. Wait for grid to render in console
3. Press `Cmd + Shift + 4`
4. Select console output area
5. Name: `06-visual-grid-console.png`

---

### Screenshot 7: Multi-Bomb Test (Level 50)
**What to capture:**
- Level 50 with TWO bombs visible
- Both bombs showing their respective timers

**How:**
1. Load level 50: `game.loadLevel(50)`
2. Wait for load
3. Press `Cmd + Shift + 4`
4. Select game area
5. Name: `07-level-50-two-bombs.png`

---

### Screenshot 8: Game Over - Bomb Exploded
**What to capture:**
- Game over modal showing "Bomb exploded!" message

**How:**
1. Let a bomb timer reach 0 (don't defuse it)
2. Wait for game over modal
3. Press `Cmd + Shift + 4`
4. Select modal area
5. Name: `08-bomb-exploded-game-over.png`

---

## Screenshot Organization

### Recommended Folder Structure
```
2248-challenge/
├── screenshots/
│   ├── test-run-1/
│   │   ├── 01-initial-state-level-40.png
│   │   ├── 02-console-bomb-inspection.png
│   │   ├── 03-before-merge-with-bomb.png
│   │   ├── 04-after-merge-bomb-defused.png
│   │   ├── 05-timer-decreased.png
│   │   ├── 06-visual-grid-console.png
│   │   ├── 07-level-50-two-bombs.png
│   │   └── 08-bomb-exploded-game-over.png
│   └── notes.txt
```

### Create Screenshots Folder
```bash
cd /Users/eluckey/Developer/research/2248-challenge
mkdir -p screenshots/test-run-1
```

## Alternative: Screen Recording

If taking individual screenshots is difficult (especially #3), consider recording video:

### QuickTime Screen Recording
1. Open QuickTime Player
2. File → New Screen Recording
3. Click record
4. Perform all tests
5. Stop recording
6. Extract frames as needed

### Built-in Screen Recording
1. Press `Cmd + Shift + 5`
2. Click "Record Entire Screen" or "Record Selected Portion"
3. Click "Record"
4. Perform tests
5. Click stop in menu bar
6. Video saved to Desktop

## Screenshot Checklist

Use this checklist to ensure you have all required screenshots:

- [ ] 1. Initial state - Level 40 with bomb visible
- [ ] 2. Console output - Bomb inspection results
- [ ] 3. Before merge - Chain including bomb (in progress)
- [ ] 4. After merge - Bomb defused and removed
- [ ] 5. Timer decrease - Bomb timer reduced after non-bomb merge
- [ ] 6. Visual grid - Console grid representation
- [ ] 7. Multi-bomb - Level 50 with two bombs
- [ ] 8. Game over - Bomb explosion message

## Tips for Better Screenshots

### Clarity
- Ensure text is readable
- Use full screen or large window
- Check lighting/contrast
- Zoom if needed (Cmd + Plus)

### Context
- Include relevant UI elements
- Show score, moves, level number
- Capture timestamp if possible
- Include console output when relevant

### Consistency
- Use same browser zoom level for all screenshots
- Same window size if possible
- Same lighting/display settings
- Sequential numbering

## Annotation (Optional)

If you want to annotate screenshots:

### Preview (Built-in)
1. Open screenshot in Preview
2. Click markup toolbar icon
3. Add arrows, circles, text
4. Save

### Third-party Tools
- Skitch (free, good for annotations)
- Monosnap (free, with built-in editing)
- Snagit (paid, professional features)

## Screenshot Quality Checklist

Before submitting screenshots, verify:
- [ ] All screenshots are clear and readable
- [ ] Bomb icons and timers are visible
- [ ] Console output is legible
- [ ] No sensitive information visible
- [ ] Files are properly named
- [ ] All required screenshots captured
- [ ] Screenshots show expected vs actual behavior
- [ ] Annotations added if needed

## Common Issues

### Issue: Can't capture chain in progress
**Solution:** Use screen recording instead, or have someone else press screenshot key

### Issue: Screenshots too large
**Solution:** Use PNG optimization tool or convert to JPG

### Issue: Console output cut off
**Solution:** Scroll to show all output, take multiple screenshots

### Issue: Timer changed between screenshots
**Solution:** Take screenshots quickly in sequence, or use screen recording

## Deliverables

### Minimum Required
- Screenshot showing bomb defuse works (before/after)
- Screenshot showing timer decrease works
- Console output confirming bomb presence

### Complete Set
- All 8 screenshots listed above
- Organized in folder
- Optional: notes.txt with observations

### Professional Report
- All screenshots
- Annotations showing expected vs actual
- Test results summary document
- Video recording of full test session

---

**Remember:** The goal is to demonstrate that the bomb defuse feature works as expected. Focus on capturing clear evidence of:
1. Bombs appearing on grid with timers
2. Bombs being removed when merged
3. Timers decreasing when not merged
4. Game over when timer hits zero
