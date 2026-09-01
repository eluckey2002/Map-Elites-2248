---
result: RESULT-0020
status: complete
registered: 2026-09-01T04:47:42.294Z
supersedes: null
reportable: confirmation
version_freeze:
  solver/bot.js: 8d0dec5f6b0669ca
  solver/engine.js: 4e2323b9218aed6a
  solver/policy-eval.js: ab76eeb937b61b85
  src/game.js: 541baa1c05cb0dc4
  solver/target-aware-challenger.js: 6b375b159c836b1e
  solver/target-aware-evaluation.js: 07bc3a167f99a906
  solver/target-aware-worker.js: ed25df87210c7be6
---

# Pre-registration — replicate RESULT-0018's holdout under a registered protocol

**Registered:** 2026-09-01, before any screen or holdout game is played.
**Goal:** [BL-0005](../../docs/backlog/BL-0005-retrofit-result-0018-protocol.md)
and its acceptance test
[BL-0005-FINISH-LINE](../../docs/backlog/BL-0005-FINISH-LINE.md).

This record is frozen. If the question or the denominator changes, that is a
new scope and a new record — not an edit to this one.

---

## Question

Run on a clean checkout of `main` with a registered protocol, does the
target-aware immediate-finish rule reproduce `RESULT-0018`'s sealed holdout
result — specifically its two load-bearing zeros, no existing win made slower
and no champion-win regression, and its six exact counts?

## Why this is being asked

`DECISION-0004` promoted the target-aware policy into `solver/bot.js` on the
strength of `RESULT-0018`, which was accepted before the experiment gate
existed and is grandfathered in
[GRANDFATHERED.md](../GRANDFATHERED.md). It is the only shipped change resting
on an unprotocolled result.

Nobody doubts the original measurement. The gap is narrower: asked "how do you
know the analysis was not shaped by the outcome," the honest answer today is
"we checked afterward." Two further facts sharpen it.

- The challenger source recorded in the original artifact, sha256 `ba75b5a6…`,
  has never existed at `solver/target-aware-challenger.js`.
  `git rev-list --objects --all` finds exactly one blob ever associated with
  that path across every ref, hashing to `6b375b15…`. That run was made from a
  working tree git cannot reconstruct.
- The instrument that produced it was, until commit `ab4b9d7`, comparing the
  promoted policy against itself. Over 52 levels x 10 screen seeds it returned
  520 of 520 identical cells. Any re-run before that fix would have measured
  nothing while exiting 0.

## Shape of the run

A confirmation of one structural change, run once. It is a **replication**:
the same question, the same denominator, and the same seeds as `RESULT-0018`,
on recoverable code with the plan committed first.

It is **not** a search, not a sweep, not a re-tuning, and not a re-opening of
`DECISION-0004`. No parameter is being fitted.

## The change under test

`solver/target-aware-challenger.js` `chooseTargetAwareMove` against
`solver/bot.js` `chooseBaseMove`. When a deterministic untrimmed legal route
reaches the finite unmet target immediately, the challenger takes it instead
of trimming back to a merge-friendly survivor; it never applies the override
while a bomb is present.

Two instrument changes landed at commit `ab4b9d7`, **before** this
registration, and are declared here rather than left silent:

1. The evaluation's champion arm was moved from `chooseMove` to
   `chooseBaseMove`. On `main`, `chooseMove` is the promoted target-aware
   policy, so the arm was comparing that policy with itself. This is a
   measurement fix; without it the run is a guaranteed null.
2. `parseArgs` now accepts and ignores `--protocol <id>` and `--exploratory`.
   The registration guard consumes them off raw `process.argv` at module load,
   after which `parseArgs` rejected them as unknown arguments — so the command
   this gate requires could not run at all.

Neither is a change to the policy under test. `solver/bot.js` is not modified
by this experiment and does not change as a result of it.

## Denominator

52 levels x 300 seeds = **15,600 paired cells**, two arms, paired on level and
seed. Each cell plays both arms from the same board with the same spawn
stream. Preceded by a 13-level x 40-seed screen (520 paired cells), which is
diagnostic and not reportable.

`RESULT-0018` reports the same 15,600. No conflict between sources of truth is
known; if one appears it is recorded, not settled for convenience.

## Seeds

- **Diagnostic:** seed 1 on Level 51 — the teaching board the rule was
  extracted from. Training data. Never reportable.
- **Screen (pilot):** 12,000,000–12,000,039 (40 seeds) on 13 levels.
- **Confirmation (holdout):** 13,000,000–13,000,299 (300 seeds) on all 52
  shipped levels.

