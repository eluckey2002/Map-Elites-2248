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

Offer a separate challenge mode in which a player knows the exact score to
beat before making the first move. The challenge is bound to one shipped
level, one seed, and one identified bot policy.

The benchmark bot should play for score through its full move budget, rather
than use the shipped target-aware policy's early stop. Otherwise the displayed
"bot score" mostly restates the existing target instead of representing the
bot's performance. The opening board and random source are shared by seed;
after different chain choices consume different numbers of refills, the games
need not continue through identical boards.

Recommended first shape: preserve the current ladder and add this as a
challenge mode. Show a fixed instruction such as **Beat 171,392** before the
board accepts input, keep that number visible, and require the player to score
strictly more. A tie should be reported as a tie rather than silently counted
as a win.

## Acceptance criteria

- The level and seed are selected before play, and the score-maximizing bot
  finishes deterministically before the player's first move is accepted.
- The UI shows the exact score to beat before play and keeps it visible for the
  whole session.
- Reopening the same level, seed, and bot identity produces the same displayed
  benchmark.
- The completed session records the benchmark score, seed, level, bot identity,
  and whether the player won, tied, or lost the comparison.
- The ordinary shipped ladder and its current targets remain unchanged unless
  the owner separately chooses replacement rather than an additional mode.
- A browser check demonstrates one player score below the benchmark, one equal
  to it, and one above it, with the three outcomes labelled correctly.

## Current evidence

- `solver/human-benchmark.js` already distinguishes the shipped target-aware
  bot from an uncapped full-budget scoring arm and can compute both on a named
  level and seed.
- `tools/play-server.js` already creates seeded ordinary play sessions and
  stores their level, seed, outcome, score, moves, and chains.
- `src/game.js` already accepts `?level=N` before loading a board, but it does
  not currently obtain or display a bot benchmark before play.

## Next action

Confirm two product choices before implementation: this is an additional
challenge mode rather than a replacement for the ladder, and "the bot" means
the full-budget score-maximizing arm rather than the shipped early-stop arm.
Then prototype the start-of-game contract and benchmark display without
changing level rules or targets.

## History

- 2026-09-10 — Captured as proposed from the owner's idea that the goal should
  be to beat a bot score known before play. No rule or scoring change adopted.
