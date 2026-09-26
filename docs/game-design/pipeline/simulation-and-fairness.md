# Simulation and fairness

## What simulation is for

Simulation helps establish a plausible numeric range and reject broken
candidates. It does not determine whether a level is fun, and one bot does not
represent all human skill.

Use a small policy ensemble rather than one universal player:

- **Greedy:** favors immediate score.
- **Longest-chain:** favors the most tiles.
- **Builder:** values future adjacency or preserved pieces.
- **Noisy novice:** sometimes misses strong options.
- **Search policy:** evaluates several turns or states ahead.

Differences between policies can be more informative than one average win
rate. A level where every policy makes the same moves may be straightforward;
a level where planning policies beat greedy ones may contain the intended
strategic tension.

## Set targets from distributions

For a fixed candidate, simulate many allowed seeds and inspect the full result
distribution. For example:

```text
novice median score:   12,000
greedy median score:   16,500
builder median score:  19,000
search median score:   24,000
```

These values locate a possible target. They do not prescribe it. Select a
starting target based on the intended audience and then test it with humans.

Do not compare one player's result on one seed to a bot median over unrelated
seeds. Pair comparisons on the same starting state and random sequence when
the question is about policy or skill.

## Measure more than completion

Useful candidate measurements include:

- Completion rate by policy and seed panel.
- Score and moves remaining at completion.
- Invalid or unwinnable starting states.
- Legal and meaningfully viable choices per turn.
- Frequency of one dominant action.
- Outcome variance across seeds.
- Lockout or terminal-state frequency.
- Dependence on one unusually favorable refill.
- How often the intended behavior appears in successful runs.

A target completion rate can hide two bad populations: automatic-win seeds
and nearly impossible seeds. Always inspect conditional and seed-level
distributions.

## Control randomness

Independent random spawning is easy to implement but difficult to author
around. More controlled approaches include:

- A weighted bag of upcoming values.
- A visible preview queue.
- Bounds on consecutive unhelpful refills.
- Several pre-approved refill sequences.
- Fixed seeds for tightly authored puzzles.
- A recovery rule when the board has no useful action.

Assistance should preserve uncertainty without making the game visibly solve
itself. Document what the generator guarantees so designers know which states
they may rely on.

## Qualify the evaluator

Before trusting a bot or metric:

1. State exactly what behavior it represents.
2. Run it on a known easy and known difficult fixture.
3. Give it a deliberately bad board and watch the check fail.
4. Compare it with recorded human play on identical boards and seeds.
5. Record where its ranking disagrees with human judgment.

A green check is useful only if it inspects the real candidate and has been
seen to reject a crafted failure.

## Project evidence boundary

The project evidence ledger records important limitations of its current
policies and measurements. In particular, policy-dependent win rates should
not be silently relabeled as human difficulty. Cite the exact ledger record
when making a project claim; use this file only for the general method.

