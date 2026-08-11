# Verification: repaired game evidence ledger

- **run:** `game-evidence-ledger-2026-08-11`
- **verifier:** `orch-verify`
- **date:** 2026-08-11
- **target policy:** read-only; no target was edited
- **result:** **PASS**
- **weakest oracle class:** `judged`
- **criterion coverage:** 6 of 6 required criteria have one fresh verdict entry; no executor-authored green was reused

## Fixed identities and covered dependencies

- **base B0:** Git `main` at `10a849d5336bdda89d2d3f5ed1f1ca87e536811d`; frozen spec `.orch/runs/game-evidence-ledger-2026-08-11/spec.md` SHA-256 `13cd3c094e3ea6d3209842f77c3f3b8d0a93a921dbe9a6dde59e944d64b8a807`.
- **result R1:** `EVIDENCE_LEDGER.md` SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`; `AGENTS.md` SHA-256 `e1d9fb8c9861cf24a52b8ed027275ec579718592e6bc70cb469b419e063fc2f5`; `HANDOFF.md` SHA-256 `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- **content policy D-content:** `oracles.md` SHA-256 `c173a34c11dd1b8cc51046b84d195a7b73163faec7e75e9f64c5c2d81df5b849`; `lens.md` SHA-256 `ea1b5ddf47721411d8b1480a3d80a94184d1d7ccfa7b83a4536d05825bd13fc7`; `craft.md` SHA-256 `9013ad8ba7fd822dcb9a4daadeb93bb388bf87127570bcc1ca9482300631d8cb`.
- **primary evidence D-evidence:** `src/game.js` SHA-256 `24226ce54b0f6c2f3da15139c156f5d6fc6a7398ae7fdf77aa5673e0e0200e41`; `solver/engine.js` `094d997a3028abc88f08b305c36fb4bf44d19292d58b228e9671f7219a25f16b`; `solver/exact-score.js` `edf48486735048e85ff8a72e9142e631643b20fbadb8c82c29b9bc94fbf886f3`; `solver/upper-bound.js` `a01279e6ac3599447c10824e03af6746d3dfe6a5dafabe3890e2e7a487f90f93`; focused tests `engine.test.js` `b22da48af6e16f253e551d110c8eb8f8465704f7d412ab0873159b1db146a9b8`, `exact-score.test.js` `f2880e9dba4096ca283d00d6580aee5a0d675234ca4756ef696fab5c3ab93d3b`, and `upper-bound.test.js` `eda6271760f0e578b131b44962bbf785be8ff61fbd360636691f6600a3c3292d`; certification worklog `95f72199d3985fb0afadc56d42ccc24e8ef5c357606744eca46aaf3eedc6ba2a`; move-one ticket `6bff711f2cebd97cd1b51ccb0ae9aaf8e538c36b801698e4dbbaef1d5ea1e323`; target-witness receipt `4e47c05ed42cfd978e85591913ae2062c10525d003ece73e6b2feeef0e12094e`; hinted-threshold receipt `5c076a3bbb8b58fc4d1f408b1b35b72f168194cb2101ad0bc977733cb8402b24`.
- **prior review context, not reused as a verdict:** independent review SHA-256 `491d4486ae8f787d8e5e55c6fdd0032144c8ed50195905e557ce69bc0ef064b2`; repair receipt SHA-256 `55bbb4d53c1f6bd645bbe958d31d09daf73ae575e0beaedde35be7f716971343`.

## Criterion verdicts

### AC1 — Required root ledger structure

