---
id: INV-001
run: 2026-09-22-plan-handoff-conflict-audit
status: complete
executor: orch-investigate
independence: checker
depends_on: []
write_scope:
  - .orch/tickets/2026-09-22-plan-handoff-conflict-audit/INV-001.md
excluded_actions:
  - edit product code, plans, backlog, ledger, or current-state documents
bound: one evidence packet; at most 12 material handoff risks; source policy limited to the named plan, EVIDENCE_LEDGER.md, CURRENT.md, and primary repository sources directly cited by those files
claimed_by: /root
claimed_at: 2026-09-22T00:00:00-05:00
---

## Objective

Determine whether a fresh agent, given only `docs/plans/2026-09-16-2225-feat-level-map-elites-authoring-plan.md`, can recover the actual task and complete it without material divergence; identify the most likely continuity failures and the smallest document clarification that would prevent each.

## Fixed inputs

- `docs/plans/2026-09-16-2225-feat-level-map-elites-authoring-plan.md` at Git `HEAD` `2475ec5747e58d314ba942bceb0fde15ddb17fd4`
- `EVIDENCE_LEDGER.md` at the same `HEAD`
- `CURRENT.md` at the same `HEAD`
- Repository primary sources directly cited by those documents, only when needed to test a finding

## Completion test

1. Reconstruct the plan's observable end state, unit graph, and stop conditions. Oracle: exact section and line citations from the fixed plan, checked with `rg -n`; oracle class: evidence; provenance: pre-existing.
2. Evaluate separately: misunderstood outcome, missing context, and wrong execution direction. For every retained finding, cite supporting evidence, counterevidence, what would rule the hypothesis out, the completion impact, and a minimal clarification. Oracle: the cited passage must show the claimed ambiguity or omission and the counterevidence must be reported rather than blended away; oracle class: evidence; provenance: pre-existing.
3. Distinguish document defects from facts intentionally delegated to preregistered discovery or implementation. Oracle: compare each alleged gap against the plan's requirements, dependencies, implementation units, verification contract, and definition of done; oracle class: evidence; provenance: pre-existing.
4. Report contradictions, dead ends, and what the bound leaves uncovered. Oracle: required return fields of `orch-investigate`; oracle class: deterministic; provenance: pre-existing.

## Return fields

- status
- result identity
- verification verdict against each completion criterion
- cited findings with confidence
- contradictions
- dead ends
- gaps

## Result

**Status:** complete

**Result identity:** this ticket, evaluating plan blob `4e5dfe19a4a9c2fc0557db04cf95f7b6b4c557b4` on main `2475ec5747e58d314ba942bceb0fde15ddb17fd4`, with repository-state probes of oracle tip `c88668d1499a449b2638153231a435649594bca4` and adjacent execution tip `e7ac53746db7ca98b5f9335ef59e5345377f290a`.

### Reconstructed task

The plan is not one atomic coding task. It is a gated seven-unit program with the execution order `U1 -> U4 -> U2 -> U3 -> U5 -> U6 -> U7`. Its full-success end state is a verified level-design archive over successful-plan breadth and harvesting advantage, with replayable evidence, convergence evidence, explicit empty-cell states, and at least three distant candidates ready for identity-bound human play (`plan:15-19, 27, 64-77, 210-339, 359-369`). Its early-stop path ends after pre-discovery or qualification when an axis lacks range, stability, independence, or affordable measurement (`plan:18, 47-51, 72-73, 120-135, 186, 286`).

### Hypothesis 1 — a fresh agent will misunderstand the intended outcome

**Disposition:** mostly contradicted by the document itself; low residual risk.

- **Evidence for the risk:** the plan sits beside an existing policy MAP-Elites system and repeatedly uses board, policy, level, archive, and descriptor vocabulary. An adjacent remote execution is actually named `feat/board-map-elites-20260917`, so the naming collision is real rather than hypothetical.
- **Evidence against it:** the plan explicitly says the subject is authored level designs across seed panels, not one initial deal (`plan:27, 39-43, 103-106`); keeps the level archive separate from policy MAP-Elites (`plan:31, 83, 103`); and expressly rejects exact seeded boards as the primary archive subject (`plan:190-194`). It also excludes shipping levels, changing rules, and claiming empty cells unreachable (`plan:86-95`).
- **What would rule it out:** a fresh-agent restatement that names (a) the archive subject as a level design aggregated over a seed panel, (b) the two axes, (c) difficulty as metadata rather than an axis, and (d) human play as judgment rather than machine proof.
- **Completion impact if it occurs:** the agent could modify the policy archive, map individual deals, or treat occupancy as evidence of level-family diversity; each would build a coherent but wrong artifact.
- **Minimal clarification:** add a three-line “subject/non-subject” block at the top: `subject = level design across seeds`; `not subject = policy or single seeded board`; `deliverable = authoring instrument, not shipped content`.

### Hypothesis 2 — a fresh agent lacks necessary context

**Disposition:** supported; high confidence; this is the primary handoff failure.

