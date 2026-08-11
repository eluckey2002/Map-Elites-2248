---
id: discovery-hooks
run: game-evidence-ledger-2026-08-11
status: complete
executor: orch-draft
pack: orch-content-pack
independence: gate
depends_on: []
write_scope:
  - .orch/runs/game-evidence-ledger-2026-08-11/workspace/discovery-hooks.md
excluded_actions:
  - modify product or solver artifacts
  - commit or publish
bound: 15 minutes
claimed_by: discovery_hooks_gpt_5_6_sol_high
claimed_at: 2026-08-11T06:27:09Z
---

## Objective

Drafts for a narrow project `AGENTS.md` and a short `HANDOFF.md` authority banner make the ledger unavoidable to future agents while preserving the August 8 handoff as a historical snapshot.

## Fixed inputs

- Spec: `.orch/runs/game-evidence-ledger-2026-08-11/spec.md`
- Evidence: `HANDOFF.md`; intended root target `EVIDENCE_LEDGER.md`.
- Outline slot: exact proposed text for `AGENTS.md` and the handoff banner; do not draft the ledger body.
- Voice contract: compact, imperative, evidence-first; no general orchestration or coding-policy additions.
- Citation policy: local relative link to `EVIDENCE_LEDGER.md`.
- Length bound: 350 words total; banner at most 90 words.

## Completion test

1. `AGENTS.md` draft requires read-first ledger use, source-pinned updates, proof-class preservation, and append-only correction.
   - Oracle: deterministic exact-term scan; oracle_class: deterministic; provenance: authored-here.
2. Handoff banner identifies the document as the August 8 historical snapshot and points to the ledger as current authority without rewriting the handoff body.
   - Oracle: deterministic text/link inspection; oracle_class: deterministic; provenance: authored-here.
3. Draft adds no unrelated project instructions.
   - Oracle: content lens against the narrow affected surface; oracle_class: judged; provenance: authored-here.

## Return fields

- Draft identity
- Verification entries
- Gaps
- Risks

## Result

- Draft identity: `.orch/runs/game-evidence-ledger-2026-08-11/workspace/discovery-hooks.md`.
- The artifact contains exact proposed text for the narrow root `AGENTS.md` instructions and the prepend-only `HANDOFF.md` authority banner.
- Gaps: none in the fixed evidence needed for this slot.

## Verification

1. PASS — Deterministic exact-term scan found the local read-first ledger link, `source-pinned updates`, `proof class exactly`, and `append-only` correction language in the proposed `AGENTS.md` text.
2. PASS — Deterministic text/link inspection found the August 8, 2026 historical-snapshot statement, preservation instruction, and relative `EVIDENCE_LEDGER.md` link. The banner is 38 words, within the 90-word bound.
3. PASS — Judged content lens found only evidence-ledger discovery, update, proof-class, correction, and historical-authority instructions. The full artifact is 178 words, within the 350-word bound.

## Feedback

[]

## Risks

- The relative link target is pending the downstream ledger assembly; this draft cannot verify final link resolution within its write scope.
