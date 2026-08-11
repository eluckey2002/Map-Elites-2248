---
id: assemble-project-records
run: project-records-v1-2026-08-11
status: complete
executor: orch-edit
pack: orch-content-pack
independence: gate
depends_on:
  - draft-project-records
write_scope:
  - CURRENT.md
  - docs/backlog/README.md
  - docs/backlog/BL-0001-test-compact-state-signature.md
  - docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md
  - AGENTS.md
excluded_actions:
  - edit EVIDENCE_LEDGER.md, HANDOFF.md, the frozen spec, the worklog, or any other ticket; this ticket may update only Result, Verification, Feedback, Risks, and optional Handoff
  - edit the completed draft identity
  - edit src/, solver/, or unrelated docs/ artifacts
  - commit or publish
bound: one terminal assembly and edit pass within every per-surface cap and the 2,500-word total budget
claimed_by: /root/orch_worker_gpt_5_6_sol_high_1
claimed_at: 2026-08-11T03:51:44-05:00
---

## Objective

The completed draft is materialized and edited into the five target project records as one coherent, compact document tree whose navigation and intent cannot be mistaken for accepted evidence.

## Fixed inputs

- Frozen spec: `.orch/runs/project-records-v1-2026-08-11/spec.md`.
- Binding constraints, verbatim:
  - Preserve `EVIDENCE_LEDGER.md` at intake SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`.
  - Preserve `HANDOFF.md` at intake SHA-256 `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
  - Preserve all pre-existing dirty work and do not edit `src/`, `solver/`, existing `.orch` runs/tickets, or unrelated `docs/` artifacts.
  - Use stable backlog paths; status changes happen in record metadata, not by moving files among status directories.
  - `CURRENT.md` may sequence work but may not create or strengthen evidence claims.
  - Do not silently accept a hypothesis, choose a proof method, or start game/solver work.
  - Make all project-file edits with `apply_patch`.
- Required completed section item: `draft-project-records`.
- Draft identity: `.orch/runs/project-records-v1-2026-08-11/workspace/project-records-draft.md` as filed by the completed dependency.
- Assembly order: root `CURRENT.md`; `docs/backlog/README.md`; `docs/backlog/BL-0001-test-compact-state-signature.md`; `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md`; `AGENTS.md` amendment.
- Fixed evidence and exemplars: the identities listed in the frozen spec and `draft-project-records`; the edit may introduce no claim absent from the completed draft.
- Protected identities: `EVIDENCE_LEDGER.md` SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`; `HANDOFF.md` SHA-256 `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- Audience:
  - The project owner managing work through chat.
  - A future agent needing to resume the active milestone without reading prior conversations.
  - A collaborator scanning what is next, why, and what would count as completion.
- Voice contract:
  - **register:** concise and operational, understandable without workflow jargon.
  - **person:** third-person project records; direct imperative only in instructions and templates.
  - **stance:** evidence-aware and candid about unresolved proof status; recommendations remain proposed until accepted.
  - **cadence:** short paragraphs, compact lists, and scannable first sentences.
- Document budget:
  - `CURRENT.md`: at most 500 words and 100 lines.
  - `docs/backlog/README.md`: at most 1,000 words.
  - Each backlog item: at most 500 words.
  - `AGENTS.md`: at most 220 words total after amendment.
  - Total new or amended target prose: at most 2,500 words.
- Citation policy:
  - Use repository-relative Markdown links for navigation.
  - Link current game-state claims to the relevant ledger section or stable ledger record; do not reproduce primary proof receipts in planning records.
  - Every local Markdown link must resolve.
  - Planning records must not cite themselves as empirical evidence.
- Craft reference: `/Users/eluckey/.orchflows/lib/packs/orch-content-pack/references/craft.md`.

## Completion test

1. `CURRENT.md` names the active frozen Level 26 milestone, its admissible exit condition, the accepted numerical boundary, exactly one `NEXT` item linked to `BL-0001`, later work linked to `BL-0002`, blockers or decisions needed, and a last-reviewed date.
   - Oracle: each claim traced to the spec's evidence, combined with deterministic section, link, and exact-`NEXT` count checks; oracle_class: evidence; provenance: authored-here.
2. `docs/backlog/README.md` defines backlog authority, stable-path and file-per-record rules, exactly six statuses, the minimal record schema, chat-to-record promotion, and the simple-file versus artifact-directory boundary in language the stated audience can apply.
   - Oracle: the content lens's structure rubric, via `orch-verify`, supplied with deterministic required-section and six-status presence checks; oracle_class: judged; provenance: authored-here, gate re-verified.
3. Exactly the two specified `BL-NNNN` files represent the active milestone: `BL-0001` is the ready compact-state evaluation and sole `NEXT`; `BL-0002` is proposed, depends on `BL-0001`, and does not commit to a decisive formulation. Both have unique stable IDs, required metadata, desired outcome, acceptance criteria, current evidence, next action, and append-only history.
   - Oracle: each claim traced to the spec's evidence, combined with deterministic file-count, frontmatter, section, unique-ID, status, dependency, and reciprocal-link checks; oracle_class: evidence; provenance: authored-here.