- **verdict:** `PASS`
- **oracle:** deterministic read-only Node section/schema scanner over `EVIDENCE_LEDGER.md`, plus `wc -w EVIDENCE_LEDGER.md AGENTS.md`.
- **oracle_class:** `deterministic`
- **evidence:** The scanner found all 16 required sections: read-first orientation, current snapshot, authority/navigation, record types, status vocabulary, proof classes, evidence/freshness, append-only correction, entry template, all five registries, assembly cut log, and resume boundary. It found 15 records and 15 unique IDs. Word counts were 2,734 for the ledger and 94 for `AGENTS.md`, 2,828 total against the 3,500-word limit. In-memory wrong-result controls were rejected when the resume section was removed, a required field was renamed, or an ID was duplicated; the oracle can fail.
- **covers:** base `B0`; result `R1`; dependency `D-content` oracle policy.

### AC2 — Source-pinned initial facts and proof boundaries

- **verdict:** `PASS`
- **oracle:** claim-by-claim source resolution followed by these fresh named checks: `node --test solver/tests/engine.test.js solver/tests/exact-score.test.js solver/tests/upper-bound.test.js`; `node solver/target-witness-search/verify.js solver/target-witness-search/frozen-run.json`; `node solver/hinted-cp-sat/verify-result.js solver/hinted-cp-sat/frozen-run.json`; `node solver/upper-bound.js`; and the exact `node -e '...'` command embedded in `RESULT-0003`.
- **oracle_class:** `evidence`
- **evidence:** All 12 unique cited local source paths resolved. The focused suite returned 50 passed, 0 failed and includes a deliberately lowered-bound negative control. Source-symbol inspection resolved Level 26's 5x8, 32-move, minimum-chain-4, target-13,000 configuration and the shipped legality, scoring, merge, gravity, and spawn implementations. The target receipt verifier returned `PASS`, input identity `edc6889c...`, score 12,336, 32 moves, cursor 520, `targetReached: false`, explicitly a replayed lower bound only. The hinted receipt verifier returned `PASS`, with 12,336 `SAT` and 12,400/12,600/12,800/13,000 all `UNKNOWN`, explicitly non-decisive. `node solver/upper-bound.js` returned `complete: true`, score 326,390, `targetComparison: "non-decisive"`, and the same frozen input identity. The exact embedded `RESULT-0003` command returned `{"actions":1868975,"maxScore":430,"maximizers":[{"length":28,"sum":86},{"length":27,"sum":86},{"length":28,"sum":86}]}`. The receipt hashes matched the values cited by the ledger. Hypotheses remain provisional/hypothesis, questions remain open/unresolved, and the continuation formulation is not represented as an owner decision.
- **covers:** base `B0`; result `R1`; all identities in `D-evidence`.

### AC3 — Stable record schema and append-only correction semantics

- **verdict:** `PASS`
- **oracle:** deterministic ID/schema/enum scan, followed by a fresh content-lens judgment rendered from the frozen spec under `lens.md` and `craft.md`.
- **oracle_class:** `judged`
- **evidence:** The deterministic scan found 15 records, 15 unique `TYPE-NNNN` IDs, no duplicate or type/ID mismatch, no invalid type/status/proof-class value, and no missing required field. Every record contains type, status, scope, statement or question, evidence, proof class, `as_of`, `reverify`, `updated`, `supersedes`, and `superseded_by`. Negative controls with one renamed `updated` field and one duplicated ID were rejected. Fresh judgment found the schema understandable and consistently applied; the four-step correction protocol requires a new correction ID, reciprocal supersession links, retained historical statement/evidence/dates, and snapshot update. `DECISION-0002` is absent, its proposed method is visibly provisional `HYPOTHESIS-0002`, and the remaining decision uses third-person project voice. No content-lens finding remains for this criterion.
- **covers:** base `B0`; result `R1`; dependencies `D-content` and the frozen spec in `B0`.

### AC4 — Discovery instructions and historical handoff routing

