# Independent code gate at f407d9c

Reviewer: /root/measurement_review_gpt_5_6_sol_ultra; orch-critique, fresh context,
read-only. Fixed artifact f407d9c8e85eb407fea3cb2483c1720e7d7daaec, base
e0ed5a15f982b6584428de031f778ceb008c1d19. Returned changed_artifacts=[].

## Returned findings

1. HIGH, F1: playBot returns validity=unresolved for a runtime fault, but collect
   admits the row and groupCases discards validity. A controlled collect run with
   a faulting pinned bot module produced unresolved=[] and
   BETTER_ON_THIS_SET_BY_WINS (converted wins 8.6667 and 3); faulted diagnostic
   scores were aggregated. Violates C3-C5, contract sections 3-6/E15.
   Sources: human-benchmark.js playBot (line 68), groupCases (232), collect (309).
2. MEDIUM, F2: receiptIdentityValid returns true when both receiptIdentity and
   artifactIdentity are absent. A filesystem control supplying exact candidate
   content plus only {candidateIdentity} was admitted by buildCandidateIndex with
   receiptIdentity=null and no invalid disposition. Violates C1/C5 missing or
   forged receipt binding. Source: benchmark-inputs.js line 114.
3. MEDIUM, F3: one unavailable frozen recording yields primary UNRESOLVED but
   text prints unqualified subset win rates and percent coverage 11/11 despite
   12 required files. summarizeScores derives its denominator from admitted rows;
   renderText omits the resolved-subset label. Violates C1/C4/C5, sections 4/6/E08.
   Sources: human-benchmark.js lines 189 and 379.
4. MEDIUM, F4: neither output reports N/n; compareCases only exposes convertedWins.
   Default text omits faster/slower/tied distribution and candidate identity,
   despite those being in JSON. Violates C4/C5 and contract section 5.
   Sources: benchmark-metrics.js line 80; human-benchmark.js line 377.
5. MEDIUM, F5: HARD cards overstate public-path negative coverage. E15 stops at
   playBot, E08 uses a hand-built compareCases flag, extras test only discovery,
   and the frozen-package bad twin tests a recording with verifyPinnedFile rather
   than corrupted package bytes via loadFrozenInputs. All focused tests pass
   33/33 while F1/F3 reproduce through collect. C7 is unmet.

## Coverage and limits returned

C1 FAIL, C3-C5 FAIL, C7 FAIL. No C2 replay-source defect found after source
inspection; negative-seam coverage still overstated. C6: reviewer focused suite
33/33 and diff check clean; root separately recorded 373/377, same four failure
identities, experiment gate PASS.

Inspected complete diff and surrounding files, frozen contract/input hashes,
engine/game/bot transition sources, both focused test files, all five cards,
both CLI modes, root arithmetic/check artifacts, and runtime controls for missing
input, reference fault, and unsigned receipt.

The actual frozen baseline has zero unresolved rows and its arithmetic matches.
F1-F3 are failure-path defects, not evidence that the current raw arithmetic is
wrong.

Pilot provenance uncertainty: HUMAN-PILOT-0001's batch receipt 59e9c3... is named
by its pilot candidate wrapper as sourceReceiptIdentity. The earlier preliminary
wrong-receipt claim is withdrawn as a finding. Whether to additionally retain
wrapper/execution linkage is an uncertainty, not authorized repair work.

## Root integration and adjudication

Integrated once, 2026-09-05 local date. All five evidenced findings accepted.
F1/F3/F5 share failure-propagation and downstream-observation cause; repair
coherently without changing the frozen contract. F2 and F4 are independent
binding/reporting omissions. No cross-lens inconsistency (one stamped lens).
One correction pass is authorized by REPAIR-001, followed by one affected-criteria
orch-verify. Do not begin the content successor or accept Step 2 yet.
