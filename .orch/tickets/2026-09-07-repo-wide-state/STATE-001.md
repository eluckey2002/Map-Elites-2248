---
id: STATE-001
run: 2026-09-07-repo-wide-state
status: complete
executor: orch-investigate
depends_on: []
write_scope: []
bound: 60 targeted source reads and at most two existing verification commands, each bounded to 120 seconds; no new experiments
claimed_by: root
claimed_at: 2026-09-07
excluded_actions: game or evidence edits, branch checkout/reset, publication, new experiments; own ticket and friction bookkeeping excepted
---

## Objective
Answer the owner's question: what is the current state of this game across the whole repository, including current remote main, other branches, local worktrees, and unfinished work?

## Fixed inputs
- User request and supplied AGENTS.md.
- Source policy: current Git and GitHub metadata for eluckey2002/Map-Elites-2248; tracked source, evidence ledger, CURRENT.md, linked backlog and primary receipts on all extant refs; local worktree status and relevant uncommitted artifacts. Historical memory is navigation only.
- Initial checkout: feat/evaluator-foundation at 5b6f92de7fc9b364c204d807fbb7b4108d38911e; pre-existing untracked tickets preserved.
- Live remote HEAD probe: main at 9d125e8c94f41282388a90402b1fba0b22ae83a8; cached origin/main was bb9d39ce2f8a474ff93443be18ced882f87ab6fb.

## Completion test
1. Repository-wide scope is explicit: compare live remote HEAD and branch listing against fetched refs; enumerate ahead/behind counts and registered worktree status; query open/recent PRs. Oracle: git ls-remote, git for-each-ref/rev-list/worktree/status, GitHub repository and PR API. oracle_class: direct-source. provenance: pre-existing.
2. State summary covers playable game, authoring, bots/evaluator, experiments, human evidence, and unresolved decisions. Each material claim cites a current ledger record and its primary source or a Git identity for unmerged work; conflicting navigation is identified. Oracle: EVIDENCE_LEDGER.md authority/proof-class rules, source code, committed receipts, tests, and backlog status at the inspected commit. oracle_class: source-comparison. provenance: pre-existing.
3. Verification and coverage limits are stated; no inferred human enjoyment, unaccepted proof promotion, or new experimental claims. Oracle: AGENTS.md evidence instructions and frozen proof-class fields. oracle_class: source-comparison. provenance: pre-existing.

## Return fields
Status, evidence packet identity, verification verdict, cited findings with confidence, contradictions, dead ends, gaps, and a concise user-facing state synthesis.

## Result
Initial repository probe found that both local working checkouts and cached origin/main predate remote main. GitHub reports PRs 16-19 merged after the cached main, including levels 54-58 and a trajectory audit instrument. Main must be refreshed before substantive conclusions.

### Repository identities and coverage

- Live remote main, checked at start and close: `9d125e8c94f41282388a90402b1fba0b22ae83a8` (PR 19, merged 2026-09-07 01:11:35 UTC / September 6 evening Chicago). `git fetch origin` refreshed remote-tracking refs without switching either existing checkout.
- Principal unmerged policy branch: `chore/startup-checks-2026-09-05` at `2601370bd639ac73bff52288f0e0306deee2f52a`.
- Enumerated all 14 live remote branches, five local branches, registered worktrees and local archive tag names. Queried all 19 PRs: all merged; zero open PRs and zero open GitHub issues at inspection.
- Current worktree stays on `feat/evaluator-foundation` at `5b6f92d`, with pre-existing untracked tickets preserved. The second existing worktree, `C:/OOO/map-elites-2248-next`, is clean on `work/next-2026-09-05` at `bb9d39c`. Local main is also `bb9d39c`, 11 commits behind remote main. Two temporary worktree registrations point at missing locations; no pruning performed.
- No tracked game, rule, solver, ledger, backlog or branch content was edited. Changes are this ticket, friction logging, and refreshed Git fetch metadata.

### Current game and authoring — high confidence, source observed

