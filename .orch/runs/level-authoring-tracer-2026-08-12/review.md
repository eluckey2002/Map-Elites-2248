# Independent code-gate review: level-authoring tracer

- **artifact:** `dee3083965447be2de520e62b2872326f7d8214d`
- **baseline:** `8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6`
- **lens:** frozen acceptance AC1-AC6, code-pack correctness/contract/scope/shape, failure paths, and ordinary shipped-play independence from the authoring server
- **excluded by dispatch:** rendered browser evidence
- **review result:** **NEEDS CORRECTION**

The changed-file scope is exact and the named deterministic gates are green on an isolated run, but the revision does not yet meet the replayable-capture and receipt-verification contracts.

## Ranked findings

### 1. Major — Undo makes a candidate playthrough fail persistence and destroys replayability

**Violated criteria:** objective (persist a replayable human playthrough); AC4 (record each legal chain and submit one outcome); AC3's recording contract; binding requirement to preserve ordinary restart/level interaction while the arbitrary candidate uses the shared game path.

**Evidence inspected:**

- `src/game.js:475-484` appends a chain to `AuthoringCapture` as soon as each move executes.
- `src/game.js:811-835` saves only grid, score, moves, and best-chain state. It saves neither capture length nor seeded-RNG state.
- `src/game.js:837-869` restores the game state on Undo but does not roll back `authoringCapture.chains` or the custom session's RNG cursor.
- `src/game.js:230-243` submits every chain accumulated by the capture alongside the restored net `movesUsed` value.
- `solver/authoring-server.js:46-49` rejects any payload whose chain count differs from `movesUsed`.
- A read-only targeted probe exercised the actual `Game.prototype.undo`, then finished after a replacement move. It observed: `UNDO_CAPTURE_AFTER_RESTORE 2 chains_for 1 move; SERVER_REJECTED: chains must contain one ordered chain per move`.
- `solver/tests/customLevel.test.js:51-101` covers direct capture and duplicate terminal calls, but no Undo path.

**Impact:** Undo remains visibly enabled in candidate play. Any player who makes a move, undoes it, and later reaches a terminal state submits more chains than net moves, so the server returns 422 and no playthrough is persisted. Merely popping the capture would not fully repair replayability: the custom RNG stream has already consumed spawn draws and Undo does not restore that cursor, so replaying the retained chains from the declared seed can diverge from the recorded board.

### 2. Major — `verifyCandidate` accepts a self-identified receipt containing false fitting evidence

**Violated criteria:** AC1 (deterministic measured target plus a truthful self-identifying receipt with fitting measurements and target derivation); AC2 (tampered-receipt negative control); code-lens correctness on failure paths.

**Evidence inspected:**

- `solver/level-author.js:214-231` records fitting quantiles, target derivation, shape/candidate identities, and the holdout in the receipt.
- `solver/level-author.js:252-278` verifies the receipt content hash, candidate hash, source-shape identity, code identities, seed-range declarations, terminal totals, and a freshly rerun holdout. It never reruns the fitting seeds and never checks that:
  - fitting quantiles equal a fresh fitting measurement;
  - `targetDerivation.measuredMedian` equals the fitting median;
  - `roundedTarget` equals the candidate target and the declared rounding policy;
  - the declared tile scale equals the level-derived policy.
- `solver/tests/levelAuthor.test.js:90-128` alters a receipt without updating its identity and therefore tests only stale-hash rejection, not an internally false but newly self-identified receipt.
- A read-only targeted probe derived a valid fixture, changed its fitting median from `1000` to `999999`, recomputed `receiptIdentity` with the revision's exported `identity`, and called `verifyCandidate`. It returned: `ACCEPTED_FALSE_FITTING PASS 999999 1000`.

**Impact:** The verification command can print `PASS` for a receipt whose load-bearing fitting evidence is false. Because `receiptIdentity` is a content identity rather than a trusted signature, recomputing it after a content change is normal and cannot substitute for remeasurement/internal-consistency checks. The checked-in receipt reproduces today, but the public verifier does not enforce the receipt contract it advertises.

### 3. Moderate — Browser-side arbitrary-level validation treats an explicitly invalid tile scale as the default

**Violated criteria:** AC4's fail-closed arbitrary-candidate seam and public contract fidelity.

**Evidence inspected:**

