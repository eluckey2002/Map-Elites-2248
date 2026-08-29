---
run: 2026-08-28-universe-map-v1
objective: A repository reader can open one generated Universe Map and see the five load-bearing dimensions, current evidence standing, contradictions, and next research frontier, while a deterministic verifier prevents that view from drifting from the ledger, protected identities, or named receipts.
non_goals:
  - Migrate `EVIDENCE_LEDGER.md` to JSON or change its authority, record schema, proof classes, or accepted standing.
  - Admit the 23-cell MAP-Elites artifact to the ledger or change the champion.
  - Run evolution, generate levels, change game rules or scoring, or resolve parked proof questions.
  - Build a general knowledge graph, event system, live web application, or broad historical migration.
  - Turn `CURRENT.md`, generated Markdown, or HTML into an independently editable source of truth.
acceptance:
  - id: A1
    criterion: `universe/contract.json` defines exactly five cards—identity, evaluation universe, observed performance, evidence standing, and current frontier—and contains only definitions, thresholds, frozen identities, and evidence selectors rather than freestanding empirical claims.
    oracle: `node --test solver/tests/universeMap.test.js` contract-shape and no-claim fixtures
    oracle_class: deterministic
  - id: A2
    criterion: One deterministic build resolves the contract against `EVIDENCE_LEDGER.md`, current Git/source identities, and the named MAP-Elites receipt, then emits byte-stable `UNIVERSE.md`, `universe/map.html`, and `universe/resolved.json` from one resolved model.
    oracle: `node tools/build-universe-map.js --check` plus two-build byte-identity fixtures in `solver/tests/universeMap.test.js`
    oracle_class: deterministic
  - id: A3
    criterion: The verifier fails closed on a missing required card, unresolved ledger ID, non-accepted or stale record presented as accepted current evidence, receipt SHA-256 mismatch, protected identity mismatch, or generated-view drift, and passes on the committed repository state.
    oracle: negative-control fixtures in `node --test solver/tests/universeMap.test.js`; live `node tools/verify-universe-map.js`
    oracle_class: deterministic
  - id: A4
    criterion: The generated one-screen view clearly distinguishes ledger-admitted `RESULT-0017` at 20 occupied cells from the later verified 23-cell artifact with no ledger admission; it names the six-level selection universe, twelve-level representative holdout, unchanged champion standing, three negative representative holdout results, and the stale `CURRENT.md` contradiction without blending their authority roles.
    oracle: semantic assertions in `solver/tests/universeMap.test.js` against `UNIVERSE.md` and `universe/resolved.json`
    oracle_class: deterministic
  - id: A5
    criterion: `CURRENT.md` links readers to `UNIVERSE.md` as the generated control panel while retaining its navigation-only disclaimer and existing historical milestone text.
    oracle: exact-link and retained-text assertions in `solver/tests/universeMap.test.js`
    oracle_class: deterministic
  - id: A6
    criterion: The exact result revision is no worse than the frozen project baseline: Universe tests pass, `git diff --check` passes, the curve gate passes, the historical MAP-Elites artifact still verifies from its pinned runner, and the full solver suite has no failure identity beyond the three deliberate stale-receipt failures.
    oracle: `node --test solver/tests/universeMap.test.js`; `git diff --check`; `node solver/verify-loop.js`; pinned `node solver/verify-map-elites.js <artifact>`; `node --test solver/tests/*.test.js` with exact failure-identity comparison
    oracle_class: deterministic
  - id: A7
    criterion: The implementation follows `AGENTS.md`, keeps run state as evidence rather than instructions, preserves append-only correction and proof-class boundaries, and remains a small explicit Node module at searchable public seams.
    oracle: fresh orch-code-pack lens review against `AGENTS.md`, `EVIDENCE_LEDGER.md`, and `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/lens.md`
    oracle_class: judged
