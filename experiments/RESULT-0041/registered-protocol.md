# Registered protocol — evolved harvesting policy on the captured corpus

Registered on 2026-09-17 before either policy was executed on the 20-puzzle
comparison matrix. The selected profiles are `ab-comparison` (SHA-256
`a6f1c86ab5ce9c942a12888b0b8f9885d4ca53e5530683d382a7666d1a0fade9`)
and `simulation-policy` (SHA-256
`63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`).

## Question and evidence boundary

On the 18 captured-corpus puzzles that were not part of the four-board
OpenEvolve development panel, does the frozen evolved harvesting ranker transfer
better than its frozen pre-evolution ranker under the same deterministic
600-expanded-state search allowance?

This is an exact retrospective comparison on a named development corpus. It can
show transfer to these 18 previously scored puzzle identities. It cannot prove
optimality, future-board superiority, a population win rate, or performance on
unseen levels. The two captured Level 56 puzzles used during optimization are
executed and reported separately as disclosed overlap diagnostics; they cannot
affect the primary result.

## Experiment declaration and consuming decision

- Primary design profile: `ab-comparison`.
- Context profile: `simulation-policy`.
- Consuming decision: whether the evolved ranker has enough corpus-wide transfer
  evidence to justify a later fresh-board confirmation without further tuning.
- Unit: each exact puzzle identity. The unit of generalization is the fixed set
  of 18 named non-tuning puzzles, not seeds, levels, or future puzzles.
- Assignment: deterministic pairing. Both arms receive identical rules, initial
  board, seed, future random stream, action generator, search portfolio, and
  expansion cap.
- Uncertainty: none is estimated. The full fixed panel is enumerated under a
  deterministic work cap, so effects are exact for this panel and make no
  sampling inference.

## Frozen subjects and production seam

The subject manifest is `subject.json`, identity
`cd6491312ef5d34eb941a1fb7abdcbc47a37ce49a94f41199d49fccef1c95295`.
It binds frozen corpus identity
`59daa4e54dceef9b5da7eacb730d3cecb08f43fc389f9721adec6b4c3dc31308`,
the two policy revisions, the two disclosed overlap puzzles, and all compute and
loss-penalty settings.

- **Control arm:** the ranker introduced at commit `84c7a43`: current score plus
  equal-or-double-compatible tile mass.
- **Treatment arm:** `solver/oracle/harvest-policy.js` from winning optimization
  commit `abf3f31`, SHA-256
  `2b6c6ff96a6d10f6c093d5084abeefb79ac3a635cd0ca2969b3f1cbbb7c89b0b`.
- **Production seam:** `solver/oracle/search.js` generates and transitions legal
  moves, then calls the injected arm only to rank already-generated successor
  states. The default live call remains the evolved module. Neither arm receives
  human paths, human move counts, result labels, or puzzle identities.
- **Bounds:** `includeBaseline:false`, exactly 600 expanded states per arm and
  puzzle, and a 30-second emergency ceiling. Any cell that hits time rather than
  the deterministic work cap invalidates the run.

The full matrix is 20 puzzles × 2 arms = 40 cells. The primary matrix is the
18 non-tuning puzzles × 2 arms = 36 cells. No row may be excluded. A bounded
no-win is retained as `UNKNOWN` search evidence and assigned the frozen
loss-adjusted value `level.moves + 20`; it is never treated as impossibility.

## Controls

### C1 — pairing and matrix integrity (`ab-comparison`)

- **Role:** assignment-integrity.
- **Subject/seam:** all 40 policy/puzzle cells through the frozen runner and
  public artifact verifier.
- **Expected:** exactly one cell for each arm on every frozen puzzle, with the
  same corpus identity and exactly 18 primary plus two overlap puzzles.
- **Failure:** the run is `INVALID`; no domain outcome is assigned.
- **Evidence:** source-bound raw corpus, artifact matrix, and verifier output.

### C2 — deterministic replay and objective equivalence (`simulation-policy`)

- **Role:** reference and objective-equivalence.
- **Subject/seam:** every winning witness through `solver/oracle/verify.js`,
  separately from search transitions.
