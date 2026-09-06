---
id: VERIFY-002
run: 2026-09-05-policy-measurement-extra-repair
status: complete
executor: orch-verify
profile: orch-planner
depends_on: []
write_scope: []
bound: 12 minutes
claimed_by: /root/extra_repair_review_gpt_5_6_sol_ultra
claimed_at: 2026-09-06T02:39:00Z
---

## Objective

Independently decide whether the one authorized extra repair closes the
remaining measurement defect at c61d443 without hiding unresolved evidence.

## Fixed inputs

Exact source c61d4430c08fd4e47c9b25bb9885b6b585becd95; repair baseline
236b03f2af0f12f105e7ffb52ba36b4c0b39ad73. Root foreground tree; target files
read-only. No other writer will change targets or this ticket during review.
Frozen R1-R4 in adjacent REPAIR-002.md; original C1-C7 in
.orch/runs/2026-09-05-policy-measurement-code/spec.md; original independent
verification-ce21196.md supplies prior uninvalidated coverage, not acceptance
of changed files. Real baseline in this run: baseline-c61d443.json,
SHA-256 a79fe73494dbff59dc7bc8a822c558caf18f3ce0b194412f4e02cbf38b03889e;
baseline-c61d443.txt; suite-c61d443.txt; checks-c61d443.json.
The original plan/contract/source hashes are in REPAIR-002's fixed references.
Use planner override because C7 requires independent judged code review.
No game/bot changes, Step 3 audit, experiment, receipt/gate rewrite, external
action, or target edits. Ticket Result/Verification/Feedback/Risks are the
only root write exception; do not write a second report or commit.

## Completion test

1. V1: R1-R2 and original C5: execute independent reference-fault and
   diagnostic-fault public collect/render probes, require explicit unavailable
   regression counts and complete unresolved dispositions; known partial
   regression remains visible; real text/JSON arithmetic/classifications agree.
   Oracle_class=deterministic; provenance=pre-existing specification.
2. V2: R3 and original C6: validate exact recorded full-suite failure identities,
   affected permanent tests, experiment/diff result and protected identities.
   Reuse exact uninvalidated full-suite evidence; do not rerun 75 seconds of
   unchanged checks solely for ceremony. Oracle_class=deterministic;
   provenance=pre-existing.
3. V3: R4/original C7: inspect the narrow source/test/card diff for blocking
   correctness, contract, scope and check-coverage defects; wider previously
   accepted implementation is not a new feature scope. Each finding must name
   evidence and violated criterion. Oracle_class=judged;
   provenance=pre-existing.

## Return fields

Completed ticket with fixed identities, per-criterion verdict entries and
actual oracle evidence, ranked findings separate from uncertainties, coverage
limits, weakest-class overall verdict. Return ticket path to /root; do not set
terminal status yourself. Fresh context supplies acceptance independence.

## Result

Independent verification result: **PASS** for the authorized extra repair.
Weakest required oracle class: **judged**. This decides only the repair at
`c61d4430c08fd4e47c9b25bb9885b6b585becd95`; it does not by itself accept all
of Step 2 or release Step 3.

Fixed identities:

- Repair baseline: `236b03f2af0f12f105e7ffb52ba36b4c0b39ad73`.
- Verified source: `c61d4430c08fd4e47c9b25bb9885b6b585becd95`.
- Evidence commit/current pre-write HEAD:
  `b54e6eca9f4a816ebb96890bd036a781e68e6299`.
- Baseline JSON SHA-256:
  `a79fe73494dbff59dc7bc8a822c558caf18f3ce0b194412f4e02cbf38b03889e`.
- Measurement-source identity:
  `9b9ecd4db90d60d71b9e83c59348d790ffcf802eedb3f518ca79cc74aa3cefee`.
- Changed target SHA-256 values: `solver/benchmark-metrics.js`
  `9590bb536f9f85614777905f6b1f211bd38f1f65bf689be771cad17961b8cf7a`;
  `solver/human-benchmark.js`
  `ca9f83b7a77d115d42b4a2ab155edb27c28aac0e67d0d79a9bdfa2131017affb`;
  `solver/tests/humanBenchmark.test.js`
  `cf742c9bca6aed1d2f264622cbde7547f007466b4b31ca7256b8223ecb070841`;
  `docs/evaluation/POLICY-EVAL-0001/measurement-checks.md`
  `eae537c28fd2f25e336d202a39deae0eb5af3ef8d7d3153923bf09fd93ee5260`.

## Verification

### V1 — PASS

- `verdict`: `PASS`
- `oracle`: independent public `collect({ playBotFn })` plus `renderText()`
  reference-fault and diagnostic-fault probes; independent row arithmetic over
  `baseline-c61d443.json`; affected permanent tests.
- `oracle_class`: `deterministic`
- `evidence`: Each fresh fault probe produced 15 dispositions, 15 unresolved,
  zero admitted rows, and no extras. Receipt-bound was 12 files/0 attempts/0
  cases/12 unresolved; current-subject was 3/0/0/3. Both panels were
  `UNRESOLVED`; converted wins, mean moves saved, regression attempts/cases,
  and score means were null, with zero available score attempts. Each rendered
  text contained exactly two `regressions unavailable attempts in unavailable
  cases` lines and no `undefined`, `regressions 0 attempts`, or `: ELIGIBLE`.
  The three affected tests (`collect-level runtime fault`, `diagnostic runtime
  fault`, and `missing required and actual extra files`) passed 3/3 in 306 ms
  and are also PASS lines in `suite-c61d443.txt`. The known bad twin remains
  the independently recorded pre-repair `undefined` rendering in
  `verification-ce21196.md`, so the oracle is demonstrated able to fail.
  Independently grouping the saved 15 rows by `caseKey` reproduced 12
  receipt-bound attempts/9 cases and 3 current-subject attempts/3 cases. It
  found the retained `8ac6c9d4...` regression (1 attempt in 1 case),
  receipt-bound case-weighted human win rate `0.9629629629629629`, score delta
  `682.6666666666666`, percent `4.1577153551513515`, and `INELIGIBLE`; the
  current-subject values were win rate `1`, score delta
  `32725.333333333332`, percent `39.58420260115114`, mean moves saved
  `1.3333333333333333`, and `FASTER_ON_THIS_SET`. Rendering the saved JSON
  reproduced `baseline-c61d443.txt` byte-for-byte.
