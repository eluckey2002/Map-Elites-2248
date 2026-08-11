# Spec: compact-signature experiment runner v2

- **run:** `bl0001-compact-signature-code-v2-2026-08-11`
- **objective:** A deterministic, tested runner can exhaustively compare declared compact state signatures against exact future maxima over a frozen reduced-board corpus and emit a self-identifying machine-readable receipt for independent re-verification.
- **routing:**
  - **pack:** `orch-code-pack`

## Non-goals

- Executing or interpreting the full experiment as a research conclusion.
- Searching full Level 26, changing solver policy, or selecting a proof formulation.
- Claiming that bounded collision absence proves a signature exact or safe.
- Updating project status, experiment prose, or the evidence ledger.
- Building a universal experiment framework before this first run provides evidence for it.

## Acceptance

1. A machine-readable scenario declares schema version, experiment ID, retained shipped rules, deterministic refills, exhaustive board spaces, horizons, prefix depth, signature definitions, exact comparison metric, source identities, and fail-closed resource caps.
   - **runnable check:** `node solver/compact-signature/cli.js --validate docs/experiments/EXP-0001-compact-state-signature/scenario.json`; require exit 0 and JSON `VALID` bound to the manifest hash; **oracle_class:** deterministic.
2. The runner exhaustively enumerates declared boards and prefix actions, retains distinct exact successor boards, computes exact remaining maxima from the frozen cursor/stream, groups by every signature, and reports collision counts and deterministic smallest counterexamples.
   - **runnable check:** `node --test solver/compact-signature/compact-signature.test.js`; require enumeration-count, future-divergence, ordering, and counterexample-replay tests to pass; **oracle_class:** deterministic.
3. Baseline, survivor, immediate-action-class, and combined signatures have canonical searchable definitions; omitted fields, invalid signatures, spawn exhaustion, exact-node exhaustion, and incomplete results fail closed.
   - **runnable check:** `node --test solver/compact-signature/compact-signature.test.js`; require named manifest/signature and failure-path controls to pass; **oracle_class:** deterministic.
4. A separate verifier recomputes the frozen fixture and rejects tampered identities, completion state, counts, or counterexamples.
   - **runnable check:** `node solver/compact-signature/cli.js --fixture && node --test solver/compact-signature/compact-signature.test.js`; require fixture `PASS` and all tamper controls to pass; **oracle_class:** deterministic.
5. Existing solver behavior remains green; protected solver/evidence identities remain fixed; the isolated result integrates into the live checkout as exactly the five authorized paths with no collateral change.
   - **runnable checks:** `node --test solver/tests/*.test.js solver/physical-branch-bound/*.test.js solver/compact-signature/*.test.js`; protected `shasum -a 256`; isolated `git diff --check`; live post-integration path/hash and test checks; **oracle_class:** deterministic.
6. The implementation follows the existing solver's explicit CommonJS and module-seam idiom with no forked game rules or unnecessary abstraction.
   - **oracle:** fresh code-pack lens judgment against the standards owner and craft reference; **oracle_class:** judged.

## Binding constraints

- Use existing exported legality, scoring, cloning, gravity, physical enumeration, frozen transition, and exact-position interfaces; do not fork shipped rules.
- Preserve `solver/engine.js` `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b`, `solver/exact-score.js` `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`, ledger `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, and handoff `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- Reduced fixtures retain Level 26's minimum-chain four, blocker-free rule, equal-or-double extension, scoring/multipliers, sum survivor, gravity, and column-major frozen refills. They are diagnostics, not Level 26 proofs.
- Resource exhaustion or an exception returns explicit incomplete failure and nonzero exit; it never becomes zero collisions.
- Canonical ordering must make manifest, result, and counterexample identities repeatable.
- `orch-tdd` works only in the isolated snapshot, begins from its clean baseline commit, writes tests before implementation, and commits every green slice there.
- No commit is created in the live project checkout. After the isolated gate passes, the parent integrates only the authorized path diff with `apply_patch`, then reruns all acceptance checks in the live checkout.
- Preserve all pre-existing live-checkout dirty work. Do not commit or publish the target checkout.

## Evidence

