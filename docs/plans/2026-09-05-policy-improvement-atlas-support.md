---
title: Atlas support for the pinned policy improvement plan
type: consultation
date: 2026-09-05
status: advisory
---

# Atlas support for the pinned policy improvement plan

## Pinned authority and scope

The owner's instruction was: "So, pin that plan and stick to it. That will keep us honest. Check the patterns vault and see if they are any methods, patterns, frameworks that would help"

The [required plan](2026-09-05-policy-improvement-sequence.md) remains byte-for-byte the version committed at `85d8684`, SHA-256 `6310780fa70e31951345f3fa35f1160b3b13fa5bc39bc22410e49a9765fadfb2`.
The pin covers the whole plan file; it is an identifiable, committed instruction, not a new executable lock.
DECISION-0006 and R1-R6 still govern; an explicit owner amendment is needed for deviation.
[BL-0014](../backlog/BL-0014-policy-improvement-sequence.md) remains the progress record: Step 1 ready, Steps 2-4 blocked, no stage executed.

This is a read-only Atlas consultation, not adoption of a replacement framework or completion of the evaluation contract.
The shortlist follows the Atlas's [problem-first consultation rule](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/_meta/PROBLEM-FIRST.md>): at most three methods, each with a specific fit, exclusion, use record, boundary, and next action.
Recommendations below are reasoned applications to this plan; they are not observed 2248 outcomes.

## Three recommended methods

### 1. METHOD-003 - Freeze the Rules and Record the Version

Source: [canonical method](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Freeze the Rules and Record the Version.md>) and [Immutable Protocol Versioning, PAT-004](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Patterns/Immutable Protocol Versioning.md>).

- **Where:** Step 1; carry the accepted identity into Steps 2-4.
- **Why it fits:** comparisons need stable definitions of reliability, speed, score horizon, subject identity, and weighting. Preserving the evaluation rules prevents a result from being judged against definitions chosen after seeing it.
- **Concrete application:** commit the reviewed evaluation contract once Step 1 is complete. Subsequent reports identify that contract and the exact reference/challenger inputs. For generalizing runs, use the repository's existing preregistration mechanism; do not build a second versioning system.
- **Closest recorded use:** [OSBRAIN — Typed-Edge Campaign, APP-001](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Use Cases/OSBRAIN — Typed-Edge Campaign.md>) explicitly lists this method. [OSBRAIN Campaign Close, EVIDENCE-001](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Evidence/OSBRAIN Campaign Close.md>) is an Atlas pointer to project-owned receipts, not an independent reproduction here.
- **Known boundary:** freezing preserves provenance; it does not make a weak evaluation contract correct. Name the whole covered document or an explicit field subset. A hash identifies content, not independently the real time at which an experiment ran; do not overstate a writer-controlled stamp.
- **When not to use:** do not add machinery for an unconsumed scratch example, or use a new version to rewrite an old result. Do not claim today's plan pin means the still-unwritten evaluation contract is frozen.
- **Next action:** within Step 1, define the contract's identity-bearing fields and worked examples; commit the completed contract before Step 2.
- **Confidence:** direct source support for the method and recorded use; proposed relevance is well grounded, but incremental benefit in 2248 is unmeasured.

### 2. METHOD-029 - Verify the Instrument Before You Believe It

Source: [canonical method](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Verify the Instrument Before You Believe It.md>).

- **Where:** Step 2's benchmark repair and Step 4's new or changed validation paths.
- **Why it fits:** a benchmark can consistently print numbers while answering the wrong question; a failing control can be a crash rather than detection. The method requires evidence about what the instrument actually observed.
- **Concrete application:** drive the real comparison path with a valid matched case and a controlled bad case. Isolate the relevant difference: identity mismatch, false outcome, or an unequal horizon. Record the raw output and exact refusal/comparison reason. A deliberately unequal horizon should be labeled as a different comparison, not credited as better policy performance.
- **Closest recorded use:** [Loop Lab — Verification Cluster in a Critic-Evaluator Study, APP-014](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Use Cases/Loop Lab — Verification Cluster in a Critic-Evaluator Study.md>) records wrong probes and green-on-nothing failures. It is a draft origin/retrospective case, not proof that prospective use of METHOD-029 prevented them.
- **Known boundary:** the method's own promotion section says improved outcomes from following it are not established. Its author can share a blind spot with the instrument. Calibration does not replace independent review or broader repository checks.
- **When not to use:** do not re-qualify an unchanged existing test already observed failing for the correct reason merely to create another receipt. Apply this to new or materially changed measurement/control paths.
- **Next action:** when Step 2 opens, identify the benchmark's actual input-to-result path and specify one valid control plus one isolated misleading case before changing it.
- **Confidence:** direct support for the failure-handling procedure; transfer to this benchmark is a recommendation, not measured effectiveness.

