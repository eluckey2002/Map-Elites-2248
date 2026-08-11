# Spec: compact-signature experiment runner

- **run:** `bl0001-compact-signature-code-2026-08-11`
- **objective:** A deterministic, tested runner can exhaustively compare declared compact state signatures against exact future maxima over a frozen reduced-board corpus and emit a self-identifying machine-readable receipt for independent re-verification.
- **routing:**
  - **pack:** `orch-code-pack`

## Non-goals

- Running or interpreting the full frozen experiment as a research conclusion.
- Searching the 5x8 Level 26 horizon, changing solver policy, or selecting a proof formulation.
- Claiming that a signature surviving the bounded corpus is exact, safe, or useful on larger boards.
- Updating `CURRENT.md`, backlog status, experiment prose, or the evidence ledger.
- Generalizing a universal experiment framework before this first experiment has run.

## Acceptance

1. The frozen scenario manifest declares its schema version, experiment ID, shipped-rule parameters, deterministic refill stream, exhaustive board alphabets/shapes, horizons, prefix depth, signature definitions, exact comparison metric, resource caps, and fixed source identities.
   - **runnable check:** `node solver/compact-signature/cli.js --validate docs/experiments/EXP-0001-compact-state-signature/scenario.json`; expect exit 0 and a JSON `VALID` result bound to the manifest hash; **oracle_class:** deterministic.
2. The runner exhaustively generates each declared starting board and physical prefix action, deduplicates exact successor boards without merging distinct futures, computes the exact remaining maximum under the frozen cursor/stream, groups successors by each declared signature, and reports collision counts plus the smallest reproducible counterexample.
   - **runnable check:** `node --test solver/compact-signature/compact-signature.test.js`; expect tests for enumeration counts, exact outcome divergence, deterministic ordering, and counterexample replay to pass; **oracle_class:** deterministic.
3. The baseline signature and the survivor/action-class extensions have explicit, searchable definitions whose fields are serialized canonically; malformed manifests, exhausted spawn streams, exact-node caps, and incomplete fixture results fail closed rather than appearing collision-free.
   - **runnable check:** `node --test solver/compact-signature/compact-signature.test.js`; expect negative controls for omitted fields, invalid signature names, spawn exhaustion, and node-cap failure to pass; **oracle_class:** deterministic.
4. A separate verifier can recompute the frozen run from the manifest and reject a tampered collision count, counterexample, input identity, or incomplete result.
   - **runnable check:** `node solver/compact-signature/cli.js --fixture && node --test solver/compact-signature/compact-signature.test.js`; expect fixture `PASS` and tamper controls to pass; **oracle_class:** deterministic.
5. Existing solver behavior remains green and the new module does not alter `solver/engine.js`, `solver/exact-score.js`, product code, or prior frozen receipts.
   - **runnable check:** `node --test solver/tests/*.test.js solver/physical-branch-bound/*.test.js solver/compact-signature/*.test.js`; expect zero failures; compare protected hashes named below; **oracle_class:** deterministic.
6. The code follows the existing solver's explicit CommonJS/module-export style, keeps one concept per named helper, and exposes only the runner/verifier seams required by tests and CLI use.
   - **oracle:** code-pack shape lens against the standards owner and craft reference, fresh at the gate; **oracle_class:** judged.

## Binding constraints

