# Concepts

Shared domain vocabulary for this project — entities, named processes, and
status concepts with project-specific meaning. Seeded with core domain
vocabulary, then accretes as ce-compound and ce-compound-refresh process
learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Oracle authoring

### Authoring oracle

A bounded, seeded search reference used to evaluate and shape levels, distinct
from the live gameplay bot and described by its verified best-known witness
rather than as an optimal player.

### Witness

An ordered play trace that can be independently replayed through the game rules
to its first terminal outcome.

### Development panel

A fixed set of already-observed puzzles used to compare and tune candidate
policies; success on it is development evidence, not confirmation on unseen
puzzles.

### Human miss

A paired puzzle on which the oracle needs more moves to win than the best
verified human win on the identical board and seeded stream; a tie is not a
human miss.

### Harvestable mass

Non-blocked tile value distributed across equal or doubling-compatible tiers
that a ranking policy treats as material for future high-value chains, distinct
from a single isolated maximum tile.
