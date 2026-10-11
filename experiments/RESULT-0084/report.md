# RESULT-0084 — fresh board MAP-Elites on breadth × baseline regret

## Outcome

**SUPPORTED_AT_BOUNDED_SCOPE.** The single registered run filled **12** of 49
cells, spanning **5** breadth bins and **5** baseline-regret bins, and the
independent verifier passed the exact artifact and map. This holds for Level 56,
generator seed 20,261,011, descriptor seeds 71,000,000–71,000,002, and the
frozen instrument. It does not say any board is fun, and it does not say how far
behind the owner falls.

| Prediction | Bar | Observed | Verdict |
| --- | --- | ---: | --- |
| P1 breadth spans the map | ≥ 2 bins | 5 | SUPPORTED |
| P2 regret spans the map | ≥ 2 bins | 5 | SUPPORTED |
| P3 joint occupancy | ≥ 5 cells | 12 | SUPPORTED |
| P4 archive integrity | verifier PASS | PASS | SUPPORTED |

Margin: P3 has seven cells to spare and P1/P2 three bins each, so no single board
moving cell flips any verdict.

## Run identity and completeness

- Registration commit `9abcd88fa37cc6939e3b4f5a59be7bee34b720f8`.
- Final subject identity `ef5670d5a992f8c76e0fc41b17f92285e9e4321db74c0718c05393fd782483ef`.
- Artifact identity `12dab1784f92ff434391f7efa4dcf117004fac62ff6037bae8f513523ed5eadf`.
- `output/archive.json` SHA-256 `1a82dca12be1ab9ebe58a21c845d5b0a9dcd39ed1f345c49a08c05059ae06c0a`.
- `output/map.html` SHA-256 `40ab3f2267a96acd06b462474bdb3642229dd5124fcd4e4785cf15e26834b9e4`.
- Command exactly as registered; one run, no retry, no changed threshold.
  Producer verifier output: `PASS`, exit 0.
- Panel: 48 shapes screened, 45 passed the screen, the first 24 evaluated,
  21 eligible. Three were excluded by the authoring verifier (holdout lockouts:
  gen-0017 two, gen-0018 one, gen-0021 two).
- Deviations: none.

## Checks

### C1 — regret zero control: PASS
The zero-control test in `solver/tests/boardRegret.test.js` passed at the
registration commit: a bot matching the best witness scores 0, and regret is
never negative.

### C2 — regret positive control: PASS
The positive-control test passed at the registration commit: a cheaper replayed
witness gives regret as the exact share of the budget, in the expected bin.

### C3 — verifier rejects forged regret: PASS
`solver/tests/boardMapElitesVerifier.test.js` passed at the registration commit,
including the forged bot-row and relabelled-bin cases (38/38 board-search tests).

### C4 — suite unchanged: PASS
Established structurally. No tracked source changed between registration and
the run; the verifier's source-closure check compared every frozen file's
current bytes with the artifact. The full suite is therefore the registered 830
tests, 821 pass, 8 pre-existing failures, 1 skip.

### C5 — redundancy control: reported, no PASS/FAIL bar
Spearman ρ(regret, harvest) over the 21 eligible boards is **0.627**, below the
0.9 "adds little" line. The new axis orders boards differently from the old one
on this panel. This does not affect P1–P4.

### P1 — breadth spans the map: SUPPORTED
5 occupied breadth bins against a bar of 2.

### P2 — regret spans the map: SUPPORTED
5 occupied regret bins against a bar of 2.

### P3 — joint occupancy: SUPPORTED
12 occupied cells against a bar of 5; seven to spare, so no single board moving
cell flips it.

### P4 — archive integrity: SUPPORTED
`solver/verify-board-map-elites.js` returned `PASS` on the exact artifact and
map, including a re-play of the shipped bot on every seed.

## Descriptive facts (not load-bearing)

- The shipped bot won all 63 descriptor games, so every regret value comes from
  a cheaper replayed oracle witness, never from a bot loss. The cheapest plan was
  the harvest witness in 40 seed rows, the bot itself in 20, and the immediate
  witness in 3.
- Regret ranged from 1.1% to 20.0% of the move budget. No board landed in the
  lowest bin (under 1%).
- Breadth is still lumpy: 9 of 21 eligible boards sit at the 128 cap and 3 at
  zero, so the far-right column holds most elites. One eligible board,
  gen-0014 (cell 6,2, bot win 89.3%), was not among its cell's three hardest.

## Elites

Cell is breadth bin, regret bin. Win rate is the verified 300-game holdout bot
win rate (lower ranks first).

