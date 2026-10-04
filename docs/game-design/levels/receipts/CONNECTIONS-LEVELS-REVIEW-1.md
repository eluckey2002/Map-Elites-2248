# Finite Connections local source review

2026-10-03. Producer: codex. Scope: only this local finite-pack implementation,
against the explicit connection-puzzle plan at HEAD fced429. This is a
main-thread source review, not an independent approval or acceptance.

## Review path and coverage boundary

Code review: skipped (ce-code-review unavailable).
The definition loaded and its actual scope helper ran, but its tracked-only
scope excluded every new untracked model/UI/capture module. Its required
separate reviewer/finish contexts also conflict with the user's main-thread
mapping. No file was staged just to satisfy the reviewer. The cataloged native
fallback uses committed diffs; its fixed-point diff is empty for this local
build. Neither skill produced a completed receipt, and no external peer ran.
These constraints are logged as friction, not reported as successful reviews.

The fallback here is an explicit manual scan of the actual authored files,
actual HTML and tests, plus the changed server/app-entry diff. It covers:

- Spec: R1-R18 and U1-U5 against model, catalog, controller and capture code.
  Rendering and owner quality remain unverified, rather than silently passed.
- Standards: root/solver AGENTS and CLAUDE instructions; protected byte
  identities, separate capture stores, no prototype runtime imports, no
  scientific generalization, and no release mutation.
- Correctness: exact endpoint/sum matching before gravity, one move per
  commitment, rewards before terminal resolution, final-goal win priority,
  deterministic replay, full-state undo, and zero-inventory retries.
- API/data integrity: UUID filenames, identity-bound authoritative replay,
  rejected forged state/actions, revision conflicts, exact-repeat idempotency
  and atomic capture replacement. Actual HTTP negative tests inspect the old
  saved bytes after rejection; they do not merely exercise synthetic predicates.
- UI lifecycle: one selected controller, legacy query preservation, fixed
  markers, live sum, serialized capture snapshots, saved-attempt replay into a
  new attempt, and stale-save status guards across retry.
- Performance: bounded finite boards/budgets and bounded authoring search.
  Neither whole-level optimality nor human difficulty is inferred.

## Actionable Findings

One confirmed local issue was repaired: the router's legacy-load exception
put its alert inside the hidden Connections root. A negative test invoking the
real router with a failed script load failed on alert placement before the
fix. The router now moves that alert into the visible original view; the
three actual-router tests pass afterward. It does not start both controllers.

No further demonstrated defect was retained from this manual scan. That is
not a claim of independent review coverage or an absence of undiscovered bugs.

## Simplification pass

The ce-simplify-code reuse, quality and efficiency prompts were read and run
inline under the user mapping. Applied: reuse 0, quality 0, efficiency 1.
Capture reads now handle ENOENT directly instead of prechecking existence.
Other errors still propagate. Three low-value candidates were skipped:
merging unrelated capture contracts, deriving away the undo history, and
replacing deliberate immutable state copies. Trust-boundary checks remain.

## Verdict

Suitable for a bounded local owner playtest after the recorded tests; **not
release-ready**. Native visual/pointer/touch QA and independent code review
remain open. The enabled browser inventory was empty and the documented IAB
entry returned "Browser is not available: iab". No browser installation,
private-tab inspection or permission/security change was attempted.

The full-suite failures and authored search limits belong to the build receipt.
No self-acceptance, commit, PR, push or publication follows from this review.
