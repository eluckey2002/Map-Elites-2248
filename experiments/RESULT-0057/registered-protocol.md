# RESULT-0057 — equal-score continuation-density validation

Registered before any reportable seed in `46,000,000–46,000,019` is opened.
This experiment tests one bounded decision rule. It does not modify or promote
the production champion.

## Question and consuming decision

On the current 58 shipped levels, does using continuation density only to
break exact immediate-score ties preserve every observed champion outcome,
improve target cost on more than one level, and stay within twice the
champion's aggregate runtime?

The result decides only whether this rule deserves further promotion work.
It cannot change `solver/bot.js`, any level, target, receipt, recording, or
authoring rule, and it cannot make the challenger the champion.

## Experiment type

- Primary design: `candidate-measure`, profile SHA-256
  `5b1edc87a2e4c7bdcea493c7ba6b03c017fae6a13d05044b8df99586e5d167e4`.
- Context: `simulation-policy`, profile SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Assurance: `mutation-qualification`, profile SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.

## Candidate measure and eligibility

The intended construct is immediately usable future route optionality after a
candidate move. The executable proxy is the count of directed legal
minimum-length continuation chains divided by the number of tiles that can
open at least one such chain, measured after the same deterministic lookahead
draw used for every candidate.

The proxy is eligible only when all of the following hold:

1. the champion has a legal selected route;
2. a lookahead RNG factory is present;
3. the champion decision is neither bomb-priority nor an immediate target win;
4. the alternative earns exactly the champion route's immediate points; and
5. the alternative's density is strictly greater than the champion route's.

Otherwise the exact champion route is returned. The broader route generator
is fixed to `searchWidth: 384` and `supplementLimit: 128`. There is no level,
seed, recording, target, or owner-route special case.

## Subjects and production seam

- Control arm `champion`: production `chooseMove` from `solver/bot.js`.
- Treatment arm `challenger`: `chooseContinuationDensityMove` from
  `solver/continuation-density-challenger.js`.
- Both arms run through the same `playToTerminal` implementation in
  `subject.js`, the real `solver/engine.js` transitions, and shipped
  `src/game.js` level definitions.
- Spawn RNG is the paired game seed. Lookahead RNG is fixed to
  `987654321 + moveIndex` in both arms.
- Final subject identity:
  `5693094f23d5e2fbd3c10f13c195ea95184d3870ed4d2b676d3232bf3610a4b0`.

The only permitted free variables are shipped level number and game seed.
Rules, targets, move budgets, transitions, spawn streams, lookahead streams,
termination, and measurement code are shared and frozen.

## Units, panel, and completeness

- Experimental unit: one `(shipped level, seed)` pair.
- Unit of generalization: the current set of 58 shipped levels under the
  game's seeded spawn process, not future levels and not human play.
- Levels: every shipped level, 1 through 58.
- Seeds: fresh reportable range `46,000,000–46,000,019`, 20 per level.
- Matrix: 58 × 20 = 1,160 paired cells and 2,320 games.
- Assignment: both arms receive the same level and seed; arm execution order
  alternates by parity of level plus seed; cells are stored level-major.
- Completeness: every declared cell must contain both terminal outcomes in
  exact order. No exclusion, imputation, attrition, timeout substitution, or
  partial denominator is allowed.

The 20-seed denominator is a bounded decision panel, not a power-derived or
sequential design. The strict safety rule can be falsified by one regression;
the positive rule requires effects on at least two independent shipped levels
so one memorized or idiosyncratic level cannot support the claim.

Qualification seed `45,999,999`, synthetic fixtures, and the motivating Level
54 owner-game decision are excluded from the reportable panel. Neither the
qualification seed nor reportable range appeared in `experiments/SEEDS.md` or
repository search before registration.

## Objective and effect

Both arms use target-stop semantics. A game ends on target reached, bomb
explosion, no legal move, or exhausted move budget. Reliability is evaluated
before speed. Crossing score is diagnostic only.

Target cost is `movesToTarget` for a win and `moveBudget + 1` for a loss. The
paired effect is champion cost minus challenger cost, so positive favors the
challenger. The mean is computed across the 58 level means. Its descriptive
standard error is the larger of the level-clustered and seed-clustered
standard errors; the 95% interval is estimate ± 1.96 × that value. This
interval is descriptive and cannot override the cellwise safety rule.

## Frozen controls

### C1 — controlled proxy manipulation

With tile count and values held fixed, changing four equal tiles from a line
to a compact cluster must move density from exactly `1` to exactly `6`.
Failure means the candidate measure does not respond to its intended
topological construct and qualification stops.

