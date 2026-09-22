# Pre-registration — family-island persistence and refill search

**Result:** RESULT-0048  
**Registered:** 2026-09-19, before any seed from 44,000,000–44,004,095 was opened.  
**Primary design:** custom `paired-bounded-board-search`  
**Context profile:** `simulation-policy` at SHA-256 `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`  
**Assurance profile:** `mutation-qualification` at SHA-256 `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`

This record is frozen. It searches for playable candidates; it does not adopt a
spawn rule, claim human behavior, or change the shipped game.

## Question and consuming decision

Can high-ratio family openings be separated into enough real islands that the
target family remains playable after two consolidation moves under ordinary
blue-only refills, or does sustained family play require mixed-family refills?

The result may decide only which candidate type proceeds to human play:
island-only openings, mixed-spawn openings, or neither. It cannot ship either.

## Subject, rules, and production seam

The unit is one generated 5×8 opening from the declared family/template panel.
The unchanged production chain, scoring, gravity, and blocker semantics come
from `solver/engine.js`, which mirrors `src/game.js`. The screening policy is
the highest-scoring degree-tiebreak greedy walk with mergeable-prefix
preference disabled. It is a deterministic candidate generator, not a human
proxy and not the shipped target-aware bot.

Every legal move receives ordinary points and chain multipliers. The screen
runs for at most 16 moves or until no legal chain exists. For every retained
candidate it records a normal move budget and score target at the first
conversion-rejoin event, or at move six when the family remains sustained.
Those recommended goals are exact properties of that trace and require human
play before adoption.

## Openings and paired refill arms

Target families are 3, 5, 7, and 9. Within either blue or target family, tile
stages use the production refill weights 60% root, 30% double, 10% quadruple.

Five island templates use full blue separator rows or columns so diagonal
adjacency cannot silently join visual islands:

- horizontal-2: 87.5% target-family opening, two islands;
- horizontal-3: 75%, three islands;
- horizontal-4: 62.5%, four islands;
- vertical-2: 80%, two islands;
- vertical-3: 60%, three islands.

Each opening is replayed through four arms with identical opening and refill
seed identity:

- blue-only: 0% target-family refills;
- mixed-25: 25% target-family refills;
- mixed-50: 50%;
- mixed-75: 75%.

The family-selection draw and size draw are consumed in every arm. Once the
policies choose different chains, later empty-cell counts may diverge; this is
a gameplay consequence, not treated as paired random-stream equality.

## Denominator, seeds, bounds, and completeness

- Qualification fixture seed: 43,999,999, excluded from outcomes.
- Confirmation openings: 4,096 unique seeds, 44,000,000–44,004,095.
- Matrix: 4,096 openings × 4 paired refill arms = 16,384 games.
- Search bound: at most 16 legal moves per game; an early absence of legal
  chains is a genuine lockout. Missing rows, runtime errors, or fewer than all
  four arms invalidate the run rather than count as failure of an island.
- One reportable run, one immutable corpus, no seed replacement, threshold
  change, topology addition, policy change, or rerun after outcomes.

The unit of generalization is this generated panel under this screening policy,
not all possible boards, policies, or players. Bounded absence does not prove
that no suitable board exists.

## Frozen definitions

- A tile belongs to family `r` only when its value is exactly `r × 2ⁿ`.
  Roots other than 2, 3, 5, 7, and 9 are neutral non-family compounds.
- A target-family component uses king-move adjacency among target-family tiles.
- A component is viable when it contains at least one adjacent equal-value
  pair, the required start of a legal chain.
- `notWipedAfterTwo`: at least two viable target-family components after move 2.
- `sustainedAtSix`: move 6 exists, at least eight target-family tiles remain,
  and at least two target-family components remain viable.
- `blue conversion`: every input tile is family 2 and the chain sum lands on
  the target family's exact doubling progression.
- `conversion rejoin`: a later legal chain consumes a tile created by a blue
  conversion.

## Controls

### C1 — clean production-seam baseline

- **Role/profile:** baseline, `simulation-policy` and `mutation-qualification`.
- **Subject/seam:** the real opening generator, screen policy, engine merge and
  gravity functions, and refill function used by confirmation.
- **Expected:** deterministic replay is byte-identical; all five templates
  produce their declared target counts and disconnected components.
