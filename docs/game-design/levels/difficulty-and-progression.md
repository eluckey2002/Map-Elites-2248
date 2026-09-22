# Difficulty and progression

## Difficulty is multidimensional

Several parameters can lower completion rate while producing very different
experiences. Tune the parameter connected to the level's purpose instead of
raising every number at once.

| Control | Usually changes | Common misuse |
| --- | --- | --- |
| Higher score target | Efficiency demand | Turns a solved idea into a grind |
| Fewer moves | Pressure and recovery room | Makes learning levels unforgiving |
| Smaller board | Scarcity and positioning | Increases luck when refill is uncontrolled |
| More tile values | Adjacency and planning complexity | Quietly destroys useful matches |
| More blockers | Path topology | Removes choice without adding a tradeoff |
| Lower-value refills | Build time | Stretches a level without deepening it |
| Hidden refill variance | Outcome uncertainty | Substitutes luck for difficulty |
| Fixed starting state | Authored reasoning | Becomes rote if every later state is fixed |

## Separate four qualities

### Feasibility

Can at least one valid sequence complete the objective under the stated rules?

### Difficulty

How often do players of a named skill level complete it, and how many attempts
or resources does it take?

### Stability

Does the level retain roughly the same challenge across allowed random seeds,
or do some seeds produce automatic wins and others near-impossible boards?

### Quality

Does play involve understandable, interesting decisions? A level can be
feasible, statistically calibrated, and still be dull.

Automated systems are strongest at feasibility and measured policy outcomes.
Human playtests remain necessary for clarity, agency, and enjoyment.

## Shape the campaign in waves

A satisfying campaign does not become harder after every level. Use a rhythm
of instruction, practice, test, and relief:

```text
introduce -> reinforce -> pressure test -> payoff -> combine
```

Easier levels after a challenge let players demonstrate mastery and enjoy the
power they have acquired. They also make later difficulty spikes legible.

## Completion-rate hypotheses

The following bands are starting hypotheses for a broad casual audience, not
universal targets:

- Tutorial: 85-95% first-attempt completion.
- Comfortable: 70-85%.
- Standard challenge: 55-70%.
- Hard: 35-50%.
- Showcase challenge: lower, used deliberately and sparingly.

Replace these assumptions with the game's own player data. Define whether a
rate is first-attempt, eventual, no-booster, or any-completion before comparing
two levels.

## Avoid fake progression

Larger numbers do not necessarily mean harder play. Uniformly scaling every
tile and target can preserve the same decisions while making the score look
more impressive. Likewise, a smaller board is not automatically better if it
only increases dependence on random refill.

Progression should add or recombine decisions:

- A new topology to manage.
- A new reason to preserve a tile.
- A new objective competing with score.
- A known mechanic under a new constraint.
- A demand for planning one additional move ahead.

## Review questions

- What skill is this level measuring?
- Which parameter creates that measurement?
- What would become easier if that parameter were removed?
- Can the player recover from one ordinary mistake?
- Is loss attributable to a decision the player could understand?
- Does this level differ behaviorally from its two neighbors?

