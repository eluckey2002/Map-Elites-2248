# LC-0022 — Route-diverse fixed cost ladder

## Step: Fixed Configuration Ladder

**Objective:** Find the largest lower-cost route-diverse beam width that still
recovers the frozen human route, preserves champion fallback, stays within the
128-route cap, and measures no more than 2× champion decision time on the
frozen captured corpus.

**Finding:** None of the predeclared widths qualified. Width 384 recovered the
human route and preserved fallback, but measured 4.73× champion time. Widths
256, 128, and 64 also preserved fallback and the cap, but each lost the human
route and still measured 4.66–4.73×. Narrowing this beam does not reduce the
observed cost enough; it also removes the one required route.

**Next Step:** Do not run another width trial or register the pilot. If we
continue, define a separate generator redesign that identifies and removes the
work causing the cost, then qualify that new mechanism from scratch against the
same route-recovery, fallback, cap, and corpus rules.

## Scope and limits

- The widths 384, 256, 128, and 64 were fixed before this collection.
- All inputs were known training or captured-corpus material; no fresh outcome
  seed, win/loss experiment, champion change, or gameplay change occurred.
- Wall-clock timing is machine-local. This exact no-fit result concerns this
  mechanism and these four fixed widths, not every possible route generator.
