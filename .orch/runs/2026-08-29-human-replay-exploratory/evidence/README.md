# Human replay table (exploratory, recovered)

`human-replay-01.json` is the per-move table produced by `solver/human-replay.js`
on 2026-08-28: 135 replayed moves across 9 human recordings, each position
carrying the human's chain, the bot's chain, and the exact best available chain
(enumerated with `enumerateLegalChains`, the enumerator behind `RESULT-0003`).

## Provenance

- Source: remote branch `codex/2026-08-29T10-29-19Z-adhoc-session-workspace`,
  commit `c3b8406`, preserved as tag `archive/codex/2026-08-29T10-29-19Z-adhoc-session-workspace`.
- Recovered 2026-09-02 because main had no move-by-move comparison of human
  play against the exact best move; `solver/human-vs-bot.js` compares whole-game
  move counts only.
- The bot column was produced by the champion of 2026-08-28, before the
  target-aware promotion (`DECISION-0004`). The human and exact-best columns do
  not depend on the bot.

## Standing

Exploratory. No protocol was registered before the analysis, every grouping
threshold was chosen after seeing the data, and the source branch's own ledger
entry said so. **Nothing here is admitted to `EVIDENCE_LEDGER.md`.** A claim
built on this table needs its own registered protocol under `experiments/`.

## Re-derive

```
node solver/human-replay.js --from .orch/runs/2026-08-29-human-replay-exploratory/evidence/human-replay-01.json
node --max-old-space-size=8192 solver/human-replay.js --out <path>   # rebuild from recordings, ~30 min
```
