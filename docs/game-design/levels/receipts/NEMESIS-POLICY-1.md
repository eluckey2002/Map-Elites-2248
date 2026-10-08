# NEMESIS-POLICY-1 — selectable Nemesis opponents

## Authorization

2026-10-04 owner conversation:

Owner: “so if I want to play againt the bot then we need to update the policy”.
Assistant proposed a selectable Wider-search bot for comparison on the same board and seed, with default replacement a separate decision.
Owner: “ok proceed”.

This authorizes an additional playable opponent. It does not accept RESULT-0082 scientifically or replace the shipped default.

## Implementation

Nemesis offers Shipped bot and Wider-search bot. The policy query selects the frozen candidate in solver/policy-lab/resume-frozen-candidate.js through its original chooser and target-stop runner. Both list and per-board responses identify the selected policy. The cache includes policy, level and seed. Play and retry keep the existing seeded human game; result polling retains the selected policy. Existing human attempts can be compared to either opponent and remain ordinary play captures.

Preview: http://127.0.0.1:8290/nemesis.html?policy=wider-search

## Verification

- New real HTTP integration test first failed because policy identity was absent; after implementation the play-server and Connections capture tests passed (five tests).
- The HTTP test compares the served wider-search result with the original frozen candidate runner on a historical played seed, verifies the shipped reference, switches back through the same server cache, tests policy metadata and rejects an unknown policy.
- Experiment gate: PASS. No experiment protocol, candidate, engine, game, shipped bot or sealed evidence was changed.
- Native Chrome rendered the selector. The live API returned policy metadata and the recorded board list; native Chrome subsequently showed the wider-search goal banner and the seeded Level 1 game before its first move.
- Native mobile-width testing was not performed; the selector uses a full-width control inside the existing responsive container. The owner interacted with the preview during validation; no active game was reset.
- Simplification: reuse, quality and efficiency passes ran sequentially in the main context under the user tool mapping. No behavior-preserving simplification was needed. Manual correctness review repaired stale list errors so a superseded request cannot overwrite the current selection.
- Code review: skipped (ce-code-review unavailable). The focused review requires an independent peer/context; the user tool mapping requires subagent work to run sequentially in the main thread. A manual diff scan covered policy routing, target-stop semantics, cache separation, query preservation and request races. Independent GitHub Codex review remains required before merge.

Blackboard reviewer: owner. Submission is not acceptance.

## Full-suite boundary

The full suite ran: 764 tests, 758 passed, five failed and one skipped. The three documented receipt/Universe Map failures remain. An unrelated merged-trust fixture fails because this machine initializes repositories on main and the fixture then attempts to create main again; a separate focused run reproduced that error. The benchmark inventory assertion observed a new owner capture during its run (the initial collected panel and later file count differed); this preview capture remains untracked and excluded from the commit. Its required single-recording benchmark completed successfully. No full-suite green claim is made.

No lint/typecheck runner is configured (this repository has no package.json). Git diff --check and focused runtime tests supply local code checks.

## 2026-10-08 technical review follow-up

The original implementation and verification report above is retained. [NEMESIS-PR68-REVIEW](NEMESIS-PR68-REVIEW.md) records reproduced HTTP blocking and partial-seed behavior, bounded execution/cache corrections, new request-ordering checks, fresh independent Codex runtime approval, and the full-suite limitations. Owner review remains open; no scientific standing or shipped-default change is assigned.
