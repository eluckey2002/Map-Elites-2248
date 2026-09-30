# LC-0023 — Route-diverse cost attribution

## Step: Challenger Cost Attribution

**Objective:** Locate the route-diverse challenger stage responsible for its
compute failure and identify one route-preserving, minimal candidate redesign.

**Finding:** On the 19 frozen non-training initial states at width 384,
supplement afterstate scoring took 3,649,907,043 ns: **83.6%** of all
challenger-only work. Generation took 715,420,252 ns (16.4%), and winner
selection was negligible. The challenger fully scored 1,889 supplemental
routes. A simple one-route-per-endpoint budget is not viable: the required
human route ranks 15th of 18 routes at its endpoint and would be removed.

The narrow candidate is an **immediate-point eligibility gate**: keep every
generated route, but afterstate-score only supplemental routes whose immediate
points at least equal the champion-selected route. It keeps the human route
scoreable—both score 5,120 immediate points—and would reduce the scored pool
from 1,889 to 1,058 routes (44%) on this frozen panel.

**Next Step:** Before implementing that gate, freeze a small redesign contract
with a real counterexample showing that a lower-immediate-point route can have
the better afterstate score. The gate must prove how it handles that case, then
re-run the route-recovery, fallback, cap, and 2× boundedness qualifications.

## Scope and limits

- This is a machine-local timing attribution on frozen inputs, not a gameplay
  outcome experiment or a claim that the gate reaches the 2× bound.
- The 44% count reduction is a predicted reduction in expensive score calls;
  it is not a measured end-to-end speed improvement.
- No champion, level, target, receipt, recording, or authoring file changed.
