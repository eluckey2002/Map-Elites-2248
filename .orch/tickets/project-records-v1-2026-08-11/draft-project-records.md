---
id: draft-project-records
run: project-records-v1-2026-08-11
status: complete
executor: orch-draft
pack: orch-content-pack
independence: gate
depends_on: []
write_scope:
  - .orch/runs/project-records-v1-2026-08-11/workspace/project-records-draft.md
excluded_actions:
  - edit CURRENT.md, docs/backlog/, or AGENTS.md directly
  - edit EVIDENCE_LEDGER.md, HANDOFF.md, the frozen spec, the worklog, or any other ticket; this ticket may update only Result, Verification, Feedback, Risks, and optional Handoff
  - edit src/, solver/, or unrelated docs/ artifacts
  - commit or publish
bound: one first-pass documentation-set draft within every per-surface cap and a 2,250-word aggregate draft allocation
claimed_by: /root/orch_worker_gpt_5_6_sol_high
claimed_at: 2026-08-11T03:47:04-05:00
---

## Objective

A single source-grounded draft at the assigned workspace identity contains the complete proposed project-record set, ready for a terminal editor to materialize without deciding a proof method or changing evidence standing.

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
- Completed intake: `.orch/tickets/project-records-v1-2026-08-11/intake-investigation.md` at its completed revision.
- Fixed evidence:
  - `EVIDENCE_LEDGER.md` at SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, especially **Current snapshot**, **Hypothesis registry**, **Open-question registry**, and **Resume boundary**.
  - `AGENTS.md` at SHA-256 `e1d9fb8c9861cf24a52b8ed027275ec579718592e6bc70cb469b419e063fc2f5`.
  - `.orch/runs/game-evidence-ledger-2026-08-11/verification.md` at SHA-256 `abd7fe736ca189178adbbff61202f586c993eb2b34955e097fd785f6b952d759`.
  - The owner-settled conversation decisions frozen in the spec: chat is the management interface; Markdown records are durable storage; `CURRENT.md` is bounded and links rather than duplicates; one file is the default record unit; directories are reserved for artifact bundles; only the active milestone is migrated initially.
- Protected, not writable evidence: `EVIDENCE_LEDGER.md` at the fixed hash above and `HANDOFF.md` at SHA-256 `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- Exemplars: the fixed `EVIDENCE_LEDGER.md` for stable IDs, authority boundaries, status semantics, source-linked claims, and retained history; the fixed `AGENTS.md` for concise imperative discovery guidance and proof-class discipline.
- Outline slot: the complete project-record set as one bounded drafting unit, in this order: root `CURRENT.md`; `docs/backlog/README.md`; `docs/backlog/BL-0001-test-compact-state-signature.md`; `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md`; the proposed `AGENTS.md` amendment. The workspace draft must label the exact target for each block. It does not materialize any target.
- Slot position: unit 1 of 1, before terminal assembly.
- Section job: establish one coherent navigation-and-intent surface for the active milestone while keeping the evidence ledger authoritative.
- Sibling slots not to duplicate: `[]`.
- Audience:
  - The project owner managing work through chat.
  - A future agent needing to resume the active milestone without reading prior conversations.
  - A collaborator scanning what is next, why, and what would count as completion.
- Voice contract:
  - **register:** concise and operational, understandable without workflow jargon.
  - **person:** third-person project records; direct imperative only in instructions and templates.
  - **stance:** evidence-aware and candid about unresolved proof status; recommendations remain proposed until accepted.
  - **cadence:** short paragraphs, compact lists, and scannable first sentences.
- Length bound:
  - `CURRENT.md`: at most 500 words and 100 lines.
  - `docs/backlog/README.md`: at most 1,000 words.
  - Each backlog item: at most 500 words.
  - `AGENTS.md`: at most 220 words total after amendment.
  - Total new or amended target prose: at most 2,500 words.
- Draft allocation: at most 2,250 words across the five proposed target blocks, reserving at least 250 words of the final aggregate budget for terminal editing.
- Citation policy:
  - Use repository-relative Markdown links for navigation.
  - Link current game-state claims to the relevant ledger section or stable ledger record; do not reproduce primary proof receipts in planning records.
  - Every local Markdown link must resolve.
  - Planning records must not cite themselves as empirical evidence.
- Craft reference: `/Users/eluckey/.orchflows/lib/packs/orch-content-pack/references/craft.md`.

## Completion test

1. The workspace draft contains five distinctly labeled target blocks and covers every required field, section, status count, dependency, authority statement, and navigation instruction in acceptance criteria 1-5.
   - Oracle: word count and section presence checks extended by deterministic scans for all five target labels; every named `CURRENT.md` concept and exactly one `NEXT`; the README authority, stable-path, file-per-record, exactly-six-status, schema, chat-promotion, and artifact-directory concepts; both stable backlog IDs, statuses, dependency, and required sections; every authority/link statement; and all required `AGENTS.md` concepts; oracle_class: deterministic; provenance: authored-here.
2. Every game-state, numerical-boundary, milestone, and dependency claim in the draft traces to the fixed spec or fixed evidence without promoting a lower bound, upper bound, hypothesis, `UNKNOWN`, or unresolved question.
   - Oracle: each claim traced to the spec's evidence; oracle_class: evidence; provenance: authored-here.
3. The draft's arc makes the ledger authoritative, `CURRENT.md` navigational, the backlog intentional, `BL-0001` the sole `NEXT` ready item, and `BL-0002` proposed and dependent without silently choosing its formulation.
   - Oracle: the content lens's structure rubric, via `orch-verify`; oracle_class: judged; provenance: authored-here, gate re-verified.
4. Every target block holds the frozen register, person, stance, and cadence.
   - Oracle: the content lens's voice rubric against the spec's voice contract, via `orch-verify`; oracle_class: judged; provenance: authored-here, gate re-verified.
5. Proposed citations are repository-relative, resolve either in the fixed tree or to one of the five named assembly targets, and no planning record cites itself as empirical evidence.
   - Oracle: citation check over the proposed document tree in the workspace draft; oracle_class: evidence; provenance: authored-here.
6. Each proposed target remains within its frozen per-surface cap, and the complete draft is at most 2,250 words so at least 250 words of aggregate slack remain for terminal editing without cutting acceptance coverage.
   - Oracle: word count and section presence checks, including target-block word counts, the aggregate draft count, and arithmetic confirmation of the reserved slack; oracle_class: deterministic; provenance: authored-here.

## Return fields

- changed_artifacts
- Draft identity
- Target-to-block map
- Cut log
- Verification entries
- Gaps
- Risks

## Result

- **changed_artifacts:**
  - `.orch/runs/project-records-v1-2026-08-11/workspace/project-records-draft.md` — created as the complete five-block proposed project-record set.
  - `.orch/tickets/project-records-v1-2026-08-11/draft-project-records.md` — Result, Verification, Feedback, and Risks filed; claim and status fields preserved.
- **Draft identity:** `.orch/runs/project-records-v1-2026-08-11/workspace/project-records-draft.md`, SHA-256 `50fae2b74743a65dcd903dec5885063237317ff5827969fd302eaf78f47bf3e8`.
- **Target-to-block map:**
  - `CURRENT.md` -> `## Target: CURRENT.md`
  - `docs/backlog/README.md` -> `## Target: docs/backlog/README.md`
  - `docs/backlog/BL-0001-test-compact-state-signature.md` -> `## Target: docs/backlog/BL-0001-test-compact-state-signature.md`
  - `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md` -> `## Target: docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md`
  - `AGENTS.md` -> `## Target: AGENTS.md`