The three sets are disjoint, are fixed constants in
`solver/target-aware-evaluation.js`, and are pinned by
`solver/tests/targetAwareEvaluation.test.js`. **Only the holdout is
reportable.** Screen and diagnostic numbers may not be quoted as the result.

Level 53 exists on `main` and is **excluded** — the holdout level set is
1–52, as it was for `RESULT-0018`. The levels 1–52 definitions are unchanged
since RESULT-0018's evidence commit `6a07294`, verified by comparing the
parsed `LEVELS` arrays for structural equality.

## Starting state, recorded independently

- git HEAD `ab4b9d7`, branch `main`, clean checkout, pushed to `origin/main`.
- All four gates green at that commit: `verify-loop`, `verify-universe-map`,
  `verify-repo-baseline`, `verify-experiments`.
- Test suite: **270 tests, 267 pass, 3 fail.** All three failures are
  pre-existing and known-decided receipt staleness, not caused by this work:
  - `candidate-levels-52.json has a receipt that verifies against the current bot`
  - `candidate-levels-54.json has a receipt that verifies against the current bot`
  - `candidate-levels.json has a receipt that verifies against the current bot`

## Version hashes (sha256, first 16)

Every file whose behavior this result depends on. The four the tool freezes by
default were not enough — the evaluator, the worker, and the challenger itself
carry the measurement and none of them were covered, which is precisely how a
champion arm pointed at the wrong function survived. All seven are frozen
here and the guard re-checks them at run time.

| File | Hash | Role |
| --- | --- | --- |
| `solver/bot.js` | `8d0dec5f6b0669ca` | champion arm via `chooseBaseMove` |
| `solver/target-aware-challenger.js` | `6b375b159c836b1e` | challenger arm |
| `solver/engine.js` | `4e2323b9218aed6a` | game mechanics |
| `src/game.js` | `541baa1c05cb0dc4` | level definitions |
| `solver/target-aware-evaluation.js` | `07bc3a167f99a906` | the instrument |
| `solver/target-aware-worker.js` | `ed25df87210c7be6` | parallel execution |
| `solver/policy-eval.js` | `ab76eeb937b61b85` | frozen by default |

Any of these changing before the run invalidates this record. It does not get
edited; it gets superseded by a new one.

Recorded for disclosure — four of the five source hashes in `RESULT-0018`'s
artifact have moved, and the protocol says why rather than hiding it:

| Source | Then | Now | What moved |
| --- | --- | --- | --- |
| champion | `9abe8ca8…` | `8d0dec5f…` | `DECISION-0004` promoted the challenger into the bot. The original is recoverable at `52f500c` and C1 tests fidelity against it. |
| challenger | `ba75b5a6…` | `6b375b15…` | Never existed at that path in any ref. Unrecoverable; see *Why this is being asked*. |
| engine | `4e2323b9…` | `4e2323b9…` | Unchanged. |
| levels | `9493407c…` | `541baa1c…` | Level 53 was added. Levels 1–52 unchanged. |
| evaluator | `53aa4b2e…` | `07bc3a16…` | The two fixes at `ab4b9d7`, declared above. |

## Checks, classified before outcomes are assigned

### C1 — negative control (PASS / FAIL)

With the challenger's override absent, the champion arm must be the
pre-promotion bot and nothing else. `solver/bot.js` at commit `52f500c` has
sha256 `9abe8ca8…`, exactly the champion hash recorded in `RESULT-0018`'s
artifact. Its `chooseMove` and today's `chooseBaseMove` are played through the
evaluator's own `playToTerminal` over 52 levels x 10 screen seeds.

`PASS` — 520 of 520 plays identical, including move sequence, terminal score,
and stop reason. Anything less is `FAIL`: the arm is not the policy
`RESULT-0018` measured, and this becomes a new experiment rather than a
replication.

**Run before registration; result recorded in the report.**

### C2 — positive control, run BEFORE any measurement (PASS / FAIL)

The instrument must read differently with the challenger on than off. Same 52
levels x 10 screen seeds, comparing the two arms as the evaluation now wires
them.

`PASS` — a strict majority of cells differ and every one of the 52 levels
shows at least one differing cell. `FAIL` — zero differing cells, which is
what the instrument returned before `ab4b9d7` and means the holdout cannot
show anything. **On FAIL the run stops and nothing is measured.**

### C3 — suite unchanged (PASS / FAIL)

Named failures before equal named failures after. `PASS` — exactly the three
receipt failures listed under *Starting state*, by name, and no others. The
test total may rise; the ratio is not the check.

