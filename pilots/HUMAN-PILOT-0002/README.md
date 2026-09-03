# HUMAN-PILOT-0002 (exploratory, preserved)

One owner-played recording on the HUMAN-PILOT-0001 board with its blockers
replaced by two horizontally adjacent permanent center stones (level 54,
seed 424242). Outcome recorded in the file: win, 20 moves, score 140,544.

Preserved on 2026-09-02 from the untracked worktree
`/private/tmp/2248-human-pilot-20260901`, where the run ticket
`2026-09-02T03-32-17Z-adhoc-second-human-play` left it. Files are byte-for-byte
copies; nothing was regenerated.

Standing after replay qualification (2026-09-03): the recording **replays
exactly** through the shared checker `solver/recording-replay.js` to 140,544
points in 20 moves with no problems, and a controlled broken twin fails through
the same predicate. `qualify.js` writes and re-verifies `replay-challenge.json`
and `execution-receipt.json`; `solver/tests/humanPilot0002.test.js` reads the
real directory and holds those receipts to their identities.

    node pilots/HUMAN-PILOT-0002/qualify.js verify
    node --test solver/tests/humanPilot0002.test.js

What replay exactness does not establish, as `manifest.json` says: the
126,000 target is inherited and uncalibrated for this layout, the contrast is
not a causal blocker-position test, and the session cannot select, ship, or
reject a level. Owner attestation (personally played, no automated player) and
any qualitative disposition are separate records, not yet written.
