# Report — RESULT-0021

This report resolves every check declared in [protocol.md](protocol.md). The
protocol and decision rule were committed at `e63f83c` before the one all-level
measurement; the measurement ran from descendant `0acfb6b`.

The protocol's frontmatter remains `status: registered` deliberately: the
measurement freezes the complete protocol file hash, so changing that field
after data would invalidate the receipt. Completion is recorded by this report,
the accepted ledger entry, and the run receipt instead of rewriting the frozen
preregistration.

## Canonical evidence

- Admission receipt: `admission.json`, identity `aae5beca8a054b5d…`.
- Real-subject artifact: `measurement.json`, artifact identity
  `73dfd91b04229cfc…`, 6,360 complete rows.
- Challenge receipt and bundle: `evidence/challenge-bundle.json`, receipt
  identity `95d4552269c15c8f…`, bundle identity `c099d3a38caa9892…`.
- Frozen decision: `decision-rule.json`.
- Durable recheck: `node experiments/RESULT-0021/verify.js`.

The admission receipt is the ledger-facing identity. It binds the exact paths,
file hashes, artifact and bundle identities, sources, claim, subject,
statistics, challenge outcomes, and protocol registration. The bundle remains
the object the production selector consumes.

## C1 — deterministic real seam — **PASS**

Before the confirmation run, the named fixed-board test replayed the same board
and player identically. The bounded seed-variance test then produced all 12
declared rows through `solver/level-author.js#playMeasured`; no missing or
non-finite score was accepted.

## C2 — positive broken-twin control — **PASS**

Before the confirmation run, the frozen production check returned PASS on a
bounded real-seam subject and FAIL on its controlled twin. The twin changed
only the assignment of sample-B scores across candidates. Both observations
used `measureSubject -> analyzeArtifact -> issueEntitlement`; no test-only
verifier decided either outcome.

## C3 — suite unchanged — **PASS**

After the challenge:

- focused generator, evaluator, seed-variance, and experiment tests: **43/43
  pass**;
- full suite with required localhost/network access: **284 total, 280 pass, 4
  fail**.

The four failures are exactly the baseline four: the three named stale
candidate receipts and the root checkout's two unrelated uncommitted `.orch`
ticket directories reported by one live linked-worktree test. No new failure.
A sandboxed attempt first added listener and DNS errors; those disappeared when
the exact suite was rerun with the capabilities the tests require and are not
counted as product failures.

## P1 — structural ranking stability — **SUPPORTED**

Pearson correlation between the two vectors of 53 per-level sample means:

`r = 0.999428550196873`

This clears the predeclared 0.95 support threshold. The two samples are the
fixed disjoint ranges 30,000,000–30,000,059 and 31,000,000–31,000,059, 60 games
per level in each.

This is a current replication of the shape of the old claim, not a
reconstruction of its exact `r = 0.98` result.

## P2 — single-seed candidate differentiation — **SUPPORTED**

Variance components, in squared score points:

| Component | Estimate |
| --- | ---: |
| pooled within-level seed variance | 84,459,875.41 |
| between-candidate variance | 2,481,397,518.78 |
| between / within | **29.3796x** |
| single-seed reliability | **0.967083** |

The between-candidate component is about 29.38 times the within-level seed
component. The reliability estimate clears the predeclared 0.80 support
threshold.

## P3 — repeated-human-seed design verdict — **SUPPORTED**

Both P1 and P2 are supported. The check's exact verdict is:

`NOT_SUPPORTED_AS_NECESSARY_FOR_SEED_CONTROL`

Repeated human plays are therefore not supported as necessary merely to
average away seed noise when differentiating structurally different
candidates under this current evaluator. This does **not** say human play is
unnecessary: one or more human sessions may still be essential for fun,
learnability, frustration, strategy discovery, or other qualitative judgments
the bot score does not measure.

## P4 — challenge entitlement — **PASS**

The same production check observed:

- real subject and current identities: **PASS**;
- controlled reversed-sample twin: **FAIL**, `r = -0.64645`, reliability
  `0.16672`;
- real production batch under the valid verdict: **PASS**, 15 selected names;
- identical batch under the broken verdict: **FAIL**, no selected names;
- one evaluator-identity mutation: **FAIL**, covered identity mismatch.

The challenge receipt binds the exact 53 candidates, 6,360 measurements,
metric, seed ranges, source identities, execution path, strict protocol-to-run
commit ordering, decision rule, batch identity, and actual consumer outputs.
The fresh one-shot verifier returned `SEED VARIANCE CHALLENGE PASS
95d45522…`; the durable result-local verifier calls the same production bundle
verifier and selector while checking the recorded historical commit ordering.

## P5 — historical r = 0.98 provenance — **INCONCLUSIVE**

The sentence is located at `HANDOFF.md` and was introduced by commit
`c782111d46842e56f2fd10b273e1ff0a53b30ff0`. That commit changes only
`HANDOFF.md`. No original measurement artifact, seed ranges, candidate list,
statistic implementation, or reproducible command was found in repository
history.

Accordingly, the exact historical `r = 0.98` is not admitted as supported and
is not called falsified either: there is no frozen original subject to
recompute. The current `r = 0.99943` cannot retroactively supply that missing
provenance.

## Bottom line

The current seed-variance proposition is entitled and supported. The historical
number is not. The design verdict is narrow: do not budget repeated human games
for seed averaging alone; budget human play according to the qualitative
questions humans are actually needed to answer.
