# Step 3 bounded immediate-win audit instrument

- run: 2026-09-06-policy-trajectory-instrument
- objective: A verified bot-session artifact can be checked for a missed legal immediate win without confusing incomplete search with absence.
- routing: pack=orch-code-pack
- target repository: /Users/eluckey/Developer/research and games/2248-challenge
- standards owner: AGENTS.md; docs/evaluation/POLICY-EVAL-0001/contract.md; experiments/README.md
- bound: 40 minutes for the implementation delivery; stop on uncovered acceptance, no automatic extra repair pass.
- plan_gate: false; owner requested beginning Step3, not a change to the four-step plan.
- non_goals: Step4, changing/tuning the champion, general diagnostic framework, new repository-wide gate, fresh audit sampling, population or promotion claims.

## Evidence and predecessor

Step2 accepted at91337e5. At this intake, all33hashes in its final envelope
matched live files before progress metadata updates. Its baseline JSON is
a79fe73494dbff59dc7bc8a822c558caf18f3ce0b194412f4e02cbf38b03889e;
contract3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f;
inputs1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb.
Reference game/engine/bot/author identities remain those in that envelope.
Primary source intake: ../../tickets/2026-09-06-policy-trajectory-intake/GROUND-001.md,
sourcebase91337e5. No audit measurement was collected to select this scope.

## Binding constraints

Follow pinned plan R1-R6 and Step3. Preserve game, engine, bot, recorder,
authoring/evaluation sources, frozen contract/input/Step2 substantive evidence,
recordings, play-sessions, candidate receipts, existing gates and generated views.
No PR, push, main merge, Atlas mutation or experiment run in this code delivery.
Dedicated single-writer worktree, apply_patch edits. No moving ordinary/human
recordings into the bot corpus. Qualification uses tiny constructed cases and
existing inspected fixtures only; no fresh audit/holdout sampling. Record four
known full-suite failures by exact identity, never remove or exempt them.

## Smallest implementation surface

New solver/trajectory-audit.js and solver/tests/trajectoryAudit.test.js, plus
docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md. Prefer one small module
composing exported engine, recorder, chooser-analysis, action-identity and
terminal functions. Do not refactor those modules or duplicate the game engine.
If the small module cannot satisfy the criteria, return that gap rather than
expand into a framework or change protected sources.

## Acceptance as runnable checks

Run node --test solver/tests/trajectoryAudit.test.js solver/tests/botVision.test.js
solver/tests/policyBenchmark.test.js; independently review changed seams;
run node tools/verify-experiments.js, git diff --check, and full solver test suite
at a clean fixed revision. Exact additional cases required below are frozen
before implementation; authored test bodies require independent final review.

1. A1 — Artifact replay: independently reconstruct a serialized schema-2 bot
   session from subject/seed and production chooseMove under the frozen RNG
   convention, not from its claimed spawn delta or analysis candidates alone.
   Verify source/subject/seed/params, every board/chain/refill/score and terminal.
   Positive control must read a real artifact file created through recordSession;
   a self-rehashed wrong spawn, chosen chain, score, final outcome, source identity
   or continuation after terminal must fail. Missing/invalid input is unresolved,
   never an empty valid session. Oracle: named artifact-file tests; deterministic.
2. A2 — Immediate-win search: a valid witness must pass full legality and the
   cloned merge/gravity/refill/tick transition with bomb-before-target terminal
   order. Search every legal action, or a demonstrated sound equivalence class;
   never infer absence from the objective-filtered candidate list or coarse
   endpoint/length/score deduplication. Return FOUND with replayed witness,
   NONE only on exhausted search, UNKNOWN on node/time/cap/fault without witness.
   FOUND proves existence only, not complete enumeration. Return nodes, elapsed,
   declared caps and completeness explicitly. Oracle: hand-enumerated small
   boards, distinct-action collision, bomb-invalid finish, move-B win, genuine
   no-win, zero/tiny node cap and deterministic injected-timeout tests; deterministic.
3. A3 — Consumer and attribution: no unverified session may enter audit output.
   Bind each inspected position to session identity and preceding moves; validate
   the witness from the same live RNG state reached by that prefix. Compare
   production choice and actual offered actions using sound action identity.
   Report generation, ranking, control-flow or unresolved only with trace support;
   do not force a cause where offered-pool/control-stage evidence is ambiguous.
   Oracle: end-to-end valid and corrupted artifact controls plus constructed
   attribution examples and a state/RNG non-mutation test; deterministic.
4. A4 — Limits: return all requested position dispositions, including UNKNOWN,
   with explicit denominators and no population/speedup/promotion verdict. Record
   search time separately from chooser/replay time; tests do not assert wall-clock
   performance benefits. Oracle: complete/capped/invalid output fixtures through
   the public consumer; deterministic.
5. A5 — Preservation and checks: exact allowed-path diff, protected hash match,
   experiment/diff gates PASS, no new full-suite failure identity. Preserve raw
   check outcomes and count at the final revision; no bookkeeping writes while
   live custody tests run. Oracle: commands above and fixed-source comparison;
   deterministic, pre-existing.
6. A6 — Independent qualification: fresh source/test review against A1-A5 and
   gate-check's nine questions, including actual good/bad artifact runs and
   declared blind spots. No result may rely only on producer-created assertions.
   Oracle: independent review plus retained negative-control outputs; judged.

A1-A4 test-body provenance is authored-here and independence rides A6's final
gate. The acceptance examples/commands are predeclared, not later fitted to code.

## Exemplars

At91337e5, solver/tests/botVision.test.js:81-138 supplies real session transition
reconstruction and production-choice parity; imitate those behavioral checks,
but independently regenerate refills rather than trust supplied spawn values.
solver/tests/targetedChainGenerator.test.js:71-89,106-150 supplies bounded-search
telemetry/control style; do NOT imitate objective filtering as absence proof.
Neither exemplar is an independent proof of the new instrument.

## Affected surfaces

The three new files above plus this delivery's .orch records only. Stage progress
metadata is caller-owned, outside worker scope. No global check-card index edit
or new enforcement hook is needed; the local card travels with its instrument.

## Risks and assumptions

Existing exported code cannot answer the exhaustive absence question safely;
this small adapter is justified by source inspection, not a demonstrated bot miss.
Clock limits require injectable deterministic control for tests. Shared engine
semantics remain a trust boundary, not independent proof of game correctness.
Numeric audit caps and sample are deferred until the qualified instrument exists;
that is a later research protocol, not permission to collect first and backfill.
