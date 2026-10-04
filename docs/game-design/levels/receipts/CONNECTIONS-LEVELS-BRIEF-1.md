# CONNECTIONS-LEVELS-BRIEF-1 — finite puzzle requirements

Producer: codex. Declared reviewer: owner. Prepared 2026-10-03.
Standing: approved design intent and local document checks, not implemented gameplay, independent review or formal task acceptance.

## Result and authority

Requirements-only artifact:
`docs/plans/2026-10-03-0341-feat-connection-puzzle-levels-plan.md`.

The owner chose separate puzzles over same-board chapters, a hard move budget over unlimited moves, and budgeted removal over free removal.
They then confirmed the whole proposed first-pack scope with “yes”.
PDL-030 preserves that authority; PDL-029 preserves the preceding enjoyment report verbatim without inferring endurance or population balance.
The brief includes 15 requirements, four flows and seven conditional acceptance examples.
Concrete boards and allowances remain delegated design/authoring work, not values proved by this document.

This pass wrote the brief, navigation, feedback/decision history and one resolved glossary term.
It did not write a level model, tune existing rules, restart servers, inspect owner browser surfaces, run a solver study, create a commit or publish anything.

## Checks actually performed

- All 52 existing runtime/protected files in the scoped pre-write inventory match their SHA-256s after the document edits.
- `git diff --check` passes.
- A diagnostic reads the actual written brief: required metadata/sections exist, R1-R15 occur exactly once, requirement references resolve, no placeholders/status flag/trailing whitespace appear, and all seven local source links exist.
- The same diagnostic rejects a real copied artifact with R5 removed and rejects an absent artifact. Control copy: `/private/tmp/connections-level-brief-check.hURNIR/missing-budget.md`.
- Five navigation/glossary/history documents resolve 161 local links and pass the whitespace scan.
- Direct reads of the actual current model and play contract confirm the retained earning, bank, removal and ordinary-play behavior bound by R3/R6.

Source verification ran inline under the active user instruction to execute Subagent/Parallel work sequentially in main.
No fresh-context verifier or independent document-review approval is claimed.

## Ready for Planning review of the actual artifact

**Complete:** Required frontmatter and Product Contract sections are present; all open questions are classified Deferred to Planning, with no placeholders or product blocker left.

**Consistent:** The shared budget covers committed merges/removals, not free controls; final-objective completion on the last move wins before loss evaluation; charges persist between objectives but reset between levels; fixed retry and no skip/redeal agree across requirements, flows and examples.
The budget sentence was tightened during this check so it would not accidentally prohibit undo after exhaustion.
Bound external contracts are limited to ordinary/recovery behavior, with finite-mode exceptions explicit.

**Focused:** One outcome, finite Connection puzzles, owns the requirements.
Endless play remains untouched; chapters, campaign progression, new bonuses, bot studies and the old archetype quota are excluded.

**Usable by planning:** Starting conditions, objective progression, accounting, win/loss priority, recovery availability, retry, controls and preservation are specified.
The planner must author the concrete scenes and budgets against the recorded qualitative success criteria, not invent different player behavior.

These four checks passed as an inline author review, not an independent endorsement of puzzle quality.
No gameplay tests were rerun for this document-only change; previous passing counts are historical, and the full solver suite's documented failures remain unchanged.

## Preservation and remaining work

Document-only local checkpoint: workspace `preservation/connections-levels-brief-20261003/`.
Its external README records the manifest/archive and fresh-extraction checks after execution.
It contains no runtime or captures and does not overwrite earlier archives.
The existing power-up runtime checkpoint remains the appropriate source for that game.

Owner confirmation settled the design scope, not board feasibility, budget quality, native QA, independent review, acceptance or shipping.
Implementation planning is the recommended next handoff; this task stops at the saved brief.
