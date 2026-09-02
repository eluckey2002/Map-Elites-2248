---
result: RESULT-0021
status: complete
registered: 2026-09-01T23:54:50.374Z
supersedes: null
reportable: confirmation
version_freeze:
  solver/bot.js: 8d0dec5f6b0669ca
  solver/engine.js: 4e2323b9218aed6a
  solver/policy-eval.js: ab76eeb937b61b85
  src/game.js: 541baa1c05cb0dc4
  solver/level-author.js: 305731fbfd7e6640
  solver/seed-variance.js: d72de6e1703df39a
  solver/generate-levels.js: 2d08564b6b1829dd
---

# Pre-registration — seed variance across shipped levels

**Registered:** 2026-09-01, before any all-level seed-variance measurement.
**Goal:** `.orch/runs/2026-09-01-seed-variance-verdict/spec.md`.

This record is frozen. If the question, statistic, thresholds, denominator, or
seeds change, that is a new result rather than an edit to this one.

---

## Question

Under the current 53 shipped levels and reference player, do two disjoint
60-game samples preserve structural candidate ranking, and is the estimated
between-candidate variance large enough relative to within-level seed variance
that repeated human seeds are not required solely to control seed noise during
candidate differentiation?

## Why this is being asked

`HANDOFF.md` says that structurally different levels agreed at `r = 0.98` over
disjoint 60-game samples. Repository history locates that sentence at commit
`c782111d`, but that commit changes only `HANDOFF.md`; no measurement artifact,
seed ranges, statistic implementation, or reproducible command accompanies it.
The historical number therefore needs reconstruction or explicit rejection as
unsupported, and the practical design question needs a current entitled run.

## Shape of the run

One confirmation over the complete current shipped-level population. This is
not a search, sweep, parameter fit, level comparison, or policy optimization.
There is no pilot and no alternate-seed rerun.

## The subject under test

The current `src/game.js` `LEVELS` array (53 candidates), evaluated by the
current reference policy through `solver/level-author.js#playMeasured` with
`target: Infinity`. The metric is terminal achievable score before target
stopping. The decision check and consumer are the frozen
`solver/seed-variance.js` and `solver/generate-levels.js` files.

## Denominator

53 levels x 120 games = **6,360 games**. For every level, sample A contains 60
games and sample B contains 60 games. The samples are unpaired because their
seed ranges are disjoint. Every level receives every seed in both ranges.

## Seeds

- **Sample A:** 30,000,000–30,000,059 (60 seeds).
- **Sample B:** 31,000,000–31,000,059 (60 seeds).

These ranges are disjoint from each other and from the known fitting (0–149),
holdout (100,000–100,299), generator screen (500,000–500,023), bounded test
(9.1m/9.2m), target-aware (12m/13m), and generated-corpus (20m/21m/22m)
ranges. Both declared samples are reportable; no other seed data may replace
them.

## Starting state, recorded independently

- Pre-registration base: git HEAD `b22b435`, branch
  `codex/seed-variance-challenge`; code result `b149eda`.
- Full suite: **284 tests, 280 pass, 4 fail**. Three failures are the named,
  pre-existing stale receipts `candidate-levels-52.json`,
  `candidate-levels-54.json`, and `candidate-levels.json`. The fourth is the
  live repository-baseline check naming two unrelated uncommitted `.orch`
  ticket directories in the root checkout. None is caused by this experiment.
- Focused code evidence before registration: 24/24 pass; seed-variance 8/8.

## Version hashes (sha256, first 16)

| File | Hash | Role |
| --- | --- | --- |
| `src/game.js` | `541baa1c05cb0dc4` | exact 53-level subject |
| `solver/engine.js` | `4e2323b9218aed6a` | game mechanics and seeded RNG |
| `solver/bot.js` | `8d0dec5f6b0669ca` | reference player policy |
| `solver/level-author.js` | `305731fbfd7e6640` | real `playMeasured` evaluator seam |
| `solver/seed-variance.js` | `d72de6e1703df39a` | measurement, reduction, check, challenge verifier |
| `solver/generate-levels.js` | `2d08564b6b1829dd` | downstream selection consumer |
| `solver/policy-eval.js` | `ab76eeb937b61b85` | default repository experiment freeze |

The downstream consumer subject is separately bound in the challenge receipt
to tracked `solver/generated-batch-04.json`, full SHA-256
`5b0dd3bfd0d79a977d68f54ad1c59cc736b50c98459a3113e05f1ef2fa5a4c1f`.

## Statistics fixed before outcomes