4. Every target surface states the applicable navigation-or-intent boundary and links to `EVIDENCE_LEDGER.md`.
   - Oracle: deterministic authority-language and repository-relative-link scan across the five assembled targets; oracle_class: deterministic; provenance: authored-here.
5. The ledger and historical handoff retain their exact fixed hashes.
   - Oracle: `shasum -a 256 EVIDENCE_LEDGER.md HANDOFF.md`, expecting respectively `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2` and `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`; oracle_class: deterministic; provenance: pre-existing.
6. `AGENTS.md` directs agents to read `CURRENT.md` for active work after `EVIDENCE_LEDGER.md` and distinguishes conversational intake, backlog intent, and accepted evidence while preserving its pre-existing ledger instructions.
   - Oracle: word count and section presence checks extended by deterministic exact-concept and repository-relative link resolution checks; oracle_class: deterministic; provenance: authored-here.
7. Relative to the completed intake status capture, the scoped result is documentation-only and introduces no project-path change outside the five-item write scope.
   - Oracle: baseline-aware changed-path set comparison: compare a fresh `git status --short` path/status set with the complete intake `git status --short` capture named by `intake-investigation`; subtract byte-identical pre-existing entries and this run's `.orch/runs/project-records-v1-2026-08-11/` and `.orch/tickets/project-records-v1-2026-08-11/` bookkeeping; require the remaining added or modified project-path set to be a subset of exactly `CURRENT.md`, `docs/backlog/README.md`, `docs/backlog/BL-0001-test-compact-state-signature.md`, `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md`, and `AGENTS.md`; oracle_class: deterministic; provenance: pre-existing.
8. The five assembled targets have no whitespace error.
   - Oracle: `git diff --check -- CURRENT.md docs/backlog/README.md docs/backlog/BL-0001-test-compact-state-signature.md docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md AGENTS.md`; oracle_class: deterministic; provenance: pre-existing.
9. All five targets satisfy their individual word or line caps and total at most 2,500 words; every required target and section is present.
   - Oracle: word count and section presence checks over the assembled document tree; oracle_class: deterministic; provenance: authored-here.
10. Every repository-relative Markdown link in the five targets resolves, every current game-state claim links to the relevant ledger section or stable record, and no planning record cites itself as empirical evidence.
   - Oracle: citation check over the assembled document tree; oracle_class: evidence; provenance: authored-here.
11. All five targets, including added transitions and instructions, hold the frozen register, person, stance, and cadence.
   - Oracle: the content lens's voice rubric against the spec's voice contract, via `orch-verify`; oracle_class: judged; provenance: authored-here, gate re-verified.
12. The document tree has one throughline, an ordered arc from current navigation through durable intent to agent discovery, non-duplicative section jobs, a self-sufficient skim layer, and a landing that preserves the ledger as authority.
    - Oracle: the content lens's structure rubric, via `orch-verify`; oracle_class: judged; provenance: authored-here, gate re-verified.
13. Every factual or current-state claim in the assembled targets is supported by the frozen evidence at its recorded proof class; unsupported claims remain explicitly proposed or unresolved.
    - Oracle: each claim traced to the spec's evidence; oracle_class: evidence; provenance: authored-here.

## Return fields

- changed_artifacts
- Assembled artifact identities
- Acceptance-to-artifact coverage map
- Cut log
- Verification entries
- Gaps
- Risks

## Result

- **changed_artifacts:**
  - `CURRENT.md` — created as the bounded current-work navigation surface.
  - `docs/backlog/README.md` — created as backlog authority and record-shape guidance.
  - `docs/backlog/BL-0001-test-compact-state-signature.md` — created as the sole ready `NEXT` record.
  - `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md` — created as proposed work dependent on `BL-0001`.
  - `AGENTS.md` — amended with ledger-first, then current-work discovery guidance and the chat/intent/evidence boundary.
  - `.orch/tickets/project-records-v1-2026-08-11/assemble-project-records.md` — Result, Verification, Feedback, and Risks filed; lifecycle fields preserved.
- **Assembled artifact identities:**
  - `CURRENT.md` SHA-256 `77eae456d486c89fc5cdee6a648305be76b7035f1b6a0f81405fd3b685995004`.
  - `docs/backlog/README.md` SHA-256 `ba65b8a0a0e013b624c4563eb462313dbb94363508aca0579e6334e2eea423ea`.
  - `docs/backlog/BL-0001-test-compact-state-signature.md` SHA-256 `8c78989cd3d5e770899fc9533effb0288f12c3608e728b4efe44221cf6b88b69`.
  - `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md` SHA-256 `f18ade4830bc53d55fa6721815595bf250f7852a57f94ab3774e0b2b8069310a`.
  - `AGENTS.md` SHA-256 `fa310f15eb960922ebc5d006c8457bf0847bd3c64e4c45709eca4ba1174993ec`.
