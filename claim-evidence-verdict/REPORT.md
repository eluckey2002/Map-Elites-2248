# Focused audit report — RESULT-0020 claim

- **Scope:** the single quantitative claim named by CVE-0001
- **Mode:** focused
- **Rounds:** 2 of 2
- **Producer:** `gpt_5_6_sol_high`
- **Verifier:** `orch-check:gpt_5_6_sol_high_1`
- **Completion state:** `snapshot`

## Outcome

Producer verdict retained after independent checking: `SUPPORTED AS BOUNDED`.
The frozen holdout validates and the quantitative clauses independently
recompute exactly. This is a focused terminal snapshot, not an `accepted` or
`saturated` audit.

## Source-versus-claim result

The claim is supported for artifact identity `90c4dc6f…`: 15,600 cells, 9,354
faster both-win cells, 6,186 tied both-win cells, zero slower both-win cells,
zero champion-only wins, nine challenger-only wins, all 52 levels represented
among faster cases, and mean all-cell terminal-move saving 1.271.

## Failure-class catalogue

| Class | Count | Standing |
| --- | ---: | --- |
| `source-version-drift` | 1 | design risk: the artifact challenger hash differs from current source after a disclosed post-run fix |
| `invalid-evidence-state` | 1 | design risk: a green experiment gate must not be treated as empirical truth |

No wrong quantitative value, omitted regression, or citation mismatch was
confirmed in the bounded claim.

## Supported candidates

Eight propositions were supported: the denominator and artifact identity, five
quantitative groups, registration provenance, and the claim's bounded/observed
language. The two remaining candidates are recorded design risks, not reasons
to reject the bounded claim.

## Reopening conditions

The entry lists exact hash, recomputation, provenance, scope, source-version,
and checker-verdict triggers.

## Independent checker result

The checker confirmed `F-001` and `F-002` as design risks and found no new
failure class. Four supported candidates were challenged with unused angles:
the registered arrays were checked for exact expected membership and
uniqueness (`C-001`); the both-win partition was reconstructed rather than
inferred from the phrase “existing wins” (`C-002`); the faster-level set was
compared for exact equality with the registered 52-level set (`C-005`); and the
1.271 value was recalculated over all terminal moves and contrasted with the
different 1.275 both-win-only mean (`C-006`).

The checker added one limit that the producer's ledger did not state
explicitly: the gate cannot prove the frozen/source inventory is complete or
measurement-relevant. The artifact names five source hashes while the protocol
freezes seven files. This does not change the stored-cell claim, but it blocks
using gate PASS as evidence of whole-method correctness.
