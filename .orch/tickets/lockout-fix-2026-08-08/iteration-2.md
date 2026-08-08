---
id: iteration-2
run: lockout-fix-2026-08-08
status: complete
executor: orch-tdd
depends_on: []
write_scope: [solver/engine.js, solver/bot.js, solver/tests/engine.test.js, solver/tests/bot.test.js]
bound: 30 tool calls
claimed_by: iteration-2-worker
claimed_at: 2026-08-08T16:26:19Z
---

## Objective

Level 26's lockout problem is solved (see Fixed inputs) — its remaining 0%
win rate is pure score pace: every seed ends with moves exhausted at
~6655/13000 average. Make ONE bounded, test-driven change aimed at closing
that pace gap by building a "value ladder" — deliberately growing a few
tiles to high values over several moves so later chains run on
32,32,64,128-scale material (worth far more per chain, since points =
sum * length-multiplier) rather than perpetually consuming the cheapest
available tiles. Then run both checks below and report their exact output —
whether or not the loop-level bar is cleared. This ticket does not require
clearing the bar; it requires an honest, test-verified attempt and an
honest report.

## Fixed inputs

- Worklog: `.orch/runs/lockout-fix-2026-08-08/worklog.md` — read `## goal`
  (frozen done-check, plus its ORIGINAL hypothesis, which is superseded —
  see next) AND `## current understanding` (the corrected mechanism and
  current baseline) AND `## failed_approaches` (do not re-walk these) AND
  `## queued_scope` (candidate directions already scoped, not yet tried).
- Iteration-1 ticket (full diagnosis + a rejected-variant table):
  `.orch/tickets/lockout-fix-2026-08-08/iteration-1.md`.
- Current baseline (post-iteration-1, this is what you're improving on):
  level 1 = 100% win (30 seeds), level 11 = 96.7% win (30 seeds), level 26 =
  0% win (100 seeds) but 0/100 lockouts (avg score 6655 vs target 13000,
  every loss is "out of moves"), levels 40-50 bomb-exploded = 0/550.
- `solver/README.md` and `solver/engine.js` — read `isMergeableSum`,
  `buildGreedyChain`'s `preferMergeableSum` option, and `findGreedyChains`
  before changing them; understand what iteration 1 built and why (the
  power-of-two-sum lattice constraint) before extending it.
- Two concretely scoped candidate directions from iteration-1's Feedback and
  the worklog's queued_scope (pick one, or your own — diagnose first if
  it's cheap, don't just guess):
  1. Prefer a chain prefix whose sum matches a value ALREADY PRESENT on the
     board (not merely any power of two) — strictly better than the current
     proxy, since a "live" power-of-two sum with no partner anywhere is just
     as dead as a non-power-of-two one.
  2. Bias which tile a walk starts from toward the highest-value live
     cluster, instead of the current row-major scan order — the idea being
     to consolidate a few big tiles rather than spreading small merges evenly.
- 51 existing tests in `solver/tests/*.test.js`, currently all passing.

## Completion test

1. `node --test solver/tests/*.test.js` exits 0 (all tests pass, including
   any new ones you add). oracle: test runner exit code. oracle_class:
   deterministic. provenance: pre-existing.
2. `node solver/verify-loop.js` was actually run against your change (from
   the repo root: `cd "/Users/eluckey/Developer/research - more protos - mandala/2248-challenge" && node solver/verify-loop.js`,
   ~9s), and its full stdout is captured verbatim in `## Result`. oracle:
   the script's own output/exit code. oracle_class: deterministic.
   provenance: pre-existing. The script exiting 1 does not fail this
   criterion — only failing to run it, or misreporting its output, does.
3. The level-26 lockout regression guard: re-check the "no valid moves"
   count specifically (not just win rate) on level 26 at 100 seeds, and
   report it explicitly. Pace-chasing must not reintroduce lockouts —
   iteration-1's Feedback flagged this risk by name. oracle: `sweepLevel`
   lossReasons output. oracle_class: deterministic. provenance: pre-existing
   (`solver/sweep.js`, already built).

## Return fields

