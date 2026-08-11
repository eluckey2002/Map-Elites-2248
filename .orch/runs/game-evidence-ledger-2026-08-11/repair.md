# Repair: game evidence ledger gate findings

- **run:** `game-evidence-ledger-2026-08-11`
- **workflow:** `orch-repair`
- **accepted defect set:** the four ranked findings in `review.md`
- **write scope:** `EVIDENCE_LEDGER.md` and this repair receipt only
- **status:** implemented; affected deterministic oracles pass; ready for independent gate re-verification

## Per-defect dispositions

1. **PASS — unsupported owner-decision promotion removed.** `DECISION-0002` no longer appears. Its proposed continuation method is retained as stable `HYPOTHESIS-0002`, with `type: hypothesis`, `status: provisional`, and `proof_class: hypothesis`. The supported logical boundary remains in `RESULT-0004`, the Current snapshot, and the Resume boundary.
2. **PASS — `RESULT-0003` is reproducible.** Its evidence now names `enumerateLegalChains` and the frozen-state construction, and its `reverify` field contains the tested read-only command plus exact expected JSON. Fresh output was `{"actions":1868975,"maxScore":430,"maximizers":[{"length":28,"sum":86},{"length":27,"sum":86},{"length":28,"sum":86}]}`.
3. **PASS — decision record voice corrected.** The remaining `DECISION-0001` statement now uses third-person project voice: “The feasibility study preserves …”. No decision statement begins with `Preserve`, `Do not`, or `Continue`.
4. **PASS — skim opening and landing repaired.** The first Current snapshot sentence now states the unresolved 12,336 lower bound, non-decisive 326,390 upper bound, 13,000 reachability question, and unknown exact maximum. A final Resume boundary ends the ledger with the admissible closure evidence and non-decisive evidence classes.

## Rerun evidence

### Affected content and section oracle

A read-only Node scan checked all required ledger sections and the four repaired content surfaces. Output:

```json
{"missing":[],"sections":true,"decision0002Absent":true,"hypothesis0002Provisional":true,"decisionVoice":true,"snapshot":true,"landing":true}
```

### Schema oracle

A read-only record-block scan required `type`, `status`, `scope`, `evidence`, `proof_class`, `as_of`, `reverify`, `updated`, both supersession fields, and one statement/question field per record. Output: 15 records, 15 unique IDs, no duplicates, and no missing fields. The stable IDs now include `DECISION-0001`, `HYPOTHESIS-0001`, and `HYPOTHESIS-0002`; `DECISION-0002` is absent.

### Word-count oracle

`wc -w EVIDENCE_LEDGER.md AGENTS.md` returned 2,734 + 94 = **2,828 words**, below the 3,500-word budget.

### `RESULT-0003` command oracle

The exact command embedded in `RESULT-0003` was rerun after the repair. It completed in about nine seconds and returned:

```json
{"actions":1868975,"maxScore":430,"maximizers":[{"length":28,"sum":86},{"length":27,"sum":86},{"length":28,"sum":86}]}
```

This matches 1,868,975 physical actions, maximum 430, and three maximizers: one length 27 and two length 28, all with sum 86.

### Hash oracle

`shasum -a 256 EVIDENCE_LEDGER.md AGENTS.md HANDOFF.md` returned:

```text
79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2  EVIDENCE_LEDGER.md
e1d9fb8c9861cf24a52b8ed027275ec579718592e6bc70cb469b419e063fc2f5  AGENTS.md
a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898  HANDOFF.md
```

The ledger has a new repaired identity. The fixed `AGENTS.md` and `HANDOFF.md` identities are unchanged from review intake.

### Path oracle

A read-only extraction checked 12 unique cited `.md`, `.js`, and `.json` paths in the ledger. All 12 exist; the missing-path set was empty.

### Diff and scope oracle

`git diff --check -- EVIDENCE_LEDGER.md AGENTS.md HANDOFF.md` passed. Scoped status showed only the pre-existing delivery surfaces (`M HANDOFF.md`, `?? AGENTS.md`, `?? EVIDENCE_LEDGER.md`) before this receipt was added. The scoped `HANDOFF.md` diff remains only its previously accepted two-line authority banner; neither `AGENTS.md` nor `HANDOFF.md` was edited by this repair.

## Queued and excluded

- The review’s uncertainty about where a future correction registry should live was not addressed.
- No solver, ticket, spec, review, worklog, `AGENTS.md`, or `HANDOFF.md` content was changed.
- No unrelated cleanup or refactor was performed.
- Independent gate re-verification is not replaced by this executor-authored repair receipt.
