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

CORRECTION-0018 is an append-only supplement following actual Codex review
5393741165. The repaired independent audit reconstructs the frozen adaptive
mutation stream, verifies parameter hashes/ranges and enforces complete
panel grids. recompute-reviewed-output.txt prints MATCH and two additional
late-Level-52 replay matches, completing the allowance of eight together
with the original six. No further game replay or confirmation is authorized.

full-summary.json and full-summary-output.txt retain and print both win and
move uncertainty axes for every paired panel, derived with the registered
core from the sealed source. independent-full-summary.json derives all fields
without producer imports; full-summary-match-output.txt prints MATCH FULL
STATISTICS. The original raw artifact and headline schema remain unchanged.
Six new regression tests pass in review-regression-output.txt, including
tampered mutation identity, incomplete stage-2 grid, replacement/refusal
counting and negative infinite t. The replacement qualification fixture is
explicitly synthetic, traverses every current recompute path, and must be
rejected as confirmation evidence. The historical fixture is preserved.

### C10 — close-out gates

The reviewed local close-out passes its unchanged oracle: 608 tests, 602 pass,
five fail and one existing skip; the failure names equal the baseline exactly.
reviewed-closeout-tests.txt and reviewed-closeout-output.txt retain the suite
and boundary checks. Both complete earlier suites are also retained under
docs/goals/trustworthy-ruler/. The first close-out attempt started before the
metadata gate finished and captured three ledger-schema failures. Its output
is preserved in closeout-tests-before-schema-repair.txt. No existing test was
modified or skipped.

The corrected experiment gate, ledger authorship gate and generated index
check pass. RESULT-0058 and CORRECTION-0018 are provisional with written_by
and no checked_by; CURRENT.md cites both records and both touched backlog
Histories have append-only updates. The close-out outputs record protected
files, existing tests, the seed prefix, History-only changes and effort counts.

Publication is PR #61. The first Codex review completed with six findings;
CORRECTION-0018 records their implementation and regression evidence. The
finish condition still requires a fresh actual Codex verdict and a green
experiment gate after the repair push. print-publication.js reads that state
live when print-report.js runs; it never substitutes a saved pending review
for completion. The PR must remain open and unmerged.
