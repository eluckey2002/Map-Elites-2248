# Kinds sampler

A throwaway prototype (2026-10-11). It does not edit the shipped game. Results are
playtest screening, not evidence-ledger evidence.

Build with `node prototypes/sampler/build.js <out.html>`. v1 was played as private
Artifact https://claude.ai/artifact/SQuCNP6SQyC7m7dbSuN3YP (study `kinds-sampler-v1`).
v2 was study `kinds-sampler-v2` (PDL-039). This is v3 (study `kinds-sampler-v3`,
local-storage key `kindsSampler.v3`, PDL-040); runs and answers save to the
Artifact's db with the same schema (`runs`, `answers`), answer ids
`kinds-sampler-v3--<board>`, and the page loads only this study's answers.

## Why

PDL-038 (REVISE): Recipe boards with one order, varied only by numbers, "are all
the same"; board 8, where one order's output is the next order's ingredient,
"looks promising". The owner's principle: a level kind is one core idea plus an
element that adds "puzzle brain strategy". Each board here pairs one kind from
`level-archetypes/11-five-kinds-expanded.md` (project files) with one layer that
makes its steps depend on each other. Three Separate is the control: three
orders that share nothing.

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
32. Filling A, B, C in list order makes three parts, so C is refused; strict
list order can still win only by spending B's part in a throwaway chain, which
costs moves. The witness fills A and C first, then D, then B. This is a rule
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
  with imagined refills (seed 55, 11 or 22), plays the first chain of its
  plan, sees what actually fell, and plans again.

The seed 55 plan and all three re-planners lose on the real board; the witness wins in 4. The v2 check (with
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
- **Forecast**: each column has its own refill queue; the next two show above
  it in the NEXT TILES strip.
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
the witness side by side at the v3 budgets; a proxy standing in for the owner
is still a design claim, not his behaviour.

| Board | Baseline move that loses | Witness move instead |
|---|---|---|
| Make It Here | Move 1: harvest and obvious both take an 18-tile 192 chain of 4s, 8s and 16s ending in the top row, col 5, spending most of A's 16s | 4+4+8+8+8+8+8+16 = 64 ending in the top row, col 2: a mixed chain that builds a 64 for B before filling A |
| Feed the Next | Harvest, move 1: a 560 chain through the 64s. Obvious, move 3: the biggest 64 chain (512) instead of filling B | Move 1 fills A with four 16s ending in the 5th row, col 2; move 3 is 8+8+16+32+64+64+64 = 256 through the part, filling B |
| Feed the Next — Advanced | Harvest, move 1: a 136 chain. Obvious and in-order greedy, move 2: fill B (four 8s) at once, which uses up the second part slot before C | 4+4+8 = 16 in the 4th row, col 4; the witness fills A, then C, then D with both 64 parts, and B last |
| Shared Material | Harvest, move 1: a 4s-to-32 chain of 84. Obvious fills A on move 1 like the witness, then takes that 84 chain on move 2 | Move 1 fills A with four 3s ending in the 4th row, col 4; move 2 is a small 4+4+8 = 16 in the top row |
| Three Separate | Control board. Harvest, move 1: a 1216 chain through the 64s and 128s; obvious fills the 512 order with different 128s than the witness and runs out of moves later | (control, no dependency) |
| See It Coming | Move 1: harvest, obvious and the forecast-blind re-planner (seed 101) all take a 78 chain of 2s to 16s ending in the 6th row, col 3 | 2+2+2+4+4+8+8 = 30 ending in the top row, col 2, where the next tiles land |
| The Drought | Move 1: 16+16+16+32 = 80 ending in the 4th row, col 5; with no refills both proxies have no chains left after move 2 | 4+4+4+4+8+8 = 32 ending in the 3rd row, col 4 |
| Through the Gate | Move 1: 64+64+64 = 192 in the bottom-right corner; both proxies run out of moves | 2+2+4+4+4 = 16 ending in the 5th row, col 3, in the left room |

## Screening

`search.js`: a beam solver, an exhaustive short-win check, the proxies, and
twist checks. Proxies are screens, not the owner's behaviour (AGENTS.md), and
passing them is not evidence. `model.test.js` checks every board:

- **No win in 3 moves or fewer, proven.** `exhaustive()` tries every legal
  chain of any length. Its only pruning cannot skip a win: one move closes at
  most one goal step (an order, a relay stage, the exact tile, opening the
  gate, the connection; no chain can open the gate and pass through it in the
  same move), so states with more open steps than moves left are dropped, and
  when they are equal only chains that close a step are tried, drawn from
  every chain with that step's exact sum (`chainsWithSum`, checked against
  brute force on every board).
- **Budget = best known + 4**, where best known is the shortest line the
  beams find (beam 1000 with chains up to 8 tiles; beam 200 with up to 7).
  Best known is a witness, not a proof that nothing shorter than it exists
  above 3 moves.
- At least 60 legal opening chains of up to 8 tiles; harvest and obvious lose.
- Twist checks: spot (the plan that wins with the spots removed fails with
  them); forecast (no win with useless refills; on See It Coming the blind plan
  and blind re-planner lose); Advanced (strict list order cannot win in the
  best known number of moves, and the in-order greedy player loses; the best
  known line fills out of list order).
- Standing rules: one spawn list, powers of two, the first 200 refills, the
  boss flag, the 7 × 6 gate board, no rust, Make It Here's two-sentence rule
  and one-order-at-a-time flag, and unit tests for spots, parts, any-order
  parts, the gate, and the exhaustive check (a planted 2-move win, and v2
  Drought's 3-move win that the v2 beam missed).

Boards came from seeded generation (pools and filters per kind; scratch
`gen4.js`), keeping only boards that pass every screen.

| # | Board | Kind + layer | Seed | Budget | Best line | Exhaustive ≤ 3 | Opening chains | Harvest / obvious | Twist check |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Make It Here | Recipe on the spot: [16] × 4 on ◎, then [64] × 4 on ◎; four start values | 3 (new) | 8 | 4 | no win | 4708 | lose / lose | spot-blind plan fails |
| 2 | Feed the Next | Parts: [16] × 4, [64] × 4, [256] × 4, each later one with a part | 38 | 8 | 4 | no win | 630 | lose / lose | (parts tier, unchanged) |
| 3 | Feed the Next — Advanced | Any order, cap of two parts, D needs two parts (proposed rule) | 3 (new) | 9 | 5 | no win (4 orders) | 640 | lose / lose | in-order greedy loses; strict order needs 7 |
| 4 | Shared Material | Two orders want the same nine green 3s (eight needed) | 64 | 8 | 4 | no win | 163 | lose / lose | — |
| 5 | Three Separate | Control: [8] × 4, [64] × 4, [128] × 4 | 2 | 9 | 5 | no win | 457 | lose / lose | (control) |
| 6 | See It Coming | Forecast + relay: 256, then 512 using it | 4 (new) | 8 | 4 | no win | 1221 | lose / lose | refills needed; the one blind plan that exists and 3 blind re-planners lose |
| 7 | The Drought | Boss: no refills, make one 512 | 59 (new) | 10 | 6 | no win | 396 | stuck / stuck | — |
| 8 | Through the Gate | 7 × 6 rooms, gate at 128 or more, forecast, link both ★ | 3 (gate 64 → 128) | 8 | 4 | no win | 303 | lose / lose | refills needed |

Lose = out of moves; stuck = no legal chain left. A browser check at 390 and
1280 px plays the best known line on every board to a win, with no page errors
and no horizontal scroll.
