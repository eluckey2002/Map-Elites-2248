---
result: RESULT-0046
status: complete
registered: 2026-09-17T06:38:12Z
supersedes: RESULT-0045
reportable: confirmation
version_freeze:
  experiments/RESULT-0046/registered-protocol.md: 3e1a3819387d4f3e
  experiments/RESULT-0046/closeout-contract.json: 2be1659b53060de8
  experiments/RESULT-0046/subject.js: be0419da818544c5
  experiments/RESULT-0046/result.js: 878608323377cc7e
  experiments/RESULT-0046/run.js: 2f9ac38b25efaa6a
  experiments/RESULT-0046/recompute.js: bd23327bb60c1294
  experiments/RESULT-0046/verify.js: 16e2c1f8f183e86c
  experiments/RESULT-0046/run.test.js: 1af0ac634cfaa4fa
  experiments/SEEDS.md: 53a736b7f0c8916d
  solver/tests/boardMapElitesCore.test.js: 15398224e8a49878
  solver/tests/boardMapElitesMeasure.test.js: 90f966344e59628c
  solver/tests/boardMapElitesVerifier.test.js: d69475baf0f9a951
  solver/tests/landmarkFrontier.test.js: b4e53532571f4cd0
  tools/verify-experiments.js: 17d658d9f13a40b0
  solver/board-map-elites-core.js: be98bd148ed6805d
  solver/board-map-elites.js: eafda678b492876e
  solver/verify-board-map-elites.js: 57d701140056b482
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

# Pre-registration — repaired 7×7 board MAP-Elites confirmation

**Registered:** 2026-09-17, before fresh generator or gameplay inputs ran.
**Goal:** active persistent goal for a verified three-elite 7×7 board archive.

The frozen design, proxy formulas, panels, controls, outcome rules, budgets,
exclusions, and adaptation prohibitions are in `registered-protocol.md`, SHA-256
`3e1a3819387d4f3e0a93b542f8567f1ddb64b72504b0d2266157eb081651a90a`.
The executable closeout contract is SHA-256
`2be1659b53060de81188ca6317169373518e64dbaec5268a06df55734c6d5ac5`.
The final subject identity is
`f385028282b7747ba2e034f0d6828577e2a44ab1a1580b50b3afbe62ab80abb3`.

## Question

Does the frozen 36-shape/16-evaluation fresh run occupy at least two bins on
each agreed axis and at least four joint cells while retaining no more than
three distinct independently verified board designs per cell?

## Profiles

Primary `candidate-measure`; context `simulation-policy`; assurance
`mutation-qualification`. Full identities are frozen in the registered design.

## Inputs and matrix

Generator seed `20260919`; Level 56; gameplay seeds
`43,000,000–43,000,002`; 36 sampled shapes; first 16 screen survivors fully
evaluated; two paired policy arms per eligible board and seed. The unit is one
board design. All RESULT-0045 and development inputs are excluded.

## C1 — breadth manipulation and exact-zero agreement

Must PASS every frozen landmark control, including producer/verifier agreement
on exhausted exact-zero and capped `UNKNOWN`, before confirmation.

## C2 — harvesting manipulation

Must PASS the positive, orthogonal, and assignment-null production controls.

## C3 — pairing and objective equivalence

Must PASS the complete paired matrix and first-target-crossing replay checks.

## C4 — verifier mutations and identity convention

Must reject every named content mutant, accept provenance restamping, and match
the repository gate's registration-independent artifact identity convention.

## C5 — repository baseline

Must retain 463 tests: 458 pass, four deliberate failures, one skip.

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

`SUPPORTED` only when the independent verifier passes the exact artifact and
map, including both repaired seams; a demonstrated integrity defect is
`FALSIFIED` and incomplete verification is `INCONCLUSIVE`.

## P5 — primary outcome

All P1–P4 supported gives `SUPPORTED`; any falsification gives `FALSIFIED`;
otherwise `INCONCLUSIVE` for a valid closed run.

## Budget and stops

One qualification and one confirmation attempt. Twenty minutes each for the
producer and independent verifier. Preserve every row. No post-outcome change
to inputs, axes, bins, caps, policies, rules, gates, rankings, exclusions, or
thresholds. Verification and pure reduction may repeat. Adoption is separate.
