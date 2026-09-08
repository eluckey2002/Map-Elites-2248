# RESULT-0031 — complete synthetic descriptor validation

## Summary

**INCONCLUSIVE.** The joint descriptor model improved mean leave-one-level-out
Brier loss over the training base rate by `0.023317`, clearing that registered
threshold, but improved over the better single descriptor by only `0.003861`
(required `0.01`) and beat both single models on 5 of 9 held-out levels
(required 6). P2 passed, and neither registered falsification condition fired.

The fixed policy-held-out diagnostic was materially stronger: joint gain was
`0.087600` over base rate and `0.042809` over the better single descriptor,
with joint winning 8 of 9 policy folds. That diagnostic cannot replace the
primary level-held-out verdict.

The experiment supports the narrower observation that these two measurements
jointly distinguish unseen members of this frozen synthetic policy grid better
than either measurement alone on the same nine levels. It does not establish
the registered out-of-level claim, validate the motivating human anecdote, or
justify formalizing either measurement as a MAP-Elites axis.

## C1 — registration, source, artifact, and matrix closure — PASS

The public draft checker returned `DRAFT OK RESULT-0031 8 frozen files` before
registration commit `7129f014e8756b9fb8bd116d20c0fbc8a4db2f10`. That commit
strictly predates both artifacts.

The checker line is an operator-recorded execution observation, not a durable
receipt emitted by the checker. The committed hashes are independently
reconfirmed by the current experiment gate and both registered artifacts, but
those later checks cannot reconstruct the pre-commit timing of the command.

The frozen production verifier passed the 324-cell control and the 972-cell
confirmation. Both bind the exact registration commit, source identities, nine
policies, nine levels, declared seeds, and complete Cartesian matrices.

| Evidence | Artifact / analysis identity | File SHA-256 |
| --- | --- | --- |
| control | `ab7d8015302a25c6cbadbb2b456062855224534cf377d68faf3ba2585abc11ee` | `ea4acc3d1bda1508d1a70a5584c8b006e4521d67c51f49a67d20a9038ecbb069` |
| control analysis | `417cf21717752fe9fcad89ee9be84ef2512d228e96d9935c07877d98220cda9b` | `0116926cffeeb3508fa41e2dbc55f20e0bd0d43565b163efd54b9abafed39491` |
| confirmation | `b41eb7cb4f67a54ba24792dcf1d29844a57e0cca2981f7b3503c518dfb145aca` | `cf58dbee8b080286f82bd0629e0ed4bfa21b26f8462e40194d63fd56013e1389` |
| confirmation analysis A | `3e59e6074bcc316ec338d41f08063f1698ca73bcbde3a4005fe9bdc449765b39` | `175368a397d844cc40438ac48937d45ad5374c32458cc003f422f240f4d6b365` |
| confirmation analysis B | `3e59e6074bcc316ec338d41f08063f1698ca73bcbde3a4005fe9bdc449765b39` | `175368a397d844cc40438ac48937d45ad5374c32458cc003f422f240f4d6b365` |

The two independently written confirmation analyses are byte-identical.

## C2 — factorial manipulation — PASS

All three fixed-timing greed slices were strictly monotonic. Their spans were
`0.474044`, `0.493929`, and `0.476283`; minimum `0.474044` exceeds the
registered `0.15` threshold.

All three fixed-greed timing slices were strictly monotonic. Their spans were
`0.205195`, `0.099850`, and `0.087949`; minimum `0.087949` exceeds the
registered `0.05` threshold.

Exact unrounded values and all policy means are in
`evidence/controls-analysis.json` under analysis identity
`417cf21717752fe9fcad89ee9be84ef2512d228e96d9935c07877d98220cda9b`.

## P1 — joint out-of-level prediction — INCONCLUSIVE

| Model | Mean leave-one-level-out Brier loss |
| --- | ---: |
| training base rate | `0.160546` |
| half-score timing | `0.152630` |
| beam greed | `0.141091` |
| joint | `0.137229` |

- joint gain over base rate: `0.023317` — clears `0.02`
- joint gain over better single: `0.003861` — misses `0.01`
- level folds where joint beats both singles: 5 of 9 — misses 6
- falsification triggers: neither gain is zero or negative

