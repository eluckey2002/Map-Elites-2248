# Level archetypes and objectives

## Why archetypes matter

Do not invent every level from a blank board. Build a library of level
families that each create a recognizable kind of decision. A designer can
then vary geometry, target, move budget, starting state, and obstacles while
preserving the purpose of the level.

## Core archetypes

| Archetype | Player task | Main tuning knobs |
| --- | --- | --- |
| Score sprint | Accumulate value efficiently | Score target, moves, scoring multiplier |
| Build-a-tile | Produce one named tile | Target value, starting values, refill mix |
| Combo challenge | Create one unusually long or valuable chain | Required length, board area, setup pieces |
| Tight board | Preserve maneuvering room | Shape, blockers, available values |
| Cleanup | Remove marked cells or objects | Object count, placement, clearing rule |
| Drop objective | Open vertical paths for an item | Board height, refill direction, lane blockers |
| Authored puzzle | Discover a planned sequence | Fixed layout, fixed or bounded refill sequence |
| Survival | Avoid lockout or another terminal condition | Spawn pressure, board area, recovery tools |

An archetype is not a visual theme. It states the behavior the level asks the
player to practice.

## Objective vocabulary

Score-only levels are a clean foundation, but a full campaign benefits from
goals that alter move selection:

- Reach a score within a move limit.
- Create a specific tile value.
- Create several tiles of one value.
- Use a minimum chain length one or more times.
- Clear marked, locked, frozen, or covered cells.
- Merge beside an object to damage or activate it.
- Move an item to a destination through gravity.
- Finish with a reserve of moves or board space.
- Complete two compatible goals on the same board.

Avoid combining objectives merely to make a level look complex. Each
additional objective should produce a new tradeoff or reinforce the lesson.

## Designing a level family

For each archetype, record:

1. **Teaching purpose:** what should the player learn or demonstrate?
2. **Signature decision:** what choice makes this family distinctive?
3. **Success evidence:** what visible behavior shows mastery?
4. **Failure explanation:** can the player understand why they lost?
5. **Variation knobs:** which parameters change difficulty without changing
   the family into something else?
6. **Invalid combinations:** which mechanics destroy or trivialize the
   intended decision?

## Example family: combo challenge

- Teaching purpose: preserving small tiles can outperform immediate scoring.
- Signature decision: take a medium chain now or keep a bridge for a larger
  chain later.
- Success evidence: the player creates a chain above the required length.
- Failure explanation: the final board shows that bridge values were spent
  too early.
- Variation knobs: required length, board width, starting bridges, move limit.
- Invalid combination: highly unpredictable refills that determine whether
  the required bridge appears at all.

## Campaign use

Reuse an archetype in a learning sequence:

1. Introduce it with generous space and moves.
2. Repeat it with one complication.
3. Test it under pressure.
4. Rest or reward the player with an easier application.
5. Combine it with one previously mastered idea.

This produces a campaign grammar. Individual levels remain distinct, but the
player can recognize what kind of thinking the game is asking for.

