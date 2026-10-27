# Context for reviewers

- Owner: evan. Plays on a phone, makes design calls, does not write code. Claude agents write all code. He prefers plain words, tap controls (no drag-to-chain), no tutorials or coach marks. Remarks in chat are ideas, not orders.
- Existing project: "2248", a tile-chaining number game (connect equal tiles, they merge into a power of two). Repo eluckey2002/Map-Elites-2248 has a bot (solver/bot.js: chooseMove, analyzeMove, simulateCandidate, collectCandidates), a same-seed human-vs-bot benchmark (solver/human-benchmark.js, replays the bot on the owner's recorded boards), a text board renderer (solver/board-trace.js) and 25 saved owner games in play-sessions/*.json (keys: seed, candidateLevel, chains, score, movesUsed, outcome). Several repo files are hashed into evidence receipts, so edits break them.
- Pages are private Claude Artifacts: single HTML page, pinned CDN scripts only, optional per-artifact database for saved data.
- evan's question that started this: "What if I wanted to learn about AI and gaming by replicating a game and the research?" He then asked for a front end with plan and status in it, a decision review, the biggest weakness, what would supercharge it (arena), the 100-game choice, and how he learns (chose Turning points + Tune it).
- Status tracker: all 13 steps "Not started". Nothing is built.
