# POLICY-EVAL-0001 measurement check cards

These are local instrument checks. They are not Challenge Receipts and do not
qualify a generalized policy claim.

### Frozen package and subject identity · HARD

- **Protects:** Step 2 reads the accepted contract, manifest, files, seeds, and subject-defining fields by identity.
- **Where:** `solver/benchmark-inputs.js`; `node --test solver/tests/policyBenchmark.test.js`.
- **Level:** file and record — a semantically wrong value whose containing file still has the accepted hash requires a new accepted contract version, not detection here.
- **Kind:** shape and value; acceptance review owns whether the frozen values are true and sufficient.
- **Scope:** the two POLICY-EVAL-0001 frozen files, all three behavior-binding source hashes, exact exported `chooseMove` defaults, manifest-listed attempt paths, uint32 seeds, and subject fields `gridW`, `gridH`, `minChain`, `tileScale`, `target`, `moves`, and blocker coordinates/type/duration/timer.
- **Reads own output?:** no; it reads frozen repository inputs and actual subject files.
- **Sampling memory:** n/a; all manifest rows are checked, while later files are reported as extras rather than sampled.
- **Does NOT catch:** a bad definition accepted into contract v1; historical runtime identity absent from ordinary-play receipts; meaning changes that preserve every pinned byte; files outside the manifest except as named extras.
- **Crafted-bypass test:** `solver/tests/policyBenchmark.test.js`, `a real pinned file passes and a filesystem-mutated twin fails by hash`, plus invalid-seed and target-distinct subject cases.
- **Retires:** NO — the existing benchmark coverage check follows mutable directories and does not bind the accepted manifest or content hashes.
- **Enforcement:** HARD in the Step 2 focused test; promotion beyond local instrument status would require an independently reviewed admission boundary.
- **Decay:** focused tests re-run on every benchmark change; changing frozen identities requires a preserved successor contract version.
- **Shipped:** run `2026-09-05-policy-measurement-code`.

### Case-weighted comparison arithmetic · HARD

- **Protects:** repeated attempts cannot change case weight, reliability veto precedes gains, and speed uses the reference's fixed winning set.
- **Where:** `solver/benchmark-metrics.js`; `node --test solver/tests/policyBenchmark.test.js`.
- **Level:** case and attempt — dependence between selected cases is disclosed, not statistically corrected by this descriptive arithmetic.
- **Kind:** value; POLICY-EVAL-0001 owns the engineering meaning and future protocols own population inference.
- **Scope:** deterministic descriptive reliability, converted-win, move-speed, and score-diagnostic calculations specified by E01-E06, E08, E16, and E18; no uncertainty or promotion threshold.
- **Reads own output?:** no; tests use independently enumerated worked-example expectations.
- **Sampling memory:** n/a; the computation consumes every supplied case and attempt, while corpus completeness is a separate input check.
- **Does NOT catch:** biased panel selection; correlated cases; a wrong but internally consistent contract; policy runtime cost; statistical significance; generalized policy strength.
- **Crafted-bypass test:** `solver/tests/policyBenchmark.test.js`, `E06 weights attempts within a case before weighting cases` (expected `-1`, while attempt pooling gives `+0.5`).
- **Retires:** NO — no existing check implements the accepted case-then-attempt weighting and fixed-S ordering.
- **Enforcement:** HARD for exact Step 2 descriptive output only; never an experiment-admission or promotion gate.
- **Decay:** every benchmark test run replays all fixed arithmetic examples; contract version changes require a new card or explicit update.
- **Shipped:** run `2026-09-05-policy-measurement-code`.

### Receipt-bound and current-subject resolution · HARD

- **Protects:** every frozen attempt resolves to the exact candidate content plus receipt, or to the pinned current shipped subject, before replay.
- **Where:** `solver/benchmark-inputs.js#buildCandidateIndex` and `resolveAttemptSource`; `node --test solver/tests/policyBenchmark.test.js`.
- **Level:** file and record — it validates content/receipt binding, not whether an old candidate's calibration remains current.
- **Kind:** shape and value; the evidence ledger and candidate verifier own the historical meaning and calibration standing.
- **Scope:** candidate stores and sibling receipts in `solver/` and `solver/candidates-archive/`, embedded receipts in `solver/generated-batch*.json`, pilot candidate/execution receipts, all 15 manifest attempts, and `src/game.js#LEVELS` for the three ordinary-play rows.
- **Reads own output?:** no; candidate and attempt artifacts predate this instrument.
- **Sampling memory:** n/a; every frozen attempt is resolved and later discovered recording files are an explicit supplement.
- **Does NOT catch:** full historical candidate qualification; whether ordinary play actually used today's shipped subject; source files outside named stores/batches/pilots; a semantically bad candidate whose content and receipt deliberately agree.
- **Crafted-bypass test:** `solver/tests/policyBenchmark.test.js`, `a forged candidate receipt key does not resolve content under that identity`.
- **Retires:** NO — `recording-replay.candidateIndex` trusts receipt keys without recomputing candidate content identity and cannot resolve ordinary current-subject play.
- **Enforcement:** HARD for admission into this descriptive benchmark; it does not regenerate or upgrade stale candidate receipts.
- **Decay:** the focused tests resolve all 15 real rows and fail on content/receipt drift; successor manifests require an updated inventory identity.
- **Shipped:** run `2026-09-05-policy-measurement-code`.

