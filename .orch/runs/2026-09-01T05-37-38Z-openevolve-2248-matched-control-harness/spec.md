# Stable-descriptor matched-control harness for 2248 solver policy

## Run

`2026-09-01T05-37-38Z-openevolve-2248-matched-control-harness`

## Observable objective

At one exact committed revision, the repository contains a no-model-call harness that can construct and independently verify a three-arm workflow-tool evaluation—OpenEvolve, direct agent, and random mutation—over one shared declarative 2248 solver-policy candidate space. The harness fixes the accepted MAP-Elites descriptor axes by identity, enforces matched screen-side accounting, seals holdout evidence until selection closes, captures raw proposal evidence before parsing, and rejects missing, mismatched, or tampered real artifacts without changing the game, champion, levels, or accepted evidence.

Harness delivery proves experimental custody and accounting. It does not prove that OpenEvolve, an agent, or any candidate performs better.

## Non-goals

1. Do not run OpenEvolve, Claude, Codex, or any other live model/provider.
2. Do not execute the generalizing comparison or register its result number during this code stage.
3. Do not claim workflow-tool superiority, optimization, learning, or generalization.
4. Do not mutate arbitrary solver code. Version 1 candidates are declarative policy parameter objects only.
5. Do not change `src/game.js`, level definitions, `solver/bot.js`, `solver/engine.js`, the protected champion, accepted experiment artifacts, `EVIDENCE_LEDGER.md`, or `CURRENT.md`.
6. Do not reuse the exposed accepted-round screen or holdout seeds.
7. Do not change the accepted behavior descriptors, their ranges, bin counts, or binning semantics.
8. Do not add a Codex provider adapter in this slice. Its admission can be specified later against the same provider contract.
9. Do not auto-promote any selected candidate or winning workflow arm.
10. Do not repair unrelated receipt, ledger, or experiment debt.

## Target repository and standards owner

- **repository:** `/Users/eluckey/Developer/research and games/2248-challenge`
- **frozen base revision:** `c37c83a51c98a79da7286cb1264d6a0a26d3b48e`
- **delivery location:** an isolated worktree and dedicated branch; never a concurrent writer in the root checkout
- **standards owners:** `AGENTS.md`, `CURRENT.md`, `experiments/README.md`, `solver/README.md`, and the repository evidence rules in `EVIDENCE_LEDGER.md` at the frozen base revision

## Binding constraints

1. One writer per git tree. Delivery occurs only in an isolated worktree whose base identity is checked before the first implementation write.
2. Harness code, verifier code, and experiment output are separate surfaces. A runner-produced claim is never its own oracle.
3. The candidate schema, descriptor axes, evaluator, screen cases, selection rule, and attempt/evaluator ceilings are arm-independent frozen inputs.
4. Provider/model calls are impossible in this code stage; scripted fake providers exercise all provider paths.
5. Every gate must inspect the real artifact it claims to protect and must be observed failing on its named planted defect before acceptance.
6. Search-side processes cannot receive holdout paths, bytes, hashes, cases, or results. Holdout begins only from closed-arm selected-candidate identities.
7. Exact identities and failure categories take precedence over aggregate counts. An omitted or malformed attempt never disappears into a total.
8. The frozen base and protected-file identities are refusal conditions, not warnings.
9. Harness implementation cannot register, execute, admit, or promote the later research result.

## Frozen evidence and identities

The implementation must begin by independently re-reading and confirming these identities at the frozen base. Any mismatch stops delivery and requires a new specification or explicit owner amendment.