- Main contains 58 browser-game levels. `src/game.js` at `9d125e8`, lines 101-158, and `solver/tests/gameLevels.test.js` pin levels 51-58. New levels include central-choke geometry, narrow layouts, stones, ice and timed bombs. Level 54 is the central-choke pilot geometry at target 126,000; it is distinct from the older `candidate-levels-54.json` tighter-pace candidate.
- Ordinary play is seeded and can be captured through `tools/play-server.js` into `play-sessions/`. Candidate/pilot recordings retain their own identity and receipt path. Primary source: main `tools/play-server.js`, `src/game.js#makeSeededRng`, and tracked `play-sessions/*.json`.
- The level generator exists: main `solver/generate-levels.js` samples shapes, screens them, and gates selection. The authoring path imports frozen `calib-1`, not the live bot (`solver/level-author.js:15`; EVIDENCE_LEDGER RESULT-0027). This is an operational generation/calibration pipeline, not proof of human difficulty or fun.
- Authoring milestone remains open. Main CURRENT records a missing ledger adjudication for Level 53's historical rejected-to-shipped transition. The two stale candidate receipts are still visible in CI. Do not interpret those candidate filenames as current shipped level identities.

### Policy and experimental standing — high confidence at named scope

- Current engineering champion is target-aware immediate-finish (DECISION-0004), with the September 5 rollout search-parameter fix. Historical RESULT-0018/0020's 1.271-moves-saved figure predates that fix and is not a fresh magnitude for the current bot. Primary sources: main `solver/bot.js`, `solver/tests/targetAwareChallenger.test.js`, EVIDENCE_LEDGER current snapshot and DECISION-0004.
- MAP-Elites has an accepted bounded diversity result, not a stronger champion: RESULT-0017 occupies 20/25 cells. Its leading screen representative reports +3.30% screen and -3.572341696285384% disjoint score holdout; the other two representatives also lose holdout. Inspected the primary `solver/map-elites-output/archive.json`; its SHA-256 is `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`, matching the corrected diagnostic.
- RESULT-0024 remains accepted but empirically INCONCLUSIVE for the exact one-stone/two-stone interaction. RESULT-0026 remains FALSIFIED: the frozen handmade policy loses six reference wins. These do not support promotion or scaling those exact studies.
- Stranded-cell pressure remains a candidate descriptor; its recorded exact range probe was ambiguous. Main HANDOFF's September 6 half-score-move/greed-ratio exploration is explicitly exploratory and relies on one captured human loss. No accepted predictive result follows from that narrative.
- Frozen Level 26 seed-0 proof stays parked and unresolved: accepted replayed lower bound 12,336, proven non-decisive upper bound 326,390; 13,000 reachability and the exact 32-move maximum remain unknown. This is the historical scale-1 input, not the retuned current Level 26. Sources: EVIDENCE_LEDGER RESULT-0001/0002/0004, DECISION-0002, frozen exact-score test and run identities.

### Material integration split — high confidence, artifacts and hashes checked

Main has the new instrument but does not contain the accepted policy contract/measurement package, DECISION-0006, CORRECTION-0005/0006/0007, or BL-0014. Those remain on `2601370`.

The branch's owner-required sequence is:

1. Evaluation contract: accepted and frozen.
2. Measurement corrections and baseline: accepted after independent verification.
3. Bot-own-trajectory audit: instrument implemented and subsequently merged as PR 18 (`321123f`); no actual audit population/protocol/collection found.
4. Supported change, validation and possible promotion: dependent on the audit; no new policy is established.

The priority is already selected on that branch: preserve reliable wins, then prefer faster wins; score is a separate diagnostic. Therefore main's statement that the objective is still unchosen, and its active-looking proposal to immediately add policy terms, do not represent the most advanced accepted repository-wide intent.

Primary package paths at `2601370`:

