# Screenshot Capture Guide - 2248 Challenge UAT

## Quick Start

1. **Open test runner:** `open test-runner.html`
2. **Use screenshot tool:** Cmd+Shift+4 (Mac) or Snipping Tool (Windows)
3. **Save location:** `/Users/eluckey/Developer/research/2248-challenge/screenshots/`

---

## Screenshot Requirements

### Screenshot 1: Initial State - Undo Button DISABLED

**Filename:** `01-undo-disabled-initial.png`

**How to Capture:**
1. In test runner, click "1. Load Fresh Level"
2. Wait for "TAKE SCREENSHOT" prompt
3. Use Cmd+Shift+4 to capture the game iframe

**What to Show:**
```
┌─────────────────────────────────┐
│ Level 1                   Score │
│                              0  │
│ ━━━━━━━━━━━━━━━━ 0%            │
│ ⬡ Moves: 25/25  🎯 Target: 500 │
├─────────────────────────────────┤
│                                 │
│  [2] [4] [2] [8] [4]           │
│  [4] [2] [2] [4] [2]           │
│  [2] [8] [4] [2] [4]           │
│  [4] [2] [2] [8] [2]           │
│  [2] [4] [4] [2] [8]           │
│  [8] [2] [2] [4] [2]           │
│  [2] [4] [8] [2] [4]           │
│  [4] [2] [2] [4] [2]           │
│                                 │
├─────────────────────────────────┤
│  [↩ Undo]  [↻ Restart] [☰ Lvl] │
│    ^^^^^^                       │
│   GRAYED OUT / DISABLED         │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ Undo button appears grayed out (opacity: 0.5)
- ✓ Score displays "0"
- ✓ Moves shows "25/25" (or level default)
- ✓ Progress bar at 0%
- ✓ Full grid with initial tiles visible

**Console Check:**
```javascript
// Should print: true, 0
console.log(document.getElementById('undoBtn').disabled, game.history.length);
```

---

### Screenshot 2: After Move - Undo Button ENABLED

**Filename:** `02-undo-enabled-after-move.png`

**How to Capture:**
1. In test runner, click "2. Make Programmatic Move"
2. Wait for move animation to complete (~500ms)
3. Wait for "TAKE SCREENSHOT" prompt
4. Capture the game iframe

**What to Show:**
```
┌─────────────────────────────────┐
│ Level 1                   Score │
│                             104 │ ← Score increased
│ ━━━━━━━░░░░░░░░░ 20%           │ ← Progress bar filled
│ ⬡ Moves: 24/25  🎯 Target: 500 │ ← Moves decreased
├─────────────────────────────────┤
│                                 │
│  [2] [4] [2] [8] [4]           │
│  [4] [2] [2] [4] [2]           │
│  [2] [8] [4] [2] [4]           │
│  [4] [8] [2] [8] [2]           │ ← Merged tile (higher value)
│  [2] [4] [4] [2] [8]           │ ← New tiles spawned
│  [8] [2] [2] [4] [2]           │
│  [2] [4] [8] [2] [4]           │
│  [4] [2] [2] [4] [2]           │
│                                 │
├─────────────────────────────────┤
│  [↩ Undo]  [↻ Restart] [☰ Lvl] │
│    ^^^^^^                       │
│   NORMAL / ENABLED / CLICKABLE  │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ Undo button appears normal (no graying out)
- ✓ Score > 0 (shows points earned)
- ✓ Moves counter decreased (24/25)
- ✓ Progress bar shows some progress
- ✓ Grid changed (merged tile + new tiles)

**Console Check:**
```javascript
// Should print: false, 1, score > 0
console.log(document.getElementById('undoBtn').disabled, game.history.length, game.score);
```

---

### Screenshot 3: After Undo - State REVERTED

**Filename:** `03-after-undo-state-reverted.png`

**How to Capture:**
1. In test runner, click "3. Click Undo"
2. Wait for state to revert
3. Wait for "TAKE SCREENSHOT" prompt
4. Capture the game iframe

