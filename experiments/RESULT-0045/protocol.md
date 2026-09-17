---
result: RESULT-0045
status: registered
registered: 2026-09-17T06:15:45Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0045/registered-protocol.md: 4129ef633d05d421
  experiments/RESULT-0045/closeout-contract.json: 0e55b063ec896ced
  experiments/RESULT-0045/subject.js: 36687e3ea0dd600a
  experiments/RESULT-0045/result.js: fe90a1f2b6366ade
  experiments/RESULT-0045/run.js: 50912e7045cb50c9
  experiments/RESULT-0045/recompute.js: a71e00455c46674b
  experiments/RESULT-0045/verify.js: 8ae0c2b96457b395
  experiments/RESULT-0045/run.test.js: f9d853599deb92e0
  experiments/SEEDS.md: 62781a31cd09c965
  solver/tests/boardMapElitesCore.test.js: 15398224e8a49878
  solver/tests/boardMapElitesMeasure.test.js: 8894dcda0bcfc3a7
  solver/tests/boardMapElitesVerifier.test.js: b2678166d42ccaea
  solver/tests/landmarkFrontier.test.js: b4e53532571f4cd0
  tools/verify-experiments.js: 17d658d9f13a40b0
  solver/board-map-elites-core.js: be98bd148ed6805d
  solver/board-map-elites.js: a1e906313e290392
  solver/verify-board-map-elites.js: 2473efd045e98325
  solver/landmark-frontier.js: 10759bbbddd2f51a
  solver/puzzle-descriptor-witness.js: 0dc5892b5395079b
  solver/oracle/harvest-policy.js: 2b6c6ff96a6d10f6
  solver/oracle/search.js: 592d155120892330
  solver/oracle/simulation.js: 9cafa661bfb9bed1
  solver/oracle/verify.js: 6eeba60f146e1641
  solver/generate-levels.js: 2d08564b6b1829dd
  solver/level-author.js: c0eef4a582ea0c61
  solver/calibrations/calib-1.js: 276fe4c893a193d9
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/benchmark-replay.js: a714232d4e4bf308
  solver/engine.js: 0ed4b31004df13e3
  solver/experiment-guard.js: 200ad71fad9492a3
  src/game.js: 3d405595707621ce
---

# Pre-registration — 7×7 board MAP-Elites confirmation

**Registered:** 2026-09-17, before fresh generator or gameplay inputs were run.
**Goal:** active persistent goal for a three-elite 7×7 board archive.

The complete frozen design, proxy formulas, panels, controls, outcome rules,
budgets, exclusions, and adaptation prohibitions are in
`registered-protocol.md`, SHA-256
`4129ef633d05d421dfd11fb0aafc17dd4611958e86d6d4aaaf723056b024abb4`.
The executable closeout contract is SHA-256
`0e55b063ec896ceda319b260908e07d1241ebe0a4cdca9c55c99ba066b854f78`.
The final subject identity is
`5fa64f1c1334bd82dd51f682960f535e968f258d1c6d8fa1d6055915b5c7a12f`.

## Question

Does the frozen 36-shape/16-evaluation fresh run occupy at least two bins on
each agreed axis and at least four joint cells while retaining no more than
three distinct independently verified board designs per cell?

## Profiles

Primary `candidate-measure`; context `simulation-policy`; assurance
`mutation-qualification`. Full SHA-256 identities are frozen in the registered
protocol.

## Inputs and matrix

Generator seed `20260918`; Level 56; gameplay seeds
`42,000,000–42,000,002`; 36 sampled shapes; first 16 screen survivors fully
evaluated; two paired policy arms per evaluated board and seed. The unit is one
board design. The development generator/gameplay seeds `20260917`/`41,500,000`
are excluded.

## C1 — breadth manipulation

Must PASS exactly as frozen in the registered protocol before confirmation.

## C2 — harvesting manipulation

Must PASS exactly as frozen in the registered protocol before confirmation.

## C3 — pairing and objective equivalence

Must PASS exactly as frozen in the registered protocol and final artifact.

## C4 — verifier mutations

Must PASS every named mutant through the public verifier. Survivors, harness
errors, and timeouts are not kills.

## C5 — repository baseline

Must retain 461 tests: 456 pass, four deliberate failures, one skip.

## C6 — preregistration and closeout admission

Must mechanically validate the committed freeze and exact contract-relative
closeout path before confirmation.

## P1 — successful plan breadth spans the map

`SUPPORTED` at two or more occupied breadth bins; otherwise `FALSIFIED`.

## P2 — harvesting advantage spans the map

`SUPPORTED` at two or more occupied harvesting bins; otherwise `FALSIFIED`.

## P3 — joint occupancy

`SUPPORTED` at four or more occupied cells; otherwise `FALSIFIED`.

## P4 — three-elite archive integrity

`SUPPORTED` only when the independent production verifier passes the exact
artifact and map; a demonstrated integrity defect is `FALSIFIED`.

## P5 — primary outcome

All P1–P4 supported gives `SUPPORTED`; any falsification gives `FALSIFIED`;
otherwise `INCONCLUSIVE` for a valid closed run.

## Budget and stops

One qualification and one confirmation attempt. Twenty minutes each for the
producer and independent verifier. Preserve every row. No post-outcome change
to inputs, axes, bins, caps, policies, rules, gates, rankings, exclusions, or
thresholds. Verification and pure reduction may repeat. Adoption is separate.
