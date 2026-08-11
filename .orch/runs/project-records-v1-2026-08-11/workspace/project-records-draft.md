# Project records draft

This workspace contains proposed content for five targets. Each block names its assembly target; nothing here changes that target.

## Target: `CURRENT.md`

````markdown
# Current work

This page is a bounded navigation record, not evidence. Read the [evidence ledger](EVIDENCE_LEDGER.md) for current proof standing and source-linked claims.

## Active milestone

Resolve whether the frozen Level 26 seed-0 run can reach 13,000 within 32 moves. The accepted boundary remains a replayed lower bound of 12,336 and a non-decisive proven upper bound of 326,390; reachability and the exact maximum are unresolved. See the ledger's [current snapshot](EVIDENCE_LEDGER.md#current-snapshot) and [open questions](EVIDENCE_LEDGER.md#open-question-registry).

The milestone exits only with accepted evidence of at least one of these outcomes:

- a replayed 13,000 witness;
- an exact result; or
- a proven upper bound below 13,000.

Timeouts, heuristic misses, terminal boards, and `UNKNOWN` do not close it. See the ledger's [resume boundary](EVIDENCE_LEDGER.md#resume-boundary).

## NEXT

[BL-0001 — Test compact state signature](docs/backlog/BL-0001-test-compact-state-signature.md) is ready. It evaluates the ledger's provisional compact-state hypothesis against exact small-horizon positions without treating the hypothesis as fact.

## Later

[BL-0002 — Evaluate decisive proof formulation](docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md) remains proposed and depends on BL-0001. It compares possible exact continuations without selecting one in advance.

## Blockers and decisions needed

- No decisive certificate currently resolves 13,000 reachability or the exact maximum.
- Any formulation to pursue after BL-0001 requires an explicit owner decision; this page does not make it.

Last reviewed: 2026-08-11
````

## Target: `docs/backlog/README.md`

````markdown
# Backlog records

This directory stores durable project intent promoted from chat. It is navigation and planning, not evidence. Current proof standing belongs in the [evidence ledger](../../EVIDENCE_LEDGER.md); backlog records link to it rather than restating or strengthening its claims.

## Record unit and stable paths

One Markdown file is the default unit for one backlog record. Give each record a stable `BL-NNNN` ID and descriptive filename, then keep that path stable. Change `status` in metadata; do not move the file between status directories.

Use a directory only when one record owns an artifact bundle, such as several fixtures, images, or receipts that must travel together. Keep the record's Markdown file as the entry point to that bundle.

## Status vocabulary

Every record uses exactly one of these six statuses:

- `proposed` — captured for review but not yet accepted into the ready queue.
- `ready` — accepted intent with enough definition to begin.
- `active` — currently being worked.
- `blocked` — unable to proceed until its named dependency or decision clears.
- `done` — its acceptance criteria have been met and recorded.
- `dropped` — intentionally closed without completion; the reason remains in history.

A status describes planning state only. It never changes a claim's type, proof class, or standing in the evidence ledger.

## Minimal record schema

Each file contains:

```yaml
---
id: BL-NNNN
title: <short outcome-oriented title>
status: proposed | ready | active | blocked | done | dropped
milestone: <stable milestone name>
depends_on: []
updated: YYYY-MM-DD
---
```

After metadata, include these sections:

- `Authority` — state that the record is intent, not evidence, and link the ledger.
- `Desired outcome` — describe the observable change the record seeks.
- `Acceptance criteria` — list what must be demonstrated before `done`.
- `Current evidence` — link to relevant ledger records or primary repository evidence without upgrading their standing.
- `Next action` — name the smallest authorized step.
- `History` — append dated changes; never rewrite prior entries to hide a changed plan.

## From chat to a durable record

Chat is the management interface and may contain requests, options, or tentative recommendations. Promote work to a backlog file when the owner explicitly accepts it for durable tracking or asks to preserve it. Capture the accepted intent, links, dependencies, and date; do not treat conversational agreement as empirical evidence. Later chat updates the same stable record through metadata and append-only history.

Start with the [current-work page](../../CURRENT.md), which identifies the sole ready item and links the active milestone records.
````

## Target: `docs/backlog/BL-0001-test-compact-state-signature.md`

````markdown
---
id: BL-0001
title: Test compact state signature
status: ready
milestone: frozen-level26-seed0-reachability
depends_on: []
updated: 2026-08-11
---

# BL-0001 — Test compact state signature

## Authority