**What to Show:**
```
┌─────────────────────────────────┐
│ Level 1                   Score │
│                              0  │ ← Score reverted to 0
│ ━━━━━━━━━━━━━━━━ 0%            │ ← Progress back to 0%
│ ⬡ Moves: 25/25  🎯 Target: 500 │ ← Moves back to 25/25
├─────────────────────────────────┤
│                                 │
│  [2] [4] [2] [8] [4]           │
│  [4] [2] [2] [4] [2]           │ ← Grid IDENTICAL
│  [2] [8] [4] [2] [4]           │    to Screenshot 1
│  [4] [2] [2] [8] [2]           │
│  [2] [4] [4] [2] [8]           │
│  [8] [2] [2] [4] [2]           │
│  [2] [4] [8] [2] [4]           │
│  [4] [2] [2] [4] [2]           │
│                                 │
├─────────────────────────────────┤
│  [↩ Undo]  [↻ Restart] [☰ Lvl] │
│    ^^^^^^                       │
│   GRAYED OUT / DISABLED AGAIN   │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ Undo button disabled again (grayed out)
- ✓ Score = 0 (reverted from Screenshot 2)
- ✓ Moves = 25/25 (reverted)
- ✓ Progress bar = 0% (reverted)
- ✓ Grid matches Screenshot 1 exactly

**Console Check:**
```javascript
// Should print: true, 0, 0
console.log(document.getElementById('undoBtn').disabled, game.history.length, game.score);
```

**Compare:** This screenshot should look IDENTICAL to Screenshot 1 (except possibly different tile arrangement due to randomization on first load).

---

### Screenshot 4: Level Complete Modal

**Filename:** `04-level-complete-modal.png`

**How to Capture:**
1. In test runner, click "4. Show Level Complete"
2. Wait for modal animation (~300ms)
3. Wait for "TAKE SCREENSHOT" prompt
4. Capture entire window (including modal overlay)

**What to Show:**
```
┌─────────────────────────────────┐
│ [Darkened/Blurred Background]   │
│                                 │
│    ┌─────────────────────┐     │
│    │  Level Complete!    │     │
│    │                     │     │
│    │   ★ ★ ★             │     │ ← Stars (1-3)
│    │                     │     │
│    │  Score    Moves  Chain │   │
│    │   500      20      7   │   │ ← Stats
│    │                     │     │
│    │ [   Next Level →  ] │     │ ← Button
│    └─────────────────────┘     │
│                                 │
│ [Game grid visible but dimmed]  │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ Modal overlay visible with dark background
- ✓ "Level Complete!" title text
- ✓ Stars display (colored for earned, gray for not earned)
- ✓ Stats section showing:
  - Final score
  - Moves used
  - Best chain length
- ✓ "Next Level →" button
- ✓ Game grid visible but dimmed in background
- ✓ Modal has white/light background

**Console Check:**
```javascript
// Should print: true, true
console.log(
    document.getElementById('completeModal').classList.contains('active'),
    game.levelComplete
);
```

---

### Screenshot 5: Modal Hidden

**Filename:** `05-modal-hidden.png`

**How to Capture:**
1. In test runner, click "4b. Hide Modal"
2. Wait for modal to disappear
3. Capture the game iframe

**What to Show:**
```
┌─────────────────────────────────┐
│ Level 1                   Score │
│                            500+ │
│ ━━━━━━━━━━━━━━━━ 100%          │
│ ⬡ Moves: 5/25   🎯 Target: 500 │
├─────────────────────────────────┤
│                                 │
│  [Game Grid - Fully Visible]    │
│  No modal overlay               │
│  No darkened background         │
│  All tiles clearly visible      │
│                                 │
├─────────────────────────────────┤
│  [↩ Undo]  [↻ Restart] [☰ Lvl] │
│   All buttons accessible        │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ No modal visible
- ✓ Background not darkened
- ✓ Game grid fully visible and interactive
- ✓ All buttons accessible

---

### Screenshot 6: Game Over Modal

**Filename:** `06-game-over-modal.png`

**How to Capture:**
1. In test runner, click "5. Show Game Over"
2. Wait for modal to appear
3. Wait for "TAKE SCREENSHOT" prompt
4. Capture entire window

**What to Show:**
```
┌─────────────────────────────────┐
│ [Darkened/Blurred Background]   │
│                                 │
│    ┌─────────────────────┐     │
│    │    Game Over       │     │
│    │  Out of moves!     │     │ ← Reason
│    │                     │     │
│    │  Score    Target    │     │
│    │   450      500      │     │ ← Stats
│    │                     │     │
│    │ [   Try Again    ]  │     │ ← Retry button
│    │ [  Level Select  ]  │     │ ← Menu button
│    └─────────────────────┘     │
│                                 │
│ [Game grid visible but dimmed]  │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ Modal overlay with dark background
- ✓ "Game Over" title
- ✓ Reason displayed (e.g., "Out of moves!")
- ✓ Stats showing:
  - Final score achieved
  - Target score (not reached)
