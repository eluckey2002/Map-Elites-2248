# Worklog: lockout-fix-2026-08-08

## goal (frozen — never edited after iteration 1)

Done-check: `node solver/verify-loop.js` exits 0. That script checks, in one
deterministic pass:

- level 1 win rate (30 seeds) >= 100% — no regression
- level 11 win rate (30 seeds) >= 60% — baseline 67%, small floor for variance
- level 26 win rate (100 seeds) >= 30% — baseline ~0%, this is the actual target
- bomb-exploded rate across levels 40-50 (50 seeds each) <= 2% — baseline ~0%, no regression

Context: level 26 (minChain=4, no bombs) fails almost entirely to "no valid
moves" (board lockout), not score shortfall. Suspected cause: the greedy
chain-builder's "always prefer lowest-value neighbor" heuristic (which fixed
level 11's score-pace problem) maximizes chain *length* per move, which may
be stripping the board of matching low-value tiles needed for future moves —
trading a lockout risk for the length/score win. Not confirmed; that's what
this loop is for.

Repo: `/Users/eluckey/Developer/research - more protos - mandala/2248-challenge`.
Solver: `solver/{engine.js,bot.js,sweep.js}`. Tests: `solver/tests/*.test.js`
(47 passing at loop start — must stay passing). Oracle: `solver/verify-loop.js`
(pre-existing, deterministic, ~9s to run).

## bound
4 iterations total for this run (intended from the start; recorded formally
before dispatching iteration 2). **2 spent, 2 unused** — run closed by owner
decision before exhausting the bound (see `## terminal`).

## current understanding (supersedes goal's hypothesis prose — goal itself stays frozen/verbatim)

The `## goal` section's suspected-cause paragraph is **disconfirmed** —
greedy length-maximization does not strip low-value tiles (spawns replenish
them every move).

**What's actually true, confirmed by two independent measurements:**
Every merge leaves exactly one remnant tile valued at the chain's *sum*, and
merges never create board value, only concentrate it. A sum outside the
power-of-two lattice (spawns are 2/4/8, extensions are equal-or-double) can
never be matched again — iteration-1 fixed this (prefer a power-of-two-sum
chain prefix), eliminating level-26 lockouts entirely (50/100→0/100 seeds,
dead cells 31/40→6/40). **Board lockout is solved and stayed solved through
iteration 2 as well (0/100 both times).**

What's left is score pace, and iteration-2 quantified its ceiling: total
board value ever available on a level-26 game is capped near 1214 (156
initial + ~1058 from spawns, since merges conserve value). Score = (value
chained) × multiplier (cap 5.0x). The bot reached 4.52/5.0 on the multiplier
(near-maxed) but only 1.39x on recycling remnants back into new chains;
hitting the 13000 target needs **2.14x recycling at a perfect 5.0x
multiplier**. Structural cause: spawns (2/4/8) and remnants (32/64) don't
share a bridge value under equal-or-double extension — a "hole at 16" — so
most of a late-game board's big-tile value is permanently unreachable.

## spec
None — ad-hoc loop, no frozen spec/decomposition.

## tickets
`.orch/tickets/lockout-fix-2026-08-08/`

## iterations

- **iteration-1** — dispatched 2026-08-08, executor orch-tdd, agent
  `orch-worker`/opus, ticket `iteration-1.md`, bound 25 tool calls.
  Verdict: **accepted** (verified independently by orchestrator — re-ran
  `node --test` and `node solver/verify-loop.js`, output matched exactly;
  diffed changed files against pre-dispatch snapshot, matched the reported
  changed_artifacts, write_scope respected, `bot.js` confirmed untouched).
  Change: `solver/engine.js` — `isMergeableSum` + `preferMergeableSum` option
  on `buildGreedyChain`/`findGreedyChains`. Progress: real (lockout
  eliminated, level 11 67%→96.7%, 2 approaches killed). Done-check: still
  FAIL (level 26 win rate 0%, target >=30%) — loop continued.
  Process note: executor set ticket `status: done` itself; corrected to
  `complete` by the join (only the join sets terminal ticket status).

