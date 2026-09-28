# LC-0002 — built-reservoir proxy qualification result

**Completed:** 2026-09-28

**Qualification:** `FAIL`

**Scope:** deterministic known-case qualification only; no fresh seeds, policy
comparison, generalization claim, adoption, or champion change

## Primary result

The frozen `normalizedBuiltReservoirHarvest` proxy passed all five instrument
controls but classified only 5 of the 10 decision-bearing Level 54 moves under
the all-cells rule. It therefore stops here and does not advance to disjoint
candidate-measure validation.

| Move | Known effect on champion takeover | Owner proxy | Champion proxy | Cell |
| ---: | --- | ---: | ---: | --- |
| 1 | harmful, 1 move | 0 | 0 | pass |
| 2 | helpful, 7 moves | 0 | 0 | **fail** |
| 4 | harmful, 2 moves | 192 | 192 | pass |
| 6 | helpful, 4 moves | 192 | 192 | **fail** |
| 8 | harmful, 2 moves | 384 | 448 | pass |
| 9 | harmful, 3 moves | 864 | 768 | **fail** |
| 10 | helpful, 2 moves | 1,600 | 0 | pass |
| 11 | helpful, 3 moves | 1,600 | 1,600 | **fail** |
| 12 | harmful, 1 move | 1,600 | 1,600 | pass |
| 13 | helpful, 1 move | 0 | 0 | **fail** |

Neutral moves 3, 5, 7, 14, and 15 were retained as diagnostics and excluded
from the verdict exactly as frozen.

## What the failure means

The proxy correctly sees move 10: the owner preserves a harvestable reservoir
while the champion collapses it for immediate points. It does not see the
other phases of the behavior:

- move 2 changes future geometry before a built-only harvest exists;
- move 6 adds useful built material without increasing the best harvest that
  is already available;
- move 11 creates a reusable mergeable tile without increasing the current
  maximum harvest;
- move 13 consumes the reservoir, so a post-move inventory measure falls to
  zero precisely when the player realizes its value; and
- move 9 increases the immediate built-only maximum even though the resulting
  path makes champion takeover three moves worse.

The result rules out **current maximum built-only harvest** as a sufficient
proxy for the broader build-preserve-harvest construct. It does not rule out
reservoir information as one component of a sequence-aware state valuation.

## Controls and identities

All controls passed:

- positive topology: `192` versus `0` after removing the required third tile;
- scale negative control: `192` after 32× scaling;
- isolated-mass control: unchanged at `192`;
- initial-value boundary: `0`; and
- real recording: clean replay, while a planted false tile claim was rejected.

Frozen identity manifest:
`docs/learning-cycles/LC-0002-built-reservoir-proxy-manifest.json`, artifact
identity `fe7c47bf58575281954b9bee5bc9facee8aeed98bf9082f19968debb0bea7167`.

Raw artifact:
`docs/learning-cycles/LC-0002-built-reservoir-proxy-raw.json`, internal
identity `741a7f76afc9fdb819f61bfb7ed4c1dce416a6b651730bb4c2c7e9da556a53f8`,
file SHA-256
`d686e8c6cbd9a26c7ec624d10b957f75ef8a1584464f79c4eb9b95c2dcdb2b8f`.

The contract is commit `6a78386`; the qualified harness is commit `696df81`;
the manifest-driven prevention is commit `792b5b4`; and the bound manifest is
commit `5e63c38`.

## Attempts

1. `LC-0002-qualification-attempt-1` stopped in preflight before any panel
   cell because the invocation supplied the wrong expected contract hash.
   `FR-0006` records the setup failure and the manifest-driven prevention.
2. The retained manifest-driven run collected all 15 cells, persisted the raw
   artifact before verdict, and returned `FAIL` with no integrity problem.

## Boundary and next step

The champion, engine, levels, targets, receipts, recordings, authoring system,
and RESULT-0057 artifacts were not modified. No new proxy is introduced here.

If work continues, the next contract should test a **sequence-aware value
change**, not another static inventory count: separately represent material
built, material preserved, value realized, and target distance across a short
bounded transition. That successor needs its own frozen definition and must
use this panel only for qualification, never confirmation.
