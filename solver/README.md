# Level solver

A headless reimplementation of the game rules, a bot that plays it, and a
sweep runner — built to check whether levels are actually winnable, since the
board is randomized (no seedable RNG in `game.js`) and nobody had checked
levels 40-50 (the bomb levels) by hand.

## Files

- `engine.js` — rules ported from `../src/game.js`: grid init, chain
  validation/execution/scoring, gravity, spawning, blocker ticking, bomb
  checks. Has its own seedable PRNG (`makeRng`, mulberry32) so runs are
  reproducible. `game.js` itself exports `LEVELS` (guarded so the browser init
  code still only runs when `document` exists) — this is the one source of
  truth for level data, not duplicated here.
- `bot.js` — `chooseMove(state, { lookaheadRngFactory })`: defuses the most
  urgent reachable bomb first, else picks the chain maximizing (this move's
  points + a simulated best next move), a 2-ply lookahead.
- `sweep.js` — `playLevel(levelData, rng)` plays one level to completion;
  `sweepLevel(levelData, seedCount)` runs it across seeds 0..N and reports
  win rate + loss reasons.
- `run-sweep.js` — CLI: `node run-sweep.js [from-to]` (default `40-50`), 300
  seeds per level.
- `verify-loop.js` — deterministic done-check for the `lockout-fix-2026-08-08`
  orch-loop run (see below): level 1/11 no-regression, level 26 win-rate
  target, bomb-exploded no-regression, all in one script/exit-code.
- `tests/` — 53 tests, `node --test solver/tests/*.test.js`.
- `../.orch/runs/lockout-fix-2026-08-08/worklog.md` and
  `../.orch/tickets/lockout-fix-2026-08-08/` — the full record of the
  two-iteration tuning loop below: frozen goal, per-iteration diagnosis,
  every measured/rejected variant, and the closing decision.

## Chain search: two strategies, deliberately different

- `findTopChains` / `findBestChain` (exhaustive DFS) — correct and complete,
  but cost explodes with chain length on dense boards (~7s for one move on a
  real level with search uncapped). Used only for bomb-defusal search
  (`mustEndAt`), where the search space is naturally pruned by needing to
  land on one specific tile.
- `buildGreedyChain` / `findGreedyChains` (no-backtracking walk) — linear
  time, used for everything else. **Counterintuitive tuning finding:** at
  each step it takes the *lowest*-value valid neighbor, not the highest.
  Low-value tiles are the most abundant and best-connected, so favoring them
  keeps the walk alive far longer than jumping to the biggest neighbor (which
  strands it at a dead end sooner) — measured length 24 / 390pts vs length 8
  / 132pts on the same board. Length pays off directly through the chain
  multiplier, so a longer low-value walk consistently beats a short
  high-value one.

## Final findings (2026-08-08 session)

**Original question: are levels 40-50 (the bomb levels) unfair?**
**Answer: bombs specifically are not the risk.** Bomb-exploded rate stayed
~0% (0-1 per 300-550 seeds) across every sweep run this session — the
defuse-first priority in `chooseMove` works, and bombs are almost never what
kills a run. The real risk is a score-pace ceiling that has nothing to do
with bombs (it's fully present on level 26, which has none) and that every
level from `minChain: 4` onward inherits, including 40-50, whose score
targets only climb higher (20000-25000 vs level 26's 13000).

**The score-pace ceiling, quantified.** A full `sweepLevel` pass (300 seeds
per level) on 40-50 showed 0% win rate everywhere, dominated by "no valid
moves" board lockout (60-79% of losses). That lockout was tracked down and
fixed via a two-iteration `orch-loop` run (`../.orch/runs/lockout-fix-2026-08-08/`,
full detail there — this is the summary):

1. **Lockout mechanism, iteration 1.** Every merge leaves one remnant tile
   valued at the chain's *sum*. Spawns are only 2/4/8 and extensions are
   equal-or-double, so a sum outside the power-of-two lattice can never be
   matched again — one dead cell accrues per move. Fix: `findGreedyChains`
   now prefers the highest-scoring chain prefix whose sum is a power of two
   (`isMergeableSum`/`preferMergeableSum` in `engine.js`). Result: level-26
   lockouts 50/100→0/100 seeds, dead cells 31/40→6/40, level 11 67%→97% win.
2. **Score-pace ceiling, iteration 2.** With lockout solved, level 26 still
   lost 100% of the time to running out of moves (~6655/13000 avg). Root
   cause: merges *conserve* board value (never create it) — the only new
   value comes from spawns refilling emptied cells, capping total value ever
   available at ~1214 for a level-26 game. Score = (value chained) ×
   multiplier (cap 5.0x). Fix (`bot.js`: wider candidate list + a
   turnover-value term rewarding cells emptied, not just points) pushed the
   multiplier to 4.52/5.0 — near-maxed — for avg score 6655→7583. But
   *recycling* (re-chaining remnants) stayed flat at ~1.39x, and reaching
   13000 needs **2.14x recycling at a perfect 5.0x multiplier**. Structural
   cause: spawns (2/4/8) and remnants (32/64) don't share a bridge value
   under equal-or-double extension — a "hole at 16" — so most of a
   late-game board's big-tile value is permanently unreachable.

**Verdict.** 15 approaches total were measured and rejected across both
iterations (full tables in the tickets) trying to raise the recycling rate;
none moved it meaningfully. Two independent fresh-context diagnoses,
different methods, same structural conclusion: **level 26's target sits
above what the merge rules can plausibly deliver — this reads as a
level-design finding, not a solver/bot capability gap.** Owner-decided
2026-08-08 to close the tuning loop here rather than continue (worklog
`## terminal`, `blocked` — 2 of 4 bound iterations were left unspent by
choice).

Current bot, for reference (final state):

| Level | Win rate | Notes |
|---|---|---|
| 1 (trivial) | 100% | — |
| 11 (minChain 3 starts) | 93-97% | was 67% before the lockout fix |
| 26 (minChain 4, no bombs) | 0% | lockout-free; pure score-pace ceiling (see above) |
| 40-50 (bombs) | 0% | same ceiling, inherited; bombs ~0% of deaths |

**If this is ever revisited:** the one lever the loop didn't try is *remnant
placement* — steering which cell a chain's survivor lands on (currently
whatever the walk happens to end on) so successive remnants land adjacent
and form their own `minChain: 4` chain, directly raising the recycling rate.
Flagged by iteration-2 as "a real change, not a tweak" — likely doesn't fit
one bounded iteration. See the worklog's `## queued_scope`.
