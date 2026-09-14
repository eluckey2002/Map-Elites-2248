# Forge Contracts prototype

**Throwaway mechanic prototype. It does not edit the shipped game, and its
results are not evidence-ledger evidence.**

## Question

Does choosing between two rewards create a meaningful decision *inside* the
owner's normal build-and-harvest strategy?

- **Spread Forge:** hold four 1,024 tiles simultaneously; earn 15,000 points.
- **Tower Forge:** create one tile worth exactly 4,096; earn 24,000 points.

The player selects one contract before the first move. Neither is required to
survive, and ordinary score still counts. The Tower contract asks the player
to stop an eventual harvest at an exact 4,096 survivor rather than automatically
take every surrounding tile in the familiar large-chain route.

On the fixed seed-5 reference, a contract-aware bot reaches the 69,000 target
in seven moves under either contract: 69,976 with Spread and 74,176 with Tower.
Spread pays 15,000; Tower pays 24,000 because making the exact 4,096 gives up
part of the larger immediate harvest. This is one-board calibration, not a
general claim that the two contracts are equally difficult for a human.

## Run

    node prototypes/forge-contracts/screen.js
    node prototypes/forge-contracts/serve.js

The first command checks the current reference bot on the exact fixed board
under both bonuses. The second starts the playable browser prototype.

## Boundaries

The browser layer wraps the running game through `window.game`; `src/game.js`
remains byte-for-byte unchanged. Standard recording is redirected because it
does not know about the prototype-only bonus state. Contract-aware state
snapshots are written after contract selection and every move to
`prototypes/forge-contracts/snapshots/`. They are intentionally outside
`sessions/`, whose contents the shared replay analyzer expects to verify
through the unmodified engine. They are also not ordinary `play-sessions/` or
candidate evidence in `recordings/`. Undo is disabled because it does not save
contract state.

## One-play rejection condition

Reject this mechanic if choosing a contract does not change what the player
tries to build, if one contract feels obviously correct, or if monitoring the
contract feels like an external chore rather than part of reading the board.
