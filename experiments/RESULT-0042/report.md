# RESULT-0042 — calibrated-watchdog exact greed-ratio validation

## Outcome

**Closure: `UNVERIFIED`. Domain outcome: none.**

The sole registered confirmation completed all 128 paired games with zero
watchdog timeouts. The production verifier passed, and the independent
corpus-only reducer reproduced the retained decision byte-for-byte.

The complete corpus supplies descriptive behavior data. Exact mean greed rose from 0.372 to
0.946 across the four scripted policies, policy win rate tracked greed at
`r = 0.940`, and per-game score/greed correlation remained below the frozen
redundancy boundary at `r = 0.660`. However, the frozen closeout contract's
recomputation paths are repository-root-relative while its `cwd: "."` is
resolved from the experiment directory. The required executable closeout
therefore exits 1 without running the reducer. The frozen contract cannot be
repaired after outcomes, so P1–P6 remain `UNVERIFIED` and no domain outcome or
descriptor adoption follows.

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
reasons. The unstable middle-bin fixture produced exact-modal share 0.50,
proving the replacement stability statistic can fail in the middle bin.

## C5 — PASS

The independent reducer byte-matched the registered analysis on valid,
work-limited, zero-exact-policy, null-cell, and non-default-policy fixtures and
on the retained confirmation corpus.

## C6 — PASS

Changing only half-score timing left P1–P5 and greed policy summaries
unchanged.

## C7 — PASS

The repository baseline retained 420 tests: 415 passed, the same four
documented deliberate failures remained, and one test was skipped. All 27
focused qualification tests passed.

## P1 — UNVERIFIED

All 128 games completed and 68 were exact-complete (53.125%). Minimum policy
completeness was 50%, but 15/16 policy/level cells had exact evidence: the
100% policy × Level 10 cell was 0/8. This misses support without reaching the
falsification rule in the retained calculation, but the failed frozen closeout
prevents an entitled prediction outcome.

## P2 — UNVERIFIED

Mean exact greed rose strictly across the four policies: 0.372, 0.529, 0.725,
and 0.946. The range was 0.574 against the 0.30 support threshold, but this
remains descriptive because executable closeout failed.

## P3 — UNVERIFIED

Policy-level win rate and mean exact greed had Pearson `r = 0.940`, above the
0.50 support threshold. Win rates were 0%, 0%, 25%, and 75%. The prediction is
not assigned without verified closeout.

## P4 — UNVERIFIED

Per-game score and exact greed had Pearson `r = 0.660`, below the absolute
0.70 redundancy boundary. The prediction is not assigned without verified
closeout.

## P5 — UNVERIFIED

Exact modal-bin shares were 94.4%, 88.9%, 75.0%, and 100%. The minimum was
above the 60% falsification threshold but below the 80% support threshold in
the retained calculation. The prediction is not assigned without verified
closeout.

## P6 — UNVERIFIED

The retained reducer calculated P2–P4 as supported and P1 and P5 as
inconclusive, but the experiment is not entitled to a primary domain outcome
because its executable closeout contract cannot run as frozen.

## Diagnostic only

Half-score move occupied early and steady bins. Its policy-mean range was
0.093 and score correlation was 0.050. This experiment did not independently
manipulate cash-in timing, so it neither validates nor falsifies half-score move
as a timing axis.

There were 198 work-limited move observations. They remain `UNKNOWN`; no
partial trace contributes a greed ratio. This is expected bounded evidence,
not a timeout or protocol deviation.

## Scope and next decision

This result covers four fixed percentile policies over shipped Levels 10, 31,
53, and 54 under the 500,000-path-state exact-work cap. It does not establish
human difficulty, fun, preference, MAP-Elites fitness, build potential, or
behavior outside the panel.

The watchdog defect is resolved operationally: it no longer prevented the
registered games from completing. A fresh successor may correct only the
closeout working directory, keep the same thresholds and computation bounds,
and use new seeds. This frozen run must not be extended or retried.

## Deviation

The preregistered closeout contract declared repository-root-relative argv
with an experiment-directory-relative working directory. The required verifier
exited 1 with a recomputation path error. This is a closure-contract defect,
not a game timeout, but it prevents `CLOSED` standing.
