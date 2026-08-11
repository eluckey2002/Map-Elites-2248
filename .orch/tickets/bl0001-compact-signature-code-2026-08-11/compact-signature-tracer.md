---
id: compact-signature-tracer
run: bl0001-compact-signature-code-2026-08-11
status: failed
executor: orch-tdd
pack: orch-code-pack
independence: gate
depends_on: []
write_scope:
  - solver/compact-signature/index.js
  - solver/compact-signature/cli.js
  - solver/compact-signature/verify.js
  - solver/compact-signature/compact-signature.test.js
  - docs/experiments/EXP-0001-compact-state-signature/scenario.json
excluded_actions:
  - user interaction
  - git commits or publication
  - running or interpreting the full frozen experiment as a research conclusion
  - edits outside the declared write_scope
bound: 120m
claimed_by: null
claimed_at: null
reply_to: main
---

## Objective

A deterministic, tested compact-signature tracer validates the frozen reduced-board scenario, exhaustively computes exact successor futures, emits a canonical self-identifying fixture receipt, and independently rejects tampered or incomplete results without changing protected solver or project evidence.

## Fixed inputs

- Frozen spec: `.orch/runs/bl0001-compact-signature-code-2026-08-11/spec.md` at SHA-256 `7439b8b35e68f303ec5d2d7bd0d76f18469488d9d2d3e22e1d5a18b28377c986`.
- Pack: `orch-code-pack` at `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/SKILL.md`.
- Executor: `orch-tdd` at `/Users/eluckey/.orchflows/lib/skills/instances/orch-tdd/SKILL.md`.
- Standards owner: `solver/README.md` at SHA-256 `d01ee5063fd9f2227bb42276712ce63c0c72a5969df53ae7fea3d2d403df2fff`.
- Craft reference: `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md`.
- Oracle policy: `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/oracles.md`.

Run-bound inheritance, verbatim from the frozen spec:

- **effort:** one code delivery with a small tested module, one frozen JSON scenario, one independent code gate, and one final verification; the full scenario run belongs to the successor research step.
- **runtime:** fixture and focused tests must each complete within 30 seconds; full regression within 120 seconds.
- **plan_gate:** false; the owner approved execution of the prioritized slice.

Target repository and live-checkout workspace exception, verbatim from the frozen spec:

- `/Users/eluckey/Developer/research and games/2248-challenge` at Git `main` / `10a849d5336bdda89d2d3f5ed1f1ca87e536811d`, with the complete pre-existing dirty boundary recorded in the intake investigation and prior worklogs.
- Because the exact-search seams are currently untracked relative to Git `HEAD`, this run uses exclusive path-scoped writes in the live checkout and fixed hashes rather than a branch that would omit its required evidence. This workspace exception must be recorded as friction and independently scope-checked at the gate.

Binding constraints, verbatim from the frozen spec:

