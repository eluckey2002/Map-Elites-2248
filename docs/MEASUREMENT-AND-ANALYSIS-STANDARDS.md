# Measurement & Analysis Standards

Status: active project standard
Last reviewed: 2026-09-16

## Purpose

This document defines how the project measures a position, a playthrough, a
policy, and a level. Its main rule is simple: do not use one kind of measurement
to answer a different kind of question.

The project uses four measurement layers:

1. **Live state** — what strategic situation exists on the board now.
2. **Behavior** — what choices a player or policy made through time.
3. **Outcome** — what the run achieved.
4. **Puzzle/search structure** — what a named exact or bounded analysis found
   about a frozen puzzle.

Keep these layers separate in code, reports, experiments, and decisions. A
correlation between layers is a result to establish, not a definition to
assume.

## The measurement layers

| Layer | Question | Examples | Must not be presented as |
| --- | --- | --- | --- |
| Live state | What choices and pressures exist now? | Progress, remaining moves, viable starts, off-lattice occupancy, build potential, hazards | Player skill, level quality, or eventual outcome |
| Behavior | How was the game played? | Greed ratio, mean chain length, late-score share, half-score timing | A property of the starting board |
| Outcome | What happened? | Win, score, moves to target, lockout | An explanation of why it happened |
| Puzzle/search structure | What did this analysis find? | Recovery witnesses, merge depth, spatial spread, forced-prefix ratio, bounded opening diversity | Live player state or an exhaustive property when the search is bounded |

### Fitness is a separate decision

A metric can describe play without being suitable as an optimization target.
The project has not adopted one scalar policy fitness function. Score,
moves-to-target, win rate, lockout avoidance, and human similarity reward
different things. Do not combine them with arbitrary weights and call the
result quality.

## Live strategic state vector

Record the following after each completed move. Preserve the time series; do
not retain only a whole-game average.

### 1. Objective state

Record these values separately:

- `scoreProgress = score / target`
- `moveProgress = movesUsed / moveBudget`
- raw `score`, `target`, `movesUsed`, and `moveBudget`

Do not turn the two progress fractions into an ahead/behind verdict without a
validated pace model. A strategy may deliberately build early and cash out
late, so a linear score schedule can mislabel good setup as failure.

### 2. Agency

The existing exact opening proxy is viable-start fraction: the share of
available tiles that can begin at least one legal chain.

Agency is not the same as meaningful choice. Hundreds of legal chains may all
serve the same plan. Reports should distinguish:

- how many moves are legal;
- how many tiles can begin a legal move;
- how many materially different plans remain viable.

### 3. Off-lattice occupancy and reuse pressure

Record the fraction of non-stone cells occupied by values outside
`tileScale × 2^n`. Use the neutral name **off-lattice occupancy** in prose.
`strandedCellPressure` is the current code identifier, but “stranded”
overstates what the rules establish.

An off-lattice survivor has no partner in the normal spawn family. It is not
permanently dead. The player can deliberately construct another compatible
off-lattice value and reuse both in a legal chain. For example, `6 → 6 → 12`
is legal at minimum chain length three and collapses three occupied cells into
one reusable `24`. The survivor remains off-lattice: merging preserves the
value family's odd factor, so this process reclaims cells rather than returning
the value to the ordinary power-of-two lattice.

Therefore:

- occupancy alone measures neither permanent damage nor lockout;
- pressure depends on remaining moves, free maneuvering room, adjacency, and
  the cost of constructing compatible partners;
- deliberately making an off-lattice survivor can be rational when its
  immediate score or route to the target is worth that recovery cost;
- a lockout is the observed absence of any legal chain, not a synonym for the
  presence of off-lattice values.

The current owner observation is that these values rarely occupy much of the
board and the game rarely pressures the player to create them. Treat that as a
design lead until a registered or exactly scoped measurement establishes its
frequency and consequence.

### 4. Build potential

The current system does not measure useful value stored for later play. Add a
candidate measure that distinguishes:

- valuable on-lattice tiles with reachable compatible partners;
- the same total value fragmented into incompatible or isolated pieces;
- dealt low-value material from value the player deliberately built;
- buildable material from value that can no longer contribute within the
  remaining horizon.

