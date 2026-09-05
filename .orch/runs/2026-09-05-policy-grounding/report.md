# Policy grounding, 2026-09-05

Source snapshot: `07a68c0ebd15763207134690acd1d4f7f061465f`; game and solver
sources are identical to main at `1d1bbdba70011f29518285a55cca558a6af45c0f`.
This is an exact-corpus diagnostic and source review, not a new policy
experiment. No policy, objective, game rule, canonical ledger record, or
backlog status was changed. Confidence labels below apply to the specific
observations, not to general playing strength.

## The benchmark interpretation needs another correction

**High confidence, replayed observations:** all 11 winning recordings in the
12-recording benchmark end on the first move their cumulative score reaches
the candidate's target. The remaining recording loses after its full budget.
None of these winning recordings shows the human continuing past the target.
The three ordinary play recordings also end on their first target crossing.
All 15 recordings replay through the existing `recording-replay.replay()`
with no reported discrepancy. The current browser game itself completes a
level immediately at target crossing: [game.js, checkWinLose](../../../src/game.js#L702).

This contradicts the explanation in the newest HANDOFF.md section,
BL-0012, and human-benchmark.js that the human played on while the bot stopped.
The earlier conversation repeated that explanation. The numerical +65.7%
output is reproducible; its interpretation as a comparison with a shared
objective and opportunity is not supported by these recordings.

The full-budget bot receives more moves than the human used in 11 of 12
benchmark rows. Example: recording `1c873567` ends with a human win at 127,040
points after 12 moves. The full-budget bot scores 226,368 after 24 moves;
the bot with its target override disabled scores 120,320 after 12 moves.
The shipped target-seeking bot wins after 13 moves.

Evidence: [recording-diagnostic.json](recording-diagnostic.json), each row's
raw recording path/hash, candidate identity/hash, budget, replay problems,
first crossing, and all three bot arms. Reproduction:
`node .orch/runs/2026-09-05-policy-grounding/inspect.cjs`.
The runner calls the existing [playBot](../../../solver/human-benchmark.js#L71)
with the original target, with an infinite target/full budget, and with an
infinite target/a budget equal to the recorded human move count. The latter
is a diagnostic common horizon; it does not establish that the human was
trying to maximize score under that horizon. Infinite-target arms naturally
return an out-of-moves loss label; that label is not used as a win metric.

| Comparison on the 12 benchmark recordings | Exact observation |
| --- | --- |
| Both use the original target and stop on crossing | Bot wins 12, human 11. Among the 11 joint wins: bot faster 6, human faster 3, tied 2. |
| Bot's target override disabled; same number of moves as each human recording | Bot scores higher 7 times, human 5. |
| Bot's target override disabled; bot gets full candidate budget | Bot scores higher 12 times, with extra moves in 11 comparisons. |

These are **12 recordings, 9 candidate/seed cases, and 8 distinct initial
tile grids**, not 12 independent boards. Level 51 seed 1 appears three times;
the same Level 53 seed 10 case appears twice. One Level 54 candidate shares
the Level 51 initial grid and budget but uses a different target. The full
identities and groups are in the JSON. Repeated human attempts remain useful
behavioral evidence; they should not silently become independent board samples.

Weighting matters even after matching move counts. The arithmetic mean bot
score difference is +20.466% when each recording has equal weight, versus
+6.234% when each candidate/seed case has equal weight (averaging the attempts
within each case). These are sensitivity calculations, not a selection of the
future aggregation rule or a population estimate. A large difference on the
one human loss contributes to the mean. The scorer's printed +65.7% is also an
arithmetic mean of ratios, unlike the geometric score-lift estimator used by
the policy-search machinery.

## Ordinary play changes which examples we should look at

**High confidence about current replay; limited historical identity:** the
benchmark loader scans `recordings/` and pilot recording folders, not
`play-sessions/`. It therefore omits the three level 56-58 sessions cited by
BL-0013. Their `candidateIdentity` is null. This review resolves them to the
current shipped level and verifies exact move/score replay; it does not turn
them into receipted candidate-authoring evidence.

| Level / recording | Human moves to target | Shipped bot moves to target | Human score | Bot score with target disabled, at the same move count |
| --- | ---: | ---: | ---: | ---: |
| 56 / `31a5eae2` | 11 | 12 | 109,120 | 60,480 after 11 |
| 57 / `b068afb0` | 15 | 15 | 133,760 | 115,392 after 15 |
| 58 / `640f5c64` | 16 | 19 | 170,240 | 139,072 after 16 |

Both players win all three. Win rate ties; speed favors the owner twice and
ties once; score under the diagnostic common horizon favors the owner three
times. Giving the bot the full 18/26/28-move budgets reverses all three score
comparisons. The shipped bot's terminal score is higher on levels 56 and 57
and lower on 58, illustrating how target overshoot and speed rank differently.
None of these comparisons establishes that building caused the difference.

Sources: the three ordinary-play rows in
[recording-diagnostic.json](recording-diagnostic.json),
[recordingSources](../../../solver/human-benchmark.js#L33), and
[play-sessions/README.md](../../../play-sessions/README.md).

## What the current policy can and cannot express

**High confidence, direct source:** after its bomb-priority branch, the
default scorer uses:

`immediate points + next-chain points + survivor placement points +
40 × tileScale × cleared cells + 2 × survivor harvest value`.

The actual [chooseBaseMove](../../../solver/bot.js#L415) implementation and
[DEFAULT_PARAMS](../../../solver/bot.js#L167) define this formula. The
lookahead simulates one merge, gravity, and a predicted refill; rollout uses
the best generated next chain. Placement asks whether a short legal chain
can start at the survivor. Harvest examines equal-, half-, and double-value
company throughout the board, discounted by Chebyshev distance, relative to
the newly created survivor. These terms can favor future opportunities.
Consequently, “the bot has no concept of building” and “no setting of the
weights can produce building” are stronger than this source review supports.

There are narrower, concrete limitations:

- Harvest values the new survivor's relationships, not a separate value for
  all accumulated material or an explicit multi-move building plan. Geometric
  distance/kinship is a proxy, not a proof that a legal connecting chain exists.
- Its code does not actually limit the reward to values above the entire
  dealt range: it returns zero only at or below `2 × tileScale`, while initial
  tiles include 4, 8, and 16 times scale. The comment is broader than the test.
- The scorer has no direct remaining-moves or remaining-target multiplier on
  its future-value terms. The separate immediate-target-win override is its
  target-specific exception and is disabled when a bomb exists.
- Candidate generation happens before ranking: it retains low-value-first
  paths with beam width 8, prefers mergeable-sum prefixes, deduplicates, and
  keeps the top 24 by immediate points. Ranking cannot choose a missing chain.
- Mergeable-sum preference is not an absolute ban: `scoreGreedyPath` returns
  the full path if no qualifying prefix exists. The target override also
  searches untrimmed paths. “Always refuses dead tiles” is inaccurate.

Sources: [harvestValue](../../../solver/bot.js#L350),
[collectCandidates](../../../solver/bot.js#L381),
[immediateWinningUntrimmedCandidate](../../../solver/bot.js#L514),
[scoreGreedyPath](../../../solver/engine.js#L328),
[buildGreedyPathBeam](../../../solver/engine.js#L405), and
[findGreedyChains](../../../solver/engine.js#L475).
Whether different ranking terms would improve whole-game results remains
unmeasured. This review did not search weights or propose a promotion.

One real position demonstrates the generation limitation. Immediately before
the owner's pilot move 20, the score is 102,784 and the target is 126,000:
23,216 more points wins. The human's 37,760-point chain wins immediately.
The bot chooses 1,536. Its default pool's best immediate score is 6,144;
even with `offerFull: 1`, the pool's best is only 21,504. Exhaustive
`findBestChain` finds a legal 37,760-point chain on that same live position.
Changing only the ranking weights cannot select that absent winning move.

The chosen move's score is driven mostly by a predicted 40,000-point next
chain, plus 8,960 turnover and 2,508.8 harvest contributions: this is not a
bot simply refusing to value the future. Also, move 20 is the recording's
last move, not the level's final allowed move: the budget is 24. The bot wins
in 19 moves on its own trajectory, so this counterexample does not prove a
lost game on the bot's own path. It proves a missed immediate finish on a
real human-reached position.

Evidence: [pilot-position.json](pilot-position.json), generated by
[pilot-position.cjs](pilot-position.cjs), and independent visual text output
from the existing `node solver/board-trace.js --moves 20` (same 37,760 versus
1,536). No new final-move search was implemented.

## The cited search premise is also inconsistent

**High confidence, stored artifact plus historical source:** BL-0011 and
BL-0013 attribute a -0.64% MAP-Elites result to RESULT-0017. The actual ledger
entry cites `solver/map-elites-output/archive.json`, whose SHA-256 still
matches `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`.
Its leading screened representative has +3.30% screen lift and **-3.5723%**
disjoint holdout score lift. Recomputing from the stored scores reproduces
that figure; the other representatives reproduce -36.5468% and -11.9252%.
The -0.64% figure was not found in the cited record or these representatives;
its possible origin in another run remains unresolved.

The archive explicitly defines fitness as paired geometric **score** lift.
`git show 52f500c:solver/policy-eval.js` confirms that the historical evaluator
played the full move budget rather than stopping at the target. Thus current
win-rate saturation cannot, by itself, explain this search's lack of score
improvement. Neither this bounded search nor today's code inspection proves
that the weights are near optimal or that the only remedy is new terms.

Evidence: [archive-diagnostic.json](archive-diagnostic.json),
[archive-diagnostic.cjs](archive-diagnostic.cjs),
[RESULT-0017](../../../EVIDENCE_LEDGER.md#result-0017--a-bounded-map-elites-run-finds-20-distinct-behavior-cells-without-changing-the-champion),
and the unchanged primary archive named there. This was artifact arithmetic
verification, not a fresh MAP-Elites run.

## What remains to decide

For reliable winning, count failures explicitly. For faster winning, compare
first target-crossing times and specify how lost games are treated; averaging
only successful games can hide regressions. For scoring, set a common move
budget and terminal-failure treatment before comparing policies. Current
winning human recordings do not supply full-budget human score targets.

The existing human recordings are useful named regression examples and
behavioral demonstrations. They are a small, repeatedly inspected selection,
not fresh holdout evidence for a search. Any later generalizing policy
comparison still needs a preregistered protocol and fresh evaluation cases.
No objective is selected in this report.

All four ticket criteria are covered by the cited source-resolution and
existing replay/benchmark oracles. No broad suite was rerun: this work changes
only its .orch diagnostic/report artifacts. The prior startup run's 344/348
standing is unchanged; no new all-green claim follows.

Dead ends: guessed `experiments/RESULT-0017*` and `.orch/map-elites-*.json`
paths did not exist; the ledger resolved the correct archive. Both were
logged as friction. Uncovered: new weight search, population estimates,
causal attribution of the owner's gains, optimal policy, performance of a
proposed repair, and historical runtime identity for ordinary-play files.
