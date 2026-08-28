# Worklog — 2026-08-28 MAP-Elites transition

## Goal

### Objective

A second-generation, independently verifiable MAP-Elites evidence packet exists beside the untouched 2248 product, showing whether a larger fresh-seed search expands the known behavior archive and whether its best screened elite retains a positive advantage on disjoint holdout games.

### Acceptance

1. A fresh bounded archive is produced without overwriting prior evidence, decided by the frozen producer command, new run-scoped outputs, and unchanged original archive hashes.
2. The new archive is structurally and replay valid, decided by the committed independent verifier.
3. The transition preserves the existing product and research baselines, decided by exact protected-identity re-hashing and a clean isolated checkout.
4. The larger run is compared honestly with the accepted 48-iteration baseline, decided by a traced synthesis over both machine-readable archives.
5. Any policy-improvement claim clears positive disjoint holdout lift at `t > 3` or is refused, decided by committed `solver/policy-eval.js` over archived score vectors.
6. The result states coverage, behavioral diversity, generalization, champion standing, contradictions, and gaps.

## State

- **spec:** `.orch/runs/2026-08-28-map-elites-transition/spec.md`
- **tickets:** `.orch/tickets/2026-08-28-map-elites-transition/`
- **terminal:** `complete` — final verification `PASS` at weakest oracle class `evidence`; fixed result identity `4305da5804a7a44ef136019de62b5b495f8dd3bf31ae66ab5afe09e9964b3c86`.

## Iterations

### 0 — opened 2026-08-28T10:46:57Z

- Workspace identity: main-checkout run store `.orch/runs/2026-08-28-map-elites-transition/evidence/`, fed read-only by isolated checkout `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites` at `be843368be8e19ec59501aae38f19eebaf188b87`.
- Provenance: accepted baseline `RESULT-0017`, original archive SHA-256 `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`.
- Baseline: isolated checkout clean; main checkout dirty state explicitly preserved by the protected identities frozen in the spec.
- Next action: execute `T-001`, then synthesize with the accepted baseline in `T-002`.

### 1 — archive run accepted

- `T-001` accepted at the join: new archive `3905956c2fc0f32e078058938dd2128a47e862f6fd56fc184137cb1b26e63ffa`, map `d69c0dcf583ad41361a46609b49672f12f24be2d67515c29660a923b7f7a1201`.
- Deterministic verifier: `PASS`, 24/25 occupied cells, all bins on both axes, three representative replays, protected identities unchanged.
- Policy evidence: best screen elite `896748efe7b5` measured `+2.182%` on selection and `-2.217%` on holdout (`t=-1.392`); no stronger champion established.
- Comparison caveat: axis boundaries drifted between baseline and fresh pilots, so exact cell-for-cell expansion is unverified.
- Next action: `T-002` synthesis over the accepted baseline and fresh packet.

### 2 — synthesis accepted and gate crossed

- `T-002` synthesis compared the accepted baseline with the fresh archive and preserved three disagreements: selection versus holdout, higher occupancy versus shifted axes, and fresh mutation search versus nested evaluation seeds.
- Single research-lens gate validated the evidence trace and made one correction: byte-level recording preservation was not frozen at intake and is now explicitly `UNVERIFIED`; the protected identity set remains `PASS`.
- Fixed synthesis identity: `4305da5804a7a44ef136019de62b5b495f8dd3bf31ae66ab5afe09e9964b3c86`.
- Gate verifier rerun: `PASS`, 24 occupied cells, five bins on both axes, three representative replays, champion and authoring hashes unchanged.
- Next action: final verification over the six frozen acceptance criteria.

### 3 — final verification and close

- Criterion 1 `PASS` (`deterministic`): fresh run-scoped archive and map exist with identities `3905956c...` and `d69c0dcf...`; original artifacts remain `11e50d6b...` and `c1e27d78...`.
- Criterion 2 `PASS` (`deterministic`): committed verifier re-confirmed 24 occupied cells, both five-bin axes, three exact replays, and protected hashes.
- Criterion 3 `PASS` (`deterministic`) for the spec-frozen identity set: all named main and isolated product hashes matched; isolated checkout remained clean. Recording byte identity remains explicitly outside this verdict and `UNVERIFIED`.
- Criterion 4 `PASS` (`evidence`): synthesis traces baseline/new configuration, occupancy, axis spans, evaluation counts, replacements, and representative results; cross-run cell expansion is `INCONCLUSIVE` because axes moved.
- Criterion 5 `PASS` (`deterministic`): `896748efe7b5` recomputed at holdout lift `-2.217%`, `t=-1.392`, so no stronger-policy claim appears.
- Criterion 6 `PASS` (`evidence`): synthesis states yielded behavior evidence, champion standing, disagreements, flip evidence, and gaps.
- Changed deliverables: `evidence/archive.json`, `evidence/map.html`, `evidence/synthesis.md`; orchestration state: spec, worklog, and `T-001`/`T-002` tickets.

## Blame classes

[]

## Failed approaches

[]

## Queued scope

[]
