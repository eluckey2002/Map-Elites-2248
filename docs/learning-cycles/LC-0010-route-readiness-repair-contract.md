# LC-0010 — route-readiness assessor repair contract

**Frozen:** 2026-09-28, after LC-0009 was closed `INVALID`, before the
corrected assessor was implemented or rerun

**Status:** frozen exact-trajectory repair verification

**Consuming decision:** recover the exact eight-arm route-readiness timeline
that LC-0009 attempted, while preventing the observed partial-prefix
classification defect. This is an outcome-aware repair verification, not a
blind discovery or evidence about unseen games.

## Question

When every simultaneously present consecutive pair is judged at its original
position in the frozen correction route, when do the eight LC-0008 correction
routes first become executable, and which exact nodes or links are absent
before then?

## Frozen correction

For consecutive direct inputs at frozen indices `i-1` and `i`:

- when `i == 1`, the values must be equal;
- when `i > 1`, the right value must equal or exactly double the left value.

The rule uses `i` from the complete frozen `inputNodeIds` order. Missing earlier
inputs may not renumber a later pair. All other LC-0009 readiness conditions,
panel members, replay paths, continuations, output fields, disposition rules,
and interpretation boundaries remain unchanged.

## Known exposure and allowed claim

LC-0009 already exposed that seven arms appeared first-ready at their
correction continuation and the move-11 owner arm appeared ready one move
earlier. It also exposed three false missing-value links in the move-9 champion
arm. LC-0010 may verify, reject, or leave those exact observations unverified;
it may not present them as blind findings.

A closed result may claim only exact deterministic replay facts for these eight
named arms. It may not infer that waiting was optimal, define a policy feature
or metric, search alternatives, generalize to other boards, or authorize a
champion change.

## Panel and disposition

Replay owner and champion at owner moves 4, 6, 9, and 11 through the frozen
LC-0008 correction continuation. The disposition is:

- `REPAIRED_TIMELINE_CONFIRMED`: all eight correction routes are executable at
  their correction continuation; later present pairs are classified by frozen
  position; the three LC-0009 false links disappear; and the recomputed summary
  byte-matches the retained summary.
- `REPAIRED_TIMELINE_CHANGED`: the corrected, fully verified exact timeline
  differs in any first-ready continuation from LC-0009.
- `UNVERIFIED`: any identity, replay, route, readiness condition, or required
  control is missing or inconsistent.

Both confirmed and changed outcomes are admissible. The full corrected raw
timeline is primary evidence.

## Controls

### C1 — frozen ancestry and replay identity

Every LC-0008 source, graph, recording, ruleset, champion, panel cell, and
continuation must match its frozen identity and replay exactly.

### C2 — invalid predecessor retained

The LC-0009 analyzer, raw artifact, and `INVALID` closure must match the hashes
below. Qualification must observe the three known false links in that retained
raw artifact; the predecessor may not be rewritten or discarded.

### C3 — ready route known-good

The real public assessor must accept a legal `8-8-8-8-16` route through the
engine chain-validity seam.

### C4 — missing node known-negative

Removing one direct input must keep readiness false and name that exact node.

### C5 — broken adjacency known-negative

Separating a correctly valued consecutive pair must keep readiness false and
name that exact pair.

### C6 — partial-prefix valid-double regression

On a frozen `8-8-16` route, remove the first `8` while leaving the later
`8-16` pair present and adjacent. Readiness must remain false because the first
node is absent, but `8-16` must not appear in `missingValueLinks`. A planted
implementation that renumbers filtered live inputs must fail this control.

### C7 — planted false-ready mutation

The public claim validator must reject a true missing-node observation relabeled
as ready while retaining its missing-input evidence.

### C8 — restoration and persistence

The assessor identity must be unchanged after controls, and a planted
post-persistence interpretation failure must leave a complete disposable raw
artifact.

## Qualification and run bounds

The implemented analyzer, focused test, this contract, all frozen inputs, and
the retained LC-0009 failure evidence must be bound in one generated manifest
and committed before qualification. Qualification must prove C1-C8, reject a
coherently rehashed changed-input manifest against an external expected
identity, exercise the real closeout verifier with disposable artifacts, and
confirm the reportable raw and recomputation paths are absent.

After qualification, run exactly one deterministic eight-arm collection and
one registered recomputation. Persist before interpretation, close once, and
stop. No alternative route, chain, seed, horizon, ordering, metric, threshold,
or policy may be tried.

## Frozen identities

- Source revision: `3ed20f71ed7493bd4ffa65cb0791bed06351916d`.
- LC-0009 contract SHA-256:
  `c247d8918afffb877eb3737aa9f4694076102f7484861bbddaac73e10c4c1204`.
- LC-0009 manifest file SHA-256:
  `da12d7118a1254d36e60f112c0b35643be8a04e12c60b404c9f9737b578502c3`.
- LC-0009 qualification SHA-256:
  `f68d56e34c945a53d5f60d151dbb888aa6a123d3b79cc07c5efca43b2d26cd9d`.
- LC-0009 invalid raw SHA-256:
  `ce91a98dfd011b35de693dd8f047874c0a0a279e928562fc3e0fbc0de92c6d63`.
- LC-0009 invalid closure SHA-256:
  `6fa0b343fc8708fe85f77aa389616628064abbd512edc05cf4f6a35517acc30f`.
- Failed LC-0009 analyzer SHA-256:
  `c4c717cd722f62aedf621733bc740713762804c2352673368379cdbced26a060`.
- Failed LC-0009 focused test SHA-256:
  `3b06197e9f21332c7a39dbc34e5f63320b896230237d5531275a2d7cb7caf49c`.
- Ruleset `solver/engine.js` SHA-256:
  `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`.
- Champion `solver/bot.js` SHA-256:
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`.
- Recording SHA-256:
  `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`.

The corrected analyzer, focused test, manifest, and closeout-contract identity
slots are intentionally empty until implementation. They must be committed
before qualification; this contract does not change.

## Protected boundary

Do not modify `solver/bot.js`, `solver/engine.js`, `src/game.js`, any level,
target, receipt, recording, authoring file, or prior learning-cycle artifact.
