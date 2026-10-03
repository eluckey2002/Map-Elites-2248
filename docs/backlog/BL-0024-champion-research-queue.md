---
id: BL-0024
title: Improve the champion through bounded opportunistic research
status: ready
milestone: champion-improvement
depends_on: []
updated: 2026-10-02
---

# BL-0024 — Champion improvement research queue

## Authority

Owner-requested durable intent from the 2026-10-02 conversation. This record authorizes bounded research and isolated challengers when resources are available. It is not evidence of improvement. Proof standing lives in [EVIDENCE_LEDGER.md](../../EVIDENCE_LEDGER.md). It does not authorize changing shipped game rules, calibration, targets, or promoting a replacement champion.

## Desired outcome

Develop a faster and more reliable target-reaching policy, using the following seven goals. Start with diagnosis; use its findings to select subsequent work rather than launching every method at once.

| Item | Goal | Initial state | Dependency |
| --- | --- | --- | --- |
| CR-01 | Diagnose champion decision errors | ready | none |
| CR-02 | Improve candidate-chain discovery | blocked | CR-01 |
| CR-03 | Train an oracle-guided move ranker | blocked | CR-01 |
| CR-04 | Allocate deeper search to difficult decisions | blocked | CR-01 |
| CR-05 | Evaluate Monte Carlo planning | blocked | CR-01 |
| CR-06 | Learn a state-dependent strategy | blocked | CR-01 |
| CR-07 | Search interacting policy parameters | blocked | CR-01 |

### CR-01 — Diagnose champion decision errors

Build a reproducible benchmark of positions where the champion loses or wins slowly. Use bounded oracle search to distinguish missing candidate chains from poor move ranking. Deliver replayable board examples, source identities, and a report identifying the highest-value next opportunity. An oracle witness is not an optimality proof. First session: inspect existing oracle and comparison interfaces and define the diagnostic protocol; collect no experimental results before registration.

### CR-02 — Improve candidate-chain discovery

Implement bounded backtracking or a diverse beam to discover useful chains the champion misses. Keep move ranking fixed. Deliver an isolated challenger, coverage diagnostics, and a paired evaluation of wins, moves to target, and cost. Unlock only if CR-01 supports candidate omission as a useful research direction.

### CR-03 — Train an oracle-guided move ranker

Generate training labels by comparing legal moves under a fixed oracle budget. Preserve unresolved or tied labels instead of treating bounded misses as losses. Train a lightweight ranker over the same candidate pool and evaluate a frozen model on disjoint seeds. Deliver dataset provenance, model identity, inference cost, and reproducible evaluation. Unlock only if CR-01 supports ranking errors and an affordable labeling route exists.

### CR-04 — Allocate deeper search to difficult decisions

Increase search depth or width when scores are close, bombs are urgent, or useful continuations are scarce. Test whether those triggers predict mistakes. Compare adaptive and fixed search under matched compute budgets. Deliver the trigger definition, compute accounting, challenger, and paired results.

### CR-05 — Evaluate Monte Carlo planning

Implement bounded Monte Carlo tree search over legal moves and possible refills, using only information available to the player. Sample hidden refills; do not give the challenger the actual future seed. Deliver a reproducible planner and compare target wins and moves against the champion under matched compute budgets. Establish the champion's information access before choosing the fair comparator.

### CR-06 — Learn a state-dependent strategy

Replace fixed heuristic weights with a small model responding to target distance, moves remaining, connectivity, and blocker urgency. Keep candidate generation fixed. Deliver training provenance, a frozen model, inference cost, and an unseen-game comparison.

### CR-07 — Search interacting policy parameters

Implement Bayesian optimization or CMA-ES over the champion's supported parameter surface. Compare with the existing search using equal evaluation budgets. Deliver the search trace, frozen candidate, and fresh confirmation only if the candidate qualifies. Do not repeat RESULT-0058's consumed confirmation panel or silently revive falsified settings.

## Acceptance criteria

For each research item:

1. Use a fresh worktree and bounded Blackboard task, with a distinct named reviewer. Inspect current tasks and open PRs first; do not claim another agent's work.
2. Read current AGENTS.md, LEDGER-INDEX.md, relevant primary ledger records, CURRENT.md, and experiment instructions. Resolve stale source and seed/record reservations before measurement.
3. Commit a protocol before experimental collection. Separate training, selection, fresh admission, and final holdout seeds; freeze source/model identities and compute limits.
4. Compare reliability first and moves to target among mutual wins; report losses and compute cost. Preserve complete pairs before verdict and independently verify reported results.
5. Treat existing captured boards as development evidence if they influenced design. They cannot become an unseen confirmation set.
6. Persist replayable artifacts and honest closure, including falsified or inconclusive outcomes. Apply the failed-run process when required. Keep evidence standing separate from task completion.
7. A distinct reviewer checks the submitted work. Policy adoption remains an owner decision.

An item is done when its declared implementation or diagnostic deliverable and review are complete; a challenger need not win. Improvement claims require their own qualified evidence.

## Opportunistic execution contract

- This Markdown queue and Blackboard do not launch agents. A scheduler must supply an agent with repository access and executable compute. A scheduled chat task is a wake-up, not a guarantee of a compute environment.
- Select one ready, unclaimed item or resume this agent's existing item. Skip if another agent owns it, dependencies are unresolved, or access/compute is unavailable. Leave a precise blocker instead of claiming a run happened.
- Default each unattended session to at most 60 minutes of wall time, one experiment process, and CPU-only work on the supplied environment. Do not provision paid infrastructure, purchase API usage, or start GPU jobs under this queue.
- Reserve time for checkpointing and verification. Register any smaller per-game/candidate limits before measurement. No silent retry, expanded panel, or replacement seed after inspecting results.
- Save progress, commands, versions, partial artifacts, and a next action before the budget expires. Respect one-shot protocols: resume only when expressly permitted; otherwise close the run honestly.
- Use isolated challengers rather than edits to the shipped bot, engine, game, calibration, levels, or targets. Follow protected-source identities and repository PR/check requirements.
- Report which item ran, what changed, validation actually performed, elapsed cost, evidence standing, and remaining blockers. Never mark one's own work accepted or automatically promote a champion.
- A recurring wake-up may work from the branch containing this record while it is awaiting integration. It must use current main as its implementation baseline, carry this intent forward, and avoid competing edits to this queue branch.

## Current evidence

Read the ledger entries for RESULT-0045 (captured-puzzle oracle witnesses), RESULT-0049 (current target-aware champion), RESULT-0058 and CORRECTION-0018 (paired target-race ruler and audit). RESULT-0058 is provisional; scientific acceptance and policy adoption are separate decisions. No result is asserted by this planning record.

## Next action

Claim CR-01, inspect the current oracle and target-race ruler, and draft a bounded error-diagnosis protocol. After diagnosis is reviewed, update item states with a reason and append History before starting the selected method.

## History

- 2026-10-02: Owner requested that the seven discussed AI/advanced-search ideas be stored for opportunistic work, including overnight sessions. Captured the goals, dependencies, default work budget, stop rules, and evidence requirements. No research experiment was run.