- `docs/plans/2026-09-05-policy-improvement-sequence.md` and `docs/backlog/BL-0014-policy-improvement-sequence.md`.
- `docs/evaluation/POLICY-EVAL-0001/contract.md`, hash checked `3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f`.
- `docs/evaluation/POLICY-EVAL-0001/inputs.json`, hash checked `1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb`.
- `.orch/runs/2026-09-05-policy-measurement-extra-repair/baseline-c61d443.json`, hash checked `a79fe73494dbff59dc7bc8a822c558caf18f3ce0b194412f4e02cbf38b03889e`.
- `docs/evaluation/POLICY-EVAL-0001/measurement-acceptance.md` records the independent acceptance and its exact envelope; read this as accepted package standing, not a new policy result.
- `.orch/runs/2026-09-05-policy-grounding/pilot-position.json`, hash checked `8b81ffd5e8af13723864a58c09ade8d50af9d6ce296dcfc242a976d2374e85b2`.
- `.orch/runs/2026-09-05-policy-grounding/archive-diagnostic.json`, hash checked `6bce154de924a3710188293c7f92c9728a88d153f0934b7caa74bf60a5154987`.

Corrections that materially change the reading of the game:

- The old +65.7% bot-score claim gave the bot more moves; all 14 winning human recordings stopped at first target crossing. It is not a fair same-opportunity strength comparison.
- The bot already values several future opportunities. The inspected human-reached pilot position demonstrates a real immediate-win generation miss (23,216 needed; exact/human 37,760; default pool maximum 6,144; untrimmed greedy maximum 21,504). It does not establish a miss on the bot's own trajectory, where it wins at move 19, nor justify the proposed new terms.
- RESULT-0017 used score lift, not saturated win rate. The -0.64% attribution has unresolved origin; actual leading representative holdout is -3.57%.

The accepted descriptive baseline contains 15 files in two panels: 12 candidate/pilot attempts representing 9 cases and 8 initialized grids, plus 3 ordinary-play current-subject cases. Receipt-panel human comparison is INELIGIBLE under the reliability criterion because one attempt loses a reference win; ordinary-panel human play is 1.3333 moves faster on these three cases with no such regression. Matched-horizon score diagnostics favor human recordings by 4.16% and 39.58% respectively. These are selected-corpus descriptions, not population strength or enjoyment findings. The raw JSON has no unresolved or extra rows.

### Remaining side branches

| Branch | Observed unique work / current relationship |
| --- | --- |
| chore/startup-checks-2026-09-05 | Accepted contract, measurement implementation, baseline and corrections missing from main; its audit implementation was selectively merged in PR 18. Direct tree comparison shows the human-benchmark and input-loader versions still differ. |
| feat/player-playtest-feedback | Five unmerged commits adding live chain explanation, local PlayerStudy capture, summaries, mobile controls/tests; no open PR. |
| codex/research-session-2026-08-28 | Unmerged deterministic generated-corpus tooling. Main's preserved branch-triage evidence records stale protocol hashes, seed collision and API drift; not qualified as a drop-in recovery. No rerun here. |
| worktree-deterministic-2048-solver | Separate vanilla-2048-with-walls engine, exact solver and playable seeded prototype; not the shipped 2248 chain game. Read its README at 717aa6a. |
| feat/evaluator-foundation | Older integration lineage; capability is now on main through RESULT-0027/PR 1, but main has moved substantially beyond this checkout. |
| map-elites-learning | Historical target-aware evidence/authority-sync preservation; current champion decision is already on main. |
| codex/2026-08-29T10-29-19Z-adhoc-session-workspace | Parked research; human-replay capability was recovered onto main, heavy-after was rejected according to preserved triage. |
| codex/target-aware-promotion-rehearsal-2026-08-30 | Preserved rejected/revoked promotion-rehearsal lineage; not promotion authority. |
| codex/premise-discovery-readiness; codex/preserve-pre-promotion-untracked-2026-08-30; archive/claim-evidence-verdict-2026-09-01; worktree-archify-diagrams | Preserved research packets, audit snapshot, or diagrams; not alternate shipped game states. |
| level-curve-retune | Tip contained in current main. |

