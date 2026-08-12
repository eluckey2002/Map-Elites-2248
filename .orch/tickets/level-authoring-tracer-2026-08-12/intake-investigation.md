---
id: intake-investigation
run: level-authoring-tracer-2026-08-12
status: complete
executor: orch-investigate
depends_on: []
write_scope: []
bound: 12 primary project files and four read-only commands
claimed_by: /root
claimed_at: 2026-08-12T14:45:02Z
---

## Objective

Identify the current seams, constraints, and stale assumptions that bound the first post-retune level-authoring delivery.

## Fixed inputs

- Repository `/Users/eluckey/Developer/research and games/2248-challenge` at Git revision `8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6`.
- Source policy: project instructions and current-status records first, then the existing authoring design, executable game/solver seams, tests, and Git state. Historical handoff prose is navigation only.
- Bound: `AGENTS.md`, `CURRENT.md`, `EVIDENCE_LEDGER.md`, the level-authoring design, `solver/game-tester.js`, `solver/sweep.js`, `solver/verify-loop.js`, `src/game.js`, `src/index.html`, three representative test files, and read-only baseline commands.

## Completion test

1. Findings cite the project files or command outputs that show them. Oracle: direct bounded source reads and exact command output; `oracle_class: evidence`; `provenance: pre-existing`.
2. Contradictions, dead ends, and uncovered scope are explicit. Oracle: presence scan of the Result sections; `oracle_class: deterministic`; `provenance: pre-existing`.

## Return fields

- `status`
- `result`
- `verification`
- cited findings
- contradictions
- dead ends
- gaps

## Result

Status: `complete`.

Result identity: this evidence packet at the repository revision named in Fixed inputs.

Cited findings:

- High confidence — active work is authoring new levels, and the milestone exits when levels can be generated, measured, and reviewed without hand-setting a target (`CURRENT.md:5-9`; `EVIDENCE_LEDGER.md:496-500`).
- High confidence — the shipped 50-level curve is currently healthy under the reference bot: `node solver/verify-loop.js` returned all seven checks `PASS`; `node --test solver/tests/*.test.js` returned 73 pass, 0 fail. The repository started clean at `8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6`.
- High confidence — the approved 2026-08-08 authoring design is not implementation-current. It assumes the old broken curve, a 30-50% acceptance band, and target/move derivation from a fixed 1.39x ceiling (`docs/superpowers/specs/2026-08-08-level-authoring-loop-design.md:3-24,52-84`). Current policy derives targets from measured achievable score and demand, keeps tile scales on powers of two, and accepts observed win rate as an outcome (`EVIDENCE_LEDGER.md:369-379`; `solver/game-tester.js:27-44,90-155`).
- High confidence — `solver/sweep.js` already accepts arbitrary level objects and exports `playLevel`/`sweepLevel`; no engine fork is needed (`solver/sweep.js:16-63`). `solver/game-tester.js` contains reusable-but-not-exported score measurement, quantile, target rounding, chapter scale, and demand logic (`solver/game-tester.js:90-106,157-219`).
- High confidence — the browser game only loads shipped numeric levels today. `Game.loadLevel` performs both lookup and initialization, and `?level=N` refuses values beyond the shipped array (`src/game.js:580-650,1038-1074`). A custom-level seam must separate arbitrary level initialization from shipped lookup while preserving normal level behavior.
- High confidence — the browser uses `Math.random` directly for initial fill and refill (`src/game.js:611-622,451-470`), so a replayable authoring recording needs an injected seeded RNG for candidate play without changing ordinary shipped play.
- High confidence — no candidate store, authoring server, custom-level entry point, or recordings path exists in the current authored file inventory. The app is static HTML/JS, so durable repository recordings require a small local authoring server or an explicitly different persistence contract.
- High confidence — the shipped `LEVELS` identity at intake is SHA-256 `162fff8123052a8eb5a3584172115844d6ea4675657b6005e1120cdad80e7cff` over `JSON.stringify(LEVELS)`; the tracer can modify `src/game.js` while deterministically proving that array unchanged.

Contradictions:

- The old design says target and moves are both mechanically derived and candidates must land at 30-50% wins with zero lockouts. Current accepted records say moves carry pacing and should not be spent to repair target cosmetics, while demand—not win rate—is the target input (`CURRENT.md:21-25`; `EVIDENCE_LEDGER.md:369-379`). The tracer therefore derives target and tile scale, treats moves as declared pacing input, records holdout win rate, and retains zero lockouts as the candidate fairness gate.
- `BL-0001` is marked `ready`, but `CURRENT.md` explicitly parks it with the Level 26 proof track. Planning state needs an append-only status correction before active delivery.

Dead ends:

- `HANDOFF.md` was consulted only to confirm it is a historical August 8 snapshot; its “correct next study” is superseded by the current ledger and did not govern this delivery.
- The sibling `second-game` directory has no project state/backlog surface relevant to this milestone.

Gaps left by the bound:

- Human fun, visual quality, and final acceptance of any candidate remain owner review; bot measurements cannot decide them.
- Chapter-6 demand is not an accepted permanent rule. A first level-51 demand may be a visibly provisional candidate input, but this delivery must not ship it into `LEVELS` or promote it into the evidence ledger.

## Verification

- Criterion 1: `PASS` — every finding above names its direct source or baseline command evidence; weakest class `evidence`.
- Criterion 2: `PASS` — contradictions, dead ends, and gaps are present as separate sections; class `deterministic`.

## Feedback

- The narrowest useful tracer is one generated candidate plus the complete measure-play-record seam; batching five accepted levels before this seam is reviewed would compound a stale design assumption.

## Risks

- Candidate calibration can overfit its fitting seeds. The delivery needs a disjoint holdout measurement in its receipt.