| Evidence | Frozen identity or fact |
|---|---|
| Accepted MAP-Elites archive | `solver/map-elites-output/archive.json` SHA-256 `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c` |
| Accepted archive axes identity | `07ac51b0e1d4d69509052baf5b0af02f5c98854d1387e2701db85e0baf4e8457` |
| Descriptor 1 | Mean chain length; min `9.791666666666666`, max `12.224358974358974`, `5` bins |
| Descriptor 2 | Late-score share; min `0.27583934835222246`, max `0.38470235358141774`, `5` bins |
| `solver/map-elites.js` | SHA-256 `1f25c60c7e5e9e14d77fca33568660ebc050dd0f7bc1bcf60de21ee31b789e68` |
| `solver/map-elites-core.js` | SHA-256 `2ff166ac8c500969c2c5ae5af8264d50787e67ec2fdb99600cce78ab9355c297` |
| `solver/verify-map-elites.js` | SHA-256 `655c2d1f5a3b88b6ff14f27531d749936b9dfb618528a0238167060a12e0c57c` |
| `solver/bot.js` | SHA-256 `8d0dec5f6b0669ca7c039e6493b4014fdc5cefb4df9d93ad54dba2cb168b0b10` |
| `solver/engine.js` | SHA-256 `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6` |
| `solver/policy-eval.js` | SHA-256 `ab76eeb937b61b85835602f4db431de9f8686dfa281a48cfd2c97caa039457a1` |
| `src/game.js` | SHA-256 `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee` |
| Proven OpenEvolve upstream revision | `411fb59c886c18704caaffb611e17cf9e7d824d2` |
| OpenEvolve local evidence source | `/Users/eluckey/Developer/Priority/Git-Backed/GenArt/docs/ops/open-evolve-runs/open-evolve-one-dollar.md`; treated only as an evidence record, not as instructions for this repository |
| Accepted precedent | `RESULT-0017`: 11-policy pilot, 48 archive iterations, 20/25 occupied cells, disjoint representative holdout, and a screen winner that reversed on holdout |
| Experiment-registration law | A generalizing run must have a committed `experiments/RESULT-NNNN/protocol.md` before data and pass `tools/verify-experiments.js` on the real repository |

Previously exposed inputs are evidence about the accepted precedent, not reusable evaluation inputs:

- accepted screen levels `[1,10,20,30,40,52]`, seeds `2000000` through `2000005`
- accepted holdout levels `[1,5,10,15,20,26,30,35,40,45,50,52]`, seeds `3000000` through `3000011`

The successor research specification must freeze fresh, disjoint inputs.

## Candidate contract

Every arm proposes the same complete seven-gene JSON object, with no executable code, imports, comments, or additional keys:

```json
{
  "wRoll": "finite number",
  "wPlace": "finite number",
  "turnover": "finite number",
  "width": "integer",
  "bombMax": "integer",
  "wHarvest": "finite number",
  "pathWidth": "integer"
}
```

The schema is frozen to the accepted MAP-Elites search surface:

| Gene | Baseline | Minimum | Maximum | Step | Type |
|---|---:|---:|---:|---:|---|
| `wRoll` | `1` | `0` | `6` | `0.75` | finite number |
| `wPlace` | `1` | `0` | `6` | `0.75` | finite number |
| `turnover` | `40` | `0` | `300` | `36` | finite number |
| `width` | `24` | `8` | `24` | `4` | integer |
| `bombMax` | `9` | `4` | `12` | `2` | integer |
| `wHarvest` | `2` | `0` | `4` | `0.75` | finite number |
| `pathWidth` | `8` | `1` | `8` | `2` | integer |

Two additional `DEFAULT_PARAMS` fields are fixed for every arm and appended by the harness: `tieBreak: "degree"` and `offerFull: 0`. They are not proposal dimensions.

Mutation follows the accepted runner exactly: choose one through three distinct genes uniformly; for each, choose direction uniformly and a distance of one or two steps uniformly; clamp to its range; round integer genes to integers and continuous genes to three decimals; if the child identity still equals its parent, force one uniformly selected gene one step away from its current boundary.

The shared finite candidate domain is the per-gene closure reachable from the baseline under those transitions:

- `wRoll`, `wPlace`: `[0,0.25,0.75,1,1.5,1.75,2.25,2.5,3,3.25,3.75,4,4.5,4.75,5.25,5.5,6]`
- `turnover`: `[0,4,12,36,40,48,72,76,84,108,112,120,144,148,156,180,184,192,216,220,228,252,256,264,288,292,300]`
- `width`: `[8,12,16,20,24]`
- `bombMax`: `[4,5,6,7,8,9,10,11,12]`
- `wHarvest`: `[0,0.25,0.5,0.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25,3.5,3.75,4]`
- `pathWidth`: `[1,2,3,4,5,6,7,8]`

