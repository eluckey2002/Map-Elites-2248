---
id: iteration-1
run: lockout-fix-2026-08-08
status: complete
executor: orch-tdd
depends_on: []
write_scope: [solver/engine.js, solver/bot.js, solver/tests/engine.test.js, solver/tests/bot.test.js]
bound: 25 tool calls
claimed_by: iteration-1-worker
claimed_at: 2026-08-08T15:56:45Z
---

## Objective

Make ONE bounded, test-driven change to the chain-selection heuristic in
`solver/engine.js` and/or `solver/bot.js` aimed at reducing level 26's
"no valid moves" (board lockout) rate, without regressing existing behavior.
Then run both checks below and report their exact output — whether or not
the loop-level bar is cleared. This ticket does not require clearing the
bar; it requires an honest, test-verified attempt and an honest report.

## Fixed inputs

- Worklog goal (verbatim): `.orch/runs/lockout-fix-2026-08-08/worklog.md`
  `## goal` section — the done-check thresholds and the suspected-cause
  hypothesis (greedy chain-length maximization stripping the board of
  matching tiles).
- Baseline (this session): level 1 = 100% win (30 seeds), level 11 = 67%
  win (30 seeds), level 26 = 0% win (100 seeds, ~50% "no valid moves"),
  levels 40-50 bomb-exploded = ~0-1/300.
- `solver/README.md` — describes the two chain-search strategies
  (`findTopChains` exhaustive DFS vs `findGreedyChains`/`buildGreedyChain`
  no-backtracking walk) and why the walk prefers the *lowest*-value valid
  neighbor at each step (measured: this is what fixed level 11).
- `failed_approaches` in the worklog (empty at this iteration — nothing to
  avoid re-walking yet).
- 47 existing tests in `solver/tests/*.test.js`, currently all passing —
  read them before changing shared functions (`findTopChains`,
  `buildGreedyChain`, `findGreedyChains`, `chooseMove`) so you understand
  what behavior is already locked in and must not silently change.

## Completion test

1. `node --test solver/tests/*.test.js` exits 0 (all tests pass, including
   any new ones you add for your change). oracle: test runner exit code.
   oracle_class: deterministic. provenance: pre-existing.
2. `node solver/verify-loop.js` was actually run against your change, and
   its full stdout (all four check lines plus the RESULT line) is captured
   verbatim in `## Result`. oracle: the script's own output/exit code.
   oracle_class: deterministic. provenance: pre-existing. Note: the script
   exiting 1 (FAIL) does not fail this criterion — only failing to run it,
   or misreporting its output, does.

## Return fields

- `changed_artifacts` — files touched, by path.
- `approach` — one or two sentences: what you changed and why you expected
  it to reduce lockouts.
- `tests_pass` — bool, from criterion 1.
- `verify_loop_output` — verbatim stdout from criterion 2.
- `assessment` — if verify-loop.js did not fully PASS: what specifically
  changed vs baseline (better, worse, or no measurable difference) for
  each of the four checks, with the numbers. If it improved but didn't
  clear the level-26 bar, say so plainly — that's still useful signal for
  the next iteration's failed_approaches entry.

## Result

### Diagnosis (done before any change)

The worklog's suspected cause — "the greedy walk strips the board of the
low-value tiles needed for future moves" — is **not** what causes the
lockout. Instrumenting a level-26 playthrough (move-by-move value histogram
plus the final board) shows the real mechanism:

`executeChain` deletes every tile in the chain except the last, and sets that
last tile's value to the chain's **sum**. So each move consumes N tiles and
leaves exactly **one** tile behind — and the N-1 emptied cells are refilled by
`spawnNewTiles` with fresh 2/4/8s. Low tiles are therefore *replenished*, not
stripped. What is not replenished is the board's capacity: the surviving
remnant tile carries an arbitrary sum.

Because spawns are only 2/4/8 and `canExtendChain` only permits equal-or-double,
a tile can only ever be matched again if its value sits in the power-of-two
lattice. A 24-tile lowest-value walk sums to something like 78 — and 78 can
never equal or double into anything on the board again. It is dead permanently.
One dead tile accrues per move, and level 26 is a 5x8 grid (40 cells) with 32
moves. At seed 0 the end-state board held **31 of 40 cells in unmatchable
values** (78, 72, 60, 52, 48, 46, 44, 42, 40, 36, 34, 28, 24, 20, 14...) with
only 9 live cells left. That saturation is the "no valid moves" loss.

So chain *length* is a red herring; chain **sum** is the lever. The greedy
lowest-value walk is implicated, but only because walking until stuck produces
an arbitrary sum, not because it consumes low tiles.

### The change

One bounded change, in `solver/engine.js`:

- **Added `isMergeableSum(sum)`** (new module-private helper) — true iff `sum`
  is a power of two, i.e. the remnant tile lands back inside the merge lattice.
- **`buildGreedyChain(state, startTile, options)`** — added option
  `preferMergeableSum`, **default `false`**. When true, after the walk is
  built it returns the highest-scoring *prefix* (length >= `state.minChain`)
  whose sum is a power of two, instead of the whole walk; if no such prefix
  exists it falls through to the full walk unchanged. The walk itself — the
  lowest-value-neighbor step rule the README documents as the level-11 fix —
  is **untouched**. This function stays the raw walk primitive.
