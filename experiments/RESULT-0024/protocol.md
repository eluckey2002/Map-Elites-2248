---
result: RESULT-0024
status: registered
registered: 2026-09-02T06:03:26.000Z
supersedes: RESULT-0023
reportable: confirmation
version_freeze:
  experiments/RESULT-0024/run.js: 4093c657b4275ea6
  experiments/RESULT-0024/verify.js: 8466cc76849c8f11
  experiments/RESULT-0024/recompute.js: f1828f2578b32202
  experiments/RESULT-0024/control-gate.test.js: 16a428cef02d7943
  experiments/RESULT-0023/run.js: 5f20cd7a6552edf6
  solver/bot.js: 8d0dec5f6b0669ca
  solver/engine.js: 4e2323b9218aed6a
  solver/policy-eval.js: ab76eeb937b61b85
  solver/map-elites-core.js: 2ff166ac8c500969
  solver/map-elites-output/archive.json: 11e50d6b3c5a7f92
  src/game.js: 541baa1c05cb0dc4
---

# Pre-registration — entitled player-style topology retry

**Registered:** 2026-09-02, before any RESULT-0024 control or confirmation
game was played.
**Goal:**
`.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/spec.md`

RESULT-0024 repeats RESULT-0023 on fresh seeds because RESULT-0023's
pre-confirmation positive control could false-PASS an outcome-identical twin.
The failed historical record remains unchanged. This protocol, including the
corrected gate, permanent negative test, subjects, seeds, formulas, thresholds,
and source closure, is frozen before execution.

## Question

Do the same four identity-pinned policies have materially different score
responses when a second adjacent center stone is added to the same narrow 4x8
board, on a fresh 200-seed confirmation set—and is that empirical verdict
entitled by controls that demonstrably inspect gameplay outcomes?

## Why this is being asked

RESULT-0023 produced an arithmetic `INCONCLUSIVE` but no entitled result. Its
post-run audit, artifact identity `498811fbb7d0dd4a…`, proved the frozen C2
counted the always-different `layout` field and passed a twin with zero changed
gameplay outcomes. The real artifact happened to differ 48/48, but that could
not repair a release gate after confirmation was opened.

This retry changes only the entitlement seam and seeds. It does not use the
opened RESULT-0023 outcome to alter policies, layouts, measures, or thresholds.

## Shape of the run

One bounded paired-seed cross-evaluation, not a search, training run,
MAP-Elites run, OpenEvolve run, co-evolution run, policy selection, or mechanic
acceptance test.

## Subjects, layouts, and measures

The exact subject definitions are inherited by source identity from
`experiments/RESULT-0023/run.js`:

- current base — `0de51bc557de`
- historical long-chain — `a61e8b8e23b7`
- historical short-chain — `4cbec6509c34`
- historical late-score — `ebeb9e326a01`

Every policy plays the same seeds on the same three 4x8, 24-move layouts:
open, one stone at `(2,3)`, and adjacent stones at `(1,3)` and `(2,3)`. All use
`minChain: 3`, `tileScale: 32`, and no finite target. Current stone/gravity
semantics are measured, not accepted as correct.

The primary response remains the paired geometric mean score ratio
`two-center-stones / one-center-stone`, expressed as ratio minus one. Behavior
counters, one-vs-open response, early termination, and runtime are preserved as
declared below.

## Denominator and seeds

- Control only: `22000000..22000011`, 12 seeds, never reportable.
- Confirmation: `23000000..23000199`, 200 seeds, reportable once.
- Fixed halves: `23000000..23000099` and `23000100..23000199`.
- Control: 4 policies x 3 layouts x 12 seeds = 144 cells, executed twice.
- Confirmation: 4 policies x 3 layouts x 200 seeds = 2,400 cells.

Repository search before registration found neither fresh range in existing
evidence. RESULT-0023 control and confirmation seeds are forbidden from the
confirmation artifact.

## Control entitlement seam

The positive control compares exactly four gameplay-outcome fields: `score`,
`movesUsed`, `behaviorTotals`, and `behavior`. It ignores `policyId`, `layout`,
and `seed`, which identify pairs but cannot satisfy the change predicate.

