# Keep a Line: final-objective continuation

2026-10-03. Actor codex; reviewer owner. Explanation only, not a puzzle change.
Owner asks whether their final challenge with three moves left had a plausible
winning path. The evidence-grounded ce-explain pass inspects actual play, not
the authored default witness. No gameplay, server or original capture was changed.

## Exact subject

Capture `connection-sessions/d678dcd0-c5d2-4690-90a4-1cab96c6c4e2.json`,
revision 26. Read bytes SHA-256:
`de7629a655a8ac7f8d8abcfd1b8b080f514a563ae7d87b66ad09be5087b52b4b`.
Frozen parsed input: `KEEP-A-LINE-PATH-1.input.json` alongside this receipt.
Runtime identity:
`e619e005527beb8fbe6f48ff586546c65a1c5c400e6739b50cd0f780555b437b`.

Actual replay of every saved action equals the saved final state. Prefix 10
enters objective three after move 6; prefix 20 re-enters the exact same board
after undo. Remaining moves 3, charges 0, RNG cursor 15. Target is **576**,
not 256; endpoints are column 1/row 2 and column 2/row 5 (one-based).

Entry board, rows top to bottom:

```
64  64   4   8  16
64   8  32   4   8
16 128  32   8 128
 2   4   2 512   2
80   8   2   4   4
16  64  64   4   4
```

## Verified continuation

Coordinates below are (column,row), one-based, each step on its current board.

1. `(3,4) -> (3,5) -> (2,4) -> (2,5) -> (1,6)`:
   values `2 + 2 + 4 + 8 + 16 = 32`.
2. `(3,4) -> (3,5) -> (3,6) -> (2,5)`:
   values `32 + 32 + 64 + 128 = 256`, ending on the lower marked place.
3. `(1,2) -> (2,3) -> (3,3) -> (3,4) -> (2,5)`:
   values `64 + 64 + 64 + 128 + 256 = 576`.

Actual `rules.replay(level,[...prefix,...continuation])` returns won at move 9
with all three objectives complete. The owner's action at saved prefix 21
reaches exactly the same state as step 1; its first two equal 2s are selected
in the opposite order, with the same survivor and gravity/refill outcome.

## Refill and visibility caveat

Tile-origin tagging through the actual transitions shows final-chain 64 at
(3,3) was supplied after move 8; final-chain 128 at (3,4) was supplied after
move 7. They were not tiles on the move-6 board. The 256 is built from existing
entry-board material. Refills are repeatable, not necessarily visible or known
before commitment. This proves a legal continuation, not that the owner could
foresee the full route from the entry board, or that the puzzle is fair/fun.

## Search and checks

Scratch probe: `/private/tmp/keep-a-line-path.dqbXBh/search.js`; immutable input
copy beside it. It composes actual `enumerateChains`, `findGoal`, move/removal
and replay modules; no bot scoring policy or default witness is substituted.
Iterative depths 1-3 inspect all legal setup merges/removals, then an exact
active-goal route. State cap 200,000; chain/goal node cap 100,000 per scan.
Visited key includes grid, RNG cursor, bank and remaining depth; score/last
action do not affect this finite objective. Result FOUND at depth 3, 7,329
visited-call states, 15,782 goal nodes, 9,498 setup-chain nodes, no cutoff.
Depths 1 and 2 finish without a winning continuation; depth 3 stops at this
positive witness. No general strongest-bot or difficulty claim follows.

Before the subject search, same public modules find and replay a one-move
positive control, reject a corrupted repeated-coordinate chain, and return
UNKNOWN for a zero-node goal cap. The subject's opening chain scan also
completes: 207 nodes, 147 chains, no truncation. Witness replay and tile-origin
checks were executed, not inferred from search output alone.

Tree HEAD/reflog remain fced429. Exact-tree process check shows only the seven
known playservers, no second agent writer. Local task record is submitted for
owner review; no self-acceptance, release, retuning or new implementation.

## Append-only clarification — 2026-10-03

The visibility caveat above does not mean replacement values are unavailable
before commitment. The actual controller's free **Preview result** displays
the exact immediate post-merge board, including gravity and refills, without
spending a move. **Back to board** returns to the original selection. The
preview board cannot itself be used to select a second chain.

The owner's later message says they had never used this control. The earlier
chat explanation that there was no way to know the refills, and hence the
first attempt was guesswork, was too strong and was corrected in chat.
Information absent from the ordinary board is available through the selected-
chain preview. Neither its availability nor the legal witness establishes
whether this owner could anticipate the full three-move route or enjoyed it.

Source: `src/connection-game.js`, render's `rules.preview`/`shown` selection
and the preview button handler. The owner subsequently proposed a next tile
above each column; that remains unimplemented and unselected as a refill-rule
change. See BL-0025 and CONNECTIONS-LEVELS-HANDOFF-1.
