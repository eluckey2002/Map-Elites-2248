---
id: BL-0014
title: Find out what makes a blocker change a decision before designing any new blocker
status: proposed
milestone: blocker-mechanics
depends_on: [BL-0011]
updated: 2026-09-16
---

# BL-0014 — Research brief: blocker decision-relevance

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.
Every factual statement below about the engine or the bot was read from the
named file on 2026-09-16 and is a `direct_source` observation, not a result.

## The problem

Stone, ice, and bomb exist in the engine and ship from level 15 onward, but the
owner's assessment is that none of them has ever produced a meaningful change
in how the game is played. This brief does not propose a new blocker. It
proposes the study that must come first: define what "meaningful change"
means as a number, measure the current blockers against it, and find the
dials that move it. Designing a fourth blocker before that is guessing.

## What the blockers actually do today (read from the code)

| Mechanic | Engine behaviour (`solver/engine.js`) | Bot awareness (`solver/bot.js`) |
|---|---|---|
| Stone | Placed at level start from `levelData.blockers`. Never removed. Gravity treats it as a floor. `docs/DESIGN.md` says an adjacent 3+ merge clears it; no code does. | None. Treated as a non-traversable cell by `isBlockedTile`. |
| Ice | Placed at level start on whatever tile is dealt there, with a duration of 3 or 4 on every shipped level. `tickBlockers` decrements once per move and clears it at zero. Gone by move 4. | None. |
| Bomb | Placed at level start, one per level, timer 6-9. Explodes (loss) when the timer reaches zero. Chaining through it in any position removes it. | A dedicated defuse search (`findBombTiles`, `BOMB_MAX_CHAIN_LENGTH`). Every holdout in the ledger reports 0 bomb failures. |
| Lock | Constant defined in `src/game.js`. The engine's level loader never creates one. Never shipped. | None. |

Nothing spawns a blocker after move 0. `spawnNewTiles` creates plain tiles
only. Every blocker is therefore an opening condition, and by the mid game
the board is blocker-free apart from stones, which are fixed geometry.

Shipped usage: stones on 33 levels from 15 to 57; ice on 9 levels (25, 30,
34, 36, 38, 44, 46, 48, 57), duration 3 or 4; bombs on 11 levels (40-45, 47,
49, 50, 55, 58), timer 6 to 9.

## Why they change nothing — the hypothesis this study tests

1. **Timing.** Ice and bomb are over inside the opening. A mechanic that
   ends by move 4 of a 24-30 move game cannot shape the mid-game decision
   the game is about (build value, then cash in — see `BL-0013`).
2. **Attachment.** Ice freezes a dealt 2 or 4. Nothing is lost by waiting.
   The decision only exists if the frozen tile is one the player wanted.
3. **Invisibility to the policy.** The bot has no evaluation term for ice
   or stone, so a bot-only measurement of "did this blocker matter" will read
   near zero even when it does matter to a human. `RESULT-0024` measured a
   second stone as a flat 18-22% score cost for all four policies alike — a
   tax on everyone, not a decision for anyone.
4. **Stone is geometry, not a mechanic.** It changes the board's shape once
   and never again. `DECISION-0005` already records that blocker benefit is
   topology-dependent; that is a statement about level shape, not play.

## The readout: what "meaningful change" means as a number

**Primary — decision-flip rate.** For a paired board (identical seed, with
and without the blocker), the share of moves on which the best available
chain differs. Computable now with `solver/exact-score.js#enumerateLegalChains`
(exact, but see the cost note in `HANDOFF.md` 2026-09-06: one 5x7 opening
took 38 s) or with the bot's own search under its strongest settings as a
cheap proxy for the sweep. A mechanic whose flip rate is near zero after the
opening is decoration.

**Secondary — archive cell movement.** Do the MAP-Elites descriptors
(`meanChainLength`, `lateScoreShare` in `solver/policy-eval.js`; the
half-score-move / greed-ratio pair from `HANDOFF.md`) move differently for
different policies? A blocker that shifts hoarders and sprinters by the same
amount is a tax. One that shifts them differently is a decision.

**Ceiling detector — lockout and win-rate collapse.** The dose at which
every policy fails together. `FACT-0006` is the mechanism: any blocker that
leaves an off-lattice value behind is a permanent dead tile.

## What must be known before any variant is built (ranked)

1. **The baseline flip rate of the shipped blockers.** Prediction: under 5%
   after move 4. This turns "never properly implemented" into a number every
   later design must beat.
2. **Whether the bot can respond at all.** Without an inert-by-default
   policy term for ice and stone (the `BL-0013` pattern), bot-measured
   effects are lower bounds only. Until such a term exists, read effects from
   recorded human sessions and the scripted greedy-max player, not the bot.