### C2 — scale negative control

Multiplying every candidate tile value by 64 must leave the compact fixture's
density exactly `6`. Failure means the proxy is contaminated by irrelevant
value scale and qualification stops.

### C3 — orthogonal isolated-mass control

Adding an unrelated isolated tile to the compact fixture must leave density
exactly `6`. Failure means the proxy responds to unrelated board mass and
qualification stops.

### C4 — reference and treatment-exposure control

An A/A real-seam run on excluded seed `45,999,999` must have identical traces
and classify `INCONCLUSIVE`. The already-inspected motivating Level 54
decision must expose a strictly denser equal-score challenger route, while
remaining excluded from the reportable outcome. Failure means the harness
cannot distinguish treatment exposure from reference noise.

### C5 — assignment and objective integrity

The validator must reject missing, duplicated, reordered, or mismatched cells;
both arms must share the exact move budget and target-stop semantics. Failure
before the run stops qualification; failure after execution makes closure
`INVALID`.

### C6 — known-kill regression mutation

A planted mutual-win cell in which the challenger is one move slower must be
present and must classify `FALSIFIED` for the intended safety reason. An
equivalent, unreachable, timed-out, or harness-error mutation does not count.

### C7 — narrow-benefit and compute-bound controls

A safe benefit on two levels at 1.5× runtime must classify `SUPPORTED`; the
same benefit on only one level, or at 2.001× runtime, must classify
`INCONCLUSIVE`. Failure means the registered breadth or cost boundary is not
actually enforced.

### C8 — identity, persistence, restoration, and closeout

Coherent source substitution must fail; a thrown verdict must retain the raw
artifact; all frozen hashes must be restored; and a disposable synthetic
closure must pass the exact executable closeout route. The reportable corpus
path must be absent before the one run.

## Primary predictions and outcome

### P1 — safety

`PASS` requires exactly zero champion-only wins and zero mutual-win cells in
which the challenger is slower. One such cell is `FAIL`.

### P2 — non-vacuous breadth and target-cost signal

`PASS` requires a strictly positive mean paired target-cost reduction and a
beneficial cell on at least two distinct shipped levels. Otherwise `FAIL`.

### P3 — bounded compute

`PASS` requires aggregate challenger runtime divided by aggregate champion
runtime to be at most `2.0`. The arms alternate execution order, but this is
not compute-matched: the rule is rejected for this experiment if it exceeds
the registered ceiling.

### P4 — registered outcome

- `FALSIFIED`: P1 fails.
- `SUPPORTED`: P1, P2, and P3 all pass.
- `INCONCLUSIVE`: P1 passes but P2 or P3 fails.

P1 dominates means and aggregate gains: no average improvement can compensate
for one observed reliability or speed regression in this fixed panel.

## Attempts, budget, and stop rules

1. Qualification may use only seed `45,999,999`, already-inspected fixtures,
   and synthetic cells. It must pass C1–C8 before reportable execution.
2. The committed protocol, contract, identities, paths, and synthetic
   closeout route must pass pre-outcome admission.
3. One reportable run is authorized, bounded to 1,160 pairs. No retry,
   replacement seed, partial resume, threshold change, or second reveal.
4. Complete raw pairs are validated and written before verdict evaluation.
   The output path may not be overwritten.
5. Runtime failure preserves any diagnostic artifact but closes `INVALID` or
   `UNVERIFIED` without a primary domain outcome.
6. Identity drift, a missing cell, registration failure, or objective mismatch
   stops the run. Repair requires a new result ID and fresh seeds.

## Required evidence and closure

Required artifacts are `corpus`, `report`, and `primary-recomputation`.
Required claim cells are C1–C8 and P1–P4. Closure is executable through the
adjacent `closeout-contract.json`; its trusted SHA-256 is recorded in
`protocol.md`. The closure verifier identity is
`7ed2647d28bfe3df9bed227216f28959c9a7e767dd112c2952f7c2d3c3619830`.

The final report must state all pair counts, beneficial/regressing level
breadth, target-cost estimate and uncertainty, compute ratio, deviations,
evidence identities, and limitations. It must not claim human superiority,
future-level generalization, autonomous learning, terminal-score optimization,
or causal explanation beyond this exact tie-break rule.

## Adoption boundary

This experiment stops at verified closure. `SUPPORTED` means the rule earned
consideration in a separate promotion experiment; it does not alter the
champion. `FALSIFIED` or `INCONCLUSIVE` likewise changes no production file.
