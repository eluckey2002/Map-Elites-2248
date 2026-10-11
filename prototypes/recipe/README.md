# Recipe

A throwaway prototype of the owner's Recipe idea (2026-10-11): the level is won by
making an exact tile from one ingredient, "a 512 using only 128s". It does not edit
the shipped game. Results are playtest screening, not evidence-ledger evidence.

Play: private Artifact https://claude.ai/artifact/3mnpCQ1rmHYEZS93XaZSBS, built with
`node prototypes/recipe/build.js <out.html>`. Runs and answers save to the Artifact's
db (`runs`, `answers`).

## Rule

- An order such as `512 = 4 × 128` is filled by ONE chain made only of 128s, summing
  to exactly 512 (four 128s). A chain that mixes values (128+128+256) or uses too many
  (five 128s) does not count.
- No score. Fill every order within the move budget. Out of moves or no legal chain
  ends the attempt.
- Chains, sums, last-tap landing, gravity and fixed seeded refills are unchanged
  from the Delivery pack (`src/delivery-rules.js`): at least three tiles, first two
  equal, then equal or double. Refills draw from 8, 16, 32.

## Why this is not Forge Contracts or Three Forge Docks again

PDL-009 and PDL-010 forged exact values as a bonus inside a score race, and both
were retired because ordinary build-and-harvest earned the bonus anyway. Here the
recipe is the win and there is no score to chase.

Owner baseline: build-and-harvest, captured in PDL-008 (`7803db10`): build several
big tiles, then join every built tile in one long mixed chain. Under Recipe that
move is wrong in two ways a player can see:

- A long mixed chain never fills an order, and it destroys the ingredients it
  passes through.
- Building past the ingredient (128 + 128 → 256) spends two ingredients.

The exact state: board 2, "Leave the 256", opens with five 128s at (4,2),
(0,4), (3,4), (3,5) and (4,5), next to 256s at (3,2) and (2,4) (column, row,
zero-based). The legal chain 128+128+128+256 sums to 640 and uses three of the
128s the order needs. The largest-sum proxy (any chain length) plays mixed chains ending
in 128+256 on moves 1 and 2, then 128+128+128+256 on move 3, and runs out of moves. The
checked witness leaves the 256s alone: build two 128s (16×4, then 32×4), then join
four 128s.

This argument is a design claim. Only owner play decides whether the decision
feels different.

## Boards and screening

`search.js` has a beam solver and a largest-sum harvest proxy. The proxy is a
screen, not the owner's behaviour (AGENTS.md). `model.test.js` checks every board:
it does not open with a win, the solver wins within budget, the replay verifies,
and the proxy loses.

| # | Board | Order | Budget | Solver witness |
|---|---|---|---|---|
| 1 | Four of a Kind | 512 from 128s | 6 | 4 moves |
| 2 | Leave the 256 | 512 from 128s | 5 | 3 moves |
| 3 | Three Quarters | 384 from 128s | 6 | 4 moves |
| 4 | Two Orders | 512 from 128s, 256 from 64s | 7 | 5 moves |

Boards were picked from seeded random grids (seeds in `levels.js`), not hand
authored. The witnesses show that building each 128 is itself an exact-sum
problem, for example 8+8+16+32+32+32 or 16+16+16+16+32+32. The witnesses are
existence checks, not optimal or unique solutions.

## Open questions for play

- Does "only 128s" change which chain looks best, or does it feel like counting?
- Is board 4's shared ingredient (64s build 128s and fill order B) a real conflict?
- Recipe and Connections are both exact-sum goals. Do they feel like different kinds?
