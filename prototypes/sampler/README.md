# Kinds sampler

A throwaway prototype (2026-10-11). It does not edit the shipped game. Results are
playtest screening, not evidence-ledger evidence.

Build with `node prototypes/sampler/build.js <out.html>`. v1 was played as private
Artifact https://claude.ai/artifact/SQuCNP6SQyC7m7dbSuN3YP (study `kinds-sampler-v1`).
v2 was study `kinds-sampler-v2` (PDL-039), v3 `kinds-sampler-v3` (PDL-040). v4 was
`kinds-sampler-v4`. This is v5, the final round (study `kinds-sampler-v5`,
local-storage key `kindsSampler.v5`); runs and answers save to the Artifact's db
with the same schema (`runs`, `answers`), answer ids `kinds-sampler-v5--<board>`,
and the page loads only this study's answers.

## v5: the final round (owner's final review, 2026-10-18)

The owner reviewed every kind and picked what stays
([`prototypes/reviews/2026-10-18-final-review-decisions.md`](../reviews/2026-10-18-final-review-decisions.md)). v5 is one board per
keeper, in this order: Feed the Next, Make It Here (revised), Shared Material, See It
Coming, Through the Gate, The Drought (boss, last). Dropped: Feed the Next — Advanced
and its two-part cap (BL-0032), and the Three Separate control.

Owner picks applied:

- No Next-tiles strip on normal boards; they use the shared refill stream again.
- See It Coming alone shows next tiles, one per column (`forecastShow: 1`).
- The gate opens when a tile of 128 or more sits beside it after a move
  (`gate: {at, tile}` in `model.js`; the old `gate.sum` rule is still supported).
- Make It Here: two short rule sentences, no hint line, one order on screen.
- The Drought is the round 2 board the owner won and liked.

Move limits come from `calibrate.js`, not the solver's best line. Each board's start
grid is played under 30 refill draws (its own seed and 29 others) by two players:
`ordinary()` (no look-ahead) and a beam solver (beam 60, chains up to 7, 20 moves).
The limit is the largest of beam P90 + 2, beam median + 8, and ordinary P80 + 2 where
the ordinary player wins at least half the draws. The Drought has no refills, so it
has one draw. Round 2 gave it 8 moves (the owner won in 4); v5 gives 10, two spare, in line with
the owner's ask for looser limits.

| Board | Ordinary wins | Ordinary P50 / P80 | Beam wins | Beam P50 / P90 | Limit |
|---|---|---|---|---|---|
| Feed the Next | 30/30 | 5 / 5 | 30/30 | 4 / 4 | 12 |
| Make It Here | 17/30 | 7 / 9 | 21/30 | 7 / 16 | 18 |
| Shared Material | 2/30 | 14 / 24 | 21/30 | 11 / 16 | 19 |
| See It Coming | 8/30 | 22 / 30 | 16/30 | 13 / 20 | 22 |
| Through the Gate | 0/30 | — | 21/30 | 5 / 5 | 13 |
| The Drought | 0/1 | — | 0/1 at chains ≤ 7; wins in 2 at chains ≤ 12 | — | 10 |

The percentiles count only the draws a player won. A draw the beam did not win within 20 moves
(beam 60) is left out, so for See It Coming (16/30) and the boards at 21/30 the limit covers
the winnable draws, not every draw; the unwon draws need more than 20 moves or a wider search.
`calibrate.js` also prints the beam P90 over all draws, counting a loss as over 20.

Shared Material, See It Coming and Through the Gate are the hard ones: a player who
does not plan loses most draws (the ordinary player does steer toward the gate and the ★ through its heuristic, but it
looks only one move ahead).
That is the kind (scarce 3s, reading the strip, opening the gate),
so the limits are generous rather than the boards changed. The owner decides after play.
With 22 moves, a player who re-plans each move without looking at the strip can win See It
Coming; the strip helps but is not required (model.test.js reports this, it no longer gates it).