- **iteration-2** — dispatched 2026-08-08, executor orch-tdd, agent
  `orch-worker`/opus, ticket `iteration-2.md`, bound 30 tool calls.
  Verdict: **accepted** (verified independently — re-ran `node --test` and
  `node solver/verify-loop.js`, matched exactly; diffed `engine.js` against
  the iteration-1 snapshot, confirmed untouched; diffed `bot.js`, matched
  reported changed_artifacts; write_scope respected).
  Change: `solver/bot.js` only — `CANDIDATE_LIMIT` 4→12,
  `TURNOVER_BONUS_PER_TILE` (new, 40) added to `chooseMove`'s ranking.
  Progress: real (level 26 avg score 6655→7583, +13.9%, ~15% of remaining
  gap; 0 lockout regression; 3 more approaches killed; quantified the
  recycling ceiling — see `## current understanding`). Done-check: still
  FAIL (level 26 win rate 0%, target >=30%).
  Executor's own recommendation (Feedback §5): treat this as a level-design
  finding, not a bot-strength gap — owner-decided, see `## terminal`.

## blame_classes
(none — no failed join)

## failed_approaches
- Fixed-length caps on the greedy walk (maxLength 6/9/12 tiles): strictly
  worse than the shipped fix. Destroys level 11 (67%→0-7% win), doesn't
  reliably fix level-26 lockout either (11-15/30 seeds still locked).
  Evidence: iteration-1 ticket's variant table (30 seeds each).
- Mobility/legal-move-count term added to `chooseMove`'s candidate scoring
  (weight 20 or 60): only halves lockouts (8-9/30 vs 15/30 baseline), doesn't
  address score pace, dominated by the shipped power-of-two-prefix fix.
  Evidence: same variant table.
- (iteration-2, 13 variants measured, full table in that ticket's
  Verification) Preferring the highest-value neighbor once past the 9-tile
  multiplier cap (switch point 5/7/9 tiles): worse on both score and
  level-11. Relaxing the power-of-two rule at any premium 1.0x-3.0x: loses
  score AND reopens lockouts — iteration-1's lattice constraint confirmed
  load-bearing. Beam search over walks (width 2/4/8): worse everywhere,
  ~10x slower. Exhaustive DFS as move generator: far worse, much slower.
  Bridge bonus (reward a remnant when the board holds 2x its value): flat to
  negative. Chain-prefix must match a board value (iteration-1's queued
  item): a wash (6610 vs 6655) — the bot's own sums (32/64) are already on
  the board almost always. Biasing walk-start-tile selection (iteration-1's
  other queued item): answered by inspection — `findGreedyChains` already
  tries every tile and keeps the best, so start order can't change the
  outcome; not a real lever.

## queued_scope
- Level 11's regression floor (60% in the frozen done-check) is slack
  against the 93-97% actuals measured across both iterations — no longer a
  tight guard. Not fixable here (goal frozen after iteration 1); for a
  future run's goal design.
- Untried lever, from iteration-2's Feedback: *remnant placement* — steering
  which cell a chain's survivor lands on (currently whatever
  `chain[chain.length-1]` happens to be), so successive remnants land
  adjacent and can form their own `minChain: 4` chain, raising the recycling
  factor directly. Iteration-2's own assessment: "a real change, not a
  tweak... would not expect it to fit one bounded iteration." Candidate for
  a future run if bot-strength tuning is ever resumed on this level.

## terminal
**blocked** — not `complete` (done-check's level-26 bar, win rate >=30%,
was never reached) and not `limited` (2 of 4 bound iterations were unused).
Closed by explicit owner decision (2026-08-08) after iteration 2, taking
option (3) of the fork both the loop and its own executor surfaced: treat
the result as a level-design finding rather than continue bot-tuning.

Deciding evidence: two independent fresh-context iterations, using different
diagnostic methods (dead-cell census; value-conservation arithmetic),
converged on the same structural conclusion, with 15 total approaches
measured and rejected. Level 26's 13000-point target requires a 2.14x
value-recycling rate at a perfect 5.0x multiplier; the best achieved across
every approach tried is 1.39x. This reads as a property of the level's
target relative to the game's merge rules, not a capability gap in the
solver's bot — see `## current understanding` for the full mechanism.

Answer to the original motivating question (are levels 40-50, the bomb
levels, unfair): **bombs specifically are not the risk** — bomb-exploded
rate stayed ~0% (0-1 per 300-550 seeds) across every sweep this session,
meaning the defuse-first priority works and bombs are almost never what
kills a run. The real risk is the score-pace ceiling identified here, which
predates bombs (level 26 has none) and is inherited by every level built on
the same `minChain: 4` / small-grid tier — including 40-50, whose targets
only climb higher (20000-25000 vs level 26's 13000). Full findings:
`solver/README.md`.
