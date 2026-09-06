---
id: GATE-001
run: 2026-09-06-policy-trajectory-instrument
status: complete
executor: orch-critique
pack: orch-code-pack
profile: orch-planner
independence: gate
depends_on: [BUILD-001]
write_scope: [canonical ROOT GATE-001 Result/Verification/Feedback/Risks only]
bound: 10 minutes
claimed_by: /root/trajectory_gate_gpt_5_6_sol_ultra
claimed_at: 2026-09-06T08:26:00Z
---

## Objective

One fresh independent A6 qualification of the fixed trajectory instrument;
review A1-A5 from the frozen spec, not producer verdicts. Read-only target.

## Fixed inputs

Target /private/tmp/2248-trajectory-instrument.dX4Rcr at
0c6b250ce300c76797308ea295ee2e6f48832ae0, basec8ad993. Root integration7a06ab5
carries identical three target blobs. Frozen spec:
.orch/runs/2026-09-06-policy-trajectory-instrument/spec.md (root or target).
Standards: AGENTS.md and spec pointers. Craft, lens and oracles:
/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/{craft,lens,oracles}.md.
Follow orch-critique, gate-check, and applicable verification rules. No
re-delegation. Read every changed file and relevant surrounding source.

## Completion test

Independently render A1-A6 PASS/FAIL/UNVERIFIED, covers and oracle class from
the complete spec. Challenge replay admission, exhaustive search semantics,
production-choice/offered-pool attribution, requested-position denominators,
time/node/fault behavior and explicit blind spots. Actually run good and crafted
bad artifact controls through the public consumer, plus independent adversarial
checks of the most consequential seams; do not rely only on authored assertions.
Temporary synthetic artifacts outside the target may be created for diagnostics;
never mutate target sources or sample new audit cases. Retain commands and
observed outputs in this ticket. Scope exactly the three changed files.

Known regression oracle is reusable from BUILD-001 at the same target:
focused42/42, full388/392 with the four known failures; do not rerun the full
suite. A fresh focused run is allowed to inspect authored behavioral coverage,
but A6 requires independent controls/source judgment. Evaluate gate-check's nine
questions and give its rung/verdict. No code corrections by this reviewer.

## Return fields

Fixed identities; per-criterion verdict, class, evidence and coverage; concrete
findings with reproduction, impact, location and minimal in-scope correction;
unchanged coverage and unrun limits; changed_artifacts (ticket only). Explicit
lease release before return. Root owns terminal status and adjudication.

## Result

**Qualification: FAIL. Gate-check: REVISE, required rung `none`.** The fixed
target `0c6b250ce300c76797308ea295ee2e6f48832ae0` does not satisfy A1-A6. A5
passes, but independent public-seam controls expose one vacuous admission, one
uncaught fault, and one false missed-win attribution. No audit population or
policy conclusion is entitled.

Fixed identities:

- target `/private/tmp/2248-trajectory-instrument.dX4Rcr` HEAD
  `0c6b250ce300c76797308ea295ee2e6f48832ae0`; base
  `c8ad993ee1db21c11b4f7de90b04a0b3d7eb6976`;
- `solver/trajectory-audit.js`: SHA-256
  `31cfe6dbef7478b741a25211720245d7d66a3fd8c764beb3e161e6df371f9714`,
  git blob `18fc57cc0065890b643abd6a6f1ec15b40aef5f7`;
- `solver/tests/trajectoryAudit.test.js`: SHA-256
  `9cba49da6bb7c69b4e28f10c2d30463222da53a7420c9bdfc07ab278a8122823`,
  git blob `4920f5cbdb6bc243d4ec20ee13c7c7d750e702d7`;
- `docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md`: SHA-256
  `b9fd439f64e93674e8d82bd03dc0a8c3089bd14e98f3bb81997427bdb45c62c3`,
  git blob `ab24f58dbd0f8af14cbaf94898307d4a49c7824e`.

All three blob identities equal root integration `7a06ab5`; target status was
clean. Per-criterion qualification:

