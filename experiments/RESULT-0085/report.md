# RESULT-0085 — MAP-Elites over Shared Material boards (BL-0030)

## Outcome

**P1 SUPPORTED, at the lowest margin that still counts.** The one registered
search (seed 2085) filled **6 of 18** cells; all 6 passed the independent
replay, and the filled cells include both Y=2 (3 cells) and Y=3 (3 cells). The
bar was at least 4 verified cells spanning both Y values, so there are two
cells to spare. The run was stopped by the wall-clock cap, not by its
evaluation ceiling. One seed, one run: the count says nothing about run-to-run
variation, and no filled cell may be quoted as reachable by a second run
(protocol, "Sample size and margin"). No claim is made that any of these boards
is fun; the owner plays them separately.

| Check | Outcome |
| --- | --- |
| C1 negative control | PASS |
| C2 positive control | PASS |
| C3 suite unchanged | PASS (solver suite; and the 22 sampler model tests, run to completion after review) |
| P1 how many cells fill | SUPPORTED |
| P2 nothing counted unverified | PASS |
| P3 is this just more compute | INCONCLUSIVE (reported, not gated) |

## Run identity

- Registration commit `e2613d49` (protocol), seeds burned in `186a4f20`;
  instrument `0de88a66`, INSTRUMENT_VERSION 2. Branch `bl30-local`.
- Pilot: seed 85101, 40 evaluations, 0 of 18 cells, 28.0 s. It only showed the
  harness runs and wrote its file. Its numbers are not results and are not
  quoted again here (`output/pilot.json`, `output/pilot-log.txt`).
- Confirmation, run once, command exactly as registered:
  `node prototypes/sampler/shared-search.js --seed 2085 --evals 1500 --max-seconds 3300 --out experiments/RESULT-0085/output/archive.json`.
  Started 2026-10-12T04:00:28Z, ended 04:55:28Z (`output/confirmation-start.txt`,
  `output/confirmation-end.txt`, `output/confirmation-log.txt`).
- Archive versions: instrument 2, shared-search `f662d396…`, model `024c3f61…`,
  search `936240d3…`, engine `ef53e76f…`, node v22.22.0.
- No re-run, no second seed, no edit to the archive or to any frozen file.

## Checks

### C1 — negative control: PASS
Both named tests passed in `output/c2-before-confirmation.txt`
(`node --test prototypes/sampler/shared-search.test.js`, 10 of 10):
`boards that must fail: too few greens, immediate wins, no spare chains`
(test 4) and `no refill is ever a 3 and refills stay on the spawn list, so
flushing the board cannot rebuild greens` (test 3). Stated limit, as
registered: no test runs the loop with the keeper test switched off, so "the
instrument would accept it with the test off" is argued from the code (the
"too few greens" rejection is the first board-quality check in `evaluate`), not
demonstrated. The run's own log shows the rule firing in the live loop: 1
"too few greens" rejection and 4 "too many greens".

### C2 — positive control, run before any measurement: PASS
`node --test prototypes/sampler/shared-search.test.js` run before the pilot
(`output/c2-before-pilot.txt`) and again before the confirmation
(`output/c2-before-confirmation.txt`): 10 of 10 pass each time, including
`planted keeper: the full keeper test passes and every gate is visible in the
entry` and `positive control: the first five start boards of the sampler (seed
2, setup-needing) keep cells in at least two X bins and two Z bins`.

### C3 — suite unchanged: PASS
The registered shallow-clone baseline was 877 tests, 861 pass, 15 fail, 1
skip. Run after the experiment on this same shallow clone
(`node --test solver/tests/*.test.js`): 877 tests, 862 pass, 14 fail, 1 skip.
The three named failures that existed before are present:

- `candidate-levels-52.json has a receipt that verifies against the current bot`
- `candidate-levels-54.json has a receipt that verifies against the current bot`
- `the builder is byte-stable and the committed generated views are current`
  (the Universe Map `4 !== 0`)