- **Expected:** every winning chain and spawned board replays to its first target
  crossing; both arms use identical target, move, terminal, and work rules.
- **Failure:** the run is `INVALID`; no domain outcome is assigned.
- **Evidence:** complete witnesses and public verifier output.

### C3 — harness positive, negative, and substitution controls (`ab-comparison`)

- **Role:** positive, negative, assignment-null, and source-integrity.
- **Subject/seam:** the public file verifier and the injected ranking seam used
  by the reportable run.
- **Expected:** a complete matrix of known legal witnesses passes; an on-disk
  planted replay defect fails for replay mismatch; missing, duplicate, and
  source-substituted evidence fails; coherent subject substitution fails against
  the externally frozen subject identity; and a real bounded search calls the
  injected ranker while retaining `UNKNOWN` for no witness.
- **Failure:** stop before reportable execution; qualification is `FAIL` or
  `UNVERIFIED`, and no domain outcome is permitted.
- **Evidence:** `run.test.js` output and `qualification.json`.

### C4 — repository baseline (`simulation-policy`)

- **Role:** reference.
- **Subject/seam:** `node --test solver/tests/*.test.js`.
- **Expected:** exactly 437 tests: 432 pass, the same four documented deliberate
  failures, and one skip; the experiment adds no new solver-suite failure.
- **Failure:** stop before reportable execution and report `UNVERIFIED`.
- **Evidence:** retained command outcome in the qualification receipt.

## Decision-bearing predictions

All metrics below use only the 18 non-tuning primary puzzles.

### P1 — paired transfer efficiency

For each arm, `lossAdjustedMoves` is the sum of winning move counts, with a
no-win charged `level.moves + 20`.

- `SUPPORTED`: evolved wins at least as many puzzles and has strictly lower
  loss-adjusted moves than baseline.
- `FALSIFIED`: evolved wins fewer puzzles or has higher loss-adjusted moves.
- `INCONCLUSIVE`: otherwise.

### P2 — human-comparator guard

A human miss is a no-win, or a win slower than the best verified human win when
one exists. A win on the loss-only puzzle is not a miss.

- `SUPPORTED`: evolved has no more human misses than baseline.
- `FALSIFIED`: evolved has more human misses.
- `INCONCLUSIVE`: impossible under a complete exact matrix, retained as a
  closure state for invalid or unavailable evidence.

### P3 — per-puzzle regression guard

- `SUPPORTED`: on every primary puzzle the baseline wins, evolved also wins in
  no more moves.
- `FALSIFIED`: evolved loses or is slower on any baseline-winning primary puzzle.
- `INCONCLUSIVE`: no primary puzzle has a baseline win.

### P4 — primary panel outcome

- `SUPPORTED`: P1, P2, and P3 are all `SUPPORTED`.
- `FALSIFIED`: any of P1, P2, or P3 is `FALSIFIED`.
- `INCONCLUSIVE`: otherwise.

P4 decides only whether this exact transfer panel supports the frozen evolved
policy. Per-level counts, scores, search timings, overlap rows, and chain shapes
are diagnostics and cannot replace P1–P4.

## Budget, attempts, missing data, and forbidden adaptations

1. Commit this protocol, subject, runner, verifier, qualification tests, and
   executable closeout contract before qualification or reportable execution.
2. Qualify the exact frozen harness once. Verification controls may repeat only
   to diagnose infrastructure errors; three failures at one unchanged step end
   qualification `UNVERIFIED`.
3. If C1–C4 pass, run the 40-cell comparison exactly once, sequentially.
4. Preserve every no-win, crash, invalid witness, timeout, and partial artifact.
   No rerun, policy change, work-cap increase, puzzle replacement, row exclusion,
   threshold change, or best-of selection is allowed after outcomes.
5. Deterministic replay, artifact verification, independent corpus reduction,
   and closure verification may repeat because they do not execute search.

No result automatically changes the live bot, oracle, level design, authoring
bar, or evidence standing. Adoption and fresh-board confirmation are separate
owner decisions.
