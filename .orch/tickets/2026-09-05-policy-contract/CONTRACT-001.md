---
id: CONTRACT-001
run: 2026-09-05-policy-contract
status: complete
executor: orch-draft
depends_on: []
write_scope:
  - docs/evaluation/POLICY-EVAL-0001/contract.md
  - docs/evaluation/POLICY-EVAL-0001/inputs.json
  - docs/evaluation/POLICY-EVAL-0001/review.md
  - docs/evaluation/POLICY-EVAL-0001/acceptance.md
  - docs/backlog/BL-0014-policy-improvement-sequence.md
  - CURRENT.md
bound: 45 minutes; Step 1 only, at most two independent review passes
claimed_by: /root
claimed_at: 2026-09-06T01:02:53Z
---

## Objective

Produce and review one operational evaluation contract for Step 1 of the
owner-required sequence; freeze its complete identity before releasing
Step 2. Do not repair the benchmark, run games, audit bot trajectories,
choose a challenger, or change any game, policy, receipt, or prior claim.

## Fixed inputs

- Owner's latest "proceed" follows the explicit next action: write Step 1's
  evaluation contract. Authority remains DECISION-0006.
- Base: 76d4e82. Root worktree was clean; log/reflog show this session's
  commits only. The only checkout agent observed is the foreground Codex
  and its tools; existing play/vision servers and memory service remain.
- Plan: docs/plans/2026-09-05-policy-improvement-sequence.md, whole-file
  SHA-256 6310780fa70e31951345f3fa35f1160b3b13fa5bc39bc22410e49a9765fadfb2.
  Required R1-R6 and Step 1's six actions and done condition are binding.
- Sources: src/game.js exports and terminal transition; solver/engine.js;
  solver/bot.js chooseMove/DEFAULT_PARAMS; solver/human-benchmark.js;
  solver/recording-replay.js; solver/record-session.js; level-author's
  evaluator boundary; experiments/README.md and SEEDS.md; recording and
  ordinary-play metadata. Existing grounding report is historical input,
  not a fresh run. inputs.json will freeze the read-only source inventory.
- Atlas support: METHOD-003 via the pinned consultation. The contract
  preserves the entire document, not an unstated subset of fields.
- Outline slot: the entire contract.md document, plus its input manifest,
  review/acceptance evidence, and minimal progress navigation.
- Voice contract: plain English; define symbols beside their meaning;
  short sections, exact formulas and small examples where needed; no
  marketing, no inferred empirical claim. Contract bound: 3,500 words.
- Citation policy: relative source file links plus symbol and source hash
  in inputs.json. Separate source facts, operational design choices, and
  later protocol parameters. No external research or new source search.
- Judgment permission: resolve the operational defaults explicitly under
  Step 1; never call them new owner rulings or measured findings.

## Completion test

1. Input identities resolve and match: reference chooseMove/defaults,
   shipped configurations/targets/budgets, RNG conventions, and fixed
   recording-source inventory with provenance classes. Oracle: filesystem
   SHA-256, exported source metadata, and source-resolution of named
   symbols. oracle_class: evidence; provenance: pre-existing.
2. Another reader can apply the contract without inventing a rule.
   Oracle: fresh independent judgment against every Step 1 requirement
   and these binary failure anchors: undefined identity/pairing/terminal
   order; lost reference wins hidden by means; undefined converted-win
   priority, tie or empty-set treatment; variable speed denominator;
   unweighted duplicate attempts; silent missing-case exclusion; mixed
   score horizons/objectives credited as performance; unknown historical
   provenance promoted; unspecified benchmark-critical choice; later-stage
   work executed or the required order changed. Any such defect is FAIL;
   if none exists and all examples resolve, PASS. oracle_class: judged;
   provenance: pre-existing. No self-verdict may satisfy this criterion.
3. Worked examples cover and decide: faster joint win; a lost reference
   win despite faster remaining wins; new wins before speed; equal-quality
   tie; all-loss/no-reference-win case; duplicate case weighting; invalid
   or missing input; bomb on target-crossing move; target at final allowed
   move; unequal score horizons; early human stop; target-disabled outcome
   labels; computation/harness failure; zero-score ratio; same grid with
   different targets. Oracle: source-defined terminal order and direct
   arithmetic, plus independent application of the written rules. Wrong
   examples must be rejected rather than the oracle weakened.
   oracle_class: evidence; provenance: pre-existing.
4. Only write_scope plus ticket bookkeeping change; the pinned plan and
   behavior-bearing inputs remain unchanged. Oracle: git diff against
   76d4e82 plus untracked inventory and SHA-256 equality. Stage 2 remains
   unexecuted even if released. oracle_class: deterministic;
   provenance: pre-existing.
5. Freeze the reviewed contract/input package in Git and record its full
   hashes and commit in BL-0014/acceptance before marking Step 1 complete.
   Oracle: git show at the recorded commit equals live bytes, source
   manifest matches, review covers those identities, links resolve,
   and git diff --check passes. oracle_class: deterministic;
   provenance: pre-existing.

## Return fields

Contract and input identities, operational choices with reasoning,
worked-example verification, independent review, stage disposition,
changed_artifacts, limits, and next action.

## Result

