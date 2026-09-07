---
run: 2026-09-07T23-15-28Z-synthetic-descriptor-validation-study
routing:
  pack: orch-research-pack
---

# Synthetic descriptor validation study

## Objective

Preregister and execute one bounded study that first proves the nine-policy
factorial actually moves beam-relative greed and full-budget half-score timing,
then determines whether the two realized descriptors jointly predict win rate
on held-out shipped levels better than either descriptor alone or a training
base rate.

## Question

Across a frozen, structurally varied sample of nine bomb-free shipped levels,
does the pair `(halfScoreMove, meanBeamGreedRatio)` improve leave-one-level-out
prediction of synthetic-policy win rate over both its best one-descriptor model
and the training base rate under the predeclared materiality thresholds?

## Source policy

- Primary executable evidence: the RESULT-0029 runner and verifier at code
  result `7f9caf7bdd5769ce27630b36d4bce3090c45b6a6`, the current shipped level data,
  the committed RESULT-0029 protocol, fresh control/confirmation artifacts,
  and deterministic analysis output derived from those artifacts.
- Primary historical constraint: investigation packet
  `.orch/tickets/2026-09-07-adhoc-synthetic-descriptor-validation-investigation/INV-0001.md`,
  SHA-256 `ed993bf19514b9cd904184bbd4aaab40b9ca1197dd137aac8e9b2300edb6c962`.
- Primary repository authority: `EVIDENCE_LEDGER.md`, `CURRENT.md`,
  `experiments/README.md`, `experiments/SEEDS.md`, and `docs/CHECK-CARDS.md` at
  the registration revision.
- Excluded: web sources, other repositories, the scratch descriptor outputs as
  experimental evidence, prior burned seeds, bomb-bearing levels, human-game
  outcomes as labels, and any alternate post-outcome model or threshold.

## Rigor bar

Every load-bearing claim must resolve to a registration-preceding code/protocol
identity plus a complete verified artifact. The manipulation claim requires an
exact repeated control artifact and all six conditional monotonicity checks.
The prediction claim requires one fixed leave-one-level-out analysis over all
nine held-out levels, seed aggregation before scoring, comparison with both
single-descriptor models and the base rate, a predeclared outcome-balance
guard, and deterministic replay of the analysis. Any missing cell, source
drift, policy exhaustion, non-finite value, failed control, alternate seed,
post-outcome code change, or partial run prevents a supported conclusion and
is reported explicitly as FAIL, BREACH, or INCONCLUSIVE.

## Shape of the run

One preregistered factorial manipulation check followed by one confirmation.
It is not a MAP-Elites archive, policy search, parameter tuning run, level
ranking, human-model fit, production-axis admission, or champion comparison.

## Fixed denominator

- Policies: nine fixed subjects, three greed centers `[0.35, 0.60, 0.85]`
  crossed with timing slopes `[-0.25, 0, 0.25]`.
- Levels: `[1, 11, 20, 26, 31, 46, 51, 54, 56]`.
  - grid shapes: 5x8, 5x7, 4x8, and 6x5
  - minimum chains: 2, 3, and 4
  - blockers: none, stones, and ice; bombs are excluded so bomb-response policy
    does not become an undeclared third control
- Controls: seeds `32000000..32000003`, 9 x 9 x 4 = 324 games, executed twice
  to prove deterministic repeat; never reportable as the result.
- Confirmation: seeds `33000000..33000011`, 9 x 9 x 12 = 972 games, reportable
  once.
- Total maximum: 1,620 game executions, including the repeated controls.

## Frozen analysis method

The registration commit must include a result-local calculator and permanent
literal tests before any control or confirmation game. It may read only a
RESULT-0029 artifact accepted by the production verifier.

### Manipulation diagnostics

For each policy, average each realized descriptor over every control level and
seed. For each fixed timing slope, order the three means by greed center and
compute the high-minus-low `meanBeamGreedRatio` span. For each fixed greed
center, order the three means by timing slope and compute the late-minus-early
`halfScoreMove` span.

C2 passes only when all three greed slices are strictly increasing with spans
at least `0.15`, and all three timing slices are strictly increasing with spans
at least `0.05`. Any failed slice stops the study before confirmation.

### Prediction diagnostics

Aggregate confirmation seeds first, producing one row per policy and level:
mean `halfScoreMove`, mean `meanBeamGreedRatio`, and win rate. For each held-out
level, train on the other eight levels only. Standardize each used descriptor
from that fold's training rows. Predict each held-out row with deterministic
five-nearest-neighbor regression; ties resolve by policy identity then level.
Score four models by mean Brier loss across the 81 held-out rows:

