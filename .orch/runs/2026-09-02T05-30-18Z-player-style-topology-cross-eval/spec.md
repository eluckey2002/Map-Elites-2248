# Machine-policy response to narrow-board topology

## Run

`2026-09-02T05-30-18Z-player-style-topology-cross-eval`

## Objective

At one exact committed revision, the repository contains a preregistered,
identity-bound, independently recomputed result answering whether four exact
machine policies respond materially differently when a second adjacent center
stone is added to the same narrow 4x8 board shape. The result ends in exactly
one of `SUPPORTED`, `FALSIFIED`, or `INCONCLUSIVE`, preserves every measured
cell, and authorizes no human-persona, level-shipping, mechanic-adoption, or
champion-promotion claim.

## Question

Across a frozen 200-seed confirmation set, does the incremental score effect
of changing a one-center-stone 4x8 layout into a two-adjacent-center-stone 4x8
layout differ materially among the current baseline policy and three exact
historical MAP-Elites representatives?

"Materially" is fixed before data as a spread of at least five percentage
points between policies in paired geometric score response, with the ordering
of the most- and least-affected policies preserved in both predeclared
100-seed halves. A spread below two percentage points is `FALSIFIED` when the
policies still clear the style-separation guard. Anything else is
`INCONCLUSIVE`.

## Source policy

Use only primary repository artifacts and the exact pilot artifacts named
under Evidence. The accepted MAP-Elites archive supplies policy parameter
objects, identities, and historical descriptor locations; it does not supply
current performance. Current performance comes only from this run through
the frozen `policy-eval` seam. The owner pilot disposition supplies the reason
to study narrow-board topology; the exploratory second layout supplies a
structural lead only. Conversation is management intake and is not result
evidence.

No external sources, web research, model judgment, or unpublished figures may
enter the empirical result.

## Rigor bar

Every load-bearing claim must be reconstructable from the complete raw cell
matrix at the frozen identities. The runner and verifier must be separable:
the verifier reads the real artifact, recomputes subject identities, policy
identities, cell uniqueness, descriptor summaries, paired geometric
responses, half-sample ordering, and the final threshold verdict without
trusting the report. The same verifier must PASS the valid artifact and FAIL a
controlled broken twin whose raw score is changed without changing the
declared identity.

The empirical conclusion is bounded to the four policies, three layouts,
current engine semantics, and named seeds. It may motivate a later human
calibration experiment; it cannot establish human player types or desirable
game behavior.

## Non-goals

1. Do not run MAP-Elites, OpenEvolve, the adversarial arena, or any model.
2. Do not evolve, search, tune, select, or promote a policy.
3. Do not claim that the three archive representatives model human personas.
4. Do not claim that one layout is better, more fun, harder for humans, ready
   to ship, or correctly calibrated.
5. Do not decide whether the current stone/refill behavior is desirable. This
   run measures the current frozen semantics and reports that boundary.
6. Do not qualify the exploratory second human recording or use its outcome as
   empirical input.
7. Do not change the game, levels, champion, MAP-Elites archive, accepted
   evidence, ledger, candidate corpus, or pilot records.
8. Do not re-fit MAP-Elites axes or replace the current descriptors.

## Frozen subjects

### Machine policies

All policies are declarative `DEFAULT_PARAMS`-compatible objects. Their
12-character policy identities are recomputed with `policyIdentity` from the
frozen `solver/map-elites-core.js`.

1. Current base parameters, `0de51bc557de`:
   `wRoll=1, wPlace=1, turnover=40, width=24, bombMax=9,
   tieBreak=degree, wHarvest=2, offerFull=0, pathWidth=8`.
2. Historical long-chain representative, `a61e8b8e23b7`, archive cell `4,2`:
   `wRoll=1, wPlace=1, turnover=72, width=24, bombMax=11,
   tieBreak=degree, wHarvest=2, offerFull=0, pathWidth=6`.
