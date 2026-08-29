# Evidence and navigation reconciliation

- **run:** `2026-08-29-bounded-measurement-baseline-stabilization`
- **objective:** The ledger, current-work page, and generated Universe Map agree on the shipped Level 53 standing, the admitted fixed shared-axis MAP-Elites artifact, the stabilized authoring baseline, and the unchanged champion/proof boundaries.
- **routing:**
  - **pack:** `orch-content-pack`
- **audience:** The project owner and future agents deciding what evidence is accepted and what work is actually next.
- **voice contract:** Plain, direct, evidence-first, and explicit about proof class. State the outcome before detail. Never use a bot result as human-strength evidence, an artifact hash as an empirical conclusion, or a verified source-presence receipt as entailment.
- **length budget:** At most 1,200 added ledger words across two records and snapshot reconciliation; keep `CURRENT.md` under 900 words; generated views follow their existing templates without hand-added prose.
- **citation policy:** Every ledger claim cites a primary repository path plus fixed identity, revision, replay command, or verifier receipt. Navigation links to ledger records. Generated Universe claims resolve from the selected ledger record and fixed artifact/verification hashes. Preserve exact proof-class labels.

## Outline

1. **Ledger adjudication:** append one Level 53 result and one shared-axis MAP-Elites result; update only the current snapshot/resume boundary needed to make their standing discoverable.
2. **Current navigation:** replace the stale generator-choice account with the observed 53-level, generator-present, `calib-1`-wired, Level-54-retired baseline; retain the exact-proof parking and unresolved human-margin statements.
3. **Universe projection:** bind the accepted MAP view to the new ledger record, update the tests from “verified-only” to “ledger-admitted,” retain the six-level/12-level evaluation-universe warning and zero-positive-holdout frontier, regenerate all views, and verify byte stability.

## Acceptance

1. **Level 53 is admitted without treating stale measurements as current.**
   - Oracle: a new ledger record identifies shipped configuration and three replayed human wins as `direct_source`/`owner_decision`, marks the historical receipt's bot measurements stale under current input identities, and does not quote them as current performance.
2. **The fixed MAP artifact is admitted at its exact scope.**
   - Oracle: a new accepted result binds archive SHA-256 `ab8ed417...`, map SHA-256 `a94fc614...`, verification SHA-256 `701d0c5f...`, runner/verifier revision `8508c3b...`, 23/25 exact shared-axis occupancy, three exact replays, zero positive representative holdout lifts, and unchanged champion. Proof class remains `heuristic_observation` for policy/search observations and `direct_source` for identities/replays.
3. **Navigation states the stabilized baseline, not an invented roadmap decision.**
   - Oracle: `CURRENT.md` says Level 53 ships, the generator exists, new authoring uses `calib-1`, the unshipped stale Level 54 candidate is retired without replacement, and the latest MAP artifact is ledger-admitted without champion promotion. It does not select a new experiment or change the active milestone beyond the approved stabilization.
4. **Universe Map agrees with the ledger and retains limits.**
   - Oracle: `node --test solver/tests/universeMap.test.js` and `node tools/verify-universe-map.js` pass; generated Markdown shows `RESULT-0019` and 23/25 as admitted, contains no artifact-admission or stale-current warning, still exposes six selection levels, 12 holdout levels, zero of three positive representatives, and unchanged champion.
5. **The result is append-only and scope-clean.**
   - Oracle: prior ledger records remain present and unchanged except the current snapshot/resume boundary; `git diff --check` passes; changed content paths are limited to `EVIDENCE_LEDGER.md`, `CURRENT.md`, `universe/contract.json`, `solver/tests/universeMap.test.js`, generated `UNIVERSE.md`, `universe/resolved.json`, `universe/map.html`, `docs/CHECK-CARDS.md`, and run/ticket bookkeeping.

## Binding evidence

- Predecessor code revision `d6ceb964986fed5dc8625394de98753ef51239c4` and T-001's verification result.
- Level 53 primary state: `src/game.js` SHA-256 `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee`; candidate identity `043ca53f234d4092202677b3e48a1855c0194c208742bba94a2c75ebd2227f16`; candidate/receipt file hashes `0b046cfe...` and `261ad85e...`; T-006 and three replayable recording files.
- MAP artifact: archive `ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22`, map `a94fc61469d36ab672bcb4722f1b08d628f9bee7d0137dfe0f4afb3568d7a0fb`, measurement `701d0c5f365ce615e1556a0497442ca79fd11babff96b0e8e87534c589911790`, synthesis `401665cf9f3a2a863e0650759e729306a4e3cf4b8b5859f431446c44d7101c61`, runner/verifier `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`.
- Deterministic source-presence receipts run on 2026-08-28 verified the Level 53 source entry, T-006's “3 playthroughs, 3 wins,” the 23-cell verifier PASS line, and the absence of a positive representative holdout lift claim. These establish presence only; the content review owns interpretation.

## Non-goals

- Do not change game rules, levels, targets, solver behavior, experiment artifacts, acceptance thresholds, champion identity, or backlog disposition.
- Do not claim repeatability, full behavior-space coverage, a stronger policy, current Level 53 bot win rate, or a quantified human-skill margin.
- Do not rerun evolution, generate a level, or choose the next experiment.

## Bound

- Three sequential content slots and one assembly pass; no external research.
- `plan_gate: false` — the owner approved only the four stabilization changes.

