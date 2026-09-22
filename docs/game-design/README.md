# Chain-and-merge game design guide

This directory explains how to reason about a level-based, powers-of-two
chain puzzle without requiring an agent to load one large design document.
Start here, then open only the file that owns the current question.

This is a design guide, not the project's evidence authority. For claims
about the shipped game, current experiments, or accepted decisions, use the
root [evidence ledger](../../EVIDENCE_LEDGER.md) and
[current-work page](../../CURRENT.md). The older [game design
document](../DESIGN.md) remains a historical product description.

## Choose a reading path

| If you need to answer... | Read |
| --- | --- |
| What genre is this and why is it satisfying? | [Style and core loop](mechanics/style-and-core-loop.md) |
| Where do planning and meaningful decisions come from? | [Strategy and board geometry](mechanics/strategy-and-board-geometry.md) |
| What kinds of levels can we make? | [Archetypes and objectives](levels/archetypes-and-objectives.md) |
| Which knobs change difficulty, pacing, or fairness? | [Difficulty and progression](levels/difficulty-and-progression.md) |
| How does a designer create one level? | [Authoring loop](pipeline/authoring-loop.md) |
| How do we use bots without mistaking them for players? | [Simulation and fairness](pipeline/simulation-and-fairness.md) |
| What tools make level production scalable? | [Editor and telemetry](pipeline/editor-and-telemetry.md) |

## Mental model

The game is a hybrid of powers-of-two merging, path drawing, and
move-limited campaign puzzles. Its production model should also be hybrid:

1. A human names the intended player experience.
2. An archetype supplies a proven structural starting point.
3. Parameters and generators produce candidate boards.
4. automated checks remove broken, trivial, and unstable candidates.
5. Human playtests judge clarity, agency, and enjoyment.
6. Released-player telemetry reveals where the model was wrong.

Humans author the interesting decisions. Software handles arithmetic,
repetition, candidate generation, and validation.

## Content boundaries

These files intentionally separate concerns:

- `mechanics/` describes the play experience and decision space.
- `levels/` describes reusable content patterns and progression.
- `pipeline/` describes creation, measurement, tools, and iteration.

Do not put experiment results or changing project status here. Put those in
the evidence system and link to them. Do not duplicate a rule across several
files; link to the file that owns it.

## Recommended size and maintenance

Keep each topic file focused enough to read in roughly five minutes. When a
file starts answering two independent questions, split it and add both routes
to the table above. Prefer adding a concrete example to the owning file over
creating a second explanation elsewhere.