### P1 — primary empirical prediction

The holdout reproduces `RESULT-0018`'s findings. Predeclared targets, all six
recomputed from the original artifact rather than transcribed:

faster 9,354 · tied 6,186 · slower 0 · champion-win regressions 0 ·
champion losses converted 9 · levels showing a faster case 52.

- `SUPPORTED` — all six match exactly.
- `FALSIFIED` — any existing win made slower, **or** any champion-win
  regression. These two zeros are what `DECISION-0004` rests on.
- `INCONCLUSIVE` — both zeros hold but any of the other four counts differ.

An `INCONCLUSIVE` outcome is reported as such. It is not re-run, not
reconciled, and not relabelled.

### P2 — guard against a worse system that scores better

Reaching the target sooner must not be bought with something worse elsewhere.
Mean terminal score delta is reported for all 15,600 cells. `RESULT-0018`
recorded the challenger averaging **970 points lower**, because it stops
earlier with less overshoot, and stated plainly that this result would not
support a score-maximizing objective. Predeclared: a score deficit of that
order is the known accepted cost, not a new finding. A score deficit
materially larger than the original, or a new failure mode such as increased
lockouts, is reported as a `P2` breach.

### P3 — is the gain just more compute?

Relative wall-clock per arm, from the artifact's own timings.
`RESULT-0018` recorded **1.45x** (recomputed: 1.453). Predeclared: the same
order, 1.3x–1.6x. **This is not a compute-matched control** — the challenger
inspects untrimmed routes the champion never generates, so it is strictly more
work per move, and no claim here is a claim about equal-compute performance.

### P4 — magnitude of the effect

Mean all-cell move saving. `RESULT-0018` recorded **1.271** moves.

- `SUPPORTED` — 1.271 exactly.
- `INCONCLUSIVE` — differs but within 0.05.
- `FALSIFIED` — differs by more than 0.05, or is negative.

### P5 — the provenance property this whole record exists to establish

The holdout artifact must prove the plan predated the data, by a mechanism
that cannot be produced after the fact.

`PASS` — the artifact carries `registration.exploratory === false`,
`registration.protocol === "RESULT-0020"`, and a `registration.protocolCommit`
that is this protocol's own registration commit; and that commit is a strict
ancestor of the commit adding `report.md`. `FAIL` — any of those absent. A
commit SHA that did not exist yet cannot be embedded in an artifact, which is
the entire point.

## Budget and stopping rules

1. C1 and C2 pass before anything is measured. **C2 failing stops the run.**
2. Screen (13 levels x 40 seeds), written to its own artifact. It is
   diagnostic. No stopping decision is made on its outcome, and it may not be
   quoted as the result.
3. Holdout (52 levels x 300 seeds), **run once**.
4. **One confirmation run. No re-runs on different seeds.** The seed sets are
   compiled-in constants and there is no flag to change them.
5. Any of the seven frozen hashes moving before the holdout completes stops
   the run and supersedes this record rather than editing it.
6. A disagreement with `RESULT-0018` is reported, never reconciled. It
   produces, in order: a `CORRECTION-NNNN` record at its own honest
   `proof_class` with this run's artifact as evidence and the original still
   cited; `RESULT-0018`'s `status` updated and `superseded_by` populated with
   its text left as written; and a note on `DECISION-0004` that the evidence
   under it has moved. `CORRECTION-0004` is the worked example.

## Instrument bound

**Load-bearing:** the paired per-cell comparison in the holdout artifact —
win/loss, moves to target, and the six counts under P1. Its identity is the
sha256 over the canonical body, and completeness is enforced by
`validateArtifact` requiring 15,600 cells in level-major order.

**Diagnostic only:** the screen, the Level 51 seed 1 board, wall-clock
timings, and terminal score. Timings are wall-clock on a shared machine and
are a ratio between two arms in the same process, not a benchmark. None of
these may become the acceptance test after the fact.

## Adoption is a separate decision

Clearing every check here changes nothing that ships. `solver/bot.js` is not
modified by this run whatever it returns.

`DECISION-0004` is an `owner_decision`, and an `owner_decision` is not
overturned by a measurement — it is re-put to the owner. If this run
falsifies P1, the agent records the correction, leaves the code alone, leaves
the gates green, and stops with the question raised.

What this run can change is provenance, not standing: it would give
`DECISION-0004` evidence a clean checkout can regenerate. It does not upgrade
`RESULT-0018`, which stays exactly as written and stays grandfathered.
