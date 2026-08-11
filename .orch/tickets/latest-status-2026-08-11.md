# Latest project status — 2026-08-11

## Route

- Executor: `orch-investigate`
- Rung: inline read-only investigation, with pre-existing repository verifiers
- Bound: current branch/worktree, August 8 handoff, the August 10 Level 26 run tickets/worklog, frozen run receipts, and their existing local verification commands; no network or new solver work
- Source policy: primary local evidence only; Git metadata, tracked/untracked project files, frozen JSON receipts, and reproducible read-only command output

## Question

What is the latest state of the 2248 Challenge project, especially the Level 26 score-feasibility study?

## Acceptance criteria and oracles

1. Report current Git identity and worktree state.
   - Oracle: pre-existing `git status --short --branch` and `git log` behavior against the current checkout.
2. Report what the August 10 approaches actually established, without turning a heuristic lower bound into feasibility or impossibility.
   - Oracle: pre-existing frozen run receipts plus their pre-existing verifier scripts/tests.
3. State the strongest supported conclusion and the unresolved proof gap.
   - Oracle: agreement between the run's pre-existing tickets/worklog and reproducible verifier/test output; contradictions must remain explicit.

## Independence

Acceptance relies on pre-existing repository state, frozen receipts, and verifier/test code authored before this status report. Any claim without a runnable pre-existing oracle is `UNVERIFIED`.

## Result

- Status: complete.
- Result identity: this ticket plus the unchanged frozen receipts under
  `solver/target-witness-search/`, `solver/near-target-search/`, and
  `solver/hinted-cp-sat/`.
- Verification verdict: PASS for the three status-report criteria, at
  `pre-existing` oracle provenance. Fresh read-only verification produced 83
  tests: 80 pass, 0 fail, 3 optional Python/OR-Tools checks skipped. All three
  frozen-result replayers passed. `node solver/upper-bound.js` completed with
  the same non-decisive certified relaxation bound, 326,390.

## Findings

1. High confidence — the repository is still on local `main` at `10a849d`
   (`2026-08-08`), with no configured remote. The August 10 certification
   work is uncommitted: one tracked README is modified and the certifiers,
   searches, tests, tickets, and run receipt are untracked.
2. High confidence — for the single frozen Level 26 seed-0 input, the strongest
   accepted achievable result is a replayed 12,336-point, 32-move witness. It
   is 664 below the 13,000 target and is a lower bound only.
3. High confidence — the target remains unresolved. Z3 and independent CP-SAT
   exact formulations returned `UNKNOWN`; the hinted CP-SAT schedule confirms
   12,336 as SAT but returns `UNKNOWN` at 12,400, 12,600, 12,800, and 13,000.
   The complete mass/cursor upper bound is 326,390 and therefore non-decisive.
   The physical branch-and-bound run enumerated 1,868,975 root actions but
   expanded one and pruned none because its root tail bound was too loose.
4. High confidence — the central run is still marked active. The explicit safe
   resume boundary is a streaming/partitioned physical frontier paired with a
   substantially tighter complete tail bound.

## Contradictions

- `HANDOFF.md` correctly describes the August 8 stop but is stale as a current
  status source: the August 10 run is marked active and added substantial
  uncommitted work.
- The early `solver/README.md` tuning verdict says the target is above what the
  rules can plausibly deliver, while the later certified-score sections and
  current receipts explicitly leave reachability unresolved. Treat the former
  as heuristic diagnosis, not a feasibility conclusion.

## Dead ends

- The near-target local-search JSON replays 12,336 but was not accepted by its
  run join because its executor did not complete the ticket handoff. It does
  not improve the accepted lower bound.
- Re-running the large frozen searches or the 1,868,975-action physical prefix
  was outside this status bound and would not change their proof class.
- Optional Python/OR-Tools bridge tests were skipped because OR-Tools is not
  installed in the default `python3`; the stored exact-model receipts were
  inspected but not recomputed.
- A live process-table check was denied by the managed sandbox. The worklog
  says its last external solver completed, but current OS process state is
  `UNVERIFIED` in this pass.

## Gaps left by the bound

- No exact maximum, replayed score at or above 13,000, or decisive upper bound
  below 13,000 exists for frozen seed 0.
- The study covers one deterministic spawn sequence only, not Level 26 across
  all random sequences or typical play.
- The work remains local and uncommitted, so repository history does not yet
  preserve the August 10 result set.
