---
run: 2026-09-01-seed-variance-verdict
routing:
  pack: orch-research-pack
predecessor: b149eda598d59a9db3750cbbf721c3a9f6dad078
---

# Seed-variance evidence verdict

## Objective

Use the frozen entitled check to decide whether structural ranking over all 53
shipped levels is stable across two disjoint 60-game seed samples, quantify
within-level seed variance against the between-candidate variance component,
and state whether repeated human seeds are needed specifically to control seed
noise in candidate differentiation.

## Research question

Under the current shipped levels, reference policy, engine, evaluator, and
selector identities, do two disjoint 60-game samples meet the preregistered
ranking-stability and single-seed-reliability thresholds?

## Source policy

- Historical reconstruction is repository-primary only: git history,
  `HANDOFF.md`, and tracked measurement artifacts.
- Current evidence is produced only through
  `solver/seed-variance.js#measureSubject -> solver/level-author.js#playMeasured`.
- The candidate consumer is the production
  `solver/generate-levels.js#main -> selectShortlist -> rankShortlist` path,
  exercised against tracked `solver/generated-batch-04.json`.
- No chat claim, backlog status, synthetic helper output, or report prose is
  accepted as measurement evidence.

## Rigor bar

1. Register and commit `experiments/RESULT-0021/protocol.md` and its decision
   rule before any all-level measurement; the registration commit must be a
   strict ancestor of the measurement commit.
2. Measure all 53 shipped levels on fixed, disjoint ranges 30,000,000–30,000,059
   and 31,000,000–31,000,059: 120 games per level, 6,360 games total.
3. Report Pearson correlation between the two per-level sample means, pooled
   within-level variance, the one-way random-effects between-candidate variance
   component, their ratio, and single-seed reliability.
4. The production verifier must issue PASS on the valid artifact and FAIL on a
   controlled twin that reverses sample-B candidate assignments, using the same
   check and decision rule.
5. A fresh verifier invocation must replay the real selector against the exact
   batch, and one covered-identity mutation must invalidate the bundle.
6. The report must separate the historical sentence's evidence status from the
   current replication result and limit the human-play conclusion to seed-noise
   control; it does not decide qualitative human judgment.
7. Only after 1–6 pass may `EVIDENCE_LEDGER.md` receive an append-only
   `heuristic_observation` record citing the artifact and challenge bundle.

## Predetermined decision rule

- `SUPPORTED`: Pearson >= 0.95 and single-seed reliability >= 0.80.
- `REPEATED_HUMAN_SEEDS_REQUIRED_FOR_SEED_CONTROL`: Pearson < 0.80 or
  single-seed reliability < 0.50.
- `INCONCLUSIVE`: anything else.
- The exact historical `r = 0.98` is reconstructed as unsupported unless a
  pre-existing primary measurement artifact is found; a new value cannot
  retroactively prove it.

## Non-goals

- Decide whether human taste, fun, learnability, or qualitative playtesting is
  needed.
- Change game rules, levels, scoring, policy, candidate identities, or selector
  behavior.
- Tune thresholds after observing data or rerun on alternate seeds.
- Repair unrelated generated candidates or stale receipts.

## Acceptance as runnable checks

```bash
node solver/seed-variance.js run --protocol experiments/RESULT-0021/protocol.md --out experiments/RESULT-0021/measurement.json --sample-a-start 30000000 --sample-b-start 31000000 --count 60
node solver/seed-variance.js challenge --artifact experiments/RESULT-0021/measurement.json --protocol experiments/RESULT-0021/protocol.md --decision-rule experiments/RESULT-0021/decision-rule.json --batch solver/generated-batch-04.json --out-dir experiments/RESULT-0021/evidence
node solver/seed-variance.js verify --artifact experiments/RESULT-0021/measurement.json --protocol experiments/RESULT-0021/protocol.md --decision-rule experiments/RESULT-0021/decision-rule.json --batch solver/generated-batch-04.json --evidence-dir experiments/RESULT-0021/evidence
node tools/verify-experiments.js
node --test solver/tests/generateLevels.test.js solver/tests/levelAuthor.test.js solver/tests/seedVariance.test.js solver/tests/experiments.test.js
git diff --check
```

## Bound

One preregistered confirmation run, one challenge construction, one independent
fresh verification, and one append-only ledger admission if entitled. No
alternate seed run.

## Baseline

- Code result: `b149eda598d59a9db3750cbbf721c3a9f6dad078`.
- Full suite: 284 total, 280 pass, four named baseline failures — three stale
  candidate receipts and one unrelated root-checkout `.orch` state failure.
