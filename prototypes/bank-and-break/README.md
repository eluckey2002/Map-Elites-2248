# Bank and Break prototype

**Throwaway prototype. These are not shipped levels and their sessions are not
evidence-ledger records.**

## Question

Does a fixed bottom gate between two cramped rooms create a perceptible **build
separately → thaw → connect and harvest** arc?

The current board is 5×5 with a four-stone center wall and one ice tile at its
bottom. Each side is only two columns wide. The ice thaws after four moves and,
because it begins on the bottom row, cannot fall out of the wall first.

The original probe used seed 316. The controlled validation round keeps the
same 40,000 target, 16 moves, minimum chain 3, scale 32, geometry, and rules,
and changes only the seed.

## Run

    node prototypes/bank-and-break/serve.js

The command prints three fixed-seed URLs and saves completed prototype plays
under a role-and-seed directory in
prototypes/bank-and-break/sessions/bank-break-fixed-bottom-gate/validation-2026-09-12/.

## Controlled validation round

The three playable seeds were selected from the declared finite population
0–511 by:

    node prototypes/bank-and-break/select-seeds.js --seeds=512

Recheck the frozen selection after any bot, engine, or ranking change with:

    BANK_BREAK_FULL_SCREEN=1 node --test solver/tests/bankAndBreakValidation.test.js

| Role | Seed | Current bot | Bounded largest-chain |
|---|---:|---:|---:|
| Setup-favorable | 268 | target in 7, 52,736 | misses target, 33,056 after 16 |
| Neutral | 511 | target in 10, 41,856 | target in 10, 40,512 |
| Hypothesis-hostile | 93 | misses target, 35,840 after 16 | target in 15, 40,928 |

“Bounded largest-chain” is the longest chain returned by the frozen width-8
greedy path generator on each move. It is reproducible, not a mathematical
maximum.

The roles are selection conditions, not claims about what a player will feel.
Seed 268 gives the current bot its largest target-race advantage
over the baseline. Seed 511 gives both policies the same median-adjacent pace.
Seed 93 is the fastest bounded-largest-chain win in this population among
seeds where the current bot misses the target.

Play each once. Preserve this family only if banking and later reuse remain
deliberate and useful outside seed 316. Reject or redesign it if largest-chain
play feels sufficient, or if the perceived strategy is mostly a favorable
spawn sequence.

## Exact fixed-seed bot reference

These are exact results for the one identified board and seed, used only to
make the prototypes playable—not population difficulty claims:

| Board | Reaches 40,000 | Full 16-move score |
|---|---:|---:|
| Fixed bottom gate | move 10 | 51,968 |

The bot stays within one room for moves 1–4. Its first cross-wall chain is move
5, immediately after the gate opens, and scores 13,120.

## Rejected first pass

The first pass used a 7×6 board split by a vertical wall with ice embedded
higher in the wall. Owner play found that the ice quickly became an ordinary
64 tile and that the two sides were large enough to feel nearly normal.

Inspection found the rule-level reason: ice belongs to a tile and moves under
gravity. An ice tile above empty space can fall out of the wall before its timer
expires, so that layout did not actually preserve a timed gate. The current
bottom-row placement is the smallest layout-only correction that can test the
original idea honestly.

## What to notice while playing

- Do the first four moves feel meaningfully cramped?
- Does opening the gate change the move you want to make?
- Does the connection feel like a release, or still like ordinary play?

The answer—not this prototype shell—is what may later be promoted into real
level-authoring work.

## Outcome

**Distinct-play probe: successful.** In the owner's exact seed-316 play, the
board felt "definitely not ordinary play." Earlier reactions described it as
"interesting" and highlighted the two large values banked on opposite sides.

The human and bot both reached the 40,000 target in 10 moves. The human scored
46,016 to the bot's 40,768. Their trajectories differed sharply: the human
scored 10,496 in moves 1–7 and 35,520 in moves 8–10, while the bot scored 32,128
and 8,640 over the same intervals. The human therefore earned 77% of the final
score in the last three moves; this is consistent with a bank-then-harvest
experience on this play.

This establishes that one player on one fixed board and seed experienced a
meaningful change in play. It does not establish population difficulty,
replayability across seeds, or a general human advantage over the bot. Stop
this prototype here rather than tuning further on the same observation.
