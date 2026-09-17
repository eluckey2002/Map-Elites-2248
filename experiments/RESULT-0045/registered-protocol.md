# Registered protocol — board MAP-Elites on plan breadth × harvesting advantage

Registered before the fresh generator seed `20260918` or gameplay seeds
`42,000,000–42,000,002` were executed. The prior development panel used only
generator seed `20260917` and gameplay seed `41,500,000`; it is excluded.

## Declaration and decision

- Primary profile: `candidate-measure`, SHA-256
  `5b1edc87a2e4c7bdcea493c7ba6b03c017fae6a13d05044b8df99586e5d167e4`.
- Context profile: `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Assurance profile: `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- Consuming decision: whether these two proxies are usable together for the
  first bounded 7×7 board-authoring archive, retaining three designs per cell.
- Unit of generalization: one generated level-board design. Repeated seeds are
  blocked measurements of that design, not independent units.

## Question

Does one frozen run over 36 freshly generated Level-56 shapes, with the first
16 screen survivors fully authored and evaluated, retain viable boards in at
least two successful-plan-breadth bins, at least two harvesting-advantage bins,
and at least four joint cells?

`SUPPORTED` means all three thresholds clear. `FALSIFIED` means any threshold
does not clear in the complete valid run. `INCONCLUSIVE` is reserved for a
complete entitled artifact whose primary outcome cannot be assigned by those
rules; no such branch is expected. An invalid, incomplete, or unqualified run
has no domain outcome.

This can support a bounded authoring map on these generated designs. It cannot
show fun, human difficulty, full 49-cell reachability, exhaustive route counts,
future-board performance, or policy optimality.

## Frozen subject and production seam

Final subject identity:
`5fa64f1c1334bd82dd51f682960f535e968f258d1c6d8fa1d6055915b5c7a12f`.

- Generate 36 shapes at Level 56 with `sampleShape` and generator seed
  `20260918`; preserve sampler order and fully evaluate the first 16 screen
  survivors.
- Apply the existing authoring fitting/holdout pipeline and its existing
  viability gates. Rank eligible boards by ascending verified holdout win rate,
  with board identity as the deterministic tie-break.
- Successful plan breadth: on gameplay seeds `42,000,000–42,000,002`, enumerate
  one-move chains producing 2048 with at most 100,000 path states and 128
  distinct resulting boards. Replay every found route and deduplicate identical
  resulting boards. The board proxy is the median count lower bound. A capped
  zero remains visibly `UNKNOWN`; it is never presented as proof of absence.
- Harvesting advantage: on the identical three seeds, run the same legal action
  generator and exactly 600 expanded states with either score-only state ranking
  or the frozen evolved harvesting ranker. Both stop at first target crossing.
  Per seed, cost is winning moves or `maxMoves + 1` for a bounded no-witness;
  the proxy is mean `(immediateCost - harvestCost) / maxMoves`. No-witness stays
  `UNKNOWN` and is not an impossibility claim.
- Seven breadth bins: 0 verified; 1; 2–3; 4–7; 8–15; 16–31; 32+.
- Seven harvest bins: less than -15%; -15% to -5%; -5% to -1%; within 1%; 1%
  to 5%; 5% to 15%; at least 15%.
- Each joint cell retains no more than three distinct board identities. Name is
  excluded from identity. Empty cells remain empty.

Every screen, authoring game, landmark route, and policy arm uses the real game
rules. Paired policy rows share candidate, seed, spawn stream, target, stopping
rule, action generator, and work cap. A time-budget termination invalidates the
affected evaluation; it cannot be converted to a no-witness.

## Controls

### C1 — breadth manipulation (`candidate-measure`)

- **Role:** positive, negative, and bounded-search controls.
- **Seam:** `solver/landmark-frontier.js` through the public replay path.
- **Expected:** controlled boards separate exact zero, one, and multiple
  resulting landmark boards; convergent actions deduplicate; a capped miss is
  `UNKNOWN`; every planted illegal route fails replay.
- **Failure:** qualification `FAIL`; confirmation does not run.
- **Evidence:** focused landmark and board-map core tests.

### C2 — harvesting manipulation (`candidate-measure`, `simulation-policy`)

- **Role:** positive, orthogonal, and assignment-null controls.
- **Seam:** the exact `measureHarvest` production function and injected oracle
  ranking seam.
