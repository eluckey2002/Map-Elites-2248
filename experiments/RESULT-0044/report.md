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
| board-1 | win, 9 | win, 10 | fixed-case row only |
| board-2 | loss, 7 (invalid) | win, 12 | no valid human row |
| board-2 replay (`b0dc980`, observation only) | win, 11 (173,568) | win, 12 | not blind: second attempt after seeing the opening and first 7 moves' spawns; excluded from the outcome rule |

Both captures replay valid. Both oracle witnesses verify as wins.

## Outcome: INCONCLUSIVE

The registered rule gives `INCONCLUSIVE` for invalid evidence. The owner ruled
the board-2 human attempt invalid, and applied that rule, in `ba42ccf`, before
the oracle ran. The panel is therefore `INCONCLUSIVE`. Reading it as
`FALSIFIED` after seeing board 1's numbers would be a post-hoc re-reading. The
rows stand as fixed-case observations. No population inference follows.

## Provenance gap

`run-oracle.js` hard-coded `implementationCommit` as `5205535` without
recording the worktree's HEAD or checking it was clean. The worktree was created
detached at `5205535` just before the run and was found at `5205535` and clean
afterwards. The one-attempt oracle cannot be re-run. Future runners must record
and check HEAD.
