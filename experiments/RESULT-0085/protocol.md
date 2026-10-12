---
result: RESULT-0085
status: complete
registered: 2026-10-12T03:48:45.395Z
supersedes: null
reportable: confirmation
version_freeze:
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/engine.js: 0ed4b31004df13e3
  solver/policy-eval.js: 2250754e430a2f1a
  src/game.js: 6b79ad6440615835
  prototypes/sampler/shared-search.js: 4d7759ff80353db4
  prototypes/sampler/model.js: c10ee6469dc0cd64
  prototypes/sampler/search.js: fee7eb7ac161a56e
  prototypes/sampler/levels.js: b51fe760e8eab69b
  prototypes/sampler/shared-search.test.js: ffa17b84de47d20d
  prototypes/sampler/shared-search.keeper.json: 295b0a775e7665e1
---

# Pre-registration — MAP-Elites search over Shared Material boards (BL-0030)

**Registered:** 2026-10-12, before any pilot, search, or uniform-sample run of
the instrument on a reportable seed.
**Goal:** `docs/backlog/BL-0030-map-elites-shared-material.md` (intent, not
evidence). The owner's remark of 2026-10-11 that Shared Material boards "would
be great for a map elites" is the origin.

This record is frozen. If the question or the denominator changes, that is a
new scope and a new record — not an edit to this one.

---

## Question

How many of the 18 cells of the Shared Material map does one MAP-Elites search
fill with boards that pass the keeper test and are re-verified independently?

The map has three axes a player can count:

- X, spare green tiles: the number of green 3s on the board minus 4 for each
  order. Bins 0, 1, 2+. (A board with fewer than 4 per order is unwinnable and
  is never kept.)
- Y, orders competing for the greens: 2 or 3.
- Z, setup moves: moves of the winning line played before the first order
  fills. Bins 0, 1, 2+.

3 x 2 x 3 = 18 cells. The answer is a number from 0 to 18 plus whether the
filled cells span both Y values (P1).

## Why this is being asked

PDL-039: the owner kept the Shared Material kind ("that creates a decision!")
but beat the v1 board by clearing tiles and letting refills rebuild the shared
green tile. The sampler's second version removed that route (refills are
powers of two from 2 to 64 and can never make a 3). BL-0030 asks for a map of
such boards along axes the owner can see on the board, because the RESULT-0084
elites felt ordinary: their axes were solver measures a player cannot see.

Expectation, stated before any run: only a handful of cells will fill. Y=3
and Z=0 cells should fill first. Z=2+ cells and many Y=2 cells may stay empty
unless the sampler is widened. The instrument author's smoke runs filled 2
of 18 cells in 40 evaluations; that is development data on exposed seeds and
is not evidence for or against any check below.

## Shape of the run

A search, run once, not a confirmation of one structural change. It is not a
claim that these boards are fun. The owner plays a few elites afterwards; that
reaction is recorded separately in a PDL entry and cannot change this result.

## The change under test

None to the game. The instrument is `prototypes/sampler/shared-search.js`
(INSTRUMENT_VERSION 2, committed in `0de88a66`). The facts below are quoted
from that file and were checked against the code on 2026-10-12.

- **Board family.** 6 columns x 6 rows (`COLS=6,ROWS=6`, line 47); `forecast:
  true` (line 78, checked by `familyProblems`, line 86); tiles are powers of
  two 2..64 or a placed green 3; `spawnValues` 2,4,8,16,32,64 (`SPAWN`); no
  refill is ever a 3. Two or three plain orders, each `{make:12, from:3}`
  (`ORDER_MAKE=12,GREEN=3`: four 3s in one chain), all wanting the same
  greens. No `anyOrder`, parts, spots, stones, gates or leave-N goals.
