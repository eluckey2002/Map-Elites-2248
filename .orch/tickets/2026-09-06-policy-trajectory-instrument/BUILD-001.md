---
id: BUILD-001
run: 2026-09-06-policy-trajectory-instrument
status: failed
executor: orch-tdd
pack: orch-code-pack
profile: orch-worker
independence: gate
depends_on: []
write_scope: [solver/trajectory-audit.js, solver/tests/trajectoryAudit.test.js, docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md]
bound: 24 minutes
claimed_by: /root/trajectory_build_gpt_5_6_sol_high
claimed_at: 2026-09-06T08:12:18Z
---

## Objective

Deliver the real serialized-session -> independently verified replay -> bounded
immediate-win audit seam specified in A1-A5, using red-green increments.

## Fixed inputs

Root /Users/eluckey/Developer/research and games/2248-challenge. Frozen spec
.orch/runs/2026-09-06-policy-trajectory-instrument/spec.md; read entirely.
Worktree /private/tmp/2248-trajectory-instrument.dX4Rcr, derived from the claim
commit, sourcebase54a4251. Standards: AGENTS.md and spec's standards pointers.
Craft: /Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md.
Source intake GROUND-001 supplies exact existing APIs/tests; inspect relevant
implementation, do not infer that a proposed audit API already exists.
Follow gate-check and use check-design.md's planned controls as design input,
not evidence of execution. Qualification only on constructed/existing inspected
cases; no fresh audit population or protocol registration in this code ticket.

## Completion test

