# Experiments

One directory per experiment, named for the result it produces:
`experiments/RESULT-0019/protocol.md` and `report.md`. Filed under the result,
which is permanent, not under the run, which is a scheduling artifact.

## The rule

**A claim that generalizes beyond what it measured must have said, in advance
and in writing, what it was testing and what would falsify it.**

Concretely: a ledger record whose `proof_class` includes
`heuristic_observation` needs a protocol. A record that is only
`direct_source`, `exact_result`, `owner_decision`, `proven_upper_bound`, or
`replayed_lower_bound` does not — those are observations and rulings, not
experiments. You can record anything you notice, cheaply, forever. You cannot
generalize from a sample without having declared the test first.

## What the gate enforces

`tools/verify-experiments.js`, run live by `solver/tests/experiments.test.js`:

1. Every generalizing result has `experiments/<RESULT-ID>/protocol.md`, or an
   entry in `GRANDFATHERED.md`.
2. The protocol's frontmatter `result:` matches its directory.
3. **Every check the protocol declares is resolved by name in `report.md`.**
   Declare C1, C2, C3, P1, P2, P3 and the report answers all six. A prediction
   that came out badly cannot be quietly dropped, and scope that was never
   declared shows up as a check nobody registered.
4. While `status: registered`, the `version_freeze` hashes still match. If a
   frozen file moves before the run, the record is invalid — supersede it,
   never edit it. This is what invalidated `chain-offer-v1`.
5. A protocol marked `status: complete` has a report.

## Writing one

Copy `TEMPLATE.md`. It is derived from
`.orch/runs/chain-offer-2026-08-23/preregistration.md`, which remains the
worked example — read it before writing your first one.

Register the protocol and **commit it before the experiment runs**. A
protocol committed after its evidence is not a preregistration; it is a
reconstruction, and the one property that makes preregistration worth
anything is that it predates the data.

## Why this exists

Two preregistrations were written in August 2026 and the practice stopped,
because nothing required it. In that gap: a result was promoted into the
shipped bot on evidence a clean checkout could not regenerate, two ledger
citations rotted to paths that never resolved, and the repository's own
baseline guard sat unwired, proving its logic against hand-built fixtures
while never once looking at the repository.

Nothing here is new methodology. It is the methodology already written down
in `chain-offer-2026-08-23`, with a gate attached so it survives contact with
a busy week.

## Settled: there is no escape hatch

Asked and answered 2026-08-31. There is deliberately no `preregistered: false`
field, no "record it anyway" flag, and no exception for a finding that turned
out to be real. Do not propose one without new evidence.

The reasoning: an easy exception becomes the default path, and that is exactly
how the original preregistration habit died in August. Two honest routes
already exist and neither needs a hatch — record a `direct_source` observation
of the single run you actually did, which carries no protocol requirement, or
register a protocol and run it again. Seeds are cheap.

If a future session genuinely resents the absence of a hatch on a real case,
that is the evidence to reopen this. Anticipating the need is not.
