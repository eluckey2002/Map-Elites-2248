---
id: GROUND-001
run: 2026-09-06-policy-trajectory-intake
status: complete
executor: orch-investigate
profile: orch-worker
depends_on: []
write_scope: []
bound: 7 minutes
claimed_by: /root/trajectory_ground_gpt_5_6_sol_high
claimed_at: 2026-09-06T05:30:17Z
---

## Objective

Which existing source interfaces and evidence constraints support the smallest
bounded Step3 audit of missed immediate wins on the unchanged bot's trajectories?

## Fixed inputs

Root91337e5, clean; accepted Step2 envelope all33hashes freshly match. Read
AGENTS, required plan Step3, frozen POLICY-EVAL-0001 contract/inputs and relevant
primary solver code/tests. Source policy: this checkout only; no old verdicts
as empirical evidence. Probe filenames/symbols before targeted source reads.

## Completion test

1. I1: Identify exact exported trajectory/replay/transition and exact-chain
   interfaces, default chooser/RNG semantics, search completion/cap reporting,
   bomb-order validation, and offered-chain classification access. Oracle:
   cited symbols/line ranges and existing tests showing each; oracle_class=evidence;
   provenance=pre-existing. State missing capability, never invent an API.
2. I2: Identify seed inventory/registration conventions, suitable existing
   protocol exemplar, topology-selection inputs and artifact custody constraints.
   Oracle: cited primary files and protocol/seed rules; oracle_class=evidence;
   provenance=pre-existing. Suggest a minimal bounded audit shape as a proposal,
   not measured outcome; name any unresolved owner-only choice.

## Return fields

Cited findings, confidence, contradictions/dead ends, uncovered remainder,
per-I oracle/class/evidence/covers. Incremental evidence in canonical ticket.

## Result

Bounded source-grounding result (source base `91337e5`; current administrative
root `0a71c27`, whose only diff from the source base is this ticket): the
smallest Step 3 audit can reuse the shipped bot recorder, chooser-analysis,
transition, and bounded-search seams, but it still needs an audit-specific
independent verifier and an exhaustive bounded immediate-win decision seam.
No game, replay, benchmark, or new measurement was run.

### Cited findings

1. **Bot-own trajectory capture exists and is identity-bound (high confidence).**
   `recordSession(levelData, seed, options)` is exported by
   `solver/record-session.js:69-72,196`. It uses the unchanged `analyzeMove`,
   records `boardBefore`, post-gravity board, spawn delta, selected chain,
   points, scores, and the full decision at every move
   (`solver/record-session.js:81-113`), then binds subject, policy parameters,
   bot/engine/recorder/level hashes, lookahead convention, final board, outcome,
   and a SHA-256 session identity (`solver/record-session.js:133-159`). Existing
   tests show same-input deterministic session identity and reconstruct every
   transition and selected production choice from the artifact
   (`solver/tests/botVision.test.js:64-79,81-138`). `snapshotBoard` is also
   exported (`solver/record-session.js:17-24,196`).

2. **The exact transition primitives are exported, but terminal handling is a
   caller responsibility (high confidence).** `engine.js` exports
   `makeRng`, `createLevelState`, `executeChain`, `applyGravity`,
   `spawnNewTiles`, `tickBlockers`, `checkBombs`, legality helpers, chain
   searches, and cloning (`solver/engine.js:513-532`). The full move order is
   merge/score -> gravity -> refill -> blocker tick
   (`solver/record-session.js:93-100`), followed by bomb loss before target and
   budget (`solver/record-session.js:115-125`). `classifyTerminal` separately
   exports the complete precedence bomb -> target -> budget -> no legal move
   (`solver/benchmark-replay.js:48-57,195`), and the existing E09-E10 test
   asserts that ordering, including bomb-over-target and a move-B win
   (`solver/tests/policyBenchmark.test.js:279-289`). Game/engine parity tests
   also cover final-tile bomb defusal, non-final bomb deletion, ticking, and
   explosion detection (`solver/tests/mirrors-game.test.js:197-217,290-318`).

