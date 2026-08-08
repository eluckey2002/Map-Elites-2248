# 2248 Challenge - Game Design Document

## Overview

A reimagined version of 2248 that introduces meaningful difficulty progression, strategic depth, and skill-based gameplay.

## Core Mechanics

### 1. Grid & Tiles
- **Starting grid**: 5×8 (same as original)
- **Tile values**: Powers of 2 (2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048...)
- **Linking**: Connect adjacent tiles (8 directions) to merge them

### 2. Chain Rules
- Must start with 2 identical numbers
- Can extend chain with same value OR double value
- Example: 2-2-4-8-8-16 = creates 32 tile at chain end
- Tiles above fall down to fill gaps
- New tiles spawn from top

---

## Challenge Systems

### Chain Multiplier Scoring
| Chain Length | Multiplier | Example (base 100 pts) |
|--------------|------------|------------------------|
| 2 tiles      | 1.0x       | 100 pts                |
| 3-4 tiles    | 1.5x       | 150 pts                |
| 5-6 tiles    | 2.0x       | 200 pts                |
| 7-8 tiles    | 3.0x       | 300 pts                |
| 9+ tiles     | 5.0x       | 500 pts                |

### Minimum Chain Requirements
| Level Range | Min Chain | Effect |
|-------------|-----------|--------|
| 1-10        | 2 tiles   | Standard play |
| 11-25       | 3 tiles   | Must plan ahead |
| 26-50       | 4 tiles   | Serious strategy |
| 51+         | 5 tiles   | Expert mode |

### Move Budget
Each level has:
- **Target score**: Points needed to complete level
- **Move limit**: Maximum moves allowed
- **Par**: Bonus threshold for efficiency

### Blocker Tiles
| Type | Visual | Behavior | Clear Method |
|------|--------|----------|--------------|
| Stone | Gray block | Immovable, blocks chains | Adjacent merge (3+ tiles) |
| Ice | Blue overlay | Frozen for N turns | Wait N turns |
| Bomb | Red with timer | Explodes in N moves | Merge before timer hits 0 |
| Lock | Padlock icon | Can't be linked | Match adjacent chain of same value |

### Grid Compression
| Level Range | Grid Size | Cells |
|-------------|-----------|-------|
| 1-30        | 5×8       | 40    |
| 31-50       | 5×7       | 35    |
| 51-70       | 4×7       | 28    |
| 71-90       | 4×6       | 24    |
| 91+         | 4×5       | 20    |

### Tile Decay (Level 50+)
- Tiles unused for 15 moves decay: 64→32→16→8→4→2→removed
- Creates urgency to use all tiles

---

## Game Modes

### Campaign Mode
- 100 handcrafted levels
- Progressive difficulty introduction
- Star rating (1-3 based on moves used)

### Endless+ Mode
- All systems active
- Escalating difficulty
- High score leaderboard

### Daily Challenge
- Same puzzle for all players
- Unique constraints each day
- Global leaderboard

---

## Level Design Examples

### Level 1 (Tutorial)
```
Grid: 5×8
Target: 500
Moves: 20
Min Chain: 2
Blockers: None
```

### Level 15 (First Stone)
```
Grid: 5×8
Target: 3,000
Moves: 25
Min Chain: 3
Blockers: 1 Stone (center)
```

### Level 35 (Compressed)
```
Grid: 5×7
Target: 15,000
Moves: 30
Min Chain: 4
Blockers: 2 Stone, 1 Ice (3 turns)
```

### Level 60 (Bombs Introduced)
```
Grid: 4×7
Target: 35,000
Moves: 35
Min Chain: 4
Blockers: 2 Stone, 1 Bomb (8 moves)
```

### Level 85 (Expert)
```
Grid: 4×6
Target: 75,000
Moves: 40
Min Chain: 5
Blockers: 3 Stone, 2 Ice, 1 Bomb
Decay: Active
```

---

## UI/UX Design

### Layout
```
+----------------------------------+
|  Level 15    Score: 2,450        |
|  Target: 3,000                   |
|  Moves: 18/25   Chain: 3+ req    |
+----------------------------------+
|                                  |
|     [  2 ][ 4  ][ 8  ][ 2 ][ 4 ] |
|     [  4 ][ 2  ][####][ 8 ][ 2 ] |  #### = Stone
|     [  8 ][ 16 ][ 4  ][ 4 ][ 8 ] |
|     [  2 ][ 4  ][ 2  ][ 16][ 4 ] |
|     [ 32 ][ 8  ][ 4  ][ 2 ][ 2 ] |
|     [  4 ][ 2  ][ 8  ][ 4 ][ 8 ] |
|     [  8 ][ 4  ][ 2  ][ 8 ][ 16] |
|     [  2 ][ 16 ][ 4  ][ 2 ][ 4 ] |
|                                  |
+----------------------------------+
|  [Undo]  [Hint]  [Menu]          |
+----------------------------------+
```

### Visual Feedback
- Valid chain: Green highlight on tiles
- Invalid chain: Red flash
- Chain breaking: Shake animation
- Score popup: Float up from merged tile
- Multiplier: Big text overlay (2x!, 3x!, 5x!)

### Color Scheme (Tile Values)
| Value | Color |
|-------|-------|
| 2     | #EEE4DA (cream) |
| 4     | #EDE0C8 (tan) |
| 8     | #F2B179 (orange) |
| 16    | #F59563 (dark orange) |
| 32    | #F67C5F (red-orange) |
| 64    | #F65E3B (red) |
| 128   | #EDCF72 (yellow) |
| 256   | #EDCC61 (gold) |
| 512   | #EDC850 (bright gold) |
| 1024  | #EDC53F (amber) |
| 2048+ | #3C3A32 (dark) |

---

## Technical Architecture

### Core Classes
```
Game
├── Grid (manages tile positions)
├── Tile (value, position, state)
├── Chain (current selection, validation)
├── Level (target, moves, constraints)
├── Blocker (type, duration, position)
└── Scorer (multipliers, totals)

UI
├── Renderer (canvas drawing)
├── InputHandler (touch/mouse)
├── Animator (transitions, effects)
└── SoundManager (sfx, music)
```

### State Machine
```
IDLE → SELECTING → VALIDATING → MERGING → SPAWNING → CHECKING
  ↑                                                      |
  +-------------------(level complete/game over)---------+
```

---

## Progression Unlock Schedule

| Level | Unlock |
|-------|--------|
| 1     | Basic gameplay |
| 5     | Chain multipliers shown |
| 11    | Min chain 3 requirement |
| 15    | Stone blockers |
| 25    | Ice blockers |
| 26    | Min chain 4 requirement |
| 31    | Grid compression (5×7) |
| 40    | Bomb blockers |
| 50    | Decay mechanic |
| 51    | Min chain 5 requirement + Grid 4×7 |
| 71    | Grid 4×6 |
| 91    | Grid 4×5 (maximum difficulty) |

---

## Success Metrics

A level is **well-designed** if:
1. It's solvable with perfect play
2. Average player beats it in 2-5 attempts
3. Par is achievable but requires optimization
4. The constraint (blockers, min chain, etc.) teaches a skill

The game is **successful** if:
1. Players understand WHY they failed
2. Improvement feels achievable
3. High-level play looks meaningfully different from beginner play
4. "One more level" feeling persists
