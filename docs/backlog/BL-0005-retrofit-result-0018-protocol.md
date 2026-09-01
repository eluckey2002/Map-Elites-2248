---
id: BL-0005
title: Register a protocol for RESULT-0018 and re-run its holdout
status: deferred
milestone: experiment-discipline
depends_on: []
updated: 2026-08-31
---

# BL-0005 — Register a protocol for RESULT-0018 and re-run its holdout

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here upgrades a claim.

## READ THIS FIRST or the run measures nothing

`solver/target-aware-evaluation.js` compares `chooseMove` (champion) against
`chooseTargetAwareMove` (challenger). **`chooseMove` is now the challenger.**
`DECISION-0004` promoted the target-aware policy into `solver/bot.js` at commit
`b82a9b6`, so today both arms are the same policy and a naive re-run produces a
null result after ~30 minutes of compute.

The pre-promotion chooser is exported as `chooseBaseMove` from `solver/bot.js`
for exactly this reason. The champion arm must use it. Making that change is
part of this work and belongs in the protocol's "change under test" section —
it is a measurement fix, not a silent edit.

Evidence the two differ, already pinned in
`solver/tests/targetAwareChallenger.test.js`: on Level 51 seed 1,
`chooseBaseMove` takes 17 moves for 125,952; the target-aware chooser takes 13
for 130,048.

## Why this is open

`DECISION-0004` shipped a bot change on the strength of `RESULT-0018`, which
was accepted before the experiment gate existed and is therefore grandfathered
in [experiments/GRANDFATHERED.md](../../experiments/GRANDFATHERED.md). It is
the only shipped change resting on an unprotocolled result.

Nobody doubts the measurement — 15,600 paired games, zero champion-win
regressions, faster cases on all 52 levels. The gap is narrower: if asked "how
do you know the analysis was not shaped by the outcome," today's honest answer
is "we checked afterward."

## What the original run did, for the protocol to restate

- Screen then sealed holdout; holdout was 52 levels x 300 seeds = 15,600 paired cells.
- Holdout seeds 13,000,000-13,000,299. Screen seeds are disjoint; keep them so.
- Source hashes recorded at run time: champion `9abe8ca8...`, challenger
  `ba75b5a6...`, engine `4e2323b9...`. The champion hash will differ now — that
  is the promotion, and the protocol must say so rather than hide it.
- Original findings to predeclare against: 9,354 existing wins made faster,
  6,186 tied, zero made slower, zero champion-win regressions, 9 champion
  losses converted to wins, mean saving 1.271 moves, challenger compute 1.45x.

## Procedure

1. Start from a clean checkout of `main`. `node tools/verify-repo-baseline.js`
   must pass before anything else.
2. `node tools/new-experiment.js RESULT-0018` — registers and commits the
   protocol skeleton with real HEAD and file hashes. The id is free; it has
   never been registered.
3. Fill in `experiments/RESULT-0018/protocol.md` from
   `experiments/TEMPLATE.md`. Declare the controls and predictions **before**
   running. `.orch/runs/chain-offer-2026-08-23/preregistration.md` is the
   worked example. Amend the registration commit while still drafting.
4. Point the champion arm at `chooseBaseMove`. Declare it in the protocol.
5. Run the screen, then the holdout once:
   `node solver/target-aware-evaluation.js --holdout --out <path> --protocol RESULT-0018`
   The guard refuses to run without `--protocol`. The artifact records the
   protocol's commit, which is what proves the plan predated the data.
6. Write `experiments/RESULT-0018/report.md` resolving **every** declared
   check by name. The gate fails on any C or P label the report does not
   answer — including one that came out badly.
7. Update `RESULT-0018` in the ledger to cite the new artifact, remove it from
   `GRANDFATHERED.md`, and note in `DECISION-0004` that its evidence is now
   reproducible. Regenerate the Universe Map (`node tools/build-universe-map.js`)
   because the ledger hash moves.
8. All four gates green: `verify-loop`, `verify-universe-map`,
   `verify-repo-baseline`, `verify-experiments`. Suite at 265/268 — the three
   receipt failures are known, decided, and must not be "fixed."

## If the re-run disagrees with the original

Report it. Do not reconcile it, do not re-run on fresh seeds to get a cleaner
number, and do not quietly widen a threshold. A disagreement is a finding about
`RESULT-0018` and possibly about `DECISION-0004`, and it is the owner's call.
The stopping rules in the protocol must say this before the run starts.

## The trigger

The holdout is ~30 minutes of unattended compute. Owner's condition, 2026-08-31:
**run it when there is a spare half hour of other work** — it occupies a
machine, not a person. Not blocked on any decision.

## Not to be done instead

- Do not write the protocol without re-running. A protocol authored after the
  outcome is a reconstruction; the gate rejects one committed with or after its
  own report.
- Do not revert the bot change to satisfy the rule. It works, every gate
  passes, and removing shipped behavior to tidy a record written afterward is
  the wrong trade.
- Do not drop `RESULT-0018` from the grandfather list without the re-run. That
  list is the record that this exception exists.
