---
id: BL-0012
title: The bot's chain generator cannot build long climbing chains
status: proposed
milestone: policy-strategy
depends_on: [BL-0011]
updated: 2026-09-16
---

# BL-0012 — The bot generator misses long climbing chains

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

The first 12-session paired benchmark showed the bot ahead on crossing score on
7 of 12 boards, with a mean difference of +9.3%, and 12 bot wins against 11
human wins. Crossing score is final-move overshoot, not a speed measure.

The later claim that the human kept playing after reaching the target was also
wrong. Every accepted human win records `reason: target reached`, just like the
shipped bot. Removing the target gave only the bot extra moves. Its uncapped
score therefore has no recorded human comparator and cannot establish that the
bot is stronger.

The corrected 25-session benchmark has 23 mutual wins: the human is faster on
9, the bot on 9, and 5 are ties. In the 12 mutual wins from ordinary shipped-
level captures, the human is faster on 6, the bot on 3, and 3 are ties. Every
bot-faster ordinary capture is on Level 54. `CORRECTION-0009` records the exact
scope and retained results.

## What survives, and is worth acting on

One finding survives both corrections, because it is about capability rather
than score: on 3 of the pilot's 20 moves the human's chain out-scored
**everything the bot generated** — not merely what it chose. The generator is
a greedy, no-backtracking walk with a beam of 8 per start tile, and it cannot
construct a long climbing chain.

Demonstrated concretely at the pilot's final board. The human played a 15-tile
climbing chain for 37,760 points. The shipped bot played 8 tiles for 1,536.
Turning off the lattice trimming (`offerFull: 1`) only got it to 3,520, so
trimming is not the constraint — generation is. The engine's exhaustive
`findTopChains`, currently reserved for bomb defusal, finds the human's exact
37,760 chain **in 2ms**, because an endgame board is full of dead tiles and
barely branches.

**Tested and rejected as an upgrade:** swapping the greedy generator for the
exhaustive search on the final move only. Measured over 440 games across 11
levels: mean gain 12 points per game, zero losses converted to wins. The
trigger almost never fires, because the bot wins long before its last move.
Search cost was never the problem (median 0.3ms, max 1.6ms). Recorded so the
idea is not re-attempted on the assumption it was never tried.

The open question is therefore narrower: is there any position where the
generator's blind spot costs a *win* rather than points it did not need?

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