3. **Reference chooser and RNG semantics are exact and test-covered (high
   confidence).** The frozen reference is `chooseMove`, not `chooseBaseMove` or
   `analyzeMove`, with the manifest's exact `DEFAULT_PARAMS`
   (`docs/evaluation/POLICY-EVAL-0001/contract.md:21-25`;
   `docs/evaluation/POLICY-EVAL-0001/inputs.json:7-26`). `makeRng` is mulberry32
   over `seed >>> 0` (`solver/engine.js:1-11`), so audit intake must call the
   exported `validateSeed` and reject aliases outside uint32 rather than rely on
   coercion (`solver/benchmark-inputs.js:39-44`). The live stream initializes
   the board and then supplies refills; every lookahead factory call gets a
   fresh `makeRng(987654321 + zero-based moveIndex)`
   (`docs/evaluation/POLICY-EVAL-0001/contract.md:29-31`;
   `solver/record-session.js:72-85`). The existing test proves arbitrarily
   consuming lookahead factories cannot consume the private live-refill stream
   (`solver/tests/policyBenchmark.test.js:337-353`).

4. **Decision/pool access supports cause classification, but no single
   classifier is exported (high confidence).** `analyzeMove` and
   `analyzeBaseMove` are exported alongside `chooseMove` and the defaults
   (`solver/bot.js:566-569`). Each candidate exposes exact coordinates,
   generation rank, chain length/sum, immediate and rollout terms, weights,
   contributions, policy score, survivor and predicted board
   (`solver/bot.js:231-285`). The result exposes `reason`, `poolType`, selected
   ID/chain, params and candidate list; it distinguishes normal ranking,
   no-valid-move, bomb override, and target override
   (`solver/bot.js:451-508,537-563`). Existing tests prove its selected chain
   matches `chooseMove` without state mutation over representative shapes and
   that recorded candidates recompute exactly
   (`solver/tests/botVision.test.js:47-62,81-138`). An audit can therefore
   classify a confirmed winning action as absent from the offered pool,
   offered-but-ranked-lower, or bypassed by `reason`/`poolType`; that comparison
   logic does not yet exist as an exported API and should not be claimed to.

5. **Two chain-search surfaces exist, with materially different completeness
   limits (high confidence).** `findTopChains` performs uncapped DFS over legal
   paths but deduplicates only by `(final tile, length, points)` and returns no
   visited-node, timeout, or completeness report
   (`solver/engine.js:192-255`). That identity is insufficient to preserve every
   distinct removed-cell transition. `targeted-chain-generator.js` exports
   transition-equivalent `actionIdentity`, order-preserving
   `exactChainIdentity`, and `generateTargetedChains`
   (`solver/targeted-chain-generator.js:15-27,228-233`). The generator has
   caller-set/default node, outward-candidate, and path-width caps and returns
   `complete`, `capReasons`, counts, elapsed time, and exact limits
   (`solver/targeted-chain-generator.js:9-13,105-123,206-225`). Tests prove a
   complete small search, deterministic fail-closed node caps, and honest
   candidate-limit telemetry (`solver/tests/targetedChainGenerator.test.js:71-89,106-150`).
   However, it deliberately emits only candidates retained for four generation
   objectives, not every traversed action (`solver/targeted-chain-generator.js:101-105,142-157,185-207`).
   Therefore `complete: true` means traversal/output caps did not bind; it does
   **not** by itself prove that no unreturned immediate-winning action exists.
   There is no current exported seam that simultaneously (a) checks every
   transition-equivalent legal action for target crossing, (b) fails closed as
   `UNKNOWN` on a node/time/output cap, and (c) exposes a winning witness.

