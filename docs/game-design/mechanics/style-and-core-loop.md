# Style and core loop

## Genre

This style is commonly described as a **chain-and-merge number puzzle** or a
**2248-style puzzle**. It combines three familiar structures:

- Powers-of-two progression from merge games such as 2048.
- Dragging a path through adjacent pieces, as in connect-the-dots puzzles.
- A campaign of levels with objectives and limited moves.

Unlike classic 2048, the player usually does not slide an entire row. The
player chooses a path through adjacent tiles. A typical path might look like:

```text
2 -> 2 -> 4 -> 8 -> 16
```

The selected tiles merge, the board collapses or refills, and the player
tries to build increasingly valuable future paths. Exact path and merge rules
vary between games. In this project, use the evidence ledger rather than a
genre convention when stating the shipped rule.

## The moment-to-moment loop

1. Scan for a legal starting pair.
2. Extend the path through useful values.
3. Decide whether to take the path now or preserve it.
4. Merge and receive score and board-space feedback.
5. Read the new board created by gravity and refill.
6. Repeat until the objective is met or the move budget is exhausted.

The loop works because the number ladder is easy to internalize:

```text
2, 4, 8, 16, 32, 64, 128, 256...
```

Players can estimate value without learning arbitrary combinations. Long
chains also support strong audiovisual escalation: increasing pitch,
animation intensity, score popups, and a dramatic final merge.

## Sources of appeal

### Immediate readability

The player can normally identify at least one legal action quickly. This
makes the game approachable on touch screens and suitable for short sessions.

### Compression

Many small pieces become one large piece. That produces a visible sense of
progress while opening board space.

### Deferred gratification

A short chain offers immediate value, while preserving the same pieces may
enable a much larger chain later. That tension creates planning.

### Cascading possibility

One merge changes gravity, adjacency, and refill. A simple action can create
an unexpectedly strong next turn.

## The design promise

The player should feel that they are doing more than spotting matches. The
game becomes strategically satisfying when they can explain why preserving,
placing, or consuming a tile now improved a later turn.

The primary failure mode is the opposite feeling: the board appears to play
itself, or success depends mainly on favorable refills. The rest of this guide
focuses on preserving player agency while retaining uncertainty.

## Reference examples

- [2248 Game](https://2248game.com/) describes the equal-then-doubling chain
  convention used by one representative implementation.
- [2048](https://en.wikipedia.org/wiki/2048_(video_game)) provides the
  powers-of-two merge lineage, although its whole-board sliding input is
  different.
- [Two Dots](https://en.wikipedia.org/wiki/Two_Dots_(video_game)) illustrates
  how a simple connection mechanic can support campaign objectives,
  obstacles, and move limits.

