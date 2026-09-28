# LC-0003 — three-step target-progress proxy qualification result

**Completed:** 2026-09-28

**Qualification:** `FAIL`

**Scope:** deterministic known-case qualification only; no fresh seeds, policy
comparison, generalization claim, adoption, or champion change

## Primary result

The frozen `threeStepTargetCost` proxy passed its controls but classified only
6 of the 10 decision-bearing Level 54 moves under the all-cells rule. It
therefore stops here and does not advance to disjoint candidate-measure
validation.

| Move | Known effect on champion takeover | Owner cost | Champion cost | Cell |
| ---: | --- | ---: | ---: | --- |
| 1 | harmful, 1 move | 4.807492 | 4.749079 | pass |
| 2 | helpful, 7 moves | 4.731302 | 4.766857 | pass |
| 4 | harmful, 2 moves | 4.693714 | 4.735365 | **fail** |
| 6 | helpful, 4 moves | 4.687111 | 4.615492 | **fail** |
| 8 | harmful, 2 moves | 4.611937 | 4.542349 | pass |
| 9 | harmful, 3 moves | 4.453460 | 4.563175 | **fail** |
| 10 | helpful, 2 moves | 4.196444 | 4.369651 | pass |
| 11 | helpful, 3 moves | 4.445841 | 4.155810 | **fail** |
| 12 | harmful, 1 move | 4.019683 | 3.000000 | pass |
| 13 | helpful, 1 move | 2.000000 | 3.000000 | pass |

Lower cost is better. Neutral moves 3, 5, 7, 14, and 15 were retained as
diagnostics and excluded from the verdict exactly as frozen.

## What the failure means

Every missed arm remained active after three continuation moves, so its cost
was determined by remaining target gap. On harmful moves 4 and 9 the owner arm
was temporarily closer to the target even though full champion takeover later
took two and three moves longer. On helpful moves 6 and 11 it was temporarily
farther from the target even though full takeover later saved four and three
moves.

The result rules out **target status and target gap after exactly three
champion continuation moves** as a sufficient discriminator for these known
decisions. It does not establish that another horizon would work, authorize
horizon tuning, or rule out longer-lived board structure as useful policy
information.

## Controls and identities

The seven retained controls passed: band order, exact third-step horizon,
scale invariance, diagnostic orthogonality, real reference A/A, real-input
integrity, and persistence before verdict. The external-manifest identity
control also passed in the focused test, including rejection of a coherent
recording substitution.

Frozen identity manifest:
`docs/learning-cycles/LC-0003-three-step-target-progress-manifest.json`,
artifact identity
`f1a001094916ac3e6220a030b2cf3e9b83be116f3cd89e48071bc54f86812a7a`.

Raw artifact:
`docs/learning-cycles/LC-0003-three-step-target-progress-raw.json`, internal
identity `e922f53063f04213c49ee7b39cb9aafbf1c3ca4531765f3dcf5b68502b50c8ae`,
file SHA-256
`e6f523dd72f60309351d4a2d8bd5a8d8851c43eadb44b4e3b86fa4f17394b2e2`.

The contract is commit `251fcd8`; the qualified harness is commit `3a18e7e`;
and the bound manifest is commit `8528718`.

Verification after the retained run:

- raw artifact identity valid and frozen verdict recomputed to `FAIL`, 6/10;
- proxy, champion, and predecessor-proxy tests: 38/38 pass;
- human benchmark tests: 7/7 pass;
- experiment gate: pass; and
- all protected hashes match the frozen contract.

## Attempt and boundary

The single retained manifest-driven run collected all 15 cells, persisted the
raw artifact before verdict, and returned `FAIL` with no integrity problem.
There was no setup failure and no retry.

The champion, engine, levels, targets, receipts, recordings, authoring system,
and RESULT-0057/LC-0002 artifacts were not modified. Per the frozen stop rule,
this task introduces no tuned horizon, successor proxy, fresh evidence,
challenger, or adoption proposal.

## Next step

Owner review closes this bounded qualification. If a new task is authorized,
first diagnose what durable board state distinguishes the four misses; do not
fit another horizon to this already-open panel.