- **Keeper test** (`evaluate`, lines 275-314; `verifyEntry` repeats it from
  stored lines). All must hold: a solver win within the budget; best line at
  least 4 moves and `search.exhaustive` finds no win in 3 or fewer; the
  ordinary player wins at the budget; at least 60 opening chains
  (`MIN_OPEN=60`); at least 3 distinct winning first chains (`MIN_FIRST=3`);
  no refill is a 3 or off the spawn list; the board is inside the family.
  The solver's best line is the shorter of beam 1000 / length 8 and beam 200 /
  length 7 (`DEFAULT_BEAMS`, line 53).
- **Budget** = `max(best + 6, 3 x orders + 4)` (`budgetFor`, line 68, `SLACK=6`).
- **Ordinary player** (`ordinaryPlayer`, line 142, and `playerScore`): each
  move plays the chain whose resulting board scores highest, one move of
  look-ahead, no undo: 1000 per filled order, plus 100 x the biggest touching
  group of greens (cap 4), minus the sum over greens of the distance to the
  nearest other green, minus 400 per green wasted in a chain that filled
  nothing.
- **Difficulty column** (lines 161-162, `difficulty`): win rate of the ordinary
  player over 20 noisy games (each move random with probability 0.2, seeded
  from the board hash), within the budget. Bins: easy at 0.8 or more, medium
  0.4 up to 0.8, hard below 0.4. Stored on each kept board as a reported
  column, not an axis (3 x 2 x 3 x 3 = 54 cells would be too sparse).
- **Fitness** (`better`, line 328; header line 39): the number of distinct
  winning first chains, capped at 10. Ties go to the shorter best line, then
  the smaller board hash. One board is kept per cell.
- **Not gates.** Whether harvest, "do the obvious", greedy-first and
  greedy-last play lose at the budget, and the split report (order-filling
  chains at the first fill and how many fills each leaves), are reported facts
  stored in each entry. BL-0030's wording ("greedy and do-the-obvious play
  lose; no winning line ignores the shared-tile split") is therefore NOT part
  of the keeper test in this run. They are descriptive only and may not be
  used to accept or reject a board afterwards.

## Denominator

- One search: `--seed 2085`, a ceiling of about 1500 evaluations
  (`--evals 1500`) and a wall-clock cap of 3300 seconds (`--max-seconds 3300`),
  default beams 1000 and 200. The run stops at whichever limit comes first;
  the cap is checked between evaluations only (line 401), so a run can
  overshoot it by one evaluation. If the cap binds, the run is not reproducible
  from its seed (the instrument header says so); the archive records
  `run.stoppedBy` and the evaluations actually done, and those, not 1500, are
  the denominator.
- Unit: one evaluated board (one trip through the keeper test). Cache hits
  (a board hash already tried) are not evaluations.
- Uniform-sample diagnostic (P3 only): the first 200 boards from the
  generator's own start-board sampler (`sampleBoard`, with the round-robin
  target of `randomTarget`, which is not exported and is copied verbatim into
  the report script), seed 208501, each through the same `evaluate` with the
  same configuration.

## Sample size and margin

- **Per verdict:** P1 rests on one archive of at most 18 cells; each cell holds
  one board. The search is run once, so the count is a count of this run and
  says nothing about run-to-run variation. The report must say so.
- **Margin:** P1 SUPPORTED needs 4 verified cells spanning both Y values. At
  exactly 4, one cell failing verification, or one cell lost, flips the verdict
  to INCONCLUSIVE; that is a fragile bar, not a pass with room. FALSIFIED is
  1 cell or fewer; at exactly 1, one more cell flips it to INCONCLUSIVE.
  Between 2 and 3 verified cells, or 4 or more with one Y value only, is
  INCONCLUSIVE.
- **Downstream quantity:** the next stage is the owner playing a few elites
  from different cells. This run registers no bar on how reproducible a cell is
  across seeds; a cell filled here may not be quoted as reachable by a second
  run.

## Seeds

- **Pilot:** search seed 85101, `--evals 40`. Used only to confirm the harness
  runs end to end. Not reportable; its numbers are never quoted as a result.