## Why

PDL-038 (REVISE): Recipe boards with one order, varied only by numbers, "are all
the same"; board 8, where one order's output is the next order's ingredient,
"looks promising". The owner's principle: a level kind is one core idea plus an
element that adds "puzzle brain strategy". Each board here pairs one kind from
`level-archetypes/11-five-kinds-expanded.md` (project files) with one layer that
makes its steps depend on each other. Three Separate is the control: three
orders that share nothing.

## Archive: what changed from v3 to v4 (superseded by v5 above)

Evan played v3: "so, again, too few moves." / "you have to few moves. I don't
want to have to undo and hunt for an answer." / "I don't think I am making bad
plays - I think it is just the draws I am getting." / "I don't use the preview
button as a game play thing" / "if you wanted preview to be a part of the game
then show the tiles" / "show the spawn I mean." / "you are creating like a brain
teaser puzzle not a game." (and that v3 was "a regression" from v2).

1. **The spawn is shown on every board that refills.** `forecast: true` on
   every board except The Drought (nothing refills). Forecast mode gives each
   column its own refill queue, so draws no longer depend on play order, and
   the NEXT TILES strip shows the next three per column. Rule text on each board
   names the strip (Make It Here: one short sentence, still two in all). What
   refills can be is unchanged (2 to 64). Why it matters: with one shared
   random stream the best line on the same start grid ranged from 4 to 19
   across 12 other seeds on Shared Material (two seeds had no win) and 3 to 10
   on Three Separate, so a budget set on one seed was hostile to anyone whose
   draws differed.
2. **Looser budgets.** Budget = best known line + 6 (was + 4), and on orders
   boards at least 3 moves per order + 4 (Advanced, four orders: 16). Best known
   is as in v3 (beam 1000 with chains up to 8, beam 200 up to 7, shortest), on
   the forecast board; the exhaustive no-win-in-3 proof is kept.
