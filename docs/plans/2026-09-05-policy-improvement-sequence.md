---
title: Policy improvement sequence - Plan
type: docs
date: 2026-09-05
origin: .orch/runs/2026-09-05-policy-grounding/report.md
---

# Policy improvement sequence - Plan

Improve the bot's reliable attainment of the shipped targets, using speed to distinguish successful policies and keeping score as a separate diagnostic.
This is the required approach to the work, not permission to implement a particular policy change.
The owner accepted the sequence to prevent a repeat of conclusions drawn from incompatible comparisons and fixes selected before their cause was established.
Authority is recorded in `EVIDENCE_LEDGER.md` under DECISION-0006; progress belongs in `docs/backlog/BL-0014-policy-improvement-sequence.md`.

## Requirements

- R1. Follow Step 1, then Step 2, then Step 3, then Step 4. A later step may start only after the preceding step's completion evidence is recorded and accepted. Planning the later steps here does not execute them.
- R2. Before starting a step, cite the accepted predecessor result and confirm that its covered inputs remain valid. If evidence fails or an input change invalidates it, return to the earliest affected step and keep dependent work blocked.
- R3. Reordering, bypassing a step, or changing the reliable-wins-first priority requires an explicit owner amendment recorded with the action. An agent's convenience or a promising isolated result is not an amendment.
- R4. Preserve source-pinned findings and append-only corrections under the existing evidence rules. A local counterexample, an inconclusive audit, and a generalizing result retain their different proof standing.
- R5. A supported no-change disposition is an acceptable outcome. The sequence does not require a new generator, new scoring terms, a parameter search, or promotion.
- R6. Apply the repository's existing one-writer, experiment-registration, receipt-identity, and protected-main rules. This plan adds no exemption and does not change game rules, targets, or the frozen authoring evaluator.

The original BL-0013 implementation direction remains historical intent until Step 4 selects and scopes a supported change.
It cannot authorize work ahead of R1.

---

## Step 1 - Define the evaluation contract

**Prerequisite:** the owner's accepted sequence; no prerequisite experiment.

1. Identify the reference bot, level configurations, targets, move budgets, and random-stream convention by source identity. Keep the level-authoring evaluator distinct from the live policy being assessed.
2. Write the reliability rule: no reference win may become a challenger loss on the declared comparison set. Report losses and converted wins explicitly.
3. Define paired moves-to-target from the first valid target crossing. Specify the fixed comparison population, how new wins are ranked, treatment of ties, and aggregation across level/seed cases. Do not let dropping losses improve an average.
4. Define the separate score diagnostic with a common move budget and explicit terminal-failure treatment. Match the objective within each comparison; target-seeking and target-disabled policies must be labeled separately.
5. Define candidate/seed identity, duplicate-attempt weighting, ordinary-play provenance, and the separation between inspected examples and fresh holdout cases. State the meaningful improvement and compute-cost criteria that a later protocol must resolve before running.
6. Walk through small worked examples: a faster win ranks better; a lost reference win fails eligibility; extra moves cannot establish a score advantage; repeated attempts do not become independent boards. This is contract review, not a new policy experiment.

**Output:** a committed evaluation contract under `docs/`, with its exact path and identity recorded in BL-0014.

**Done when:** another reader can determine the winner, loser, tie, or unresolved result of the worked examples without inventing a rule. All choices needed to repair the benchmark are settled in the contract.

**If incomplete:** keep Step 2 blocked. Resolve the conflicting definition rather than running a comparison with an implicit choice.

---

## Step 2 - Correct the measurement premises and benchmark

**Prerequisite:** accepted Step 1 contract.

1. Route the grounding report's source-pinned findings into append-only corrections in the affected ledger, navigation, and backlog records. Preserve prior statements and their receipts. Address stopping conditions, repeated cases, ordinary-play coverage, the actual policy terms, and the RESULT-0017 attribution at their supported scope.
2. Bring `solver/human-benchmark.js` and its displayed explanations into agreement with the contract. Make candidate/seed identity, target, available moves, used moves, first target crossing, and outcome visible for each comparison.
3. Give ordinary play a separate, explicit provenance path using the current level identity plus exact replay. Preserve the boundary between `play-sessions/` and receipted `recordings/`; do not move ordinary files into the candidate corpus.
4. Make aggregation follow the contract's weighting. Report repeated attempts and unresolved recordings; never silently omit an unmatched subject or use level number alone as its identity.
5. Verify the real recordings and comparison paths. Check that missing/mismatched subjects and false outcome claims are detected, and that extra move budgets are visibly different comparisons. Use relevant existing checks and add focused coverage only for the changed behavior.
6. Reproduce the corrected baseline and record all limitations. Do not tune the bot or infer a population-level strength claim from these selected human sessions.