| Criterion | Verdict | Oracle class / provenance | Independent evidence and coverage |
| --- | --- | --- | --- |
| A1 artifact replay | **FAIL** | deterministic / predeclared plus independent negative | Good schema-2 `recordSession` file verified and a self-rehashed score mutation returned `UNRESOLVED`. However, a legitimate producer-created schema-2 artifact for a constructed 1x1/no-legal subject (seed 0) has zero moves and outcome `no valid moves`; `verifySessionArtifact` returned `VERIFIED` and the public consumer returned `COMPLETE`, `positionsRequested: 0`. This is not the authored corrupted-empty mutation: `recordSession` itself generated the terminal empty artifact. It contradicts A1's non-vacuity requirement and the card's claim that an empty trace is unresolved. |
| A2 immediate-win search | **FAIL** | deterministic / predeclared plus independent fault injection | Authored exhaustive/collision/bomb/no-win/node/time controls pass, and source traversal does not use the objective-filtered pool for absence. But an injected `searchNow` throwing `injected clock fault` escapes `auditSessionArtifact`; no `UNKNOWN` is returned. Fault-to-UNKNOWN is binding A2 behavior. |
| A3 consumer/attribution | **FAIL** | deterministic / predeclared plus independent end-to-end counterexample and source trace | For constructed subject 9001 (2x2, target 4, one move), seed 0, a real verified `recordSession` ends `win`, score 12. Production selected winning action `1,1;0,0\|0,1\|1,0`; exhaustive search stopped at a different winning witness `1,0;0,0`; the public consumer nevertheless emitted `attribution: generation`. Thus it reports a generation miss when production already took an immediate win. `classifyAttribution` compares only witness identity, never the selected action's replayed outcome. Offered-pool trace is also incomplete across overrides: target analysis exposes the base pool plus only the selected target override, while bomb analysis exposes one `findBestChain` winner even though `findTopChains` ranked the bomb-ending pool. Those traces cannot soundly distinguish ranking from control-flow for nonselected alternatives. |
| A4 limits/denominators | **FAIL** | deterministic / predeclared plus independent fault injection | Complete, capped, and corrupted-artifact authored fixtures retain denominators. The clock-fault path throws, so requested positions receive neither `UNKNOWN` nor denominators; the admitted zero-position session also permits a vacuous `COMPLETE` denominator. No population/promotion field was observed. |
| A5 preservation/checks | **PASS** | deterministic / pre-existing | Exact diff contains only the three allowed paths; protected-source diff is empty; fresh focused suite 42/42, experiment gate PASS, and `git diff --check c8ad993..HEAD` PASS. Root/target blobs match. Reused full-suite oracle is 388/392 with exactly the recorded four failures: receipt calibration-stamp mismatches for `candidate-levels-52.json` and `candidate-levels-54.json`, Universe Map generated-view staleness, and Universe Map date drift. It was not rerun by this gate per ticket. |
| A6 independent qualification | **FAIL** | judged / fresh independent gate | Complete A1-A5 source/test/card review plus good/bad public artifact controls and adversarial attribution/fault/non-vacuity controls were performed. Findings above prevent qualification. |

Gate-check nine-question result:

1. **Granularity:** whole session/every recorded transition; per verified
   position, legal path states until first witness/cap. It slips between a found
   witness and a different production-selected winning action.
2. **Shape/value/meaning:** checks value/transition truth under the pinned code,
   not historical runtime authenticity or independent game-model correctness;
   those exclusions are declared.
3. **Garbage test:** **FAIL**. Corrupt score is rejected, but a legitimate
   zero-move producer artifact is admitted, and a search clock fault throws.
4. **Scope inventory:** schema-2 bot session, explicit subject, uint32 seed,
   default params/code identities; legal king-adjacent equal-or-double actions,
   cloned transition and node/time bounds. Human/wrapper/other-schema and
   multi-move/population claims are excluded. Override attribution pools are
   narrower than the card implies.
5. **Supply chain:** artifact fields are producer output, while initialization,
   chooser, refills and transitions are regenerated; engine/chooser and live
   local hashes remain declared shared trust boundaries.
6. **Sampling memory:** n/a; silence means never requested. No audit sample ran.
7. **Enforcement rung:** implemented as report-only, contingent on A6. A6 fails,
   so required rung is `none`.
8. **Decay:** focused tests are the stated owner, but they omit the exact three
   failing controls, so current decay coverage is insufficient.
9. **Retire-one:** NO; the card argues this is a new public consumer seam rather
   than a replacement. That rationale does not overcome the failed garbage test.

Check-card path:
`docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md`. Required permanent
negative-test path is planned in `solver/tests/trajectoryAudit.test.js` but the
three exact counterexamples are unimplemented; this read-only reviewer made no
correction.

