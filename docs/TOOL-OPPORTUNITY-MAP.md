# 2248 Tool Opportunity Map

## Executive answer: build the evidence spine before the autonomous arena

2248 does not need another optimizer first. It needs a reliable way to know which subject was tested, which evidence still applies, what a gate actually established, and whether an admitted result became a production decision. The repository already contains strong pieces—frozen evaluators, paired holdouts, replayable receipts, challenged controls, append-only corrections, and owner-only promotion—but the joins among them remain partly manual.

That gap supports a family of buildable assurance tools. The coherent long-term vision is an **Assured Workflow Foundry**: you describe the workflow you need, and the system returns an executable workflow with frozen success criteria, adversarial checks, failure receipts, protected behaviors, and promotion rules. This is the other side of the earlier counterexample framework: it creates the operating workflow and the machinery that can later prove where it fails.

The Foundry is a product direction, not the first build. The evidence supports a narrower starting point: an **Evidence Control Plane**, followed by a **Qualified Experiment Builder**. Together they address the failures 2248 has actually experienced and establish the substrate the more ambitious products require.

## How this relates to the earlier counterexample framework

| Layer | What it does | Evidence standing |
| --- | --- | --- |
| **Current 2248 practice** | Runs domain-specific workflows for level authoring, replay, solver research, experiments, evidence admission, and shipping. | Strong local controls; incomplete enforcement across workflow boundaries. [Repo W1–W8] |
| **Earlier Arena** | Runs Breaker → Refiner → Independent Verifier against a frozen oracle, withheld cases, and protected behavior. | A demonstrated operating model from the earlier project; not the live repository’s current end-to-end loop. |
| **Proposed product layer** | Builds and operates trustworthy workflows by binding identities, tests, receipts, evidence, decisions, and regressions. | A synthesis justified by observed 2248 failures; repeated autonomous co-evolution remains conditional. [Framework C1–C7] |

The common principle is not “use three agents.” It is **separate proposal from proof**. The Breaker produces a concrete failure, the Refiner proposes a generalized change, and an independent Verifier decides whether the change survives withheld cases without damaging protected behavior. The proposed tools make those boundaries usable throughout a real workflow: before an experiment, while diagnosing a failure, when admitting evidence, and before promotion.

2248’s negative results show why this matters. A self-comparison passed until an outcome-sensitive control exposed it. A topology experiment used a positive control that measured identity rather than gameplay; the repair required a fresh protocol and seeds. A handmade policy saved moves on average but lost six reference wins, so the valid result was `FALSIFIED`. These are valuable outcomes because the machinery rejected attractive but unsupported conclusions. [Evidence traces A–C; `RESULT-0020`, `RESULT-0023/0024`, `RESULT-0026`]

## The opportunity portfolio

### 1. Evidence Dependency Graph

**User/job.** An evidence steward asks, “What can I still rely on after this source changed?” Today this requires reconstructing links among source hashes, instruments, artifacts, ledger standing, decisions, and generated views. The project has stale receipts, verified-but-unadmitted artifacts, and historical results whose applicability changed with the subject. [Repo W6–W7; Framework C1]

**Tool and MVP.** A read-only CLI ingests protocol freezes, artifact identities, ledger citations, candidate receipts, decisions, and generated views. It represents their dependencies and propagates `current`, `historical`, `stale`, `verified-unadmitted`, and `needs-review` without rewriting history. The MVP explains one claim’s dependency path and previews the impact of one source change.

**Value test.** Replay known stale-receipt, broken-citation, artifact-identity, generated-view, and platform-path cases. Target zero false-fresh results (evidence incorrectly left current), under 10% false-stale results (unaffected evidence incorrectly invalidated), and 50% less impact-analysis time. Any missed known dependency falsifies the safety claim.

**End state.** Every claim can explain why it is current, historical, blocked, or awaiting admission.

### 2. Candidate Lifecycle Controller

**User/job.** An owner or release agent asks, “What exactly is this candidate, who authorized each transition, and what would invalidate it?” Current states—generated, screened, receipted, human-played, admitted, shipped, champion, stale, and rejected—are distributed. Level 53 shipped without a shipping ledger record, and same-number candidates can denote different subjects. [Repo W3, W8; Framework C5]

**Tool and MVP.** Typed state machines key level and policy candidates by immutable identity rather than label. Every transition names its required evidence and authority: generators propose, gates admit evidence, and only the owner ships or promotes. The MVP indexes current files, flags incomplete or illegal transitions, and gates one new level and one policy path. It never promotes autonomously.

**Value test.** Require the replay to flag every known ship/admission mismatch and wrong-subject receipt. Over ten new transitions, target zero production subjects without decision/evidence lineage and under five minutes for a reviewer to identify the active subject, predecessor, evidence, and authority.

