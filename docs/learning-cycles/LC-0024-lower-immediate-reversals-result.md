# LC-0024 — Lower-immediate score reversals

## Step: Gate Counterexample Scan

**Objective:** Determine whether the proposed immediate-point gate would
discard a supplemental route that the existing afterstate scorer rates above
the champion.

**Finding:** Yes. Across all 2,143 supplemental candidates from the 20 frozen
corpus initial states plus the human move-two state, 186 routes had lower
immediate points and a higher policy score than their champion. The first
replayable example is Level 54 / seed `3310936729`: the champion has 6,080
immediate points and a 24,000 policy score; a 5,120-point supplemental route
scores 25,920. The immediate-point gate would remove that better-afterstate
route, so it is rejected.

**Next Step:** Do not implement or benchmark that gate. A future cost design
must retain this lower-immediate/higher-afterstate class; its first task is to
identify a cheaper way to evaluate, bound, or reuse afterstate scoring without
using immediate points as a rejection rule.

## Scope and limits

- Exact comparison of the existing challenger’s candidates and scorer on a
  frozen pool only; no claim about gameplay outcomes or unseen boards.
- This rejects the immediate-point eligibility gate, not route diversity or
  every possible scoring-cost redesign.
- No champion, level, target, receipt, recording, or authoring file changed.
