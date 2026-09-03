# Report — RESULT-0026

RESULT-0026 tested one frozen port of the handmade lattice policy against the
current reference bot. The protocol and all evidence-producing code were
committed at `3d02387` before qualification or confirmation. The qualification
and Challenge Receipt were then committed at `ce0bece` before any reserved
confirmation seed was played. The sole confirmation artifact was committed
unchanged at `d59e783` before verdict admission.

The evidence is **ADMISSIBLE** and the preregistered empirical verdict is
**FALSIFIED**. The handmade policy saved 0.68 moves per paired game on average,
but it converted six reference wins into losses under the shipped move budget.
That fails the predeclared win non-regression condition, regardless of the
positive mean.

## Canonical evidence

- Qualification: `experiments/RESULT-0026/qualification.json`, identity
  `3a30456161b7f1cbbe9005b86a98fc4e50bd5007acaa2e0a873e794c3a4190c5`.
- Challenge Receipt: `experiments/RESULT-0026/challenge-receipt.json`, identity
  `56b8b29e8acca8c98fd45acd1001a87e20b041405e8b1c630fd371d2498f3ed2`.
- Raw confirmation: `experiments/RESULT-0026/confirmation.json`, identity
  `4a5ce7674faabab4a3b39ee47efb86d8adee93cf73c7cd2c65b8440b58b7d90b`.
- Independent recomputation: `experiments/RESULT-0026/recomputation.json`,
  identity `8f9916dcd88e27d4220dc3964da19eb7617bc74a2113aae527cf31139b06760e`.
- Downstream admission: `experiments/RESULT-0026/admission.json`, identity
  `95604ad0bcf98dcecc33692c89b36e6444faa368b817a09587fa5b6ae50fbc7f`.
- Reusable gate documentation and permanent negative tests:
  `docs/CHECK-CARDS.md`, `policy-comparison-admission`; and
  `experiments/RESULT-0026/policy-comparison-gate.test.js`.

## C1 — real qualification replay — **PASS**

The gate independently repeated every policy decision and engine transition
for the four burned-seed qualification cells. It reproduced the pinned
outcomes: reference Level 5 `2400/7`, reference Level 50 `76704/20`, handmade
Level 5 `2688/7`, and handmade Level 50 `76320/19`. Every game remained within
the shipped move budget.

## C2 — same-verifier challenge and invalidation — **PASS**

The Challenge Receipt records PASS on qualification artifact `3a304561...`.
The same verifier rejected a twin with one score changed and the artifact
identity recomputed. It also rejected a twin with the frozen handmade-policy
source identity replaced and the artifact identity recomputed. The exact
errors were `policy outcome mismatch for reference/5/7000000` and
`source identity closure mismatch`.

## C3 — downstream receipt consumption — **PASS**

Before confirmation, the runner refused both an invocation without the
qualification/receipt pair and an exploratory confirmation invocation. The
successful confirmation records receipt identity `56b8b29e...`.

The final admission consumer freshly regenerated the challenge from the real
qualification artifact, matched the supplied receipt in full, checked the
confirmation's recorded consumption, replayed all confirmation cells, ran the
frozen independent recomputation, and only then wrote `ADMISSIBLE`.

## C4 — matrix, provenance, and source closure — **PASS**

The raw artifact contains exactly 450 unique cells: two identified policies,
nine fixed levels, and 25 fixed fresh seeds, forming 225 complete pairs. Its
registration is non-exploratory and names protocol commit `3d02387`, which is
an ancestor of the raw-result commit. All frozen runtime source identities
match that registered commit and the admission checkout.

An independent adversarial review recomputed the artifact identity, checked
the registration ancestry and all eleven source hashes, and found no missing,
duplicate, foreign, move-budget, trace-length, target-flag, or
moves-to-target inconsistency.

## P1 — primary moves-to-target prediction — **FALSIFIED**

Across the 225 paired games, the handmade policy's mean saving was **0.68
moves/game**. The two-way level/seed cluster-intersection standard error was
**0.4881769708**, giving **t = 1.392937481** with nine level clusters.

The level means were:

| Level | Reference minus handmade effective moves |
| ---: | ---: |
| 5 | 0.60 |
| 11 | 1.96 |
| 17 | 2.04 |
| 23 | 0.12 |
| 29 | 2.88 |
| 35 | -0.64 |
| 41 | 1.44 |
| 47 | -1.36 |
| 50 | -0.92 |

The positive mean does not satisfy `SUPPORTED`: its t statistic is below 2,
and P2 fails independently.

## P2 — win non-regression — **FAIL**

The reference bot won 222 of 225 games; the handmade policy won 216. Six
paired cells were reference wins and handmade losses:

- Level 47: seeds `24000000`, `24000008`, and `24000011`.
- Level 50: seeds `24000010`, `24000019`, and `24000023`.

In every regression the reference reached the target and the handmade policy
exhausted the shipped move budget without reaching it. The protocol declares
one such regression sufficient to falsify the combined
faster-without-win-regression hypothesis.

## P3 — runtime and search-bound diagnostic — **PASS**

The 450-game confirmation took 178,029.86 ms wall-clock. Recorded chooser time
was 154,994.62 ms for handmade and 22,925.76 ms for reference, averaging
688.86 ms and 101.89 ms per game respectively. This was not a compute-matched
comparison and runtime cannot affect P1 or P2. The policy's source-pinned
150,000-node limit has no per-move cap-hit telemetry, so no search-completeness
claim follows.

## P4 — independent arithmetic — **PASS**

The separately scoped recomputation produced receipt `8f9916dc...`. A read-only
adversarial reviewer independently regenerated it to `/private/tmp`; the files
were byte-identical and had the same SHA-256. An additional raw-cell
calculation exactly recovered the mean, all standard-error components, t
statistic, win totals, and six regressions.

## P5 — evidence entitlement — **PASS — ADMISSIBLE**

Admission artifact `95604ad0...` binds the qualification, Challenge Receipt,
raw confirmation, independent recomputation, full replay verdict, and
empirical verdict. A ledger record may therefore cite this run at its exact
bounded standing.

## Campaign disposition

Do **not** promote this frozen handmade policy on RESULT-0026. The earlier
sandbox `+0.72` result remains a useful discovery lead, and the fresh result's
`+0.68` mean shows the move-saving effect did not disappear, but the stronger
claim that it improves speed without losing reference wins is falsified on the
registered panel.

This result does not evaluate the separately integrated targeted-chain
generator, tune a replacement policy, or establish that exact-sum planning is
unhelpful. Any repaired policy is a new subject and requires new registered
evidence. No production chooser, game rule, level, candidate, or archive was
changed by this result.