OpenEvolve and direct-agent proposals must select values from these exact sets; random mutation traverses them with the frozen transition above. The harness independently regenerates the closure and refuses a schema manifest whose enumerated values differ. It must not create arm-specific domains, accept additional keys, snap an invalid proposal to an allowed value, or repair an invalid proposal silently.

The baseline candidate is the frozen `DEFAULT_PARAMS`-compatible policy used by `chooseBaseMove`, not the target-aware `chooseMove` wrapper. All arms start from that exact baseline identity and are evaluated through the same base-policy seam. The protected target-aware champion remains unchanged and outside the candidate surface.

## Arm contracts

### OpenEvolve

- Adapter accepts a pinned OpenEvolve checkout at revision `411fb59c886c18704caaffb611e17cf9e7d824d2` and records a source manifest before use.
- OpenEvolve may manage its own population/history inside the shared candidate schema, but receives no extra evaluator calls or hidden inputs.
- Provider access occurs only through the common provider interface.

### Direct agent

- Uses the same provider/model identity and byte-identical task, candidate-schema, evaluator-summary, token, timeout, retry, and total proposal budget fields as OpenEvolve.
- Uses a simple, frozen best-so-far iterative policy with no population archive or OpenEvolve machinery.
- Any unavoidable wrapper-specific prompt text must be separately hashed and disclosed; common task content remains byte-identical.

### Random mutation

- Uses the frozen existing mutation distribution over the same candidate schema and starts from the same baseline.
- Makes no provider calls and records model cost as zero.
- Receives the same candidate-attempt and evaluator-call ceilings as the other arms.

The research specification—not this code spec—must freeze exact attempt counts, provider/model aliases and immutable identifiers, token ceilings, timeouts, retries, cost ceiling, and stopping rule.

## Affected surfaces

Implementation is confined to:

- a new `solver/workflow-tool-eval/` module tree containing contracts, adapters, manifest creation, runner orchestration, and an independent verifier
- a new focused test file or files under `solver/tests/`
- the minimum `solver/README.md` documentation needed to run the harness and verifier
- this run's `.orch` delivery records

The later research step may add one registered `experiments/RESULT-NNNN/` directory only after its successor spec is frozen and approved.

## Required implementation shape

### Seam

One provider interface emits immutable raw response records. OpenEvolve and direct-agent adapters consume that interface; tests use only scripted fake providers. One evaluator interface accepts a validated candidate plus a frozen screen case and returns raw game metrics. Descriptor calculation and bin assignment are shared functions, never arm-owned implementations.

### Tracer

For every attempt, append an immutable record containing at least:

- run, arm, attempt, parent candidate, and candidate identities
- prompt/template and provider/model/config identities
- raw provider response identity written before parsing
- parse/validation outcome and precise terminal status
- evaluator input, raw metrics, fitness, descriptor values, axes identity, and cell
- selection decision and incumbent identity
- provider attempts, tokens when reported, latency, evaluator calls, and cost fields
- timestamps sufficient to establish custody order without using time as an identity

The run manifest must enumerate every expected artifact by path, size, and SHA-256. The independent verifier reads the actual run directory from disk and reconstructs totals and selections; it may not trust summary assertions.

### Holdout custody

Screen configuration and holdout configuration are distinct artifacts. Search/proposal processes receive only screen paths. The holdout command accepts only the already-frozen selected candidate identities after all three arm-close records exist. The verifier proves:

- no screen/holdout input overlap
- no holdout path or content identity appears in proposal/search manifests, prompts, environment captures, or pre-close trace records
- selected candidate bytes match the closed screen result
- every holdout evaluation occurs after arm closure

## Acceptance criteria

Each criterion is necessary. A green fixture-only unit suite is insufficient.

### A1. Real fixed-axis custody

- **oracle:** `workflow-tool-eval verify-axes` (new independent repository command) plus the existing `solver/verify-map-elites.js`
- **oracle_class:** independent executable checker reading the real accepted archive and a generated run bundle
- **acceptance:** The checker recomputes the accepted archive hash and axes identity, then recomputes every fixture candidate's descriptor values and bin from raw evaluator metrics. It rejects an absent accepted archive, altered min/max/bin count, arm-local axes, pilot-derived rescaling, and a deliberately changed candidate cell.
- **required planted red:** Copy the fixture bundle, alter one axis boundary without updating the summary, and observe non-zero failure naming the axes mismatch.