- **`findGreedyChains(state, options)`** — added option `preferMergeableSum`,
  **default `true`**, passed through to `buildGreedyChain`. This is where the
  policy is applied, and it is the only caller.

Nothing in `solver/bot.js` changed. `chooseMove` picks up the new behavior
through `findGreedyChains` (both for candidate generation and for
`rolloutValue`'s 2-ply lookahead). Bomb defusal still runs through
`findBestChain`/`findTopChains`, which are entirely untouched.

### Test changes

TDD was followed strictly: four tests written first, run, observed failing
(2 of the 4 genuinely red — the other 2 assert the preserved default/fallback
behavior and were correctly green from the start), then the implementation.

New in `solver/tests/engine.test.js` (4 tests, 47 -> 51):
- `buildGreedyChain: preferMergeableSum stops at the prefix whose sum is a
  power of two`
- `buildGreedyChain: preferMergeableSum falls back to the full walk when no
  prefix sums to a power of two`
- `findGreedyChains: applies the mergeable-sum preference by default`
- `findGreedyChains: preferMergeableSum:false restores the plain longest-walk
  behavior`

**One pre-existing test was deliberately changed** (not silently) in
`solver/tests/bot.test.js`: `chooseMove: with lookahead, prefers a small
immediate chain that sets up a much bigger follow-up...`. Its expected chain
went from `[X, X2, Y]` (sum 6, a dead value) to `[X, X2]` (sum 4, live). This
was predicted from reading the fixture before implementing, and the test's
actual subject is unaffected: it still asserts the lookahead picks the small
col-0 chain over the higher-scoring `[P, Q1]` pair (4pts vs 60pts immediate),
and the 96pt `Z-Q-R` cascade it exists to demonstrate still fires — clearing
`X`/`X2` drops `Z` to `(0,1)`, still diagonally adjacent to `Q` at `(1,2)`.
The fixture is unchanged; only the assertion and its comment were updated.
No other pre-existing test changed. All 47 originals still pass.

### verify_loop_output (verbatim)

```
Lockout-fix verify:
  [PASS] level 1 win rate (no regression): 1 (must stay 100%)
  [PASS] level 11 win rate (no regression): 0.9666666666666667 (baseline was 67%, floor at 60%)
  [FAIL] level 26 win rate (the actual target): 0 (baseline was ~0%, target >=30%)
  [PASS] bomb-exploded rate on levels 40-50 (no regression): 0/550 (baseline was ~0-1/300 (~0%), ceiling 2%)
RESULT: FAIL
```

Exit code 1.

### Return fields

- **changed_artifacts**
  - `solver/engine.js` — `isMergeableSum` (new), `buildGreedyChain`
    (+`preferMergeableSum` option, default false), `findGreedyChains`
    (+`preferMergeableSum` option, default true, passed through).
  - `solver/tests/engine.test.js` — 4 tests added, none modified.
  - `solver/tests/bot.test.js` — 1 test's assertion + comment updated (see above).
  - `solver/bot.js` — **not modified**.
- **approach** — A merge leaves one tile valued at the chain's sum, and only
  power-of-two sums can ever be matched again; walking the greedy chain to
  exhaustion produces arbitrary sums that dead-tile the board at one cell per
  move. `findGreedyChains` now truncates each walk to its highest-scoring
  power-of-two-sum prefix, trading immediate points for a remnant the board can
  still use.
- **tests_pass** — `true`. 51 tests, 51 pass, 0 fail, exit 0.
- **verify_loop_output** — see the verbatim block above. `RESULT: FAIL`, exit 1.
- **assessment** — see `## Verification`.

## Verification

Criterion 1 — `node --test solver/tests/*.test.js`: **PASS**.
`ℹ tests 51 / ℹ pass 51 / ℹ fail 0`, exit code 0.

Criterion 2 — `node solver/verify-loop.js`: **run, output captured verbatim
above**. The script itself reports `RESULT: FAIL` (exit 1) because the level-26
win-rate bar was not cleared. Per the ticket, that does not fail this criterion.

Per-check, against the frozen baseline:

| Check | Baseline | Now | Verdict |
|---|---|---|---|
| level 1 win (30 seeds) | 100% | 100% | no change, still PASS |
| level 11 win (30 seeds) | 67% | **96.7%** | large improvement, PASS |
| level 26 win (100 seeds) | 0% | 0% | **no change, still FAIL** |
| bombs exploded, levels 40-50 | ~0-1/300 | **0/550** | no regression, PASS |

**The lockout itself — the thing this ticket targeted — is gone.** Level 26
loss reasons at 100 seeds moved from roughly a 50/50 split to:

| | baseline | now |
|---|---|---|
| lost to "no valid moves" (lockout) | ~50/100 | **0/100** |
| lost to "out of moves" | ~50/100 | 100/100 |

Mechanism confirmed directly, not just inferred from the outcome: the
end-state dead-tile census on level 26 seed 0 went from **31 of 40 cells**
holding unmatchable values to **6 of 40**.

Level-26 average score (30 seeds, same harness both sides) rose from **5518 to
6655** against a target of 13000. So the change converted every lockout loss
into a pace loss and moved score ~20% closer, but the bar is **not** cleared:
score pace is now the sole binding constraint on level 26.

Also measured and rejected during diagnosis (30 seeds each, level 26 win /
lockouts / level 11 win):

| variant | L26 avg score | L26 lockouts | L11 win |
|---|---|---|---|
| baseline (full walk) | 5518 | 15/30 | 67% |
| **power-of-two-sum prefix (shipped)** | **6655** | **0/30** | **97%** |
| truncate walk at 9 tiles | 3705 | 11/30 | 0% |
| truncate walk at 6 tiles | 1470 | 0/30 | 0% |
| truncate walk at 12 tiles | 4349 | 15/30 | 7% |
| mobility term in `chooseMove`, w=20 | 5790 | 8/30 | 90% |
| mobility term in `chooseMove`, w=60 | 5524 | 9/30 | 83% |

## Feedback

For the next iteration:

1. **The worklog's stated hypothesis is disconfirmed and should be replaced.**
   "Greedy length-maximization strips the board of low-value tiles" is wrong —
   spawns replenish low tiles every move. The correct model is: *one remnant
   tile per move, valued at the chain sum; non-power-of-two sums are
   permanently unmatchable and saturate the board.* Update `## goal`'s
   suspected-cause note so iteration 2 doesn't re-derive this.

2. **Level 26's remaining failure is 100% score pace, not lockout.** Every one
   of 100 seeds now ends with moves exhausted at roughly 6700/13000. The next
   iteration should target points-per-move, and can treat lockout as solved
   (but must keep watching the "no valid moves" count as a regression guard —
   naive pace-chasing will bring it straight back).

3. **Closing a 2x score gap in 32 moves looks hard for a purely local
   heuristic.** The scoring rule is `sum * multiplier`, so points come from
   chaining *high-value* tiles, and the multiplier caps at 5x (9+ tiles). The
   promising direction is deliberately *building* a value ladder — merging into
   powers of two so that later chains run 32,32,64,128 rather than 2,2,2,4 —
   which is exactly what this change makes possible for the first time (6/40
   dead cells instead of 31/40 means big live tiles now persist). Candidate
   next changes: prefer prefixes whose sum matches a value already on the
   board (not merely any power of two); or bias the walk to start from the
   highest-value live cluster rather than scanning row-major.

4. **`failed_approaches` entries earned this iteration**: fixed-length caps on
   the greedy walk (6/9/12 tiles) are strictly worse — they destroy level 11
   (67% -> 0-7%) and don't reliably fix lockout. A mobility/legal-move-count
   term in `chooseMove` only halves lockouts and doesn't help score. Neither
   is worth re-walking.

5. **Bar check.** If the loop's purpose is level-26 fairness rather than bot
   strength, note that 0% win with a now-lockout-free bot at ~51% of target
   score is itself evidence about the *level*, not only the bot. Worth an
   explicit owner decision before spending more iterations tuning the bot.

## Risks

1. **The `preferMergeableSum` defaults are asymmetric** — `false` on
   `buildGreedyChain`, `true` on `findGreedyChains`. Deliberate (the former is
   the raw walk primitive, the latter is where policy lives, and it keeps the
   pre-existing `buildGreedyChain: respects maxLength` test meaningful), but it
   is a trap for the next reader. Both are documented in comments at the
   definition sites.

2. **Power-of-two is a proxy for "re-mergeable", not the real predicate.** A
   sum of 48 is dead in practice, but a sum of 1024 is equally dead if no other
   1024 will ever exist. The heuristic is right about the common case and was
   measured, not assumed — but it will happily truncate to a "live" 512 that is
   just as unmatchable as the 78 it avoided. Matching against values actually
   present on the board would be strictly better and is listed in Feedback.

3. **A pre-existing test's expectation changed.** `chooseMove`'s lookahead test
   now expects a 2-tile chain where it expected 3. I verified the cascade it
   tests still fires, but anyone auditing "did the bot's lookahead behavior
   change" should read that diff rather than trust the green.

4. **Level 11 improved to 96.7%, well above its 60% floor.** That is a large
   unrequested swing in a check that exists as a *regression* guard. It is
   almost certainly real (the same dead-tile mechanism was hurting level 11),
   but a check that moves this much is no longer a tight guard — if a future
   iteration trades level 11 back down to 65% the check will still pass.
   Consider raising the floor now that the baseline moved.

5. **No git repo here**, so there is no diff to fall back on. The exact edits
   are enumerated by function name under `changed_artifacts`. Reverting means
   removing `isMergeableSum`, both option destructures, the prefix block in
   `buildGreedyChain`, and the pass-through in `findGreedyChains` — plus the
   `bot.test.js` assertion.

6. **Seed counts are modest.** The variant comparison table used 30 seeds per
   level; only the shipped configuration was confirmed at the oracle's own
   counts (100 seeds for level 26, 550 for the bomb levels). The rejected
   variants' numbers are directional, not tight.