3. Historical short-chain representative, `4cbec6509c34`, archive cell `0,0`:
   `wRoll=0, wPlace=0.75, turnover=0, width=12, bombMax=9,
   tieBreak=degree, wHarvest=0, offerFull=0, pathWidth=1`.
4. Historical late-score representative, `ebeb9e326a01`, archive cell `2,4`:
   `wRoll=1, wPlace=1.75, turnover=0, width=12, bombMax=9,
   tieBreak=degree, wHarvest=3.5, offerFull=0, pathWidth=8`.

The labels describe their accepted historical archive locations only. This
run must remeasure behavior and may find that the distinctions do not survive
on the narrow board.

### Level layouts

Every arm uses `gridW=4`, `gridH=8`, `moves=24`, `minChain=3`,
`tileScale=32`, and `target=Infinity`. Infinite target disables the current
target-aware finish override and makes the full-budget base-policy behavior
the subject. Layouts differ only by permanent stone coordinates:

1. `open`: no blockers.
2. `one-center-stone`: stone at `(2,3)`.
3. `two-center-stones`: stones at `(1,3)` and `(2,3)`.

The third layout carries the structural topology of exploratory candidate
identity `0d7604e7b6d6142dce6ad8c6f4d1a2a62b2ea1031b5e3ccf3fd93643799585f4`.
The experiment creates new exact layout identities because it removes that
candidate's finite, uncalibrated target and adds controlled comparator
layouts.

## Denominator and seeds

- Control only: seeds `20000000` through `20000011` (12), never reportable.
- Confirmation: seeds `21000000` through `21000199` (200), reportable once.
- Four policies x three layouts x 200 confirmation seeds = exactly 2,400
  reportable cells.
- Every policy-layout comparison is paired on identical seeds.
- Confirmation halves are fixed as `21000000..21000099` and
  `21000100..21000199`.
- No second confirmation, alternate seed set, threshold change, policy swap,
  or layout substitution is allowed after execution.

## Measures and verdict rule

For each policy and seed, the runner records full-budget score, moves used,
mean chain length, late-score share, and raw behavior totals for all three
layouts.

The primary response for policy `p` is:

`R[p] = exp(mean_seed(log(max(score_two,1) / max(score_one,1)))) - 1`

The interaction spread is `max(R) - min(R)`.

### Style-separation guard

On the `open` confirmation layout, the four policies must span at least 0.15
tiles in mean chain length or 0.02 in late-score share. These are the accepted
MAP-Elites pilot's preregistered minimum descriptor ranges, reused rather than
inventing a result-sensitive threshold. If neither range clears, the primary
verdict is `INCONCLUSIVE` because the supposed styles did not remain
behaviorally distinguishable in this domain.

### Primary verdict

- `SUPPORTED`: the style-separation guard clears; interaction spread is at
  least `0.05`; and the identities of the most- and least-affected policies
  are identical in both fixed confirmation halves.
- `FALSIFIED`: the style-separation guard clears and interaction spread is
  below `0.02`.
- `INCONCLUSIVE`: every other outcome, including ties that prevent stable
  ordering.

The report must also show one-stone versus open response, early-termination
rates (`movesUsed < 24`), per-policy behavior changes, and observed runtime.
Those are diagnostics and cannot replace the primary rule.

## Acceptance

### A1 — Frozen subject and source closure

- **oracle:** run verifier subcommand `verify-subjects` against the real run
  directory.
- **oracle_class:** `deterministic`.
- **acceptance:** Recompute every policy, layout, archive, source-file, seed
  range, and manifest identity from bytes. Refuse an absent or extra subject,
  a policy-ID mismatch, a layout change, a source-hash change, or any path
  outside the source policy.

### A2 — Real negative and positive controls precede confirmation

- **oracle:** run verifier subcommand `verify-controls` over raw control cells
  and trace ordering.
- **oracle_class:** `deterministic`.
- **acceptance:** Repeating the same policy-layout-seed cells must be exactly
  identical. The one-stone and two-stone layouts must differ in at least one
  raw outcome on the control set. If the negative control differs or the
  positive control reads identically, confirmation must not exist.