3. **The lattice constraint.** Mechanics that alter tile *values* risk
   off-lattice dead tiles (`FACT-0006`, `RESULT-0006`). Mechanics that alter
   *timing* or *position* do not. Prefer the second class for the first
   study.
4. **The noise floor at the chosen seed count.** `RESULT-0024`'s most- and
   least-affected policies swapped between seed halves at 200 seeds. State
   the resolvable difference before reading any result.

## The drivers (the dials a dose-response sweep moves)

- **When it appears** — at start (current) vs spawned mid-game with
  probability *p* per move. Expected to be the largest driver.
- **What it attaches to** — a random dealt tile (current) vs the current
  highest non-blocked tile. Ice on a built 512 is a hoard-vs-cash decision;
  ice on a dealt 2 is nothing.
- **Duration / timer** — ice 0-10 moves, bomb 3-12 moves.
- **Count** — stones 0-4 on a 4x8 (`RESULT-0024` gives the 1-vs-2 point).
- **Clear method** — wait (current ice), chain adjacent (designed but
  unimplemented stone), chain through (current bomb). Only the last two cost
  a decision.
- **Position** — relative to choke points; `DECISION-0005` says this is
  topology-dependent.

## The minimum change expected to register

Spawn one ice, mid-game, on the current highest non-blocked tile, duration 4.
Nothing else. This attaches a blocker to the exact decision `BL-0013` says the
bot cannot express and the owner plays well. If the flip rate does not leave
zero on this, the readout is wrong before the mechanic is.

## The ceiling

The dose where lockouts or win-rate collapse appear for every style at once.
One point exists: two stones on a 4x8 cost about a fifth of the score
(`RESULT-0024`). The rest comes from the sweep. The useful design zone is
between "flip rate leaves zero" and "lockouts leave zero".

## Desired outcome

A registered, closed experiment that reports, for the shipped blockers and
for one minimal variant, the decision-flip rate and the archive cell movement
on shared seeds, with a stated noise floor — so that any future blocker
design starts from a measured baseline rather than an opinion.

## Acceptance criteria

- A decision-flip measure exists in `solver/` with a test that plants a
  board where the blocker provably changes the best chain and confirms the
  measure reads non-zero, and a paired control board where it reads zero.
- The measure is run on the shipped blockers (stone, ice, bomb) over shared
  seeds, and the baseline flip rate per mechanic is recorded.
- One minimal variant (spawned ice on the top tile) is run on the same seeds
  under a protocol registered at `experiments/<RESULT-ID>/protocol.md` before
  any game is played, with a predeclared flip-rate threshold and noise floor.
- Readouts are taken from at least one non-bot player (recorded human
  sessions via `solver/human-benchmark.js`, or the scripted greedy-max
  player) as well as the four fixed policies, because of item 2 above.
- No change to `src/game.js`, `solver/engine.js`, or `solver/level-author.js`
  lands without the receipt re-derivation `AGENTS.md` requires; the variant
  is implemented behind a flag defaulting to current behaviour.
- The result is a ledger record with proof class `heuristic_observation`,
  and the brief's hypotheses are each marked supported, falsified, or
  inconclusive against it.

## Explicitly out of scope

- Designing or shipping a new blocker type, including lock.
- Widening the spawn pool or enlarging move budgets (`RESULT-0006`,
  `RESULT-0007`; priced and rejected in `CURRENT.md`).
- Repeating `RESULT-0024`'s one-stone/two-stone contrast with more seeds.

## Current evidence

- `solver/engine.js` — `tickBlockers`, `checkBombs`, `isBlockedTile`,
  `applyGravity`, level loader; no mid-game blocker spawn.
- `solver/bot.js` — bomb defuse search; no ice or stone term.
- `src/game.js` — `blockers:` arrays per shipped level; `LOCK` defined,
  never loaded.
- `docs/DESIGN.md` §Blocker Tiles — stone "clear method" unimplemented.
- `EVIDENCE_LEDGER.md` `RESULT-0024` (topology response inconclusive;
  second stone costs 18-22% for all policies), `DECISION-0005` (blocker
  benefit topology-dependent), `FACT-0006` (off-lattice dead tiles),
  `RESULT-0006` / `RESULT-0007` (rejected levers).
- `HANDOFF.md` 2026-09-06 — half-score-move / greed-ratio descriptors and
  the exact enumerator's cost.
- `BL-0013` — the policy cannot express hold-then-harvest; the same gap
  makes it blind to a blocker on a built tile.

## Next action

Implement the decision-flip measure with its planted-board test, and run it
on the shipped blockers over shared seeds. No variant, no protocol, no ledger
record yet — the baseline number is the first deliverable.

## History

- 2026-09-16 — captured from an owner conversation on why the existing
  blockers produce no gameplay change and what research must precede any new
  one. Code facts verified against `main` at `9d125e8`.
