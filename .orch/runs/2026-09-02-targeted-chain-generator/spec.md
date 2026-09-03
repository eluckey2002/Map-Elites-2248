# Targeted chain candidate generator

run_id: `2026-09-02-targeted-chain-generator`
status: `accepted`
routing_stamp: `orch-code-pack`
plan_gate: `false`

## Objective

Add one opt-in, bounded candidate-generation seam that searches strategically useful chain outcomes the production greedy pool misses. On the exact Level 52, seed 2000000 human-play corpus, it must materially increase action-equivalent coverage while reporting whether each search was complete or capped. The shipped `chooseMove` path and its defaults must remain unchanged.

## Acceptance

1. A durable fixture replays all four owner-played sessions from Level 52, seed 2000000 through the real engine transition seam and reproduces these exact outcomes: 119808/11, 120256/10, 113536/9, and 110464/9.
2. A deterministic coverage command compares the current production candidate pool with the challenger on all 39 recorded decision states. It reports exact and action-equivalent coverage, node counts, elapsed time, and complete/capped status. Action equivalence is the same surviving endpoint plus the same unordered set of removed board cells.
3. The challenger materially exceeds the observed production baseline of 4/39 action-equivalent human moves and recovers both named anchors when run on their exact real states: the 24-tile, sum-3456 opening action in the 10-move session and a legal sum-2048 action on the production bot's second decision state.
4. Search limits are caller supplied, deterministic, and fail closed: hitting a limit returns `complete: false` and never claims exhaustive coverage or optimality.
5. A controlled broken configuration passed through the same coverage seam fails the required coverage threshold or named-anchor requirement.
6. Existing Bot Vision parity proves the production chooser is unchanged on representative levels and exact Level 52 seed 2000000 behavior remains 109440/12. The focused test suite passes, and the broad suite introduces no new failure identity relative to the pre-existing five known failures.

Runnable checks:

- `node --test solver/tests/targetedChainGenerator.test.js`
- `node solver/targeted-chain-coverage.js --fixture solver/test-fixtures/level52-seed2000000-human-games.json`
- `node --test solver/tests/botVision.test.js`
- `node --test solver/tests/*.test.js`

Oracle provenance:

- Real transition/replay semantics: pre-existing `solver/engine.js` and `solver/recording-replay.js` at base commit `a71195a7355e5d055025cb36f1496d76687ff2ba`.
- Production-pool and chooser parity: pre-existing `solver/bot.js`, `solver/record-session.js`, and `solver/tests/botVision.test.js` at the same base commit.
- Corpus outcome identities: the four owner recordings listed under Evidence identities. The compact fixture is authored in this run and must be checked by replay through the pre-existing engine seam.
- Candidate coverage, bound reporting, and broken-twin assertions are authored in this run; the final review must inspect their real-subject wiring and exercise the controlled failure.

## Target repository and standards owner

- Repository: `/Users/eluckey/Developer/research and games/2248-challenge`
- Base identity: `a71195a7355e5d055025cb36f1496d76687ff2ba`
- Standards owner: repository `AGENTS.md`
- Delivery workspace: isolated Git worktree and branch; integration to `main` only after final verification and a fresh one-writer check.

## Evidence identities

The source recordings were replayed successfully before this spec was frozen. Their imported fixture must retain these source hashes:

- `60de027212d339ac199f8a258079137c18a5e6b48d1e2b483e5a617c22edaf13.json`: SHA-256 `53103b56d417538c99d41a4bf9dd1b035ace85beeb050b32228fb61a9c7feb19`
- `64eef93375ec2077d3b33be02ca8920da96ab0c837afd66c805d8069451bc3cc.json`: SHA-256 `b8fced33750b6209144f38fd52e6c8cb512ad7ebd7e160af675a7ba085c2e44f`
- `d39d6c0e7bf5630702d3559a86c2376676ad1e791129a50ea805828287a79ecd.json`: SHA-256 `e84a6dee44855db6a486894743b264117ed7b301b09de72702ee6dea7200aa6e`
- `f636dfe5d81c821a3e64d09015bd818191b06610021e63ec92e05a17007fb4ae.json`: SHA-256 `983f1ad4542f425fec02c91592d95ba6a4a6cac7053855a218d348e7da12d325`

The observed pre-change comparison is a baseline, not an admitted general claim: production generated 4/39 action-equivalent human moves and exactly reproduced 2/39 paths.

## Affected surfaces

- New targeted candidate-generator module under `solver/`.
- New deterministic coverage CLI under `solver/`.
- One compact human-game fixture under `solver/test-fixtures/`.
- Focused tests under `solver/tests/`.
- `solver/bot.js` may be read and invoked but must not be modified in this slice.

## Binding constraints

- Use actual board tiles, chain legality, execution, gravity, spawn, and production candidate-pool seams. A fixture-only predicate is not acceptance evidence.
- Keep candidate generation distinct from policy ranking and selection.
- Dedupe candidates by action identity, not merely length, score, or resulting value.
- Search useful lattice target sums and high-immediate-score/long-chain outcomes; do not hardcode the owner's conversational `8 or 10 or 12` observation as a game rule.
- Any cap produces an explicit incomplete verdict. Absence from a capped search is never evidence that no action exists.
- No generalized experiment claim is admitted without a separately preregistered protocol.
- Preserve all pre-existing root-checkout changes and untracked paths.
- One writer per Git tree.

## Non-goals

- Do not change the production chooser, default weights, level definitions, scoring, move limits, spawn rules, descriptors, MAP-Elites archive, or OpenEvolve integration.
- Do not promote the challenger into the shipped bot.
- Do not claim the returned pool is globally optimal unless a particular invocation completed an exhaustive search under an explicitly stated domain.
- Do not update `EVIDENCE_LEDGER.md` or `CURRENT.md` in this code slice; those require a separate append-only correction/admission decision.
- Do not run additional seeds or turn this into a generalized performance experiment.

## Assumptions and risks

- The four recordings are a useful behavioral corpus for candidate coverage, not a population estimate.
- Exact enumeration can grow exponentially. The design must expose limits and telemetry, and may return partial results.
- Matching a human action does not prove the policy should select it. Selection value remains a later experiment.
- Compacting raw recordings into a fixture can introduce transcription error; pre-existing engine replay plus exact outcome assertions is the required defense.
- A score-only dedupe can erase strategically different survivors; action identity is binding.

## Exemplars

- `solver/exact-score.js` at the base identity: real action identity and exhaustive traversal semantics.
- `solver/engine.js` at the base identity: chain legality and transition rules.
- `solver/chain-coverage-survey.js` at the base identity: explicit cap/incomplete reporting.
- `solver/record-session.js` and `solver/tests/botVision.test.js` at the base identity: deterministic real-state reconstruction and chooser parity.

## Delivery bound

One code-pack run, one implementation slice, one review-fix gate, and one final verification. Stop rather than broadening into policy tuning, descriptor work, or a general experiment. One correction pass is allowed if the acceptance checks expose a defect; a larger redesign returns as uncovered remainder.
