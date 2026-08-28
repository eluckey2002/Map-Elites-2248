# Stop record — chain-offer-v2

**Status: STOPPED at the pilot, per the pre-registered stopping rule.
Confirmation not run. FALSIFIED.**

Companion to `preregistration.md` in this directory, which is frozen and is
not edited by this record.

---

## Outcome against the frozen checks

| check | class | outcome |
|---|---|---|
| C1 — flag off changes nothing | implementation | **PASS** (code inspection) |
| C2 — positive control | implementation | **PASS** (re-verified against current bot) |
| C3′ — suite unchanged, corrected for hash churn | implementation | **PASS** |
| Pilot — P1 (paired score lift) | empirical | **FALSIFIED** |
| Pilot — P2 (win rate must not fall) | empirical | **FALSIFIED** |
| Confirmation | — | **not run** — pre-registered stopping rule fired |

## The pilot

100 seeds (5,000,000–5,000,099), 53 levels, 5,300 games per arm.

```
arm                   lift   clustSE   naiveSE      t   winRate   meanScore   rel.cost
-----------------   ------   -------   -------   ----   -------   ---------   --------
trimmed only        +0.00%     0.00%     0.00%    0.0     99.4%       51811   1.00x
untrimmed offered   -23.14%     1.48%     0.29%  -17.8     88.9%       38212   1.34x
```

P1 (needs t > 3 to be `SUPPORTED`, t < −3 to be `FALSIFIED`): **FALSIFIED** at
t = −17.8, an order of magnitude past the bar — not a borderline read.

P2 (win rate must not fall): **FALSIFIED** — 99.4% → 88.9%, −10.5 points.
53 of 53 levels hurt; best case level 10 at −6.1%, worst level 32 at −36.2%.

Pilot stopping rule, as registered: *"If lift < 0 at t < −2, stop and report
FALSIFIED on the pilot; do not spend the confirmation run."* That threshold
was cleared by nearly 9x. Per rule 4 in `preregistration.md` ("one
confirmation run, no re-runs on different seeds"), no further games were
played and none should be — this is a decisive result on its own terms, not
an ambiguous one that a bigger sample might flip.

## Why the result makes sense, not just what it is

C2 already showed the untrimmed candidates frequently score higher on
immediate/rollout terms than the trimmed list's best option — that is what
made them worth offering. It is also exactly what makes them dangerous:
`FACT-0006` (the mergeable-sum lattice) means a chain landing off-lattice
makes a tile nothing can ever match again. The trimmed list exists
specifically to keep the lookahead from ever being tempted by one. Removing
that filter lets `wRoll`/`wPlace`/`wHarvest` chase a locally bigger number
straight into bricking the board — consistent with every level losing win
rate, not a mixed picture.

## Answer to the pre-registered question

*"Does offering the lookahead the untrimmed greedy chain... raise the bot's
paired game score without lowering its win rate?"* **No — decisively no.** It
lowers both. This is a clean, informative negative result, not an
inconclusive one, and closes this specific avenue without needing further
measurement.

## File state as of this record

**Modified:** none. `solver/bot.js`'s `offerFull` flag remains default `0`,
exactly as before this run — this record only exercised the existing,
already-committed flag via `params` overrides in
`solver/chain-offer-ablation.js`, never by changing the shipped default.

**Created:** `.orch/runs/chain-offer-2026-08-23/preregistration.md`,
`c2-reverify.js`, and this file.

**Not modified:** every protected gate file
(`verify-loop.js`, `policy-search.js`, `policy-ablation.js`),
`solver/calibration.js`, every level and curve file, every receipt, and
`.orch/goal.md`.

## No adoption question arises

`preregistration.md` treats adoption as a separate decision even on a
`SUPPORTED` result. It does not arise here at all: the change is falsified,
so there is nothing to consider adopting.