- **Expected:** the fixed open control is at least +0.15, the fixed bomb-board
  control is at most -0.05, and identical no-witness arms return exactly zero.
- **Failure:** qualification `FAIL`; confirmation does not run.
- **Evidence:** `solver/tests/boardMapElitesMeasure.test.js`.

### C3 — pairing and objective equivalence (`simulation-policy`)

- **Role:** assignment-integrity and objective-equivalence.
- **Seam:** all paired calls and every archived row.
- **Expected:** exactly one immediate and one harvest arm for every candidate
  and seed, with all inputs and limits equal except ranker; every win replays to
  first target crossing.
- **Failure:** run `INVALID`; no primary outcome.
- **Evidence:** focused tests and public artifact verifier.

### C4 — verifier mutations (`mutation-qualification`)

- **Role:** clean baseline, known kills, coherent substitution, restoration.
- **Seam:** `solver/verify-board-map-elites.js` over a real producer artifact.
- **Expected:** clean artifact passes; forged artifact/board identity, illegal
  route, wrong cell, fourth elite, duplicate elite, unpaired policy row, and
  changed source identity each fail for the named reason; clean source identity
  is restored afterward.
- **Failure:** qualification `FAIL` for an unexpected acceptance/rejection;
  harness error or timeout is `UNVERIFIED`, not a kill.
- **Evidence:** `solver/tests/boardMapElitesVerifier.test.js` and qualification
  receipt. No mutant is excluded from the denominator.

### C5 — repository baseline (`simulation-policy`)

- **Role:** reference.
- **Seam:** `node --test solver/tests/*.test.js`.
- **Expected:** exactly 461 tests: 456 pass, the same four deliberate failures,
  and one skip.
- **Failure:** qualification `UNVERIFIED`; confirmation does not run.
- **Evidence:** qualification receipt.

### C6 — preregistration and closeout admission

- **Role:** source/input integrity and executable closure.
- **Seam:** committed protocol freeze, experiment guard, public verifier, and
  the close-experiment verifier using the exact committed contract.
- **Expected:** every 16-character freeze matches; the workspace gate discovers
  RESULT-0045; a disposable exact-path closure byte-matches recomputation; the
  reportable output path is absent afterward; unregistered execution refuses
  before compute.
- **Failure:** `UNVERIFIED`; confirmation does not run.
- **Evidence:** qualification receipt and pre-outcome admission fields.

## Predictions

### P1 — successful plan breadth spans the map

- `SUPPORTED`: eligible retained boards occupy at least two breadth bins.
- `FALSIFIED`: they occupy fewer than two.
- `INCONCLUSIVE`: artifact is complete but the count cannot be computed.

### P2 — harvesting advantage spans the map

- `SUPPORTED`: eligible retained boards occupy at least two harvesting bins.
- `FALSIFIED`: they occupy fewer than two.
- `INCONCLUSIVE`: artifact is complete but the count cannot be computed.

### P3 — joint occupancy

- `SUPPORTED`: at least four joint cells are occupied.
- `FALSIFIED`: fewer than four are occupied.
- `INCONCLUSIVE`: artifact is complete but occupancy cannot be computed.

### P4 — three-elite archive integrity

- `SUPPORTED`: the independent verifier accepts every retained board, cell,
  rank, identity, route, paired comparison, source, and rendered map, with zero
  cells over capacity and no duplicate board identity.
- `FALSIFIED`: any complete artifact violates one of those properties.
- `INCONCLUSIVE`: verification cannot run to completion.

### P5 — primary domain outcome

- `SUPPORTED`: P1–P4 are all `SUPPORTED`.
- `FALSIFIED`: any of P1–P4 is `FALSIFIED`.
- `INCONCLUSIVE`: otherwise, only for a valid closed run.

## Attempts, budget, and forbidden adaptations

One qualification attempt after registration and one confirmation attempt.
Qualification failures may be diagnosed up to three times only when the frozen
harness identity has not changed. Confirmation is sequential and has a
20-minute producer ceiling plus a 20-minute independent-verifier ceiling. The
16 full evaluations and every matrix row must be retained.

No new generator seed, gameplay seed, sample count, survivor count, level,
landmark, cap, bin, ranking rule, policy, gate, row exclusion, retry, or boundary
change is allowed after reportable outcomes are exposed. Verification and pure
reduction may repeat. Adoption, shipping, boundary retuning, and filling more
cells are separate decisions.

