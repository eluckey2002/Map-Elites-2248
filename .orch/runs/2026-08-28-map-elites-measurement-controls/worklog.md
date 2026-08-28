# Worklog: MAP-Elites measurement controls

## Goal

**Objective:** A committed MAP-Elites runner revision can reuse an accepted archive's exact behavior-bin axes and generate evaluation seeds from caller-selected starts, while preserving the current defaults, verifier compatibility, and protected game baseline.

**Acceptance:**

1. The CLI exposes explicit, backward-compatible measurement controls, decided by the focused Node test suite.
2. A source archive freezes the behavior coordinate system exactly and records archive and axes identities.
3. The verifier detects provenance or axis tampering while accepting the legacy archive.
4. Existing runner behavior remains regression-safe under the focused suite and `git diff --check`.
5. The committed result is scope-clean and preserves every protected identity.

- **spec:** `.orch/runs/2026-08-28-map-elites-measurement-controls/spec.md`
- **tickets:** `.orch/tickets/2026-08-28-map-elites-measurement-controls/`

## Iterations

1. **open:** Frozen code spec and runtime composition created. One TDD ticket cut with downstream-gate independence.
2. **workspace:** Isolated worktree `.orch/runs/2026-08-28-map-elites-measurement-controls/worktree` on branch `codex/map-elites-measurement-controls`, derived from `be843368be8e19ec59501aae38f19eebaf188b87`. Baseline clean; protected hashes exact; focused tests PASS 15/15; legacy verifier PASS.
3. **TDD:** Three red-green commits produced revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`: configurable evaluation ranges, exact frozen source axes with identities, and tamper validation/documentation.
4. **gate:** Focused tests PASS 19/19; legacy verifier PASS; actual CLI smoke archive plus verifier PASS; exact-axis, exact-seed, scope, clean-status, and protected-hash oracles PASS.

## Blame classes

[]

## Failed approaches

[]

## Queued scope

[]

## Terminal

- **complete:** revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`; every acceptance criterion PASS at deterministic oracle class.