binding_constraints:
  - `EVIDENCE_LEDGER.md` remains the sole authority for evidence standing; primary artifacts remain authority for their exact contents.
  - A raw or merely verified experiment artifact cannot appear as ledger-accepted evidence unless the selected ledger record resolves with accepted standing.
  - Preserve proof classes, `UNKNOWN`, contradictions, stale navigation, and negative holdout evidence exactly; do not manufacture a champion or progress claim.
  - Generated outputs are build products committed for accessibility but never manually edited; the verifier must detect byte drift.
  - Parse only the exact ledger fields required by selected records; do not design a general Markdown or ledger migration framework.
  - Use Node built-ins and existing repository idioms; add no dependency or external service.
  - Keep unrelated owner work and every retained worktree intact.
evidence:
  - `.orch/tickets/2026-08-28-universe-map-v1-investigation/universe-map-v1.md`
  - `.orch/tickets/2026-08-28-adhoc-universe-map-codification/universe-map-codification.md`
  - `EVIDENCE_LEDGER.md`, especially Authority and navigation, Evidence and freshness rules, Append-only correction, and `RESULT-0017`
  - `CURRENT.md` at clean baseline `ec9b4563e0e1025adccb74aa3f822e7def0ccd9e`
  - `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json`, SHA-256 `ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22`
  - `.orch/runs/2026-08-28-map-elites-independent-round/evidence/map.html`, SHA-256 `a94fc61469d36ab672bcb4722f1b08d628f9bee7d0137dfe0f4afb3568d7a0fb`
  - `solver/map-elites.js`, `solver/verify-map-elites.js`, and `solver/tests/mapElites.test.js` at required ancestor `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`
  - `.orch/runs/2026-08-28-git-baseline-stabilization-v2/worklog.md`
affected_surfaces:
  - `universe/contract.json`
  - `universe/resolved.json`
  - `universe/map.html`
  - `UNIVERSE.md`
  - `tools/universe-map-core.js`
  - `tools/build-universe-map.js`
  - `tools/verify-universe-map.js`
  - `solver/tests/universeMap.test.js`
  - `CURRENT.md`
  - `.orch/runs/2026-08-28-universe-map-v1/`
  - `.orch/tickets/2026-08-28-universe-map-v1/`
  - `.orch/tickets/2026-08-28-universe-map-v1-investigation/`
exemplars:
  - pointer: `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json`
    properties:
      - schema version and exact protected identities
      - explicit selection and holdout partitions
      - observations retained separately from promotion standing
  - pointer: `.orch/runs/2026-08-28-map-elites-independent-round/evidence/map.html`
    properties:
      - static self-contained HTML
      - progressive disclosure from summary to inspectable detail
      - artifact identities visible beside interpretation
  - pointer: `tools/verify-repo-baseline.js`
    properties:
      - fail-closed CLI with pure exported assessment seams
      - named, actionable failure messages
      - no third-party dependencies
routing:
  pack: orch-code-pack
bound:
  effort: one tracer implementation, one widening pass, one review-fix correction, and one final gate
  plan_gate: false
target_repository: `/Users/eluckey/Developer/research and games/2248-challenge`
standards_owner: `AGENTS.md` plus `EVIDENCE_LEDGER.md` for evidence authority and proof-class boundaries
risks:
  - Markdown ledger parsing can become brittle or accidentally over-general.
  - A polished generated view can look authoritative enough to hide non-admitted evidence unless standing labels are explicit.
  - The latest artifact was produced against protected historical hashes; current shipped files differ legitimately and must not be misreported as artifact corruption.
  - Generated files can drift if the build and verifier do not share one exact resolved model.
assumptions:
  - The owner’s approval to proceed selects clean canonical `main` as the eventual integration destination after all gates pass.
  - The five-card vocabulary agreed in conversation is settled for v1; additions require a later contract change.
  - The latest 23-cell artifact is useful as verified-but-not-admitted operational evidence and must be labeled that way.
  - A static Markdown front page plus self-contained HTML drill-down is sufficient accessibility for v1.
---
