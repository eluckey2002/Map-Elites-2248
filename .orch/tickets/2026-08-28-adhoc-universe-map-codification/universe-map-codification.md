---
id: universe-map-codification
run: 2026-08-28-adhoc-universe-map-codification
status: limited
executor: orch-investigate
depends_on: []
write_scope: []
excluded_actions:
  - modify project source, evidence standing, governance, or generated artifacts
bound: 12 targeted repository reads and one recommendation
claimed_by: codex-root
claimed_at: 2026-08-28T00:00:00-05:00
---

## Objective

Identify the smallest repository structure that makes the proposed Universe Map durable, drift-resistant, and accessible without competing with the existing evidence authority.

## Fixed inputs

- `EVIDENCE_LEDGER.md` authority, record schema, proof classes, freshness, and append-only correction rules
- `CURRENT.md` navigation role and active-state limitations
- Current repository file and script structure at the 2026-08-28 working tree
- Recent MAP-Elites artifacts and their existing verifier surfaces, when present in this checkout
- Source policy: repository primary evidence and named durable experiment artifacts only
- Bound: inspect at most 12 targeted repository surfaces; do not implement or change governance

## Completion test

1. The recommendation assigns exactly one authority for evidence standing and does not make the Universe Map a competing source of truth.
   - Oracle: resolve the recommendation against `EVIDENCE_LEDGER.md` sections "Authority and navigation", "Evidence and freshness rules", and "Append-only correction"
   - oracle_class: evidence
   - provenance: pre-existing
2. The recommendation specifies a minimal canonical schema, a human-accessible projection, a deterministic drift check, and an update path.
   - Oracle: fixed four-part completeness rubric stated in this criterion
   - oracle_class: judged
   - provenance: pre-existing
3. The recommendation identifies contradictions, dead ends, and what remains uncovered by the bounded investigation.
   - Oracle: compare the result sections with all sources listed in the investigation probe
   - oracle_class: evidence
   - provenance: pre-existing

## Return fields

- status
- result identity
- verification
- cited findings with confidence
- contradictions
- dead ends
- gaps
- recommended structural form

## Result

### Status

`limited`: the bounded investigation produced a repository-grounded architecture recommendation. It did not implement the structure, obtain an independent judged review, or resolve which branch should receive future code.

### Result identity

This ticket is the evidence packet. Sources were inspected read-only except for this required ticket and friction records.

### Cited findings

1. **The evidence ledger must remain the sole authority for claim standing. Confidence: high.** `EVIDENCE_LEDGER.md`, "Authority and navigation", says the ledger determines standing while primary receipts and source code support the underlying claims. Its freshness and append-only-correction sections forbid a generated overview from silently rewriting standing.
2. **A run-specific machine-readable receipt plus a generated human view already works locally. Confidence: high.** `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json` is schema-versioned and carries experiment identity, protected hashes, evaluation partitions, axes, search counts, policies, and score vectors. The paired `map.html` is generated from it. `solver/map-elites.js` at revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53` writes both; `solver/verify-map-elites.js` checks the receipt, protected identities, and representative replays.
3. **The repository lacks one current, canonical machine-readable cross-experiment state. Confidence: high within the bounded probe.** The root exposes `EVIDENCE_LEDGER.md` and `CURRENT.md`; MAP-Elites code lives in an isolated worktree while verified artifacts live under root `.orch/runs/`. No root-level universe schema, renderer, or verifier appeared in the bounded file probe.
4. **The existing untracked event subsystem is not a Universe Map backbone. Confidence: high.** `.orch/EVENT-SCHEMA.md` supports only `evaluation_result` and `gate_file_changed` events for three named gates. `.orch/continuation-check.py` enforces goal drift and gate tampering. It is useful loop governance but does not model rules, player identity, level coverage, capability, generalization, alignment, or cost.
5. **Navigation state is already capable of drifting from experimental state. Confidence: high.** `CURRENT.md` still names level authoring as active, while `HANDOFF-NEXT-MAP-ELITES.md` records a transition to MAP-Elites and the 2026-08-28 run artifacts document subsequent MAP-Elites rounds. These sources have different authority roles, so the contradiction must be displayed rather than blended.

### Recommended structural form

Use a source/projection/gate design:

- `universe/contract.json`: small canonical contract defining the frozen anchors, the five required dimensions, thresholds, freshness rules, and evidence selectors. It contains definitions and pointers, not freestanding empirical claims.
- Primary receipts remain where their producing experiments write them. Accepted standing remains in `EVIDENCE_LEDGER.md`.
- `tools/build-universe-map.js`: resolves the contract against the ledger, current source identities, and named receipts, then produces `UNIVERSE.md` and `universe/map.html` from the same resolved model.
- `tools/verify-universe-map.js`: fails closed on missing anchors/dimensions, unresolved ledger IDs, non-accepted or stale claims presented as current, missing/hash-mismatched receipts, identity drift, or generated views that differ from a fresh render.
- `UNIVERSE.md`: the default one-screen entry point, linked from `CURRENT.md` and the repository landing documentation. It shows anchors, five load-bearing cards, warnings, and the derived current frontier. Details link one hop to the ledger, receipts, and HTML drill-down.

The update transaction is: experiment receipt -> independent verification -> ledger admission/correction -> contract pointer update when the front-page set changes -> deterministic render and verify. A raw experiment result never updates the front page directly.

### Contradictions

- `CURRENT.md` names level authoring as active; `HANDOFF-NEXT-MAP-ELITES.md` and later immutable run artifacts describe MAP-Elites as the active direction.
- The root checkout is `52f500c...`; the current MAP-Elites runner/verifier is isolated at `8508c3b...`. Any implementation destination must be explicitly chosen before building.

### Dead ends

- `.orch/EVENT-SCHEMA.md`, `.orch/events.jsonl`, `.orch/state.json`, and their Python helpers address loop continuation and gate tampering only; they do not supply the proposed universe model.
- `solver/README.md` is a solver history and command reference, not a current project control panel.

### Gaps

- No implementation was produced or tested.
- No independent judged review was run for the proposed information architecture.
- The authoritative branch/destination for the MAP-Elites implementation remains an owner decision.
- The bounded probe did not inventory every historical experiment or design a migration for every ledger record.

## Verification

1. `PASS` — evidence oracle. The recommendation explicitly preserves the ledger as the sole standing authority and makes generated views projections.
2. `UNVERIFIED` — judged oracle. The recommendation contains all four required parts, but no fresh independent judged context reviewed the architecture.
3. `PASS` — evidence oracle. Contradictions, dead ends, and uncovered gaps are recorded above.

Overall: `UNVERIFIED`; weakest oracle class `judged` and criterion 2 was not independently rendered.

## Feedback

[]

## Risks

- A manually edited `UNIVERSE.md` would become a second drifting authority; generated-file enforcement is load-bearing.
- Parsing the current Markdown ledger may be brittle. The initial implementation should support only the exact record fields needed by the control panel, not attempt an immediate ledger migration.