- **Acceptance-to-artifact coverage map:**
  - Criteria 1 and 13: `CURRENT.md` carries the frozen milestone, proof boundary, admissible exits, one `NEXT`, later work, and unresolved decisions at the draft's recorded standing.
  - Criteria 2, 4, and 12: `docs/backlog/README.md` defines durable-intent authority, stable paths, six statuses, schema, promotion, bundle boundary, and navigation throughline.
  - Criteria 3 and 13: the two `BL-NNNN` records carry the required metadata, sections, dependency, evidence links, next actions, and append-only histories without adopting a proof method.
  - Criteria 4 and 6: all five targets state their navigation-or-intent boundary and link the ledger; `AGENTS.md` establishes ledger-first discovery followed by `CURRENT.md`.
  - Criteria 5 and 7-10: the protected hashes, changed-path boundary, whitespace, budgets, required surfaces, and links are covered by the deterministic checks in `## Verification`.
  - Criteria 11 and 12: the exact materialization preserves the completed draft's voice and structure self-checks for downstream independent gate review.
- **Cut log:** Workspace-only wrapper prose, target labels, and code fences were omitted during materialization. No target prose or acceptance coverage was cut; each target is byte-for-byte its corresponding completed draft block.
- **Gaps:** `[]`.
- **Risks:** See `## Risks`.

## Verification

1. **PASS — current-work coverage.** `CURRENT.md` has the active frozen Level 26 milestone, 12,336 replayed lower bound, 326,390 non-decisive proven upper bound, three admissible exits, exactly one `## NEXT` linked to `BL-0001`, later work linked to `BL-0002`, blockers/decision text, and `Last reviewed: 2026-08-11`.
2. **PASS — backlog guidance.** `docs/backlog/README.md` states backlog authority, stable-path and one-file rules, the artifact-bundle exception, exactly six status definitions, the minimal schema, chat promotion, and append-only history.
3. **PASS — record set.** `docs/backlog/` contains exactly `README.md` and the two specified records. IDs are unique; `BL-0001` is `ready` with no dependency, and `BL-0002` is `proposed`, depends on `BL-0001`, and selects no formulation. Both records contain all six required body sections.
4. **PASS — authority boundary.** Each target links `EVIDENCE_LEDGER.md` and states that navigation, backlog, conversation, or status does not constitute or alter empirical evidence.
5. **PASS — protected identities.** `shasum -a 256 EVIDENCE_LEDGER.md HANDOFF.md` returned `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2` and `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
6. **PASS — agent discovery.** `AGENTS.md` preserves every prior ledger instruction, adds `CURRENT.md` after the ledger, and distinguishes chat intake, backlog intent, and ledger-plus-primary-artifact evidence in 140 words.
7. **PASS — scoped documentation change.** A fresh `git status --short` comparison against the completed intake shows the materialized project-path changes are limited to the five authorized targets. Pre-existing dirty paths and run bookkeeping remain present and were not reverted.
8. **PASS — whitespace.** `git diff --check -- CURRENT.md docs/backlog/README.md docs/backlog/BL-0001-test-compact-state-signature.md docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md AGENTS.md` passed; an explicit trailing-whitespace scan over all five targets also returned no match, including the untracked files.
9. **PASS — budgets and surfaces.** Counts are `CURRENT.md` 209 words/30 lines; README 420 words; `BL-0001` 261 words; `BL-0002` 271 words; amended `AGENTS.md` 140 words. Total target prose is 1,301 words. Every required target and section is present.
10. **PASS — citations.** A deterministic scan resolved all 16 repository-relative Markdown links. Current-state claims link to the ledger, and no planning record cites itself as empirical evidence.
11. **PASS — voice self-check; independent gate required.** Exact draft-block materialization preserves the concise operational register, third-person record voice, proposed stance, proof-status candor, short paragraphs, and compact lists. The authored-here judgment remains for the downstream `orch-verify` gate.
12. **PASS — structure self-check; independent gate required.** The ordered tree moves from bounded current navigation to durable-intent rules, concrete active records, and agent discovery; first sentences carry the authority boundary and section jobs do not duplicate empirical receipts. The authored-here judgment remains for the downstream `orch-verify` gate.
13. **PASS — evidence standing.** The five targets are byte-for-byte the completed draft blocks. They keep 12,336 a replayed lower bound, 326,390 a non-decisive proven upper bound, `HYPOTHESIS-0001` and `HYPOTHESIS-0002` provisional, higher checks `UNKNOWN`, and reachability/exactness unresolved.

## Feedback

[]

## Risks

- Criteria 11 and 12 use authored-here judged oracles and still require the ticket's named downstream independent gate. No deterministic or evidence-trace gap remains in this assembly result.
