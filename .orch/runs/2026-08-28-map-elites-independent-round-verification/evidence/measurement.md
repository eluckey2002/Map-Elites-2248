# MAP-Elites independent-round measurement

Date: 2026-08-28
Proof class: machine-verified experiment artifact plus heuristic policy observations

## Fixed sources

- New archive: `../2026-08-28-map-elites-independent-round/evidence/archive.json` relative to the runs directory, SHA-256 `ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22`.
- New map: SHA-256 `a94fc61469d36ab672bcb4722f1b08d628f9bee7d0137dfe0f4afb3568d7a0fb`.
- Original accepted archive: SHA-256 `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`.
- Prior transition archive/map: SHA-256 `3905956c2fc0f32e078058938dd2128a47e862f6fd56fc184137cb1b26e63ffa` and `d69c0dcf583ad41361a46609b49672f12f24be2d67515c29660a923b7f7a1201`. The map identity is confirmed by the prior accepted ticket and worklog.
- Runner/verifier revision: `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`.

## Deterministic verification

- `PASS MAP-Elites artifact: 23 occupied cells across 5 chain bins and 5 patience bins`.
- `PASS 3 representative elite replays`.
- `PASS protected champion 52f500c and level-authoring hashes`.
- Exact original/new axes identity: `07ac51b0e1d4d69509052baf5b0af02f5c98854d1387e2701db85e0baf4e8457`.
- The source archive identity recorded inside the new artifact is the exact original archive SHA-256 `11e50d6b...`.
- New screen seeds are exactly `4000000` through `4000011`; new holdout seeds are exactly `5000000` through `5000023`.
- New screen and holdout sets have empty intersection with each other and with every screen/holdout seed in the two prior archives.
- All three archived holdout lifts recompute exactly from paired score vectors with 12 level clusters and 24 seed clusters.
- The code worktree is clean at `8508c3b`; original archive/map, game, bot, engine, level-author, generator, and prior transition artifacts retain their pinned identities.

## Shared-coordinate coverage

The original and new archives use byte-equivalent chain-style and patience axis objects. The exact coordinate bounds are:

- Mean chain length: `9.791666666666666` to `12.224358974358974`.
- Late-score share: `0.27583934835222246` to `0.38470235358141774`.
- Five bins per axis, 25 possible cells.

| Measure | Original | New | Change |
| --- | ---: | ---: | ---: |
| Occupied cells | 20/25 (80%) | 23/25 (92%) | +3 net cells, +12 percentage points |
| Evaluated pilots | 11 | 11 | 0 |
| Evaluated mutants | 48 | 120 | +72 |
| Successful archive insertions/replacements | 31 | 52 | +21 |

The new archive shares 19 cells with the original, fills four cells that were formerly empty, and does not occupy one cell the original did:

- Newly occupied: `1,1`, `1,3`, `2,0`, `3,1`.
- No longer occupied: `2,4`.
- Still empty: `1,4`, `2,4`.
- None of the 19 shared cells retained the same policy identity; the new selection seeds and evolutionary path selected a different elite in every shared cell.

Occupancy by chain-style column, from smaller to larger mean chains:

- Original: `[5, 2, 4, 4, 5]`.
- New: `[5, 4, 4, 5, 5]`.

Occupancy by patience row, from lower to higher late-score share:

- Original: `[4, 3, 5, 4, 4]`.
- New: `[5, 5, 5, 5, 3]`.

The prior 120-mutation transition archive reported 24/25 cells, but its axes identity is `0fc8cf992ebc86754cbcd95d75fc0575ef3844a3fdcb503f14553fe8b9b01e43`, not `07ac51b...`. Its native 24/25 count therefore is not an exact shared-coordinate coverage comparison.

## Policy evidence

The highest selected-screen elite is `e7349b8a477a` in cell `4,1`:

- Mean chain length `12.6426`; late-score share `31.1885%`.
- Screen lift `+0.7337%` versus the champion on the 72 fixed selection games.
- Holdout lift `-1.4739%` on 288 wholly new holdout games.
- Clustered `t = -1.3563`; holdout win rate `99.3056%`.

Its mean chain length exceeds the frozen axis maximum `12.2244`, so the rightmost cell is correctly interpreted as an edge bin that includes behavior beyond the original pilot range, not as a resolved measurement of how far beyond it the policy lies.

The other behaviorally separated representatives are:

| Policy | Cell | Screen lift | Holdout lift | Clustered t | Holdout win rate |
| --- | --- | ---: | ---: | ---: | ---: |
| `d4dee742cedd` | `0,4` | -26.2855% | -28.2598% | -14.1913 | 77.7778% |
| `0b207fb85a0f` | `1,0` | -27.6311% | -27.9189% | -27.4522 | 82.9861% |

No representative has positive holdout lift, so none can satisfy the stronger-policy rule requiring both positive holdout lift and `t > 3`. The champion remains unchanged.

## Observations versus inferences

### Observations

- Exact shared-grid coverage increased from 20 to 23 occupied cells in this bounded run.
- The archive now occupies every cell in the four lowest patience rows; three of five highest-patience cells are occupied.
- The best selection elite's small positive screen lift reversed to a small negative holdout lift.
- The two deliberately behavior-distant representatives are substantially weaker than the champion on both selection and holdout.

### Bounded inferences

- The current genome and mutation process can reach more of the original behavior grid than the first 48-mutation run demonstrated.
- The archive is doing its intended quality-diversity job: it preserves distinct behaviors even when their best available policy is globally weaker than the champion.
- This round did not establish a stronger playing policy.

## Contradictions and correction

- The predecessor research spec pinned an incorrect full SHA-256 for the already-existing prior transition map. Live hashing and the prior accepted ticket agree on `d69c0dcf583ad41361a46609b49672f12f24be2d67515c29660a923b7f7a1201`. The predecessor run was closed failed rather than editing its frozen spec; this correction run admits the unchanged new artifact without rerunning evolution.
- Selection said `e7349b8a477a` was `+0.7337%`; holdout said `-1.4739%`. The holdout result controls champion language.
- The prior transition's 24 occupied cells look higher than this run's 23, but the coordinate systems differ. Only original 20 versus new 23 is exact.

## Gaps and flip evidence

- Whether repeated independent rounds reliably reach 23 or more shared cells remains unknown. Flip evidence: several additional fixed-axis runs with precommitted, disjoint seed ranges.
- Whether the two remaining empty cells are hard to reach or merely missed remains unknown. Flip evidence: repeated occupancy frequencies or targeted emitters under unchanged descriptors.
- Whether any non-representative elite generalizes is unknown because only three representatives received holdout evaluation. Flip evidence: holdout evaluation of additional preselected cells under a multiplicity-aware protocol.
- Whether behavior beyond the right/top boundaries deserves more resolution is unknown. Flip evidence: repeated edge occupancy and a separately approved axis-revision study; changing axes would start a new comparison series.