- **Confirmation:** search seed 2085, one run. Reportable.
- **Uniform-sample diagnostic:** seed 208501. Diagnostic only.
- **Development (exposed, not reportable):** seed 2 (the unit test's
  positive-control start boards), seeds 11 and 12 (a unit-test tiny run), and
  the instrument author's 40-evaluation smoke runs, whose seeds are not
  recorded.

These are search seeds, the seed of the generator's random stream. Each board
the search builds also carries its own refill seed (1 to 9999), drawn by the
generator; that is part of the board, not a separate set. The three new values
were searched for in `experiments/SEEDS.md` and the repository on 2026-10-12;
none lies in any listed range and none is used by another protocol. (Seeds 2,
11 and 12 do fall inside the historical 0-499 game-seed range of
`SEEDS.md`; they are development-only here and are never quoted.) The new
values are added to `SEEDS.md` in a second commit before the pilot runs.

## Starting state, recorded independently

- git HEAD `0de88a66` (the instrument commit) on `bl30-local`, rebased onto
  `origin/main` `ddc418fb`. The registration commit lands on top of it.
- Sampler tests: `node --test prototypes/sampler/model.test.js` has 22 tests,
  all expected to pass; `shared-search.test.js` has 10 tests. Their results
  before the run go in the report, not here.
