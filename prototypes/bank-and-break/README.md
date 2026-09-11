# Bank and Break prototype

**Throwaway prototype. These are not shipped levels and their sessions are not
evidence-ledger records.**

## Question

Does a fixed bottom gate between two cramped rooms create a perceptible **build
separately → thaw → connect and harvest** arc?

The current board is 5×5 with a four-stone center wall and one ice tile at its
bottom. Each side is only two columns wide. The ice thaws after four moves and,
because it begins on the bottom row, cannot fall out of the wall first.

It uses seed 316, a 40,000 target, 16 moves, minimum chain 3, and scale 32.

## Run

    node prototypes/bank-and-break/serve.js

The command prints one fixed-seed URL and saves completed prototype plays
under prototypes/bank-and-break/sessions/.

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