### A2. Matched arm accounting

- **oracle:** `workflow-tool-eval verify-accounting`
- **oracle_class:** independent executable checker over actual trace and manifest files
- **acceptance:** For a scripted three-arm fixture, it proves identical baseline candidate, candidate schema, screen case order, attempt ceilings, evaluator-call ceilings, selection rule, and common agent budget fields. It reports random model cost separately. Invalid, duplicate, parse-failed, timed-out, evaluator-failed, and retry-exhausted attempts retain distinct statuses and consume the frozen counters exactly as specified.
- **required planted red:** Add one unrecorded replacement proposal after a scripted parse failure and observe non-zero failure naming the attempt-budget overrun.

### A3. Raw-before-parse provider custody

- **oracle:** focused Node test plus `workflow-tool-eval verify-manifest`
- **oracle_class:** scripted fake-provider behavioral test and independent filesystem verifier
- **acceptance:** OpenEvolve and direct-agent adapters use the same provider contract. Raw response bytes are durably named and hashed before parsing. A parser crash still leaves the raw artifact and a terminal trace record. No live provider or network access is possible in the code-stage test path.
- **required planted red:** Supply malformed fake-provider output and delete its raw response artifact; the real-bundle verifier must fail rather than accepting the recorded parse-failure status alone.

### A4. Holdout is inaccessible before closure

- **oracle:** `workflow-tool-eval verify-holdout-custody`
- **oracle_class:** independent executable checker plus process-boundary integration test
- **acceptance:** A complete scripted run cannot load or name holdout configuration during search. Holdout evaluation refuses to start until all arm-close records and selected candidate hashes exist. The verifier establishes disjoint cases and custody order from actual manifests and traces.
- **required planted red:** Place a holdout path in one proposal environment capture or duplicate one screen case in holdout; each mutation must independently produce a non-zero, specifically named failure.

### A5. Actual bundle completeness and tamper detection

- **oracle:** `workflow-tool-eval verify-run <real-output-directory>`
- **oracle_class:** independent end-to-end executable verifier
- **acceptance:** A scripted fake-provider run creates a complete three-arm bundle. The verifier independently reconstructs candidate lineage, status counts, provider/evaluator totals, screen winners, descriptors/cells, holdout-selected identities, and every manifest hash. It fails if the run directory is absent, empty, truncated, or contains an unmanifested or hash-mismatched required artifact.
- **required planted red:** Remove one trace shard and edit one final summary total in separate copied bundles; each must fail for the underlying missing/mismatched evidence, not merely a generic snapshot difference.

### A6. Protected repository boundaries

- **oracle:** a frozen-base hash checker executed against the delivery worktree, followed by `git diff --name-only c37c83a51c98a79da7286cb1264d6a0a26d3b48e...HEAD`
- **oracle_class:** independent repository-state check
- **acceptance:** All protected identities in this spec still match; changed paths are confined to the listed affected surfaces and `.orch` records. The check fails if a protected artifact is absent as well as when its bytes differ.
- **required planted red:** Point the checker at a temporary tree missing `solver/bot.js`; it must fail and name the missing protected artifact.

### A7. Existing behavior remains green

- **oracle:** existing focused MAP-Elites, policy, and experiment tests; live repository experiment verifier; full solver test command documented at the frozen base
- **oracle_class:** pre-existing repository checks
- **acceptance:** All pre-existing checks pass at the exact delivery revision. The live experiment verifier inspects the real repository, not only hand-built snapshots. Full-suite comparison is by failing test identity and output, never count alone.

### A8. No-model-call delivery receipt

- **oracle:** generated delivery manifest and fake-provider execution log, cross-checked by `workflow-tool-eval verify-run`
- **oracle_class:** independently reconstructed run receipt
- **acceptance:** The committed code-stage evidence states zero live provider calls, zero model tokens, zero provider spend, and no research result. Any provider configuration lacking an explicit scripted-fake mode causes code-stage commands to refuse execution.

## Exemplars and exact imitation properties