Because P2 passes but the support conjunction is incomplete and neither
falsification trigger fires, the registered outcome is `INCONCLUSIVE`.

Per-level Brier losses:

| Level | Base | Half timing | Beam greed | Joint |
| ---: | ---: | ---: | ---: | ---: |
| 1 | `0.725652` | `0.649167` | `0.740772` | `0.796235` |
| 11 | `0.244363` | `0.281574` | `0.156019` | `0.202037` |
| 20 | `0.058047` | `0.072099` | `0.057623` | `0.020494` |
| 26 | `0.052245` | `0.051636` | `0.018951` | `0.035370` |
| 31 | `0.073694` | `0.066975` | `0.024537` | `0.012531` |
| 46 | `0.064688` | `0.058519` | `0.045556` | `0.040185` |
| 51 | `0.100063` | `0.114599` | `0.086204` | `0.062068` |
| 54 | `0.074610` | `0.051883` | `0.096389` | `0.061944` |
| 56 | `0.051549` | `0.027222` | `0.043765` | `0.004198` |

## P2 — usable outcome and descriptor support — PASS

- outcomes: 236 wins, 736 losses; win fraction `0.242798`, inside
  `[0.10, 0.90]`
- mixed-outcome levels: 7 of 9, above the required 4
- `halfScoreMove` aggregate range: `[0.056667, 0.526786]`
- `meanBeamGreedRatio` aggregate range: `[0.182664, 1.000000]`
- invalid primary folds: none for either single or joint model

Levels 1 and 54 sit at opposite outcome ceilings: all 108 Level 1 cells won
and all 108 Level 54 cells lost. The other seven levels contain both outcomes.

## P3 — fixed diagnostics — PARTIAL

The policy-held-out diagnostic used the same 81 seed-aggregated policy-level
rows and nine folds:

| Model | Mean leave-one-policy-out Brier loss |
| --- | ---: |
| training base rate | `0.145014` |
| half-score timing | `0.100223` |
| beam greed | `0.186920` |
| joint | `0.057414` |

- joint gain over base rate: `0.087600`
- joint gain over better single: `0.042809`
- policy folds where joint beats both singles: 8 of 9
- invalid folds: none

Confirmation terminal reasons were 378 `no valid moves`, 358 `out of moves`,
and 236 `target reached`. Exact per-policy means, per-level means, every
policy-fold loss, exact descriptor ranges, and source identities remain in
`evidence/confirmation-analysis-a.json` and `evidence/confirmation.json`.

Wall-clock runtime is `UNRECORDED`: the frozen artifacts carry no timing, and
no durable clock observation was captured during either command. That missing
registered diagnostic makes P3 partial but does not enter P1 or P2.

## Attempt register

- control: invoked once on levels `[1,11,20,26,31,46,51,54,56]` and seeds
  `36000000..36000003`; retained and verified
- confirmation: invoked once on the same levels and seeds
  `37000000..37000011`; retained and verified
- confirmation analysis: calculated twice to distinct new files; byte-identical
- alternate seeds or retries: none
- post-outcome code, model, threshold, or tie-break changes: none

## Gaps and flip evidence

The primary finding would flip to `SUPPORTED` only with a separately
preregistered result whose joint model clears every support threshold on its
own fresh evidence. RESULT-0031 cannot be rerun or reinterpreted to reach that
verdict. It would have been `FALSIFIED` if either registered joint gain were
zero or negative; neither was.

The evidence remains narrow:

- nine purposively selected levels are not a probability sample
- the same policy identities repeat across primary train/test folds
- the strong policy-held-out result reuses the same nine level identities and
  remains diagnostic
- the beam-relative synthetic greed measurement is not the human corpus's
  exhaustive greed ratio
- the totality fallback was frozen and regression-tested, but artifacts do not
  record how often it supplied the only candidate, so its empirical influence
  cannot be separated after the fact
- wall-clock runtime was not durably captured

## Evidence boundary

This result neither validates nor refutes the one-loss human anecdote. It does
not formalize a descriptor, choose MAP-Elites axes, change a game rule, alter a
level or policy, promote a champion, or admit a ledger claim. Those remain
separate owner decisions.
