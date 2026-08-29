# Universe Map

> Generated control panel as of 2026-08-28. Do not edit by hand. Evidence standing comes only from [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md); this page is a projection.

## Warnings

- None.

## Identity

- **Champion standing:** unchanged
- **Protected champion commit:** `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`
- **Latest artifact:** `ab8ed417a7cf`
- **Pinned verifier revision:** `8508c3b4aa2b`

## Evaluation universe

- **Selection universe:** 6 levels × 12 seeds = 72 games (11.3% of 53 shipped levels).
- Levels: 1, 10, 20, 30, 40, 52.
- **Representative holdout:** 12 levels × 24 seeds = 288 games.
- Levels: 1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 52.

## Observed performance

- **Ledger-admitted: RESULT-0019** (accepted, `heuristic_observation` for archive occupancy and policy performance in this bounded search; `direct_source` for artifact identities, exact axis binding, seed disjointness, replay equality, and protected champion standing. No policy-independent bound follows.) — 23/25 occupied behavior cells.
- **Verified artifact, ledger-admitted** — 23/25 occupied behavior cells.
- **Generalization:** 0 of 3 representatives beat the champion on holdout.
  - `e7349b8a477a` in `4,1`: -1.48% holdout fitness
  - `d4dee742cedd` in `0,4`: -33.21% holdout fitness
  - `0b207fb85a0f` in `1,0`: -32.74% holdout fitness

## Evidence standing

- Accepted standing: RESULT-0019 in EVIDENCE_LEDGER.md.
- Latest artifact: selected.
- CURRENT.md navigation: current; last reviewed 2026-08-28.

## Current frontier

1. **evaluation-universe-coverage:** Widen and characterize the selection-level universe before interpreting policy lift as broad generalization.
2. **generalization:** Seek positive disjoint-holdout evidence before considering any champion change.

## Drill-down

- [Visual static view](universe/map.html)
- [Resolved machine-readable model](universe/resolved.json)
- [Universe contract](universe/contract.json)
- [Current navigation](CURRENT.md)
- Latest artifact: `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json`