- **Failure meaning:** qualification fails and confirmation does not run.
- **Evidence:** focused test output and qualification receipt.

### C2 — positive refill manipulation

- **Role/profile:** positive, `simulation-policy`.
- **Subject/seam:** production refill function at family rates 0 and 1 on the
  same five-cell hole fixture and random seed.
- **Expected:** rate 0 creates five blue tiles; rate 1 creates five target-family
  tiles; both traverse the exact confirmation refill path.
- **Failure meaning:** qualification fails and confirmation does not run.
- **Evidence:** focused test output.

### C3 — known-kill family-classification mutation

- **Role/profile:** known-kill, `mutation-qualification`.
- **Protected claim/seam:** exact doubling-root classification used by board
  measures and candidate selection.
- **Mutation:** label 54 and 60 as recognized family values rather than roots
  27 and 15.
- **Expected detection:** the focused classifier control fails for the named
  values. Equivalent/stillborn/duplicate mutants are not in the denominator.
- **Failure meaning:** qualification fails.
- **Evidence:** failing planted-mutant output retained in qualification.

### C4 — known-kill pairing and artifact mutations

- **Role/profile:** assignment-integrity and known-kill,
  `mutation-qualification`.
- **Protected claim/seam:** every opening has four paired arms and immutable
  outcomes.
- **Mutation:** remove one paired arm; separately alter one retained outcome
  after artifact identity is calculated.
- **Expected detection:** row verification and artifact identity both reject.
- **Failure meaning:** qualification fails.
- **Evidence:** focused verifier tests.

### C5 — objective equivalence

- **Role/profile:** objective-equivalence, `simulation-policy`.
- **Subject/seam:** all paired arms share dimensions, move bound, scoring,
  chain rules, screening policy, opening identity, and family target. Only the
  refill family rate changes.
- **Expected:** structural inspection and artifact verification confirm all
  named fields and four unique arms.
- **Failure meaning:** run invalid.
- **Evidence:** protocol-bound source hashes and corpus verifier.

### C6 — restoration and suite

- **Role/profile:** restoration, `mutation-qualification`.
- **Expected:** planted mutations are disposable; all frozen sources regain
  their registered identities; focused tests pass; the solver suite retains
  only its documented pre-existing failures and skip.
- **Failure meaning:** confirmation stops or closure is unverified.
- **Evidence:** hashes and qualification/closeout commands.

## Decision-bearing predictions

### P1 — islands alone sustain family play

- `SUPPORTED`: in blue-only refills, every target family has at least 10
  move-six sustained boards and at least 5 conversion-rejoin boards.
- `FALSIFIED`: that complete per-family bar is not met.

This is an existence threshold inside the bounded panel, not a population rate.

### P2 — mixed spawning supplies candidates when islands do not

- `SUPPORTED`: P1 is falsified and at least one mixed arm has at least 20
  move-six sustained boards in every target family.
- `FALSIFIED`: P1 is supported, so mixed spawning is not required for this
  candidate-discovery purpose.
- `INCONCLUSIVE`: neither condition holds.

### P3 — scoped disposition

- `ISLANDS_SUFFICIENT` when P1 is supported.
- `MIXED_SPAWN_NEEDED` when P1 is falsified and P2 is supported.
- `INCONCLUSIVE` otherwise.

The archive retains the top 20 exact candidates in every arm, with their
openings, traces, recommended ordinary move limits, and score targets.

## Qualification and stopping rules

1. Register and commit protocol, contract, harness, controls, and seed range.
2. Re-read the committed registration, validate every source hash and path,
   then run the exact closeout route on disposable synthetic artifacts.
3. Run C1–C6 without opening a confirmation seed. Any failure stops.
4. Run the 4,096-board confirmation exactly once and refuse overwrite.
5. Verify artifact identity, source closure, pairing, trace contiguity, and
   deterministic primary reduction.
6. Close every C/P cell. No result authorizes adoption or gameplay changes.

## Frozen identities

The harness subject identity is
`33453c6b5024f0488d9d837b3e87d731140b5a9717fddd2fcfada2dfc98c7a24`,
computed from the complete source-hash map. Individual source identities are
recorded in `protocol.md` and enforced in every corpus.
