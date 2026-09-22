# Family Opening Study

Throwaway gameplay prototype for one question: when chain legality and scoring
remain unchanged, does the family composition of the starting board create
useful pressure through obstruction or opportunity?

Open:

`http://127.0.0.1:8251/index.html?level=1&seed=1234&family-board=control`

Use the on-screen arrows (or keyboard left/right arrows) to switch between:

1. **Single family** — the control. Every opening tile belongs to Verdigris.
2. **Cross-contamination** — Verdigris and Cinnabar legal chains interrupt one
   another spatially.
3. **Competing reactions** — a long low-value family competes with shorter,
   higher-value reactions that may improve after gravity.

All three use a 5 × 8 board, 100 moves, a 1,000,000 target, minimum chain
length two, fixed refill seed 1234, and the shipped equal-or-double chain rules.
Prototype plays are not submitted to `play-sessions/`.

## Baseline and intended break

The owner's captured baseline is build-and-harvest: create several valuable
survivors, then combine them in a later large chain (PDL-008 in
`prototypes/PLAYTEST-DECISION-LEDGER.md`).

The exact opening state under examination is the **Cross-contamination** board.
At row 3, column 3 (one-indexed), the Cinnabar `20` divides the central
Verdigris field, while the Cinnabar `10 → 20 → 40` path on the right remains a
separate legal scoring opportunity. A reflex to extend the broad Verdigris
build without valuing the survivor's column can leave the two families
mutually obstructive after gravity. The prototype should be rejected as a
strategic effect if the family split is merely cosmetic or if the same opening
move feels best in all three variants.

This is a feel study, not experiment evidence and not a proposed rule change.
