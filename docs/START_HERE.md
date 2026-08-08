# 🎮 2248 Challenge - Bomb Defuse UAT Testing

**Start Here for Testing Instructions**

---

## ⚡ 30-Second Quick Start

1. **Game is open** in browser → Switch to that window
2. **Press** `Cmd + Option + J` to open console
3. **Paste** this command:
   ```javascript
   localStorage.setItem('unlockedLevel', '50');
   game.loadLevel(40);
   ```
4. **Find** the bomb tile on grid (has 💣 icon)
5. **Test:** Create a chain that includes the bomb
6. **Verify:** Bomb should disappear after merge ✅

---

## 🪟 Windows Currently Open

You should have these browser windows/tabs:

✅ **Game Window** - The actual game (index.html)
✅ **Test Helper** - Interactive guide with commands (test-helper.html)
📄 **This Document** - You're reading it now

---

## 📚 Which File Should I Read?

Choose based on your needs:

| If you want... | Read this file |
|----------------|----------------|
| **Quick start, just want to test** | `test-helper.html` (open in browser) ⭐ |
| **Quick text reference** | `TEST_SUMMARY.md` |
| **Complete file index** | `UAT_TEST_INDEX.md` |
| **Technical code analysis** | `UAT_REPORT.md` |
| **Step-by-step walkthrough** | `test-instructions.html` (open in browser) |
| **Screenshot instructions** | `SCREENSHOTS_GUIDE.md` |
| **This intro** | `START_HERE.md` (you are here) |

---

## 🎯 What Am I Testing?

**Feature:** Bomb Defuse Mechanism

**Expected Behavior:**
- Bombs appear on grid with countdown timer (💣8)
- When you include a bomb in a merge chain, it gets **defused (removed)**
- When you DON'T include bomb in merge, timer **decreases by 1**
- If timer reaches 0, **game over**

---

## 🔧 Browser Console Commands

### Essential Setup
```javascript
// Unlock all levels and load level 40 (has bomb)
localStorage.setItem('unlockedLevel', '50');
game.loadLevel(40);
```

### Find Bombs
```javascript
// Wait 1 second, then show bomb positions
setTimeout(() => {
    for (let row = 0; row < game.grid.length; row++) {
        for (let col = 0; col < game.grid[row].length; col++) {
            const tile = game.grid[row][col];
            if (tile && tile.isBomb()) {
                console.log(`💣 at [${row}, ${col}], timer: ${tile.bombTimer}`);
            }
        }
    }
}, 1000);
```

**TIP:** All commands are available in the test-helper window with copy buttons!

---

## ✅ How to Test

### Test 1: Defuse Bomb (Primary Test)

1. Load level 40 (command above)
2. Look for tile with 💣 icon and number (timer)
3. Create a chain by dragging across tiles
4. **Include the bomb tile** in your chain
5. Release to complete merge
6. **Expected:** Bomb disappears! Tile shows merged value, no 💣

### Test 2: Timer Decrease

1. Create a chain that does NOT include the bomb
2. Complete the merge
3. Look at the bomb tile
4. **Expected:** Timer decreased by 1 (e.g., 8 → 7)

### Test 3: Bomb Explosion

1. Keep making moves without defusing the bomb
2. Watch timer count down
3. Let it reach 0
4. **Expected:** Game over with "Bomb exploded!" message

---

## 📸 Screenshots Needed

Take screenshots of:
1. Initial game with bomb visible
2. After merging WITH bomb (bomb gone)
3. After merging WITHOUT bomb (timer decreased)

**Mac Screenshot Shortcuts:**
- `Cmd + Shift + 4` = Select area
- `Cmd + Shift + 3` = Full screen

Save to: `/Users/eluckey/Developer/research/2248-challenge/screenshots/test-run-1/`

---

## 🎮 Bomb Levels Available

