# 2248 Challenge Evidence Ledger

## Read this first

Use this ledger to find the project's current accepted facts, experimental results, decisions, hypotheses, and open questions. Read the current snapshot first, then follow the cited evidence for any claim that affects game rules, solver behavior, or a proof conclusion. Update the relevant registry after new evidence is verified.

The ledger is the authority for a record's current standing. It is not the authority for the underlying claim. Source code, tests, frozen machine-readable receipts, replay verifiers, and immutable run records remain the evidence. Summary documents, including `HANDOFF.md`, provide navigation and historical context only. An uncited claim or unaccepted artifact is a lead, not project knowledge.

## Authority and navigation

Apply this order when sources disagree:

1. Inspect the primary repository evidence named by the record. Prefer a path plus symbol, frozen identity or hash, and a reproducible verification command.
2. Use the record's `status`, `proof_class`, `scope`, and `as_of` fields to determine what the evidence establishes now.
3. Follow correction and supersession links before relying on an older record.
4. Use snapshots and handoffs to locate evidence, never to overrule it.

The ledger preserves distinctions that matter to this project. The integrated proof history in `.orch/runs/level26-certified-score-2026-08-10/worklog.md` separates accepted, suspended, failed, lower-bound, upper-bound, and non-decisive outcomes. `HANDOFF.md` demonstrates explicit correction of a prior feasibility inference. Both are navigation records; cite their underlying artifacts when a factual claim depends on them.

## Record types

Keep each entry in exactly one registry.

| Type | Registry job |
| --- | --- |
| `fact` | Record a verified rule, configuration, identity, or reproducible state. |
| `result` | Record an experiment or proof outcome at its exact scope and proof class. |
| `decision` | Record an owner or project choice, its rationale, and its effective scope. |
| `hypothesis` | Record a testable explanation or prediction. It remains non-factual even when well motivated. |
| `question` | Record an unresolved question and the evidence boundary that keeps it open. |
| `correction` | Replace or narrow an earlier entry without erasing it. |

Assign a stable ID when an entry is created: `FACT-NNNN`, `RESULT-NNNN`, `DECISION-NNNN`, `HYPOTHESIS-NNNN`, `QUESTION-NNNN`, or `CORRECTION-NNNN`. Never renumber, recycle, or silently repurpose an ID.

## Status vocabulary

`status` describes the standing of the record, not the strength of its proof.

| Status | Meaning |
| --- | --- |
| `accepted` | Admitted to its named registry at the stated type, scope, and proof class. |
| `provisional` | Retained as an unaccepted lead pending verification or review. |
| `open` | An unresolved question with no decisive answer recorded. |
| `superseded` | Replaced or narrowed by a linked correction or newer record. |
| `stale` | Time-sensitive and no longer current without re-verification. |
| `rejected` | Considered but not admitted or no longer adopted; retain the reason and evidence. |

Acceptance never changes a record's type. An accepted hypothesis is still a hypothesis. An accepted bounded run that returned `UNKNOWN` is still non-decisive.

## Verification and proof classes

Use the narrowest class the evidence supports:

| `proof_class` | What it establishes |
| --- | --- |
| `direct_source` | A rule, configuration, identity, or state is present in cited primary evidence. |
| `exact_result` | The stated value is exact within the recorded scope. |
| `replayed_lower_bound` | A cited witness replays to the stated value; no higher-score claim follows. |
| `proven_upper_bound` | A cited admissible proof caps the stated scope; it is not a witness or prediction. |
| `heuristic_observation` | A named policy, sample, or incomplete search produced the observation; no policy-independent bound follows. |
| `UNKNOWN` | A bounded decision attempt returned no answer; it excludes nothing. |
| `unresolved` | Available evidence does not decide the question. |
| `owner_decision` | The entry records an explicit project choice rather than an empirical proof. |
| `hypothesis` | The statement is proposed for testing and is not factual evidence. |

Record decisiveness separately in the statement or scope. A valid upper bound above a target can be accepted and still non-decisive. A failed or timed-out search cannot become an upper bound. A heuristic miss cannot establish impossibility.

## Evidence and freshness rules

Every accepted `fact` or `result` must cite primary repository evidence. Give enough identity to survive line drift: path and symbol, receipt path and SHA-256, immutable ticket or run identity, or a reproducible command with the expected observation. A summary path alone is insufficient.

Set `as_of` and `reverify` for checkout-sensitive or time-sensitive claims. If re-verification fails or is not performed after the stated boundary, mark the entry `stale`; do not rewrite its historical statement. Keep invalid, incomplete, diagnostic, and `UNKNOWN` evidence distinct from accepted proof results.

## Append-only correction

Preserve the history of what the project believed and why. To correct an entry:

1. Add a new `correction` record with its own ID, date, scope, evidence, and replacement statement.
2. Set `supersedes` on the correction and `superseded_by` on the earlier entry.
3. Change the earlier entry's status to `superseded`; retain its original statement, evidence, and dates.
4. Update the current snapshot and any affected registry links.

Never delete a receipt, erase a challenged claim, or edit an old statement so that the history appears to have always been correct. If the replacement lacks support, record the gap as an open question and leave the earlier entry's standing unchanged.

## Entry template

```yaml
- id: TYPE-NNNN
  type: fact | result | decision | hypothesis | question | correction
  status: accepted | provisional | open | superseded | stale | rejected
  scope: <level, seed, ruleset, horizon, policy, checkout, or decision scope>
  statement: <one claim or question>
  evidence:
    - <primary path plus symbol, frozen identity/hash, or reproducible command>
  proof_class: direct_source | exact_result | replayed_lower_bound | proven_upper_bound | heuristic_observation | UNKNOWN | unresolved | owner_decision | hypothesis
  as_of: YYYY-MM-DD | not_time_sensitive
  reverify: <command and expected observation, or not_applicable>
  updated: YYYY-MM-DD
  supersedes: []
  superseded_by: []
  notes: <optional implication, rationale, or explicit evidence gap>
```
