# LC-0012 — early-ready timing panel result

## Step: Early-Ready Timing Panel

**Objective:** Determine whether immediately cashing a chain that is already
legal improves target-stop performance across the fixed corpus, rather than in
only the single LC-0011 state.

**Finding:** Immediate cashing was faster in 10 of 14 selected recordings,
waiting was faster in 3, and 1 tied. Both alternatives reached the target in
all 14 pairs. Cash-now used 1.57 fewer moves on average and 2 fewer at the
median on this fixed panel, but the registered outcome is
`MIXED_TARGET_EFFECT` because the three reversals disprove an unconditional
“cash every ready chain now” rule.

| Target-cost comparison | Pairs |
| --- | ---: |
| `CASH_NOW_FASTER` | 10 |
| `OBSERVED_WAIT_FASTER` | 3 |
| `TARGET_COST_TIE` | 1 |
| One arm failed to reach target | 0 |

The 24-recording frozen corpus yielded 14 eligible early-ready decisions across
9 levels. The selector retained one decision per recording before either
counterfactual outcome was known. Score after target crossing remained
diagnostic only; it did not decide the result.

**Next Step:** Do not change the champion or adopt an always-cash rule. Compare
the three wait-faster cases with otherwise similar cash-faster cases and trace
what the intervening move preserves, creates, or positions for the eventual
target crossing. That diagnostic should identify the condition under which
waiting earns its cost before any timing metric or policy rule is proposed.

## Boundaries

- Exact deterministic replays of the 14 selected opportunities in the fixed
  24-recording corpus; no population inference.
- The observed wait package and immediate-cash route share the same frozen
  start, target, remaining moves, RNG prefix, and unchanged champion after the
  intervention.
- No champion, policy, level, target, receipt, recording, or authoring change.
- The average and median describe this panel only; they do not authorize
  promotion or establish an unconditional action rule.

## Verification

- Qualification passed all nine controls on its first attempt, selected 14
  recordings across 9 levels, and recorded `cashNowCorpusExecuted: false`
  before the one reportable matrix.
- Raw artifact identity:
  `dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff`.
- Raw file SHA-256:
  `707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f`.
- Primary recomputation SHA-256:
  `d5e33bf4f79d5f47363c3e5a498485e6ebfdfcb3be7c5359c61239da3b07d9d7`.
- Executable closeout verifier: `PASS`, `CLOSED`, recomputation `PASS`;
  closeout-contract SHA-256
  `bf932e05dfc785714c0863bd83006960b3218686c42a43b1d3176197dc26f9c9`.
- The immutable closure records the preregistration correction: the v1
  protocol mislocated the LC-0011 positive-control state, and v2 bound the
  exact reconstructed state externally before harness construction,
  qualification, selection, or counterfactual outcomes.
- Protected gameplay hashes remain: `solver/bot.js`
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`,
  `solver/engine.js`
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`,
  and `src/game.js`
  `3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1`.
