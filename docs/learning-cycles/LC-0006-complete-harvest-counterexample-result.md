# LC-0006 — complete-harvest counterexample result

**Closure:** `CLOSED`

**Exact-state disposition:** `IMPOSSIBLE_COMPLETE_HARVEST`

## Step

Counterexample review.

## Objective

Test whether the already-retained `M6-CONNECT` state refutes the broad rule
that a connected, high-value built reservoir should always be harvested
completely.

## Finding

It does. All eight built tiles are king-adjacent as one component, but that is
not enough to make one full small-to-large chain:

- neither normalized `16` touches a built `32`, so the lower-value ladder has
  no legal entry into the reservoir;
- exhaustive traversal of the eight built tiles found no complete path and a
  maximum legal coverage of seven; and
- the retained champion choice covered zero built tiles and survived as the
  normalized `16` at `(1,2)`.

The placement was also harmful in the retained outcome: `M6-CONNECT` reached
the target on move 16, versus move 15 for `M6-BASELINE`. Its next move scored
4,800 instead of 5,120.

This does not contradict the owner's endgame strategy. It sharpens it: the
goal is not merely one connected pile of large tiles. The board must preserve
both a legal lower-to-built entry and a non-branching, value-ordered route that
can consume the whole reservoir and finish at its largest tile. On this exact
board, the correct implication is “keep constructing,” not “harvest now.”

## Next Step

Use the positive LC-0005 state and this negative state to state the smallest
two-part structural rule—ladder entry plus complete value-ordered path—then
check whether that rule explains the four already-opened three-step misses.
Keep that as a diagnostic review; do not name or implement a policy metric yet.

## Evidence

- Frozen protocol:
  `docs/learning-cycles/LC-0006-complete-harvest-counterexample-contract.md`
- Qualification and pre-outcome admission:
  `docs/learning-cycles/LC-0006-complete-harvest-counterexample-qualification.json`
- Raw retained classification:
  `docs/learning-cycles/LC-0006-complete-harvest-counterexample-raw.json`
- Independently recomputed outcome:
  `docs/learning-cycles/LC-0006-complete-harvest-counterexample-recomputed.json`
- Executable closure:
  `docs/learning-cycles/LC-0006-complete-harvest-counterexample-closure.json`

No champion, game rule, level, target, receipt, recording, or authoring file
changed. No fresh gameplay outcome was generated.
