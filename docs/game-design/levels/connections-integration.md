# Connections main-project integration

2026-10-04. Producer: Codex. Reviewer: owner. Task: CONNECTIONS-MAIN-INTEGRATION-1.

## Authority and scope

DECISION-0010 and PDL-035 record the owner's main-project integration request.
This is a linked working copy of `eluckey2002/Map-Elites-2248`, not a separate
game or repository. The existing finite pack lives in the original app at
`?mode=connections`, with a Level Select entry. Crosscurrent, Keep a Line and
Borrow a Space remain independently selectable.

Preserve the chosen rules, paid earned removal, repeatable retries, free
preview/undo and preferred Connections visual treatment. Retain the prototype
history without activating additional app modes. Do not add forecasts, campaign
ordering, new levels, Delivery integration or a legacy visual redesign.

## Release state

The candidate is committed on `codex/archetype-design-20261001`.
Intake HEAD was `fced429`; freshly fetched main is `cd83127`, containing the
unrelated shared-Blackboard and ruler updates. It was integrated in `cbc9533`;
the sole conflict was the generated index, regenerated from the combined
ledger. Open PRs 62/63 overlap navigation/instructions but not the game
source; preserve their independent work.

No merge, independent review approval or native gameplay/touch pass is claimed
by this pre-review receipt. The PR's live state records review and merge. A
draft PR carries the independent GitHub Codex review; it must not be
made ready or merged before actual review and the required green gates.

The local ce-code-review full workflow cannot finish its separately dispatched
review contexts under the user's inline main-thread mapping. No cross-model job
was launched. Existing manual source checks are not independent approval.

## Verification contract

Run the experiment gate, ledger authorship gate and current ledger-index check
on the committed integration. Run the actual Connections model, catalog,
controller, router, capture HTTP and legacy/pilot compatibility tests. Check
protected source bytes against the base and do not fix known legacy receipts
or the stale Universe Map as part of this pass.

Prior counts and negative controls are historical in the
[build receipt](receipts/CONNECTIONS-LEVELS-BUILD-1.md) and
[handoff receipt](receipts/CONNECTIONS-LEVELS-HANDOFF-1.md). Fresh shipping results
will be appended here. Full-suite informational failures remain visible.
Automated DOM/HTTP proof does not establish actual desktop/touch rendering.

## Preservation

Do not stop or restart the owner's 8285 game or the 8286 finite playtest.
Their saved sessions remain local and unchanged; neither session store is
migrated into the other or admitted to the experiment corpus.

The [receipt archive](receipts/README.md) supplies durable snapshots of the
historical operational notes. Same-machine `preservation/` archives remain
outside the Git worktree. Ongoing raw captures and the Blackboard database are
not included in this publication. Leave the live worktree in place while its
servers and local sessions depend on it, even after merge; no cleanup is
authorized as part of this integration.

## Fresh pre-review verification

Checks run on committed integration `cbc9533`, 2026-10-04:

- `node tools/verify-experiments.js`: EXPERIMENT GATE PASS.
- `node tools/verify-ledger-authorship.js`: PASS against base `cd83127f`.
- `node tools/ledger-index.js --check`: LEDGER INDEX CURRENT.
- Focused Connections/model/UI/HTTP/legacy/pilot set: 63 passed, none failed.
  Command: `node --test --test-reporter=spec solver/tests/{connectionRules,connectionLevels,gameLibrary,connectionGame,connectionCapture,playServer,gameLevels,mirrors-game,customLevel,levelJump,fixedSeedLevel,humanPilot0002}.test.js`.
- Retained prototype tests: 69 passed, none failed, using the actual staged
  `.test.js` paths from this work's ten prototype directories. Real temporary
  HTTP servers are exercised; owner servers are not used as test fixtures.
- Fresh `git archive HEAD` extraction: 20/20 finite-pack model/catalog/router/
  controller/actual HTTP tests passed. The tracked legacy capture fixture was
  present. No ignored local capture or Blackboard input was required.
- Full informational suite: 628 tests, 623 pass, four fail, one skip. Command:
  `node --test --test-reporter=spec solver/tests/*.test.js`. Failures remain the
  prototype session collector inventory, stale level-52 receipt, stale level-54
  receipt and stale Universe generated view. No check was waived or weakened.
- `node tools/author-connection-levels.js`: actual private routes finish the
  three puzzles within their budgets; the third uses one removal. Bounded
  two-move opening routes were found for every first objective. This is not
  shortest whole-level proof, a difficulty measurement or a player hint.
- Protected game/engine/author/pilot bytes match `origin/main`; source-derived
  finite capture identity remains `e619e005527beb8fbe6f48ff586546c65a1c5c400e6739b50cd0f780555b437b`.
- All 27 historical receipt/input snapshots match their original bytes.

The shared-Blackboard update migrated 26 tasks and their operational files to
the common Git-directory board. Its original private copy remains as a backup;
no task was accepted or capture removed. Historical migrated claims retain
their original stored limits; progress renews this task rather than inventing
an unsupported claim flag.

This verification section is documentation only. Reapply the required gates
to its committed state before publication. Native gameplay/touch QA remains
partial as recorded in the handoff; no full rendered pass is claimed.
