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
