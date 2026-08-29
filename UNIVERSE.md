# Universe Map

> Generated control panel as of 2026-08-28. Do not edit by hand. Evidence standing comes only from [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md); this page is a projection.

## Warnings

- **artifact-not-ledger-admitted:** The latest verified MAP-Elites artifact has no selected ledger record and is not accepted project evidence.
- **current-navigation-stale:** CURRENT.md is stale at this map boundary: last reviewed 2026-08-20, 8 days before 2026-08-28.

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

- **Ledger-admitted: RESULT-0017** (accepted, `heuristic_observation` for the bounded archive and policy results; `direct_source` for the artifact identities, replay equality, disjoint seeds, and unchanged protected hashes. No optimality, human-strength, or complete behavior-space claim follows.) — 20/25 occupied behavior cells.
- **Verified artifact, not ledger-admitted** — 23/25 occupied behavior cells.
- **Generalization:** 0 of 3 representatives beat the champion on holdout.
  - `e7349b8a477a` in `4,1`: -1.48% holdout fitness
  - `d4dee742cedd` in `0,4`: -33.21% holdout fitness
  - `0b207fb85a0f` in `1,0`: -32.74% holdout fitness

## Evidence standing

- Accepted standing: RESULT-0017 in EVIDENCE_LEDGER.md.
- Latest artifact: not-admitted.
- CURRENT.md navigation: stale; last reviewed 2026-08-20.

## Current frontier

1. **ledger-admission-gap:** Independently admit or explicitly reject the latest verified artifact before using it as accepted evidence.
2. **evaluation-universe-coverage:** Widen and characterize the selection-level universe before interpreting policy lift as broad generalization.
3. **generalization:** Seek positive disjoint-holdout evidence before considering any champion change.

## Drill-down

- [Interactive static view](universe/map.html)
- [Resolved machine-readable model](universe/resolved.json)
- [Universe contract](universe/contract.json)
- [Current navigation](CURRENT.md)
- Latest artifact: `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json`
