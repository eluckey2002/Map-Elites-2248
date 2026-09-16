---
result: RESULT-0030
status: registered
registered: 2026-09-16T07:01:28Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0030/subject.js: 091b43b6cf74537a
  experiments/RESULT-0030/run.js: 7e20aed0e0743df1
  experiments/RESULT-0030/verify.js: 3747aacdfa610713
  experiments/RESULT-0030/run.test.js: f5695801852d542c
  experiments/RESULT-0030/verify.test.js: 8269323f042fdf5e
  solver/puzzle-descriptor-witness.js: 2ee3e747af42bcd5
  solver/tests/puzzleDescriptorWitness.test.js: 25a72f8557916aa1
  solver/exact-score.js: edf48486735048e8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — witness-bounded descriptors on representative 2248 boards

**Registered:** 2026-09-16, before any confirmation seed is opened.
**Roadmap:** successor to the exact micro-puzzle study in `RESULT-0029` and
its scoped non-promotion in `DECISION-0006`.

This record is frozen. The larger-board measurements are deliberately given
new names: they are witness-derived upper bounds and are not the exact
descriptors measured in `RESULT-0029`.

---

## Question

Can deterministic, replayable upper-bound proxies for budget tightness and
chain-length dependence be recovered across the actual 5x8, 5x7, 6x5, and
4x8 game configurations, and do their coarse bins remain stable when search
width increases fourfold on an unseen paired panel?

## Why this is being asked

`RESULT-0029` was exact but limited to 3x3, two-move puzzles and did not fill
its frozen map. The game is not a 3x3 game: shipped Levels 10, 31, 53, and 54
provide four representative configurations with 40, 35, 30, and 32 cells.
Exhaustive whole-game search over their 16–30 move budgets is not tractable in
the existing exact instrument. A successful legal witness can nevertheless
establish an upper bound on moves and chain cap required. A bounded miss
cannot establish unreachability and remains `UNKNOWN`.

## Shape of the run

One deterministic paired confirmation panel. Every level/seed puzzle is run
through the same bounded candidate generator at widths 12 and 48, with 16
actions retained per state, path width 2, and chain caps 2, 3, 4, 6, 8, 12,
plus the full cell count. The arms share one puzzle identity and differ only
in beam width.

The panel uses shipped level configurations without changing targets, move
budgets, minimum chain lengths, tile scales, or blockers:

- Level 10: 5x8, 22 moves.
- Level 31: 5x7, 30 moves.
- Level 53: 6x5, 16 moves.
- Level 54: 4x8, 24 moves, two stones.

This is not exact search, a natural-frequency estimate, a human study, a rule
change, or a MAP-Elites run.

## Frozen proxy definitions

- **Minimum-moves upper bound:** fewest moves among successful registered
  bounded-search witnesses.
- **Budget-tightness upper bound:** minimum-moves upper bound divided by the
  allowed move budget.
- **Chain-length-dependence upper bound:** smallest tested maximum chain cap
  with a successful registered witness.

A successful witness has `replayed_upper_bound` standing. A miss has
`UNKNOWN` standing. Neither standing may be renamed exact minimum,
unreachable, difficulty, fun, or player preference.

For the stability check only, budget tightness at or below 0.5 is `relaxed`
and a chain cap at or below 12 is `short`; the other sides are `tight` and
`long`. These are proxy bins, not game-quality labels.

## Denominator and seeds

- Diagnostic runtime calibration: seed 32,000,000 on all four profiles. It
  was exposed before registration and is excluded from every result.
- Confirmation: seeds 32,100,000–32,100,001 on each of four profiles.
- Eight paired puzzle identities and sixteen search-arm observations.

Repository and `experiments/SEEDS.md` searches found the confirmation range
unused. No alternate seed, level, cap, or threshold may replace a miss.

## Starting state, recorded independently

- Parent git HEAD `5a62c1d1b7b64f533721766f3d0ea41e65419e45`, branch
  `feat/puzzle-descriptor-validation`, in the existing isolated worktree.
- Focused qualification: 9 tests, 9 pass, 0 fail.
- Full solver plus new experiment baseline: 394 tests, 389 pass, 4 fail,
  1 skipped. The four deliberate failures are the two stale candidate
  receipts, generated-view staleness, and date drift; they predate this work
  and are not repaired or exempted.

## Checks, classified before outcomes are assigned

### C1 — deterministic repeat and scale control (PASS / FAIL)

The same bounded fixture must repeat byte-for-byte, and every generated spawn
on a scale-32 fixture must remain in the scale-32 lattice. A mismatch is
`FAIL` and stops the confirmation.

### C2 — planted identity and witness defects (PASS / FAIL)

The public verifier seam must reject an artifact body changed after hashing,
reject shallow/deep arms bound to different puzzle identities, and reject a
tampered witness that is unavailable, illegal, or exceeds its recorded cap.
If any bad twin passes, C2 is `FAIL` and the confirmation does not run.

### C3 — suite unchanged (PASS / FAIL)

The post-run full suite must retain exactly the four named deliberate failures
and one skip. Any new failure is `FAIL`.

### C4 — standing and source closure (PASS / FAIL)

The runner must refuse unregistered execution. The artifact must bind to this
registration commit and every frozen behavior source. Every successful row
must replay to its recorded score and target under its cap. Every miss must
remain `UNKNOWN`. Any violation is `FAIL`.

### P1 — representative-panel coverage

- `SUPPORTED` — the deep arm finds replayable target witnesses on at least
  seven of eight puzzles, including at least one on every board profile.
- `INCONCLUSIVE` — otherwise.

There is no falsified outcome because bounded misses cannot disprove
reachability or descriptor usefulness.

### P2 — paired search-width stability

- `SUPPORTED` — at least six puzzle identities have witnesses in both arms,
  at least 75% of those pairs retain the same relaxed/tight and short/long
  proxy bin, and the deeper arm worsens neither upper bound on any pair.
- `INCONCLUSIVE` — otherwise.

### P3 — compute accounting (PASS / FAIL)

Record expanded states for both arms and their ratio. This is diagnostic, not
a compute-matched comparison and not a promotion threshold. Missing counts are
`FAIL`.

### P4 — scoped disposition

- `SUPPORTED` when C1–C4 pass and P1–P2 are supported: the proxies become
  eligible inputs to a separately registered representative-board MAP corpus.
- `INCONCLUSIVE` otherwise: revise the proxy or search before building that
  corpus.

Even a supported result does not promote the exact descriptor names for large
boards and does not overturn `DECISION-0006`.

## Budget and stopping rules

1. Commit this protocol, implementation, tests, and seed reservation before
   opening a confirmation seed.
2. Run C1 and C2 before confirmation; stop on failure.
3. Run the eight-puzzle confirmation exactly once. The runner refuses
   overwrite.
4. Verify by deterministic recomputation exactly once.
5. Preserve every `UNKNOWN`; do not add width, caps, seeds, or substitute
   levels after seeing results.

Hard limits: four profiles, two confirmation seeds, seven cap values per arm,
widths 12 and 48, 16 candidates per state, path width 2, and each shipped
profile's existing move budget.

## Instrument bound

Load-bearing evidence is legal witness replay, shared puzzle identity, the
predeclared upper-bound names, paired confirmation, and full deterministic
recomputation. Expanded states are diagnostic. Search failure is never
negative reachability evidence.

## Adoption is a separate decision

Clearing this protocol only permits a later, separately registered corpus to
use the proxy coordinates. It does not create a MAP-Elites archive, change a
level, replace the exact definitions, or establish player-facing meaning.
