# RESULT-0038 — deterministic exact greed-ratio closure replication

## Outcome

**Closure: `CLOSED`. Primary domain outcome: `INCONCLUSIVE`.**

The sole registered run completed all 128 paired games without a watchdog
timeout. The production verifier passed. The independent corpus-only reducer
emitted bytes identical to the retained decision, and the executable closure
verifier passed against the preregistered contract identity.

Greed ratio cleared its four behavior checks, but exact-denominator coverage
missed one frozen support condition. The 0.75 policy had zero exact-complete
games on Level 10, so P1 is `INCONCLUSIVE` even though overall and per-policy
coverage cleared their thresholds. P2–P5 are `SUPPORTED`. The registered rule
therefore assigns the primary `INCONCLUSIVE` outcome. No descriptor is adopted.

## Registered predictions

- **P1 — exact coverage: `INCONCLUSIVE`.** 75/128 games were exact-complete
  (58.59%), minimum policy completeness was 50%, and 15/16 policy/level cells
  had exact evidence. Percentile 0.75 × Level 10 was 0/8, missing the support
  rule; no policy was empty and overall coverage was well above falsification.
- **P2 — controlled response: `SUPPORTED`.** Mean exact greed rose strictly:
  0.386, 0.516, 0.725, 0.950. Range was 0.564 against the 0.30 bar.
- **P3 — win rate tracks greed: `SUPPORTED`.** Policy-level Pearson
  correlation was 0.953 against the 0.50 bar.
- **P4 — not merely score: `SUPPORTED`.** Per-game score/greed correlation was
  0.617, below the absolute 0.70 boundary.
- **P5 — greed-bin stability: `SUPPORTED`.** Every policy had 100% of its
  exact-complete games in its modal or adjacent greed bin.
- **P6 — primary: `INCONCLUSIVE`.** P1 was inconclusive; none were falsified.

## Diagnostic only

Half-score move occupied only early and steady bins. Its policy-mean range was
0.074 and score correlation was 0.026. The policies manipulate immediate
reward, not cash-in timing, so this does not validate or falsify a timing axis.

## Scope and next decision

This result covers four fixed percentile policies over shipped Levels 10, 31,
53, and 54 under the 500,000-path-state exact-work cap. It does not establish
human difficulty, fun, preference, MAP-Elites fitness, build potential, or
behavior outside the panel.

The run must not be extended or retried. The owner can either keep greed ratio
as a strong but not adopted candidate and move to an independently manipulated
timing axis, or preregister a materially different denominator strategy that
can cover the hard Level 10 cell. Raising this run's cap or adding seeds after
seeing the empty cell is forbidden.
