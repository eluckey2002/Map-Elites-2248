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
- `exact-score.js` — position-aware exact search for small boards, a
  position-relaxed upper-bound search, and frozen-sequence witness replay.
- `certify-level26.py` — exact SMT decision procedure for the single frozen
  Level 26 seed-0 `score >= 13000` query. SAT is independently replayed;
  UNSAT is a proof; a timeout is printed as `UNKNOWN` and is not a result.
- `alternative-certifier.py` — a genuinely separate exact OR-Tools CP-SAT
  formulation of that query. It uses finite-domain path variables and an
  explicit stable-compaction network rather than Z3 arrays; SAT is accepted
  only after an independent concrete replay, while a time limit is `UNKNOWN`.
- `level-author.js` / `author-level.js` — takes one level *shape* (grid,
  moves, minimum chain, demand, blockers) and derives a candidate level from
  it: the target is measured, never typed, and the result carries a receipt.
  See "Level generator" below for the gates it enforces.
- `generate-levels.js` — proposes shapes itself rather than waiting for a
  human to type one, screens them cheaply, and runs the survivors through
  `level-author.js` unchanged. See below.
- `tests/` — run all tests with `node --test solver/tests/*.test.js`.
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

## Frozen Level 26 certifier

Create an isolated environment and install the pinned solver:

```sh
python3 -m venv .venv-certifier
.venv-certifier/bin/python -m pip install -r solver/requirements-certifier.txt
```

The fixed deterministic fixture command proves that its one-move maximum is
18, rejects `score >= 19`, and checks column-major spawning:

```sh
.venv-certifier/bin/python solver/certify-level26.py --fixture
```

The frozen target query is:

```sh
.venv-certifier/bin/python solver/certify-level26.py --target --timeout-ms 120000
```

Only `SAT` with the emitted replay-checked witness or `UNSAT` is decisive.
`UNKNOWN` exits 2 and leaves reachability, the exact maximum, and any upper
bound unresolved. This command certifies only Level 26, seed 0; it makes no
claim about other random sequences.

## Deterministic Level 26 upper bound

The JavaScript resource relaxation supplies a separate, always-terminating
upper bound for the same frozen Level 26 seed-0 inputs:

```sh
node solver/upper-bound.js
```

It fully enumerates `(moves remaining, frozen spawn cursor)` states. For a
relaxed chain length `L`, it awards the shipped multiplier against the entire
current board value, even though a physical chain may contain less value, and
then consumes exactly `L - 1` frozen spawn values. Merges conserve value, so
the current board total is the initial total plus the consumed spawn prefix.
Discarding geometry, value compatibility, blockers, and move existence can
only add possibilities: every physical continuation maps into this finite
relaxation. The reported number is therefore a certified upper bound, but it
decides the target only when it is below 13,000. A result at or above the
target is explicitly `non-decisive`; it is not a witness and does not prove
reachability.

## Alternative CP-SAT certifier

Install its separately pinned engine into an isolated environment:

```sh
python3 -m venv .venv-alternative-certifier
.venv-alternative-certifier/bin/python -m pip install -r solver/requirements-alternative-certifier.txt
```

Validate the exact max-18 fixture, rejection at 19, and the two-column
column-major spawn fixture:

```sh
.venv-alternative-certifier/bin/python solver/alternative-certifier.py --fixture
```

Run the frozen Level 26 seed-0 decision query with an explicit finite bound:

```sh
.venv-alternative-certifier/bin/python solver/alternative-certifier.py --target --timeout-seconds 120
```

`SAT` includes a witness checked by a separate concrete transition replay;
`UNSAT` proves `score >= 13000` unreachable for this frozen input. `UNKNOWN`
exits 2 and is non-decisive. To exercise the Python-backed Node fixture tests,
set `ALTERNATIVE_CERTIFIER_PYTHON` to the isolated environment's interpreter.

The recorded 120-second run on 2026-08-10 returned `UNKNOWN` (exit 2) for
frozen input SHA-256
`edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880`.
It produced no score claim or bound and therefore did not decide the target.

## Exact physical prefix with a value-compatible tail

`physical-branch-bound/` is a fail-closed branch-and-bound decomposition for
the same frozen Level 26 seed-0 query. Physical prefix nodes use the complete
`enumerateLegalChains` action set. At each node, the tail first completely
enumerates a declared number of count-relaxed actions while retaining the
shipped equal-or-double value rule, exact sum survivor, and exact `L - 1`
frozen-spawn consumption. It then switches to the complete mass/cursor outer
relaxation. Forgetting positions and, later, compatibility only adds choices,
so the returned tail is admissible. Either resource cap throws before a bound
is returned; an unfinished calculation can never prune.

