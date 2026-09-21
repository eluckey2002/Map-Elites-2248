# Keeper material progression and family palette — design QA

Date: 2026-09-19

## Comparison target

- Iteration reference: `/var/folders/bb/jgtk589s6f51m62dw2gc32300000gn/T/codex-clipboard-VTIB3G.png`
- Board typography reference: `/var/folders/bb/jgtk589s6f51m62dw2gc32300000gn/T/codex-clipboard-gTgr1l.png`
- User direction: replace the raw stones with one granular apothecary mound, simplify the crystal from four points to two, carry five value families through every material, and keep ambient motion sparse.
- Material implementation: `http://127.0.0.1:8251/index.html?level=1&seed=1234&materials=1`
- Family implementation: `http://127.0.0.1:8251/index.html?level=1&seed=1234&materials=1&families=1`
- Board-scale implementation: `http://127.0.0.1:8251/index.html?level=1&seed=1234&showcase=1`
- Final material-study capture: `material-study-v8.png`
- Combined reference/implementation evidence: `material-study-v8-comparison.png`
- Main viewport: 1280 × 720 CSS px at device scale factor 1.
- Reference pixels: 458 × 998. Implementation pixels: 1280 × 720. The comparison scales and letterboxes each image into equal-height panels without cropping.
- State: four-era material study plus a five-family palette matrix.

## Findings

- No remaining P0, P1, or P2 visual findings within the requested asset scope.
- The raw stage now reads as one measured mound of granules rather than three solid stones.
- The crystalline stage now reads as one tall point and one shorter joined point, with fewer, broader planes.
- The potent essence stage now reads as a single round violet flask with a short neck and cork, establishing a visibly new contained state.
- Granular mound, fused bead, two-point crystal, and potion now have distinct outlines even before their colors or numbers are read.
- The five family roots are 2, 3, 5, 7, and 9. Runtime values derive their family by removing factors of two, so 2/4/8 remain one lineage while 3/6/12 form another.
- The same five hues persist through every material stage; unlisted family roots remain neutral rather than borrowing a false lineage.
- Motion is intentionally local: two intermittent raw flecks and a faint wisp, a fleeting compound edge glint, one distant crystal mote, and a gently shifting potion meniscus.

## Required fidelity surfaces

- Fonts and typography: existing Keeper typography is unchanged. Essence numbers use pale violet rather than teal so they belong to the new material family.
- Spacing and layout rhythm: the four study rows, tile centers, and scale factors are unchanged.
- Colors and visual tokens: the five lineages use verdigris, amber, cinnabar, amethyst, and lapis. Grayscale-first tinting preserves each asset's light/dark form across hues.
- Image quality and asset fidelity: `keeper-material-elements-v5.png` and `keeper-material-crystal-v6.png` are true-alpha 1254 × 1254 PNGs with single centered subjects. No CSS or vector stand-ins were used.
- Copy and content: era names and value ranges are unchanged.

## Comparison history

1. `material-study-v7.png`: raw still read as a solid rock, and the four-point crystal retained more internal detail than survived at board size.
2. Fix: replaced raw with one granular mound and reduced crystal to exactly two joined points with three or four broad facet planes per point.
3. `material-study-v8.png`: granules remain recognizable beneath the values, and the two-point crystal has a cleaner hard-edged silhouette.
4. Full-board reference: three- and four-digit numerals were translucent, inconsistently fitted, and crowded by the largest crystal and potion silhouettes.
5. Fix: changed numerals to opaque family-tinted fills with a contrasting keyline, measured each label against a stage-specific maximum width, and reduced crystal/potion scale by roughly 10–12%.
6. Post-fix browser evidence: all 40 values remain readable at the 1280 × 720 review viewport, with clearer separation between adjacent silhouettes and no numeral extending beyond its piece.
7. Optical sizing correction: reduced crystalline scale from 1.10 to 1.04, increased potion scale from 1.08 to 1.16, and shortened exact 1024/2048 labels to `1k`/`2k` so the two stages carry comparable perceived weight.
8. Compact-value correction: every four-digit value now rounds to one decimal in thousands, with trailing `.0` removed. This keeps bottle labels optically consistent from `1k` through `3.6k`.
9. Compact-label normalization: every `k` label now shares one optical font height, preventing short `1k`/`2k` strings from overpowering decimal labels while preserving measured horizontal fitting.
10. Structural typography correction: moved every value off the artwork onto one shared lower-cell baseline, standardized all labels to one ivory treatment and optical height, and shifted/reduced the material objects into the upper cell area. This removes the shape-, hue-, and highlight-dependent contrast problem instead of continuing per-material exceptions.
11. Wide-layout correction: moved game status into a compact right rail and controls into a 2 × 2 left rail, allowing the 5 × 8 board to use nearly the full viewport height. A restrained dark-glass backing preserves status legibility over the laboratory apparatus; narrow viewports retain the stacked layout.
12. Family-equivalence correction: material stage now derives from doubling distance from a family's base rather than absolute value. Equal progression positions therefore share one silhouette across the 2, 3, 5, 7, and 9 families; hue is the only family-specific visual variable.

## Interaction and regression checks

- The study rendered in the Codex in-app Browser with all assets visible.
- Both the five-column palette study and the seeded level 31 gameplay board were refreshed and visually inspected after the lineage and motion changes.
- The board-scale state was inspected at 1280 × 720 in the in-app Browser: the full 5 × 8 gameplay board fills all 40 cells with a natural mix across all five family hues and all four main material stages, with eight tiles per family and the same live animation code used during play.
- Primary gameplay code was not changed; `src/game.js` has an empty diff.
- Targeted engine/server tests: 45 passed.
- Game-mirroring/level tests: 25 passed.
- JavaScript syntax and whitespace checks passed.
- Browser console inspection remains blocked: the selected in-app Browser does not expose console logs, and its security policy previously refused runtime JavaScript inspection. No alternate-browser or raw-debugging workaround was attempted.
- The in-app Browser returned the revised full-board screenshot for direct inspection but did not expose a supported filesystem save path, so a same-input persisted comparison artifact could not be produced.

final result: blocked
