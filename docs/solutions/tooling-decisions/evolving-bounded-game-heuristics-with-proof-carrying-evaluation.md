---
title: Evolving bounded game heuristics with proof-carrying evaluation
date: 2026-09-16
category: tooling-decisions
module: oracle authoring
problem_type: tooling_decision
component: tooling
severity: medium
related_components:
  - testing_framework
  - development_workflow
applies_when:
  - A policy can be isolated behind a small deterministic interface
  - Candidate quality can be scored cheaply on fixed paired inputs
  - An independent verifier can reject invalid outputs
tags:
  - openevolve
  - oracle
  - heuristic-search
  - game-ai
  - replay-verification
  - human-benchmark
---

# Evolving bounded game heuristics with proof-carrying evaluation

## Context

The authoring oracle already had a legal bounded search, but its beam ranking
still lost moves to the owner's deliberate harvesting strategy. The owner had
identified the useful objective more precisely than “make a large tile”: build
compatible high-value mass with as few setup moves as possible, then cash it
out in a large chain.

Earlier policy work had also shown that simple greedy tie-break variants did
not form a reliable skill ladder. A policy that won on one tested surface did
not establish a causal mechanism, a general ordering, or a skill ceiling
(session history).

This made the ranking policy a strong evolutionary-search candidate. The legal
actions, seeded stream, transitions, and witness verification could remain
fixed while a single deterministic function changed. In the current tree,
`solver/oracle/harvest-policy.js:3-5` explicitly limits that function to ranking
already-generated legal successor states. `solver/oracle/search.js:52-63` uses
the result only to retain a bounded beam.

## Guidance

Use evolutionary code search for a game heuristic only when the optimization
surface is both narrow and proof-carrying:

1. **Isolate one pure policy seam.** Keep rules, action generation, randomness,
   target checks, and replay outside the mutable file. Here the evolved module
   sees a state and returns a rank; the search continues to generate actions
   and transition them through the real simulation
   (`solver/oracle/search.js:96-127`).

2. **Score fixed, paired work.** Every candidate must see the same boards,
   seeds, and work budget. The development panel names four exact cases and a
   600-state cap in `tools/evaluate-harvest-policy.js:7-13`, then passes that cap
   into the search at `tools/evaluate-harvest-policy.js:22-28`.

3. **Make legality a hard gate, not part of fitness.** The evaluator replays
   every winning witness through the independent verifier before it reports a
   metric (`tools/evaluate-harvest-policy.js:29-35`). A candidate that loses a
   board or fails replay is ineligible regardless of its aggregate score.

4. **Optimize the actual relationship to the human benchmark.** Aggregate
   moves alone can hide one board getting worse. Track both total moves and the
   count of boards on which the oracle is slower
   (`tools/evaluate-harvest-policy.js:40-49`). Give the no-loss condition enough
   weight that a lower total cannot compensate for a new human miss.

5. **Keep the generator non-agentic.** A code-generation backend used inside
   an optimizer should return text only. Disable its file and shell tools, run
   candidates serially in isolated worktrees, and restore the policy in a
   `finally` path after each score. During this run, a timed-out Claude Code
   generation call edited the controlling checkout because its default tools
   were still available. Adding `--tools ""` to that backend closed the path.

6. **Test the seam's contract, not its starting constants.** An early test
   asserted the baseline heuristic's exact numeric outputs, which meant every
   successful evolution necessarily failed the “immutable” test. The durable
   assertions are now that compatible mass receives a finite preference, the
   policy does not mutate the state, and a bounded search reports UNKNOWN
   rather than impossibility (`solver/tests/harvestPolicy.test.js:14-29`).

7. **Stop when the declared target is met.** Do not keep spending iterations
   merely because the optimizer can. Preserve later hypotheses for a separate
   run or for fresh confirmation.

## Why This Matters

OpenEvolve worked here because it was not asked to invent a solver. It tuned a
small ranking program inside a deterministic solver whose physical actions and
evidence path were already trustworthy. That sharply limited both the search
space and the ways a candidate could cheat.

The two retained changes also showed why intermediate measurement matters. The
first policy rewarded high-value compatible tiers, exact pairs, and doubling
ladders; the four-board development panel moved from 51 moves with three human
misses to 44 moves with two. The second policy reduced the setup bias rather
than adding more complexity; it reached 41 moves with zero human misses. The
final ranking balances immediate score against harvestable mass at
`solver/oracle/harvest-policy.js:35-37`.

That result does **not** prove universal superiority or optimality. On the four
development boards the oracle tied the owner twice and used two fewer moves
twice. Those boards had already been observed, so they are development inputs.
Generalization requires a separately preregistered run on fresh boards.

## When to Apply

Apply this pattern when:

- the mutable policy fits in one small module;
- evaluation is deterministic or can be paired on identical randomness;
- each candidate is cheap enough to score repeatedly;
- an independent verifier can reject invalid outputs;
- the objective represents the real product relationship, not a convenient
  proxy; and
- overfitting can be separated from later confirmation.

Do not use this pattern when the generator must change rules and evaluation at
the same time, when there is no independent correctness oracle, or when the
only score is a noisy aggregate that can conceal important regressions.

## Examples

The starting policy effectively ranked states as immediate score plus locally
compatible tile mass. Evolution retained a still-explainable structure:

```js
function rankState(state, { potentialWeight = 1.3 } = {}) {
  return state.score * 0.75 + potentialWeight * harvestableMass(state);
}
```

The important result was not merely the constants. It was the full experimental
shape:

```text
mutable:      harvest-policy.js only
fixed:        rules, seeded stream, legal actions, search budget, verifier
hard gates:   all witnesses replay; all four boards remain wins
objectives:   minimize total moves; minimize slower-than-human boards
baseline:     51 moves, 3 misses
final:        41 moves, 0 misses
claim:        development-panel best known, not fresh confirmation
```

That combination makes evolutionary search useful without allowing it to
redefine success.

## Related

- [Measurement and Analysis Standards](../../MEASUREMENT-AND-ANALYSIS-STANDARDS.md)