The exact formula is not adopted. It must first pass controlled examples in
which total board value stays fixed while compatibility and geometry change.
Do not use “sum of large tiles” alone; that ignores whether the tiles can ever
work together.

### 5. Immediate hazard

Record concrete hazards rather than a generic difficulty score:

- whether any legal chain exists;
- bomb timers and whether a bomb can be reached in time;
- temporarily blocked-cell fraction;
- permanent stone footprint;
- the level's current minimum-chain requirement.

These fields explain constraints. They do not by themselves say the position
is fun, fair, or difficult.

## Decision richness and landmark routes

Choice density is insufficient when many moves collapse into one meaningful
plan. The owner has observed late-game positions where there appears to be
only one practical route to the next landmark tile, such as 2048. Such a board
may be solvable while still feeling strategically narrow.

Use **landmark-route multiplicity** as the candidate concept:

> For a named board state, landmark value, and move horizon, how many
> materially different first decisions retain at least one replayable route to
> creating that landmark?

Any implementation must state:

- the landmark value and horizon;
- whether the analysis is exact or bounded;
- how equivalent chain reversals and spatially identical outcomes are
  deduplicated;
- whether the alternatives create real tradeoffs or merely cosmetic move
  variants;
- which misses are `UNKNOWN` because the search bound was exhausted.

A useful level should not merely expose many legal moves. It should offer more
than one credible plan at important construction frontiers. This is a level
design hypothesis until human evidence connects the candidate measure to
planning, interest, or replay value.

## Behavior measurements

Behavior metrics describe the path taken through live states.

| Measure | What it records | Current limitation |
| --- | --- | --- |
| Mean chain length | Surface size of selected chains | Does not say whether the chain built future value |
| Late-score share | Share of score earned in the final third | Fixed timing boundary; does not explain the setup |
| Half-score move | When half the final score was accumulated | Retrospective and dependent on the final score |
| Greed ratio | Chosen immediate points relative to the strongest measured immediate move | Exact denominator coverage is incomplete; the candidate axis is not adopted |
| Off-lattice occupancy trajectory | How off-lattice presence changes during play | Reuse cost and strategic value are not yet measured |

Never promote a behavior descriptor into a claim about player identity,
difficulty, fun, or quality without an experiment that measures that link.

## Outcome measurements

Always report outcomes separately:

- win or loss;
- final score;
- moves to target when the target was reached;
- termination reason;
- lockout count or rate;
- paired score difference on identical boards and seeds.

An outcome says what happened. Use the state and behavior traces to investigate
why.

## Bot and human comparison standard

The bot and human must receive the same board, seed, move budget, and objective.
Never compare one seed with a median over other seeds.

### Three different “better” claims

1. **Reliability:** Which player reaches the target or avoids lockout?
2. **Speed:** When both reach the target, which uses fewer moves?
3. **Score strength:** When both play the full budget, which earns more score?

These claims are not interchangeable. The shipped bot stops as soon as it
crosses the target, while a human normally continues for score. Comparing
their raw scores in that configuration measures different objectives.

The current 25-session benchmark demonstrates the distinction:

- human wins: 23/25;
- target-stopping bot wins: 25/25;
- full-budget bot score is higher on 25/25 paired sessions, mean `+53.9%`;
- target-stopping bot score is higher on 15/25, mean `+5.0%`.

Reproduce with:

```bash
node solver/human-benchmark.js
```

The project goal is a bot that does not lose to the recorded human under the
same objective. Evaluate that goal with explicit guards:

- no human win becomes a bot loss on the same board and seed;
- compare moves only when both players reach the target;
- compare score only when both players receive the full move budget;
- report every paired regression, not only the mean;
- weight summaries by unique board as well as by session, so repeated attempts
  on one seed do not silently dominate the result;
- separate candidate/pilot recordings from ordinary shipped-level play;
- keep fresh human sessions as holdout evidence rather than tuning repeatedly
  against every recorded move.

A stronger bot is a useful measurement instrument, but it is not proof of
optimal play and does not replace human review of interest, clarity, or
decision quality.

## Policy evaluation standard

For comparing two bot policies:

- use identical level/seed cells for both arms;
- play through the full move budget for the primary score comparison so the
  target does not censor stronger play;
