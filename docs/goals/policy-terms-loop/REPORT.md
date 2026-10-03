# RESULT-0080: interrupted policy terms diagnostic

Execution stopped **UNVERIFIED** before the complete controls. No Path A-D
completed and no idea was judged. None of the effort bounds was exhausted.
The immutable goal's unmet-item stop rule applies: the lost C3 handicap panel
cannot be completed without replaying dispatched, burned seeds. No restart
or additional scientific games followed the interruption.

The execution tool reported a disconnected transport and rejected session
resumption. A subsequent shell recovered, but process 7892 was defunct.
Its exact termination mechanism is unverified; the transport observations
are retained rather than presented as a proven process-kill cause.

| Required item | Retained status and raw output |
| --- | --- |
| 1 | Met: [start-output.txt](start-output.txt), including the three named baseline failures and one skip |
| 2 | Met historical table: [noise-output.txt](../../../solver/policy-lab/runs/noise-output.txt); the full twelve-block updated resolution is unverified |
| 3 | Met: [generation-output.txt](../../../solver/policy-lab/runs/generation-output.txt), with the branch limited to the owner-faster diagnostic subset |
| 4 | Met: [EXPLORATION_PLAN.md](EXPLORATION_PLAN.md), committed before fresh games and unchanged |
| 5a, 5b | Met: parity and inert counts in [controls-output.txt](../../../solver/policy-lab/runs/controls-output.txt) |
| 5c, 5d | Aggregate UNVERIFIED: two complete blocks; C3 retains only champion and zero panels |
| 6-11 | UNVERIFIED_NOT_RUN: no proposals, joint search, freeze or confirmation |
| 12 | PASS on every retained full panel: [coverage-output.txt](../../../solver/policy-lab/runs/coverage-output.txt); unused blocks print not run |

[recompute-output.txt](../../../solver/policy-lab/runs/recompute-output.txt)
reproduces the historical summaries, completed controls and interruption
receipt using only Node builtins. This is independent arithmetic
re-implementation by the same author, not independent verification.

The recorded accounting includes the conservative historical replay
allowance. The difference between charged and retained games is not treated
as a measured number of completed games; the lost dispatch's completion
count is unknown. See the exact values in the [closure receipt](../../../experiments/RESULT-0080/closure.json).

FR-0006 records this failed run. [completion.js](../../../solver/policy-lab/completion.js)
refuses an incomplete control closure and is exercised by negative tests.
It prevents reporting missing outcomes as complete controls; it does not
claim to prevent infrastructure disconnections. The report command invokes
that fence before allowing a Path C label.

The required fifth failed closure conflicts with the existing scanner
test's hard-coded four-closure list. That test is preserved unchanged, as
are all other existing tests. Consequently the full suite cannot satisfy
the goal's baseline-only failure requirement within its allowed edits.
The actual suite and strict refusal are retained in
[closeout-output.txt](closeout-output.txt) and [closeout-tests.txt](closeout-tests.txt).

The evidence record RESULT-0080 remains provisional, with written_by set to
the producing session and checked_by unset. No scientific acceptance or
policy adoption occurred. All diagnostic game data remain outside
experiments/; its RESULT-0080 directory contains only the required failed
closure receipt, without a reconstructed confirmation protocol.

Print the complete saved raw command output without launching games:

```sh
node docs/goals/policy-terms-loop/print-report.js
```