**End state.** One immutable view follows a candidate from proposal through promotion or rollback without conflating evidence admission with owner choice.

### 3. Qualified Experiment Builder

**User/job.** An experiment author needs admissible evidence without rebuilding provenance and control plumbing for every question. `RESULT-0026` demonstrates the desired sequence: freeze the subject, qualify the verifier on a real case and broken twins, consume the qualification receipt, confirm once, independently recompute, and honestly admit `FALSIFIED`. [Evidence traces B–C; Framework C2]

**Tool and MVP.** A CLI/SDK accepts a domain adapter—subject loader, outcome projection, invariants, and intended assertion—and generates a protocol, a manifest of every source identity used, real-subject qualification, adversarial twins, a receipt-consumption hook, an independent recomputation boundary, and a report scaffold. The first version supports one paired 2248 experiment family and refuses confirmation unless each twin reaches and fails the named check.

**Value test.** Seed mutations for post-hoc protocols, self-comparisons, false-positive controls, wrong-subject receipts, and protected regressions. Require 100% rejection before reserved evaluation and target 40% less setup effort. One escaped mutation disproves the safety threshold.

**End state.** `SUPPORTED`, `FALSIFIED`, and `INCONCLUSIVE` are all successful infrastructure outcomes when the evidence is qualified.

### 4. Benchmark Forge

**User/job.** A policy or level researcher needs an instrument that can answer the intended question before spending compute. Shipped-level win rate is ceiling-saturated; unmatched seeds measure the seed; and target-stopping versus play-for-score can reverse a comparison’s meaning. [Repo W4–W5; Framework C3]

**Tool and MVP.** A machine-readable objective contract specifies population, paired seed/board identity, stopping rule, primary response, protected outcomes, loss rule, and budget. Preflight rejects unmatched seeds and cross-objective arms, reports ceiling mass, and produces paired uncertainty. The MVP wraps existing 2248 benchmark seams; it does not choose “fun” or a universal fitness function.

**Value test.** Reject every known mismatch fixture, keep fewer than 10% of cases pinned at the metric’s maximum, reduce uncertainty versus an unpaired analysis, and distinguish at least one deliberately different policy. Failure to separate known behavior disconfirms the chosen benchmark.

**End state.** Every search begins with an executable quality scenario tying the objective, population, metric, and protections together.

### 5. Trace-to-Hypothesis Explorer

**User/job.** A policy investigator wants to compare a human, champion, and challenger on the same board and seed, find the first meaningful divergence, and turn it into a bounded hypothesis. Exact replays exposed larger human chains and the target-aware finishing rule; `board-trace.js` exists because value strings hide spatial behavior. [Repo W4–W5; Framework C4]

**Tool and MVP.** A spatial replay diff binds the recording, candidate, seed, objective, and source identities; marks the first divergent move; shows its board consequences; and exports a frozen challenger brief. It explains and freezes a hypothesis. It does not admit evidence or promote a policy.

**Value test.** Target 50% less time from receipted session to frozen hypothesis, require every export to replay and identify an identical-state divergence, and test whether at least 25% survive disjoint holdout without protected regression. Compare survival with equal-budget blind proposals.

**End state.** Human play becomes disciplined counterexample discovery rather than anecdote or pseudo-population evidence.

### 6. Counterexample Lab

**User/job.** An experiment engineer needs to challenge one frozen refinement against the intended predicate, fresh evidence, and protected cases. The project’s false-positive control, repaired inconclusive run, and regression-driven falsification show why a green process is insufficient. [Evidence `RESULT-0023/0024/0026`; Framework C2, C6]

**Tool and MVP.** Starting with one 2248 adapter, the Lab freezes the protocol and source closure, qualifies the named predicate on real and broken cases, generates legal failure families, reduces a witness only while the same predicate remains failing, runs a reserved paired holdout, independently recomputes the verdict, and emits an admission receipt. It retains the original witness beside any reduced form.

**Value test.** Require every broken twin to fail at its intended assertion and every artifact to replay from a clean checkout. Separately, target a 30% reduction on half of a historical failure benchmark while preserving the same failure check. A false pass, wrong failure, or changed check disconfirms the mechanism.

**End state.** Confirmed failures enter a protected corpus in both provenance-complete and minimal diagnostic forms. The Lab supplies Breaker and Verifier mechanics around a separately owned Refiner.

### 7. Continuous Assurance Gate

**User/job.** A maintainer needs to know which qualified checks a change affects and whether the resulting evidence is complete enough for a promotion decision. 2248 has CI and protocol gates, yet receipts can stale, review ordering has failed, and the current Windows verifier misreports nonempty committed protocols because Git object paths are built with platform separators. That is a concrete local defect, not evidence that the protocols are absent. [Repo W6–W8; Evidence control-plane contradiction; Framework C7]

