# RESULT-0040 — two fresh owner-versus-oracle boards

The run is closed **UNVERIFIED** and has no entitled primary domain outcome.
The preserved rows reduce to the preregistered `FALSIFIED` rule: the oracle won
both fresh boards, but it took 11 moves on Board 1 after the owner won in 10,
then tied the owner at 14 moves on Board 2. Those exact replayed observations
remain partial evidence. They cannot be promoted to the registered panel result
because the run artifact does not satisfy the repository's source-closure and
self-identity gate.

## C1 — pairing and assignment integrity: PASS

Each registered level/seed has exactly one selected human capture and one
oracle result. Board 1 is Level 56 / seed 41,000,000; Board 2 is Level 58 /
seed 41,000,001. Capture identities, initial puzzle identities, and report rows
match the registered challenge manifest. No row was dropped or replaced.

## C2 — deterministic replay and objective equivalence: PASS

Both human recordings and every retained oracle/current-bot witness replay
through the game engine. All four arms stop at their first target crossing.
The comparison uses win status and moves to target; score does not rank arms.

## C3 — current-bot baseline: PASS

The current bot won Board 1 in 11 moves and Board 2 in 17. The oracle retained
the 11-move Board 1 incumbent and improved Board 2 to 14, so neither current-bot
win regressed. This baseline control does not override the owner comparison.

## C4 — verifier positive and negative controls: UNVERIFIED

Challenge-specific qualification identity
`676bc91e007f838edab4eeed70326ec0ddeede3ee97a142c9308585621d40eba`
passed five tests through the public report-file seam. Real captures and known
legal witnesses passed. A false comparison confirmed on disk failed for
`comparison mismatch`; coherent challenge substitution, missing rows, and
duplicate rows also failed. The inherited oracle qualification retains its
independent process-deadline `UNKNOWN` control. However, the final report lists
post-registration adapter and capture source hashes that are not present in the
protocol's original `version_freeze`, so the repository gate cannot admit this
otherwise successful qualification as closed report provenance.

## P1 — Board 1 relationship: FALSIFIED observation

On shipped Level 56, seed 41,000,000, the owner won in **10 moves** and the
oracle won in **11 moves**. Human minus oracle is **-1**, so the oracle was one
move slower. Search plus baseline work used 22,100.894 ms inside the registered
30,000 ms budget.

## P2 — Board 2 relationship: SUPPORTED observation

On shipped Level 58, seed 41,000,001, both the owner and oracle won in
**14 moves**. Human minus oracle is **0**, a tie. Search plus baseline work used
29,852.456 ms inside the registered budget.

## P3 — panel intersection: UNVERIFIED

The panel required both P1 and P2 to satisfy the relationship. The retained rows
would reduce to `FALSIFIED` because P1 missed. The panel itself remains
**UNVERIFIED**, because the malformed run receipt is not entitled to produce a
registered domain outcome.

## Execution and evidence boundary

The owner completed the two human attempts before either oracle search ran.
The oracle then ran once per board, sequentially, with no human trace, result,
or move count in its search input. There were no missing cells, crashes,
retries, substituted boards, or budget increases.

Closure found two receipt defects: the report's `artifactIdentity` was computed
over its registration stamp while the repository gate excludes that stamp, and
its `sources` map contains qualified mechanical adapter and capture files that
were necessarily created after the original protocol freeze. The frozen
protocol anticipated binding such an adapter in the run artifact, but the
repository gate admits only source hashes covered by `version_freeze`. The
conflict cannot be repaired after outcomes are visible.

The preserved Board 1 observation is a concrete counterexample candidate to
“the current bounded oracle is always at least as fast as the owner,” but this
run cannot register that panel conclusion. It does not estimate a future-board
rate, prove either witness move-minimal, or decide what replacement policy
should be adopted. A successor must preregister the complete adapter and
capture-binding mechanism before collecting fresh evidence.

The malformed source-bound run report is retained unchanged as
`oracle-challenge-report.json`, identity
`f7708c2f9429a8e6ca6b230975df7f9cd8c3b0adef5b005c6bc7dc1b1cb0b71b`.
`primary-recomputation.json` manually reduces its rows to `FALSIFIED`, but
executable closure correctly leaves that recomputation `NOT_RUN` for an
`UNVERIFIED` record. The raw one-attempt journal is `oracle-attempt.json`.
