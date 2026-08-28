# Run: ranked-items-2026-08-21

Ad-hoc set cut from the ranked items after the orphaned-recordings
investigation (`.orch/audits/orphaned-recordings-2026-08-21/findings.md`).

Bound: 4 iterations total, caller-named.

## Graph

| ticket | item | depends_on | write scope |
|---|---|---|---|
| T-006 | ship level 53 | — | `src/game.js` |
| T-007 | recover the 5 orphaned candidates | — | `solver/candidates-archive/`, `solver/tests/recordingReplay.test.js` |
| T-009 | correct T-002's false "no human validation" note | — | `.orch/tickets/curve-debt-2026-08-21/T-002.md` |
| T-008 | correct the false "never verifiable" claims | T-007 | `docs/CHECK-CARDS.md`, `.orch/tickets/curve-debt-2026-08-21/T-005.md` |

Frontier 1: T-006, T-007, T-009 (parallel, disjoint scopes)
Frontier 2: T-008 (after T-007, because the corrected wording must describe the
post-recovery orphan count rather than a predicted one)

## Design decision carried into T-007

Recovered stores go to `solver/candidates-archive/`, NOT to `solver/` top level.
Their receipts do not verify against the current bot (checked: both fail
`code/input identity mismatch`), so recovering them into the live corpus would
add two failing tests for no gain. The archive is the correct home — history,
not live measurement — and `recordingReplay.test.js`'s index already reads it,
so replay resolves while the receipt gate's corpus is untouched.

## Events

- (open) frontier 1 dispatched
- T-009 landed and joined **complete**. Criterion 4 failed as written; the join
  reclassified it as a **cut defect** — a bare `git status --porcelain` reports
  concurrent lanes' writes in a shared worktree. Re-verified scoped to the
  ticket's own write scope: clean. Friction logged against `orch-frontier`:
  disjoint write scopes are required, disjoint *status views* are not, and
  oracles written this way fail for reasons no executor caused.
- T-009 surfaced a real defect wider than it could see: T-002 carried no
  `## Result` heading, and **T-003 had the same fault**. Both were split on the
  first occurrence of the string `## Result`, which fell inside a criterion's
  prose. Repaired at the join; all eight body sections now parse in both.
- T-008's criterion 6 carried the identical unsound oracle. Repaired **before
  dispatch** — the cut owns that defect, not the executor who would have hit it.
- T-006 (ship level 53) and T-007 (recover orphans) still in flight.
- T-006 suspended rather than push through: shipping level 53 falsifies two
  frozen level-count assertions living in `solver/`, outside its write scope.
  Another cut defect — a ticket that ships a level must own the assertions that
  say which levels ship. Satisfied at the join and joined **complete**. Suite
  196/195/1, the one failure still level 52.
- T-006 surfaced that the cut's own "for reference" values were wrong
  (`minChain: 4`, blockers listed; the store says 3 and `[]`). Only the
  instruction to copy from the file rather than the ticket prevented a bad level.
- Two findings from T-006 need an owner decision, carried to the user rather than
  absorbed: level 53's `minChain` reverses 4 -> 3 after 27 levels, and its target
  sits at demand 0.95 against 0.70 for levels 51-52, recorded as
  `provisional-proposal`. Both are properties of the board actually playtested.
- T-007 (recover orphans) still in flight.