**Output:** corrected source-linked records, a contract-conforming benchmark, and a verified baseline report.

**Done when:** the displayed results can be traced to exact replayed subjects, the worked examples from Step 1 behave as specified, and every contested premise has either a correction or an explicit unresolved disposition. The four known repository failures are not cleared by exemptions or receipt rewrites.

**If incomplete:** keep Step 3 blocked. A passing command is insufficient if it never inspected the real corpus or still compares different objectives.

---

## Step 3 - Investigate missed moves on the bot's own trajectories

**Prerequisite:** accepted Step 2 baseline and still-valid Step 1 contract.

1. Define a bounded audit of the unchanged reference bot. Declare the level/topology coverage, seed policy, per-position search limits, runtime budget, and what observation would justify a proposed repair before collecting new measurements. Register and commit a protocol before any run intended to support a generalizing claim.
2. Capture reproducible states reached by the bot itself: initial subject/seed, preceding moves, current board, score, remaining target, remaining moves, and blocker state. Keep human-reached counterexamples as a separate class.
3. Use the existing exact chain search where tractable to look for a legal immediate win that the bot misses. Reproduce the full transition, including bomb loss, before calling it a valid winning alternative. A search limit or timeout returns UNKNOWN, not proof that no winning move exists.
4. For each confirmed miss, inspect whether the useful chain was absent from generation, present but ranked below another choice, or bypassed by a target/bomb control-flow rule. Retain unresolved cases instead of forcing them into a preferred explanation.
5. Measure the observed frequency, finish delay or losses affected, and added search cost. Separate observations on inspected positions from evidence across fresh cases; do not project one human-reached position onto the bot's whole-game performance.
6. Produce a disposition: a specific supported repair candidate, a bounded finding that supports no change, or insufficient evidence. Identify the smallest extra investigation needed if the result is unresolved.

**Output:** an identity-bound audit report, replayable cases, search-coverage limits, and a cause-specific disposition.

**Done when:** the declared audit is accounted for and the disposition states exactly what was shown, what remains UNKNOWN, and whether there is evidence to implement anything. Support for a change must meet the predeclared justification and cost criteria.

**If inconclusive:** retain that result and leave implementation unready. Additional measurements require a new declared bound/protocol as applicable. Do not replace the uncertain cause with the old three-term proposal.

---

## Step 4 - Select, implement, and validate the supported change

**Prerequisite:** accepted Step 3 disposition, with Steps 1 and 2 still valid.

1. Map the demonstrated cause to the smallest proposed change. Generation, ranking, and selection-control defects have different remedies. If no change is supported, record that disposition and close without fabricating implementation work.
2. Write a narrow implementation scope and acceptance conditions around the replayable failure. Update or replace BL-0013's ready-work definition only if the evidence selects that work; its original three-term bundle is not mandatory.
3. Implement the isolated challenger and show that it addresses the real counterexample without mutating its input. Keep the reference policy available for paired comparison. Test relevant edge cases and execution cost before a larger run.
4. Freeze the challenger and register a comparison protocol before fresh validation. Specify the sample, aggregation, stopping rule, improvement criterion, and cost limits in advance. Use fresh holdout cases; do not keep tuning against a consumed holdout.
5. Apply the Step 1 eligibility and ranking rules. Report regressions, faster/slower/tied pairs, converted wins, score diagnostics, and compute cost. Run the applicable existing repository checks, keeping their coverage and known failures explicit.
6. Record the evidence and a promotion recommendation. A supported improvement, a rejected challenger, and an inconclusive result are distinct outcomes. Promotion follows the existing owner-decision and PR-review rules; validation alone does not authorize replacing the champion.

**Output:** a validated narrow challenger and disposition, or an explicit no-change/rejected/inconclusive closeout.

**Done when:** the chosen branch of work has an evidence-backed disposition, retained reproduction artifacts, and no unreported required check. Any shipped change has completed the existing review and promotion requirements.

**If validation fails:** preserve the failed subject and result. A repair is a new challenger with fresh applicable evidence; return to the earliest invalidated step under R2.

---

## Existing grounding and work still to define

Use `.orch/runs/2026-09-05-policy-grounding/report.md` and its raw diagnostics as the bounded starting evidence.
The existing pilot counterexample demonstrates a missing immediate finish on a human-reached position; it does not establish a general deficit on the bot's own paths.
The inspected human sessions are regression examples, not unused holdout data.

Step 1 still must settle the operational metric and weighting details.
Step 3 must set the audit bounds and justification criteria before new measurements.
Step 4 must set its challenger-specific validation protocol before the run.
This approach plan does not silently fill those choices or mark any of the four steps complete.