| Cell | Rank | Board | Grid | Moves | Target | Bot win | Breadth ≥ | Regret | Harvest |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0,1 | 1 | gen-0009 `d93bfdae0842` | 4×6 | 14 | 62,400 | 65.7% | 0 | 2.4% | 2.4% |
| 0,4 | 1 | gen-0008 `31556eb118fe` | 4×8 | 23 | 147,000 | 55.3% | 0 | 11.6% | 10.1% |
| 0,5 | 1 | gen-0007 `cb804d45f0c9` | 4×6 | 15 | 70,000 | 61.0% | 0 | 15.6% | 8.9% |
| 1,3 | 1 | gen-0019 `4b7df947bfcb` | 5×7 | 24 | 134,000 | 89.0% | 1 | 9.7% | 4.2% |
| 3,3 | 1 | gen-0020 `a0dc55286152` | 4×6 | 16 | 72,300 | 85.7% | 7 | 6.3% | 6.3% |
| 3,4 | 1 | gen-0005 `460a7331cc52` | 4×8 | 16 | 79,900 | 72.0% | 4 | 10.4% | 0.0% |
| 4,4 | 1 | gen-0012 `f562988bddf0` | 5×5 | 15 | 73,100 | 61.7% | 14 | 13.3% | 4.4% |
| 6,1 | 1 | gen-0001 `4a884a19a108` | 5×7 | 26 | 146,000 | 87.0% | 128 | 1.3% | 1.3% |
| 6,1 | 2 | gen-0002 `c81a57637831` | 6×6 | 27 | 149,000 | 90.3% | 128 | 1.2% | 2.5% |
| 6,1 | 3 | gen-0006 `820fcbb6e21c` | 7×6 | 31 | 210,000 | 94.3% | 128 | 1.1% | 0.0% |
| 6,2 | 1 | gen-0011 `038510455059` | 7×5 | 22 | 153,000 | 66.7% | 92 | 3.0% | −3.0% |
| 6,2 | 2 | gen-0016 `30f91fe6135c` | 6×6 | 24 | 168,000 | 73.3% | 128 | 4.2% | 1.4% |
| 6,2 | 3 | gen-0003 `81ae19285374` | 5×6 | 16 | 80,700 | 84.7% | 33 | 4.2% | 0.0% |
| 6,3 | 1 | gen-0022 `624e8f91d824` | 6×6 | 20 | 144,000 | 61.0% | 128 | 6.7% | 5.0% |
| 6,3 | 2 | gen-0004 `1326c2fc3b36` | 7×5 | 20 | 120,000 | 85.0% | 88 | 8.3% | 1.7% |
| 6,3 | 3 | gen-0010 `d0ea6583ca0c` | 5×6 | 22 | 123,000 | 89.0% | 88 | 9.1% | 10.6% |
| 6,4 | 1 | gen-0013 `abe3cdc37318` | 5×8 | 30 | 214,000 | 60.3% | 128 | 11.1% | 2.2% |
| 6,4 | 2 | gen-0023 `1ae76ea3c1a3` | 7×6 | 29 | 219,000 | 69.0% | 128 | 10.3% | 16.1% |
| 6,4 | 3 | gen-0015 `626e20d432ce` | 6×6 | 24 | 150,000 | 86.7% | 128 | 11.1% | 13.9% |
| 6,5 | 1 | gen-0000 `92317e3ff516` | 5×8 | 20 | 137,000 | 74.3% | 54 | 20.0% | 11.7% |

## Calibration playtest (next, separate)

Suggested five boards, one per corner of the map plus the middle: gen-0000
(6,5, most regret), gen-0007 (0,5, no breadth, high regret), gen-0012 (4,4),
gen-0020 (3,3), gen-0001 (6,1, low-regret control). Serve one with
`node tools/board-elite-server.js --archive experiments/RESULT-0084/output/archive.json --board <id>`.
Any owner-versus-bot comparison is a later record and cannot change this one.

## Limits

- Regret is a replayed lower bound against a bot proxy, on three seeds per
  board. A board's cell is a 3-seed estimate and may not be quoted as stable.
- One level (56), one generator seed, 24 evaluated boards.
- `src/game.js` was frozen at `3d405595707621ce`; if a later change to it
  lands first, re-verify at the registration commit, not on the later tree.

## Reverify

At or after the registration commit with the frozen sources unchanged:
`node solver/verify-board-map-elites.js experiments/RESULT-0084/output/archive.json experiments/RESULT-0084/output/map.html`
— expect `PASS` with artifact identity `12dab178…`, 12 occupied cells,
5 breadth bins, 5 regret bins, ρ 0.626545, `SUPPORTED_AT_BOUNDED_SCOPE`.