### A3 — Complete raw confirmation matrix

- **oracle:** run verifier subcommand `verify-matrix` against the real
  artifact and manifest.
- **oracle_class:** `deterministic`.
- **acceptance:** Exactly 2,400 unique policy-layout-seed cells exist, every
  expected key occurs once, no control seed appears, every raw measure is
  finite and internally consistent, and the artifact identity recomputes.

### A4 — Verdict independently recomputes

- **oracle:** run verifier subcommand `verify-verdict` plus a direct second
  recomputation from raw cells recorded in `verification.json`.
- **oracle_class:** `deterministic`.
- **acceptance:** Both recomputations agree on descriptor ranges, four `R[p]`
  values, both half-orderings, interaction spread, guard outcome, and exactly
  one final verdict under the frozen thresholds.

### A5 — Controlled broken twin fails the same verifier

- **oracle:** `replay-challenge.json` recording the unmodified artifact PASS
  and a temporary twin with one raw score incremented by one FAIL.
- **oracle_class:** `deterministic`.
- **acceptance:** The valid artifact passes all verifier subcommands. The
  broken twin fails for identity or recomputation mismatch using the same
  command. The temporary twin is not retained as evidence.

### A6 — Experiment registration and report coverage

- **oracle:** pre-existing `node tools/verify-experiments.js`, executed live
  against the real checkout, plus `solver/tests/experiments.test.js`.
- **oracle_class:** `deterministic`.
- **acceptance:** A `RESULT-NNNN` protocol was committed before controls or
  confirmation, every declared check has an explicit outcome section in the
  report, the registration commit is a strict ancestor of the report commit,
  cited JSON resolves and parses, and the completed artifact carries only
  frozen source hashes.

### A7 — Authority and protected surfaces remain bounded

- **oracle:** protected-source hash comparison plus
  `git diff --name-only <registration-commit>...HEAD` and forbidden-claim
  scan over the report.
- **oracle_class:** `deterministic`.
- **acceptance:** Changes are confined to this run's `.orch` records and one
  `experiments/RESULT-NNNN/` directory. The game, solver, archive, pilots,
  champion, ledger, and current-navigation files are byte-identical. The
  report explicitly refuses human-persona, fun, difficulty, shipping,
  mechanic-correctness, and promotion conclusions.

## Binding constraints

1. Register and commit the protocol before any control or confirmation game.
2. Use the exact policies, layouts, formula, thresholds, seeds, and denominator
   above. A defect discovered before execution requires a superseding protocol;
   after execution it becomes a reported breach or limitation.
3. Never read the reportable confirmation artifact while changing the runner,
   verifier, protocol, or thresholds.
4. Runner output is a claim, not verification. Acceptance requires the
   separately invoked verifier and controlled broken twin.
5. Preserve distinctions between exact raw observations, the bounded
   heuristic verdict, owner decisions, and human calibration.
6. No network, provider, model call, human play request, external write,
   champion mutation, product mutation, or evidence admission.
7. Stop after one confirmation. `INCONCLUSIVE` is a complete result.
8. Keep the total execution under 2,500 reportable games and one local hour;
   control games are bounded to 144 policy-layout cells per repetition.

## Evidence

1. Repository base `84d5037abc8e77d203affef83632426bbbd81bc3`, branch
   `codex/player-style-cross-eval`.
2. Accepted MAP-Elites archive `solver/map-elites-output/archive.json`,
   SHA-256 `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`,
   admitted as `RESULT-0017` only at its historical bounded standing.
3. Current source hashes:
   - `solver/bot.js`: `8d0dec5f6b0669ca7c039e6493b4014fdc5cefb4df9d93ad54dba2cb168b0b10`
   - `solver/engine.js`: `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`
   - `solver/policy-eval.js`: `ab76eeb937b61b85835602f4db431de9f8686dfa281a48cfd2c97caa039457a1`
   - `solver/map-elites-core.js`: `2ff166ac8c500969c2c5ae5af8264d50787e67ec2fdb99600cce78ab9355c297`
   - `src/game.js`: `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee`