## Verification

Commands and observed outcomes at the fixed target:

```text
git rev-parse HEAD
0c6b250ce300c76797308ea295ee2e6f48832ae0

git diff --name-only c8ad993..HEAD
docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md
solver/tests/trajectoryAudit.test.js
solver/trajectory-audit.js

node --test solver/tests/trajectoryAudit.test.js solver/tests/botVision.test.js solver/tests/policyBenchmark.test.js
tests 42; pass 42; fail 0

node tools/verify-experiments.js
EXPERIMENT GATE PASS

git diff --check c8ad993..HEAD
(no output; exit 0)

independent good/multi-winner plus self-rehashed score-bad public control
good: COMPLETE; recorded outcome win/1 move/finalScore 12;
production=1,1;0,0|0,1|1,0; witness=1,0;0,0; attribution=generation
bad: UNRESOLVED; positions=0; reason="move 0 scoreAfter mismatch";
sessionsRequested=1; sessionsVerified=0; unresolvedSessions=1

independent legitimate zero-move producer artifact through public consumer
recordSession moves=0; outcome=no valid moves; verify=VERIFIED;
audit=COMPLETE; sessionsVerified=1; positionsRequested=0; positionsReported=0

independent search fault through public consumer
searchNow => throw Error("injected clock fault")
returned=false; threw="injected clock fault"
```

Changed artifacts: this canonical ROOT ticket only. The frozen target and its
tests/card were never modified.

## Feedback

Root join08:34:20Z: matching claimant released lease within bound; only ticket
changed. Gate execution accepted, empirical qualification FAIL (not delivery
acceptance). Validate the three causes below as the single combined repair set.
For ambiguous override pools, report unresolved rather than change protected
chooser source. Exact retained controls: /private/tmp/gate001-probe.js;
/private/tmp/gate001-good-9001-0.json; /private/tmp/gate001-bad-score.json;
/private/tmp/gate001-empty.json; /private/tmp/gate001-clock-good.json.
The 2x2 subject is {level:9001,target:4,tileScale:1,moves:1,minChain:2,
gridW:2,gridH:2,blockers:[]}; the 1x1 subject is {level:9999,target:100,
tileScale:1,moves:3,minChain:2,gridW:1,gridH:1,blockers:[]}; seed0 for both.

1. **P0 — A3 false missed-win attribution.** Reproduction: audit the real
   subject-9001/seed-0 artifact described above. Impact: the Step 3 instrument
   can manufacture a generation/ranking/control-flow diagnosis even when the
   production choice wins immediately, corrupting the question it exists to
   answer. Location: `solver/trajectory-audit.js`, `classifyAttribution` and
   `auditSessionArtifact` production trace assembly (around lines 318-381).
   Minimal in-scope correction: replay/classify the production-selected action
   from the same state/RNG first; do not emit a miss cause when it is itself an
   immediate win, and expose enough stage-specific candidate trace to justify
   any remaining cause.
2. **P1 — A2/A4 search faults escape instead of becoming `UNKNOWN`.**
   Reproduction: pass a throwing `searchNow` through the good artifact public
   consumer. Impact: one instrumentation fault aborts the consumer and loses
   every requested disposition/denominator. Location:
   `solver/trajectory-audit.js#searchImmediateWin`, initial/final `now()` calls
   outside its catch (around lines 233-245 and 292). Minimal correction: contain
   clock/search faults at the search seam and return the declared fault-shaped
   `UNKNOWN`, retaining telemetry and denominators.
3. **P1 — A1/card non-vacuity control is a false assurance.** Reproduction:
   `recordSession` the constructed 1x1/no-legal subject at seed 0 and feed that
   untouched artifact to the public consumer. Impact: a zero-position artifact
   is admitted as a completed audit despite A1's explicit prohibition, while
   the card says this case fails. Location: `verifySessionArtifact`, array-only
   moves check and post-loop terminal derivation (around lines 105 and 159-190),
   plus card line 19. Minimal correction: enforce the frozen nonempty-session
   invariant at admission and add this legitimate producer-generated control;
   keep it distinct from truncating a normally nonempty trace.

## Risks

