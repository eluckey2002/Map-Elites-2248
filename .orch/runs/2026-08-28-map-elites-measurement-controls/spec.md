# MAP-Elites measurement controls

- **run:** `2026-08-28-map-elites-measurement-controls`
- **objective:** A committed MAP-Elites runner revision can reuse an accepted archive's exact behavior-bin axes and generate evaluation seeds from caller-selected starts, while preserving the current defaults, verifier compatibility, and protected game baseline.
- **routing:**
  - **pack:** `orch-code-pack`
- **target repository:** An isolated git worktree derived exactly from `be843368be8e19ec59501aae38f19eebaf188b87` in the 2248 repository, on a new run-owned branch.
- **standards owner:** `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites/AGENTS.md`, plus the existing implementation idiom in `solver/map-elites.js`, `solver/map-elites-core.js`, `solver/verify-map-elites.js`, and `solver/tests/mapElites.test.js` at baseline commit `be843368be8e19ec59501aae38f19eebaf188b87`.
- **acceptance as runnable checks:** The commands and negative controls enumerated under Acceptance decide this code deliverable.

## Non-goals

- Do not change game rules, scoring, levels, the champion, policy genes, descriptors, parent selection, mutation, iteration limits, representative selection, significance thresholds, or the generated map's interpretation.
- Do not resume evolution from an archive or merge archives.
- Do not modify either accepted prior archive or add a champion-promotion path.
- Do not make the next research run in this code spec; that is the successor research delivery.

## Acceptance

1. **The CLI exposes explicit, backward-compatible measurement controls.**
   - Oracle: `node --test solver/tests/mapElites.test.js solver/tests/policy-eval.test.js`; require tests proving the unchanged defaults `2000000` and `3000000`, parsing of `--screen-seed-start`, `--holdout-seed-start`, and `--axes-from`, and rejection of invalid or overlapping configured seed ranges.
   - Oracle class: `deterministic`, provenance `authored`; downstream independent gate required.
2. **A source archive freezes the behavior coordinate system exactly.**
   - Oracle: the focused test command must prove that the resolved run axes copy the source archive's chain-style and patience axes exactly, retain current-run pilot diagnostics separately, reject a bin-count mismatch, and record both source-archive SHA-256 and frozen-axes SHA-256.
   - Oracle class: `deterministic`, provenance `authored`; downstream independent gate required.
3. **The verifier detects provenance or axis tampering.**
   - Oracle: the focused test command must include a wrong-result fixture that passes when intact and fails after a frozen axis or its recorded identity is altered; `node solver/verify-map-elites.js solver/map-elites-output` must still report `PASS` for the accepted legacy archive with no new provenance fields.
   - Oracle class: `deterministic`; the legacy verifier oracle is `pre-existing`, the tamper fixture is `authored` and requires the downstream independent gate.
4. **Existing runner behavior remains regression-safe.**
   - Oracle: `node --test solver/tests/mapElites.test.js solver/tests/policy-eval.test.js` and `git diff --check` must pass at the result revision; all pre-existing tests must remain unchanged except additions required for the new controls.
   - Oracle class: `deterministic`, mixed `pre-existing` and `authored` provenance.
5. **The result is scope-clean and protected.**
   - Oracle: `git diff <baseline>...HEAD --name-only` may name only `solver/map-elites.js`, `solver/map-elites-core.js`, `solver/verify-map-elites.js`, `solver/tests/mapElites.test.js`, and `solver/README.md`; the protected identities under Binding constraints must match exactly.
   - Oracle class: `deterministic`, provenance `pre-existing`.

## Binding constraints

