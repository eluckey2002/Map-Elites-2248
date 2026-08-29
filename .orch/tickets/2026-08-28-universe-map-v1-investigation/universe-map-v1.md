---
id: universe-map-v1-investigation
run: 2026-08-28-universe-map-v1-investigation
status: complete
executor: orch-investigate
depends_on: []
write_scope: []
excluded_actions:
  - modify evidence standing, game rules, champion identity, or experiment artifacts
bound: one probe, eight targeted reads, and one evidence packet
claimed_by: codex-root
claimed_at: 2026-08-28T00:00:00-05:00
---

## Question

What exact primary sources, formats, test idioms, and current contradictions constrain a minimal deterministic Universe Map v1 on clean canonical `main`?

## Source policy

Repository primary evidence only: `EVIDENCE_LEDGER.md`, `CURRENT.md`, the accepted and latest MAP-Elites artifacts, their producer/verifier, existing Node tests, and the completed Git-baseline run.

## Result

### Status

`complete`: the bounded evidence decides the implementation seams without another owner choice.

### Result identity

This ticket is the evidence packet.

### Cited findings

1. **Evidence standing has one existing authority. Confidence: high.** `EVIDENCE_LEDGER.md`, “Authority and navigation,” makes the ledger authoritative for standing while primary source and receipts support claims. A Universe Map must be a generated projection, never a second claim registry.
2. **The ledger and latest verified artifact intentionally differ. Confidence: high.** `RESULT-0017` admits the original 20-of-25-cell bounded run. `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json`, SHA-256 `ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22`, contains 23 occupied cells and three representatives, but no ledger record admits that later run. The view must display “verified artifact, not ledger-admitted,” not promote 23 cells into accepted standing.
3. **The latest artifact supplies the evaluation-universe facts needed by the control panel. Confidence: high.** Its selection partition is six levels `[1,10,20,30,40,52]` by twelve seeds; representative holdout is twelve levels `[1,5,10,15,20,26,30,35,40,45,50,52]` by twenty-four seeds. All three representative holdout fitness values are negative. These are direct receipt observations, not champion-promotion evidence.
4. **The receipt/view/verifier pattern already exists. Confidence: high.** `solver/map-elites.js` emits a schema-versioned JSON artifact and HTML; `solver/verify-map-elites.js` re-reads them, checks hashes and protected identities, and replays representatives. `solver/tests/mapElites.test.js` uses Node’s built-in test runner and temporary directories for deterministic failure fixtures.
5. **Navigation is stale and must expose that fact. Confidence: high.** `CURRENT.md` still names level authoring as active and was last reviewed 2026-08-20, while later MAP-Elites artifacts exist. The Universe Map should show the contradiction as a warning and `CURRENT.md` should link to the generated control panel without silently rewriting the milestone.
6. **The clean Git baseline removes the prior destination ambiguity. Confidence: high.** Canonical `main` was stabilized and live-guarded in `.orch/runs/2026-08-28-git-baseline-stabilization-v2/worklog.md`; implementation can target a branch from that revision.

### Contradictions

- `CURRENT.md` names level authoring as active; later verified artifacts document active MAP-Elites work.
- Ledger standing is 20 occupied cells (`RESULT-0017`); the later verified artifact reports 23 but lacks ledger admission.

### Dead ends

- No existing `universe/` directory, Universe contract, renderer, or verifier exists.
- The held event subsystem models loop events and is not part of canonical history or this control-panel design.
- No root package manifest or third-party rendering dependency is needed; repository tests use Node built-ins.

### Gaps

- The bounded investigation did not migrate the Markdown ledger to structured data.
- It did not admit the latest MAP-Elites run to the ledger or decide whether it should be admitted.
- Human visual quality remains a judged gate; deterministic tests can prove content, identity, and drift behavior but not scanability alone.

## Verification

`PASS`: every finding names repository evidence, contradictions remain explicit, and the question is decided within the bound.

## Feedback

[]

## Risks

- A parser that attempts the entire Markdown ledger would widen the scope and create a second schema migration project.
- A contract containing copied empirical prose would become a hidden competing authority.
