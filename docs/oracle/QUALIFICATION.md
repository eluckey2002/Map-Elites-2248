# Oracle qualification attempts

This record separates checker qualification from oracle performance. The governing
contract is `CONTRACT.md`; the externally pinned corpus identity is
`59daa4e54dceef9b5da7eacb730d3cecb08f43fc389f9721adec6b4c3dc31308`.

## Attempt 1 — initial mechanism

- Mechanism identity (canonical hash of CLI `sourceIdentities()`):
  `73443984cf5a9c0e62837c51bdf4fe54e35f6045662d5d9e2d782d0a981e25e3`.
- Command: `node --test solver/tests/oracle.test.js`.
- Observed: 10 tests passed, zero failed, 993.8 ms total.
- Positive controls: all 25 actual recordings replay through the new transition
  and existing full-rule checker; one independently searched small puzzle wins.
- Negative controls: illegal coordinates, wrong post-move value, changed ice
  duration, continuation after target, missing/duplicate report rows, false
  comparisons, false aggregate pass, exceeded declared time, and coherent
  replacement of a corpus file are rejected by the public verifier functions.
- The report-positive control uses known human witnesses strictly for checker
  calibration. It produces a valid report with a domain failure for the loss-only
  case; it does not demonstrate independent oracle performance.
- Remaining qualification: exercise report-file loading through the CLI, and
  qualify any subsequent mechanism revision before accepting its output.

## Initial development observations

`runs/attempt-01.json` contains the complete five-second screen: 20 oracle wins,
18 of 20 puzzle comparisons passing. Two Level 56 puzzles are one move slower
than the best human. `attempt-02-level56-1761047823.json` remains slower after
the initial portfolio completes within the 30-second allowance;
`attempt-03-level56-3504920448.json` matches its human comparator. These are
identified development observations, not generalizing experimental results.
They do not satisfy the goal. Preserve these reports when the implementation changes.

## Attempt 2 — wider path search and command-line qualification

- Mechanism identity (canonical hash of CLI `sourceIdentities()`):
  `7b9b7592bf2ed880af95041ca4e2dc87138308bb9f212125682a4138bd5ded1c`.
- Runtime: Node v26.0.0 on darwin/arm64.
- Command: `node --test solver/tests/oracle.test.js`.
- Observed: 14 tests passed, zero failed, 91,949.7 ms total, within the
  contract's two-minute focused-invocation ceiling.
- The positive calibration report covers all 20 puzzles using known human
  witnesses and current-bot witnesses. It calibrates the verifier, not search
  performance. The public CLI reads its temporary report file and exits 0.
- The same file is then changed to assert 999 oracle moves, re-signed, read back
  to confirm the mutation landed, and submitted to the same CLI. It exits 2
  with `forged comparison`. A slower legal bot witness remains an accepted
  report with a failed domain comparison, not a checker error.
- The earlier real-capture and negative controls still pass. Additional
  controls execute the actual child-process deadline (no witness => `UNKNOWN`)
  and render every witness move as a spatial board.
- Every reported baseline is now checked against the current bot's actual
  per-move choice, as well as legal game replay. The verifier never imports
  the oracle transition or candidate generator.
- Qualification: **PASS for this source identity**. This is a separate
  verification implementation, not a second-agent review. Its shared-engine
  and run-provenance limits are recorded in `../CHECK-CARDS.md`.

The preceding partial diagnostic `runs/attempt-04-level56-1761047823.json`
found a different legal 10-move win in 16,492 ms after adding width-eight path
generation. It predates this verifier revision and is retained as development
history, not the complete goal result.

## Final acceptance checks

- `node solver/oracle/cli.js --out docs/oracle/runs/attempt-05-full-corpus.json --budget-ms 30000`
  exited 0; its whole-report verification returned `valid:true, pass:true,
  puzzles:20, wins:20`. All 19 human-winning puzzles were matched or improved;
  the loss-only puzzle was won. See `RESULT.md` for exact identities and counts.
- `node solver/oracle/cli.js --show docs/oracle/runs/attempt-05-full-corpus.json --puzzle 8de7adce`
  exited 0 after verifying the report. The rendered output contains all 10
  numbered moves of the tied Level 56 witness.
- `node --test solver/tests/*.test.js` finished in 116,221.2 ms: 435 tests,
  430 pass, 4 fail, 1 skipped. The four failures are the same as the pre-edit
  baseline (421 tests, 416 pass, 4 fail, 1 skipped): stale Level 52 and 54
  candidate receipts, generated Universe Map staleness, and Universe Map date
  drift. None was changed, exempted or cleared. All 14 added oracle tests pass.
- `node tools/verify-experiments.js` returned `EXPERIMENT GATE PASS` after the
  source-pinned `RESULT-0039` ledger record was added.
- `git diff --check` passed. A diff against `e1d1f60` confirms no changes to
  `src/game.js`, `solver/engine.js`, `solver/bot.js`, `solver/level-author.js`,
  `solver/calibrations/calib-1.js`, captures, pilots, or archived candidates.

The goal outcome is **REALIZED** for the frozen corpus. No generalization or
optimality proof is claimed; the current bot and authoring acceptance rules are
unchanged. Qualification adds a separate replay implementation and actual-file
negative controls, not an external reviewer or a trust guarantee for report authors.
