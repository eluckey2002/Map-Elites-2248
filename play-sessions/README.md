# Play sessions

Ordinary play captured by `tools/play-server.js`. One JSON file per finished
game, named by the sha256 of its contents.

**This is not the evidence corpus.** `recordings/` holds receipted
candidate-authoring playthroughs bound to a candidate identity, consumed by
`solver/recording-replay.js` and the receipt gate. These are bound only to a
level number and a seed, which is enough to replay them
(`LEVELS.find(...)` plus `makeSeededRng(seed)`) but not enough to stand as
authoring evidence. Keeping them apart stops unresolvable entries landing where
candidate resolution is expected.

Captured because human play is the only benchmark in this project the bot has
not saturated, and until 2026-09-05 the game discarded every session: ordinary
play drew from `Math.random` with no seed and attached no recorder, so boards
were not reproducible and moves were lost.

All captures in this directory are part of the normal paired human benchmark:

    node solver/human-benchmark.js

Analyze one ordinary capture against the target-stopping bot on the same
shipped level and seed. The command also prints an uncapped bot-only diagnostic;
it is not a human comparison because the recorded game stopped at the target:

    node solver/human-benchmark.js --recording play-sessions/<id>.json

Draw the human and bot chains on each shared starting position:

    node solver/board-trace.js --recording play-sessions/<id>.json