- **verdict:** `PASS`
- **oracle:** exact-term and local-link scan of `AGENTS.md` and the `HANDOFF.md` banner; file existence checks; `git diff -- HANDOFF.md`; `git show HEAD:HANDOFF.md | shasum -a 256`; `tail -n +3 HANDOFF.md | shasum -a 256`; banner word count.
- **oracle_class:** `deterministic`
- **evidence:** Both relative `EVIDENCE_LEDGER.md` links resolve. `AGENTS.md` exactly requires ledger-first substantive reasoning, source-pinned updates, proof-class preservation, and append-only correction. The 38-word banner identifies the preserved document as the historical snapshot stopped August 8, 2026 and routes current authority to the ledger. The scoped diff is exactly two inserted lines. The `HEAD` handoff body and current body below the banner both hash to `7c3e808b804a5ee6c4950e5d1670965f465279a131044c73cdd6b2478d866d00`. A nonexistent-link negative control was rejected.
- **covers:** base `B0`; result `R1`; historical body identity `7c3e808b804a5ee6c4950e5d1670965f465279a131044c73cdd6b2478d866d00`.

### AC5 — Proof-class separation and resumable skim layer

- **verdict:** `PASS`
- **oracle:** fresh `orch-verify` content-lens judgment against the frozen audience, voice, structure, claim-support, length, and craft requirements; no prior judged green reused.
- **oracle_class:** `judged`
- **evidence:** Voice is precise, calm, compact, evidence-first, and candid about uncertainty. Registry records use third-person project voice; direct imperatives occur in reader/update/continuation instructions. Structure follows one resume-oriented arc: read-first promise, numerical current boundary, authority/vocabulary, update protocol/template, separated registries, cut log, and final resume boundary. The Current snapshot's first sentence states 12,336 as a replayed lower bound, 326,390 as a non-decisive proven upper bound, and both 13,000 reachability and the exact maximum as unknown. The final Resume boundary pays that opening by naming admissible closure evidence and rejecting heuristic misses, terminal boards, timeouts, and `UNKNOWN` as decisive evidence. Facts, results, the owner decision, hypotheses, questions, and superseded/stale vocabulary are separated by registry and type. The 2,828-word documents and 38-word banner stay within budget without dropping required coverage. Resolved citations and the fresh AC2 checks support sampled and load-bearing claims. A new agent can act from the snapshot, record protocol, and final boundary without prior-session knowledge. No fresh lens finding remains.
- **covers:** base `B0`; result `R1`; dependencies `D-content` and `D-evidence`.

### AC6 — Authorized documentation-only scope

- **verdict:** `PASS`
- **oracle:** `git status --short --branch`; `git diff --check -- EVIDENCE_LEDGER.md AGENTS.md HANDOFF.md`; scoped `git diff -- HANDOFF.md`; current target hashes; frozen baseline/status comparison from the spec and run intake; historical-body byte comparison.
- **oracle_class:** `deterministic`
- **evidence:** `git diff --check` exited 0. Scoped target state is `M HANDOFF.md`, `?? AGENTS.md`, and `?? EVIDENCE_LEDGER.md`; the handoff diff is only the authority banner, and its historical body is byte-identical to `HEAD`. The result hashes match `R1`; `AGENTS.md` and `HANDOFF.md` retain their pre-repair identities while only the repaired ledger identity changed. Current status still shows the frozen intake's pre-existing `solver/README.md`, solver certification/search/test artifacts, `.codex/`, and Level 26 ticket/run artifacts outside delivery scope; no target diff reaches `src/`, `solver/`, or the protected Level 26 ticket/run evidence. This verifies the content delivery's three authorized surfaces while preserving the recorded dirty-worktree boundary.
- **covers:** base `B0`; result `R1`; frozen intake/status boundary in the spec and `.orch/runs/game-evidence-ledger-2026-08-11/worklog.md`; historical body identity `7c3e808b804a5ee6c4950e5d1670965f465279a131044c73cdd6b2478d866d00`.

## Overall verdict

**PASS.** All six required acceptance criteria pass at fixed result `R1`. The result contains deterministic, evidence, and fresh judged verdicts; the overall weakest oracle class is **`judged`**. No acceptance criterion is skipped, inferred from silence, or upgraded from `UNVERIFIED`.
