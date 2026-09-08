# RESULT-0030 — manipulation passed; confirmation stopped before artifact

## Summary

**STOPPED / no primary descriptor verdict.** The one 324-cell control corpus
passed its production verifier and all six preregistered manipulation slices.
The one permitted confirmation invocation then exited before writing an
artifact because the frozen bounded candidate pool became empty while the game
still had a legal move. The protocol requires that condition to stop the run.
It was not retried, repaired, or moved to different seeds.

RESULT-0030 therefore shows that the synthetic controls move both registered
measurements as designed. It does not answer whether the pair improves
out-of-level prediction, does not validate the motivating human anecdote, and
does not support formalizing either descriptor.

## C1 — registration, source, artifact, and matrix closure — FAIL

Before registration, the public draft checker returned `DRAFT OK RESULT-0030
8 frozen files`. Registration commit
`fddbf05e8263924bee0dacc33f3d8a1e8f3118d8` strictly predates all outcome
evidence.

The control artifact passed the frozen production verifier with 324 cells:

- artifact identity:
  `5a4cf84e5b321f40fe76799da3f6e6de4c061b62107dbcabdc6ba4c51772f480`
- file SHA-256:
  `8e4e456c7e104444c22713e0f22e5ef50f812037d1ef1a8b32fe74c7536ca7ae`
- analysis identity:
  `82256f24cb56ce16f11ef01415df8ec97d8731dd28b218e27428953b8346d9de`
- analysis file SHA-256:
  `6a959f6fc271a879f2226f42ede74e90d7e30f317ce3f13dac36fe8f53876589`
- registered source identities: recorded exhaustively in
  `evidence/controls.json`

The confirmation invocation exited 1 with `bounded candidate pool exhausted
before an actual game terminal`. No `confirmation.json` exists, so its source,
matrix, arithmetic, and artifact identity cannot pass closure. Some cells may
have been computed in memory before the failure; the frozen runner records only
a complete artifact, so their count is `UNKNOWN` and none are evidence.

## C2 — factorial manipulation — PASS

All three fixed-timing greed slices were strictly monotonic. Their spans were
`0.465551`, `0.500054`, and `0.479529`; the minimum `0.465551` exceeds the
registered `0.15` threshold.

All three fixed-greed timing slices were strictly monotonic. Their spans were
`0.222481`, `0.129144`, and `0.055674`; the minimum `0.055674` exceeds the
registered `0.05` threshold.

The exact unrounded values and all nine policy means are in
`evidence/controls-analysis.json` under analysis identity
`82256f24cb56ce16f11ef01415df8ec97d8731dd28b218e27428953b8346d9de`.

## P1 — joint out-of-level prediction — INCONCLUSIVE

No complete confirmation artifact exists, so none of the four Brier losses,
two gains, or nine level-fold comparisons exists. `SUPPORTED` and `FALSIFIED`
are both unavailable.

## P2 — usable outcome and descriptor support — INCONCLUSIVE

The confirmation win fraction, mixed-level count, descriptor ranges, and
invalid-fold register do not exist. The control corpus contained 77 wins and
247 losses, but it is non-reportable and cannot substitute for confirmation.

## P3 — fixed diagnostics — PARTIAL

Available control diagnostics:

- outcomes: 77 wins, 247 losses
- terminal reasons: 125 `no valid moves`, 122 `out of moves`, 77
  `target reached`
- policy means and all six manipulation slices:
  `evidence/controls-analysis.json`
- wall-clock runtime: `UNRECORDED`; the frozen artifact carries no timing and
  the protocol forbids reconstructing a durable value from an uncaptured clock

Unavailable confirmation diagnostics include per-policy and per-level means,
descriptor ranges, terminal reasons, every primary Brier loss and gain, the
level-held-out comparisons, and the policy-held-out diagnostic. The
artifact-free runner preserves neither durable timing nor the failing cell's
identity.

## Attempt register

- control: invoked once on levels `[1,11,20,26,31,46,51,54,56]` and seeds
  `34000000..34000003`; artifact retained and verified
- confirmation: invoked once on the same levels and seeds
  `35000000..35000011`; exited before artifact creation
- alternate seeds: none
- retries: none
- post-outcome code, model, threshold, or tie-break changes: none

## Gaps and flip evidence

The immediate executable gap is not more statistics. The frozen candidate
enumerator lacks total coverage of legal game moves on at least one reached
confirmation state and does not record the failing cell. A successor can answer
the descriptor question only after a regression-guarded enumerator repair, a
new code identity, a new result id, a new protocol, and fresh seeds. A complete
successor confirmation passing the same independently frozen verification and
prediction checks would replace this stopped run as evidence; nothing inside
RESULT-0030 can.

The broader scientific gaps remain unchanged: the level panel is purposive,
policy identities repeat across the primary folds, the policy-held-out result
would be diagnostic, and the beam-relative synthetic measure is not the human
corpus's exhaustive greed ratio.

## Evidence boundary

This report closes a failed execution honestly. It changes no human-game
interpretation, production descriptor, MAP-Elites axis, policy, level, ledger
record, or champion.
