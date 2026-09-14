# Cash or Compound prototype

**Throwaway logic prototype. This is not shipped level content, and its output
is not evidence-ledger evidence.**

## Question

Can the existing rules produce a voluntary **cash now versus compound later**
decision without bombs, timers, or forced cleanup?

The screen uses open boards so any persistence must come from tiles the policy
builds, not from a blocker arrangement. It compares three policies on the same
shape and seed for the full move budget:

- **Compound:** the current bot with its built-tile harvest term.
- **No harvest:** the same bot with only that term disabled.
- **Cash now:** the highest-immediate-score bounded candidate each move.

A board is retained only when the harvest term changes an actual choice, the
compound line later reuses at least two built tiles including the tile created
by the sacrificed move itself, compound reaches a common target first, and
both alternatives still reach it within the move budget. Thus the other plan
is viable rather than fatal.

## Run

    node prototypes/cash-or-compound/screen.js

Use `--seeds=N` to change the finite seed population and `--json` for the full
machine-readable shortlist.

## One-play rejection condition

If a mechanically admitted candidate is eventually made playable, reject it
after one play if the smaller early move and the later reused tiles are not
legible as one controlled plan, or if the alleged cash-now alternative does
not feel like a real choice.

## Screened play candidate

The finite first screen examined seeds 0–7 on two open shapes. Seed 5 on the
5×5, 16-move shape passed every condition:

- The harvest-aware line takes 5,120 on move 5 where the same-position bot
  without that term takes 15,680.
- On move 7 it scores 25,280 using four previously built tiles: one 512 and
  three 1,024s.
- It reaches the 59,000 target in eight moves. The no-harvest line takes ten
  and the bounded cash-now line takes thirteen; both still reach it.
- Over the full budget it scores 130,432, versus 120,384 and 94,400.

These are exact outcomes for the screened policies on this one shape and seed,
not a population or human-experience claim.

Run the playable board with:

    node prototypes/cash-or-compound/serve.js

## Outcome

**Mechanically successful; rejected as a new level design.** The owner reached
59,648 in seven moves, one move faster than the current bot. The replay is an
especially clear example of build-and-harvest play:

- Moves 1–4 each created a 1,024 tile.
- Move 5 created a 512 tile with a four-tile, 768-point chain.
- Move 6 joined all five built tiles into an 18-tile, 29,440-point chain.
- The owner and bot selected different tile sets on all seven positions.

But those measurements answer the wrong design question. When asked whether
the setup was deliberate, the owner replied, "Oh come ojn - thats always my
plan." The prototype selected a board that rewards the owner's established
strategy; it did not give that player a new strategic decision. Do not preserve
this as a distinct board family or search more seeds for the same pattern.

The next prototype must create a meaningful choice *within* build-and-harvest:
for example, which values to build, where to retain them, or when to consume
them. Merely producing a later chain of built tiles is now a baseline, not an
admission condition.