6. **Replay/custody is partly reusable, not yet evidence-complete for schema-2
   bot sessions (high confidence).** `replayRecording` validates a recorded
   chain against live tiles, applies the full transition, stops at terminal,
   rejects continuation, and returns unresolved on mismatch/fault
   (`solver/benchmark-replay.js:126-193`), with real/tampered/missing/terminal
   tests (`solver/tests/policyBenchmark.test.js:218-289`). It is for the human
   recording schema, not `recordSession`'s bot-session artifact. The Bot Vision
   reconstruction test is strong pre-existing evidence, but its replay logic is
   embedded in the test rather than exported as an independent artifact
   verifier (`solver/tests/botVision.test.js:81-138`). Step 3 therefore needs a
   separately bound verifier/receipt path before a session JSON can support an
   audit claim; a `sessionIdentity` self-hash alone is custody, not independent
   replay entitlement.

7. **Topology, seeds, protocol, and custody constraints are already explicit
   (high confidence).** The frozen inventory contains all 58 shipped subjects;
   selection must preserve dimensions, blocker type/duration/timer, minimum
   chain, tile scale, target, and full budget, and group by canonical
   `subjectKey`, not level label (`docs/evaluation/POLICY-EVAL-0001/contract.md:21-31`).
   `experiments/SEEDS.md:1-12` defines every inspected range as burned and
   requires repository search plus registration before calling a range fresh;
   its current inventory is at `experiments/SEEDS.md:13-44`. A generalizing
   audit requires a committed pre-run protocol; registered freezes must match,
   completed artifacts must bind frozen sources, and the protocol commit must
   precede the report (`experiments/README.md:7-17,19-49,55-64,91-92`).
   `RESULT-0026` is the closest existing protocol exemplar for a finite
   level/seed panel, terminal stopping, source closure, one-shot execution,
   independent replay/challenge, per-decision cost, and honest cap limits
   (`experiments/RESULT-0026/protocol.md:52-95,111-154,180-219`). It explicitly
   treats a node-bounded search with no per-move cap-hit status as unable to
   support completeness (`experiments/RESULT-0026/protocol.md:180-185`).

### Smallest bounded audit shape (proposal only)

Freeze one finite manifest-selected panel of unchanged shipped subjects and a
predeclared seed list; derive strata only from `subjectKey` inputs (dimensions,
min-chain, scale, and blocker configuration). For every `recordSession` bot
position before terminal: retain the identity-bound state and decision, run one
audit-specific exhaustive immediate-win predicate under fixed per-position node
and wall-clock caps, label every capped position `UNKNOWN`, replay each returned
witness through merge/gravity/refill/tick and bomb-first terminal classification,
then compare its `actionIdentity` to `analyzeMove(...).candidates` and selected
chain to assign only generation/ranking/control-flow/unresolved. Report the full
position denominator, confirmed misses, UNKNOWN positions, affected finish
delay/losses, and per-decision/end-to-end cost. Independent verification must
replay the bot sessions and witnesses and bind the protocol, source hashes,
subject/seed manifest, raw artifact, and cap telemetry. This is a proposed
instrument shape, not evidence that any miss exists.

Owner-only choices remain unresolved: whether the audit is only descriptive of
a named finite panel or intended to support a broader claim; the exact topology
strata/subjects and fresh seed range/sample size; the meaningful miss-frequency,
converted-win/speed, and repair-justification threshold; uncertainty/cluster
unit and repeated-testing rule; and numerical per-position latency/node and
whole-run cost ceilings. The accepted contract explicitly defers these choices
to the Step 3 protocol (`docs/evaluation/POLICY-EVAL-0001/contract.md:110-120`).

### Contradictions and dead ends

- No source contradiction found. The apparent completeness claim on
  `generateTargetedChains` is narrower than an audit oracle because the source
  defines objective-filtered output; the ticket must not promote it to exhaustive
  immediate-win absence.
- `human-replay.js#replay` and `benchmark-replay.js#replayRecording` were
  inspected; both replay human/candidate recordings, not schema-2 bot sessions.
- `findTopChains` was inspected; its uncapped DFS and coarse deduplication make it
  unsuitable as the required bounded transition-complete oracle without a new
  audit seam.

