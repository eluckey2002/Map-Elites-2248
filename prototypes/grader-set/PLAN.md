# Grader set v1: scoring plan (committed before the owner plays)

Status: plan only. Nothing here is evidence or a ledger claim. If the grader-tuning loop later produces a
claim that generalizes, it gets its own `experiments/<RESULT-ID>/protocol.md` first (AGENTS.md, Experiments).

Owner's loop idea (2026-10-25): "Tune a 2248 difficulty grader to match how evan plays" (owner's loop ideas folder,
`Loop-Ideas/ideas/2026-10-25-tune-a-2248-difficulty-grader-to-match-how-evan-pl.md`). The owner agreed on 2026-10-25 that
"hard for evan" is measured by undos, giving up, and moves used against the limit, and agreed to one play session of
about 20 boards that runs from easy to hard.

## The boards

`make-set.js` makes 18 boards: 3 for each of the 6 v5 keepers (Feed the Next, Make It Here, Shared Material, See It
Coming, Through the Gate, The Drought). Each one is a v5 board with its start tiles shuffled under a new refill seed. The
rules, goals, walls, spots, ★ and gate stay the same. The owner proposed "4 of each of 5 kinds"; there are 6 keepers, so
the set is 3 of each. The three per kind are the easiest, middle and hardest candidates by the pre-grade (below). They
are played in one fixed, mixed order. Move limits follow the v5 rule (calibrate.js) and stay loose.

The pre-grade is the first grader under test: the win rate of the ordinary player (`search.ordinary`, one move of
look-ahead) when each move is random with probability 0.2, over 20 games, then the beam's move count. It only spreads
the picks. It is recorded per board (`pregrade` in `levels.js`) before play.

## What is saved per board (the page)

Each run already saves moves used, the limit, undos, every move and the outcome. New in this set: a **Give up** button.
A run ended with it saves `reason: "gave-up"`. A run left open saves `left-board` or `closed`, as before.

## How "hard for evan" is scored (fixed now)

Per board, from the owner's first run only (a later retry has seen the board):

| Result | Struggle score |
|---|---|
| Gave up, or out of moves, or no legal chain left | 3 |
| Won with 3 or more undos | 2 |
| Won with 1 or 2 undos, or won using more than 75% of the limit | 1 |
| Won with no undos and at most 75% of the limit | 0 |

A run left open without giving up or finishing (`left-board`, `closed`, `active`) is **not scored** and is reported
separately. If more than 6 of the 18 boards end unscored, the session is too thin to tune on, and that is reported
instead of a score.

Ties inside a level are broken by moves used / limit (higher is harder).

## How a grader is scored against the owner

For every pair of scored boards whose struggle scores differ, the grader agrees if it calls the board with the
higher struggle score harder. **Agreement = agreeing pairs / pairs compared.** 50% is chance. The pre-grade's agreement
is computed first, as the baseline.

Tuning (later, separate step, owner's OK first): boards are split before tuning into 12 for tuning and 6 held out
(one per kind, the middle board, fixed now). A change to the grader is kept only if it improves agreement on the
tuning boards; the final grader is scored once on the 6 held-out boards. With this few boards the result is a direction,
not a proof.
