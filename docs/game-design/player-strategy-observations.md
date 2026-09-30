# Player strategy observations

This is an append-only notebook for observations supplied by an experienced
player. These entries guide design and exploratory work; they are not
experiment results, balance claims, or evidence-ledger facts.

Record the observation before deciding how to test it. A later experiment may
support, narrow, or fail to reproduce an observation without rewriting it.
When a recording, level, seed, or screenshot is known, add it to the entry.

## Current working mode

- **Now:** Capture and bind player observations from saved plays.
- **Next:** Compare repeated decision forks and choose one worth testing.
- **Not yet:** Declare a best strategy, adopt a map descriptor, or run a
  formal experiment.

## PSO-0001 — High scores come from building and harvesting value

**Status:** player observation; not yet machine-tested
**Recorded:** 2026-09-29
**Source:** owner play report; one example is bound in EO-0002 below

Building high-value tiles is not enough on its own. Strong play builds them,
keeps them usable, and later includes them in long chains that receive the
chain-length bonus. A raw chain-length measure misses the key distinction:
two chains of the same length can contain very different total value.

The player reported creating three 2K tiles in one game as an example of
successfully building substantial value. Whether that value was later
harvested into a still larger scoring chain is a separate observation to
capture from a replay.

**Questions for later exploration:**

- What was the total input value and bonus multiplier for each played chain?
- Which input tiles were built by earlier player merges rather than ordinary
  refill tiles?
- How often are high-value built tiles reused in later scoring chains?

### EO-0002 — Chain length alone misses the value that was built first

**Status:** exploratory player observation; one source play bound
**Recorded:** 2026-09-29
**Source:** owner report, confirmed as
[level 57, seed 2389915636](../../play-sessions/b068afb04eb954b6525f8bba0d86e149d6efec082528bd7e8b3374a7b09f85ab.json)

**What happened:** The player made a chain of roughly ten tiles, but the
important question was not its length alone. It was whether those ten plays
had built the largest possible values before the final chain. The player
created three 2K tiles in that game. The confirmed record shows the relevant
move was a 12-tile, 56,960-point chain containing three 2Ks, four 1Ks, one
512, one 256, and three 128s.

**Confirmed trace:** Moves 1, 3, and 7 each produced a 2K tile. Move 12 then
consumed all three as inputs to the harvest chain. In other words, the three
2Ks were not simply a high-tile count at the end: they were built, kept on the
board, and later cashed out together. The 1K and 2K inputs contributed 10,240
of the harvest's 11,392 input value (89.9%).

**Player reading:** High scoring depends on both stages: first build valuable
tiles, then preserve and include them in a long chain for the bonus. Two
ten-tile chains can therefore be strategically very different even if a map
puts them in the same chain-length bucket.

**What this entry does not establish:** One game does not quantify how much of
the outcome came from tile value versus chain bonus, prove that this is the
best route on other boards, or show how often the same setup is available.

**Recorded harvest leads — not yet tied to this report:** The session records
already retain the composition of selected chains. Among the strongest
recorded examples:

| Board | Harvest chain | 1K+ inputs | Inputs above 1K | Points |
| --- | --- | ---: | ---: | ---: |
| [Level 58, seed 42000001](../../play-sessions/e1a806a861cd693f57a63c7351abd1d6b0554471a4df16567672f88008430afc.json) | Move 10; 22 tiles | 7 | 5 | 85,120 |
| [Level 56, seed 42000000](../../play-sessions/b1a0c4c76835db2a0745aa54875ab8b3c1f75d2adc05c15546bd5b038f7fa8c2.json) | Move 9; 19 tiles | 6 | 5 | 68,800 |
| [Level 58, seed 41000001](../../play-sessions/0ab2da13ea6fe1841a5b7c0c75b2f4899bea41d0eb8da25ebb71a67d56b960fb.json) | Move 14; 27 tiles | 8 | 4 | 85,440 |
| [Level 57, seed 2389915636](../../play-sessions/b068afb04eb954b6525f8bba0d86e149d6efec082528bd7e8b3374a7b09f85ab.json) | Move 12; 12 tiles | 7 | 3 | 56,960 |

The level-57 chain is the confirmed source for this observation.

**Other confirmed 4K build-and-harvest leads — not yet tied to a player
report:**