Run its deterministic small exact oracles and negative control with:

```sh
node --test solver/physical-branch-bound/*.test.js
```

Run the explicitly bounded frozen target prefix with:

```sh
node solver/physical-branch-bound/target.js
```

Exit 0 means replay-checked `SAT` or complete `UNSAT`. Exit 2 means
`NON_DECISIVE`; the JSON then reports searched nodes, certified prunes,
expanded branches, and enumerated-but-unexpanded branches. A target prune is
permitted only when its complete tail bound is strictly less than the
remaining target. The recorded two-layer run is non-decisive: its root tail
is 325,340, so it prunes no root branch; it exactly enumerates 1,868,975 root
actions, expands one guided physical action, and leaves 1,868,974 explicit
root branches unexpanded. This is coverage, not a score claim or upper bound
for the physical optimum.

## Frozen Level 26 target-witness search

`target-witness-search/` is a deterministic, finite-budget heuristic search
for a legal Level 26 seed-0 score of at least 13,000. It combines bounded
self-avoiding path beams, seeded walk sampling, and a portfolio state beam.
The search transition and the frozen witness replayer are separate gates;
reported score, move count, spawn cursor, and target status must agree before
the CLI emits a candidate.

Run its known-optimum fixture and malformed-candidate negative control with:

```sh
node solver/target-witness-search/cli.js --fixture
node --test solver/target-witness-search/*.test.js
```

Run the recorded fixed-compute frozen search with:

```sh
node solver/target-witness-search/cli.js --target \
  --restarts 6 --width 256 --walk-samples 24 --candidate-limit 64
node solver/target-witness-search/verify.js \
  solver/target-witness-search/frozen-run.json
```

Exit 0 means an independently replayed target-reaching lower witness was
found. Exit 2 and `NON_DECISIVE_MISS` mean only that the declared heuristic
budget ended without one. Such a miss is not an upper bound, an exact maximum,
or evidence that 13,000 is unreachable. The emitted JSON records the full
budget, coverage counters, replay result, and machine-readable witness.

## Near-target witness improvement

`near-target-search/` starts from the hash-pinned 12,336-point witness above
and performs deterministic large-neighborhood suffix replacement. Each
neighborhood keeps the frozen prefix, then uses seeded path sampling and a
diverse state beam for the remaining moves. A candidate becomes a retained
best only after the independent frozen replayer agrees on its score, move
count, and spawn cursor; the final output passes that replay gate again.

Run the base replay, known-optimum improvement fixture, malformed-candidate
negative control, and the recorded fixed-budget target search with:

```sh
node solver/near-target-search/cli.js --base-replay
node solver/near-target-search/cli.js --fixture
node --test solver/near-target-search/*.test.js
node solver/near-target-search/cli.js --target \
  --rounds 1 --cuts 31,30,29,28,27,26,24,22 \
  --width 32 --walk-samples 12 --candidate-limit 24 --variants 1
node solver/near-target-search/verify.js \
  solver/near-target-search/frozen-run.json
```

A target hit is only a reachability witness, never an exact maximum. A target
miss is only a fixed-budget replayed lower bound and does not constrain
reachability or the maximum.

**If this is ever revisited:** the one lever the loop didn't try is *remnant
placement* — steering which cell a chain's survivor lands on (currently
whatever the walk happens to end on) so successive remnants land adjacent
and form their own `minChain: 4` chain, directly raising the recycling rate.
Flagged by iteration-2 as "a real change, not a tweak" — likely doesn't fit
one bounded iteration. See the worklog's `## queued_scope`.

## Hinted CP-SAT threshold escalation

`hinted-cp-sat/` is a separate wrapper around the read-only alternative
CP-SAT transition model. It validates the frozen 12,336-point witness, adds a
complete replay-derived starting hint, and runs a finite increasing threshold
schedule. The starting rung fixes the already replayed witness so the model
checks acceptance; higher rungs use it only as a search hint. Every emitted
SAT witness must pass the separate Node/headless replay gate before it enters
the result artifact.

Install the pinned engine in a disposable environment, then run the fixture
and schedule:

