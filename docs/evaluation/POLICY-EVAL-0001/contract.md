---
id: POLICY-EVAL-0001
version: 1
type: evaluation-contract
created: 2026-09-05
authority: DECISION-0006
---

# Policy evaluation contract v1

## 1. Purpose, authority, and the freeze

First preserve reliable winning, then prefer faster wins. Score is a separate diagnostic, not a substitute for either. This contract supplies the operational definitions requested by Step 1 of [the required plan](../../plans/2026-09-05-policy-improvement-sequence.md). It does not change that plan, game rules, targets, the authoring evaluator, or the champion.

The definitions and weighting choices below are explicit engineering choices under Step 1, not newly discovered facts or additional owner rulings. No new bot results were used to select them. Earlier inspected evidence informed the problem; this is not a candidate-blind design or a preregistration of a new experiment.

The frozen package consists of this entire file and [inputs.json](inputs.json). [acceptance.md](acceptance.md) records their SHA-256 hashes, commit, and independent review. It is outside the package to avoid a self-referential hash. Once accepted, changing either frozen file requires a new version preserved beside this one. A content hash identifies bytes; it does not independently prove when an experiment ran.

## 2. Reference, subjects, and random streams

[inputs.json](inputs.json) pins the source revision, file hashes, exported defaults, all 58 shipped level objects, and the 15 recording files present at intake. This is an input inventory, not replay qualification or 15 independent boards.

The reference is [solver/bot.js](../../../solver/bot.js), `chooseMove`, with the exact `DEFAULT_PARAMS` in the manifest. Do not substitute `chooseBaseMove`, `analyzeMove`, the mutable working-tree defaults after a change, or `calib-1`. [solver/level-author.js](../../../solver/level-author.js) belongs to a separate authoring measurement system.

The game semantics are identified by [engine.js](../../../solver/engine.js) and [game.js](../../../src/game.js), not by a level number alone. Preserve each subject's grid dimensions, blockers and their durations/timers, minimum chain length, tile scale, target, and full move budget. Candidate recordings resolve to their receipt-bound candidate; they are not silently replaced by today's shipped level with the same number.

For grouping, define a `subjectKey` as SHA-256 of compact JSON with recursively sorted object keys containing `gridW`, `gridH`, `minChain`, effective `tileScale` (default 1), `target`, `moves`, and `blockers`. Sort blockers by `(y, x, type)` and retain their applicable duration/timer fields; reject duplicate occupied blocker coordinates or unsupported types. Ignore display names and level labels. Define `caseKey = (engine identity, subjectKey, effective seed, RNG scheme identity)`. The scheme includes the lookahead convention below. Record the original receipt identity and source path separately; this key does not replace them.

Seeds must be integers in 0 through 4,294,967,295. Do not silently normalize larger or negative numbers into aliases. Both arms receive the same effective seed and subject. Each arm owns a separate `engine.makeRng(seed)` stream, used for initial creation and then real refills. Equal seeds match initial conditions and the random-stream scheme, not the later boards when different moves consume different numbers of draws.

For policy lookahead, use a fresh `makeRng(987654321 + i)` on every factory call for zero-based move index `i`, matching the current benchmark convention. Never share the real refill RNG with lookahead or between arms. Preserve the initialized board and post-initialization RNG position in Step 2's comparison evidence. Any additional challenger randomness must be identified and paired under a preregistered convention before comparison.

## 3. Validity and the first winning move

Let `B` be the subject's full allowed move budget and `T` its original target. A primary arm plays the target-seeking game, with the original `B` and `T` visible to its policy.

Validate chain coordinates, tile values, uniqueness, adjacency, blocked tiles, equal-or-double extension, and minimum length before executing it. A move then performs merge/scoring, gravity, refill, and blocker ticking. Check bomb loss first, then target crossing, then budget exhaustion, then no legal moves. This order follows `Game.executeChain`, `checkBombs`, and `checkWinLose` in game.js and the transition functions in engine.js.