### 3. METHOD-025 - Run the Cheapest Falsifying Test First

Source: [canonical method](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Run the Cheapest Falsifying Test First.md>).

- **Where:** Step 3, after Steps 1 and 2 close; its disposition limits Step 4's scope.
- **Why it fits:** the plan calls for establishing the cause before choosing generator changes, ranking terms, or other repairs.
- **Concrete application:** ask whether a legal immediate winning chain is missing from the offered moves on positions the reference bot actually reaches. If it was offered, inspect ranking or selection instead. If bounded search cannot decide, retain UNKNOWN. Use the existing search and replay tools within the declared audit; do not create a general diagnostic framework.
- **Closest recorded use:** the method explicitly has no deliberately applied Atlas Use Case. It cites [Universal Quality Improvement Claim Audit](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Evidence/Universal Quality Improvement Claim Audit.md>) as a close instance, where an overbroad claim remained unestablished rather than being rescued by more examples. That analogy is not a bot-search result.
- **Known boundary:** a local miss does not establish whole-game benefit, and a limited search cannot prove no miss exists. A surviving premise justifies the next planned investigation, not promotion.
- **When not to use:** not when no observation distinguishes the explanations, not as an endless demand for one more probe, and never to move the Step 3 audit ahead of the Step 1 contract or Step 2 measurement repair.
- **Next action:** once Step 3 is released, state the missing-generation premise and its competing ranking/selection explanations, then define the smallest replayable test and search bound that distinguishes them.
- **Confidence:** direct source support for the procedure; no Method-specific prospective Use Case or measured 2248 benefit was found.

## How this fits the four existing steps

| Existing step | Supporting method | What it adds without changing order |
| --- | --- | --- |
| 1. Evaluation contract | METHOD-003 | One preserved version of the complete comparison rules. |
| 2. Correct measurements | METHOD-029, using the Step 1 identity | Valid and bad controls through the real measurement path; reasons, not just pass/fail colors. |
| 3. Bot-trajectory audit | METHOD-025 | A bounded test that separates missing generation from ranking/selection explanations. |
| 4. Supported change and validation | Reuse METHOD-003 and METHOD-029; retain METHOD-025's disposition | Freeze the challenger/run rules, validate the measurement path, and implement only the supported repair. |

The already-planned no-reference-win-loss rule resembles [Keep Quality From Going Backward, PAT-012](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Patterns/Keep Quality From Going Backward.md>).
That pattern supplies a name, not another requirement: it protects only the measured quality dimension on the declared comparison set, not every future board or all quality.

## Warnings, contradictions, and bounded exclusions