- Use the shipped legality, scoring, cloning, gravity, physical action enumeration, frozen transitions, and exact small-position solver through existing exported interfaces; do not fork game rules.
- Preserve `solver/engine.js` at SHA-256 `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b` and `solver/exact-score.js` at `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`.
- Preserve `EVIDENCE_LEDGER.md` at `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2` and `HANDOFF.md` at `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- The fixture corpus uses reduced boards only as diagnostics but retains Level 26's minimum chain four, blocker-free rule, equal-or-double extension, shipped scoring/multipliers, sum survivor, gravity, and column-major deterministic refills.
- A resource cap or exception yields an explicit incomplete/failure result and nonzero exit; it never yields zero collisions.
- Canonical ordering must make manifest and result identities repeatable across runs.
- Preserve every pre-existing dirty path outside the exact affected surfaces.
- Use `apply_patch` for edits; do not commit or publish.

## Evidence

- `.orch/tickets/bl0001-compact-signature-2026-08-11/intake-investigation.md` SHA-256 `60beb9498bb300772ac48472caf7f85bed3acd73a6b8718f3ce7af21413a99e2`.
- `docs/backlog/BL-0001-test-compact-state-signature.md` SHA-256 `439c75dff6ec4e897dd6b41e805cb7a5b9c5746bf6667a868c4fcf5dcaf0b04b`.
- `EVIDENCE_LEDGER.md` SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, especially `HYPOTHESIS-0001` and the proof-class rules.
- Existing exact seams in `solver/engine.js`, `solver/exact-score.js`, `solver/tests/exact-score.test.js`, and `solver/physical-branch-bound/branch-bound.test.js` at their intake identities.
- Intake oracle: 52 focused tests passed; reduced-corpus probes recorded exact size and preliminary collision observations in the completed investigation ticket.

## Affected surfaces

- `solver/compact-signature/index.js`
- `solver/compact-signature/cli.js`
- `solver/compact-signature/verify.js`
- `solver/compact-signature/compact-signature.test.js`
- `docs/experiments/EXP-0001-compact-state-signature/scenario.json`
- Run bookkeeping under `.orch/runs/bl0001-compact-signature-code-2026-08-11/`
- Ticket bookkeeping under `.orch/tickets/bl0001-compact-signature-code-2026-08-11/`

## Exemplars

- `solver/exact-score.js` at SHA-256 `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`: imitate explicit CommonJS exports, deterministic canonical keys, fail-closed caps, exact small-fixture scope, and separate replay/verification seams.
- `solver/target-witness-search/` at the intake tree identity: imitate the separation of `index.js`, `cli.js`, `verify.js`, tests, and a later frozen receipt; do not imitate its heuristic search semantics.
- `solver/tests/exact-score.test.js` at SHA-256 `f2880e9dba4096ca283d00d6580aee5a0d675234ca4756ef696fab5c3ab93d3b`: imitate small hand-checkable fixtures and negative controls.

## Target repository

- `/Users/eluckey/Developer/research and games/2248-challenge` at Git `main` / `10a849d5336bdda89d2d3f5ed1f1ca87e536811d`, with the complete pre-existing dirty boundary recorded in the intake investigation and prior worklogs.
- Because the exact-search seams are currently untracked relative to Git `HEAD`, this run uses exclusive path-scoped writes in the live checkout and fixed hashes rather than a branch that would omit its required evidence. This workspace exception must be recorded as friction and independently scope-checked at the gate.

## Standards owner

- `solver/README.md` at SHA-256 `d01ee5063fd9f2227bb42276712ce63c0c72a5969df53ae7fea3d2d403df2fff` owns solver layout, CommonJS conventions, deterministic commands, exact-versus-heuristic language, and fail-closed proof semantics. Its historical feasibility prose is not evidence for this experiment; the evidence ledger controls proof standing.

## Acceptance as runnable checks

```sh
node solver/compact-signature/cli.js --validate docs/experiments/EXP-0001-compact-state-signature/scenario.json
node solver/compact-signature/cli.js --fixture
node --test solver/compact-signature/compact-signature.test.js
node --test solver/tests/*.test.js solver/physical-branch-bound/*.test.js solver/compact-signature/*.test.js
shasum -a 256 solver/engine.js solver/exact-score.js EVIDENCE_LEDGER.md HANDOFF.md
git diff --check -- solver/compact-signature docs/experiments/EXP-0001-compact-state-signature/scenario.json
```

## Bound

- **effort:** one code delivery with a small tested module, one frozen JSON scenario, one independent code gate, and one final verification; the full scenario run belongs to the successor research step.
- **runtime:** fixture and focused tests must each complete within 30 seconds; full regression within 120 seconds.
- **plan_gate:** false; the owner approved execution of the prioritized slice.

## Risks

- Immediate-action classes can look complete on a one-move remainder by construction; the manifest must include a longer remainder.
- Exhaustive all-board enumeration can grow rapidly; declared cell counts, alphabets, and exact-node caps must remain explicit.
- A last-survivor feature is meaningful only if it records the survivor after gravity, not merely the chain's original endpoint.
- Pre-existing untracked solver evidence makes Git isolation incomplete; path-scoped hashes and a fresh independent gate must detect collateral edits.

## Assumptions

- The 1x5 three-move corpus is retained as a hand-auditable counterexample fixture.
- The 2x3 three-move corpus is the largest initial frozen experiment target; if it exceeds its declared cap, the result is explicitly incomplete and the research conclusion is `INCONCLUSIVE` for that fixture.
- Exact remaining maximum is a sufficient decision-relevant outcome for detecting a lossy signature collision, although it does not enumerate every reachable future score.