- **Evidence:** the plan gives no execution-status or resume section. On current main, none of `solver/level-map/` or the named `solver/oracle/*` files exists. The plan only says the implementation branch “must include” oracle commit `c88668d` (`plan:173-178`), but that commit is not an ancestor of main. A speculative merge is not safe: `git merge-tree` reports both sides changed `CURRENT.md`, `EVIDENCE_LEDGER.md`, and the `experiments/RESULT-0040/` and `RESULT-0041/` trees.
- **Evidence:** the identity conflict is semantic, not merely textual. At oracle commit `c88668d`, `RESULT-0041` is “Evolved harvesting policy transfers broadly...” and records the two per-puzzle regressions the plan cites. On current main, `RESULT-0041` is “Hardened greed harness...” (`EVIDENCE_LEDGER.md:839-852`). The same stable result ID denotes different experiments.
- **Evidence:** U3 names `RESULT-0042` (`plan:273-275`) and U7 names `RESULT-0043` (`plan:329-330`), while current main already assigns those IDs to accepted greed-validation lineage (`EVIDENCE_LEDGER.md:854-880`; `CURRENT.md:15-21`). The fallback “reserve the next result ID” prevents blindly reusing those two IDs, but does not resolve the colliding prerequisite lineage or say which IDs/branch now own this plan.
- **Evidence:** a remote branch descending from the oracle work already contains a substantial adjacent execution through `RESULT-0046` and a closed board-MAP report, but the plan provides no branch identity, completed-unit matrix, or adjudication of whether that work satisfies, supersedes, or diverges from U1-U7.
- **What would rule it out:** a resume block naming the exact base and implementation branch, the accepted mapping for colliding result IDs, the completed/remaining unit matrix, and a conflict-free integration procedure verified by a clean merge simulation.
- **Completion impact:** a fresh agent cannot safely choose between starting over, merging the oracle branch, porting code without its evidence lineage, or resuming the adjacent board-map branch. Any guess risks duplicate work, evidence overwrite, or an unmergeable experiment history.
- **Minimal clarification:** add a mandatory “Execution state / identity reconciliation” section before U1. Until it exists, this is not an executable fresh-agent handoff.

### Hypothesis 3 — a fresh agent will take the work in the wrong direction

**Disposition:** supported; high confidence for evidence-lineage direction, medium confidence for stop-path behavior.

- **Evidence:** KTD10 and U1 tell the agent to adopt the `RESULT-0041` harvesting subject while preserving its `UNVERIFIED` standing and two regressions (`plan:112, 214-228, 361, 382`). On current main those instructions resolve to a different greed experiment. Literal execution from the current checkout therefore points at the wrong subject and wrong evidence standing.
- **Evidence:** the early-stop contract is clear in the pipeline (`plan:18, 122-135, 186, 286`), but the Definition of Done mixes two terminal states. It says unsupported descriptors may stop execution (`plan:364`) and then unconditionally requires the genome, archive, search, final members, saturation report, and three human-play regions (`plan:365-369`). A fresh agent can reasonably infer either “stop is valid completion” or “continue until the later bullets pass.”
- **Counterevidence:** the unit dependencies themselves are coherent after the recorded U3/U4 cycle fix: U1 -> U4 -> U2 -> U3, and only `SUPPORTED` unlocks U5-U7 (`plan:212-286`). Pre-discovery's choice of panel sizes, bounds, and bins is intentional delegated discovery, not missing specification (`plan:105-111, 249-275`).
- **What would rule it out:** (a) unique, current identities for the harvesting subject and experiment slots; and (b) two explicit terminal acceptance envelopes: `STOPPED_VALIDLY` for a failed gate, and `FULL_SUCCESS` for U5-U7 plus human handoff.
- **Completion impact:** the agent may adopt the wrong experiment, overwrite stable evidence, force an archive after a failed descriptor gate, or keep working past a valid stop because the later DoD bullets remain unsatisfied.
- **Minimal clarification:** identity-bind every cross-branch evidence reference by commit plus non-colliding local ID, and split Definition of Done by terminal path.

### Contradictions

1. `RESULT-0041` denotes the harvesting experiment on the prerequisite branch and a greed-validation experiment on current main.
2. The plan permits valid early termination but its final DoD does not define a self-contained completion state for that path.
3. The plan's named experiment destinations `RESULT-0042` and `RESULT-0043` were already occupied when the plan was committed; fallback prose mitigates allocation but leaves no frozen replacement identities.

### Dead ends

- Checking only current-main paths showed that the named implementation files were absent, but did not establish whether work existed elsewhere; remote-branch history was required.
- The adjacent branch's `RESULT-0046` report proves a substantial map exists, but does not by itself prove conformance to every U1-U7 requirement or settle whether it is the intended continuation.

### Gaps left by the bound

- The owner's desired reconciliation of main's greed `RESULT-0040`–`0043` lineage with the oracle branch's conflicting `RESULT-0040`–`0041` lineage is not recorded in the bounded sources.
- This audit did not review every implementation detail on the adjacent branch against every U1-U7 test scenario; it establishes that the handoff lacks the state needed to decide whether such review, repair, or replacement is next.
- No product code, plan, ledger, backlog, or branch was changed.

## Verification

1. **PASS (evidence):** the observable end state, unit graph, and stop conditions are reconstructed with exact plan-line citations.
2. **PASS (evidence):** all three requested failure hypotheses carry support, counterevidence, a falsifier/rule-out condition, completion impact, and minimal clarification.
3. **PASS (evidence):** intentionally deferred discovery choices are separated from the actual missing execution state and identity conflicts.
4. **PASS (deterministic):** contradictions, dead ends, and bounded gaps are recorded.

## Feedback

[]

## Risks

[]