`t` is the number of completed moves at the first valid target crossing. A crossing on move `B` wins. A bomb exploding on that same move loses, even if the score exceeds `T`. Stop at the first terminal event; never credit a later crossing after a loss. A continuation beyond a terminal event is not silently accepted as ordinary target-game evidence.

Use separate fields for validity and game outcome:

- `valid / win`: first valid crossing observed; record `t`.
- `valid / lose`: bomb, budget exhausted, or no legal moves before a crossing; `t = null`, not the number of moves until failure.
- `valid / policy-failure`: a reproducible policy returns no choice or an illegal choice on a valid live input, or breaches a predeclared per-decision limit. Count this as a loss for reliability, but retain its distinct reason. Do not call a generator's failure to offer a move proof that no legal move exists.
- `unresolved`: missing identity, incomplete recording, replay mismatch, ambiguous historical input, or a measurement/runtime fault not attributable to the policy on a valid input. No primary verdict for the complete comparison set follows until resolved.

A truncated human record is unresolved, not a human loss. An illegal chain in an archived record is an evidence problem, not automatically a demonstrated human policy failure. Distinguish a harness crash from a reproduced algorithm failure; a nonzero exit alone decides neither. The current `recording-replay.replay` is a starting tool, not assumed to check every condition above.

## 4. Comparison population and repeated plays

There are two separate descriptive panels for Step 2:

1. Receipt-bound candidate/pilot recordings listed in inputs.json, subject to full resolution and replay checks.
2. Ordinary play listed there, replayed against the pinned current shipped subject. Label it `current-subject replay`, not historically receipted candidate evidence. Exact replay under today's identified subject does not prove that subject was the historical runtime.

Do not pool these provenance classes into one headline result. Preserve every listed file with an admitted, duplicate, or unresolved disposition. Extra files discovered later are an explicit append-only supplement with a new inventory identity; never quietly change the denominator. Missing required rows prevent a complete-panel verdict, although a clearly labeled resolved-subset table is useful.

Within each panel, give every distinct case equal weight. Give each distinct human attempt within a case equal fractions of that case's weight. Byte-identical copies or identical canonical captured payloads count once, with all source paths retained. Here canonical payload means the entire parsed recording encoded as compact JSON with recursively sorted object keys and array order preserved. Do not deduplicate merely because scores match. Preserve distinct recorded session IDs where available and document any ambiguous duplicate disposition before aggregation.

Report file count, distinct attempts, cases, and initialized-grid collisions separately. Same grid but different target/budget is a different case; same initial grid is not evidence of independent samples. These selected recordings support descriptive comparisons and regression examples, not population estimates of human or bot strength.

A future policy-to-policy run uses one deterministic run per arm per case, with any additional replicates and their weights declared before the run. Its exact subject/seed manifest is separate from this historical corpus. Additional wins do not change the cases used to measure speed.

## 5. Reliability, speed, and ordering

The reference is `R`; the comparison arm is `C`. In the human panels, `C` means recorded human play, not a candidate for software promotion. For each case `i`, let `m_i` be the number of qualified, distinct comparison attempts; repeat the identical reference result only for alignment, not as new independent runs.

**Reliability eligibility:** no attempt where R wins may become a C loss or policy-failure. Any such regression makes C `INELIGIBLE`, regardless of gains elsewhere. Unresolved required evidence makes the overall comparison `UNRESOLVED`, not eligible by omission. An empty panel has no verdict.

For `n` cases, report case-weighted win rate as:

`W_C = (1/n) * sum_i [sum_j win(C_ij) / m_i]`

and `W_R = (1/n) * sum_i win(R_i)`, where win is 1 or 0. Also report raw regression attempts and affected cases; neither an average nor rounding may hide the veto.

Among eligible comparisons, additional wins come before speed. Define the case-weighted converted-win count:

`N = sum_i [(1 - win(R_i)) * sum_j win(C_ij) / m_i]`.

Report `N` and `N/n`. Then define `S`, once from the reference, as all cases it wins. For eligible C, all its attempts in S also win. Speed improvement in moves is:

`D = (1/|S|) * sum_(i in S) [sum_j (t_Ri - t_Cij) / m_i]`.