Unchanged coverage: exhaustive absence is source-reviewed and covered on small
boards, but shared engine/game correctness remains a trust boundary; no
multi-move opportunity, corpus/population, performance allowance, or policy
benefit was evaluated. No fresh audit sample ran. The full suite was not rerun;
its fixed 388/392 BUILD-001 result is reused. A bounded normal-ranking
multi-winner scan produced no result before its diagnostic timeout and was
terminated, so no normal-path claim is made; the deterministic target-override
counterexample and override source traces are the finding evidence. Bomb-pool
visibility was source-traced, not independently executed. Temporary diagnostic
JSON/scripts live only under `/private/tmp` and are not delivery artifacts.

Lease **RELEASED** by `/root/trajectory_gate_gpt_5_6_sol_ultra` at
`2026-09-06T08:33:45Z`; no further canonical-ticket or target writes are owned
by this reviewer. Root retains terminal status and adjudication.

## Affected verification request — approved restart

Fixed repairbbf5fdec2553717c23bece400531cd619cdb2486 in the same read-only
worktree; compare0c6b250..bbf5fde. Reuse unchanged gate coverage, and perform
one orch-verify on F1-F3 and their affected A1-A6 criteria, including corrected
card and permanent tests. Rerun your exact independent good/bad/empty/clock
controls, initial/final clock paths and ambiguous attribution. Do not repeat
unaffected/full-suite checks: fresh producer full391/395 retains four exact
known identities; focused45/45, experiment/diff PASS. Judge from frozen spec.
This is affected verification, not a second review/repair cycle. No code edits,
new findings repair, sampling or scope expansion. Append results below only.
Lease /root/trajectory_gate_gpt_5_6_sol_ultra,6minutes from08:45:40Z through
08:51:40Z; owner overall hardstop09:01:26Z. Root read-only during lease;
release explicitly and return PASS/FAIL/UNVERIFIED with exact coverage.

## Affected verification result

**Overall: FAIL (weakest oracle class: judged). Gate-check: REVISE, rung
`none`.** The repair closes F1 and F3 and the A2 disposition/denominator part of
F2, but F2 still fails A4 because an unknown clock-fault duration is published
as aggregate zero search time. This is one affected verification, not a second
gate; no new audit sample or repair was run.

Fixed covers:

- repaired read-only target
  `bbf5fdec2553717c23bece400531cd619cdb2486`, compared with failed subject
  `0c6b250ce300c76797308ea295ee2e6f48832ae0`; root integration
  `ee2bc2627e5856007f284209f3daa31eac58931e` carries the same three blobs;
- `solver/trajectory-audit.js`: SHA-256
  `9f0a0ce7f256aecef23cdcc149370e41a61cbfc7b61ea2fbbb14fba6214d7804`,
  blob `2b06f720e60822f6ccffec8c6bffc659629b8326`;
- `solver/tests/trajectoryAudit.test.js`: SHA-256
  `d721a71b3a08c224d8b43f1999f495bd131e08e0e2c5897063b827b13e149512`,
  blob `8d3564cbc8c253332c224c9dd074346a23e31318`;
- `docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md`: SHA-256
  `2c300f740395a274c6905e615e28363f9280dafb0a7c9dc3138b27ed2d55018b`,
  blob `798bbed7b76b7a6ed4aff2e8bccd2e0be28683e5`.

Finding/criterion map:

| Item | Verdict | Oracle / class | Exact affected evidence |
| --- | --- | --- | --- |
| F1 / A3 production-already-wins and ambiguous override attribution | **PASS** | retained `/private/tmp/gate001-probe.js` plus direct `classifyAttribution` controls / deterministic | Fresh subject 9001 seed 0 artifact returned `COMPLETE`; production action `1,1;0,0\|0,1\|1,0` replayed to target win/12 points while exhaustive witness remained `1,0;0,0`; attribution is now `production-choice`. A self-rehashed score-bad twin remained `UNRESOLVED`, zero positions. With `productionImmediateWin:false`, both `bomb-priority` and `immediate-target-win` returned `unresolved` even when the witness identity was supplied in the offered list; no unsupported cause was forced. |
| F2 / A2 fault disposition | **PASS** | initial/final throwing-clock controls / deterministic | Initial clock fault returned `UNKNOWN`, `capReasons:[fault]`, `searchElapsedMs:null`; final clock fault returned `UNKNOWN`, `capReasons:[fault]`, `searchElapsedMs:0`. Through a freshly generated good artifact, the public consumer returned `COMPLETE`, requested/reported 1/1, `unknownPositions:1`, and retained `fault:"consumer clock fault"`. |
| F2 / A4 timing truth | **FAIL (P1 survivor)** | same public-consumer initial-clock control / deterministic | The faulted position correctly carries `searchElapsedMs:null`, but `positions.reduce((sum, search) => sum + search.searchElapsedMs, 0)` coerces `null` to zero, so top-level `timing.searchMs` is `0`. Impact: an unmeasurable search duration is reported as measured zero, violating A4's separate search-time record and making later cost reporting falsely precise. Location: `solver/trajectory-audit.js` lines 438-440 at this identity. The new permanent clock test asserts the disposition/denominator but not this aggregate, and the card does not declare the loss. No second correction is authorized or attempted. |
| F3 / A1 real producer-created empty session | **PASS** | fresh `recordSession` subject 9999 seed 0 through verifier and consumer / deterministic | Producer output remained a legitimate zero-move `no valid moves` artifact. Verification now returns `UNRESOLVED` with `session contains no auditable positions`; consumer returns `UNRESOLVED`, sessions verified 0, `positionsRequested:null`, positions reported 0. The card now distinguishes this from a truncated formerly nonempty trace. |

