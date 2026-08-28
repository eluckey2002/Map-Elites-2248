---
id: level-universe
run: 2026-08-28-adhoc-level-universe
status: complete
executor: orch-investigate
depends_on: []
write_scope: []
bound: one clean-checkout structural census, existing difficulty evidence, and recorded human plays
claimed_by: /root
claimed_at: 2026-08-28T00:00:00-05:00
---

## Objective

Determine what the 53-level player-evaluation universe actually contains, how structurally diverse and difficult it is, and which generalization claims remain unsupported.

## Fixed inputs

- Clean MAP-Elites/player checkout at revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`.
- `src/game.js` level definitions, committed solver/calibration utilities, `EVIDENCE_LEDGER.md`, current run receipts, and replay-verified human-play records only.
- No web sources and no inference from level count alone.

## Completion test

1. A reproducible census reports level count, structural fields, repeated signatures, chapters/scales, blocker coverage, move/min-chain/grid distributions, and where the 53 levels are homogeneous. Oracle class `deterministic`; provenance `pre-existing` definitions with authored read-only calculation.
2. Difficulty claims distinguish targets, current-bot win rates/scores, calibration ruler, and human evidence. Oracle class `evidence`; provenance `pre-existing` ledger and receipts.
3. The result explicitly separates seed diversity from level-layout diversity and lists the unknowns that block a broad general-player claim. Oracle class `evidence`; provenance `authored-here`, independence from primary sources.

## Return fields

- status
- cited findings with confidence
- contradictions
- dead ends
- gaps
- verification

## Result

### Finding 1 — the MAP-Elites optimization universe is six levels, not 53

**High confidence.** At committed runner revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`, `solver/map-elites.js:29-30` fixes selection to levels `[1,10,20,30,40,52]` and representative holdout to `[1,5,10,15,20,26,30,35,40,45,50,52]`. The latest round therefore selected every evaluated policy on 6 level identities x 12 seeds = 72 games. Only three representatives were later checked on 12 level identities x 24 seeds = 288 games. All MAP-Elites runs used a clean checkout whose `LEVELS` count is 52 and whose last level is 52; Level 53 is absent.

### Finding 2 — the current working-tree set has 53 levels, but it is a narrow family

**High confidence for the current working tree; not a committed-baseline claim.** A read-only census of `src/game.js` reports:

- grid geometry: 30 levels at 5x8, 22 at 5x7, one at 6x5;
- moves: 52 levels lie from 22 to 32 moves, with Level 53 alone at 16;
- minimum chain: 10 levels at 2, 16 at 3, 27 at 4;
- blockers: 19 levels have none; the others use only stone, ice, bomb, or their combinations; the defined `lock` type appears in no level;
- tile scale: ten levels each at 1, 2, 4, 8, and 16, plus three at 32; `FACT-0007` proves this scaling changes numbers but not play, so these six values do not add gameplay diversity;
- 46 exact signatures under `(grid, moves, minChain, blocker positions/configuration)`, but only 39 coarser signatures under `(grid, moves, minChain, blocker-type counts)`. Repetition is concentrated early: levels 1-5 are structurally identical except target, as are 6-7, 8-9, and 12-13.

This is meaningful parameter variation within one designed progression, not evidence that the set spans the broader universe of possible 2248 levels. Nearly every level has the same width, one of two heights, one of three minimum-chain rules, one spawn family, and the same scoring/rule system.

### Finding 3 — the six selection levels are a deliberate cross-section but still very small

**High confidence.** The screen includes two 5x7 and four 5x8 boards; minimum chains 2, 3, and 4; no blockers, stones, one bomb, and one ice-plus-stone combination; and move budgets 22, 24, 25, and 30. It excludes the sole 6x5 layout, Level 53's 16-move sprint, bomb-plus-stone combinations, ice-only levels, and most blocker arrangements. New seeds vary spawn realizations on those six fixed structures; they do not create new level layouts.

### Finding 4 — for the current champion, the known curve is close to saturated

