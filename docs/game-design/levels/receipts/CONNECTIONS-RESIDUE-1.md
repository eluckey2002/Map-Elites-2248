# Connection Run residue diagnosis — 2026-10-02

Producer: codex. Reviewer: owner. Standing: submitted, diagnosis only.

## Intake and bounded finding

Owner reports extended play accumulating non-power-of-two tiles that are hard
to use. PDL-027 pins the wording. This is a late material-lifecycle concern,
not a revoked concept endorsement or a reason to restore the family quota.

Used diagnosing-bugs with an actual captured replay and concrete legality
controls. Full-board inevitability was not reproduced; the exact observed
component is stranded non-power residue while ordinary play remains possible.
No runtime fix or rule change authorized/implemented.

## Frozen evidence and feedback loop

Workspace `preservation/connections-residue-20261002/` contains an immutable
copy of the local save at 22:46:14.965 UTC, copied core/shared/mode rules and
`probe.js`. The rules' computed identity matches the capture:
`5bf20e44309a717cb1ebb8d3175883b67a729cca721ca6d1c4cd3767cff03cf4`.
The live save advanced between initial inventory and freezing; the diagnosis
uses only this coherent frozen 41-action version, not the earlier 39-action view.

Executed `node preservation/connections-residue-20261002/probe.js` from the
outer workspace: PASS, exact replay repeated twice, three completed goals,
board 0, 30 tiles. The 96, 288 and 18 have no current legal complete-chain
participation; exact family enumeration visited eight nodes, below its bound.
Ran again with `--assert-no-stranded`: expected exit 1, `3 !== 0`.
This diagnosis assertion is not an adopted CI gate or a completed repair.

Constructed controls pass: isolated 96 cannot join the adjacent power chain;
the power chain itself remains legal; `96 → 96 → 192` is legal; ordinary
`32 → 32 → 32` creates 96 without completing a goal. Skip preserves the grid;
New board resets to the configured power values. Prefix replays identify the
18 at action 4 and 96 at action 40 as ordinary results, and 288 at action 22
as completion of objective 3. Constructed cases are not human play evidence.

An earlier probe's printed repeat flag described two validator checks, not
two replays. Logged that mismatch; the preserved final probe actually replays
twice. No source game or saved owner action list was edited to satisfy checks.

## Mechanism and bounds

The ranked checks were: target cadence, refill incompatibility, and later-goal
reuse. Source confirms all contribute to the design gap:

- BANK prefers a non-power result on every third card; this is a one-point
  ranking preference below mode/span, not a forced generation guarantee.
- Normal completion leaves the sum survivor. Equal/double chain rules require
  compatible value families. Every normal refill is a power of two; natural
  partners for singleton non-power families cannot appear from refills.
- Issue chooses currently legal chains or one-setup witnesses, with no
  special stranded-material recycling or duplicate-building objective policy.

Separately building compatible values can make a residue usable. Non-power
tiles are not universally or permanently dead. The mathematical constraint is
that equal/double chains keep a common odd factor; that nontrivial odd factor
also divides their sum, so merely merging that family does not turn it back
into power-of-two material. It can consolidate several tiles, not normalize them.

The old 32-completion and 26-completion HTTP tests allow explicit board resets
when no objective is available; inspected source, did not rerun those tests.
They do not assert single-board endurance or absence of residue. No general
difficulty, inevitable saturation, population trend or strongest-bot result.

## Handoff

Sustained-play close-out needs a material-lifecycle decision. Target selection
alone cannot cover ordinary non-power merges. Consuming goal results would
change the earlier objective-only-observes contract and would not by itself
address ordinary residue. Keep the non-power discovery benefit in view while
considering an in-board reuse/retirement mechanism or a deliberately bounded
round structure; none is selected here. No production adoption, commit or push.

Current navigation and README now flag the gap. Prototype source and owner
play remain unchanged; no servers stopped/restarted and no browser fallback.
Submit for owner review; do not self-accept or label the prototype wrapped.