- Pearson correlation between the 53 sample-A and sample-B per-level means.
- Pooled within-level single-game variance (`MS_within`).
- One-way random-effects between-candidate variance component:
  `max(0, (MS_between - MS_within) / 120)`.
- Between/within variance ratio.
- Single-seed reliability: `between / (between + within)`.

These are computed by the frozen production check, not by report prose.

## Checks, classified before outcomes are assigned

### C1 — deterministic real seam (PASS / FAIL)

Before the all-level run, the existing real-seam tests must show the same board
and same player replaying identically and the bounded seed-variance fixture
must produce the complete declared number of rows through `playMeasured`.
Missing or non-deterministic rows are `FAIL` and stop the run.

### C2 — positive broken-twin control (PASS / FAIL)

Before the all-level run, `solver/tests/seedVariance.test.js` must show the
production check reaching PASS on its bounded real-seam subject and FAIL on a
controlled twin made only by reversing sample-B candidate assignments. Both
must use the same `issueEntitlement` and analysis path. Anything else is
`FAIL` and stops the run.

### C3 — suite unchanged (PASS / FAIL)

After the challenge, the focused suite must remain green. The full suite must
have no failure beyond the same four baseline failures named above. A new or
missing failure is `FAIL`; known failures remain failures, not passes.

### P1 — structural ranking stability (SUPPORTED / FALSIFIED / INCONCLUSIVE)

- `SUPPORTED`: Pearson >= 0.95.
- `FALSIFIED`: Pearson < 0.80.
- `INCONCLUSIVE`: otherwise.

The exact historical `r = 0.98` is a separate provenance proposition. A new
correlation near 0.98 does not retroactively prove the old number.

### P2 — single-seed candidate differentiation (SUPPORTED / FALSIFIED / INCONCLUSIVE)

- `SUPPORTED`: single-seed reliability >= 0.80.
- `FALSIFIED`: single-seed reliability < 0.50.
- `INCONCLUSIVE`: otherwise.

The pooled within variance, between-candidate variance component, and their
ratio are always reported, including on an unfavorable outcome.

### P3 — repeated-human-seed design verdict (SUPPORTED / FALSIFIED / INCONCLUSIVE)

- `SUPPORTED` means repeated human seeds are **not supported as necessary for
  seed-noise control**: both P1 and P2 are `SUPPORTED`.
- `FALSIFIED` means repeated human seeds are required for seed-noise control:
  either P1 or P2 is `FALSIFIED`.
- `INCONCLUSIVE`: all other combinations.

This verdict says nothing about the need for human qualitative judgment,
learning-curve assessment, fun, or usability playtesting.

### P4 — challenge entitlement (PASS / FAIL)

The final bundle must bind the exact claim, artifact, 53 candidates, metric,
seed ranges, protocol identity and strict-ancestor commit, decision rule,
covered code identities, controlled broken twin, exact consumer batch, and
consumer observation. The production verifier must replay valid PASS, broken
FAIL, downstream valid selection, broken withholding, and covered-identity
mutation invalidation. Any missing observation is `FAIL` and forbids ledger
admission.

### P5 — historical r = 0.98 provenance (SUPPORTED / FALSIFIED / INCONCLUSIVE)

- `SUPPORTED`: a pre-existing repository artifact fixes the original samples,
  subjects, computation, and result.
- `FALSIFIED`: a pre-existing artifact fixes them and recomputes to a different
  value.
- `INCONCLUSIVE`: the sentence can be located but its evidence cannot.

The investigation has so far found only the sentence-introducing commit. The
check remains open until the final report, but current evidence predicts
`INCONCLUSIVE`, not acceptance by repetition.

## Budget and stopping rules

1. Commit this completed protocol and `decision-rule.json` before controls or
   all-level measurement.
2. Run C1 and C2. Stop without measurement if either fails.
3. Run the 6,360-game confirmation exactly once.
4. Build one challenge bundle, then invoke the verifier afresh once.
5. No alternate seeds, threshold changes, statistic changes, or re-runs.
6. If a frozen identity changes, stop and supersede this protocol.
7. Admit a ledger result only if P4 is PASS; report unfavorable P1–P3 outcomes
   honestly rather than withholding them.

## Instrument bound

The load-bearing instrument is the frozen production artifact analyzer and
challenge verifier. Console output, report calculations, test fixtures, and the
historical prose sentence are diagnostic only. The report may format numbers
from the challenge receipt but may not recompute a different acceptance test.

## Adoption is a separate decision

This run decides only whether repeated human seeds are necessary to control
seed variance when differentiating candidates. It neither removes humans from
level design nor decides how much qualitative human play is needed.
