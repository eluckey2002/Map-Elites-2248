# AI Game Lab: build brief

Oct 27, 2026 · @evan luckey

## Goal

Build version 1 of the AI Game Lab exactly as the [plan](https://claude.ai/artifact/9wLmksuM5octi1s4gqoknv) says. The design is locked. It is a private, phone-first page where evan learns game AI by playing against bots built from published research, starting with 2048. Settled choices are in the [decision log](https://claude.ai/artifact/HX3Ma9XhDjQacj41psgR2M), so don't reopen them. Report progress in the [status tracker](https://claude.ai/artifact/1dE9qzjFME4Gb2rmLR5Dt4).

**Done means:** all 13 steps below pass their checks and have been reviewed by the planning thread, and evan has played the result. Build in slice order (0, then 1, then 2), and publish after slices 1 and 2 so evan can play early.

**Rigor: medium.** Every bot number comes from a real, locked run saved with the code version that made it. Page features must work on a phone screen 375 px wide. Full test coverage is not required, but the rules engine and the 2248 replay must be tested.

## Ground rules

- **Where the code lives:** `/mnt/project-files/ai-lab/`, a folder with its own git history from step 1. Commit at every step, and record the commit id inside every results file.
- **2248 is read-only.** Slice 0 reads the 2248 repository (`solver/bot.js`, `solver/recording-replay.js`, `solver/human-benchmark.js`, `solver/board-trace.js`, `play-sessions/`) from a checkout. Never edit, commit to or open a pull request on the 2248 repository. Its files are hashed into evidence receipts, and even a comment breaks them.
- **Pages:** private Claude Artifacts. Tap controls with large buttons, no drag to chain, no tutorials or coach marks, plain words. Data that must persist (games, notebook) goes in the artifact's database, not browser storage.
- **Change rule:** if a design choice looks wrong, stop that step and ask. Technical questions go to the planning thread. Anything about how the game plays, or what evan sees, goes to evan through the planning thread. Never ship a visible change that isn't in the plan.
- **Reporting:** update the status tracker when a step starts and when its pass check is met (set it to In review). The planning thread reviews it and marks it Done. evan sees only reviewed work.
- **Not in this build:** the self-taught 2048 bots, Connect Four, poker, the training chart, Ask why, and putting 2248 into the arena as a full game.

## Steps and pass checks

A step is ready for review only when its pass check is met and the evidence (a test run, a file or a screenshot) is linked in the tracker.

**Slice 0: quick win on 2248**

| # | Build | Pass check |
| --- | --- | --- |
| 1 | Version history for `ai-lab/` | The folder is a git repository with a first commit. Results files carry the commit id. |
| 2 | Turning points on evan's 25 saved 2248 games | Replaying each saved game reproduces its saved score exactly (this proves the board is right). At each of evan's moves, the 2248 bot's `analyzeMove` compares his move with its own. Each game shows its 3 biggest gaps as a board picture with both moves drawn and the bot's reason in plain words, on a phone page. The 2248 checkout shows no changes afterwards. Games that don't replay are listed, not hidden. If evan's chain isn't among the bot's candidate moves, it is scored with the same simulation the bot uses (\`simulateCandidate\`), so both moves are judged the same way. |

**Slice 1: thin 2048 slice**

| # | Build | Pass check |
| --- | --- | --- |
| 3 | Arena plug-in shape | One written interface for a game (new game from a seed, legal moves, play a move, game over, score) and for a bot (pick a move plus a short reason). 2048 uses it. A one-page note shows on paper how Connect Four and Kuhn poker would fit, with no extra code. |
| 4 | 2048 rules engine | Tests pass for the standard rules: no tile merges twice in one move (a row of 2, 2, 2, 2 slides to 4, 4), new tiles are 2 (90%) or 4 (10%), a move that changes nothing is not allowed, and the same seed always gives the same game. |
| 5 | Look-ahead bot (rebuild of Xiao) | Depth and scoring weights are in one settings file. It plays a full game without errors, and the time per move is recorded. |
| 6 | Play tab | Four large arrow buttons plus swipe, with no page scroll while a finger is on the board. Finished games are saved. Works at 375 px. |
| 7 | Versus tab with Turning points | You and the bot get the same tile sequence. One line says who won and by how much, and the bot's time per move is shown. 3 turning points with board pictures and plain-words reasons. The slice is published as a private page. |

**Slice 2: the rest of version 1**

| # | Build | Pass check |
| --- | --- | --- |
| 8 | 100-game run | A few full-depth games are timed first, and the timing is written down. Seeds and settings are committed before the run. The results file has the share of games reaching 2048, 4096, 8192, 16384 and 32768, with 95% ranges, time per move and commit id. If a result is borderline (Xiao's number is outside our range or within 3 points of its edge), 300 more games are run. |
| 9 | Plan tab | Every number comes from the results file, none typed by hand. Shows Paper vs Ours, status and the 1a learning goals. |
| 10 | Watch tab with Tune it | The Tune it target and a try counter. Dial batches use the same boards for every setting. The Guess switch is optional and off by default. Speed control works. |
| 11 | Lab notebook | Every Versus game, turning point, Tune it try and guess is saved to the artifact database and survives a reload. |
| 12 | Phone check and UX review | Screenshots at 375 px for every tab. A UX review by someone other than the builder, with its findings fixed or answered. Republished. |
| 13 | evan plays | evan has played. The planning thread scores the 1a learning goals and writes the plan for step 1b. |