- Full suite (`node --test solver/tests/*.test.js`): the named failures that
  exist before the run are the candidate receipts for levels 52 and 54 and the
  Universe Map check `4 !== 0` (`universeMap.test.js`, "the builder is byte-stable
  and the committed generated views are current"). Measured on the shallow
  working clone before registration: 877 tests, 861 pass, 15 fail, 1 skip. Besides
  those three, the other 12 fail because the clone is shallow and cannot see
  cited commits (ledger citation, protocol-commit and custody-proof checks);
  CI's full history is authoritative for them. The post-run comparison is
  made the same way, by test name.

## Version hashes (sha256, first 16)

The frontmatter freeze. `solver/bot.js`, `solver/engine.js`,
`solver/policy-eval.js` and `src/game.js` are the registration tool's default
set (`shared-search.js` reads `solver/engine.js` for its archive version stamp
and nothing else from `solver/`). The six `prototypes/sampler/` files are what
this result depends on: the instrument, the rules model, the solver, the level
list, the instrument's tests and the planted keeper fixture.

## Checks, classified before outcomes are assigned

### C1 — negative control (PASS / FAIL)
A board with too few greens is not a keeper. Established by two committed tests
and recorded in the report with the command's output:
- `boards that must fail: too few greens, immediate wins, no spare chains`:
  a hand board with seven greens for two orders is rejected by `evaluate` with
  reason "too few greens"; a board won in 2 moves is also rejected.
- `no refill is ever a 3 and refills stay on the spawn list, so flushing the
  board cannot rebuild greens`: the same seven-green board has no solver win
  (`search.solve`, beam 100, length 6, budget 10, returns null), so rejecting
  it is not just a bookkeeping rule.

PASS needs both tests to pass. Stated limit: no existing test runs the loop
with the keeper test switched off, so "the instrument would accept it with the
test off" is not demonstrated by a test. It is argued from the code: the
"too few greens" rejection is the first board-quality check in `evaluate`
(line 280) and the solver gates after it are what a board must still pass. The
report must not claim more.

### C2 — positive control, run BEFORE any measurement (PASS / FAIL)
The instrument can pass a real keeper and its generator can reach more than
one X bin and one Z bin. Run
`node --test prototypes/sampler/shared-search.test.js` before the pilot and
the confirmation. PASS needs:
- `planted keeper: the full keeper test passes and every gate is visible in
  the entry` (the fixture `shared-search.keeper.json` passes the whole keeper
  test and `verifyEntry`);
- `positive control: the first five start boards of the sampler (seed 2,
  setup-needing) keep cells in at least two X bins and two Z bins`.

If either fails, stop: the measurement cannot show anything. The result of the
run goes in the report.

### C3 — suite unchanged (PASS / FAIL)
Named failures of `node --test solver/tests/*.test.js` before the run equal
those after: levels 52 and 54 candidate receipts and the Universe Map
`4 !== 0`; plus the 22 sampler model tests (`prototypes/sampler/model.test.js`)
pass. Any new named failure is FAIL.

### P1 — primary prediction: how many cells fill
Counted after verification (P2): a cell counts only if its stored board passes
`--verify`.
- `SUPPORTED` — at least 4 of the 18 cells hold verified keepers and the
  filled cells include both Y=2 and Y=3.
- `FALSIFIED` — at most 1 cell holds a verified keeper.
- `INCONCLUSIVE` — anything else, including 4 or more cells in one Y value.

### P2 — guard: nothing counted unverified
Every stored keeper must pass
`node prototypes/sampler/shared-search.js --verify <archive>`, and the 2 entries
with the largest fitness (ties by cell key) must also pass the deep verify
(`--verify <archive> --deep` re-searches every cell; the report may run the two
selected entries with `verifyEntry(..., {deep:true})` instead). PASS when every
stored keeper passes `--verify` and the deep entries pass; FAIL when a stored
keeper fails (it is dropped from the P1 count and named). Difficulty bins
(easy, medium, hard) of every kept board are reported, not gated. No archive
entry is counted unless it is verified.

### P3 — is this just more compute?
Reported, not gated. Evaluations done, seconds, and evaluations per second;
`run.stoppedBy`. This is not a compute-matched comparison with anything. The
diagnostic comparison: keeper rate of the first 200 uniform samples (seed
208501) against the loop's keeper rate, where a keeper is an evaluation that
passes the whole keeper test (for the loop: kept + replaced + the "lost its
cell" rejections in `stats`; "lost its cell (incumbent at the cap)" is a
rejection before the first-move count and is not a pass). Neither number can
change P1 or P2. The report gives both numbers with the plain statement that
they are diagnostics.

## Budget and stopping rules

1. C1 and C2 pass before anything else is run.
2. Pilot: one run, `node prototypes/sampler/shared-search.js --seed 85101
   --evals 40 --out experiments/RESULT-0085/output/pilot.json`, with
   `--beam-wide` and `--beam-narrow` allowed to be narrower. It only shows the
   harness runs and writes its file (the folder is made first with `mkdir -p`).
   A crash or a missing output file is fixed outside the frozen files and the
   pilot repeated; a change to a frozen file means this record is invalid and
   is superseded. Pilot numbers are never reported as results.
3. Confirmation, run once:
   `mkdir -p experiments/RESULT-0085/output && node prototypes/sampler/shared-search.js --seed 2085 --evals 1500 --max-seconds 3300 --out experiments/RESULT-0085/output/archive.json`
   (default beams 1000 and 200). The `mkdir` is required: the instrument
   writes the file once at the end and does not create the folder.
4. **One confirmation run. No re-runs on different seeds.**
5. If the run crashes, loses its output, or ends with no archive written, that
   is reported as an incomplete run (P1 INCONCLUSIVE), not retried on another
   seed. If the run ends at the wall-clock cap with an archive, the archive
   stands and `stoppedBy: wall-clock` is reported.
6. Verification (P2) and the uniform-sample diagnostic run after the archive is
   written and may not change it. The archive is not re-run, edited or
   filtered after it is seen.

## Instrument bound

The verifier replay is load-bearing: P1 counts only cells whose boards pass
the independent replay of the stored lines through `model.js`. The difficulty
bins, the proxy "bite" flags, the split report and the compute and
uniform-sample comparisons are diagnostic and may never become the acceptance
test after the fact. The search finds a shortest line with bounded beams, so
"best" and Z (a found minimum among the lines the instrument sees) are upper
bounds on the true shortest line, not proofs; a cell label is the instrument's
reading. An empty cell means the instrument did not find a board for it in this
run, not that none exists.

## Adoption is a separate decision

A supported map ships nothing. It does not put any board into the kinds
sampler or the app. Choosing boards to show the owner, and anything after that,
is a separate owner decision recorded in a PDL entry.
