---
id: BL-0012
title: Understand the two boards where the human substantially outscores the bot
status: proposed
milestone: policy-strategy
depends_on: [BL-0011]
updated: 2026-09-05
---

# BL-0012 — The two boards where the human substantially outscores the bot

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## What was found, including a correction

An earlier claim in this session — that the human outplays the bot by 33% —
was **wrong, and wrong for an instructive reason**. It compared one human
session (140,544 on the HUMAN-PILOT-0002 board) against the bot's *median over
150 unrelated seeds* (105,664). On the same seed the bot scores 136,832, a
2.6% gap, and it finishes a move earlier. Comparing one seed against a median
over other seeds measures the seed, not the player. That caution now lives in
`solver/human-benchmark.js`'s header so the next person does not repeat it.

The paired benchmark across all 12 recorded sessions shows the bot is broadly
competitive: bot ahead on score on 7 of 12 boards, mean difference +9.3% in the
bot's favour, and the bot won 12 of 12 where the human won 11 of 12.

Two boards run the other way, and by a lot:

| board | level | seed | human | bot | human margin |
|---|---|---|---|---|---|
| `3823dfce` | 53 | 424242 | 164,096 / 19mv | 129,792 / 15mv | **+20.9%** |
| `f0ae3e75` | 52 | 1 | 124,864 / 15mv | 104,256 / 16mv | **+16.5%** |

## Why this is the interesting question

The move-by-move walk of HUMAN-PILOT-0002 shows the two players are not doing
the same thing at all: on 20 moves they never once chose the same chain, and
on 3 of those moves the human's chain out-scored **everything the bot
generated** — not just what it picked. The human's late-game moves are large
off-lattice climbs (the final move alone scored 37,760, over a quarter of the
game's total) that the bot's candidate generator trims away by design.

So the open question is not "is the bot weak" — on average it is not — but
"what is available on those two boards that the bot's generator never offers
itself," and whether that is a board property worth detecting.

## Acceptance criteria

- For each of the two boards, the specific moves where the human's chain
  out-scored the bot's entire candidate pool are identified and explained.
- A judgement is recorded on whether the cause is generation (the chain was
  never offered) or ranking (it was offered and scored below something else).
  The HUMAN-PILOT-0002 walk suggests generation, on 3 of 20 moves.

## Current evidence

- `node solver/human-benchmark.js` — the paired table
- `pilots/HUMAN-PILOT-0002/` — the recorded session walked move by move
- `solver/bot.js` — `collectCandidates`/`preferMergeableSum` trimming, the
  mechanism that removes off-lattice chains before the lookahead sees them
- Session measurement: human 41.1% of chains off-lattice vs the bot's 23.9%

## Next action

None authorized yet. The two boards are named and reproducible; the next step
is a move-by-move walk of those two specifically, the same way
HUMAN-PILOT-0002 was walked.

## History

- 2026-09-05 — captured at the owner's request, replacing an earlier and
  incorrect "the human is 33% better" framing with the paired measurement.
