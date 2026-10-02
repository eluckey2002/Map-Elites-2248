---
result: RESULT-0058
status: complete
registered: 2026-10-02T11:22:54.397Z
supersedes: null
reportable: confirmation
version_freeze:
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/engine.js: 0ed4b31004df13e3
  solver/policy-eval.js: 2250754e430a2f1a
  src/game.js: 3d405595707621ce
  solver/map-elites.js: 1f25c60c7e5e9e14
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/persist-before-verdict.js: 02df81dbcf6264f4
  tools/verify-experiments.js: 27a2cd2b686753cd
  .orch/policy-search-02.cells.json: e062df7b0b64f7c4
  experiments/SEEDS.md: 9516a2e76b742ce6
  solver/ruler/backtest.js: edd0d4ab814bf56a
  solver/ruler/config.js: 8871e7d31b0d7e86
  solver/ruler/core.js: fcf02b2a2cdded6b
  solver/ruler/game.js: c87b519c34d735d2
  solver/ruler/policies.js: d4176653e6752485
  solver/ruler/pool.js: 7915daf465d7eef6
  solver/ruler/recompute.js: 985cab8838e59f44
  solver/ruler/run.js: ba8b6965516fda24
  solver/ruler/worker.js: 52538244dca91689
  solver/tests/ruler.test.js: a8aa332722ce22c8
---
# Pre-registration — paired target-race ruler

Registered before any RESULT-0058 control or search game is played. This is
instrument qualification and one bounded policy-search run. It does not change
a shipped policy, level, target, or rule. The frozen goal is the owner's
trustworthy-ruler request; the instrument implementation is the committed
solver/ruler directory.

## Question and prior evidence

Can one same-cell ruler distinguish the current target-aware champion from its
preserved chooseBaseMove, reject a known weak pilot, and prevent an optimistic
MAP-Elites screen from admitting an entrant whose independent recheck is worse?

DECISION-0004 identifies the current engineering champion. RESULT-0049 found a
positive paired target-cost reduction for that champion over chooseBaseMove.
RESULT-0052 shows why shipped win rate alone is nearly saturated. This run
uses the race-to-target objective shared by both arms; terminal crossing score
is never fitness.

## Starting state

