# Owner decision: board-2 human attempt is invalid

Decided 2026-09-28 by the owner, before the oracle arm has run on either board.

The first terminal capture for board-2 (Level 58 / seed 42,000,001, commit
`d8f8770`, `play-sessions/a84100a4db7a...json`) lost to a bomb on move 7. The
Keeper visual layer draws no bomb art; a bomb shows only as its timer number
on the tile (`src/keeper-motion-prototype.js:403`). The bomb sat on the 512
tile the owner was deliberately preserving, so the attempt was played with
game state the player could not read.

Under `fresh-boards.json`'s outcome rule, invalid evidence makes the result
INCONCLUSIVE. The board-2 human attempt is therefore invalid. The later
board-2 replay (`b0dc980`, win in 11 moves) does not count either: it was a
second attempt on a known board.

The oracle still runs on both boards as registered, and its rows are kept.
Follow-up: bombs need readable art before any further owner play is used as
evidence.
