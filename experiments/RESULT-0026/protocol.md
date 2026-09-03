---
result: RESULT-0026
status: registered
registered: 2026-09-03T01:35:00Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0026/frozen-handmade-policy.js: f25337aeb4122569
  experiments/RESULT-0026/subject.js: 0dd1c274d1a5e144
  experiments/RESULT-0026/run.js: 371b723f014fd906
  experiments/RESULT-0026/gate.js: 059e5fb9fe0d66b7
  experiments/RESULT-0026/recompute.js: d44bbd7127553ca4
  experiments/RESULT-0026/admit.js: 147f0d8c4ef0b4d4
  experiments/RESULT-0026/policy-comparison-gate.test.js: 667f9e2954c8c18d
  solver/bot.js: 1f1a554f3a022eba
  solver/engine.js: 451bea941dd1971e
  solver/experiment-guard.js: 8dd7b3497f8d2b0f
  src/game.js: 541baa1c05cb0dc4
  tools/verify-experiments.js: e958d0e052a1fd63
  docs/CHECK-CARDS.md: 4d62fee0373dbee2
---

# Pre-registration — frozen handmade policy confirmation

**Registered:** 2026-09-02 local time, before any seed in the reportable
`24000000..24000024` range is played or inspected.
**Goal:** `.orch/tickets/2026-09-02-result-0026-confirmation/DGS-001.md`

This record is frozen. Any policy, seed, level, outcome, threshold, loss rule,
or arithmetic change creates a superseding result rather than editing this run.

## Question

Across the nine fixed levels, does the frozen handmade policy reach the shipped
target in fewer moves than the current reference policy on fresh paired seeds,
without converting a reference win into a loss under the real move budget?

## Why this is being asked

The retrospective sandbox at `me-oe` commit `7f71705` reported a descriptive
`0.72` moves saved per game on these nine levels and 25 disjoint seeds. The
aggregate was reproduced in `CPA-001`, but it is not confirmatory evidence: the
policy, runner, result, and prose landed together; no raw cells or Challenge
Receipt were committed; and its `t=2.69` treated 225 cells as independent.

Source inspection also found that the sandbox runner executes up to five moves
beyond `level.moves`. Its printed win rate can therefore count a target reached
after the shipped game should have ended. That runner is not the instrument for
this confirmation. RESULT-0026 freezes the policy but measures it through the
real move budget.

## Shape of the run

One fixed-policy, paired-seed confirmation. It is not policy tuning, threshold
search, candidate-coverage measurement, MAP-Elites, OpenEvolve, co-evolution,
level selection, or production promotion.

## Subjects

- **Reference:** current `solver/bot.js` with its current defaults, explicitly
  `offerFull: 0` and `tieBreak: degree`.
- **Handmade:** the frozen port in
  `experiments/RESULT-0026/frozen-handmade-policy.js`, derived from source hash
  `19ed34fa...`. On bomb-bearing states it delegates to the reference policy
  before every other rule. Otherwise it takes a bounded untrimmed immediate
  target finish if offered, then searches exact lattice sums from
  `64 x tileScale` down by powers of two. Among equal target sums it prefers
  pre-gravity adjacency to tiles at least `32 x tileScale`, then chain length.
  Its exact-sum DFS budget is 150,000 nodes per attempted value.

The integrated targeted-chain generator is not used. This experiment tests the
handmade policy's separate DFS implementation.

## Denominator

- Levels: `5,11,17,23,29,35,41,47,50`.
- Confirmation seeds: 25.
- Arms: two.
- Reportable cells: `9 levels x 25 seeds x 2 policies = 450` games, forming
  225 paired policy comparisons.
- Each game stops immediately at target, bomb resolution, no legal move, or
  the shipped `level.moves` budget. No policy receives extra play.

Level 50 is retained as the known adverse stratum. The result generalizes only
over this fixed level panel and seed sample.

## Seeds

- **Qualification only:** burned seed `7000000` on levels 5 and 50; four cells,
  non-reportable.
- **Confirmation:** `24000000..24000024`; 25 seeds, reportable once.

Repository search before registration found no occurrence of the confirmation
range. The prior sandbox ranges `6000000..6000024` and `7000000..7000024` are
burned and forbidden from the reportable artifact.

## Starting state, recorded independently

- Local `main` at `a5c1fc25ace7c5a257f0decb38cb1f3c1c5e420b` before this registration commit.
- `node tools/verify-experiments.js`: `EXPERIMENT GATE PASS`.
- Pre-change focused panel: 37/39 passed. The two failures were already present
  and are outside this slice: RESULT-0024's historical refusal assertion is
  preempted by its completed protocol's old bot freeze, and the Bot Vision
  server cannot bind `127.0.0.1` inside this sandbox.
- RESULT-0026's pre-registration qualification suite passed 5/5 before the
  provenance check was strengthened. An adversarial review then found three
  false-authority paths and one success-path crash; all were repaired before
  this protocol. The committed suite must pass after registration before any
  qualification artifact is written.

