# POLICY-EVAL-0001 measurement check cards

These are local instrument checks. They are not Challenge Receipts and do not
qualify a generalized policy claim.

### Frozen package and subject identity · HARD

- **Protects:** Step 2 reads the accepted contract, manifest, files, seeds, and subject-defining fields by identity.
- **Where:** `solver/benchmark-inputs.js`; `node --test solver/tests/policyBenchmark.test.js`.
- **Level:** file and record — a semantically wrong value whose containing file still has the accepted hash requires a new accepted contract version, not detection here.
- **Kind:** shape and value; acceptance review owns whether the frozen values are true and sufficient.
- **Scope:** the two POLICY-EVAL-0001 frozen files, manifest-listed source and attempt paths, uint32 seeds, and subject fields `gridW`, `gridH`, `minChain`, `tileScale`, `target`, `moves`, and blocker coordinates/type/duration/timer.
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