The other 11 failures are of the shallow-clone class (ledger-citation,
protocol-commit and custody-proof checks that cannot see cited commits). That is
one fewer than the registered 15; the registered record gives the baseline by
count, so I could not diff those 11 by name. **The CI run on the PR, with full
history, is authoritative** for the full suite. The 22 sampler model tests (`prototypes/sampler/model.test.js`) did not
finish within the first two attempts (about 35 minutes each, stopped). After
Codex review flagged that, they were run to completion on this branch
(`output/c3-model-tests.txt`): all 22 pass, 0 fail, in about 45 minutes. CI
runs only `solver/tests`, so this local run is the evidence for that half of
C3. `git diff 0de88a66 HEAD -- prototypes solver src` is empty, so no source or
test file moved between the instrument commit and this result. This result changed no solver, game or sampler source file.

### P1 — how many cells fill: SUPPORTED
6 of 18 cells hold keepers that pass `--verify` (P2); the filled cells are Y=2:
`X1|Y2|Z1`, `X2+|Y2|Z0`, `X2+|Y2|Z1`; Y=3: `X0|Y3|Z0`, `X1|Y3|Z0`,
`X2+|Y3|Z0`. Bar: at least 4 and both Y values. Margin: two cells to spare;
one cell failing verification would not have flipped the verdict. This is a
count of one run with one seed.

### P2 — nothing counted unverified: PASS
`node prototypes/sampler/shared-search.js --verify experiments/RESULT-0085/output/archive.json`
printed PASS for all 6 cells. The 2 entries with the largest fitness (all six
tie at 10, so by cell key: `X0|Y3|Z0` and `X1|Y2|Z1`) were also run through
`verifyEntry(cell, entry, {deep:true})` by `experiments/RESULT-0085/audit.js deep`:
both returned no failures (`output/deep-verify-log.txt`, `output/deep-verify.json`;
9.6 s and 14.6 s). Difficulty bins of every kept board are in the table; they
are reported, not gated. No stored keeper failed, so none was dropped.

### P3 — is this just more compute: INCONCLUSIVE
Reported, not gated: the protocol sets no bar, so INCONCLUSIVE here means only that the diagnostic decides nothing.
These are diagnostics. They cannot change P1 or P2.

- Loop: 1431 evaluations (236 cache hits not counted) in 3300.3 s, 0.43
  evaluations per second; `run.stoppedBy` = `wall-clock`. The cap is checked
  between evaluations, so it overshot by 0.3 s. The ceiling of 1500 was not
  reached, so the denominator is 1431, not 1500, and the run is not
  reproducible from its seed.
- Loop keeper rate: kept 6 + replaced 1 + "lost its cell" 0 = **7 of 1431
  (0.49%)**. The 262 "lost its cell (incumbent at the cap)" rejections are not
  counted as passes, as registered (they are rejected before the first-move
  count).
- Uniform sample: the first 200 boards from `sampleBoard` with the copied
  `randomTarget`, seed 208501, same `evaluate` and configuration, no incumbent
  in play: **16 of 200 (8.0%)** passed the whole keeper test, in 343 s (0.58
  per second). Those 16 landed in 5 cells: `X2+|Y3|Z0` 7, `X1|Y3|Z0` 5,
  `X1|Y2|Z1` 2, `X2+|Y2|Z0` 1 and `X1|Y2|Z0` 1. `X1|Y2|Z0` was not filled by the
  loop (`output/uniform-sample.json`, `output/uniform-sample-log.txt`).
- Plain reading: per evaluation, uniform start boards passed the keeper test
  far more often than the loop's evaluations did, and 200 uniform samples
  reached 4 of the 6 cells the loop filled plus one it did not. The two rates
  are not like for like (the loop mostly evaluates mutants of boards it has
  already kept or failed late, and loses keepers to filled cells; the uniform
  run has no incumbents), and this is not a compute-matched comparison. It does
  say the loop's 6 cells are not evidence that the search is doing better than
  drawing start boards.

## Elites

Cells are X (spare greens), Y (orders), Z (setup moves). One board per cell.
Win rate is the ordinary one-ply player over 20 noisy games (epsilon 0.2) within
the budget. "Best lines found" is how many distinct best-length wins the
collecting beam saw. Witness shows chain lengths of the stored winning line.

