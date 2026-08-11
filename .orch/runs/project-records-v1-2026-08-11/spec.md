# Spec: project records v1

- **run:** `project-records-v1-2026-08-11`
- **objective:** The repository has a compact, agent-readable current-work surface and a record-per-file backlog for the active frozen Level 26 milestone, with explicit authority boundaries that prevent planning records from being mistaken for evidence.
- **routing:**
  - **pack:** `orch-content-pack`

## Non-goals

- Reorganizing the evidence ledger, handoff, experiments, hypotheses, decisions, runbooks, solver artifacts, or product documentation.
- Migrating historical or unrelated work into the backlog.
- Implementing a database, project-management application, generator, linter, or CI check.
- Starting either backlog task or changing the frozen Level 26 proof state.

## Acceptance

1. Root `CURRENT.md` identifies the active milestone, its admissible exit condition, the accepted numerical boundary, exactly one `NEXT` backlog item, later work, blockers or decisions needed, and a last-reviewed date.
   - **oracle:** deterministic section/link/`NEXT` count scan plus claim tracing to the fixed ledger; **oracle_class:** evidence.
2. `docs/backlog/README.md` defines the backlog's authority, stable-path/file-per-record rule, six-status vocabulary, minimal record schema, chat-to-record promotion rule, and the boundary between a simple file and an artifact directory.
   - **oracle:** deterministic required-term and section scan followed by content-lens judgment; **oracle_class:** judged.
3. The active milestone is represented by exactly two initial `BL-NNNN` files: one ready compact-state evaluation and one proposed dependent decisive-formulation evaluation. Each has a unique stable ID, required metadata, desired outcome, acceptance criteria, current evidence, next action, and append-only history.
   - **oracle:** deterministic frontmatter/section/unique-ID/link scan and evidence trace to the fixed ledger; **oracle_class:** evidence.
4. Every new planning surface states that it is navigation or intent rather than evidence, and it links to `EVIDENCE_LEDGER.md` for current proof standing; the ledger and historical handoff remain byte-identical to intake.
   - **oracle:** link and authority-language scan plus SHA-256 comparison against the fixed hashes; **oracle_class:** deterministic.
5. `AGENTS.md` directs future agents to read `CURRENT.md` for active work after the evidence ledger and to preserve the distinction between conversational intake, backlog intent, and accepted evidence.
   - **oracle:** deterministic exact-concept scan and local-link resolution; **oracle_class:** deterministic.
6. The result is documentation-only, has no broken local Markdown links or whitespace errors, and remains within the length budget.
   - **oracle:** scoped Git diff, local Markdown link scanner, `git diff --check`, and word counts; **oracle_class:** deterministic.

## Binding constraints

- Preserve `EVIDENCE_LEDGER.md` at intake SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`.
- Preserve `HANDOFF.md` at intake SHA-256 `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- Preserve all pre-existing dirty work and do not edit `src/`, `solver/`, existing `.orch` runs/tickets, or unrelated `docs/` artifacts.
- Use stable backlog paths; status changes happen in record metadata, not by moving files among status directories.
- `CURRENT.md` may sequence work but may not create or strengthen evidence claims.
- Do not silently accept a hypothesis, choose a proof method, or start game/solver work.
- Make all project-file edits with `apply_patch`.

## Evidence

- `.orch/tickets/project-records-v1-2026-08-11/intake-investigation.md` at its completed intake revision.
- `EVIDENCE_LEDGER.md` SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, especially Current snapshot, Hypothesis registry, Open-question registry, and Resume boundary.
- `AGENTS.md` SHA-256 `e1d9fb8c9861cf24a52b8ed027275ec579718592e6bc70cb469b419e063fc2f5`.
- `.orch/runs/game-evidence-ledger-2026-08-11/verification.md` SHA-256 `abd7fe736ca189178adbbff61202f586c993eb2b34955e097fd785f6b952d759`.
- Owner-settled conversation decisions: chat is the management interface; Markdown records are durable storage; `CURRENT.md` is bounded and links rather than duplicates; one file is the default record unit; directories are reserved for artifact bundles; only the active milestone is migrated initially.

## Affected surfaces

- `CURRENT.md`
- `docs/backlog/README.md`
- `docs/backlog/BL-0001-test-compact-state-signature.md`
- `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md`
- `AGENTS.md`
- Run bookkeeping under `.orch/runs/project-records-v1-2026-08-11/`
- Ticket bookkeeping under `.orch/tickets/project-records-v1-2026-08-11/`

## Exemplars

- `EVIDENCE_LEDGER.md` at the fixed intake hash: imitate stable IDs, explicit authority boundaries, narrow status semantics, source-linked claims, and retained history; do not imitate its monolithic registry layout for backlog storage.
- `AGENTS.md` at the fixed intake hash: imitate concise, imperative discovery guidance and proof-class discipline.

## Audience

- The project owner managing work through chat.
- A future agent needing to resume the active milestone without reading prior conversations.
- A collaborator scanning what is next, why, and what would count as completion.

## Voice contract

- **register:** concise and operational, understandable without workflow jargon.
- **person:** third-person project records; direct imperative only in instructions and templates.
- **stance:** evidence-aware and candid about unresolved proof status; recommendations remain proposed until accepted.
- **cadence:** short paragraphs, compact lists, and scannable first sentences.

## Length budget

- `CURRENT.md`: at most 500 words and 100 lines.
- `docs/backlog/README.md`: at most 1,000 words.
- Each backlog item: at most 500 words.
- `AGENTS.md`: at most 220 words total after amendment.
- Total new or amended target prose: at most 2,500 words.

## Citation policy

- Use repository-relative Markdown links for navigation.
- Link current game-state claims to the relevant ledger section or stable ledger record; do not reproduce primary proof receipts in planning records.
- Every local Markdown link must resolve.
- Planning records must not cite themselves as empirical evidence.

## Bound

- **effort:** one content delivery with one drafting unit, one independent content gate, and one final verification; no solver execution required.
- **plan_gate:** false; the owner approved the design and explicitly authorized implementation.

## Risks

- `CURRENT.md` could become a second source of truth if it repeats evidence without a clear ledger link.
- Backlog items could accidentally encode an unapproved technical choice as committed work.
- More schema than the project needs would recreate the management burden this design is meant to remove.

## Assumptions

- The active milestone is the unresolved frozen Level 26 seed-0 13,000 reachability question recorded in the ledger.
- The compact-state evaluation is the immediate next diagnostic because the ledger names it as untested, while the exact continuation formulation remains a dependent proposed item rather than an accepted implementation choice.
- Structural automation is deferred until real usage reveals which failures recur.