**Tool and MVP.** Consume dependency and lifecycle state, select only affected checks, enforce review/gate order, and emit a promotion packet containing subject identity, verdicts, protected outcomes, warnings, predecessor, and rollback. Start as a dry-run over a mutation corpus with a cross-platform Git-path self-test. The owner still approves promotion.

**Value test.** Require every known affected gate to be selected, no protected regression to escape, and unaffected expensive experiments to remain unrun. Disconfirm it if one affected gate is missed or most changes trigger nearly every check.

**End state.** Assurance becomes incremental and identity-aware without turning evidence machinery into an autonomous governor.

## How the products fit together

The seven ideas should not become seven unrelated applications. They share a substrate: typed identities, evidence dependencies, lifecycle states, qualified predicates, receipts, protected cases, and explicit promotion authority.

| Product role | Opportunities |
| --- | --- |
| **Shared control-plane components** | Evidence Dependency Graph; Candidate Lifecycle Controller |
| **Strong standalone wedges** | Qualified Experiment Builder; Counterexample Lab; Continuous Assurance Gate |
| **Focused modules that may later stand alone** | Benchmark Forge; Trace-to-Hypothesis Explorer |
| **Umbrella product direction** | Assured Workflow Foundry |

The Foundry’s user promise would be: **“Describe the workflow you need; receive the workflow, its executable checks, the failure receipts proving its limits, and the evidence required to promote changes safely.”** It becomes credible only after the narrower components work on real cases.

## Recommended build sequence

1. **Prototype the Evidence Control Plane.** Reconstruct five historical 2248 decisions and test whether unfamiliar reviewers identify the correct subject, standing, authority, and stale dependents faster and more accurately.
2. **Prototype and validate the Qualified Experiment Builder as the first complete wedge.** It has the strongest existing exemplar and can be attacked with known mutations. If the graph prototype adds little value, this can stand alone.
3. **Add Counterexample Lab and its Explorer module.** Do this only after predicate qualification is trustworthy; otherwise reduction and generation will make the wrong checks faster.
4. **Add Continuous Assurance.** First prove dependency recall on a mutation corpus, then use it to select affected checks and assemble promotion packets.
5. **Generalize into the Workflow Foundry.** Begin with templates for experiment, candidate-promotion, and change-assurance workflows. Add bounded repeated Breaker–Refiner–Verifier campaigns only after live runs show adapting challengers, rejected overfit refinements, protected-corpus growth, and preserved earlier capabilities.

## Anti-patterns and non-opportunities

- **Dashboard before trustworthy joins:** a polished stale view is still stale.
- **Automatic receipt refresh:** source drift should invalidate or supersede evidence, not rewrite which subject was tested.
- **Universal adapter:** provenance can be reusable; correctness, fairness, fun, and shipping authority remain domain-specific.
- **Autonomous promotion:** admission, empirical verdict, and owner adoption are different transitions.
- **Generic co-evolution branding:** MAP-Elites explores a fixed policy space; it is not evidence of an adapting adversary.
- **More seeds by default:** an uninformative contrast needs a better question or instrument, not automatically more compute.
- **Another optimizer over shipped win rate:** the metric is saturated and cannot rank the policies of interest.

## Decision and proof plan

The most elegant solution is not one giant platform or one isolated tool. It is a **small common evidence spine plus one end-to-end product wedge**.

Run three product experiments before committing to the suite:

1. Compare historical decision reconstruction with and without the control plane: time, lineage accuracy, false-fresh, and false-stale.
2. Generate legitimate and deliberately broken experiment kits: require the legitimate kit to run and every broken twin to fail before holdout.
3. Convert a receipted human trace into a frozen hypothesis: measure time, reproducibility, and holdout survival against blind proposals.

Advance only when the prerequisite creates decision value. If the graph does not improve reconstruction, build the experiment tool alone. If generated kits miss known mutations, do not add automation. If trace-derived hypotheses do not outperform blind proposals, keep the viewer diagnostic. This preserves the best lesson from the counterexample framework: a trustworthy “do not proceed” is itself a valuable deliverable.

## Evidence key

- **Repo lane:** `work/2248-workflow-tool-map/lane-repo/findings.md`, workflows W1–W9.
- **Evidence lane:** `work/2248-workflow-tool-map/lane-evidence/findings.md`, representative traces and current verifier contradiction.
- **Framework lane:** `work/2248-workflow-tool-map/lane-framework/findings.md`, mappings C1–C7, value hypotheses, rejected analogies, and future states.
- **Observed repository identity:** `C:\OOO\Map-Elites-2248` at commit `9d125e8c94f41282388a90402b1fba0b22ae83a8` on 2026-09-19.

All performance and value numbers in this document are hypotheses or validation thresholds, not achieved gains or forecasts.