- `src/game.js:161-180` calls `requirePlayableInteger(levelData.tileScale || 1, ...)`; `0`, `NaN`, and other falsy supplied values are replaced before validation.
- `src/game.js:183-210` and `src/game.js:694-723` use the same `tileScale || 1` fallback when creating/initializing the board.
- A read-only targeted probe called the exported validator with an otherwise valid level and `tileScale: 0`; it printed `ACCEPTED_TILE_SCALE_ZERO`.
- `solver/tests/customLevel.test.js:37-49` describes validation as fail-closed but tests only dimensions and blocker bounds.

**Impact:** An explicit invalid scale can pass the browser's public validator and silently play at scale 1. The checked-in server currently rejects scale 0 first, which limits the immediate path, but the exported arbitrary-level seam itself is not fail-closed and can conceal malformed candidate data.

## Criteria without findings

- **Exact scope:** The baseline diff changes only the twelve spec-authorized surfaces: `recordings/.gitkeep`, the three authoring modules/data paths, three new test files, `src/game.js`, and `src/index.html`. No historical ledger, handoff, solver engine, bot, or shipped level data changed.
- **Ordinary shipped gameplay independence:** Static inspection shows the `/api/candidates/...` fetch is entered only for a valid `candidate` plus `seed` query. The ordinary branch constructs `Game` without server access, `loadLevel` clears custom-session state, and shipped initialization/spawning receive `Math.random`. No server availability is required for normal `?level=N`, restart, next-level, or level-select paths.
- **Shipped data/regression:** `JSON.stringify(LEVELS)` hashes to `162fff8123052a8eb5a3584172115844d6ea4675657b6005e1120cdad80e7cff`; the curve verifier passed all seven checks; all 88 solver tests passed when rerun alone; `git diff --check` is clean.
- **Candidate measurement:** the checked-in store and receipt exactly match a fresh in-memory derivation from the checked-in shape; standalone verification reports 297 wins, 0 lockouts, 0 bomb explosions, and 300 total holdout runs.
- **Craft/idiom:** New Node modules use CommonJS, Node built-ins, explicit static call sites, and bounded one-concern modules. Authoring behavior in the browser is behind named `AuthoringCapture`, custom-session, and submission seams.

## Uncertainties and evidence limits

- Rendered browser behavior was expressly excluded from this review. No conclusion here covers visual label/board/status rendering or an actual pointer-driven terminal recording.
- The spec says the server accepts only "schema-valid playthrough JSON," but supplies no independent semantic replay schema. The server checks structural ranges/counts, not adjacency, value progression, points, score, or outcome consistency. I did not rank this separately because the frozen acceptance does not unambiguously require server-side replay validation; the Undo finding proves a failure even under the implementation's narrower schema.
- Git history shows three green-slice commits, but commit contents alone cannot prove the red-before-green chronology required by the TDD binding constraint.
- One full-suite run launched concurrently with other gate commands produced five localhost `EPERM` bind failures after the same focused tests had passed. The full suite then passed 88/88 when rerun alone, so this is treated as an execution-environment anomaly rather than a product finding; it was logged under the friction law.
- I did not execute the mutating `--write` CLI because the dispatch allows only this review file to be written. Instead, I invoked the same derivation in memory and byte-compared both serialized outputs with the checked-in files; both comparisons were `true`.

## Evidence inspected

- Governing inputs: frozen `spec.md`; `orch-critique`; code lens, oracle policy, and craft reference; repository `AGENTS.md`; `EVIDENCE_LEDGER.md`; `CURRENT.md`; `solver/README.md`; the linked authoring-loop design.
- Artifact identity/history: clean worktree at `dee3083965447be2de520e62b2872326f7d8214d`; all three commits and the complete `8e1e232..dee3083` name/status, stat, and content diff.
- Every changed file in full surrounding context, including the complete current `src/game.js` and `src/index.html`; the baseline hunks for both modified files; the imported `solver/engine.js`, `solver/bot.js`, `solver/sweep.js`, `solver/game-tester.js` policy/rounding seams, and existing level-jump tests.
- Deterministic checks:
  - focused AC tests: 22/22 pass;
  - candidate verify: `PASS`, 297/300 wins, 0 lockouts, 0 bombs;
  - fresh serialization comparison: candidate store `true`, receipt `true`;
  - `node solver/verify-loop.js`: seven checks pass, `RESULT: PASS`;
  - `node --test solver/tests/*.test.js`: 88/88 pass on isolated rerun;
  - frozen `LEVELS` hash matches;
  - `git diff --check` clean;
  - scoped changed-file list matches the authorized surfaces.
- Adversarial probes: signed false-fitting receipt accepted; explicit zero tile scale accepted; candidate Undo payload rejected because capture count no longer matches net moves.
