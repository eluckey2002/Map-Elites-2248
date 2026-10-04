# RESULT-0083 — Goal 3 revision 5, Path E

The learned-judge experiment finishes on **Path E: GENERATION BOTTLENECK** under the owner-selected prerequisite. No judge was trained or evaluated, no policy was adopted, and no confirmation ran. This is a provisional direct_source record of exact replay diagnostics and applying a fixed stop rule, not a population claim about generator quality or a finding against learned ranking.

## Item 1 — start state

PASS. `docs/goals/policy-learned-judge/start-state.json` and `start-output.txt` retain HEAD, branch, remote branch ID checks and SEEDS.md as read. PR61 is merged and its merge is an ancestor of starting HEAD 6fea334c2f5fd61a86cce4a1842cb9b03f709ee1. RESULT-0081 was already held remotely; RESULT-0082 was the highest experiment directory, so the assigned replacement is RESULT-0083. The baseline suite has five named failures, captured before the diagnostics; `baseline-output.txt`, `baseline-summary.json` and `baseline-summary-output.txt` retain their actual output. They include the stale receipts and Universe Map, plus launcher recording-path separation and a live uncommitted-orchestration-state check. No existing test or protected source is modified.

## Item 2 — historical noise, no fresh games

PASS. `noise.json` and `preflight-output.txt` print per-level paired variance and coverage, historical champion-versus-base uncertainty axes, projected panel widths and conditional detectable gains. RESULT-0049 covers all 58 levels. RESULT-0058 positive3000 cross-checks twelve levels, none beyond 52. Other table designs are informational only; the gate/recheck/control design is 58×10. Adding seeds does not shrink the level-axis error. The uncertainty estimate is conditional on historical champion-versus-base variance. A zero-effect closer-variance restatement is **not run** because the prerequisite stops before controls; nothing substitutes self-comparison variability.

## Item 3 — generation ceiling

PASS for applying the frozen stop rule. All recorded sessions were resolved and replay-checked. `ceiling.json` retains every non-bomb move's owner points, bot choice points, pool maximum, source recording and subset membership; it also retains bomb exclusions and unresolved issues. `human-benchmark.json` retains the same-seed target-stop comparison used for subset membership. The raw command report prints the overall, levels 56–58 and diagnostic-subset tables and the exact stop sentence.

The subset is moves on mutual-win boards where the owner reaches target sooner than the bot AND the owner's chain scores above the bot's selected chain. N_MIN = 30; the majority stop is applied only when the minimum is met. RESULT-0083 records the measured counts and the frozen rule's Path E outcome. **Nothing is claimed about moves outside the subset.** The all-sessions figure is secondary and does not determine the stop.

Corpus standing remains unchanged. As RESULT-0056 states, one terminal board-2 attempt was ruled invalid for that earlier oracle experiment and a later winning capture was a repeated attempt rather than a blind comparison. The revision-5 instruction here explicitly requests every recorded session and a descriptive recorded-board diagnostic. Those captures are replay observations here; their prior invalidity and exposure status are not promoted into admissible human confirmation evidence. No recordings enter training, gate or confirmation.

## Item 4 — committed exploration plan

PASS. The plan, selected intent brief, seed blocks, prerequisite code and boundary tests were committed at `3186ddff36598b0328c31f46ebbbfd1eaca81b60`. The historical prerequisites were run before that commit; **zero fresh games ever ran**, so the plan is committed before any fresh training, control, search, recheck or confirmation game. All future blocks are reserved but unrun. The frozen plan preserves closure paths and owner thresholds. The optional fresh-game loop/pool/worker are not implemented because Path E stops before they are needed.

## Unrun items

Items 5–11: **not run / UNVERIFIED_NOT_RUN**, as required by Path E. No model, candidate nomination, confirmation protocol, confirmation verdict or adoption exists. Item 12 is not required by Path E; supplemental `coverage-output.txt` checks all declared ranges and reports each block `not run`. No unrun block is a coverage failure.

## Arithmetic and tests

`recompute-output.txt` prints MATCH for all historical level variances, the twelve cross-check variances, both uncertainty axes, widths, detectable gains, and each generation count and threshold. `solver/policy-fit/recompute-preflight.js` imports only Node builtins and reads the original historical artifacts and retained diagnostic rows; it imports neither producer, runner, ruler statistics nor loop. It is same-author arithmetic reimplementation, **not independent verification**. The actual distinct acceptance reviewer is the Codex PR reviewer; ledger checked_by stays absent. `qualification-output.txt` tests the small-subset continuation, minimum/majority boundary, subset exclusions and unresolved-recording refusal.

## Effort and closure status

`budget.json` records zero fresh games, no rounds, untouched confirmation reserve and conservative overhead accounting for historical benchmark and diagnostic replays. The first preflight attempt crashed on a variable-shadowing error after historical benchmark collection; its output is preserved in `preflight-first-attempt.txt`, friction was logged, the variable was corrected and the diagnostic completed on its second attempt. That preparation error created no retained INVALID/UNVERIFIED closure. This retained Path E finish is CLOSED; no failed-run row is appropriate.

## Closeout and publication

The raw final report is `docs/goals/policy-learned-judge/RAW-REPORT.txt`, printed by `print-report.js` from retained outputs. `closeout-tests.txt` and `closeout-output.txt` supply the final baseline comparison, unchanged protected files and test boundary, and experiment gate. Ledger and generated index commit together; CURRENT.md cites RESULT-0083. No backlog was edited, so no History line is required. Publication state is read live and retained in `publication-output.json`: PR remains open; do not merge. Blackboard stays submitted until the declared reviewer has actually decided.

## Append-only correction — CORRECTION-0019

The initial item-2 cross-check and its MATCH claim above were incomplete: both readers used the nonexistent champion arm label. Earlier output is retained, and `experiments/RESULT-0083/closure.json` marks that initial closure INVALID, with FR-0010 in FAILED-RUN-LEDGER.CSV and an implemented coverage guard plus negative test. The corrected reference-arm reduction now requires complete historical grids and matches. The frozen generation artifact and Path E counts are unchanged; no new games or confirmation were run. The final CLOSED receipt is `docs/goals/policy-learned-judge/closed-closure.json`. The original closure-status paragraph's statement that no failed-run row is appropriate is superseded by this correction. The final ledger standing is RESULT-0083 provisional with CORRECTION-0019 provisional, both unaccepted with checked_by absent. Latest raw output and actual Codex review govern finish readiness.

## Codex review response — publication evidence

The original closeout paragraph's claim that publication-output.json was retained was incorrect. At this checkpoint, the PR is open and publication/review evidence remains pending on the revised head; no saved artifact is substituted for actual review. The final live output from print-publication.js will be retained locally and printed when the revised head is reviewed. Codex finding 4177039536 is addressed by this explicit correction. The initial RESULT-0083 record is superseded, without promotion, by provisional CORRECTION-0019; neither record is accepted and checked_by stays absent. This standing statement supersedes the preceding provisional-plus-provisional wording.

## Owner-approved closeout exception

The mandatory new failed closure conflicts with the existing test's fixed older inventory. The owner approved adding RESULT-0083 to that expected list and finishing. OWNER_TEST_EXCEPTION.txt retains the exact authorization and PROPOSED_TEST_EXCEPTION.patch the exact change. This is the only existing-test edit; no test is skipped, removed or weakened and all older inventory entries remain. The unchanged-test wording above is qualified by this explicit exception.