- [Level 58, seed 42000001](../../play-sessions/e1a806a861cd693f57a63c7351abd1d6b0554471a4df16567672f88008430afc.json):
  move 4 produced a 4K tile; move 10 used it in a 22-tile, 85,120-point harvest.
- [Level 58, seed 41000001](../../play-sessions/0ab2da13ea6fe1841a5b7c0c75b2f4899bea41d0eb8da25ebb71a67d56b960fb.json):
  move 8 produced a 4K tile; move 14 used it in a 27-tile, 85,440-point harvest.
- [Level 56, seed 41000000](../../play-sessions/ddc4bce3d15be5501bd22856c23ede5ab4393bd7bde3b8029cb1aad021a54d4b.json):
  move 8 produced a 4K tile; move 9 used it in a 26-tile, 58,880-point harvest.

No saved session has an 8K tile as a recorded chain input or an exact 8K
chain total. That is a property of the current recordings, not evidence that
an 8K tile was impossible or never appeared in an unrecorded play.

### EO-0003 — A carried 4K changes the value of a long harvest

**Status:** player observation with checked scoring arithmetic
**Recorded:** 2026-09-29
**Source:** owner play knowledge; specific play not recorded or not identified

On a nine-or-more-tile harvest, the chain bonus is ×5. A 4K tile carried into
that chain therefore contributes 20,480 points by itself: `4,096 × 5`.
The multiplier and additive scoring rule are defined in
[the scoring engine](../../solver/engine.js#L94-L105).

This is why making a 4K and keeping it available for a long harvest is such a
large strategic event. It does **not** establish that holding it is always
best: the board may force an earlier use, offer no reachable long harvest, or
make the build cost too high.

For scale only, the three recorded 4K harvests above gave that one tile about
24%, 24%, and 35% of their respective chain scores. Those examples illustrate
the arithmetic; they do not measure whether the build-and-hold choice was
optimal.

### EO-0004 — Route for gravity alignment before building the 4K

**Status:** exploratory player observation; one source play bound
**Recorded:** 2026-09-29
**Source:** owner play knowledge, illustrated by
[level 58, seed 42000001](../../play-sessions/e1a806a861cd693f57a63c7351abd1d6b0554471a4df16567672f88008430afc.json)

The next unlock is to choose chains for the board they create after gravity,
not just for their immediate points. A good route can make gravity line up a
dense cluster of compatible high-value tiles, creating the practical chance
to build a 4K. The strategic object is therefore the *next board shape* and
the high-value density it enables.

**Recorded example:** In the source play, move 4 created a 4K at the
bottom-left. Before move 10, gravity had left it beside four 2Ks and two 1Ks
in one connected lower-board route. The move-10 chain ran into that cluster
and harvested it in a 22-tile, 85,120-point chain. The replay shows the
geometry; it does not reveal the player's intent in choosing the earlier
route-setting moves.

**What this entry does not establish:** It does not define the right density
measure, say which gravity routes are best, or show how often such a route
actually produces a 4K.

**Capture next time:** Save the board before the route-setting chain, the
selected chain, the board after gravity/refill, the high-value cluster it
created, and whether that cluster later became a 4K.

### EO-0005 — Store 256s until gravity makes them 4K material

**Status:** exploratory player observation; next play will be annotated
**Recorded:** 2026-09-29
**Source:** owner play knowledge

When building toward a 4K, the player counts 256 tiles and deliberately leaves
them on the board rather than taking the immediate chain. The aim is to let
later gravity create a dense, connected field of 256s that can be converted
into a 4K-building chain.

**Candidate play measures:** total board value; number of 256s held; their
placement/connectivity; moves remaining; and whether a later chain turns that
stored material into a 4K.

**What this entry does not establish:** Total board value alone does not show
whether the useful 256s are reachable together. It also does not yet give a
threshold at which holding them is better than taking an immediate score.

**Capture next time:** On each turn, note total board value, 256 count and
placement, what value was intentionally left untouched, the gravity route
being set up, and the result after the move.

### EO-0006 — Leave a 64 to prevent islands

**Status:** exploratory player observation; no source play bound yet
**Recorded:** 2026-09-29
**Source:** owner play knowledge

The player sometimes deliberately leaves a single 64 on the board. Its value
is not the reason to preserve it: removing it would leave “islands” — useful
tiles separated so they cannot participate in the same future route.

**Working definition, confirmed by the player:** An island is a useful pocket
of tiles that cannot be threaded into the same future legal chain route as
the rest of the board. This is not merely physical adjacency; a compatible
connecting route matters. A chain cannot cross between islands, so its length
is capped by the size of its island. With no islands — one connected playable
region — geometry no longer caps a chain below the whole board size, although
the value sequence can still prevent a full-board route.

**Why islands are bad:** A smaller reachable chain contains fewer input tiles,
which reduces both its points and the value of the tile it produces. It can
also miss the game's length-based bonus thresholds. Preserving route
connectivity therefore preserves scoring potential and high-tile-building
potential at the same time.

**Candidate play measures:** island count, and the *connectivity ceiling* —
the number of tiles in the largest playable island. The ceiling is a geometric
upper bound on chain length; value compatibility remains a separate limit.

**Interpretation:** This is a player-state measure. It describes current board
topology, the player's maintenance of that topology across moves, and a
strategy that trades immediate points for future chain capacity. A level may
make that maintenance easier or harder; the island state itself is not an
inherent level descriptor.

**What this entry does not establish:** The working definition has not yet
been reduced to a metric or threshold.

**Capture next time:** Mark the 64 being held, the tiles it keeps connected,
the chain that would remove it, and the board after the eventual use or loss
of that connector.

**Capture next time:** Record each major chain's length, its input tile values,
the total input value, bonus, resulting tile, and whether earlier built high
tiles were carried into a later harvest.

## PSO-0002 — Preserve the scarce 512 and adapt to the level horizon

**Status:** player observation; not yet machine-tested
**Recorded:** 2026-09-29
**Source:** owner play report; no session or seed bound yet

The 512 is a scarce bridge value on the scale-32 chapter. Do not create or
spend the only 512 before the final harvest unless another 512 is available.
Consuming it early removes a bridge needed to turn built value into the later
1K, 2K, or 4K payoff.

**Checked mechanics fact:** On levels 51–58 (tile scale 32), an initial tile
can be 512 (the 5% 16-value starting draw multiplied by 32), while refills
are limited to 64, 128, or 256 (the 2/4/8 refill draw multiplied by 32).
See [initial-board creation](../../src/game.js#L284-L308) and
[refill creation](../../src/game.js#L659-L671). This explains the scarcity;
it does not prove the strategy recommendation.

A bomb on the 512 materially changes the plan because it can force a turn
spent rebuilding a 512 with a four-tile chain. On a long level, the extra move
budget can enable a different plan: build a 1K chain of nine tiles and begin
the endgame from 1024 instead of slowly rebuilding from 64.

**Questions for later exploration:**

- When does preserving the sole 512 improve final score or win rate compared
  with consuming it early?
- How large is the move and score cost when a bomb forces a 512 rebuild?
- At what move budget does the direct-to-1024 route become practical?

### EO-0007 — A spare 512 supports an aggressive 2K-to-4K harvest plan

**Status:** exploratory player observation; one source play bound
**Recorded:** 2026-09-29
**Source:** owner play report, confirmed as
[level 56, seed 41000000](../../play-sessions/30bf987674acbbf9c39b9a68cc0bfe9f711547594b79a402726e9bd97c05b355.json)

**What happened:** The initial board contained three 512s. On move 1, the
player used two of them in a 14-tile chain to make a central 2K, while leaving
the third 512 on the far right. The move scored 10,240 points and established
the intended harvest spine: use the saved 512 to connect through later 1Ks to
the early 2K.

The player then made four 1Ks on moves 2–5, made a second 2K on move 6, and
on move 7 converted the original 2K plus two 1Ks into a 4K. That left the new
4K beside the second 2K rather than spending both. Move 8 made another 1K
while preserving that high-value route. The final move was a 20-tile harvest
containing the 4K, the 2K, three 1Ks, one 512, one 256, six 128s, and seven
64s. Its input value was 11,200; its length earned the ×5 multiplier; and it
scored 56,000 points.

**Checked score margin:** The game ended at 108,224 against a 108,000 target.
If the final chain had contained one fewer 128 and nothing else changed, it
would have been worth 640 fewer points (128 × 5), for a total of 107,584 —
416 short. This matches the player's report of being roughly 400 short before
finding a better route that added a 128.

**Player reading:** A 512 is a unique starting-board bridge, not easily
replaceable material. Spending two of three to create the opening 2K was an
aggressive but viable choice because one 512 remained. That surviving bridge
largely fixed the final route. In contrast, 1K links had enough possible
build routes that the player could take a controlled gap while attempting the
upgrade to a 4K, provided the eventual harvest spine stayed healthy.

**Candidate measures from this play:** starting-512 reserve after the opening;
the connected high-value harvest spine; the number of practical ways to
rebuild a 1K versus a 512; and score slack to the target before the final
harvest.

**What this entry does not establish:** It does not show that this opening is
best for every three-512 board, quantify the number of viable 1K alternatives,
or prove that the 4K upgrade was necessary rather than merely successful on
this seed.

### EO-0008 — Obstacles may reward staged harvests rather than one all-in chain

**Status:** exploratory player observation; one source play bound
**Recorded:** 2026-09-29
**Source:** owner post-play reading, confirmed as
[level 57, seed 3374487992](../../play-sessions/c367084170666024a51ea47c15380a452f8e8b8a886087e4c8ac864490545b95.json)

**Player intention:** The player was trying to assemble one single, very large
harvest. The two stone cells and early ice gate made that plan materially
harder to construct and to read than the open-board plan on level 56.

**What happened:** After the ice had cleared, move 14 made a 24-tile,
50,880-point harvest that carried a 4K, 2K, two 1Ks, a 512, and lower links.
That chain left behind a 10,176 tile. Instead of folding that result into the
same all-in ending, the run crossed the target on move 15 with a separate
20-tile, 21,120-point chain. The game won at 131,392 against a 129,000 target.

**Player reading:** This board may be teaching a different style of play: do
not insist that all prepared value must be realized in one giant chain.
Around obstacles, make one strong harvest when its constrained route is ready,
then use the resulting refill and remaining lane for a second substantial
harvest.

**What this entry does not establish:** The run proves that staged harvests
were sufficient here; it does not prove they were better than a feasible
single all-in chain, or that stones and ice generally favor this style.

**Capture next time:** At the point a first large harvest becomes available,
record the viable single-chain continuation, the staged alternative, the
obstacle-limited lanes each uses, and the final score of both plays where a
comparison can be made.

### EO-0009 — A non-power-of-two result can be a terminal cash-out

**Status:** exploratory player observation; one source play bound
**Recorded:** 2026-09-29
**Source:** owner play report, confirmed as
[level 58, seed 1476286710](../../play-sessions/1ece6599dd673f72569a06834df8c1412b8c0c00dc0780245e0625b7329c7b16.json)

**Player reading:** Before harvesting, the board was cramped and the player
could not place the planned high-value result where it would remain useful.
They deliberately took the available high score even though the resulting
tile would not be a power of two. The choice was acceptable because that tile
was not needed as material for the remaining path; taking it avoided the risk
of losing a turn to a board with only one or two workable chains.

**What happened:** Move 10 ran from lower values through a 512 and 1K into
six 2Ks. Its 20 inputs totalled 14,912, so the long-chain multiplier made it a
74,560-point cash-out and left a 14,912 tile. That tile was not used again.
Before the move, the score was 78,336; afterward it was 152,896, only 9,104
short of the target. A separate 23-tile, 11,840-point move then won at
164,736 against a 162,000 target — a margin of 2,736.

**Interpretation:** A non-power-of-two result is normally poor construction
material, but it need not be a mistake when the chain is a deliberate terminal
cash-out. The relevant question is not whether its result will be reusable;
it is whether taking the available score leaves a separate viable route to the
target.

**What this entry does not establish:** It does not show that making a 4K
instead would have lost, or quantify when the risk of waiting outweighs the
value of a more reusable tile.

**Capture next time:** Record the current score gap, the expected cash-out
points, the remaining workable chains, the placement that prevents a reusable
result, and whether the cash-out tile is ever used again.

### EO-0010 — Start the final harvest at 1K when rebuilding the lower bridge is too costly

**Status:** exploratory player observation; one source play bound
**Recorded:** 2026-09-30
**Source:** owner play report, confirmed as
[level 57, seed 1476286710](../../play-sessions/c449b80ad770dfa7efd70f8c2a0d19fd7fdfe62726c16a0a1e1f3fdba6715cb7.json)

**Player decision:** On this constrained board, the player considered taking
two available chains. Instead, they committed to producing many 1K-or-higher
tiles and to beginning the decisive harvest at 1K. That avoided spending moves
creating the lower 256 and 512 bridge material needed to begin the route from
64.

**What happened:** After twelve preparatory moves, move 13 was a nine-tile
chain of eight 1Ks followed by a 2K. Its input value was 10,240; the
nine-tile threshold applied the ×5 multiplier; and it scored 51,200 points.
A separate 20-tile low-value chain on move 14 then took the score to 133,568,
above the 129,000 target.

**Interpretation:** On a constrained board, a player can trade low-value route
construction for high-value density: build enough compatible 1Ks to cross the
long-chain threshold without requiring a full 64-to-512 lead-in. This is an
alternative to the lower-bridge route, not evidence that it is always better.

**What this entry does not establish:** It does not show that the two
immediate chains would have lost, measure the extra moves needed to rebuild
the 256/512 bridge, or identify the board conditions under which the
1K-starting route wins.

**Capture next time:** Record the two available immediate chains, the moves
and board positions needed to build the 256/512 bridge, the count and
connectivity of 1Ks, and the score/move outcome of the chosen route.

### EO-0001 — A bomb on the 512 changes the endgame plan

**Status:** exploratory player observation; no replay, level, or seed bound yet
**Recorded:** 2026-09-29
**Source:** owner report of a prior game

**What happened:** A bomb was on the 512. That removed the option of simply
holding the scarce bridge tile for the final harvest. The player had to spend
a turn on a four-tile chain to rebuild a 512.

**Player reading:** The forced rebuild changes the route, not merely the
score. In a shorter level it can interrupt the build-and-harvest plan. In a
long level, enough remaining moves can make another route practical: build a
1K chain of nine tiles and organize the endgame from 1024 rather than rebuild
slowly from 64.

**What this entry does not establish:** It does not identify the affected
level, quantify the cost, prove that every bomb-on-512 board has the same
effect, or show which route has the higher score.

**Capture next time:** Record the level, seed if available, remaining moves,
board state when the bomb appears, the chosen rebuild or 1K route, and the
eventual harvest chain.

## Candidate board questions from these observations

These are not adopted descriptors or a new map. They are a better starting
point than chain length and patience when asking whether boards reward
different styles of play.

| Board question | The player decision it could expose | What would need to be captured first |
| --- | --- | --- |
| How much **build opportunity** is there? | Build and hold several high-value tiles, or take value immediately. | When high-value tiles first become available; usable space and moves remaining. |
| How much **gravity-alignment capacity** is there? | Take a route-setting chain that consolidates compatible high values for a 4K, or take immediate points. | Board before and after gravity, the chosen route-setting chain, and the resulting high-value cluster. |
| How much **route connectivity** survives? | Preserve a low-value connector such as a 64, or consume it for immediate score. | The held connector, the tiles it links, and the board that results if it is removed. |
| How fragile is the **starting-only bridge**? | Preserve the sole 512, spend it, or rebuild after disruption. | Starting 512 count, bomb position/timer, and whether another 512 can be assembled in time. |
| How much **harvest runway** remains? | Keep building, or convert now into the long final chain. | Moves remaining at the fork and the eventual high-value harvest chain. |

A future map would only be useful if boards fall into meaningfully different
patterns on questions like these *and* played sessions show a corresponding
change in good decisions. Until then these are prompts for human observation,
not axes with a claim behind them.

## What a saved play can tell us

The current session record preserves the selected chain, its tile values,
points, order in the game, level, and seed. That is enough to recover a
concrete trace such as “create three 2Ks, retain them, then include all three
in a later harvest.”

It does not tell us why the player chose that route, what alternatives were
noticed, or whether the same decision would be good on another board. Add a
short player note or screenshot when those distinctions matter.

## Promotion rule

An observation becomes a formal claim only through a separately recorded
experiment with an explicit question, fixed comparison, and its own result.
Until then, use these entries to choose what to inspect, prototype, or test.