### Uncovered remainder

The seven-minute bound did not inventory every historical protocol or every
level object, and it did not design the missing verifier/search API. Exact
panel/seed/threshold/cost choices remain deliberately unresolved for owner
acceptance and protocol registration. No runtime behavior was sampled.

## Verification

Verdict: **PASS for the bounded source-grounding question; no Step 3 empirical
result.** Result identity is this canonical ticket at source base `91337e5` and
administrative root `0a71c27`. Verification was read-only source/test
inspection; pre-existing tests are cited as evidence but were not rerun because
the dispatch forbids games, replays, benchmarks, and new measurements.

- **I1 oracle:** evidence; **class:** pre-existing. **Evidence:**
  `solver/record-session.js:69-159,196` and
  `solver/tests/botVision.test.js:47-138` cover trajectory identity and
  transition reconstruction; `solver/engine.js:1-11,30-65,68-118,121-185,192-260,513-532`
  covers RNG/state/legality/transition/exhaustive-coarse-chain exports;
  `solver/bot.js:167-177,231-285,381-448,451-508,514-569` covers defaults,
  offered-candidate analysis and control-flow reasons;
  `solver/targeted-chain-generator.js:9-27,101-225,228-233` plus
  `solver/tests/targetedChainGenerator.test.js:71-150` covers exact/action
  identities and honest caps/completion; `solver/benchmark-replay.js:48-57,126-195`,
  `solver/tests/policyBenchmark.test.js:218-289,337-353`, and
  `solver/tests/mirrors-game.test.js:197-217,290-318` cover replay validity,
  terminal precedence, RNG isolation, and bomb semantics. **Covers:** exact
  exported trajectory/replay/transition/search interfaces, chooser/RNG,
  completion/cap meaning, bomb order, offered-chain access, and named missing
  capabilities. **Outcome:** PASS.
- **I2 oracle:** evidence; **class:** pre-existing. **Evidence:**
  `docs/evaluation/POLICY-EVAL-0001/contract.md:21-31,110-120` and
  `docs/evaluation/POLICY-EVAL-0001/inputs.json:7-26,90-104` cover reference,
  subject/topology fields, RNG, and deferred protocol choices;
  `experiments/SEEDS.md:1-44` covers burned-range registration;
  `experiments/README.md:7-17,19-64,91-92` covers preregistration and artifact
  lineage; `experiments/RESULT-0026/protocol.md:52-95,111-154,180-219` is the
  closest bounded-run/custody/cost exemplar; and
  `docs/evaluation/POLICY-EVAL-0001/measurement-acceptance.md:9-28,62-64`
  establishes the accepted predecessor and ready-unexecuted Step 3 boundary.
  **Covers:** seed inventory/registration, topology inputs, protocol exemplar,
  custody constraints, proposed minimal shape, and explicit owner-only gaps.
  **Outcome:** PASS.

Freshness check: `git diff --name-only 91337e5..0a71c27` listed only this ticket,
so the cited source interfaces at current root equal the named source base.

## Feedback

Root join: accepted the bounded source findings, correct child and in-bound
released lease, only authorized ticket writes, unchanged sourcebase91337e5.
I1/I2 normalized verdict fields: oracle_class=evidence; provenance=pre-existing;
oracle=cited primary-source/interface and test inspection; verdict=PASS.
The child's label "owner-only" for every deferred protocol parameter is not
adopted: source says protocol choices remain open, not that all require owner
selection. Root chooses a bounded diagnostic first; exact sampling/budgets
will be explicit technical protocol choices after instrument qualification.
No source finding is empirical audit evidence or proof of a bot defect.

## Risks

Read-only source, no new games, benchmark, audit collection, protocol or target
edits. Only this canonical ROOT ticket result sections may be written. Root
read-only during lease. No delegation. You are not alone; preserve other work.
Reply_to=/root. Explicitly release lease. Root owns terminal status. Monitor30s.
