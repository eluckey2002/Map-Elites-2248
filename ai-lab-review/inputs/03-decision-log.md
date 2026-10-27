# AI Game Lab: decision log (2026-10-27)

These are settled. The builder does not reopen them. A change needs a new row decided by evan.

| # | Decision | Choice | Why | Decided by |
| --- | --- | --- | --- | --- |
| 13 | Who builds | A separate builder agent builds. The planning thread reviews each step. No handoff until evan says go. | Keeps design and building apart, so every step gets an independent check | evan |
| 12 | Build order | Slice 0: Turning points on evan's saved 2248 games (read-only). Slice 1: a thin 2048 slice. Slice 2: the rest. | Smallest effort and biggest value first, with something playable early | evan |
| 11 | How evan learns | Turning points after each Versus game is the main way, Tune it is a bonus, and Guess the move is an optional switch | Builds on Nemesis-style play evan already likes. Learning by doing beats watching. | evan |
| 10 | Dial batches | Every dial setting plays the same boards | So the win rate change comes from the dial, not luck. The same rule the 2248 work uses. | Recommended by Claude and kept; evan can remove it |
| 9 | Games per run | 100 games, plus 300 more (400 in total) if borderline. Time a few games first. | Same size as Xiao's own test, with more only where luck could flip the answer | evan (option C) |
| 8 | What counts as a match | Xiao's or the paper's number falls inside our 95% range | A flat 5% band is tighter than normal luck over 100 games | evan (via the decision review) |
| 7 | Arena | Every game and every bot plug in the same way, designed only for 2048, Connect Four and Kuhn poker | Each new game becomes mostly a rules file, and bots work across games | evan |
| 6 | Learning goals | Each step has goals for evan, shown next to the bot's score and scored from the notebook | The plan measured the bot but not evan | evan (via the decision review) |
| 5 | Decision review changes | 1a becomes a rebuild of Xiao's bot (a blog post, not a paper). Plain tree search comes before AlphaZero. The code gets its own version history. Seeds and settings are locked before every run. | The review found a soft first target, a big jump to AlphaZero, and no record of which code made which number | evan ("Apply all changes") |
| 4 | Training tab | Cut until step 1b, when the chart goes inside that step's card | The first bot doesn't train, so the tab would sit empty | UX review, accepted by evan |
| 3 | Plan and status | Plan is the home tab and covers every game | evan asked for plan and status in the page | evan |
| 2 | Front end | One private Claude page, phone first | Fastest to build, and works like evan's 2248 pages | evan (option A) |
| 1 | Learning path | 2048, then Connect Four, then Kuhn poker | Covers search, self-play and hidden information, each building on the last | evan |
| 0 | Where the code lives | /mnt/project-files/ai-lab/. The 2248 repository is read-only. | 2248 files are hashed into evidence receipts, and its repository rules would slow a learning project | Claude, from the 2248 repository rules |
