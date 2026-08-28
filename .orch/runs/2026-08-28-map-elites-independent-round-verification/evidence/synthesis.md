# What the shared-axis MAP-Elites round produced

Date: 2026-08-28

## Verdict

The round succeeded as a quality-diversity experiment.

On the original archive's exact 5x5 behavior grid, the new run occupied **23 of 25 cells (92%)**, compared with **20 of 25 (80%)** in the first accepted run. That is an exact net gain of three occupied behavior niches on shared coordinates.

The round did **not** establish a stronger champion. Its best selected-screen elite, `e7349b8a477a`, scored `+0.7337%` during selection but `-1.4739%` on the wholly fresh holdout set, with clustered `t = -1.3563`. The other two representatives were roughly 28% weaker on holdout. No representative had positive holdout lift, so none approached the project's `positive + t > 3` replacement bar.

Both statements matter at once: the map got meaningfully richer, and the champion did not improve.

## What evolved

MAP-Elites began from the same eleven pilot policies, then evaluated 120 mutated challengers. Each challenger was located by:

- horizontal position: mean chain length, from smaller to larger chains;
- vertical position: share of score earned in the final third, from earlier to later scoring.

Inside each of the 25 cells, the archive retained the policy with the best score against the champion on that round's fixed screen games. This produced 52 successful archive insertions or replacements and 23 final elites.

The new map filled four cells that were empty in the original (`1,1`, `1,3`, `2,0`, and `3,1`) while missing one formerly occupied cell (`2,4`). The remaining empty cells are `1,4` and `2,4`. Every one of the 19 cells shared by both archives ended with a different policy identity in the new round.

That is the central MAP-Elites result: evolution did not collapse into one globally best challenger. It found and preserved many locally best ways of playing across the chain-length and scoring-timing space, including niches whose best available policy is much weaker than the champion overall.

## What the best challenger means

`e7349b8a477a` uses larger chains—mean `12.6426` tiles—and earns `31.1885%` of its score in the final third. Its chain behavior lies beyond the original pilot maximum and therefore lands in the rightmost edge bin.

Its `+0.7337%` screen result is useful selection evidence: it explains why that challenger survived in its cell. It is not generalization evidence. On 288 new holdout games, paired against the unchanged champion on identical boards and seeds, the lift reversed to `-1.4739%`. The reversal is modest and not a significant loss at the positive-replacement bar, but it decisively refuses a stronger-policy claim.

So the reading is:

- **Behavior discovery:** positive. The run expanded exact shared-grid coverage.
- **Best-screen candidate:** mildly promising during selection.
- **Fresh holdout:** no retained advantage.
- **Champion standing:** unchanged.

## Why this comparison is now trustworthy

The code change before this round did two load-bearing things:

1. It copied the original archive's exact chain-style and patience axes, whose identity is `07ac51b0...`.
2. It used screen seeds `4000000–4000011` and holdout seeds `5000000–5000023`, with no seed reused from either prior archive.

The committed verifier replayed all three representatives exactly, checked protected source hashes, and verified the artifact structure. Separate assertions proved exact axis equality, source-archive identity, empty seed intersections, and exact recomputation of all three holdout lifts.

The earlier 120-mutation transition archive's 24/25 native occupancy remains valid for its own grid, but its axes identity differs. It cannot be ranked as exact coverage against 20/25 or 23/25. The exact comparison series is now **20/25 original → 23/25 new**.

## Correction retained

The first research spec for this round expanded a remembered prior-map hash prefix into the wrong full SHA-256. The run itself and all artifacts were valid, but the frozen preservation criterion could not pass. That run was closed failed, its artifacts were retained, and this correction admitted them without rerunning evolution using the exact identity from the prior accepted ticket: `d69c0dcf583ad41361a46609b49672f12f24be2d67515c29660a923b7f7a1201`.

This is a provenance correction, not a changed experiment or a second attempt.

## What remains unknown

- Whether 23/25 is repeatable across more independent rounds.
- Whether the two empty cells are genuinely difficult niches or ordinary misses.
- Whether non-representative elites generalize; 20 of the 23 final cells have selection evidence only.
- Whether frequently occupied edge bins justify a future, separately approved expansion of the behavior axes.
- Whether the current seven-gene genome contains any challenger that can clear the champion's holdout bar.

The next independent round can now answer stability questions cleanly because the coordinate system and seed-provenance mechanism are fixed. It should be treated as another sample of this search process, not as a continuation of one growing population: this runner still restarts from the pilots and lets the live archive select parents within that round.

## Source map

- Machine measurements and exact receipts: `measurement.md`, SHA-256 recorded by the verification ticket.
- New archive: `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json`, SHA-256 `ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22`.
- New visual map: `.orch/runs/2026-08-28-map-elites-independent-round/evidence/map.html`, SHA-256 `a94fc61469d36ab672bcb4722f1b08d628f9bee7d0137dfe0f4afb3568d7a0fb`.
- Runner/verifier revision: `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`.