- `covers`: base `236b03f2af0f12f105e7ffb52ba36b4c0b39ad73`, result
  `c61d4430c08fd4e47c9b25bb9885b6b585becd95`, evidence
  `b54e6eca9f4a816ebb96890bd036a781e68e6299`, the four changed target blobs
  listed above, baseline JSON identity `a79fe734...`, and unchanged frozen
  contract/input identities `3d4cf0f6...` / `1030d178...`.

### V2 — PASS

- `verdict`: `PASS`
- `oracle`: identity comparison of `checks-c61d443.json`,
  `suite-c61d443.txt`, and prior `checks-ce21196.json`; live experiment gate,
  live `git diff --check`, exact source hashing, and protected-path Git diff.
- `oracle_class`: `deterministic`
- `evidence`: The recorded suite is 382 tests, 378 pass, 4 fail. Its exact
  failure-name array is byte-for-byte equal to the prior array: stale receipts
  for `candidate-levels-52.json` and `candidate-levels-54.json`, generated-view
  staleness, and date-drift/rebound-evidence observation. The suite contains
  PASS lines for all three changed permanent controls. The baseline hash and
  source/measurement identities in `checks-c61d443.json` match the saved JSON.
  `node tools/verify-experiments.js` freshly printed `EXPERIMENT GATE PASS` and
  exited 0. `git diff --check 236b03f..c61d443` freshly exited 0. The frozen
  contract and inputs still hash to `3d4cf0f6...` and `1030d178...`; behavior
  sources still match the manifest exactly: `src/game.js` `22ebc237...`,
  `solver/engine.js` `0ed4b310...`, and `solver/bot.js` `3efd50ce...`.
  Protected source paths and the unchanged original C1-C4 implementation have
  no diff from `ce21196` to `c61d443`. The 75-second full suite was reused as
  expressly authorized rather than rerun.
- `covers`: result `c61d4430c08fd4e47c9b25bb9885b6b585becd95`, evidence
  commit `b54e6eca9f4a816ebb96890bd036a781e68e6299`, recorded suite SHA-256
  `a7c70fa561bd2bbac8c75114f9bec8487177d5035674ce6a0f7a797b45f85bfb`,
  checks SHA-256
  `a710effb8d7b2b1da013ef2effa71fa6c2b459e29c79d0ffeb711327e42f08c4`,
  prior exact failure identities at `ce21196`, and the protected hashes above.

### V3 — PASS

- `verdict`: `PASS`
- `oracle`: fresh independent review of the narrow
  `236b03f..c61d443` source/test/card diff against R1-R4, original C5-C7,
  POLICY-EVAL-0001 sections 4-7, `AGENTS.md`, and the measurement check cards.
- `oracle_class`: `judged`
- `evidence`: No blocking correctness, contract, scope, or check-coverage
  finding. `compareCases` now explicitly represents unavailable regression
  counts as null for empty/unresolved inputs; `renderText` routes those fields
  through the existing unavailable formatter. Both real public runtime-fault
  seams traverse collection and rendering, assert all-unresolved JSON/text,
  and reject the former undefined/zero/eligible presentations. The real
  partial panel test pins the existing one-attempt/one-case regression. The
  check card records the exercised red predecessor and repaired permanent
  controls. No gameplay, reference, engine, authoring, receipt, experiment,
  frozen contract/input, or later-step surface changed; the repair adds no
  parallel abstraction or gate exemption.
- `covers`: baseline `236b03f2af0f12f105e7ffb52ba36b4c0b39ad73`, verified
  target source `c61d4430c08fd4e47c9b25bb9885b6b585becd95`, evidence
  `b54e6eca9f4a816ebb96890bd036a781e68e6299`, the four changed target blobs,
  and frozen R1-R4/C5-C7/contract/check-card lenses.

### Overall

`PASS` — V1, V2, and V3 all pass; weakest oracle class is `judged`.
Verification made no target edits, ran no curve, and performed no commit or
external action.

## Feedback

### Ranked findings

No blocking findings.

### Uncertainties

1. The exact full-suite artifact was independently reconciled but deliberately
   not rerun; its four known failures remain visible and this is not an
   all-green repository result.
2. This verification closes the authorized code/reporting defect only. Step
   2's source-record corrections and final baseline report remain separate,
   unstarted successor work, so Step 3 remains blocked until the complete Step
   2 evidence is accepted.
3. The historical-runtime linkage limitation for ordinary play remains a
   disclosed evidence boundary; this repair neither creates nor removes it.

## Risks

- Do not reinterpret these selected 15 recordings as a population estimate or
  policy-promotion result.
- Any change to a covered target blob, frozen contract/input, behavior-binding
  source, baseline artifact, or exact suite evidence invalidates the
  corresponding verdict entry and requires re-verification.
- The four recorded repository failures remain real. This verdict neither
  exempts nor repairs them.
