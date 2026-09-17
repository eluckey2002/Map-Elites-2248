# Registered protocol — repaired board MAP-Elites confirmation

Registered before generator seed `20260919` or gameplay seeds
`43,000,000–43,000,002` were executed. RESULT-0045 used generator seed
`20260918` and gameplay seeds `42,000,000–42,000,002`; all of those outcomes
are excluded from this successor.

## Declaration and decision

- Primary profile: `candidate-measure`, SHA-256
  `5b1edc87a2e4c7bdcea493c7ba6b03c017fae6a13d05044b8df99586e5d167e4`.
- Context profile: `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Assurance profile: `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- Consuming decision: whether these proxies are usable together for the first
  verified 7×7 board-authoring archive, retaining three designs per cell.
- Unit of generalization: one generated level-board design. Repeated gameplay
  seeds are blocked measurements of that design, not independent units.

## Question

Does one frozen run over 36 freshly generated Level-56 shapes, with the first
16 screen survivors fully authored and evaluated, retain viable boards in at
least two successful-plan-breadth bins, at least two harvesting-advantage bins,
and at least four joint cells?

`SUPPORTED` means all three thresholds clear and the independent verifier
accepts the exact corpus and map. `FALSIFIED` means a threshold fails in a
complete valid run or a complete artifact violates archive integrity.
`INCONCLUSIVE` is reserved for a complete valid artifact whose primary outcome
cannot be assigned by those rules. An invalid, incomplete, or unqualified run
has no domain outcome.

This can support a bounded authoring map on these generated designs. It cannot
show fun, human difficulty, full 49-cell reachability, exhaustive route counts,
future-board performance, or policy optimality.

## Frozen subject and production seam

Final subject identity:
`f385028282b7747ba2e034f0d6828577e2a44ab1a1580b50b3afbe62ab80abb3`.

- Generate 36 shapes at Level 56 with `sampleShape` and generator seed
  `20260919`; preserve sampler order and fully evaluate the first 16 screen
  survivors.
- Apply the existing authoring fitting/holdout pipeline and viability gates.
  Rank eligible boards by ascending verified holdout win rate, with board
  identity as the deterministic tie-break.
- Successful plan breadth: on gameplay seeds `43,000,000–43,000,002`,
  enumerate one-move chains producing 2048 with at most 100,000 path states and
  128 distinct resulting boards. Replay every route and deduplicate identical
  resulting boards. The board proxy is the median count lower bound. A capped
  zero remains visibly `UNKNOWN`; an exhausted zero is an `exact_result`.
- Harvesting advantage: on the identical three seeds, run the same legal action
  generator and exactly 600 expanded states with either score-only state
  ranking or the frozen evolved harvesting ranker. Both stop at first target
  crossing. Per seed, cost is winning moves or `maxMoves + 1` for a bounded
  no-witness; the proxy is mean `(immediateCost - harvestCost) / maxMoves`.
  No-witness stays `UNKNOWN` and is not an impossibility claim.
- Seven breadth bins: 0 verified; 1; 2–3; 4–7; 8–15; 16–31; 32+.
- Seven harvest bins: less than -15%; -15% to -5%; -5% to -1%; within 1%; 1%
  to 5%; 5% to 15%; at least 15%.
- Each joint cell retains no more than three distinct board identities. Name is
  excluded from identity. Empty cells remain empty.
- The registration provenance stamp is outside `artifactIdentity`, matching
  the repository experiment gate. All substantive ordered artifact content is
  inside the identity.

Every screen, authoring game, landmark route, and policy arm uses the real game
rules. Paired policy rows share candidate, seed, spawn stream, target, stopping
rule, action generator, and work cap. A time-budget termination invalidates the
affected evaluation; it cannot become a no-witness.

## Controls

### C1 — breadth manipulation and exact-zero agreement

- **Role:** positive, negative, bounded-search, and producer/verifier agreement.
- **Expected:** controlled boards separate exact zero, one, and multiple
  resulting landmark boards; convergent actions deduplicate; capped zero is
  `UNKNOWN`; exhausted zero is accepted as `exact_result`; planted illegal
  routes fail replay.
- **Failure:** qualification `FAIL`; confirmation does not run.

### C2 — harvesting manipulation

- **Role:** positive, orthogonal, and assignment-null controls.
- **Expected:** fixed open control is at least +0.15, fixed bomb-board control
  is at most -0.05, and identical no-witness arms return exactly zero.
- **Failure:** qualification `FAIL`; confirmation does not run.

### C3 — pairing and objective equivalence

- **Expected:** one immediate and one harvest arm for every candidate and seed,
  equal inputs and limits except ranker, and every win replays to first target
  crossing.
- **Failure:** run `INVALID`; no primary outcome.

### C4 — verifier mutations and identity convention

- **Expected:** clean artifact passes; provenance restamping leaves identity
  valid; forged content/board identity, illegal route, wrong cell, fourth elite,
  duplicate elite, unpaired policy row, and changed source identity each fail.
  A producer artifact's self-identity must also pass the repository experiment
  gate convention that excludes registration.
- **Failure:** qualification `FAIL` for unexpected acceptance or rejection.

### C5 — repository baseline

- **Expected:** exactly 463 tests: 458 pass, the same four deliberate failures,
  and one skip.
- **Failure:** qualification `UNVERIFIED`; confirmation does not run.

### C6 — preregistration and closeout admission

- **Expected:** every freeze prefix matches; the workspace gate discovers
  RESULT-0046; disposable exact-path closeout byte-matches recomputation; the
  output path is absent afterward; unregistered execution refuses before work.
- **Failure:** `UNVERIFIED`; confirmation does not run.

## Predictions

### P1 — successful plan breadth spans the map

`SUPPORTED` at two or more occupied breadth bins; otherwise `FALSIFIED`.

### P2 — harvesting advantage spans the map

`SUPPORTED` at two or more occupied harvesting bins; otherwise `FALSIFIED`.

### P3 — joint occupancy

`SUPPORTED` at four or more occupied cells; otherwise `FALSIFIED`.

### P4 — three-elite archive integrity

`SUPPORTED` only when the independent verifier accepts every retained board,
cell, rank, identity, route, paired comparison, source, rendered map, exact-zero
standing, and registration-independent artifact identity. A complete artifact
that violates one is `FALSIFIED`; failure to complete is `INCONCLUSIVE`.

### P5 — primary domain outcome

All P1–P4 supported gives `SUPPORTED`; any falsification gives `FALSIFIED`;
otherwise `INCONCLUSIVE` for a valid closed run.

## Attempts, budget, and forbidden adaptations

One qualification and one confirmation attempt. Qualification failures may be
diagnosed up to three times only while the frozen harness identity is unchanged.
Confirmation has a 20-minute producer ceiling and 20-minute verifier ceiling.
All 16 evaluations and every matrix row must be retained.

No new generator seed, gameplay seed, sample count, survivor count, level,
landmark, cap, bin, ranking rule, policy, gate, row exclusion, retry, or boundary
change is allowed after reportable outcomes are exposed. Verification and pure
reduction may repeat. Adoption, shipping, retuning, and filling more cells are
separate decisions.
