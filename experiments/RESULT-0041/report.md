# RESULT-0041 — Evolved harvesting policy captured-corpus transfer

**Protocol:** `registered-protocol.md`, registered at commit `6730a0a` before
reportable execution.  
**Subject identity:** `cd6491312ef5d34eb941a1fb7abdcbc47a37ce49a94f41199d49fccef1c95295`.  
**Run identity:** `f4fed3e47edeb8a2cf046c8a230271436fd35ebb5703167550837cbc8c1d5acf`.  
**Qualification:** `PASS`, identity
`30be8ae21efb02cd3ff678124370d4fbbb84de7c4eeaaff82aaee34fa62ebb67`.

## Result

The experiment closed **UNVERIFIED** and has no entitled primary domain
outcome. The frozen recomputation command is repository-relative even though
the closure verifier resolves its working directory from this experiment
directory; it therefore points to a nonexistent doubled path. In addition,
the frozen `solver/benchmark-inputs.js` hash was accidentally recorded with 17
characters instead of the gate's required 16, so the correct full source hash
in the run artifact is not covered by the registered freeze. Outcomes were
already visible when these defects were discovered, so neither can be repaired.

An independently executed manual reduction of the immutable corpus applies the
registered rules as **FALSIFIED**. That is preserved as partial evidence, not
promoted into the experiment's primary outcome.

The evolved policy transferred strongly in aggregate on the 18 non-tuning
puzzles, but it did not satisfy the preregistered no-regression requirement.
It won all 18 puzzles versus 15 for the baseline, reduced loss-adjusted moves
from 338 to 253, and reduced human misses from 7 to 3. It nevertheless took one
extra move on puzzle `2bb321b4…` (9 → 10) and five extra moves on puzzle
`3808ee88…` (17 → 22). Because either individual regression was sufficient to
falsify P3, the favorable aggregate cannot change the primary outcome.

Across all 20 corpus puzzles, including the two disclosed optimization-panel
overlaps, evolved won 20/20 versus baseline's 17/20, reduced loss-adjusted moves
from 360 to 272, and reduced human misses from 8 to 3. These all-corpus values
are diagnostic; only the 18 non-tuning puzzles decide the experiment.

## C1 — pairing and matrix integrity: PASS

The immutable artifact contains exactly 40 unique cells: both frozen arms on
all 20 frozen corpus identities. The verifier recovered exactly 18 primary
puzzles and two disclosed optimization overlaps from the externally anchored
subject and corpus identities. No row was missing, duplicated, or excluded.

## C2 — deterministic replay and objective equivalence: PASS

Every winning witness replayed independently through the production game
engine to its first target crossing. Both arms used the same rules, board,
seeded stream, action generator, search portfolio, 600-state cap, terminal
predicate, and loss penalty. Every cell ended at the deterministic work cap;
there were no timeouts or runtime failures.

## C3 — harness qualification: PASS

The public verifier accepted a complete known-legal matrix and rejected an
on-disk replay defect, coherent subject substitution, missing and duplicate
cells, and source substitution. A bounded production search exercised the
injected ranking seam and retained a no-witness result as `UNKNOWN`. Seven of
seven focused qualification tests passed before reportable execution.

## C4 — repository baseline: PASS

The solver suite retained its documented baseline: 437 tests, 432 pass, four
deliberate failures, and one skip. The four failures remained the two stale
candidate receipts, generated-view staleness, and date drift. No new solver
failure appeared.

## P1 — paired transfer efficiency: UNVERIFIED

On the 18 primary puzzles, evolved won 18 versus baseline's 15 and reduced
loss-adjusted moves by 85, from 338 to 253. This clears the frozen requirement
of at least as many wins and strictly lower loss-adjusted moves, so the manual
reduction assigns `SUPPORTED`. Executable closure is unavailable, leaving the
registered claim `UNVERIFIED`.

## P2 — human-comparator guard: UNVERIFIED

Evolved produced 3 human misses versus baseline's 7. It therefore added no
human miss and reduced the count by four, so the manual reduction assigns
`SUPPORTED`. Executable closure is unavailable, leaving the registered claim
`UNVERIFIED`.

## P3 — per-puzzle regression guard: UNVERIFIED

Two baseline-winning primary puzzles regressed:

- `2bb321b4…`, Level 53 seed 2: baseline 9 moves, evolved 10, human 13.
- `3808ee88…`, Level 54 seed 2,832,419,099: baseline 17 moves, evolved 22,
  human 16.

The first regression remained faster than the human; the second remained a
human miss and became five moves slower than baseline. The protocol allowed no
regression on a baseline-winning primary puzzle, so the manual reduction
assigns `FALSIFIED`. Executable closure is unavailable, leaving the registered
claim `UNVERIFIED`.

## P4 — primary panel outcome: UNVERIFIED

The manual reduction assigns P1 and P2 `SUPPORTED` and P3 `FALSIFIED`, which
would make the frozen intersection `FALSIFIED`. The invalid frozen recomputation
command prevents entitled closure, so P4 and the primary outcome are
`UNVERIFIED`.

## Conformance and limits

The one allowed 40-cell run completed with no retries, replacements, timeouts,
missing cells, or post-outcome adaptations. The deviations are the unusable
frozen recomputation command and the malformed 17-character source-freeze
entry. The raw artifact is `corpus.json`;
`primary-recomputation.json` preserves a deterministic manual reduction of
those rows but cannot satisfy the executable contract.

This result establishes exact behavior on the named retrospective panel. It
does not show that the policy is universally better, optimal, or superior on
future boards. It supports the narrower interpretation that the evolved policy
is broadly useful but not a strict replacement for every board under this
bounded search. No adoption or additional tuning follows automatically.
