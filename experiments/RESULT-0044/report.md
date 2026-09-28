# Report — RESULT-0044 fresh-board owner versus oracle (option 1)

The ledger record for this run is `RESULT-0056`, which supersedes `RESULT-0044`.
This page reports the run. It is not evidence by itself; the cited files are.

## Sequence

| Commit | Step |
| --- | --- |
| `66793f3` | `fresh-boards.json` fixes Level 56 / seed 42,000,000 and Level 58 / seed 42,000,001, before any play |
| `2df765f` | owner board-1 capture: win, 9 moves |
| `d8f8770` | owner board-2 capture: loss on move 7 (bomb) |
| `b0dc980` | board-2 replay, win in 11. Does not count (second attempt) |
| `ba42ccf` | owner rules the board-2 attempt invalid: bombs had no art, only a timer number |
| `d1d6875` | one oracle attempt per board, pinned `5205535`, 30 s: `oracle-run.json` |

## Rows

| Board | Owner (first capture) | Oracle | Comparison |
| --- | --- | --- | --- |
| board-1 | win, 9 | win, 10 | owner faster |
| board-2 | loss, 7 (invalid) | win, 12 | no valid human row |

Both captures replay valid. Both oracle witnesses verify as wins.

## Outcome: FALSIFIED

The rule falsifies when the oracle is slower than any human win. On board 1 it
is slower (10 > 9). `SUPPORTED` would need a valid comparison on both boards.
The board-2 invalidity therefore rules out `SUPPORTED` but cannot overturn a
falsification that board 1 alone already establishes. No population inference
follows from two fixed cases.
