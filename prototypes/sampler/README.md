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
  order. Optional `at`: the chain must end on that cell (◎).
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

## Screening

`search.js`: a beam solver, a largest-sum harvest proxy, a "do the obvious"
proxy (fill any goal the moment a chain can, otherwise take the largest sum), and
twist checks. Proxies are screens, not the owner's behaviour (AGENTS.md).
`model.test.js` checks every board: no win on the first move; a solver win with
two spare moves that needs at least 4 moves; both proxies lose; the spot, forecast
and rust checks pass (a plan that ignores the twist fails with it).

| # | Board | Kind + layer | Budget | Solver | Harvest / obvious |
|---|---|---|---|---|---|
| 1 | Make It Here | Recipe on the spot; A's output is one of B's ingredients | 7 | 5 | lose / lose |
| 2 | Feed the Next | Three orders, each feeding the next | 7 | 5 | lose / lose |
| 3 | Shared Material | Two orders want the same 24s; too few on the board | 7 | 5 | lose / lose |
| 4 | Three Separate | Control: three unrelated orders | 7 | 5 | lose / lose |
| 5 | See It Coming | Forecast + relay: 96, then 192 using it | 7 | 5 | lose / lose |
| 6 | Dry Well | No refills to one tile, with two frozen tiles | 6 | 4 | stuck / stuck |
| 7 | Through the Gate | Rooms: open the wall with exactly 48, then link both ★ | 8 | 6 | stuck / stuck |
| 8 | Rust | Exact 192 while rust spreads; only a 48 scrapes it | 7 | 5 | lose / lose |

Boards came from seeded generation (pools and filters per kind), keeping only
boards that pass every screen. A browser check at 390 and 1280 px plays the
solver's line on every board to a win, with no page errors and no horizontal
scroll.