| Cell | Fitness | Best line | Budget | Win rate / bin | Opening chains | Best lines found | Witness (chain lengths; setup moves) | Proxy bites |
|---|---:|---:|---:|---|---:|---:|---|---|
| X0\|Y3\|Z0 | 10 | 4 | 13 | 0.85 easy | 241 | 116 | 4-7-4-4; Z=0 | not all lose |
| X1\|Y2\|Z1 | 10 | 4 | 10 | 0.80 easy | 111 | 4 | 3-4-7-4; Z=1 | not all lose |
| X1\|Y3\|Z0 | 10 | 4 | 13 | 0.75 medium | 103 | 80 | 4-4-7-4; Z=0 | not all lose |
| X2+\|Y2\|Z0 | 10 | 4 | 10 | 0.65 medium | 115 | 1 | 4-4-7-4; Z=0 | not all lose |
| X2+\|Y2\|Z1 | 10 | 4 | 10 | 0.50 medium | 92 | 4 | 3-4-7-4; Z=1 | harvest, obvious and greedy all lose |
| X2+\|Y3\|Z0 | 10 | 4 | 13 | 0.75 medium | 97 | 124 | 4-4-7-4; Z=0 | not all lose |


Boards as 6 x 6 grids of tile values (3 is the green tile; rows top to bottom).
Each board has the forecast on, spawns 2 to 64, and its orders are
`{make:12, from:3}`.

```
X0|Y3|Z0  (eval 414, refill seed 691, 13 moves, greens 12, hash a81b8e8130)
   2  3 32  3 32  8
   3  3 64  3  3 64
  64  2 32  3 64 64
   8  2  8  8  3  3
  32  3  2  2  2  3
  64 32  2  3  2  2

X1|Y2|Z1  (eval 421, refill seed 3198, 10 moves, greens 9, hash e1b174e25b)
   2  8  3  8  3 32
   8 32  8  2  8  3
   2  3  3 32  8  8
   3 32  8  8 32  2
   2  2 32  3 32  3
  32  8  3 32  2  8

X1|Y3|Z0  (eval 40, refill seed 3198, 13 moves, greens 13, hash 1f532e5843)
   3  3  3  3  3 32
   8 32  8  2  3  3
   2  3  2 32  8  8
   3 32  8  8 32  2
   2  3 32  3 32  3
  32  8  3 32  2  8

X2+|Y2|Z0  (eval 129, refill seed 3198, 10 moves, greens 10, hash c7de2cd813)
   2  8  3  8  3 32
   8 32  8  2  8  3
   2  3  3 32  8  8
   3 32  8  8 32  2
   3  2 32  3 32  3
  32  8  3 32  2  8

X2+|Y2|Z1  (eval 213, refill seed 3198, 10 moves, greens 10, hash 3c6f52d5a9)
   2  8  3  8  3 32
   3 32  8  2  8  3
   2  3  3 32  8  8
   8 32  8  8 32  2
   3  2 32  3 32  3
  32  8  3 32  2  8

X2+|Y3|Z0  (eval 8, refill seed 3198, 13 moves, greens 14, hash 0c66579a09)
   3  3  3  3  3 32
   8 32  8  2  3  3
   2  3  3 32  8  8
   3 32  8  8 32  2
   3  2 32  3 32  3
  32  8  3 32  2  8
```

Five of six boards share refill seed 3198 and differ by a few tiles: they
are neighbours of one another, not six independent finds.

## Rejections (the 1431 evaluations)

6 kept, 1 replaced a cell's incumbent, 1424 not kept. Cache hits 236.

| Reason | Count |
| --- | ---: |
| rough win in 3 or fewer | 509 |
| no rough win | 331 |
| lost its cell (incumbent at the cap) | 262 |
| fewer than 60 opening chains | 121 |
| win in 3 moves or fewer | 79 |
| ordinary player loses | 73 |
| too many opening chains (cost guard) | 44 |
| too many greens | 4 |
| too few greens | 1 |

(The rejection counts sum to 1424; with the 7 keeps this is 1431. Most
rejections are boards that are too easy or have no short win. Only 73 failed
for the ordinary player losing.)

## What did not fill

12 of 18 cells stayed empty in this run: an empty cell means the instrument did
not find a board for it here, not that none exists.

- **X0|Y2, all three Z bins** (`X0|Y2|Z0`, `Z1`, `Z2+`): empty. `X0|Y3|Z0` is
  the only X=0 cell filled.
