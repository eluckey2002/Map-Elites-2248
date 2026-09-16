# RESULT-0037 — closure report

## Outcome

**Closure: `UNVERIFIED`. No domain outcome is entitled.**

The one registered confirmation run completed all 128 games without an
emergency-watchdog timeout. The production artifact verifier passed, and an
independent reduction of the retained corpus byte-matched its decision.
However, the frozen closeout command writes those bytes to a file while the
required closure verifier compares command stdout to the retained artifact.
That command therefore cannot satisfy the preregistered executable contract.
The protocol is immutable, so this is recorded as a closure failure rather
than repaired after outcomes were visible.

## Partial evidence, not a domain inference

The retained corpus identity is
`f57690b58297feec62e4ef863a59931f7f48910c00fef873d61b29f6b0592083`.
Its registered analysis and the independent manual reduction agreed on:

- 68/128 exact-complete games (53.125%), with every policy/level cell
  represented and 50% minimum policy completeness.
- Policy mean greed of 0.366, 0.522, 0.728, and 0.955 for percentiles 0.25,
  0.50, 0.75, and 1.00; range 0.589.
- Policy-level win/greed Pearson correlation 0.955.
- Per-game score/greed absolute Pearson correlation 0.611.
- Minimum modal-or-adjacent greed-bin stability 1.00.
- Half-score move remained diagnostic only: two timing bins and mean-policy
  range 0.044. It is not validated by this run.

These values describe preserved partial evidence only. The preregistered P1–P5
cells are `UNVERIFIED`, and P6 has no primary outcome, because executable
closure did not pass.

## Controls and deviation

C1–C4 and C6 passed. C5 failed at the frozen executable-closeout boundary.
The confirmation itself did not deviate: one attempt, exact ordered matrix,
fixed seeds, fixed work cap, and no timeout retry or replacement seed.

The required next step is a successor protocol with a recomputation command
that emits its reduction on stdout, followed by fresh seeds. RESULT-0037 may
not be retried or promoted.
