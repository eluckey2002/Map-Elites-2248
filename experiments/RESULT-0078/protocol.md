---
result: RESULT-0078
status: registered
registered: 2026-09-30T23:10:30.674Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0078/registered-protocol.md: 3188606e21fde8b1
  experiments/RESULT-0078/closeout-contract.json: e729504934cdf87e
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/bomb-lattice-challenger.js: ad44b2200c47f649
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/persist-before-verdict.js: 02df81dbcf6264f4
  experiments/RESULT-0078/subject.js: 56c06dc35f9929f0
  experiments/RESULT-0078/run.js: 6392b07c6125277c
  experiments/RESULT-0078/recompute.js: 4ac535bbb981fffc
  experiments/RESULT-0078/close.js: 365f2f58f365c925
  experiments/RESULT-0078/subject.test.js: 3e7d2ab35a448d1a
  solver/tests/bombLatticeChallenger.test.js: 83183c435634df97
  tools/vendor/close-experiment/verify_closure.py: 7ed2647d28bfe3df
---

# Pre-registration — mergeable bomb-defusal challenger

**Registered:** 2026-09-30, before the 1,160 reportable paired cases are opened.

The complete immutable protocol is `registered-protocol.md`, SHA-256
`3188606e21fde8b168356d95052a82f4cf28196d85100feb1ffcfad6f1ab059a`.
Its executable closeout contract is `closeout-contract.json`, SHA-256
`e729504934cdf87e32ce1fd678f2797023c23747cc81d995bb7d919e7d1b006a`.
The frozen final subject identity is
`bcce8a0a83a163e7cd1839c2c38e6a527bace4fab71ff2c1b31639b120f0d50c`.

This record is frozen. If the question or the denominator changes, that is a
new scope and a new record — not an edit to this one.

---

## Question

<The one question this run answers. Answerable yes/no or with a number.>

## Why this is being asked

<What in the code or prior evidence makes this worth measuring. Cite records.>

## Shape of the run

<Confirmation of one structural change? A search? A sweep? Say which, and say
what it is not.>

## The change under test

<Exactly what moves. One flag, one rule, one weight. Name the file.>

## Denominator

<Levels x seeds = games per arm, arms, paired or unpaired. Record any conflict
between two sources of truth rather than settling it for convenience.>

## Sample size and margin

<Required for protocols registered from 2026-09-27 (BL-0016 F6).>
- **Per verdict:** <the number of games, pairs, or rows each verdict rests on,
  and why that number can tell the verdict apart from chance.>
- **Margin:** <how many more misses would flip each verdict. If one miss flips
  it, say so here; that is a fragile bar, not a pass with room.>
- **Downstream quantity:** <if a later stage will use a combined measure (for
  example the joint rate at which two descriptors both stay in the same cell),
  register a bar for that combined measure here, not only for its parts.>

## Seeds

- **Pilot:** <range> (<n> seeds).
- **Confirmation:** <range> (<n> seeds).

<Disjointness from every set already in use. State which set is reportable —
pilot and diagnostic seeds may never be quoted as the result.>

## Starting state, recorded independently

- git HEAD fd9fbb88, branch codex/lc0013-target-gap-arithmetic.
- Test suite: <N tests, N pass, N fail>, each failure named and classified as
  pre-existing or caused by this change.

## Version hashes (sha256, first 16)

<Table of every file whose behavior this result depends on. Any of these
changing before the run invalidates this record — it does not get edited, it
gets superseded by a new one.>

## Checks, classified before outcomes are assigned

### C1 — negative control (PASS / FAIL)
<With the change off, nothing moves. Say how this is established: structural
argument beats a sample.>

### C2 — positive control, run BEFORE any measurement (PASS / FAIL)
<The instrument reads differently with the change on than off. If it does not,
stop — the measurement cannot show anything.>

### C3 — suite unchanged (PASS / FAIL)
<Named failures before equal named failures after.>

### P1 — primary empirical prediction
<The claim. With explicit thresholds:>
- `SUPPORTED` — <condition>
- `FALSIFIED` — <condition>
- `INCONCLUSIVE` — anything else

### P2 — guard against a worse system that scores better
<What would make this a bad change even if P1 passes.>

### P3 — is the gain just more compute?
<Relative cost per arm, with calibration points. Say plainly if it is not a
compute-matched control.>

## Budget and stopping rules

1. <C1 and C2 pass before anything is measured.>
2. <Pilot. Stop condition that spends nothing further.>
3. <Confirmation, run once.>
4. **One confirmation run. No re-runs on different seeds.**
5. <What breach stops the run and gets reported instead of a result.>

## Instrument bound

<Which measurement is load-bearing and which is diagnostic. A diagnostic may
never become the acceptance test after the fact.>

## Adoption is a separate decision

<Clearing the bar does not ship the change. Say what shipping would re-price.>
