# Delivery · Staggered — ready for owner play

Producer: codex. Reviewer: owner. Standing: submitted, not self-accepted.

## Authority and design

Owner approved a bounded Delivery design/play cycle after consolidation. New
isolated layout explores timing within the owner's build-and-harvest baseline,
not a new baseline strategy. Exact decision scene is in the prototype README:
equal-score builds land at different heights, and clearing the bottom first
changes alignment while leaving a checked recovery. No prior rules/UI edited.

One deliberate config change beyond layout: refills through 128, applying the
owner's earlier wider-pool request. This is disclosed in the play card and docs;
the play is not a controlled attribution between layout and refill changes.

## Deliverable

`prototypes/delivery-sequence/`, live at http://127.0.0.1:8282.
Rules identity: a6596b88bcfb26258c8f0934885d43dc4c38e3d87ad7035dc20f42206df02b11.
Same eight-move allowance, chain rules, parcel objective, preview/live sum/undo.
Owner sessions are isolated; test HTTP captures use temp directories.

## Checks actually run

- New model test first failed when implementation was absent.
- 25 scoped tests passed across new variant, trio and Pair Drop, including real
  loopback capture, served browser model parity and invalid-input rejection.
- All three stored routes deliver using initial/built material without selecting
  a refill. Short opening enumeration includes refill, catches a known easy
  control, and throws on deliberate aggregate-bound exhaustion. No one/two-move
  win found on this exact opening. No general human-difficulty claim follows.
- Actual new page and shared app executed through the existing DOM stand-in:
  board load, live sum, preview, three merges, win, undo and restart passed.
  The harness first lacked URLSearchParams; corrected its VM context and reran.
- HTTP checks on the running 8282 page/assets pass. Eight previous live rule
  identities match the preserved checkpoint. Syntax and whitespace checks pass.
- Initial socket checks were sandbox-denied; scoped loopback escalation allowed
  the passing HTTP tests and server startup. No active owner browser controlled.

## Review and boundaries

One low-cost read-only agent checked surface/dependencies and later correctness.
It found no route-tagging, DOM-ID or capture defect, but noted a per-state search
bound could multiply work. The test now shares an aggregate bound across the
whole search and explicitly tests exhaustion. Main agent was sole writer.

Native rendered layout, screenshots, browser console and touch input remain
unverified; prior browser permission/tool limitation was not retried or bypassed.
This is a prototype checkpoint, not completed archetype collection, accepted
difficulty result, policy experiment or production release. No commit/push/merge.
PDL-018 records preparation, not an invented owner outcome.

New local preservation checkpoint: workspace
`preservation/delivery-sequence-20261002/`; original consolidation archive is
untouched. Its verification receipt records restoration after archive creation.
Await owner play: did clearing order create a decision, or another obvious route?

## Owner-play update — 2026-10-02

PDL-019 records the owner calling Staggered much better, not obvious, reporting a
first-attempt loss, and saying that helped planning. Working disposition is to
retain the board as a reference, not automatically increase difficulty. This
update records conversation feedback only; no capture was matched/replayed and
no formal task or collection acceptance was inferred. Gameplay is unchanged.