Before real controls, `control-gate.test.js` must show a known gameplay change
PASS and an outcome-identical twin FAIL while independently asserting that the
twin contains zero changed outcomes. The real control command then issues a
receipt binding valid PASS, the same outcome-identical-twin FAIL, exact control
identity, source identity, and verifier identity. Confirmation requires the
control artifact and receipt; it refuses execution without them and records the
consumed identities in its artifact.

The Check Card `topology-control-outcomes-differ` in `docs/CHECK-CARDS.md`
declares its scope and blind spots. It is a blocking result-local gate, not a
new promise made by the global experiment gate.

## Checks, classified before outcomes

### C1 — negative repeat control

All 144 real control cells must repeat exactly under canonical JSON. Any change
is `FAIL` and confirmation cannot run.

### C2 — outcome-only positive control and broken twin

At least one of 48 real one-stone/two-stone gameplay-outcome pairs must differ.
Then a twin made by copying all four outcome fields from each one-stone cell to
its two-stone pair must contain zero changed outcomes and return `FAIL` from the
same check. Any other result is C2 `FAIL` and confirmation cannot run.

### C3 — subject, source, receipt, and matrix closure

Reproduce all four policy identities, three layout identities, eleven frozen
source identities, exact fresh seeds, unique cell matrix, artifact identities,
and protocol registration. The confirmation runner must consume the exact
qualified control receipt, and the confirmation artifact must record its
identity. Any mismatch is `FAIL`.

### P1 — primary empirical prediction

Let `spread` be maximum minus minimum of the four primary responses. Most
affected is the lowest response and least affected is the highest.

- `SUPPORTED` — P2 passes, `spread >= 0.05`, and the unique most-affected and
  least-affected policy identities are identical in both fixed halves.
- `FALSIFIED` — P2 passes and `spread < 0.02`.
- `INCONCLUSIVE` — every other outcome.

### P2 — distinct-style guard

On the open layout, the across-policy range of aggregate mean chain length must
be at least `0.15`, or the range of late-score share at least `0.02`. If neither
clears, P1 is `INCONCLUSIVE` because the intended style separation did not
appear in this domain.

### P3 — diagnostics and independent recomputation

Report all per-policy responses, one-vs-open responses, behavior summaries,
early-termination rates, exact evaluator count, and recorded control and
confirmation runtime. Runtime is diagnostic and cannot change P1. A separately
implemented recomputation must agree within `1e-12` on all load-bearing numbers
and exactly on the guard, half-orderings, and verdict.

### P4 — evidence entitlement

- `PASS — ENTITLED` only when C1–C3 pass, P1 and P2 resolve under their frozen
  rules, P3's independent recomputation agrees, the confirmation identity twin
  fails, the control outcome-identical twin fails, and every source and
  registration identity verifies.
- `FAIL — NOT_ENTITLED` on any missing or failed prerequisite, regardless of the
  empirical P1 value.

## Budget and stopping rules

1. Commit this complete protocol, runner, primary verifier, independent
   recomputation, permanent tests, and Check Card before any game.
2. Run the repository experiment gate and focused experiment tests; stop on a
   new failure.
3. Run all permanent RESULT-0024 tests. Stop on any failure.
4. Generate the control once and issue its qualified receipt. Stop unless the
   valid subject passes and outcome-identical twin fails.
5. Invoke confirmation exactly once with that control artifact and receipt.
6. Run primary verification, independent recomputation, and both broken twins.
7. No alternate seeds, threshold changes, policy substitutions, layout
   changes, or second confirmation.

Hard maximum: 2,400 reportable games, plus 144 control cells executed twice.
No external calls or human time.

## Instrument bound

The load-bearing values are the four paired geometric responses, interaction
spread, open-layout style guard, and fixed-half extremes. C2 proves only that
the control instrument observes some gameplay outcome change; it does not
prove strategic relevance or sufficient magnitude. Runtime, one-vs-open, early
termination, and human remarks are diagnostic and cannot become acceptance
criteria after execution.

## Adoption is a separate decision

An entitled `SUPPORTED`, `FALSIFIED`, or `INCONCLUSIVE` authorizes only its
exact bounded statement about these policies, layouts, seeds, and current
simulator. It does not select a level or descriptor, validate stones, promote a
champion, admit evidence to the ledger, or authorize MAP-Elites, OpenEvolve, or
co-evolution delivery. Those remain separate project decisions.