Primary inventory evidence: live `git ls-remote --heads origin`, `git for-each-ref`, per-ref `rev-list`, changed-path comparisons from merge bases, and main's `.orch/tickets/2026-09-02T-adhoc-remote-branch-triage/BRANCH-TRIAGE-001.md`. Historical triage dispositions were not converted into freshly rerun tests.

### CI and limits

At exact main `9d125e8`, GitHub run 34072221228 completed:

- Required experiment gate: PASS, job 101591527260.
- Full suite: **361 tests; 357 pass; 4 fail**, job 101591527182, about 39 seconds. Failures: candidate-levels-52 receipt, candidate-levels-54 receipt, generated views current, verification observations rebound from current evidence/date.
- Full suite is informational (`continue-on-error: true`); the workflow's green overall result is not an all-green suite. Main AGENTS still says 344/348, and workflow prose still says five failures; exact CI log is newer primary evidence.

CI URLs: https://github.com/eluckey2002/Map-Elites-2248/actions/runs/34072221228/job/101591527182 and https://github.com/eluckey2002/Map-Elites-2248/actions/runs/34072221228/job/101591527260 .

No new game simulations, experiment runs, solver proof search, UI test or deployment check was performed. Remote unpublished work on another computer is not visible; historical archive tags were inventoried but not exhaustively re-audited. Current local worktrees and all live remote branch tips were covered.

### Synthesis and next action

A functioning 58-level game, operational authoring machinery and a strong heuristic reference bot exist. MAP-Elites has shown diversity but no replacement champion. The useful current policy task is the bounded bot-trajectory audit under the accepted reliability-first contract. First reconcile the accepted measurement/correction package with main so the tool, benchmark and navigation agree. This is a recommendation only; no integration or audit was executed by this status request.

## Verification
1. PASS — live repository identity and refs fetched, both extant worktrees inspected, ahead/behind and branch-specific paths checked, and GitHub PR/issues/current CI queried. Closing ls-remote confirms main and principal branch unchanged during inspection. Oracle provenance: pre-existing Git/GitHub metadata.
2. PASS — all named game/research areas covered with exact ref/path evidence; primary code, archive, baseline and artifact hashes inspected. Branch-only acceptance is labeled separately from merged main. Oracle provenance: pre-existing ledger, source and receipts.
3. PASS — proof classes, empirical falsification/inconclusiveness, exploratory human evidence and verification limits preserved; no claim of independent reproduction of historical experiments. Oracle provenance: supplied AGENTS and record schema.

Overall: PASS for the bounded repository-status question; not an all-green repository or product-readiness verdict. Independence comes from the concretely specified pre-existing source and CI oracles, not newly authored behavioral tests.

## Feedback
Full-ledger and broad-memory reads truncated; moved to paged/scoped reads. Root package.json absent. Logged with friction.py.

## Risks
This is a bounded status investigation, not full experimental reproduction or a production-readiness certification.

Contradictions retained explicitly: main's benchmark interpretation versus branch corrections; main's unchosen objective versus accepted branch contract; branch navigation's unimplemented/stopped instrument versus subsequent source fix and merged PR 18; historical test-count prose versus exact current CI.

Dead ends: root package.json absent (plain browser/Node project); broad/full markdown output truncated (resolved with scoped reads); gh run view --log gave no selected output (resolved with direct job-log API and its actual symbol-based summary format).

## Integration

Caller join of the inline ad-hoc investigation: **accepted**, all three pre-existing source-oracle criteria covered. Result owner is root as dispatched; no deliverable edits or out-of-scope work occurred. No invalidated evidence. Final raw source comparison confirms main and 2601370 have identical game, bot, engine and trajectory-audit blobs; benchmark-inputs and human-benchmark differ. The recording diagnostic hash also matches CORRECTION-0005 and confirms 11 receipt-panel plus 3 ordinary-panel human wins stopped at first target crossing. This supports the reported integration split without treating the unmerged benchmark as shipped.

Result identity: this ticket at `C:/OOO/Map-Elites-2248/.orch/tickets/2026-09-07-repo-wide-state/STATE-001.md`. Scope closes as a status answer, with recommendation recorded and no authorization inferred to integrate or start the audit.
