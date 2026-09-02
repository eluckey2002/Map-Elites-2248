---
result: RESULT-0023
status: registered
registered: 2026-09-02T05:41:43.000Z
supersedes: RESULT-0022
reportable: confirmation
version_freeze:
  experiments/RESULT-0023/run.js: 5f20cd7a6552edf6
  experiments/RESULT-0023/verify.js: 03927d6f91ca69cb
  experiments/RESULT-0023/recompute.js: 0179f3b8f143f6eb
  solver/bot.js: 8d0dec5f6b0669ca
  solver/engine.js: 4e2323b9218aed6a
  solver/policy-eval.js: ab76eeb937b61b85
  solver/map-elites-core.js: 2ff166ac8c500969
  solver/map-elites-output/archive.json: 11e50d6b3c5a7f92
  src/game.js: 541baa1c05cb0dc4
---

# Pre-registration — player-style response to narrow-board topology

**Registered:** 2026-09-02, before any control or confirmation game was played.
**Goal:** `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/spec.md`

RESULT-0022 is superseded unused because its initial commit contained an
incomplete template. No control or confirmation game was run under it.

This record is frozen. If the question, subjects, layouts, seeds, thresholds,
or denominator changes, that is a new result record rather than an edit here.

## Question

Do four already-existing, identity-pinned machine policies respond differently
to the added constraint of two adjacent center stones rather than one center
stone on the same narrow 4-by-8 board?

## Why this is being asked

The qualified human pilot disposed the tested variant as `variant/repair`, while
the owner's observations identified narrow width and adjacent center blockers
as potentially meaningful strategic constraints. This run tests only the small
premise needed before choosing descriptor work or a larger optimization loop:
whether existing machine policies expose a measurable policy-by-topology
interaction under the current simulator semantics.

The run does not claim human fun, human difficulty, mechanic correctness,
shipping suitability, or that any policy represents a human persona.

## Shape of the run

This is one bounded, paired-seed cross-evaluation. It is not a search, policy
training run, MAP-Elites run, OpenEvolve run, co-evolution run, champion
promotion, or mechanic acceptance test.

## Subjects and layouts

The four policies and identities are fixed in `run.js`:

- current base — `0de51bc557de`
- historical long-chain — `a61e8b8e23b7`
- historical short-chain — `4cbec6509c34`
- historical late-score — `ebeb9e326a01`

Each policy plays the same seeds on three 4-by-8 layouts with 24 moves,
`minChain: 3`, `tileScale: 32`, and no finite target:

1. open — no blockers
2. one-center-stone — one stone at `(2,3)`
3. two-center-stones — adjacent stones at `(1,3)` and `(2,3)`

This experiment is bound to the current stone and gravity semantics. It does
not accept those semantics as correct.

## Denominator

- Control: 4 policies x 3 layouts x 12 seeds = 144 cells, executed twice.
- Confirmation: 4 policies x 3 layouts x 200 seeds = 2,400 reportable cells.
- Comparisons are paired by policy and seed.
- For each policy, the primary response is the geometric mean score ratio
  `two-center-stones / one-center-stone`, expressed as ratio minus one.

## Seeds

- **Control only:** `20000000..20000011` (12 seeds; never reportable).
- **Confirmation:** `21000000..21000199` (200 seeds; reportable).
- **Fixed confirmation halves:** `21000000..21000099` and
  `21000100..21000199`.

No control seed may occur in the confirmation artifact. There is no pilot
whose outcome may be quoted as this result.

## Starting state, recorded independently

- Frozen goal/spec commit: `a8210cf`.
- Registration branch: `codex/player-style-cross-eval` in isolated worktree
  `/private/tmp/2248-player-style-cross-eval-20260902`.
- Parent game state: `84d5037`.
- Protocol, runner, and both verifiers are committed before C1/C2 execute.
- `tools/verify-experiments.js` and
  `node --test solver/tests/experiments.test.js` must pass before the control
  artifact is generated. Named failures stop the run.

## Version hashes (sha256, first 16)

The complete behavioral and verification closure is in `version_freeze`.
Every artifact records full SHA-256 values for the same paths. A mismatch or
missing path invalidates the artifact and stops the run.

## Checks, classified before outcomes are assigned

### C1 — negative control

Run every control cell twice through the real `playToBudget` seam. The two
serialized cell arrays must be byte-for-byte equivalent after canonical JSON
encoding. Any difference is `FAIL` and confirmation does not run.

### C2 — positive control, before confirmation

Using the same check and real control artifacts, at least one policy-seed pair
must produce a different serialized outcome between one-center-stone and
two-center-stones. Zero changed pairs is `FAIL` and confirmation does not run.

### C3 — subject and source closure

The verifier must reproduce all four policy identities, all three layout
identities, the exact seed matrix, and the full source hashes frozen above.
Missing, duplicate, extra, or changed subjects/cells/sources are `FAIL`.

### P1 — primary empirical prediction

Let `spread` be the maximum minus minimum of the four policies' primary score
responses. “Most affected” means the lowest response; “least affected” means
the highest response.

- `SUPPORTED` — P2 passes, `spread >= 0.05`, and the unique most-affected and
  least-affected policy identities are identical in both fixed seed halves.
- `FALSIFIED` — P2 passes and `spread < 0.02`.
- `INCONCLUSIVE` — every other outcome.

### P2 — distinct-style guard

On the open layout, aggregate each policy's behavior counters. The guard passes
when either the across-policy range of mean chain length is at least `0.15`, or
the across-policy range of late-score share is at least `0.02`. If neither is
true, P1 cannot be `SUPPORTED` or `FALSIFIED` because the selected policies did
not demonstrate the intended behavioral separation in this run.

### P3 — evaluator-count and compute diagnostic

Report the exact cell counts and early-termination rates for each policy and
layout. This is a matched-seed comparison using the same evaluator and move
budget, but it is not a compute-matched comparison of alternative search
algorithms. P3 is diagnostic and cannot change P1.

## Budget and stopping rules

1. Commit this protocol and its complete source closure.
2. Run the repository experiment gates. Stop on any failure.
3. Generate one control artifact; C1, C2, and C3 must pass through `verify.js
   controls`. Stop on failure.
4. Generate the 2,400-cell confirmation artifact exactly once.
5. Run `verify.js all`, then independently recompute P1/P2 with `recompute.js`.
   The two verdicts and load-bearing quantities must agree.
6. Challenge the same `verify.js` with a broken twin whose stored score changes
   without updating its artifact identity; it must fail.
7. No alternate seeds, threshold changes, policy substitutions, or reruns.

The hard maximum is 2,400 reportable games and one 288-cell control execution
(144 cells executed twice). There are no external calls and no required human
time.

## Instrument bound

The load-bearing measurements are the paired geometric score responses, the
open-layout behavior-counter guard, and the fixed-half ordering stability.
One-vs-open response and early termination are diagnostics only. Human pilot
remarks and recordings motivated the layouts but are not observations in this
result.

## Adoption is a separate decision

Even `SUPPORTED` authorizes only the claim that this fixed policy set contains
measurably different topology responses under the current simulator. It may
justify designing a next descriptor or archive experiment. It does not select
a level, validate stones, promote a champion, admit evidence to the ledger, or
authorize MAP-Elites, OpenEvolve, or co-evolution delivery.
