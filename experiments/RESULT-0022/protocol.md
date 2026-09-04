---
result: RESULT-0022
status: complete
registered: 2026-09-02T05:34:13.678Z
supersedes: null
reportable: confirmation
version_freeze:
  solver/bot.js: 8d0dec5f6b0669ca
  solver/engine.js: 4e2323b9218aed6a
  solver/policy-eval.js: ab76eeb937b61b85
  src/game.js: 541baa1c05cb0dc4
---

# Pre-registration — <one line: the change under test>

**Registered:** <date>, before any pilot or confirmation game is played.
**Goal:** <path to the frozen goal, if one binds this run>

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

## Seeds

- **Pilot:** <range> (<n> seeds).
- **Confirmation:** <range> (<n> seeds).

<Disjointness from every set already in use. State which set is reportable —
pilot and diagnostic seeds may never be quoted as the result.>

## Starting state, recorded independently

- git HEAD 5f4c3b1b, branch codex/player-style-cross-eval.
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
