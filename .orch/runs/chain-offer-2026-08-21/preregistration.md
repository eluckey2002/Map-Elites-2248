# Pre-registration — offering the untrimmed chain to the lookahead

**Rule set:** `chain-offer-v1`
**Registered:** 2026-08-21, before any game was played.
**Method:** Pattern Atlas `METHOD-010` (pre-register the question and its failure
conditions) and `METHOD-029` (verify the instrument before you believe it).
**Goal:** `.orch/goal.md`, frozen 2026-08-21T19:45:48Z.

This record is frozen. If the question or the denominator changes, that is a new
scope and a new record — not an edit to this one.

---

## Question

Does offering the lookahead the untrimmed greedy chain, alongside the
mergeable-trimmed chain it already receives, raise the bot's paired game score
without lowering its win rate?

## Why this is being asked

`chooseMove` (`solver/bot.js:267`) requests candidates from `findGreedyChains`,
whose `preferMergeableSum` defaults to true. Every candidate the lookahead ever
sees has therefore already been cut back to a prefix whose sum lands on the
mergeable lattice (`FACT-0006`). The larger chain the walk actually found is
discarded before the lookahead — whose `rolloutValue` and `harvestValue` terms
exist precisely to price future board damage — is allowed to weigh it.

Measured on opening boards, comparing what the bot plays against its own
untrimmed walk:

| board | bot plays | untrimmed walk | ratio |
|---|---|---|---|
| level 52 seed 2 | 5,120 | 9,600 | 0.53 |
| level 51 seed 2 | 5,120 | 9,920 | 0.52 |
| level 53 seed 3 | 5,120 | 6,080 | 0.84 |

`solver/bot.js` already documents the identical error one layer up: the
candidate list was cut to width by immediate points, "the very criterion the
lookahead exists to override" (`RESULT-0010`). This is the same shape against a
different criterion.

## Shape of the run

A **confirmation** of one structural change. Not a search, not a sweep, not an
expansion. It can produce: paired score lift, its t statistic, win rate, and
relative compute cost. It cannot produce: anything about level design, anything
about human play, and anything about a change other than the one named.

## The change under test

One flag in `solver/bot.js`, default **off**, so the shipped bot is unchanged
until a separate adoption decision. When on, `chooseMove` merges the untrimmed
walk results into its candidate list, deduplicated on the same key
`findGreedyChains` already uses, and the existing lookahead ranks them together.

No new tuned weight. No new rule. A filter removed, not intelligence added.

## Denominator

53 levels (1..53, from `src/game.js`) × 300 seeds = **15,900 games per arm**,
2 arms = 31,800 games. Paired: both arms play the identical (level, seed) cells,
so board difficulty and spawn luck cancel in the difference.

### Recorded denominator conflict — unresolved

The per-level win-rate floor has two authoritative statements that disagree:

- `CURRENT.md` states no level sits below **5%**.
- `solver/verify-loop.js:78` enforces `worst.winRate >= 0.20`, i.e. **20%**.

Per `METHOD-010` step 3, this is left unresolved rather than settled for
convenience. Consequence for this run: prediction P2 is reported against **both**
values and this run does not choose between them.

## Seeds

- **Pilot:** 5,000,000 – 5,000,099 (100 seeds).
- **Confirmation:** 6,000,000 – 6,000,299 (300 seeds).

Disjoint from every set already in use in this project: 0–39 search screen,
1e6+ search holdout, 2e6+ width ablation, 3e6+ routing confirmation, 4e6+ routing
pilot. **Only the confirmation set is reportable as the result.** The pilot is a
screen; reporting a number from seeds used to decide whether to continue would
breach the goal's disjointness rule.

## Starting state, recorded independently

- git HEAD `91321e4`, branch `level-curve-retune`.
- Test suite: **196 tests, 195 pass, 1 fail.** The single failure is
  `receiptGate.test.js:161` on `candidate-levels-52.json`, which is known,
  decided, and must remain failing. It is not to be cleared by this work.
- Chain-coverage baseline over the 135 measurable opening boards
  (`.orch/chain-coverage-survey.json`): shipped walk **0.614**, degree tie-break
  **0.734**. Diagnostic only — see the instrument bound below.

## Version hashes (sha256, first 16)

Registered before the run, per `METHOD-023` (freeze the rules, record the
version). Any of these changing invalidates the result.

