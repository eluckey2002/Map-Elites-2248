---
id: BL-0008
title: Reconcile the two different definitions of "moves saved" across result families
status: proposed
milestone: measurement-definitions
depends_on: []
updated: 2026-09-05
---

# BL-0008 — Reconcile the two different definitions of "moves saved"

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## Desired outcome

Every result that reports a "moves saved" or "effective moves" figure states,
next to the number, exactly what happens to a losing game in that count — and
ideally the two definitions below converge on one, or a documented reason they
must differ.

## What was found

Two different, independently-verified definitions of a losing game's
"moves":

- `solver/target-aware-evaluation.js`'s `playToTerminal` (used by the
  RESULT-0018/RESULT-0020 "1.271 moves saved" line) returns `movesToTarget:
  null` for any non-win, and the raw `moves` field is just whatever
  `state.moves` happened to be when the loop exited (no loss penalty
  applied to it).
- `experiments/RESULT-0026/protocol.md`, P1, explicitly defines "effective
  moves" as `moveBudget + 1` for a loss, specifically so a loss can be
  compared on the same scale as a win instead of being excluded or read as
  merely "ran out of moves."

## What is NOT established

Whether this actually distorts the reported RESULT-0020 number. RESULT-0020's
own protocol states its load-bearing data is "win/loss, moves to target" and
`movesToTarget` is `null` on a loss, which suggests the 1.271 figure may
already restrict to a comparable (e.g. both-win) subset rather than mixing in
unpenalized losses — but the actual aggregation lives in the run artifact
under `.orch/runs/result-0020-target-aware-replication-2026-09-01/`, which
was not traced line by line here. Confidence this is a live distortion: no
higher than 60%. What is established at high confidence is only that the two
*definitions* differ and neither result's write-up says so.

## Acceptance criteria

- The `.orch/runs/result-0020-target-aware-replication-2026-09-01/` artifact
  script that computes the 1.271 figure is read and its loss-handling rule is
  stated explicitly (excluded / null-padded / some other convention).
- If RESULT-0018/0020 and RESULT-0026 turn out to measure genuinely different
  quantities under the same name, each result's report gets a one-line note
  saying so, so a future comparison between them doesn't assume they're the
  same number.

## Current evidence

- `solver/target-aware-evaluation.js:60-78`
- `experiments/RESULT-0026/protocol.md`, section P1
- `experiments/RESULT-0020/protocol.md:230-236,268-273`, `report.md:125-141`

## Next action

None authorized yet. Next step is tracing the RESULT-0020 artifact's
aggregation code before deciding whether this is a real inconsistency or
already handled correctly.

## History

- 2026-09-05 — captured from an independent fresh-eyes review of the repo's
  experiments and findings, requested by the owner as a follow-up pass after
  the review's higher-priority items were fixed.
