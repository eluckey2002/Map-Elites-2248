# Contract Attack 02

## Cold read-list

- `INTENT_BRIEF.md`
- revised `CONTRACT.md`

The second critic read no source, chat history, or first-attack material and edited nothing. This was the final attack round permitted by the Tier-1 flow.

## Findings and disposition

1. **A different algorithm could masquerade as `calib-1`.** Accepted. C1 now requires move-for-move and outcome equivalence with the frozen-base evaluator on all 450 gen-0014 games plus eight named decision fixtures.
2. **Unhashed transitive dependencies could move the evaluator.** Accepted. C3 closes local imports to `solver/engine.js` only and fails on any other local dependency.
3. **Ambient or mutable state could make the evaluator non-deterministic.** Accepted. C2 adds fresh-process/environment variation; C3 bans ambient inputs and mutable module state and requires frozen exports.
4. **A loose 60-win gate could reward an evaluator rewrite.** Accepted. C4 now freezes the pre-contract measurement: target 102000 and 196/300 holdout wins, with exact terminal totals.
5. **Authoring mathematics could change while author and checker agreed.** Accepted. C4 now fixes quantiles, rounding, tile scaling, canonical identity, and serialization rules explicitly.
6. **A builder could self-verify in another goal file.** Accepted. C6 enumerates every permitted goal file and role owner; C9 checks for unauthorized claims.

## Result

All six findings were accepted and tightened. Two attack rounds are complete; no further attack round is authorized before owner arbitration.