- Original main and worktree base HEAD: fced429c4afc2b62312e32fdb202f8c0457c53d2.
- Branch: codex/trustworthy-ruler-20261002 in C:/ooo/wt/codex-trustworthy-ruler-20261002.
- Instrument commit before registration: 8481dfbd0ac12c042cf76840c4ddc9b5419dbdcd.
- Baseline command: node --test solver/tests/*.test.js. It printed 590 tests,
  584 pass, 5 fail, 1 skip. The three documented failures are stale
  candidate-levels-52.json and candidate-levels-54.json receipts and the
  Universe Map generated-view check. Two additional baseline failures are
  the Windows launcher path-separator assertion and the LIVE guard observing
  unrelated uncommitted .orch files in a linked U1 worktree. Their exact output
  is in docs/goals/trustworthy-ruler/baseline-output.txt.
- The seed ranges in experiments/SEEDS.md were read. RESULT-0057 is already
  registered on another Git ref and burns 45,999,999 plus 46,000,000–46,000,019;
  this registration uses the next unused result ID and disjoint 50-million
  blocks. The reserved ranges below stay reserved even when a contingent stage
  is not reached.

## Subject, units, and estimand

The candidate and reference independently play the same shipped level and seed.
Both use solver/engine.js transitions, the same spawn RNG construction, the same
per-move lookahead RNG construction, and stop on the move that crosses the
target, a bomb, no legal move, or the move budget. The 12 preselected levels are
1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, and 52. Cells are level-major.

First compare wins gained minus wins lost for the candidate relative to the
reference. Only on mutual wins compare reference moves-to-target minus candidate
moves-to-target. The headline speed mean is conditional on mutual wins; a loss
is never assigned a made-up move count in that mean. A positive value favors
the candidate. The paired win difference and mutual-win speed difference each
report the larger of the standard errors across level means and seed means,
with a symmetric 95% interval of mean ± 1.96 × SE. A missing axis estimate is
reported as unavailable, not as zero. The relative speed percentage divides
mean saved moves by reference moves on mutual wins.

Every empirical game result is descriptive for this fixed shipped-level panel
and declared seed process, not a human comparison or a claim about new levels.

## Sample size and margin

- **Per verdict:** null uses 1,000 paired cells; the positive-control interval
  uses 3,000 paired cells; known-bad elimination has 72 cells first and 600
  contingent cells; MAP screen decisions use 72, then 600, then 3,000
  candidate games; fresh admission uses an independent 72-cell block; final
  stronger-policy evaluation uses 3,000 cells. The winner-curse panel is
  30 paired 72-cell screen/fresh comparisons. The 50-block sign frequency
  uses 50 disjoint 72-cell panels and is descriptive.
- **Margin:** one nonzero null paired difference flips C2. C3 requires both a
  positive lexicographic rank and a lower 95% moves-saved limit strictly
  above zero; touching zero flips it. A known-bad pilot surviving stage 2
  flips C4. One synthetic misadmission flips C5. For MAP, one nomination
  that fails the fresh admission rule but enters the archive flips C8.
  The final stronger-policy condition changes at zero holdout lift or t=3,
  and one net win regression prevents it. These are sharp thresholds, not
  outcomes tuned after observing cells.
- **Downstream quantity:** SUPPORTED requires the joint final-holdout condition
  for one fresh-admitted representative: nonnegative net wins, positive
  relative moves-saved lift, and two-axis t strictly greater than 3. The
  protocol does not infer that joint result from each component alone.

## Seed blocks and maximum cost

All ranges below are appended to experiments/SEEDS.md before play.

| Role | Seeds | Cells per candidate |
| --- | --- | ---: |
| Champion/champion null | 50,000,000–50,000,099 on first 10 levels | 1,000 |
| Champion/base 3,000-stage positive | 50,100,000–50,100,249 | 3,000 |
| Positive 72-stage frequency | 50,200,000–50,200,299 as 50 disjoint six-seed blocks | 72 per block |
| Short-myopic stage 1 | 50,300,000–50,300,005 | 72 |
| Short-myopic stage 2 contingency | 50,301,000–50,301,049 | 600 |
| Winner-curse screen | 50,400,000–50,400,005 | 72 |
| Winner-curse fresh | 50,401,000–50,401,005 | 72 |
| MAP stage 1 | 50,500,000–50,500,005 | 72 |
| MAP stage 2 | 50,501,000–50,501,049 | 600 |
| MAP stage 3 | 50,502,000–50,502,249 | 3,000 |
| MAP independent fresh admission | 50,503,000–50,503,005 | 72 |
| MAP final holdout | 50,504,000–50,504,249 | 3,000 |

Champion reference games are cached once per stage. The worst-case producer
bound is 59,408 actual game executions: 21,008 across controls and the
winner-curse panel, then 38,400 for MAP with eight stage-2 candidates and
three stage-3 nominees and final representatives. Independent recomputation
replays at most eight selected games, leaving total measured/replay execution
below 60,000. The static budget test must pass before the run.

## Frozen stage and archive decisions

- Stage 1 evaluates all 120 MAP mutants on 72 candidate games. A policy is
  CUT if net wins are negative, or if net wins are zero and the upper 95%
  mutual-win moves-saved limit is below zero. Otherwise it ADVANCES.
- An adaptive 5×5 MAP screen uses mean chain length on [3,12] and mean
  target-pace fraction on [0,1.2], clamped to edge bins. A provisional screen
  archive supplies mutation parents. At most the eight best stage-1 survivors,
  one per provisional cell, enter stage 2. This is a fixed compute cap.
- Stage 2 evaluates each selected candidate on 600 new games. It uses the same
  cut threshold. At most the three best stage-2 survivors enter stage 3.
- Stage 3 evaluates each selected candidate on 3,000 new games. It NOMINATES
  when net wins are positive, or when net wins are zero and mean mutual-win
  moves saved is positive. Otherwise it cuts.
- Every nominee is re-tested on the independent 72-game fresh block. A nominee
  enters its cell only if its fresh lexicographic rank exceeds the unchanged
  champion, and exceeds the incumbent in that cell on fresh values. Any
  screen-positive/fresh-negative nominee is refused. Final archive ranking
  and representative selection use the fresh number only.
- Up to three fresh-ranked representatives are evaluated on a separate
  3,000-game final holdout. For each, the stronger-policy rule holds only if
  there is no net win regression, relative holdout moves-saved lift is
  positive, and holdout t = mean moves saved / two-axis SE exceeds 3.

No screen statistic is promoted into a final-holdout statistic. Mutation seed
20261002, one to three genes per mutant, the gene ranges in policies.js, and
the policy and bin definitions are frozen. All 120 mutants are evaluated even
if no policy qualifies. No policy is adopted by this run.

## Checks and exact oracles

### C1 — start state

PASS when the report prints HEAD, branch, the full baseline test summary and
five named failures, and the declared SEEDS.md ranges. Any missing fact is
FAIL.

### C2 — null control

PASS when at least 1,000 champion/champion paired cells show exactly zero wins
gained, zero wins lost, and exactly zero mean moves saved. No tolerance applies.

### C3 — positive control

PASS when the 3,000-cell champion/chooseBaseMove result ranks the champion
better, the mutual-win paired moves-saved 95% interval has lower limit above
zero, and its sign agrees with RESULT-0049. Print the fraction of at least 50
disjoint 72-game blocks with the same sign. The fraction has no passing bar;
it is a sensitivity diagnostic, not a threshold chosen after viewing it.

### C4 — known-bad pilot

PASS when the copied short-myopic policy from map-elites.js pilot lines 80–95
is cut at stage 1 or, if needed, stage 2. A survivor at stage 2 is FAIL.

### C5 — synthetic admission

PASS when the named synthetic screen +3%/fresh -3% test refuses entry and the
named positive-on-both test admits entry. The same-cell fresh rank test must
also pass. These are tests of the actual admission function.

### C6 — winner's-curse table

PASS when 30 distinct one-gene champion variants have both 72-game screen and
independent 72-game fresh results printed individually, plus the mean
fresh-minus-screen relative speed percentage gap. No sign bar is imposed.

### C7 — legacy staging smoke test

PASS when the frozen .orch/policy-search-02.cells.json corpus yields the
number of 108 screened policies cut by the win-first stage-1 branch and shows
the six holdout policies' screen rank, disposition and holdout score proxy.
Stored terminal scores omit moves-to-target: tied-win stage-1 decisions remain
unresolved. Applying current targets to older-bot stored scores is a smoke
test only; six holdout points cannot validate the ruler.

### C8 — MAP run and fresh recheck

PASS when one run evaluates 120 mutants in 5×5 bins, prints screen, fresh and
final holdout for each representative, the number refused on fresh recheck,
candidate games and CPU seconds at each 72/600/3,000 stage, and whether the
stronger-policy rule held. Zero entrants or no stronger policy is a completed
domain outcome, not an instrument failure.

### C9 — independent recomputation

PASS only when solver/ruler/recompute.js, importing no producer module,
rebuilds items C2, C3 and C8 from the complete raw per-game artifact, validates
the paired axes, replays selected games using only engine.js and bot.js, and
prints MATCH. Any diff is FAIL and no result is trusted.

### C10 — close-out gates

PASS when node --test solver/tests/*.test.js adds no failure to the five named
baseline failures and skips no existing test, node tools/verify-experiments.js
passes, the ledger record remains provisional with written_by and no
checked_by, LEDGER-INDEX.md is regenerated, CURRENT.md and touched backlog
History are updated, and the experiment gate and Codex review finish on the
pull request. The pull request is not merged.

## Domain outcomes after controls pass

- SUPPORTED: at least one fresh-admitted representative clears the
  stronger-policy final-holdout rule.
- INCONCLUSIVE: none clears it, but at least one representative has positive
  relative holdout speed lift with inadequate t or a net win regression.
- FALSIFIED: no representative has positive relative holdout speed lift,
  including an empty fresh archive.

A control failure, missing raw pair, version-freeze breach, more than 60,000
games, or missing independent recomputation stops the run and is not converted
into a domain FALSIFIED verdict. These three domain words describe the
bounded search result, not scientific adoption.

## One-shot execution and persistence

The exact command is node solver/ruler/run.js --protocol RESULT-0058, once.
Null, positive and known-bad paired control artifacts are written before
their fail-fast decisions. The complete raw-games.json artifact is written
once with tools/persist-before-verdict.js before the final domain verdict is
printed. No seed replacement, threshold edits, retests on another block, or
second confirmation run are allowed. A failed run remains visible.

The independent command is node solver/ruler/recompute.js
experiments/RESULT-0058/raw-games.json. The complete artifact and both raw
command outputs are retained with the result. The producer cannot verify its
own claims; MATCH is a separate calculation from raw games.

## Adoption is separate

Even SUPPORTED does not promote a policy, change the shipped bot, or merge
the pull request. The owner makes any adoption decision separately.