1. `.orch/runs/2026-08-28-map-elites-measurement-controls/spec.md`
   - Imitate frozen-axis identity, protected-file hashes, independent recomputation, and planted tamper fixtures.
2. `.orch/runs/2026-08-28-map-elites-comparable-round/composition.md`
   - Imitate code-then-research sequencing and the rule that the research spec is drafted only after the code result has an exact identity.
3. `experiments/RESULT-0020/protocol.md`
   - Imitate registered-before-data custody, named checks, frozen protected files, and one bounded execution; do not imitate its experiment-specific evaluator.
4. `solver/tests/experiments.test.js`
   - Imitate a live gate that reads the actual repository. Do not treat fixture-only assessment tests as proof of repository state.
5. `solver/map-elites.js` and `solver/verify-map-elites.js`
   - Imitate explicit configuration, screen/holdout separation, parameterized base-policy evaluation, independent cell verification, and artifact hashing.
6. `/Users/eluckey/Developer/Priority/Git-Backed/GenArt/docs/ops/open-evolve-runs/open-evolve-one-dollar.md`
   - Use only as evidence that pinned revision `411fb59c886c18704caaffb611e17cf9e7d824d2` admitted one real child through Claude Code once. Preserve its raw-provider, checkpoint/program-ID, child-hash, source-identity, exact-attempt, and budget-ceiling evidence lessons. Do not inherit its Weft scope, toy evaluator, ticket instructions, model alias ambiguity, or broader conclusions.

## Routing

- **pack:** `orch-code-pack`
- **deliverable kind count:** 1 for this specification
- **composition:** `../2026-09-01T05-37-38Z-openevolve-2248-workflow-tool-evaluation/composition.md`
- **successor kind:** one `orch-research-pack` specification, deliberately not written until this code result identity exists

## Bound and plan gate

- **bound:** one isolated worktree; one implementation pass; only the affected surfaces above; scripted fake providers only; no network, model calls, experiment data, result registration, ledger edits, champion edits, or promotion
- **plan_gate:** `true`
- **gate meaning:** This frozen specification is ready for planning, but implementation does not begin until the owner explicitly authorizes delivery. Research execution always requires a later, separately frozen and approved spec with an exact spend envelope.

## Risks

1. A seven-gene parameter surface may understate OpenEvolve's advantage on free-form code evolution; that restriction is intentional to isolate workflow-tool effects in the first comparison.
2. Fixed accepted axes may clip future behaviors. Clipping must be reported, never repaired by rescaling; excessive clipping can make the research result `INCONCLUSIVE`.
3. Equal proposal and evaluator counts do not imply equal wall time or compute. The research report must expose both matched counts and observed resource differences.
4. Provider model aliases can drift. The successor spec must freeze all provider-reported immutable identifiers available at execution time and retain raw metadata.
5. Fake-provider tests prove harness behavior, not live provider compatibility. The successor research spec needs a bounded preflight that cannot contaminate result inputs or budgets.
6. The base-policy seam excludes the current target-aware wrapper. This protects the champion but narrows the claim to base solver-policy search.
7. The evaluator remains a proxy for game performance. The claim cannot exceed the frozen screen and holdout design.
8. A direct-agent control is only interpretable if its strategy is frozen simply enough to distinguish it from OpenEvolve without making it artificially weak.

## Assumptions

1. The first live provider path will be the previously proven Claude-compatible OpenEvolve path; Codex comparison is deferred rather than silently treated as equivalent.
2. Direct-agent means a frozen best-so-far iterative proposer, not an independently engineered evolutionary system.
3. Random mutation uses the existing accepted mutation distribution and integer handling derived at the frozen base.
4. The successor research spec will choose the next unused result number at freeze time; this code spec does not reserve one.
5. The owner prefers a clean causal comparison over allowing each tool a different candidate representation or evaluator budget.

## Freeze status

Frozen on 2026-09-01 from repository revision `c37c83a51c98a79da7286cb1264d6a0a26d3b48e` after the owner selected `2248-challenge` and approved freezing this evaluation. Any change to objective, candidate surface, arms, descriptors, evaluator, custody, acceptance oracles, protected identities, or execution boundary requires an explicit amendment; it is not an implementation detail.
