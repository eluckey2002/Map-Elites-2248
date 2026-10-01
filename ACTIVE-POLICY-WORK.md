# Active policy work

This is the short, human-facing resume page for policy work. It is navigation,
not evidence. Follow its links before making a policy claim or a promotion
decision.

**Last updated:** 2026-10-01

## Current state

| Role | What it is | Standing |
| --- | --- | --- |
| Champion | Target-aware immediate-finish policy in `solver/bot.js` | Current engineering champion; do not modify automatically. [DECISION-0004](EVIDENCE_LEDGER.md#decision-0004--promote-the-target-aware-policy-as-the-current-engineering-champion) and [RESULT-0049](EVIDENCE_LEDGER.md#result-0049--fresh-paired-confirmation-supports-the-current-target-aware-champion) state its evidence. |
| Active diagnostic | Mergeable bomb-defusal challenger in `solver/bomb-lattice-challenger.js` | Not promotable. [RESULT-0078](experiments/RESULT-0078/report.md) retained a raw gain but its safety rule was falsified and its closure is `INVALID`. |
| Parked prototype | Ladder Challenger and policy replay lab | Preserve the current uncommitted files; do not treat them as the active direction or alter the champion from them. |

## The active question

The bomb-defusal challenger replaces the champion's bomb move with a mergeable
power-of-two route when one reaches the same earliest bomb. In its frozen
1,160-pair run it was faster in 109 mutual wins and slower in 60, for a mean
target-cost gain of 0.143 moves. The zero-slowdown safety rule therefore
failed.

The next bounded work is **not** a new policy rule:

> Reconstruct one faster and one slower replay at the first bomb override,
> identify the changed survivor, cleared cells, refill, and later target chain,
> then state whether one concrete board property separates the two outcomes.

Known starting pair:

| Same level | Faster challenger | Slower challenger |
| --- | --- | --- |
| Level 40 | seed `47000000`: champion 23 moves, challenger 17 | seed `47000002`: champion 20 moves, challenger 21 |

In both replays the explicit challenger change is its first bomb move. It
chooses a smaller mergeable chain than the champion's non-power-of-two chain;
the later board diverges from that one decision. This is replay evidence, not
yet an explanation or a policy authorization.

## Boundaries

- Do not modify the champion, levels, targets, receipts, recordings, or the
  level-authoring system.
- Do not revive the Ladder Challenger as the active experiment without a new
  owner decision.
- Do not repair `RESULT-0078` by editing its frozen protocol. It remains an
  invalid closeout with useful raw diagnostic data, recorded in
  `FAILED-RUN-LEDGER.CSV` as `FR-0009`.

## Working copy

- Worktree: `/Users/eluckey/Documents/Codex/2026-08-30/yes-it-is-created-verified-and/work/game51-learning-cycle-2026-09-27`
- Branch: `codex/lc0013-target-gap-arithmetic`
- Base commit: `e5d9a34` (`Add power-of-two policy replay lab`)
- The Ladder files currently have uncommitted changes. They are parked, not
  discarded.

## Resume checks

```bash
node --test experiments/RESULT-0078/subject.test.js
node tools/verify-experiments.js
```

The first command should pass. The second currently fails only because the
frozen `RESULT-0078` protocol contains blank sample-size template fields; that
failure is expected and must not be hidden by editing the historical protocol.

## Evidence links

- [RESULT-0078 report](experiments/RESULT-0078/report.md)
- [RESULT-0078 frozen corpus](experiments/RESULT-0078/corpus.json)
- [RESULT-0078 failed-run row](FAILED-RUN-LEDGER.CSV)
- [Current evidence index](LEDGER-INDEX.md)
- [Route-diversity learning card](docs/learning-cycles/LC-0001-level-54-route-diversity.md)
