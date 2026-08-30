# Intake investigation: Level 51 human-strategy learning

- **status:** complete
- **question:** What exists, what constrains it, and what exact evidence must a bounded attempt to learn from the owner's two Level 51 wins use?
- **source policy:** Local primary repository artifacts only, fixed at Git `be843368be8e19ec59501aae38f19eebaf188b87`; historical files may be read only by immutable Git object identity.
- **bound:** The two Level 51 seed-1 winning recordings, their exact historical candidate, the live champion, its evaluation seams, and the project evidence rules. No policy implementation or performance conclusion.

## Findings

1. **Both recordings bind to the same historical candidate and initial board.** Recording `1c873567...` is a 12-move, 127,040-point win; `78749fc...` is a 14-move, 130,496-point win. Both name candidate identity `524f37c...`, Level 51, seed 1. Confidence: high, direct source.
2. **The missing candidate is recoverable without guessing.** Git object `420ba8ef79e1850e7dc50124f7ab564801b1d314:solver/candidate-levels.json` contains the candidate whose canonical identity is `524f37c...`; its gameplay fields equal the shipped Level 51 fields in `src/game.js`. Confidence: high, but the diagnosis must verify this equality mechanically before replay.
3. **The champion is protected and has an observable decision seam.** `solver/bot.js` exports `chooseMove`, `harvestValue`, and `DEFAULT_PARAMS`; `solver/policy-eval.js` supplies paired evaluation and the conservative level/seed-clustered lift estimator. The MAP-Elites verifier pins `solver/bot.js`, `solver/engine.js`, `solver/level-author.js`, `solver/generate-levels.js`, and `src/game.js`. Confidence: high, direct source and verifier replay.
4. **The work crosses deliverable kinds.** First it must answer a research question from replay evidence. Only a fixed research result may justify one experimental code change. That artifact must then be evaluated as a fresh research result and recorded at its exact standing. Confidence: high, orchflows spec/composition contract.

## Contradictions and corrections

- The current `recordingReplay.test.js` calls the two wins orphans because their candidate store is absent from the live filesystem. The immutable Git object and the independent 2026-08-17 audit show how to recover and validate the candidate. The diagnosis must preserve both facts: the live resolver cannot find it, while history can reconstruct it exactly.
- The recordings alone establish engine-legal trajectories, not a general strategy or a globally stronger player. Any shared principle remains a hypothesis until both trajectories support it and a fresh holdout evaluates the resulting policy.

## Dead ends

- `solver/human-vs-bot.js` cannot resolve these recordings with its current defaults because the historical tracer path is absent and the recording schema does not carry `targetScore`; it is not an adequate oracle for this run without a fixed candidate input.
- Existing MAP-Elites elites explore only the current parameter seam. Their holdout results cannot answer whether a new structural rule learned from human play works.

## Gaps left for the bounded diagnosis

- Which move-level divergences are generator omissions versus valuation errors.
- Whether both human trajectories support one shared, falsifiable principle.
- Whether that principle can be represented by one experimental policy without adding unrestricted search depth or memorizing Level 51.

## Baseline verification

- `node solver/verify-map-elites.js solver/map-elites-output`: PASS; 20 cells, three representative replays, protected hashes unchanged.
- Focused champion/MAP-Elites/replay tests: 93/93 PASS.
- Full solver suite: 193/196; only the three documented receipt-identity failures remain.