This record captures accepted planning intent, not evidence. The [evidence ledger](../../EVIDENCE_LEDGER.md) remains authoritative for proof standing; any result must be verified and admitted there separately.

## Desired outcome

Determine whether a proposed state signature can preserve the distinctions needed for useful exact small-horizon reasoning. The candidate features come from provisional `HYPOTHESIS-0001`: score, moves remaining, spawn cursor, value histogram, and compact connectivity or survivor-position information. The hypothesis remains provisional while this test is pending.

## Acceptance criteria

- Freeze a small-horizon position set and define the candidate signature before evaluating it.
- Compare positions sharing a signature against exact legal continuations and achievable outcomes.
- Record any collision that loses a decision-relevant geometric distinction, plus the smallest reproducible counterexample.
- Conclude only what the bounded comparison supports: retained for further evaluation, rejected by counterexample, or inconclusive.
- Preserve the frozen Level 26 rules and proof classes; do not present this diagnostic as a 32-move witness, exact maximum, or upper bound.

## Current evidence

The ledger's [hypothesis registry](../../EVIDENCE_LEDGER.md#hypothesis-registry) records `HYPOTHESIS-0001` as provisional and says no compact-signature test has been recorded. Histogram plus cursor alone is described only as a relaxation; geometry is required for exactness.

## Next action

Specify the frozen small-horizon fixtures, candidate signature, comparison oracle, and failure example format before running the evaluation.

## History

- 2026-08-11 — Created as the sole ready item for the active milestone from provisional `HYPOTHESIS-0001`; no experiment has started.
````

## Target: `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md`

````markdown
---
id: BL-0002
title: Evaluate decisive proof formulation
status: proposed
milestone: frozen-level26-seed0-reachability
depends_on:
  - BL-0001
updated: 2026-08-11
---

# BL-0002 — Evaluate decisive proof formulation

## Authority

This record is proposed planning intent, not evidence or an adopted method. The [evidence ledger](../../EVIDENCE_LEDGER.md) remains authoritative for proof standing, and [BL-0001](BL-0001-test-compact-state-signature.md) is a dependency, not empirical support.

## Desired outcome

Produce a decision-ready comparison of exact continuation formulations for the frozen Level 26 seed-0 horizon after BL-0001 reports what its compact signature preserves or loses. No formulation is selected by this record.

## Acceptance criteria

- Carry forward the frozen input, 32-move horizon, shipped rules, and current accepted numerical boundary without alteration.
- Compare candidate formulations on completeness, state identity, memory behavior, reproducibility, and independently checkable output.
- Include the ledger's provisional possibilities—a streaming or partitioned physical frontier, a materially tighter complete tail abstraction, or another exact formulation—without assuming any is viable.
- State which outcomes would be decisive: a replayed 13,000 witness, an exact result, or a proven upper bound below 13,000. Keep timeouts and `UNKNOWN` non-decisive.
- Return any recommendation as a proposal for owner acceptance, with gaps and tradeoffs visible.

## Current evidence

The ledger's [current snapshot](../../EVIDENCE_LEDGER.md#current-snapshot) records a 12,336 replayed lower bound, a non-decisive 326,390 proven upper bound, and unresolved 13,000 reachability. Its [hypothesis registry](../../EVIDENCE_LEDGER.md#hypothesis-registry) records `HYPOTHESIS-0002` as provisional; no decisive continuation result is recorded.

## Next action

Wait for BL-0001. Then use its bounded findings to define comparison candidates and evaluation criteria without starting a solver run or adopting a formulation.

## History

- 2026-08-11 — Captured as proposed dependent work from `HYPOTHESIS-0002`; no formulation has been accepted.
````

## Target: `AGENTS.md`

````markdown
# Project evidence instructions

Read [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md) before substantive reasoning about game rules, solver results, score feasibility, or experiment status. Use the ledger for current project status and follow its citations to primary repository evidence for factual support.

After the ledger, read [CURRENT.md](CURRENT.md) for the active milestone and its linked backlog records. Treat chat as management intake, backlog files as durable intent, and only the ledger at its recorded standing plus cited primary artifacts as evidence. Conversation and backlog status never change proof standing.

Append source-pinned updates using the ledger's record schema. Preserve each proof class exactly: a replayed lower bound, exact result, proven upper bound, heuristic observation, `UNKNOWN`, or unresolved question must not be promoted into another class.

Make every correction append-only. Add a correction or supersession record, update the affected record's status, and retain the prior claim and receipt.
````