```sh
python3 -m venv /tmp/level26-hinted-cp-sat
/tmp/level26-hinted-cp-sat/bin/python -m pip install \
  -r solver/hinted-cp-sat/requirements.txt
/tmp/level26-hinted-cp-sat/bin/python \
  solver/hinted-cp-sat/runner.py --fixture --timeout-seconds 20
/tmp/level26-hinted-cp-sat/bin/python \
  solver/hinted-cp-sat/runner.py --run --timeout-seconds 30 \
  --schedule 12336,12400,12600,12800,13000 \
  --output solver/hinted-cp-sat/frozen-run.json
node solver/hinted-cp-sat/verify-result.js \
  solver/hinted-cp-sat/frozen-run.json
```

`SAT` is retained only with a replayed reachability witness for that threshold.
`UNKNOWN` is a bounded timeout/miss with no score, maximum, upper-bound, or
unreachability claim. The recorded run validates 12,336 as SAT, returns
UNKNOWN at 12,400, 12,600, 12,800, and 13,000, and therefore does not decide
whether the target is reachable.

## Level generator

`generate-levels.js` closes the last human-in-the-loop step in level
authoring. Before it, a person typed a shape file and the pipeline measured
it; now the sampler invents the shape and a person only judges the shortlist.

```sh
node solver/generate-levels.js --count 120 --full 20 --seed 42 \
  --out solver/generated-batch-01.json
```

Three stages, in cost order:

1. **Sample.** Draw grid size, move budget, minimum chain, demand, and
   blockers from `SPACE`. Move budget is drawn per board cell, not
   absolutely, so a large grid is not accidentally starved. A signature that
   ignores the generated name and blocker draw order collapses duplicates.
2. **Screen.** Play 24 seeds from 500000 with no target, which forces every
   run to spend its whole move budget and report what the board can do. Drop
   anything that locks up, explodes too often, or scores nothing. The seed
   range is disjoint from the pipeline's own fitting (0-149) and holdout
   (100000-100299) ranges on purpose: a shape screened on seeds it is later
   measured on would be scored against its own training set.
3. **Author.** Survivors go through `deriveCandidate` unchanged — 150
   fitting games to set the target, 300 holdout games to gate it — and the
   shortlist is then re-checked by `verifyCandidate`, which replays all 450
   games and re-derives every identity.

The screen is a cost filter, not a verdict, and is expected to be wrong in
one direction: 24 seeds cannot see a fault that appears once in 300, so
shapes do pass the screen and then fail the real gate. That is the intended
failure mode. It must never be tightened into an authority — the 300-seed
holdout is the gate.

**What this does not do:** every gate here asks whether a level is fair and
winnable. None asks whether it is interesting. The shortlist is ranked
hardest-for-the-bot first, which is a proxy, not a measure of fun — see
below for what it rests on and what was tried instead.

### Ranking: one measured attempt, one negative result

The first batch (seed 42) produced fifteen gate-passing candidates, ten of
which the bot won 100% of the time. A human played the lowest-win-rate one
(`gen-0010`, 75%) on a blind seed and won by 944 points out of 114,000,
describing a deliberate three-phase game: bank small chains early, track
score rate through the middle, commit to one large chain late. The
recording bears that out — 23% of the score in the first half of the moves,
36% of it in a single chain on move 12.

That suggested a ranking function: measure how back-loaded and how spiky the
score curve is, and prefer levels that trend that way. `profile-shapes.js`
computes exactly that from bot play. **It does not separate the
candidates** — backload spans 44–53% and spike 10–21% across all fifteen,
with the dullest candidate tying the best one.

The reason is structural, and it is a property of the measuring instrument
rather than of the levels: the bot cashes in on every move, so it produces a
flat curve on every board by construction. Deferring value for eleven moves
to set up a late chain is invisible to a two-move lookahead. The metric
measures the player, not the level. `profile-shapes.js` is kept because the
numbers are real and cheap to recompute against a stronger player, but
nothing currently ranks on them.

What did work was already present: the bot's own win rate, sorted ascending.
It put the one candidate a human enjoyed at the top of the list. That rests
on a single playthrough and should be treated as the current best guess, not
a finding.

`profile-shapes.js` reads the two curve numbers back out of bot play for
every gate-passing candidate in a batch:

```sh
node solver/profile-shapes.js 40      # 40 seeds per candidate, from 200000
```

Its seed range (200000+) is disjoint from both the fitting and holdout
ranges, and it plays with no target so the curve is not truncated at the
moment a run happens to win.
