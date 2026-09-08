---
run: 20260908T083200Z-descriptor-smell-recovery
objective: >-
  The repository can reject a malformed experiment protocol before registration, reports descriptor prediction across both unseen levels and unseen policies, and names protocol.md as the sole scientific authority without weakening any existing evidence gate.
non_goals:
  - Execute RESULT-0030 controls or confirmation, interpret outcomes, formalize a descriptor, or edit the evidence ledger.
  - Change game rules, shipped levels, targets, scoring, production policies, receipts, or existing completed experiment records.
  - Replace the deliberate four-failure repository standing or create a second experiment gate.
acceptance:
  - id: DSR-DRAFT-01
    criterion: >-
      The existing experiment registration tool checks a real uncommitted protocol draft and every named version-freeze path before registration; the exact RESULT-0029 extra-hex defect fails while an exact 16-hex freeze passes.
    oracle: >-
      node --test solver/tests/experiments.test.js runs the public draft-check seam against known-good and one-character-too-long bad protocol files and observes distinct zero/nonzero outcomes.
    oracle_class: deterministic
    oracle_provenance: pre-existing tool and authored-here cases
  - id: DSR-HOLDOUT-02
    criterion: >-
      RESULT-0030's frozen calculator reports deterministic leave-one-policy-out diagnostics in addition to leave-one-level-out diagnostics, with seed aggregation preceding both analyses.
    oracle: >-
      node --test solver/tests/syntheticDescriptorValidation.test.js proves duplicated seeds do not change either diagnostic and a policy-held-out fixture returns nine folds over 81 policy-level rows.
    oracle_class: deterministic
    oracle_provenance: pre-existing calculator seam and authored-here cases
  - id: DSR-AUTHORITY-03
    criterion: >-
      Repository experiment guidance makes experiments/<RESULT-ID>/protocol.md the sole authority for the scientific question, denominator, selection rule, analysis, and verdict thresholds; orchestration files may point to it but do not restate it.
    oracle: >-
      A fixed-revision review of experiments/README.md and experiments/TEMPLATE.md finds one authority rule plus explicit prompts for purposive/probability selection and the true unit of generalization.
    oracle_class: judged
    oracle_provenance: authored-here
  - id: DSR-GATE-04
    criterion: >-
      The widened pre-registration check has an updated check card, reads no output it produced, retains the malformed-hash twin, and declares that it cannot prove source-set completeness or scientific validity.
    oracle: >-
      docs/CHECK-CARDS.md answers the nine gate-check questions and the focused experiment tests execute the good and bad drafts through the same CLI.
    oracle_class: deterministic and judged
    oracle_provenance: gate-check plus authored-here test
  - id: DSR-REGRESSION-05
    criterion: >-
      Focused tests remain green, the full suite adds no failure identity beyond the four documented baseline failures, and protected production/evidence paths remain byte-identical to 9d125e8.
    oracle: >-
      node --test solver/tests/experiments.test.js solver/tests/syntheticDescriptorValidation.test.js; node --test solver/tests/*.test.js; and git diff --exit-code 9d125e8 -- src/game.js solver/engine.js solver/level-author.js solver/bot.js EVIDENCE_LEDGER.md CURRENT.md.
    oracle_class: deterministic
    oracle_provenance: pre-existing
binding_constraints:
  - Widen tools/new-experiment.js rather than add a parallel registration checker.
  - The draft check is pre-commit only; the existing history-aware runtime and repository gates remain authoritative after registration.
  - The policy-held-out calculation is diagnostic and cannot silently replace RESULT-0030's predeclared primary verdict.
  - Do not execute any RESULT-0030 synthetic outcome game in this code delivery.
  - Use protocol.md as the only scientific source of truth in the successor research delivery.
  - Preserve unrelated user changes and keep all work in the isolated worktree branch.
evidence:
  - 2248-challenge@154c44a76188b884afcdb7e4b4e644950c59d57a
  - experiments/RESULT-0029/report.md@f8faea8, showing zero games and the 17-character registered hash
  - experiments/RESULT-0030 harness@77bb0bb9b791c4cf3d12c99b3c3ee83bc02e1459
  - Focused baseline at 154c44a: 44 tests, 44 pass
affected_surfaces:
  - tools/new-experiment.js
  - solver/tests/experiments.test.js
  - experiments/RESULT-0030/analyze.js
  - solver/tests/syntheticDescriptorValidation.test.js
  - experiments/README.md
  - experiments/TEMPLATE.md
  - docs/CHECK-CARDS.md
  - .orch/runs/20260908T083200Z-descriptor-smell-recovery/
exemplars:
  - pointer: docs/CHECK-CARDS.md@154c44a
    imitate:
      - one widened check rather than a parallel gate
      - a serialized or file-backed malformed twin through the public seam
      - an explicit Does NOT catch boundary
routing:
  pack: orch-code-pack
bound:
  tickets: 1
  correction_passes: 1
  tool_calls: 35
  plan_gate: false
target_repository: /private/tmp/2248-synthetic-descriptor-validation-20260906@154c44a
standards_owner:
  - AGENTS.md
  - experiments/README.md
  - docs/CHECK-CARDS.md
  - /Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md
risks:
  - A draft checker can create false confidence if it is mistaken for source-closure or scientific review.
  - Holding out policies can be unstable at the factorial corners; it is diagnostic unless the successor protocol explicitly promotes it before data.
assumptions:
  - RESULT-0030 has no registered protocol or outcome artifact and may still change before registration.
  - The isolated branch remains the only writer in this worktree.
---

# Descriptor smell recovery

Deliverable-kind decision: code. It removes the observed registration trap and
closes the calculator's policy-reuse blind spot. The successor empirical answer
is research and is therefore a separate, sequential spec.
