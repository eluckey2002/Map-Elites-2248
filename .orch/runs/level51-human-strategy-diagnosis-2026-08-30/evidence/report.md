# Level 51 human-strategy diagnosis

- **status:** `SUPPORTED_SHARED_PRINCIPLE`
- **scope:** Two owner-played, replay-valid Level 51 seed-1 wins versus the protected champion at `be843368`.
- **result:** Both human strategies use valuable routes the champion never sees and accept a normally harmful survivor when it advances the actual target quickly enough. The shared lesson is **target-aware route diversity**: preserve genuinely different completed routes, then price future usability against score still needed and moves remaining rather than applying the same long-game caution everywhere.
- **not established:** That this rule improves general play, that either human trajectory is optimal, or that the current champion should change.

## Plain-language finding

The main difference is earlier than the champion's scoring formula.

The champion first invents a small menu of possible chains, then scores that menu. Across the 26 human moves in the two wins, **25 human chains were not on that menu at all**. The champion could not choose those moves, even when its own scoring formula would have preferred the human move if it had been offered.

That happened in both styles of play:

- The 12-move strategy repeatedly found very long chains and scored steadily. All 12 moves were absent from the champion's menu; 9 were longer than every chain on that menu.
- The 14-move strategy used smaller setup moves and then larger cash-outs. Thirteen of 14 moves were absent; 7 were longer than every chain on the menu. Its one generated human move ranked second, not first.

The recordings also show why blindly adding every large chain is wrong. Eighteen of the 26 human moves leave an off-lattice survivor that cannot be matched later—10 of 12 in the faster strategy and 8 of 14 in the second—and both winning moves do so. You accepted future board damage because reaching the target ends the level. The champion is calibrated for full-budget health and usually filters those chains out.

So the shared principle is not “copy this exact chain,” “always take the longest chain,” or “allow every untrimmed chain.” It is:

> Keep several globally different completed routes visible, then permit a risky cash-out only when its target progress justifies the future board damage.

This is implementation-ready as a behavioral requirement, but it does not choose an algorithm or parameter.

## Exact reconstruction

The original candidate file is absent from the live filesystem, so the diagnosis recovered it from immutable Git object `420ba8ef79e1850e7dc50124f7ab564801b1d314:solver/candidate-levels.json`.

- Its canonical identity recomputes to the recordings' identity, `524f37c0063d61e5ab4b636b720f3cd644ec83cba62324e48304d5a12bb3dd5c`.
- Its gameplay fields exactly equal shipped Level 51: 5x7, minimum chain 4, 24 moves, tile scale 32, target 124,000, no blockers.
- Recording `1c873567...` replays exactly to 127,040 in 12 moves.
- Recording `78749fc...` replays exactly to 130,496 in 14 moves.
- The protected champion on the same level and seed reaches 124,000 in 17 moves, stopping at 125,952.

The independent verifier passed 11/11 checks, including source hashes, both exact replays, the champion replay, decision-table coverage, and rejection of a tampered recording. See `verification.json` SHA-256 `17dcb30fc26ab151ddeaebd393077a1f9543d9ec51491ff22005689dd2b2ff75`.

## Decision evidence

The machine-readable table covers every human pre-move state. For each, it reconstructs the legal human chain, asks the champion what it would do on that exact state, rebuilds the champion's generated candidate set, and computes the champion's immediate, next-move, placement, turnover, and harvest terms for both actions.

| Observation | 12-move strategy | 14-move strategy | Combined |
| --- | ---: | ---: | ---: |
| Human moves | 12 | 14 | 26 |
| Human action absent from current generated set | 12 | 13 | 25 |
| Human chain longer than every current generated chain | 9 | 7 | 16 |
| Human action scores higher under champion's own total | 10 | 8 | 18 |
| Human action scores higher immediately | 10 | 6 | 16 |
| Human action leaves an off-lattice survivor | 10 | 8 | 18 |

The decision table is deterministic across two complete runs, SHA-256 `2f30244b37a3dd6bfa9bd65c62c2d76e213469caac325cd8a43cf6e2d6dcd904`.

## Causal assessment

### 1. Candidate generation — supported shared cause

Observation: 25 of 26 human actions are absent from the champion's candidate set. Sixteen human chains are longer than every chain it offers on the same state. When the existing path beam is widened from 8 to 64, it exactly recovers only four of the 26 human routes across its trimmed and untrimmed forms.

