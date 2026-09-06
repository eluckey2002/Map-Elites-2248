---
id: POLICY-EVAL-0001-BASELINE
status: descriptive
source_commit: c61d4430c08fd4e47c9b25bb9885b6b585becd95
---

# Step 2 descriptive baseline

This baseline applies POLICY-EVAL-0001 to the fixed 15-file inventory. It is a
description of a selected corpus, not a population estimate, policy experiment,
or promotion result. The executable source is `c61d4430c08fd4e47c9b25bb9885b6b585becd95`;
the measurement-source identity is
`9b9ecd4db90d60d71b9e83c59348d790ffcf802eedb3f518ca79cc74aa3cefee`.
The machine-readable authority is
[`baseline-c61d443.json`](../../../.orch/runs/2026-09-05-policy-measurement-extra-repair/baseline-c61d443.json),
SHA-256 `a79fe73494dbff59dc7bc8a822c558caf18f3ce0b194412f4e02cbf38b03889e`.

## Complete inventory disposition

All 15 required files are admitted. There are zero unresolved rows, duplicates,
or extras. Repeated attempts remain separate attempts but receive fractional
weight inside their case.

| Panel | Recording filename prefix | Disposition | Case-key prefix |
| --- | --- | --- | --- |
| receipt | `1352aa7a` | admitted | `5536cbfe` |
| receipt | `1c873567` | admitted | `121b79c6` |
| receipt | `3d3ba1f0` | admitted | `0f7f7f5a` |
| receipt | `44d3802d` | admitted | `e22b4e69` |
| receipt | `7061bbf0` | admitted | `c45d5c6d` |
| receipt | `78749fc0` | admitted | `121b79c6` |
| receipt | `7ad0978f` | admitted | `5536cbfe` |
| receipt | `8ac6c9d4` | admitted | `121b79c6` |
| receipt | `d36e875d` | admitted | `bddfd7cd` |
| receipt | `f0ae3e75` | admitted | `2c840e70` |
| receipt | `3823dfce` | admitted | `655fd374` |
| receipt | `c50b34f8` | admitted | `4e15f50a` |
| current-subject | `31a5eae2` | admitted | `e6daf504` |
| current-subject | `640f5c64` | admitted | `7dfdf0ee` |
| current-subject | `b068afb0` | admitted | `97b1f901` |

The full paths, 64-character identities, subject keys, and payload identities
remain in `dispositions[]` of the cited JSON.

## Panel results

| Measure | Receipt-bound candidate/pilot | Current-subject ordinary play |
| --- | ---: | ---: |
| Files / attempts / cases / grids | 12 / 12 / 9 / 8 | 3 / 3 / 3 / 3 |
| Case-weighted reference / human win rate | 100% / 96.296296% | 100% / 100% |
| Regressions | 1 attempt in 1 case | 0 |
| Converted wins `N/n` | 0/9 = 0 | 0/3 = 0 |
| Faster / slower / tied cases | 2 / 5 / 1 | 2 / 0 / 1 |
| Primary mean moves saved `D` | unavailable; `INELIGIBLE` | 1.3333333333333333; `FASTER_ON_THIS_SET` |

The receipt-bound loss `8ac6c9d4...` is the reliability veto. Its labeled
joint-win diagnostic is -0.45454545454545453 moves; it cannot replace `D`.

## Score diagnostic and limits

Score is `matched-horizon, mixed/unknown-intent`: the bot's target stop is
disabled, each attempt uses its recorded human move count as external `H`, and
the original full budget `B` remains visible to the bot. Percentages use the
bot diagnostic score as denominator, and summaries average attempts within each
case before averaging cases. Receipt-bound coverage
is 12/12 attempts and 9/9 cases; the case-weighted human-minus-reference mean is
+682.6666666666666 points, or +4.1577153551513515%. Current-subject coverage is
3/3; its mean is +32,725.333333333332 points, or +39.58420260115114%.

The ordinary rows are exact replays against the pinned current shipped subjects.
They do not establish the historical runtime identity. Both selected panels
support regression examples and this
descriptive baseline only. Contract and inventory identities remain
`3d4cf0f6...` and `1030d178...`; their full hashes are recorded in
[`acceptance.md`](acceptance.md).
