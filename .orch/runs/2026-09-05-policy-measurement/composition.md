# Step 2 composition

- description: Deliver the corrected benchmark, then its source-pinned baseline and append-only record corrections.
- entry: named runtime instance for owner-approved Step 2
- kind-count: two. Executable comparison/tests/raw diagnostic output are code; prose ledger corrections and baseline report are content. No new research claim or policy experiment.
- bound: 150 minutes total
- steps:
  - id: measurement; unit: orch-deliver; pack: orch-code-pack; spec: ../2026-09-05-policy-measurement-code/spec.md; profile: orch-planner
  - id: records; unit: orch-deliver; pack: orch-content-pack; successor spec authored only after measurement result identity exists; profile: orch-planner
- edges: seq measurement -> records, predecessor revision and raw baseline hash carried into successor evidence.
- invariants: Both steps inherit DECISION-0006/R1-R6 and Step 2 only under DECISION-0006 and the unchanged pinned four-step plan. Preserve POLICY-EVAL-0001 contract.md and inputs.json byte-for-byte. Do not edit src/game.js, solver/engine.js, solver/bot.js, solver/level-author.js, frozen evaluator, candidates, receipts, raw recordings, old experiments, existing gates, or the four known failure exemptions. No bot audit, policy tuning, fresh holdout selection, generalized strength claim, PR, push, or main merge. Existing selected recordings are a descriptive panel, not independent population samples. Every required input is accounted for; missingness is never silent. Make durable changes with apply_patch. One writer per tree; implementation owns an isolated worktree and only its root ticket result sections while root does read-only work. Full-suite comparison is by failure identity, not count.
- done_check: Fresh independent orch-verify/planner receives only this composition and final artifact identities, not internal verdicts. It checks frozen contract/plan/reference hashes; all 15 recording dispositions; raw-vs-report and weighting/classification/horizon correspondence; source-supported append-only disposition of stopping premise, repetitions, ordinary coverage, actual policy terms and RESULT-0017 attribution; Step 2 acceptance links exact artifacts; Step 3 remains unexecuted. PASS requires no unreported required check or corrected claim unsupported by cited source. Scope is document and finite-corpus verification, not general strength.
- Require: accepted Step 1 package and owner proceed.
- Return: final revision, baseline/report identities, final verification and per-step results, limits.

Admission: both named steps bind invariants, sequential kind boundary is explicit,
whole-composition done_check is specified. Successor spec intentionally absent at intake.