3. **Acceptance screen, "game, not brain teaser".** `ordinary()` in `search.js`
   is a simple one-move-at-a-time player (fills an order if it can; else builds
   one more of the next order's ingredient, nearest its spot; else merges the
   biggest small group; no undo, no preview, fixed tie-breaks; on gate, relay
   and exact boards it takes the best one-ply result on the beam's heuristic).
   It must win at the budget; where it lost at best + 6 the budget was raised
   by 2 until it won, capped at 3 times the best line (or the floor). Harvest
   and do-the-obvious are now reported facts, not gates (evan prefers loose
   limits over bite); neither wins any v4 board.
4. **Feed the Next — Advanced is explained.** Evan: "that will definitely need
   to be explained better." The rule is unchanged but reads: every order you
   fill leaves a ●; only two ● fit; a third doesn't count (tiles still merge,
   the move is spent); D's four 64s must include two ●. No "parts" word (the
   parts tier, Feed the Next, keeps its wording). A live counter "● n of 2" sits
   under the chips (warning colour at 2 of 2), chips say what each needs
   ("D · [64] × 4, two of them ●"), a one-line "how it works" sits under the
   title, and the refusal reads "Two ● are already on the board. Use them up
   first (D's chain uses two) before filling another order."
5. **"Tiles you merge count too."** Evan asked whether he could make a 16 and
   use it: yes, any tile showing the right value counts. Every orders board says
   so, and a chain that mixes values says "every tile in the chain must show 16".
6. **Through the Gate wording.** Evan read "a chain of 128" as needing a 128
   tile. The rule now says "a chain that adds up to 128 or more ends on a tile
   beside the gate"; a chip says the same; the status line says when a chain
   adds up to 128 or more but doesn't end beside the gate (and the reverse);
   the gate is a striped, outlined wall cell and the tiles beside it are
   dotted while it is shut. No rule change.
7. **Layout.** The strip, order chips, the ● counter and the board fit the first
   screen at 390 × 844 and 1280 × 720 on every board (tiles at most 48 px
   phone, 40 px laptop, at least 36 px). On a laptop the Merge/Clear buttons and
   status line moved under the board.

Proposed, not owner-approved: per-column refill queues. The spawn values (2 to 64,
never a 3) and the random draw are unchanged; only the order draws are used
changes (per column, not per move), which is what lets the strip show exactly
what drops in. The owner asked for the draws to be shown, and See It Coming
already used this mechanism in versions 2 and 3, but he has not been asked about
it on every board. Owner play of version 4 decides whether it stays.

Boards re-picked. Forecast mode changes the refill stream, so the v3 seeds no
longer gave the same boards. Start grids are all v3's. Make It Here moved to
seed 42 and Advanced to seed 17 (the ordinary player wins there and the exhaustive check, spot check and cap check
pass); every other board keeps its v3 seed. Kept despite the ordinary player
losing: Shared Material, See It Coming, The Drought and Through the Gate (see
the table and "Limits"). See It Coming seed 4 was kept over seeds 6, 61 and 74
(where the ordinary player wins) because on 61 and 74 a forecast-blind
re-planner also wins, so the strip would not matter. Evan stalled on Make It
Here and Advanced in v3; the floor and the new budgets are the fix, the designs
are unchanged.

### Robustness: the same start grid under other seeds

Best line by the beam (200 wide, chains up to 8 tiles, up to 14 moves; blank =
none found) for seeds 11 to 16, not a gate:

| Board | Home seed best | Seeds 11, 12, 13, 14, 15, 16 |
|---|---|---|
| Make It Here | 6 | 5, 8, 4, -, 14, 4 |
| Feed the Next | 4 | 4, 4, 4, 4, 4, 4 |
| Feed the Next — Advanced | 5 | 5, 5, 6, 5, 5, 5 |
| Shared Material | 5 | 4, 13, 5, 6, 5, 8 |
| Three Separate | 6 | 5, 5, 4, 6, -, 6 |
| See It Coming | 4 | no win under most seeds (seeds 1 to 17: wins only on 1, 3, 7, 13, 16, 17) |
| Through the Gate | 4 | 4, 4, 5, -, 4, 4 |

The ordinary player on the same 12 other seeds (11 to 22) at each board's
budget wins: Make It Here 3, Feed the Next 12, Advanced 1, Three Separate 3,
the others 0.

### Limits

- The ordinary player wins at the budget on 4 of 8 boards (home seed): Make It
  Here, Feed the Next, Advanced, Three Separate. It loses on Shared Material,
  See It Coming, The Drought and Through the Gate even at the cap (3 times the
  best line), and on none of 80 seeds for Shared Material or Through the Gate.
  The target was 6 of 8. It is a crude player (no look-ahead, no sense of
  scarcity), so a loss means "an ordinary line does not stumble into this", not
  that the board is hard; those boards keep their v3 designs and the floor.
- Advanced: the ordinary player wins on its last move (16 of 16).
- The Drought: nothing refills, so extra moves do not help a player who runs out
  of chains; its budget is best + 6 = 12.
- Harvest and do-the-obvious: lose on every board (reported only). "Proxy wins at
  +6": none.

## What changed from v2 (PDL-040)

The owner played v2 on 2026-10-11. Every change below comes from those notes;
the v2 standing rules (one refill rule, powers of two, only a boss changes
refills, no leave-N goals, `[tile] × N` chips, plain words) all stay.

1. **Rust is retired.** "rust wasnt even a factor": he won in 3 moves where
   the solver's witness said 7. The board, the rust rules, the scrape proxy and
   the rust UI are gone; `model.js` refuses a board that asks for rust. Eight
   boards.
2. **Looser moves.** "these are all very tight and creates too much pressure".
   Every budget is now the best known line **+ 4** (was + 2). Best known = the
   shortest line from the screening beams (beam 1000 with chains up to 8 tiles,
   and the v2 beam 200 / 7, which finds See It Coming's 4-move line where the
   wide beam does not) after an **exhaustive** check that no board can be won
   in 3 moves or fewer. v2's Rust had a 3-move win made of long chains that
   the beam never tried; the exhaustive check found the same kind of win on v2
   See It Coming, The Drought and Through the Gate, so those three are new
   boards (below). The harvest and do-the-obvious proxies still lose every
   board at the looser budgets.
3. **Make It Here, calmer screen.** "there is alot going on ... the design
   is" (the concept is fine). Removed or quieted: order B's chip is greyed and
   small until A is filled; B's ingredient rings are hidden until then (B's
   spot stays, dotted and quiet, because planning where A lands is the whole
   idea); the ingredient counter shows only the current order; the rule is two
   short sentences; the hint line is gone; the subtitle is one short line. The
   new board starts with four tile values (4, 8, 16, 64) instead of six.