- `changed_artifacts` — files touched, by path and function name.
- `approach` — one or two sentences: what you changed and why you expected
  it to close the score-pace gap.
- `tests_pass` — bool, from criterion 1.
- `verify_loop_output` — verbatim stdout from criterion 2.
- `lockout_regression_check` — the level-26 "no valid moves" count from
  criterion 3, compared to iteration-1's 0/100.
- `assessment` — what specifically changed vs the iteration-1 baseline for
  each of the four verify-loop.js checks, with numbers. If level 26 still
  doesn't clear 30%, say by how much it moved and whether you believe
  another local-heuristic iteration is likely to close the rest, or whether
  this now looks like evidence about the level's own difficulty rather than
  the bot (iteration-1 flagged this as a live possibility — your measurement
  is the next data point on it, not a decision you need to make).

## Result

### Diagnosis (done before any change)

Instrumenting a level-26 playthrough move-by-move (chain length, chain sum,
points, and the board's value histogram at every move) produced the governing
arithmetic, which neither the worklog nor iteration 1 had stated:

**`executeChain` conserves total board value.** It deletes every chain tile but
the last and sets that last tile to the chain's *sum*. Value is never destroyed,
only concentrated. The only value that ever *enters* the board is
`spawnNewTiles` refilling the cells the chain emptied. So for a whole game:

```
total value that will ever exist  =  initial board value  +  spawned value
spawned value per move            ≈  (chain length − 1) × 3.2   [E(spawn) = 0.6·2+0.3·4+0.1·8]
score                             =  Σ (chain sum) × (length multiplier),  multiplier ≤ 5
```

Measured on level 26 with iteration-1's bot (30 seeds, per game): initial board
value **156**, spawned **1030**, so **1186 total value ever exists**. The bot
chained **1721** of value (a **1.45x recycle factor** — remnants do get re-chained)
and converted it at an effective **3.87x** of the 5.0 maximum multiplier, giving
1721 × 3.87 = **6655**. Every number in that chain is measured, not modelled.

Two consequences fell straight out:

1. **Chain length is worth far more than its multiplier.** Past 9 tiles the
   multiplier is pinned at 5, so iteration 1 (and the original bot) treated extra
   tiles as free. They are not: each extra tile emptied is one more spawned tile,
   worth ~3.2 of future board value, which the bot converts at ~3.9x — roughly
   **12+ points of future score per emptied cell**. `chooseMove` ranked candidates
   on immediate points alone and so systematically preferred short high-value
   chains that starve the board of new material. The instrumented trace shows it
   plainly: move 25 took `[32,32,32,64]` — 4 tiles, 240 points, 3 cells emptied —
   over 15-tile chains worth 160.
2. **The candidate list was being cut by the wrong criterion.** `chooseMove` took
   `findGreedyChains(state, { limit: 4 })` and *then* ran the 2-ply lookahead over
   those 4. But `findGreedyChains` sorts by immediate points — the exact criterion
   the lookahead exists to override. Any chain that trades points now for a better
   board later was discarded before the lookahead could evaluate it.

A third finding, which explains why the ticket's "value ladder" framing does not
reduce to a local tweak: the board's value histogram is bimodal with a **hole at
16**. Spawns are 2/4/8; remnants are 32/64; `canExtendChain` allows only
equal-or-double. With no 16s, a chain walking up the small pool hits 8 and stops —
it can never climb into the big pool. Late-game boards routinely hold
`32x5 64x5` = 480 of value that is structurally unreachable, while the bot takes
sum-32 chains. The two moves that did climb (a 16 happened to exist) scored 768
and 980, against a 190 average for the rest.

### The change

Both edits are in `solver/bot.js`. `solver/engine.js` is **not modified** —
iteration-1's `isMergeableSum` / `preferMergeableSum` lattice constraint is left
exactly as shipped, and re-measured as load-bearing (see the rejected table).

- **`CANDIDATE_LIMIT` 4 → 12.** Widens the candidate list so the lookahead can
  see chains that are not top-4 on immediate points.
- **New constant `TURNOVER_BONUS_PER_TILE = 40`**, with the derivation above in a
  comment at the definition site.
- **`chooseMove`** — the candidate ranking loop now adds
  `TURNOVER_BONUS_PER_TILE * (candidate.chain.length - 1)` (cells emptied; the
  last tile survives) alongside the existing `rolloutValue` term. It sits with
  the rollout term deliberately: both are forecasts of value arriving after the
  current move, not part of the immediate score. The no-lookahead path is
  untouched and remains plain 1-ply "highest immediate points".

This is **not** the mobility/legal-move-count term in the worklog's
`failed_approaches`. That term counted *legal moves remaining* as a lockout
proxy; this one counts *cells emptied* as a spawn-injection forecast. Different
quantity, different mechanism, and measured better on every axis (that one:
5790 avg, 8/30 lockouts; this one: 7583 avg, 0/100 lockouts).

### Test changes

TDD followed strictly. Two tests written first, run, **observed failing with the
predicted wrong answers** (`4 !== 16` — it took the 4-tile 64-chain; `2 !== 8` —
it took a 2-tile 32-pair), then the implementation, then green.

New in `solver/tests/bot.test.js` (2 tests, 51 → 53):
- `chooseMove: with lookahead, prefers the chain that clears more of the board
  even when it scores less right now` — five 64s over twenty 2s; the 4-tile
  64-chain scores 384 and empties 3 cells, the 16-tile 2-chain scores 160 and
  empties 15. Isolates the turnover term (both candidates are inside a width-4
  list).
- `chooseMove: considers candidates ranked below the top few on immediate
  points` — five separate 32-pairs generate ten candidates at 64pts, burying an
  8-tile run of 2s worth 48pts at rank 11. Exercises the width increase (a
  width-4 list cannot see that chain at all) together with the turnover term.

**No pre-existing test was modified.** All 51 originals still pass unchanged —
including iteration-1's lookahead-cascade test, which was the one it had to
edit.

### verify_loop_output (verbatim)

```
Lockout-fix verify:
  [PASS] level 1 win rate (no regression): 1 (must stay 100%)
  [PASS] level 11 win rate (no regression): 0.9333333333333333 (baseline was 67%, floor at 60%)
  [FAIL] level 26 win rate (the actual target): 0 (baseline was ~0%, target >=30%)
  [PASS] bomb-exploded rate on levels 40-50 (no regression): 1/550 (baseline was ~0-1/300 (~0%), ceiling 2%)
RESULT: FAIL
```

Exit code 1. Wall time 17.0s (was ~9s — see Risks 2).

### Return fields

- **changed_artifacts**
  - `solver/bot.js` — `CANDIDATE_LIMIT` (4 → 12), `TURNOVER_BONUS_PER_TILE`
    (new module constant, 40), `chooseMove` (turnover term added to the
    candidate-ranking loop; doc comment updated).
  - `solver/tests/bot.test.js` — 2 tests added, none modified.
  - `solver/engine.js` — **not modified**.
  - `solver/tests/engine.test.js` — **not modified**.
- **approach** — Merges conserve board value, so the only new scoring material
  is the spawns that refill the cells a chain empties; ranking candidates on
  immediate points alone ignored that and preferred short high-value chains that
  starve the board. `chooseMove` now credits each emptied cell with its forecast
  future value, and sees 12 candidates instead of 4 so such chains survive the
  cut to reach the lookahead.
- **tests_pass** — `true`. 53 tests, 53 pass, 0 fail, exit 0.
- **verify_loop_output** — see the verbatim block above. `RESULT: FAIL`, exit 1.
- **lockout_regression_check** — see `## Verification`. **0/100, unchanged.**
- **assessment** — see `## Verification`.

## Verification

Criterion 1 — `node --test solver/tests/*.test.js`: **PASS**.
`ℹ tests 53 / ℹ pass 53 / ℹ fail 0`, exit 0.

Criterion 2 — `node solver/verify-loop.js`: **run, output captured verbatim
above**. The script reports `RESULT: FAIL` (exit 1) because the level-26 win-rate
bar is not cleared. Per the ticket, that does not fail this criterion.

Criterion 3 — level-26 lockout regression guard, `sweepLevel(level26, 100)`:

```
level 26, 100 seeds: {"level":26,"winRate":0,"seedCount":100,"lossReasons":{"out of moves":100}}
```

**"no valid moves" = 0/100 — identical to iteration-1's 0/100. No regression.**
All 100 losses remain "out of moves". Pace-chasing did not bring the lockout
back, which was the named risk.

Per-check, against the iteration-1 baseline:

| Check | Iteration 1 | Now | Verdict |
|---|---|---|---|
| level 1 win (30 seeds) | 100% | 100% | no change, PASS |
| level 11 win (30 seeds) | 96.7% | 93.3% | −3.4pp, still 33pp above the 60% floor, PASS |
| level 26 win (100 seeds) | 0% | 0% | **no change, still FAIL** |
| bombs exploded, levels 40-50 | 0/550 | 1/550 | +1 seed (0.18% vs a 2% ceiling), PASS |
| level 26 lockouts (100 seeds) | 0/100 | 0/100 | no change |
| **level 26 avg score (100 seeds)** | **6655** | **7583** | **+928, +13.9%** |
| level 26 best single seed | not measured | 9878 | still 3122 short of 13000 |

The score gap to target closed from 6345 to 5417 — **15% of the remaining gap**.

Level 11's win rate fell 96.7% → 93.3% (29/30 → 28/30, i.e. one seed). At 50
seeds the same configuration measured 96% against baseline's 90%, so the
direction of that single-seed move is not established; both readings sit far
above the floor.

### Where the gain came from, and what is left (value flow, new bot, 30 seeds)

```
initial board value        156
injected by spawns        1058    (was 1030 — longer chains, as intended)
total value ever on board 1214    (merges conserve value)
total value chained       1687    recycle factor 1.39x  (was 1.45x)
avg chain length          11.3
score 7633  ->  effective multiplier 4.52x of 5.0 max   (was 3.87x)
```

The entire gain came from **raising the effective multiplier 3.87x → 4.52x**
(taking longer chains), not from recycling, which went slightly *down*. That
matters for what is left, because the multiplier is nearly exhausted: 4.52 → a
perfect 5.00 is only another +11%, i.e. ~8500. **Everything beyond that must
come from recycling.**

And the recycling requirement is severe. With 1214 of value ever on the board,
reaching 13000 needs

```
13000 / 5.0 / 1214 = 2.14x recycle factor   (at a PERFECT 5.0x on every move)
```

against the 1.39x achieved. Every unit of value on the board must pass through a
scoring chain more than twice, with no move ever scoring below the 9-tile
multiplier cap. Recycling means re-chaining remnant tiles, and with `minChain: 4`
that requires **four** big tiles in a connected equal-or-double path — while
remnants are created one per move, at whatever cell the walk happened to end on,
and are then scattered by gravity. That is the structural wall, and it is the
same wall the missing-16 histogram hole describes from the other side.

### Also measured and rejected (30 seeds each; L26 avg score / L26 lockouts / L11 win)

| variant | L26 avg | L26 lockouts | L11 win |
|---|---|---|---|
| iteration-1 baseline | 6655 | 0/30 | 97% |
| **shipped: turnover 40 + width 12** | **7583** (100 seeds) | **0/100** | **93%** |
| *ticket direction 1* — prefix sum must match a value already on the board | 6610 | 0/30 | 90% |
| prefer highest-value neighbor once past the 9-tile multiplier cap | 5332 | 0/30 | 27% |
| ...same, switching at 7 tiles | 4369 | 0/30 | 0% |
| ...same, switching at 5 tiles | 2925 | 0/30 | 0% |
| ...always prefer highest-value neighbor | 1778 | 10/30 | 0% |
| relax the power-of-two rule when a dead prefix scores ≥3x more | 5850 | 4/30 | 80% |
| ...≥2x | 5571 | 11/30 | 70% |
| ...≥1.5x | 5674 | 9/30 | 83% |
| ...≥1.25x | 5618 | 13/30 | 80% |
| ...no power-of-two rule at all (pre-iteration-1 behavior) | 5518 | 15/30 | 67% |
| emit every power-of-two prefix as its own candidate, let the 2-ply pick | 6765 | 0/30 | 93% |
| ...same + width 8 | 6888 | 0/30 | 97% |
| bridge bonus: reward a remnant `v` when the board holds `2v` (w=0.25/1/4) | 6655 / 6633 / 5443 | 0/30 | 97 / 93 / 57% |
| beam search over walks, width 2 / 4 / 8 (replaces the single greedy path) | 3200 / 4060 / 4954 | 0/30 | 0 / 3 / 13% |
| exhaustive DFS as the move generator, maxLength 8 / 11 (2-3 seeds) | 3243 / 4704 | — | — |

Turnover-weight and candidate-width plateaus, measured at **50** seeds so the
shipped constants are not a knife-edge fit:

| turnover weight (width 16) | 0 | 30 | 40 | 50 | 60 | 80 |
|---|---|---|---|---|---|---|
| L26 avg | 6555 | 7658 | 7678 | 7654 | 7823 | 7667 |

| candidate width (turnover 40) | 4 | 8 | 12 | 16 | 24 |
|---|---|---|---|---|---|
| L26 avg | 6822* | 7515 | 7584 | 7678 | 7678 |

\* 30 seeds. Width 12 was chosen over 16/24 because the difference is inside the
seed-to-seed noise while the sweep cost is 2.3x baseline instead of 2.9x.

**Ticket direction 2 (bias which tile a walk starts from) was not run, because
reading `findGreedyChains` shows it cannot change anything.** That function
already builds a walk from *every* non-blocked tile and returns them sorted by
points; the row-major scan order only decides which of two entries sharing a
`(finalTile, length, points)` dedupe key is kept. Reordering the starts cannot
change which chain wins. Recording it as answered-by-inspection rather than
untried.

## Feedback

For the next iteration:

1. **The pace problem is now quantified, and it is not a heuristic-tuning
   problem.** The binding constraint is `score = (value chained) × (multiplier)`
   with total board value capped at ~1214 by spawn arithmetic. The multiplier is
   at 4.52 of a hard 5.0 — worth at most another ~900 points. Hitting 13000
   requires the recycle factor to go 1.39x → 2.14x *while* holding a perfect
   multiplier. No local chain-selection heuristic I measured moves recycling at
   all; the three that tried (bridge bonus, board-value matching, prefix
   candidates) all landed within ±2% of baseline.

2. **If another iteration is spent on the bot, spend it on remnant placement,
   not chain selection.** Recycling fails because big remnants are scattered.
   The one lever nothing has touched is *where the survivor lands*: `executeChain`
   makes `chain[chain.length - 1]` the survivor, so the walk's endpoint chooses
   the remnant's cell. A policy that steers walk endpoints so successive remnants
   land adjacent (four in a connected path, given `minChain: 4`) is the only
   mechanism I can see that raises recycling. It is a real change, not a tweak,
   and I would not expect it to fit one bounded iteration.

3. **My honest read: this is now evidence about level 26, not about the bot.**
   Two iterations have taken level 26 from 5518 → 6655 → 7583 average, each by
   fixing a genuine bot defect confirmed by direct measurement, and the win rate
   has not moved off 0% because the best single seed of 100 reaches 9878 against
   a 13000 target. The spawn arithmetic says a bot that never re-chained a
   remnant at all is capped near 6072; clearing 13000 demands 2.14x recycling
   through a `minChain: 4` doubling lattice fed by 2/4/8 spawns. I would put the
   next decision to the owner before the next iteration (see 5 below), because a
   third of the run's remaining budget is about to be spent on a bar that may not
   be reachable.

4. **`failed_approaches` entries earned this iteration** (see the table for
   numbers): preferring the highest-value neighbor past the multiplier cap;
   relaxing the power-of-two rule at any premium from 1.0x to 3.0x (it re-opens
   lockouts *and* loses score — iteration-1's lattice constraint is confirmed
   load-bearing, not merely helpful); beam search over walks at any width up to 8
   (worse than the single prefer-lowest path everywhere, and ~10x slower);
   exhaustive DFS as the move generator; the bridge bonus. Also worth recording:
   ticket direction 1 (match a board value) measured 6610 vs 6655 — a wash, not
   the strict improvement iteration 1 predicted, because the sums the bot
   actually produces (32 and 64) are already present on the board almost always.

5. **The bar question is now concrete enough to decide.** The frozen done-check
   asks for ≥30% win on level 26. The measurement above bounds what is available.
   The owner-level fork is: (a) keep tuning the bot against 30%, (b) re-aim the
   loop at "how close can a fair bot get", or (c) treat 13000/32-moves/minChain-4
   as a level-design finding and change the level. My recommendation is (c) with
   (b) as the fallback: the solver was built to check whether levels are winnable,
   and it has now produced a quantitative answer for level 26 — the target sits
   above the no-recycling ceiling and demands a recycling rate the merge rules
   make structurally hard. That is the answer the tool exists to give, and
   continuing to tune the bot converts a level-design finding into a bot-strength
   exercise.

## Risks

1. **`TURNOVER_BONUS_PER_TILE = 40` is a fitted constant, and its derivation
   only supports ~12.** The measured plateau (30-80 all within 2%) says it is not
   knife-edge, and 40 is mid-plateau. But the arithmetic in the comment justifies
   about 12 points per emptied cell; the extra is capturing something the model
   does not name — most likely that churning the board also keeps chains
   available. Anyone re-tuning should re-run the 50-seed sweep rather than trust
   the derivation.

2. **`verify-loop.js` got slower: ~9s → 17.0s.** Entirely from `CANDIDATE_LIMIT`
   4 → 12 (three times as many 2-ply rollouts per move). It is still a fast
   oracle, but this run's done-check now costs ~2x what the worklog records, and
   a future width increase would compound it. Width 8 recovers most of the score
   (7515 vs 7584 at 50 seeds) at ~1.7x baseline cost if that trade is ever wanted.

3. **Bomb-explosion count moved 0/550 → 1/550.** Well inside the 2% ceiling
   (11/550), and bomb defusal itself is untouched — it runs through
   `findBestChain`/`findTopChains`, which this change does not reach. The single
   explosion comes from the non-bomb move selection changing which board a bomb
   level arrives at. Worth a glance if it grows; it is not a regression at this
   size, but it is not zero any more either, and the check's headroom is what is
   absorbing it.

4. **Level 11 read 93.3% at 30 seeds vs 96.7% before** — one seed. The same
   configuration read 96% at 50 seeds against baseline's 90%, so the 30-seed
   figure the oracle uses is noisy at this resolution. Iteration-1's Risk 4
   (the level-11 floor is now slack at 60% against a ~95% actual) still stands
   and this iteration makes it more pressing: a guard with 35 points of slack
   would not catch a real level-11 regression.

5. **The two new tests depend on rollout values they do not control.** Both
   fixtures rely on the margin between candidates being larger than the
   difference in their 2-ply rollout scores (~224 and ~280 points of margin
   respectively). They were verified red-then-green, so they do discriminate the
   change today, but they are behavioral integration tests, not unit tests of the
   turnover term. A future change to `rolloutValue` or to spawn weights could
   flip them for reasons unrelated to what they are asserting.

6. **No git repo here**, so there is no diff to fall back on. Reverting this
   iteration means, in `solver/bot.js` only: set `CANDIDATE_LIMIT` back to 4,
   delete the `TURNOVER_BONUS_PER_TILE` constant and the
   `+ TURNOVER_BONUS_PER_TILE * emptiedCells` term (and the `emptiedCells` local)
   from `chooseMove`'s ranking loop, and restore the previous `chooseMove` doc
   comment — plus delete the two new tests at the end of
   `solver/tests/bot.test.js`. `solver/engine.js` and
   `solver/tests/engine.test.js` were not touched.

7. **The value-flow numbers are 30-seed averages** (the 1214 total-value figure
   and the 1.39x recycle factor). The conclusions drawn from them in Feedback are
   order-of-magnitude arguments — 1.39x vs a required 2.14x — so seed noise does
   not threaten them, but the specific figures should not be quoted as tight.
