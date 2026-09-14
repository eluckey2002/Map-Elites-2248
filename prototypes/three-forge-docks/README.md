# Three Forge Docks

This is the durable rejection record for a throwaway prototype. It is design
evidence, not evidence about shipped-level difficulty or policy strength.

## Question

Could a fixed opening with no dealt 512 tiles make the location of the first
forged 512 into a meaningful choice?

Candidate 5911 used seed 83, a 5x6 board, a 55,000-point target, and three
bottom landing docks. Its exact reference trajectories were:

| Policy | Result |
|---|---:|
| Scripted right-dock forge first | 67,072 in 7 moves |
| Bounded longest chain | 55,680 in 8 moves |
| Current bot | 55,680 in 9 moves |

These are same-board, same-seed target-race results. They do not show that the
scripted policy represented the owner's normal play.

## Captured play

The owner reached 62,976 in eight moves. The replay contains forged 512
survivors on moves 2 and 5. The move-5 survivor was one of six built tiles
reused in the 16-tile, 35,200-point finishing chain.

The owner did not perceive a new placement decision and asked whether a 512
was supposed to spawn. No 512 was dealt: the recorded 512 tiles were forged by
the owner's chains.

## Decision

**RETIRE.** The screen used bounded longest-chain play as its baseline even
though earlier captured play had already established forging 512 and 1,024
survivors and harvesting them later as the owner's normal strategy. The
prototype therefore rewarded familiar play instead of making that play
suboptimal.

Do not tune another seed, revise the labels, or alter the dock layout. Fixed
openings, deterministic refills, seed screening, and forged-tile tracking are
useful authoring capabilities, but are not themselves a level idea.

Before another gameplay prototype, name the exact board state where the
owner's captured baseline move should become the wrong move.

## Source

- [Captured session](sessions/c393d0f955a79c60791001c987fb0e11e9acbbd8a58a191ae2802a30a1459adc.json)
- [Playtest Decision Ledger entry PDL-010](../PLAYTEST-DECISION-LEDGER.md#pdl-010--three-forge-docks)