Mapped frozen criteria:

| Criterion | Verdict | Covers/evidence |
| --- | --- | --- |
| A1 | **PASS** | F3 passes; unchanged good/self-rehashed replay coverage is reused from the original independent gate. |
| A2 | **PASS** | F2 initial/final fault dispositions pass; unchanged exhaustive legality, collision, bomb order, NONE/cap and non-mutation coverage is reused. |
| A3 | **PASS** | F1 passes both production-selected-win and conservative override ambiguity controls; corrupt artifacts remain excluded. |
| A4 | **FAIL** | Requested faulted positions and denominators are retained, but unknown per-position duration is aggregated as numeric zero. |
| A5 | **PASS** | `0c6b250..bbf5fde` changes exactly the same three allowed paths; target clean; all three blobs match root `ee2bc26`; affected file test 13/13 and independent diff check PASS. Producer evidence reused as authorized: focused 45/45, experiment/diff PASS, full 391/395 with exactly the four known failures (`candidate-levels-52.json`, `candidate-levels-54.json`, Universe Map generated-view staleness, Universe Map date drift). Full suite was not rerun. |
| A6 | **FAIL** | Fresh affected judgment from the frozen spec finds the A4 survivor; therefore the report-only instrument is not independently qualified. |

Commands and retained outputs:

```text
node /private/tmp/gate001-probe.js
good COMPLETE; production transition target win; witness differs;
attribution=production-choice
bad UNRESOLVED; positions=0; reason="move 0 scoreAfter mismatch"

node <inline affected F2/F3/override probe>
empty: moves=0; verify=UNRESOLVED; audit=UNRESOLVED;
  reason="session contains no auditable positions"; positionsRequested=null
clock initial: UNKNOWN/fault/searchElapsedMs=null
clock final: UNKNOWN/fault/searchElapsedMs=0
clock consumer: COMPLETE; requested=1; reported=1; unknown=1;
  position searchElapsedMs=null; aggregate timing.searchMs=0
override bomb=unresolved; target=unresolved

node --test solver/tests/trajectoryAudit.test.js
tests 13; pass 13; fail 0

git diff --name-only 0c6b250..HEAD
docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md
solver/tests/trajectoryAudit.test.js
solver/trajectory-audit.js

git diff --check 0c6b250..HEAD
(no output; exit 0)
```

Exact regenerated diagnostic artifacts are
`/private/tmp/gate001-good-9001-0.json`,
`/private/tmp/gate001-bad-score.json`,
`/private/tmp/gate001-fixed-empty.json`, and
`/private/tmp/gate001-fixed-clock-good.json`. Unchanged limits remain those in
the original gate: shared engine/game correctness, normal-path exhaustive scan,
multi-move/corpus/population/performance allowance and policy benefit were not
rerun or inferred. Bomb/target override behavior was checked conservatively at
the public classifier seam; no protected chooser source changed. Changed
artifact: this appended canonical ticket result only; repaired target remained
read-only.

Lease **RELEASED** by `/root/trajectory_gate_gpt_5_6_sol_ultra` at
`2026-09-06T08:48:50Z`; no further target or canonical-ticket write is owned by
this verifier. Root retains adjudication and the authorized hard stop.