- **Every Z2+ cell** (six: X0, X1, X2+ by Y=2 and Y=3): empty. No kept board
  needed more than one setup move, and every stored witness is 4 moves.
- **The other Z1 cells and one Z0 cell:** `X0|Y3|Z1`, `X1|Y3|Z1`,
  `X2+|Y3|Z1` and `X1|Y2|Z0` are empty. (The 200 uniform samples did produce
  an `X1|Y2|Z0` keeper, so the generator can reach that cell; the search did
  not hold one.)
- **Hard difficulty:** no kept board is hard. Two are easy (win rate 0.85 and
  0.80), four are medium (0.50 to 0.75). The lowest is 0.50 on `X2+|Y2|Z1`,
  the only board whose harvest, "do the obvious" and greedy proxies all lose at
  the budget; the other five can be won by at least one of those proxies. The
  difficulty column is not an axis and was not searched for.

## Limits

- **Z is a found minimum.** The search finds the shortest line with bounded
  beams (1000 / length 8 and 200 / length 7), so best line and Z are upper
  bounds on the true shortest line and the true setup distance, not proofs. A
  cell label is the instrument's reading.
- **Difficulty is measured by a crude one-ply player** with 20 noisy games per
  board. It says how a simple greedy player does, not how a person does, and
  the bins are coarse.
- **Wall clock bound the run.** 1431 of the 1500 ceiling; the result depends on
  machine speed and is not reproducible from the seed.
- **One seed, one run.** No variance estimate. The count of filled cells is a
  count of this run.
- **No claim these boards are fun.** Owner play is a separate decision recorded
  in a PDL entry.
- The 6 elites are near-duplicates in places (see Elites). The map is wide in
  label and narrow in board shape.
- **Instrument defects found in Codex review after the run (not fixed: the
  run's code is frozen, and the archive is what that code produced).**
  (1) At a cell already holding the fitness cap, a candidate with the same best
  line and a smaller hash is rejected before the declared tie-break applies, so
  a capped cell may keep a different, equally good elite. (2) A truncated archive
  entry missing `descriptors` or `bites` makes `--verify` throw instead of
  reporting the cell as failed; the shipped archive is complete. (3) With
  `noFill`, separate blobs can land next to each other, so a board can start
  with a one-move order fill; those boards are still checked by the keeper test.
  (4) The order-count mutation can draw repeated coordinates and add fewer than
  four greens; the child is then rejected as `too few greens`, which wastes
  evaluations. (5) `--verify` checks the lower opening-chain bound but not the
  upper `maxOpen` cap, so it could certify an entry that the search itself
  would reject for cost; the six shipped entries were all produced by the
  search, which does apply the cap. None of these changes a stored elite's
  validity under the checks that did run (every kept entry passes the
  independent replay). (1), (3) and (4) can change the whole stochastic
  trajectory, so the 6 cells are an exact observation of this frozen
  instrument, not a bound on a corrected one (which could fill more or fewer).
  Fixes belong in a new instrument version and a new record.
- The proxies ("bites"), the split report and the compute comparison are
  descriptive only and did not decide acceptance.

## Deviations from the protocol

None in method. Two notes: (1) the protocol allows the deep entries to be run
through `verifyEntry(..., {deep:true})` instead of `--verify --deep`, and that
is what was done; (2) the uniform-sample script copies `randomTarget` verbatim
and its two helpers `pick` and `int` (lines 59 and 60 of the instrument),
which the protocol's "copied verbatim" implies but does not list.
The C3 failure count is 14 against a registered 15 (see C3).

## Reverify

On a checkout whose history reaches `186a4f20`:
`node prototypes/sampler/shared-search.js --verify experiments/RESULT-0085/output/archive.json`
expects PASS for 6 cells; `node experiments/RESULT-0085/audit.js deep` expects
PASS for `X0|Y3|Z0` and `X1|Y2|Z1`; `node experiments/RESULT-0085/audit.js uniform`
expects 16 of 200 keepers (it is deterministic from seed 208501). Both audit modes print only; they replace the retained `output/*.json` receipts solely with `--write`. `node experiments/RESULT-0085/audit.js sources` expects PASS and binds the archive's SHA-1s to the frozen files (`output/source-freeze.json`).
