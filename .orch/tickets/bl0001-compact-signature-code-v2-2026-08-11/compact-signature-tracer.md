---
id: compact-signature-tracer
run: bl0001-compact-signature-code-v2-2026-08-11
status: claimed
executor: orch-tdd
pack: orch-code-pack
independence: gate
depends_on: []
workspace: /private/tmp/bl0001-compact-signature.GRVRPr
baseline: 831cf3cf070ef261b0a20478e5175a7f442313a3
write_scope:
  - solver/compact-signature/index.js
  - solver/compact-signature/cli.js
  - solver/compact-signature/verify.js
  - solver/compact-signature/compact-signature.test.js
  - docs/experiments/EXP-0001-compact-state-signature/scenario.json
excluded_actions:
  - user interaction
  - any isolated-workspace content edit outside write_scope
  - any mutation or integration in the live project checkout
  - recreating, deleting, or reinitializing the isolated workspace
  - running or interpreting the full experiment as a research conclusion
  - publishing or pushing any revision
bound: 120m
claimed_by: /root/orch_worker_gpt_5_6_sol_high_5
claimed_at: 2026-08-11T10:08:31Z
reply_to: main
---

## Objective

At a clean committed revision descended from the fixed isolated baseline, a deterministic tested compact-signature tracer validates the frozen scenario, exhaustively computes exact successor futures, emits a canonical self-identifying fixture receipt, and independently rejects tampered or incomplete results across exactly the five authorized content paths.

## Fixed inputs

- Frozen spec: `.orch/runs/bl0001-compact-signature-code-v2-2026-08-11/spec.md` at SHA-256 `8e74ab334054aa2325f0b0ebcde7fcf17dc1570c77ed9c382dc8128e98ccc809`.
- Pack: `orch-code-pack` at `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/SKILL.md`.
- Executor: `orch-tdd` at `/Users/eluckey/.orchflows/lib/skills/instances/orch-tdd/SKILL.md`.
- Craft reference: `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md`.
- Oracle policy: `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/oracles.md`.
- Standards owner: `/private/tmp/bl0001-compact-signature.GRVRPr/solver/README.md` at SHA-256 `d01ee5063fd9f2227bb42276712ce63c0c72a5969df53ae7fea3d2d403df2fff`.

Target repository, verbatim from the frozen spec:

- Delivery workspace: `/private/tmp/bl0001-compact-signature.GRVRPr` at clean Git commit `831cf3cf070ef261b0a20478e5175a7f442313a3`.
- Integration target: `/Users/eluckey/Developer/research and games/2248-challenge` at Git `main` / `10a849d5336bdda89d2d3f5ed1f1ca87e536811d`, with pre-existing dirty state preserved and integration limited to the five authorized paths.

Binding constraints, verbatim from the frozen spec:

- Use existing exported legality, scoring, cloning, gravity, physical enumeration, frozen transition, and exact-position interfaces; do not fork shipped rules.
- Preserve `solver/engine.js` `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b`, `solver/exact-score.js` `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`, ledger `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, and handoff `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- Reduced fixtures retain Level 26's minimum-chain four, blocker-free rule, equal-or-double extension, scoring/multipliers, sum survivor, gravity, and column-major frozen refills. They are diagnostics, not Level 26 proofs.
- Resource exhaustion or an exception returns explicit incomplete failure and nonzero exit; it never becomes zero collisions.
- Canonical ordering must make manifest, result, and counterexample identities repeatable.
- `orch-tdd` works only in the isolated snapshot, begins from its clean baseline commit, writes tests before implementation, and commits every green slice there.
- No commit is created in the live project checkout. After the isolated gate passes, the parent integrates only the authorized path diff with `apply_patch`, then reruns all acceptance checks in the live checkout.
- Preserve all pre-existing live-checkout dirty work. Do not commit or publish the target checkout.

