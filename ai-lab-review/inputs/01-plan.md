# AI Game Lab: plan

Oct 27, 2026 · @evan luckey

## Summary

The AI Game Lab is one phone-friendly page, an arena where every game and every bot plug in the same way. You learn game AI by copying published research and checking that your bot matches the paper's numbers. The path is three games: 2048, then Connect Four, then simple poker. It has four tabs: Plan & status, Watch, Play and Versus. You learn mainly through Turning points after each Versus game, plus the Tune it challenge on Watch. Each step is done when the bot matches the paper and you meet that step's learning goals.

**Decided 2026-10-27:** after a decision review, evan took all its changes plus learning goals and the arena. Nothing is built yet.

**Design locked for version 1.** A separate builder agent will build it, and this planning thread reviews each step against its pass check. The handoff waits for evan's go.

- [Build brief](https://claude.ai/artifact/RpKdwZotZJEMTaJMnzoC1n): the goal, ground rules, and every step with its pass check
- [Decision log](https://claude.ai/artifact/HX3Ma9XhDjQacj41psgR2M): what's settled and why
- [Status tracker](https://claude.ai/artifact/1dE9qzjFME4Gb2rmLR5Dt4): where each step stands

**Change rule:** if the builder finds a design problem, it stops and asks. Technical questions go to the planning thread, and anything evan would see or feel goes to evan.

## Assumptions and happy path

**Top 3 assumptions**

1. You learn by predicting the bot's moves, turning dials and checking yourself against learning goals. I write the code and you don't have to.
2. Everything runs on a laptop or in the cloud with no big graphics card. Bots train offline, and each page loads a small saved file.
3. The lab is one private Claude page like your 2248 pages: phone first, with your games saved.

**Happy path:** I build the 2048 lab in small steps. You play it, predict the bot's moves, turn its dials, and see its scores next to the paper's. When the bot matches the paper and you meet the learning goals, the Plan & status view marks step 1 done and we move on to Connect Four.

## The learning path

Each step copies a published result and checks the copy against the source's own numbers. Sources were checked on 2026-10-27, and links are at the end of the doc.

| Step | Game | What we copy | Target to match | What you learn |
| --- | --- | --- | --- | --- |
| 1a | 2048 | Rebuild of Robert Xiao's look-ahead bot (2014 blog post, not a paper), with the look-ahead depth and scoring rules pinned | Consistent with his 100-game results (100% reach 2048; report 32768 as consistent or not) | Search: looking ahead and averaging over random tiles |
| 1b | 2048 | Self-taught pattern bot ([Szubert and Jaśkowski, CIG 2014](https://www.cs.put.poznan.pl/mszubert/projects/2048.html)) with no search. This is the first true copy of a paper. | Wins over 97% of games | Learning from reward by playing itself millions of times |
| 1c | 2048 | Stronger follow-up ([Jaśkowski, arXiv 2016](https://arxiv.org/abs/1604.05085v3)) | To be read from the full paper | How small training tricks add up |
| 2a | Connect Four | Plain tree search by random playouts (Monte Carlo tree search), with no learning | Checked against a perfect-play solver (Connect Four is solved) | Search without hand-written rules |
| 2b | Connect Four | AlphaZero method ([Silver et al., arXiv 2017](https://arxiv.org/abs/1712.01815v1)), scaled down | Beats 2a and agrees with the solver more often (exact target set in step 2's plan) | Self-play: a bot that starts with only the rules |
| 3 | Kuhn poker | Counterfactual regret minimization ([Zinkevich et al., NeurIPS 2007](https://proceedings.neurips.cc/paper/2007/hash/08d98638c6fcd194a4b1e6992063e944-Abstract.html)) | Reaches the game's known value of -1/18 per hand for the first player | Playing well when you can't see the other cards |

After step 1, the self-taught 2048 bot can also be pointed at 2248 and compared with our current bot. That comparison is optional.

**How each bot learns**

- **1a, search bot: no training.** It thinks at play time. It tries each move, imagines the random tiles, looks a few moves ahead and scores boards with hand-written rules. Your dials change those rules.
- **1b, self-taught bot: learns from its surprises.** It keeps scores for small groups of 4 to 6 squares and adds them up to value a board. After each move it compares what it expected with what happened and nudges the scores toward the truth, over millions of games played against itself. This is called temporal difference learning.
- **2b, Connect Four: coach and student.** A small network guesses good moves and who is winning. A search uses those guesses to find better answers, and the network is retrained to copy the search and predict the real winner. Then it repeats.
- **3, poker: learns from regret.** It plays itself and, at each decision, leans toward the choices it regrets not making. Averaged over many rounds, this reaches the unbeatable strategy, bluffing included, in seconds.

## Learning goals

Each step is done only when the bot matches its target and you meet that step's learning goals. The goals are shown on the Plan tab next to the bot's score and scored from the lab notebook.

| Step | You can... |
| --- | --- |
| 1a | Close the gap between your score and the bot's on the same boards over several sessions (Turning points). Hit a Tune it target in fewer tries over time. Say in one sentence why deeper look-ahead helps and where it stops helping. |
| 1b | Explain how the bot improves without anyone telling it the right move. |
| 2a and 2b | Explain why random playouts work at all, and what the network adds to the search. |
| 3 | Explain why the best strategy has to bluff sometimes. |

The exact pass marks (for example, "most" = 6 out of 10) are set in each step's plan, before you play.

## The arena

Every game plugs in the same way (its rules plus a board seed), and so does every bot (it sees a board and picks a move). So each new game is mostly a rules file, every bot can try every game, and 2248 can join later at no extra cost. The design follows DeepMind's OpenSpiel library, but copies only its shape, since OpenSpiel doesn't run in a browser.

- **Cost:** one extra step at the start, roughly 10 to 20% more for version 1.
- **Guard against over-building:** the plug-in shape covers only these three games (one player with random tiles, two players who see everything, hidden cards). It is tested on 2048 first, and nothing goes in before a game needs it.
- **Later add-ons that plug into it:** a lab notebook (in version 1) and an "Ask why" button with Claude in the page (later). Ask why must read the live board and the engine's real numbers, never guess.

## Lab page layout

The page has four tabs along the bottom, and Plan is the first thing you see. A UX and information-design review cut the separate Training tab. Version 1's search bot doesn't train, so that tab would sit empty. The training chart will go inside step 1b's card on Plan once that bot exists.

| Tab | What it shows at a glance | Details |
| --- | --- | --- |
| Plan (home) | The current step in large type, with "Paper: X, Ours: Y", the gap, and your learning goals | Covers every game in the arena, and other steps fold to one line each. Each step links to its paper and says how it was measured (games played, depth, time per move, date). |
| Watch (Tune it) | The board, with four move bars under it and the bot's chosen move highlighted | With the optional Guess switch on, you first tap the move you think the bot will make, then you see its pick and why, for example "expected score if I go left". Two dials, look-ahead depth and "keep the big tile in the corner", each run a short batch on the same boards for every setting and show how the win rate moved. Tune it gives you a target, such as "reach 16384 in 9 of 10 games", and counts your tries. Play, pause, step and speed controls. |
| Play | The board, your score and four large arrow buttons | Swiping also works, and the page won't scroll while your finger is on the board. Games are saved. |
| Versus | One line saying who won on this board and by how much | You and the bot play the same tile sequence, and the bot's thinking time per move is shown. Afterwards, Turning points shows the 3 moments where your move and the bot's differed most, with the bot's reason for each. |

**Rules from the review**

- Every status and score on Plan comes from one results file, built into the page each time it is republished. Nothing is typed in by hand.
- "Matches the target" means the paper's number falls inside our 95% range for that measure over 100 games. A flat 5% band is tighter than normal luck. At 36% over 100 games, for example, normal luck spans about 26% to 46%. The steadier measures (reaching 2048, 8192, 16384) come first. Runs start at 100 games, the same as Xiao's. If a result is borderline, meaning the paper's number lands outside our range or within 3 points of its edge, 300 more games are added (400 in total), which halves the luck range.
- Board seeds and bot settings are locked and saved before each 100-game run.
- Every Versus game, turning point, Tune it try and guess is saved to the lab notebook with what actually happened. That's what scores the learning goals.

* Dial batches on Watch play the same boards for every setting, so a change in win rate comes from the dial, not from luck in the boards. This is the same-seed rule the 2248 work uses.

## Build steps for the 2048 lab (version 1)

Version 1 covers step 1a, the look-ahead search bot. It is built in three slices, smallest effort and biggest value first, so you get something to play after each one. Each step can be checked on its own.

**Slice 0: quick win on 2248**

- [ ] 1\. Set up version history for the lab code, so every score can be traced to the code that made it.
- [ ] 2\. Turning points on your 2248 games: replay the 2248 bot on the same boards as your 25 saved games, and show the 3 moments per game where your move and the bot's differed most, with its reason. This only reads the 2248 bot and your saved games. Nothing in the 2248 repository changes.

**Slice 1: thin 2048 slice (playable early)**

- [ ] 3\. Define the arena's plug-in shape for a game and a bot, covering only 2048, Connect Four and Kuhn poker.
- [ ] 4\. Write the 2048 rules engine as the first arena game: slides, merges, score, and new tiles (2 or 4) from a seed. Test it against the standard rules.
- [ ] 5\. Write the look-ahead bot, rebuilding Xiao's approach, with the depth and scoring rules pinned and written down.
- [ ] 6\. Build the Play tab.
- [ ] 7\. Build the Versus tab with Turning points, using the same tile sequence for you and the bot. Publish this slice so you can play it.

**Slice 2: the rest of version 1**

- [ ] 8\. Time a few full-depth games first. Then lock the seeds and settings, play 100 games offline (400 if the result is borderline), and save the share reaching each tile, the time per move and the 95% ranges to the results file.
- [ ] 9\. Build the Plan tab, reading the results and the learning goals.
- [ ] 10\. Build the Watch tab: the Tune it challenge with two dials, the optional Guess switch, and speed control.
- [ ] 11\. Build the lab notebook, which saves every Versus game, turning point, Tune it try and guess with its result.
- [ ] 12\. Check it on a phone screen, get a second UX review of the built page, and republish.
- [ ] 13\. You play it. Then I score your 1a learning goals and write the plan for step 1b.

On a phone, the bot may need to look fewer moves ahead to stay quick. If so, Plan shows the phone's look-ahead depth next to the offline result, so the two are never mixed up.

The code lives in the project's shared files, the same way Night Kitchen does. It stays out of the 2248 repository, so that repository's evidence rules don't apply. It gets its own version history from step 1, and can move to its own GitHub repository later if you want.

## Scope and rigor

**In scope (version 1):** the arena's plug-in shape, the 2048 rules engine, the look-ahead search bot (step 1a) and its measured results, the 1a learning goals, the lab notebook, Turning points on your saved 2248 games (read-only), and one private phone page with four tabs: Plan, Watch (Tune it challenge, optional Guess switch), Play and Versus (with Turning points). Plan lists all three games and their steps, but only 2048 step 1a gets built.

**Not in scope:** the self-taught bots (1b and 1c), Connect Four, poker, the training chart, the Ask why button, putting 2248 into the arena as a full game, starting training from the page, any change to 2248's game or its repository, a public website, and tutorials or coach marks.

**Rigor: medium.** The bot's numbers must come from a real run of at least 100 games (400 when borderline), with seeds and settings locked first, saved to the results file, and checked against the target using 95% ranges. The page itself is a learning tool, so the bar there is "works on your phone" rather than full test coverage. This level holds for every build step above.

## Sources

- [Robert Xiao, "Writing a 2048 AI" (2014)](https://www.robertxiao.ca/hacking/2048-ai/): expectimax bot and its 100-game results
- [Szubert and Jaśkowski, CIG 2014](https://www.cs.put.poznan.pl/mszubert/projects/2048.html): n-tuple temporal difference learning
- [Jaśkowski, arXiv 1604.05085 (2016)](https://arxiv.org/abs/1604.05085v3)
- [Silver et al., arXiv 1712.01815 (2017)](https://arxiv.org/abs/1712.01815v1): AlphaZero
- [Zinkevich et al., NeurIPS 2007](https://proceedings.neurips.cc/paper/2007/hash/08d98638c6fcd194a4b1e6992063e944-Abstract.html): counterfactual regret minimization
