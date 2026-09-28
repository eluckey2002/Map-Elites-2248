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
3. **Every check the protocol declares gets a section of its own in
   `report.md`, and that section states an outcome** — PASS, FAIL, SUPPORTED,
   FALSIFIED, INCONCLUSIVE or BREACH. Declare C1, C2, C3, P1, P2, P3 and the
   report answers all six. A prediction that came out badly cannot be quietly
   dropped. Until 2026-09-01 this checked only that the check's *name* appeared
   somewhere in the report, which a report could satisfy while answering
   nothing.
4. While `status: registered`, the `version_freeze` hashes still match. If a
   frozen file moves before the run, the record is invalid — supersede it,
   never edit it. This is what invalidated `chain-offer-v1`. The freeze that
   is checked is the one in the **registration commit**, and the working-tree
   copy must equal it; a freeze rewritten after registration, committed or
   not, is refused by the guard and flagged by the gate. A freeze that is
   empty or still holds template placeholders is refused, not skipped. Once
   `status: complete`, the freeze is instead checked against the artifact:
   every hash in its `sources` must be one the protocol froze, which stays true
   after a frozen file legitimately moves on.
5. A protocol marked `status: complete` has a report.
6. **Every path-shaped `.json` citation in the ledger resolves and parses** —
   for grandfathered records too. Grandfathering waives the protocol
   requirement, not the requirement that a receipt be a real file.
7. **An artifact that publishes an `artifactIdentity` still hashes to it**, and
   a non-exploratory `registration.protocolCommit` is a real commit, reachable
   from HEAD, that carries this protocol and precedes the report commit.
8. **Every retained closure with `closure_status: INVALID` or `UNVERIFIED` has
   exactly one row in [`FAILED-RUN-LEDGER.CSV`](../FAILED-RUN-LEDGER.CSV).**
   The row names where the run failed, why, its evidence, and an implemented
   prevention artifact plus the test that proves the prevention can fire.

A valid `FALSIFIED` hypothesis or `INCONCLUSIVE` domain outcome is not a failed
run when its closure is `CLOSED`. Likewise, an intentionally failing mutation
or qualification control inside a `CLOSED` run is not a failed run. The closure
receipt, not a grep over report prose or exit codes, is the source of this
classification.

Each of 3, 4, 6, 7 and 8 has a card in [docs/CHECK-CARDS.md](../docs/CHECK-CARDS.md)
whose `Does NOT catch` list is the honest limit. Read those before trusting a
green gate.

## Writing one

Copy `TEMPLATE.md`. It is derived from
`.orch/runs/chain-offer-2026-08-23/preregistration.md`, which remains the
worked example — read it before writing your first one.

Register the protocol and **commit it before the experiment runs**. A
protocol committed after its evidence is not a preregistration; it is a
reconstruction, and the one property that makes preregistration worth
anything is that it predates the data.

For a one-shot paired comparison, persist the complete raw paired artifact
before applying a verdict. Use `tools/persist-before-verdict.js`; a thrown
verdict must leave every pair available for diagnosis. After a retained failed
closure, add its ledger row and prevention test before expecting the experiment
gate to pass.

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

Burned ranges are listed in [SEEDS.md](SEEDS.md); a new protocol declares
its ranges there before it runs.

If a future session genuinely resents the absence of a hatch on a real case,
that is the evidence to reopen this. Anticipating the need is not.