Inference: the problem is not just the final candidate-count cap and not just one too-small beam width. The generator commits to a narrow set of route geometries before the evaluator can compare their completed consequences. Its mergeability filter also encodes one fixed risk posture: preserve the future board, even when the remaining target may justify a cash-out.

An existing arm must not be repeated: historical run `chain-offer-v2` tested simply offering the current walk's untrimmed chain. On 53 levels x 100 pilot seeds it reduced paired score by 23.14% (`t = -17.8`) and win rate by 10.5 points, so its pre-registered stop rule fired before confirmation. That result is preserved at Git object `530deb3dcf7f7edf43d86d74910ce92a25f2b18a:.orch/runs/chain-offer-2026-08-23/stop-record.md`. The supported principle therefore requires a target-aware risk condition; “allow every large off-lattice cash-out” is already falsified.

What would flip this finding: a mechanically equivalent human afterstate found in the current candidate set, or a re-check showing the action-key comparison ignored a representation equivalence that leaves the same survivor and removed cells. The verifier uses survivor plus the complete selected-cell set, so neither was observed.

### 2. Move valuation — secondary, not the shared primary cause

Observation: if the recorded human action is scored counterfactually, the champion's existing two-ply formula already values it above the champion's chosen action on 18 of 26 states. It cannot choose those 18 because they were not generated. Eight moves score lower, including the only generated human move.

Inference: valuation changes alone cannot teach the champion actions it never sees. Valuation may still matter for setup moves, especially in the 14-move strategy, but it is not the common first bottleneck.

What would flip this finding: a generator that reliably offers the relevant route while the current evaluator still rejects it on both trajectories.

### 3. Target awareness and lookahead horizon — target awareness is shared; longer horizon is strategy-specific

Observation: both winning moves deliberately leave off-lattice survivors, and 18 of 26 moves do so overall. The 14-move strategy's first four actions all score below the champion's alternative under the current two-ply formula; eight of its final ten score above. Its score arrives in deliberate spikes, notably 28,480 on move 5 and 20,800 on move 11. The 12-move strategy does not show the same setup dependence: ten of its twelve actions already score higher under the current formula.

Inference: the shared missing input is the level's finish condition—score still needed and moves remaining—when judging whether future-usability damage is acceptable. A longer horizon may additionally be needed to understand the 14-move setup, but the evidence does not establish longer horizon as shared.

What would flip this finding: counterfactual continuation showing the early 14-move setup reliably creates the later gains, and the same mechanism appearing in the 12-move strategy or fresh cases.

### 4. Persistent state or memory — unresolved and unnecessary for the shared finding

Observation: every recorded move is legal and reconstructible from the current board alone. The 14-move trajectory looks planned across moves, but the recordings do not reveal the owner's internal intent.

Inference: no hidden memory variable is required to reproduce the actions, while a longer-horizon value may still be useful. The evidence cannot distinguish those two explanations.

What would flip this finding: two identical visible states with different correct actions because of a recorded plan variable, or an explicit policy state that predicts the later cash-out better than board-only lookahead.

## Contradictions preserved

- The existing replay test labels these files orphans because the live candidate store is missing. That is true of the live resolver. The immutable Git object still reconstructs the exact candidate and allows an exact replay; that is also true. No live receipt or candidate file was restored or changed.
- The 14-move strategy contains several moves the champion's current formula dislikes. That does not contradict the shared generator finding; it shows generation is necessary but may not be sufficient.
- Longer is not automatically better. One 12-move action is as long as the champion's and scores slightly lower by the champion total; several 14-move setup actions are deliberately shorter. The supported principle is target-aware route diversity, not a blanket length bonus.

## Required next step

The code stage may build **one experimental challenger** whose observable contract is: it exposes a bounded set of additional, globally distinct completed routes and applies one target-aware cash-out rule using only score still needed, moves remaining, and observable afterstate health. The implementation must remain separate from `solver/bot.js` and must not memorize Level 51, seed 1, coordinates, or recorded moves. It may not re-test unconditional `offerFull`, and simple beam-width expansion is insufficient unless it introduces a new, testable diversity invariant rather than retaining more of the same ranking.

Level 51 remains training evidence. Only the composition's untouched screen and sealed holdout may determine whether the challenger generalizes. A failed or inconclusive holdout leaves the champion unchanged.

## Gaps

- Two strategies on one board cannot establish frequency across levels or players.
- The evidence identifies the action-space bottleneck but does not select the best search representation.
- Full continuation counterfactuals for the 14-move setup were not run; horizon and persistent plan remain unresolved.
- No human-strength percentage follows from this packet.