| file | hash before change |
|---|---|
| `solver/bot.js` | `c6ca87d430a5cfeb` |
| `solver/engine.js` | `1327e13f7db9060f` |
| `solver/policy-eval.js` | `6e6cf26021c7c043` |
| `solver/policy-pool.js` | `72750d85e897544e` |
| `solver/verify-loop.js` | `426631d723b1d6a0` |
| `src/game.js` | `541baa1c05cb0dc4` |

## Checks, classified before outcomes are assigned

Implementation contracts take `PASS` / `FAIL`. Empirical predictions take
`SUPPORTED` / `FALSIFIED` / `INCONCLUSIVE`. Blocked setup, worker crashes, and
unmeasurable boards are **operational states, never evidence about the world.**

### C1 — flag off changes nothing (PASS / FAIL)

With the flag off, `chooseMove` returns chains identical to the pre-change bot
across a fixed sample of boards. Oracle: chosen chains compared cell by cell.

### C2 — positive control, run BEFORE any measurement (PASS / FAIL)

With the flag on, the candidate list must actually contain chains the trimmed
list did not. Threshold declared in advance: **at least 10% of sampled boards**
gain a candidate.

`METHOD-029` step 1: an instrument that reads the same either way is a null
result about the instrument, not about the work. **If C2 fails, the experiment is
vacuous and must not be run.**

### C3 — suite unchanged (PASS / FAIL)

196 tests, 195 pass, and the same single known receipt failure. Any different
failure is a stop.

### P1 — primary empirical prediction

Offering the untrimmed chain raises paired mean score against the shipped bot.

- `SUPPORTED` — lift > 0 and t > 3
- `FALSIFIED` — lift < 0 and t < −3
- `INCONCLUSIVE` — anything else

The `t > 3` bar is this project's own, coded at `solver/policy-search.js:249`
and `solver/policy-ablation.js:113`. It is not lowered, waived, or skipped here.

### P2 — guard against a greedier, worse bot

A bot that takes big off-lattice chains could score higher while winning less,
because a dead tile is a loss the player could not avoid. Win rate is therefore
a falsifier, not a footnote.

- `FALSIFIED` if the arm's overall win rate is below the reference arm's.
- Per-level floor reported against **both** 5% and 20% (see the conflict above).

### P3 — is the gain just more compute?

Relative wall-clock cost is reported per arm. **No compute-matched control is
constructible here**: `solver/bot.js` records that width saturates — width 26 and
32 produce identical play because the cap stops binding — so raising width
cannot buy the extra candidates this change adds. The available calibration
point is that this project measured width 12→24 (1.36× compute) as worth
+1.10%. That is a comparison, not a control, and is recorded as a limitation
rather than dressed up as one.

## Budget and stopping rules

1. If **C2 fails**, stop before a single game is played. Report vacuous.
2. Run the **pilot** (100 seeds). If lift < 0 at t < −2, stop and report
   `FALSIFIED` on the pilot; do not spend the confirmation run.
3. Otherwise run the **confirmation** once, at 300 seeds.
4. **One confirmation run. No re-runs on different seeds.** An `INCONCLUSIVE`
   result stays inconclusive — seed-fishing until a bar is cleared is the
   failure this record exists to prevent.
5. If any protected-evidence condition in `.orch/goal.md` would be breached to
   obtain a result, stop and report the breach instead.

## Instrument bound

Chain coverage measures **opening boards only** — one position per level and
seed, never a mid-game board — while the bot plays 24–30 moves per game. It is a
diagnostic that located this defect. It is **not** the acceptance test, and no
adoption decision rests on it.

It is also coarse. Scores climb in doublings, so 46% of measured boards sit at
the maximum and 49% at roughly half, with 5% in between. It can confirm a board
flipping between those piles; it cannot track a small, broad improvement, and
would report zero for one.

`game-tester` / `policy-eval` on the held-out confirmation seeds is the
load-bearing measurement, as `.orch/goal.md` requires.

## Adoption is a separate decision

Clearing `t > 3` does not flip the default. A stronger bot re-prices every
future level target, because a target is demand × measured achievable score.
Shipped levels keep the targets they were admitted with.

## Operational note

`node --test` prefixes its summary counters with `ℹ`, not `#`. Scraping them
with `grep '^# '` returns nothing and looks like a clean run. Already recorded
as an oracle trap on ticket T-008; repeated here because this record's C3 check
depends on reading those counters correctly.
