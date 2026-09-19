# RESULT-0043 — executable-closeout exact greed-ratio replication

## Outcome

**Closure: `CLOSED`. Primary domain outcome: `INCONCLUSIVE`.**

The sole registered confirmation completed all 128 paired games with zero
watchdog timeouts. The production verifier passed, the independent corpus-only
reducer reproduced the retained decision byte-for-byte, and the frozen
closeout command had already passed through its exact declared cwd during
qualification.

The result provides usable behavior data. Exact mean greed rose from 0.385 to
0.946 across the four policies, and policy win rate tracked greed at
`r = 0.956`. The primary result is `INCONCLUSIVE`: Level 10 had no
exact-complete games under the frozen work cap; score/greed correlation was
0.730, between its support and falsification thresholds; and the minimum
modal-bin stability was 66.7%, also between thresholds. No prediction was
falsified, and no descriptor is adopted by this experiment.

## C1 — PASS

Production trace fixtures distinguished exact greed ratios from unknown
work-limited ratios through the frozen measurement seam.

## C2 — PASS

The deterministic exact/reference and objective-equivalence controls passed.
The formerly timed-out Level 10, percentile 1.00, seed 33,800,004 game completed
all 22 moves under the 120-second watchdog with five work-limited moves and zero
timeout moves.

## C3 — PASS

The planted percentile ladder and uniformly scaled negative control selected
the same registered fractions.

## C4 — PASS

All four declared production-verifier mutants were killed for their intended
reasons. The unstable middle-bin fixture produced exact-modal share 0.50.

## C5 — PASS

The independent reducer byte-matched the registered analysis on valid,
work-limited, zero-exact-policy, null-cell, and non-default-policy fixtures and
on the retained confirmation corpus. Qualification also executed the frozen
closeout cwd/argv combination against a fixture and byte-matched its output.

## C6 — PASS

Changing only half-score timing left P1–P5 and greed policy summaries
unchanged.

## C7 — PASS

The repository baseline retained 420 tests: 415 passed, the same four
documented deliberate failures remained, and one test was skipped. All 27
focused qualification tests passed.

## P1 — INCONCLUSIVE

All 128 games completed and 61 were exact-complete (47.656%). Minimum policy
completeness was 43.75%, but each of the four policy × Level 10 cells was 0/8
exact. This misses support without reaching the falsification rule.

## P2 — SUPPORTED

Mean exact greed rose strictly across the four policies: 0.385, 0.531, 0.741,
and 0.946. The range was 0.561 against the 0.30 support threshold.

## P3 — SUPPORTED

Policy-level win rate and mean exact greed had Pearson `r = 0.956`, above the
0.50 support threshold. Win rates were 0%, 0%, 31.25%, and 75%.

## P4 — INCONCLUSIVE

Per-game score and exact greed had Pearson `r = 0.730`, above the absolute 0.70
support boundary but below the 0.85 falsification boundary.

## P5 — INCONCLUSIVE

Exact modal-bin shares were 75.0%, 100%, 66.7%, and 100%. The minimum was above
the 60% falsification threshold but below the 80% support threshold.

## P6 — INCONCLUSIVE

P2 and P3 were supported, P1, P4, and P5 were inconclusive, and no prediction
was falsified. The preregistered primary rule therefore assigns
`INCONCLUSIVE`.

## Diagnostic only

Half-score move occupied only the early bin. Its policy-mean range was 0.071
and score correlation was -0.111. This experiment did not independently
manipulate cash-in timing, so it neither validates nor falsifies half-score move
as a timing axis.

There were 201 work-limited move observations. They remain `UNKNOWN`; no
partial trace contributes a greed ratio. This is bounded evidence, not a
timeout or protocol deviation.

## Scope and next decision

This result covers four fixed percentile policies over shipped Levels 10, 31,
53, and 54 under the 500,000-path-state exact-work cap. It does not establish
human difficulty, fun, preference, MAP-Elites fitness, build potential, or
behavior outside the panel.

The watchdog and executable-closeout defects are resolved. The evidence
consistently shows that greed ratio responds strongly to the policy ladder and
tracks wins, but this experiment does not clear the predeclared coverage,
score-nonredundancy, or stability bars. Greed ratio remains an unadopted
candidate. Do not add seeds or raise this frozen run's cap after seeing the
outcome.