- ✓ "Try Again" button
- ✓ "Level Select" button

**Console Check:**
```javascript
// Should print: true, true
console.log(
    document.getElementById('gameOverModal').classList.contains('active'),
    game.gameOver
);
```

---

### Screenshot 7: Valid Chain Creation

**Filename:** `07-valid-chain-creation.png`

**How to Capture:**
1. Load fresh level
2. MANUALLY create a chain of 2+ tiles by clicking/dragging
3. WHILE STILL HOLDING/DRAGGING (don't release), take screenshot
4. Must capture during the drag action

**What to Show:**
```
┌─────────────────────────────────┐
│ Level 1                   Score │
│                              0  │
│ ━━━━━━━━━━━━━━━━ 0%            │
│ ⬡ Moves: 25/25  🎯 Target: 500 │
├─────────────────────────────────┤
│                                 │
│  [2]═[2] [2] [8] [4]           │ ← Selected tiles
│     ╱                           │    highlighted
│  [4] [2] [2] [4] [2]           │ ← GREEN line
│                                 │    connecting them
│  ... rest of grid ...          │
│                                 │
├─────────────────────────────────┤
│  3 tiles → 6 × 1.5 = 9         │ ← Chain indicator
│         (GREEN TEXT)            │    (valid chain)
│                                 │
│  [↩ Undo]  [↻ Restart] [☰ Lvl] │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ Multiple tiles highlighted/selected
- ✓ GREEN line connecting tiles
- ✓ Chain indicator visible at bottom
- ✓ Indicator shows GREEN text (valid)
- ✓ Shows calculation: "X tiles → sum × multiplier = points"
- ✓ Must capture DURING drag (before release)

---

### Screenshot 8: Invalid Chain - Too Short

**Filename:** `08-invalid-chain-too-short.png`

**How to Capture:**
1. Load level 11: In console, type `game.loadLevel(11);`
2. Level 11 requires minimum chain of 3
3. MANUALLY create chain of only 2 tiles
4. WHILE DRAGGING, take screenshot

**What to Show:**
```
┌─────────────────────────────────┐
│ Level 11                  Score │
│                              0  │
│ ━━━━━━━━━━━━━━━━ 0%            │
│ ⬡ Moves: 28/28  🎯 Target: 5000│
│                 🔗 Min: 3      │ ← Min chain = 3
├─────────────────────────────────┤
│                                 │
│  [2]═[2] [8] [4] [2]           │ ← Only 2 tiles
│                                 │    selected
│  [4] [2] [2] [4] [8]           │ ← RED line
│                                 │
│  ... rest of grid ...          │
│                                 │
├─────────────────────────────────┤
│    Need 1 more tiles            │ ← Chain indicator
│      (RED TEXT)                 │    (invalid chain)
│                                 │
│  [↩ Undo]  [↻ Restart] [☰ Lvl] │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ Only 2 tiles selected
- ✓ RED line connecting tiles (invalid)
- ✓ Chain indicator shows RED text
- ✓ Message: "Need 1 more tiles"
- ✓ Min chain requirement visible in stats (Min: 3)

**Console Check:**
```javascript
// Should print: 3, 2, false
console.log(game.minChain, game.chain.length, game.isValidChain());
```

---

### Screenshot 9: Undo from Game Over

**Filename:** `09-undo-from-game-over.png`

**How to Capture:**
1. In test runner, click "5. Show Game Over" (sets up game over state)
2. Then click "5b. Undo from Game Over"
3. Wait for modal to disappear
4. Capture the game

**What to Show:**
```
┌─────────────────────────────────┐
│ Level 1                   Score │
│                             104 │ ← Score from before
│ ━━━━━━━░░░░░░░░░ 20%           │    game over
│ ⬡ Moves: 24/25  🎯 Target: 500 │ ← Moves restored
├─────────────────────────────────┤
│                                 │
│  [Game Grid - Playable]         │
│  No modal visible               │
│  State reverted to before       │
│  the game-ending move           │
│                                 │
├─────────────────────────────────┤
│  [↩ Undo]  [↻ Restart] [☰ Lvl] │
│    ^^^^^^                       │
│   May be disabled (if no more   │
│   history) or enabled           │
└─────────────────────────────────┘
```

**Key Elements to Verify:**
- ✓ Game over modal is GONE (not visible)
- ✓ Score reverted to pre-game-over value
- ✓ Moves reverted (should have moves remaining)
- ✓ Game is playable (can interact with grid)
- ✓ gameOver flag cleared

**Console Check:**
```javascript
// Should print: false, false
console.log(game.gameOver,
    document.getElementById('gameOverModal').classList.contains('active')
);
```

---

## Screenshot Capture Tips

### Mac Users (Cmd+Shift+4)
1. Press Cmd+Shift+4
2. Crosshair cursor appears
3. Click and drag to select area
4. Screenshot auto-saves to Desktop
5. Move to screenshots folder

### Alternative: Cmd+Shift+4, then Spacebar
1. Press Cmd+Shift+4
2. Press Spacebar
3. Click on window to capture entire window
4. Captures with shadow effect

### Windows Users (Snipping Tool)
1. Open Snipping Tool
2. Click "New"
3. Select area
4. Save to screenshots folder

### Chrome DevTools
1. Open DevTools (F12)
2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
3. Type "screenshot"
4. Choose "Capture screenshot" or "Capture full size screenshot"

---

## Verification Checklist

After capturing all screenshots, verify:

- [ ] All 9 screenshots captured
- [ ] Screenshots clearly show the UI elements
- [ ] Screenshots are properly named (01-09)
- [ ] Screenshots saved in correct folder
- [ ] File sizes reasonable (< 500KB each)
- [ ] Images are PNG format
- [ ] Undo button states clearly visible
- [ ] Score/moves values readable
- [ ] Modals fully visible (not cut off)
- [ ] Chain indicators visible in chain screenshots

---

## Quick Troubleshooting

**Can't see undo button state?**
- Make sure screenshot captures the bottom button area
- Undo button should clearly show grayed vs normal

**Modal not appearing?**
- Check console for errors
- Ensure test button was clicked
- Wait ~500ms for animation

**Chain not showing?**
- Must capture DURING drag action
- Don't release mouse/touch before screenshot
- Chain indicator only shows while dragging

**Test runner not working?**
- Refresh the page
- Check browser console for errors
- Ensure iframe loaded (wait 2-3 seconds)

---

## File Organization

```
2248-challenge/
├── index.html (main game)
├── game.js (game logic)
├── test-runner.html (UAT test interface) ⭐
├── uat-test-script.js (automated tests)
├── UAT-TESTING-GUIDE.md (detailed guide)
├── UAT-TEST-REPORT.md (full report)
├── UAT-SUMMARY.md (quick reference)
├── SCREENSHOT-GUIDE.md (this file)
└── screenshots/
    ├── 01-undo-disabled-initial.png
    ├── 02-undo-enabled-after-move.png
    ├── 03-after-undo-state-reverted.png
    ├── 04-level-complete-modal.png
    ├── 05-modal-hidden.png
    ├── 06-game-over-modal.png
    ├── 07-valid-chain-creation.png
    ├── 08-invalid-chain-too-short.png
    └── 09-undo-from-game-over.png
```

---

**Ready to start?**
1. Open: `test-runner.html`
2. Follow this guide
3. Capture all 9 screenshots
4. Review against checklist
5. Done! ✅
