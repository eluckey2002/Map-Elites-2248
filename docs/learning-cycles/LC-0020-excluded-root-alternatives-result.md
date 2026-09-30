# LC-0020 — Excluded-root alternatives

**Step:** Alternative-Path Availability Check

**Objective:** On each unchanged retained cash pre-target board, enumerate every legal chain and ask whether the equal-birth root excluded from the recorded target path can participate in another chain that crosses the remaining target gap immediately.

**Finding:** Both excluded roots have many such alternatives. On Level 3 (`e81f8323ede9…`), excluded `S0022` (`2` at `(2,3)`) appears in 171,356 of 208,970 legal actions; 50,265 of those actions score at least the 232 points needed to reach target. On Level 52 (`b42b2e0e4d40…`), excluded `S0020` (`256` at `(0,1)`) appears in 16,851 of 63,226 legal actions; 1,868 score at least the remaining 8,880 points. So the tile is neither unavailable nor intrinsically harmful. The retained policy selected one target-crossing path from a large set of available paths.

**Next Step:** Compare the retained cash path with the shortest alternative target-crossing path containing the excluded root, but only at their immediate afterstates: score gain, moves remaining, created survivor, and whether either resulting board still has a legal continuation. This tests why the selected path may be preferable without claiming that raw path count or tile availability is a metric.

## Boundary

The pre-target board is reconstructed exactly from the retained cash prefix, checking each retained pre-state, points total, score, move count, refill RNG count, post-state identity, and terminal result. The existing exact enumerator completes without a path-state cap. A qualifying alternative contains the excluded root and independently crosses the remaining target gap in one move. The alternatives are not executed, ranked by future play, or treated as equally good afterstates; no policy, champion, gameplay, levels, targets, receipts, recordings, or authoring system changed.