- **A directly relevant recorded harm:** [Universal Quality G3 Receipt](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Evidence/Universal Quality G3 Receipt.md>), Planning and Bounded refinements, records a treatment-only dependency-order error: cheap-first advice postponed a required architecture decision until after dependent work. [Run Cheap Checks Before Expensive Review, METHOD-018](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Run Cheap Checks Before Expensive Review.md>) now explicitly confines cheap-first ordering to a valid dependency stage. This supports preserving R1, not adding an early Step 3 probe.
- **No blanket Atlas-effect claim:** the [claim audit](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Evidence/Universal Quality Improvement Claim Audit.md>) reports mixed outcomes and no established consistent causal advantage. This consultation does not claim these methods will improve the bot or save a measured amount of work.
- **Unresolved source attribution:** [METHOD-034](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Prove the Probe Moves Before Trusting What It Says.md>) assigns memoization and masking-alarm probe examples to a loop-lab repair. METHOD-029 attributes those examples to scribegraph; APP-014 also recounts wrong probes in the loop-lab study. Original session sources outside the vault were not opened. The examples are useful failure descriptions, but their project attribution is unresolved here; these notes must not be counted as independent cross-project confirmations.
- **Overlapping methods, not extra recommendations:** [Ask the Decisive Question, METHOD-020](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Ask the Decisive Question.md>) overlaps the bounded Step 3 question and has no separate Use Case. METHOD-034 is narrower than METHOD-029 and omits the explicit crash-versus-detection and raw-output classification checks, so METHOD-029 is selected. [Close From the Frozen Plan, METHOD-011](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Close From the Frozen Plan.md>) describes independent closeout, already consistent with the plan's existing review/acceptance requirements; no separate new review program is proposed.
- **Not relevant to the selected work yet:** [Equal-Budget Random Arm, METHOD-036](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Make the Learner Race an Equal-Budget Random Arm.md>) answers whether a learning/search process beats random search; the plan has not selected such a process. [Budget the Input That Does Not Replenish, METHOD-038](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Budget the Input That Does Not Replenish.md>) concerns human-rating consumption; the plan requests no new rating study and it must not turn measured proxies into replacements for human play experience.
- **Considered but not selected:** [Test the Premise Before You Test the Qualification, METHOD-040](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Test the Premise Before You Test the Qualification.md>) makes the useful distinction that a viable premise does not predict final qualification. Its dedicated-gate form adds no needed mechanism to the existing Step 3/Step 4 separation, so METHOD-025 is the smaller fit.
- **Dead ends and coverage limits:** EVIDENCE-001 is only a pointer; it does not supply an independent receipt inside the Atlas. METHOD-025's Use Cases section supplies no deliberate application. This was a bounded problem-first review, not an exhaustive vault audit, a web literature review, a replay of Atlas experiments, or a review of linked external project repositories.

## Live source identities

Atlas checkout: `/Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault` (also reachable through `/Users/eluckey/Developer/Pattern Atlas-Vault`).
HEAD at consultation: `293baf99745734d87ded64882f66a377afd55029`.
The checkout contains existing uncommitted edits; the hashes below identify the live notes actually consulted rather than pretending HEAD alone identifies them.
"Dirty" describes source checkout state, not quality. The Atlas remains read-only.
Initial full `git status --porcelain=v1 --untracked-files=all` SHA-256: `a14dab3dcc0f47cdb3935466d3b92ffc487ef586e0a57b4887bfbcf6a78e3088`.

