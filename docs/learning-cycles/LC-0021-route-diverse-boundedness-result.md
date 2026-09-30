# LC-0021 — Route-diverse boundedness qualification

## Step: Challenger Bound Audit

**Objective:** Check whether the implemented route-diverse challenger stays
within its explicit candidate cap and the draft pilot's 2× compute boundary on
the frozen captured corpus, before any outcome experiment is registered.

**Finding:** The supplement never exceeded its 128-route cap across one initial
decision state from each of 20 frozen puzzles. On the 19 non-training puzzles,
the challenger took 5,986,731,333 ns versus the champion's 1,268,700,379 ns:
4.72× the measured decision time. It selected a supplemental route in 11 of
those 19 states. That shows the challenger is active, not that those choices
are better. Its current 512-route configuration does not meet the draft
experiment's 2× compute gate, so the draft must not be registered as-is.

**Next Step:** If the owner wants to pursue this mechanism, define one lower
cost route-diverse configuration before collecting fresh outcomes; re-run the
same human-route, fallback, duplicate/non-mergeable, and 20-puzzle boundedness
qualifications against that frozen configuration. Do not change the champion
or open the fresh pilot until those qualifications pass.

## Scope and limits

- One initial decision state per frozen corpus puzzle; this is a boundedness
  audit, not a win/loss or speed outcome experiment.
- The Level 54 human move-two route remains a separate training qualification.
- Wall-clock time is a machine measurement and may vary on rerun; its observed
  ratio is evidence for the stated configuration, not a universal performance
  guarantee.
- No champion, gameplay, level, target, receipt, recording, or authoring file
  changed.
