# RESULT-0046 — verified board MAP-Elites confirmation

## Outcome

`CLOSED`; primary outcome **`SUPPORTED`** at the preregistered bounded scope.

The one fresh confirmation attempt generated and independently verified a 7×7
MAP-Elites archive indexed by successful plan breadth × harvesting advantage.
It occupied six joint cells, three breadth bins, and four harvesting bins. Each
cell retained at most three distinct board identities.

## Identities and execution

- Registration commit: `4091e60f5a9a26cf23f2ede40cbf7b37713925d2`
- Final subject identity: `f385028282b7747ba2e034f0d6828577e2a44ab1a1580b50b3afbe62ab80abb3`
- Artifact identity: `a3a8cd7b217232d6151cafa4b2643f3e908c8742d3a42b081ea478b36a738ba6`
- Command: `node experiments/RESULT-0046/run.js --protocol RESULT-0046`
- Attempt exit code: `0`
- Independent verifier: `PASS`, repeated successfully from the saved artifact

The repository experiment-gate identity calculation independently reproduced
the exact artifact identity after excluding the registration provenance stamp,
as required by the repaired convention.

## Corpus and archive

- 36 shapes screened; all 36 survived the cheap screen.
- The first 16 screen survivors were fully authored and evaluated.
- 15 boards passed the existing authoring verifier. `gen-0008` was excluded
  because its 300-game holdout contained three lockouts.
- The archive retained 12 distinct elite boards across six cells.
- Occupied breadth bins: 0, 8–15, and 32+ verified routes.
- Occupied harvesting bins: immediate 5–15% better, immediate 1–5% better,
  harvesting 1–5% better, and harvesting 5–15% better.
- Three cells reached the capacity of three elites; no cell exceeded it.
- Across eligible boards, breadth evidence contained 33 replayed-lower-bound
  rows, 11 exact-result rows, and one bounded `UNKNOWN` row. `UNKNOWN` was
  retained rather than converted to proof of absence.
- All 90 eligible harvesting-policy rows contained replayed target-reaching
  witnesses under the paired work cap.

The retained cells are:

| Cell | Meaning | Elites |
|---|---|---:|
| `0,5` | zero verified routes × harvesting 5–15% better | 3 |
| `4,5` | 8–15 routes × harvesting 5–15% better | 1 |
| `6,1` | 32+ routes × immediate 5–15% better | 1 |
| `6,2` | 32+ routes × immediate 1–5% better | 3 |
| `6,4` | 32+ routes × harvesting 1–5% better | 3 |
| `6,5` | 32+ routes × harvesting 5–15% better | 1 |

Empty cells remain explicit empty cells in the 49-cell rendered map. Their
emptiness is a result of this bounded search, not a claim that boards for those
cells do not exist.

## Control reconciliation

- **C1 — PASS.** Exact zero, one, multiple, convergent, capped-zero, and
  illegal-route controls passed. The repaired verifier accepts exhausted empty
  rows as `exact_result` and preserves capped empty rows as `UNKNOWN`.
- **C2 — PASS.** The production harvesting controls returned +0.173913 for the
  harvest-positive board, -0.074074 for the immediate-positive bomb board, and
  exactly zero for the assignment-null control.
- **C3 — PASS.** Every eligible candidate/seed pair has exactly one immediate
  and one harvest arm under common rules, seed, objective, action generator,
  and work cap; every retained win replays to first target crossing.
- **C4 — PASS.** All seven named rejection mutants were killed, provenance
  restamping preserved identity, exact-zero verification passed, the clean
  artifact passed twice, and the repository identity convention reproduced its
  identity exactly.
- **C5 — PASS.** The repository baseline was 463 tests: 458 pass, the four
  documented deliberate failures remain, and one is skipped.
- **C6 — PASS.** All 31 frozen identities matched; the registration gate found
  RESULT-0046; unregistered execution refused before compute; the exact-path
  closeout rehearsal passed and its disposable output was removed.

## Prediction reconciliation

- **P1 — SUPPORTED.** Three breadth bins were occupied; threshold was two.
- **P2 — SUPPORTED.** Four harvesting bins were occupied; threshold was two.
- **P3 — SUPPORTED.** Six joint cells were occupied; threshold was four.
- **P4 — SUPPORTED.** The independent verifier accepted every retained board,
  cell, rank, identity, route, policy comparison, source identity, rendered map,
  exact-zero standing, and registration-independent artifact identity.
- **P5 — SUPPORTED.** P1–P4 are all supported.

## Limits and decision boundary

This result validates the mechanics and bounded usefulness of the agreed axes
for this fresh generated panel. It does not show that the map is full, that
empty cells are unreachable, that route counts are exhaustive when capped,
that either axis predicts fun or human difficulty, that the harvesting ranker
is optimal, or that a retained board should ship. Filling more cells and human
playtesting are later authoring decisions, not part of this confirmation.