1. training-fold base rate;
2. half-score timing alone;
3. beam-relative greed alone;
4. both descriptors jointly.

Also report each level's four Brier losses and how many held-out levels have a
joint loss strictly below the better single-descriptor loss. Zero training
variance in a used descriptor makes that model invalid and P1 INCONCLUSIVE.

## Checks classified before outcomes

### C1 — deterministic repeat

The two independently written control artifacts must have identical canonical
bodies and artifact identities. Any difference is FAIL and stops confirmation.

### C2 — factorial manipulation

All six conditional slices must pass the monotonicity and minimum-span rules in
the frozen analysis method. Any failure is FAIL and stops confirmation.

### C3 — registration, source, and coverage closure

Both control artifacts and the confirmation artifact must pass the production
verifier, bind the same nine policy identities and frozen sources, use exactly
the declared levels/seeds, contain the complete Cartesian cell set, and carry
the real reachable RESULT-0029 protocol commit. Any mismatch is FAIL.

### P1 — joint out-of-level prediction

Let `jointGainBase = baseRateBrier - jointBrier` and
`jointGainSingle = min(halfBrier, greedBrier) - jointBrier`.

- `SUPPORTED` — P2 passes, `jointGainBase >= 0.02`,
  `jointGainSingle >= 0.01`, and joint Brier beats the better single model on
  at least 6 of 9 held-out levels.
- `FALSIFIED` — P2 passes and either `jointGainBase <= 0` or
  `jointGainSingle <= 0`.
- `INCONCLUSIVE` — every other complete outcome.

### P2 — usable outcome and descriptor support

PASS requires overall confirmation win fraction in `[0.10, 0.90]`, at least
four of nine levels containing both wins and losses, and every confirmation
descriptor finite and inside `[0,1]`. Otherwise P1 is INCONCLUSIVE regardless
of apparent predictive gain.

### P3 — diagnostics

Report per-policy and per-level win rates, descriptor means/ranges, terminal
reason counts, all four overall and per-level Brier losses, both gains, the
level-win count, exact artifact/source identities, and wall-clock runtime.
These diagnostics cannot change P1 after execution.

## Acceptance

1. **Registration predates data.** A complete RESULT-0029 protocol, analysis
   calculator, calculator tests, and SEEDS row are one committed registration
   revision before controls.
   - oracle: `node tools/verify-experiments.js`
   - oracle_class: deterministic
   - provenance: pre-existing gate plus authored protocol
2. **Controls are entitled.** C1-C3 run before confirmation and either stop the
   study honestly or pass with verified identities and all six manipulation
   slices.
   - oracle: RESULT-0029 verifier, exact artifact comparison, frozen calculator
   - oracle_class: deterministic
   - provenance: predecessor verifier plus authored-here calculator; gate
     re-verifies calculator tests
3. **Confirmation is singular and complete.** Exactly the declared 972 cells
   are generated once after controls pass, and no alternate confirmation seed
   or policy set is used.
   - oracle: RESULT-0029 verifier plus run-state/artifact inspection
   - oracle_class: evidence
   - provenance: registered production runner and artifact
4. **The prediction verdict is reproducible.** The calculator emits all
   predeclared metrics and a second invocation over the same verified artifact
   is byte-identical; the report applies only the frozen P1/P2 rules.
   - oracle: calculator tests and exact repeated analysis output
   - oracle_class: deterministic
   - provenance: authored-here before data; gate and final lens re-verify
5. **Every question is answered.** The report records outcomes for C1-C3 and
   P1-P3, separates direct artifact observations from inference, and carries
   contradictions and gaps without upgrading them.
   - oracle: experiment gate plus research-pack coverage/contradiction lens
   - oracle_class: evidence and judged
   - provenance: pre-existing gate plus authored-here synthesis
6. **No product or evidence promotion.** Protected surfaces stay unchanged;
   no ledger, current-status, production descriptor, policy, level, target,
   receipt, or champion edit occurs.
   - oracle: baseline-to-terminal protected-path diff
   - oracle_class: deterministic
   - provenance: Git
7. **Repository regression standing is unchanged.** The full suite contains
   the same four baseline failure identities and no new failure; passing-test
   totals may increase only by declared new tests.
   - oracle: `node --test solver/tests/*.test.js`
   - oracle_class: deterministic
   - provenance: pre-existing suite plus registered tests