Accepted Step 1 only. Frozen contract, input inventory, and verbatim review
are committed at `e415df78b77a8f32ec2d97912ccd198bfaad2d21`.
`docs/evaluation/POLICY-EVAL-0001/acceptance.md` records the package and
verification; BL-0014 and CURRENT release Step 2 as ready, not executed.
Steps 3-4 remain blocked. No gameplay source, historical claim, or pinned
plan changed. No new game, replay, benchmark, or experiment was run.

The drafting and dispatch notes below are retained as execution history.

Draft contract and input inventory produced; no game execution occurred.
Draft review identity: contract SHA-256
`3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f`;
inputs SHA-256
`1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb`.
Inventory contains 58 source level objects and 15 raw recording sources,
not 15 qualified independent cases. Current draft: 18 worked examples.

Independent C2/C3 review dispatched at 2026-09-06T01:05Z under
orch-delegate to `/root/contract_review_gpt_5_6_sol_ultra`, native
orch_planner profile, no-context fork, applied skill orch-verify,
read-only message return. Bound 10 minutes; monitoring cadence <=60s.
The packet fixed the identities above, ticket criteria and plan, permitted
judgment, excluded edits/experiments/subdelegation, and addressed main.
Root remains the sole writer and performs independent-of-review mechanical
source/identity and arithmetic checks while the review runs.

## Verification

C2/C3 review returned PASS and is preserved verbatim in
`docs/evaluation/POLICY-EVAL-0001/review.md`, SHA-256
`1a7f19c93db2eb440213c1f98f757c3c0ded575e802cbb4be7569f153b9ec6d1`.
Root's orch-integrate disposition: ACCEPT the scoped verifier result.
The frozen contract/input identities still match, C2 used a fresh judged
oracle against the fixed failure anchors, and C3 applied all 18 examples.
The reviewer reported no writes and expressly excluded C1, C4, and C5;
its PASS is not a whole-ticket or benchmark verdict. No second review is
needed. The final C4/C5 checks and acceptance now close the ticket below.

- C1 mechanical/source portion, PASS at the draft identities: all 12
  source hashes and all 15 recording-file hashes match; all 58 exported
  LEVELS objects equal the manifest; DEFAULT_PARAMS equals the reference
  parameters; each source-object hash recomputes with the stated sorted
  JSON convention. No recording was replayed or admitted by this check.
- C3 arithmetic portion, PASS: E01 gives +2 moves; E03 gives N=1 and
  D=-2; E06 case weighting gives -1, while pooling attempts gives +0.5.
  The arithmetic assertion rejects +0.5 as E06's expected contract value.
  Distinct targets produce distinct identity inputs. Independent semantic
  application of all E01-E18 also passed, as recorded in review.md.
- C4 interim scope, PASS: only the new ticket, contract, and inputs file
  are untracked; tracked diff is empty; the pinned plan retains its fixed
  hash. No behavior source or existing stage state changed.

Arithmetic reproduction (not a benchmark implementation): compute
`mean([mean([12-8,12-10,12-12]),10-14])` with ordinary arithmetic mean;
it is -1. The deliberately wrong pooled oracle target is
`mean([4,2,0,-4])`, which is +0.5 and must not equal the contract result.
These are document/example checks, not a fresh policy experiment.

Final verification and join disposition, 2026-09-05:

- C1 PASS: rechecked all 12 source files, 15 recording files, 58 shipped
  level objects/canonical hashes, and DEFAULT_PARAMS at the freeze commit.
- C2 PASS and C3 PASS: accepted the independent review at its exact
  recorded contract/input identities. No author self-verdict substituted.
- C4 PASS: git diff from 76d4e82 plus untracked inventory stays within the
  seven named artifacts below. The original plan hash and all source and
  recording hashes remain equal. Step 2 was not executed.
- C5 PASS: git show of contract, inputs, and review at e415df78 equals live
  bytes; review covers those identities; acceptance and BL-0014 name the
  full package hashes and commit; local linked files exist; git diff
  --check passes. No repository-wide gate claim is made.
- orch-integrate: ACCEPT CONTRACT-001; all five fixed criteria satisfied,
  no return exceeds the ticket's authority or Step 1 scope. Status complete
  is set by the root join, not the draft executor or the scoped reviewer.

Changed artifacts:

- .orch/tickets/2026-09-05-policy-contract/CONTRACT-001.md
- docs/evaluation/POLICY-EVAL-0001/contract.md
- docs/evaluation/POLICY-EVAL-0001/inputs.json
- docs/evaluation/POLICY-EVAL-0001/review.md
- docs/evaluation/POLICY-EVAL-0001/acceptance.md
- docs/backlog/BL-0014-policy-improvement-sequence.md
- CURRENT.md

Next action: Step 2's bounded benchmark/record correction, beginning with
the predecessor identity check. It is not part of this ticket.

## Feedback

Source-path misses and output bounds were logged. Candidate-blind
evaluation design is not claimed: this session already knows historical
outcomes. The exact task is a source-grounded document contract, not a
new experiment. A future experiment still needs its own preregistration.

## Risks

No numerical promotion threshold, fresh seed range, sample size, or
runtime allowance is authorized implicitly. Specify the required later
protocol fields without pretending the Step 1 contract is that protocol.
The author cannot accept its own judgment criterion.
