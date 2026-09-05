---
id: BL-0011
title: Shipped levels are saturated and cannot discriminate policy quality
status: proposed
milestone: measurement-definitions
depends_on: []
updated: 2026-09-05
---

# BL-0011 — Shipped levels cannot tell a good policy from a great one

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## What was found

The bot wins essentially every shipped level. Measured this session: 100% win
rate on levels 1-53 across a 14-level, 40-seed sample, and 71-88% on the newly
shipped 54-58 at their calibrated targets. A metric pinned at or near its
ceiling cannot rank two policies that both reach it.

This matters for how existing results are read. `RESULT-0017`'s MAP-Elites
elite came back at -0.64% against the champion (t = -0.73), reported as "no
difference." On a saturated benchmark, "no difference" is also what a genuinely
better policy would produce. The result is not wrong; its discriminating power
is simply unknown, and nothing currently records that.

## What was built in response

`solver/human-benchmark.js` — the bot replayed against all 12 recorded human
sessions on their exact boards and seeds. This benchmark is not saturated: the
human beats the bot outright on 2 of 12 boards (by 16.5% and 20.9%), and the
bot beats the human on 7. Guarded by `solver/tests/humanBenchmark.test.js`,
whose coverage assertion was verified to fail red against a planted
unresolvable recording.

## Desired outcome

Any future claim that one policy beats another names the benchmark it was
measured on and states that benchmark's discriminating power, rather than
defaulting to shipped-level win rate.

## Acceptance criteria

- A policy comparison run reports results on a benchmark where the incumbent
  does NOT already sit at ceiling.
- `RESULT-0017`'s "no difference" finding is either re-run on the paired human
  benchmark or annotated with the saturation caveat.

## Current evidence

- `solver/human-benchmark.js` (12 paired boards; run it for the current table)
- `EVIDENCE_LEDGER.md` `RESULT-0008` (every level winnable), `RESULT-0017`
- Session measurement: levels 1-53 at 100% bot win rate, 40 seeds each

## Next action

None authorized yet. The benchmark exists and runs; the decision is whether to
re-measure the MAP-Elites comparison against it.

## History

- 2026-09-05 — captured at the owner's request while reviewing where the
  project's real weakness lies.
