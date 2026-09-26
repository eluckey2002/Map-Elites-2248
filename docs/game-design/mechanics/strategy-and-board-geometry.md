# Strategy and board geometry

## The strategic question

The shallow question is, "Can I make a chain?" The deeper questions are:

- Should I consume this chain now or preserve it?
- Where will the resulting tile land?
- Which values will become adjacent after gravity?
- Does this move create a stronger second move?
- Is the highest immediate score also the best board-shaping move?

A good level creates several legal actions with meaningfully different future
consequences. A board with only one useful move can serve as a tutorial or a
short authored puzzle, but it should not become the campaign's default.

## Two layers of skill

### Tactical skill

The player finds a strong path on the visible board. Useful tactical skills
include noticing long paths, avoiding illegal branches, and comparing two
immediate scores.

### Board-shaping skill

The player chooses a path partly for the board it leaves behind. This includes
controlling the merge endpoint, opening a lane, preserving a bridge tile, and
building future adjacency.

Board-shaping is the more durable source of mastery. If it has little effect,
the game risks becoming a sequence of obvious longest-chain selections.

## Geometry changes behavior

Board dimensions should change how the player reasons, not merely change the
number of cells.

| Shape | Likely effect |
| --- | --- |
| 5x5 | Compact and readable; placement pressure appears quickly. |
| 4x6 | Narrow lanes make refill direction and chokepoints more important. |
| 5x8 | More room for long chains and recovery; vertical structure matters. |
| 6x6 | More branching and spectacle, but a higher risk of obvious or noisy boards. |
| Irregular | Can create authored routes, pockets, bridges, and local scarcity. |

Total area affects opportunity, but aspect ratio affects topology. Two boards
with 24 cells can play differently if one is narrow and tall while the other
is closer to square.

## Geometry questions for a level designer

- Where can a valuable tile become trapped?
- Are there cells through which many useful paths must pass?
- Does gravity create lanes the player can learn to manipulate?
- Can the player deliberately connect two initially separate regions?
- Do blockers create a decision, or do they only remove options?
- Does the board support recovery after one weak move?

## Creating decision pressure

Useful pressure comes from competing benefits:

- Immediate score versus future setup.
- Long chain versus favorable endpoint.
- Clearing an objective versus preserving a useful tile.
- Opening space versus spending a limited move.
- Safe progress versus a risky high-reward setup.

Pressure becomes frustration when one side of the tradeoff is hidden or
controlled almost entirely by refill luck. Show enough information for the
player to form a plan, then let uncertainty test that plan rather than erase
it.

## Practical level review

While playing a candidate, pause before each move and record:

1. How many moves appear viable?
2. What does each viable move trade away?
3. Can a player predict the main consequence?
4. Would a greedy longest-chain policy choose the same action?
5. If so, what makes the human decision more interesting?

If the last question repeatedly has no answer, the level may be feasible and
balanced but strategically thin.

