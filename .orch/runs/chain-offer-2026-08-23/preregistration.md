# Pre-registration — offering the untrimmed chain to the lookahead (re-registered)

**Rule set:** `chain-offer-v2`
**Registered:** 2026-08-23, before any pilot or confirmation game is played.
**Supersedes:** `.orch/runs/chain-offer-2026-08-21/preregistration.md`
(`chain-offer-v1`), whose own version freeze was broken before its pilot ran —
`solver/bot.js` and `solver/engine.js` both moved (commit `52f500c`,
`CHAIN_PATH_WIDTH=8`, +13.83% t=20.6) after that record was frozen. That
record is left as written, per its own rule that a frozen record is not edited
after the fact. This is a new record against the current bot, not a
correction to the old one.
**Method:** Pattern Atlas `METHOD-010` (pre-register the question and its
failure conditions), `METHOD-023` (freeze the rules, record the version), and
`METHOD-029` (verify the instrument before you believe it).
**Goal:** `.orch/goal.md`, frozen `2026-08-21T19:45:48Z`.

This record is frozen. If the question or the denominator changes, that is a
new scope and a new record — not an edit to this one.

---

## Question (unchanged from v1)

Does offering the lookahead the untrimmed greedy chain, alongside the
mergeable-trimmed chain it already receives, raise the bot's paired game
score without lowering its win rate?

## Why this is being asked (unchanged from v1)

`chooseMove` (`solver/bot.js`) requests candidates from `findGreedyChains`,
whose `preferMergeableSum` defaults to true. Every candidate the lookahead
ever sees has therefore already been cut back to a prefix whose sum lands on
the mergeable lattice (`FACT-0006`). The larger chain the walk actually found
is discarded before the lookahead — whose `rolloutValue` and `harvestValue`
terms exist precisely to price future board damage — is allowed to weigh it.

## Shape of the run (unchanged from v1)

A confirmation of one structural change. Not a search, not a sweep, not an
expansion.

## The change under test (unchanged from v1)

One flag in `solver/bot.js`, `offerFull`, default **off** — already committed,
already proven behavior-identical when off (see C1 below). No new tuned
weight, no new rule.

## Denominator (unchanged from v1)

53 levels (1..53, from `src/game.js`) x 300 seeds = **15,900 games per arm**,
2 arms = 31,800 games. Paired: both arms play the identical (level, seed)
cells.

### Recorded denominator conflict — still unresolved

`.orch/goal.md`'s Protected Evidence carries this as an open `UNRESOLVED`
item: `CURRENT.md` states the per-level win-rate floor as 5%;
`solver/verify-loop.js:78` enforces `worst.winRate >= 0.20`. Per `METHOD-010`
step 3, left unresolved rather than settled for convenience. P2 below is
reported against both values.

## Seeds (unchanged from v1)

- **Pilot:** 5,000,000 – 5,000,099 (100 seeds).
- **Confirmation:** 6,000,000 – 6,000,299 (300 seeds).

Disjoint from every set already in use, including the ones added since v1 was
written: 0–39 search screen, 1e6+ search holdout, 2e6+ width ablation, 3e6+
routing confirmation, 4e6+ routing pilot, 9e6+ this record's own C1/C2
diagnostic (below). **Only the confirmation set is reportable.** Neither the
pilot nor the C1/C2 diagnostic seeds may be quoted as the result.

## Starting state, recorded independently

- git HEAD `52f500c`, branch `level-curve-retune`.
- Test suite: **198 tests, 195 pass, 3 fail.** All three fail at
  `solver/tests/receiptGate.test.js:161`, one per store, each asserting
  `code/input identity mismatch`: `candidate-levels-52.json` (pre-existing,
  owner-decided, unrelated to this change — see
  `docs/CHECK-CARDS.md`), and `candidate-levels-54.json` /
  `candidate-levels.json` (identity-only churn from the already-committed
  `offerFull` edit to `bot.js`, not a value regression — see C1). Full detail
  and the corrected acceptance check for this state: C3′ below, carried over
  unchanged from
  `.orch/runs/chain-offer-2026-08-21/c3-respecification.md`.
- `.orch/chain-coverage-survey.json` (diagnostic baseline from v1) is carried
  forward unverified against the current bot — it is explicitly non-load-
  bearing (see Instrument bound) and no decision in this record rests on it.

## Version hashes (sha256, first 16)

Registered before this record's own C1/C2 re-verification below. Any of these
changing invalidates this record, exactly as it invalidated v1.

| file | hash | changed since v1? |
|---|---|---|
| `solver/bot.js` | `9abe8ca83dc26d85` | yes — `CHAIN_PATH_WIDTH` |
| `solver/engine.js` | `4e2323b9218aed6a` | yes — `CHAIN_PATH_WIDTH` |
| `solver/policy-eval.js` | `6e6cf26021c7c043` | no |
| `solver/policy-pool.js` | `72750d85e897544e` | no |
| `solver/verify-loop.js` | `426631d723b1d6a0` | no |
| `src/game.js` | `541baa1c05cb0dc4` | no |

