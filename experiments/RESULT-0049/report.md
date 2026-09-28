# RESULT-0049 — current champion confirmation

## Outcome

**SUPPORTS_CURRENT_CHAMPION** within the registered scope: all 58 currently
shipped levels, seeds `45,000,000–45,000,299`, the frozen ruleset and policies,
and the target-stop objective.

This is a post-adoption confirmation, not a new promotion. It does not establish
superiority on future levels or in human play, and it does not modify the
champion automatically.

## Run identity and completeness

- Registration commit:
  `24c38d8b5fe5b1ae90aaa0cdb3872453bc728840`.
- Final subject identity:
  `41d758a294aa491fd0a257209fc502dcc47a0c77730daf7d81251fa52ba84144`.
- Raw corpus artifact identity:
  `43b50ee34bf8c850172adbb8debce27e2e6d9b5d2672392581505524a9dd5062`.
- Raw corpus file SHA-256:
  `fcd7b85690c8afdc0108385ff9fd827b9672726d9e42addae0df941bcc6c97f4`.
- Matrix: 17,400/17,400 complete level-major pairs; 34,800 games.
- Attempts: one reportable run; no retry, replacement seed, partial resume, or
  changed threshold.
- Deviations: none.

The complete raw corpus was validated and written with exclusive-create
semantics before the verdict was evaluated.

## Primary counts

| Comparison | Count |
| --- | ---: |
| Both policies win | 17,329 |
| Both policies lose | 54 |
| Champion-only wins | 17 |
| Base-only wins | 0 |
| Champion faster among mutual wins | 10,466 |
| Base faster among mutual wins | 0 |
| Same-speed mutual wins | 6,863 |
| Same-speed wins with different crossing score | 5,638 |
| Different trace identity | 16,255 |

The mean paired reduction in target cost was
`1.1844252873563221` moves per cell in favor of the champion. The conservative
two-axis standard error was `0.06859885938052002`; the registered symmetric 95%
interval was `[1.049971522970503, 1.3188790517421414]`. The level axis bound
(`0.06859885938052002`) rather than the seed axis
(`0.015261890560622575`).

Same-speed crossing-score changes are reported because they explain why the
old rehearsal's score-equality rule fired. They are final-move overshoot under
an equal target-crossing time, not regressions under this experiment's frozen
objective.

## Checks

### C1 — reference and deterministic replay

**Outcome: PASS.** The production-seam A/A control using `chooseBaseMove` for
both arms was outcome-identical and classified `INCONCLUSIVE`. Repeated seeded
execution was deterministic.

### C2 — target-aware positive control

**Outcome: PASS.** The real public `chooseBaseMove` and `chooseMove` arms
produced different trace identities on the excluded Level 51 seed 1 fixture
while sharing the same target-stop execution seam.

### C3 — assignment-integrity control

**Outcome: PASS.** Negative tests rejected an incomplete paired matrix, and
the reportable corpus validated all 17,400 cells in exact level-major order
with one base and one champion outcome per level/seed.

### C4 — objective-equivalence control

**Outcome: PASS.** Each pair shared level, seed, move budget, transition code,
spawn stream, lookahead construction, and terminal predicates. The validator
confirmed equal move budgets for both arms in every cell.

### C5 — known-kill regression mutation

**Outcome: PASS.** The planted one-move champion regression was independently
present, incremented `baseFaster`, and produced exactly
`DOES_NOT_SUPPORT_CURRENT_CHAMPION` for the intended reason.

### C6 — identity, persistence, restoration, and closeout

**Outcome: PASS.** Coherent source substitution failed against the externally
frozen identity; a thrown verdict retained the complete raw artifact; all
source hashes matched registration; the exact disposable closeout route passed;
and the reportable corpus persisted before verdict evaluation.

### P1 — safety

**Outcome: PASS.** There were zero base-only wins and zero mutual-win cells in
which the champion was slower.

### P2 — non-vacuous benefit

**Outcome: PASS.** The champion converted 17 base losses into wins and reached
the target sooner in 10,466 mutual wins.

### P3 — registered outcome

**Outcome: SUPPORTED.** P1 and P2 both passed, selecting the registered domain
outcome `SUPPORTS_CURRENT_CHAMPION` without reference to crossing score or
other diagnostics.

## Limitations and adoption boundary

- The evidence applies to the current 58 shipped levels and frozen seed model,
  not future levels, arbitrary game variants, or human strategy.
- It compares the target-aware wrapper with its current preserved base chooser;
  it does not compare every possible policy.
- The strict zero-observed-regression rule applies to this fixed panel and is
  not a mathematical proof that no unseen seed can regress.
- Compute time and same-speed crossing score were diagnostic and could not
  alter the primary outcome.
- `SUPPORTS_CURRENT_CHAMPION` validates retaining the current policy within the
  registered engineering scope. It neither creates a new champion nor changes
  production code, levels, targets, receipts, or authoring.
