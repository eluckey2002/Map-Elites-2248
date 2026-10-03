@codex review

Please review the latest repair commit. All six findings from the first review
have implemented fixes and six passing regression tests. The independent
audit reconstructs the frozen adaptive mutation sequence and rejects a
canonically rekeyed out-of-range cut mutant and an incomplete 599-row panel.
All 235 complete win/move summaries independently match the sealed game data.
Eight confirmation replays match across the two retained recompute receipts.
The reviewed full suite has only the five named baseline failures and its
existing skip; the experiment, authorship and index gates pass locally.

The one confirmation was not rerun. No policy is adopted. Leave PR #61 open
and unmerged.