4. **Feed the Next — Advanced is a new board with a new rule.** "this was the
   exact same as previous board - how was this advanced?" (solved in a
   minute). v1's board and its 3-family spawn list are gone; Advanced now
   follows the powers-of-two rule. *Rule proposed, not owner-approved:* four
   orders, filled in any order; every fill turns its tile into a part (●); at
   most two parts on the board, and a fill that would make a third does not count (the tiles still merge and the move is spent);
   order D's chain must include **two** parts. See "Advanced: why the rule
   differs from the spec" below.
5. **See It Coming, forecast visible and needed.** "i didnt even notice the
   preview though!" The forecast strip is now labelled **NEXT TILES**, dark
   and high-contrast with an orange edge, uses tile-coloured chips (nearest at
   the bottom, right above its column), and the rule text starts with it
   (Through the Gate uses the same strip). The new board (seed 4: make 256,
   then 512 using it) is screened so that ignoring the forecast loses: see
   "Forecast check".
6. **Through the Gate** keeps its v2 board (seed 3, "this was fun") with the
   gate number raised from 64 to 128: at 64 the exhaustive check found a
   3-move win. **The Drought** ("this was good") had a 3-move win, so it is a
   new seed (59) of the same kind. Feed the Next, Shared Material and Three
   Separate keep their boards with new budgets.
7. **Smaller boards.** Owner: "the scale needs to be reduced" (the on-screen
   board). Tiles are about a quarter smaller (at most 48 px on a phone, 40 px
   on a laptop, never under 36 px for tapping), and `fitBoard()` in `app.js`
   sizes the board so the board, the order chips and the forecast strip fit
   the first screen at 390 × 844 and 1280 × 720. On a phone the board
   picker is one row and the wordmark is hidden.

### Advanced: why the rule differs from the spec

The PDL-040 spec proposed "every order after the first must include a part"
with the two-part cap and any order. Under that rule the cap can never bite:
the first fill makes one part; every later fill must include a part, which
merges away as the fill makes its own, so the count stays at one; and a
chain that is not a fill can only remove parts. The board never holds two
parts, let alone three (the same reason the cap never binds on the parts
tier, below). So this build keeps the spec's any-order, part-per-fill and
cap clauses and replaces "every later order needs a part" with "D needs two
parts". A and C both make 64, D wants four 64s including two parts, B makes a
32. Filling A, B, C in list order makes three parts, so C is refused. On the
shipped seed (17) strict list order still ties the best line (5 moves, found
with chains up to 8; the earlier claim that it is slower held only for chains
up to 7). Any-order play is a freedom there, not a speed-up. Seeds 1 to 3 do
make list order slower, but the ordinary player loses all three. The witness
fills A and C first, then D, then B. This is a rule
change the owner has not seen; treat it as a candidate.

### Forecast check (See It Coming)

The forecast-aware witness is the beam solver, which sees the real refills.
Two forecast-blind players must lose at the same budget:

