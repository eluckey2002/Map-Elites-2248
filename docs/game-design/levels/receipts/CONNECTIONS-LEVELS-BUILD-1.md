# CONNECTIONS-LEVELS-BUILD-1

2026-10-03. Actor: codex. Reviewer: owner. Local implementation; owner play next.

## Authority recorded with the action

The owner replied "Ok proceed" after the completed integration-planning pass.
Execute the existing plan locally: finite model, three authored puzzles, original
app view, separate replay capture and compatibility checks. Preserve the active
8285 playtest and every settled product decision. No commit, PR, publication or
legacy scoring-rule change is part of this local build.

## Workspace and engine

Branch codex/archetype-design-20261001, HEAD fced429. Existing dirty documents
and prototypes are retained. Other terminal agents have different working
directories; the exact worktree inventory shows only the six known playservers.
Open PRs 62/63 concern policy study and checkout checks, not this app variant.
Native inline execution follows the user's sequential main-thread mapping.

## Units and evidence

- U1: `src/connection-rules.js` implements the finite lifecycle using the shared
  engine. Seven real-module tests cover retained transition parity, exact goals,
  threshold/cap, removal, final-move priority, immutable preview and full undo.
  The tests first failed on the missing actual module, then passed.
- U2: the actual `src/connection-levels.js` catalog contains Crosscurrent,
  Keep a Line and Borrow a Space. Their private whole-level witnesses replay
  to wins in 6/9, 6/9 and 7/10 moves; the last earns and spends a removal.
  Five tests read actual catalog/witness files and the real CLI, rejecting
  absent inputs and a corrupted route. The concrete Keep a Line scene reads
  actual values and distinguishes two equal-sum survivor placements.
- U3: original `src/index.html` now routes through `src/game-library.js`.
  The legacy route loads game.js then Keeper; the Connections route loads its
  own controller, model and arithmetic helper. Four actual-controller tests
  cover live sum, preview/cancel, earned removal, win/undo/retry and saved
  attempt resumption; three actual-router tests cover navigation, query
  preservation and the repaired visible legacy-load error.
- U4: `/api/connection-attempts` stores UUID/revision/identity-bound actions in
  ignored `connection-sessions/`, not score sessions or experiment recordings.
  Server replay is authoritative. A real HTTP test checks served browser-model
  parity, valid save/undo, rejected forged/stale/conflicting actions, unchanged
  saved bytes, hidden authoring files, and the original capture endpoint.
  Existing play-server tests remain unchanged and pass.
- U5: compatibility and source checks are complete at the level described
  below. Native rendered/touch QA, independent review and owner acceptance
  are still open. Local preview: http://127.0.0.1:8286/?mode=connections.

## Verification results and limits

- Initial tracked-suite baseline on the host: 590 tests, 585 pass, four fail,
  one skip. Sandbox-only localhost EPERM and remote DNS failures were separated
  by rerunning through the approved host path; they were not called regressions.
- Final focused model/UI/HTTP/legacy/pilot run: 63 tests, 63 pass, zero fail.
  Command: `node --test solver/tests/{connectionRules,connectionLevels,gameLibrary,connectionGame,connectionCapture,playServer,gameLevels,mirrors-game,customLevel,levelJump,fixedSeedLevel,humanPilot0002}.test.js`.
- Final full suite: 610 tests, 605 pass, four fail, one skip, after the final
  router repair. Command: `node --test --test-reporter=spec solver/tests/*.test.js`.
  Its four failures were the
  prototype collector inventory (7 versus 113), stale level-52 receipt, stale
  level-54 receipt and Universe generated view. These are the same named
  failures reproduced before implementation; no check or protected source was
  changed to clear them. Capture counts can grow while the owner plays.
- `git diff --check` and syntax checks of the authored JavaScript pass.
  No package manifest, lint command or typecheck configuration is present;
  syntax/whitespace checks are not represented as lint/typechecking.
- `node tools/author-connection-levels.js` inspects the actual pack and private
  witnesses. All three first objectives have found two-move opening routes.
  Scope is first objective only, at most two commitments, 1,000 states and
  20,000 chain/goal nodes per scan. Cutoffs remain UNKNOWN. Later shortcuts,
  shortest whole-level routes and human difficulty are unmeasured. Recovery
  is useful in the third witness, not proven necessary in every winning plan.
- Absence/corruption and real invalid-action failures were observed before
  trusting qualification/capture. The gate-check skill produced two report-only
  cards in `docs/CHECK-CARDS.md`; neither claims level quality or release safety.

## Requirements trace

- R1-R11: catalog and finite rules implement three ordered fixed goals, normal
  unrestricted merges, exact endpoints/result, shared budget, existing recovery,
  independent inventory, identical retry, terminal precedence and no skip/deal.
- R12-R14: free choice of all puzzles, progress/moves/bank/arithmetic, full undo,
  preview, cancellation and result/retry controls. Only active markers appear.
- R15/R18: all retained runtime bytes and owner runtime identity preserved.
  Existing captures were neither edited nor migrated; ongoing play continues.
- R16: original-app Level Select entry; protected legacy level definitions,
  numbering and unlock key remain unchanged. `connectionPuzzleWins` is separate.
  The new local port has its own browser origin; no old-origin storage was
  transferred or rewritten.
- R17: prototype cream/green visual treatment, single objective and visible
  arithmetic are implemented in the Connections view only. Fidelity and actual
  desktop/mobile rendering remain unverified, not passed by DOM stand-ins.

## Preservation and runtime identity

The before/after 68-file source manifest has exactly two expected changes:
`src/index.html` and `tools/play-server.js`. In particular, src/game.js,
solver/engine.js, solver/level-author.js, the pilot manifest, retained prototype
runtime files and existing Keeper assets are byte-for-byte unchanged.
No production module imports a mutable prototype runtime file.

Fresh GET of 8285 still returns
`3bda1a81e84cc023107de1d8b3909357707d44922b481a86e7aecbd7fbfa142a`.
The new 8286 server serves cached identity-bound source assets. Only that newly
started, unused preview was refreshed after its router repair (zero finite
capture files existed); no owner prototype server was stopped or restarted.
Final 8286 identity equals a fresh source-derived capture identity:
`e619e005527beb8fbe6f48ff586546c65a1c5c400e6739b50cd0f780555b437b`.

## Review and handoff

ce-work governed inline implementation; ce-simplify-code removed one redundant
capture existence check. gate-check constrained replay reports to their actual
scope. frontend-testing-debugging separated controller proof from rendered QA.
Its documented browser attempt failed because no IAB/browser surface is enabled;
no browser dependencies, permissions or security settings were changed.

Code review: skipped (ce-code-review unavailable).
The loaded review skill cannot produce its required complete receipt under
tracked-only scope and the user's main-thread mapping; the cataloged native
committed-diff fallback is empty. The explicit actual-file manual source scan,
confirmed alert defect/red-green repair and coverage limits are in
[local source review](CONNECTIONS-LEVELS-REVIEW-1.md). No independent approval
is inferred. A future release still needs that review and native QA.

CURRENT, workbench and append-only PDL-033 now distinguish this candidate from
the approved retained loop, historical archetype quota and future campaign.
The plan remains the contract; it was not rewritten into a progress log.

Next checkpoint: owner play. Does a finite finish make planning and learning
through retry satisfying? Keep solutions private; use owner feedback to decide
revision. No campaign, new archetype, Delivery integration, rule retuning,
sustained-board-health claim, commit, PR, push or publication was added.

No acceptance, native-QA approval or independent review is asserted here.
