# Level-authoring loop

## Principle

A scalable level pipeline does not ask a designer to hand-place every tile and
guess every number. It asks the designer to make the judgments that require
taste, then gives deterministic and automated work to tools.

## Author one level

### 1. Write the intent

Use one sentence:

> This level should teach or test ___ by making the player choose between ___
> and ___.

If the two sides of the choice cannot be named, the level may not yet have a
design purpose.

### 2. Select an archetype

Choose a family from [archetypes and
objectives](../levels/archetypes-and-objectives.md). Reuse its teaching and
failure model rather than starting from nothing.

### 3. Choose structural parameters

Specify the board shape, starting state, objective, obstacle topology, and
refill model. Treat score targets and move budgets as values to calibrate, not
numbers to guess.

### 4. Generate nearby candidates

Create a small neighborhood around the proposed shape:

- Move one blocker.
- Add or remove one column.
- Change the move budget by one or two.
- Adjust demand modestly.
- Change one starting bridge tile.
- Try several controlled refill seeds.

### 5. Apply automatic rejection checks

Reject candidates with an invalid start, no plausible completion, excessive
seed sensitivity, a dominant trivial move on nearly every turn, or regression
against required game-wide checks.

### 6. Human-play the survivors

The designer evaluates whether the intended choice is visible, whether loss is
understandable, and whether success feels earned. Record the reason for
accepting or rejecting each survivor.

### 7. External playtest

Observe players without explaining the intended strategy. Compare what they
actually notice and do with the authored intent.

### 8. Release and monitor

Use live behavior to identify misunderstood rules, unstable seeds, unintended
shortcuts, and frustration. Retune narrowly and retain the before-and-after
record.

## A compact level brief

```yaml
intent: Preserve a bridge tile to construct one long chain.
archetype: combo-challenge
board_shape: 4x6
objective: create one chain of at least 8 tiles
move_budget: calibrated
starting_state: controlled
refill_model: weighted-bag
signature_choice: spend the bridge now or preserve it
expected_failure: bridge consumed before the two regions connect
automatic_checks:
  - legal start exists
  - completion witness exists
  - seed variance within accepted bound
human_checks:
  - signature choice is visible
  - loss is explainable
  - no obvious repetitive solution
```

## Batch production

Once one member of a family works, generate variations around its proven
structure. Do not release all variants merely because they pass. Use tools to
reduce thousands of candidates to a small, behaviorally diverse review set.

The designer's role becomes curation and intentional sequencing, not filling
cells one by one.

## Project-specific implementation

This repository already has a concrete authoring pipeline and historical
design. Consult the root [current-work page](../../../CURRENT.md) and the
[level-authoring loop design](../../superpowers/specs/2026-08-08-level-authoring-loop-design.md)
before changing it. Those sources supersede this general workflow when they
describe current project behavior or evidence standing.