8. **Research rigor passes.** The research-pack lens finds no unsupported
   claim, denominator drift, post-outcome choice, source gap, or contradiction.
   - oracle: one fresh-context orch-research-pack lens at the run gate
   - oracle_class: judged
   - provenance: authored-here; gate re-verifies

## Binding constraints

- Commit protocol, calculator, tests, and seed reservation together before any
  game. Protocol status is `registered` in that commit.
- Do not modify `run.js` or `verify.js` after registration; drift supersedes
  the protocol instead of repairing it in place.
- The calculator computes metrics only. The protocol and report own the verdict
  thresholds; no post-outcome model, `k`, feature, aggregation, threshold, or
  tie-break change is allowed.
- Call the proxy `beamGreedRatio`; never claim it is the exhaustive human greed
  ratio or that this study retroactively validates the 15 human games.
- Half-score timing always divides by the full move budget.
- Controls run twice into new paths. Confirmation runs once only after both
  control checks pass.
- A bounded-policy exhaustion error is a BREACH, retained and reported; it is
  never relabeled as a loss or silently rerun.
- Preserve all existing result records append-only. Completing this protocol
  changes only its lifecycle status and adds its report/artifacts.

## Evidence

- Predecessor code result: `7f9caf7bdd5769ce27630b36d4bce3090c45b6a6`.
- Predecessor run closeout: commit `a3d20e2`.
- Current source SHA-256 identities:
  - `experiments/RESULT-0029/run.js` — `a5810bad6f0b95f9195883ca2d008d5923b1f484ecee42b3aa8f0fb12253a26b`
  - `experiments/RESULT-0029/verify.js` — `651100d9ae2d118df4fd03ec3a129b5efb82208786772dd09a32defab2f8bfdb`
  - `solver/engine.js` — `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`
  - `solver/experiment-guard.js` — `200ad71fad9492a3f397492880ffec4313e22039dc0ea18a8633822ba358443a`
  - `src/game.js` — `22ebc237b6750fff04251c1b123cc6be749b8b75f3146d6e42576c509dc97bf2`
  - `tools/verify-experiments.js` — `17d658d9f13a40b050ee1f3ba9f0a227b80fc0d79d5a40aa2dc742e5b17369b3`
- Baseline regression evidence at code result: 371 tests / 367 pass / the
  same four named failures.

## Affected surfaces

- `experiments/RESULT-0029/protocol.md` (new, then lifecycle-only completion)
- `experiments/RESULT-0029/analyze.js` (new, frozen before data)
- `experiments/RESULT-0029/report.md` (new after data)
- `experiments/SEEDS.md`
- `solver/tests/syntheticDescriptorValidation.test.js`
- `.orch/runs/2026-09-07T23-15-28Z-synthetic-descriptor-validation-study/`
- `.orch/tickets/2026-09-07T23-15-28Z-synthetic-descriptor-validation-study/`

## Bound

- One registration/method ticket, one dependent execution/synthesis ticket,
  and the single research-pack gate.
- Maximum 1,620 game executions; one confirmation only.
- No network, external model, browser, human time, level mutation, policy
  search, or alternate analysis.
- `plan_gate: false`; this is the registered successor explicitly required by
  the already confirmed composition.

## Target repository

`/private/tmp/2248-synthetic-descriptor-validation-20260906` on branch
`work/synthetic-descriptor-validation-20260906`. It remains isolated and will
not merge, rebase, push, or write to the canonical checkout automatically.

## Standards owner by pointer

- `AGENTS.md`
- `EVIDENCE_LEDGER.md`
- `experiments/README.md`
- `experiments/TEMPLATE.md`
- `experiments/SEEDS.md`
- `docs/CHECK-CARDS.md`

## Risks

- The factor controls may not move realized descriptors enough; that is an
  informative C2 FAIL, not permission to tune after seeing it.
- Outcome balance may collapse on the chosen levels. P2 then makes P1
  INCONCLUSIVE rather than selecting replacement levels.
- Twelve seeds stabilize each policy-level win rate only modestly. The result
  is a bounded synthetic validation, not a universal player model.
- The approximate candidate pool can exhaust before the actual game does. The
  harness now aborts; any occurrence consumes the run and is reported BREACH.

## Assumptions

- The nine chosen levels remain shipped and bomb-free at registration.
- The 32,000,000 and 33,000,000 seed families remain absent from tracked and
  local experiment evidence until the registration commit.
- The current harness runtime permits the 1,620-game maximum inside one
  foreground research session; any resource overrun stops without changing the
  denominator or rerunning confirmation.
