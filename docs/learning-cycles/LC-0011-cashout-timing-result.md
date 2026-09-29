# LC-0011 — cashout timing result

## Step: Exact Cashout-Timing Counterfactual

**Objective:** Determine whether waiting one move before cashing the already
legal 56,320-point route improves target-stop performance in the exact Level
54 move-11 owner state.

**Finding:** It does not. Both frozen alternatives reach the 126,000 target on
move 15, exactly two moves after the common state, so the registered outcome is
`TARGET_COST_TIE` and the exact cash-now-minus-wait target-cost effect is zero.

| Arm | Move 14 | Move 15 | Target crossing | Final score |
| --- | ---: | ---: | ---: | ---: |
| `WAIT_ONE` | 3,072 | 56,320 | 15 | 126,144 |
| `CASH_NOW` | 56,320 | 10,240 | 15 | 133,312 |

Waiting first lets the preserved route provide the finishing move. Cashing it
immediately leaves the policy 2,928 points short, and the unchanged champion's
next 10,240-point chain supplies the finish instead. Cash-now therefore has
7,168 more score at the common stopping move, but score overshoot is diagnostic
only under the frozen target-stop objective; it cannot turn the target-cost tie
into a win.

This resolves the one observed early-ready case: the wait was safe, but it did
not buy speed. It does not establish a general cash-now rule, because the unit
and unit of generalization are both this one exact state.

**Next Step:** Do not alter the champion or define a timing metric from this
single tie. Retain the result as a counterexample to both “always cash as soon
as ready” and “waiting improves target speed.” A broader timing rule would need
a newly frozen panel containing multiple naturally early-ready routes and a
predeclared objective that distinguishes target speed from score overshoot.

## Boundaries

- One deterministic Level 54 state on seed `1313839221`; no population claim.
- The subsequent chooser, engine, target, remaining moves, and RNG prefix were
  frozen and unchanged.
- No champion, policy, level, target, receipt, recording, or authoring change.
- The 7,168 score difference is not a registered primary win and does not
  authorize promotion.

## Verification

- Qualification passed all eight controls and recorded `cashNowExecuted:
  false` before the one reportable pair.
- Raw artifact identity:
  `e50f53500b527c20af6d0d670e7f827b23b4b7ed3a9caac63f068bb052381f3c`.
- Raw file SHA-256:
  `59a4a2693bdea78c60df2ebec650ca98afdd44006d3fa16796764d56e3a0e867`.
- Primary recomputation SHA-256:
  `8f22b5b1ce813df5413c77bccb053df0c435be0529116da6f7b37d4594fe9fe7`.
- Executable closeout verifier: `PASS`, `CLOSED`, recomputation `PASS`;
  closeout-contract SHA-256
  `4f1668b249d78af44d5e11b42789b3a208b15447378cdfd139b293c8300b06da`.
- One pre-reportable qualification invocation stopped on an incorrect
  caller-supplied closeout hash. It created no outcome artifact and did not run
  `CASH_NOW`; the successful second invocation remained within the frozen
  two-attempt bound. The closure retains this deviation.
- Protected gameplay hashes remain: `solver/bot.js`
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`,
  `solver/engine.js`
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`,
  and `src/game.js`
  `3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1`.
