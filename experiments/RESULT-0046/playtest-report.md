# Owner playtest follow-up — RESULT-0046 elites

This is a post-close follow-up to the verified archive, not a new experiment and
not a change to RESULT-0046's registered conclusion. Five retained boards were
played once on named descriptor-panel seeds. Each candidate-bound recording
replays against the exact candidate identity retained in the archive.

## Exact fixed-session results

| Board | Cell | Seed | Owner | Reference bot | Immediate witness | Harvest witness | Largest chain |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `gen-0006` | 6,2 | 43,000,002 | 15 moves | 21 moves | 24 moves | 26 moves | 143,360 |
| `gen-0003` | 6,1 | 43,000,002 | 19 moves | 20 moves | 21 moves | 24 moves | 153,600 |
| `gen-0002` | 0,5 | 43,000,001 | 11 moves | 13 moves | 9 moves | 8 moves | 30,720 |
| `gen-0010` | 0,5 | 43,000,000 | 10 moves | 11 moves | 9 moves | 6 moves | 46,080 |
| `gen-0004` | 0,5 | 43,000,001 | 8 moves | 12 moves | 9 moves | 7 moves | 38,720 |

All five owner sessions won. The owner was faster than the current reference
bot on all five fixed boards. The table does not claim optimality: the mapped
policy rows are replayed bounded-search witnesses, and two of the cell-0,5
harvest witnesses are faster than the owner by more than one move.

## Owner judgments captured during play

- `gen-0003` was a "big grind" and too repetitive for its length; its lone
  timer-10 bomb created no meaningful pressure. An unexpected 4,096-producing
  penultimate chain fed its 153,600-point final chain.
- `gen-0002` produced an immediate sense of containment and was judged a good
  level.
- `gen-0010` was judged quick and easy.
- `gen-0004` was judged quick and balanced: neither easy nor highly
  challenging.
- Across the set, the owner said most boards brought out a sense of gameplay
  and that their differences were notable.

These are owner judgments about five identified sessions. They do not establish
population-level preference, difficulty, fun, or the quality of unplayed boards.
They do show why retaining three elites per cell mattered: the three cell-0,5
boards shared a descriptor region while producing distinct owner descriptions.

## Reproduce

```sh
node experiments/RESULT-0046/replay-playtests.js
```

The normal replay index admits experiment-archive candidates only when their
experiment is `CLOSED`. Therefore both `node solver/human-benchmark.js
--recording <file>` and the report command above resolve these identities
through RESULT-0046 without admitting the invalid RESULT-0045 archive.