A1-A5 from frozen spec, verbatim by reference. Commands:
node --test solver/tests/trajectoryAudit.test.js solver/tests/botVision.test.js solver/tests/policyBenchmark.test.js
node tools/verify-experiments.js
git diff --check
node --test --test-reporter=spec solver/tests/*.test.js
Oracle classes: A1-A5 deterministic; test-body provenance authored-here with
outside independence at A6 gate. Preserve every required negative case and exact
four known full-suite failure identities. Full suite only at clean committed
state, no concurrent ticket/card writes; collect output then write evidence.
A6 independent judged qualification is downstream, never your self acceptance.

## Return fields

Incremental result in canonical ROOT ticket: committed slice identities,
changed paths, red/green and actual good/bad controls, complete command outcomes,
protected identities, scope/coverage limits and gaps. Per A1-A5 evidence/covers;
A6 deferred. Explicitly release worktree/ticket leases before returning.

## Result

Incremental implementation evidence:

- Slice 1, committed as `503bab1` (`Add verified bot session replay seam`):
  added the artifact-file verifier and its real `recordSession` positive control.
  The pre-code red run failed because `../trajectory-audit` did not exist. The
  green run passed 2/2 tests. Its retained self-rehashed negative controls alter
  spawn, chosen chain, score, outcome, source identity, policy params, and
  continuation after terminal; missing and invalid JSON inputs also return
  `UNRESOLVED`.
- Slice 2, committed as `624f912` (`Add bounded exhaustive immediate-win
  search`): the pre-code red run failed 4/4 named search cases because
  `searchImmediateWin` did not exist. After correcting two constructed controls
  that admitted unintended longer bomb-defusing chains, the green run passed
  6/6 total tests. Controls cover a replayed move-B win, two transition-distinct
  actions sharing the same coarse endpoint/length/score identity, bomb-before-
  target rejection, genuine exhaustive `NONE`, and deterministic node/time
  `UNKNOWN` results with explicit limits and telemetry.
- Slice 3, committed as `ec3c1c4` (`Add verified trajectory audit consumer`):
  the pre-code red run passed the already-present state non-mutation probe and
  failed the two new public seams because `classifyAttribution` and
  `auditSessionArtifact` did not exist. The green run passed 9/9 tests. It adds
  session/subject/seed/prefix binding, live-RNG draw-state search, sound offered
  action comparison, generation/ranking/control-flow/unresolved attribution,
  complete/capped/invalid consumer fixtures, explicit denominators, and separate
  replay/chooser versus search timing. It also retains empty/truncated session,
  seed and subject corruption controls. Per frozen A2, `maxNodes: 0` is an
  immediate `UNKNOWN`, not an exception; final elapsed is sampled after search
  work.
- Slice 4, committed as `0c6b250` (`Document trajectory instrument check
  boundaries`): the card-presence red control failed with `ENOENT`; after adding
  the local two-check gate-check card, the named focused command passed 42/42.
  Gate-check disposition is PROCEED only at the report-only rung, with A6 still
  required. The cards inventory granularity, kind, actual garbage controls,
  exact scope, supply chain, sampling memory, enforcement, decay, retire-one
  result, and explicit `Does NOT catch` limits.
- Protected baseline identities before implementation: `src/game.js`
  `22ebc237...`, `solver/engine.js` `0ed4b310...`, `solver/level-author.js`
  `c0eef4a5...`, `solver/bot.js` `3efd50ce...`, `solver/record-session.js`
  `c14ec394...`, `solver/benchmark-replay.js` `a714232d...`,
  `solver/benchmark-inputs.js` `970217cc...`, and
  `solver/targeted-chain-generator.js` `45eb66c7...`.
- Final result identity is
  `0c6b250ce300c76797308ea295ee2e6f48832ae0`, comprising `503bab1`,
  `624f912`, `ec3c1c4`, and `0c6b250`. The exact diff from `c8ad993` contains
  only the three granted paths: `solver/trajectory-audit.js`,
  `solver/tests/trajectoryAudit.test.js`, and
  `docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md`.
- Final protected hashes match the starting envelope exactly: `src/game.js`
  `22ebc237b6750fff04251c1b123cc6be749b8b75f3146d6e42576c509dc97bf2`;
  `solver/engine.js` `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`;
  `solver/level-author.js` `c0eef4a582ea0c61e3d8b9601320e53266016785318334301a46ef29f76b04f4`;
  `solver/bot.js` `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`;
  `solver/record-session.js` `c14ec394d3323ee2b4182f7f59e90c81972039d03e8133fb5fd4dedf1b787799`;
  `solver/benchmark-replay.js` `a714232d4e4bf308c7c6231d792ee90259f5bc9b4f33d9d1a2c21f0157e15167`;
  `solver/benchmark-inputs.js` `970217cc40b35de490f4f60a79e072c54401203d127cc2ef29d81ca6d1ff7d73`;
  `solver/targeted-chain-generator.js`
  `45eb66c7788cd14b1057ba020218af6aeea5ceedd27ba238456cb7af50a6ef14`.
- Final live custody outcomes at clean `0c6b250`: focused suite 42/42;
  `EXPERIMENT GATE PASS`; both diff checks PASS; full suite 388/392. The ten
  additional tests over the accepted 378/382 baseline are the trajectory suite.
  The same exact four failures remain: receipt calibration-stamp mismatches for
  `candidate-levels-52.json` and `candidate-levels-54.json`, Universe Map
  generated-view staleness, and Universe Map date drift (`asOf 2026-08-28`,
  current `2026-09-06`). No new failure identity appeared.
- Coverage limit: this report-only instrument processes one explicit schema-2
  artifact/subject at a time. It does not sample a population, authenticate a
  historical runtime, independently prove shared engine semantics, find
  multi-move opportunities, establish speed or population effects, or authorize
  a policy change. `FOUND` is existence only; `NONE` requires exhaustion;
  cap/fault without a witness stays `UNKNOWN`.

## Verification

Fixed-result `orch-verify` verdict at `0c6b250`: **PASS A1-A5; overall
deterministic PASS. A6 remains deferred to its downstream independent judged
gate.**

- A1: PASS; oracle_class=deterministic; provenance=authored-here. Real artifact
  positive plus self-rehashed spawn/chain/score/outcome/source/params/seed/
  subject/empty/truncated/continuation negatives cover full independent replay;
  invalid intake emits no positions.
- A2: PASS; oracle_class=deterministic; provenance=authored-here. Hand controls
  cover move-B FOUND, deliberate coarse-identity collision, bomb-before-target,
  exhausted NONE, zero/tiny node and injected-time UNKNOWN, explicit caps,
  cloned transitions, and non-mutation.
- A3: PASS; oracle_class=deterministic; provenance=authored-here. Verified-only
  consumer binding covers session, subject, seed, preceding moves, live RNG
  state, sound offered/selected identities, and trace-supported attribution.
- A4: PASS; oracle_class=deterministic; provenance=authored-here. Complete,
  capped and invalid fixtures retain explicit denominators, every verified
  disposition, and separate replay/chooser versus search timing; no population,
  speedup, promotion, or policy verdict exists.
- A5: PASS; oracle_class=deterministic; provenance=pre-existing. Exact path
  envelope and protected hashes match; focused 42/42, experiment gate, diff
  checks, and full 388/392 outcome are recorded above with no new failure.
- A6: DEFERRED; oracle_class=judged. Independent source/test review,
  nine-question gate-check review, and retained actual good/bad qualification
  remain downstream; no producer self-acceptance is claimed.

## Feedback

Final qualification after approved bounded correction: A4/A6 FAIL on unknown
duration aggregated as zero. See REPAIR-001 and GATE-001 affected verification.
Instrument remains unqualified; no bot audit or policy changes were performed.

- Root integration 2026-09-06T08:25:23Z: matching claimant returned within its
  bound and released both leases. Exact three-path diff confirmed. A1-A5
  producer evidence remains covered at0c6b250; A6 is uncovered and required.
  Disposition: needs-verify, not accepted for audit use.
- The first bomb controls admitted legitimate longer bomb-defusing chains; the
  controls were isolated before acceptance and the observation was friction-
  logged.

## Risks

- A6 has not run, so the instrument is not qualified for fresh audit sampling.
  Numeric caps, panel/seed choice, population inference, policy mutation, fresh
  measurement, PR/push/main and external operations remain out of scope.