4. Qualified owner disposition
   `pilots/HUMAN-PILOT-0001/owner-disposition.json`, artifact identity
   `284c9d4aa6223f965c206714ab5f833a387ac27f7015bc7181223c856a748dfb`,
   source SHA-256
   `d231548173d1688b042f377955d949244c79372187ad6d26520b922ae48f9a17`.
5. Exploratory second-layout manifest
   `/private/tmp/2248-human-pilot-20260901/pilots/HUMAN-PILOT-0002/manifest.json`,
   SHA-256 `a66649b0da164ffcab4e4b8b6f02b488cb987a4628caf51474e77757bcbad9ac`,
   used only to source the two-stone structural lead.

## Affected surfaces

1. This frozen spec and later run evidence under
   `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/`.
2. One registered experiment directory `experiments/RESULT-NNNN/` containing
   `protocol.md`, a bounded runner/verifier owned by the experiment, and
   `report.md`.

No existing file outside those two surfaces may change.

## Exemplars

1. `experiments/RESULT-0020/protocol.md` at base `84d5037`:
   imitate registered-before-data ordering, frozen hashes, named control and
   prediction sections, one confirmation, and explicit breach reporting.
2. `pilots/HUMAN-PILOT-0001/replay-challenge.json` at commit `84d5037`:
   imitate one unchanged PASS and one controlled broken-twin FAIL through the
   same check; do not imitate recording-specific fields.
3. `solver/map-elites-output/archive.json` at SHA-256 `11e50d6...`:
   copy only the three representative parameter objects and historical cells;
   never copy its historical performance as current evidence.
4. `d75cc547bb3ba8a9db033929f04195544916802c:.orch/runs/2026-09-01T05-37-38Z-openevolve-2248-matched-control-harness/spec.md`:
   preserve its declarative-policy boundary, fixed descriptor identity,
   protected champion, raw evidence custody, and separation between this
   precursor and later OpenEvolve execution.

## Routing

- **pack:** `orch-research-pack`
- **deliverable kind count:** 1
- **slicing:** one empirical lane because the full cell matrix and paired
  interaction verdict are one inseparable evidence unit; independent
  verification is an acceptance oracle, not a second blind research opinion.

## Bound

- One isolated worktree.
- One protocol registration commit.
- One control execution and at most one confirmation execution.
- Four exact policies, three exact layouts, 200 confirmation seeds.
- One valid-artifact verification and one broken-twin challenge.
- No external calls or human time.
- **plan_gate:** `false`; the owner authorized starting this bounded first
  milestone with "Awesome. Lets get started" on 2026-09-02.

## Risks

1. The policies differ in search width and compute, so an interaction cannot
   be attributed solely to a human-like strategic preference.
2. Historical archive labels may not survive the current code or narrow board;
   the style-separation guard makes that `INCONCLUSIVE` rather than relabeling
   after the fact.
3. Three controlled stone layouts do not represent all blocker topology, ice,
   bombs, or shipped levels.
4. Current stone/refill semantics may themselves be undesirable. This run
   measures them but does not accept them.
5. The five-point materiality threshold is a decision threshold, not a natural
   constant or human just-noticeable difference.
6. Reusing historical policy parameters does not re-admit the historical
   archive against the current champion.

## Assumptions

1. The first useful bridge is policy-by-layout interaction, not immediate code
   evolution or two-sided co-evolution.
2. Full-budget score and the existing MAP descriptors are sufficient for this
   bounded screening question; human relevance remains a later calibration.
3. The current `policy-eval` public seam can evaluate custom level objects
   without changing solver code.
4. `RESULT-0022` is the next available result number at registration time;
   the registration command must recheck availability and use another number
   if concurrent work has claimed it.
5. The prior OpenEvolve matched-control spec remains deferred and unchanged;
   this result informs whether its fixed descriptors are useful on the current
   narrow-board direction.
