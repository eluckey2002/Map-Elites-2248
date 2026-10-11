# Kinds sampler

A throwaway prototype (2026-10-11). It does not edit the shipped game. Results are
playtest screening, not evidence-ledger evidence.

Play: private Artifact https://claude.ai/artifact/SQuCNP6SQyC7m7dbSuN3YP, built with
`node prototypes/sampler/build.js <out.html>`. Runs and answers save to the
Artifact's db (`runs`, `answers`; study `kinds-sampler-v1`).

## Why

PDL-038 (REVISE): Recipe boards with one order, varied only by numbers, "are all
the same"; board 8, where one order's output is the next order's ingredient,
"looks promising". The owner's principle: a level kind is one core idea plus an
element that adds "puzzle brain strategy". Each board here pairs one kind from
`level-archetypes/11-five-kinds-expanded.md` (project files) with one layer that
makes its steps depend on each other. Three Separate is the control: three
orders that share nothing.

## Rules

Chains are unchanged (`solver/engine`): touching tiles, diagonals included, at
least three, first two equal, then equal or double; the sum lands on the last
tile; gravity; seeded refills. `model.js` adds:

- **Orders** (`orders`): one chain made only of the ingredient, summing to the
  order. Optional `at`: the chain must end on that cell (◎). With `feeds`, orders
  fill in turn and each later order's chain must include the tile the previous
  order made (●).
- **Relay** (`relay`): make each stage's exact sum in turn; every stage after
  the first must include the tile the last stage made (●).
- **Exact** (`exact`), **Leftover** (`leftover`), **Connect** (`connect`: one
  chain through every ★).
- **Forecast**: each column has its own refill queue; the next two show above it.
- **No refills** (`refill:false`), **stone** walls, a **gate** (a stone cell that
  opens when a chain of exactly `sum` ends beside it).
- **Rust** spreads to one orthogonal neighbour every `every` moves and can't be
  chained. A chain ending beside it clears it; with `scrape`, only a chain of
  exactly that sum does. `ice:true` is rust that never spreads (frozen tiles).

Refills mix in 6, 12 and 24 (owner, PDL-038: too few spawn values let chains run
to 22 tiles). Shared Material leaves out 12 and 24 so the shared 24s stay scarce.

## Owner baseline and where it goes wrong

Captured baselines (PLAYTEST-DECISION-LEDGER.md): PDL-008 (`7803db10`),
build-and-harvest: build several big tiles, then join them in one long mixed
chain. PDL-037: on Recipe boards the owner filled orders with clean one-value
chains and never spent an ingredient in a mixed chain.

Exact opening states (column, row, zero-based) where the long mixed chain is the
wrong move:

- **Make It Here:** the longest chain is 7×12 + 4×24 + 48, twelve tiles ending at
  (2,1). It spends the board's only 48 and four of the 24s that make more.
- **Feed the Next:** 4+4+8×6+16, nine tiles ending at (4,4), spends six of the
  8s that order A needs.
- **Shared Material:** 6×12 + 24 + 24, eight tiles ending at (2,3), spends two
  of the four 24s and six of the 12s that build the missing ones.
- **Rust:** 5×12 + 2×24 + 48 = 156, eight tiles ending at (2,5), spends the only
  48, which is also the only rust scraper.

Against the PDL-037 clean-fill habit: filling each order the moment a clean
chain allows it is the "do the obvious" proxy below, and it loses every board.
On Shared Material it never fills either order. These are design claims;
owner play (BL-0029) decides.

## Screening

`search.js`: a beam solver, a largest-sum harvest proxy, a "do the obvious"
proxy (fill any goal the moment a chain can, otherwise take the largest sum), and
twist checks. Proxies are screens, not the owner's behaviour (AGENTS.md).
`model.test.js` checks every board: no win on the first move; a beam-solver
witness with two spare moves that takes at least 4 moves (a witness, not a proof
that no shorter route exists); both proxies lose; and the twist checks pass:

- spot: the plan that wins with the spots removed fails with them;
- forecast: the board can't be won with useless refills, and plans made against
  three other refill sequences all fail on the real one;
- rust: the plan that wins with no rust fails once it spreads. (Whether harvest
  would win with no rust is reported, not required.)

| # | Board | Kind + layer | Budget | Solver | Harvest / obvious |
|---|---|---|---|---|---|
| 1 | Make It Here | Recipe on the spot; A's output can be one of B's ingredients | 7 | 5 | lose / lose |
| 2 | Feed the Next | Three orders in turn; each must use the last one's ● tile | 7 | 5 | lose / lose |
| 3 | Shared Material | Two orders want the same 24s; too few on the board | 7 | 5 | lose / lose |
| 4 | Three Separate | Control: three unrelated orders | 7 | 5 | lose / lose |
| 5 | See It Coming | Forecast + relay: 96, then 192 using it | 7 | 5 | lose / lose |
| 6 | Dry Well | No refills to one tile, with two frozen tiles | 6 | 4 | stuck / stuck |
| 7 | Through the Gate | Rooms: open the wall with exactly 48, then link both ★ | 8 | 6 | stuck / stuck |
| 8 | Rust | Exact 192 while rust spreads; only a 48 scrapes it | 7 | 5 | lose / lose |

Solver column: moves in the beam-search witness. Boards came from seeded generation (pools and filters per kind), keeping only
boards that pass every screen. A browser check at 390 and 1280 px plays the
solver's line on every board to a win, with no page errors and no horizontal
scroll.
