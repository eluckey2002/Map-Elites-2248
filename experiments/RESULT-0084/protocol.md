---
result: RESULT-0084
status: registered
registered: 2026-10-11T06:19:42Z
supersedes: null
reportable: confirmation
version_freeze:
  solver/board-map-elites-core.js: 14d500a85af65e02
  solver/board-map-elites.js: db1ca8b1954c0230
  solver/verify-board-map-elites.js: 1cada0d2ee11a2d6
  solver/landmark-frontier.js: 10759bbbddd2f51a
  solver/puzzle-descriptor-witness.js: 0dc5892b5395079b
  solver/board-regret.js: 93790dfb26027100
  solver/human-benchmark.js: aeb2bef796ecedb8
  solver/recording-replay.js: c7284bb2fac849db
  solver/oracle/harvest-policy.js: 2b6c6ff96a6d10f6
  solver/oracle/search.js: 592d155120892330
  solver/oracle/simulation.js: 9cafa661bfb9bed1
  solver/oracle/verify.js: 6eeba60f146e1641
  solver/generate-levels.js: 2d08564b6b1829dd
  solver/level-author.js: c0eef4a582ea0c61
  solver/calibrations/calib-1.js: 276fe4c893a193d9
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/benchmark-replay.js: a714232d4e4bf308
  solver/engine.js: 0ed4b31004df13e3
  solver/experiment-guard.js: 200ad71fad9492a3
  src/game.js: 3d405595707621ce
  solver/tests/boardMapElitesCore.test.js: 00ecaa7bb94d732e
  solver/tests/boardMapElitesMeasure.test.js: 90f966344e59628c
  solver/tests/boardMapElitesVerifier.test.js: 169072af90f435aa
  solver/tests/boardRegret.test.js: 6c70943203177297
  solver/tests/landmarkFrontier.test.js: b4e53532571f4cd0
  tools/verify-experiments.js: ab867b72b8a71379
  experiments/SEEDS.md: ee230a697c43da6c
---

# Pre-registration — fresh board MAP-Elites on breadth × baseline regret

**Registered:** 2026-10-11, before any generator or gameplay input on the
confirmation seeds ran.
**Goal:** owner approval of 2026-10-11 ("Both fresh run"; axis card answer
"Breadth + new axis"), plan
`docs/plans/2026-10-11-delivery-and-level-map-elites-plan.md`.

This record is frozen. If the question or the denominator changes, that is a
new scope and a new record — not an edit to this one.

---

## Question

Does one frozen run of 48 sampled Level 56 board shapes (first 24 screen
survivors fully evaluated) fill at least five cells of a 7×7 map whose axes are
successful plan breadth and baseline regret, spanning at least two bins on each
axis, with every elite independently re-verified?

## Why this is being asked

The family-board search (RESULT-0044..0047 on
`feat/family-board-map-elites-20260919`) paused only over ledger-ID
bookkeeping (DECISION-0011, BL-0023). The owner chose a fresh run on `main`
instead of renumbering, so those records are dropped under BL-0023 criterion 4
and nothing from them is quoted here.

The old Y axis, harvesting advantage, asks whether a harvesting search beats an
immediate-scoring search. Baseline regret asks the question closer to the
owner's play (PDL-008, build-and-harvest): how many moves does the shipped
bot's usual play give away on this board against the cheapest plan the
measurement can replay? On the old archive's 15 eligible boards the two
correlated at Spearman 0.77 (development data, exposed seeds, not evidence);
C5 below checks how much they still overlap on fresh seeds.

## Shape of the run

One search, run once. It is a map of board variety at bounded scope, not a
claim that any board is fun, and not a ship decision for any board.

## The change under test

None to the game. The instrument is the ported search
(`solver/board-map-elites*.js`, ported unchanged in commit `4840664e`) with
its Y axis switched to `solver/board-regret.js` (commit `feade951`). Harvest is
still measured and recorded because regret is built from its witnesses.

Baseline regret per seed = (bot cost − cheapest of bot cost, immediate witness
cost, harvest witness cost) / move budget, where the bot is
`solver/human-benchmark.js` `playBot` (shipped bot, stops at the target) and a
loss or missing witness costs budget + 1. The board's value is the mean over
seeds. It is a replayed lower bound against a bot proxy: a better unfound plan
can only raise it, and the owner is not the bot.

Bins (frozen in `REGRET_BINS`): 0–1%, 1–3%, 3–6%, 6–10%, 10–15%, 15–25%,
≥25% of the move budget. Breadth bins are unchanged from the port. Each cell
keeps up to three distinct boards, lower verified holdout bot win rate first.

## Denominator

- Generator seed 20,261,011; 48 sampled shapes at Level 56; the first 24 that
  pass `screenVerdict` are fully evaluated.
- Each evaluated board: authoring gates on the existing fixed fitting and
  300-game holdout panels (`solver/level-author.js`), then breadth, paired
  harvest searches (2 policies) and the bot baseline on each of 3 descriptor
  seeds.
- Unit: one board design. Matrix: 24 boards × 3 seeds = 72 descriptor games
  per measure; harvest is paired (144 searches).

## Sample size and margin

