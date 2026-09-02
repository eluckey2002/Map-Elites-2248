# Report — RESULT-0023

This report resolves every check declared in [protocol.md](protocol.md). The
complete protocol, runner, and two verifier implementations were committed at
`bb89d75` before any control or confirmation game ran. RESULT-0022 was
superseded unused because its initial commit contained only an incomplete
template; no measurement was made under it.

The protocol remains `status: registered`: the artifacts freeze its source
closure, so completion is recorded by this report rather than rewriting the
preregistration after seeing data.

## Canonical evidence

- Control artifact:
  `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/controls.json`,
  identity `70c8631efcf6f731…`, 144 cells executed twice.
- Control verification:
  `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/control-verification.json`,
  identity `1526be14754a0a94…`.
- Post-run C2 gate audit:
  `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/control-gate-audit.json`,
  identity `498811fbb7d0dd4a…`.
- Confirmation artifact:
  `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/confirmation.json`,
  identity `a4476ca1fe4006d7…`, 2,400 reportable cells.
- Primary verification:
  `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/verification.json`,
  identity `7cd45f897a02a25c…`.
- Independent recomputation:
  `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/independent-recomputation.json`,
  identity `8c94578c6558a31e…`.
- Broken-twin challenge:
  `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/replay-challenge.json`,
  identity `193a2837c5839f73…`.

## C1 — negative control — **PASS**

All 144 real `playToBudget` cells were executed twice. The two complete cell
arrays were canonically identical. This was checked before confirmation.

## C2 — positive control, before confirmation — **FAIL: false PASS**

The frozen verifier reported 48 changed pairs and released confirmation, but
its comparison included the `layout` field. That field is intentionally
different in every pair, so the check could not observe zero changes.

A post-run controlled twin copied `score`, `movesUsed`, `behaviorTotals`, and
`behavior` from every one-stone cell into its two-stone partner while retaining
the partner's identity fields. The twin had **0 of 48 changed gameplay
outcomes**. The frozen C2 check still returned **PASS** and reported 48 changed
pairs.

A direct post-run audit also found that the real artifact happened to have
genuine gameplay-outcome changes in 48 of 48 pairs. That observation does not
repair the pre-confirmation gate: confirmation was released by a check with a
demonstrated false-PASS path. C2 therefore fails.

`node tools/verify-experiments.js` and all 19 focused experiment tests still
pass. Those gates verify registration, artifact identity, source freeze, cited
paths, and report coverage; they do not inspect C2's outcome-field comparison.
Their green status is preserved as a narrower fact and is not treated as
evidence that C2 passed.

## C3 — subject and source closure — **PASS**

Both artifacts reproduce the four exact policy identities, three exact layout
identities, and nine frozen source identities. The confirmation contains
exactly 2,400 unique expected cells and no control seed. Raw behavior summaries
recompute from their totals, and both artifact identities verify.

The registration stamp names RESULT-0023 and protocol commit
`bb89d75c569d33a646fd8a900fbfbe3224110a5d`, which is a strict ancestor of
this report.

## P1 — primary empirical prediction — **INCONCLUSIVE, NOT ENTITLED**

The four paired geometric score responses to adding the second stone were:

| Policy | Identity | Two-stone vs one-stone response |
| --- | --- | ---: |
| current base | `0de51bc557de` | -19.498% |
| historical long-chain | `a61e8b8e23b7` | -22.482% |
| historical short-chain | `4cbec6509c34` | -20.936% |
| historical late-score | `ebeb9e326a01` | -20.224% |

The interaction spread was **0.0298321**, or **2.983 percentage points**. That
is above the predeclared `< 0.02` falsification band and below the `>= 0.05`
support band.

The fixed halves also reversed the extremes:

| Half | Most affected | Least affected |
| --- | --- | --- |
| seeds `21000000..21000099` | short-chain `4cbec6509c34` | current base `0de51bc557de` |
| seeds `21000100..21000199` | long-chain `a61e8b8e23b7` | short-chain `4cbec6509c34` |

The preregistered ordering-stability condition therefore failed. The run does
not support a claim that these four policies provide stable, materially
different topology responses. It also does not falsify that premise under the
declared rule. Because C2 failed, this arithmetic result is preserved as a
measured diagnostic and is not entitled to authorize a campaign decision.

## P2 — distinct-style guard — **PASS**

On the open layout, the policies spanned **1.76146 tiles** in aggregate mean
chain length and **0.0452692** in late-score share. Either result alone clears
its preregistered guard (`0.15` or `0.02`).

The inconclusive P1 result is therefore not explained by the four policies
collapsing into indistinguishable behavior on the open board. They remained
behaviorally distinct by the frozen measures, but that distinction did not
produce a stable five-point difference in response to this topology contrast.

## P3 — evaluator-count and compute diagnostic — **PARTIAL / runtime UNKNOWN**

The confirmation contains the exact matched matrix: four policies, three
layouts, 200 shared seeds, and 2,400 cells. Every cell uses the same evaluator
and 24-move budget. Only one cell terminated early: short-chain on the
two-stone layout, for an early-termination rate of `0.005`; every other
policy-layout rate was zero.

The frozen runner did not persist elapsed runtime. Therefore no reproducible
runtime figure is claimed. This is a protocol diagnostic omission, not a P1 or
P2 failure: runtime was forbidden from changing the primary verdict, and the
complete evaluator count is preserved. A later runner should record monotonic
elapsed time if runtime matters.

## Independent recomputation — **PASS**

`verify.js` and the separately implemented `recompute.js` read the raw
confirmation artifact and agreed on the final verdict, guard outcome, both
half-orderings, and load-bearing values. Floating-point differences were below
`1e-12` (`0.029832057784871246` versus `0.029832057784871302` for the
interaction spread).

## Controlled broken twins — **PARTIAL; aggregate challenge FAIL**

The same `verify.js` returned PASS on the valid artifacts. A temporary twin
incremented `cells[0].score` by one without changing its declared artifact
identity; the verifier returned FAIL on the identity mismatch. The twin was
deleted, while the challenge receipt preserves the mutation, valid identity,
verifier identity, and both verdicts.

That proves artifact-identity enforcement. It does not rescue C2. The
outcome-identical C2 twin passed the frozen control verifier, so the complete
challenge requirement fails even though the narrower identity challenge
passes.

## Campaign disposition

This run preserves a numerical `INCONCLUSIVE` observation but fails evidence
entitlement because C2 could false-PASS. It authorizes **nothing downstream**:
not a claim, descriptor choice, larger run, or scaling into MAP-Elites,
OpenEvolve, or adversarial co-evolution.

The smallest repair is a new preregistration with an outcome-only positive
control and an outcome-identical broken twin that must fail before any fresh
confirmation seeds are opened. Reusing this opened confirmation set would not
repair the ordering failure or the missing pre-run entitlement.

No game rule, level, stone behavior, policy, champion, archive, pilot,
accepted-evidence ledger, or current-navigation record changed. No conclusion
is made about human personas, fun, difficulty, shipping, mechanic correctness,
or champion promotion.