- Use the shipped legality, scoring, cloning, gravity, physical action enumeration, frozen transitions, and exact small-position solver through existing exported interfaces; do not fork game rules.
- Preserve `solver/engine.js` at SHA-256 `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b` and `solver/exact-score.js` at `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`.
- Preserve `EVIDENCE_LEDGER.md` at `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2` and `HANDOFF.md` at `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- The fixture corpus uses reduced boards only as diagnostics but retains Level 26's minimum chain four, blocker-free rule, equal-or-double extension, shipped scoring/multipliers, sum survivor, gravity, and column-major deterministic refills.
- A resource cap or exception yields an explicit incomplete/failure result and nonzero exit; it never yields zero collisions.
- Canonical ordering must make manifest and result identities repeatable across runs.
- Preserve every pre-existing dirty path outside the exact affected surfaces.
- Use `apply_patch` for edits; do not commit or publish.

Evidence identities, verbatim from the frozen spec:

- `.orch/tickets/bl0001-compact-signature-2026-08-11/intake-investigation.md` SHA-256 `60beb9498bb300772ac48472caf7f85bed3acd73a6b8718f3ce7af21413a99e2`.
- `docs/backlog/BL-0001-test-compact-state-signature.md` SHA-256 `439c75dff6ec4e897dd6b41e805cb7a5b9c5746bf6667a868c4fcf5dcaf0b04b`.
- `EVIDENCE_LEDGER.md` SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, especially `HYPOTHESIS-0001` and the proof-class rules.
- Existing exact seams in `solver/engine.js`, `solver/exact-score.js`, `solver/tests/exact-score.test.js`, and `solver/physical-branch-bound/branch-bound.test.js` at their intake identities.
- Intake oracle: 52 focused tests passed; reduced-corpus probes recorded exact size and preliminary collision observations in the completed investigation ticket.

Exemplars, verbatim from the frozen spec:

- `solver/exact-score.js` at SHA-256 `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`: imitate explicit CommonJS exports, deterministic canonical keys, fail-closed caps, exact small-fixture scope, and separate replay/verification seams.
- `solver/target-witness-search/` at the intake tree identity: imitate the separation of `index.js`, `cli.js`, `verify.js`, tests, and a later frozen receipt; do not imitate its heuristic search semantics.
- `solver/tests/exact-score.test.js` at SHA-256 `f2880e9dba4096ca283d00d6580aee5a0d675234ca4756ef696fab5c3ab93d3b`: imitate small hand-checkable fixtures and negative controls.

Non-goals, verbatim from the frozen spec:

- Running or interpreting the full frozen experiment as a research conclusion.
- Searching the 5x8 Level 26 horizon, changing solver policy, or selecting a proof formulation.
- Claiming that a signature surviving the bounded corpus is exact, safe, or useful on larger boards.
- Updating `CURRENT.md`, backlog status, experiment prose, or the evidence ledger.
- Generalizing a universal experiment framework before this first experiment has run.

Code-pack runnable checks, verbatim from the frozen spec:

```sh
node solver/compact-signature/cli.js --validate docs/experiments/EXP-0001-compact-state-signature/scenario.json
node solver/compact-signature/cli.js --fixture
node --test solver/compact-signature/compact-signature.test.js
node --test solver/tests/*.test.js solver/physical-branch-bound/*.test.js solver/compact-signature/*.test.js
shasum -a 256 solver/engine.js solver/exact-score.js EVIDENCE_LEDGER.md HANDOFF.md
git diff --check -- solver/compact-signature docs/experiments/EXP-0001-compact-state-signature/scenario.json
```

Acceptance criterion 6 is gate-owned: the downstream code gate renders the code-pack shape lens fresh against the frozen spec, the standards owner, and the craft reference. It is not a unit completion criterion.

## Completion test

1. **AC-1 — frozen manifest validation.** Run `node solver/compact-signature/cli.js --validate docs/experiments/EXP-0001-compact-state-signature/scenario.json`; require exit 0 and a JSON `VALID` result bound to the manifest hash, with the schema version, experiment ID, shipped-rule parameters, deterministic refill stream, exhaustive alphabets/shapes, horizons, prefix depth, signature definitions, exact comparison metric, resource caps, and fixed source identities declared. Oracle: the exact command and its output. `oracle_class: deterministic`; `provenance: pre-existing`.
2. **AC-2 — exact end-to-end collision analysis.** Run `node --test solver/compact-signature/compact-signature.test.js`; require passing tests that exhaustively enumerate every declared starting board and physical prefix action, deduplicate only exact successor boards, compute exact remaining maxima at the frozen cursor/stream, group by every declared signature, report collision counts, and reproduce the smallest counterexample in deterministic order. Oracle: the exact test command and test identities. `oracle_class: deterministic`; `provenance: pre-existing`.
3. **AC-3 — canonical definitions and fail-closed controls.** Run `node --test solver/compact-signature/compact-signature.test.js`; require passing searchable-field and canonical-serialization coverage for the baseline, survivor, and action-class signatures, plus negative controls for omitted fields, invalid signature names, exhausted spawn streams, exact-node caps, and incomplete fixture results. Oracle: the exact test command and test identities. `oracle_class: deterministic`; `provenance: pre-existing`.
4. **AC-4 — independent recomputation and tamper rejection.** Run `node solver/compact-signature/cli.js --fixture && node --test solver/compact-signature/compact-signature.test.js`; require fixture `PASS` and tamper controls that reject a changed collision count, counterexample, input identity, or incomplete result. Oracle: the exact compound command and its output. `oracle_class: deterministic`; `provenance: pre-existing`.
5. **AC-5a — regression.** Run `node --test solver/tests/*.test.js solver/physical-branch-bound/*.test.js solver/compact-signature/*.test.js`; require zero failures and compare failures by identity, not count, against the recorded baseline. Oracle: the exact full-suite command and test output. `oracle_class: deterministic`; `provenance: pre-existing`.
6. **AC-5b — protected identities.** Run `shasum -a 256 solver/engine.js solver/exact-score.js EVIDENCE_LEDGER.md HANDOFF.md`; require, respectively, `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b`, `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`, `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`, and `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`. Oracle: the exact hash command and output. `oracle_class: deterministic`; `provenance: pre-existing`.
7. **AC-5c — changed-surface shape.** Run `git diff --check -- solver/compact-signature docs/experiments/EXP-0001-compact-state-signature/scenario.json`; require exit 0 with no whitespace errors. Oracle: the exact diff-check command and output. `oracle_class: deterministic`; `provenance: pre-existing`.

## Return fields

- `changed_artifacts`: every changed deliverable path and its SHA-256 identity; must be a subset of `write_scope`.
- `result_identity`: canonical manifest identity, fixture receipt identity, and the live-checkout result identity used by every verdict.
- `red_green_evidence`: per TDD slice, the failing-check identity/reason and the passing-check identity/output, recorded without creating a Git commit.
- `completion_test_verdicts`: one verdict entry per criterion with `verdict`, exact `oracle`, `oracle_class`, `evidence`, and `covers`.
- `protected_hashes`: the four observed protected hashes in criterion 6.
- `scope_check`: the observed changed paths and confirmation that pre-existing dirty paths were preserved; the downstream gate appends its independent scope-check.
- `feedback`: bounded observations or `[]`.
- `risks`: remaining risks or `[]`.

## Result

- **status:** failed before execution
- **changed_artifacts:** `[]`
- **reason:** The frozen spec's live-checkout/no-commit workspace contract contradicts `orch-tdd`'s required isolated clean workspace and per-slice commits. No test or deliverable edit began.

## Verification

- **verdict:** FAIL — the executor precondition cannot be satisfied by the frozen workspace contract.
- **covers:** ticket dispatchability only; no acceptance criterion was executed.

## Feedback

[]

## Risks

- Reusing this ticket would silently weaken either the frozen spec or the executor contract. A successor spec must provide a disposable isolated Git snapshot and restrict commits to that snapshot.
