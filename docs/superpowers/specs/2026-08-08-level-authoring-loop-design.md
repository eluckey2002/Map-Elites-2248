# Level-authoring loop — design

Status: approved, not yet built. Follows the closed `lockout-fix-2026-08-08`
orch-loop run (`.orch/runs/lockout-fix-2026-08-08/`, `solver/README.md`).

## Background

`solver/run-sweep.js 1-50` (300 seeds/level, current tuned bot) shows the
existing 50-level curve is broken far earlier than previously known:

| Levels | Win rate |
|---|---|
| 1–7 | 100% |
| 8–13 | 99.7% → 71.3% |
| 14–16 | 39.7% → 8.7% → 2.7% |
| 17–50 | 0.0%, flat |

34 of 50 levels (68%) are at 0% win rate. Loss reason is overwhelmingly "out
of moves" — the same score-pace ceiling `lockout-fix` found for level 26
(needs ~2.14x value-recycling, best achieved 1.39x with the current bot's
heuristics), not something specific to level 26 or to bombs. The curve was
hand-authored by extrapolating a difficulty pattern without checking it
against the mechanic's actual achievable ceiling.

**Open limitation, stated explicitly, not resolved by this spec**: "winnable"
throughout this project means "winnable by the current reference bot"
(`solver/bot.js`), not proven-optimal play. The bot's heuristics were tuned
across 15 rejected variants, all in the same family (greedy walk + shallow
lookahead) — never checked against a structurally different approach (e.g. a
much longer planning horizon). Rather than an automated probe, the intended
way to sanity-check this is the playthrough recorder (below): a human beating
a level the bot scores 0% on is direct evidence the bot, not the level, is
the bottleneck.

## Scope

Three components, one deferred:

1. **Level-generation loop** — produces new levels (51+).
2. **Custom-level player** — playable preview/review UI, reused from the
   existing game.
3. **Playthrough recorder** — capture-only transcripts from the player.
4. *Deferred, not designed here*: a bot/human replay visualizer ("watch a
   behavior become learned"). Noted as a future direction only.

Explicitly out of scope: rebalancing the existing 34 broken levels (a
near-free follow-on once the loop exists — same oracle, seeded with an
existing level's grid/blockers instead of a generated one); shipping any
generated level into `src/game.js`'s live `LEVELS` array (a distinct,
later, human-gated step).

## Component 1: level-generation loop

### Oracle (deterministic, automatic)

Reuses `solver/sweep.js`'s `playLevel()`/`sweepLevel()` unchanged — both
already accept arbitrary level objects, not just entries from the shipped
`LEVELS` array, so no engine changes are needed.

A candidate level object `{ target, moves, minChain, gridW, gridH, blockers }`
passes the oracle only if, across N seeds (300, matching existing sweep
convention):

- win rate lands in **30–50%** (reusing the band already established for
  level 26's goal)
- zero board-lockouts (`lossReasons` has no lockout-class entries)
- existing regression baselines still hold: level 1 ≥100%, level 11 ≥60%,
  level 26 ≥30%, bomb-exploded rate on 40–50 ≤2% (same checks as
  `solver/verify-loop.js`)

Anything that fails any check is rejected automatically and never reaches
the user.

### Target/moves computation — deterministic, NOT agent reasoning

The agent never computes or guesses `target`/`moves`. A new deterministic
helper (`solver/level-math.js`, new file) derives the achievable
target/moves for a given shape from the known ceiling (the 1.39x
value-recycling multiplier measured in `lockout-fix`), so the win-rate band
is hit by construction rather than by search. This is the piece that would
otherwise be "just a script" — pulling it out of the loop is intentional:
routing deterministic math through an LLM's reasoning each iteration is
wasted motion.

### What the agent actually proposes

Exactly one thing per iteration: a **shape** — `gridW`/`gridH`, `minChain`,
and blocker types/count/positions. Target/moves are mechanically derived
(above). This is the genuinely unscriptable part: a shape can still cause a
board lockout (the same class of bug `lockout-fix` iteration-1 fixed for
level 26) independent of whether its target/moves are correctly computed,
and predicting that from blocker geometry alone isn't reducible to a
formula.

### Iteration flow

One level per iteration, fresh `orch-worker` each time (no shared context
between iterations — mirrors `lockout-fix`). Each ticket includes:

- the frozen goal (win-rate band, oracle checks, regression baselines)
- every level accepted so far this run (curve context)
- the running rejected-shapes list, with why each was rejected (oracle
  failure reason, or a human rejection reason from review)

The orchestrator independently re-runs the oracle on every proposed
candidate before accepting it — never trusts agent-reported numbers, same
verification discipline as both `lockout-fix` iterations.

### Human review

Oracle survivors go to the user via the custom-level player (component 2),
rendered and playable, not raw JSON. Accept / reject / request-variant.
Accepted levels are appended to a candidate file
(`solver/candidate-levels.json`, new file) — never written into
`src/game.js`'s `LEVELS` array directly.

### Bound

Stop at **5 accepted levels or 10 iterations**, whichever comes first
(count-based: `lockout-fix`'s two iterations each ran roughly 15–20 minutes
wall-clock, so a wall-clock cap doesn't fit a "one level per iteration"
design — a 15-minute cap would likely yield one level, not five). The
10-iteration ceiling allows slack for oracle-rejected proposals without
being open-ended.

## Component 2: custom-level player

`src/index.html` + `game.js` already render and run any level via
`loadLevel(levelNum)`, which looks up a level by number in the shipped
`LEVELS` array. Add one new entry point that accepts an arbitrary level
object directly — typed in by the user, or loaded from
`solver/candidate-levels.json` — and feeds it into the same render/play
path, without modifying `loadLevel`'s existing numbered-lookup behavior or
touching the shipped `LEVELS` array. Fully playable (same interaction code
as levels 1–50), not a static preview — this is close to free since no new
rendering is being built.

## Component 3: playthrough recorder

Attaches to the custom-level player. On a playthrough (win or loss),
captures a JSON transcript: the level definition + seed, the sequence of
chosen chains (same shape the bot's own move log already uses internally,
so human and bot runs on the same level are directly comparable), and the
final outcome/score. Written to a new `recordings/` directory, one file per
playthrough. Capture-only — no in-app playback; playback is the deferred
visualizer's job, not this spec's.

## Testing

- Existing 53 solver tests (`solver/tests/`) run unchanged as the
  regression gate on every loop iteration.
- `solver/level-math.js` (new) gets its own unit tests: given a shape,
  does it derive a target/moves pair whose oracle-measured win rate
  actually lands in band.
- No changes to `engine.js` or `bot.js`.
- Custom-level player and recorder are thin UI additions; verified by
  manual playthrough rather than new automated tests (consistent with how
  `index.html` itself has no existing automated UI test coverage).

## Follow-ups (not this spec)

- Rebalance existing levels 17–50 using this same loop, seeded with each
  level's existing grid/blockers instead of a generated shape.
- Bot/human replay visualizer.
- Shipping accepted candidate levels into `src/game.js`'s live `LEVELS`.