- **Per verdict:** P1–P3 count occupied bins and cells across at most 24
  eligible boards. Three descriptor seeds per board means one board's regret
  moves in steps of 1/(3 × move budget), about 2.4% of a 14-move budget, so a
  board near a bin edge can change cell with one seed's result.
- **Margin:** P3 needs 5 cells. If the run lands exactly 5, one board moving
  cell flips it; that is a fragile bar and the report must say so. P1 and P2
  need 2 bins each; at exactly 2, one board flips each.
- **Downstream quantity:** the next stage is the owner playing up to five
  elites (calibration control below). This run registers no bar for how stable
  a board's cell is across more seeds, so a board's cell is a 3-seed estimate
  and may not be quoted as stable.

## Seeds

- **Development:** 43,000,000 with generator seed 20,260,919 (one timing run
  of three boards, 2026-10-11) and the unit-test seeds 41,500,000 and
  20,260,917. All exposed; none is reportable.
- **Confirmation:** 71,000,000–71,000,002 (3 seeds), generator seed
  20,261,011.

Both confirmation values were searched for in `experiments/SEEDS.md` and the
repository on 2026-10-11 and are unused; both are added to `SEEDS.md` in this
registration commit, together with the development seeds.

## Starting state, recorded independently

- git HEAD `feade951`, branch `claude/project-thread-4qfp1a-level-search`
  (from `origin/main`).
- Board-search tests: 38 pass, 0 fail
  (`boardMapElites*`, `boardRegret`, `landmarkFrontier`, `boardEliteServer`).
- Full suite (`node --test solver/tests/*.test.js`): 830 tests, 821 pass,
  8 fail, 1 skip. All 8 are pre-existing and fail the same way on `main`'s CI:
  the three decided failures (candidate receipts for levels 52 and 54; the
  generated-views check) and five policy-lab audit tests (independent audit
  panels; final-tree closeout revalidation; independent CLI refusals;
  incomplete numeric audits; LIVE custody proof). None touches board search.
- `src/game.js` is frozen here. Open PR #70 changes it; if #70 lands first,
  this result stays valid at its recorded commit and is re-verified there, not
  on the later tree.

## Version hashes (sha256, first 16)

The frontmatter freeze. It covers every path in `SOURCE_PATHS`, which the
verifier also checks against the artifact, plus the tests, the gate and
`SEEDS.md`.

## Checks, classified before outcomes are assigned

### C1 — regret zero control (PASS / FAIL)
A bot that matches the best witness scores 0 (`boardRegret.test.js`, zero
control) and regret is never negative.

### C2 — regret positive control, before the run (PASS / FAIL)
A cheaper replayed witness gives regret as the exact share of the budget,
and lands in the expected bin (`boardRegret.test.js`, positive control).

### C3 — verifier rejects forged regret (PASS / FAIL)
The verifier re-plays the shipped bot on every seed and rejects a changed bot
row or bin (`boardMapElitesVerifier.test.js`). All earlier breadth, harvest,
archive and identity mutation tests still pass.

### C4 — suite unchanged (PASS / FAIL)
The full suite's named failures after the run equal those listed above.

### C5 — redundancy control (reported, never a pass/fail of P1–P4)
Spearman ρ between regret and harvest over eligible boards, written to the
artifact summary. ρ ≥ 0.9 is reported as "regret adds little beyond harvest
on this panel"; it does not change the premise.

### Calibration control (separate, after this result)
The owner plays up to five elites through `tools/board-elite-server.js`. A
later record compares the owner's moves with the bot's on those boards. It is
not part of this result and cannot change it.

### P1 — breadth spans the map
`SUPPORTED` at two or more occupied breadth bins; otherwise `FALSIFIED`.

### P2 — regret spans the map
`SUPPORTED` at two or more occupied regret bins; otherwise `FALSIFIED`.

### P3 — joint occupancy
`SUPPORTED` at five or more occupied cells; otherwise `FALSIFIED`.

### P4 — archive integrity
`SUPPORTED` only when `solver/verify-board-map-elites.js` passes the exact
artifact and map. A demonstrated integrity defect is `FALSIFIED`; incomplete
verification is `INCONCLUSIVE`.

### Primary outcome
All of P1–P4 supported gives `SUPPORTED_AT_BOUNDED_SCOPE` (the artifact's
`premise`); any falsification gives `DISCONFIRMED_AT_BOUNDED_SCOPE`;
otherwise `INCONCLUSIVE`.

## Budget and stopping rules

1. C1–C3 pass before the run (they are in the suite at the frozen commit).
2. One run, exactly:
   `node solver/board-map-elites.js --protocol RESULT-0084 --out experiments/RESULT-0084/output --count 48 --full 24 --sampler-seed 20261011 --level 56 --descriptor-seed-start 71000000 --descriptor-seeds 3`
   The producer runs the verifier on its own output.
3. **One confirmation run. No re-runs on different seeds.**
4. A search hitting the emergency time budget stops the run with a thrown
   error; that is reported as `INCONCLUSIVE`, not retried.

## Instrument bound

The cell counts and the verifier verdict are load-bearing. Regret values,
harvest values, ρ and win rates are descriptive. Regret is a lower bound
against a bot proxy; it may never be reported as how far behind the owner
falls.

## Adoption is a separate decision

A supported map ships nothing. Putting any elite in the game is an owner
decision after the calibration playtest, through the normal level-authoring
path.