## Version hashes (sha256, first 16)

The frontmatter freezes every runtime source plus the permanent negative tests
and Check Card. Artifacts record full SHA-256 identities for the nine runtime
sources they load. Any mismatch before confirmation is a breach; do not update
the hash in place.

## Checks, classified before outcomes

### C1 — real qualification replay

`gate.js#verifyArtifact` must PASS the four real burned-seed qualification
cells by independently repeating every policy choice and game transition. It
must reproduce the pinned outcomes: reference L5 `2400/7`, reference L50
`76704/20`, handmade L5 `2688/7`, and handmade L50 `76320/19`. Every move count
must be at or below the shipped budget.

### C2 — same-verifier challenge and invalidation

The Challenge Receipt must record:

- PASS on the exact real qualification artifact.
- FAIL after changing one recorded score and recomputing the artifact identity.
- FAIL after changing the frozen handmade-policy source identity and
  recomputing the artifact identity.

Downstream validators must regenerate this challenge from the real subject;
an internally consistent rewritten receipt is insufficient.

### C3 — downstream receipt consumption

Before reading any confirmation seed, `run.js confirmation` must validate the
exact committed qualification and Challenge Receipt and refuse exploratory
confirmation. The confirmation artifact must record the consumed receipt
identity. `admit.js` must consume the same receipt again, regenerate its
challenge, verify the confirmation, and refuse any mismatch.

### C4 — matrix, provenance, and source closure

The gate must verify the exact two-policy, nine-level, 25-seed matrix; unique
cell identities; current full source hashes; an artifact identity that includes
its registration stamp; and the real reachable commit that first added this
protocol. Any missing, duplicate, exploratory, foreign, or stale identity is a
FAIL.

### P1 — primary moves-to-target prediction

For each paired cell, define effective moves as actual moves-to-target for a
win and `moveBudget + 1` for a loss. Define savings as reference effective moves
minus handmade effective moves. Average within level first, then across the
nine level means.

Uncertainty uses the two-way level/seed cluster intersection correction:

`SE = sqrt(max(0, SE_level^2 + SE_seed^2 - SE_cell^2))`

where each component is the sample standard deviation of its cluster means (or
cells) divided by the square root of its count.

- `SUPPORTED` — P2 passes, mean savings is positive, and `t >= 2`.
- `FALSIFIED` — P2 fails, or mean savings is non-positive with `t <= -2`.
- `INCONCLUSIVE` — every other outcome.

### P2 — win non-regression

PASS only when no paired cell is a reference win and handmade loss, and total
handmade wins are at least total reference wins. One such regression falsifies
the combined faster-without-win-regression hypothesis regardless of mean moves.

### P3 — runtime and search-bound diagnostic

Record per-cell chooser runtime and total runtime for both arms. The comparison
is not compute matched, and runtime cannot change P1 or P2. The frozen policy's
150,000-node limit is source-pinned, but it exposes no per-move cap-hit status;
no completeness claim follows.

### P4 — independent arithmetic

`recompute.js` imports none of the runner, subject, gate, policy, or admission
modules. Its complete-matrix check and independently written calculation must
match the primary summary exactly. `admit.js` itself executes the frozen
recomputation and compares the entire receipt; a caller-created self-hash is not
evidence of execution.

### P5 — evidence entitlement

`ADMISSIBLE` requires C1-C4 PASS, P1/P2 resolved under the frozen rules, P4
exact agreement, confirmation-recorded consumption of the Challenge Receipt,
and final admission consumption of that same receipt. Entitlement is separate
from the empirical verdict: `SUPPORTED`, `FALSIFIED`, and `INCONCLUSIVE` can all
be honestly admissible outcomes.

## Budget and stopping rules

1. Commit this protocol, all runtime sources, permanent tests, and Check Card
   before writing a qualification or confirmation artifact.
2. Run the RESULT-0026 suite and repository experiment gate. Stop on a new
   failure.
3. Produce the four-cell burned-seed qualification once. Issue its Challenge
   Receipt and commit both before confirmation.
4. Invoke confirmation exactly once. Do not retry with alternate seeds or
   change the policy, arithmetic, thresholds, or levels after seeing outcomes.
5. Produce one independent arithmetic receipt and one downstream admission.
6. A crash or identity failure after confirmation is reported as a breach, not
   repaired by rerunning the games.

Hard maximum before confirmation: the fixed qualification and permanent
qualification tests. Hard reportable maximum: 450 games, 225 paired cells. No
external calls or human time.

## Instrument bound

Moves-to-target and target attainment are load-bearing. Score, chain contents,
termination reason, and runtime are preserved for replay and diagnosis but do
not become alternative success criteria. The loss penalty affects analysis
only; it never grants another move.

## Adoption is a separate decision

This run does not modify `solver/bot.js` or production selection. An entitled
`SUPPORTED` result would authorize considering a production-quality policy
implementation; it would not promote one. `FALSIFIED` or `INCONCLUSIVE` remains
an admitted result at its exact scope and does not erase the sandbox discovery.
