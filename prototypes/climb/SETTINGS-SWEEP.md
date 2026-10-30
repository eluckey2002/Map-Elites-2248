# Climb settings test (2026-10-30)

Four fair bots (play-outs and look-ahead, each weak and strong) played 100 games on the usual settings and on each single change from them: 6,000 games. Every setting used the same 100 seeds, so each game is compared with the same seed on the usual settings. No game hit the 3,000-move cap.

Each cell is the median game length (in brackets: the average change against the same seeds on the usual settings) and the median best tile (highest power of 2).

| Setting | Play-outs weak | Play-outs strong | Look-ahead weak | Look-ahead strong |
|---|---|---|---|---|
| Usual settings | 58.5 moves, 2K | 71 moves, 8K | 49 moves, 1K | 56.5 moves, 4K |
| Pool of 4 | 59 moves (+2), 4K | 72 moves (+2), 32K | 52.5 moves (+3), 1K | 67.5 moves (+8), 16K |
| Pool of 6 | 57 moves (-1), 2K | 71 moves (+1), 8K | 44 moves (-5), 1K | 59.5 moves (+4), 4K |
| Pool of 7 | 57 moves (+2), 2K | 70 moves (-2), 8K | 48 moves (-0), 2K | 61 moves (+5), 8K |
| Pool starts at 4 | 58.5 moves (+0), 4K | 71 moves (+0), 16K | 49 moves (+0), 2K | 56.5 moves (+0), 8K |
| Pool starts at 8 | 58.5 moves (+0), 8K | 71 moves (+0), 32K | 49 moves (+0), 4K | 56.5 moves (+0), 16K |
| Fall odds: soft | 62 moves (+6), 512 | 77 moves (+7), 2K | 46 moves (+0), 512 | 66 moves (+10), 2K |
| Fall odds: gentle | 69 moves (+13), 512 | 82 moves (+13), 2K | 52 moves (+6), 256 | 74.5 moves (+17), 1K |
| Fall odds: halving | 87.5 moves (+30), 256 | 102 moves (+34), 512 | 63.5 moves (+17), 256 | 95.5 moves (+39), 512 |
| Climb on score | 52 moves (-7), 16K | 60 moves (-11), 48K | 42 moves (-6), 6K | 55.5 moves (-3), 16K |
| Climb on moves | 57 moves (+2), 1K | 86.5 moves (+13), 4K | 45.5 moves (-2), 512 | 62.5 moves (+8), 2K |
| Climb at 4x top (not 8x) | 43 moves (-15), 32K | 51 moves (-19), 256K | 37 moves (-12), 16K | 43 moves (-14), 32K |
| Pacing: speeds up | 49 moves (-10), 8K | 49.5 moves (-23), 16K | 42 moves (-6), 1K | 45 moves (-14), 8K |
| Pacing: slows down | 68 moves (+8), 1K | 85.5 moves (+14), 2K | 48 moves (+3), 768 | 75 moves (+19), 2K |
| evan's settings (pool 7 from 8) | 57 moves (+2), 8K | 70 moves (-2), 32K | 48 moves (-0), 8K | 61 moves (+5), 32K |

## What changes the game

1. **Fall odds is the biggest dial for game length.** Moving away from Equal makes games longer and best tiles much smaller. Halving adds about 17 to 39 moves, and the best tile drops to 256 to 512.
2. **When the pool climbs is the second.** Climbing at 4x the top tile instead of 8x cuts 12 to 19 moves and makes much bigger tiles. Climbing on score also shortens games. Pacing "speeds up" shortens them and "slows down" lengthens them.
3. **Where the pool starts changes nothing but the numbers.** Starting at 4 or 8 plays the exact same games as starting at 2, with every tile 2x or 4x bigger. evan's settings (pool of 7 from 8) are the pool-of-7 game with every number 4x.
4. **Pool size (4 to 7) barely changes game length.** A pool of 4 gives bigger best tiles and more stone.

## Where the bots disagree

All four bots move the same way on fall odds, climb-at-4x, climb on score and both pacing settings. They disagree on "climb on moves" and on pool 6 and 7 (the strong bots get longer games, the weak look-ahead shorter), so those effects are small and depend on how well you play.

Raw games: `settings-sweep.jsonl` (one line per game). Rerun: `node settings-sweep.js out.jsonl 100`.
