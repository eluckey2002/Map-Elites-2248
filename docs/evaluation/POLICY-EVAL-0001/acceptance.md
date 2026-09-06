---
id: POLICY-EVAL-0001-ACCEPTANCE
contract: POLICY-EVAL-0001
status: accepted
accepted_at: 2026-09-05 America/Chicago
---

# Step 1 acceptance record

Scope: document-contract acceptance under DECISION-0006, not a policy
result, experiment preregistration, replay qualification, or promotion.
The original four-step plan remains unchanged.

## Frozen package

Freeze commit: `e415df78b77a8f32ec2d97912ccd198bfaad2d21`.

| Artifact | SHA-256 |
| --- | --- |
| [contract.md](contract.md) | `3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f` |
| [inputs.json](inputs.json) | `1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb` |
| [Independent review](review.md) | `1a7f19c93db2eb440213c1f98f757c3c0ded575e802cbb4be7569f153b9ec6d1` |

The package is the complete contract and inputs files. Review and this
acceptance are supporting records, not fields inside a self-hashing
contract. All three listed artifacts already match their committed bytes.
A later contract amendment must preserve v1 and receive its own review
and identity; editing these files in place does not retain this acceptance.

## Why these choices

- Preserve every reference win before crediting improvement; an average
  saving cannot conceal a new failure.
- Rank converted wins before speed. Measure speed on the fixed set of
  reference wins, so a changing denominator cannot manufacture a gain.
- Weight cases equally and attempts within a case fractionally, so repeated
  play on one board does not dominate the comparison.
- Keep score separate and expose both horizon and objective. Human intent
  is not inferred from an equal number of moves.
- Keep missing evidence unresolved and provenance panels separate; exact
  current-subject replay does not become historical receipt evidence.

These are explicit Step 1 engineering choices, not new empirical findings.
The contract names the improvement, sampling, freshness, uncertainty, and
compute-cost commitments that later protocols must supply before runs.

## Verification and limits

The durable completion criteria and original oracle definitions are in
[CONTRACT-001](../../../.orch/tickets/2026-09-05-policy-contract/CONTRACT-001.md).

- C1 PASS: recomputed all 12 source-file and 15 recording-file hashes;
  matched all 58 exported shipped level objects and their canonical hashes;
  matched the exact reference DEFAULT_PARAMS. Source interpretation of
  reference, RNG, and terminal semantics is covered by the contract review.
  This checks metadata and source identity, not recording admission.
- C2 PASS: fresh, read-only independent reviewer applied the fixed failure
  anchors to the entire contract and manifest; no defects found. Root
  accepted the scoped return without substituting its own judgment.
- C3 PASS: all E01-E18 received independent interpretations. Direct
  arithmetic confirms E01 +2, E03 N=1/D=-2, and E06 -1; the incorrect pooled
  E06 answer +0.5 was rejected. Terminal edge cases were checked against
  game.js/engine.js source, not new game runs.
- C4 PASS: changed paths are confined to the ticket, evaluation documents,
  and progress navigation. The pinned plan and all source/recording hashes
  match; no later-stage execution occurred.
- C5 PASS: `git show` at the freeze commit equals the live contract, inputs,
  and review bytes; review names both package hashes; local linked files
  exist; `git diff --check` passes. BL-0014 records this exact package and
  freeze commit before releasing Step 2. This is file/link verification,
  not a newly implemented or qualified experiment gate.

No games, recording replays, policy experiments, or benchmark baselines
were run for this step. No behavior-bearing source changed. The broad
repository test suite was not rerun for this document-only acceptance;
this is not a claim that its four known failures have been repaired or
that the repository-wide gate is green.

## Atlas use and successor

METHOD-003 is used concretely: the entire rules document and input
inventory are frozen in Git, with an independent review tied to those
bytes. The downstream consumer is
[BL-0014](../../backlog/BL-0014-policy-improvement-sequence.md); before Step 2
it must recheck the accepted package and relevant subject/reference inputs.
The other two shortlisted methods remain assigned to later steps. No
Atlas record was changed and no effectiveness claim follows from adoption.

Step 1 is accepted; Step 2 is ready but remains unstarted. It must cite and
recheck this predecessor before correcting measurement records and the
benchmark. Steps 3 and 4 remain blocked. Expected benchmark edits do not mutate
this historical source snapshot; behavior-bearing subject/reference changes
must be assessed under plan R2 and may invalidate predecessor evidence.