| Source | ID | Dirty | SHA-256 |
| --- | --- | --- | --- |
| [CONTEXT.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/CONTEXT.md>) | CONTEXT-001 | no | `f60ddf9e7a62afd8420a6432562cd025c745681ee81a91cbf5759e7f32632963` |
| [README.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/README.md>) | HOME-001 | no | `e02a2735ea29aa97a94799ccc5700f3164a7749effb0102a66af1bdbe0176d45` |
| [_meta/PROBLEM-FIRST.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/_meta/PROBLEM-FIRST.md>) | VIEW-001 | no | `67790b9eda609c8990f980c013bd6fbc541c8784beb3de05995223411220091c` |
| [_meta/BOUNDARIES.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/_meta/BOUNDARIES.md>) | VIEW-002 | no | `c0a204c3848a7c6dd7f214da864e14f76d816d4be4703d757b5c333ada406474` |
| [Methods/Freeze the Rules and Record the Version.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Freeze the Rules and Record the Version.md>) | METHOD-003 | no | `aee25242b2aeefcc1ade9b9ee6e433978c08dfc74e6d3dd79a07225b0f888575` |
| [Methods/Prove the Probe Moves Before Trusting What It Says.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Prove the Probe Moves Before Trusting What It Says.md>) | METHOD-034 | yes | `e2e47f4cee356913a7245d2d77be80f6af42b8d3235b642052aae2dc23e79299` |
| [Methods/Run the Cheapest Falsifying Test First.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Run the Cheapest Falsifying Test First.md>) | METHOD-025 | yes | `0e107bb3154c90556af469b9c073738730cbd0bf783411d05e035de69db8bcd5` |
| [Methods/Ask the Decisive Question.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Ask the Decisive Question.md>) | METHOD-020 | yes | `4d81b687edcf79620984d1e198aaf9739641fe1e50d71671382f4f4c66eddc5e` |
| [Methods/Close From the Frozen Plan.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Close From the Frozen Plan.md>) | METHOD-011 | yes | `d289061361c9aca9c241fb6108b0079842a06ab6f10bf4bbeccfa2d64a3e1962` |
| [Patterns/Keep Quality From Going Backward.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Patterns/Keep Quality From Going Backward.md>) | PAT-012 | yes | `6d13043dee9737cc83fbfc03b0fae12bc74fee6c4b32a6798d3b87bffc179324` |
| [Use Cases/OSBRAIN — Typed-Edge Campaign.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Use Cases/OSBRAIN — Typed-Edge Campaign.md>) | APP-001 | no | `ee46bdf41e9b0be7b1f3a1bb68d98801a8029b7fa5a0e337ecd36c6016e82723` |
| [Evidence/OSBRAIN Campaign Close.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Evidence/OSBRAIN Campaign Close.md>) | EVIDENCE-001 | no | `3f3e48df10ea5ce25ca36cdbc97ebb028cd0926d51f342f9f5225a2a533e7953` |
| [Use Cases/Loop Lab — Verification Cluster in a Critic-Evaluator Study.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Use Cases/Loop Lab — Verification Cluster in a Critic-Evaluator Study.md>) | APP-014 | no | `388f8fc0a54f029c62d2515b2e7abb11d025c88d15ce8a33350f92fbbea4aadc` |
| [Evidence/Universal Quality Improvement Claim Audit.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Evidence/Universal Quality Improvement Claim Audit.md>) | EVIDENCE-UNIVERSAL-QUALITY-AUDIT-001 | no | `4000bd98d1bd28d88ce145ef09cbb27bd8e871fba1f91ca7019089392a2e5e73` |
| [Evidence/Universal Quality G3 Receipt.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Evidence/Universal Quality G3 Receipt.md>) | EVIDENCE-UNIVERSAL-QUALITY-003 | no | `9f5f4d093f7c48e686ef25f760197daa5414aed4095637bf896c056733cbbdf0` |
| [Methods/Run Cheap Checks Before Expensive Review.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Run Cheap Checks Before Expensive Review.md>) | METHOD-018 | yes | `cf2c12c889f66a60e847da517ef017e82d97ab3879b93ffd5aba4c3b0cb9a4ba` |
| [Patterns/Immutable Protocol Versioning.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Patterns/Immutable Protocol Versioning.md>) | PAT-004 | no | `8ef1536bb39b391e3d52a51c59fe0a3d82349a7c2a10d849dca01dee8c3e4767` |
| [Methods/Verify the Instrument Before You Believe It.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Verify the Instrument Before You Believe It.md>) | METHOD-029 | no | `c29e40187ce56302fffeb364844d36a4e6cd9be1aca4d6ac4269b908a25547de` |
| [Methods/Test the Premise Before You Test the Qualification.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Test the Premise Before You Test the Qualification.md>) | METHOD-040 | no | `d5d11b589f6b893f841e0c81151247a005faa09380e6e6e43deb0aa98bcb84e5` |
| [Methods/Budget the Input That Does Not Replenish.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Budget the Input That Does Not Replenish.md>) | METHOD-038 | no | `6a7fcf03c1cdf641651326d0047698f2e74ee69ed4ae0b92e91309e37f2b33d0` |
| [Methods/Make the Learner Race an Equal-Budget Random Arm.md](</Users/eluckey/Developer/Priority/Git-Backed/Pattern Atlas-Vault/Methods/Make the Learner Race an Equal-Budget Random Arm.md>) | METHOD-036 | no | `b3b6ed047ec2158ec003741c2ee4bfe18a7c72f15ed8889c07b80f5aa6214b46` |

## Disposition

Retain these three methods as advisory support attached to BL-0014, not as a replacement plan or evidence of completed work.
No benchmark, bot, experiment, game rule, receipt, Atlas note, or stage-completion state changed.
The next execution task is still Step 1: write and review the evaluation contract.
Verification and consultation closeout live in [ATLAS-001](../../.orch/tickets/2026-09-05-atlas-policy-methods/ATLAS-001.md).

