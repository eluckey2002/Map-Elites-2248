# Prototype design learnings

This document turns the throwaway board sessions into design guidance. Its
standing is **exploratory prototype observation, not evidence-ledger proof**.
Each numeric result is bound to one recorded player, board, seed, and current
rules. Positive results need broader validation before becoming a level-family
claim.

Regenerate the quantitative report with:

```sh
node prototypes/analyze-sessions.js
```

Use `--json` for the move-by-move data. The analyzer verifies each recording's
candidate identity, replays every recorded chain against the seeded engine,
compares the bot's choice from the same human position, tracks later reuse of
built survivor tiles, and records how bombs were cleared. It exits nonzero if
any recording cannot be resolved or replayed.

## Current session matrix

| Family | Play | Human | Bot, same board and seed | Mean chain | Mean board coverage | At least bounded long-chain | Last 3 score | Built-tile reuses | Bomb endpoint / swept |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Bank and Break | `fd2781d0` | 46,016 / 10 | 40,768 / 10 | 7.4 | 36% | 3/10 | 77% | 7 | 0 / 0 |
| Funnel Sprint | `7b967a64` | 24,704 / 7 | 41,216 / 8 | 6.0 | 32% | 1/7 | 80% | 5 | 0 / 0 |
| No-Blocker Nemesis | `486e3cb4` | 93,504 / 9 | 95,488 / 10 | 13.0 | 43% | 3/9 | 69% | 6 | 0 / 0 |
| Defusal Relay, max-chain play | `60f08f53` | 57,920 / 6 | 54,976 / 8 | 21.5 | 66% | 5/6 | 50% | 0 | 1 / 1 |
| Defusal Relay, first play | `1d8ce49d` | 64,448 / 7 | 54,976 / 8 | 14.0 | 43% | 1/7 | 60% | 6 | 0 / 2 |

“Bounded long-chain” is the longest chain found by the existing width-8 greedy
path generator. It is a reproducible baseline, not a proven mathematical
maximum; a human chain can exceed it.

Builder Pocket has no completed session. Its rejection is qualitative and
structural: the owner stopped because the pocket made usable cells feel
wasted rather than protected.

## What the combined plays teach

### Persistent state matters more than an authored opening

No-Blocker Nemesis produced a competitive nine-move game, but its identity
vanished after one or two refills. A fixed seed can author an opening; it does
not by itself author a sustained experience. Future designs must name the
feature that will still affect choices after several refill cycles.

### Restricted space needs a legible return

Bank and Break's cramped rooms led to seven later uses of built tiles and 77%
of its score in the final three moves. Builder Pocket used obstruction without
creating a comparable return, so its cells felt wasted. Do not add blockers
merely to create shape. Name what advantage the lost space buys and where the
player can collect it.

### A visible objective is not necessarily a strategic objective

On the six-move Defusal Relay replay, the owner took 21–24 tiles every move,
matched or exceeded the bounded long-chain baseline on five of six moves, and
still cleared both bombs. One bomb was an endpoint and one was swept through.
The board displayed urgency, but ordinary score-maximizing play resolved it.
Future secondary objectives must conflict with the dominant scoring action at
least once.

### Late scoring is a clue, not proof of setup

Bank and Break, Funnel Sprint, and No-Blocker Nemesis all put 69–80% of their
score in the last three moves, yet only Bank and Break was judged clearly
distinct, Funnel Sprint felt partly lucky, and No-Blocker Nemesis felt
ordinary. A back-loaded score alone cannot establish strategy. It must be read
with spatial replay, built-tile reuse, and the player's account of control.

### Human and bot divergence is diagnostic, not automatically good

The human selected exactly the same tile set as the bot's same-position choice
only once across the five completed sessions, and never during
Bank and Break or No-Blocker Nemesis. This makes divergence worth inspecting
in Bot Vision, but divergence alone does not imply a meaningful human strategy:
the no-blocker board still failed its experience test.

## Decisions for future designs

- Preserve **Bank and Break** as the one promising distinct-play family. The
  next question is whether its build-and-release arc survives other seeds, not
  whether seed 316 can be tuned higher.
- Preserve **Funnel Sprint** only as a hypothesis about lane coordination. It
  needs a test that separates player control from favorable refills.
- Retire **Builder Pocket**, **No-Blocker Nemesis**, and **Sequential Defusal
  Relay** in their current forms. Their failures are structural, so another
  target or seed is not the next move.
- Do not advance **Tiny Marathon** until it names a decision that repeated
  longest-chain play should fail. A smaller board and longer budget alone may
  strengthen the dominant strategy instead of challenging it.

## Gate for the next prototype

Before building another board, write down four things:

1. The intended player decision.
2. The simple baseline strategy expected to fail.
3. The mechanism that keeps the decision alive after refills.
4. The observation that would reject the idea after one play.

For the proposed bomb-rule probe, the controlled question is: **if a bomb can
only be cleared as the chain endpoint, does the player deliberately reject a
larger available chain to survive?** Use the same relay board and seed so the
rule is the only changed variable. Success requires an observed tradeoff and a
player report that it felt meaningful rather than merely restrictive.