The isolated Git metadata changes made solely by the required per-slice commits are workspace bookkeeping authorized by the frozen spec; they do not widen the five-path content `write_scope`. The executor must not integrate or edit the live checkout.

Evidence identities, verbatim from the frozen spec:

- Completed intake `.orch/tickets/bl0001-compact-signature-2026-08-11/intake-investigation.md` SHA-256 `60beb9498bb300772ac48472caf7f85bed3acd73a6b8718f3ce7af21413a99e2`.
- Rejected pre-execution attempt `.orch/runs/bl0001-compact-signature-code-2026-08-11/worklog.md`; it establishes the workspace-contract correction and produced no deliverable change.
- BL-0001 SHA-256 `439c75dff6ec4e897dd6b41e805cb7a5b9c5746bf6667a868c4fcf5dcaf0b04b` and ledger SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`.
- Isolated snapshot `/private/tmp/bl0001-compact-signature.GRVRPr` at clean baseline commit `831cf3cf070ef261b0a20478e5175a7f442313a3`, created from the live working tree while excluding `.git`, `.orch`, `.codex`, and `node_modules`; protected hashes match the live fixed inputs.
- Intake test oracle: 52 focused tests passed; bounded corpus sizing and preliminary collisions are recorded in the completed investigation.

Exemplars, verbatim from the frozen spec:

- `solver/exact-score.js` at the fixed hash: imitate explicit CommonJS exports, canonical state keys, fail-closed caps, and exact-small-fixture scope.
- `solver/target-witness-search/` at isolated baseline `831cf3cf070ef261b0a20478e5175a7f442313a3`: imitate separated index/CLI/verifier/tests/receipt seams, not heuristic semantics.
- `solver/tests/exact-score.test.js` `f2880e9dba4096ca283d00d6580aee5a0d675234ca4756ef696fab5c3ab93d3b`: imitate hand-checkable fixtures and negative controls.

Non-goals, verbatim from the frozen spec:

- Executing or interpreting the full experiment as a research conclusion.
- Searching full Level 26, changing solver policy, or selecting a proof formulation.
- Claiming that bounded collision absence proves a signature exact or safe.
- Updating project status, experiment prose, or the evidence ledger.
- Building a universal experiment framework before this first run provides evidence for it.

Run-bound inheritance, verbatim from the frozen spec:

- **effort:** one tracer ticket, one independent code gate, one correction pass at most, and one final verification.
- **runtime:** fixture/focused checks each under 30 seconds; full regression under 120 seconds; full experiment execution remains the research step.
- **plan_gate:** false.

Code-pack runnable checks, verbatim from the frozen spec:

```sh
node solver/compact-signature/cli.js --validate docs/experiments/EXP-0001-compact-state-signature/scenario.json
node solver/compact-signature/cli.js --fixture
node --test solver/compact-signature/compact-signature.test.js
node --test solver/tests/*.test.js solver/physical-branch-bound/*.test.js solver/compact-signature/*.test.js
shasum -a 256 solver/engine.js solver/exact-score.js EVIDENCE_LEDGER.md HANDOFF.md
git diff --check 831cf3cf070ef261b0a20478e5175a7f442313a3..HEAD
```

After parent-controlled integration, the parent reruns the same Node/hash checks in the live checkout plus this frozen command:

```sh
git diff --check -- solver/compact-signature docs/experiments/EXP-0001-compact-state-signature/scenario.json
```

Acceptance criterion 6 is gate-owned: the downstream code gate renders the code-pack shape lens fresh against the frozen spec, standards owner, and craft reference. The live integration and final acceptance verification remain parent-owned and occur only after the isolated gate passes.

## Completion test

1. **AC-1 — frozen manifest validation.** In `/private/tmp/bl0001-compact-signature.GRVRPr`, run `node solver/compact-signature/cli.js --validate docs/experiments/EXP-0001-compact-state-signature/scenario.json`; require exit 0 and JSON `VALID` bound to the manifest hash, with the declared schema, experiment, retained-rule, refill, board-space, horizon, prefix, signature, metric, source-identity, and cap fields. Oracle: the exact command and output. `oracle_class: deterministic`; `provenance: pre-existing`.
2. **AC-2 — exact end-to-end collision analysis.** Run `node --test solver/compact-signature/compact-signature.test.js`; require passing enumeration-count, distinct-successor, exact-future-divergence, deterministic-ordering, collision-count, and smallest-counterexample replay tests over every declared board and prefix action. Oracle: the exact focused-test command and named test results. `oracle_class: deterministic`; `provenance: pre-existing`.
3. **AC-3 — canonical definitions and fail-closed controls.** Run `node --test solver/compact-signature/compact-signature.test.js`; require passing canonical searchable definitions for baseline, survivor, immediate-action-class, and combined signatures, plus named controls for omitted fields, invalid signatures, spawn exhaustion, exact-node exhaustion, and incomplete results. Oracle: the exact focused-test command and named test results. `oracle_class: deterministic`; `provenance: pre-existing`.
4. **AC-4 — independent recomputation and tamper rejection.** Run `node solver/compact-signature/cli.js --fixture && node --test solver/compact-signature/compact-signature.test.js`; require fixture `PASS` and controls rejecting tampered identities, completion state, counts, and counterexamples. Oracle: the exact compound command and output. `oracle_class: deterministic`; `provenance: pre-existing`.
5. **AC-5a — isolated regression.** Run `node --test solver/tests/*.test.js solver/physical-branch-bound/*.test.js solver/compact-signature/*.test.js`; require zero failures and compare any failure by identity, not count, against the recorded clean baseline. Oracle: the exact full-suite command and output. `oracle_class: deterministic`; `provenance: pre-existing`.
6. **AC-5b — protected identities.** Run `shasum -a 256 solver/engine.js solver/exact-score.js EVIDENCE_LEDGER.md HANDOFF.md`; require, respectively, `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b`, `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`, `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, and `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`. Oracle: the exact hash command and output. `oracle_class: deterministic`; `provenance: pre-existing`.
7. **AC-5c — isolated revision shape.** Run `git diff --check 831cf3cf070ef261b0a20478e5175a7f442313a3..HEAD`; require exit 0 with no whitespace errors. Run `git diff --name-only 831cf3cf070ef261b0a20478e5175a7f442313a3..HEAD`; require exactly the five paths in `write_scope` and no others. Oracle: the exact Git commands and outputs. `oracle_class: deterministic`; `provenance: pre-existing`.
8. **AC-5d — committed TDD result.** Run `git merge-base --is-ancestor 831cf3cf070ef261b0a20478e5175a7f442313a3 HEAD`, `git status --short`, and `git log --format='%H %s' 831cf3cf070ef261b0a20478e5175a7f442313a3..HEAD`; require an ancestor result, empty status, and a committed green revision for every recorded red-green slice. Oracle: the exact Git commands, the slice-to-commit mapping, and their outputs. `oracle_class: deterministic`; `provenance: pre-existing`.

## Return fields

- `changed_artifacts`: exactly the five authorized content paths, each with its result SHA-256 identity.
- `baseline_revision`: `831cf3cf070ef261b0a20478e5175a7f442313a3`.
- `result_revision`: the clean isolated Git result revision descended from the baseline.
- `slice_commits`: ordered commit identities, each mapped to its red check, green check, and content paths.
- `completion_test_verdicts`: one entry per criterion with `verdict`, exact `oracle`, `oracle_class`, `evidence`, and `covers`.
- `protected_hashes`: the four observed protected identities from AC-5b.
- `integration_manifest`: baseline/result hashes for exactly the five paths the parent may integrate; no live-checkout mutation.
- `feedback`: bounded observations or `[]`.
- `risks`: remaining risks or `[]`.

## Result

Pending execution.

## Verification

Pending execution.

## Feedback

[]

## Risks

[]
