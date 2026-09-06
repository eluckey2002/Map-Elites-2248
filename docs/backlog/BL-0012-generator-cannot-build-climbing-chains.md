---
id: BL-0012
title: Historical claim — The bot's chain generator cannot build long climbing chains
status: proposed
milestone: policy-strategy
depends_on: [BL-0011]
updated: 2026-09-05
---

# BL-0012 — Historical claim — The two boards where the human substantially outscores the bot

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## Current disposition — corrected measurement

All 14 fixed-inventory wins stop at first crossing. The historical full-budget
comparison gave the bot extra moves in 11 of 12 receipt rows. Attempts are now
weighted within nine cases; ordinary rows are current-subject replays with
unknown historical runtime identity. See
[CORRECTION-0005](../../EVIDENCE_LEDGER.md#correction-0005--recorded-stopping-horizons-repeats-and-provenance)
and the [baseline](../evaluation/POLICY-EVAL-0001/baseline.md).

Before HUMAN-PILOT-0002 move 20, both greedy pools omit an immediate winning
chain found by the recording and exhaustive search. This is a generation miss
on a human position, not the final allowed move or the bot's own trajectory.
The scorer already values future opportunities. See
[CORRECTION-0006](../../EVIDENCE_LEDGER.md#correction-0006--current-policy-capabilities-and-the-pilot-generation-miss).
Step 3's bot-trajectory audit remains blocked on Step 2.

## Historical account — what was found, including a correction

The following account is retained history. Its broad stopping, horizon, and
capability interpretations are superseded above.

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

Two boards appeared to run the other way (`3823dfce` level 53 seed 424242,
human +20.9%; `f0ae3e75` level 52 seed 1, human +16.5%) — and that appearance
was **also an artifact**, of a second and more basic kind. The shipped policy
is target-aware immediate-finish: it stops the move it crosses the target. The
human kept playing for score. Comparing the two measures the objective, not
the skill.

Removing the target so the bot spends its full move budget, measured with the
live bot on the same 12 seeds: **the bot outscores the human on 12 of 12
boards, mean +65.7%**, ranging from +6% to +280%. The bot is not weaker at
this game. It is playing a different game, and it wins the human's game too.

## Historical proposal — what was thought to survive

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

## Historical acceptance criteria

- For each of the two boards, the specific moves where the human's chain
  out-scored the bot's entire candidate pool are identified and explained.
- A judgement is recorded on whether the cause is generation (the chain was
  never offered) or ranking (it was offered and scored below something else).
  The HUMAN-PILOT-0002 walk suggests generation, on 3 of 20 moves.

## Historical evidence list

- `node solver/human-benchmark.js` — the paired table
- `pilots/HUMAN-PILOT-0002/` — the recorded session walked move by move
- `solver/bot.js` — `collectCandidates`/`preferMergeableSum` trimming, the
  mechanism that removes off-lattice chains before the lookahead sees them
- Session measurement: human 41.1% of chains off-lattice vs the bot's 23.9%

## Historical next action — not authorized

None authorized yet. The two boards are named and reproducible; the next step
is a move-by-move walk of those two specifically, the same way
HUMAN-PILOT-0002 was walked.

## History

- 2026-09-05 — captured at the owner's request, replacing an earlier and
  incorrect "the human is 33% better" framing with the paired measurement.