## Checks, classified before outcomes are assigned

### C1 — flag off changes nothing (PASS / FAIL)

**PASS, by direct code inspection, not sampling.** `collectCandidates` in
`solver/bot.js` reads:

```
const trimmed = findGreedyChains(state, { limit: width, tieBreak, pathWidth });
if (!offerFull) return trimmed;
```

The early return is unconditional and does not depend on `pathWidth` or any
other parameter, so with `offerFull` falsy the function returns exactly
`trimmed` regardless of `CHAIN_PATH_WIDTH`'s value. This is a stronger form
of evidence than v1's sampled 530-game replay (which also passed): a
structural guarantee, not a statistical sample that could miss a divergent
case. Superseding evidence, not merely a note — v1's replayed C1 is
consistent with it and is not repeated here.

### C2 — positive control, run BEFORE any measurement (PASS / FAIL)

**PASS, re-run against the current bot** (script:
`c2-reverify.js`, ad hoc, not part of the repo — reads
`solver/engine.js`'s `findGreedyChains` directly, mirroring
`collectCandidates`'s merge/dedupe exactly, so nothing in `bot.js` needed
touching or exporting to check this). Same seed convention as v1's C1/C2:
53 levels x 10 seeds, 9,000,000–9,000,009, 530 opening boards.

| | v1 (pre-`CHAIN_PATH_WIDTH`) | v2 (current bot) |
|---|---|---|
| boards gaining ≥1 candidate | 530/530 (100%) | 530/530 (100%) |
| of those, new best beats old best | 498/530 (94.0%) | 511/530 (96.4%) |
| opening move actually changes | 419/530 (79.1%) | 511/530 (96.4%) |

Threshold was ≥10% of boards gaining a candidate. The beam search
(`CHAIN_PATH_WIDTH=8`) did **not** make the untrimmed offer redundant — the
gap looks the same size or larger, not smaller. `METHOD-029` step 1 is
satisfied: this instrument still reads differently with the change on than
off.

### C3′ — suite unchanged, corrected for hash-identity churn (PASS / FAIL)

Carried over unchanged from
`.orch/runs/chain-offer-2026-08-21/c3-respecification.md`, which already
correctly describes today's starting state (198/195/3, all three
identity-mismatch, none new). See that file for the full check definition;
not restated here to avoid two documents drifting apart. **PASS** against the
starting state recorded above.

### P1 — primary empirical prediction (unchanged from v1)

Offering the untrimmed chain raises paired mean score against the shipped
bot.

- `SUPPORTED` — lift > 0 and t > 3
- `FALSIFIED` — lift < 0 and t < −3
- `INCONCLUSIVE` — anything else

The `t > 3` bar is this project's own, coded at `solver/policy-search.js:249`
and `solver/policy-ablation.js:113`. Not lowered, waived, or skipped.

### P2 — guard against a greedier, worse bot (unchanged from v1)

- `FALSIFIED` if the arm's overall win rate is below the reference arm's.
- Per-level floor reported against both 5% and 20% (see denominator conflict
  above).

### P3 — is the gain just more compute? (updated for the new baseline)

Relative wall-clock cost reported per arm. Calibration points now include
both v1's (width 12→24: 1.36x for +1.10%) and the more recent one on the same
axis this project has (width/beam 1→8 via `CHAIN_PATH_WIDTH`: 2.69x for
+13.83%, t=20.6). Neither is a compute-matched control — recorded as
comparisons, not dressed up as one, same as v1.

## Budget and stopping rules (unchanged from v1)

1. C1 and C2 already pass (above); this record would not have been written
   otherwise, per `METHOD-029` step 1.
2. Run the **pilot** (100 seeds, 5,000,000–5,000,099). If lift < 0 at t < −2,
   stop and report `FALSIFIED` on the pilot; do not spend the confirmation
   run.
3. Otherwise run the **confirmation** once, at 300 seeds
   (6,000,000–6,000,299).
4. **One confirmation run. No re-runs on different seeds.**
5. If any protected-evidence condition in `.orch/goal.md` would be breached
   to obtain a result, stop and report the breach instead.
6. **New for v2**: before either the pilot or the confirmation is run, verify
   the six file hashes above are still current. If any has moved, this record
   is invalidated the same way v1 was, and running proceeds no further than
   recording that fact in a new stop record.

## Instrument bound (unchanged from v1)

Chain coverage / `.orch/chain-coverage-survey.json` measures opening boards
only and is a diagnostic, not the acceptance test. `game-tester` /
`policy-eval` on the held-out confirmation seeds is the load-bearing
measurement, as `.orch/goal.md` requires.

## Adoption is a separate decision (unchanged from v1)

Clearing `t > 3` does not flip the default. A stronger bot re-prices every
future level target. Shipped levels keep the targets they were admitted with.
