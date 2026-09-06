---
id: BUILD-001
run: 2026-09-06-policy-trajectory-instrument
status: claimed
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

## Verification

- A1: incremental PASS at `503bab1`; final fixed-result verification pending.
- A2: incremental PASS at `624f912`; final fixed-result verification pending.
- A3-A4: incremental PASS at `ec3c1c4`; final fixed-result verification pending.
- A5: named focused command PASS 42/42 and `git diff --check` PASS at committed
  worktree revision `0c6b250`; experiment and full-suite custody checks pending.
- A6: deferred to downstream independent qualification as required.

## Feedback

[]

## Risks

You are not alone; preserve other changes. Only own three worktree files and
canonical ROOT ticket result sections; never root target edits/commit or a
worktree-copy ticket. Root read-only during lease. No redelegation. apply_patch
only. Commit verified slices in worktree. Parent hardstop08:52:18Z; this claim
ends08:36:18Z. No framework expansion, protected source changes, global gates,
fresh measurement, Atlas, PR/push/main action. Reply_to=/root.