| Level | Timer | Notes |
|-------|-------|-------|
| **40** | 8 | ⭐ **Best for testing** - simple, one bomb |
| 41 | 7 | Has stone blocker too |
| 42 | 8 | Clean bomb test |
| 50 | 6 & 8 | **TWO BOMBS** - advanced test |

**Load any level:**
```javascript
game.loadLevel(XX); // Replace XX with number
```

---

## 🔍 Where's the Code?

**File:** `/Users/eluckey/Developer/research/2248-challenge/game.js`

**Lines:** 402-406 (in `executeChain()` method)

```javascript
// Defuse bomb if final tile was a bomb
if (finalTile.isBomb()) {
    finalTile.blocker = null;
    finalTile.bombTimer = 0;
}
```

**Assessment:** ✅ Code looks correct based on static analysis

---

## 💡 Tips

### If Game Won't Load
- Refresh the browser
- Check you opened `index.html`
- Look for errors in console (F12)

### If "game is not defined" Error
- Wait a few seconds for game to load
- Refresh page and try again
- Make sure you're in the game window, not test-helper

### If Can't Find Bomb
- Make sure you loaded a bomb level (40-50)
- Run the "Find Bombs" command above
- Look for 💣 emoji on the grid tiles

### If Chain Won't Include Bomb
- Bombs CAN be included in chains
- Make sure chain follows normal rules (matching values)
- Chain must meet minimum length (varies by level)

---

## 📝 Report Your Findings

After testing, note:

**Test 1 (Defuse): PASS / FAIL**
- [ ] Bomb appeared with timer
- [ ] Bomb removed when merged
- [ ] Tile shows merged value

**Test 2 (Timer): PASS / FAIL**
- [ ] Timer decreased when not merged
- [ ] Bomb remained on grid

**Test 3 (Explosion): PASS / FAIL**
- [ ] Game over when timer hit 0
- [ ] Message showed "Bomb exploded!"

**Overall: PASS / FAIL**

**Issues found:** _________________________________

---

## 🚀 Files Created for Testing

All files in: `/Users/eluckey/Developer/research/2248-challenge/`

**Interactive (Open in Browser):**
- `test-helper.html` - Main testing interface ⭐
- `test-instructions.html` - Detailed guide

**Documentation (Markdown):**
- `START_HERE.md` - This file
- `TEST_SUMMARY.md` - Quick reference
- `UAT_TEST_INDEX.md` - Complete index
- `UAT_REPORT.md` - Technical analysis
- `SCREENSHOTS_GUIDE.md` - Screenshot instructions

**Scripts (For Console):**
- `test-bomb-defuse.js` - Automated test script

---

## 🎯 Your Mission

1. Open game (should already be open)
2. Open browser console in game window
3. Run the setup command
4. Play the game and test bomb defuse
5. Take screenshots
6. Report if it works as expected

**Expected Result:** Bombs should be removed when merged ✅

---

## ❓ Questions?

**"Do I need to read all the documentation?"**
No! Just use the test-helper.html in your browser.

**"How do I know if it's working?"**
The bomb (💣) should disappear after you merge it.

**"What if I find a bug?"**
Take screenshots and note what happened vs what was expected.

**"Which level should I test?"**
Start with level 40. It's the simplest bomb level.

**"Can I test multiple levels?"**
Yes! Levels 40, 42, and 50 are recommended.

---

## ✨ Summary

**What:** Test bomb defuse feature
**Where:** Browser window with game
**How:** Use commands from test-helper
**Expected:** Bombs get removed when merged
**Evidence:** Screenshots showing before/after

---

**You're all set!** Switch to the test-helper window and start testing. 🎮💣

Good luck!

---

**Quick Links:**
- Game: `/Users/eluckey/Developer/research/2248-challenge/index.html`
- Test Helper: `/Users/eluckey/Developer/research/2248-challenge/test-helper.html`
- Screenshots Folder: `/Users/eluckey/Developer/research/2248-challenge/screenshots/test-run-1/`
