# Kinds sampler

A throwaway prototype (2026-10-11). It does not edit the shipped game. Results are
playtest screening, not evidence-ledger evidence.

Build with `node prototypes/sampler/build.js <out.html>`. v1 was played as private
Artifact https://claude.ai/artifact/SQuCNP6SQyC7m7dbSuN3YP (study `kinds-sampler-v1`).
This is v2 (study `kinds-sampler-v2`, PDL-039); runs and answers save to the
Artifact's db with the same schema (`runs`, `answers`).

## Why

PDL-038 (REVISE): Recipe boards with one order, varied only by numbers, "are all
the same"; board 8, where one order's output is the next order's ingredient,
"looks promising". The owner's principle: a level kind is one core idea plus an
element that adds "puzzle brain strategy". Each board here pairs one kind from
`level-archetypes/11-five-kinds-expanded.md` (project files) with one layer that
makes its steps depend on each other. Three Separate is the control: three
orders that share nothing.

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

- **Orders** (`orders`): one chain made only of the ingredient, four of them.
  Optional `at`: the chain must end on that cell (◎).
- **Parts** (`parts`, v2 Feed the Next): orders fill in turn; the tile an order
  makes becomes a part (●); every later order's chain must include at least one
  part (any part); an order fill that would leave a third part on the board is
  refused, with a status message. The page counts `parts: n/2`.
- **Feeds** (`feeds`, Advanced only): v1's rule; each later order must include
  the tile the previous order made.
- **Relay** (`relay`): make each stage in turn; each later stage must include
  the tile the last one made (●).
- **Exact** (`exact`: make one tile of the target), **Connect** (`connect`: one
  chain through every ★).
- **Forecast**: each column has its own refill queue; the next two show above it.
- **Boss** (`boss`, with `refill:false`): a banner names the boss and what it
  changes until the first move.
- **Stone** walls and a **gate**: a stone cell that opens when a chain whose sum
  is at least `gate.sum` ends beside it. *The "at least" gate rule is proposed,
  to be confirmed by owner play.*
- **Rust** can't be chained and spreads to one orthogonal neighbour after every
  move. A chain whose sum is at least `scrape` that ends beside rust clears it.

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
chains and never spent an ingredient in a mixed chain. PDL-039: on v1 Rust the
owner scraped a few times, then made one long chain.

The harvest proxy (largest-sum chain every move) stands in for PDL-008; the
"do the obvious" proxy (fill any goal the moment a chain can, otherwise the
largest sum) for PDL-037; the scrape-then-long-chain proxy for PDL-039's Rust
play. All three lose where they apply (table below). On Shared Material the
obvious proxy fills order A on its first move with the first four 3s it finds and
never fills B within the budget. These are design
claims; owner play decides.

## Screening

`search.js`: a beam solver, the three proxies, and twist checks. Proxies are
screens, not the owner's behaviour (AGENTS.md), and passing them is not evidence.
`model.test.js` checks every board: no win on the first move; at least 60 legal
opening chains of up to 8 tiles (Advanced keeps its v1 screen and is exempt); a
beam-solver witness with two spare moves that takes at least 4 moves (a witness,
not a proof that no shorter route exists); the proxies lose; and the twist
checks pass:

- spot: the plan that wins with the spots removed fails with them;
- forecast: the board can't be won with useless refills, so the refills matter.
  Whether *seeing* them in advance matters is not screened;
- rust: the plan that wins with no rust fails once it spreads (on Rust, harvest
  with no rust at all would win: reported, not required).

It also checks the standing rules: one spawn list, powers of two, the first 200
refills of every board (Drought: none), the boss flag, the 7 × 6 gate board, and
unit tests for parts, the "at least" gate and the "at least" scrape.

Boards came from seeded generation (pools and filters per kind), keeping only
boards that pass every screen.

| # | Board | Kind + layer | Seed | Budget | Solver | Opening chains | Harvest / obvious |
|---|---|---|---|---|---|---|---|
| 1 | Make It Here | Recipe on the spot: [16] × 4 on ◎, then [64] × 4 on ◎ | 1 | 7 | 5 | 690 | lose / lose |
| 2 | Feed the Next | Parts: [16] × 4, [64] × 4, [256] × 4, each later one with a part | 38 | 6 | 4 | 630 | lose / lose |
| 3 | Feed the Next — Advanced | v1 board 2, unchanged | 61 | 7 | 5 | 163 | lose / lose |
| 4 | Shared Material | Two orders want the same nine green 3s (eight needed) | 64 | 6 | 4 | 163 | lose / lose |
| 5 | Three Separate | Control: [8] × 4, [64] × 4, [128] × 4 | 2 | 7 | 5 | 457 | lose / lose |
| 6 | See It Coming | Forecast + relay: 128, then 256 using it | 20 | 6 | 4 | 3277 | lose / lose |
| 7 | The Drought | Boss: no refills, make one 512 | 22 | 8 | 6 | 133 | stuck / stuck |
| 8 | Through the Gate | 7 × 6 rooms, gate at 64 or more, forecast, link both ★ | 3 | 7 | 5 | 303 | lose / lose |
| 9 | Rust | Make one 512; rust spreads; scrape with 64 or more | 30 | 9 | 7 | 855 | lose / lose (scrape-then-long: stuck) |

Solver column: moves in the beam-search witness. Lose = out of moves; stuck = no
legal chain left. A browser check at 390 and 1280 px plays the solver's line on
every board to a win, with no page errors and no horizontal scroll.
