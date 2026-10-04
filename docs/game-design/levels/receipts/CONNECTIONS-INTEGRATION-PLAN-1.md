# CONNECTIONS-INTEGRATION-PLAN-1

Date: 2026-10-03. Actor: codex. Reviewer: owner.
Disposition: submitted planning work; not implementation, release or self-acceptance.

## Question and authority

How can the confirmed finite Connections levels become variants inside the
original game while preserving the live playtest, legacy progression and the
preferred prototype visuals?

The owner asked: "Can I continue playing here while you make progress in these items".
This pass reconciles and enriches the existing brief. It does not change runtime
behavior, restart servers, build levels, commit, publish or open a PR.

## Result

- Updated the canonical [level and integration plan](../../docs/plans/2026-10-03-0341-feat-connection-puzzle-levels-plan.md) in place.
- Preserved R1-R15 verbatim, including three independent puzzles, three ordered
  objectives, shared move budgets, paid removal, zero starting inventory,
  repeatable retries and unrestricted ordinary play.
- Added the original-app destination, preferred Connections presentation and
  live-play preservation as R16-R18, with corresponding flow/acceptance examples.
- Grounded five implementation units in actual app boot, legacy progress,
  retained model behavior and incompatible capture contracts. Protected core
  files remain outside the proposed edits.
- Proposed a learning sequence for arrangement, material retention and recovery.
  Concrete boards and budgets remain authoring work; no difficulty claim is made.
- Updated CURRENT.md, the archetype workbench and append-only PDL-031/PDL-032.
  Full campaign order/unlocks and whole-game restyling remain unselected.

## Source and reasoning bounds

Inspected the original src/index.html, src/game.js, Keeper renderer override,
tools/play-server.js, retained continuous/power-up models, actual-page prototype
tests and local authoring/progression records. The original controller wins on
score targets and stores numeric unlock progress. Connections requires separate
finite outcome and action-replay semantics; merely inserting its objectives
into the score-level list would not satisfy the approved contract.

The planning confidence pass used the Standard path: five dependent units,
established local engine/serving/replay patterns, no external research needed.
No competing mechanism or fresh evidence justified an elevation run. New modules,
authored content and native QA are planned execution work, not current proof.

## Document review evidence and disposition

The ce-doc-review workflow ran in non-interactive mode. Coherence, feasibility,
scope, design and adversarial lenses were applied sequentially in this main
session under the user's tool mapping. These are not independent reviewers;
no agreement-based confidence promotion or cross-model dispatch occurred.
The pack resolver reported zero entries, warnings and errors.

Original retained finding:

```json
{"reviewer":"coherence","findings":[{"title":"Verification names an extra new test file","severity":"P3","section":"Verification Contract","why_it_matters":"The execution checklist asks for six new test files, but its named units supply five, leaving an implementer looking for an undefined sixth check.","finding_type":"error","autofix_class":"safe_auto","confidence":100,"evidence":["Run focused Node tests in the six new test files named by U1-U4","Add `src/connection-rules.js`, `solver/tests/connectionRules.test.js`.","Add `src/connection-levels.js`, `solver/tests/connectionLevels.test.js`","`solver/tests/gameLibrary.test.js`, `solver/tests/connectionGame.test.js`","`solver/tests/connectionCapture.test.js`"],"suggested_fix":"Change the new-test count from six to five; preserve the named tests and all verification obligations."}],"residual_risks":[],"deferred_questions":[]}
```

Resolved disposition: apply the mechanical count correction within the authorized
draft-edit scope. The actual file now names five. No product outcome changed.
The other four lenses retained no new actionable findings; the plan already
states its board/budget, native-QA and finite-balance uncertainties. Independent
review remains implementation completion work, not an approval supplied here.

Reviewed plan SHA-256:
`d2f01a48ac0532230eae5f00b0b0469039891eedf8d64a938eeebd18f415f882`.

Document review complete (non-interactive mode).

Applied 1 fix:
- Verification Contract: corrected the new-test count to match the five named files (coherence).

Review complete

## Checks performed

- Read the final artifact from disk and compared its R1-R15 lines with the
  pre-edit text: all fifteen are identical.
- Inspected the final identifier sequences: R1-R18, F1-F5, AE1-AE9, KTD1-KTD5,
  U1-U5. Seven local Markdown links resolve; no trailing whitespace found.
- git diff --check passed. HEAD remains
  fced429c4afc2b62312e32fdb202f8c0457c53d2; no commit was made.
- Rehashed all 68 runtime/reference files in the pre-edit snapshot: none changed.
  This includes protected core files and retained playtest assets. Live owner
  captures are deliberately excluded because continued play can update them.
- A sandboxed localhost request could not connect. A host-side read-only request
  then confirmed the existing 8285 server responds with the unchanged identity
  3bda1a81e84cc023107de1d8b3909357707d44922b481a86e7aecbd7fbfa142a.
  No server or player state operation was performed.
- Logged the sandbox observation and inline-review workaround under the friction
  law. No gameplay tests, browser/touch checks or release gates were run.

## Next bounded work

Implementation would first establish the deterministic finite model, then author
and replay three complete puzzles with selected budgets. App integration and
separate capture follow without replacing the owner's live playtest. New product
choices, measured difficulty, native QA, independent review and release remain
distinct from this completed planning pass.
