# LC-0003 — four-miss diagnostic review

**Completed:** 2026-09-28

**Scope:** post-qualification diagnosis of moves 4, 6, 9, and 11 only; no new
measure, fitted horizon, fresh evidence, challenger, or champion change

## Question

What board state survived beyond the three-move cutoff and explains why
`threeStepTargetCost` ranked the eventual winner behind in all four LC-0003
misses?

## Finding

At the cutoff, the eventual winner had the larger **immediately harvestable
connected reservoir of built tiles** in all four misses, even though its
current target gap was worse. The unchanged champion's next selected move was
also larger on that branch in every case. That stored value corrected the
target-gap ordering one continuation later on moves 4, 9, and 11, and two
continuations later on move 6.

| Owner move | Eventual winner | Three-step target gap, owner / champion | Ready built harvest, winner / loser | Next selected points, winner / loser | Gap order corrected | Target move, winner / loser |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 4, harmful | champion | 87,408 / 92,656 | 240 / 192 | 31,680 / 5,120 | continuation 4 | 17 / 19 |
| 6, helpful | owner | 86,576 / 77,552 | 448 / 192 | 5,120 / 1,024 | continuation 5 | 15 / 19 |
| 9, harmful | champion | 57,136 / 70,960 | 384 / 0 | 48,960 / 10,560 | continuation 4 | 17 / 20 |
| 11, helpful | owner | 56,176 / 19,632 | 1,760 / 0 | 56,320 / 6,720 | continuation 4 | 15 / 18 |

Ready built harvest is the already-defined
`normalizedBuiltReservoirHarvest` diagnostic, measured at the frozen
three-continuation cutoff. It is not a new score and was not used to alter the
LC-0003 verdict.

## What is observation, inference, and unknown

**Observed:** all eight arms reproduce the exact LC-0003 three-step costs and
full-takeover outcomes. In each of the four misses, the eventual winner has
both the larger ready built harvest and the larger next champion-selected
move at the cutoff. Raw built material does not have this property: on move 4
the eventual loser holds more built material, and on move 6 the eventual
winner holds slightly less. Connectivity and readiness, not total mass, are
the common distinction in this panel.

**Supported inference:** LC-0003 stopped immediately before delayed built
value became score. It measured current score progress but not whether the
board had already assembled a large harvest that the unchanged champion could
cash out next. The meaningful decision state therefore separates **value
already scored** from **built value ready to convert**.

**Unknown:** this four-case, post-hoc match does not establish that reservoir
readiness predicts unseen decisions, determine how it should be combined with
target progress, or justify selecting a four- or five-step horizon. LC-0002
already showed that the same reservoir diagnostic immediately after the
candidate move is insufficient. Timing remains part of the construct.

## Evidence and boundary

The diagnostic collector revalidated the LC-0003 manifest, recording,
champion, engine, game, prior probe, qualification artifact, and exact
decision state shared by each arm. It then continued the unchanged champion
to the target under the existing deterministic streams.

Raw trace:
`docs/learning-cycles/LC-0003-four-miss-diagnostic-raw.json`, artifact identity
`10a05405746480e7232690115a877c6a0a431cdc7bc182f1147178444d4b23fd`,
file SHA-256
`58a6458367295823d56b29f5e4589077161648b0e3619c6e5d6d6cca8eb3c284`.

Collector: `tools/diagnose-lc0003-misses.js`, commit `6a072b8`, SHA-256
`2d46260aaa540bead45f19f658544a13512eaef93517ac63b4f093dd89e31cd2`.

The champion and all protected gameplay, level, target, receipt, recording,
authoring, RESULT-0057, LC-0002, and LC-0003 qualification artifacts remain
unchanged.

Verification: diagnostic artifact identity valid; exact-seam diagnostic tests
2/2 pass; diagnostic, LC-0003, and champion tests 32/32 pass; experiment gate
passes; all protected hashes match their frozen identities.

## Next step

The next bounded task should define a generic **convertible-value** candidate
measure that keeps scored progress and ready built harvest separate, then
validate it on decisions not used in this diagnosis. Do not tune another
horizon against these four opened misses.
