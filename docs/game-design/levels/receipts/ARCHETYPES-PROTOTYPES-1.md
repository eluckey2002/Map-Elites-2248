# ARCHETYPES-PROTOTYPES-1 — first playable checkpoint

Producer: codex. Reviewer: owner. Date: 2026-10-01.
Standing: submitted design prototypes; not owner-accepted or scientific evidence.

The owner replied “Honestly any of them sound fine” to the concept checkpoint.
Codex selected Gates, Delivery and Feeder Choice and implemented all three in
`prototypes/archetype-trio/`, under branch `codex/archetype-design-20261001`.
This records delegated selection, not a reviewer verdict on the prior task.

Play: http://127.0.0.1:8274. Run command and complete details:
`prototypes/archetype-trio/README.md`.

## Acceptance status

- All three locally playable: implemented and rendered in Chrome.
- Exact mechanic contrasts: checked switch endpoint, parcel endpoint and
  packet-specific follow-up chains in the authored boards.
- Legal wins: deterministic witnesses pass for Gates (3 moves), Delivery
  (4 moves), Feeder Choice (5 moves). These are feasibility examples only.
- Reset/replay capture: deterministic rules tests, actual HTTP persistence
  test, and browser actions read from disk and replayed. Three current-model
  sessions replayed; one contains the browser merge and undo. One earlier
  empty-play record uses the retained superseded board model and is not
  represented as a current-model replay.
- Desktop: inspected all three views and exercised Gates selection, preview,
  merge and undo. Narrow desktop layout inspected.
- Mobile: responsive styles implemented; phone emulation/touch UNVERIFIED.
  External UI change interrupted emulation setup. No claim of a full mobile
  or end-to-end winning UI test.

Final command:
`node --test prototypes/archetype-trio/model.test.js prototypes/archetype-trio/serve.test.js`
Result: 11 passed, 0 failed. Syntax checks and `git diff --check` pass.
No production release review/full repository suite at this design checkpoint.
No shipped rules, levels, solver engine or bot changed.

## Owner checkpoint

Which mechanic changed a decision from ordinary build-and-harvest, and did
that feel worthwhile? Keep/revise/retire each after play. Novelty and enjoyment
remain unjudged. Then refine retained concepts, provide contrasting variations
and authoring guidance. No merge, release or policy-research resumption implied.
