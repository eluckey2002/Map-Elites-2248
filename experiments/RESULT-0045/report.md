# RESULT-0045 — invalid confirmation run

## Outcome

`INVALID`; no primary domain outcome is assigned.

The single preregistered confirmation attempt produced a complete archive, but
the frozen independent verifier rejected it. The producer correctly emitted an
`exact_result` row for an exhausted one-move search with zero 2048 outcomes.
The verifier still asserted the older rule that every zero-route row must be
`UNKNOWN`. This is a harness contradiction, not evidence that an archived route,
cell, rank, or board is invalid. The protocol forbids repairing or retrying the
frozen run after outcomes are visible, so this identity closes invalid.

The repository ledger gate also exposed a second frozen convention mismatch:
the producer included the registration stamp in `artifactIdentity`, while the
repository-wide experiment gate deliberately removes registration before
recomputing that identity. The experiment verifier reproduced the producer's
convention, so its qualification did not test the repository gate's convention.

## Run identity and retained evidence

- Registration commit: `b0eaf9c6905cee6f666a052dfbacbd340db23bff`
- Final subject identity: `5fa64f1c1334bd82dd51f682960f535e968f258d1c6d8fa1d6055915b5c7a12f`
- Artifact identity: `aa7d441e7e6aab6c87e8db1d96ee5b48b3d7cde61150b9b4c36fd860a944e2f8`
- Attempt: `node experiments/RESULT-0045/run.js --protocol RESULT-0045`
- Attempt exit code: `1`, after producer completion and during independent verification

The immutable raw artifact reports 36 screened shapes, 16 evaluated boards, 15
eligible boards, seven occupied cells, five occupied breadth bins, and three
occupied harvesting bins. One board was excluded because its authoring holdout
had two lockouts. These counts are retained as partial evidence only; an invalid
run is not entitled to the preregistered domain inference.

## Control reconciliation

- **C1 — PASS.** The preregistered breadth controls separated exact zero, one,
  multiple, convergent, capped, and illegal-route cases through the public seam.
- **C2 — PASS.** Production harvesting controls returned +0.173913 for the
  harvest-positive board, -0.074074 for the immediate-positive bomb board, and
  exactly zero for the assignment-null control.
- **C3 — PASS.** The artifact contains one immediate and one harvest row for
  every eligible candidate/seed pair under the frozen shared inputs and caps.
- **C4 — FAIL.** Qualification mutations were 7/7, but the clean confirmation
  artifact was unexpectedly rejected because the verifier's zero-route
  standing assertion contradicted the frozen producer semantics.
- **C5 — PASS.** The repository baseline was 461 tests: 456 pass, the four
  documented deliberate failures remain, and one is skipped.
- **C6 — PASS.** All 31 frozen identities matched; the registration gate found
  the protocol; the exact-path disposable closeout rehearsal passed and was
  removed before confirmation.

## Prediction reconciliation

- **P1 — UNVERIFIED.** Partial artifact count: five breadth bins, above the
  threshold of two; the invalid run cannot support the domain claim.
- **P2 — UNVERIFIED.** Partial artifact count: three harvesting bins, above the
  threshold of two; the invalid run cannot support the domain claim.
- **P3 — UNVERIFIED.** Partial artifact count: seven occupied cells, above the
  threshold of four; the invalid run cannot support the domain claim.
- **P4 — UNVERIFIED.** The independent verifier did not complete, so the frozen
  rule assigns no archive-integrity outcome.
- **P5 — UNVERIFIED.** No primary domain outcome is available from an invalid
  run.

## Deviation and next action

The first deviation is the frozen verifier contradiction at `verifyBreadth`: a
complete, empty row is `exact_result` in the producer but was required to be
`UNKNOWN` by the verifier. The second is the artifact identity convention:
producer and experiment verifier include `registration`, while the repository
experiment gate excludes it. The artifact and failed attempt are preserved
unchanged. A successor run requires regression guards for both seams, a repaired
producer/verifier pair, a new subject identity, a new protocol identity, and
fresh generator and gameplay seeds.