- **Blind plan**: the solver plans the whole game with a different refill
  seed (55, 11, 22), and that plan is played on the real board. Only seed 55
  has a win at all (4 moves with its own refills); that plan is played on the
  real board and does not win. Seeds 11 and 22 have no win in the search, so
  they prove nothing either way. The test requires at least one replayable
  plan, so the check cannot pass on an empty result.
- **Blind re-planner**: every move, the solver re-plans from the real board
  with imagined refills (seed 101, 55, 11 or 22), plays the first chain of its
  plan, sees what actually fell, and plans again.

The seed 55 plan and all four re-planners lose on the real board; the witness wins in 4. The v2 check (with
useless refills there is no win) still holds too.

## What changed from v1 (PDL-039)

The owner played v1 on 2026-10-11 and set standing rules for v2:

1. **One refill rule.** Every normal board refills from 2, 4, 8, 16, 32, 64. No
   per-board spawn lists.
2. **Powers of two.** Every order, target, gate and scrape number is a power of
   two. Exceptions: Feed the Next — Advanced (v1's Feed the Next, kept as built:
   "a keeper - advanced level") and the green tiles placed on Shared Material.
3. **Only a boss changes refills**, and it says so before the first move.
4. **Green (3-line) tiles are placed, never refilled**, and drawn in a different
   colour (the CONTEXT.md family idea: 2-line tiles sand to brown, 3-line green).
5. No "leave N tiles" goals (Dry Well is gone); no exact-sum subtraction.
6. **Plain rules.** Order chips show the ingredient as a small tile and a count,
   `[32] × 4`, never `128 = 4 × 32`.

Board changes: Feed the Next is a new easier tier with the parts rule; v1's
Feed the Next stays as Advanced; Dry Well became The Drought (boss); Through the
Gate is 7 × 6 with the forecast on and opens on a chain of *at least* the gate
number; Rust scrapes on a chain of *at least* the scrape number. New screens: at
least 60 legal opening chains (v1 Through the Gate had 26 and felt starved), and
the first 200 refills of every board stay inside its spawn list. Added after the
owner beat v1 Rust by scraping a few times and then making one long chain: a
"scrape, then one long chain" proxy that must lose on Rust.

## Rules

Chains are unchanged (`solver/engine`): touching tiles, diagonals included, at
least three, first two equal, then equal or double; the sum lands on the last
tile; gravity; seeded refills. `model.js` adds:

