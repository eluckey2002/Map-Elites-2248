# Editor and telemetry

## The editor should shorten the judgment loop

A useful internal editor does more than serialize a board. It lets a designer
move quickly from intent to playable evidence.

### Essential authoring controls

- Resize or reshape the board.
- Paint starting tiles, holes, and blockers.
- Set objectives and move limits.
- Configure refill and gravity rules.
- Play immediately from the edited state.
- Undo and replay using the same random seed.
- Save a candidate without adding it to the shipped campaign.

### Useful analysis controls

- Run a chosen number of simulated attempts.
- Compare several policies on identical seeds.
- Display score, completion, and move distributions.
- Flag invalid starts, lockouts, and unstable seeds.
- Show frequently selected cells and paths as heat maps.
- Identify turns with one dominant action.
- Generate and rank nearby variants.

### Review and provenance

- Give every candidate a stable identifier.
- Record its rules, seed panel, generator version, and evaluator version.
- Preserve acceptance and rejection reasons.
- Distinguish a candidate from a shipped level.
- Make before-and-after tuning comparisons reproducible.

## Variant generation

A designer should be able to request controlled neighbors of a promising
candidate:

- Plus or minus one or two moves.
- A modestly higher or lower demand.
- One blocker moved to another legal cell.
- One row or column added or removed.
- A different starting bridge tile.
- Several refill seeds under the same rules.

The tool should rank variants and explain the ranking inputs. It should not
silently choose the final level.

## Telemetry questions

After release, collect only data that answers an explicit design question.
Examples include:

- Where do players abandon or restart?
- Which move causes most eventual losses?
- How many attempts precede completion?
- How many moves remain on wins?
- Which objectives are misunderstood?
- Are losses concentrated in particular seeds or starting layouts?
- Do players use the behavior the level intended to teach?
- Does booster use indicate challenge, confusion, or impatience?

Define each measure precisely. "Win rate" is ambiguous unless it states
first attempt versus eventual completion, seed population, booster use, and
the time window.

## Human review dashboard

For each candidate, show a compact card:

```text
Intent: preserve a bridge for a long chain
Archetype: combo challenge
Candidate: CC-014-v3
Seed stability: acceptable / review / reject
Completion by policy: novice 42%, greedy 55%, builder 71%
Dominant-move turns: 18%
Terminal-state rate: 1%
Human sessions: 8
Disposition: accept / revise / reject
Reason: ______________________________
```

Numbers support the decision; the written reason preserves why the decision
was made.

## Minimum viable tooling order

1. Candidate save/load with stable identity.
2. Instant playable preview with repeatable seeds.
3. Automatic validity and regression checks.
4. Batch simulation and distribution reporting.
5. Controlled variant generation.
6. Heat maps, policy comparison, and live telemetry integration.

This order creates value early without requiring a complete procedural level
system before designers can work.

