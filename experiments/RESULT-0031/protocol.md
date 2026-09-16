---
result: RESULT-0031
status: registered
registered: 2026-09-16T08:34:23Z
supersedes: RESULT-0030
reportable: confirmation
version_freeze:
  experiments/RESULT-0031/subject.js: ca4a406106609b87
  experiments/RESULT-0031/run.js: b1ddb00962588ba1
  experiments/RESULT-0031/verify.js: f64239105d573061
  experiments/RESULT-0030/subject.js: 091b43b6cf74537a
  experiments/RESULT-0030/run.js: 7e20aed0e0743df1
  solver/puzzle-descriptor-witness.js: 0dc5892b5395079b
  solver/tests/puzzleDescriptorWitness.test.js: 105c89886cfc7e20
  solver/exact-score.js: edf48486735048e8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — corrected-cap representative-board descriptor proxies

**Registered:** 2026-09-16, before either confirmation seed was opened.
**Supersedes:** invalidated `RESULT-0030`, as recorded by `CORRECTION-0006`.

This record freezes the corrected combined candidate cap, fresh seeds, paired
search widths, descriptor proxy definitions, thresholds, and disposition rule.

## Question

When the registered 16-candidate limit is enforced after combining both
candidate families, can replayable upper-bound proxies cover the actual 5x8,
5x7, 6x5, and 4x8 configurations, and do their coarse cells remain stable
when beam width increases fourfold on fresh paired puzzles?

## Why this is being asked

`RESULT-0030` cannot answer this question. Its implementation limited each of
two candidate families to 16 before union, allowing up to 32 candidates per
state. `CORRECTION-0006` invalidates its panel-level claims. The corrected
instrument ranks the combined unique candidates and retains at most 16.

## Shape of the run

One deterministic paired confirmation on shipped Levels 10, 31, 53, and 54:
5x8, 5x7, 6x5, and 4x8. Each level/seed puzzle runs at beam widths 12 and 48.
Both arms use path width 2, chain caps 2, 3, 4, 6, 8, 12 plus full cell count,
and one hard combined limit of 16 candidates per expanded state.

This is bounded witness search, not exhaustive search, a frequency estimate,
a human study, a level change, or a MAP-Elites run.

## Frozen proxy definitions

- **Minimum-moves upper bound:** fewest moves among successful registered
  bounded-search witnesses.
- **Budget-tightness upper bound:** that move upper bound divided by allowed
  moves.
- **Chain-length-dependence upper bound:** smallest tested cap with a
  successful registered witness.

Success has `replayed_upper_bound` standing. A miss remains `UNKNOWN`.
For stability only, tightness at or below 0.5 is `relaxed`, and cap at or below
12 is `short`; the other sides are `tight` and `long`.

## Denominator and seeds

- Confirmation seeds: 32,200,000–32,200,001 on each of four profiles.
- Eight puzzle identities and sixteen paired search-arm observations.
- The range was unused before registration. RESULT-0030's 32,100,000 range
  is excluded and remains burned.

## Starting state, recorded independently

- Parent git HEAD `5f7bf21f364f2ef02cb911612d15a1a9595696df`, branch
  `feat/puzzle-descriptor-validation`, isolated worktree.
- Focused controls: 10 tests, 10 pass, 0 fail.
- Solver baseline: 391 tests, 386 pass, the same four deliberate failures,
  and one skip.

## Checks, classified before outcomes are assigned

### C1 — deterministic repeat and scale control (PASS / FAIL)

The existing repeat, witness, `UNKNOWN`, identity, and scale controls must pass
before confirmation. Any failure stops the run.

### C2 — combined candidate cap (PASS / FAIL)

The permanent fixture must show `generatedActions <= expandedStates ×
actionsPerState`. Every confirmation run must satisfy the same inequality with
`actionsPerState: 16`. A single violation is `FAIL` and invalidates the run.

### C3 — suite unchanged (PASS / FAIL)

The post-run solver suite must retain exactly the four named deliberate
failures and one skip. Any new failure is `FAIL`.

### C4 — registration, replay, identity, and source closure (PASS / FAIL)

The runner must refuse unregistered execution. The artifact must bind to this
registration commit and all frozen sources. Search arms must share puzzle
identity, every successful witness must replay under its cap, every miss must
remain `UNKNOWN`, and full recomputation must agree byte-for-byte.

### P1 — representative-panel coverage

- `SUPPORTED` — the deep arm finds replayable target witnesses on at least
  seven of eight puzzles, including at least one on every profile.
- `INCONCLUSIVE` — otherwise.

### P2 — paired search-width stability

- `SUPPORTED` — at least six puzzles have witnesses in both arms, at least
  75% retain the same proxy bin, and the deeper arm worsens neither upper
  bound on any pair.
- `INCONCLUSIVE` — otherwise.

### P3 — compute accounting (PASS / FAIL)

Record expanded states for both arms and their ratio. Missing counts are
`FAIL`; the arms are not compute matched and the ratio is not a promotion bar.

### P4 — scoped disposition

- `SUPPORTED` when C1–C4 pass and P1–P2 are supported: the proxies become
  eligible inputs to a separate registered MAP corpus.
- `INCONCLUSIVE` otherwise: revise before building that corpus.

## Budget and stopping rules

1. Commit this protocol, corrected instrument, invalidation record, tests, and
   seed reservation before opening a confirmation seed.
2. Run C1 and C2 first; stop on failure.
3. Run the eight-puzzle confirmation exactly once; refuse overwrite.
4. Verify by deterministic recomputation exactly once.
5. Preserve `UNKNOWN`; do not add widths, caps, seeds, or levels after seeing
   results.

Hard limits: four profiles, two seeds, seven cap values per arm, widths 12 and
48, one combined cap of 16 candidates per state, path width 2, and shipped
move budgets.

## Instrument bound

Load-bearing evidence is combined-cap conformance, legal witness replay,
shared puzzle identity, paired fresh confirmation, and deterministic
recomputation. Search failure never proves unreachability.

## Adoption is a separate decision

Clearing this protocol permits only a later registered corpus to use these
proxy coordinates. It does not create an archive, restore RESULT-0030, promote
the exact descriptor names on large boards, or establish player-facing meaning.