- **One at a time** (`oneAtATime`, Make It Here): orders fill strictly in list
  order, A then B. The model refuses a B fill while A is open, so the page and
  the rules agree (Codex review of #86).

- **Orders** (`orders`): one chain made only of the ingredient, four of them.
  Optional `at`: the chain must end on that cell (◎).
- **Parts** (`parts`, v2 Feed the Next): orders fill in turn; the tile an order
  makes becomes a part (●); every later order's chain must include at least one
  part (any part); an order fill that would leave a third part on the board is
  not counted, with a status message; the tiles still merge and the move is spent. The page counts `parts: n/2`.
- **Any-order parts** (`parts` + `anyOrder`, v3 Advanced, proposed): orders
  fill in any order; every fill makes a part; an order needs `o.parts` parts in
  its chain (D needs two); the same cap of two parts refuses a third. Two
  screening-only flags exist for search.js: `strictTurn` (fill strictly in list
  order) and `goal.cap` (change the cap).
- **Relay** (`relay`): make each stage in turn; each later stage must include
  the tile the last one made (●).
- **Exact** (`exact`: make one tile of the target), **Connect** (`connect`: one
  chain through every ★).
- **Forecast**: each column has its own refill queue; the next three show above
  it in the NEXT TILES strip. Three covers any chain with up to four tiles stacked in one column; a straight line of five or six in one column can still deal a tile the strip does not show (rare; reported, not prevented).
- **Boss** (`boss`, with `refill:false`): a banner names the boss and what it
  changes until the first move.
- **Stone** walls and a **gate**: a stone cell that opens when a chain whose sum
  is at least `gate.sum` ends beside it. *The "at least" gate rule is proposed,
  to be confirmed by owner play.*
- **Rust**: retired in v3 (PDL-040); a board that asks for it is refused.

Two things the rules do not do, found while building v2:

- **Chains can make green tiles.** Three equal 2-line tiles sum to a 3-line
  value (4 + 4 + 4 makes 12), so "refills can never make green" holds for the
  tiles that fall in but not for tiles players build. Shared Material therefore
  uses 3s: no chain can make a 3 (the smallest chain sum is three times the
  smallest tile, 2), so its nine placed 3s are the only ones there will ever be.
  Any board can still show a green 12 or 24 that a player built.
- **The two-part limit cannot bind on Feed the Next.** Orders fill in turn and
  every order after A must include a part, which merges away as the new part is
  made, so the board never holds more than one part from normal play. The limit
  is coded and unit-tested on a hand-built position; on this board the counter
  never passes 1/2.

## Owner baseline and where it goes wrong

Captured baselines (PLAYTEST-DECISION-LEDGER.md): PDL-008 (`7803db10`),
build-and-harvest: build several big tiles, then join them in one long mixed
chain. PDL-037: on Recipe boards the owner filled orders with clean one-value
chains and never spent an ingredient in a mixed chain. PDL-039's v1 Rust play
(scrape, then one long chain) no longer applies: Rust is retired.

The harvest proxy (largest-sum chain every move) stands in for PDL-008; the
"do the obvious" proxy (fill any goal the moment a chain can, otherwise the
largest sum) for PDL-037. Both lose every board at the v3 budgets (table
below). Advanced adds an in-order greedy player (fill orders strictly A, B,
C, D as soon as a chain can, otherwise the largest sum); See It Coming adds the
forecast-blind players. These are design claims; owner play decides.

### The exact state where each baseline goes wrong

The first move where each proxy leaves the best known line, from the opening
board unless a move number is given. Rows count from the top, columns from the
left. Produced by a scratch script (`diverge3.js`) that plays each proxy and
the witness side by side at the v4 budgets; a proxy standing in for the owner
is still a design claim, not his behaviour.

| Board | Baseline move that loses | Witness move instead |
|---|---|---|
| Make It Here | Move 1: harvest and obvious both take an 18-tile 192 chain of 4s, 8s and 16s ending in the top row, col 5 | 4+4+8+16+16+16 = 64 ending in the 3rd row, col 1: a mixed chain that builds a 64 for B before filling A |
| Feed the Next | Harvest, move 1: a 560 chain through the 64s. Obvious fills A at once like the witness (a different four 16s) and then loses | Move 1 fills A with four 16s ending in the 5th row, col 1 |
| Feed the Next — Advanced | Harvest, move 1: a 136 chain. Obvious and in-order greedy fill A at once (a different four 16s) and run out of moves or chains | Fills A, then C, then D with both ● 64s, then B |
| Shared Material | Harvest, move 1: a 4s-to-32 chain of 84. Obvious fills A on move 1 like the witness, then takes that 84 chain on move 2 | Move 1 fills A with four 3s ending in the 4th row, col 4; move 2 is a small 4+4+8 = 16 in the top row |
| Three Separate | Control board. Harvest, move 1: a 1216 chain; obvious fills the 512 order first with the same 128s and runs out of chains | (control, no dependency) |
| See It Coming | Move 1: harvest, obvious and the forecast-blind re-planner (seed 101) all take a 78 chain of 2s to 16s ending in the 6th row, col 3 | 2+2+2+4+4+8+8 = 30 ending in the top row, col 2, where the next tiles land |
| The Drought | Move 1: 16+16+16+32 = 80 ending in the 4th row, col 5; with no refills both proxies have no chains left after move 2 | 4+4+4+4+8+8 = 32 ending in the 3rd row, col 4 |
| Through the Gate | Move 1: 64+64+64 = 192 in the bottom-right corner; both proxies run out of moves | 2+2+4+4+4 = 16 ending in the 5th row, col 3, in the left room |

## Screening

`search.js`: a beam solver, an exhaustive short-win check, the proxies, the
ordinary-player baseline, and twist checks. Screens are not evidence (AGENTS.md).
`model.test.js` checks every board:

- **No win in 3 moves or fewer, proven** by `exhaustive()` (every legal chain of
  any length; pruning that cannot skip a win: one move closes at most one goal
  step, so states with more open steps than moves left are dropped, and when
  they are equal only chains that close a step, drawn from `chainsWithSum`,
  are tried; `chainsWithSum` is checked against brute force on every board).
- **Budget = best known + 6, floor 3 per order + 4**, capped at 3 times best
  where the ordinary-player screen raised it. `level.best` is the shortest line
  the beams find (beam 1000 / chains up to 8 and beam 200 / up to 7); the test
  re-finds it and checks that no beam finds a shorter one. Best known is a
  witness, not a proof that nothing shorter than it exists above 3 moves.
- At least 60 legal opening chains of up to 8 tiles.
- Every refilling board shows the Next tiles; the Drought has none.
- Twist checks: spot (the plan that wins with the spots removed fails with
  them); Through the Gate and See It Coming need the refills (no win with
  useless ones); See It Coming: forecast-blind whole plans and forecast-blind
  re-planners lose (whole-plan check on seeds 55, 11, 22; re-planner on 101, 55, 11, 22 — the `necessity()` defaults); Advanced: the in-order greedy player loses (strict list order ties the best line on seed 17; see the Advanced section), a
  plan made without the cap fails.
- The ordinary player wins at the budget on Feed the Next and Three Separate
  (the rest reported; see "Limits").
- Standing rules: one spawn list, powers of two, the first 200 refills, the boss
  flag, the 7 × 6 gate board, no rust, Make It Here's two-sentence rule, unit
  tests for spots, parts, any-order parts, the gate and the exhaustive check.

| # | Board | Seed | Best line | Budget | Exhaustive ≤ 3 | Opening chains | Harvest / obvious (reported) | Ordinary player |
|---|---|---|---|---|---|---|---|---|
| 1 | Make It Here: [16] × 4 on ◎, then [64] × 4 on ◎ | 42 (re-picked) | 6 | 12 | no win | 4708 | lose / lose | wins in 6 |
| 2 | Feed the Next (parts) | 38 | 4 | 13 (floor) | no win | 630 | lose / lose | wins in 5 |
| 3 | Feed the Next — Advanced (proposed rule) | 17 (re-picked) | 5 | 16 (floor) | no win | 640 | lose / lose | wins in 16 |
| 4 | Shared Material | 64 | 5 | 15 (raised) | no win | 163 | lose / lose | loses |
| 5 | Three Separate | 2 | 6 | 17 (raised) | no win | 457 | lose / stuck | wins in 16 |
| 6 | See It Coming (256, then 512 using it) | 4 | 4 | 12 (raised) | no win | 1221 | lose / lose | loses |
| 7 | The Drought | 59 | 6 | 12 | no win | 396 | stuck / stuck | stuck |
| 8 | Through the Gate (128 or more) | 3 | 4 | 12 (raised) | no win | 303 | lose / lose | loses |

Lose = out of moves; stuck = no legal chain left. "Raised" = best + 6 (or the
floor) was raised 2 at a time toward an ordinary-player win, up to the cap; it
did not win. A browser check at 390 and 1280 px plays the best known line on
every board to a win with no page errors and no horizontal scroll, and a fit
check measures that the board, chips and strip sit in the first screen at 390 ×
844 and 1280 × 720.