### Replay and paired runtime semantics · HARD

- **Protects:** recorded chains and live reference runs obey real transitions, terminal precedence, first crossing, separate RNG streams, and original-budget score horizons.
- **Where:** `solver/benchmark-replay.js`, `solver/human-benchmark.js#playBot`; `node --test solver/tests/policyBenchmark.test.js`.
- **Level:** move and terminal event — it does not infer a human's unrecorded intent or historical browser runtime.
- **Kind:** value; `engine.js`, `game.js`, and POLICY-EVAL-0001 own the rules and meaning.
- **Scope:** coordinate/value/uniqueness/adjacency/extension/minimum-chain checks; merge, score, gravity, refill, blocker tick; bomb-target-budget-no-legal precedence; uint32 seed; target-seeking and target-disabled reference modes through external `H <= B`.
- **Reads own output?:** no; replay reads real recordings and source transitions, while live arms are compared only through returned observations.
- **Sampling memory:** n/a; every admitted frozen attempt is replayed, and deterministic controls exercise each declared failure family.
- **Does NOT catch:** UI-only behavior absent from the headless transition; historical runtime identity for ordinary play; a policy-quality defect that still returns legal moves; generalized reliability beyond the fixed panel.
- **Crafted-bypass test:** `solver/tests/policyBenchmark.test.js`, altered-coordinate, false-win/premature-loss/post-terminal, missing-trace, seed/subject mismatch, bomb/target/B=H precedence, illegal choice, thrown-harness, RNG-consumption, and no-choice-with-legal-move cases.
- **Retires:** NO — the existing reusable replay remains unchanged; this stricter wrapper is scoped to the POLICY-EVAL-0001 instrument because the global helper is outside the ticket.
- **Enforcement:** HARD for Step 2 row admission and live reference classification only.
- **Decay:** focused tests use a real receipt-bound recording plus permanent bad twins; source hash drift blocks collection before replay.
- **Shipped:** run `2026-09-05-policy-measurement-code`.

### Frozen panel assembly and output · HARD

- **Protects:** the CLI accounts for every required path, separates provenance panels, and keeps later files outside the frozen denominator.
- **Where:** `solver/human-benchmark.js#collect` and `renderText`; `node --test solver/tests/humanBenchmark.test.js`.
- **Level:** file, attempt, and case — it reports initialized-grid collisions but does not turn selected cases into independent population samples.
- **Kind:** shape and value; POLICY-EVAL-0001 owns interpretation and a future registered protocol owns generalization.
- **Scope:** exactly 15 required manifest paths split 12 receipt-bound and 3 current-subject; admitted/duplicate/unresolved dispositions; files discovered under `recordings/`, `play-sessions/`, and `pilots/*/recordings/`; JSON and text v2 output; actual measurement-source hashes plus Git commit/tree state.
- **Reads own output?:** no; text rendering consumes the same returned object exposed by `collect`, and tests compare its literal classifications to that object.
- **Sampling memory:** n/a; all required and discovered recording paths in the named directories are inventoried, with extras excluded from the denominator.
- **Does NOT catch:** recording-shaped JSON outside the named directories; population-selection bias; historical runtime identity absent from ordinary play; semantic errors already frozen into the contract; an uncommitted run is identified as such rather than forbidden.
- **Crafted-bypass test:** `solver/tests/humanBenchmark.test.js`, `unexpected files are surfaced as extras without changing the frozen denominator`.
- **Retires:** the prior mutable-directory minimum-count benchmark check; the frozen inventory plus explicit supplement makes silent growth and shrinkage visible.
- **Enforcement:** HARD for deterministic Step 2 descriptive output; no generalized or promotion claim is admitted.
- **Decay:** focused tests and both CLI modes run at the result commit; successor inventories require a new frozen inputs identity.
- **Shipped:** run `2026-09-05-policy-measurement-code`.
