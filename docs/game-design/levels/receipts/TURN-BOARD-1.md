# Turn the Board play checkpoint

Producer: codex. Reviewer: owner. Standing: submitted, not self-accepted.

## Authorization and result

Owner selected the previously proposed Turn the Board reserve with "sure"
after parking the current Feeder Choice design. Question: does spending a move
to change gravity create a worthwhile alignment choice within the owner's
build-and-harvest play?

One isolated prototype at `prototypes/turn-the-board/`, running on
http://127.0.0.1:8284. Target 550 points in eight actions. Quarter-turns settle
existing tiles, cost one action, earn no score and persist as the direction
for later merges. Both full-board previews are free. Chain preview, live sum,
undo, restart and authoritative local replay/capture remain available.

Used ce-prototype's driving/state workflow. Kept the existing game controls
and replay server rather than introducing an unrelated annotation helper; the
missing replay/capture fit was logged. The prototype remains isolated.

## Essential space convention

Changing gravity cannot move a full rectangle. Announced before implementation:
17 tiles and eight persistent open cells; merges replace only removed material
in affected lanes, turns add none. Empty cells are usable space, not walls.
Gravity and sparse occupancy are tried together, not isolated causally.

The authored scene gains a large alignment while breaking a ready smaller
chain. Clearing first changes later preparation. Both stored winning routes
use only initial/built material, and the ordinary opening harvest also leaves
an ordinary follow-up. Neither route is declared globally better or shown on
the game page. PDL-024 and the prototype README record the exact scene.

## Verification actually run

- Ten tests pass on the actual model, actual page/script in a DOM stand-in,
  and real HTTP server. Four-direction settling, sparse refill, cost, guards,
  preview immutability, tagged-material routes, replay/undo and captures checked.
- Both routes replay to their exact final states. HTTP tests reject bad rules
  identity, direction, chain, undo and stale revisions without changing the
  existing saved capture. Test captures are separate from owner play.
- Exact bounded opening enumeration includes merges, both turns and normal
  refills: no one/two-action win. It caught a real earlier ladder shortcut;
  known-easy and deliberate-exhaustion controls pass. No three-action exclusion,
  difficulty model or strongest-bot result claimed.
- Actual UI script exercises both turn previews, cancellation, live chain sum,
  both routes through controls, undo after completion, capture and restart.
- Syntax and whitespace checks pass. Live page/assets return HTTP 200. Rules
  identity: `6d7b7d9b7c0dd08af0619b1e8d40e775b8bc24794c994efa807cf34b034465ce`.
- All 44 earlier runtime files match the preserved Landing manifest. The two
  running earlier games retain their identities. No old game stopped or edited.
- A separate read-only cheap reviewer found no concrete correctness issue in
  settling/refill, preview/commit boundaries, guards or replay parity. It
  inspected source and test coverage; it did not execute additional checks.

Native rendering, screenshot, console and touch QA are unverified. Previously
unavailable browser access was not retried. Preview exposure is not captured;
captures record committed actions, not complete decision observation.

Main agent was the sole writer; log/reflog remained at fced429. A scoped local
checkpoint under workspace `preservation/turn-the-board-20261002/` preserves
this prototype, shared dependencies, current design/status documents and this
receipt. Its external verification receipt records manifest checking and both
routes after extraction. Per-file capture is not a transaction across live
sessions; later play is not automatically backed up. No older archive changed.

## Original owner checkpoint and remaining limits — historical

What drove turning, waiting, or clearing first? Was it worthwhile, automatic,
or just a rescue when no chain remained? Owner judgment is pending. Delivery's
two retained references remain; Connections retains unresolved work; Gates
and the current Feeder design remain parked. No accepted third family or
completion of the original 3–5-family collection inferred.

No scientific experiment outcome, production adoption, commit, push, merge,
release or remote backup. Submit for owner review, do not self-accept.

## Owner feedback and disposition — 2026-10-02

PDL-025 records the later play report: interesting but mixed between worthwhile
use and compacting/re-aligning pieces. Owner clarified they were not trying
to create a setup or strategy. After the recommendation to park this version
as an archetype while retaining rotation as a possible board-control mechanic,
the owner replied "Ok. I agree".

Park the archetype version; preserve runtime, captures and reference unchanged.
The intended planning choice did not emerge in this owner's reported play.
This is not a general rejection of rotation, a new redesign selection or an
accepted third family. No exact capture or outcome was matched. No code/tests
or servers changed during this disposition pass; prior verification remains
historical. The existing preservation checkpoint predates this update.

Formal task state remains submitted: the writer exposes accept/repair, whereas
the owner chose parking, not acceptance or a repair request. The progress writer
also permits only claimed tasks, so no progress event was added. This linked
receipt and PDL-025 carry the actual owner disposition without inventing either
workflow verdict. The collection remains unfinished and the replacement-concept
decision is open.
