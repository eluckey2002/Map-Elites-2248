---
id: ledger-protocol
run: game-evidence-ledger-2026-08-11
status: complete
executor: orch-draft
pack: orch-content-pack
independence: gate
depends_on: []
write_scope:
  - .orch/runs/game-evidence-ledger-2026-08-11/workspace/ledger-protocol.md
excluded_actions:
  - modify product or solver artifacts
  - commit or publish
bound: 25 minutes
claimed_by: ledger_protocol_gpt_5_6_sol_high
claimed_at: 2026-08-11T06:27:09Z
---

## Objective

A draft ledger protocol exists that lets a fresh agent understand authority, record types, statuses, append-only correction, navigation, and the reusable entry schema without reading prior transcripts.

## Fixed inputs

- Spec: `.orch/runs/game-evidence-ledger-2026-08-11/spec.md`
- Evidence: `HANDOFF.md`; `.orch/runs/level26-certified-score-2026-08-10/worklog.md`; content-pack craft at `/Users/eluckey/.orchflows/lib/packs/orch-content-pack/references/craft.md`
- Outline slot: ledger opening through update template; do not draft seeded project records or discovery-hook files.
- Voice contract: precise, calm, compact, evidence-first; project voice for records, imperative only for instructions.
- Citation policy: cite primary repository paths/identities; summaries are navigation only.
- Length bound: 1,250 words.

## Completion test

1. Draft contains read-first purpose, authority hierarchy, record types, proof/status vocabulary, append-only correction rule, and an entry template.
   - Oracle: deterministic section/term scan; oracle_class: deterministic; provenance: authored-here.
2. The skim layer tells a fresh agent what to read, trust, and update.
   - Oracle: content lens against the spec; oracle_class: judged; provenance: authored-here.
3. No project result is stated without evidence or outside this slot.
   - Oracle: claim trace to fixed inputs; oracle_class: evidence; provenance: authored-here.

## Return fields

- Draft identity
- Verification entries
- Gaps
- Risks

## Result

- **Draft identity:** `.orch/runs/game-evidence-ledger-2026-08-11/workspace/ledger-protocol.md`
- The 1,009-word draft covers the ledger opening through the reusable update template. It defines the read-first path, claim-versus-status authority, navigation order, record types, stable IDs, record statuses, proof classes, evidence freshness, and append-only correction.
- **Gaps:** None in this outline slot. Seeded project records and discovery-hook files remain outside this ticket by design.

## Verification

1. **PASS — deterministic section/term scan.** `wc -w` reports 1,009 words, below the 1,250-word bound. `rg` confirms headings for read-first purpose, authority/navigation, record types, status vocabulary, proof classes, append-only correction, and entry template, plus the required lower-bound, upper-bound, heuristic, `UNKNOWN`, and supersession terms.
2. **PASS — executor content lens; downstream gate pending.** The headings and first sentences tell a fresh agent what the ledger is for, which evidence to trust, how to interpret a record, and how to update it. The draft follows the precise, calm, compact, evidence-first voice contract and uses imperative voice only for instructions.
3. **PASS — fixed-input claim trace.** Protocol rules trace to the frozen spec; the only descriptions of project history trace to `HANDOFF.md` and `.orch/runs/level26-certified-score-2026-08-10/worklog.md`. Those descriptions identify the files as navigation records and do not assert a seeded game result. No outside knowledge or sibling-slot content was added.

## Feedback

[]

## Risks

- Downstream seeded records must keep ledger `status` separate from ticket/run lifecycle labels. An accepted record may describe a suspended, failed, or non-decisive experiment without adopting that label as its ledger status.
