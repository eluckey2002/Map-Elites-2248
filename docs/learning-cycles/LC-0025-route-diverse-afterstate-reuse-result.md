# LC-0025 — Route-diverse exact afterstate reuse

## Step: Exact Afterstate Reuse Qualification

**Objective:** Determine whether the expensive route-diverse afterstate score
can reuse work across routes without discarding lower-immediate routes or
changing the existing score ordering on the frozen panel.

**Finding:** Yes, on this fixed panel. The 2,143 supplemental routes from 20
frozen corpus initial states plus the frozen Level 54 human move-two state
produce 1,299 distinct post-move board-and-survivor outcomes. Caching the
afterstate-only rollout, placement, and harvest features therefore reused 844
evaluations (39.4%). Every candidate kept its own immediate-points and turnover
terms. All 2,143 policy scores and selected routes matched the unchanged
per-candidate scorer exactly, including all 186 known lower-immediate,
higher-afterstate reversals. Machine-local score time fell from 3,902,577,123
ns to 2,433,080,958 ns (0.623×).

**Next Step:** Do not register a gameplay trial or promote the challenger.
This has qualified one exact cache only. A separate bounded check may measure
whether the full challenger, including generation and champion analysis, now
meets its 2× draft compute boundary; it must retain the same ordering and
reversal checks.

## Scope and limits

- The cache still simulates each candidate to establish its post-move state;
  it reuses only the expensive features of equivalent outcomes.
- Timing is machine-local and covers supplemental scoring only, not total
  challenger decision time or gameplay outcomes.
- No fresh seed, champion, level, target, receipt, recording, or authoring
  file changed.