**High confidence for the named measurements; medium confidence for unsampled per-level difficulty.** Accepted `RESULT-0016` measured the live champion at 99.58% aggregate win rate across 53 levels x 300 seeds. A fresh `node solver/verify-loop.js` run against the current 53-level working tree sampled levels `[1,5,...,50]` on 60 disjoint seeds: levels 1-30 were 100%, levels 35/40/45 were 98%, and Level 50 was the hardest sample at 92%; early average was 100% versus late average 97%, with 0% lockouts and at most 2% bomb failures. This demonstrates a slight difficulty slope, but not a demanding champion benchmark.

The gate does not sample Levels 51-53, so it cannot characterize their current difficulty individually. Level 53's admission receipt measured 191/300 wins (64%) under its then-current bot; that identity predates later player changes and is not a current-champion estimate.

### Finding 5 — the owner's remembered Level 53 experience matches the recorded evidence, but human coverage is thin

**High confidence for the recorded plays; low coverage for general human difficulty.** Level 53 has three replay-verified owner wins on two seeds: 101,120 in 13/16 moves, 110,208 in 13/16, and 105,216 in 12/16. That is exactly a challenging-but-repeatable win with three or four moves spare. Level 51 has two valid replayed wins after an input bug was fixed, and Level 52 has one replayed win. Six valid wins across Levels 51-53 do not establish the human difficulty distribution of all 53 levels.

### Universe verdict

The current level set is broad enough to exercise the game's existing progression mechanics, but too narrow and too champion-saturated to establish broad player generalization. The more serious correction is that MAP-Elites currently optimizes on only six of those layouts. Fresh seeds protect against spawn-sequence overfitting; they do not protect against six-layout or 53-layout benchmark overfitting.

## Contradictions

- The clean MAP-Elites checkout contains 52 levels, while accepted champion evidence and the current working tree use 53. The working-tree Level 53 is an uncommitted addition relative to the MAP-Elites source revision.
- Level 53 was relatively hard for its admission bot (64% holdout win rate) but the accepted current champion has 99.58% aggregate win rate across the full 53-level set. No current per-level result for Level 53 was retained in the sources inspected.
- The 53 definitions yield 46 exact structural signatures, which sounds diverse, while 52 of 53 boards occupy only two grid sizes. Both are true: blocker positions and move counts vary often inside a narrow geometric/mechanical family.

## Dead ends

- `solver/game-tester.js` cannot directly characterize Levels 51-53 under its `powers2` policy because its chapter table ends at Level 50; it was inspected but not used as a 53-level difficulty oracle.
- The curve gate samples eleven levels through 50 and therefore answers nothing about current Levels 51-53 individually.

## Gaps

- No held-out corpus of unseen level layouts exists for player promotion.
- No structural-distance or gameplay-response coverage metric defines how much of possible level space the 53 levels span.
- No broad human difficulty study covers the full curve; only Levels 51-53 have replay-verified human evidence in the inspected records.
- No current per-level table from the accepted 53-level champion confirmation was retained in the inspected evidence, so aggregate 99.58% may conceal a small hard tail.
- Fun, strategic diversity, and distinct solution styles are largely unmeasured outside the small recorded human sample.

## Verification

1. **PASS deterministic:** direct `LEVELS` census produced 53 current working-tree entries and the reported distributions; the clean MAP-Elites checkout produced 52 entries and fixed screen/holdout constants were read directly from committed code.
2. **PASS evidence:** accepted ledger results, current curve-gate output, Level 53 ticket/receipt, and replayed human records support the difficulty distinctions without merging bot eras.
3. **PASS evidence:** the result explicitly separates random-seed diversity, layout diversity, and unmeasured human/generalization space.

## Feedback

- Earlier discussion framed MAP-Elites as optimizing against the 53-level benchmark. The committed runner shows that selection is actually against six levels; future explanations should name that narrower universe explicitly.

## Risks

- Numeric target variety can masquerade as gameplay variety because tile scaling is an exact isomorphism.
- The current working-tree Level 53 must not be presented as part of the clean 52-level MAP-Elites source revision.
