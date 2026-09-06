# Final measurement verification — incomplete

Fixed code: `ce21196aca799b0c72c1e9b3025692dd45c3e861`.
Reviewer: `/root/measurement_review_gpt_5_6_sol_ultra`, orch-verify.
Original base: `e0ed5a15f982b6584428de031f778ceb008c1d19`.
Correction: `4602cd1` and `86a016a`; `ce21196` is evidence bookkeeping.
Reviewer changed_artifacts=[]; fixed tree clean before and after.
Root integrated this result once. **Overall FAIL; no Step 2 acceptance.**

## Remaining blocker

`compareCases([])` omits `regressionAttempts` and `regressionCases`
(`solver/benchmark-metrics.js:20-26`). When every row is unresolved,
`collect()` retains that empty metric object
(`solver/human-benchmark.js:373-398`), and `renderText()` interpolates the
absent fields (`solver/human-benchmark.js:442`):

```text
regressions undefined attempts in undefined cases
```

Independent reference-fault and diagnostic-fault controls each produced the
correct 15 unresolved dispositions, zero rows, UNRESOLVED panels, N=null/n=0
and zero score attempts, but printed the malformed line for both panels.
Permanent runtime tests stop at collect rather than rendering
(`solver/tests/humanBenchmark.test.js:135-168`), so 38/38 focused tests pass.

This is a C5 public reporting defect within F1's accepted propagation/reporting
scope. It also leaves F5/C7's permanent downstream-control coverage incomplete.
It does not show the current 15 valid rows are numerically wrong.

## Finding and criterion dispositions

| Finding | Verdict | Independent evidence |
| --- | --- | --- |
| F1 runtime propagation/reporting | FAIL | Faults no longer aggregate, but the all-unresolved renderer emits undefined counts. |
| F2 unsigned/forged receipt | PASS | Exact reasons: `receipt missing receiptIdentity or artifactIdentity`; `receipt self-identity mismatch`. |
| F3 required coverage/subset labels | PASS | Real missing-plus-extra control retains denominator 12, available attempts 11, labels resolved subset and names both paths. |
| F4 normal output fields | PASS | Default CLI prints N/n, speed counts, source identities, score coverage, horizons and terminals. |
| F5 public negative controls | FAIL | New load/collect paths work, but all-unresolved rendering remains untested and defective. |

- C1 PASS, deterministic: frozen identities, all 15 paths, real missing/extra,
  corrupt contract, seeds, subjects and unsigned/forged receipts exercised.
- C2 PASS, unchanged coverage: replay, engine, bot, game, contract and inputs
  have identical blobs at f407d9c and ce21196; focused replay controls passed.
- C3 PASS, deterministic: separate reference/diagnostic faults cannot aggregate;
  defaults, original B, external H, RNG, absorption, mixed intent and zero-reference
  controls passed.
- C4 PASS, deterministic: E01-E18 pass. An independent one-reference-fault run
  wrapping real playBot retains the real 8ac6 regression (one attempt/one case),
  while the receipt panel is UNRESOLVED with 11 attempts/9 cases and a subset label.
- C5 FAIL, deterministic/evidence: public all-unresolved text contains undefined.
- C6 PASS, deterministic: [full output](suite-ce21196.txt) and
  [checks](checks-ce21196.json), 382 tests/378 pass with exactly the original four
  failure identities; experiment gate and diff check PASS.
- C7 FAIL, judged gate: the reachable reporting defect and missing permanent
  rendered-output control block acceptance.

The direct default CLI at ce21196 exited 0: 15 admitted, zero unresolved/extras;
receipt-bound 12 files/12 attempts/9 cases, INELIGIBLE, N/n 0/9, speed 2/5/1;
current-subject 3 files/3 attempts/3 cases, FASTER_ON_THIS_SET, N/n 0/3, speed 2/0/1.
All rows carry the appropriate source identities. These are descriptive output
observations, not an accepted Step 2 instrument or a promotion result.

## Reproduce the remaining defect

Run from a checkout with the exact ce21196 measurement sources:

```sh
node - <<'NODE'
const { collect, renderText } = require('./solver/human-benchmark');
const fault = (reason) => ({
  validity: 'unresolved', outcome: null, reason,
  score: null, moves: null, firstCrossing: null,
});
const controls = {
  reference: () => fault('controlled-reference-fault'),
  diagnostic: (candidate, seed, options = {}) => options.targetDisabled
    ? fault('controlled-diagnostic-fault')
    : {
      validity: 'valid', outcome: 'win', reason: 'controlled-reference',
      score: candidate.target, moves: 1, firstCrossing: 1,
      initialGridIdentity: `controlled-${seed}`,
      externalHorizon: candidate.moves,
    },
};
for (const [name, playBotFn] of Object.entries(controls)) {
  const lines = renderText(collect({ playBotFn }))
    .split('\n').filter((line) => line.startsWith('regressions '));
  console.log(`${name}: ${lines.join(' | ')}`);
}
NODE
```

Root independently reran both controls after the review return: each had
15 unresolved, zero rows and two identical undefined-count lines.

The raw baseline remains preserved at [baseline-ce21196.json](baseline-ce21196.json),
SHA-256 `034fedbb03486239208ca70a9028e6e16de90790ecaa899c1242dd217a182c60`,
measurement-source identity
`1c7ce6b4d6b270aedf06a3972007fa30cea18eac32d400d195b3f821566bfefd`.
The prior f407d9c baseline and failed gate remain history, not overwritten.

## Resume boundary

The single orch-review-fix correction pass is spent. A further repair requires
a new caller decision; none ran after this verification. The narrow remaining
work is explicit empty/unresolved regression reporting plus permanent rendering
controls for both runtime-fault paths, then independent verification. Do not
silently broaden that to policy work.

The code delivery is incomplete, so its content successor was not started:
ledger/navigation/backlog premise corrections and a final baseline report are
still pending. Step 3 remains blocked. No bot trajectory audit, policy change,
new generalizing experiment, receipt refresh, PR, push or main merge occurred.

The pilot wrapper/execution-linkage question remains a nonblocking uncertainty,
not a newly established defect.

Bookkeeping correction: earlier ticket values `integrated`/`context` were
not valid work-item enums; current terminal fields are normalized below their
retained history. Repair's own-tree ticket copy was fast-forwarded into the
canonical root before closeout; future dispatches must name the root ticket
path and carve its bookkeeping out of tree exclusions. Those deviations do not
supply acceptance evidence.
