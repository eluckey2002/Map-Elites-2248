# First finite Connections pack

Local authoring candidates, 2026-10-03; owner play and release review remain ahead.
The actual catalog is src/connection-levels.js. Witnesses are private authoring
artifacts and are not served or displayed as hints.

## Playing without committing a move

Select a legal chain, then choose **Preview result** to inspect the exact
resulting board, including falling tiles and replacements. No move or removal
charge is spent. **Back to board** returns to the current board and selection;
**Clear** cancels it. You cannot select a further chain on the preview board.
Retries reproduce the same refills for the same actions.

The proposed next-tile display above each column is not present. BL-0025
retains that idea without changing the pack's current refill behavior.

The captured baseline is the owner's build-and-harvest play in PDL-008. These
levels retain that strategy while asking which material to use, where to leave
a survivor and when to spend recovery. They are not new archetypes for a quota.

## Concrete decision scenes

- **Crosscurrent:** on the untouched board, the first goal spans column 1/row 6
  and column 3/row 3, requiring a sum of 48. A normal four-128 build clears support
  material and changes adjacency. Both survivor placements have continuations;
  building the largest available value alone does not complete the objective.
- **Keep a Line:** after the first witnessed connection (move 2), a 4/4/8/16/32
  setup totaling 64 can end at column 2/row 2. An equal-sum alternative ends at
  column 4/row 6 and consumes different material. The former exposes the next
  exact 128 route; bounded exact-goal inspection finds none immediately after
  the alternative. This is a placement/material consequence, not a bot model
  of how the owner would choose. The fixed sequence makes retry knowledge useful.
- **Borrow a Space:** the authored opening includes 512/512/1024 material to
  make earning a removal possible before the finite finish. After that build,
  removing column 4/row 2 settles an opening for the first 96 connection. The
  ordinary refill pool still ranges from 2 through 128. Recovery is useful in
  this route, not proven necessary: the opening search found another two-merge
  route to the first goal. That alternative is retained rather than outlawed.

## Qualification and limits

Run node tools/author-connection-levels.js. It reads the actual catalog and
whole-level witness file; qualification rejects missing/corrupt input. Each
puzzle has three goals and three moves of slack beyond its stored route. The
third route earns and spends one removal before completion.

Opening shortcut scope: first objective only, at most two commitments, at most
1,000 examined states and 20,000 chain/goal nodes per scan. All three reports
find legal two-move opening routes. A whole three-goal level cannot win in two
moves by construction; reporting that fact as a shortcut check would inspect
nothing useful. Later-objective shortcuts and shortest whole-level routes remain
unmeasured. No difficulty rating or enjoyment result follows from qualification.

Zero starting inventory, paid removals, identical retries, final-move wins and
ordinary unrestricted merges remain the approved play contract. First-pack
allowances are authoring candidates for play, not population-calibrated values.
