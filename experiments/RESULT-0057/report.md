# RESULT-0057 — equal-score continuation-density validation

## Outcome

**FALSIFIED** within the registered scope. The equal-immediate-score
continuation-density rule was not safer or faster than the preserved champion
on the frozen 58-level × 20-seed paired panel. The champion remains unchanged.

The challenger stayed within the registered compute ceiling, but it lost the
decision on gameplay: it turned 24 champion wins into losses, reached the
target later in 881 mutual wins, and increased mean target cost by about 2.78
moves per cell.

## Run identity and completeness

- Registration commit:
  `21e6c5057e0845babdbe19e50ded01e4bbee593e`.
- Qualification commit: `9601737`.
- Final subject identity:
  `5693094f23d5e2fbd3c10f13c195ea95184d3870ed4d2b676d3232bf3610a4b0`.
- Raw corpus artifact identity:
  `c41c6d8c98076bed0fd8f173d14df9e170096b9c4fa6c62e2160c1118065d8c8`.
- Matrix: 1,160/1,160 complete level-major pairs; 2,320 games.
- Attempts: one reportable run; no retry, replacement seed, partial resume,
  threshold change, or second reveal.
- Deviations: none.

The complete raw corpus was validated and persisted before its verdict was
evaluated.

## Primary counts

| Comparison | Count |
| --- | ---: |
| Both policies win | 1,133 |
| Both policies lose | 0 |
| Challenger-only wins | 3 |
| Champion-only wins | 24 |
| Challenger faster among mutual wins | 116 |
| Champion faster among mutual wins | 881 |
| Same-speed mutual wins | 136 |
| Different trace identity | 1,159 |

The mean paired reduction in target cost was
`-2.784482758620689` moves per cell; negative favors the champion. The
conservative two-axis standard error was `0.12718273871421287`, with a
registered descriptive 95% interval of
`[-3.0337609265005465, -2.5352045907408316]`. The level-clustered standard
error (`0.12718273871421287`) exceeded the seed-clustered value
(`0.11096764454697548`).

The challenger produced at least one beneficial cell on 52 levels, but also a
regressing cell on all 58 levels. Breadth of occasional gains therefore did
not satisfy the positive-mean rule and could not override strict safety.

Aggregate measured compute was `2,472,816,285,992 ns` for the champion and
`4,568,540,083,096 ns` for the challenger, a ratio of
`1.8475048506336067`. That passes the registered 2.0 ceiling.

## Controls and claims

### C1 — controlled proxy manipulation

**PASS.** With tile count and values fixed, changing the topology from the
line fixture to the compact fixture moved density from exactly 1 to exactly 6.

### C2 — scale negative control

**PASS.** Uniform 64× value scaling left compact-fixture density exactly 6.

### C3 — orthogonal isolated-mass control

**PASS.** Adding an unrelated isolated tile left density exactly 6.

### C4 — reference and treatment exposure

**PASS.** Real-seam A/A produced identical traces and an `INCONCLUSIVE`
classification. The excluded motivating Level 54 decision exposed a strictly
denser equal-score alternative without a training-case special case.

### C5 — assignment and objective integrity

**PASS.** Negative tests rejected missing and substituted inputs, and the
reportable corpus validated all 1,160 level-major pairs with equal move budgets
and the shared target-stop objective.

### C6 — known-kill regression mutation

**PASS.** The planted one-move challenger regression classified `FALSIFIED`
for the intended safety reason.

### C7 — breadth and compute boundary controls

**PASS.** Two-level safe benefit at 1.5× classified `SUPPORTED`; one-level
benefit and 2.001× compute each classified `INCONCLUSIVE`.

### C8 — identity, persistence, restoration, and closeout

**PASS.** Coherent source substitution failed; a thrown verdict retained raw
evidence; all source identities matched registration; and the exact disposable
closeout route passed before reportable execution.

### P1 — safety

**FAIL.** The fixed panel contained 24 champion-only wins and 881 mutual-win
cells in which the challenger was slower. Either one would have defeated this
claim.

### P2 — non-vacuous signal

**FAIL.** Although beneficial cells appeared on more than two levels, mean
paired target-cost reduction was negative rather than positive.

### P3 — bounded compute

**PASS.** The aggregate challenger/champion runtime ratio was about 1.85,
below the registered ceiling of 2.0.

### P4 — registered outcome

**PASS.** P1 failed, selecting the preregistered outcome `FALSIFIED`.

## Interpretation and boundary

The diagnostic insight from the motivating game does not generalize as this
global tie-break rule. Continuation density is a real, manipulable property,
and the rule can sometimes help, but maximizing it whenever immediate points
tie discards information already captured by the champion's ranking. On this
panel the harm was widespread and much larger than the occasional gains.

This result applies to the current 58 shipped levels, frozen policies, and
seeded simulation process. It is not a claim about future levels or human play,
and it does not show that every narrower use of continuation structure is bad.
It does show that this exact broad rule must not be promoted. No champion,
level, target, receipt, recording, or authoring file was modified.