- Work only in a new isolated worktree derived from baseline commit `be843368be8e19ec59501aae38f19eebaf188b87`; do not edit the clean `map-elites-learning` checkout in place.
- Preserve legacy behavior when the new flags are absent: five pilot-calibrated bins and evaluation seed starts `2000000` and `3000000`.
- The reusable axes are exactly the source artifact's `chainStyle` and `patience` axis objects. Current-run pilot descriptor diagnostics remain current-run evidence and are not substituted from the source archive.
- Store identity, not authority-by-path: record SHA-256 of the source archive bytes and a deterministic SHA-256 of the frozen chain-style and patience axes. A path may be reported for usability but cannot establish provenance.
- Reject non-safe-integer or negative seed starts, ranges exceeding `Number.MAX_SAFE_INTEGER`, overlapping screen/holdout ranges, malformed source axes, and source bin counts that differ from `--bins`.
- Preserve legacy archive verification: absence of the new optional provenance fields in an old artifact is valid.
- Protected baseline identities:
  - source HEAD `be843368be8e19ec59501aae38f19eebaf188b87`
  - accepted archive `solver/map-elites-output/archive.json` SHA-256 `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`
  - accepted map `solver/map-elites-output/map.html` SHA-256 `c1e27d78431f64e4378c286bc6a3cb1882db131573f1aa0cbba357174a692b1a`
  - champion commit `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`
  - `src/game.js` `9493407cd9dc8b7cefaefac811b52969c89a078aa7df4fd2a5fa1c1e64207115`
  - `solver/bot.js` `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`
  - `solver/engine.js` `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`
  - `solver/level-author.js` `305731fbfd7e664075dc177e8be48f5bf530d1f8475f5fd8c501cef84149b257`
  - `solver/generate-levels.js` `d7a8bf832fa0baea07045cb5546ce6683a3dca0c49024262658f09f23ecc3842`

## Evidence

- Accepted source revision `be843368be8e19ec59501aae38f19eebaf188b87` and its passing legacy verifier.
- Accepted original archive SHA-256 `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`.
- `.orch/runs/2026-08-28-map-elites-transition/evidence/archive.json` SHA-256 `3905956c2fc0f32e078058938dd2128a47e862f6fd56fc184137cb1b26e63ffa`, which exposed cross-run axis drift and evaluation-seed reuse.
- Pre-change focused baseline: `node --test solver/tests/mapElites.test.js solver/tests/policy-eval.test.js` passed 15 of 15 tests.
- Pre-change legacy verifier: `node solver/verify-map-elites.js solver/map-elites-output` reported PASS with 20 occupied cells, 5x5 axes, and three exact representative replays.

## Affected surfaces

- `solver/map-elites.js`
- `solver/map-elites-core.js`
- `solver/verify-map-elites.js`
- `solver/tests/mapElites.test.js`
- `solver/README.md`
- Run-owned worklog and ticket paths under `.orch/runs/2026-08-28-map-elites-measurement-controls/` and `.orch/tickets/2026-08-28-map-elites-measurement-controls/` in the controlling checkout.

## Exemplars

- Baseline `solver/map-elites.js`: preserve the existing explicit configuration object, bounded run, and run-scoped artifact output.
- Baseline `solver/map-elites-core.js`: preserve pure, independently testable archive and axis validation helpers.
- Baseline `solver/verify-map-elites.js`: preserve verifier-first replay and protected-hash checks without gaining mutation authority.
- Accepted archive SHA-256 `11e50d6b...`: preserve artifact compatibility and the distinction among reference, screen, archive, and holdout evidence.

## Bound

- One code worktree, one implementation ticket, and at most five affected source/test/documentation files.
- Red-green slices for CLI/range validation, frozen-axis provenance, and verifier tamper detection; each verified slice is committed.
- `plan_gate: false` — the owner explicitly instructed continuation before the next round.

## Risks

- Hashing a structurally equivalent axes object inconsistently could make provenance depend on key order; the implementation needs one deterministic representation used by both producer and verifier.
- Legacy artifacts do not carry axis provenance, so backward compatibility must not silently claim a provenance identity they never recorded.
- Fixed bins can clip new behaviors at their boundary; this change makes that comparable, not impossible.

## Assumptions

- “The change before the next round” is the previously discussed shared-axis and wholly fresh evaluation-seed control, not a change to evolutionary selection.
- The accepted original archive is the coordinate source because it is the first verifier-accepted MAP-Elites run.
- Documentation changes are limited to the new CLI and comparable-run usage.