Positive D means C is faster; negative means slower. Raw moves are the ranking unit: one saved move counts equally across cases. Report per-case values and faster/slower/tied counts so the mean cannot hide the distribution. Do not round before classification.

For R versus C on a complete panel:

- Any lost reference win: `INELIGIBLE`.
- Eligible and `N > 0`: `BETTER_ON_THIS_SET_BY_WINS`; disclose D even when negative.
- Eligible, `N = 0`, and D positive/zero/negative: respectively `FASTER_ON_THIS_SET`, `TIED_ON_THIS_SET`, or `SLOWER_ON_THIS_SET`.
- If S is empty, D is `not applicable`. With N = 0 report `NO_SUCCESS_OBSERVED`, never faster failure. With N > 0 the wins disposition still applies.

For two eligible challengers evaluated against the same R and manifest, compare N first, then D on the same fixed S. Equal N and D is a tie; no score or runtime tie-break is added implicitly. With empty S and equal N, no speed ranking is available. Times on newly converted wins are reported but do not create a changing speed denominator.

For an ineligible or unresolved comparison, joint-win speed may be shown only as a labeled diagnostic with its denominator; it cannot rescue eligibility or stand in for D. These labels describe the measured set, not statistical significance, promotion eligibility, or universal reliability.

## 6. Separate score diagnostic

Always state the objective and evaluation horizon `H`. A score after 24 moves versus one after 12 is not a same-opportunity comparison. A target-seeking terminal score mostly includes target overshoot; it is not the primary quality metric.

For two executable score-policy arms, disable the target-stop objective identically, identify the resulting policy variants, and set a common external horizon H no greater than B (default B). Keep the original B in policy state; enforcing H by replacing `maxMoves` changes what a remaining-budget-aware policy sees. The target-disabled variant is not the unchanged target-seeking champion.

For the human corpus, a secondary diagnostic may use H equal to that attempt's recorded moves and run a target-disabled bot to that external horizon. Label this `matched-horizon, mixed/unknown-intent diagnostic`. It does not establish that the human was optimizing score. Human score at full B is unavailable if the recording stopped earlier; do not invent a continuation or pad an early win into a full-budget human performance.

A genuine game/policy failure before H stops execution; retain its terminal score as an absorbing score through H and report the failure and actual moves used beside it. Never continue after a bomb or replace the score with an invented zero penalty. An incomplete/missing trace remains unavailable, not an absorbing terminal failure. An out-of-moves label caused solely by setting target to infinity is horizon completion in score mode, not a comparable target-game loss.

Show raw paired score differences. If reference diagnostic score is positive, show percentage difference `100 * (score_C - score_R) / score_R`; otherwise percentage is unavailable, including 0 versus 0. Summaries use the same case-then-attempt weighting, separately per provenance panel and diagnostic mode. Where percentages are unavailable, report the coverage denominator and do not claim a full-panel percentage. No score diagnostic affects the ordering in section 5.

## 7. Implementation checks and later experiment decisions

Step 2 must demonstrate the contract on real corpus paths plus controlled misleading inputs. Required checks are: source identity and replay; terminal order and first crossing; repeated-case weighting; incomplete/missing rows; unequal horizons; raw-output-versus-classification agreement. A crash is not a successful negative control. Existing unchanged checks that already failed for the right reason need no ceremonial requalification. The known four repository failures are not cleared by this contract.

No new game simulation, benchmark run, or candidate audit is required to accept this document. The worked examples below are specifications and arithmetic checks, not replay receipts or a new experiment.

Before any generalizing Step 3/4 run, its committed protocol must still choose: exact levels and seed ranges; fresh-versus-inspected membership checked against [SEEDS.md](../../../experiments/SEEDS.md) and repository evidence; sample size; meaningful converted-win or speed-effect threshold; uncertainty method and dependence/cluster unit; handling of repeated testing; stopping/budget rules; and numerical compute-cost limits. It must cite this contract and use the existing [experiment registration rules](../../../experiments/README.md). Nothing in this document reserves fresh seeds or permits inspected examples as fresh holdout.

