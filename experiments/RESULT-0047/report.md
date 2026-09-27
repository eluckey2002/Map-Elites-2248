# RESULT-0047 — Evolved harvesting policy captured-corpus transfer (corrected identity)

**Protocol:** `protocol.md`, registered and finalized at commit `bf370cb`
before this reportable execution.
**Subject identity:** `f4812d343fba94eb6140d77ff3ad09455a43fe12aad19ad0ca1865131a8c2d66`.
**Run artifact:** `corpus.json`, artifact identity
`5096dd0cf0440f7ef63ce8836281d9ad548bc8049187832c726dbb779c7fb99e`, carrying
a registration stamp (`registration.protocolCommit: bf370cbd5accffa9891cc615cf7d08edf6653205`).

This is a corrected-identity re-registration of the experiment originally run
2026-09-17 as `RESULT-0041` on this branch, which collided with an unrelated
`RESULT-0041` on `main`. The comparison was genuinely re-executed under this
identity via `node experiments/RESULT-0047/run.js --out corpus.json`; all 40
rows reproduce the original run's outcome/moves/score bit-for-bit (verified
by direct diff against the preserved original artifact), confirming this is a
faithful re-execution of the same deterministic computation on the same
frozen corpus, not a copy. Three defects in the original registration/closure
are fixed here, not reproduced: the recomputation command now resolves from
the experiment directory rather than a mismatched `cwd`; the
`solver/benchmark-inputs.js` freeze hash is a correct 16-character digest
(the original recorded 17); and run artifacts now carry a `registration`
stamp (protocol id, protocol commit, exploratory flag) that the original
never wrote at all, added after sealing so it does not perturb
`artifactIdentity`.

## Result

The experiment closed **CLOSED**, primary outcome **FALSIFIED**. On the 18
primary (non-tuning) puzzles, the evolved ranker won 18/18 versus baseline's
15/18 and reduced loss-adjusted moves from 338 to 253 (P1 `SUPPORTED`), and
reduced human misses from 7 to 3 (P2 `SUPPORTED`). It nevertheless took one
extra move on puzzle `2bb321b4…` (9 → 10) and five extra moves on puzzle
`3808ee88…` (17 → 22) — two baseline-winning puzzles it regressed on. The
protocol declares any such regression sufficient to falsify the primary
outcome regardless of the favorable aggregate (P3 `FALSIFIED`), so the
intersection is **FALSIFIED**.

Across all 20 corpus puzzles (18 primary + 2 disclosed optimization-panel
overlaps), evolved won 20/20 versus baseline's 17/20. The 2-puzzle overlap is
diagnostic only and does not affect the primary outcome.

## C1 — negative control: PASS

Ran the baseline ranker against itself on the corpus's first puzzle, twice,
under identical `budgetMs`/`maxExpandedStates`. Both runs returned
bit-identical output (`no-win`, both witnesses `undefined`) — empirically
confirmed, not just argued structurally.

## C2 — positive control: PASS

On the corpus's first puzzle, baseline returned `no-win` while evolved
returned `win` in 17 moves (score 127,616) — the two rankers clearly diverge,
confirmed before the full panel was trusted.

## C3 — suite unchanged: PASS

437 tests, 430 pass, 4 pre-existing documented failures (`candidate-levels-52`
and `candidate-levels-54` stale receipts, generated-view byte-staleness, and
`Universe Map` date drift), 1 skip — the same baseline immediately before and
after this run, once this record's own registration completed. No new solver
or game-logic failure appeared.

## P1 — paired transfer efficiency: SUPPORTED

Evolved won 18/18 primary puzzles versus baseline's 15/18 and reduced
loss-adjusted moves from 338 to 253. Both conditions of the `SUPPORTED`
threshold are met. Computed by `verify.js#analyze`, reproduced independently
via `recompute.js` (see `primary-recomputation.json`).

## P2 — human-comparator guard: SUPPORTED

Evolved produced 3 human misses on the primary panel versus baseline's 7 — no
added miss, and a reduction of 4.

## P3 — per-puzzle regression guard: FALSIFIED

Two baseline-winning primary puzzles regressed under evolved:

- `2bb321b4…`, Level 53 seed 2: baseline 9 moves, evolved 10.
- `3808ee88…`, Level 54 seed 2,832,419,099: baseline 17 moves, evolved 22.

The protocol allows zero such regressions; the observed 2 falsify this check
and, by the protocol's own stopping rule, the primary outcome.

## Conformance and limits

The one allowed 40-cell run completed with no retries, replacements,
timeouts, missing cells, or post-outcome adaptations. This result establishes
exact behavior on the named retrospective panel. It does not show the policy
is universally better, optimal, or superior on future boards, and no
adoption or additional tuning follows automatically — see
`docs/backlog/BL-0013-policy-vocabulary-gaps.md` for the open decision this
bears on.