- use paired log score lift rather than a raw mean of ratios;
- cluster uncertainty by level and seed rather than treating every cell as an
  independent board;
- report win regressions and lockouts as hard guardrails;
- report moves-to-target as a separate secondary outcome;
- do not use shipped-level win rate as the sole objective while both policies
  are near its ceiling.

No policy is “better” merely because one aggregate improved. State which
outcome improved and which guardrails did not regress.

## Puzzle and search descriptors

The following remain analysis tools rather than definitions of live play:

- initial choice density;
- bounded recovery-witness rate;
- witness merge depth;
- witness spatial spread;
- forced-prefix ratio over a bounded success set;
- bounded opening diversity;
- budget tightness and chain-length dependence.

Every report must name whether the quantity is exact, a replayed witness, or a
bounded-search proxy. A bounded miss is `UNKNOWN`, not impossible. A property
of one successful witness is not automatically necessary for every solution.

## Level-design hypotheses

The following ideas are worth testing but are not shipped rules or accepted
facts:

### Off-lattice soft blockers

A level could begin with off-lattice tiles that behave like soft blockers. The
player would need to construct compatible values to reclaim their cells. This
could create planning pressure without introducing a new blocker type.

Before adoption, test:

- whether at least two viable cleanup plans exist;
- whether cleanup is understandable from the visible rules;
- whether the starting values create planning rather than forced chores;
- whether the player can rationally defer or exploit them;
- whether the reference bot can recognize and execute the recovery plan;
- effects on win rate, lockouts, score, and moves-to-target against the shipped
  curve.

### Multiple routes to landmark tiles

A level can be winnable yet bland when only one practical route creates its
next large tile. Candidate levels should be inspected for landmark-route
multiplicity at the values their chapter teaches or rewards. Human play must
still decide whether the alternatives feel meaningfully different.

These are proposed authoring directions. Changing level contents, rules, or
scoring still requires the normal measured level-design process and its own
evidence record.

## Evidence and reporting rules

Every measurement report must include:

1. **Question** — the exact claim being tested.
2. **Subject** — level, board identity, seed, player or policy, and code identity.
3. **Objective** — target-stop, full-budget score, speed, or another named goal.
4. **Measure** — formula, units, observation timing, and aggregation rule.
5. **Standing** — exact, direct source, replayed witness, heuristic observation,
   `UNKNOWN`, or unresolved.
6. **Coverage** — boards, seeds, moves, exclusions, duplicates, and missing cells.
7. **Controls** — a positive case, a negative case, and an orthogonal change the
   measure should ignore.
8. **Result** — observations before interpretation.
9. **Boundary** — what the result does not establish.
10. **Reproduction** — command and expected output or artifact identity.

Claims that generalize beyond their measured subjects require a registered
protocol before the outcome is observed. Exact descriptions of named captures
or deterministic source behavior do not become general claims merely because
they are useful examples.

## Current adoption status

| Item | Standing |
| --- | --- |
| Objective state | Adopt as raw live state |
| Viable-start fraction | Exact candidate for agency; opening validation supported |
| Off-lattice occupancy | Adopt as a neutral observation; strategic pressure unresolved |
| Build potential | Missing; define and qualify before adoption |
| Immediate hazard fields | Adopt as raw live state |
| Landmark-route multiplicity | Candidate concept; not yet implemented or validated |
| Mean chain length and late-score share | Diagnostic behavior summaries |
| Greed ratio | Unadopted candidate pending corrected validation |
| Half-score move | Diagnostic; timing axis unvalidated |
| Merge depth and spatial spread | Witness-qualified puzzle descriptors; joint corpus inconclusive |
| Forced-prefix ratio and bounded opening diversity | Revise before MAP use |
| Scalar policy fitness | Not chosen |

## Standard analysis sequence

When investigating a level, policy, or captured session:

1. Freeze the board, seed, objective, and code identity.
2. Replay the run and confirm its outcome.
3. Emit the live state vector after each move.
4. Describe the behavior trajectory.
5. Report outcome metrics separately.
6. Compare paired subjects only on identical boards and seeds.
7. Inspect regressions and exceptional boards before reading the aggregate.
8. State the proof class and evidence boundary.
9. Register a protocol before making a claim beyond the measured subjects.