- Completed intake `.orch/tickets/bl0001-compact-signature-2026-08-11/intake-investigation.md` SHA-256 `60beb9498bb300772ac48472caf7f85bed3acd73a6b8718f3ce7af21413a99e2`.
- Rejected pre-execution attempt `.orch/runs/bl0001-compact-signature-code-2026-08-11/worklog.md`; it establishes the workspace-contract correction and produced no deliverable change.
- BL-0001 SHA-256 `439c75dff6ec4e897dd6b41e805cb7a5b9c5746bf6667a868c4fcf5dcaf0b04b` and ledger SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`.
- Isolated snapshot `/private/tmp/bl0001-compact-signature.GRVRPr` at clean baseline commit `831cf3cf070ef261b0a20478e5175a7f442313a3`, created from the live working tree while excluding `.git`, `.orch`, `.codex`, and `node_modules`; protected hashes match the live fixed inputs.
- Intake test oracle: 52 focused tests passed; bounded corpus sizing and preliminary collisions are recorded in the completed investigation.

## Affected surfaces

- `solver/compact-signature/index.js`
- `solver/compact-signature/cli.js`
- `solver/compact-signature/verify.js`
- `solver/compact-signature/compact-signature.test.js`
- `docs/experiments/EXP-0001-compact-state-signature/scenario.json`
- Isolated Git history under `/private/tmp/bl0001-compact-signature.GRVRPr/.git/`
- Run bookkeeping under `.orch/runs/bl0001-compact-signature-code-v2-2026-08-11/`
- Ticket bookkeeping under `.orch/tickets/bl0001-compact-signature-code-v2-2026-08-11/`

## Exemplars

- `solver/exact-score.js` at the fixed hash: imitate explicit CommonJS exports, canonical state keys, fail-closed caps, and exact-small-fixture scope.
- `solver/target-witness-search/` at isolated baseline `831cf3cf070ef261b0a20478e5175a7f442313a3`: imitate separated index/CLI/verifier/tests/receipt seams, not heuristic semantics.
- `solver/tests/exact-score.test.js` `f2880e9dba4096ca283d00d6580aee5a0d675234ca4756ef696fab5c3ab93d3b`: imitate hand-checkable fixtures and negative controls.

## Target repository

- Delivery workspace: `/private/tmp/bl0001-compact-signature.GRVRPr` at clean Git commit `831cf3cf070ef261b0a20478e5175a7f442313a3`.
- Integration target: `/Users/eluckey/Developer/research and games/2248-challenge` at Git `main` / `10a849d5336bdda89d2d3f5ed1f1ca87e536811d`, with pre-existing dirty state preserved and integration limited to the five authorized paths.

## Standards owner

- `/private/tmp/bl0001-compact-signature.GRVRPr/solver/README.md` at SHA-256 `d01ee5063fd9f2227bb42276712ce63c0c72a5969df53ae7fea3d2d403df2fff` owns solver layout, CommonJS conventions, deterministic commands, and exact-versus-heuristic language. Its historical feasibility prose is not experiment evidence.

## Acceptance as runnable checks

```sh
node solver/compact-signature/cli.js --validate docs/experiments/EXP-0001-compact-state-signature/scenario.json
node solver/compact-signature/cli.js --fixture
node --test solver/compact-signature/compact-signature.test.js
node --test solver/tests/*.test.js solver/physical-branch-bound/*.test.js solver/compact-signature/*.test.js
shasum -a 256 solver/engine.js solver/exact-score.js EVIDENCE_LEDGER.md HANDOFF.md
git diff --check 831cf3cf070ef261b0a20478e5175a7f442313a3..HEAD
```

After integration, rerun the same Node/hash checks in the live checkout plus:

```sh
git diff --check -- solver/compact-signature docs/experiments/EXP-0001-compact-state-signature/scenario.json
```

## Bound

- **effort:** one tracer ticket, one independent code gate, one correction pass at most, and one final verification.
- **runtime:** fixture/focused checks each under 30 seconds; full regression under 120 seconds; full experiment execution remains the research step.
- **plan_gate:** false.

## Risks

- An immediate-action summary is tautologically strong with one move left; at least one declared fixture must retain two moves after the prefix.
- Exhaustive board spaces can grow rapidly; every size, alphabet, and node cap must be manifest-bound.
- Survivor metadata must identify its post-gravity coordinate and value.
- The isolated snapshot contains a broad temporary baseline solely to preserve untracked dependencies; only the five authorized path diffs may cross back.

## Assumptions

- 1x5 at three moves is a hand-auditable collision fixture.
- 2x3 at three moves is the largest first experiment; exceeding a declared cap yields incomplete/`INCONCLUSIVE` for that fixture.
- Exact remaining maximum is sufficient to detect a decision-relevant lossy collision but does not enumerate every future score.
