---
result: RESULT-0034
status: complete
registered: 2026-09-16T10:33:22Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0034/subject.js: f518673eaf4cc8a2
  experiments/RESULT-0034/run.js: 3dbd439e7ee49c31
  experiments/RESULT-0034/verify.js: 2099bc826700ac33
  experiments/RESULT-0034/run.test.js: a9e8c19913221594
  solver/forced-diversity-descriptors.js: f8c41a7520295bb9
  solver/tests/forcedDiversityDescriptors.test.js: 22ff779487ebf89c
  solver/choice-recovery-descriptors.js: e6e64c71d2f0ce8b
  solver/exact-score.js: edf48486735048e8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — forced-prefix × bounded-diversity candidate descriptors

**Registered:** 2026-09-16, before any confirmation seed was opened.

## Question

Do bounded successful-witness-set proxies for forced moves and solution
diversity respond to controls, show useful range on fresh representative
boards, and remain stable under a fourfold beam-width increase?

## Intended constructs and executable proxies

- **Forced-move construct:** share of solution states with only one useful
  move. **Proxy:** `forcedPrefixRatio`, the share of one canonical successful
  witness's prefixes having only one next ordered chain represented in the
  registered bounded success set.
- **Solution-diversity construct:** meaningfully different ways to reach the
  target. **Proxy:** `distinctOpeningMoves`, distinct ordered opening chains
  represented among up to 64 bounded successful witnesses, capped at eight
  witnesses per opening.

These are bounded success-set properties, not exhaustive forcedness or a true
solution count. Misses remain `UNKNOWN`; neither proxy measures players,
difficulty, fun, or preference.

## Shape, denominator, and seeds

Shipped Levels 10, 31, 53, and 54; eight fresh seeds each; paired widths 12
and 48; 16 candidates per state; path width 2; 64 successes; eight per opening.
Confirmation seeds are 32,800,000–32,800,007. Calibration seed 32,700,000 is
burned and excluded. This is 32 puzzles and 64 paired observations.

Parent HEAD is `c2dbf0ce65c071827e382d77e8f72063228849c9`. Focused controls pass 3/3.
The solver baseline is 399 tests: 394 pass, four deliberate failures, one skip.

## Checks, classified before outcomes are assigned

### C1 — linear-versus-branching positive control (PASS / FAIL)

A two-move fixture with one successful opening must report forced ratio 1 and
opening diversity 1; a one-move branching fixture must report forced ratio 0
and opening diversity 4. Failure stops confirmation.

### C2 — bounded-miss negative control (PASS / FAIL)

An unreachable-within-budget fixture must return `UNKNOWN`, never zero
diversity or forcedness. Failure stops confirmation.

### C3 — registration, identity, source closure, and recomputation (PASS / FAIL)

Unregistered execution must fail. Artifact identity, protocol ancestry, frozen
sources, and full deterministic recomputation must close. Planted artifact
mutation must fail.

### C4 — suite unchanged (PASS / FAIL)

The post-run suite must retain exactly four deliberate failures and one skip.

### P1 — representative coverage

`SUPPORTED` when deep search finds success sets on at least 30/32 puzzles and
all four profiles; otherwise `INCONCLUSIVE`.

### P2 — descriptor range

`SUPPORTED` when forced-prefix range is at least 0.15 and at least two opening-
diversity values each contain four deep rows; otherwise `INCONCLUSIVE`.

### P3 — search-width stability

`SUPPORTED` when at least 28 pairs are measured, at least 75% keep forced
ratio within 0.15, and at least 75% retain exact opening diversity; otherwise
`INCONCLUSIVE`.

### P4 — scoped disposition

`SUPPORTED` only if C1–C4 and P1–P3 pass; then the pair is eligible for a
separate registered MAP corpus. Otherwise revise before MAP use.

## Budget and stopping rules

Commit this protocol and frozen code before opening confirmation seeds. Run
controls first, then the 32-board confirmation once, then one deterministic
recomputation. Preserve `UNKNOWN`. Do not add seeds, profiles, widths, or alter
thresholds after results.

## Instrument bound and adoption

The bounded success set is load-bearing. It may not be relabelled exhaustive.
Clearing the bar permits only a separately registered corpus; it changes no
game content or prior descriptor result.
