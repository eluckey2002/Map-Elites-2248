# Worklog: 2026-09-02-targeted-chain-generator

## Goal (frozen)

Add one opt-in, bounded candidate-generation seam that searches strategically useful chain outcomes the production greedy pool misses. On the exact Level 52, seed 2000000 human-play corpus, it must materially increase action-equivalent coverage while reporting whether each search was complete or capped. The shipped `chooseMove` path and its defaults must remain unchanged.

Acceptance:

1. A durable fixture replays all four owner-played sessions from Level 52, seed 2000000 through the real engine transition seam and reproduces these exact outcomes: 119808/11, 120256/10, 113536/9, and 110464/9.
2. A deterministic coverage command compares the current production candidate pool with the challenger on all 39 recorded decision states. It reports exact and action-equivalent coverage, node counts, elapsed time, and complete/capped status.
3. The challenger materially exceeds the observed production baseline of 4/39 action-equivalent human moves and recovers the named 24-tile sum-3456 human opener and a legal sum-2048 action on the production bot's second decision state.
4. Search limits are caller supplied, deterministic, and fail closed.
5. A controlled broken configuration fails through the same coverage seam.
6. Existing Bot Vision parity remains green and the broad suite gains no new failure identity.

## State

- spec: `.orch/runs/2026-09-02-targeted-chain-generator/spec.md`
- tickets: `.orch/tickets/2026-09-02-targeted-chain-generator/`
- terminal: `complete` — final deterministic gate PASS at corrected revision `dd4eb573e93c068e537fb6229459c905da32da5f`; focused 8/8, coverage PASS, Bot Vision 5/5, broad suite no new failure identity

## Iterations

### 1. Workspace and decomposition

- workspace: `/private/tmp/2248-targeted-chain-generator.IGq5PQ`
- branch: `codex/targeted-chain-generator`
- provenance: `a71195a7355e5d055025cb36f1496d76687ff2ba`
- baseline oracle: `node --test solver/tests/botVision.test.js`
- baseline verdict: PASS, 5/5 tests
- decomposition: one end-to-end tracer ticket, `TCG-001`; no dependency edges; no uncovered acceptance criteria
- budget spent: workspace/spec/decomposition only

### 2. Implementation and gate

- producer revisions: `c5864b7`, `dc39d65`, `e5a9a6c`, verification record `0ba3304`
- result: production candidate coverage `2/39` exact and `4/39` action-equivalent; challenger `5/39` exact and `20/39` action-equivalent; both frozen anchors recovered
- review verdict at `0ba3304`: CHANGES REQUIRED for fail-open malformed CLI limits and imprecise per-search cap reporting
- correction revision: `dd4eb573e93c068e537fb6229459c905da32da5f`
- correction verdict: both accepted defects fixed in the one allowed pass
- budget spent: one producer lane, one review gate, one correction pass

### 3. Final verification

- `node --test solver/tests/targetedChainGenerator.test.js`: PASS, 8/8
- coverage CLI: PASS; 39 identified search records, 25 complete and 14 capped; `maxNodes` on 14 and actual outward `candidateLimit` on 2
- controlled broken configurations: FAIL through the same acceptance seam
- `node --test solver/tests/botVision.test.js`: PASS, 5/5; production Level 52 remains `109440/12`
- `node --test solver/tests/*.test.js`: 305/310; only the same three stale-receipt and two durable-state failure identities
- `git diff --check`: PASS
- overall: PASS, deterministic; capability only, no policy promotion or generalized experiment claim

## Blame classes

[]

## Failed approaches

[]

## Queued scope

- Production policy selection or promotion of challenger candidates.
- Descriptor, MAP-Elites, or OpenEvolve changes.
- Append-only corrections to stale pressure claims in `EVIDENCE_LEDGER.md` and `CURRENT.md`.
- Held-back owner result created after the spec froze: recording `878567e51193bf84474e7a0da6799c83ea960cd2e4810e21ff8a2d788af4109e.json`, SHA-256 `6b7af809bca8dae8dab5c9827dd2bba53eab2ef6dffc4ca8c5ff0d9dd094ed4b`, replay PASS at `122688/8`. Use as an out-of-sample candidate-visibility challenge; do not fold it into the frozen 39-state corpus.
- Owner-reported Bot Vision learning outcome: the trace informed the strategy behind the replay-verified 8-move result. Preserve as owner attribution until a separately designed human-learning claim is warranted.
