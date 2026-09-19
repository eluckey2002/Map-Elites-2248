# Family openings on the 7×7 board MAP-Elites map

This is an exploratory authoring prototype, not registered evidence and not a
gameplay-rule change. It places fixed family-island openings into the existing
successful-plan-breadth × harvesting-advantage grid used by RESULT-0046.

The playable game remains 5×8. The **archive** is 7×7.

## Design question

Can persistent family islands populate behavioral cells that the ordinary
shape generator left empty?

The owner's captured baseline strategy is build-and-harvest. A family opening
is interesting only when the player must decide which separated family island
to preserve, consolidate, or reconnect; simply taking the largest available
family chain and returning to ordinary build-and-harvest is not a new decision.
The exact counterexample state must come from a retained elite before human
play. Until then this prototype discovers candidates; it does not claim a new
strategy.

## Frozen-for-this-run exploratory choices

- 5×8 opening, 16 moves, minimum chain two.
- Families 3, 5, 7, and 9.
- Five full-row/full-column island templates.
- Normal blue-only 2/4/8 refills.
- Candidate target: family root × 160.
- Breadth landmark: family root × 16. These authored openings use stages 1×,
  2×, and 4×, so the landmark sits four times above the highest opening stage
  and produces real separation across the archive's frozen breadth bins.
- Three fixed refill streams per candidate.
- Same seven breadth bins, seven harvesting bins, and three elites per cell as
  RESULT-0046.

The target and landmark normalization make families comparable by progression
stage rather than raw number size. They are prototype controls, not proposed
level settings.

Run:

```sh
node --test prototypes/family-map-elites/run.test.js
node prototypes/family-map-elites/run.js --count 80
```

Open `output/map.html` after the run.

## Exploratory result

The 80-board run occupied nine family cells. All nine were empty in the
RESULT-0046 archive, increasing the combined visual occupancy from **6/49 to
15/49**.

The family population filled the complete neutral-harvest breadth row:
`0,3` through `6,3`. It also filled `0,2` and `0,4`, where bounded immediate
or harvesting play respectively held a 1–5% move-cost advantage. This is a
useful candidate-discovery result: family openings add strong horizontal
coverage across successful-plan breadth, but this panel produced little
vertical separation on harvesting advantage.

Open `output/combined-map.html` for the existing archive and family additions
on one 7×7 grid. Purple cells are the nine additions; gold cells are the six
existing RESULT-0046 cells.

## Preserved calibration attempt

`output-landmark64/` retains the first 80-board pass. Its family-root × 64
landmark put all 80 candidates in breadth bin zero, so it could not exercise
the horizontal map axis. It is preserved as a failed calibration, not used as
the current map.
