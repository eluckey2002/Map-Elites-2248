# What the protected MAP-Elites transition yielded

## Verdict

The transition succeeded as a protected research run and failed to establish a stronger bot.

- **Protected-identity preservation:** `PASS`. The shipped game, current Level 53 work in progress, champion, bot, engine, level authoring, generator, candidate stores, receipts, ledger, and original archive retained their frozen identities. Recordings were outside the run's write scope and no run action targeted them, but their byte identities were not frozen at intake; byte-for-byte recording preservation is therefore `UNVERIFIED`, not part of this PASS.
- **New archive integrity:** `PASS`. The committed verifier accepted 24 occupied cells across all five bins on both axes and exactly replayed all three representatives.
- **Behavior catalogue:** useful and materially fuller within the new run: 24/25 cells occupied after 120 mutants, compared with 20/25 after 48 mutants in the accepted baseline.
- **Exact cross-run behavior expansion:** `INCONCLUSIVE`. Each run recalibrated its axes from its own pilot, so matching cell coordinates do not denote identical behavior intervals.
- **Replacement champion:** `REJECT`. The best screened elite, `896748efe7b5`, measured `+2.182%` on selection games and `-2.217%` on disjoint holdout games (`t=-1.392`). It does not clear positive lift or the project's `t > 3` bar.

## What MAP-Elites gave us

### Observation

The larger run evaluated 11 fixed pilot policies and 120 mutants, made 60 archive insertions or replacements, and occupied 24 of 25 available cells. It found policies across the full five-bin span of both recorded behaviors:

- mean chain length: `9.6827–12.3114`, a range of `2.6287` tiles;
- late-score share: `0.2694–0.3635`, a range of `0.0941`.

The baseline occupied 20 cells after 48 mutants, with a chain-length range of `2.4327` and late-score-share range of `0.1089`.

### Inference

MAP-Elites is useful here as an instrument for exposing different policy styles. A larger search filled nearly the whole map and found a slightly wider observed chain-length span. It is not yet a trustworthy longitudinal coverage metric because the map's numeric boundaries move when the pilot measurement moves.

### Evidence that would strengthen or flip this claim

Freeze one shared pair of axis boundaries and rerun both archives against them. New occupied cells under the shared axes would establish real behavior-space expansion; equal or lower occupancy would overturn the expansion reading.

## What it did not give us

### Observation

The best selection elite in each archived run reversed sign on holdout:

| Run | Policy | Selection lift | Holdout lift | Clustered t |
| --- | --- | ---: | ---: | ---: |
| Accepted baseline | `a61e8b8e23b7` | +3.305% | -3.572% | -1.365 |
| Protected transition | `896748efe7b5` | +2.182% | -2.217% | -1.392 |

The other two representatives in the new archive were intentionally behaviorally distant and substantially weaker than the champion on holdout: `7e8b57682e93` at `-31.606%` and `0873a5b8c4e2` at `-31.110%`.

### Inference

Within the current parameter-only genome, MAP-Elites is finding diversity more reliably than improvement. The second archive's best-screen result again failed to generalize, even with twice the within-run screen and holdout samples. This supports retaining the existing champion and using the archive as a behavior catalogue, not a promotion queue.

This is not a fully independent replication of the baseline pathology. The mutation trajectory used a new seed, but the committed runner starts evaluation seeds at fixed values: the larger run's first six screen seeds and first twelve holdout seeds are the baseline's complete sets. The new run adds an equal number of evaluation seeds rather than replacing them.

### Evidence that would flip this claim

A candidate must produce positive paired lift at `t > 3` on a holdout range that is disjoint from both its selection games and prior archive runs. Until then, no policy discovered by the map is stronger than the champion.

## Representative styles

The three selected representatives show that the archive preserves qualitatively separated policies even when two are much weaker:

- `896748efe7b5`, cell `4,2`: long-chain middle-patience style; mean chain `12.50`, late-score share `31.74%`, holdout win rate `99.31%`.
- `7e8b57682e93`, cell `0,4`: short-chain late-scoring style; mean chain `10.01`, late-score share `39.11%`, holdout win rate `77.08%`.
- `0873a5b8c4e2`, cell `1,0`: shorter-chain early-scoring style; mean chain `10.69`, late-score share `25.56%`, holdout win rate `76.74%`.

These styles are supported as behaviors of the fixed simulated policy runs. They are not claims about optimal play, human preference, or human difficulty.

## Champion standing

The champion remains `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`. No game, level, target, candidate, receipt, authoring artifact, or champion file changed. The research deliverables are the new archive, visual map, and this synthesis; orchestration bookkeeping also exists under the run's spec, worklog, and ticket paths.

## Claim-to-source trace

| Claim | Packet | Primary source |
| --- | --- | --- |
| Baseline archive occupied 20/25 cells and its best screen elite failed holdout | accepted baseline packet | isolated `.orch/tickets/2026-08-22-map-elites-learning/T-001.md`; original `archive.json` SHA-256 `11e50d6b...` |
| New archive occupied 24/25 cells, spanned both axes, and recorded 60 replacements | `T-001` | new `archive.json` SHA-256 `3905956c...` |
| Three new representatives replay exactly | `T-001` | committed `solver/verify-map-elites.js` output against `3905956c...` |
| Best new screen elite failed holdout and did not clear `t > 3` | `T-001` | archived score vectors recomputed with committed `solver/policy-eval.js` |
| Product and original archive identities were preserved | `T-001` | before/after SHA-256 receipts and clean isolated `git status` |
| Exact cross-run cell expansion is unresolved | baseline packet plus `T-001` | differing `axes` objects in the two archives |
| Follow-up is not fully independent across evaluation seeds | baseline packet plus `T-001` | nested `config.screen.seeds` and `config.holdout.seeds` arrays |

## Disagreement register

1. **Selection versus holdout:** selection says `896748efe7b5` is `+2.182%`; holdout says `-2.217%`. Holdout governs champion standing because it is disjoint from selection within the run.
2. **Coverage count versus common coordinates:** 24/25 is higher than 20/25, but the axes differ. Report higher within-run occupancy; refuse exact cell-for-cell expansion.
3. **Fresh search versus independent replication:** the mutation seed is fresh, but evaluation sets are nested across runs. Report a new search with additional evidence; refuse a fully independent replication claim.

## Gaps register

- Axis boundaries are not frozen across runs, blocking exact longitudinal coverage claims.
- Evaluation seed starts are not configurable, blocking a wholly disjoint follow-up without code work.
- Only three of 24 elites have holdout evidence; 21 cells remain selection-only.
- The genome mutates existing hand-designed parameters only; it cannot learn a value function, add planning depth, or invent a new policy structure.
- No human has inspected or played the representative styles, so usefulness to players is unknown.
- One run at the producer's 120-mutation limit does not establish archive convergence or prove the remaining cell unreachable.

## Bottom line

Keep the transition. MAP-Elites is producing a strong map of *different ways the current bot can play*. Do not use the current map to change the champion or levels. The next evidence-bearing improvement would be a separate, explicitly scoped experiment that freezes the axes, uses wholly new evaluation seed ranges, and promotes no cell without holdout evidence.
