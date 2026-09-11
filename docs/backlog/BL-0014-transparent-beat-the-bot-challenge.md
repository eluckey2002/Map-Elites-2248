---
id: BL-0014
title: Add a transparent beat-the-bot challenge mode
status: proposed
milestone: play-modes
depends_on: []
updated: 2026-09-10
---

# BL-0014 — Know the bot's score before playing

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes the shipped
rules, scoring, or level targets.

## Desired outcome

Offer a separate challenge mode in which a player knows the bot's exact result
before making the first move. The challenge is bound to one shipped level, one
seed, and one identified bot policy.

The first contest should be a race to the shipped level target: show the moves
and crossing score produced by the current target-aware bot, then challenge the
player to reach the same target in fewer moves. Equal moves are a tie. This is
not a claim that the bot found the fastest possible route. A later fixed-budget
score contest would be a different mode; the current "uncapped" benchmark is
the same heuristic allowed to continue, not a bot proven or specifically
optimised for maximum score.

The opening board and random source are shared by seed. Different chain lengths
consume different numbers of refills, so the games need not continue through
identical boards after play diverges.

Recommended first shape: preserve the current ladder and add a named
**Nemesis** playlist containing deliberately difficult matchups. Select from a
declared seed population and label results precisely as the bot's **best
observed** or the owner's **worst recorded**; do not call either an absolute
best or worst without exhaustive coverage of a named finite population.

The first two candidate challenges are both Level 54:

- Seed `1044860360`, the owner's current worst recorded result: 123,712 after
  all 24 moves, while the bot reached the 126,000 target in 19.
- Seed `3310936729`, the bot's fastest result among the owner's first two
  Level 54 boards: bot 15 moves, owner 19 moves.

## Acceptance criteria

- The level and seed are selected before play, and the identified bot finishes
  deterministically before the player's first move is accepted.
- The UI shows the bot's target-crossing move count and score before play and
  keeps them visible for the whole session.
- Reopening the same level, seed, and bot identity produces the same displayed
  benchmark.
- The completed session records the benchmark score, seed, level, bot identity,
  bot move count, and whether the player won, tied, or lost the comparison.
- The ordinary shipped ladder and its current targets remain unchanged unless
  the owner separately chooses replacement rather than an additional mode.
- A browser check demonstrates a player reaching the target before, on, and
  after the bot's move count, with win, tie, and loss labelled correctly.
- Every curated challenge records the finite source population and selection
  rule behind any `best observed` or `worst recorded` label.

## Current evidence

- `solver/human-benchmark.js` already distinguishes the shipped target-aware
  bot from an uncapped full-budget scoring arm and can compute both on a named
  level and seed.
- `tools/play-server.js` already creates seeded ordinary play sessions and
  stores their level, seed, outcome, score, moves, and chains.
- `src/game.js` already accepts `?level=N` before loading a board, but it does
  not currently obtain or display a bot benchmark before play.

## Next action

Confirm that the first contest is a race to the existing target using the
shipped early-stop bot, then prototype the two Level 54 Nemesis challenges and
their pre-game benchmark display without changing level rules or targets.

## History

- 2026-09-10 — Captured as proposed from the owner's idea that the goal should
  be to beat a bot score known before play. No rule or scoring change adopted.
- 2026-09-10 — The owner selected deliberately adversarial seeds and boards:
  the bot's best observed and the owner's worst recorded. Clarified the first
  proposal into a race-to-target Nemesis playlist and corrected "full-budget
  bot" so it does not imply a separately optimised or optimal scoring policy.
