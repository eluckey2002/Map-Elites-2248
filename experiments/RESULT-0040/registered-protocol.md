# Registered protocol — two fresh owner-versus-oracle boards

Registered on 2026-09-16 before either board was rendered, played, searched,
or scored. Repository and full-history searches found no prior use of seeds
41,000,000 or 41,000,001. The selected profiles are `ab-comparison` (SHA-256
`a6f1c86ab5ce9c942a12888b0b8f9885d4ca53e5530683d382a7666d1a0fade9`)
and `simulation-policy` (SHA-256
`63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`).

## Question and evidence boundary

On both exact fresh puzzles in `challenge.json`, does the 30-second oracle win
and use no more moves than the owner's first completed attempt when that attempt
wins?

This is a fixed two-case replication. Its unit is each named puzzle identity.
It can show that the already-built oracle reproduces its desired relationship
on these two previously unopened boards. It cannot estimate a future-board win
rate, prove minimum moves, or establish that the oracle is generally superior
to the owner.

## Design and assignment

- Primary design profile: `ab-comparison`.
- Context profile: `simulation-policy`.
- Paired arms: owner and oracle on identical shipped rules, initial board,
  future seeded refills, target, and terminal precedence.
- Board 1 is shipped Level 56, seed 41,000,000. Board 2 is shipped Level 58,
  seed 41,000,001. The level choice deliberately covers an open 6x5, 18-move
  board and a 5x7, 28-move two-bomb board. It was made from static level metadata,
  without generating either seeded board.
- The owner plays first. The oracle must not run until both terminal human
  captures have been written. The first terminal capture received for each exact
  level/seed is the one attempt; later captures are contamination, not replacements.
  Reloads before terminal are not observable, so the owner must report any such
  reload; a reported or detected retry makes that cell `UNVERIFIED`.
- After both captures exist, run the exact oracle implementation at commit
  `5205535` once per puzzle with a 30,000 ms budget. Its worker receives only
  rules, seed and budget. No human path, position, result, or comparator crosses
  the search interface.
- Both arms stop on the first target-crossing move. A win beats a loss. Among
  mutual wins, fewer moves wins and equal moves tie. Scores do not rank arms.

## Matrix, estimator, and outcomes

The complete matrix is 2 boards x 2 arms = 4 terminal outcomes, paired by exact
board identity. No row may be excluded. There is no population estimator or
inferential uncertainty interval: the report gives both exact paired outcomes,
and the panel result is the intersection of those two cases.

- `SUPPORTED`: the oracle has a verified win on both boards and, for every human
  win, uses no more moves than the human. A human loss is passed only by an oracle win.
- `FALSIFIED`: any human win is followed by an oracle loss or a slower oracle win,
  or any human loss is not followed by an oracle win.
- `INCONCLUSIVE`: any cell is missing, contaminated, invalid, or not independently
  replayable; a crash, identity failure, or bounded search without a win is not
  converted into impossibility. If the bounded oracle has no win, that is a
  domain failure under the rule above, not a proof the puzzle is unwinnable.

Per-board move difference (human minus oracle) is reported only for mutual wins.
Current-bot moves, search timing, expanded states, generated actions, and chain
geometry are diagnostics and cannot replace the primary outcome.

## Controls

### C1 — pairing and assignment integrity (`ab-comparison`)

- **Role:** assignment-integrity.
- **Subject/seam:** the exact level/seed in each browser capture and oracle input,
  checked through the production capture and report verifier.
- **Expected:** exactly one selected human capture and one oracle result for each
  challenge row, all carrying the same rules, initial board, and future stream.
- **Failure:** affected row and panel are `INCONCLUSIVE`; stop before comparison.
- **Evidence:** raw human recordings, challenge identity, report rows, and replay.

### C2 — deterministic replay and objective equivalence (`simulation-policy`)

- **Role:** reference.
- **Subject/seam:** both arms through `benchmark-replay.js` and the independent
  oracle verifier.
- **Expected:** every move and spawn replays; both arms terminate at their first
  target crossing or the same genuine loss predicate.
- **Failure:** affected row and panel are `INCONCLUSIVE`.
- **Evidence:** replay receipts including terminal reason, move count and traces.

### C3 — current-bot baseline (`simulation-policy`)

- **Role:** baseline.
- **Subject/seam:** the current bot generated within the same bounded oracle run
  and independently checked choice by choice.
- **Expected:** a current-bot win is retained or improved by the oracle.
- **Failure:** oracle result is invalid and the panel is `INCONCLUSIVE`.
- **Evidence:** source-bound oracle report and verifier result.

### C4 — verifier positive and negative controls (`ab-comparison`)

- **Role:** positive/negative and synthetic assignment-null qualification.
- **Subject/seam:** the qualified public report verifier at mechanism identity
  `7b9b7592bf2ed880af95041ca4e2dc87138308bb9f212125682a4138bd5ded1c`.
- **Expected:** the existing full legal calibration report passes; re-signed
  forged comparisons, changed spawns/timers, post-terminal moves, missing rows,
  duplicate rows, corpus substitution and process-deadline no-witness controls
  fail for their intended reasons. A legal slower witness remains a domain
  failure rather than an integrity failure.
- **Failure:** stop before the oracle challenge run; no primary outcome.
- **Evidence:** 14 named tests in `solver/tests/oracle.test.js` and
  `docs/oracle/QUALIFICATION.md` attempt 2. Any challenge-specific harness change
  must add a same-verifier known-good/known-bad test before reportable search.

## Identity, evidence, and closure

`challenge.json` is the pre-outcome subject manifest. The lifecycle record
`protocol.md` binds its full SHA-256, the rules, engine, capture server, oracle,
replay and verifier sources, both selected profiles, and the executable
`closeout-contract.json`. A not-yet-built challenge adapter may only connect
the two selected captures to the existing oracle and verifier; it cannot change
the search, budget, rules, rows, or outcome logic. Its final source identity must
be added through a superseding preregistration if it changes the scientific
contract; a purely mechanical adapter is qualified before search and bound in
the run artifact.

Required closure cells are C1–C4, P1 (board 1), P2 (board 2), and P3 (panel
intersection). Required artifacts are the two raw human captures, one source-
bound oracle challenge report, one deterministic primary recomputation, and the
narrative report. Closure must use the externally frozen contract identity.

## Budget, attempts, missing data, and forbidden adaptations

1. Commit this protocol, subject, seed reservation, and closeout contract before
   serving a board.
2. The owner completes one terminal capture per board. No substitute seed,
   level, replay, or best-of selection is allowed.
3. Qualify any challenge-specific adapter without generating either oracle result.
4. Run each oracle cell once, sequentially, at 30 seconds including baseline.
   Deterministic replay and report verification may repeat; search may not.
5. Preserve crashes, timeouts, losses, invalid cells and later captures. Do not
   tune the oracle, increase time, change a threshold, or add a third board.
6. Human distraction, accidental pre-terminal reload, outside help, seeing an
   oracle path before finishing both boards, or a missing capture is reported as
   contamination and produces `INCONCLUSIVE` for that cell.

No result automatically changes the live bot, oracle, level design, authoring
acceptance, or claim about future boards. Adoption is a separate owner decision.