- **Cut log:** No acceptance coverage was cut. Primary proof-receipt detail was kept out of planning prose in favor of ledger links, and historical or unrelated backlog work was omitted under the frozen non-goals. The draft uses 1,301 of its 2,250-word allocation.
- **Verification entries:** See `## Verification`; all six executor checks pass, with the two judged checks identified for the required independent gate re-verification.
- **Gaps:** `[]`.
- **Risks:** See `## Risks`.

## Verification

1. **PASS — required coverage.** A deterministic parser found exactly five ordered target blocks. Required-concept scans found the active milestone, numerical boundary, admissible exits, exactly one `NEXT`, later work, blockers/decision, and review date; the README authority, stable-path, one-file default, artifact-bundle boundary, six status definitions, schema, chat promotion, and append-only history; both unique IDs, statuses, dependency, and required sections; and the amended agent-discovery concepts.
2. **PASS — evidence trace and proof standing.** Numerical and milestone claims trace to `EVIDENCE_LEDGER.md` Current snapshot and Resume boundary; compact-state claims trace to provisional `HYPOTHESIS-0001`; formulation possibilities trace to provisional `HYPOTHESIS-0002`; ready/proposed status, dependency, navigation authority, and owner-interface claims trace to the frozen spec. The draft keeps 12,336 a replayed lower bound, 326,390 a non-decisive proven upper bound, higher bounded checks `UNKNOWN`, and reachability/exactness unresolved.
3. **PASS — arc self-check; independent gate pending.** The skim layer establishes ledger authority, makes `CURRENT.md` navigational, names BL-0001 as the sole ready item, and leaves BL-0002 proposed and dependent without adopting a formulation. This authored-here judged result remains subject to the ticket's required `orch-verify` gate.
4. **PASS — voice self-check; independent gate pending.** All five blocks use concise operational language, third-person record voice with imperatives confined to instructions, candid proof-status language, proposed recommendations, short paragraphs, and compact lists. This authored-here judged result remains subject to the required independent gate.
5. **PASS — citation resolution.** A virtual-target-aware local-link scan checked 16 links. All resolve either to fixed repository files or one of the five proposed assembly targets; planning files link to the ledger for empirical standing and do not cite themselves as empirical evidence.
6. **PASS — length and protected identities.** Target counts are: `CURRENT.md` 209 words/30 lines; backlog README 420 words; BL-0001 261 words; BL-0002 271 words; amended `AGENTS.md` 140 words. Aggregate proposed target prose is 1,301 words, leaving 1,199 words under the 2,500-word final budget and 949 under the 2,250-word draft allocation. `git diff --check` passed. Protected hashes still match intake: ledger `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, handoff `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`, current AGENTS exemplar `e1d9fb8c9861cf24a52b8ed027275ec579718592e6bc70cb469b419e063fc2f5`, and fixed verification receipt `abd7fe736ca189178adbbff61202f586c993eb2b34955e097fd785f6b952d759`.

## Feedback

[]

## Risks

- Terminal editing could weaken the authority language, introduce a second `NEXT`, or turn BL-0002's proposal into an adopted method. Preserve the block identities and re-run the independent content gate after assembly.
