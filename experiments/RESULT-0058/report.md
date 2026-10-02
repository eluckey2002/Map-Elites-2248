# RESULT-0058 — paired target-race ruler

The one confirmation run is sealed. Its domain outcome is **FALSIFIED**.
The ledger standing will remain provisional. No policy is adopted.

### C1 — start state

PASS. The starting state and named baseline failures are recorded in the
committed protocol and baseline-output.txt under docs/goals/trustworthy-ruler/.

### C2 — null control

PASS. The retained null-raw.json and run-output.txt contain the exact A/A result.

### C3 — positive control

PASS. The retained positive3000-raw.json and run-output.txt contain the paired
interval and the disjoint-screen sign frequency.

### C4 — known-bad pilot

PASS. The copied pilot was cut at stage 1; see bad72-raw.json and run-output.txt.

### C5 — synthetic admission

PASS. The named tests and raw output are retained in admission-output.txt.

### C6 — winner's-curse table

PASS. All thirty screen/fresh rows are retained in raw-games.json and printed
in run-output.txt. There is no passing bar on the gap.

### C7 — legacy staging smoke test

PASS. The older stored-score comparison is printed in run-output.txt.
Only six holdout points exist; tied-win decisions lack moves-to-target.

### C8 — MAP run and fresh recheck

INCONCLUSIVE for the protocol's physical-CPU wording. The owner's
games-and-elapsed-seconds output is complete in timing-output.txt, including
each candidate at every reached stage. The run evaluated all 120 mutants in
the frozen 5x5 map and produced no stage-3 nominee. Fresh admission and final
holdout were not reached and are UNVERIFIED_NOT_RUN. The frozen cpuSeconds
field is summed elapsed worker time, not a physical CPU measure; physical CPU
seconds are UNVERIFIED. The stronger-policy rule did not hold. No timing
threshold or policy-admission check was changed to accommodate this naming
defect.

### C9 — independent recomputation

PASS. recompute-output.txt prints MATCH for items 3, 4, 5, 7 and 9,
including six deterministic game replays. legacy-recompute-output.txt prints
MATCH LEGACY for item 8. Neither script imports a producer module. The main
recompute imports only Node builtins, solver/engine.js and solver/bot.js, using
level definitions and policy parameters from raw-games.json. The separate
legacy check reads the older stored-score corpus and frozen shipped targets.

The sealed raw file's SHA-256 is recorded in seal-output.txt. All twenty frozen
sources matched the registration before repair. After sealing, a new synthetic
boundary test demonstrated the rounded-t defect and the helper was repaired
to decide on unrounded t, retaining the threshold t > 3. The negative and
positive test outputs are boundary-before-output.txt and boundary-after-output.txt.
The repair flips no collected decision. The immutable run still identifies
registration commit 577163495b0e5bde2c34c6e7a59ed1189a44bb8e; raw games were
not edited or rerun.

### C10 — close-out gates

INCONCLUSIVE while publication and Codex review are pending. The final local
suite prints 602 tests, 596 pass, five fail and one existing skip; the failure
names equal the baseline exactly. Both complete suite outputs are retained
under docs/goals/trustworthy-ruler/. The first close-out attempt started before
the metadata gate finished and captured three ledger-schema failures. Its
output is preserved in closeout-tests-before-schema-repair.txt; the corrected
suite is closeout-tests.txt. No existing test was modified or skipped.

The corrected experiment gate, ledger authorship gate and generated index
check pass. RESULT-0058 is provisional with written_by and no checked_by;
CURRENT.md cites the record and both touched backlog Histories have append-only
updates. closeout-output.txt records the protected-file, existing-test,
seed-prefix and History-only checks. PR checks and completed-review evidence
are UNVERIFIED until publication.