Cost reporting must name hardware/runtime, warm-up policy, arm order, per-decision and end-to-end game time, timeouts, and paired cost ratios, including the reference-zero case. A future protocol must define its hard per-decision limit, acceptable typical/tail latency and total-run cost before observing the challenger run. The available sources establish no justified numerical allowance; that choice is deferred to the bounded audit/validation protocol, not silently guessed here. This does not block Step 2's descriptive benchmark repair.

Passing the no-regression rule on a finite sample is not a proof of equal reliability everywhere. Statistical support and engineering promotion remain distinct. No change, rejected challenger, and inconclusive evidence remain legitimate Step 4 dispositions.

## 8. Worked examples

These invented examples assume valid, completely identified inputs unless a row says otherwise. They specify expected decisions, not measured game results.

| ID | Inputs | Required interpretation |
| --- | --- | --- |
| E01 | One case, B=20; R wins at 12, C at 10 | Eligible, N=0, D=+2; FASTER_ON_THIS_SET. |
| E02 | Two cases; R wins both at 12; C wins first at 8, loses second | INELIGIBLE. The +4 joint-win diagnostic cannot erase the lost win. |
| E03 | Two cases; R wins first at 10 and loses second; C wins at 12 and 20 | Eligible, N=1 (50% of cases), D=-2; BETTER_ON_THIS_SET_BY_WINS, with slowdown disclosed. |
| E04 | One case, both win at 10; scores differ | N=0, D=0; TIED_ON_THIS_SET regardless of score. |
| E05 | Both lose all cases; C stops earlier | S empty, D unavailable, NO_SUCCESS_OBSERVED. Earlier loss is not a speed gain. |
| E06 | Case A: R=12, C attempts=8,10,12; case B: R=10, C=14; all win | A saves mean 2, B saves -4; D=(2-4)/2=-1. Pooling four attempts would give +0.5 and is wrong. |
| E07 | Copy one attempt file unchanged to another path | Retain both paths, count one captured attempt; no metric changes. |
| E08 | Required recording missing, seed mismatched, or replay incomplete | UNRESOLVED full-panel verdict; a resolved-subset table is labeled as such. |
| E09 | Score crosses target on move 8 while a bomb explodes | Loss, t=null; never a valid win at 8. |
| E10 | B=20; first crossing on completed move 20, no bomb | Win at t=20; target precedes budget exhaustion. |
| E11 | Human score=100 after 10 moves; bot score=150 after 20 | Unequal horizon, no score-quality inference. Human score at 20 is unavailable. |
| E12 | At H=10, human target-win score=100; target-disabled bot score=120; bot's original B=20 | Mixed/unknown-intent diagnostic, not evidence of equal objectives. Keep bot B=20 while externally stopping at H=10. |
| E13 | Target-disabled arm reaches H without bomb and reports "out of moves" | Horizon completed in score mode; no target-game loss-rate inference. |
| E14 | Score-mode arm bombs at move 4 with score=70, H=10 | Absorbing diagnostic score 70, actual moves 4, bomb failure visible. No extra moves or invented score penalty. |
| E15 | Harness crashes before reading the subject | Unresolved measurement, not detected bad policy. A separately reproduced illegal policy choice on valid input is policy-failure instead. |
| E16 | Diagnostic R score=0, C score=20 | Raw delta +20; percentage unavailable, not infinity or an invented denominator. |
| E17 | Same initial grid and seed, but targets differ | Distinct cases; retain collision information, do not claim independent grids. |
| E18 | R wins no cases; C wins one | Eligible, N>0, BETTER_ON_THIS_SET_BY_WINS; D unavailable. |

## 9. What Step 1 hands to Step 2

The accepted contract, its complete input inventory, worked-example review, and exact commit/hash identity are the handoff. Step 2 implements and validates these semantics without selecting policy changes. Historical statements awaiting correction remain historical; this document does not rewrite them or claim their underlying gates are green.

Source facts are limited to the cited code and metadata at the manifest's hashes. Operational choices are defined here. Per-run thresholds and sample/cost commitments remain explicit future protocol inputs. Only the independent review and recorded freeze can close Step 1; writing this file alone cannot.
